import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTrades } from '@/contexts/TradeContext';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Users, ArrowDownToLine, ArrowUpFromLine, Check, X, BarChart3, Settings, TrendingUp, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

type Tab = 'analytics' | 'deposits' | 'withdrawals' | 'users' | 'settings';

const AdminPanel = () => {
  const { user } = useAuth();
  const { trades, profitPercent, setProfitPercent } = useTrades();
  const [activeTab, setActiveTab] = useState<Tab>('analytics');
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [newProfitPercent, setNewProfitPercent] = useState(String(profitPercent));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setDeposits(JSON.parse(localStorage.getItem('demo_deposits') || '[]'));
    setWithdrawals(JSON.parse(localStorage.getItem('demo_withdrawals') || '[]'));
    const allUsers = JSON.parse(localStorage.getItem('demo_trade_users') || '{}');
    setUsers(Object.values(allUsers));
  };

  const approveDeposit = (id: string) => {
    const updated = deposits.map((d) => {
      if (d.id === id && d.status === 'pending') {
        const allUsers = JSON.parse(localStorage.getItem('demo_trade_users') || '{}');
        if (allUsers[d.userEmail]) {
          allUsers[d.userEmail].balance += d.amount;
          localStorage.setItem('demo_trade_users', JSON.stringify(allUsers));
        }
        return { ...d, status: 'approved' };
      }
      return d;
    });
    localStorage.setItem('demo_deposits', JSON.stringify(updated));
    setDeposits(updated);
    toast.success('Deposit approved!');
    loadData();
  };

  const rejectDeposit = (id: string) => {
    const updated = deposits.map((d) => d.id === id ? { ...d, status: 'rejected' } : d);
    localStorage.setItem('demo_deposits', JSON.stringify(updated));
    setDeposits(updated);
    toast.success('Deposit rejected');
  };

  const approveWithdrawal = (id: string) => {
    const updated = withdrawals.map((w) => w.id === id ? { ...w, status: 'approved' } : w);
    localStorage.setItem('demo_withdrawals', JSON.stringify(updated));
    setWithdrawals(updated);
    toast.success('Withdrawal approved!');
  };

  const rejectWithdrawal = (id: string) => {
    const updated = withdrawals.map((w) => {
      if (w.id === id && w.status === 'pending') {
        const allUsers = JSON.parse(localStorage.getItem('demo_trade_users') || '{}');
        if (allUsers[w.userEmail]) {
          allUsers[w.userEmail].balance += w.amount;
          localStorage.setItem('demo_trade_users', JSON.stringify(allUsers));
        }
        return { ...w, status: 'rejected' };
      }
      return w;
    });
    localStorage.setItem('demo_withdrawals', JSON.stringify(updated));
    setWithdrawals(updated);
    toast.success('Withdrawal rejected, balance refunded');
    loadData();
  };

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Access denied</p>
        <BottomNav />
      </div>
    );
  }

  // Analytics data
  const totalDeposits = deposits.filter((d) => d.status === 'approved').reduce((s, d) => s + d.amount, 0);
  const totalWithdrawals = withdrawals.filter((w) => w.status === 'approved').reduce((s, w) => s + w.amount, 0);
  const totalTrades = trades.length;
  const completedTrades = trades.filter((t) => t.status !== 'active');
  const platformProfit = completedTrades.filter((t) => t.status === 'lost').reduce((s, t) => s + t.amount, 0)
    - completedTrades.filter((t) => t.status === 'won').reduce((s, t) => s + (t.profit || 0), 0);

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'analytics', label: 'Stats', icon: BarChart3 },
    { key: 'deposits', label: 'Deposits', icon: ArrowDownToLine },
    { key: 'withdrawals', label: 'Withdrawals', icon: ArrowUpFromLine },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'settings', label: 'Config', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="px-4 py-4 border-b border-border bg-surface-1">
        <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Admin Panel
        </h1>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-shrink-0 py-2.5 px-3 text-xs font-medium text-center transition-colors border-b-2 ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4 mx-auto mb-0.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3">
        {activeTab === 'analytics' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Users', value: users.length, icon: Users, color: 'text-primary' },
                { label: 'Total Trades', value: totalTrades, icon: TrendingUp, color: 'text-trade-yellow' },
                { label: 'Total Deposits', value: `$${totalDeposits.toFixed(0)}`, icon: ArrowDownToLine, color: 'text-trade-green' },
                { label: 'Total Withdrawals', value: `$${totalWithdrawals.toFixed(0)}`, icon: ArrowUpFromLine, color: 'text-trade-red' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass rounded-xl p-4"
                >
                  <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold font-mono text-foreground">{stat.value}</p>
                </motion.div>
              ))}
            </div>

            <div className="glass rounded-xl p-4 text-center">
              <DollarSign className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Platform Profit</p>
              <p className={`text-2xl font-bold font-mono ${platformProfit >= 0 ? 'text-trade-green' : 'text-trade-red'}`}>
                ${platformProfit.toFixed(2)}
              </p>
            </div>

            <div className="glass rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">Pending Actions</h3>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-trade-yellow">{deposits.filter((d) => d.status === 'pending').length}</p>
                  <p className="text-xs text-muted-foreground">Deposits</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-trade-yellow">{withdrawals.filter((w) => w.status === 'pending').length}</p>
                  <p className="text-xs text-muted-foreground">Withdrawals</p>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'deposits' && (
          <>
            {deposits.length === 0 ? (
              <p className="text-center py-10 text-muted-foreground text-sm">No deposits</p>
            ) : (
              deposits.map((d, i) => (
                <motion.div key={d.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{d.userEmail}</p>
                      <p className="text-xs text-muted-foreground">{d.method} · {new Date(d.timestamp).toLocaleString()}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${d.status === 'approved' ? 'bg-trade-green/20 text-trade-green' : d.status === 'rejected' ? 'bg-trade-red/20 text-trade-red' : 'bg-trade-yellow/20 text-trade-yellow'}`}>{d.status}</span>
                  </div>
                  <p className="text-lg font-bold font-mono text-foreground">${d.amount}</p>
                  {d.pkrAmount && <p className="text-xs text-muted-foreground">PKR {d.pkrAmount}</p>}
                  {d.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" onClick={() => approveDeposit(d.id)} className="flex-1 h-8"><Check className="w-3 h-3 mr-1" /> Approve</Button>
                      <Button size="sm" variant="destructive" onClick={() => rejectDeposit(d.id)} className="flex-1 h-8"><X className="w-3 h-3 mr-1" /> Reject</Button>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </>
        )}

        {activeTab === 'withdrawals' && (
          <>
            {withdrawals.length === 0 ? (
              <p className="text-center py-10 text-muted-foreground text-sm">No withdrawals</p>
            ) : (
              withdrawals.map((w, i) => (
                <motion.div key={w.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{w.userEmail}</p>
                      <p className="text-xs text-muted-foreground">{w.method} · {new Date(w.timestamp).toLocaleString()}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${w.status === 'approved' ? 'bg-trade-green/20 text-trade-green' : w.status === 'rejected' ? 'bg-trade-red/20 text-trade-red' : 'bg-trade-yellow/20 text-trade-yellow'}`}>{w.status}</span>
                  </div>
                  <p className="text-lg font-bold font-mono text-foreground">${w.amount}</p>
                  <div className="text-xs text-muted-foreground mt-1">
                    {Object.entries(w.details || {}).map(([k, v]) => (<p key={k}>{k}: {v as string}</p>))}
                  </div>
                  {w.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" onClick={() => approveWithdrawal(w.id)} className="flex-1 h-8"><Check className="w-3 h-3 mr-1" /> Approve</Button>
                      <Button size="sm" variant="destructive" onClick={() => rejectWithdrawal(w.id)} className="flex-1 h-8"><X className="w-3 h-3 mr-1" /> Reject</Button>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </>
        )}

        {activeTab === 'users' && (
          <>
            {users.map((u: any, i) => (
              <motion.div key={u.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-foreground">{u.fullName}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                  <p className="text-xs text-muted-foreground">{u.country}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-foreground">${u.balance?.toFixed(2)}</p>
                  {u.isAdmin && <span className="text-xs text-primary">Admin</span>}
                </div>
              </motion.div>
            ))}
          </>
        )}

        {activeTab === 'settings' && (
          <div className="glass rounded-xl p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Trade Configuration</h3>
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Profit Percentage (%)</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={newProfitPercent}
                  onChange={(e) => setNewProfitPercent(e.target.value)}
                  className="bg-muted border-border font-mono"
                  min="1"
                  max="100"
                />
                <Button onClick={() => {
                  const val = Number(newProfitPercent);
                  if (val >= 1 && val <= 100) {
                    setProfitPercent(val);
                    toast.success(`Profit % set to ${val}%`);
                  }
                }}>
                  Save
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Current: {profitPercent}% (winning trades earn this %)</p>
            </div>
            <div className="flex gap-2">
              {[80, 82, 85, 90, 95].map((p) => (
                <button
                  key={p}
                  onClick={() => { setProfitPercent(p); setNewProfitPercent(String(p)); toast.success(`Set to ${p}%`); }}
                  className={`px-3 py-1.5 rounded text-xs font-medium ${profitPercent === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default AdminPanel;
