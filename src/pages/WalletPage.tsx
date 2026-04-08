import { useAuth } from '@/contexts/AuthContext';
import BottomNav from '@/components/BottomNav';
import { Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

const WalletPage = () => {
  const { user } = useAuth();
  const balance = user?.balance || 0;
  // Demo P&L calculation
  const invested = 1000;
  const pnl = balance - invested;
  const pnlPercent = ((pnl / invested) * 100).toFixed(1);

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
          <div className={`inline-flex items-center gap-1 mt-2 text-sm font-medium ${pnl >= 0 ? 'text-trade-green' : 'text-trade-red'}`}>
            {pnl >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {pnl >= 0 ? '+' : ''}{pnlPercent}% ({pnl >= 0 ? '+' : ''}${pnl.toFixed(2)})
          </div>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Active Balance', value: `$${balance.toFixed(2)}`, icon: DollarSign },
            { label: 'Demo Equity', value: `$${(balance * 1.0).toFixed(2)}`, icon: Wallet },
            { label: 'Total Trades', value: '0', icon: TrendingUp },
            { label: 'Win Rate', value: '0%', icon: TrendingUp },
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

        {/* Recent activity placeholder */}
        <div className="glass rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Recent Activity</h3>
          <div className="text-center py-8 text-muted-foreground text-sm">
            No recent activity
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default WalletPage;
