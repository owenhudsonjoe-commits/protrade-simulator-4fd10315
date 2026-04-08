import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowUp, ArrowDown, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const timeOptions = ['30s', '1m', '3m', '5m', '15m'];
const amountPresets = [1, 5, 10, 25, 50, 100];

const TradePanel = () => {
  const { user, updateBalance } = useAuth();
  const [amount, setAmount] = useState(10);
  const [selectedTime, setSelectedTime] = useState('1m');
  const [activeTrade, setActiveTrade] = useState<{
    direction: 'up' | 'down';
    amount: number;
    timeLeft: number;
  } | null>(null);
  const [tradeResult, setTradeResult] = useState<{ won: boolean; profit: number } | null>(null);

  const executeTrade = (direction: 'up' | 'down') => {
    if (!user) return;
    if (amount > user.balance) {
      toast.error('Insufficient balance');
      return;
    }
    if (amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    const timeSeconds = selectedTime === '30s' ? 30 : parseInt(selectedTime) * 60;
    updateBalance(-amount);
    setActiveTrade({ direction, amount, timeLeft: timeSeconds });
    setTradeResult(null);

    // Countdown
    let remaining = timeSeconds;
    const countdown = setInterval(() => {
      remaining--;
      setActiveTrade((prev) => prev ? { ...prev, timeLeft: remaining } : null);
      if (remaining <= 0) {
        clearInterval(countdown);
        // Simulate result: ~45% win rate
        const won = Math.random() < 0.45;
        const profit = won ? amount * 0.82 : 0;
        const totalReturn = won ? amount + profit : 0;
        updateBalance(totalReturn);
        setTradeResult({ won, profit: won ? profit : -amount });
        setActiveTrade(null);
        if (won) {
          toast.success(`Trade won! +$${profit.toFixed(2)}`);
        } else {
          toast.error(`Trade lost! -$${amount.toFixed(2)}`);
        }
      }
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-3 p-3 bg-surface-1 rounded-xl border border-border">
      {/* Balance display */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">Balance</p>
        <p className="text-lg font-bold font-mono text-foreground">
          ${user?.balance.toFixed(2) || '0.00'}
        </p>
      </div>

      {/* Time selector */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Clock className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Duration</span>
        </div>
        <div className="flex gap-1">
          {timeOptions.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTime(t)}
              className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${
                selectedTime === t
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div>
        <span className="text-xs text-muted-foreground mb-2 block">Amount ($)</span>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-center font-mono text-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <div className="flex gap-1 mt-2">
          {amountPresets.map((a) => (
            <button
              key={a}
              onClick={() => setAmount(a)}
              className="flex-1 py-1 rounded text-xs bg-muted text-muted-foreground hover:bg-accent transition-colors"
            >
              ${a}
            </button>
          ))}
        </div>
      </div>

      {/* Active trade display */}
      <AnimatePresence>
        {activeTrade && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`rounded-lg p-3 text-center ${
              activeTrade.direction === 'up' ? 'bg-trade-green/10 border border-trade-green/30' : 'bg-trade-red/10 border border-trade-red/30'
            }`}
          >
            <p className="text-xs text-muted-foreground">Active Trade</p>
            <p className={`text-2xl font-mono font-bold ${activeTrade.direction === 'up' ? 'text-trade-green' : 'text-trade-red'}`}>
              {formatTime(activeTrade.timeLeft)}
            </p>
            <p className="text-xs text-muted-foreground">
              {activeTrade.direction.toUpperCase()} · ${activeTrade.amount}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trade result */}
      <AnimatePresence>
        {tradeResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`rounded-lg p-2 text-center text-sm font-medium ${
              tradeResult.won ? 'bg-trade-green/10 text-trade-green' : 'bg-trade-red/10 text-trade-red'
            }`}
          >
            {tradeResult.won ? `Won +$${tradeResult.profit.toFixed(2)}` : `Lost $${Math.abs(tradeResult.profit).toFixed(2)}`}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trade buttons */}
      <div className="flex gap-2">
        <Button
          variant="tradeUp"
          className="flex-1 h-12 text-base"
          onClick={() => executeTrade('up')}
          disabled={!!activeTrade}
        >
          <ArrowUp className="w-5 h-5 mr-1" />
          UP
        </Button>
        <Button
          variant="tradeDown"
          className="flex-1 h-12 text-base"
          onClick={() => executeTrade('down')}
          disabled={!!activeTrade}
        >
          <ArrowDown className="w-5 h-5 mr-1" />
          DOWN
        </Button>
      </div>
    </div>
  );
};

export default TradePanel;
