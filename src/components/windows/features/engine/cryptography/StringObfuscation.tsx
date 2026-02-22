import React, { useState, useCallback, useMemo } from 'react';

type EncodingMethod = 'unicode' | 'hex-escape' | 'octal' | 'char-codes' | 'html-entities' | 'url-encoding' | 'rot-n' | 'reverse' | 'binary';

function encode(text: string, method: EncodingMethod, rotN: number): string {
  switch (method) {
    case 'unicode': return Array.from(text, ch => '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0')).join('');
    case 'hex-escape': return Array.from(text, ch => '\\x' + ch.charCodeAt(0).toString(16).padStart(2, '0')).join('');
    case 'octal': return Array.from(text, ch => '\\' + ch.charCodeAt(0).toString(8).padStart(3, '0')).join('');
    case 'char-codes': return Array.from(text, ch => ch.charCodeAt(0)).join(',');
    case 'html-entities': return Array.from(text, ch => '&#' + ch.charCodeAt(0) + ';').join('');
    case 'url-encoding': return encodeURIComponent(text);
    case 'rot-n': return text.replace(/[a-zA-Z]/g, ch => {
      const base = ch <= 'Z' ? 65 : 97;
      return String.fromCharCode(((ch.charCodeAt(0) - base + rotN) % 26) + base);
    });
    case 'reverse': return Array.from(text).reverse().join('');
    case 'binary': return Array.from(text, ch => ch.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
    default: return text;
  }
}

function decode(text: string, method: EncodingMethod, rotN: number): string {
  switch (method) {
    case 'unicode': return text.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    case 'hex-escape': return text.replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    case 'octal': return text.replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
    case 'char-codes': return text.split(',').map(n => String.fromCharCode(parseInt(n.trim()))).join('');
    case 'html-entities': return text.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec)));
    case 'url-encoding': try { return decodeURIComponent(text); } catch { return 'Invalid URL encoding'; }
    case 'rot-n': return text.replace(/[a-zA-Z]/g, ch => {
      const base = ch <= 'Z' ? 65 : 97;
      return String.fromCharCode(((ch.charCodeAt(0) - base + (26 - rotN)) % 26) + base);
    });
    case 'reverse': return Array.from(text).reverse().join('');
    case 'binary': return text.split(' ').filter(b => b.length > 0).map(b => String.fromCharCode(parseInt(b, 2))).join('');
    default: return text;
  }
}

const METHOD_LABELS: Record<EncodingMethod, string> = {
  'unicode': 'Unicode Escape (\\uXXXX)',
  'hex-escape': 'Hex Escape (\\xXX)',
  'octal': 'Octal Escape (\\XXX)',
  'char-codes': 'Char Codes (decimal)',
  'html-entities': 'HTML Entities (&#XX;)',
  'url-encoding': 'URL Encoding',
  'rot-n': 'ROT-N',
  'reverse': 'Reverse',
  'binary': 'Binary (8-bit)',
};

export const StringObfuscation: React.FC = () => {
  const [method, setMethod] = useState<EncodingMethod>('unicode');
  const [isEncode, setIsEncode] = useState(true);
  const [input, setInput] = useState('Hello, World!');
  const [rotN, setRotN] = useState(13);

  const output = useMemo(() => {
    try {
      return isEncode ? encode(input, method, rotN) : decode(input, method, rotN);
    } catch {
      return 'Error processing input';
    }
  }, [input, method, isEncode, rotN]);

  const swap = useCallback(() => {
    setInput(output);
    setIsEncode(!isEncode);
  }, [output, isEncode]);

  const selectClass = 'px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100';

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-violet-50 dark:from-gray-950 dark:to-violet-950 p-3 overflow-hidden">
      <div className="flex flex-wrap gap-2 mb-2 items-center">
        <select value={method} onChange={e => setMethod(e.target.value as EncodingMethod)} className={selectClass}>
          {Object.entries(METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          {(['encode', 'decode'] as const).map(m => (
            <button key={m} onClick={() => setIsEncode(m === 'encode')}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${(m === 'encode') === isEncode ? 'bg-violet-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
              {m === 'encode' ? 'Encode' : 'Decode'}
            </button>
          ))}
        </div>
        {method === 'rot-n' && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">ROT:</span>
            <input type="range" min={1} max={25} value={rotN} onChange={e => setRotN(Number(e.target.value))} className="w-20" />
            <span className="text-xs text-gray-600 dark:text-gray-400 w-6">{rotN}</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 flex gap-3 overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Input</label>
            <span className="text-[10px] text-gray-400">{input.length} chars</span>
          </div>
          <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Enter text..."
            className="flex-1 p-3 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono resize-none" />
        </div>

        <div className="flex flex-col items-center justify-center gap-2">
          <button onClick={swap} className="px-2 py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-xs font-medium" title="Swap input/output">
            {'<->'}
          </button>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Output</label>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400">{output.length} chars</span>
              <button onClick={() => navigator.clipboard.writeText(output)} className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-[10px]">Copy</button>
            </div>
          </div>
          <textarea readOnly value={output}
            className="flex-1 p-3 text-sm rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 font-mono resize-none" />
        </div>
      </div>
    </div>
  );
};
