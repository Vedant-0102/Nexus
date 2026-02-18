import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, RotateCcw, ZoomIn, ZoomOut, Info } from 'lucide-react';

export const FractalGenerator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fractalType, setFractalType] = useState<'mandelbrot' | 'julia'>('mandelbrot');
  const [maxIterations, setMaxIterations] = useState(100);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [juliaC, setJuliaC] = useState({ real: -0.7, imag: 0.27015 });
  const [colorScheme, setColorScheme] = useState<'rainbow' | 'fire' | 'ocean'>('rainbow');
  const [isGenerating, setIsGenerating] = useState(false);

  const colorSchemes = {
    rainbow: (n: number, max: number) => {
      const hue = (n / max) * 360;
      return `hsl(${hue}, 100%, 50%)`;
    },
    fire: (n: number, max: number) => {
      const ratio = n / max;
      const r = Math.floor(255 * ratio);
      const g = Math.floor(100 * ratio);
      return `rgb(${r}, ${g}, 0)`;
    },
    ocean: (n: number, max: number) => {
      const ratio = n / max;
      const b = Math.floor(255 * ratio);
      const g = Math.floor(150 * ratio);
      return `rgb(0, ${g}, ${b})`;
    }
  };

  const generateFractal = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsGenerating(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const minReal = -2.5 / zoom + offsetX;
    const maxReal = 1.5 / zoom + offsetX;
    const minImag = -1.5 / zoom + offsetY;
    const maxImag = 1.5 / zoom + offsetY;

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const real = minReal + (x / width) * (maxReal - minReal);
        const imag = minImag + (y / height) * (maxImag - minImag);

        let iterations = 0;
        let zReal = fractalType === 'mandelbrot' ? real : 0;
        let zImag = fractalType === 'mandelbrot' ? imag : 0;
        const cReal = fractalType === 'mandelbrot' ? real : juliaC.real;
        const cImag = fractalType === 'mandelbrot' ? imag : juliaC.imag;

        if (fractalType === 'julia') {
          zReal = real;
          zImag = imag;
        }

        while (iterations < maxIterations && zReal * zReal + zImag * zImag < 4) {
          const tempReal = zReal * zReal - zImag * zImag + cReal;
          zImag = 2 * zReal * zImag + cImag;
          zReal = tempReal;
          iterations++;
        }

        if (iterations === maxIterations) {
          ctx.fillStyle = '#000';
        } else {
          ctx.fillStyle = colorSchemes[colorScheme](iterations, maxIterations);
        }

        ctx.fillRect(x, y, 1, 1);
      }
    }

    setIsGenerating(false);
  };

  useEffect(() => {
    generateFractal();
  }, [fractalType, maxIterations, zoom, offsetX, offsetY, juliaC, colorScheme]);

  const presets = {
    mandelbrot: [
      { name: 'Classic', zoom: 1, x: 0, y: 0 },
      { name: 'Seahorse Valley', zoom: 100, x: -0.75, y: 0.1 },
      { name: 'Elephant Valley', zoom: 200, x: 0.3, y: 0.03 },
      { name: 'Spiral', zoom: 500, x: -0.7, y: 0.35 }
    ],
    julia: [
      { name: 'Classic', c: { real: -0.7, imag: 0.27015 } },
      { name: 'Dragon', c: { real: -0.8, imag: 0.156 } },
      { name: 'Dendrite', c: { real: 0, imag: 1 } },
      { name: 'Spiral', c: { real: -0.4, imag: 0.6 } }
    ]
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-600" />
          Fractal Generator
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Explore the beauty of mathematical fractals
        </p>
      </div>

      <div className="flex-1 flex gap-6">
        {/* Canvas */}
        <div className="flex-1 flex flex-col">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
            <canvas
              ref={canvasRef}
              width={600}
              height={500}
              className="w-full border border-gray-300 dark:border-gray-600 rounded"
            />
            {isGenerating && (
              <div className="text-center mt-2 text-sm text-gray-600 dark:text-gray-400">
                Generating fractal...
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="w-80 space-y-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Fractal Type</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setFractalType('mandelbrot')}
                className={`flex-1 py-2 rounded ${fractalType === 'mandelbrot' ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                Mandelbrot
              </button>
              <button
                onClick={() => setFractalType('julia')}
                className={`flex-1 py-2 rounded ${fractalType === 'julia' ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                Julia
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Presets</h3>
            <div className="space-y-2">
              {fractalType === 'mandelbrot' ? (
                presets.mandelbrot.map(preset => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setZoom(preset.zoom);
                      setOffsetX(preset.x);
                      setOffsetY(preset.y);
                    }}
                    className="w-full p-2 text-sm bg-purple-100 dark:bg-purple-900/30 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 text-left"
                  >
                    {preset.name}
                  </button>
                ))
              ) : (
                presets.julia.map(preset => (
                  <button
                    key={preset.name}
                    onClick={() => setJuliaC(preset.c)}
                    className="w-full p-2 text-sm bg-purple-100 dark:bg-purple-900/30 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 text-left"
                  >
                    {preset.name}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Iterations</h3>
            <input
              type="range"
              min="20"
              max="500"
              value={maxIterations}
              onChange={(e) => setMaxIterations(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-center text-sm mt-1">{maxIterations}</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Zoom Controls</h3>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setZoom(z => z * 2)}
                className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <ZoomIn className="h-4 w-4" />
                Zoom In
              </button>
              <button
                onClick={() => setZoom(z => Math.max(1, z / 2))}
                className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <ZoomOut className="h-4 w-4" />
                Zoom Out
              </button>
            </div>
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              Current Zoom: {zoom.toFixed(1)}x
            </div>
          </div>

          {fractalType === 'julia' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
              <h3 className="font-semibold mb-3">Julia Constant (C)</h3>
              <div className="space-y-2">
                <div>
                  <label className="text-sm">Real:</label>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.01"
                    value={juliaC.real}
                    onChange={(e) => setJuliaC(prev => ({ ...prev, real: Number(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="text-center text-xs">{juliaC.real.toFixed(3)}</div>
                </div>
                <div>
                  <label className="text-sm">Imaginary:</label>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.01"
                    value={juliaC.imag}
                    onChange={(e) => setJuliaC(prev => ({ ...prev, imag: Number(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="text-center text-xs">{juliaC.imag.toFixed(3)}</div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Color Scheme</h3>
            <select
              value={colorScheme}
              onChange={(e) => setColorScheme(e.target.value as any)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="rainbow">Rainbow</option>
              <option value="fire">Fire</option>
              <option value="ocean">Ocean</option>
            </select>
          </div>

          <button
            onClick={() => {
              setZoom(1);
              setOffsetX(0);
              setOffsetY(0);
              setMaxIterations(100);
            }}
            className="w-full py-2 px-4 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center justify-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset All
          </button>

          <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-purple-800 dark:text-purple-300">
              <Info className="h-4 w-4" />
              About Fractals
            </h3>
            <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
              <li>• Fractals exhibit self-similarity at all scales</li>
              <li>• Mandelbrot set: z = z² + c</li>
              <li>• Julia sets use a fixed constant</li>
              <li>• Colors show escape time iterations</li>
              <li>• Black regions never escape to infinity</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
