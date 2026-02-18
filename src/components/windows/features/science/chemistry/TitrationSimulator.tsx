import React, { useState, useEffect } from 'react';
import { Beaker, Droplet, TrendingUp, RotateCcw, Info } from 'lucide-react';

export const TitrationSimulator: React.FC = () => {
  const [volume, setVolume] = useState(0);
  const [pH, setPH] = useState(1);
  const [isDropping, setIsDropping] = useState(false);
  const [equivalencePoint, setEquivalencePoint] = useState(25);
  const [showIndicator, setShowIndicator] = useState(true);

  const acids = [
    { name: 'HCl (Strong)', pKa: -7, color: '#ff4444' },
    { name: 'CH₃COOH (Weak)', pKa: 4.76, color: '#ff8844' },
    { name: 'H₃PO₄ (Polyprotic)', pKa: 2.15, color: '#ffaa44' }
  ];

  const [selectedAcid, setSelectedAcid] = useState(acids[0]);

  useEffect(() => {
    // Calculate pH based on volume of base added
    if (volume < equivalencePoint) {
      // Before equivalence point
      const ratio = volume / equivalencePoint;
      setPH(1 + ratio * 6);
    } else if (volume === equivalencePoint) {
      // At equivalence point
      setPH(7);
    } else {
      // After equivalence point
      const excess = volume - equivalencePoint;
      setPH(7 + Math.min(excess / 5, 6));
    }
  }, [volume, equivalencePoint]);

  const getIndicatorColor = () => {
    if (!showIndicator) return '#4A90E2';
    
    if (pH < 4) return '#ff4444'; // Red
    if (pH < 6) return '#ff8844'; // Orange
    if (pH < 8) return '#ffff44'; // Yellow
    if (pH < 10) return '#88ff44'; // Light green
    return '#4444ff'; // Blue
  };

  const addBase = () => {
    if (volume < 50) {
      setIsDropping(true);
      setTimeout(() => {
        setVolume(v => Math.min(v + 0.5, 50));
        setIsDropping(false);
      }, 100);
    }
  };

  const reset = () => {
    setVolume(0);
    setPH(1);
  };

  const fluidHeight = (volume / 50) * 200;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Beaker className="h-6 w-6 text-blue-600" />
          Titration Simulator
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Acid-base titration with color-changing indicators
        </p>
      </div>

      <div className="flex-1 flex gap-6">
        {/* Visualization */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Burette */}
          <div className="relative mb-4">
            <div className="w-12 h-64 bg-white dark:bg-gray-700 border-2 border-gray-400 rounded-b-lg relative overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0 bg-blue-400 transition-all duration-300"
                   style={{ height: `${(50 - volume) / 50 * 100}%` }} />
              {/* Scale markings */}
              {[0, 10, 20, 30, 40, 50].map(mark => (
                <div key={mark} className="absolute left-0 right-0 border-t border-gray-300"
                     style={{ bottom: `${mark / 50 * 100}%` }}>
                  <span className="absolute -left-8 text-xs text-gray-600 dark:text-gray-400">
                    {50 - mark}
                  </span>
                </div>
              ))}
            </div>
            {/* Droplet animation */}
            {isDropping && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full">
                <Droplet className="h-4 w-4 text-blue-400 animate-bounce" />
              </div>
            )}
          </div>

          {/* Beaker */}
          <div className="relative">
            <div className="w-48 h-64 bg-white/50 dark:bg-gray-700/50 border-4 border-gray-400 rounded-b-3xl relative overflow-hidden">
              {/* Solution */}
              <div 
                className="absolute bottom-0 left-0 right-0 transition-all duration-300"
                style={{ 
                  height: `${fluidHeight}px`,
                  backgroundColor: getIndicatorColor(),
                  opacity: 0.7
                }}
              />
              {/* Volume markings */}
              {[50, 100, 150, 200].map(mark => (
                <div key={mark} className="absolute left-0 right-0 border-t border-gray-400/50"
                     style={{ bottom: `${mark}px` }}>
                  <span className="absolute -right-12 text-xs text-gray-600 dark:text-gray-400">
                    {mark / 4} mL
                  </span>
                </div>
              ))}
            </div>
            <div className="text-center mt-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              pH: {pH.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="w-80 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Beaker className="h-4 w-4" />
              Acid Selection
            </h3>
            <select
              value={selectedAcid.name}
              onChange={(e) => {
                const acid = acids.find(a => a.name === e.target.value);
                if (acid) setSelectedAcid(acid);
                reset();
              }}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            >
              {acids.map(acid => (
                <option key={acid.name} value={acid.name}>{acid.name}</option>
              ))}
            </select>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Controls</h3>
            <div className="space-y-3">
              <button
                onClick={addBase}
                disabled={volume >= 50}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Droplet className="h-4 w-4" />
                Add 0.5 mL NaOH
              </button>
              
              <button
                onClick={reset}
                className="w-full py-2 px-4 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center justify-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showIndicator}
                  onChange={(e) => setShowIndicator(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm">Show Indicator Color</span>
              </label>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Current Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Volume Added:</span>
                <span className="font-mono">{volume.toFixed(1)} mL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">pH:</span>
                <span className="font-mono">{pH.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Equivalence:</span>
                <span className="font-mono">{equivalencePoint} mL</span>
              </div>
              {Math.abs(volume - equivalencePoint) < 1 && (
                <div className="mt-2 p-2 bg-green-100 dark:bg-green-900/30 rounded text-green-800 dark:text-green-300 text-xs">
                  ⚡ Near equivalence point!
                </div>
              )}
            </div>
          </div>

          {/* Titration Curve */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Titration Curve
            </h3>
            <div className="h-32 border border-gray-300 dark:border-gray-600 rounded relative">
              <svg className="w-full h-full">
                {/* Draw curve */}
                <path
                  d={`M 0,120 ${Array.from({ length: 51 }, (_, i) => {
                    const v = i;
                    let p;
                    if (v < equivalencePoint) {
                      p = 1 + (v / equivalencePoint) * 6;
                    } else if (v === equivalencePoint) {
                      p = 7;
                    } else {
                      p = 7 + Math.min((v - equivalencePoint) / 5, 6);
                    }
                    const x = (v / 50) * 100;
                    const y = 120 - (p / 14) * 120;
                    return `L ${x}%,${y}`;
                  }).join(' ')}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-blue-600"
                />
                {/* Current point */}
                <circle
                  cx={`${(volume / 50) * 100}%`}
                  cy={120 - (pH / 14) * 120}
                  r="4"
                  fill="red"
                />
              </svg>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-blue-800 dark:text-blue-300">
              <Info className="h-4 w-4" />
              Learning Points
            </h3>
            <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
              <li>• Watch pH change as base is added</li>
              <li>• Observe color changes with indicator</li>
              <li>• Identify the equivalence point</li>
              <li>• Compare strong vs weak acids</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
