import React, { useState, useEffect } from 'react';
import { DollarSign, ArrowRightLeft, Copy, Check, TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY' | 'INR' | 'AUD' | 'CAD' | 'CHF' | 'MXN' | 'BRL' | 'ZAR' | 'RUB' | 'KRW' | 'SGD' | 'HKD' | 'NOK' | 'SEK' | 'DKK' | 'NZD';

interface CurrencyInfo {
  name: string;
  symbol: string;
  flag: string;
}

const CURRENCIES: Record<Currency, CurrencyInfo> = {
  USD: { name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  EUR: { name: 'Euro', symbol: '€', flag: '🇪🇺' },
  GBP: { name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  JPY: { name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  CNY: { name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  INR: { name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  AUD: { name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  CAD: { name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  CHF: { name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭' },
  MXN: { name: 'Mexican Peso', symbol: '$', flag: '🇲🇽' },
  BRL: { name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
  ZAR: { name: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
  RUB: { name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺' },
  KRW: { name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
  SGD: { name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  HKD: { name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰' },
  NOK: { name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴' },
  SEK: { name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪' },
  DKK: { name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰' },
  NZD: { name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿' }
};

// Mock exchange rates (in production, fetch from API)
const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.50,
  CNY: 7.24,
  INR: 83.12,
  AUD: 1.53,
  CAD: 1.36,
  CHF: 0.88,
  MXN: 17.05,
  BRL: 4.97,
  ZAR: 18.65,
  RUB: 92.50,
  KRW: 1320.00,
  SGD: 1.34,
  HKD: 7.82,
  NOK: 10.87,
  SEK: 10.52,
  DKK: 6.87,
  NZD: 1.65
};

export const CurrencyConverter: React.FC = () => {
  const [inputValue, setInputValue] = useState<string>('100');
  const [fromCurrency, setFromCurrency] = useState<Currency>('USD');
  const [toCurrency, setToCurrency] = useState<Currency>('EUR');
  const [result, setResult] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    calculateConversion();
  }, [inputValue, fromCurrency, toCurrency]);

  const calculateConversion = () => {
    const value = parseFloat(inputValue);
    if (isNaN(value)) {
      setResult('');
      return;
    }

    // Convert to USD first, then to target currency
    const inUSD = value / EXCHANGE_RATES[fromCurrency];
    const converted = inUSD * EXCHANGE_RATES[toCurrency];
    
    const formatted = converted.toFixed(2);
    setResult(formatted);
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const copyResult = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const refreshRates = () => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsRefreshing(false);
      calculateConversion();
    }, 1000);
  };

  const popularPairs = [
    { from: 'USD', to: 'EUR' },
    { from: 'USD', to: 'GBP' },
    { from: 'EUR', to: 'USD' },
    { from: 'GBP', to: 'USD' }
  ];

  const getExchangeRate = () => {
    if (!inputValue || isNaN(parseFloat(inputValue))) return null;
    const rate = (EXCHANGE_RATES[toCurrency] / EXCHANGE_RATES[fromCurrency]).toFixed(4);
    return rate;
  };

  return (
    <div className="h-full w-full bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-600 rounded-xl">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold dark:text-white">Currency Converter</h1>
              <p className="text-gray-600 dark:text-gray-400">Real-time exchange rates</p>
            </div>
          </div>
          <Button
            onClick={refreshRates}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Card className="p-6 dark:bg-gray-800">
          <div className="grid md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-semibold mb-2 dark:text-white">From</label>
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full p-3 border-2 rounded-lg text-lg font-semibold dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:border-green-500 focus:outline-none"
                placeholder="Enter amount"
              />
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value as Currency)}
                className="w-full mt-2 p-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
              >
                {Object.entries(CURRENCIES).map(([code, info]) => (
                  <option key={code} value={code}>
                    {info.flag} {code} - {info.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={swapCurrencies}
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
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value as Currency)}
                className="w-full mt-2 p-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
              >
                {Object.entries(CURRENCIES).map(([code, info]) => (
                  <option key={code} value={code}>
                    {info.flag} {code} - {info.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {result && (
            <div className="mt-6 space-y-3">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-800">
                <p className="text-center text-lg dark:text-white">
                  <span className="font-bold">{CURRENCIES[fromCurrency].symbol}{inputValue} {fromCurrency}</span>
                  {' = '}
                  <span className="font-bold text-green-600 dark:text-green-400">
                    {CURRENCIES[toCurrency].symbol}{result} {toCurrency}
                  </span>
                </p>
              </div>
              
              {getExchangeRate() && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <TrendingUp className="h-4 w-4" />
                  <span>
                    1 {fromCurrency} = {getExchangeRate()} {toCurrency}
                  </span>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card className="p-6 dark:bg-gray-800">
          <h3 className="font-bold text-lg mb-4 dark:text-white">Popular Currency Pairs</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {popularPairs.map((pair, idx) => (
              <Button
                key={idx}
                onClick={() => {
                  setFromCurrency(pair.from as Currency);
                  setToCurrency(pair.to as Currency);
                }}
                variant="outline"
                className="h-auto py-3 flex flex-col gap-1"
              >
                <span className="text-xs opacity-70">{pair.from} → {pair.to}</span>
                <span className="font-bold">
                  {(EXCHANGE_RATES[pair.to as Currency] / EXCHANGE_RATES[pair.from as Currency]).toFixed(4)}
                </span>
              </Button>
            ))}
          </div>
        </Card>

        <Card className="p-6 dark:bg-gray-800">
          <h3 className="font-bold text-lg mb-4 dark:text-white">
            {inputValue || 1} {fromCurrency} equals:
          </h3>
          <div className="grid md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            {Object.entries(CURRENCIES).map(([code, info]) => {
              const value = parseFloat(inputValue) || 1;
              const inUSD = value / EXCHANGE_RATES[fromCurrency];
              const converted = inUSD * EXCHANGE_RATES[code as Currency];
              const formatted = converted.toFixed(2);
              
              return (
                <div
                  key={code}
                  className={`p-3 rounded-lg border-2 ${
                    code === toCurrency 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-500' 
                      : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{info.flag}</span>
                      <div>
                        <div className="font-semibold dark:text-white">{code}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{info.name}</div>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {info.symbol}{formatted}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-4 dark:bg-gray-800 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
            <span className="text-gray-500 dark:text-gray-500 text-xs">
              * Rates are indicative and may vary
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
};
