import React, { useState, useEffect, useRef } from 'react';
import { useWindows } from './context/WindowsContext';
import { Search, X, Command, ArrowUp, ArrowDown, CornerDownLeft, Folder, Zap, Gamepad, FileText, Palette, Calculator, Beaker, TrendingUp } from 'lucide-react';

interface SpotlightSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  title: string;
  icon: React.ReactNode;
  category: string;
  description?: string;
}

export const SpotlightSearch: React.FC<SpotlightSearchProps> = ({ isOpen, onClose }) => {
  const { windows, toggleWindow } = useWindows();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Categories for better organization
  const categories = {
    games: { icon: <Gamepad className="h-4 w-4" />, label: 'Games' },
    office: { icon: <FileText className="h-4 w-4" />, label: 'Office' },
    utilities: { icon: <Zap className="h-4 w-4" />, label: 'Utilities' },
    science: { icon: <Beaker className="h-4 w-4" />, label: 'Science' },
    data: { icon: <TrendingUp className="h-4 w-4" />, label: 'Data' },
    colors: { icon: <Palette className="h-4 w-4" />, label: 'Colors' },
    math: { icon: <Calculator className="h-4 w-4" />, label: 'Math' },
    folders: { icon: <Folder className="h-4 w-4" />, label: 'Folders' },
  };

  const getCategoryForApp = (id: string): string => {
    if (id.includes('game') || ['tictactoe', 'snake', 'minesweeper', 'chess', 'tetris', 'sudoku', 'breakout', 'spaceinvaders', 'maze3d', 'battleship', 'connect4', 'dvdscreensaver', 'sandfalling', 'puzzle15'].includes(id)) return 'games';
    if (id.includes('office') || ['notepad', 'texteditor', 'spreadsheet', 'presentation', 'formbuilder', 'kanban', 'flashcards', 'invoice'].includes(id)) return 'office';
    if (id.includes('folder')) return 'folders';
    if (id.includes('physics') || id.includes('chemistry') || ['periodictable', 'molecularviewer', 'reactionsimulator', 'electromagneticlab', 'optics-simulator', 'electric-field', 'magnetic-field', 'rocket-propulsion', 'projectilemotion', 'pendulum', 'spring', 'waves', 'collisions'].includes(id)) return 'science';
    if (['stockmarket', 'cryptocurrency', 'sports', 'nasa', 'flighttracker', 'shiptracker'].includes(id)) return 'data';
    if (id.includes('color') || id.includes('palette') || ['pixelart', 'paint'].includes(id)) return 'colors';
    if (id.includes('math') || id.includes('calculator') || ['supercalculator', 'quadratic-solver', 'matrix-calculator'].includes(id)) return 'math';
    return 'utilities';
  };

  useEffect(() => {
    if (!searchQuery) {
      // Show recent/popular apps when no query
      const popularApps = windows
        .filter(app => app.showInStartMenu !== false)
        .slice(0, 8)
        .map(app => ({
          id: app.id,
          title: app.title,
          icon: app.icon,
          category: getCategoryForApp(app.id),
        }));
      setFilteredResults(popularApps);
      setSelectedIndex(0);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const results = windows
      .filter(app => {
        const titleMatch = app.title.toLowerCase().includes(query);
        const categoryMatch = getCategoryForApp(app.id).includes(query);
        return (titleMatch || categoryMatch) && app.showInStartMenu !== false;
      })
      .map(app => ({
        id: app.id,
        title: app.title,
        icon: app.icon,
        category: getCategoryForApp(app.id),
      }))
      .slice(0, 10); // Limit to 10 results
    
    setFilteredResults(results);
    setSelectedIndex(0);
  }, [searchQuery, windows]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    // Scroll selected item into view
    if (resultsRef.current && selectedIndex >= 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filteredResults[selectedIndex]) {
      e.preventDefault();
      handleAppClick(filteredResults[selectedIndex].id);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleAppClick = (id: string) => {
    toggleWindow(id);
    setSearchQuery('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999998] animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Search Panel */}
      <div 
        className="fixed top-[20%] left-1/2 -translate-x-1/2 w-[600px] max-w-[90vw] bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl z-[999999] border border-white/20 dark:border-gray-700/50 animate-in slide-in-from-top-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search apps, features, and more..."
              className="w-full pl-12 pr-12 py-3 bg-transparent text-lg outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {searchQuery && (
              <button 
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>
        
        {/* Results */}
        <div 
          ref={resultsRef}
          className="max-h-[400px] overflow-y-auto p-2"
        >
          {filteredResults.length > 0 ? (
            <div className="space-y-1">
              {filteredResults.map((result, index) => {
                const categoryInfo = categories[result.category as keyof typeof categories] || categories.utilities;
                return (
                  <button
                    key={result.id}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-150 ${
                      index === selectedIndex
                        ? 'bg-blue-500 text-white shadow-lg scale-[1.02]'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100'
                    }`}
                    onClick={() => handleAppClick(result.id)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className={`h-10 w-10 flex items-center justify-center rounded-lg ${
                      index === selectedIndex
                        ? 'bg-white/20'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      {React.cloneElement(result.icon as React.ReactElement, { 
                        size: 20,
                        className: index === selectedIndex ? 'text-white' : ''
                      })}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{result.title}</div>
                      <div className={`text-xs flex items-center gap-1 ${
                        index === selectedIndex ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {React.cloneElement(categoryInfo.icon, { 
                          className: index === selectedIndex ? 'text-white/80' : 'text-gray-400'
                        })}
                        <span>{categoryInfo.label}</span>
                      </div>
                    </div>
                    {index === selectedIndex && (
                      <div className="flex items-center gap-1 text-white/80">
                        <CornerDownLeft className="h-4 w-4" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {searchQuery ? (
                <>
                  <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No results found</p>
                  <p className="text-sm mt-1">Try searching for something else</p>
                </>
              ) : (
                <>
                  <Command className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Start typing to search</p>
                  <p className="text-sm mt-1">Search for apps, features, and more</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer with keyboard shortcuts */}
        <div className="px-4 py-3 border-t border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">
                <ArrowUp className="h-3 w-3" />
              </kbd>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">
                <ArrowDown className="h-3 w-3" />
              </kbd>
              <span className="ml-1">Navigate</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">↵</kbd>
              <span>Open</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">Esc</kbd>
              <span>Close</span>
            </div>
          </div>
          <div className="text-xs">
            {filteredResults.length} {filteredResults.length === 1 ? 'result' : 'results'}
          </div>
        </div>
      </div>
    </>
  );
};
