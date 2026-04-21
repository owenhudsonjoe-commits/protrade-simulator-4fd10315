import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Eye, EyeOff, Users, BarChart2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { countries } from '@/lib/countries';

const Signup = () => {
  const [fullName, setFullName]         = useState('');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [country, setCountry]           = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const { signup }   = useAuth();
  const navigate     = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!country) { toast.error('Please select your country'); return; }
    setLoading(true);
    try {
      const { needsVerification } = await signup(fullName, email, password, country);
      if (needsVerification) {
        toast.success('Check your email for the 6-digit verification code.');
        navigate('/verify-email', { state: { email: email.trim().toLowerCase() } });
      } else {
        toast.success('Account created! Deposit funds to start trading.');
        navigate('/deposit');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#060810] py-8 px-4">
      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-600/8 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(34,197,94,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.6) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating stat cards */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6, duration: 0.7 }}
        className="absolute left-8 top-1/3 hidden lg:flex flex-col gap-3"
      >
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 backdrop-blur-md flex items-center gap-3 shadow-xl">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Members</p>
            <p className="text-sm font-bold text-white">128,400+</p>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 backdrop-blur-md flex items-center gap-3 shadow-xl">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <BarChart2 className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Avg Return</p>
            <p className="text-sm font-bold text-white">82%</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.7, duration: 0.7 }}
        className="absolute right-8 top-1/3 hidden lg:flex flex-col gap-3"
      >
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 backdrop-blur-md flex items-center gap-3 shadow-xl">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Shield className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Security</p>
            <p className="text-sm font-bold text-white">256-bit SSL</p>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 backdrop-blur-md flex items-center gap-3 shadow-xl">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Free Bonus</p>
            <p className="text-sm font-bold text-emerald-400">$10 on signup</p>
          </div>
        </div>
      </motion.div>

      {/* Form card */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-7">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-xl"
            style={{
              background: 'linear-gradient(135deg, #00e676 0%, #00b248 100%)',
              boxShadow: '0 0 32px rgba(0,230,118,0.35)',
            }}
          >
            <TrendingUp className="w-8 h-8 text-black" strokeWidth={2.5} />
          </motion.div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            <span className="text-white">UV </span>
            <span className="text-[#00e676]">Trade</span>
          </h1>
          <p className="text-sm text-white/45 mt-1">Create your free trading account</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-7 border"
          style={{
            background: 'rgba(255,255,255,0.035)',
            borderColor: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          }}
        >
          {/* Green accent top bar */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-32 pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, #00e676, transparent)', top: 0 }}
          />

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full name */}
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-2 block">Full Name</label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                required
                className="h-12 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/25 focus:border-[#00e676]/50 focus:ring-[#00e676]/20"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-2 block">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="h-12 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/25 focus:border-[#00e676]/50 focus:ring-[#00e676]/20"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-2 block">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="h-12 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/25 focus:border-[#00e676]/50 focus:ring-[#00e676]/20 pr-12"
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

            {/* Country */}
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-2 block">Country</label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="h-12 rounded-xl border-white/10 bg-white/5 text-white focus:border-[#00e676]/50">
                  <SelectValue placeholder="Select your country" className="text-white/25" />
                </SelectTrigger>
                <SelectContent className="max-h-60 bg-[#0e1117] border-white/10">
                  {countries.map((c) => (
                    <SelectItem key={c} value={c} className="text-white hover:text-white focus:text-white focus:bg-white/10">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              whileTap={{ scale: 0.97 }}
              disabled={loading}
              className="w-full h-13 rounded-xl font-bold text-base text-black disabled:opacity-60 disabled:cursor-not-allowed transition-all mt-2"
              style={{
                height: '52px',
                background: loading
                  ? 'rgba(0,230,118,0.5)'
                  : 'linear-gradient(135deg, #00e676 0%, #00c853 100%)',
                boxShadow: loading ? 'none' : '0 0 28px rgba(0,230,118,0.35)',
              }}
            >
              {loading ? 'Creating account…' : 'Create Free Account'}
            </motion.button>
          </form>

          {/* Sign in link */}
          <p className="text-center text-sm text-white/35 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-[#00e676] hover:text-[#33ff92] font-semibold transition-colors">
              Sign In
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-white/20 mt-5">Protected by end-to-end encryption</p>
      </motion.div>
    </div>
  );
};

export default Signup;
