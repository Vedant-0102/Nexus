import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

export const SpringSimulator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [springConstant, setSpringConstant] = useState(0.1);
  const [mass, setMass] = useState(1);
  const [damping, setDamping] = useState(0.99);
  const [initialDisplacement, setInitialDisplacement] = useState(100);
  const [isRunning, setIsRunning] = useState(false);
  const [displacement, setDisplacement] = useState(100);
  const [velocity, setVelocity] = useState(0);
  const [time, setTime] = useState(0);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(0);

  const frequency = Math.sqrt(springConstant / mass) / (2 * Math.PI);
  const period = frequency > 0 ? 1 / frequency : 0;

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

      // Spring physics (Hooke's Law: F = -kx)
      const force = -springConstant * displacement;
      const acceleration = force / mass;
      
      const newVelocity = (velocity + acceleration) * damping;
      const newDisplacement = displacement + newVelocity;
      
      setVelocity(newVelocity);
      setDisplacement(newDisplacement);

      // Clear canvas
      const isDark = document.documentElement.classList.contains('dark');
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = isDark ? '#080c18' : '#f8f9fc';
      ctx.fillRect(0, 0, W, H);

      const centerY = H / 2;
      const equilibrium = W / 2;
      const massX = equilibrium + newDisplacement;

      // Draw equilibrium line
      ctx.strokeStyle = '#FFD93D';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(equilibrium, 0);
      ctx.lineTo(equilibrium, H);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw spring
      ctx.strokeStyle = '#4ECDC4';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(50, centerY);
      
      const coils = 15;
      const coilWidth = (massX - 50) / coils;
      const coilHeight = 15;
      
      for (let i = 0; i < coils; i++) {
        const x = 50 + i * coilWidth;
        const y = centerY + (i % 2 === 0 ? -coilHeight : coilHeight);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(massX, centerY);
      ctx.stroke();

      // Draw wall
      ctx.fillStyle = isDark ? '#999' : '#666';
      ctx.fillRect(40, centerY - 60, 10, 120);
      
      // Draw mass with glow effect
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#EF4444';
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(massX - 20, centerY - 20, 40, 40);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#991B1B';
      ctx.lineWidth = 2;
      ctx.strokeRect(massX - 20, centerY - 20, 40, 40);

      // Draw motion trail
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = '#EF4444';
      for (let i = 1; i < 5; i++) {
        ctx.fillRect(massX - 20 - i * 5, centerY - 20, 40, 40);
      }
      ctx.globalAlpha = 1;

      // Draw velocity vector
      const velocityScale = 10;
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(massX, centerY);
      ctx.lineTo(massX + newVelocity * velocityScale, centerY);
      ctx.stroke();

      // Draw force vector
      const forceScale = 50;
      ctx.strokeStyle = '#8B5CF6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(massX, centerY + 30);
      ctx.lineTo(massX + force * forceScale, centerY + 30);
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
  }, [isRunning, displacement, velocity, springConstant, mass, damping]);

  const handleStart = () => {
    startTimeRef.current = 0;
    setTime(0);
    setDisplacement(initialDisplacement);
    setVelocity(0);
    setIsRunning(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    startTimeRef.current = 0;
    setTime(0);
    setDisplacement(initialDisplacement);
    setVelocity(0);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const kineticEnergy = 0.5 * mass * Math.pow(velocity, 2);
  const potentialEnergy = 0.5 * springConstant * Math.pow(displacement, 2);
  const totalEnergy = kineticEnergy + potentialEnergy;

  return (
    <div className="h-full flex flex-col p-3 overflow-hidden">
      <h2 className="text-lg font-bold mb-2 dark:text-white">Spring Oscillator</h2>
      
      <div className="flex-1 grid md:grid-cols-3 gap-3 overflow-hidden min-h-0">
        {/* Controls */}
        <div className="space-y-2 overflow-y-auto">
          <div>
            <label className="block text-xs font-medium mb-0.5 dark:text-gray-300">
              Spring Constant (k): {springConstant.toFixed(2)} N/m
            </label>
            <input
              type="range"
              min="0.01"
              max="0.5"
              step="0.01"
              value={springConstant}
              onChange={(e) => setSpringConstant(Number(e.target.value))}
              className="w-full"
              disabled={isRunning}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-0.5 dark:text-gray-300">
              Mass: {mass.toFixed(1)} kg
            </label>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.1"
              value={mass}
              onChange={(e) => setMass(Number(e.target.value))}
              className="w-full"
              disabled={isRunning}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-0.5 dark:text-gray-300">
              Damping: {damping.toFixed(2)}
            </label>
            <input
              type="range"
              min="0.90"
              max="1.00"
              step="0.01"
              value={damping}
              onChange={(e) => setDamping(Number(e.target.value))}
              className="w-full"
              disabled={isRunning}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-0.5 dark:text-gray-300">
              Initial Displacement: {initialDisplacement} px
            </label>
            <input
              type="range"
              min="-150"
              max="150"
              value={initialDisplacement}
              onChange={(e) => setInitialDisplacement(Number(e.target.value))}
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
                <span>Frequency:</span>
                <span className="font-bold">{frequency.toFixed(2)} Hz</span>
              </p>
              <p className="flex justify-between">
                <span>Displacement:</span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400">{displacement.toFixed(1)} px</span>
              </p>
              <p className="flex justify-between">
                <span>Velocity:</span>
                <span className="font-bold text-green-600 dark:text-green-400">{velocity.toFixed(2)} px/s</span>
              </p>
              <p className="flex justify-between">
                <span>KE:</span>
                <span className="font-bold">{kineticEnergy.toFixed(2)} J</span>
              </p>
              <p className="flex justify-between">
                <span>PE:</span>
                <span className="font-bold">{potentialEnergy.toFixed(2)} J</span>
              </p>
              <p className="flex justify-between">
                <span>Total E:</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">{totalEnergy.toFixed(2)} J</span>
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
                <div className="w-4 h-4 bg-red-500"></div>
                <span>Mass</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-green-500"></div>
                <span>Velocity Vector</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-purple-500"></div>
                <span>Force Vector</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-cyan-500"></div>
                <span>Spring</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-yellow-500" style={{ borderTop: '2px dashed' }}></div>
                <span>Equilibrium</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
