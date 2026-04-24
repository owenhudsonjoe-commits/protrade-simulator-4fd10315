import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/contexts/AuthContext';

const SUPPORT_EMAIL = 'contact.FXonix@gmail.com';
const LAST_UPDATED = 'April 24, 2026';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-2">
    <h2 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h2>
    <div className="text-sm text-white/70 leading-relaxed space-y-2">{children}</div>
  </section>
);

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

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
          <ShieldCheck className="w-5 h-5 text-[#00e676]" />
          Privacy Policy
        </h1>
      </header>

      <div className="relative p-4 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 p-6 space-y-6"
          style={{
            background: 'rgba(255,255,255,0.035)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          }}
        >
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
              Last updated: {LAST_UPDATED}
            </p>
            <p className="text-sm text-white/70 leading-relaxed">
              Your privacy matters to us. This Privacy Policy explains what information FXonix
              collects, how it is used, and the choices you have. By using FXonix you agree to
              the practices described below.
            </p>
          </div>

          <Section title="1. Information We Collect">
            <p>When you create an account or use FXonix we may collect:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Account details you provide (full name, email address, country).</li>
              <li>Authentication data (a securely hashed password and one-time codes).</li>
              <li>Trading activity (trades, results, balance changes, deposits, withdrawals).</li>
              <li>Device and usage data (browser type, locale, error logs).</li>
            </ul>
          </Section>

          <Section title="2. Where Your Data Is Stored">
            <p>
              FXonix is a client-side application. Your account, trades and balance are stored
              locally in your browser using <span className="font-mono text-white/85">localStorage</span>.
              Clearing your browser data will remove your account from this device.
            </p>
          </Section>

          <Section title="3. How We Use Your Information">
            <ul className="list-disc pl-5 space-y-1">
              <li>To create and secure your account.</li>
              <li>To execute and record your trades and wallet activity.</li>
              <li>To verify your identity through one-time codes during signup or password reset.</li>
              <li>To maintain, debug and improve the platform.</li>
              <li>To respond to your support requests.</li>
            </ul>
          </Section>

          <Section title="4. Sharing of Information">
            <p>
              We do not sell your personal information. Information is only shared when required
              to operate the service, comply with the law, or protect the rights and safety of
              FXonix and its users.
            </p>
          </Section>

          <Section title="5. Security">
            <p>
              Passwords are stored as one-way SHA-256 hashes. We use modern web security
              practices to protect your data, but no method of electronic storage is 100% secure.
              You are responsible for safeguarding your login credentials.
            </p>
          </Section>

          <Section title="6. Your Rights">
            <p>
              You may access, update or delete your account information at any time from your
              Profile. You can also contact us to request data removal or to ask any
              privacy-related question.
            </p>
          </Section>

          <Section title="7. Children's Privacy">
            <p>
              FXonix is not directed to anyone under 18. We do not knowingly collect personal
              information from minors. If you believe a minor has provided us data, please
              contact us so we can remove it.
            </p>
          </Section>

          <Section title="8. Risk Disclosure">
            <p>
              Trading involves substantial risk and may not be suitable for every investor. Past
              performance does not guarantee future results. Only trade with funds you can
              afford to lose.
            </p>
          </Section>

          <Section title="9. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. Material changes will be
              communicated through the app. The "Last updated" date at the top reflects the
              latest revision.
            </p>
          </Section>

          <Section title="10. Contact Us">
            <p>
              For privacy questions or requests, email us at{' '}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-[#00e676] font-semibold hover:underline break-all"
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </Section>
        </motion.div>

        <p className="text-center text-[10px] text-white/20 mt-6">FXonix • v1.0</p>
      </div>

      {user && <BottomNav />}
    </div>
  );
};

export default PrivacyPolicy;
