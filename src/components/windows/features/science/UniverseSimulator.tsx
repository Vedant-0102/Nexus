import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Play, Pause, RotateCcw, Zap, Sun, Camera, Thermometer, Scale, Globe2, Wind, Clock, Orbit, MoonStar, Ruler, Info, Sparkles, Target } from 'lucide-react';

interface PlanetData {
  name: string;
  radius: number;
  distance: number;
  color: number;
  speed: number;
}

interface PlanetInfo {
  type: string;
  diameter: string;
  mass: string;
  gravity: string;
  temperature: string;
  dayLength: string;
  yearLength: string;
  moons: number;
  notableMoons: string;
  atmosphere: string;
  description: string;
  distanceFromSun: string;
}

interface Vector3D {
  x: number;
  y: number;
  z: number;
}

interface CelestialBody {
  name: string;
  radius: number;
  distance: number;
  color: number;
  speed: number;
  angle: number;
  mesh?: THREE.Mesh;
  orbitLine?: THREE.Line;

  // New fields for interactive physics
  velocity: Vector3D;
  position: Vector3D;
  mass: number;
  isCustom: boolean;
  isDragging: boolean;
  trailHistory: Vector3D[];
  metadata: Record<string, any>;
}

/**
 * Migrates a planet from the old circular orbit model (speed/angle) to the new velocity-based physics model.
 * 
 * Conversion logic:
 * - Position: Calculated from distance and angle using polar coordinates
 * - Velocity: Calculated from angular velocity (speed * 0.001) and orbital radius
 * - Mass: Approximated as radius³ (volume-based approximation)
 * - New fields initialized with default values
 * 
 * @param planet - Planet data with old model (speed, angle, distance)
 * @param currentAngle - Current angle in radians for position calculation
 * @returns CelestialBody with all new fields initialized
 */
function migrateToVelocityModel(planet: PlanetData, currentAngle: number): Omit<CelestialBody, 'mesh' | 'orbitLine'> {
  const angle = currentAngle;
  const distance = planet.distance;

  // Calculate position from polar coordinates
  const position: Vector3D = {
    x: Math.cos(angle) * distance,
    y: 0,
    z: Math.sin(angle) * distance
  };

  // Calculate velocity for a stable circular orbit: v = sqrt(G * M_sun / r)
  // G_SIM = 500, sun mass = 3^3 = 27
  const G_SIM = 500;
  const sunMass = 27; // Sun radius (3) cubed
  const orbitalSpeed = distance > 0 ? Math.sqrt(G_SIM * sunMass / distance) : 0;

  // Velocity is perpendicular to position vector for circular orbit
  const velocity: Vector3D = {
    x: -Math.sin(angle) * orbitalSpeed,
    y: 0,
    z: Math.cos(angle) * orbitalSpeed
  };

  // Calculate mass from radius (mass = radius³ for approximation)
  const mass = planet.radius * planet.radius * planet.radius;
  
  return {
    ...planet,
    angle,
    position,
    velocity,
    mass,
    isCustom: false,
    isDragging: false,
    trailHistory: [],
    metadata: {}
  };
}


