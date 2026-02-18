
import React from 'react';
import { useWindows } from '../../context/WindowsContext';

interface FolderContentProps {
  type: 'games' | 'utilities' | 'office' | 'converters' | 'simulators' | 'chemistry' | 'physics' | 'biology' | 'engine' | 'colors' | 'crypt' | 'math';
}

export const FolderContent: React.FC<FolderContentProps> = ({ type }) => {
  const { windows, toggleWindow } = useWindows();
  
  // Filter apps based on folder type
  const apps = windows.filter(app => {
    if (type === 'games') {
      return ['tictactoe', 'snake', 'minesweeper', 'chess', 'checkers', 'flappybird', 'pacman', 'pingpong', 'tetris', 'game2048', 'sudoku', 'breakout', 'memorymatch', 'spaceinvaders', 'maze3d', 'battleship', 'connect4', 'dvdscreensaver', 'sandfalling', 'puzzle15', 'minecraft'].includes(app.id);
    } else if (type === 'office') {
      return ['texteditor', 'spreadsheet', 'presentation', 'formbuilder', 'kanban', 'stickyNotes', 'flashcards', 'paint', 'pixelart', 'invoice', 'chart-builder', 'mindmap'].includes(app.id);
    } else if (type === 'converters') {
      return ['imageconverter', 'documentconverter', 'lengthconverter', 'weightconverter', 'currencyconverter', 'temperature-converter', 'speed-converter', 'energy-converter', 'power-converter', 'pressure-converter', 'volume-converter', 'time-converter', 'area-converter'].includes(app.id);
    } else if (type === 'simulators') {
      return ['chemistry-folder-window', 'physics-folder-window', 'biology-folder-window', 'universe'].includes(app.id);
    } else if (type === 'engine') {
      return ['database', 'codeeditor', 'nocode', 'sortingvisualizer', 'pathfinding', 'qrcode', 'cnnvisualizer', 'gitvisualizer', 'api-tester', 'texttohtml', 'markdowneditor', 'data-formatter'].includes(app.id);
    } else if (type === 'chemistry') {
      return ['periodictable', 'molecularviewer', 'reactionsimulator', 'equation-balancer', 'titration-simulator', 'gas-laws'].includes(app.id);
    } else if (type === 'physics') {
      return ['projectilemotion', 'pendulum', 'spring', 'waves', 'collisions', 'electromagneticlab', 'optics-simulator', 'electric-field', 'magnetic-field', 'rocket-propulsion', 'doppler-effect', 'quantum-tunneling'].includes(app.id);
    } else if (type === 'biology') {
      return ['cell-division', 'dna-replication', 'neuron-signal', 'heart-circulation'].includes(app.id);
    } else if (type === 'math') {
      return ['supercalculator', 'geometry-calculator', 'quadratic-solver', 'linear-system-solver', 'matrix-calculator', 'graph-plotter', 'statistics-calculator', 'derivative-calculator', 'integral-calculator', 'trig-calculator', 'number-theory', 'percentage-calculator', '3d-function-grapher', 'fractal-generator', 'fourier-transform', 'calculus-visualizer', 'linear-algebra', 'prime-sieve', 'graph-theory', 'probability-dist'].includes(app.id);
    } else if (type === 'utilities') {
      // Include specific utility apps
      return [
        'settings', 'unifiedClock', 'taskManager', 'terminal',
        'battery', 'filemanager', 'wikipedia',
        'calendar'
      ].includes(app.id);
    } else if (type === 'crypt') {
      return ['base64-converter', 'regex-tester', 'password-generator', 'data-formatter', 'lorem-ipsum'].includes(app.id);
    }
    return false;
  });

  const getFolderTitle = () => {
    switch (type) {
      case 'games': return 'Games';
      case 'office': return 'Office Suite';
      case 'converters': return 'Converters';
      case 'simulators': return 'Simulators';
      case 'chemistry': return 'Chemistry Lab';
      case 'physics': return 'Physics Lab';
      case 'biology': return 'Biology Lab';
      case 'utilities': return 'Utilities';
      case 'engine': return 'Virtual Engine';
      case 'colors': return 'Colors for Artists';
      case 'crypt': return 'Crypt';
      case 'math': return 'Math Tools';
      default: return 'Folder';
    }
  };

  const isFolder = (id: string) => id.endsWith('-folder-window');

  return (
    <div className="p-6 h-full overflow-auto bg-white dark:bg-gray-900">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
        {getFolderTitle()}
      </h2>
      <div className="grid grid-cols-4 gap-4">
        {apps.map(app => (
          <div 
            key={app.id}
            className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 cursor-pointer group"
            onClick={() => toggleWindow(app.id)}
          >
            <div className={`h-12 w-12 flex items-center justify-center ${
              isFolder(app.id) 
                ? 'bg-yellow-100 dark:bg-yellow-900/30' 
                : 'bg-gray-100 dark:bg-gray-800'
            } group-hover:bg-gray-200 dark:group-hover:bg-gray-700 rounded-lg mb-2 transition-colors`}>
              {React.cloneElement(app.icon as React.ReactElement, { 
                size: 20,
                className: isFolder(app.id) 
                  ? "text-yellow-700 dark:text-yellow-400"
                  : "text-gray-700 dark:text-gray-300"
              })}
            </div>
            <span className="text-xs text-center text-gray-900 dark:text-gray-100 line-clamp-2 w-full">
              {app.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
