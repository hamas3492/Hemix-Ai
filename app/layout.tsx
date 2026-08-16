import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { NativeInit } from "@/components/NativeInit";

export const metadata: Metadata = {
  title: "Hemix AI — Think Faster. Create Smarter.",
  description:
    "The AI chatbot platform bringing powerful models into one beautiful, unified experience.",
  keywords: ["AI chatbot", "GPT", "Claude", "Gemini", "AI platform", "Hemix AI"],
  openGraph: {
    title: "Hemix AI — Think Faster. Create Smarter.",
    description: "The AI chatbot platform with multi-model support.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

// Runs before paint — reads the persisted theme and applies the class
// immediately so there's no flash of the wrong theme on load.
const ANTI_FLASH_SCRIPT = `
(function () {
  try {
    var raw = localStorage.getItem("hemix-storage");
    var theme = "dark";
    if (raw) {
      var parsed = JSON.parse(raw);
      theme = (parsed && parsed.state && parsed.state.appSettings && parsed.state.appSettings.theme) || "dark";
    }
    document.documentElement.classList.add(theme === "light" ? "light" : "dark");
  } catch (e) {
    document.documentElement.classList.add("dark");
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/assets/icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/assets/icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script dangerouslySetInnerHTML={{ __html: ANTI_FLASH_SCRIPT }} />
      </head>
      <body className="antialiased" style={{ background: "var(--bg)", color: "var(--fg)" }}>
        <ThemeProvider><NativeInit />{children}</ThemeProvider>
      </body>
    </html>
  );
}
