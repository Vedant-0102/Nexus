import React, { useState } from 'react';
import { Droplet, Info, Plus, Minus, RotateCcw } from 'lucide-react';

interface Substance {
  name: string;
  pH: number;
  color: string;
}

const commonSubstances: Substance[] = [
  { name: 'Battery Acid', pH: 1, color: '#ef4444' },
  { name: 'Lemon Juice', pH: 2, color: '#f97316' },
  { name: 'Vinegar', pH: 3, color: '#f59e0b' },
  { name: 'Tomato Juice', pH: 4, color: '#eab308' },
  { name: 'Black Coffee', pH: 5, color: '#84cc16' },
  { name: 'Milk', pH: 6.5, color: '#22c55e' },
  { name: 'Pure Water', pH: 7, color: '#10b981' },
  { name: 'Baking Soda', pH: 8.3, color: '#14b8a6' },
  { name: 'Soap', pH: 10, color: '#0ea5e9' },
  { name: 'Ammonia', pH: 11, color: '#3b82f6' },
  { name: 'Bleach', pH: 12.5, color: '#6366f1' },
  { name: 'Drain Cleaner', pH: 14, color: '#8b5cf6' },
];

function getPhColor(pH: number): string {
  if (pH <= 0) return 'rgb(255, 0, 0)';
  if (pH <= 1) return `rgb(255, ${Math.round(40 * pH)}, 0)`;
  if (pH <= 3) return `rgb(255, ${Math.round(40 + 80 * ((pH - 1) / 2))}, 0)`;
  if (pH <= 5) return `rgb(255, ${Math.round(120 + 100 * ((pH - 3) / 2))}, 0)`;
  if (pH <= 6) return `rgb(${Math.round(255 - 120 * (pH - 5))}, ${Math.round(220 + 35 * (pH - 5))}, 0)`;
  if (pH <= 7) return `rgb(${Math.round(135 - 95 * (pH - 6))}, 255, ${Math.round(80 * (pH - 6))})`;
  if (pH <= 8) return `rgb(0, ${Math.round(255 - 60 * (pH - 7))}, ${Math.round(80 + 100 * (pH - 7))})`;
  if (pH <= 10) return `rgb(0, ${Math.round(195 - 135 * ((pH - 8) / 2))}, ${Math.round(180 + 75 * ((pH - 8) / 2))})`;
  if (pH <= 12) return `rgb(${Math.round(80 * ((pH - 10) / 2))}, ${Math.round(60 - 30 * ((pH - 10) / 2))}, 255)`;
  if (pH <= 14) return `rgb(${Math.round(80 + 80 * ((pH - 12) / 2))}, ${Math.round(30 - 30 * ((pH - 12) / 2))}, ${Math.round(255 - 30 * ((pH - 12) / 2))})`;
  return 'rgb(160, 0, 225)';
}

function getNearestSubstance(pH: number): string {
  let closest = commonSubstances[0];
  let minDist = Math.abs(pH - closest.pH);
  for (const s of commonSubstances) {
    const d = Math.abs(pH - s.pH);
    if (d < minDist) {
      minDist = d;
      closest = s;
    }
  }
  return minDist <= 1.0 ? closest.name : pH < 7 ? 'Acidic solution' : pH > 7 ? 'Basic solution' : 'Neutral';
}

function formatScientific(val: number): string {
  if (val === 0) return '0';
  const exp = Math.floor(Math.log10(val));
  const mantissa = val / Math.pow(10, exp);
  if (Math.abs(mantissa - 1) < 0.05) return `10^${exp}`;
  return `${mantissa.toFixed(2)} \u00d7 10^${exp}`;
}

const sliderStyles = `
  .ph-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 12px;
    border-radius: 6px;
    outline: none;
    cursor: pointer;
    background: linear-gradient(to right,
      #ff0000 0%, #ff6600 7%, #ffaa00 21%, #ffe000 35%,
      #88dd00 43%, #22cc44 50%, #0099cc 57%,
      #0055dd 64%, #1133cc 71%, #4400cc 85%, #7700aa 100%
    );
  }
  .ph-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: white;
    border: 3px solid #0d9488;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  }
  .ph-slider::-moz-range-thumb {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: white;
    border: 3px solid #0d9488;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  }
  @keyframes ionFloat {
    0% { transform: translate(0, 0); }
    25% { transform: translate(3px, -4px); }
    50% { transform: translate(-2px, -7px); }
    75% { transform: translate(-4px, -3px); }
    100% { transform: translate(0, 0); }
  }
`;

