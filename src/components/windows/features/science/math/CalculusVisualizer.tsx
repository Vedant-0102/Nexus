import React, { useState, useRef, useEffect } from 'react';
import { TrendingUp, Info } from 'lucide-react';

export const CalculusVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'derivative' | 'integral'>('derivative');
  const [xPoint, setXPoint] = useState(2);
  const [numRectangles, setNumRectangles] = useState(10);
  const [func, setFunc] = useState('x*x');

  const evaluateFunction = (x: number): number => {
    try {
      const f = new Function('x', `
        const sin = Math.sin;
        const cos = Math.cos;
        const sqrt = Math.sqrt;
        const exp = Math.exp;
        const pow = Math.pow;
        return ${func};
      `);
      return f(x);
    } catch {
      return x * x;
    }
  };

  const derivative = (x: number): number => {
    const h = 0.001;
    return (evaluateFunction(x + h) - evaluateFunction(x - h)) / (2 * h);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    draw();
    const obs = new ResizeObserver(() => draw());
    obs.observe(canvas);
    return () => obs.disconnect();
  }, [mode, xPoint, numRectangles, func]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 40;

    const isDark = document.documentElement.classList.contains('dark');
    ctx.fillStyle = isDark ? '#0a0e1a' : '#f8f9fa';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = -10; i <= 10; i++) {
      ctx.beginPath();
      ctx.moveTo(centerX + i * scale, 0);
      ctx.lineTo(centerX + i * scale, height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, centerY + i * scale);
      ctx.lineTo(width, centerY + i * scale);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    // Draw function
    ctx.strokeStyle = '#2196F3';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = -10; x <= 10; x += 0.1) {
      const y = evaluateFunction(x);
      const px = centerX + x * scale;
      const py = centerY - y * scale;
      if (x === -10) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    if (mode === 'derivative') {
      // Draw tangent line
      const y = evaluateFunction(xPoint);
      const slope = derivative(xPoint);
      const px = centerX + xPoint * scale;
      const py = centerY - y * scale;

      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const x1 = xPoint - 2;
      const y1 = y + slope * (-2);
      const x2 = xPoint + 2;
      const y2 = y + slope * 2;
      ctx.moveTo(centerX + x1 * scale, centerY - y1 * scale);
      ctx.lineTo(centerX + x2 * scale, centerY - y2 * scale);
      ctx.stroke();

      // Draw point
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, 2 * Math.PI);
      ctx.fill();

      // Label
      ctx.fillStyle = isDark ? '#fff' : '#000';
      ctx.font = '14px sans-serif';
      ctx.fillText(`f'(${xPoint.toFixed(1)}) = ${slope.toFixed(2)}`, px + 10, py - 10);
    } else {
      // Draw Riemann rectangles
      const a = -3;
      const b = 3;
      const dx = (b - a) / numRectangles;
      let area = 0;

      for (let i = 0; i < numRectangles; i++) {
        const x = a + i * dx;
        const y = evaluateFunction(x);
        area += y * dx;

        const px = centerX + x * scale;
        const py = centerY - y * scale;
        const rectWidth = dx * scale;
        const rectHeight = y * scale;

        ctx.fillStyle = y >= 0 ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)';
        ctx.fillRect(px, centerY, rectWidth, -rectHeight);
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 1;
        ctx.strokeRect(px, centerY, rectWidth, -rectHeight);
      }

      // Display area
      ctx.fillStyle = isDark ? '#fff' : '#000';
      ctx.font = '16px sans-serif';
      ctx.fillText(`Area ≈ ${area.toFixed(2)}`, 20, 30);
    }
  };

  const presets = [
    { name: 'x²', func: 'x*x' },
    { name: 'sin(x)', func: 'sin(x)' },
    { name: 'x³ - 3x', func: 'x*x*x - 3*x' },
    { name: 'e^x', func: 'exp(x/2)' }
  ];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-green-600" />
          Calculus Visualizer
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Explore derivatives and integrals visually
        </p>
      </div>

      <div className="flex-1 flex gap-6">
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
            <canvas ref={canvasRef} className="w-full" style={{ height: 500 }} />
          </div>
        </div>

        <div className="w-80 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Mode</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setMode('derivative')}
                className={`flex-1 py-2 rounded ${mode === 'derivative' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                Derivative
              </button>
              <button
                onClick={() => setMode('integral')}
                className={`flex-1 py-2 rounded ${mode === 'integral' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                Integral
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Function</h3>
            <input
              type="text"
              value={func}
              onChange={(e) => setFunc(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 font-mono text-sm"
            />
            <div className="grid grid-cols-2 gap-2 mt-2">
              {presets.map(p => (
                <button
                  key={p.name}
                  onClick={() => setFunc(p.func)}
                  className="p-2 text-sm bg-blue-100 dark:bg-blue-900/30 rounded hover:bg-blue-200"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {mode === 'derivative' ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
              <h3 className="font-semibold mb-3">Point: x = {xPoint.toFixed(1)}</h3>
              <input
                type="range"
                min="-5"
                max="5"
                step="0.1"
                value={xPoint}
                onChange={(e) => setXPoint(Number(e.target.value))}
                className="w-full"
              />
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 rounded">
                <div className="text-sm">Slope at x = {xPoint.toFixed(1)}:</div>
                <div className="text-lg font-bold">{derivative(xPoint).toFixed(3)}</div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
              <h3 className="font-semibold mb-3">Rectangles: {numRectangles}</h3>
              <input
                type="range"
                min="5"
                max="50"
                value={numRectangles}
                onChange={(e) => setNumRectangles(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                More rectangles = better approximation
              </p>
            </div>
          )}

          <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-green-800 dark:text-green-300">
              <Info className="h-4 w-4" />
              {mode === 'derivative' ? 'Derivative' : 'Integral'}
            </h3>
            <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
              {mode === 'derivative' ? (
                <>
                  <li>• Red line shows tangent at point</li>
                  <li>• Slope = rate of change</li>
                  <li>• f'(x) = instantaneous rate</li>
                </>
              ) : (
                <>
                  <li>• Green rectangles approximate area</li>
                  <li>• More rectangles = better accuracy</li>
                  <li>• Integral = total accumulated change</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
