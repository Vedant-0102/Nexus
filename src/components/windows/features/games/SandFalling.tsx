import React, { useRef, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Palette } from 'lucide-react';

export const SandFalling = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [brushSize, setBrushSize] = useState(3);
  const [hueValue, setHueValue] = useState(200);
  const gridRef = useRef<number[][]>([]);
  const velocityGridRef = useRef<number[][]>([]);
  const animationRef = useRef<number>();
  const isDrawingRef = useRef(false);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const hueRef = useRef(200);
  const brushSizeRef = useRef(3);

  const CELL_SIZE = 5;
  const WIDTH = 600;
  const HEIGHT = 500;
  const COLS = WIDTH / CELL_SIZE;
  const ROWS = HEIGHT / CELL_SIZE;
  const GRAVITY = 0.1;

  const make2DArray = (cols: number, rows: number, fillValue: number = 0): number[][] => {
    return Array.from({ length: cols }, () => Array.from({ length: rows }, () => fillValue));
  };

  const withinBounds = (i: number, j: number): boolean => {
    return i >= 0 && i < COLS && j >= 0 && j < ROWS;
  };

  useEffect(() => {
    gridRef.current = make2DArray(COLS, ROWS, 0);
    velocityGridRef.current = make2DArray(COLS, ROWS, 1);

    const animate = () => {
      // Continuously add sand while mouse is held down
      if (isDrawingRef.current) {
        const pos = mousePositionRef.current;
        addSand(pos.x, pos.y);
      }
      updateAndDraw();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const updateAndDraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const grid = gridRef.current;
    const velocityGrid = velocityGridRef.current;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Draw current grid
    for (let i = 0; i < COLS; i++) {
      for (let j = 0; j < ROWS; j++) {
        if (grid[i][j] > 0) {
          const hue = grid[i][j];
          ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
          ctx.fillRect(i * CELL_SIZE, j * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      }
    }

    // Create next grid
    const nextGrid = make2DArray(COLS, ROWS, 0);
    const nextVelocityGrid = make2DArray(COLS, ROWS, 0);

    // Update physics from bottom to top
    for (let j = ROWS - 1; j >= 0; j--) {
      for (let i = 0; i < COLS; i++) {
        const state = grid[i][j];
        const velocity = velocityGrid[i][j];

        if (state > 0) {
          const newY = Math.min(j + Math.ceil(velocity), ROWS - 1);
          let targetY = newY;

          // Find first empty spot
          while (targetY > j && grid[i][targetY] !== 0) {
            targetY--;
          }

          if (targetY !== j) {
            // Move down
            nextGrid[i][targetY] = state;
            nextVelocityGrid[i][targetY] = velocity + GRAVITY;
          } else {
            // Can't move down, try diagonal
            const dir = Math.random() < 0.5 ? -1 : 1;
            const sideA = withinBounds(i + dir, j + 1) && grid[i + dir][j + 1] === 0;
            const sideB = withinBounds(i - dir, j + 1) && grid[i - dir][j + 1] === 0;

            if (sideA) {
              nextGrid[i + dir][j + 1] = state;
              nextVelocityGrid[i + dir][j + 1] = velocity + GRAVITY;
            } else if (sideB) {
              nextGrid[i - dir][j + 1] = state;
              nextVelocityGrid[i - dir][j + 1] = velocity + GRAVITY;
            } else {
              // Stay in place
              nextGrid[i][j] = state;
              nextVelocityGrid[i][j] = velocity;
            }
          }
        }
      }
    }

    gridRef.current = nextGrid;
    velocityGridRef.current = nextVelocityGrid;
  };

  const getMousePosition = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    const pos = getMousePosition(e);
    mousePositionRef.current = pos;
    addSand(pos.x, pos.y);
  };

  const handleMouseUp = () => {
    isDrawingRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePosition(e);
    mousePositionRef.current = pos;
    
    if (isDrawingRef.current) {
      addSand(pos.x, pos.y);
    }
  };

  const addSand = (mouseX: number, mouseY: number) => {
    const mouseCol = Math.floor(mouseX / CELL_SIZE);
    const mouseRow = Math.floor(mouseY / CELL_SIZE);

    const grid = gridRef.current;
    const velocityGrid = velocityGridRef.current;

    const radius = brushSizeRef.current;
    for (let i = -radius; i <= radius; i++) {
      for (let j = -radius; j <= radius; j++) {
        const col = mouseCol + i;
        const row = mouseRow + j;

        const distance = Math.sqrt(i * i + j * j);
        if (distance <= radius && withinBounds(col, row) && grid[col][row] === 0) {
          if (Math.random() < 0.75) {
            grid[col][row] = hueRef.current;
            velocityGrid[col][row] = 1;
          }
        }
      }
    }

    hueRef.current = (hueRef.current + 0.5) % 360;
    setHueValue(hueRef.current);
  };

  const clearGrid = () => {
    gridRef.current = make2DArray(COLS, ROWS, 0);
    velocityGridRef.current = make2DArray(COLS, ROWS, 1);
  };

  return (
    <div className="h-full w-full bg-gradient-to-br from-gray-900 to-black p-6 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-1">Sand Falling Simulator</h1>
          <p className="text-gray-400">Click and drag to create colorful sand particles</p>
        </div>

        <div className="flex gap-4">
          <Card className="flex-1 p-4 bg-gray-800 border-gray-700">
            <canvas
              ref={canvasRef}
              width={WIDTH}
              height={HEIGHT}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="w-full border-4 border-gray-700 rounded cursor-crosshair bg-black"
              style={{ imageRendering: 'pixelated' }}
            />
          </Card>

          <div className="w-64 space-y-4">
            <Card className="p-4 bg-gray-800 border-gray-700">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Brush Size
              </h3>
              <input
                type="range"
                min="1"
                max="10"
                value={brushSize}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setBrushSize(val);
                  brushSizeRef.current = val;
                }}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-400 mt-2">
                <span>Size: {brushSize}</span>
                <span>Hue: {Math.round(hueValue)}°</span>
              </div>
            </Card>

            <Button onClick={clearGrid} variant="outline" className="w-full bg-red-900/20 hover:bg-red-900/40 border-red-700 text-red-300">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Canvas
            </Button>

            <Card className="p-4 bg-gray-800 border-gray-700">
              <h3 className="font-bold text-white mb-2 text-sm">Physics Features</h3>
              <div className="text-xs text-gray-400 space-y-2">
                <p>✨ Realistic gravity simulation</p>
                <p>🌈 Rainbow color cycling</p>
                <p>⚡ Velocity-based falling</p>
                <p>🏔️ Natural pile formation</p>
                <p>🎯 Precise mouse tracking</p>
              </div>
            </Card>

            <Card className="p-4 bg-gray-800 border-gray-700">
              <h3 className="font-bold text-white mb-2 text-sm">Controls</h3>
              <div className="text-xs text-gray-400 space-y-1">
                <p>• <strong>Click & Drag:</strong> Create sand</p>
                <p>• <strong>Slider:</strong> Adjust brush size</p>
                <p>• <strong>Clear:</strong> Reset canvas</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
