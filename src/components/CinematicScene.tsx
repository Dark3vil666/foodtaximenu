import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import gsap from 'gsap';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface CinematicSceneProps {
  onWorldSelect: (world: 'taxi' | 'food' | null) => void;
  onIntroComplete: () => void;
}

type SceneState = 'intro' | 'idle' | 'warp-taxi' | 'warp-food';

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

const createTaxiModel = useCallback(() => {
  return new Promise<THREE.Group>((resolve) => {
    const loader = new GLTFLoader();

    loader.load('/models/Auto.glb', (gltf) => {
      const model = gltf.scene;
      model.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      model.scale.set(1.3, 1.3, 1.3);
      model.position.set(-8, 0, 0);

      taxiGroupRef.current = model;
      resolve(model);
    });
  });
}, []);



const createFoodDeliveryModel = useCallback(() => {
  return new Promise<THREE.Group>((resolve) => {
    const loader = new GLTFLoader();

    loader.load('/models/Motor.glb', (gltf) => {
      const model = gltf.scene;

      model.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // prilagodi po potrebi
      model.scale.set(1.6, 1.6, 1.6);
      model.position.set(8, 0, 0);

      foodGroupRef.current = model;
      resolve(model);
    });
  });
}, []);

    // VERTICAL Yellow checkered pattern on front of box (white-blue-yellow)
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 3; j++) {
        const isYellow = (i + j) % 2 === 0;
        const squareGeometry = new THREE.BoxGeometry(0.24, 0.24, 0.02);
        const square = new THREE.Mesh(squareGeometry, isYellow ? yellowMaterial : blueMaterial);
        square.position.set(-0.36 + i * 0.24, 1.06 + j * 0.24, -0.16);
        group.add(square);
      }
    }

    // Yellow checkered pattern on sides (vertical)
    [-0.56, 0.56].forEach((xPos, sideIdx) => {
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const isYellow = (i + j + sideIdx) % 2 === 0;
          const squareGeometry = new THREE.BoxGeometry(0.02, 0.24, 0.24);
          const square = new THREE.Mesh(squareGeometry, isYellow ? yellowMaterial : blueMaterial);
          square.position.set(xPos, 1.06 + j * 0.24, -0.36 - i * 0.24);
          group.add(square);
        }
      }
    });

    // Box lid (blue with yellow accent)
    const lidGeometry = new THREE.BoxGeometry(1.15, 0.1, 0.9);
    const lid = new THREE.Mesh(lidGeometry, blueMaterial);
    lid.position.set(0, 1.78, -0.6);
    group.add(lid);

    // Yellow stripe on lid
    const lidStripe = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.02, 0.15),
      yellowMaterial
    );
    lidStripe.position.set(0, 1.84, -0.6);
    group.add(lidStripe);

    // Warm ambient light
    const foodLight = new THREE.PointLight(0xff8844, 5, 20);
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

  // Create portal that rises from ground
  const createPortal = useCallback(() => {
    const group = new THREE.Group();

    // Portal frame (square rising from ground)
    const frameThickness = 0.15;
    const frameSize = 4;
    const frameMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0066cc,
      emissive: 0x0044aa,
      emissiveIntensity: 2,
      metalness: 0.9,
      roughness: 0.1,
    });

    // Top bar
    const topBar = new THREE.Mesh(
      new THREE.BoxGeometry(frameSize, frameThickness, frameThickness),
      frameMaterial
    );
    topBar.position.y = frameSize / 2;
    topBar.name = 'frameTop';
    group.add(topBar);

    // Bottom bar
    const bottomBar = new THREE.Mesh(
      new THREE.BoxGeometry(frameSize, frameThickness, frameThickness),
      frameMaterial
    );
    bottomBar.position.y = -frameSize / 2;
    bottomBar.name = 'frameBottom';
    group.add(bottomBar);

    // Left bar
    const leftBar = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, frameSize, frameThickness),
      frameMaterial
    );
    leftBar.position.x = -frameSize / 2;
    leftBar.name = 'frameLeft';
    group.add(leftBar);

    // Right bar
    const rightBar = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, frameSize, frameThickness),
      frameMaterial
    );
    rightBar.position.x = frameSize / 2;
    rightBar.name = 'frameRight';
    group.add(rightBar);

    // Energy field plane with animated shader
    const portalPlaneGeometry = new THREE.PlaneGeometry(frameSize - 0.3, frameSize - 0.3, 64, 64);
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
          float edge = smoothstep(0.5, 0.2, dist);
          float rim = smoothstep(0.4, 0.5, dist) * (1.0 - smoothstep(0.5, 0.6, dist));
          
          // Color mixing
          vec3 color = mix(color1, color2, pattern);
          color = mix(color, color3, rim * 2.0);
          
          // Alpha with intensity control
          float alpha = edge * (0.5 + pattern * 0.3) * intensity;
          alpha += rim * 0.8 * intensity;
          
          // Add sparkle
          float sparkle = noise(vUv * 50.0 + time) * 0.15 * intensity;
          alpha += sparkle * edge;
          
          gl_FragColor = vec4(color, alpha * 0.85);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const portalPlane = new THREE.Mesh(portalPlaneGeometry, portalPlaneMaterial);
    portalPlane.name = 'portalPlane';
    group.add(portalPlane);

    // Central core glow
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
    const portalLight = new THREE.PointLight(0x00d4ff, 8, 25);
    portalLight.position.set(0, 0, 0);
    portalLight.name = 'portalLight';
    group.add(portalLight);

    // Initially hidden below ground
    group.position.y = -5;
    group.visible = false;

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
      radii[i] = 2.2 + Math.random() * 0.6;
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

    const particles = new THREE.Points(geometry, material);
    particles.visible = false;
    return particles;
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

    // Camera - STATIC position
    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 6, 24);
    camera.lookAt(0, 1, 0);
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
    taxi.position.set(-8, 0, 0);
    taxi.scale.setScalar(1.3);
    scene.add(taxi);
    taxiGroupRef.current = taxi;

    // Food delivery
    const food = createFoodDeliveryModel();
    food.position.set(8, 0, 0);
    food.scale.setScalar(1.6);
    scene.add(food);
    foodGroupRef.current = food;

    // Portal (hidden initially)
    const portal = createPortal();
    portal.position.set(0, 0, 0);
    scene.add(portal);
    portalRef.current = portal;

    // Rain
    const rain = createRainParticles();
    scene.add(rain);
    rainParticlesRef.current = rain;

    // Steam (positioned at food delivery)
    const steam = createSteamParticles();
    steam.position.set(8, 1.5, -0.6);
    scene.add(steam);
    steamParticlesRef.current = steam;

    // Portal particles
    const portalParticles = createPortalParticles();
    scene.add(portalParticles);
    portalParticlesRef.current = portalParticles;

    // Start with screen black
    renderer.domElement.style.opacity = '0';

    // CINEMATIC INTRO ANIMATION (no camera movement - just fade in)
    const introTimeline = gsap.timeline({
      onComplete: () => {
        setIntroComplete(true);
        setSceneState('idle');
        onIntroComplete();
      },
    });

    introTimeline
      .to(renderer.domElement, { 
        opacity: 1, 
        duration: 2, 
        ease: 'power2.out' 
      })
      // Pulse taxi lights
      .to(taxiLightRef.current!, { 
        intensity: 10, 
        duration: 0.8, 
        ease: 'power2.out' 
      }, 1)
      .to(taxiLightRef.current!, { 
        intensity: 5, 
        duration: 0.5 
      }, 1.8)
      // Pulse food lights
      .to(foodLightRef.current!, { 
        intensity: 10, 
        duration: 0.8, 
        ease: 'power2.out' 
      }, 1.5)
      .to(foodLightRef.current!, { 
        intensity: 5, 
        duration: 0.5 
      }, 2.3);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      timeRef.current += 0.016;
      const time = timeRef.current;

      // Update portal shader if visible
      if (portal.visible) {
        const portalPlane = portal.children.find(c => c.name === 'portalPlane');
        if (portalPlane && (portalPlane as THREE.Mesh).material) {
          const material = (portalPlane as THREE.Mesh).material as THREE.ShaderMaterial;
          if (material.uniforms) {
            material.uniforms.time.value = time;
          }
        }

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
      }

      // Taxi idle animation - floating and wheel rotation
      if (taxi) {
        taxi.position.y = Math.sin(time * 1.5) * 0.05;
        
        // Wheel rotation
        taxi.children.forEach(child => {
          if (child.name && child.name.startsWith('wheel-')) {
            child.rotation.x += 0.01;
          }
        });
      }

      // Food delivery idle animation
      if (food) {
        food.position.y = Math.sin(time * 1.5 + 1) * 0.04;
        
        // Wheel rotation
        food.children.forEach(child => {
          if (child.name && child.name.startsWith('wheel-')) {
            child.rotation.x += 0.008;
          }
        });
      }

      // Rain animation
      if (rain) {
        const positions = rain.geometry.attributes.position.array as Float32Array;
        const velocities = rain.geometry.attributes.velocity.array as Float32Array;
        
        for (let i = 0; i < positions.length / 3; i++) {
          positions[i * 3 + 1] -= velocities[i];
          positions[i * 3] += Math.sin(time + i) * 0.001;
          
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

      // Portal particles orbiting (if visible)
      if (portalParticlesRef.current && portalParticlesRef.current.visible) {
        const positions = portalParticlesRef.current.geometry.attributes.position.array as Float32Array;
        const angles = portalParticlesRef.current.geometry.attributes.angle.array as Float32Array;
        const radii = portalParticlesRef.current.geometry.attributes.radius.array as Float32Array;
        const speeds = portalParticlesRef.current.geometry.attributes.speed.array as Float32Array;
        const offsets = portalParticlesRef.current.geometry.attributes.offset.array as Float32Array;

        for (let i = 0; i < positions.length / 3; i++) {
          angles[i] += speeds[i] * 0.015;
          const wobble = Math.sin(time + offsets[i]) * 0.2;
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

  // PORTAL WARP ANIMATION - portal rises from ground and sucks vehicle
  const triggerWarpAnimation = useCallback((selectedWorld: 'taxi' | 'food') => {
    if (!portalRef.current || !cameraRef.current || !bloomPassRef.current || isWarpAnimating) return;

    setIsWarpAnimating(true);
    setSceneState(selectedWorld === 'taxi' ? 'warp-taxi' : 'warp-food');
    onWorldSelect(selectedWorld);

    const portal = portalRef.current;
    const camera = cameraRef.current;
    const bloom = bloomPassRef.current;
    const vehicle = selectedWorld === 'taxi' ? taxiGroupRef.current : foodGroupRef.current;
    const vehicleX = selectedWorld === 'taxi' ? -8 : 8;

    if (!vehicle) return;

    // Get portal shader for intensity control
    const portalPlane = portal.children.find(c => c.name === 'portalPlane');
    const portalLight = portal.children.find(c => c.name === 'portalLight') as THREE.PointLight;

    // Show portal and particles
    portal.visible = true;
    if (portalParticlesRef.current) {
      portalParticlesRef.current.visible = true;
    }

    // Position portal at vehicle location, below ground
    portal.position.set(vehicleX, -4, 0);
    portal.rotation.x = -Math.PI / 2; // Lay flat on ground
    if (portalParticlesRef.current) {
      portalParticlesRef.current.position.set(vehicleX, 0, 0);
    }

    const warpTimeline = gsap.timeline({
      onComplete: () => {
        // Navigate to page
        setTimeout(() => {
          navigate(selectedWorld === 'taxi' ? '/taxi' : '/food');
        }, 200);
      },
    });

    // Phase 1: Camera zooms to vehicle
    warpTimeline
      .to(camera.position, {
        x: vehicleX * 0.3,
        y: 4,
        z: 12,
        duration: 0.8,
        ease: 'power2.out',
        onUpdate: () => {
          camera.lookAt(vehicleX, 0, 0);
        },
      })
      // Phase 2: Portal rises from ground
      .to(portal.position, {
        y: 0.1,
        duration: 1,
        ease: 'power2.out',
      }, 0.3)
      .to(bloom, {
        strength: 2.5,
        duration: 0.8,
      }, 0.3);

    // Intensify portal glow during rise
    if (portalLight) {
      warpTimeline.to(portalLight, {
        intensity: 20,
        duration: 1,
      }, 0.3);
    }

    if (portalPlane && (portalPlane as THREE.Mesh).material) {
      const mat = (portalPlane as THREE.Mesh).material as THREE.ShaderMaterial;
      if (mat.uniforms) {
        warpTimeline.to(mat.uniforms.intensity, {
          value: 2,
          duration: 0.8,
        }, 0.3);
      }
    }

    // Phase 3: Vehicle gets sucked into portal
    warpTimeline
      .to(vehicle.position, {
        y: -3,
        duration: 1.2,
        ease: 'power2.in',
      }, 1.2)
      .to(vehicle.scale, {
        x: 0.3,
        y: 0.3,
        z: 0.3,
        duration: 1.2,
        ease: 'power2.in',
      }, 1.2)
      .to(vehicle.rotation, {
        y: Math.PI * 2,
        duration: 1.2,
        ease: 'power2.in',
      }, 1.2);

    // Phase 4: Portal collapses and screen flashes
    warpTimeline
      .to(portal.scale, {
        x: 0.1,
        y: 0.1,
        z: 0.1,
        duration: 0.4,
        ease: 'power3.in',
      }, 2.3)
      .to(bloom, {
        strength: 5,
        duration: 0.3,
      }, 2.3);

    if (portalLight) {
      warpTimeline.to(portalLight, {
        intensity: 50,
        duration: 0.3,
      }, 2.3);
    }

    // Flash white at end
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
        opacity: 1,
        duration: 0.3,
        delay: 2.4,
        onComplete: () => {
          // Keep white during navigation
        },
      });
    }
  }, [isWarpAnimating, navigate, onWorldSelect]);

  // Click handler
  const handleClick = useCallback((world: 'taxi' | 'food') => {
    if (!introComplete || isWarpAnimating) return;
    triggerWarpAnimation(world);
  }, [introComplete, isWarpAnimating, triggerWarpAnimation]);

  return (
    <div className="fixed inset-0 overflow-hidden">
      <div ref={containerRef} className="absolute inset-0" />
      
      {/* Left click zone - TAXI */}
      <div
        className="absolute left-0 top-0 w-1/2 h-full cursor-pointer z-10"
        onClick={() => handleClick('taxi')}
        onTouchEnd={(e) => {
          e.preventDefault();
          handleClick('taxi');
        }}
      />
      
      {/* Right click zone - FOOD */}
      <div
        className="absolute right-0 top-0 w-1/2 h-full cursor-pointer z-10"
        onClick={() => handleClick('food')}
        onTouchEnd={(e) => {
          e.preventDefault();
          handleClick('food');
        }}
      />
    </div>
  );
};

export default CinematicScene;
