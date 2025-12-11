import React, { useState, useEffect, useCallback } from 'react';
import { RotateCw, Play, Pause } from 'lucide-react';

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

const COLORS = ['#00f0f0', '#f0f000', '#a000f0', '#00f000', '#f00000', '#f0a000', '#0000f0'];

export const Tetris: React.FC = () => {
  const [board, setBoard] = useState<number[][]>(
    Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0))
  );
  const [currentPiece, setCurrentPiece] = useState({ shape: SHAPES[0], x: 4, y: 0, color: 0 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const createNewPiece = () => {
    const shapeIndex = Math.floor(Math.random() * SHAPES.length);
    return { shape: SHAPES[shapeIndex], x: 4, y: 0, color: shapeIndex };
  };

  const checkCollision = (piece: typeof currentPiece, offsetX = 0, offsetY = 0) => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.x + x + offsetX;
          const newY = piece.y + y + offsetY;
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) return true;
          if (newY >= 0 && board[newY][newX]) return true;
        }
      }
    }
    return false;
  };

  const mergePiece = () => {
    const newBoard = board.map(row => [...row]);
    currentPiece.shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const boardY = currentPiece.y + y;
          const boardX = currentPiece.x + x;
          if (boardY >= 0) newBoard[boardY][boardX] = currentPiece.color + 1;
        }
      });
    });
    
    // Clear lines
    let linesCleared = 0;
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (newBoard[y].every(cell => cell !== 0)) {
        newBoard.splice(y, 1);
        newBoard.unshift(Array(BOARD_WIDTH).fill(0));
        linesCleared++;
        y++;
      }
    }
    
    setScore(prev => prev + linesCleared * 100);
    setBoard(newBoard);
    
    const newPiece = createNewPiece();
    if (checkCollision(newPiece)) {
      setGameOver(true);
    } else {
      setCurrentPiece(newPiece);
    }
  };

  const movePiece = useCallback((dx: number, dy: number) => {
    if (!checkCollision(currentPiece, dx, dy)) {
      setCurrentPiece(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    } else if (dy > 0) {
      mergePiece();
    }
  }, [currentPiece, board]);

  const rotatePiece = () => {
    const rotated = currentPiece.shape[0].map((_, i) =>
      currentPiece.shape.map(row => row[i]).reverse()
    );
    const newPiece = { ...currentPiece, shape: rotated };
    if (!checkCollision(newPiece)) {
      setCurrentPiece(newPiece);
    }
  };

  useEffect(() => {
    if (gameOver || isPaused) return;
    
    const interval = setInterval(() => {
      movePiece(0, 1);
    }, 500);
    
    return () => clearInterval(interval);
  }, [movePiece, gameOver, isPaused]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameOver || isPaused) return;
      
      switch (e.key) {
        case 'ArrowLeft': movePiece(-1, 0); break;
        case 'ArrowRight': movePiece(1, 0); break;
        case 'ArrowDown': movePiece(0, 1); break;
        case 'ArrowUp': rotatePiece(); break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [movePiece, gameOver, isPaused]);

  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);
    currentPiece.shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const boardY = currentPiece.y + y;
          const boardX = currentPiece.x + x;
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            displayBoard[boardY][boardX] = currentPiece.color + 1;
          }
        }
      });
    });
    return displayBoard;
  };

  const resetGame = () => {
    setBoard(Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0)));
    setCurrentPiece(createNewPiece());
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-900 to-blue-900">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold dark:text-white">Tetris</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
            >
              {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
            </button>
            <button
              onClick={resetGame}
              className="p-2 bg-green-500 hover:bg-green-600 text-white rounded"
            >
              <RotateCw className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="text-center mb-4">
          <p className="text-xl font-bold dark:text-white">Score: {score}</p>
        </div>
        
        <div className="grid gap-0.5 bg-gray-800 p-2 rounded">
          {renderBoard().map((row, y) => (
            <div key={y} className="flex gap-0.5">
              {row.map((cell, x) => (
                <div
                  key={x}
                  className="w-6 h-6 rounded-sm"
                  style={{
                    backgroundColor: cell ? COLORS[cell - 1] : '#1a1a1a'
                  }}
                />
              ))}
            </div>
          ))}
        </div>
        
        {gameOver && (
          <div className="mt-4 text-center">
            <p className="text-xl font-bold text-red-500 mb-2">Game Over!</p>
            <button
              onClick={resetGame}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
            >
              Play Again
            </button>
          </div>
        )}
        
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
          <p>Arrow keys to move, Up to rotate</p>
        </div>
      </div>
    </div>
  );
};
