import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Wind, Thermometer, Gauge, Info, Play, Pause, RotateCcw, TrendingUp, Atom, BookOpen, Zap, Beaker, FlaskConical, Scale } from 'lucide-react';

type GasLaw = 'boyle' | 'charles' | 'gay-lussac' | 'ideal';

interface LawInfo {
  name: string;
  formula: string;
  held: string;
  relationship: string;
  example: string;
}

const R_LATM = 0.08206; // L·atm/(mol·K) — NIST CODATA 2018

const gasLaws: Record<GasLaw, LawInfo> = {
  boyle: {
    name: "Boyle's Law",
    formula: 'P₁V₁ = P₂V₂',
    held: 'T, n constant',
    relationship: 'P ∝ 1/V',
    example: 'Syringe: halve volume → double pressure',
  },
  charles: {
    name: "Charles's Law",
    formula: 'V₁/T₁ = V₂/T₂',
    held: 'P, n constant',
    relationship: 'V ∝ T',
    example: 'Hot-air balloon expands when heated',
  },
  'gay-lussac': {
    name: "Gay-Lussac's",
    formula: 'P₁/T₁ = P₂/T₂',
    held: 'V, n constant',
    relationship: 'P ∝ T',
    example: 'Pressure cooker builds pressure with heat',
  },
  ideal: {
    name: 'Ideal Gas Law',
    formula: 'PV = nRT',
    held: 'General',
    relationship: 'Combines all three laws',
    example: '1 mol at STP → 22.414 L',
  },
};

function speedColor(speed: number, maxSpeed: number): string {
  const t = Math.min(speed / maxSpeed, 1);
  if (t < 0.5) {
    const s = t * 2;
    return `rgb(${Math.round(80 + 175 * s)},${Math.round(140 + 115 * s)},255)`;
  } else {
    const s = (t - 0.5) * 2;
    return `rgb(255,${Math.round(255 - 180 * s)},${Math.round(255 - 210 * s)})`;
  }
}

// Custom slider styles for cross-browser visibility
const sliderStyles = `
  .gas-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 8px;
    border-radius: 4px;
    outline: none;
    cursor: pointer;
  }
  .gas-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid white;
    cursor: pointer;
    box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    margin-top: 0px;
  }
  .gas-slider::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid white;
    cursor: pointer;
    box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  }
  .gas-slider.temp-slider { background: linear-gradient(to right, #93c5fd, #ef4444); }
  .gas-slider.temp-slider::-webkit-slider-thumb { background: #ef4444; }
  .gas-slider.temp-slider::-moz-range-thumb { background: #ef4444; }
  .gas-slider.vol-slider { background: linear-gradient(to right, #bfdbfe, #3b82f6); }
  .gas-slider.vol-slider::-webkit-slider-thumb { background: #3b82f6; }
  .gas-slider.vol-slider::-moz-range-thumb { background: #3b82f6; }
  .gas-slider.mol-slider { background: linear-gradient(to right, #e9d5ff, #8b5cf6); }
  .gas-slider.mol-slider::-webkit-slider-thumb { background: #8b5cf6; }
  .gas-slider.mol-slider::-moz-range-thumb { background: #8b5cf6; }
`;

