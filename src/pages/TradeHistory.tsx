import { useTrades } from '@/contexts/TradeContext';
import { useAuth } from '@/contexts/AuthContext';
import BottomNav from '@/components/BottomNav';
import { TRADING_PAIRS } from '@/hooks/useBinanceWebSocket';
import { TrendingUp, TrendingDown, Target, Zap, BarChart2, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const TradeHistory = () => {
  const { trades } = useTrades();
  const { user }   = useAuth();

  const myTrades    = trades.filter((t) => t.userId === user?.id && t.status !== 'active');
  const totalWins   = myTrades.filter((t) => t.status === 'won').length;
  const totalLosses = myTrades.filter((t) => t.status === 'lost').length;
  const totalPnl    = myTrades.reduce((sum, t) => sum + (t.profit || 0), 0);
  const winRate     = myTrades.length > 0 ? ((totalWins / myTrades.length) * 100).toFixed(1) : '0';
  const pnlPositive = totalPnl >= 0;
  const chartColor  = pnlPositive ? '#00e676' : '#ff4444';

  const sorted = [...myTrades].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  let running = 0;
  const chartData = sorted.map((t, i) => {
    running += t.profit || 0;
    return { index: i + 1, pnl: parseFloat(running.toFixed(2)), label: `#${i + 1}` };
  });

  const stats = [
    { label: 'Total Trades', value: myTrades.length, icon: BarChart2,    color: '#7c8cf8' },
    { label: 'Wins',         value: totalWins,        icon: TrendingUp,   color: '#00e676' },
    { label: 'Losses',       value: totalLosses,      icon: TrendingDown, color: '#ff4444' },
    { label: 'Win Rate',     value: `${winRate}%`,    icon: Award,        color: '#f59e0b' },
  ];

  return (
    <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(180deg, #070a12 0%, #060810 100%)' }}>

      {/* Header */}
      <div className="relative px-4 pt-5 pb-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-32 rounded-full opacity-20 blur-[60px]"
          style={{ background: 'radial-gradient(circle, #00e676 0%, transparent 70%)' }} />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-0.5">Performance</p>
            <h1 className="text-2xl font-bold text-white">Trade History</h1>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)' }}>
            <Zap className="w-3.5 h-3.5 text-[#00e676]" />
            <span className="text-[11px] font-bold text-[#00e676]">{myTrades.length} trades</span>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">

        {/* P&L Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl p-5 overflow-hidden"
          style={{
            background: pnlPositive
              ? 'linear-gradient(135deg, rgba(0,230,118,0.12) 0%, rgba(0,100,50,0.08) 100%)'
              : 'linear-gradient(135deg, rgba(255,68,68,0.12) 0%, rgba(120,0,0,0.08) 100%)',
            border: `1px solid ${pnlPositive ? 'rgba(0,230,118,0.25)' : 'rgba(255,68,68,0.25)'}`,
            boxShadow: pnlPositive
              ? '0 8px 40px rgba(0,230,118,0.1)'
              : '0 8px 40px rgba(255,68,68,0.1)',
          }}
        >
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-[60px] opacity-20"
            style={{ background: pnlPositive ? '#00e676' : '#ff4444' }} />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-1"
              style={{ color: pnlPositive ? 'rgba(0,230,118,0.6)' : 'rgba(255,68,68,0.6)' }}>
              Total Profit / Loss
            </p>
            <p className="text-4xl font-bold font-mono tracking-tight"
              style={{ color: pnlPositive ? '#00e676' : '#ff4444' }}>
              {pnlPositive ? '+' : ''}${totalPnl.toFixed(2)}
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              {pnlPositive ? <TrendingUp className="w-4 h-4 text-[#00e676]" /> : <TrendingDown className="w-4 h-4 text-[#ff4444]" />}
              <span className="text-sm font-medium" style={{ color: pnlPositive ? '#00e676' : '#ff4444' }}>
                {pnlPositive ? 'In profit' : 'In loss'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl p-3 text-center"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div className="w-6 h-6 rounded-lg mx-auto mb-1.5 flex items-center justify-center"
                style={{ background: `${s.color}18` }}>
                <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
              </div>
              <p className="text-sm font-bold font-mono text-white">{s.value}</p>
              <p className="text-[9px] text-white/35 mt-0.5 leading-tight">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Equity Chart */}
        {chartData.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl p-4"
            style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Equity Curve</p>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full"
                style={{
                  color: pnlPositive ? '#00e676' : '#ff4444',
                  background: pnlPositive ? 'rgba(0,230,118,0.1)' : 'rgba(255,68,68,0.1)',
                }}>
                {pnlPositive ? '+' : ''}${totalPnl.toFixed(2)}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={130}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="pnlG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={chartColor} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.2)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.2)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: '#0b0e1a', border: `1px solid ${chartColor}30`, borderRadius: '12px', fontSize: '11px', color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                  formatter={(value: number) => [
                    <span style={{ color: value >= 0 ? '#00e676' : '#ff4444', fontWeight: 700 }}>
                      {value >= 0 ? '+' : ''}${value.toFixed(2)}
                    </span>, 'P&L',
                  ]}
                  labelFormatter={(l) => `Trade ${l}`}
                />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="pnl" stroke={chartColor} strokeWidth={2} fill="url(#pnlG)" dot={false} activeDot={{ r: 4, fill: chartColor, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Trade List */}
        <div>
          <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3 px-1">Recent Trades</p>
          <div className="space-y-2">
            {myTrades.length === 0 ? (
              <div className="text-center py-16 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Target className="w-10 h-10 text-white/15 mx-auto mb-3" />
                <p className="text-sm font-medium text-white/30">No completed trades yet</p>
                <p className="text-xs text-white/20 mt-1">Your trade history will appear here</p>
              </div>
            ) : (
              [...myTrades]
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((trade, i) => {
                  const pair = TRADING_PAIRS.find((p) => p.symbol === trade.symbol);
                  const won  = trade.status === 'won';
                  const pnl  = trade.profit || 0;
                  return (
                    <motion.div
                      key={trade.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.3) }}
                      className="rounded-xl p-3.5"
                      style={{
                        background: won
                          ? 'linear-gradient(135deg, rgba(0,230,118,0.06) 0%, rgba(255,255,255,0.02) 100%)'
                          : 'linear-gradient(135deg, rgba(255,68,68,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                        border: won
                          ? '1px solid rgba(0,230,118,0.15)'
                          : '1px solid rgba(255,68,68,0.15)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                            style={{ background: won ? 'rgba(0,230,118,0.12)' : 'rgba(255,68,68,0.12)' }}>
                            {pair?.icon || '💱'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-bold text-white">{pair?.display || trade.symbol}</span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase"
                                style={{
                                  color: trade.direction === 'up' ? '#00e676' : '#ff4444',
                                  background: trade.direction === 'up' ? 'rgba(0,230,118,0.12)' : 'rgba(255,68,68,0.12)',
                                }}>
                                {trade.direction === 'up' ? '▲ UP' : '▼ DOWN'}
                              </span>
                            </div>
                            <p className="text-[10px] text-white/35 font-mono">
                              {new Date(trade.timestamp).toLocaleDateString()} · <span className="text-white/50">${trade.amount}</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-bold font-mono" style={{ color: pnl >= 0 ? '#00e676' : '#ff4444' }}>
                            {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                          </p>
                          <p className="text-[10px] text-white/30 font-mono mt-0.5">
                            {trade.entryPrice?.toFixed(2)} → {trade.exitPrice?.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default TradeHistory;
