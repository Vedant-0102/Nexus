
import React, { RefObject } from 'react';

interface WindowContentProps {
  children: React.ReactNode;
  windowRef: RefObject<HTMLDivElement>;
}

export const WindowContent: React.FC<WindowContentProps> = ({ children, windowRef }) => {
  return (
    <div className="flex-1 overflow-auto h-full" ref={windowRef}>
      {children}
    </div>
  );
};
