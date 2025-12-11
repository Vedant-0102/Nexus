
import React from 'react';
import { StartMenu } from '../StartMenu';
import { ContextMenu } from '../ContextMenu';
import { useWindows } from '../context/WindowsContext';

interface DesktopMenusProps {
  isStartMenuOpen: boolean;
  setIsStartMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  contextMenuPos: { x: number; y: number } | null;
  setContextMenuPos: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>;
  onShutdown?: () => void;
  onRefresh?: () => void; // Add this prop
}

export const DesktopMenus: React.FC<DesktopMenusProps> = ({ 
  isStartMenuOpen, 
  setIsStartMenuOpen,
  contextMenuPos,
  setContextMenuPos,
  onShutdown,
  onRefresh // Add this prop
}) => {
  const { toggleWindow } = useWindows();
  
  return (
    <>
      {/* Start Menu */}
      <StartMenu 
        isOpen={isStartMenuOpen} 
        onClose={() => setIsStartMenuOpen(false)}
      />
      
      {/* Context Menu */}
      <ContextMenu
        position={contextMenuPos}
        onClose={() => setContextMenuPos(null)}
        onRefresh={onRefresh || (() => {})} // Use the passed onRefresh function
        onViewChange={() => toggleWindow('settings')}
        onShutdown={onShutdown}
      />
    </>
  );
};
