import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Magnet, Radio, Play, Pause, RotateCcw } from 'lucide-react';

interface Charge {
  x: number;
  y: number;
  charge: number;
  velocity: { x: number; y: number };
}

export const ElectromagneticLab: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simTimeRef = useRef(0);
  const [activeTab, setActiveTab] = useState('electromagnetic');
  const [isRunning, setIsRunning] = useState(false);
  const [charges, setCharges] = useState<Charge[]>([
    { x: 200, y: 300, charge: 1, velocity: { x: 2, y: 0 } },
    { x: 600, y: 300, charge: -1, velocity: { x: -2, y: 0 } }
  ]);
  const [magneticField, setMagneticField] = useState([50]);
  const [electricField, setElectricField] = useState([30]);
  const [showFieldLines, setShowFieldLines] = useState(true);
  const [showVectors, setShowVectors] = useState(true);

  useEffect(() => {
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isRunning) return;
      simTimeRef.current += 0.016;
      updateCharges();
      drawScene();
    };
    animId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animId);
  }, [isRunning, charges, magneticField, electricField]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const d = window.devicePixelRatio || 1;
      canvas.width = r.width * d;
      canvas.height = r.height * d;
      ctx.scale(d, d);
    };
    resize();
    const obs = new ResizeObserver(() => { resize(); drawScene(); });
    obs.observe(canvas);
    drawScene();
    return () => obs.disconnect();
  }, [charges, activeTab, showFieldLines, showVectors, magneticField, electricField]);

  const updateCharges = () => {
    const canvas = canvasRef.current;
    const bounds = canvas ? canvas.getBoundingClientRect() : { width: 800, height: 600 };
    const maxX = bounds.width - 20;
    const maxY = bounds.height - 20;
    setCharges(prev => prev.map(charge => {
      const E = calculateElectricField(charge.x, charge.y, charge);
      const B = magneticField[0] / 100;

      // Lorentz force: F = q(E + v × B)
      const fx = charge.charge * (E.x + charge.velocity.y * B);
      const fy = charge.charge * (E.y - charge.velocity.x * B);

      let newVx = charge.velocity.x + fx * 0.01;
      let newVy = charge.velocity.y + fy * 0.01;

      let newX = charge.x + newVx;
      let newY = charge.y + newVy;

      // Boundary checks
      if (newX < 20 || newX > maxX) newVx *= -0.8;
      if (newY < 20 || newY > maxY) newVy *= -0.8;
      newX = Math.max(20, Math.min(maxX, newX));
      newY = Math.max(20, Math.min(maxY, newY));

      return { ...charge, x: newX, y: newY, velocity: { x: newVx * 0.99, y: newVy * 0.99 } };
    }));
  };

  const calculateElectricField = (x: number, y: number, excludeCharge: Charge) => {
    let Ex = electricField[0] / 1000;
    let Ey = 0;
    
    charges.forEach(charge => {
      if (charge === excludeCharge) return;
      const dx = x - charge.x;
      const dy = y - charge.y;
      const r = Math.sqrt(dx * dx + dy * dy);
      if (r > 1) {
        const k = charge.charge / (r * r * r);
        Ex += k * dx * 10;
        Ey += k * dy * 10;
      }
    });
    
    return { x: Ex, y: Ey };
  };

  const drawScene = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width: W, height: H } = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, W, H);
    const isDark = document.documentElement.classList.contains('dark');
    ctx.fillStyle = isDark ? '#080c18' : '#f8f9fc';
    ctx.fillRect(0, 0, W, H);

    if (activeTab === 'electromagnetic') {
      drawElectromagneticField(ctx, W, H);
    } else if (activeTab === 'induction') {
      drawInduction(ctx, W, H);
    } else if (activeTab === 'waves') {
      drawEMWaves(ctx, W, H);
    }
  };

  const drawElectromagneticField = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const isDark = document.documentElement.classList.contains('dark');
    // Draw magnetic field lines (horizontal)
    if (showFieldLines) {
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
      ctx.lineWidth = 2;
      for (let y = 50; y < H; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // Draw electric field lines (vertical)
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
      for (let x = 50; x < W; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
    }

    // Draw charges
    charges.forEach(charge => {
      ctx.beginPath();
      ctx.arc(charge.x, charge.y, 15, 0, Math.PI * 2);
      ctx.fillStyle = charge.charge > 0 ? '#ef4444' : '#3b82f6';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw velocity vector
      if (showVectors) {
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(charge.x, charge.y);
        ctx.lineTo(charge.x + charge.velocity.x * 10, charge.y + charge.velocity.y * 10);
        ctx.stroke();
      }
    });

    // Draw field strength indicators
    ctx.fillStyle = isDark ? '#e2e8f0' : '#1a1a2e';
    ctx.font = '14px Arial';
    ctx.fillText(`E-field: ${electricField[0]}%`, 10, 20);
    ctx.fillText(`B-field: ${magneticField[0]}%`, 10, 40);
  };

  const drawInduction = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const isDark = document.documentElement.classList.contains('dark');
    const time = simTimeRef.current;
    const centerX = W / 2;
    const centerY = H / 2;
    const coilRadius = 100;

    // Draw coil
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, coilRadius + i * 10, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw moving magnet
    const magnetY = centerY + Math.sin(time * 2) * 150;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(centerX - 40, magnetY - 15, 40, 30);
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(centerX, magnetY - 15, 40, 30);

    // Draw induced current
    const current = Math.cos(time * 2) * magneticField[0];
    ctx.strokeStyle = current > 0 ? '#22c55e' : '#ef4444';
    ctx.lineWidth = Math.abs(current) / 10;
    ctx.beginPath();
    ctx.arc(centerX, centerY, coilRadius + 30, 0, Math.PI * 2);
    ctx.stroke();

    // Labels
    ctx.fillStyle = isDark ? '#e2e8f0' : '#1a1a2e';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('Electromagnetic Induction', centerX - 100, 50);
    ctx.font = '14px Arial';
    ctx.fillText(`Induced Current: ${current.toFixed(1)}A`, centerX - 80, H - 50);
  };

  const drawEMWaves = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const time = simTimeRef.current;
    const centerY = H / 2;

    // Draw electric field wave
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x < W; x++) {
      const y = centerY + Math.sin((x - time * 100) * 0.02) * electricField[0];
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw magnetic field wave
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x < W; x++) {
      const y = centerY + Math.cos((x - time * 100) * 0.02) * magneticField[0];
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw propagation direction
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(W - 100, centerY);
    ctx.lineTo(W - 50, centerY);
    ctx.lineTo(W - 60, centerY - 10);
    ctx.moveTo(W - 50, centerY);
    ctx.lineTo(W - 60, centerY + 10);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('E (Electric)', 10, centerY - 60);
    ctx.fillStyle = '#8b5cf6';
    ctx.fillText('B (Magnetic)', 10, centerY + 80);
    ctx.fillStyle = '#22c55e';
    ctx.fillText('Direction', W - 120, centerY - 20);
  };

  const handleReset = () => {
    setIsRunning(false);
    setCharges([
      { x: 200, y: 300, charge: 1, velocity: { x: 2, y: 0 } },
      { x: 600, y: 300, charge: -1, velocity: { x: -2, y: 0 } }
    ]);
  };

  return (
    <div className="h-full w-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold dark:text-white">Electromagnetic Lab</h1>
            <p className="text-gray-600 dark:text-gray-400">Explore electric and magnetic fields</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="electromagnetic">
              <Zap className="h-4 w-4 mr-2" />
              EM Fields
            </TabsTrigger>
            <TabsTrigger value="induction">
              <Magnet className="h-4 w-4 mr-2" />
              Induction
            </TabsTrigger>
            <TabsTrigger value="waves">
              <Radio className="h-4 w-4 mr-2" />
              EM Waves
            </TabsTrigger>
          </TabsList>

          <div className="grid md:grid-cols-4 gap-4 mt-4">
            <Card className="md:col-span-3 p-4 dark:bg-gray-800">
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className="w-full border-2 border-gray-300 dark:border-gray-600 rounded bg-white"
              />
            </Card>

            <div className="space-y-4">
              <Card className="p-4 dark:bg-gray-800">
                <h3 className="font-bold mb-3 dark:text-white">Controls</h3>
                <div className="space-y-3">
                  <Button
                    onClick={() => setIsRunning(!isRunning)}
                    className={`w-full ${isRunning ? 'bg-yellow-500' : 'bg-green-500'}`}
                  >
                    {isRunning ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                    {isRunning ? 'Pause' : 'Start'}
                  </Button>
                  <Button onClick={handleReset} variant="outline" className="w-full">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </Card>

              <Card className="p-4 dark:bg-gray-800">
                <h3 className="font-bold mb-3 dark:text-white">Electric Field</h3>
                <Slider
                  value={electricField}
                  onValueChange={setElectricField}
                  min={0}
                  max={100}
                  step={5}
                  className="mb-2"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400">{electricField[0]}%</p>
              </Card>

              <Card className="p-4 dark:bg-gray-800">
                <h3 className="font-bold mb-3 dark:text-white">Magnetic Field</h3>
                <Slider
                  value={magneticField}
                  onValueChange={setMagneticField}
                  min={0}
                  max={100}
                  step={5}
                  className="mb-2"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400">{magneticField[0]}%</p>
              </Card>

              <Card className="p-4 dark:bg-gray-800">
                <h3 className="font-bold mb-3 dark:text-white">Display</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showFieldLines}
                      onChange={(e) => setShowFieldLines(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm dark:text-white">Field Lines</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showVectors}
                      onChange={(e) => setShowVectors(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm dark:text-white">Vectors</span>
                  </label>
                </div>
              </Card>
            </div>
          </div>
        </Tabs>

        <Card className="p-4 dark:bg-gray-800">
          <h3 className="font-bold mb-2 dark:text-white">About Electromagnetism</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Electromagnetism unifies electric and magnetic phenomena. Moving charges create magnetic fields, 
            and changing magnetic fields induce electric currents (Faraday's Law). Together, they form 
            electromagnetic waves that travel at the speed of light!
          </p>
        </Card>
      </div>
    </div>
  );
};
