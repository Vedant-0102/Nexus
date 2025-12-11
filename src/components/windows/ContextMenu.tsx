
import React from 'react';
import { RefreshCw, Settings, Power } from 'lucide-react';

interface ContextMenuProps {
  position: { x: number; y: number } | null;
  onClose: () => void;
  onRefresh: () => void;
  onViewChange: () => void;
  onShutdown?: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ position, onClose, onRefresh, onViewChange, onShutdown }) => {
  if (!position) return null;

  let adjustedX = position.x;
  let adjustedY = position.y;
  
  if (typeof window !== 'undefined') {
    const menuWidth = 180;
    const menuHeight = 160;
    
    if (position.x + menuWidth > window.innerWidth) {
      adjustedX = window.innerWidth - menuWidth;
    }
    
    if (position.y + menuHeight > window.innerHeight) {
      adjustedY = window.innerHeight - menuHeight;
    }
  }

  return (
    <div 
      className="fixed z-50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 w-44 py-1"
      style={{ 
        left: adjustedX, 
        top: adjustedY 
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
        onClick={() => {
          onRefresh(); 
          onClose();
        }}
      >
        <RefreshCw size={16} />
        <span>Refresh</span>
      </button>
      
      <button
        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
        onClick={() => {
          onViewChange();
          onClose();
        }}
      >
        <Settings size={16} />
        <span>Settings</span>
      </button>
      
      {onShutdown && (
        <>
          <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
          
          <button
            className="w-full text-left px-4 py-2 hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center gap-2 text-red-600 dark:text-red-400"
            onClick={() => {
              if (onShutdown) onShutdown();
              onClose();
            }}
          >
            <Power size={16} />
            <span>Shutdown</span>
          </button>
        </>
      )}
    </div>
  );
};
