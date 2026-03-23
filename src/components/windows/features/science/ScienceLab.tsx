import React, { useState } from 'react';
import { Atom, Beaker, Zap, FlaskConical } from 'lucide-react';
import { ChemistryLab } from './chemistry/ChemistryLab';
import { PhysicsLab } from './physics/PhysicsLab';

export const ScienceLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chemistry' | 'physics'>('chemistry');

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold dark:text-white">Science Lab</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Interactive Chemistry & Physics Experiments</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('chemistry')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'chemistry'
                ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <Beaker className="h-5 w-5" />
            Chemistry
          </button>
          <button
            onClick={() => setActiveTab('physics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'physics'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <Zap className="h-5 w-5" />
            Physics
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'chemistry' && <ChemistryLab />}
        {activeTab === 'physics' && <PhysicsLab />}
      </div>
    </div>
  );
};
