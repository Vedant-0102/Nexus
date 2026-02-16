import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Sparkles, Trash2, Pause, Play, CloudRain, Palette, Wind, ArrowDown, ArrowUp, Zap, Hand, MousePointer } from 'lucide-react';

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  mass: number;
  trail: Array<{ x: number; y: number }>;
}

const THEMES = {
  candy: {
    colors: ['#FF6B6B', '#FF8E8E', '#FFA07A', '#FFB347', '#FF69B4', '#FF1493', '#E74C3C', '#F39C12', '#FF6347', '#FF4500'],
    bg: 'from-pink-50 to-orange-50 dark:from-gray-900 dark:to-gray-850',
  },
  ocean: {
    colors: ['#0077B6', '#00B4D8', '#48CAE4', '#90E0EF', '#00CED1', '#20B2AA', '#2E8B57', '#3CB371', '#66CDAA', '#5F9EA0'],
    bg: 'from-cyan-50 to-blue-50 dark:from-gray-900 dark:to-gray-850',
  },
  neon: {
    colors: ['#FF00FF', '#00FF00', '#00FFFF', '#FF6600', '#FFFF00', '#FF0066', '#6600FF', '#00FF99', '#FF3399', '#33CCFF'],
    bg: 'from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900',
  },
  forest: {
    colors: ['#2D5016', '#4A7C23', '#6B8E23', '#8FBC8F', '#3CB371', '#228B22', '#556B2F', '#90EE90', '#7CFC00', '#ADFF2F'],
    bg: 'from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-850',
  },
  sunset: {
    colors: ['#FF6B35', '#F7931E', '#FFD23F', '#EE4266', '#540D6E', '#3BCEAC', '#FF1654', '#247BA0', '#C5283D', '#FFB400'],
    bg: 'from-orange-50 to-rose-50 dark:from-gray-900 dark:to-gray-850',
  },
};

type ThemeName = keyof typeof THEMES;
type ToolMode = 'spawn' | 'drag';

