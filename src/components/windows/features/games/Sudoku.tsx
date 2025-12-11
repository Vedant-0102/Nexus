import React, { useState, useEffect } from 'react';
import { RotateCw, Lightbulb } from 'lucide-react';

export const Sudoku: React.FC = () => {
  const [grid, setGrid] = useState<number[][]>([]);
  const [solution, setSolution] = useState<number[][]>([]);
  const [selected, setSelected] = useState<[number, number] | null>(null);

  const generateSudoku = () => {
    // Simple sudoku puzzle (in real app, use proper generator)
    const puzzle = [
      [5, 3, 0, 0, 7, 0, 0, 0, 0],
      [6, 0, 0, 1, 9, 5, 0, 0, 0],
      [0, 9, 8, 0, 0, 0, 0, 6, 0],
      [8, 0, 0, 0, 6, 0, 0, 0, 3],
      [4, 0, 0, 8, 0, 3, 0, 0, 1],
      [7, 0, 0, 0, 2, 0, 0, 0, 6],
      [0, 6, 0, 0, 0, 0, 2, 8, 0],
      [0, 0, 0, 4, 1, 9, 0, 0, 5],
      [0, 0, 0, 0, 8, 0, 0, 7, 9]
    ];
    
    const sol = [
      [5, 3, 4, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 9, 5, 3, 4, 8],
      [1, 9, 8, 3, 4, 2, 5, 6, 7],
      [8, 5, 9, 7, 6, 1, 4, 2, 3],
      [4, 2, 6, 8, 5, 3, 7, 9, 1],
      [7, 1, 3, 9, 2, 4, 8, 5, 6],
      [9, 6, 1, 5, 3, 7, 2, 8, 4],
      [2, 8, 7, 4, 1, 9, 6, 3, 5],
      [3, 4, 5, 2, 8, 6, 1, 7, 9]
    ];
    
    setGrid(puzzle.map(row => [...row]));
    setSolution(sol);
  };

  useEffect(() => {
    generateSudoku();
  }, []);

  const handleCellClick = (row: number, col: number) => {
    if (grid[row][col] === 0) {
      setSelected([row, col]);
    }
  };

  const handleNumberInput = (num: number) => {
    if (selected) {
      const [row, col] = selected;
      const newGrid = grid.map(r => [...r]);
      newGrid[row][col] = num;
      setGrid(newGrid);
    }
  };

  const showHint = () => {
    if (selected) {
      const [row, col] = selected;
      const newGrid = grid.map(r => [...r]);
      newGrid[row][col] = solution[row][col];
      setGrid(newGrid);
      setSelected(null);
    }
  };

  const isComplete = () => {
    return JSON.stringify(grid) === JSON.stringify(solution);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl max-w-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold dark:text-white">Sudoku</h2>
          <div className="flex gap-2">
            <button
              onClick={showHint}
              disabled={!selected}
              className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded flex items-center gap-1 text-sm font-semibold transition-colors"
              title="Show hint for selected cell"
            >
              <Lightbulb className="h-4 w-4" />
              Hint
            </button>
            <button
              onClick={generateSudoku}
              className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center gap-1 text-sm font-semibold transition-colors"
              title="New puzzle"
            >
              <RotateCw className="h-4 w-4" />
              New
            </button>
          </div>
        </div>
        
        {selected && (
          <div className="mb-3 text-sm text-gray-600 dark:text-gray-400 text-center">
            Selected: Row {selected[0] + 1}, Column {selected[1] + 1}
          </div>
        )}
        
        <div className="inline-block border-4 border-gray-900 dark:border-gray-600 rounded-lg overflow-hidden shadow-lg">
          <div className="grid grid-cols-9 gap-0">
            {grid.map((row, i) =>
              row.map((cell, j) => {
                const isPrefilled = solution[i][j] !== 0 && grid[i][j] !== 0;
                const isSelected = selected?.[0] === i && selected?.[1] === j;
                const isInSameRow = selected?.[0] === i;
                const isInSameCol = selected?.[1] === j;
                const isInSameBox = selected && Math.floor(selected[0] / 3) === Math.floor(i / 3) && Math.floor(selected[1] / 3) === Math.floor(j / 3);
                
                return (
                  <div
                    key={`${i}-${j}`}
                    onClick={() => handleCellClick(i, j)}
                    className={`w-12 h-12 flex items-center justify-center text-xl font-bold cursor-pointer transition-colors
                      ${isSelected ? 'bg-blue-400 dark:bg-blue-600 text-white' : 
                        isInSameRow || isInSameCol || isInSameBox ? 'bg-blue-100 dark:bg-blue-900/30' :
                        'bg-white dark:bg-gray-700'}
                      ${isPrefilled ? 'text-gray-900 dark:text-white' : 'text-blue-600 dark:text-blue-400'}
                      ${j % 3 === 2 && j !== 8 ? 'border-r-4 border-gray-900 dark:border-gray-600' : 'border-r border-gray-300 dark:border-gray-600'}
                      ${i % 3 === 2 && i !== 8 ? 'border-b-4 border-gray-900 dark:border-gray-600' : 'border-b border-gray-300 dark:border-gray-600'}
                      ${!isSelected && 'hover:bg-blue-50 dark:hover:bg-gray-600'}
                    `}
                  >
                    {cell !== 0 && cell}
                  </div>
                );
              })
            )}
          </div>
        </div>
        
        <div className="mt-6">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 text-center">
            Select a number:
          </p>
          <div className="grid grid-cols-9 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => handleNumberInput(num)}
                disabled={!selected}
                className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 disabled:transform-none text-lg"
              >
                {num}
              </button>
            ))}
          </div>
        </div>
        
        {isComplete() && (
          <div className="mt-6 text-center bg-green-100 dark:bg-green-900/30 p-4 rounded-lg">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">🎉 Congratulations! 🎉</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">You solved the puzzle!</p>
          </div>
        )}
      </div>
    </div>
  );
};
