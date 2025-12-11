import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, Save, Download, Upload, Bold, Italic, Underline, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Undo, Redo, Type, Palette, Highlighter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface LineStyle {
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  bgColor?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: 'left' | 'center' | 'right' | 'justify';
}

interface Line {
  id: string;
  text: string;
  style: LineStyle;
}

interface Document {
  id: string;
  name: string;
  lines: Line[];
  lastModified: Date;
}

export const TextEditor: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocId, setActiveDocId] = useState<string>('');
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [textColor, setTextColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#FFFF00');
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('text-editor-docs-v2');
    if (saved) {
      const docs = JSON.parse(saved);
      setDocuments(docs);
      if (docs.length > 0) {
        setActiveDocId(docs[0].id);
      }
    } else {
      createNewDocument();
    }
  }, []);

  useEffect(() => {
    if (documents.length > 0) {
      localStorage.setItem('text-editor-docs-v2', JSON.stringify(documents));
    }
  }, [documents]);

  const createNewDocument = () => {
    const newDoc: Document = {
      id: Date.now().toString(),
      name: `Document ${documents.length + 1}`,
      lines: [{ id: Date.now().toString(), text: '', style: {} }],
      lastModified: new Date()
    };
    setDocuments([...documents, newDoc]);
    setActiveDocId(newDoc.id);
  };

  const updateLine = (lineId: string, text: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === activeDocId 
        ? { 
            ...doc, 
            lines: doc.lines.map(line => 
              line.id === lineId ? { ...line, text } : line
            ),
            lastModified: new Date()
          }
        : doc
    ));
  };

  const addLine = (afterLineId?: string) => {
    const newLine: Line = {
      id: Date.now().toString(),
      text: '',
      style: {}
    };
    
    setDocuments(prev => prev.map(doc => {
      if (doc.id !== activeDocId) return doc;
      
      if (!afterLineId) {
        return { ...doc, lines: [...doc.lines, newLine], lastModified: new Date() };
      }
      
      const index = doc.lines.findIndex(l => l.id === afterLineId);
      const newLines = [...doc.lines];
      newLines.splice(index + 1, 0, newLine);
      return { ...doc, lines: newLines, lastModified: new Date() };
    }));
    
    return newLine.id;
  };

  const deleteLine = (lineId: string) => {
    setDocuments(prev => prev.map(doc => {
      if (doc.id !== activeDocId) return doc;
      if (doc.lines.length <= 1) return doc;
      
      return {
        ...doc,
        lines: doc.lines.filter(l => l.id !== lineId),
        lastModified: new Date()
      };
    }));
  };

  const applyStyleToLine = (lineId: string, style: Partial<LineStyle>) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === activeDocId 
        ? {
            ...doc,
            lines: doc.lines.map(line =>
              line.id === lineId
                ? { ...line, style: { ...line.style, ...style } }
                : line
            ),
            lastModified: new Date()
          }
        : doc
    ));
  };

  const downloadDocument = () => {
    const activeDoc = documents.find(d => d.id === activeDocId);
    if (!activeDoc) return;
    
    const htmlLines = activeDoc.lines.map(line => {
      const style: string[] = [];
      if (line.style.fontSize) style.push(`font-size: ${line.style.fontSize}px`);
      if (line.style.fontFamily) style.push(`font-family: ${line.style.fontFamily}`);
      if (line.style.textColor) style.push(`color: ${line.style.textColor}`);
      if (line.style.bgColor) style.push(`background-color: ${line.style.bgColor}`);
      if (line.style.bold) style.push('font-weight: bold');
      if (line.style.italic) style.push('font-style: italic');
      if (line.style.underline) style.push('text-decoration: underline');
      if (line.style.align) style.push(`text-align: ${line.style.align}`);
      
      return `<p style="${style.join('; ')}">${line.text || '<br>'}</p>`;
    }).join('\n');
    
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${activeDoc.name}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
    p { margin: 8px 0; line-height: 1.6; }
  </style>
</head>
<body>
  ${htmlLines}
</body>
</html>`;
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeDoc.name.replace(/\s+/g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const uploadDocument = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          const lines = content.split('\n').map((text, idx) => ({
            id: `${Date.now()}-${idx}`,
            text,
            style: {}
          }));
          
          const newDoc: Document = {
            id: Date.now().toString(),
            name: file.name,
            lines: lines.length > 0 ? lines : [{ id: Date.now().toString(), text: '', style: {} }],
            lastModified: new Date()
          };
          setDocuments([...documents, newDoc]);
          setActiveDocId(newDoc.id);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const activeDoc = documents.find(d => d.id === activeDocId);

  return (
    <div className="h-full w-full bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b dark:border-gray-700">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-500" />
          <h2 className="font-semibold dark:text-white">Text Editor</h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={createNewDocument} size="sm" variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            New
          </Button>
          <Button onClick={uploadDocument} size="sm" variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Open
          </Button>
          <Button 
            onClick={() => {
              // Auto-saves on every change, just show feedback
              const btn = document.activeElement as HTMLButtonElement;
              const originalText = btn?.textContent;
              if (btn) btn.textContent = '✓ Saved';
              setTimeout(() => {
                if (btn && originalText) btn.textContent = originalText;
              }, 1000);
            }} 
            size="sm" 
            variant="outline"
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button onClick={downloadDocument} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Document Tabs */}
      {documents.length > 0 && (
        <div className="flex items-center gap-1 px-2 py-1 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-x-auto">
          {documents.map(doc => (
            <div
              key={doc.id}
              onClick={() => {
                setActiveDocId(doc.id);
                setSelectedLineId(null);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-t cursor-pointer transition-colors ${
                activeDocId === doc.id
                  ? 'bg-white dark:bg-gray-900 border-t border-x dark:border-gray-700'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <input
                type="text"
                value={doc.name}
                onChange={(e) => {
                  e.stopPropagation();
                  setDocuments(prev => prev.map(d => 
                    d.id === doc.id ? { ...d, name: e.target.value } : d
                  ));
                }}
                onClick={(e) => e.stopPropagation()}
                className="text-sm bg-transparent border-none outline-none w-32 dark:text-white"
              />
              {documents.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newDocs = documents.filter(d => d.id !== doc.id);
                    setDocuments(newDocs);
                    if (activeDocId === doc.id && newDocs.length > 0) {
                      setActiveDocId(newDocs[0].id);
                    }
                  }}
                  className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 text-lg"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-2 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        {selectedLineId ? (
          <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded">
            Line Selected - Apply formatting
          </span>
        ) : (
          <span className="text-xs text-gray-500 dark:text-gray-400 px-2">
            Click a line to format it
          </span>
        )}

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

        {/* Font Family */}
        <select
          value={fontFamily}
          onChange={(e) => {
            setFontFamily(e.target.value);
            if (selectedLineId) {
              applyStyleToLine(selectedLineId, { fontFamily: e.target.value });
            }
          }}
          disabled={!selectedLineId}
          className="px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 disabled:opacity-50"
        >
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
          <option value="Georgia">Georgia</option>
          <option value="Verdana">Verdana</option>
          <option value="Comic Sans MS">Comic Sans MS</option>
        </select>

        {/* Font Size */}
        <select
          value={fontSize}
          onChange={(e) => {
            setFontSize(parseInt(e.target.value));
            if (selectedLineId) {
              applyStyleToLine(selectedLineId, { fontSize: parseInt(e.target.value) });
            }
          }}
          disabled={!selectedLineId}
          className="px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 disabled:opacity-50"
        >
          <option value="12">12</option>
          <option value="14">14</option>
          <option value="16">16</option>
          <option value="18">18</option>
          <option value="20">20</option>
          <option value="24">24</option>
          <option value="28">28</option>
          <option value="32">32</option>
          <option value="36">36</option>
          <option value="48">48</option>
        </select>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

        {/* Text Formatting */}
        <Button 
          onClick={() => selectedLineId && applyStyleToLine(selectedLineId, { bold: true })} 
          size="sm" 
          variant="outline" 
          title="Bold"
          disabled={!selectedLineId}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button 
          onClick={() => selectedLineId && applyStyleToLine(selectedLineId, { italic: true })} 
          size="sm" 
          variant="outline" 
          title="Italic"
          disabled={!selectedLineId}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button 
          onClick={() => selectedLineId && applyStyleToLine(selectedLineId, { underline: true })} 
          size="sm" 
          variant="outline" 
          title="Underline"
          disabled={!selectedLineId}
        >
          <Underline className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

        {/* Text Color */}
        <div className="flex items-center gap-1">
          <input
            type="color"
            value={textColor}
            onChange={(e) => {
              setTextColor(e.target.value);
              if (selectedLineId) {
                applyStyleToLine(selectedLineId, { textColor: e.target.value });
              }
            }}
            disabled={!selectedLineId}
            className="w-8 h-8 rounded cursor-pointer disabled:opacity-50"
            title="Text Color"
          />
          <Palette className="h-4 w-4 text-gray-500" />
        </div>

        {/* Highlight Color */}
        <div className="flex items-center gap-1">
          <input
            type="color"
            value={bgColor}
            onChange={(e) => {
              setBgColor(e.target.value);
              if (selectedLineId) {
                applyStyleToLine(selectedLineId, { bgColor: e.target.value });
              }
            }}
            disabled={!selectedLineId}
            className="w-8 h-8 rounded cursor-pointer disabled:opacity-50"
            title="Highlight Color"
          />
          <Highlighter className="h-4 w-4 text-gray-500" />
        </div>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

        {/* Alignment */}
        <Button 
          onClick={() => selectedLineId && applyStyleToLine(selectedLineId, { align: 'left' })} 
          size="sm" 
          variant="outline" 
          title="Align Left"
          disabled={!selectedLineId}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button 
          onClick={() => selectedLineId && applyStyleToLine(selectedLineId, { align: 'center' })} 
          size="sm" 
          variant="outline" 
          title="Align Center"
          disabled={!selectedLineId}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button 
          onClick={() => selectedLineId && applyStyleToLine(selectedLineId, { align: 'right' })} 
          size="sm" 
          variant="outline" 
          title="Align Right"
          disabled={!selectedLineId}
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button 
          onClick={() => selectedLineId && applyStyleToLine(selectedLineId, { align: 'justify' })} 
          size="sm" 
          variant="outline" 
          title="Justify"
          disabled={!selectedLineId}
        >
          <AlignJustify className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto p-6 bg-gray-100 dark:bg-gray-900">
        <Card className="max-w-4xl mx-auto min-h-full p-8 bg-white dark:bg-gray-800">
          <div ref={editorRef} className="min-h-[600px]">
            {activeDoc?.lines.map((line, index) => (
              <div
                key={line.id}
                className={`group relative mb-2 ${
                  selectedLineId === line.id ? 'ring-2 ring-blue-500 rounded' : ''
                }`}
                onClick={() => setSelectedLineId(line.id)}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xs text-gray-400 dark:text-gray-600 w-8 pt-2 select-none">
                    {index + 1}
                  </span>
                  <textarea
                    value={line.text}
                    onChange={(e) => updateLine(line.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        const newLineId = addLine(line.id);
                        setTimeout(() => setSelectedLineId(newLineId), 0);
                      } else if (e.key === 'Backspace' && line.text === '' && activeDoc.lines.length > 1) {
                        e.preventDefault();
                        const currentIndex = activeDoc.lines.findIndex(l => l.id === line.id);
                        if (currentIndex > 0) {
                          setSelectedLineId(activeDoc.lines[currentIndex - 1].id);
                        }
                        deleteLine(line.id);
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-transparent border-none outline-none resize-none overflow-hidden dark:text-white"
                    style={{
                      fontSize: line.style.fontSize ? `${line.style.fontSize}px` : '16px',
                      fontFamily: line.style.fontFamily || 'Arial',
                      color: line.style.textColor || 'inherit',
                      backgroundColor: line.style.bgColor || 'transparent',
                      fontWeight: line.style.bold ? 'bold' : 'normal',
                      fontStyle: line.style.italic ? 'italic' : 'normal',
                      textDecoration: line.style.underline ? 'underline' : 'none',
                      textAlign: line.style.align || 'left',
                      lineHeight: '1.6',
                      minHeight: '32px'
                    }}
                    rows={1}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = target.scrollHeight + 'px';
                    }}
                    placeholder={index === 0 && line.text === '' ? 'Start typing...' : ''}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (activeDoc.lines.length > 1) {
                        deleteLine(line.id);
                        if (selectedLineId === line.id) {
                          setSelectedLineId(null);
                        }
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-opacity"
                    title="Delete line"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between p-2 border-t dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
        <span>
          {activeDoc && `Last saved: ${new Date(activeDoc.lastModified).toLocaleTimeString()}`}
        </span>
        <span>
          {documents.length} document{documents.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
};
