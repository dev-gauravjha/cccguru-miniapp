# SOFTWARE REQUIREMENTS SPECIFICATION (SRS)

## CCCGuru Unified Leaderboard System

**Version:** 1.1  
**Date:** 20 October 2026  
**Project:** CCCGuru.in, CCC Telegram Mini App, and CCC Android App  
**Backend:** Supabase PostgreSQL, Supabase Auth, and Supabase Edge Functions

---

## 1. Introduction

### 1.1 Purpose

The purpose of this project is to implement a centralized leaderboard system for CCCGuru.in and its associated Telegram Mini App and Android application.

The Telegram Mini App is the first implementation priority because it is intended for immediate launch. The website will provide public, read-only leaderboard access without requiring website authentication. Android app integration will be completed later.

All platforms must use the same authoritative scoring backend and leaderboard data.

### 1.2 Project objectives

- Provide Daily, Monthly, and All Time leaderboards.
- Award points based on verified quiz performance.
- Maintain a single authoritative point history.
- Prevent duplicate points and fraudulent score submissions.
- Verify Telegram identities and support secure account linking.
- Display public rankings on the website without implementing website login.
- Preserve compatibility with the future Android app.
- Preserve existing quiz content, premium access, subscriptions, advertisements, and other application functionality.

### 1.3 Scope

**Included in the initial release:**

1. Telegram Mini App leaderboard.
2. Telegram identity verification.
3. Secure quiz scoring and point recording.
4. Daily, Monthly, and All Time rankings.
5. Personal points and rank for authenticated or securely identified users.
6. Public website leaderboard.
7. Supabase schema, RPCs, RLS, and security tests.
8. Documentation for future Android integration.

**Excluded from the initial release:**

- Website registration and login implementation.
- Android app UI implementation or rebuilding.
- A separate leaderboard database for each platform.
- Rewards, cash prizes, or redeemable points.
- Unverified transfer of points between different accounts.
- Destructive daily or monthly score resets.

---

## 2. System overview

The system consists of three clients sharing one backend.

### 2.1 Telegram Mini App

The Telegram Mini App is the first implementation target. It will authenticate or securely identify Telegram users, allow them to complete quizzes, award verified points, and display leaderboard rankings.

### 2.2 CCCGuru.in website

The website will provide a public leaderboard page. Visitors will be able to view public rankings without signing in.

Website visitors will not be able to submit quiz scores, award themselves points, change another user's profile, or access private account information.

### 2.3 CCC Android application

The Android app will later integrate with the same Supabase project, scoring functions, canonical user IDs, and leaderboard queries.

No separate Android leaderboard database will be created.

### 2.4 Shared backend

Supabase PostgreSQL will maintain the authoritative scoring records. Restricted database functions or trusted server-side endpoints will validate attempts and record awarded points.

---

## 3. User roles

### 3.1 Telegram learner

A Telegram user who can access the Mini App, complete available quizzes, and view public rankings.

Before points can be attached to a canonical Supabase account, the user's Telegram identity must be securely verified and mapped to that account.

### 3.2 Linked learner

A learner whose Telegram identity has been securely linked to an existing CCCGuru account.

The same canonical user identity will be used across supported platforms.

### 3.3 Website visitor

A visitor who can view public leaderboard results without registration.

The visitor cannot earn points through the website or access personal account information.

### 3.4 Administrator

An authorized administrator who manages quiz content and applicable scoring configuration through existing administrative tools.

Administrative permissions must not be granted to ordinary clients. Changes to published answer keys and scoring rules must preserve historical attempt integrity.

---

## 4. Functional requirements

### FR-01: Telegram identity verification

The system shall validate raw Telegram Mini App `initData` on a trusted server.

The system shall:

- Verify the cryptographic signature.
- Validate the authentication timestamp.
- Reject malformed, expired, or invalid requests.
- Never trust `initDataUnsafe.user` as proof of identity.
- Store Telegram identity mappings in a private database structure.
- Never expose bot tokens or service-role keys to clients.

### FR-02: Account linking

If a verified Telegram identity is not linked to an existing account, the system shall offer a secure account-linking option.

The system shall:

- Require authentication to the existing account before linking.
- Derive the canonical Supabase user UUID from a verified session.
- Verify Telegram identity independently.
- Enforce unique identity mappings.
- Reject linking conflicts.
- Prevent unauthorized account transfers.
- Preserve existing account scores and history.
- Avoid automatic score merging from unverified guest attempts.

If the user cancels linking, the system shall not create an unauthorized association.

### FR-03: Quiz attempt creation

The backend shall create an attempt associated with the authenticated canonical user and a published quiz.

The attempt shall have a unique identifier and a controlled lifecycle.

Supported states may include:

- In progress
- Completed
- Expired

The server shall validate the quiz, its published version, attempt ownership, and configured attempt restrictions.

### FR-04: Score calculation

The backend shall calculate points using trusted answer keys and validated submitted answers.

Default scoring policy:

| Answer outcome      | Points |
| ------------------- | -----: |
| Correct answer      |     +1 |
| Incorrect answer    |      0 |
| Unanswered question |      0 |

A test containing 100 questions with 85 correct answers shall award 85 leaderboard points under the default policy.

The scoring policy shall be configurable through trusted administrative configuration or database logic.

Examination marks and leaderboard points shall remain separate.

### FR-05: Duplicate prevention

A completed attempt shall award points at most once.

The system shall prevent duplicate awards caused by:

- Repeated button clicks.
- Network retries.
- Concurrent requests.
- Repeated API calls.
- Replayed submission requests.

Database uniqueness constraints and transaction-safe finalization shall enforce this requirement.

### FR-06: Daily leaderboard

The Daily leaderboard shall display points earned during the current India-local calendar day.

The period shall begin at 00:00 IST and end immediately before the next day's 00:00 IST.

Historical point events shall remain stored after the day ends.

### FR-07: Monthly leaderboard

The Monthly leaderboard shall display points earned during the current calendar month in Asia/Kolkata.

The period shall begin on the first day of the month and end immediately before the first day of the next month.

No destructive monthly reset shall be required.

### FR-08: All Time leaderboard

The All Time leaderboard shall display the cumulative total of valid points earned over the user's eligible history.

All Time points shall not reset daily or monthly.

### FR-09: Ranking and ties

The leaderboard shall rank users by points in descending order.

Equal point totals shall receive equal ranks using a documented ranking policy. A stable secondary ordering shall be used for display.

The system shall support at least the top 100 results per request, with pagination or additional queries where required.

### FR-10: Personal score and rank

The Telegram Mini App shall display the current user's points and rank when the user's identity is securely established.

The personal-rank endpoint shall derive the caller's identity from the authenticated session rather than accepting an arbitrary user ID.

A user outside the top 100 shall still be able to retrieve their own rank.

### FR-11: Public profile

The system shall maintain the minimum public profile information needed for leaderboard display.

Possible fields include:

- Display name
- Avatar URL
- Public visibility preference

Private account details, emails, authentication tokens, and private Telegram mappings shall never be included in public leaderboard responses.

### FR-12: Website view-only leaderboard

The website shall provide Daily, Monthly, and All Time leaderboard tabs.

The website shall
