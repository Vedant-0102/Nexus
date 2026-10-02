import React, { useState } from 'react';
import { Plus, Trash2, Eye, Code, Download, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Element {
  id: string;
  type: 'heading' | 'paragraph' | 'button' | 'input' | 'image' | 'div';
  content: string;
  styles: {
    [key: string]: string;
  };
}

export const NoCodeBuilder: React.FC = () => {
  const [elements, setElements] = useState<Element[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const addElement = (type: Element['type']) => {
    const newElement: Element = {
      id: `element-${Date.now()}`,
      type,
      content: type === 'heading' ? 'New Heading' : 
               type === 'paragraph' ? 'New paragraph text' :
               type === 'button' ? 'Click Me' :
               type === 'input' ? '' :
               type === 'image' ? 'https://via.placeholder.com/300x200' :
               'Container',
      styles: {
        padding: '10px',
        margin: '10px',
      },
    };
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
  };

  const updateElement = (id: string, updates: Partial<Element>) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const updateElementStyle = (id: string, style: string, value: string) => {
    setElements(elements.map(el => 
      el.id === id ? { ...el, styles: { ...el.styles, [style]: value } } : el
    ));
  };

  const deleteElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedElement === id) setSelectedElement(null);
  };

  const generateHTML = () => {
    let html = '<!DOCTYPE html>\n<html>\n<head>\n';
    html += '  <meta charset="UTF-8">\n';
    html += '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
    html += '  <title>My Page</title>\n';
    html += '  <style>\n';
    html += '    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }\n';
    html += '  </style>\n';
    html += '</head>\n<body>\n';

    elements.forEach(el => {
      const styleStr = Object.entries(el.styles)
        .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
        .join('; ');

      switch (el.type) {
        case 'heading':
          html += `  <h1 style="${styleStr}">${el.content}</h1>\n`;
          break;
        case 'paragraph':
          html += `  <p style="${styleStr}">${el.content}</p>\n`;
          break;
        case 'button':
          html += `  <button style="${styleStr}">${el.content}</button>\n`;
          break;
        case 'input':
          html += `  <input type="text" placeholder="${el.content}" style="${styleStr}" />\n`;
          break;
        case 'image':
          html += `  <img src="${el.content}" style="${styleStr}" alt="Image" />\n`;
          break;
        case 'div':
          html += `  <div style="${styleStr}">${el.content}</div>\n`;
          break;
      }
    });

    html += '</body>\n</html>';
    return html;
  };

  const downloadHTML = () => {
    const html = generateHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'page.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    const html = generateHTML();
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const selected = elements.find(el => el.id === selectedElement);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">No-Code Builder</h2>
        <div className="flex gap-2">
          <Button onClick={() => setShowPreview(!showPreview)} variant="outline" size="sm">
            <Eye size={14} className="mr-1" />
            Preview
          </Button>
          <Button onClick={() => setShowCode(!showCode)} variant="outline" size="sm">
            <Code size={14} className="mr-1" />
            Code
          </Button>
          <Button onClick={downloadHTML} size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Download size={14} className="mr-1" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Add Elements */}
        <div className="w-48 border-r border-gray-200 dark:border-gray-700 p-3 space-y-2 overflow-auto bg-gray-50 dark:bg-gray-800">
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">Add Elements</h3>
          <Button onClick={() => addElement('heading')} variant="outline" size="sm" className="w-full justify-start">
            <Plus size={14} className="mr-2" />
            Heading
          </Button>
          <Button onClick={() => addElement('paragraph')} variant="outline" size="sm" className="w-full justify-start">
            <Plus size={14} className="mr-2" />
            Paragraph
          </Button>
          <Button onClick={() => addElement('button')} variant="outline" size="sm" className="w-full justify-start">
            <Plus size={14} className="mr-2" />
            Button
          </Button>
          <Button onClick={() => addElement('input')} variant="outline" size="sm" className="w-full justify-start">
            <Plus size={14} className="mr-2" />
            Input
          </Button>
          <Button onClick={() => addElement('image')} variant="outline" size="sm" className="w-full justify-start">
            <Plus size={14} className="mr-2" />
            Image
          </Button>
          <Button onClick={() => addElement('div')} variant="outline" size="sm" className="w-full justify-start">
            <Plus size={14} className="mr-2" />
            Container
          </Button>
        </div>

        {/* Canvas */}
        <div className="flex-1 p-4 overflow-auto bg-white dark:bg-gray-900">
          {elements.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <Plus size={48} className="mx-auto mb-2 opacity-50" />
                <p>Add elements from the sidebar to start building</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {elements.map(el => (
                <div
                  key={el.id}
                  onClick={() => setSelectedElement(el.id)}
                  className={`relative group cursor-pointer border-2 ${
                    selectedElement === el.id ? 'border-blue-500' : 'border-transparent'
                  } hover:border-blue-300 transition-colors`}
                  style={el.styles}
                >
                  {el.type === 'heading' && <h1 className="text-gray-900 dark:text-gray-100">{el.content}</h1>}
                  {el.type === 'paragraph' && <p className="text-gray-900 dark:text-gray-100">{el.content}</p>}
                  {el.type === 'button' && <button className="px-4 py-2 bg-blue-500 text-white rounded">{el.content}</button>}
                  {el.type === 'input' && <input type="text" placeholder={el.content} className="border px-3 py-2 rounded" />}
                  {el.type === 'image' && <img src={el.content} alt="Element" className="max-w-full" />}
                  {el.type === 'div' && <div className="border border-dashed border-gray-300 p-4 text-gray-900 dark:text-gray-100">{el.content}</div>}
                  
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Properties Panel */}
        {selected && (
          <div className="w-64 border-l border-gray-200 dark:border-gray-700 p-3 space-y-3 overflow-auto bg-gray-50 dark:bg-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Properties</h3>
            
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400">Content</label>
              <Input
                value={selected.content}
                onChange={(e) => updateElement(selected.id, { content: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400">Text Color</label>
              <Input
                type="color"
                value={selected.styles.color || '#000000'}
                onChange={(e) => updateElementStyle(selected.id, 'color', e.target.value)}
                className="mt-1 h-10"
              />
            </div>

            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400">Background</label>
              <Input
                type="color"
                value={selected.styles.backgroundColor || '#ffffff'}
                onChange={(e) => updateElementStyle(selected.id, 'backgroundColor', e.target.value)}
                className="mt-1 h-10"
              />
            </div>

            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400">Font Size</label>
              <Input
                value={selected.styles.fontSize || '16px'}
                onChange={(e) => updateElementStyle(selected.id, 'fontSize', e.target.value)}
                placeholder="16px"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400">Padding</label>
              <Input
                value={selected.styles.padding || '10px'}
                onChange={(e) => updateElementStyle(selected.id, 'padding', e.target.value)}
                placeholder="10px"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400">Margin</label>
              <Input
                value={selected.styles.margin || '10px'}
                onChange={(e) => updateElementStyle(selected.id, 'margin', e.target.value)}
                placeholder="10px"
                className="mt-1"
              />
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPreview(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg w-4/5 h-4/5 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Preview</h3>
              <Button onClick={() => setShowPreview(false)} variant="ghost" size="sm">✕</Button>
            </div>
            <iframe
              srcDoc={generateHTML()}
              className="flex-1 border-none"
              // srcDoc content is same-origin with the app, so without a sandbox
              // the preview could read this page's DOM and localStorage.
              sandbox="allow-scripts"
              title="Preview"
            />
          </div>
        </div>
      )}

      {/* Code Modal */}
      {showCode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCode(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg w-4/5 h-4/5 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Generated Code</h3>
              <div className="flex gap-2">
                <Button 
                  onClick={copyToClipboard} 
                  variant="outline" 
                  size="sm"
                  className={copied ? 'bg-green-50 dark:bg-green-900/20 border-green-500' : ''}
                >
                  {copied ? (
                    <>
                      <Check size={14} className="mr-1 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={14} className="mr-1" />
                      Copy Code
                    </>
                  )}
                </Button>
                <Button onClick={() => setShowCode(false)} variant="ghost" size="sm">✕</Button>
              </div>
            </div>
            <pre className="flex-1 p-4 overflow-auto bg-gray-900 text-green-400 font-mono text-sm">
              {generateHTML()}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
