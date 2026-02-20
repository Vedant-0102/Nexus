import React, { useState, useEffect } from 'react';
import { Dna, Play, Pause, RotateCcw, Info } from 'lucide-react';

export const DNAReplication: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [speed, setSpeed] = useState(1);

  const basePairs = ['A-T', 'T-A', 'G-C', 'C-G', 'A-T', 'G-C', 'T-A', 'C-G', 'A-T', 'G-C'];

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setIsPlaying(false);
          return 100;
        }
        return prev + 0.8 * speed;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [isPlaying, speed]);

  const getBaseColor = (base: string) => {
    switch (base) {
      case 'A': return '#ef4444';
      case 'T': return '#06b6d4';
      case 'G': return '#eab308';
      case 'C': return '#22c55e';
      default: return '#ccc';
    }
  };

  const getBaseName = (base: string) => {
    switch (base) {
      case 'A': return 'Adenine';
      case 'T': return 'Thymine';
      case 'G': return 'Guanine';
      case 'C': return 'Cytosine';
      default: return '';
    }
  };

  // Determine which step we're in
  const getStep = () => {
    if (progress < 10) return 0;
    if (progress < 40) return 1;
    if (progress < 75) return 2;
    if (progress < 100) return 3;
    return 4;
  };

  const step = getStep();

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-3 overflow-hidden">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Dna className="h-5 w-5 text-blue-600" />
          DNA Replication
        </h2>
        <p className="text-[11px] text-gray-600 dark:text-gray-400">
          Semi-conservative replication with enzyme visualization
        </p>
      </div>

      <div className="flex-1 flex gap-3 min-h-0">
        {/* Visualization */}
        <div className="flex-1 flex flex-col gap-2 min-w-0 min-h-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 shadow-lg flex-1 min-h-0">
            <svg className="w-full h-full" viewBox="0 0 520 460" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="backbone-left" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#4f46e5" />
                </linearGradient>
                <linearGradient id="backbone-right" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
                <linearGradient id="backbone-new" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#c4b5fd" />
                </linearGradient>
                <filter id="enzyme-glow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Title labels for strands */}
              {progress > 50 && (
                <>
                  <text x="65" y="18" textAnchor="middle" fontSize="9" fill="#4f46e5" fontWeight="bold" opacity={Math.min((progress - 50) / 20, 1)}>
                    Leading strand
                  </text>
                  <text x="430" y="18" textAnchor="middle" fontSize="9" fill="#7c3aed" fontWeight="bold" opacity={Math.min((progress - 50) / 20, 1)}>
                    Lagging strand
                  </text>
                </>
              )}

              {/* DNA strands */}
              {basePairs.map((pair, i) => {
                const [base1, base2] = pair.split('-');
                const y = 30 + i * 42;
                const separation = Math.min((progress / 100) * 120, 120);

                // Helix twist - slight sinusoidal offset for visual effect
                const twist = Math.sin((i * 0.6) + (progress * 0.02)) * 8;
                const x1 = 175 - separation + twist;
                const x2 = 275 + separation + twist;

                // Stagger new base appearance to simulate progressive replication
                const basePairProgress = Math.max(0, progress - (i * 4));
                const newBaseOpacity = basePairProgress > 25 ? Math.min((basePairProgress - 25) / 40, 1) : 0;

                return (
                  <g key={i}>
                    {/* Left backbone segment */}
                    {i < basePairs.length - 1 && (
                      <line
                        x1={x1} y1={y + 10}
                        x2={175 - separation + Math.sin(((i + 1) * 0.6) + (progress * 0.02)) * 8} y2={y + 52}
                        stroke="url(#backbone-left)" strokeWidth="4" strokeLinecap="round"
                      />
                    )}
                    {/* Right backbone segment */}
                    {i < basePairs.length - 1 && (
                      <line
                        x1={x2} y1={y + 10}
                        x2={275 + separation + Math.sin(((i + 1) * 0.6) + (progress * 0.02)) * 8} y2={y + 52}
                        stroke="url(#backbone-right)" strokeWidth="4" strokeLinecap="round"
                      />
                    )}

                    {/* Hydrogen bonds (breaking apart) */}
                    {separation < 100 && (
                      <line
                        x1={x1 + 18} y1={y + 10}
                        x2={x2 - 18} y2={y + 10}
                        stroke="#d4d4d8"
                        strokeWidth="1.5"
                        strokeDasharray="4,3"
                        opacity={Math.max(0, 1 - separation / 80)}
                      />
                    )}

                    {/* Left (template) base */}
                    <circle cx={x1 + 15} cy={y + 10} r="14" fill={getBaseColor(base1)} stroke="#374151" strokeWidth="1.5" />
                    {showLabels && (
                      <text x={x1 + 15} y={y + 14} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#fff">{base1}</text>
                    )}

                    {/* Right (template) base */}
                    <circle cx={x2 - 15} cy={y + 10} r="14" fill={getBaseColor(base2)} stroke="#374151" strokeWidth="1.5" />
                    {showLabels && (
                      <text x={x2 - 15} y={y + 14} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#fff">{base2}</text>
                    )}

                    {/* New complementary bases forming */}
                    {newBaseOpacity > 0 && (
                      <>
                        {/* New base on left side (complement of base1 = base2) */}
                        <g opacity={newBaseOpacity}>
                          <circle cx={x1 - 18} cy={y + 10} r="12" fill={getBaseColor(base2)} stroke="#374151" strokeWidth="1.5" />
                          {showLabels && (
                            <text x={x1 - 18} y={y + 14} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#fff">{base2}</text>
                          )}
                          {/* New backbone on left */}
                          {i < basePairs.length - 1 && (
                            <line
                              x1={x1 - 18} y1={y + 10}
                              x2={175 - separation + Math.sin(((i + 1) * 0.6) + (progress * 0.02)) * 8 - 18} y2={y + 52}
                              stroke="url(#backbone-new)" strokeWidth="3" strokeLinecap="round" opacity={newBaseOpacity}
                            />
                          )}
                          {/* Bond between template and new */}
                          <line x1={x1 + 2} y1={y + 10} x2={x1 - 5} y2={y + 10} stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2" />
                        </g>

                        {/* New base on right side (complement of base2 = base1) */}
                        <g opacity={newBaseOpacity}>
                          <circle cx={x2 + 18} cy={y + 10} r="12" fill={getBaseColor(base1)} stroke="#374151" strokeWidth="1.5" />
                          {showLabels && (
                            <text x={x2 + 18} y={y + 14} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#fff">{base1}</text>
                          )}
                          {/* New backbone on right */}
                          {i < basePairs.length - 1 && (
                            <line
                              x1={x2 + 18} y1={y + 10}
                              x2={275 + separation + Math.sin(((i + 1) * 0.6) + (progress * 0.02)) * 8 + 18} y2={y + 52}
                              stroke="url(#backbone-new)" strokeWidth="3" strokeLinecap="round" opacity={newBaseOpacity}
                            />
                          )}
                          {/* Bond between template and new */}
                          <line x1={x2 - 2} y1={y + 10} x2={x2 + 5} y2={y + 10} stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2" />
                        </g>
                      </>
                    )}
                  </g>
                );
              })}

              {/* Helicase enzyme */}
              {progress < 95 && progress > 0 && (
                <g filter="url(#enzyme-glow)">
                  <ellipse
                    cx={225 + Math.sin(progress * 0.02) * 8}
                    cy={30 + (progress / 100) * 380}
                    rx="22" ry="14"
                    fill="#f97316"
                    opacity="0.9"
                  />
                  <text
                    x={225 + Math.sin(progress * 0.02) * 8}
                    y={34 + (progress / 100) * 380}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#fff"
                    fontWeight="bold"
                  >
                    Helicase
                  </text>
                </g>
              )}

              {/* DNA Polymerase enzymes */}
              {progress > 20 && progress < 95 && (
                <>
                  {/* Left polymerase */}
                  <g filter="url(#enzyme-glow)">
                    <ellipse
                      cx={175 - Math.min((progress / 100) * 120, 120) - 20 + Math.sin(progress * 0.02) * 8}
                      cy={50 + (Math.max(0, progress - 20) / 80) * 340}
                      rx="18" ry="12"
                      fill="#3b82f6"
                      opacity="0.9"
                    />
                    <text
                      x={175 - Math.min((progress / 100) * 120, 120) - 20 + Math.sin(progress * 0.02) * 8}
                      y={54 + (Math.max(0, progress - 20) / 80) * 340}
                      textAnchor="middle"
                      fontSize="7"
                      fill="#fff"
                      fontWeight="bold"
                    >
                      Pol III
                    </text>
                  </g>
                  {/* Right polymerase */}
                  <g filter="url(#enzyme-glow)">
                    <ellipse
                      cx={275 + Math.min((progress / 100) * 120, 120) + 20 + Math.sin(progress * 0.02) * 8}
                      cy={50 + (Math.max(0, progress - 20) / 80) * 340}
                      rx="18" ry="12"
                      fill="#3b82f6"
                      opacity="0.9"
                    />
                    <text
                      x={275 + Math.min((progress / 100) * 120, 120) + 20 + Math.sin(progress * 0.02) * 8}
                      y={54 + (Math.max(0, progress - 20) / 80) * 340}
                      textAnchor="middle"
                      fontSize="7"
                      fill="#fff"
                      fontWeight="bold"
                    >
                      Pol III
                    </text>
                  </g>
                </>
              )}

              {/* Direction arrows */}
              {progress > 5 && progress < 95 && (
                <>
                  <text x={225 + Math.sin(progress * 0.02) * 8} y={18 + (progress / 100) * 380} textAnchor="middle" fontSize="16" fill="#f97316">
                    &#x25BC;
                  </text>
                </>
              )}

              {/* 5' → 3' direction labels on template strands */}
              {progress > 15 && (
                <g opacity={Math.min((progress - 15) / 20, 0.8)}>
                  {/* Left template: 3' at top, 5' at bottom */}
                  <text x={175 - Math.min((progress / 100) * 120, 120) + Math.sin(0.02 * progress) * 8 + 15} y="25" textAnchor="middle" fontSize="8" fill="#4f46e5" fontWeight="bold">3'</text>
                  <text x={175 - Math.min((progress / 100) * 120, 120) + Math.sin((10 * 0.6 + progress * 0.02)) * 8 + 15} y={30 + 10 * 42 + 5} textAnchor="middle" fontSize="8" fill="#4f46e5" fontWeight="bold">5'</text>
                  {/* Right template: 5' at top, 3' at bottom */}
                  <text x={275 + Math.min((progress / 100) * 120, 120) + Math.sin(0.02 * progress) * 8 - 15} y="25" textAnchor="middle" fontSize="8" fill="#7c3aed" fontWeight="bold">5'</text>
                  <text x={275 + Math.min((progress / 100) * 120, 120) + Math.sin((10 * 0.6 + progress * 0.02)) * 8 - 15} y={30 + 10 * 42 + 5} textAnchor="middle" fontSize="8" fill="#7c3aed" fontWeight="bold">3'</text>
                </g>
              )}

              {/* New strand direction labels */}
              {progress > 40 && (
                <g opacity={Math.min((progress - 40) / 25, 0.8)}>
                  {/* Left new strand: 5' at top, 3' at bottom (synthesized 5'→3') */}
                  <text x={175 - Math.min((progress / 100) * 120, 120) + Math.sin(0.02 * progress) * 8 - 18} y="25" textAnchor="middle" fontSize="7" fill="#a78bfa" fontWeight="bold">5'</text>
                  <text x={175 - Math.min((progress / 100) * 120, 120) + Math.sin((10 * 0.6 + progress * 0.02)) * 8 - 18} y={30 + 10 * 42 + 5} textAnchor="middle" fontSize="7" fill="#a78bfa" fontWeight="bold">3'</text>
                  {/* Right new strand: 3' at top, 5' at bottom */}
                  <text x={275 + Math.min((progress / 100) * 120, 120) + Math.sin(0.02 * progress) * 8 + 18} y="25" textAnchor="middle" fontSize="7" fill="#a78bfa" fontWeight="bold">3'</text>
                  <text x={275 + Math.min((progress / 100) * 120, 120) + Math.sin((10 * 0.6 + progress * 0.02)) * 8 + 18} y={30 + 10 * 42 + 5} textAnchor="middle" fontSize="7" fill="#a78bfa" fontWeight="bold">5'</text>
                </g>
              )}

              {/* RNA Primers (short green segments on new strands) */}
              {progress > 30 && basePairs.map((_, i) => {
                const basePairProgress = Math.max(0, progress - (i * 4));
                if (basePairProgress < 20 || basePairProgress > 30) return null;
                const y = 30 + i * 42;
                const separation = Math.min((progress / 100) * 120, 120);
                const twist = Math.sin((i * 0.6) + (progress * 0.02)) * 8;
                const x1 = 175 - separation + twist;
                const x2 = 275 + separation + twist;
                const primerOpacity = Math.min((basePairProgress - 20) / 5, 1);
                return (
                  <g key={`primer-${i}`} opacity={primerOpacity}>
                    {/* Left primer */}
                    <rect x={x1 - 28} y={y + 6} width="8" height="8" rx="1" fill="#22c55e" opacity="0.7" />
                    <text x={x1 - 24} y={y + 13} textAnchor="middle" fontSize="5" fill="#fff" fontWeight="bold">P</text>
                    {/* Right primer */}
                    <rect x={x2 + 20} y={y + 6} width="8" height="8" rx="1" fill="#22c55e" opacity="0.7" />
                    <text x={x2 + 24} y={y + 13} textAnchor="middle" fontSize="5" fill="#fff" fontWeight="bold">P</text>
                  </g>
                );
              })}

              {/* Okazaki fragment markers on lagging strand (right side) */}
              {progress > 45 && (
                <g opacity={Math.min((progress - 45) / 20, 0.7)}>
                  {[2, 5, 8].map(i => {
                    const basePairProgress = Math.max(0, progress - (i * 4));
                    if (basePairProgress < 30) return null;
                    const y = 30 + i * 42;
                    const separation = Math.min((progress / 100) * 120, 120);
                    const twist = Math.sin((i * 0.6) + (progress * 0.02)) * 8;
                    const x2 = 275 + separation + twist;
                    return (
                      <g key={`okazaki-${i}`}>
                        <line x1={x2 + 12} y1={y + 14} x2={x2 + 12} y2={y + 28} stroke="#f59e0b" strokeWidth="2" strokeDasharray="3,2" />
                        <text x={x2 + 25} y={y + 23} fontSize="6" fill="#f59e0b" fontWeight="bold">OF</text>
                      </g>
                    );
                  })}
                </g>
              )}

              {/* Completion label */}
              {progress >= 100 && (
                <g>
                  <text x="130" y="450" textAnchor="middle" fontSize="11" fill="#4f46e5" fontWeight="bold">
                    Daughter DNA 1
                  </text>
                  <text x="390" y="450" textAnchor="middle" fontSize="11" fill="#7c3aed" fontWeight="bold">
                    Daughter DNA 2
                  </text>
                </g>
              )}
            </svg>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md px-3 py-2 flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={progress >= 100}
              className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-1.5 transition-colors"
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={() => {
                setProgress(0);
                setIsPlaying(false);
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
            <div className="flex items-center gap-1.5 ml-2 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 shadow-sm">
              <span className="text-[11px] text-gray-600 dark:text-gray-400">Speed:</span>
              {[0.5, 1, 2].map(s => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                    speed === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
            <div className="flex-1 flex items-center gap-2 ml-2">
              <div className="flex-1">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-75"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <span className="text-[11px] text-gray-500 font-medium whitespace-nowrap">{Math.round(progress)}%</span>
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="w-72 flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 shadow-md">
            <h3 className="text-[11px] font-semibold mb-1.5">Display Options</h3>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
                className="w-4 h-4 accent-blue-600"
              />
              Show Base Labels
            </label>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 shadow-md">
            <h3 className="text-[11px] font-semibold mb-1.5">Base Pairing Rules</h3>
            <div className="space-y-2 text-sm">
              {[
                { b1: 'A', b2: 'T', bonds: '2 hydrogen bonds' },
                { b1: 'G', b2: 'C', bonds: '3 hydrogen bonds' },
              ].map(({ b1, b2, bonds }) => (
                <div key={b1} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: getBaseColor(b1) }}>{b1}</div>
                  <span className="text-gray-400 text-xs">{bonds}</span>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: getBaseColor(b2) }}>{b2}</div>
                  <span className="text-xs text-gray-500">{getBaseName(b1)} - {getBaseName(b2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 shadow-md">
            <h3 className="text-[11px] font-semibold mb-1.5">Enzymes Involved</h3>
            <div className="space-y-2 text-sm">
              <div className={`p-2 rounded flex items-center gap-2 transition-colors ${step >= 1 ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-gray-50 dark:bg-gray-700'}`}>
                <div className="w-4 h-4 rounded-full bg-orange-500" />
                <div>
                  <div className="font-semibold text-xs">Helicase</div>
                  <div className="text-xs text-gray-500">Unwinds and separates strands</div>
                </div>
              </div>
              <div className={`p-2 rounded flex items-center gap-2 transition-colors ${step >= 2 ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-50 dark:bg-gray-700'}`}>
                <div className="w-4 h-4 rounded-full bg-blue-500" />
                <div>
                  <div className="font-semibold text-xs">DNA Polymerase III</div>
                  <div className="text-xs text-gray-500">Adds complementary nucleotides (5' to 3')</div>
                </div>
              </div>
              <div className={`p-2 rounded flex items-center gap-2 transition-colors ${step >= 1 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-50 dark:bg-gray-700'}`}>
                <div className="w-4 h-4 rounded-full bg-green-500" />
                <div>
                  <div className="font-semibold text-xs">Primase</div>
                  <div className="text-xs text-gray-500">Creates RNA primer to start replication</div>
                </div>
              </div>
              <div className={`p-2 rounded flex items-center gap-2 transition-colors ${step >= 3 ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-gray-50 dark:bg-gray-700'}`}>
                <div className="w-4 h-4 rounded-full bg-purple-500" />
                <div>
                  <div className="font-semibold text-xs">Ligase</div>
                  <div className="text-xs text-gray-500">Joins Okazaki fragments on lagging strand</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 shadow-md">
            <h3 className="text-[11px] font-semibold mb-1.5">Process Steps</h3>
            <ol className="text-sm space-y-2">
              {[
                { threshold: 0, text: 'Helicase unwinds the double helix' },
                { threshold: 10, text: 'Strands separate at replication fork' },
                { threshold: 40, text: 'DNA Polymerase III adds new nucleotides' },
                { threshold: 75, text: 'Two identical DNA molecules formed' },
              ].map((item, i) => (
                <li
                  key={i}
                  className={`flex items-start gap-2 p-1.5 rounded transition-colors ${
                    progress >= item.threshold ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/20' : 'text-gray-400'
                  }`}
                >
                  <span className={`flex-shrink-0 w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${
                    progress >= item.threshold ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
                  }`}>
                    {i + 1}
                  </span>
                  <span className="text-xs">{item.text}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-2.5">
            <h3 className="text-[11px] font-semibold mb-1.5 flex items-center gap-2 text-blue-800 dark:text-blue-300">
              <Info className="h-3 w-3" />
              Key Concepts
            </h3>
            <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
              <li>* Semi-conservative: each new DNA has one old and one new strand</li>
              <li>* Leading strand: continuous synthesis (3' to 5' template)</li>
              <li>* Lagging strand: Okazaki fragments joined by ligase</li>
              <li>* Replication is bidirectional from origin</li>
              <li>* DNA Polymerase has proofreading ability (3' to 5' exonuclease)</li>
              <li>* Each strand serves as a template for the new strand</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
