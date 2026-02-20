import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Settings, Eye, Zap, Atom, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useWindows } from '../../../context/WindowsContext';

export const PhysicsLab: React.FC = () => {
  const { toggleWindow } = useWindows();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState('projectile');
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Projectile Motion
  const [velocity, setVelocity] = useState(30);
  const [angle, setAngle] = useState(45);
  const [gravity, setGravity] = useState(9.8);
  
  // Pendulum
  const [pendulumLength, setPendulumLength] = useState(200);
  const [pendulumAngle, setPendulumAngle] = useState(45);
  const [pendulumVelocity, setPendulumVelocity] = useState(0);
  
  // Spring
  const [springK, setSpringK] = useState(0.1);
  const [springMass, setSpringMass] = useState(1);
  const [springDisplacement, setSpringDisplacement] = useState(100);
  const [springVelocity, setSpringVelocity] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let animationId: number;
    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (activeTab === 'projectile' && isPlaying) {
        drawProjectileMotion(ctx, canvas, time);
        time += 0.05;
      } else if (activeTab === 'pendulum' && isPlaying) {
        drawPendulum(ctx, canvas);
      } else if (activeTab === 'spring' && isPlaying) {
        drawSpring(ctx, canvas);
      } else if (activeTab === 'collision') {
        drawCollision(ctx, canvas, time);
        if (isPlaying) time += 0.02;
      } else if (activeTab === 'waves') {
        drawWaves(ctx, canvas, time);
        if (isPlaying) time += 0.1;
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationId);
  }, [activeTab, isPlaying, velocity, angle, gravity, pendulumLength, pendulumAngle, pendulumVelocity, springK, springMass, springDisplacement, springVelocity]);

  const drawProjectileMotion = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, t: number) => {
    const x0 = 50;
    const y0 = canvas.height - 50;
    const v0 = velocity;
    const angleRad = (angle * Math.PI) / 180;
    
    const vx = v0 * Math.cos(angleRad);
    const vy = v0 * Math.sin(angleRad);
    
    const x = x0 + vx * t * 10;
    const y = y0 - (vy * t * 10 - 0.5 * gravity * t * t * 10);
    
    // Draw trajectory
    ctx.strokeStyle = '#4ECDC4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= t; i += 0.1) {
      const px = x0 + vx * i * 10;
      const py = y0 - (vy * i * 10 - 0.5 * gravity * i * i * 10);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    
    // Draw projectile
    if (y <= canvas.height - 50) {
      ctx.fillStyle = '#FF6B6B';
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw velocity vector
      ctx.strokeStyle = '#FFD93D';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + vx * 2, y - (vy - gravity * t) * 2);
      ctx.stroke();
    }
    
    // Draw ground
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 50);
    ctx.lineTo(canvas.width, canvas.height - 50);
    ctx.stroke();
  };

  const drawPendulum = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const pivotX = canvas.width / 2;
    const pivotY = 50;
    
    // Update pendulum physics
    const dt = 0.016;
    const angleRad = (pendulumAngle * Math.PI) / 180;
    const angularAccel = (-gravity / (pendulumLength / 100)) * Math.sin(angleRad);
    const newVelocity = pendulumVelocity + angularAccel * dt;
    const newAngle = pendulumAngle + newVelocity * dt * (180 / Math.PI);
    
    setPendulumVelocity(newVelocity * 0.999); // Damping
    setPendulumAngle(newAngle);
    
    const bobX = pivotX + pendulumLength * Math.sin(angleRad);
    const bobY = pivotY + pendulumLength * Math.cos(angleRad);
    
    // Draw string
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(bobX, bobY);
    ctx.stroke();
    
    // Draw pivot
    ctx.fillStyle = '#666';
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw bob
    ctx.fillStyle = '#FF6B6B';
    ctx.beginPath();
    ctx.arc(bobX, bobY, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw angle arc
    ctx.strokeStyle = '#4ECDC4';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 40, Math.PI / 2, Math.PI / 2 + angleRad);
    ctx.stroke();
  };

  const drawSpring = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const centerY = canvas.height / 2;
    const equilibrium = canvas.width / 2;
    
    // Update spring physics (Hooke's Law)
    const dt = 0.016;
    const force = -springK * springDisplacement;
    const acceleration = force / springMass;
    const newVelocity = (springVelocity + acceleration * dt) * 0.99; // Damping
    const newDisplacement = springDisplacement + newVelocity * dt * 60;
    
    setSpringVelocity(newVelocity);
    setSpringDisplacement(newDisplacement);
    
    const massX = equilibrium + springDisplacement;
    
    // Draw spring
    ctx.strokeStyle = '#4ECDC4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(50, centerY);
    
    const coils = 15;
    const coilWidth = (massX - 50) / coils;
    for (let i = 0; i < coils; i++) {
      const x = 50 + i * coilWidth;
      const y = centerY + (i % 2 === 0 ? -15 : 15);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(massX, centerY);
    ctx.stroke();
    
    // Draw mass
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(massX - 20, centerY - 20, 40, 40);
    
    // Draw equilibrium line
    ctx.strokeStyle = '#FFD93D';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(equilibrium, 0);
    ctx.lineTo(equilibrium, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const drawCollision = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, t: number) => {
    const y = canvas.height / 2;
    const ball1X = 100 + Math.sin(t) * 150;
    const ball2X = canvas.width - 100 - Math.sin(t) * 150;
    
    // Draw balls
    ctx.fillStyle = '#FF6B6B';
    ctx.beginPath();
    ctx.arc(ball1X, y, 30, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#4ECDC4';
    ctx.beginPath();
    ctx.arc(ball2X, y, 30, 0, Math.PI * 2);
    ctx.fill();
    
    // Check collision
    if (Math.abs(ball1X - ball2X) < 60) {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
      ctx.beginPath();
      ctx.arc((ball1X + ball2X) / 2, y, 50, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawWaves = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, t: number) => {
    const centerY = canvas.height / 2;
    
    // Draw wave 1
    ctx.strokeStyle = '#FF6B6B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x++) {
      const y = centerY + Math.sin((x + t * 10) * 0.02) * 50;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Draw wave 2
    ctx.strokeStyle = '#4ECDC4';
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x++) {
      const y = centerY + Math.sin((x + t * 10) * 0.02 + Math.PI / 2) * 50;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Draw interference
    ctx.strokeStyle = '#FFD93D';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x++) {
      const y1 = Math.sin((x + t * 10) * 0.02) * 50;
      const y2 = Math.sin((x + t * 10) * 0.02 + Math.PI / 2) * 50;
      const y = centerY + y1 + y2;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  const reset = () => {
    setIsPlaying(false);
    setPendulumAngle(45);
    setPendulumVelocity(0);
    setSpringDisplacement(100);
    setSpringVelocity(0);
  };

  return (
    <div className="h-full w-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="projectile">Projectile</TabsTrigger>
          <TabsTrigger value="pendulum">Pendulum</TabsTrigger>
          <TabsTrigger value="spring">Spring</TabsTrigger>
          <TabsTrigger value="collision">Collision</TabsTrigger>
          <TabsTrigger value="waves">Waves</TabsTrigger>
        </TabsList>

        <div className="mt-4 space-y-4">
          <Card className="p-4">
            <canvas
              ref={canvasRef}
              className="w-full h-96 bg-white dark:bg-gray-800 rounded-lg"
            />
          </Card>

          <Card className="p-4">
            <div className="flex gap-2 mb-4">
              <Button onClick={() => setIsPlaying(!isPlaying)} className="flex-1">
                {isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              <Button onClick={reset} variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>

            {activeTab === 'projectile' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Initial Velocity: {velocity} m/s</label>
                  <Slider value={[velocity]} onValueChange={(v) => setVelocity(v[0])} min={10} max={50} step={1} />
                </div>
                <div>
                  <label className="text-sm font-medium">Launch Angle: {angle}°</label>
                  <Slider value={[angle]} onValueChange={(v) => setAngle(v[0])} min={0} max={90} step={1} />
                </div>
                <div>
                  <label className="text-sm font-medium">Gravity: {gravity} m/s²</label>
                  <Slider value={[gravity]} onValueChange={(v) => setGravity(v[0])} min={1} max={20} step={0.1} />
                </div>
              </div>
            )}

            {activeTab === 'pendulum' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Length: {pendulumLength} px</label>
                  <Slider value={[pendulumLength]} onValueChange={(v) => setPendulumLength(v[0])} min={100} max={300} step={10} />
                </div>
                <div>
                  <label className="text-sm font-medium">Gravity: {gravity} m/s²</label>
                  <Slider value={[gravity]} onValueChange={(v) => setGravity(v[0])} min={1} max={20} step={0.1} />
                </div>
              </div>
            )}

            {activeTab === 'spring' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Spring Constant (k): {springK.toFixed(2)}</label>
                  <Slider value={[springK]} onValueChange={(v) => setSpringK(v[0])} min={0.01} max={0.5} step={0.01} />
                </div>
                <div>
                  <label className="text-sm font-medium">Mass: {springMass} kg</label>
                  <Slider value={[springMass]} onValueChange={(v) => setSpringMass(v[0])} min={0.5} max={5} step={0.1} />
                </div>
              </div>
            )}
          </Card>
        </div>
      </Tabs>
    </div>
  );
};
