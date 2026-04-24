import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { seedSpecialAccountSync } from '@/lib/specialAccount';

interface User {
  id: string;
  email: string;
  fullName: string;
  country: string;
  balance: number;
  isAdmin: boolean;
}

interface StoredUser extends User {
  passwordHash: string;
  verified: boolean;
}

type OtpType = 'signup' | 'recovery';
interface PendingOtp {
  email: string;
  type: OtpType;
  code: string;
  expiresAt: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (fullName: string, email: string, password: string, country: string) => Promise<{ needsVerification: boolean }>;
  verifySignupOtp: (email: string, token: string) => Promise<void>;
  resendSignupOtp: (email: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  verifyPasswordResetOtp: (email: string, token: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  updateBalance: (amount: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = ['admin@fxonix.com'];
const USERS_KEY = 'uv_trade_users';
const CURRENT_USER_KEY = 'uv_trade_current_user';
const OTP_KEY = 'uv_trade_otps';
const OTP_TTL_MS = 10 * 60 * 1000;

const hashPassword = async (password: string): Promise<string> => {
  const data = new TextEncoder().encode(`uvtrade::${password}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

const loadUsers = (): StoredUser[] => {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
};

const saveUsers = (users: StoredUser[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const seedAdmin = async () => {
  const users = loadUsers();
  if (users.some((u) => u.email === 'admin@fxonix.com')) return;
  users.push({
    id: 'admin-' + Date.now(),
    email: 'admin@fxonix.com',
    fullName: 'Admin',
    country: '',
    balance: 0,
    isAdmin: true,
    verified: true,
    passwordHash: await hashPassword('admin123'),
  });
  saveUsers(users);
};

const loadOtps = (): PendingOtp[] => {
  try {
    const raw = localStorage.getItem(OTP_KEY);
    const list = raw ? (JSON.parse(raw) as PendingOtp[]) : [];
    const now = Date.now();
    return list.filter((o) => o.expiresAt > now);
  } catch {
    return [];
  }
};

const saveOtps = (otps: PendingOtp[]) => {
  localStorage.setItem(OTP_KEY, JSON.stringify(otps));
};

const issueOtp = (email: string, type: OtpType): string => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const otps = loadOtps().filter((o) => !(o.email === email && o.type === type));
  otps.push({ email, type, code, expiresAt: Date.now() + OTP_TTL_MS });
  saveOtps(otps);
  toast.message(`Verification code: ${code}`, {
    duration: 15000,
  });
  return code;
};

const consumeOtp = (email: string, type: OtpType, code: string): boolean => {
  const otps = loadOtps();
  const idx = otps.findIndex((o) => o.email === email && o.type === type && o.code === code.trim());
  if (idx === -1) return false;
  otps.splice(idx, 1);
  saveOtps(otps);
  return true;
};

const toPublicUser = (s: StoredUser): User => ({
  id: s.id,
  email: s.email,
  fullName: s.fullName,
  country: s.country,
  balance: s.balance,
  isAdmin: s.isAdmin || ADMIN_EMAILS.includes(s.email),
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await seedAdmin();
      // TEMP TEST BONUS — adds $1000 once per user for trade testing. Remove this block to revert.
      try {
        const BONUS_FLAG = 'uv_test_bonus_v1';
        const users = loadUsers();
        let changed = false;
        for (const u of users) {
          if (!(u as any)[BONUS_FLAG]) {
            u.balance = (u.balance || 0) + 1000;
            (u as any)[BONUS_FLAG] = true;
            changed = true;
          }
        }
        if (changed) saveUsers(users);
      } catch {
        // ignore
      }
      // END TEMP TEST BONUS

      // TEMP BALANCE RESET — wipes balance back to 0 once per user. Remove block to revert.
      try {
        const RESET_FLAG = 'uv_balance_reset_v2';
        const users = loadUsers();
        let changed = false;
        for (const u of users) {
          if (!(u as any)[RESET_FLAG]) {
            u.balance = 0;
            (u as any)[RESET_FLAG] = true;
            changed = true;
          }
        }
        if (changed) saveUsers(users);
      } catch {
        // ignore
      }
      // END TEMP BALANCE RESET

      // Re-assert the special preview account (idempotent — keeps user
      // record fresh even if another effect modified localStorage)
      seedSpecialAccountSync();

      try {
        const id = localStorage.getItem(CURRENT_USER_KEY);
        if (id) {
          const found = loadUsers().find((u) => u.id === id);
          if (found && found.verified) setUser(toPublicUser(found));
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const persistCurrent = (u: StoredUser | null) => {
    if (u) {
      localStorage.setItem(CURRENT_USER_KEY, u.id);
      setUser(toPublicUser(u));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    if (!normalizedEmail || !trimmedPassword) throw new Error('Please enter your email and password');
    const users = loadUsers();
    const found = users.find((u) => u.email === normalizedEmail);
    if (!found) throw new Error('Incorrect email or password.');
    const hash = await hashPassword(trimmedPassword);
    if (found.passwordHash !== hash) throw new Error('Incorrect email or password.');
    if (!found.verified) throw new Error('Please verify your email first. Check your inbox for the code.');
    persistCurrent(found);
  };

  const signup = async (fullName: string, email: string, password: string, country: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const trimmedName = fullName.trim();
    if (!normalizedEmail || !trimmedPassword || !trimmedName) throw new Error('Please fill in all fields');
    if (trimmedPassword.length < 6) throw new Error('Password must be at least 6 characters');

    const users = loadUsers();
    if (users.some((u) => u.email === normalizedEmail)) {
      throw new Error('Email already registered. Please log in instead.');
    }

    const newUser: StoredUser = {
      id: crypto.randomUUID ? crypto.randomUUID() : `u-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      email: normalizedEmail,
      fullName: trimmedName,
      country,
      balance: 0,
      isAdmin: ADMIN_EMAILS.includes(normalizedEmail),
      verified: false,
      passwordHash: await hashPassword(trimmedPassword),
    };
    users.push(newUser);
    saveUsers(users);
    issueOtp(normalizedEmail, 'signup');
    return { needsVerification: true };
  };

  const verifySignupOtp = async (email: string, token: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!consumeOtp(normalizedEmail, 'signup', token)) {
      throw new Error('Invalid or expired code. Please try again.');
    }
    const users = loadUsers();
    const idx = users.findIndex((u) => u.email === normalizedEmail);
    if (idx === -1) throw new Error('Account not found. Please sign up again.');
    users[idx].verified = true;
    saveUsers(users);
    persistCurrent(users[idx]);
  };

  const resendSignupOtp = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const users = loadUsers();
    if (!users.some((u) => u.email === normalizedEmail)) {
      throw new Error('No pending signup found for this email.');
    }
    issueOtp(normalizedEmail, 'signup');
  };

  const requestPasswordReset = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) throw new Error('Please enter your email');
    const users = loadUsers();
    if (!users.some((u) => u.email === normalizedEmail)) {
      throw new Error('No account found for this email.');
    }
    issueOtp(normalizedEmail, 'recovery');
  };

  const verifyPasswordResetOtp = async (email: string, token: string, newPassword: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (newPassword.trim().length < 6) throw new Error('Password must be at least 6 characters');
    if (!consumeOtp(normalizedEmail, 'recovery', token)) {
      throw new Error('Invalid or expired code. Please try again.');
    }
    const users = loadUsers();
    const idx = users.findIndex((u) => u.email === normalizedEmail);
    if (idx === -1) throw new Error('Account not found.');
    users[idx].passwordHash = await hashPassword(newPassword.trim());
    users[idx].verified = true;
    saveUsers(users);
    persistCurrent(users[idx]);
  };

  const logout = async () => {
    persistCurrent(null);
  };

  const updateBalance = async (amount: number) => {
    if (!user) return;
    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx === -1) return;
    users[idx].balance = (users[idx].balance || 0) + amount;
    saveUsers(users);
    persistCurrent(users[idx]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        verifySignupOtp,
        resendSignupOtp,
        requestPasswordReset,
        verifyPasswordResetOtp,
        logout,
        updateBalance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
