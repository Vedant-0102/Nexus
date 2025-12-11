import React, { useState, useEffect } from 'react';
import { Droplet, ArrowRightLeft, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type VolumeUnit = 'liter' | 'milliliter' | 'gallon' | 'quart' | 'pint' | 'cup' | 'floz' | 'm3';

interface UnitInfo {
  name: string;
  symbol: string;
  toLiters: number;
}

const UNITS: Record<VolumeUnit, UnitInfo> = {
  liter: { name: 'Liter', symbol: 'L', toLiters: 1 },
  milliliter: { name: 'Milliliter', symbol: 'mL', toLiters: 0.001 },
  gallon: { name: 'Gallon (US)', symbol: 'gal', toLiters: 3.78541 },
  quart: { name: 'Quart', symbol: 'qt', toLiters: 0.946353 },
  pint: { name: 'Pint', symbol: 'pt', toLiters: 0.473176 },
  cup: { name: 'Cup', symbol: 'cup', toLiters: 0.236588 },
  floz: { name: 'Fluid Ounce', symbol: 'fl oz', toLiters: 0.0295735 },
  m3: { name: 'Cubic Meter', symbol: 'm³', toLiters: 1000 },
};

export const VolumeConverter: React.FC = () => {
  const [inputValue, setInputValue] = useState<string>('1');
  const [fromUnit, setFromUnit] = useState<VolumeUnit>('liter');
  const [toUnit, setToUnit] = useState<VolumeUnit>('gallon');
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

    const inLiters = value * UNITS[fromUnit].toLiters;
    const converted = inLiters / UNITS[toUnit].toLiters;
    const formatted = converted < 0.01 ? converted.toExponential(6) : converted.toFixed(6).replace(/\.?0+$/, '');
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
    <div className="h-full w-full bg-gradient-to-br from-sky-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-6">

        <Card className="p-6 dark:bg-gray-800">
          <div className="grid md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-semibold mb-2 dark:text-white">From</label>
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full p-3 border-2 rounded-lg text-lg font-semibold dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:border-sky-500 focus:outline-none"
              />
              <select
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value as VolumeUnit)}
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
                onChange={(e) => setToUnit(e.target.value as VolumeUnit)}
                className="w-full mt-2 p-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
              >
                {Object.entries(UNITS).map(([key, unit]) => (
                  <option key={key} value={key}>{unit.name} ({unit.symbol})</option>
                ))}
              </select>
            </div>
          </div>

          {result && (
            <div className="mt-6 p-4 bg-sky-50 dark:bg-sky-900/20 rounded-lg border-2 border-sky-200 dark:border-sky-800">
              <p className="text-center text-lg dark:text-white">
                <span className="font-bold">{inputValue} {UNITS[fromUnit].symbol}</span>
                {' = '}
                <span className="font-bold text-sky-600 dark:text-sky-400">{result} {UNITS[toUnit].symbol}</span>
              </p>
            </div>
          )}
        </Card>

        <Card className="p-6 dark:bg-gray-800">
          <h3 className="font-bold text-lg mb-4 dark:text-white">All Conversions</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {Object.entries(UNITS).map(([key, unit]) => {
              const value = parseFloat(inputValue) || 1;
              const inLiters = value * UNITS[fromUnit].toLiters;
              const converted = inLiters / unit.toLiters;
              const formatted = converted < 0.01 ? converted.toExponential(4) : converted.toFixed(4).replace(/\.?0+$/, '');
              
              return (
                <div key={key} className={`p-3 rounded-lg border-2 ${key === toUnit ? 'bg-sky-50 dark:bg-sky-900/20 border-sky-500' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold dark:text-white text-sm">{unit.name}</span>
                    <span className="text-base font-bold text-sky-600 dark:text-sky-400">{formatted} {unit.symbol}</span>
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
