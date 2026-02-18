import React, { useState, useEffect } from 'react';
import { Brain, Play, Pause, RotateCcw, Info, Zap } from 'lucide-react';

export const NeuronSignal: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'resting' | 'depolarization' | 'repolarization' | 'hyperpolarization'>('resting');
  const [voltage, setVoltage] = useState(-70);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgress(p => {
        const newProgress = p + 2;
        if (newProgress >= 100) {
          setIsPlaying(false);
          return 100;
        }

        // Update voltage and phase based on progress
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
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const reset = () => {
    setProgress(0);
    setPhase('resting');
    setVoltage(-70);
    setIsPlaying(false);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Brain className="h-6 w-6 text-purple-600" />
          Neuron Signal Transmission
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Action potential propagation
        </p>
      </div>

      <div className="flex-1 flex gap-6">
        <div className="flex-1 space-y-4">
          {/* Neuron Visualization */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <svg width="600" height="150" viewBox="0 0 600 150">
              {/* Axon */}
              <rect x="50" y="60" width="500" height="30" fill="#e0e0e0" stroke="#666" strokeWidth="2" rx="15" />
              
              {/* Dendrites */}
              <path d="M 50 75 L 20 50 M 50 75 L 20 75 M 50 75 L 20 100" stroke="#666" strokeWidth="2" fill="none" />
              
              {/* Axon terminals */}
              <path d="M 550 75 L 580 50 M 550 75 L 580 75 M 550 75 L 580 100" stroke="#666" strokeWidth="2" fill="none" />
              {[580, 580, 580].map((x, i) => (
                <circle key={i} cx={x} cy={50 + i * 25} r="5" fill="#ff6b6b" />
              ))}

              {/* Signal propagation */}
              {progress > 0 && (
                <>
                  <circle
                    cx={50 + (progress / 100) * 500}
                    cy="75"
                    r="15"
                    fill="#ffeb3b"
                    opacity="0.8"
                  >
                    <animate attributeName="r" values="15;25;15" dur="0.5s" repeatCount="indefinite" />
                  </circle>
                  <Zap
                    x={50 + (progress / 100) * 500 - 10}
                    y="65"
                    className="h-5 w-5 text-yellow-500"
                  />
                </>
              )}

              {/* Myelin sheaths */}
              {[150, 250, 350, 450].map(x => (
                <rect key={x} x={x} y="55" width="40" height="40" fill="#4ecdc4" opacity="0.6" rx="5" />
              ))}

              {/* Labels */}
              <text x="20" y="130" fontSize="12" fill="#666">Dendrites</text>
              <text x="280" y="130" fontSize="12" fill="#666">Axon</text>
              <text x="540" y="130" fontSize="12" fill="#666">Terminals</text>
            </svg>
          </div>

          {/* Action Potential Graph */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h3 className="font-semibold mb-3">Action Potential</h3>
            <svg width="600" height="200" viewBox="0 0 600 200">
              {/* Grid */}
              {[0, 50, 100, 150, 200].map(y => (
                <line key={y} x1="50" y1={y} x2="550" y2={y} stroke="#e0e0e0" strokeWidth="1" />
              ))}
              
              {/* Axes */}
              <line x1="50" y1="100" x2="550" y2="100" stroke="#666" strokeWidth="2" />
              <line x1="50" y1="20" x2="50" y2="180" stroke="#666" strokeWidth="2" />

              {/* Voltage curve */}
              <path
                d="M 50,100 L 150,100 L 200,20 L 300,100 L 400,140 L 500,100 L 550,100"
                fill="none"
                stroke="#2196F3"
                strokeWidth="3"
              />

              {/* Current position marker */}
              {progress > 0 && (
                <circle
                  cx={50 + (progress / 100) * 500}
                  cy={100 - voltage * 0.8}
                  r="6"
                  fill="#ff6b6b"
                />
              )}

              {/* Labels */}
              <text x="10" y="25" fontSize="12" fill="#666">+40mV</text>
              <text x="10" y="105" fontSize="12" fill="#666">0mV</text>
              <text x="10" y="145" fontSize="12" fill="#666">-70mV</text>
              <text x="280" y="195" fontSize="12" fill="#666">Time (ms)</text>

              {/* Phase labels */}
              <text x="100" y="120" fontSize="10" fill="#666">Resting</text>
              <text x="180" y="40" fontSize="10" fill="#666">Depolarization</text>
              <text x="280" y="120" fontSize="10" fill="#666">Repolarization</text>
              <text x="400" y="160" fontSize="10" fill="#666">Hyperpolarization</text>
            </svg>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={progress >= 100}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={reset}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Info Panel */}
        <div className="w-80 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Current State</h3>
            <div className="space-y-2">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded">
                <div className="text-sm text-gray-600 dark:text-gray-400">Phase:</div>
                <div className="text-lg font-bold capitalize">{phase}</div>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded">
                <div className="text-sm text-gray-600 dark:text-gray-400">Membrane Potential:</div>
                <div className="text-lg font-bold">{voltage.toFixed(0)} mV</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Phases</h3>
            <div className="space-y-2 text-sm">
              <div className={`p-2 rounded ${phase === 'resting' ? 'bg-purple-200 dark:bg-purple-900/50' : 'bg-gray-100 dark:bg-gray-700'}`}>
                <div className="font-semibold">1. Resting (-70mV)</div>
                <div className="text-xs">Na⁺ outside, K⁺ inside</div>
              </div>
              <div className={`p-2 rounded ${phase === 'depolarization' ? 'bg-purple-200 dark:bg-purple-900/50' : 'bg-gray-100 dark:bg-gray-700'}`}>
                <div className="font-semibold">2. Depolarization (+40mV)</div>
                <div className="text-xs">Na⁺ channels open, Na⁺ rushes in</div>
              </div>
              <div className={`p-2 rounded ${phase === 'repolarization' ? 'bg-purple-200 dark:bg-purple-900/50' : 'bg-gray-100 dark:bg-gray-700'}`}>
                <div className="font-semibold">3. Repolarization</div>
                <div className="text-xs">K⁺ channels open, K⁺ flows out</div>
              </div>
              <div className={`p-2 rounded ${phase === 'hyperpolarization' ? 'bg-purple-200 dark:bg-purple-900/50' : 'bg-gray-100 dark:bg-gray-700'}`}>
                <div className="font-semibold">4. Hyperpolarization</div>
                <div className="text-xs">Overshoot, then return to resting</div>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-purple-800 dark:text-purple-300">
              <Info className="h-4 w-4" />
              Key Concepts
            </h3>
            <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
              <li>• All-or-nothing response</li>
              <li>• Sodium-potassium pump maintains gradient</li>
              <li>• Myelin sheaths speed up transmission</li>
              <li>• Refractory period prevents backflow</li>
              <li>• Neurotransmitters cross synapse</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
