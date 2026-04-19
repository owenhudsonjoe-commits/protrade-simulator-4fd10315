import { useTrades } from '@/contexts/TradeContext';
import { useAuth } from '@/contexts/AuthContext';
import BottomNav from '@/components/BottomNav';
import { TRADING_PAIRS } from '@/hooks/useBinanceWebSocket';
import { History, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

const TradeHistory = () => {
  const { trades } = useTrades();
  const { user }   = useAuth();

  const myTrades   = trades.filter((t) => t.userId === user?.id && t.status !== 'active');
  const totalWins  = myTrades.filter((t) => t.status === 'won').length;
  const totalLosses = myTrades.filter((t) => t.status === 'lost').length;
  const totalPnl   = myTrades.reduce((sum, t) => sum + (t.profit || 0), 0);
  const winRate    = myTrades.length > 0 ? ((totalWins / myTrades.length) * 100).toFixed(1) : '0';

  // Cumulative P&L for chart (sorted by timestamp)
  const sorted = [...myTrades].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  let running = 0;
  const chartData = sorted.map((t, i) => {
    running += t.profit || 0;
    return {
      index: i + 1,
      pnl: parseFloat(running.toFixed(2)),
      label: `#${i + 1}`,
    };
  });

  const pnlPositive = totalPnl >= 0;
  const chartColor  = pnlPositive ? '#00e676' : '#ff1744';

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="px-4 py-4 border-b border-border bg-surface-1">
        <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          Trade History
        </h1>
      </header>

      <div className="p-4 space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Trades',   value: myTrades.length,   color: 'text-foreground'    },
            { label: 'Wins',     value: totalWins,          color: 'text-trade-green'   },
            { label: 'Losses',   value: totalLosses,        color: 'text-trade-red'     },
            { label: 'Win Rate', value: `${winRate}%`,      color: 'text-primary'       },
          ].map((s) => (
            <div key={s.label} className="glass rounded-xl p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase">{s.label}</p>
              <p className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Total P&L */}
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-0.5">Total P&amp;L</p>
          <p className={`text-2xl font-bold font-mono ${pnlPositive ? 'text-trade-green' : 'text-trade-red'}`}>
            {pnlPositive ? '+' : ''}${totalPnl.toFixed(2)}
          </p>
        </div>

        {/* P&L Chart */}
        {chartData.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-4"
          >
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3">
              Cumulative P&amp;L
            </p>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={chartColor} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.25)' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.25)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    background: '#0e1117',
                    border: `1px solid ${chartColor}33`,
                    borderRadius: '10px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                  formatter={(value: number) => [
                    <span style={{ color: value >= 0 ? '#00e676' : '#ff1744', fontWeight: 700 }}>
                      {value >= 0 ? '+' : ''}${value.toFixed(2)}
                    </span>,
                    'P&L',
                  ]}
                  labelFormatter={(label) => `Trade ${label}`}
                />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" strokeDasharray="3 3" />
                <Area
                  type="monotone"
                  dataKey="pnl"
                  stroke={chartColor}
                  strokeWidth={2}
                  fill="url(#pnlGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: chartColor, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Trade list */}
        <div className="space-y-2">
          {myTrades.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">No completed trades yet</div>
          ) : (
            [...myTrades]
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map((trade, i) => {
                const pair = TRADING_PAIRS.find((p) => p.symbol === trade.symbol);
                return (
                  <motion.div
                    key={trade.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="glass rounded-xl p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          trade.status === 'won' ? 'bg-trade-green/20' : 'bg-trade-red/20'
                        }`}>
                          {trade.status === 'won'
                            ? <TrendingUp  className="w-4 h-4 text-trade-green" />
                            : <TrendingDown className="w-4 h-4 text-trade-red" />
                          }
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-foreground">{pair?.name || trade.symbol}</span>
                            <span className={`text-[10px] font-bold px-1 py-0.5 rounded ${
                              trade.direction === 'up'
                                ? 'bg-trade-green/20 text-trade-green'
                                : 'bg-trade-red/20 text-trade-red'
                            }`}>
                              {trade.direction.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(trade.timestamp).toLocaleString()} · ${trade.amount}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold font-mono ${
                          (trade.profit || 0) >= 0 ? 'text-trade-green' : 'text-trade-red'
                        }`}>
                          {(trade.profit || 0) >= 0 ? '+' : ''}${(trade.profit || 0).toFixed(2)}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
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

      <BottomNav />
    </div>
  );
};

export default TradeHistory;
