# FXonix - Binary Options Trading Platform

## Overview
A mobile-first binary options trading web app built with React, TypeScript, Vite, and Tailwind CSS. Features real-time cryptocurrency/forex charting, trade management, wallet system, and an admin panel.

## Architecture
- **Frontend only** — No backend server. All state is managed via `localStorage`.
- **Framework:** React 18 + TypeScript
- **Build tool:** Vite (port 5000)
- **Styling:** Tailwind CSS + Shadcn UI (Radix UI)
- **Routing:** React Router DOM v6
- **Charts:** lightweight-charts (TradingView), Recharts
- **Animations:** Framer Motion

## Key Directories
- `src/pages/` — Page-level components (Trade, Wallet, Admin, Login, Signup, etc.)
- `src/components/` — Reusable UI components (charts, nav, trade panel, etc.)
- `src/contexts/` — Global state: `AuthContext` (users/auth) and `TradeContext` (trades/history)
- `src/hooks/` — Custom hooks (e.g., WebSocket price feeds from Binance/Forex APIs)
- `src/lib/` — Utility functions

## Data Storage
All data is stored in `localStorage` — no backend, no third-party auth, no API keys required:
- `uv_trade_users` — User accounts with SHA-256 hashed passwords
- `uv_trade_current_user` — Current logged-in user id
- `uv_trade_otps` — Pending signup / password-reset codes (10-min expiry)
- `uv_trades` — Trade history
- `uv_profit_percent` — Admin-configurable profit percentage

## Auth (Demo / localStorage)
Sign-up and password-reset use a 6-digit OTP that's displayed on screen via a toast (since there's no email server). The default admin account is auto-seeded on first load.

## Default Admin Account
- Email: `admin@fxonix.com`
- Password: `admin123`

## Running the App
```bash
npm run dev
```
Runs on port 5000.

## Build
```bash
npm run build
```
Outputs to `dist/`.

## Migration Notes (Lovable → Replit)
- Removed `lovable-tagger` from vite.config.ts (dev-only Lovable plugin)
- Fixed CSS `@import` ordering (moved Google Fonts import before Tailwind directives)
- Updated Vite server to host `0.0.0.0` on port 5000 with `allowedHosts: true` for Replit proxy compatibility
- Removed unused `server/db.ts` (auto-generated, referenced non-existent `@shared/schema`)
- Replaced Supabase Auth with a localStorage-only auth implementation in `AuthContext.tsx` (same public API: `login`, `signup`, `verifySignupOtp`, `resendSignupOtp`, `requestPasswordReset`, `verifyPasswordResetOtp`, `logout`, `updateBalance`). Removed `@supabase/supabase-js`, `src/integrations/supabase/`, and the `supabase/` config folder. No third-party keys required.
