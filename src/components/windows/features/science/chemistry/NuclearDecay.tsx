import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Atom, Play, Pause, RotateCcw, Info, MousePointer2 } from 'lucide-react';

interface Isotope {
  name: string;
  symbol: string;
  massNumber: number;
  atomicNumber: number;
  halfLife: string;
  halfLifeValue: number;
  decayType: 'alpha' | 'beta' | 'gamma';
  daughter: string;
  daughterMass: number;
  daughterZ: number;
  daughterSymbol: string;
  use: string;
}

const isotopes: Isotope[] = [
  {
    name: 'Carbon-14',
    symbol: 'C',
    halfLife: '5,730 years',
    halfLifeValue: 5730,
    decayType: 'beta',
    daughter: 'Nitrogen-14',
    daughterMass: 14,
    daughterZ: 7,
    daughterSymbol: 'N',
    use: 'Archaeological dating (radiocarbon dating)',
    massNumber: 14,
    atomicNumber: 6,
  },
  {
    name: 'Uranium-238',
    symbol: 'U',
    halfLife: '4.5 billion years',
    halfLifeValue: 4.5e9,
    decayType: 'alpha',
    daughter: 'Thorium-234',
    daughterMass: 234,
    daughterZ: 90,
    daughterSymbol: 'Th',
    use: 'Geological dating of rocks and minerals',
    massNumber: 238,
    atomicNumber: 92,
  },
  {
    name: 'Iodine-131',
    symbol: 'I',
    halfLife: '8 days',
    halfLifeValue: 8,
    decayType: 'beta',
    daughter: 'Xenon-131',
    daughterMass: 131,
    daughterZ: 54,
    daughterSymbol: 'Xe',
    use: 'Thyroid cancer treatment and diagnostics',
    massNumber: 131,
    atomicNumber: 53,
  },
  {
    name: 'Cobalt-60',
    symbol: 'Co',
    halfLife: '5.27 years',
    halfLifeValue: 5.27,
    decayType: 'gamma',
    daughter: 'Nickel-60',
    daughterMass: 60,
    daughterZ: 28,
    daughterSymbol: 'Ni',
    use: 'Radiation therapy and industrial radiography',
    massNumber: 60,
    atomicNumber: 27,
  },
  {
    name: 'Polonium-210',
    symbol: 'Po',
    halfLife: '138 days',
    halfLifeValue: 138,
    decayType: 'alpha',
    daughter: 'Lead-206',
    daughterMass: 206,
    daughterZ: 82,
    daughterSymbol: 'Pb',
    use: 'Alpha particle source, historical poison',
    massNumber: 210,
    atomicNumber: 84,
  },
];

const TOTAL_ATOMS = 100;
const GRID_COLS = 10;
const GRID_ROWS = 10;
const MAX_HALF_LIVES = 5;

