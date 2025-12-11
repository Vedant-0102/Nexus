
import React, { useState, useEffect } from 'react';
import { useWindows } from './context/WindowsContext';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({ isOpen, onClose }) => {
  const { windows, toggleWindow } = useWindows();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredApps, setFilteredApps] = useState<any[]>([]);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredApps([]);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const results = windows.filter(app => 
      app.title.toLowerCase().includes(query) && 
      app.showInStartMenu !== false
    );
    
    setFilteredApps(results);
  }, [searchQuery, windows]);
  
  const handleAppClick = (id: string) => {
    toggleWindow(id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed bottom-12 left-14 w-96 max-w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-lg shadow-xl z-50 border border-white/20 animate-slide-up overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-4">
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search apps..."
            className="pl-9 pr-9"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="absolute right-3 top-2.5"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          )}
        </div>
        
        {}
        <div className="max-h-64 overflow-y-auto">
          {filteredApps.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {filteredApps.map(app => (
                <button
                  key={app.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-200/70 dark:hover:bg-gray-700/70 transition-colors w-full text-left"
                  onClick={() => handleAppClick(app.id)}
                >
                  <div className="h-8 w-8 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full">
                    {React.cloneElement(app.icon as React.ReactElement, { size: 16 })}
                  </div>
                  <span className="text-sm">{app.title}</span>
                </button>
              ))}
            </div>
          ) : (
            searchQuery ? (
              <div className="text-center py-4 text-gray-500">
                <p>No results found</p>
                <p className="text-sm mt-1">Try searching for something else</p>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p>Start typing to search</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
