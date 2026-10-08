# Android Mobile Application Architecture & Design Specification

## Overview

The Android Mobile Application (Module 06) delivers a responsive, production-ready client built on Expo 52, React Native 0.76.7, and TypeScript. It integrates seamlessly with the exact same backend REST API and PostgreSQL database utilized by the React web application, providing feature parity and real-time synchronization across devices.

---

## Technical Stack & Configuration

- **Framework:** Expo 52 (Managed Workflow)
- **Runtime:** React Native 0.76.7 / React 18.3.1
- **Language:** TypeScript 5.7.3 (Strict Mode)
- **Token Security:** `expo-secure-store` (Hardware-backed Android Keystore / AES-GCM encryption)
- **API Client:** Type-safe Fetch wrapper with automatic Bearer token injection, transparent 401 refresh token rotation, and terminal session expiration handling
- **Build System:** Expo Application Services (EAS Build) with `preview` profile generating standalone APK artifacts

---

## Security Architecture: Hardware-Backed Android Keystore

In strict accordance with enterprise mobile security standards, tokens are **never** stored in plaintext `AsyncStorage` or unencrypted local caches.

1. **Cryptographic Storage:** `expo-secure-store` wraps Android's `KeyStore` provider.
2. **Access & Refresh Tokens:**
   - Keys: `pms_access_token` and `pms_refresh_token`
   - Scoped strictly to the application sandbox using AES-256-GCM.
3. **Automatic Token Refresh Flow:**
   ```
   [Mobile API Request]
           |
           +---> Bearer <accessToken>
           |
           v
   [Backend Response 401?]
           |
           +-- Yes --> [Acquire Mutex / Single In-Flight Refresh]
           |                 |
           |                 +---> POST /api/auth/refresh { refreshToken }
           |                 |
           |                 +-- Success:
           |                 |     Update SecureStore with new tokens
           |                 |     Replay original request with new token
           |                 |
           |                 +-- Failure:
           |                       Wipe SecureStore
           |                       Trigger SessionExpiredHandler
           |                       Redirect to Login with clear banner
           |
           +-- No  --> Return response to caller
   ```

---

## Network Architecture & Host Resolution

To ensure compatibility across local development, physical devices, and Android emulators:

1. **Android Emulator Loopback:**
   - Standard Android emulators cannot resolve `localhost` directly to the host machine.
   - Default fallback: `http://10.0.2.2:3000` (maps to host's `localhost:3000`).
2. **Environment Variable Configuration:**
   - Parameter: `EXPO_PUBLIC_API_BASE_URL` in `apps/mobile/.env`.
   - Physical device testing: set `EXPO_PUBLIC_API_BASE_URL=http://<host-lan-ip>:3000`.
   - Production / Cloud: set `EXPO_PUBLIC_API_BASE_URL=https://pms-api-gdm2.onrender.com`.

---

## Component & Screen Architecture

```
App.tsx (Root Provider & State Machine)
  ├── AuthProvider (SecureStore session restoration, login, register, logout)
  └── AppNavigator
        ├── Unauthenticated State:
        │     ├── LoginScreen (Email/password validation, Keystore persistence)
        │     └── RegisterScreen (Full name, email, password validation)
        │
        └── Authenticated State:
              ├── Top Header (User profile, quick sign-out action)
              ├── Screen Viewport:
              │     ├── DashboardScreen (5 Metric Cards, Recent Projects, Pull-to-refresh)
              │     ├── ProjectsScreen (Search, Status Filter, Create/Edit/Delete, Pull-to-refresh)
              │     └── ProjectDetailScreen (Tasks list, Search, Status/Priority Filter, Toggle, Create/Edit/Delete)
              └── Bottom Navigation Bar (Dashboard, Projects, Sign Out)
```

---

## Standalone Android APK Build Profile (`eas.json`)

```json
{
  "cli": {
    "version": ">= 14.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

Building preview APK:

```bash
cd apps/mobile
pnpm dlx eas-cli build -p android --profile preview
```
