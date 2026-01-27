import React, { useCallback } from 'react';
import { MemoizedWindow as Window } from '../Window';
import { useWindows } from '../context/WindowsContext';

export const WindowsDisplay: React.FC = () => {
  const { windows, closeWindow, minimizeWindow, bringToFront, minimizedWindows } = useWindows();

  const openWindows = windows.filter(w => w.isOpen);

  return (
    <>
      {openWindows.map(window => {
        const config = {
          ...window,
          isMinimized: minimizedWindows.includes(window.id)
        };

        return (
          <Window
            key={window.id}
            window={config}
            onClose={() => closeWindow(window.id)}
            onMinimize={() => minimizeWindow(window.id)}
            onFocus={() => bringToFront(window.id)}
          />
        );
      })}
    </>
  );
};
