import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { PhysicsEngine, PhysicsBody } from '../physics/PhysicsEngine';

interface PhysicsContextType {
  isPhysicsEnabled: boolean;
  togglePhysics: () => void;
  engine: PhysicsEngine | null;
  registerBody: (body: PhysicsBody) => void;
  unregisterBody: (id: string) => void;
  updateBodyPosition: (id: string, x: number, y: number) => void;
  getBodyPosition: (id: string) => { x: number; y: number; rotation: number } | null;
  shake: () => void;
  explode: (x: number, y: number) => void;
  setGravityMultiplier: (multiplier: number) => void;
  gravityMultiplier: number;
}

const PhysicsContext = createContext<PhysicsContextType | undefined>(undefined);

export const PhysicsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPhysicsEnabled, setIsPhysicsEnabled] = useState(false);
  const engineRef = useRef<PhysicsEngine | null>(null);
  const [, forceUpdate] = useState({});
  const [gravityMultiplier, setGravityMultiplierState] = useState(1);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      engineRef.current = new PhysicsEngine({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      // Handle window resize
      const handleResize = () => {
        if (engineRef.current) {
          engineRef.current = new PhysicsEngine({
            width: window.innerWidth,
            height: window.innerHeight,
          });
        }
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const togglePhysics = () => {
    setIsPhysicsEnabled(prev => {
      const newState = !prev;
      
      if (newState && engineRef.current) {
        // Start physics
        engineRef.current.start();
      } else if (!newState && engineRef.current) {
        // Stop physics and reset
        engineRef.current.stop();
        engineRef.current.reset();
      }
      
      return newState;
    });
  };

  const registerBody = (body: PhysicsBody) => {
    if (engineRef.current && isPhysicsEnabled) {
      engineRef.current.addBody(body);
    }
  };

  const unregisterBody = (id: string) => {
    if (engineRef.current) {
      engineRef.current.removeBody(id);
    }
  };

  const updateBodyPosition = (id: string, x: number, y: number) => {
    if (engineRef.current) {
      engineRef.current.updateBody(id, { x, y });
    }
  };

  const getBodyPosition = (id: string) => {
    if (engineRef.current) {
      const body = engineRef.current.getBody(id);
      if (body) {
        return { x: body.x, y: body.y, rotation: body.rotation };
      }
    }
    return null;
  };

  const shake = () => {
    if (engineRef.current && isPhysicsEnabled) {
      engineRef.current.shake(150);
    }
  };

  const explode = (x: number, y: number) => {
    if (engineRef.current && isPhysicsEnabled) {
      engineRef.current.explode(x, y, 600);
    }
  };

  const setGravityMultiplier = (multiplier: number) => {
    if (engineRef.current) {
      engineRef.current.setGravityMultiplier(multiplier);
      setGravityMultiplierState(multiplier);
    }
  };

  // Force re-render on physics updates
  useEffect(() => {
    if (isPhysicsEnabled) {
      const interval = setInterval(() => {
        forceUpdate({});
      }, 16); // ~60fps

      return () => clearInterval(interval);
    }
  }, [isPhysicsEnabled]);

  return (
    <PhysicsContext.Provider
      value={{
        isPhysicsEnabled,
        togglePhysics,
        engine: engineRef.current,
        registerBody,
        unregisterBody,
        updateBodyPosition,
        getBodyPosition,
        shake,
        explode,
        setGravityMultiplier,
        gravityMultiplier,
      }}
    >
      {children}
    </PhysicsContext.Provider>
  );
};

export const usePhysics = () => {
  const context = useContext(PhysicsContext);
  if (!context) {
    throw new Error('usePhysics must be used within PhysicsProvider');
  }
  return context;
};
