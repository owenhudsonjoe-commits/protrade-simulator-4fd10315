import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTrades } from '@/contexts/TradeContext';
import BottomNav from '@/components/BottomNav';
import {
  User as UserIcon,
  Mail,
  Globe,
  Wallet,
  Shield,
  LogOut,
  History,
  TrendingUp,
  ChevronRight,
  Bell,
  KeyRound,
  ShieldCheck,
  MessageCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const Profile = () => {
  const { user, logout } = useAuth();
  const { trades } = useTrades();
  const navigate = useNavigate();

  if (!user) return null;

  const myTrades = trades.filter((t) => t.userId === user.id && t.status !== 'active');
  const totalWins = myTrades.filter((t) => t.status === 'won').length;
  const winRate = myTrades.length > 0 ? ((totalWins / myTrades.length) * 100).toFixed(1) : '0.0';

  const initials = (user.fullName || user.email)
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#060810] pb-24 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[#00e676]/8 blur-[120px]" />
      </div>

      <header className="relative px-4 py-4 border-b border-white/8 bg-white/[0.02] backdrop-blur-xl">
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-[#00e676]" />
          Profile
        </h1>
      </header>

      <div className="relative p-4 space-y-4 max-w-lg mx-auto">
        {/* Profile header card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 p-6 text-center"
          style={{
            background: 'rgba(255,255,255,0.035)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          }}
        >
          <div className="relative inline-block mb-3">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-black mx-auto"
              style={{
                background: 'linear-gradient(135deg, #00e676 0%, #00b248 100%)',
                boxShadow: '0 0 32px rgba(0,230,118,0.35)',
              }}
            >
              {initials}
            </div>
            {user.isAdmin && (
              <div className="absolute -bottom-1 -right-1 bg-[#0e1117] border border-[#00e676]/50 rounded-full p-1.5">
                <Shield className="w-3.5 h-3.5 text-[#00e676]" />
              </div>
            )}
          </div>
          <h2 className="text-xl font-bold text-white">{user.fullName || 'Trader'}</h2>
          <p className="text-sm text-white/45 mt-0.5">{user.email}</p>
          {user.isAdmin && (
            <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider text-[#00e676] bg-[#00e676]/10 border border-[#00e676]/30 px-2 py-0.5 rounded-full">
              Administrator
            </span>
          )}
        </motion.div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Balance', value: `$${user.balance.toFixed(2)}`, icon: Wallet },
            { label: 'Trades', value: String(myTrades.length), icon: History },
            { label: 'Win Rate', value: `${winRate}%`, icon: TrendingUp },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.05 }}
              className="rounded-xl border border-white/10 p-3 text-center"
              style={{ background: 'rgba(255,255,255,0.035)', backdropFilter: 'blur(24px)' }}
            >
              <stat.icon className="w-4 h-4 text-[#00e676] mx-auto mb-1.5" />
              <p className="text-[10px] text-white/45 uppercase tracking-wider">{stat.label}</p>
              <p className="text-sm font-bold text-white font-mono mt-0.5">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Account details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-white/10 overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.035)', backdropFilter: 'blur(24px)' }}
        >
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-5 pt-4 pb-2">
            Account Information
          </p>
          <DetailRow icon={UserIcon} label="Full Name" value={user.fullName || '—'} />
          <DetailRow icon={Mail} label="Email" value={user.email} />
          <DetailRow icon={Globe} label="Country" value={user.country || 'Not set'} />
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-white/10 overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.035)', backdropFilter: 'blur(24px)' }}
        >
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-5 pt-4 pb-2">
            Quick Actions
          </p>
          <ActionRow icon={Wallet} label="My Wallet" onClick={() => navigate('/wallet')} />
          <ActionRow icon={History} label="Trade History" onClick={() => navigate('/history')} />
          <ActionRow icon={Bell} label="Notifications" onClick={() => navigate('/notifications')} />
          <ActionRow
            icon={KeyRound}
            label="Reset Password"
            onClick={() => navigate('/forgot-password')}
          />
          {user.isAdmin && (
            <ActionRow
              icon={Shield}
              label="Admin Panel"
              onClick={() => navigate('/admin')}
              accent
            />
          )}
        </motion.div>

        {/* Support & Legal */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl border border-white/10 overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.035)', backdropFilter: 'blur(24px)' }}
        >
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-5 pt-4 pb-2">
            Support & Legal
          </p>
          <ActionRow icon={MessageCircle} label="Contact Us" onClick={() => navigate('/contact')} />
          <ActionRow icon={ShieldCheck} label="Privacy Policy" onClick={() => navigate('/privacy')} />
        </motion.div>

        {/* Logout */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full h-12 rounded-xl font-semibold text-[#ff5252] border border-[#ff5252]/30 bg-[#ff5252]/5 hover:bg-[#ff5252]/10 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </motion.button>

        <p className="text-center text-[10px] text-white/20">FXonix • v1.0</p>
      </div>

      <BottomNav />
    </div>
  );
};

const DetailRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) => (
  <div className="flex items-center gap-3 px-5 py-3.5 border-t border-white/5">
    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4 text-white/60" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] text-white/40 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-white truncate">{value}</p>
    </div>
  </div>
);

const ActionRow = ({
  icon: Icon,
  label,
  onClick,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  accent?: boolean;
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-5 py-3.5 border-t border-white/5 hover:bg-white/[0.03] transition-colors"
  >
    <div
      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
        accent ? 'bg-[#00e676]/15' : 'bg-white/5'
      }`}
    >
      <Icon className={`w-4 h-4 ${accent ? 'text-[#00e676]' : 'text-white/60'}`} />
    </div>
    <span className={`flex-1 text-left text-sm font-medium ${accent ? 'text-[#00e676]' : 'text-white'}`}>
      {label}
    </span>
    <ChevronRight className="w-4 h-4 text-white/30" />
  </button>
);

export default Profile;
