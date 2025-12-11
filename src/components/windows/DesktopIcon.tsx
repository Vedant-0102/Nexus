import React, { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import { usePhysicsBody } from './hooks/usePhysicsBody';
import { usePhysics } from './context/PhysicsContext';

interface DesktopIconProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  onDoubleClick: () => void;
  id: string;
}

export const DesktopIcon = ({ label, icon, onClick, onDoubleClick, id }: DesktopIconProps) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const physicsIsDragging = useRef(false); // Move this outside the conditional
  
  useEffect(() => {
    const savedPositions = localStorage.getItem('win11-icon-positions');
    if (savedPositions) {
      try {
        const positions = JSON.parse(savedPositions);
        if (positions[id]) {
          setPosition(positions[id]);
        }
      } catch (error) {
        console.error("Error loading icon positions:", error);
      }
    }
  }, [id]);

  // Physics integration
  const { engine } = usePhysics();
  const { isPhysicsActive, physicsPosition, applyImpulse } = usePhysicsBody({
    id: `icon-${id}`,
    initialX: position.x,
    initialY: position.y,
    width: 96,
    height: 96,
    mass: 0.3, // Lighter for easier throwing
    restitution: 0.7, // More bouncy
    friction: 0.2, // Less friction for more sliding
  });
  
  const handleDragStart = (e: any, data: { x: number; y: number }) => {
    dragStartPos.current = { x: data.x, y: data.y };
    setIsDragging(false);
  };

  const handleDrag = (e: any, data: { x: number; y: number }) => {
    const distance = Math.sqrt(
      Math.pow(data.x - dragStartPos.current.x, 2) + 
      Math.pow(data.y - dragStartPos.current.y, 2)
    );
    if (distance > 5) {
      setIsDragging(true);
    }
  };

  const handleDragStop = (e: any, data: { x: number; y: number }) => {
    const newPosition = { x: data.x, y: data.y };
    setPosition(newPosition);
    
    try {
      const savedPositions = localStorage.getItem('win11-icon-positions');
      const positions = savedPositions ? JSON.parse(savedPositions) : {};
      
      positions[id] = newPosition;
      localStorage.setItem('win11-icon-positions', JSON.stringify(positions));
    } catch (error) {
      console.error("Error saving icon positions:", error);
    }

    // Reset dragging state after a short delay
    setTimeout(() => setIsDragging(false), 100);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!isDragging) {
      onClick();
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!isDragging) {
      onDoubleClick();
    }
  };
  
  // Use physics position if physics is active
  const displayPosition = isPhysicsActive && physicsPosition ? physicsPosition : position;
  const displayRotation = isPhysicsActive && physicsPosition ? physicsPosition.rotation : 0;

  // If physics is active, use absolute positioning
  if (isPhysicsActive) {
    const handlePhysicsMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation();
      physicsIsDragging.current = false;
      
      // Start drag in physics engine
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
          
          // Reset after a short delay
          setTimeout(() => {
            physicsIsDragging.current = false;
          }, 100);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }
    };

    const handlePhysicsClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!physicsIsDragging.current) {
        onClick();
      }
    };

    const handlePhysicsDoubleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!physicsIsDragging.current) {
        onDoubleClick();
        applyImpulse(0, -300);
      }
    };

    return (
      <div 
        ref={nodeRef}
        className="absolute flex flex-col items-center w-24 h-24 p-2 rounded cursor-move select-none"
        style={{
          left: displayPosition.x,
          top: displayPosition.y,
          transform: `rotate(${displayRotation}rad)`,
        }}
        onMouseDown={handlePhysicsMouseDown}
        onClick={handlePhysicsClick}
        onDoubleClick={handlePhysicsDoubleClick}
      >
        <div className="h-12 w-12 flex items-center justify-center">
          {React.cloneElement(icon as React.ReactElement, { 
            size: 36,
            className: "text-white drop-shadow-md" 
          })}
        </div>
        <p className="text-sm text-white font-medium mt-1 text-center leading-tight drop-shadow-md line-clamp-2">
          {label}
        </p>
      </div>
    );
  }

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
        className="flex flex-col items-center w-24 h-24 p-2 rounded hover:bg-white/10 cursor-pointer select-none"
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <div className="h-12 w-12 flex items-center justify-center">
          {React.cloneElement(icon as React.ReactElement, { 
            size: 36,
            className: "text-white drop-shadow-md" 
          })}
        </div>
        <p className="text-sm text-white font-medium mt-1 text-center leading-tight drop-shadow-md line-clamp-2">
          {label}
        </p>
      </div>
    </Draggable>
  );
};
