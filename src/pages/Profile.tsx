import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTrades } from '@/contexts/TradeContext';
import BottomNav from '@/components/BottomNav';
import {
  User as UserIcon, Mail, Globe, Wallet, Shield, LogOut,
  History, TrendingUp, ChevronRight, Bell, KeyRound,
  ShieldCheck, MessageCircle, Copy, Check,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useState } from 'react';

const Profile = () => {
  const { user, logout } = useAuth();
  const { trades }       = useTrades();
  const navigate         = useNavigate();
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const myTrades  = trades.filter((t) => t.userId === user.id && t.status !== 'active');
  const totalWins = myTrades.filter((t) => t.status === 'won').length;
  const winRate   = myTrades.length > 0 ? ((totalWins / myTrades.length) * 100).toFixed(1) : '0.0';
  const totalPnl  = myTrades.reduce((s, t) => s + (t.profit || 0), 0);

  const initials = (user.fullName || user.email)
    .split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out');
    navigate('/login');
  };

  const copyId = () => {
    navigator.clipboard.writeText(user.id || '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="min-h-screen pb-28" style={{ background: 'linear-gradient(180deg, #070a12 0%, #060810 100%)' }}>

      {/* Hero Header */}
      <div className="relative px-4 pt-6 pb-8">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-60 rounded-full opacity-20 blur-[80px]"
          style={{ background: 'radial-gradient(circle, #00e676 0%, transparent 60%)' }} />

        <div className="relative flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black text-black relative"
              style={{
                background: 'linear-gradient(135deg, #00e676 0%, #00b248 100%)',
                boxShadow: '0 0 0 3px rgba(0,230,118,0.3), 0 0 40px rgba(0,230,118,0.3)',
              }}>
              {initials}
            </div>
            {user.isAdmin && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: '#0e1117', border: '2px solid rgba(0,230,118,0.5)' }}>
                <Shield className="w-3.5 h-3.5 text-[#00e676]" />
              </div>
            )}
          </div>

          <h2 className="text-2xl font-bold text-white tracking-tight">{user.fullName || 'Trader'}</h2>
          <p className="text-sm text-white/40 mt-0.5 mb-3">{user.email}</p>

          {user.isAdmin ? (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#00e676] px-3 py-1 rounded-full"
              style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.25)' }}>
              <Shield className="w-3 h-3" /> Administrator
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-400 px-3 py-1 rounded-full"
              style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <UserIcon className="w-3 h-3" /> Verified Trader
            </span>
          )}
        </div>
      </div>

      <div className="px-4 space-y-4">

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Balance', value: `$${user.balance.toFixed(2)}`, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.18)' },
            { label: 'Trades',  value: String(myTrades.length),       color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.18)' },
            { label: 'Win Rate',value: `${winRate}%`,                  color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.18)' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl p-3 text-center"
              style={{ background: stat.bg, border: `1px solid ${stat.border}` }}
            >
              <p className="text-sm font-bold font-mono" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-[10px] text-white/35 uppercase tracking-wider mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* P&L Banner */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="rounded-2xl px-4 py-3 flex items-center justify-between"
          style={{
            background: totalPnl >= 0
              ? 'linear-gradient(135deg, rgba(0,230,118,0.1) 0%, rgba(0,100,50,0.05) 100%)'
              : 'linear-gradient(135deg, rgba(255,68,68,0.1) 0%, rgba(120,0,0,0.05) 100%)',
            border: totalPnl >= 0 ? '1px solid rgba(0,230,118,0.2)' : '1px solid rgba(255,68,68,0.2)',
          }}
        >
          <div className="flex items-center gap-2">
            {totalPnl >= 0 ? <TrendingUp className="w-4 h-4 text-[#00e676]" /> : <TrendingDown className="w-4 h-4 text-[#ff4444]" />}
            <span className="text-sm font-semibold text-white/70">Total P&L</span>
          </div>
          <span className="text-base font-bold font-mono" style={{ color: totalPnl >= 0 ? '#00e676' : '#ff4444' }}>
            {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
          </span>
        </motion.div>

        {/* Account Details */}
        <Section title="Account Information">
          <DetailRow icon={UserIcon} label="Full Name"  value={user.fullName || '—'} />
          <DetailRow icon={Mail}     label="Email"      value={user.email} />
          <DetailRow icon={Globe}    label="Country"    value={user.country || 'Not set'} />
          <button onClick={copyId} className="w-full flex items-center gap-3 px-4 py-3.5 border-t border-white/5 hover:bg-white/[0.03] transition-colors">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }}>
              {copied ? <Check className="w-4 h-4 text-[#00e676]" /> : <Copy className="w-4 h-4 text-white/40" />}
            </div>
            <div className="flex-1 text-left">
              <p className="text-[10px] text-white/35 uppercase tracking-wider">User ID</p>
              <p className="text-xs text-white/60 font-mono truncate">{user.id}</p>
            </div>
            <span className="text-[10px] text-white/30">{copied ? 'Copied!' : 'Tap to copy'}</span>
          </button>
        </Section>

        {/* Quick Actions */}
        <Section title="Quick Actions">
          <ActionRow icon={Wallet}      label="My Wallet"      color="#3b82f6"  onClick={() => navigate('/wallet')} />
          <ActionRow icon={History}     label="Trade History"  color="#a78bfa"  onClick={() => navigate('/history')} />
          <ActionRow icon={Bell}        label="Notifications"  color="#f59e0b"  onClick={() => navigate('/notifications')} />
          <ActionRow icon={KeyRound}    label="Reset Password" color="#64748b"  onClick={() => navigate('/forgot-password')} />
          {user.isAdmin && (
            <ActionRow icon={Shield} label="Admin Panel" color="#00e676" onClick={() => navigate('/admin')} accent />
          )}
        </Section>

        {/* Support & Legal */}
        <Section title="Support & Legal">
          <ActionRow icon={MessageCircle} label="Contact Us"     color="#64748b" onClick={() => navigate('/contact')} />
          <ActionRow icon={ShieldCheck}   label="Privacy Policy" color="#64748b" onClick={() => navigate('/privacy')} />
        </Section>

        {/* Logout */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full h-13 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          style={{
            color: '#ff5252',
            background: 'rgba(255,82,82,0.06)',
            border: '1px solid rgba(255,82,82,0.2)',
          }}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </motion.button>

        <p className="text-center text-[10px] text-white/15 pb-2">FXonix v1.0 • All rights reserved</p>
      </div>

      <BottomNav />
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-2xl overflow-hidden"
    style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
  >
    <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest px-4 pt-4 pb-2">{title}</p>
    {children}
  </motion.div>
);

const DetailRow = ({
  icon: Icon, label, value,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) => (
  <div className="flex items-center gap-3 px-4 py-3.5 border-t border-white/5">
    <div className="w-8 h-8 rounded-xl bg-white/[0.05] flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4 text-white/40" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] text-white/35 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-white truncate">{value}</p>
    </div>
  </div>
);

const ActionRow = ({
  icon: Icon, label, onClick, color, accent,
}: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void; color: string; accent?: boolean }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-4 py-3.5 border-t border-white/5 hover:bg-white/[0.03] active:bg-white/[0.05] transition-colors"
  >
    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
      style={{ background: `${color}15` }}>
      <Icon className="w-4 h-4" style={{ color }} />
    </div>
    <span className={`flex-1 text-left text-sm font-medium ${accent ? 'text-[#00e676]' : 'text-white/80'}`}>{label}</span>
    <ChevronRight className="w-4 h-4 text-white/20" />
  </button>
);

export default Profile;