const planetInfoMap: Record<string, PlanetInfo> = {
  Sun: {
    type: 'Star',
    diameter: '1,392,700 km',
    mass: '1.989 x 10^30 kg',
    gravity: '274 m/s^2',
    temperature: '5,778 K (surface)',
    dayLength: '~25 days (equator)',
    yearLength: 'N/A',
    moons: 0,
    notableMoons: 'None',
    atmosphere: 'Hydrogen, Helium',
    description: 'The Sun is a yellow dwarf star at the center of our solar system. It contains 99.86% of the total mass and provides the energy that sustains life on Earth.',
    distanceFromSun: 'Center',
  },
  Mercury: {
    type: 'Terrestrial',
    diameter: '4,879 km',
    mass: '3.301 x 10^23 kg',
    gravity: '3.7 m/s^2',
    temperature: '-180 to 430 C',
    dayLength: '58.6 Earth days',
    yearLength: '88 Earth days',
    moons: 0,
    notableMoons: 'None',
    atmosphere: 'Minimal (thin exosphere)',
    description: 'The smallest planet and closest to the Sun. Despite its proximity, it\'s not the hottest planet due to lacking atmosphere to retain heat.',
    distanceFromSun: '57.9 million km (0.39 AU)',
  },
  Venus: {
    type: 'Terrestrial',
    diameter: '12,104 km',
    mass: '4.867 x 10^24 kg',
    gravity: '8.87 m/s^2',
    temperature: '462 C (average)',
    dayLength: '243 Earth days',
    yearLength: '225 Earth days',
    moons: 0,
    notableMoons: 'None',
    atmosphere: 'CO2 (96.5%), N2 (3.5%)',
    description: 'The hottest planet due to its dense CO2 atmosphere creating a runaway greenhouse effect. It rotates backwards compared to most planets.',
    distanceFromSun: '108.2 million km (0.72 AU)',
  },
  Earth: {
    type: 'Terrestrial',
    diameter: '12,756 km',
    mass: '5.972 x 10^24 kg',
    gravity: '9.81 m/s^2',
    temperature: '15 C (average)',
    dayLength: '24 hours',
    yearLength: '365.25 days',
    moons: 1,
    notableMoons: 'The Moon (Luna)',
    atmosphere: 'N2 (78%), O2 (21%), Ar (0.9%)',
    description: 'The only known planet to harbor life. It has liquid water on its surface and a protective magnetic field shielding it from solar radiation.',
    distanceFromSun: '149.6 million km (1.00 AU)',
  },
  Mars: {
    type: 'Terrestrial',
    diameter: '6,792 km',
    mass: '6.417 x 10^23 kg',
    gravity: '3.72 m/s^2',
    temperature: '-65 C (average)',
    dayLength: '24.6 hours',
    yearLength: '687 Earth days',
    moons: 2,
    notableMoons: 'Phobos, Deimos',
    atmosphere: 'CO2 (95%), N2 (2.7%), Ar (1.6%)',
    description: 'Known as the Red Planet due to iron oxide on its surface. It hosts Olympus Mons, the tallest volcano in the solar system at 21.9 km high.',
    distanceFromSun: '227.9 million km (1.52 AU)',
  },
  Jupiter: {
    type: 'Gas Giant',
    diameter: '142,984 km',
    mass: '1.898 x 10^27 kg',
    gravity: '24.79 m/s^2',
    temperature: '-110 C (cloud top)',
    dayLength: '9.9 hours',
    yearLength: '11.86 Earth years',
    moons: 95,
    notableMoons: 'Io, Europa, Ganymede, Callisto',
    atmosphere: 'H2 (89%), He (10%), CH4, NH3',
    description: 'The largest planet in our solar system. Its Great Red Spot is a storm larger than Earth that has been raging for over 350 years.',
    distanceFromSun: '778.6 million km (5.20 AU)',
  },
  Saturn: {
    type: 'Gas Giant',
    diameter: '120,536 km',
    mass: '5.683 x 10^26 kg',
    gravity: '10.44 m/s^2',
    temperature: '-140 C (cloud top)',
    dayLength: '10.7 hours',
    yearLength: '29.46 Earth years',
    moons: 146,
    notableMoons: 'Titan, Enceladus, Mimas, Rhea',
    atmosphere: 'H2 (96%), He (3%), CH4',
    description: 'Famous for its stunning ring system made of ice and rock. It is the least dense planet and would float in water if a large enough body existed.',
    distanceFromSun: '1.434 billion km (9.58 AU)',
  },
  Uranus: {
    type: 'Ice Giant',
    diameter: '51,118 km',
    mass: '8.681 x 10^25 kg',
    gravity: '8.87 m/s^2',
    temperature: '-195 C (cloud top)',
    dayLength: '17.2 hours',
    yearLength: '84.01 Earth years',
    moons: 28,
    notableMoons: 'Miranda, Ariel, Titania, Oberon',
    atmosphere: 'H2 (83%), He (15%), CH4 (2%)',
    description: 'Rotates on its side with an axial tilt of 98 degrees, likely from an ancient collision. Its blue-green color comes from methane in its atmosphere.',
    distanceFromSun: '2.871 billion km (19.18 AU)',
  },
  Neptune: {
    type: 'Ice Giant',
    diameter: '49,528 km',
    mass: '1.024 x 10^26 kg',
    gravity: '11.15 m/s^2',
    temperature: '-200 C (cloud top)',
    dayLength: '16.1 hours',
    yearLength: '164.8 Earth years',
    moons: 16,
    notableMoons: 'Triton, Proteus, Nereid',
    atmosphere: 'H2 (80%), He (19%), CH4 (1%)',
    description: 'Has the strongest winds in the solar system, reaching 2,100 km/h. Its largest moon Triton orbits in the opposite direction to Neptune\'s rotation.',
    distanceFromSun: '4.495 billion km (30.07 AU)',
  },
};

const typeBadgeStyle: Record<string, string> = {
  Star: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  Terrestrial: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  'Gas Giant': 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  'Ice Giant': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
};

const typeAccent: Record<string, string> = {
  Star: 'from-yellow-500/10 to-transparent border-yellow-500/20',
  Terrestrial: 'from-emerald-500/10 to-transparent border-emerald-500/20',
  'Gas Giant': 'from-orange-500/10 to-transparent border-orange-500/20',
  'Ice Giant': 'from-cyan-500/10 to-transparent border-cyan-500/20',
};

