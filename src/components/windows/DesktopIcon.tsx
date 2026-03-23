import React, { useState, useRef, useCallback, useEffect } from 'react';
import Draggable from 'react-draggable';
import { usePhysicsBody } from './hooks/usePhysicsBody';
import { usePhysics } from './context/PhysicsContext';

interface DesktopIconProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  onDoubleClick: () => void;
  id: string;
  defaultX?: number;
  defaultY?: number;
}

export const DesktopIcon = ({ label, icon, onClick, onDoubleClick, id, defaultX = 0, defaultY = 0 }: DesktopIconProps) => {
  // Always start at grid defaults — physics mode manages its own positions
  const [position, setPosition] = useState({ x: defaultX, y: defaultY });

  const nodeRef = useRef<HTMLDivElement>(null);
  // Use refs (not state) for drag tracking - state updates are async and cause click-swallowing races
  const isDraggingRef = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const physicsIsDragging = useRef(false);

  // Physics integration - position is now absolute screen coords, no elementRef workaround needed
  const { engine } = usePhysics();
  const { isPhysicsActive, physicsPosition, applyImpulse, speed } = usePhysicsBody({
    id: `icon-${id}`,
    initialX: position.x,
    initialY: position.y,
    width: 96,
    height: 96,
    mass: 0.3,
    restitution: 0.7,
    friction: 0.2,
  });

  // Reset position to grid defaults when physics is turned off
  const prevPhysicsRef = useRef(isPhysicsActive);
  useEffect(() => {
    if (prevPhysicsRef.current && !isPhysicsActive) {
      const defaultPos = { x: defaultX, y: defaultY };
      setPosition(defaultPos);
      try {
        const savedPositions = localStorage.getItem('win11-icon-positions');
        const positions = savedPositions ? JSON.parse(savedPositions) : {};
        positions[id] = defaultPos;
        localStorage.setItem('win11-icon-positions', JSON.stringify(positions));
      } catch (error) {
        console.error("Error saving icon positions:", error);
      }
    }
    prevPhysicsRef.current = isPhysicsActive;
  }, [isPhysicsActive, defaultX, defaultY, id]);

  const savePosition = useCallback((newPosition: { x: number; y: number }) => {
    try {
      const savedPositions = localStorage.getItem('win11-icon-positions');
      const positions = savedPositions ? JSON.parse(savedPositions) : {};
      positions[id] = newPosition;
      localStorage.setItem('win11-icon-positions', JSON.stringify(positions));
    } catch (error) {
      console.error("Error saving icon positions:", error);
    }
  }, [id]);

  const handleDragStart = (_e: any, data: { x: number; y: number }) => {
    dragStartPos.current = { x: data.x, y: data.y };
    isDraggingRef.current = false;
  };

  const handleDrag = (_e: any, data: { x: number; y: number }) => {
    const distance = Math.sqrt(
      Math.pow(data.x - dragStartPos.current.x, 2) +
      Math.pow(data.y - dragStartPos.current.y, 2)
    );
    if (distance > 5) {
      isDraggingRef.current = true;
    }
  };

  const handleDragStop = (_e: any, data: { x: number; y: number }) => {
    const newPosition = { x: data.x, y: data.y };
    setPosition(newPosition);
    savePosition(newPosition);
    // Reset dragging after a short delay so the click handler can check it
    setTimeout(() => { isDraggingRef.current = false; }, 100);
  };

  const handleClick = () => {
    if (!isDraggingRef.current) {
      if (isPhysicsActive) {
        // Prevent opening apps during physics mode
        alert('⚠️ Cannot open applications while Physics Mode is active.\n\nPlease disable Physics Mode first to open applications.');
        return;
      }
      onClick();
    }
  };

  const handleDoubleClick = () => {
    if (!isDraggingRef.current) {
      if (isPhysicsActive) {
        // Prevent opening apps during physics mode
        alert('⚠️ Cannot open applications while Physics Mode is active.\n\nPlease disable Physics Mode first to open applications.');
        return;
      }
      onDoubleClick();
    }
  };

  // Physics mode: fixed positioning with screen-space coordinates from the engine
  if (isPhysicsActive) {
    const displayX = physicsPosition ? physicsPosition.x : position.x;
    const displayY = physicsPosition ? physicsPosition.y : position.y;
    const displayRotation = physicsPosition ? physicsPosition.rotation : 0;

    const handlePhysicsMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation();
      physicsIsDragging.current = false;

      if (engine) {
        engine.startDrag(`icon-${id}`, e.clientX, e.clientY);

        const handleMouseMove = (moveEvent: MouseEvent) => {
          physicsIsDragging.current = true;
          engine.updateDrag(`icon-${id}`, moveEvent.clientX, moveEvent.clientY);
        };

        const handleMouseUp = () => {
          engine.endDrag(`icon-${id}`);
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          setTimeout(() => { physicsIsDragging.current = false; }, 100);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }
    };

    const handlePhysicsClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!physicsIsDragging.current) {
        // Prevent opening apps during physics mode
        alert('⚠️ Cannot open applications while Physics Mode is active.\n\nPlease disable Physics Mode first to open applications.');
      }
    };

    const handlePhysicsDoubleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!physicsIsDragging.current) {
        // Prevent opening apps during physics mode
        alert('⚠️ Cannot open applications while Physics Mode is active.\n\nPlease disable Physics Mode first to open applications.');
        applyImpulse(0, -300);
      }
    };

    const speedIntensity = Math.min(1, speed / 500);
    const glowOpacity = speedIntensity * 0.6;
    const glowSize = Math.round(4 + speedIntensity * 16);

    return (
      <div
        ref={nodeRef}
        className="flex flex-col items-center w-24 h-24 p-2 rounded cursor-move select-none"
        style={{
          position: 'fixed',
          left: displayX,
          top: displayY,
          zIndex: 50,
          transform: displayRotation ? `rotate(${displayRotation}rad)` : undefined,
          boxShadow: speedIntensity > 0.1
            ? `0 0 ${glowSize}px rgba(147, 51, 234, ${glowOpacity}), 0 0 ${glowSize * 2}px rgba(147, 51, 234, ${glowOpacity * 0.4})`
            : 'none',
          filter: speedIntensity > 0.5 ? `brightness(${1 + speedIntensity * 0.3})` : 'none',
        }}
        onMouseDown={handlePhysicsMouseDown}
        onClick={handlePhysicsClick}
        onDoubleClick={handlePhysicsDoubleClick}
      >
        <div className="h-12 w-12 flex items-center justify-center">
          {React.cloneElement(icon as React.ReactElement, {
            size: 36,
            className: `text-white transition-transform duration-100 ${speedIntensity > 0.3 ? 'scale-110' : ''}`,
            style: { filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.55))' }
          })}
        </div>
        <p className="text-sm text-white font-medium mt-1 text-center leading-tight line-clamp-2" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 1px 6px rgba(0,0,0,0.5)' }}>
          {label}
        </p>
      </div>
    );
  }

  // Normal mode: draggable within the full-screen parent container
  return (
    <Draggable
      position={position}
      onStart={handleDragStart}
      onDrag={handleDrag}
      onStop={handleDragStop}
      bounds="parent"
      nodeRef={nodeRef}
      grid={[10, 10]}
    >
      <div
        ref={nodeRef}
        className="absolute flex flex-col items-center w-24 h-24 p-2 rounded hover:bg-white/10 cursor-pointer select-none"
        style={{ zIndex: 1 }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <div className="h-12 w-12 flex items-center justify-center">
          {React.cloneElement(icon as React.ReactElement, {
            size: 36,
            className: "text-white",
            style: { filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.55))' }
          })}
        </div>
        <p className="text-sm text-white font-medium mt-1 text-center leading-tight line-clamp-2" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 1px 6px rgba(0,0,0,0.5)' }}>
          {label}
        </p>
      </div>
    </Draggable>
  );
};
