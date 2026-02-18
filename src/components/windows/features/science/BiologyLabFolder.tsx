import React from 'react';
import { useWindows } from '../../context/WindowsContext';
import { Dna, Heart, Brain, Leaf, Microscope, Activity } from 'lucide-react';

export const BiologyLabFolder: React.FC = () => {
  const { toggleWindow } = useWindows();

  const labs = [
    { id: 'cell-division', name: 'Cell Division', icon: <Microscope className="h-8 w-8 text-green-500" /> },
    { id: 'dna-replication', name: 'DNA Replication', icon: <Dna className="h-8 w-8 text-blue-500" /> },
    { id: 'neuron-signal', name: 'Neuron Signal', icon: <Brain className="h-8 w-8 text-purple-500" /> },
    { id: 'ecosystem-sim', name: 'Ecosystem Simulator', icon: <Leaf className="h-8 w-8 text-emerald-500" /> },
    { id: 'natural-selection', name: 'Natural Selection', icon: <Activity className="h-8 w-8 text-amber-500" /> },
    { id: 'heart-circulation', name: 'Heart & Circulation', icon: <Heart className="h-8 w-8 text-red-500" /> },
    { id: 'genetics-punnett', name: 'Genetics & Punnett', icon: <Dna className="h-8 w-8 text-indigo-500" /> },
    { id: 'enzyme-substrate', name: 'Enzyme-Substrate', icon: <Microscope className="h-8 w-8 text-cyan-500" /> },
  ];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Dna className="h-7 w-7 text-green-600" />
          Biology Lab
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Explore life sciences through interactive simulations
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {labs.map(lab => (
            <button
              key={lab.id}
              onClick={() => toggleWindow(lab.id)}
              className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-200 hover:scale-105 border border-gray-200 dark:border-gray-700"
            >
              {lab.icon}
              <span className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                {lab.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
