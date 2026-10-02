import React, { useState } from 'react';
import { Code, Copy, Check } from 'lucide-react';
import { markdownToHtml } from '@/lib/security/markdown';

export const TextToHTML: React.FC = () => {
  const [markdown, setMarkdown] = useState('# Hello World\n\nThis is **bold** and this is *italic*.\n\n- List item 1\n- List item 2');
  const [copied, setCopied] = useState(false);

  // Shares the escape-first converter with the Markdown editor: user-supplied
  // HTML is escaped before any formatting runs, so the preview below cannot
  // execute injected script.
  const convertToHTML = (md: string): string => markdownToHtml(md);

  const htmlOutput = convertToHTML(markdown);

  const handleCopy = () => {
    navigator.clipboard.writeText(htmlOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col p-6 bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center gap-2 mb-4">
        <Code className="h-6 w-6 text-green-500" />
        <h2 className="text-xl font-bold dark:text-white">Markdown to HTML</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-4 flex-1">
        <div className="flex flex-col">
          <label className="text-sm font-semibold mb-2 dark:text-gray-300">Markdown Input</label>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="flex-1 p-4 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-sm bg-white dark:bg-gray-800 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Enter markdown here..."
          />
        </div>
        
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold dark:text-gray-300">HTML Output</label>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded transition-colors"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="flex-1 p-4 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-sm bg-white dark:bg-gray-800 dark:text-white overflow-auto">
            <pre className="whitespace-pre-wrap break-words">{htmlOutput}</pre>
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold mb-2 dark:text-white">Preview</h3>
        <div 
          className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: htmlOutput }}
        />
      </div>
    </div>
  );
};
