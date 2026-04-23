import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowDownToLine, Upload, Check, Copy, ScanLine, QrCode, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import Tesseract from 'tesseract.js';
import qr50 from '@/assets/qr-50.png';
import qr100 from '@/assets/qr-100.png';

const USD_TO_PKR = 278.5;

const plans = [
  { usd: 50, label: '$50' },
  { usd: 100, label: '$100' },
  { usd: 0, label: 'Custom' },
];

const EASYPAISA_ACCOUNT = '03703770146';

type OcrStatus = 'idle' | 'processing' | 'verified' | 'warning' | 'failed';

interface OcrAnalysis {
  status: OcrStatus;
  message: string;
  detectedAmount?: number | null;
  detectedAccount?: string | null;
  rawText?: string;
  confidence?: number;
}

const DepositPage = () => {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [ocr, setOcr] = useState<OcrAnalysis>({ status: 'idle', message: '' });

  const isPakistan = user?.country === 'Pakistan';
  const amount = selectedPlan === 2 ? Number(customAmount) : plans[selectedPlan ?? 0]?.usd || 0;
  const pkrAmount = Math.round(amount * USD_TO_PKR);


  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied`);
    setTimeout(() => setCopied(null), 1800);
  };

  const runOCR = async (file: File) => {
    setOcr({ status: 'processing', message: 'Scanning screenshot…' });
    try {
      const { data } = await Tesseract.recognize(file, 'eng', {
        logger: () => {}, // silent
      });
      const rawText = (data.text || '').replace(/\s+/g, ' ').trim();
      const confidence = data.confidence ?? 0;
      const lower = rawText.toLowerCase();

      // Find a number close to the expected PKR amount.
      const numbers = Array.from(rawText.matchAll(/(\d{1,3}(?:[,]\d{3})+|\d{3,7})(?:\.\d{1,2})?/g))
        .map((m) => Number(m[0].replace(/,/g, '')))
        .filter((n) => !isNaN(n) && n >= 100 && n <= 10_000_000);
      const detectedAmount =
        numbers.find((n) => Math.abs(n - pkrAmount) <= Math.max(5, pkrAmount * 0.02)) ??
        numbers.find((n) => n === pkrAmount) ??
        null;

      // Try to find the merchant account number.
      const accMatch = rawText.match(/0\d{10}/);
      const detectedAccount = accMatch?.[0] ?? null;

      const mentionsEasypaisa =
        lower.includes('easypaisa') || lower.includes('easy paisa') || lower.includes('jazzcash');
      const mentionsSuccess =
        lower.includes('successful') ||
        lower.includes('success') ||
        lower.includes('paid') ||
        lower.includes('completed') ||
        lower.includes('transaction id') ||
        lower.includes('trx id');

      let status: OcrStatus = 'warning';
      let message = '';

      if (!rawText || rawText.length < 10) {
        status = 'failed';
        message = 'Could not read any text from this image. Upload a clearer screenshot.';
      } else if (
        detectedAmount &&
        (detectedAccount === EASYPAISA_ACCOUNT || mentionsEasypaisa) &&
        mentionsSuccess
      ) {
        status = 'verified';
        message = `Verified: PKR ${detectedAmount.toLocaleString()} sent successfully.`;
      } else if (detectedAmount && (mentionsEasypaisa || detectedAccount)) {
        status = 'verified';
        message = `Amount PKR ${detectedAmount.toLocaleString()} matched. Awaiting admin confirmation.`;
      } else if (mentionsEasypaisa || detectedAccount) {
        status = 'warning';
        message = `Easypaisa receipt detected, but amount didn't match PKR ${pkrAmount.toLocaleString()}.`;
      } else {
        status = 'warning';
        message = 'This does not look like an Easypaisa receipt. Admin will manually review.';
      }

      setOcr({ status, message, detectedAmount, detectedAccount, rawText, confidence });
    } catch (e) {
      setOcr({
        status: 'failed',
        message: 'OCR engine failed. You can still submit, admin will verify manually.',
      });
    }
  };

  const handleScreenshotChange = async (file: File | null) => {
    setScreenshot(file);
    if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
    setScreenshotPreview(file ? URL.createObjectURL(file) : null);
    setOcr({ status: 'idle', message: '' });
    if (file) await runOCR(file);
  };

  const handleSubmit = () => {
    if (amount <= 0) return toast.error('Select a valid plan');
    if (isPakistan && !screenshot) return toast.error('Please upload payment screenshot');
    if (ocr.status === 'processing') return toast.error('Wait for verification to finish');

    const deposits = JSON.parse(localStorage.getItem('uv_deposits') || '[]');
    deposits.push({
      id: `dep-${Date.now()}`,
      userId: user?.id,
      userEmail: user?.email,
      amount,
      pkrAmount: isPakistan ? pkrAmount : null,
      method: isPakistan ? 'Easypaisa QR' : 'Bank Transfer',
      status: 'pending',
      timestamp: new Date().toISOString(),
      screenshotName: screenshot?.name || null,
      ocrStatus: ocr.status,
      ocrMessage: ocr.message,
      ocrDetectedAmount: ocr.detectedAmount ?? null,
      ocrDetectedAccount: ocr.detectedAccount ?? null,
    });
    localStorage.setItem('uv_deposits', JSON.stringify(deposits));
    setSubmitted(true);
    toast.success('Deposit request submitted!');
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
          <Button
            onClick={() => {
              setSubmitted(false);
              setScreenshot(null);
              setScreenshotPreview(null);
              setOcr({ status: 'idle', message: '' });
            }}
            variant="outline"
            className="mt-6"
          >
            Make Another Deposit
          </Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-4 py-4 border-b border-border bg-surface-1 sticky top-0 z-10 backdrop-blur-md">
        <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
          <ArrowDownToLine className="w-5 h-5 text-primary" />
          Deposit Funds
        </h1>
      </header>

      <div className="p-4 space-y-4">
        {/* Plan selection */}
        <div className="glass rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Select Amount</h3>
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

        {/* QR Scan payment */}
        {selectedPlan !== null && amount > 0 && isPakistan && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <QrCode className="w-4 h-4 text-primary" />
                Scan with Easypaisa
              </h3>
              <span className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/30">
                LIVE QR
              </span>
            </div>

            <div className="flex flex-col items-center bg-white rounded-xl p-4">
              <img
                src={selectedPlan === 0 ? qr50 : qr100}
                alt={`Easypaisa QR for PKR ${pkrAmount}`}
                className="w-52 h-52 object-contain"
                draggable={false}
              />
              <p className="text-[11px] text-neutral-600 mt-2 font-medium">
                Open Easypaisa → Scan QR → Pay PKR {pkrAmount.toLocaleString()}
              </p>
            </div>

            <div className="space-y-2 mt-3">
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-lg p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  Send exactly
                </p>
                <p className="text-2xl font-bold font-mono text-primary">
                  PKR {pkrAmount.toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground">(${amount} USD)</p>
                <p className="text-[11px] text-muted-foreground mt-1">Scan with Easypaisa</p>
                <button
                  onClick={() => handleCopy(String(pkrAmount), 'Amount')}
                  className="text-[10px] text-primary mt-1 underline"
                >
                  {copied === 'Amount' ? 'Copied!' : 'Copy amount'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Screenshot + OCR */}
        {selectedPlan !== null && amount > 0 && (
          <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <ScanLine className="w-4 h-4 text-primary" />
              Upload Payment Screenshot
            </h3>

            <label className="relative flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors overflow-hidden">
              {screenshotPreview ? (
                <div className="w-full">
                  <img
                    src={screenshotPreview}
                    alt="Payment proof"
                    className="w-full max-h-48 object-contain rounded-md"
                  />
                  <p className="text-[11px] text-muted-foreground mt-2 text-center truncate">
                    {screenshot?.name} · Tap to replace
                  </p>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Tap to upload screenshot</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Auto-verified with real OCR (text scan)
                  </p>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleScreenshotChange(e.target.files?.[0] || null)}
              />
            </label>

            {/* OCR result panel */}
            <AnimatePresence mode="wait">
              {ocr.status !== 'idle' && (
                <motion.div
                  key={ocr.status}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`mt-3 rounded-lg p-3 border ${
                    ocr.status === 'verified'
                      ? 'border-primary/40 bg-primary/10'
                      : ocr.status === 'processing'
                      ? 'border-border bg-muted'
                      : ocr.status === 'failed'
                      ? 'border-destructive/40 bg-destructive/10'
                      : 'border-yellow-500/40 bg-yellow-500/10'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {ocr.status === 'processing' && (
                      <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0 mt-0.5" />
                    )}
                    {ocr.status === 'verified' && (
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    )}
                    {(ocr.status === 'warning' || ocr.status === 'failed') && (
                      <AlertTriangle
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          ocr.status === 'failed' ? 'text-destructive' : 'text-yellow-500'
                        }`}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">
                        {ocr.status === 'processing' && 'Scanning receipt with OCR…'}
                        {ocr.status === 'verified' && 'Payment receipt verified'}
                        {ocr.status === 'warning' && 'Needs manual review'}
                        {ocr.status === 'failed' && 'Verification failed'}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{ocr.message}</p>

                      {(ocr.detectedAmount || ocr.detectedAccount) && (
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {ocr.detectedAmount && (
                            <div className="bg-background/50 rounded p-2">
                              <p className="text-[9px] uppercase text-muted-foreground">
                                Detected Amount
                              </p>
                              <p className="text-xs font-mono text-foreground">
                                PKR {ocr.detectedAmount.toLocaleString()}
                              </p>
                            </div>
                          )}
                          {ocr.detectedAccount && (
                            <div className="bg-background/50 rounded p-2">
                              <p className="text-[9px] uppercase text-muted-foreground">
                                Detected Account
                              </p>
                              <p className="text-xs font-mono text-foreground truncate">
                                {ocr.detectedAccount}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Submit */}
        {selectedPlan !== null && amount > 0 && (
          <Button
            onClick={handleSubmit}
            className="w-full h-12 text-base font-semibold"
            disabled={ocr.status === 'processing'}
          >
            {ocr.status === 'processing' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying…
              </>
            ) : (
              `Submit Deposit – $${amount}`
            )}
          </Button>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default DepositPage;
