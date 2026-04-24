import { useEffect, useRef, useState } from 'react';

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
  symbol: string;
  name: string;
  display: string;
  icon: string;
  decimals: number;
  basePrice: number;
  volatility: number;
  payout: number;
  category: AssetCategory;
}

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
  { symbol: 'CADCHF',   name: 'CAD/CHF OTC',           display: 'CAD/CHF',     icon: '🇨🇦', decimals: 5, basePrice: 0.65880, volatility: 0.0003,  payout: 85, category: 'forex' },
  { symbol: 'XAGUSD',   name: 'Silver OTC',            display: 'XAG/USD',     icon: '🥈', decimals: 3, basePrice: 28.420,  volatility: 0.0008,  payout: 85, category: 'commodity' },
];

// ─── Module-level shared state ────────────────────────────────────────────────
// liveSymbolPrice: single source-of-truth price per symbol, shared across all timeframes
const liveSymbolPrice = new Map<string, number>();

// ─── Forced trade-bias registry (rigging) ─────────────────────────────────────
// Each registered bias forces the price to move in `direction` between
// `startAt` and `expiryAt`. Used to make the candle resolve in the user's favor.
export interface ForcedBias {
  tradeId: string;
  symbol: string;
  direction: 'up' | 'down';
  entryPrice: number;
  startAt: number;   // Date.now() ms — when forcing begins
  expiryAt: number;  // Date.now() ms — when forcing ends
}

const forcedBiases = new Map<string, ForcedBias[]>();

export const setForcedBias = (bias: ForcedBias) => {
  const list = forcedBiases.get(bias.symbol) ?? [];
  list.push(bias);
  forcedBiases.set(bias.symbol, list);
};

export const clearForcedBias = (tradeId: string) => {
  forcedBiases.forEach((list, sym) => {
    const next = list.filter((b) => b.tradeId !== tradeId);
    if (next.length === 0) forcedBiases.delete(sym);
    else forcedBiases.set(sym, next);
  });
};

const getActiveBias = (symbol: string): ForcedBias | null => {
  const list = forcedBiases.get(symbol);
  if (!list || list.length === 0) return null;
  const now = Date.now();
  const stillValid = list.filter((b) => now < b.expiryAt);
  if (stillValid.length !== list.length) {
    if (stillValid.length === 0) forcedBiases.delete(symbol);
    else forcedBiases.set(symbol, stillValid);
  }
  // Return the most recently registered active bias
  for (let i = stillValid.length - 1; i >= 0; i--) {
    if (now >= stillValid[i].startAt) return stillValid[i];
  }
  return null;
};

interface CacheEntry {
  candles: CandleData[];
  price: number;
  dayOpen: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
}
const feedCache = new Map<string, CacheEntry>();
const cacheKey  = (sym: string, intv: string) => `${sym}-${intv}`;

