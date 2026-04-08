import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowDownToLine, Upload, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const USD_TO_PKR = 278.5; // Approximate rate

const plans = [
  { usd: 50, label: '$50' },
  { usd: 100, label: '$100' },
  { usd: 0, label: 'Custom' },
];

const DepositPage = () => {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  const isPakistan = user?.country === 'Pakistan';
  const amount = selectedPlan === 2 ? Number(customAmount) : plans[selectedPlan ?? 0]?.usd || 0;
  const pkrAmount = (amount * USD_TO_PKR).toFixed(0);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = () => {
    if (amount <= 0) {
      toast.error('Select a valid plan');
      return;
    }
    if (isPakistan && !screenshot) {
      toast.error('Please upload payment screenshot');
      return;
    }
    // Store deposit request
    const deposits = JSON.parse(localStorage.getItem('demo_deposits') || '[]');
    deposits.push({
      id: `dep-${Date.now()}`,
      userId: user?.id,
      userEmail: user?.email,
      amount,
      pkrAmount: isPakistan ? pkrAmount : null,
      method: isPakistan ? 'Easypaisa' : 'Bank Transfer',
      status: 'pending',
      timestamp: new Date().toISOString(),
      screenshotName: screenshot?.name || null,
    });
    localStorage.setItem('demo_deposits', JSON.stringify(deposits));
    setSubmitted(true);
    toast.success('Deposit request submitted! Admin will review shortly.');
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="px-4 py-4 border-b border-border bg-surface-1">
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ArrowDownToLine className="w-5 h-5 text-primary" />
            Deposit
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
            Your deposit of ${amount} is pending admin approval. You'll be notified once approved.
          </p>
          <Button onClick={() => setSubmitted(false)} variant="outline" className="mt-6">
            Make Another Deposit
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
          <ArrowDownToLine className="w-5 h-5 text-primary" />
          Deposit Funds
        </h1>
      </header>

      <div className="p-4 space-y-4">
        {/* Plan selection */}
        <div className="glass rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Select Plan</h3>
          <div className="grid grid-cols-3 gap-2">
            {plans.map((plan, i) => (
              <button
                key={i}
                onClick={() => setSelectedPlan(i)}
                className={`py-3 rounded-lg text-center transition-all border ${
                  selectedPlan === i
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-muted text-muted-foreground hover:border-primary/50'
                }`}
              >
                <span className="text-lg font-bold block">{plan.label}</span>
                {plan.usd > 0 && isPakistan && (
                  <span className="text-xs">≈ PKR {(plan.usd * USD_TO_PKR).toFixed(0)}</span>
                )}
              </button>
            ))}
          </div>

          {selectedPlan === 2 && (
            <div className="mt-3">
              <Input
                type="number"
                placeholder="Enter amount in USD"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="bg-muted border-border"
              />
              {isPakistan && customAmount && (
                <p className="text-xs text-muted-foreground mt-1">
                  ≈ PKR {(Number(customAmount) * USD_TO_PKR).toFixed(0)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Payment details */}
        {selectedPlan !== null && amount > 0 && isPakistan && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-4"
          >
            <h3 className="text-sm font-semibold text-foreground mb-3">Easypaisa Payment</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-muted rounded-lg p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Account Number</p>
                  <p className="font-mono text-sm text-foreground">03703770146</p>
                </div>
                <button onClick={() => handleCopy('03703770146')} className="text-primary">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <div className="flex justify-between items-center bg-muted rounded-lg p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Account Name</p>
                  <p className="text-sm text-foreground">Imtiazyan Saim</p>
                </div>
              </div>
              <div className="bg-primary/10 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Send exactly</p>
                <p className="text-xl font-bold font-mono text-primary">PKR {pkrAmount}</p>
                <p className="text-xs text-muted-foreground">(${amount} USD)</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Screenshot upload */}
        {selectedPlan !== null && amount > 0 && (
          <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              {isPakistan ? 'Upload Payment Screenshot' : 'Upload Payment Proof'}
            </h3>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-primary/50 transition-colors">
              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {screenshot ? screenshot.name : 'Tap to upload screenshot'}
              </p>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
              />
            </label>
          </div>
        )}

        {/* Submit */}
        {selectedPlan !== null && amount > 0 && (
          <Button onClick={handleSubmit} className="w-full h-12">
            Submit Deposit Request - ${amount}
          </Button>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default DepositPage;
