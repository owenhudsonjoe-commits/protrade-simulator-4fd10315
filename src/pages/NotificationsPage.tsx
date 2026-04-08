import BottomNav from '@/components/BottomNav';
import { Bell, CheckCircle, XCircle, TrendingUp, ArrowDownToLine } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

const NotificationsPage = () => {
  const { user } = useAuth();

  // Get notifications from deposits and withdrawals
  const deposits = JSON.parse(localStorage.getItem('demo_deposits') || '[]')
    .filter((d: any) => d.userId === user?.id);
  const withdrawals = JSON.parse(localStorage.getItem('demo_withdrawals') || '[]')
    .filter((w: any) => w.userId === user?.id);

  const notifications = [
    ...deposits.map((d: any) => ({
      id: d.id,
      type: 'deposit',
      message: `Deposit of $${d.amount} ${d.status === 'approved' ? 'approved' : d.status === 'rejected' ? 'rejected' : 'is pending'}`,
      status: d.status,
      time: d.timestamp,
      icon: ArrowDownToLine,
    })),
    ...withdrawals.map((w: any) => ({
      id: w.id,
      type: 'withdrawal',
      message: `Withdrawal of $${w.amount} via ${w.method} ${w.status === 'approved' ? 'approved' : w.status === 'rejected' ? 'rejected' : 'is pending'}`,
      status: w.status,
      time: w.timestamp,
      icon: TrendingUp,
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="px-4 py-4 border-b border-border bg-surface-1">
        <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Notifications
        </h1>
      </header>

      <div className="p-4 space-y-2">
        {notifications.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground text-sm">
            No notifications yet
          </div>
        ) : (
          notifications.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl p-4 flex items-start gap-3"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                n.status === 'approved' ? 'bg-trade-green/20' : n.status === 'rejected' ? 'bg-trade-red/20' : 'bg-trade-yellow/20'
              }`}>
                {n.status === 'approved' ? (
                  <CheckCircle className="w-4 h-4 text-trade-green" />
                ) : n.status === 'rejected' ? (
                  <XCircle className="w-4 h-4 text-trade-red" />
                ) : (
                  <n.icon className="w-4 h-4 text-trade-yellow" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(n.time).toLocaleString()}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default NotificationsPage;
