import type { Trade } from '@/contexts/TradeContext';

// ─── Special Account #1 (trade007) ───────────────────────────────────────────
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

const SPECIAL_PASSWORD_HASH =
  '9f90f2d33047e70d4e84e65d43afc1d63eceae267b7d54ab5d422517bc9d0db2';

// ─── Special Account #2 (Umair) ──────────────────────────────────────────────
export const UMAIR_ID       = 'special-umair-account';
export const UMAIR_EMAIL    = 'umairrahmani231@gmail.com';
export const UMAIR_NAME     = 'Umair Rahmani';
export const UMAIR_BALANCE  = 50;
export const UMAIR_DEPOSITED = 50;

// SHA-256 of "uvtrade::Umair1080"
const UMAIR_PASSWORD_HASH =
  '728b10347ff48a27cc529d294e84f4e326dcebd418511c8392b4f47c1501a61e';

// ─── Shared helpers ───────────────────────────────────────────────────────────
const SEED_FLAG   = 'uv_special_account_seeded_v2';
const UMAIR_FLAG  = 'uv_umair_account_seeded_v1';
const TRADES_KEY  = 'uv_trades';
const DEPOSITS_KEY = 'uv_deposits';
const USERS_KEY   = 'uv_trade_users';

const PAIRS = [
  { symbol: 'XAUUSD', basePrice: 2385.4,  decimals: 2 },
  { symbol: 'EURUSD', basePrice: 1.0685,  decimals: 5 },
  { symbol: 'GBPUSD', basePrice: 1.2456,  decimals: 5 },
  { symbol: 'USDJPY', basePrice: 154.215, decimals: 3 },
  { symbol: 'AUDUSD', basePrice: 0.6542,  decimals: 5 },
  { symbol: 'USDCAD', basePrice: 1.3784,  decimals: 5 },
  { symbol: 'XAGUSD', basePrice: 28.42,   decimals: 3 },
];

const AMOUNTS    = [10, 20, 25, 50, 75, 100, 150, 200];
const DURATIONS  = [30, 60, 120, 180, 300];
const PROFIT_PERCENT = 85;

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

export const isUmairEmail = (email?: string | null) =>
  !!email && email.trim().toLowerCase() === UMAIR_EMAIL;

export const isUmairUser = (user: { id?: string; email?: string } | null | undefined) =>
  !!user && (user.id === UMAIR_ID || isUmairEmail(user.email));

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

