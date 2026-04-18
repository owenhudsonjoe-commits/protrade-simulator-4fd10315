import { useEffect, useState, useRef } from 'react';
import { TRADING_PAIRS } from '@/hooks/useBinanceWebSocket';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface MiniTicker {
  symbol: string;
  price: number;
  changePercent: number;
}

interface AssetCarouselProps {
  selectedSymbol: string;
  onSelect: (symbol: string) => void;
}

const AssetCarousel = ({ selectedSymbol, onSelect }: AssetCarouselProps) => {
  const [tickers, setTickers] = useState<Record<string, MiniTicker>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const symbols = TRADING_PAIRS.map((p) => p.symbol.toLowerCase());
    const streams = symbols.map((s) => `${s}@miniTicker`).join('/');
    const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const d = msg.data;
        if (!d) return;
        const open = parseFloat(d.o);
        const close = parseFloat(d.c);
        const changePercent = open > 0 ? ((close - open) / open) * 100 : 0;
        setTickers((prev) => ({
          ...prev,
          [d.s]: { symbol: d.s, price: close, changePercent },
        }));
      } catch {}
    };

    return () => ws.close();
  }, []);

  // Auto-scroll selected pair into view
  useEffect(() => {
    const el = scrollRef.current?.querySelector(`[data-symbol="${selectedSymbol}"]`);
    if (el) {
      (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedSymbol]);

  return (
    <div className="border-b border-border/30 bg-surface-1/40 backdrop-blur-sm shrink-0">
      <div
        ref={scrollRef}
        className="flex items-center gap-2 px-3 py-2 overflow-x-auto scrollbar-none"
        style={{ scrollbarWidth: 'none' }}
      >
        {TRADING_PAIRS.map((pair) => {
          const t = tickers[pair.symbol];
          const isActive = pair.symbol === selectedSymbol;
          const up = t ? t.changePercent >= 0 : true;

          return (
            <button
              key={pair.symbol}
              data-symbol={pair.symbol}
              onClick={() => onSelect(pair.symbol)}
              className={`shrink-0 flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all duration-200 ${
                isActive
                  ? 'bg-primary/15 border-primary/40 shadow-sm'
                  : 'bg-surface-2/60 border-border/40 hover:border-border hover:bg-surface-2'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                  isActive
                    ? 'bg-primary/25 text-primary'
                    : 'bg-surface-3/70 text-muted-foreground'
                }`}
              >
                {pair.icon}
              </div>
              <div className="text-left">
                <div className={`text-[10px] font-semibold leading-tight ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {pair.name.replace('/USDT', '')}
                </div>
                <div className="flex items-center gap-1 leading-tight">
                  <motion.span
                    key={t?.price}
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: 1 }}
                    className="text-[10px] font-mono font-bold text-foreground"
                  >
                    {t
                      ? t.price.toLocaleString(undefined, {
                          minimumFractionDigits: pair.decimals,
                          maximumFractionDigits: pair.decimals,
                        })
                      : '---'}
                  </motion.span>
                  {t && (
                    <span
                      className={`flex items-center text-[9px] font-semibold ${
                        up ? 'text-trade-green' : 'text-trade-red'
                      }`}
                    >
                      {up ? (
                        <TrendingUp className="w-2 h-2" />
                      ) : (
                        <TrendingDown className="w-2 h-2" />
                      )}
                      {t.changePercent.toFixed(2)}%
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AssetCarousel;
