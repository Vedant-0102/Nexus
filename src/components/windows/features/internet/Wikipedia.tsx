import React, { useState } from 'react';
import { Search, ExternalLink, Plus, X } from 'lucide-react';

interface Tab {
  id: number;
  title: string;
  url: string;
}

export const Wikipedia: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 1, title: 'Wikipedia', url: 'https://www.wikipedia.org' }
  ]);
  const [activeTabId, setActiveTabId] = useState(1);
  const [nextTabId, setNextTabId] = useState(2);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const currentUrl = activeTab.url;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const searchUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(searchQuery.trim().replace(/ /g, '_'))}`;
      const title = searchQuery.trim();
      setTabs(tabs.map(t => 
        t.id === activeTabId 
          ? { ...t, url: searchUrl, title }
          : t
      ));
      setSearchQuery('');
    }
  };

  const addNewTab = () => {
    const newTab: Tab = {
      id: nextTabId,
      title: 'Wikipedia',
      url: 'https://www.wikipedia.org'
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(nextTabId);
    setNextTabId(nextTabId + 1);
  };

  const closeTab = (tabId: number) => {
    if (tabs.length === 1) return; // Don't close last tab
    
    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);
    
    if (activeTabId === tabId) {
      setActiveTabId(newTabs[0].id);
    }
  };

  const navigateToUrl = (url: string, title: string) => {
    setTabs(tabs.map(t => 
      t.id === activeTabId 
        ? { ...t, url, title }
        : t
    ));
  };

  const popularArticles = [
    { title: 'Artificial Intelligence', url: 'https://en.wikipedia.org/wiki/Artificial_intelligence' },
    { title: 'Physics', url: 'https://en.wikipedia.org/wiki/Physics' },
    { title: 'Chemistry', url: 'https://en.wikipedia.org/wiki/Chemistry' },
    { title: 'Mathematics', url: 'https://en.wikipedia.org/wiki/Mathematics' },
    { title: 'Computer Science', url: 'https://en.wikipedia.org/wiki/Computer_science' },
    { title: 'Biology', url: 'https://en.wikipedia.org/wiki/Biology' },
    { title: 'History', url: 'https://en.wikipedia.org/wiki/History' },
    { title: 'Geography', url: 'https://en.wikipedia.org/wiki/Geography' },
  ];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Tabs */}
      <div className="flex items-center gap-1 px-2 pt-2 bg-gray-100 dark:bg-gray-800 overflow-x-auto">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-t-lg cursor-pointer min-w-[150px] max-w-[200px] ${
              tab.id === activeTabId
                ? 'bg-white dark:bg-gray-900 border-t border-x dark:border-gray-700'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
            onClick={() => setActiveTabId(tab.id)}
          >
            <span className="text-sm truncate flex-1 dark:text-white">{tab.title}</span>
            {tabs.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                className="p-0.5 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
              >
                <X className="h-3 w-3 dark:text-gray-300" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addNewTab}
          className="p-2 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
          title="New tab"
        >
          <Plus className="h-4 w-4 dark:text-gray-300" />
        </button>
      </div>

      {/* Header */}
      <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-3xl">📚</div>
          <div>
            <h1 className="text-xl font-bold dark:text-white">Wikipedia</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">The Free Encyclopedia</p>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Wikipedia..."
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
          >
            Search
          </button>
        </form>

        {/* Popular Articles */}
        {currentUrl === 'https://www.wikipedia.org' && (
          <div className="mt-4">
            <p className="text-sm font-semibold mb-2 dark:text-gray-300">Popular Articles:</p>
            <div className="flex flex-wrap gap-2">
              {popularArticles.map((article) => (
                <button
                  key={article.url}
                  onClick={() => navigateToUrl(article.url, article.title)}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-sm rounded-full transition-colors"
                >
                  {article.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Wikipedia Content */}
      <div className="flex-1 relative">
        <iframe
          key={currentUrl}
          src={currentUrl}
          className="w-full h-full border-none"
          title="Wikipedia"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
        
        {/* Open in New Tab Button */}
        <button
          onClick={() => window.open(currentUrl, '_blank')}
          className="absolute bottom-4 right-4 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all hover:scale-110"
          title="Open in new tab"
        >
          <ExternalLink className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
