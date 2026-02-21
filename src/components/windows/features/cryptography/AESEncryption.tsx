import React, { useState, useCallback } from 'react';

type AESMode = 'AES-GCM' | 'AES-CBC';
type KeySize = 128 | 256;
type AESView = 'encrypt' | 'decrypt';

function toBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function fromBase64(str: string): Uint8Array {
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}
function toHex(buf: Uint8Array): string {
  return Array.from(buf, b => b.toString(16).padStart(2, '0')).join('');
}

export const AESEncryption: React.FC = () => {
  const [mode, setMode] = useState<AESMode>('AES-GCM');
  const [keySize, setKeySize] = useState<KeySize>(256);
  const [view, setView] = useState<AESView>('encrypt');
  const [passphrase, setPassphrase] = useState('');
  const [plaintext, setPlaintext] = useState('');
  const [ciphertext, setCiphertext] = useState('');
  const [decryptInput, setDecryptInput] = useState('');
  const [decryptPassphrase, setDecryptPassphrase] = useState('');
  const [decryptedText, setDecryptedText] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const deriveKey = async (pass: string, salt: Uint8Array, aesMode: AESMode, aesKeySize: KeySize): Promise<CryptoKey> => {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: aesMode, length: aesKeySize },
      false,
      ['encrypt', 'decrypt']
    );
  };

  const handleEncrypt = useCallback(async () => {
    if (!passphrase || !plaintext) return;
    setIsProcessing(true);
    setError('');
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const key = await deriveKey(passphrase, salt, mode, keySize);
      const ivLen = mode === 'AES-GCM' ? 12 : 16;
      const iv = crypto.getRandomValues(new Uint8Array(ivLen));
      const enc = new TextEncoder();
      const encrypted = await crypto.subtle.encrypt({ name: mode, iv }, key, enc.encode(plaintext));
      // Pack: salt(16) | iv(12 or 16) | ciphertext
      const packed = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
      packed.set(salt, 0);
      packed.set(iv, salt.length);
      packed.set(new Uint8Array(encrypted), salt.length + iv.length);
      setCiphertext(toBase64(packed.buffer));
    } catch (e) {
      setError('Encryption failed: ' + (e instanceof Error ? e.message : 'unknown error'));
    }
    setIsProcessing(false);
  }, [passphrase, plaintext, mode, keySize]);

  const handleDecrypt = useCallback(async () => {
    if (!decryptPassphrase || !decryptInput) return;
    setIsProcessing(true);
    setError('');
    setDecryptedText('');
    try {
      const packed = fromBase64(decryptInput);
      const salt = packed.slice(0, 16);
      const ivLen = mode === 'AES-GCM' ? 12 : 16;
      const iv = packed.slice(16, 16 + ivLen);
      const data = packed.slice(16 + ivLen);
      const key = await deriveKey(decryptPassphrase, salt, mode, keySize);
      const decrypted = await crypto.subtle.decrypt({ name: mode, iv }, key, data);
      setDecryptedText(new TextDecoder().decode(decrypted));
    } catch {
      setError('Decryption failed. Wrong passphrase or corrupted data.');
    }
    setIsProcessing(false);
  }, [decryptPassphrase, decryptInput, mode, keySize]);

  const generateRandomKey = () => {
    const bytes = crypto.getRandomValues(new Uint8Array(keySize / 8));
    setPassphrase(toHex(bytes));
  };

  const selectClass = 'px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100';

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-950 dark:to-blue-950 p-3 overflow-hidden">
      <div className="flex flex-wrap gap-2 mb-2 items-center">
        <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          {(['encrypt', 'decrypt'] as const).map(v => (
            <button key={v} onClick={() => { setView(v); setError(''); }}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${view === v ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300'}`}>
              {v === 'encrypt' ? 'Encrypt' : 'Decrypt'}
            </button>
          ))}
        </div>
        <select value={mode} onChange={e => setMode(e.target.value as AESMode)} className={selectClass}>
          <option value="AES-GCM">AES-GCM (authenticated)</option>
          <option value="AES-CBC">AES-CBC</option>
        </select>
        <select value={keySize} onChange={e => setKeySize(Number(e.target.value) as KeySize)} className={selectClass}>
          <option value={128}>128-bit key</option>
          <option value={256}>256-bit key</option>
        </select>
      </div>

      {error && <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg p-2 mb-2">{error}</div>}

      <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-auto">
        {view === 'encrypt' ? (
          <>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Passphrase</label>
                <button onClick={generateRandomKey} className="px-2 py-0.5 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-700">Random Key</button>
              </div>
              <input value={passphrase} onChange={e => setPassphrase(e.target.value)} placeholder="Enter passphrase..."
                className={`w-full ${selectClass} font-mono`} />
            </div>
            <div className="flex-1 flex flex-col">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Plaintext</label>
              <textarea value={plaintext} onChange={e => setPlaintext(e.target.value)} placeholder="Enter text to encrypt..."
                className="flex-1 p-2 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 resize-none min-h-[80px]" />
            </div>
            <button onClick={handleEncrypt} disabled={isProcessing || !passphrase || !plaintext}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 self-start">
              {isProcessing ? 'Encrypting...' : 'Encrypt'}
            </button>
            {ciphertext && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Ciphertext (Base64)</span>
                  <button onClick={() => navigator.clipboard.writeText(ciphertext)} className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px]">Copy</button>
                </div>
                <div className="text-xs font-mono text-gray-800 dark:text-gray-200 break-all select-all max-h-24 overflow-auto">{ciphertext}</div>
              </div>
            )}
          </>
        ) : (
          <>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Passphrase</label>
              <input value={decryptPassphrase} onChange={e => setDecryptPassphrase(e.target.value)} placeholder="Enter passphrase..."
                className={`w-full ${selectClass} font-mono`} />
            </div>
            <div className="flex-1 flex flex-col">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Ciphertext (Base64)</label>
              <textarea value={decryptInput} onChange={e => setDecryptInput(e.target.value)} placeholder="Paste ciphertext..."
                className="flex-1 p-2 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono resize-none min-h-[80px]" />
            </div>
            <button onClick={handleDecrypt} disabled={isProcessing || !decryptPassphrase || !decryptInput}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 self-start">
              {isProcessing ? 'Decrypting...' : 'Decrypt'}
            </button>
            {decryptedText && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-300 dark:border-green-700">
                <div className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1">Decrypted Text</div>
                <div className="text-sm text-gray-800 dark:text-gray-200">{decryptedText}</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
