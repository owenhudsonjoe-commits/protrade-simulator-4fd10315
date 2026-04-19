import { useState, useEffect, useRef } from 'react';
import { useBinanceWebSocket, TRADING_PAIRS } from '@/hooks/useBinanceWebSocket';
import type { MarketTicker } from '@/hooks/useBinanceWebSocket';
import LiveTradingChart from '@/components/LiveTradingChart';
import type { ChartHandle } from '@/components/LiveTradingChart';
import LiveTradePanel from '@/components/LiveTradePanel';
import AssetSelector from '@/components/AssetSelector';
import AssetCarousel from '@/components/AssetCarousel';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { useTrades } from '@/contexts/TradeContext';
import { TrendingUp, TrendingDown, ChevronDown, Wallet, Clock, BarChart2, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const indicatorOptions = ['MA7', 'MA25', 'MA99', 'RSI', 'MACD'];
const timeframes = ['1m', '5m', '15m', '1h'];

const Trade = () => {
  const { user, logout } = useAuth();
  const { activeTrades } = useTrades();
  const [selectedSymbol, setSelectedSymbol] = useState('XAUUSD');
  const [showAssetSelector, setShowAssetSelector] = useState(false);
  const [allTickers, setAllTickers] = useState<Record<string, MarketTicker>>({});
  const [activeIndicators, setActiveIndicators] = useState<string[]>(['MA7', 'MA25']);
  const [showIndicators, setShowIndicators] = useState(false);
  const chartRef = useRef<ChartHandle>(null);

  const toggleIndicator = (ind: string) => {
    setActiveIndicators((prev) =>
      prev.includes(ind) ? prev.filter((i) => i !== ind) : [...prev, ind]
    );
  };

  const { ticker, candles, isConnected, interval, setInterval } = useBinanceWebSocket(selectedSymbol);
  const pair = TRADING_PAIRS.find((p) => p.symbol === selectedSymbol)!;

  useEffect(() => {
    if (ticker) {
      setAllTickers((prev) => ({ ...prev, [ticker.symbol]: ticker }));
    }
  }, [ticker]);

  const priceUp = ticker ? ticker.changePercent >= 0 : true;

  const handleForcedPriceNudge = (direction: 'up' | 'down', entryPrice: number) => {
    chartRef.current?.nudgeChart(direction, entryPrice);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16">
      {/* Compact premium header */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-surface-1/80 backdrop-blur-xl border-b border-border/50 shrink-0 z-10">
        <button
          onClick={() => setShowAssetSelector(true)}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary group-hover:border-primary/40 transition-colors">
            {pair.icon}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-foreground">{pair.display}</span>
              <span className="text-[9px] font-bold text-trade-green bg-trade-green/10 px-1.5 py-0.5 rounded">{pair.payout}%</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="flex items-center gap-1.5">
              {isConnected && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary live-dot" />
              )}
              <span className="text-[10px] text-muted-foreground">{isConnected ? 'Live' : 'Offline'}</span>
            </div>
          </div>
        </button>

        {/* Price display */}
        <div className="text-right">
          <div className="flex items-center gap-1.5 justify-end">
            <motion.p
              key={ticker?.price}
              initial={{ opacity: 0.6, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-lg font-mono font-bold tracking-tight ${priceUp ? 'text-trade-green' : 'text-trade-red'}`}
            >
              {ticker?.price.toLocaleString(undefined, { minimumFractionDigits: pair.decimals, maximumFractionDigits: pair.decimals }) || '---'}
            </motion.p>
          </div>
          <div className={`flex items-center gap-1 justify-end ${priceUp ? 'text-trade-green' : 'text-trade-red'}`}>
            <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${
              priceUp ? 'bg-trade-green/10' : 'bg-trade-red/10'
            }`}>
              {priceUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
              {ticker ? `${priceUp ? '+' : ''}${ticker.changePercent.toFixed(2)}%` : '---'}
            </div>
          </div>
        </div>

        {/* Balance chip */}
        <div className="flex items-center gap-1.5 bg-surface-2/80 border border-border/50 rounded-xl px-3 py-1.5">
          <Wallet className="w-3.5 h-3.5 text-primary" />
          <span className="font-mono text-sm font-bold text-foreground">
            ${user?.balance.toFixed(2)}
          </span>
        </div>
      </header>

      {/* Asset switcher carousel */}
      <AssetCarousel selectedSymbol={selectedSymbol} onSelect={setSelectedSymbol} />

      {/* Timeframe & controls bar */}
      <div className="flex items-center gap-1 px-3 py-1.5 bg-surface-1/50 backdrop-blur-sm border-b border-border/30 shrink-0">
        <div className="flex items-center bg-surface-2/60 rounded-lg p-0.5">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setInterval(tf)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all duration-200 ${
                interval === tf
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowIndicators(!showIndicators)}
          className={`p-1.5 rounded-lg text-xs font-medium ml-1 transition-all ${
            showIndicators ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-surface-2'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
        </button>

        <div className="ml-auto flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
          <span className="flex items-center gap-1">
            <span className="text-muted-foreground/60">H</span>
            <span className="text-trade-green">{ticker?.high.toLocaleString(undefined, { minimumFractionDigits: pair.decimals, maximumFractionDigits: pair.decimals }) || '---'}</span>
          </span>
          <span className="w-px h-3 bg-border/50" />
          <span className="flex items-center gap-1">
            <span className="text-muted-foreground/60">L</span>
            <span className="text-trade-red">{ticker?.low.toLocaleString(undefined, { minimumFractionDigits: pair.decimals, maximumFractionDigits: pair.decimals }) || '---'}</span>
          </span>
          <span className="w-px h-3 bg-border/50" />
          <span className="flex items-center gap-1">
            <span className="text-muted-foreground/60">V</span>
            <span>{ticker ? `${(ticker.volume / 1000).toFixed(0)}K` : '---'}</span>
          </span>
        </div>
      </div>

      {/* Indicator toggles */}
      <AnimatePresence>
        {showIndicators && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-border/30 bg-surface-2/30"
          >
            <div className="flex items-center gap-1.5 px-3 py-2">
              <BarChart2 className="w-3 h-3 text-muted-foreground mr-0.5" />
              {indicatorOptions.map((ind) => (
                <button
                  key={ind}
                  onClick={() => toggleIndicator(ind)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all duration-200 ${
                    activeIndicators.includes(ind)
                      ? 'bg-primary/15 text-primary border border-primary/25 shadow-sm'
                      : 'bg-surface-3/50 text-muted-foreground hover:text-foreground border border-transparent'
                  }`}
                >
                  {ind}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chart area */}
      <div className="relative shrink-0 h-[300px] sm:h-[360px] overflow-hidden" style={{ background: '#000000' }}>

        {/* Dot grid — subtle, like the reference image */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />

        {/* Ambient green glow — radiates upward from the bottom like light from candles */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background: 'radial-gradient(ellipse 80% 40% at 50% 110%, rgba(0,230,118,0.07) 0%, transparent 70%)',
            mixBlendMode: 'screen',
          }}
        />

        {/* Chart canvas */}
        <div className="absolute inset-0 z-10">
          <LiveTradingChart
            ref={chartRef}
            candles={candles}
            pair={selectedSymbol}
            indicators={activeIndicators}
            interval={interval}
            activeTrades={activeTrades.filter((t) => t.symbol === selectedSymbol)}
          />
        </div>

        {/* Bottom fade — blends chart into page */}
        <div className="absolute bottom-0 left-0 right-0 h-6 z-20 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}
        />
      </div>

      {/* Trade panel */}
      <LiveTradePanel
        ticker={ticker}
        symbol={selectedSymbol}
        pairName={pair.display}
        onForcedPriceNudge={handleForcedPriceNudge}
      />

      {/* Asset selector modal */}
      <AssetSelector
        isOpen={showAssetSelector}
        onClose={() => setShowAssetSelector(false)}
        onSelect={setSelectedSymbol}
        currentSymbol={selectedSymbol}
        tickers={allTickers}
      />

      <BottomNav />
    </div>
  );
};

export default Trade;
