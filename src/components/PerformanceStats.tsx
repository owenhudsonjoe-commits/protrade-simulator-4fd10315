import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, Trophy } from 'lucide-react';
import type { Trade } from '@/contexts/TradeContext';

interface PerformanceStatsProps {
  trades: Trade[];
}

const PerformanceStats = ({ trades }: PerformanceStatsProps) => {
  const completed = useMemo(
    () => trades.filter((t) => t.status !== 'active').slice().reverse(),
    [trades]
  );

  // Cumulative PnL series
  const pnlSeries = useMemo(() => {
    let cum = 0;
    return completed.map((t, i) => {
      cum += t.profit || 0;
      const d = new Date(t.timestamp);
      return {
        idx: i + 1,
        label: `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`,
        pnl: Number(cum.toFixed(2)),
      };
    });
  }, [completed]);

  const wins = completed.filter((t) => t.status === 'won').length;
  const losses = completed.filter((t) => t.status === 'lost').length;
  const winRate = completed.length > 0 ? (wins / completed.length) * 100 : 0;
  const totalProfit = completed.reduce((s, t) => s + (t.profit || 0), 0);
  const bestTrade = completed.reduce(
    (m, t) => ((t.profit || 0) > m ? t.profit || 0 : m),
    0
  );
  const worstTrade = completed.reduce(
    (m, t) => ((t.profit || 0) < m ? t.profit || 0 : m),
    0
  );

  // UP vs DOWN breakdown
  const directionData = useMemo(() => {
    const up = completed.filter((t) => t.direction === 'up');
    const down = completed.filter((t) => t.direction === 'down');
    return [
      {
        name: 'UP',
        wins: up.filter((t) => t.status === 'won').length,
        losses: up.filter((t) => t.status === 'lost').length,
      },
      {
        name: 'DOWN',
        wins: down.filter((t) => t.status === 'won').length,
        losses: down.filter((t) => t.status === 'lost').length,
      },
    ];
  }, [completed]);

  const pieData = [
    { name: 'Wins', value: wins },
    { name: 'Losses', value: losses },
  ];

  if (completed.length === 0) {
    return (
      <div className="glass rounded-xl p-6 text-center">
        <Trophy className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
        <p className="text-sm text-muted-foreground">
          No trade history yet. Start trading to see your performance.
        </p>
      </div>
    );
  }

  const profitColor = totalProfit >= 0 ? 'hsl(var(--trade-green))' : 'hsl(var(--trade-red))';

  return (
    <div className="space-y-4">
      {/* Cumulative PnL chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Performance</h3>
            <p className="text-[10px] text-muted-foreground">Cumulative P&L over time</p>
          </div>
          <div className={`text-right ${totalProfit >= 0 ? 'text-trade-green' : 'text-trade-red'}`}>
            <div className="flex items-center gap-1 justify-end">
              {totalProfit >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span className="text-base font-bold font-mono">
                {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={pnlSeries} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={profitColor} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={profitColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="idx"
                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                width={35}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--surface-2))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
                labelFormatter={(v) => `Trade #${v}`}
                formatter={(v: number) => [`$${v.toFixed(2)}`, 'P&L']}
              />
              <Area
                type="monotone"
                dataKey="pnl"
                stroke={profitColor}
                strokeWidth={2}
                fill="url(#pnlGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Win/Loss + Direction breakdown */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-3"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <Target className="w-3.5 h-3.5 text-primary" />
            <h4 className="text-xs font-semibold text-foreground">Win Rate</h4>
          </div>
          <div className="h-24 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={42}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill="hsl(var(--trade-green))" />
                  <Cell fill="hsl(var(--trade-red))" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-base font-bold font-mono text-foreground">
                {winRate.toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="flex justify-between text-[10px] mt-1">
            <span className="text-trade-green">● {wins}W</span>
            <span className="text-trade-red">● {losses}L</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass rounded-xl p-3"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <h4 className="text-xs font-semibold text-foreground">Direction</h4>
          </div>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={directionData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--surface-2))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                  cursor={{ fill: 'hsl(var(--surface-3) / 0.3)' }}
                />
                <Bar dataKey="wins" stackId="a" fill="hsl(var(--trade-green))" radius={[0, 0, 0, 0]} />
                <Bar dataKey="losses" stackId="a" fill="hsl(var(--trade-red))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Best/Worst chips */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground mb-0.5">Best Trade</p>
          <p className="text-sm font-bold font-mono text-trade-green">
            +${bestTrade.toFixed(2)}
          </p>
        </div>
        <div className="glass rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground mb-0.5">Worst Trade</p>
          <p className="text-sm font-bold font-mono text-trade-red">
            ${worstTrade.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceStats;
