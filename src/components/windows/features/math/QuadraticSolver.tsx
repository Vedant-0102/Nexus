import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
export const QuadraticSolver = () => {
  const [quadA, setQuadA] = useState(1);
  const [quadB, setQuadB] = useState(-3);
  const [quadC, setQuadC] = useState(2);
  const [quadResults, setQuadResults] = useState<any>(null);

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

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <h1 className="text-2xl font-bold dark:text-white mb-6">Quadratic Equation Solver</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 dark:bg-gray-800">
          <h3 className="text-xl font-bold mb-4 dark:text-white">Input</h3>
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
    </div>
  );
};
