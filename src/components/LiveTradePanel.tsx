import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTrades } from '@/contexts/TradeContext';
import type { MarketTicker } from '@/hooks/useBinanceWebSocket';
import { ArrowUp, ArrowDown, Clock, DollarSign, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const timeOptions = [
  { label: '30s', seconds: 30 },
  { label: '1m', seconds: 60 },
  { label: '3m', seconds: 180 },
  { label: '5m', seconds: 300 },
  { label: '15m', seconds: 900 },
];
const amountPresets = [1, 5, 10, 25, 50, 100, 250, 500];

interface Props {
  ticker: MarketTicker | null;
  symbol: string;
  pairName: string;
}

const LiveTradePanel = ({ ticker, symbol, pairName }: Props) => {
  const { user, updateBalance } = useAuth();
  const { activeTrades, addTrade, completeTrade, profitPercent } = useTrades();
  const [amount, setAmount] = useState(10);
  const [selectedTime, setSelectedTime] = useState(60);
  const priceRef = useRef(ticker?.price || 0);

  useEffect(() => {
    if (ticker) priceRef.current = ticker.price;
  }, [ticker]);

  // Check active trades for expiry
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      activeTrades.forEach((trade) => {
        if (now >= trade.expiryTime && priceRef.current > 0) {
          // 70-80% guaranteed win rate
          const winChance = 0.70 + Math.random() * 0.10; // 70-80%
          const forceWin = Math.random() < winChance;
          
          let exitPrice = priceRef.current;
          if (forceWin) {
            // Nudge exit price to guarantee win
            const nudge = trade.entryPrice * 0.0001 * (0.5 + Math.random());
            exitPrice = trade.direction === 'up'
              ? trade.entryPrice + nudge
              : trade.entryPrice - nudge;
          }
          
          completeTrade(trade.id, exitPrice);
          const won = trade.direction === 'up'
            ? exitPrice > trade.entryPrice
            : exitPrice < trade.entryPrice;
          const profit = won ? trade.amount * (profitPercent / 100) : -trade.amount;
          updateBalance(won ? trade.amount + trade.amount * (profitPercent / 100) : 0);

          if (won) {
            toast.success(`🎉 Trade WON! +$${(trade.amount * (profitPercent / 100)).toFixed(2)}`, {
              description: `${trade.direction.toUpperCase()} ${pairName}`,
            });
          } else {
            toast.error(`Trade LOST -$${trade.amount.toFixed(2)}`, {
              description: `${trade.direction.toUpperCase()} ${pairName}`,
            });
          }
        }
      });
    }, 500);
    return () => clearInterval(interval);
  }, [activeTrades, completeTrade, updateBalance, profitPercent, pairName]);

  const executeTrade = (direction: 'up' | 'down') => {
    if (!user || !ticker) return;
    if (amount > user.balance) {
      toast.error('Insufficient balance');
      return;
    }
    if (amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    updateBalance(-amount);
    const trade = {
      id: `trade-${Date.now()}`,
      userId: user.id,
      symbol,
      direction,
      amount,
      entryPrice: ticker.price,
      duration: selectedTime,
      expiryTime: Date.now() + selectedTime * 1000,
      status: 'active' as const,
      timestamp: new Date().toISOString(),
    };
    addTrade(trade);
    toast(`${direction === 'up' ? '📈' : '📉'} Trade opened`, {
      description: `${direction.toUpperCase()} $${amount} on ${pairName} @ $${ticker.price.toLocaleString()}`,
    });
  };

  const myActiveTrades = activeTrades.filter((t) => t.symbol === symbol);

  return (
    <div className="flex flex-col gap-2.5 p-3 bg-surface-1 border-t border-border">
      {/* Active trades indicator */}
      <AnimatePresence>
        {myActiveTrades.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {myActiveTrades.map((trade) => (
              <ActiveTradeCard key={trade.id} trade={trade} currentPrice={ticker?.price || 0} profitPercent={profitPercent} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Amount & Time row */}
      <div className="flex gap-2">
        {/* Amount */}
        <div className="flex-1">
          <div className="flex items-center gap-1 mb-1.5">
            <DollarSign className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Amount</span>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full bg-muted border border-border rounded-lg pl-7 pr-3 py-2 text-center font-mono text-base text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {amountPresets.map((a) => (
              <button
                key={a}
                onClick={() => setAmount(a)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  amount === a ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="w-28">
          <div className="flex items-center gap-1 mb-1.5">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Duration</span>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {timeOptions.map((t) => (
              <button
                key={t.seconds}
                onClick={() => setSelectedTime(t.seconds)}
                className={`py-1.5 rounded text-xs font-medium transition-colors ${
                  selectedTime === t.seconds
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payout info */}
      <div className="flex items-center justify-center gap-2 text-xs">
        <Zap className="w-3 h-3 text-trade-yellow" />
        <span className="text-muted-foreground">Payout: </span>
        <span className="font-bold text-primary">{profitPercent}%</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">Profit: </span>
        <span className="font-mono font-bold text-trade-green">${(amount * profitPercent / 100).toFixed(2)}</span>
      </div>

      {/* Trade buttons */}
      <div className="flex gap-2">
        <Button
          variant="tradeUp"
          className="flex-1 h-12 text-base glow-green"
          onClick={() => executeTrade('up')}
          disabled={!ticker || activeTrades.length >= 5}
        >
          <ArrowUp className="w-5 h-5 mr-1" />
          UP
        </Button>
        <Button
          variant="tradeDown"
          className="flex-1 h-12 text-base glow-red"
          onClick={() => executeTrade('down')}
          disabled={!ticker || activeTrades.length >= 5}
        >
          <ArrowDown className="w-5 h-5 mr-1" />
          DOWN
        </Button>
      </div>
    </div>
  );
};

const ActiveTradeCard = ({ trade, currentPrice, profitPercent }: { trade: any; currentPrice: number; profitPercent: number }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((trade.expiryTime - Date.now()) / 1000));
      setTimeLeft(remaining);
    }, 100);
    return () => clearInterval(interval);
  }, [trade.expiryTime]);

  const isWinning = trade.direction === 'up'
    ? currentPrice > trade.entryPrice
    : currentPrice < trade.entryPrice;

  const potentialPnl = isWinning
    ? trade.amount * (profitPercent / 100)
    : -trade.amount;

  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  const progress = ((trade.duration - timeLeft) / trade.duration) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-lg p-2.5 mb-1.5 border ${
        isWinning ? 'bg-trade-green/5 border-trade-green/20' : 'bg-trade-red/5 border-trade-red/20'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
            trade.direction === 'up' ? 'bg-trade-green/20 text-trade-green' : 'bg-trade-red/20 text-trade-red'
          }`}>
            {trade.direction === 'up' ? '▲ UP' : '▼ DOWN'}
          </span>
          <span className="text-xs text-muted-foreground font-mono">${trade.amount}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-mono text-sm font-bold ${isWinning ? 'text-trade-green' : 'text-trade-red'}`}>
            {potentialPnl >= 0 ? '+' : ''}{potentialPnl.toFixed(2)}
          </span>
          <span className="font-mono text-sm font-bold text-foreground">{m}:{s.toString().padStart(2, '0')}</span>
        </div>
      </div>
      <div className="w-full bg-muted rounded-full h-1">
        <div
          className={`h-1 rounded-full transition-all ${isWinning ? 'bg-trade-green' : 'bg-trade-red'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
};

export default LiveTradePanel;
