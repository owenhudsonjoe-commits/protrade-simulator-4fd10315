import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, MessageCircle, Copy, Check, Send, Clock, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/contexts/AuthContext';

const SUPPORT_EMAIL = 'contact.FXonix@gmail.com';

const Contact = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setCopied(true);
      toast.success('Email copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy. Please copy manually.');
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error('Please add a subject and a message');
      return;
    }
    const body = encodeURIComponent(
      `${message}\n\n— Sent from FXonix${user ? ` (${user.email})` : ''}`
    );
    const subj = encodeURIComponent(subject);
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subj}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-[#060810] pb-24 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[#00e676]/8 blur-[120px]" />
      </div>

      <header className="relative px-4 py-4 border-b border-white/8 bg-white/[0.02] backdrop-blur-xl flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-[#00e676]" />
          Contact Us
        </h1>
      </header>

      <div className="relative p-4 max-w-lg mx-auto space-y-4">
        {/* Hero / email card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 p-6"
          style={{
            background: 'rgba(255,255,255,0.035)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: 'linear-gradient(135deg, #00e676 0%, #00b248 100%)',
              boxShadow: '0 0 32px rgba(0,230,118,0.35)',
            }}
          >
            <Mail className="w-6 h-6 text-black" />
          </div>
          <h2 className="text-xl font-bold text-white">We're here to help</h2>
          <p className="text-sm text-white/60 mt-1">
            Questions, feedback, or account issues? Reach our team and we'll get back to you as
            soon as possible.
          </p>

          <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
            <Mail className="w-4 h-4 text-[#00e676] shrink-0" />
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="flex-1 text-sm text-white font-mono truncate hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
            <button
              onClick={handleCopy}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors shrink-0"
              aria-label="Copy email"
            >
              {copied ? (
                <Check className="w-4 h-4 text-[#00e676]" />
              ) : (
                <Copy className="w-4 h-4 text-white/70" />
              )}
            </button>
          </div>
        </motion.div>

        {/* Info row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 gap-3"
        >
          <div
            className="rounded-xl border border-white/10 p-4"
            style={{ background: 'rgba(255,255,255,0.035)', backdropFilter: 'blur(24px)' }}
          >
            <Clock className="w-4 h-4 text-[#00e676] mb-2" />
            <p className="text-[10px] text-white/45 uppercase tracking-wider">Response Time</p>
            <p className="text-sm font-semibold text-white mt-0.5">Within 24 hours</p>
          </div>
          <div
            className="rounded-xl border border-white/10 p-4"
            style={{ background: 'rgba(255,255,255,0.035)', backdropFilter: 'blur(24px)' }}
          >
            <ShieldCheck className="w-4 h-4 text-[#00e676] mb-2" />
            <p className="text-[10px] text-white/45 uppercase tracking-wider">Support</p>
            <p className="text-sm font-semibold text-white mt-0.5">Account & Trading</p>
          </div>
        </motion.div>

        {/* Quick message form */}
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSend}
          className="rounded-2xl border border-white/10 p-5 space-y-4"
          style={{ background: 'rgba(255,255,255,0.035)', backdropFilter: 'blur(24px)' }}
        >
          <div>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">
              Send a Message
            </p>
            <p className="text-xs text-white/60 mb-3">
              This opens your email app with the message pre-filled.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="How can we help?"
              className="w-full h-11 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00e676]/50 focus:bg-white/[0.07] transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue or question…"
              rows={5}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00e676]/50 focus:bg-white/[0.07] transition-colors resize-none"
            />
          </div>

          <motion.button
            type="submit"
            whileTap={{ scale: 0.98 }}
            className="w-full h-12 rounded-xl font-semibold text-black flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #00e676 0%, #00b248 100%)',
              boxShadow: '0 8px 24px rgba(0,230,118,0.25)',
            }}
          >
            <Send className="w-4 h-4" />
            Send Email
          </motion.button>
        </motion.form>

        <p className="text-center text-[10px] text-white/20">FXonix • v1.0</p>
      </div>

      {user && <BottomNav />}
    </div>
  );
};

export default Contact;
