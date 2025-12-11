import React, { useRef, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, RotateCw } from 'lucide-react';

interface Magnet {
  x: number;
  y: number;
  angle: number;
  id: number;
}

export const MagneticFieldVisualizer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [magnets, setMagnets] = useState<Magnet[]>([]);
  const [showCompass, setShowCompass] = useState(true);
  const animationRef = useRef<number>();

  useEffect(() => {
    const animate = () => {
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [magnets, showCompass]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newMagnet: Magnet = {
      x,
      y,
      angle: 0,
      id: Date.now()
    };

    setMagnets([...magnets, newMagnet]);
  };

  const rotateMagnet = (id: number) => {
    setMagnets(magnets.map(m => 
      m.id === id ? { ...m, angle: m.angle + 45 } : m
    ));
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#F5F5F5';
    ctx.fillRect(0, 0, width, height);

    // Draw field lines
    magnets.forEach(magnet => {
      drawFieldLines(ctx, magnet);
    });

    // Draw compass grid
    if (showCompass) {
      drawCompassGrid(ctx, width, height);
    }

    // Draw magnets
    magnets.forEach(magnet => {
      drawMagnet(ctx, magnet);
    });
  };

  const drawMagnet = (ctx: CanvasRenderingContext2D, magnet: Magnet) => {
    ctx.save();
    ctx.translate(magnet.x, magnet.y);
    ctx.rotate((magnet.angle * Math.PI) / 180);

    const width = 80;
    const height = 30;

    // North pole (red)
    ctx.fillStyle = '#FF5252';
    ctx.fillRect(-width / 2, -height / 2, width / 2, height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(-width / 2, -height / 2, width / 2, height);

    // South pole (blue)
    ctx.fillStyle = '#2196F3';
    ctx.fillRect(0, -height / 2, width / 2, height);
    ctx.strokeRect(0, -height / 2, width / 2, height);

    // Labels
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', -width / 4, 0);
    ctx.fillText('S', width / 4, 0);

    ctx.restore();
  };

  const drawFieldLines = (ctx: CanvasRenderingContext2D, magnet: Magnet) => {
    const numLines = 8;
    const magnetLength = 40;

    for (let i = 0; i < numLines; i++) {
      const offset = (i - numLines / 2) * 8;
      
      // Calculate north pole position
      const angleRad = (magnet.angle * Math.PI) / 180;
      const northX = magnet.x - magnetLength * Math.cos(angleRad);
      const northY = magnet.y - magnetLength * Math.sin(angleRad);
      
      // Start point offset perpendicular to magnet
      const perpAngle = angleRad + Math.PI / 2;
      const startX = northX + offset * Math.cos(perpAngle);
      const startY = northY + offset * Math.sin(perpAngle);

      drawFieldLine(ctx, startX, startY, magnet);
    }
  };

  const drawFieldLine = (ctx: CanvasRenderingContext2D, startX: number, startY: number, magnet: Magnet) => {
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(startX, startY);

    let x = startX;
    let y = startY;
    const maxSteps = 150;
    const stepSize = 2;

    for (let step = 0; step < maxSteps; step++) {
      const field = calculateMagneticField(x, y, magnet);
      const magnitude = Math.sqrt(field.x * field.x + field.y * field.y);

      if (magnitude < 0.001) break;

      x += (field.x / magnitude) * stepSize;
      y += (field.y / magnitude) * stepSize;

      if (x < 0 || x > 700 || y < 0 || y > 500) break;

      ctx.lineTo(x, y);
    }

    ctx.stroke();
  };

  const calculateMagneticField = (x: number, y: number, magnet: Magnet): { x: number; y: number } => {
    const angleRad = (magnet.angle * Math.PI) / 180;
    const magnetLength = 40;

    // North and South pole positions
    const northX = magnet.x - magnetLength * Math.cos(angleRad);
    const northY = magnet.y - magnetLength * Math.sin(angleRad);
    const southX = magnet.x + magnetLength * Math.cos(angleRad);
    const southY = magnet.y + magnetLength * Math.sin(angleRad);

    // Field from north pole (outward)
    const dxN = x - northX;
    const dyN = y - northY;
    const rN = Math.sqrt(dxN * dxN + dyN * dyN);

    // Field from south pole (inward)
    const dxS = x - southX;
    const dyS = y - southY;
    const rS = Math.sqrt(dxS * dxS + dyS * dyS);

    let Bx = 0;
    let By = 0;

    if (rN > 1) {
      const kN = 1 / (rN * rN * rN);
      Bx += kN * dxN;
      By += kN * dyN;
    }

    if (rS > 1) {
      const kS = -1 / (rS * rS * rS);
      Bx += kS * dxS;
      By += kS * dyS;
    }

    return { x: Bx, y: By };
  };

  const drawCompassGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const spacing = 40;

    for (let y = spacing; y < height; y += spacing) {
      for (let x = spacing; x < width; x += spacing) {
        drawCompassNeedle(ctx, x, y);
      }
    }
  };

  const drawCompassNeedle = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    let Bx = 0;
    let By = 0;

    magnets.forEach(magnet => {
      const field = calculateMagneticField(x, y, magnet);
      Bx += field.x;
      By += field.y;
    });

    const magnitude = Math.sqrt(Bx * Bx + By * By);
    if (magnitude < 0.001) return;

    const angle = Math.atan2(By, Bx);
    const length = Math.min(15, magnitude * 100);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // North end (red)
    ctx.strokeStyle = '#FF5252';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(length, 0);
    ctx.stroke();

    // South end (blue)
    ctx.strokeStyle = '#2196F3';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-length / 2, 0);
    ctx.stroke();

    ctx.restore();
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <h1 className="text-2xl font-bold dark:text-white mb-6">Magnetic Field Visualizer</h1>

      <div className="grid md:grid-cols-4 gap-6">
        <Card className="md:col-span-3 p-6 dark:bg-gray-800">
          <canvas
            ref={canvasRef}
            width={700}
            height={500}
            onClick={handleCanvasClick}
            className="w-full border-2 border-gray-300 dark:border-gray-600 rounded cursor-crosshair"
          />
        </Card>

        <div className="space-y-4">
          <Card className="p-4 dark:bg-gray-800">
            <h3 className="font-bold mb-3 dark:text-white">Controls</h3>
            
            <div className="space-y-2">
              <p className="text-sm dark:text-gray-300 mb-2">Click to add magnet</p>
              
              <Button
                onClick={() => setMagnets([])}
                variant="outline"
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>

              <label className="flex items-center space-x-2 cursor-pointer mt-3">
                <input
                  type="checkbox"
                  checked={showCompass}
                  onChange={(e) => setShowCompass(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm dark:text-white">Show Compass Grid</span>
              </label>
            </div>
          </Card>

          <Card className="p-4 dark:bg-gray-800">
            <h3 className="font-bold mb-3 dark:text-white">Magnets ({magnets.length})</h3>
            <div className="space-y-2 max-h-60 overflow-auto">
              {magnets.map((magnet, idx) => (
                <div key={magnet.id} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded">
                  <span className="text-sm dark:text-white">Magnet {idx + 1}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rotateMagnet(magnet.id)}
                  >
                    <RotateCw className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 dark:bg-gray-800">
            <h3 className="font-bold mb-2 text-sm dark:text-white">Info</h3>
            <div className="text-xs dark:text-gray-300 space-y-1">
              <p>• Red = North pole</p>
              <p>• Blue = South pole</p>
              <p>• Field lines go N → S</p>
              <p>• Click magnet to rotate</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
