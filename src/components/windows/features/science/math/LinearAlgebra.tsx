import React, { useState, useRef, useEffect } from 'react';
import { Grid3x3, Info } from 'lucide-react';

export const LinearAlgebra: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [matrix, setMatrix] = useState([[1, 0], [0, 1]]);
  const [showEigenvectors, setShowEigenvectors] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);

  // Derived values
  const a = matrix[0][0], b = matrix[0][1], c = matrix[1][0], d = matrix[1][1];
  const determinant = a * d - b * c;
  const trace = a + d;
  const discriminant = trace * trace - 4 * determinant;

  const eigenvalues: { real: boolean; v1: number; v2: number } = discriminant >= 0
    ? { real: true, v1: (trace + Math.sqrt(discriminant)) / 2, v2: (trace - Math.sqrt(discriminant)) / 2 }
    : { real: false, v1: trace / 2, v2: Math.sqrt(-discriminant) / 2 };

  const getEigenvector = (lambda: number): { x: number; y: number } | null => {
    if (Math.abs(b) > 1e-10) return { x: b, y: lambda - a };
    if (Math.abs(c) > 1e-10) return { x: lambda - d, y: c };
    if (Math.abs(a - lambda) < 1e-10) return { x: 1, y: 0 };
    if (Math.abs(d - lambda) < 1e-10) return { x: 0, y: 1 };
    return null;
  };

  const normalizeVec = (v: { x: number; y: number }) => {
    const len = Math.sqrt(v.x * v.x + v.y * v.y);
    return len > 0 ? { x: v.x / len, y: v.y / len } : v;
  };

  const inverseMatrix = Math.abs(determinant) > 1e-10
    ? [[d / determinant, -b / determinant], [-c / determinant, a / determinant]]
    : null;

  const classifyTransformation = (): string => {
    if (a === 1 && b === 0 && c === 0 && d === 1) return 'Identity';
    if (Math.abs(determinant) < 1e-10) return 'Singular (collapses space)';
    const isOrthogonal =
      Math.abs(a * a + c * c - 1) < 0.05 &&
      Math.abs(b * b + d * d - 1) < 0.05 &&
      Math.abs(a * b + c * d) < 0.05;
    if (isOrthogonal) return determinant > 0 ? 'Rotation' : 'Reflection';
    if (Math.abs(b) < 1e-10 && Math.abs(c) < 1e-10) return 'Scaling';
    if (Math.abs(a - 1) < 1e-10 && Math.abs(d - 1) < 1e-10) return 'Shear';
    return 'General linear';
  };

  const applyRotationPreset = (angleDeg: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    setMatrix([
      [parseFloat(Math.cos(rad).toFixed(4)), parseFloat((-Math.sin(rad)).toFixed(4))],
      [parseFloat(Math.sin(rad).toFixed(4)), parseFloat(Math.cos(rad).toFixed(4))]
    ]);
  };

  const vectors = [
    { x: 1, y: 0, color: '#ff6b6b' },
    { x: 0, y: 1, color: '#4ecdc4' },
    { x: 1, y: 1, color: '#ffe66d' }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    draw();
    const obs = new ResizeObserver(() => draw());
    obs.observe(canvas);
    return () => obs.disconnect();
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

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const isDark = document.documentElement.classList.contains('dark');
    ctx.fillStyle = isDark ? '#0a0e1a' : '#f8f9fa';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 50;

    // --- Transformed grid ---
    ctx.strokeStyle = isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    for (let i = -10; i <= 10; i++) {
      // Transformed vertical line at x=i
      ctx.beginPath();
      const tv1 = transformVector({ x: i, y: -10 });
      const tv2 = transformVector({ x: i, y: 10 });
      ctx.moveTo(centerX + tv1.x * scale, centerY - tv1.y * scale);
      ctx.lineTo(centerX + tv2.x * scale, centerY - tv2.y * scale);
      ctx.stroke();
      // Transformed horizontal line at y=i
      ctx.beginPath();
      const th1 = transformVector({ x: -10, y: i });
      const th2 = transformVector({ x: 10, y: i });
      ctx.moveTo(centerX + th1.x * scale, centerY - th1.y * scale);
      ctx.lineTo(centerX + th2.x * scale, centerY - th2.y * scale);
      ctx.stroke();
    }

    // --- Original grid ---
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([]);
    for (let i = -10; i <= 10; i++) {
      ctx.beginPath();
      ctx.moveTo(centerX + i * scale, 0);
      ctx.lineTo(centerX + i * scale, height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, centerY + i * scale);
      ctx.lineTo(width, centerY + i * scale);
      ctx.stroke();
    }

    // --- Axes ---
    ctx.strokeStyle = isDark ? '#888' : '#666';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    // --- Axis number labels ---
    ctx.fillStyle = isDark ? '#aaa' : '#555';
    ctx.font = '10px monospace';
    for (let i = -10; i <= 10; i++) {
      if (i === 0) continue;
      const px = centerX + i * scale;
      const py = centerY + i * scale;
      if (px > 10 && px < width - 10) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`${i}`, px, centerY + 4);
      }
      if (py > 10 && py < height - 10) {
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${-i}`, centerX - 6, py);
      }
    }

    // --- Unit circle (dashed, original) ---
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, scale, 0, Math.PI * 2);
    ctx.stroke();

    // --- Transformed unit circle (filled ellipse) ---
    ctx.strokeStyle = isDark ? 'rgba(129, 140, 248, 0.6)' : 'rgba(79, 70, 229, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    const steps = 120;
    for (let s = 0; s <= steps; s++) {
      const t = (s / steps) * Math.PI * 2;
      const pt = transformVector({ x: Math.cos(t), y: Math.sin(t) });
      const px = centerX + pt.x * scale;
      const py = centerY - pt.y * scale;
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = isDark ? 'rgba(129, 140, 248, 0.06)' : 'rgba(79, 70, 229, 0.05)';
    ctx.fill();
    ctx.stroke();

    // --- Determinant label on canvas ---
    const det = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
    ctx.fillStyle = isDark ? 'rgba(200,200,255,0.7)' : 'rgba(60,60,100,0.7)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`det = ${det.toFixed(3)}  (area \u00d7${Math.abs(det).toFixed(2)})`, 8, 8);

    // --- Draw original and transformed vectors ---
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

    // --- Eigenvectors ---
    if (showEigenvectors && eigenvalues.real) {
      [eigenvalues.v1, eigenvalues.v2].forEach((lam, idx) => {
        const ev = getEigenvector(lam);
        if (!ev) return;
        const nev = normalizeVec(ev);
        const evColor = idx === 0 ? '#f472b6' : '#34d399';
        const evLen = 3;
        ctx.strokeStyle = evColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.moveTo(centerX - nev.x * evLen * scale, centerY + nev.y * evLen * scale);
        ctx.lineTo(centerX + nev.x * evLen * scale, centerY - nev.y * evLen * scale);
        ctx.stroke();
        ctx.setLineDash([]);
        // Eigenvalue label
        ctx.fillStyle = evColor;
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(
          `\u03BB${idx + 1}=${lam.toFixed(2)}`,
          centerX + nev.x * (evLen - 0.5) * scale + 4,
          centerY - nev.y * (evLen - 0.5) * scale - 4
        );
      });
    }
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
            <canvas ref={canvasRef} className="w-full" style={{ height: 500 }} />
          </div>
        </div>

        <div className="w-80 space-y-4 overflow-y-auto max-h-full pr-1">
          {/* Matrix input */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3 text-gray-800 dark:text-white">Transformation Matrix</h3>
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
                    className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-center font-mono text-gray-800 dark:text-white"
                  />
                ))
              )}
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showEigenvectors}
                onChange={(e) => setShowEigenvectors(e.target.checked)}
                className="accent-indigo-500"
              />
              Show eigenvectors
            </label>
          </div>

          {/* Rotation angle slider */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3 text-gray-800 dark:text-white">Rotation Angle</h3>
            <input
              type="range"
              min="0"
              max="360"
              value={rotationAngle}
              onChange={(e) => {
                const angle = Number(e.target.value);
                setRotationAngle(angle);
                applyRotationPreset(angle);
              }}
              className="w-full accent-indigo-500"
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center font-mono">{rotationAngle}&deg;</div>
          </div>

          {/* Presets */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3 text-gray-800 dark:text-white">Presets</h3>
            <div className="grid grid-cols-2 gap-2">
              {presets.map(p => (
                <button
                  key={p.name}
                  onClick={() => setMatrix(p.m)}
                  className="p-2 text-sm bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 rounded hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Computed Properties */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3 text-gray-800 dark:text-white">Computed Properties</h3>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Determinant</span>
                <span className="text-gray-800 dark:text-white">{determinant.toFixed(4)}</span>
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 -mt-1 ml-1">
                Area scale: &times;{Math.abs(determinant).toFixed(2)}{determinant < 0 ? ' (flipped)' : ''}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Trace</span>
                <span className="text-gray-800 dark:text-white">{trace.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Type</span>
                <span className="text-indigo-600 dark:text-indigo-400">{classifyTransformation()}</span>
              </div>
              <hr className="border-gray-200 dark:border-gray-700" />
              <div>
                <span className="text-gray-500 dark:text-gray-400 text-xs">Eigenvalues</span>
                {eigenvalues.real ? (
                  <div className="text-gray-800 dark:text-white text-xs mt-0.5">
                    &lambda;&#8321; = {eigenvalues.v1.toFixed(4)}, &lambda;&#8322; = {eigenvalues.v2.toFixed(4)}
                  </div>
                ) : (
                  <div className="text-gray-800 dark:text-white text-xs mt-0.5">
                    {eigenvalues.v1.toFixed(3)} &plusmn; {eigenvalues.v2.toFixed(3)}i{' '}
                    <span className="text-gray-400">(complex)</span>
                  </div>
                )}
              </div>
              <hr className="border-gray-200 dark:border-gray-700" />
              <div>
                <span className="text-gray-500 dark:text-gray-400 text-xs">Inverse Matrix</span>
                {inverseMatrix ? (
                  <div className="grid grid-cols-2 gap-1 mt-1 text-xs text-gray-800 dark:text-white">
                    <span className="bg-gray-50 dark:bg-gray-700 p-1 rounded text-center">{inverseMatrix[0][0].toFixed(3)}</span>
                    <span className="bg-gray-50 dark:bg-gray-700 p-1 rounded text-center">{inverseMatrix[0][1].toFixed(3)}</span>
                    <span className="bg-gray-50 dark:bg-gray-700 p-1 rounded text-center">{inverseMatrix[1][0].toFixed(3)}</span>
                    <span className="bg-gray-50 dark:bg-gray-700 p-1 rounded text-center">{inverseMatrix[1][1].toFixed(3)}</span>
                  </div>
                ) : (
                  <div className="text-xs text-red-400 mt-1">Singular -- no inverse exists</div>
                )}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3 text-gray-800 dark:text-white">Legend</h3>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 border-t-2 border-dashed border-red-500"></div>
                <span>Original vectors</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 bg-red-500"></div>
                <span>Transformed vectors</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 border-t-2 border-dashed" style={{ borderColor: 'rgba(150,150,150,0.5)' }}></div>
                <span>Unit circle</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 border-t-2" style={{ borderColor: 'rgba(99,102,241,0.6)' }}></div>
                <span>Transformed shape</span>
              </div>
              {showEigenvectors && eigenvalues.real && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-0.5 border-t-2 border-dashed" style={{ borderColor: '#f472b6' }}></div>
                    <span>Eigenvector 1</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-0.5 border-t-2 border-dashed" style={{ borderColor: '#34d399' }}></div>
                    <span>Eigenvector 2</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Key Concepts */}
          <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-indigo-800 dark:text-indigo-300">
              <Info className="h-4 w-4" />
              Key Concepts
            </h3>
            <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
              <li>- Matrices transform vector spaces</li>
              <li>- Determinant = area scaling factor</li>
              <li>- Eigenvectors stay on their span</li>
              <li>- det &lt; 0 flips orientation</li>
              <li>- Singular matrices collapse dimensions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
