import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trophy, RotateCcw, Circle } from 'lucide-react';

const ROWS = 6;
const COLS = 7;
type Player = 'red' | 'yellow' | null;
type Board = Player[][];

export const Connect4: React.FC = () => {
  const [board, setBoard] = useState<Board>([]);
  const [currentPlayer, setCurrentPlayer] = useState<'red' | 'yellow'>('red');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<Player>(null);
  const [winningCells, setWinningCells] = useState<{row: number, col: number}[]>([]);
  const [hoverCol, setHoverCol] = useState<number | null>(null);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const newBoard: Board = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
    setBoard(newBoard);
    setCurrentPlayer('red');
    setGameOver(false);
    setWinner(null);
    setWinningCells([]);
    setHoverCol(null);
  };

  const dropPiece = (col: number) => {
    if (gameOver) return;

    // Find the lowest empty row in the column
    let row = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r][col] === null) {
        row = r;
        break;
      }
    }

    if (row === -1) return; // Column is full

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = currentPlayer;
    setBoard(newBoard);

    // Check for win
    const winCells = checkWin(newBoard, row, col, currentPlayer);
    if (winCells.length > 0) {
      setGameOver(true);
      setWinner(currentPlayer);
      setWinningCells(winCells);
    } else if (isBoardFull(newBoard)) {
      setGameOver(true);
      setWinner(null); // Draw
    } else {
      setCurrentPlayer(currentPlayer === 'red' ? 'yellow' : 'red');
    }
  };

  const checkWin = (board: Board, row: number, col: number, player: Player): {row: number, col: number}[] => {
    const directions = [
      { dr: 0, dc: 1 },  // Horizontal
      { dr: 1, dc: 0 },  // Vertical
      { dr: 1, dc: 1 },  // Diagonal \
      { dr: 1, dc: -1 }, // Diagonal /
    ];

    for (const { dr, dc } of directions) {
      const cells: {row: number, col: number}[] = [{row, col}];
      
      // Check in positive direction
      for (let i = 1; i < 4; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
          cells.push({row: r, col: c});
        } else {
          break;
        }
      }

      // Check in negative direction
      for (let i = 1; i < 4; i++) {
        const r = row - dr * i;
        const c = col - dc * i;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
          cells.push({row: r, col: c});
        } else {
          break;
        }
      }

      if (cells.length >= 4) {
        return cells;
      }
    }

    return [];
  };

  const isBoardFull = (board: Board): boolean => {
    return board[0].every(cell => cell !== null);
  };

  const getLowestEmptyRow = (col: number): number => {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r][col] === null) {
        return r;
      }
    }
    return -1;
  };

  const getCellColor = (cell: Player, row: number, col: number): string => {
    const isWinning = winningCells.some(c => c.row === row && c.col === col);
    
    if (cell === 'red') {
      return isWinning ? 'bg-red-600 ring-4 ring-yellow-400' : 'bg-red-600';
    }
    if (cell === 'yellow') {
      return isWinning ? 'bg-yellow-400 ring-4 ring-red-600' : 'bg-yellow-400';
    }
    
    // Show preview on hover
    if (hoverCol === col && row === getLowestEmptyRow(col) && !gameOver) {
      return currentPlayer === 'red' ? 'bg-red-300' : 'bg-yellow-200';
    }
    
    return 'bg-white dark:bg-gray-700';
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 p-3 overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Circle className="h-5 w-5 text-red-600" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Connect 4</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={initializeGame}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          New Game
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-3 overflow-auto min-h-0">
        {/* Status */}
        <Card className="p-2 bg-white/90 dark:bg-slate-800/90">
          <div className="text-center">
            {!gameOver && (
              <div className="flex items-center gap-2 justify-center">
                <div className={`w-4 h-4 rounded-full ${currentPlayer === 'red' ? 'bg-red-600' : 'bg-yellow-400'}`} />
                <p className="text-sm font-semibold">
                  {currentPlayer === 'red' ? 'Red' : 'Yellow'}'s Turn
                </p>
              </div>
            )}
            {gameOver && winner && (
              <div className="flex items-center gap-2 justify-center">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <p className="text-sm font-semibold">
                  {winner === 'red' ? 'Red' : 'Yellow'} Wins!
                </p>
              </div>
            )}
            {gameOver && !winner && (
              <p className="text-sm font-semibold">It's a Draw!</p>
            )}
          </div>
        </Card>

        {/* Board */}
        <div className="bg-blue-600 p-2 rounded-lg shadow-2xl border-4 border-blue-800">
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className="relative"
                  onMouseEnter={() => setHoverCol(colIndex)}
                  onMouseLeave={() => setHoverCol(null)}
                  onClick={() => dropPiece(colIndex)}
                >
                  <div className={`w-16 h-16 rounded-full border-4 border-blue-800 ${getCellColor(cell, rowIndex, colIndex)} transition-all duration-200 cursor-pointer hover:scale-105 shadow-lg`} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Win Screen - Compact overlay */}
        {gameOver && (
          <div className="absolute top-0 left-0 right-0 z-10">
            <Card className="mx-auto max-w-xs p-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className={`h-5 w-5 ${winner ? 'text-yellow-500' : 'text-gray-500'}`} />
                  <span className="text-sm font-bold">
                    {winner ? `${winner === 'red' ? 'Red' : 'Yellow'} Wins!` : "Draw!"}
                  </span>
                </div>
                <Button onClick={initializeGame} size="sm" className="gap-1 text-xs h-7">
                  <RotateCcw className="h-3 w-3" />
                  Again
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
