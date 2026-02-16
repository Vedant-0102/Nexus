import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Play, Trophy } from 'lucide-react';

interface Position {
  x: number;
  y: number;
}

interface GhostEntity extends Position {
  color: string;
  direction: string;
  scared: boolean;
}

// Clean symmetric maze - every row is 22 chars wide, all borders are walls
const MAZE_TEMPLATE = [
  '######################',
  '#.........##.........#',
  '#.###.###.##.###.###.#',
  '#P..................P#',
  '#.##.###.####.###.##.#',
  '#....#....##....#....#',
  '####.#.##.##.##.#.####',
  '#....#..........#....#',
  '#.##.#.###..###.#.##.#',
  '#..G.#....GG....#.G..#',
  '#.##.#.###..###.#.##.#',
  '#....#..........#....#',
  '####.#.##.##.##.#.####',
  '#....#....##....#....#',
  '#.##.###.####.###.##.#',
  '#P..................P#',
  '#.###.###.##.###.###.#',
  '#.........##.........#',
  '######################',
];

export const PacMan: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [highScore, setHighScore] = useState(0);

  const mazeRef = useRef<string[][]>([]);
  const pacmanRef = useRef<Position>({ x: 10, y: 15 });
  const dirRef = useRef('right');
  const nextDirRef = useRef('right');
  const ghostsRef = useRef<GhostEntity[]>([]);
  const powerModeRef = useRef(false);
  const mouthOpenRef = useRef(true);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const gameStartedRef = useRef(false);
  const gameOverRef = useRef(false);
  const wonRef = useRef(false);
  const frameRef = useRef(0);
  const animRef = useRef<number>();
  const cellSizeRef = useRef(20);
  const powerTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const MAZE_COLS = MAZE_TEMPLATE[0].length;
  const MAZE_ROWS = MAZE_TEMPLATE.length;
  const PACMAN_START: Position = { x: 10, y: 15 };

  const initializeMaze = useCallback(() => {
    const newMaze = MAZE_TEMPLATE.map(row => row.split(''));
    const newGhosts: GhostEntity[] = [];
    const ghostColors = ['#FF0000', '#FFB8FF', '#00FFFF', '#FFB852'];

    for (let y = 0; y < newMaze.length; y++) {
      for (let x = 0; x < newMaze[y].length; x++) {
        if (newMaze[y][x] === 'G') {
          newGhosts.push({
            x, y,
            color: ghostColors[newGhosts.length % 4],
            direction: ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)],
            scared: false
          });
          newMaze[y][x] = ' ';
        }
      }
    }

    mazeRef.current = newMaze;
    ghostsRef.current = newGhosts;
    pacmanRef.current = { ...PACMAN_START };
    dirRef.current = 'right';
    nextDirRef.current = 'right';
  }, []);

  // Resize
  useEffect(() => {
    const updateSize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const rect = container.getBoundingClientRect();
      const cellW = Math.floor(rect.width / MAZE_COLS);
      const cellH = Math.floor(rect.height / MAZE_ROWS);
      const cell = Math.max(14, Math.min(cellW, cellH));
      cellSizeRef.current = cell;

      canvas.width = MAZE_COLS * cell;
      canvas.height = MAZE_ROWS * cell;
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    initializeMaze();
  }, [initializeMaze]);

  const canMove = useCallback((x: number, y: number): boolean => {
    const maze = mazeRef.current;
    if (y < 0 || y >= maze.length || x < 0 || x >= (maze[0]?.length ?? 0)) return false;
    return maze[y][x] !== '#';
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cs = cellSizeRef.current;
    const maze = mazeRef.current;
    const pacman = pacmanRef.current;
    const ghosts = ghostsRef.current;
    const frame = frameRef.current;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw maze
    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[y].length; x++) {
        const cell = maze[y][x];
        if (cell === '#') {
          ctx.fillStyle = '#1a237e';
          ctx.fillRect(x * cs, y * cs, cs, cs);
          // Wall borders for depth
          ctx.strokeStyle = '#3949ab';
          ctx.lineWidth = 1;
          ctx.strokeRect(x * cs + 0.5, y * cs + 0.5, cs - 1, cs - 1);
        } else if (cell === '.') {
          ctx.fillStyle = '#FFB8FF';
          ctx.beginPath();
          ctx.arc(x * cs + cs / 2, y * cs + cs / 2, cs * 0.12, 0, Math.PI * 2);
          ctx.fill();
        } else if (cell === 'P') {
          const pulse = Math.sin(frame * 0.15) * 0.3 + 0.7;
          ctx.fillStyle = `rgba(255,255,255,${pulse})`;
          ctx.beginPath();
          ctx.arc(x * cs + cs / 2, y * cs + cs / 2, cs * 0.25, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.4)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    // Pac-Man
    const px = pacman.x * cs + cs / 2;
    const py = pacman.y * cs + cs / 2;
    const rad = cs / 2 - 1;
    const dir = dirRef.current;

    ctx.fillStyle = '#FFEB3B';
    ctx.beginPath();
    if (mouthOpenRef.current) {
      const angle = dir === 'right' ? 0 : dir === 'left' ? Math.PI : dir === 'down' ? Math.PI / 2 : -Math.PI / 2;
      ctx.arc(px, py, rad, angle + 0.3, angle + Math.PI * 2 - 0.3);
      ctx.lineTo(px, py);
    } else {
      ctx.arc(px, py, rad, 0, Math.PI * 2);
    }
    ctx.fill();

    // Ghosts
    ghosts.forEach(ghost => {
      const gx = ghost.x * cs + cs / 2;
      const gy = ghost.y * cs + cs / 2;
      const gr = rad * 0.9;

      if (ghost.scared) {
        ctx.fillStyle = frame % 10 < 5 ? '#283593' : '#e8eaf6';
      } else {
        ctx.fillStyle = ghost.color;
      }

      // Ghost body
      ctx.beginPath();
      ctx.arc(gx, gy - cs * 0.06, gr, Math.PI, 0);
      ctx.lineTo(gx + gr, gy + gr * 0.65);
      for (let i = 0; i < 3; i++) {
        const bx = gx + gr - (i * 2 + 1) * (gr / 3);
        ctx.lineTo(bx, gy + gr * 0.35);
        ctx.lineTo(bx - gr / 3, gy + gr * 0.65);
      }
      ctx.closePath();
      ctx.fill();

      // Ghost eyes
      if (!ghost.scared) {
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(gx - cs * 0.1, gy - cs * 0.08, gr * 0.24, 0, Math.PI * 2);
        ctx.arc(gx + cs * 0.1, gy - cs * 0.08, gr * 0.24, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a237e';
        ctx.beginPath();
        ctx.arc(gx - cs * 0.08, gy - cs * 0.06, gr * 0.13, 0, Math.PI * 2);
        ctx.arc(gx + cs * 0.12, gy - cs * 0.06, gr * 0.13, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Scared face
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(gx - cs * 0.08, gy - cs * 0.06, gr * 0.1, 0, Math.PI * 2);
        ctx.arc(gx + cs * 0.08, gy - cs * 0.06, gr * 0.1, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }, []);

  const endGame = useCallback((victory: boolean) => {
    gameOverRef.current = true;
    wonRef.current = victory;
    gameStartedRef.current = false;
    setGameOver(true);
    setWon(victory);
    setGameStarted(false);
    setHighScore(prev => Math.max(prev, scoreRef.current));
  }, []);

  const gameLoop = useCallback(() => {
    if (!gameStartedRef.current || gameOverRef.current) return;

    frameRef.current++;

    // Move pacman every 10 frames
    if (frameRef.current % 10 === 0) {
      mouthOpenRef.current = !mouthOpenRef.current;
      const pacman = pacmanRef.current;
      const maze = mazeRef.current;
      let currentDir = dirRef.current;

      // Try queued direction first
      const nd = nextDirRef.current;
      if (nd !== currentDir) {
        const tx = pacman.x + (nd === 'right' ? 1 : nd === 'left' ? -1 : 0);
        const ty = pacman.y + (nd === 'down' ? 1 : nd === 'up' ? -1 : 0);
        if (canMove(tx, ty)) {
          currentDir = nd;
          dirRef.current = nd;
        }
      }

      let nx = pacman.x + (currentDir === 'right' ? 1 : currentDir === 'left' ? -1 : 0);
      let ny = pacman.y + (currentDir === 'down' ? 1 : currentDir === 'up' ? -1 : 0);

      // Horizontal wrap
      if (nx < 0) nx = maze[0].length - 1;
      if (nx >= maze[0].length) nx = 0;

      if (canMove(nx, ny)) {
        pacman.x = nx;
        pacman.y = ny;

        if (maze[ny][nx] === '.') {
          maze[ny][nx] = ' ';
          scoreRef.current += 10;
          setScore(scoreRef.current);
        }

        if (maze[ny][nx] === 'P') {
          maze[ny][nx] = ' ';
          scoreRef.current += 50;
          setScore(scoreRef.current);
          powerModeRef.current = true;
          ghostsRef.current.forEach(g => g.scared = true);

          if (powerTimerRef.current) clearTimeout(powerTimerRef.current);
          powerTimerRef.current = setTimeout(() => {
            powerModeRef.current = false;
            ghostsRef.current.forEach(g => g.scared = false);
          }, 7000);
        }
      }
    }

    // Move ghosts every 14 frames
    if (frameRef.current % 14 === 0) {
      const pacman = pacmanRef.current;
      ghostsRef.current.forEach(ghost => {
        const possible: string[] = [];
        if (canMove(ghost.x, ghost.y - 1)) possible.push('up');
        if (canMove(ghost.x, ghost.y + 1)) possible.push('down');
        if (canMove(ghost.x - 1, ghost.y)) possible.push('left');
        if (canMove(ghost.x + 1, ghost.y)) possible.push('right');

        const opp: Record<string, string> = { up: 'down', down: 'up', left: 'right', right: 'left' };
        const filtered = possible.filter(m => m !== opp[ghost.direction]);
        const moves = filtered.length > 0 ? filtered : possible;

        let chosen: string;
        if (ghost.scared) {
          // Run away from pac-man
          chosen = moves[Math.floor(Math.random() * moves.length)];
        } else {
          // Chase pac-man: move toward closest manhattan distance
          chosen = moves.reduce((best, m) => {
            const tx = ghost.x + (m === 'right' ? 1 : m === 'left' ? -1 : 0);
            const ty = ghost.y + (m === 'down' ? 1 : m === 'up' ? -1 : 0);
            const bx = ghost.x + (best === 'right' ? 1 : best === 'left' ? -1 : 0);
            const by = ghost.y + (best === 'down' ? 1 : best === 'up' ? -1 : 0);
            return (Math.abs(tx - pacman.x) + Math.abs(ty - pacman.y)) <
                   (Math.abs(bx - pacman.x) + Math.abs(by - pacman.y)) ? m : best;
          }, moves[0]);
        }

        if (chosen) {
          ghost.x += chosen === 'right' ? 1 : chosen === 'left' ? -1 : 0;
          ghost.y += chosen === 'down' ? 1 : chosen === 'up' ? -1 : 0;
          ghost.direction = chosen;
        }
      });
    }

    // Collisions
    const pacman = pacmanRef.current;
    ghostsRef.current.forEach(ghost => {
      if (Math.abs(ghost.x - pacman.x) + Math.abs(ghost.y - pacman.y) < 0.9) {
        if (ghost.scared) {
          scoreRef.current += 200;
          setScore(scoreRef.current);
          // Send ghost back to center
          ghost.x = 10;
          ghost.y = 9;
          ghost.scared = false;
          ghost.direction = ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)];
        } else {
          livesRef.current--;
          setLives(livesRef.current);
          if (livesRef.current <= 0) {
            endGame(false);
            return;
          }
          // Reset pac-man position
          pacmanRef.current = { ...PACMAN_START };
          dirRef.current = 'right';
          nextDirRef.current = 'right';
        }
      }
    });

    // Win check
    const maze = mazeRef.current;
    const hasDots = maze.some(row => row.some(c => c === '.' || c === 'P'));
    if (!hasDots && !wonRef.current) {
      endGame(true);
      return;
    }

    draw();
    animRef.current = requestAnimationFrame(gameLoop);
  }, [draw, canMove, endGame]);

  const startGame = useCallback(() => {
    if (gameOverRef.current) return;
    gameStartedRef.current = true;
    setGameStarted(true);
    animRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  const resetGame = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (powerTimerRef.current) clearTimeout(powerTimerRef.current);
    initializeMaze();
    scoreRef.current = 0;
    livesRef.current = 3;
    frameRef.current = 0;
    gameStartedRef.current = false;
    gameOverRef.current = false;
    wonRef.current = false;
    powerModeRef.current = false;
    setScore(0);
    setLives(3);
    setGameOver(false);
    setWon(false);
    setGameStarted(false);
    setTimeout(() => draw(), 50);
  }, [initializeMaze, draw]);

  // Initial draw
  useEffect(() => {
    const t = setTimeout(() => draw(), 100);
    return () => clearTimeout(t);
  }, [draw]);

  // Keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
        e.preventDefault();
      }
      // Auto-start on arrow key press
      if (!gameStartedRef.current && !gameOverRef.current) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
          startGame();
        }
      }
      if (e.key === 'ArrowUp' || e.key === 'w') nextDirRef.current = 'up';
      else if (e.key === 'ArrowDown' || e.key === 's') nextDirRef.current = 'down';
      else if (e.key === 'ArrowLeft' || e.key === 'a') nextDirRef.current = 'left';
      else if (e.key === 'ArrowRight' || e.key === 'd') nextDirRef.current = 'right';
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [startGame]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (powerTimerRef.current) clearTimeout(powerTimerRef.current);
    };
  }, []);

  return (
    <div className="h-full w-full flex flex-col bg-black overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0 bg-gray-900 border-b border-yellow-900/50">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-yellow-400 tracking-wider">PAC-MAN</h1>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-400">Score:</span>
            <span className="text-white font-bold tabular-nums">{score}</span>
            <span className="text-gray-600">|</span>
            <span className="text-gray-400">Best:</span>
            <span className="text-yellow-400 font-bold tabular-nums">{highScore}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {Array.from({ length: lives }).map((_, i) => (
              <div key={i} className="w-4 h-4 bg-yellow-400 rounded-full" />
            ))}
          </div>
          <Button
            onClick={resetGame}
            variant="outline"
            size="sm"
            className="border-yellow-600 text-yellow-400 hover:bg-yellow-900/30 hover:text-yellow-300"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset
          </Button>
        </div>
      </div>

      {/* Canvas container */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center min-h-0 p-2">
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="rounded-lg border-2 border-yellow-900/40"
          />

          {/* Start overlay */}
          {!gameStarted && !gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/85 rounded-lg">
              <div className="text-center p-6">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-yellow-400 flex items-center justify-center">
                  <Play className="h-7 w-7 text-gray-900 ml-0.5" />
                </div>
                <p className="text-xl font-bold text-white mb-1">PAC-MAN</p>
                <p className="text-sm text-gray-400 mb-4">Arrow keys or WASD to move</p>
                <Button
                  onClick={startGame}
                  size="sm"
                  className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold px-6"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Game
                </Button>
              </div>
            </div>
          )}

          {/* Game over overlay */}
          {gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/90 rounded-lg">
              <div className="text-center p-6 max-w-xs">
                <Trophy className="h-12 w-12 mx-auto mb-3 text-yellow-400" />
                <h2 className="text-3xl font-bold text-white mb-2">
                  {won ? 'YOU WIN!' : 'GAME OVER'}
                </h2>
                <p className="text-2xl text-yellow-400 font-bold mb-4">{score}</p>
                {score >= highScore && score > 0 && (
                  <p className="text-sm text-yellow-300 mb-3 font-semibold">New High Score!</p>
                )}
                <Button
                  onClick={resetGame}
                  size="sm"
                  className="w-full bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold"
                >
                  Play Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
