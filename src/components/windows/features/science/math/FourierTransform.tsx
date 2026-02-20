import React, { useState, useEffect, useRef } from 'react';
import { Waves, Play, Pause, RotateCcw, Info } from 'lucide-react';

export const FourierTransform: React.FC = () => {
  const timeCanvasRef = useRef<HTMLCanvasElement>(null);
  const freqCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [time, setTime] = useState(0);
  const [waves, setWaves] = useState([
    { freq: 1, amp: 1, phase: 0, active: true },
    { freq: 3, amp: 0.5, phase: 0, active: true },
    { freq: 5, amp: 0.3, phase: 0, active: false }
  ]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTime(t => (t + 0.05) % (2 * Math.PI));
    }, 50);
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    drawTimeSignal();
    drawFrequencySpectrum();
  }, [time, waves]);

  const drawTimeSignal = () => {
    const canvas = timeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerY = canvas.height / 2;
    const scale = 50;

    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const y = (i / 10) * canvas.height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw individual waves
    waves.forEach((wave, idx) => {
      if (!wave.active) return;
      ctx.strokeStyle = ['#ff6b6b', '#4ecdc4', '#ffe66d'][idx];
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x++) {
        const t = (x / canvas.width) * 4 * Math.PI;
        const y = centerY - wave.amp * scale * Math.sin(wave.freq * t + wave.phase + time);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });

    // Draw composite signal
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x++) {
      const t = (x / canvas.width) * 4 * Math.PI;
      let y = centerY;
      waves.forEach(wave => {
        if (wave.active) {
          y -= wave.amp * scale * Math.sin(wave.freq * t + wave.phase + time);
        }
      });
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw axes
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.stroke();
  };

  const drawFrequencySpectrum = () => {
    const canvas = freqCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const barWidth = canvas.width / 10;
    const maxHeight = canvas.height - 40;

    // Draw frequency bars
    waves.forEach((wave, idx) => {
      if (!wave.active) return;
      const x = wave.freq * barWidth;
      const height = wave.amp * maxHeight;
      const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d'];
      
      ctx.fillStyle = colors[idx];
      ctx.fillRect(x - 15, canvas.height - height - 20, 30, height);
      
      // Label
      ctx.fillStyle = '#000';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${wave.freq}Hz`, x, canvas.height - 5);
      ctx.fillText(wave.amp.toFixed(2), x, canvas.height - height - 25);
    });

    // Draw axes
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 20);
    ctx.lineTo(canvas.width, canvas.height - 20);
    ctx.stroke();

    ctx.fillStyle = '#666';
    ctx.font = '14px sans-serif';
    ctx.fillText('Frequency (Hz)', canvas.width / 2, canvas.height - 5);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Waves className="h-6 w-6 text-blue-600" />
          Fourier Transform Visualizer
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Decompose signals into frequency components
        </p>
      </div>

      <div className="flex-1 flex gap-6">
        <div className="flex-1 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-2">Time Domain</h3>
            <canvas ref={timeCanvasRef} width={600} height={200} className="w-full border rounded" />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-2">Frequency Domain</h3>
            <canvas ref={freqCanvasRef} width={600} height={200} className="w-full border rounded" />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={() => setTime(0)}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>

        <div className="w-80 space-y-4">
          {waves.map((wave, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Wave {idx + 1}</h3>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={wave.active}
                    onChange={(e) => {
                      const newWaves = waves.map((w, i) => i === idx ? { ...w, active: e.target.checked } : w);
                      setWaves(newWaves);
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Active</span>
                </label>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-sm">Frequency: {wave.freq} Hz</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={wave.freq}
                    onChange={(e) => {
                      const newWaves = waves.map((w, i) => i === idx ? { ...w, freq: Number(e.target.value) } : w);
                      setWaves(newWaves);
                    }}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm">Amplitude: {wave.amp.toFixed(2)}</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={wave.amp}
                    onChange={(e) => {
                      const newWaves = waves.map((w, i) => i === idx ? { ...w, amp: Number(e.target.value) } : w);
                      setWaves(newWaves);
                    }}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-blue-800 dark:text-blue-300">
              <Info className="h-4 w-4" />
              Key Concepts
            </h3>
            <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
              <li>• Any signal can be decomposed into sine waves</li>
              <li>• Frequency domain shows component frequencies</li>
              <li>• Amplitude indicates strength of each frequency</li>
              <li>• Black line is the composite signal</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
