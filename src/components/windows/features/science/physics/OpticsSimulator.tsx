import React, { useRef, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface Material {
  name: string;
  refractiveIndex: number;
  color: string;
}

const materials: Material[] = [
  { name: 'Air', refractiveIndex: 1.0, color: '#E3F2FD' },
  { name: 'Water', refractiveIndex: 1.33, color: '#81D4FA' },
  { name: 'Glass', refractiveIndex: 1.5, color: '#B3E5FC' },
  { name: 'Diamond', refractiveIndex: 2.42, color: '#4FC3F7' }
];

export const OpticsSimulator = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [incidentAngle, setIncidentAngle] = useState(30);
  const [material1, setMaterial1] = useState(0); // Air
  const [material2, setMaterial2] = useState(2); // Glass
  const [reflectionAngle, setReflectionAngle] = useState(0);
  const [refractionAngle, setRefractionAngle] = useState(0);
  const [criticalAngle, setCriticalAngle] = useState(0);
  const [totalInternalReflection, setTotalInternalReflection] = useState(false);

  useEffect(() => {
    calculateAngles();
  }, [incidentAngle, material1, material2]);

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
    const obs = new ResizeObserver(() => { resize(); draw(); });
    obs.observe(canvas);
    draw();
    return () => obs.disconnect();
  }, [incidentAngle, material1, material2, reflectionAngle, refractionAngle, totalInternalReflection, criticalAngle]);

  const calculateAngles = () => {
    const n1 = materials[material1].refractiveIndex;
    const n2 = materials[material2].refractiveIndex;
    const theta1 = (incidentAngle * Math.PI) / 180;

    // Reflection angle equals incident angle
    setReflectionAngle(incidentAngle);

    // Snell's Law: n1 * sin(theta1) = n2 * sin(theta2)
    const sinTheta2 = (n1 * Math.sin(theta1)) / n2;

    // Critical angle
    if (n1 > n2) {
      const critAngle = Math.asin(n2 / n1) * (180 / Math.PI);
      setCriticalAngle(critAngle);
      
      if (incidentAngle > critAngle) {
        setTotalInternalReflection(true);
        setRefractionAngle(0);
        return;
      }
    } else {
      setCriticalAngle(90);
    }

    setTotalInternalReflection(false);

    if (sinTheta2 <= 1) {
      const theta2 = Math.asin(sinTheta2) * (180 / Math.PI);
      setRefractionAngle(theta2);
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.getBoundingClientRect().width;
    const height = canvas.getBoundingClientRect().height;
    const centerY = height / 2;
    const centerX = width / 2;
    const isDark = document.documentElement.classList.contains('dark');

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw materials
    ctx.fillStyle = materials[material1].color;
    ctx.fillRect(0, 0, width, centerY);
    ctx.fillStyle = materials[material2].color;
    ctx.fillRect(0, centerY, width, centerY);

    // Draw interface line
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw normal line
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    // Draw incident ray
    const incidentRad = (incidentAngle * Math.PI) / 180;
    const rayLength = 150;
    const incidentEndX = centerX - rayLength * Math.sin(incidentRad);
    const incidentEndY = centerY - rayLength * Math.cos(incidentRad);

    ctx.strokeStyle = '#FF5722';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(incidentEndX, incidentEndY);
    ctx.lineTo(centerX, centerY);
    ctx.stroke();

    // Draw arrow
    drawArrow(ctx, incidentEndX, incidentEndY, centerX, centerY, '#FF5722');

    // Draw reflected ray
    const reflectionRad = (reflectionAngle * Math.PI) / 180;
    const reflectEndX = centerX + rayLength * Math.sin(reflectionRad);
    const reflectEndY = centerY - rayLength * Math.cos(reflectionRad);

    ctx.strokeStyle = '#2196F3';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(reflectEndX, reflectEndY);
    ctx.stroke();

    drawArrow(ctx, centerX, centerY, reflectEndX, reflectEndY, '#2196F3');

    // Draw refracted ray (if not total internal reflection)
    if (!totalInternalReflection) {
      const refractionRad = (refractionAngle * Math.PI) / 180;
      const refractEndX = centerX + rayLength * Math.sin(refractionRad);
      const refractEndY = centerY + rayLength * Math.cos(refractionRad);

      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(refractEndX, refractEndY);
      ctx.stroke();

      drawArrow(ctx, centerX, centerY, refractEndX, refractEndY, '#4CAF50');
    }

    // Labels
    ctx.fillStyle = isDark ? '#e2e8f0' : '#1a1a2e';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(materials[material1].name, 10, 20);
    ctx.fillText(materials[material2].name, 10, height - 10);
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, color: string) => {
    const headlen = 10;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <h1 className="text-2xl font-bold dark:text-white mb-6">Optics Simulator</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 p-6 dark:bg-gray-800">
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            className="w-full border-2 border-gray-300 dark:border-gray-600 rounded"
          />
        </Card>

        <div className="space-y-4">
          <Card className="p-4 dark:bg-gray-800">
            <h3 className="font-bold mb-3 dark:text-white">Controls</h3>
            
            <div className="space-y-3">
              <div>
                <Label>Incident Angle: {incidentAngle}°</Label>
                <Input
                  type="range"
                  min="0"
                  max="89"
                  value={incidentAngle}
                  onChange={(e) => setIncidentAngle(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <Label>Material 1 (Top)</Label>
                <select
                  value={material1}
                  onChange={(e) => setMaterial1(parseInt(e.target.value))}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                >
                  {materials.map((mat, idx) => (
                    <option key={idx} value={idx}>{mat.name} (n={mat.refractiveIndex})</option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Material 2 (Bottom)</Label>
                <select
                  value={material2}
                  onChange={(e) => setMaterial2(parseInt(e.target.value))}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                >
                  {materials.map((mat, idx) => (
                    <option key={idx} value={idx}>{mat.name} (n={mat.refractiveIndex})</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          <Card className="p-4 dark:bg-gray-800">
            <h3 className="font-bold mb-3 dark:text-white">Results</h3>
            <div className="space-y-2 text-sm dark:text-gray-300">
              <div className="flex justify-between">
                <span className="text-red-600">Incident:</span>
                <span className="font-mono">{incidentAngle.toFixed(1)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600">Reflection:</span>
                <span className="font-mono">{reflectionAngle.toFixed(1)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600">Refraction:</span>
                <span className="font-mono">{totalInternalReflection ? 'TIR' : `${refractionAngle.toFixed(1)}°`}</span>
              </div>
              <div className="flex justify-between">
                <span>Critical Angle:</span>
                <span className="font-mono">{criticalAngle.toFixed(1)}°</span>
              </div>
              {totalInternalReflection && (
                <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded text-xs">
                  <strong>Total Internal Reflection!</strong>
                  <br />No refracted ray.
                </div>
              )}
            </div>
          </Card>

          <Card className="p-4 dark:bg-gray-800">
            <h3 className="font-bold mb-2 text-sm dark:text-white">Snell's Law</h3>
            <p className="text-xs dark:text-gray-300">
              n₁ sin(θ₁) = n₂ sin(θ₂)
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
