import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Maximize, Minimize, Play, Loader2, RefreshCw } from 'lucide-react';

const EAGLERCRAFT_URL = '/EaglercraftX_1.8_u50_Offline_Signed.html';

export const Minecraft: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [launched, setLaunched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeFocused, setIframeFocused] = useState(false);
  const initializedRef = useRef(false);

  const handleLaunch = useCallback(() => {
    setLoading(true);
    setLaunched(true);
    initializedRef.current = true;
  }, []);

  const handleIframeLoad = useCallback(() => {
    setLoading(false);
    // Auto-focus iframe so keyboard works immediately
    iframeRef.current?.focus();
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      await container.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  const handleReload = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    setLoading(true);
    iframe.src = EAGLERCRAFT_URL;
  }, []);

  // Block parent keyboard handlers when iframe is focused
  useEffect(() => {
    if (!launched) return;

    const stopKeys = (e: KeyboardEvent) => {
      if (iframeFocused) {
        e.stopPropagation();
        e.preventDefault();
      }
    };

    const stopMouse = (e: MouseEvent) => {
      // Prevent parent window drag/resize from capturing mouse while game is focused
      if (iframeFocused) {
        e.stopPropagation();
      }
    };

    // Use capture phase to intercept before any other handler
    window.addEventListener('keydown', stopKeys, true);
    window.addEventListener('keyup', stopKeys, true);
    window.addEventListener('keypress', stopKeys, true);
    window.addEventListener('mousedown', stopMouse, true);
    window.addEventListener('mouseup', stopMouse, true);
    window.addEventListener('mousemove', stopMouse, true);

    return () => {
      window.removeEventListener('keydown', stopKeys, true);
      window.removeEventListener('keyup', stopKeys, true);
      window.removeEventListener('keypress', stopKeys, true);
      window.removeEventListener('mousedown', stopMouse, true);
      window.removeEventListener('mouseup', stopMouse, true);
      window.removeEventListener('mousemove', stopMouse, true);
    };
  }, [launched, iframeFocused]);

  // Track iframe focus via window blur/focus
  useEffect(() => {
    if (!launched) return;

    const onWindowBlur = () => {
      // When main window loses focus, iframe likely gained it
      if (iframeRef.current && document.activeElement === iframeRef.current) {
        setIframeFocused(true);
      }
    };

    const onWindowFocus = () => {
      setIframeFocused(false);
    };

    // Also detect focus moving to iframe
    const onFocusIn = (e: FocusEvent) => {
      if (e.target === iframeRef.current) {
        setIframeFocused(true);
      } else {
        setIframeFocused(false);
      }
    };

    window.addEventListener('blur', onWindowBlur);
    window.addEventListener('focus', onWindowFocus);
    document.addEventListener('focusin', onFocusIn);

    return () => {
      window.removeEventListener('blur', onWindowBlur);
      window.removeEventListener('focus', onWindowFocus);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, [launched]);

  // Click on iframe wrapper to focus it
  const handleIframeClick = useCallback(() => {
    iframeRef.current?.focus();
    setIframeFocused(true);
  }, []);

  return (
    <div ref={containerRef} className="h-full w-full flex flex-col bg-black">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-700 shrink-0">
        <span className="text-sm font-medium text-zinc-300">Minecraft</span>
        <div className="flex items-center gap-1.5">
          {launched && (
            <button
              onClick={handleReload}
              className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Reload"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={toggleFullscreen}
            className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden" onClick={handleIframeClick}>
        {!launched ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-green-950 to-zinc-950">
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <h1
                  className="text-5xl font-bold text-white"
                  style={{
                    fontFamily: 'monospace',
                    letterSpacing: '2px',
                    textShadow: '3px 3px 0 #1a1a1a, -1px -1px 0 #1a1a1a',
                  }}
                >
                  Minecraft
                </h1>
                <p className="text-sm text-zinc-400">EaglercraftX — Java Edition in the browser</p>
              </div>

              <button
                onClick={handleLaunch}
                className="flex items-center gap-3 mx-auto px-8 py-3 bg-green-600 hover:bg-green-500 text-white text-lg font-bold rounded-lg shadow-lg transition-colors border-b-4 border-green-800 hover:border-green-700 active:border-b-0 active:mt-1"
              >
                <Play className="h-5 w-5" />
                Launch Game
              </button>

              <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                Click to load EaglercraftX. The game may take a moment to initialize.
              </p>
            </div>
          </div>
        ) : (
          <>
            {loading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 pointer-events-none">
                <Loader2 className="h-8 w-8 text-green-500 animate-spin mb-3" />
                <p className="text-sm text-zinc-400">Loading EaglercraftX...</p>
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={EAGLERCRAFT_URL}
              onLoad={handleIframeLoad}
              className="w-full h-full border-0"
              loading="lazy"
              allow="autoplay; fullscreen; pointer-lock; keyboard-map"
              title="Minecraft - EaglercraftX"
            />
          </>
        )}
      </div>
    </div>
  );
};
