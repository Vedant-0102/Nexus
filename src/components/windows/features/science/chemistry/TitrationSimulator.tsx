import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Beaker, Droplet, TrendingUp, RotateCcw, Info, Play, Pause, FlaskConical, Gauge, TestTubes, BookOpen } from 'lucide-react';

interface AcidOption {
  name: string;
  formula: string;
  pKa: number;
  pKa2?: number;
  isStrong: boolean;
  color: string;
  concentration: number;
  reaction: string;
  netIonic: string;
  salt: string;
  eqNote: string;
}

interface IndicatorOption {
  name: string;
  lowColor: string;
  highColor: string;
  transitionLow: number;
  transitionHigh: number;
}

// All pKa values from NIST Standard Reference Database (25 C, I=0)
// Indicator ranges from CRC Handbook of Chemistry and Physics
const acids: AcidOption[] = [
  {
    name: 'Hydrochloric Acid', formula: 'HCl', pKa: -6.3, isStrong: true, color: '#ef4444', concentration: 0.1,
    reaction: 'HCl(aq) + NaOH(aq) \u2192 NaCl(aq) + H\u2082O(l)',
    netIonic: 'H\u207A(aq) + OH\u207B(aq) \u2192 H\u2082O(l)',
    salt: 'NaCl (neutral salt, pH = 7.00)',
    eqNote: 'Strong acid + strong base: sharp vertical jump at equivalence. Phenolphthalein or any indicator with range near pH 7 works.',
  },
  {
    name: 'Acetic Acid', formula: 'CH\u2083COOH', pKa: 4.756, isStrong: false, color: '#f97316', concentration: 0.1,
    reaction: 'CH\u2083COOH(aq) + NaOH(aq) \u2192 CH\u2083COONa(aq) + H\u2082O(l)',
    netIonic: 'CH\u2083COOH(aq) + OH\u207B(aq) \u2192 CH\u2083COO\u207B(aq) + H\u2082O(l)',
    salt: 'CH\u2083COONa (basic salt \u2014 conjugate base hydrolyzes)',
    eqNote: 'Weak acid + strong base: eq. pt. pH > 7. Use phenolphthalein (8.2\u201310.0). Buffer region follows Henderson-Hasselbalch.',
  },
  {
    name: 'Phosphoric Acid', formula: 'H\u2083PO\u2084', pKa: 2.148, pKa2: 7.199, isStrong: false, color: '#eab308', concentration: 0.1,
    reaction: 'H\u2083PO\u2084(aq) + NaOH(aq) \u2192 NaH\u2082PO\u2084(aq) + H\u2082O(l)',
    netIonic: 'H\u2083PO\u2084(aq) + OH\u207B(aq) \u2192 H\u2082PO\u2084\u207B(aq) + H\u2082O(l)',
    salt: 'NaH\u2082PO\u2084 (amphiprotic \u2014 can act as acid or base)',
    eqNote: 'Polyprotic acid: first eq. pt. pH = \u00BD(pKa\u2081 + pKa\u2082). Methyl orange works for first endpoint detection.',
  },
];

const indicators: IndicatorOption[] = [
  { name: 'Phenolphthalein', lowColor: 'rgba(255,255,255,0)', highColor: 'rgba(236,72,153,0.7)', transitionLow: 8.2, transitionHigh: 10.0 },
  { name: 'Methyl Orange', lowColor: 'rgba(239,68,68,0.6)', highColor: 'rgba(250,204,21,0.5)', transitionLow: 3.1, transitionHigh: 4.4 },
  { name: 'Bromothymol Blue', lowColor: 'rgba(250,204,21,0.5)', highColor: 'rgba(59,130,246,0.6)', transitionLow: 6.0, transitionHigh: 7.6 },
  { name: 'Universal', lowColor: 'rgba(239,68,68,0.6)', highColor: 'rgba(99,102,241,0.6)', transitionLow: 1, transitionHigh: 13 },
];

