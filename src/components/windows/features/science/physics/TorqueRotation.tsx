import React, { useState, useRef, useEffect } from 'react';
import { Settings, Play, Pause, RotateCcw, Info } from 'lucide-react';

type DemoMode = 'torque' | 'angular-momentum' | 'moment-of-inertia';

export const TorqueRotation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [mode, setMode] = useState<DemoMode>('torque');
  const [appliedForce, setAppliedForce] = useState(50); // N
  const [leverArm, setLeverArm] = useState(50); // % of max
  const [massDistribution, setMassDistribution] = useState(50); // % towards edge
  const timeRef = useRef(0);
  const angleRef = useRef(0);
  const angVelRef = useRef(0);

  const resetSimulation = () => {
    timeRef.current = 0;
    angleRef.current = 0;
    angVelRef.current = 0;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    const obs = new ResizeObserver(resize);
    obs.observe(canvas);

    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      if (!isPlaying) return;
      timeRef.current += 0.016;

      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = '#0a0f1a';
      ctx.fillRect(0, 0, w, h);

      const cx = w * 0.45;
      const cy = h * 0.5;
      const maxR = Math.min(w * 0.35, h * 0.4);

      if (mode === 'torque') {
        // Wrench/lever demo
        const r = maxR * (leverArm / 100);
        const torque = appliedForce * r * 0.01;
        const I = 10; // moment of inertia
        const alpha = torque / I;
        const friction = 0.02;

        angVelRef.current += alpha * 0.01;
        angVelRef.current *= (1 - friction);
        angleRef.current += angVelRef.current;

        const angle = angleRef.current;

        // Draw pivot
        ctx.fillStyle = 'rgba(100, 120, 150, 0.8)';
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(200, 200, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw beam
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);

        // Full beam
        ctx.strokeStyle = 'rgba(180, 160, 120, 0.9)';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-maxR * 0.1, 0);
        ctx.lineTo(maxR, 0);
        ctx.stroke();

        // Filled section up to lever arm
        ctx.strokeStyle = 'rgba(255, 200, 80, 0.6)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(r, 0);
        ctx.stroke();

        // Force application point
        ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
        ctx.beginPath();
        ctx.arc(r, 0, 6, 0, Math.PI * 2);
        ctx.fill();

        // Force arrow (perpendicular to lever)
        const forceLen = appliedForce * 0.5;
        ctx.strokeStyle = 'rgba(255, 80, 80, 0.8)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(r, -forceLen);
        ctx.stroke();
        // Arrowhead
        ctx.fillStyle = 'rgba(255, 80, 80, 0.8)';
        ctx.beginPath();
        ctx.moveTo(r, -forceLen - 6);
        ctx.lineTo(r - 4, -forceLen + 2);
        ctx.lineTo(r + 4, -forceLen + 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 80, 80, 0.8)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`F = ${appliedForce} N`, r, -forceLen - 12);

        // Lever arm dimension
        ctx.strokeStyle = 'rgba(255, 200, 80, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(0, 15);
        ctx.lineTo(r, 15);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(255, 200, 80, 0.7)';
        ctx.font = '9px monospace';
        ctx.fillText(`r = ${(r * 0.01).toFixed(2)} m`, r / 2, 28);

        ctx.restore();

        // Rotation arc indicator
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(cx, cy, maxR * 0.6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Angular velocity indicator
        ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        const omega = angVelRef.current;
        ctx.fillText(`ω = ${(omega * 60).toFixed(1)} rad/s`, cx, cy + maxR + 30);

        // Torque value
        ctx.fillStyle = 'rgba(255, 200, 80, 0.8)';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`τ = ${torque.toFixed(1)} N·m`, cx, 25);
        ctx.font = '10px monospace';
        ctx.fillStyle = 'rgba(200, 200, 255, 0.5)';
        ctx.fillText('τ = F × r', cx, 42);
      } else if (mode === 'angular-momentum') {
        // Spinning figure skater analogy
        const armExtension = massDistribution / 100;
        const I = 5 + armExtension * 20; // moment of inertia increases with arm extension
        const L = 100; // conserved angular momentum
        const omega = L / I;

        angleRef.current += omega * 0.02;
        const angle = angleRef.current;

        // Circle track
        ctx.strokeStyle = 'rgba(100, 130, 200, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, maxR * 0.7, 0, Math.PI * 2);
        ctx.stroke();

        // Spinning object
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);

        // Body
        ctx.fillStyle = 'rgba(100, 150, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();

        // Arms (extending based on mass distribution)
        const armLen = 20 + armExtension * (maxR * 0.5);
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.8)';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-armLen, 0);
        ctx.lineTo(armLen, 0);
        ctx.stroke();

        // Masses at ends of arms
        const massR = 5 + armExtension * 5;
        ctx.fillStyle = 'rgba(255, 150, 100, 0.9)';
        ctx.beginPath();
        ctx.arc(-armLen, 0, massR, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(armLen, 0, massR, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Speed lines
        const numLines = Math.min(20, Math.round(omega * 2));
        for (let i = 0; i < numLines; i++) {
          const a = angle + (i * Math.PI * 2) / numLines;
          const r1 = maxR * 0.5;
          const r2 = maxR * 0.65;
          ctx.strokeStyle = `rgba(100, 200, 255, ${0.05 + omega * 0.003})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(cx, cy, r1 + (r2 - r1) * 0.5, a, a + 0.2);
          ctx.stroke();
        }

        // Labels
        ctx.fillStyle = 'rgba(200, 200, 255, 0.8)';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`L = Iω = ${L.toFixed(0)} (conserved)`, cx, 25);

        ctx.font = '10px monospace';
        ctx.fillStyle = 'rgba(255, 180, 100, 0.7)';
        ctx.fillText(`I = ${I.toFixed(1)} kg·m²`, cx - w * 0.15, h - 30);
        ctx.fillStyle = 'rgba(100, 200, 255, 0.7)';
        ctx.fillText(`ω = ${omega.toFixed(2)} rad/s`, cx + w * 0.15, h - 30);
      } else {
        // Moment of inertia comparison (shapes)
        const shapes = [
          { name: 'Solid Disk', formula: '½MR²', factor: 0.5 },
          { name: 'Ring', formula: 'MR²', factor: 1.0 },
          { name: 'Solid Sphere', formula: '⅖MR²', factor: 0.4 },
          { name: 'Hollow Sphere', formula: '⅔MR²', factor: 0.667 },
        ];

        // Ramp
        const rampLeft = w * 0.1;
        const rampRight = w * 0.85;
        const rampTop = h * 0.2;
        const rampBot = h * 0.75;
        ctx.strokeStyle = 'rgba(150, 150, 200, 0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(rampLeft, rampTop);
        ctx.lineTo(rampRight, rampBot);
        ctx.stroke();

        const t = timeRef.current;
        const rampLen = Math.sqrt((rampRight - rampLeft) ** 2 + (rampBot - rampTop) ** 2);
        const sinAngle = (rampBot - rampTop) / rampLen;
        const cosAngle = (rampRight - rampLeft) / rampLen;

        shapes.forEach((shape, idx) => {
          // a = g sinθ / (1 + I/MR²) = g sinθ / (1 + factor)
          const accel = 9.81 * sinAngle / (1 + shape.factor);
          const pos = 0.5 * accel * t * t * 15;
          const progress = Math.min(pos / rampLen, 0.95);

          const xPos = rampLeft + (rampRight - rampLeft) * progress;
          const yPos = rampTop + (rampBot - rampTop) * progress;

          // Rolling angle
          const rollAngle = pos * 0.1;

          const objR = 12;
          const offsetY = -20 - idx * 4;

          ctx.save();
          ctx.translate(xPos, yPos + offsetY);
          ctx.rotate(rollAngle);

          // Draw shape differently based on type
          const colors = ['#4a9eff', '#ff6b6b', '#4ade80', '#fbbf24'];
          ctx.strokeStyle = colors[idx];
          ctx.lineWidth = shape.factor > 0.8 ? 3 : 2;
          ctx.fillStyle = shape.factor > 0.8 ? 'transparent' : colors[idx].replace(')', ', 0.3)').replace('rgb', 'rgba').replace('#', '');

          if (idx === 0) {
            // Solid disk
            ctx.fillStyle = 'rgba(74, 158, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(0, 0, objR, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // Spoke
            ctx.beginPath();
            ctx.moveTo(-objR, 0);
            ctx.lineTo(objR, 0);
            ctx.stroke();
          } else if (idx === 1) {
            // Ring
            ctx.beginPath();
            ctx.arc(0, 0, objR, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-objR, 0);
            ctx.lineTo(objR, 0);
            ctx.stroke();
          } else if (idx === 2) {
            // Solid sphere (filled circle with cross-hatch)
            ctx.fillStyle = 'rgba(74, 222, 128, 0.3)';
            ctx.beginPath();
            ctx.arc(0, 0, objR, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, -objR);
            ctx.lineTo(0, objR);
            ctx.stroke();
          } else {
            // Hollow sphere
            ctx.beginPath();
            ctx.arc(0, 0, objR, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, objR * 0.6, 0, Math.PI * 2);
            ctx.stroke();
          }

          ctx.restore();

          // Label
          ctx.fillStyle = colors[idx];
          ctx.font = '9px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`${shape.name} (I=${shape.formula})`, w * 0.02, h * 0.85 + idx * 14);
        });

        // Title
        ctx.fillStyle = 'rgba(200, 200, 255, 0.8)';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Race Down the Ramp!', w / 2, 20);
        ctx.font = '9px sans-serif';
        ctx.fillStyle = 'rgba(200, 200, 255, 0.5)';
        ctx.fillText('Lower I/MR² → reaches bottom first', w / 2, 36);
      }
    };

    animate();
    return () => {
      cancelAnimationFrame(animRef.current);
      obs.disconnect();
    };
  }, [isPlaying, mode, appliedForce, leverArm, massDistribution]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-950 to-orange-950/30 p-3 overflow-hidden">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="h-5 w-5 text-orange-400" />
            Torque & Rotational Motion
          </h2>
          <p className="text-[11px] text-gray-400">Torque, angular momentum & moment of inertia</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsPlaying(!isPlaying)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-900/50 text-orange-300 text-xs font-medium">
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button onClick={resetSimulation} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 text-xs font-medium">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 min-w-0 min-h-0">
          <div className="rounded-lg shadow-md h-full overflow-hidden border border-gray-800">
            <canvas ref={canvasRef} className="w-full h-full" />
          </div>
        </div>

        <div className="w-[210px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-2">
            <h4 className="text-[11px] font-semibold text-gray-400 uppercase">Demo Mode</h4>
            {([['torque', 'Torque & Lever'], ['angular-momentum', 'Angular Momentum'], ['moment-of-inertia', 'Moment of Inertia']] as [DemoMode, string][]).map(([key, label]) => (
              <button key={key} onClick={() => { setMode(key); resetSimulation(); }} className={`block w-full text-left px-2 py-1 rounded text-[10px] ${mode === key ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                {label}
              </button>
            ))}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-3">
            <h4 className="text-[11px] font-semibold text-gray-400 uppercase">Controls</h4>
            {mode === 'torque' && (
              <>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Applied Force: {appliedForce} N</label>
                  <input type="range" min="10" max="100" step="5" value={appliedForce} onChange={e => setAppliedForce(+e.target.value)} className="w-full h-1.5 rounded-full appearance-none bg-gray-700" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Lever Arm: {leverArm}%</label>
                  <input type="range" min="10" max="100" step="5" value={leverArm} onChange={e => setLeverArm(+e.target.value)} className="w-full h-1.5 rounded-full appearance-none bg-gray-700" />
                </div>
              </>
            )}
            {mode === 'angular-momentum' && (
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Arm Extension: {massDistribution}%</label>
                <input type="range" min="5" max="100" step="5" value={massDistribution} onChange={e => setMassDistribution(+e.target.value)} className="w-full h-1.5 rounded-full appearance-none bg-gray-700" />
                <p className="text-[8px] text-gray-500 mt-1">Pull arms in to spin faster — angular momentum is conserved!</p>
              </div>
            )}
            {mode === 'moment-of-inertia' && (
              <p className="text-[9px] text-gray-400">Watch different shapes race down the ramp. Objects with lower moment of inertia ratio (I/MR²) accelerate faster!</p>
            )}
          </div>

          <div className="bg-orange-950/30 border border-orange-800/40 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-orange-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Info className="h-3 w-3" /> Rotational Dynamics
            </h4>
            <div className="space-y-1 text-[9px] text-gray-400">
              <p className="font-mono bg-gray-800/50 rounded px-1 py-0.5">τ = r × F = Iα</p>
              <p className="font-mono bg-gray-800/50 rounded px-1 py-0.5">L = Iω (conserved)</p>
              <p>Torque causes angular acceleration. Angular momentum is conserved when no external torque acts — reducing I increases ω.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
