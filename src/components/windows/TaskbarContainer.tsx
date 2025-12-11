
import React from 'react';
import { Taskbar } from './Taskbar';
import { useWindows } from './context/WindowsContext';

interface TaskbarContainerProps {
  isStartMenuOpen: boolean;
  isSearchOpen: boolean;
  onStartClick: () => void;
  onSearchClick: () => void;
  onRefreshClick?: () => void;
}

export const TaskbarContainer: React.FC<TaskbarContainerProps> = ({ 
  isStartMenuOpen, 
  isSearchOpen,
  onStartClick,
  onSearchClick,
  onRefreshClick
}) => {
  const { windows, toggleWindow, settings, minimizedWindows } = useWindows();
  
  const handleWindowToggle = (id: string) => {
    if (id === 'settings') {
      const settingsWindow = windows.find(w => w.id === 'settings');
      if (settingsWindow && !settingsWindow.isOpen) {
        toggleWindow(id);
      } else if (settingsWindow && settingsWindow.isMinimized) {
        toggleWindow(id);
      } else {
        toggleWindow(id);
      }
    } else {
      toggleWindow(id);
    }
  };
  
  return (
    <Taskbar 
      windows={windows} 
      onItemClick={handleWindowToggle}
      onStartClick={onStartClick}
      onSearchClick={onSearchClick}
      onRefreshClick={onRefreshClick}
      isStartMenuOpen={isStartMenuOpen}
      isSearchOpen={isSearchOpen}
      settings={settings}
      minimizedWindows={minimizedWindows}
    />
  );
};