const V_ACID = 25;
const C_ACID = 0.1;
const C_BASE = 0.1;
const N_ACID = C_ACID * V_ACID;
const EQUIVALENCE_VOLUME = N_ACID / C_BASE;
const MAX_VOLUME = 50;

function calculatePH(vBase: number, acid: AcidOption): number {
  const eq = EQUIVALENCE_VOLUME;
  const nAcid = N_ACID;
  const nBase = C_BASE * vBase;
  const vTotal = V_ACID + vBase;

  if (acid.isStrong) {
    if (vBase <= 0) return -Math.log10(C_ACID);
    if (Math.abs(vBase - eq) < 0.05) return 7.0;
    if (vBase < eq) {
      const hConc = (nAcid - nBase) / vTotal;
      return -Math.log10(Math.max(hConc, 1e-14));
    } else {
      const ohConc = (nBase - nAcid) / vTotal;
      return 14 + Math.log10(Math.max(ohConc, 1e-14));
    }
  } else {
    const { pKa } = acid;
    if (vBase <= 0) return 0.5 * (pKa - Math.log10(C_ACID));
    if (Math.abs(vBase - eq) < 0.05) {
      if (acid.pKa2 !== undefined) return 0.5 * (pKa + acid.pKa2);
      const cSalt = nAcid / vTotal;
      return 7 + 0.5 * (pKa + Math.log10(cSalt));
    }
    if (vBase < eq) {
      const nConjugate = nBase;
      const nAcidRemaining = nAcid - nBase;
      if (nAcidRemaining < 0.001) {
        const cSalt = nAcid / vTotal;
        return acid.pKa2 !== undefined ? 0.5 * (pKa + acid.pKa2) : 7 + 0.5 * (pKa + Math.log10(cSalt));
      }
      if (nConjugate < 0.001) return 0.5 * (pKa - Math.log10(C_ACID));
      return pKa + Math.log10(nConjugate / nAcidRemaining);
    } else {
      const ohConc = (nBase - nAcid) / vTotal;
      return Math.min(14 + Math.log10(Math.max(ohConc, 1e-14)), 14);
    }
  }
}

function getSolutionColor(pH: number, indicator: IndicatorOption): string {
  const { lowColor, highColor, transitionLow, transitionHigh } = indicator;
  if (pH <= transitionLow) return lowColor;
  if (pH >= transitionHigh) return highColor;
  const t = (pH - transitionLow) / (transitionHigh - transitionLow);
  const parseParts = (c: string) => { const m = c.match(/[\d.]+/g); return m ? m.map(Number) : [0, 0, 0, 0]; };
  const lo = parseParts(lowColor);
  const hi = parseParts(highColor);
  return `rgba(${Math.round(lo[0] + (hi[0] - lo[0]) * t)},${Math.round(lo[1] + (hi[1] - lo[1]) * t)},${Math.round(lo[2] + (hi[2] - lo[2]) * t)},${(lo[3] + (hi[3] - lo[3]) * t).toFixed(2)})`;
}

function getStep(volume: number, acid: AcidOption): { step: number; label: string; desc: string } {
  if (volume === 0) return { step: 1, label: 'Setup', desc: `Rinse burette with NaOH (${C_BASE} M). Pipette ${V_ACID}.00 mL of ${acid.formula} into Erlenmeyer flask. Add 2\u20133 drops of indicator.` };
  if (volume < EQUIVALENCE_VOLUME * 0.4) return { step: 2, label: 'Initial Addition', desc: acid.isStrong ? 'Excess H\u207A still present. pH rises slowly \u2014 you can add base at a moderate pace.' : 'Conjugate base forming. pH rises steadily following Henderson-Hasselbalch equation.' };
  if (volume < EQUIVALENCE_VOLUME * 0.9) return { step: 3, label: acid.isStrong ? 'Pre-Equivalence' : 'Buffer Region', desc: acid.isStrong ? 'Approaching equivalence. Slow down additions \u2014 pH will jump sharply within a few drops.' : `Buffer at maximum capacity near half-eq (${(EQUIVALENCE_VOLUME / 2).toFixed(1)} mL) where pH \u2248 pKa = ${acid.pKa.toFixed(2)}.` };
  if (volume < EQUIVALENCE_VOLUME * 1.1) return { step: 4, label: 'Equivalence Point', desc: `At ${EQUIVALENCE_VOLUME}.0 mL: moles acid = moles base. Watch the indicator color change. Record this volume.` };
  return { step: 5, label: 'Post-Equivalence', desc: 'Excess NaOH present. pH determined by [OH\u207B]. Stop adding base and record the endpoint.' };
}

