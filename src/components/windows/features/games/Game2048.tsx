import React, { useState, useEffect } from 'react';
import { RotateCw } from 'lucide-react';

const GRID_SIZE = 4;

export const Game2048: React.FC = () => {
  const [grid, setGrid] = useState<number[][]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const initGrid = () => {
    const newGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
    addRandomTile(newGrid);
    addRandomTile(newGrid);
    return newGrid;
  };

  useEffect(() => {
    setGrid(initGrid());
  }, []);

  const addRandomTile = (currentGrid: number[][]) => {
    const emptyCells: [number, number][] = [];
    currentGrid.forEach((row, i) => {
      row.forEach((cell, j) => {
        if (cell === 0) emptyCells.push([i, j]);
      });
    });
    
    if (emptyCells.length > 0) {
      const [i, j] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      currentGrid[i][j] = Math.random() < 0.9 ? 2 : 4;
    }
  };

  const move = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (gameOver) return;
    
    let newGrid = grid.map(row => [...row]);
    let moved = false;
    let newScore = score;

    const moveAndMerge = (line: number[]) => {
      const filtered = line.filter(cell => cell !== 0);
      const merged: number[] = [];
      
      for (let i = 0; i < filtered.length; i++) {
        if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
          merged.push(filtered[i] * 2);
          newScore += filtered[i] * 2;
          i++;
        } else {
          merged.push(filtered[i]);
        }
      }
      
      while (merged.length < GRID_SIZE) merged.push(0);
      return merged;
    };

    if (direction === 'left') {
      newGrid = newGrid.map(row => {
        const newRow = moveAndMerge(row);
        if (JSON.stringify(row) !== JSON.stringify(newRow)) moved = true;
        return newRow;
      });
    } else if (direction === 'right') {
      newGrid = newGrid.map(row => {
        const newRow = moveAndMerge([...row].reverse()).reverse();
        if (JSON.stringify(row) !== JSON.stringify(newRow)) moved = true;
        return newRow;
      });
    } else if (direction === 'up') {
      for (let col = 0; col < GRID_SIZE; col++) {
        const column = newGrid.map(row => row[col]);
        const newColumn = moveAndMerge(column);
        if (JSON.stringify(column) !== JSON.stringify(newColumn)) moved = true;
        newColumn.forEach((val, row) => newGrid[row][col] = val);
      }
    } else if (direction === 'down') {
      for (let col = 0; col < GRID_SIZE; col++) {
        const column = newGrid.map(row => row[col]);
        const newColumn = moveAndMerge([...column].reverse()).reverse();
        if (JSON.stringify(column) !== JSON.stringify(newColumn)) moved = true;
        newColumn.forEach((val, row) => newGrid[row][col] = val);
      }
    }

    if (moved) {
      addRandomTile(newGrid);
      setGrid(newGrid);
      setScore(newScore);
      
      if (!canMove(newGrid)) {
        setGameOver(true);
      }
    }
  };

  const canMove = (currentGrid: number[][]) => {
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (currentGrid[i][j] === 0) return true;
        if (j < GRID_SIZE - 1 && currentGrid[i][j] === currentGrid[i][j + 1]) return true;
        if (i < GRID_SIZE - 1 && currentGrid[i][j] === currentGrid[i + 1][j]) return true;
      }
    }
    return false;
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const directionMap: Record<string, 'up' | 'down' | 'left' | 'right'> = {
          ArrowUp: 'up',
          ArrowDown: 'down',
          ArrowLeft: 'left',
          ArrowRight: 'right'
        };
        move(directionMap[e.key]);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [grid, gameOver]);

  const getTileColor = (value: number) => {
    const colors: Record<number, string> = {
      0: '#cdc1b4',
      2: '#eee4da',
      4: '#ede0c8',
      8: '#f2b179',
      16: '#f59563',
      32: '#f67c5f',
      64: '#f65e3b',
      128: '#edcf72',
      256: '#edcc61',
      512: '#edc850',
      1024: '#edc53f',
      2048: '#edc22e'
    };
    return colors[value] || '#3c3a32';
  };

  const resetGame = () => {
    setGrid(initGrid());
    setScore(0);
    setGameOver(false);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-amber-100 to-orange-200 dark:from-gray-800 dark:to-gray-900">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">2048</h2>
          <button
            onClick={resetGame}
            className="p-2 bg-orange-500 hover:bg-orange-600 text-white rounded"
          >
            <RotateCw className="h-5 w-5" />
          </button>
        </div>
        
        <div className="text-center mb-4">
          <p className="text-xl font-bold text-gray-700 dark:text-white">Score: {score}</p>
        </div>
        
        <div className="bg-[#bbada0] p-2 rounded-lg">
          <div className="grid grid-cols-4 gap-2">
            {grid.map((row, i) =>
              row.map((cell, j) => (
                <div
                  key={`${i}-${j}`}
                  className="w-20 h-20 rounded flex items-center justify-center text-2xl font-bold transition-all"
                  style={{
                    backgroundColor: getTileColor(cell),
                    color: cell > 4 ? '#f9f6f2' : '#776e65'
                  }}
                >
                  {cell !== 0 && cell}
                </div>
              ))
            )}
          </div>
        </div>
        
        {gameOver && (
          <div className="mt-4 text-center">
            <p className="text-xl font-bold text-red-500 mb-2">Game Over!</p>
            <button
              onClick={resetGame}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded"
            >
              Play Again
            </button>
          </div>
        )}
        
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
          <p>Use arrow keys to play</p>
        </div>
      </div>
    </div>
  );
};
