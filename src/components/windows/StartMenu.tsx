import React, { useState, useEffect } from 'react';
import { useWindows } from './context/WindowsContext';
import { Search, Power, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';

interface StartMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StartMenu: React.FC<StartMenuProps> = ({ isOpen, onClose }) => {
  const { windows, toggleWindow } = useWindows();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredApps, setFilteredApps] = useState<any[]>([]);
  const [showPowerOptions, setShowPowerOptions] = useState(false);
  const [isShuttingDown, setIsShuttingDown] = useState(false);

  const utilityApps = windows.filter(w => 
    w.id !== 'about' && 
    w.id !== 'projects' && 
    w.id !== 'skills' && 
    w.id !== 'experience' && 
    w.id !== 'contact' &&
    w.showInStartMenu !== false
  );

  const gameApps = utilityApps.filter(app => 
    app.id === 'tictactoe' || 
    app.id === 'snake' || 
    app.id === 'minesweeper' ||
    app.id === 'chess' ||
    app.id === 'pingpong'
  );

  const actualUtilityApps = utilityApps.filter(app => 
    app.id !== 'tictactoe' && 
    app.id !== 'snake' && 
    app.id !== 'minesweeper' &&
    app.id !== 'chess' &&
    app.id !== 'pingpong'
  );

  useEffect(() => {
    if (!searchQuery) {
      setFilteredApps([]);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const results = windows.filter(app => 
      app.title.toLowerCase().includes(query) && app.showInStartMenu !== false
    );
    
    setFilteredApps(results);
  }, [searchQuery, windows]);
  
  const handleAppClick = (id: string) => {
    toggleWindow(id);
    onClose();
  };

  const handlePowerOff = () => {
    setIsShuttingDown(true);
    
    sessionStorage.setItem('win11-shutdown-action', 'true');
    
    setTimeout(() => {
      document.body.style.backgroundColor = '#000';
      document.body.innerHTML = `
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: white;">
          <div style="font-size: 24px; margin-bottom: 20px;">Shutting down...</div>
          <div style="width: 80px; height: 80px; border: 4px solid #333; border-top: 4px solid #fff; border-radius: 50%; margin: 0 auto; animation: spin 1s linear infinite;"></div>
          <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
        </div>
      `;
      
      setTimeout(() => {
        document.body.innerHTML = '';
        document.body.style.backgroundColor = '#000';
      }, 5000);
    }, );
  };

  if (!isOpen) return null;

  if (isShuttingDown) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[1000]">
        <div className="text-center text-white">
          <div className="text-2xl mb-5">Shutting down...</div>
          <div className="w-16 h-16 border-4 border-gray-600 border-t-white rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed bottom-12 left-0 w-96 max-w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-tr-lg rounded-tl-lg shadow-2xl z-50 border border-gray-200/50 dark:border-gray-700/50 animate-slide-up overflow-hidden transition-colors duration-300"
      style={{ maxHeight: "calc(100vh - 100px)" }} 
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 180px)" }}>
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            placeholder="Type to search..."
            className="pl-9 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {}
        {searchQuery && (
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Search Results</h3>
            {filteredApps.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {filteredApps.map(app => (
                  <button
                    key={app.id}
                    className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-200/70 dark:hover:bg-gray-700/70 transition-all duration-200 text-gray-900 dark:text-gray-100"
                    onClick={() => handleAppClick(app.id)}
                  >
                    <div className="h-10 w-10 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full mb-1">
                      {React.cloneElement(app.icon as React.ReactElement, { size: 20 })}
                    </div>
                    <span className="text-xs text-center">{app.title}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No results found</p>
            )}
          </div>
        )}
        
        {}
        {!searchQuery && (
          <>
            <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Games</h3>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {gameApps.map(app => (
                <button
                  key={app.id}
                  className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-200/70 dark:hover:bg-gray-700/70 transition-all duration-200 text-gray-900 dark:text-gray-100"
                  onClick={() => handleAppClick(app.id)}
                >
                  <div className="h-10 w-10 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full mb-1">
                    {React.cloneElement(app.icon as React.ReactElement, { size: 20 })}
                  </div>
                  <span className="text-xs text-center">{app.title}</span>
                </button>
              ))}
            </div>
            
            {}
            <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Utilities</h3>
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {actualUtilityApps.map(app => (
                <button
                  key={app.id}
                  className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-200/70 dark:hover:bg-gray-700/70 transition-all duration-200 text-gray-900 dark:text-gray-100"
                  onClick={() => handleAppClick(app.id)}
                >
                  <div className="h-10 w-10 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full mb-1">
                    {React.cloneElement(app.icon as React.ReactElement, { size: 20 })}
                  </div>
                  <span className="text-xs text-center">{app.title}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      
      {}
      <div className="border-t border-gray-200 dark:border-gray-700 flex justify-between items-center p-2 bg-gray-50/50 dark:bg-gray-800/50">
        <div className="flex items-center">
          <button 
            className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-gray-200/70 dark:hover:bg-gray-700/70 transition-all duration-200 text-gray-900 dark:text-gray-100"
            onClick={() => handleAppClick('settings')}
          >
            <Settings size={16} />
            <span className="text-sm font-medium">Settings</span>
          </button>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <button className="p-2 rounded-full hover:bg-red-500/20 transition-colors">
              <Power size={22} className="text-red-500" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2">
            <button 
              onClick={handlePowerOff}
              className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-red-500/10 transition-colors"
            >
              <Power size={16} className="text-red-500" />
              <span className="text-red-500">Shutdown</span>
            </button>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
