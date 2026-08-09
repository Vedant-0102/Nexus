import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { processSimulator } from '../features/system/ProcessSimulator';

/**
 * SystemContext - the PC lifecycle state machine.
 *
 *   booting -> lock -> login -> desktop
 *   desktop -> sleeping -> lock            (wake)
 *   desktop -> lock                        (lock)
 *   desktop -> login                       (sign out, fresh session)
 *   desktop -> restarting -> booting       (fresh session)
 *   desktop -> shutting-down -> off -> booting (power button)
 *
 * `sessionKey` changes whenever the session is destroyed (restart, shutdown,
 * sign out) so the desktop tree remounts from scratch; sleep and lock keep the
 * desktop mounted underneath so open windows survive.
 */

export type SystemState =
  | 'booting'
  | 'lock'
  | 'login'
  | 'desktop'
  | 'sleeping'
  | 'shutting-down'
  | 'restarting'
  | 'off';

export type PowerAction = 'sleep' | 'lock' | 'signout' | 'restart' | 'shutdown';

interface SystemContextType {
  state: SystemState;
  sessionKey: number;
  power: (action: PowerAction) => void;
  wake: () => void;
  bootComplete: () => void;
  goToLogin: () => void;
  signIn: () => void;
  powerOn: () => void;
}

const SystemContext = createContext<SystemContextType>({
  state: 'booting',
  sessionKey: 0,
  power: () => {},
  wake: () => {},
  bootComplete: () => {},
  goToLogin: () => {},
  signIn: () => {},
  powerOn: () => {},
});

export const useSystem = () => useContext(SystemContext);

export const SystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SystemState>('booting');
  const [sessionKey, setSessionKey] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const destroySession = useCallback(() => {
    setSessionKey(k => k + 1);
    processSimulator.resetUptime();
  }, []);

  const power = useCallback((action: PowerAction) => {
    clearTimeout(timeoutRef.current);
    switch (action) {
      case 'sleep':
        setState('sleeping');
        break;
      case 'lock':
        setState('lock');
        break;
      case 'signout':
        destroySession();
        setState('login');
        break;
      case 'restart':
        setState('restarting');
        timeoutRef.current = setTimeout(() => {
          destroySession();
          setState('booting');
        }, 2800);
        break;
      case 'shutdown':
        setState('shutting-down');
        timeoutRef.current = setTimeout(() => {
          destroySession();
          setState('off');
        }, 2800);
        break;
    }
  }, [destroySession]);

  const wake = useCallback(() => setState(s => (s === 'sleeping' ? 'lock' : s)), []);
  const bootComplete = useCallback(() => setState(s => (s === 'booting' ? 'lock' : s)), []);
  const goToLogin = useCallback(() => setState(s => (s === 'lock' ? 'login' : s)), []);
  const signIn = useCallback(() => setState(s => (s === 'login' ? 'desktop' : s)), []);
  const powerOn = useCallback(() => setState(s => (s === 'off' ? 'booting' : s)), []);

  return (
    <SystemContext.Provider
      value={{ state, sessionKey, power, wake, bootComplete, goToLogin, signIn, powerOn }}
    >
      {children}
    </SystemContext.Provider>
  );
};
