import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User as SupaUser } from '@supabase/supabase-js';

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
  signup: (fullName: string, email: string, password: string, country: string) => Promise<{ needsVerification: boolean }>;
  verifySignupOtp: (email: string, token: string) => Promise<void>;
  resendSignupOtp: (email: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  verifyPasswordResetOtp: (email: string, token: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  updateBalance: (amount: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = ['admin@uvtrade.com'];

const mapUser = (s: SupaUser | null | undefined): User | null => {
  if (!s || !s.email) return null;
  const meta = (s.user_metadata ?? {}) as Record<string, any>;
  const email = s.email.toLowerCase();
  return {
    id: s.id,
    email,
    fullName: meta.full_name || meta.fullName || email.split('@')[0],
    country: meta.country || '',
    balance: typeof meta.balance === 'number' ? meta.balance : 0,
    isAdmin: !!meta.is_admin || ADMIN_EMAILS.includes(email),
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(mapUser(session?.user));
    });
    // THEN load existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(mapUser(session?.user));
      setIsLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    if (!normalizedEmail || !trimmedPassword) throw new Error('Please enter your email and password');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: trimmedPassword,
    });
    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        throw new Error('Please verify your email first. Check your inbox for the code.');
      }
      if (error.message.toLowerCase().includes('invalid login')) {
        throw new Error('Incorrect email or password.');
      }
      throw new Error(error.message);
    }
    setUser(mapUser(data.user));
  };

  const signup = async (fullName: string, email: string, password: string, country: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const trimmedName = fullName.trim();
    if (!normalizedEmail || !trimmedPassword || !trimmedName) throw new Error('Please fill in all fields');
    if (trimmedPassword.length < 6) throw new Error('Password must be at least 6 characters');

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: trimmedPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: trimmedName,
          country,
          balance: 0,
          is_admin: false,
        },
      },
    });
    if (error) {
      if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('user already')) {
        throw new Error('Email already registered. Please log in instead.');
      }
      throw new Error(error.message);
    }
    // If email confirmation is required, no session yet
    const needsVerification = !data.session;
    return { needsVerification };
  };

  const verifySignupOtp = async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type: 'signup',
    });
    if (error) {
      if (error.message.toLowerCase().includes('expired') || error.message.toLowerCase().includes('invalid')) {
        throw new Error('Invalid or expired code. Please try again.');
      }
      throw new Error(error.message);
    }
    setUser(mapUser(data.user));
  };

  const resendSignupOtp = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    if (error) throw new Error(error.message);
  };

  const requestPasswordReset = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) throw new Error('Please enter your email');
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw new Error(error.message);
  };

  const verifyPasswordResetOtp = async (email: string, token: string, newPassword: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (newPassword.trim().length < 6) throw new Error('Password must be at least 6 characters');
    const { error: vErr } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: token.trim(),
      type: 'recovery',
    });
    if (vErr) {
      if (vErr.message.toLowerCase().includes('expired') || vErr.message.toLowerCase().includes('invalid')) {
        throw new Error('Invalid or expired code. Please try again.');
      }
      throw new Error(vErr.message);
    }
    const { data, error: uErr } = await supabase.auth.updateUser({ password: newPassword.trim() });
    if (uErr) throw new Error(uErr.message);
    setUser(mapUser(data.user));
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateBalance = async (amount: number) => {
    if (!user) return;
    const newBalance = user.balance + amount;
    const { data, error } = await supabase.auth.updateUser({
      data: { balance: newBalance },
    });
    if (error) {
      console.error('Failed to update balance:', error);
      return;
    }
    setUser(mapUser(data.user));
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
