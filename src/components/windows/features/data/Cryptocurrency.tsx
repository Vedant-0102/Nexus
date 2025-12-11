import React, { useState, useEffect } from 'react';
import { Bitcoin, TrendingUp, TrendingDown, Search } from 'lucide-react';

interface Crypto {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  marketCap: number;
}

export const Cryptocurrency: React.FC = () => {
  const [cryptos, setCryptos] = useState<Crypto[]>([
    { id: '1', name: 'Bitcoin', symbol: 'BTC', price: 43250.50, change24h: 2.45, marketCap: 845000000000 },
    { id: '2', name: 'Ethereum', symbol: 'ETH', price: 2280.75, change24h: -1.23, marketCap: 274000000000 },
    { id: '3', name: 'Binance Coin', symbol: 'BNB', price: 312.40, change24h: 3.67, marketCap: 48000000000 },
    { id: '4', name: 'Solana', symbol: 'SOL', price: 98.25, change24h: 5.12, marketCap: 42000000000 },
    { id: '5', name: 'Cardano', symbol: 'ADA', price: 0.58, change24h: -2.34, marketCap: 20000000000 },
    { id: '6', name: 'Ripple', symbol: 'XRP', price: 0.62, change24h: 1.89, marketCap: 33000000000 },
  ]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setCryptos(prev => prev.map(crypto => ({
        ...crypto,
        price: crypto.price * (1 + (Math.random() - 0.5) * 0.02),
        change24h: crypto.change24h + (Math.random() - 0.5) * 0.5
      })));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const filteredCryptos = cryptos.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.symbol.toLowerCase().includes(search.toLowerCase())
  );

  const formatMarketCap = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toFixed(2)}`;
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-gray-900 dark:to-gray-800">
      <div className="p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Bitcoin className="h-6 w-6 text-orange-500" />
          <h2 className="text-xl font-bold dark:text-white">Cryptocurrency</h2>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search crypto..."
            className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        <div className="grid gap-3">
          {filteredCryptos.map(crypto => (
            <div
              key={crypto.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-yellow-400 flex items-center justify-center text-white font-bold">
                    {crypto.symbol.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold dark:text-white">{crypto.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{crypto.symbol}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-xl font-bold dark:text-white">
                    ${crypto.price.toFixed(2)}
                  </p>
                  <div className={`flex items-center gap-1 ${
                    crypto.change24h >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {crypto.change24h >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span className="text-sm font-semibold">
                      {Math.abs(crypto.change24h).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="pt-2 border-t dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Market Cap: <span className="font-semibold">{formatMarketCap(crypto.marketCap)}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
