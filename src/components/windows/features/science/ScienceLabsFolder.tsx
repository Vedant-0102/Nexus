import React from 'react';
import { useWindows } from '../../context/WindowsContext';
import { FlaskConical, Atom, Zap, Eye, Waves, Droplet, Beaker, TestTube, Wind, Thermometer } from 'lucide-react';

export const ScienceLabsFolder: React.FC = () => {
  const { toggleWindow } = useWindows();

  const labs = [
    // Chemistry Labs
    { id: 'titration-simulator', name: 'Titration Simulator', icon: <TestTube className="h-8 w-8 text-blue-500" />, category: 'Chemistry' },
    { id: 'electrochemistry', name: 'Electrochemistry', icon: <Zap className="h-8 w-8 text-yellow-500" />, category: 'Chemistry' },
    { id: 'gas-laws', name: 'Gas Laws Simulator', icon: <Wind className="h-8 w-8 text-cyan-500" />, category: 'Chemistry' },
    { id: 'organic-chemistry', name: 'Organic Chemistry', icon: <Atom className="h-8 w-8 text-green-500" />, category: 'Chemistry' },
    { id: 'spectroscopy', name: 'Spectroscopy', icon: <Eye className="h-8 w-8 text-purple-500" />, category: 'Chemistry' },
    { id: 'nuclear-decay', name: 'Nuclear Decay', icon: <Atom className="h-8 w-8 text-red-500" />, category: 'Chemistry' },
    { id: 'ph-scale', name: 'pH Scale & Buffers', icon: <Droplet className="h-8 w-8 text-blue-400" />, category: 'Chemistry' },
    { id: 'polymer-builder', name: 'Polymer Builder', icon: <Beaker className="h-8 w-8 text-pink-500" />, category: 'Chemistry' },
    
    // Physics Labs
    { id: 'doppler-effect', name: 'Doppler Effect', icon: <Waves className="h-8 w-8 text-indigo-500" />, category: 'Physics' },
    { id: 'bernoulli-principle', name: 'Bernoulli\'s Principle', icon: <Wind className="h-8 w-8 text-sky-500" />, category: 'Physics' },
    { id: 'thermodynamics', name: 'Thermodynamics', icon: <Thermometer className="h-8 w-8 text-red-500" />, category: 'Physics' },
    { id: 'quantum-tunneling', name: 'Quantum Tunneling', icon: <Atom className="h-8 w-8 text-purple-600" />, category: 'Physics' },
    { id: 'special-relativity', name: 'Special Relativity', icon: <Zap className="h-8 w-8 text-yellow-600" />, category: 'Physics' },
    { id: 'black-hole', name: 'Black Hole Gravity', icon: <FlaskConical className="h-8 w-8 text-gray-800 dark:text-gray-200" />, category: 'Physics' },
    { id: 'lc-circuit', name: 'LC Circuit', icon: <Zap className="h-8 w-8 text-orange-500" />, category: 'Physics' },
    { id: 'snells-law', name: 'Snell\'s Law', icon: <Eye className="h-8 w-8 text-teal-500" />, category: 'Physics' },
    { id: 'diffraction', name: 'Diffraction Grating', icon: <Waves className="h-8 w-8 text-violet-500" />, category: 'Physics' },
    { id: 'buoyancy', name: 'Buoyancy', icon: <Droplet className="h-8 w-8 text-blue-600" />, category: 'Physics' },
  ];

  const categories = ['Chemistry', 'Physics'];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <FlaskConical className="h-7 w-7 text-blue-600" />
          Science Labs
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Interactive simulations for chemistry and physics
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {categories.map(category => (
          <div key={category} className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
              {category === 'Chemistry' ? <Beaker className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
              {category}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {labs.filter(lab => lab.category === category).map(lab => (
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
        ))}
      </div>
    </div>
  );
};
