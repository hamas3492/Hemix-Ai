import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.hemix.ai",
  appName: "Hemix AI",
  webDir: "www",
  backgroundColor: "#0a0a0a",
  server: {
    // Load the deployed Hemix AI web app — all API calls go to this server
    // API keys remain server-side on Vercel, never exposed in the APK
    url: "https://hemix-ai-woad.vercel.app",
    cleartext: true,
  },
  android: {
    backgroundColor: "#0a0a0a",
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#0a0a0a",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      spinnerColor: "#3b82f6",
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#0a0a0a",
      overlaysWebView: false,
    },

  },
};

export default config;
