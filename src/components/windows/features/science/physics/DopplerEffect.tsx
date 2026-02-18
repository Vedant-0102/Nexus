import React, { useState, useRef, useEffect } from 'react';
import { Waves, Play, Pause, Info } from 'lucide-react';

export const DopplerEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [sourceVelocity, setSourceVelocity] = useState(0.3);
  const [time, setTime] = useState(0);
  const [frequency, setFrequency] = useState(5);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTime(t => t + 0.1);
    }, 50);
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    draw();
  }, [time, sourceVelocity, frequency]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerY = canvas.height / 2;
    const sourceX = 100 + (time * sourceVelocity * 50) % 400;

    // Draw observer
    ctx.fillStyle = '#4ecdc4';
    ctx.beginPath();
    ctx.arc(500, centerY, 15, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.font = '12px sans-serif';
    ctx.fillText('Observer', 480, centerY + 30);

    // Draw source
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(sourceX, centerY, 15, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillText('Source', sourceX - 20, centerY + 30);

    // Draw wave circles
    for (let i = 0; i < 20; i++) {
      const waveTime = time - i * 0.5;
      if (waveTime < 0) continue;
      
      const waveSourceX = 100 + (waveTime * sourceVelocity * 50) % 400;
      const radius = (time - waveTime) * 50;
      
      ctx.strokeStyle = `rgba(33, 150, 243, ${1 - radius / 300})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(waveSourceX, centerY, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Draw velocity arrow
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sourceX, centerY - 40);
    ctx.lineTo(sourceX + sourceVelocity * 50, centerY - 40);
    ctx.stroke();
    // Arrow head
    ctx.beginPath();
    ctx.moveTo(sourceX + sourceVelocity * 50, centerY - 40);
    ctx.lineTo(sourceX + sourceVelocity * 50 - 10, centerY - 45);
    ctx.lineTo(sourceX + sourceVelocity * 50 - 10, centerY - 35);
    ctx.closePath();
    ctx.fill();
  };

  const observedFreq = frequency * (1 / (1 - sourceVelocity));

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Waves className="h-6 w-6 text-blue-600" />
          Doppler Effect Visualizer
        </h2>
      </div>

      <div className="flex-1 flex gap-6">
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
            <canvas ref={canvasRef} width={600} height={300} className="w-full" />
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-6 py-2 bg-blue-600 text-white rounded flex items-center gap-2"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setTime(0)}
              className="px-6 py-2 bg-gray-600 text-white rounded"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="w-80 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Source Velocity: {(sourceVelocity * 100).toFixed(0)}%</h3>
            <input
              type="range"
              min="0"
              max="0.8"
              step="0.1"
              value={sourceVelocity}
              onChange={(e) => setSourceVelocity(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Frequencies</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Emitted:</span>
                <span className="font-mono">{frequency} Hz</span>
              </div>
              <div className="flex justify-between">
                <span>Observed:</span>
                <span className="font-mono">{observedFreq.toFixed(2)} Hz</span>
              </div>
              <div className="flex justify-between">
                <span>Shift:</span>
                <span className="font-mono">{((observedFreq - frequency) / frequency * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Key Concepts
            </h3>
            <ul className="text-xs space-y-1">
              <li>• Moving source compresses waves ahead</li>
              <li>• Waves stretch behind moving source</li>
              <li>• Higher frequency = higher pitch</li>
              <li>• Used in radar, astronomy, medical imaging</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
