import React, { useState, useEffect } from 'react';
import { Ruler, ArrowRightLeft, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type LengthUnit = 'millimeter' | 'centimeter' | 'meter' | 'kilometer' | 'inch' | 'foot' | 'yard' | 'mile' | 'nautical-mile';

interface UnitInfo {
  name: string;
  symbol: string;
  toMeters: number;
}

const UNITS: Record<LengthUnit, UnitInfo> = {
  millimeter: { name: 'Millimeter', symbol: 'mm', toMeters: 0.001 },
  centimeter: { name: 'Centimeter', symbol: 'cm', toMeters: 0.01 },
  meter: { name: 'Meter', symbol: 'm', toMeters: 1 },
  kilometer: { name: 'Kilometer', symbol: 'km', toMeters: 1000 },
  inch: { name: 'Inch', symbol: 'in', toMeters: 0.0254 },
  foot: { name: 'Foot', symbol: 'ft', toMeters: 0.3048 },
  yard: { name: 'Yard', symbol: 'yd', toMeters: 0.9144 },
  mile: { name: 'Mile', symbol: 'mi', toMeters: 1609.344 },
  'nautical-mile': { name: 'Nautical Mile', symbol: 'nmi', toMeters: 1852 }
};

export const LengthConverter: React.FC = () => {
  const [inputValue, setInputValue] = useState<string>('1');
  const [fromUnit, setFromUnit] = useState<LengthUnit>('meter');
  const [toUnit, setToUnit] = useState<LengthUnit>('foot');
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

    // Convert to meters first, then to target unit
    const inMeters = value * UNITS[fromUnit].toMeters;
    const converted = inMeters / UNITS[toUnit].toMeters;
    
    // Format result with appropriate precision
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

  const quickConversions = [
    { from: 'meter', to: 'foot', label: 'm → ft' },
    { from: 'kilometer', to: 'mile', label: 'km → mi' },
    { from: 'inch', to: 'centimeter', label: 'in → cm' },
    { from: 'foot', to: 'meter', label: 'ft → m' }
  ];

  return (
    <div className="h-full w-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-600 rounded-xl">
            <Ruler className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold dark:text-white">Length Converter</h1>
            <p className="text-gray-600 dark:text-gray-400">Convert between different length units</p>
          </div>
        </div>

        {/* Main Converter */}
        <Card className="p-6 dark:bg-gray-800">
          <div className="grid md:grid-cols-3 gap-4 items-end">
            {/* From */}
            <div>
              <label className="block text-sm font-semibold mb-2 dark:text-white">From</label>
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full p-3 border-2 rounded-lg text-lg font-semibold dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="Enter value"
              />
              <select
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value as LengthUnit)}
                className="w-full mt-2 p-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
              >
                {Object.entries(UNITS).map(([key, unit]) => (
                  <option key={key} value={key}>
                    {unit.name} ({unit.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <Button
                onClick={swapUnits}
                variant="outline"
                size="lg"
                className="rounded-full w-12 h-12 p-0"
              >
                <ArrowRightLeft className="h-5 w-5" />
              </Button>
            </div>

            {/* To */}
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
                  title="Copy result"
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <select
                value={toUnit}
                onChange={(e) => setToUnit(e.target.value as LengthUnit)}
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
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
              <p className="text-center text-lg dark:text-white">
                <span className="font-bold">{inputValue} {UNITS[fromUnit].symbol}</span>
                {' = '}
                <span className="font-bold text-blue-600 dark:text-blue-400">{result} {UNITS[toUnit].symbol}</span>
              </p>
            </div>
          )}
        </Card>

        {/* Quick Conversions */}
        <Card className="p-6 dark:bg-gray-800">
          <h3 className="font-bold text-lg mb-4 dark:text-white">Quick Conversions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickConversions.map((conv, idx) => (
              <Button
                key={idx}
                onClick={() => {
                  setFromUnit(conv.from as LengthUnit);
                  setToUnit(conv.to as LengthUnit);
                }}
                variant="outline"
                className="h-auto py-3"
              >
                {conv.label}
              </Button>
            ))}
          </div>
        </Card>

        {/* Conversion Table */}
        <Card className="p-6 dark:bg-gray-800">
          <h3 className="font-bold text-lg mb-4 dark:text-white">
            1 {UNITS[fromUnit].name} equals:
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {Object.entries(UNITS).map(([key, unit]) => {
              const value = parseFloat(inputValue) || 1;
              const inMeters = value * UNITS[fromUnit].toMeters;
              const converted = inMeters / unit.toMeters;
              const formatted = converted < 0.01 
                ? converted.toExponential(4)
                : converted.toFixed(4).replace(/\.?0+$/, '');
              
              return (
                <div
                  key={key}
                  className={`p-3 rounded-lg border-2 ${
                    key === toUnit 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' 
                      : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold dark:text-white">{unit.name}</span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {formatted} {unit.symbol}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Common Conversions Reference */}
        <Card className="p-6 dark:bg-gray-800">
          <h3 className="font-bold text-lg mb-4 dark:text-white">Common Conversions</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm dark:text-gray-300">
            <div>
              <p className="font-semibold mb-2">Metric System:</p>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>• 1 km = 1,000 m</li>
                <li>• 1 m = 100 cm</li>
                <li>• 1 cm = 10 mm</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">Imperial System:</p>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>• 1 mile = 1,760 yards</li>
                <li>• 1 yard = 3 feet</li>
                <li>• 1 foot = 12 inches</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
