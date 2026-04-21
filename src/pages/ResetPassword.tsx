import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { ShieldCheck, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import OtpForm from '@/components/OtpForm';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyPasswordResetOtp, requestPasswordReset } = useAuth();
  const stateEmail = (location.state as any)?.email as string | undefined;

  const [email, setEmail] = useState(stateEmail || '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error('Enter the 6-digit code');
      return;
    }
    setLoading(true);
    try {
      await verifyPasswordResetOtp(email, code, password);
      toast.success('Password reset! You are now signed in.');
      navigate('/trade');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    setResending(true);
    try {
      await requestPasswordReset(email);
      toast.success('A new code has been sent.');
      setCooldown(45);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#060810] px-4 py-8">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-600/8 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-[420px]"
      >
        <Link to="/forgot-password" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00e676]/30 to-[#00e676]/10 border border-[#00e676]/30 shadow-lg shadow-[#00e676]/20 mb-5">
            <ShieldCheck className="w-7 h-7 text-[#00e676]" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Reset your password</h1>
          <p className="text-sm text-white/45 mt-2">Enter the code we sent and choose a new password.</p>
        </div>

        <div
          className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-7"
          style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {!stateEmail && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-12 rounded-xl"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block text-center">
                6-Digit Code
              </label>
              <OtpForm value={code} onChange={setCode} disabled={loading} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">New Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-12 rounded-xl pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6 || !password}
              className="w-full h-12 rounded-xl font-bold text-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{
                background: 'linear-gradient(135deg, #00e676 0%, #00c853 100%)',
                boxShadow: '0 0 28px rgba(0,230,118,0.35)',
              }}
            >
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-white/10 text-center">
            <p className="text-sm text-white/40">
              Didn't get the code?{' '}
              <button
                onClick={handleResend}
                disabled={resending || cooldown > 0 || !email}
                className="text-[#00e676] hover:text-[#33ff92] font-semibold disabled:opacity-50"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? 'Sending…' : 'Resend code'}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
