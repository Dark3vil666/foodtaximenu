import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import gsap from 'gsap';
import osijekSkybox from '@/assets/osijek-skybox.jpg';
import { useTimeOfDay } from '@/hooks/useTimeOfDay';
import { useSoundEffects } from '@/hooks/useSoundEffects';

// GLTF model paths
const TAXI_MODEL_PATH = '/models/sedan.glb';

interface CinematicSceneProps {
  onWorldSelect: (world: 'taxi' | 'food' | null) => void;
  onIntroComplete: () => void;
}

type SceneState = 'intro' | 'idle' | 'hover-taxi' | 'hover-food' | 'warp' | 'portal-opening' | 'driving';

const CinematicScene: React.FC<CinematicSceneProps> = ({ onWorldSelect, onIntroComplete }) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const bloomPassRef = useRef<UnrealBloomPass | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const taxiGroupRef = useRef<THREE.Group | null>(null);
  const scooterGroupRef = useRef<THREE.Group | null>(null);
  const portalRef = useRef<THREE.Group | null>(null);
  const groundPortalRef = useRef<THREE.Group | null>(null);
  const rainParticlesRef = useRef<THREE.Points | null>(null);
  const steamParticlesRef = useRef<THREE.Points | null>(null);
  const portalParticlesRef = useRef<THREE.Points | null>(null);
  const taxiLightRef = useRef<THREE.PointLight | null>(null);
  const scooterLightRef = useRef<THREE.PointLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const directionalLightRef = useRef<THREE.DirectionalLight | null>(null);
  const timeRef = useRef(0);
  const gltfLoaderRef = useRef<GLTFLoader | null>(null);
  const taxiModelLoadedRef = useRef(false);
  
  const [sceneState, setSceneState] = useState<SceneState>('intro');
  const [isWarpAnimating, setIsWarpAnimating] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  
  const timeOfDay = useTimeOfDay();
  const { playSound } = useSoundEffects();

  // Day/Night lighting configuration
  const lightingConfig = {
    day: {
      ambientColor: 0x8899aa,
      ambientIntensity: 0.8,
      directionalColor: 0xffffff,
      directionalIntensity: 1.2,
      fogColor: 0x6688aa,
      fogDensity: 0.008,
      skyTint: new THREE.Color(0.6, 0.7, 0.9),
      bloomStrength: 0.8,
    },
    night: {
      ambientColor: 0x1a2030,
      ambientIntensity: 0.5,
      directionalColor: 0x6688aa,
      directionalIntensity: 0.5,
      fogColor: 0x050510,
      fogDensity: 0.015,
      skyTint: new THREE.Color(0.05, 0.05, 0.1),
      bloomStrength: 1.5,
    },
  };

  // Add Osječki Taxi branding to GLTF model
  const addTaxiBranding = useCallback((group: THREE.Group) => {
    // Blue diagonal stripes
    const blueStripeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1a4a8a,
      metalness: 0.3,
      roughness: 0.4,
    });

    // Left side blue stripe
    const leftStripeGeometry = new THREE.PlaneGeometry(2.5, 0.5);
    const leftStripe = new THREE.Mesh(leftStripeGeometry, blueStripeMaterial);
    leftStripe.position.set(-1.01, 0.6, 0.3);
    leftStripe.rotation.y = -Math.PI / 2;
    leftStripe.rotation.z = -0.3;
    group.add(leftStripe);

    // Right side blue stripe
    const rightStripe = new THREE.Mesh(leftStripeGeometry, blueStripeMaterial);
    rightStripe.position.set(1.01, 0.6, 0.3);
    rightStripe.rotation.y = Math.PI / 2;
    rightStripe.rotation.z = 0.3;
    group.add(rightStripe);

    // Gold stripes
    const goldStripeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xd4a43a,
      metalness: 0.6,
      roughness: 0.3,
      emissive: 0xd4a43a,
      emissiveIntensity: 0.1,
    });

    const goldStripeGeometry = new THREE.PlaneGeometry(1.8, 0.15);
    const leftGold = new THREE.Mesh(goldStripeGeometry, goldStripeMaterial);
    leftGold.position.set(-1.02, 0.45, 0.8);
    leftGold.rotation.y = -Math.PI / 2;
    leftGold.rotation.z = -0.3;
    group.add(leftGold);

    const rightGold = new THREE.Mesh(goldStripeGeometry, goldStripeMaterial);
    rightGold.position.set(1.02, 0.45, 0.8);
    rightGold.rotation.y = Math.PI / 2;
    rightGold.rotation.z = 0.3;
    group.add(rightGold);

    // Phone number panel (031 200 200)
    const textPanelMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1a4a8a,
      emissive: 0x1a4a8a,
      emissiveIntensity: 0.3,
    });
    const textPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 0.25),
      textPanelMaterial
    );
    textPanel.position.set(-1.02, 0.7, -0.5);
    textPanel.rotation.y = -Math.PI / 2;
    group.add(textPanel);

    const textPanelRight = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 0.25),
      textPanelMaterial
    );
    textPanelRight.position.set(1.02, 0.7, -0.5);
    textPanelRight.rotation.y = Math.PI / 2;
    group.add(textPanelRight);

    // Ground reflection glow
    const groundGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 5.5),
      new THREE.MeshBasicMaterial({
        color: 0xffffee,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide,
      })
    );
    groundGlow.rotation.x = -Math.PI / 2;
    groundGlow.position.y = 0.02;
    group.add(groundGlow);
  }, []);

  // Create realistic Osječki Taxi with proper livery (procedural fallback)
  const createTaxiModel = useCallback(() => {
    const group = new THREE.Group();
    
    // Car body - realistic sedan proportions
    const bodyGeometry = new THREE.BoxGeometry(2.0, 0.7, 4.5);
    const bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, // White body
      metalness: 0.4,
      roughness: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.5,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.6;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Lower body panel
    const lowerBodyGeometry = new THREE.BoxGeometry(2.1, 0.25, 4.6);
    const lowerBody = new THREE.Mesh(lowerBodyGeometry, bodyMaterial);
    lowerBody.position.y = 0.25;
    lowerBody.castShadow = true;
    group.add(lowerBody);

    // Blue diagonal stripes (left side)
    const blueStripeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1a4a8a, // Osječki Taxi blue
      metalness: 0.3,
      roughness: 0.4,
    });
    
    // Left side blue stripe
    const leftStripeGeometry = new THREE.PlaneGeometry(2.5, 0.5);
    const leftStripe = new THREE.Mesh(leftStripeGeometry, blueStripeMaterial);
    leftStripe.position.set(-1.01, 0.6, 0.3);
    leftStripe.rotation.y = -Math.PI / 2;
    leftStripe.rotation.z = -0.3; // Diagonal
    group.add(leftStripe);

    // Right side blue stripe
    const rightStripe = new THREE.Mesh(leftStripeGeometry, blueStripeMaterial);
    rightStripe.position.set(1.01, 0.6, 0.3);
    rightStripe.rotation.y = Math.PI / 2;
    rightStripe.rotation.z = 0.3;
    group.add(rightStripe);

    // Gold diagonal stripes
    const goldStripeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xd4a43a, // Gold
      metalness: 0.6,
      roughness: 0.3,
      emissive: 0xd4a43a,
      emissiveIntensity: 0.1,
    });
    
    // Gold accents
    const goldStripeGeometry = new THREE.PlaneGeometry(1.8, 0.15);
    const leftGold = new THREE.Mesh(goldStripeGeometry, goldStripeMaterial);
    leftGold.position.set(-1.02, 0.45, 0.8);
    leftGold.rotation.y = -Math.PI / 2;
    leftGold.rotation.z = -0.3;
    group.add(leftGold);

    const rightGold = new THREE.Mesh(goldStripeGeometry, goldStripeMaterial);
    rightGold.position.set(1.02, 0.45, 0.8);
    rightGold.rotation.y = Math.PI / 2;
    rightGold.rotation.z = 0.3;
    group.add(rightGold);

    // Blue checkered pattern on rear
    const checkerMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1a4a8a,
      metalness: 0.2,
      roughness: 0.5,
    });
    
    // Create checkered pattern
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 2; j++) {
        if ((i + j) % 2 === 0) {
          const checker = new THREE.Mesh(
            new THREE.PlaneGeometry(0.15, 0.15),
            checkerMaterial
          );
          checker.position.set(-0.55 + i * 0.15, 0.35 + j * 0.15, -2.26);
          group.add(checker);
        }
      }
    }

    // Hood slope
    const hoodGeometry = new THREE.BoxGeometry(1.9, 0.2, 1.2);
    const hood = new THREE.Mesh(hoodGeometry, bodyMaterial);
    hood.position.set(0, 0.95, 1.6);
    hood.rotation.x = -0.12;
    hood.castShadow = true;
    group.add(hood);

    // Trunk
    const trunkGeometry = new THREE.BoxGeometry(1.9, 0.2, 1.0);
    const trunk = new THREE.Mesh(trunkGeometry, bodyMaterial);
    trunk.position.set(0, 0.9, -1.8);
    trunk.rotation.x = 0.08;
    trunk.castShadow = true;
    group.add(trunk);

    // Cabin/Roof
    const cabinGeometry = new THREE.BoxGeometry(1.8, 0.55, 2.4);
    const cabinMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf8f8f8,
      metalness: 0.3,
      roughness: 0.2,
      clearcoat: 0.8,
    });
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(0, 1.2, -0.1);
    cabin.castShadow = true;
    group.add(cabin);

    // Windows
    const windowMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1a2a3a,
      metalness: 0.1,
      roughness: 0,
      transparent: true,
      opacity: 0.7,
      envMapIntensity: 2,
    });

    // Front windshield
    const frontWindowGeometry = new THREE.PlaneGeometry(1.6, 0.5);
    const frontWindow = new THREE.Mesh(frontWindowGeometry, windowMaterial);
    frontWindow.position.set(0, 1.25, 1.05);
    frontWindow.rotation.x = -0.35;
    group.add(frontWindow);

    // Rear window
    const rearWindow = new THREE.Mesh(frontWindowGeometry, windowMaterial);
    rearWindow.position.set(0, 1.25, -1.25);
    rearWindow.rotation.x = 0.35;
    group.add(rearWindow);

    // Side windows
    const sideWindowGeometry = new THREE.PlaneGeometry(1.8, 0.45);
    [-0.91, 0.91].forEach((x, idx) => {
      const sideWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
      sideWindow.position.set(x, 1.2, -0.1);
      sideWindow.rotation.y = idx === 0 ? Math.PI / 2 : -Math.PI / 2;
      group.add(sideWindow);
    });

    // Wheels with realistic proportions
    const wheelGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.22, 32);
    const wheelMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1a1a1a,
      metalness: 0.2,
      roughness: 0.9,
    });
    
    const wheelPositions = [
      { x: -0.9, z: 1.3, name: 'wheel-fl' },
      { x: 0.9, z: 1.3, name: 'wheel-fr' },
      { x: -0.9, z: -1.3, name: 'wheel-rl' },
      { x: 0.9, z: -1.3, name: 'wheel-rr' },
    ];

    wheelPositions.forEach(pos => {
      const wheelGroup = new THREE.Group();
      wheelGroup.name = pos.name;
      
      // Tire
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      wheelGroup.add(wheel);

      // Alloy rim
      const rimGeometry = new THREE.CylinderGeometry(0.22, 0.22, 0.23, 16);
      const rimMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xc0c0c0,
        metalness: 0.9,
        roughness: 0.1,
      });
      const rim = new THREE.Mesh(rimGeometry, rimMaterial);
      rim.rotation.z = Math.PI / 2;
      wheelGroup.add(rim);

      // Rim spokes
      for (let i = 0; i < 5; i++) {
        const spokeGeometry = new THREE.BoxGeometry(0.04, 0.18, 0.02);
        const spoke = new THREE.Mesh(spokeGeometry, rimMaterial);
        spoke.rotation.z = Math.PI / 2;
        spoke.rotation.x = (i / 5) * Math.PI * 2;
        spoke.position.x = (pos.x > 0 ? 0.01 : -0.01);
        wheelGroup.add(spoke);
      }

      wheelGroup.position.set(pos.x, 0.35, pos.z);
      group.add(wheelGroup);
    });

    // Headlights
    const headlightGeometry = new THREE.CircleGeometry(0.12, 32);
    const headlightMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      emissive: 0xffffee,
      emissiveIntensity: 2,
    });
    
    [-0.6, 0.6].forEach(x => {
      const headlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
      headlight.position.set(x, 0.55, 2.26);
      group.add(headlight);

      // Light beam
      const beamGeometry = new THREE.ConeGeometry(0.4, 2.5, 32, 1, true);
      const beamMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffee,
        transparent: true,
        opacity: 0.08,
        side: THREE.DoubleSide,
      });
      const beam = new THREE.Mesh(beamGeometry, beamMaterial);
      beam.position.set(x, 0.55, 3.5);
      beam.rotation.x = -Math.PI / 2;
      group.add(beam);
    });

    // Taillights (red)
    const taillightGeometry = new THREE.BoxGeometry(0.4, 0.12, 0.03);
    const taillightMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xff2222,
      emissive: 0xff0000,
      emissiveIntensity: 1.5,
    });
    
    [-0.7, 0.7].forEach(x => {
      const taillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
      taillight.position.set(x, 0.55, -2.26);
      group.add(taillight);
    });

    // 031 200 200 text placeholder (using a simple panel)
    const textPanelMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1a4a8a,
      emissive: 0x1a4a8a,
      emissiveIntensity: 0.3,
    });
    const textPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 0.25),
      textPanelMaterial
    );
    textPanel.position.set(-1.02, 0.7, -0.5);
    textPanel.rotation.y = -Math.PI / 2;
    group.add(textPanel);

    const textPanelRight = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 0.25),
      textPanelMaterial
    );
    textPanelRight.position.set(1.02, 0.7, -0.5);
    textPanelRight.rotation.y = Math.PI / 2;
    group.add(textPanelRight);

    // Main taxi light
    const taxiLight = new THREE.PointLight(0xffffee, 3, 15);
    taxiLight.position.set(0, 3, 2);
    group.add(taxiLight);
    taxiLightRef.current = taxiLight;

    // Ground reflection
    const groundGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 5.5),
      new THREE.MeshBasicMaterial({
        color: 0xffffee,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide,
      })
    );
    groundGlow.rotation.x = -Math.PI / 2;
    groundGlow.position.y = 0.02;
    group.add(groundGlow);

    return group;
  }, []);

  // Create delivery scooter with branded box
  const createScooterModel = useCallback(() => {
    const group = new THREE.Group();

    // Scooter body frame
    const frameGeometry = new THREE.BoxGeometry(0.5, 0.4, 1.8);
    const frameMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1a4a8a, // Blue frame
      metalness: 0.6,
      roughness: 0.3,
    });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.y = 0.5;
    frame.castShadow = true;
    frame.receiveShadow = true;
    group.add(frame);

    // Front fairing
    const fairingGeometry = new THREE.BoxGeometry(0.55, 0.5, 0.4);
    const fairing = new THREE.Mesh(fairingGeometry, frameMaterial);
    fairing.position.set(0, 0.55, 0.8);
    fairing.castShadow = true;
    group.add(fairing);

    // Seat
    const seatGeometry = new THREE.BoxGeometry(0.4, 0.12, 0.6);
    const seatMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1a1a1a,
      metalness: 0.2,
      roughness: 0.8,
    });
    const seat = new THREE.Mesh(seatGeometry, seatMaterial);
    seat.position.set(0, 0.78, -0.2);
    group.add(seat);

    // Handlebar stem
    const stemGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8);
    const metalMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x888888,
      metalness: 0.9,
      roughness: 0.2,
    });
    const stem = new THREE.Mesh(stemGeometry, metalMaterial);
    stem.position.set(0, 0.95, 0.7);
    group.add(stem);

    // Handlebar
    const handleGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.55, 8);
    const handle = new THREE.Mesh(handleGeometry, metalMaterial);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(0, 1.15, 0.7);
    group.add(handle);

    // Front wheel
    const wheelGeometry = new THREE.TorusGeometry(0.28, 0.08, 16, 32);
    const wheelMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1a1a1a,
      metalness: 0.3,
      roughness: 0.8,
    });
    
    const frontWheelGroup = new THREE.Group();
    frontWheelGroup.name = 'wheel-front';
    const frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontWheel.rotation.y = Math.PI / 2;
    frontWheelGroup.add(frontWheel);
    
    // Front wheel hub
    const hubGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 16);
    const hubMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xc0c0c0,
      metalness: 0.9,
      roughness: 0.1,
    });
    const frontHub = new THREE.Mesh(hubGeometry, hubMaterial);
    frontHub.rotation.z = Math.PI / 2;
    frontWheelGroup.add(frontHub);
    
    frontWheelGroup.position.set(0, 0.28, 0.85);
    frontWheelGroup.castShadow = true;
    group.add(frontWheelGroup);

    // Rear wheel
    const rearWheelGroup = new THREE.Group();
    rearWheelGroup.name = 'wheel-rear';
    const rearWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    rearWheel.rotation.y = Math.PI / 2;
    rearWheelGroup.add(rearWheel);
    
    const rearHub = new THREE.Mesh(hubGeometry, hubMaterial);
    rearHub.rotation.z = Math.PI / 2;
    rearWheelGroup.add(rearHub);
    
    rearWheelGroup.position.set(0, 0.28, -0.65);
    rearWheelGroup.castShadow = true;
    group.add(rearWheelGroup);

    // DELIVERY BOX - Branded with Osječki Taxi colors
    const boxGeometry = new THREE.BoxGeometry(0.7, 0.55, 0.55);
    const boxMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, // White box
      metalness: 0.1,
      roughness: 0.4,
    });
    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    box.position.set(0, 1.0, -0.55);
    box.castShadow = true;
    group.add(box);

    // Blue stripes on delivery box
    const boxStripeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1a4a8a, // Osječki Taxi blue
      metalness: 0.2,
      roughness: 0.4,
    });
    
    // Top blue band
    const topBand = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.12, 0.56),
      boxStripeMaterial
    );
    topBand.position.set(0, 1.28, -0.55);
    group.add(topBand);

    // Bottom blue band
    const bottomBand = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.08, 0.56),
      boxStripeMaterial
    );
    bottomBand.position.set(0, 0.76, -0.55);
    group.add(bottomBand);

    // Blue checkered pattern on box sides
    const checkerMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1a4a8a,
      metalness: 0.2,
      roughness: 0.5,
    });
    
    // Left side checkers
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 3; j++) {
        if ((i + j) % 2 === 0) {
          const checker = new THREE.Mesh(
            new THREE.PlaneGeometry(0.08, 0.08),
            checkerMaterial
          );
          checker.position.set(-0.36, 0.92 + j * 0.08, -0.35 + i * 0.08);
          checker.rotation.y = -Math.PI / 2;
          group.add(checker);
          
          // Right side
          const checkerR = new THREE.Mesh(
            new THREE.PlaneGeometry(0.08, 0.08),
            checkerMaterial
          );
          checkerR.position.set(0.36, 0.92 + j * 0.08, -0.35 + i * 0.08);
          checkerR.rotation.y = Math.PI / 2;
          group.add(checkerR);
        }
      }
    }

    // Gold accent stripe on box
    const goldBoxMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xd4a43a,
      metalness: 0.5,
      roughness: 0.3,
      emissive: 0xd4a43a,
      emissiveIntensity: 0.1,
    });
    
    const goldStripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.73, 0.03, 0.57),
      goldBoxMaterial
    );
    goldStripe.position.set(0, 1.18, -0.55);
    group.add(goldStripe);

    // Scooter headlight
    const headlightGeometry = new THREE.CircleGeometry(0.08, 32);
    const headlightMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffee,
      emissive: 0xffffee,
      emissiveIntensity: 2,
    });
    const headlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    headlight.position.set(0, 0.55, 1.01);
    group.add(headlight);

    // Taillight
    const taillightMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xff2222,
      emissive: 0xff0000,
      emissiveIntensity: 1.5,
    });
    const taillight = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.06, 0.02),
      taillightMaterial
    );
    taillight.position.set(0, 0.82, -0.83);
    group.add(taillight);

    // Warm light for food
    const scooterLight = new THREE.PointLight(0xff9955, 3, 12);
    scooterLight.position.set(0, 2, 0);
    group.add(scooterLight);
    scooterLightRef.current = scooterLight;

    // Ground glow
    const warmGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2.5),
      new THREE.MeshBasicMaterial({
        color: 0xff9955,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide,
      })
    );
    warmGlow.rotation.x = -Math.PI / 2;
    warmGlow.position.y = 0.02;
    group.add(warmGlow);

    // Steam emitter position
    const steamEmitter = new THREE.Object3D();
    steamEmitter.position.set(0, 1.4, -0.55);
    steamEmitter.name = 'steamEmitter';
    group.add(steamEmitter);

    return group;
  }, []);

  // Create GROUND PORTAL that emerges from street
  const createGroundPortal = useCallback(() => {
    const group = new THREE.Group();
    group.visible = false; // Hidden initially

    // Square portal frame panels (mechanical look)
    const panelMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x00d4ff,
      emissive: 0x00d4ff,
      emissiveIntensity: 2,
      metalness: 0.9,
      roughness: 0.1,
    });

    // Four corner pillars
    const pillarGeometry = new THREE.BoxGeometry(0.15, 0, 0.15); // Start at 0 height
    const pillarPositions = [
      { x: -2, z: -2 },
      { x: 2, z: -2 },
      { x: -2, z: 2 },
      { x: 2, z: 2 },
    ];

    pillarPositions.forEach((pos, idx) => {
      const pillar = new THREE.Mesh(pillarGeometry, panelMaterial);
      pillar.position.set(pos.x, 0, pos.z);
      pillar.name = `pillar-${idx}`;
      group.add(pillar);
    });

    // Horizontal frame beams (initially at ground level)
    const beamGeometry = new THREE.BoxGeometry(4, 0.1, 0.1);
    
    // Front beam
    const frontBeam = new THREE.Mesh(beamGeometry, panelMaterial);
    frontBeam.position.set(0, 0, 2);
    frontBeam.name = 'beam-front';
    group.add(frontBeam);

    // Back beam
    const backBeam = new THREE.Mesh(beamGeometry, panelMaterial);
    backBeam.position.set(0, 0, -2);
    backBeam.name = 'beam-back';
    group.add(backBeam);

    // Side beams
    const sideBeamGeometry = new THREE.BoxGeometry(0.1, 0.1, 4);
    
    const leftBeam = new THREE.Mesh(sideBeamGeometry, panelMaterial);
    leftBeam.position.set(-2, 0, 0);
    leftBeam.name = 'beam-left';
    group.add(leftBeam);

    const rightBeam = new THREE.Mesh(sideBeamGeometry, panelMaterial);
    rightBeam.position.set(2, 0, 0);
    rightBeam.name = 'beam-right';
    group.add(rightBeam);

    // Energy field surface (liquid energy look)
    const energyFieldGeometry = new THREE.PlaneGeometry(4, 4, 64, 64);
    const energyFieldMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        intensity: { value: 0 },
        portalColor1: { value: new THREE.Color(0x00d4ff) },
        portalColor2: { value: new THREE.Color(0x0066ff) },
      },
      vertexShader: `
        uniform float time;
        uniform float intensity;
        varying vec2 vUv;
        varying float vElevation;
        
        void main() {
          vUv = uv;
          vec3 pos = position;
          
          // Liquid surface displacement
          float wave1 = sin(pos.x * 4.0 + time * 2.0) * 0.08;
          float wave2 = sin(pos.y * 3.0 - time * 1.5) * 0.08;
          float wave3 = sin((pos.x + pos.y) * 5.0 + time * 3.0) * 0.05;
          
          vElevation = (wave1 + wave2 + wave3) * intensity;
          pos.z += vElevation;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float intensity;
        uniform vec3 portalColor1;
        uniform vec3 portalColor2;
        varying vec2 vUv;
        varying float vElevation;
        
        void main() {
          vec2 center = vUv - 0.5;
          float dist = length(center);
          
          // Radial energy waves
          float wave = sin(dist * 20.0 - time * 4.0) * 0.5 + 0.5;
          float glow = 1.0 - smoothstep(0.0, 0.5, dist);
          
          // Edge glow effect
          float edge = smoothstep(0.45, 0.5, dist);
          
          vec3 color = mix(portalColor1, portalColor2, wave);
          color += vec3(0.2, 0.5, 1.0) * edge * 2.0;
          
          float alpha = glow * intensity * 0.8;
          alpha += vElevation * 2.0;
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const energyField = new THREE.Mesh(energyFieldGeometry, energyFieldMaterial);
    energyField.rotation.x = -Math.PI / 2;
    energyField.position.y = 0.05;
    energyField.name = 'energyField';
    group.add(energyField);

    // Portal light source
    const portalLight = new THREE.PointLight(0x00d4ff, 0, 20);
    portalLight.position.set(0, 1, 0);
    portalLight.name = 'portalLight';
    group.add(portalLight);

    // Ground glow ring
    const glowRingGeometry = new THREE.RingGeometry(2.2, 2.8, 64);
    const glowRingMaterial = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const glowRing = new THREE.Mesh(glowRingGeometry, glowRingMaterial);
    glowRing.rotation.x = -Math.PI / 2;
    glowRing.position.y = 0.02;
    glowRing.name = 'glowRing';
    group.add(glowRing);

    return group;
  }, []);

  // Create standing portal (original vertical portal for selection)
  const createPortal = useCallback(() => {
    const group = new THREE.Group();

    // Outer glowing ring
    const outerRingGeometry = new THREE.TorusGeometry(2.5, 0.15, 64, 128);
    const outerRingMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x00d4ff,
      emissive: 0x00d4ff,
      emissiveIntensity: 2.5,
      metalness: 0.9,
      roughness: 0,
      transparent: true,
      opacity: 0.95,
    });
    const outerRing = new THREE.Mesh(outerRingGeometry, outerRingMaterial);
    outerRing.rotation.y = Math.PI / 2;
    outerRing.name = 'outerRing';
    group.add(outerRing);

    // Inner rings
    const middleRingGeometry = new THREE.TorusGeometry(2.0, 0.1, 64, 128);
    const middleRingMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 1.8,
      transparent: true,
      opacity: 0.85,
    });
    const middleRing = new THREE.Mesh(middleRingGeometry, middleRingMaterial);
    middleRing.rotation.y = Math.PI / 2;
    middleRing.name = 'middleRing';
    group.add(middleRing);

    const innerRingGeometry = new THREE.TorusGeometry(1.5, 0.06, 64, 128);
    const innerRingMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0088ff,
      emissive: 0x0088ff,
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.9,
    });
    const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
    innerRing.rotation.y = Math.PI / 2;
    innerRing.name = 'innerRing';
    group.add(innerRing);

    // Energy field
    const portalPlaneGeometry = new THREE.CircleGeometry(2.3, 128);
    const portalPlaneMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        intensity: { value: 1.0 },
        color1: { value: new THREE.Color(0x00d4ff) },
        color2: { value: new THREE.Color(0x0044ff) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float intensity;
        uniform vec3 color1;
        uniform vec3 color2;
        varying vec2 vUv;
        
        void main() {
          vec2 center = vUv - 0.5;
          float dist = length(center);
          float angle = atan(center.y, center.x);
          
          float swirl = sin(angle * 6.0 + time * 2.0 - dist * 12.0) * 0.5 + 0.5;
          float wave = sin(dist * 20.0 - time * 3.0) * 0.5 + 0.5;
          
          float pattern = swirl * 0.5 + wave * 0.5;
          float edge = smoothstep(0.5, 0.35, dist);
          
          vec3 color = mix(color1, color2, pattern);
          float alpha = edge * (0.35 + pattern * 0.25) * intensity;
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const portalPlane = new THREE.Mesh(portalPlaneGeometry, portalPlaneMaterial);
    portalPlane.rotation.y = Math.PI / 2;
    portalPlane.name = 'portalPlane';
    group.add(portalPlane);

    // Core glow
    const coreGeometry = new THREE.SphereGeometry(0.25, 32, 32);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.9,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.name = 'core';
    group.add(core);

    // Portal light
    const portalLight = new THREE.PointLight(0x00d4ff, 6, 20);
    portalLight.position.set(0, 0, 0);
    portalLight.name = 'portalLight';
    group.add(portalLight);

    return group;
  }, []);

  // Create rain particles
  const createRainParticles = useCallback((isDay: boolean) => {
    const count = isDay ? 3000 : 6000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = Math.random() * 35;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
      velocities[i] = 0.25 + Math.random() * 0.35;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 1));

    const material = new THREE.PointsMaterial({
      color: isDay ? 0xaaccee : 0x88aacc,
      size: 0.06,
      transparent: true,
      opacity: isDay ? 0.3 : 0.4,
      blending: THREE.AdditiveBlending,
    });

    return new THREE.Points(geometry, material);
  }, []);

  // Create steam particles
  const createSteamParticles = useCallback(() => {
    const count = 100;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const lifetimes = new Float32Array(count);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.5;
      positions[i * 3 + 1] = Math.random() * 1.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
      lifetimes[i] = Math.random();
      speeds[i] = 0.008 + Math.random() * 0.015;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
    geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));

    const material = new THREE.PointsMaterial({
      color: 0xffeedd,
      size: 0.12,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });

    return new THREE.Points(geometry, material);
  }, []);

  // Create portal particles
  const createPortalParticles = useCallback(() => {
    const count = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const angles = new Float32Array(count);
    const radii = new Float32Array(count);
    const speeds = new Float32Array(count);
    const offsets = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      angles[i] = Math.random() * Math.PI * 2;
      radii[i] = 2.3 + Math.random() * 0.6;
      speeds[i] = 0.3 + Math.random() * 0.6;
      offsets[i] = Math.random() * Math.PI * 2;
      
      positions[i * 3] = 0;
      positions[i * 3 + 1] = radii[i] * Math.sin(angles[i]);
      positions[i * 3 + 2] = radii[i] * Math.cos(angles[i]);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('angle', new THREE.BufferAttribute(angles, 1));
    geometry.setAttribute('radius', new THREE.BufferAttribute(radii, 1));
    geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
    geometry.setAttribute('offset', new THREE.BufferAttribute(offsets, 1));

    const material = new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 0.1,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    return new THREE.Points(geometry, material);
  }, []);

  // Create realistic ground with reflections
  const createGround = useCallback((isDay: boolean) => {
    const geometry = new THREE.PlaneGeometry(100, 100, 50, 50);
    const material = new THREE.MeshPhysicalMaterial({
      color: isDay ? 0x2a2a3a : 0x0a0a12,
      metalness: isDay ? 0.5 : 0.8,
      roughness: isDay ? 0.4 : 0.2,
      envMapIntensity: isDay ? 0.8 : 1.2,
    });
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    return ground;
  }, []);

  // Create asphalt road
  const createRoad = useCallback(() => {
    const group = new THREE.Group();
    
    // Main road surface
    const roadGeometry = new THREE.PlaneGeometry(12, 50);
    const roadMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1a1a22,
      metalness: 0.6,
      roughness: 0.35,
    });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.01, 0);
    road.receiveShadow = true;
    group.add(road);

    // Lane stripes
    const stripeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.3,
    });

    for (let i = -8; i <= 8; i++) {
      const stripe = new THREE.Mesh(
        new THREE.PlaneGeometry(0.15, 2.2),
        stripeMaterial
      );
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(0, 0.02, i * 3);
      group.add(stripe);
    }

    // Edge lines
    [-5.8, 5.8].forEach(x => {
      const edgeLine = new THREE.Mesh(
        new THREE.PlaneGeometry(0.1, 50),
        stripeMaterial
      );
      edgeLine.rotation.x = -Math.PI / 2;
      edgeLine.position.set(x, 0.02, 0);
      group.add(edgeLine);
    });

    return group;
  }, []);

  // Create Osijek-style buildings
  const createBuildings = useCallback((side: 'left' | 'right', isDay: boolean) => {
    const group = new THREE.Group();
    const xBase = side === 'left' ? -18 : 18;
    
    // Colors inspired by Osijek architecture
    const buildingColors = isDay 
      ? [0x8a8a8a, 0x9a9a9a, 0x7a7a7a, 0xa0a0a0]
      : [0x3a3a4a, 0x4a4a5a, 0x2a2a3a, 0x5a5a6a];
    const windowColor = side === 'left' ? 0x00d4ff : 0xff9955;
    const windowEmissive = isDay ? 0.1 : 0.4;

    const buildingCount = 10;
    
    for (let i = 0; i < buildingCount; i++) {
      const height = 6 + Math.random() * 18;
      const width = 3 + Math.random() * 4;
      const depth = 3 + Math.random() * 3;
      
      const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
      const buildingMaterial = new THREE.MeshPhysicalMaterial({
        color: buildingColors[Math.floor(Math.random() * buildingColors.length)],
        metalness: 0.4,
        roughness: 0.5,
      });
      const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
      
      const xOffset = (Math.random() - 0.5) * 8;
      const zPos = -20 + i * 4.5 + (Math.random() - 0.5) * 2;
      
      building.position.set(xBase + xOffset, height / 2, zPos);
      building.castShadow = true;
      building.receiveShadow = true;
      group.add(building);

      // Windows
      const windowRows = Math.floor(height / 2.2);
      for (let j = 0; j < windowRows; j++) {
        if (Math.random() > 0.35) {
          const windowGeometry = new THREE.PlaneGeometry(0.5, 0.9);
          const windowMaterial = new THREE.MeshPhysicalMaterial({
            color: windowColor,
            emissive: windowColor,
            emissiveIntensity: windowEmissive + Math.random() * 0.4,
            transparent: true,
            opacity: 0.85,
          });
          const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
          const windowX = building.position.x + (side === 'left' ? width / 2 + 0.01 : -width / 2 - 0.01);
          windowMesh.position.set(
            windowX,
            1.5 + j * 2.2,
            building.position.z + (Math.random() - 0.5) * (depth * 0.5)
          );
          windowMesh.rotation.y = side === 'left' ? 0 : Math.PI;
          group.add(windowMesh);
        }
      }
    }

    return group;
  }, []);

  // Main scene setup
  useEffect(() => {
    if (!containerRef.current) return;

    const isDay = timeOfDay === 'day';
    const config = lightingConfig[timeOfDay];

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(config.fogColor, config.fogDensity);
    sceneRef.current = scene;

    // Load Osijek skybox as background
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(osijekSkybox, (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.background = texture;
      scene.environment = texture;
    });

    // Camera
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 6, 25);
    camera.lookAt(0, 2, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isDay ? 1.2 : 0.9;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Post-processing
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      config.bloomStrength,
      0.35,
      0.8
    );
    composer.addPass(bloomPass);
    composerRef.current = composer;
    bloomPassRef.current = bloomPass;

    // Lighting
    const ambientLight = new THREE.AmbientLight(config.ambientColor, config.ambientIntensity);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const directionalLight = new THREE.DirectionalLight(config.directionalColor, config.directionalIntensity);
    directionalLight.position.set(20, 30, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 80;
    directionalLight.shadow.camera.left = -35;
    directionalLight.shadow.camera.right = 35;
    directionalLight.shadow.camera.top = 35;
    directionalLight.shadow.camera.bottom = -35;
    scene.add(directionalLight);
    directionalLightRef.current = directionalLight;

    // Build scene
    const ground = createGround(isDay);
    scene.add(ground);

    const road = createRoad();
    scene.add(road);

    const leftBuildings = createBuildings('left', isDay);
    scene.add(leftBuildings);

    const rightBuildings = createBuildings('right', isDay);
    scene.add(rightBuildings);

    // Taxi - Create placeholder group and load GLTF model
    const taxiPlaceholder = new THREE.Group();
    taxiPlaceholder.position.set(-8, 0, 0);
    taxiPlaceholder.rotation.y = Math.PI / 6; // Slight angle
    scene.add(taxiPlaceholder);
    taxiGroupRef.current = taxiPlaceholder;

    // Initialize GLTF loader with DRACO compression support
    const gltfLoader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    gltfLoader.setDRACOLoader(dracoLoader);
    gltfLoaderRef.current = gltfLoader;

    // Load taxi GLTF model
    gltfLoader.load(
      TAXI_MODEL_PATH,
      (gltf) => {
        console.log('Taxi GLTF model loaded successfully');
        const taxiModel = gltf.scene;
        
        // Apply Osječki Taxi branding materials
        taxiModel.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Apply white body color with Osječki Taxi branding
            if (child.material) {
              const originalMaterial = child.material as THREE.MeshStandardMaterial;
              child.material = new THREE.MeshPhysicalMaterial({
                color: 0xffffff, // White body
                metalness: 0.4,
                roughness: 0.2,
                clearcoat: 1,
                clearcoatRoughness: 0.1,
                envMapIntensity: 1.5,
              });
            }
          }
        });
        
        // Scale and position the model appropriately
        taxiModel.scale.setScalar(2.0); // Adjust based on model size
        taxiModel.position.y = 0.35; // Ground the wheels
        
        // Clear placeholder and add loaded model
        while (taxiPlaceholder.children.length > 0) {
          taxiPlaceholder.remove(taxiPlaceholder.children[0]);
        }
        taxiPlaceholder.add(taxiModel);
        
        // Add taxi light
        const taxiLight = new THREE.PointLight(0xffffee, 3, 15);
        taxiLight.position.set(0, 3, 2);
        taxiPlaceholder.add(taxiLight);
        taxiLightRef.current = taxiLight;

        // Add branded decals (blue stripes, gold accents)
        addTaxiBranding(taxiPlaceholder);
        
        taxiModelLoadedRef.current = true;
      },
      (progress) => {
        console.log('Loading taxi model:', (progress.loaded / progress.total * 100).toFixed(1) + '%');
      },
      (error) => {
        console.warn('Failed to load taxi GLTF model, using procedural model:', error);
        // Fallback to procedural model
        const proceduralTaxi = createTaxiModel();
        proceduralTaxi.scale.setScalar(1.2);
        while (taxiPlaceholder.children.length > 0) {
          taxiPlaceholder.remove(taxiPlaceholder.children[0]);
        }
        taxiPlaceholder.add(proceduralTaxi);
      }
    );

    // Scooter
    const scooter = createScooterModel();
    scooter.position.set(8, 0, 0);
    scooter.rotation.y = -Math.PI / 6;
    scooter.scale.setScalar(1.4);
    scene.add(scooter);
    scooterGroupRef.current = scooter;

    // Standing portal (center)
    const portal = createPortal();
    portal.position.set(0, 3, 0);
    scene.add(portal);
    portalRef.current = portal;

    // Ground portal (for warp animation)
    const groundPortal = createGroundPortal();
    groundPortal.position.set(0, 0, 0);
    scene.add(groundPortal);
    groundPortalRef.current = groundPortal;

    // Rain
    const rain = createRainParticles(isDay);
    scene.add(rain);
    rainParticlesRef.current = rain;

    // Steam at scooter
    const steam = createSteamParticles();
    steam.position.set(8, 1.2, -0.4);
    scene.add(steam);
    steamParticlesRef.current = steam;

    // Portal particles
    const portalParticles = createPortalParticles();
    portalParticles.position.copy(portal.position);
    scene.add(portalParticles);
    portalParticlesRef.current = portalParticles;

    // Start with screen black
    renderer.domElement.style.opacity = '0';

    // CINEMATIC INTRO ANIMATION
    const introTimeline = gsap.timeline({
      onComplete: () => {
        setIntroComplete(true);
        setSceneState('idle');
        onIntroComplete();
      },
    });

    introTimeline
      // Fade in from black
      .to(renderer.domElement, { 
        opacity: 1, 
        duration: 1.5, 
        ease: 'power2.out' 
      })
      // Start at taxi close-up
      .fromTo(
        camera.position,
        { x: -14, y: 2, z: 8 },
        { x: -10, y: 2.5, z: 10, duration: 2, ease: 'power2.inOut' },
        0.4
      )
      // Taxi lights brighten
      .to(taxiLightRef.current!, { 
        intensity: 8, 
        duration: 1 
      }, 0.6)
      .to(taxiLightRef.current!, { 
        intensity: 3, 
        duration: 0.5 
      }, 1.6)
      // Pan across to scooter
      .to(camera.position, { 
        x: 10, 
        y: 2.5, 
        z: 10, 
        duration: 2.5, 
        ease: 'power2.inOut' 
      })
      // Scooter lights
      .to(scooterLightRef.current!, { 
        intensity: 8, 
        duration: 1 
      }, 2.5)
      .to(scooterLightRef.current!, { 
        intensity: 3, 
        duration: 0.5 
      }, 3.5)
      // Pull back to center
      .to(camera.position, { 
        x: 0, 
        y: 5, 
        z: 20, 
        duration: 1.8, 
        ease: 'power2.out' 
      })
      // Portal pulse
      .to(portal.scale, { 
        x: 1.1, 
        y: 1.1, 
        z: 1.1, 
        duration: 0.25, 
        ease: 'power2.out' 
      }, '-=0.4')
      .to(portal.scale, { 
        x: 1, 
        y: 1, 
        z: 1, 
        duration: 0.25, 
        ease: 'power2.in' 
      });

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      timeRef.current += 0.016;
      const time = timeRef.current;

      // Portal shader update
      const portalPlane = portal.children.find(c => c.name === 'portalPlane');
      if (portalPlane && (portalPlane as THREE.Mesh).material) {
        const mat = (portalPlane as THREE.Mesh).material as THREE.ShaderMaterial;
        if (mat.uniforms) {
          mat.uniforms.time.value = time;
        }
      }

      // Ground portal shader update
      if (groundPortal.visible) {
        const energyField = groundPortal.children.find(c => c.name === 'energyField');
        if (energyField && (energyField as THREE.Mesh).material) {
          const mat = (energyField as THREE.Mesh).material as THREE.ShaderMaterial;
          if (mat.uniforms) {
            mat.uniforms.time.value = time;
          }
        }
      }

      // Portal rotation
      portal.rotation.y += 0.006;
      portal.rotation.z = Math.sin(time * 0.4) * 0.06;

      // Ring counter-rotation
      const outerRing = portal.children.find(c => c.name === 'outerRing');
      const middleRing = portal.children.find(c => c.name === 'middleRing');
      const innerRing = portal.children.find(c => c.name === 'innerRing');
      if (outerRing) outerRing.rotation.x += 0.002;
      if (middleRing) middleRing.rotation.x -= 0.004;
      if (innerRing) innerRing.rotation.x += 0.006;

      // Portal light pulse
      const portalLight = portal.children.find(c => c.name === 'portalLight') as THREE.PointLight;
      if (portalLight) {
        portalLight.intensity = 6 + Math.sin(time * 2) * 1.5;
      }

      // Core pulse
      const core = portal.children.find(c => c.name === 'core') as THREE.Mesh;
      if (core) {
        const scale = 1 + Math.sin(time * 2.5) * 0.15;
        core.scale.setScalar(scale);
      }

      // Taxi idle animation
      const taxiGroup = taxiGroupRef.current;
      if (taxiGroup) {
        taxiGroup.position.y = Math.sin(time * 1.2) * 0.06;
        taxiGroup.rotation.y = Math.PI / 6 + Math.sin(time * 0.35) * 0.02;
        
        taxiGroup.traverse((child) => {
          if (child.name && child.name.startsWith('wheel')) {
            child.rotation.x += 0.015;
          }
        });
      }

      // Scooter idle animation
      if (scooter) {
        scooter.position.y = Math.sin(time * 1.2 + 1) * 0.05;
        scooter.rotation.y = -Math.PI / 6 + Math.sin(time * 0.35 + 1) * 0.02;
        
        scooter.children.forEach(child => {
          if (child.name && child.name.startsWith('wheel-')) {
            child.rotation.x += 0.012;
          }
        });
      }

      // Rain
      if (rain) {
        const positions = rain.geometry.attributes.position.array as Float32Array;
        const velocities = rain.geometry.attributes.velocity.array as Float32Array;
        
        for (let i = 0; i < positions.length / 3; i++) {
          positions[i * 3 + 1] -= velocities[i];
          positions[i * 3] += Math.sin(time + i) * 0.0008;
          
          if (positions[i * 3 + 1] < 0) {
            positions[i * 3 + 1] = 35;
            positions[i * 3] = (Math.random() - 0.5) * 60;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
          }
        }
        rain.geometry.attributes.position.needsUpdate = true;
      }

      // Steam
      if (steamParticlesRef.current) {
        const positions = steamParticlesRef.current.geometry.attributes.position.array as Float32Array;
        const lifetimes = steamParticlesRef.current.geometry.attributes.lifetime.array as Float32Array;
        const speeds = steamParticlesRef.current.geometry.attributes.speed.array as Float32Array;

        for (let i = 0; i < positions.length / 3; i++) {
          lifetimes[i] += 0.007;
          
          if (lifetimes[i] > 1) {
            lifetimes[i] = 0;
            positions[i * 3] = (Math.random() - 0.5) * 0.5;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
          }
          
          positions[i * 3 + 1] += speeds[i];
          positions[i * 3] += Math.sin(time * 1.5 + i) * 0.002;
          positions[i * 3 + 2] += Math.cos(time * 1.5 + i) * 0.002;
        }
        steamParticlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // Portal particles
      if (portalParticlesRef.current) {
        const positions = portalParticlesRef.current.geometry.attributes.position.array as Float32Array;
        const angles = portalParticlesRef.current.geometry.attributes.angle.array as Float32Array;
        const radii = portalParticlesRef.current.geometry.attributes.radius.array as Float32Array;
        const speeds = portalParticlesRef.current.geometry.attributes.speed.array as Float32Array;
        const offsets = portalParticlesRef.current.geometry.attributes.offset.array as Float32Array;

        for (let i = 0; i < positions.length / 3; i++) {
          angles[i] += speeds[i] * 0.012;
          const wobble = Math.sin(time + offsets[i]) * 0.25;
          positions[i * 3] = wobble;
          positions[i * 3 + 1] = radii[i] * Math.sin(angles[i]);
          positions[i * 3 + 2] = radii[i] * Math.cos(angles[i]);
        }
        portalParticlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      composer.render();
    };

    animate();

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      introTimeline.kill();
      if (containerRef.current && renderer.domElement.parentElement === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [
    timeOfDay,
    createTaxiModel,
    createScooterModel,
    createPortal,
    createGroundPortal,
    createRainParticles,
    createSteamParticles,
    createPortalParticles,
    createGround,
    createRoad,
    createBuildings,
    onIntroComplete,
  ]);

  // Hover camera movement
  useEffect(() => {
    if (!cameraRef.current || !introComplete || isWarpAnimating) return;

    const camera = cameraRef.current;

    let targetPos = { x: 0, y: 5, z: 20 };
    let targetLookAt = { x: 0, y: 2, z: 0 };

    if (sceneState === 'hover-taxi') {
      targetPos = { x: -5, y: 3.5, z: 13 };
      targetLookAt = { x: -8, y: 1, z: 0 };
      
      if (taxiLightRef.current) {
        gsap.to(taxiLightRef.current, { intensity: 8, duration: 0.4 });
      }
      if (scooterLightRef.current) {
        gsap.to(scooterLightRef.current, { intensity: 2, duration: 0.4 });
      }
    } else if (sceneState === 'hover-food') {
      targetPos = { x: 5, y: 3.5, z: 13 };
      targetLookAt = { x: 8, y: 1, z: 0 };
      
      if (scooterLightRef.current) {
        gsap.to(scooterLightRef.current, { intensity: 8, duration: 0.4 });
      }
      if (taxiLightRef.current) {
        gsap.to(taxiLightRef.current, { intensity: 2, duration: 0.4 });
      }
    } else if (sceneState === 'idle') {
      if (taxiLightRef.current) {
        gsap.to(taxiLightRef.current, { intensity: 3, duration: 0.4 });
      }
      if (scooterLightRef.current) {
        gsap.to(scooterLightRef.current, { intensity: 3, duration: 0.4 });
      }
    }

    gsap.to(camera.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 0.7,
      ease: 'power2.out',
      onUpdate: () => {
        camera.lookAt(targetLookAt.x, targetLookAt.y, targetLookAt.z);
      },
    });
  }, [sceneState, introComplete, isWarpAnimating]);

  // PORTAL WARP ANIMATION - With ground portal and vehicle driving in
  const triggerWarpAnimation = useCallback((selectedWorld: 'taxi' | 'food') => {
    if (!portalRef.current || !groundPortalRef.current || !cameraRef.current || 
        !bloomPassRef.current || isWarpAnimating) return;

    const vehicle = selectedWorld === 'taxi' ? taxiGroupRef.current : scooterGroupRef.current;
    if (!vehicle) return;

    setIsWarpAnimating(true);
    setSceneState('warp');
    
    // Play sound effects
    playSound('portalOpen');

    const portal = portalRef.current;
    const groundPortal = groundPortalRef.current;
    const camera = cameraRef.current;
    const bloom = bloomPassRef.current;

    const portalPlane = portal.children.find(c => c.name === 'portalPlane');
    const portalLight = portal.children.find(c => c.name === 'portalLight') as THREE.PointLight;
    
    // Ground portal components
    const energyField = groundPortal.children.find(c => c.name === 'energyField');
    const groundPortalLight = groundPortal.children.find(c => c.name === 'portalLight') as THREE.PointLight;
    const glowRing = groundPortal.children.find(c => c.name === 'glowRing');

    // Position ground portal under vehicle
    const vehiclePos = selectedWorld === 'taxi' ? { x: -8, z: 0 } : { x: 8, z: 0 };
    groundPortal.position.set(vehiclePos.x, 0, vehiclePos.z);
    groundPortal.visible = true;

    const warpTimeline = gsap.timeline({
      onComplete: () => {
        // Navigate to the appropriate page
        navigate(selectedWorld === 'taxi' ? '/taxi' : '/food');
      },
    });

    // Get energy field material for animation
    const energyFieldMat = energyField ? ((energyField as THREE.Mesh).material as THREE.ShaderMaterial) : null;
    const glowRingMat = glowRing ? ((glowRing as THREE.Mesh).material as THREE.MeshBasicMaterial) : null;

    // PHASE 1: Ground portal opens with "whoomph"
    warpTimeline
      // Ground starts to glow
      .to(glowRingMat || {}, {
        opacity: 0.6,
        duration: 0.3,
      }, 0)
      // Energy field intensity rises
      .to(energyFieldMat?.uniforms?.intensity || {}, {
        value: 1,
        duration: 0.6,
        ease: 'power2.out',
      }, 0.1)
      // Ground portal light
      .to(groundPortalLight || {}, {
        intensity: 15,
        duration: 0.5,
      }, 0.2);

    // Play warp sound
    warpTimeline.call(() => {
      playSound('warp');
    }, [], 0.5);

    // PHASE 2: Camera moves to bird's eye view
    warpTimeline.to(camera.position, {
      x: vehiclePos.x,
      y: 18,
      z: vehiclePos.z + 5,
      duration: 0.8,
      ease: 'power2.inOut',
      onUpdate: () => {
        camera.lookAt(vehiclePos.x, 0, vehiclePos.z);
      },
    }, 0.3);

    // PHASE 3: Vehicle drives into portal
    warpTimeline
      // Vehicle moves to portal center
      .to(vehicle.position, {
        x: vehiclePos.x,
        z: vehiclePos.z,
        duration: 0.6,
        ease: 'power2.in',
      }, 0.8)
      // Vehicle sinks into portal
      .to(vehicle.position, {
        y: -3,
        duration: 1.0,
        ease: 'power2.in',
      }, 1.2);

    // PHASE 4: Bloom intensifies
    warpTimeline.to(bloom, {
      strength: 3.5,
      duration: 0.6,
    }, 1.0);

    // Main portal effects
    warpTimeline
      .to(portal.scale, {
        x: 4,
        y: 4,
        z: 4,
        duration: 0.7,
        ease: 'power2.in',
      }, 0.5)
      .to(portalLight, {
        intensity: 25,
        duration: 0.5,
      }, 0.5);

    // Shader intensity
    if (portalPlane && (portalPlane as THREE.Mesh).material) {
      const mat = (portalPlane as THREE.Mesh).material as THREE.ShaderMaterial;
      if (mat.uniforms) {
        warpTimeline.to(mat.uniforms.intensity, {
          value: 2.5,
          duration: 0.5,
        }, 0.5);
      }
    }

    // Flash white at climax and navigate
    if (containerRef.current) {
      const flash = document.createElement('div');
      flash.style.cssText = `
        position: fixed;
        inset: 0;
        background: white;
        opacity: 0;
        pointer-events: none;
        z-index: 100;
      `;
      containerRef.current.appendChild(flash);
      
      warpTimeline.to(flash, {
        opacity: 1,
        duration: 0.3,
        delay: 1.8,
      }, 0);
    }
  }, [isWarpAnimating, navigate, playSound]);

  // Event handlers
  const handleMouseEnter = useCallback((world: 'taxi' | 'food') => {
    if (!introComplete || isWarpAnimating) return;
    setSceneState(world === 'taxi' ? 'hover-taxi' : 'hover-food');
    onWorldSelect(world);
  }, [introComplete, isWarpAnimating, onWorldSelect]);

  const handleMouseLeave = useCallback(() => {
    if (!introComplete || isWarpAnimating) return;
    setSceneState('idle');
    onWorldSelect(null);
  }, [introComplete, isWarpAnimating, onWorldSelect]);

  const handleClick = useCallback((world: 'taxi' | 'food') => {
    if (!introComplete || isWarpAnimating) return;
    triggerWarpAnimation(world);
  }, [introComplete, isWarpAnimating, triggerWarpAnimation]);

  return (
    <div className="fixed inset-0 overflow-hidden">
      <div ref={containerRef} className="absolute inset-0" />
      
      {/* Left hover/click zone - TAXI */}
      <div
        className="absolute left-0 top-0 w-1/2 h-full cursor-pointer z-10"
        onMouseEnter={() => handleMouseEnter('taxi')}
        onMouseLeave={handleMouseLeave}
        onClick={() => handleClick('taxi')}
        onTouchEnd={() => handleClick('taxi')}
      />
      
      {/* Right hover/click zone - FOOD */}
      <div
        className="absolute right-0 top-0 w-1/2 h-full cursor-pointer z-10"
        onMouseEnter={() => handleMouseEnter('food')}
        onMouseLeave={handleMouseLeave}
        onClick={() => handleClick('food')}
        onTouchEnd={() => handleClick('food')}
      />
    </div>
  );
};

export default CinematicScene;
