# CCCGuru Telegram Mini App — Setup & Deployment Guide

This guide provides complete instructions to set up, test, configure, and deploy the **CCCGuru Telegram Mini App** for production.

---

## 1. Project Overview

The CCCGuru Telegram Mini App connects students directly to the canonical NIELIT CCC exam preparation platform on Telegram. It shares the same Supabase database, question bank, chapter structure, and mock test series as the official website (`https://www.cccguru.in`) while offering a high-performance, mobile-first WebApp experience inside Telegram.

### Key Highlights:
- **Server-Side Security**: Verified Telegram `initData` HMAC-SHA256 signature verification with constant-time comparison.
- **Cheating Prevention**: Questions delivered during active tests are sanitized (answer keys and explanations stripped). Scoring and duration are strictly calculated on the server.
- **Canonical Supabase Database**: Uses existing tables (`test_categories`, `test_series`, `test_series_items`, `chapters`, `questions`).
- **Bilingual Interface**: Full support for English and Hindi question text, options, and explanations.
- **Native Telegram Integration**: Haptics, header BackButton, expand viewport, and theme parameter synchronization.
- **Graceful Browser Preview Mode**: Automatic sandbox for local browser development and testing without requiring Telegram Webview.

---

## 2. Directory Structure

```text
E:\App Dev 2026\CCC Prep\mini-app\
├── docs/
│   ├── telegram-mini-app-architecture.md  # Architectural audit & data flow
│   └── telegram-mini-app-setup.md         # Setup and deployment manual
├── src/
│   ├── app/                               # Next.js App Router
│   │   ├── api/
│   │   │   ├── telegram/auth/             # Server verification of initData
│   │   │   ├── telegram/session/          # Session status
│   │   │   ├── telegram/logout/           # Session termination
│   │   │   └── mini-app/                  # Dashboard, tests, attempts, submit
│   │   ├── exam/[testId]/                 # Live mobile test engine
│   │   ├── results/                       # Past results history
│   │   ├── results/[attemptId]/           # Solution review with explanations
│   │   ├── tests/                         # Mock tests catalog
│   │   ├── chapters/                      # Chapter-wise practice tests
│   │   ├── profile/                       # Student profile & settings
│   │   ├── globals.css                    # Design system tokens & Tailwind v4
│   │   └── layout.tsx                     # Root layout with Telegram SDK script
│   ├── components/
│   │   ├── layout/Header.tsx              # Top bar with streak & profile
│   │   ├── layout/BottomNav.tsx           # Sticky mobile navigation bar
│   │   └── providers/TelegramProvider.tsx # Telegram WebApp context & hooks
│   ├── lib/
│   │   ├── supabase/                      # Client, server & admin Supabase helpers
│   │   ├── telegram/auth.ts               # Telegram crypto HMAC signature verifier
│   │   ├── test-engine.ts                 # Test lifecycle, scoring & evaluations
│   │   └── utils.ts                       # Formatters, timer, chapter mapping
│   └── types/
│       ├── database.ts                    # Canonical database types
│       └── telegram.ts                    # Telegram WebApp SDK types
├── supabase/
│   └── migrations/
│       └── 20261019_telegram_mini_app.sql # Attempt & answer tracking tables
├── tests/
│   └── telegram-auth-and-engine.test.mjs  # Automated unit test suite
├── package.json
└── tsconfig.json
```

---

## 3. Environment Variables

Create `.env.local` inside `mini-app/`:

```env
# Supabase Configuration (Connected to CCCGuru project)
NEXT_PUBLIC_SUPABASE_URL=https://zxzzxtiwlndsghmelnph.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Supabase Service Role Key (SERVER-SIDE ONLY - Optional for elevated operations)
SUPABASE_SERVICE_ROLE_KEY=

# Telegram Bot Token (SERVER-SIDE ONLY - Never prefix with NEXT_PUBLIC_)
# Obtain from @BotFather on Telegram (e.g. 123456789:ABCdefGHIjklMNOpqrSTUvwxYZ)
TELEGRAM_BOT_TOKEN=

# Public Bot Username (without @)
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=cccguru_bot

# Application URL (Use localhost for dev, ngrok/cloudflare for Telegram dev, or production URL)
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Development Preview Mode (Allows browser testing without Telegram client)
NEXT_PUBLIC_DEV_PREVIEW=true
```

