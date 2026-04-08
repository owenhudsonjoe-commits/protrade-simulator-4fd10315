import { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import type { CandleData } from '@/hooks/useBinanceWebSocket';

interface Props {
  candles: CandleData[];
  pair: string;
}

const LiveTradingChart = ({ candles, pair }: Props) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const disposedRef = useRef(false);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    if (chartRef.current && !disposedRef.current) {
      try { chartRef.current.remove(); } catch (e) { /* already disposed */ }
    }
    disposedRef.current = false;

    const chart = createChart(chartContainerRef.current, {
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
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: '#1b1e23',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        barSpacing: 8,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#0ecb81',
      downColor: '#f6465d',
      borderDownColor: '#f6465d',
      borderUpColor: '#0ecb81',
      wickDownColor: '#f6465d',
      wickUpColor: '#0ecb81',
    });

    // Volume
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    chartRef.current = chart;
    seriesRef.current = { candles: candlestickSeries, volume: volumeSeries };

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [pair]);

  // Update data when candles change
  useEffect(() => {
    if (!seriesRef.current || candles.length === 0) return;

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
      color: c.close >= c.open ? 'rgba(14, 203, 129, 0.3)' : 'rgba(246, 70, 93, 0.3)',
    }));

    seriesRef.current.candles.setData(candleData);
    seriesRef.current.volume.setData(volumeData);

    if (chartRef.current) {
      chartRef.current.timeScale().scrollToRealTime();
    }
  }, [candles]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
};

export default LiveTradingChart;
