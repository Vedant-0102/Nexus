import React, { useState, useCallback } from 'react';

type HMACAlgo = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';
type HMACMode = 'generate' | 'verify';
type HMACFormat = 'hex' | 'base64';

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');
}
function toBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

export const HMACGenerator: React.FC = () => {
  const [algo, setAlgo] = useState<HMACAlgo>('SHA-256');
  const [mode, setMode] = useState<HMACMode>('generate');
  const [outputFmt, setOutputFmt] = useState<HMACFormat>('hex');
  const [message, setMessage] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [result, setResult] = useState('');
  const [expectedHmac, setExpectedHmac] = useState('');
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);
  const [isComputing, setIsComputing] = useState(false);

  const computeHMAC = useCallback(async (msg: string, key: string, algorithm: HMACAlgo, fmt: HMACFormat): Promise<string> => {
    const enc = new TextEncoder();
    const keyData = enc.encode(key);
    const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: algorithm }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(msg));
    return fmt === 'hex' ? toHex(signature) : toBase64(signature);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!message || !secretKey) return;
    setIsComputing(true);
    try {
      const hmac = await computeHMAC(message, secretKey, algo, outputFmt);
      setResult(hmac);
    } catch {
      setResult('Error computing HMAC');
    }
    setIsComputing(false);
  }, [message, secretKey, algo, outputFmt, computeHMAC]);

  const handleVerify = useCallback(async () => {
    if (!message || !secretKey || !expectedHmac) return;
    setIsComputing(true);
    try {
      const computed = await computeHMAC(message, secretKey, algo, outputFmt);
      setVerifyResult(computed.toLowerCase() === expectedHmac.toLowerCase().trim());
    } catch {
      setVerifyResult(false);
    }
    setIsComputing(false);
  }, [message, secretKey, expectedHmac, algo, outputFmt, computeHMAC]);

  const generateRandomKey = () => {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    setSecretKey(Array.from(bytes, b => b.toString(16).padStart(2, '0')).join(''));
  };

  const selectClass = 'px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100';

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-teal-50 dark:from-gray-950 dark:to-teal-950 p-3 overflow-hidden">
      <div className="flex flex-wrap gap-2 mb-2 items-center">
        <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          {(['generate', 'verify'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setResult(''); setVerifyResult(null); }}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${mode === m ? 'bg-teal-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
              {m === 'generate' ? 'Generate' : 'Verify'}
            </button>
          ))}
        </div>
        <select value={algo} onChange={e => setAlgo(e.target.value as HMACAlgo)} className={selectClass}>
          {['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'].map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={outputFmt} onChange={e => setOutputFmt(e.target.value as HMACFormat)} className={selectClass}>
          <option value="hex">Hex</option>
          <option value="base64">Base64</option>
        </select>
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-auto">
        <div>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Message</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Enter message..."
            className="w-full h-24 p-2 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 resize-none" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Secret Key</label>
            <button onClick={generateRandomKey} className="px-2 py-0.5 text-[10px] bg-teal-600 text-white rounded hover:bg-teal-700">Random Key</button>
          </div>
          <input value={secretKey} onChange={e => setSecretKey(e.target.value)} placeholder="Enter secret key..."
            className="w-full px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono" />
        </div>

        {mode === 'verify' && (
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Expected HMAC</label>
            <input value={expectedHmac} onChange={e => { setExpectedHmac(e.target.value); setVerifyResult(null); }} placeholder="Paste expected HMAC..."
              className="w-full px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono" />
          </div>
        )}

        <div className="flex gap-2">
          {mode === 'generate' ? (
            <button onClick={handleGenerate} disabled={isComputing || !message || !secretKey}
              className="px-4 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-semibold disabled:opacity-50">
              {isComputing ? 'Computing...' : 'Generate HMAC'}
            </button>
          ) : (
            <button onClick={handleVerify} disabled={isComputing || !message || !secretKey || !expectedHmac}
              className="px-4 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-semibold disabled:opacity-50">
              {isComputing ? 'Verifying...' : 'Verify HMAC'}
            </button>
          )}
        </div>

        {mode === 'generate' && result && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">HMAC Result</div>
            <div className="text-xs font-mono text-gray-800 dark:text-gray-200 break-all select-all">{result}</div>
            <button onClick={() => navigator.clipboard.writeText(result)} className="mt-2 px-2 py-0.5 bg-blue-600 text-white rounded text-[10px]">Copy</button>
          </div>
        )}

        {mode === 'verify' && verifyResult !== null && (
          <div className={`rounded-lg p-3 border-2 ${verifyResult ? 'bg-green-50 dark:bg-green-900/30 border-green-400' : 'bg-red-50 dark:bg-red-900/30 border-red-400'}`}>
            <div className={`text-sm font-bold ${verifyResult ? 'text-green-600' : 'text-red-500'}`}>
              {verifyResult ? 'HMAC is valid - Message is authentic' : 'HMAC mismatch - Message may be tampered'}
            </div>
          </div>
        )}

        <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 text-xs text-gray-600 dark:text-gray-400">
          <b>What is HMAC?</b> Hash-based Message Authentication Code combines a cryptographic hash with a secret key to produce a message authentication code.
          It verifies both data integrity and authenticity. Unlike a plain hash, only someone with the secret key can generate or verify the HMAC.
        </div>
      </div>
    </div>
  );
};
