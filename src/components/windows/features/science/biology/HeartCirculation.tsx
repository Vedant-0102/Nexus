import React, { useState, useEffect, useRef } from 'react';
import { Heart, Play, Pause, RotateCcw, Info } from 'lucide-react';

interface BloodParticle {
  id: number;
  path: 'pulmonary' | 'systemic';
  progress: number;
  oxygenated: boolean;
}

export const HeartCirculation: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [phase, setPhase] = useState<'systole' | 'diastole'>('diastole');
  const [heartRate, setHeartRate] = useState(72);
  const [beatProgress, setBeatProgress] = useState(0);
  const [particles, setParticles] = useState<BloodParticle[]>([]);
  const [showLabels, setShowLabels] = useState(true);
  const [selectedChamber, setSelectedChamber] = useState<string | null>(null);
  const nextId = useRef(0);

  // Heart beat cycle
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setBeatProgress(p => {
        const increment = (heartRate / 60) * 2;
        const next = (p + increment) % 100;
        setPhase(next < 40 ? 'systole' : 'diastole');
        return next;
      });
    }, 33);
    return () => clearInterval(interval);
  }, [isPlaying, heartRate]);

  // Blood particle spawner
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setParticles(prev => {
        const spawned: BloodParticle[] = [];
        if (prev.filter(p => p.path === 'pulmonary').length < 6) {
          spawned.push({ id: nextId.current++, path: 'pulmonary', progress: 0, oxygenated: false });
        }
        if (prev.filter(p => p.path === 'systemic').length < 6) {
          spawned.push({ id: nextId.current++, path: 'systemic', progress: 0, oxygenated: true });
        }
        return [...prev, ...spawned];
      });
    }, 800);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Animate particles
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setParticles(prev =>
        prev
          .map(p => ({ ...p, progress: p.progress + 1.5 }))
          .filter(p => p.progress <= 100)
      );
    }, 33);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const reset = () => {
    setIsPlaying(false);
    setBeatProgress(0);
    setPhase('diastole');
    setParticles([]);
    setSelectedChamber(null);
  };

  // Pulse animation - smooth sinusoidal
  const beatScale = phase === 'systole'
    ? 1 + 0.06 * Math.sin((beatProgress / 40) * Math.PI)
    : 1 - 0.03 * Math.sin(((beatProgress - 40) / 60) * Math.PI);

  // Get point along pulmonary circuit path (RV -> lungs -> LA)
  const getPulmonaryPos = (t: number) => {
    if (t < 25) {
      // RV up to pulmonary artery
      const p = t / 25;
      return { x: 155 + p * 10, y: 235 - p * 115 };
    } else if (t < 50) {
      // Across lungs (top arc)
      const p = (t - 25) / 25;
      const angle = Math.PI + p * Math.PI;
      return { x: 200 + Math.cos(angle) * 80, y: 90 + Math.sin(angle) * 20 };
    } else if (t < 75) {
      // Down pulmonary vein to LA
      const p = (t - 50) / 25;
      return { x: 245 - p * 10, y: 120 + p * 45 };
    } else {
      // LA to fill
      const p = (t - 75) / 25;
      return { x: 245, y: 165 + p * 20 };
    }
  };

  // Get point along systemic circuit path (LV -> body -> RA)
  const getSystemicPos = (t: number) => {
    if (t < 25) {
      // LV up through aorta
      const p = t / 25;
      return { x: 245 - p * 5, y: 235 - p * 130 };
    } else if (t < 50) {
      // Down through body
      const p = (t - 25) / 25;
      return { x: 240 + Math.cos(p * Math.PI) * 100, y: 105 + p * 230 };
    } else if (t < 75) {
      // Vena cava up to RA
      const p = (t - 50) / 25;
      return { x: 140 + p * 15, y: 335 - p * 170 };
    } else {
      // RA fill
      const p = (t - 75) / 25;
      return { x: 155, y: 165 + p * 20 };
    }
  };

  const chamberInfo: Record<string, { name: string; desc: string }> = {
    RA: { name: 'Right Atrium', desc: 'Receives deoxygenated blood from the body via superior and inferior vena cava' },
    RV: { name: 'Right Ventricle', desc: 'Pumps deoxygenated blood to the lungs through the pulmonary artery' },
    LA: { name: 'Left Atrium', desc: 'Receives oxygenated blood from the lungs via pulmonary veins' },
    LV: { name: 'Left Ventricle', desc: 'Pumps oxygenated blood to the body through the aorta. Thickest wall.' },
  };

  // ECG waveform helper - PQRST wave
  const getECGVoltage = (t: number): number => {
    const cycle = t % 1;
    if (cycle < 0.10) return Math.sin((cycle / 0.10) * Math.PI) * 0.15;
    if (cycle < 0.16) return 0;
    if (cycle < 0.19) return -Math.sin(((cycle - 0.16) / 0.03) * Math.PI) * 0.08;
    if (cycle < 0.25) return Math.sin(((cycle - 0.19) / 0.06) * Math.PI) * 1.0;
    if (cycle < 0.28) return -Math.sin(((cycle - 0.25) / 0.03) * Math.PI) * 0.12;
    if (cycle < 0.38) return 0;
    if (cycle < 0.55) return Math.sin(((cycle - 0.38) / 0.17) * Math.PI) * 0.22;
    return 0;
  };

  const buildECGPath = () => {
    const points: string[] = [];
    const w = 380;
    const h = 60;
    const midY = h / 2;
    const cycleOffset = beatProgress / 100;
    for (let i = 0; i <= w; i += 2) {
      const t = (i / w) * 2 + cycleOffset;
      const v = getECGVoltage(t);
      const x = 10 + i;
      const y = midY - v * (h * 0.4);
      points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return points.join(' ');
  };

  // Derived vital signs
  const systolicBP = Math.round(120 + (heartRate - 72) * 0.3);
  const diastolicBP = Math.round(80 + (heartRate - 72) * 0.15);
  const cardiacOutput = (heartRate * 0.07).toFixed(1);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-red-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-3 overflow-hidden">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-600" />
          Heart & Blood Circulation
        </h2>
        <p className="text-[11px] text-gray-600 dark:text-gray-400">
          Interactive heart anatomy with blood flow visualization
        </p>
      </div>

      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 flex flex-col gap-2 min-w-0 min-h-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-md flex-1 min-h-0 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 420 420" preserveAspectRatio="xMidYMid meet">
              <defs>
                <marker id="arrow-blue" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="#3b82f6" />
                </marker>
                <marker id="arrow-red" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="#ef4444" />
                </marker>
                <radialGradient id="deoxy-grad" cx="50%" cy="40%">
                  <stop offset="0%" stopColor="#7c8cbf" />
                  <stop offset="100%" stopColor="#4a5a8a" />
                </radialGradient>
                <radialGradient id="oxy-grad" cx="50%" cy="40%">
                  <stop offset="0%" stopColor="#ff8a8a" />
                  <stop offset="100%" stopColor="#cc3333" />
                </radialGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* === VESSEL LABELS === */}
              {showLabels && (
                <>
                  <text x="60" y="25" fontSize="11" fill="#3b82f6" fontWeight="600">Superior Vena Cava</text>
                  <text x="245" y="25" fontSize="11" fill="#ef4444" fontWeight="600">Aorta</text>
                  <text x="90" y="78" fontSize="10" fill="#6366f1" fontWeight="600">Pulmonary</text>
                  <text x="90" y="90" fontSize="10" fill="#6366f1" fontWeight="600">Artery</text>
                  <text x="275" y="78" fontSize="10" fill="#ec4899" fontWeight="600">Pulmonary</text>
                  <text x="275" y="90" fontSize="10" fill="#ec4899" fontWeight="600">Veins</text>
                  <text x="60" y="390" fontSize="11" fill="#3b82f6" fontWeight="600">Inferior Vena Cava</text>
                  <text x="200" y="55" fontSize="10" fill="#9ca3af" textAnchor="middle">LUNGS</text>
                </>
              )}

              {/* === MAJOR VESSELS === */}
              {/* Superior vena cava */}
              <path d="M 140,35 L 140,130" stroke="#6682b5" strokeWidth="12" fill="none" strokeLinecap="round" opacity="0.8" />
              {/* Inferior vena cava */}
              <path d="M 140,290 L 140,385" stroke="#6682b5" strokeWidth="12" fill="none" strokeLinecap="round" opacity="0.8" />
              {/* Aorta - arch */}
              <path d="M 260,200 C 260,80 300,35 310,35" stroke="#cc3333" strokeWidth="14" fill="none" strokeLinecap="round" opacity="0.8" />
              {/* Pulmonary artery */}
              <path d="M 165,170 C 165,100 140,95 130,95" stroke="#6366f1" strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.7" />
              {/* Pulmonary veins */}
              <path d="M 270,95 C 280,95 260,100 255,165" stroke="#ec4899" strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.7" />

              {/* === HEART BODY === */}
              <g transform={`translate(200, 220) scale(${beatScale}) translate(-200, -220)`}>
                {/* Heart outer wall */}
                <path
                  d="M 200,130 C 120,130 100,170 100,210 C 100,280 200,330 200,330 C 200,330 300,280 300,210 C 300,170 280,130 200,130"
                  fill="#f0a0a0"
                  stroke="#b33"
                  strokeWidth="3"
                  opacity="0.3"
                />

                {/* Septum (wall between left and right) */}
                <line x1="200" y1="140" x2="200" y2="310" stroke="#c44" strokeWidth="4" />

                {/* Right Atrium */}
                <ellipse
                  cx="155" cy="170" rx="42" ry="30"
                  fill="url(#deoxy-grad)"
                  stroke="#445" strokeWidth="2"
                  className="cursor-pointer"
                  onClick={() => setSelectedChamber('RA')}
                  opacity={selectedChamber === 'RA' ? 1 : 0.85}
                />
                {/* Right Ventricle */}
                <ellipse
                  cx="155" cy="245" rx="44" ry="42"
                  fill="url(#deoxy-grad)"
                  stroke="#445" strokeWidth="2"
                  className="cursor-pointer"
                  onClick={() => setSelectedChamber('RV')}
                  opacity={selectedChamber === 'RV' ? 1 : 0.85}
                />
                {/* Left Atrium */}
                <ellipse
                  cx="245" cy="170" rx="42" ry="30"
                  fill="url(#oxy-grad)"
                  stroke="#833" strokeWidth="2"
                  className="cursor-pointer"
                  onClick={() => setSelectedChamber('LA')}
                  opacity={selectedChamber === 'LA' ? 1 : 0.85}
                />
                {/* Left Ventricle */}
                <ellipse
                  cx="245" cy="245" rx="44" ry="42"
                  fill="url(#oxy-grad)"
                  stroke="#833" strokeWidth="2.5"
                  className="cursor-pointer"
                  onClick={() => setSelectedChamber('LV')}
                  opacity={selectedChamber === 'LV' ? 1 : 0.85}
                />

                {/* === VALVES === */}
                {/* Tricuspid valve (RA -> RV) */}
                <g>
                  <ellipse cx="155" cy="200" rx="18" ry="4"
                    fill={phase === 'diastole' ? '#a8d8a0' : '#d89090'}
                    stroke="#555" strokeWidth="1.5"
                  />
                  {showLabels && <text x="100" y="204" fontSize="8" fill="#666" dark-fill="#aaa">Tricuspid</text>}
                </g>
                {/* Mitral/Bicuspid valve (LA -> LV) */}
                <g>
                  <ellipse cx="245" cy="200" rx="18" ry="4"
                    fill={phase === 'diastole' ? '#a8d8a0' : '#d89090'}
                    stroke="#555" strokeWidth="1.5"
                  />
                  {showLabels && <text x="275" y="204" fontSize="8" fill="#666">Mitral</text>}
                </g>
                {/* Pulmonary valve (RV -> Pulmonary artery) */}
                <g>
                  <ellipse cx="165" cy="150" rx="14" ry="3.5"
                    fill={phase === 'systole' ? '#a8d8a0' : '#d89090'}
                    stroke="#555" strokeWidth="1.5"
                  />
                  {showLabels && <text x="115" y="148" fontSize="8" fill="#666">Pulmonary</text>}
                </g>
                {/* Aortic valve (LV -> Aorta) */}
                <g>
                  <ellipse cx="255" cy="150" rx="14" ry="3.5"
                    fill={phase === 'systole' ? '#a8d8a0' : '#d89090'}
                    stroke="#555" strokeWidth="1.5"
                  />
                  {showLabels && <text x="275" y="148" fontSize="8" fill="#666">Aortic</text>}
                </g>

                {/* Chamber labels */}
                <text x="155" y="174" textAnchor="middle" fontSize="13" fill="#fff" fontWeight="bold">RA</text>
                <text x="155" y="249" textAnchor="middle" fontSize="13" fill="#fff" fontWeight="bold">RV</text>
                <text x="245" y="174" textAnchor="middle" fontSize="13" fill="#fff" fontWeight="bold">LA</text>
                <text x="245" y="249" textAnchor="middle" fontSize="13" fill="#fff" fontWeight="bold">LV</text>
              </g>

              {/* === FLOW DIRECTION ARROWS === */}
              {/* Body -> RA (blue) */}
              <path d="M 140,55 L 140,115" stroke="#3b82f6" strokeWidth="2" fill="none" markerEnd="url(#arrow-blue)" opacity="0.6" />
              {/* RV -> Lungs (blue) */}
              <path d="M 150,130 C 145,108 138,100 132,98" stroke="#3b82f6" strokeWidth="2" fill="none" markerEnd="url(#arrow-blue)" opacity="0.6" />
              {/* Lungs -> LA (red) */}
              <path d="M 268,98 C 262,100 258,108 255,130" stroke="#ef4444" strokeWidth="2" fill="none" markerEnd="url(#arrow-red)" opacity="0.6" />
              {/* LV -> Body (red) */}
              <path d="M 262,180 C 268,140 280,80 300,50" stroke="#ef4444" strokeWidth="2" fill="none" markerEnd="url(#arrow-red)" opacity="0.6" />
              {/* Body return (bottom) */}
              <path d="M 140,360 L 140,310" stroke="#3b82f6" strokeWidth="2" fill="none" markerEnd="url(#arrow-blue)" opacity="0.6" />

              {/* === ANIMATED BLOOD PARTICLES === */}
              {particles.map(p => {
                const pos = p.path === 'pulmonary' ? getPulmonaryPos(p.progress) : getSystemicPos(p.progress);
                const color = p.path === 'pulmonary'
                  ? (p.progress < 50 ? '#6682b5' : '#ef4444')
                  : (p.progress < 50 ? '#ef4444' : '#6682b5');
                return (
                  <circle
                    key={p.id}
                    cx={pos.x}
                    cy={pos.y}
                    r="4"
                    fill={color}
                    opacity="0.85"
                    filter="url(#glow)"
                  />
                );
              })}

              {/* Lung icon area */}
              <g opacity="0.35">
                <ellipse cx="130" cy="65" rx="30" ry="18" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1" />
                <ellipse cx="270" cy="65" rx="30" ry="18" fill="#fecaca" stroke="#fca5a5" strokeWidth="1" />
                <text x="130" y="69" textAnchor="middle" fontSize="9" fill="#3b82f6">Lung</text>
                <text x="270" y="69" textAnchor="middle" fontSize="9" fill="#ef4444">Lung</text>
              </g>
            </svg>
          </div>

          {/* ECG Waveform Strip */}
          <div className="bg-gray-950 rounded-lg p-2 shadow-md w-full flex-shrink-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-green-400 text-xs font-mono font-bold">ECG - Lead II</span>
              <div className="flex items-center gap-3">
                <span className="text-red-400 text-xs font-mono">BP: {systolicBP}/{diastolicBP}</span>
                <span className="text-cyan-400 text-xs font-mono">SpO₂: 98%</span>
                <span className="text-green-400 text-xs font-mono">{heartRate} BPM</span>
              </div>
            </div>
            <svg width="400" height="70" viewBox="0 0 400 70" className="w-full">
              {/* ECG grid */}
              {[14, 28, 42, 56].map(y => (
                <line key={`h-${y}`} x1="10" y1={y} x2="390" y2={y} stroke="#1a3a1a" strokeWidth="0.5" />
              ))}
              {Array.from({ length: 20 }, (_, i) => 10 + i * 20).map(x => (
                <line key={`v-${x}`} x1={x} y1="0" x2={x} y2="70" stroke="#1a3a1a" strokeWidth="0.5" />
              ))}
              {/* ECG trace */}
              <path d={buildECGPath()} fill="none" stroke="#22c55e" strokeWidth="1.8" />
              {/* Scanner line */}
              <line
                x1={10 + (beatProgress / 100) * 380}
                y1="0"
                x2={10 + (beatProgress / 100) * 380}
                y2="70"
                stroke="#22c55e"
                strokeWidth="1.5"
                opacity="0.5"
              />
            </svg>
          </div>

          {/* Controls */}
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1.5 transition-colors"
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={reset}
              className="px-3 py-1.5 text-xs font-semibold bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* Info Panel */}
        <div className="w-72 flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 shadow-md">
            <h3 className="text-[11px] font-semibold mb-1.5">Controls</h3>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-0.5">
                  <span>Heart Rate</span>
                  <span className="font-bold text-red-600">{heartRate} BPM</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="180"
                  value={heartRate}
                  onChange={(e) => setHeartRate(Number(e.target.value))}
                  className="w-full accent-red-600"
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>Bradycardia</span>
                  <span>Normal</span>
                  <span>Tachycardia</span>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={(e) => setShowLabels(e.target.checked)}
                  className="w-3.5 h-3.5 accent-red-600"
                />
                Show Vessel Labels
              </label>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 shadow-md">
            <h3 className="text-[11px] font-semibold mb-1.5">Current Phase</h3>
            <div className={`p-2 rounded text-center text-xs font-bold text-white transition-colors ${
              phase === 'systole' ? 'bg-red-500' : 'bg-blue-500'
            }`}>
              {phase === 'systole' ? 'SYSTOLE (Contraction)' : 'DIASTOLE (Relaxation)'}
            </div>
            <div className="mt-1.5 text-[10px] text-gray-500 dark:text-gray-400">
              {phase === 'systole'
                ? 'Ventricles contract, pumping blood out. AV valves closed, semilunar valves open.'
                : 'Ventricles relax and fill with blood. AV valves open, semilunar valves closed.'}
            </div>
            <div className="mt-1.5 flex gap-2 text-[10px]">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" /> Open
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" /> Closed
              </div>
            </div>
          </div>

          {/* Selected chamber info */}
          {selectedChamber && chamberInfo[selectedChamber] && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 shadow-md border-l-4 border-red-500">
              <h3 className="text-[11px] font-semibold mb-1">{chamberInfo[selectedChamber].name}</h3>
              <p className="text-[10px] text-gray-600 dark:text-gray-400">{chamberInfo[selectedChamber].desc}</p>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 shadow-md">
            <h3 className="text-[11px] font-semibold mb-1.5">Blood Flow Legend</h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-2.5 rounded bg-red-500" />
                <span>Oxygenated blood (arteries)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-2.5 rounded bg-blue-500" />
                <span>Deoxygenated blood (veins)</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-950 rounded-lg p-2.5 shadow-md">
            <h3 className="text-[11px] font-semibold mb-1.5 text-green-400 font-mono">Vital Signs Monitor</h3>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center border-b border-gray-800 pb-1">
                <span className="text-[10px] text-gray-400 font-mono">HR</span>
                <span className="text-sm font-bold text-green-400 font-mono">{heartRate} <span className="text-[10px]">bpm</span></span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-800 pb-1">
                <span className="text-[10px] text-gray-400 font-mono">BP</span>
                <span className="text-sm font-bold text-red-400 font-mono">{systolicBP}/{diastolicBP} <span className="text-[10px]">mmHg</span></span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-800 pb-1">
                <span className="text-[10px] text-gray-400 font-mono">SpO₂</span>
                <span className="text-sm font-bold text-cyan-400 font-mono">98 <span className="text-[10px]">%</span></span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-400 font-mono">Cardiac Output</span>
                <span className="text-xs font-bold text-yellow-400 font-mono">{cardiacOutput} <span className="text-[10px]">L/min</span></span>
              </div>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-2.5">
            <h3 className="text-[11px] font-semibold mb-1.5 flex items-center gap-1.5 text-red-800 dark:text-red-300">
              <Info className="h-3 w-3" />
              Circulation Path
            </h3>
            <ol className="text-[10px] space-y-0.5 text-gray-700 dark:text-gray-300 list-decimal list-inside">
              <li>Body sends deoxygenated blood via <b>vena cava</b> to <b>RA</b></li>
              <li>RA contracts, blood flows through <b>tricuspid valve</b> to <b>RV</b></li>
              <li>RV contracts, blood flows through <b>pulmonary valve</b> to <b>lungs</b></li>
              <li>Gas exchange: CO2 released, O2 absorbed</li>
              <li>Oxygenated blood returns via <b>pulmonary veins</b> to <b>LA</b></li>
              <li>LA contracts, blood flows through <b>mitral valve</b> to <b>LV</b></li>
              <li>LV contracts, blood flows through <b>aortic valve</b> to <b>aorta</b></li>
              <li>Aorta distributes oxygenated blood to the body</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
