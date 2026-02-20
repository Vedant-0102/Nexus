import React, { useState } from 'react';
import { Eye, Info } from 'lucide-react';

// --- Data Types ---

interface SpectralLine {
  wavelength: number;
  intensity: number; // 0-1
  label?: string;
}

interface ElementData {
  name: string;
  symbol: string;
  atomicNumber: number;
  electronConfig: string;
  lines: SpectralLine[];
  energyLevels: { n: number; energy: number }[]; // energy in eV (negative)
  transitions: { from: number; to: number; wavelength: number }[];
  description: string;
}

// --- Scientifically Accurate Element Data ---

const elements: ElementData[] = [
  {
    name: 'Hydrogen',
    symbol: 'H',
    atomicNumber: 1,
    electronConfig: '1s\u00B9',
    lines: [
      { wavelength: 410, intensity: 0.4, label: 'H\u03B4' },
      { wavelength: 434, intensity: 0.55, label: 'H\u03B3' },
      { wavelength: 486, intensity: 0.75, label: 'H\u03B2' },
      { wavelength: 656, intensity: 1.0, label: 'H\u03B1' },
    ],
    energyLevels: [
      { n: 1, energy: -13.6 },
      { n: 2, energy: -3.4 },
      { n: 3, energy: -1.51 },
      { n: 4, energy: -0.85 },
      { n: 5, energy: -0.54 },
      { n: 6, energy: -0.38 },
    ],
    transitions: [
      { from: 6, to: 2, wavelength: 410 },
      { from: 5, to: 2, wavelength: 434 },
      { from: 4, to: 2, wavelength: 486 },
      { from: 3, to: 2, wavelength: 656 },
    ],
    description: 'Simplest element. Its Balmer series (visible transitions to n=2) produces the characteristic red, cyan, blue, and violet lines used to confirm the Bohr model.',
  },
  {
    name: 'Helium',
    symbol: 'He',
    atomicNumber: 2,
    electronConfig: '1s\u00B2',
    lines: [
      { wavelength: 447, intensity: 0.5 },
      { wavelength: 471, intensity: 0.35 },
      { wavelength: 501, intensity: 0.6 },
      { wavelength: 587, intensity: 1.0, label: 'D\u2083' },
      { wavelength: 668, intensity: 0.7 },
    ],
    energyLevels: [
      { n: 1, energy: -24.59 },
      { n: 2, energy: -5.0 },
      { n: 3, energy: -2.0 },
      { n: 4, energy: -1.1 },
      { n: 5, energy: -0.7 },
      { n: 6, energy: -0.49 },
    ],
    transitions: [
      { from: 5, to: 3, wavelength: 447 },
      { from: 6, to: 3, wavelength: 471 },
      { from: 4, to: 3, wavelength: 501 },
      { from: 3, to: 2, wavelength: 587 },
      { from: 5, to: 4, wavelength: 668 },
    ],
    description: 'Discovered in the solar spectrum before being found on Earth. Its bright yellow 587nm D\u2083 line is one of the most recognizable spectral signatures in astrophysics.',
  },
  {
    name: 'Sodium',
    symbol: 'Na',
    atomicNumber: 11,
    electronConfig: '[Ne] 3s\u00B9',
    lines: [
      { wavelength: 589, intensity: 1.0, label: 'D\u2081' },
      { wavelength: 590, intensity: 0.95, label: 'D\u2082' },
    ],
    energyLevels: [
      { n: 1, energy: -5.14 },
      { n: 2, energy: -3.04 },
      { n: 3, energy: -1.95 },
      { n: 4, energy: -1.02 },
      { n: 5, energy: -0.65 },
      { n: 6, energy: -0.45 },
    ],
    transitions: [
      { from: 2, to: 1, wavelength: 589 },
      { from: 2, to: 1, wavelength: 590 },
    ],
    description: 'Famous for the sodium doublet (D-lines) at 589/590nm, producing the intense yellow glow seen in sodium vapor street lamps. The doublet arises from spin-orbit coupling.',
  },
  {
    name: 'Mercury',
    symbol: 'Hg',
    atomicNumber: 80,
    electronConfig: '[Xe] 4f\u00B9\u2074 5d\u00B9\u2070 6s\u00B2',
    lines: [
      { wavelength: 405, intensity: 0.7 },
      { wavelength: 436, intensity: 0.85 },
      { wavelength: 546, intensity: 1.0 },
      { wavelength: 577, intensity: 0.6 },
      { wavelength: 579, intensity: 0.55 },
    ],
    energyLevels: [
      { n: 1, energy: -10.44 },
      { n: 2, energy: -5.77 },
      { n: 3, energy: -3.73 },
      { n: 4, energy: -2.48 },
      { n: 5, energy: -1.57 },
      { n: 6, energy: -1.12 },
    ],
    transitions: [
      { from: 5, to: 2, wavelength: 405 },
      { from: 4, to: 2, wavelength: 436 },
      { from: 3, to: 2, wavelength: 546 },
      { from: 4, to: 3, wavelength: 577 },
      { from: 5, to: 3, wavelength: 579 },
    ],
    description: 'Mercury vapor lamps produce a characteristic green line at 546nm. Used extensively in spectroscopy calibration and fluorescent lighting.',
  },
  {
    name: 'Neon',
    symbol: 'Ne',
    atomicNumber: 10,
    electronConfig: '1s\u00B2 2s\u00B2 2p\u2076',
    lines: [
      { wavelength: 540, intensity: 0.45 },
      { wavelength: 585, intensity: 0.7 },
      { wavelength: 603, intensity: 0.8 },
      { wavelength: 616, intensity: 0.9 },
      { wavelength: 640, intensity: 1.0 },
      { wavelength: 693, intensity: 0.55 },
    ],
    energyLevels: [
      { n: 1, energy: -21.56 },
      { n: 2, energy: -5.1 },
      { n: 3, energy: -2.9 },
      { n: 4, energy: -1.6 },
      { n: 5, energy: -1.0 },
      { n: 6, energy: -0.7 },
    ],
    transitions: [
      { from: 4, to: 2, wavelength: 540 },
      { from: 3, to: 2, wavelength: 585 },
      { from: 4, to: 3, wavelength: 603 },
      { from: 5, to: 3, wavelength: 616 },
      { from: 5, to: 2, wavelength: 640 },
      { from: 6, to: 3, wavelength: 693 },
    ],
    description: 'Neon produces the iconic reddish-orange glow of neon signs. Its many spectral lines in the red-orange region make it useful for wavelength calibration.',
  },
];

