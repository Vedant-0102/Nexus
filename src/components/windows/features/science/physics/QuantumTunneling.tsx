import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Atom, Play, Pause, RotateCcw, Info } from 'lucide-react';

type QMode = 'tunneling' | 'double-slit';

export const QuantumTunneling: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [mode, setMode] = useState<QMode>('tunneling');
  const [barrierHeight, setBarrierHeight] = useState(5);
  const [particleEnergy, setParticleEnergy] = useState(3);
  const [barrierWidth, setBarrierWidth] = useState(40);
  const [slitSeparation, setSlitSeparation] = useState(40);
  const [wavelength, setWavelength] = useState(30);
  const timeRef = useRef(0);
  const hitsRef = useRef<{ x: number; y: number }[]>([]);

  const tunnelingProbability = particleEnergy >= barrierHeight
    ? 1.0
    : Math.exp(-2 * Math.sqrt(2 * (barrierHeight - particleEnergy)) * barrierWidth * 0.02);

  const resetSimulation = useCallback(() => {
    timeRef.current = 0;
    hitsRef.current = [];
  }, []);

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

      ctx.fillStyle = '#080812';
      ctx.fillRect(0, 0, w, h);

      if (mode === 'tunneling') {
        const t = timeRef.current;
        const cy = h / 2;
        const barrierX = w * 0.45;
        const bw = barrierWidth * 1.5;
        const bh = barrierHeight * (h * 0.07);

        // Draw potential energy landscape
        ctx.strokeStyle = 'rgba(200, 200, 255, 0.15)';
        ctx.lineWidth = 0.5;
        for (let y = 0; y < h; y += 30) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }

        // Barrier
        ctx.fillStyle = 'rgba(255, 80, 80, 0.15)';
        ctx.fillRect(barrierX, cy - bh, bw, bh * 2);
        ctx.strokeStyle = 'rgba(255, 80, 80, 0.6)';
        ctx.lineWidth = 2;
        ctx.strokeRect(barrierX, cy - bh, bw, bh * 2);

        // Barrier label
        ctx.fillStyle = 'rgba(255, 80, 80, 0.7)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`V₀ = ${barrierHeight} eV`, barrierX + bw / 2, cy - bh - 8);

        // Energy level line
        const eY = cy - particleEnergy * (h * 0.07);
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(20, eY);
        ctx.lineTo(w - 20, eY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(100, 200, 255, 0.6)';
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`E = ${particleEnergy} eV`, 25, eY - 5);

        // Wave function visualization
        const k1 = Math.sqrt(particleEnergy) * 0.3;
        const kappa = Math.sqrt(Math.max(0, barrierHeight - particleEnergy)) * 0.1;
        const k2 = k1;
        const amp = 30;
        const phase = t * 3;

        ctx.strokeStyle = 'rgba(100, 180, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let x = 20; x < w - 20; x++) {
          let psi: number;
          if (x < barrierX) {
            // Incident + reflected wave
            psi = amp * Math.sin(k1 * x - phase);
            if (particleEnergy < barrierHeight) {
              psi += amp * (1 - tunnelingProbability) * 0.3 * Math.sin(-k1 * x - phase);
            }
          } else if (x < barrierX + bw) {
            // Inside barrier - exponential decay
            const xRel = x - barrierX;
            const decay = Math.exp(-kappa * xRel);
            psi = amp * decay * Math.sin(k1 * barrierX - phase) * tunnelingProbability;
          } else {
            // Transmitted wave
            psi = amp * tunnelingProbability * Math.sin(k2 * x - phase);
          }

          const yPos = eY + psi;
          if (x === 20) ctx.moveTo(x, yPos);
          else ctx.lineTo(x, yPos);
        }
        ctx.stroke();

        // Probability density |ψ|² (shaded)
        ctx.fillStyle = 'rgba(100, 180, 255, 0.08)';
        ctx.beginPath();
        ctx.moveTo(20, eY);
        for (let x = 20; x < w - 20; x++) {
          let psi: number;
          if (x < barrierX) {
            psi = amp * Math.sin(k1 * x - phase);
          } else if (x < barrierX + bw) {
            const xRel = x - barrierX;
            const decay = Math.exp(-kappa * xRel);
            psi = amp * decay * Math.sin(k1 * barrierX - phase) * tunnelingProbability;
          } else {
            psi = amp * tunnelingProbability * Math.sin(k2 * x - phase);
          }
          ctx.lineTo(x, eY + psi);
        }
        ctx.lineTo(w - 20, eY);
        ctx.fill();

        // Particle (probability cloud)
        const px = ((t * 40) % (w + 100)) - 50;
        if (px < barrierX || Math.random() < tunnelingProbability) {
          const effectiveAmp = px > barrierX && px < barrierX + bw
            ? tunnelingProbability * 0.5
            : px > barrierX + bw ? tunnelingProbability : 1;
          if (effectiveAmp > 0.01) {
            const glow = ctx.createRadialGradient(px, eY, 0, px, eY, 15);
            glow.addColorStop(0, `rgba(100, 200, 255, ${effectiveAmp * 0.8})`);
            glow.addColorStop(1, 'rgba(100, 200, 255, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(px, eY, 15, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Probability readout
        ctx.fillStyle = 'rgba(200, 200, 255, 0.8)';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Tunneling Probability: ${(tunnelingProbability * 100).toFixed(1)}%`, w / 2, h - 15);

      } else {
        // Double-slit experiment
        const t = timeRef.current;
        const wallX = w * 0.35;
        const screenX = w * 0.8;
        const cy = h / 2;
        const sep = slitSeparation * 1.5;
        const slitW = 12;

        // Wall
        ctx.fillStyle = 'rgba(100, 100, 130, 0.7)';
        ctx.fillRect(wallX - 4, 0, 8, cy - sep / 2 - slitW / 2);
        ctx.fillRect(wallX - 4, cy - sep / 2 + slitW / 2, 8, sep - slitW);
        ctx.fillRect(wallX - 4, cy + sep / 2 + slitW / 2, 8, h - cy - sep / 2 - slitW / 2);

        // Slit glow
        ctx.fillStyle = 'rgba(150, 200, 255, 0.4)';
        ctx.fillRect(wallX - 3, cy - sep / 2 - slitW / 2, 6, slitW);
        ctx.fillRect(wallX - 3, cy + sep / 2 - slitW / 2, 6, slitW);

        // Incoming waves (plane waves)
        for (let i = 0; i < 12; i++) {
          const xOff = ((t * 60 + i * 20) % 240);
          const wx = wallX - 240 + xOff;
          if (wx > 10 && wx < wallX - 5) {
            ctx.strokeStyle = `rgba(100, 180, 255, ${0.05 + 0.02 * Math.sin(t + i)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(wx, 20);
            ctx.lineTo(wx, h - 20);
            ctx.stroke();
          }
        }

        // Circular waves from slits (interference)
        const slit1Y = cy - sep / 2;
        const slit2Y = cy + sep / 2;
        const lambda = wavelength;
        const numWaves = 15;

        for (let i = 1; i <= numWaves; i++) {
          const r = ((t * 60 + i * lambda) % (w * 0.8));
          if (r < 5) continue;

          // From slit 1
          ctx.strokeStyle = `rgba(100, 180, 255, ${Math.max(0, 0.08 - r * 0.0002)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(wallX, slit1Y, r, -Math.PI / 3, Math.PI / 3);
          ctx.stroke();

          // From slit 2
          ctx.strokeStyle = `rgba(255, 150, 100, ${Math.max(0, 0.08 - r * 0.0002)})`;
          ctx.beginPath();
          ctx.arc(wallX, slit2Y, r, -Math.PI / 3, Math.PI / 3);
          ctx.stroke();
        }

        // Screen
        ctx.fillStyle = 'rgba(30, 30, 50, 0.8)';
        ctx.fillRect(screenX, 15, 12, h - 30);

        // Fire particles and accumulate hits
        if (t > 0.1) {
          for (let shot = 0; shot < 3; shot++) {
            // Probability based on double-slit interference
            const yScreen = (Math.random() - 0.5) * (h - 40) + cy;
            const dy1 = yScreen - slit1Y;
            const dy2 = yScreen - slit2Y;
            const dx = screenX - wallX;
            const r1 = Math.sqrt(dx * dx + dy1 * dy1);
            const r2 = Math.sqrt(dx * dx + dy2 * dy2);
            const pathDiff = r2 - r1;
            const phase = (2 * Math.PI * pathDiff) / lambda;
            const intensity = Math.cos(phase / 2) ** 2;

            if (Math.random() < intensity * 0.4) {
              hitsRef.current.push({ x: screenX + 2 + Math.random() * 8, y: yScreen });
              if (hitsRef.current.length > 3000) hitsRef.current.shift();
            }
          }
        }

        // Draw accumulated hits
        for (const hit of hitsRef.current) {
          ctx.fillStyle = 'rgba(100, 200, 255, 0.6)';
          ctx.fillRect(hit.x, hit.y, 1.5, 1.5);
        }

        // Build histogram
        const bins = 100;
        const binH = (h - 30) / bins;
        const histogram = new Array(bins).fill(0);
        for (const hit of hitsRef.current) {
          const bin = Math.floor((hit.y - 15) / binH);
          if (bin >= 0 && bin < bins) histogram[bin]++;
        }
        const maxBin = Math.max(...histogram, 1);

        // Draw histogram
        const histX = screenX + 18;
        const histW = w - histX - 10;
        if (histW > 20) {
          ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (let i = 0; i < bins; i++) {
            const barW = (histogram[i] / maxBin) * histW;
            const y = 15 + i * binH;
            if (i === 0) ctx.moveTo(histX + barW, y);
            else ctx.lineTo(histX + barW, y);
          }
          ctx.stroke();
        }

        // Labels
        ctx.fillStyle = 'rgba(200, 200, 255, 0.5)';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Slits', wallX, h - 5);
        ctx.fillText('Screen', screenX + 6, h - 5);
        ctx.fillText(`Hits: ${hitsRef.current.length}`, w / 2, 12);
      }
    };

    animate();
    return () => {
      cancelAnimationFrame(animRef.current);
      obs.disconnect();
    };
  }, [isPlaying, mode, barrierHeight, particleEnergy, barrierWidth, slitSeparation, wavelength, tunnelingProbability]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-950 to-purple-950 p-3 overflow-hidden">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Atom className="h-5 w-5 text-purple-400" />
            Quantum Mechanics Lab
          </h2>
          <p className="text-[11px] text-gray-400">Tunneling & Double-Slit Experiment</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsPlaying(!isPlaying)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-900/50 text-purple-300 text-xs font-medium">
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
            <h4 className="text-[11px] font-semibold text-gray-400 uppercase">Experiment</h4>
            <button onClick={() => { setMode('tunneling'); resetSimulation(); }} className={`block w-full text-left px-2 py-1 rounded text-[10px] ${mode === 'tunneling' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
              Quantum Tunneling
            </button>
            <button onClick={() => { setMode('double-slit'); resetSimulation(); }} className={`block w-full text-left px-2 py-1 rounded text-[10px] ${mode === 'double-slit' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
              Double-Slit Experiment
            </button>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-3">
            <h4 className="text-[11px] font-semibold text-gray-400 uppercase">Parameters</h4>
            {mode === 'tunneling' ? (
              <>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Particle Energy: {particleEnergy} eV</label>
                  <input type="range" min="1" max="8" step="0.5" value={particleEnergy} onChange={e => setParticleEnergy(+e.target.value)} className="w-full h-1.5 rounded-full appearance-none bg-gray-700" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Barrier Height: {barrierHeight} eV</label>
                  <input type="range" min="2" max="10" step="0.5" value={barrierHeight} onChange={e => setBarrierHeight(+e.target.value)} className="w-full h-1.5 rounded-full appearance-none bg-gray-700" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Barrier Width: {barrierWidth}</label>
                  <input type="range" min="10" max="80" step="5" value={barrierWidth} onChange={e => setBarrierWidth(+e.target.value)} className="w-full h-1.5 rounded-full appearance-none bg-gray-700" />
                </div>
                <div className="bg-purple-950/40 rounded-md px-2 py-1.5">
                  <div className="text-[9px] text-gray-500 uppercase">Tunneling Probability</div>
                  <div className="text-sm font-mono font-bold text-purple-400">{(tunnelingProbability * 100).toFixed(1)}%</div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Slit Separation: {slitSeparation}</label>
                  <input type="range" min="15" max="80" step="5" value={slitSeparation} onChange={e => { setSlitSeparation(+e.target.value); resetSimulation(); }} className="w-full h-1.5 rounded-full appearance-none bg-gray-700" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Wavelength: {wavelength}</label>
                  <input type="range" min="10" max="60" step="5" value={wavelength} onChange={e => { setWavelength(+e.target.value); resetSimulation(); }} className="w-full h-1.5 rounded-full appearance-none bg-gray-700" />
                </div>
              </>
            )}
          </div>

          <div className="bg-purple-950/30 border border-purple-800/40 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-purple-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Info className="h-3 w-3" /> {mode === 'tunneling' ? 'Quantum Tunneling' : 'Wave-Particle Duality'}
            </h4>
            <div className="space-y-1 text-[9px] text-gray-400">
              {mode === 'tunneling' ? (
                <>
                  <p>A quantum particle can penetrate classically forbidden regions.</p>
                  <p className="font-mono bg-gray-800/50 rounded px-1 py-0.5">T ∝ e^(-2κa)</p>
                  <p>κ = √(2m(V₀-E))/ℏ — the decay constant inside the barrier.</p>
                  <p>Essential for nuclear decay, STM microscopy, and flash memory.</p>
                </>
              ) : (
                <>
                  <p>Individual particles build up an interference pattern — each goes through both slits simultaneously!</p>
                  <p className="font-mono bg-gray-800/50 rounded px-1 py-0.5">d sin(θ) = mλ</p>
                  <p>This demonstrates wave-particle duality: observation collapses the wave function.</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
