import React, { useState, useRef, useEffect } from 'react';
import { Play, RotateCcw } from 'lucide-react';

export const CollisionSimulator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mass1, setMass1] = useState(5);
  const [velocity1, setVelocity1] = useState(5);
  const [mass2, setMass2] = useState(5);
  const [velocity2, setVelocity2] = useState(-3);
  const [elasticity, setElasticity] = useState(1); // 1 = elastic, 0 = inelastic
  const [isRunning, setIsRunning] = useState(false);
  const [hasCollided, setHasCollided] = useState(false);
  
  const [pos1, setPos1] = useState(100);
  const [pos2, setPos2] = useState(500);
  const [vel1, setVel1] = useState(velocity1);
  const [vel2, setVel2] = useState(velocity2);
  
  const animationRef = useRef<number>();

  const initialMomentum = mass1 * velocity1 + mass2 * velocity2;
  const initialKE = 0.5 * mass1 * velocity1 * velocity1 + 0.5 * mass2 * velocity2 * velocity2;
  const currentMomentum = mass1 * vel1 + mass2 * vel2;
  const currentKE = 0.5 * mass1 * vel1 * vel1 + 0.5 * mass2 * vel2 * vel2;

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

    const draw = () => {
      if (!isRunning) return;
      const { width: W, height: H } = canvas.getBoundingClientRect();

      // Update positions
      const newPos1 = pos1 + vel1;
      const newPos2 = pos2 + vel2;

      // Check for collision
      const radius1 = mass1 * 3;
      const radius2 = mass2 * 3;
      const distance = Math.abs(newPos2 - newPos1);

      if (distance <= radius1 + radius2 && !hasCollided) {
        // Collision detected - calculate new velocities
        const v1f = ((mass1 - elasticity * mass2) * vel1 + (1 + elasticity) * mass2 * vel2) / (mass1 + mass2);
        const v2f = ((mass2 - elasticity * mass1) * vel2 + (1 + elasticity) * mass1 * vel1) / (mass1 + mass2);
        
        setVel1(v1f);
        setVel2(v2f);
        setHasCollided(true);
      }

      setPos1(newPos1);
      setPos2(newPos2);

      // Stop if balls leave canvas
      if (newPos1 < -50 || newPos1 > W + 50 || newPos2 < -50 || newPos2 > W + 50) {
        setIsRunning(false);
        return;
      }

      // Clear canvas
      ctx.clearRect(0, 0, W, H);
      const isDark = document.documentElement.classList.contains('dark');

      // Draw ground
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(0, H - 20, W, 20);

      // Draw center line
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(W / 2, 0);
      ctx.lineTo(W / 2, H - 20);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw ball 1 with glow
      const y = H - 20 - radius1;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#3B82F6';
      ctx.fillStyle = '#3B82F6';
      ctx.beginPath();
      ctx.arc(newPos1, y, radius1, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#1E40AF';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Add shine effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(newPos1 - radius1 / 3, y - radius1 / 3, radius1 / 3, 0, Math.PI * 2);
      ctx.fill();

      // Draw velocity vector for ball 1
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(newPos1, y);
      ctx.lineTo(newPos1 + vel1 * 10, y);
      ctx.stroke();

      // Draw ball 2 with glow
      const y2 = H - 20 - radius2;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#EF4444';
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(newPos2, y2, radius2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#991B1B';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Add shine effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(newPos2 - radius2 / 3, y2 - radius2 / 3, radius2 / 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw collision impact effect
      if (hasCollided && distance <= radius1 + radius2 + 10) {
        ctx.strokeStyle = '#FBBF24';
        ctx.lineWidth = 4;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc((newPos1 + newPos2) / 2, (y + y2) / 2, (radius1 + radius2) / 2 + i * 10, 0, Math.PI * 2);
          ctx.globalAlpha = 0.3 - i * 0.1;
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      // Draw velocity vector for ball 2
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(newPos2, y2);
      ctx.lineTo(newPos2 + vel2 * 10, y2);
      ctx.stroke();

      // Draw labels
      ctx.fillStyle = isDark ? '#fff' : '#1a1a2e';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(`m₁=${mass1}kg`, newPos1 - 20, y - radius1 - 10);
      ctx.fillText(`m₂=${mass2}kg`, newPos2 - 20, y2 - radius2 - 10);

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
  }, [isRunning, pos1, pos2, vel1, vel2, mass1, mass2, hasCollided, elasticity]);

  const handleStart = () => {
    setPos1(100);
    setPos2(500);
    setVel1(velocity1);
    setVel2(velocity2);
    setHasCollided(false);
    setIsRunning(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    setPos1(100);
    setPos2(500);
    setVel1(velocity1);
    setVel2(velocity2);
    setHasCollided(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  return (
    <div className="h-full flex flex-col p-3 overflow-hidden">
      <h2 className="text-lg font-bold mb-2 dark:text-white">Collision Simulator</h2>
      
      <div className="flex-1 grid md:grid-cols-3 gap-3 overflow-hidden min-h-0">
        {/* Controls */}
        <div className="space-y-2 overflow-y-auto">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-semibold mb-1 dark:text-white text-xs">Ball 1</h3>
            <div className="space-y-1">
              <div>
                <label className="block text-[10px] font-medium mb-0.5 dark:text-gray-300">
                  Mass: {mass1} kg
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={mass1}
                  onChange={(e) => setMass1(Number(e.target.value))}
                  className="w-full"
                  disabled={isRunning}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 dark:text-gray-300">
                  Velocity: {velocity1} m/s
                </label>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="0.5"
                  value={velocity1}
                  onChange={(e) => setVelocity1(Number(e.target.value))}
                  className="w-full"
                  disabled={isRunning}
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <h3 className="font-semibold mb-2 dark:text-white text-sm">Ball 2 (Red)</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium mb-1 dark:text-gray-300">
                  Mass: {mass2} kg
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={mass2}
                  onChange={(e) => setMass2(Number(e.target.value))}
                  className="w-full"
                  disabled={isRunning}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 dark:text-gray-300">
                  Velocity: {velocity2} m/s
                </label>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="0.5"
                  value={velocity2}
                  onChange={(e) => setVelocity2(Number(e.target.value))}
                  className="w-full"
                  disabled={isRunning}
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h3 className="font-semibold mb-2 dark:text-white text-sm">Collision Type</h3>
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-gray-300">
                Elasticity: {elasticity === 1 ? 'Elastic' : elasticity === 0 ? 'Perfectly Inelastic' : 'Partially Elastic'}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={elasticity}
                onChange={(e) => setElasticity(Number(e.target.value))}
                className="w-full"
                disabled={isRunning}
              />
            </div>
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
          <div className="space-y-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <h3 className="font-semibold dark:text-white text-sm">Conservation Laws</h3>
            <div className="text-xs space-y-1 dark:text-gray-300">
              <div>
                <p className="font-semibold">Momentum:</p>
                <p>Initial: {initialMomentum.toFixed(2)} kg·m/s</p>
                <p>Current: {currentMomentum.toFixed(2)} kg·m/s</p>
                <p className={currentMomentum.toFixed(1) === initialMomentum.toFixed(1) ? 'text-green-600 font-semibold' : 'text-red-600'}>
                  {currentMomentum.toFixed(1) === initialMomentum.toFixed(1) ? '✓ Conserved' : '⚠ Calculating...'}
                </p>
              </div>
              <div className="pt-2 border-t border-gray-300 dark:border-gray-600">
                <p className="font-semibold">Kinetic Energy:</p>
                <p>Initial: {initialKE.toFixed(2)} J</p>
                <p>Current: {currentKE.toFixed(2)} J</p>
                <p>Loss: {(initialKE - currentKE).toFixed(2)} J ({initialKE > 0 ? ((1 - currentKE / initialKE) * 100).toFixed(1) : '0.0'}%)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Simulator */}
        <div className="md:col-span-2 flex flex-col overflow-hidden">
          <canvas
            ref={canvasRef}
            width={600}
            height={300}
            className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gradient-to-b from-sky-200 to-sky-100 dark:from-gray-700 dark:to-gray-800"
          />
          
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h4 className="font-semibold mb-2 dark:text-white text-sm">About Collisions</h4>
            <p className="text-xs dark:text-gray-300 mb-2">
              In all collisions, momentum is conserved. In elastic collisions (e=1), kinetic energy is also conserved. 
              In inelastic collisions (e&lt;1), some kinetic energy is converted to other forms like heat and sound.
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs dark:text-gray-300">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                <span>Ball 1</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <span>Ball 2</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-green-500"></div>
                <span>Velocity</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
