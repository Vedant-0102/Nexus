import React, { useRef, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Trash2 } from 'lucide-react';

interface Charge {
  x: number;
  y: number;
  q: number; // charge magnitude (positive or negative)
  id: number;
}

export const ElectricFieldVisualizer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [chargeType, setChargeType] = useState<'positive' | 'negative'>('positive');
  const [showPotential, setShowPotential] = useState(false);
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
  }, [charges, showPotential]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    const newCharge: Charge = {
      x,
      y,
      q: chargeType === 'positive' ? 1 : -1,
      id: Date.now()
    };

    setCharges([...charges, newCharge]);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // Draw potential heatmap if enabled
    if (showPotential && charges.length > 0) {
      drawPotentialMap(ctx, width, height);
    }

    // Draw field lines
    if (charges.length > 0) {
      drawFieldLines(ctx, width, height);
    }

    // Draw charges
    charges.forEach(charge => {
      ctx.beginPath();
      ctx.arc(charge.x, charge.y, 15, 0, Math.PI * 2);
      ctx.fillStyle = charge.q > 0 ? '#FF5252' : '#2196F3';
      ctx.fill();
      ctx.strokeStyle = '#FFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw + or - sign
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(charge.q > 0 ? '+' : '−', charge.x, charge.y);
    });
  };

  const drawPotentialMap = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const resolution = 10;
    const imageData = ctx.createImageData(width, height);

    for (let y = 0; y < height; y += resolution) {
      for (let x = 0; x < width; x += resolution) {
        const potential = calculatePotential(x, y);
        const color = potentialToColor(potential);

        for (let dy = 0; dy < resolution && y + dy < height; dy++) {
          for (let dx = 0; dx < resolution && x + dx < width; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4;
            imageData.data[idx] = color.r;
            imageData.data[idx + 1] = color.g;
            imageData.data[idx + 2] = color.b;
            imageData.data[idx + 3] = 100;
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const calculatePotential = (x: number, y: number): number => {
    let potential = 0;
    charges.forEach(charge => {
      const dx = x - charge.x;
      const dy = y - charge.y;
      const r = Math.sqrt(dx * dx + dy * dy);
      if (r > 1) {
        potential += charge.q / r;
      }
    });
    return potential;
  };

  const potentialToColor = (potential: number): { r: number; g: number; b: number } => {
    const normalized = Math.tanh(potential / 5);
    
    if (normalized > 0) {
      return {
        r: Math.floor(255 * normalized),
        g: 0,
        b: 0
      };
    } else {
      return {
        r: 0,
        g: 0,
        b: Math.floor(255 * -normalized)
      };
    }
  };

  const drawFieldLines = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    charges.forEach(charge => {
      if (charge.q > 0) {
        // Draw field lines emanating from positive charges
        const numLines = 12;
        for (let i = 0; i < numLines; i++) {
          const angle = (i / numLines) * Math.PI * 2;
          drawFieldLine(ctx, charge.x, charge.y, angle, width, height);
        }
      }
    });
  };

  const drawFieldLine = (ctx: CanvasRenderingContext2D, startX: number, startY: number, angle: number, width: number, height: number) => {
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();

    let x = startX + Math.cos(angle) * 20;
    let y = startY + Math.sin(angle) * 20;
    ctx.moveTo(x, y);

    const maxSteps = 100;
    const stepSize = 3;

    for (let step = 0; step < maxSteps; step++) {
      const field = calculateField(x, y);
      const magnitude = Math.sqrt(field.x * field.x + field.y * field.y);

      if (magnitude < 0.01 || x < 0 || x > width || y < 0 || y > height) break;

      x += (field.x / magnitude) * stepSize;
      y += (field.y / magnitude) * stepSize;

      ctx.lineTo(x, y);

      // Check if we hit a negative charge
      const hitCharge = charges.find(c => {
        const dx = x - c.x;
        const dy = y - c.y;
        return Math.sqrt(dx * dx + dy * dy) < 15 && c.q < 0;
      });

      if (hitCharge) break;
    }

    ctx.stroke();
  };

  const calculateField = (x: number, y: number): { x: number; y: number } => {
    let Ex = 0;
    let Ey = 0;

    charges.forEach(charge => {
      const dx = x - charge.x;
      const dy = y - charge.y;
      const r = Math.sqrt(dx * dx + dy * dy);

      if (r > 1) {
        const k = charge.q / (r * r * r);
        Ex += k * dx;
        Ey += k * dy;
      }
    });

    return { x: Ex, y: Ey };
  };

  const clearCharges = () => {
    setCharges([]);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <h1 className="text-2xl font-bold dark:text-white mb-6">Electric Field Visualizer</h1>

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
            <h3 className="font-bold mb-3 dark:text-white">Add Charges</h3>
            
            <div className="space-y-2">
              <Button
                onClick={() => setChargeType('positive')}
                variant={chargeType === 'positive' ? 'default' : 'outline'}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Positive (+)
              </Button>
              
              <Button
                onClick={() => setChargeType('negative')}
                variant={chargeType === 'negative' ? 'default' : 'outline'}
                className="w-full"
              >
                <Minus className="h-4 w-4 mr-2" />
                Negative (−)
              </Button>

              <Button
                onClick={clearCharges}
                variant="outline"
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </Card>

          <Card className="p-4 dark:bg-gray-800">
            <h3 className="font-bold mb-3 dark:text-white">Visualization</h3>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPotential}
                onChange={(e) => setShowPotential(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm dark:text-white">Show Potential Heatmap</span>
            </label>
          </Card>

          <Card className="p-4 dark:bg-gray-800">
            <h3 className="font-bold mb-3 dark:text-white">Info</h3>
            <div className="space-y-2 text-xs dark:text-gray-300">
              <p><strong>Charges:</strong> {charges.length}</p>
              <p><strong>Positive:</strong> {charges.filter(c => c.q > 0).length}</p>
              <p><strong>Negative:</strong> {charges.filter(c => c.q < 0).length}</p>
            </div>
          </Card>

          <Card className="p-4 dark:bg-gray-800">
            <h3 className="font-bold mb-2 text-sm dark:text-white">Coulomb's Law</h3>
            <p className="text-xs dark:text-gray-300">
              F = k(q₁q₂)/r²
            </p>
            <p className="text-xs dark:text-gray-300 mt-2">
              Yellow lines show electric field direction
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
