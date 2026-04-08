import { useState, useEffect } from 'react';
import { useBinanceWebSocket, TRADING_PAIRS } from '@/hooks/useBinanceWebSocket';
import type { MarketTicker } from '@/hooks/useBinanceWebSocket';
import LiveTradingChart from '@/components/LiveTradingChart';
import LiveTradePanel from '@/components/LiveTradePanel';
import AssetSelector from '@/components/AssetSelector';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp, TrendingDown, LogOut, ChevronDown, Wifi, WifiOff, Clock } from 'lucide-react';

const timeframes = ['1m', '5m', '15m', '1h'];

const Trade = () => {
  const { user, logout } = useAuth();
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [showAssetSelector, setShowAssetSelector] = useState(false);
  const [allTickers, setAllTickers] = useState<Record<string, MarketTicker>>({});

  const { ticker, candles, isConnected, interval, setInterval } = useBinanceWebSocket(selectedSymbol);
  const pair = TRADING_PAIRS.find((p) => p.symbol === selectedSymbol)!;

  // Store tickers from multiple symbols
  useEffect(() => {
    if (ticker) {
      setAllTickers((prev) => ({ ...prev, [ticker.symbol]: ticker }));
    }
  }, [ticker]);

  const priceUp = ticker ? ticker.changePercent >= 0 : true;

  return (
    <div className="min-h-screen bg-background flex flex-col pb-14">
      {/* Top header bar */}
      <header className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface-1 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm text-foreground">DemoTrade</span>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Wifi className="w-3.5 h-3.5 text-trade-green" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-trade-red" />
          )}
          <div className="bg-muted rounded-lg px-2.5 py-1">
            <span className="font-mono text-sm font-bold text-primary">
              ${user?.balance.toFixed(2)}
            </span>
          </div>
          <button onClick={logout} className="text-muted-foreground hover:text-foreground p-1">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Asset ticker bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-surface-2 border-b border-border shrink-0">
        <button
          onClick={() => setShowAssetSelector(true)}
          className="flex items-center gap-2 hover:bg-muted rounded-lg px-2 py-1 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
            {pair.icon}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-foreground">{pair.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          </div>
        </button>

        <div className="text-right">
          <p className={`text-lg font-mono font-bold ${priceUp ? 'text-trade-green' : 'text-trade-red'}`}>
            ${ticker?.price.toLocaleString(undefined, { minimumFractionDigits: pair.decimals, maximumFractionDigits: pair.decimals }) || '---'}
          </p>
          <div className={`flex items-center gap-1 justify-end text-xs ${priceUp ? 'text-trade-green' : 'text-trade-red'}`}>
            {priceUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {ticker ? `${priceUp ? '+' : ''}${ticker.changePercent.toFixed(2)}%` : '---'}
          </div>
        </div>
      </div>

      {/* Timeframe selector */}
      <div className="flex items-center gap-1 px-3 py-1.5 bg-surface-1 border-b border-border shrink-0">
        <Clock className="w-3 h-3 text-muted-foreground mr-1" />
        {timeframes.map((tf) => (
          <button
            key={tf}
            onClick={() => setInterval(tf)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              interval === tf
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {tf}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>H: <span className="text-trade-green font-mono">${ticker?.high.toLocaleString() || '---'}</span></span>
          <span>L: <span className="text-trade-red font-mono">${ticker?.low.toLocaleString() || '---'}</span></span>
        </div>
      </div>

      {/* Chart area */}
      <div className="flex-1 min-h-0">
        <LiveTradingChart candles={candles} pair={selectedSymbol} />
      </div>

      {/* Trade panel */}
      <LiveTradePanel ticker={ticker} symbol={selectedSymbol} pairName={pair.name} />

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
