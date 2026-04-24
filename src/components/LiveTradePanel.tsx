import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTrades } from '@/contexts/TradeContext';
import type { MarketTicker } from '@/hooks/useBinanceWebSocket';
import { setForcedBias, clearForcedBias } from '@/hooks/useForexFeed';
import { ArrowUp, ArrowDown, Clock, DollarSign, Zap, TrendingUp, Flame, ShieldAlert, BarChart2, Target, Users } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { playWinSound, playLossSound, playTradeOpenSound, triggerHaptic } from '@/lib/tradeSound';
import TradeResultOverlay from '@/components/TradeResultOverlay';
import type { TradeResult } from '@/components/TradeResultOverlay';

const timeOptions = [
  { label: '30s', seconds: 30 },
  { label: '1m',  seconds: 60 },
  { label: '3m',  seconds: 180 },
  { label: '5m',  seconds: 300 },
  { label: '15m', seconds: 900 },
];
const amountPresets = [1, 5, 10, 25, 50, 100, 250, 500];
const balancePercents = [5, 10, 25, 50, 100]; // % of balance

// Simulated market sentiment — shifts every 45 s per symbol
const getSentiment = (symbol: string) => {
  const seed = Math.floor(Date.now() / 45_000) * 31 + symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const raw  = ((Math.sin(seed) * 0.5 + 0.5) * 30) + 45; // 45–75%
  return Math.round(raw);
};

interface Props {
  ticker: MarketTicker | null;
  symbol: string;
  pairName: string;
  onForcedPriceNudge?: (direction: 'up' | 'down', entryPrice: number) => void;
}

