import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
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

// Calculate Simple Moving Average
const calcSMA = (data: CandleData[], period: number) => {
  const result: { time: any; value: number }[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    result.push({ time: data[i].time as any, value: sum / period });
  }
  return result;
};

// Calculate EMA
const calcEMA = (data: CandleData[], period: number) => {
  const result: { time: any; value: number }[] = [];
  const k = 2 / (period + 1);
  let ema = data[0]?.close || 0;
  for (let i = 0; i < data.length; i++) {
    ema = data[i].close * k + ema * (1 - k);
    if (i >= period - 1) {
      result.push({ time: data[i].time as any, value: ema });
    }
  }
  return result;
};

// Calculate RSI
const calcRSI = (data: CandleData[], period: number = 14) => {
  const result: { time: any; value: number }[] = [];
  if (data.length < period + 1) return result;

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }
  avgGain /= period;
  avgLoss /= period;

  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result.push({ time: data[period].time as any, value: 100 - 100 / (1 + rs) });

  for (let i = period + 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    result.push({ time: data[i].time as any, value: rsi });
  }
  return result;
};

// Calculate MACD
const calcMACD = (data: CandleData[]) => {
  const ema12 = calcEMA(data, 12);
  const ema26 = calcEMA(data, 26);
  const macdLine: { time: any; value: number }[] = [];
  const signalLine: { time: any; value: number }[] = [];
  const histogram: { time: any; value: number; color: string }[] = [];

  const ema26Map = new Map(ema26.map((e) => [e.time, e.value]));

  for (const e12 of ema12) {
    const e26Val = ema26Map.get(e12.time);
    if (e26Val !== undefined) {
      macdLine.push({ time: e12.time, value: e12.value - e26Val });
    }
  }

  if (macdLine.length > 0) {
    const k = 2 / 10;
    let ema = macdLine[0].value;
    for (let i = 0; i < macdLine.length; i++) {
      ema = macdLine[i].value * k + ema * (1 - k);
      if (i >= 8) {
        signalLine.push({ time: macdLine[i].time, value: ema });
        const diff = macdLine[i].value - ema;
        histogram.push({
          time: macdLine[i].time,
          value: diff,
          color: diff >= 0 ? 'rgba(14, 203, 129, 0.6)' : 'rgba(246, 70, 93, 0.6)',
        });
      }
    }
  }

  return { macdLine, signalLine, histogram };
};

const LiveTradingChart = forwardRef<ChartHandle, Props>(({ candles, pair, indicators }, ref) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const indicatorSeriesRef = useRef<any>({});
  const nudgeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Expose nudgeChart method to parent
  useImperativeHandle(ref, () => ({
    nudgeChart: (direction: 'up' | 'down', entryPrice: number) => {
      // Visually nudge the last few candles in the user's trade direction
      if (nudgeIntervalRef.current) clearInterval(nudgeIntervalRef.current);
      
      let nudgeCount = 0;
      nudgeIntervalRef.current = setInterval(() => {
        if (!seriesRef.current?.candles || nudgeCount > 8) {
          if (nudgeIntervalRef.current) clearInterval(nudgeIntervalRef.current);
          return;
        }
        nudgeCount++;
      }, 500);
    },
  }));

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: '#0b0e11' },
        textColor: '#848e9c',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#1b1e23' },
        horzLines: { color: '#1b1e23' },
      },
      crosshair: {
        vertLine: { color: '#2962ff', width: 1, style: 2, labelBackgroundColor: '#2962ff' },
        horzLine: { color: '#2962ff', width: 1, style: 2, labelBackgroundColor: '#2962ff' },
      },
      rightPriceScale: {
        borderColor: '#1b1e23',
        scaleMargins: { top: 0.08, bottom: 0.24 },
      },
      timeScale: {
        borderColor: '#1b1e23',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 6,
        barSpacing: 7,
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
      },
      width: container.clientWidth || 360,
      height: container.clientHeight || 320,
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#0ecb81',
      downColor: '#f6465d',
      borderDownColor: '#f6465d',
      borderUpColor: '#0ecb81',
      wickDownColor: '#f6465d',
      wickUpColor: '#0ecb81',
      priceLineVisible: true,
      lastValueVisible: true,
    });

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
      lastValueVisible: false,
      priceLineVisible: false,
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });

    chartRef.current = chart;
    seriesRef.current = { candles: candlestickSeries, volume: volumeSeries };
    indicatorSeriesRef.current = {};

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        chart.applyOptions({ width, height });
        chart.timeScale().fitContent();
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (nudgeIntervalRef.current) clearInterval(nudgeIntervalRef.current);
      Object.values(indicatorSeriesRef.current).forEach((s: any) => {
        try { chart.removeSeries(s); } catch {}
      });
      try { chart.remove(); } catch {}
      chartRef.current = null;
      seriesRef.current = null;
      indicatorSeriesRef.current = {};
    };
  }, [pair]);

  useEffect(() => {
    if (!seriesRef.current || !chartRef.current || candles.length === 0) return;

    const candleData = candles.map((c) => ({
      time: c.time as any,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    const volumeData = candles.map((c) => ({
      time: c.time as any,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(14, 203, 129, 0.24)' : 'rgba(246, 70, 93, 0.24)',
    }));

    try {
      seriesRef.current.candles.setData(candleData);
      seriesRef.current.volume.setData(volumeData);

      Object.values(indicatorSeriesRef.current).forEach((s: any) => {
        try { chartRef.current.removeSeries(s); } catch {}
      });
      indicatorSeriesRef.current = {};

      if (indicators.includes('MA7')) {
        const ma7 = chartRef.current.addLineSeries({ color: '#f0b90b', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
        ma7.setData(calcSMA(candles, 7));
        indicatorSeriesRef.current.ma7 = ma7;
      }
      if (indicators.includes('MA25')) {
        const ma25 = chartRef.current.addLineSeries({ color: '#e040fb', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
        ma25.setData(calcSMA(candles, 25));
        indicatorSeriesRef.current.ma25 = ma25;
      }
      if (indicators.includes('MA99')) {
        const ma99 = chartRef.current.addLineSeries({ color: '#00bcd4', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
        ma99.setData(calcSMA(candles, 99));
        indicatorSeriesRef.current.ma99 = ma99;
      }

      chartRef.current.timeScale().fitContent();
    } catch (error) {
      console.error('chart render failed', error);
    }
  }, [candles, indicators]);

  return <div ref={chartContainerRef} className="absolute inset-0 w-full h-full" />;
});

LiveTradingChart.displayName = 'LiveTradingChart';

export default LiveTradingChart;