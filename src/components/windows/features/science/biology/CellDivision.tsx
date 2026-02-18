import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Info } from 'lucide-react';

type Phase = 'interphase' | 'prophase' | 'metaphase' | 'anaphase' | 'telophase' | 'cytokinesis';

export const CellDivision: React.FC = () => {
  const [currentPhase, setCurrentPhase] = useState<Phase>('interphase');
  const [isPlaying, setIsPlaying] = useState(false);
  const [divisionType, setDivisionType] = useState<'mitosis' | 'meiosis'>('mitosis');

  const phases: { phase: Phase; name: string; description: string; duration: number }[] = [
    { phase: 'interphase', name: 'Interphase', description: 'Cell grows and DNA replicates', duration: 3000 },
    { phase: 'prophase', name: 'Prophase', description: 'Chromatin condenses into chromosomes', duration: 2000 },
    { phase: 'metaphase', name: 'Metaphase', description: 'Chromosomes align at cell equator', duration: 2000 },
    { phase: 'anaphase', name: 'Anaphase', description: 'Sister chromatids separate', duration: 2000 },
    { phase: 'telophase', name: 'Telophase', description: 'Nuclear envelopes reform', duration: 2000 },
    { phase: 'cytokinesis', name: 'Cytokinesis', description: 'Cell divides into two', duration: 2000 }
  ];

  useEffect(() => {
    if (!isPlaying) return;

    const currentIndex = phases.findIndex(p => p.phase === currentPhase);
    const currentPhaseDuration = phases[currentIndex].duration;

    const timer = setTimeout(() => {
      const nextIndex = (currentIndex + 1) % phases.length;
      setCurrentPhase(phases[nextIndex].phase);
    }, currentPhaseDuration);

    return () => clearTimeout(timer);
  }, [isPlaying, currentPhase]);

  const renderCell = () => {
    const cellSize = 200;
    const centerX = cellSize / 2;
    const centerY = cellSize / 2;

    switch (currentPhase) {
      case 'interphase':
        return (
          <svg width={cellSize} height={cellSize}>
            {/* Cell membrane */}
            <circle cx={centerX} cy={centerY} r={90} fill="#e3f2fd" stroke="#1976d2" strokeWidth="3" />
            {/* Nucleus */}
            <circle cx={centerX} cy={centerY} r={40} fill="#bbdefb" stroke="#0d47a1" strokeWidth="2" />
            {/* DNA (loose chromatin) */}
            <circle cx={centerX - 10} cy={centerY - 10} r={3} fill="#0d47a1" />
            <circle cx={centerX + 10} cy={centerY + 10} r={3} fill="#0d47a1" />
            <circle cx={centerX} cy={centerY + 15} r={3} fill="#0d47a1" />
          </svg>
        );
      
      case 'prophase':
        return (
          <svg width={cellSize} height={cellSize}>
            <circle cx={centerX} cy={centerY} r={90} fill="#e3f2fd" stroke="#1976d2" strokeWidth="3" />
            {/* Condensed chromosomes */}
            <rect x={centerX - 30} y={centerY - 20} width="8" height="40" fill="#0d47a1" rx="2" />
            <rect x={centerX - 15} y={centerY - 20} width="8" height="40" fill="#0d47a1" rx="2" />
            <rect x={centerX + 7} y={centerY - 20} width="8" height="40" fill="#0d47a1" rx="2" />
            <rect x={centerX + 22} y={centerY - 20} width="8" height="40" fill="#0d47a1" rx="2" />
            {/* Spindle fibers forming */}
            <line x1={centerX} y1={20} x2={centerX} y2={centerY - 30} stroke="#666" strokeWidth="1" strokeDasharray="2,2" />
            <line x1={centerX} y1={180} x2={centerX} y2={centerY + 30} stroke="#666" strokeWidth="1" strokeDasharray="2,2" />
          </svg>
        );
      
      case 'metaphase':
        return (
          <svg width={cellSize} height={cellSize}>
            <circle cx={centerX} cy={centerY} r={90} fill="#e3f2fd" stroke="#1976d2" strokeWidth="3" />
            {/* Chromosomes at metaphase plate */}
            <rect x={centerX - 35} y={centerY - 5} width="8" height="30" fill="#0d47a1" rx="2" />
            <rect x={centerX - 20} y={centerY - 5} width="8" height="30" fill="#0d47a1" rx="2" />
            <rect x={centerX + 12} y={centerY - 5} width="8" height="30" fill="#0d47a1" rx="2" />
            <rect x={centerX + 27} y={centerY - 5} width="8" height="30" fill="#0d47a1" rx="2" />
            {/* Spindle fibers */}
            <line x1={centerX} y1={20} x2={centerX - 30} y2={centerY} stroke="#666" strokeWidth="2" />
            <line x1={centerX} y1={20} x2={centerX + 30} y2={centerY} stroke="#666" strokeWidth="2" />
            <line x1={centerX} y1={180} x2={centerX - 30} y2={centerY} stroke="#666" strokeWidth="2" />
            <line x1={centerX} y1={180} x2={centerX + 30} y2={centerY} stroke="#666" strokeWidth="2" />
          </svg>
        );
      
      case 'anaphase':
        return (
          <svg width={cellSize} height={cellSize}>
            <circle cx={centerX} cy={centerY} r={90} fill="#e3f2fd" stroke="#1976d2" strokeWidth="3" />
            {/* Separating chromatids */}
            <rect x={centerX - 50} y={centerY - 40} width="6" height="25" fill="#0d47a1" rx="2" />
            <rect x={centerX - 38} y={centerY - 40} width="6" height="25" fill="#0d47a1" rx="2" />
            <rect x={centerX + 32} y={centerY + 15} width="6" height="25" fill="#0d47a1" rx="2" />
            <rect x={centerX + 44} y={centerY + 15} width="6" height="25" fill="#0d47a1" rx="2" />
            {/* Spindle fibers pulling */}
            <line x1={centerX} y1={20} x2={centerX - 45} y2={centerY - 30} stroke="#666" strokeWidth="2" />
            <line x1={centerX} y1={180} x2={centerX + 40} y2={centerY + 30} stroke="#666" strokeWidth="2" />
          </svg>
        );
      
      case 'telophase':
        return (
          <svg width={cellSize} height={cellSize}>
            <ellipse cx={centerX} cy={centerY} rx={90} ry={95} fill="#e3f2fd" stroke="#1976d2" strokeWidth="3" />
            {/* Two nuclei forming */}
            <circle cx={centerX} cy={centerY - 40} r={30} fill="#bbdefb" stroke="#0d47a1" strokeWidth="2" />
            <circle cx={centerX} cy={centerY + 40} r={30} fill="#bbdefb" stroke="#0d47a1" strokeWidth="2" />
            {/* Chromosomes decondensing */}
            <circle cx={centerX - 10} cy={centerY - 40} r={2} fill="#0d47a1" />
            <circle cx={centerX + 10} cy={centerY - 40} r={2} fill="#0d47a1" />
            <circle cx={centerX - 10} cy={centerY + 40} r={2} fill="#0d47a1" />
            <circle cx={centerX + 10} cy={centerY + 40} r={2} fill="#0d47a1" />
          </svg>
        );
      
      case 'cytokinesis':
        return (
          <svg width={cellSize} height={cellSize}>
            {/* Two separate cells */}
            <circle cx={centerX - 30} cy={centerY} r={60} fill="#e3f2fd" stroke="#1976d2" strokeWidth="3" />
            <circle cx={centerX + 30} cy={centerY} r={60} fill="#e3f2fd" stroke="#1976d2" strokeWidth="3" />
            {/* Nuclei */}
            <circle cx={centerX - 30} cy={centerY} r={25} fill="#bbdefb" stroke="#0d47a1" strokeWidth="2" />
            <circle cx={centerX + 30} cy={centerY} r={25} fill="#bbdefb" stroke="#0d47a1" strokeWidth="2" />
          </svg>
        );
    }
  };

  const currentPhaseInfo = phases.find(p => p.phase === currentPhase)!;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Cell Division Animation</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Watch {divisionType} in action
        </p>
      </div>

      <div className="flex-1 flex gap-6">
        {/* Visualization */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
            {renderCell()}
            <div className="mt-4 text-center">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">{currentPhaseInfo.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{currentPhaseInfo.description}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={() => setCurrentPhase('interphase')}
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
            <h3 className="font-semibold mb-3">Division Type</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setDivisionType('mitosis')}
                className={`flex-1 py-2 rounded ${divisionType === 'mitosis' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                Mitosis
              </button>
              <button
                onClick={() => setDivisionType('meiosis')}
                className={`flex-1 py-2 rounded ${divisionType === 'meiosis' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                Meiosis
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Phases</h3>
            <div className="space-y-2">
              {phases.map(phase => (
                <button
                  key={phase.phase}
                  onClick={() => setCurrentPhase(phase.phase)}
                  className={`w-full text-left p-3 rounded transition-colors ${
                    currentPhase === phase.phase
                      ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-600'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="font-medium">{phase.name}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{phase.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-green-800 dark:text-green-300">
              <Info className="h-4 w-4" />
              Key Concepts
            </h3>
            <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
              <li>• Mitosis produces 2 identical daughter cells</li>
              <li>• Meiosis produces 4 genetically unique cells</li>
              <li>• DNA replicates during interphase</li>
              <li>• Spindle fibers pull chromosomes apart</li>
              <li>• Cytokinesis divides the cytoplasm</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
