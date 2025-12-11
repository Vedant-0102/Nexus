
import { useState, useRef, useEffect, RefObject } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

interface Position {
  x: number;
  y: number;
}

export function useWindowResize(
  windowRef: RefObject<HTMLDivElement>,
  position: Position,
  windowSize: WindowSize,
  setWindowSize: React.Dispatch<React.SetStateAction<WindowSize>>,
  setPosition: React.Dispatch<React.SetStateAction<Position>>,
  isMaximized: boolean
) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  
  const resizeHandlerRef = useRef<(e: MouseEvent) => void>(() => {});
  const stopResizeRef = useRef<() => void>(() => {});

  const startResize = (direction: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isMaximized) return;
    
    setIsResizing(true);
    setResizeDirection(direction);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = windowSize.width;
    const startHeight = windowSize.height;
    const startPosX = position.x;
    const startPosY = position.y;
    
    const handleResize = (e: MouseEvent) => {
      e.preventDefault();
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      let newWidth = startWidth;
      let newHeight = startHeight;
      let newPosX = startPosX;
      let newPosY = startPosY;
      let positionChanged = false;
      
      // Handle horizontal resizing
      if (direction.includes('right')) {
        newWidth = Math.max(300, startWidth + deltaX);
      } else if (direction.includes('left')) {
        const potentialWidth = startWidth - deltaX;
        if (potentialWidth >= 300) {
          newWidth = potentialWidth;
          newPosX = startPosX + deltaX;
          positionChanged = true;
        } else {
          newWidth = 300;
        }
      }
      
      // Handle vertical resizing
      if (direction.includes('bottom')) {
        newHeight = Math.max(200, startHeight + deltaY);
      } else if (direction.includes('top')) {
        const potentialHeight = startHeight - deltaY;
        if (potentialHeight >= 200) {
          newHeight = potentialHeight;
          newPosY = startPosY + deltaY;
          positionChanged = true;
        } else {
          newHeight = 200;
        }
      }
      
      // Update size and position
      setWindowSize({ width: newWidth, height: newHeight });
      if (positionChanged) {
        setPosition({ x: newPosX, y: newPosY });
      }
    };
    
    const stopResize = () => {
      setIsResizing(false);
      setResizeDirection(null);
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', stopResize);
    };
    
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', resizeHandlerRef.current);
      document.removeEventListener('mouseup', stopResizeRef.current);
    };
  }, []);

  return {
    isResizing,
    setIsResizing,
    resizeDirection,
    setResizeDirection,
    startResize
  };
}
