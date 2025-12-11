import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  history: { time: string; price: number }[];
}

const DEMO_STOCKS: Stock[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 178.50, change: 2.35, changePercent: 1.33, volume: 52000000, history: [] },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.80, change: -1.20, changePercent: -0.83, volume: 28000000, history: [] },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 378.90, change: 4.50, changePercent: 1.20, volume: 31000000, history: [] },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 242.15, change: -3.85, changePercent: -1.56, volume: 95000000, history: [] },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 151.25, change: 1.75, changePercent: 1.17, volume: 42000000, history: [] },
];

export const StockMarket: React.FC = () => {
  const [stocks, setStocks] = useState<Stock[]>(DEMO_STOCKS);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    // Initialize history for all stocks
    const now = new Date();
    const initializedStocks = stocks.map(stock => ({
      ...stock,
      history: Array.from({ length: 20 }, (_, i) => ({
        time: new Date(now.getTime() - (19 - i) * 60000).toLocaleTimeString(),
        price: stock.price + (Math.random() - 0.5) * 5
      }))
    }));
    setStocks(initializedStocks);
    setSelectedStock(initializedStocks[0]);
  }, []);

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setStocks(prevStocks =>
        prevStocks.map(stock => {
          const priceChange = (Math.random() - 0.5) * 2;
          const newPrice = Math.max(stock.price + priceChange, 1);
          const change = newPrice - stock.price;
          const changePercent = (change / stock.price) * 100;

          const newHistory = [
            ...stock.history.slice(1),
            {
              time: new Date().toLocaleTimeString(),
              price: newPrice
            }
          ];

          return {
            ...stock,
            price: newPrice,
            change: stock.change + change,
            changePercent: stock.changePercent + changePercent,
            history: newHistory
          };
        })
      );

      if (selectedStock) {
        setSelectedStock(prev => {
          if (!prev) return null;
          const updated = stocks.find(s => s.symbol === prev.symbol);
          return updated || prev;
        });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isLive, selectedStock]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatVolume = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    }
    return `${(num / 1000).toFixed(0)}K`;
  };

  const filteredStocks = stocks.filter(stock =>
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full w-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Stock Market</h2>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsLive(!isLive)}
                variant={isLive ? 'default' : 'outline'}
                size="sm"
              >
                {isLive ? (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2" />
                    Live
                  </>
                ) : (
                  'Start Live'
                )}
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Input
            placeholder="Search stocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-4"
          />

          <div className="grid gap-2">
            {filteredStocks.map((stock) => (
              <Card
                key={stock.symbol}
                className={`p-4 cursor-pointer hover:shadow-lg transition-all ${
                  selectedStock?.symbol === stock.symbol ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedStock(stock)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{stock.symbol}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{stock.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl">{formatNumber(stock.price)}</p>
                    <div className={`flex items-center gap-1 ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stock.change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      <span className="text-sm font-semibold">
                        {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Volume: {formatVolume(stock.volume)}
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {selectedStock && (
          <Card className="p-6">
            <div className="mb-4">
              <h3 className="text-2xl font-bold">{selectedStock.symbol}</h3>
              <p className="text-gray-600 dark:text-gray-400">{selectedStock.name}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Price</p>
                <p className="text-2xl font-bold">{formatNumber(selectedStock.price)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Change</p>
                <p className={`text-2xl font-bold ${selectedStock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedStock.change >= 0 ? '+' : ''}{selectedStock.change.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Change %</p>
                <p className={`text-2xl font-bold ${selectedStock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedStock.changePercent >= 0 ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Volume</p>
                <p className="text-2xl font-bold">{formatVolume(selectedStock.volume)}</p>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={selectedStock.history}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={['auto', 'auto']} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke={selectedStock.change >= 0 ? '#10b981' : '#ef4444'}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ Demo Mode: This is simulated data for demonstration purposes. For real-time data, integrate with APIs like Alpha Vantage, Finnhub, or IEX Cloud.
          </p>
        </Card>
      </div>
    </div>
  );
};