// --- Wavelength to Visible Color ---

function wavelengthToColor(wavelength: number): string {
  let r = 0, g = 0, b = 0;

  if (wavelength >= 380 && wavelength < 440) {
    r = -(wavelength - 440) / (440 - 380);
    g = 0;
    b = 1;
  } else if (wavelength >= 440 && wavelength < 490) {
    r = 0;
    g = (wavelength - 440) / (490 - 440);
    b = 1;
  } else if (wavelength >= 490 && wavelength < 510) {
    r = 0;
    g = 1;
    b = -(wavelength - 510) / (510 - 490);
  } else if (wavelength >= 510 && wavelength < 580) {
    r = (wavelength - 510) / (580 - 510);
    g = 1;
    b = 0;
  } else if (wavelength >= 580 && wavelength < 645) {
    r = 1;
    g = -(wavelength - 645) / (645 - 580);
    b = 0;
  } else if (wavelength >= 645 && wavelength <= 700) {
    r = 1;
    g = 0;
    b = 0;
  }

  // Intensity falloff at edges of visible spectrum
  let factor = 1.0;
  if (wavelength >= 380 && wavelength < 420) {
    factor = 0.3 + 0.7 * (wavelength - 380) / (420 - 380);
  } else if (wavelength >= 645 && wavelength <= 700) {
    factor = 0.3 + 0.7 * (700 - wavelength) / (700 - 645);
  }

  r = Math.round(255 * Math.pow(r * factor, 0.8));
  g = Math.round(255 * Math.pow(g * factor, 0.8));
  b = Math.round(255 * Math.pow(b * factor, 0.8));

  return `rgb(${r},${g},${b})`;
}

