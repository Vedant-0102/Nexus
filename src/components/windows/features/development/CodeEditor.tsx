import React, { useState } from 'react';
import { Play, Save, FileCode, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const CodeEditor: React.FC = () => {
  const [htmlCode, setHtmlCode] = useState('<h1>Hello World!</h1>\n<p>Start coding...</p>');
  const [cssCode, setCssCode] = useState('body {\n  font-family: Arial, sans-serif;\n  padding: 20px;\n}\n\nh1 {\n  color: #007bff;\n}');
  const [jsCode, setJsCode] = useState('// JavaScript code\nconsole.log("Hello from Code Editor!");');
  const [output, setOutput] = useState('');
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);

  const runCode = () => {
    try {
      // Combine HTML, CSS, and JS
      const fullHTML = `
<!DOCTYPE html>
<html>
<head>
  <style>${cssCode}</style>
</head>
<body>
  ${htmlCode}
  <script>
    // Override console.log to capture output
    const originalLog = console.log;
    console.log = function(...args) {
      window.parent.postMessage({ type: 'console', data: args.join(' ') }, '*');
      originalLog.apply(console, args);
    };
    
    try {
      ${jsCode}
    } catch (error) {
      window.parent.postMessage({ type: 'error', data: error.message }, '*');
    }
  </script>
</body>
</html>
      `;

      setOutput(fullHTML);
      setConsoleOutput([]);
    } catch (error) {
      setConsoleOutput([`Error: ${error}`]);
    }
  };

  // Listen for console messages from iframe
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'console') {
        setConsoleOutput(prev => [...prev, `> ${event.data.data}`]);
      } else if (event.data.type === 'error') {
        setConsoleOutput(prev => [...prev, `❌ Error: ${event.data.data}`]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const saveProject = () => {
    const project = {
      html: htmlCode,
      css: cssCode,
      js: jsCode,
    };
    localStorage.setItem('code-editor-project', JSON.stringify(project));
    setConsoleOutput(prev => [...prev, '✓ Project saved!']);
  };

  const downloadProject = () => {
    const fullHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Project</title>
  <style>${cssCode}</style>
</head>
<body>
  ${htmlCode}
  <script>${jsCode}</script>
</body>
</html>
    `;

    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Load saved project
  React.useEffect(() => {
    const saved = localStorage.getItem('code-editor-project');
    if (saved) {
      try {
        const project = JSON.parse(saved);
        setHtmlCode(project.html || htmlCode);
        setCssCode(project.css || cssCode);
        setJsCode(project.js || jsCode);
      } catch (error) {
        console.error('Failed to load project:', error);
      }
    }
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center gap-2">
          <FileCode size={20} className="text-blue-400" />
          <span className="font-semibold">Code Editor</span>
        </div>
        <div className="flex gap-2">
          <Button onClick={saveProject} variant="outline" size="sm" className="bg-gray-700 border-gray-600">
            <Save size={14} className="mr-1" />
            Save
          </Button>
          <Button onClick={downloadProject} variant="outline" size="sm" className="bg-gray-700 border-gray-600">
            <Download size={14} className="mr-1" />
            Export
          </Button>
          <Button onClick={runCode} size="sm" className="bg-green-600 hover:bg-green-700">
            <Play size={14} className="mr-1" />
            Run
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Code Editor */}
        <div className="w-1/2 flex flex-col border-r border-gray-700">
          <Tabs defaultValue="html" className="flex-1 flex flex-col">
            <TabsList className="bg-gray-800 border-b border-gray-700 rounded-none">
              <TabsTrigger value="html">HTML</TabsTrigger>
              <TabsTrigger value="css">CSS</TabsTrigger>
              <TabsTrigger value="js">JavaScript</TabsTrigger>
            </TabsList>

            <TabsContent value="html" className="flex-1 m-0">
              <textarea
                value={htmlCode}
                onChange={(e) => setHtmlCode(e.target.value)}
                className="w-full h-full p-4 bg-gray-900 text-gray-100 font-mono text-sm resize-none focus:outline-none"
                spellCheck={false}
              />
            </TabsContent>

            <TabsContent value="css" className="flex-1 m-0">
              <textarea
                value={cssCode}
                onChange={(e) => setCssCode(e.target.value)}
                className="w-full h-full p-4 bg-gray-900 text-gray-100 font-mono text-sm resize-none focus:outline-none"
                spellCheck={false}
              />
            </TabsContent>

            <TabsContent value="js" className="flex-1 m-0">
              <textarea
                value={jsCode}
                onChange={(e) => setJsCode(e.target.value)}
                className="w-full h-full p-4 bg-gray-900 text-gray-100 font-mono text-sm resize-none focus:outline-none"
                spellCheck={false}
              />
            </TabsContent>
          </Tabs>

          {/* Console */}
          <div className="h-32 border-t border-gray-700 bg-black p-2 overflow-auto">
            <div className="text-xs font-mono">
              <div className="text-gray-500 mb-1">Console:</div>
              {consoleOutput.map((line, i) => (
                <div key={i} className="text-green-400">{line}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="w-1/2 flex flex-col bg-white">
          <div className="p-2 bg-gray-800 border-b border-gray-700 text-sm text-gray-400">
            Preview
          </div>
          <div className="flex-1 overflow-auto">
            {output ? (
              <iframe
                srcDoc={output}
                className="w-full h-full border-none"
                sandbox="allow-scripts"
                title="Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <Play size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Click "Run" to see preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
