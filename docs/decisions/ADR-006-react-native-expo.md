# ADR-006: Mobile Architecture with React Native and Expo

## Status

Accepted

## Context

The technical assessment mandates an Android mobile application communicating with the exact same backend and database as the web application. Key requirements include hardware-backed secure token storage (Android Keystore), graceful offline/network error handling, pull-to-refresh, and smooth phone screen UX.

## Decision

Adopt **React Native** managed through the **Expo** framework:

- Android is the primary platform target (iOS compatible).
- `expo-secure-store` for cryptographic token storage in Android Keystore / iOS Keychain.
- `@react-native-community/netinfo` for real-time network connectivity monitoring.
- Standard React Native `RefreshControl` for pull-to-refresh data synchrony.

## Alternatives Considered

- _Bare React Native:_ Requires managing native Android Studio / Gradle and Xcode native projects manually, which is error-prone across different host environments.
- _Flutter:_ Strong UI toolkit, but requires Dart, preventing the sharing of TypeScript types, validation logic, and utility functions across Web and Mobile.

## Rationale

Expo provides a managed runtime, rapid testing via Expo Go or development builds, and seamless cloud APK generation via EAS without bloating the Git repository with gigabytes of native Gradle build artifacts.

## Consequences

- Clean JavaScript/TypeScript-only mobile workspace.
- Standalone Android APK can be built via Expo CLI or EAS.
