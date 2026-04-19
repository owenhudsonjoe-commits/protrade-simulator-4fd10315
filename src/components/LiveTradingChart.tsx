import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { createChart, ColorType, LineStyle } from 'lightweight-charts';
import type { CandleData } from '@/hooks/useBinanceWebSocket';

interface ActiveTrade {
  id: string;
  direction: 'up' | 'down';
  entryPrice: number;
  symbol: string;
}

interface Props {
  candles: CandleData[];
  pair: string;
  indicators: string[];
  interval: string;
  activeTrades?: ActiveTrade[];
}

export interface ChartHandle {
  nudgeChart: (direction: 'up' | 'down', entryPrice: number) => void;
}

// ── Maths ────────────────────────────────────────────────────────────────────
const calcSMA = (data: CandleData[], period: number) => {
  const result: { time: any; value: number }[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) sum += data[i - j].close;
    result.push({ time: data[i].time as any, value: sum / period });
  }
  return result;
};

const calcRSI = (data: CandleData[], period = 14) => {
  if (data.length < period + 2) return [];
  const result: { time: any; value: number }[] = [];
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff > 0) avgGain += diff;
    else avgLoss -= diff;
  }
  avgGain /= period;
  avgLoss /= period;

  for (let i = period; i < data.length; i++) {
    if (i > period) {
      const diff = data[i].close - data[i - 1].close;
      const gain = Math.max(0, diff);
      const loss = Math.max(0, -diff);
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result.push({ time: data[i].time as any, value: 100 - 100 / (1 + rs) });
  }
  return result;
};

// ── Constants ────────────────────────────────────────────────────────────────
const GREEN = '#00e676';
const RED   = '#ff1744';
const GREEN2 = '#00c853';
const RED2   = '#d50000';

const VISIBLE_BARS: Record<string, number> = { '1m': 30, '5m': 60, '15m': 100, '1h': 160 };
const BAR_SPACING: Record<string, number>  = { '1m': 14, '5m': 9,  '15m': 6,   '1h': 4   };

