import React, { useState, useRef, useEffect, useCallback } from 'react';
import { WindowType } from './types/WindowTypes';
import { useWindowPosition } from './hooks/useWindowPosition';
import { useWindowResize } from './hooks/useWindowResize';
import { useWindowSnap } from './hooks/useWindowSnap';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { usePhysicsBody } from './hooks/usePhysicsBody';
import { usePhysics } from './context/PhysicsContext';
import { WindowHeader } from './window/WindowHeader';
import { WindowContent } from './window/WindowContent';
import { AppBoundary } from './components/AppBoundary';
import { WindowResizeHandles } from './window/WindowResizeHandles';
import { getTheme, resolveThemeName, WindowThemeName } from './themes/windowThemes';
import { useWindows } from './context/WindowsContext';

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
  const isDraggingRef = useRef(false);

  // Store window content in a ref to prevent remounting when window state changes
  const contentRef = useRef(window.content);

  // Only update content ref if the content prop actually changes (by reference)
  useEffect(() => {
    if (window.content !== contentRef.current) {
      contentRef.current = window.content;
    }
  }, [window.content]);

  const { position, setPosition, originalPosition, setOriginalPosition } =
    useWindowPosition(window, windowSize);

  const { isResizing, startResize } = useWindowResize(windowRef, position, windowSize,
    setWindowSize, setPosition, isMaximized);

  const { snapZone, handleDragMove, handleDragEnd, clearSnap, snapToZone, getSnapPosition } = useWindowSnap();
  const [isFocused, setIsFocused] = useState(false);

  // Physics integration
  const { engine } = usePhysics();
  const { isPhysicsActive, physicsPosition, applyImpulse, speed } = usePhysicsBody({
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
      handleMinimize();
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

  // Get theme styles (dark-mode-aware, with user overrides)
  const { isDarkMode, windowThemeOverrides, setWindowTheme, globalWindowTheme } = useWindows();
  const overrideName = windowThemeOverrides[window.id] as WindowThemeName | undefined;
  const resolvedDefault = resolveThemeName(window.theme);
  // Use per-window override first, then pre-set theme if not 'default', then global theme
  const themeName = overrideName || (resolvedDefault !== 'default' ? resolvedDefault : globalWindowTheme);
  const theme = getTheme(themeName, isDarkMode);
  const windowStyle: React.CSSProperties = {
    background: theme.bodyBg,
    backdropFilter: theme.glassEffect ? 'blur(20px)' : 'none',
    border: `1px solid ${theme.borderColor}`,
    boxShadow: `0 8px 32px ${theme.shadowColor}`,
    // Set CSS custom properties for inner content to use
    ['--win-accent' as string]: theme.accentColor,
    ['--win-body-bg' as string]: theme.bodyBg,
    ['--win-body-text' as string]: theme.bodyText,
    color: theme.bodyText,
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

  const handleMinimize = useCallback(() => {
    // If maximized or snapped, restore to original position/size before minimizing
    // so that when the window is unminimized, it appears at its pre-maximize position
    if (isMaximized || isSnapped) {
      setPosition(originalPosition);
      setWindowSize(originalSize);
      setIsMaximized(false);
      setIsSnapped(false);
      clearSnap();
    }
    onMinimize();
  }, [isMaximized, isSnapped, originalPosition, originalSize, onMinimize, setPosition, clearSnap]);

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

  // Unified header drag handler — works for normal drag, un-snap from maximized, etc.
  const handleHeaderMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't start drag if clicking on a button
    if (e.target instanceof HTMLElement && e.target.closest('button')) {
      return;
    }

    e.preventDefault();
    onFocus();
    setIsFocused(true);
    isDraggingRef.current = true;

    if (isMaximized || isSnapped) {
      // Un-snap: restore original size and position under cursor
      const mouseX = e.clientX || 0;
      const mouseY = e.clientY || 0;
      const ratio = mouseX / (globalThis.window?.innerWidth || 1920);

      setIsMaximized(false);
      setIsSnapped(false);
      clearSnap();

      const newX = Math.max(0, Math.min(mouseX - (originalSize.width * ratio), (globalThis.window?.innerWidth || 1920) - originalSize.width));
      const newY = Math.max(0, mouseY - 20);

      setPosition({ x: newX, y: newY });
      setWindowSize(originalSize);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - mouseX;
        const dy = moveEvent.clientY - mouseY;

        const screenWidth = globalThis.window?.innerWidth || 1920;
        const screenHeight = globalThis.window?.innerHeight || 1080;
        const maxX = screenWidth - 100;
        const maxY = screenHeight - 60;
        const minX = -originalSize.width + 100;

        const newPosX = Math.max(minX, Math.min(maxX, newX + dx));
        const newPosY = Math.max(0, Math.min(maxY, newY + dy));

        setPosition({ x: newPosX, y: newPosY });
        handleDragMove(moveEvent.clientX, moveEvent.clientY);
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        isDraggingRef.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        const snapResult = handleDragEnd(upEvent.clientX, upEvent.clientY);
        if (snapResult) {
          setOriginalSize(originalSize);
          setOriginalPosition({ x: newX, y: newY });
          setPosition({ x: snapResult.x, y: snapResult.y });
          setWindowSize({ width: snapResult.width, height: snapResult.height });
          setIsSnapped(true);
          if (snapZone === 'maximized') {
            setIsMaximized(true);
            setIsSnapped(false);
          }
        }
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      // Normal drag
      const startX = e.clientX;
      const startY = e.clientY;
      const startPos = { x: position.x, y: position.y };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const screenWidth = globalThis.window?.innerWidth || 1920;
        const screenHeight = globalThis.window?.innerHeight || 1080;
        const maxX = screenWidth - 100;
        const maxY = screenHeight - 60;
        const minX = -windowSize.width + 100;

        const newX = Math.max(minX, Math.min(maxX, startPos.x + (moveEvent.clientX - startX)));
        const newY = Math.max(0, Math.min(maxY, startPos.y + (moveEvent.clientY - startY)));

        setPosition({ x: newX, y: newY });
        handleDragMove(moveEvent.clientX, moveEvent.clientY);
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        isDraggingRef.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        if (upEvent.clientX && upEvent.clientY) {
          const snapResult = handleDragEnd(upEvent.clientX, upEvent.clientY);
          if (snapResult) {
            setOriginalSize(windowSize);
            setOriginalPosition(startPos);
            setPosition({ x: snapResult.x, y: snapResult.y });
            setWindowSize({ width: snapResult.width, height: snapResult.height });
            if (snapZone === 'maximized') {
              setIsMaximized(true);
              setIsSnapped(false);
            } else {
              setIsSnapped(true);
            }
          }
        }
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  }, [isMaximized, isSnapped, position, windowSize, originalSize, originalPosition,
    onFocus, clearSnap, handleDragMove, handleDragEnd, snapZone, setPosition,
    setOriginalPosition, setOriginalSize]);

  // Physics drag on entire window
  const handlePhysicsMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('button')) {
      return;
    }

    onFocus();
    setIsFocused(true);

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
  }, [engine, window.id, onFocus]);

  // Focus click handler (skip interactive elements)
  const handleFocusClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('input') ||
      target.closest('select') || target.closest('textarea') ||
      target.closest('[role="slider"]') || target.closest('[role="button"]')) {
      return;
    }
    onFocus();
    setIsFocused(true);
  }, [onFocus]);

  if (!window.isOpen) return null;

  // Use physics position if physics is active
  const displayPosition = isPhysicsActive && physicsPosition ? physicsPosition : position;
  const displayRotation = isPhysicsActive && physicsPosition ? physicsPosition.rotation : 0;
  const useFixed = (isMaximized || isSnapped) && !isPhysicsActive;

  // Speed-based visual effects for physics mode
  const speedIntensity = isPhysicsActive ? Math.min(1, speed / 600) : 0;
  const physicsGlow = speedIntensity > 0.1
    ? `0 0 ${Math.round(6 + speedIntensity * 20)}px rgba(139, 92, 246, ${speedIntensity * 0.4}), 0 0 ${Math.round(12 + speedIntensity * 40)}px rgba(139, 92, 246, ${speedIntensity * 0.15})`
    : '';

  return (
    <div
      ref={nodeRef}
      className={`${useFixed ? 'fixed' : 'absolute'} rounded-xl ${
        useFixed ? 'transition-all duration-300 ease-in-out' : 'transition-opacity duration-200'
      } ${window.isMinimized ? 'opacity-0 pointer-events-none' : 'opacity-100'} ${
        isPhysicsActive ? 'cursor-move' : ''
      }`}
      style={{
        ...windowStyle,
        width: windowSize.width,
        height: windowSize.height,
        left: displayPosition.x,
        top: displayPosition.y,
        zIndex: window.zIndex,
        overflow: isPhysicsActive ? 'visible' : 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transform: displayRotation ? `rotate(${displayRotation}rad)` : undefined,
        ...(!useFixed && !isPhysicsActive ? {
          maxWidth: '100%',
          maxHeight: 'calc(100% - 48px)',
          minWidth: '300px',
          minHeight: '200px',
        } : {}),
        pointerEvents: isPhysicsActive ? 'auto' : undefined,
        boxShadow: physicsGlow
          ? `${windowStyle.boxShadow}, ${physicsGlow}`
          : windowStyle.boxShadow,
      }}
      onClick={handleFocusClick}
      onBlur={() => setIsFocused(false)}
      tabIndex={0}
    >
      <div
        className="window-header cursor-move"
        onMouseDown={isPhysicsActive ? handlePhysicsMouseDown : handleHeaderMouseDown}
        onDoubleClick={isPhysicsActive ? () => applyImpulse(0, -400) : undefined}
      >
        <WindowHeader
          title={window.title}
          icon={window.icon}
          isMaximizable={window.isMaximizable}
          isClosable={window.isClosable}
          onMinimize={handleMinimize}
          onMaximize={handleMaximize}
          onClose={onClose}
          theme={theme}
          windowId={window.id}
          currentThemeName={overrideName || themeName}
          onThemeChange={(name: string) => setWindowTheme(window.id, name)}
        />
      </div>

      <WindowContent windowRef={windowRef}>
        {/* Apps are code-split, so their chunk may still be in flight when the
            window first paints. This boundary supplies the loading state and
            keeps a failed chunk from taking down the whole desktop. */}
        <AppBoundary>{contentRef.current}</AppBoundary>
      </WindowContent>

      {!isMaximized && !isSnapped && window.isResizable !== false && !isPhysicsActive && (
        <WindowResizeHandles startResize={startResize} />
      )}
    </div>
  );
};

// Memoize Window component to prevent unnecessary re-renders
export const MemoizedWindow = React.memo(Window, (prevProps, nextProps) => {
  const stateChanged =
    prevProps.window.isMinimized !== nextProps.window.isMinimized ||
    prevProps.window.zIndex !== nextProps.window.zIndex ||
    prevProps.window.isOpen !== nextProps.window.isOpen ||
    prevProps.window.theme !== nextProps.window.theme;

  return !stateChanged;
});

MemoizedWindow.displayName = 'MemoizedWindow';
