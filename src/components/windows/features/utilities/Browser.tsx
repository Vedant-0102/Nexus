import React, { useState, useRef } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, X, Plus, ExternalLink, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Tab {
    id: string;
    title: string;
    url: string;
    isLoading: boolean;
}

export const Browser: React.FC = () => {
    const [tabs, setTabs] = useState<Tab[]>([
        { id: '1', title: 'Google', url: 'https://www.google.com/webhp?igu=1', isLoading: false }
    ]);
    const [activeTabId, setActiveTabId] = useState('1');
    const [inputUrl, setInputUrl] = useState('https://www.google.com/webhp?igu=1');
    const iframeRefs = useRef<{ [key: string]: HTMLIFrameElement | null }>({});

    const activeTab = tabs.find(t => t.id === activeTabId)!;

    const handleNavigate = (e?: React.FormEvent) => {
        e?.preventDefault();
        let targetUrl = inputUrl.trim();

        if (!targetUrl) return;

        // URL formatting
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            if (targetUrl.includes('.') && !targetUrl.includes(' ')) {
                targetUrl = `https://${targetUrl}`;
            } else {
                targetUrl = `https://www.google.com/search?q=${encodeURIComponent(targetUrl)}&igu=1`;
            }
        }

        // Add igu=1 for Google URLs
        if (targetUrl.includes('google.com') && !targetUrl.includes('igu=1')) {
            targetUrl += targetUrl.includes('?') ? '&igu=1' : '?igu=1';
        }

        updateTab(activeTabId, { url: targetUrl, isLoading: true });
    };

    const handleRefresh = () => {
        const iframe = iframeRefs.current[activeTabId];
        if (iframe) {
            iframe.src = activeTab.url;
            updateTab(activeTabId, { isLoading: true });
        }
    };

    const handleLoad = (tabId: string) => {
        updateTab(tabId, { isLoading: false });

        // Try to get page title from iframe (will fail for cross-origin)
        try {
            const iframe = iframeRefs.current[tabId];
            if (iframe?.contentDocument?.title) {
                updateTab(tabId, { title: iframe.contentDocument.title });
            }
        } catch (e) {
            // Expected for cross-origin iframes
        }
    };

    const updateTab = (tabId: string, updates: Partial<Tab>) => {
        setTabs(prev => prev.map(t => t.id === tabId ? { ...t, ...updates } : t));
    };

    const addTab = () => {
        const newId = Date.now().toString();
        setTabs(prev => [...prev, {
            id: newId,
            title: 'New Tab',
            url: 'https://www.google.com/webhp?igu=1',
            isLoading: false
        }]);
        setActiveTabId(newId);
        setInputUrl('https://www.google.com/webhp?igu=1');
    };

    const closeTab = (tabId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (tabs.length === 1) return;

        const tabIndex = tabs.findIndex(t => t.id === tabId);
        const newTabs = tabs.filter(t => t.id !== tabId);
        setTabs(newTabs);

        if (activeTabId === tabId) {
            const newActiveTab = newTabs[Math.max(0, tabIndex - 1)];
            setActiveTabId(newActiveTab.id);
            setInputUrl(newActiveTab.url);
        }
    };

    const openInNewWindow = () => {
        window.open(activeTab.url, '_blank');
    };

    return (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900">
            {/* Tab Bar */}
            <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-800 px-2 pt-2">
                <div className="flex-1 flex items-center gap-1 overflow-x-auto">
                    {tabs.map(tab => (
                        <div
                            key={tab.id}
                            onClick={() => {
                                setActiveTabId(tab.id);
                                setInputUrl(tab.url);
                            }}
                            className={`group flex items-center gap-2 px-3 py-1.5 min-w-[150px] max-w-[200px] rounded-t-lg cursor-pointer transition-colors ${tab.id === activeTabId
                                    ? 'bg-white dark:bg-gray-900'
                                    : 'bg-gray-300 dark:bg-gray-700 hover:bg-gray-250 dark:hover:bg-gray-650'
                                }`}
                        >
                            {tab.isLoading && <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
                            <span className="flex-1 text-xs truncate">{tab.title}</span>
                            {tabs.length > 1 && (
                                <button
                                    onClick={(e) => closeTab(tab.id, e)}
                                    className="opacity-0 group-hover:opacity-100 hover:bg-gray-400 dark:hover:bg-gray-600 rounded p-0.5 transition-opacity"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={addTab}>
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRefresh}>
                        <RotateCw className={`h-4 w-4 ${activeTab.isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                            setInputUrl('https://www.google.com/webhp?igu=1');
                            updateTab(activeTabId, { url: 'https://www.google.com/webhp?igu=1', isLoading: true });
                        }}
                    >
                        <Home className="h-4 w-4" />
                    </Button>
                </div>

                <form onSubmit={handleNavigate} className="flex-1 flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1.5 border border-transparent focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                    <input
                        type="text"
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-gray-900 dark:text-gray-100 placeholder-gray-500"
                        placeholder="Search Google or type a URL"
                    />
                </form>

                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={openInNewWindow} title="Open in new window">
                    <ExternalLink className="h-4 w-4" />
                </Button>
            </div>

            {/* Browser Content - Render all iframes but only show active */}
            <div className="flex-1 relative bg-white dark:bg-gray-900">
                {tabs.map(tab => (
                    <div
                        key={tab.id}
                        className={`absolute inset-0 ${tab.id === activeTabId ? 'block' : 'hidden'}`}
                    >
                        {tab.isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-10">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                    <p className="text-sm text-gray-600">Loading...</p>
                                </div>
                            </div>
                        )}
                        <iframe
                            ref={el => iframeRefs.current[tab.id] = el}
                            src={tab.url}
                            className="w-full h-full border-none"
                            onLoad={() => handleLoad(tab.id)}
                            title={`Browser Tab ${tab.id}`}
                            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation allow-downloads allow-modals"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        />
                    </div>
                ))}

                {/* Info overlay for blocked sites */}
                {!activeTab.url.includes('google.com') && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-yellow-500/90 text-black text-sm px-4 py-2 rounded-lg shadow-lg flex items-center gap-3">
                        <span>⚠️ This site may block embedding. Click</span>
                        <button
                            onClick={openInNewWindow}
                            className="underline font-semibold hover:text-yellow-900 flex items-center gap-1"
                        >
                            Open in New Tab <ExternalLink className="h-3 w-3" />
                        </button>
                    </div>
                )}
            </div>

            {/* Status Bar */}
            <div className="px-3 py-1 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 flex justify-between">
                <span className="truncate max-w-md">{activeTab.url}</span>
                <span>{tabs.length} tab{tabs.length > 1 ? 's' : ''}</span>
            </div>
        </div>
    );
};
