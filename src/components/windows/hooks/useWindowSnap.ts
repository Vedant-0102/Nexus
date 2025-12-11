import { useState, useEffect, useCallback } from 'react';

export type SnapZone = 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'maximized' | null;

interface SnapPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function useWindowSnap() {
  const [snapZone, setSnapZone] = useState<SnapZone>(null);
  const [showSnapPreview, setShowSnapPreview] = useState(false);
  const [previewZone, setPreviewZone] = useState<SnapZone>(null);

  const getSnapPosition = useCallback((zone: SnapZone): SnapPosition | null => {
    if (!zone) return null;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight - 48; // Subtract taskbar height

    const positions: Record<Exclude<SnapZone, null>, SnapPosition> = {
      'left': {
        x: 0,
        y: 0,
        width: screenWidth / 2,
        height: screenHeight,
      },
      'right': {
        x: screenWidth / 2,
        y: 0,
        width: screenWidth / 2,
        height: screenHeight,
      },
      'top-left': {
        x: 0,
        y: 0,
        width: screenWidth / 2,
        height: screenHeight / 2,
      },
      'top-right': {
        x: screenWidth / 2,
        y: 0,
        width: screenWidth / 2,
        height: screenHeight / 2,
      },
      'bottom-left': {
        x: 0,
        y: screenHeight / 2,
        width: screenWidth / 2,
        height: screenHeight / 2,
      },
      'bottom-right': {
        x: screenWidth / 2,
        y: screenHeight / 2,
        width: screenWidth / 2,
        height: screenHeight / 2,
      },
      'maximized': {
        x: 0,
        y: 0,
        width: screenWidth,
        height: screenHeight,
      },
    };

    return positions[zone];
  }, []);

  const detectSnapZone = useCallback((x: number, y: number, isDragging: boolean): SnapZone => {
    if (!isDragging) return null;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const edgeThreshold = 10;
    const cornerThreshold = 150;

    // Top edge - maximize
    if (y <= edgeThreshold) {
      return 'maximized';
    }

    // Left edge
    if (x <= edgeThreshold) {
      if (y <= cornerThreshold) return 'top-left';
      if (y >= screenHeight - cornerThreshold) return 'bottom-left';
      return 'left';
    }

    // Right edge
    if (x >= screenWidth - edgeThreshold) {
      if (y <= cornerThreshold) return 'top-right';
      if (y >= screenHeight - cornerThreshold) return 'bottom-right';
      return 'right';
    }

    return null;
  }, []);

  const handleDragMove = useCallback((x: number, y: number) => {
    const zone = detectSnapZone(x, y, true);
    if (zone !== previewZone) {
      setPreviewZone(zone);
      setShowSnapPreview(!!zone);
      
      // Dispatch event for global preview
      window.dispatchEvent(new CustomEvent('snap-preview', {
        detail: { show: !!zone, zone }
      }));
    }
  }, [detectSnapZone, previewZone]);

  const handleDragEnd = useCallback((x: number, y: number): SnapPosition | null => {
    const zone = detectSnapZone(x, y, true);
    setShowSnapPreview(false);
    setPreviewZone(null);
    
    // Clear global preview
    window.dispatchEvent(new CustomEvent('snap-preview', {
      detail: { show: false, zone: null }
    }));
    
    if (zone) {
      setSnapZone(zone);
      return getSnapPosition(zone);
    }
    
    return null;
  }, [detectSnapZone, getSnapPosition]);

  const snapToZone = useCallback((zone: SnapZone): SnapPosition | null => {
    setSnapZone(zone);
    return getSnapPosition(zone);
  }, [getSnapPosition]);

  const clearSnap = useCallback(() => {
    setSnapZone(null);
  }, []);

  return {
    snapZone,
    showSnapPreview,
    previewZone,
    handleDragMove,
    handleDragEnd,
    snapToZone,
    clearSnap,
    getSnapPosition,
  };
}
