import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Eraser } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

type CellType = 'empty' | 'wall' | 'start' | 'end' | 'visited' | 'path';
type Algorithm = 'dijkstra' | 'astar' | 'bfs' | 'dfs' | 'bellmanford' | 'bidirectional';

interface Cell {
  row: number;
  col: number;
  type: CellType;
  distance: number;
  previous: Cell | null;
}

const ROWS = 20;
const COLS = 35;

export const PathfindingVisualizer: React.FC = () => {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [algorithm, setAlgorithm] = useState<Algorithm>('astar');
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(50);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState<'wall' | 'erase' | 'start' | 'end'>('wall');
  const [pathLength, setPathLength] = useState(0);
  const [visitedCount, setVisitedCount] = useState(0);
  const [startPos, setStartPos] = useState({ row: 10, col: 5 });
  const [endPos, setEndPos] = useState({ row: 10, col: 30 });
  const isRunningRef = useRef(false);

  useEffect(() => {
    initializeGrid();
  }, []);

  const initializeGrid = () => {
    const newGrid: Cell[][] = [];
    for (let row = 0; row < ROWS; row++) {
      const currentRow: Cell[] = [];
      for (let col = 0; col < COLS; col++) {
        let type: CellType = 'empty';
        if (row === startPos.row && col === startPos.col) type = 'start';
        if (row === endPos.row && col === endPos.col) type = 'end';

        currentRow.push({ row, col, type, distance: Infinity, previous: null });
      }
      newGrid.push(currentRow);
    }
    setGrid(newGrid);
    setPathLength(0);
    setVisitedCount(0);
  };

  const resetPath = () => {
    const newGrid = grid.map(row =>
      row.map(cell => ({
        ...cell,
        type: cell.type === 'visited' || cell.type === 'path' ? 'empty' : cell.type,
        distance: Infinity,
        previous: null
      }))
    );
    setGrid(newGrid);
    setPathLength(0);
    setVisitedCount(0);
  };

  const clearWalls = () => {
    const newGrid = grid.map(row =>
      row.map(cell => ({ ...cell, type: cell.type === 'wall' ? 'empty' : cell.type }))
    );
    setGrid(newGrid);
  };

  const handleCellClick = (row: number, col: number) => {
    if (isRunning) return;
    const cell = grid[row][col];

    const newGrid = [...grid];

    if (drawMode === 'start') {
      // Clear old start position
      newGrid[startPos.row][startPos.col].type = 'empty';
      // Set new start position
      newGrid[row][col].type = 'start';
      setStartPos({ row, col });
    } else if (drawMode === 'end') {
      // Clear old end position
      newGrid[endPos.row][endPos.col].type = 'empty';
      // Set new end position
      newGrid[row][col].type = 'end';
      setEndPos({ row, col });
    } else if (cell.type === 'start' || cell.type === 'end') {
      return; // Don't allow drawing walls on start/end
    } else if (drawMode === 'wall') {
      newGrid[row][col].type = cell.type === 'wall' ? 'empty' : 'wall';
    } else if (drawMode === 'erase') {
      if (cell.type === 'wall') newGrid[row][col].type = 'empty';
    }

    setGrid(newGrid);
  };

  const handleMouseDown = (row: number, col: number) => {
    if (isRunning) return;
    setIsDrawing(true);
    handleCellClick(row, col);
  };

  const handleMouseEnter = (row: number, col: number) => {
    if (!isDrawing || isRunning) return;
    handleCellClick(row, col);
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const getNeighbors = (cell: Cell, gridData: Cell[][]): Cell[] => {
    const neighbors: Cell[] = [];
    const { row, col } = cell;
    if (row > 0) neighbors.push(gridData[row - 1][col]);
    if (row < ROWS - 1) neighbors.push(gridData[row + 1][col]);
    if (col > 0) neighbors.push(gridData[row][col - 1]);
    if (col < COLS - 1) neighbors.push(gridData[row][col + 1]);
    return neighbors.filter(n => n.type !== 'wall');
  };

  const heuristic = (a: Cell, b: Cell) => Math.abs(a.row - b.row) + Math.abs(a.col - b.col);

  const reconstructPath = async (endCell: Cell, gridData: Cell[][]) => {
    const path: Cell[] = [];
    let current: Cell | null = endCell;
    while (current !== null) {
      path.unshift(current);
      current = current.previous;
    }
    for (const cell of path) {
      if (!isRunningRef.current) return;
      if (cell.type !== 'start' && cell.type !== 'end') {
        gridData[cell.row][cell.col].type = 'path';
        setGrid([...gridData]);
        await sleep(Math.max(10, 101 - speed));
      }
    }
    setPathLength(path.length - 1);
  };

  const visualizeAlgorithm = async () => {
    if (isRunning) {
      isRunningRef.current = false;
      setIsRunning(false);
      return;
    }

    resetPath();
    setIsRunning(true);
    isRunningRef.current = true;

    const gridCopy = grid.map(row => row.map(cell => ({ ...cell, distance: Infinity, previous: null })));
    const startCell = gridCopy[startPos.row][startPos.col];
    const endCell = gridCopy[endPos.row][endPos.col];

    try {
      if (algorithm === 'dijkstra' || algorithm === 'astar') {
        await runDijkstraOrAStar(gridCopy, startCell, endCell, algorithm === 'astar');
      } else if (algorithm === 'bfs') {
        await runBFS(gridCopy, startCell, endCell);
      } else if (algorithm === 'dfs') {
        await runDFS(gridCopy, startCell, endCell);
      } else if (algorithm === 'bellmanford') {
        await runBellmanFord(gridCopy, startCell, endCell);
      } else if (algorithm === 'bidirectional') {
        await runBidirectional(gridCopy, startCell, endCell);
      }
    } catch (error) {
      console.error('Error:', error);
    }

    setIsRunning(false);
    isRunningRef.current = false;
  };

  const runDijkstraOrAStar = async (gridData: Cell[][], start: Cell, end: Cell, useHeuristic: boolean) => {
    start.distance = 0;
    const unvisited = gridData.flat();
    let visited = 0;

    while (unvisited.length > 0) {
      if (!isRunningRef.current) return;
      unvisited.sort((a, b) => {
        const aScore = useHeuristic ? a.distance + heuristic(a, end) : a.distance;
        const bScore = useHeuristic ? b.distance + heuristic(b, end) : b.distance;
        return aScore - bScore;
      });
      const current = unvisited.shift()!;
      if (current.distance === Infinity) break;
      if (current.row === end.row && current.col === end.col) {
        await reconstructPath(current, gridData);
        return;
      }
      if (current.type !== 'start' && current.type !== 'end') {
        current.type = 'visited';
        visited++;
        setVisitedCount(visited);
        setGrid([...gridData]);
        await sleep(Math.max(10, 101 - speed));
      }
      for (const neighbor of getNeighbors(current, gridData)) {
        const alt = current.distance + 1;
        if (alt < neighbor.distance) {
          neighbor.distance = alt;
          neighbor.previous = current;
        }
      }
    }
  };

  const runBFS = async (gridData: Cell[][], start: Cell, end: Cell) => {
    const queue = [start];
    const visited = new Set([`${start.row},${start.col}`]);
    let count = 0;

    while (queue.length > 0) {
      if (!isRunningRef.current) return;
      const current = queue.shift()!;
      if (current.row === end.row && current.col === end.col) {
        await reconstructPath(current, gridData);
        return;
      }
      if (current.type !== 'start' && current.type !== 'end') {
        current.type = 'visited';
        count++;
        setVisitedCount(count);
        setGrid([...gridData]);
        await sleep(Math.max(10, 101 - speed));
      }
      for (const neighbor of getNeighbors(current, gridData)) {
        const key = `${neighbor.row},${neighbor.col}`;
        if (!visited.has(key)) {
          visited.add(key);
          neighbor.previous = current;
          queue.push(neighbor);
        }
      }
    }
  };

  const runDFS = async (gridData: Cell[][], start: Cell, end: Cell) => {
    const stack = [start];
    const visited = new Set([`${start.row},${start.col}`]);
    let count = 0;

    while (stack.length > 0) {
      if (!isRunningRef.current) return;
      const current = stack.pop()!;
      if (current.row === end.row && current.col === end.col) {
        await reconstructPath(current, gridData);
        return;
      }
      if (current.type !== 'start' && current.type !== 'end') {
        current.type = 'visited';
        count++;
        setVisitedCount(count);
        setGrid([...gridData]);
        await sleep(Math.max(10, 101 - speed));
      }
      for (const neighbor of getNeighbors(current, gridData)) {
        const key = `${neighbor.row},${neighbor.col}`;
        if (!visited.has(key)) {
          visited.add(key);
          neighbor.previous = current;
          stack.push(neighbor);
        }
      }
    }
  };

  const runBellmanFord = async (gridData: Cell[][], start: Cell, end: Cell) => {
    start.distance = 0;
    const allCells = gridData.flat().filter(c => c.type !== 'wall');
    let count = 0;

    // Relax edges V-1 times
    for (let i = 0; i < allCells.length - 1; i++) {
      if (!isRunningRef.current) return;

      for (const cell of allCells) {
        if (cell.distance === Infinity) continue;

        for (const neighbor of getNeighbors(cell, gridData)) {
          const alt = cell.distance + 1;
          if (alt < neighbor.distance) {
            neighbor.distance = alt;
            neighbor.previous = cell;

            if (neighbor.type !== 'start' && neighbor.type !== 'end' && neighbor.type !== 'visited') {
              neighbor.type = 'visited';
              count++;
              setVisitedCount(count);
              setGrid([...gridData]);
              await sleep(Math.max(10, 101 - speed));
            }
          }
        }
      }
    }

    if (end.distance !== Infinity) {
      await reconstructPath(end, gridData);
    }
  };

  const runBidirectional = async (gridData: Cell[][], start: Cell, end: Cell) => {
    const queueStart = [start];
    const queueEnd = [end];
    const visitedStart = new Map([[`${start.row},${start.col}`, start]]);
    const visitedEnd = new Map([[`${end.row},${end.col}`, end]]);
    let count = 0;

    while (queueStart.length > 0 && queueEnd.length > 0) {
      if (!isRunningRef.current) return;

      // Expand from start
      if (queueStart.length > 0) {
        const current = queueStart.shift()!;

        for (const neighbor of getNeighbors(current, gridData)) {
          const key = `${neighbor.row},${neighbor.col}`;

          // Check if we met the other search
          if (visitedEnd.has(key)) {
            neighbor.previous = current;
            const meetPoint = visitedEnd.get(key)!;

            // Reconstruct path from both sides
            const pathFromStart: Cell[] = [];
            let curr: Cell | null = neighbor;
            while (curr) {
              pathFromStart.unshift(curr);
              curr = curr.previous;
            }

            const pathFromEnd: Cell[] = [];
            curr = meetPoint;
            while (curr && curr !== neighbor) {
              pathFromEnd.push(curr);
              curr = curr.previous;
            }

            const fullPath = [...pathFromStart, ...pathFromEnd];
            for (const cell of fullPath) {
              if (!isRunningRef.current) return;
              if (cell.type !== 'start' && cell.type !== 'end') {
                gridData[cell.row][cell.col].type = 'path';
                setGrid([...gridData]);
                await sleep(Math.max(10, 101 - speed));
              }
            }
            setPathLength(fullPath.length - 1);
            return;
          }

          if (!visitedStart.has(key)) {
            visitedStart.set(key, neighbor);
            neighbor.previous = current;
            queueStart.push(neighbor);

            if (neighbor.type !== 'start' && neighbor.type !== 'end') {
              neighbor.type = 'visited';
              count++;
              setVisitedCount(count);
              setGrid([...gridData]);
              await sleep(Math.max(10, 101 - speed));
            }
          }
        }
      }

      // Expand from end
      if (queueEnd.length > 0) {
        const current = queueEnd.shift()!;

        for (const neighbor of getNeighbors(current, gridData)) {
          const key = `${neighbor.row},${neighbor.col}`;

          if (visitedStart.has(key)) {
            neighbor.previous = current;
            const meetPoint = visitedStart.get(key)!;

            const pathFromStart: Cell[] = [];
            let curr: Cell | null = meetPoint;
            while (curr) {
              pathFromStart.unshift(curr);
              curr = curr.previous;
            }

            const pathFromEnd: Cell[] = [];
            curr = neighbor;
            while (curr && curr !== meetPoint) {
              pathFromEnd.push(curr);
              curr = curr.previous;
            }

            const fullPath = [...pathFromStart, ...pathFromEnd];
            for (const cell of fullPath) {
              if (!isRunningRef.current) return;
              if (cell.type !== 'start' && cell.type !== 'end') {
                gridData[cell.row][cell.col].type = 'path';
                setGrid([...gridData]);
                await sleep(Math.max(10, 101 - speed));
              }
            }
            setPathLength(fullPath.length - 1);
            return;
          }

          if (!visitedEnd.has(key)) {
            visitedEnd.set(key, neighbor);
            neighbor.previous = current;
            queueEnd.push(neighbor);

            if (neighbor.type !== 'start' && neighbor.type !== 'end') {
              neighbor.type = 'visited';
              count++;
              setVisitedCount(count);
              setGrid([...gridData]);
              await sleep(Math.max(10, 101 - speed));
            }
          }
        }
      }
    }
  };

  const generateRandomMaze = () => {
    if (isRunning) return;
    const newGrid = grid.map(row =>
      row.map(cell => {
        if (cell.type === 'start' || cell.type === 'end') return cell;
        return { ...cell, type: Math.random() < 0.3 ? 'wall' as CellType : 'empty' as CellType };
      })
    );
    setGrid(newGrid);
  };

  const generateRecursiveMaze = () => {
    if (isRunning) return;
    const newGrid = grid.map(row =>
      row.map(cell => ({ ...cell, type: cell.type === 'start' || cell.type === 'end' ? cell.type : 'wall' as CellType }))
    );

    const carve = (row: number, col: number) => {
      const directions = [
        [0, 2], [2, 0], [0, -2], [-2, 0]
      ].sort(() => Math.random() - 0.5);

      for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;
        if (newRow > 0 && newRow < ROWS - 1 && newCol > 0 && newCol < COLS - 1 &&
          newGrid[newRow][newCol].type === 'wall') {
          newGrid[row + dr / 2][col + dc / 2].type = 'empty';
          newGrid[newRow][newCol].type = 'empty';
          carve(newRow, newCol);
        }
      }
    };

    newGrid[1][1].type = 'empty';
    carve(1, 1);
    setGrid(newGrid);
  };

  const generateVerticalMaze = () => {
    if (isRunning) return;
    const newGrid = grid.map(row => row.map(cell => ({ ...cell, type: 'empty' as CellType })));

    for (let col = 2; col < COLS; col += 3) {
      const gapRow = Math.floor(Math.random() * ROWS);
      for (let row = 0; row < ROWS; row++) {
        if (row !== gapRow && newGrid[row][col].type !== 'start' && newGrid[row][col].type !== 'end') {
          newGrid[row][col].type = 'wall';
        }
      }
    }
    setGrid(newGrid);
  };

  const generateHorizontalMaze = () => {
    if (isRunning) return;
    const newGrid = grid.map(row => row.map(cell => ({ ...cell, type: 'empty' as CellType })));

    for (let row = 2; row < ROWS; row += 3) {
      const gapCol = Math.floor(Math.random() * COLS);
      for (let col = 0; col < COLS; col++) {
        if (col !== gapCol && newGrid[row][col].type !== 'start' && newGrid[row][col].type !== 'end') {
          newGrid[row][col].type = 'wall';
        }
      }
    }
    setGrid(newGrid);
  };

  const getCellColor = (type: CellType) => {
    switch (type) {
      case 'start': return 'bg-green-500';
      case 'end': return 'bg-red-500';
      case 'wall': return 'bg-gray-800 dark:bg-gray-700';
      case 'visited': return 'bg-blue-300 dark:bg-blue-600';
      case 'path': return 'bg-yellow-400 dark:bg-yellow-500';
      default: return 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600';
    }
  };

  const getAlgorithmDescription = () => {
    switch (algorithm) {
      case 'astar':
        return 'A* uses heuristics to find the shortest path efficiently. Optimal and fast.';
      case 'dijkstra':
        return "Dijkstra's algorithm guarantees the shortest path. Slower than A* but always optimal.";
      case 'bfs':
        return 'BFS explores all neighbors level by level. Optimal for unweighted graphs.';
      case 'dfs':
        return 'DFS explores as far as possible before backtracking. Not optimal but memory efficient.';
      case 'bellmanford':
        return 'Bellman-Ford can handle negative weights and detects negative cycles.';
      case 'bidirectional':
        return 'Searches from both start and end simultaneously. Very fast for finding paths.';
      default:
        return '';
    }
  };

  return (
    <div className="h-full w-full bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <div className="space-y-4">
        <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-2 block dark:text-white">Algorithm</label>
              <Select value={algorithm} onValueChange={(v) => setAlgorithm(v as Algorithm)} disabled={isRunning}>
                <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                  <SelectValue placeholder="Select algorithm" />
                </SelectTrigger>
                <SelectContent className="z-[999999] bg-white dark:bg-gray-800">
                  <SelectItem value="astar">A* (Optimal & Fast)</SelectItem>
                  <SelectItem value="dijkstra">Dijkstra (Optimal)</SelectItem>
                  <SelectItem value="bfs">BFS (Unweighted)</SelectItem>
                  <SelectItem value="dfs">DFS (Not Optimal)</SelectItem>
                  <SelectItem value="bellmanford">Bellman-Ford (Negative Weights)</SelectItem>
                  <SelectItem value="bidirectional">Bidirectional Search (Fast)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block dark:text-white">Speed: {speed}</label>
              <Slider value={[speed]} onValueChange={(v) => setSpeed(v[0])} min={1} max={100} className="dark:bg-gray-700" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block dark:text-white">Draw Mode</label>
              <Select value={drawMode} onValueChange={(v) => setDrawMode(v as 'wall' | 'erase' | 'start' | 'end')} disabled={isRunning}>
                <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent className="z-[999999] bg-white dark:bg-gray-800">
                  <SelectItem value="wall">Draw Walls</SelectItem>
                  <SelectItem value="erase">Erase Walls</SelectItem>
                  <SelectItem value="start">Move Start</SelectItem>
                  <SelectItem value="end">Move End</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={visualizeAlgorithm} className="w-full">
                {isRunning ? <><Pause className="mr-2 h-4 w-4" />Stop</> : <><Play className="mr-2 h-4 w-4" />Start</>}
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={resetPath} variant="outline" disabled={isRunning} size="sm">
              <RotateCcw className="mr-2 h-4 w-4" />Reset Path
            </Button>
            <Button onClick={clearWalls} variant="outline" disabled={isRunning} size="sm">
              <Eraser className="mr-2 h-4 w-4" />Clear Walls
            </Button>
            <Button onClick={initializeGrid} variant="outline" disabled={isRunning} size="sm">
              Reset All
            </Button>
            <div className="w-px h-8 bg-gray-300 dark:bg-gray-600" />
            <Button onClick={generateRandomMaze} variant="outline" disabled={isRunning} size="sm">
              Random Maze
            </Button>
            <Button onClick={generateRecursiveMaze} variant="outline" disabled={isRunning} size="sm">
              Recursive Maze
            </Button>
            <Button onClick={generateVerticalMaze} variant="outline" disabled={isRunning} size="sm">
              Vertical Maze
            </Button>
            <Button onClick={generateHorizontalMaze} variant="outline" disabled={isRunning} size="sm">
              Horizontal Maze
            </Button>
          </div>
        </Card>

        <Card className="p-4 overflow-x-auto dark:bg-gray-800 dark:border-gray-700">
          <div className="inline-block" onMouseLeave={() => setIsDrawing(false)}>
            {grid.map((row, rowIdx) => (
              <div key={rowIdx} className="flex">
                {row.map((cell, colIdx) => (
                  <div
                    key={`${rowIdx}-${colIdx}`}
                    className={`w-6 h-6 ${getCellColor(cell.type)} cursor-pointer transition-colors hover:opacity-80`}
                    onMouseDown={() => handleMouseDown(rowIdx, colIdx)}
                    onMouseEnter={() => handleMouseEnter(rowIdx, colIdx)}
                    onMouseUp={() => setIsDrawing(false)}
                    title={
                      cell.type === 'start' ? 'Start Point' :
                        cell.type === 'end' ? 'End Point' :
                          cell.type === 'wall' ? 'Wall' :
                            drawMode === 'start' ? 'Click to set Start' :
                              drawMode === 'end' ? 'Click to set End' :
                                drawMode === 'wall' ? 'Click to draw Wall' :
                                  'Click to erase'
                    }
                  />
                ))}
              </div>
            ))}
          </div>
        </Card>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-4 dark:bg-gray-800">
            <h3 className="font-bold mb-2 dark:text-white">Algorithm Info</h3>
            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
              {algorithm.toUpperCase().replace('BELLMANFORD', 'BELLMAN-FORD').replace('BIDIRECTIONAL', 'BIDIRECTIONAL SEARCH')}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">{getAlgorithmDescription()}</p>
          </Card>
          <Card className="p-4 dark:bg-gray-800">
            <h3 className="font-bold mb-2 dark:text-white">Statistics</h3>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Cells Visited:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{visitedCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Path Length:</span>
                <span className="font-bold text-yellow-600 dark:text-yellow-400">{pathLength}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Efficiency:</span>
                <span className="font-bold text-green-600 dark:text-green-400">
                  {pathLength > 0 ? `${((pathLength / Math.max(visitedCount, 1)) * 100).toFixed(1)}%` : 'N/A'}
                </span>
              </div>
            </div>
          </Card>
          <Card className="p-4 dark:bg-gray-800">
            <h3 className="font-bold mb-2 dark:text-white">Legend</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded" />
                <span className="dark:text-gray-300">Start</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded" />
                <span className="dark:text-gray-300">End</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-800 dark:bg-gray-700 rounded" />
                <span className="dark:text-gray-300">Wall</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-300 dark:bg-blue-600 rounded" />
                <span className="dark:text-gray-300">Visited</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-400 dark:bg-yellow-500 rounded" />
                <span className="dark:text-gray-300">Path</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