export const TitrationSimulator: React.FC = () => {
  const [volume, setVolume] = useState(0);
  const [selectedAcid, setSelectedAcid] = useState(acids[0]);
  const [selectedIndicator, setSelectedIndicator] = useState(indicators[0]);
  const [isAutoDropping, setIsAutoDropping] = useState(false);
  const [dropSize, setDropSize] = useState(0.5);
  const [dropFalling, setDropFalling] = useState(false);
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; vol: number; pH: number } | null>(null);
  const autoDropRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const pH = calculatePH(volume, selectedAcid);
  const step = getStep(volume, selectedAcid);
  const solutionColor = getSolutionColor(pH, selectedIndicator);
  const halfEqVol = EQUIVALENCE_VOLUME / 2;

  const addDrop = useCallback(() => {
    setDropFalling(true);
    setTimeout(() => {
      setDropFalling(false);
      setVolume(v => Math.min(v + dropSize, MAX_VOLUME));
    }, 500);
  }, [dropSize]);

  useEffect(() => {
    if (isAutoDropping && volume < MAX_VOLUME) {
      autoDropRef.current = setInterval(() => {
        setDropFalling(true);
        setTimeout(() => {
          setDropFalling(false);
          setVolume(v => {
            const next = Math.min(v + dropSize, MAX_VOLUME);
            if (next >= MAX_VOLUME) setIsAutoDropping(false);
            return next;
          });
        }, 500);
      }, 800);
    }
    return () => { if (autoDropRef.current) clearInterval(autoDropRef.current); };
  }, [isAutoDropping, dropSize, volume]);

  const reset = () => { setVolume(0); setIsAutoDropping(false); };

  const curvePoints: { x: number; y: number }[] = [];
  for (let v = 0; v <= MAX_VOLUME; v += 0.25) curvePoints.push({ x: v, y: calculatePH(v, selectedAcid) });

  const buretteLevel = ((MAX_VOLUME - volume) / MAX_VOLUME) * 100;
  const beakerFillPercent = 30 + (volume / MAX_VOLUME) * 50;

  const CHART_H = 64;
  const CHART_W = 100;
  const toSvgX = (v: number) => (v / MAX_VOLUME) * CHART_W;
  const toSvgY = (p: number) => CHART_H - (p / 14) * CHART_H;

  const handleSvgMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * 122 - 10;
    const svgY = ((e.clientY - rect.top) / rect.height) * 78 - 6;
    const vol = (svgX / CHART_W) * MAX_VOLUME;
    if (vol < 0 || vol > MAX_VOLUME || svgY < 0 || svgY > CHART_H) { setHoverInfo(null); return; }
    const hpH = calculatePH(vol, selectedAcid);
    setHoverInfo({ x: svgX, y: toSvgY(hpH), vol, pH: hpH });
  }, [selectedAcid]);

  const handleSvgClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * 122 - 10;
    const vol = Math.max(0, Math.min(MAX_VOLUME, (svgX / CHART_W) * MAX_VOLUME));
    setVolume(Math.round(vol * 4) / 4);
  }, []);

  const eqPH = calculatePH(EQUIVALENCE_VOLUME, selectedAcid);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-3 overflow-hidden">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-purple-600" />
            Acid-Base Titration
          </h2>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {C_ACID} M {selectedAcid.formula} ({V_ACID} mL) + {C_BASE} M NaOH &mdash; Step {step.step}/5: {step.label}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <Gauge className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
            <span className="text-lg font-bold font-mono text-gray-800 dark:text-white">{pH.toFixed(2)}</span>
            <span className="text-[10px] text-gray-400">pH</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <Droplet className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-bold font-mono text-gray-800 dark:text-white">{volume.toFixed(2)}</span>
            <span className="text-[10px] text-gray-400">mL</span>
          </div>
          <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 shadow-sm" style={{ backgroundColor: solutionColor }} title="Indicator color" />
        </div>
      </div>

      {/* Main 3-column layout */}
      <div className="flex-1 flex gap-3 min-h-0">

        {/* Column 1: Apparatus */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex flex-col items-center justify-between" style={{ width: 230 }}>
          {/* Burette */}
          <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mb-1">Burette &mdash; NaOH ({C_BASE} M)</div>
          <div className="relative w-10 flex-shrink-0" style={{ height: 120 }}>
            <div className="absolute inset-0 rounded-t border-2 border-gray-400 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0 bg-blue-400/50 dark:bg-blue-500/40 transition-all duration-500" style={{ height: `${buretteLevel}%` }} />
              {[0, 10, 20, 30, 40, 50].map(ml => {
                const pct = ((MAX_VOLUME - ml) / MAX_VOLUME) * 100;
                return (
                  <div key={ml} className="absolute left-0 w-2 border-t border-gray-400 dark:border-gray-500" style={{ bottom: `${pct}%` }}>
                    <span className="absolute -left-6 -top-1.5 text-[7px] text-gray-500 dark:text-gray-400">{ml}</span>
                  </div>
                );
              })}
            </div>
            {/* Stopcock */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-gray-500 dark:bg-gray-600 rounded-b-sm" />
            {/* Nozzle */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[2px] h-3 bg-gray-400 dark:bg-gray-500" />
          </div>

          {/* Drop animation area */}
          <div className="h-8 flex items-start justify-center relative w-full">
            {dropFalling && (
              <div
                className="absolute left-1/2 -translate-x-1/2 w-2.5 h-3 rounded-full bg-blue-400/80"
                style={{
                  animation: 'dropFall 0.5s ease-in forwards',
                }}
              />
            )}
            <style>{`
              @keyframes dropFall {
                0% { top: 0; opacity: 1; }
                80% { top: 24px; opacity: 1; }
                100% { top: 28px; opacity: 0; }
              }
            `}</style>
          </div>

          {/* Beaker */}
          <div className="relative" style={{ width: 140, height: 130 }}>
            <div className="absolute inset-0 border-[3px] border-gray-400 dark:border-gray-600 rounded-b-2xl bg-white/40 dark:bg-gray-700/40 overflow-hidden">
              {/* Base aqueous solution - always visible */}
              <div className="absolute bottom-0 left-0 right-0 transition-all duration-500" style={{ height: `${beakerFillPercent}%`, background: `rgba(180,210,240,0.35)` }} />
              {/* Indicator color overlay */}
              <div className="absolute bottom-0 left-0 right-0 transition-all duration-500" style={{ height: `${beakerFillPercent}%`, background: solutionColor }} />
              <div className="absolute left-1 right-1 h-[2px] rounded-full transition-all duration-500" style={{ bottom: `${beakerFillPercent}%`, background: 'rgba(255,255,255,0.3)' }} />
              {[25, 50, 75].map(pct => (
                <div key={pct} className="absolute right-0 w-3 border-t border-gray-300/50 dark:border-gray-500/50" style={{ bottom: `${pct}%` }} />
              ))}
              {/* Stir bar */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-gray-300/40 dark:bg-gray-500/40 rounded-full" />
            </div>
          </div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mt-1">Flask &mdash; {selectedAcid.formula} ({C_ACID} M)</div>

          {/* Controls under apparatus */}
          <div className="w-full mt-3 space-y-2.5">
            {/* Main Add Drop button - large and prominent */}
            <button onClick={addDrop} disabled={volume >= MAX_VOLUME || isAutoDropping || dropFalling}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:text-gray-500 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md">
              <Droplet className="h-4 w-4" /> Add Drop
            </button>
            {/* Drop size selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Size</span>
              {[0.25, 0.5, 1.0, 2.0].map(size => (
                <button key={size} onClick={() => setDropSize(size)}
                  className={`flex-1 text-[11px] py-1 rounded-md font-medium transition-all ${dropSize === size ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 shadow-sm' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-transparent hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                >{size}</button>
              ))}
              <span className="text-[10px] text-gray-400">mL</span>
            </div>
            {/* Auto and Reset buttons */}
            <div className="flex gap-1.5">
              <button onClick={() => setIsAutoDropping(prev => !prev)} disabled={volume >= MAX_VOLUME}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all text-white shadow-sm ${isAutoDropping ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:text-gray-500'}`}>
                {isAutoDropping ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {isAutoDropping ? 'Stop' : 'Auto Drip'}
              </button>
              <button onClick={reset} className="py-2 px-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs rounded-lg transition-all shadow-sm" title="Reset">
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Column 2: Graph + Info */}
        <div className="flex-1 flex flex-col gap-2.5 min-w-0 min-h-0">
          {/* Graph */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2.5 flex flex-col" style={{ flex: '1 1 0', minHeight: 0 }}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-semibold text-gray-800 dark:text-white">Titration Curve</span>
              </div>
              <span className="text-[9px] text-gray-400 dark:text-gray-500">Hover to inspect &middot; Click to jump</span>
            </div>
            <div className="flex-1 min-h-0">
              <svg ref={svgRef} className="w-full h-full cursor-crosshair" viewBox="-10 -6 122 78" preserveAspectRatio="xMidYMid meet"
                onMouseMove={handleSvgMouseMove} onMouseLeave={() => setHoverInfo(null)} onClick={handleSvgClick}>
                <rect x="0" y="0" width={CHART_W} height={CHART_H} fill="none" stroke="#e5e7eb" strokeWidth="0.3" className="dark:opacity-30" />
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(p => {
                  const y = toSvgY(p); const isMajor = p % 2 === 0;
                  return (<g key={`h-${p}`}>
                    <line x1="0" y1={y} x2={CHART_W} y2={y} stroke={p === 7 ? '#f59e0b' : '#d1d5db'} strokeWidth={p === 7 ? '0.4' : isMajor ? '0.25' : '0.12'} className="dark:opacity-30" strokeDasharray={p === 7 ? '2,1' : '0'} />
                    {isMajor && <text x="-2" y={y + 1.2} fill="#6b7280" fontSize="3.2" textAnchor="end">{p}</text>}
                  </g>);
                })}
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map(v => {
                  const x = toSvgX(v); const isMajor = v % 10 === 0 || v === 25;
                  return (<g key={`v-${v}`}>
                    <line x1={x} y1={0} x2={x} y2={CHART_H} stroke={v === EQUIVALENCE_VOLUME ? '#f59e0b' : '#d1d5db'} strokeWidth={v === EQUIVALENCE_VOLUME ? '0.4' : isMajor ? '0.25' : '0.12'} className="dark:opacity-30" strokeDasharray={v === EQUIVALENCE_VOLUME ? '1.5,1' : '0'} />
                    {isMajor && <text x={x} y={CHART_H + 4} fill="#6b7280" fontSize="3.2" textAnchor="middle">{v}</text>}
                  </g>);
                })}
                <text x={CHART_W / 2} y={CHART_H + 8} fill="#9ca3af" fontSize="3" textAnchor="middle">Volume NaOH (mL)</text>
                <text x={-8} y={CHART_H / 2} fill="#9ca3af" fontSize="3" textAnchor="middle" transform={`rotate(-90,-8,${CHART_H / 2})`}>pH</text>
                <text x={toSvgX(EQUIVALENCE_VOLUME)} y={-2} fill="#f59e0b" fontSize="2.6" textAnchor="middle" fontWeight="bold">Eq ({EQUIVALENCE_VOLUME} mL)</text>
                <text x={CHART_W + 1.5} y={toSvgY(7) + 1} fill="#f59e0b" fontSize="2.4" textAnchor="start">pH 7</text>
                {!selectedAcid.isStrong && (
                  <><line x1={toSvgX(halfEqVol)} y1={0} x2={toSvgX(halfEqVol)} y2={CHART_H} stroke="#8b5cf6" strokeWidth="0.3" strokeDasharray="1,1" opacity="0.6" />
                  <text x={toSvgX(halfEqVol)} y={-2} fill="#8b5cf6" fontSize="2.4" textAnchor="middle">&frac12; eq</text></>
                )}
                <path d={`${curvePoints.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(pt.x)},${toSvgY(pt.y)}`).join(' ')} L ${toSvgX(MAX_VOLUME)},${CHART_H} L 0,${CHART_H} Z`} fill="url(#cg)" opacity="0.12" />
                <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#3b82f6" stopOpacity="0" /></linearGradient></defs>
                <path d={curvePoints.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(pt.x)},${toSvgY(pt.y)}`).join(' ')} fill="none" stroke="#3b82f6" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                {hoverInfo && (<g>
                  <line x1={hoverInfo.x} y1={0} x2={hoverInfo.x} y2={CHART_H} stroke="#9ca3af" strokeWidth="0.2" strokeDasharray="1,1" />
                  <line x1={0} y1={hoverInfo.y} x2={CHART_W} y2={hoverInfo.y} stroke="#9ca3af" strokeWidth="0.2" strokeDasharray="1,1" />
                  <circle cx={hoverInfo.x} cy={hoverInfo.y} r="1.5" fill="#8b5cf6" stroke="#fff" strokeWidth="0.4" />
                  <rect x={hoverInfo.x > 70 ? hoverInfo.x - 28 : hoverInfo.x + 3} y={hoverInfo.y > 40 ? hoverInfo.y - 12 : hoverInfo.y + 2} width="25" height="10" rx="1.5" fill="white" stroke="#d1d5db" strokeWidth="0.3" opacity="0.95" />
                  <text x={hoverInfo.x > 70 ? hoverInfo.x - 15.5 : hoverInfo.x + 15.5} y={hoverInfo.y > 40 ? hoverInfo.y - 5.5 : hoverInfo.y + 8.5} fill="#374151" fontSize="2.8" textAnchor="middle">{hoverInfo.vol.toFixed(1)} mL</text>
                  <text x={hoverInfo.x > 70 ? hoverInfo.x - 15.5 : hoverInfo.x + 15.5} y={hoverInfo.y > 40 ? hoverInfo.y - 2.8 : hoverInfo.y + 11.2} fill="#3b82f6" fontSize="2.8" textAnchor="middle" fontWeight="bold">pH {hoverInfo.pH.toFixed(2)}</text>
                </g>)}
                <circle cx={toSvgX(volume)} cy={toSvgY(pH)} r="2.2" fill="#ef4444" stroke="#fff" strokeWidth="0.6" />
              </svg>
            </div>
          </div>

          {/* Step + Reaction info row */}
          <div className="flex gap-2.5" style={{ flex: '0 0 auto' }}>
            {/* Step guidance */}
            <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Info className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                <span className="text-[11px] font-semibold text-blue-800 dark:text-blue-300">Step {step.step}: {step.label}</span>
              </div>
              <p className="text-[10px] text-gray-600 dark:text-gray-300 leading-relaxed">{step.desc}</p>
            </div>
            {/* Reaction */}
            <div className="flex-1 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg px-3 py-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <BookOpen className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                <span className="text-[11px] font-semibold text-purple-800 dark:text-purple-300">Chemical Reaction</span>
              </div>
              <p className="text-[10px] text-gray-700 dark:text-gray-200 font-mono">{selectedAcid.reaction}</p>
              <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5">Net ionic: {selectedAcid.netIonic}</p>
            </div>
          </div>
        </div>

        {/* Column 3: Sidebar */}
        <div className="w-[220px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          {/* Acid selection */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2.5">
            <h4 className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
              <TestTubes className="h-3 w-3 text-purple-600 dark:text-purple-400" /> Acid
            </h4>
            <div className="space-y-0.5">
              {acids.map(acid => (
                <button key={acid.formula} onClick={() => { setSelectedAcid(acid); reset(); }}
                  className={`w-full text-left px-2 py-1 rounded text-[11px] transition-all ${selectedAcid.formula === acid.formula ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-700' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent'}`}>
                  <span className="font-medium">{acid.formula}</span>
                  <span className="ml-1 text-gray-400 dark:text-gray-500 text-[10px]">{acid.isStrong ? 'Strong' : `pKa=${acid.pKa}`}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Indicator */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2.5">
            <h4 className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
              <Droplet className="h-3 w-3 text-pink-600 dark:text-pink-400" /> Indicator
            </h4>
            <div className="space-y-0.5">
              {indicators.map(ind => (
                <button key={ind.name} onClick={() => setSelectedIndicator(ind)}
                  className={`w-full text-left px-2 py-1 rounded text-[11px] transition-all flex items-center gap-1.5 ${selectedIndicator.name === ind.name ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200 border border-pink-300 dark:border-pink-700' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent'}`}>
                  <div className="flex gap-0.5">
                    <div className="w-2 h-2 rounded-full border border-gray-300 dark:border-gray-600" style={{ backgroundColor: ind.lowColor }} />
                    <div className="w-2 h-2 rounded-full border border-gray-300 dark:border-gray-600" style={{ backgroundColor: ind.highColor }} />
                  </div>
                  <span>{ind.name}</span>
                  <span className="ml-auto text-[8px] text-gray-400 dark:text-gray-500">{ind.transitionLow}-{ind.transitionHigh}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Measurements */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2.5">
            <h4 className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Measurements</h4>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">NaOH added</span><span className="font-mono text-gray-800 dark:text-white">{volume.toFixed(2)} mL</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">pH</span><span className="font-mono text-gray-800 dark:text-white">{pH.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Acid remaining</span><span className="font-mono text-gray-800 dark:text-white">{Math.max(0, N_ACID - C_BASE * volume).toFixed(3)} mmol</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Eq. point</span><span className="font-mono text-amber-600 dark:text-amber-400">{EQUIVALENCE_VOLUME.toFixed(1)} mL</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">pH at eq.</span><span className="font-mono text-amber-600 dark:text-amber-400">{eqPH.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Nature</span>
                <span className="font-mono">{pH < 6.5 ? <span className="text-red-600 dark:text-red-400">Acidic</span> : pH > 7.5 ? <span className="text-blue-600 dark:text-blue-400">Basic</span> : <span className="text-green-600 dark:text-green-400">Neutral</span>}</span></div>
              <div className="pt-0.5"><div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-300" style={{ width: `${(volume / MAX_VOLUME) * 100}%`, background: volume < EQUIVALENCE_VOLUME ? '#3b82f6' : volume < EQUIVALENCE_VOLUME * 1.1 ? '#f59e0b' : '#ef4444' }} /></div></div>
            </div>
          </div>

          {/* Theory */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-green-800 dark:text-green-300 uppercase tracking-wider mb-1">Titration Details</h4>
            <div className="space-y-1 text-[10px] text-gray-600 dark:text-gray-300">
              <p><span className="font-semibold text-gray-700 dark:text-gray-200">Salt formed:</span> {selectedAcid.salt}</p>
              <p><span className="font-semibold text-gray-700 dark:text-gray-200">Key info:</span> {selectedAcid.eqNote}</p>
              {!selectedAcid.isStrong && (
                <p><span className="font-semibold text-gray-700 dark:text-gray-200">Buffer:</span> pH = {selectedAcid.pKa.toFixed(2)} + log([A&#x207B;]/[HA]) at half-eq ({halfEqVol} mL), pH = pKa = {selectedAcid.pKa.toFixed(2)}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
