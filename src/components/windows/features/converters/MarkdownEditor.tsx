import React, { useState, useEffect } from 'react';
import { FileText, Eye, Code, Download, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const MarkdownEditor: React.FC = () => {
  const [markdown, setMarkdown] = useState(`# Welcome to Markdown Editor

## Features
- **Live Preview** - See your markdown rendered in real-time
- **Syntax Highlighting** - Easy to read markdown syntax
- **Export Options** - Download as .md or HTML
- **Copy to Clipboard** - Quick copy functionality

## Markdown Syntax Guide

### Headers
# H1 Header
## H2 Header
### H3 Header

### Text Formatting
**Bold Text**
*Italic Text*
~~Strikethrough~~
\`Inline Code\`

### Lists
- Bullet point 1
- Bullet point 2
  - Nested item

1. Numbered item 1
2. Numbered item 2

### Links and Images
[Link Text](https://example.com)
![Alt Text](image-url.jpg)

### Code Blocks
\`\`\`javascript
function hello() {
  console.log("Hello World!");
}
\`\`\`

### Blockquotes
> This is a blockquote
> It can span multiple lines

### Tables
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
| Data 4   | Data 5   | Data 6   |

### Horizontal Rule
---

Start editing to see the live preview!
`);
  const [activeTab, setActiveTab] = useState('split');
  const [copied, setCopied] = useState(false);

  // Simple markdown to HTML converter
  const convertMarkdownToHTML = (md: string): string => {
    let html = md;

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // Strikethrough
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
    
    // Inline code
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');
    
    // Code blocks
    html = html.replace(/```(\w+)?\n([\s\S]+?)```/g, '<pre><code class="language-$1">$2</code></pre>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
    
    // Blockquotes
    html = html.replace(/^> (.+)$/gim, '<blockquote>$1</blockquote>');
    
    // Horizontal rule
    html = html.replace(/^---$/gim, '<hr />');
    
    // Unordered lists
    html = html.replace(/^\- (.+)$/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Ordered lists
    html = html.replace(/^\d+\. (.+)$/gim, '<li>$1</li>');
    
    // Tables
    html = html.replace(/\|(.+)\|/g, (match) => {
      const cells = match.split('|').filter(cell => cell.trim());
      return '<tr>' + cells.map(cell => `<td>${cell.trim()}</td>`).join('') + '</tr>';
    });
    html = html.replace(/(<tr>.*<\/tr>)/s, '<table>$1</table>');
    
    // Line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';
    
    return html;
  };

  const downloadMarkdown = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadHTML = () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Document</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    h1, h2, h3 { margin-top: 24px; margin-bottom: 16px; font-weight: 600; }
    h1 { font-size: 2em; border-bottom: 1px solid #eee; padding-bottom: 8px; }
    h2 { font-size: 1.5em; }
    h3 { font-size: 1.25em; }
    code { background: #f6f8fa; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
    pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow-x: auto; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 16px; color: #666; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    td, th { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background: #f6f8fa; font-weight: 600; }
    img { max-width: 100%; height: auto; }
    a { color: #0366d6; text-decoration: none; }
    a:hover { text-decoration: underline; }
    hr { border: none; border-top: 1px solid #eee; margin: 24px 0; }
    ul, ol { padding-left: 24px; }
    li { margin: 4px 0; }
  </style>
</head>
<body>
  ${convertMarkdownToHTML(markdown)}
</body>
</html>`;
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold dark:text-white">Markdown Editor</h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={copyToClipboard} size="sm" variant="outline">
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button onClick={downloadMarkdown} size="sm" variant="outline">
            <Download className="h-4 w-4 mr-2" />
            .md
          </Button>
          <Button onClick={downloadHTML} size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            HTML
          </Button>
        </div>
      </div>

      {/* View Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-4 mt-2">
          <TabsTrigger value="split">
            <Code className="h-4 w-4 mr-2" />
            Split View
          </TabsTrigger>
          <TabsTrigger value="edit">
            <FileText className="h-4 w-4 mr-2" />
            Edit
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </TabsTrigger>
        </TabsList>

        {/* Split View */}
        <TabsContent value="split" className="flex-1 flex overflow-hidden mt-0 data-[state=inactive]:hidden">
          <div className="flex-1 flex overflow-hidden">
            {/* Editor */}
            <div className="flex-1 border-r dark:border-gray-700 flex flex-col">
              <div className="p-2 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <span className="text-sm font-semibold dark:text-white">Markdown</span>
              </div>
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                className="flex-1 p-4 font-mono text-sm resize-none outline-none dark:bg-gray-900 dark:text-white"
                placeholder="Enter your markdown here..."
              />
            </div>

            {/* Preview */}
            <div className="flex-1 flex flex-col">
              <div className="p-2 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <span className="text-sm font-semibold dark:text-white">Preview</span>
              </div>
              <div 
                className="flex-1 p-4 overflow-auto prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: convertMarkdownToHTML(markdown) }}
                style={{
                  lineHeight: '1.6',
                }}
              />
            </div>
          </div>
        </TabsContent>

        {/* Edit Only */}
        <TabsContent value="edit" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden">
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="w-full h-full p-4 font-mono text-sm resize-none outline-none dark:bg-gray-900 dark:text-white"
            placeholder="Enter your markdown here..."
          />
        </TabsContent>

        {/* Preview Only */}
        <TabsContent value="preview" className="flex-1 overflow-auto mt-0 data-[state=inactive]:hidden">
          <div 
            className="p-4 prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: convertMarkdownToHTML(markdown) }}
            style={{
              lineHeight: '1.6',
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Status Bar */}
      <div className="p-2 border-t dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 flex items-center justify-between bg-gray-50 dark:bg-gray-800">
        <span>
          {markdown.split('\n').length} lines | {markdown.length} characters | {markdown.split(/\s+/).filter(w => w).length} words
        </span>
        <span className="text-blue-600 dark:text-blue-400">
          Live Preview Active
        </span>
      </div>
    </div>
  );
};
