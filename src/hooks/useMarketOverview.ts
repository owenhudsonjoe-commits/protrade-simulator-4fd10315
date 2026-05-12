import { useEffect, useRef, useState } from 'react';
import { TRADING_PAIRS, TradingAsset } from './useForexFeed';

export interface MarketRow {
  asset: TradingAsset;
  price: number;
  changePercent: number;
  sparkline: number[];
}

const HISTORY_POINTS = 20;

const seededRandom = (seed: number) => {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
};
const seedFromSymbol = (sym: string): number => {
  let h = 0;
  for (let i = 0; i < sym.length; i++) h = (h * 31 + sym.charCodeAt(i)) >>> 0;
  return h;
};

const buildSparkline = (asset: TradingAsset, currentPrice: number): number[] => {
  const rand = seededRandom(seedFromSymbol(asset.symbol) ^ 0xdeadbeef);
  const points: number[] = [];
  let p = asset.basePrice;
  for (let i = 0; i < HISTORY_POINTS - 1; i++) {
    const noise = (rand() - 0.5) * 2 * asset.volatility * 80 * p;
    p = Math.max(p + noise, asset.basePrice * 0.5);
    points.push(p);
  }
  points.push(currentPrice);
  return points;
};

const gaussLive = () => {
  const u = Math.max(Math.random(), 1e-9), v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

interface SymbolState {
  price: number;
  dayOpen: number;
  sparkline: number[];
}

const symbolStates = new Map<string, SymbolState>();

const initSymbol = (asset: TradingAsset): SymbolState => {
  const existing = symbolStates.get(asset.symbol);
  if (existing) return existing;
  const spark = buildSparkline(asset, asset.basePrice);
  const state: SymbolState = {
    price: asset.basePrice,
    dayOpen: asset.basePrice * (1 + (Math.random() - 0.5) * 0.004),
    sparkline: spark,
  };
  symbolStates.set(asset.symbol, state);
  return state;
};

TRADING_PAIRS.forEach(initSymbol);

export const useMarketOverview = () => {
  const [rows, setRows] = useState<MarketRow[]>(() =>
    TRADING_PAIRS.map((asset) => {
      const s = symbolStates.get(asset.symbol)!;
      return {
        asset,
        price: s.price,
        changePercent: ((s.price - s.dayOpen) / s.dayOpen) * 100,
        sparkline: s.sparkline,
      };
    })
  );

  const rafRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(performance.now());
  const sparkTickRef = useRef<number>(0);

  useEffect(() => {
    const tick = (now: number) => {
      rafRef.current = requestAnimationFrame(tick);
      const dt = (now - lastUpdateRef.current) / 1000;
      if (dt < 0.2) return;
      lastUpdateRef.current = now;
      sparkTickRef.current++;

      TRADING_PAIRS.forEach((asset) => {
        const s = symbolStates.get(asset.symbol)!;
        const noise = gaussLive() * asset.volatility * 2.5 * s.price * Math.sqrt(dt);
        const meanPull = (asset.basePrice - s.price) * 0.0005;
        s.price = Math.max(s.price + noise + meanPull, asset.basePrice * 0.5);
        if (sparkTickRef.current % 3 === 0) {
          s.sparkline = [...s.sparkline.slice(1), s.price];
        }
      });

      setRows(
        TRADING_PAIRS.map((asset) => {
          const s = symbolStates.get(asset.symbol)!;
          return {
            asset,
            price: s.price,
            changePercent: ((s.price - s.dayOpen) / s.dayOpen) * 100,
            sparkline: s.sparkline,
          };
        })
      );
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return rows;
};
