import React, { useState, useEffect, useRef } from 'react';
import { Zap, Play, Pause, RotateCcw, Info } from 'lucide-react';

interface CellConfig {
  name: string;
  anodeMetal: string;
  anodeSymbol: string;
  anodeIon: string;
  anodeCharge: string;
  anodeColor: string;
  anodeSolutionColor: string;
  anodeSolution: string;
  cathodeIon: string;
  cathodeMetal: string;
  cathodeSymbol: string;
  cathodeCharge: string;
  cathodeColor: string;
  cathodeSolutionColor: string;
  cathodeSolution: string;
  cellPotential: number;
  anodeHalfReaction: string;
  anodeE: number;
  cathodeHalfReaction: string;
  cathodeE: number;
  cellNotation: string;
}

const cellConfigs: CellConfig[] = [
  {
    name: 'Zn / Cu',
    anodeMetal: 'Zinc',
    anodeSymbol: 'Zn',
    anodeIon: 'Zn\u00B2\u207A',
    anodeCharge: '2+',
    anodeColor: '#9CA3AF',
    anodeSolutionColor: 'rgba(147,197,253,0.45)',
    anodeSolution: 'ZnSO\u2084 (aq)',
    cathodeIon: 'Cu\u00B2\u207A',
    cathodeMetal: 'Copper',
    cathodeSymbol: 'Cu',
    cathodeCharge: '2+',
    cathodeColor: '#D97706',
    cathodeSolutionColor: 'rgba(96,165,250,0.55)',
    cathodeSolution: 'CuSO\u2084 (aq)',
    cellPotential: 1.10,
    anodeHalfReaction: 'Zn(s) \u2192 Zn\u00B2\u207A(aq) + 2e\u207B',
    anodeE: -0.76,
    cathodeHalfReaction: 'Cu\u00B2\u207A(aq) + 2e\u207B \u2192 Cu(s)',
    cathodeE: 0.34,
    cellNotation: 'Zn(s) | Zn\u00B2\u207A(aq) || Cu\u00B2\u207A(aq) | Cu(s)',
  },
  {
    name: 'Mg / Cu',
    anodeMetal: 'Magnesium',
    anodeSymbol: 'Mg',
    anodeIon: 'Mg\u00B2\u207A',
    anodeCharge: '2+',
    anodeColor: '#D1D5DB',
    anodeSolutionColor: 'rgba(209,213,219,0.35)',
    anodeSolution: 'MgSO\u2084 (aq)',
    cathodeIon: 'Cu\u00B2\u207A',
    cathodeMetal: 'Copper',
    cathodeSymbol: 'Cu',
    cathodeCharge: '2+',
    cathodeColor: '#D97706',
    cathodeSolutionColor: 'rgba(96,165,250,0.55)',
    cathodeSolution: 'CuSO\u2084 (aq)',
    cellPotential: 2.71,
    anodeHalfReaction: 'Mg(s) \u2192 Mg\u00B2\u207A(aq) + 2e\u207B',
    anodeE: -2.37,
    cathodeHalfReaction: 'Cu\u00B2\u207A(aq) + 2e\u207B \u2192 Cu(s)',
    cathodeE: 0.34,
    cellNotation: 'Mg(s) | Mg\u00B2\u207A(aq) || Cu\u00B2\u207A(aq) | Cu(s)',
  },
  {
    name: 'Zn / Ag',
    anodeMetal: 'Zinc',
    anodeSymbol: 'Zn',
    anodeIon: 'Zn\u00B2\u207A',
    anodeCharge: '2+',
    anodeColor: '#9CA3AF',
    anodeSolutionColor: 'rgba(147,197,253,0.45)',
    anodeSolution: 'ZnSO\u2084 (aq)',
    cathodeIon: 'Ag\u207A',
    cathodeMetal: 'Silver',
    cathodeSymbol: 'Ag',
    cathodeCharge: '+',
    cathodeColor: '#E5E7EB',
    cathodeSolutionColor: 'rgba(209,213,219,0.45)',
    cathodeSolution: 'AgNO\u2083 (aq)',
    cellPotential: 1.56,
    anodeHalfReaction: 'Zn(s) \u2192 Zn\u00B2\u207A(aq) + 2e\u207B',
    anodeE: -0.76,
    cathodeHalfReaction: 'Ag\u207A(aq) + e\u207B \u2192 Ag(s)',
    cathodeE: 0.80,
    cellNotation: 'Zn(s) | Zn\u00B2\u207A(aq) || Ag\u207A(aq) | Ag(s)',
  },
  {
    name: 'Fe / Cu',
    anodeMetal: 'Iron',
    anodeSymbol: 'Fe',
    anodeIon: 'Fe\u00B2\u207A',
    anodeCharge: '2+',
    anodeColor: '#6B7280',
    anodeSolutionColor: 'rgba(187,247,208,0.4)',
    anodeSolution: 'FeSO\u2084 (aq)',
    cathodeIon: 'Cu\u00B2\u207A',
    cathodeMetal: 'Copper',
    cathodeSymbol: 'Cu',
    cathodeCharge: '2+',
    cathodeColor: '#D97706',
    cathodeSolutionColor: 'rgba(96,165,250,0.55)',
    cathodeSolution: 'CuSO\u2084 (aq)',
    cellPotential: 0.78,
    anodeHalfReaction: 'Fe(s) \u2192 Fe\u00B2\u207A(aq) + 2e\u207B',
    anodeE: -0.44,
    cathodeHalfReaction: 'Cu\u00B2\u207A(aq) + 2e\u207B \u2192 Cu(s)',
    cathodeE: 0.34,
    cellNotation: 'Fe(s) | Fe\u00B2\u207A(aq) || Cu\u00B2\u207A(aq) | Cu(s)',
  },
];

