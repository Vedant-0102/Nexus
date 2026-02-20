import React, { useState, useRef, useEffect } from 'react';
import { Atom, Play, Pause, Info } from 'lucide-react';

export const QuantumTunneling: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [barrierHeight, setBarrierHeight] = useState(5);
  const [particleEnergy, setParticleEnergy] = useState(3);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          setIsPlaying(false);
          return 100;
        }
        return p + 1;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    draw();
  }, [progress, barrierHeight, particleEnergy]);

  const tunnelingProbability = particleEnergy >= barrierHeight
    ? 1.0
    : Math.exp(-2 * (barrierHeight - particleEnergy));

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerY = canvas.height / 2;
    
    // Draw potential barrier
    ctx.fillStyle = 'rgba(255, 107, 107, 0.3)';
    ctx.fillRect(250, centerY - barrierHeight * 20, 100, barrierHeight * 40);
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 2;
    ctx.strokeRect(250, centerY - barrierHeight * 20, 100, barrierHeight * 40);

    // Draw energy level
    ctx.strokeStyle = '#4ecdc4';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, centerY - particleEnergy * 20);
    ctx.lineTo(600, centerY - particleEnergy * 20);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw particle
    if (progress > 0) {
      const x = (progress / 100) * 500 + 50;
      const opacity = x > 250 && x < 350 ? tunnelingProbability : 1;
      
      ctx.fillStyle = `rgba(33, 150, 243, ${opacity})`;
      ctx.beginPath();
      ctx.arc(x, centerY - particleEnergy * 20, 10, 0, 2 * Math.PI);
      ctx.fill();

      // Wave function
      ctx.strokeStyle = `rgba(33, 150, 243, 0.5)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 100; i++) {
        const wx = x - 50 + i;
        const wy = centerY - particleEnergy * 20 + Math.sin(i * 0.5) * 20;
        if (i === 0) ctx.moveTo(wx, wy);
        else ctx.lineTo(wx, wy);
      }
      ctx.stroke();
    }

    // Labels
    ctx.fillStyle = '#000';
    ctx.font = '14px sans-serif';
    ctx.fillText('Potential Barrier', 260, centerY - barrierHeight * 20 - 10);
    ctx.fillText(`Energy: ${particleEnergy} eV`, 10, 30);
    ctx.fillText(`Barrier: ${barrierHeight} eV`, 10, 50);
    ctx.fillText(`Tunneling Probability: ${(tunnelingProbability * 100).toFixed(1)}%`, 10, 70);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Atom className="h-6 w-6 text-purple-600" />
          Quantum Tunneling
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
              disabled={progress >= 100}
              className="px-6 py-2 bg-blue-600 text-white rounded flex items-center gap-2 disabled:bg-gray-400"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              onClick={() => { setProgress(0); setIsPlaying(false); }}
              className="px-6 py-2 bg-gray-600 text-white rounded"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="w-80 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Particle Energy: {particleEnergy} eV</h3>
            <input
              type="range"
              min="1"
              max="8"
              value={particleEnergy}
              onChange={(e) => setParticleEnergy(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Barrier Height: {barrierHeight} eV</h3>
            <input
              type="range"
              min="2"
              max="10"
              value={barrierHeight}
              onChange={(e) => setBarrierHeight(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Quantum Mechanics
            </h3>
            <ul className="text-xs space-y-1">
              <li>• Particles can pass through barriers</li>
              <li>• Probability depends on energy difference</li>
              <li>• Wave function penetrates barrier</li>
              <li>• Essential for nuclear fusion, electronics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
