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
    const users = getUsers();
    const found = users[email];
    if (!found || found.password !== password) {
      throw new Error('Invalid email or password');
    }
    const { password: _, ...userData } = found;
    setUser(userData);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
  };

  const signup = async (fullName: string, email: string, password: string, country: string) => {
    const users = getUsers();
    if (users[email]) {
      throw new Error('Email already registered');
    }
    const newUser = {
      id: `user-${Date.now()}`,
      email,
      fullName,
      country,
      balance: 0, // Real accounts start with $0, deposit required
      isAdmin: false,
      password,
    };
    users[email] = newUser;
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