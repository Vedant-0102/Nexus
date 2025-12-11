import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RotateCcw, Trophy, Play, Ghost } from 'lucide-react';

interface Position {
  x: number;
  y: number;
}

interface GhostEntity extends Position {
  color: string;
  direction: string;
  scared: boolean;
}

const CELL_SIZE = 25;
const MAZE = [
  '######################',
  '#P.........##........P',
  '#.###.####.##.####.###',
  '#.###.####.##.####.###',
  '#....................#',
  '#.###.##.######.##.###',
  '#.....##...##...##...#',
  '#####.#### ## ####.###',
  '    #.##   G    ##.#  ',
  '#####.## ######## ##.#',
  '     .   #  G G #  . #',
  '#####.## ######## ##.#',
  '    #.##    G   ##.#  ',
  '#####.## ######## ##.#',
  '#..........##........#',
  '#.###.####.##.####.###',
  '#...#......  ......#.#',
  '###.#.##.######.##.#.#',
  '#.....##...##...##...#',
  '#.########.##.########',
  '#P...................P',
  '######################',
];

export const PacMan: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [highScore, setHighScore] = useState(0);
  const [pacman, setPacman] = useState<Position>({ x: 1, y: 3 });
  const [direction, setDirection] = useState<string>('right');
  const [nextDirection, setNextDirection] = useState<string>('right');
  const [ghosts, setGhosts] = useState<GhostEntity[]>([]);
  const [maze, setMaze] = useState<string[][]>([]);
  const [powerMode, setPowerMode] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(true);
  const gameLoopRef = useRef<number>();
  const frameCount = useRef(0);

  useEffect(() => {
    initializeMaze();
  }, []);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameStarted, gameOver, pacman, ghosts, direction, nextDirection]);

  const initializeMaze = () => {
    const newMaze = MAZE.map(row => row.split(''));
    const newGhosts: GhostEntity[] = [];
    let pacmanPos = { x: 1, y: 1 };
    
    for (let y = 0; y < newMaze.length; y++) {
      for (let x = 0; x < newMaze[y].length; x++) {
        if (newMaze[y][x] === 'G') {
          newGhosts.push({
            x,
            y,
            color: ['#FF0000', '#FFB8FF', '#00FFFF', '#FFB852'][newGhosts.length % 4],
            direction: ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)],
            scared: false
          });
          newMaze[y][x] = ' ';
        }
      }
    }
    
    // Find Pac-Man starting position
    for (let y = 0; y < newMaze.length; y++) {
      for (let x = 0; x < newMaze[y].length; x++) {
        if (newMaze[y][x] === 'S') {
          pacmanPos = { x, y };
          newMaze[y][x] = ' ';
        }
      }
    }
    
    setMaze(newMaze);
    setGhosts(newGhosts);
    setPacman(pacmanPos);
  };

  const gameLoop = () => {
    frameCount.current++;
    
    if (frameCount.current % 12 === 0) {
      movePacman();
      setMouthOpen(m => !m);
    }
    
    if (frameCount.current % 18 === 0) {
      moveGhosts();
    }
    
    checkCollisions();
    checkWin();
    draw();
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };

  const canMove = (x: number, y: number): boolean => {
    if (y < 0 || y >= maze.length || x < 0 || x >= maze[0].length) return false;
    return maze[y][x] !== '#';
  };

  const movePacman = () => {
    let newX = pacman.x;
    let newY = pacman.y;
    let currentDir = direction;

    // Try to change direction
    if (nextDirection !== direction) {
      const testX = pacman.x + (nextDirection === 'right' ? 1 : nextDirection === 'left' ? -1 : 0);
      const testY = pacman.y + (nextDirection === 'down' ? 1 : nextDirection === 'up' ? -1 : 0);
      
      if (canMove(testX, testY)) {
        currentDir = nextDirection;
        setDirection(nextDirection);
      }
    }

    // Move in current direction
    if (currentDir === 'right') newX++;
    else if (currentDir === 'left') newX--;
    else if (currentDir === 'down') newY++;
    else if (currentDir === 'up') newY--;

    // Wrap around
    if (newX < 0) newX = maze[0].length - 1;
    if (newX >= maze[0].length) newX = 0;

    if (canMove(newX, newY)) {
      setPacman({ x: newX, y: newY });
      
      // Eat dots
      if (maze[newY][newX] === '.') {
        setMaze(prev => {
          const newMaze = prev.map(row => [...row]);
          newMaze[newY][newX] = ' ';
          return newMaze;
        });
        setScore(s => s + 10);
      }
      
      // Eat power pellet
      if (maze[newY][newX] === 'P') {
        setMaze(prev => {
          const newMaze = prev.map(row => [...row]);
          newMaze[newY][newX] = ' ';
          return newMaze;
        });
        setScore(s => s + 50);
        setPowerMode(true);
        setGhosts(prev => prev.map(g => ({ ...g, scared: true })));
        setTimeout(() => {
          setPowerMode(false);
          setGhosts(prev => prev.map(g => ({ ...g, scared: false })));
        }, 7000);
      }
    }
  };

  const moveGhosts = () => {
    setGhosts(prev => prev.map(ghost => {
      const possibleMoves: string[] = [];
      
      if (canMove(ghost.x, ghost.y - 1)) possibleMoves.push('up');
      if (canMove(ghost.x, ghost.y + 1)) possibleMoves.push('down');
      if (canMove(ghost.x - 1, ghost.y)) possibleMoves.push('left');
      if (canMove(ghost.x + 1, ghost.y)) possibleMoves.push('right');

      // Remove opposite direction to prevent backtracking
      const opposite = { up: 'down', down: 'up', left: 'right', right: 'left' };
      const filtered = possibleMoves.filter(m => m !== opposite[ghost.direction as keyof typeof opposite]);
      
      const moves = filtered.length > 0 ? filtered : possibleMoves;
      const newDirection = ghost.scared 
        ? moves[Math.floor(Math.random() * moves.length)]
        : moves.reduce((best, move) => {
            const testX = ghost.x + (move === 'right' ? 1 : move === 'left' ? -1 : 0);
            const testY = ghost.y + (move === 'down' ? 1 : move === 'up' ? -1 : 0);
            const bestX = ghost.x + (best === 'right' ? 1 : best === 'left' ? -1 : 0);
            const bestY = ghost.y + (best === 'down' ? 1 : best === 'up' ? -1 : 0);
            
            const distTest = Math.abs(testX - pacman.x) + Math.abs(testY - pacman.y);
            const distBest = Math.abs(bestX - pacman.x) + Math.abs(bestY - pacman.y);
            
            return distTest < distBest ? move : best;
          }, moves[0]);

      let newX = ghost.x;
      let newY = ghost.y;
      
      if (newDirection === 'right') newX++;
      else if (newDirection === 'left') newX--;
      else if (newDirection === 'down') newY++;
      else if (newDirection === 'up') newY--;

      return { ...ghost, x: newX, y: newY, direction: newDirection };
    }));
  };

  const checkCollisions = () => {
    ghosts.forEach((ghost, index) => {
      const distance = Math.abs(ghost.x - pacman.x) + Math.abs(ghost.y - pacman.y);
      
      if (distance < 0.5) {
        if (ghost.scared) {
          // Eat ghost - send back to ghost house
          setScore(s => s + 200);
          setGhosts(prev => {
            const newGhosts = [...prev];
            // Send ghost back to center (ghost house)
            newGhosts[index] = { 
              ...ghost, 
              x: 10, 
              y: 10, 
              scared: false,
              direction: ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)]
            };
            return newGhosts;
          });
        } else {
          // Lose life
          setLives(l => {
            const newLives = l - 1;
            if (newLives <= 0) {
              endGame(false);
            } else {
              resetPositions();
            }
            return newLives;
          });
        }
      }
    });
  };

  const checkWin = () => {
    const hasDotsLeft = maze.some(row => row.some(cell => cell === '.' || cell === 'P'));
    if (!hasDotsLeft) {
      endGame(true);
    }
  };

  const resetPositions = () => {
    setPacman({ x: 1, y: 3 });
    setDirection('right');
    setNextDirection('right');
    initializeMaze();
  };

  const endGame = (victory: boolean) => {
    setGameOver(true);
    setWon(victory);
    setGameStarted(false);
    if (score > highScore) {
      setHighScore(score);
    }
  };

  const resetGame = () => {
    setPacman({ x: 1, y: 3 });
    setDirection('right');
    setNextDirection('right');
    setScore(0);
    setLives(3);
    setGameOver(false);
    setWon(false);
    setGameStarted(false);
    setPowerMode(false);
    initializeMaze();
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw maze
    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[y].length; x++) {
        const cell = maze[y][x];
        
        if (cell === '#') {
          ctx.fillStyle = '#0000FF';
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          ctx.strokeStyle = '#4169E1';
          ctx.lineWidth = 1;
          ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        } else if (cell === '.') {
          ctx.fillStyle = '#FFB8FF';
          ctx.beginPath();
          ctx.arc(x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2, 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (cell === 'P') {
          // Power pellet - larger and animated
          ctx.fillStyle = frameCount.current % 20 < 10 ? '#FFFFFF' : '#FFD700';
          ctx.beginPath();
          ctx.arc(x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    }

    // Draw Pac-Man
    const pacX = pacman.x * CELL_SIZE + CELL_SIZE / 2;
    const pacY = pacman.y * CELL_SIZE + CELL_SIZE / 2;
    const radius = CELL_SIZE / 2 - 2;
    
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    
    if (mouthOpen) {
      const angle = direction === 'right' ? 0 : direction === 'left' ? Math.PI : direction === 'down' ? Math.PI / 2 : -Math.PI / 2;
      ctx.arc(pacX, pacY, radius, angle + 0.2, angle - 0.2);
      ctx.lineTo(pacX, pacY);
    } else {
      ctx.arc(pacX, pacY, radius, 0, Math.PI * 2);
    }
    
    ctx.fill();

    // Draw ghosts
    ghosts.forEach(ghost => {
      const gX = ghost.x * CELL_SIZE + CELL_SIZE / 2;
      const gY = ghost.y * CELL_SIZE + CELL_SIZE / 2;
      
      // Scared ghosts are blue and flash white
      if (ghost.scared) {
        ctx.fillStyle = frameCount.current % 10 < 5 ? '#0000FF' : '#FFFFFF';
      } else {
        ctx.fillStyle = ghost.color;
      }
      
      // Ghost body
      ctx.beginPath();
      ctx.arc(gX, gY - 3, radius, Math.PI, 0);
      ctx.lineTo(gX + radius, gY + radius);
      ctx.lineTo(gX + radius - 3, gY + radius - 3);
      ctx.lineTo(gX + radius - 6, gY + radius);
      ctx.lineTo(gX, gY + radius);
      ctx.lineTo(gX - radius + 6, gY + radius);
      ctx.lineTo(gX - radius + 3, gY + radius - 3);
      ctx.lineTo(gX - radius, gY + radius);
      ctx.closePath();
      ctx.fill();

      // Ghost eyes
      if (!ghost.scared) {
        // Normal eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(gX - 3, gY - 2, 3, 0, Math.PI * 2);
        ctx.arc(gX + 3, gY - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(gX - 3, gY - 2, 1.5, 0, Math.PI * 2);
        ctx.arc(gX + 3, gY - 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Scared eyes - wavy lines
        ctx.strokeStyle = '#FF69B4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(gX - 6, gY - 2);
        ctx.lineTo(gX - 4, gY);
        ctx.lineTo(gX - 2, gY - 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(gX + 2, gY - 2);
        ctx.lineTo(gX + 4, gY);
        ctx.lineTo(gX + 6, gY - 2);
        ctx.stroke();
      }
    });
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
        e.preventDefault();
      }
      
      if (!gameStarted && !gameOver) {
        setGameStarted(true);
      }

      if (e.key === 'ArrowUp' || e.key === 'w') setNextDirection('up');
      else if (e.key === 'ArrowDown' || e.key === 's') setNextDirection('down');
      else if (e.key === 'ArrowLeft' || e.key === 'a') setNextDirection('left');
      else if (e.key === 'ArrowRight' || e.key === 'd') setNextDirection('right');
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted, gameOver]);

  return (
    <div className="h-full w-full bg-gradient-to-br from-gray-900 to-black p-6 overflow-auto">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400">PAC-MAN</h1>
            <p className="text-gray-400">Use arrow keys or WASD to move</p>
          </div>
          <Button onClick={resetGame} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            New Game
          </Button>
        </div>

        <div className="flex justify-center">
          <Card className="p-6 bg-black border-blue-500 relative">
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={maze[0]?.length * CELL_SIZE || 550}
                height={maze.length * CELL_SIZE || 550}
                className="border-4 border-blue-600 rounded-lg"
              />

              {/* Score Display on Canvas */}
              <div className="absolute top-8 left-8 pointer-events-none">
                <div className="bg-black/70 px-6 py-3 rounded-lg border-2 border-yellow-400">
                  <p className="text-sm text-yellow-400 mb-1">SCORE</p>
                  <p className="text-4xl font-bold text-white">{score}</p>
                </div>
              </div>

              {/* High Score Display */}
              <div className="absolute top-8 right-8 pointer-events-none">
                <div className="bg-black/70 px-6 py-3 rounded-lg border-2 border-yellow-400">
                  <p className="text-sm text-yellow-400 mb-1">HIGH SCORE</p>
                  <p className="text-4xl font-bold text-white">{highScore}</p>
                </div>
              </div>

              {/* Lives Display */}
              <div className="absolute bottom-8 left-8 pointer-events-none">
                <div className="bg-black/70 px-6 py-3 rounded-lg border-2 border-red-400">
                  <p className="text-sm text-red-400 mb-2">LIVES</p>
                  <div className="flex gap-2">
                    {Array.from({ length: lives }).map((_, i) => (
                      <div key={i} className="w-8 h-8 bg-yellow-400 rounded-full" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Power Mode Indicator */}
              {powerMode && (
                <div className="absolute bottom-8 right-8 pointer-events-none animate-pulse">
                  <div className="bg-blue-600/90 px-6 py-3 rounded-lg border-2 border-blue-300">
                    <p className="text-2xl font-bold text-white">⚡ POWER MODE ⚡</p>
                  </div>
                </div>
              )}
              
              {!gameStarted && !gameOver && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/90 rounded-lg">
                  <div className="text-center">
                    <Play className="h-20 w-20 mx-auto mb-6 text-yellow-400" />
                    <p className="text-3xl font-bold text-white mb-4">Press Any Arrow Key to Start!</p>
                    <p className="text-xl text-gray-400">Use Arrow Keys or WASD</p>
                  </div>
                </div>
              )}

              {gameOver && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/95 rounded-lg">
                  <div className="text-center">
                    <Trophy className="h-24 w-24 mx-auto mb-6 text-yellow-400" />
                    <h2 className="text-5xl font-bold text-white mb-6">
                      {won ? '🎉 YOU WIN! 🎉' : 'GAME OVER'}
                    </h2>
                    <p className="text-3xl text-yellow-400 mb-8">Score: {score}</p>
                    {score === highScore && score > 0 && (
                      <p className="text-2xl mb-6 text-yellow-300">⭐ New High Score! ⭐</p>
                    )}
                    <Button onClick={resetGame} size="lg" className="text-xl px-8 py-6">
                      Play Again
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