function shuffleArray(length: number): number[] {
  const arr = Array.from({ length }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getDecayThresholds(order: number[]): number[] {
  const thresholds: number[] = new Array(order.length);
  for (let rank = 0; rank < order.length; rank++) {
    const atomIndex = order[rank];
    const fractionDecayed = (rank + 1) / TOTAL_ATOMS;
    const t = -Math.log(1 - fractionDecayed) / Math.LN2;
    thresholds[atomIndex] = t;
  }
  return thresholds;
}

const decayTypeInfo: Record<string, { particle: string; symbol: string; desc: string; color: string }> = {
  alpha: {
    particle: 'Helium-4 nucleus',
    symbol: '\u2074He\u00B2\u207A (\u03B1)',
    desc: 'Emits a helium-4 nucleus (2 protons + 2 neutrons). Mass number decreases by 4, atomic number by 2. Stopped by paper or skin.',
    color: '#ef4444',
  },
  beta: {
    particle: 'Electron (or positron)',
    symbol: 'e\u207B (\u03B2\u207B)',
    desc: 'A neutron converts to a proton, emitting an electron and antineutrino. Atomic number increases by 1, mass unchanged. Stopped by aluminum foil.',
    color: '#3b82f6',
  },
  gamma: {
    particle: 'High-energy photon',
    symbol: '\u03B3',
    desc: 'Nucleus releases excess energy as electromagnetic radiation. No change in mass or atomic number. Requires lead or concrete shielding.',
    color: '#a855f7',
  },
};

export const NuclearDecay: React.FC = () => {
  const [selectedIsotope, setSelectedIsotope] = useState<Isotope>(isotopes[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedHalfLives, setElapsedHalfLives] = useState(0);
  const [speed, setSpeed] = useState(1);
  const decayOrderRef = useRef<number[]>(shuffleArray(TOTAL_ATOMS));
  const thresholdsRef = useRef<number[]>(getDecayThresholds(decayOrderRef.current));
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const [recentlyDecayed, setRecentlyDecayed] = useState<Set<number>>(new Set());
  const [hoverHL, setHoverHL] = useState<number | null>(null);
  const graphSvgRef = useRef<SVGSVGElement>(null);

  const atomsRemaining = thresholdsRef.current.filter((t) => elapsedHalfLives < t).length;
  const atomsDecayed = TOTAL_ATOMS - atomsRemaining;
  const percentRemaining = (atomsRemaining / TOTAL_ATOMS) * 100;
  const theoreticalPercent = 100 * Math.pow(0.5, elapsedHalfLives);
  const activity = theoreticalPercent / 100;

  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    lastTimeRef.current = performance.now();

    const animate = (now: number) => {
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      setElapsedHalfLives((prev) => {
        const next = prev + dt * 0.3 * speed;
        if (next >= MAX_HALF_LIVES) {
          setIsPlaying(false);
          return MAX_HALF_LIVES;
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isPlaying, speed]);

  useEffect(() => {
    const newDecayed = new Set<number>();
    thresholdsRef.current.forEach((t, i) => {
      if (elapsedHalfLives >= t && elapsedHalfLives - 0.15 < t) {
        newDecayed.add(i);
      }
    });
    if (newDecayed.size > 0) {
      setRecentlyDecayed(newDecayed);
      const timeout = setTimeout(() => setRecentlyDecayed(new Set()), 300);
      return () => clearTimeout(timeout);
    }
  }, [elapsedHalfLives]);

  const reset = () => {
    setIsPlaying(false);
    setElapsedHalfLives(0);
    decayOrderRef.current = shuffleArray(TOTAL_ATOMS);
    thresholdsRef.current = getDecayThresholds(decayOrderRef.current);
    setRecentlyDecayed(new Set());
  };

  const selectIsotope = (iso: Isotope) => {
    setSelectedIsotope(iso);
    reset();
  };

  // Interactive graph mouse handlers
  const handleGraphMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = graphSvgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = GRAPH_W / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const hl = ((mouseX - GRAPH_PAD.left) / plotW) * MAX_HALF_LIVES;
    if (hl >= 0 && hl <= MAX_HALF_LIVES) {
      setHoverHL(Math.max(0, Math.min(MAX_HALF_LIVES, hl)));
    } else {
      setHoverHL(null);
    }
  }, []);

  const handleGraphClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = graphSvgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = GRAPH_W / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const hl = ((mouseX - GRAPH_PAD.left) / plotW) * MAX_HALF_LIVES;
    if (hl >= 0 && hl <= MAX_HALF_LIVES) {
      setIsPlaying(false);
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      setElapsedHalfLives(Math.max(0, Math.min(MAX_HALF_LIVES, hl)));
    }
  }, []);

  const handleGraphMouseLeave = useCallback(() => {
    setHoverHL(null);
  }, []);

  // Hover-derived values
  const displayHL = hoverHL ?? elapsedHalfLives;
  const displayPercent = 100 * Math.pow(0.5, displayHL);
  const displayAtoms = thresholdsRef.current.filter((t) => displayHL < t).length;
  const displayDecayed = TOTAL_ATOMS - displayAtoms;
  const displayActivity = displayPercent / 100;

  const ATOM_SVG_W = 560;
  const ATOM_SVG_H = 320;
  const CELL_W = ATOM_SVG_W / GRID_COLS;
  const CELL_H = ATOM_SVG_H / GRID_ROWS;
  const ATOM_R = Math.min(CELL_W, CELL_H) * 0.35;

  const GRAPH_W = 560;
  const GRAPH_H = 280;
  const GRAPH_PAD = { top: 20, right: 20, bottom: 35, left: 50 };
  const plotW = GRAPH_W - GRAPH_PAD.left - GRAPH_PAD.right;
  const plotH = GRAPH_H - GRAPH_PAD.top - GRAPH_PAD.bottom;
  const toGX = (hl: number) => GRAPH_PAD.left + (hl / MAX_HALF_LIVES) * plotW;
  const toGY = (pct: number) => GRAPH_PAD.top + ((100 - pct) / 100) * plotH;

  const curvePoints: string[] = [];
  for (let i = 0; i <= 200; i++) {
    const hl = (i / 200) * MAX_HALF_LIVES;
    const pct = 100 * Math.pow(0.5, hl);
    curvePoints.push(`${i === 0 ? 'M' : 'L'} ${toGX(hl).toFixed(2)},${toGY(pct).toFixed(2)}`);
  }
  const curvePath = curvePoints.join(' ');

  const halfLifeMarkers = [1, 2, 3, 4, 5];
  const percentMarkers = [
    { pct: 50, label: '50%' },
    { pct: 25, label: '25%' },
    { pct: 12.5, label: '12.5%' },
    { pct: 6.25, label: '6.25%' },
    { pct: 3.125, label: '3.1%' },
  ];

  const currentDecayInfo = decayTypeInfo[selectedIsotope.decayType];

  // Render isotope notation with proper superscript/subscript
  const IsotopeNotation = ({ mass, z, sym, className = '' }: { mass: number; z: number; sym: string; className?: string }) => (
    <span className={`inline-flex items-baseline font-mono ${className}`}>
      <span className="flex flex-col items-end text-[8px] leading-[1.1] mr-px">
        <span>{mass}</span>
        <span>{z}</span>
      </span>
      <span className="font-bold">{sym}</span>
    </span>
  );

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 p-3 overflow-hidden">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Atom className="h-5 w-5 text-red-600 dark:text-red-400" />
            Nuclear Decay &amp; Half-Life Visualizer
          </h2>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <IsotopeNotation mass={selectedIsotope.massNumber} z={selectedIsotope.atomicNumber} sym={selectedIsotope.symbol} />
            <span>&mdash; t&frac12; = {selectedIsotope.halfLife} &mdash; {selectedIsotope.decayType} decay</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <span className="text-lg font-bold font-mono text-gray-800 dark:text-white">{atomsRemaining}</span>
            <span className="text-[10px] text-gray-400">remaining</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <span className="text-sm font-bold font-mono text-gray-800 dark:text-white">{elapsedHalfLives.toFixed(2)}</span>
            <span className="text-[10px] text-gray-400">half-lives</span>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex gap-3 min-h-0">
        {/* Left side: visualizations + controls */}
        <div className="flex-1 flex flex-col gap-2.5 min-w-0 min-h-0">
          {/* Atom grid visualization */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2.5 flex flex-col" style={{ flex: '1 1 0', minHeight: 0 }}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Atom className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                <span className="text-xs font-semibold text-gray-800 dark:text-white">Radioactive Sample</span>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-400 border border-green-500" />
                  <span className="text-gray-500 dark:text-gray-400">Undecayed ({atomsRemaining})</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-400 border border-gray-500" />
                  <span className="text-gray-500 dark:text-gray-400">Decayed ({atomsDecayed})</span>
                </span>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <svg className="w-full h-full" viewBox={`0 0 ${ATOM_SVG_W} ${ATOM_SVG_H}`} preserveAspectRatio="xMidYMid meet">
                <defs>
                  <radialGradient id="activeAtom" cx="40%" cy="35%" r="60%">
                    <stop offset="0%" stopColor="#86efac" />
                    <stop offset="70%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#15803d" />
                  </radialGradient>
                  <radialGradient id="decayedAtom" cx="40%" cy="35%" r="60%">
                    <stop offset="0%" stopColor="#9ca3af" />
                    <stop offset="70%" stopColor="#6b7280" />
                    <stop offset="100%" stopColor="#4b5563" />
                  </radialGradient>
                  <filter id="flash" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
                  </filter>
                </defs>
                <rect x="0" y="0" width={ATOM_SVG_W} height={ATOM_SVG_H} rx="8" fill="none" stroke="#e5e7eb" strokeWidth="1" className="dark:opacity-20" />
                {Array.from({ length: TOTAL_ATOMS }, (_, i) => {
                  const row = Math.floor(i / GRID_COLS);
                  const col = i % GRID_COLS;
                  const cx = col * CELL_W + CELL_W / 2;
                  const cy = row * CELL_H + CELL_H / 2;
                  const isDecayed = elapsedHalfLives >= thresholdsRef.current[i];
                  const isFlashing = recentlyDecayed.has(i);

                  return (
                    <g key={i}>
                      {isFlashing && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={ATOM_R * 1.8}
                          fill={currentDecayInfo.color}
                          opacity="0.6"
                          filter="url(#flash)"
                        >
                          <animate
                            attributeName="opacity"
                            values="0.8;0"
                            dur="0.4s"
                            fill="freeze"
                          />
                          <animate
                            attributeName="r"
                            values={`${ATOM_R * 1.2};${ATOM_R * 2.2}`}
                            dur="0.4s"
                            fill="freeze"
                          />
                        </circle>
                      )}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={ATOM_R}
                        fill={isDecayed ? 'url(#decayedAtom)' : 'url(#activeAtom)'}
                        stroke={isDecayed ? '#4b5563' : '#15803d'}
                        strokeWidth="0.8"
                        opacity={isDecayed ? 0.6 : 1}
                      />
                      {!isDecayed && (
                        <circle
                          cx={cx - ATOM_R * 0.2}
                          cy={cy - ATOM_R * 0.25}
                          r={ATOM_R * 0.18}
                          fill="rgba(255,255,255,0.4)"
                        />
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Decay curve graph */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2.5 flex flex-col" style={{ flex: '1 1 0', minHeight: 0 }}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                <span className="text-xs font-semibold text-gray-800 dark:text-white">Decay Curve &mdash; N(t) = N&#8320; &times; (&frac12;)^(t/t&frac12;)</span>
              </div>
              <span className="text-[9px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                <MousePointer2 className="h-3 w-3" /> Click to seek &bull; Hover to inspect
              </span>
            </div>
            <div className="flex-1 min-h-0">
              <svg ref={graphSvgRef} className="w-full h-full cursor-pointer" viewBox={`0 0 ${GRAPH_W} ${GRAPH_H}`} preserveAspectRatio="xMidYMid meet"
                onMouseMove={handleGraphMouseMove} onMouseLeave={handleGraphMouseLeave} onClick={handleGraphClick}>
                {/* Background grid */}
                <rect x={GRAPH_PAD.left} y={GRAPH_PAD.top} width={plotW} height={plotH} fill="none" stroke="#e5e7eb" strokeWidth="0.5" className="dark:opacity-20" />

                {/* Horizontal dashed lines at decay percentages */}
                {percentMarkers.map((m) => (
                  <g key={m.pct}>
                    <line
                      x1={GRAPH_PAD.left}
                      y1={toGY(m.pct)}
                      x2={GRAPH_PAD.left + plotW}
                      y2={toGY(m.pct)}
                      stroke="#f97316"
                      strokeWidth="0.6"
                      strokeDasharray="4,3"
                      opacity="0.4"
                    />
                    <text
                      x={GRAPH_PAD.left - 4}
                      y={toGY(m.pct) + 3}
                      fill="#9ca3af"
                      fontSize="9"
                      textAnchor="end"
                    >
                      {m.label}
                    </text>
                  </g>
                ))}

                {/* Y axis labels (0, 100) */}
                <text x={GRAPH_PAD.left - 4} y={toGY(100) + 4} fill="#6b7280" fontSize="10" textAnchor="end">100%</text>
                <text x={GRAPH_PAD.left - 4} y={toGY(0) + 3} fill="#6b7280" fontSize="10" textAnchor="end">0%</text>

                {/* Vertical dashed lines at each half-life */}
                {halfLifeMarkers.map((hl) => (
                  <g key={hl}>
                    <line
                      x1={toGX(hl)}
                      y1={GRAPH_PAD.top}
                      x2={toGX(hl)}
                      y2={GRAPH_PAD.top + plotH}
                      stroke="#ef4444"
                      strokeWidth="0.6"
                      strokeDasharray="4,3"
                      opacity="0.4"
                    />
                    <text
                      x={toGX(hl)}
                      y={GRAPH_PAD.top + plotH + 14}
                      fill="#6b7280"
                      fontSize="10"
                      textAnchor="middle"
                    >
                      {hl}
                    </text>
                    <text
                      x={toGX(hl)}
                      y={GRAPH_PAD.top - 5}
                      fill="#ef4444"
                      fontSize="8"
                      textAnchor="middle"
                      opacity="0.7"
                    >
                      {(100 * Math.pow(0.5, hl)).toFixed(1)}%
                    </text>
                  </g>
                ))}

                {/* X axis at 0 */}
                <text x={toGX(0)} y={GRAPH_PAD.top + plotH + 14} fill="#6b7280" fontSize="10" textAnchor="middle">0</text>

                {/* Axis labels */}
                <text x={GRAPH_PAD.left + plotW / 2} y={GRAPH_H - 4} fill="#9ca3af" fontSize="10" textAnchor="middle">
                  Time (half-lives)
                </text>
                <text
                  x={12}
                  y={GRAPH_PAD.top + plotH / 2}
                  fill="#9ca3af"
                  fontSize="10"
                  textAnchor="middle"
                  transform={`rotate(-90, 12, ${GRAPH_PAD.top + plotH / 2})`}
                >
                  % Remaining
                </text>

                {/* Filled area under curve */}
                <path
                  d={`${curvePath} L ${toGX(MAX_HALF_LIVES)},${toGY(0)} L ${toGX(0)},${toGY(0)} Z`}
                  fill="url(#decayGradient)"
                  opacity="0.15"
                />
                <defs>
                  <linearGradient id="decayGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Decay curve */}
                <path
                  d={curvePath}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Current time position marker */}
                {elapsedHalfLives <= MAX_HALF_LIVES && (
                  <g>
                    <line
                      x1={toGX(elapsedHalfLives)}
                      y1={GRAPH_PAD.top}
                      x2={toGX(elapsedHalfLives)}
                      y2={toGY(0)}
                      stroke="#f97316"
                      strokeWidth="1"
                      strokeDasharray="3,2"
                      opacity="0.6"
                    />
                    <circle
                      cx={toGX(elapsedHalfLives)}
                      cy={toGY(theoreticalPercent)}
                      r="5"
                      fill="#f97316"
                      stroke="#fff"
                      strokeWidth="2"
                    />
                    <rect
                      x={toGX(elapsedHalfLives) - 22}
                      y={toGY(theoreticalPercent) - 20}
                      width="44"
                      height="14"
                      rx="3"
                      fill="white"
                      stroke="#d1d5db"
                      strokeWidth="0.5"
                      opacity="0.9"
                    />
                    <text
                      x={toGX(elapsedHalfLives)}
                      y={toGY(theoreticalPercent) - 10}
                      fill="#374151"
                      fontSize="9"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {theoreticalPercent.toFixed(1)}%
                    </text>
                  </g>
                )}

                {/* Hover crosshair and tooltip */}
                {hoverHL !== null && (() => {
                  const hPct = 100 * Math.pow(0.5, hoverHL);
                  const hx = toGX(hoverHL);
                  const hy = toGY(hPct);
                  const tooltipW = 130;
                  const flipLeft = hx + tooltipW + 15 > GRAPH_W - GRAPH_PAD.right;
                  const tx = flipLeft ? hx - tooltipW - 10 : hx + 10;
                  const ty = Math.max(GRAPH_PAD.top + 5, Math.min(hy - 22, GRAPH_H - GRAPH_PAD.bottom - 50));
                  return (
                    <g>
                      {/* Vertical crosshair */}
                      <line x1={hx} y1={GRAPH_PAD.top} x2={hx} y2={toGY(0)}
                        stroke="#9ca3af" strokeWidth="0.8" strokeDasharray="3,2" />
                      {/* Horizontal crosshair */}
                      <line x1={GRAPH_PAD.left} y1={hy} x2={hx} y2={hy}
                        stroke="#9ca3af" strokeWidth="0.8" strokeDasharray="3,2" />
                      {/* Point on curve */}
                      <circle cx={hx} cy={hy} r="4.5" fill="#6366f1" stroke="white" strokeWidth="2" />
                      {/* Tooltip background */}
                      <rect x={tx} y={ty} width={tooltipW} height="42" rx="4"
                        fill="white" stroke="#d1d5db" strokeWidth="0.8" opacity="0.95" />
                      {/* Tooltip text */}
                      <text x={tx + 6} y={ty + 13} fill="#374151" fontSize="9" fontWeight="bold">
                        t = {hoverHL.toFixed(2)} half-lives
                      </text>
                      <text x={tx + 6} y={ty + 24} fill="#6b7280" fontSize="8">
                        Remaining: {hPct.toFixed(1)}% ({Math.round(TOTAL_ATOMS * hPct / 100)}/{TOTAL_ATOMS})
                      </text>
                      <text x={tx + 6} y={ty + 35} fill="#6b7280" fontSize="8">
                        Time: {(hoverHL * selectedIsotope.halfLife).toFixed(2)} {selectedIsotope.unit} &bull; Click to seek
                      </text>
                    </g>
                  );
                })()}

                {/* Axes */}
                <line x1={GRAPH_PAD.left} y1={GRAPH_PAD.top} x2={GRAPH_PAD.left} y2={GRAPH_PAD.top + plotH} stroke="#6b7280" strokeWidth="1" />
                <line x1={GRAPH_PAD.left} y1={GRAPH_PAD.top + plotH} x2={GRAPH_PAD.left + plotW} y2={GRAPH_PAD.top + plotH} stroke="#6b7280" strokeWidth="1" />
              </svg>
            </div>
          </div>

          {/* Controls row */}
          <div className="flex gap-2.5" style={{ flex: '0 0 auto' }}>
            {/* Isotope selector */}
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-md p-2.5">
              <h4 className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <Atom className="h-3 w-3 text-red-600 dark:text-red-400" /> Select Isotope
              </h4>
              <div className="flex flex-wrap gap-1">
                {isotopes.map((iso) => (
                  <button
                    key={iso.name}
                    onClick={() => selectIsotope(iso)}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                      selectedIsotope.name === iso.name
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700 shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-transparent hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {iso.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Animation controls */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2.5 flex flex-col justify-between" style={{ width: 200 }}>
              <h4 className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Controls</h4>
              <div className="flex gap-1.5 mb-1.5">
                <button
                  onClick={() => setIsPlaying((p) => !p)}
                  disabled={elapsedHalfLives >= MAX_HALF_LIVES}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all text-white shadow-sm ${
                    isPlaying
                      ? 'bg-amber-500 hover:bg-amber-600'
                      : 'bg-red-600 hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:text-gray-500'
                  }`}
                >
                  {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
                <button
                  onClick={reset}
                  className="py-1.5 px-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs rounded-lg transition-all shadow-sm"
                  title="Reset"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-500 dark:text-gray-400">Speed</span>
                {[0.5, 1, 2].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`flex-1 text-[11px] py-0.5 rounded-md font-medium transition-all ${
                      speed === s
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700 shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-transparent hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right side: Info Panel */}
        <div className="w-80 flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          {/* Current isotope info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2.5">
            <h4 className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
              <Atom className="h-3 w-3 text-red-600 dark:text-red-400" /> Isotope Information
            </h4>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Name</span>
                <span className="font-semibold text-gray-800 dark:text-white">{selectedIsotope.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Symbol</span>
                <IsotopeNotation mass={selectedIsotope.massNumber} z={selectedIsotope.atomicNumber} sym={selectedIsotope.symbol} className="text-gray-800 dark:text-white" />
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Half-life</span>
                <span className="font-mono text-red-600 dark:text-red-400">{selectedIsotope.halfLife}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Decay type</span>
                <span className="font-semibold" style={{ color: currentDecayInfo.color }}>
                  {selectedIsotope.decayType.charAt(0).toUpperCase() + selectedIsotope.decayType.slice(1)} ({currentDecayInfo.symbol.split(' ')[0]})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">Daughter product</span>
                <span className="flex items-center gap-1">
                  <IsotopeNotation mass={selectedIsotope.daughterMass} z={selectedIsotope.daughterZ} sym={selectedIsotope.daughterSymbol} className="text-gray-800 dark:text-white text-[10px]" />
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Mass number</span>
                <span className="font-mono text-gray-800 dark:text-white">{selectedIsotope.massNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Atomic number</span>
                <span className="font-mono text-gray-800 dark:text-white">{selectedIsotope.atomicNumber}</span>
              </div>
              <div className="pt-1 border-t border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Application:</span>
                <p className="text-gray-700 dark:text-gray-300 mt-0.5">{selectedIsotope.use}</p>
              </div>
            </div>
          </div>

          {/* Current statistics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2.5">
            <h4 className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
              {hoverHL !== null ? 'Inspecting' : 'Live Statistics'}
              {hoverHL !== null && <span className="text-[9px] font-normal text-indigo-500 dark:text-indigo-400">(hover)</span>}
            </h4>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Atoms remaining</span>
                <span className="font-mono font-bold text-green-600 dark:text-green-400">{displayAtoms}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Atoms decayed</span>
                <span className="font-mono font-bold text-gray-600 dark:text-gray-400">{displayDecayed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">% remaining</span>
                <span className="font-mono text-gray-800 dark:text-white">{displayPercent.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Elapsed half-lives</span>
                <span className="font-mono text-red-600 dark:text-red-400">{displayHL.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Elapsed time</span>
                <span className="font-mono text-orange-600 dark:text-orange-400">{(displayHL * selectedIsotope.halfLife).toFixed(2)} {selectedIsotope.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Relative activity</span>
                <span className="font-mono text-orange-600 dark:text-orange-400">{(displayActivity * 100).toFixed(1)}%</span>
              </div>
              <div className="pt-1">
                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-200"
                    style={{
                      width: `${displayPercent}%`,
                      background: `linear-gradient(90deg, #22c55e, #eab308 50%, #ef4444)`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Decay type explanation */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2.5">
            <h4 className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Decay Types</h4>
            <div className="space-y-1.5">
              {Object.entries(decayTypeInfo).map(([type, info]) => (
                <div
                  key={type}
                  className={`p-1.5 rounded-md border text-[10px] transition-all ${
                    selectedIsotope.decayType === type
                      ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ backgroundColor: info.color }}
                    />
                    <span className="font-semibold text-gray-700 dark:text-gray-300 capitalize">
                      {type} &mdash; {info.symbol}
                    </span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                    {info.particle}. {info.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Key concepts */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-red-800 dark:text-red-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Info className="h-3 w-3" /> Key Concepts
            </h4>
            <div className="space-y-1.5 text-[10px] text-gray-600 dark:text-gray-300 leading-relaxed">
              <p>
                <span className="font-semibold text-gray-700 dark:text-gray-200">Half-life:</span> The time required for exactly half of the radioactive atoms in a sample to undergo decay. It is a constant property of each isotope, unaffected by temperature, pressure, or chemical state.
              </p>
              <p>
                <span className="font-semibold text-gray-700 dark:text-gray-200">Exponential decay:</span> N(t) = N&#8320; &times; (&frac12;)^(t/t&frac12;). The number of undecayed atoms decreases exponentially. After each half-life, half of the remaining atoms have decayed.
              </p>
              <p>
                <span className="font-semibold text-gray-700 dark:text-gray-200">Radioactive dating:</span> By measuring the ratio of parent to daughter isotopes, scientists can determine the age of archaeological artifacts (C-14) or geological formations (U-238).
              </p>
              <p>
                <span className="font-semibold text-gray-700 dark:text-gray-200">Decay chains:</span> Some isotopes decay through a series of intermediate steps before reaching a stable daughter nucleus. U-238 undergoes 14 decay steps before becoming stable Pb-206.
              </p>
              <p>
                <span className="font-semibold text-gray-700 dark:text-gray-200">Nuclear stability:</span> Nuclei with too many or too few neutrons relative to protons are unstable. The band of stability describes the neutron-to-proton ratios that produce stable nuclei.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
