import React, { useState, useEffect } from 'react';
import { WindowsProvider } from './context/WindowsContext';
import { PhysicsProvider } from './context/PhysicsContext';
import { DesktopIcons } from './components/DesktopIcons';
import { WindowsDisplay } from './components/WindowsDisplay';
import { DesktopMenus } from './components/DesktopMenus';
import { TaskbarContainer } from './TaskbarContainer';
import { SpotlightSearch } from './SpotlightSearch';
import { SnapPreviewGlobal } from './components/SnapPreviewGlobal';
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp';
import { PhysicsToggle } from './components/PhysicsToggle';
import { BallPitDesktop } from './features/games/BallPitDesktop';
import { Power, RefreshCw } from 'lucide-react';

export const Desktop = () => {
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [isBootAnimationPlaying, setIsBootAnimationPlaying] = useState(true);
  const [wallpaper, setWallpaper] = useState('');
  const [bootProgress, setBootProgress] = useState(0);
  const [isShuttingDown, setIsShuttingDown] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBallPitMode, setIsBallPitMode] = useState(false);

  useEffect(() => {
    const isShutdownAction = sessionStorage.getItem('win11-shutdown-action') === 'true';
    sessionStorage.removeItem('win11-shutdown-action');

    if (isShutdownAction) {
      setIsBootAnimationPlaying(false);
      return;
    }

    const hasVisited = localStorage.getItem('win11-has-visited');

    if (!hasVisited) {
      setIsBootAnimationPlaying(true);
      localStorage.setItem('win11-has-visited', 'true');

      const progressInterval = setInterval(() => {
        setBootProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setTimeout(() => setIsBootAnimationPlaying(false), 2000);
            return 100;
          }
          return prev + 1;
        });
      }, 120);

      return () => clearInterval(progressInterval);
    } else {
      setIsBootAnimationPlaying(true);

      const progressInterval = setInterval(() => {
        setBootProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setTimeout(() => setIsBootAnimationPlaying(false), 1000);
            return 100;
          }
          return prev + 4;
        });
      }, 80);

      return () => clearInterval(progressInterval);
    }
  }, []);

  useEffect(() => {
    const savedWallpaper = localStorage.getItem('win11-wallpaper');
    if (savedWallpaper) {
      setWallpaper(savedWallpaper);
    }
  }, []);

  // Keyboard shortcut for Spotlight search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
        if (isStartMenuOpen) setIsStartMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStartMenuOpen]);

  const toggleStartMenu = () => {
    setIsStartMenuOpen(!isStartMenuOpen);
    if (isSearchOpen) setIsSearchOpen(false);
    setContextMenuPos(null);
  };

  const toggleSearchPanel = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isStartMenuOpen) setIsStartMenuOpen(false);
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
    if (isStartMenuOpen) setIsStartMenuOpen(false);
    if (isSearchOpen) setIsSearchOpen(false);
  };

  const handleShutdown = () => {
    setIsShuttingDown(true);
    sessionStorage.setItem('win11-shutdown-action', 'true');
    setTimeout(() => {
      document.body.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: #000; z-index: 99999;"></div>
      `;
      document.body.style.overflow = 'hidden';
      document.body.style.cursor = 'none';
      document.addEventListener('keydown', (e) => e.preventDefault(), { capture: true });
      document.addEventListener('click', (e) => e.preventDefault(), { capture: true });
      document.addEventListener('contextmenu', (e) => e.preventDefault(), { capture: true });
    }, 3000);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 2000);
  };

  if (isShuttingDown) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <Power size={48} className="text-white mx-auto mb-6" />
          <div className="text-white text-2xl mb-6">Shutting down...</div>
          <div className="w-16 h-16 border-4 border-t-white border-white/30 rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (isBootAnimationPlaying) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-blue-600">
        <div className="text-center w-80">
          <div className="flex justify-center mb-8">
            <div className="w-32 h-32 rounded-md bg-win-blue flex items-center justify-center">
              <div className="w-16 h-16 border-t-2 border-white rounded-full animate-spin"></div>
            </div>
          </div>
          <p className="text-white/90 text-xl animate-pulse mb-6">Starting Windows</p>
          <div className="w-full bg-white/20 rounded-full h-2.5 mb-4">
            <div
              className="bg-white h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${bootProgress}%` }}
            ></div>
          </div>
          <p className="text-white/70 text-sm">{bootProgress}% complete</p>
        </div>
      </div>
    );
  }

  if (isRefreshing) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-blue-600">
        <div className="text-center">
          <RefreshCw size={48} className="text-white mx-auto mb-6 animate-spin" />
          <div className="text-white text-xl">Refreshing...</div>
        </div>
      </div>
    );
  }

  return (
    <WindowsProvider>
      <PhysicsProvider>
        <div
          className="h-screen w-screen relative overflow-hidden"
          style={wallpaper ? { 
            backgroundImage: `url(${wallpaper})`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center' 
          } : { 
            backgroundColor: '#0078D4' 
          }}
          onContextMenu={handleContextMenu}
          onClick={handleDesktopClick}
        >
          {!isBallPitMode && <DesktopIcons />}
          {isBallPitMode && <BallPitDesktop />}
          <WindowsDisplay />
          <SnapPreviewGlobal />
          <KeyboardShortcutsHelp />
          <PhysicsToggle onBallPitToggle={() => setIsBallPitMode(!isBallPitMode)} isBallPitMode={isBallPitMode} />
          <DesktopMenus
            isStartMenuOpen={isStartMenuOpen}
            setIsStartMenuOpen={setIsStartMenuOpen}
            contextMenuPos={contextMenuPos}
            setContextMenuPos={setContextMenuPos}
            onShutdown={handleShutdown}
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
        </div>
      </PhysicsProvider>
    </WindowsProvider>
  );
};

export default Desktop;
