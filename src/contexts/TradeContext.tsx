import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Trade {
  id: string;
  userId: string;
  symbol: string;
  direction: 'up' | 'down';
  amount: number;
  entryPrice: number;
  exitPrice?: number;
  duration: number; // seconds
  expiryTime: number; // timestamp
  status: 'active' | 'won' | 'lost';
  profit?: number;
  timestamp: string;
}

interface TradeContextType {
  trades: Trade[];
  activeTrades: Trade[];
  addTrade: (trade: Trade) => void;
  completeTrade: (tradeId: string, exitPrice: number) => void;
  profitPercent: number;
  setProfitPercent: (p: number) => void;
}

const TradeContext = createContext<TradeContextType | undefined>(undefined);
const TRADES_KEY = 'demo_trades';
const PROFIT_KEY = 'demo_profit_percent';

export const TradeProvider = ({ children }: { children: ReactNode }) => {
  const [trades, setTrades] = useState<Trade[]>(() => {
    return JSON.parse(localStorage.getItem(TRADES_KEY) || '[]');
  });
  const [profitPercent, setProfitPercent] = useState(() => {
    return Number(localStorage.getItem(PROFIT_KEY) || '85');
  });

  useEffect(() => {
    localStorage.setItem(TRADES_KEY, JSON.stringify(trades));
  }, [trades]);

  useEffect(() => {
    localStorage.setItem(PROFIT_KEY, String(profitPercent));
  }, [profitPercent]);

  const activeTrades = trades.filter((t) => t.status === 'active');

  const addTrade = (trade: Trade) => {
    setTrades((prev) => [trade, ...prev]);
  };

  const completeTrade = (tradeId: string, exitPrice: number) => {
    setTrades((prev) =>
      prev.map((t) => {
        if (t.id !== tradeId) return t;
        const won =
          t.direction === 'up' ? exitPrice > t.entryPrice : exitPrice < t.entryPrice;
        const profit = won ? t.amount * (profitPercent / 100) : -t.amount;
        return {
          ...t,
          exitPrice,
          status: won ? 'won' as const : 'lost' as const,
          profit,
        };
      })
    );
  };

  return (
    <TradeContext.Provider
      value={{ trades, activeTrades, addTrade, completeTrade, profitPercent, setProfitPercent }}
    >
      {children}
    </TradeContext.Provider>
  );
};

export const useTrades = () => {
  const context = useContext(TradeContext);
  if (!context) throw new Error('useTrades must be used within TradeProvider');
  return context;
};
