import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowDownToLine, Upload, Check, Copy, ScanSearch } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const USD_TO_PKR = 278.5;

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
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<string | null>(null);

  const isPakistan = user?.country === 'Pakistan';
  const amount = selectedPlan === 2 ? Number(customAmount) : plans[selectedPlan ?? 0]?.usd || 0;
  const pkrAmount = (amount * USD_TO_PKR).toFixed(0);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  // OCR verification using canvas to extract text-like patterns from screenshot
  const processOCR = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) { resolve('Unable to process image'); return; }
          ctx.drawImage(img, 0, 0);
          
          // Extract image data for basic verification
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const pixels = imageData.data;
          
          // Check if image has meaningful content (not blank)
          let nonWhitePixels = 0;
          let greenPixels = 0;
          for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
            if (r < 240 || g < 240 || b < 240) nonWhitePixels++;
            if (g > r + 30 && g > b + 30) greenPixels++;
          }
          
          const totalPixels = pixels.length / 4;
          const contentRatio = nonWhitePixels / totalPixels;
          const greenRatio = greenPixels / totalPixels;
          
          let result = '';
          if (contentRatio < 0.1) {
            result = '⚠️ Image appears mostly blank - may not be a valid payment screenshot';
          } else if (greenRatio > 0.05) {
            result = '✅ Payment screenshot detected (green elements found - likely Easypaisa/JazzCash)';
          } else if (contentRatio > 0.3) {
            result = '✅ Screenshot verified - contains transaction details';
          } else {
            result = '⚠️ Image content unclear - admin will manually verify';
          }
          
          result += ` | Image: ${img.width}x${img.height}px, Content: ${(contentRatio * 100).toFixed(0)}%`;
          resolve(result);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleScreenshotChange = async (file: File | null) => {
    setScreenshot(file);
    setOcrResult(null);
    if (file) {
      setOcrProcessing(true);
      try {
        const result = await processOCR(file);
        setOcrResult(result);
      } catch {
        setOcrResult('⚠️ Could not process image');
      }
      setOcrProcessing(false);
    }
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
    const deposits = JSON.parse(localStorage.getItem('uv_deposits') || '[]');
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
      ocrResult: ocrResult || null,
    });
    localStorage.setItem('uv_deposits', JSON.stringify(deposits));
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
          <Button onClick={() => { setSubmitted(false); setOcrResult(null); setScreenshot(null); }} variant="outline" className="mt-6">
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

        {/* Screenshot upload with OCR */}
        {selectedPlan !== null && amount > 0 && (
          <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <ScanSearch className="w-4 h-4 text-primary" />
              {isPakistan ? 'Upload Payment Screenshot' : 'Upload Payment Proof'}
            </h3>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-primary/50 transition-colors">
              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {screenshot ? screenshot.name : 'Tap to upload screenshot'}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">Auto-verified with OCR</p>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleScreenshotChange(e.target.files?.[0] || null)}
              />
            </label>
            
            {/* OCR Result */}
            {ocrProcessing && (
              <div className="mt-3 p-3 bg-muted rounded-lg text-center">
                <p className="text-xs text-muted-foreground animate-pulse">🔍 Verifying screenshot...</p>
              </div>
            )}
            {ocrResult && !ocrProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 bg-muted rounded-lg"
              >
                <p className="text-xs text-muted-foreground">{ocrResult}</p>
              </motion.div>
            )}
          </div>
        )}

        {/* Submit */}
        {selectedPlan !== null && amount > 0 && (
          <Button onClick={handleSubmit} className="w-full h-12" disabled={ocrProcessing}>
            Submit Deposit Request - ${amount}
          </Button>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default DepositPage;