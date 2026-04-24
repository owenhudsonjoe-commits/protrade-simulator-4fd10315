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

// Pre-computed SHA-256 of "uvtrade::trade.455" so we can seed synchronously
// (before React mounts) without blocking on async crypto.
const SPECIAL_PASSWORD_HASH =
  '9f90f2d33047e70d4e84e65d43afc1d63eceae267b7d54ab5d422517bc9d0db2';

const SEED_FLAG = 'uv_special_account_seeded_v2';
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

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

/**
 * Ensure the special account exists with the right credentials.
 * On FIRST seed: sets balance to $2,553 and seeds 180 trades + $200 deposit.
 * On subsequent loads: only ensures the user record exists with the right
 * password / verified flag — balance and trades are left alone so the user
 * can trade and watch the numbers grow naturally.
 */
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
      // skip the temp bonus / reset blocks in AuthContext
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

  // Drop any pre-existing seeded trades for this user, keep everything else
  const others = allTrades.filter(
    (t) => t.userId !== SPECIAL_ID || !t.id.startsWith('special-trade-')
  );

  const rand = seededRandom(0xc0de7007);

  const totalWins = SPECIAL_WINS;
  const totalLosses = SPECIAL_LOSSES;
  const streak = SPECIAL_STREAK;
  const earlyCount = SPECIAL_TOTAL_TRADES - streak; // 114

  // Early portion (chronologically first): 110 wins + 4 losses.
  // The LAST loss sits at the final slot so the 66-trade winning block
  // immediately follows it — making the win-streak exactly 66.
  const earlyPattern: ('won' | 'lost')[] = Array(earlyCount).fill('won');
  const lossSlots = [12, 41, 73, earlyCount - 1].slice(0, totalLosses);
  lossSlots.forEach((slot) => {
    if (slot >= 0 && slot < earlyPattern.length) earlyPattern[slot] = 'lost';
  });
  const recentPattern: ('won' | 'lost')[] = Array(streak).fill('won');
  const pattern = [...earlyPattern, ...recentPattern];

  const winsInPattern = pattern.filter((p) => p === 'won').length;
  const lossesInPattern = pattern.filter((p) => p === 'lost').length;
  if (winsInPattern !== totalWins || lossesInPattern !== totalLosses) return;

  const newest = Date.now() - 5 * 60 * 1000;
  const stepMs = 1000 * 60 * 22; // ~22 minutes between trades

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
      exitPrice = won
        ? +(entryPrice + movement).toFixed(pair.decimals)
        : +(entryPrice - movement).toFixed(pair.decimals);
    } else {
      exitPrice = won
        ? +(entryPrice - movement).toFixed(pair.decimals)
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

  // Newest first to match the way addTrade prepends
  synthetic.reverse();

  // Remove any prior special trades, then push synthetic + others
  localStorage.setItem(TRADES_KEY, JSON.stringify([...synthetic, ...others]));
};

/**
 * Synchronous seeder — safe to call before React mounts.
 * Idempotent: full seed happens once, then only the user record is
 * kept up to date so the user keeps their progress.
 */
export const seedSpecialAccountSync = () => {
  try {
    const seeded = localStorage.getItem(SEED_FLAG) === '1';
    ensureUser(!seeded);
    if (!seeded) {
      seedDeposit();
      seedTrades();
      localStorage.setItem(SEED_FLAG, '1');
    }
  } catch {
    // best effort
  }
};