export const PHScale: React.FC = () => {
  const [pH, setPH] = useState(7);
  const [bufferMode, setBufferMode] = useState(false);
  const [bufferedPH, setBufferedPH] = useState(4.75);
  const [unbufferedPH, setUnbufferedPH] = useState(4.75);
  const [addCount, setAddCount] = useState(0);

  const hConc = Math.pow(10, -pH);
  const ohConc = Math.pow(10, -(14 - pH));
  const pOH = 14 - pH;

  const solutionColor = getPhColor(pH);
  const nearestSubstance = getNearestSubstance(pH);

  // Ion counts for beaker
  const hIons = pH <= 7 ? Math.max(1, Math.round((7 - pH) * 2.5)) : 0;
  const ohIons = pH >= 7 ? Math.max(1, Math.round((pH - 7) * 2.5)) : 0;
  const hClamped = Math.min(hIons, 16);
  const ohClamped = Math.min(ohIons, 16);

  const generateIonPositions = (count: number, seed: number) => {
    const positions: { x: number; y: number; delay: number }[] = [];
    for (let i = 0; i < count; i++) {
      const hash = ((seed + i) * 2654435761) % 1000;
      positions.push({
        x: 35 + (hash % 130),
        y: 100 + ((hash * 7) % 110),
        delay: (i * 0.3) % 3,
      });
    }
    return positions;
  };

  const hPositions = generateIonPositions(hClamped, 42);
  const ohPositions = generateIonPositions(ohClamped, 137);

  // Buffer simulation - clamp properly and track how many additions
  const handleAddAcid = () => {
    setUnbufferedPH(prev => Math.max(0.5, +(prev - 2.0).toFixed(2)));
    setBufferedPH(prev => Math.max(3.0, +(prev - 0.15).toFixed(2)));
    setAddCount(prev => prev + 1);
  };

  const handleAddBase = () => {
    setUnbufferedPH(prev => Math.min(13.5, +(prev + 2.0).toFixed(2)));
    setBufferedPH(prev => Math.min(6.5, +(prev + 0.15).toFixed(2)));
    setAddCount(prev => prev + 1);
  };

  const resetBuffer = () => {
    setBufferedPH(4.75);
    setUnbufferedPH(4.75);
    setAddCount(0);
  };

  const scaleWidth = 540;
  const scaleHeight = 28;
  const scaleX = 20;
  const scaleY = 45;
  const indicatorX = scaleX + (pH / 14) * scaleWidth;

  const bufferDiff = Math.abs(bufferedPH - 4.75);
  const unbufferDiff = Math.abs(unbufferedPH - 4.75);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-teal-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-3 overflow-hidden">
      <style>{sliderStyles}</style>

      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Droplet className="h-5 w-5 text-teal-600" />
            pH Scale &amp; Buffer Solutions
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Explore acidity, basicity, and buffer chemistry
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-gray-600" style={{ backgroundColor: solutionColor }} />
            <span className="text-xl font-bold font-mono text-gray-800 dark:text-white">{pH.toFixed(1)}</span>
            <span className="text-xs text-gray-400">pH</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <span className={`text-sm font-semibold ${pH < 6.5 ? 'text-red-600 dark:text-red-400' : pH > 7.5 ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'}`}>
              {pH < 6.5 ? 'Acidic' : pH > 7.5 ? 'Basic' : 'Neutral'}
            </span>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex gap-3 min-h-0">

        {/* Left: Visualizations */}
        <div className="flex-1 flex flex-col gap-2.5 min-w-0 min-h-0 overflow-y-auto">

          {/* pH Scale SVG */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Droplet className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              <span className="text-xs font-semibold text-gray-800 dark:text-white">pH Scale (0 - 14)</span>
            </div>
            <svg width="100%" viewBox="0 0 580 105" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="phGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ff0000" />
                  <stop offset="7%" stopColor="#ff4400" />
                  <stop offset="14%" stopColor="#ff8800" />
                  <stop offset="21%" stopColor="#ffbb00" />
                  <stop offset="29%" stopColor="#ffdd00" />
                  <stop offset="36%" stopColor="#ccee00" />
                  <stop offset="43%" stopColor="#66dd22" />
                  <stop offset="50%" stopColor="#22cc44" />
                  <stop offset="57%" stopColor="#00aaaa" />
                  <stop offset="64%" stopColor="#0066dd" />
                  <stop offset="71%" stopColor="#0044cc" />
                  <stop offset="79%" stopColor="#2222bb" />
                  <stop offset="86%" stopColor="#4400aa" />
                  <stop offset="93%" stopColor="#660099" />
                  <stop offset="100%" stopColor="#880088" />
                </linearGradient>
                <marker id="arrowRed" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#dc2626" opacity="0.6" />
                </marker>
                <marker id="arrowBlue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#2563eb" opacity="0.6" />
                </marker>
              </defs>

              {/* Region labels */}
              <text x={scaleX + scaleWidth * 0.18} y={15} fill="#dc2626" fontSize="11" textAnchor="middle" fontWeight="700">Acidic</text>
              <text x={scaleX + scaleWidth * 0.5} y={15} fill="#16a34a" fontSize="11" textAnchor="middle" fontWeight="700">Neutral</text>
              <text x={scaleX + scaleWidth * 0.82} y={15} fill="#2563eb" fontSize="11" textAnchor="middle" fontWeight="700">Basic / Alkaline</text>

              {/* Indicator triangle */}
              <polygon
                points={`${indicatorX},${scaleY - 2} ${indicatorX - 8},${scaleY - 15} ${indicatorX + 8},${scaleY - 15}`}
                fill={solutionColor}
                stroke="#374151"
                strokeWidth="1"
              />
              <text x={indicatorX} y={scaleY - 18} fill="#374151" fontSize="11" textAnchor="middle" fontWeight="bold" className="dark:fill-white">
                {pH.toFixed(1)}
              </text>

              {/* Scale bar */}
              <rect x={scaleX} y={scaleY} width={scaleWidth} height={scaleHeight} rx="4" fill="url(#phGradient)" stroke="#9ca3af" strokeWidth="0.5" />

              {/* pH number labels */}
              {Array.from({ length: 15 }, (_, i) => {
                const x = scaleX + (i / 14) * scaleWidth;
                return (
                  <g key={`label-${i}`}>
                    <line x1={x} y1={scaleY + scaleHeight} x2={x} y2={scaleY + scaleHeight + 6} stroke="#6b7280" strokeWidth="1" />
                    <text x={x} y={scaleY + scaleHeight + 17} fill="#374151" fontSize="10" textAnchor="middle" fontWeight="600" className="dark:fill-gray-300">{i}</text>
                  </g>
                );
              })}

              {/* Concentration labels */}
              <text x={scaleX} y={scaleY + scaleHeight + 32} fill="#dc2626" fontSize="9" textAnchor="start" className="dark:fill-red-400">[H+] high</text>
              <text x={scaleX + scaleWidth} y={scaleY + scaleHeight + 32} fill="#2563eb" fontSize="9" textAnchor="end" className="dark:fill-blue-400">[OH-] high</text>
              <text x={scaleX + scaleWidth / 2} y={scaleY + scaleHeight + 32} fill="#6b7280" fontSize="9" textAnchor="middle">[H+] = [OH-]</text>
            </svg>

            {/* Slider */}
            <div className="mt-1 px-4">
              <input
                type="range"
                min="0"
                max="14"
                step="0.1"
                value={pH}
                onChange={(e) => setPH(Number(e.target.value))}
                className="ph-slider"
              />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-red-500 font-semibold">0 (Strong Acid)</span>
                <span className="text-[10px] text-green-600 font-semibold">7 (Neutral)</span>
                <span className="text-[10px] text-blue-600 font-semibold">14 (Strong Base)</span>
              </div>
            </div>
          </div>

          {/* Common Substances + Beaker row */}
          <div className="flex gap-2.5 flex-1 min-h-0">

            {/* Substance buttons */}
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 overflow-y-auto">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2.5 flex items-center gap-1.5">
                <Droplet className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" /> Common Substances
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {commonSubstances.map((substance) => {
                  const isActive = Math.abs(pH - substance.pH) < 0.05;
                  return (
                    <button
                      key={substance.name}
                      onClick={() => setPH(substance.pH)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all border ${
                        isActive
                          ? 'bg-teal-100 dark:bg-teal-900/40 border-teal-400 dark:border-teal-600 shadow-md ring-1 ring-teal-300 dark:ring-teal-700'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0 border border-white shadow-sm"
                        style={{ backgroundColor: getPhColor(substance.pH) }}
                      />
                      <div className="min-w-0">
                        <div className={`text-sm font-medium truncate ${isActive ? 'text-teal-800 dark:text-teal-200' : 'text-gray-700 dark:text-gray-300'}`}>
                          {substance.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          pH {substance.pH}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Beaker Visualization */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 flex flex-col items-center" style={{ width: 230 }}>
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                <Droplet className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" /> Solution
              </h4>
              <svg width="200" viewBox="0 0 200 250" preserveAspectRatio="xMidYMid meet" className="flex-1">
                {/* Beaker body */}
                <path
                  d="M40,30 L40,195 Q40,225 70,225 L130,225 Q160,225 160,195 L160,30"
                  fill="none"
                  stroke="#9ca3af"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                {/* Beaker rim */}
                <line x1="30" y1="30" x2="50" y2="30" stroke="#9ca3af" strokeWidth="3" strokeLinecap="round" />
                <line x1="150" y1="30" x2="170" y2="30" stroke="#9ca3af" strokeWidth="3" strokeLinecap="round" />

                {/* Solution fill */}
                <path
                  d="M42,75 L42,195 Q42,223 70,223 L130,223 Q158,223 158,195 L158,75 Z"
                  fill={solutionColor}
                  opacity="0.35"
                />
                {/* Surface highlight */}
                <ellipse cx="100" cy="75" rx="58" ry="5" fill={solutionColor} opacity="0.25" />

                {/* Graduation marks */}
                {[95, 125, 155, 185].map((y, i) => (
                  <g key={`grad-${i}`}>
                    <line x1="42" y1={y} x2="55" y2={y} stroke="#9ca3af" strokeWidth="1" opacity="0.5" />
                    <text x="58" y={y + 3} fill="#9ca3af" fontSize="7" opacity="0.6">{(4 - i) * 50}ml</text>
                  </g>
                ))}

                {/* H+ ions */}
                {hPositions.map((pos, i) => (
                  <g key={`h-${i}`} style={{ animation: `ionFloat ${2 + pos.delay}s ease-in-out infinite`, animationDelay: `${pos.delay}s` }}>
                    <circle cx={pos.x} cy={pos.y} r="7" fill="#ef4444" opacity="0.85" />
                    <text x={pos.x} y={pos.y + 3} fill="white" fontSize="7" textAnchor="middle" fontWeight="bold">H+</text>
                  </g>
                ))}

                {/* OH- ions */}
                {ohPositions.map((pos, i) => (
                  <g key={`oh-${i}`} style={{ animation: `ionFloat ${2.5 + pos.delay}s ease-in-out infinite`, animationDelay: `${pos.delay + 0.5}s` }}>
                    <circle cx={pos.x} cy={pos.y} r="9" fill="#3b82f6" opacity="0.85" />
                    <text x={pos.x} y={pos.y + 3} fill="white" fontSize="6.5" textAnchor="middle" fontWeight="bold">OH-</text>
                  </g>
                ))}

                {/* Label */}
                <text x="100" y="244" fill="#6b7280" fontSize="10" textAnchor="middle" className="dark:fill-gray-400">
                  {nearestSubstance}
                </text>
              </svg>

              {/* Ion legend */}
              <div className="flex items-center gap-4 mt-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-red-500 opacity-85" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">H+ ({hClamped})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-blue-500 opacity-85" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">OH- ({ohClamped})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Buffer Solution Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" /> Buffer Solution Comparison
              </h4>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <span className="text-xs text-gray-500 dark:text-gray-400">Buffer Mode</span>
                <div
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${bufferMode ? 'bg-teal-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                  onClick={() => { setBufferMode(!bufferMode); resetBuffer(); }}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${bufferMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </label>
            </div>

            {bufferMode ? (
              <div>
                {/* Starting info */}
                <div className="text-[10px] text-gray-500 dark:text-gray-400 text-center mb-2">
                  Both start at pH 4.75 (acetic acid). The <span className="text-teal-600 dark:text-teal-400 font-semibold">buffered</span> solution contains CH&#8323;COOH / CH&#8323;COO&#8315; buffer.
                </div>

                <div className="flex gap-2 items-stretch">
                  {/* Buffered beaker */}
                  <div className="flex-1 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg p-2">
                    <div className="text-center text-[10px] font-bold text-teal-700 dark:text-teal-300 mb-1">
                      Buffered Solution
                    </div>
                    <svg width="100%" viewBox="0 0 140 90" preserveAspectRatio="xMidYMid meet">
                      {/* Beaker */}
                      <rect x="30" y="10" width="80" height="55" rx="4" fill="none" stroke="#5eead4" strokeWidth="2.5" />
                      {/* Solution */}
                      <rect x="32" y="25" width="76" height="38" rx="3" fill={getPhColor(bufferedPH)} opacity="0.4" />
                      {/* pH value */}
                      <text x="70" y="40" fill="#374151" fontSize="16" textAnchor="middle" fontWeight="bold" className="dark:fill-white">
                        {bufferedPH.toFixed(2)}
                      </text>
                      <text x="70" y="53" fill="#6b7280" fontSize="9" textAnchor="middle" className="dark:fill-gray-400">pH</text>
                      <text x="70" y="80" fill="#0d9488" fontSize="8" textAnchor="middle" fontWeight="600">Buffered</text>
                    </svg>
                    <div className="text-center mt-1">
                      <span className={`text-xs font-semibold ${bufferDiff < 0.5 ? 'text-green-600' : bufferDiff < 1 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {bufferDiff === 0 ? 'No change' : `\u0394pH = ${bufferDiff.toFixed(2)}`}
                      </span>
                    </div>
                  </div>

                  {/* Controls in the middle */}
                  <div className="flex flex-col gap-1.5 items-center justify-center px-1">
                    <button
                      onClick={handleAddAcid}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[11px] font-semibold rounded-lg transition-all shadow-sm active:scale-95"
                    >
                      <Plus className="h-3 w-3" /> Acid
                    </button>
                    <button
                      onClick={handleAddBase}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-semibold rounded-lg transition-all shadow-sm active:scale-95"
                    >
                      <Plus className="h-3 w-3" /> Base
                    </button>
                    <button
                      onClick={resetBuffer}
                      className="flex items-center gap-1 px-2.5 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 text-[10px] rounded-lg transition-all"
                    >
                      <RotateCcw className="h-2.5 w-2.5" /> Reset
                    </button>
                    {addCount > 0 && (
                      <div className="text-[10px] text-gray-400 dark:text-gray-500">
                        {addCount}x
                      </div>
                    )}
                  </div>

                  {/* Unbuffered beaker */}
                  <div className="flex-1 bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                    <div className="text-center text-[10px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                      Unbuffered Solution
                    </div>
                    <svg width="100%" viewBox="0 0 140 90" preserveAspectRatio="xMidYMid meet">
                      {/* Beaker */}
                      <rect x="30" y="10" width="80" height="55" rx="4" fill="none" stroke="#9ca3af" strokeWidth="2.5" />
                      {/* Solution */}
                      <rect x="32" y="25" width="76" height="38" rx="3" fill={getPhColor(unbufferedPH)} opacity="0.4" />
                      {/* pH value */}
                      <text x="70" y="40" fill="#374151" fontSize="16" textAnchor="middle" fontWeight="bold" className="dark:fill-white">
                        {unbufferedPH.toFixed(2)}
                      </text>
                      <text x="70" y="53" fill="#6b7280" fontSize="9" textAnchor="middle" className="dark:fill-gray-400">pH</text>
                      <text x="70" y="80" fill="#6b7280" fontSize="8" textAnchor="middle" fontWeight="600">Unbuffered</text>
                    </svg>
                    <div className="text-center mt-1">
                      <span className={`text-xs font-semibold ${unbufferDiff < 0.5 ? 'text-green-600' : unbufferDiff < 2 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {unbufferDiff === 0 ? 'No change' : `\u0394pH = ${unbufferDiff.toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Result explanation */}
                {addCount > 0 && (
                  <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-[10px] text-amber-800 dark:text-amber-300">
                      After {addCount} addition{addCount > 1 ? 's' : ''}: buffered changed by{' '}
                      <span className="font-bold">{bufferDiff.toFixed(2)}</span>, unbuffered by{' '}
                      <span className="font-bold">{unbufferDiff.toFixed(2)}</span>.
                      {unbufferDiff > bufferDiff * 3 && ' Buffer effectively resists pH change!'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-5">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Enable Buffer Mode to compare how buffered and unbuffered solutions respond to adding acid or base.
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  A buffer (e.g., acetic acid / acetate) resists pH change when small amounts of acid or base are added.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Info Panel */}
        <div className="w-72 flex flex-col gap-2 flex-shrink-0 overflow-y-auto">

          {/* Current pH display */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3">
            <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Current pH</h4>
            <div className="text-center mb-3">
              <div className="text-4xl font-bold font-mono" style={{ color: solutionColor }}>{pH.toFixed(1)}</div>
              <div className={`text-sm font-semibold mt-1 ${pH < 6.5 ? 'text-red-600 dark:text-red-400' : pH > 7.5 ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'}`}>
                {pH < 6.5 ? 'Acidic' : pH > 7.5 ? 'Basic (Alkaline)' : 'Neutral'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{nearestSubstance}</div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center py-1 border-t border-gray-100 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">[H+]</span>
                <span className="font-mono text-red-600 dark:text-red-400 text-[11px]">{formatScientific(hConc)} M</span>
              </div>
              <div className="flex justify-between items-center py-1 border-t border-gray-100 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">[OH-]</span>
                <span className="font-mono text-blue-600 dark:text-blue-400 text-[11px]">{formatScientific(ohConc)} M</span>
              </div>
              <div className="flex justify-between items-center py-1 border-t border-gray-100 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">pOH</span>
                <span className="font-mono text-gray-800 dark:text-white">{pOH.toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-t border-gray-100 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">pH + pOH</span>
                <span className="font-mono text-gray-800 dark:text-white">= 14.0</span>
              </div>
            </div>
          </div>

          {/* Formula card */}
          <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-teal-800 dark:text-teal-300 uppercase tracking-wider mb-1.5">Formulas</h4>
            <div className="text-center py-1.5 px-2 bg-white dark:bg-gray-800 rounded-md mb-1.5">
              <span className="text-sm font-bold font-mono text-teal-700 dark:text-teal-300">pH = -log[H+]</span>
            </div>
            <div className="text-center py-1.5 px-2 bg-white dark:bg-gray-800 rounded-md mb-1.5">
              <span className="text-xs font-mono text-gray-600 dark:text-gray-300">pOH = -log[OH-]</span>
            </div>
            <div className="text-center py-1.5 px-2 bg-white dark:bg-gray-800 rounded-md">
              <span className="text-xs font-mono text-gray-600 dark:text-gray-300">Kw = [H+][OH-] = 10&#8315;&#185;&#8308;</span>
            </div>
          </div>

          {/* Key Concepts */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2.5">
            <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Info className="h-3 w-3" /> Key Concepts
            </h4>
            <div className="space-y-2 text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
              <div className="flex items-start gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0 mt-1.5" />
                <span><span className="font-semibold text-gray-700 dark:text-gray-200">Logarithmic scale:</span> Each pH unit = 10x change in [H+].</span>
              </div>
              <div className="flex items-start gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
                <span><span className="font-semibold text-gray-700 dark:text-gray-200">Strong acids</span> fully dissociate; <span className="font-semibold text-gray-700 dark:text-gray-200">weak acids</span> partially.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                <span><span className="font-semibold text-gray-700 dark:text-gray-200">Strong bases</span> fully dissociate; <span className="font-semibold text-gray-700 dark:text-gray-200">weak bases</span> partially.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 mt-1.5" />
                <span><span className="font-semibold text-gray-700 dark:text-gray-200">Buffers:</span> Weak acid + conjugate base mixture, resists pH changes.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0 mt-1.5" />
                <span><span className="font-semibold text-gray-700 dark:text-gray-200">Henderson-Hasselbalch:</span> pH = pKa + log([A-]/[HA]). Effective range: pKa +/- 1.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
