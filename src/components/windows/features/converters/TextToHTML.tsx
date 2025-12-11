import React, { useState } from 'react';
import { Code, Copy, Check } from 'lucide-react';

export const TextToHTML: React.FC = () => {
  const [markdown, setMarkdown] = useState('# Hello World\n\nThis is **bold** and this is *italic*.\n\n- List item 1\n- List item 2');
  const [copied, setCopied] = useState(false);

  const convertToHTML = (md: string): string => {
    let html = md;
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
    
    // Lists
    html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';
    
    return html;
  };

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