const LiveTradePanel = ({ ticker, symbol, pairName, onForcedPriceNudge }: Props) => {
  const { user, updateBalance }  = useAuth();
  const { activeTrades, trades, addTrade, completeTrade, profitPercent } = useTrades();
  const [amount, setAmount]            = useState(10);
  const [selectedTime, setSelectedTime] = useState(60);
  const [coefficient, setCoefficient]  = useState(0.5);
  const [tradeResult, setTradeResult]  = useState<TradeResult | null>(null);
  const [sentiment, setSentiment]      = useState(() => getSentiment(symbol));
  const priceRef = useRef(ticker?.price || 0);

  useEffect(() => { if (ticker) priceRef.current = ticker.price; }, [ticker]);
  const dismissResult = useCallback(() => setTradeResult(null), []);

  // Refresh sentiment every 45 s
  useEffect(() => {
    setSentiment(getSentiment(symbol));
    const iv = setInterval(() => setSentiment(getSentiment(symbol)), 45_000);
    return () => clearInterval(iv);
  }, [symbol]);

  // ── Trade expiry ───────────────────────────────────────────────────────────
  // RIGGED: every trade wins. The chart was already pushed in the user's
  // direction during the last 5 s by the forced-bias registry in useForexFeed.
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      activeTrades.forEach((trade) => {
        if (now >= trade.expiryTime && priceRef.current > 0) {
          const nudge     = trade.entryPrice * 0.0008;
          const exitPrice = trade.direction === 'up'
            ? Math.max(priceRef.current, trade.entryPrice + nudge)
            : Math.min(priceRef.current, trade.entryPrice - nudge);
          completeTrade(trade.id, exitPrice);
          clearForcedBias(trade.id);
          // Random payout between 75% and 85% per trade
          const winPct = 75 + Math.random() * 10;
          const profit = trade.amount * (winPct / 100);
          updateBalance(trade.amount + profit);
          playWinSound();
          triggerHaptic('win');
          setTradeResult({ won: true, profit, amount: trade.amount, pairName, direction: trade.direction });
        }
      });
    }, 500);
    return () => clearInterval(interval);
  }, [activeTrades, completeTrade, updateBalance, profitPercent, pairName]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const { winStreak, todayTrades, todayPnl, todayWinRate } = useMemo(() => {
    const myCompleted = trades
      .filter((t) => t.userId === user?.id && t.status !== 'active')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    let winStreak = 0;
    for (const t of myCompleted) {
      if (t.status === 'won') winStreak++;
      else break;
    }

    const todayStr = new Date().toDateString();
    const todayTrades = myCompleted.filter((t) => new Date(t.timestamp).toDateString() === todayStr);
    const todayWins   = todayTrades.filter((t) => t.status === 'won').length;
    const todayPnl    = todayTrades.reduce((s, t) => s + (t.profit || 0), 0);
    const todayWinRate = todayTrades.length > 0 ? Math.round((todayWins / todayTrades.length) * 100) : 0;

    return { winStreak, todayTrades: todayTrades.length, todayPnl, todayWinRate };
  }, [trades, user?.id]);

  const balance       = user?.balance || 0;
  const riskPct       = balance > 0 ? (amount / balance) * 100 : 0;
  const riskLevel     = riskPct < 5 ? 'Low' : riskPct < 20 ? 'Medium' : 'High';
  const riskColor     = riskPct < 5 ? '#00e676' : riskPct < 20 ? '#ffd600' : '#ff1744';
  const riskBarPct    = Math.min(100, riskPct * 2);

  const executeTrade = (direction: 'up' | 'down') => {
    if (!user || !ticker) return;
    if (amount > user.balance) { toast.error('Insufficient balance. Please deposit funds.'); return; }
    if (amount <= 0)           { toast.error('Enter a valid amount'); return; }
    playTradeOpenSound();
    triggerHaptic('open');
    updateBalance(-amount);
    const trade = {
      id: `trade-${Date.now()}`,
      userId: user.id,
      symbol,
      direction,
      amount,
      entryPrice:  ticker.price,
      duration:    selectedTime,
      expiryTime:  Date.now() + selectedTime * 1000,
      status:      'active' as const,
      timestamp:   new Date().toISOString(),
    };
    addTrade(trade);
    // Rig the last 5 seconds of the chart toward the user's chosen direction
    setForcedBias({
      tradeId: trade.id,
      symbol,
      direction,
      entryPrice: ticker.price,
      startAt:  trade.expiryTime - 5000,
      expiryAt: trade.expiryTime + 200,
    });
    onForcedPriceNudge?.(direction, ticker.price);
    toast(`${direction === 'up' ? '📈' : '📉'} Trade opened`, {
      description: `${direction.toUpperCase()} $${amount} on ${pairName} @ $${ticker.price.toLocaleString()}`,
    });
  };

  const myActiveTrades  = activeTrades.filter((t) => t.symbol === symbol);
  const potentialProfit = amount * profitPercent / 100;
  const downPct         = 100 - sentiment;

  return (
    <>
      <TradeResultOverlay result={tradeResult} onDismiss={dismissResult} />

      <div className="flex-1 flex flex-col bg-surface-1/80 backdrop-blur-sm border-t border-border/40 overflow-y-auto">

        {/* Active trades */}
        <AnimatePresence>
          {myActiveTrades.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-3 pt-2"
            >
              {myActiveTrades.map((trade) => (
                <ActiveTradeCard
                  key={trade.id}
                  trade={trade}
                  currentPrice={ticker?.price || 0}
                  profitPercent={profitPercent}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Amount + Time */}
        <div className="flex gap-2 px-3 pt-3 pb-1">
          <div className="flex-1">
            <div className="flex items-center gap-1 mb-1">
              <DollarSign className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Amount</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-surface-2 border border-border/50 rounded-xl pl-7 pr-3 py-2.5 text-center font-mono text-base font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
            </div>
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {amountPresets.slice(0, 6).map((a) => (
                <button
                  key={a}
                  onClick={() => setAmount(a)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all ${
                    amount === a
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-surface-3/50 text-muted-foreground hover:text-foreground border border-transparent'
                  }`}
                >
                  ${a}
                </button>
              ))}
            </div>
          </div>

          <div className="w-[110px]">
            <div className="flex items-center gap-1 mb-1">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Time</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {timeOptions.map((t) => (
                <button
                  key={t.seconds}
                  onClick={() => setSelectedTime(t.seconds)}
                  className={`py-2 rounded-lg text-[11px] font-bold transition-all ${
                    selectedTime === t.seconds
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-surface-2 text-muted-foreground hover:text-foreground border border-border/30'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Coefficient selector (decorative) ───────────────────────────── */}
        <div className="px-3 pb-2">
          <div className="flex items-center gap-1 mb-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Coefficient</span>
            <span className="ml-auto font-mono text-[11px] font-bold text-primary">{coefficient.toFixed(1)}×</span>
          </div>
          <div className="flex gap-1">
            {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map((v) => (
              <button
                key={v}
                onClick={() => setCoefficient(v)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                  coefficient === v
                    ? 'bg-primary/20 text-primary border-primary/40 shadow-sm'
                    : 'bg-surface-2/70 text-muted-foreground hover:text-foreground border-border/30'
                }`}
              >
                {v.toFixed(1)}
              </button>
            ))}
          </div>
        </div>

        {/* ── NEW 1: Balance % quick bet ───────────────────────────────────── */}
        <div className="px-3 pb-2">
          <div className="flex items-center gap-1 mb-1.5">
            <Target className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">% of Balance</span>
            <span className="ml-auto text-[10px] font-mono text-muted-foreground">${balance.toFixed(2)}</span>
          </div>
          <div className="flex gap-1">
            {balancePercents.map((pct) => {
              const val = pct === 100 ? balance : Math.floor(balance * pct / 100);
              return (
                <button
                  key={pct}
                  onClick={() => setAmount(Math.max(1, val))}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                    Math.abs(amount - val) < 0.5
                      ? 'bg-primary/20 text-primary border-primary/30'
                      : 'bg-surface-2/80 text-muted-foreground hover:text-foreground border-border/30'
                  }`}
                >
                  {pct === 100 ? 'MAX' : `${pct}%`}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── NEW 2: Market Sentiment ───────────────────────────────────────── */}
        <div className="px-3 pb-2">
          <div className="flex items-center gap-1 mb-1.5">
            <Users className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Market Sentiment</span>
          </div>
          <div className="relative h-5 bg-surface-2 rounded-full overflow-hidden border border-border/30">
            <motion.div
              className="absolute left-0 top-0 h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #00e676, #00c853)' }}
              animate={{ width: `${sentiment}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
            <div className="absolute inset-0 flex items-center justify-between px-2.5">
              <span className="text-[10px] font-bold text-black/80 z-10">▲ {sentiment}%</span>
              <span className="text-[10px] font-bold text-white/70 z-10">{downPct}% ▼</span>
            </div>
          </div>
        </div>

        {/* ── NEW 3: Risk Meter ─────────────────────────────────────────────── */}
        <div className="px-3 pb-2">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Risk Level</span>
            </div>
            <span className="text-[10px] font-bold" style={{ color: riskColor }}>
              {riskLevel} · {riskPct.toFixed(1)}% of balance
            </span>
          </div>
          <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden border border-border/30">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, #00e676, ${riskColor})` }}
              animate={{ width: `${riskBarPct}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* ── NEW 4 + 5: Win Streak + Today's Stats ────────────────────────── */}
        <div className="px-3 pb-2 grid grid-cols-3 gap-2">
          {/* Win Streak */}
          <div className="bg-surface-2/60 border border-border/30 rounded-xl p-2 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Flame className={`w-3 h-3 ${winStreak > 0 ? 'text-orange-400' : 'text-muted-foreground'}`} />
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Streak</span>
            </div>
            <p className={`text-base font-black font-mono ${winStreak >= 3 ? 'text-orange-400' : winStreak > 0 ? 'text-trade-green' : 'text-muted-foreground'}`}>
              {winStreak > 0 ? `${winStreak}🔥` : '—'}
            </p>
          </div>

          {/* Today's Trades */}
          <div className="bg-surface-2/60 border border-border/30 rounded-xl p-2 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <BarChart2 className="w-3 h-3 text-muted-foreground" />
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Today</span>
            </div>
            <p className="text-base font-black font-mono text-foreground">{todayTrades}</p>
            <p className="text-[9px] text-muted-foreground">{todayWinRate}% win</p>
          </div>

          {/* Today's P&L */}
          <div className="bg-surface-2/60 border border-border/30 rounded-xl p-2 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <TrendingUp className="w-3 h-3 text-muted-foreground" />
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">P&amp;L</span>
            </div>
            <p className={`text-sm font-black font-mono ${todayPnl >= 0 ? 'text-trade-green' : 'text-trade-red'}`}>
              {todayPnl >= 0 ? '+' : ''}${todayPnl.toFixed(1)}
            </p>
          </div>
        </div>

        {/* Payout strip */}
        <div className="flex items-center justify-center gap-3 py-2 mx-3 mb-1 rounded-xl bg-surface-2/50 border border-border/30">
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-trade-yellow" />
            <span className="text-[10px] text-muted-foreground font-medium">Payout</span>
            <span className="text-xs font-bold text-primary">{profitPercent}%</span>
          </div>
          <span className="w-px h-3.5 bg-border/40" />
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-trade-green" />
            <span className="text-[10px] text-muted-foreground font-medium">Profit</span>
            <span className="text-xs font-mono font-bold text-trade-green">+${potentialProfit.toFixed(2)}</span>
          </div>
        </div>

        {/* Trade buttons */}
        <div className="flex gap-2.5 px-3 pb-3">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => executeTrade('up')}
            disabled={!ticker || activeTrades.length >= 5}
            className="flex-1 h-14 rounded-xl gradient-green-btn text-white font-extrabold text-base flex items-center justify-center gap-2 glow-green disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg"
          >
            <ArrowUp className="w-5 h-5" strokeWidth={3} />
            UP
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => executeTrade('down')}
            disabled={!ticker || activeTrades.length >= 5}
            className="flex-1 h-14 rounded-xl gradient-red-btn text-white font-extrabold text-base flex items-center justify-center gap-2 glow-red disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg"
          >
            <ArrowDown className="w-5 h-5" strokeWidth={3} />
            DOWN
          </motion.button>
        </div>
      </div>
    </>
  );
};

// ── Active trade card ─────────────────────────────────────────────────────────
const ActiveTradeCard = ({
  trade, currentPrice, profitPercent,
}: { trade: any; currentPrice: number; profitPercent: number }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => {
      setTimeLeft(Math.max(0, Math.ceil((trade.expiryTime - Date.now()) / 1000)));
    }, 100);
    return () => clearInterval(iv);
  }, [trade.expiryTime]);

  const isWinning = trade.direction === 'up'
    ? currentPrice > trade.entryPrice
    : currentPrice < trade.entryPrice;

  const potentialPnl = isWinning ? trade.amount * (profitPercent / 100) : -trade.amount;
  const m        = Math.floor(timeLeft / 60);
  const s        = timeLeft % 60;
  const progress = Math.min(100, ((trade.duration - timeLeft) / trade.duration) * 100);
  const urgency  = timeLeft <= 5 && timeLeft > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl p-2.5 mb-1.5 border backdrop-blur-sm ${
        isWinning ? 'bg-trade-green/5 border-trade-green/15' : 'bg-trade-red/5 border-trade-red/15'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
            trade.direction === 'up' ? 'bg-trade-green/15 text-trade-green' : 'bg-trade-red/15 text-trade-red'
          }`}>
            {trade.direction === 'up' ? '▲ UP' : '▼ DN'}
          </span>
          <span className="text-[11px] text-muted-foreground font-mono">${trade.amount}</span>
          <span className="text-[10px] text-muted-foreground font-mono">
            @ {trade.entryPrice.toFixed(trade.entryPrice > 100 ? 2 : 4)}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <motion.span
            key={potentialPnl.toFixed(2)}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className={`font-mono text-sm font-bold ${isWinning ? 'text-trade-green' : 'text-trade-red'}`}
          >
            {potentialPnl >= 0 ? '+' : '-'}${Math.abs(potentialPnl).toFixed(2)}
          </motion.span>
          <motion.span
            animate={urgency ? { scale: [1, 1.15, 1], color: ['#ff1744', '#ff6b6b', '#ff1744'] } : {}}
            transition={urgency ? { repeat: Infinity, duration: 0.6 } : {}}
            className="font-mono text-xs font-bold text-foreground bg-surface-3/60 px-1.5 py-0.5 rounded-md tabular-nums"
          >
            {m}:{s.toString().padStart(2, '0')}
          </motion.span>
        </div>
      </div>
      <div className="w-full bg-surface-3/50 rounded-full h-1 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${isWinning ? 'bg-trade-green' : 'bg-trade-red'}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'linear' }}
        />
      </div>
    </motion.div>
  );
};

export default LiveTradePanel;