// ── Component ────────────────────────────────────────────────────────────────
const LiveTradingChart = forwardRef<ChartHandle, Props>(
  ({ candles, pair, indicators, interval, activeTrades = [] }, ref) => {
    const containerRef    = useRef<HTMLDivElement>(null);
    const chartRef        = useRef<any>(null);
    const candleSeriesRef = useRef<any>(null);
    const volumeSeriesRef = useRef<any>(null);
    const indicatorRefs   = useRef<any[]>([]);
    const entryLinesRef   = useRef<Map<string, any>>(new Map());
    const loadedKeyRef    = useRef('');
    const lastTimeRef     = useRef(0);
    const prevIndKeyRef   = useRef('');

    useImperativeHandle(ref, () => ({ nudgeChart: () => {} }));

    // ── Create chart ─────────────────────────────────────────────────────────
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      loadedKeyRef.current  = '';
      lastTimeRef.current   = 0;
      prevIndKeyRef.current = '';
      entryLinesRef.current.clear();

      const chart = createChart(container, {
        layout: {
          background: { type: ColorType.Solid, color: '#000000' },
          textColor: 'rgba(255,255,255,0.22)',
          fontSize: 10,
          fontFamily: "'JetBrains Mono', monospace",
        },
        grid: {
          vertLines: { color: 'rgba(255,255,255,0.03)' },
          horzLines: { color: 'rgba(255,255,255,0.03)' },
        },
        crosshair: {
          mode: 0,
          vertLine: { color: 'rgba(0,230,118,0.4)', width: 1, style: 2, labelBackgroundColor: '#00c853' },
          horzLine: { color: 'rgba(0,230,118,0.4)', width: 1, style: 2, labelBackgroundColor: '#00c853' },
        },
        rightPriceScale: {
          borderColor: 'rgba(255,255,255,0.05)',
          scaleMargins: { top: 0.06, bottom: 0.22 },
          entireTextOnly: true,
        },
        timeScale: {
          borderColor: 'rgba(255,255,255,0.05)',
          timeVisible: true,
          secondsVisible: false,
          rightOffset: 5,
          barSpacing: BAR_SPACING[interval] ?? 8,
          minBarSpacing: 2,
        },
        handleScroll:  { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
        handleScale:   { mouseWheel: true, pinch: true, axisPressedMouseMove: true, axisDoubleClickReset: { time: true, price: true } },
        width:  container.clientWidth  || 360,
        height: container.clientHeight || 320,
      });

      const cs = chart.addCandlestickSeries({
        upColor: GREEN, downColor: RED,
        borderUpColor: GREEN, borderDownColor: RED,
        wickUpColor: GREEN2, wickDownColor: RED2,
        priceLineVisible: true, priceLineWidth: 1,
        priceLineColor: 'rgba(0,230,118,0.45)', priceLineStyle: 2,
        lastValueVisible: true,
      });

      const vs = chart.addHistogramSeries({
        priceFormat: { type: 'volume' }, priceScaleId: 'volume',
        lastValueVisible: false, priceLineVisible: false,
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
        entryLinesRef.current.clear();
        try { chart.remove(); } catch {}
        chartRef.current = null;
        candleSeriesRef.current = null;
        volumeSeriesRef.current = null;
      };
    }, [pair]);

    // ── Update candle data ───────────────────────────────────────────────────
    useEffect(() => {
      const chart = chartRef.current;
      const cs    = candleSeriesRef.current;
      const vs    = volumeSeriesRef.current;
      if (!chart || !cs || !vs || candles.length === 0) return;

      const currentKey   = `${pair}-${interval}`;
      const needFullLoad = loadedKeyRef.current !== currentKey;
      const volColor     = (c: CandleData) =>
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

    // ── Sync entry price lines ───────────────────────────────────────────────
    useEffect(() => {
      const cs = candleSeriesRef.current;
      if (!cs) return;

      const linesMap = entryLinesRef.current;
      const tradeIds = new Set(activeTrades.map((t) => t.id));

      // Remove stale lines
      for (const [id, line] of linesMap.entries()) {
        if (!tradeIds.has(id)) {
          try { cs.removePriceLine(line); } catch {}
          linesMap.delete(id);
        }
      }

      // Add new lines
      for (const trade of activeTrades) {
        if (!linesMap.has(trade.id)) {
          try {
            const line = cs.createPriceLine({
              price: trade.entryPrice,
              color: trade.direction === 'up' ? 'rgba(0,230,118,0.8)' : 'rgba(255,23,68,0.8)',
              lineWidth: 1,
              lineStyle: LineStyle.Dashed,
              axisLabelVisible: true,
              title: trade.direction === 'up' ? '▲ Entry' : '▼ Entry',
            });
            linesMap.set(trade.id, line);
          } catch {}
        }
      }
    }, [activeTrades]);

    return (
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full"
        style={{
          filter: 'drop-shadow(0 0 5px rgba(0,230,118,0.32)) drop-shadow(0 0 2px rgba(255,23,68,0.18))',
        }}
      />
    );
  }
);

// ── Rebuild indicators (MA + RSI) ────────────────────────────────────────────
function rebuildIndicators(
  chart: any,
  candles: CandleData[],
  indicators: string[],
  refs: React.MutableRefObject<any[]>,
) {
  refs.current.forEach((s) => { try { chart.removeSeries(s); } catch {} });
  refs.current = [];

  const hasRSI = indicators.includes('RSI');

  // Adjust main price scale margins based on RSI presence
  chart.priceScale('right').applyOptions({
    scaleMargins: { top: 0.06, bottom: hasRSI ? 0.38 : 0.22 },
  });

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

  if (hasRSI) {
    const rsiData = calcRSI(candles, 14);
    if (rsiData.length > 0) {
      const rsiSeries = chart.addLineSeries({
        color: '#a78bfa',
        lineWidth: 1.5,
        priceScaleId: 'rsi',
        priceFormat: { type: 'price', precision: 1, minMove: 0.1 },
        lastValueVisible: true,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
      });
      chart.priceScale('rsi').applyOptions({
        scaleMargins: { top: 0.78, bottom: 0.0 },
        drawTicks: false,
        borderVisible: false,
        entireTextOnly: true,
      });
      rsiSeries.setData(rsiData);

      // Reference levels
      rsiSeries.createPriceLine({ price: 70, color: 'rgba(255,23,68,0.35)',   lineWidth: 1, lineStyle: LineStyle.Dotted, axisLabelVisible: false });
      rsiSeries.createPriceLine({ price: 30, color: 'rgba(0,230,118,0.35)',   lineWidth: 1, lineStyle: LineStyle.Dotted, axisLabelVisible: false });
      rsiSeries.createPriceLine({ price: 50, color: 'rgba(255,255,255,0.12)', lineWidth: 1, lineStyle: LineStyle.Dotted, axisLabelVisible: false });

      // RSI label overlay
      const labelSeries = chart.addLineSeries({
        color: 'transparent',
        lineWidth: 0,
        priceScaleId: 'rsi',
        lastValueVisible: false,
        priceLineVisible: false,
        visible: false,
      });
      refs.current.push(labelSeries);
      refs.current.push(rsiSeries);
    }
  }
}

LiveTradingChart.displayName = 'LiveTradingChart';
export default LiveTradingChart;
