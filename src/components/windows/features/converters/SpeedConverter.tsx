import React, { useState, useEffect } from 'react';
import { Gauge, ArrowRightLeft, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type SpeedUnit = 'mps' | 'kph' | 'mph' | 'fps' | 'knot' | 'mach';

interface UnitInfo {
  name: string;
  symbol: string;
  toMPS: number;
}

const UNITS: Record<SpeedUnit, UnitInfo> = {
  mps: { name: 'Meters per Second', symbol: 'm/s', toMPS: 1 },
  kph: { name: 'Kilometers per Hour', symbol: 'km/h', toMPS: 1 / 3.6 },
  mph: { name: 'Miles per Hour', symbol: 'mph', toMPS: 0.44704 },
  fps: { name: 'Feet per Second', symbol: 'ft/s', toMPS: 0.3048 },
  knot: { name: 'Knots', symbol: 'kn', toMPS: 0.514444 },
  mach: { name: 'Mach', symbol: 'Ma', toMPS: 343 },
};

export const SpeedConverter: React.FC = () => {
  const [inputValue, setInputValue] = useState<string>('100');
  const [fromUnit, setFromUnit] = useState<SpeedUnit>('kph');
  const [toUnit, setToUnit] = useState<SpeedUnit>('mph');
  const [result, setResult] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    calculateConversion();
  }, [inputValue, fromUnit, toUnit]);

  const calculateConversion = () => {
    const value = parseFloat(inputValue);
    if (isNaN(value)) {
      setResult('');
      return;
    }

    const inMPS = value * UNITS[fromUnit].toMPS;
    const converted = inMPS / UNITS[toUnit].toMPS;
    const formatted = converted < 0.01 
      ? converted.toExponential(6)
      : converted.toFixed(6).replace(/\.?0+$/, '');
    setResult(formatted);
  };

  const swapUnits = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  const copyResult = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="h-full w-full bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-6">

        <Card className="p-6 dark:bg-gray-800">
          <div className="grid md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-semibold mb-2 dark:text-white">From</label>
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full p-3 border-2 rounded-lg text-lg font-semibold dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:border-cyan-500 focus:outline-none"
                placeholder="Enter value"
              />
              <select
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value as SpeedUnit)}
                className="w-full mt-2 p-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
              >
                {Object.entries(UNITS).map(([key, unit]) => (
                  <option key={key} value={key}>
                    {unit.name} ({unit.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-center">
              <Button onClick={swapUnits} variant="outline" size="lg" className="rounded-full w-12 h-12 p-0">
                <ArrowRightLeft className="h-5 w-5" />
              </Button>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 dark:text-white">To</label>
              <div className="relative">
                <input
                  type="text"
                  value={result}
                  readOnly
                  className="w-full p-3 border-2 rounded-lg text-lg font-semibold bg-gray-50 dark:bg-gray-900 dark:text-white dark:border-gray-600"
                  placeholder="Result"
                />
                <button
                  onClick={copyResult}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <select
                value={toUnit}
                onChange={(e) => setToUnit(e.target.value as SpeedUnit)}
                className="w-full mt-2 p-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
              >
                {Object.entries(UNITS).map(([key, unit]) => (
                  <option key={key} value={key}>
                    {unit.name} ({unit.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {result && (
            <div className="mt-6 p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border-2 border-cyan-200 dark:border-cyan-800">
              <p className="text-center text-lg dark:text-white">
                <span className="font-bold">{inputValue} {UNITS[fromUnit].symbol}</span>
                {' = '}
                <span className="font-bold text-cyan-600 dark:text-cyan-400">{result} {UNITS[toUnit].symbol}</span>
              </p>
            </div>
          )}
        </Card>

        <Card className="p-6 dark:bg-gray-800">
          <h3 className="font-bold text-lg mb-4 dark:text-white">All Conversions</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {Object.entries(UNITS).map(([key, unit]) => {
              const value = parseFloat(inputValue) || 1;
              const inMPS = value * UNITS[fromUnit].toMPS;
              const converted = inMPS / unit.toMPS;
              const formatted = converted < 0.01 
                ? converted.toExponential(4)
                : converted.toFixed(4).replace(/\.?0+$/, '');
              
              return (
                <div
                  key={key}
                  className={`p-3 rounded-lg border-2 ${
                    key === toUnit 
                      ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-500' 
                      : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold dark:text-white text-sm">{unit.name}</span>
                    <span className="text-base font-bold text-cyan-600 dark:text-cyan-400">
                      {formatted} {unit.symbol}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6 dark:bg-gray-800">
          <h3 className="font-bold text-lg mb-4 dark:text-white">Speed References</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm dark:text-gray-300">
            <div>
              <p className="font-semibold mb-2">Common Speeds:</p>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>• Walking: ~5 km/h</li>
                <li>• Running: ~15 km/h</li>
                <li>• Car (highway): ~100 km/h</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">Fast Speeds:</p>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>• Sound: 343 m/s (Mach 1)</li>
                <li>• Airplane: ~900 km/h</li>
                <li>• Bullet: ~1000 m/s</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
