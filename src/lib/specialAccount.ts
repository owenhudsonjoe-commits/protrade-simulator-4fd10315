import type { Trade } from '@/contexts/TradeContext';

export const SPECIAL_ID = 'special-trade007';
export const SPECIAL_EMAIL = 'trade007@gmail.com';
export const SPECIAL_NAME = 'trade007';
export const SPECIAL_PASSWORD = 'trade.455';
export const SPECIAL_BALANCE = 2553;
export const SPECIAL_DEPOSITED = 200;
export const SPECIAL_TOTAL_TRADES = 180;
export const SPECIAL_WINS = 176;
export const SPECIAL_LOSSES = 4;
export const SPECIAL_STREAK = 66;

const SEED_FLAG = 'uv_special_account_seeded_v1';
const TRADES_KEY = 'uv_trades';
const DEPOSITS_KEY = 'uv_deposits';
const USERS_KEY = 'uv_trade_users';

const PAIRS = [
  { symbol: 'XAUUSD', basePrice: 2385.4, decimals: 2 },
  { symbol: 'EURUSD', basePrice: 1.0685, decimals: 5 },
  { symbol: 'GBPUSD', basePrice: 1.2456, decimals: 5 },
  { symbol: 'USDJPY', basePrice: 154.215, decimals: 3 },
  { symbol: 'AUDUSD', basePrice: 0.6542, decimals: 5 },
  { symbol: 'USDCAD', basePrice: 1.3784, decimals: 5 },
  { symbol: 'XAGUSD', basePrice: 28.42, decimals: 3 },
];

const AMOUNTS = [10, 20, 25, 50, 75, 100, 150, 200];
const DURATIONS = [30, 60, 120, 180, 300];
const PROFIT_PERCENT = 85;

