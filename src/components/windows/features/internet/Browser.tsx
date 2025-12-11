import React, { useState } from 'react';
import { Globe, ArrowLeft, ArrowRight, RefreshCw, Home, Lock, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const PRELOADED_SITES = [
  { name: 'Example', url: 'https://www.example.com', icon: '🌐' },
  { name: 'Wikipedia', url: 'https://www.wikipedia.org', icon: '📚' },
  { name: 'Archive.org', url: 'https://www.archive.org', icon: '📦' },
  { name: 'MDN Docs', url: 'https://developer.mozilla.org', icon: '📖' },
  { name: 'GitHub', url: 'https://github.com', icon: '💻' },
  { name: 'Stack Overflow', url: 'https://stackoverflow.com', icon: '💬' },
  { name: 'CodePen', url: 'https://codepen.io', icon: '✏️' },
  { name: 'W3Schools', url: 'https://www.w3schools.com', icon: '🎓' },
];

export const Browser: React.FC = () => {
  const [url, setUrl] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [showHome, setShowHome] = useState(true);

  const navigate = (newUrl: string) => {
    let fullUrl = newUrl;
    
    // Add https:// if no protocol
    if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
      fullUrl = 'https://' + newUrl;
    }

    setIsLoading(true);
    setShowHome(false);
    setUrl(fullUrl);
    setInputUrl(fullUrl);
    
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(fullUrl);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(inputUrl);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setUrl(history[newIndex]);
      setInputUrl(history[newIndex]);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setUrl(history[newIndex]);
      setInputUrl(history[newIndex]);
    }
  };

  const refresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  };

  const goHome = () => {
    setShowHome(true);
    setUrl('');
    setInputUrl('');
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Browser Controls */}
      <div className="flex items-center gap-2 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <Button
          onClick={goBack}
          disabled={historyIndex === 0}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <ArrowLeft size={16} />
        </Button>
        <Button
          onClick={goForward}
          disabled={historyIndex === history.length - 1}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <ArrowRight size={16} />
        </Button>
        <Button
          onClick={refresh}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </Button>
        <Button
          onClick={goHome}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <Home size={16} />
        </Button>

        {/* Address Bar */}
        <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-full">
            <Lock size={14} className="text-green-600" />
            <Input
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="flex-1 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
              placeholder="Search or enter address"
            />
            <Search size={14} className="text-gray-400" />
          </div>
        </form>
      </div>

      {/* Browser Content */}
      <div className="flex-1 relative bg-white dark:bg-gray-900 overflow-auto">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <RefreshCw size={48} className="animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          </div>
        ) : showHome ? (
          <div className="p-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <Globe size={64} className="mx-auto mb-4 text-blue-500" />
                <h1 className="text-3xl font-bold mb-2 dark:text-white">Welcome to Browser</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Click on any website below to get started
                </p>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4 dark:text-white">Quick Access</h2>
                <div className="grid grid-cols-4 gap-4">
                  {PRELOADED_SITES.map((site) => (
                    <button
                      key={site.url}
                      onClick={() => navigate(site.url)}
                      className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors group"
                    >
                      <div className="text-4xl group-hover:scale-110 transition-transform">
                        {site.icon}
                      </div>
                      <span className="text-sm font-medium dark:text-white">{site.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                  <Lock size={16} />
                  Browser Limitations
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                  Many popular websites (Google, Facebook, YouTube, etc.) block embedding due to security policies.
                  The sites above are known to work well in embedded browsers.
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Tip:</strong> If a site doesn't load, try opening it in a new tab using the browser controls.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <iframe
            key={url}
            src={url}
            className="w-full h-full border-none"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            title="Browser Content"
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="px-3 py-1 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
        <Globe size={12} />
        <span>{url}</span>
      </div>
    </div>
  );
};
