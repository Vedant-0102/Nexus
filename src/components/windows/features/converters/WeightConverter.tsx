import React, { useState, useEffect } from 'react';
import { Weight, ArrowRightLeft, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type WeightUnit = 'milligram' | 'gram' | 'kilogram' | 'metric-ton' | 'ounce' | 'pound' | 'stone' | 'us-ton' | 'imperial-ton';

interface UnitInfo {
  name: string;
  symbol: string;
  toKilograms: number;
}

const UNITS: Record<WeightUnit, UnitInfo> = {
  milligram: { name: 'Milligram', symbol: 'mg', toKilograms: 0.000001 },
  gram: { name: 'Gram', symbol: 'g', toKilograms: 0.001 },
  kilogram: { name: 'Kilogram', symbol: 'kg', toKilograms: 1 },
  'metric-ton': { name: 'Metric Ton', symbol: 't', toKilograms: 1000 },
  ounce: { name: 'Ounce', symbol: 'oz', toKilograms: 0.0283495 },
  pound: { name: 'Pound', symbol: 'lb', toKilograms: 0.453592 },
  stone: { name: 'Stone', symbol: 'st', toKilograms: 6.35029 },
  'us-ton': { name: 'US Ton', symbol: 'ton', toKilograms: 907.185 },
  'imperial-ton': { name: 'Imperial Ton', symbol: 'long ton', toKilograms: 1016.05 }
};

export const WeightConverter: React.FC = () => {
  const [inputValue, setInputValue] = useState<string>('1');
  const [fromUnit, setFromUnit] = useState<WeightUnit>('kilogram');
  const [toUnit, setToUnit] = useState<WeightUnit>('pound');
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

    const inKilograms = value * UNITS[fromUnit].toKilograms;
    const converted = inKilograms / UNITS[toUnit].toKilograms;
    
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
    { from: 'kilogram', to: 'pound', label: 'kg → lb' },
    { from: 'pound', to: 'kilogram', label: 'lb → kg' },
    { from: 'gram', to: 'ounce', label: 'g → oz' },
    { from: 'metric-ton', to: 'us-ton', label: 't → ton' }
  ];

  return (
    <div className="h-full w-full bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-600 rounded-xl">
            <Weight className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold dark:text-white">Weight Converter</h1>
            <p className="text-gray-600 dark:text-gray-400">Convert between different weight units</p>
          </div>
        </div>

        <Card className="p-6 dark:bg-gray-800">
          <div className="grid md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-semibold mb-2 dark:text-white">From</label>
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full p-3 border-2 rounded-lg text-lg font-semibold dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:border-purple-500 focus:outline-none"
                placeholder="Enter value"
              />
              <select
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value as WeightUnit)}
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
              <Button
                onClick={swapUnits}
                variant="outline"
                size="lg"
                className="rounded-full w-12 h-12 p-0"
              >
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
                  title="Copy result"
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <select
                value={toUnit}
                onChange={(e) => setToUnit(e.target.value as WeightUnit)}
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
            <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
              <p className="text-center text-lg dark:text-white">
                <span className="font-bold">{inputValue} {UNITS[fromUnit].symbol}</span>
                {' = '}
                <span className="font-bold text-purple-600 dark:text-purple-400">{result} {UNITS[toUnit].symbol}</span>
              </p>
            </div>
          )}
        </Card>

        <Card className="p-6 dark:bg-gray-800">
          <h3 className="font-bold text-lg mb-4 dark:text-white">Quick Conversions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickConversions.map((conv, idx) => (
              <Button
                key={idx}
                onClick={() => {
                  setFromUnit(conv.from as WeightUnit);
                  setToUnit(conv.to as WeightUnit);
                }}
                variant="outline"
                className="h-auto py-3"
              >
                {conv.label}
              </Button>
            ))}
          </div>
        </Card>

        <Card className="p-6 dark:bg-gray-800">
          <h3 className="font-bold text-lg mb-4 dark:text-white">
            {inputValue || 1} {UNITS[fromUnit].name} equals:
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {Object.entries(UNITS).map(([key, unit]) => {
              const value = parseFloat(inputValue) || 1;
              const inKg = value * UNITS[fromUnit].toKilograms;
              const converted = inKg / unit.toKilograms;
              const formatted = converted < 0.01 
                ? converted.toExponential(4)
                : converted.toFixed(4).replace(/\.?0+$/, '');
              
              return (
                <div
                  key={key}
                  className={`p-3 rounded-lg border-2 ${
                    key === toUnit 
                      ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500' 
                      : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold dark:text-white">{unit.name}</span>
                    <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {formatted} {unit.symbol}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6 dark:bg-gray-800">
          <h3 className="font-bold text-lg mb-4 dark:text-white">Common Conversions</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm dark:text-gray-300">
            <div>
              <p className="font-semibold mb-2">Metric System:</p>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>• 1 metric ton = 1,000 kg</li>
                <li>• 1 kg = 1,000 g</li>
                <li>• 1 g = 1,000 mg</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">Imperial System:</p>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>• 1 stone = 14 pounds</li>
                <li>• 1 pound = 16 ounces</li>
                <li>• 1 US ton = 2,000 pounds</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
