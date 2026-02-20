import React, { useState, useRef, useEffect } from 'react';
import { Scan, Play, Pause, RotateCcw, Info } from 'lucide-react';

export const DiffractionGrating: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [wavelength, setWavelength] = useState(550); // nm (green)
  const [slitCount, setSlitCount] = useState(5);
  const [slitSpacing, setSlitSpacing] = useState(20); // μm
  const [slitWidth, setSlitWidth] = useState(5); // μm
  const [showEnvelope, setShowEnvelope] = useState(true);
  const timeRef = useRef(0);

  const wavelengthToColor = (wl: number): string => {
    let r = 0, g = 0, b = 0;
    if (wl >= 380 && wl < 440) { r = -(wl - 440) / 60; b = 1; }
    else if (wl < 490) { g = (wl - 440) / 50; b = 1; }
    else if (wl < 510) { g = 1; b = -(wl - 510) / 20; }
    else if (wl < 580) { r = (wl - 510) / 70; g = 1; }
    else if (wl < 645) { r = 1; g = -(wl - 645) / 65; }
    else if (wl <= 780) { r = 1; }
    return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
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
      timeRef.current += 0.02;

      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = '#080812';
      ctx.fillRect(0, 0, w, h);

      const gratingX = w * 0.3;
      const screenX = w * 0.85;
      const centerY = h / 2;
      const color = wavelengthToColor(wavelength);

      // Draw incoming wave
      const wavePhase = timeRef.current * 5;
      ctx.strokeStyle = color.replace('rgb', 'rgba').replace(')', ', 0.3)');
      ctx.lineWidth = 1;
      for (let y = 30; y < h - 30; y += 4) {
        const phase = wavePhase - y * 0.02;
        const amp = 2;
        const x = gratingX - 80 + Math.sin(phase) * amp;
        ctx.fillStyle = color.replace('rgb', 'rgba').replace(')', `, ${0.1 + Math.sin(phase) * 0.05})`);
        ctx.fillRect(x - 1, y, 2, 2);
      }

      // Draw plane waves approaching
      for (let i = 0; i < 8; i++) {
        const xOff = ((wavePhase * 5 + i * 25) % 200) - 200;
        const wx = gratingX + xOff - 80;
        if (wx > 0 && wx < gratingX) {
          ctx.strokeStyle = color.replace('rgb', 'rgba').replace(')', ', 0.1)');
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(wx, 30);
          ctx.lineTo(wx, h - 30);
          ctx.stroke();
        }
      }

      // Draw grating
      ctx.fillStyle = 'rgba(100, 120, 150, 0.8)';
      ctx.fillRect(gratingX - 3, 10, 6, h - 20);

      // Slits
      const totalGratingH = slitCount * slitSpacing * 3;
      const gratingTop = centerY - totalGratingH / 2;
      for (let i = 0; i < slitCount; i++) {
        const sy = gratingTop + i * slitSpacing * 3;
        const slitH = slitWidth * 1.5;
        ctx.clearRect(gratingX - 4, sy - slitH / 2, 8, slitH);
        ctx.fillStyle = color.replace('rgb', 'rgba').replace(')', ', 0.5)');
        ctx.fillRect(gratingX - 2, sy - slitH / 2, 4, slitH);
      }

      // Grating label
      ctx.fillStyle = 'rgba(200, 200, 255, 0.5)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Grating', gratingX, h - 5);

      // Calculate diffraction pattern on screen
      const screenH = h - 60;
      const screenTop = 30;
      const lambda = wavelength * 1e-9; // m
      const d = slitSpacing * 1e-6; // m slit spacing
      const a = slitWidth * 1e-6; // m slit width
      const L = 1; // screen distance (arbitrary units scaled)

      // Pattern array
      const pattern: number[] = [];
      let maxI = 0;

      for (let py = 0; py < screenH; py++) {
        const y = ((py - screenH / 2) / screenH) * 0.15; // angle approx
        const theta = y;

        // Single slit envelope
        const beta = (Math.PI * a * Math.sin(theta)) / lambda;
        const singleSlit = beta === 0 ? 1 : Math.pow(Math.sin(beta) / beta, 2);

        // Multi-slit interference
        const delta = (Math.PI * d * Math.sin(theta)) / lambda;
        const multiSlit = delta === 0 ? slitCount * slitCount : Math.pow(Math.sin(slitCount * delta) / Math.sin(delta), 2);

        const intensity = singleSlit * multiSlit / (slitCount * slitCount);
        pattern.push(intensity);
        if (intensity > maxI) maxI = intensity;
      }

      // Draw screen
      ctx.fillStyle = 'rgba(30, 30, 50, 0.8)';
      ctx.fillRect(screenX - 2, screenTop, 20, screenH);

      // Draw pattern on screen
      for (let py = 0; py < screenH; py++) {
        const intensity = pattern[py] / (maxI || 1);
        ctx.fillStyle = color.replace('rgb', 'rgba').replace(')', `, ${intensity})`);
        ctx.fillRect(screenX, screenTop + py, 18, 1);
      }

      // Draw intensity graph (right of screen)
      const graphX = screenX + 25;
      const graphW = w - graphX - 10;
      if (graphW > 30) {
        ctx.strokeStyle = 'rgba(200, 200, 255, 0.1)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(graphX, screenTop);
        ctx.lineTo(graphX, screenTop + screenH);
        ctx.stroke();

        // Intensity curve
        ctx.strokeStyle = color.replace('rgb', 'rgba').replace(')', ', 0.8)');
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let py = 0; py < screenH; py++) {
          const intensity = pattern[py] / (maxI || 1);
          const x = graphX + intensity * graphW * 0.8;
          if (py === 0) ctx.moveTo(x, screenTop + py);
          else ctx.lineTo(x, screenTop + py);
        }
        ctx.stroke();

        // Single slit envelope
        if (showEnvelope) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          for (let py = 0; py < screenH; py++) {
            const y = ((py - screenH / 2) / screenH) * 0.15;
            const beta = (Math.PI * a * Math.sin(y)) / lambda;
            const envIntensity = beta === 0 ? 1 : Math.pow(Math.sin(beta) / beta, 2);
            const x = graphX + envIntensity * graphW * 0.8;
            if (py === 0) ctx.moveTo(x, screenTop + py);
            else ctx.lineTo(x, screenTop + py);
          }
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Draw diffracted rays from slits to bright spots (m=0, ±1, ±2)
      for (let m = -3; m <= 3; m++) {
        const sinTheta = m * lambda / d;
        if (Math.abs(sinTheta) > 1) continue;
        const screenYm = centerY + sinTheta * screenH * 3;
        if (screenYm < screenTop - 20 || screenYm > screenTop + screenH + 20) continue;

        const rayAlpha = m === 0 ? 0.3 : 0.12;
        for (let i = 0; i < slitCount; i++) {
          const sy = gratingTop + i * slitSpacing * 3;
          ctx.strokeStyle = color.replace('rgb', 'rgba').replace(')', `, ${rayAlpha})`);
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(gratingX + 3, sy);
          ctx.lineTo(screenX, screenYm);
          ctx.stroke();
        }

        // Order label
        if (screenYm > screenTop && screenYm < screenTop + screenH) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.font = '8px monospace';
          ctx.textAlign = 'right';
          ctx.fillText(`m=${m}`, screenX - 5, screenYm + 3);
        }
      }

      // Screen label
      ctx.fillStyle = 'rgba(200, 200, 255, 0.5)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Screen', screenX + 9, h - 5);
    };

    animate();
    return () => {
      cancelAnimationFrame(animRef.current);
      obs.disconnect();
    };
  }, [isPlaying, wavelength, slitCount, slitSpacing, slitWidth, showEnvelope]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-950 to-indigo-950 p-3 overflow-hidden">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Scan className="h-5 w-5 text-violet-400" />
            Diffraction Grating Simulator
          </h2>
          <p className="text-[11px] text-gray-400">Multi-slit diffraction & interference patterns</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsPlaying(!isPlaying)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-900/50 text-indigo-300 text-xs font-medium">
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
              <label className="text-[10px] text-gray-400 block mb-1">
                Wavelength: {wavelength} nm
                <span className="inline-block w-3 h-3 rounded-full ml-1 align-middle" style={{ backgroundColor: wavelengthToColor(wavelength) }} />
              </label>
              <input type="range" min="380" max="750" step="5" value={wavelength} onChange={e => setWavelength(+e.target.value)} className="w-full h-1.5 rounded-full appearance-none bg-gray-700" />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">Number of Slits: {slitCount}</label>
              <input type="range" min="2" max="20" step="1" value={slitCount} onChange={e => setSlitCount(+e.target.value)} className="w-full h-1.5 rounded-full appearance-none bg-gray-700" />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">Slit Spacing: {slitSpacing} μm</label>
              <input type="range" min="5" max="50" step="1" value={slitSpacing} onChange={e => setSlitSpacing(+e.target.value)} className="w-full h-1.5 rounded-full appearance-none bg-gray-700" />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">Slit Width: {slitWidth} μm</label>
              <input type="range" min="1" max="20" step="1" value={slitWidth} onChange={e => setSlitWidth(+e.target.value)} className="w-full h-1.5 rounded-full appearance-none bg-gray-700" />
            </div>
            <label className="flex items-center gap-2 text-[10px] text-gray-300 cursor-pointer">
              <input type="checkbox" checked={showEnvelope} onChange={e => setShowEnvelope(e.target.checked)} className="rounded" />
              Show single-slit envelope
            </label>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-2">
            <h4 className="text-[11px] font-semibold text-gray-400 uppercase">Maxima Positions</h4>
            <div className="text-[9px] text-gray-400 space-y-1">
              {[0, 1, 2, 3].map(m => {
                const sinTheta = (m * wavelength * 1e-9) / (slitSpacing * 1e-6);
                return sinTheta <= 1 ? (
                  <div key={m} className="flex justify-between bg-gray-800/50 rounded px-1.5 py-0.5">
                    <span>m = {m}</span>
                    <span className="font-mono">{m === 0 ? '0°' : `±${(Math.asin(sinTheta) * 180 / Math.PI).toFixed(1)}°`}</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>

          <div className="bg-violet-950/30 border border-violet-800/40 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-violet-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Info className="h-3 w-3" /> Diffraction
            </h4>
            <div className="space-y-1 text-[9px] text-gray-400">
              <p>Maxima occur when path difference equals mλ:</p>
              <p className="font-mono bg-gray-800/50 rounded px-1 py-0.5">d sin(θ) = mλ</p>
              <p>As the number of slits increases, the bright fringes become sharper. More slits = more precise wavelength selection.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
