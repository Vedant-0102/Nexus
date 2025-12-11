
import React from 'react';

interface WindowResizeHandlesProps {
  startResize: (direction: string, e: React.MouseEvent) => void;
}

export const WindowResizeHandles: React.FC<WindowResizeHandlesProps> = ({ startResize }) => {
  return (
    <>
      {/* Corner handles - larger hit area */}
      <div
        className="absolute top-0 left-0 w-4 h-4 cursor-nwse-resize z-10 hover:bg-blue-500/20 transition-colors"
        onMouseDown={(e) => startResize('top-left', e)}
      />
      <div
        className="absolute top-0 right-0 w-4 h-4 cursor-nesw-resize z-10 hover:bg-blue-500/20 transition-colors"
        onMouseDown={(e) => startResize('top-right', e)}
      />
      <div
        className="absolute bottom-0 left-0 w-4 h-4 cursor-nesw-resize z-10 hover:bg-blue-500/20 transition-colors"
        onMouseDown={(e) => startResize('bottom-left', e)}
      />
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-10 hover:bg-blue-500/20 transition-colors"
        onMouseDown={(e) => startResize('bottom-right', e)}
      />
      
      {/* Edge handles */}
      <div
        className="absolute top-0 left-4 right-4 h-2 cursor-ns-resize hover:bg-blue-500/10 transition-colors"
        onMouseDown={(e) => startResize('top', e)}
      />
      <div
        className="absolute bottom-0 left-4 right-4 h-2 cursor-ns-resize hover:bg-blue-500/10 transition-colors"
        onMouseDown={(e) => startResize('bottom', e)}
      />
      <div
        className="absolute left-0 top-4 bottom-4 w-2 cursor-ew-resize hover:bg-blue-500/10 transition-colors"
        onMouseDown={(e) => startResize('left', e)}
      />
      <div
        className="absolute right-0 top-4 bottom-4 w-2 cursor-ew-resize hover:bg-blue-500/10 transition-colors"
        onMouseDown={(e) => startResize('right', e)}
      />
    </>
  );
};
