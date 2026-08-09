import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Hemix AI — Think Faster. Create Smarter.",
  description:
    "The premium AI chatbot platform bringing GPT, Claude, Gemini, DeepSeek, and more into one beautiful, unified experience.",
  keywords: ["AI chatbot", "GPT", "Claude", "Gemini", "AI platform", "Hemix AI"],
  openGraph: {
    title: "Hemix AI — Think Faster. Create Smarter.",
    description: "The premium AI chatbot platform with multi-model support.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/assets/icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/assets/icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
