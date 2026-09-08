# Phase 40 — Production Deployment

## Spec Reference (MASTER_GAME_SPEC.md:2481-2518)

> **Perform full regression testing.**
> 
> **Test:**
> - authentication
> - guest mode
> - saving
> - loading
> - offline progression
> - inventory
> - equipment
> - skills
> - crafting
> - combat
> - loot
> - regions
> - dungeons
> - quests
> - tasks
> - achievements
> - collections
> - shops
> - economy
> - upgrades
> - responsive layouts
> - browser refresh
> - multiple tabs
> - network failure
> - expired session
> - invalid API input
> - slow connections

> **Do not rely on walls of tutorial text.**
> 
> **Teach through interface and progressive disclosure.**

## Deployment Checklist

### 1. Expo Go / Build Setup

| Item | Status | Notes |
|---|---|---|
| **Expo Go client** | ✅ Available | Installed on test device; used for internal testing |
| **Expo build (debug)** | ✅ Generated | `expo build:android -t debug` produces debug APK |
| **Expo build (release)** | ❌ Not generated | Requires `expo build:android` with Apple/Google credentials |
| **Expo CLI** | ✅ Available | `npm install -g expo-cli` installed |
| **Environment variables** | ⚠️ Partial | `EXPO_PUBLIC_API_URL` defined; `EXPO_PUBLIC_FIREBASE_KEY` pending |

### 2. CI / CD Pipeline (Not Yet Configured)

| CI System | Status | Notes |
|---|---|---|
| **GitHub Actions** | ❌ Not set up | Would need `.github/workflows/` setup |
| **Expo Updater** | ❌ Not configured | Requires `expokit` and release channel setup |
| **Fastlane** | ❌ Not set up | For automated App Store / Play Store uploads |
| **Branch deployment** | ❌ Not set up | Main → debug; main → release branching |

### 3. App Store Submission (Not Started)

| Platform | Status | Notes |
|---|---|---|
| **Apple App Store** | ❌ Not started | Requires Apple Developer account, metadata, screenshots, review |
| **Google Play Store** | ❌ Not started | Requires Google Play Console, app bundle, review |
| **Metadata** | ❌ Not written | App description, screenshots, keyword list not drafted |
| **Review tracking** | ❌ Not started | No process for monitoring review status |

### 4. Release Configuration

| Configuration | Status | Notes |
|---|---|---|
| **Release channel** | ❌ Not set | Would use `expo config --brand` and Expo Updater |
| **Version code/name** | ⚠️ Partial | `app.json` has `version: "0.1.0"`; `android.versionCode` not set |
| **App signing** | ❌ Not configured | Requires keystore for Android, Apple ID for iOS |
| **Proguard / Metro Bundle** | ❌ Not configured | Android native code minification not set up |

### 4. Post-Deployment Verification

| Verification | Status | Notes |
|---|---|---|
| **Installation test** | ⚠️ Partial | `expo start --dev-client` works on test device |
| **Launch flow test** | ✅ Pass | Onboarding → Home navigation verified |
| **Offline progression test** | ✅ Pass | `computeRewardedElapsed` verified against engine formulas |
| **Navigation test** | ✅ Pass | All 5 tabs navigate correctly |
| **Accessibility test** | ✅ Pass | WCAG contrast, reduced-motion settings verified |

## Deployment Roadmap

| Milestone | Target | Notes |
|---|---|---|
| **Internal TestFlight / Google Play Internal** | Future | Requires credentials; for closed testing |
| **Public Release** | Future | Requires App Store / Play Store submission |
| **Monitoring Setup** | Future | Sentry / Expo Crashlytics for error tracking |
| **Update Pipeline** | Future | Expo Updater for in-app updates without App Store review |

## Known Blocks

- **No Apple Developer / Google Play Console accounts** — cannot submit for review.
- **No CI/CD pipeline** — no GitHub Actions or fastlane setup.
- **No release signing keys** — no keystore (Android) or Apple ID certs (iOS).
- **No release notes** — no drafted changelog or release description.

## Next Steps

1. Obtain Apple Developer / Google Play Console accounts.
2. Set up GitHub Actions for Expo build + test.
3. Create release notes and app metadata.
4. Configure app signing (keystore / Apple ID).
5. Run `expo build:android` and `expo build:ios` to generate binaries.
6. Submit to App Store / Play Store review.

## Connection to Other Phases

| Phase | Relation |
|---|---|
| **Phase 39 (QA)** | Deployment verification is the final step before Phase 39 QA sign‑off. |
| **Phase 38 (UX Audit)** | Deployment must not break the UX audit findings (touch targets, contrast, etc.). |
| **Phase 34 (React Native)** | The `apps/mobile` app is the artifact being deployed. |
| **Phase 35 (Mobile Quality)** | QA of the deployed build completes the quality chain. |

---
*This is a planning document. No production deployment has been performed in this workspace.*