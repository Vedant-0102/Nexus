import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Pause, RotateCcw, Rocket, Wind, Layers } from 'lucide-react';

interface RocketState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  fuel: number;
  totalMass: number;
  stage: number;
  stageJustSeparated: number;
}

interface FlameParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface SmokeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  alpha: number;
}

interface StarField {
  x: number;
  y: number;
  size: number;
  brightness: number;
  depth: number; // parallax depth (0-1)
}

interface GravityBody {
  name: string;
  g: number;
  radius: number; // in meters
  hasAtmosphere: boolean;
  atmosphereHeight: number; // in meters
  surfacePressure: number; // in kPa
}

const GRAVITY_BODIES: Record<string, GravityBody> = {
  earth: { name: 'Earth', g: 9.81, radius: 6371000, hasAtmosphere: true, atmosphereHeight: 100000, surfacePressure: 101.325 },
  moon: { name: 'Moon', g: 1.62, radius: 1737000, hasAtmosphere: false, atmosphereHeight: 0, surfacePressure: 0 },
  mars: { name: 'Mars', g: 3.72, radius: 3390000, hasAtmosphere: true, atmosphereHeight: 50000, surfacePressure: 0.636 },
  jupiter: { name: 'Jupiter', g: 24.79, radius: 69911000, hasAtmosphere: true, atmosphereHeight: 200000, surfacePressure: 100 },
};

const SCALE_FACTOR = 100; // 1 pixel = SCALE_FACTOR meters
const SPEED_OF_SOUND = 343; // m/s at sea level on Earth