export const BallPitDesktop: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ballsRef = useRef<Ball[]>([]);
  const [ballCount, setBallCount] = useState(0);
  const [gravity, setGravity] = useState(0.5);
  const [elasticity, setElasticity] = useState(0.75);
  const [minRadius, setMinRadius] = useState(12);
  const [maxRadius, setMaxRadius] = useState(28);
  const [isRunning, setIsRunning] = useState(true);
  const [rainMode, setRainMode] = useState(false);
  const [theme, setTheme] = useState<ThemeName>('candy');
  const [fps, setFps] = useState(60);
  const [showTrails, setShowTrails] = useState(false);
  const [antiGravity, setAntiGravity] = useState(false);
  const [windStrength, setWindStrength] = useState(0);
  const [spawnCount, setSpawnCount] = useState(5);
  const [toolMode, setToolMode] = useState<ToolMode>('spawn');
  const ballIdCounter = useRef(0);
  const animFrameRef = useRef<number>();
  const frameCountRef = useRef(0);
  const fpsTimerRef = useRef(0);
  const rainTimerRef = useRef(0);

  // Drag state
  const dragRef = useRef<{ ballId: number; offsetX: number; offsetY: number; lastX: number; lastY: number } | null>(null);
  const mouseRef = useRef<{ x: number; y: number; down: boolean }>({ x: 0, y: 0, down: false });

  const MAX_BALLS = 300;
  const TRAIL_LENGTH = 8;

  const createBall = useCallback((x: number, y: number, vx = 0, vy = 0) => {
    const colors = THEMES[theme].colors;
    const radius = minRadius + Math.random() * (maxRadius - minRadius);
    const ball: Ball = {
      id: ballIdCounter.current++,
      x, y, vx, vy, radius,
      color: colors[Math.floor(Math.random() * colors.length)],
      mass: radius * radius * 0.01,
      trail: [],
    };
    if (ballsRef.current.length >= MAX_BALLS) {
      ballsRef.current.shift();
    }
    ballsRef.current.push(ball);
    setBallCount(ballsRef.current.length);
  }, [theme, minRadius, maxRadius]);

  const spawnBurst = useCallback((x: number, y: number, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      createBall(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed - 2);
    }
  }, [createBall]);

  const shake = useCallback(() => {
    for (const b of ballsRef.current) {
      b.vx += (Math.random() - 0.5) * 20;
      b.vy -= Math.random() * 15 + 5;
    }
  }, []);

  useEffect(() => {
    for (let i = 0; i < 20; i++) {
      createBall(100 + Math.random() * 400, 50 + Math.random() * 150, (Math.random() - 0.5) * 4, Math.random() * 2);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    const animate = (time: number) => {
      frameCountRef.current++;
      if (time - fpsTimerRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        fpsTimerRef.current = time;
      }

      if (!isRunning) { animFrameRef.current = requestAnimationFrame(animate); return; }

      // Rain mode
      if (rainMode && time - rainTimerRef.current > 120) {
        rainTimerRef.current = time;
        const rx = Math.random() * (canvas.width - 40) + 20;
        createBall(rx, -20, (Math.random() - 0.5) * 2, Math.random() * 2);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const balls = ballsRef.current;
      const W = canvas.width, H = canvas.height;
      const grav = antiGravity ? -gravity : gravity;

      // Update physics
      for (const b of balls) {
        // Skip physics for dragged ball
        if (dragRef.current && dragRef.current.ballId === b.id) continue;

        b.vy += grav;
        b.vx += windStrength * 0.05;
        b.vx *= 0.999;
        b.x += b.vx;
        b.y += b.vy;

        if (b.x - b.radius < 0) { b.vx = Math.abs(b.vx) * elasticity; b.x = b.radius; }
        else if (b.x + b.radius > W) { b.vx = -Math.abs(b.vx) * elasticity; b.x = W - b.radius; }
        if (b.y + b.radius > H) {
          b.vy = -Math.abs(b.vy) * elasticity;
          b.y = H - b.radius;
          b.vx *= 0.96;
          if (Math.abs(b.vy) < 0.5) b.vy = 0;
        }
        if (b.y - b.radius < 0) { b.vy = Math.abs(b.vy) * elasticity; b.y = b.radius; }
      }

      // Collisions (spatial grid optimization for large counts)
      const cellSize = 60;
      const cols = Math.ceil(W / cellSize);
      const grid: Map<number, number[]> = new Map();
      for (let i = 0; i < balls.length; i++) {
        const b = balls[i];
        const cx = Math.floor(b.x / cellSize);
        const cy = Math.floor(b.y / cellSize);
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const key = (cx + dx) + (cy + dy) * cols;
            if (!grid.has(key)) grid.set(key, []);
            grid.get(key)!.push(i);
          }
        }
      }

      const checked = new Set<string>();
      for (const indices of grid.values()) {
        for (let ii = 0; ii < indices.length; ii++) {
          for (let jj = ii + 1; jj < indices.length; jj++) {
            const i = indices[ii], j = indices[jj];
            const pairKey = i < j ? `${i},${j}` : `${j},${i}`;
            if (checked.has(pairKey)) continue;
            checked.add(pairKey);

            const a = balls[i], b = balls[j];
            const dx = b.x - a.x, dy = b.y - a.y;
            const distSq = dx * dx + dy * dy;
            const minD = a.radius + b.radius;
            if (distSq < minD * minD && distSq > 0.001) {
              const dist = Math.sqrt(distSq);
              const nx = dx / dist, ny = dy / dist;
              const overlap = minD - dist;
              const totalM = a.mass + b.mass;
              a.x -= nx * overlap * (b.mass / totalM);
              a.y -= ny * overlap * (b.mass / totalM);
              b.x += nx * overlap * (a.mass / totalM);
              b.y += ny * overlap * (a.mass / totalM);
              const dvx = a.vx - b.vx, dvy = a.vy - b.vy;
              const dvDotN = dvx * nx + dvy * ny;
              if (dvDotN > 0) {
                const impulse = (2 * dvDotN) / totalM * elasticity;
                a.vx -= impulse * b.mass * nx;
                a.vy -= impulse * b.mass * ny;
                b.vx += impulse * a.mass * nx;
                b.vy += impulse * a.mass * ny;
              }
            }
          }
        }
      }

      // Update trails
      if (showTrails) {
        for (const b of balls) {
          b.trail.push({ x: b.x, y: b.y });
          if (b.trail.length > TRAIL_LENGTH) b.trail.shift();
        }
      } else {
        for (const b of balls) {
          if (b.trail.length > 0) b.trail = [];
        }
      }

      // Draw trails
      if (showTrails) {
        for (const b of balls) {
          if (b.trail.length < 2) continue;
          for (let t = 1; t < b.trail.length; t++) {
            const alpha = (t / b.trail.length) * 0.3;
            const r = b.radius * (t / b.trail.length) * 0.6;
            ctx.beginPath();
            ctx.arc(b.trail[t].x, b.trail[t].y, r, 0, Math.PI * 2);
            ctx.fillStyle = hexToRgba(b.color, alpha);
            ctx.fill();
          }
        }
      }

      // Draw shadows
      for (const b of balls) {
        ctx.beginPath();
        ctx.ellipse(b.x + 2, Math.min(b.y + b.radius + 4, H - 2), b.radius * 0.8, b.radius * 0.25, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fill();
      }

      // Draw balls with 3D look
      for (const b of balls) {
        const grad = ctx.createRadialGradient(b.x - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.1, b.x, b.y, b.radius);
        grad.addColorStop(0, 'rgba(255,255,255,0.6)');
        grad.addColorStop(0.35, b.color);
        grad.addColorStop(1, darkenColor(b.color, 50));
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Outer rim
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.strokeStyle = darkenColor(b.color, 30);
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Primary highlight
        ctx.beginPath();
        ctx.arc(b.x - b.radius * 0.28, b.y - b.radius * 0.28, b.radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fill();

        // Secondary highlight
        ctx.beginPath();
        ctx.arc(b.x - b.radius * 0.15, b.y - b.radius * 0.15, b.radius * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fill();
      }

      // Draw drag indicator
      if (dragRef.current) {
        const ball = balls.find(b => b.id === dragRef.current!.ballId);
        if (ball) {
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ball.radius + 4, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255,255,255,0.6)';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      setBallCount(balls.length);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      ro.disconnect();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRunning, gravity, elasticity, rainMode, createBall, showTrails, antiGravity, windStrength]);

  // Mouse handlers
  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const findBallAt = (x: number, y: number): Ball | null => {
    const balls = ballsRef.current;
    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i];
      const dx = x - b.x, dy = y - b.y;
      if (dx * dx + dy * dy <= b.radius * b.radius) return b;
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasPos(e);
    mouseRef.current = { ...pos, down: true };

    if (toolMode === 'drag') {
      const ball = findBallAt(pos.x, pos.y);
      if (ball) {
        dragRef.current = {
          ballId: ball.id,
          offsetX: pos.x - ball.x,
          offsetY: pos.y - ball.y,
          lastX: pos.x,
          lastY: pos.y,
        };
        ball.vx = 0;
        ball.vy = 0;
      }
    } else {
      spawnBurst(pos.x, pos.y, spawnCount);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasPos(e);
    mouseRef.current.x = pos.x;
    mouseRef.current.y = pos.y;

    if (dragRef.current) {
      const ball = ballsRef.current.find(b => b.id === dragRef.current!.ballId);
      if (ball) {
        ball.x = pos.x - dragRef.current.offsetX;
        ball.y = pos.y - dragRef.current.offsetY;
        ball.vx = (pos.x - dragRef.current.lastX) * 0.5;
        ball.vy = (pos.y - dragRef.current.lastY) * 0.5;
        dragRef.current.lastX = pos.x;
        dragRef.current.lastY = pos.y;
      }
    }
  };

  const handleMouseUp = () => {
    mouseRef.current.down = false;
    if (dragRef.current) {
      const ball = ballsRef.current.find(b => b.id === dragRef.current!.ballId);
      if (ball) {
        // Fling with accumulated velocity
        ball.vx *= 2;
        ball.vy *= 2;
      }
      dragRef.current = null;
    }
  };

  const clearAll = () => { ballsRef.current = []; setBallCount(0); };

  const bgClass = THEMES[theme].bg;

  return (
    <div className="flex w-full h-full">
      {/* Canvas area */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`w-full h-full ${toolMode === 'drag' ? 'cursor-grab' : 'cursor-crosshair'} bg-gradient-to-br ${bgClass}`}
          style={dragRef.current ? { cursor: 'grabbing' } : undefined}
        />
        <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur text-white px-3 py-1.5 rounded-lg text-xs flex gap-3">
          <span>{ballCount}/{MAX_BALLS}</span>
          <span>{fps} FPS</span>
          <span>{toolMode === 'spawn' ? 'Click to spawn' : 'Drag balls'}</span>
        </div>
        {windStrength !== 0 && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
            <Wind size={12} /> Wind: {windStrength > 0 ? 'Right' : 'Left'}
          </div>
        )}
      </div>

      {/* Control panel */}
      <div className="w-56 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto flex flex-col gap-3 text-sm">
        <h3 className="font-bold text-gray-800 dark:text-white text-base">Ball Pit</h3>

        {/* Tool mode */}
        <div className="flex gap-1.5">
          <button onClick={() => setToolMode('spawn')} className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-medium transition-colors ${toolMode === 'spawn' ? 'bg-purple-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
            <MousePointer size={12} /> Spawn
          </button>
          <button onClick={() => setToolMode('drag')} className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-medium transition-colors ${toolMode === 'drag' ? 'bg-purple-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
            <Hand size={12} /> Drag
          </button>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-1.5">
          <button onClick={() => {
            const canvas = canvasRef.current;
            const cx = canvas ? canvas.width / 2 : 200;
            spawnBurst(cx, 80, 10);
          }} className="flex items-center justify-center gap-1 px-2 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition-colors">
            <Sparkles size={14} /> +10
          </button>
          <button onClick={clearAll} className="flex items-center justify-center gap-1 px-2 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors">
            <Trash2 size={14} /> Clear
          </button>
          <button onClick={() => setIsRunning(!isRunning)} className={`flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition-colors ${isRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-500 hover:bg-green-600'} text-white`}>
            {isRunning ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Play</>}
          </button>
          <button onClick={shake} className="flex items-center justify-center gap-1 px-2 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-medium transition-colors">
            <Zap size={14} /> Shake
          </button>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-2 gap-1.5">
          <button onClick={() => setRainMode(!rainMode)} className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${rainMode ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
            <CloudRain size={12} /> Rain
          </button>
          <button onClick={() => setAntiGravity(!antiGravity)} className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${antiGravity ? 'bg-violet-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
            {antiGravity ? <ArrowUp size={12} /> : <ArrowDown size={12} />} {antiGravity ? 'AntiG' : 'Grav'}
          </button>
          <button onClick={() => setShowTrails(!showTrails)} className={`col-span-2 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${showTrails ? 'bg-pink-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
            Trails {showTrails ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Sliders */}
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">Gravity: {gravity.toFixed(2)}</label>
            <input type="range" min="0" max="2" step="0.05" value={gravity} onChange={e => setGravity(+e.target.value)} className="w-full h-1.5 accent-purple-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">Bounce: {elasticity.toFixed(2)}</label>
            <input type="range" min="0.3" max="1" step="0.05" value={elasticity} onChange={e => setElasticity(+e.target.value)} className="w-full h-1.5 accent-purple-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">Wind: {windStrength === 0 ? 'Off' : windStrength.toFixed(1)}</label>
            <input type="range" min="-3" max="3" step="0.1" value={windStrength} onChange={e => setWindStrength(+e.target.value)} className="w-full h-1.5 accent-cyan-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">Spawn count: {spawnCount}</label>
            <input type="range" min="1" max="20" step="1" value={spawnCount} onChange={e => setSpawnCount(+e.target.value)} className="w-full h-1.5 accent-emerald-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">Min Size: {minRadius}px</label>
            <input type="range" min="5" max="25" step="1" value={minRadius} onChange={e => setMinRadius(+e.target.value)} className="w-full h-1.5 accent-purple-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">Max Size: {maxRadius}px</label>
            <input type="range" min="15" max="50" step="1" value={maxRadius} onChange={e => setMaxRadius(+e.target.value)} className="w-full h-1.5 accent-purple-500" />
          </div>
        </div>

        {/* Theme */}
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1.5"><Palette size={12} /> Theme</label>
          <div className="grid grid-cols-3 gap-1">
            {(Object.keys(THEMES) as ThemeName[]).map(t => (
              <button key={t} onClick={() => setTheme(t)} className={`py-1.5 rounded text-xs font-medium capitalize transition-colors ${theme === t ? 'bg-purple-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-auto p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-1">
          <div className="flex justify-between text-xs"><span className="text-gray-500 dark:text-gray-400">Balls</span><span className="font-mono font-bold text-gray-800 dark:text-white">{ballCount}</span></div>
          <div className="flex justify-between text-xs"><span className="text-gray-500 dark:text-gray-400">FPS</span><span className="font-mono font-bold text-gray-800 dark:text-white">{fps}</span></div>
          <div className="flex justify-between text-xs"><span className="text-gray-500 dark:text-gray-400">Max</span><span className="font-mono font-bold text-gray-800 dark:text-white">{MAX_BALLS}</span></div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mt-1">
            <div className="bg-purple-500 h-1.5 rounded-full transition-all" style={{ width: `${(ballCount / MAX_BALLS) * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

function darkenColor(hex: string, amount: number): string {
  const c = hex.replace('#', '');
  const r = Math.max(0, parseInt(c.slice(0, 2), 16) - amount);
  const g = Math.max(0, parseInt(c.slice(2, 4), 16) - amount);
  const b = Math.max(0, parseInt(c.slice(4, 6), 16) - amount);
  return `rgb(${r},${g},${b})`;
}

function hexToRgba(hex: string, alpha: number): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
