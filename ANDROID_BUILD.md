# Hemix AI — Android App Build Guide

## Architecture

The Hemix AI Android app is built using **Capacitor** — a native runtime that wraps the existing Next.js web application into a proper Android app.

```
Hemix Android App (Capacitor WebView)
  → Loads https://hemix-ai.vercel.app (existing web app)
  → API calls → Vercel serverless backend (API keys stay server-side)
  → Auth → Supabase (same accounts as web)
  → Voice → Web Speech API + Capacitor microphone
  → Images → Backend generate-image API
```

### Why Capacitor?
- **No rebuild from scratch** — reuses 100% of existing Hemix AI code
- **API keys never exposed** — all AI calls go through the Vercel backend
- **Same auth** — Supabase handles cross-platform authentication
- **Website stays functional** — web app is untouched
- **Native features** — mic, camera, haptics, status bar, splash screen
- **Play Store ready** — generates a proper APK/AAB

## Prerequisites

1. **Android Studio** (latest stable)
2. **Java JDK 17+** (comes with Android Studio)
3. **Android SDK** (API 33+, via Android Studio)
4. **Node.js 18+** and npm

## Build Steps

### 1. Install Dependencies
```bash
cd Hemix-Ai
npm install
```

### 2. Sync Web Assets
```bash
npm run cap:sync
```
This copies the `www/` fallback page and syncs Capacitor plugins to the Android project.

### 3. Open in Android Studio
```bash
npm run cap:open
```
This opens the `android/` project in Android Studio.

### 4. Build APK
**Option A — From Android Studio:**
- Build → Build Bundle(s) / APK(s) → Build APK(s)
- The APK will be in `android/app/build/outputs/apk/debug/`

**Option B — Command Line:**
```bash
npm run android:build
```
This runs `./gradlew assembleRelease` (requires signing config)

### 5. Run on Device/Emulator
```bash
npm run android:dev
```
Or from Android Studio: select a device/emulator and click Run.

## Configuration

### capacitor.config.ts
- `appId`: `com.hemix.ai` — the Android package name
- `appName`: `Hemix AI` — shown in the app drawer
- `server.url`: The Vercel deployment URL — change this to update the backend endpoint
- `webDir`: `www` — local fallback/loading page

### Environment Variables
The Android app uses the **same Vercel environment variables** as the web app:
- `SUPABASE_*` — authentication
- `AGENTROUTER_API_KEY` — AI provider
- `ELEVENLABS_API_KEY` — voice cloning (optional)
- `OPENAI_API_KEY` — image generation

These are **never** included in the APK — all calls go to the Vercel backend.

### Android Permissions
- `INTERNET` — network access (required)
- `ACCESS_NETWORK_STATE` — network detection
- `RECORD_AUDIO` — voice conversations
- `CAMERA` — image attachments
- `VIBRATE` — haptic feedback
- `READ/WRITE_EXTERNAL_STORAGE` — file downloads (SDK ≤32)

### Updating the Backend URL
If the Vercel deployment URL changes, update `capacitor.config.ts`:
```typescript
server: {
  url: "https://your-new-url.vercel.app",
  cleartext: true,
}
```
Then run `npm run cap:sync`.

## Native Features

### Status Bar
- Dark style with `#0a0a0a` background matching Hemix theme
- Does not overlay the WebView (content starts below status bar)

### Splash Screen
- Shows Hemix logo on dark background for 2 seconds on launch
- Auto-hides when web app is ready

### Back Button
- Navigates back in history when possible
- Minimizes app (doesn't exit) when at root

### Keyboard
- Adjusts layout when keyboard appears
- Dark keyboard style

### Safe Areas
- CSS `env(safe-area-inset-*)` applied for notch/navigation bar
- Body gets `.native-app` class for native-specific styling

## File Structure

```
Hemix-Ai/
├── android/              # Android native project (Capacitor)
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml
│   │   │   ├── java/com/hemix/ai/MainActivity.java
│   │   │   └── res/      # Icons, splash, styles, strings
│   │   └── build.gradle
│   ├── build.gradle
│   └── settings.gradle
├── capacitor.config.ts   # Capacitor configuration
├── www/                  # Local fallback page (loading screen)
│   ├── index.html
│   └── assets/
├── components/
│   └── NativeInit.tsx    # Initializes Capacitor plugins
├── hooks/
│   ├── useNativePlatform.ts  # Detects native vs web
│   └── useNativeInit.ts      # Native feature initialization
└── app/                  # Existing Next.js app (unchanged)
```

## Release Signing

For Play Store release, create a keystore:

```bash
keytool -genkey -v -keystore hemix-release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias hemix
```

Add to `android/app/build.gradle`:
```gradle
signingConfigs {
    release {
        storeFile file("../../hemix-release.jks")
        storePassword "YOUR_PASSWORD"
        keyAlias "hemix"
        keyPassword "YOUR_PASSWORD"
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
    }
}
```

Then build: `./gradlew assembleRelease`
