import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
export const LinearSystemSolver = () => {
  const [a11, setA11] = useState(2);
  const [a12, setA12] = useState(1);
  const [b1, setB1] = useState(5);
  const [a21, setA21] = useState(1);
  const [a22, setA22] = useState(-1);
  const [b2, setB2] = useState(1);
  const [linearResult, setLinearResult] = useState<any>(null);

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

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <h1 className="text-2xl font-bold dark:text-white mb-6">Linear System Solver</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 dark:bg-gray-800">
          <h3 className="text-xl font-bold mb-4 dark:text-white">System of Equations (2×2)</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Solve system of linear equations
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
    </div>
  );
};
