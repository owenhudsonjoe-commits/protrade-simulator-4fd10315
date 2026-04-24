import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, TrendingUp, BarChart2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/trade');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#060810]">
      {/* Ambient background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-600/8 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      {/* Decorative grid lines */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(34,197,94,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.6) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating stat cards — decorative */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6, duration: 0.7 }}
        className="absolute left-8 top-1/3 hidden lg:flex flex-col gap-3"
      >
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 backdrop-blur-md flex items-center gap-3 shadow-xl">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Win Rate</p>
            <p className="text-sm font-semibold text-emerald-400">89.4%</p>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 backdrop-blur-md flex items-center gap-3 shadow-xl ml-6">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <BarChart2 className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Volume 24h</p>
            <p className="text-sm font-semibold text-white/80">$2.4M</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.7, duration: 0.7 }}
        className="absolute right-8 top-1/3 hidden lg:flex flex-col gap-3 items-end"
      >
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 backdrop-blur-md flex items-center gap-3 shadow-xl">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Secured</p>
            <p className="text-sm font-semibold text-white/80">256-bit SSL</p>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 backdrop-blur-md flex items-center gap-3 shadow-xl mr-6">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Markets</p>
            <p className="text-sm font-semibold text-white/80">Live</p>
          </div>
        </div>
      </motion.div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-[400px] mx-4"
      >
        {/* Logo + heading */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 shadow-lg shadow-primary/20 mb-5"
          >
            <TrendingUp className="w-7 h-7 text-primary" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            FX<span className="text-primary">onix</span>
          </h1>
          <p className="text-sm text-white/40 mt-1.5">Sign in to access your account</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-2xl overflow-hidden"
          style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 24px 64px rgba(0,0,0,0.5)' }}
        >
          {/* Top accent bar */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

          <div className="p-7">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Email</label>
                <div className="relative">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-primary/20 h-11 rounded-xl transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Password</label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-primary/20 h-11 rounded-xl pr-11 transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-2 rounded-xl font-semibold text-sm bg-gradient-to-r from-primary to-emerald-400 text-black hover:from-primary/90 hover:to-emerald-400/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black/80 rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-white/8 text-center">
              <p className="text-sm text-white/35">
                No account yet?{' '}
                <Link
                  to="/signup"
                  className="text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          Protected by end-to-end encryption
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
