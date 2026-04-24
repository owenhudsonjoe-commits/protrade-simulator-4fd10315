import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Shield, Database, Mail, CheckCircle2 } from 'lucide-react';

interface Step {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  duration: number;
}

const STEPS: Step[] = [
  { label: 'Securing your account…',          icon: Shield,        duration: 2400 },
  { label: 'Setting up your trading wallet…', icon: TrendingUp,    duration: 2600 },
  { label: 'Encrypting your credentials…',    icon: Database,      duration: 2400 },
  { label: 'Preparing verification email…',   icon: Mail,          duration: 2600 },
  { label: 'Finalizing your profile…',        icon: CheckCircle2,  duration: 2000 },
];

const TOTAL_MS = STEPS.reduce((s, x) => s + x.duration, 0);

const AccountCreating = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as any)?.email as string | undefined;

  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!email) {
      navigate('/signup', { replace: true });
      return;
    }

    const startedAt = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const pct = Math.min(100, (elapsed / TOTAL_MS) * 100);
      setProgress(pct);

      let acc = 0;
      for (let i = 0; i < STEPS.length; i++) {
        acc += STEPS[i].duration;
        if (elapsed < acc) {
          setStepIndex(i);
          break;
        }
      }

      if (elapsed >= TOTAL_MS) {
        clearInterval(tick);
        setStepIndex(STEPS.length - 1);
        setProgress(100);
        setTimeout(() => {
          navigate('/trade', { replace: true });
        }, 400);
      }
    }, 100);

    return () => clearInterval(tick);
  }, [email, navigate]);

  const ActiveIcon = STEPS[stepIndex].icon;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#060810] px-4">
      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[#00e676]/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-600/8 blur-[120px]" />
      </div>

      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(34,197,94,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.6) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-[440px]"
      >
        {/* Logo */}
        <div className="text-center mb-7">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-xl relative"
            style={{
              background: 'linear-gradient(135deg, #00e676 0%, #00b248 100%)',
              boxShadow: '0 0 32px rgba(0,230,118,0.35)',
            }}
          >
            <TrendingUp className="w-8 h-8 text-black" strokeWidth={2.5} />
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-[#00e676]/40"
              animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
            />
          </motion.div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            <span className="text-white">FX</span>
            <span className="text-[#00e676]">onix</span>
          </h1>
          <p className="text-sm text-white/45 mt-1">Setting up your account</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border border-white/10 p-7"
          style={{
            background: 'rgba(255,255,255,0.035)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          }}
        >
          {/* Spinner with active icon */}
          <div className="flex justify-center mb-6">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="6"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="url(#progress-gradient)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 44}
                  animate={{ strokeDashoffset: 2 * Math.PI * 44 * (1 - progress / 100) }}
                  transition={{ duration: 0.2, ease: 'linear' }}
                />
                <defs>
                  <linearGradient id="progress-gradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#00e676" />
                    <stop offset="100%" stopColor="#00c853" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={stepIndex}
                    initial={{ scale: 0.6, opacity: 0, rotate: -20 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0.6, opacity: 0, rotate: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ActiveIcon className="w-8 h-8 text-[#00e676]" />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Active step label */}
          <div className="text-center min-h-[28px] mb-5">
            <AnimatePresence mode="wait">
              <motion.p
                key={stepIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="text-base font-semibold text-white"
              >
                {STEPS[stepIndex].label}
              </motion.p>
            </AnimatePresence>
            <p className="text-xs text-white/40 mt-1">{Math.round(progress)}% complete</p>
          </div>

          {/* Step list */}
          <div className="space-y-2.5">
            {STEPS.map((s, i) => {
              const done = i < stepIndex || progress >= 100;
              const active = i === stepIndex && progress < 100;
              return (
                <div
                  key={s.label}
                  className="flex items-center gap-3 text-sm transition-colors"
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                      done
                        ? 'bg-[#00e676]/20 border-[#00e676]/50'
                        : active
                        ? 'bg-white/5 border-white/30'
                        : 'bg-white/[0.02] border-white/10'
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00e676]" />
                    ) : active ? (
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-[#00e676]"
                        animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                      />
                    ) : null}
                  </div>
                  <span className={done ? 'text-white/80' : active ? 'text-white' : 'text-white/35'}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-center text-xs text-white/25 mt-5">
          Please don't close this window
        </p>
      </motion.div>
    </div>
  );
};

export default AccountCreating;
