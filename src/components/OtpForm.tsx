import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { motion } from 'framer-motion';

interface OtpFormProps {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

const OtpForm = ({ value, onChange, disabled }: OtpFormProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-center"
    >
      <InputOTP maxLength={6} value={value} onChange={onChange} disabled={disabled}>
        <InputOTPGroup className="gap-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <InputOTPSlot
              key={i}
              index={i}
              className="w-11 h-13 sm:w-12 sm:h-14 text-xl font-bold rounded-xl border-white/10 bg-white/5 text-white first:rounded-l-xl last:rounded-r-xl"
            />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </motion.div>
  );
};

export default OtpForm;
