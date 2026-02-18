import React, { useState, useEffect } from 'react';
import { Sigma, Play, Pause, RotateCcw, Info } from 'lucide-react';

export const PrimeSieve: React.FC = () => {
  const [limit, setLimit] = useState(100);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sieve, setSieve] = useState<boolean[]>([]);
  const [currentPrime, setCurrentPrime] = useState(2);

  useEffect(() => {
    reset();
  }, [limit]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      step();
    }, 500);
    return () => clearInterval(interval);
  }, [isPlaying, currentStep, sieve]);

  const reset = () => {
    const newSieve = Array(limit + 1).fill(true);
    newSieve[0] = false;
    newSieve[1] = false;
    setSieve(newSieve);
    setCurrentStep(0);
    setCurrentPrime(2);
    setIsPlaying(false);
  };

  const step = () => {
    if (currentPrime * currentPrime > limit) {
      setIsPlaying(false);
      return;
    }

    const newSieve = [...sieve];
    for (let i = currentPrime * currentPrime; i <= limit; i += currentPrime) {
      newSieve[i] = false;
    }
    setSieve(newSieve);

    let nextPrime = currentPrime + 1;
    while (nextPrime <= limit && !newSieve[nextPrime]) {
      nextPrime++;
    }
    setCurrentPrime(nextPrime);
    setCurrentStep(currentStep + 1);
  };

  const primes = sieve.map((isPrime, i) => isPrime ? i : -1).filter(n => n > 0);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Sigma className="h-6 w-6 text-amber-600" />
          Prime Number Sieve
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Sieve of Eratosthenes visualization
        </p>
      </div>

      <div className="flex-1 flex gap-6">
        <div className="flex-1 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Current Prime: {currentPrime}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  disabled={currentPrime * currentPrime > limit}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button
                  onClick={step}
                  disabled={currentPrime * currentPrime > limit}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                >
                  Step
                </button>
                <button
                  onClick={reset}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-10 gap-1 max-h-96 overflow-y-auto p-2">
              {sieve.map((isPrime, num) => (
                <div
                  key={num}
                  className={`w-10 h-10 flex items-center justify-center rounded text-sm font-semibold ${
                    num === currentPrime
                      ? 'bg-yellow-400 text-black'
                      : isPrime
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 line-through'
                  }`}
                >
                  {num}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-2">Prime Numbers Found: {primes.length}</h3>
            <div className="text-sm text-gray-700 dark:text-gray-300 max-h-20 overflow-y-auto">
              {primes.join(', ')}
            </div>
          </div>
        </div>

        <div className="w-80 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Limit: {limit}</h3>
            <input
              type="range"
              min="10"
              max="200"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Statistics</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Numbers:</span>
                <span className="font-mono">{limit}</span>
              </div>
              <div className="flex justify-between">
                <span>Primes Found:</span>
                <span className="font-mono">{primes.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Density:</span>
                <span className="font-mono">{((primes.length / limit) * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Legend</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-yellow-400 rounded"></div>
                <span>Current prime</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-500 rounded"></div>
                <span>Prime number</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <span>Composite (crossed out)</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <Info className="h-4 w-4" />
              Algorithm
            </h3>
            <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
              <li>1. Start with 2 (first prime)</li>
              <li>2. Mark all multiples as composite</li>
              <li>3. Find next unmarked number</li>
              <li>4. Repeat until √n</li>
              <li>5. Remaining numbers are prime</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
