import React, { useState, useCallback, useRef, useEffect } from 'react';

type BacktrackProblem = 'nqueens' | 'sudoku';

// ==================== N-Queens ====================
interface NQueensState {
  board: number[][]; // 1 = queen
  n: number;
  currentRow: number;
  currentCol: number;
  solved: boolean;
  checking: boolean;
}

function createEmptyBoard(n: number): number[][] {
  return Array.from({ length: n }, () => Array(n).fill(0));
}

function isQueenSafe(board: number[][], row: number, col: number, n: number): boolean {
  for (let i = 0; i < row; i++) if (board[i][col] === 1) return false;
  for (let i = row - 1, j = col - 1; i >= 0 && j >= 0; i--, j--) if (board[i][j] === 1) return false;
  for (let i = row - 1, j = col + 1; i >= 0 && j < n; i--, j++) if (board[i][j] === 1) return false;
  return true;
}

function generateNQueensSteps(n: number): NQueensState[] {
  const steps: NQueensState[] = [];
  const board = createEmptyBoard(n);

  steps.push({ board: board.map(r => [...r]), n, currentRow: 0, currentCol: -1, solved: false, checking: false });

  const solve = (row: number): boolean => {
    if (row === n) {
      steps.push({ board: board.map(r => [...r]), n, currentRow: -1, currentCol: -1, solved: true, checking: false });
      return true;
    }
    for (let col = 0; col < n; col++) {
      steps.push({ board: board.map(r => [...r]), n, currentRow: row, currentCol: col, solved: false, checking: true });

      if (isQueenSafe(board, row, col, n)) {
        board[row][col] = 1;
        steps.push({ board: board.map(r => [...r]), n, currentRow: row, currentCol: col, solved: false, checking: false });

        if (solve(row + 1)) return true;

        board[row][col] = 0; // backtrack
        steps.push({ board: board.map(r => [...r]), n, currentRow: row, currentCol: col, solved: false, checking: false });
      }
    }
    return false;
  };

  solve(0);
  return steps;
}

// ==================== Sudoku Solver ====================
interface SudokuState {
  grid: number[][];
  currentRow: number;
  currentCol: number;
  solved: boolean;
  trying: number;
}

const SUDOKU_PUZZLES = [
  [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
  ],
  [
    [0, 0, 0, 2, 6, 0, 7, 0, 1],
    [6, 8, 0, 0, 7, 0, 0, 9, 0],
    [1, 9, 0, 0, 0, 4, 5, 0, 0],
    [8, 2, 0, 1, 0, 0, 0, 4, 0],
    [0, 0, 4, 6, 0, 2, 9, 0, 0],
    [0, 5, 0, 0, 0, 3, 0, 2, 8],
    [0, 0, 9, 3, 0, 0, 0, 7, 4],
    [0, 4, 0, 0, 5, 0, 0, 3, 6],
    [7, 0, 3, 0, 1, 8, 0, 0, 0],
  ],
];

function isSudokuValid(grid: number[][], row: number, col: number, num: number): boolean {
  for (let j = 0; j < 9; j++) if (grid[row][j] === num) return false;
  for (let i = 0; i < 9; i++) if (grid[i][col] === num) return false;
  const br = Math.floor(row / 3) * 3, bc = Math.floor(col / 3) * 3;
  for (let i = br; i < br + 3; i++) for (let j = bc; j < bc + 3; j++) if (grid[i][j] === num) return false;
  return true;
}

