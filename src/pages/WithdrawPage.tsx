import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpFromLine, Check } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const methods = [
  { value: 'easypaisa', label: 'Easypaisa', fields: ['Account Number'] },
  { value: 'jazzcash', label: 'JazzCash', fields: ['Account Number'] },
  { value: 'bank', label: 'Bank Transfer', fields: ['Account Number', 'Bank Name', 'Account Title'] },
  { value: 'crypto', label: 'Crypto (USDT)', fields: ['Wallet Address', 'Network (TRC20/ERC20)'] },
];

const WithdrawPage = () => {
  const { user, updateBalance } = useAuth();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const selectedMethod = methods.find((m) => m.value === method);

  const handleSubmit = () => {
    const amt = Number(amount);
    if (amt <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (amt > (user?.balance || 0)) {
      toast.error('Insufficient balance');
      return;
    }
    if (!method) {
      toast.error('Select withdrawal method');
      return;
    }
    const emptyField = selectedMethod?.fields.find((f) => !fields[f]?.trim());
    if (emptyField) {
      toast.error(`Please fill ${emptyField}`);
      return;
    }

    const withdrawals = JSON.parse(localStorage.getItem('uv_withdrawals') || '[]');
    withdrawals.push({
      id: `wd-${Date.now()}`,
      userId: user?.id,
      userEmail: user?.email,
      amount: amt,
      method: selectedMethod?.label,
      details: fields,
      status: 'pending',
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem('uv_withdrawals', JSON.stringify(withdrawals));
    updateBalance(-amt);
    setSubmitted(true);
    toast.success('Withdrawal request submitted!');
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="px-4 py-4 border-b border-border bg-surface-1">
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ArrowUpFromLine className="w-5 h-5 text-primary" />
            Withdraw
          </h1>
        </header>
        <div className="flex flex-col items-center justify-center p-8 mt-20">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4"
          >
            <Check className="w-8 h-8 text-primary" />
          </motion.div>
          <h2 className="text-xl font-bold text-foreground mb-2">Request Submitted</h2>
          <p className="text-muted-foreground text-center text-sm">
            Your withdrawal of ${amount} is pending admin approval.
          </p>
          <Button onClick={() => { setSubmitted(false); setAmount(''); setMethod(''); setFields({}); }} variant="outline" className="mt-6">
            New Withdrawal
          </Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="px-4 py-4 border-b border-border bg-surface-1">
        <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
          <ArrowUpFromLine className="w-5 h-5 text-primary" />
          Withdraw Funds
        </h1>
      </header>

      <div className="p-4 space-y-4">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground">Available Balance</p>
          <p className="text-2xl font-bold font-mono text-foreground">${user?.balance.toFixed(2)}</p>
        </div>

        <div className="glass rounded-xl p-4 space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Amount ($)</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="bg-muted border-border font-mono"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Method</label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="bg-muted border-border">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {methods.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedMethod && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3"
            >
              {selectedMethod.fields.map((field) => (
                <div key={field}>
                  <label className="text-sm text-muted-foreground mb-1.5 block">{field}</label>
                  <Input
                    value={fields[field] || ''}
                    onChange={(e) => setFields({ ...fields, [field]: e.target.value })}
                    placeholder={`Enter ${field.toLowerCase()}`}
                    className="bg-muted border-border"
                  />
                </div>
              ))}
            </motion.div>
          )}
        </div>

        <Button onClick={handleSubmit} className="w-full h-12">
          Submit Withdrawal
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default WithdrawPage;