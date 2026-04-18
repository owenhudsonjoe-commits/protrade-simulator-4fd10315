import { useState } from 'react';
import { TRADING_PAIRS } from '@/hooks/useBinanceWebSocket';
import type { MarketTicker } from '@/hooks/useBinanceWebSocket';
import { X, Search, TrendingUp, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (symbol: string) => void;
  currentSymbol: string;
  tickers: Record<string, MarketTicker>;
}

const AssetSelector = ({ isOpen, onClose, onSelect, currentSymbol, tickers }: Props) => {
  const [search, setSearch] = useState('');

  const filtered = TRADING_PAIRS.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm"
        >
          <div className="flex flex-col h-full max-w-lg mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Select Asset</h2>
              <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search trading pairs..."
                  className="w-full bg-muted border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto px-3 pb-4">
              {filtered.map((pair) => {
                const t = tickers[pair.symbol];
                const isActive = pair.symbol === currentSymbol;
                const changePos = t ? t.changePercent >= 0 : true;

                return (
                  <button
                    key={pair.symbol}
                    onClick={() => { onSelect(pair.symbol); onClose(); }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl mb-1 transition-colors ${
                      isActive ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                        isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        {pair.icon}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-foreground">{pair.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{pair.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono font-medium text-foreground">
                        {t ? t.price.toLocaleString(undefined, { minimumFractionDigits: pair.decimals, maximumFractionDigits: pair.decimals }) : pair.basePrice.toFixed(pair.decimals)}
                      </p>
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-xs font-bold text-trade-green">{pair.payout}%</span>
                        {t && (
                          <span className={`flex items-center gap-0.5 text-[10px] font-medium ${changePos ? 'text-trade-green' : 'text-trade-red'}`}>
                            {changePos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {`${changePos ? '+' : ''}${t.changePercent.toFixed(2)}%`}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AssetSelector;
