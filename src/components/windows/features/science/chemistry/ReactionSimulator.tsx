import React, { useState, useRef, useEffect } from 'react';
import { Play, RotateCcw, Flame, Droplet, Zap, Leaf, Beaker, FlaskConical } from 'lucide-react';

interface Reaction {
  name: string;
  type: string;
  reactants: string[];
  products: string[];
  equation: string;
  description: string;
  icon: React.ReactNode;
  energyChange: string;
}

const reactions: Reaction[] = [
  {
    name: 'Combustion of Methane',
    type: 'Combustion',
    reactants: ['CH₄', '2O₂'],
    products: ['CO₂', '2H₂O'],
    equation: 'CH₄ + 2O₂ → CO₂ + 2H₂O',
    description: 'Methane burns in oxygen to produce carbon dioxide and water, releasing energy.',
    icon: <Flame className="h-4 w-4" />,
    energyChange: 'Exothermic (-890 kJ/mol)'
  },
  {
    name: 'Neutralization',
    type: 'Acid-Base',
    reactants: ['HCl', 'NaOH'],
    products: ['NaCl', 'H₂O'],
    equation: 'HCl + NaOH → NaCl + H₂O',
    description: 'Hydrochloric acid reacts with sodium hydroxide to form salt and water.',
    icon: <Droplet className="h-4 w-4" />,
    energyChange: 'Exothermic (-57.3 kJ/mol)'
  },
  {
    name: 'Photosynthesis',
    type: 'Synthesis',
    reactants: ['6CO₂', '6H₂O'],
    products: ['C₆H₁₂O₆', '6O₂'],
    equation: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂',
    description: 'Plants convert carbon dioxide and water into glucose and oxygen using sunlight.',
    icon: <Leaf className="h-4 w-4" />,
    energyChange: 'Endothermic (+2800 kJ/mol)'
  },
  {
    name: 'Electrolysis of Water',
    type: 'Decomposition',
    reactants: ['2H₂O'],
    products: ['2H₂', 'O₂'],
    equation: '2H₂O → 2H₂ + O₂',
    description: 'Electric current splits water into hydrogen and oxygen gases.',
    icon: <Zap className="h-4 w-4" />,
    energyChange: 'Endothermic (+572 kJ/mol)'
  },
  {
    name: 'Rusting of Iron',
    type: 'Oxidation',
    reactants: ['4Fe', '3O₂'],
    products: ['2Fe₂O₃'],
    equation: '4Fe + 3O₂ → 2Fe₂O₃',
    description: 'Iron reacts with oxygen to form iron oxide (rust).',
    icon: <Beaker className="h-4 w-4" />,
    energyChange: 'Exothermic (-824 kJ/mol)'
  },
  {
    name: 'Synthesis of Ammonia',
    type: 'Synthesis',
    reactants: ['N₂', '3H₂'],
    products: ['2NH₃'],
    equation: 'N₂ + 3H₂ → 2NH₃',
    description: 'Nitrogen and hydrogen combine to form ammonia (Haber process).',
    icon: <FlaskConical className="h-4 w-4" />,
    energyChange: 'Exothermic (-92 kJ/mol)'
  },
  {
    name: 'Decomposition of Hydrogen Peroxide',
    type: 'Decomposition',
    reactants: ['2H₂O₂'],
    products: ['2H₂O', 'O₂'],
    equation: '2H₂O₂ → 2H₂O + O₂',
    description: 'Hydrogen peroxide breaks down into water and oxygen gas.',
    icon: <Droplet className="h-4 w-4" />,
    energyChange: 'Exothermic (-98 kJ/mol)'
  },
  {
    name: 'Respiration',
    type: 'Combustion',
    reactants: ['C₆H₁₂O₆', '6O₂'],
    products: ['6CO₂', '6H₂O'],
    equation: 'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O',
    description: 'Glucose is oxidized in cells to produce energy, carbon dioxide, and water.',
    icon: <Flame className="h-4 w-4" />,
    energyChange: 'Exothermic (-2800 kJ/mol)'
  },
  {
    name: 'Formation of Water',
    type: 'Synthesis',
    reactants: ['2H₂', 'O₂'],
    products: ['2H₂O'],
    equation: '2H₂ + O₂ → 2H₂O',
    description: 'Hydrogen and oxygen combine explosively to form water.',
    icon: <Flame className="h-4 w-4" />,
    energyChange: 'Exothermic (-572 kJ/mol)'
  },
  {
    name: 'Precipitation',
    type: 'Double Displacement',
    reactants: ['AgNO₃', 'NaCl'],
    products: ['AgCl↓', 'NaNO₃'],
    equation: 'AgNO₃ + NaCl → AgCl↓ + NaNO₃',
    description: 'Silver nitrate reacts with sodium chloride to form a white precipitate of silver chloride.',
    icon: <Beaker className="h-4 w-4" />,
    energyChange: 'Exothermic (-65 kJ/mol)'
  }
];

