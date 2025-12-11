import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Trash2, MapPin, Flag } from 'lucide-react';

type CellType = 'empty' | 'wall' | 'start' | 'end' | 'visited' | 'path' | 'current';
type Algorithm = 'dijkstra' | 'astar' | 'bfs' | 'dfs';
type DrawMode = 'wall' | 'start' | 'end' | 'erase';

interface Cell {
  row: number;
  col: number;
  type: CellType;
  distance: number;
  heuristic: number;
  parent: Cell | null;
  visited: boolean;
}

const GRID_ROWS = 25;
const GRID_COLS = 45;

export const PathfindingVisualizer: React.FC = () => {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [algorithm, setAlgorithm] = useState<Algorithm>('astar');
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(10);
  const [drawMode, setDrawMode] = useState<DrawMode>('wall');
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<[number, number]>([12, 10]);
  const [endPos, setEndPos] = useState<[number, number]>([12, 35]);
  const [stats, setStats] = useState({ visited: 0, pathLength: 0, time: 0 });
  const animationRef = useRef<number>();
  const pauseRef = useRef(false);

  // Initialize grid
  useEffect(() => {
    initializeGrid();
  }, []);

  const initializeGrid = () => {
    const newGrid: Cell[][] = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      const currentRow: Cell[] = [];
      for (let col = 0; col < GRID_COLS; col++) {
        let type: CellType = 'empty';
        if (row === startPos[0] && col === startPos[1]) type = 'start';
        if (row === endPos[0] && col === endPos[1]) type = 'end';
        
        currentRow.push({
          row,
          col,
          type,
          distance: Infinity,
          heuristic: 0,
          parent: null,
          visited: false,
        });
      }
      newGrid.push(currentRow);
    }
    setGrid(newGrid);
    setStats({ visited: 0, pathLength: 0, time: 0 });
  };

  const clearPath = () => {
    const newGrid = grid.map(row =>
      row.map(cell => ({
        ...cell,
        type: cell.type === 'visited' || cell.type === 'path' || cell.type === 'current' ? 'empty' : cell.type,
        distance: Infinity,
        heuristic: 0,
        parent: null,
        visited: false,
      }))
    );
    setGrid(newGrid);
    setStats({ visited: 0, pathLength: 0, time: 0 });
  };

  const clearWalls = () => {
    const newGrid = grid.map(row =>
      row.map(cell => ({
        ...cell,
        type: cell.type === 'wall' ? 'empty' : cell.type,
      }))
    );
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

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleCellClick = (row: number, col: number) => {
    const newGrid = [...grid];
    const cell = newGrid[row][col];

    if (drawMode === 'start') {
      if (cell.type === 'end') return;
      newGrid[startPos[0]][startPos[1]].type = 'empty';
      cell.type = 'start';
      setStartPos([row, col]);
    } else if (drawMode === 'end') {
      if (cell.type === 'start') return;
      newGrid[endPos[0]][endPos[1]].type = 'empty';
      cell.type = 'end';
      setEndPos([row, col]);
    } else if (drawMode === 'wall') {
      if (cell.type === 'start' || cell.type === 'end') return;
      cell.type = 'wall';
    } else if (drawMode === 'erase') {
      if (cell.type === 'start' || cell.type === 'end') return;
      cell.type = 'empty';
    }

    setGrid(newGrid);
  };

  const getNeighbors = (cell: Cell, grid: Cell[][]): Cell[] => {
    const neighbors: Cell[] = [];
    const { row, col } = cell;
    
    if (row > 0) neighbors.push(grid[row - 1][col]);
    if (row < GRID_ROWS - 1) neighbors.push(grid[row + 1][col]);
    if (col > 0) neighbors.push(grid[row][col - 1]);
    if (col < GRID_COLS - 1) neighbors.push(grid[row][col + 1]);
    
    return neighbors.filter(n => n.type !== 'wall');
  };

  const heuristic = (cell: Cell, end: Cell): number => {
    return Math.abs(cell.row - end.row) + Math.abs(cell.col - end.col);
  };

  const reconstructPath = (endCell: Cell): Cell[] => {
    const path: Cell[] = [];
    let current: Cell | null = endCell;
    while (current !== null) {
      path.unshift(current);
      current = current.parent;
    }
    return path;
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const visualizePath = async (path: Cell[]) => {
    for (let i = 1; i < path.length - 1; i++) {
      if (pauseRef.current) {
        await new Promise(resolve => {
          const checkPause = setInterval(() => {
            if (!pauseRef.current) {
              clearInterval(checkPause);
              resolve(null);
            }
          }, 100);
        });
      }
      
      const newGrid = [...grid];
      newGrid[path[i].row][path[i].col].type = 'path';
      setGrid(newGrid);
      await sleep(50 - speed * 4);
    }
  };

  const runDijkstra = async () => {
    const startTime = Date.now();
    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
    const startCell = newGrid[startPos[0]][startPos[1]];
    const endCell = newGrid[endPos[0]][endPos[1]];
    
    startCell.distance = 0;
    const unvisited: Cell[] = [];
    
    for (const row of newGrid) {
      for (const cell of row) {
        unvisited.push(cell);
      }
    }

    let visitedCount = 0;

    while (unvisited.length > 0) {
      if (pauseRef.current) {
        await new Promise(resolve => {
          const checkPause = setInterval(() => {
            if (!pauseRef.current) {
              clearInterval(checkPause);
              resolve(null);
            }
          }, 100);
        });
      }

      unvisited.sort((a, b) => a.distance - b.distance);
      const current = unvisited.shift()!;

      if (current.distance === Infinity) break;
      if (current.row === endPos[0] && current.col === endPos[1]) {
        const path = reconstructPath(current);
        await visualizePath(path);
        setStats({ visited: visitedCount, pathLength: path.length, time: Date.now() - startTime });
        return;
      }

      current.visited = true;
      if (current.type !== 'start' && current.type !== 'end') {
        current.type = 'visited';
        setGrid([...newGrid]);
        await sleep(50 - speed * 4);
      }
      visitedCount++;

      const neighbors = getNeighbors(current, newGrid);
      for (const neighbor of neighbors) {
        if (!neighbor.visited) {
          const newDistance = current.distance + 1;
          if (newDistance < neighbor.distance) {
            neighbor.distance = newDistance;
            neighbor.parent = current;
          }
        }
      }
    }

    setStats({ visited: visitedCount, pathLength: 0, time: Date.now() - startTime });
  };

  const runAStar = async () => {
    const startTime = Date.now();
    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
    const startCell = newGrid[startPos[0]][startPos[1]];
    const endCell = newGrid[endPos[0]][endPos[1]];
    
    startCell.distance = 0;
    startCell.heuristic = heuristic(startCell, endCell);
    
    const openSet: Cell[] = [startCell];
    let visitedCount = 0;

    while (openSet.length > 0) {
      if (pauseRef.current) {
        await new Promise(resolve => {
          const checkPause = setInterval(() => {
            if (!pauseRef.current) {
              clearInterval(checkPause);
              resolve(null);
            }
          }, 100);
        });
      }

      openSet.sort((a, b) => (a.distance + a.heuristic) - (b.distance + b.heuristic));
      const current = openSet.shift()!;

      if (current.row === endPos[0] && current.col === endPos[1]) {
        const path = reconstructPath(current);
        await visualizePath(path);
        setStats({ visited: visitedCount, pathLength: path.length, time: Date.now() - startTime });
        return;
      }

      current.visited = true;
      if (current.type !== 'start' && current.type !== 'end') {
        current.type = 'visited';
        setGrid([...newGrid]);
        await sleep(50 - speed * 4);
      }
      visitedCount++;

      const neighbors = getNeighbors(current, newGrid);
      for (const neighbor of neighbors) {
        if (!neighbor.visited) {
          const newDistance = current.distance + 1;
          if (newDistance < neighbor.distance) {
            neighbor.distance = newDistance;
            neighbor.heuristic = heuristic(neighbor, endCell);
            neighbor.parent = current;
            if (!openSet.includes(neighbor)) {
              openSet.push(neighbor);
            }
          }
        }
      }
    }

    setStats({ visited: visitedCount, pathLength: 0, time: Date.now() - startTime });
  };

  const runBFS = async () => {
    const startTime = Date.now();
    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
    const startCell = newGrid[startPos[0]][startPos[1]];
    const endCell = newGrid[endPos[0]][endPos[1]];
    
    const queue: Cell[] = [startCell];
    startCell.visited = true;
    let visitedCount = 0;

    while (queue.length > 0) {
      if (pauseRef.current) {
        await new Promise(resolve => {
          const checkPause = setInterval(() => {
            if (!pauseRef.current) {
              clearInterval(checkPause);
              resolve(null);
            }
          }, 100);
        });
      }

      const current = queue.shift()!;

      if (current.row === endPos[0] && current.col === endPos[1]) {
        const path = reconstructPath(current);
        await visualizePath(path);
        setStats({ visited: visitedCount, pathLength: path.length, time: Date.now() - startTime });
        return;
      }

      if (current.type !== 'start' && current.type !== 'end') {
        current.type = 'visited';
        setGrid([...newGrid]);
        await sleep(50 - speed * 4);
      }
      visitedCount++;

      const neighbors = getNeighbors(current, newGrid);
      for (const neighbor of neighbors) {
        if (!neighbor.visited) {
          neighbor.visited = true;
          neighbor.parent = current;
          queue.push(neighbor);
        }
      }
    }

    setStats({ visited: visitedCount, pathLength: 0, time: Date.now() - startTime });
  };

  const runDFS = async () => {
    const startTime = Date.now();
    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
    const startCell = newGrid[startPos[0]][startPos[1]];
    const endCell = newGrid[endPos[0]][endPos[1]];
    
    const stack: Cell[] = [startCell];
    let visitedCount = 0;

    while (stack.length > 0) {
      if (pauseRef.current) {
        await new Promise(resolve => {
          const checkPause = setInterval(() => {
            if (!pauseRef.current) {
              clearInterval(checkPause);
              resolve(null);
            }
          }, 100);
        });
      }

      const current = stack.pop()!;

      if (current.visited) continue;
      current.visited = true;

      if (current.row === endPos[0] && current.col === endPos[1]) {
        const path = reconstructPath(current);
        await visualizePath(path);
        setStats({ visited: visitedCount, pathLength: path.length, time: Date.now() - startTime });
        return;
      }

      if (current.type !== 'start' && current.type !== 'end') {
        current.type = 'visited';
        setGrid([...newGrid]);
        await sleep(50 - speed * 4);
      }
      visitedCount++;

      const neighbors = getNeighbors(current, newGrid);
      for (const neighbor of neighbors) {
        if (!neighbor.visited) {
          neighbor.parent = current;
          stack.push(neighbor);
        }
      }
    }

    setStats({ visited: visitedCount, pathLength: 0, time: Date.now() - startTime });
  };

  const handleStart = async () => {
    clearPath();
    setIsRunning(true);
    pauseRef.current = false;
    setIsPaused(false);

    switch (algorithm) {
      case 'dijkstra':
        await runDijkstra();
        break;
      case 'astar':
        await runAStar();
        break;
      case 'bfs':
        await runBFS();
        break;
      case 'dfs':
        await runDFS();
        break;
    }

    setIsRunning(false);
  };

  const handlePause = () => {
    pauseRef.current = !pauseRef.current;
    setIsPaused(!isPaused);
  };

  const getCellColor = (type: CellType): string => {
    switch (type) {
      case 'start': return 'bg-green-500';
      case 'end': return 'bg-red-500';
      case 'wall': return 'bg-gray-800 dark:bg-gray-900';
      case 'visited': return 'bg-blue-300 dark:bg-blue-700';
      case 'path': return 'bg-yellow-400';
      case 'current': return 'bg-purple-500';
      default: return 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600';
    }
  };

  const algorithmInfo: Record<Algorithm, { name: string; description: string; optimal: boolean }> = {
    dijkstra: {
      name: "Dijkstra's Algorithm",
      description: "Guarantees shortest path. Explores all directions equally.",
      optimal: true,
    },
    astar: {
      name: 'A* Search',
      description: 'Optimal and efficient. Uses heuristic to guide search toward goal.',
      optimal: true,
    },
    bfs: {
      name: 'Breadth-First Search',
      description: 'Guarantees shortest path. Explores level by level.',
      optimal: true,
    },
    dfs: {
      name: 'Depth-First Search',
      description: 'Does not guarantee shortest path. Explores as far as possible first.',
      optimal: false,
    },
  };

  return (
    <div className="h-full flex flex-col p-4 overflow-hidden bg-gray-50 dark:bg-gray-900">
      <h2 className="text-xl font-bold mb-3 dark:text-white">Pathfinding Visualizer</h2>
      
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Controls */}
        <div className="w-64 space-y-3 overflow-y-auto">
          {/* Algorithm Selection */}
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold mb-2 dark:text-white text-sm">Algorithm</h3>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value as Algorithm)}
              disabled={isRunning}
              className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="astar">A* Search</option>
              <option value="dijkstra">Dijkstra's</option>
              <option value="bfs">BFS</option>
              <option value="dfs">DFS</option>
            </select>
            <div className="mt-2 text-xs dark:text-gray-300">
              <p className="font-semibold">{algorithmInfo[algorithm].name}</p>
              <p className="mt-1">{algorithmInfo[algorithm].description}</p>
              <p className="mt-1">
                <span className={algorithmInfo[algorithm].optimal ? 'text-green-600' : 'text-orange-600'}>
                  {algorithmInfo[algorithm].optimal ? '✓ Optimal' : '⚠ Not Optimal'}
                </span>
              </p>
            </div>
          </div>

          {/* Draw Mode */}
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold mb-2 dark:text-white text-sm">Draw Mode</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDrawMode('wall')}
                disabled={isRunning}
                className={`p-2 rounded text-xs font-semibold transition-colors ${
                  drawMode === 'wall'
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 dark:text-white'
                }`}
              >
                Wall
              </button>
              <button
                onClick={() => setDrawMode('erase')}
                disabled={isRunning}
                className={`p-2 rounded text-xs font-semibold transition-colors ${
                  drawMode === 'erase'
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 dark:text-white'
                }`}
              >
                Erase
              </button>
              <button
                onClick={() => setDrawMode('start')}
                disabled={isRunning}
                className={`p-2 rounded text-xs font-semibold transition-colors flex items-center justify-center gap-1 ${
                  drawMode === 'start'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 dark:text-white'
                }`}
              >
                <MapPin className="h-3 w-3" /> Start
              </button>
              <button
                onClick={() => setDrawMode('end')}
                disabled={isRunning}
                className={`p-2 rounded text-xs font-semibold transition-colors flex items-center justify-center gap-1 ${
                  drawMode === 'end'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 dark:text-white'
                }`}
              >
                <Flag className="h-3 w-3" /> End
              </button>
            </div>
          </div>

          {/* Speed Control */}
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold mb-2 dark:text-white text-sm">Speed: {speed}/10</h3>
            <input
              type="range"
              min="1"
              max="10"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-full"
              disabled={isRunning}
            />
          </div>

          {/* Controls */}
          <div className="space-y-2">
            <button
              onClick={handleStart}
              disabled={isRunning}
              className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-semibold py-2 rounded-lg transition-colors text-sm"
            >
              <Play className="h-4 w-4" />
              Visualize
            </button>
            <button
              onClick={handlePause}
              disabled={!isRunning}
              className="w-full flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white font-semibold py-2 rounded-lg transition-colors text-sm"
            >
              <Pause className="h-4 w-4" />
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={clearPath}
              disabled={isRunning}
              className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-semibold py-2 rounded-lg transition-colors text-sm"
            >
              <RotateCcw className="h-4 w-4" />
              Clear Path
            </button>
            <button
              onClick={clearWalls}
              disabled={isRunning}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-semibold py-2 rounded-lg transition-colors text-sm"
            >
              <Trash2 className="h-4 w-4" />
              Clear Walls
            </button>
            <button
              onClick={initializeGrid}
              disabled={isRunning}
              className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-semibold py-2 rounded-lg transition-colors text-sm"
            >
              <Trash2 className="h-4 w-4" />
              Reset All
            </button>
          </div>

          {/* Stats */}
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <h3 className="font-semibold mb-2 dark:text-white text-sm">Statistics</h3>
            <div className="text-xs space-y-1 dark:text-gray-300">
              <p>Cells Visited: {stats.visited}</p>
              <p>Path Length: {stats.pathLength > 0 ? stats.pathLength : 'No path'}</p>
              <p>Time: {stats.time}ms</p>
            </div>
          </div>

          {/* Legend */}
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold mb-2 dark:text-white text-sm">Legend</h3>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="dark:text-gray-300">Start Node</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="dark:text-gray-300">End Node</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-800 rounded"></div>
                <span className="dark:text-gray-300">Wall</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-300 rounded"></div>
                <span className="dark:text-gray-300">Visited</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                <span className="dark:text-gray-300">Shortest Path</span>
              </div>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 flex items-center justify-center overflow-auto">
          <div
            className="inline-block border-2 border-gray-400 dark:border-gray-600"
            onMouseLeave={handleMouseUp}
          >
            {grid.map((row, rowIdx) => (
              <div key={rowIdx} className="flex">
                {row.map((cell, colIdx) => (
                  <div
                    key={`${rowIdx}-${colIdx}`}
                    className={`w-5 h-5 ${getCellColor(cell.type)} cursor-pointer transition-colors duration-100`}
                    onMouseDown={() => handleMouseDown(rowIdx, colIdx)}
                    onMouseEnter={() => handleMouseEnter(rowIdx, colIdx)}
                    onMouseUp={handleMouseUp}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
