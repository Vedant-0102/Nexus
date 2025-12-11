import React from 'react';
import { SnapZone } from '../hooks/useWindowSnap';

interface SnapPreviewProps {
  show: boolean;
  zone: SnapZone;
}

export const SnapPreview: React.FC<SnapPreviewProps> = ({ show, zone }) => {
  if (!show || !zone) return null;

  const getPreviewStyle = (): React.CSSProperties => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight - 48; // Subtract taskbar

    const styles: Record<Exclude<SnapZone, null>, React.CSSProperties> = {
      'left': {
        left: 0,
        top: 0,
        width: screenWidth / 2,
        height: screenHeight,
      },
      'right': {
        left: screenWidth / 2,
        top: 0,
        width: screenWidth / 2,
        height: screenHeight,
      },
      'top-left': {
        left: 0,
        top: 0,
        width: screenWidth / 2,
        height: screenHeight / 2,
      },
      'top-right': {
        left: screenWidth / 2,
        top: 0,
        width: screenWidth / 2,
        height: screenHeight / 2,
      },
      'bottom-left': {
        left: 0,
        top: screenHeight / 2,
        width: screenWidth / 2,
        height: screenHeight / 2,
      },
      'bottom-right': {
        left: screenWidth / 2,
        top: screenHeight / 2,
        width: screenWidth / 2,
        height: screenHeight / 2,
      },
      'maximized': {
        left: 0,
        top: 0,
        width: screenWidth,
        height: screenHeight,
      },
    };

    return styles[zone];
  };

  return (
    <div
      className="fixed pointer-events-none z-[9999] bg-blue-500/30 border-4 border-blue-500 rounded-lg transition-all duration-200 ease-out animate-in fade-in"
      style={getPreviewStyle()}
    />
  );
};
