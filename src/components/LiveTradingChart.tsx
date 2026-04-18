import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import type { CandleData } from '@/hooks/useBinanceWebSocket';

interface Props {
  candles: CandleData[];
  pair: string;
  indicators: string[];
  interval: string;
}

export interface ChartHandle {
  nudgeChart: (direction: 'up' | 'down', entryPrice: number) => void;
}

const calcSMA = (data: CandleData[], period: number) => {
  const result: { time: any; value: number }[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) sum += data[i - j].close;
    result.push({ time: data[i].time as any, value: sum / period });
  }
  return result;
};

// How many candles to show in the initial viewport per timeframe
const VISIBLE_BARS: Record<string, number> = {
  '1m':  80,
  '5m':  60,
  '15m': 40,
  '1h':  24,
};

const LiveTradingChart = forwardRef<ChartHandle, Props>(({ candles, pair, indicators, interval }, ref) => {
  const containerRef      = useRef<HTMLDivElement>(null);
  const chartRef          = useRef<any>(null);
  const candleSeriesRef   = useRef<any>(null);
  const volumeSeriesRef   = useRef<any>(null);
  const indicatorRefs     = useRef<any[]>([]);

  // What's currently rendered on the chart
  const loadedKeyRef      = useRef('');   // `${pair}-${interval}` of last full load
  const lastTimeRef       = useRef(0);    // time of last candle in chart
  const prevIndKeyRef     = useRef('');

  useImperativeHandle(ref, () => ({ nudgeChart: () => {} }));

  // ── Create chart once per pair ─────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    loadedKeyRef.current   = '';
    lastTimeRef.current    = 0;
    prevIndKeyRef.current  = '';

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: '#0a0c0f' },
        textColor: '#6b7280',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: 'rgba(42,46,57,0.35)' },
        horzLines: { color: 'rgba(42,46,57,0.35)' },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: 'rgba(41,98,255,0.5)', width: 1, style: 2, labelBackgroundColor: '#2962ff' },
        horzLine: { color: 'rgba(41,98,255,0.5)', width: 1, style: 2, labelBackgroundColor: '#2962ff' },
      },
      rightPriceScale: {
        borderColor: 'rgba(42,46,57,0.5)',
        scaleMargins: { top: 0.06, bottom: 0.22 },
        entireTextOnly: true,
      },
      timeScale: {
        borderColor: 'rgba(42,46,57,0.5)',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        barSpacing: 8,
        minBarSpacing: 2,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
      handleScale:  { mouseWheel: true, pinch: true, axisPressedMouseMove: true, axisDoubleClickReset: { time: true, price: true } },
      width:  container.clientWidth  || 360,
      height: container.clientHeight || 320,
    });

    const cs = chart.addCandlestickSeries({
      upColor: '#22c55e', downColor: '#ef4444',
      borderUpColor: '#22c55e', borderDownColor: '#ef4444',
      wickUpColor: '#22c55e99', wickDownColor: '#ef444499',
      priceLineVisible: true, priceLineWidth: 1,
      priceLineColor: '#3b82f6', priceLineStyle: 2,
      lastValueVisible: true,
    });

    const vs = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
      lastValueVisible: false, priceLineVisible: false,
    });
    chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });

    chartRef.current      = chart;
    candleSeriesRef.current = cs;
    volumeSeriesRef.current = vs;
    indicatorRefs.current   = [];

    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (r?.width && r?.height) chart.applyOptions({ width: r.width, height: r.height });
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      indicatorRefs.current.forEach((s) => { try { chart.removeSeries(s); } catch {} });
      indicatorRefs.current = [];
      try { chart.remove(); } catch {}
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [pair]);

  // ── Update data ────────────────────────────────────────────────────────────
  useEffect(() => {
    const chart = chartRef.current;
    const cs    = candleSeriesRef.current;
    const vs    = volumeSeriesRef.current;
    if (!chart || !cs || !vs || candles.length === 0) return;

    const currentKey  = `${pair}-${interval}`;
    const needFullLoad = loadedKeyRef.current !== currentKey;

    try {
      if (needFullLoad) {
        // ── Full load ──────────────────────────────────────────────────────
        cs.setData(candles.map((c) => ({
          time: c.time as any, open: c.open, high: c.high, low: c.low, close: c.close,
        })));
        vs.setData(candles.map((c) => ({
          time: c.time as any, value: c.volume,
          color: c.close >= c.open ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
        })));

        // Set initial visible range for this timeframe
        const bars = VISIBLE_BARS[interval] ?? 80;
        if (candles.length > bars) {
          chart.timeScale().setVisibleLogicalRange({ from: candles.length - bars, to: candles.length + 4 });
        } else {
          chart.timeScale().fitContent();
        }

        loadedKeyRef.current  = currentKey;
        lastTimeRef.current   = candles[candles.length - 1].time;

        // Rebuild indicators
        rebuildIndicators(chart, candles, indicators, indicatorRefs);
        prevIndKeyRef.current = indicators.join(',');

      } else {
        // ── Incremental update ─────────────────────────────────────────────
        const last = candles[candles.length - 1];
        const volColor = (c: CandleData) => c.close >= c.open ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)';

        if (last.time > lastTimeRef.current) {
          // A new candle was appended — finalize the previous one first
          if (candles.length >= 2) {
            const prev = candles[candles.length - 2];
            cs.update({ time: prev.time as any, open: prev.open, high: prev.high, low: prev.low, close: prev.close });
            vs.update({ time: prev.time as any, value: prev.volume, color: volColor(prev) });
          }
          cs.update({ time: last.time as any, open: last.open, high: last.high, low: last.low, close: last.close });
          vs.update({ time: last.time as any, value: last.volume, color: volColor(last) });
          lastTimeRef.current = last.time;
        } else {
          // Same candle ticking — just update in place
          cs.update({ time: last.time as any, open: last.open, high: last.high, low: last.low, close: last.close });
          vs.update({ time: last.time as any, value: last.volume, color: volColor(last) });
        }

        // Rebuild indicators only when set changes
        const indKey = indicators.join(',');
        if (indKey !== prevIndKeyRef.current) {
          rebuildIndicators(chart, candles, indicators, indicatorRefs);
          prevIndKeyRef.current = indKey;
        }
      }
    } catch {
      // On any error, force a full reload next cycle
      loadedKeyRef.current = '';
    }
  }, [candles, indicators, interval, pair]);

  return <div ref={containerRef} className="absolute inset-0 w-full h-full" />;
});

function rebuildIndicators(
  chart: any,
  candles: CandleData[],
  indicators: string[],
  refs: React.MutableRefObject<any[]>,
) {
  // Remove existing indicator series
  refs.current.forEach((s) => { try { chart.removeSeries(s); } catch {} });
  refs.current = [];

  if (indicators.includes('MA7')) {
    const s = chart.addLineSeries({ color: '#f59e0b', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
    s.setData(calcSMA(candles, 7));
    refs.current.push(s);
  }
  if (indicators.includes('MA25')) {
    const s = chart.addLineSeries({ color: '#a855f7', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
    s.setData(calcSMA(candles, 25));
    refs.current.push(s);
  }
  if (indicators.includes('MA99')) {
    const s = chart.addLineSeries({ color: '#06b6d4', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
    s.setData(calcSMA(candles, 99));
    refs.current.push(s);
  }
}

LiveTradingChart.displayName = 'LiveTradingChart';
export default LiveTradingChart;
