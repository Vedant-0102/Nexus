
import React, { useState, useEffect } from 'react';
import { Flag, RefreshCw } from 'lucide-react';

export const Minesweeper: React.FC = () => {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [board, setBoard] = useState<Array<Array<CellType>>>([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [flagsLeft, setFlagsLeft] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  type CellType = {
    revealed: boolean;
    hasMine: boolean;
    flagged: boolean;
    adjacentMines: number;
  };

  const difficulties = {
    easy: { rows: 9, cols: 9, mines: 10 },
    medium: { rows: 16, cols: 16, mines: 40 },
    hard: { rows: 16, cols: 30, mines: 99 },
  };

  // Initialize the board
  useEffect(() => {
    initializeBoard();
  }, [difficulty]);

  // Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (gameStarted && !gameOver && !gameWon) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      clearInterval(interval);
    };
  }, [gameStarted, gameOver, gameWon]);

  const initializeBoard = () => {
    const { rows, cols, mines } = difficulties[difficulty];
    setFlagsLeft(mines);
    setTimeElapsed(0);
    setGameStarted(false);
    setGameOver(false);
    setGameWon(false);
    
    // Create empty board
    const newBoard: Array<Array<CellType>> = Array(rows).fill(null).map(() => 
      Array(cols).fill(null).map(() => ({
        revealed: false,
        hasMine: false,
        flagged: false,
        adjacentMines: 0
      }))
    );
    
    // Place mines
    let minesPlaced = 0;
    while (minesPlaced < mines) {
      const randRow = Math.floor(Math.random() * rows);
      const randCol = Math.floor(Math.random() * cols);
      
      if (!newBoard[randRow][randCol].hasMine) {
        newBoard[randRow][randCol].hasMine = true;
        minesPlaced++;
      }
    }
    
    // Calculate adjacent mines
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (!newBoard[i][j].hasMine) {
          let adjacentMines = 0;
          
          // Check all 8 adjacent cells
          for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
              const ni = i + di;
              const nj = j + dj;
              
              // Skip if out of bounds or current cell
              if (ni < 0 || ni >= rows || nj < 0 || nj >= cols || (di === 0 && dj === 0)) {
                continue;
              }
              
              if (newBoard[ni][nj].hasMine) {
                adjacentMines++;
              }
            }
          }
          
          newBoard[i][j].adjacentMines = adjacentMines;
        }
      }
    }
    
    setBoard(newBoard);
  };

  const handleClick = (row: number, col: number) => {
    // Start the game on first click
    if (!gameStarted) {
      setGameStarted(true);
    }
    
    // Don't allow clicks if game is over or cell is flagged
    if (gameOver || gameWon || board[row][col].flagged) {
      return;
    }
    
    // Clone the board
    const newBoard = [...board.map(row => [...row])];
    
    // If clicked on a mine, game over
    if (newBoard[row][col].hasMine) {
      newBoard[row][col].revealed = true;
      setBoard(newBoard);
      setGameOver(true);
      revealAllMines();
      return;
    }
    
    // Reveal the clicked cell
    revealCell(row, col, newBoard);
    
    // Check if game is won
    const unrevealed = newBoard.flat().filter(cell => !cell.revealed).length;
    const mines = difficulties[difficulty].mines;
    
    if (unrevealed === mines) {
      setGameWon(true);
      // Flag all remaining mines
      newBoard.forEach((row, i) => {
        row.forEach((cell, j) => {
          if (cell.hasMine && !cell.flagged) {
            newBoard[i][j].flagged = true;
          }
        });
      });
      setFlagsLeft(0);
    }
    
    setBoard(newBoard);
  };

  const revealCell = (row: number, col: number, board: Array<Array<CellType>>) => {
    const { rows, cols } = difficulties[difficulty];
    
    // If already revealed or out of bounds, return
    if (
      row < 0 || row >= rows || 
      col < 0 || col >= cols || 
      board[row][col].revealed || 
      board[row][col].flagged
    ) {
      return;
    }
    
    // Reveal the cell
    board[row][col].revealed = true;
    
    // If no adjacent mines, reveal adjacent cells
    if (board[row][col].adjacentMines === 0) {
      // Reveal all 8 adjacent cells
      for (let di = -1; di <= 1; di++) {
        for (let dj = -1; dj <= 1; dj++) {
          revealCell(row + di, col + dj, board);
        }
      }
    }
  };

  const handleRightClick = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    
    // Don't allow right-clicks if game is over or cell is revealed
    if (gameOver || gameWon || board[row][col].revealed) {
      return;
    }
    
    // Start the game on first click
    if (!gameStarted) {
      setGameStarted(true);
    }
    
    // Clone the board
    const newBoard = [...board.map(row => [...row])];
    
    // Toggle flag
    if (!newBoard[row][col].flagged && flagsLeft > 0) {
      newBoard[row][col].flagged = true;
      setFlagsLeft(prev => prev - 1);
    } else if (newBoard[row][col].flagged) {
      newBoard[row][col].flagged = false;
      setFlagsLeft(prev => prev + 1);
    }
    
    setBoard(newBoard);
  };

  const revealAllMines = () => {
    const newBoard = [...board.map(row => [...row])];
    
    newBoard.forEach((row, i) => {
      row.forEach((cell, j) => {
        if (cell.hasMine) {
          newBoard[i][j].revealed = true;
        }
      });
    });
    
    setBoard(newBoard);
  };

  const getCellContent = (cell: CellType) => {
    if (cell.flagged) {
      return <Flag size={14} className="text-red-500" />;
    }
    
    if (!cell.revealed) {
      return null;
    }
    
    if (cell.hasMine) {
      return <div className="w-4 h-4 rounded-full bg-black" />;
    }
    
    if (cell.adjacentMines === 0) {
      return null;
    }
    
    // Color coding based on number
    const colors = [
      '',
      'text-blue-600',   // 1
      'text-green-600',  // 2
      'text-red-600',    // 3
      'text-purple-700', // 4
      'text-rose-700',   // 5
      'text-cyan-600',   // 6
      'text-black',      // 7
      'text-gray-600'    // 8
    ];
    
    return (
      <span className={`font-bold ${colors[cell.adjacentMines]}`}>
        {cell.adjacentMines}
      </span>
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 h-full overflow-y-auto">
      <h2 className="text-2xl font-semibold mb-4">Minesweeper</h2>
      
      <div className="bg-white/50 p-4 rounded-lg mb-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Flag size={16} />
            <span className="font-mono font-bold">{flagsLeft}</span>
          </div>
          
          <div className="flex gap-2">
            <select 
              className="bg-white/80 border border-gray-300 rounded px-2 py-1 text-sm"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            
            <button 
              className="bg-white/80 border border-gray-300 rounded p-1"
              onClick={initializeBoard}
            >
              <RefreshCw size={16} />
            </button>
          </div>
          
          <div className="font-mono font-bold">
            {formatTime(timeElapsed)}
          </div>
        </div>
        
        {/* Game Status */}
        {(gameOver || gameWon) && (
          <div className={`text-center py-2 mb-4 rounded ${gameWon ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {gameWon ? 'You Win! 🎉' : 'Game Over! 💣'}
          </div>
        )}
        
        {/* Game Board */}
        <div 
          className={`grid gap-px bg-gray-300 border-2 ${gameOver ? 'border-red-500' : gameWon ? 'border-green-500' : 'border-gray-400'}`}
          style={{ 
            gridTemplateColumns: `repeat(${difficulties[difficulty].cols}, 1fr)`,
            width: 'fit-content',
            margin: '0 auto'
          }}
        >
          {board.map((row, rowIndex) => (
            row.map((cell, colIndex) => (
              <button
                key={`${rowIndex}-${colIndex}`}
                className={`w-7 h-7 flex items-center justify-center text-xs font-medium ${
                  cell.revealed 
                    ? cell.hasMine 
                      ? 'bg-red-200' 
                      : 'bg-gray-100'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
                onClick={() => handleClick(rowIndex, colIndex)}
                onContextMenu={(e) => handleRightClick(e, rowIndex, colIndex)}
                disabled={gameOver || gameWon}
              >
                {getCellContent(cell)}
              </button>
            ))
          ))}
        </div>
      </div>
      
      <div className="text-sm text-gray-600">
        <h3 className="font-semibold mb-1">How to play:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Left-click to reveal a cell</li>
          <li>Right-click to flag a suspected mine</li>
          <li>Reveal all non-mine cells to win</li>
          <li>Numbers indicate the number of adjacent mines</li>
        </ul>
      </div>
    </div>
  );
};
