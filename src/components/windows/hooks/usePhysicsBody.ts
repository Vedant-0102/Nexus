import { useEffect, useRef } from 'react';
import { usePhysics } from '../context/PhysicsContext';
import { PhysicsBody } from '../physics/PhysicsEngine';

interface UsePhysicsBodyOptions {
  id: string;
  initialX: number;
  initialY: number;
  width: number;
  height: number;
  mass?: number;
  restitution?: number;
  friction?: number;
  isStatic?: boolean;
}

export const usePhysicsBody = (options: UsePhysicsBodyOptions) => {
  const { isPhysicsEnabled, registerBody, unregisterBody, getBodyPosition, engine } = usePhysics();
  const isRegisteredRef = useRef(false);

  useEffect(() => {
    if (isPhysicsEnabled) {
      const body: PhysicsBody = {
        id: options.id,
        x: options.initialX,
        y: options.initialY,
        width: options.width,
        height: options.height,
        vx: 0,
        vy: 0,
        mass: options.mass || 1,
        restitution: options.restitution || 0.3,
        friction: options.friction || 0.5,
        isStatic: options.isStatic || false,
        rotation: 0,
        angularVelocity: 0,
      };

      registerBody(body);
      isRegisteredRef.current = true;
    } else if (isRegisteredRef.current) {
      // Unregister when physics is disabled
      unregisterBody(options.id);
      isRegisteredRef.current = false;
    }

    return () => {
      if (isRegisteredRef.current) {
        unregisterBody(options.id);
        isRegisteredRef.current = false;
      }
    };
  }, [isPhysicsEnabled, options.id, options.initialX, options.initialY]);

  // Update body dimensions if they change
  useEffect(() => {
    if (isPhysicsEnabled && engine) {
      engine.updateBody(options.id, {
        width: options.width,
        height: options.height,
      });
    }
  }, [options.width, options.height, isPhysicsEnabled, engine, options.id]);

  const position = isPhysicsEnabled ? getBodyPosition(options.id) : null;

  return {
    isPhysicsActive: isPhysicsEnabled,
    physicsPosition: position,
    applyImpulse: (vx: number, vy: number) => {
      if (engine && isPhysicsEnabled) {
        engine.applyImpulse(options.id, vx, vy);
      }
    },
    applyForce: (fx: number, fy: number) => {
      if (engine && isPhysicsEnabled) {
        engine.applyForce(options.id, fx, fy);
      }
    },
  };
};
