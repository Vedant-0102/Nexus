import React, { useState, useEffect } from 'react';
import { Brain, Play, Pause, RotateCcw, Info } from 'lucide-react';

export const NeuronSignal: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [phase, setPhase] = useState<'resting' | 'depolarization' | 'repolarization' | 'hyperpolarization'>('resting');
  const [voltage, setVoltage] = useState(-70);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgress(p => {
        const newProgress = p + 1 * speed;
        if (newProgress >= 100) {
          setIsPlaying(false);
          return 100;
        }

        if (newProgress < 20) {
          setPhase('resting');
          setVoltage(-70);
        } else if (newProgress < 40) {
          setPhase('depolarization');
          setVoltage(-70 + ((newProgress - 20) / 20) * 110);
        } else if (newProgress < 70) {
          setPhase('repolarization');
          setVoltage(40 - ((newProgress - 40) / 30) * 110);
        } else {
          setPhase('hyperpolarization');
          setVoltage(-70 - ((newProgress - 70) / 30) * 20);
        }

        return newProgress;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [isPlaying, speed]);

  const reset = () => {
    setProgress(0);
    setPhase('resting');
    setVoltage(-70);
    setIsPlaying(false);
  };

  // Get voltage at any progress point (for the graph curve)
  const getVoltageAtProgress = (p: number) => {
    if (p < 20) return -70;
    if (p < 40) return -70 + ((p - 20) / 20) * 110;
    if (p < 70) return 40 - ((p - 40) / 30) * 110;
    return -70 - ((p - 70) / 30) * 20;
  };

  // Build smooth action potential path for graph
  const buildVoltagePath = () => {
    const points: string[] = [];
    for (let i = 0; i <= 100; i += 1) {
      const v = getVoltageAtProgress(i);
      const x = 60 + (i / 100) * 480;
      const y = 110 - ((v + 70) / 130) * 100;
      points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return points.join(' ');
  };

  // Signal position along axon
  const signalX = 80 + (progress / 100) * 460;

  // Ion channel positions along axon
  const ionChannels = [160, 260, 360, 460];

  // Determine if a channel is "active" based on signal progress
  const isChannelActive = (channelX: number) => {
    const signalPos = signalX;
    return signalPos >= channelX - 30 && signalPos <= channelX + 60;
  };

  const isChannelDepolarizing = (channelX: number) => {
    const signalPos = signalX;
    return signalPos >= channelX - 30 && signalPos <= channelX + 15;
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-3 overflow-hidden">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          Neuron Signal Transmission
        </h2>
        <p className="text-[11px] text-gray-600 dark:text-gray-400">
          Action potential propagation with ion channel dynamics
        </p>
      </div>

      <div className="flex-1 flex gap-3 min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col gap-2 min-w-0 min-h-0 overflow-y-auto">
          {/* Neuron Visualization */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-lg flex-shrink-0">
            <svg className="w-full" viewBox="0 0 600 200" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="axon-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d4d4d8" />
                  <stop offset="50%" stopColor="#e4e4e7" />
                  <stop offset="100%" stopColor="#d4d4d8" />
                </linearGradient>
                <radialGradient id="signal-glow" cx="50%" cy="50%">
                  <stop offset="0%" stopColor="#facc15" stopOpacity="1" />
                  <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="soma-grad" cx="50%" cy="50%">
                  <stop offset="0%" stopColor="#c4b5fd" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>

              {/* Cell body (soma) */}
              <ellipse cx="55" cy="100" rx="35" ry="30" fill="url(#soma-grad)" stroke="#6d28d9" strokeWidth="2" />
              <text x="55" y="104" textAnchor="middle" fontSize="9" fill="#fff" fontWeight="bold">Soma</text>

              {/* Dendrites */}
              {[
                { x1: 55, y1: 70, x2: 20, y2: 40, cx: 30, cy: 50 },
                { x1: 55, y1: 75, x2: 10, y2: 70, cx: 25, cy: 65 },
                { x1: 55, y1: 100, x2: 8, y2: 100, cx: 25, cy: 95 },
                { x1: 55, y1: 125, x2: 10, y2: 130, cx: 25, cy: 135 },
                { x1: 55, y1: 130, x2: 20, y2: 160, cx: 30, cy: 150 },
              ].map((d, i) => (
                <g key={`dendrite-${i}`}>
                  <path
                    d={`M ${d.x1},${d.y1} Q ${d.cx},${d.cy} ${d.x2},${d.y2}`}
                    stroke="#8b5cf6"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <circle cx={d.x2} cy={d.y2} r="3" fill="#a78bfa" />
                </g>
              ))}

              {/* Axon hillock */}
              <path d="M 85,100 Q 95,95 100,100 Q 95,105 85,100" fill="#a78bfa" />

              {/* Axon body */}
              <rect x="80" y="88" width="460" height="24" fill="url(#axon-grad)" stroke="#a1a1aa" strokeWidth="1.5" rx="12" />

              {/* Myelin sheaths with Nodes of Ranvier */}
              {ionChannels.map((x, i) => (
                <g key={`myelin-${i}`}>
                  {/* Myelin sheath before node */}
                  <rect
                    x={x - 45} y="82" width="40" height="36"
                    fill="#2dd4bf" opacity="0.4"
                    rx="8"
                    stroke="#14b8a6" strokeWidth="1"
                  />
                  <text x={x - 25} y="78" textAnchor="middle" fontSize="7" fill="#0d9488">Myelin</text>

                  {/* Node of Ranvier (gap) */}
                  <rect x={x - 4} y="84" width="8" height="32" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1" rx="2" />

                  {/* Ion channels at node */}
                  {isChannelActive(x) && progress > 0 && (
                    <g>
                      {/* Na+ channels (top) - open during depolarization */}
                      {isChannelDepolarizing(x) && (
                        <>
                          <line x1={x} y1="80" x2={x} y2="65" stroke="#ef4444" strokeWidth="2" />
                          <text x={x} y="62" textAnchor="middle" fontSize="9" fill="#ef4444" fontWeight="bold">Na+</text>
                          <polygon points={`${x},68 ${x - 3},74 ${x + 3},74`} fill="#ef4444" />
                        </>
                      )}
                      {/* K+ channels (bottom) - open during repolarization */}
                      {!isChannelDepolarizing(x) && (
                        <>
                          <line x1={x} y1="120" x2={x} y2="138" stroke="#3b82f6" strokeWidth="2" />
                          <text x={x} y="148" textAnchor="middle" fontSize="9" fill="#3b82f6" fontWeight="bold">K+</text>
                          <polygon points={`${x},138 ${x - 3},132 ${x + 3},132`} fill="#3b82f6" />
                        </>
                      )}
                    </g>
                  )}
                </g>
              ))}

              {/* Last myelin segment */}
              <rect x="465" y="82" width="40" height="36" fill="#2dd4bf" opacity="0.4" rx="8" stroke="#14b8a6" strokeWidth="1" />

              {/* Action potential signal wave */}
              {progress > 0 && progress < 100 && (
                <g>
                  <circle cx={signalX} cy="100" r="18" fill="url(#signal-glow)" />
                  <circle cx={signalX} cy="100" r="8" fill="#facc15" opacity="0.9">
                    <animate attributeName="r" values="6;10;6" dur="0.3s" repeatCount="indefinite" />
                  </circle>
                  {/* Lightning bolt SVG path */}
                  <path
                    d={`M ${signalX - 4},${92} L ${signalX + 2},${98} L ${signalX - 1},${98} L ${signalX + 4},${108} L ${signalX - 2},${102} L ${signalX + 1},${102} Z`}
                    fill="#fbbf24"
                    stroke="#d97706"
                    strokeWidth="0.5"
                  />
                </g>
              )}

              {/* Depolarization wave trail */}
              {progress > 5 && (
                <rect
                  x="80"
                  y="88"
                  width={Math.min((progress / 100) * 460, 460)}
                  height="24"
                  fill="#fef9c3"
                  opacity={0.3}
                  rx="12"
                />
              )}

              {/* Axon terminals */}
              <g>
                <path d="M 540,100 L 560,80" stroke="#8b5cf6" strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d="M 540,100 L 565,100" stroke="#8b5cf6" strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d="M 540,100 L 560,120" stroke="#8b5cf6" strokeWidth="3" fill="none" strokeLinecap="round" />
                {/* Synaptic boutons */}
                <circle cx="565" cy="78" r="8" fill="#ddd6fe" stroke="#8b5cf6" strokeWidth="1.5" />
                <circle cx="570" cy="100" r="8" fill="#ddd6fe" stroke="#8b5cf6" strokeWidth="1.5" />
                <circle cx="565" cy="122" r="8" fill="#ddd6fe" stroke="#8b5cf6" strokeWidth="1.5" />
                {/* Vesicles inside boutons */}
                {progress >= 95 && (
                  <>
                    {[78, 100, 122].map(cy => (
                      <g key={cy}>
                        <circle cx={cy === 100 ? 572 : 567} cy={cy - 2} r="2" fill="#a78bfa" opacity="0.8" />
                        <circle cx={cy === 100 ? 568 : 563} cy={cy + 2} r="2" fill="#a78bfa" opacity="0.8" />
                      </g>
                    ))}
                  </>
                )}
              </g>

              {/* Labels */}
              <text x="15" y="190" fontSize="10" fill="#6b7280" fontWeight="600">Dendrites</text>
              <text x="55" y="190" fontSize="10" fill="#6b7280" fontWeight="600">&amp; Soma</text>
              <text x="260" y="190" fontSize="10" fill="#6b7280" fontWeight="600">Axon (with myelin sheaths)</text>
              <text x="540" y="190" fontSize="10" fill="#6b7280" fontWeight="600">Terminals</text>
            </svg>
          </div>

          {/* Action Potential Graph */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-lg flex-shrink-0">
            <h3 className="text-[11px] font-semibold mb-1.5 text-gray-800 dark:text-white">Action Potential Graph</h3>
            <svg className="w-full" viewBox="0 0 600 180" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="graph-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid background */}
              {[30, 55, 80, 105, 130].map(y => (
                <line key={y} x1="60" y1={y} x2="540" y2={y} stroke="#e5e7eb" strokeWidth="0.5" />
              ))}
              {[60, 156, 252, 348, 444, 540].map(x => (
                <line key={x} x1={x} y1="20" x2={x} y2="145" stroke="#e5e7eb" strokeWidth="0.5" />
              ))}

              {/* Axes */}
              <line x1="60" y1="20" x2="60" y2="150" stroke="#6b7280" strokeWidth="1.5" />
              <line x1="55" y1="145" x2="545" y2="145" stroke="#6b7280" strokeWidth="1.5" />

              {/* Phase background bands */}
              <rect x="60" y="20" width="96" height="125" fill="#e0e7ff" opacity="0.3" />
              <rect x="156" y="20" width="96" height="125" fill="#fce7f3" opacity="0.3" />
              <rect x="252" y="20" width="144" height="125" fill="#dbeafe" opacity="0.3" />
              <rect x="396" y="20" width="144" height="125" fill="#f3e8ff" opacity="0.3" />

              {/* Phase labels at top */}
              <text x="108" y="16" textAnchor="middle" fontSize="8" fill="#6366f1">Resting</text>
              <text x="204" y="16" textAnchor="middle" fontSize="8" fill="#ec4899">Depolarize</text>
              <text x="324" y="16" textAnchor="middle" fontSize="8" fill="#3b82f6">Repolarize</text>
              <text x="468" y="16" textAnchor="middle" fontSize="8" fill="#8b5cf6">Hyper-pol.</text>

              {/* Threshold line */}
              <line x1="60" y1="75" x2="540" y2="75" stroke="#f97316" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
              <text x="545" y="78" fontSize="8" fill="#f97316">-55mV</text>

              {/* Resting potential line */}
              <line x1="60" y1="107" x2="540" y2="107" stroke="#22c55e" strokeWidth="1" strokeDasharray="4,4" opacity="0.4" />
              <text x="545" y="110" fontSize="8" fill="#22c55e">-70mV</text>

              {/* Voltage curve */}
              <path d={buildVoltagePath()} fill="none" stroke="#7c3aed" strokeWidth="2.5" />

              {/* Current position marker */}
              {progress > 0 && (
                <g>
                  <circle
                    cx={60 + (progress / 100) * 480}
                    cy={110 - ((voltage + 70) / 130) * 100}
                    r="5"
                    fill="#ef4444"
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  {/* Vertical tracking line */}
                  <line
                    x1={60 + (progress / 100) * 480}
                    y1="20"
                    x2={60 + (progress / 100) * 480}
                    y2="145"
                    stroke="#ef4444"
                    strokeWidth="1"
                    strokeDasharray="2,3"
                    opacity="0.4"
                  />
                </g>
              )}

              {/* Y-axis labels */}
              <text x="10" y="34" fontSize="9" fill="#6b7280">+40mV</text>
              <text x="18" y="85" fontSize="9" fill="#6b7280">0mV</text>
              <text x="10" y="113" fontSize="9" fill="#6b7280">-70mV</text>
              <text x="10" y="140" fontSize="9" fill="#6b7280">-90mV</text>

              {/* X-axis label */}
              <text x="300" y="165" textAnchor="middle" fontSize="10" fill="#6b7280">Time (ms)</text>
            </svg>
          </div>

          {/* Synapse Detail View */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-lg flex-shrink-0">
            <h3 className="text-[11px] font-semibold mb-1.5 text-gray-800 dark:text-white">Synaptic Transmission Detail</h3>
            <svg className="w-full" viewBox="0 0 600 130" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="cleft-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fef3c7" />
                  <stop offset="100%" stopColor="#fde68a" />
                </linearGradient>
              </defs>

              {/* Presynaptic terminal */}
              <rect x="20" y="5" width="560" height="35" rx="8" fill="#ddd6fe" stroke="#8b5cf6" strokeWidth="1.5" />
              <text x="300" y="26" textAnchor="middle" fontSize="10" fill="#6d28d9" fontWeight="bold">Presynaptic Terminal</text>

              {/* Vesicles with neurotransmitters */}
              {[80, 160, 240, 360, 440, 520].map((vx, i) => {
                const releasing = progress >= 85 && i < Math.floor((progress - 85) / 2.5);
                const vy = releasing ? 42 + (progress - 85 - i * 2.5) * 1.2 : 22;
                return (
                  <g key={`vesicle-${i}`}>
                    <circle cx={vx} cy={vy} r="8" fill={releasing ? '#f59e0b' : '#c4b5fd'} stroke={releasing ? '#d97706' : '#8b5cf6'} strokeWidth="1" opacity={releasing && vy > 75 ? Math.max(0, 1 - (vy - 75) / 30) : 1} />
                    {/* Small dots inside vesicle */}
                    <circle cx={vx - 2} cy={vy - 2} r="1.5" fill={releasing ? '#fbbf24' : '#a78bfa'} />
                    <circle cx={vx + 2} cy={vy + 1} r="1.5" fill={releasing ? '#fbbf24' : '#a78bfa'} />
                  </g>
                );
              })}

              {/* Synaptic cleft */}
              <rect x="20" y="42" width="560" height="40" fill="url(#cleft-grad)" opacity="0.4" />
              <text x="300" y="66" textAnchor="middle" fontSize="9" fill="#92400e" fontWeight="600">Synaptic Cleft</text>

              {/* Released neurotransmitter molecules floating in cleft */}
              {progress >= 88 && [100, 180, 280, 380, 480].map((nx, i) => {
                const releaseT = Math.max(0, progress - 88 - i * 1.5);
                const ny = 48 + releaseT * 0.8;
                const opacity = releaseT > 0 ? Math.min(releaseT / 5, 1) : 0;
                return opacity > 0 ? (
                  <circle key={`nt-${i}`} cx={nx + Math.sin(releaseT * 0.5 + i) * 6} cy={ny} r="3" fill="#f59e0b" opacity={opacity * (ny < 82 ? 1 : Math.max(0, 1 - (ny - 82) / 10))} />
                ) : null;
              })}

              {/* Postsynaptic membrane */}
              <rect x="20" y="82" width="560" height="8" rx="2" fill="#fecaca" stroke="#ef4444" strokeWidth="1" />

              {/* Receptors on postsynaptic membrane */}
              {[70, 140, 210, 300, 370, 440, 530].map((rx, i) => {
                const bound = progress >= 92 && i < Math.floor((progress - 92) / 1.2);
                return (
                  <g key={`receptor-${i}`}>
                    <rect x={rx - 5} y="82" width="10" height="12" rx="2" fill={bound ? '#22c55e' : '#fca5a5'} stroke={bound ? '#16a34a' : '#ef4444'} strokeWidth="1" />
                    <text x={rx} y="103" textAnchor="middle" fontSize="6" fill={bound ? '#16a34a' : '#9ca3af'}>{bound ? 'Bound' : 'Open'}</text>
                  </g>
                );
              })}

              {/* Postsynaptic cell */}
              <rect x="20" y="94" width="560" height="30" rx="8" fill="#fee2e2" stroke="#ef4444" strokeWidth="1.5" />
              <text x="300" y="114" textAnchor="middle" fontSize="10" fill="#dc2626" fontWeight="bold">Postsynaptic Cell</text>

              {/* Signal propagation indicator */}
              {progress >= 95 && (
                <g opacity={Math.min((progress - 95) / 3, 1)}>
                  <text x="300" y="128" textAnchor="middle" fontSize="8" fill="#16a34a" fontWeight="bold">
                    Signal transmitted — EPSP generated in postsynaptic neuron
                  </text>
                </g>
              )}
            </svg>
          </div>

          {/* Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md px-3 py-2 flex items-center gap-2 flex-shrink-0 sticky bottom-0">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={progress >= 100}
              className="px-3 py-1.5 text-xs font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 flex items-center gap-1.5 transition-colors"
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
            <div className="flex items-center gap-1.5 ml-auto text-xs">
              <span className="text-gray-600 dark:text-gray-400">Speed:</span>
              {[0.5, 1, 2].map(s => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-1 rounded text-xs border transition-colors ${
                    speed === s
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="w-72 flex flex-col gap-2 flex-shrink-0 overflow-y-auto min-h-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 shadow-md">
            <h3 className="text-[11px] font-semibold mb-1.5">Current State</h3>
            <div className="space-y-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded">
                <div className="text-xs text-gray-500 dark:text-gray-400">Phase</div>
                <div className="text-sm font-bold capitalize text-purple-800 dark:text-purple-200">{phase}</div>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                <div className="text-xs text-gray-500 dark:text-gray-400">Membrane Potential</div>
                <div className="text-sm font-bold text-blue-800 dark:text-blue-200">{voltage.toFixed(0)} mV</div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 shadow-md">
            <h3 className="text-[11px] font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Ion Channel Activity</h3>
            <div className="space-y-1.5 text-[11px]">
              <div className={`p-2 rounded flex items-center gap-2 ${
                phase === 'depolarization' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                <div className={`w-3 h-3 rounded-full ${phase === 'depolarization' ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
                <div>
                  <div className="font-semibold">Na+ Channels</div>
                  <div className="text-xs text-gray-500">{phase === 'depolarization' ? 'OPEN - Na+ rushing in' : 'Closed'}</div>
                </div>
              </div>
              <div className={`p-2 rounded flex items-center gap-2 ${
                phase === 'repolarization' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                <div className={`w-3 h-3 rounded-full ${phase === 'repolarization' ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`} />
                <div>
                  <div className="font-semibold">K+ Channels</div>
                  <div className="text-xs text-gray-500">{phase === 'repolarization' ? 'OPEN - K+ flowing out' : 'Closed'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 shadow-md">
            <h3 className="text-[11px] font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Phases</h3>
            <div className="space-y-1.5 text-[11px]">
              <div className={`p-2 rounded transition-colors ${phase === 'resting' ? 'bg-purple-200 dark:bg-purple-900/50 ring-2 ring-purple-400' : 'bg-gray-100 dark:bg-gray-700'}`}>
                <div className="font-semibold">1. Resting (-70mV)</div>
                <div className="text-xs text-gray-500">K+ leak channels maintain resting potential. Na+/K+ pump active.</div>
              </div>
              <div className={`p-2 rounded transition-colors ${phase === 'depolarization' ? 'bg-purple-200 dark:bg-purple-900/50 ring-2 ring-purple-400' : 'bg-gray-100 dark:bg-gray-700'}`}>
                <div className="font-semibold">2. Depolarization (+40mV)</div>
                <div className="text-xs text-gray-500">Voltage-gated Na+ channels open, Na+ rushes in, membrane becomes positive.</div>
              </div>
              <div className={`p-2 rounded transition-colors ${phase === 'repolarization' ? 'bg-purple-200 dark:bg-purple-900/50 ring-2 ring-purple-400' : 'bg-gray-100 dark:bg-gray-700'}`}>
                <div className="font-semibold">3. Repolarization</div>
                <div className="text-xs text-gray-500">Na+ channels inactivate, K+ channels open, K+ flows out.</div>
              </div>
              <div className={`p-2 rounded transition-colors ${phase === 'hyperpolarization' ? 'bg-purple-200 dark:bg-purple-900/50 ring-2 ring-purple-400' : 'bg-gray-100 dark:bg-gray-700'}`}>
                <div className="font-semibold">4. Hyperpolarization</div>
                <div className="text-xs text-gray-500">K+ channels slow to close, overshoots past resting potential to ~-90mV.</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 shadow-md">
            <h3 className="text-[11px] font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Membrane Cross-Section</h3>
            <svg className="w-full" viewBox="0 0 240 100" preserveAspectRatio="xMidYMid meet">
              {/* Extracellular */}
              <text x="120" y="12" textAnchor="middle" fontSize="8" fill="#6b7280">Extracellular (+)</text>
              {/* Lipid bilayer */}
              {Array.from({ length: 16 }, (_, i) => {
                const x = 12 + i * 15;
                return (
                  <g key={`lipid-${i}`}>
                    {/* Outer leaflet */}
                    <circle cx={x} cy="30" r="4" fill="#93c5fd" stroke="#3b82f6" strokeWidth="0.5" />
                    <line x1={x} y1="34" x2={x - 2} y2="46" stroke="#fbbf24" strokeWidth="1.5" />
                    <line x1={x} y1="34" x2={x + 2} y2="46" stroke="#fbbf24" strokeWidth="1.5" />
                    {/* Inner leaflet */}
                    <line x1={x - 2} y1="54" x2={x} y2="66" stroke="#fbbf24" strokeWidth="1.5" />
                    <line x1={x + 2} y1="54" x2={x} y2="66" stroke="#fbbf24" strokeWidth="1.5" />
                    <circle cx={x} cy="70" r="4" fill="#93c5fd" stroke="#3b82f6" strokeWidth="0.5" />
                  </g>
                );
              })}
              {/* Na+ channel */}
              <rect x="55" y="22" width="16" height="56" rx="3" fill={phase === 'depolarization' ? '#fee2e2' : '#f3f4f6'} stroke={phase === 'depolarization' ? '#ef4444' : '#9ca3af'} strokeWidth="1.5" />
              <text x="63" y="53" textAnchor="middle" fontSize="7" fill={phase === 'depolarization' ? '#ef4444' : '#6b7280'} fontWeight="bold">Na+</text>
              {phase === 'depolarization' && (
                <polygon points="63,25 60,32 66,32" fill="#ef4444" />
              )}
              {/* K+ channel */}
              <rect x="145" y="22" width="16" height="56" rx="3" fill={phase === 'repolarization' ? '#dbeafe' : '#f3f4f6'} stroke={phase === 'repolarization' ? '#3b82f6' : '#9ca3af'} strokeWidth="1.5" />
              <text x="153" y="53" textAnchor="middle" fontSize="7" fill={phase === 'repolarization' ? '#3b82f6' : '#6b7280'} fontWeight="bold">K+</text>
              {phase === 'repolarization' && (
                <polygon points="153,75 150,68 156,68" fill="#3b82f6" />
              )}
              {/* Intracellular */}
              <text x="120" y="92" textAnchor="middle" fontSize="8" fill="#6b7280">Intracellular (-)</text>
            </svg>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-2.5">
            <h3 className="text-[11px] font-semibold mb-1.5 flex items-center gap-1.5 text-purple-800 dark:text-purple-300">
              <Info className="h-3 w-3" />
              Key Concepts
            </h3>
            <ul className="text-[10px] space-y-1 text-gray-700 dark:text-gray-300">
              <li>* All-or-nothing: signal fires fully or not at all</li>
              <li>* Threshold: -55mV must be reached to trigger</li>
              <li>* Saltatory conduction: signal jumps between nodes</li>
              <li>* Na+/K+ pump: 3 Na+ out, 2 K+ in per cycle</li>
              <li>* Refractory period prevents backward propagation</li>
              <li>* Myelin sheaths increase conduction velocity</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
