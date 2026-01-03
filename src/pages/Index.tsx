import { useState, useEffect } from 'react';
import CinematicScene from '@/components/CinematicScene';
import UIOverlay from '@/components/UIOverlay';
import LoadingScreen from '@/components/LoadingScreen';

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isIntroComplete, setIsIntroComplete] = useState(false);
  const [hoveredWorld, setHoveredWorld] = useState<'taxi' | 'food' | null>(null);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleWorldSelect = (world: 'taxi' | 'food' | null) => {
    setHoveredWorld(world);
  };

  const handleIntroComplete = () => {
    setIsIntroComplete(true);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {/* SEO */}
      <title>Osječki Taxi - Taxi & Dostava Hrane | Premium Kinematsko Iskustvo 2026</title>
      <meta name="description" content="Doživite budućnost prijevoza i dostave hrane s Osječkim Taxijem. Premium taxi usluga i brza dostava hrane u jednoj platformi." />
      
      {/* 3D Scene */}
      <CinematicScene 
        onWorldSelect={handleWorldSelect}
        onIntroComplete={handleIntroComplete}
      />
      
      {/* UI Overlay */}
      <UIOverlay 
        isIntroComplete={isIntroComplete}
        hoveredWorld={hoveredWorld}
        onSelectWorld={handleWorldSelect}
      />
    </div>
  );
};

export default Index;
