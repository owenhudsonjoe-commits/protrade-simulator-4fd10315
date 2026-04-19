import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface TradeResult {
  won: boolean;
  profit: number;
  amount: number;
  pairName: string;
  direction: string;
}

interface Props {
  result: TradeResult | null;
  onDismiss: () => void;
}

const TradeResultOverlay = ({ result, onDismiss }: Props) => {
  useEffect(() => {
    if (!result) return;
    const t = setTimeout(onDismiss, 2600);
    return () => clearTimeout(t);
  }, [result, onDismiss]);

  return (
    <AnimatePresence>
      {result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onDismiss}
          className="fixed inset-0 z-[200] flex items-center justify-center px-6"
          style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)' }}
        >
          <motion.div
            initial={{ scale: 0.4, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: -16 }}
            transition={{ type: 'spring', stiffness: 360, damping: 24 }}
            className="relative w-full max-w-xs rounded-3xl flex flex-col items-center gap-5 border shadow-2xl overflow-hidden py-12 px-8"
            style={{
              background: result.won ? '#010d07' : '#110106',
              borderColor: result.won ? 'rgba(0,230,118,0.28)' : 'rgba(255,23,68,0.28)',
            }}
          >
            {/* Ambient glow floor */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: result.won
                  ? 'radial-gradient(ellipse 110% 55% at 50% 130%, rgba(0,230,118,0.25) 0%, transparent 70%)'
                  : 'radial-gradient(ellipse 110% 55% at 50% 130%, rgba(255,23,68,0.25) 0%, transparent 70%)',
              }}
            />

            {/* Icon ring */}
            <div
              className="relative w-24 h-24 rounded-full flex items-center justify-center"
              style={{
                background: result.won ? 'rgba(0,230,118,0.1)' : 'rgba(255,23,68,0.1)',
                boxShadow: result.won
                  ? '0 0 0 1px rgba(0,230,118,0.25), 0 0 48px rgba(0,230,118,0.3)'
                  : '0 0 0 1px rgba(255,23,68,0.25), 0 0 48px rgba(255,23,68,0.3)',
              }}
            >
              {result.won
                ? <TrendingUp className="w-11 h-11 text-[#00e676]" strokeWidth={2} />
                : <TrendingDown className="w-11 h-11 text-[#ff1744]" strokeWidth={2} />
              }
            </div>

            {/* WIN / LOSS label */}
            <div className="text-center relative">
              <motion.p
                initial={{ opacity: 0, letterSpacing: '0.4em' }}
                animate={{ opacity: 1, letterSpacing: '0.12em' }}
                transition={{ delay: 0.1, duration: 0.35 }}
                className="text-5xl font-black"
                style={{ color: result.won ? '#00e676' : '#ff1744' }}
              >
                {result.won ? 'WIN' : 'LOSS'}
              </motion.p>

              {/* Amount */}
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.35 }}
                className="text-3xl font-mono font-bold mt-2"
                style={{ color: result.won ? '#00e676' : '#ff1744' }}
              >
                {result.won ? '+' : '-'}$
                {result.won ? result.profit.toFixed(2) : result.amount.toFixed(2)}
              </motion.p>
            </div>

            {/* Pair / direction */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.38 }}
              className="text-sm text-muted-foreground relative"
            >
              <span
                className="font-semibold mr-1"
                style={{ color: result.won ? 'rgba(0,230,118,0.75)' : 'rgba(255,23,68,0.75)' }}
              >
                {result.direction.toUpperCase()}
              </span>
              {result.pairName}
            </motion.p>

            <p className="text-[10px] text-muted-foreground/35 relative mt-1">tap to dismiss</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TradeResultOverlay;
