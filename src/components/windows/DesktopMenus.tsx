
import React from 'react';
import { StartMenu } from './StartMenu';
import { ContextMenu } from './ContextMenu';
import { useWindows } from './context/WindowsContext';

interface DesktopMenusProps {
  isStartMenuOpen: boolean;
  setIsStartMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  contextMenuPos: { x: number; y: number } | null;
  setContextMenuPos: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>;
  onShutdown?: () => void;
}

export const DesktopMenus = ({
  isStartMenuOpen,
  setIsStartMenuOpen,
  contextMenuPos,
  setContextMenuPos,
  onShutdown
}: DesktopMenusProps) => {
  const { toggleWindow } = useWindows();
  
  return (
    <>
      {}
      <StartMenu 
        isOpen={isStartMenuOpen}
        onClose={() => setIsStartMenuOpen(false)}
      />
      
      {}
      {contextMenuPos && (
        <ContextMenu 
          position={contextMenuPos}
          onClose={() => setContextMenuPos(null)}
          onRefresh={() => window.location.reload()}
          onViewChange={() => toggleWindow('settings')} 
          onShutdown={onShutdown}
        />
      )}
    </>
  );
};
