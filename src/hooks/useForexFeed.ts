import { useEffect, useRef, useState, useCallback } from 'react';

export interface MarketTicker {
  symbol: string;
  price: number;
  change24h: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
}

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type AssetCategory = 'commodity' | 'forex' | 'index';

export interface TradingAsset {
  symbol: string;        // e.g. "XAUUSD"
  name: string;          // e.g. "Gold OTC"
  display: string;       // e.g. "XAU/USD"
  icon: string;          // emoji / short
  decimals: number;      // price formatting
  basePrice: number;     // realistic seed price
  volatility: number;    // per-tick % volatility (e.g. 0.0004 = 0.04%)
  payout: number;        // e.g. 93
  category: AssetCategory;
}

// Realistic seed prices (April 2026 reference). Slight drift simulated client-side.
// volatility = relative std-dev per second (e.g. 0.00012 = 0.012%/s). Lower => calmer chart.
export const TRADING_PAIRS: TradingAsset[] = [
  { symbol: 'XAUUSD',   name: 'Gold OTC',              display: 'XAU/USD',     icon: '🥇', decimals: 2, basePrice: 2385.40, volatility: 0.00018, payout: 93, category: 'commodity' },
  { symbol: 'USDJPY',   name: 'USD/JPY OTC',           display: 'USD/JPY',     icon: '🇺🇸', decimals: 3, basePrice: 154.215, volatility: 0.00012, payout: 93, category: 'forex' },
  { symbol: 'AUDUSD',   name: 'AUD/USD OTC',           display: 'AUD/USD',     icon: '🇦🇺', decimals: 5, basePrice: 0.65420, volatility: 0.00012, payout: 91, category: 'forex' },
  { symbol: 'EURUSD',   name: 'EUR/USD OTC',           display: 'EUR/USD',     icon: '🇪🇺', decimals: 5, basePrice: 1.06850, volatility: 0.00010, payout: 91, category: 'forex' },
  { symbol: 'EUIDX',    name: 'Europe Composite Index',display: 'EU Index',    icon: '🇪🇺', decimals: 2, basePrice: 4895.20, volatility: 0.00015, payout: 91, category: 'index' },
  { symbol: 'NZDUSD',   name: 'NZD/USD OTC',           display: 'NZD/USD',     icon: '🇳🇿', decimals: 5, basePrice: 0.59180, volatility: 0.00012, payout: 89, category: 'forex' },
  { symbol: 'USDCHF',   name: 'USD/CHF OTC',           display: 'USD/CHF',     icon: '🇨🇭', decimals: 5, basePrice: 0.90820, volatility: 0.00012, payout: 89, category: 'forex' },
  { symbol: 'GBPUSD',   name: 'GBP/USD OTC',           display: 'GBP/USD',     icon: '🇬🇧', decimals: 5, basePrice: 1.24560, volatility: 0.00012, payout: 87, category: 'forex' },
  { symbol: 'USDCAD',   name: 'USD/CAD OTC',           display: 'USD/CAD',     icon: '🇨🇦', decimals: 5, basePrice: 1.37840, volatility: 0.00012, payout: 87, category: 'forex' },
  { symbol: 'AUDCAD',   name: 'AUD/CAD OTC',           display: 'AUD/CAD',     icon: '🇦🇺', decimals: 5, basePrice: 0.90160, volatility: 0.00012, payout: 85, category: 'forex' },
  { symbol: 'AUDJPY',   name: 'AUD/JPY OTC',           display: 'AUD/JPY',     icon: '🇦🇺', decimals: 3, basePrice: 100.910, volatility: 0.00014, payout: 85, category: 'forex' },
  { symbol: 'AUDNZD',   name: 'AUD/NZD OTC',           display: 'AUD/NZD',     icon: '🇦🇺', decimals: 5, basePrice: 1.10560, volatility: 0.00010, payout: 85, category: 'forex' },
  { symbol: 'ASIDX',    name: 'Asia Composite Index',  display: 'Asia Index',  icon: '🌏', decimals: 2, basePrice: 3742.80, volatility: 0.00018, payout: 85, category: 'index' },
  { symbol: 'CADCHF',   name: 'CAD/CHF OTC',           display: 'CAD/CHF',     icon: '🇨🇦', decimals: 5, basePrice: 0.65880, volatility: 0.0003, payout: 85, category: 'forex' },
  { symbol: 'XAGUSD',   name: 'Silver OTC',            display: 'XAG/USD',     icon: '🥈', decimals: 3, basePrice: 28.420, volatility: 0.0008, payout: 85, category: 'commodity' },
];

