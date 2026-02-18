import React, { useState, useEffect } from 'react';
import { Dna, Play, Pause, RotateCcw, Info } from 'lucide-react';

export const DNAReplication: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showLabels, setShowLabels] = useState(true);

  const basePairs = ['A-T', 'T-A', 'G-C', 'C-G', 'A-T', 'G-C', 'T-A', 'C-G'];

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setIsPlaying(false);
          return 100;
        }
        return prev + 1;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const getBaseColor = (base: string) => {
    switch (base) {
      case 'A': return '#ff6b6b';
      case 'T': return '#4ecdc4';
      case 'G': return '#ffe66d';
      case 'C': return '#95e1d3';
      default: return '#ccc';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Dna className="h-6 w-6 text-blue-600" />
          DNA Replication & Transcription
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Watch DNA unzip and replicate
        </p>
      </div>

      <div className="flex-1 flex gap-6">
        {/* Visualization */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
            <svg width="500" height="400" viewBox="0 0 500 400">
              {/* Original DNA strand */}
              {basePairs.map((pair, i) => {
                const [base1, base2] = pair.split('-');
                const y = 50 + i * 40;
                const separation = (progress / 100) * 100;
                const x1 = 150 - separation;
                const x2 = 250 + separation;

                return (
                  <g key={i}>
                    {/* Left strand backbone */}
                    <line
                      x1={x1}
                      y1={y}
                      x2={x1}
                      y2={y + 40}
                      stroke="#666"
                      strokeWidth="3"
                    />
                    {/* Right strand backbone */}
                    <line
                      x1={x2}
                      y1={y}
                      x2={x2}
                      y2={y + 40}
                      stroke="#666"
                      strokeWidth="3"
                    />

                    {/* Base pairs */}
                    {progress < 100 && (
                      <line
                        x1={x1 + 20}
                        y1={y + 20}
                        x2={x2 - 20}
                        y2={y + 20}
                        stroke="#ccc"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        opacity={1 - progress / 100}
                      />
                    )}

                    {/* Left base */}
                    <circle
                      cx={x1 + 20}
                      cy={y + 20}
                      r="15"
                      fill={getBaseColor(base1)}
                      stroke="#333"
                      strokeWidth="2"
                    />
                    {showLabels && (
                      <text
                        x={x1 + 20}
                        y={y + 25}
                        textAnchor="middle"
                        fontSize="12"
                        fontWeight="bold"
                        fill="#000"
                      >
                        {base1}
                      </text>
                    )}

                    {/* Right base */}
                    <circle
                      cx={x2 - 20}
                      cy={y + 20}
                      r="15"
                      fill={getBaseColor(base2)}
                      stroke="#333"
                      strokeWidth="2"
                    />
                    {showLabels && (
                      <text
                        x={x2 - 20}
                        y={y + 25}
                        textAnchor="middle"
                        fontSize="12"
                        fontWeight="bold"
                        fill="#000"
                      >
                        {base2}
                      </text>
                    )}

                    {/* New complementary bases forming */}
                    {progress > 20 && (
                      <>
                        <circle
                          cx={x1 - 40}
                          cy={y + 20}
                          r="12"
                          fill={getBaseColor(base2)}
                          stroke="#333"
                          strokeWidth="2"
                          opacity={Math.min((progress - 20) / 80, 1)}
                        />
                        <circle
                          cx={x2 + 40}
                          cy={y + 20}
                          r="12"
                          fill={getBaseColor(base1)}
                          stroke="#333"
                          strokeWidth="2"
                          opacity={Math.min((progress - 20) / 80, 1)}
                        />
                      </>
                    )}
                  </g>
                );
              })}

              {/* Helicase enzyme */}
              {progress < 100 && (
                <g>
                  <circle
                    cx="200"
                    cy={50 + (progress / 100) * 280}
                    r="20"
                    fill="#ff9800"
                    opacity="0.8"
                  />
                  <text
                    x="200"
                    y={55 + (progress / 100) * 280}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#fff"
                    fontWeight="bold"
                  >
                    Helicase
                  </text>
                </g>
              )}
            </svg>

            <div className="mt-4 text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Replication Progress: {progress}%
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={progress >= 100}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={() => {
                setProgress(0);
                setIsPlaying(false);
              }}
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
            <h3 className="font-semibold mb-3">Display Options</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Show Base Labels</span>
            </label>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Base Pairing Rules</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: getBaseColor('A') }} />
                <span>Adenine (A) pairs with</span>
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: getBaseColor('T') }} />
                <span>Thymine (T)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: getBaseColor('G') }} />
                <span>Guanine (G) pairs with</span>
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: getBaseColor('C') }} />
                <span>Cytosine (C)</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Process Steps</h3>
            <ol className="text-sm space-y-2 list-decimal list-inside">
              <li className={progress >= 0 ? 'text-blue-600 font-semibold' : ''}>
                Helicase unwinds the double helix
              </li>
              <li className={progress >= 30 ? 'text-blue-600 font-semibold' : ''}>
                DNA strands separate
              </li>
              <li className={progress >= 60 ? 'text-blue-600 font-semibold' : ''}>
                Complementary bases attach
              </li>
              <li className={progress >= 100 ? 'text-blue-600 font-semibold' : ''}>
                Two identical DNA molecules form
              </li>
            </ol>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-blue-800 dark:text-blue-300">
              <Info className="h-4 w-4" />
              Key Concepts
            </h3>
            <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
              <li>• DNA replication is semi-conservative</li>
              <li>• Each strand serves as a template</li>
              <li>• Helicase enzyme unzips the DNA</li>
              <li>• DNA polymerase adds new nucleotides</li>
              <li>• Results in two identical DNA molecules</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
