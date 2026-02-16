import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';

export const DVDScreensaver = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hitCount, setHitCount] = useState(0);
  const [cornerHits, setCornerHits] = useState(0);
  const [speed, setSpeed] = useState(3);
  const animationRef = useRef<number>();
  const isPlayingRef = useRef(true);
  const hitCountRef = useRef(0);
  const cornerHitsRef = useRef(0);

  const logoRef = useRef({
    x: 0.15,
    y: 0.2,
    dx: 0.003,
    dy: 0.004,
    width: 0.15,
    height: 0.1,
    hue: 0,
  });

  const COLORS = [
    '#FF2D55', '#5856D6', '#FF9500', '#4CD964', '#007AFF',
    '#FF3B30', '#5AC8FA', '#FFCC00', '#FF6482', '#34C759'
  ];
  const colorIdxRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const logo = logoRef.current;

    // Background with slight trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, W, H);

    // Logo position in pixels
    const lx = logo.x * W;
    const ly = logo.y * H;
    const lw = logo.width * W;
    const lh = logo.height * H;
    const color = COLORS[colorIdxRef.current % COLORS.length];

    // Glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 25;

    // DVD shape - rounded rectangle
    const radius = lh * 0.2;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(lx, ly, lw, lh, radius);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Inner gradient shine
    const shine = ctx.createLinearGradient(lx, ly, lx, ly + lh);
    shine.addColorStop(0, 'rgba(255,255,255,0.3)');
    shine.addColorStop(0.5, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    ctx.beginPath();
    ctx.roundRect(lx + 2, ly + 2, lw - 4, lh * 0.5, [radius, radius, 0, 0]);
    ctx.fill();

    // DVD text
    ctx.fillStyle = '#FFF';
    ctx.font = `bold ${Math.round(lh * 0.45)}px 'Segoe UI', Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DVD', lx + lw / 2, ly + lh / 2);

    // Disc icon below text
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(lx + lw / 2, ly + lh * 0.72, lh * 0.1, 0, Math.PI * 2);
    ctx.stroke();
  }, []);

  const update = useCallback(() => {
    const logo = logoRef.current;
    logo.x += logo.dx;
    logo.y += logo.dy;

    let hit = false;
    let isCorner = false;

    const nearLeft = logo.x <= 0;
    const nearRight = logo.x + logo.width >= 1;
    const nearTop = logo.y <= 0;
    const nearBottom = logo.y + logo.height >= 1;

    if (nearLeft || nearRight) {
      logo.dx = -logo.dx;
      logo.x = nearLeft ? 0 : 1 - logo.width;
      hit = true;
    }
    if (nearTop || nearBottom) {
      logo.dy = -logo.dy;
      logo.y = nearTop ? 0 : 1 - logo.height;
      hit = true;
    }

    if (hit) {
      if ((nearLeft || nearRight) && (nearTop || nearBottom)) {
        isCorner = true;
      }
      colorIdxRef.current = (colorIdxRef.current + 1) % COLORS.length;
      hitCountRef.current++;
      setHitCount(hitCountRef.current);
      if (isCorner) {
        cornerHitsRef.current++;
        setCornerHits(cornerHitsRef.current);
      }
    }
  }, []);

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId: number;
    const loop = () => {
      if (isPlayingRef.current) {
        update();
      }
      draw();
      animId = requestAnimationFrame(loop);
    };

    // Initial clear
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [update, draw]);

  // Sync playing state
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Sync speed to dx/dy magnitude
  useEffect(() => {
    const logo = logoRef.current;
    const factor = speed / 3;
    logo.dx = Math.sign(logo.dx) * 0.003 * factor;
    logo.dy = Math.sign(logo.dy) * 0.004 * factor;
  }, [speed]);

  // Resize
  useEffect(() => {
    const updateSize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const rect = container.getBoundingClientRect();
      canvas.width = Math.floor(rect.width);
      canvas.height = Math.floor(rect.height);

      // Clear on resize
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const reset = () => {
    logoRef.current = {
      x: 0.15,
      y: 0.2,
      dx: 0.003 * (speed / 3),
      dy: 0.004 * (speed / 3),
      width: 0.15,
      height: 0.1,
      hue: 0,
    };
    hitCountRef.current = 0;
    cornerHitsRef.current = 0;
    colorIdxRef.current = 0;
    setHitCount(0);
    setCornerHits(0);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-black overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0 border-b border-gray-800/50">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-gray-300">DVD Screensaver</h1>
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-gray-500">Bounces </span>
              <span className="text-blue-400 font-bold tabular-nums">{hitCount}</span>
            </div>
            <div>
              <span className="text-gray-500">Corners </span>
              <span className="text-emerald-400 font-bold tabular-nums">{cornerHits}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Speed control */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Speed</span>
            <input
              type="range"
              min={1}
              max={8}
              value={speed}
              onChange={e => setSpeed(Number(e.target.value))}
              className="w-16 h-1 accent-gray-500"
            />
          </div>
          <Button onClick={() => setIsPlaying(!isPlaying)} variant="ghost" size="sm" className="text-gray-400">
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button onClick={reset} variant="ghost" size="sm" className="text-gray-400">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Canvas fills the rest */}
      <div ref={containerRef} className="flex-1 min-h-0">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
    </div>
  );
};
