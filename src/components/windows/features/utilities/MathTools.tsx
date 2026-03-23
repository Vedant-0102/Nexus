import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, TrendingUp, Grid3x3, Sigma, PieChart, Binary } from 'lucide-react';

export const MathTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState('quadratic');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Quadratic Equation State
  const [quadA, setQuadA] = useState(1);
  const [quadB, setQuadB] = useState(-3);
  const [quadC, setQuadC] = useState(2);
  const [quadResults, setQuadResults] = useState<any>(null);

  // Linear Equation State (2x2 system)
  const [a11, setA11] = useState(2);
  const [a12, setA12] = useState(1);
  const [b1, setB1] = useState(5);
  const [a21, setA21] = useState(1);
  const [a22, setA22] = useState(-1);
  const [b2, setB2] = useState(1);
  const [linearResult, setLinearResult] = useState<any>(null);

  // Matrix State (2x2)
  const [m11, setM11] = useState(1);
  const [m12, setM12] = useState(2);
  const [m21, setM21] = useState(3);
  const [m22, setM22] = useState(4);
  const [matrixResult, setMatrixResult] = useState<any>(null);

  // Graph State
  const [graphEquation, setGraphEquation] = useState('x^2');
  const [xMin, setXMin] = useState(-10);
  const [xMax, setXMax] = useState(10);

  // Statistics State
  const [dataSet, setDataSet] = useState('1, 2, 3, 4, 5');
  const [statsResult, setStatsResult] = useState<any>(null);

  // Solve Quadratic Equation
  const solveQuadratic = () => {
    const discriminant = quadB * quadB - 4 * quadA * quadC;
    
    if (discriminant > 0) {
      const x1 = (-quadB + Math.sqrt(discriminant)) / (2 * quadA);
      const x2 = (-quadB - Math.sqrt(discriminant)) / (2 * quadA);
      setQuadResults({
        type: 'Two Real Roots',
        x1: x1.toFixed(4),
        x2: x2.toFixed(4),
        discriminant: discriminant.toFixed(4),
        vertex: {
          x: (-quadB / (2 * quadA)).toFixed(4),
          y: (quadA * Math.pow(-quadB / (2 * quadA), 2) + quadB * (-quadB / (2 * quadA)) + quadC).toFixed(4)
        }
      });
    } else if (discriminant === 0) {
      const x = -quadB / (2 * quadA);
      setQuadResults({
        type: 'One Real Root',
        x1: x.toFixed(4),
        discriminant: 0,
        vertex: {
          x: x.toFixed(4),
          y: quadC.toFixed(4)
        }
      });
    } else {
      const realPart = (-quadB / (2 * quadA)).toFixed(4);
      const imagPart = (Math.sqrt(-discriminant) / (2 * quadA)).toFixed(4);
      setQuadResults({
        type: 'Complex Roots',
        x1: `${realPart} + ${imagPart}i`,
        x2: `${realPart} - ${imagPart}i`,
        discriminant: discriminant.toFixed(4)
      });
    }
  };

  // Solve Linear System (2x2)
  const solveLinearSystem = () => {
    const det = a11 * a22 - a12 * a21;
    
    if (det === 0) {
      setLinearResult({ error: 'No unique solution (determinant = 0)' });
    } else {
      const x = (b1 * a22 - b2 * a12) / det;
      const y = (a11 * b2 - a21 * b1) / det;
      setLinearResult({
        x: x.toFixed(4),
        y: y.toFixed(4),
        determinant: det.toFixed(4)
      });
    }
  };

  // Matrix Operations
  const calculateMatrix = () => {
    const det = m11 * m22 - m12 * m21;
    const trace = m11 + m22;
    
    let inverse = null;
    if (det !== 0) {
      inverse = {
        i11: (m22 / det).toFixed(4),
        i12: (-m12 / det).toFixed(4),
        i21: (-m21 / det).toFixed(4),
        i22: (m11 / det).toFixed(4)
      };
    }
    
    setMatrixResult({
      determinant: det.toFixed(4),
      trace: trace.toFixed(4),
      inverse: inverse
    });
  };

  // Calculate Statistics
  const calculateStats = () => {
    const numbers = dataSet.split(',').map(n => parseFloat(n.trim())).filter(n => !isNaN(n));
    
    if (numbers.length === 0) {
      setStatsResult({ error: 'Invalid data' });
      return;
    }
    
    const sum = numbers.reduce((a, b) => a + b, 0);
    const mean = sum / numbers.length;
    const sorted = [...numbers].sort((a, b) => a - b);
    const median = numbers.length % 2 === 0
      ? (sorted[numbers.length / 2 - 1] + sorted[numbers.length / 2]) / 2
      : sorted[Math.floor(numbers.length / 2)];
    
    const variance = numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;
    const stdDev = Math.sqrt(variance);
    
    setStatsResult({
      count: numbers.length,
      sum: sum.toFixed(4),
      mean: mean.toFixed(4),
      median: median.toFixed(4),
      min: Math.min(...numbers).toFixed(4),
      max: Math.max(...numbers).toFixed(4),
      range: (Math.max(...numbers) - Math.min(...numbers)).toFixed(4),
      variance: variance.toFixed(4),
      stdDev: stdDev.toFixed(4)
    });
  };

  // Draw Graph
  useEffect(() => {
    if (activeTab === 'graph') {
      drawGraph();
    }
  }, [activeTab, graphEquation, xMin, xMax]);

  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 400;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 20; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 30, 0);
      ctx.lineTo(i * 30, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * 20);
      ctx.lineTo(canvas.width, i * 20);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();

    // Draw function
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.beginPath();

    const step = (xMax - xMin) / canvas.width;
    let firstPoint = true;

    for (let px = 0; px < canvas.width; px++) {
      const x = xMin + px * step;
      let y;

      try {
        // Simple expression evaluator
        y = evaluateExpression(graphEquation, x);
      } catch {
        continue;
      }

      if (isNaN(y) || !isFinite(y)) continue;

      const py = canvas.height / 2 - (y * 20);

      if (py < 0 || py > canvas.height) continue;

      if (firstPoint) {
        ctx.moveTo(px, py);
        firstPoint = false;
      } else {
        ctx.lineTo(px, py);
      }
    }

    ctx.stroke();
  };

  const evaluateExpression = (expr: string, x: number): number => {
    // Simple expression evaluator
    expr = expr.toLowerCase().replace(/\s/g, '');
    expr = expr.replace(/\^/g, '**');
    expr = expr.replace(/x/g, `(${x})`);
    
    // Add Math functions
    expr = expr.replace(/sin/g, 'Math.sin');
    expr = expr.replace(/cos/g, 'Math.cos');
    expr = expr.replace(/tan/g, 'Math.tan');
    expr = expr.replace(/sqrt/g, 'Math.sqrt');
    expr = expr.replace(/abs/g, 'Math.abs');
    expr = expr.replace(/log/g, 'Math.log');
    
    return eval(expr);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Math Tools</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">Comprehensive mathematical toolkit</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="quadratic">
            <Calculator className="h-4 w-4 mr-2" />
            Quadratic
          </TabsTrigger>
          <TabsTrigger value="linear">
            <Sigma className="h-4 w-4 mr-2" />
            Linear System
          </TabsTrigger>
          <TabsTrigger value="matrix">
            <Grid3x3 className="h-4 w-4 mr-2" />
            Matrix
          </TabsTrigger>
          <TabsTrigger value="graph">
            <TrendingUp className="h-4 w-4 mr-2" />
            Graph
          </TabsTrigger>
          <TabsTrigger value="stats">
            <PieChart className="h-4 w-4 mr-2" />
            Statistics
          </TabsTrigger>
        </TabsList>

        {/* Quadratic Equation Solver */}
        <TabsContent value="quadratic" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-xl font-bold mb-4 dark:text-white">Quadratic Equation Solver</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Solve: ax² + bx + c = 0
              </p>
              
              <div className="space-y-4">
                <div>
                  <Label>Coefficient a</Label>
                  <Input
                    type="number"
                    value={quadA}
                    onChange={(e) => setQuadA(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Coefficient b</Label>
                  <Input
                    type="number"
                    value={quadB}
                    onChange={(e) => setQuadB(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Coefficient c</Label>
                  <Input
                    type="number"
                    value={quadC}
                    onChange={(e) => setQuadC(parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <Button onClick={solveQuadratic} className="w-full">
                  Solve Equation
                </Button>
              </div>
            </Card>

            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-xl font-bold mb-4 dark:text-white">Results</h3>
              {quadResults ? (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded">
                    <p className="font-semibold text-blue-900 dark:text-blue-300">
                      {quadResults.type}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="dark:text-white"><strong>x₁:</strong> {quadResults.x1}</p>
                    {quadResults.x2 && <p className="dark:text-white"><strong>x₂:</strong> {quadResults.x2}</p>}
                    <p className="dark:text-white"><strong>Discriminant:</strong> {quadResults.discriminant}</p>
                    {quadResults.vertex && (
                      <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/30 rounded">
                        <p className="font-semibold dark:text-white">Vertex:</p>
                        <p className="dark:text-white">({quadResults.vertex.x}, {quadResults.vertex.y})</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Enter coefficients and click solve</p>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Linear System Solver */}
        <TabsContent value="linear" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-xl font-bold mb-4 dark:text-white">Linear System Solver (2×2)</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Solve system of equations
              </p>
              
              <div className="space-y-4">
                <div>
                  <Label>Equation 1: a₁₁x + a₁₂y = b₁</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <Input type="number" value={a11} onChange={(e) => setA11(parseFloat(e.target.value) || 0)} placeholder="a₁₁" />
                    <Input type="number" value={a12} onChange={(e) => setA12(parseFloat(e.target.value) || 0)} placeholder="a₁₂" />
                    <Input type="number" value={b1} onChange={(e) => setB1(parseFloat(e.target.value) || 0)} placeholder="b₁" />
                  </div>
                </div>
                
                <div>
                  <Label>Equation 2: a₂₁x + a₂₂y = b₂</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <Input type="number" value={a21} onChange={(e) => setA21(parseFloat(e.target.value) || 0)} placeholder="a₂₁" />
                    <Input type="number" value={a22} onChange={(e) => setA22(parseFloat(e.target.value) || 0)} placeholder="a₂₂" />
                    <Input type="number" value={b2} onChange={(e) => setB2(parseFloat(e.target.value) || 0)} placeholder="b₂" />
                  </div>
                </div>
                
                <Button onClick={solveLinearSystem} className="w-full">
                  Solve System
                </Button>
              </div>
            </Card>

            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-xl font-bold mb-4 dark:text-white">Solution</h3>
              {linearResult ? (
                linearResult.error ? (
                  <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded">
                    <p className="text-red-900 dark:text-red-300">{linearResult.error}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded">
                      <p className="font-semibold text-green-900 dark:text-green-300">Solution Found!</p>
                    </div>
                    <p className="dark:text-white text-lg"><strong>x =</strong> {linearResult.x}</p>
                    <p className="dark:text-white text-lg"><strong>y =</strong> {linearResult.y}</p>
                    <p className="dark:text-white text-sm"><strong>Determinant:</strong> {linearResult.determinant}</p>
                  </div>
                )
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Enter equations and click solve</p>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Matrix Calculator */}
        <TabsContent value="matrix" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-xl font-bold mb-4 dark:text-white">Matrix Calculator (2×2)</h3>
              
              <div className="space-y-4">
                <div>
                  <Label>Matrix Elements</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <Input type="number" value={m11} onChange={(e) => setM11(parseFloat(e.target.value) || 0)} placeholder="m₁₁" />
                    <Input type="number" value={m12} onChange={(e) => setM12(parseFloat(e.target.value) || 0)} placeholder="m₁₂" />
                    <Input type="number" value={m21} onChange={(e) => setM21(parseFloat(e.target.value) || 0)} placeholder="m₂₁" />
                    <Input type="number" value={m22} onChange={(e) => setM22(parseFloat(e.target.value) || 0)} placeholder="m₂₂" />
                  </div>
                </div>
                
                <Button onClick={calculateMatrix} className="w-full">
                  Calculate
                </Button>
              </div>
            </Card>

            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-xl font-bold mb-4 dark:text-white">Results</h3>
              {matrixResult ? (
                <div className="space-y-4">
                  <div>
                    <p className="dark:text-white"><strong>Determinant:</strong> {matrixResult.determinant}</p>
                    <p className="dark:text-white"><strong>Trace:</strong> {matrixResult.trace}</p>
                  </div>
                  
                  {matrixResult.inverse ? (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded">
                      <p className="font-semibold mb-2 dark:text-white">Inverse Matrix:</p>
                      <div className="grid grid-cols-2 gap-2 font-mono text-sm dark:text-white">
                        <span>{matrixResult.inverse.i11}</span>
                        <span>{matrixResult.inverse.i12}</span>
                        <span>{matrixResult.inverse.i21}</span>
                        <span>{matrixResult.inverse.i22}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded">
                      <p className="text-yellow-900 dark:text-yellow-300">Matrix is singular (no inverse)</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Enter matrix and click calculate</p>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Graph Plotter */}
        <TabsContent value="graph" className="mt-4">
          <Card className="p-6 dark:bg-gray-800">
            <h3 className="text-xl font-bold mb-4 dark:text-white">Function Grapher</h3>
            
            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <div className="md:col-span-2">
                <Label>Function (use x as variable)</Label>
                <Input
                  value={graphEquation}
                  onChange={(e) => setGraphEquation(e.target.value)}
                  placeholder="e.g., x^2, sin(x), x^3-2*x"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported: +, -, *, /, ^, sin, cos, tan, sqrt, abs, log
                </p>
              </div>
              <div>
                <Label>X Min</Label>
                <Input
                  type="number"
                  value={xMin}
                  onChange={(e) => setXMin(parseFloat(e.target.value) || -10)}
                />
              </div>
              <div>
                <Label>X Max</Label>
                <Input
                  type="number"
                  value={xMax}
                  onChange={(e) => setXMax(parseFloat(e.target.value) || 10)}
                />
              </div>
            </div>
            
            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                className="border-2 border-gray-300 dark:border-gray-600 rounded"
                style={{ maxWidth: '100%' }}
              />
            </div>
          </Card>
        </TabsContent>

        {/* Statistics Calculator */}
        <TabsContent value="stats" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-xl font-bold mb-4 dark:text-white">Statistics Calculator</h3>
              
              <div className="space-y-4">
                <div>
                  <Label>Data Set (comma-separated)</Label>
                  <Input
                    value={dataSet}
                    onChange={(e) => setDataSet(e.target.value)}
                    placeholder="1, 2, 3, 4, 5"
                  />
                </div>
                
                <Button onClick={calculateStats} className="w-full">
                  Calculate Statistics
                </Button>
              </div>
            </Card>

            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-xl font-bold mb-4 dark:text-white">Results</h3>
              {statsResult ? (
                statsResult.error ? (
                  <p className="text-red-500">{statsResult.error}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Count</p>
                      <p className="text-lg font-bold dark:text-white">{statsResult.count}</p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Sum</p>
                      <p className="text-lg font-bold dark:text-white">{statsResult.sum}</p>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Mean</p>
                      <p className="text-lg font-bold dark:text-white">{statsResult.mean}</p>
                    </div>
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Median</p>
                      <p className="text-lg font-bold dark:text-white">{statsResult.median}</p>
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Min</p>
                      <p className="text-lg font-bold dark:text-white">{statsResult.min}</p>
                    </div>
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Max</p>
                      <p className="text-lg font-bold dark:text-white">{statsResult.max}</p>
                    </div>
                    <div className="p-3 bg-pink-50 dark:bg-pink-900/30 rounded">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Range</p>
                      <p className="text-lg font-bold dark:text-white">{statsResult.range}</p>
                    </div>
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Std Dev</p>
                      <p className="text-lg font-bold dark:text-white">{statsResult.stdDev}</p>
                    </div>
                  </div>
                )
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Enter data and click calculate</p>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
