import React, { useState, useCallback } from 'react';

type TokenType = 'hex' | 'alphanumeric' | 'url-safe' | 'numeric' | 'custom';

const CHARSETS: Record<Exclude<TokenType, 'custom'>, string> = {
  hex: '0123456789abcdef',
  alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  'url-safe': 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',
  numeric: '0123456789',
};

function generateToken(charset: string, length: number): string {
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, v => charset[v % charset.length]).join('');
}

function getEntropy(charsetSize: number, length: number): number {
  return Math.floor(Math.log2(charsetSize) * length);
}

function getStrength(entropy: number): { label: string; color: string } {
  if (entropy < 40) return { label: 'Weak', color: 'text-red-500' };
  if (entropy < 80) return { label: 'Fair', color: 'text-yellow-500' };
  if (entropy < 128) return { label: 'Strong', color: 'text-green-500' };
  return { label: 'Very Strong', color: 'text-emerald-600' };
}

export const TokenGenerator: React.FC = () => {
  const [tokenType, setTokenType] = useState<TokenType>('hex');
  const [customCharset, setCustomCharset] = useState('ABCDEFabcdef0123456789!@#$%');
  const [length, setLength] = useState(32);
  const [batchSize, setBatchSize] = useState(1);
  const [tokens, setTokens] = useState<string[]>([]);

  const charset = tokenType === 'custom' ? customCharset : CHARSETS[tokenType];
  const entropy = getEntropy(charset.length, length);
  const strength = getStrength(entropy);

  const generate = useCallback(() => {
    if (charset.length === 0) return;
    const newTokens = Array.from({ length: batchSize }, () => generateToken(charset, length));
    setTokens(prev => [...newTokens, ...prev].slice(0, 100));
  }, [charset, length, batchSize]);

  const copyOne = (t: string) => navigator.clipboard.writeText(t);
  const copyAll = () => navigator.clipboard.writeText(tokens.join('\n'));

  const selectClass = 'px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100';

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-green-50 dark:from-gray-950 dark:to-green-950 p-3 overflow-hidden">
      <div className="flex flex-wrap gap-2 mb-2 items-center">
        <button onClick={generate} className="px-4 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">Generate</button>
        <select value={tokenType} onChange={e => setTokenType(e.target.value as TokenType)} className={selectClass}>
          <option value="hex">Hex</option>
          <option value="alphanumeric">Alphanumeric</option>
          <option value="url-safe">URL-Safe</option>
          <option value="numeric">Numeric</option>
          <option value="custom">Custom Charset</option>
        </select>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">Length:</span>
          <input type="range" min={8} max={256} value={length} onChange={e => setLength(Number(e.target.value))} className="w-24" />
          <input type="number" min={8} max={256} value={length} onChange={e => setLength(Math.max(8, Math.min(256, Number(e.target.value))))}
            className="w-14 px-1 py-0.5 text-xs rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-center" />
        </div>
        <select value={batchSize} onChange={e => setBatchSize(Number(e.target.value))} className={selectClass}>
          {[1, 5, 10, 25].map(n => <option key={n} value={n}>{n} token{n > 1 ? 's' : ''}</option>)}
        </select>
        {tokens.length > 0 && (
          <>
            <button onClick={copyAll} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Copy All</button>
            <button onClick={() => setTokens([])} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Clear</button>
          </>
        )}
      </div>

      {tokenType === 'custom' && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-500">Charset:</span>
          <input value={customCharset} onChange={e => setCustomCharset(e.target.value)}
            className="flex-1 px-2 py-1 text-xs rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono" />
        </div>
      )}

      <div className="flex items-center gap-4 mb-2 bg-white/60 dark:bg-gray-800/60 rounded-lg px-3 py-1.5">
        <span className="text-xs text-gray-500">Charset size: <b>{charset.length}</b></span>
        <span className="text-xs text-gray-500">Entropy: <b>{entropy} bits</b></span>
        <span className={`text-xs font-bold ${strength.color}`}>{strength.label}</span>
      </div>

      <div className="flex-1 min-h-0 overflow-auto space-y-1">
        {tokens.map((t, i) => (
          <div key={i} className="flex items-center gap-2 px-2 py-1 rounded bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
            <span className="flex-1 text-xs font-mono text-gray-800 dark:text-gray-200 break-all select-all">{t}</span>
            <button onClick={() => copyOne(t)} className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px] hover:bg-gray-300 dark:hover:bg-gray-600 flex-shrink-0">Copy</button>
          </div>
        ))}
        {tokens.length === 0 && <div className="text-sm text-gray-400 text-center mt-8">Click Generate to create tokens</div>}
      </div>
    </div>
  );
};
