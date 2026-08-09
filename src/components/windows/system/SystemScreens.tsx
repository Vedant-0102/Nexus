import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSystem } from '../context/SystemContext';
import { Power, User, ArrowRight, RotateCcw } from 'lucide-react';

/** Full-screen overlays for the PC lifecycle: boot, lock, login, sleep, power off. */

const Screen: React.FC<{ className?: string; children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...rest
}) => (
  <div className={`fixed inset-0 z-[2000] select-none ${className}`} {...rest}>
    {children}
  </div>
);

const NexusLogo: React.FC<{ size?: number }> = ({ size = 88 }) => (
  <div className="grid grid-cols-2 gap-1.5" style={{ width: size, height: size }}>
    {[0, 1, 2, 3].map(i => (
      <div key={i} className="bg-sky-400 rounded-[3px]" />
    ))}
  </div>
);

/* ------------------------------- Boot ------------------------------- */

export const BootScreen: React.FC = () => {
  const { bootComplete } = useSystem();
  const [phase, setPhase] = useState(0); // 0 = black, 1 = logo + spinner

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => bootComplete(), 3600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [bootComplete]);

  return (
    <Screen className="bg-black flex flex-col items-center justify-center">
      {phase >= 1 && (
        <>
          <div className="animate-fade-in mb-16">
            <NexusLogo />
          </div>
          <div className="w-8 h-8 border-[3px] border-white/25 border-t-white rounded-full animate-spin" />
          <p className="text-white/40 text-sm mt-10 tracking-widest">NEXUS OS</p>
        </>
      )}
    </Screen>
  );
};

/* ------------------------------- Lock ------------------------------- */

const useClock = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
};

export const LockScreen: React.FC = () => {
  const { goToLogin } = useSystem();
  const now = useClock();
  const [leaving, setLeaving] = useState(false);

  const dismiss = useCallback(() => {
    setLeaving(true);
    setTimeout(goToLogin, 250);
  }, [goToLogin]);

  useEffect(() => {
    const onKey = () => dismiss();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dismiss]);

  return (
    <Screen
      onClick={dismiss}
      className={`cursor-pointer transition-all duration-300 ${leaving ? 'opacity-0 -translate-y-6' : 'opacity-100'}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#0b2d5c] via-[#123c74] to-[#071d3e]" />
      <div className="absolute inset-0 flex flex-col items-center pt-[18vh] text-white">
        <div className="text-[5.5rem] leading-none font-light tracking-tight drop-shadow-lg">
          {now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </div>
        <div className="text-2xl mt-3 font-light drop-shadow">
          {now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>
      <p className="absolute bottom-10 w-full text-center text-white/60 text-sm animate-pulse">
        Click anywhere or press any key to sign in
      </p>
    </Screen>
  );
};

/* ------------------------------- Login ------------------------------- */

export const LoginScreen: React.FC = () => {
  const { signIn } = useSystem();
  const [password, setPassword] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), []);

  const submit = () => {
    if (signingIn) return;
    setSigningIn(true);
    setTimeout(signIn, 1400);
  };

  return (
    <Screen className="bg-gradient-to-br from-[#0b2d5c] via-[#123c74] to-[#071d3e]">
      <div className="absolute inset-0 backdrop-blur-xl bg-black/30" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <div className="w-32 h-32 rounded-full bg-white/15 border border-white/20 flex items-center justify-center mb-5 shadow-xl">
          <User size={64} className="text-white/85" />
        </div>
        <h2 className="text-2xl font-medium mb-8">Nexus User</h2>

        {signingIn ? (
          <div className="flex flex-col items-center">
            <div className="w-7 h-7 border-[3px] border-white/25 border-t-white rounded-full animate-spin mb-4" />
            <p className="text-white/80">Welcome</p>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="Password"
              className="w-64 px-4 py-2 rounded-md bg-white/15 border border-white/25 placeholder:text-white/45 text-white outline-none focus:bg-white/20 focus:border-white/50 transition-colors"
            />
            <button
              onClick={submit}
              className="p-2 rounded-md bg-white/15 border border-white/25 hover:bg-white/25 transition-colors"
              aria-label="Sign in"
            >
              <ArrowRight size={20} />
            </button>
          </div>
        )}

        {!signingIn && (
          <p className="text-white/45 text-xs mt-4">Hint: any password works on this PC</p>
        )}
      </div>
    </Screen>
  );
};

/* ------------------------------- Sleep ------------------------------- */

export const SleepScreen: React.FC = () => {
  const { wake } = useSystem();
  const [dimmed, setDimmed] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setDimmed(true));
    const onKey = () => wake();
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
    };
  }, [wake]);

  return (
    <Screen
      onClick={wake}
      className={`bg-black cursor-pointer transition-opacity duration-1000 ${dimmed ? 'opacity-100' : 'opacity-0'}`}
    >
      <p className="absolute bottom-10 w-full text-center text-white/20 text-sm">
        Sleeping — click or press any key to wake
      </p>
    </Screen>
  );
};

/* --------------------------- Shutting down --------------------------- */

export const ShuttingDownScreen: React.FC<{ restarting?: boolean }> = ({ restarting }) => (
  <Screen className="bg-black flex flex-col items-center justify-center text-white">
    <div className="w-9 h-9 border-[3px] border-white/25 border-t-white rounded-full animate-spin mb-8" />
    <div className="flex items-center gap-3 text-xl font-light">
      {restarting ? <RotateCcw size={22} /> : <Power size={22} />}
      {restarting ? 'Restarting…' : 'Shutting down…'}
    </div>
  </Screen>
);

/* ------------------------------ Powered off ------------------------------ */

export const PoweredOffScreen: React.FC = () => {
  const { powerOn } = useSystem();
  const [hintVisible, setHintVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHintVisible(true), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <Screen className="bg-black flex flex-col items-center justify-center">
      <button
        onClick={powerOn}
        aria-label="Power on"
        className="group w-20 h-20 rounded-full border-2 border-white/15 flex items-center justify-center
                   hover:border-sky-400/70 hover:shadow-[0_0_35px_rgba(56,189,248,0.35)] transition-all duration-300"
      >
        <Power size={34} className="text-white/25 group-hover:text-sky-400 transition-colors duration-300" />
      </button>
      <p
        className={`text-white/25 text-sm mt-8 transition-opacity duration-1000 ${hintVisible ? 'opacity-100' : 'opacity-0'}`}
      >
        Press the power button to start
      </p>
    </Screen>
  );
};
