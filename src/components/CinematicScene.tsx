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

const CinematicScene: React.FC<CinematicSceneProps> = ({ onWorldSelect, onIntroComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const [hoveredWorld, setHoveredWorld] = useState<'taxi' | 'food' | null>(null);
  const taxiGroupRef = useRef<THREE.Group | null>(null);
  const foodGroupRef = useRef<THREE.Group | null>(null);
  const portalRef = useRef<THREE.Group | null>(null);
  const rainParticlesRef = useRef<THREE.Points | null>(null);
  const taxiParticlesRef = useRef<THREE.Points | null>(null);
  const foodParticlesRef = useRef<THREE.Points | null>(null);
  const portalParticlesRef = useRef<THREE.Points | null>(null);

  // Create taxi model
  const createTaxiModel = useCallback(() => {
    const group = new THREE.Group();
    
    // Car body
    const bodyGeometry = new THREE.BoxGeometry(2.4, 0.8, 4.5);
    const bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1a1a2e,
      metalness: 0.9,
      roughness: 0.1,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.6;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Cabin
    const cabinGeometry = new THREE.BoxGeometry(2.2, 0.7, 2.5);
    const cabinMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0a0a15,
      metalness: 0.8,
      roughness: 0.2,
      transparent: true,
      opacity: 0.9,
    });
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(0, 1.15, -0.3);
    cabin.castShadow = true;
    group.add(cabin);

    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 32);
    const wheelMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x111111,
      metalness: 0.3,
      roughness: 0.8,
    });
    
    const wheelPositions = [
      { x: -1.1, z: 1.5 },
      { x: 1.1, z: 1.5 },
      { x: -1.1, z: -1.5 },
      { x: 1.1, z: -1.5 },
    ];

    wheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos.x, 0.35, pos.z);
      wheel.castShadow = true;
      group.add(wheel);

      // Rim
      const rimGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.26, 8);
      const rimMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x00d4ff,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.3,
        metalness: 0.9,
        roughness: 0.1,
      });
      const rim = new THREE.Mesh(rimGeometry, rimMaterial);
      rim.rotation.z = Math.PI / 2;
      rim.position.set(pos.x > 0 ? pos.x + 0.01 : pos.x - 0.01, 0.35, pos.z);
      group.add(rim);
    });

    // Headlights
    const headlightGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const headlightMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x00d4ff,
      emissive: 0x00d4ff,
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.9,
    });
    
    [-0.7, 0.7].forEach(x => {
      const headlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
      headlight.position.set(x, 0.6, 2.3);
      group.add(headlight);

      const headlightLight = new THREE.PointLight(0x00d4ff, 2, 8);
      headlightLight.position.set(x, 0.6, 2.5);
      group.add(headlightLight);
    });

    // Taillights
    const taillightGeometry = new THREE.BoxGeometry(0.4, 0.15, 0.05);
    const taillightMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x00d4ff,
      emissive: 0x00d4ff,
      emissiveIntensity: 1.5,
    });
    
    [-0.8, 0.8].forEach(x => {
      const taillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
      taillight.position.set(x, 0.6, -2.25);
      group.add(taillight);
    });

    // Underglow
    const underglowGeometry = new THREE.PlaneGeometry(2.2, 4.3);
    const underglowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const underglow = new THREE.Mesh(underglowGeometry, underglowMaterial);
    underglow.rotation.x = -Math.PI / 2;
    underglow.position.y = 0.05;
    group.add(underglow);

    // LED strip
    const stripGeometry = new THREE.BoxGeometry(2.3, 0.02, 0.02);
    const stripMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x00d4ff,
      emissive: 0x00d4ff,
      emissiveIntensity: 2,
    });
    
    [-2.2, 2.2].forEach(z => {
      const strip = new THREE.Mesh(stripGeometry, stripMaterial);
      strip.position.set(0, 0.15, z);
      group.add(strip);
    });

    // Taxi sign
    const signGeometry = new THREE.BoxGeometry(0.8, 0.25, 0.3);
    const signMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x00d4ff,
      emissive: 0x00d4ff,
      emissiveIntensity: 1.5,
    });
    const sign = new THREE.Mesh(signGeometry, signMaterial);
    sign.position.set(0, 1.55, -0.3);
    group.add(sign);

    return group;
  }, []);

  // Create food delivery model
  const createFoodDeliveryModel = useCallback(() => {
    const group = new THREE.Group();

    // Scooter body
    const bodyGeometry = new THREE.BoxGeometry(0.8, 0.6, 2);
    const bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x2d1810,
      metalness: 0.7,
      roughness: 0.3,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Handlebar
    const handleGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8);
    const handleMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x333333,
      metalness: 0.9,
      roughness: 0.2,
    });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(0, 1.0, 0.8);
    group.add(handle);

    // Front wheel
    const wheelGeometry = new THREE.TorusGeometry(0.3, 0.08, 16, 32);
    const wheelMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x111111,
      metalness: 0.4,
      roughness: 0.7,
    });
    const frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontWheel.rotation.y = Math.PI / 2;
    frontWheel.position.set(0, 0.3, 0.9);
    frontWheel.castShadow = true;
    group.add(frontWheel);

    // Rear wheel
    const rearWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    rearWheel.rotation.y = Math.PI / 2;
    rearWheel.position.set(0, 0.3, -0.7);
    rearWheel.castShadow = true;
    group.add(rearWheel);

    // Delivery box
    const boxGeometry = new THREE.BoxGeometry(0.9, 0.7, 0.7);
    const boxMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xff6b35,
      emissive: 0xff6b35,
      emissiveIntensity: 0.3,
      metalness: 0.2,
      roughness: 0.6,
    });
    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    box.position.set(0, 1.15, -0.5);
    box.castShadow = true;
    group.add(box);

    // Box lid
    const lidGeometry = new THREE.BoxGeometry(0.92, 0.08, 0.72);
    const lidMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xff8c5a,
      emissive: 0xff6b35,
      emissiveIntensity: 0.2,
    });
    const lid = new THREE.Mesh(lidGeometry, lidMaterial);
    lid.position.set(0, 1.55, -0.5);
    group.add(lid);

    // Warm glow light
    const warmLight = new THREE.PointLight(0xff6b35, 3, 10);
    warmLight.position.set(0, 2, -0.5);
    group.add(warmLight);

    // Steam particles emitter position marker
    const steamMarker = new THREE.Object3D();
    steamMarker.position.set(0, 1.6, -0.5);
    steamMarker.name = 'steamEmitter';
    group.add(steamMarker);

    return group;
  }, []);

  // Create portal
  const createPortal = useCallback(() => {
    const group = new THREE.Group();

    // Outer ring
    const ringGeometry = new THREE.TorusGeometry(2.5, 0.15, 32, 100);
    const ringMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x00d4ff,
      emissive: 0x00d4ff,
      emissiveIntensity: 2,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.9,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.y = Math.PI / 2;
    group.add(ring);

    // Inner ring
    const innerRingGeometry = new THREE.TorusGeometry(2, 0.08, 32, 100);
    const innerRingMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.7,
    });
    const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
    innerRing.rotation.y = Math.PI / 2;
    group.add(innerRing);

    // Portal plane (energy field)
    const portalPlaneGeometry = new THREE.CircleGeometry(2.3, 64);
    const portalPlaneMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color1: { value: new THREE.Color(0x00d4ff) },
        color2: { value: new THREE.Color(0x0066ff) },
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
        uniform vec3 color1;
        uniform vec3 color2;
        varying vec2 vUv;
        
        void main() {
          vec2 center = vUv - 0.5;
          float dist = length(center);
          float wave = sin(dist * 20.0 - time * 3.0) * 0.5 + 0.5;
          float ring = smoothstep(0.45, 0.5, dist) * (1.0 - smoothstep(0.5, 0.55, dist));
          vec3 color = mix(color1, color2, wave);
          float alpha = (1.0 - dist * 2.0) * 0.6 + ring * 0.5;
          alpha *= 0.7 + wave * 0.3;
          gl_FragColor = vec4(color, alpha * 0.5);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const portalPlane = new THREE.Mesh(portalPlaneGeometry, portalPlaneMaterial);
    portalPlane.rotation.y = Math.PI / 2;
    portalPlane.name = 'portalPlane';
    group.add(portalPlane);

    // Portal light
    const portalLight = new THREE.PointLight(0x00d4ff, 5, 15);
    portalLight.position.set(0, 0, 0);
    group.add(portalLight);

    return group;
  }, []);

  // Create rain particles
  const createRainParticles = useCallback(() => {
    const particleCount = 5000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = Math.random() * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
      velocities[i] = 0.2 + Math.random() * 0.3;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 1));

    const material = new THREE.PointsMaterial({
      color: 0x8888ff,
      size: 0.05,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });

    return new THREE.Points(geometry, material);
  }, []);

  // Create world particles
  const createWorldParticles = useCallback((color: number, count: number) => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const radius = 3 + Math.random() * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi);
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color,
      size: 0.08,
      transparent: true,
      opacity: 0.6,
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

    for (let i = 0; i < count; i++) {
      angles[i] = Math.random() * Math.PI * 2;
      radii[i] = 2.5 + Math.random() * 0.5;
      speeds[i] = 0.5 + Math.random() * 1;
      
      positions[i * 3] = 0;
      positions[i * 3 + 1] = radii[i] * Math.sin(angles[i]);
      positions[i * 3 + 2] = radii[i] * Math.cos(angles[i]);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('angle', new THREE.BufferAttribute(angles, 1));
    geometry.setAttribute('radius', new THREE.BufferAttribute(radii, 1));
    geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));

    const material = new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 0.12,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    return new THREE.Points(geometry, material);
  }, []);

  // Create ground
  const createGround = useCallback(() => {
    const geometry = new THREE.PlaneGeometry(100, 100);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x0a0a15,
      metalness: 0.8,
      roughness: 0.2,
      envMapIntensity: 1,
    });
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    return ground;
  }, []);

  // Create road with lane stripes
  const createRoad = useCallback(() => {
    const group = new THREE.Group();
    
    // Road surface
    const roadGeometry = new THREE.PlaneGeometry(8, 30);
    const roadMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1a1a25,
      metalness: 0.6,
      roughness: 0.3,
    });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.set(-12, 0.01, 0);
    road.receiveShadow = true;
    group.add(road);

    // Lane stripes
    const stripeGeometry = new THREE.PlaneGeometry(0.2, 2);
    const stripeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x00d4ff,
      emissive: 0x00d4ff,
      emissiveIntensity: 0.5,
    });

    for (let i = -5; i <= 5; i++) {
      const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(-12, 0.02, i * 3);
      group.add(stripe);
    }

    return group;
  }, []);

  // Create city buildings
  const createBuildings = useCallback((side: 'left' | 'right') => {
    const group = new THREE.Group();
    const xOffset = side === 'left' ? -20 : 20;
    const buildingColor = side === 'left' ? 0x0a1428 : 0x281a0a;
    const accentColor = side === 'left' ? 0x00d4ff : 0xff6b35;

    for (let i = 0; i < 8; i++) {
      const height = 5 + Math.random() * 15;
      const width = 2 + Math.random() * 3;
      const depth = 2 + Math.random() * 3;
      
      const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
      const buildingMaterial = new THREE.MeshPhysicalMaterial({
        color: buildingColor,
        metalness: 0.5,
        roughness: 0.5,
      });
      const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
      building.position.set(
        xOffset + (Math.random() - 0.5) * 8,
        height / 2,
        -15 + i * 4 + (Math.random() - 0.5) * 2
      );
      building.castShadow = true;
      building.receiveShadow = true;
      group.add(building);

      // Window lights
      const windowCount = Math.floor(height / 2);
      for (let j = 0; j < windowCount; j++) {
        if (Math.random() > 0.5) {
          const windowGeometry = new THREE.PlaneGeometry(0.5, 0.8);
          const windowMaterial = new THREE.MeshPhysicalMaterial({
            color: accentColor,
            emissive: accentColor,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.7,
          });
          const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
          windowMesh.position.set(
            building.position.x + (side === 'left' ? width / 2 + 0.01 : -width / 2 - 0.01),
            1 + j * 2,
            building.position.z
          );
          windowMesh.rotation.y = side === 'left' ? 0 : Math.PI;
          group.add(windowMesh);
        }
      }
    }

    return group;
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a15, 0.015);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 25);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Post-processing
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.4,
      0.85
    );
    composer.addPass(bloomPass);
    composerRef.current = composer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x0a1428, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0x4488ff, 0.5);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Add elements
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
    taxi.scale.setScalar(1.2);
    scene.add(taxi);
    taxiGroupRef.current = taxi;

    // Food delivery
    const food = createFoodDeliveryModel();
    food.position.set(10, 0, 0);
    food.scale.setScalar(1.5);
    scene.add(food);
    foodGroupRef.current = food;

    // Portal
    const portal = createPortal();
    portal.position.set(0, 3, 0);
    scene.add(portal);
    portalRef.current = portal;

    // Particles
    const rain = createRainParticles();
    scene.add(rain);
    rainParticlesRef.current = rain;

    const taxiParticles = createWorldParticles(0x00d4ff, 100);
    taxiParticles.position.set(-10, 2, 0);
    scene.add(taxiParticles);
    taxiParticlesRef.current = taxiParticles;

    const foodParticles = createWorldParticles(0xff6b35, 100);
    foodParticles.position.set(10, 2, 0);
    scene.add(foodParticles);
    foodParticlesRef.current = foodParticles;

    const portalParticles = createPortalParticles();
    portalParticles.position.copy(portal.position);
    scene.add(portalParticles);
    portalParticlesRef.current = portalParticles;

    // Cinematic intro animation
    const introTimeline = gsap.timeline({
      onComplete: onIntroComplete,
    });

    // Start from black
    renderer.domElement.style.opacity = '0';

    introTimeline
      .to(renderer.domElement, { opacity: 1, duration: 1.5, ease: 'power2.out' })
      .fromTo(
        camera.position,
        { x: -20, y: 3, z: 15 },
        { x: -10, y: 4, z: 12, duration: 2, ease: 'power2.inOut' },
        0.5
      )
      .to(camera.position, { x: 10, y: 4, z: 12, duration: 2.5, ease: 'power2.inOut' })
      .to(camera.position, { x: 0, y: 5, z: 20, duration: 2, ease: 'power2.out' });

    // Animation loop
    let time = 0;
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      time += 0.016;

      // Update portal shader
      const portalPlane = portal.children.find(c => c.name === 'portalPlane');
      if (portalPlane && (portalPlane as THREE.Mesh).material) {
        const material = (portalPlane as THREE.Mesh).material as THREE.ShaderMaterial;
        if (material.uniforms) {
          material.uniforms.time.value = time;
        }
      }

      // Portal rotation
      portal.rotation.y += 0.005;
      portal.rotation.z = Math.sin(time * 0.5) * 0.1;

      // Taxi float animation
      if (taxi) {
        taxi.position.y = Math.sin(time * 2) * 0.05;
        taxi.rotation.y = Math.sin(time * 0.3) * 0.02;
      }

      // Food float animation
      if (food) {
        food.position.y = Math.sin(time * 2 + 1) * 0.05;
        food.rotation.y = Math.sin(time * 0.3 + 1) * 0.02;
      }

      // Rain animation
      if (rain) {
        const positions = rain.geometry.attributes.position.array as Float32Array;
        const velocities = rain.geometry.attributes.velocity.array as Float32Array;
        
        for (let i = 0; i < positions.length / 3; i++) {
          positions[i * 3 + 1] -= velocities[i];
          if (positions[i * 3 + 1] < 0) {
            positions[i * 3 + 1] = 30;
          }
        }
        rain.geometry.attributes.position.needsUpdate = true;
      }

      // Portal particles orbit
      if (portalParticlesRef.current) {
        const positions = portalParticlesRef.current.geometry.attributes.position.array as Float32Array;
        const angles = portalParticlesRef.current.geometry.attributes.angle.array as Float32Array;
        const radii = portalParticlesRef.current.geometry.attributes.radius.array as Float32Array;
        const speeds = portalParticlesRef.current.geometry.attributes.speed.array as Float32Array;

        for (let i = 0; i < positions.length / 3; i++) {
          angles[i] += speeds[i] * 0.02;
          positions[i * 3] = Math.sin(time * 0.5) * 0.5;
          positions[i * 3 + 1] = radii[i] * Math.sin(angles[i]);
          positions[i * 3 + 2] = radii[i] * Math.cos(angles[i]);
        }
        portalParticlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // World particles rotation
      if (taxiParticlesRef.current) {
        taxiParticlesRef.current.rotation.y += 0.002;
      }
      if (foodParticlesRef.current) {
        foodParticlesRef.current.rotation.y -= 0.002;
      }

      composer.render();
    };

    animate();

    // Handle resize
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
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [
    createTaxiModel,
    createFoodDeliveryModel,
    createPortal,
    createRainParticles,
    createWorldParticles,
    createPortalParticles,
    createGround,
    createRoad,
    createBuildings,
    onIntroComplete,
  ]);

  // Hover effects
  useEffect(() => {
    if (!cameraRef.current) return;

    const camera = cameraRef.current;
    let targetX = 0;
    let targetY = 5;
    let targetZ = 20;

    if (hoveredWorld === 'taxi') {
      targetX = -6;
      targetY = 3;
      targetZ = 12;
    } else if (hoveredWorld === 'food') {
      targetX = 6;
      targetY = 3;
      targetZ = 12;
    }

    gsap.to(camera.position, {
      x: targetX,
      y: targetY,
      z: targetZ,
      duration: 1,
      ease: 'power2.out',
    });
  }, [hoveredWorld]);

  const handleHover = (world: 'taxi' | 'food' | null) => {
    setHoveredWorld(world);
    onWorldSelect(world);
  };

  const handleClick = (world: 'taxi' | 'food') => {
    if (!portalRef.current || !cameraRef.current) return;

    // Portal warp animation
    const timeline = gsap.timeline();
    
    timeline
      .to(portalRef.current.scale, {
        x: 10,
        y: 10,
        z: 10,
        duration: 1,
        ease: 'power2.in',
      })
      .to(
        cameraRef.current.position,
        {
          x: world === 'taxi' ? -10 : 10,
          y: 3,
          z: 0,
          duration: 1,
          ease: 'power2.in',
        },
        0
      )
      .to(containerRef.current, {
        opacity: 0,
        duration: 0.5,
      });
  };

  return (
    <div className="fixed inset-0 overflow-hidden">
      <div ref={containerRef} className="absolute inset-0" />
      
      {/* Hover zones */}
      <div
        className="absolute left-0 top-0 w-1/2 h-full cursor-pointer z-10"
        onMouseEnter={() => handleHover('taxi')}
        onMouseLeave={() => handleHover(null)}
        onClick={() => handleClick('taxi')}
      />
      <div
        className="absolute right-0 top-0 w-1/2 h-full cursor-pointer z-10"
        onMouseEnter={() => handleHover('food')}
        onMouseLeave={() => handleHover(null)}
        onClick={() => handleClick('food')}
      />
    </div>
  );
};

export default CinematicScene;
