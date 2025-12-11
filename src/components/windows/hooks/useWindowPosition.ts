
import { useState, useEffect } from 'react';
import { WindowType } from '../types/WindowTypes';

interface WindowSize {
  width: number;
  height: number;
}

interface Position {
  x: number;
  y: number;
}

export function useWindowPosition(window: WindowType, windowSize: WindowSize) {
  const getCenterPosition = (): Position => {
    if (typeof globalThis.window !== 'undefined') {
      const screenWidth = globalThis.window.innerWidth;
      const screenHeight = globalThis.window.innerHeight;
      const defaultX = window.defaultPosition?.x;
      const defaultY = window.defaultPosition?.y;
      
      if (defaultX !== undefined && defaultY !== undefined) {
        return { 
          x: Math.max(0, Math.min(defaultX, screenWidth - windowSize.width)), 
          y: Math.max(0, Math.min(defaultY, screenHeight - windowSize.height - 60)) 
        };
      }
      
      return { 
        x: Math.max(0, Math.min((screenWidth - windowSize.width) / 2, screenWidth - windowSize.width)), 
        y: Math.max(0, Math.min((screenHeight - windowSize.height) / 2, screenHeight - windowSize.height - 60)) 
      };
    }
    return { x: 100, y: 100 };
  };
  
  const [position, setPosition] = useState<Position>(getCenterPosition);
  const [originalPosition, setOriginalPosition] = useState<Position>(position);

  useEffect(() => {
    if (window.isOpen && !window.isMinimized) {
      const centerPos = getCenterPosition();
      setPosition(centerPos);
      setOriginalPosition(centerPos);
    }
  }, [windowSize.width, windowSize.height, window.isOpen, window.isMinimized]);

  useEffect(() => {
    const handleScreenResize = () => {
      if (window.isOpen && !window.isMinimized) {
        const screenWidth = globalThis.window?.innerWidth || 1920;
        const screenHeight = globalThis.window?.innerHeight || 1080;
        
        let newPosX = position.x;
        let newPosY = position.y;
        
        if (newPosX + windowSize.width > screenWidth) {
          newPosX = Math.max(0, screenWidth - windowSize.width);
        }
        
        if (newPosY + windowSize.height > screenHeight - 60) {
          newPosY = Math.max(0, screenHeight - windowSize.height - 60);
        }
        
        if (newPosX !== position.x || newPosY !== position.y) {
          setPosition({ x: newPosX, y: newPosY });
        }
      }
    };
    
    if (typeof globalThis.window !== 'undefined') {
      globalThis.window.addEventListener('resize', handleScreenResize);
      return () => {
        globalThis.window.removeEventListener('resize', handleScreenResize);
      };
    }
    
    return undefined;
  }, [window.isOpen, window.isMinimized, position, windowSize]);

  return {
    position,
    setPosition,
    originalPosition,
    setOriginalPosition
  };
}
