import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

export const PendulumSimulator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [length, setLength] = useState(200);
  const [mass, setMass] = useState(10);
  const [gravity, setGravity] = useState(9.8);
  const [initialAngle, setInitialAngle] = useState(45);
  const [isRunning, setIsRunning] = useState(false);
  const [angle, setAngle] = useState(45);
  const [angularVelocity, setAngularVelocity] = useState(0);
  const [time, setTime] = useState(0);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(0);

  const period = 2 * Math.PI * Math.sqrt(length / 100 / gravity);

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

      const dt = 0.016; // ~60fps
      const angleRad = (angle * Math.PI) / 180;
      const angularAcceleration = (-gravity / (length / 100)) * Math.sin(angleRad);
      
      const newAngularVelocity = angularVelocity + angularAcceleration * dt;
      const newAngle = angle + newAngularVelocity * dt * (180 / Math.PI);
      
      setAngularVelocity(newAngularVelocity);
      setAngle(newAngle);

      // Clear canvas
      const isDark = document.documentElement.classList.contains('dark');
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = isDark ? '#080c18' : '#f8f9fc';
      ctx.fillRect(0, 0, W, H);

      // Draw pivot
      const pivotX = W / 2;
      const pivotY = 50;
      ctx.fillStyle = isDark ? '#999' : '#666';
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, 5, 0, Math.PI * 2);
      ctx.fill();

      // Calculate bob position
      const bobX = pivotX + (length * Math.sin((newAngle * Math.PI) / 180));
      const bobY = pivotY + (length * Math.cos((newAngle * Math.PI) / 180));

      // Draw string
      ctx.strokeStyle = isDark ? '#888' : '#333';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY);
      ctx.lineTo(bobX, bobY);
      ctx.stroke();

      // Draw bob with glow effect
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#EF4444';
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(bobX, bobY, mass, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#991B1B';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw motion trail
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = '#EF4444';
      for (let i = 0; i < 5; i++) {
        const trailAngle = newAngle - i * 2;
        const trailX = pivotX + (length * Math.sin((trailAngle * Math.PI) / 180));
        const trailY = pivotY + (length * Math.cos((trailAngle * Math.PI) / 180));
        ctx.beginPath();
        ctx.arc(trailX, trailY, mass * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Draw velocity vector
      const velocityScale = 5;
      const velocityX = angularVelocity * Math.cos((newAngle * Math.PI) / 180) * velocityScale;
      const velocityY = -angularVelocity * Math.sin((newAngle * Math.PI) / 180) * velocityScale;
      
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(bobX, bobY);
      ctx.lineTo(bobX + velocityX, bobY + velocityY);
      ctx.stroke();

      // Draw arc showing angle
      ctx.strokeStyle = '#8B5CF6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, 30, Math.PI / 2, Math.PI / 2 + (newAngle * Math.PI) / 180);
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
  }, [isRunning, angle, angularVelocity, length, mass, gravity]);

  const handleStart = () => {
    startTimeRef.current = 0;
    setTime(0);
    setAngle(initialAngle);
    setAngularVelocity(0);
    setIsRunning(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    startTimeRef.current = 0;
    setTime(0);
    setAngle(initialAngle);
    setAngularVelocity(0);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const energy = 0.5 * mass * Math.pow(angularVelocity * (length / 100), 2) + 
                 mass * gravity * (length / 100) * (1 - Math.cos((angle * Math.PI) / 180));

  return (
    <div className="h-full flex flex-col p-3 overflow-hidden">
      <h2 className="text-lg font-bold mb-2 dark:text-white">Pendulum Simulator</h2>
      
      <div className="flex-1 grid md:grid-cols-3 gap-3 overflow-hidden min-h-0">
        {/* Controls */}
        <div className="space-y-2 overflow-y-auto">
          <div>
            <label className="block text-xs font-medium mb-0.5 dark:text-gray-300">
              Length: {length} px
            </label>
            <input
              type="range"
              min="100"
              max="300"
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full"
              disabled={isRunning}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-0.5 dark:text-gray-300">
              Mass: {mass} kg
            </label>
            <input
              type="range"
              min="5"
              max="20"
              value={mass}
              onChange={(e) => setMass(Number(e.target.value))}
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

          <div>
            <label className="block text-xs font-medium mb-0.5 dark:text-gray-300">
              Angle: {initialAngle}°
            </label>
            <input
              type="range"
              min="5"
              max="85"
              value={initialAngle}
              onChange={(e) => setInitialAngle(Number(e.target.value))}
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
              Start
            </button>
            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          {/* Calculations */}
          <div className="space-y-1 p-2 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold dark:text-white text-xs flex items-center gap-1">
              📊 Data
            </h3>
            <div className="text-[10px] space-y-0.5 dark:text-gray-300">
              <p className="flex justify-between">
                <span>Period:</span>
                <span className="font-bold">{period.toFixed(2)} s</span>
              </p>
              <p className="flex justify-between">
                <span>Freq:</span>
                <span className="font-bold">{(1 / period).toFixed(2)} Hz</span>
              </p>
              <p className="flex justify-between">
                <span>Angle:</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">{angle.toFixed(1)}°</span>
              </p>
              <p className="flex justify-between">
                <span>ω:</span>
                <span className="font-bold">{angularVelocity.toFixed(2)}</span>
              </p>
              <p className="flex justify-between">
                <span>Energy:</span>
                <span className="font-bold text-green-600 dark:text-green-400">{energy.toFixed(1)} J</span>
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
            className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gradient-to-b from-sky-100 to-white dark:from-gray-700 dark:to-gray-800"
          />
          
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h4 className="font-semibold mb-2 dark:text-white text-sm">Legend</h4>
            <div className="grid grid-cols-2 gap-2 text-xs dark:text-gray-300">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <span>Pendulum Bob</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-green-500"></div>
                <span>Velocity Vector</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-purple-500"></div>
                <span>Angle Arc</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-gray-700"></div>
                <span>String</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
