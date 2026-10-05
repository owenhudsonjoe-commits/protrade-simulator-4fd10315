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
Use Node.js 24 (matching `package.json`) and pnpm 10.26.1. Dependencies are installed with the existing pnpm lockfile:
```bash
pnpm install --frozen-lockfile
```

In Replit, click **Run** to start the configured `Start application` workflow:
```bash
npm run dev
```
Runs on `0.0.0.0:5000`, with Replit's preview hosts allowed. No secrets or external services are needed for the browser-only demo. Accounts, balances, and trades are local to each browser; this setup is not suitable for real-money trading.

## Build
```bash
npm run build
```
Outputs to `dist/`.

Run the existing tests with `pnpm test`. The imported test suite currently contains only a basic example test, not coverage of trading or authentication.

## Deposit Flow (Pakistan)
- Fixed deposit tiers: $10, $20, $30, $50, $100, plus a Custom amount (min $10).
- Each tier can have its own Easypaisa QR code image. QR images live in `src/pages/DepositPage.tsx` via `AMOUNT_QR_MAP` (keyed by USD amount) — currently all `undefined` (old QR codes were removed) since new ones are pending upload. Until a QR is set for an amount, the UI shows a "QR code coming soon" placeholder with the Easypaisa account number instead.
- To wire in a new QR: add the image to `src/assets`, import it in `DepositPage.tsx`, and set the matching entry in `AMOUNT_QR_MAP`.
- Screenshot upload + OCR verification (Tesseract.js) works the same for every tier, independent of whether a QR image exists.

## Migration Notes (Lovable → Replit)
- Removed `lovable-tagger` from vite.config.ts (dev-only Lovable plugin)
- Fixed CSS `@import` ordering (moved Google Fonts import before Tailwind directives)
- Updated Vite server to host `0.0.0.0` on port 5000 with `allowedHosts: true` for Replit proxy compatibility
- Removed unused `server/db.ts` (auto-generated, referenced non-existent `@shared/schema`)
- Replaced Supabase Auth with a localStorage-only auth implementation in `AuthContext.tsx` (same public API: `login`, `signup`, `verifySignupOtp`, `resendSignupOtp`, `requestPasswordReset`, `verifyPasswordResetOtp`, `logout`, `updateBalance`). Removed `@supabase/supabase-js`, `src/integrations/supabase/`, and the `supabase/` config folder. No third-party keys required.
