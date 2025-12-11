import React, { useState, useEffect } from 'react';
import { Thermometer, ArrowRightLeft, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type TempUnit = 'celsius' | 'fahrenheit' | 'kelvin' | 'rankine';

interface UnitInfo {
  name: string;
  symbol: string;
  toCelsius: (value: number) => number;
  fromCelsius: (value: number) => number;
}

const UNITS: Record<TempUnit, UnitInfo> = {
  celsius: {
    name: 'Celsius',
    symbol: '°C',
    toCelsius: (v) => v,
    fromCelsius: (v) => v,
  },
  fahrenheit: {
    name: 'Fahrenheit',
    symbol: '°F',
    toCelsius: (v) => (v - 32) * 5/9,
    fromCelsius: (v) => v * 9/5 + 32,
  },
  kelvin: {
    name: 'Kelvin',
    symbol: 'K',
    toCelsius: (v) => v - 273.15,
    fromCelsius: (v) => v + 273.15,
  },
  rankine: {
    name: 'Rankine',
    symbol: '°R',
    toCelsius: (v) => (v - 491.67) * 5/9,
    fromCelsius: (v) => v * 9/5 + 491.67,
  },
};

export const TemperatureConverter: React.FC = () => {
  const [inputValue, setInputValue] = useState<string>('0');
  const [fromUnit, setFromUnit] = useState<TempUnit>('celsius');
  const [toUnit, setToUnit] = useState<TempUnit>('fahrenheit');
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

    const inCelsius = UNITS[fromUnit].toCelsius(value);
    const converted = UNITS[toUnit].fromCelsius(inCelsius);
    const formatted = converted.toFixed(2).replace(/\.?0+$/, '');
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
    <div className="h-full w-full bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-6">

        <Card className="p-6 dark:bg-gray-800">
          <div className="grid md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-semibold mb-2 dark:text-white">From</label>
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full p-3 border-2 rounded-lg text-lg font-semibold dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:border-red-500 focus:outline-none"
                placeholder="Enter value"
              />
              <select
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value as TempUnit)}
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
                onChange={(e) => setToUnit(e.target.value as TempUnit)}
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
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-red-200 dark:border-red-800">
              <p className="text-center text-lg dark:text-white">
                <span className="font-bold">{inputValue} {UNITS[fromUnit].symbol}</span>
                {' = '}
                <span className="font-bold text-red-600 dark:text-red-400">{result} {UNITS[toUnit].symbol}</span>
              </p>
            </div>
          )}
        </Card>

        <Card className="p-6 dark:bg-gray-800">
          <h3 className="font-bold text-lg mb-4 dark:text-white">All Conversions</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {Object.entries(UNITS).map(([key, unit]) => {
              const value = parseFloat(inputValue) || 0;
              const inCelsius = UNITS[fromUnit].toCelsius(value);
              const converted = unit.fromCelsius(inCelsius);
              const formatted = converted.toFixed(2).replace(/\.?0+$/, '');
              
              return (
                <div
                  key={key}
                  className={`p-3 rounded-lg border-2 ${
                    key === toUnit 
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-500' 
                      : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold dark:text-white">{unit.name}</span>
                    <span className="text-lg font-bold text-red-600 dark:text-red-400">
                      {formatted} {unit.symbol}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6 dark:bg-gray-800">
          <h3 className="font-bold text-lg mb-4 dark:text-white">Reference Points</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm dark:text-gray-300">
            <div>
              <p className="font-semibold mb-2">Water Freezing Point:</p>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>• 0°C</li>
                <li>• 32°F</li>
                <li>• 273.15 K</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">Water Boiling Point:</p>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>• 100°C</li>
                <li>• 212°F</li>
                <li>• 373.15 K</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
