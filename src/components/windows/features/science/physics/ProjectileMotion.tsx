import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

export const ProjectileMotion: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [velocity, setVelocity] = useState(30);
  const [angle, setAngle] = useState(45);
  const [gravity, setGravity] = useState(9.8);
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(0);

  const calculate = () => {
    const angleRad = (angle * Math.PI) / 180;
    const vx = velocity * Math.cos(angleRad);
    const vy = velocity * Math.sin(angleRad);
    
    const maxHeight = (vy * vy) / (2 * gravity);
    const totalTime = (2 * vy) / gravity;
    const range = vx * totalTime;

    return { vx, vy, maxHeight, totalTime, range, angleRad };
  };

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
    const obs = new ResizeObserver(resize);
    obs.observe(canvas);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = (currentTime: number) => {
      if (!isRunning) return;
      const { width: W, height: H } = canvas.getBoundingClientRect();

      if (startTimeRef.current === 0) {
        startTimeRef.current = currentTime;
      }

      const elapsed = (currentTime - startTimeRef.current) / 1000;
      setTime(elapsed);

      const { vx, vy, totalTime, angleRad } = calculate();

      if (elapsed > totalTime) {
        setIsRunning(false);
        return;
      }

      // Clear canvas
      const isDark = document.documentElement.classList.contains('dark');
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = isDark ? '#080c18' : '#f8f9fc';
      ctx.fillRect(0, 0, W, H);

      // Draw ground
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(0, H - 20, W, 20);

      // Draw trajectory path
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      
      for (let t = 0; t <= totalTime; t += 0.1) {
        const x = 50 + vx * t * 10;
        const y = H - 20 - (vy * t - 0.5 * gravity * t * t) * 10;
        if (t === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Calculate current position
      const x = 50 + vx * elapsed * 10;
      const y = H - 20 - (vy * elapsed - 0.5 * gravity * elapsed * elapsed) * 10;

      // Draw projectile with glow effect
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#EF4444';
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Draw projectile outline
      ctx.strokeStyle = '#991B1B';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw velocity vector
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      const currentVx = vx;
      const currentVy = vy - gravity * elapsed;
      ctx.lineTo(x + currentVx * 2, y - currentVy * 2);
      ctx.stroke();

      // Draw launch angle indicator
      ctx.strokeStyle = '#8B5CF6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(50, H - 20, 30, -angleRad, 0);
      ctx.stroke();

      animationRef.current = requestAnimationFrame(draw);
    };

    if (isRunning) {
      animationRef.current = requestAnimationFrame(draw);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, velocity, angle, gravity]);

  const handleStart = () => {
    startTimeRef.current = 0;
    setTime(0);
    setIsRunning(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    startTimeRef.current = 0;
    setTime(0);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const { maxHeight, totalTime, range } = calculate();

  return (
    <div className="h-full flex flex-col p-3 overflow-hidden">
      <h2 className="text-lg font-bold mb-2 dark:text-white">Projectile Motion Simulator</h2>
      
      <div className="flex-1 grid md:grid-cols-3 gap-3 overflow-hidden min-h-0">
        {/* Controls */}
        <div className="space-y-2 overflow-y-auto">
          <div>
            <label className="block text-xs font-medium mb-0.5 dark:text-gray-300">
              Velocity: {velocity} m/s
            </label>
            <input
              type="range"
              min="10"
              max="50"
              value={velocity}
              onChange={(e) => setVelocity(Number(e.target.value))}
              className="w-full"
              disabled={isRunning}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-0.5 dark:text-gray-300">
              Angle: {angle}°
            </label>
            <input
              type="range"
              min="0"
              max="90"
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
              className="w-full"
              disabled={isRunning}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-0.5 dark:text-gray-300">
              Gravity: {gravity} m/s²
            </label>
            <input
              type="range"
              min="1"
              max="20"
              step="0.1"
              value={gravity}
              onChange={(e) => setGravity(Number(e.target.value))}
              className="w-full"
              disabled={isRunning}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleStart}
              disabled={isRunning}
              className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-semibold py-2 rounded-lg transition-colors text-sm"
            >
              <Play className="h-4 w-4" />
              Launch
            </button>
            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          {/* Calculations */}
          <div className="space-y-1 p-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold dark:text-white text-xs flex items-center gap-1">
              📊 Data
            </h3>
            <div className="text-[10px] space-y-0.5 dark:text-gray-300">
              <p className="flex justify-between">
                <span>Height:</span>
                <span className="font-bold">{maxHeight.toFixed(1)} m</span>
              </p>
              <p className="flex justify-between">
                <span>Time:</span>
                <span className="font-bold">{totalTime.toFixed(1)} s</span>
              </p>
              <p className="flex justify-between">
                <span>Range:</span>
                <span className="font-bold">{range.toFixed(1)} m</span>
              </p>
              <p className="flex justify-between">
                <span>Current:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{time.toFixed(1)} s</span>
              </p>
            </div>
          </div>
        </div>

        {/* Simulator */}
        <div className="md:col-span-2 flex flex-col overflow-hidden">
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gradient-to-b from-sky-200 to-sky-100 dark:from-gray-700 dark:to-gray-800"
          />
          
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h4 className="font-semibold mb-2 dark:text-white text-sm">Legend</h4>
            <div className="grid grid-cols-2 gap-2 text-xs dark:text-gray-300">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <span>Projectile</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-blue-500"></div>
                <span>Trajectory</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-green-500"></div>
                <span>Velocity Vector</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-purple-500"></div>
                <span>Launch Angle</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
