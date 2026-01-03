import { useCallback, useRef, useEffect } from 'react';

type SoundType = 'portalOpen' | 'portalHum' | 'vehicleMove' | 'warp' | 'ambient';

interface SoundEffects {
  playSound: (type: SoundType) => void;
  stopSound: (type: SoundType) => void;
  setVolume: (volume: number) => void;
}

// Web Audio API based sound synthesis for cinematic effects
export const useSoundEffects = (): SoundEffects => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const activeNodesRef = useRef<Map<SoundType, OscillatorNode[]>>(new Map());

  useEffect(() => {
    // Initialize audio context on first user interaction
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.connect(audioContextRef.current.destination);
        gainNodeRef.current.gain.value = 0.3;
      }
    };

    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('touchstart', initAudio, { once: true });

    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('touchstart', initAudio);
      audioContextRef.current?.close();
    };
  }, []);

  const createOscillator = useCallback((frequency: number, type: OscillatorType = 'sine', duration: number = 1) => {
    if (!audioContextRef.current || !gainNodeRef.current) return null;

    const osc = audioContextRef.current.createOscillator();
    const oscGain = audioContextRef.current.createGain();
    
    osc.type = type;
    osc.frequency.value = frequency;
    
    osc.connect(oscGain);
    oscGain.connect(gainNodeRef.current);
    
    oscGain.gain.setValueAtTime(0, audioContextRef.current.currentTime);
    oscGain.gain.linearRampToValueAtTime(0.3, audioContextRef.current.currentTime + 0.1);
    oscGain.gain.linearRampToValueAtTime(0, audioContextRef.current.currentTime + duration);
    
    osc.start();
    osc.stop(audioContextRef.current.currentTime + duration);
    
    return osc;
  }, []);

  const playSound = useCallback((type: SoundType) => {
    if (!audioContextRef.current) return;

    // Stop any existing sounds of this type
    const existingNodes = activeNodesRef.current.get(type) || [];
    existingNodes.forEach(node => {
      try { node.stop(); } catch {}
    });
    activeNodesRef.current.set(type, []);

    const nodes: OscillatorNode[] = [];

    switch (type) {
      case 'portalOpen':
        // Deep bass rumble
        const bass1 = createOscillator(40, 'sine', 1.5);
        const bass2 = createOscillator(55, 'triangle', 1.2);
        const mid = createOscillator(120, 'sine', 0.8);
        if (bass1) nodes.push(bass1);
        if (bass2) nodes.push(bass2);
        if (mid) nodes.push(mid);
        break;

      case 'portalHum':
        // Continuous sci-fi hum
        const hum1 = createOscillator(80, 'sine', 3);
        const hum2 = createOscillator(160, 'triangle', 3);
        if (hum1) nodes.push(hum1);
        if (hum2) nodes.push(hum2);
        break;

      case 'vehicleMove':
        // Subtle tire/movement sound
        const tire = createOscillator(100, 'sawtooth', 0.5);
        if (tire) nodes.push(tire);
        break;

      case 'warp':
        // Warp whoosh effect
        if (audioContextRef.current && gainNodeRef.current) {
          const warpOsc = audioContextRef.current.createOscillator();
          const warpGain = audioContextRef.current.createGain();
          
          warpOsc.type = 'sine';
          warpOsc.frequency.setValueAtTime(100, audioContextRef.current.currentTime);
          warpOsc.frequency.exponentialRampToValueAtTime(800, audioContextRef.current.currentTime + 0.5);
          warpOsc.frequency.exponentialRampToValueAtTime(50, audioContextRef.current.currentTime + 1.5);
          
          warpOsc.connect(warpGain);
          warpGain.connect(gainNodeRef.current);
          
          warpGain.gain.setValueAtTime(0, audioContextRef.current.currentTime);
          warpGain.gain.linearRampToValueAtTime(0.4, audioContextRef.current.currentTime + 0.3);
          warpGain.gain.linearRampToValueAtTime(0, audioContextRef.current.currentTime + 1.5);
          
          warpOsc.start();
          warpOsc.stop(audioContextRef.current.currentTime + 1.5);
          nodes.push(warpOsc);
        }
        break;

      case 'ambient':
        // Light ambient background
        const amb1 = createOscillator(60, 'sine', 5);
        const amb2 = createOscillator(90, 'triangle', 5);
        if (amb1) nodes.push(amb1);
        if (amb2) nodes.push(amb2);
        break;
    }

    activeNodesRef.current.set(type, nodes);
  }, [createOscillator]);

  const stopSound = useCallback((type: SoundType) => {
    const nodes = activeNodesRef.current.get(type) || [];
    nodes.forEach(node => {
      try { node.stop(); } catch {}
    });
    activeNodesRef.current.set(type, []);
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = Math.max(0, Math.min(1, volume));
    }
  }, []);

  return { playSound, stopSound, setVolume };
};
