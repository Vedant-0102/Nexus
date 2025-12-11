import React, { useState, useRef, useEffect } from 'react';
import { Brush, Eraser, Square, Circle, Palette, Save, Trash2, Undo, Redo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const Paint = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState<'brush' | 'eraser' | 'rectangle' | 'circle'>('brush');
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [showCursorGuide, setShowCursorGuide] = useState(true);

  const colors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#FFC0CB', '#A52A2A', '#808080', '#FFD700', '#4B0082'
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveToHistory(ctx);
    }
  }, []);

  const saveToHistory = (ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(imageData);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setStartPos({ x, y });
    setIsDrawing(true);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (tool === 'brush' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCursorPos({ x, y });

    if (!isDrawing) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (tool === 'brush') {
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (tool === 'eraser') {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = brushSize * 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'rectangle') {
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.strokeRect(startPos.x, startPos.y, x - startPos.x, y - startPos.y);
    } else if (tool === 'circle') {
      const radiusX = Math.abs(x - startPos.x) / 2;
      const radiusY = Math.abs(y - startPos.y) / 2;
      const centerX = startPos.x + (x - startPos.x) / 2;
      const centerY = startPos.y + (y - startPos.y) / 2;
      
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      ctx.stroke();
    }

    setIsDrawing(false);
    saveToHistory(ctx);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveToHistory(ctx);
  };

  const undo = () => {
    if (historyStep > 0) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const newStep = historyStep - 1;
      ctx.putImageData(history[newStep], 0, 0);
      setHistoryStep(newStep);
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const newStep = historyStep + 1;
      ctx.putImageData(history[newStep], 0, 0);
      setHistoryStep(newStep);
    }
  };

  const saveImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `paint-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="h-full w-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-6xl mx-auto space-y-4">

        <Card className="p-4 dark:bg-gray-800 shadow-sm">
          {/* Toolbar */}
          <div className="flex flex-wrap gap-4 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            {/* Tools */}
            <div className="flex gap-2">
              <Button
                variant={tool === 'brush' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('brush')}
              >
                <Brush className="h-4 w-4 mr-2" />
                Brush
              </Button>
              <Button
                variant={tool === 'eraser' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('eraser')}
              >
                <Eraser className="h-4 w-4 mr-2" />
                Eraser
              </Button>
              <Button
                variant={tool === 'rectangle' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('rectangle')}
              >
                <Square className="h-4 w-4 mr-2" />
                Rectangle
              </Button>
              <Button
                variant={tool === 'circle' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('circle')}
              >
                <Circle className="h-4 w-4 mr-2" />
                Circle
              </Button>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={undo} disabled={historyStep <= 0}>
                <Undo className="h-4 w-4 mr-2" />
                Undo
              </Button>
              <Button variant="outline" size="sm" onClick={redo} disabled={historyStep >= history.length - 1}>
                <Redo className="h-4 w-4 mr-2" />
                Redo
              </Button>
              <Button variant="outline" size="sm" onClick={clearCanvas}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
              <Button variant="outline" size="sm" onClick={saveImage}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>

          {/* Color Palette */}
          <div className="flex items-center gap-4 mb-4">
            <span className="text-sm font-medium dark:text-white">Color:</span>
            <div className="flex gap-2 flex-wrap">
              {colors.map((c) => (
                <button
                  key={c}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    color === c ? 'border-blue-500 scale-110' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded-full cursor-pointer"
              />
            </div>
          </div>

          {/* Brush Size */}
          <div className="flex items-center gap-4 mb-4">
            <span className="text-sm font-medium dark:text-white">Size:</span>
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-48"
            />
            <span className="text-sm dark:text-white">{brushSize}px</span>
            
            <label className="flex items-center gap-2 ml-4 cursor-pointer">
              <input
                type="checkbox"
                checked={showCursorGuide}
                onChange={(e) => setShowCursorGuide(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm dark:text-white">Cursor Guide</span>
            </label>
          </div>

          {/* Canvas */}
          <div className="border-2 border-gray-300 dark:border-gray-600 rounded overflow-hidden bg-white shadow-inner relative">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={() => setIsDrawing(false)}
              className="cursor-crosshair"
            />
            
            {/* Cursor Guide */}
            {showCursorGuide && (
              <>
                <div 
                  className="absolute border-t border-gray-400 pointer-events-none"
                  style={{ 
                    left: 0, 
                    right: 0,
                    top: cursorPos.y,
                    borderStyle: 'dashed',
                    opacity: 0.5
                  }}
                />
                <div 
                  className="absolute border-l border-gray-400 pointer-events-none"
                  style={{ 
                    top: 0, 
                    bottom: 0,
                    left: cursorPos.x,
                    borderStyle: 'dashed',
                    opacity: 0.5
                  }}
                />
                <div 
                  className="absolute bg-black text-white text-xs px-2 py-1 rounded pointer-events-none"
                  style={{ 
                    top: cursorPos.y + 10,
                    left: cursorPos.x + 10,
                  }}
                >
                  {Math.round(cursorPos.x)}, {Math.round(cursorPos.y)}
                </div>
              </>
            )}
          </div>
        </Card>
        </div>
      </div>
    </div>
  );
};
