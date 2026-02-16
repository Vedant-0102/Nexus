import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { PhysicsEngine, PhysicsBody, PhysicsEffect } from '../physics/PhysicsEngine';

interface PhysicsContextType {
  isPhysicsEnabled: boolean;
  togglePhysics: () => void;
  engine: PhysicsEngine | null;
  registerBody: (body: PhysicsBody) => void;
  unregisterBody: (id: string) => void;
  updateBodyPosition: (id: string, x: number, y: number) => void;
  getBodyPosition: (id: string) => { x: number; y: number; rotation: number } | null;
  getBodySpeed: (id: string) => number;
  shake: () => void;
  explode: (x: number, y: number) => void;
  implode: (x: number, y: number) => void;
  launchAll: () => void;
  scatter: () => void;
  stackInCenter: () => void;
  freezeAll: () => void;
  unfreezeAll: () => void;
  isAllFrozen: boolean;
  toggleEffect: (effect: PhysicsEffect) => void;
  isEffectActive: (effect: PhysicsEffect) => boolean;
  activeEffects: PhysicsEffect[];
  clearAllEffects: () => void;
  updateMagnetPosition: (x: number, y: number) => void;
  setGravityMultiplier: (multiplier: number) => void;
  gravityMultiplier: number;
  setTimeScale: (scale: number) => void;
  timeScale: number;
  setBounciness: (bounce: number) => void;
  bounciness: number;
  bodyCount: number;
  totalEnergy: number;
}

const PhysicsContext = createContext<PhysicsContextType | undefined>(undefined);

export const PhysicsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPhysicsEnabled, setIsPhysicsEnabled] = useState(false);
  const engineRef = useRef<PhysicsEngine | null>(null);
  const [, forceUpdate] = useState({});
  const [gravityMultiplier, setGravityMultiplierState] = useState(1);
  const [timeScale, setTimeScaleState] = useState(1);
  const [bounciness, setBouncinessState] = useState(1);
  const [isAllFrozen, setIsAllFrozen] = useState(false);
  const [activeEffects, setActiveEffects] = useState<PhysicsEffect[]>([]);
  const [bodyCount, setBodyCount] = useState(0);
  const [totalEnergy, setTotalEnergy] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      engineRef.current = new PhysicsEngine({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      // Handle window resize - update bounds without destroying engine
      const handleResize = () => {
        if (engineRef.current) {
          engineRef.current.setBounds({
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
        setActiveEffects([]);
        setIsAllFrozen(false);
        setTimeScaleState(1);
        setBouncinessState(1);
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

  const getBodySpeed = (id: string): number => {
    if (engineRef.current) {
      const body = engineRef.current.getBody(id);
      if (body) return body.speed || 0;
    }
    return 0;
  };

  const shake = () => {
    if (engineRef.current && isPhysicsEnabled) {
      engineRef.current.shake(150);
      setIsAllFrozen(false);
    }
  };

  const explode = (x: number, y: number) => {
    if (engineRef.current && isPhysicsEnabled) {
      engineRef.current.explode(x, y, 600);
      setIsAllFrozen(false);
    }
  };

  const implode = (x: number, y: number) => {
    if (engineRef.current && isPhysicsEnabled) {
      engineRef.current.implode(x, y, 500);
      setIsAllFrozen(false);
    }
  };

  const launchAll = () => {
    if (engineRef.current && isPhysicsEnabled) {
      engineRef.current.launchAll(500);
      setIsAllFrozen(false);
    }
  };

  const scatter = () => {
    if (engineRef.current && isPhysicsEnabled) {
      engineRef.current.scatter(400);
      setIsAllFrozen(false);
    }
  };

  const stackInCenter = () => {
    if (engineRef.current && isPhysicsEnabled) {
      engineRef.current.stackInCenter();
      setIsAllFrozen(false);
    }
  };

  const freezeAll = () => {
    if (engineRef.current && isPhysicsEnabled) {
      engineRef.current.freezeAll();
      setIsAllFrozen(true);
    }
  };

  const unfreezeAll = () => {
    if (engineRef.current && isPhysicsEnabled) {
      engineRef.current.unfreezeAll();
      setIsAllFrozen(false);
    }
  };

  const toggleEffect = useCallback((effect: PhysicsEffect) => {
    if (engineRef.current && isPhysicsEnabled) {
      engineRef.current.toggleEffect(effect);
      setActiveEffects(engineRef.current.getActiveEffects());
      // Sync derived state
      setTimeScaleState(engineRef.current.getTimeScale());
      setGravityMultiplierState(engineRef.current.getGravityMultiplier());
    }
  }, [isPhysicsEnabled]);

  const isEffectActive = useCallback((effect: PhysicsEffect): boolean => {
    if (engineRef.current) {
      return engineRef.current.isEffectActive(effect);
    }
    return false;
  }, []);

  const clearAllEffects = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.clearAllEffects();
      setActiveEffects([]);
      setTimeScaleState(1);
      setGravityMultiplierState(engineRef.current.getGravityMultiplier());
    }
  }, []);

  const updateMagnetPosition = useCallback((x: number, y: number) => {
    if (engineRef.current) {
      engineRef.current.updateMagnetPosition(x, y);
    }
  }, []);

  const setGravityMultiplier = (multiplier: number) => {
    if (engineRef.current) {
      engineRef.current.setGravityMultiplier(multiplier);
      setGravityMultiplierState(multiplier);
    }
  };

  const setTimeScale = (scale: number) => {
    if (engineRef.current) {
      engineRef.current.setTimeScale(scale);
      setTimeScaleState(scale);
    }
  };

  const setBounciness = (bounce: number) => {
    if (engineRef.current) {
      engineRef.current.setBounciness(bounce);
      setBouncinessState(bounce);
    }
  };

  // Force re-render on physics updates and sync stats
  useEffect(() => {
    if (isPhysicsEnabled) {
      const interval = setInterval(() => {
        if (engineRef.current) {
          setBodyCount(engineRef.current.getBodyCount());
          setTotalEnergy(engineRef.current.getTotalEnergy());
        }
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
        getBodySpeed,
        shake,
        explode,
        implode,
        launchAll,
        scatter,
        stackInCenter,
        freezeAll,
        unfreezeAll,
        isAllFrozen,
        toggleEffect,
        isEffectActive,
        activeEffects,
        clearAllEffects,
        updateMagnetPosition,
        setGravityMultiplier,
        gravityMultiplier,
        setTimeScale,
        timeScale,
        setBounciness,
        bounciness,
        bodyCount,
        totalEnergy,
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
