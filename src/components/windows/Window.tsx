import React, { useState, useRef, useEffect } from 'react';
import { WindowType } from './types/WindowTypes';
import Draggable from 'react-draggable';
import { useWindowPosition } from './hooks/useWindowPosition';
import { useWindowResize } from './hooks/useWindowResize';
import { useWindowSnap } from './hooks/useWindowSnap';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { usePhysicsBody } from './hooks/usePhysicsBody';
import { usePhysics } from './context/PhysicsContext';
import { WindowHeader } from './window/WindowHeader';
import { WindowContent } from './window/WindowContent';
import { WindowResizeHandles } from './window/WindowResizeHandles';
import { WINDOW_THEMES } from './themes/windowThemes';

interface WindowProps {
  window: WindowType;
  onClose: () => void;
  onMinimize: () => void;
  onFocus: () => void;
}

export const Window = ({ window, onClose, onMinimize, onFocus }: WindowProps) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isSnapped, setIsSnapped] = useState(false);
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
  const isDraggingRef = useRef(false);

  const { position, setPosition, originalPosition, setOriginalPosition } =
    useWindowPosition(window, windowSize);

  const { isResizing, setIsResizing, resizeDirection, setResizeDirection,
    startResize } = useWindowResize(windowRef, position, windowSize,
      setWindowSize, setPosition, isMaximized);

  const { snapZone, handleDragMove, handleDragEnd, clearSnap, snapToZone, getSnapPosition } = useWindowSnap();
  const [isFocused, setIsFocused] = useState(false);

  // Physics integration
  const { engine } = usePhysics();
  const { isPhysicsActive, physicsPosition, applyImpulse } = usePhysicsBody({
    id: `window-${window.id}`,
    initialX: position.x,
    initialY: position.y,
    width: windowSize.width,
    height: windowSize.height,
    mass: 2,
    restitution: 0.4,
    friction: 0.3,
  });

  // Keyboard shortcuts for snapping
  useKeyboardShortcuts({
    onSnapLeft: () => handleSnapToZone('left'),
    onSnapRight: () => handleSnapToZone('right'),
    onSnapTopLeft: () => handleSnapToZone('top-left'),
    onSnapTopRight: () => handleSnapToZone('top-right'),
    onSnapBottomLeft: () => handleSnapToZone('bottom-left'),
    onSnapBottomRight: () => handleSnapToZone('bottom-right'),
    onMaximize: () => {
      handleSnapToZone('maximized');
    },
    onMinimize: () => {
      onMinimize();
    },
    isActive: isFocused && window.isOpen && !window.isMinimized,
  });

  const handleSnapToZone = (zone: 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'maximized') => {
    // Save current size before snapping
    if (!isSnapped && !isMaximized) {
      setOriginalSize(windowSize);
      setOriginalPosition(position);
    }

    const snapPosition = getSnapPosition(zone);
    if (snapPosition) {
      setPosition({ x: snapPosition.x, y: snapPosition.y });
      setWindowSize({ width: snapPosition.width, height: snapPosition.height });

      if (zone === 'maximized') {
        setIsMaximized(true);
        setIsSnapped(false);
      } else {
        setIsSnapped(true);
        setIsMaximized(false);
      }

      snapToZone(zone);
    }
  };

  const handleRestore = () => {
    if (isMaximized || isSnapped) {
      setPosition(originalPosition);
      setWindowSize(originalSize);
      setIsMaximized(false);
      setIsSnapped(false);
      clearSnap();
    }
  };

  // Get theme styles
  const theme = window.theme || WINDOW_THEMES.default;
  const windowStyle: React.CSSProperties = {
    background: theme.glassEffect
      ? theme.bodyBg
      : theme.bodyBg,
    backdropFilter: theme.glassEffect ? 'blur(20px)' : 'none',
    border: `1px solid ${theme.borderColor}`,
    boxShadow: `0 8px 32px ${theme.shadowColor}`,
  };

  useEffect(() => {
    if (window.isOpen && !window.isMinimized) {
      if (typeof globalThis.window !== 'undefined') {
        const screenWidth = globalThis.window.innerWidth;
        const screenHeight = globalThis.window.innerHeight;

        const centerX = Math.max(0, Math.min((screenWidth - windowSize.width) / 2, screenWidth - windowSize.width));
        const centerY = Math.max(0, Math.min((screenHeight - windowSize.height - 60) / 2, screenHeight - windowSize.height - 60));

        setPosition({ x: centerX, y: centerY });
        setOriginalPosition({ x: centerX, y: centerY });
      }

      if (windowRef.current) {
        windowRef.current.focus();
      }
    }
  }, [window.isOpen]);

  const handleMaximize = () => {
    if (!isMaximized && !isSnapped) {
      setOriginalPosition(position);
      setOriginalSize({
        width: windowSize.width,
        height: windowSize.height
      });

      // Get maximize position
      const maxPos = getSnapPosition('maximized');
      if (maxPos) {
        setPosition({ x: maxPos.x, y: maxPos.y });
        setWindowSize({ width: maxPos.width, height: maxPos.height });
      }

      setIsMaximized(true);
      clearSnap();
    } else {
      setPosition(originalPosition);
      setWindowSize(originalSize);
      setIsMaximized(false);
      setIsSnapped(false);
      clearSnap();
    }
  };

  const handleDrag = (e: any, data: { x: number; y: number }) => {
    const screenWidth = globalThis.window?.innerWidth || 1920;
    const screenHeight = globalThis.window?.innerHeight || 1080;

    const maxX = screenWidth - 100;
    const maxY = screenHeight - 60;
    const minX = -windowSize.width + 100;

    const constrainedX = Math.max(minX, Math.min(maxX, data.x));
    const constrainedY = Math.max(0, Math.min(maxY, data.y));

    setPosition({ x: constrainedX, y: constrainedY });
    dragRef.current = { x: constrainedX, y: constrainedY };

    // Show snap preview while dragging
    if (isDraggingRef.current && e.clientX && e.clientY) {
      handleDragMove(e.clientX, e.clientY);
    }
  };

  const handleDragStart = (e: any) => {
    // Don't start drag if clicking on a button
    if (e.target.closest('button')) {
      return;
    }

    e.preventDefault();
    onFocus();
    setIsFocused(true);
    isDraggingRef.current = true;

    // If window is maximized or snapped, unsnap it immediately
    if (isMaximized || isSnapped) {
      const mouseX = e.clientX || e.touches?.[0]?.clientX || 0;
      const ratio = mouseX / globalThis.window.innerWidth;

      setIsMaximized(false);
      setIsSnapped(false);
      clearSnap();

      // Position window under cursor
      const newX = Math.max(0, Math.min(mouseX - (originalSize.width * ratio), globalThis.window.innerWidth - originalSize.width));
      const newY = Math.max(0, (e.clientY || e.touches?.[0]?.clientY || 0) - 20);

      setPosition({ x: newX, y: newY });
      setWindowSize(originalSize);

      // Set up drag handlers for fixed positioned window
      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - mouseX;
        const deltaY = moveEvent.clientY - (e.clientY || e.touches?.[0]?.clientY || 0);

        const newPosX = Math.max(0, Math.min(newX + deltaX, globalThis.window.innerWidth - originalSize.width));
        const newPosY = Math.max(0, Math.min(newY + deltaY, globalThis.window.innerHeight - 48 - originalSize.height));

        setPosition({ x: newPosX, y: newPosY });

        // Show snap preview
        handleDragMove(moveEvent.clientX, moveEvent.clientY);
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        isDraggingRef.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        // Handle snap on release
        const snapPosition = handleDragEnd(upEvent.clientX, upEvent.clientY);
        if (snapPosition) {
          setOriginalSize(originalSize);
          setOriginalPosition({ x: newX, y: newY });
          setPosition({ x: snapPosition.x, y: snapPosition.y });
          setWindowSize({ width: snapPosition.width, height: snapPosition.height });
          setIsSnapped(true);

          if (snapZone === 'maximized') {
            setIsMaximized(true);
            setIsSnapped(false);
          }
        }
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  };

  const handleDragStop = (e: any) => {
    isDraggingRef.current = false;

    if (e.clientX && e.clientY) {
      const snapPosition = handleDragEnd(e.clientX, e.clientY);

      if (snapPosition) {
        // Save current size before snapping
        if (!isSnapped && !isMaximized) {
          setOriginalSize(windowSize);
          setOriginalPosition(position);
        }

        // Apply snap
        setPosition({ x: snapPosition.x, y: snapPosition.y });
        setWindowSize({ width: snapPosition.width, height: snapPosition.height });
        setIsSnapped(true);

        // If snapped to maximized zone
        if (snapZone === 'maximized') {
          setIsMaximized(true);
          setIsSnapped(false);
        }
      }
    }
  };

  if (!window.isOpen) return null;

  // Use physics position if physics is active
  const displayPosition = isPhysicsActive && physicsPosition ? physicsPosition : position;
  const displayRotation = isPhysicsActive && physicsPosition ? physicsPosition.rotation : 0;

  // When snapped or maximized, use fixed positioning instead of Draggable
  if ((isMaximized || isSnapped) && !isPhysicsActive) {
    return (
      <div
        ref={nodeRef}
        className={`fixed transition-all duration-300 ease-in-out rounded-xl ${window.isMinimized ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        style={{
          ...windowStyle,
          width: windowSize.width,
          height: windowSize.height,
          left: displayPosition.x,
          top: displayPosition.y,
          zIndex: window.zIndex,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transform: `rotate(${displayRotation}rad)`,
        }}
        onClick={(e) => {
          // Don't bring to front if clicking on interactive elements
          const target = e.target as HTMLElement;
          if (target.closest('button') || target.closest('a') || target.closest('input') ||
            target.closest('select') || target.closest('textarea') ||
            target.closest('[role="slider"]') || target.closest('[role="button"]')) {
            return;
          }
          onFocus();
          setIsFocused(true);
        }}
        onBlur={() => setIsFocused(false)}
        tabIndex={0}
      >
        <div
          className="window-header cursor-move"
          onMouseDown={handleDragStart}
        >
          <WindowHeader
            title={window.title}
            icon={window.icon}
            isMaximizable={window.isMaximizable}
            isClosable={window.isClosable}
            onMinimize={onMinimize}
            onMaximize={handleMaximize}
            onClose={onClose}
            theme={theme}
          />
        </div>

        <WindowContent windowRef={windowRef}>
          {window.content}
        </WindowContent>
      </div>
    );
  }

  // If physics is active, use absolute positioning instead of Draggable
  if (isPhysicsActive) {
    const handlePhysicsMouseDown = (e: React.MouseEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('button')) {
        return; // Don't interfere with buttons
      }

      onFocus();
      setIsFocused(true);

      // Start drag in physics engine
      if (engine) {
        engine.startDrag(`window-${window.id}`, e.clientX, e.clientY);

        const handleMouseMove = (moveEvent: MouseEvent) => {
          engine.updateDrag(`window-${window.id}`, moveEvent.clientX, moveEvent.clientY);
        };

        const handleMouseUp = () => {
          engine.endDrag(`window-${window.id}`);
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }
    };

    return (
      <div
        ref={nodeRef}
        className={`win11-glass absolute transition-opacity duration-200 ${window.isMinimized ? 'opacity-0 pointer-events-none' : 'opacity-100'} cursor-move`}
        style={{
          width: windowSize.width,
          height: windowSize.height,
          left: displayPosition.x,
          top: displayPosition.y,
          zIndex: window.zIndex,
          overflow: 'visible',
          display: 'flex',
          flexDirection: 'column',
          transform: `rotate(${displayRotation}rad)`,
          pointerEvents: 'auto',
        }}
        onMouseDown={handlePhysicsMouseDown}
        onDoubleClick={() => applyImpulse(0, -400)}
        onBlur={() => setIsFocused(false)}
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
          theme={theme}
        />

        <WindowContent windowRef={windowRef}>
          {window.content}
        </WindowContent>
      </div>
    );
  }

  return (
    <Draggable
      handle=".window-header"
      disabled={isResizing || isPhysicsActive}
      onStart={handleDragStart}
      onDrag={handleDrag}
      onStop={handleDragStop}
      position={position}
      bounds="parent"
      nodeRef={nodeRef}
    >
      <div
        ref={nodeRef}
        className={`absolute transition-opacity duration-200 rounded-xl ${window.isMinimized ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        style={{
          ...windowStyle,
          width: windowSize.width,
          height: windowSize.height,
          zIndex: window.zIndex,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '100%',
          maxHeight: 'calc(100% - 48px)',
          minWidth: '300px',
          minHeight: '200px',
        }}
        onClick={(e) => {
          // Don't bring to front if clicking on interactive elements
          const target = e.target as HTMLElement;
          if (target.closest('button') || target.closest('a') || target.closest('input') ||
            target.closest('select') || target.closest('textarea') ||
            target.closest('[role="slider"]') || target.closest('[role="button"]')) {
            return;
          }
          onFocus();
          setIsFocused(true);
        }}
        onBlur={() => setIsFocused(false)}
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
          theme={theme}
        />

        <WindowContent windowRef={windowRef}>
          {window.content}
        </WindowContent>

        { }
        {!isMaximized && !isSnapped && window.isResizable !== false && (
          <WindowResizeHandles startResize={startResize} />
        )}
      </div>
    </Draggable>
  );
};

// Memoize Window component to prevent remounting when only window state changes
export const MemoizedWindow = React.memo(Window, (prevProps, nextProps) => {
  // Return true if props are equal (skip re-render)
  // Return false if props changed (do re-render)

  // If content reference changed, always re-render
  if (prevProps.window.content !== nextProps.window.content) {
    return false;
  }

  // Check if important state changed
  const stateChanged =
    prevProps.window.isMinimized !== nextProps.window.isMinimized ||
    prevProps.window.zIndex !== nextProps.window.zIndex;

  // Return true (skip render) if state didn't change
  return !stateChanged;
});

MemoizedWindow.displayName = 'MemoizedWindow';

