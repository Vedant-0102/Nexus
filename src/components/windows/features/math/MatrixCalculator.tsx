import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const MatrixCalculator = () => {
  const [matrixSize, setMatrixSize] = useState<'2x2' | '3x3'>('2x2');
  
  // 2x2 Matrix
  const [m2_11, setM2_11] = useState(1);
  const [m2_12, setM2_12] = useState(2);
  const [m2_21, setM2_21] = useState(3);
  const [m2_22, setM2_22] = useState(4);
  
  // 3x3 Matrix
  const [m3_11, setM3_11] = useState(1);
  const [m3_12, setM3_12] = useState(2);
  const [m3_13, setM3_13] = useState(3);
  const [m3_21, setM3_21] = useState(0);
  const [m3_22, setM3_22] = useState(1);
  const [m3_23, setM3_23] = useState(4);
  const [m3_31, setM3_31] = useState(5);
  const [m3_32, setM3_32] = useState(6);
  const [m3_33, setM3_33] = useState(0);
  
  // Second matrix for operations
  const [n2_11, setN2_11] = useState(1);
  const [n2_12, setN2_12] = useState(0);
  const [n2_21, setN2_21] = useState(0);
  const [n2_22, setN2_22] = useState(1);
  
  const [n3_11, setN3_11] = useState(1);
  const [n3_12, setN3_12] = useState(0);
  const [n3_13, setN3_13] = useState(0);
  const [n3_21, setN3_21] = useState(0);
  const [n3_22, setN3_22] = useState(1);
  const [n3_23, setN3_23] = useState(0);
  const [n3_31, setN3_31] = useState(0);
  const [n3_32, setN3_32] = useState(0);
  const [n3_33, setN3_33] = useState(1);
  
  const [result, setResult] = useState<any>(null);

  const calculate2x2 = () => {
    const det = m2_11 * m2_22 - m2_12 * m2_21;
    const trace = m2_11 + m2_22;
    
    let inverse = null;
    if (det !== 0) {
      inverse = [
        [(m2_22 / det).toFixed(4), (-m2_12 / det).toFixed(4)],
        [(-m2_21 / det).toFixed(4), (m2_11 / det).toFixed(4)]
      ];
    }
    
    const transpose = [
      [m2_11, m2_21],
      [m2_12, m2_22]
    ];
    
    setResult({
      determinant: det.toFixed(4),
      trace: trace.toFixed(4),
      inverse,
      transpose,
      eigenvalues: calculateEigenvalues2x2(m2_11, m2_12, m2_21, m2_22)
    });
  };

  const calculate3x3 = () => {
    const det = 
      m3_11 * (m3_22 * m3_33 - m3_23 * m3_32) -
      m3_12 * (m3_21 * m3_33 - m3_23 * m3_31) +
      m3_13 * (m3_21 * m3_32 - m3_22 * m3_31);
    
    const trace = m3_11 + m3_22 + m3_33;
    
    let inverse = null;
    if (det !== 0) {
      // Calculate cofactor matrix
      const c11 = m3_22 * m3_33 - m3_23 * m3_32;
      const c12 = -(m3_21 * m3_33 - m3_23 * m3_31);
      const c13 = m3_21 * m3_32 - m3_22 * m3_31;
      const c21 = -(m3_12 * m3_33 - m3_13 * m3_32);
      const c22 = m3_11 * m3_33 - m3_13 * m3_31;
      const c23 = -(m3_11 * m3_32 - m3_12 * m3_31);
      const c31 = m3_12 * m3_23 - m3_13 * m3_22;
      const c32 = -(m3_11 * m3_23 - m3_13 * m3_21);
      const c33 = m3_11 * m3_22 - m3_12 * m3_21;
      
      inverse = [
        [(c11 / det).toFixed(4), (c21 / det).toFixed(4), (c31 / det).toFixed(4)],
        [(c12 / det).toFixed(4), (c22 / det).toFixed(4), (c32 / det).toFixed(4)],
        [(c13 / det).toFixed(4), (c23 / det).toFixed(4), (c33 / det).toFixed(4)]
      ];
    }
    
    const transpose = [
      [m3_11, m3_21, m3_31],
      [m3_12, m3_22, m3_32],
      [m3_13, m3_23, m3_33]
    ];
    
    setResult({
      determinant: det.toFixed(4),
      trace: trace.toFixed(4),
      inverse,
      transpose
    });
  };

  const calculateEigenvalues2x2 = (a: number, b: number, c: number, d: number) => {
    const trace = a + d;
    const det = a * d - b * c;
    const discriminant = trace * trace - 4 * det;
    
    if (discriminant >= 0) {
      const lambda1 = (trace + Math.sqrt(discriminant)) / 2;
      const lambda2 = (trace - Math.sqrt(discriminant)) / 2;
      return [lambda1.toFixed(4), lambda2.toFixed(4)];
    } else {
      const real = (trace / 2).toFixed(4);
      const imag = (Math.sqrt(-discriminant) / 2).toFixed(4);
      return [`${real} + ${imag}i`, `${real} - ${imag}i`];
    }
  };

  const multiplyMatrices2x2 = () => {
    const result = [
      [
        m2_11 * n2_11 + m2_12 * n2_21,
        m2_11 * n2_12 + m2_12 * n2_22
      ],
      [
        m2_21 * n2_11 + m2_22 * n2_21,
        m2_21 * n2_12 + m2_22 * n2_22
      ]
    ];
    
    setResult({
      operation: 'multiplication',
      result: result.map(row => row.map(val => val.toFixed(4)))
    });
  };

  const multiplyMatrices3x3 = () => {
    const result = [
      [
        m3_11 * n3_11 + m3_12 * n3_21 + m3_13 * n3_31,
        m3_11 * n3_12 + m3_12 * n3_22 + m3_13 * n3_32,
        m3_11 * n3_13 + m3_12 * n3_23 + m3_13 * n3_33
      ],
      [
        m3_21 * n3_11 + m3_22 * n3_21 + m3_23 * n3_31,
        m3_21 * n3_12 + m3_22 * n3_22 + m3_23 * n3_32,
        m3_21 * n3_13 + m3_22 * n3_23 + m3_23 * n3_33
      ],
      [
        m3_31 * n3_11 + m3_32 * n3_21 + m3_33 * n3_31,
        m3_31 * n3_12 + m3_32 * n3_22 + m3_33 * n3_32,
        m3_31 * n3_13 + m3_32 * n3_23 + m3_33 * n3_33
      ]
    ];
    
    setResult({
      operation: 'multiplication',
      result: result.map(row => row.map(val => val.toFixed(4)))
    });
  };

  const addMatrices2x2 = () => {
    const result = [
      [m2_11 + n2_11, m2_12 + n2_12],
      [m2_21 + n2_21, m2_22 + n2_22]
    ];
    
    setResult({
      operation: 'addition',
      result: result.map(row => row.map(val => val.toFixed(4)))
    });
  };

  const addMatrices3x3 = () => {
    const result = [
      [m3_11 + n3_11, m3_12 + n3_12, m3_13 + n3_13],
      [m3_21 + n3_21, m3_22 + n3_22, m3_23 + n3_23],
      [m3_31 + n3_31, m3_32 + n3_32, m3_33 + n3_33]
    ];
    
    setResult({
      operation: 'addition',
      result: result.map(row => row.map(val => val.toFixed(4)))
    });
  };

  const subtractMatrices2x2 = () => {
    const result = [
      [m2_11 - n2_11, m2_12 - n2_12],
      [m2_21 - n2_21, m2_22 - n2_22]
    ];
    
    setResult({
      operation: 'subtraction',
      result: result.map(row => row.map(val => val.toFixed(4)))
    });
  };

  const subtractMatrices2x2Reverse = () => {
    const result = [
      [n2_11 - m2_11, n2_12 - m2_12],
      [n2_21 - m2_21, n2_22 - m2_22]
    ];
    
    setResult({
      operation: 'subtraction-reverse',
      result: result.map(row => row.map(val => val.toFixed(4)))
    });
  };

  const subtractMatrices3x3 = () => {
    const result = [
      [m3_11 - n3_11, m3_12 - n3_12, m3_13 - n3_13],
      [m3_21 - n3_21, m3_22 - n3_22, m3_23 - n3_23],
      [m3_31 - n3_31, m3_32 - n3_32, m3_33 - n3_33]
    ];
    
    setResult({
      operation: 'subtraction',
      result: result.map(row => row.map(val => val.toFixed(4)))
    });
  };

  const subtractMatrices3x3Reverse = () => {
    const result = [
      [n3_11 - m3_11, n3_12 - m3_12, n3_13 - m3_13],
      [n3_21 - m3_21, n3_22 - m3_22, n3_23 - m3_23],
      [n3_31 - m3_31, n3_32 - m3_32, n3_33 - m3_33]
    ];
    
    setResult({
      operation: 'subtraction-reverse',
      result: result.map(row => row.map(val => val.toFixed(4)))
    });
  };

  const multiplyMatrices2x2Reverse = () => {
    const result = [
      [
        n2_11 * m2_11 + n2_12 * m2_21,
        n2_11 * m2_12 + n2_12 * m2_22
      ],
      [
        n2_21 * m2_11 + n2_22 * m2_21,
        n2_21 * m2_12 + n2_22 * m2_22
      ]
    ];
    
    setResult({
      operation: 'multiplication-reverse',
      result: result.map(row => row.map(val => val.toFixed(4)))
    });
  };

  const multiplyMatrices3x3Reverse = () => {
    const result = [
      [
        n3_11 * m3_11 + n3_12 * m3_21 + n3_13 * m3_31,
        n3_11 * m3_12 + n3_12 * m3_22 + n3_13 * m3_32,
        n3_11 * m3_13 + n3_12 * m3_23 + n3_13 * m3_33
      ],
      [
        n3_21 * m3_11 + n3_22 * m3_21 + n3_23 * m3_31,
        n3_21 * m3_12 + n3_22 * m3_22 + n3_23 * m3_32,
        n3_21 * m3_13 + n3_22 * m3_23 + n3_23 * m3_33
      ],
      [
        n3_31 * m3_11 + n3_32 * m3_21 + n3_33 * m3_31,
        n3_31 * m3_12 + n3_32 * m3_22 + n3_33 * m3_32,
        n3_31 * m3_13 + n3_32 * m3_23 + n3_33 * m3_33
      ]
    ];
    
    setResult({
      operation: 'multiplication-reverse',
      result: result.map(row => row.map(val => val.toFixed(4)))
    });
  };

  const powerMatrix2x2 = (power: number, matrix: 'A' | 'B' = 'A') => {
    const a11 = matrix === 'A' ? m2_11 : n2_11;
    const a12 = matrix === 'A' ? m2_12 : n2_12;
    const a21 = matrix === 'A' ? m2_21 : n2_21;
    const a22 = matrix === 'A' ? m2_22 : n2_22;
    
    if (power === 2) {
      const result = [
        [
          a11 * a11 + a12 * a21,
          a11 * a12 + a12 * a22
        ],
        [
          a21 * a11 + a22 * a21,
          a21 * a12 + a22 * a22
        ]
      ];
      setResult({
        operation: `power-${power}-${matrix}`,
        result: result.map(row => row.map(val => val.toFixed(4)))
      });
    } else if (power === 3) {
      // First calculate M^2
      const m2 = [
        [
          a11 * a11 + a12 * a21,
          a11 * a12 + a12 * a22
        ],
        [
          a21 * a11 + a22 * a21,
          a21 * a12 + a22 * a22
        ]
      ];
      // Then multiply M^2 * M
      const result = [
        [
          m2[0][0] * a11 + m2[0][1] * a21,
          m2[0][0] * a12 + m2[0][1] * a22
        ],
        [
          m2[1][0] * a11 + m2[1][1] * a21,
          m2[1][0] * a12 + m2[1][1] * a22
        ]
      ];
      setResult({
        operation: `power-${power}-${matrix}`,
        result: result.map(row => row.map(val => val.toFixed(4)))
      });
    }
  };

  const powerMatrix3x3 = (power: number, matrix: 'A' | 'B' = 'A') => {
    const a11 = matrix === 'A' ? m3_11 : n3_11;
    const a12 = matrix === 'A' ? m3_12 : n3_12;
    const a13 = matrix === 'A' ? m3_13 : n3_13;
    const a21 = matrix === 'A' ? m3_21 : n3_21;
    const a22 = matrix === 'A' ? m3_22 : n3_22;
    const a23 = matrix === 'A' ? m3_23 : n3_23;
    const a31 = matrix === 'A' ? m3_31 : n3_31;
    const a32 = matrix === 'A' ? m3_32 : n3_32;
    const a33 = matrix === 'A' ? m3_33 : n3_33;
    
    if (power === 2) {
      const result = [
        [
          a11 * a11 + a12 * a21 + a13 * a31,
          a11 * a12 + a12 * a22 + a13 * a32,
          a11 * a13 + a12 * a23 + a13 * a33
        ],
        [
          a21 * a11 + a22 * a21 + a23 * a31,
          a21 * a12 + a22 * a22 + a23 * a32,
          a21 * a13 + a22 * a23 + a23 * a33
        ],
        [
          a31 * a11 + a32 * a21 + a33 * a31,
          a31 * a12 + a32 * a22 + a33 * a32,
          a31 * a13 + a32 * a23 + a33 * a33
        ]
      ];
      setResult({
        operation: `power-${power}-${matrix}`,
        result: result.map(row => row.map(val => val.toFixed(4)))
      });
    } else if (power === 3) {
      // First calculate M^2
      const m2 = [
        [
          a11 * a11 + a12 * a21 + a13 * a31,
          a11 * a12 + a12 * a22 + a13 * a32,
          a11 * a13 + a12 * a23 + a13 * a33
        ],
        [
          a21 * a11 + a22 * a21 + a23 * a31,
          a21 * a12 + a22 * a22 + a23 * a32,
          a21 * a13 + a22 * a23 + a23 * a33
        ],
        [
          a31 * a11 + a32 * a21 + a33 * a31,
          a31 * a12 + a32 * a22 + a33 * a32,
          a31 * a13 + a32 * a23 + a33 * a33
        ]
      ];
      // Then multiply M^2 * M
      const result = [
        [
          m2[0][0] * a11 + m2[0][1] * a21 + m2[0][2] * a31,
          m2[0][0] * a12 + m2[0][1] * a22 + m2[0][2] * a32,
          m2[0][0] * a13 + m2[0][1] * a23 + m2[0][2] * a33
        ],
        [
          m2[1][0] * a11 + m2[1][1] * a21 + m2[1][2] * a31,
          m2[1][0] * a12 + m2[1][1] * a22 + m2[1][2] * a32,
          m2[1][0] * a13 + m2[1][1] * a23 + m2[1][2] * a33
        ],
        [
          m2[2][0] * a11 + m2[2][1] * a21 + m2[2][2] * a31,
          m2[2][0] * a12 + m2[2][1] * a22 + m2[2][2] * a32,
          m2[2][0] * a13 + m2[2][1] * a23 + m2[2][2] * a33
        ]
      ];
      setResult({
        operation: `power-${power}-${matrix}`,
        result: result.map(row => row.map(val => val.toFixed(4)))
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <h1 className="text-2xl font-bold dark:text-white mb-6">Matrix Calculator</h1>

      <Tabs defaultValue="properties" className="flex-1">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="properties" className="mt-4">
          <div className="mb-4">
            <Label>Matrix Size</Label>
            <div className="flex gap-2 mt-2">
              <Button
                variant={matrixSize === '2x2' ? 'default' : 'outline'}
                onClick={() => setMatrixSize('2x2')}
              >
                2×2
              </Button>
              <Button
                variant={matrixSize === '3x3' ? 'default' : 'outline'}
                onClick={() => setMatrixSize('3x3')}
              >
                3×3
              </Button>
            </div>
          </div>

          {matrixSize === '2x2' ? (
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 dark:bg-gray-800">
                <h3 className="text-xl font-bold mb-4 dark:text-white">Matrix (2×2)</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Input type="number" value={m2_11} onChange={(e) => setM2_11(parseFloat(e.target.value) || 0)} />
                    <Input type="number" value={m2_12} onChange={(e) => setM2_12(parseFloat(e.target.value) || 0)} />
                    <Input type="number" value={m2_21} onChange={(e) => setM2_21(parseFloat(e.target.value) || 0)} />
                    <Input type="number" value={m2_22} onChange={(e) => setM2_22(parseFloat(e.target.value) || 0)} />
                  </div>
                  
                  <Button onClick={calculate2x2} className="w-full">
                    Calculate Properties
                  </Button>
                </div>
              </Card>

              <Card className="p-6 dark:bg-gray-800">
                <h3 className="text-xl font-bold mb-4 dark:text-white">Results</h3>
                {result && !result.operation ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Determinant</p>
                      <p className="text-lg font-bold dark:text-white">{result.determinant}</p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Trace</p>
                      <p className="text-lg font-bold dark:text-white">{result.trace}</p>
                    </div>
                    {result.eigenvalues && (
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Eigenvalues</p>
                        <p className="text-sm font-mono dark:text-white">λ₁ = {result.eigenvalues[0]}</p>
                        <p className="text-sm font-mono dark:text-white">λ₂ = {result.eigenvalues[1]}</p>
                      </div>
                    )}
                    {result.transpose && (
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Transpose</p>
                        <div className="font-mono text-sm dark:text-white">
                          {result.transpose.map((row: number[], i: number) => (
                            <div key={i}>[{row.join(', ')}]</div>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.inverse ? (
                      <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Inverse Matrix</p>
                        <div className="font-mono text-sm dark:text-white">
                          {result.inverse.map((row: string[], i: number) => (
                            <div key={i}>[{row.join(', ')}]</div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded">
                        <p className="text-red-900 dark:text-red-300">Matrix is singular (no inverse)</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">Enter matrix and calculate</p>
                )}
              </Card>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 dark:bg-gray-800">
                <h3 className="text-xl font-bold mb-4 dark:text-white">Matrix (3×3)</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <Input type="number" value={m3_11} onChange={(e) => setM3_11(parseFloat(e.target.value) || 0)} />
                    <Input type="number" value={m3_12} onChange={(e) => setM3_12(parseFloat(e.target.value) || 0)} />
                    <Input type="number" value={m3_13} onChange={(e) => setM3_13(parseFloat(e.target.value) || 0)} />
                    <Input type="number" value={m3_21} onChange={(e) => setM3_21(parseFloat(e.target.value) || 0)} />
                    <Input type="number" value={m3_22} onChange={(e) => setM3_22(parseFloat(e.target.value) || 0)} />
                    <Input type="number" value={m3_23} onChange={(e) => setM3_23(parseFloat(e.target.value) || 0)} />
                    <Input type="number" value={m3_31} onChange={(e) => setM3_31(parseFloat(e.target.value) || 0)} />
                    <Input type="number" value={m3_32} onChange={(e) => setM3_32(parseFloat(e.target.value) || 0)} />
                    <Input type="number" value={m3_33} onChange={(e) => setM3_33(parseFloat(e.target.value) || 0)} />
                  </div>
                  
                  <Button onClick={calculate3x3} className="w-full">
                    Calculate Properties
                  </Button>
                </div>
              </Card>

              <Card className="p-6 dark:bg-gray-800">
                <h3 className="text-xl font-bold mb-4 dark:text-white">Results</h3>
                {result && !result.operation ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Determinant</p>
                      <p className="text-lg font-bold dark:text-white">{result.determinant}</p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Trace</p>
                      <p className="text-lg font-bold dark:text-white">{result.trace}</p>
                    </div>
                    {result.transpose && (
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Transpose</p>
                        <div className="font-mono text-xs dark:text-white">
                          {result.transpose.map((row: number[], i: number) => (
                            <div key={i}>[{row.join(', ')}]</div>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.inverse ? (
                      <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Inverse Matrix</p>
                        <div className="font-mono text-xs dark:text-white">
                          {result.inverse.map((row: string[], i: number) => (
                            <div key={i}>[{row.join(', ')}]</div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded">
                        <p className="text-red-900 dark:text-red-300">Matrix is singular (no inverse)</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">Enter matrix and calculate</p>
                )}
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="operations" className="mt-4">
          {matrixSize === '2x2' ? (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6 dark:bg-gray-800">
                  <h3 className="text-lg font-bold mb-4 dark:text-white">Matrix A</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Input type="number" value={m2_11} onChange={(e) => setM2_11(parseFloat(e.target.value) || 0)} />
                    <Input type="number" value={m2_12} onChange={(e) => setM2_12(parseFloat(e.target.value) || 0)} />
                    <Input type="number" value={m2_21} onChange={(e) => setM2_21(parseFloat(e.target.value) || 0)} />
                    <Input type="number" value={m2_22} onChange={(e) => setM2_22(parseFloat(e.target.value) || 0)} />
                  </div>
                </Card>

                <Card className="p-6 dark:bg-gray-800">
                  <h3 className="text-lg font-bold mb-4 dark:text-white">Matrix B</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Input type="number" value={n2_11} onChange={(e) => setN2_11(parseFloat(e.target.value) || 0)} />
                    <Input type="number" value={n2_12} onChange={(e) => setN2_12(parseFloat(e.target.value) || 0)} />
                    <Input type="number" value={n2_21} onChange={(e) => setN2_21(parseFloat(e.target.value) || 0)} />
                    <Input type="number" value={n2_22} onChange={(e) => setN2_22(parseFloat(e.target.value) || 0)} />
                  </div>
                </Card>
              </div>

              <Card className="p-4 dark:bg-gray-800 mb-4">
                <h4 className="font-semibold mb-3 dark:text-white text-sm">Two Matrix Operations</h4>
                <div className="grid grid-cols-3 gap-2">
                  <Button onClick={addMatrices2x2} variant="outline" size="sm">A + B</Button>
                  <Button onClick={subtractMatrices2x2} variant="outline" size="sm">A - B</Button>
                  <Button onClick={() => subtractMatrices2x2Reverse()} variant="outline" size="sm">B - A</Button>
                  <Button onClick={multiplyMatrices2x2} variant="outline" size="sm">A × B</Button>
                  <Button onClick={() => multiplyMatrices2x2Reverse()} variant="outline" size="sm">B × A</Button>
                </div>
              </Card>

              <Card className="p-4 dark:bg-gray-800">
                <h4 className="font-semibold mb-3 dark:text-white text-sm">Matrix Powers</h4>
                <div className="grid grid-cols-4 gap-2">
                  <Button onClick={() => powerMatrix2x2(2, 'A')} variant="outline" size="sm">A²</Button>
                  <Button onClick={() => powerMatrix2x2(3, 'A')} variant="outline" size="sm">A³</Button>
                  <Button onClick={() => powerMatrix2x2(2, 'B')} variant="outline" size="sm">B²</Button>
                  <Button onClick={() => powerMatrix2x2(3, 'B')} variant="outline" size="sm">B³</Button>
                </div>
              </Card>

              {result && result.operation && (
                <Card className="p-6 dark:bg-gray-800">
                  <h3 className="text-lg font-bold mb-4 dark:text-white">
                    Result ({
                      result.operation === 'addition' ? 'A + B' :
                      result.operation === 'subtraction' ? 'A - B' :
                      result.operation === 'subtraction-reverse' ? 'B - A' :
                      result.operation === 'multiplication' ? 'A × B' :
                      result.operation === 'multiplication-reverse' ? 'B × A' :
                      result.operation.startsWith('power-2-A') ? 'A²' :
                      result.operation.startsWith('power-3-A') ? 'A³' :
                      result.operation.startsWith('power-2-B') ? 'B²' :
                      result.operation.startsWith('power-3-B') ? 'B³' :
                      result.operation
                    })
                  </h3>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded font-mono dark:text-white">
                    {result.result.map((row: string[], i: number) => (
                      <div key={i}>[{row.join(', ')}]</div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6 dark:bg-gray-800">
                  <h3 className="text-lg font-bold mb-4 dark:text-white">Matrix A</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <Input type="number" value={m3_11} onChange={(e) => setM3_11(parseFloat(e.target.value) || 0)} />
                    <Input type="number" value={m3_12} onChange={(e) => setM3_12(parseFloat(e.target.value) || 0)} />
                    <Input type="number" value={m3_13} onChange={(e) => setM3_13(parseFloat(e.target.value) || 0)} />
                    <Input type="number" value={m3_21} onChange={(e) => setM3_21(parseFloat(e.target.value) || 0)} />
                    <Input type="number" value={m3_22} onChange={(e) => setM3_22(parseFloat(e.target.value) || 0)} />
                    <Input type="number" value={m3_23} onChange={(e) => setM3_23(parseFloat(e.target.value) || 0)} />
                    <Input type="number" value={m3_31} onChange={(e) => setM3_31(parseFloat(e.target.value) || 0)} />
                    <Input type="number" value={m3_32} onChange={(e) => setM3_32(parseFloat(e.target.value) || 0)} />
                    <Input type="number" value={m3_33} onChange={(e) => setM3_33(parseFloat(e.target.value) || 0)} />
                  </div>
                </Card>

                <Card className="p-6 dark:bg-gray-800">
                  <h3 className="text-lg font-bold mb-4 dark:text-white">Matrix B</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <Input type="number" value={n3_11} onChange={(e) => setN3_11(parseFloat(e.target.value) || 0)} />
                    <Input type="number" value={n3_12} onChange={(e) => setN3_12(parseFloat(e.target.value) || 0)} />
                    <Input type="number" value={n3_13} onChange={(e) => setN3_13(parseFloat(e.target.value) || 0)} />
                    <Input type="number" value={n3_21} onChange={(e) => setN3_21(parseFloat(e.target.value) || 0)} />
                    <Input type="number" value={n3_22} onChange={(e) => setN3_22(parseFloat(e.target.value) || 0)} />
                    <Input type="number" value={n3_23} onChange={(e) => setN3_23(parseFloat(e.target.value) || 0)} />
                    <Input type="number" value={n3_31} onChange={(e) => setN3_31(parseFloat(e.target.value) || 0)} />
                    <Input type="number" value={n3_32} onChange={(e) => setN3_32(parseFloat(e.target.value) || 0)} />
                    <Input type="number" value={n3_33} onChange={(e) => setN3_33(parseFloat(e.target.value) || 0)} />
                  </div>
                </Card>
              </div>

              <Card className="p-4 dark:bg-gray-800 mb-4">
                <h4 className="font-semibold mb-3 dark:text-white text-sm">Two Matrix Operations</h4>
                <div className="grid grid-cols-3 gap-2">
                  <Button onClick={addMatrices3x3} variant="outline" size="sm">A + B</Button>
                  <Button onClick={subtractMatrices3x3} variant="outline" size="sm">A - B</Button>
                  <Button onClick={() => subtractMatrices3x3Reverse()} variant="outline" size="sm">B - A</Button>
                  <Button onClick={multiplyMatrices3x3} variant="outline" size="sm">A × B</Button>
                  <Button onClick={() => multiplyMatrices3x3Reverse()} variant="outline" size="sm">B × A</Button>
                </div>
              </Card>

              <Card className="p-4 dark:bg-gray-800">
                <h4 className="font-semibold mb-3 dark:text-white text-sm">Matrix Powers</h4>
                <div className="grid grid-cols-4 gap-2">
                  <Button onClick={() => powerMatrix3x3(2, 'A')} variant="outline" size="sm">A²</Button>
                  <Button onClick={() => powerMatrix3x3(3, 'A')} variant="outline" size="sm">A³</Button>
                  <Button onClick={() => powerMatrix3x3(2, 'B')} variant="outline" size="sm">B²</Button>
                  <Button onClick={() => powerMatrix3x3(3, 'B')} variant="outline" size="sm">B³</Button>
                </div>
              </Card>

              {result && result.operation && (
                <Card className="p-6 dark:bg-gray-800">
                  <h3 className="text-lg font-bold mb-4 dark:text-white">
                    Result ({
                      result.operation === 'addition' ? 'A + B' :
                      result.operation === 'subtraction' ? 'A - B' :
                      result.operation === 'multiplication' ? 'A × B' :
                      result.operation.startsWith('power') ? `A${result.operation.includes('2') ? '²' : '³'}` :
                      result.operation
                    })
                  </h3>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded font-mono text-sm dark:text-white">
                    {result.result.map((row: string[], i: number) => (
                      <div key={i}>[{row.join(', ')}]</div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
