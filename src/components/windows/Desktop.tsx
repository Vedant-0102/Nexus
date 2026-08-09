import React, { useState, useEffect } from 'react';
import { WindowsProvider, useWindows } from './context/WindowsContext';
import { PhysicsProvider } from './context/PhysicsContext';
import { SystemProvider, useSystem } from './context/SystemContext';
import {
  BootScreen,
  LockScreen,
  LoginScreen,
  SleepScreen,
  ShuttingDownScreen,
  PoweredOffScreen,
} from './system/SystemScreens';
import { DesktopIcons } from './components/DesktopIcons';
import { WindowsDisplay } from './components/WindowsDisplay';
import { DesktopMenus } from './components/DesktopMenus';
import { TaskbarContainer } from './TaskbarContainer';
import { SpotlightSearch } from './SpotlightSearch';
import { SnapPreviewGlobal } from './components/SnapPreviewGlobal';
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp';
import { PhysicsToggle } from './components/PhysicsToggle';
import { BallPitDesktop } from './features/games/BallPitDesktop';
import { RefreshCw } from 'lucide-react';

export const Desktop = () => (
  <SystemProvider>
    <SystemShell />
  </SystemProvider>
);

/**
 * Renders the desktop session plus whichever lifecycle screen is active.
 * The desktop stays mounted underneath lock/login/sleep so open windows
 * survive; restart/shutdown/sign-out bump sessionKey and remount it fresh.
 */
const SystemShell: React.FC = () => {
  const { state, sessionKey } = useSystem();
  const desktopMounted = ['desktop', 'lock', 'login', 'sleeping'].includes(state);

  return (
    <>
      {desktopMounted && (
        <WindowsProvider key={sessionKey}>
          <PhysicsProvider>
            <DesktopSession />
          </PhysicsProvider>
        </WindowsProvider>
      )}
      {state === 'booting' && <BootScreen />}
      {state === 'lock' && <LockScreen />}
      {state === 'login' && <LoginScreen />}
      {state === 'sleeping' && <SleepScreen />}
      {state === 'shutting-down' && <ShuttingDownScreen />}
      {state === 'restarting' && <ShuttingDownScreen restarting />}
      {state === 'off' && <PoweredOffScreen />}
    </>
  );
};

const DesktopSession: React.FC = () => {
  const { wallpaper } = useWindows();
  const { power } = useSystem();
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBallPitMode, setIsBallPitMode] = useState(false);

  // Keyboard shortcut for Spotlight search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
        setIsStartMenuOpen(false);
      }
      // Win+L style lock (Ctrl+Alt+L to avoid the real OS shortcut)
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        power('lock');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [power]);

  const toggleStartMenu = () => {
    setIsStartMenuOpen(prev => !prev);
    setIsSearchOpen(false);
    setContextMenuPos(null);
  };

  const toggleSearchPanel = () => {
    setIsSearchOpen(prev => !prev);
    setIsStartMenuOpen(false);
    setContextMenuPos(null);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setIsStartMenuOpen(false);
    setIsSearchOpen(false);
  };

  const handleDesktopClick = () => {
    setContextMenuPos(null);
    setIsStartMenuOpen(false);
    setIsSearchOpen(false);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  return (
    <div
      className="h-screen w-screen relative overflow-hidden"
      style={(() => {
        if (!wallpaper) return { backgroundColor: '#0078D4' };
        if (wallpaper.startsWith('linear-gradient(') || wallpaper.startsWith('radial-gradient(')) {
          return { background: wallpaper };
        }
        if (wallpaper.startsWith('#') || wallpaper.startsWith('rgb')) {
          return { backgroundColor: wallpaper };
        }
        return { backgroundImage: `url(${wallpaper})`, backgroundSize: 'cover' as const, backgroundPosition: 'center' };
      })()}
      onContextMenu={handleContextMenu}
      onClick={handleDesktopClick}
    >
      {!isBallPitMode && <DesktopIcons />}
      {isBallPitMode && <div className="absolute inset-0 bottom-12"><BallPitDesktop /></div>}
      <WindowsDisplay />
      <SnapPreviewGlobal />
      <KeyboardShortcutsHelp />
      <PhysicsToggle onBallPitToggle={() => setIsBallPitMode(!isBallPitMode)} isBallPitMode={isBallPitMode} />
      <DesktopMenus
        isStartMenuOpen={isStartMenuOpen}
        setIsStartMenuOpen={setIsStartMenuOpen}
        contextMenuPos={contextMenuPos}
        setContextMenuPos={setContextMenuPos}
        onShutdown={() => power('shutdown')}
        onRefresh={handleRefresh}
      />
      <SpotlightSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
      <TaskbarContainer
        isStartMenuOpen={isStartMenuOpen}
        isSearchOpen={isSearchOpen}
        onStartClick={toggleStartMenu}
        onSearchClick={toggleSearchPanel}
        onRefreshClick={handleRefresh}
      />

      {isRefreshing && (
        <div className="absolute inset-0 z-[500] bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <RefreshCw size={40} className="text-white animate-spin" />
        </div>
      )}
    </div>
  );
};

export default Desktop;
