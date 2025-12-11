import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
export const StatisticsCalculator = () => {
  const [dataSet, setDataSet] = useState('1, 2, 3, 4, 5');
  const [statsResult, setStatsResult] = useState<any>(null);

  const calculateStats = () => {
    const numbers = dataSet.split(',').map(n => parseFloat(n.trim())).filter(n => !isNaN(n));
    
    if (numbers.length === 0) {
      setStatsResult({ error: 'Invalid data' });
      return;
    }
    
    const sum = numbers.reduce((a, b) => a + b, 0);
    const mean = sum / numbers.length;
    const sorted = [...numbers].sort((a, b) => a - b);
    const median = numbers.length % 2 === 0
      ? (sorted[numbers.length / 2 - 1] + sorted[numbers.length / 2]) / 2
      : sorted[Math.floor(numbers.length / 2)];
    
    const variance = numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;
    const stdDev = Math.sqrt(variance);
    
    setStatsResult({
      count: numbers.length,
      sum: sum.toFixed(4),
      mean: mean.toFixed(4),
      median: median.toFixed(4),
      min: Math.min(...numbers).toFixed(4),
      max: Math.max(...numbers).toFixed(4),
      range: (Math.max(...numbers) - Math.min(...numbers)).toFixed(4),
      variance: variance.toFixed(4),
      stdDev: stdDev.toFixed(4)
    });
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <h1 className="text-2xl font-bold dark:text-white mb-6">Statistics Calculator</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 dark:bg-gray-800">
          <h3 className="text-xl font-bold mb-4 dark:text-white">Data Input</h3>
          
          <div className="space-y-4">
            <div>
              <Label>Data Set (comma-separated)</Label>
              <Input
                value={dataSet}
                onChange={(e) => setDataSet(e.target.value)}
                placeholder="1, 2, 3, 4, 5"
              />
            </div>
            
            <Button onClick={calculateStats} className="w-full">
              Calculate Statistics
            </Button>
          </div>
        </Card>

        <Card className="p-6 dark:bg-gray-800">
          <h3 className="text-xl font-bold mb-4 dark:text-white">Results</h3>
          {statsResult ? (
            statsResult.error ? (
              <p className="text-red-500">{statsResult.error}</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Count</p>
                  <p className="text-lg font-bold dark:text-white">{statsResult.count}</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Sum</p>
                  <p className="text-lg font-bold dark:text-white">{statsResult.sum}</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Mean</p>
                  <p className="text-lg font-bold dark:text-white">{statsResult.mean}</p>
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Median</p>
                  <p className="text-lg font-bold dark:text-white">{statsResult.median}</p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Min</p>
                  <p className="text-lg font-bold dark:text-white">{statsResult.min}</p>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Max</p>
                  <p className="text-lg font-bold dark:text-white">{statsResult.max}</p>
                </div>
                <div className="p-3 bg-pink-50 dark:bg-pink-900/30 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Range</p>
                  <p className="text-lg font-bold dark:text-white">{statsResult.range}</p>
                </div>
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Std Dev</p>
                  <p className="text-lg font-bold dark:text-white">{statsResult.stdDev}</p>
                </div>
              </div>
            )
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Enter data and click calculate</p>
          )}
        </Card>
      </div>
    </div>
  );
};
