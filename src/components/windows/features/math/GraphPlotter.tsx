import { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Download, ZoomIn, ZoomOut, RotateCcw, Grid3x3 } from 'lucide-react';

export const GraphPlotter = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [graphEquation, setGraphEquation] = useState('x^2');
  const [xMin, setXMin] = useState(-10);
  const [xMax, setXMax] = useState(10);
  const [yMin, setYMin] = useState(-10);
  const [yMax, setYMax] = useState(10);
  const [showGrid, setShowGrid] = useState(true);
  const [error, setError] = useState('');
  const [autoScale, setAutoScale] = useState(true);

  const evaluateExpression = useCallback((expr: string, x: number): number => {
    try {
      let processedExpr = expr.toLowerCase().replace(/\s/g, '');

      // Handle implicit multiplication
      processedExpr = processedExpr.replace(/(\d)([a-z])/g, '$1*$2');
      processedExpr = processedExpr.replace(/\)(\d)/g, ')*$1');
      processedExpr = processedExpr.replace(/\)([a-z])/g, ')*$1');

      // Replace operators
      processedExpr = processedExpr.replace(/\^/g, '**');

      // Replace function names BEFORE replacing x to avoid mangling 'exp' etc.
      processedExpr = processedExpr.replace(/sqrt/g, 'Math.sqrt');
      processedExpr = processedExpr.replace(/sin/g, 'Math.sin');
      processedExpr = processedExpr.replace(/cos/g, 'Math.cos');
      processedExpr = processedExpr.replace(/tan/g, 'Math.tan');
      processedExpr = processedExpr.replace(/abs/g, 'Math.abs');
      processedExpr = processedExpr.replace(/log/g, 'Math.log');
      processedExpr = processedExpr.replace(/ln/g, 'Math.log');
      processedExpr = processedExpr.replace(/exp/g, 'Math.exp');
      processedExpr = processedExpr.replace(/pi/g, 'Math.PI');
      processedExpr = processedExpr.replace(/e(?![a-z])/g, 'Math.E');

      // NOW replace x with its value (function names are already safe)
      processedExpr = processedExpr.replace(/x/g, `(${x})`);

      return eval(processedExpr);
    } catch (err) {
      throw new Error('Invalid expression');
    }
  }, []);

  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Calculate ranges
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;
    
    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 0.5;
      
      const xStep = Math.pow(10, Math.floor(Math.log10(xRange / 10)));
      const yStep = Math.pow(10, Math.floor(Math.log10(yRange / 10)));
      
      for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
        const px = ((x - xMin) / xRange) * width;
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, height);
        ctx.stroke();
      }
      
      for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
        const py = height - ((y - yMin) / yRange) * height;
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(width, py);
        ctx.stroke();
      }
    }

    // Draw axes
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    
    // X-axis
    if (yMin <= 0 && yMax >= 0) {
      const yZero = height - ((0 - yMin) / yRange) * height;
      ctx.beginPath();
      ctx.moveTo(0, yZero);
      ctx.lineTo(width, yZero);
      ctx.stroke();
      
      // X-axis labels
      ctx.fillStyle = '#000000';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      const xStep = Math.pow(10, Math.floor(Math.log10(xRange / 10)));
      for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
        if (Math.abs(x) > 0.001) {
          const px = ((x - xMin) / xRange) * width;
          ctx.fillText(x.toFixed(1), px, yZero + 15);
        }
      }
    }
    
    // Y-axis
    if (xMin <= 0 && xMax >= 0) {
      const xZero = ((0 - xMin) / xRange) * width;
      ctx.beginPath();
      ctx.moveTo(xZero, 0);
      ctx.lineTo(xZero, height);
      ctx.stroke();
      
      // Y-axis labels
      ctx.textAlign = 'right';
      const yStep = Math.pow(10, Math.floor(Math.log10(yRange / 10)));
      for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
        if (Math.abs(y) > 0.001) {
          const py = height - ((y - yMin) / yRange) * height;
          ctx.fillText(y.toFixed(1), xZero - 5, py + 3);
        }
      }
    }

    // Draw function
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    let firstPoint = true;
    let minY = Infinity;
    let maxY = -Infinity;

    for (let px = 0; px < width; px++) {
      const x = xMin + (px / width) * xRange;
      
      try {
        const y = evaluateExpression(graphEquation, x);
        
        if (isNaN(y) || !isFinite(y)) continue;
        
        if (autoScale) {
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }

        const py = height - ((y - yMin) / yRange) * height;

        if (py < -10 || py > height + 10) {
          firstPoint = true;
          continue;
        }

        if (firstPoint) {
          ctx.moveTo(px, py);
          firstPoint = false;
        } else {
          ctx.lineTo(px, py);
        }
      } catch {
        firstPoint = true;
        continue;
      }
    }

    ctx.stroke();
    
    // Auto-scale Y axis if enabled
    if (autoScale && isFinite(minY) && isFinite(maxY) && minY !== maxY) {
      const padding = (maxY - minY) * 0.1;
      if (Math.abs(yMin - (minY - padding)) > 0.1 || Math.abs(yMax - (maxY + padding)) > 0.1) {
        setYMin(minY - padding);
        setYMax(maxY + padding);
      }
    }

    setError('');
  }, [graphEquation, xMin, xMax, yMin, yMax, showGrid, autoScale, evaluateExpression]);

  useEffect(() => {
    try {
      drawGraph();
    } catch (err) {
      setError('Error drawing graph. Check your function.');
    }
  }, [drawGraph]);

  const resetView = () => {
    setXMin(-10);
    setXMax(10);
    setYMin(-10);
    setYMax(10);
    setAutoScale(true);
  };

  const zoomIn = () => {
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;
    setXMin(xMin + xRange * 0.1);
    setXMax(xMax - xRange * 0.1);
    setYMin(yMin + yRange * 0.1);
    setYMax(yMax - yRange * 0.1);
    setAutoScale(false);
  };

  const zoomOut = () => {
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;
    setXMin(xMin - xRange * 0.1);
    setXMax(xMax + xRange * 0.1);
    setYMin(yMin - yRange * 0.1);
    setYMax(yMax + yRange * 0.1);
    setAutoScale(false);
  };

  const downloadGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `graph-${graphEquation.replace(/[^a-z0-9]/gi, '_')}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const examples = [
    { expr: 'x^2', name: 'Parabola' },
    { expr: 'sin(x)', name: 'Sine' },
    { expr: 'cos(x)', name: 'Cosine' },
    { expr: 'tan(x)', name: 'Tangent' },
    { expr: 'x^3 - 2*x', name: 'Cubic' },
    { expr: '1/x', name: 'Hyperbola' },
    { expr: 'sqrt(x)', name: 'Square Root' },
    { expr: 'abs(x)', name: 'Absolute' },
    { expr: 'exp(x)', name: 'Exponential' },
    { expr: 'log(x)', name: 'Logarithm' },
  ];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <h1 className="text-2xl font-bold dark:text-white mb-6">Function Grapher</h1>

      <Card className="p-6 dark:bg-gray-800 mb-4">
        <div className="grid md:grid-cols-4 gap-4 mb-4">
          <div className="md:col-span-2">
            <Label>Function f(x)</Label>
            <Input
              value={graphEquation}
              onChange={(e) => setGraphEquation(e.target.value)}
              placeholder="e.g., x^2, sin(x), x^3-2*x"
              className="font-mono"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Supported: +, -, *, /, ^, sin, cos, tan, sqrt, abs, log, ln, exp, pi, e
            </p>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
          <div>
            <Label>X Min</Label>
            <Input
              type="number"
              value={xMin}
              onChange={(e) => {
                setXMin(parseFloat(e.target.value) || -10);
                setAutoScale(false);
              }}
              step="0.1"
            />
          </div>
          <div>
            <Label>X Max</Label>
            <Input
              type="number"
              value={xMax}
              onChange={(e) => {
                setXMax(parseFloat(e.target.value) || 10);
                setAutoScale(false);
              }}
              step="0.1"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-4">
          <div>
            <Label>Y Min</Label>
            <Input
              type="number"
              value={yMin.toFixed(2)}
              onChange={(e) => {
                setYMin(parseFloat(e.target.value) || -10);
                setAutoScale(false);
              }}
              step="0.1"
              disabled={autoScale}
            />
          </div>
          <div>
            <Label>Y Max</Label>
            <Input
              type="number"
              value={yMax.toFixed(2)}
              onChange={(e) => {
                setYMax(parseFloat(e.target.value) || 10);
                setAutoScale(false);
              }}
              step="0.1"
              disabled={autoScale}
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoScale}
                onChange={(e) => setAutoScale(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm dark:text-white">Auto Y Scale</span>
            </label>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm dark:text-white">Show Grid</span>
            </label>
          </div>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          <Button onClick={zoomIn} size="sm" variant="outline">
            <ZoomIn className="h-4 w-4 mr-2" />
            Zoom In
          </Button>
          <Button onClick={zoomOut} size="sm" variant="outline">
            <ZoomOut className="h-4 w-4 mr-2" />
            Zoom Out
          </Button>
          <Button onClick={resetView} size="sm" variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={() => setShowGrid(!showGrid)} size="sm" variant="outline">
            <Grid3x3 className="h-4 w-4 mr-2" />
            Grid
          </Button>
          <Button onClick={downloadGraph} size="sm" variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
        
        <div className="flex justify-center bg-white dark:bg-gray-900 rounded-lg p-4">
          <canvas
            ref={canvasRef}
            className="border-2 border-gray-300 dark:border-gray-600 rounded max-w-full"
            style={{ width: '100%', height: '500px' }}
          />
        </div>
      </Card>

      <Card className="p-4 dark:bg-gray-800">
        <h3 className="font-semibold mb-3 dark:text-white">Quick Examples</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {examples.map((ex) => (
            <Button
              key={ex.expr}
              onClick={() => setGraphEquation(ex.expr)}
              size="sm"
              variant="outline"
              className="text-xs"
            >
              {ex.name}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
};
