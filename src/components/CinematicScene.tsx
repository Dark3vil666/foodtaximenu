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

const CinematicScene: React.FC<CinematicSceneProps> = ({
  onWorldSelect,
  onIntroComplete,
}) => {
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

  const timeRef = useRef(0);

  const [introComplete, setIntroComplete] = useState(false);

  const isWarpAnimatingRef = useRef(false);
  const warpVehicleRef = useRef<THREE.Object3D | null>(null);

  const taxiBaseY = useRef(0);
  const foodBaseY = useRef(0);

  const trafficLightMaterialsRef = useRef<
    {
      red: THREE.MeshStandardMaterial;
      yellow: THREE.MeshStandardMaterial;
      green: THREE.MeshStandardMaterial;
    }[]
  >([]);

  // ------------------------------------------------
  //  TUNING (bez preklapanja / pregledno)
  // ------------------------------------------------
  const TAXI_X = -6.2;
  const MOTOR_X = 6.2;
  const VEHICLES_Z = -6.8;

  // Motor ravno prema kameri (u većini GLTF slučajeva treba Math.PI)
  const MOTOR_YAW = Math.PI;

  // Taxi 3/4 (lijevi bok)
  const TAXI_YAW = THREE.MathUtils.degToRad(32);

  // ------------------------------------------------
  //  HELPERS
  // ------------------------------------------------
  const normalizeScaleAndGround = useCallback(
    (model: THREE.Object3D, targetDiagonal: number) => {
      model.updateWorldMatrix(true, true);
      const box0 = new THREE.Box3().setFromObject(model);
      const center = new THREE.Vector3();
      box0.getCenter(center);
      model.position.sub(center);

      model.updateWorldMatrix(true, true);
      const box1 = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      box1.getSize(size);
      const len = size.length() || 1;

      const scaleFactor = targetDiagonal / len;
      model.scale.multiplyScalar(scaleFactor);

      model.updateWorldMatrix(true, true);
      const box2 = new THREE.Box3().setFromObject(model);
      const minY = box2.min.y;
      model.position.y -= minY;

      model.position.y += 0.02;
    },
    [],
  );

  const getObjectSize = useCallback((obj: THREE.Object3D) => {
    obj.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(obj);
    const size = new THREE.Vector3();
    box.getSize(size);
    return size;
  }, []);

  // ------------------------------------------------
  //  MODELI (taxi & motor)
  // ------------------------------------------------
  const createTaxiModel = useCallback(() => {
    return new Promise<THREE.Group>((resolve) => {
      const loader = new GLTFLoader();

      loader.load(
        '/models/Auto.glb',
        (gltf) => {
          const model = gltf.scene;

          model.position.set(0, 0, 0);
          model.rotation.set(0, 0, 0);
          model.scale.setScalar(1);

          normalizeScaleAndGround(model, 12.7);

          model.traverse((o) => {
            if ((o as THREE.Mesh).isMesh) {
              const mesh = o as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;

              if (Array.isArray(mesh.material)) {
                mesh.material.forEach((m) => {
                  if ((m as any).metalness !== undefined)
                    (m as any).metalness = Math.min(
                      1,
                      (m as any).metalness + 0.05,
                    );
                  if ((m as any).roughness !== undefined)
                    (m as any).roughness = Math.max(
                      0.15,
                      (m as any).roughness - 0.05,
                    );
                });
              } else {
                const m = mesh.material as any;
                if (m?.metalness !== undefined)
                  m.metalness = Math.min(1, (m.metalness ?? 0.7) + 0.05);
                if (m?.roughness !== undefined)
                  m.roughness = Math.max(0.15, (m.roughness ?? 0.35) - 0.05);
              }
            }
          });

          resolve(model);
        },
        undefined,
        () => resolve(new THREE.Group()),
      );
    });
  }, [normalizeScaleAndGround]);

  const createFoodDeliveryModel = useCallback(() => {
    return new Promise<THREE.Group>((resolve) => {
      const loader = new GLTFLoader();

      loader.load(
        '/models/Motor.glb',
        (gltf) => {
          const model = gltf.scene;

          model.position.set(0, 0, 0);
          model.rotation.set(0, 0, 0);
          model.scale.setScalar(1);

          normalizeScaleAndGround(model, 10.6);

          model.traverse((o) => {
            if ((o as THREE.Mesh).isMesh) {
              const mesh = o as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;

              if (Array.isArray(mesh.material)) {
                mesh.material.forEach((m) => {
                  if ((m as any).metalness !== undefined)
                    (m as any).metalness = Math.min(
                      1,
                      (m as any).metalness + 0.05,
                    );
                  if ((m as any).roughness !== undefined)
                    (m as any).roughness = Math.max(
                      0.15,
                      (m as any).roughness - 0.05,
                    );
                });
              } else {
                const m = mesh.material as any;
                if (m?.metalness !== undefined)
                  m.metalness = Math.min(1, (m.metalness ?? 0.7) + 0.05);
                if (m?.roughness !== undefined)
                  m.roughness = Math.max(0.15, (m.roughness ?? 0.35) - 0.05);
              }
            }
          });

          resolve(model);
        },
        undefined,
        () => resolve(new THREE.Group()),
      );
    });
  }, [normalizeScaleAndGround]);

  // ------------------------------------------------
  //  SKY DOME
  // ------------------------------------------------
  const createSkyDome = useCallback(() => {
    const geometry = new THREE.SphereGeometry(500, 64, 64);

    const material = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor: { value: new THREE.Color(0x020515) },
        bottomColor: { value: new THREE.Color(0x040c25) },
        offset: { value: 20 },
        exponent: { value: 0.9 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;

        float rand(vec2 co){
          return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
        }

        void main() {
          float h = normalize( vWorldPosition + offset ).y;
          vec3 sky = mix( bottomColor, topColor, max( pow( max(h, 0.0), exponent ), 0.0 ) );

          float star = rand(vWorldPosition.xz * 0.02);
          float threshold = 0.995;
          float starMask = step(threshold, star);
          vec3 starColor = vec3(1.0, 1.0, 1.0) * starMask;

          gl_FragColor = vec4( sky + starColor, 1.0 );
        }
      `,
    });

    return new THREE.Mesh(geometry, material);
  }, []);

  // ------------------------------------------------
  //  GROUND & ROAD
  // ------------------------------------------------
  const createGround = useCallback(() => {
    const geometry = new THREE.PlaneGeometry(300, 300);
    const material = new THREE.MeshStandardMaterial({
      color: 0x05060a,
      metalness: 0.4,
      roughness: 0.85,
    });

    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;

    return ground;
  }, []);

  const createRoad = useCallback(() => {
    const group = new THREE.Group();

    const roadGeometry = new THREE.PlaneGeometry(18, 90);
    const roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f1116,
      metalness: 0.7,
      roughness: 0.33,
    });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.02, -6);
    road.receiveShadow = true;
    group.add(road);

    const stripeMaterial = new THREE.MeshStandardMaterial({
      color: 0x00eaff,
      emissive: 0x00eaff,
      emissiveIntensity: 1.75,
    });

    for (let i = -14; i <= 14; i++) {
      const stripeGeo = new THREE.PlaneGeometry(0.34, 2.0);
      const stripe = new THREE.Mesh(stripeGeo, stripeMaterial);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(0, 0.03, i * 3 - 6);
      group.add(stripe);
    }

    return group;
  }, []);

  // ------------------------------------------------
  //  CITY
  // ------------------------------------------------
  const createCity = useCallback(() => {
    const group = new THREE.Group();

    const leftMaterial = new THREE.MeshStandardMaterial({
      color: 0x0b1628,
      metalness: 0.7,
      roughness: 0.35,
    });
    const rightMaterial = new THREE.MeshStandardMaterial({
      color: 0x26100a,
      metalness: 0.7,
      roughness: 0.35,
    });

    const blueWindow = new THREE.MeshBasicMaterial({ color: 0x00eaff });
    const orangeWindow = new THREE.MeshBasicMaterial({ color: 0xff8a3c });

    const createBuildingRow = (
      side: 'left' | 'right',
      material: THREE.MeshStandardMaterial,
      windowMat: THREE.MeshBasicMaterial,
    ) => {
      const xBase = side === 'left' ? -20 : 20;
      for (let i = 0; i < 20; i++) {
        const height = 6 + Math.random() * 24;
        const width = 3 + Math.random() * 4;
        const depth = 3 + Math.random() * 4;

        const geom = new THREE.BoxGeometry(width, height, depth);
        const building = new THREE.Mesh(geom, material);
        const zPos = -34 + i * 3.3 + (Math.random() - 0.5) * 2;
        const xOffset = (Math.random() - 0.5) * 4;

        building.position.set(xBase + xOffset, height / 2, zPos);
        building.castShadow = true;
        building.receiveShadow = true;
        group.add(building);

        const rows = Math.floor(height / 2.4);
        for (let r = 0; r < rows; r++) {
          if (Math.random() < 0.35) continue;
          const winGeo = new THREE.PlaneGeometry(0.7, 1.1);
          const win = new THREE.Mesh(winGeo, windowMat);
          const xSign = side === 'left' ? 1 : -1;
          const x = building.position.x + xSign * (width / 2 + 0.02);
          const y = 1.5 + r * 2.3;
          const z = building.position.z + (Math.random() - 0.5) * (depth * 0.5);
          win.position.set(x, y, z);
          win.rotation.y = side === 'left' ? 0 : Math.PI;
          group.add(win);
        }
      }
    };

    createBuildingRow('left', leftMaterial, blueWindow);
    createBuildingRow('right', rightMaterial, orangeWindow);

    return group;
  }, []);

  // ------------------------------------------------
  //  ULIČNE LAMPE
  // ------------------------------------------------
  const createStreetLamps = useCallback(() => {
    const group = new THREE.Group();

    const poleMaterial = new THREE.MeshStandardMaterial({
      color: 0x151515,
      metalness: 0.9,
      roughness: 0.3,
    });

    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      emissive: 0x66d1ff,
      emissiveIntensity: 2.2,
      metalness: 0.8,
      roughness: 0.25,
    });

    const zPositions = [-30, -22, -14, -6, 2, 10, 18];

    zPositions.forEach((z) => {
      [-9.5, 9.5].forEach((xSide) => {
        const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 4.2, 8);
        const pole = new THREE.Mesh(poleGeo, poleMaterial);
        pole.position.set(xSide, 2.1, z);
        pole.castShadow = true;
        group.add(pole);

        const headGeo = new THREE.BoxGeometry(0.3, 0.35, 1.0);
        const head = new THREE.Mesh(headGeo, headMaterial);
        const dir = xSide > 0 ? -1 : 1;
        head.position.set(xSide + 0.35 * dir, 4, z);
        head.rotation.y = dir === 1 ? Math.PI / 2 : -Math.PI / 2;
        head.castShadow = true;
        group.add(head);

        const light = new THREE.PointLight(0x66ccff, 1.7, 14);
        light.position.copy(head.position);
        light.position.y += 0.05;
        group.add(light);
      });
    });

    return group;
  }, []);

  // ------------------------------------------------
  //  SEMAFORI
  // ------------------------------------------------
  const createTrafficLights = useCallback(() => {
    const group = new THREE.Group();
    trafficLightMaterialsRef.current = [];

    const poleMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      metalness: 0.9,
      roughness: 0.35,
    });

    const boxMaterial = new THREE.MeshStandardMaterial({
      color: 0x151515,
      metalness: 0.7,
      roughness: 0.4,
    });

    const createOne = (x: number, z: number, facing: 'north' | 'south') => {
      const poleGeo = new THREE.CylinderGeometry(0.09, 0.09, 4, 8);
      const pole = new THREE.Mesh(poleGeo, poleMaterial);
      pole.position.set(x, 2, z);
      group.add(pole);

      const boxGeo = new THREE.BoxGeometry(0.6, 1.6, 0.35);
      const box = new THREE.Mesh(boxGeo, boxMaterial);
      box.position.set(x, 3.3, z + (facing === 'north' ? 0.3 : -0.3));
      box.rotation.y = facing === 'north' ? 0 : Math.PI;
      group.add(box);

      const createLightMat = (color: number) =>
        new THREE.MeshStandardMaterial({
          color: color,
          emissive: color,
          emissiveIntensity: 0.2,
          metalness: 0.5,
          roughness: 0.3,
        });

      const redMat = createLightMat(0xff3333);
      const yellowMat = createLightMat(0xfff066);
      const greenMat = createLightMat(0x55ff88);

      const circleGeo = new THREE.SphereGeometry(0.12, 16, 16);

      const red = new THREE.Mesh(circleGeo, redMat);
      const yellow = new THREE.Mesh(circleGeo, yellowMat);
      const green = new THREE.Mesh(circleGeo, greenMat);

      const dz = facing === 'north' ? 0.18 : -0.18;

      red.position.set(x, 3.7, z + dz);
      yellow.position.set(x, 3.3, z + dz);
      green.position.set(x, 2.9, z + dz);

      group.add(red, yellow, green);

      trafficLightMaterialsRef.current.push({
        red: redMat,
        yellow: yellowMat,
        green: greenMat,
      });
    };

    [-2, 2].forEach((x) => {
      createOne(x, -6, 'north');
      createOne(x, -6, 'south');
      createOne(x, -20, 'north');
      createOne(x, -20, 'south');
    });

    return group;
  }, []);


  // ------------------------------------------------
  //  PORTAL
  // ------------------------------------------------
  const createPortal = useCallback(() => {
    const group = new THREE.Group();

    const frameThickness = 0.18;
    const frameSize = 4;

    group.userData.baseFrameSize = frameSize;

    const frameMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0aa7ff,
      emissive: 0x0088ff,
      emissiveIntensity: 2.2,
      metalness: 0.95,
      roughness: 0.12,
      clearcoat: 0.8,
      clearcoatRoughness: 0.2,
    });

    const topBar = new THREE.Mesh(
      new THREE.BoxGeometry(frameSize, frameThickness, frameThickness),
      frameMaterial,
    );
    topBar.position.y = frameSize / 2;
    group.add(topBar);

    const bottomBar = new THREE.Mesh(
      new THREE.BoxGeometry(frameSize, frameThickness, frameThickness),
      frameMaterial,
    );
    bottomBar.position.y = -frameSize / 2;
    group.add(bottomBar);

    const leftBar = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, frameSize, frameThickness),
      frameMaterial,
    );
    leftBar.position.x = -frameSize / 2;
    group.add(leftBar);

    const rightBar = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, frameSize, frameThickness),
      frameMaterial,
    );
    rightBar.position.x = frameSize / 2;
    group.add(rightBar);

    const portalPlaneGeometry = new THREE.PlaneGeometry(
      frameSize - 0.3,
      frameSize - 0.3,
      64,
      64,
    );
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
        uniform vec3 color3;
        varying vec2 vUv;

        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);
        }

        void main() {
          vec2 center = vUv - 0.5;
          float dist = length(center);
          float angle = atan(center.y, center.x);

          float swirl = sin(angle * 8.0 + time * 2.0 - dist * 15.0) * 0.5 + 0.5;
          float wave1 = sin(dist * 25.0 - time * 4.0) * 0.5 + 0.5;
          float wave2 = sin(dist * 15.0 - time * 3.0 + 1.5) * 0.5 + 0.5;
          float pattern = swirl * 0.4 + wave1 * 0.3 + wave2 * 0.3;

          float edge = smoothstep(0.5, 0.2, dist);
          float rim = smoothstep(0.4, 0.5, dist) * (1.0 - smoothstep(0.5, 0.6, dist));

          vec3 color = mix(color1, color2, pattern);
          color = mix(color, color3, rim * 2.0);

          float alpha = edge * (0.5 + pattern * 0.3) * intensity;
          alpha += rim * 0.8 * intensity;

          float sparkle = noise(vUv * 50.0 + time) * 0.12 * intensity;
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

    const coreGeometry = new THREE.SphereGeometry(0.25, 32, 32);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.85,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.name = 'core';
    group.add(core);

    const portalLight = new THREE.PointLight(0x00d4ff, 8, 20);
    portalLight.position.set(0, 0, 2);
    portalLight.name = 'portalLight';
    group.add(portalLight);

    group.position.y = -5;
    group.visible = false;

    return group;
  }, []);

  const fitPortalToVehicle = useCallback(
    (portal: THREE.Group, vehicle: THREE.Object3D) => {
      const baseFrameSize = Number(portal.userData.baseFrameSize ?? 4);
      const vSize = getObjectSize(vehicle);

      const target = Math.max(vSize.y, vSize.x) * 0.92;
      const s = target / baseFrameSize;

      portal.scale.setScalar(Math.max(0.7, Math.min(3.4, s)));
    },
    [getObjectSize],
  );

  // ------------------------------------------------
  //  GLAVNI EFFECT (scene setup)
  // ------------------------------------------------
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x02030a);
    sceneRef.current = scene;

    scene.add(createSkyDome());
    scene.add(createGround());
    scene.add(createRoad());
    scene.add(createCity());
    scene.add(createStreetLamps());
    scene.add(createTrafficLights());


    const camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 2000);
    camera.position.set(0, 6.6, 22.0);
    camera.lookAt(0, 2.2, -6.0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;

    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const composer = new EffectComposer(renderer);
    composerRef.current = composer;

    composer.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      1.15,
      0.42,
      0.8,
    );
    bloomPass.threshold = 0.12;
    bloomPass.strength = 1.15;
    bloomPass.radius = 0.52;
    composer.addPass(bloomPass);
    bloomPassRef.current = bloomPass;

    scene.add(new THREE.AmbientLight(0xffffff, 0.28));

    const moon = new THREE.DirectionalLight(0x99cfff, 1.55);
    moon.position.set(-12, 18, 12);
    moon.castShadow = true;
    moon.shadow.mapSize.set(2048, 2048);
    scene.add(moon);

    const centerNeon = new THREE.PointLight(0x00eaff, 2.0, 48);
    centerNeon.position.set(0, 4.5, -6);
    scene.add(centerNeon);

    createTaxiModel().then((taxi) => {
      taxi.position.set(TAXI_X, taxi.position.y, VEHICLES_Z);
      taxi.rotation.set(0, TAXI_YAW, 0);

      taxiBaseY.current = taxi.position.y;
      scene.add(taxi);
      taxiGroupRef.current = taxi;
    });

    createFoodDeliveryModel().then((food) => {
      food.position.set(MOTOR_X, food.position.y, VEHICLES_Z);
      food.rotation.set(0, MOTOR_YAW, 0);

      foodBaseY.current = food.position.y;
      scene.add(food);
      foodGroupRef.current = food;
    });

    const portal = createPortal();
    portal.position.set(0, 1.6, 0);
    scene.add(portal);
    portalRef.current = portal;

    setIntroComplete(true);
    onIntroComplete();

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      timeRef.current += 0.016;
      const t = timeRef.current;

      const warpV = warpVehicleRef.current;

      if (taxiGroupRef.current && taxiGroupRef.current !== warpV) {
        taxiGroupRef.current.position.y =
          taxiBaseY.current + Math.sin(t * 0.8) * 0.02;
      }
      if (foodGroupRef.current && foodGroupRef.current !== warpV) {
        foodGroupRef.current.position.y =
          foodBaseY.current + Math.sin(t * 0.8 + 1) * 0.02;
      }

      if (portalRef.current && portalRef.current.visible) {
        const portalPlane = portalRef.current.children.find(
          (c) => c.name === 'portalPlane',
        ) as THREE.Mesh | undefined;

        if (portalPlane) {
          const mat = portalPlane.material as THREE.ShaderMaterial;
          if (mat.uniforms?.time) mat.uniforms.time.value = t;
        }

        const core = portalRef.current.children.find(
          (c) => c.name === 'core',
        ) as THREE.Mesh | undefined;

        if (core) {
          const s = 1 + Math.sin(t * 3) * 0.2;
          core.scale.setScalar(s);
        }

        const portalLight = portalRef.current.children.find(
          (c) => c.name === 'portalLight',
        ) as THREE.PointLight | undefined;

        if (portalLight) {
          portalLight.intensity = 8 + Math.sin(t * 2) * 2;
        }
      }

      const cycle = 9;
      trafficLightMaterialsRef.current.forEach((mats, index) => {
        const localT = (t + index * 1.1) % cycle;

        const off = 0.15;
        let redI = off;
        let yellowI = off;
        let greenI = off;

        if (localT < 3) redI = 2.2;
        else if (localT < 6) greenI = 2.2;
        else yellowI = 2.0;

        mats.red.emissiveIntensity = redI;
        mats.yellow.emissiveIntensity = yellowI;
        mats.green.emissiveIntensity = greenI;
      });

      composer.render();
    };

    animate();

    const handleResize = () => {
      if (
        !cameraRef.current ||
        !rendererRef.current ||
        !composerRef.current ||
        !containerRef.current
      )
        return;

      const w = containerRef.current.clientWidth || window.innerWidth;
      const h = containerRef.current.clientHeight || window.innerHeight;

      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
      composerRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);

      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);

      if (composerRef.current) {
        // @ts-expect-error ovisi o three verziji
        if (composerRef.current?.dispose) composerRef.current.dispose();
      }

      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (rendererRef.current.domElement && containerRef.current) {
          try {
            containerRef.current.removeChild(rendererRef.current.domElement);
          } catch {
            // ignore
          }
        }
      }

      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      composerRef.current = null;
      bloomPassRef.current = null;
      taxiGroupRef.current = null;
      foodGroupRef.current = null;
      portalRef.current = null;
      warpVehicleRef.current = null;
      isWarpAnimatingRef.current = false;
    };
  }, [
    createSkyDome,
    createGround,
    createRoad,
    createCity,
    createStreetLamps,
    createTrafficLights,
    createPortal,
    createTaxiModel,
    createFoodDeliveryModel,
    onIntroComplete,
  ]);

  // ------------------------------------------------
  //  PORTAL WARP
  // ------------------------------------------------
  const triggerWarpAnimation = useCallback(
    (selectedWorld: 'taxi' | 'food') => {
      if (
        !portalRef.current ||
        !cameraRef.current ||
        !bloomPassRef.current ||
        isWarpAnimatingRef.current
      )
        return;

      const vehicle =
        selectedWorld === 'taxi'
          ? taxiGroupRef.current
          : foodGroupRef.current;
      if (!vehicle) return;

      isWarpAnimatingRef.current = true;
      onWorldSelect(selectedWorld);

      warpVehicleRef.current = vehicle;

      const portal = portalRef.current;
      const camera = cameraRef.current;
      const bloom = bloomPassRef.current;

      fitPortalToVehicle(portal, vehicle);

      const vPos = vehicle.position.clone();
      const vehicleX = vPos.x;
      const portalZ = vPos.z + 3.1;

      portal.visible = true;
      portal.position.set(vehicleX, 1.7, portalZ);

      const portalPlane = portal.children.find(
        (c) => c.name === 'portalPlane',
      ) as THREE.Mesh | undefined;
      const portalLight = portal.children.find(
        (c) => c.name === 'portalLight',
      ) as THREE.PointLight | undefined;

      let flashEl: HTMLDivElement | null = null;

      const tl = gsap.timeline({
        onComplete: () => {
          setTimeout(() => {
            navigate(selectedWorld === 'taxi' ? '/taxi' : '/food');
          }, 180);
        },
      });

      tl.to(
        camera.position,
        {
          x: vehicleX * 0.22,
          y: 4.9,
          z: 13.8,
          duration: 0.85,
          ease: 'power2.out',
          onUpdate: () => {
            camera.lookAt(vehicleX, 1.8, portalZ);
          },
        },
        0,
      );

      tl.to(
        portal.position,
        {
          y: 2.05,
          duration: 0.85,
          ease: 'power2.out',
        },
        0.15,
      );

      tl.to(
        bloom,
        {
          strength: 2.4,
          duration: 0.75,
        },
        0.15,
      );

      if (portalLight) {
        tl.to(
          portalLight,
          {
            intensity: 22,
            duration: 0.75,
          },
          0.15,
        );
      }

      if (portalPlane) {
        const mat = portalPlane.material as THREE.ShaderMaterial;
        if (mat.uniforms?.intensity) {
          tl.to(
            mat.uniforms.intensity,
            {
              value: 2.2,
              duration: 0.75,
            },
            0.15,
          );
        }
      }

      tl.to(
        vehicle.position,
        {
          x: vehicleX,
          y: 0.74,
          z: portalZ + 0.05,
          duration: 0.95,
          ease: 'power2.inOut',
        },
        1.05,
      );
      tl.to(
        vehicle.scale,
        {
          x: 0.25,
          y: 0.25,
          z: 0.25,
          duration: 0.95,
          ease: 'power2.in',
        },
        1.05,
      );
      tl.to(
        vehicle.rotation,
        {
          y: vehicle.rotation.y + Math.PI * 2,
          duration: 0.95,
          ease: 'power2.in',
        },
        1.05,
      );

      tl.add(() => {
        vehicle.visible = false;
      }, 2.05);

      tl.to(
        bloom,
        {
          strength: 4.8,
          duration: 0.25,
        },
        2.15,
      );

      if (portalLight) {
        tl.to(
          portalLight,
          {
            intensity: 55,
            duration: 0.25,
          },
          2.15,
        );
      }

      if (containerRef.current) {
        flashEl = document.createElement('div');
        flashEl.style.cssText = `
          position: fixed;
          inset: 0;
          background: white;
          opacity: 0;
          pointer-events: none;
          z-index: 100;
        `;
        containerRef.current.appendChild(flashEl);

        gsap.to(flashEl, { opacity: 1, duration: 0.2, delay: 2.18 });
        gsap.to(flashEl, {
          opacity: 0,
          duration: 0.25,
          delay: 2.45,
          onComplete: () => {
            flashEl?.remove();
            flashEl = null;
          },
        });
      }
    },
    [fitPortalToVehicle, navigate, onWorldSelect],
  );

  const handleClick = useCallback(
    (world: 'taxi' | 'food') => {
      if (!introComplete || isWarpAnimatingRef.current) return;
      triggerWarpAnimation(world);
    },
    [introComplete, triggerWarpAnimation],
  );

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <div ref={containerRef} className="absolute inset-0" />

      {/* Klik zone */}
      <div
        className="absolute left-0 top-0 w-1/2 h-full cursor-pointer z-10"
        onClick={() => handleClick('taxi')}
        onTouchEnd={(e) => {
          e.preventDefault();
          handleClick('taxi');
        }}
      />
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
