import React, { useState, useRef, useEffect } from 'react';
import { Grid3x3, Info } from 'lucide-react';

export const LinearAlgebra: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [matrix, setMatrix] = useState([[1, 0], [0, 1]]);
  const [showEigenvectors, setShowEigenvectors] = useState(false);

  const vectors = [
    { x: 1, y: 0, color: '#ff6b6b' },
    { x: 0, y: 1, color: '#4ecdc4' },
    { x: 1, y: 1, color: '#ffe66d' }
  ];

  useEffect(() => {
    draw();
  }, [matrix, showEigenvectors]);

  const transformVector = (v: { x: number; y: number }) => {
    return {
      x: matrix[0][0] * v.x + matrix[0][1] * v.y,
      y: matrix[1][0] * v.x + matrix[1][1] * v.y
    };
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = 50;

    // Grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = -10; i <= 10; i++) {
      ctx.beginPath();
      ctx.moveTo(centerX + i * scale, 0);
      ctx.lineTo(centerX + i * scale, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, centerY + i * scale);
      ctx.lineTo(canvas.width, centerY + i * scale);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, canvas.height);
    ctx.stroke();

    // Draw original and transformed vectors
    vectors.forEach(v => {
      const transformed = transformVector(v);

      // Original vector (dashed)
      ctx.strokeStyle = v.color;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + v.x * scale, centerY - v.y * scale);
      ctx.stroke();

      // Transformed vector (solid)
      ctx.setLineDash([]);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + transformed.x * scale, centerY - transformed.y * scale);
      ctx.stroke();

      // Arrow head
      const angle = Math.atan2(-transformed.y, transformed.x);
      const headLen = 10;
      ctx.beginPath();
      ctx.moveTo(centerX + transformed.x * scale, centerY - transformed.y * scale);
      ctx.lineTo(
        centerX + transformed.x * scale - headLen * Math.cos(angle - Math.PI / 6),
        centerY - transformed.y * scale + headLen * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(centerX + transformed.x * scale, centerY - transformed.y * scale);
      ctx.lineTo(
        centerX + transformed.x * scale - headLen * Math.cos(angle + Math.PI / 6),
        centerY - transformed.y * scale + headLen * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
    });
  };

  const presets = [
    { name: 'Identity', m: [[1, 0], [0, 1]] },
    { name: 'Rotation 90°', m: [[0, -1], [1, 0]] },
    { name: 'Scale 2x', m: [[2, 0], [0, 2]] },
    { name: 'Shear', m: [[1, 1], [0, 1]] },
    { name: 'Reflection', m: [[1, 0], [0, -1]] },
    { name: 'Projection', m: [[1, 0], [0, 0]] }
  ];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Grid3x3 className="h-6 w-6 text-indigo-600" />
          Linear Algebra Visualizer
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Matrix transformations and vector spaces
        </p>
      </div>

      <div className="flex-1 flex gap-6">
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
            <canvas ref={canvasRef} width={600} height={500} className="w-full" />
          </div>
        </div>

        <div className="w-80 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Transformation Matrix</h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {matrix.map((row, i) =>
                row.map((val, j) => (
                  <input
                    key={`${i}-${j}`}
                    type="number"
                    step="0.1"
                    value={val}
                    onChange={(e) => {
                      const newMatrix = matrix.map(r => [...r]);
                      newMatrix[i][j] = Number(e.target.value);
                      setMatrix(newMatrix);
                    }}
                    className="p-2 border rounded dark:bg-gray-700 text-center"
                  />
                ))
              )}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Determinant: {(matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0]).toFixed(2)}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Presets</h3>
            <div className="grid grid-cols-2 gap-2">
              {presets.map(p => (
                <button
                  key={p.name}
                  onClick={() => setMatrix(p.m)}
                  className="p-2 text-sm bg-indigo-100 dark:bg-indigo-900/30 rounded hover:bg-indigo-200"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Legend</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 border-t-2 border-dashed border-red-500"></div>
                <span>Original vectors</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 bg-red-500"></div>
                <span>Transformed vectors</span>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-indigo-800 dark:text-indigo-300">
              <Info className="h-4 w-4" />
              Key Concepts
            </h3>
            <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
              <li>• Matrices transform vector spaces</li>
              <li>• Determinant = area scaling factor</li>
              <li>• Identity matrix preserves vectors</li>
              <li>• Rotation preserves lengths</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