// --- Constants ---

const SPECTRUM_W = 600;
const SPECTRUM_H = 200;
const WL_MIN = 380;
const WL_MAX = 700;
const ENERGY_W = 300;
const ENERGY_H = 280;

function wlToX(wl: number): number {
  return ((wl - WL_MIN) / (WL_MAX - WL_MIN)) * SPECTRUM_W;
}

// --- Component ---

export const SpectroscopySimulator: React.FC = () => {
  const [selectedElement, setSelectedElement] = useState<ElementData>(elements[0]);
  const [mode, setMode] = useState<'emission' | 'absorption'>('emission');
  const [hoveredLine, setHoveredLine] = useState<SpectralLine | null>(null);
  const [selectedLine, setSelectedLine] = useState<SpectralLine | null>(null);

  const activeLine = hoveredLine || selectedLine;

  // Find the transition that matches the active line
  const activeTransition = activeLine
    ? selectedElement.transitions.find(t => t.wavelength === activeLine.wavelength)
    : null;

  // Energy level diagram scaling
  const maxEnergy = Math.max(...selectedElement.energyLevels.map(l => Math.abs(l.energy)));
  const levelY = (energy: number): number => {
    const padding = 30;
    const usable = ENERGY_H - 2 * padding;
    // Map energy: most negative (ground state) at bottom, least negative at top
    const normalized = (Math.abs(energy)) / maxEnergy;
    return padding + (1 - normalized) * usable;
  };

  // Spectrum gradient stops for the rainbow bar
  const gradientStops: { offset: string; color: string }[] = [];
  for (let wl = WL_MIN; wl <= WL_MAX; wl += 5) {
    const pct = ((wl - WL_MIN) / (WL_MAX - WL_MIN)) * 100;
    gradientStops.push({ offset: `${pct}%`, color: wavelengthToColor(wl) });
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-3 overflow-hidden">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Eye className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Spectroscopy Simulator
          </h2>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Explore emission and absorption spectra of elements &mdash; {selectedElement.name} ({selectedElement.symbol})
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Mode Toggle */}
          <div className="flex rounded-lg overflow-hidden border border-purple-300 dark:border-purple-700 shadow-sm">
            <button
              onClick={() => setMode('emission')}
              className={`px-3 py-1.5 text-xs font-semibold transition-all ${
                mode === 'emission'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-gray-700'
              }`}
            >
              Emission
            </button>
            <button
              onClick={() => setMode('absorption')}
              className={`px-3 py-1.5 text-xs font-semibold transition-all ${
                mode === 'absorption'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700'
              }`}
            >
              Absorption
            </button>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Z =</span>
            <span className="text-sm font-bold font-mono text-purple-700 dark:text-purple-300">{selectedElement.atomicNumber}</span>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex gap-3 min-h-0">

        {/* Left Column: Element Selector + Spectrum + Energy Diagram */}
        <div className="flex-1 flex flex-col gap-2.5 min-w-0 min-h-0">

          {/* Element Selector - horizontal strip */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md px-3 py-2 flex items-center gap-2 flex-shrink-0">
            <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mr-1">Element</span>
            {elements.map(el => (
              <button
                key={el.symbol}
                onClick={() => {
                  setSelectedElement(el);
                  setSelectedLine(null);
                  setHoveredLine(null);
                }}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] transition-all ${
                  selectedElement.symbol === el.symbol
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-700 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent'
                }`}
              >
                <span className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                  {el.symbol}
                </span>
                <div className="text-left">
                  <div className="font-semibold leading-tight">{el.name}</div>
                  <div className="text-[8px] text-gray-400 dark:text-gray-500">Z={el.atomicNumber}</div>
                </div>
              </button>
            ))}
          </div>
          {/* Spectrum Viewer */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 flex flex-col">
            <div className="flex items-center gap-1.5 mb-2">
              <Eye className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-semibold text-gray-800 dark:text-white">
                {mode === 'emission' ? 'Emission' : 'Absorption'} Spectrum &mdash; {selectedElement.name}
              </span>
              {activeLine && (
                <span className="ml-auto text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                  {activeLine.wavelength} nm
                  {activeLine.label && ` (${activeLine.label})`}
                </span>
              )}
            </div>
            {/* Spectral Intensity Profile */}
            <svg
              width="100%"
              viewBox={`0 0 ${SPECTRUM_W} 40`}
              preserveAspectRatio="xMidYMid meet"
              className="rounded-t"
            >
              <rect x="0" y="0" width={SPECTRUM_W} height={40} rx="3" fill="#111827" />
              {selectedElement.lines.map((line, i) => {
                const lineX = wlToX(line.wavelength);
                const color = wavelengthToColor(line.wavelength);
                const isActive = activeLine?.wavelength === line.wavelength;
                const sigma = 3.5;
                const range = Math.ceil(sigma * 5);
                const sx = Math.max(0, Math.floor(lineX - range));
                const ex = Math.min(SPECTRUM_W, Math.ceil(lineX + range));
                const pts: string[] = [];
                for (let px = sx; px <= ex; px++) {
                  const d = px - lineX;
                  const v = line.intensity * Math.exp(-(d * d) / (2 * sigma * sigma));
                  pts.push(`${px},${38 - v * 30}`);
                }
                return (
                  <path
                    key={i}
                    d={`M${sx},38 L${pts.join(' L')} L${ex},38 Z`}
                    fill={color}
                    opacity={isActive ? 0.9 : 0.5}
                    stroke={color}
                    strokeWidth={isActive ? 1.2 : 0.5}
                  />
                );
              })}
              <line x1="0" y1={38} x2={SPECTRUM_W} y2={38} stroke="#374151" strokeWidth="0.5" />
              <text x="4" y="10" fill="#4b5563" fontSize="7">Intensity</text>
            </svg>
            <svg
              width="100%"
              viewBox={`0 0 ${SPECTRUM_W} ${SPECTRUM_H}`}
              preserveAspectRatio="xMidYMid meet"
              className="rounded"
            >
              <defs>
                {/* Rainbow gradient for spectrum background */}
                <linearGradient id="spectrumGradient" x1="0" y1="0" x2="1" y2="0">
                  {gradientStops.map((stop, i) => (
                    <stop key={i} offset={stop.offset} stopColor={stop.color} />
                  ))}
                </linearGradient>
              </defs>

              {mode === 'emission' ? (
                <>
                  {/* Dark background for emission */}
                  <rect x="0" y="0" width={SPECTRUM_W} height={SPECTRUM_H - 30} rx="4" fill="#111827" />
                  {/* Bright emission lines */}
                  {selectedElement.lines.map((line, i) => {
                    const x = wlToX(line.wavelength);
                    const color = wavelengthToColor(line.wavelength);
                    const isActive = activeLine?.wavelength === line.wavelength;
                    return (
                      <g key={i}>
                        {/* Glow effect */}
                        <line
                          x1={x} y1={4} x2={x} y2={SPECTRUM_H - 34}
                          stroke={color}
                          strokeWidth={isActive ? 12 : 8}
                          opacity={line.intensity * 0.2}
                          strokeLinecap="round"
                        />
                        <line
                          x1={x} y1={4} x2={x} y2={SPECTRUM_H - 34}
                          stroke={color}
                          strokeWidth={isActive ? 6 : 4}
                          opacity={line.intensity * 0.4}
                          strokeLinecap="round"
                        />
                        {/* Main line */}
                        <line
                          x1={x} y1={4} x2={x} y2={SPECTRUM_H - 34}
                          stroke={color}
                          strokeWidth={isActive ? 3 : 2}
                          opacity={line.intensity}
                          strokeLinecap="round"
                        />
                        {/* Invisible wider hit area for interaction */}
                        <line
                          x1={x} y1={0} x2={x} y2={SPECTRUM_H - 30}
                          stroke="transparent"
                          strokeWidth="14"
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredLine(line)}
                          onMouseLeave={() => setHoveredLine(null)}
                          onClick={() => setSelectedLine(line)}
                        />
                        {/* Wavelength label on hover */}
                        {isActive && (
                          <text
                            x={x}
                            y={16}
                            fill="white"
                            fontSize="10"
                            textAnchor="middle"
                            fontWeight="bold"
                            style={{ textShadow: `0 0 4px ${color}` }}
                          >
                            {line.wavelength}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </>
              ) : (
                <>
                  {/* Continuous rainbow for absorption */}
                  <rect x="0" y="0" width={SPECTRUM_W} height={SPECTRUM_H - 30} rx="4" fill="url(#spectrumGradient)" />
                  {/* Dark absorption lines (gaps) */}
                  {selectedElement.lines.map((line, i) => {
                    const x = wlToX(line.wavelength);
                    const isActive = activeLine?.wavelength === line.wavelength;
                    return (
                      <g key={i}>
                        <line
                          x1={x} y1={0} x2={x} y2={SPECTRUM_H - 30}
                          stroke="#111827"
                          strokeWidth={isActive ? 4 : 2.5}
                          opacity={line.intensity * 0.95}
                        />
                        {/* Invisible wider hit area for interaction */}
                        <line
                          x1={x} y1={0} x2={x} y2={SPECTRUM_H - 30}
                          stroke="transparent"
                          strokeWidth="14"
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredLine(line)}
                          onMouseLeave={() => setHoveredLine(null)}
                          onClick={() => setSelectedLine(line)}
                        />
                        {isActive && (
                          <>
                            {/* Highlight markers */}
                            <polygon
                              points={`${x},${SPECTRUM_H - 32} ${x - 5},${SPECTRUM_H - 26} ${x + 5},${SPECTRUM_H - 26}`}
                              fill="#ef4444"
                            />
                            <text
                              x={x}
                              y={16}
                              fill="white"
                              fontSize="10"
                              textAnchor="middle"
                              fontWeight="bold"
                              stroke="#111827"
                              strokeWidth="3"
                              paintOrder="stroke"
                            >
                              {line.wavelength}
                            </text>
                          </>
                        )}
                      </g>
                    );
                  })}
                </>
              )}

              {/* Wavelength scale axis */}
              <rect x="0" y={SPECTRUM_H - 28} width={SPECTRUM_W} height="28" fill="none" />
              <line x1="0" y1={SPECTRUM_H - 28} x2={SPECTRUM_W} y2={SPECTRUM_H - 28} stroke="#9ca3af" strokeWidth="0.5" />
              {Array.from({ length: 17 }, (_, i) => WL_MIN + i * 20).map(wl => {
                const x = wlToX(wl);
                const isMajor = wl % 50 === 0 || wl === 380;
                return (
                  <g key={wl}>
                    <line
                      x1={x} y1={SPECTRUM_H - 28}
                      x2={x} y2={SPECTRUM_H - (isMajor ? 20 : 23)}
                      stroke="#6b7280"
                      strokeWidth={isMajor ? 1 : 0.5}
                    />
                    {isMajor && (
                      <text
                        x={x} y={SPECTRUM_H - 6}
                        fill="#6b7280"
                        fontSize="9"
                        textAnchor="middle"
                      >
                        {wl}
                      </text>
                    )}
                  </g>
                );
              })}
              <text x={SPECTRUM_W / 2} y={SPECTRUM_H - 1} fill="#9ca3af" fontSize="8" textAnchor="middle">
                Wavelength (nm)
              </text>

              {/* Color region labels */}
              {[
                { wl: 400, label: 'Violet' },
                { wl: 460, label: 'Blue' },
                { wl: 510, label: 'Green' },
                { wl: 570, label: 'Yellow' },
                { wl: 610, label: 'Orange' },
                { wl: 670, label: 'Red' },
              ].map(({ wl, label }) => (
                <text
                  key={label}
                  x={wlToX(wl)}
                  y={SPECTRUM_H - 16}
                  fill="#9ca3af"
                  fontSize="7"
                  textAnchor="middle"
                  opacity="0.7"
                >
                  {label}
                </text>
              ))}
            </svg>
          </div>

          {/* Energy Level Diagram - full width */}
          <div className="flex-1 min-h-0">

            {/* Energy Level Diagram */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 flex flex-col h-full">
              <div className="flex items-center gap-1.5 mb-1">
                <Info className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-semibold text-gray-800 dark:text-white">Energy Level Diagram</span>
              </div>
              <svg
                width="100%"
                viewBox={`0 0 ${ENERGY_W} ${ENERGY_H}`}
                preserveAspectRatio="xMidYMid meet"
                className="flex-1"
              >
                {/* Arrow markers drawn inline per-transition */}

                {/* Background */}
                <rect x="0" y="0" width={ENERGY_W} height={ENERGY_H} fill="none" />

                {/* Energy axis label */}
                <text x="12" y={ENERGY_H / 2} fill="#9ca3af" fontSize="9" textAnchor="middle" transform={`rotate(-90,12,${ENERGY_H / 2})`}>
                  Energy (eV)
                </text>

                {/* Ionization level (0 eV) */}
                <line x1="40" y1="25" x2={ENERGY_W - 20} y2="25" stroke="#d1d5db" strokeWidth="0.5" strokeDasharray="4,3" />
                <text x={ENERGY_W - 18} y="28" fill="#9ca3af" fontSize="8" textAnchor="start">0 eV</text>
                <text x="40" y="18" fill="#9ca3af" fontSize="7">Ionization</text>

                {/* Energy levels */}
                {selectedElement.energyLevels.map((level) => {
                  const y = levelY(level.energy);
                  const isInvolved = activeTransition
                    ? level.n === activeTransition.from || level.n === activeTransition.to
                    : false;
                  return (
                    <g key={level.n}>
                      <line
                        x1="50"
                        y1={y}
                        x2={ENERGY_W - 30}
                        y2={y}
                        stroke={isInvolved ? '#8b5cf6' : '#6b7280'}
                        strokeWidth={isInvolved ? 2.5 : 1.5}
                      />
                      <text
                        x="38"
                        y={y + 4}
                        fill={isInvolved ? '#8b5cf6' : '#6b7280'}
                        fontSize="10"
                        textAnchor="end"
                        fontWeight={isInvolved ? 'bold' : 'normal'}
                      >
                        n={level.n}
                      </text>
                      <text
                        x={ENERGY_W - 26}
                        y={y + 4}
                        fill={isInvolved ? '#a78bfa' : '#9ca3af'}
                        fontSize="8"
                        textAnchor="start"
                      >
                        {level.energy.toFixed(2)} eV
                      </text>
                    </g>
                  );
                })}

                {/* All transition arrows (background, semi-transparent) */}
                {selectedElement.transitions.map((t, idx) => {
                  const isActive = activeTransition
                    && t.wavelength === activeTransition.wavelength
                    && t.from === activeTransition.from
                    && t.to === activeTransition.to;
                  if (isActive) return null;

                  const fromLevel = selectedElement.energyLevels.find(l => l.n === t.from);
                  const toLevel = selectedElement.energyLevels.find(l => l.n === t.to);
                  if (!fromLevel || !toLevel) return null;

                  const yFrom = levelY(fromLevel.energy);
                  const yTo = levelY(toLevel.energy);
                  const color = wavelengthToColor(t.wavelength);
                  const isEmission = mode === 'emission';

                  const total = selectedElement.transitions.length;
                  const arrowX = total === 1
                    ? ENERGY_W / 2
                    : 80 + (idx / (total - 1)) * (ENERGY_W - 160);

                  const startY = isEmission ? yFrom : yTo;
                  const endY = isEmission ? yTo : yFrom;
                  const dir = endY > startY ? 1 : -1;

                  return (
                    <g key={`bg-${idx}`} opacity={0.3}>
                      <line x1={arrowX} y1={startY} x2={arrowX} y2={endY - dir * 2} stroke={color} strokeWidth={1.2} />
                      <polygon
                        points={`${arrowX},${endY} ${arrowX - 2},${endY - dir * 4} ${arrowX + 2},${endY - dir * 4}`}
                        fill={color}
                      />
                    </g>
                  );
                })}

                {/* Active transition arrow (highlighted, on top) */}
                {activeTransition && (() => {
                  const idx = selectedElement.transitions.findIndex(
                    t => t.wavelength === activeTransition.wavelength
                      && t.from === activeTransition.from
                      && t.to === activeTransition.to
                  );
                  if (idx === -1) return null;

                  const fromLevel = selectedElement.energyLevels.find(l => l.n === activeTransition.from);
                  const toLevel = selectedElement.energyLevels.find(l => l.n === activeTransition.to);
                  if (!fromLevel || !toLevel) return null;

                  const yFrom = levelY(fromLevel.energy);
                  const yTo = levelY(toLevel.energy);
                  const color = wavelengthToColor(activeTransition.wavelength);
                  const isEmission = mode === 'emission';

                  const total = selectedElement.transitions.length;
                  const arrowX = total === 1
                    ? ENERGY_W / 2
                    : 80 + (idx / (total - 1)) * (ENERGY_W - 160);

                  const startY = isEmission ? yFrom : yTo;
                  const endY = isEmission ? yTo : yFrom;
                  const dir = endY > startY ? 1 : -1;

                  return (
                    <g>
                      <line x1={arrowX} y1={startY} x2={arrowX} y2={endY - dir * 3} stroke={color} strokeWidth={3} />
                      <polygon
                        points={`${arrowX},${endY} ${arrowX - 3.5},${endY - dir * 7} ${arrowX + 3.5},${endY - dir * 7}`}
                        fill={color}
                      />
                      {/* Photon symbol */}
                      <text
                        x={arrowX + 16}
                        y={(yFrom + yTo) / 2 + 1}
                        fill={color}
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="start"
                      >
                        {isEmission ? '\u03B3 \u2192' : '\u03B3 \u2190'}
                      </text>
                      {/* Wavelength label */}
                      <text
                        x={arrowX + 16}
                        y={(yFrom + yTo) / 2 + 14}
                        fill="#a78bfa"
                        fontSize="9"
                        textAnchor="start"
                      >
                        {activeTransition.wavelength} nm
                      </text>
                      {/* Energy difference */}
                      <text
                        x={arrowX - 10}
                        y={(yFrom + yTo) / 2 + 4}
                        fill="#9ca3af"
                        fontSize="8"
                        textAnchor="end"
                      >
                        {'\u0394'}E = {Math.abs(fromLevel.energy - toLevel.energy).toFixed(2)} eV
                      </text>
                    </g>
                  );
                })()}

                {/* Legend */}
                <text x={ENERGY_W / 2} y={ENERGY_H - 4} fill="#9ca3af" fontSize="8" textAnchor="middle">
                  {activeTransition
                    ? `${mode === 'emission' ? 'Photon emitted' : 'Photon absorbed'}: n=${activeTransition.from} ${mode === 'emission' ? '\u2192' : '\u2190'} n=${activeTransition.to}`
                    : 'Hover or click a spectral line to see the transition'}
                </text>
              </svg>
            </div>
          </div>
        </div>

        {/* Right Info Panel */}
        <div className="w-72 flex flex-col gap-2 flex-shrink-0 overflow-y-auto">

          {/* Element Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3">
            <h4 className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
              <Info className="h-3 w-3 text-purple-600 dark:text-purple-400" />
              Element Information
            </h4>
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
                {selectedElement.symbol}
              </div>
              <div>
                <div className="text-sm font-bold text-gray-800 dark:text-white">{selectedElement.name}</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400">Atomic Number: {selectedElement.atomicNumber}</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">{selectedElement.electronConfig}</div>
              </div>
            </div>
            <p className="text-[10px] text-gray-600 dark:text-gray-300 leading-relaxed">{selectedElement.description}</p>
          </div>

          {/* Spectral Lines List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3">
            <h4 className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Spectral Lines
            </h4>
            <div className="space-y-1">
              {selectedElement.lines.map((line, i) => {
                const color = wavelengthToColor(line.wavelength);
                const isActive = activeLine?.wavelength === line.wavelength;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer transition-all ${
                      isActive
                        ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent'
                    }`}
                    onMouseEnter={() => setHoveredLine(line)}
                    onMouseLeave={() => setHoveredLine(null)}
                    onClick={() => setSelectedLine(line)}
                  >
                    <div
                      className="w-4 h-4 rounded-full border border-gray-200 dark:border-gray-600 shadow-sm flex-shrink-0"
                      style={{ backgroundColor: color, boxShadow: isActive ? `0 0 6px ${color}` : 'none' }}
                    />
                    <span className="text-[11px] font-mono text-gray-800 dark:text-white flex-1">
                      {line.wavelength} nm
                    </span>
                    {line.label && (
                      <span className="text-[9px] text-purple-600 dark:text-purple-400 font-medium">{line.label}</span>
                    )}
                    <div className="w-10 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${line.intensity * 100}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Transition Detail */}
          {activeTransition && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
              <h4 className="text-[10px] font-semibold text-purple-800 dark:text-purple-300 uppercase tracking-wider mb-1.5">
                Active Transition
              </h4>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Wavelength</span>
                  <span className="font-mono text-gray-800 dark:text-white">{activeTransition.wavelength} nm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Transition</span>
                  <span className="font-mono text-gray-800 dark:text-white">
                    n={activeTransition.from} {mode === 'emission' ? '\u2192' : '\u2190'} n={activeTransition.to}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Energy</span>
                  <span className="font-mono text-gray-800 dark:text-white">
                    {(() => {
                      const from = selectedElement.energyLevels.find(l => l.n === activeTransition.from);
                      const to = selectedElement.energyLevels.find(l => l.n === activeTransition.to);
                      return from && to ? `${Math.abs(from.energy - to.energy).toFixed(2)} eV` : '--';
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Frequency</span>
                  <span className="font-mono text-gray-800 dark:text-white">
                    {(300 / activeTransition.wavelength).toFixed(1)} THz
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Photon Energy</span>
                  <span className="font-mono text-gray-800 dark:text-white">
                    {(1240 / activeTransition.wavelength).toFixed(3)} eV
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Color</span>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: wavelengthToColor(activeTransition.wavelength) }}
                    />
                    <span className="font-mono text-gray-800 dark:text-white text-[10px]">
                      {wavelengthToColor(activeTransition.wavelength)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Key Concepts */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3">
            <h4 className="text-[10px] font-semibold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider mb-1.5">
              Key Concepts
            </h4>
            <div className="space-y-1.5 text-[10px] text-gray-600 dark:text-gray-300 leading-relaxed">
              <p>
                <span className="font-semibold text-gray-700 dark:text-gray-200">Electromagnetic Spectrum:</span> Light
                is electromagnetic radiation. The visible spectrum spans 380nm (violet) to 700nm (red).
              </p>
              <p>
                <span className="font-semibold text-gray-700 dark:text-gray-200">Quantized Energy Levels:</span> Electrons
                occupy discrete energy levels. Only specific energy transitions are allowed, producing specific wavelengths.
              </p>
              <p>
                <span className="font-semibold text-gray-700 dark:text-gray-200">Photon Emission:</span> When an electron
                falls from a higher to a lower energy level, it emits a photon with energy E = hf = hc/{'\u03BB'}.
              </p>
              <p>
                <span className="font-semibold text-gray-700 dark:text-gray-200">Photon Absorption:</span> An electron
                absorbs a photon of exactly the right energy to jump to a higher level, creating dark lines in the continuous spectrum.
              </p>
              <p>
                <span className="font-semibold text-gray-700 dark:text-gray-200">Bohr Model:</span> For hydrogen,
                E_n = -13.6/n{'\u00B2'} eV. The Balmer series (transitions to n=2) produces visible light.
              </p>
              <p>
                <span className="font-semibold text-gray-700 dark:text-gray-200">Spectral Fingerprints:</span> Each
                element has a unique emission/absorption spectrum, enabling identification in stars, gases, and unknown samples.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
