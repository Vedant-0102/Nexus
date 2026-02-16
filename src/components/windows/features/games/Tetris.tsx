import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCw, Play, Pause, Trophy } from 'lucide-react';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

const SHAPES = [
  [[1, 1, 1, 1]], // I
  [[1, 1], [1, 1]], // O
  [[0, 1, 0], [1, 1, 1]], // T
  [[1, 1, 0], [0, 1, 1]], // S
  [[0, 1, 1], [1, 1, 0]], // Z
  [[1, 0, 0], [1, 1, 1]], // L
  [[0, 0, 1], [1, 1, 1]], // J
];

const COLORS = ['#00BCD4', '#FFEB3B', '#9C27B0', '#4CAF50', '#f44336', '#FF9800', '#2196F3'];

export const Tetris: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(28);
  const [board, setBoard] = useState<number[][]>(
    Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0))
  );
  const [currentPiece, setCurrentPiece] = useState({ shape: SHAPES[0], x: 4, y: 0, color: 0 });
  const [nextPiece, setNextPiece] = useState(() => {
    const idx = Math.floor(Math.random() * SHAPES.length);
    return { shape: SHAPES[idx], x: 4, y: 0, color: idx };
  });
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Resize
  useEffect(() => {
    const updateSize = () => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      // Board takes about 60% width, rest for side panel
      const availH = rect.height - 20;
      const availW = (rect.width * 0.55);
      const cs = Math.floor(Math.min(availH / BOARD_HEIGHT, availW / BOARD_WIDTH));
      setCellSize(Math.max(16, Math.min(cs, 36)));
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const createNewPiece = useCallback(() => {
    const shapeIndex = Math.floor(Math.random() * SHAPES.length);
    return { shape: SHAPES[shapeIndex], x: Math.floor((BOARD_WIDTH - SHAPES[shapeIndex][0].length) / 2), y: 0, color: shapeIndex };
  }, []);

  const checkCollision = useCallback((piece: typeof currentPiece, boardState: number[][], offsetX = 0, offsetY = 0) => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.x + x + offsetX;
          const newY = piece.y + y + offsetY;
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) return true;
          if (newY >= 0 && boardState[newY][newX]) return true;
        }
      }
    }
    return false;
  }, []);

  const mergePiece = useCallback(() => {
    const newBoard = board.map(row => [...row]);
    currentPiece.shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const by = currentPiece.y + y;
          const bx = currentPiece.x + x;
          if (by >= 0) newBoard[by][bx] = currentPiece.color + 1;
        }
      });
    });

    let cleared = 0;
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (newBoard[y].every(c => c !== 0)) {
        newBoard.splice(y, 1);
        newBoard.unshift(Array(BOARD_WIDTH).fill(0));
        cleared++;
        y++;
      }
    }

    const points = [0, 100, 300, 500, 800];
    const newLines = lines + cleared;
    const newLevel = Math.floor(newLines / 10) + 1;
    setScore(prev => prev + (points[cleared] || 0) * level);
    setLines(newLines);
    setLevel(newLevel);
    setBoard(newBoard);

    // Use next piece as current, generate new next
    const newCurrent = { ...nextPiece, x: Math.floor((BOARD_WIDTH - nextPiece.shape[0].length) / 2), y: 0 };
    if (checkCollision(newCurrent, newBoard)) {
      setGameOver(true);
    } else {
      setCurrentPiece(newCurrent);
      setNextPiece(createNewPiece());
    }
  }, [board, currentPiece, nextPiece, lines, level, checkCollision, createNewPiece]);

  const movePiece = useCallback((dx: number, dy: number) => {
    if (!checkCollision(currentPiece, board, dx, dy)) {
      setCurrentPiece(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    } else if (dy > 0) {
      mergePiece();
    }
  }, [currentPiece, board, checkCollision, mergePiece]);

  const rotatePiece = useCallback(() => {
    const rotated = currentPiece.shape[0].map((_, i) =>
      currentPiece.shape.map(row => row[i]).reverse()
    );
    const newPiece = { ...currentPiece, shape: rotated };
    if (!checkCollision(newPiece, board)) {
      setCurrentPiece(newPiece);
    } else if (!checkCollision(newPiece, board, -1, 0)) {
      setCurrentPiece({ ...newPiece, x: newPiece.x - 1 });
    } else if (!checkCollision(newPiece, board, 1, 0)) {
      setCurrentPiece({ ...newPiece, x: newPiece.x + 1 });
    }
  }, [currentPiece, board, checkCollision]);

  const hardDrop = useCallback(() => {
    let dropY = 0;
    while (!checkCollision(currentPiece, board, 0, dropY + 1)) {
      dropY++;
    }
    setCurrentPiece(prev => ({ ...prev, y: prev.y + dropY }));
    setTimeout(() => mergePiece(), 0);
  }, [currentPiece, board, checkCollision, mergePiece]);

  // Game tick
  useEffect(() => {
    if (gameOver || isPaused || !gameStarted) return;
    const speed = Math.max(100, 500 - (level - 1) * 40);
    const interval = setInterval(() => movePiece(0, 1), speed);
    return () => clearInterval(interval);
  }, [movePiece, gameOver, isPaused, gameStarted, level]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (gameOver || isPaused || !gameStarted) return;
      switch (e.key) {
        case 'ArrowLeft': e.preventDefault(); movePiece(-1, 0); break;
        case 'ArrowRight': e.preventDefault(); movePiece(1, 0); break;
        case 'ArrowDown': e.preventDefault(); movePiece(0, 1); break;
        case 'ArrowUp': e.preventDefault(); rotatePiece(); break;
        case ' ': e.preventDefault(); hardDrop(); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [movePiece, rotatePiece, hardDrop, gameOver, isPaused, gameStarted]);

  const getGhostY = () => {
    let ghostY = 0;
    while (!checkCollision(currentPiece, board, 0, ghostY + 1)) ghostY++;
    return currentPiece.y + ghostY;
  };

  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);
    // Ghost piece
    const ghostY = getGhostY();
    currentPiece.shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const by = ghostY + y;
          const bx = currentPiece.x + x;
          if (by >= 0 && by < BOARD_HEIGHT && bx >= 0 && bx < BOARD_WIDTH && !displayBoard[by][bx]) {
            displayBoard[by][bx] = -(currentPiece.color + 1); // negative = ghost
          }
        }
      });
    });
    // Current piece
    currentPiece.shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const by = currentPiece.y + y;
          const bx = currentPiece.x + x;
          if (by >= 0 && by < BOARD_HEIGHT && bx >= 0 && bx < BOARD_WIDTH) {
            displayBoard[by][bx] = currentPiece.color + 1;
          }
        }
      });
    });
    return displayBoard;
  };

  const resetGame = () => {
    setBoard(Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0)));
    const first = createNewPiece();
    setCurrentPiece(first);
    setNextPiece(createNewPiece());
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameOver(false);
    setIsPaused(false);
    setGameStarted(true);
  };

  const cs = cellSize;
  const boardW = BOARD_WIDTH * cs;
  const boardH = BOARD_HEIGHT * cs;

  return (
    <div className="h-full w-full flex flex-col bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0 border-b border-purple-900/50">
        <h1 className="text-lg font-bold text-purple-300 tracking-wider">TETRIS</h1>
        <div className="flex items-center gap-2">
          {gameStarted && (
            <Button
              onClick={() => setIsPaused(!isPaused)}
              variant="outline"
              size="sm"
              className="border-purple-800 text-gray-300"
            >
              {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            </Button>
          )}
          <Button
            onClick={resetGame}
            variant="outline"
            size="sm"
            className="border-purple-800 text-gray-300"
          >
            <RotateCw className="h-3.5 w-3.5 mr-1.5" />
            {gameStarted ? 'Restart' : 'Start'}
          </Button>
        </div>
      </div>

      {/* Game area */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center min-h-0 p-3 gap-4">
        {/* Board */}
        <div className="relative" style={{ width: boardW + 4, height: boardH + 4 }}>
          <div
            className="border-2 border-purple-700/60 rounded-lg overflow-hidden bg-gray-950"
            style={{ width: boardW + 4, height: boardH + 4 }}
          >
            <div className="p-[2px]">
              {renderBoard().map((row, y) => (
                <div key={y} className="flex">
                  {row.map((cell, x) => {
                    const isGhost = cell < 0;
                    const colorIdx = Math.abs(cell) - 1;
                    return (
                      <div
                        key={x}
                        style={{
                          width: cs,
                          height: cs,
                          backgroundColor: cell !== 0
                            ? isGhost
                              ? `${COLORS[colorIdx]}22`
                              : COLORS[colorIdx]
                            : '#0a0a0f',
                          borderWidth: cell > 0 ? 1 : 0,
                          borderColor: cell > 0 ? 'rgba(255,255,255,0.15)' : 'transparent',
                          borderStyle: 'solid',
                          outline: isGhost ? `1px dashed ${COLORS[colorIdx]}44` : 'none',
                        }}
                        className="rounded-[2px]"
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Game over overlay */}
          {gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg backdrop-blur-sm">
              <div className="text-center p-5">
                <Trophy className="h-10 w-10 mx-auto mb-2 text-yellow-400" />
                <h2 className="text-xl font-bold text-white mb-1">Game Over</h2>
                <p className="text-2xl font-bold text-purple-400 mb-3">{score}</p>
                <Button onClick={resetGame} size="sm" className="w-full">
                  Play Again
                </Button>
              </div>
            </div>
          )}

          {/* Start overlay */}
          {!gameStarted && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg backdrop-blur-sm">
              <div className="text-center p-5">
                <h2 className="text-2xl font-bold text-purple-300 mb-2">TETRIS</h2>
                <p className="text-sm text-gray-400 mb-4">Arrows to move, Up to rotate, Space to drop</p>
                <Button onClick={resetGame} size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  Start Game
                </Button>
              </div>
            </div>
          )}

          {/* Pause overlay */}
          {isPaused && !gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg backdrop-blur-sm">
              <p className="text-2xl font-bold text-purple-300">PAUSED</p>
            </div>
          )}
        </div>

        {/* Side panel */}
        {gameStarted && (
          <div className="flex flex-col gap-3" style={{ minWidth: cs * 5 }}>
            {/* Next piece */}
            <div className="bg-gray-900/80 border border-purple-900/50 rounded-lg p-3">
              <p className="text-xs font-semibold text-purple-400 mb-2 uppercase tracking-wider">Next</p>
              <div className="flex flex-col items-center">
                {nextPiece.shape.map((row, y) => (
                  <div key={y} className="flex">
                    {row.map((cell, x) => (
                      <div
                        key={x}
                        style={{
                          width: cs * 0.7,
                          height: cs * 0.7,
                          backgroundColor: cell ? COLORS[nextPiece.color] : 'transparent',
                        }}
                        className="rounded-[2px]"
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-gray-900/80 border border-purple-900/50 rounded-lg p-3 space-y-2">
              <div>
                <p className="text-xs text-purple-400 uppercase tracking-wider">Score</p>
                <p className="text-xl font-bold text-white tabular-nums">{score}</p>
              </div>
              <div>
                <p className="text-xs text-purple-400 uppercase tracking-wider">Lines</p>
                <p className="text-lg font-bold text-white tabular-nums">{lines}</p>
              </div>
              <div>
                <p className="text-xs text-purple-400 uppercase tracking-wider">Level</p>
                <p className="text-lg font-bold text-white tabular-nums">{level}</p>
              </div>
            </div>

            {/* Controls */}
            <div className="bg-gray-900/80 border border-purple-900/50 rounded-lg p-3">
              <p className="text-xs text-gray-500 leading-relaxed">
                Arrows: Move<br />
                Up: Rotate<br />
                Space: Drop
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
