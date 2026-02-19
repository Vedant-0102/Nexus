import React, { useState, useRef, useEffect, useCallback } from 'react';
import { WindowType } from '../types/WindowTypes';
import Draggable, { DraggableEvent, DraggableData } from 'react-draggable';
import { useWindowPosition } from '../hooks/useWindowPosition';
import { useWindowResize } from '../hooks/useWindowResize';
import { WindowHeader } from '../window/WindowHeader';
import { WindowContent } from '../window/WindowContent';
import { WindowResizeHandles } from '../window/WindowResizeHandles';

interface WindowProps {
  window: WindowType;
  onClose: () => void;
  onMinimize: () => void;
  onFocus: () => void;
}

export const Window: React.FC<WindowProps> = ({ window, onClose, onMinimize, onFocus }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.defaultSize?.width || 700,
    height: window.defaultSize?.height || 500
  });
  const [originalSize, setOriginalSize] = useState({
    width: window.defaultSize?.width || 700,
    height: window.defaultSize?.height || 500
  });

  const windowRef = useRef<HTMLDivElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const hasCenteredRef = useRef(false);

  const { position, setPosition, originalPosition, setOriginalPosition } = useWindowPosition(window, windowSize);
  const { isResizing, startResize } = useWindowResize(
    windowRef,
    position,
    windowSize,
    setWindowSize,
    setPosition,
    isMaximized
  );

  // Bring window to front immediately when it opens
  useEffect(() => {
    if (window.isOpen && !window.isMinimized) {
      onFocus();
    }
  }, [window.isOpen, window.isMinimized]);

  const getScreenDimensions = () => {
    if (typeof globalThis.window !== 'undefined') {
      return {
        screenWidth: globalThis.window.innerWidth,
        screenHeight: globalThis.window.innerHeight
      };
    }
    return {
      screenWidth: 1920,
      screenHeight: 1080
    };
  };

  // Center only on initial open, not on subsequent size changes (like maximize/restore)
  useEffect(() => {
    if (window.isOpen && !window.isMinimized && !hasCenteredRef.current) {
      hasCenteredRef.current = true;
      const { screenWidth, screenHeight } = getScreenDimensions();

      const centerX = Math.max(0, Math.min(
        (screenWidth - windowSize.width) / 2,
        screenWidth - windowSize.width
      ));
      const centerY = Math.max(0, Math.min(
        (screenHeight - windowSize.height - 60) / 2,
        screenHeight - windowSize.height - 60
      ));

      setPosition({ x: centerX, y: centerY });
      setOriginalPosition({ x: centerX, y: centerY });

      setTimeout(() => {
        if (windowRef.current) {
          windowRef.current.focus();
          windowRef.current.style.opacity = '1';
        }
        onFocus();
      }, 10);
    }
    if (!window.isOpen) {
      hasCenteredRef.current = false;
    }
  }, [window.isOpen, window.isMinimized]);

  const handleMaximize = useCallback(() => {
    if (!isMaximized) {
      setOriginalPosition(position);
      setOriginalSize(windowSize);

      const { screenWidth, screenHeight } = getScreenDimensions();

      setWindowSize({
        width: screenWidth,
        height: screenHeight - 48
      });

      setIsMaximized(true);
    } else {
      setPosition(originalPosition);
      setWindowSize(originalSize);
      setIsMaximized(false);
    }
  }, [isMaximized, position, windowSize, originalPosition, originalSize, setPosition]);

  const handleDrag = useCallback((e: DraggableEvent, data: DraggableData) => {
    if (!isMaximized && !isResizing) {
      const { screenWidth, screenHeight } = getScreenDimensions();

      const maxX = screenWidth - 50;
      const maxY = screenHeight - 50;
      const minX = -windowSize.width + 50;
      const minY = 0;

      const constrainedX = Math.max(minX, Math.min(maxX, data.x));
      const constrainedY = Math.max(minY, Math.min(maxY, data.y));

      setPosition({ x: constrainedX, y: constrainedY });
      dragRef.current = { x: constrainedX, y: constrainedY };
    }
  }, [isMaximized, isResizing, windowSize.width, setPosition]);

  const handleDragStart = useCallback(() => {
    onFocus();
  }, [onFocus]);

  if (!window.isOpen) return null;

  return (
    <Draggable
      handle=".window-header"
      disabled={isMaximized || isResizing}
      onStart={handleDragStart}
      onDrag={handleDrag}
      position={isMaximized ? { x: 0, y: 0 } : position}
      bounds="parent"
      nodeRef={nodeRef}
    >
      <div
        ref={nodeRef}
        className={`win11-glass absolute ${
          isMaximized ? 'transition-all duration-200' : ''
        } ${
          window.isMinimized ? 'opacity-0 pointer-events-none' : 'opacity-100'
        } dark:text-white`}
        style={{
          ...windowSize,
          position: 'absolute',
          zIndex: window.zIndex || 1000,
        }}
        onClick={() => {
          onFocus();
          // Ensure window is brought to front when clicked
          window.bringToFront?.(window.id);
        }}
        tabIndex={0}
      >
        <WindowHeader
          title={window.title}
          icon={window.icon}
          isMaximizable={window.isMaximizable}
          isClosable={window.isClosable}
          onMinimize={onMinimize}
          onMaximize={handleMaximize}
          onClose={onClose}
        />

        <WindowContent windowRef={windowRef}>
          {window.content}
        </WindowContent>

        {!isMaximized && window.isResizable !== false && (
          <WindowResizeHandles startResize={startResize} />
        )}
      </div>
    </Draggable>
  );
};

Window.displayName = 'Window';