export const RocketPropulsion = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [thrustPower, setThrustPower] = useState(80);
  const [fuelConsumption, setFuelConsumption] = useState(1.5);
  const [dryMass, setDryMass] = useState(500); // kg
  const [exhaustVelocity, setExhaustVelocity] = useState(3000); // m/s
  const [gravityBody, setGravityBody] = useState('earth');
  const [windEnabled, setWindEnabled] = useState(false);
  const [totalStages, setTotalStages] = useState(1);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(Date.now());

  const initialFuel = 1000; // kg of fuel
  const rocketRef = useRef<RocketState>({
    x: 400,
    y: 520,
    vx: 0,
    vy: 0,
    angle: -90,
    fuel: initialFuel,
    totalMass: dryMass + initialFuel,
    stage: 1,
    stageJustSeparated: 0,
  });

  const trailRef = useRef<{ x: number; y: number; alpha: number }[]>([]);
  const flameParticlesRef = useRef<FlameParticle[]>([]);
  const smokeParticlesRef = useRef<SmokeParticle[]>([]);
  const starsRef = useRef<StarField[]>([]);
  const cameraYRef = useRef(0);
  const windRef = useRef({ vx: 0, vy: 0, time: 0 });
  const separatedStagesRef = useRef<{ x: number; y: number; vy: number; alpha: number }[]>([]);
  const elapsedTimeRef = useRef(0);

  const [stats, setStats] = useState({
    altitude: 0,
    velocity: 0,
    acceleration: 0,
    fuel: initialFuel,
    time: 0,
    maxAltitude: 0,
    maxVelocity: 0,
    gForce: 1,
    momentum: 0,
    twr: 0,
    thrust: 0,
    specificImpulse: 0,
    massFlowRate: 0,
    deltaV: 0,
    dragForce: 0,
    machNumber: 0,
    atmosphericPressure: 101.325,
  });

  // Generate star field once
  useEffect(() => {
    const stars: StarField[] = [];
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * 800,
        y: Math.random() * 2000,
        size: Math.random() * 2.5 + 0.5,
        brightness: Math.random() * 0.7 + 0.3,
        depth: Math.random() * 0.8 + 0.2,
      });
    }
    starsRef.current = stars;
  }, []);

  const getGravityAtAltitude = useCallback((altitude: number) => {
    const body = GRAVITY_BODIES[gravityBody];
    const r = body.radius + altitude;
    return body.g * (body.radius * body.radius) / (r * r);
  }, [gravityBody]);

  const getAtmosphericDensity = useCallback((altitude: number) => {
    const body = GRAVITY_BODIES[gravityBody];
    if (!body.hasAtmosphere) return 0;
    if (altitude > body.atmosphereHeight) return 0;
    // Exponential atmosphere model
    const scaleHeight = body.atmosphereHeight / 7; // roughly 7 scale heights
    const surfaceDensity = body.surfacePressure / 101.325 * 1.225; // kg/m^3 relative to Earth
    return surfaceDensity * Math.exp(-altitude / scaleHeight);
  }, [gravityBody]);

  const getWindForce = useCallback((time: number) => {
    if (!windEnabled) return { wx: 0, wy: 0 };
    const wx = Math.sin(time * 0.5) * 15 + Math.sin(time * 1.7) * 8 + Math.sin(time * 0.2) * 20;
    const wy = Math.sin(time * 0.3) * 3;
    return { wx, wy };
  }, [windEnabled]);

  useEffect(() => {
    const animate = () => {
      if (isRunning) {
        update();
      }
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, thrustPower, fuelConsumption, dryMass, exhaustVelocity, gravityBody, windEnabled, totalStages]);

  const update = () => {
    const now = Date.now();
    const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = now;
    elapsedTimeRef.current += dt;

    const rocket = rocketRef.current;
    const body = GRAVITY_BODIES[gravityBody];

    // Altitude in meters (pixel space to real space)
    const groundY = 520;
    const altitudePixels = Math.max(0, groundY - rocket.y + cameraYRef.current);
    const altitudeMeters = altitudePixels * SCALE_FACTOR;

    // Gravity at current altitude
    const g = getGravityAtAltitude(altitudeMeters);

    let ax = 0;
    let ay = g; // gravity pulls down (positive y is down in canvas)

    // Current mass
    const currentMass = dryMass / totalStages * rocket.stage + rocket.fuel;
    rocket.totalMass = currentMass;

    let currentThrust = 0;
    let currentMassFlowRate = 0;

    // Apply thrust if fuel available
    if (rocket.fuel > 0 && thrustPower > 0) {
      currentMassFlowRate = fuelConsumption * (thrustPower / 100) * 10; // kg/s
      currentThrust = currentMassFlowRate * exhaustVelocity; // F = mdot * ve
      const thrustAccel = currentThrust / currentMass;
      const angleRad = (rocket.angle * Math.PI) / 180;

      ax += thrustAccel * Math.cos(angleRad);
      ay += thrustAccel * Math.sin(angleRad);

      // Consume fuel
      rocket.fuel -= currentMassFlowRate * dt;
      rocket.fuel = Math.max(0, rocket.fuel);

      // Spawn flame particles
      const baseAngle = angleRad + Math.PI; // opposite direction of thrust
      const flameCount = Math.floor(thrustPower / 20) + 2;
      for (let i = 0; i < flameCount; i++) {
        const spread = (Math.random() - 0.5) * 0.8;
        flameParticlesRef.current.push({
          x: rocket.x + Math.cos(baseAngle) * 12,
          y: rocket.y + Math.sin(baseAngle) * 12,
          vx: Math.cos(baseAngle + spread) * (80 + Math.random() * 60) + rocket.vx * 0.3,
          vy: Math.sin(baseAngle + spread) * (80 + Math.random() * 60) + rocket.vy * 0.3,
          life: 0.3 + Math.random() * 0.4,
          maxLife: 0.3 + Math.random() * 0.4,
          size: 2 + Math.random() * 4,
          color: Math.random() > 0.5 ? '#FFA500' : Math.random() > 0.5 ? '#FF4500' : '#FFFF00',
        });
      }

      // Spawn smoke
      if (Math.random() > 0.4) {
        smokeParticlesRef.current.push({
          x: rocket.x + Math.cos(baseAngle) * 18 + (Math.random() - 0.5) * 6,
          y: rocket.y + Math.sin(baseAngle) * 18 + (Math.random() - 0.5) * 6,
          vx: (Math.random() - 0.5) * 20 + rocket.vx * 0.1,
          vy: Math.random() * 15 + 5 + rocket.vy * 0.1,
          life: 1.5 + Math.random() * 1.5,
          maxLife: 1.5 + Math.random() * 1.5,
          size: 4 + Math.random() * 6,
          alpha: 0.4 + Math.random() * 0.3,
        });
      }
    }

    // Atmospheric drag
    const airDensity = getAtmosphericDensity(altitudeMeters);
    const speed = Math.sqrt(rocket.vx * rocket.vx + rocket.vy * rocket.vy);
    let dragForceMag = 0;
    if (speed > 0 && airDensity > 0) {
      const Cd = 0.3; // drag coefficient for rocket shape
      const crossSection = 0.5; // m^2
      dragForceMag = 0.5 * airDensity * speed * speed * Cd * crossSection;
      const dragAccel = dragForceMag / currentMass;
      ax -= (rocket.vx / speed) * dragAccel;
      ay -= (rocket.vy / speed) * dragAccel;
    }

    // Wind force
    const { wx, wy } = getWindForce(elapsedTimeRef.current);
    if (windEnabled && airDensity > 0) {
      const windForce = airDensity * 0.5;
      ax += (wx * windForce) / currentMass;
      ay += (wy * windForce) / currentMass;
    }
    windRef.current = { vx: wx, vy: wy, time: elapsedTimeRef.current };

    // Update velocity
    rocket.vx += ax * dt;
    rocket.vy += ay * dt;

    // Update position
    rocket.x += rocket.vx * dt;
    rocket.y += rocket.vy * dt;

    // Stage separation timer
    if (rocket.stageJustSeparated > 0) {
      rocket.stageJustSeparated -= dt;
    }

    // Ground collision
    if (rocket.y > groundY) {
      rocket.y = groundY;
      if (Math.abs(rocket.vy) > 2) {
        rocket.vy = -Math.abs(rocket.vy) * 0.2;
      } else {
        rocket.vy = 0;
      }
      rocket.vx *= 0.9;
    }

    // Side boundaries (wide area)
    if (rocket.x < 30) {
      rocket.x = 30;
      rocket.vx = Math.abs(rocket.vx) * 0.3;
    }
    if (rocket.x > 770) {
      rocket.x = 770;
      rocket.vx = -Math.abs(rocket.vx) * 0.3;
    }

    // Camera follow - smooth scrolling upward
    const targetCameraY = Math.max(0, groundY - rocket.y - 200);
    cameraYRef.current += (targetCameraY - cameraYRef.current) * 0.05;

    // Update trail
    trailRef.current.push({ x: rocket.x, y: rocket.y - cameraYRef.current, alpha: 1 });
    if (trailRef.current.length > 200) {
      trailRef.current.shift();
    }
    trailRef.current.forEach(p => { p.alpha *= 0.998; });

    // Update flame particles
    flameParticlesRef.current = flameParticlesRef.current.filter(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.size *= 0.97;
      return p.life > 0;
    });
    if (flameParticlesRef.current.length > 150) {
      flameParticlesRef.current = flameParticlesRef.current.slice(-150);
    }

    // Update smoke particles
    smokeParticlesRef.current = smokeParticlesRef.current.filter(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.life -= dt;
      p.size += dt * 8;
      p.alpha *= 0.99;
      return p.life > 0;
    });
    if (smokeParticlesRef.current.length > 100) {
      smokeParticlesRef.current = smokeParticlesRef.current.slice(-100);
    }

    // Update separated stages
    separatedStagesRef.current = separatedStagesRef.current.filter(s => {
      s.vy += g * dt;
      s.y += s.vy * dt;
      s.alpha -= dt * 0.3;
      return s.alpha > 0 && s.y < groundY + 100;
    });

    // Calculate stats
    const velocityMs = speed * SCALE_FACTOR;
    const accelerationTotal = Math.sqrt(ax * ax + ay * ay);
    const gForce = accelerationTotal / body.g;
    const machNumber = velocityMs / SPEED_OF_SOUND;
    const specificImpulse = exhaustVelocity / body.g;
    const m0 = dryMass + initialFuel;
    const mf = dryMass;
    const theoreticalDeltaV = exhaustVelocity * Math.log(m0 / mf);
    const currentWeight = currentMass * g;
    const twr = currentWeight > 0 ? currentThrust / currentWeight : 0;
    const pressure = body.hasAtmosphere ? body.surfacePressure * Math.exp(-altitudeMeters / (body.atmosphereHeight / 7)) : 0;

    setStats(prev => ({
      altitude: altitudeMeters,
      velocity: velocityMs,
      acceleration: accelerationTotal * SCALE_FACTOR,
      fuel: rocket.fuel,
      time: prev.time + dt,
      maxAltitude: Math.max(prev.maxAltitude, altitudeMeters),
      maxVelocity: Math.max(prev.maxVelocity, velocityMs),
      gForce,
      momentum: currentMass * velocityMs,
      twr,
      thrust: currentThrust,
      specificImpulse,
      massFlowRate: currentMassFlowRate,
      deltaV: theoreticalDeltaV,
      dragForce: dragForceMag,
      machNumber,
      atmosphericPressure: pressure,
    }));
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rocket = rocketRef.current;
    const W = canvas.width;
    const H = canvas.height;
    const camY = cameraYRef.current;
    const groundY = 520;
    const altitudeMeters = Math.max(0, (groundY - rocket.y + camY)) * SCALE_FACTOR;

    // --- SKY GRADIENT based on altitude ---
    const altFraction = Math.min(altitudeMeters / 80000, 1); // 0=ground, 1=space
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    if (altFraction < 0.3) {
      // Low altitude: blue sky
      const t = altFraction / 0.3;
      skyGrad.addColorStop(0, lerpColor('#1a3a5c', '#0a0a2e', t));
      skyGrad.addColorStop(0.5, lerpColor('#4a8bc2', '#1a2a5c', t));
      skyGrad.addColorStop(1, lerpColor('#87CEEB', '#3a5a8c', t));
    } else if (altFraction < 0.7) {
      // Mid altitude: darkening
      const t = (altFraction - 0.3) / 0.4;
      skyGrad.addColorStop(0, lerpColor('#0a0a2e', '#020210', t));
      skyGrad.addColorStop(0.5, lerpColor('#1a2a5c', '#050520', t));
      skyGrad.addColorStop(1, lerpColor('#3a5a8c', '#0a0a30', t));
    } else {
      // Space
      skyGrad.addColorStop(0, '#010108');
      skyGrad.addColorStop(0.5, '#020210');
      skyGrad.addColorStop(1, '#030318');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // --- STARS with parallax ---
    const starVisibility = Math.min(1, altFraction * 2.5);
    starsRef.current.forEach(star => {
      const parallaxY = (star.y - camY * star.depth * 0.3) % (H + 200) - 100;
      const parallaxX = star.x;
      if (parallaxY < -10 || parallaxY > H + 10) return;
      const alpha = star.brightness * starVisibility;
      if (alpha < 0.05) return;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(parallaxX, parallaxY, star.size, 0, Math.PI * 2);
      ctx.fill();
      // Twinkle
      if (Math.random() > 0.97 && star.size > 1.5) {
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.3})`;
        ctx.beginPath();
        ctx.arc(parallaxX, parallaxY, star.size * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // --- ALTITUDE MARKERS on the left side ---
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    const markerSpacing = 5000; // every 5000m
    const startMarker = Math.floor((camY * SCALE_FACTOR) / markerSpacing) * markerSpacing;
    for (let alt = startMarker; alt < startMarker + H * SCALE_FACTOR + markerSpacing; alt += markerSpacing) {
      const pixelY = groundY - alt / SCALE_FACTOR + camY;
      if (pixelY < 0 || pixelY > H) continue;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.moveTo(0, pixelY);
      ctx.lineTo(W, pixelY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      const altLabel = alt >= 1000 ? `${(alt / 1000).toFixed(0)} km` : `${alt} m`;
      ctx.fillText(altLabel, 8, pixelY - 3);
    }

    // --- GROUND TERRAIN ---
    const groundScreenY = groundY + camY;
    if (groundScreenY < H + 50) {
      // Main ground
      const groundGrad = ctx.createLinearGradient(0, groundScreenY, 0, groundScreenY + 80);
      groundGrad.addColorStop(0, '#3a7a20');
      groundGrad.addColorStop(0.2, '#2d5016');
      groundGrad.addColorStop(0.6, '#1a3a0a');
      groundGrad.addColorStop(1, '#0d1f05');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, groundScreenY, W, H - groundScreenY + 80);

      // Terrain bumps
      ctx.fillStyle = '#4a8a2a';
      ctx.beginPath();
      ctx.moveTo(0, groundScreenY);
      for (let tx = 0; tx <= W; tx += 10) {
        const bumpH = Math.sin(tx * 0.05) * 3 + Math.sin(tx * 0.12) * 2 + Math.sin(tx * 0.02) * 5;
        ctx.lineTo(tx, groundScreenY - bumpH);
      }
      ctx.lineTo(W, groundScreenY + 5);
      ctx.lineTo(0, groundScreenY + 5);
      ctx.closePath();
      ctx.fill();

      // Launch pad
      ctx.fillStyle = '#555';
      ctx.fillRect(380, groundScreenY - 3, 40, 6);
      ctx.fillStyle = '#777';
      ctx.fillRect(385, groundScreenY - 5, 30, 3);
      // Pad markings
      ctx.fillStyle = '#FF4444';
      ctx.fillRect(395, groundScreenY - 4, 10, 2);
    }

    // --- SMOKE PARTICLES ---
    smokeParticlesRef.current.forEach(p => {
      const screenY = p.y + camY;
      if (screenY < -20 || screenY > H + 20) return;
      const lifeRatio = p.life / p.maxLife;
      const alpha = p.alpha * lifeRatio;
      ctx.fillStyle = `rgba(180, 180, 180, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, screenY, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // --- EXHAUST TRAIL ---
    if (trailRef.current.length > 1) {
      for (let i = 1; i < trailRef.current.length; i++) {
        const p = trailRef.current[i];
        const prev = trailRef.current[i - 1];
        const t = i / trailRef.current.length;
        ctx.strokeStyle = `rgba(255, 120, 20, ${p.alpha * t * 0.4})`;
        ctx.lineWidth = 1 + t * 2;
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y + camY);
        ctx.lineTo(p.x, p.y + camY);
        ctx.stroke();
      }
    }

    // --- FLAME PARTICLES ---
    flameParticlesRef.current.forEach(p => {
      const screenY = p.y + camY;
      if (screenY < -20 || screenY > H + 20) return;
      const lifeRatio = p.life / p.maxLife;
      ctx.globalAlpha = lifeRatio;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, screenY, p.size * lifeRatio, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // --- SEPARATED STAGES ---
    separatedStagesRef.current.forEach(s => {
      const screenY = s.y + camY;
      ctx.globalAlpha = Math.max(0, s.alpha);
      ctx.fillStyle = '#888';
      ctx.fillRect(s.x - 6, screenY - 8, 12, 16);
      ctx.fillStyle = '#666';
      ctx.fillRect(s.x - 8, screenY + 4, 16, 5);
    });
    ctx.globalAlpha = 1;

    // --- ROCKET ---
    const rScreenY = rocket.y;
    ctx.save();
    ctx.translate(rocket.x, rScreenY + camY);
    ctx.rotate((rocket.angle * Math.PI) / 180 + Math.PI / 2);

    // Thruster flame (behind rocket)
    if (isRunning && rocket.fuel > 0 && thrustPower > 0) {
      const flameLen = (thrustPower / 100) * 30 + Math.random() * 8;
      const flameW = 5 + (thrustPower / 100) * 4;

      // Outer flame (red/orange)
      const outerGrad = ctx.createLinearGradient(0, 18, 0, 18 + flameLen);
      outerGrad.addColorStop(0, 'rgba(255, 100, 0, 0.9)');
      outerGrad.addColorStop(0.4, 'rgba(255, 60, 0, 0.7)');
      outerGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');
      ctx.fillStyle = outerGrad;
      ctx.beginPath();
      ctx.moveTo(-flameW, 18);
      ctx.quadraticCurveTo(-flameW * 0.5, 18 + flameLen * 0.6, 0, 18 + flameLen);
      ctx.quadraticCurveTo(flameW * 0.5, 18 + flameLen * 0.6, flameW, 18);
      ctx.closePath();
      ctx.fill();

      // Inner flame (yellow/white)
      const innerGrad = ctx.createLinearGradient(0, 18, 0, 18 + flameLen * 0.6);
      innerGrad.addColorStop(0, 'rgba(255, 255, 200, 0.95)');
      innerGrad.addColorStop(0.5, 'rgba(255, 255, 0, 0.7)');
      innerGrad.addColorStop(1, 'rgba(255, 200, 0, 0)');
      ctx.fillStyle = innerGrad;
      ctx.beginPath();
      ctx.moveTo(-flameW * 0.5, 18);
      ctx.quadraticCurveTo(-flameW * 0.2, 18 + flameLen * 0.4, 0, 18 + flameLen * 0.6);
      ctx.quadraticCurveTo(flameW * 0.2, 18 + flameLen * 0.4, flameW * 0.5, 18);
      ctx.closePath();
      ctx.fill();

      // Core flame (white hot)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.moveTo(-2, 18);
      ctx.lineTo(0, 18 + flameLen * 0.3);
      ctx.lineTo(2, 18);
      ctx.closePath();
      ctx.fill();

      // Glow around nozzle
      const glowGrad = ctx.createRadialGradient(0, 18, 2, 0, 18, 20);
      glowGrad.addColorStop(0, 'rgba(255, 200, 50, 0.3)');
      glowGrad.addColorStop(1, 'rgba(255, 100, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(0, 18, 20, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fins
    ctx.fillStyle = '#CC3333';
    ctx.strokeStyle = '#991111';
    ctx.lineWidth = 1;
    // Left fin
    ctx.beginPath();
    ctx.moveTo(-8, 12);
    ctx.lineTo(-16, 22);
    ctx.lineTo(-14, 22);
    ctx.lineTo(-8, 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Right fin
    ctx.beginPath();
    ctx.moveTo(8, 12);
    ctx.lineTo(16, 22);
    ctx.lineTo(14, 22);
    ctx.lineTo(8, 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Center fin (back)
    ctx.beginPath();
    ctx.moveTo(0, 14);
    ctx.lineTo(-2, 22);
    ctx.lineTo(2, 22);
    ctx.closePath();
    ctx.fill();

    // Nozzle
    ctx.fillStyle = '#444';
    ctx.beginPath();
    ctx.moveTo(-5, 16);
    ctx.lineTo(-7, 20);
    ctx.lineTo(7, 20);
    ctx.lineTo(5, 16);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.stroke();

    // Main body
    const bodyGrad = ctx.createLinearGradient(-10, 0, 10, 0);
    bodyGrad.addColorStop(0, '#B0B0B0');
    bodyGrad.addColorStop(0.3, '#E8E8E8');
    bodyGrad.addColorStop(0.5, '#FFFFFF');
    bodyGrad.addColorStop(0.7, '#E8E8E8');
    bodyGrad.addColorStop(1, '#A0A0A0');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(-9, 16);
    ctx.lineTo(-10, 4);
    ctx.lineTo(-9, -6);
    ctx.lineTo(9, -6);
    ctx.lineTo(10, 4);
    ctx.lineTo(9, 16);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Stage separation line (if multi-stage)
    if (totalStages > 1 && rocket.stage > 1) {
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(-10, 10);
      ctx.lineTo(10, 10);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Body stripes
    ctx.fillStyle = '#DD3333';
    ctx.fillRect(-10, -2, 20, 3);
    ctx.fillStyle = '#2244AA';
    ctx.fillRect(-10, 5, 20, 2);

    // Window
    ctx.fillStyle = '#66CCFF';
    ctx.strokeStyle = '#4488AA';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -1, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Window reflection
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(-1, -2, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Nose cone
    const noseGrad = ctx.createLinearGradient(-8, -6, 8, -6);
    noseGrad.addColorStop(0, '#CC2222');
    noseGrad.addColorStop(0.3, '#FF4444');
    noseGrad.addColorStop(0.5, '#FF5555');
    noseGrad.addColorStop(0.7, '#FF4444');
    noseGrad.addColorStop(1, '#AA1111');
    ctx.fillStyle = noseGrad;
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.quadraticCurveTo(-10, -8, -9, -6);
    ctx.lineTo(9, -6);
    ctx.quadraticCurveTo(10, -8, 0, -22);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#881111';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Nose tip highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.quadraticCurveTo(-5, -14, -4, -10);
    ctx.lineTo(-2, -10);
    ctx.quadraticCurveTo(-3, -14, 0, -20);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // --- VELOCITY VECTOR ---
    if ((rocket.vx !== 0 || rocket.vy !== 0) && isRunning) {
      const vScale = 3;
      const vMag = Math.sqrt(rocket.vx * rocket.vx + rocket.vy * rocket.vy);
      if (vMag > 0.5) {
        const endX = rocket.x + (rocket.vx / vMag) * Math.min(vMag * vScale, 60);
        const endY = rScreenY + camY + (rocket.vy / vMag) * Math.min(vMag * vScale, 60);

        ctx.strokeStyle = '#00FF88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(rocket.x, rScreenY + camY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        const angle = Math.atan2(rocket.vy, rocket.vx);
        ctx.fillStyle = '#00FF88';
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - 8 * Math.cos(angle - 0.4), endY - 8 * Math.sin(angle - 0.4));
        ctx.lineTo(endX - 8 * Math.cos(angle + 0.4), endY - 8 * Math.sin(angle + 0.4));
        ctx.closePath();
        ctx.fill();
      }
    }

    // --- HUD OVERLAY ---
    // Speed (Mach number)
    const mach = stats.machNumber;
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = mach > 1 ? '#FF6644' : 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(`Mach ${mach.toFixed(2)}`, W - 12, 20);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText(`${stats.velocity.toFixed(0)} m/s`, W - 12, 35);

    // Altitude on right
    const altKm = stats.altitude / 1000;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(`ALT: ${altKm >= 1 ? altKm.toFixed(2) + ' km' : stats.altitude.toFixed(0) + ' m'}`, W - 12, 55);

    // G-force indicator top-left
    ctx.textAlign = 'left';
    const gColor = stats.gForce > 8 ? '#FF3333' : stats.gForce > 4 ? '#FFAA00' : '#00FF88';
    ctx.fillStyle = gColor;
    ctx.fillText(`${stats.gForce.toFixed(1)} G`, 12, 20);

    // TWR top-left
    ctx.fillStyle = stats.twr > 1 ? '#00FF88' : '#FF6644';
    ctx.fillText(`TWR: ${stats.twr.toFixed(2)}`, 12, 35);

    // Wind indicator
    if (windEnabled) {
      const wind = windRef.current;
      ctx.fillStyle = 'rgba(150, 200, 255, 0.7)';
      ctx.font = '10px monospace';
      ctx.fillText(`Wind: ${wind.vx.toFixed(1)} m/s`, 12, 50);
    }

    // Fuel bar at bottom
    const fuelPct = rocket.fuel / initialFuel;
    const fuelBarW = 150;
    const fuelBarH = 10;
    const fuelBarX = W / 2 - fuelBarW / 2;
    const fuelBarY = H - 20;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(fuelBarX - 1, fuelBarY - 1, fuelBarW + 2, fuelBarH + 2);
    const fuelColor = fuelPct > 0.3 ? '#00CC66' : fuelPct > 0.1 ? '#FFAA00' : '#FF3333';
    ctx.fillStyle = fuelColor;
    ctx.fillRect(fuelBarX, fuelBarY, fuelBarW * fuelPct, fuelBarH);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.strokeRect(fuelBarX, fuelBarY, fuelBarW, fuelBarH);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`FUEL: ${(fuelPct * 100).toFixed(1)}%`, W / 2, fuelBarY - 3);
  };

  // Color lerp utility
  const lerpColor = (c1: string, c2: string, t: number): string => {
    const hex = (c: string) => {
      const h = c.replace('#', '');
      return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)];
    };
    const [r1, g1, b1] = hex(c1);
    const [r2, g2, b2] = hex(c2);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const rocket = rocketRef.current;
    const screenRocketY = rocket.y + cameraYRef.current;
    const dx = x - rocket.x;
    const dy = y - screenRocketY;
    rocket.angle = Math.atan2(dy, dx) * (180 / Math.PI);
  };

  const stagesSeparate = () => {
    const rocket = rocketRef.current;
    if (rocket.stage >= totalStages) return;

    // Drop current stage
    separatedStagesRef.current.push({
      x: rocket.x,
      y: rocket.y,
      vy: rocket.vy + 2,
      alpha: 1,
    });

    rocket.stage += 1;
    rocket.stageJustSeparated = 1;
    // Refill some fuel for next stage (smaller stages have less fuel)
    rocket.fuel = (initialFuel / totalStages) * (totalStages - rocket.stage + 1) * 0.6;
  };

  const reset = () => {
    rocketRef.current = {
      x: 400,
      y: 520,
      vx: 0,
      vy: 0,
      angle: -90,
      fuel: initialFuel,
      totalMass: dryMass + initialFuel,
      stage: 1,
      stageJustSeparated: 0,
    };
    trailRef.current = [];
    flameParticlesRef.current = [];
    smokeParticlesRef.current = [];
    separatedStagesRef.current = [];
    cameraYRef.current = 0;
    elapsedTimeRef.current = 0;
    setStats({
      altitude: 0,
      velocity: 0,
      acceleration: 0,
      fuel: initialFuel,
      time: 0,
      maxAltitude: 0,
      maxVelocity: 0,
      gForce: 1,
      momentum: 0,
      twr: 0,
      thrust: 0,
      specificImpulse: 0,
      massFlowRate: 0,
      deltaV: 0,
      dragForce: 0,
      machNumber: 0,
      atmosphericPressure: GRAVITY_BODIES[gravityBody].surfacePressure,
    });
    setIsRunning(false);
    lastTimeRef.current = Date.now();
  };

  const formatNumber = (n: number, decimals = 1) => {
    if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(decimals) + 'M';
    if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(decimals) + 'k';
    return n.toFixed(decimals);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4 overflow-auto">
      <h1 className="text-2xl font-bold dark:text-white mb-4 flex items-center gap-2">
        <Rocket className="h-6 w-6" />
        Rocket Propulsion Simulator
      </h1>

      <div className="grid lg:grid-cols-4 gap-4">
        {/* Canvas */}
        <Card className="lg:col-span-3 p-4 dark:bg-gray-800">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            onClick={handleCanvasClick}
            className="w-full border-2 border-gray-300 dark:border-gray-600 rounded cursor-crosshair"
          />
        </Card>

        {/* Right sidebar */}
        <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-180px)]">
          {/* Controls */}
          <Card className="p-3 dark:bg-gray-800">
            <h3 className="font-bold mb-2 dark:text-white text-sm">Controls</h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button onClick={() => { setIsRunning(!isRunning); lastTimeRef.current = Date.now(); }} className="flex-1" size="sm">
                  {isRunning ? <Pause className="h-3 w-3 mr-1" /> : <Play className="h-3 w-3 mr-1" />}
                  {isRunning ? 'Pause' : 'Launch'}
                </Button>
                <Button onClick={reset} variant="outline" size="sm">
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>

              <div>
                <Label className="text-xs">Thrust: {thrustPower}%</Label>
                <Input type="range" min="0" max="100" value={thrustPower}
                  onChange={(e) => setThrustPower(parseInt(e.target.value))} className="w-full h-6" />
              </div>

              <div>
                <Label className="text-xs">Fuel Rate: {fuelConsumption.toFixed(1)}</Label>
                <Input type="range" min="0.5" max="5" step="0.1" value={fuelConsumption}
                  onChange={(e) => setFuelConsumption(parseFloat(e.target.value))} className="w-full h-6" />
              </div>

              <div>
                <Label className="text-xs">Dry Mass: {dryMass} kg</Label>
                <Input type="range" min="100" max="5000" step="50" value={dryMass}
                  onChange={(e) => setDryMass(parseInt(e.target.value))} className="w-full h-6" />
              </div>

              <div>
                <Label className="text-xs">Exhaust Vel: {exhaustVelocity} m/s</Label>
                <Input type="range" min="500" max="10000" step="100" value={exhaustVelocity}
                  onChange={(e) => setExhaustVelocity(parseInt(e.target.value))} className="w-full h-6" />
              </div>

              <div>
                <Label className="text-xs">Gravity</Label>
                <Select value={gravityBody} onValueChange={(v) => setGravityBody(v)}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="earth">Earth (9.81 m/s2)</SelectItem>
                    <SelectItem value="moon">Moon (1.62 m/s2)</SelectItem>
                    <SelectItem value="mars">Mars (3.72 m/s2)</SelectItem>
                    <SelectItem value="jupiter">Jupiter (24.79 m/s2)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setWindEnabled(!windEnabled)} variant={windEnabled ? 'default' : 'outline'} size="sm" className="flex-1 text-xs">
                  <Wind className="h-3 w-3 mr-1" />
                  Wind {windEnabled ? 'ON' : 'OFF'}
                </Button>
              </div>

              <div>
                <Label className="text-xs">Stages: {totalStages}</Label>
                <Input type="range" min="1" max="3" step="1" value={totalStages}
                  onChange={(e) => setTotalStages(parseInt(e.target.value))} className="w-full h-6" />
              </div>

              {totalStages > 1 && (
                <Button onClick={stagesSeparate} variant="outline" size="sm" className="w-full text-xs">
                  <Layers className="h-3 w-3 mr-1" />
                  Stage Separation
                </Button>
              )}
            </div>
          </Card>

          {/* Stats */}
          <Card className="p-3 dark:bg-gray-800">
            <h3 className="font-bold mb-2 dark:text-white text-sm">Flight Data</h3>
            <div className="space-y-1 text-xs dark:text-gray-300">
              <div className="flex justify-between">
                <span>Altitude:</span>
                <span className="font-mono">{formatNumber(stats.altitude)} m</span>
              </div>
              <div className="flex justify-between">
                <span>Velocity:</span>
                <span className="font-mono">{formatNumber(stats.velocity)} m/s</span>
              </div>
              <div className="flex justify-between">
                <span>Mach:</span>
                <span className={`font-mono ${stats.machNumber > 1 ? 'text-orange-400' : ''}`}>{stats.machNumber.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>G-Force:</span>
                <span className={`font-mono ${stats.gForce > 8 ? 'text-red-400' : stats.gForce > 4 ? 'text-yellow-400' : ''}`}>{stats.gForce.toFixed(1)} G</span>
              </div>
              <div className="flex justify-between">
                <span>Fuel:</span>
                <span className="font-mono">{stats.fuel.toFixed(0)} kg</span>
              </div>
              <div className="flex justify-between">
                <span>Time:</span>
                <span className="font-mono">{stats.time.toFixed(1)} s</span>
              </div>
              <div className="flex justify-between">
                <span>Momentum:</span>
                <span className="font-mono">{formatNumber(stats.momentum)} kg*m/s</span>
              </div>
              <div className="flex justify-between">
                <span>TWR:</span>
                <span className={`font-mono ${stats.twr > 1 ? 'text-green-400' : 'text-red-400'}`}>{stats.twr.toFixed(2)}</span>
              </div>

              <div className="border-t border-gray-600 pt-1 mt-1">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Records</div>
                <div className="flex justify-between">
                  <span>Max Alt:</span>
                  <span className="font-mono text-blue-400">{formatNumber(stats.maxAltitude)} m</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Vel:</span>
                  <span className="font-mono text-blue-400">{formatNumber(stats.maxVelocity)} m/s</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Rocket Science Panel */}
          <Card className="p-3 dark:bg-gray-800">
            <h3 className="font-bold mb-2 dark:text-white text-sm">Rocket Science</h3>
            <div className="space-y-2 text-xs dark:text-gray-300">
              {/* Tsiolkovsky equation */}
              <div className="bg-gray-900/50 rounded p-2 border border-gray-700">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Tsiolkovsky Equation</div>
                <div className="font-mono text-center text-yellow-300 text-sm mb-1">
                  dv = ve * ln(m0/mf)
                </div>
                <div className="grid grid-cols-2 gap-x-2 text-[10px]">
                  <span className="text-gray-400">ve (exhaust):</span>
                  <span className="font-mono text-right">{exhaustVelocity} m/s</span>
                  <span className="text-gray-400">m0 (initial):</span>
                  <span className="font-mono text-right">{dryMass + initialFuel} kg</span>
                  <span className="text-gray-400">mf (empty):</span>
                  <span className="font-mono text-right">{dryMass} kg</span>
                  <span className="text-gray-400 font-bold">Theoretical dv:</span>
                  <span className="font-mono text-right text-green-400 font-bold">{formatNumber(stats.deltaV)} m/s</span>
                </div>
              </div>

              {/* Real-time calculations */}
              <div className="bg-gray-900/50 rounded p-2 border border-gray-700">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Propulsion</div>
                <div className="grid grid-cols-2 gap-x-2 text-[10px]">
                  <span className="text-gray-400">Thrust:</span>
                  <span className="font-mono text-right">{formatNumber(stats.thrust)} N</span>
                  <span className="text-gray-400">Isp:</span>
                  <span className="font-mono text-right">{stats.specificImpulse.toFixed(0)} s</span>
                  <span className="text-gray-400">Mass flow:</span>
                  <span className="font-mono text-right">{stats.massFlowRate.toFixed(1)} kg/s</span>
                </div>
              </div>

              {/* Forces diagram */}
              <div className="bg-gray-900/50 rounded p-2 border border-gray-700">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Forces</div>
                <div className="space-y-1">
                  {/* Thrust bar */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] w-10 text-gray-400">Thrust</span>
                    <div className="flex-1 h-2 bg-gray-700 rounded overflow-hidden">
                      <div className="h-full bg-green-500 rounded" style={{ width: `${Math.min(100, stats.thrust / ((dryMass + initialFuel) * GRAVITY_BODIES[gravityBody].g) * 100)}%` }} />
                    </div>
                  </div>
                  {/* Gravity bar */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] w-10 text-gray-400">Gravity</span>
                    <div className="flex-1 h-2 bg-gray-700 rounded overflow-hidden">
                      <div className="h-full bg-red-500 rounded" style={{ width: `${Math.min(100, ((rocketRef.current.totalMass || dryMass) * getGravityAtAltitude(stats.altitude)) / ((dryMass + initialFuel) * GRAVITY_BODIES[gravityBody].g) * 100)}%` }} />
                    </div>
                  </div>
                  {/* Drag bar */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] w-10 text-gray-400">Drag</span>
                    <div className="flex-1 h-2 bg-gray-700 rounded overflow-hidden">
                      <div className="h-full bg-yellow-500 rounded" style={{ width: `${Math.min(100, stats.dragForce / ((dryMass + initialFuel) * GRAVITY_BODIES[gravityBody].g) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Atmosphere info */}
              <div className="bg-gray-900/50 rounded p-2 border border-gray-700">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Atmosphere</div>
                <div className="grid grid-cols-2 gap-x-2 text-[10px]">
                  <span className="text-gray-400">Pressure:</span>
                  <span className="font-mono text-right">{stats.atmosphericPressure.toFixed(2)} kPa</span>
                  <span className="text-gray-400">Air density:</span>
                  <span className="font-mono text-right">{getAtmosphericDensity(stats.altitude).toFixed(4)} kg/m3</span>
                  <span className="text-gray-400">Gravity:</span>
                  <span className="font-mono text-right">{getGravityAtAltitude(stats.altitude).toFixed(2)} m/s2</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Instructions */}
          <Card className="p-3 dark:bg-gray-800">
            <h3 className="font-bold mb-1 text-xs dark:text-white">Instructions</h3>
            <div className="text-[10px] dark:text-gray-400 space-y-0.5">
              <p>Click canvas to aim rocket direction</p>
              <p>Green arrow shows velocity vector</p>
              <p>Sky darkens as you reach space</p>
              <p>TWR &gt; 1 needed to lift off</p>
              <p>Use staging for multi-stage rockets</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
