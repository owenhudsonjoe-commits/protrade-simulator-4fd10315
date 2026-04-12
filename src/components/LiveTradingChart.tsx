import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import type { CandleData } from '@/hooks/useBinanceWebSocket';

interface Props {
  candles: CandleData[];
  pair: string;
  indicators: string[];
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

const calcEMA = (data: CandleData[], period: number) => {
  const result: { time: any; value: number }[] = [];
  const k = 2 / (period + 1);
  let ema = data[0]?.close || 0;
  for (let i = 0; i < data.length; i++) {
    ema = data[i].close * k + ema * (1 - k);
    if (i >= period - 1) result.push({ time: data[i].time as any, value: ema });
  }
  return result;
};

const LiveTradingChart = forwardRef<ChartHandle, Props>(({ candles, pair, indicators }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const indicatorSeriesRef = useRef<Record<string, any>>({});
  const isInitialLoadRef = useRef(true);
  const prevCandleLenRef = useRef(0);
  const prevIndicatorsRef = useRef<string[]>([]);

  useImperativeHandle(ref, () => ({
    nudgeChart: () => {},
  }));

  // Create chart once per pair
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    isInitialLoadRef.current = true;
    prevCandleLenRef.current = 0;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: '#0a0c0f' },
        textColor: '#6b7280',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.4)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.4)' },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: 'rgba(41, 98, 255, 0.5)', width: 1, style: 2, labelBackgroundColor: '#2962ff' },
        horzLine: { color: 'rgba(41, 98, 255, 0.5)', width: 1, style: 2, labelBackgroundColor: '#2962ff' },
      },
      rightPriceScale: {
        borderColor: 'rgba(42, 46, 57, 0.5)',
        scaleMargins: { top: 0.05, bottom: 0.2 },
        entireTextOnly: true,
      },
      timeScale: {
        borderColor: 'rgba(42, 46, 57, 0.5)',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 8,
        barSpacing: 8,
        minBarSpacing: 2,
        fixLeftEdge: false,
        fixRightEdge: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      handleScale: {
        mouseWheel: true,
        pinch: true,
        axisPressedMouseMove: true,
        axisDoubleClickReset: { time: true, price: true },
      },
      width: container.clientWidth || 360,
      height: container.clientHeight || 320,
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#22c55e',
      wickDownColor: '#ef4444aa',
      wickUpColor: '#22c55eaa',
      priceLineVisible: true,
      priceLineWidth: 1,
      priceLineColor: '#3b82f6',
      priceLineStyle: 2,
      lastValueVisible: true,
    });

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
      lastValueVisible: false,
      priceLineVisible: false,
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    chartRef.current = chart;
    seriesRef.current = { candles: candleSeries, volume: volumeSeries };
    indicatorSeriesRef.current = {};

    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0]?.contentRect || {};
      if (width && height) chart.applyOptions({ width, height });
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      Object.values(indicatorSeriesRef.current).forEach((s: any) => {
        try { chart.removeSeries(s); } catch {}
      });
      try { chart.remove(); } catch {}
      chartRef.current = null;
      seriesRef.current = null;
      indicatorSeriesRef.current = {};
    };
  }, [pair]);

  // Update data incrementally — NO fitContent on updates
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current || candles.length === 0) return;

    const chart = chartRef.current;
    const { candles: candleSeries, volume: volumeSeries } = seriesRef.current;
    const isInitial = isInitialLoadRef.current;
    const prevLen = prevCandleLenRef.current;

    try {
      if (isInitial || Math.abs(candles.length - prevLen) > 5) {
        // Full data load (initial or timeframe change)
        candleSeries.setData(candles.map((c: CandleData) => ({
          time: c.time as any, open: c.open, high: c.high, low: c.low, close: c.close,
        })));
        volumeSeries.setData(candles.map((c: CandleData) => ({
          time: c.time as any, value: c.volume,
          color: c.close >= c.open ? 'rgba(34, 197, 94, 0.18)' : 'rgba(239, 68, 68, 0.18)',
        })));

        if (isInitial) {
          chart.timeScale().fitContent();
          isInitialLoadRef.current = false;
        }
      } else {
        // Incremental update — only update the last candle
        const last = candles[candles.length - 1];
        candleSeries.update({
          time: last.time as any, open: last.open, high: last.high, low: last.low, close: last.close,
        });
        volumeSeries.update({
          time: last.time as any, value: last.volume,
          color: last.close >= last.open ? 'rgba(34, 197, 94, 0.18)' : 'rgba(239, 68, 68, 0.18)',
        });
      }

      prevCandleLenRef.current = candles.length;

      // Update indicators only if they changed
      const indKey = indicators.join(',');
      const prevKey = prevIndicatorsRef.current.join(',');
      if (indKey !== prevKey || isInitial || Math.abs(candles.length - prevLen) > 5) {
        Object.values(indicatorSeriesRef.current).forEach((s: any) => {
          try { chart.removeSeries(s); } catch {}
        });
        indicatorSeriesRef.current = {};

        if (indicators.includes('MA7')) {
          const s = chart.addLineSeries({ color: '#f59e0b', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
          s.setData(calcSMA(candles, 7));
          indicatorSeriesRef.current.ma7 = s;
        }
        if (indicators.includes('MA25')) {
          const s = chart.addLineSeries({ color: '#a855f7', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
          s.setData(calcSMA(candles, 25));
          indicatorSeriesRef.current.ma25 = s;
        }
        if (indicators.includes('MA99')) {
          const s = chart.addLineSeries({ color: '#06b6d4', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
          s.setData(calcSMA(candles, 99));
          indicatorSeriesRef.current.ma99 = s;
        }
        prevIndicatorsRef.current = [...indicators];
      }
    } catch (e) {
      console.error('Chart update error:', e);
    }
  }, [candles, indicators]);

  return <div ref={containerRef} className="absolute inset-0 w-full h-full" />;
});

LiveTradingChart.displayName = 'LiveTradingChart';
export default LiveTradingChart;
