import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp, Mail, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import OtpForm from '@/components/OtpForm';

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifySignupOtp, resendSignupOtp } = useAuth();
  const email = (location.state as any)?.email as string | undefined;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!email) navigate('/signup', { replace: true });
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || code.length !== 6) return;
    setLoading(true);
    try {
      await verifySignupOtp(email, code);
      toast.success('Email verified! Welcome to FXonix.');
      navigate('/account-creating', { state: { email }, replace: true });
    } catch (err: any) {
      toast.error(err.message);
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    setResending(true);
    try {
      await resendSignupOtp(email);
      toast.success('A new code has been sent to your email.');
      setCooldown(45);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#060810] px-4">
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
        <Link to="/signup" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="text-center mb-7">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00e676]/30 to-[#00e676]/10 border border-[#00e676]/30 shadow-lg shadow-[#00e676]/20 mb-5"
          >
            <Mail className="w-7 h-7 text-[#00e676]" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Verify your email</h1>
          <p className="text-sm text-white/45 mt-2">
            We sent a 6-digit code to <br />
            <span className="text-white/80 font-medium">{email}</span>
          </p>
        </div>

        <div
          className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-7"
          style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
        >
          <form onSubmit={handleVerify} className="space-y-6">
            <OtpForm value={code} onChange={setCode} disabled={loading} />

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full h-12 rounded-xl font-bold text-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{
                background: 'linear-gradient(135deg, #00e676 0%, #00c853 100%)',
                boxShadow: '0 0 28px rgba(0,230,118,0.35)',
              }}
            >
              {loading ? 'Verifying…' : 'Verify Email'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <p className="text-sm text-white/40">
              Didn't get the code?{' '}
              <button
                onClick={handleResend}
                disabled={resending || cooldown > 0}
                className="text-[#00e676] hover:text-[#33ff92] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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

export default VerifyEmail;
