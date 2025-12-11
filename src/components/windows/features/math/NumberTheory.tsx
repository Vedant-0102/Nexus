import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const NumberTheory = () => {
  const [number, setNumber] = useState(12);
  const [number2, setNumber2] = useState(18);
  const [primeResult, setPrimeResult] = useState<any>(null);
  const [gcdResult, setGcdResult] = useState<any>(null);
  const [factorResult, setFactorResult] = useState<any>(null);

  const isPrime = (n: number): boolean => {
    if (n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;
    for (let i = 3; i <= Math.sqrt(n); i += 2) {
      if (n % i === 0) return false;
    }
    return true;
  };

  const checkPrime = () => {
    const prime = isPrime(number);
    setPrimeResult({
      number,
      isPrime: prime,
      message: prime ? `${number} is a prime number` : `${number} is not a prime number`
    });
  };

  const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b);
  };

  const lcm = (a: number, b: number): number => {
    return (a * b) / gcd(a, b);
  };

  const calculateGCD = () => {
    const gcdVal = gcd(number, number2);
    const lcmVal = lcm(number, number2);
    setGcdResult({
      num1: number,
      num2: number2,
      gcd: gcdVal,
      lcm: lcmVal
    });
  };

  const getFactors = (n: number): number[] => {
    const factors: number[] = [];
    for (let i = 1; i <= n; i++) {
      if (n % i === 0) factors.push(i);
    }
    return factors;
  };

  const getPrimeFactors = (n: number): number[] => {
    const factors: number[] = [];
    let num = n;
    
    for (let i = 2; i <= num; i++) {
      while (num % i === 0) {
        factors.push(i);
        num = num / i;
      }
    }
    return factors;
  };

  const calculateFactors = () => {
    const factors = getFactors(number);
    const primeFactors = getPrimeFactors(number);
    setFactorResult({
      number,
      factors,
      primeFactors,
      factorCount: factors.length
    });
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <h1 className="text-2xl font-bold dark:text-white mb-6">Number Theory</h1>

      <Tabs defaultValue="prime" className="flex-1">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="prime">Prime Check</TabsTrigger>
          <TabsTrigger value="gcd">GCD & LCM</TabsTrigger>
          <TabsTrigger value="factors">Factors</TabsTrigger>
        </TabsList>

        <TabsContent value="prime" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-xl font-bold mb-4 dark:text-white">Prime Number Checker</h3>
              
              <div className="space-y-4">
                <div>
                  <Label>Number</Label>
                  <Input
                    type="number"
                    value={number}
                    onChange={(e) => setNumber(parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <Button onClick={checkPrime} className="w-full">
                  Check if Prime
                </Button>
              </div>
            </Card>

            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-xl font-bold mb-4 dark:text-white">Result</h3>
              {primeResult ? (
                <div className="space-y-3">
                  <div className={`p-4 rounded ${primeResult.isPrime ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
                    <p className={`text-xl font-bold ${primeResult.isPrime ? 'text-green-900 dark:text-green-300' : 'text-red-900 dark:text-red-300'}`}>
                      {primeResult.message}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded text-sm dark:text-gray-300">
                    <p><strong>Definition:</strong> A prime number is a natural number greater than 1 that has no positive divisors other than 1 and itself.</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Enter a number and check</p>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gcd" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-xl font-bold mb-4 dark:text-white">GCD & LCM Calculator</h3>
              
              <div className="space-y-4">
                <div>
                  <Label>First Number</Label>
                  <Input
                    type="number"
                    value={number}
                    onChange={(e) => setNumber(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Second Number</Label>
                  <Input
                    type="number"
                    value={number2}
                    onChange={(e) => setNumber2(parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <Button onClick={calculateGCD} className="w-full">
                  Calculate
                </Button>
              </div>
            </Card>

            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-xl font-bold mb-4 dark:text-white">Results</h3>
              {gcdResult ? (
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Greatest Common Divisor</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-300">
                      GCD({gcdResult.num1}, {gcdResult.num2}) = {gcdResult.gcd}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Least Common Multiple</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                      LCM({gcdResult.num1}, {gcdResult.num2}) = {gcdResult.lcm}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded text-sm dark:text-gray-300">
                    <p><strong>GCD:</strong> The largest positive integer that divides both numbers.</p>
                    <p className="mt-1"><strong>LCM:</strong> The smallest positive integer divisible by both numbers.</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Enter two numbers and calculate</p>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="factors" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-xl font-bold mb-4 dark:text-white">Factor Calculator</h3>
              
              <div className="space-y-4">
                <div>
                  <Label>Number</Label>
                  <Input
                    type="number"
                    value={number}
                    onChange={(e) => setNumber(parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <Button onClick={calculateFactors} className="w-full">
                  Find Factors
                </Button>
              </div>
            </Card>

            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-xl font-bold mb-4 dark:text-white">Results</h3>
              {factorResult ? (
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">All Factors of {factorResult.number}</p>
                    <p className="font-mono text-sm dark:text-white">
                      {factorResult.factors.join(', ')}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Total: {factorResult.factorCount} factors</p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Prime Factorization</p>
                    <p className="font-mono text-lg font-bold text-purple-900 dark:text-purple-300">
                      {factorResult.primeFactors.join(' × ')}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Enter a number and find factors</p>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