// ─── Interval config ──────────────────────────────────────────────────────────
interface IntervalConfig {
  intervalSec: number;
  candleMs: number;
  tickVol: number;
}
const INTERVAL_CONFIG: Record<string, IntervalConfig> = {
  '1m':  { intervalSec: 60,   candleMs: 4_000,   tickVol: 3   },
  '5m':  { intervalSec: 300,  candleMs: 20_000,  tickVol: 2.5 },
  '15m': { intervalSec: 900,  candleMs: 60_000,  tickVol: 2   },
  '1h':  { intervalSec: 3600, candleMs: 240_000, tickVol: 1.5 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const seededRandom = (seed: number) => {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
};
const seedFromSymbol = (sym: string): number => {
  let h = 0;
  for (let i = 0; i < sym.length; i++) h = (h * 31 + sym.charCodeAt(i)) >>> 0;
  return h;
};
const gauss = (rand: () => number) => {
  const u = Math.max(rand(), 1e-9), v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
const gaussLive = () => {
  const u = Math.max(Math.random(), 1e-9), v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

// Generate historical candles.
// If targetEndPrice is provided, every candle is scaled so the last close
// equals targetEndPrice — this keeps all timeframes at the same live price.
const generateHistory = (
  asset: TradingAsset,
  intervalSec: number,
  count: number,
  targetEndPrice?: number,
): CandleData[] => {
  // Use SAME seed for all timeframes of the same symbol so patterns are consistent
  const rand = seededRandom(seedFromSymbol(asset.symbol));
  const now  = Math.floor(Date.now() / 1000);
  const latestBoundary = now - (now % intervalSec);
  const startTime      = latestBoundary - (count - 1) * intervalSec;

  const candles: CandleData[] = [];
  let price = asset.basePrice;
  const meanRevertStrength = 0.02;
  const stepsPerCandle = Math.max(1, Math.min(intervalSec, 300));

  for (let i = 0; i < count; i++) {
    const open = price;
    let high = open, low = open, close = open;
    for (let t = 0; t < stepsPerCandle; t++) {
      const dt = intervalSec / stepsPerCandle;
      const noise    = gauss(rand) * asset.volatility * close * Math.sqrt(dt);
      const meanPull = (asset.basePrice - close) * meanRevertStrength * dt * 0.001;
      close = close + noise + meanPull;
      if (close > high) high = close;
      if (close < low)  low  = close;
    }
    candles.push({
      time: startTime + i * intervalSec,
      open, high, low, close,
      volume: 100 + rand() * 900,
    });
    price = close;
  }

  // Scale all candles so the last close matches the shared live price.
  // This means all timeframes show the same current price — just with
  // different candle aggregation shapes.
  if (targetEndPrice && candles.length > 0) {
    const lastClose = candles[candles.length - 1].close;
    if (lastClose > 0) {
      const scale = targetEndPrice / lastClose;
      return candles.map((c) => ({
        ...c,
        open:  c.open  * scale,
        high:  c.high  * scale,
        low:   c.low   * scale,
        close: c.close * scale,
      }));
    }
  }

  return candles;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useForexFeed = (symbol: string) => {
  const [ticker, setTicker]         = useState<MarketTicker | null>(null);
  const [candles, setCandles]       = useState<CandleData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [interval, setInterval_]    = useState('1m');

  const priceRef   = useRef<number>(0);
  const dayOpenRef = useRef<number>(0);
  const dayHighRef = useRef<number>(0);
  const dayLowRef  = useRef<number>(0);
  const volumeRef  = useRef<number>(0);

  // ── Initialize / restore on symbol or interval change ──────────────────────
  useEffect(() => {
    const asset = TRADING_PAIRS.find((p) => p.symbol === symbol);
    if (!asset) return;

    const { intervalSec } = INTERVAL_CONFIG[interval] ?? INTERVAL_CONFIG['1m'];
    const key    = cacheKey(symbol, interval);
    const cached = feedCache.get(key);

    let initCandles: CandleData[], initPrice: number,
        initDayOpen: number, initDayHigh: number,
        initDayLow: number,  initVolume: number;

    if (cached) {
      // Restore from cache — price is already in sync
      initCandles  = cached.candles;
      initPrice    = cached.price;
      initDayOpen  = cached.dayOpen;
      initDayHigh  = cached.dayHigh;
      initDayLow   = cached.dayLow;
      initVolume   = cached.volume;
    } else {
      // First time loading this timeframe — scale history to match the shared live price
      const sharedPrice = liveSymbolPrice.get(symbol); // undefined on very first load
      const hist        = generateHistory(asset, intervalSec, 200, sharedPrice);
      const last        = hist[hist.length - 1];
      const dayBars     = Math.max(1, Math.floor(86400 / intervalSec));
      const daySlice    = hist.slice(-dayBars);

      initCandles  = hist;
      initPrice    = sharedPrice ?? last.close;
      initDayOpen  = hist[Math.max(0, hist.length - dayBars)]?.open ?? hist[0].open;
      initDayHigh  = Math.max(...daySlice.map((c) => c.high));
      initDayLow   = Math.min(...daySlice.map((c) => c.low));
      initVolume   = hist.reduce((s, c) => s + c.volume, 0);

      feedCache.set(key, {
        candles: initCandles, price: initPrice,
        dayOpen: initDayOpen, dayHigh: initDayHigh,
        dayLow: initDayLow,   volume: initVolume,
      });
    }

    priceRef.current   = initPrice;
    dayOpenRef.current = initDayOpen;
    dayHighRef.current = initDayHigh;
    dayLowRef.current  = initDayLow;
    volumeRef.current  = initVolume;
    setCandles(initCandles);
    setIsConnected(true);

    const change = initPrice - initDayOpen;
    setTicker({
      symbol: asset.symbol, price: initPrice,
      change24h: change, changePercent: (change / initDayOpen) * 100,
      high: initDayHigh, low: initDayLow, volume: initVolume,
    });
  }, [symbol, interval]);

  // ── Live tick simulation ────────────────────────────────────────────────────
  useEffect(() => {
    const asset = TRADING_PAIRS.find((p) => p.symbol === symbol);
    if (!asset) return;

    const cfg = INTERVAL_CONFIG[interval] ?? INTERVAL_CONFIG['1m'];
    const { intervalSec, candleMs, tickVol } = cfg;
    const key = cacheKey(symbol, interval);

    let raf = 0;
    let lastTickAt   = performance.now();
    let lastCandleAt = performance.now();
    let lastCommitAt = performance.now();
    let pendingHigh  = priceRef.current;
    let pendingLow   = priceRef.current;
    let pendingVol   = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);

      // Price update at ~30 Hz
      const dt = (now - lastTickAt) / 1000;
      if (dt >= 1 / 30) {
        lastTickAt = now;

        const bias = getActiveBias(symbol);
        if (bias) {
          // ── Rigged movement: drift toward a target above/below entry ──
          const wallNow     = Date.now();
          const totalWindow = Math.max(1, bias.expiryAt - bias.startAt);
          const elapsed     = Math.min(totalWindow, Math.max(0, wallNow - bias.startAt));
          const progress    = elapsed / totalWindow; // 0 → 1 across the rig window

          // Strength of move relative to entry (~8 pips base, growing with progress)
          const minMove = bias.entryPrice * 0.0008;
          const target  = bias.direction === 'up'
            ? bias.entryPrice + minMove * (1 + progress * 2.5)
            : bias.entryPrice - minMove * (1 + progress * 2.5);

          // Smooth pull toward target + small residual noise so it still looks alive
          const pull      = (target - priceRef.current) * 0.06;
          const tinyNoise = gaussLive() * asset.volatility * 0.4 * priceRef.current * Math.sqrt(dt);
          priceRef.current = priceRef.current + pull + tinyNoise;

          // In the final 1.5 s, hard-clamp to the winning side of entry
          const remaining = bias.expiryAt - wallNow;
          if (remaining < 1500) {
            const margin = minMove * 0.6;
            if (bias.direction === 'up' && priceRef.current <= bias.entryPrice + margin) {
              priceRef.current = bias.entryPrice + margin;
            } else if (bias.direction === 'down' && priceRef.current >= bias.entryPrice - margin) {
              priceRef.current = bias.entryPrice - margin;
            }
          }
        } else {
          // Normal random-walk price update
          const noise = gaussLive() * asset.volatility * tickVol * priceRef.current * Math.sqrt(dt);
          priceRef.current = Math.max(priceRef.current + noise, asset.basePrice * 0.5);
        }

        if (priceRef.current > pendingHigh) pendingHigh = priceRef.current;
        if (priceRef.current < pendingLow)  pendingLow  = priceRef.current;
        pendingVol += Math.random() * 0.5;

        // Update the shared symbol price — this is the single source of truth
        liveSymbolPrice.set(symbol, priceRef.current);
      }

      // Commit to React state at ~10 Hz
      if (now - lastCommitAt < 100) return;
      lastCommitAt = now;

      const newPrice = priceRef.current;
      if (newPrice > dayHighRef.current) dayHighRef.current = newPrice;
      if (newPrice < dayLowRef.current)  dayLowRef.current  = newPrice;

      const lH = pendingHigh, lL = pendingLow, lV = pendingVol;
      const newCandle = now - lastCandleAt >= candleMs;

      if (newCandle) {
        lastCandleAt = now;
        volumeRef.current += lV;
        pendingVol = 0;

        setCandles((prev) => {
          if (prev.length === 0) return prev;
          const arr  = prev.slice();
          const last = arr[arr.length - 1];
          arr[arr.length - 1] = {
            ...last,
            close: newPrice,
            high:  Math.max(last.high, lH),
            low:   Math.min(last.low,  lL),
            volume: last.volume + lV,
          };
          const nextTime = last.time + intervalSec;
          arr.push({ time: nextTime, open: newPrice, high: newPrice, low: newPrice, close: newPrice, volume: 0 });
          pendingHigh = newPrice;
          pendingLow  = newPrice;
          if (arr.length > 300) arr.shift();

          feedCache.set(key, {
            candles: arr, price: newPrice,
            dayOpen: dayOpenRef.current, dayHigh: dayHighRef.current,
            dayLow:  dayLowRef.current,  volume:  volumeRef.current,
          });
          return arr;
        });
      } else {
        setCandles((prev) => {
          if (prev.length === 0) return prev;
          const arr  = prev.slice();
          const last = arr[arr.length - 1];
          arr[arr.length - 1] = {
            ...last,
            close: newPrice,
            high:  Math.max(last.high, lH),
            low:   Math.min(last.low,  lL),
            volume: last.volume + lV,
          };
          pendingVol = 0;
          volumeRef.current += lV;

          feedCache.set(key, {
            candles: arr, price: newPrice,
            dayOpen: dayOpenRef.current, dayHigh: dayHighRef.current,
            dayLow:  dayLowRef.current,  volume:  volumeRef.current,
          });
          return arr;
        });
      }

      const change = newPrice - dayOpenRef.current;
      setTicker({
        symbol: asset.symbol, price: newPrice,
        change24h: change, changePercent: (change / dayOpenRef.current) * 100,
        high: dayHighRef.current, low: dayLowRef.current, volume: volumeRef.current,
      });
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [symbol, interval]);

  return { ticker, candles, isConnected, interval, setInterval: setInterval_ };
};
