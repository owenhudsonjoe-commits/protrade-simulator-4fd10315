import { useAuth } from '@/contexts/AuthContext';
import { useTrades } from '@/contexts/TradeContext';
import BottomNav from '@/components/BottomNav';
import PerformanceStats from '@/components/PerformanceStats';
import { TrendingUp, TrendingDown, ArrowDownToLine, ArrowUpFromLine, Wallet, BarChart2, Trophy, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const WalletPage = () => {
  const { user }   = useAuth();
  const { trades } = useTrades();
  const navigate   = useNavigate();
  const balance    = user?.balance || 0;

  const myTrades = trades.filter((t) => t.userId === user?.id && t.status !== 'active');
  const totalDeposited = JSON.parse(localStorage.getItem('uv_deposits') || '[]')
    .filter((d: any) => d.userId === user?.id && d.status === 'approved')
    .reduce((s: number, d: any) => s + d.amount, 0);

  const pnl        = balance - totalDeposited;
  const pnlPercent = totalDeposited > 0 ? ((pnl / totalDeposited) * 100).toFixed(1) : '0';
  const totalWins  = myTrades.filter((t) => t.status === 'won').length;
  const winRate    = myTrades.length > 0 ? ((totalWins / myTrades.length) * 100).toFixed(1) : '0';
  const totalPnl   = myTrades.reduce((s, t) => s + (t.profit || 0), 0);

  return (
    <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(180deg, #070a12 0%, #060810 100%)' }}>

      {/* Header */}
      <div className="relative px-4 pt-5 pb-2">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 rounded-full opacity-15 blur-[70px]"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }} />
        <div className="relative">
          <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-0.5">Overview</p>
          <h1 className="text-2xl font-bold text-white">My Wallet</h1>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">

        {/* Balance Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl p-6 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0d1526 0%, #0a1020 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full blur-[60px] opacity-25"
            style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }} />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full blur-[50px] opacity-15"
            style={{ background: 'radial-gradient(circle, #00e676 0%, transparent 70%)' }} />

          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-1">Available Balance</p>
                <motion.p
                  key={balance}
                  initial={{ opacity: 0.5, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl font-bold font-mono text-white tracking-tight"
                >
                  ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </motion.p>
              </div>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)' }}>
                <Wallet className="w-5 h-5 text-blue-400" />
              </div>
            </div>

            {totalDeposited > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl w-fit"
                style={{
                  background: pnl >= 0 ? 'rgba(0,230,118,0.1)' : 'rgba(255,68,68,0.1)',
                  border: pnl >= 0 ? '1px solid rgba(0,230,118,0.2)' : '1px solid rgba(255,68,68,0.2)',
                }}>
                {pnl >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-[#00e676]" /> : <TrendingDown className="w-3.5 h-3.5 text-[#ff4444]" />}
                <span className="text-sm font-bold font-mono" style={{ color: pnl >= 0 ? '#00e676' : '#ff4444' }}>
                  {pnl >= 0 ? '+' : ''}{pnlPercent}% ({pnl >= 0 ? '+' : ''}${pnl.toFixed(2)})
                </span>
              </div>
            )}
            {balance === 0 && (
              <p className="text-xs text-white/30 mt-2">Deposit funds to start trading</p>
            )}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/deposit')}
            className="relative h-14 rounded-2xl font-bold text-sm text-black flex items-center justify-center gap-2 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #00e676 0%, #00b248 100%)',
              boxShadow: '0 0 30px rgba(0,230,118,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
            }}
          >
            <ArrowDownToLine className="w-4 h-4" />
            Deposit
          </motion.button>
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/withdraw')}
            className="h-14 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            <ArrowUpFromLine className="w-4 h-4" />
            Withdraw
          </motion.button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total Deposited', value: `$${totalDeposited.toFixed(2)}`, icon: ArrowDownToLine, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
            { label: 'Total P&L',       value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`, icon: TrendingUp, color: totalPnl >= 0 ? '#00e676' : '#ff4444', bg: totalPnl >= 0 ? 'rgba(0,230,118,0.08)' : 'rgba(255,68,68,0.08)', border: totalPnl >= 0 ? 'rgba(0,230,118,0.18)' : 'rgba(255,68,68,0.18)' },
            { label: 'Total Trades',    value: String(myTrades.length), icon: BarChart2, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.2)' },
            { label: 'Win Rate',        value: `${winRate}%`, icon: Trophy, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.06 }}
              className="rounded-2xl p-4"
              style={{ background: stat.bg, border: `1px solid ${stat.border}` }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-semibold text-white/45 uppercase tracking-wider">{stat.label}</p>
                <stat.icon className="w-4 h-4 opacity-70" style={{ color: stat.color }} />
              </div>
              <p className="text-xl font-bold font-mono" style={{ color: stat.color }}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Performance Stats */}
        <PerformanceStats trades={trades.filter((t) => t.userId === user?.id)} />
      </div>

      <BottomNav />
    </div>
  );
};

export default WalletPage;
