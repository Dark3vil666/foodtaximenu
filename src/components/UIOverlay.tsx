import React from 'react';

interface UIOverlayProps {
  isIntroComplete: boolean;
  hoveredWorld: 'taxi' | 'food' | null;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ isIntroComplete, hoveredWorld }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-20">
      {/* Top left branding */}
      <div 
        className={`absolute top-8 left-8 transition-all duration-1000 ${
          isIntroComplete ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
        style={{ transitionDelay: '0.5s' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
          <span className="font-display text-lg tracking-[0.3em] text-foreground/80">
            031 — OSJEČKI TAXI
          </span>
        </div>
      </div>

      {/* Center title */}
      <div 
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center transition-all duration-1000 ${
          isIntroComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
        style={{ transitionDelay: '1s' }}
      >
        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-wider mb-4 text-gradient-neon">
          One portal.
        </h1>
        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-wider mb-8 text-gradient-neon">
          Two worlds.
        </h1>
        <p className="font-body text-lg md:text-xl text-muted-foreground tracking-[0.2em] uppercase">
          Taxi & Food delivery — cinematic 3D experience
        </p>
      </div>

      {/* World labels */}
      <div 
        className={`absolute top-1/2 left-[15%] -translate-y-1/2 transition-all duration-500 ${
          hoveredWorld === 'taxi' ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-primary/50 flex items-center justify-center glow-border">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h8m-8 4h4m4 0h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="font-display text-2xl neon-text-blue tracking-wider">TAXI</h2>
          <p className="font-body text-sm text-muted-foreground mt-2">Click to enter</p>
        </div>
      </div>

      <div 
        className={`absolute top-1/2 right-[15%] -translate-y-1/2 transition-all duration-500 ${
          hoveredWorld === 'food' ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-secondary/50 flex items-center justify-center" style={{ boxShadow: '0 0 20px hsl(var(--neon-orange) / 0.3)' }}>
            <svg className="w-8 h-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="font-display text-2xl neon-text-orange tracking-wider">FOOD</h2>
          <p className="font-body text-sm text-muted-foreground mt-2">Click to enter</p>
        </div>
      </div>

      {/* Side indicators */}
      <div 
        className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-700 ${
          isIntroComplete ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
        }`}
        style={{ transitionDelay: '1.5s' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className={`w-1 h-24 rounded-full transition-all duration-500 ${
            hoveredWorld === 'taxi' ? 'bg-primary shadow-[0_0_20px_hsl(var(--neon-blue)/0.8)]' : 'bg-muted'
          }`} />
          <span className="font-display text-xs tracking-[0.2em] text-muted-foreground rotate-[-90deg] whitespace-nowrap origin-center">
            TAXI WORLD
          </span>
        </div>
      </div>

      <div 
        className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-700 ${
          isIntroComplete ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
        }`}
        style={{ transitionDelay: '1.5s' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className={`w-1 h-24 rounded-full transition-all duration-500 ${
            hoveredWorld === 'food' ? 'bg-secondary shadow-[0_0_20px_hsl(var(--neon-orange)/0.8)]' : 'bg-muted'
          }`} />
          <span className="font-display text-xs tracking-[0.2em] text-muted-foreground rotate-90 whitespace-nowrap origin-center">
            FOOD WORLD
          </span>
        </div>
      </div>

      {/* Bottom copyright */}
      <div 
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-1000 ${
          isIntroComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
        style={{ transitionDelay: '2s' }}
      >
        <p className="font-body text-sm text-muted-foreground tracking-[0.15em]">
          © 2024 OSJEČKI TAXI
        </p>
      </div>

      {/* Scroll indicator */}
      <div 
        className={`absolute bottom-20 left-1/2 -translate-x-1/2 transition-all duration-1000 ${
          isIntroComplete && !hoveredWorld ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ transitionDelay: '2.5s' }}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="font-body text-xs text-muted-foreground tracking-widest uppercase">
            Hover to explore
          </span>
          <div className="w-6 h-10 rounded-full border border-muted-foreground/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 rounded-full bg-primary animate-bounce" />
          </div>
        </div>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-32 h-32 pointer-events-none">
        <svg viewBox="0 0 100 100" className="w-full h-full opacity-30">
          <path d="M0 50 L0 0 L50 0" fill="none" stroke="hsl(var(--primary))" strokeWidth="1" />
          <circle cx="50" cy="0" r="3" fill="hsl(var(--primary))" />
          <circle cx="0" cy="50" r="3" fill="hsl(var(--primary))" />
        </svg>
      </div>

      <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none">
        <svg viewBox="0 0 100 100" className="w-full h-full opacity-30">
          <path d="M100 50 L100 0 L50 0" fill="none" stroke="hsl(var(--secondary))" strokeWidth="1" />
          <circle cx="50" cy="0" r="3" fill="hsl(var(--secondary))" />
          <circle cx="100" cy="50" r="3" fill="hsl(var(--secondary))" />
        </svg>
      </div>

      <div className="absolute bottom-0 left-0 w-32 h-32 pointer-events-none">
        <svg viewBox="0 0 100 100" className="w-full h-full opacity-30">
          <path d="M0 50 L0 100 L50 100" fill="none" stroke="hsl(var(--primary))" strokeWidth="1" />
          <circle cx="50" cy="100" r="3" fill="hsl(var(--primary))" />
          <circle cx="0" cy="50" r="3" fill="hsl(var(--primary))" />
        </svg>
      </div>

      <div className="absolute bottom-0 right-0 w-32 h-32 pointer-events-none">
        <svg viewBox="0 0 100 100" className="w-full h-full opacity-30">
          <path d="M100 50 L100 100 L50 100" fill="none" stroke="hsl(var(--secondary))" strokeWidth="1" />
          <circle cx="50" cy="100" r="3" fill="hsl(var(--secondary))" />
          <circle cx="100" cy="50" r="3" fill="hsl(var(--secondary))" />
        </svg>
      </div>

      {/* Film grain overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Vignette */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, hsl(var(--dark-navy)) 100%)',
        }}
      />
    </div>
  );
};

export default UIOverlay;
