import React, { useState, useMemo } from 'react';
import { Copy, Download, Upload, AlertCircle, CheckCircle2, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Base64Converter: React.FC = () => {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [fileMode, setFileMode] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');

  const convert = useMemo(() => {
    setError('');
    
    if (!input.trim()) {
      setOutput('');
      return;
    }

    try {
      if (mode === 'encode') {
        const encoded = btoa(unescape(encodeURIComponent(input)));
        setOutput(encoded);
      } else {
        const decoded = decodeURIComponent(escape(atob(input)));
        setOutput(decoded);
      }
    } catch (err) {
      setError(mode === 'encode' ? 'Failed to encode text' : 'Invalid Base64 string');
      setOutput('');
    }
  }, [input, mode]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        setInput(result);
        setFileMode(true);
      } else if (result instanceof ArrayBuffer) {
        const bytes = new Uint8Array(result);
        const binary = Array.from(bytes).map(b => String.fromCharCode(b)).join('');
        const base64 = btoa(binary);
        setInput(base64);
        setMode('decode');
        setFileMode(true);
      }
    };

    if (mode === 'encode') {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadOutput = () => {
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = mode === 'encode' ? 'encoded.txt' : 'decoded.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const switchMode = () => {
    setMode(mode === 'encode' ? 'decode' : 'encode');
    setInput(output);
    setOutput('');
    setError('');
  };

  const clear = () => {
    setInput('');
    setOutput('');
    setError('');
    setFileName('');
    setFileMode(false);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      <div className="p-4 border-b dark:border-gray-700">
        <h2 className="text-2xl font-semibold dark:text-white">Base64 Encoder/Decoder</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Convert text or files to/from Base64 encoding
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Mode Toggle */}
          <div className="flex items-center gap-4">
            <div className="flex rounded-lg border dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => setMode('encode')}
                className={`px-6 py-2 font-medium transition-colors ${
                  mode === 'encode'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Encode
              </button>
              <button
                onClick={() => setMode('decode')}
                className={`px-6 py-2 font-medium transition-colors ${
                  mode === 'decode'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Decode
              </button>
            </div>

            <Button variant="outline" size="sm" onClick={clear}>
              Clear All
            </Button>

            <label className="cursor-pointer">
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </span>
              </Button>
            </label>
          </div>

          {fileName && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
              <span className="text-blue-700 dark:text-blue-400">
                File loaded: {fileName}
              </span>
            </div>
          )}

          {/* Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold dark:text-white">
                {mode === 'encode' ? 'Plain Text' : 'Base64 Encoded'}
              </label>
              <span className="text-xs text-gray-500">
                {input.length} characters
              </span>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === 'encode'
                  ? 'Enter text to encode...'
                  : 'Enter Base64 string to decode...'
              }
              className="w-full h-48 px-3 py-2 border rounded dark:bg-gray-800 dark:text-white dark:border-gray-700 resize-none font-mono text-sm"
            />
          </div>

          {/* Convert Button */}
          <div className="flex justify-center">
            <Button
              onClick={switchMode}
              variant="outline"
              size="lg"
              disabled={!output}
            >
              <ArrowLeftRight className="h-5 w-5 mr-2" />
              Switch & Convert
            </Button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-700 dark:text-red-400">{error}</span>
            </div>
          )}

          {/* Output */}
          {output && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold dark:text-white">
                  {mode === 'encode' ? 'Base64 Encoded' : 'Plain Text'}
                </label>
                <div className="flex gap-2">
                  <span className="text-xs text-gray-500 mr-2">
                    {output.length} characters
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(output)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={downloadOutput}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <textarea
                value={output}
                readOnly
                className="w-full h-48 px-3 py-2 border rounded dark:bg-gray-800 dark:text-white dark:border-gray-700 resize-none font-mono text-sm bg-gray-50 dark:bg-gray-900"
              />
            </div>
          )}

          {/* Info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold mb-2 dark:text-white">About Base64</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Base64 is a binary-to-text encoding scheme</li>
              <li>• Commonly used for embedding images in HTML/CSS</li>
              <li>• Used in data URLs and email attachments</li>
              <li>• Increases data size by approximately 33%</li>
              <li>• Safe for transmission over text-based protocols</li>
            </ul>
          </div>

          {/* Examples */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-semibold mb-2 dark:text-white">Quick Examples</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium dark:text-gray-300">Plain text:</span>
                <code className="ml-2 px-2 py-1 bg-white dark:bg-gray-800 rounded">Hello, World!</code>
              </div>
              <div>
                <span className="font-medium dark:text-gray-300">Base64:</span>
                <code className="ml-2 px-2 py-1 bg-white dark:bg-gray-800 rounded">SGVsbG8sIFdvcmxkIQ==</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
