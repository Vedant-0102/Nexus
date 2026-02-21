import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Info, Microscope } from 'lucide-react';

type MitosisPhase = 'interphase' | 'prophase' | 'metaphase' | 'anaphase' | 'telophase' | 'cytokinesis';
type MeiosisPhase = 'interphase' | 'prophase-I' | 'metaphase-I' | 'anaphase-I' | 'telophase-I' | 'prophase-II' | 'metaphase-II' | 'anaphase-II' | 'telophase-II' | 'cytokinesis-II';
type Phase = MitosisPhase | MeiosisPhase;

interface PhaseInfo {
  phase: Phase;
  name: string;
  description: string;
  duration: number;
}

export const CellDivision: React.FC = () => {
  const [currentPhase, setCurrentPhase] = useState<Phase>('interphase');
  const [isPlaying, setIsPlaying] = useState(false);
  const [divisionType, setDivisionType] = useState<'mitosis' | 'meiosis'>('mitosis');
  const [phaseProgress, setPhaseProgress] = useState(0);

  const mitosisPhases: PhaseInfo[] = [
    { phase: 'interphase', name: 'Interphase', description: 'Cell grows, DNA replicates (S phase). Organelles duplicate.', duration: 3000 },
    { phase: 'prophase', name: 'Prophase', description: 'Chromatin condenses into visible chromosomes. Centrioles move to poles. Nuclear envelope begins to break down.', duration: 2500 },
    { phase: 'metaphase', name: 'Metaphase', description: 'Chromosomes align at the metaphase plate. Spindle fibers attach to centromeres.', duration: 2000 },
    { phase: 'anaphase', name: 'Anaphase', description: 'Sister chromatids are pulled apart to opposite poles by shortening spindle fibers.', duration: 2000 },
    { phase: 'telophase', name: 'Telophase', description: 'Nuclear envelopes reform around each set of chromosomes. Chromosomes begin to decondense.', duration: 2000 },
    { phase: 'cytokinesis', name: 'Cytokinesis', description: 'Cleavage furrow pinches cell in two. Two identical daughter cells formed.', duration: 2500 }
  ];

  const meiosisPhases: PhaseInfo[] = [
    { phase: 'interphase', name: 'Interphase', description: 'DNA replicates. Cell prepares for two rounds of division.', duration: 2500 },
    { phase: 'prophase-I', name: 'Prophase I', description: 'Homologous chromosomes pair up (synapsis). Crossing over occurs, creating genetic variation.', duration: 2500 },
    { phase: 'metaphase-I', name: 'Metaphase I', description: 'Homologous pairs (bivalents) line up at metaphase plate. Independent assortment occurs.', duration: 2000 },
    { phase: 'anaphase-I', name: 'Anaphase I', description: 'Homologous chromosomes separate (not sister chromatids). Each pole gets one of each pair.', duration: 2000 },
    { phase: 'telophase-I', name: 'Telophase I', description: 'Two haploid cells form. Each has one chromosome from each homologous pair.', duration: 2000 },
    { phase: 'prophase-II', name: 'Prophase II', description: 'Chromosomes re-condense in both cells. No DNA replication occurs.', duration: 2000 },
    { phase: 'metaphase-II', name: 'Metaphase II', description: 'Chromosomes align at metaphase plate in each cell, similar to mitotic metaphase.', duration: 1800 },
    { phase: 'anaphase-II', name: 'Anaphase II', description: 'Sister chromatids finally separate. Pulled to opposite poles.', duration: 1800 },
    { phase: 'telophase-II', name: 'Telophase II', description: 'Nuclear envelopes reform. Four haploid cells begin to take shape.', duration: 2000 },
    { phase: 'cytokinesis-II', name: 'Cytokinesis II', description: 'Four genetically unique haploid daughter cells (gametes) are produced.', duration: 2500 }
  ];

  const phases = divisionType === 'mitosis' ? mitosisPhases : meiosisPhases;

  useEffect(() => {
    const currentIndex = phases.findIndex(p => p.phase === currentPhase);
    const currentPhaseDuration = phases[currentIndex].duration;
    const dt = 16; // ~60fps frame time
    const progressIncrement = (dt / currentPhaseDuration) * 100;
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isPlaying) return;
      setPhaseProgress(prev => {
        const next = prev + progressIncrement;
        if (next >= 100) {
          const nextIndex = (currentIndex + 1) % phases.length;
          setCurrentPhase(phases[nextIndex].phase);
          return 0;
        }
        return next;
      });
    };
    animId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animId);
  }, [isPlaying, currentPhase, divisionType]);

  const switchType = useCallback((type: 'mitosis' | 'meiosis') => {
    setDivisionType(type);
    setCurrentPhase('interphase');
    setPhaseProgress(0);
    setIsPlaying(false);
  }, []);

  const renderMitosisCell = () => {
    const s = 240;
    const cx = s / 2;
    const cy = s / 2;
    const t = phaseProgress / 100;

    switch (currentPhase) {
      case 'interphase':
        return (
          <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
            {/* Cell membrane with gradient */}
            <defs>
              <radialGradient id="cell-grad-m" cx="40%" cy="40%">
                <stop offset="0%" stopColor="#e0f2fe" />
                <stop offset="80%" stopColor="#bae6fd" />
                <stop offset="100%" stopColor="#7dd3fc" />
              </radialGradient>
              <radialGradient id="nucleus-grad-m" cx="45%" cy="40%">
                <stop offset="0%" stopColor="#dbeafe" />
                <stop offset="100%" stopColor="#93c5fd" />
              </radialGradient>
            </defs>
            <circle cx={cx} cy={cy} r={95} fill="url(#cell-grad-m)" stroke="#0284c7" strokeWidth="3" />
            {/* Endoplasmic reticulum (rough ER) */}
            <path d={`M ${cx + 30},${cy - 35} Q ${cx + 50},${cy - 25} ${cx + 40},${cy - 10} Q ${cx + 55},${cy + 5} ${cx + 45},${cy + 20}`} stroke="#60a5fa" strokeWidth="2.5" fill="none" opacity="0.6" />
            <path d={`M ${cx + 35},${cy - 35} Q ${cx + 55},${cy - 25} ${cx + 45},${cy - 10} Q ${cx + 60},${cy + 5} ${cx + 50},${cy + 20}`} stroke="#60a5fa" strokeWidth="2.5" fill="none" opacity="0.6" />
            {/* Ribosomes on rough ER */}
            {[{x: cx+35, y: cy-30}, {x: cx+48, y: cy-18}, {x: cx+43, y: cy-5}, {x: cx+55, y: cy+8}, {x: cx+48, y: cy+18}].map((r, i) => (
              <circle key={`ribo-${i}`} cx={r.x} cy={r.y} r="2" fill="#1d4ed8" opacity="0.7" />
            ))}
            {/* Mitochondria */}
            {[
              { x: cx - 55, y: cy - 30, angle: 20 },
              { x: cx + 60, y: cy + 40, angle: -30 },
              { x: cx - 40, y: cy + 50, angle: 45 },
            ].map((m, i) => (
              <g key={`mito-${i}`} transform={`translate(${m.x}, ${m.y}) rotate(${m.angle})`}>
                <ellipse cx="0" cy="0" rx="16" ry="8" fill="#f0abfc" stroke="#c026d3" strokeWidth="1.5" opacity="0.8" />
                {/* Inner membrane folds (cristae) */}
                <path d="M -8,-3 Q -4,4 0,-2 Q 4,4 8,-3" stroke="#c026d3" strokeWidth="1" fill="none" opacity="0.6" />
              </g>
            ))}
            {/* Golgi apparatus */}
            <g transform={`translate(${cx - 55}, ${cy + 15})`}>
              {[-6, -2, 2, 6].map((off, i) => (
                <ellipse key={`golgi-${i}`} cx="0" cy={off} rx={14 - i * 2} ry="3" fill="none" stroke="#f59e0b" strokeWidth="2" opacity={0.7 - i * 0.1} />
              ))}
              {/* Vesicles budding off */}
              <circle cx="16" cy="-4" r="3" fill="#fbbf24" opacity="0.6" />
              <circle cx="18" cy="4" r="2.5" fill="#fbbf24" opacity="0.5" />
            </g>
            {/* Nucleus */}
            <circle cx={cx} cy={cy} r={45 - t * 2} fill="url(#nucleus-grad-m)" stroke="#0369a1" strokeWidth="2" opacity={1 - t * 0.15} />
            {/* Nuclear pores */}
            {[0, 60, 120, 180, 240, 300].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const pr = 44 - t * 2;
              return (
                <circle key={`pore-${i}`} cx={cx + Math.cos(rad) * pr} cy={cy + Math.sin(rad) * pr} r="2.5" fill="#0369a1" opacity="0.4" />
              );
            })}
            {/* Chromatin fibers */}
            <path d={`M ${cx - 15},${cy - 10} Q ${cx - 5},${cy - 20} ${cx + 5},${cy - 10}`} stroke="#1e3a5f" strokeWidth="2" fill="none" />
            <path d={`M ${cx + 5},${cy + 5} Q ${cx + 15},${cy + 15} ${cx + 10},${cy + 20}`} stroke="#1e3a5f" strokeWidth="2" fill="none" />
            <path d={`M ${cx - 10},${cy + 8} Q ${cx},${cy + 18} ${cx - 5},${cy + 15}`} stroke="#1e3a5f" strokeWidth="2" fill="none" />
            {/* Nucleolus */}
            <circle cx={cx + 8} cy={cy - 5} r="8" fill="#1e3a5f" opacity="0.4" />
            {/* Centrioles */}
            <rect x={cx + 55} y={cy - 5} width="8" height="10" fill="#f97316" rx="2" />
            <rect x={cx + 55} y={cy + 3} width="8" height="10" fill="#f97316" rx="2" transform={`rotate(90 ${cx + 59} ${cy + 8})`} />
            {/* Free ribosomes */}
            {[{x: cx-70, y: cy-55}, {x: cx+70, y: cy-50}, {x: cx-65, y: cy+60}, {x: cx+65, y: cy+55}, {x: cx-30, y: cy+65}, {x: cx+30, y: cy-65}].map((r, i) => (
              <circle key={`free-ribo-${i}`} cx={r.x} cy={r.y} r="1.5" fill="#1d4ed8" opacity="0.5" />
            ))}
            {/* Replication fork indicator */}
            {t > 0.3 && (
              <g opacity={Math.min((t - 0.3) * 3, 1)}>
                <text x={cx} y={cy + 55} textAnchor="middle" fontSize="10" fill="#0369a1" fontWeight="bold">
                  DNA Replicating...
                </text>
              </g>
            )}
          </svg>
        );

      case 'prophase':
        return (
          <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
            <circle cx={cx} cy={cy} r={95} fill="#e0f2fe" stroke="#0284c7" strokeWidth="3" />
            {/* Dissolving nuclear envelope */}
            <circle cx={cx} cy={cy} r={42} fill="none" stroke="#0369a1" strokeWidth="2" strokeDasharray={`${(1 - t) * 8} ${t * 8 + 2}`} opacity={1 - t * 0.7} />
            {/* Condensing chromosomes - X shapes */}
            {[
              { x: cx - 20, y: cy - 15 },
              { x: cx + 15, y: cy - 10 },
              { x: cx - 10, y: cy + 12 },
              { x: cx + 20, y: cy + 15 },
            ].map((pos, i) => (
              <g key={i}>
                <line x1={pos.x - 6} y1={pos.y - 8} x2={pos.x + 6} y2={pos.y + 8} stroke="#1e3a5f" strokeWidth={2 + t * 2} strokeLinecap="round" />
                <line x1={pos.x + 6} y1={pos.y - 8} x2={pos.x - 6} y2={pos.y + 8} stroke="#1e3a5f" strokeWidth={2 + t * 2} strokeLinecap="round" />
                <circle cx={pos.x} cy={pos.y} r="2" fill="#ef4444" opacity={t} />
              </g>
            ))}
            {/* Centrioles moving to poles */}
            <circle cx={cx - t * 60} cy={25 + (1 - t) * 20} r="6" fill="#f97316" />
            <circle cx={cx + t * 60} cy={s - 25 - (1 - t) * 20} r="6" fill="#f97316" />
            {/* Forming spindle fibers */}
            {t > 0.5 && (
              <>
                <line x1={cx - t * 60} y1={30} x2={cx} y2={cy} stroke="#a8a29e" strokeWidth="1" opacity={t - 0.5} strokeDasharray="3,3" />
                <line x1={cx + t * 60} y1={s - 30} x2={cx} y2={cy} stroke="#a8a29e" strokeWidth="1" opacity={t - 0.5} strokeDasharray="3,3" />
              </>
            )}
          </svg>
        );

      case 'metaphase':
        return (
          <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
            <circle cx={cx} cy={cy} r={95} fill="#e0f2fe" stroke="#0284c7" strokeWidth="3" />
            {/* Metaphase plate line */}
            <line x1={cx - 60} y1={cy} x2={cx + 60} y2={cy} stroke="#94a3b8" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
            {/* Chromosomes aligned at plate */}
            {[
              { x: cx - 25, y: cy },
              { x: cx - 8, y: cy },
              { x: cx + 8, y: cy },
              { x: cx + 25, y: cy },
            ].map((pos, i) => (
              <g key={i}>
                <line x1={pos.x - 5} y1={pos.y - 10} x2={pos.x + 5} y2={pos.y + 10} stroke="#1e3a5f" strokeWidth="4" strokeLinecap="round" />
                <line x1={pos.x + 5} y1={pos.y - 10} x2={pos.x - 5} y2={pos.y + 10} stroke="#1e3a5f" strokeWidth="4" strokeLinecap="round" />
                <circle cx={pos.x} cy={pos.y} r="3" fill="#ef4444" />
              </g>
            ))}
            {/* Spindle fibers from poles to centromeres */}
            {[cx - 25, cx - 8, cx + 8, cx + 25].map((x, i) => (
              <g key={`spindle-${i}`}>
                <line x1={cx - 60} y1={25} x2={x} y2={cy} stroke="#a8a29e" strokeWidth="1.5" opacity="0.6" />
                <line x1={cx + 60} y1={s - 25} x2={x} y2={cy} stroke="#a8a29e" strokeWidth="1.5" opacity="0.6" />
              </g>
            ))}
            {/* Centrioles at poles */}
            <circle cx={cx - 60} cy={25} r="6" fill="#f97316" />
            <circle cx={cx + 60} cy={s - 25} r="6" fill="#f97316" />
          </svg>
        );

      case 'anaphase':
        const sep = t * 40;
        return (
          <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
            <circle cx={cx} cy={cy} r={95 + t * 5} fill="#e0f2fe" stroke="#0284c7" strokeWidth="3" />
            {/* Chromatids moving up */}
            {[-20, -5, 10, 25].map((offset, i) => (
              <g key={`up-${i}`}>
                <rect x={cx + offset - 3} y={cy - 15 - sep} width="6" height="14" fill="#1e3a5f" rx="2" />
                <line x1={cx - 60} y1={25} x2={cx + offset} y2={cy - 10 - sep} stroke="#a8a29e" strokeWidth="1.5" opacity="0.5" />
              </g>
            ))}
            {/* Chromatids moving down */}
            {[-20, -5, 10, 25].map((offset, i) => (
              <g key={`down-${i}`}>
                <rect x={cx + offset - 3} y={cy + 1 + sep} width="6" height="14" fill="#1e3a5f" rx="2" />
                <line x1={cx + 60} y1={s - 25} x2={cx + offset} y2={cy + 5 + sep} stroke="#a8a29e" strokeWidth="1.5" opacity="0.5" />
              </g>
            ))}
            {/* Centrioles */}
            <circle cx={cx - 60} cy={25} r="6" fill="#f97316" />
            <circle cx={cx + 60} cy={s - 25} r="6" fill="#f97316" />
          </svg>
        );

      case 'telophase':
        return (
          <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
            <ellipse cx={cx} cy={cy} rx={90} ry={98 + t * 5} fill="#e0f2fe" stroke="#0284c7" strokeWidth="3" />
            {/* Cleavage furrow forming */}
            <ellipse cx={cx} cy={cy} rx={90 - t * 30} ry={3} fill="none" stroke="#0284c7" strokeWidth="2" opacity={t} />
            {/* Top nucleus reforming */}
            <circle cx={cx} cy={cy - 45} r={25 + t * 8} fill="#bae6fd" stroke="#0369a1" strokeWidth="2" opacity={0.3 + t * 0.7} />
            {/* Top decondensing chromatin */}
            {[-8, 0, 8].map((off, i) => (
              <circle key={`top-${i}`} cx={cx + off} cy={cy - 45 + (i - 1) * 6} r={2 + (1 - t)} fill="#1e3a5f" opacity={0.8} />
            ))}
            {/* Bottom nucleus reforming */}
            <circle cx={cx} cy={cy + 45} r={25 + t * 8} fill="#bae6fd" stroke="#0369a1" strokeWidth="2" opacity={0.3 + t * 0.7} />
            {/* Bottom decondensing chromatin */}
            {[-8, 0, 8].map((off, i) => (
              <circle key={`bot-${i}`} cx={cx + off} cy={cy + 45 + (i - 1) * 6} r={2 + (1 - t)} fill="#1e3a5f" opacity={0.8} />
            ))}
          </svg>
        );

      case 'cytokinesis':
        const split = t * 30;
        return (
          <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
            {/* Two daughter cells */}
            <circle cx={cx} cy={cy - 35 - split} r={55 + t * 10} fill="#e0f2fe" stroke="#0284c7" strokeWidth="3" />
            <circle cx={cx} cy={cy + 35 + split} r={55 + t * 10} fill="#e0f2fe" stroke="#0284c7" strokeWidth="3" />
            {/* Nuclei */}
            <circle cx={cx} cy={cy - 35 - split} r={22} fill="#bae6fd" stroke="#0369a1" strokeWidth="2" />
            <circle cx={cx} cy={cy + 35 + split} r={22} fill="#bae6fd" stroke="#0369a1" strokeWidth="2" />
            {/* Chromatin in each */}
            {[-5, 5].map((off, i) => (
              <g key={`chr-${i}`}>
                <circle cx={cx + off} cy={cy - 35 - split - 3 + i * 6} r="2" fill="#1e3a5f" />
                <circle cx={cx + off} cy={cy + 35 + split - 3 + i * 6} r="2" fill="#1e3a5f" />
              </g>
            ))}
            {/* Labels */}
            <text x={cx} y={cy - 35 - split + 50} textAnchor="middle" fontSize="10" fill="#0369a1" fontWeight="bold">2n</text>
            <text x={cx} y={cy + 35 + split + 50} textAnchor="middle" fontSize="10" fill="#0369a1" fontWeight="bold">2n</text>
          </svg>
        );

      default:
        return null;
    }
  };

  const renderMeiosisCell = () => {
    const s = 240;
    const cx = s / 2;
    const cy = s / 2;
    const t = phaseProgress / 100;

    switch (currentPhase) {
      case 'interphase':
        return (
          <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
            <defs>
              <radialGradient id="cell-grad-me" cx="40%" cy="40%">
                <stop offset="0%" stopColor="#fce7f3" />
                <stop offset="80%" stopColor="#fbcfe8" />
                <stop offset="100%" stopColor="#f9a8d4" />
              </radialGradient>
              <radialGradient id="nucleus-grad-me" cx="45%" cy="40%">
                <stop offset="0%" stopColor="#fce7f3" />
                <stop offset="100%" stopColor="#f9a8d4" />
              </radialGradient>
            </defs>
            <circle cx={cx} cy={cy} r={95} fill="url(#cell-grad-me)" stroke="#be185d" strokeWidth="3" />
            {/* Endoplasmic reticulum */}
            <path d={`M ${cx + 30},${cy - 35} Q ${cx + 50},${cy - 25} ${cx + 40},${cy - 10} Q ${cx + 55},${cy + 5} ${cx + 45},${cy + 20}`} stroke="#f472b6" strokeWidth="2.5" fill="none" opacity="0.5" />
            <path d={`M ${cx + 35},${cy - 35} Q ${cx + 55},${cy - 25} ${cx + 45},${cy - 10} Q ${cx + 60},${cy + 5} ${cx + 50},${cy + 20}`} stroke="#f472b6" strokeWidth="2.5" fill="none" opacity="0.5" />
            {/* Ribosomes on ER */}
            {[{x: cx+38, y: cy-28}, {x: cx+50, y: cy-15}, {x: cx+45, y: cy-2}, {x: cx+57, y: cy+10}].map((r, i) => (
              <circle key={`ribo-me-${i}`} cx={r.x} cy={r.y} r="2" fill="#9d174d" opacity="0.6" />
            ))}
            {/* Mitochondria */}
            {[
              { x: cx - 55, y: cy - 30, angle: 20 },
              { x: cx + 60, y: cy + 40, angle: -30 },
              { x: cx - 40, y: cy + 50, angle: 45 },
            ].map((m, i) => (
              <g key={`mito-me-${i}`} transform={`translate(${m.x}, ${m.y}) rotate(${m.angle})`}>
                <ellipse cx="0" cy="0" rx="16" ry="8" fill="#d8b4fe" stroke="#9333ea" strokeWidth="1.5" opacity="0.8" />
                <path d="M -8,-3 Q -4,4 0,-2 Q 4,4 8,-3" stroke="#9333ea" strokeWidth="1" fill="none" opacity="0.6" />
              </g>
            ))}
            {/* Golgi apparatus */}
            <g transform={`translate(${cx - 55}, ${cy + 15})`}>
              {[-6, -2, 2, 6].map((off, i) => (
                <ellipse key={`golgi-me-${i}`} cx="0" cy={off} rx={14 - i * 2} ry="3" fill="none" stroke="#f59e0b" strokeWidth="2" opacity={0.7 - i * 0.1} />
              ))}
              <circle cx="16" cy="-4" r="3" fill="#fbbf24" opacity="0.6" />
            </g>
            {/* Nucleus */}
            <circle cx={cx} cy={cy} r={42} fill="url(#nucleus-grad-me)" stroke="#9d174d" strokeWidth="2" />
            {/* Nuclear pores */}
            {[0, 60, 120, 180, 240, 300].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              return (
                <circle key={`pore-me-${i}`} cx={cx + Math.cos(rad) * 41} cy={cy + Math.sin(rad) * 41} r="2" fill="#9d174d" opacity="0.4" />
              );
            })}
            {/* Chromatin - maternal (brown) and paternal (blue) */}
            <path d={`M ${cx - 12},${cy - 8} Q ${cx},${cy - 18} ${cx + 12},${cy - 8}`} stroke="#7c2d12" strokeWidth="2" fill="none" />
            <path d={`M ${cx + 5},${cy + 5} Q ${cx + 15},${cy + 12} ${cx + 8},${cy + 18}`} stroke="#7c2d12" strokeWidth="2" fill="none" />
            <path d={`M ${cx - 10},${cy + 8} Q ${cx - 2},${cy + 14} ${cx - 8},${cy + 16}`} stroke="#1e40af" strokeWidth="2" fill="none" />
            <path d={`M ${cx - 5},${cy - 3} Q ${cx + 8},${cy + 3} ${cx - 3},${cy + 10}`} stroke="#1e40af" strokeWidth="2" fill="none" />
            {/* Nucleolus */}
            <circle cx={cx + 6} cy={cy - 4} r="7" fill="#9d174d" opacity="0.3" />
            {/* Free ribosomes */}
            {[{x: cx-70, y: cy-55}, {x: cx+70, y: cy-50}, {x: cx-65, y: cy+60}, {x: cx+65, y: cy+55}].map((r, i) => (
              <circle key={`free-ribo-me-${i}`} cx={r.x} cy={r.y} r="1.5" fill="#9d174d" opacity="0.4" />
            ))}
            <text x={cx} y={cy + 55} textAnchor="middle" fontSize="9" fill="#9d174d">2n = 4 (diploid)</text>
          </svg>
        );

      case 'prophase-I':
        return (
          <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
            <circle cx={cx} cy={cy} r={95} fill="#fce7f3" stroke="#be185d" strokeWidth="3" />
            {/* Dissolving nuclear envelope */}
            <circle cx={cx} cy={cy} r={42} fill="none" stroke="#9d174d" strokeWidth="2" strokeDasharray={`${(1 - t) * 8} ${t * 8 + 2}`} opacity={1 - t * 0.7} />
            {/* Homologous pairs (bivalents) with crossing over */}
            <g transform={`translate(${cx - 20}, ${cy - 15})`}>
              <line x1="-5" y1="-12" x2="5" y2="12" stroke="#7c2d12" strokeWidth="4" strokeLinecap="round" />
              <line x1="-3" y1="-12" x2="7" y2="12" stroke="#1e40af" strokeWidth="4" strokeLinecap="round" />
              {/* Crossing over X */}
              {t > 0.4 && (
                <circle cx="1" cy="0" r="4" fill="#f59e0b" opacity={t - 0.3}>
                  <animate attributeName="r" values="3;5;3" dur="1s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
            <g transform={`translate(${cx + 20}, ${cy + 10})`}>
              <line x1="-5" y1="-12" x2="5" y2="12" stroke="#7c2d12" strokeWidth="4" strokeLinecap="round" />
              <line x1="-3" y1="-12" x2="7" y2="12" stroke="#1e40af" strokeWidth="4" strokeLinecap="round" />
              {t > 0.5 && (
                <circle cx="1" cy="0" r="4" fill="#f59e0b" opacity={t - 0.4}>
                  <animate attributeName="r" values="3;5;3" dur="1s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
            {t > 0.4 && (
              <text x={cx} y={s - 20} textAnchor="middle" fontSize="9" fill="#f59e0b" fontWeight="bold">
                Crossing Over!
              </text>
            )}
          </svg>
        );

      case 'metaphase-I':
        return (
          <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
            <circle cx={cx} cy={cy} r={95} fill="#fce7f3" stroke="#be185d" strokeWidth="3" />
            <line x1={cx - 50} y1={cy} x2={cx + 50} y2={cy} stroke="#d4d4d8" strokeWidth="1" strokeDasharray="4,4" />
            {/* Bivalents at plate */}
            {[-18, 18].map((off, i) => (
              <g key={i} transform={`translate(${cx + off}, ${cy})`}>
                <line x1="-5" y1="-10" x2="5" y2="10" stroke="#7c2d12" strokeWidth="4" strokeLinecap="round" />
                <line x1="-3" y1="-10" x2="7" y2="10" stroke="#1e40af" strokeWidth="4" strokeLinecap="round" />
              </g>
            ))}
            {/* Spindle fibers */}
            <circle cx={cx - 60} cy={25} r="5" fill="#f97316" />
            <circle cx={cx + 60} cy={s - 25} r="5" fill="#f97316" />
            {[cx - 18, cx + 18].map((x, i) => (
              <g key={`sf-${i}`}>
                <line x1={cx - 60} y1={25} x2={x} y2={cy} stroke="#a8a29e" strokeWidth="1" opacity="0.5" />
                <line x1={cx + 60} y1={s - 25} x2={x} y2={cy} stroke="#a8a29e" strokeWidth="1" opacity="0.5" />
              </g>
            ))}
          </svg>
        );

      case 'anaphase-I':
        const sepI = t * 35;
        return (
          <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
            <circle cx={cx} cy={cy} r={95} fill="#fce7f3" stroke="#be185d" strokeWidth="3" />
            {/* Homologs separating - maternal goes up */}
            <g>
              <line x1={cx - 18 - 4} y1={cy - 15 - sepI} x2={cx - 18 + 4} y2={cy + 5 - sepI} stroke="#7c2d12" strokeWidth="4" strokeLinecap="round" />
              <line x1={cx + 18 - 4} y1={cy - 15 - sepI} x2={cx + 18 + 4} y2={cy + 5 - sepI} stroke="#7c2d12" strokeWidth="4" strokeLinecap="round" />
            </g>
            {/* Paternal goes down */}
            <g>
              <line x1={cx - 18 - 4} y1={cy - 5 + sepI} x2={cx - 18 + 4} y2={cy + 15 + sepI} stroke="#1e40af" strokeWidth="4" strokeLinecap="round" />
              <line x1={cx + 18 - 4} y1={cy - 5 + sepI} x2={cx + 18 + 4} y2={cy + 15 + sepI} stroke="#1e40af" strokeWidth="4" strokeLinecap="round" />
            </g>
            {/* Spindle fibers */}
            <circle cx={cx - 60} cy={25} r="5" fill="#f97316" />
            <circle cx={cx + 60} cy={s - 25} r="5" fill="#f97316" />
          </svg>
        );

      case 'telophase-I':
        const splitI = t * 20;
        return (
          <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
            {/* Two cells forming */}
            <circle cx={cx} cy={cy - 30 - splitI} r={55 + t * 5} fill="#fce7f3" stroke="#be185d" strokeWidth="3" />
            <circle cx={cx} cy={cy + 30 + splitI} r={55 + t * 5} fill="#fce7f3" stroke="#be185d" strokeWidth="3" />
            {/* Nuclei */}
            <circle cx={cx} cy={cy - 30 - splitI} r={18 + t * 5} fill="#fbcfe8" stroke="#9d174d" strokeWidth="1.5" opacity={t} />
            <circle cx={cx} cy={cy + 30 + splitI} r={18 + t * 5} fill="#fbcfe8" stroke="#9d174d" strokeWidth="1.5" opacity={t} />
            {/* Chromosomes */}
            <line x1={cx - 8} y1={cy - 35 - splitI} x2={cx - 4} y2={cy - 25 - splitI} stroke="#7c2d12" strokeWidth="3" strokeLinecap="round" />
            <line x1={cx + 4} y1={cy - 35 - splitI} x2={cx + 8} y2={cy - 25 - splitI} stroke="#7c2d12" strokeWidth="3" strokeLinecap="round" />
            <line x1={cx - 8} y1={cy + 25 + splitI} x2={cx - 4} y2={cy + 35 + splitI} stroke="#1e40af" strokeWidth="3" strokeLinecap="round" />
            <line x1={cx + 4} y1={cy + 25 + splitI} x2={cx + 8} y2={cy + 35 + splitI} stroke="#1e40af" strokeWidth="3" strokeLinecap="round" />
            <text x={cx} y={cy - 30 - splitI + 42} textAnchor="middle" fontSize="9" fill="#9d174d">n</text>
            <text x={cx} y={cy + 30 + splitI + 42} textAnchor="middle" fontSize="9" fill="#9d174d">n</text>
          </svg>
        );

      case 'prophase-II':
        return (
          <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
            <circle cx={cx - 40} cy={cy} r={50} fill="#fce7f3" stroke="#be185d" strokeWidth="2.5" />
            <circle cx={cx + 40} cy={cy} r={50} fill="#fce7f3" stroke="#be185d" strokeWidth="2.5" />
            {/* Condensing chromosomes in each cell */}
            <g>
              <line x1={cx - 48} y1={cy - 10} x2={cx - 40} y2={cy + 10} stroke="#7c2d12" strokeWidth={2 + t * 2} strokeLinecap="round" />
              <line x1={cx - 32} y1={cy - 10} x2={cx - 40} y2={cy + 10} stroke="#7c2d12" strokeWidth={2 + t * 2} strokeLinecap="round" />
            </g>
            <g>
              <line x1={cx + 32} y1={cy - 10} x2={cx + 40} y2={cy + 10} stroke="#1e40af" strokeWidth={2 + t * 2} strokeLinecap="round" />
              <line x1={cx + 48} y1={cy - 10} x2={cx + 40} y2={cy + 10} stroke="#1e40af" strokeWidth={2 + t * 2} strokeLinecap="round" />
            </g>
          </svg>
        );

      case 'metaphase-II':
        return (
          <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
            <circle cx={cx - 40} cy={cy} r={50} fill="#fce7f3" stroke="#be185d" strokeWidth="2.5" />
            <circle cx={cx + 40} cy={cy} r={50} fill="#fce7f3" stroke="#be185d" strokeWidth="2.5" />
            {/* Metaphase plates */}
            <line x1={cx - 60} y1={cy} x2={cx - 20} y2={cy} stroke="#d4d4d8" strokeWidth="1" strokeDasharray="3,3" />
            <line x1={cx + 20} y1={cy} x2={cx + 60} y2={cy} stroke="#d4d4d8" strokeWidth="1" strokeDasharray="3,3" />
            {/* Chromosomes at plates */}
            <g>
              <line x1={cx - 46} y1={cy - 8} x2={cx - 38} y2={cy + 8} stroke="#7c2d12" strokeWidth="4" strokeLinecap="round" />
              <line x1={cx - 38} y1={cy - 8} x2={cx - 46} y2={cy + 8} stroke="#7c2d12" strokeWidth="4" strokeLinecap="round" />
            </g>
            <g>
              <line x1={cx + 34} y1={cy - 8} x2={cx + 42} y2={cy + 8} stroke="#1e40af" strokeWidth="4" strokeLinecap="round" />
              <line x1={cx + 42} y1={cy - 8} x2={cx + 34} y2={cy + 8} stroke="#1e40af" strokeWidth="4" strokeLinecap="round" />
            </g>
          </svg>
        );

      case 'anaphase-II':
        const sepII = t * 20;
        return (
          <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
            <circle cx={cx - 40} cy={cy} r={50} fill="#fce7f3" stroke="#be185d" strokeWidth="2.5" />
            <circle cx={cx + 40} cy={cy} r={50} fill="#fce7f3" stroke="#be185d" strokeWidth="2.5" />
            {/* Left cell - chromatids separating */}
            <rect x={cx - 44} y={cy - 8 - sepII} width="4" height="12" fill="#7c2d12" rx="1" />
            <rect x={cx - 38} y={cy - 4 + sepII} width="4" height="12" fill="#7c2d12" rx="1" />
            {/* Right cell - chromatids separating */}
            <rect x={cx + 36} y={cy - 8 - sepII} width="4" height="12" fill="#1e40af" rx="1" />
            <rect x={cx + 42} y={cy - 4 + sepII} width="4" height="12" fill="#1e40af" rx="1" />
          </svg>
        );

      case 'telophase-II':
        return (
          <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
            {/* Four cells forming */}
            <circle cx={cx - 40} cy={cy - 25 - t * 10} r={35 + t * 5} fill="#fce7f3" stroke="#be185d" strokeWidth="2" />
            <circle cx={cx - 40} cy={cy + 25 + t * 10} r={35 + t * 5} fill="#fce7f3" stroke="#be185d" strokeWidth="2" />
            <circle cx={cx + 40} cy={cy - 25 - t * 10} r={35 + t * 5} fill="#fce7f3" stroke="#be185d" strokeWidth="2" />
            <circle cx={cx + 40} cy={cy + 25 + t * 10} r={35 + t * 5} fill="#fce7f3" stroke="#be185d" strokeWidth="2" />
            {/* Nuclei reforming */}
            {[
              { x: cx - 40, y: cy - 25 - t * 10 },
              { x: cx - 40, y: cy + 25 + t * 10 },
              { x: cx + 40, y: cy - 25 - t * 10 },
              { x: cx + 40, y: cy + 25 + t * 10 },
            ].map((pos, i) => (
              <circle key={i} cx={pos.x} cy={pos.y} r={10 * t + 5} fill="#fbcfe8" stroke="#9d174d" strokeWidth="1" opacity={t} />
            ))}
          </svg>
        );

      case 'cytokinesis-II':
        const splitII = t * 8;
        return (
          <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
            {/* Four separate daughter cells */}
            {[
              { x: cx - 45 - splitII, y: cy - 40 - splitII, color: '#7c2d12' },
              { x: cx - 45 - splitII, y: cy + 40 + splitII, color: '#7c2d12' },
              { x: cx + 45 + splitII, y: cy - 40 - splitII, color: '#1e40af' },
              { x: cx + 45 + splitII, y: cy + 40 + splitII, color: '#1e40af' },
            ].map((cell, i) => (
              <g key={i}>
                <circle cx={cell.x} cy={cell.y} r={38} fill="#fce7f3" stroke="#be185d" strokeWidth="2.5" />
                <circle cx={cell.x} cy={cell.y} r={14} fill="#fbcfe8" stroke="#9d174d" strokeWidth="1.5" />
                <circle cx={cell.x} cy={cell.y} r="3" fill={cell.color} />
                <text x={cell.x} y={cell.y + 28} textAnchor="middle" fontSize="8" fill="#9d174d" fontWeight="bold">n</text>
              </g>
            ))}
            <text x={cx} y={s - 5} textAnchor="middle" fontSize="10" fill="#9d174d" fontWeight="bold">
              4 unique haploid cells
            </text>
          </svg>
        );

      default:
        return null;
    }
  };

  const currentPhaseInfo = phases.find(p => p.phase === currentPhase)!;
  const currentIndex = phases.findIndex(p => p.phase === currentPhase);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-3 overflow-hidden">
      <div className="mb-2 flex items-center gap-2">
        <Microscope className="h-5 w-5 text-green-600 dark:text-green-400" />
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white leading-tight">Cell Division Animation</h2>
          <p className="text-[11px] text-gray-600 dark:text-gray-400">
            Watch {divisionType} in action — {divisionType === 'mitosis' ? '2 identical diploid cells' : '4 unique haploid cells'}
          </p>
        </div>
      </div>

      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg flex-1 flex flex-col items-center justify-center min-h-0">
            <div className="flex-1 flex items-center justify-center min-h-0 w-full">
              {divisionType === 'mitosis' ? renderMitosisCell() : renderMeiosisCell()}
            </div>
            <div className="mt-2 text-center">
              <h3 className="text-sm font-bold text-gray-800 dark:text-white">{currentPhaseInfo.name}</h3>
              <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5 max-w-xs">{currentPhaseInfo.description}</p>
              <div className="mt-1.5 w-40 mx-auto">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                  <div
                    className="bg-green-500 h-1 rounded-full transition-all duration-75"
                    style={{ width: `${phaseProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-0.5 mt-2 items-center justify-center">
            {phases.map((p, i) => (
              <div key={p.phase} className="flex items-center">
                <div
                  className={`w-4 h-1.5 rounded-full transition-colors cursor-pointer ${
                    i < currentIndex ? 'bg-green-500' :
                    i === currentIndex ? (divisionType === 'mitosis' ? 'bg-blue-500' : 'bg-pink-500') :
                    'bg-gray-300 dark:bg-gray-600'
                  }`}
                  onClick={() => { setCurrentPhase(p.phase); setPhaseProgress(0); }}
                  title={p.name}
                />
                {i < phases.length - 1 && <div className="w-0.5" />}
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-2 justify-center">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-3 py-1.5 text-white rounded-lg flex items-center gap-1.5 transition-colors text-xs font-semibold ${
                divisionType === 'mitosis'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-pink-600 hover:bg-pink-700'
              }`}
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={() => { setCurrentPhase('interphase'); setPhaseProgress(0); setIsPlaying(false); }}
              className="px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-1.5 transition-colors text-xs font-semibold"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </div>

        <div className="w-72 flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 shadow-md">
            <h3 className="font-semibold text-xs mb-2">Division Type</h3>
            <div className="flex gap-2">
              <button
                onClick={() => switchType('mitosis')}
                className={`flex-1 py-1.5 rounded text-[11px] font-medium transition-colors ${
                  divisionType === 'mitosis' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                Mitosis
              </button>
              <button
                onClick={() => switchType('meiosis')}
                className={`flex-1 py-1.5 rounded text-[11px] font-medium transition-colors ${
                  divisionType === 'meiosis' ? 'bg-pink-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                Meiosis
              </button>
            </div>
            <div className="mt-1.5 text-[10px] text-gray-500 dark:text-gray-400">
              {divisionType === 'mitosis'
                ? 'Produces 2 identical diploid (2n) cells for growth & repair.'
                : 'Produces 4 unique haploid (n) gametes for reproduction.'}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 shadow-md">
            <h3 className="font-semibold text-xs mb-2">Phases ({currentIndex + 1}/{phases.length})</h3>
            <div className="space-y-1 max-h-[250px] overflow-y-auto">
              {phases.map((phase, i) => (
                <button
                  key={phase.phase}
                  onClick={() => { setCurrentPhase(phase.phase); setPhaseProgress(0); }}
                  className={`w-full text-left px-2 py-1 rounded transition-colors text-[11px] ${
                    currentPhase === phase.phase
                      ? (divisionType === 'mitosis'
                          ? 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-600'
                          : 'bg-pink-100 dark:bg-pink-900/30 border-l-4 border-pink-600')
                      : i < currentIndex
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                        : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="font-medium text-[11px]">{i < currentIndex ? '\u2713 ' : ''}{phase.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div className={`rounded-lg p-2.5 ${
            divisionType === 'mitosis'
              ? 'bg-green-50 dark:bg-green-900/30'
              : 'bg-pink-50 dark:bg-pink-900/30'
          }`}>
            <h3 className={`font-semibold text-xs mb-1.5 flex items-center gap-1.5 ${
              divisionType === 'mitosis'
                ? 'text-green-800 dark:text-green-300'
                : 'text-pink-800 dark:text-pink-300'
            }`}>
              <Info className="h-3 w-3" />
              Key Concepts
            </h3>
            <ul className="text-[10px] space-y-0.5 text-gray-700 dark:text-gray-300">
              {divisionType === 'mitosis' ? (
                <>
                  <li>* Mitosis produces 2 identical daughter cells</li>
                  <li>* Chromosome number stays the same (2n to 2n)</li>
                  <li>* Used for growth, repair, and asexual reproduction</li>
                  <li>* Spindle fibers attach at centromeres</li>
                  <li>* Cytokinesis splits the cytoplasm</li>
                </>
              ) : (
                <>
                  <li>* Meiosis produces 4 genetically unique cells</li>
                  <li>* Chromosome number is halved (2n to n)</li>
                  <li>* Crossing over creates new gene combinations</li>
                  <li>* Independent assortment adds variation</li>
                  <li>* Meiosis I: homologs separate</li>
                  <li>* Meiosis II: sister chromatids separate</li>
                  <li>* Essential for sexual reproduction</li>
                </>
              )}
            </ul>
          </div>

          {divisionType === 'meiosis' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 shadow-md">
              <h3 className="font-semibold mb-1.5 text-xs">Mitosis vs Meiosis</h3>
              <div className="text-[10px] space-y-0.5">
                <div className="flex justify-between"><span>Divisions:</span><span className="font-bold">1 vs 2</span></div>
                <div className="flex justify-between"><span>Daughter cells:</span><span className="font-bold">2 vs 4</span></div>
                <div className="flex justify-between"><span>Ploidy:</span><span className="font-bold">2n vs n</span></div>
                <div className="flex justify-between"><span>Genetic variation:</span><span className="font-bold">No vs Yes</span></div>
                <div className="flex justify-between"><span>Crossing over:</span><span className="font-bold">No vs Yes</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