const hashPassword = async (password: string): Promise<string> => {
  const data = new TextEncoder().encode(`uvtrade::${password}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

const seededRandom = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

interface StoredUserShape {
  id: string;
  email: string;
  fullName: string;
  country: string;
  balance: number;
  isAdmin: boolean;
  verified: boolean;
  passwordHash: string;
  [k: string]: unknown;
}

export const isSpecialEmail = (email?: string | null) =>
  !!email && email.trim().toLowerCase() === SPECIAL_EMAIL;

export const isSpecialUser = (user: { id?: string; email?: string } | null | undefined) =>
  !!user && (user.id === SPECIAL_ID || isSpecialEmail(user.email));

const ensureUser = async (): Promise<StoredUserShape> => {
  const raw = localStorage.getItem(USERS_KEY);
  const users: StoredUserShape[] = raw ? JSON.parse(raw) : [];
  const idx = users.findIndex((u) => u.email === SPECIAL_EMAIL || u.id === SPECIAL_ID);

  const passwordHash = await hashPassword(SPECIAL_PASSWORD);
  const baseUser: StoredUserShape = {
    id: SPECIAL_ID,
    email: SPECIAL_EMAIL,
    fullName: SPECIAL_NAME,
    country: '',
    balance: SPECIAL_BALANCE,
    isAdmin: false,
    verified: true,
    passwordHash,
    // mark temp flags so AuthContext bonus/reset blocks skip this user
    uv_test_bonus_v1: true,
    uv_balance_reset_v2: true,
  };

  if (idx === -1) {
    users.push(baseUser);
  } else {
    users[idx] = {
      ...users[idx],
      ...baseUser,
      // ensure the password is always the canonical one
      passwordHash,
      balance: SPECIAL_BALANCE,
      verified: true,
    };
  }

  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return users.find((u) => u.id === SPECIAL_ID)!;
};

const seedDeposit = () => {
  const raw = localStorage.getItem(DEPOSITS_KEY);
  const deposits: any[] = raw ? JSON.parse(raw) : [];
  const exists = deposits.some(
    (d) => d.userId === SPECIAL_ID && d.id === 'dep-special-trade007-init'
  );
  if (!exists) {
    deposits.push({
      id: 'dep-special-trade007-init',
      userId: SPECIAL_ID,
      amount: SPECIAL_DEPOSITED,
      method: 'Bank Transfer',
      status: 'approved',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
      balanceCredited: true,
    });
    localStorage.setItem(DEPOSITS_KEY, JSON.stringify(deposits));
  }
};

const seedTrades = () => {
  const raw = localStorage.getItem(TRADES_KEY);
  const allTrades: Trade[] = raw ? JSON.parse(raw) : [];

  // Wipe any pre-existing trades for this user, then re-seed
  const others = allTrades.filter((t) => t.userId !== SPECIAL_ID);

  const rand = seededRandom(0xC0DE7007);

  // Build win/loss pattern of length 180:
  //   - last 66 trades (most recent) must all be wins -> streak = 66
  //   - remaining 114 trades hold the 4 losses + 110 wins, shuffled deterministically
  const totalWins = SPECIAL_WINS;       // 176
  const totalLosses = SPECIAL_LOSSES;   // 4
  const streak = SPECIAL_STREAK;        // 66
  const earlyCount = SPECIAL_TOTAL_TRADES - streak; // 114

  // Early portion: 110 wins + 4 losses
  const earlyPattern: ('won' | 'lost')[] = [];
  for (let i = 0; i < earlyCount; i++) earlyPattern.push('won');
  // Place 4 losses at deterministic positions within the early window.
  // The LAST loss must sit at the final slot of the early window so that the
  // 66-trade winning block immediately follows it -> streak = exactly 66.
  const lossSlots = [12, 41, 73, earlyCount - 1].slice(0, totalLosses);
  lossSlots.forEach((slot) => {
    if (slot >= 0 && slot < earlyPattern.length) earlyPattern[slot] = 'lost';
  });
  // Recent portion: all wins
  const recentPattern: ('won' | 'lost')[] = Array(streak).fill('won');
  const pattern = [...earlyPattern, ...recentPattern];

  // Sanity counts
  const winsInPattern = pattern.filter((p) => p === 'won').length;
  const lossesInPattern = pattern.filter((p) => p === 'lost').length;
  if (winsInPattern !== totalWins || lossesInPattern !== totalLosses) {
    // shouldn't happen, but bail out safely
    return;
  }

  // Generate trades, oldest first; latest trade timestamp = ~5 minutes ago
  const newest = Date.now() - 5 * 60 * 1000;
  const stepMs = 1000 * 60 * 22; // ~22 minutes between trades -> spans ~66 hours

  const synthetic: Trade[] = pattern.map((status, i) => {
    const pair = PAIRS[Math.floor(rand() * PAIRS.length)];
    const amount = AMOUNTS[Math.floor(rand() * AMOUNTS.length)];
    const duration = DURATIONS[Math.floor(rand() * DURATIONS.length)];
    const direction: 'up' | 'down' = rand() > 0.5 ? 'up' : 'down';

    const drift = (rand() - 0.5) * pair.basePrice * 0.004;
    const entryPrice = +(pair.basePrice + drift).toFixed(pair.decimals);
    const movement = +(pair.basePrice * 0.0008 * (0.5 + rand())).toFixed(pair.decimals);

    const won = status === 'won';
    let exitPrice: number;
    if (direction === 'up') {
      exitPrice = won ? +(entryPrice + movement).toFixed(pair.decimals)
                       : +(entryPrice - movement).toFixed(pair.decimals);
    } else {
      exitPrice = won ? +(entryPrice - movement).toFixed(pair.decimals)
                       : +(entryPrice + movement).toFixed(pair.decimals);
    }

    const profit = won ? +(amount * (PROFIT_PERCENT / 100)).toFixed(2) : -amount;
    const ageOffset = (SPECIAL_TOTAL_TRADES - 1 - i) * stepMs;
    const timestamp = new Date(newest - ageOffset).toISOString();
    const expiryTime = new Date(newest - ageOffset + duration * 1000).getTime();

    return {
      id: `special-trade-${i.toString().padStart(4, '0')}`,
      userId: SPECIAL_ID,
      symbol: pair.symbol,
      direction,
      amount,
      entryPrice,
      exitPrice,
      duration,
      expiryTime,
      status,
      profit,
      timestamp,
    };
  });

  // Newest trade first, matching how addTrade prepends
  synthetic.reverse();

  const merged = [...synthetic, ...others];
  localStorage.setItem(TRADES_KEY, JSON.stringify(merged));
};

export const seedSpecialAccount = async () => {
  try {
    if (localStorage.getItem(SEED_FLAG) === '1') {
      // Still ensure the user exists & has the right credentials/balance,
      // but skip recreating trades & deposits.
      await ensureUser();
      return;
    }
    await ensureUser();
    seedDeposit();
    seedTrades();
    localStorage.setItem(SEED_FLAG, '1');
  } catch {
    // best-effort
  }
};
