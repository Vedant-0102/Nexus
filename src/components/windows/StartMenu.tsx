import React, { useState, useEffect } from 'react';
import { useWindows } from './context/WindowsContext';
import { useSystem, PowerAction } from './context/SystemContext';
import {
  Search, Power, Settings,
  Gamepad, Briefcase, Sparkles, Repeat,
  Folder, Cpu, Sigma, FlaskConical, Shield,
  Moon, Lock, LogOut, RotateCcw
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface StartMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const PINNED_APP_IDS = ['settings', 'browser', 'calendar', 'terminal', 'weather', 'filemanager'];

const FOLDER_ITEMS = [
  { windowId: 'games-folder-window', label: 'Games', icon: <Gamepad className="h-5 w-5" /> },
  { windowId: 'office-folder-window', label: 'Office Suite', icon: <Briefcase className="h-5 w-5" /> },
  { windowId: 'colors-folder-window', label: 'Colors', icon: <Sparkles className="h-5 w-5" /> },
  { windowId: 'converters-folder-window', label: 'Converters', icon: <Repeat className="h-5 w-5" /> },
  { windowId: 'utilities-folder-window', label: 'Utilities', icon: <Folder className="h-5 w-5" /> },
  { windowId: 'virtual-engine-folder-window', label: 'Virtual Engine', icon: <Cpu className="h-5 w-5" /> },
  { windowId: 'math-folder-window', label: 'Math Tools', icon: <Sigma className="h-5 w-5" /> },
  { windowId: 'simulators-folder-window', label: 'Simulators', icon: <FlaskConical className="h-5 w-5" /> },
  { windowId: 'crypt-folder-window', label: 'Crypt', icon: <Shield className="h-5 w-5" /> },
];

export const StartMenu: React.FC<StartMenuProps> = ({ isOpen, onClose }) => {
  const { windows, toggleWindow } = useWindows();
  const { power } = useSystem();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredApps, setFilteredApps] = useState<any[]>([]);

  const pinnedApps = windows.filter(w => PINNED_APP_IDS.includes(w.id));

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

  const handlePower = (action: PowerAction) => {
    onClose();
    power(action);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed bottom-12 left-0 w-[420px] max-w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-tr-lg rounded-tl-lg shadow-2xl z-50 border border-gray-200/50 dark:border-gray-700/50 animate-slide-up overflow-hidden transition-colors duration-300"
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

        {!searchQuery && (
          <>
            <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Pinned</h3>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {pinnedApps.map(app => (
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

            <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Folders</h3>
            <div className="grid grid-cols-2 gap-2">
              {FOLDER_ITEMS.map(folder => (
                <button
                  key={folder.windowId}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200/70 dark:hover:bg-gray-700/70 transition-all duration-200 text-gray-900 dark:text-gray-100 text-left"
                  onClick={() => handleAppClick(folder.windowId)}
                >
                  <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    {React.cloneElement(folder.icon as React.ReactElement, {
                      size: 20,
                      className: "text-yellow-700 dark:text-yellow-400"
                    })}
                  </div>
                  <span className="text-sm font-medium">{folder.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

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
              onClick={() => handlePower('sleep')}
              className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-gray-200/70 dark:hover:bg-gray-700/70 transition-colors text-sm"
            >
              <Moon size={16} className="text-blue-400" />
              <span>Sleep</span>
            </button>
            <button
              onClick={() => handlePower('lock')}
              className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-gray-200/70 dark:hover:bg-gray-700/70 transition-colors text-sm"
            >
              <Lock size={16} className="text-gray-500 dark:text-gray-400" />
              <span>Lock</span>
            </button>
            <button
              onClick={() => handlePower('signout')}
              className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-gray-200/70 dark:hover:bg-gray-700/70 transition-colors text-sm"
            >
              <LogOut size={16} className="text-gray-500 dark:text-gray-400" />
              <span>Sign out</span>
            </button>
            <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
            <button
              onClick={() => handlePower('restart')}
              className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-gray-200/70 dark:hover:bg-gray-700/70 transition-colors text-sm"
            >
              <RotateCcw size={16} className="text-gray-500 dark:text-gray-400" />
              <span>Restart</span>
            </button>
            <button
              onClick={() => handlePower('shutdown')}
              className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-red-500/10 transition-colors text-sm"
            >
              <Power size={16} className="text-red-500" />
              <span className="text-red-500">Shut down</span>
            </button>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
