# Active Context: Covenant — Christian Marriage App

## Current State

**Project Status**: ✅ Foundation scaffolded + web preview fixed — ready for feature development

The project has been converted from a Next.js template to a React Native / Expo 52 app called **Covenant**, a Christian marriage companion app.

## Recently Completed

- [x] Built complete Weekly Check-In screen with header, questions, success screen
- [x] Added Supabase database schema (13 tables with RLS policies)
- [x] Fixed web preview: added missing assets/, expo-env.d.ts, react-native-web, react-dom
- [x] Fixed ESLint config: replaced incompatible flat config with .eslintrc.js, fixed 3 unused variable errors
- [x] Replaced Next.js template with Expo 52 + React Native 0.76 setup
- [x] Installed all required dependencies (expo-router, fonts, supabase, notifications, media, storage)
- [x] Created `constants/colours.ts` with full brand palette
- [x] Created `constants/data.ts` with scripture verses, daily prompts, devotional topics, marriage tips
- [x] Created `lib/supabase.ts` with typed Supabase client + AsyncStorage session persistence
- [x] Created `lib/notifications.ts` with daily reminder scheduling + weekly reminder
- [x] Created root `app/_layout.tsx` with Cormorant Garamond + Lato font loading
- [x] Created `app/(tabs)/_layout.tsx` with 4-tab bottom navigator
- [x] Created all 4 tab screens: Check-In, Prayer, Scripture, Devotional
- [x] Created auth screens: login, signup, forgot-password
- [x] Created feature screens: profile, journal, timeline, bucketlist, goals, memory-lane
- [x] Created setup onboarding screen
- [x] Created `PromptBox` and `TipBox` reusable components
- [x] Full dark mode support (system-following) throughout all screens
- [x] TypeScript strict mode — zero type errors

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `app/_layout.tsx` | Root layout, font loading, navigation stack | ✅ Ready |
| `app/index.tsx` | Splash/redirect screen | ✅ Ready |
| `app/setup.tsx` | Onboarding — name, spouse, wedding date | ✅ Ready |
| `app/(tabs)/_layout.tsx` | Bottom tab navigator (4 tabs) | ✅ Ready |
| `app/(tabs)/checkin.tsx` | Weekly marriage check-in with 5 questions, streak tracking, health score | ✅ Ready |
| `app/(tabs)/prayer.tsx` | Prayer requests + verse | ✅ Ready |
| `app/(tabs)/scripture.tsx` | Scripture verse browser | ✅ Ready |
| `app/(tabs)/devotional.tsx` | Devotional topics + daily reading | ✅ Ready |
| `app/auth/login.tsx` | Email/password sign in | ✅ Ready |
| `app/auth/signup.tsx` | Account creation | ✅ Ready |
| `app/auth/forgot-password.tsx` | Password reset | ✅ Ready |
| `app/profile.tsx` | User profile + quick links | ✅ Ready |
| `app/journal.tsx` | Marriage journal with prompts | ✅ Ready |
| `app/timeline.tsx` | Marriage milestone timeline | ✅ Ready |
| `app/bucketlist.tsx` | Couple bucket list with progress | ✅ Ready |
| `app/goals.tsx` | Marriage goals with categories + progress | ✅ Ready |
| `app/memory-lane.tsx` | Photo/video memory gallery | ✅ Ready |
| `constants/colours.ts` | Brand colour palette | ✅ Ready |
| `constants/data.ts` | Scripture, prompts, topics, tips | ✅ Ready |
| `lib/supabase.ts` | Supabase client + DB types | ✅ Ready |
| `lib/notifications.ts` | Push notification scheduling + weekly reminder | ✅ Ready |
| `components/PromptBox.tsx` | Daily prompt card component | ✅ Ready |
| `components/TipBox.tsx` | Marriage tip card component | ✅ Ready |

## Colour Palette

| Token | Hex | Use |
|-------|-----|-----|
| `brownDeep` | `#2c1810` | Dark backgrounds, deep text |
| `brownMid` | `#5a2d1a` | Secondary text, borders |
| `brownWarm` | `#6b3322` | Active tab, primary buttons |
| `gold` | `#c8943a` | Accents, verse references |
| `goldLight` | `#e8c49a` | Prompt backgrounds, light accents |
| `cream` | `#fdf8f3` | Light mode background |
| `greenDeep` | `#2c5f2e` | Spiritual goal category |
| `purple` | `#7c5cbf` | Family goal category |
| `darkBg` | `#1a0f08` | Dark mode background |
| `darkCard` | `#2c1810` | Dark mode card background |

## Tab Navigator

| Tab | Icon | Route |
|-----|------|-------|
| Check-In | ✅ | `/(tabs)/checkin` |
| Prayer | 🙏 | `/(tabs)/prayer` |
| Scripture | 📖 | `/(tabs)/scripture` |
| Devotional | 🌿 | `/(tabs)/devotional` |

Active colour: `#6b3322` (brownWarm). Inactive: grey.

## Auth Flow

| Step | Behaviour |
|------|-----------|
| App launch (`/`) | Check Supabase session → login if none, setup if no profile, tabs if ready |
| Sign Up | Email + password (min 8 chars), show/hide toggle, confirm password, email verification message, Privacy Policy + Terms links |
| Login | Email + password, show/hide toggle, rate limit (5 attempts → 15 min lockout), auto-login if session exists |
| Forgot Password | Email input → Supabase `resetPasswordForEmail`, success message |
| Setup | Save name/spouse/wedding date to `profiles` table via `upsertProfile` |
| Sign Out | `supabase.auth.signOut()` → redirect to `/auth/login` |

## Next Steps (Suggested)

- [ ] Implement prayer request CRUD with Supabase
- [ ] Implement journal entry CRUD with Supabase
- [ ] Add photo upload to Memory Lane (expo-image-picker + expo-file-system)
- [ ] Add push notification permission request on first launch
- [ ] Add anniversary countdown to profile
- [ ] Add more scripture verses and devotional content
- [ ] Run Supabase schema in dashboard to create tables

## Session History

| Date | Changes |
|------|---------|
| 2026-03-06 | Built complete Weekly Check-In screen — header with gradient, couple names, streak counter, health score card, 5-question card, success animation, milestone celebration, notification modal |
| 2026-03-06 | Added Supabase database schema with 13 tables (profiles, couples, checkin_answers, prayers, journal_letters, bucket_list, monthly_goals, streaks, devotional_progress, time_capsules, verses, notifications_log, churches) and RLS policies |
| 2026-03-06 | Fixed ESLint config issues — replaced incompatible flat config with .eslintrc.js, fixed 3 unused variable errors in login.tsx, signup.tsx, setup.tsx |
| 2026-03-06 | Bootstrapped Covenant app — full Expo/RN scaffold with all screens, navigation, dark mode, TypeScript |
| 2026-03-06 | Implemented full Supabase Auth — login, signup, forgot password, session check, rate limiting, sign out, setup profile save, privacy/terms screens |
