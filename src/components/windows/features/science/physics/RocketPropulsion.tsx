import React, { useRef, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface RocketState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  fuel: number;
}

export const RocketPropulsion = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [thrustPower, setThrustPower] = useState(50);
  const [fuelConsumption, setFuelConsumption] = useState(1);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(Date.now());
  
  const rocketRef = useRef<RocketState>({
    x: 400,
    y: 450,
    vx: 0,
    vy: 0,
    angle: -90, // pointing up
    fuel: 100
  });

  const trailRef = useRef<{ x: number; y: number }[]>([]);
  const [stats, setStats] = useState({
    altitude: 0,
    velocity: 0,
    acceleration: 0,
    fuel: 100,
    time: 0
  });

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
  }, [isRunning, thrustPower, fuelConsumption]);

  const update = () => {
    const now = Date.now();
    const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05); // max 50ms
    lastTimeRef.current = now;

    const rocket = rocketRef.current;
    const GRAVITY = 9.8;
    const DRAG_COEFFICIENT = 0.01;

    // Apply thrust if fuel available
    let ax = 0;
    let ay = GRAVITY; // gravity always pulls down

    if (rocket.fuel > 0) {
      const thrust = (thrustPower / 100) * 200;
      const angleRad = (rocket.angle * Math.PI) / 180;
      
      ax += thrust * Math.cos(angleRad);
      ay += thrust * Math.sin(angleRad) - GRAVITY; // counteract gravity

      // Consume fuel
      rocket.fuel -= fuelConsumption * dt * (thrustPower / 100);
      rocket.fuel = Math.max(0, rocket.fuel);
    }

    // Apply drag
    const speed = Math.sqrt(rocket.vx * rocket.vx + rocket.vy * rocket.vy);
    if (speed > 0) {
      const dragForce = DRAG_COEFFICIENT * speed * speed;
      ax -= (rocket.vx / speed) * dragForce;
      ay -= (rocket.vy / speed) * dragForce;
    }

    // Update velocity
    rocket.vx += ax * dt;
    rocket.vy += ay * dt;

    // Update position
    rocket.x += rocket.vx * dt;
    rocket.y += rocket.vy * dt;

    // Boundaries
    if (rocket.x < 20) {
      rocket.x = 20;
      rocket.vx = Math.abs(rocket.vx) * 0.5;
    }
    if (rocket.x > 780) {
      rocket.x = 780;
      rocket.vx = -Math.abs(rocket.vx) * 0.5;
    }
    if (rocket.y > 580) {
      rocket.y = 580;
      rocket.vy = -Math.abs(rocket.vy) * 0.3;
      rocket.vx *= 0.8;
    }
    if (rocket.y < 20) {
      rocket.y = 20;
      rocket.vy = Math.abs(rocket.vy) * 0.5;
    }

    // Add to trail
    trailRef.current.push({ x: rocket.x, y: rocket.y });
    if (trailRef.current.length > 100) {
      trailRef.current.shift();
    }

    // Update stats
    const altitude = Math.max(0, 600 - rocket.y);
    const velocity = Math.sqrt(rocket.vx * rocket.vx + rocket.vy * rocket.vy);
    const acceleration = Math.sqrt(ax * ax + ay * ay);

    setStats({
      altitude: altitude,
      velocity: velocity,
      acceleration: acceleration,
      fuel: rocket.fuel,
      time: stats.time + dt
    });
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rocket = rocketRef.current;

    // Clear canvas
    ctx.fillStyle = '#000814';
    ctx.fillRect(0, 0, 800, 600);

    // Draw stars
    ctx.fillStyle = '#FFF';
    for (let i = 0; i < 50; i++) {
      const x = (i * 137) % 800;
      const y = (i * 211) % 600;
      ctx.fillRect(x, y, 2, 2);
    }

    // Draw ground
    ctx.fillStyle = '#2D5016';
    ctx.fillRect(0, 580, 800, 20);

    // Draw trail
    ctx.strokeStyle = 'rgba(255, 100, 0, 0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    trailRef.current.forEach((point, i) => {
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();

    // Draw velocity vector
    if (rocket.vx !== 0 || rocket.vy !== 0) {
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rocket.x, rocket.y);
      ctx.lineTo(rocket.x + rocket.vx * 5, rocket.y + rocket.vy * 5);
      ctx.stroke();

      // Arrow head
      const angle = Math.atan2(rocket.vy, rocket.vx);
      const arrowSize = 10;
      ctx.fillStyle = '#00FF00';
      ctx.beginPath();
      ctx.moveTo(rocket.x + rocket.vx * 5, rocket.y + rocket.vy * 5);
      ctx.lineTo(
        rocket.x + rocket.vx * 5 - arrowSize * Math.cos(angle - Math.PI / 6),
        rocket.y + rocket.vy * 5 - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        rocket.x + rocket.vx * 5 - arrowSize * Math.cos(angle + Math.PI / 6),
        rocket.y + rocket.vy * 5 - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
    }

    // Draw rocket
    ctx.save();
    ctx.translate(rocket.x, rocket.y);
    ctx.rotate((rocket.angle * Math.PI) / 180);

    // Rocket body
    ctx.fillStyle = '#E0E0E0';
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(-8, 10);
    ctx.lineTo(8, 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Rocket nose
    ctx.fillStyle = '#FF5252';
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(-6, -10);
    ctx.lineTo(6, -10);
    ctx.closePath();
    ctx.fill();

    // Thrust flame
    if (isRunning && rocket.fuel > 0) {
      const flameSize = (thrustPower / 100) * 20;
      ctx.fillStyle = '#FFA500';
      ctx.beginPath();
      ctx.moveTo(-6, 10);
      ctx.lineTo(0, 10 + flameSize);
      ctx.lineTo(6, 10);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#FFFF00';
      ctx.beginPath();
      ctx.moveTo(-3, 10);
      ctx.lineTo(0, 10 + flameSize * 0.6);
      ctx.lineTo(3, 10);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rocket = rocketRef.current;
    const dx = x - rocket.x;
    const dy = y - rocket.y;
    rocket.angle = Math.atan2(dy, dx) * (180 / Math.PI);
  };

  const reset = () => {
    rocketRef.current = {
      x: 400,
      y: 450,
      vx: 0,
      vy: 0,
      angle: -90,
      fuel: 100
    };
    trailRef.current = [];
    setStats({
      altitude: 0,
      velocity: 0,
      acceleration: 0,
      fuel: 100,
      time: 0
    });
    setIsRunning(false);
    lastTimeRef.current = Date.now();
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <h1 className="text-2xl font-bold dark:text-white mb-6">Rocket Propulsion Simulator</h1>

      <div className="grid md:grid-cols-4 gap-6">
        <Card className="md:col-span-3 p-6 dark:bg-gray-800">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            onClick={handleCanvasClick}
            className="w-full border-2 border-gray-300 dark:border-gray-600 rounded cursor-crosshair"
          />
        </Card>

        <div className="space-y-4">
          <Card className="p-4 dark:bg-gray-800">
            <h3 className="font-bold mb-3 dark:text-white">Controls</h3>
            
            <div className="space-y-3">
              <Button
                onClick={() => setIsRunning(!isRunning)}
                className="w-full"
              >
                {isRunning ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                {isRunning ? 'Pause' : 'Start'}
              </Button>

              <Button
                onClick={reset}
                variant="outline"
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>

              <div>
                <Label>Thrust Power: {thrustPower}%</Label>
                <Input
                  type="range"
                  min="0"
                  max="100"
                  value={thrustPower}
                  onChange={(e) => setThrustPower(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <Label>Fuel Rate: {fuelConsumption.toFixed(1)}</Label>
                <Input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={fuelConsumption}
                  onChange={(e) => setFuelConsumption(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </Card>

          <Card className="p-4 dark:bg-gray-800">
            <h3 className="font-bold mb-3 dark:text-white">Stats</h3>
            <div className="space-y-2 text-sm dark:text-gray-300">
              <div className="flex justify-between">
                <span>Altitude:</span>
                <span className="font-mono">{stats.altitude.toFixed(1)} m</span>
              </div>
              <div className="flex justify-between">
                <span>Velocity:</span>
                <span className="font-mono">{stats.velocity.toFixed(1)} m/s</span>
              </div>
              <div className="flex justify-between">
                <span>Acceleration:</span>
                <span className="font-mono">{stats.acceleration.toFixed(1)} m/s²</span>
              </div>
              <div className="flex justify-between">
                <span>Fuel:</span>
                <span className="font-mono">{stats.fuel.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Time:</span>
                <span className="font-mono">{stats.time.toFixed(1)} s</span>
              </div>
            </div>
          </Card>

          <Card className="p-4 dark:bg-gray-800">
            <h3 className="font-bold mb-2 text-sm dark:text-white">Instructions</h3>
            <div className="text-xs dark:text-gray-300 space-y-1">
              <p>• Click to change direction</p>
              <p>• Green arrow = velocity</p>
              <p>• Orange trail = path</p>
              <p>• Adjust thrust & fuel rate</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
