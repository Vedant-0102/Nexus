import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const PercentageCalculator = () => {
  // What is X% of Y?
  const [percent1, setPercent1] = useState(20);
  const [value1, setValue1] = useState(100);
  const [result1, setResult1] = useState<number | null>(null);

  // X is what % of Y?
  const [value2, setValue2] = useState(25);
  const [total2, setTotal2] = useState(100);
  const [result2, setResult2] = useState<number | null>(null);

  // Percentage change
  const [oldValue, setOldValue] = useState(50);
  const [newValue, setNewValue] = useState(75);
  const [changeResult, setChangeResult] = useState<any>(null);

  const calculatePercentOf = () => {
    setResult1((percent1 / 100) * value1);
  };

  const calculateWhatPercent = () => {
    setResult2((value2 / total2) * 100);
  };

  const calculatePercentChange = () => {
    const change = newValue - oldValue;
    const percentChange = (change / oldValue) * 100;
    setChangeResult({
      change,
      percentChange,
      isIncrease: change > 0
    });
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <h1 className="text-2xl font-bold dark:text-white mb-6">Percentage Calculator</h1>

      <Tabs defaultValue="of" className="flex-1">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="of">% of Value</TabsTrigger>
          <TabsTrigger value="what">What %</TabsTrigger>
          <TabsTrigger value="change">% Change</TabsTrigger>
        </TabsList>

        <TabsContent value="of" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-xl font-bold mb-4 dark:text-white">What is X% of Y?</h3>
              
              <div className="space-y-4">
                <div>
                  <Label>Percentage (%)</Label>
                  <Input
                    type="number"
                    value={percent1}
                    onChange={(e) => setPercent1(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Value</Label>
                  <Input
                    type="number"
                    value={value1}
                    onChange={(e) => setValue1(parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <Button onClick={calculatePercentOf} className="w-full">
                  Calculate
                </Button>
              </div>

              <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/30 rounded text-sm dark:text-gray-300">
                <p><strong>Example:</strong> What is 20% of 100?</p>
                <p className="mt-1">Answer: 20</p>
              </div>
            </Card>

            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-xl font-bold mb-4 dark:text-white">Result</h3>
              {result1 !== null ? (
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Answer:</p>
                    <p className="text-3xl font-bold text-green-900 dark:text-green-300">
                      {result1.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded">
                    <p className="text-sm dark:text-white">
                      {percent1}% of {value1} = {result1.toFixed(2)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Enter values and calculate</p>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="what" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-xl font-bold mb-4 dark:text-white">X is what % of Y?</h3>
              
              <div className="space-y-4">
                <div>
                  <Label>Value (X)</Label>
                  <Input
                    type="number"
                    value={value2}
                    onChange={(e) => setValue2(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Total (Y)</Label>
                  <Input
                    type="number"
                    value={total2}
                    onChange={(e) => setTotal2(parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <Button onClick={calculateWhatPercent} className="w-full">
                  Calculate
                </Button>
              </div>

              <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/30 rounded text-sm dark:text-gray-300">
                <p><strong>Example:</strong> 25 is what % of 100?</p>
                <p className="mt-1">Answer: 25%</p>
              </div>
            </Card>

            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-xl font-bold mb-4 dark:text-white">Result</h3>
              {result2 !== null ? (
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Answer:</p>
                    <p className="text-3xl font-bold text-green-900 dark:text-green-300">
                      {result2.toFixed(2)}%
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded">
                    <p className="text-sm dark:text-white">
                      {value2} is {result2.toFixed(2)}% of {total2}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Enter values and calculate</p>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="change" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-xl font-bold mb-4 dark:text-white">Percentage Change</h3>
              
              <div className="space-y-4">
                <div>
                  <Label>Old Value</Label>
                  <Input
                    type="number"
                    value={oldValue}
                    onChange={(e) => setOldValue(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>New Value</Label>
                  <Input
                    type="number"
                    value={newValue}
                    onChange={(e) => setNewValue(parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <Button onClick={calculatePercentChange} className="w-full">
                  Calculate Change
                </Button>
              </div>

              <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/30 rounded text-sm dark:text-gray-300">
                <p><strong>Formula:</strong> ((New - Old) / Old) × 100</p>
                <p className="mt-1"><strong>Example:</strong> From 50 to 75 = 50% increase</p>
              </div>
            </Card>

            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-xl font-bold mb-4 dark:text-white">Result</h3>
              {changeResult ? (
                <div className="space-y-3">
                  <div className={`p-4 rounded ${changeResult.isIncrease ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {changeResult.isIncrease ? 'Increase' : 'Decrease'}:
                    </p>
                    <p className={`text-3xl font-bold ${changeResult.isIncrease ? 'text-green-900 dark:text-green-300' : 'text-red-900 dark:text-red-300'}`}>
                      {changeResult.isIncrease ? '+' : ''}{changeResult.percentChange.toFixed(2)}%
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded">
                    <p className="text-sm dark:text-white">
                      Absolute change: {changeResult.change > 0 ? '+' : ''}{changeResult.change.toFixed(2)}
                    </p>
                    <p className="text-sm dark:text-white mt-1">
                      From {oldValue} to {newValue}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Enter values and calculate</p>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
