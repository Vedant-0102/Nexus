import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Download, Trash2, Undo2, Redo2, Paintbrush, Eraser, Grid3x3 } from 'lucide-react';

export const PixelArtEditor: React.FC = () => {
  const [width, setWidth] = useState(16);
  const [height, setHeight] = useState(16);
  const [pendingWidth, setPendingWidth] = useState(16);
  const [pendingHeight, setPendingHeight] = useState(16);
  const [color, setColor] = useState('#43a047');
  const [eraseMode, setEraseMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [grid, setGrid] = useState<string[][]>([]);
  const [history, setHistory] = useState<{ grid: string[][]; changes: [number, number, string][] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const strokeStartRef = useRef<{ row: number; col: number } | null>(null);
  const lastCellRef = useRef<{ row: number; col: number } | null>(null);

  // Predefined color palette
  const colorPalette = [
    '#43a047', '#e53935', '#1e88e5', '#fdd835', '#fb8c00',
    '#8e24aa', '#00acc1', '#f06292', '#000000', '#ffffff',
    '#795548', '#607d8b', '#4caf50', '#ff9800', '#9c27b0'
  ];

  // Initialize grid
  useEffect(() => {
    createGrid();
  }, []);

  const createGrid = () => {
    const newGrid = Array(pendingHeight).fill(null).map(() => 
      Array(pendingWidth).fill('#ffffff')
    );
    setGrid(newGrid);
    setWidth(pendingWidth);
    setHeight(pendingHeight);
    setHistory([{ grid: JSON.parse(JSON.stringify(newGrid)), changes: [] }]);
    setHistoryIndex(0);
  };

  const clearGrid = () => {
    const newGrid = Array(height).fill(null).map(() => 
      Array(width).fill('#ffffff')
    );
    setGrid(newGrid);
    setHistory([{ grid: JSON.parse(JSON.stringify(newGrid)), changes: [] }]);
    setHistoryIndex(0);
  };

  const handleCellClick = (row: number, col: number, isDrag = false) => {
    // Skip if this is the same cell as last time during a drag
    if (isDrag && lastCellRef.current && 
        lastCellRef.current.row === row && lastCellRef.current.col === col) {
      return;
    }

    const newGrid = [...grid];
    const previousColor = newGrid[row][col];
    newGrid[row][col] = eraseMode ? '#ffffff' : color;
    setGrid(newGrid);

    if (!isDrawing) {
      strokeStartRef.current = { row, col };
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({
        grid: JSON.parse(JSON.stringify(newGrid)),
        changes: [[row, col, previousColor]]
      });
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    } else {
      setHistory(prev => {
        const newHistory = [...prev];
        if (newHistory.length > 0) {
          const current = newHistory[historyIndex];
          current.changes.push([row, col, previousColor]);
          current.grid = JSON.parse(JSON.stringify(newGrid));
        }
        return newHistory;
      });
    }

    lastCellRef.current = { row, col };
  };

  const handleMouseDown = (row: number, col: number) => {
    setIsDrawing(true);
    lastCellRef.current = { row, col };
    handleCellClick(row, col);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    strokeStartRef.current = null;
    lastCellRef.current = null;
  };

  const handleMouseEnter = (row: number, col: number) => {
    if (isDrawing) {
      handleCellClick(row, col, true);
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setGrid(JSON.parse(JSON.stringify(prevState.grid)));
      setHistoryIndex(historyIndex - 1);
    } else {
      const blankGrid = Array(height).fill(null).map(() => 
        Array(width).fill('#ffffff')
      );
      setGrid(blankGrid);
      setHistory([{ grid: JSON.parse(JSON.stringify(blankGrid)), changes: [] }]);
      setHistoryIndex(0);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setGrid(JSON.parse(JSON.stringify(nextState.grid)));
      setHistoryIndex(historyIndex + 1);
    }
  };

  const downloadImage = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = 20;
    canvas.width = width * cellSize;
    canvas.height = height * cellSize;

    grid.forEach((row, rowIndex) => {
      row.forEach((cellColor, colIndex) => {
        ctx.fillStyle = cellColor;
        ctx.fillRect(colIndex * cellSize, rowIndex * cellSize, cellSize, cellSize);
      });
    });

    const link = document.createElement('a');
    link.download = 'pixel-art.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  const cellSize = Math.min(
    Math.floor(500 / Math.max(width, height)),
    30
  );

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <h1 className="text-2xl font-bold dark:text-white mb-6">Pixel Art Editor</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Canvas Area */}
        <Card className="md:col-span-2 p-6 dark:bg-gray-800">
          <div className="flex justify-center items-center">
            <div
              ref={containerRef}
              onMouseLeave={handleMouseUp}
              className="inline-block border-2 border-gray-300 dark:border-gray-600 rounded"
              style={{
                maxHeight: '525px',
                maxWidth: '525px',
                overflow: 'hidden',
                userSelect: 'none'
              }}
            >
              {grid.map((row, rowIndex) => (
                <div key={`row-${rowIndex}`} className="flex">
                  {row.map((cell, colIndex) => (
                    <div
                      key={`cell-${rowIndex}-${colIndex}`}
                      className="border border-gray-200 dark:border-gray-700 cursor-crosshair transition-all hover:opacity-80"
                      style={{
                        backgroundColor: cell,
                        width: `${cellSize}px`,
                        height: `${cellSize}px`
                      }}
                      onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                      onMouseUp={handleMouseUp}
                      onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        handleMouseDown(rowIndex, colIndex);
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        handleMouseUp();
                      }}
                      data-row={rowIndex}
                      data-col={colIndex}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Controls Panel */}
        <div className="space-y-4">
          {/* Grid Size Controls */}
          <Card className="p-4 dark:bg-gray-800">
            <h3 className="font-bold mb-3 dark:text-white flex items-center gap-2">
              <Grid3x3 className="h-4 w-4" />
              Grid Size
            </h3>
            
            <div className="space-y-3">
              <div>
                <Label>Width: {pendingWidth}</Label>
                <Slider
                  value={[pendingWidth]}
                  onValueChange={(v) => setPendingWidth(v[0])}
                  min={4}
                  max={35}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <Label>Height: {pendingHeight}</Label>
                <Slider
                  value={[pendingHeight]}
                  onValueChange={(v) => setPendingHeight(v[0])}
                  min={4}
                  max={35}
                  step={1}
                  className="w-full"
                />
              </div>

              <Button onClick={createGrid} className="w-full" variant="outline">
                <Grid3x3 className="h-4 w-4 mr-2" />
                Create Grid
              </Button>
            </div>
          </Card>

          {/* Drawing Tools */}
          <Card className="p-4 dark:bg-gray-800">
            <h3 className="font-bold mb-3 dark:text-white">Drawing Tools</h3>
            
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  onClick={() => setEraseMode(false)}
                  variant={!eraseMode ? 'default' : 'outline'}
                  className="flex-1"
                >
                  <Paintbrush className="h-4 w-4 mr-2" />
                  Paint
                </Button>
                <Button
                  onClick={() => setEraseMode(true)}
                  variant={eraseMode ? 'default' : 'outline'}
                  className="flex-1"
                >
                  <Eraser className="h-4 w-4 mr-2" />
                  Erase
                </Button>
              </div>

              <div>
                <Label>Current Color</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <div 
                    className="flex-1 h-10 rounded border-2 border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: color }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Color Palette */}
          <Card className="p-4 dark:bg-gray-800">
            <h3 className="font-bold mb-3 dark:text-white">Color Palette</h3>
            <div className="grid grid-cols-5 gap-2">
              {colorPalette.map((c) => (
                <button
                  key={c}
                  className={`w-full aspect-square rounded border-2 transition-all hover:scale-110 ${
                    color === c ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  title={c}
                />
              ))}
            </div>
          </Card>

          {/* Actions */}
          <Card className="p-4 dark:bg-gray-800">
            <h3 className="font-bold mb-3 dark:text-white">Actions</h3>
            
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  onClick={undo}
                  disabled={history.length <= 1 && historyIndex === 0}
                  variant="outline"
                  className="flex-1"
                >
                  <Undo2 className="h-4 w-4 mr-2" />
                  Undo
                </Button>
                <Button
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  variant="outline"
                  className="flex-1"
                >
                  <Redo2 className="h-4 w-4 mr-2" />
                  Redo
                </Button>
              </div>

              <Button onClick={clearGrid} variant="outline" className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Grid
              </Button>

              <Button onClick={downloadImage} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Save Image
              </Button>
            </div>
          </Card>

          {/* Info */}
          <Card className="p-4 dark:bg-gray-800">
            <h3 className="font-bold mb-2 text-sm dark:text-white">Tips</h3>
            <div className="text-xs dark:text-gray-300 space-y-1">
              <p>• Click and drag to draw</p>
              <p>• Use color picker or palette</p>
              <p>• Switch between paint/erase</p>
              <p>• Undo/Redo your changes</p>
              <p>• Save as PNG image</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
