import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, RotateCcw, Info, Eye } from 'lucide-react';

export const FunctionGrapher3D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [equation, setEquation] = useState('sin(sqrt(x*x + y*y))');
  const [rotationX, setRotationX] = useState(30);
  const [rotationZ, setRotationZ] = useState(45);
  const [zoom, setZoom] = useState(50);
  const [showGrid, setShowGrid] = useState(true);
  const [colorMode, setColorMode] = useState<'height' | 'gradient'>('height');

  const presetFunctions = [
    { name: 'Wave', eq: 'sin(sqrt(x*x + y*y))' },
    { name: 'Saddle', eq: 'x*x - y*y' },
    { name: 'Paraboloid', eq: 'x*x + y*y' },
    { name: 'Ripple', eq: 'sin(x) * cos(y)' },
    { name: 'Gaussian', eq: 'exp(-(x*x + y*y)/2)' },
    { name: 'Cone', eq: 'sqrt(x*x + y*y)' },
    { name: 'Hyperbolic', eq: '1/(1 + x*x + y*y)' },
    { name: 'Trig Mix', eq: 'sin(x) + cos(y)' }
  ];

  const evaluateFunction = (x: number, y: number): number => {
    try {
      // Safe evaluation with limited scope
      const func = new Function('x', 'y', `
        const sin = Math.sin;
        const cos = Math.cos;
        const tan = Math.tan;
        const sqrt = Math.sqrt;
        const exp = Math.exp;
        const abs = Math.abs;
        const pow = Math.pow;
        const log = Math.log;
        return ${equation};
      `);
      const result = func(x, y);
      return isFinite(result) ? result : 0;
    } catch {
      return 0;
    }
  };

  const project3D = (x: number, y: number, z: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Rotation matrices
    const radX = (rotationX * Math.PI) / 180;
    const radZ = (rotationZ * Math.PI) / 180;

    // Rotate around X axis
    let y1 = y * Math.cos(radX) - z * Math.sin(radX);
    let z1 = y * Math.sin(radX) + z * Math.cos(radX);

    // Rotate around Z axis
    let x2 = x * Math.cos(radZ) - y1 * Math.sin(radZ);
    let y2 = x * Math.sin(radZ) + y1 * Math.cos(radZ);

    // Project to 2D
    const scale = zoom;
    return {
      x: centerX + x2 * scale,
      y: centerY - y2 * scale - z1 * scale * 0.5
    };
  };

  const getColorForHeight = (z: number, minZ: number, maxZ: number): string => {
    const normalized = (z - minZ) / (maxZ - minZ || 1);
    
    if (colorMode === 'height') {
      const r = Math.floor(255 * normalized);
      const b = Math.floor(255 * (1 - normalized));
      const g = Math.floor(128);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // Gradient mode
      if (normalized < 0.25) return '#0000ff';
      if (normalized < 0.5) return '#00ffff';
      if (normalized < 0.75) return '#ffff00';
      return '#ff0000';
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const range = 3;
    const step = 0.2;
    const points: { x: number; y: number; z: number }[] = [];
    let minZ = Infinity;
    let maxZ = -Infinity;

    // Calculate all points and find min/max
    for (let x = -range; x <= range; x += step) {
      for (let y = -range; y <= range; y += step) {
        const z = evaluateFunction(x, y);
        points.push({ x, y, z });
        minZ = Math.min(minZ, z);
        maxZ = Math.max(maxZ, z);
      }}

    // Draw grid if enabled
    if (showGrid) {
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 0.5;

      for (let x = -range; x <= range; x += step * 5) {
        ctx.beginPath();
        for (let y = -range; y <= range; y += step) {
          const z = evaluateFunction(x, y);
          const proj = project3D(x, y, z);
          if (y === -range) ctx.moveTo(proj.x, proj.y);
          else ctx.lineTo(proj.x, proj.y);
        }
        ctx.stroke();
      }

      for (let y = -range; y <= range; y += step * 5) {
        ctx.beginPath();
        for (let x = -range; x <= range; x += step) {
          const z = evaluateFunction(x, y);
          const proj = project3D(x, y, z);
          if (x === -range) ctx.moveTo(proj.x, proj.y);
          else ctx.lineTo(proj.x, proj.y);
        }
        ctx.stroke();
      }
    }

    // Draw surface
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      if (Math.abs(p1.x - p2.x) < step * 1.5 && Math.abs(p1.y - p2.y) < step * 1.5) {
        const proj1 = project3D(p1.x, p1.y, p1.z);
        const proj2 = project3D(p2.x, p2.y, p2.z);

        ctx.strokeStyle = getColorForHeight(p1.z, minZ, maxZ);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(proj1.x, proj1.y);
        ctx.lineTo(proj2.x, proj2.y);
        ctx.stroke();
      }
    }

    // Draw axes
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    
    // X axis (red)
    ctx.strokeStyle = '#ff0000';
    const xStart = project3D(-range, 0, 0);
    const xEnd = project3D(range, 0, 0);
    ctx.beginPath();
    ctx.moveTo(xStart.x, xStart.y);
    ctx.lineTo(xEnd.x, xEnd.y);
    ctx.stroke();

    // Y axis (green)
    ctx.strokeStyle = '#00ff00';
    const yStart = project3D(0, -range, 0);
    const yEnd = project3D(0, range, 0);
    ctx.beginPath();
    ctx.moveTo(yStart.x, yStart.y);
    ctx.lineTo(yEnd.x, yEnd.y);
    ctx.stroke();

    // Z axis (blue)
    ctx.strokeStyle = '#0000ff';
    const zStart = project3D(0, 0, minZ);
    const zEnd = project3D(0, 0, maxZ);
    ctx.beginPath();
    ctx.moveTo(zStart.x, zStart.y);
    ctx.lineTo(zEnd.x, zEnd.y);
    ctx.stroke();

  }, [equation, rotationX, rotationZ, zoom, showGrid, colorMode]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-purple-600" />
          3D Function Grapher
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Visualize mathematical functions in three dimensions
        </p>
      </div>

      <div className="flex-1 flex gap-6">
        {/* Canvas */}
        <div className="flex-1 flex flex-col">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg flex-1">
            <canvas
              ref={canvasRef}
              width={600}
              height={500}
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Controls */}
        <div className="w-80 space-y-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Function</h3>
            <input
              type="text"
              value={equation}
              onChange={(e) => setEquation(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 font-mono text-sm"
              placeholder="z = f(x, y)"
            />
            <div className="text-xs text-gray-500 mt-2">
              Available: sin, cos, tan, sqrt, exp, abs, pow, log
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Presets</h3>
            <div className="grid grid-cols-2 gap-2">
              {presetFunctions.map(func => (
                <button
                  key={func.name}
                  onClick={() => setEquation(func.eq)}
                  className="p-2 text-sm bg-blue-100 dark:bg-blue-900/30 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
                >
                  {func.name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Rotation X</h3>
            <input
              type="range"
              min="-90"
              max="90"
              value={rotationX}
              onChange={(e) => setRotationX(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-center text-sm mt-1">{rotationX}°</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Rotation Z</h3>
            <input
              type="range"
              min="0"
              max="360"
              value={rotationZ}
              onChange={(e) => setRotationZ(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-center text-sm mt-1">{rotationZ}°</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Zoom</h3>
            <input
              type="range"
              min="20"
              max="100"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-center text-sm mt-1">{zoom}%</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Display Options</h3>
            <label className="flex items-center gap-2 mb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Show Grid</span>
            </label>
            <div className="mt-3">
              <label className="text-sm font-medium">Color Mode:</label>
              <select
                value={colorMode}
                onChange={(e) => setColorMode(e.target.value as any)}
                className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="height">Height-based</option>
                <option value="gradient">Gradient</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => {
              setRotationX(30);
              setRotationZ(45);
              setZoom(50);
            }}
            className="w-full py-2 px-4 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center justify-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset View
          </button>

          <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-purple-800 dark:text-purple-300">
              <Info className="h-4 w-4" />
              Tips
            </h3>
            <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
              <li>• Drag sliders to rotate the graph</li>
              <li>• Try different preset functions</li>
              <li>• Red = X axis, Green = Y axis, Blue = Z axis</li>
              <li>• Color indicates height (z-value)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