> [!CAUTION]
> Never expose `TELEGRAM_BOT_TOKEN` or `SUPABASE_SERVICE_ROLE_KEY` to client-side code or prefix them with `NEXT_PUBLIC_`.

---

## 4. Local Development & Testing

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Run Unit Tests
Run the automated test suite verifying Telegram HMAC signatures, session integrity, scoring calculations, and question sanitization:
```bash
npm test
```
All 9 test cases will execute and validate the security engine.

### Step 3: Run Type Check & Build
```bash
npx tsc --noEmit
npm run build
```

### Step 4: Start Development Server
```bash
npm run dev
```
Open [http://localhost:3001](http://localhost:3001) in your browser. The app will launch in **Browser Preview Mode**, allowing you to test mock exams, navigate chapters, select answers, submit, and review solutions.

---

## 5. Database Setup (Optional / Non-Destructive)

The application includes an in-memory & session-based fallback engine, meaning it works immediately out of the box.

To persist student test attempts and answers long-term in Supabase:
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open the **SQL Editor**.
3. Open and run the migration file:
   `mini-app/supabase/migrations/20261019_telegram_mini_app.sql`
4. The migration creates:
   - `student_test_attempts`
   - `student_attempt_answers`
   - Row Level Security (RLS) policies and performance indexes.

---

## 6. Telegram Bot Configuration (@BotFather)

Follow these steps to link your Telegram Bot to the Mini App:

### Step 1: Create or Select Bot
1. Open Telegram and search for `@BotFather`.
2. Send `/mybots` and select your CCCGuru bot (or `/newbot` to create a new one, e.g. `@cccguru_bot`).
3. Note your **API Token** and add it to `TELEGRAM_BOT_TOKEN` in your server environment.

### Step 2: Configure Menu Button / Main Mini App
1. In `@BotFather`, select **Bot Settings** -> **Menu Button** -> **Configure menu button**.
2. Provide your deployed HTTPS URL (or tunnel URL):
   `https://mini.cccguru.in`
3. Provide the button title: `Practice CCC Tests`.

### Step 3: Enable WebApp Direct Attachment (Optional)
1. In `@BotFather`, select **Bot Settings** -> **Inline Mode** -> **Turn on**.
2. Or create a Web App attachment via `/newapp` if you want a dedicated t.me direct short link (e.g., `t.me/cccguru_bot/app`).

---

## 7. Deployment Instructions

### Deploy to Vercel (Recommended):
1. Import the repository into Vercel and specify Root Directory: `mini-app`.
2. Set Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `TELEGRAM_BOT_TOKEN`
   - `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`
   - `NEXT_PUBLIC_APP_URL` (e.g. `https://mini.cccguru.in`)
   - `NEXT_PUBLIC_DEV_PREVIEW=false` (in production)
3. Deploy!

### Iframe & Embedding Rules:
The Next.js configuration in `next.config.ts` includes:
```typescript
{
  key: "Content-Security-Policy",
  value: "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org telegram:;"
}
```
This ensures Telegram Web and Telegram Desktop clients can securely embed the Mini App without `X-Frame-Options` blocks.

---

## 8. Verification & Acceptance Checklist

- [x] Workspace inspected: identified `website`, `ccc-prep`, `admin panel`, and unified Supabase database schema.
- [x] Architecture audit documented in `docs/telegram-mini-app-architecture.md`.
- [x] Secure Telegram authentication implemented with server-side HMAC-SHA256 signature verification.
- [x] Test engine with question sanitization (answer keys withheld during active test).
- [x] Full scoring logic with correct/incorrect tracking, accuracy percentage, time taken, and negative marking support.
- [x] Mobile-first UI with sticky bottom navigation, question palette drawer, bilingual English/Hindi toggle, and timer warnings.
- [x] Results history and detailed solution review with explanations.
- [x] 9-test unit suite passing (`npm test`).
- [x] TypeScript verification (`npx tsc --noEmit`) passing with 0 errors.
- [x] Production build (`npm run build`) passing with 0 errors.
- [x] Existing website (`/website`) verified untouched and passing build checks.
