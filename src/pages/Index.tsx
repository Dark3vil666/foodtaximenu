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
      <title>Osječki Taxi - Taxi & Food Delivery | Premium Cinematic Experience</title>
      <meta name="description" content="Experience the future of transportation and food delivery with Osječki Taxi. Premium taxi service and fast food delivery in one seamless platform." />
      
      {/* 3D Scene */}
      <CinematicScene 
        onWorldSelect={handleWorldSelect}
        onIntroComplete={handleIntroComplete}
      />
      
      {/* UI Overlay */}
      <UIOverlay 
        isIntroComplete={isIntroComplete}
        hoveredWorld={hoveredWorld}
      />
    </div>
  );
};

export default Index;
