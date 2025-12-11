import React, { useRef, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, Trash2, Download, Grid3x3, Palette } from 'lucide-react';

export const PixelArtEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gridSize, setGridSize] = useState(32);
  const [pixelSize, setPixelSize] = useState(16);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [isDrawing, setIsDrawing] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [pixels, setPixels] = useState<string[][]>([]);

  const colors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#FFC0CB', '#A52A2A', '#808080', '#FFD700', '#4B0082',
    '#FF69B4', '#00CED1', '#FF4500', '#2E8B57', '#DC143C'
  ];

  useEffect(() => {
    initializeGrid();
  }, [gridSize]);

  useEffect(() => {
    drawCanvas();
  }, [pixels, showGrid, selectedColor]);

  const initializeGrid = () => {
    const newPixels = Array(gridSize).fill(null).map(() => 
      Array(gridSize).fill('#FFFFFF')
    );
    setPixels(newPixels);
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = gridSize * pixelSize;
    canvas.height = gridSize * pixelSize;

    // Draw pixels
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        ctx.fillStyle = pixels[row]?.[col] || '#FFFFFF';
        ctx.fillRect(col * pixelSize, row * pixelSize, pixelSize, pixelSize);
      }
    }

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = '#CCCCCC';
      ctx.lineWidth = 1;
      for (let i = 0; i <= gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(i * pixelSize, 0);
        ctx.lineTo(i * pixelSize, gridSize * pixelSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * pixelSize);
        ctx.lineTo(gridSize * pixelSize, i * pixelSize);
        ctx.stroke();
      }
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / pixelSize);
    const y = Math.floor((e.clientY - rect.top) / pixelSize);

    if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
      const newPixels = [...pixels];
      newPixels[y][x] = selectedColor;
      setPixels(newPixels);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    handleCanvasClick(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDrawing) {
      handleCanvasClick(e);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    initializeGrid();
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a temporary canvas without grid
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = gridSize * pixelSize;
    tempCanvas.height = gridSize * pixelSize;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Draw pixels only
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        tempCtx.fillStyle = pixels[row][col];
        tempCtx.fillRect(col * pixelSize, row * pixelSize, pixelSize, pixelSize);
      }
    }

    const link = document.createElement('a');
    link.download = `pixel-art-${Date.now()}.png`;
    link.href = tempCanvas.toDataURL();
    link.click();
  };

  return (
    <div className="h-full w-full bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl">
            <Grid3x3 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold dark:text-white">Pixel Art Editor</h1>
            <p className="text-gray-600 dark:text-gray-400">Create retro pixel art</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-4">
          <Card className="lg:col-span-3 p-4 dark:bg-gray-800">
            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="border-2 border-gray-300 dark:border-gray-600 rounded cursor-crosshair"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="p-4 dark:bg-gray-800">
              <h3 className="font-bold mb-3 dark:text-white flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Colors
              </h3>
              <div className="grid grid-cols-5 gap-2 mb-3">
                {colors.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded border-2 transition-transform hover:scale-110 ${
                      selectedColor === color ? 'border-blue-500 scale-110' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-full h-10 rounded cursor-pointer"
              />
            </Card>

            <Card className="p-4 dark:bg-gray-800">
              <h3 className="font-bold mb-3 dark:text-white">Grid Size</h3>
              <select
                value={gridSize}
                onChange={(e) => setGridSize(parseInt(e.target.value))}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
              >
                <option value="16">16x16</option>
                <option value="32">32x32</option>
                <option value="64">64x64</option>
              </select>
            </Card>

            <Card className="p-4 dark:bg-gray-800">
              <h3 className="font-bold mb-3 dark:text-white">Options</h3>
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm dark:text-white">Show Grid</span>
              </label>
            </Card>

            <Card className="p-4 dark:bg-gray-800">
              <h3 className="font-bold mb-3 dark:text-white">Actions</h3>
              <div className="space-y-2">
                <Button onClick={downloadImage} className="w-full" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button onClick={clearCanvas} variant="outline" className="w-full" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </Card>

            <Card className="p-4 dark:bg-gray-800">
              <h3 className="font-bold mb-2 dark:text-white text-sm">Tips</h3>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Click to draw single pixels</li>
                <li>• Click and drag to draw</li>
                <li>• Use custom color picker</li>
                <li>• Download as PNG image</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
