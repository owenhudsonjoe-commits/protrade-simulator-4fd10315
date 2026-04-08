import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';

const generateCandlestickData = (count: number) => {
  const data = [];
  let time = Math.floor(Date.now() / 1000) - count * 60;
  let open = 1.1000 + Math.random() * 0.05;

  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.48) * 0.003;
    const high = open + Math.random() * 0.002;
    const low = open - Math.random() * 0.002;
    const close = open + change;
    data.push({
      time: time as any,
      open: parseFloat(open.toFixed(5)),
      high: parseFloat(Math.max(high, open, close).toFixed(5)),
      low: parseFloat(Math.min(low, open, close).toFixed(5)),
      close: parseFloat(close.toFixed(5)),
    });
    open = close;
    time += 60;
  }
  return data;
};

const TradingChart = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const [currentPrice, setCurrentPrice] = useState(0);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0a0d12' },
        textColor: '#8c8c8c',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#1a1f2a' },
        horzLines: { color: '#1a1f2a' },
      },
      crosshair: {
        vertLine: { color: '#22c55e', width: 1, style: 2 },
        horzLine: { color: '#22c55e', width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: '#1e2530',
      },
      timeScale: {
        borderColor: '#1e2530',
        timeVisible: true,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      wickUpColor: '#22c55e',
    });

    const data = generateCandlestickData(100);
    candlestickSeries.setData(data);
    chart.timeScale().fitContent();

    const lastCandle = data[data.length - 1];
    setCurrentPrice(lastCandle.close);

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    // Live update simulation
    const interval = setInterval(() => {
      const lastData = data[data.length - 1];
      const change = (Math.random() - 0.48) * 0.0015;
      const newClose = lastData.close + change;
      const newCandle = {
        time: (lastData.time as number) + 60,
        open: lastData.close,
        high: Math.max(lastData.close, newClose) + Math.random() * 0.001,
        low: Math.min(lastData.close, newClose) - Math.random() * 0.001,
        close: parseFloat(newClose.toFixed(5)),
      };
      data.push(newCandle as any);
      candlestickSeries.update(newCandle as any);
      setCurrentPrice(newCandle.close);
    }, 2000);

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
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-2 left-2 z-10 flex items-center gap-3">
        <span className="text-xs font-medium text-muted-foreground">EUR/USD</span>
        <span className="font-mono text-sm font-bold text-foreground">
          {currentPrice.toFixed(5)}
        </span>
      </div>
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
};

export default TradingChart;
