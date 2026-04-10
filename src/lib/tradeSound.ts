// Trade sound effects using Web Audio API
const audioCtx = () => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return ctx;
};

export const playWinSound = () => {
  try {
    const ctx = audioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    
    // Rising happy chord
    osc.frequency.setValueAtTime(523, ctx.currentTime); // C5
    osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1); // E5
    osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2); // G5
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
    
    // Second harmonic
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.15);
    osc2.frequency.setValueAtTime(1047, ctx.currentTime + 0.15); // C6
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.6);
  } catch {}
};

export const playLossSound = () => {
  try {
    const ctx = audioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    
    // Descending sad tone
    osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
    osc.frequency.setValueAtTime(370, ctx.currentTime + 0.15); // F#4
    osc.frequency.setValueAtTime(330, ctx.currentTime + 0.3); // E4
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {}
};

export const playTradeOpenSound = () => {
  try {
    const ctx = audioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch {}
};

export const triggerHaptic = (pattern: 'win' | 'loss' | 'open') => {
  try {
    if ('vibrate' in navigator) {
      switch (pattern) {
        case 'win':
          navigator.vibrate([50, 30, 50, 30, 100]);
          break;
        case 'loss':
          navigator.vibrate([200]);
          break;
        case 'open':
          navigator.vibrate([30]);
          break;
      }
    }
  } catch {}
};