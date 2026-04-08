import TradingChart from '@/components/TradingChart';
import TradePanel from '@/components/TradePanel';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp, LogOut } from 'lucide-react';

const Trade = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm text-foreground">DemoTrade</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-bold text-primary">
            ${user?.balance.toFixed(2)}
          </span>
          <button onClick={logout} className="text-muted-foreground hover:text-foreground">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Chart area */}
      <div className="flex-1 min-h-0" style={{ height: '45vh' }}>
        <TradingChart />
      </div>

      {/* Trade panel */}
      <div className="px-3 py-2">
        <TradePanel />
      </div>

      <BottomNav />
    </div>
  );
};

export default Trade;