const intervalToSeconds = (intv: string): number => {
  switch (intv) {
    case '1m': return 60;
    case '5m': return 300;
    case '15m': return 900;
    case '1h': return 3600;
    default: return 60;
  }
};

// Deterministic seeded RNG so different symbols evolve independently but stably across remounts
const seededRandom = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

const seedFromSymbol = (sym: string): number => {
  let h = 0;
  for (let i = 0; i < sym.length; i++) h = (h * 31 + sym.charCodeAt(i)) >>> 0;
  return h;
};

// Box-Muller for gaussian noise — far more natural than uniform random
const gauss = (rand: () => number) => {
  const u = Math.max(rand(), 1e-9);
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

// Generate historical candles using mean-reverting OU process
// volatility is per-second relative std-dev. Each candle is built from many small steps.
const generateHistory = (asset: TradingAsset, intervalSec: number, count: number): CandleData[] => {
  const rand = seededRandom(seedFromSymbol(asset.symbol) + intervalSec);
  const now = Math.floor(Date.now() / 1000);
  const startTime = now - (count * intervalSec);
  const startTimeAligned = startTime - (startTime % intervalSec);
  const candles: CandleData[] = [];
  let price = asset.basePrice;
  const meanRevertStrength = 0.02; // gentle pull back to base price across history
  const stepDt = 1; // 1-second sub-steps
  const stepsPerCandle = Math.max(1, intervalSec / stepDt);

  for (let i = 0; i < count; i++) {
    const open = price;
    let high = open, low = open, close = open;
    for (let t = 0; t < stepsPerCandle; t++) {
      const noise = gauss(rand) * asset.volatility * close * Math.sqrt(stepDt);
      const meanPull = (asset.basePrice - close) * meanRevertStrength * stepDt * 0.001;
      close = close + noise + meanPull;
      if (close > high) high = close;
      if (close < low) low = close;
    }
    candles.push({
      time: startTimeAligned + i * intervalSec,
      open,
      high,
      low,
      close,
      volume: 100 + rand() * 900,
    });
    price = close;
  }
  return candles;
};

export const useForexFeed = (symbol: string) => {
  const [ticker, setTicker] = useState<MarketTicker | null>(null);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [interval, setInterval_] = useState('1m');
  const priceRef = useRef<number>(0);
  const dayOpenRef = useRef<number>(0);
  const dayHighRef = useRef<number>(0);
  const dayLowRef = useRef<number>(0);
  const volumeRef = useRef<number>(0);

  // Initialize / reset on symbol or interval change
  useEffect(() => {
    const asset = TRADING_PAIRS.find((p) => p.symbol === symbol);
    if (!asset) return;
    const intv = intervalToSeconds(interval);
    const hist = generateHistory(asset, intv, 200);
    setCandles(hist);
    const last = hist[hist.length - 1];
    priceRef.current = last.close;
    dayOpenRef.current = hist[Math.max(0, hist.length - Math.floor(86400 / intv))]?.open ?? hist[0].open;
    dayHighRef.current = Math.max(...hist.slice(-Math.floor(86400 / intv)).map((c) => c.high));
    dayLowRef.current = Math.min(...hist.slice(-Math.floor(86400 / intv)).map((c) => c.low));
    volumeRef.current = hist.reduce((s, c) => s + c.volume, 0);
    setIsConnected(true);

    const change = last.close - dayOpenRef.current;
    const changePct = (change / dayOpenRef.current) * 100;
    setTicker({
      symbol: asset.symbol,
      price: last.close,
      change24h: change,
      changePercent: changePct,
      high: dayHighRef.current,
      low: dayLowRef.current,
      volume: volumeRef.current,
    });
  }, [symbol, interval]);

  // Live tick simulation:
  //  - new candle is forced every 4 seconds
  //  - price updates smoothly within each candle via requestAnimationFrame
  useEffect(() => {
    const asset = TRADING_PAIRS.find((p) => p.symbol === symbol);
    if (!asset) return;

    const CANDLE_DURATION_MS = 30000;

    let raf = 0;
    let lastTickAt = performance.now();
    let lastCandleAt = performance.now();
    let lastCommitAt = performance.now();

    const gaussLive = () => {
      const u = Math.max(Math.random(), 1e-9);
      const v = Math.random();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };

    let pendingHigh = priceRef.current;
    let pendingLow = priceRef.current;
    let pendingVol = 0;
    let candleOpen = priceRef.current;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);

      // Sub-tick price at ~30 Hz for smooth movement
      const dt = (now - lastTickAt) / 1000;
      if (dt >= 1 / 30) {
        lastTickAt = now;
        const noise = gaussLive() * asset.volatility * 3 * priceRef.current * Math.sqrt(dt);
        priceRef.current += noise;
        if (priceRef.current > pendingHigh) pendingHigh = priceRef.current;
        if (priceRef.current < pendingLow) pendingLow = priceRef.current;
        pendingVol += Math.random() * 0.5;
      }

      // Commit to React at ~10 Hz for smooth candle body updates
      if (now - lastCommitAt >= 100) {
        lastCommitAt = now;

        const newPrice = priceRef.current;
        if (newPrice > dayHighRef.current) dayHighRef.current = newPrice;
        if (newPrice < dayLowRef.current) dayLowRef.current = newPrice;

        const localHigh = pendingHigh;
        const localLow = pendingLow;
        const localVol = pendingVol;
        const shouldNewCandle = now - lastCandleAt >= CANDLE_DURATION_MS;

        if (shouldNewCandle) {
          lastCandleAt = now;
          volumeRef.current += localVol;
          pendingVol = 0;

          const newCandleOpen = newPrice;
          const prevClose = newPrice;

          setCandles((prev) => {
            if (prev.length === 0) return prev;
            const updated = prev.slice();
            const last = updated[updated.length - 1];
            updated[updated.length - 1] = {
              ...last,
              close: prevClose,
              high: Math.max(last.high, localHigh),
              low: Math.min(last.low, localLow),
              volume: last.volume + localVol,
            };
            const nowSec = Math.floor(Date.now() / 1000);
            updated.push({
              time: nowSec,
              open: newCandleOpen,
              high: newCandleOpen,
              low: newCandleOpen,
              close: newCandleOpen,
              volume: 0,
            });
            candleOpen = newCandleOpen;
            pendingHigh = newCandleOpen;
            pendingLow = newCandleOpen;
            if (updated.length > 300) updated.shift();
            return updated;
          });
        } else {
          setCandles((prev) => {
            if (prev.length === 0) return prev;
            const updated = prev.slice();
            const last = updated[updated.length - 1];
            updated[updated.length - 1] = {
              ...last,
              close: newPrice,
              high: Math.max(last.high, localHigh),
              low: Math.min(last.low, localLow),
              volume: last.volume + localVol,
            };
            pendingVol = 0;
            volumeRef.current += localVol;
            return updated;
          });
        }

        const change = newPrice - dayOpenRef.current;
        const changePct = (change / dayOpenRef.current) * 100;
        setTicker({
          symbol: asset.symbol,
          price: newPrice,
          change24h: change,
          changePercent: changePct,
          high: dayHighRef.current,
          low: dayLowRef.current,
          volume: volumeRef.current,
        });
      }
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [symbol, interval]);

  return { ticker, candles, isConnected, interval, setInterval: setInterval_ };
};
