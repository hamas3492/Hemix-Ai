import { Providers } from "@/components/Providers";
import { AuroraBackground } from "@/components/landing/AuroraBackground";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { FeatureCards } from "@/components/landing/FeatureCards";
import { AICapabilities } from "@/components/landing/AICapabilities";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <Providers>
      <AuroraBackground />
      <Navbar />
      <main>
        <Hero />
        <FeatureCards />
        <AICapabilities />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </Providers>
  );
}
