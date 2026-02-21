import React, { useState, useCallback } from 'react';

type BcryptMode = 'hash' | 'verify';

function toHex(buf: Uint8Array): string {
  return Array.from(buf, b => b.toString(16).padStart(2, '0')).join('');
}
function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  return bytes;
}

export const BcryptTool: React.FC = () => {
  const [mode, setMode] = useState<BcryptMode>('hash');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [iterations, setIterations] = useState(100000);
  const [customSalt, setCustomSalt] = useState('');
  const [useCustomSalt, setUseCustomSalt] = useState(false);
  const [result, setResult] = useState('');
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);
  const [timing, setTiming] = useState<number | null>(null);
  const [isComputing, setIsComputing] = useState(false);

  const hashPassword = useCallback(async () => {
    if (!password) return;
    setIsComputing(true);
    const start = performance.now();
    try {
      const enc = new TextEncoder();
      const salt = useCustomSalt && customSalt ? fromHex(customSalt) : crypto.getRandomValues(new Uint8Array(16));
      const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
      const derived = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, keyMaterial, 256);
      const hashHex = toHex(new Uint8Array(derived));
      const saltHex = toHex(salt);
      setResult(`${iterations}$${saltHex}$${hashHex}`);
      setTiming(Math.round(performance.now() - start));
    } catch {
      setResult('Error hashing password');
    }
    setIsComputing(false);
  }, [password, iterations, useCustomSalt, customSalt]);

  const verifyPassword = useCallback(async () => {
    if (!password || !verifyInput) return;
    setIsComputing(true);
    const start = performance.now();
    try {
      const parts = verifyInput.split('$');
      if (parts.length !== 3) { setVerifyResult(false); setIsComputing(false); return; }
      const [itersStr, saltHex, expectedHash] = parts;
      const iters = parseInt(itersStr);
      const salt = fromHex(saltHex);
      const enc = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
      const derived = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: iters, hash: 'SHA-256' }, keyMaterial, 256);
      const computedHash = toHex(new Uint8Array(derived));
      setVerifyResult(computedHash === expectedHash);
      setTiming(Math.round(performance.now() - start));
    } catch {
      setVerifyResult(false);
    }
    setIsComputing(false);
  }, [password, verifyInput]);

  const selectClass = 'px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100';

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-amber-50 dark:from-gray-950 dark:to-amber-950 p-3 overflow-hidden">
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          {(['hash', 'verify'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setResult(''); setVerifyResult(null); setTiming(null); }}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${mode === m ? 'bg-amber-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
              {m === 'hash' ? 'Hash' : 'Verify'}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500">PBKDF2-SHA256 Password Hashing</span>
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-auto">
        <div>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Password</label>
          <div className="flex gap-1">
            <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password..."
              className={`flex-1 ${selectClass} font-mono`} />
            <button onClick={() => setShowPassword(!showPassword)}
              className="px-3 py-1.5 text-xs bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300">
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {mode === 'hash' && (
          <>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Iterations: {iterations.toLocaleString()}</label>
                <span className="text-[10px] text-gray-500">Higher = slower but more secure</span>
              </div>
              <input type="range" min={10000} max={600000} step={10000} value={iterations} onChange={e => setIterations(Number(e.target.value))} className="w-full" />
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>10K (fast)</span><span>300K</span><span>600K (slow)</span>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 mb-1 cursor-pointer">
                <input type="checkbox" checked={useCustomSalt} onChange={e => setUseCustomSalt(e.target.checked)} className="rounded" />
                Custom salt (hex)
              </label>
              {useCustomSalt && (
                <input value={customSalt} onChange={e => setCustomSalt(e.target.value)} placeholder="32 hex chars (16 bytes)..."
                  className={`w-full ${selectClass} font-mono text-xs`} />
              )}
            </div>

            <button onClick={hashPassword} disabled={isComputing || !password}
              className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-semibold disabled:opacity-50 self-start">
              {isComputing ? 'Hashing...' : 'Hash Password'}
            </button>
          </>
        )}

        {mode === 'verify' && (
          <>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Hash String</label>
              <input value={verifyInput} onChange={e => { setVerifyInput(e.target.value); setVerifyResult(null); }} placeholder="iterations$salt$hash"
                className={`w-full ${selectClass} font-mono text-xs`} />
              <span className="text-[10px] text-gray-400">Format: iterations$salt$hash</span>
            </div>

            <button onClick={verifyPassword} disabled={isComputing || !password || !verifyInput}
              className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-semibold disabled:opacity-50 self-start">
              {isComputing ? 'Verifying...' : 'Verify Password'}
            </button>
          </>
        )}

        {result && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Hash Result</div>
            <div className="text-xs font-mono text-gray-800 dark:text-gray-200 break-all select-all">{result}</div>
            <div className="flex items-center gap-2 mt-2">
              <button onClick={() => navigator.clipboard.writeText(result)} className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px]">Copy</button>
              {timing !== null && <span className="text-[10px] text-gray-500">{timing}ms</span>}
            </div>
          </div>
        )}

        {verifyResult !== null && (
          <div className={`rounded-lg p-3 border-2 ${verifyResult ? 'bg-green-50 dark:bg-green-900/30 border-green-400' : 'bg-red-50 dark:bg-red-900/30 border-red-400'}`}>
            <div className={`text-sm font-bold ${verifyResult ? 'text-green-600' : 'text-red-500'}`}>
              {verifyResult ? 'Password matches!' : 'Password does NOT match'}
            </div>
            {timing !== null && <span className="text-[10px] text-gray-500">{timing}ms</span>}
          </div>
        )}

        <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 text-xs text-gray-600 dark:text-gray-400">
          <b>Why slow hashing?</b> Password hashing algorithms like PBKDF2 are intentionally slow (configurable iterations).
          This makes brute-force attacks computationally expensive. More iterations = more time per guess = better security.
          Each password gets a unique random salt, preventing rainbow table attacks.
        </div>
      </div>
    </div>
  );
};
