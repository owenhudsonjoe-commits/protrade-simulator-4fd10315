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

const TRADING_PAIRS = [
  { symbol: 'BTCUSDT', name: 'BTC/USDT', icon: '₿', decimals: 2 },
  { symbol: 'ETHUSDT', name: 'ETH/USDT', icon: 'Ξ', decimals: 2 },
  { symbol: 'BNBUSDT', name: 'BNB/USDT', icon: 'B', decimals: 2 },
  { symbol: 'SOLUSDT', name: 'SOL/USDT', icon: 'S', decimals: 3 },
  { symbol: 'XRPUSDT', name: 'XRP/USDT', icon: 'X', decimals: 4 },
  { symbol: 'DOGEUSDT', name: 'DOGE/USDT', icon: 'D', decimals: 5 },
  { symbol: 'ADAUSDT', name: 'ADA/USDT', icon: 'A', decimals: 4 },
  { symbol: 'DOTUSDT', name: 'DOT/USDT', icon: 'P', decimals: 3 },
  { symbol: 'MATICUSDT', name: 'MATIC/USDT', icon: 'M', decimals: 4 },
  { symbol: 'AVAXUSDT', name: 'AVAX/USDT', icon: 'AV', decimals: 3 },
];

export { TRADING_PAIRS };

export const useBinanceWebSocket = (symbol: string) => {
  const [ticker, setTicker] = useState<MarketTicker | null>(null);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsTickerRef = useRef<WebSocket | null>(null);
  const wsCandleRef = useRef<WebSocket | null>(null);
  const [interval, setInterval_] = useState('1m');

  // Fetch historical candles
  const fetchCandles = useCallback(async (sym: string, intv: string) => {
    try {
      const res = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${sym}&interval=${intv}&limit=200`
      );
      const data = await res.json();
      const parsed: CandleData[] = data.map((k: any) => ({
        time: Math.floor(k[0] / 1000),
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5]),
      }));
      setCandles(parsed);
    } catch (err) {
      console.error('Failed to fetch candles:', err);
    }
  }, []);

  useEffect(() => {
    fetchCandles(symbol, interval);
  }, [symbol, interval, fetchCandles]);

  // Ticker WebSocket
  useEffect(() => {
    const sym = symbol.toLowerCase();
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${sym}@ticker`);

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onerror = () => setIsConnected(false);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setTicker({
        symbol: data.s,
        price: parseFloat(data.c),
        change24h: parseFloat(data.p),
        changePercent: parseFloat(data.P),
        high: parseFloat(data.h),
        low: parseFloat(data.l),
        volume: parseFloat(data.v),
      });
    };

    wsTickerRef.current = ws;
    return () => ws.close();
  }, [symbol]);

  // Candle WebSocket — kline for new candle boundaries
  useEffect(() => {
    const sym = symbol.toLowerCase();
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${sym}@kline_${interval}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const k = data.k;
      const newCandle: CandleData = {
        time: Math.floor(k.t / 1000),
        open: parseFloat(k.o),
        high: parseFloat(k.h),
        low: parseFloat(k.l),
        close: parseFloat(k.c),
        volume: parseFloat(k.v),
      };

      setCandles((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0 && updated[lastIndex].time === newCandle.time) {
          updated[lastIndex] = newCandle;
        } else {
          updated.push(newCandle);
          if (updated.length > 300) updated.shift();
        }
        return updated;
      });
    };

    wsCandleRef.current = ws;
    return () => ws.close();
  }, [symbol, interval]);

  // AggTrade WebSocket — throttled to ~10 updates/sec for fast but smooth chart
  useEffect(() => {
    const sym = symbol.toLowerCase();
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${sym}@aggTrade`);
    let pending: { price: number; vol: number } | null = null;
    let raf: number | null = null;

    const flush = () => {
      raf = null;
      if (!pending) return;
      const { price, vol } = pending;
      pending = null;
      setCandles((prev) => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        const last = { ...updated[updated.length - 1] };
        last.close = price;
        if (price > last.high) last.high = price;
        if (price < last.low) last.low = price;
        last.volume += vol;
        updated[updated.length - 1] = last;
        return updated;
      });
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const price = parseFloat(data.p);
      const vol = parseFloat(data.q);
      pending = pending ? { price, vol: pending.vol + vol } : { price, vol };
      if (!raf) raf = requestAnimationFrame(flush);
    };

    return () => {
      ws.close();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [symbol]);

  return { ticker, candles, isConnected, interval, setInterval: setInterval_ };
};
