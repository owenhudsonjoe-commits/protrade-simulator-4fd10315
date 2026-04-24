import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, Wallet, History, User, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { path: '/trade', icon: BarChart3, label: 'Trade' },
  { path: '/history', icon: History, label: 'History' },
  { path: '/wallet', icon: Wallet, label: 'Wallet' },
  { path: '/profile', icon: User, label: 'Profile' },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const items = user?.isAdmin
    ? [...navItems, { path: '/admin', icon: Shield, label: 'Admin' }]
    : navItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong">
      <div className="flex items-center justify-around py-1.5 px-1 max-w-lg mx-auto">
        {items.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all duration-200 ${
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {active && (
                <span className="absolute -top-0.5 w-5 h-0.5 rounded-full bg-primary" />
              )}
              <item.icon className={`w-5 h-5 transition-all ${active ? 'drop-shadow-[0_0_8px_hsl(152,82%,45%,0.6)]' : ''}`} />
              <span className={`text-[9px] font-semibold ${active ? 'text-primary' : ''}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
