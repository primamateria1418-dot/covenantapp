# Active Context: Covenant — Christian Marriage App

## Current State

**Project Status**: ✅ Foundation scaffolded — ready for feature development

The project has been converted from a Next.js template to a React Native / Expo 52 app called **Covenant**, a Christian marriage companion app.

## Recently Completed

- [x] Replaced Next.js template with Expo 52 + React Native 0.76 setup
- [x] Installed all required dependencies (expo-router, fonts, supabase, notifications, media, storage)
- [x] Created `constants/colours.ts` with full brand palette
- [x] Created `constants/data.ts` with scripture verses, daily prompts, devotional topics, marriage tips
- [x] Created `lib/supabase.ts` with typed Supabase client + AsyncStorage session persistence
- [x] Created `lib/notifications.ts` with daily reminder scheduling
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
| `app/(tabs)/checkin.tsx` | Daily mood check-in + prompt | ✅ Ready |
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
| `lib/notifications.ts` | Push notification scheduling | ✅ Ready |
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

## Next Steps (Suggested)

- [ ] Wire up Supabase auth in login/signup screens
- [ ] Implement prayer request CRUD with Supabase
- [ ] Implement journal entry CRUD with Supabase
- [ ] Add real check-in mood logging
- [ ] Add photo upload to Memory Lane (expo-image-picker + expo-file-system)
- [ ] Add push notification permission request on first launch
- [ ] Add anniversary countdown to profile
- [ ] Add more scripture verses and devotional content

## Session History

| Date | Changes |
|------|---------|
| 2026-03-06 | Bootstrapped Covenant app — full Expo/RN scaffold with all screens, navigation, dark mode, TypeScript |
