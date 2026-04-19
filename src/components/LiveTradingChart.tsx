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

// Neon glow colours
const GREEN  = '#00e676';
const RED    = '#ff1744';
const GREEN2 = '#00c853';  // slightly deeper for wick
const RED2   = '#d50000';

const VISIBLE_BARS: Record<string, number> = {
  '1m':  30,
  '5m':  60,
  '15m': 100,
  '1h':  160,
};
const BAR_SPACING: Record<string, number> = {
  '1m':  14,
  '5m':  9,
  '15m': 6,
  '1h':  4,
};

const LiveTradingChart = forwardRef<ChartHandle, Props>(({ candles, pair, indicators, interval }, ref) => {
  const containerRef    = useRef<HTMLDivElement>(null);
  const chartRef        = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const indicatorRefs   = useRef<any[]>([]);
  const loadedKeyRef    = useRef('');
  const lastTimeRef     = useRef(0);
  const prevIndKeyRef   = useRef('');

  useImperativeHandle(ref, () => ({ nudgeChart: () => {} }));

  // ── Create chart ────────────────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    loadedKeyRef.current   = '';
    lastTimeRef.current    = 0;
    prevIndKeyRef.current  = '';

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: '#000000' },
        textColor: 'rgba(255,255,255,0.25)',
        fontSize: 10,
        fontFamily: "'JetBrains Mono', monospace",
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.03)' },
        horzLines: { color: 'rgba(255,255,255,0.03)' },
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: 'rgba(0,230,118,0.4)',
          width: 1,
          style: 2,
          labelBackgroundColor: '#00c853',
        },
        horzLine: {
          color: 'rgba(0,230,118,0.4)',
          width: 1,
          style: 2,
          labelBackgroundColor: '#00c853',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        scaleMargins: { top: 0.06, bottom: 0.22 },
        entireTextOnly: true,
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        barSpacing: BAR_SPACING[interval] ?? 8,
        minBarSpacing: 2,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
      handleScale:  { mouseWheel: true, pinch: true, axisPressedMouseMove: true, axisDoubleClickReset: { time: true, price: true } },
      width:  container.clientWidth  || 360,
      height: container.clientHeight || 320,
    });

    const cs = chart.addCandlestickSeries({
      upColor:          GREEN,
      downColor:        RED,
      borderUpColor:    GREEN,
      borderDownColor:  RED,
      wickUpColor:      GREEN2,
      wickDownColor:    RED2,
      priceLineVisible: true,
      priceLineWidth:   1,
      priceLineColor:   'rgba(0,230,118,0.5)',
      priceLineStyle:   2,
      lastValueVisible: true,
    });

    const vs = chart.addHistogramSeries({
      priceFormat:      { type: 'volume' },
      priceScaleId:     'volume',
      lastValueVisible: false,
      priceLineVisible: false,
    });
    chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.88, bottom: 0 } });

    chartRef.current        = chart;
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

  // ── Update data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const chart = chartRef.current;
    const cs    = candleSeriesRef.current;
    const vs    = volumeSeriesRef.current;
    if (!chart || !cs || !vs || candles.length === 0) return;

    const currentKey  = `${pair}-${interval}`;
    const needFullLoad = loadedKeyRef.current !== currentKey;

    const volColor = (c: CandleData) =>
      c.close >= c.open ? 'rgba(0,230,118,0.18)' : 'rgba(255,23,68,0.18)';

    try {
      if (needFullLoad) {
        cs.setData(candles.map((c) => ({
          time: c.time as any, open: c.open, high: c.high, low: c.low, close: c.close,
        })));
        vs.setData(candles.map((c) => ({
          time: c.time as any, value: c.volume, color: volColor(c),
        })));

        const bars    = VISIBLE_BARS[interval] ?? 80;
        const spacing = BAR_SPACING[interval]  ?? 8;
        chart.timeScale().applyOptions({ barSpacing: spacing });
        if (candles.length > bars) {
          chart.timeScale().setVisibleLogicalRange({ from: candles.length - bars, to: candles.length + 4 });
        } else {
          chart.timeScale().fitContent();
        }

        loadedKeyRef.current = currentKey;
        lastTimeRef.current  = candles[candles.length - 1].time;

        rebuildIndicators(chart, candles, indicators, indicatorRefs);
        prevIndKeyRef.current = indicators.join(',');
      } else {
        const last = candles[candles.length - 1];

        if (last.time > lastTimeRef.current) {
          if (candles.length >= 2) {
            const prev = candles[candles.length - 2];
            cs.update({ time: prev.time as any, open: prev.open, high: prev.high, low: prev.low, close: prev.close });
            vs.update({ time: prev.time as any, value: prev.volume, color: volColor(prev) });
          }
          cs.update({ time: last.time as any, open: last.open, high: last.high, low: last.low, close: last.close });
          vs.update({ time: last.time as any, value: last.volume, color: volColor(last) });
          lastTimeRef.current = last.time;
        } else {
          cs.update({ time: last.time as any, open: last.open, high: last.high, low: last.low, close: last.close });
          vs.update({ time: last.time as any, value: last.volume, color: volColor(last) });
        }

        const indKey = indicators.join(',');
        if (indKey !== prevIndKeyRef.current) {
          rebuildIndicators(chart, candles, indicators, indicatorRefs);
          prevIndKeyRef.current = indKey;
        }
      }
    } catch {
      loadedKeyRef.current = '';
    }
  }, [candles, indicators, interval, pair]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full"
      style={{
        // Dual drop-shadow: green for the overall glow, gives the "bloom" effect
        filter: 'drop-shadow(0 0 6px rgba(0,230,118,0.35)) drop-shadow(0 0 2px rgba(255,23,68,0.2))',
      }}
    />
  );
});

function rebuildIndicators(
  chart: any,
  candles: CandleData[],
  indicators: string[],
  refs: React.MutableRefObject<any[]>,
) {
  refs.current.forEach((s) => { try { chart.removeSeries(s); } catch {} });
  refs.current = [];
  if (indicators.includes('MA7')) {
    const s = chart.addLineSeries({ color: '#ffd600', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
    s.setData(calcSMA(candles, 7));
    refs.current.push(s);
  }
  if (indicators.includes('MA25')) {
    const s = chart.addLineSeries({ color: '#e040fb', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
    s.setData(calcSMA(candles, 25));
    refs.current.push(s);
  }
  if (indicators.includes('MA99')) {
    const s = chart.addLineSeries({ color: '#40c4ff', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
    s.setData(calcSMA(candles, 99));
    refs.current.push(s);
  }
}

LiveTradingChart.displayName = 'LiveTradingChart';
export default LiveTradingChart;
