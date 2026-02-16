import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCw } from 'lucide-react';

const GRID_SIZE = 4;

type TileState = 'idle' | 'new' | 'merged';

interface TileData {
  value: number;
  id: number;
  state: TileState;
}

let tileIdCounter = 0;
const nextTileId = () => ++tileIdCounter;

const createEmptyGrid = (): TileData[][] =>
  Array(GRID_SIZE)
    .fill(null)
    .map(() =>
      Array(GRID_SIZE)
        .fill(null)
        .map(() => ({ value: 0, id: 0, state: 'idle' as TileState }))
    );

export const Game2048: React.FC = () => {
  const [grid, setGrid] = useState<TileData[][]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAnimationTimers = () => {
    animationTimeoutRef.current.forEach(clearTimeout);
    animationTimeoutRef.current = [];
  };

  const addRandomTile = (currentGrid: TileData[][]) => {
    const emptyCells: [number, number][] = [];
    currentGrid.forEach((row, i) => {
      row.forEach((cell, j) => {
        if (cell.value === 0) emptyCells.push([i, j]);
      });
    });

    if (emptyCells.length > 0) {
      const [i, j] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      currentGrid[i][j] = {
        value: Math.random() < 0.9 ? 2 : 4,
        id: nextTileId(),
        state: 'new',
      };
    }
  };

  const initGrid = useCallback(() => {
    clearAnimationTimers();
    const newGrid = createEmptyGrid();
    addRandomTile(newGrid);
    addRandomTile(newGrid);
    return newGrid;
  }, []);

  useEffect(() => {
    setGrid(initGrid());
    return () => clearAnimationTimers();
  }, [initGrid]);

  // Clear animation states after animation completes
  const scheduleAnimationClear = (currentGrid: TileData[][]) => {
    const timeout = setTimeout(() => {
      setGrid((prev) =>
        prev.map((row) =>
          row.map((cell) => (cell.state !== 'idle' ? { ...cell, state: 'idle' as TileState } : cell))
        )
      );
    }, 200);
    animationTimeoutRef.current.push(timeout);
  };

  const canMove = (currentGrid: TileData[][]) => {
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (currentGrid[i][j].value === 0) return true;
        if (j < GRID_SIZE - 1 && currentGrid[i][j].value === currentGrid[i][j + 1].value) return true;
        if (i < GRID_SIZE - 1 && currentGrid[i][j].value === currentGrid[i + 1][j].value) return true;
      }
    }
    return false;
  };

  const move = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
      if (gameOver) return;

      const newGrid = grid.map((row) => row.map((cell) => ({ ...cell, state: 'idle' as TileState })));
      let moved = false;
      let newScore = score;

      const moveAndMerge = (line: TileData[]): TileData[] => {
        const filtered = line.filter((cell) => cell.value !== 0);
        const merged: TileData[] = [];

        for (let i = 0; i < filtered.length; i++) {
          if (i < filtered.length - 1 && filtered[i].value === filtered[i + 1].value) {
            const mergedValue = filtered[i].value * 2;
            newScore += mergedValue;
            merged.push({ value: mergedValue, id: nextTileId(), state: 'merged' });
            i++;
          } else {
            merged.push({ ...filtered[i], state: 'idle' });
          }
        }

        while (merged.length < GRID_SIZE) {
          merged.push({ value: 0, id: 0, state: 'idle' });
        }
        return merged;
      };

      if (direction === 'left') {
        for (let i = 0; i < GRID_SIZE; i++) {
          const newRow = moveAndMerge(newGrid[i]);
          if (newGrid[i].some((cell, j) => cell.value !== newRow[j].value)) moved = true;
          newGrid[i] = newRow;
        }
      } else if (direction === 'right') {
        for (let i = 0; i < GRID_SIZE; i++) {
          const newRow = moveAndMerge([...newGrid[i]].reverse()).reverse();
          if (newGrid[i].some((cell, j) => cell.value !== newRow[j].value)) moved = true;
          newGrid[i] = newRow;
        }
      } else if (direction === 'up') {
        for (let col = 0; col < GRID_SIZE; col++) {
          const column = newGrid.map((row) => row[col]);
          const newColumn = moveAndMerge(column);
          if (column.some((cell, row) => cell.value !== newColumn[row].value)) moved = true;
          newColumn.forEach((val, row) => (newGrid[row][col] = val));
        }
      } else if (direction === 'down') {
        for (let col = 0; col < GRID_SIZE; col++) {
          const column = newGrid.map((row) => row[col]);
          const newColumn = moveAndMerge([...column].reverse()).reverse();
          if (column.some((cell, row) => cell.value !== newColumn[row].value)) moved = true;
          newColumn.forEach((val, row) => (newGrid[row][col] = val));
        }
      }

      if (moved) {
        addRandomTile(newGrid);
        setGrid(newGrid);
        setScore(newScore);
        scheduleAnimationClear(newGrid);

        if (!canMove(newGrid)) {
          setGameOver(true);
        }
      }
    },
    [grid, gameOver, score]
  );

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const directionMap: Record<string, 'up' | 'down' | 'left' | 'right'> = {
          ArrowUp: 'up',
          ArrowDown: 'down',
          ArrowLeft: 'left',
          ArrowRight: 'right',
        };
        move(directionMap[e.key]);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [move]);

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
      2048: '#edc22e',
    };
    return colors[value] || '#3c3a32';
  };

  const resetGame = () => {
    setGrid(initGrid());
    setScore(0);
    setGameOver(false);
  };

  const getAnimationStyle = (tile: TileData): React.CSSProperties => {
    if (tile.state === 'new') {
      return {
        animation: 'tile-pop-in 200ms ease-out forwards',
      };
    }
    if (tile.state === 'merged') {
      return {
        animation: 'tile-merge 200ms ease-out forwards',
      };
    }
    return {};
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-amber-100 to-orange-200 dark:from-gray-800 dark:to-gray-900">
      <style>{`
        @keyframes tile-pop-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes tile-merge {
          0% {
            transform: scale(1);
          }
          30% {
            transform: scale(1.25);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes game-over-fade {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        @keyframes score-bump {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.15);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">2048</h2>
          <button
            onClick={resetGame}
            className="p-2 bg-orange-500 hover:bg-orange-600 text-white rounded transition-transform active:scale-90"
          >
            <RotateCw className="h-5 w-5" />
          </button>
        </div>

        <div className="text-center mb-4">
          <p
            key={score}
            className="text-xl font-bold text-gray-700 dark:text-white"
            style={score > 0 ? { animation: 'score-bump 200ms ease-out' } : {}}
          >
            Score: {score}
          </p>
        </div>

        <div className="bg-[#bbada0] p-2 rounded-lg">
          <div className="grid grid-cols-4 gap-2">
            {grid.map((row, i) =>
              row.map((cell, j) => (
                <div
                  key={`${i}-${j}`}
                  className="w-20 h-20 rounded flex items-center justify-center text-2xl font-bold"
                  style={{
                    backgroundColor: getTileColor(cell.value),
                    color: cell.value > 4 ? '#f9f6f2' : '#776e65',
                    ...getAnimationStyle(cell),
                  }}
                >
                  {cell.value !== 0 && cell.value}
                </div>
              ))
            )}
          </div>
        </div>

        {gameOver && (
          <div
            className="mt-4 text-center"
            style={{ animation: 'game-over-fade 500ms ease-out forwards' }}
          >
            <p className="text-xl font-bold text-red-500 mb-2">Game Over!</p>
            <button
              onClick={resetGame}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded transition-transform active:scale-90"
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