export const UniverseSimulator: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const bodiesRef = useRef<CelestialBody[]>([]);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const highlightedMeshRef = useRef<THREE.Mesh | null>(null);
  const isPlayingRef = useRef(true);
  const timeSpeedRef = useRef(1);
  const autoRotateRef = useRef(false);
  const cameraModeRef = useRef<'free' | 'follow'>('free');
  const selectedBodyRef = useRef<string>('Earth');
  const cameraAnimRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [timeSpeed, setTimeSpeed] = useState(1);
  const [selectedBody, setSelectedBody] = useState<string>('Earth');
  const [showOrbits, setShowOrbits] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [showDistances, setShowDistances] = useState(false);
  const [cameraMode, setCameraMode] = useState<'free' | 'follow'>('free');

  const planets: PlanetData[] = [
    { name: 'Sun', radius: 3, distance: 0, color: 0xFDB813, speed: 0 },
    { name: 'Mercury', radius: 0.4, distance: 8, color: 0x8C7853, speed: 4.15 },
    { name: 'Venus', radius: 0.9, distance: 11, color: 0xFFC649, speed: 1.62 },
    { name: 'Earth', radius: 1, distance: 15, color: 0x4A90E2, speed: 1 },
    { name: 'Mars', radius: 0.5, distance: 20, color: 0xE27B58, speed: 0.53 },
    { name: 'Jupiter', radius: 2.5, distance: 30, color: 0xC88B3A, speed: 0.08 },
    { name: 'Saturn', radius: 2.2, distance: 40, color: 0xFAD5A5, speed: 0.03 },
    { name: 'Uranus', radius: 1.5, distance: 50, color: 0x4FD0E7, speed: 0.01 },
    { name: 'Neptune', radius: 1.4, distance: 60, color: 0x4166F5, speed: 0.006 },
  ];

  // Keep refs in sync with state
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { timeSpeedRef.current = timeSpeed; }, [timeSpeed]);
  useEffect(() => { autoRotateRef.current = autoRotate; }, [autoRotate]);
  useEffect(() => { cameraModeRef.current = cameraMode; }, [cameraMode]);
  useEffect(() => { selectedBodyRef.current = selectedBody; }, [selectedBody]);

  // Single source of truth for the viewing distance so the fly-to transition
  // and follow mode land on exactly the same spot (they used to disagree, and
  // small planets like Mercury put the camera nearly inside the surface).
  const getFollowOffset = (body: { name: string; radius: number }) => {
    const d = body.name === 'Sun' ? 20 : Math.max(body.radius * 5, 6);
    return new THREE.Vector3(d, d * 0.5, d);
  };

  const focusPlanet = (name: string) => {
    setSelectedBody(name);
    // Selecting a body means "take me there and stay with it" — enable follow
    // so the camera keeps tracking the planet along its orbit after arrival.
    setCameraMode('follow');
    const body = bodiesRef.current.find(b => b.name === name);
    if (!body?.mesh || !controlsRef.current || !cameraRef.current) return;

    // Reset previous highlight
    if (highlightedMeshRef.current) {
      const prevBody = bodiesRef.current.find(b => b.mesh === highlightedMeshRef.current);
      if (prevBody?.mesh) {
        (prevBody.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(
          prevBody.name === 'Sun' ? prevBody.color : (prevBody.name === 'Earth' ? 0x1a3a5c : 0x000000)
        );
        (prevBody.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity =
          prevBody.name === 'Sun' ? 1.0 : (prevBody.name === 'Earth' ? 0.15 : 0);
      }
    }

    // Highlight new
    highlightedMeshRef.current = body.mesh;
    (body.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x00FFFF);
    (body.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5;
    
    // Smooth camera transition. The planet keeps orbiting during the flight,
    // so recompute the destination from its LIVE position every frame —
    // flying to a snapshot meant arriving where the planet used to be.
    const cameraOffset = getFollowOffset(body);
    const startPos = cameraRef.current.position.clone();
    const startTarget = controlsRef.current.target.clone();
    let progress = 0;

    // Cancel any ongoing camera animation
    if (cameraAnimRef.current) {
      cancelAnimationFrame(cameraAnimRef.current);
      cameraAnimRef.current = null;
    }

    const animateCamera = () => {
      const livePos = body.mesh!.position;
      const liveCameraPos = livePos.clone().add(cameraOffset);

      progress += 0.05;
      if (progress >= 1) {
        cameraRef.current!.position.copy(liveCameraPos);
        controlsRef.current!.target.copy(livePos);
        cameraAnimRef.current = null;
        return;
      }

      // Ease-out so the approach decelerates into the follow orbit
      const t = 1 - Math.pow(1 - progress, 3);
      cameraRef.current!.position.lerpVectors(startPos, liveCameraPos, t);
      controlsRef.current!.target.lerpVectors(startTarget, livePos, t);
      cameraAnimRef.current = requestAnimationFrame(animateCamera);
    };

    animateCamera();
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    // Space is always dark: the app is deliberately fixed-dark regardless of
    // the OS theme (white starfield + dark UI chrome need a dark scene).
    scene.background = new THREE.Color(0x000814);
    sceneRef.current = scene;

    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({ color: 0xFFFFFF, size: 0.7 });
    const starsVertices = [];
    for (let i = 0; i < 5000; i++) {
      starsVertices.push(
        (Math.random() - 0.5) * 2000,
        (Math.random() - 0.5) * 2000,
        (Math.random() - 0.5) * 2000
      );
    }
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    scene.add(new THREE.Points(starsGeometry, starsMaterial));

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      2000
    );
    camera.position.set(0, 50, 80);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 500;
    controls.enablePan = true;
    controlsRef.current = controls;

    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const sunLight = new THREE.PointLight(0xffffff, 2, 300);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // Sun glow
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 128;
    glowCanvas.height = 128;
    const glowCtx = glowCanvas.getContext('2d');
    if (glowCtx) {
      const gradient = glowCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
      gradient.addColorStop(0, 'rgba(253, 184, 19, 0.6)');
      gradient.addColorStop(0.3, 'rgba(253, 184, 19, 0.3)');
      gradient.addColorStop(0.6, 'rgba(253, 140, 19, 0.1)');
      gradient.addColorStop(1, 'rgba(253, 140, 19, 0)');
      glowCtx.fillStyle = gradient;
      glowCtx.fillRect(0, 0, 128, 128);
    }
    const sunGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(glowCanvas),
        transparent: true,
        blending: THREE.AdditiveBlending,
      })
    );
    sunGlow.scale.set(16, 16, 1);
    scene.add(sunGlow);

    const bodies: CelestialBody[] = planets.map(planet => {
      const geometry = new THREE.SphereGeometry(planet.radius, 48, 48);
      const material = new THREE.MeshStandardMaterial({
        color: planet.color,
        emissive: planet.name === 'Sun' ? planet.color : (planet.name === 'Earth' ? 0x1a3a5c : 0x000000),
        emissiveIntensity: planet.name === 'Sun' ? 1.0 : (planet.name === 'Earth' ? 0.15 : 0),
        roughness: planet.name === 'Sun' ? 1.0 : 0.7,
        metalness: planet.name === 'Sun' ? 0 : 0.1,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = planet.distance;
      scene.add(mesh);

      if (planet.name === 'Saturn') {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(planet.radius * 1.3, planet.radius * 2.3, 64),
          new THREE.MeshStandardMaterial({
            color: 0xd4a863,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7,
            roughness: 0.9,
          })
        );
        ring.rotation.x = Math.PI / 2.2;
        mesh.add(ring);
      }

      let orbitLine: THREE.Line | undefined;
      if (planet.distance > 0) {
        const orbitGeometry = new THREE.BufferGeometry();
        const orbitPoints = [];
        for (let i = 0; i <= 128; i++) {
          const angle = (i / 128) * Math.PI * 2;
          orbitPoints.push(Math.cos(angle) * planet.distance, 0, Math.sin(angle) * planet.distance);
        }
        orbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(orbitPoints, 3));
        orbitLine = new THREE.Line(orbitGeometry, new THREE.LineBasicMaterial({ color: 0x374151, transparent: true, opacity: 0.4 }));
        scene.add(orbitLine);
      }

      // Migrate planet to velocity-based model
      const currentAngle = Math.random() * Math.PI * 2;
      const migratedBody = migrateToVelocityModel(planet, currentAngle);

      return { ...migratedBody, mesh, orbitLine };
    });

    bodiesRef.current = bodies;

    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current || !cameraRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const meshes = bodies.map(b => b.mesh).filter((m): m is THREE.Mesh => m !== undefined);
      const intersects = raycasterRef.current.intersectObjects(meshes);
      if (intersects.length > 0) {
        const body = bodies.find(b => b.mesh === intersects[0].object);
        if (body) focusPlanet(body.name);
      }
    };
    renderer.domElement.addEventListener('click', handleClick);

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    let animationId: number;
    let lastTime = Date.now();
    
    // Gravitational constant for simulation (tuned for visual appearance)
    const G_SIM = 500;
    
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      // Calculate delta time in seconds
      const currentTime = Date.now();
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.05); // Cap at 50ms
      lastTime = currentTime;
      
      if (isPlayingRef.current) {
        const speed = timeSpeedRef.current;
        
        bodies.forEach(body => {
          if (body.distance > 0 && body.mesh) {
            // Apply gravitational force from the Sun (bodies[0])
            const sun = bodies[0];
            const dx = sun.position.x - body.position.x;
            const dy = sun.position.y - body.position.y;
            const dz = sun.position.z - body.position.z;
            const distSq = dx * dx + dy * dy + dz * dz;
            const dist = Math.sqrt(distSq);
            
            if (dist > 0.1) {
              const forceMag = G_SIM * sun.mass / distSq;
              body.velocity.x += (dx / dist) * forceMag * deltaTime * speed;
              body.velocity.y += (dy / dist) * forceMag * deltaTime * speed;
              body.velocity.z += (dz / dist) * forceMag * deltaTime * speed;
            }
            
            // Update position using velocity
            body.position.x += body.velocity.x * deltaTime * speed;
            body.position.y += body.velocity.y * deltaTime * speed;
            body.position.z += body.velocity.z * deltaTime * speed;
            
            // Update mesh position from physics position
            body.mesh.position.x = body.position.x;
            body.mesh.position.y = body.position.y;
            body.mesh.position.z = body.position.z;
            
            // Maintain backward compatibility: Update angle for any legacy code
            body.angle = Math.atan2(body.position.z, body.position.x);
          }
          if (body.mesh) body.mesh.rotation.y += 0.01;
        });
      }
      
      // Follow camera mode (using refs to avoid stale closures). Skipped while
      // the fly-to transition is animating so the two loops don't fight.
      if (cameraModeRef.current === 'follow' && !cameraAnimRef.current && cameraRef.current && controlsRef.current) {
        const followBody = bodies.find(b => b.name === selectedBodyRef.current);
        if (followBody?.mesh) {
          // Same offset as the fly-to transition, so arrival is seamless
          const targetPos = followBody.mesh.position.clone().add(getFollowOffset(followBody));
          cameraRef.current.position.lerp(targetPos, 0.08);
          controlsRef.current.target.lerp(followBody.mesh.position, 0.15);
        }
      } else if (autoRotateRef.current && cameraRef.current && controlsRef.current) {
        const time = Date.now() * 0.0001;
        const radius = Math.sqrt(cameraRef.current.position.x ** 2 + cameraRef.current.position.z ** 2);
        cameraRef.current.position.x = Math.cos(time) * radius;
        cameraRef.current.position.z = Math.sin(time) * radius;
        controlsRef.current.target.set(0, 0, 0);
      }
      
      controlsRef.current?.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      renderer.domElement.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      if (cameraAnimRef.current) cancelAnimationFrame(cameraAnimRef.current);
      controlsRef.current?.dispose();
      // Dispose GPU resources
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            (obj.material as THREE.Material).dispose();
          }
        } else if (obj instanceof THREE.Line) {
          obj.geometry.dispose();
          (obj.material as THREE.Material).dispose();
        } else if (obj instanceof THREE.Points) {
          obj.geometry.dispose();
          (obj.material as THREE.Material).dispose();
        } else if (obj instanceof THREE.Sprite) {
          (obj.material as THREE.SpriteMaterial).map?.dispose();
          (obj.material as THREE.Material).dispose();
        }
      });
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []); // Run only once on mount

  useEffect(() => {
    bodiesRef.current.forEach(body => {
      if (body.orbitLine) body.orbitLine.visible = showOrbits;
    });
  }, [showOrbits]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Number keys 1-9 to select planets
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        const planet = planets[num - 1];
        if (planet) focusPlanet(planet.name);
      }
      
      // Space to play/pause
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      }
      
      // O for orbits
      if (e.key === 'o' || e.key === 'O') {
        setShowOrbits(prev => !prev);
      }
      
      // F for follow mode
      if (e.key === 'f' || e.key === 'F') {
        setCameraMode(prev => prev === 'free' ? 'follow' : 'free');
      }
      
      // R for reset
      if (e.key === 'r' || e.key === 'R') {
        const G_SIM = 500;
        const sunMass = 27;
        bodiesRef.current.forEach(b => {
          const newAngle = Math.random() * Math.PI * 2;
          const orbitalSpeed = b.distance > 0 ? Math.sqrt(G_SIM * sunMass / b.distance) : 0;
          b.angle = newAngle;
          b.position = {
            x: Math.cos(newAngle) * b.distance,
            y: 0,
            z: Math.sin(newAngle) * b.distance
          };
          b.velocity = {
            x: -Math.sin(newAngle) * orbitalSpeed,
            y: 0,
            z: Math.cos(newAngle) * orbitalSpeed
          };
          if (b.mesh) {
            b.mesh.position.set(b.position.x, b.position.y, b.position.z);
          }
        });
        if (cameraRef.current && controlsRef.current) {
          cameraRef.current.position.set(0, 50, 80);
          controlsRef.current.target.set(0, 0, 0);
        }
      }
      
      // Arrow keys for speed
      if (e.key === 'ArrowUp') {
        setTimeSpeed(prev => Math.min(10, prev + 0.5));
      }
      if (e.key === 'ArrowDown') {
        setTimeSpeed(prev => Math.max(0.1, prev - 0.5));
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [planets]);

  const selectedInfo = planetInfoMap[selectedBody];
  const selectedPlanet = planets.find(p => p.name === selectedBody);
  const selectedColor = selectedPlanet ? `#${selectedPlanet.color.toString(16).padStart(6, '0')}` : '#fff';

  return (
    <div className="h-full flex bg-[#0a0e1a] overflow-hidden">
      {/* Left: 3D Scene */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Controls bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900/60 border-b border-gray-800/60">
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-semibold text-white">Solar System Explorer</span>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Playback controls */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="h-7 px-2 text-xs text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-md transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>

            {/* View controls */}
            <button
              onClick={() => setShowOrbits(!showOrbits)}
              className={`h-7 px-2 text-xs rounded-md transition-colors hover:bg-gray-700/50 ${showOrbits ? 'text-blue-400' : 'text-gray-300 hover:text-white'}`}
              title="Toggle Orbits"
            >
              <Orbit className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => setShowDistances(!showDistances)}
              className={`h-7 px-2 text-xs rounded-md transition-colors hover:bg-gray-700/50 ${showDistances ? 'text-blue-400' : 'text-gray-300 hover:text-white'}`}
              title="Show Distances"
            >
              <Ruler className="h-3.5 w-3.5" />
            </button>

            {/* Camera controls */}
            <div className="h-4 w-px bg-gray-700 mx-1" />

            <button
              onClick={() => setCameraMode(cameraMode === 'free' ? 'follow' : 'free')}
              className={`h-7 px-2 text-xs rounded-md transition-colors hover:bg-gray-700/50 ${cameraMode === 'follow' ? 'text-green-400' : 'text-gray-300 hover:text-white'}`}
              title={cameraMode === 'follow' ? 'Following Planet' : 'Free Camera'}
            >
              <Target className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`h-7 px-2 text-xs rounded-md transition-colors hover:bg-gray-700/50 ${autoRotate ? 'text-blue-400' : 'text-gray-300 hover:text-white'}`}
              title="Auto Rotate Camera"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => {
                const G_SIM = 500;
                const sunMass = 27;
                bodiesRef.current.forEach(b => {
                  const newAngle = Math.random() * Math.PI * 2;
                  const orbitalSpeed = b.distance > 0 ? Math.sqrt(G_SIM * sunMass / b.distance) : 0;
                  b.angle = newAngle;
                  b.position = {
                    x: Math.cos(newAngle) * b.distance,
                    y: 0,
                    z: Math.sin(newAngle) * b.distance
                  };
                  b.velocity = {
                    x: -Math.sin(newAngle) * orbitalSpeed,
                    y: 0,
                    z: Math.cos(newAngle) * orbitalSpeed
                  };
                  if (b.mesh) {
                    b.mesh.position.set(b.position.x, b.position.y, b.position.z);
                  }
                });
                if (cameraRef.current && controlsRef.current) {
                  cameraRef.current.position.set(0, 50, 80);
                  controlsRef.current.target.set(0, 0, 0);
                }
              }}
              className="h-7 px-2 text-xs text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-md transition-colors"
              title="Reset View"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>

            {/* Speed control */}
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-700">
              <Zap className="h-3 w-3 text-yellow-500" />
              <input
                type="range"
                value={timeSpeed}
                onChange={(e) => setTimeSpeed(parseFloat(e.target.value))}
                min={0.1}
                max={10}
                step={0.1}
                className="w-24 h-1.5 accent-yellow-500 cursor-pointer"
              />
              <span className="text-[10px] text-gray-400 w-8">{timeSpeed.toFixed(1)}x</span>
            </div>
          </div>
        </div>

        {/* 3D viewport */}
        <div className="flex-1 relative min-h-0">
          <div ref={containerRef} className="w-full h-full" />
          
          {/* Info overlay */}
          {showDistances && (
            <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-lg p-3 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-gray-300 mb-2">
                <Info className="h-3.5 w-3.5" />
                <span className="font-semibold">Current View</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">Selected:</span>
                  <span className="text-white font-medium">{selectedBody}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">Time Speed:</span>
                  <span className="text-white font-medium">{timeSpeed.toFixed(1)}x</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">Camera:</span>
                  <span className="text-white font-medium">{cameraMode === 'follow' ? 'Following' : 'Free'}</span>
                </div>
                {selectedPlanet && selectedPlanet.distance > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-400">Distance:</span>
                    <span className="text-white font-medium">{planetInfoMap[selectedBody]?.distanceFromSun || 'N/A'}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Controls hint */}
          <div className="absolute bottom-4 left-4 bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-lg px-3 py-2 text-[10px] text-gray-300 space-y-1 max-w-md">
            <div className="font-semibold text-gray-200 mb-1.5 flex items-center gap-1.5">
              <Info className="h-3 w-3" />
              Controls
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-gray-400">
              <div><span className="text-gray-300">Mouse:</span> Drag to rotate, scroll to zoom</div>
              <div><span className="text-gray-300">1-9:</span> Select planets</div>
              <div><span className="text-gray-300">Space:</span> Play/Pause</div>
              <div><span className="text-gray-300">O:</span> Toggle orbits</div>
              <div><span className="text-gray-300">F:</span> Follow mode</div>
              <div><span className="text-gray-300">R:</span> Reset view</div>
              <div><span className="text-gray-300">↑↓:</span> Adjust speed</div>
              <div><span className="text-gray-300">Click:</span> Select planet</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Planet Info Panel */}
      <div className="w-[380px] flex flex-col border-l border-gray-800/60 bg-gray-900/40">
        {/* Planet selector tabs */}
        <div className="flex flex-wrap gap-1 p-2 border-b border-gray-800/60 bg-gray-900/60">
          {planets.map(planet => {
            const isActive = selectedBody === planet.name;
            return (
              <button
                key={planet.name}
                onClick={() => focusPlanet(planet.name)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium transition-all ${
                  isActive
                    ? 'bg-blue-500/20 text-white border border-blue-500/40'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/60 border border-transparent'
                }`}
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: `#${planet.color.toString(16).padStart(6, '0')}`,
                    boxShadow: isActive ? `0 0 6px #${planet.color.toString(16).padStart(6, '0')}80` : 'none',
                  }}
                />
                {planet.name}
              </button>
            );
          })}
        </div>

        {/* Selected planet details */}
        {selectedInfo && (
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Planet header card */}
            <div className={`rounded-lg bg-gradient-to-br ${typeAccent[selectedInfo.type]} border p-4`}>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-8 h-8 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: selectedColor,
                    boxShadow: `0 0 20px ${selectedColor}60, 0 0 40px ${selectedColor}20`,
                  }}
                />
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedBody}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border inline-block ${typeBadgeStyle[selectedInfo.type]}`}>
                    {selectedInfo.type}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">{selectedInfo.description}</p>
            </div>

            {/* Physical Properties */}
            <div className="rounded-lg bg-gray-800/50 border-gray-700/50 p-3">
              <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Physical Properties</h4>
              <div className="grid grid-cols-2 gap-2.5">
                <StatItem icon={<Globe2 className="h-3.5 w-3.5" />} label="Diameter" value={selectedInfo.diameter} />
                <StatItem icon={<Scale className="h-3.5 w-3.5" />} label="Mass" value={selectedInfo.mass} />
                <StatItem icon={<Zap className="h-3.5 w-3.5" />} label="Gravity" value={selectedInfo.gravity} />
                <StatItem icon={<Thermometer className="h-3.5 w-3.5" />} label="Temperature" value={selectedInfo.temperature} />
              </div>
            </div>

            {/* Orbital Data */}
            <div className="rounded-lg bg-gray-800/50 border-gray-700/50 p-3">
              <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Orbital Data</h4>
              <div className="grid grid-cols-2 gap-2.5">
                <StatItem icon={<Clock className="h-3.5 w-3.5" />} label="Day Length" value={selectedInfo.dayLength} />
                <StatItem icon={<Orbit className="h-3.5 w-3.5" />} label="Year Length" value={selectedInfo.yearLength} />
                <StatItem icon={<Sun className="h-3.5 w-3.5" />} label="Dist. from Sun" value={selectedInfo.distanceFromSun} className="col-span-2" />
              </div>
            </div>

            {/* Atmosphere */}
            <div className="rounded-lg bg-gray-800/50 border-gray-700/50 p-3">
              <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Atmosphere</h4>
              <div className="flex items-start gap-2">
                <Wind className="h-3.5 w-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-white">{selectedInfo.atmosphere}</p>
              </div>
            </div>

            {/* Moons */}
            <div className="rounded-lg bg-gray-800/50 border-gray-700/50 p-3">
              <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Moons</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MoonStar className="h-3.5 w-3.5 text-gray-500" />
                  <span className="text-xs text-white">{selectedInfo.moons} known moon{selectedInfo.moons !== 1 ? 's' : ''}</span>
                </div>
                {selectedInfo.notableMoons !== 'None' && (
                  <div className="flex flex-wrap gap-1 ml-5">
                    {selectedInfo.notableMoons.split(', ').map(moon => (
                      <span key={moon} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700/60 text-gray-300 border border-gray-600/50">
                        {moon}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick comparison bar */}
            <div className="rounded-lg bg-gray-800/50 border-gray-700/50 p-3">
              <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Size Comparison</h4>
              <div className="space-y-1.5">
                {planets.filter(p => p.name !== 'Sun').map(planet => {
                  const maxRadius = 2.5; // Jupiter
                  const pct = (planet.radius / maxRadius) * 100;
                  const isThis = planet.name === selectedBody;
                  return (
                    <div key={planet.name} className="flex items-center gap-2">
                      <span className={`text-[10px] w-14 text-right ${isThis ? 'text-white font-semibold' : 'text-gray-500'}`}>
                        {planet.name}
                      </span>
                      <div className="flex-1 h-2 bg-gray-700/40 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: isThis ? selectedColor : `#${planet.color.toString(16).padStart(6, '0')}40`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Quick Facts */}
            <div className="rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 p-3">
              <div className="flex items-center gap-2 mb-2.5">
                <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                <h4 className="text-[11px] font-semibold text-blue-300 uppercase tracking-wider">Did You Know?</h4>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                {selectedBody === 'Sun' && "The Sun accounts for 99.86% of the mass in the solar system and could fit 1.3 million Earths inside it!"}
                {selectedBody === 'Mercury' && "Mercury has the most eccentric orbit of all planets, and a day on Mercury is longer than its year!"}
                {selectedBody === 'Venus' && "Venus rotates backwards and so slowly that its day is longer than its year. It's also the brightest natural object in the night sky after the Moon."}
                {selectedBody === 'Earth' && "Earth is the only planet not named after a god. It's also the densest planet in the solar system!"}
                {selectedBody === 'Mars' && "Mars has the largest dust storms in the solar system, lasting for months and covering the entire planet!"}
                {selectedBody === 'Jupiter' && "Jupiter's Great Red Spot is a storm that has been raging for at least 350 years and is larger than Earth!"}
                {selectedBody === 'Saturn' && "Saturn's rings are made of billions of pieces of ice and rock, some as small as grains of sand, others as large as mountains!"}
                {selectedBody === 'Uranus' && "Uranus rotates on its side at a 98-degree angle, likely due to a massive collision billions of years ago!"}
                {selectedBody === 'Neptune' && "Neptune has the fastest winds in the solar system, reaching speeds of 2,100 km/h - faster than the speed of sound!"}
              </p>
            </div>
            
            {/* Exploration Status */}
            <div className="rounded-lg bg-gray-800/50 border-gray-700/50 p-3">
              <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Exploration</h4>
              <div className="space-y-1.5 text-xs">
                {selectedBody === 'Sun' && <p className="text-gray-300">Studied by: Parker Solar Probe, SOHO, SDO</p>}
                {selectedBody === 'Mercury' && <p className="text-gray-300">Visited by: Mariner 10, MESSENGER, BepiColombo (en route)</p>}
                {selectedBody === 'Venus' && <p className="text-gray-300">Visited by: Venera missions, Magellan, Venus Express</p>}
                {selectedBody === 'Earth' && <p className="text-gray-300">Home to: 8+ billion humans, ISS, thousands of satellites</p>}
                {selectedBody === 'Mars' && <p className="text-gray-300">Active rovers: Perseverance, Curiosity • Orbiters: 8 active</p>}
                {selectedBody === 'Jupiter' && <p className="text-gray-300">Visited by: Pioneer, Voyager, Galileo, Juno (orbiting)</p>}
                {selectedBody === 'Saturn' && <p className="text-gray-300">Studied by: Cassini (2004-2017), Voyager flybys</p>}
                {selectedBody === 'Uranus' && <p className="text-gray-300">Visited by: Voyager 2 (1986) - only spacecraft to visit</p>}
                {selectedBody === 'Neptune' && <p className="text-gray-300">Visited by: Voyager 2 (1989) - only spacecraft to visit</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatItem = ({ icon, label, value, className = '' }: { icon: React.ReactNode; label: string; value: string; className?: string }) => (
  <div className={`flex items-start gap-2 ${className}`}>
    <div className="text-gray-500 mt-0.5 flex-shrink-0">{icon}</div>
    <div className="min-w-0">
      <div className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</div>
      <div className="text-xs text-white font-medium mt-0.5 break-words">{value}</div>
    </div>
  </div>
);
