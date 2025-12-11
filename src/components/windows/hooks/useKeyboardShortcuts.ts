import { useEffect } from 'react';
import { SnapZone } from './useWindowSnap';

interface KeyboardShortcutsProps {
  onSnapLeft: () => void;
  onSnapRight: () => void;
  onSnapTopLeft: () => void;
  onSnapTopRight: () => void;
  onSnapBottomLeft: () => void;
  onSnapBottomRight: () => void;
  onMaximize: () => void;
  onMinimize: () => void;
  isActive: boolean;
}

export function useKeyboardShortcuts({
  onSnapLeft,
  onSnapRight,
  onSnapTopLeft,
  onSnapTopRight,
  onSnapBottomLeft,
  onSnapBottomRight,
  onMaximize,
  onMinimize,
  isActive,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Windows key (Meta) or Alt key as modifier
      const isWinKey = e.metaKey || e.altKey;
      
      if (!isWinKey) return;

      // Check if it's an arrow key
      const isArrowKey = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key);
      
      if (!isArrowKey) return;

      // Prevent default browser behavior for all arrow key combinations
      e.preventDefault();
      e.stopPropagation();

      switch (e.key) {
        case 'ArrowLeft':
          // Win/Alt + Left Arrow - Snap to left half
          if (e.shiftKey) {
            // Win/Alt + Shift + Left Arrow - Snap to top-left quarter
            onSnapTopLeft();
          } else if (e.ctrlKey) {
            // Win/Alt + Ctrl + Left Arrow - Snap to bottom-left quarter
            onSnapBottomLeft();
          } else {
            onSnapLeft();
          }
          break;

        case 'ArrowRight':
          // Win/Alt + Right Arrow - Snap to right half
          if (e.shiftKey) {
            // Win/Alt + Shift + Right Arrow - Snap to top-right quarter
            onSnapTopRight();
          } else if (e.ctrlKey) {
            // Win/Alt + Ctrl + Right Arrow - Snap to bottom-right quarter
            onSnapBottomRight();
          } else {
            onSnapRight();
          }
          break;

        case 'ArrowUp':
          // Win/Alt + Up Arrow - Maximize
          onMaximize();
          break;

        case 'ArrowDown':
          // Win/Alt + Down Arrow - Minimize
          onMinimize();
          break;

        default:
          break;
      }
    };

    // Use capture phase to intercept before other handlers
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [
    isActive,
    onSnapLeft,
    onSnapRight,
    onSnapTopLeft,
    onSnapTopRight,
    onSnapBottomLeft,
    onSnapBottomRight,
    onMaximize,
    onMinimize,
  ]);
}
