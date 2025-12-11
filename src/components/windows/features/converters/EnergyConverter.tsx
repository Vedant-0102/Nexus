import React, { useState, useEffect } from 'react';
import { Zap, ArrowRightLeft, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type EnergyUnit = 'joule' | 'kilojoule' | 'calorie' | 'kilocalorie' | 'wh' | 'kwh' | 'ev';

interface UnitInfo {
  name: string;
  symbol: string;
  toJoules: number;
}

const UNITS: Record<EnergyUnit, UnitInfo> = {
  joule: { name: 'Joule', symbol: 'J', toJoules: 1 },
  kilojoule: { name: 'Kilojoule', symbol: 'kJ', toJoules: 1000 },
  calorie: { name: 'Calorie', symbol: 'cal', toJoules: 4.184 },
  kilocalorie: { name: 'Kilocalorie', symbol: 'kcal', toJoules: 4184 },
  wh: { name: 'Watt-hour', symbol: 'Wh', toJoules: 3600 },
  kwh: { name: 'Kilowatt-hour', symbol: 'kWh', toJoules: 3.6e6 },
  ev: { name: 'Electronvolt', symbol: 'eV', toJoules: 1.602e-19 },
};

export const EnergyConverter: React.FC = () => {
  const [inputValue, setInputValue] = useState<string>('1000');
  const [fromUnit, setFromUnit] = useState<EnergyUnit>('joule');
  const [toUnit, setToUnit] = useState<EnergyUnit>('calorie');
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

    const inJoules = value * UNITS[fromUnit].toJoules;
    const converted = inJoules / UNITS[toUnit].toJoules;
    const formatted = Math.abs(converted) < 0.0001 || Math.abs(converted) > 1e6
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
    <div className="h-full w-full bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-6">

        <Card className="p-6 dark:bg-gray-800">
          <div className="grid md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-semibold mb-2 dark:text-white">From</label>
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full p-3 border-2 rounded-lg text-lg font-semibold dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:border-yellow-500 focus:outline-none"
              />
              <select
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value as EnergyUnit)}
                className="w-full mt-2 p-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
              >
                {Object.entries(UNITS).map(([key, unit]) => (
                  <option key={key} value={key}>{unit.name} ({unit.symbol})</option>
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
                />
                <button onClick={copyResult} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <select
                value={toUnit}
                onChange={(e) => setToUnit(e.target.value as EnergyUnit)}
                className="w-full mt-2 p-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
              >
                {Object.entries(UNITS).map(([key, unit]) => (
                  <option key={key} value={key}>{unit.name} ({unit.symbol})</option>
                ))}
              </select>
            </div>
          </div>

          {result && (
            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-yellow-200 dark:border-yellow-800">
              <p className="text-center text-lg dark:text-white">
                <span className="font-bold">{inputValue} {UNITS[fromUnit].symbol}</span>
                {' = '}
                <span className="font-bold text-yellow-600 dark:text-yellow-400">{result} {UNITS[toUnit].symbol}</span>
              </p>
            </div>
          )}
        </Card>

        <Card className="p-6 dark:bg-gray-800">
          <h3 className="font-bold text-lg mb-4 dark:text-white">All Conversions</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {Object.entries(UNITS).map(([key, unit]) => {
              const value = parseFloat(inputValue) || 1;
              const inJoules = value * UNITS[fromUnit].toJoules;
              const converted = inJoules / unit.toJoules;
              const formatted = Math.abs(converted) < 0.0001 || Math.abs(converted) > 1e6
                ? converted.toExponential(4)
                : converted.toFixed(4).replace(/\.?0+$/, '');
              
              return (
                <div key={key} className={`p-3 rounded-lg border-2 ${key === toUnit ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold dark:text-white text-sm">{unit.name}</span>
                    <span className="text-base font-bold text-yellow-600 dark:text-yellow-400">{formatted} {unit.symbol}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};
