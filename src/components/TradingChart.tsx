import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';

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
        background: { type: ColorType.Solid, color: 'hsl(220, 20%, 5%)' },
        textColor: 'hsl(0, 0%, 55%)',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'hsl(220, 14%, 12%)' },
        horzLines: { color: 'hsl(220, 14%, 12%)' },
      },
      crosshair: {
        vertLine: { color: 'hsl(145, 80%, 42%)', width: 1, style: 2 },
        horzLine: { color: 'hsl(145, 80%, 42%)', width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: 'hsl(220, 14%, 18%)',
      },
      timeScale: {
        borderColor: 'hsl(220, 14%, 18%)',
        timeVisible: true,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: 'hsl(145, 80%, 42%)',
      downColor: 'hsl(0, 72%, 51%)',
      borderDownColor: 'hsl(0, 72%, 51%)',
      borderUpColor: 'hsl(145, 80%, 42%)',
      wickDownColor: 'hsl(0, 72%, 51%)',
      wickUpColor: 'hsl(145, 80%, 42%)',
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