function generateSudokuSteps(puzzle: number[][]): SudokuState[] {
  const steps: SudokuState[] = [];
  const grid = puzzle.map(r => [...r]);
  const original = puzzle.map(r => [...r]);

  steps.push({ grid: grid.map(r => [...r]), currentRow: -1, currentCol: -1, solved: false, trying: 0 });

  const solve = (): boolean => {
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (grid[i][j] === 0) {
          for (let num = 1; num <= 9; num++) {
            steps.push({ grid: grid.map(r => [...r]), currentRow: i, currentCol: j, solved: false, trying: num });

            if (isSudokuValid(grid, i, j, num)) {
              grid[i][j] = num;
              steps.push({ grid: grid.map(r => [...r]), currentRow: i, currentCol: j, solved: false, trying: num });

              if (solve()) return true;

              grid[i][j] = 0; // backtrack
              steps.push({ grid: grid.map(r => [...r]), currentRow: i, currentCol: j, solved: false, trying: 0 });
            }
          }
          return false;
        }
      }
    }
    steps.push({ grid: grid.map(r => [...r]), currentRow: -1, currentCol: -1, solved: true, trying: 0 });
    return true;
  };

  solve();
  return steps;
}

export const BacktrackingVisualizer: React.FC = () => {
  const [problem, setProblem] = useState<BacktrackProblem>('nqueens');
  const [nQueensSize, setNQueensSize] = useState(8);
  const [sudokuIdx, setSudokuIdx] = useState(0);
  const [speed, setSpeed] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<(NQueensState | SudokuState)[]>([]);
  const isPlayingRef = useRef(false);

  const generate = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    setCurrentStep(0);
    if (problem === 'nqueens') {
      setSteps(generateNQueensSteps(nQueensSize));
    } else {
      setSteps(generateSudokuSteps(SUDOKU_PUZZLES[sudokuIdx]));
    }
  }, [problem, nQueensSize, sudokuIdx]);

  useEffect(() => { generate(); }, [generate]);

  const play = useCallback(async () => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;
    setIsPlaying(true);
    let s = currentStep;
    while (s < steps.length - 1 && isPlayingRef.current) {
      s++;
      setCurrentStep(s);
      await new Promise(r => setTimeout(r, speed));
    }
    isPlayingRef.current = false;
    setIsPlaying(false);
  }, [currentStep, steps, speed]);

  const pause = () => { isPlayingRef.current = false; setIsPlaying(false); };

  const skipToEnd = () => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    setCurrentStep(steps.length - 1);
  };

  const stepState = steps[currentStep];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-amber-50 dark:from-gray-950 dark:to-amber-950 p-3 overflow-hidden">
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        <select value={problem} onChange={e => setProblem(e.target.value as BacktrackProblem)}
          className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
          <option value="nqueens">N-Queens</option>
          <option value="sudoku">Sudoku Solver</option>
        </select>

        {problem === 'nqueens' && (
          <select value={nQueensSize} onChange={e => setNQueensSize(Number(e.target.value))}
            className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
            {[4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}×{n} Board</option>)}
          </select>
        )}

        {problem === 'sudoku' && (
          <select value={sudokuIdx} onChange={e => setSudokuIdx(Number(e.target.value))}
            className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
            <option value={0}>Puzzle 1</option>
            <option value={1}>Puzzle 2</option>
          </select>
        )}

        <div className="flex items-center gap-1 ml-2">
          <span className="text-xs text-gray-500">Speed:</span>
          <input type="range" min={1} max={500} step={5} value={speed} onChange={e => setSpeed(Number(e.target.value))} className="w-24" />
          <span className="text-xs text-gray-500 w-12">{speed}ms</span>
        </div>

        <div className="flex gap-1 ml-auto">
          {!isPlaying ? (
            <button onClick={play} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">▶ Play</button>
          ) : (
            <button onClick={pause} className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">⏸ Pause</button>
          )}
          <button onClick={() => setCurrentStep(s => Math.min(s + 1, steps.length - 1))} disabled={isPlaying}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Step →</button>
          <button onClick={skipToEnd} className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700">⏭ End</button>
          <button onClick={generate} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">↺ Reset</button>
        </div>
      </div>

      <div className="text-xs text-gray-600 dark:text-gray-400 bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 mb-2">
        {problem === 'nqueens'
          ? `N-Queens: Place ${nQueensSize} queens on a ${nQueensSize}×${nQueensSize} board so no two attack each other. Backtracking explores candidatesrow-by-row.`
          : 'Sudoku Solver: Fill empty cells with 1-9 so each row, column, and 3×3 box has unique digits. Backtracking tries each number.'}
        {stepState && 'solved' in stepState && stepState.solved && ' ✅ SOLVED!'}
      </div>

      {/* Board */}
      <div className="flex-1 min-h-0 flex items-center justify-center overflow-auto">
        {stepState && problem === 'nqueens' && 'board' in stepState && (
          <div className="inline-grid gap-0" style={{ gridTemplateColumns: `repeat(${(stepState as NQueensState).n}, minmax(0, 1fr))` }}>
            {(stepState as NQueensState).board.map((row, i) =>
              row.map((cell, j) => {
                const isChecking = (stepState as NQueensState).currentRow === i && (stepState as NQueensState).currentCol === j;
                const isDark = (i + j) % 2 === 1;
                return (
                  <div key={`${i}-${j}`}
                    className={`flex items-center justify-center transition-all duration-100
                      ${isDark ? 'bg-amber-700' : 'bg-amber-200'}
                      ${isChecking ? 'ring-2 ring-red-500 ring-inset' : ''}
                      ${(stepState as NQueensState).solved && cell === 1 ? 'bg-green-400' : ''}
                    `}
                    style={{ width: Math.min(60, 400 / (stepState as NQueensState).n), height: Math.min(60, 400 / (stepState as NQueensState).n) }}>
                    {cell === 1 && <span className="text-lg">♛</span>}
                    {isChecking && (stepState as NQueensState).checking && cell === 0 && <span className="text-lg opacity-40">♛</span>}
                  </div>
                );
              })
            )}
          </div>
        )}

        {stepState && problem === 'sudoku' && 'grid' in stepState && (
          <div className="inline-grid gap-0 border-2 border-gray-800 dark:border-gray-200">
            {(stepState as SudokuState).grid.map((row, i) =>
              row.map((cell, j) => {
                const isCurrent = (stepState as SudokuState).currentRow === i && (stepState as SudokuState).currentCol === j;
                const isOriginal = SUDOKU_PUZZLES[sudokuIdx][i][j] !== 0;
                const borderR = j % 3 === 2 && j < 8 ? 'border-r-2 border-r-gray-800 dark:border-r-gray-200' : 'border-r border-r-gray-300 dark:border-r-gray-600';
                const borderB = i % 3 === 2 && i < 8 ? 'border-b-2 border-b-gray-800 dark:border-b-gray-200' : 'border-b border-b-gray-300 dark:border-b-gray-600';
                return (
                  <div key={`${i}-${j}`}
                    className={`flex items-center justify-center text-sm font-mono font-bold transition-all duration-100
                      ${borderR} ${borderB}
                      ${isCurrent ? 'bg-amber-300 dark:bg-amber-600 ring-2 ring-amber-500' :
                        isOriginal ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200' :
                        cell !== 0 ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' :
                        'bg-white dark:bg-gray-900 text-gray-400'}
                      ${(stepState as SudokuState).solved ? 'bg-green-100 dark:bg-green-900/30' : ''}
                    `}
                    style={{ width: 40, height: 40, gridColumn: j + 1, gridRow: i + 1 }}>
                    {cell !== 0 ? cell : ''}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center gap-4 bg-white/60 dark:bg-gray-800/60 rounded-lg p-2">
        <span className="text-xs text-gray-500">Step {currentStep + 1}/{steps.length}</span>
        <input type="range" min={0} max={steps.length - 1} value={currentStep}
          onChange={e => { if (!isPlaying) setCurrentStep(Number(e.target.value)); }}
          className="flex-1" />
        {stepState && 'trying' in stepState && (stepState as SudokuState).trying > 0 && (
          <span className="text-xs text-amber-600 font-bold">Trying: {(stepState as SudokuState).trying}</span>
        )}
      </div>
    </div>
  );
};
