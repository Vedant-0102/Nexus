import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, RotateCcw, Trophy, Clock, Map } from 'lucide-react';

interface Cell {
  x: number;
  y: number;
  walls: boolean[]; // [top, right, bottom, left]
  visited: boolean;
  type: 'default' | 'start' | 'end';
}

export const Maze3D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapCanvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [time, setTime] = useState(0);
  const [showMinimap, setShowMinimap] = useState(true);
  
  const mazeRef = useRef<Cell[]>([]);
  const playerRef = useRef({ x: 0.5, y: 0.5, dir: 0 });
  const keysRef = useRef<Set<string>>(new Set());
  const animationRef = useRef<number>();
  
  const COLS = 12;
  const ROWS = 8;
  const CELL_SIZE = 64;
  const FOV = Math.PI / 3;
  const NUM_RAYS = 120;

  useEffect(() => {
    generateMaze();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (gameStarted && !gameWon) {
      const interval = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameStarted, gameWon]);

  useEffect(() => {
    if (gameStarted) {
      const handleKeyDown = (e: KeyboardEvent) => keysRef.current.add(e.key.toLowerCase());
      const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
      
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
      };
    }
  }, [gameStarted]);

  const generateMaze = () => {
    const cells: Cell[] = [];
    
    // Initialize cells
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        let type: 'default' | 'start' | 'end' = 'default';
        if (x === 0 && y === 0) type = 'start';
        if (x === COLS - 1 && y === ROWS - 1) type = 'end';
        
        cells.push({
          x,
          y,
          walls: [true, true, true, true],
          visited: false,
          type
        });
      }
    }

    // Generate maze using recursive backtracking
    const stack: number[] = [];
    let current = 0;
    cells[current].visited = true;

    while (true) {
      const neighbors = getUnvisitedNeighbors(current, cells);
      
      if (neighbors.length > 0) {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        stack.push(current);
        removeWall(current, next, cells);
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
    
    if (gameStarted) {
      animate();
    }
  };

  const getUnvisitedNeighbors = (index: number, cells: Cell[]): number[] => {
    const cell = cells[index];
    const neighbors: number[] = [];
    
    // Top
    if (cell.y > 0) {
      const idx = getIndex(cell.x, cell.y - 1);
      if (!cells[idx].visited) neighbors.push(idx);
    }
    // Right
    if (cell.x < COLS - 1) {
      const idx = getIndex(cell.x + 1, cell.y);
      if (!cells[idx].visited) neighbors.push(idx);
    }
    // Bottom
    if (cell.y < ROWS - 1) {
      const idx = getIndex(cell.x, cell.y + 1);
      if (!cells[idx].visited) neighbors.push(idx);
    }
    // Left
    if (cell.x > 0) {
      const idx = getIndex(cell.x - 1, cell.y);
      if (!cells[idx].visited) neighbors.push(idx);
    }
    
    return neighbors;
  };

  const removeWall = (current: number, next: number, cells: Cell[]) => {
    const curr = cells[current];
    const nxt = cells[next];
    const dx = curr.x - nxt.x;
    const dy = curr.y - nxt.y;

    if (dx === 1) { // Left
      curr.walls[3] = false;
      nxt.walls[1] = false;
    } else if (dx === -1) { // Right
      curr.walls[1] = false;
      nxt.walls[3] = false;
    } else if (dy === 1) { // Top
      curr.walls[0] = false;
      nxt.walls[2] = false;
    } else if (dy === -1) { // Bottom
      curr.walls[2] = false;
      nxt.walls[0] = false;
    }
  };

  const getIndex = (x: number, y: number): number => {
    return x + y * COLS;
  };

  const animate = () => {
    updatePlayer();
    render();
    renderMinimap();
    animationRef.current = requestAnimationFrame(animate);
  };

  const updatePlayer = () => {
    if (!gameStarted || gameWon) return;

    const player = playerRef.current;
    const moveSpeed = 0.05;
    const rotSpeed = 0.05;

    // Rotation
    if (keysRef.current.has('arrowleft') || keysRef.current.has('a')) {
      player.dir -= rotSpeed;
    }
    if (keysRef.current.has('arrowright') || keysRef.current.has('d')) {
      player.dir += rotSpeed;
    }

    // Movement
    let newX = player.x;
    let newY = player.y;

    if (keysRef.current.has('arrowup') || keysRef.current.has('w')) {
      newX += Math.cos(player.dir) * moveSpeed;
      newY += Math.sin(player.dir) * moveSpeed;
    }
    if (keysRef.current.has('arrowdown') || keysRef.current.has('s')) {
      newX -= Math.cos(player.dir) * moveSpeed;
      newY -= Math.sin(player.dir) * moveSpeed;
    }

    // Collision detection
    if (!checkCollision(newX, newY)) {
      player.x = newX;
      player.y = newY;

      // Check win condition
      const cellX = Math.floor(player.x);
      const cellY = Math.floor(player.y);
      const cellIndex = getIndex(cellX, cellY);
      if (mazeRef.current[cellIndex]?.type === 'end') {
        setGameWon(true);
      }
    }
  };

  const checkCollision = (x: number, y: number): boolean => {
    const cellX = Math.floor(x);
    const cellY = Math.floor(y);
    
    if (cellX < 0 || cellX >= COLS || cellY < 0 || cellY >= ROWS) return true;

    const cell = mazeRef.current[getIndex(cellX, cellY)];
    if (!cell) return true;

    const margin = 0.2;
    const localX = x - cellX;
    const localY = y - cellY;

    if (cell.walls[0] && localY < margin) return true; // Top
    if (cell.walls[1] && localX > 1 - margin) return true; // Right
    if (cell.walls[2] && localY > 1 - margin) return true; // Bottom
    if (cell.walls[3] && localX < margin) return true; // Left

    return false;
  };

  const castRay = (angle: number): { dist: number; isEnd: boolean } => {
    const player = playerRef.current;
    const rayDirX = Math.cos(angle);
    const rayDirY = Math.sin(angle);
    
    let dist = 0;
    const step = 0.01;
    const maxDist = 20;

    while (dist < maxDist) {
      const x = player.x + rayDirX * dist;
      const y = player.y + rayDirY * dist;
      
      const cellX = Math.floor(x);
      const cellY = Math.floor(y);
      
      if (cellX < 0 || cellX >= COLS || cellY < 0 || cellY >= ROWS) {
        return { dist, isEnd: false };
      }

      const cell = mazeRef.current[getIndex(cellX, cellY)];
      const localX = x - cellX;
      const localY = y - cellY;

      if (cell.walls[0] && localY < 0.05) return { dist, isEnd: cell.type === 'end' };
      if (cell.walls[1] && localX > 0.95) return { dist, isEnd: cell.type === 'end' };
      if (cell.walls[2] && localY > 0.95) return { dist, isEnd: cell.type === 'end' };
      if (cell.walls[3] && localX < 0.05) return { dist, isEnd: cell.type === 'end' };

      dist += step;
    }

    return { dist: maxDist, isEnd: false };
  };

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, width, height / 2);
    ctx.fillStyle = '#5a5a5a';
    ctx.fillRect(0, height / 2, width, height / 2);

    const player = playerRef.current;
    const rayAngleStep = FOV / NUM_RAYS;
    const stripWidth = width / NUM_RAYS;

    for (let i = 0; i < NUM_RAYS; i++) {
      const rayAngle = player.dir - FOV / 2 + rayAngleStep * i;
      const { dist, isEnd } = castRay(rayAngle);
      
      const correctedDist = dist * Math.cos(rayAngle - player.dir);
      const wallHeight = (height / correctedDist) * 0.5;
      
      const brightness = Math.max(50, 255 - dist * 30);
      ctx.fillStyle = isEnd ? `rgb(255, 215, 0)` : `rgb(${brightness}, ${brightness * 0.7}, ${brightness * 0.5})`;
      
      const wallTop = (height - wallHeight) / 2;
      ctx.fillRect(i * stripWidth, wallTop, stripWidth + 1, wallHeight);
    }
  };

  const renderMinimap = () => {
    if (!showMinimap) return;
    
    const canvas = mapCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = 8;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw maze
    mazeRef.current.forEach(cell => {
      const x = cell.x * scale;
      const y = cell.y * scale;

      if (cell.type === 'end') {
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(x, y, scale, scale);
      }

      ctx.strokeStyle = '#666';
      ctx.lineWidth = 2;

      if (cell.walls[0]) ctx.strokeRect(x, y, scale, 1);
      if (cell.walls[1]) ctx.strokeRect(x + scale - 1, y, 1, scale);
      if (cell.walls[2]) ctx.strokeRect(x, y + scale - 1, scale, 1);
      if (cell.walls[3]) ctx.strokeRect(x, y, 1, scale);
    });

    // Draw player
    const player = playerRef.current;
    ctx.fillStyle = '#00FF00';
    ctx.beginPath();
    ctx.arc(player.x * scale, player.y * scale, 3, 0, Math.PI * 2);
    ctx.fill();

    // Draw direction
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.x * scale, player.y * scale);
    ctx.lineTo(
      player.x * scale + Math.cos(player.dir) * 10,
      player.y * scale + Math.sin(player.dir) * 10
    );
    ctx.stroke();
  };

  const handleStart = () => {
    setGameStarted(true);
    setGameWon(false);
    setTime(0);
    animate();
  };

  const handleReset = () => {
    setGameStarted(false);
    setGameWon(false);
    setTime(0);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    generateMaze();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-green-50 dark:from-slate-900 dark:to-slate-800 p-3 overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Map className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">3D Maze</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleStart}
            disabled={gameStarted && !gameWon}
            className="gap-1 text-xs"
          >
            <Play className="h-3 w-3" />
            {gameStarted ? 'Playing' : 'Start'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="gap-1 text-xs"
          >
            <RotateCcw className="h-3 w-3" />
            New
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMinimap(!showMinimap)}
            className="gap-1 text-xs"
          >
            <Map className="h-3 w-3" />
            {showMinimap ? 'Hide' : 'Show'}
          </Button>
        </div>
      </div>

      <div className="flex-1 relative min-h-0">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="w-full h-full rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-black object-contain"
        />

        {/* HUD */}
        <div className="absolute top-2 left-2 space-y-1">
          <Card className="p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
            <div className="flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />
              <span className="font-semibold">{formatTime(time)}</span>
            </div>
          </Card>
        </div>

        {/* Minimap */}
        {showMinimap && gameStarted && (
          <div className="absolute top-2 right-2">
            <Card className="p-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
              <div className="text-[10px] font-semibold mb-1">Map</div>
              <canvas
                ref={mapCanvasRef}
                width={COLS * 8}
                height={ROWS * 8}
                className="border border-slate-300 dark:border-slate-600"
              />
            </Card>
          </div>
        )}

        {/* Win screen */}
        {gameWon && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Card className="p-6 text-center">
              <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold mb-2">You Won!</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-3 text-sm">
                Time: {formatTime(time)}
              </p>
              <Button onClick={handleReset} className="gap-2" size="sm">
                <RotateCcw className="h-3 w-3" />
                Play Again
              </Button>
            </Card>
          </div>
        )}

        {/* Instructions */}
        {!gameStarted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Card className="p-6 text-center max-w-sm">
              <Map className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold mb-3">3D Maze Game</h3>
              <div className="text-left space-y-1 mb-4">
                <p className="text-xs"><strong>Goal:</strong> Find the golden exit</p>
                <p className="text-xs"><strong>Controls:</strong></p>
                <ul className="text-xs space-y-0.5 ml-4">
                  <li>↑ / W - Move forward</li>
                  <li>↓ / S - Move backward</li>
                  <li>← / A - Turn left</li>
                  <li>→ / D - Turn right</li>
                </ul>
              </div>
              <Button onClick={handleStart} className="gap-2" size="sm">
                <Play className="h-3 w-3" />
                Start Game
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