export const GasLawsSimulator: React.FC = () => {
  const [temperature, setTemperature] = useState(300);
  const [volume, setVolume] = useState(10);
  const [moles, setMoles] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedLaw, setSelectedLaw] = useState<GasLaw>('ideal');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number }[]>([]);
  const animRef = useRef<number>(0);
  const isPlayingRef = useRef(true);
  const tempRef = useRef(300);
  const volRef = useRef(10);
  const molesRef = useRef(1.0);

  const pressure = (moles * R_LATM * temperature) / volume;

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { tempRef.current = temperature; }, [temperature]);
  useEffect(() => { volRef.current = volume; }, [volume]);
  useEffect(() => { molesRef.current = moles; }, [moles]);

  const numParticles = Math.min(Math.round(moles * 60), 120);

  const initParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;
    const h = canvas.height;
    const cw = (volRef.current / 25) * w * 0.85;
    const ch = h * 0.85;
    const ox = (w - cw) / 2;
    const oy = (h - ch) / 2;
    const speed = Math.sqrt(tempRef.current / 300) * 3;
    const arr: typeof particlesRef.current = [];
    for (let i = 0; i < numParticles; i++) {
      const angle = Math.random() * Math.PI * 2;
      arr.push({
        x: ox + Math.random() * cw,
        y: oy + Math.random() * ch,
        vx: Math.cos(angle) * speed * (0.5 + Math.random()),
        vy: Math.sin(angle) * speed * (0.5 + Math.random()),
      });
    }
    particlesRef.current = arr;
  }, [numParticles]);

  useEffect(() => { initParticles(); }, [initParticles]);

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
      initParticles();
    };
    resize();
    const resObs = new ResizeObserver(resize);
    resObs.observe(canvas);

    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      const cw = (volRef.current / 25) * w * 0.85;
      const ch = h * 0.85;
      const ox = (w - cw) / 2;
      const oy = (h - ch) / 2;
      const pistonX = ox + cw;

      ctx.clearRect(0, 0, w, h);

      // Container
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(200,220,240,0.08)';
      ctx.fillRect(ox, oy, cw, ch);
      ctx.strokeRect(ox, oy, cw, ch);

      // Piston
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(pistonX - 3, oy, 6, ch);
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        const gy = oy + ch * 0.2 + i * (ch * 0.6 / 4);
        ctx.beginPath();
        ctx.moveTo(pistonX - 2, gy);
        ctx.lineTo(pistonX + 2, gy);
        ctx.stroke();
      }

      ctx.fillStyle = '#9ca3af';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`V = ${volRef.current.toFixed(1)} L`, ox + cw / 2, oy - 6);

      const targetSpeed = Math.sqrt(tempRef.current / 300) * 3;
      const maxSpeed = Math.sqrt(500 / 300) * 3 * 1.8;

      const parts = particlesRef.current;
      if (isPlayingRef.current) {
        for (let i = 0; i < parts.length; i++) {
          const p = parts[i];
          p.x += p.vx;
          p.y += p.vy;
          if (p.x <= ox + 4) { p.vx = Math.abs(p.vx); p.x = ox + 4; }
          if (p.x >= pistonX - 4) { p.vx = -Math.abs(p.vx); p.x = pistonX - 4; }
          if (p.y <= oy + 4) { p.vy = Math.abs(p.vy); p.y = oy + 4; }
          if (p.y >= oy + ch - 4) { p.vy = -Math.abs(p.vy); p.y = oy + ch - 4; }
          const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          if (spd > 0.01) {
            const factor = 0.98 + 0.02 * (targetSpeed / spd);
            p.vx *= factor;
            p.vy *= factor;
          }
        }
      }

      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        ctx.fillStyle = speedColor(spd, maxSpeed);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Pressure arrows
      const pRef = (molesRef.current * R_LATM * tempRef.current) / volRef.current;
      const arrowCount = Math.min(Math.round(pRef / 2), 8);
      ctx.strokeStyle = 'rgba(239,68,68,0.5)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < arrowCount; i++) {
        const ay = oy + ch * 0.15 + i * (ch * 0.7 / Math.max(arrowCount - 1, 1));
        ctx.beginPath();
        ctx.moveTo(ox - 2, ay); ctx.lineTo(ox - 10, ay);
        ctx.moveTo(ox - 10, ay); ctx.lineTo(ox - 7, ay - 3);
        ctx.moveTo(ox - 10, ay); ctx.lineTo(ox - 7, ay + 3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pistonX + 2, ay); ctx.lineTo(pistonX + 10, ay);
        ctx.moveTo(pistonX + 10, ay); ctx.lineTo(pistonX + 7, ay - 3);
        ctx.moveTo(pistonX + 10, ay); ctx.lineTo(pistonX + 7, ay + 3);
        ctx.stroke();
      }
    };

    animate();
    return () => {
      cancelAnimationFrame(animRef.current);
      resObs.disconnect();
    };
  }, [initParticles]);

  // Graph data
  const graphPoints: { x: number; y: number }[] = [];
  const GRAPH_W = 100, GRAPH_H = 60;

  if (selectedLaw === 'boyle') {
    for (let v = 2; v <= 25; v += 0.5) graphPoints.push({ x: v, y: (moles * R_LATM * temperature) / v });
  } else if (selectedLaw === 'charles') {
    const pConst = pressure;
    for (let t = 100; t <= 600; t += 10) graphPoints.push({ x: t, y: (moles * R_LATM * t) / pConst });
  } else if (selectedLaw === 'gay-lussac') {
    for (let t = 100; t <= 600; t += 10) graphPoints.push({ x: t, y: (moles * R_LATM * t) / volume });
  } else {
    for (let n = 0.2; n <= 3; n += 0.1) graphPoints.push({ x: n, y: n * R_LATM * temperature });
  }

  const xMin = graphPoints.length > 0 ? Math.min(...graphPoints.map(p => p.x)) : 0;
  const xMax = graphPoints.length > 0 ? Math.max(...graphPoints.map(p => p.x)) : 1;
  const yMax = graphPoints.length > 0 ? Math.max(...graphPoints.map(p => p.y)) * 1.15 : 1;
  const toSvgX = (v: number) => ((v - xMin) / (xMax - xMin)) * GRAPH_W;
  const toSvgY = (p: number) => GRAPH_H - (p / yMax) * GRAPH_H;

  let curX = 0, curY = 0;
  if (selectedLaw === 'boyle') { curX = volume; curY = pressure; }
  else if (selectedLaw === 'charles') { curX = temperature; curY = volume; }
  else if (selectedLaw === 'gay-lussac') { curX = temperature; curY = pressure; }
  else { curX = moles; curY = moles * R_LATM * temperature; }

  let xLabel = '', yLabel = '';
  if (selectedLaw === 'boyle') { xLabel = 'Volume (L)'; yLabel = 'Pressure (atm)'; }
  else if (selectedLaw === 'charles') { xLabel = 'Temperature (K)'; yLabel = 'Volume (L)'; }
  else if (selectedLaw === 'gay-lussac') { xLabel = 'Temperature (K)'; yLabel = 'Pressure (atm)'; }
  else { xLabel = 'Moles (n)'; yLabel = 'PV (L·atm)'; }

  const law = gasLaws[selectedLaw];

  const reset = () => {
    setTemperature(300);
    setVolume(10);
    setMoles(1.0);
    initParticles();
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-3 overflow-hidden">
      <style>{sliderStyles}</style>

      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Wind className="h-5 w-5 text-cyan-600" />
            Gas Laws Simulator
          </h2>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            PV = nRT &mdash; R = 0.08206 L·atm·mol⁻¹·K⁻¹
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsPlaying(!isPlaying)}
            className={`p-1.5 rounded-lg transition-all ${isPlaying ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-green-100 dark:bg-green-900/30 text-green-600'}`}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button onClick={reset}
            className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all">
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Live readings bar */}
      <div className="flex gap-2 mb-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
          <Gauge className="h-4 w-4 text-red-500 flex-shrink-0" />
          <div>
            <div className="text-[9px] text-gray-400 uppercase">Pressure</div>
            <div className="text-sm font-bold font-mono text-gray-800 dark:text-white">{pressure.toFixed(2)} <span className="text-[10px] font-normal text-gray-400">atm</span></div>
          </div>
        </div>
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
          <FlaskConical className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <div>
            <div className="text-[9px] text-gray-400 uppercase">Volume</div>
            <div className="text-sm font-bold font-mono text-gray-800 dark:text-white">{volume.toFixed(1)} <span className="text-[10px] font-normal text-gray-400">L</span></div>
          </div>
        </div>
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
          <Thermometer className="h-4 w-4 text-orange-500 flex-shrink-0" />
          <div>
            <div className="text-[9px] text-gray-400 uppercase">Temperature</div>
            <div className="text-sm font-bold font-mono text-gray-800 dark:text-white">{temperature} <span className="text-[10px] font-normal text-gray-400">K</span></div>
          </div>
        </div>
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
          <Atom className="h-4 w-4 text-purple-500 flex-shrink-0" />
          <div>
            <div className="text-[9px] text-gray-400 uppercase">Moles</div>
            <div className="text-sm font-bold font-mono text-gray-800 dark:text-white">{moles.toFixed(1)} <span className="text-[10px] font-normal text-gray-400">mol</span></div>
          </div>
        </div>
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 shadow-sm border border-amber-200 dark:border-amber-700">
          <Scale className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <div>
            <div className="text-[9px] text-amber-500 uppercase">PV = nRT</div>
            <div className="text-sm font-bold font-mono text-amber-700 dark:text-amber-300">{(pressure * volume).toFixed(2)} <span className="text-[10px] font-normal text-amber-500">L·atm</span></div>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex gap-3 min-h-0">

        {/* Column 1: Controls + Law selector */}
        <div className="w-[230px] flex flex-col gap-2 flex-shrink-0">
          {/* Sliders */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 space-y-3">
            {/* Temperature */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Thermometer className="h-3.5 w-3.5 text-red-500" /> Temperature
                </span>
                <span className="text-xs font-bold font-mono text-red-600 dark:text-red-400">{temperature} K</span>
              </div>
              <input type="range" min="100" max="600" step="10" value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="gas-slider temp-slider" />
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-gray-400">100 K</span>
                <span className="text-[9px] text-gray-500 dark:text-gray-400">{(temperature - 273.15).toFixed(0)} °C</span>
                <span className="text-[9px] text-gray-400">600 K</span>
              </div>
            </div>
            {/* Volume */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Gauge className="h-3.5 w-3.5 text-blue-500" /> Volume
                </span>
                <span className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400">{volume.toFixed(1)} L</span>
              </div>
              <input type="range" min="2" max="25" step="0.5" value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="gas-slider vol-slider" />
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-gray-400">2 L</span>
                <span className="text-[9px] text-gray-400">25 L</span>
              </div>
            </div>
            {/* Moles */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Atom className="h-3.5 w-3.5 text-purple-500" /> Amount (n)
                </span>
                <span className="text-xs font-bold font-mono text-purple-600 dark:text-purple-400">{moles.toFixed(1)} mol</span>
              </div>
              <input type="range" min="0.2" max="3" step="0.1" value={moles}
                onChange={(e) => setMoles(Number(e.target.value))}
                className="gas-slider mol-slider" />
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-gray-400">0.2 mol</span>
                <span className="text-[9px] text-gray-400">3.0 mol</span>
              </div>
            </div>
          </div>

          {/* Gas Law selector */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2.5">
            <h4 className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="h-3 w-3 text-cyan-600 dark:text-cyan-400" /> Gas Law
            </h4>
            <div className="grid grid-cols-2 gap-1">
              {(Object.keys(gasLaws) as GasLaw[]).map(key => (
                <button key={key} onClick={() => setSelectedLaw(key)}
                  className={`text-left px-2 py-1.5 rounded-md text-[10px] transition-all ${selectedLaw === key
                    ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-200 border border-cyan-300 dark:border-cyan-700 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent'}`}>
                  <div className="font-semibold">{gasLaws[key].name}</div>
                  <div className="font-mono text-[9px] text-gray-400 dark:text-gray-500">{gasLaws[key].formula}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected law card */}
          <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg p-2.5">
            <div className="text-[11px] font-semibold text-cyan-800 dark:text-cyan-300 mb-1">{law.name}</div>
            <div className="text-center py-1.5 px-2 bg-white dark:bg-gray-800 rounded-md mb-1.5">
              <span className="text-sm font-bold font-mono text-cyan-700 dark:text-cyan-300">{law.formula}</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[9px]">
              <div className="bg-white/60 dark:bg-gray-800/60 rounded px-1.5 py-1">
                <div className="text-gray-400 uppercase">Held const.</div>
                <div className="text-gray-700 dark:text-gray-200 font-medium">{law.held}</div>
              </div>
              <div className="bg-white/60 dark:bg-gray-800/60 rounded px-1.5 py-1">
                <div className="text-gray-400 uppercase">Relation</div>
                <div className="text-gray-700 dark:text-gray-200 font-mono font-medium">{law.relationship}</div>
              </div>
            </div>
            <div className="mt-1.5 text-[9px] text-gray-500 dark:text-gray-400 bg-white/40 dark:bg-gray-800/40 rounded px-1.5 py-1">
              <span className="text-gray-600 dark:text-gray-300 font-medium">Example:</span> {law.example}
            </div>
          </div>

          {/* Speed legend */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Zap className="h-3 w-3 text-yellow-500" />
              <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">Particle Speed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-blue-400">Slow</span>
              <div className="flex-1 h-2.5 rounded-full" style={{ background: 'linear-gradient(to right, rgb(80,140,255), rgb(255,255,255), rgb(255,75,45))' }} />
              <span className="text-[9px] text-red-400">Fast</span>
            </div>
          </div>
        </div>

        {/* Column 2: Canvas + Graph */}
        <div className="flex-1 flex flex-col gap-2.5 min-w-0 min-h-0">
          {/* Gas container */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 flex flex-col" style={{ flex: '1 1 0', minHeight: 0 }}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-gray-800 dark:text-white flex items-center gap-1.5">
                <Beaker className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                Gas Container — {numParticles} particles
              </span>
              <span className="text-[9px] text-gray-400">Color = kinetic energy</span>
            </div>
            <div className="flex-1 min-h-0">
              <canvas ref={canvasRef} className="w-full h-full rounded" style={{ background: 'rgba(0,0,0,0.02)' }} />
            </div>
          </div>

          {/* Graph */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2.5" style={{ flex: '0 0 auto', height: 150 }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-800 dark:text-white flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                {law.name}: {yLabel} vs {xLabel}
              </span>
            </div>
            <svg className="w-full" viewBox="-12 -6 124 76" preserveAspectRatio="xMidYMid meet" style={{ height: 110 }}>
              <rect x="0" y="0" width={GRAPH_W} height={GRAPH_H} fill="none" stroke="#e5e7eb" strokeWidth="0.3" className="dark:opacity-30" />
              {[0, 0.25, 0.5, 0.75, 1].map(t => {
                const y = GRAPH_H * (1 - t);
                const val = t * yMax;
                return (
                  <g key={`gy-${t}`}>
                    <line x1="0" y1={y} x2={GRAPH_W} y2={y} stroke="#d1d5db" strokeWidth="0.2" className="dark:opacity-30" />
                    <text x="-2" y={y + 1.2} fill="#6b7280" fontSize="3" textAnchor="end">{val.toFixed(1)}</text>
                  </g>
                );
              })}
              {[0, 0.25, 0.5, 0.75, 1].map(t => {
                const x = GRAPH_W * t;
                const val = xMin + t * (xMax - xMin);
                return (
                  <g key={`gx-${t}`}>
                    <line x1={x} y1="0" x2={x} y2={GRAPH_H} stroke="#d1d5db" strokeWidth="0.2" className="dark:opacity-30" />
                    <text x={x} y={GRAPH_H + 4.5} fill="#6b7280" fontSize="3" textAnchor="middle">{val.toFixed(1)}</text>
                  </g>
                );
              })}
              <text x={GRAPH_W / 2} y={GRAPH_H + 9} fill="#9ca3af" fontSize="3" textAnchor="middle">{xLabel}</text>
              <text x={-9} y={GRAPH_H / 2} fill="#9ca3af" fontSize="3" textAnchor="middle" transform={`rotate(-90,-9,${GRAPH_H / 2})`}>{yLabel}</text>
              <path d={graphPoints.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(pt.x)},${toSvgY(pt.y)}`).join(' ')}
                fill="none" stroke="#3b82f6" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
              <path d={`${graphPoints.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(pt.x)},${toSvgY(pt.y)}`).join(' ')} L ${toSvgX(graphPoints[graphPoints.length - 1]?.x ?? 0)},${GRAPH_H} L ${toSvgX(graphPoints[0]?.x ?? 0)},${GRAPH_H} Z`}
                fill="url(#gasFill)" opacity="0.15" />
              <defs>
                <linearGradient id="gasFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <circle cx={toSvgX(curX)} cy={toSvgY(curY)} r="2.5" fill="#ef4444" stroke="#fff" strokeWidth="0.5" />
              <text x={toSvgX(curX) + 4} y={toSvgY(curY) - 3} fill="#ef4444" fontSize="3" fontWeight="bold">
                ({selectedLaw === 'boyle' ? `${volume.toFixed(1)}, ${pressure.toFixed(2)}` : selectedLaw === 'charles' ? `${temperature}, ${volume.toFixed(1)}` : selectedLaw === 'gay-lussac' ? `${temperature}, ${pressure.toFixed(2)}` : `${moles.toFixed(1)}, ${(moles * R_LATM * temperature).toFixed(1)}`})
              </text>
            </svg>
          </div>
        </div>

        {/* Column 3: Info cards */}
        <div className="w-[200px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          {/* Calculated values as cards */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2.5">
            <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Values</h4>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="bg-red-50 dark:bg-red-900/20 rounded-md px-2 py-1.5 text-center">
                <div className="text-[9px] text-red-400 uppercase">P (kPa)</div>
                <div className="text-xs font-bold font-mono text-red-700 dark:text-red-300">{(pressure * 101.325).toFixed(1)}</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md px-2 py-1.5 text-center">
                <div className="text-[9px] text-blue-400 uppercase">V (mL)</div>
                <div className="text-xs font-bold font-mono text-blue-700 dark:text-blue-300">{(volume * 1000).toFixed(0)}</div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-md px-2 py-1.5 text-center">
                <div className="text-[9px] text-amber-500 uppercase">Density</div>
                <div className="text-xs font-bold font-mono text-amber-700 dark:text-amber-300">{(moles * 28.97 / volume).toFixed(2)} <span className="text-[8px] font-normal">g/L</span></div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-md px-2 py-1.5 text-center">
                <div className="text-[9px] text-green-500 uppercase">Particles</div>
                <div className="text-xs font-bold font-mono text-green-700 dark:text-green-300">{numParticles}</div>
              </div>
            </div>
          </div>

          {/* STP Reference card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2.5">
            <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">STP Reference</h4>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-500 dark:text-gray-400">Temp</span>
                <span className="font-mono font-semibold text-gray-700 dark:text-gray-200">273.15 K</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-500 dark:text-gray-400">Pressure</span>
                <span className="font-mono font-semibold text-gray-700 dark:text-gray-200">1 atm</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-500 dark:text-gray-400">Molar Vol.</span>
                <span className="font-mono font-semibold text-gray-700 dark:text-gray-200">22.414 L</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-500 dark:text-gray-400">R</span>
                <span className="font-mono font-semibold text-gray-700 dark:text-gray-200">8.314 J/mol·K</span>
              </div>
            </div>
          </div>

          {/* Key concepts as icon cards */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-green-800 dark:text-green-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Info className="h-3 w-3" /> Key Concepts
            </h4>
            <div className="space-y-1">
              <div className="flex items-start gap-1.5 text-[9px] text-gray-600 dark:text-gray-300">
                <Thermometer className="h-3 w-3 text-red-400 flex-shrink-0 mt-0.5" />
                <span>↑ T → faster particles → ↑ P</span>
              </div>
              <div className="flex items-start gap-1.5 text-[9px] text-gray-600 dark:text-gray-300">
                <Gauge className="h-3 w-3 text-blue-400 flex-shrink-0 mt-0.5" />
                <span>↓ V → less space → ↑ P</span>
              </div>
              <div className="flex items-start gap-1.5 text-[9px] text-gray-600 dark:text-gray-300">
                <Atom className="h-3 w-3 text-purple-400 flex-shrink-0 mt-0.5" />
                <span>↑ n → more collisions → ↑ P</span>
              </div>
              <div className="flex items-start gap-1.5 text-[9px] text-gray-600 dark:text-gray-300">
                <Info className="h-3 w-3 text-gray-400 flex-shrink-0 mt-0.5" />
                <span>Ideal: no forces, point particles</span>
              </div>
            </div>
          </div>

          {/* Assumptions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2.5">
            <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Ideal Gas Assumes</h4>
            <div className="space-y-1 text-[9px] text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                <span>No intermolecular forces</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                <span>Negligible particle volume</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                <span>Elastic collisions only</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                <span>Random particle motion</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
