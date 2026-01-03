import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import gsap from 'gsap';

interface CinematicSceneProps {
  onWorldSelect: (world: 'taxi' | 'food' | null) => void;
  onIntroComplete: () => void;
}

type SceneState = 'intro' | 'idle' | 'hover-taxi' | 'hover-food' | 'warp';

const CinematicScene: React.FC<CinematicSceneProps> = ({ onWorldSelect, onIntroComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const bloomPassRef = useRef<UnrealBloomPass | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const taxiGroupRef = useRef<THREE.Group | null>(null);
  const foodGroupRef = useRef<THREE.Group | null>(null);
  const portalRef = useRef<THREE.Group | null>(null);
  const rainParticlesRef = useRef<THREE.Points | null>(null);
  const steamParticlesRef = useRef<THREE.Points | null>(null);
  const portalParticlesRef = useRef<THREE.Points | null>(null);
  const taxiLightRef = useRef<THREE.PointLight | null>(null);
  const foodLightRef = useRef<THREE.PointLight | null>(null);
  const timeRef = useRef(0);
  
  const [sceneState, setSceneState] = useState<SceneState>('intro');
  const [isWarpAnimating, setIsWarpAnimating] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);

  // Create taxi model with enhanced details
  const createTaxiModel = useCallback(() => {
    const group = new THREE.Group();
    
    // Car body - main chassis
    const bodyGeometry = new THREE.BoxGeometry(2.6, 0.9, 5);
    const bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0a1428,
      metalness: 0.95,
      roughness: 0.05,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      envMapIntensity: 2,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.65;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Hood slope
    const hoodGeometry = new THREE.BoxGeometry(2.4, 0.3, 1.5);
    const hood = new THREE.Mesh(hoodGeometry, bodyMaterial);
    hood.position.set(0, 1.1, 1.8);
    hood.rotation.x = -0.15;
    hood.castShadow = true;
    group.add(hood);

    // Trunk
    const trunkGeometry = new THREE.BoxGeometry(2.4, 0.3, 1.2);
    const trunk = new THREE.Mesh(trunkGeometry, bodyMaterial);
    trunk.position.set(0, 1.0, -2.0);
    trunk.rotation.x = 0.1;
    trunk.castShadow = true;
    group.add(trunk);

    // Cabin/Roof
    const cabinGeometry = new THREE.BoxGeometry(2.3, 0.75, 2.8);
    const cabinMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x050a14,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.95,
      clearcoat: 0.8,
    });
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(0, 1.45, -0.2);
    cabin.castShadow = true;
    group.add(cabin);

    // Windows (glass effect)
    const windowMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x001830,
      metalness: 0.1,
      roughness: 0,
      transparent: true,
      opacity: 0.4,
      envMapIntensity: 3,
    });

    // Front windshield
    const frontWindowGeometry = new THREE.PlaneGeometry(2.1, 0.7);
    const frontWindow = new THREE.Mesh(frontWindowGeometry, windowMaterial);
    frontWindow.position.set(0, 1.5, 1.25);
    frontWindow.rotation.x = -0.4;
    group.add(frontWindow);

    // Rear window
    const rearWindow = new THREE.Mesh(frontWindowGeometry, windowMaterial);
    rearWindow.position.set(0, 1.5, -1.65);
    rearWindow.rotation.x = 0.4;
    group.add(rearWindow);

    // Wheels with spinning capability
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 32);
    const wheelMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x111111,
      metalness: 0.3,
      roughness: 0.9,
    });
    
    const wheelPositions = [
      { x: -1.2, z: 1.6, name: 'wheel-fl' },
      { x: 1.2, z: 1.6, name: 'wheel-fr' },
      { x: -1.2, z: -1.6, name: 'wheel-rl' },
      { x: 1.2, z: -1.6, name: 'wheel-rr' },
    ];

    wheelPositions.forEach(pos => {
      const wheelGroup = new THREE.Group();
      wheelGroup.name = pos.name;
      
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      wheelGroup.add(wheel);

      // Chrome rim
      const rimGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.32, 16);
      const rimMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x00d4ff,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.5,
        metalness: 1,
        roughness: 0,
      });
      const rim = new THREE.Mesh(rimGeometry, rimMaterial);
      rim.rotation.z = Math.PI / 2;
      wheelGroup.add(rim);

      // Rim spokes
      for (let i = 0; i < 5; i++) {
        const spokeGeometry = new THREE.BoxGeometry(0.05, 0.35, 0.02);
        const spoke = new THREE.Mesh(spokeGeometry, rimMaterial);
        spoke.rotation.z = Math.PI / 2;
        spoke.rotation.x = (i / 5) * Math.PI * 2;
        spoke.position.x = (pos.x > 0 ? 0.01 : -0.01);
        wheelGroup.add(spoke);
      }

      wheelGroup.position.set(pos.x, 0.4, pos.z);
      group.add(wheelGroup);
    });

    // Headlights with intense glow
    const headlightGeometry = new THREE.CircleGeometry(0.18, 32);
    const headlightMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x00d4ff,
      emissive: 0x00d4ff,
      emissiveIntensity: 3,
      transparent: true,
      opacity: 0.95,
    });
    
    [-0.8, 0.8].forEach(x => {
      const headlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
      headlight.position.set(x, 0.65, 2.51);
      group.add(headlight);

      // Headlight glow cone
      const coneGeometry = new THREE.ConeGeometry(0.5, 3, 32, 1, true);
      const coneMaterial = new THREE.MeshBasicMaterial({
        color: 0x00d4ff,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
      });
      const cone = new THREE.Mesh(coneGeometry, coneMaterial);
      cone.position.set(x, 0.65, 4);
      cone.rotation.x = -Math.PI / 2;
      group.add(cone);
    });

    // Taillights
    const taillightGeometry = new THREE.BoxGeometry(0.5, 0.18, 0.05);
    const taillightMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x00d4ff,
      emissive: 0x00d4ff,
      emissiveIntensity: 2,
    });
    
    [-0.9, 0.9].forEach(x => {
      const taillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
      taillight.position.set(x, 0.65, -2.51);
      group.add(taillight);
    });

    // LED underglow strips
    const underglowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.6,
    });

    // Side strips
    [-1.35, 1.35].forEach(x => {
      const sideStrip = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.02, 4.5),
        underglowMaterial
      );
      sideStrip.position.set(x, 0.2, 0);
      group.add(sideStrip);
    });

    // Front/back strips
    [-2.4, 2.4].forEach(z => {
      const crossStrip = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.02, 0.05),
        underglowMaterial
      );
      crossStrip.position.set(0, 0.2, z);
      group.add(crossStrip);
    });

    // Ground glow plane
    const glowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 5.5),
      new THREE.MeshBasicMaterial({
        color: 0x00d4ff,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
      })
    );
    glowPlane.rotation.x = -Math.PI / 2;
    glowPlane.position.y = 0.02;
    group.add(glowPlane);

    // Taxi sign on roof
    const signGeometry = new THREE.BoxGeometry(1, 0.3, 0.4);
    const signMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x00d4ff,
      emissive: 0x00d4ff,
      emissiveIntensity: 2.5,
    });
    const sign = new THREE.Mesh(signGeometry, signMaterial);
    sign.position.set(0, 1.95, -0.2);
    group.add(sign);

    // Main taxi light
    const taxiLight = new THREE.PointLight(0x00d4ff, 5, 20);
    taxiLight.position.set(0, 3, 0);
    group.add(taxiLight);
    taxiLightRef.current = taxiLight;

    return group;
  }, []);

  // Create food delivery model
  const createFoodDeliveryModel = useCallback(() => {
    const group = new THREE.Group();

    // Scooter body frame
    const frameGeometry = new THREE.BoxGeometry(0.6, 0.5, 2.2);
    const frameMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x2d1a0a,
      metalness: 0.8,
      roughness: 0.2,
    });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.y = 0.5;
    frame.castShadow = true;
    frame.receiveShadow = true;
    group.add(frame);

    // Seat
    const seatGeometry = new THREE.BoxGeometry(0.5, 0.15, 0.8);
    const seatMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1a0a05,
      metalness: 0.3,
      roughness: 0.8,
    });
    const seat = new THREE.Mesh(seatGeometry, seatMaterial);
    seat.position.set(0, 0.85, -0.3);
    group.add(seat);

    // Handlebar stem
    const stemGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 8);
    const metalMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x444444,
      metalness: 0.95,
      roughness: 0.1,
    });
    const stem = new THREE.Mesh(stemGeometry, metalMaterial);
    stem.position.set(0, 1.0, 0.8);
    group.add(stem);

    // Handlebar
    const handleGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.7, 8);
    const handle = new THREE.Mesh(handleGeometry, metalMaterial);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(0, 1.3, 0.8);
    group.add(handle);

    // Front wheel with spinning capability
    const wheelGeometry = new THREE.TorusGeometry(0.35, 0.1, 16, 32);
    const wheelMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x111111,
      metalness: 0.4,
      roughness: 0.8,
    });
    
    const frontWheelGroup = new THREE.Group();
    frontWheelGroup.name = 'wheel-front';
    const frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontWheel.rotation.y = Math.PI / 2;
    frontWheelGroup.add(frontWheel);
    frontWheelGroup.position.set(0, 0.35, 1.0);
    frontWheelGroup.castShadow = true;
    group.add(frontWheelGroup);

    // Rear wheel
    const rearWheelGroup = new THREE.Group();
    rearWheelGroup.name = 'wheel-rear';
    const rearWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    rearWheel.rotation.y = Math.PI / 2;
    rearWheelGroup.add(rearWheel);
    rearWheelGroup.position.set(0, 0.35, -0.8);
    rearWheelGroup.castShadow = true;
    group.add(rearWheelGroup);

    // Delivery box with warm glow
    const boxGeometry = new THREE.BoxGeometry(1.1, 0.85, 0.85);
    const boxMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xff6b35,
      emissive: 0xff6b35,
      emissiveIntensity: 0.5,
      metalness: 0.2,
      roughness: 0.5,
    });
    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    box.position.set(0, 1.3, -0.6);
    box.castShadow = true;
    group.add(box);

    // Box lid with steam vent
    const lidGeometry = new THREE.BoxGeometry(1.15, 0.1, 0.9);
    const lidMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xff8a55,
      emissive: 0xff6b35,
      emissiveIntensity: 0.3,
    });
    const lid = new THREE.Mesh(lidGeometry, lidMaterial);
    lid.position.set(0, 1.78, -0.6);
    group.add(lid);

    // Box decorative stripes
    const stripeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffaa00,
      emissive: 0xffaa00,
      emissiveIntensity: 0.8,
    });
    
    [-0.3, 0.3].forEach(z => {
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(1.12, 0.05, 0.05),
        stripeMaterial
      );
      stripe.position.set(0, 1.5, -0.6 + z);
      group.add(stripe);
    });

    // Warm ambient light
    const foodLight = new THREE.PointLight(0xff6b35, 5, 20);
    foodLight.position.set(0, 3, 0);
    group.add(foodLight);
    foodLightRef.current = foodLight;

    // Ground glow for food
    const warmGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.5, 3),
      new THREE.MeshBasicMaterial({
        color: 0xff6b35,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
      })
    );
    warmGlow.rotation.x = -Math.PI / 2;
    warmGlow.position.y = 0.02;
    group.add(warmGlow);

    // Steam emitter marker
    const steamEmitter = new THREE.Object3D();
    steamEmitter.position.set(0, 1.9, -0.6);
    steamEmitter.name = 'steamEmitter';
    group.add(steamEmitter);

    return group;
  }, []);

  // Create energy portal with shader
  const createPortal = useCallback(() => {
    const group = new THREE.Group();

    // Outer glowing ring
    const outerRingGeometry = new THREE.TorusGeometry(3, 0.2, 64, 128);
    const outerRingMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x00d4ff,
      emissive: 0x00d4ff,
      emissiveIntensity: 3,
      metalness: 0.95,
      roughness: 0,
      transparent: true,
      opacity: 0.95,
    });
    const outerRing = new THREE.Mesh(outerRingGeometry, outerRingMaterial);
    outerRing.rotation.y = Math.PI / 2;
    outerRing.name = 'outerRing';
    group.add(outerRing);

    // Middle ring
    const middleRingGeometry = new THREE.TorusGeometry(2.5, 0.12, 64, 128);
    const middleRingMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.8,
    });
    const middleRing = new THREE.Mesh(middleRingGeometry, middleRingMaterial);
    middleRing.rotation.y = Math.PI / 2;
    middleRing.name = 'middleRing';
    group.add(middleRing);

    // Inner ring
    const innerRingGeometry = new THREE.TorusGeometry(2, 0.08, 64, 128);
    const innerRingMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0088ff,
      emissive: 0x0088ff,
      emissiveIntensity: 2.5,
      transparent: true,
      opacity: 0.9,
    });
    const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
    innerRing.rotation.y = Math.PI / 2;
    innerRing.name = 'innerRing';
    group.add(innerRing);

    // Energy field plane with animated shader
    const portalPlaneGeometry = new THREE.CircleGeometry(2.8, 128);
    const portalPlaneMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        intensity: { value: 1.0 },
        color1: { value: new THREE.Color(0x00d4ff) },
        color2: { value: new THREE.Color(0x0044ff) },
        color3: { value: new THREE.Color(0x00ffff) },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float intensity;
        uniform vec3 color1;
        uniform vec3 color2;
        uniform vec3 color3;
        varying vec2 vUv;
        varying vec3 vPosition;
        
        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        void main() {
          vec2 center = vUv - 0.5;
          float dist = length(center);
          float angle = atan(center.y, center.x);
          
          // Swirling pattern
          float swirl = sin(angle * 8.0 + time * 2.0 - dist * 15.0) * 0.5 + 0.5;
          
          // Radial waves
          float wave1 = sin(dist * 25.0 - time * 4.0) * 0.5 + 0.5;
          float wave2 = sin(dist * 15.0 - time * 3.0 + 1.5) * 0.5 + 0.5;
          
          // Combine patterns
          float pattern = swirl * 0.4 + wave1 * 0.3 + wave2 * 0.3;
          
          // Edge glow
          float edge = smoothstep(0.5, 0.3, dist);
          float rim = smoothstep(0.45, 0.5, dist) * (1.0 - smoothstep(0.5, 0.55, dist));
          
          // Color mixing
          vec3 color = mix(color1, color2, pattern);
          color = mix(color, color3, rim * 2.0);
          
          // Alpha with intensity control
          float alpha = edge * (0.4 + pattern * 0.3) * intensity;
          alpha += rim * 0.8 * intensity;
          
          // Add sparkle
          float sparkle = noise(vUv * 50.0 + time) * 0.1 * intensity;
          alpha += sparkle * edge;
          
          gl_FragColor = vec4(color, alpha * 0.7);
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

    // Central core glow
    const coreGeometry = new THREE.SphereGeometry(0.3, 32, 32);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.9,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.name = 'core';
    group.add(core);

    // Portal light
    const portalLight = new THREE.PointLight(0x00d4ff, 8, 25);
    portalLight.position.set(0, 0, 0);
    portalLight.name = 'portalLight';
    group.add(portalLight);

    return group;
  }, []);

  // Create rain particles
  const createRainParticles = useCallback(() => {
    const count = 8000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = Math.random() * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
      velocities[i] = 0.3 + Math.random() * 0.4;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 1));

    const material = new THREE.PointsMaterial({
      color: 0x6688cc,
      size: 0.08,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });

    return new THREE.Points(geometry, material);
  }, []);

  // Create steam particles for food
  const createSteamParticles = useCallback(() => {
    const count = 150;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const lifetimes = new Float32Array(count);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.8;
      positions[i * 3 + 1] = Math.random() * 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
      lifetimes[i] = Math.random();
      speeds[i] = 0.01 + Math.random() * 0.02;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
    geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));

    const material = new THREE.PointsMaterial({
      color: 0xffddaa,
      size: 0.15,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });

    return new THREE.Points(geometry, material);
  }, []);

  // Create portal orbiting particles
  const createPortalParticles = useCallback(() => {
    const count = 300;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const angles = new Float32Array(count);
    const radii = new Float32Array(count);
    const speeds = new Float32Array(count);
    const offsets = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      angles[i] = Math.random() * Math.PI * 2;
      radii[i] = 2.8 + Math.random() * 0.8;
      speeds[i] = 0.3 + Math.random() * 0.8;
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
      size: 0.12,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    return new THREE.Points(geometry, material);
  }, []);

  // Create reflective ground
  const createGround = useCallback(() => {
    const geometry = new THREE.PlaneGeometry(120, 120, 100, 100);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x080812,
      metalness: 0.9,
      roughness: 0.15,
      envMapIntensity: 1.5,
    });
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    return ground;
  }, []);

  // Create road with glowing lane markers
  const createRoad = useCallback(() => {
    const group = new THREE.Group();
    
    const roadGeometry = new THREE.PlaneGeometry(10, 40);
    const roadMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x12121a,
      metalness: 0.7,
      roughness: 0.25,
    });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.set(-12, 0.01, 0);
    road.receiveShadow = true;
    group.add(road);

    // Glowing lane stripes
    const stripeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x00d4ff,
      emissive: 0x00d4ff,
      emissiveIntensity: 1.5,
    });

    for (let i = -7; i <= 7; i++) {
      const stripe = new THREE.Mesh(
        new THREE.PlaneGeometry(0.25, 2.5),
        stripeMaterial
      );
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(-12, 0.02, i * 2.8);
      group.add(stripe);
    }

    // Edge lines
    [-4.8, 4.8].forEach(x => {
      const edgeLine = new THREE.Mesh(
        new THREE.PlaneGeometry(0.1, 40),
        stripeMaterial
      );
      edgeLine.rotation.x = -Math.PI / 2;
      edgeLine.position.set(-12 + x, 0.02, 0);
      group.add(edgeLine);
    });

    return group;
  }, []);

  // Create city buildings
  const createBuildings = useCallback((side: 'left' | 'right') => {
    const group = new THREE.Group();
    const xBase = side === 'left' ? -22 : 22;
    const buildingColor = side === 'left' ? 0x0a1428 : 0x281a0a;
    const accentColor = side === 'left' ? 0x00d4ff : 0xff6b35;

    const buildingCount = 12;
    
    for (let i = 0; i < buildingCount; i++) {
      const height = 8 + Math.random() * 20;
      const width = 3 + Math.random() * 4;
      const depth = 3 + Math.random() * 4;
      
      const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
      const buildingMaterial = new THREE.MeshPhysicalMaterial({
        color: buildingColor,
        metalness: 0.6,
        roughness: 0.4,
      });
      const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
      
      const xOffset = (Math.random() - 0.5) * 10;
      const zPos = -18 + i * 3 + (Math.random() - 0.5) * 2;
      
      building.position.set(xBase + xOffset, height / 2, zPos);
      building.castShadow = true;
      building.receiveShadow = true;
      group.add(building);

      // Window lights
      const windowRows = Math.floor(height / 2.5);
      for (let j = 0; j < windowRows; j++) {
        if (Math.random() > 0.4) {
          const windowGeometry = new THREE.PlaneGeometry(0.6, 1);
          const windowMaterial = new THREE.MeshPhysicalMaterial({
            color: accentColor,
            emissive: accentColor,
            emissiveIntensity: 0.6 + Math.random() * 0.4,
            transparent: true,
            opacity: 0.8,
          });
          const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
          const windowX = building.position.x + (side === 'left' ? width / 2 + 0.01 : -width / 2 - 0.01);
          windowMesh.position.set(
            windowX,
            2 + j * 2.5,
            building.position.z + (Math.random() - 0.5) * (depth * 0.6)
          );
          windowMesh.rotation.y = side === 'left' ? 0 : Math.PI;
          group.add(windowMesh);
        }
      }
    }

    return group;
  }, []);

  // Main scene setup and animation
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050510, 0.012);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 8, 30);
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
    renderer.toneMappingExposure = 1.0;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Post-processing
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.8,
      0.3,
      0.75
    );
    composer.addPass(bloomPass);
    composerRef.current = composer;
    bloomPassRef.current = bloomPass;

    // Ambient lighting
    const ambientLight = new THREE.AmbientLight(0x0a1020, 0.4);
    scene.add(ambientLight);

    // Directional light
    const directionalLight = new THREE.DirectionalLight(0x4488ff, 0.4);
    directionalLight.position.set(15, 30, 15);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -40;
    directionalLight.shadow.camera.right = 40;
    directionalLight.shadow.camera.top = 40;
    directionalLight.shadow.camera.bottom = -40;
    scene.add(directionalLight);

    // Build scene
    const ground = createGround();
    scene.add(ground);

    const road = createRoad();
    scene.add(road);

    const leftBuildings = createBuildings('left');
    scene.add(leftBuildings);

    const rightBuildings = createBuildings('right');
    scene.add(rightBuildings);

    // Taxi
    const taxi = createTaxiModel();
    taxi.position.set(-10, 0, 0);
    taxi.scale.setScalar(1.3);
    scene.add(taxi);
    taxiGroupRef.current = taxi;

    // Food delivery
    const food = createFoodDeliveryModel();
    food.position.set(10, 0, 0);
    food.scale.setScalar(1.6);
    scene.add(food);
    foodGroupRef.current = food;

    // Portal
    const portal = createPortal();
    portal.position.set(0, 3.5, 0);
    scene.add(portal);
    portalRef.current = portal;

    // Rain
    const rain = createRainParticles();
    scene.add(rain);
    rainParticlesRef.current = rain;

    // Steam (positioned at food delivery)
    const steam = createSteamParticles();
    steam.position.set(10, 1.5, -0.6);
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
      // Start at taxi - close up
      .fromTo(
        camera.position,
        { x: -18, y: 2.5, z: 8 },
        { x: -12, y: 3, z: 10, duration: 2, ease: 'power2.inOut' },
        0.3
      )
      // Intensify taxi lights during focus
      .to(taxiLightRef.current!, { 
        intensity: 10, 
        duration: 1, 
        ease: 'power2.out' 
      }, 0.5)
      .to(taxiLightRef.current!, { 
        intensity: 5, 
        duration: 0.5 
      }, 1.5)
      // Pan across to food
      .to(camera.position, { 
        x: 12, 
        y: 3, 
        z: 10, 
        duration: 2.5, 
        ease: 'power2.inOut' 
      })
      // Intensify food lights
      .to(foodLightRef.current!, { 
        intensity: 10, 
        duration: 1, 
        ease: 'power2.out' 
      }, 2.5)
      .to(foodLightRef.current!, { 
        intensity: 5, 
        duration: 0.5 
      }, 3.5)
      // Pull back to center view
      .to(camera.position, { 
        x: 0, 
        y: 5, 
        z: 22, 
        duration: 2, 
        ease: 'power2.out' 
      })
      // Portal pulse at end
      .to(portal.scale, { 
        x: 1.15, 
        y: 1.15, 
        z: 1.15, 
        duration: 0.3, 
        ease: 'power2.out' 
      }, '-=0.5')
      .to(portal.scale, { 
        x: 1, 
        y: 1, 
        z: 1, 
        duration: 0.3, 
        ease: 'power2.in' 
      });

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      timeRef.current += 0.016;
      const time = timeRef.current;

      // Update portal shader
      const portalPlane = portal.children.find(c => c.name === 'portalPlane');
      if (portalPlane && (portalPlane as THREE.Mesh).material) {
        const material = (portalPlane as THREE.Mesh).material as THREE.ShaderMaterial;
        if (material.uniforms) {
          material.uniforms.time.value = time;
        }
      }

      // Portal continuous rotation
      portal.rotation.y += 0.008;
      portal.rotation.z = Math.sin(time * 0.5) * 0.08;

      // Portal rings counter-rotation
      const outerRing = portal.children.find(c => c.name === 'outerRing');
      const middleRing = portal.children.find(c => c.name === 'middleRing');
      const innerRing = portal.children.find(c => c.name === 'innerRing');
      if (outerRing) outerRing.rotation.x += 0.003;
      if (middleRing) middleRing.rotation.x -= 0.005;
      if (innerRing) innerRing.rotation.x += 0.007;

      // Portal glow pulse
      const portalLight = portal.children.find(c => c.name === 'portalLight') as THREE.PointLight;
      if (portalLight) {
        portalLight.intensity = 8 + Math.sin(time * 2) * 2;
      }

      // Core pulse
      const core = portal.children.find(c => c.name === 'core') as THREE.Mesh;
      if (core) {
        const scale = 1 + Math.sin(time * 3) * 0.2;
        core.scale.setScalar(scale);
      }

      // Taxi idle animation - floating and wheel rotation
      if (taxi) {
        taxi.position.y = Math.sin(time * 1.5) * 0.08;
        taxi.rotation.y = Math.sin(time * 0.4) * 0.03;
        
        // Wheel rotation
        taxi.children.forEach(child => {
          if (child.name && child.name.startsWith('wheel-')) {
            child.rotation.x += 0.02;
          }
        });
      }

      // Food delivery idle animation
      if (food) {
        food.position.y = Math.sin(time * 1.5 + 1) * 0.06;
        food.rotation.y = Math.sin(time * 0.4 + 1) * 0.025;
        
        // Wheel rotation
        food.children.forEach(child => {
          if (child.name && child.name.startsWith('wheel-')) {
            child.rotation.x += 0.015;
          }
        });
      }

      // Rain animation
      if (rain) {
        const positions = rain.geometry.attributes.position.array as Float32Array;
        const velocities = rain.geometry.attributes.velocity.array as Float32Array;
        
        for (let i = 0; i < positions.length / 3; i++) {
          positions[i * 3 + 1] -= velocities[i];
          positions[i * 3] += Math.sin(time + i) * 0.001; // Slight wind
          
          if (positions[i * 3 + 1] < 0) {
            positions[i * 3 + 1] = 40;
            positions[i * 3] = (Math.random() - 0.5) * 80;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
          }
        }
        rain.geometry.attributes.position.needsUpdate = true;
      }

      // Steam animation
      if (steamParticlesRef.current) {
        const positions = steamParticlesRef.current.geometry.attributes.position.array as Float32Array;
        const lifetimes = steamParticlesRef.current.geometry.attributes.lifetime.array as Float32Array;
        const speeds = steamParticlesRef.current.geometry.attributes.speed.array as Float32Array;

        for (let i = 0; i < positions.length / 3; i++) {
          lifetimes[i] += 0.008;
          
          if (lifetimes[i] > 1) {
            lifetimes[i] = 0;
            positions[i * 3] = (Math.random() - 0.5) * 0.8;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
          }
          
          positions[i * 3 + 1] += speeds[i];
          positions[i * 3] += Math.sin(time * 2 + i) * 0.003;
          positions[i * 3 + 2] += Math.cos(time * 2 + i) * 0.003;
        }
        steamParticlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // Portal particles orbiting
      if (portalParticlesRef.current) {
        const positions = portalParticlesRef.current.geometry.attributes.position.array as Float32Array;
        const angles = portalParticlesRef.current.geometry.attributes.angle.array as Float32Array;
        const radii = portalParticlesRef.current.geometry.attributes.radius.array as Float32Array;
        const speeds = portalParticlesRef.current.geometry.attributes.speed.array as Float32Array;
        const offsets = portalParticlesRef.current.geometry.attributes.offset.array as Float32Array;

        for (let i = 0; i < positions.length / 3; i++) {
          angles[i] += speeds[i] * 0.015;
          const wobble = Math.sin(time + offsets[i]) * 0.3;
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
    createTaxiModel,
    createFoodDeliveryModel,
    createPortal,
    createRainParticles,
    createSteamParticles,
    createPortalParticles,
    createGround,
    createRoad,
    createBuildings,
    onIntroComplete,
  ]);

  // HOVER CAMERA MOVEMENT
  useEffect(() => {
    if (!cameraRef.current || !introComplete || isWarpAnimating) return;

    const camera = cameraRef.current;

    let targetPos = { x: 0, y: 5, z: 22 };
    let targetLookAt = { x: 0, y: 2, z: 0 };

    if (sceneState === 'hover-taxi') {
      targetPos = { x: -6, y: 3.5, z: 14 };
      targetLookAt = { x: -10, y: 1, z: 0 };
      
      // Intensify taxi light
      if (taxiLightRef.current) {
        gsap.to(taxiLightRef.current, { intensity: 10, duration: 0.5 });
      }
      if (foodLightRef.current) {
        gsap.to(foodLightRef.current, { intensity: 3, duration: 0.5 });
      }
    } else if (sceneState === 'hover-food') {
      targetPos = { x: 6, y: 3.5, z: 14 };
      targetLookAt = { x: 10, y: 1, z: 0 };
      
      // Intensify food light
      if (foodLightRef.current) {
        gsap.to(foodLightRef.current, { intensity: 10, duration: 0.5 });
      }
      if (taxiLightRef.current) {
        gsap.to(taxiLightRef.current, { intensity: 3, duration: 0.5 });
      }
    } else {
      // Reset lights
      if (taxiLightRef.current) {
        gsap.to(taxiLightRef.current, { intensity: 5, duration: 0.5 });
      }
      if (foodLightRef.current) {
        gsap.to(foodLightRef.current, { intensity: 5, duration: 0.5 });
      }
    }

    gsap.to(camera.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 0.8,
      ease: 'power2.out',
      onUpdate: () => {
        camera.lookAt(
          targetLookAt.x,
          targetLookAt.y,
          targetLookAt.z
        );
      },
    });
  }, [sceneState, introComplete, isWarpAnimating]);

  // PORTAL WARP ANIMATION
  const triggerWarpAnimation = useCallback((selectedWorld: 'taxi' | 'food') => {
    if (!portalRef.current || !cameraRef.current || !bloomPassRef.current || isWarpAnimating) return;

    setIsWarpAnimating(true);
    setSceneState('warp');

    const portal = portalRef.current;
    const camera = cameraRef.current;
    const bloom = bloomPassRef.current;

    // Get portal shader for intensity control
    const portalPlane = portal.children.find(c => c.name === 'portalPlane');
    const portalLight = portal.children.find(c => c.name === 'portalLight') as THREE.PointLight;

    const warpTimeline = gsap.timeline({
      onComplete: () => {
        // Reset after animation
        gsap.to(portal.scale, { x: 1, y: 1, z: 1, duration: 0.5 });
        gsap.to(bloom, { strength: 1.8, duration: 0.5 });
        if (portalPlane && (portalPlane as THREE.Mesh).material) {
          const mat = (portalPlane as THREE.Mesh).material as THREE.ShaderMaterial;
          if (mat.uniforms) {
            gsap.to(mat.uniforms.intensity, { value: 1, duration: 0.5 });
          }
        }
        if (portalLight) {
          gsap.to(portalLight, { intensity: 8, duration: 0.5 });
        }
        
        setTimeout(() => {
          setIsWarpAnimating(false);
          setSceneState('idle');
        }, 500);
      },
    });

    // Rapid portal expansion
    warpTimeline
      .to(portal.scale, { 
        x: 6, 
        y: 6, 
        z: 6, 
        duration: 0.8, 
        ease: 'power2.in' 
      })
      // Increase bloom
      .to(bloom, { 
        strength: 4, 
        duration: 0.5, 
        ease: 'power2.in' 
      }, 0)
      // Portal glow intensifies
      .to(portalLight, { 
        intensity: 30, 
        duration: 0.6 
      }, 0);

    // Shader intensity
    if (portalPlane && (portalPlane as THREE.Mesh).material) {
      const mat = (portalPlane as THREE.Mesh).material as THREE.ShaderMaterial;
      if (mat.uniforms) {
        warpTimeline.to(mat.uniforms.intensity, { 
          value: 3, 
          duration: 0.6 
        }, 0);
      }
    }

    // Camera rushes toward portal
    warpTimeline.to(camera.position, { 
      x: 0, 
      y: 3.5, 
      z: 5, 
      duration: 0.7, 
      ease: 'power3.in' 
    }, 0.1);

    // Flash white
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
      
      gsap.to(flash, { 
        opacity: 0.9, 
        duration: 0.3, 
        delay: 0.5,
        onComplete: () => {
          gsap.to(flash, { 
            opacity: 0, 
            duration: 0.5, 
            onComplete: () => flash.remove() 
          });
        }
      });
    }
  }, [isWarpAnimating]);

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
