import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator } from 'lucide-react';

interface TrigResults {
  sin: string;
  cos: string;
  tan: string;
  csc: string;
  sec: string;
  cot: string;
  radians: string;
  degrees: string;
  arcsin?: string;
  arccos?: string;
  arctan?: string;
  sinh?: string;
  cosh?: string;
  tanh?: string;
}

export const TrigCalculator = () => {
  const [angle, setAngle] = useState(45);
  const [angleMode, setAngleMode] = useState<'degrees' | 'radians'>('degrees');
  const [results, setResults] = useState<TrigResults | null>(null);
  const [inverseValue, setInverseValue] = useState(0.5);
  const [inverseResults, setInverseResults] = useState<any>(null);

  const formatValue = (value: number, precision = 6): string => {
    // Handle special cases
    if (!isFinite(value)) {
      return 'undefined';
    }
    if (Math.abs(value) < 1e-10) {
      return '0';
    }
    if (Math.abs(value) > 1e10) {
      return value > 0 ? '∞' : '-∞';
    }
    
    // Round to avoid floating point errors
    const rounded = Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
    return rounded.toString();
  };

  const calculate = () => {
    const rad = angleMode === 'degrees' ? (angle * Math.PI) / 180 : angle;
    
    const sinVal = Math.sin(rad);
    const cosVal = Math.cos(rad);
    const tanVal = Math.tan(rad);
    
    // Calculate reciprocal functions with proper error handling
    const cscVal = Math.abs(sinVal) < 1e-10 ? Infinity : 1 / sinVal;
    const secVal = Math.abs(cosVal) < 1e-10 ? Infinity : 1 / cosVal;
    const cotVal = Math.abs(tanVal) < 1e-10 ? Infinity : 1 / tanVal;
    
    setResults({
      sin: formatValue(sinVal),
      cos: formatValue(cosVal),
      tan: formatValue(tanVal),
      csc: formatValue(cscVal),
      sec: formatValue(secVal),
      cot: formatValue(cotVal),
      radians: formatValue(rad),
      degrees: angleMode === 'radians' ? formatValue((angle * 180) / Math.PI) : formatValue(angle),
      sinh: formatValue(Math.sinh(rad)),
      cosh: formatValue(Math.cosh(rad)),
      tanh: formatValue(Math.tanh(rad)),
    });
  };

  const calculateInverse = () => {
    const val = inverseValue;
    
    // Validate input ranges
    const arcsinVal = Math.abs(val) <= 1 ? Math.asin(val) : NaN;
    const arccosVal = Math.abs(val) <= 1 ? Math.acos(val) : NaN;
    const arctanVal = Math.atan(val);
    
    setInverseResults({
      arcsin: {
        radians: formatValue(arcsinVal),
        degrees: formatValue((arcsinVal * 180) / Math.PI),
        valid: Math.abs(val) <= 1
      },
      arccos: {
        radians: formatValue(arccosVal),
        degrees: formatValue((arccosVal * 180) / Math.PI),
        valid: Math.abs(val) <= 1
      },
      arctan: {
        radians: formatValue(arctanVal),
        degrees: formatValue((arctanVal * 180) / Math.PI),
        valid: true
      }
    });
  };

  const commonAngles = [
    { deg: 0, rad: 0 },
    { deg: 30, rad: Math.PI / 6 },
    { deg: 45, rad: Math.PI / 4 },
    { deg: 60, rad: Math.PI / 3 },
    { deg: 90, rad: Math.PI / 2 },
    { deg: 180, rad: Math.PI },
    { deg: 270, rad: (3 * Math.PI) / 2 },
    { deg: 360, rad: 2 * Math.PI },
  ];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <h1 className="text-2xl font-bold dark:text-white mb-6">Trigonometry Calculator</h1>

      <Tabs defaultValue="calculator" className="flex-1">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="inverse">Inverse Functions</TabsTrigger>
          <TabsTrigger value="reference">Reference Table</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-xl font-bold mb-4 dark:text-white">Input</h3>
              
              <div className="space-y-4">
                <div>
                  <Label>Angle</Label>
                  <Input
                    type="number"
                    value={angle}
                    onChange={(e) => setAngle(parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label>Mode</Label>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant={angleMode === 'degrees' ? 'default' : 'outline'}
                      onClick={() => setAngleMode('degrees')}
                      className="flex-1"
                    >
                      Degrees
                    </Button>
                    <Button
                      variant={angleMode === 'radians' ? 'default' : 'outline'}
                      onClick={() => setAngleMode('radians')}
                      className="flex-1"
                    >
                      Radians
                    </Button>
                  </div>
                </div>
                
                <Button onClick={calculate} className="w-full">
                  Calculate
                </Button>
              </div>

              <div className="mt-6">
                <h4 className="font-semibold mb-2 dark:text-white">Common Angles:</h4>
                <div className="grid grid-cols-4 gap-2">
                  {commonAngles.map((a) => (
                    <Button
                      key={a.deg}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAngle(angleMode === 'degrees' ? a.deg : a.rad);
                        calculate();
                      }}
                    >
                      {angleMode === 'degrees' ? `${a.deg}°` : `${(a.rad / Math.PI).toFixed(2)}π`}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-xl font-bold mb-4 dark:text-white">Results</h3>
              {results ? (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Angle</p>
                    <p className="font-bold dark:text-white">{results.degrees}° = {results.radians} rad</p>
                  </div>
                  
                  <h4 className="font-semibold text-sm dark:text-white mt-4">Basic Functions</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded">
                      <p className="text-sm text-gray-600 dark:text-gray-400">sin(θ)</p>
                      <p className="text-lg font-bold dark:text-white">{results.sin}</p>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded">
                      <p className="text-sm text-gray-600 dark:text-gray-400">cos(θ)</p>
                      <p className="text-lg font-bold dark:text-white">{results.cos}</p>
                    </div>
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded">
                      <p className="text-sm text-gray-600 dark:text-gray-400">tan(θ)</p>
                      <p className="text-lg font-bold dark:text-white">{results.tan}</p>
                    </div>
                  </div>

                  <h4 className="font-semibold text-sm dark:text-white mt-4">Reciprocal Functions</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded">
                      <p className="text-sm text-gray-600 dark:text-gray-400">csc(θ)</p>
                      <p className="text-lg font-bold dark:text-white">{results.csc}</p>
                    </div>
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded">
                      <p className="text-sm text-gray-600 dark:text-gray-400">sec(θ)</p>
                      <p className="text-lg font-bold dark:text-white">{results.sec}</p>
                    </div>
                    <div className="p-3 bg-pink-50 dark:bg-pink-900/30 rounded">
                      <p className="text-sm text-gray-600 dark:text-gray-400">cot(θ)</p>
                      <p className="text-lg font-bold dark:text-white">{results.cot}</p>
                    </div>
                  </div>

                  <h4 className="font-semibold text-sm dark:text-white mt-4">Hyperbolic Functions</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-cyan-50 dark:bg-cyan-900/30 rounded">
                      <p className="text-sm text-gray-600 dark:text-gray-400">sinh(θ)</p>
                      <p className="text-lg font-bold dark:text-white">{results.sinh}</p>
                    </div>
                    <div className="p-3 bg-teal-50 dark:bg-teal-900/30 rounded">
                      <p className="text-sm text-gray-600 dark:text-gray-400">cosh(θ)</p>
                      <p className="text-lg font-bold dark:text-white">{results.cosh}</p>
                    </div>
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded">
                      <p className="text-sm text-gray-600 dark:text-gray-400">tanh(θ)</p>
                      <p className="text-lg font-bold dark:text-white">{results.tanh}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                  <Calculator className="h-12 w-12 mb-2 opacity-50" />
                  <p>Enter an angle and click calculate</p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inverse" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-xl font-bold mb-4 dark:text-white">Inverse Trigonometric Functions</h3>
              
              <div className="space-y-4">
                <div>
                  <Label>Input Value</Label>
                  <Input
                    type="number"
                    value={inverseValue}
                    onChange={(e) => setInverseValue(parseFloat(e.target.value) || 0)}
                    step="0.1"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    For arcsin/arccos: value must be between -1 and 1
                  </p>
                </div>
                
                <Button onClick={calculateInverse} className="w-full">
                  Calculate Inverse Functions
                </Button>
              </div>

              <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/30 rounded">
                <h4 className="font-semibold mb-2 dark:text-white text-sm">Domain Restrictions</h4>
                <ul className="space-y-1 text-xs dark:text-gray-300">
                  <li>• arcsin(x): -1 ≤ x ≤ 1</li>
                  <li>• arccos(x): -1 ≤ x ≤ 1</li>
                  <li>• arctan(x): all real numbers</li>
                </ul>
              </div>
            </Card>

            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-xl font-bold mb-4 dark:text-white">Results</h3>
              {inverseResults ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded ${inverseResults.arcsin.valid ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      arcsin({inverseValue})
                    </p>
                    {inverseResults.arcsin.valid ? (
                      <>
                        <p className="dark:text-white">
                          <span className="font-bold">{inverseResults.arcsin.radians}</span> radians
                        </p>
                        <p className="dark:text-white">
                          <span className="font-bold">{inverseResults.arcsin.degrees}°</span>
                        </p>
                      </>
                    ) : (
                      <p className="text-red-600 dark:text-red-400 text-sm">
                        Invalid: value must be between -1 and 1
                      </p>
                    )}
                  </div>

                  <div className={`p-4 rounded ${inverseResults.arccos.valid ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      arccos({inverseValue})
                    </p>
                    {inverseResults.arccos.valid ? (
                      <>
                        <p className="dark:text-white">
                          <span className="font-bold">{inverseResults.arccos.radians}</span> radians
                        </p>
                        <p className="dark:text-white">
                          <span className="font-bold">{inverseResults.arccos.degrees}°</span>
                        </p>
                      </>
                    ) : (
                      <p className="text-red-600 dark:text-red-400 text-sm">
                        Invalid: value must be between -1 and 1
                      </p>
                    )}
                  </div>

                  <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      arctan({inverseValue})
                    </p>
                    <p className="dark:text-white">
                      <span className="font-bold">{inverseResults.arctan.radians}</span> radians
                    </p>
                    <p className="dark:text-white">
                      <span className="font-bold">{inverseResults.arctan.degrees}°</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                  <Calculator className="h-12 w-12 mb-2 opacity-50" />
                  <p>Enter a value and click calculate</p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reference" className="mt-4">
          <Card className="p-6 dark:bg-gray-800">
            <h3 className="text-xl font-bold mb-4 dark:text-white">Common Angle Values</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left p-2 dark:text-white">Angle</th>
                    <th className="text-left p-2 dark:text-white">Radians</th>
                    <th className="text-left p-2 dark:text-white">sin</th>
                    <th className="text-left p-2 dark:text-white">cos</th>
                    <th className="text-left p-2 dark:text-white">tan</th>
                  </tr>
                </thead>
                <tbody className="dark:text-gray-300">
                  <tr className="border-b dark:border-gray-700">
                    <td className="p-2">0°</td>
                    <td className="p-2">0</td>
                    <td className="p-2">0</td>
                    <td className="p-2">1</td>
                    <td className="p-2">0</td>
                  </tr>
                  <tr className="border-b dark:border-gray-700">
                    <td className="p-2">30°</td>
                    <td className="p-2">π/6</td>
                    <td className="p-2">1/2</td>
                    <td className="p-2">√3/2</td>
                    <td className="p-2">√3/3</td>
                  </tr>
                  <tr className="border-b dark:border-gray-700">
                    <td className="p-2">45°</td>
                    <td className="p-2">π/4</td>
                    <td className="p-2">√2/2</td>
                    <td className="p-2">√2/2</td>
                    <td className="p-2">1</td>
                  </tr>
                  <tr className="border-b dark:border-gray-700">
                    <td className="p-2">60°</td>
                    <td className="p-2">π/3</td>
                    <td className="p-2">√3/2</td>
                    <td className="p-2">1/2</td>
                    <td className="p-2">√3</td>
                  </tr>
                  <tr className="border-b dark:border-gray-700">
                    <td className="p-2">90°</td>
                    <td className="p-2">π/2</td>
                    <td className="p-2">1</td>
                    <td className="p-2">0</td>
                    <td className="p-2">undefined</td>
                  </tr>
                  <tr className="border-b dark:border-gray-700">
                    <td className="p-2">180°</td>
                    <td className="p-2">π</td>
                    <td className="p-2">0</td>
                    <td className="p-2">-1</td>
                    <td className="p-2">0</td>
                  </tr>
                  <tr className="border-b dark:border-gray-700">
                    <td className="p-2">270°</td>
                    <td className="p-2">3π/2</td>
                    <td className="p-2">-1</td>
                    <td className="p-2">0</td>
                    <td className="p-2">undefined</td>
                  </tr>
                  <tr>
                    <td className="p-2">360°</td>
                    <td className="p-2">2π</td>
                    <td className="p-2">0</td>
                    <td className="p-2">1</td>
                    <td className="p-2">0</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded">
              <h4 className="font-semibold mb-2 dark:text-white">Trigonometric Identities</h4>
              <ul className="space-y-1 text-sm dark:text-gray-300">
                <li>• sin²(θ) + cos²(θ) = 1</li>
                <li>• tan(θ) = sin(θ) / cos(θ)</li>
                <li>• csc(θ) = 1 / sin(θ)</li>
                <li>• sec(θ) = 1 / cos(θ)</li>
                <li>• cot(θ) = 1 / tan(θ)</li>
                <li>• sin(2θ) = 2sin(θ)cos(θ)</li>
                <li>• cos(2θ) = cos²(θ) - sin²(θ)</li>
              </ul>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
