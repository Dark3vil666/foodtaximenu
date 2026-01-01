import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="text-center">
        {/* Animated portal ring */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-pulse" />
          <div className="absolute inset-2 rounded-full border-2 border-primary/50 animate-spin" style={{ animationDuration: '3s' }} />
          <div className="absolute inset-4 rounded-full border-2 border-primary animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-primary animate-pulse shadow-[0_0_20px_hsl(var(--primary))]" />
          </div>
        </div>

        {/* Loading text */}
        <div className="font-display text-xl tracking-[0.5em] text-primary mb-4">
          LOADING
        </div>
        
        {/* Progress bar */}
        <div className="w-48 h-1 bg-muted rounded-full mx-auto overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-primary/50 animate-pulse rounded-full" style={{ width: '60%' }} />
        </div>

        {/* Subtitle */}
        <p className="font-body text-sm text-muted-foreground mt-6 tracking-widest">
          Initializing cinematic experience...
        </p>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-8 left-8">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="font-display text-xs tracking-[0.2em] text-muted-foreground">
            OSJEČKI TAXI
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
