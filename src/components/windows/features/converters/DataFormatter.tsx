import React, { useState, useMemo } from 'react';
import { AlertCircle, CheckCircle2, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type FormatType = 'json' | 'xml';

export const DataFormatter: React.FC = () => {
  const [input, setInput] = useState<string>('');
  const [format, setFormat] = useState<FormatType>('json');
  const [indentSize, setIndentSize] = useState<number>(2);
  const [activeTab, setActiveTab] = useState<string>('formatted');

  const result = useMemo(() => {
    if (!input.trim()) return null;

    try {
      if (format === 'json') {
        const parsed = JSON.parse(input);
        const formatted = JSON.stringify(parsed, null, indentSize);
        const minified = JSON.stringify(parsed);
        return { isValid: true, formatted, minified, error: null };
      } else {
        // Basic XML formatting
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(input, 'text/xml');
        
        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
          throw new Error('Invalid XML');
        }

        const formatted = formatXML(input, indentSize);
        const minified = input.replace(/>\s+</g, '><').trim();
        return { isValid: true, formatted, minified, error: null };
      }
    } catch (error) {
      return {
        isValid: false,
        formatted: '',
        minified: '',
        error: error instanceof Error ? error.message : 'Invalid format',
      };
    }
  }, [input, format, indentSize]);

  const formatXML = (xml: string, indent: number): string => {
    const PADDING = ' '.repeat(indent);
    const reg = /(>)(<)(\/*)/g;
    let formatted = xml.replace(reg, '$1\n$2$3');
    let pad = 0;

    return formatted.split('\n').map((node) => {
      let indent = 0;
      if (node.match(/.+<\/\w[^>]*>$/)) {
        indent = 0;
      } else if (node.match(/^<\/\w/)) {
        if (pad !== 0) {
          pad -= 1;
        }
      } else if (node.match(/^<\w([^>]*[^\/])?>.*$/)) {
        indent = 1;
      } else {
        indent = 0;
      }

      const padding = PADDING.repeat(pad);
      pad += indent;
      return padding + node;
    }).join('\n');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      <div className="p-4 border-b dark:border-gray-700">
        <h2 className="text-2xl font-semibold dark:text-white">JSON/XML Formatter</h2>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Controls */}
          <div className="flex gap-4 items-center">
            <div className="flex gap-2">
              <Button
                variant={format === 'json' ? 'default' : 'outline'}
                onClick={() => setFormat('json')}
              >
                JSON
              </Button>
              <Button
                variant={format === 'xml' ? 'default' : 'outline'}
                onClick={() => setFormat('xml')}
              >
                XML
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold dark:text-white">Indent:</label>
              <select
                value={indentSize}
                onChange={(e) => setIndentSize(Number(e.target.value))}
                className="px-3 py-1 border rounded dark:bg-gray-800 dark:text-white dark:border-gray-700"
              >
                <option value={2}>2 spaces</option>
                <option value={4}>4 spaces</option>
                <option value={8}>8 spaces</option>
              </select>
            </div>
          </div>

          {/* Validation Status */}
          {result && (
            <div className={`flex items-center gap-2 p-3 rounded ${result.isValid ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
              {result.isValid ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-green-700 dark:text-green-400">Valid {format.toUpperCase()}</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-700 dark:text-red-400">{result.error}</span>
                </>
              )}
            </div>
          )}

          {/* Input */}
          <div>
            <label className="block text-sm font-semibold mb-2 dark:text-white">
              Input {format.toUpperCase()}
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Paste your ${format.toUpperCase()} here...`}
              className="w-full h-64 px-3 py-2 border rounded dark:bg-gray-800 dark:text-white dark:border-gray-700 font-mono text-sm resize-none"
            />
          </div>

          {/* Output Tabs */}
          {result?.isValid && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="border rounded dark:border-gray-700">
              <TabsList className="w-full justify-start rounded-none border-b dark:border-gray-700">
                <TabsTrigger value="formatted">Formatted</TabsTrigger>
                <TabsTrigger value="minified">Minified</TabsTrigger>
              </TabsList>

              <TabsContent value="formatted" className="p-0">
                <div className="flex items-center justify-between p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <span className="text-sm font-semibold dark:text-white">Pretty Print</span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(result.formatted)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadFile(result.formatted, `formatted.${format}`)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
                <pre className="p-4 overflow-auto max-h-96 text-sm dark:text-gray-300 font-mono">
                  {result.formatted}
                </pre>
              </TabsContent>

              <TabsContent value="minified" className="p-0">
                <div className="flex items-center justify-between p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <span className="text-sm font-semibold dark:text-white">Minified</span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(result.minified)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadFile(result.minified, `minified.${format}`)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
                <pre className="p-4 overflow-auto max-h-96 text-sm dark:text-gray-300 font-mono break-all">
                  {result.minified}
                </pre>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};
