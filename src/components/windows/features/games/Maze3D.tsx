import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, RotateCcw, Trophy, Clock, Eye } from 'lucide-react';

interface Cell {
  x: number;
  y: number;
  walls: boolean[];
  visited: boolean;
  type: 'default' | 'start' | 'end';
}

export const Maze3D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [time, setTime] = useState(0);

  const mazeRef = useRef<Cell[]>([]);
  const playerRef = useRef({ x: 0.5, y: 0.5, dir: 0 });
  const keysRef = useRef<Set<string>>(new Set());
  const animationRef = useRef<number>();
  const gameStartedRef = useRef(false);
  const gameWonRef = useRef(false);
  const targetDirRef = useRef(0);

  const COLS = 10;
  const ROWS = 8;
  const FOV = Math.PI / 3;
  const NUM_RAYS = 200;

  const getIndex = useCallback((x: number, y: number): number => x + y * COLS, []);

  const generateMaze = useCallback(() => {
    const cells: Cell[] = [];

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        let type: 'default' | 'start' | 'end' = 'default';
        if (x === 0 && y === 0) type = 'start';
        if (x === COLS - 1 && y === ROWS - 1) type = 'end';

        cells.push({ x, y, walls: [true, true, true, true], visited: false, type });
      }
    }

    const stack: number[] = [];
    let current = 0;
    cells[current].visited = true;

    const getNeighbors = (idx: number): number[] => {
      const cell = cells[idx];
      const n: number[] = [];
      if (cell.y > 0) { const i = getIndex(cell.x, cell.y - 1); if (!cells[i].visited) n.push(i); }
      if (cell.x < COLS - 1) { const i = getIndex(cell.x + 1, cell.y); if (!cells[i].visited) n.push(i); }
      if (cell.y < ROWS - 1) { const i = getIndex(cell.x, cell.y + 1); if (!cells[i].visited) n.push(i); }
      if (cell.x > 0) { const i = getIndex(cell.x - 1, cell.y); if (!cells[i].visited) n.push(i); }
      return n;
    };

    const removeWall = (curr: number, next: number) => {
      const dx = cells[curr].x - cells[next].x;
      const dy = cells[curr].y - cells[next].y;
      if (dx === 1) { cells[curr].walls[3] = false; cells[next].walls[1] = false; }
      else if (dx === -1) { cells[curr].walls[1] = false; cells[next].walls[3] = false; }
      if (dy === 1) { cells[curr].walls[0] = false; cells[next].walls[2] = false; }
      else if (dy === -1) { cells[curr].walls[2] = false; cells[next].walls[0] = false; }
    };

    while (true) {
      const neighbors = getNeighbors(current);
      if (neighbors.length > 0) {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        stack.push(current);
        removeWall(current, next);
        cells[next].visited = true;
        current = next;
      } else if (stack.length > 0) {
        current = stack.pop()!;
      } else {
        break;
      }
    }

    mazeRef.current = cells;
    playerRef.current = { x: 0.5, y: 0.5, dir: 0 };
    targetDirRef.current = 0;
  }, [getIndex]);

  const checkCollision = useCallback((x: number, y: number): boolean => {
    const cellX = Math.floor(x);
    const cellY = Math.floor(y);

    if (cellX < 0 || cellX >= COLS || cellY < 0 || cellY >= ROWS) return true;

    const cell = mazeRef.current[getIndex(cellX, cellY)];
    if (!cell) return true;

    const margin = 0.15;
    const localX = x - cellX;
    const localY = y - cellY;

    if (cell.walls[0] && localY < margin) return true;
    if (cell.walls[1] && localX > 1 - margin) return true;
    if (cell.walls[2] && localY > 1 - margin) return true;
    if (cell.walls[3] && localX < margin) return true;

    return false;
  }, [getIndex]);

  const castRay = useCallback((angle: number): { dist: number; isEnd: boolean; side: boolean } => {
    const player = playerRef.current;
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);

    let dist = 0;
    const step = 0.02;
    const maxDist = 20;
    let lastSide = false;

    while (dist < maxDist) {
      const x = player.x + dirX * dist;
      const y = player.y + dirY * dist;

      const cellX = Math.floor(x);
      const cellY = Math.floor(y);

      if (cellX < 0 || cellX >= COLS || cellY < 0 || cellY >= ROWS) {
        return { dist, isEnd: false, side: lastSide };
      }

      const cell = mazeRef.current[getIndex(cellX, cellY)];
      const lx = x - cellX;
      const ly = y - cellY;

      if (cell.walls[0] && ly < 0.05) return { dist, isEnd: cell.type === 'end', side: true };
      if (cell.walls[1] && lx > 0.95) return { dist, isEnd: cell.type === 'end', side: false };
      if (cell.walls[2] && ly > 0.95) return { dist, isEnd: cell.type === 'end', side: true };
      if (cell.walls[3] && lx < 0.05) return { dist, isEnd: cell.type === 'end', side: false };

      dist += step;
    }

    return { dist: maxDist, isEnd: false, side: false };
  }, [getIndex]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const player = playerRef.current;

    // Ceiling
    const ceilGrad = ctx.createLinearGradient(0, 0, 0, H / 2);
    ceilGrad.addColorStop(0, '#1a1a2e');
    ceilGrad.addColorStop(1, '#16213e');
    ctx.fillStyle = ceilGrad;
    ctx.fillRect(0, 0, W, H / 2);

    // Floor
    const floorGrad = ctx.createLinearGradient(0, H / 2, 0, H);
    floorGrad.addColorStop(0, '#2d3436');
    floorGrad.addColorStop(1, '#636e72');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, H / 2, W, H / 2);

    // Raycast
    const stripW = W / NUM_RAYS;
    for (let i = 0; i < NUM_RAYS; i++) {
      const angle = player.dir - FOV / 2 + (FOV / NUM_RAYS) * i;
      const { dist, isEnd, side } = castRay(angle);

      const corrDist = dist * Math.cos(angle - player.dir);
      const wallH = Math.min(H, (H / corrDist) * 0.6);

      const brightness = Math.max(40, 255 - dist * 25);
      const darkFactor = side ? 0.7 : 1;

      if (isEnd) {
        const r = Math.floor(255 * darkFactor);
        const g = Math.floor(200 * darkFactor);
        const b = 0;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
      } else {
        const r = Math.floor(brightness * darkFactor);
        const g = Math.floor(brightness * 0.6 * darkFactor);
        const b = Math.floor(brightness * 0.4 * darkFactor);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
      }

      ctx.fillRect(i * stripW, (H - wallH) / 2, stripW + 1, wallH);
    }
  }, [castRay]);

  const renderMinimap = useCallback(() => {
    const canvas = mapCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = 12;
    canvas.width = COLS * scale;
    canvas.height = ROWS * scale;

    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    mazeRef.current.forEach(cell => {
      const x = cell.x * scale;
      const y = cell.y * scale;

      if (cell.type === 'end') {
        ctx.fillStyle = 'rgba(255,215,0,0.5)';
        ctx.fillRect(x + 1, y + 1, scale - 2, scale - 2);
      }
      if (cell.type === 'start') {
        ctx.fillStyle = 'rgba(0,255,0,0.3)';
        ctx.fillRect(x + 1, y + 1, scale - 2, scale - 2);
      }

      ctx.strokeStyle = '#4a5568';
      ctx.lineWidth = 1.5;
      if (cell.walls[0]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + scale, y); ctx.stroke(); }
      if (cell.walls[1]) { ctx.beginPath(); ctx.moveTo(x + scale, y); ctx.lineTo(x + scale, y + scale); ctx.stroke(); }
      if (cell.walls[2]) { ctx.beginPath(); ctx.moveTo(x, y + scale); ctx.lineTo(x + scale, y + scale); ctx.stroke(); }
      if (cell.walls[3]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + scale); ctx.stroke(); }
    });

    const player = playerRef.current;
    ctx.fillStyle = '#00ff88';
    ctx.beginPath();
    ctx.arc(player.x * scale, player.y * scale, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.x * scale, player.y * scale);
    ctx.lineTo(player.x * scale + Math.cos(player.dir) * 10, player.y * scale + Math.sin(player.dir) * 10);
    ctx.stroke();
  }, []);

  const updatePlayer = useCallback(() => {
    if (!gameStartedRef.current || gameWonRef.current) return;

    const player = playerRef.current;

    // Smooth turn toward target direction at constant angular speed
    const TURN_SPEED = 0.2; // radians per frame, ~150ms for 90°
    const diff = targetDirRef.current - player.dir;
    if (Math.abs(diff) > TURN_SPEED) {
      player.dir += Math.sign(diff) * TURN_SPEED;
    } else {
      player.dir = targetDirRef.current;
    }

    // Use target direction for movement so walking is always grid-aligned
    const moveDir = targetDirRef.current;
    const moveSpeed = 0.04;

    let nx = player.x;
    let ny = player.y;

    if (keysRef.current.has('arrowup') || keysRef.current.has('w')) {
      nx += Math.cos(moveDir) * moveSpeed;
      ny += Math.sin(moveDir) * moveSpeed;
    }
    if (keysRef.current.has('arrowdown') || keysRef.current.has('s')) {
      nx -= Math.cos(moveDir) * moveSpeed;
      ny -= Math.sin(moveDir) * moveSpeed;
    }
    // Strafe
    if (keysRef.current.has('q')) {
      nx += Math.cos(moveDir - Math.PI / 2) * moveSpeed;
      ny += Math.sin(moveDir - Math.PI / 2) * moveSpeed;
    }
    if (keysRef.current.has('e')) {
      nx += Math.cos(moveDir + Math.PI / 2) * moveSpeed;
      ny += Math.sin(moveDir + Math.PI / 2) * moveSpeed;
    }

    // Slide along walls - try x and y separately
    if (!checkCollision(nx, ny)) {
      player.x = nx;
      player.y = ny;
    } else if (!checkCollision(nx, player.y)) {
      player.x = nx;
    } else if (!checkCollision(player.x, ny)) {
      player.y = ny;
    }

    // Win check
    const cx = Math.floor(player.x);
    const cy = Math.floor(player.y);
    const idx = getIndex(cx, cy);
    if (mazeRef.current[idx]?.type === 'end') {
      gameWonRef.current = true;
      setGameWon(true);
    }
  }, [checkCollision, getIndex]);

  const animate = useCallback(() => {
    updatePlayer();
    render();
    renderMinimap();
    animationRef.current = requestAnimationFrame(animate);
  }, [updatePlayer, render, renderMinimap]);

  // Resize
  useEffect(() => {
    const updateSize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const rect = container.getBoundingClientRect();
      const aspect = 4 / 3;
      let w = rect.width;
      let h = w / aspect;
      if (h > rect.height) {
        h = rect.height;
        w = h * aspect;
      }
      canvas.width = Math.floor(w);
      canvas.height = Math.floor(h);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Generate maze on mount
  useEffect(() => {
    generateMaze();
    // Draw initial frame
    setTimeout(() => {
      render();
      renderMinimap();
    }, 100);
  }, [generateMaze, render, renderMinimap]);

  // Timer
  useEffect(() => {
    if (gameStarted && !gameWon) {
      const interval = setInterval(() => setTime(prev => prev + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [gameStarted, gameWon]);

  // Key events - snap 90-degree turns for A/D/Left/Right, continuous for movement
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'q', 'e'].includes(key)) {
        e.preventDefault();
      }
      // Queue smooth 90-degree turns on key press (not hold)
      if ((key === 'arrowleft' || key === 'a') && !keysRef.current.has(key)) {
        targetDirRef.current -= Math.PI / 2;
      }
      if ((key === 'arrowright' || key === 'd') && !keysRef.current.has(key)) {
        targetDirRef.current += Math.PI / 2;
      }
      keysRef.current.add(key);
    };
    const onUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const handleStart = useCallback(() => {
    gameStartedRef.current = true;
    gameWonRef.current = false;
    setGameStarted(true);
    setGameWon(false);
    setTime(0);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(animate);
  }, [animate]);

  const handleReset = useCallback(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    gameStartedRef.current = false;
    gameWonRef.current = false;
    setGameStarted(false);
    setGameWon(false);
    setTime(0);
    generateMaze();
    setTimeout(() => {
      render();
      renderMinimap();
    }, 50);
  }, [generateMaze, render, renderMinimap]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full w-full flex flex-col bg-gray-950 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Eye className="h-4 w-4 text-green-400" />
          <h1 className="text-lg font-bold text-green-400">3D Maze</h1>
          {gameStarted && (
            <div className="flex items-center gap-1.5 text-sm text-gray-400">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-mono tabular-nums">{formatTime(time)}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {!gameStarted || gameWon ? (
            <Button variant="outline" size="sm" onClick={handleStart} className="border-green-800 text-green-400 gap-1.5">
              <Play className="h-3.5 w-3.5" />
              {gameWon ? 'New Game' : 'Start'}
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleReset} className="border-gray-700 text-gray-300 gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Game */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center min-h-0 p-2 relative">
        <canvas
          ref={canvasRef}
          className="rounded-lg border border-gray-800 max-w-full max-h-full"
        />

        {/* Minimap overlay - always visible during gameplay */}
        {gameStarted && !gameWon && (
          <div className="absolute top-4 right-4 bg-black/70 rounded-lg p-2 border border-gray-700 backdrop-blur-sm">
            <canvas ref={mapCanvasRef} className="block" />
          </div>
        )}

        {/* Win overlay */}
        {gameWon && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="text-center p-6 bg-gray-900/95 rounded-2xl border border-yellow-600/30 max-w-xs">
              <Trophy className="h-12 w-12 text-yellow-400 mx-auto mb-3" />
              <h3 className="text-2xl font-bold text-white mb-1">Maze Complete!</h3>
              <p className="text-lg text-yellow-400 font-mono mb-4">{formatTime(time)}</p>
              <Button onClick={handleReset} size="sm" className="w-full gap-2">
                <RotateCcw className="h-3.5 w-3.5" />
                New Maze
              </Button>
            </div>
          </div>
        )}

        {/* Instructions overlay */}
        {!gameStarted && !gameWon && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="text-center p-6 bg-gray-900/95 rounded-2xl border border-green-900/30 max-w-sm">
              <Eye className="h-10 w-10 text-green-400 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-white mb-3">3D Maze</h3>
              <p className="text-sm text-gray-400 mb-4">Navigate to the golden exit!</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-4">
                <div className="bg-gray-800/50 rounded p-2">
                  <span className="text-green-400 font-semibold">W/S</span> Forward/Back
                </div>
                <div className="bg-gray-800/50 rounded p-2">
                  <span className="text-green-400 font-semibold">A/D</span> Turn 90°
                </div>
                <div className="bg-gray-800/50 rounded p-2">
                  <span className="text-green-400 font-semibold">Q/E</span> Strafe L/R
                </div>
                <div className="bg-gray-800/50 rounded p-2">
                  <span className="text-green-400 font-semibold">Arrows</span> Also work
                </div>
              </div>
              <Button onClick={handleStart} size="sm" className="w-full gap-2">
                <Play className="h-4 w-4" />
                Start Game
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
