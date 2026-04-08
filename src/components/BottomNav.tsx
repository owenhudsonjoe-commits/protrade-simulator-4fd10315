import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, Wallet, ArrowDownToLine, ArrowUpFromLine, History, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { path: '/trade', icon: BarChart3, label: 'Trade' },
  { path: '/history', icon: History, label: 'History' },
  { path: '/deposit', icon: ArrowDownToLine, label: 'Deposit' },
  { path: '/withdraw', icon: ArrowUpFromLine, label: 'Withdraw' },
  { path: '/wallet', icon: Wallet, label: 'Wallet' },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const items = user?.isAdmin
    ? [...navItems, { path: '/admin', icon: Shield, label: 'Admin' }]
    : navItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface-1 border-t border-border z-50">
      <div className="flex items-center justify-around py-1 px-0.5 max-w-lg mx-auto">
        {items.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 py-1 px-1.5 rounded-lg transition-all ${
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon className={`w-5 h-5 ${active ? 'drop-shadow-[0_0_6px_hsl(145,80%,42%)]' : ''}`} />
              <span className="text-[9px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
