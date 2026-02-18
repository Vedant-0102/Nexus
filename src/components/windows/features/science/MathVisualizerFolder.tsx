import React from 'react';
import { useWindows } from '../../context/WindowsContext';
import { TrendingUp, Waves, Calculator, Grid3x3, PieChart, Sigma, GitBranch, Sparkles } from 'lucide-react';

export const MathVisualizerFolder: React.FC = () => {
  const { toggleWindow } = useWindows();

  const tools = [
    { id: '3d-function-grapher', name: '3D Function Grapher', icon: <TrendingUp className="h-8 w-8 text-blue-500" /> },
    { id: 'fourier-transform', name: 'Fourier Transform', icon: <Waves className="h-8 w-8 text-purple-500" /> },
    { id: 'calculus-visualizer', name: 'Calculus Visualizer', icon: <Calculator className="h-8 w-8 text-green-500" /> },
    { id: 'linear-algebra', name: 'Linear Algebra', icon: <Grid3x3 className="h-8 w-8 text-indigo-500" /> },
    { id: 'fractal-generator', name: 'Fractal Generator', icon: <Sparkles className="h-8 w-8 text-pink-500" /> },
    { id: 'prime-sieve', name: 'Prime Number Sieve', icon: <Sigma className="h-8 w-8 text-amber-500" /> },
    { id: 'graph-theory', name: 'Graph Theory', icon: <GitBranch className="h-8 w-8 text-cyan-500" /> },
    { id: 'probability-dist', name: 'Probability Distributions', icon: <PieChart className="h-8 w-8 text-red-500" /> },
  ];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Calculator className="h-7 w-7 text-purple-600" />
          Mathematics Visualizer
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Advanced mathematical concepts made visual
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tools.map(tool => (
            <button
              key={tool.id}
              onClick={() => toggleWindow(tool.id)}
              className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-200 hover:scale-105 border border-gray-200 dark:border-gray-700"
            >
              {tool.icon}
              <span className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                {tool.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
