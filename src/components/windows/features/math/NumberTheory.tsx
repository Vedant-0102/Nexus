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
  const [fibCount, setFibCount] = useState(15);
  const [fibResult, setFibResult] = useState<number[] | null>(null);
  const [modA, setModA] = useState(17);
  const [modB, setModB] = useState(5);
  const [modResult, setModResult] = useState<any>(null);

  const MAX_INPUT = 1_000_000;

  const isPrime = (n: number): boolean => {
    if (n < 2) return false;
    if (n === 2 || n === 3) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    for (let i = 5; i * i <= n; i += 6) {
      if (n % i === 0 || n % (i + 2) === 0) return false;
    }
    return true;
  };

  const checkPrime = () => {
    if (number > MAX_INPUT) {
      setPrimeResult({ error: `Number too large (max ${MAX_INPUT.toLocaleString()})` });
      return;
    }
    const prime = isPrime(number);
    let nextPrime = number + 1;
    while (!isPrime(nextPrime) && nextPrime < number + 10000) nextPrime++;
    let prevPrime = number - 1;
    while (prevPrime > 1 && !isPrime(prevPrime)) prevPrime--;

    setPrimeResult({
      number,
      isPrime: prime,
      message: prime ? `${number} is a prime number` : `${number} is not a prime number`,
      nextPrime: nextPrime < number + 10000 ? nextPrime : null,
      prevPrime: prevPrime > 1 ? prevPrime : null,
    });
  };

  const gcd = (a: number, b: number): number => {
    a = Math.abs(a); b = Math.abs(b);
    return b === 0 ? a : gcd(b, a % b);
  };

  const lcm = (a: number, b: number): number => {
    return Math.abs(a * b) / gcd(a, b);
  };

  const calculateGCD = () => {
    const gcdVal = gcd(number, number2);
    const lcmVal = lcm(number, number2);
    const coprime = gcdVal === 1;
    setGcdResult({ num1: number, num2: number2, gcd: gcdVal, lcm: lcmVal, coprime });
  };

  const getFactors = (n: number): number[] => {
    if (n > MAX_INPUT) return [];
    const factors: number[] = [];
    for (let i = 1; i * i <= n; i++) {
      if (n % i === 0) {
        factors.push(i);
        if (i !== n / i) factors.push(n / i);
      }
    }
    return factors.sort((a, b) => a - b);
  };

  const getPrimeFactors = (n: number): number[] => {
    if (n > MAX_INPUT) return [];
    const factors: number[] = [];
    let num = Math.abs(n);
    for (let i = 2; i * i <= num; i++) {
      while (num % i === 0) {
        factors.push(i);
        num = num / i;
      }
    }
    if (num > 1) factors.push(num);
    return factors;
  };

  const calculateFactors = () => {
    if (number > MAX_INPUT) {
      setFactorResult({ error: `Number too large (max ${MAX_INPUT.toLocaleString()})` });
      return;
    }
    if (number < 1) {
      setFactorResult({ error: 'Enter a positive integer' });
      return;
    }
    const factors = getFactors(number);
    const primeFactors = getPrimeFactors(number);

    // Format prime factorization with exponents
    const pf: Record<number, number> = {};
    for (const f of primeFactors) pf[f] = (pf[f] || 0) + 1;
    const pfFormatted = Object.entries(pf).map(([base, exp]) =>
      exp > 1 ? `${base}^${exp}` : `${base}`
    ).join(' × ');

    setFactorResult({
      number,
      factors,
      primeFactors,
      pfFormatted,
      factorCount: factors.length,
      isPerfect: factors.slice(0, -1).reduce((a, b) => a + b, 0) === number,
    });
  };

  const generateFibonacci = () => {
    const count = Math.min(Math.max(fibCount, 2), 100);
    const seq: number[] = [0, 1];
    for (let i = 2; i < count; i++) {
      seq.push(seq[i - 1] + seq[i - 2]);
    }
    setFibResult(seq.slice(0, count));
  };

  const calculateMod = () => {
    if (modB === 0) {
      setModResult({ error: 'Cannot divide by zero' });
      return;
    }
    const remainder = ((modA % modB) + modB) % modB;
    const quotient = Math.floor(modA / modB);
    setModResult({
      a: modA,
      b: modB,
      remainder,
      quotient,
      equation: `${modA} = ${quotient} × ${modB} + ${remainder}`,
    });
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <h1 className="text-2xl font-bold dark:text-white mb-4">Number Theory</h1>

      <Tabs defaultValue="prime" className="flex-1">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="prime">Prime</TabsTrigger>
          <TabsTrigger value="gcd">GCD/LCM</TabsTrigger>
          <TabsTrigger value="factors">Factors</TabsTrigger>
          <TabsTrigger value="fibonacci">Fibonacci</TabsTrigger>
          <TabsTrigger value="modular">Mod</TabsTrigger>
        </TabsList>

        {/* Prime Check */}
        <TabsContent value="prime" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-lg font-bold mb-4 dark:text-white">Prime Number Checker</h3>
              <div className="space-y-4">
                <div>
                  <Label>Number</Label>
                  <Input
                    type="number"
                    value={number}
                    onChange={(e) => setNumber(parseInt(e.target.value) || 0)}
                    onKeyDown={(e) => e.key === 'Enter' && checkPrime()}
                  />
                </div>
                <Button onClick={checkPrime} className="w-full">Check if Prime</Button>
              </div>
            </Card>

            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-lg font-bold mb-4 dark:text-white">Result</h3>
              {primeResult ? (
                primeResult.error ? (
                  <p className="text-sm text-red-500">{primeResult.error}</p>
                ) : (
                  <div className="space-y-3">
                    <div className={`p-4 rounded ${primeResult.isPrime ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
                      <p className={`text-lg font-bold ${primeResult.isPrime ? 'text-green-900 dark:text-green-300' : 'text-red-900 dark:text-red-300'}`}>
                        {primeResult.message}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {primeResult.prevPrime && (
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Previous Prime</p>
                          <p className="text-sm font-bold dark:text-white">{primeResult.prevPrime}</p>
                        </div>
                      )}
                      {primeResult.nextPrime && (
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Next Prime</p>
                          <p className="text-sm font-bold dark:text-white">{primeResult.nextPrime}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">Enter a number and check</p>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* GCD & LCM */}
        <TabsContent value="gcd" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-lg font-bold mb-4 dark:text-white">GCD & LCM Calculator</h3>
              <div className="space-y-4">
                <div>
                  <Label>First Number</Label>
                  <Input
                    type="number"
                    value={number}
                    onChange={(e) => setNumber(parseInt(e.target.value) || 0)}
                    onKeyDown={(e) => e.key === 'Enter' && calculateGCD()}
                  />
                </div>
                <div>
                  <Label>Second Number</Label>
                  <Input
                    type="number"
                    value={number2}
                    onChange={(e) => setNumber2(parseInt(e.target.value) || 0)}
                    onKeyDown={(e) => e.key === 'Enter' && calculateGCD()}
                  />
                </div>
                <Button onClick={calculateGCD} className="w-full">Calculate</Button>
              </div>
            </Card>

            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-lg font-bold mb-4 dark:text-white">Results</h3>
              {gcdResult ? (
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Greatest Common Divisor</p>
                    <p className="text-xl font-bold text-green-900 dark:text-green-300">
                      GCD({gcdResult.num1}, {gcdResult.num2}) = {gcdResult.gcd}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Least Common Multiple</p>
                    <p className="text-xl font-bold text-purple-900 dark:text-purple-300">
                      LCM({gcdResult.num1}, {gcdResult.num2}) = {gcdResult.lcm}
                    </p>
                  </div>
                  {gcdResult.coprime && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded">
                      <p className="text-sm text-yellow-800 dark:text-yellow-300">
                        These numbers are coprime (GCD = 1)
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">Enter two numbers and calculate</p>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Factors */}
        <TabsContent value="factors" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-lg font-bold mb-4 dark:text-white">Factor Calculator</h3>
              <div className="space-y-4">
                <div>
                  <Label>Number</Label>
                  <Input
                    type="number"
                    value={number}
                    onChange={(e) => setNumber(parseInt(e.target.value) || 0)}
                    onKeyDown={(e) => e.key === 'Enter' && calculateFactors()}
                  />
                  <p className="text-xs text-gray-400 mt-1">Max: {MAX_INPUT.toLocaleString()}</p>
                </div>
                <Button onClick={calculateFactors} className="w-full">Find Factors</Button>
              </div>
            </Card>

            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-lg font-bold mb-4 dark:text-white">Results</h3>
              {factorResult ? (
                factorResult.error ? (
                  <p className="text-sm text-red-500">{factorResult.error}</p>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">All Factors of {factorResult.number}</p>
                      <p className="font-mono text-sm dark:text-white break-all">
                        {factorResult.factors.join(', ')}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">Total: {factorResult.factorCount} factors</p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Prime Factorization</p>
                      <p className="font-mono text-lg font-bold text-purple-900 dark:text-purple-300">
                        {factorResult.pfFormatted}
                      </p>
                    </div>
                    {factorResult.isPerfect && (
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded">
                        <p className="text-sm text-yellow-800 dark:text-yellow-300">
                          {factorResult.number} is a perfect number!
                        </p>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">Enter a number and find factors</p>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Fibonacci */}
        <TabsContent value="fibonacci" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-lg font-bold mb-4 dark:text-white">Fibonacci Generator</h3>
              <div className="space-y-4">
                <div>
                  <Label>Number of terms (2-100)</Label>
                  <Input
                    type="number"
                    min={2}
                    max={100}
                    value={fibCount}
                    onChange={(e) => setFibCount(parseInt(e.target.value) || 2)}
                    onKeyDown={(e) => e.key === 'Enter' && generateFibonacci()}
                  />
                </div>
                <Button onClick={generateFibonacci} className="w-full">Generate Sequence</Button>
              </div>
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded text-xs text-gray-600 dark:text-gray-400">
                <p>F(n) = F(n-1) + F(n-2)</p>
                <p>Starting: F(0) = 0, F(1) = 1</p>
              </div>
            </Card>

            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-lg font-bold mb-4 dark:text-white">Sequence</h3>
              {fibResult ? (
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded max-h-80 overflow-auto">
                    <div className="grid grid-cols-1 gap-1">
                      {fibResult.map((val, i) => (
                        <div key={i} className="flex justify-between text-sm font-mono dark:text-white">
                          <span className="text-gray-500 dark:text-gray-400">F({i})</span>
                          <span className="font-bold">{val.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded text-xs text-gray-600 dark:text-gray-400">
                    <p>Golden ratio: {fibResult.length >= 3
                      ? (fibResult[fibResult.length - 1] / fibResult[fibResult.length - 2]).toFixed(8)
                      : 'Need more terms'
                    }</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">Set count and generate</p>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Modular Arithmetic */}
        <TabsContent value="modular" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-lg font-bold mb-4 dark:text-white">Modular Arithmetic</h3>
              <div className="space-y-4">
                <div>
                  <Label>a (dividend)</Label>
                  <Input
                    type="number"
                    value={modA}
                    onChange={(e) => setModA(parseInt(e.target.value) || 0)}
                    onKeyDown={(e) => e.key === 'Enter' && calculateMod()}
                  />
                </div>
                <div>
                  <Label>b (divisor / modulus)</Label>
                  <Input
                    type="number"
                    value={modB}
                    onChange={(e) => setModB(parseInt(e.target.value) || 0)}
                    onKeyDown={(e) => e.key === 'Enter' && calculateMod()}
                  />
                </div>
                <Button onClick={calculateMod} className="w-full">Calculate a mod b</Button>
              </div>
            </Card>

            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-lg font-bold mb-4 dark:text-white">Result</h3>
              {modResult ? (
                modResult.error ? (
                  <p className="text-sm text-red-500">{modResult.error}</p>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Remainder</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-300">
                        {modResult.a} mod {modResult.b} = {modResult.remainder}
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Division Equation</p>
                      <p className="text-sm font-mono font-bold dark:text-white">
                        {modResult.equation}
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Quotient (floor)</p>
                      <p className="text-lg font-bold text-purple-900 dark:text-purple-300">
                        {modResult.quotient}
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">Enter values and calculate</p>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
