import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  fullName: string;
  country: string;
  balance: number;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (fullName: string, email: string, password: string, country: string) => Promise<void>;
  logout: () => void;
  updateBalance: (amount: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_KEY = 'uv_trade_users';
const CURRENT_USER_KEY = 'uv_trade_current_user';

const getUsers = (): Record<string, User & { password: string }> => {
  const data = localStorage.getItem(USERS_KEY);
  if (!data) {
    const defaultUsers: Record<string, User & { password: string }> = {
      'admin@uvtrade.com': {
        id: 'admin-001',
        email: 'admin@uvtrade.com',
        fullName: 'Admin',
        country: 'Pakistan',
        balance: 100000,
        isAdmin: true,
        password: 'admin123',
      }
    };
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    return defaultUsers;
  }
  return JSON.parse(data);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(CURRENT_USER_KEY);
    if (saved) {
      setUser(JSON.parse(saved));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    if (!normalizedEmail || !trimmedPassword) {
      throw new Error('Please enter your email and password');
    }
    const users = getUsers();
    const found = users[normalizedEmail];
    if (!found) {
      throw new Error('No account found with this email. Please sign up first.');
    }
    if (found.password !== trimmedPassword) {
      throw new Error('Incorrect password. Please try again.');
    }
    const { password: _, ...userData } = found;
    setUser(userData);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
  };

  const signup = async (fullName: string, email: string, password: string, country: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    if (!normalizedEmail || !trimmedPassword || !fullName.trim()) {
      throw new Error('Please fill in all fields');
    }
    if (trimmedPassword.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    const users = getUsers();
    if (users[normalizedEmail]) {
      throw new Error('Email already registered. Please log in instead.');
    }
    const newUser = {
      id: `user-${Date.now()}`,
      email: normalizedEmail,
      fullName: fullName.trim(),
      country,
      balance: 0,
      isAdmin: false,
      password: trimmedPassword,
    };
    users[normalizedEmail] = newUser;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    const { password: _, ...userData } = newUser;
    setUser(userData);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  const updateBalance = (amount: number) => {
    if (!user) return;
    const updated = { ...user, balance: user.balance + amount };
    setUser(updated);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
    const users = getUsers();
    if (users[user.email]) {
      users[user.email] = { ...users[user.email], balance: updated.balance };
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, updateBalance }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};