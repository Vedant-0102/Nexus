import React from 'react';
import { PathfindingVisualizer } from '../PathfindingVisualizer';

export const PathfindingVisualizerApp: React.FC = () => {
  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <PathfindingVisualizer />
    </div>
  );
};
