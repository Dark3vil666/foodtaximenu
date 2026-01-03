import React from 'react';
import { Car, Utensils } from 'lucide-react';

interface UIOverlayProps {
  isIntroComplete: boolean;
  hoveredWorld: 'taxi' | 'food' | null;
  isWarpAnimating?: boolean;
  onSelectWorld?: (world: 'taxi' | 'food') => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ isIntroComplete, hoveredWorld, isWarpAnimating, onSelectWorld }) => {
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

      {/* Center content - futuristic Croatian text */}
      <div 
        className={`absolute top-[15%] left-1/2 -translate-x-1/2 text-center transition-all duration-1000 ${
          isIntroComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
        style={{ transitionDelay: '1s' }}
      >
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-wider mb-4 text-gradient-neon">
          BUDUĆNOST JE STIGLA
        </h1>
        <p className="font-body text-lg md:text-xl text-muted-foreground tracking-[0.15em] uppercase mb-2">
          Jedan portal. Dva svijeta.
        </p>
        <p className="font-body text-base text-muted-foreground/70 tracking-widest">
          Taxi & Dostava hrane — Osijek 2026
        </p>
      </div>

      {/* VISIBLE SELECTION BUTTONS - Always visible when intro complete */}
      <div 
        className={`absolute bottom-[20%] left-1/2 -translate-x-1/2 flex gap-8 md:gap-16 transition-all duration-1000 ${
          isIntroComplete && !isWarpAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
        style={{ transitionDelay: '1.2s' }}
      >
        {/* TAXI Button */}
        <button 
          onClick={() => onSelectWorld?.('taxi')}
          className={`pointer-events-auto group flex flex-col items-center gap-4 p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer
            ${hoveredWorld === 'taxi' 
              ? 'border-primary bg-primary/20 scale-105 shadow-[0_0_40px_hsl(var(--primary)/0.5)]' 
              : 'border-primary/40 bg-primary/5 hover:border-primary hover:bg-primary/15 hover:scale-105 hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)]'
            }`}
        >
          <div className={`w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all duration-300
            ${hoveredWorld === 'taxi' 
              ? 'border-primary bg-primary/30 shadow-[0_0_25px_hsl(var(--primary)/0.6)]' 
              : 'border-primary/50 bg-primary/10 group-hover:border-primary group-hover:bg-primary/20'
            }`}>
            <Car className={`w-10 h-10 transition-colors duration-300 ${hoveredWorld === 'taxi' ? 'text-primary' : 'text-primary/70 group-hover:text-primary'}`} />
          </div>
          <div className="text-center">
            <h2 className={`font-display text-2xl tracking-wider transition-colors duration-300 ${hoveredWorld === 'taxi' ? 'neon-text-blue' : 'text-primary/80 group-hover:text-primary'}`}>
              TAXI
            </h2>
            <p className="font-body text-sm text-muted-foreground mt-1">
              Naruči vožnju
            </p>
          </div>
        </button>

        {/* FOOD Button */}
        <button 
          onClick={() => onSelectWorld?.('food')}
          className={`pointer-events-auto group flex flex-col items-center gap-4 p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer
            ${hoveredWorld === 'food' 
              ? 'border-secondary bg-secondary/20 scale-105 shadow-[0_0_40px_hsl(var(--neon-orange)/0.5)]' 
              : 'border-secondary/40 bg-secondary/5 hover:border-secondary hover:bg-secondary/15 hover:scale-105 hover:shadow-[0_0_30px_hsl(var(--neon-orange)/0.3)]'
            }`}
        >
          <div className={`w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all duration-300
            ${hoveredWorld === 'food' 
              ? 'border-secondary bg-secondary/30 shadow-[0_0_25px_hsl(var(--neon-orange)/0.6)]' 
              : 'border-secondary/50 bg-secondary/10 group-hover:border-secondary group-hover:bg-secondary/20'
            }`}>
            <Utensils className={`w-10 h-10 transition-colors duration-300 ${hoveredWorld === 'food' ? 'text-secondary' : 'text-secondary/70 group-hover:text-secondary'}`} />
          </div>
          <div className="text-center">
            <h2 className={`font-display text-2xl tracking-wider transition-colors duration-300 ${hoveredWorld === 'food' ? 'neon-text-orange' : 'text-secondary/80 group-hover:text-secondary'}`}>
              HRANA
            </h2>
            <p className="font-body text-sm text-muted-foreground mt-1">
              Naruči dostavu
            </p>
          </div>
        </button>
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
            TAXI
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
            HRANA
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
          © 2026 OSJEČKI TAXI
        </p>
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
