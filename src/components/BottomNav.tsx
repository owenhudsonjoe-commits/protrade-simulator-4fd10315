import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, Wallet, History, User, Shield, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/trade',   icon: BarChart3,   label: 'Trade'   },
  { path: '/markets', icon: TrendingUp,  label: 'Markets' },
  { path: '/history', icon: History,     label: 'History' },
  { path: '/wallet',  icon: Wallet,      label: 'Wallet'  },
  { path: '/profile', icon: User,        label: 'Account' },
];

const BottomNav = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user }  = useAuth();

  const items = user?.isAdmin
    ? [...navItems, { path: '/admin', icon: Shield, label: 'Admin' }]
    : navItems;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-3 px-4 pointer-events-none">
      <nav
        className="pointer-events-auto w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(14,17,27,0.97) 0%, rgba(10,13,22,0.97) 100%)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 -4px 40px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.04) inset',
        }}
      >
        <div className="flex items-center justify-around px-1 py-1">
          {items.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="relative flex flex-col items-center gap-0.5 py-2 px-2 rounded-xl transition-all duration-200 min-w-[52px]"
              >
                {active && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(0,230,118,0.15) 0%, rgba(0,178,72,0.08) 100%)',
                      border: '1px solid rgba(0,230,118,0.2)',
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <div className="relative">
                  <item.icon
                    className={`w-[18px] h-[18px] transition-all duration-200 ${
                      active ? 'text-[#00e676] drop-shadow-[0_0_8px_rgba(0,230,118,0.7)]' : 'text-white/35'
                    }`}
                  />
                  {active && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#00e676] shadow-[0_0_6px_rgba(0,230,118,0.8)]" />
                  )}
                </div>
                <span className={`text-[9px] font-semibold tracking-wide transition-all duration-200 ${
                  active ? 'text-[#00e676]' : 'text-white/30'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default BottomNav;