// ─── Special Account #1 helpers ──────────────────────────────────────────────
const ensureUser = (forceInitialBalance: boolean) => {
  const users = readJson<StoredUserShape[]>(USERS_KEY, []);
  const idx = users.findIndex(
    (u) => u.email === SPECIAL_EMAIL || u.id === SPECIAL_ID
  );

  if (idx === -1) {
    users.push({
      id: SPECIAL_ID,
      email: SPECIAL_EMAIL,
      fullName: SPECIAL_NAME,
      country: '',
      balance: SPECIAL_BALANCE,
      isAdmin: false,
      verified: true,
      passwordHash: SPECIAL_PASSWORD_HASH,
      uv_test_bonus_v1: true,
      uv_balance_reset_v2: true,
    });
  } else {
    users[idx] = {
      ...users[idx],
      id: SPECIAL_ID,
      email: SPECIAL_EMAIL,
      fullName: users[idx].fullName || SPECIAL_NAME,
      passwordHash: SPECIAL_PASSWORD_HASH,
      verified: true,
      isAdmin: false,
      uv_test_bonus_v1: true,
      uv_balance_reset_v2: true,
      balance: forceInitialBalance ? SPECIAL_BALANCE : users[idx].balance,
    };
  }

  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const seedDeposit = () => {
  const deposits = readJson<any[]>(DEPOSITS_KEY, []);
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
  const allTrades = readJson<Trade[]>(TRADES_KEY, []);
  const others = allTrades.filter(
    (t) => t.userId !== SPECIAL_ID || !t.id.startsWith('special-trade-')
  );

  const rand = seededRandom(0xc0de7007);

  const totalWins   = SPECIAL_WINS;
  const totalLosses = SPECIAL_LOSSES;
  const streak      = SPECIAL_STREAK;
  const earlyCount  = SPECIAL_TOTAL_TRADES - streak;

  const earlyPattern: ('won' | 'lost')[] = Array(earlyCount).fill('won');
  const lossSlots = [12, 41, 73, earlyCount - 1].slice(0, totalLosses);
  lossSlots.forEach((slot) => {
    if (slot >= 0 && slot < earlyPattern.length) earlyPattern[slot] = 'lost';
  });
  const recentPattern: ('won' | 'lost')[] = Array(streak).fill('won');
  const pattern = [...earlyPattern, ...recentPattern];

  const winsInPattern   = pattern.filter((p) => p === 'won').length;
  const lossesInPattern = pattern.filter((p) => p === 'lost').length;
  if (winsInPattern !== totalWins || lossesInPattern !== totalLosses) return;

  const newest = Date.now() - 5 * 60 * 1000;
  const stepMs = 1000 * 60 * 22;

  const synthetic: Trade[] = pattern.map((status, i) => {
    const pair      = PAIRS[Math.floor(rand() * PAIRS.length)];
    const amount    = AMOUNTS[Math.floor(rand() * AMOUNTS.length)];
    const duration  = DURATIONS[Math.floor(rand() * DURATIONS.length)];
    const direction: 'up' | 'down' = rand() > 0.5 ? 'up' : 'down';

    const drift      = (rand() - 0.5) * pair.basePrice * 0.004;
    const entryPrice = +(pair.basePrice + drift).toFixed(pair.decimals);
    const movement   = +(pair.basePrice * 0.0008 * (0.5 + rand())).toFixed(pair.decimals);

    const won = status === 'won';
    let exitPrice: number;
    if (direction === 'up') {
      exitPrice = won ? +(entryPrice + movement).toFixed(pair.decimals) : +(entryPrice - movement).toFixed(pair.decimals);
    } else {
      exitPrice = won ? +(entryPrice - movement).toFixed(pair.decimals) : +(entryPrice + movement).toFixed(pair.decimals);
    }

    const profit     = won ? +(amount * (PROFIT_PERCENT / 100)).toFixed(2) : -amount;
    const ageOffset  = (SPECIAL_TOTAL_TRADES - 1 - i) * stepMs;
    const timestamp  = new Date(newest - ageOffset).toISOString();
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

  synthetic.reverse();
  localStorage.setItem(TRADES_KEY, JSON.stringify([...synthetic, ...others]));
};

// ─── Special Account #2 (Umair) helpers ──────────────────────────────────────
const ensureUmairUser = () => {
  const users = readJson<StoredUserShape[]>(USERS_KEY, []);
  const idx = users.findIndex(
    (u) => u.email.toLowerCase() === UMAIR_EMAIL || u.id === UMAIR_ID
  );

  if (idx === -1) {
    users.push({
      id: UMAIR_ID,
      email: UMAIR_EMAIL,
      fullName: UMAIR_NAME,
      country: '',
      balance: UMAIR_BALANCE,
      isAdmin: false,
      verified: true,
      passwordHash: UMAIR_PASSWORD_HASH,
      uv_test_bonus_v1: true,
      uv_balance_reset_v2: true,
    });
  } else {
    users[idx] = {
      ...users[idx],
      id: UMAIR_ID,
      email: UMAIR_EMAIL,
      fullName: UMAIR_NAME,
      balance: UMAIR_BALANCE,
      passwordHash: UMAIR_PASSWORD_HASH,
      verified: true,
      isAdmin: false,
      uv_test_bonus_v1: true,
      uv_balance_reset_v2: true,
    };
  }

  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const seedUmairDeposit = () => {
  const deposits = readJson<any[]>(DEPOSITS_KEY, []);
  // Remove any old deposit for this account and re-seed with exactly $50
  const others = deposits.filter(
    (d) => !(d.userId === UMAIR_ID)
  );
  others.push({
    id: 'dep-umair-init',
    userId: UMAIR_ID,
    amount: UMAIR_DEPOSITED,
    method: 'Bank Transfer',
    status: 'approved',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    balanceCredited: true,
  });
  localStorage.setItem(DEPOSITS_KEY, JSON.stringify(others));
};

// ─── Main export ─────────────────────────────────────────────────────────────
/**
 * Synchronous seeder — safe to call before React mounts.
 * Idempotent: full seed happens once per account.
 */
export const seedSpecialAccountSync = () => {
  try {
    // Account #1
    const seeded = localStorage.getItem(SEED_FLAG) === '1';
    ensureUser(!seeded);
    if (!seeded) {
      seedDeposit();
      seedTrades();
      localStorage.setItem(SEED_FLAG, '1');
    }

    // Account #2 — always re-enforce $50 balance & deposit so it never drifts
    ensureUmairUser();
    seedUmairDeposit();
    localStorage.setItem(UMAIR_FLAG, '1');
  } catch {
    // best effort
  }
};
