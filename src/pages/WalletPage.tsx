import { useAuth } from '@/contexts/AuthContext';
import { useTrades } from '@/contexts/TradeContext';
import BottomNav from '@/components/BottomNav';
import PerformanceStats from '@/components/PerformanceStats';
import { Wallet, TrendingUp, TrendingDown, DollarSign, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const WalletPage = () => {
  const { user } = useAuth();
  const { trades } = useTrades();
  const navigate = useNavigate();
  const balance = user?.balance || 0;
  
  const myTrades = trades.filter((t) => t.userId === user?.id && t.status !== 'active');
  const totalDeposited = JSON.parse(localStorage.getItem('uv_deposits') || '[]')
    .filter((d: any) => d.userId === user?.id && d.status === 'approved')
    .reduce((s: number, d: any) => s + d.amount, 0);
  
  const pnl = balance - totalDeposited;
  const pnlPercent = totalDeposited > 0 ? ((pnl / totalDeposited) * 100).toFixed(1) : '0';
  const totalWins = myTrades.filter((t) => t.status === 'won').length;
  const winRate = myTrades.length > 0 ? ((totalWins / myTrades.length) * 100).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="px-4 py-4 border-b border-border bg-surface-1">
        <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary" />
          Wallet
        </h1>
      </header>

      <div className="p-4 space-y-4">
        {/* Main balance */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 text-center"
        >
          <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
          <p className="text-3xl font-bold font-mono text-foreground">${balance.toFixed(2)}</p>
          {totalDeposited > 0 && (
            <div className={`inline-flex items-center gap-1 mt-2 text-sm font-medium ${pnl >= 0 ? 'text-trade-green' : 'text-trade-red'}`}>
              {pnl >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {pnl >= 0 ? '+' : ''}{pnlPercent}% ({pnl >= 0 ? '+' : ''}${pnl.toFixed(2)})
            </div>
          )}
          {balance === 0 && (
            <p className="text-xs text-muted-foreground mt-2">Deposit funds to start trading</p>
          )}
        </motion.div>

        {/* Deposit / Withdraw quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/deposit')}
            className="h-14 rounded-xl font-semibold text-black flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #00e676 0%, #00b248 100%)',
              boxShadow: '0 0 24px rgba(0,230,118,0.25)',
            }}
          >
            <ArrowDownToLine className="w-5 h-5" />
            Deposit
          </motion.button>
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/withdraw')}
            className="h-14 rounded-xl font-semibold text-white border border-white/15 bg-white/[0.04] hover:bg-white/[0.07] flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowUpFromLine className="w-5 h-5" />
            Withdraw
          </motion.button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Active Balance', value: `$${balance.toFixed(2)}`, icon: DollarSign },
            { label: 'Total Deposited', value: `$${totalDeposited.toFixed(2)}`, icon: Wallet },
            { label: 'Total Trades', value: String(myTrades.length), icon: TrendingUp },
            { label: 'Win Rate', value: `${winRate}%`, icon: TrendingUp },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-xl p-4"
            >
              <stat.icon className="w-4 h-4 text-primary mb-2" />
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-bold font-mono text-foreground">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Performance stats & charts */}
        <PerformanceStats trades={trades.filter((t) => t.userId === user?.id)} />
      </div>

      <BottomNav />
    </div>
  );
};

export default WalletPage;