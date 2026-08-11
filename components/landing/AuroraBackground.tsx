"use client";

export function AuroraBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-background" />

      {/* Aurora blobs */}
      <div
        className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] rounded-full opacity-30 blur-[120px] animate-aurora-1"
        style={{ background: "radial-gradient(circle, #3B82F6, transparent 70%)" }}
      />
      <div
        className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-20 blur-[120px] animate-aurora-2"
        style={{ background: "radial-gradient(circle, #14B8A6, transparent 70%)" }}
      />
      <div
        className="absolute bottom-[-10%] left-[20%] w-[55%] h-[55%] rounded-full opacity-15 blur-[120px] animate-aurora-3"
        style={{ background: "radial-gradient(circle, #3B82F6, transparent 70%)" }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Noise overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
