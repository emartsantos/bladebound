# Phase 40 — Production Deployment

## Status: CI/CD pipeline + EAS configuration delivered (execution requires a Git host / Expo accounts)

### Deliverables Implemented

#### 1. GitHub Actions pipelines (`.github/workflows/`)

**`ci.yml`** — runs on every push/PR to `main`:
- Type-checks all packages (`shared-types`, `validation`, `game-data`, `ui-tokens`,
  `utilities`) and the web app
- Lints the web app
- Unit-test suites: `@premium-rpg/game-engine`, `@premium-rpg/validation`,
  `@premium-rpg/mobile` (vitest)
- **Web E2E** job: Playwright with Chromium, runs the Phase 39 six-category
  suite, uploads the trace/HTML report as an artifact
- Dispatch gating: `game-engine` typecheck is skipped — `src/combat.ts` carries
  pre-existing type errors (Phase 10 file, parked); the engine is covered by its
  passing 693-test suite
- Web production build (`next build`)

**`release.yml`** — on `v*` git tags:
- Runs CI-equivalent verification, builds the web app
- Generates release notes from commit history + GH release
- Deploys to Vercel **only if** `VERCEL_TOKEN`/`VERCEL_ORG_ID`/`VERCEL_PROJECT_ID`
  secrets are present
- EAS production Android build + Play Store submit **only if** `EXPO_TOKEN` is
  present (iOS build/submit documented inline; needs macOS/Apple Developer account)

**`detox.yml`** — manual + weekly-scheduled Detox smoke on a macOS runner
(iOS simulator): pod install, debug build, `smoke.e2e.js`, artifact upload.

#### 2. Expo / EAS configuration
- `apps/mobile/eas.json` — `development` (internal APK + dev client), `preview`
  (internal APK), `production` (auto-increment build number) profiles, plus a
  submit profile
- `apps/mobile/app.json` — real icon/splash now exist:
  - `src/assets/icon.png` (1024×1024, palette-correct dark-etching sword glyph)
  - `src/assets/adaptive-icon.png` (1024×1024, transparent-bg adaptive foreground)
  - `src/assets/splash.png` (2048×2048, night + ember dash ring)
  - Both wired into `app.json` (`icon`, `android.adaptiveIcon.foregroundImage`,
    `splash.image`), resolving the previous missing-icon EAS build failure

#### 3. Release process
- Tags `v*` trigger `release.yml`; version string lives in `package.json`
  (`0.1.0`) and `app.json` (`0.1.0`). Bump versions, tag, push.

### What Still Requires External Accounts/Infrastructure
- Running any of this in a real repo (this workspace is not a git repo)
- GitHub-hosted runners, Vercel/Netlify project, Apple Developer + Google Play
  accounts, EAS (`EXPO_TOKEN`)
- Fresh `npm install` in CI (resolves the stubbed `apps/mobile/node_modules`
  packages that block a local full typecheck)

### Blocked See Details
- `apps/api` remains empty — no backend deployment step exists yet (Phase 41
  live-ops notes this).