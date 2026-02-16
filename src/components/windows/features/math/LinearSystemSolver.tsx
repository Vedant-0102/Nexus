import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SolutionResult {
  type: 'unique' | 'infinite' | 'none';
  values?: Record<string, string>;
  determinant: string;
  steps: string[];
  equations: string[];
}

export const LinearSystemSolver = () => {
  // 2x2 system
  const [a11, setA11] = useState(2);
  const [a12, setA12] = useState(1);
  const [b1, setB1] = useState(5);
  const [a21, setA21] = useState(1);
  const [a22, setA22] = useState(-1);
  const [b2, setB2] = useState(1);

  // 3x3 system
  const [c11, setC11] = useState(1);
  const [c12, setC12] = useState(1);
  const [c13, setC13] = useState(1);
  const [d1, setD1] = useState(6);
  const [c21, setC21] = useState(0);
  const [c22, setC22] = useState(2);
  const [c23, setC23] = useState(5);
  const [d2, setD2] = useState(12);
  const [c31, setC31] = useState(2);
  const [c32, setC32] = useState(5);
  const [c33, setC33] = useState(1);
  const [d3, setD3] = useState(13);

  const [result2, setResult2] = useState<SolutionResult | null>(null);
  const [result3, setResult3] = useState<SolutionResult | null>(null);

  const fmt = (n: number) => {
    if (Math.abs(n) < 1e-10) return '0';
    if (Number.isInteger(n)) return n.toString();
    return n.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  };

  const fmtCoeff = (c: number, varName: string, isFirst: boolean) => {
    if (c === 0) return '';
    const sign = c > 0 ? (isFirst ? '' : ' + ') : (isFirst ? '-' : ' - ');
    const abs = Math.abs(c);
    const coeff = abs === 1 ? '' : fmt(abs);
    return `${sign}${coeff}${varName}`;
  };

  const solve2x2 = () => {
    const det = a11 * a22 - a12 * a21;
    const steps: string[] = [];
    const eq1Parts = [fmtCoeff(a11, 'x', true), fmtCoeff(a12, 'y', false)].filter(Boolean).join('') || '0';
    const eq2Parts = [fmtCoeff(a21, 'x', true), fmtCoeff(a22, 'y', false)].filter(Boolean).join('') || '0';
    const equations = [`${eq1Parts} = ${fmt(b1)}`, `${eq2Parts} = ${fmt(b2)}`];

    steps.push(`Determinant: (${fmt(a11)})(${fmt(a22)}) - (${fmt(a12)})(${fmt(a21)}) = ${fmt(det)}`);

    if (Math.abs(det) < 1e-10) {
      // Check if infinite or no solution
      const cross1 = a11 * b2 - a21 * b1;
      const cross2 = a12 * b2 - a22 * b1;
      if (Math.abs(cross1) < 1e-10 && Math.abs(cross2) < 1e-10) {
        steps.push('Since det = 0 and augmented matrix rows are proportional:');
        steps.push('The system has infinitely many solutions.');
        setResult2({ type: 'infinite', determinant: fmt(det), steps, equations });
      } else {
        steps.push('Since det = 0 but augmented matrix rows are NOT proportional:');
        steps.push('The system has no solution (inconsistent).');
        setResult2({ type: 'none', determinant: fmt(det), steps, equations });
      }
      return;
    }

    const x = (b1 * a22 - b2 * a12) / det;
    const y = (a11 * b2 - a21 * b1) / det;

    steps.push(`Using Cramer's Rule:`);
    steps.push(`x = [(${fmt(b1)})(${fmt(a22)}) - (${fmt(b2)})(${fmt(a12)})] / ${fmt(det)} = ${fmt(x)}`);
    steps.push(`y = [(${fmt(a11)})(${fmt(b2)}) - (${fmt(a21)})(${fmt(b1)})] / ${fmt(det)} = ${fmt(y)}`);
    steps.push(`Verification: ${fmt(a11)}(${fmt(x)}) + ${fmt(a12)}(${fmt(y)}) = ${fmt(a11 * x + a12 * y)} = ${fmt(b1)}`);

    setResult2({ type: 'unique', values: { x: fmt(x), y: fmt(y) }, determinant: fmt(det), steps, equations });
  };

  const solve3x3 = () => {
    const det =
      c11 * (c22 * c33 - c23 * c32) -
      c12 * (c21 * c33 - c23 * c31) +
      c13 * (c21 * c32 - c22 * c31);

    const steps: string[] = [];
    const eq1 = [fmtCoeff(c11, 'x', true), fmtCoeff(c12, 'y', false), fmtCoeff(c13, 'z', false)].filter(Boolean).join('') || '0';
    const eq2 = [fmtCoeff(c21, 'x', true), fmtCoeff(c22, 'y', false), fmtCoeff(c23, 'z', false)].filter(Boolean).join('') || '0';
    const eq3 = [fmtCoeff(c31, 'x', true), fmtCoeff(c32, 'y', false), fmtCoeff(c33, 'z', false)].filter(Boolean).join('') || '0';
    const equations = [`${eq1} = ${fmt(d1)}`, `${eq2} = ${fmt(d2)}`, `${eq3} = ${fmt(d3)}`];

    steps.push(`Determinant: ${fmt(det)}`);

    if (Math.abs(det) < 1e-10) {
      steps.push('Since det = 0, the system does not have a unique solution.');
      steps.push('The system is either inconsistent (no solution) or dependent (infinitely many solutions).');
      setResult3({ type: 'none', determinant: fmt(det), steps, equations });
      return;
    }

    // Cramer's rule for 3x3
    const detX =
      d1 * (c22 * c33 - c23 * c32) -
      c12 * (d2 * c33 - c23 * d3) +
      c13 * (d2 * c32 - c22 * d3);

    const detY =
      c11 * (d2 * c33 - c23 * d3) -
      d1 * (c21 * c33 - c23 * c31) +
      c13 * (c21 * d3 - d2 * c31);

    const detZ =
      c11 * (c22 * d3 - d2 * c32) -
      c12 * (c21 * d3 - d2 * c31) +
      d1 * (c21 * c32 - c22 * c31);

    const x = detX / det;
    const y = detY / det;
    const z = detZ / det;

    steps.push(`Using Cramer's Rule:`);
    steps.push(`det(Ax) = ${fmt(detX)}, x = ${fmt(detX)} / ${fmt(det)} = ${fmt(x)}`);
    steps.push(`det(Ay) = ${fmt(detY)}, y = ${fmt(detY)} / ${fmt(det)} = ${fmt(y)}`);
    steps.push(`det(Az) = ${fmt(detZ)}, z = ${fmt(detZ)} / ${fmt(det)} = ${fmt(z)}`);
    steps.push(`Verification: Eq1 = ${fmt(c11 * x + c12 * y + c13 * z)} = ${fmt(d1)}`);

    setResult3({ type: 'unique', values: { x: fmt(x), y: fmt(y), z: fmt(z) }, determinant: fmt(det), steps, equations });
  };

  const presets2x2 = [
    { label: '2x + y = 5, x - y = 1', values: [2, 1, 5, 1, -1, 1] },
    { label: '3x + 2y = 12, x - y = 1', values: [3, 2, 12, 1, -1, 1] },
    { label: 'No solution: x + y = 1, x + y = 3', values: [1, 1, 1, 1, 1, 3] },
    { label: 'Infinite: 2x + 4y = 6, x + 2y = 3', values: [2, 4, 6, 1, 2, 3] },
  ];

  const presets3x3 = [
    { label: 'x+y+z=6, 2y+5z=12, 2x+5y+z=13', values: [1, 1, 1, 6, 0, 2, 5, 12, 2, 5, 1, 13] },
    { label: '2x+y-z=3, x+3y+2z=9, 3x-y+z=4', values: [2, 1, -1, 3, 1, 3, 2, 9, 3, -1, 1, 4] },
  ];

  const renderResult = (result: SolutionResult | null) => {
    if (!result) return <p className="text-gray-500 dark:text-gray-400 text-sm">Enter equations and click solve</p>;

    return (
      <div className="space-y-3">
        {/* Formatted equations */}
        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded font-mono text-sm dark:text-gray-200">
          {result.equations.map((eq, i) => (
            <div key={i}>{eq}</div>
          ))}
        </div>

        {/* Solution status */}
        <div className={`p-3 rounded ${
          result.type === 'unique' ? 'bg-green-50 dark:bg-green-900/30' :
          result.type === 'infinite' ? 'bg-yellow-50 dark:bg-yellow-900/30' :
          'bg-red-50 dark:bg-red-900/30'
        }`}>
          <p className={`font-semibold text-sm ${
            result.type === 'unique' ? 'text-green-800 dark:text-green-300' :
            result.type === 'infinite' ? 'text-yellow-800 dark:text-yellow-300' :
            'text-red-800 dark:text-red-300'
          }`}>
            {result.type === 'unique' && 'Unique Solution Found'}
            {result.type === 'infinite' && 'Infinitely Many Solutions'}
            {result.type === 'none' && 'No Solution (Inconsistent)'}
          </p>
        </div>

        {/* Solution values */}
        {result.values && (
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(result.values).map(([varName, val]) => (
              <div key={varName} className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">{varName}</p>
                <p className="text-xl font-bold font-mono dark:text-white">{val}</p>
              </div>
            ))}
          </div>
        )}

        {/* Determinant */}
        <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded">
          <p className="text-xs text-gray-500 dark:text-gray-400">Determinant</p>
          <p className="text-sm font-bold font-mono dark:text-white">{result.determinant}</p>
        </div>

        {/* Steps */}
        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded">
          <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-2">Solution Steps:</p>
          <div className="space-y-1">
            {result.steps.map((step, i) => (
              <p key={i} className="text-xs font-mono text-gray-700 dark:text-gray-300">{step}</p>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <h1 className="text-2xl font-bold dark:text-white mb-4">Linear System Solver</h1>

      <Tabs defaultValue="2x2" className="flex-1">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="2x2">2x2 System</TabsTrigger>
          <TabsTrigger value="3x3">3x3 System</TabsTrigger>
        </TabsList>

        {/* 2x2 Tab */}
        <TabsContent value="2x2" className="mt-4">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-lg font-bold mb-3 dark:text-white">2x2 System</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                a<sub>1</sub>x + a<sub>2</sub>y = b
              </p>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Equation 1:</Label>
                  <div className="grid grid-cols-7 gap-1 items-center mt-1">
                    <Input type="number" value={a11} onChange={e => setA11(+e.target.value || 0)} className="col-span-2 text-center" onKeyDown={e => e.key === 'Enter' && solve2x2()} />
                    <span className="text-center text-sm dark:text-gray-300">x +</span>
                    <Input type="number" value={a12} onChange={e => setA12(+e.target.value || 0)} className="col-span-2 text-center" onKeyDown={e => e.key === 'Enter' && solve2x2()} />
                    <span className="text-center text-sm dark:text-gray-300">y =</span>
                    <Input type="number" value={b1} onChange={e => setB1(+e.target.value || 0)} className="text-center" onKeyDown={e => e.key === 'Enter' && solve2x2()} />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Equation 2:</Label>
                  <div className="grid grid-cols-7 gap-1 items-center mt-1">
                    <Input type="number" value={a21} onChange={e => setA21(+e.target.value || 0)} className="col-span-2 text-center" onKeyDown={e => e.key === 'Enter' && solve2x2()} />
                    <span className="text-center text-sm dark:text-gray-300">x +</span>
                    <Input type="number" value={a22} onChange={e => setA22(+e.target.value || 0)} className="col-span-2 text-center" onKeyDown={e => e.key === 'Enter' && solve2x2()} />
                    <span className="text-center text-sm dark:text-gray-300">y =</span>
                    <Input type="number" value={b2} onChange={e => setB2(+e.target.value || 0)} className="text-center" onKeyDown={e => e.key === 'Enter' && solve2x2()} />
                  </div>
                </div>

                <Button onClick={solve2x2} className="w-full">Solve System</Button>

                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Presets:</p>
                  <div className="space-y-1">
                    {presets2x2.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          const [v1, v2, v3, v4, v5, v6] = p.values;
                          setA11(v1); setA12(v2); setB1(v3);
                          setA21(v4); setA22(v5); setB2(v6);
                        }}
                        className="block w-full text-left text-xs px-2 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300 transition-colors"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-lg font-bold mb-3 dark:text-white">Solution</h3>
              {renderResult(result2)}
            </Card>
          </div>
        </TabsContent>

        {/* 3x3 Tab */}
        <TabsContent value="3x3" className="mt-4">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-lg font-bold mb-3 dark:text-white">3x3 System</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                a<sub>1</sub>x + a<sub>2</sub>y + a<sub>3</sub>z = b
              </p>

              <div className="space-y-3">
                {[
                  { label: 'Eq 1:', vals: [c11, c12, c13, d1], setters: [setC11, setC12, setC13, setD1] },
                  { label: 'Eq 2:', vals: [c21, c22, c23, d2], setters: [setC21, setC22, setC23, setD2] },
                  { label: 'Eq 3:', vals: [c31, c32, c33, d3], setters: [setC31, setC32, setC33, setD3] },
                ].map(({ label, vals, setters }) => (
                  <div key={label}>
                    <Label className="text-xs">{label}</Label>
                    <div className="grid grid-cols-10 gap-1 items-center mt-1">
                      <Input type="number" value={vals[0]} onChange={e => setters[0](+e.target.value || 0)} className="col-span-2 text-center text-sm" onKeyDown={e => e.key === 'Enter' && solve3x3()} />
                      <span className="text-xs text-center dark:text-gray-300">x+</span>
                      <Input type="number" value={vals[1]} onChange={e => setters[1](+e.target.value || 0)} className="col-span-2 text-center text-sm" onKeyDown={e => e.key === 'Enter' && solve3x3()} />
                      <span className="text-xs text-center dark:text-gray-300">y+</span>
                      <Input type="number" value={vals[2]} onChange={e => setters[2](+e.target.value || 0)} className="col-span-2 text-center text-sm" onKeyDown={e => e.key === 'Enter' && solve3x3()} />
                      <span className="text-xs text-center dark:text-gray-300">=</span>
                      {/* Use a separate row for result since we ran out of columns */}
                    </div>
                    <div className="mt-1">
                      <Input type="number" value={vals[3]} onChange={e => setters[3](+e.target.value || 0)} className="w-20 text-center text-sm" onKeyDown={e => e.key === 'Enter' && solve3x3()} />
                    </div>
                  </div>
                ))}

                <Button onClick={solve3x3} className="w-full">Solve System</Button>

                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Presets:</p>
                  <div className="space-y-1">
                    {presets3x3.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          const v = p.values;
                          setC11(v[0]); setC12(v[1]); setC13(v[2]); setD1(v[3]);
                          setC21(v[4]); setC22(v[5]); setC23(v[6]); setD2(v[7]);
                          setC31(v[8]); setC32(v[9]); setC33(v[10]); setD3(v[11]);
                        }}
                        className="block w-full text-left text-xs px-2 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300 transition-colors"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-lg font-bold mb-3 dark:text-white">Solution</h3>
              {renderResult(result3)}
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
