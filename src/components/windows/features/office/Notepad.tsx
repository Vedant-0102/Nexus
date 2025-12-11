import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Save, Download, Upload, Copy, Clipboard, Scissors, 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, 
  List, ListOrdered, Search, Replace, Undo, Redo, 
  ZoomIn, ZoomOut, Type, Palette, FileCode, FileJson,
  Hash, Calendar, Clock, Eye, EyeOff, Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Document {
  id: string;
  name: string;
  content: string;
  lastModified: Date;
}

export const Notepad: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocId, setActiveDocId] = useState<string>('');
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(14);
  const [fontFamily, setFontFamily] = useState('monospace');
  const [lineHeight, setLineHeight] = useState(1.5);
  const [textColor, setTextColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [activeTab, setActiveTab] = useState('editor');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Load documents from localStorage
  useEffect(() => {
    const savedDocs = localStorage.getItem('notepad-documents');
    if (savedDocs) {
      const docs = JSON.parse(savedDocs);
      setDocuments(docs);
      if (docs.length > 0) {
        setActiveDocId(docs[0].id);
        setText(docs[0].content);
      }
    } else {
      // Create default document
      const defaultDoc: Document = {
        id: Date.now().toString(),
        name: 'Untitled.txt',
        content: '',
        lastModified: new Date()
      };
      setDocuments([defaultDoc]);
      setActiveDocId(defaultDoc.id);
    }
  }, []);

  // Save documents to localStorage
  useEffect(() => {
    if (documents.length > 0) {
      localStorage.setItem('notepad-documents', JSON.stringify(documents));
    }
  }, [documents]);

  // Update active document content
  useEffect(() => {
    if (activeDocId) {
      setDocuments(prev => prev.map(doc => 
        doc.id === activeDocId 
          ? { ...doc, content: text, lastModified: new Date() }
          : doc
      ));
    }
  }, [text, activeDocId]);

  // History management
  useEffect(() => {
    const timer = setTimeout(() => {
      if (text !== history[historyIndex]) {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(text);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [text]);

  const activeDoc = documents.find(doc => doc.id === activeDocId);

  const createNewDocument = () => {
    const newDoc: Document = {
      id: Date.now().toString(),
      name: `Untitled-${documents.length + 1}.txt`,
      content: '',
      lastModified: new Date()
    };
    setDocuments([...documents, newDoc]);
    setActiveDocId(newDoc.id);
    setText('');
  };

  const deleteDocument = (id: string) => {
    if (documents.length > 1) {
      const newDocs = documents.filter(doc => doc.id !== id);
      setDocuments(newDocs);
      if (activeDocId === id) {
        setActiveDocId(newDocs[0].id);
        setText(newDocs[0].content);
      }
    }
  };

  const renameDocument = (id: string, newName: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === id ? { ...doc, name: newName } : doc
    ));
  };

  const downloadFile = (format: 'txt' | 'md' | 'html' | 'json') => {
    let content = text;
    let mimeType = 'text/plain';
    let extension = 'txt';

    if (format === 'md') {
      mimeType = 'text/markdown';
      extension = 'md';
    } else if (format === 'html') {
      content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${activeDoc?.name || 'Document'}</title>
</head>
<body>
  <pre>${text}</pre>
</body>
</html>`;
      mimeType = 'text/html';
      extension = 'html';
    } else if (format === 'json') {
      content = JSON.stringify({ 
        name: activeDoc?.name, 
        content: text, 
        created: activeDoc?.lastModified 
      }, null, 2);
      mimeType = 'application/json';
      extension = 'json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeDoc?.name.replace(/\.[^/.]+$/, '')}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const uploadFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.md,.html,.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          const newDoc: Document = {
            id: Date.now().toString(),
            name: file.name,
            content,
            lastModified: new Date()
          };
          setDocuments([...documents, newDoc]);
          setActiveDocId(newDoc.id);
          setText(content);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const copyText = () => {
    navigator.clipboard.writeText(text);
  };

  const pasteText = async () => {
    const clipText = await navigator.clipboard.readText();
    setText(text + clipText);
  };

  const cutText = () => {
    navigator.clipboard.writeText(text);
    setText('');
  };

  const findAndReplace = () => {
    if (searchTerm) {
      const newText = text.split(searchTerm).join(replaceTerm);
      setText(newText);
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setText(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setText(history[historyIndex + 1]);
    }
  };

  const insertTemplate = (template: string) => {
    setText(text + template);
  };

  const getStats = () => {
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, '').length;
    const lines = text.split('\n').length;
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0).length;
    return { words, chars, charsNoSpaces, lines, paragraphs };
  };

  const stats = getStats();
  const lines = text.split('\n');

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b dark:border-gray-700">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-500" />
          <h2 className="font-semibold dark:text-white">Notepad++</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {activeDoc?.name}
          </span>
        </div>
        <div className="flex gap-2">
          <Button onClick={createNewDocument} size="sm" variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            New
          </Button>
          <Button onClick={uploadFile} size="sm" variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Open
          </Button>
          <Button onClick={() => downloadFile('txt')} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-3 mt-2">
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="format">Format</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="files">Files ({documents.length})</TabsTrigger>
        </TabsList>

        {/* Editor Tab */}
        <TabsContent value="editor" className="flex-1 flex flex-col overflow-hidden mt-0">
          {/* Toolbar */}
          <div className="flex items-center gap-2 p-2 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-wrap">
            <Button onClick={undo} size="sm" variant="outline" disabled={historyIndex <= 0} title="Undo">
              <Undo className="h-4 w-4" />
            </Button>
            <Button onClick={redo} size="sm" variant="outline" disabled={historyIndex >= history.length - 1} title="Redo">
              <Redo className="h-4 w-4" />
            </Button>
            
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
            
            <Button onClick={cutText} size="sm" variant="outline" title="Cut">
              <Scissors className="h-4 w-4" />
            </Button>
            <Button onClick={copyText} size="sm" variant="outline" title="Copy">
              <Copy className="h-4 w-4" />
            </Button>
            <Button onClick={pasteText} size="sm" variant="outline" title="Paste">
              <Clipboard className="h-4 w-4" />
            </Button>
            
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
            
            <Button onClick={() => setIsBold(!isBold)} size="sm" variant={isBold ? "default" : "outline"} title="Bold">
              <Bold className="h-4 w-4" />
            </Button>
            <Button onClick={() => setIsItalic(!isItalic)} size="sm" variant={isItalic ? "default" : "outline"} title="Italic">
              <Italic className="h-4 w-4" />
            </Button>
            <Button onClick={() => setIsUnderline(!isUnderline)} size="sm" variant={isUnderline ? "default" : "outline"} title="Underline">
              <Underline className="h-4 w-4" />
            </Button>
            
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
            
            <Button onClick={() => setTextAlign('left')} size="sm" variant={textAlign === 'left' ? "default" : "outline"} title="Align Left">
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button onClick={() => setTextAlign('center')} size="sm" variant={textAlign === 'center' ? "default" : "outline"} title="Align Center">
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button onClick={() => setTextAlign('right')} size="sm" variant={textAlign === 'right' ? "default" : "outline"} title="Align Right">
              <AlignRight className="h-4 w-4" />
            </Button>
            
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
            
            <Button onClick={() => setShowLineNumbers(!showLineNumbers)} size="sm" variant="outline" title="Toggle Line Numbers">
              <Hash className="h-4 w-4" />
            </Button>
            <Button onClick={() => setShowStats(!showStats)} size="sm" variant="outline" title="Toggle Stats">
              {showStats ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </div>

          {/* Editor Area */}
          <div className="flex-1 flex overflow-hidden">
            {showLineNumbers && (
              <div className="w-12 bg-gray-100 dark:bg-gray-800 border-r dark:border-gray-700 overflow-y-auto text-right pr-2 py-3 text-xs text-gray-500 dark:text-gray-400 font-mono">
                {lines.map((_, idx) => (
                  <div key={idx} className="leading-6">{idx + 1}</div>
                ))}
              </div>
            )}
            
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 p-4 resize-none focus:outline-none dark:bg-gray-900 dark:text-white"
              placeholder="Start typing..."
              style={{
                fontSize: `${fontSize}px`,
                fontFamily,
                lineHeight,
                color: textColor,
                backgroundColor: bgColor,
                fontWeight: isBold ? 'bold' : 'normal',
                fontStyle: isItalic ? 'italic' : 'normal',
                textDecoration: isUnderline ? 'underline' : 'none',
                textAlign
              }}
            />
          </div>

          {/* Status Bar */}
          {showStats && (
            <div className="flex items-center justify-between p-2 border-t dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
              <div className="flex gap-4">
                <span>Lines: {stats.lines}</span>
                <span>Words: {stats.words}</span>
                <span>Characters: {stats.chars}</span>
                <span>No Spaces: {stats.charsNoSpaces}</span>
              </div>
              <div className="flex gap-2 items-center">
                <span>Font: {fontSize}px</span>
                <Button onClick={() => setFontSize(Math.max(8, fontSize - 2))} size="sm" variant="ghost">
                  <ZoomOut className="h-3 w-3" />
                </Button>
                <Button onClick={() => setFontSize(Math.min(32, fontSize + 2))} size="sm" variant="ghost">
                  <ZoomIn className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Format Tab */}
        <TabsContent value="format" className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h3 className="text-lg font-bold mb-4 dark:text-white">Text Formatting</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">Font Family</label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  >
                    <option value="monospace">Monospace</option>
                    <option value="sans-serif">Sans Serif</option>
                    <option value="serif">Serif</option>
                    <option value="'Courier New'">Courier New</option>
                    <option value="'Times New Roman'">Times New Roman</option>
                    <option value="Arial">Arial</option>
                    <option value="Georgia">Georgia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">Font Size</label>
                  <input
                    type="range"
                    min="8"
                    max="32"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm dark:text-gray-400">{fontSize}px</span>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">Line Height</label>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    value={lineHeight}
                    onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm dark:text-gray-400">{lineHeight}</span>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">Text Color</label>
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">Background Color</label>
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="font-bold mb-2 dark:text-white">Preview</h4>
              <div
                className="p-4 rounded"
                style={{
                  fontSize: `${fontSize}px`,
                  fontFamily,
                  lineHeight,
                  color: textColor,
                  backgroundColor: bgColor,
                  fontWeight: isBold ? 'bold' : 'normal',
                  fontStyle: isItalic ? 'italic' : 'normal',
                  textDecoration: isUnderline ? 'underline' : 'none',
                  textAlign
                }}
              >
                The quick brown fox jumps over the lazy dog.
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Find & Replace */}
            <div className="p-4 border-2 rounded-lg dark:border-gray-700">
              <h3 className="text-lg font-bold mb-4 dark:text-white flex items-center gap-2">
                <Search className="h-5 w-5" />
                Find & Replace
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Find..."
                  className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
                <input
                  type="text"
                  value={replaceTerm}
                  onChange={(e) => setReplaceTerm(e.target.value)}
                  placeholder="Replace with..."
                  className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
                <Button onClick={findAndReplace} className="w-full">
                  <Replace className="h-4 w-4 mr-2" />
                  Replace All
                </Button>
              </div>
            </div>

            {/* Templates */}
            <div className="p-4 border-2 rounded-lg dark:border-gray-700">
              <h3 className="text-lg font-bold mb-4 dark:text-white">Quick Templates</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <Button onClick={() => insertTemplate(`# Heading\n\n`)} variant="outline" className="justify-start">
                  <Type className="h-4 w-4 mr-2" />
                  Markdown Heading
                </Button>
                <Button onClick={() => insertTemplate(`- Item 1\n- Item 2\n- Item 3\n`)} variant="outline" className="justify-start">
                  <List className="h-4 w-4 mr-2" />
                  Bullet List
                </Button>
                <Button onClick={() => insertTemplate(`1. First\n2. Second\n3. Third\n`)} variant="outline" className="justify-start">
                  <ListOrdered className="h-4 w-4 mr-2" />
                  Numbered List
                </Button>
                <Button onClick={() => insertTemplate(`Date: ${new Date().toLocaleDateString()}\n`)} variant="outline" className="justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Insert Date
                </Button>
                <Button onClick={() => insertTemplate(`Time: ${new Date().toLocaleTimeString()}\n`)} variant="outline" className="justify-start">
                  <Clock className="h-4 w-4 mr-2" />
                  Insert Time
                </Button>
                <Button onClick={() => insertTemplate(`\`\`\`\ncode here\n\`\`\`\n`)} variant="outline" className="justify-start">
                  <FileCode className="h-4 w-4 mr-2" />
                  Code Block
                </Button>
              </div>
            </div>

            {/* Export Options */}
            <div className="p-4 border-2 rounded-lg dark:border-gray-700">
              <h3 className="text-lg font-bold mb-4 dark:text-white">Export Options</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <Button onClick={() => downloadFile('txt')} variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Export as TXT
                </Button>
                <Button onClick={() => downloadFile('md')} variant="outline">
                  <FileCode className="h-4 w-4 mr-2" />
                  Export as Markdown
                </Button>
                <Button onClick={() => downloadFile('html')} variant="outline">
                  <FileCode className="h-4 w-4 mr-2" />
                  Export as HTML
                </Button>
                <Button onClick={() => downloadFile('json')} variant="outline">
                  <FileJson className="h-4 w-4 mr-2" />
                  Export as JSON
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold dark:text-white">Your Documents</h3>
              <Button onClick={createNewDocument} size="sm">
                <FileText className="h-4 w-4 mr-2" />
                New Document
              </Button>
            </div>
            
            <div className="space-y-2">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    activeDocId === doc.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                  onClick={() => {
                    setActiveDocId(doc.id);
                    setText(doc.content);
                    setActiveTab('editor');
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={doc.name}
                        onChange={(e) => renameDocument(doc.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="font-semibold bg-transparent border-none focus:outline-none dark:text-white"
                      />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Modified: {new Date(doc.lastModified).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {doc.content.length} characters, {doc.content.split(/\s+/).filter(w => w).length} words
                      </p>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDocument(doc.id);
                      }}
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700"
                      disabled={documents.length === 1}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
