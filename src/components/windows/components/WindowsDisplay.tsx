
import React from 'react';
import { Window } from '../Window';
import { useWindows } from '../context/WindowsContext';

export const WindowsDisplay: React.FC = () => {
  const { windows, closeWindow, minimizeWindow, bringToFront, minimizedWindows } = useWindows();
  
  const handleClose = (windowId: string) => {
    closeWindow(windowId);
  };
  
  const handleMinimize = (windowId: string) => {
    minimizeWindow(windowId);
  };
  
  return (
    <>
      {windows.filter(w => w.isOpen).map(window => (
        <Window 
          key={window.id}
          window={{
            ...window,
            isMinimized: minimizedWindows.includes(window.id)
          }}
          onClose={() => handleClose(window.id)}
          onMinimize={() => handleMinimize(window.id)}
          onFocus={() => bringToFront(window.id)}
        />
      ))}
    </>
  );
};