export const Electrochemistry: React.FC = () => {
  const [selectedCell, setSelectedCell] = useState(cellConfigs[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [animTick, setAnimTick] = useState(0);
  const intervalRef = useRef<number | undefined>();

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      const ms = Math.round(50 / speed);
      intervalRef.current = window.setInterval(() => {
        setAnimTick(t => t + 1);
        setProgress(prev => {
          const next = prev + 0.15 * speed;
          if (next >= 100) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsRunning(false);
            return 100;
          }
          return next;
        });
      }, ms);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, speed]);

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setProgress(0);
    setAnimTick(0);
  };

  const togglePlay = () => {
    if (progress >= 100) {
      reset();
      setTimeout(() => setIsRunning(true), 50);
    } else {
      setIsRunning(prev => !prev);
    }
  };

  const handleCellChange = (cell: CellConfig) => {
    reset();
    setSelectedCell(cell);
  };

  // Derived animation values
  const t = animTick;
  const p = progress / 100; // 0..1
  const anodeShrink = p * 8;
  const cathodeGrow = p * 8;

  // Electron positions along wire (5 electrons cycling)
  const electronPositions = Array.from({ length: 5 }, (_, i) => {
    const phase = ((t * 3 + i * 72) % 360) / 360;
    return phase;
  });

  // Ion positions in anode solution (Zn2+ dissolving)
  const anodeIons = Array.from({ length: 4 }, (_, i) => {
    const phase = ((t * 2 + i * 90) % 360) / 360;
    const x = 105 + Math.sin(phase * Math.PI * 2 + i) * 30;
    const y = 210 + Math.cos(phase * Math.PI * 2 + i * 0.7) * 25 + phase * 10;
    return { x, y, opacity: p > 0.05 ? Math.min(1, p * 3) : 0 };
  });

  // Ion positions depositing on cathode
  const cathodeIons = Array.from({ length: 4 }, (_, i) => {
    const phase = ((t * 2 + i * 90 + 45) % 360) / 360;
    const baseX = 495;
    const x = baseX + Math.sin(phase * Math.PI * 2 + i) * 20 - phase * 10;
    const y = 210 + Math.cos(phase * Math.PI * 2 + i * 1.3) * 20;
    return { x, y, opacity: p > 0.05 ? Math.min(1, p * 3) : 0 };
  });

  // Salt bridge ion movement
  const saltBridgeIonsPositive = Array.from({ length: 3 }, (_, i) => {
    const phase = ((t * 1.5 + i * 120) % 360) / 360;
    return phase;
  });
  const saltBridgeIonsNegative = Array.from({ length: 3 }, (_, i) => {
    const phase = ((t * 1.5 + i * 120 + 60) % 360) / 360;
    return phase;
  });

  // Bubbles near anode
  const bubbles = Array.from({ length: 6 }, (_, i) => {
    const phase = ((t * 3 + i * 60) % 360) / 360;
    return {
      x: 85 + Math.sin(i * 1.3) * 15,
      y: 230 - phase * 50,
      r: 1.5 + Math.sin(i) * 0.5,
      opacity: p > 0 ? (1 - phase) * 0.6 : 0,
    };
  });

  // Wire path points for electron travel
  const wirePathPoints = (fraction: number) => {
    // Path: anode top -> up -> across -> down -> cathode top
    // Anode electrode top: (105, 140), wire goes up to (105, 55), across to (495, 55), down to (495, 140)
    const totalLen = 82 + 390 + 82; // up + across + down = 554
    const dist = fraction * totalLen;
    if (dist <= 82) {
      return { x: 105, y: 137 - dist };
    } else if (dist <= 82 + 390) {
      return { x: 105 + (dist - 82), y: 55 };
    } else {
      return { x: 495, y: 55 + (dist - 82 - 390) };
    }
  };

  // Salt bridge path - inverted U from left beaker into solution, up and over, down into right beaker
  const saltBridgePath = (fraction: number, direction: 'left' | 'right') => {
    // For K+: move right (toward cathode)
    // For Cl-: move left (toward anode)
    const f = direction === 'right' ? fraction : 1 - fraction;
    // Path: down into left beaker (155,200) -> up to (155,100) -> across to (445,100) -> down to (445,200)
    const seg1 = 100; // up from left solution
    const seg2 = 290; // across top
    const seg3 = 100; // down into right solution
    const totalLen = seg1 + seg2 + seg3;
    const dist = f * totalLen;
    if (dist <= seg1) {
      const t = dist / seg1;
      return { x: 155, y: 200 - t * 100 };
    } else if (dist <= seg1 + seg2) {
      const t = (dist - seg1) / seg2;
      return {
        x: 155 + t * 290,
        y: 100 + Math.sin(t * Math.PI) * -15,
      };
    } else {
      const t = (dist - seg1 - seg2) / seg3;
      return { x: 445, y: 100 + t * 100 };
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 p-3 overflow-hidden">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            Electrochemistry &mdash; Galvanic Cell
          </h2>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {selectedCell.name} cell &mdash; E&deg;cell = {selectedCell.cellPotential.toFixed(2)} V &mdash; {progress < 100 ? `${progress.toFixed(0)}% reacted` : 'Reaction complete'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <Zap className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-lg font-bold font-mono text-gray-800 dark:text-white">{selectedCell.cellPotential.toFixed(2)}</span>
            <span className="text-[10px] text-gray-400">V</span>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex gap-3 min-h-0">

        {/* Left side: SVG + controls */}
        <div className="flex-1 flex flex-col gap-2 min-w-0 min-h-0">
          {/* SVG Visualization */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2 flex-1 min-h-0 flex items-center justify-center">
            <svg viewBox="0 0 600 380" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="anodeSolGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={selectedCell.anodeSolutionColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={selectedCell.anodeSolutionColor} stopOpacity={1} />
                </linearGradient>
                <linearGradient id="cathodeSolGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={selectedCell.cathodeSolutionColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={selectedCell.cathodeSolutionColor} stopOpacity={1} />
                </linearGradient>
                <linearGradient id="wireGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6B7280" />
                  <stop offset="100%" stopColor="#374151" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Background label */}
              <text x="300" y="18" textAnchor="middle" fill="#9CA3AF" fontSize="11" fontWeight="500">Galvanic (Voltaic) Cell</text>

              {/* ===== LEFT BEAKER (Anode) ===== */}
              {/* Beaker body */}
              <rect x="30" y="150" width="150" height="140" rx="8" ry="8" fill="none" stroke="#9CA3AF" strokeWidth="2.5" />
              <rect x="30" y="148" width="150" height="6" rx="3" fill="#D1D5DB" stroke="#9CA3AF" strokeWidth="1" />

              {/* Solution */}
              <rect x="32" y="175" width="146" height="113" rx="6" fill={selectedCell.anodeSolutionColor} />

              {/* Solution ripple */}
              <ellipse cx="105" cy="178" rx="68" ry="3" fill="rgba(255,255,255,0.3)" />

              {/* Anode electrode (shrinks with progress) */}
              <rect
                x={105 - 10}
                y={140}
                width={20}
                height={110 - anodeShrink}
                rx="2"
                fill={selectedCell.anodeColor}
                stroke="#6B7280"
                strokeWidth="1"
              />

              {/* Anode terminal cap */}
              <rect x={105 - 12} y={137} width={24} height={6} rx="2" fill="#4B5563" />

              {/* Anode label */}
              <text x="105" y="310" textAnchor="middle" fill="#EF4444" fontSize="11" fontWeight="bold">Anode (\u2212)</text>
              <text x="105" y="324" textAnchor="middle" fill="#6B7280" fontSize="9">{selectedCell.anodeMetal} ({selectedCell.anodeSymbol})</text>
              <text x="105" y="338" textAnchor="middle" fill="#6B7280" fontSize="8">Oxidation</text>

              {/* Solution label */}
              <text x="55" y="270" fill="#3B82F6" fontSize="8" opacity="0.8">{selectedCell.anodeSolution}</text>

              {/* Dissolving ions from anode */}
              {p > 0.02 && anodeIons.map((ion, i) => (
                <g key={`aion-${i}`} opacity={ion.opacity}>
                  <circle cx={ion.x} cy={ion.y} r="6" fill="rgba(239,68,68,0.15)" />
                  <text x={ion.x} y={ion.y + 3} textAnchor="middle" fill="#EF4444" fontSize="7" fontWeight="bold">{selectedCell.anodeIon}</text>
                </g>
              ))}

              {/* Bubbles near anode */}
              {bubbles.map((b, i) => (
                <circle key={`bub-${i}`} cx={b.x} cy={b.y} r={b.r} fill="rgba(255,255,255,0.6)" opacity={b.opacity} />
              ))}


              {/* ===== RIGHT BEAKER (Cathode) ===== */}
              {/* Beaker body */}
              <rect x="420" y="150" width="150" height="140" rx="8" ry="8" fill="none" stroke="#9CA3AF" strokeWidth="2.5" />
              <rect x="420" y="148" width="150" height="6" rx="3" fill="#D1D5DB" stroke="#9CA3AF" strokeWidth="1" />

              {/* Solution */}
              <rect x="422" y="175" width="146" height="113" rx="6" fill={selectedCell.cathodeSolutionColor} />

              {/* Solution ripple */}
              <ellipse cx="495" cy="178" rx="68" ry="3" fill="rgba(255,255,255,0.3)" />

              {/* Cathode electrode (grows with progress) */}
              <rect
                x={495 - (20 + cathodeGrow * 0.3) / 2}
                y={140}
                width={20 + cathodeGrow * 0.3}
                height={110 + cathodeGrow}
                rx="2"
                fill={selectedCell.cathodeColor}
                stroke="#92400E"
                strokeWidth="1"
              />

              {/* Cathode terminal cap */}
              <rect x={495 - 12} y={137} width={24} height={6} rx="2" fill="#4B5563" />

              {/* Cathode label */}
              <text x="495" y="310" textAnchor="middle" fill="#3B82F6" fontSize="11" fontWeight="bold">Cathode (+)</text>
              <text x="495" y="324" textAnchor="middle" fill="#6B7280" fontSize="9">{selectedCell.cathodeMetal} ({selectedCell.cathodeSymbol})</text>
              <text x="495" y="338" textAnchor="middle" fill="#6B7280" fontSize="8">Reduction</text>

              {/* Solution label */}
              <text x="440" y="270" fill="#3B82F6" fontSize="8" opacity="0.8">{selectedCell.cathodeSolution}</text>

              {/* Depositing ions on cathode */}
              {p > 0.02 && cathodeIons.map((ion, i) => (
                <g key={`cion-${i}`} opacity={ion.opacity}>
                  <circle cx={ion.x} cy={ion.y} r="6" fill="rgba(59,130,246,0.15)" />
                  <text x={ion.x} y={ion.y + 3} textAnchor="middle" fill="#2563EB" fontSize="7" fontWeight="bold">{selectedCell.cathodeIon}</text>
                </g>
              ))}


              {/* ===== SALT BRIDGE ===== */}
              {/* Inverted U tube dipping into both solutions */}
              <path
                d="M 155 200 L 155 105 Q 155 85 175 85 L 425 85 Q 445 85 445 105 L 445 200"
                fill="none"
                stroke="#A78BFA"
                strokeWidth="14"
                strokeLinecap="round"
                opacity="0.3"
              />
              <path
                d="M 155 200 L 155 105 Q 155 85 175 85 L 425 85 Q 445 85 445 105 L 445 200"
                fill="none"
                stroke="#7C3AED"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Salt bridge label */}
              <text x="295" y="78" textAnchor="middle" fill="#7C3AED" fontSize="9" fontWeight="bold">Salt Bridge</text>
              <text x="295" y="98" textAnchor="middle" fill="#6D28D9" fontSize="7">(KCl or KNO&#x2083;)</text>

              {/* Na+ ions moving right through salt bridge (toward cathode) */}
              {p > 0.02 && saltBridgeIonsPositive.map((phase, i) => {
                const pos = saltBridgePath(phase, 'right');
                return (
                  <g key={`sna-${i}`} opacity={p > 0.05 ? 0.9 : 0}>
                    <circle cx={pos.x} cy={pos.y} r="5" fill="rgba(239,68,68,0.15)" />
                    <text x={pos.x} y={pos.y + 3} textAnchor="middle" fill="#DC2626" fontSize="6" fontWeight="bold">K\u207A</text>
                  </g>
                );
              })}

              {/* Cl- ions moving left through salt bridge (toward anode) */}
              {p > 0.02 && saltBridgeIonsNegative.map((phase, i) => {
                const pos = saltBridgePath(phase, 'left');
                return (
                  <g key={`scl-${i}`} opacity={p > 0.05 ? 0.9 : 0}>
                    <circle cx={pos.x} cy={pos.y} r="5" fill="rgba(59,130,246,0.15)" />
                    <text x={pos.x} y={pos.y + 3} textAnchor="middle" fill="#2563EB" fontSize="6" fontWeight="bold">Cl\u207B</text>
                  </g>
                );
              })}


              {/* ===== EXTERNAL CIRCUIT (Wire) ===== */}
              {/* Wire from anode to cathode */}
              <path
                d="M 105 137 L 105 55 L 495 55 L 495 137"
                fill="none"
                stroke="#4B5563"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Electron flow direction arrow */}
              <polygon points="290,49 300,44 300,48" fill="#EAB308" opacity="0.8" />
              <polygon points="310,49 320,44 320,48" fill="#EAB308" opacity="0.8" />
              <polygon points="330,49 340,44 340,48" fill="#EAB308" opacity="0.8" />

              {/* e- flow label */}
              <text x="300" y="42" textAnchor="middle" fill="#CA8A04" fontSize="8" fontWeight="bold">e\u207B flow \u2192</text>

              {/* Animated electrons along wire */}
              {p > 0.02 && electronPositions.map((phase, i) => {
                const pos = wirePathPoints(phase);
                return (
                  <g key={`elec-${i}`} filter="url(#glow)">
                    <circle cx={pos.x} cy={pos.y} r="4" fill="#FBBF24" opacity={p > 0.05 ? 0.9 : 0} />
                    <circle cx={pos.x} cy={pos.y} r="2" fill="#FDE68A" opacity={p > 0.05 ? 1 : 0} />
                    <text x={pos.x} y={pos.y + 1.5} textAnchor="middle" fill="#78350F" fontSize="4.5" fontWeight="bold" opacity={p > 0.05 ? 1 : 0}>e\u207B</text>
                  </g>
                );
              })}


              {/* ===== VOLTMETER ===== */}
              {/* Voltmeter body */}
              <circle cx="300" cy="55" r="22" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
              <circle cx="300" cy="55" r="18" fill="white" stroke="#F59E0B" strokeWidth="1" />

              {/* Voltmeter label */}
              <text x="300" y="50" textAnchor="middle" fill="#92400E" fontSize="6" fontWeight="bold">V</text>
              <text x="300" y="60" textAnchor="middle" fill="#B45309" fontSize="7" fontWeight="bold">{(selectedCell.cellPotential * Math.min(1, p * 5 + 0.1)).toFixed(2)}</text>

              {/* Voltmeter wire connections */}
              <line x1="278" y1="55" x2="200" y2="55" stroke="#4B5563" strokeWidth="2" />
              <line x1="322" y1="55" x2="400" y2="55" stroke="#4B5563" strokeWidth="2" />

              {/* Voltmeter terminals */}
              <circle cx="278" cy="55" r="3" fill="#EF4444" />
              <text x="278" y="57.5" textAnchor="middle" fill="white" fontSize="4" fontWeight="bold">\u2212</text>
              <circle cx="322" cy="55" r="3" fill="#3B82F6" />
              <text x="322" y="57.5" textAnchor="middle" fill="white" fontSize="4" fontWeight="bold">+</text>


              {/* ===== PROGRESS BAR ===== */}
              <rect x="30" y="360" width="540" height="6" rx="3" fill="#E5E7EB" />
              <rect x="30" y="360" width={540 * p} height="6" rx="3" fill="url(#progGrad)" />
              <defs>
                <linearGradient id="progGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#FBBF24" />
                  <stop offset="100%" stopColor="#F59E0B" />
                </linearGradient>
              </defs>
              <text x="300" y="376" textAnchor="middle" fill="#9CA3AF" fontSize="7">{progress.toFixed(0)}% reacted</text>
            </svg>
          </div>

          {/* Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md px-3 py-2 flex items-center gap-3 flex-wrap">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all shadow-sm text-white ${
                isRunning
                  ? 'bg-amber-500 hover:bg-amber-600'
                  : 'bg-yellow-600 hover:bg-yellow-700'
              }`}
            >
              {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {isRunning ? 'Pause' : progress >= 100 ? 'Restart' : 'Start'}
            </button>

            {/* Reset */}
            <button
              onClick={reset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-all shadow-sm"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

            {/* Speed */}
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Speed</span>
            {[0.5, 1, 2].map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                  speed === s
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700 shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-transparent hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {s}x
              </button>
            ))}

            {/* Divider */}
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

            {/* Cell selector */}
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Cell</span>
            {cellConfigs.map(cell => (
              <button
                key={cell.name}
                onClick={() => handleCellChange(cell)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                  selectedCell.name === cell.name
                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700 shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-transparent hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {cell.name}
              </button>
            ))}
          </div>
        </div>

        {/* Right side: Info Panel */}
        <div className="w-80 flex flex-col gap-2 flex-shrink-0 overflow-y-auto">

          {/* Cell Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2.5">
            <h4 className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-yellow-600 dark:text-yellow-400" /> Cell Information
            </h4>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Cell Type</span>
                <span className="font-medium text-gray-800 dark:text-white">{selectedCell.name} Galvanic Cell</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Cell Notation</span>
                <p className="font-mono text-[10px] text-gray-800 dark:text-white mt-0.5 bg-gray-50 dark:bg-gray-700 rounded px-1.5 py-1">{selectedCell.cellNotation}</p>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">E&deg;cell</span>
                <span className="font-bold font-mono text-yellow-600 dark:text-yellow-400">{selectedCell.cellPotential.toFixed(2)} V</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">&Delta;G&deg;</span>
                <span className="font-mono text-gray-800 dark:text-white">{(-2 * 96.485 * selectedCell.cellPotential).toFixed(1)} kJ/mol</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Spontaneous?</span>
                <span className="font-medium text-green-600 dark:text-green-400">Yes (E&deg; &gt; 0)</span>
              </div>
            </div>
          </div>

          {/* Half-Reactions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2.5">
            <h4 className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Half-Reactions</h4>

            {/* Anode */}
            <div className="mb-2 p-1.5 rounded bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-1 mb-0.5">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-[10px] font-semibold text-red-700 dark:text-red-300">Anode (Oxidation)</span>
              </div>
              <p className="text-[10px] font-mono text-gray-700 dark:text-gray-200">{selectedCell.anodeHalfReaction}</p>
              <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5">E&deg; = {selectedCell.anodeE.toFixed(2)} V (reversed: {(-selectedCell.anodeE).toFixed(2)} V)</p>
            </div>

            {/* Cathode */}
            <div className="p-1.5 rounded bg-blue-50 dark:bg-blue-900/15 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-1 mb-0.5">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300">Cathode (Reduction)</span>
              </div>
              <p className="text-[10px] font-mono text-gray-700 dark:text-gray-200">{selectedCell.cathodeHalfReaction}</p>
              <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5">E&deg; = {selectedCell.cathodeE.toFixed(2)} V</p>
            </div>

            {/* Net */}
            <div className="mt-1.5 p-1.5 rounded bg-yellow-50 dark:bg-yellow-900/15 border border-yellow-200 dark:border-yellow-800">
              <span className="text-[10px] font-semibold text-yellow-700 dark:text-yellow-300">E&deg;cell = E&deg;cathode &minus; E&deg;anode</span>
              <p className="text-[10px] font-mono text-gray-700 dark:text-gray-200 mt-0.5">
                E&deg;cell = ({selectedCell.cathodeE.toFixed(2)}) &minus; ({selectedCell.anodeE.toFixed(2)}) = {selectedCell.cellPotential.toFixed(2)} V
              </p>
            </div>
          </div>

          {/* Electrode Reactions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2.5">
            <h4 className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Electrode Reactions</h4>
            <div className="space-y-1.5 text-[10px] text-gray-600 dark:text-gray-300">
              <div className="flex gap-1.5">
                <div className="w-1 rounded-full bg-red-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-700 dark:text-gray-200">At the Anode ({selectedCell.anodeSymbol}):</p>
                  <p>{selectedCell.anodeMetal} atoms lose electrons and dissolve into solution as {selectedCell.anodeIon} ions. The electrode gets smaller over time.</p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <div className="w-1 rounded-full bg-blue-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-700 dark:text-gray-200">At the Cathode ({selectedCell.cathodeSymbol}):</p>
                  <p>{selectedCell.cathodeIon} ions from solution gain electrons and deposit as solid {selectedCell.cathodeMetal}. The electrode grows over time.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Concepts */}
          <div className="bg-yellow-50 dark:bg-yellow-900/15 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-yellow-800 dark:text-yellow-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Info className="h-3 w-3 text-yellow-600 dark:text-yellow-400" /> Key Concepts
            </h4>
            <div className="space-y-1.5 text-[10px] text-gray-600 dark:text-gray-300">
              <p>
                <span className="font-semibold text-gray-700 dark:text-gray-200">Spontaneity:</span> A galvanic cell operates spontaneously when E&deg;cell &gt; 0 (&Delta;G&deg; &lt; 0). The reaction converts chemical energy into electrical energy.
              </p>
              <p>
                <span className="font-semibold text-gray-700 dark:text-gray-200">Electron Flow:</span> Electrons flow through the external wire from anode (lower E&deg;) to cathode (higher E&deg;), i.e., from the more reactive metal to the less reactive one.
              </p>
              <p>
                <span className="font-semibold text-gray-700 dark:text-gray-200">Salt Bridge:</span> Maintains electrical neutrality by allowing ions to migrate between half-cells. Cations (K&#x207A;) move toward the cathode; anions (Cl&#x207B;) move toward the anode.
              </p>
              <p>
                <span className="font-semibold text-gray-700 dark:text-gray-200">Standard Reduction Potentials:</span> Measured relative to the Standard Hydrogen Electrode (SHE, E&deg; = 0.00 V). More positive E&deg; means stronger tendency to be reduced.
              </p>
              <p>
                <span className="font-semibold text-gray-700 dark:text-gray-200">Nernst Equation:</span> E = E&deg; &minus; (RT/nF) ln Q. At non-standard conditions, the cell potential depends on ion concentrations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
