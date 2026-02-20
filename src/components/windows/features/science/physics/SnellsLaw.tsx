import React, { useState, useRef, useEffect } from 'react';
import { Lightbulb, Play, Pause, RotateCcw, Info } from 'lucide-react';

interface Ray {
  x1: number; y1: number;
  x2: number; y2: number;
  refracted: boolean;
  reflected: boolean;
  totalInternalReflection: boolean;
}

export const SnellsLaw: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [incidentAngle, setIncidentAngle] = useState(30); // degrees
  const [medium1, setMedium1] = useState<'air' | 'water' | 'glass' | 'diamond'>('air');
  const [medium2, setMedium2] = useState<'air' | 'water' | 'glass' | 'diamond'>('glass');
  const [showNormal, setShowNormal] = useState(true);
  const [showProtractor, setShowProtractor] = useState(true);
  const timeRef = useRef(0);

  const refractiveIndices: Record<string, number> = {
    air: 1.0003,
    water: 1.333,
    glass: 1.52,
    diamond: 2.417,
  };

  const mediumColors: Record<string, string> = {
    air: 'rgba(200, 220, 255, 0.05)',
    water: 'rgba(50, 100, 200, 0.2)',
    glass: 'rgba(180, 200, 220, 0.15)',
    diamond: 'rgba(200, 180, 255, 0.2)',
  };

  const n1 = refractiveIndices[medium1];
  const n2 = refractiveIndices[medium2];

  // Snell's law: n1 sin(θ1) = n2 sin(θ2)
  const thetaI = (incidentAngle * Math.PI) / 180;
  const sinThetaR = (n1 * Math.sin(thetaI)) / n2;
  const isTIR = Math.abs(sinThetaR) > 1;
  const thetaR = isTIR ? Math.PI / 2 : Math.asin(sinThetaR);
  const criticalAngle = n1 > n2 ? null : Math.asin(n2 > n1 ? n1 / n2 : 1) * (180 / Math.PI);
  const criticalAngleFromDenser = n1 < n2 ? null : Math.asin(n2 / n1) * (180 / Math.PI);

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
      timeRef.current += 0.03;

      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      const interfaceY = h / 2;
      const hitX = w * 0.45;

      // Medium 1 (top)
      ctx.fillStyle = mediumColors[medium1];
      ctx.fillRect(0, 0, w, interfaceY);
      ctx.fillStyle = 'rgba(200, 200, 255, 0.4)';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${medium1.charAt(0).toUpperCase() + medium1.slice(1)} (n = ${n1.toFixed(3)})`, 10, 20);

      // Medium 2 (bottom)
      ctx.fillStyle = mediumColors[medium2];
      ctx.fillRect(0, interfaceY, w, h - interfaceY);
      ctx.fillStyle = 'rgba(200, 200, 255, 0.4)';
      ctx.fillText(`${medium2.charAt(0).toUpperCase() + medium2.slice(1)} (n = ${n2.toFixed(3)})`, 10, interfaceY + 20);

      // Interface line
      ctx.strokeStyle = 'rgba(200, 200, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, interfaceY);
      ctx.lineTo(w, interfaceY);
      ctx.stroke();

      // Normal line
      if (showNormal) {
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.25)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(hitX, interfaceY - 150);
        ctx.lineTo(hitX, interfaceY + 150);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(200, 200, 200, 0.4)';
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('Normal', hitX + 5, interfaceY - 140);
      }

      // Protractor
      if (showProtractor) {
        const protR = 100;
        ctx.strokeStyle = 'rgba(200, 200, 255, 0.08)';
        ctx.lineWidth = 0.5;
        for (let deg = 0; deg <= 90; deg += 10) {
          const rad = (deg * Math.PI) / 180;
          // Top half
          ctx.beginPath();
          ctx.moveTo(hitX, interfaceY);
          ctx.lineTo(hitX - Math.sin(rad) * protR, interfaceY - Math.cos(rad) * protR);
          ctx.stroke();
          // Bottom half
          ctx.beginPath();
          ctx.moveTo(hitX, interfaceY);
          ctx.lineTo(hitX + Math.sin(rad) * protR, interfaceY + Math.cos(rad) * protR);
          ctx.stroke();

          if (deg > 0 && deg < 90) {
            ctx.fillStyle = 'rgba(200, 200, 255, 0.2)';
            ctx.font = '7px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${deg}°`, hitX - Math.sin(rad) * (protR + 10), interfaceY - Math.cos(rad) * (protR + 10));
          }
        }
        // Arc
        ctx.strokeStyle = 'rgba(200, 200, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(hitX, interfaceY, protR, -Math.PI / 2, Math.PI / 2, false);
        ctx.stroke();
      }

      // Wave pulse animation along incident ray
      const rayLength = 250;
      const incDx = -Math.sin(thetaI);
      const incDy = -Math.cos(thetaI);
      const startX = hitX + incDx * rayLength;
      const startY = interfaceY + incDy * rayLength;

      // Incident ray
      ctx.strokeStyle = 'rgba(255, 220, 50, 0.9)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(hitX, interfaceY);
      ctx.stroke();

      // Incident ray glow
      const iglow = ctx.createLinearGradient(startX, startY, hitX, interfaceY);
      iglow.addColorStop(0, 'rgba(255, 220, 50, 0)');
      iglow.addColorStop(1, 'rgba(255, 220, 50, 0.4)');
      ctx.strokeStyle = iglow;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(hitX, interfaceY);
      ctx.stroke();

      // Pulse along incident ray
      const pulseSpeed = 2;
      const pulsePos = (timeRef.current * pulseSpeed) % 1;
      const pxI = startX + (hitX - startX) * pulsePos;
      const pyI = startY + (interfaceY - startY) * pulsePos;
      ctx.fillStyle = 'rgba(255, 255, 200, 0.9)';
      ctx.beginPath();
      ctx.arc(pxI, pyI, 4, 0, Math.PI * 2);
      ctx.fill();

      // Incident angle arc
      ctx.strokeStyle = 'rgba(255, 220, 50, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(hitX, interfaceY, 40, -Math.PI / 2, -Math.PI / 2 + thetaI, false);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 220, 50, 0.8)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      const aiLabelAngle = -Math.PI / 2 + thetaI / 2;
      ctx.fillText(`θ₁=${incidentAngle}°`, hitX + Math.cos(aiLabelAngle) * 55, interfaceY + Math.sin(aiLabelAngle) * 55);

      // Reflected ray
      ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      const refEndX = hitX + Math.sin(thetaI) * rayLength;
      const refEndY = interfaceY - Math.cos(thetaI) * rayLength;
      ctx.beginPath();
      ctx.moveTo(hitX, interfaceY);
      ctx.lineTo(refEndX, refEndY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Refracted ray
      if (!isTIR) {
        const refractedEndX = hitX - Math.sin(thetaR) * rayLength;
        const refractedEndY = interfaceY + Math.cos(thetaR) * rayLength;

        ctx.strokeStyle = 'rgba(100, 200, 255, 0.9)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(hitX, interfaceY);
        ctx.lineTo(refractedEndX, refractedEndY);
        ctx.stroke();

        // Refracted glow
        const rglow = ctx.createLinearGradient(hitX, interfaceY, refractedEndX, refractedEndY);
        rglow.addColorStop(0, 'rgba(100, 200, 255, 0.4)');
        rglow.addColorStop(1, 'rgba(100, 200, 255, 0)');
        ctx.strokeStyle = rglow;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(hitX, interfaceY);
        ctx.lineTo(refractedEndX, refractedEndY);
        ctx.stroke();

        // Pulse along refracted ray
        const pxR = hitX + (refractedEndX - hitX) * pulsePos;
        const pyR = interfaceY + (refractedEndY - interfaceY) * pulsePos;
        ctx.fillStyle = 'rgba(150, 220, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(pxR, pyR, 4, 0, Math.PI * 2);
        ctx.fill();

        // Refracted angle arc
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)';
        ctx.lineWidth = 1.5;
        const refAngleDeg = (thetaR * 180) / Math.PI;
        ctx.beginPath();
        ctx.arc(hitX, interfaceY, 40, Math.PI / 2 - thetaR, Math.PI / 2, false);
        ctx.stroke();
        ctx.fillStyle = 'rgba(100, 200, 255, 0.8)';
        ctx.font = '10px monospace';
        const arLabelAngle = Math.PI / 2 - thetaR / 2;
        ctx.fillText(`θ₂=${refAngleDeg.toFixed(1)}°`, hitX + Math.cos(arLabelAngle) * 55, interfaceY + Math.sin(arLabelAngle) * 55);
      } else {
        // Total internal reflection indicator
        ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Total Internal Reflection!', hitX, interfaceY + 30);

        // Strong reflected ray
        ctx.strokeStyle = 'rgba(255, 220, 50, 0.9)';
        ctx.lineWidth = 2.5;
        const tirEndX = hitX + Math.sin(thetaI) * rayLength;
        const tirEndY = interfaceY - Math.cos(thetaI) * rayLength;
        ctx.beginPath();
        ctx.moveTo(hitX, interfaceY);
        ctx.lineTo(tirEndX, tirEndY);
        ctx.stroke();
      }

      // Hit point
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(hitX, interfaceY, 4, 0, Math.PI * 2);
      ctx.fill();
    };

    animate();
    return () => {
      cancelAnimationFrame(animRef.current);
      obs.disconnect();
    };
  }, [isPlaying, incidentAngle, medium1, medium2, n1, n2, thetaI, thetaR, isTIR, showNormal, showProtractor]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-950 to-blue-950 p-3 overflow-hidden">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-400" />
            Snell's Law — Refraction
          </h2>
          <p className="text-[11px] text-gray-400">Interactive light refraction at media interfaces</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsPlaying(!isPlaying)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900/50 text-blue-300 text-xs font-medium">
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {isPlaying ? 'Pause' : 'Play'}
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
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-3">
            <h4 className="text-[11px] font-semibold text-gray-400 uppercase">Controls</h4>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">Incident Angle: {incidentAngle}°</label>
              <input type="range" min="0" max="89" step="1" value={incidentAngle} onChange={e => setIncidentAngle(+e.target.value)} className="w-full h-1.5 rounded-full appearance-none bg-gray-700" />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">Medium 1 (top):</label>
              <select value={medium1} onChange={e => setMedium1(e.target.value as any)} className="w-full bg-gray-800 text-gray-300 text-[10px] rounded px-2 py-1 border border-gray-700">
                <option value="air">Air (n=1.000)</option>
                <option value="water">Water (n=1.333)</option>
                <option value="glass">Glass (n=1.520)</option>
                <option value="diamond">Diamond (n=2.417)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">Medium 2 (bottom):</label>
              <select value={medium2} onChange={e => setMedium2(e.target.value as any)} className="w-full bg-gray-800 text-gray-300 text-[10px] rounded px-2 py-1 border border-gray-700">
                <option value="air">Air (n=1.000)</option>
                <option value="water">Water (n=1.333)</option>
                <option value="glass">Glass (n=1.520)</option>
                <option value="diamond">Diamond (n=2.417)</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-[10px] text-gray-300 cursor-pointer">
              <input type="checkbox" checked={showNormal} onChange={e => setShowNormal(e.target.checked)} className="rounded" />
              Show normal line
            </label>
            <label className="flex items-center gap-2 text-[10px] text-gray-300 cursor-pointer">
              <input type="checkbox" checked={showProtractor} onChange={e => setShowProtractor(e.target.checked)} className="rounded" />
              Show protractor
            </label>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-2">
            <h4 className="text-[11px] font-semibold text-gray-400 uppercase">Measurements</h4>
            <div className="bg-yellow-950/40 rounded-md px-2 py-1.5">
              <div className="text-[9px] text-gray-500 uppercase">Incident Angle (θ₁)</div>
              <div className="text-sm font-mono font-bold text-yellow-400">{incidentAngle}°</div>
            </div>
            <div className="bg-blue-950/40 rounded-md px-2 py-1.5">
              <div className="text-[9px] text-gray-500 uppercase">Refracted Angle (θ₂)</div>
              <div className="text-sm font-mono font-bold text-blue-400">{isTIR ? 'TIR' : `${((thetaR * 180) / Math.PI).toFixed(1)}°`}</div>
            </div>
            {criticalAngleFromDenser !== null && (
              <div className="bg-red-950/40 rounded-md px-2 py-1.5">
                <div className="text-[9px] text-gray-500 uppercase">Critical Angle</div>
                <div className="text-sm font-mono font-bold text-red-400">{criticalAngleFromDenser.toFixed(1)}°</div>
              </div>
            )}
          </div>

          <div className="bg-yellow-950/30 border border-yellow-800/40 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-yellow-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Info className="h-3 w-3" /> Snell's Law
            </h4>
            <div className="space-y-1 text-[9px] text-gray-400">
              <p className="font-mono bg-gray-800/50 rounded px-1 py-0.5">n₁ sin(θ₁) = n₂ sin(θ₂)</p>
              <p>When light passes from a denser to a less dense medium, total internal reflection occurs beyond the critical angle.</p>
              <p>θc = arcsin(n₂/n₁) — only when n₁ {">"} n₂</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
