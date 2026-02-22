
import React from 'react';
import { useWindows } from '../../context/WindowsContext';

interface FolderContentProps {
  type: 'games' | 'utilities' | 'office' | 'converters' | 'simulators' | 'chemistry' | 'physics' | 'biology' | 'engine' | 'engine-code' | 'engine-arch' | 'engine-dsa' | 'colors' | 'crypt' | 'math' | 'earth-space' | 'music' | 'networks' | 'editing' | 'cybersecurity' | 'machine-learning' | 'data-visualizer';
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
      return ['chemistry-folder-window', 'physics-folder-window', 'biology-folder-window', 'earth-space-folder-window', 'universe'].includes(app.id);
    } else if (type === 'engine') {
      return ['engine-code-folder-window', 'engine-arch-folder-window', 'engine-dsa-folder-window', 'networks-folder-window', 'crypt-folder-window', 'cybersecurity-folder-window', 'machine-learning-folder-window', 'data-visualizer-folder-window'].includes(app.id);
    } else if (type === 'engine-code') {
      return ['database', 'codeeditor', 'nocode', 'gitvisualizer', 'api-tester', 'texttohtml', 'markdowneditor', 'data-formatter', 'binary-converter', 'turing-machine'].includes(app.id);
    } else if (type === 'engine-arch') {
      return ['logic-gates', 'cpu-simulator', 'memory-allocator', 'pid-controller'].includes(app.id);
    } else if (type === 'engine-dsa') {
      return ['sortingvisualizer', 'pathfinding', 'qrcode', 'cnnvisualizer', 'tree-traversals', 'graph-algorithms', 'dp-visualizer', 'hashing-visualizer', 'memory-stack-heap', 'bigo-comparator', 'backtracking-visualizer', 'trie-segment-tree', 'complexity-analyzer'].includes(app.id);
    } else if (type === 'chemistry') {
      return ['periodictable', 'molecularviewer', 'reactionsimulator', 'equation-balancer', 'titration-simulator', 'gas-laws', 'electrochemistry', 'spectroscopy', 'nuclear-decay', 'ph-scale', 'organic-chemistry', 'polymer-builder', 'chemistry-calculator', 'flame-test'].includes(app.id);
    } else if (type === 'physics') {
      return ['projectilemotion', 'pendulum', 'spring', 'waves', 'collisions', 'electromagneticlab', 'optics-simulator', 'electric-field', 'magnetic-field', 'rocket-propulsion', 'doppler-effect', 'quantum-tunneling', 'bernoulli-principle', 'thermodynamics', 'special-relativity', 'black-hole', 'lc-circuit', 'snells-law', 'diffraction-grating', 'buoyancy', 'torque-rotation', 'bridge-stress', 'gear-train', 'hydraulic-system', 'simple-machines', 'electrical-circuit', 'truss-analysis'].includes(app.id);
    } else if (type === 'biology') {
      return ['cell-division', 'dna-replication', 'neuron-signal', 'heart-circulation', 'ecosystem-food-web', 'natural-selection', 'punnett-square', 'enzyme-substrate'].includes(app.id);
    } else if (type === 'math') {
      return ['supercalculator', 'geometry-calculator', 'quadratic-solver', 'linear-system-solver', 'matrix-calculator', 'graph-plotter', 'statistics-calculator', 'derivative-calculator', 'integral-calculator', 'trig-calculator', 'number-theory', 'percentage-calculator', '3d-function-grapher', 'fractal-generator', 'fourier-transform', 'calculus-visualizer', 'linear-algebra', 'prime-sieve', 'graph-theory', 'probability-dist'].includes(app.id);
    } else if (type === 'utilities') {
      // Include specific utility apps
      return [
        'settings', 'unifiedClock', 'taskManager', 'terminal',
        'battery', 'filemanager', 'wikipedia',
        'calendar'
      ].includes(app.id);
    } else if (type === 'earth-space') {
      return ['solar-system', 'moon-phases', 'plate-tectonics', 'atmospheric-layers', 'star-life-cycle', 'eclipse-simulator', 'seasons-earth-tilt'].includes(app.id);
    } else if (type === 'crypt') {
      return ['base64-converter', 'regex-tester', 'password-generator', 'data-formatter', 'lorem-ipsum', 'token-generator', 'string-obfuscation', 'bcrypt-tool', 'uuid-generator', 'hashing-tool', 'classical-ciphers', 'aes-encryption', 'hmac-generator', 'rsa-sandbox', 'jwt-decoder'].includes(app.id);
    } else if (type === 'networks') {
      return ['subnet-calculator', 'ipv4-converter', 'ipv4-range-expander', 'mac-address-tool', 'ipv6-ula-generator'].includes(app.id);
    } else if (type === 'editing') {
      return ['image-editor', 'video-editor'].includes(app.id);
    } else if (type === 'cybersecurity') {
      return ['sql-injection-demo', 'xss-simulator', 'phishing-analyzer', 'packet-sniffer', 'firewall-builder', 'password-cracking', 'ctf-challenge', 'cia-triad', 'social-engineering', 'owasp-top10', 'port-scanner', 'vulnerability-scanning'].includes(app.id);
    } else if (type === 'machine-learning') {
      return ['algorithm-explainers', 'parameter-tuner', 'dataset-analyzer', 'train-test-split', 'model-metrics', 'bias-variance', 'feature-importance', 'hyperparameter-tuning', 'model-comparison', 'model-wizard', 'deep-learning-builder', 'gradient-descent'].includes(app.id);
    } else if (type === 'data-visualizer') {
      return ['data-visualizer-app', 'dashboard-builder'].includes(app.id);
    } else if (type === 'music') {
      return ['virtual-instruments', 'beat-sequencer', 'piano-roll', 'waveform-visualizer', 'effects-rack', 'chord-helper', 'music-theory', 'arpeggiator', 'sample-pad', 'daw-studio'].includes(app.id);
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
      case 'earth-space': return 'Earth & Space Sciences';
      case 'engine-code': return 'Code / CS';
      case 'engine-arch': return 'Computer Architecture';
      case 'engine-dsa': return 'DSA Visualizers';
      case 'music': return 'Music Studio';
      case 'networks': return 'Networks';
      case 'editing': return 'Editing';
      case 'cybersecurity': return 'Cybersecurity Tools';
      case 'machine-learning': return 'Machine Learning';
      case 'data-visualizer': return 'Data Visualizer';
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