export const ReactionSimulator: React.FC = () => {
  const [selectedReaction, setSelectedReaction] = useState(reactions[0]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(2);
  const intervalRef = useRef<number | undefined>();

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (isAnimating && progress >= 100) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsAnimating(false);
    }
  }, [progress, isAnimating]);

  const runReaction = () => {
    setIsAnimating(true);
    setProgress(0);
    
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      setProgress((prev) => Math.min(prev + speed, 100));
    }, 50);
  };

  const resetReaction = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setProgress(0);
    setIsAnimating(false);
  };

  return (
    <div className="h-full flex flex-col p-4 overflow-hidden">
      <h2 className="text-xl font-bold mb-3 dark:text-white">Chemical Reaction Simulator</h2>
      
      <div className="flex-1 grid md:grid-cols-4 gap-4 overflow-hidden">
        {/* Reaction List */}
        <div className="overflow-y-auto">
          <h3 className="font-semibold mb-2 dark:text-white text-sm">Select Reaction</h3>
          <div className="space-y-2">
            {reactions.map((reaction) => (
              <button
                key={reaction.name}
                onClick={() => {
                  setSelectedReaction(reaction);
                  resetReaction();
                }}
                className={`w-full text-left p-2 rounded-lg transition-colors ${
                  selectedReaction.name === reaction.name
                    ? 'bg-green-500 text-white'
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {reaction.icon}
                  <span className="font-semibold text-xs">{reaction.name}</span>
                </div>
                <div className="text-xs opacity-80">{reaction.type}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Simulator */}
        <div className="md:col-span-3 flex flex-col overflow-hidden">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 flex-1 flex flex-col overflow-hidden">
            <h3 className="font-semibold mb-2 dark:text-white text-sm">{selectedReaction.name}</h3>
            
            {/* Equation */}
            <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-center text-sm font-mono dark:text-white">
                {selectedReaction.equation}
              </p>
            </div>

            {/* Visual Representation */}
            <div className="mb-3 flex items-center justify-center gap-2 flex-wrap">
              <div className="flex flex-col items-center gap-1">
                <div className="text-xs font-semibold dark:text-white">Reactants</div>
                <div className="flex gap-1 flex-wrap justify-center">
                  {selectedReaction.reactants.map((reactant, i) => (
                    <div
                      key={i}
                      className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold shadow-lg text-xs"
                      style={{ opacity: progress < 50 ? 1 : 1 - (progress - 50) / 50 }}
                    >
                      {reactant}
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-2xl dark:text-white">→</div>

              <div className="flex flex-col items-center gap-1">
                <div className="text-xs font-semibold dark:text-white">Products</div>
                <div className="flex gap-1 flex-wrap justify-center">
                  {selectedReaction.products.map((product, i) => (
                    <div
                      key={i}
                      className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-bold shadow-lg text-xs"
                      style={{ opacity: progress > 50 ? (progress - 50) / 50 : 0 }}
                    >
                      {product}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-100"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-center text-xs mt-1 dark:text-gray-300">
                {progress < 100 ? `Progress: ${progress}%` : 'Complete!'}
              </p>
            </div>

            {/* Speed Control */}
            <div className="mb-3">
              <label className="block text-xs font-medium mb-1 dark:text-gray-300">
                Speed: {speed}x
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full"
                disabled={isAnimating}
              />
            </div>

            {/* Controls */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={runReaction}
                disabled={isAnimating}
                className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-semibold py-2 rounded-lg transition-colors text-sm"
              >
                <Play className="h-4 w-4" />
                Run
              </button>
              <button
                onClick={resetReaction}
                className="flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>

            {/* Description */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg overflow-y-auto">
              <p className="text-xs dark:text-gray-300 mb-2">{selectedReaction.description}</p>
              <p className="text-xs font-semibold dark:text-gray-200">
                Energy: {selectedReaction.energyChange}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
