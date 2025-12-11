import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, RotateCcw, Zap, Sun, Moon, Info, Camera } from 'lucide-react';

interface CelestialBody {
  name: string;
  radius: number;
  distance: number;
  color: number;
  speed: number;
  angle: number;
  mesh?: THREE.Mesh;
  orbitLine?: THREE.Line;
}

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
  const [isPlaying, setIsPlaying] = useState(true);
  const [timeSpeed, setTimeSpeed] = useState(1);
  const [selectedBody, setSelectedBody] = useState<CelestialBody | null>(null);
  const [showOrbits, setShowOrbits] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);

  const planets: Omit<CelestialBody, 'angle' | 'mesh' | 'orbitLine'>[] = [
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

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000814);
    sceneRef.current = scene;

    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({ color: 0xFFFFFF, size: 0.7 });
    const starsVertices = [];
    for (let i = 0; i < 5000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starsVertices.push(x, y, z);
    }
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

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
    controls.minDistance = 20;
    controls.maxDistance = 500;
    controls.enablePan = true;
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xffffff, 2, 300);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    const bodies: CelestialBody[] = planets.map(planet => {
      const geometry = new THREE.SphereGeometry(planet.radius, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        color: planet.color,
        emissive: planet.name === 'Sun' ? planet.color : 0x000000,
        emissiveIntensity: planet.name === 'Sun' ? 0.8 : 0,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = planet.distance;
      scene.add(mesh);

      let orbitLine: THREE.Line | undefined;
      if (planet.distance > 0) {
        const orbitGeometry = new THREE.BufferGeometry();
        const orbitPoints = [];
        for (let i = 0; i <= 64; i++) {
          const angle = (i / 64) * Math.PI * 2;
          orbitPoints.push(
            Math.cos(angle) * planet.distance,
            0,
            Math.sin(angle) * planet.distance
          );
        }
        orbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(orbitPoints, 3));
        const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.6 });
        orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
        scene.add(orbitLine);
      }

      return {
        ...planet,
        angle: Math.random() * Math.PI * 2,
        mesh,
        orbitLine,
      };
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
      
      if (highlightedMeshRef.current) {
        const prevBody = bodies.find(b => b.mesh === highlightedMeshRef.current);
        if (prevBody?.mesh) {
          (prevBody.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(
            prevBody.name === 'Sun' ? prevBody.color : 0x000000
          );
          (prevBody.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 
            prevBody.name === 'Sun' ? 0.8 : 0;
        }
        highlightedMeshRef.current = null;
      }

      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object as THREE.Mesh;
        const body = bodies.find(b => b.mesh === clickedMesh);
        if (body) {
          setSelectedBody(body);
          highlightedMeshRef.current = clickedMesh;
          (clickedMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x00FFFF);
          (clickedMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5;
          if (controlsRef.current && body.mesh) {
            controlsRef.current.target.copy(body.mesh.position);
          }
        }
      }
    };

    renderer.domElement.addEventListener('click', handleClick);

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (isPlaying) {
        bodies.forEach(body => {
          if (body.distance > 0 && body.mesh) {
            body.angle += body.speed * 0.001 * timeSpeed;
            body.mesh.position.x = Math.cos(body.angle) * body.distance;
            body.mesh.position.z = Math.sin(body.angle) * body.distance;
          }
          if (body.mesh) {
            body.mesh.rotation.y += 0.01;
          }
        });
      }

      if (autoRotate && cameraRef.current && controlsRef.current) {
        const time = Date.now() * 0.0001;
        const radius = Math.sqrt(
          cameraRef.current.position.x ** 2 + 
          cameraRef.current.position.z ** 2
        );
        cameraRef.current.position.x = Math.cos(time) * radius;
        cameraRef.current.position.z = Math.sin(time) * radius;
        controlsRef.current.target.set(0, 0, 0);
      }

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      renderer.domElement.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isPlaying, timeSpeed, autoRotate]);

  useEffect(() => {
    if (sceneRef.current) {
      bodiesRef.current.forEach(body => {
        if (body.orbitLine) {
          body.orbitLine.visible = showOrbits;
        }
      });
    }
  }, [showOrbits]);

  const handleReset = () => {
    bodiesRef.current.forEach(body => {
      body.angle = Math.random() * Math.PI * 2;
    });
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 to-indigo-950 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sun className="h-6 w-6 text-yellow-500" />
          <h2 className="text-2xl font-bold text-white">Universe Simulator</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsPlaying(!isPlaying)} className="gap-2">
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowOrbits(!showOrbits)} className="gap-2">
            <Moon className="h-4 w-4" />
            {showOrbits ? 'Hide' : 'Show'} Orbits
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAutoRotate(!autoRotate)} className="gap-2">
            <Camera className="h-4 w-4" />
            {autoRotate ? 'Manual' : 'Auto'} Camera
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      <div className="flex-1 relative">
        <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden border-2 border-slate-700" />

        <Card className="absolute top-4 left-4 p-4 bg-slate-900/90 backdrop-blur-sm border-slate-700 text-white">
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Time Speed: {timeSpeed}x</span>
              </div>
              <Slider
                value={[timeSpeed]}
                onValueChange={(value) => setTimeSpeed(value[0])}
                min={0.1}
                max={10}
                step={0.1}
                className="w-48"
              />
            </div>
          </div>
        </Card>

        <Card className="absolute top-4 right-4 p-4 bg-slate-900/90 backdrop-blur-sm border-slate-700 text-white max-w-xs">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-semibold">Solar System</span>
          </div>
          <div className="space-y-2 text-xs">
            {planets.map(planet => (
              <div
                key={planet.name}
                className="flex items-center justify-between p-2 rounded hover:bg-slate-800/50 cursor-pointer transition-colors"
                onClick={() => setSelectedBody(bodiesRef.current.find(b => b.name === planet.name) || null)}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: `#${planet.color.toString(16).padStart(6, '0')}` }}
                  />
                  <span>{planet.name}</span>
                </div>
                <span className="text-slate-400">{planet.distance > 0 ? `${planet.distance} AU` : 'Center'}</span>
              </div>
            ))}
          </div>
        </Card>

        {selectedBody && (
          <Card className="absolute bottom-4 left-4 right-4 p-4 bg-slate-900/90 backdrop-blur-sm border-slate-700 text-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">{selectedBody.name}</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedBody(null)} className="text-white hover:text-white">
                Close
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-slate-400">Radius</div>
                <div className="font-semibold mt-1">{selectedBody.radius.toFixed(1)} units</div>
              </div>
              <div>
                <div className="text-slate-400">Distance from Sun</div>
                <div className="font-semibold mt-1">{selectedBody.distance > 0 ? `${selectedBody.distance} AU` : 'Center'}</div>
              </div>
              <div>
                <div className="text-slate-400">Orbital Speed</div>
                <div className="font-semibold mt-1">{selectedBody.speed > 0 ? `${selectedBody.speed.toFixed(2)}x` : 'N/A'}</div>
              </div>
              <div>
                <div className="text-slate-400">Type</div>
                <div className="font-semibold mt-1">{selectedBody.name === 'Sun' ? 'Star' : 'Planet'}</div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
