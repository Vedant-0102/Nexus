import React, { useState, useRef, useEffect } from 'react';
import { PieChart, Info } from 'lucide-react';

export const ProbabilityDistributions: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [distribution, setDistribution] = useState<'normal' | 'binomial' | 'poisson'>('normal');
  const [mean, setMean] = useState(0);
  const [stdDev, setStdDev] = useState(1);
  const [n, setN] = useState(10);
  const [p, setP] = useState(0.5);
  const [lambda, setLambda] = useState(3);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    draw();
    const obs = new ResizeObserver(() => draw());
    obs.observe(canvas);
    return () => obs.disconnect();
  }, [distribution, mean, stdDev, n, p, lambda]);

  const factorial = (n: number): number => {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
  };

  const binomialCoeff = (n: number, k: number): number => {
    return factorial(n) / (factorial(k) * factorial(n - k));
  };

  const normalPDF = (x: number): number => {
    return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * 
           Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
  };

  const binomialPMF = (k: number): number => {
    return binomialCoeff(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
  };

  const poissonPMF = (k: number): number => {
    return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
  };

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
    const padding = 40;

    const isDark = document.documentElement.classList.contains('dark');
    ctx.fillStyle = isDark ? '#0a0e1a' : '#f8f9fa';
    ctx.fillRect(0, 0, width, height);

    // Draw axes
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.stroke();

    if (distribution === 'normal') {
      const xMin = mean - 4 * stdDev;
      const xMax = mean + 4 * stdDev;
      const xRange = xMax - xMin;
      
      let maxY = 0;
      for (let x = xMin; x <= xMax; x += xRange / 100) {
        maxY = Math.max(maxY, normalPDF(x));
      }

      ctx.strokeStyle = '#2196F3';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const x = xMin + (i / 100) * xRange;
        const y = normalPDF(x);
        const px = padding + ((x - xMin) / xRange) * (width - 2 * padding);
        const py = height - padding - (y / maxY) * (height - 2 * padding);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Fill area under curve
      ctx.fillStyle = 'rgba(33, 150, 243, 0.2)';
      ctx.fill();
    } else if (distribution === 'binomial') {
      let maxY = 0;
      for (let k = 0; k <= n; k++) {
        maxY = Math.max(maxY, binomialPMF(k));
      }

      const barWidth = (width - 2 * padding) / (n + 1);
      ctx.fillStyle = '#4CAF50';
      for (let k = 0; k <= n; k++) {
        const y = binomialPMF(k);
        const px = padding + k * barWidth;
        const barHeight = (y / maxY) * (height - 2 * padding);
        ctx.fillRect(px, height - padding - barHeight, barWidth * 0.8, barHeight);
      }
    } else if (distribution === 'poisson') {
      const maxK = Math.min(20, lambda * 3);
      let maxY = 0;
      for (let k = 0; k <= maxK; k++) {
        maxY = Math.max(maxY, poissonPMF(k));
      }

      const barWidth = (width - 2 * padding) / (maxK + 1);
      ctx.fillStyle = '#FF9800';
      for (let k = 0; k <= maxK; k++) {
        const y = poissonPMF(k);
        const px = padding + k * barWidth;
        const barHeight = (y / maxY) * (height - 2 * padding);
        ctx.fillRect(px, height - padding - barHeight, barWidth * 0.8, barHeight);
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <PieChart className="h-6 w-6 text-pink-600" />
          Probability Distributions
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Explore statistical distributions
        </p>
      </div>

      <div className="flex-1 flex gap-6">
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
            <canvas ref={canvasRef} className="w-full" style={{ height: 400 }} />
          </div>
        </div>

        <div className="w-80 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Distribution Type</h3>
            <select
              value={distribution}
              onChange={(e) => setDistribution(e.target.value as any)}
              className="w-full p-2 border rounded dark:bg-gray-700"
            >
              <option value="normal">Normal (Gaussian)</option>
              <option value="binomial">Binomial</option>
              <option value="poisson">Poisson</option>
            </select>
          </div>

          {distribution === 'normal' && (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
                <h3 className="font-semibold mb-3">Mean (μ): {mean}</h3>
                <input
                  type="range"
                  min="-5"
                  max="5"
                  step="0.1"
                  value={mean}
                  onChange={(e) => setMean(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
                <h3 className="font-semibold mb-3">Std Dev (σ): {stdDev.toFixed(1)}</h3>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={stdDev}
                  onChange={(e) => setStdDev(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </>
          )}

          {distribution === 'binomial' && (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
                <h3 className="font-semibold mb-3">Trials (n): {n}</h3>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={n}
                  onChange={(e) => setN(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
                <h3 className="font-semibold mb-3">Probability (p): {p.toFixed(2)}</h3>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={p}
                  onChange={(e) => setP(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </>
          )}

          {distribution === 'poisson' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
              <h3 className="font-semibold mb-3">Lambda (λ): {lambda}</h3>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={lambda}
                onChange={(e) => setLambda(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          <div className="bg-pink-50 dark:bg-pink-900/30 rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-pink-800 dark:text-pink-300">
              <Info className="h-4 w-4" />
              About
            </h3>
            <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
              {distribution === 'normal' && (
                <>
                  <li>• Bell-shaped continuous distribution</li>
                  <li>• 68% within 1σ, 95% within 2σ</li>
                  <li>• Mean = median = mode</li>
                </>
              )}
              {distribution === 'binomial' && (
                <>
                  <li>• Discrete: n trials, 2 outcomes</li>
                  <li>• Mean = np, Variance = np(1-p)</li>
                  <li>• Models coin flips, yes/no surveys</li>
                </>
              )}
              {distribution === 'poisson' && (
                <>
                  <li>• Models rare events over time</li>
                  <li>• Mean = Variance = λ</li>
                  <li>• Examples: calls per hour, defects</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
