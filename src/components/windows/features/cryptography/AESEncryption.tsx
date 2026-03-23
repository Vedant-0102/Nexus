import React, { useState, useCallback } from 'react';
import { Lock, Unlock, Copy, Check, Key, Clock, Shield, Info, ArrowRight } from 'lucide-react';

type AESMode = 'AES-GCM' | 'AES-CBC';
type KeySize = 128 | 256;
type AESView = 'encrypt' | 'decrypt';

interface EncryptMeta {
  algorithm: string;
  keyBits: number;
  pbkdf2Iterations: number;
  saltHex: string;
  ivHex: string;
  plaintextBytes: number;
  ciphertextBytes: number;
  elapsedMs: number;
}

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
function fromBase64(str: string): Uint8Array {
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}
function toHex(buf: Uint8Array): string {
  return Array.from(buf, b => b.toString(16).padStart(2, '0')).join('');
}

function passphraseStrength(pass: string): { score: number; label: string; color: string } {
  if (!pass) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pass.length >= 8) score++;
  if (pass.length >= 16) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;
  if (pass.length >= 32) score++;
  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong', 'Excellent'];
  const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#10b981', '#06b6d4'];
  const idx = Math.min(score, 6);
  return { score, label: labels[idx], color: colors[idx] };
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button onClick={copy} className="flex items-center gap-1 px-2 py-0.5 text-[10px] bg-blue-600 hover:bg-blue-700 text-white rounded transition-all">
      {copied ? <Check size={10} /> : <Copy size={10} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function MetaRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="text-gray-500 dark:text-gray-400 shrink-0 w-24">{label}</span>
      <span className={`text-gray-800 dark:text-gray-200 break-all ${mono ? 'font-mono text-[10px]' : ''}`}>{value}</span>
    </div>
  );
}

export const AESEncryption: React.FC = () => {
  const [mode, setMode] = useState<AESMode>('AES-GCM');
  const [keySize, setKeySize] = useState<KeySize>(256);
  const [view, setView] = useState<AESView>('encrypt');
  const [passphrase, setPassphrase] = useState('');
  const [plaintext, setPlaintext] = useState('');
  const [ciphertext, setCiphertext] = useState('');
  const [encMeta, setEncMeta] = useState<EncryptMeta | null>(null);
  const [decryptInput, setDecryptInput] = useState('');
  const [decryptPassphrase, setDecryptPassphrase] = useState('');
  const [decryptedText, setDecryptedText] = useState('');
  const [decryptElapsed, setDecryptElapsed] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModeInfo, setShowModeInfo] = useState(false);

  const strength = passphraseStrength(passphrase);

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
    setEncMeta(null);
    const t0 = performance.now();
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const key = await deriveKey(passphrase, salt, mode, keySize);
      const ivLen = mode === 'AES-GCM' ? 12 : 16;
      const iv = crypto.getRandomValues(new Uint8Array(ivLen));
      const enc = new TextEncoder();
      const encoded = enc.encode(plaintext);
      const encrypted = await crypto.subtle.encrypt({ name: mode, iv }, key, encoded);
      const packed = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
      packed.set(salt, 0);
      packed.set(iv, salt.length);
      packed.set(new Uint8Array(encrypted), salt.length + iv.length);
      const b64 = toBase64(packed.buffer);
      setCiphertext(b64);
      setEncMeta({
        algorithm: mode,
        keyBits: keySize,
        pbkdf2Iterations: 100000,
        saltHex: toHex(salt),
        ivHex: toHex(iv),
        plaintextBytes: encoded.byteLength,
        ciphertextBytes: packed.byteLength,
        elapsedMs: performance.now() - t0,
      });
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
    setDecryptElapsed(null);
    const t0 = performance.now();
    try {
      const packed = fromBase64(decryptInput.trim());
      const salt = packed.slice(0, 16);
      const ivLen = mode === 'AES-GCM' ? 12 : 16;
      const iv = packed.slice(16, 16 + ivLen);
      const data = packed.slice(16 + ivLen);
      const key = await deriveKey(decryptPassphrase, salt, mode, keySize);
      const decrypted = await crypto.subtle.decrypt({ name: mode, iv }, key, data);
      setDecryptedText(new TextDecoder().decode(decrypted));
      setDecryptElapsed(performance.now() - t0);
    } catch {
      setError('Decryption failed. Wrong passphrase, wrong mode/key size, or corrupted data.');
    }
    setIsProcessing(false);
  }, [decryptPassphrase, decryptInput, mode, keySize]);

  const useOutputForDecrypt = () => {
    setDecryptInput(ciphertext);
    setDecryptPassphrase(passphrase);
    setView('decrypt');
    setError('');
  };

  const generateRandomKey = () => {
    const bytes = crypto.getRandomValues(new Uint8Array(keySize / 8));
    setPassphrase(toHex(bytes));
  };

  const selectClass = 'px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100';

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-950 dark:to-blue-950 p-3 gap-2 overflow-hidden">

      {/* Top bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          {(['encrypt', 'decrypt'] as const).map(v => (
            <button key={v} onClick={() => { setView(v); setError(''); }}
              className={`flex items-center gap-1 px-3 py-1 text-xs rounded-md font-medium transition-colors ${view === v ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
              {v === 'encrypt' ? <Lock size={10} /> : <Unlock size={10} />}
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

        <button onClick={() => setShowModeInfo(v => !v)}
          className={`flex items-center gap-1 px-2 py-1.5 text-xs rounded-lg border transition-colors ${showModeInfo ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-400 text-blue-700 dark:text-blue-300' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'}`}>
          <Info size={11} /> Mode Info
        </button>
      </div>

      {/* Mode info panel */}
      {showModeInfo && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className={`rounded-lg p-2 border-2 ${mode === 'AES-GCM' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
            <div className="font-bold text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1"><Shield size={10} /> AES-GCM</div>
            <div className="text-gray-600 dark:text-gray-400">Authenticated encryption. Detects tampering. 12-byte IV. Auth tag ensures integrity. <span className="text-green-600 dark:text-green-400 font-medium">Recommended.</span></div>
          </div>
          <div className={`rounded-lg p-2 border-2 ${mode === 'AES-CBC' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
            <div className="font-bold text-orange-600 dark:text-orange-400 mb-1 flex items-center gap-1"><Lock size={10} /> AES-CBC</div>
            <div className="text-gray-600 dark:text-gray-400">No authentication. 16-byte IV. Vulnerable to padding oracle if not combined with HMAC. <span className="text-orange-500 font-medium">Legacy use.</span></div>
          </div>
        </div>
      )}

      {error && <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg p-2">{error}</div>}

      <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-auto">
        {view === 'encrypt' ? (
          <>
            {/* Passphrase */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1"><Key size={10} /> Passphrase</label>
                <button onClick={generateRandomKey} className="flex items-center gap-1 px-2 py-0.5 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-700">
                  <Key size={8} /> Random Key
                </button>
              </div>
              <input value={passphrase} onChange={e => setPassphrase(e.target.value)} placeholder="Enter passphrase..."
                className={`w-full ${selectClass} font-mono`} />
              {passphrase && (
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${(strength.score / 6) * 100}%`, backgroundColor: strength.color }} />
                  </div>
                  <span className="text-[10px] font-medium shrink-0" style={{ color: strength.color }}>{strength.label}</span>
                </div>
              )}
            </div>

            {/* Plaintext */}
            <div className="flex flex-col" style={{ minHeight: 80 }}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Plaintext</label>
                {plaintext && <span className="text-[10px] text-gray-400">{new TextEncoder().encode(plaintext).byteLength} bytes</span>}
              </div>
              <textarea value={plaintext} onChange={e => setPlaintext(e.target.value)} placeholder="Enter text to encrypt..."
                className="flex-1 p-2 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 resize-none min-h-[80px]" />
            </div>

            <button onClick={handleEncrypt} disabled={isProcessing || !passphrase || !plaintext}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 self-start">
              <Lock size={13} />
              {isProcessing ? 'Encrypting...' : 'Encrypt'}
            </button>

            {/* Result */}
            {ciphertext && (
              <div className="space-y-2">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Ciphertext (Base64)</span>
                    <div className="flex items-center gap-1">
                      <CopyBtn text={ciphertext} />
                      <button onClick={useOutputForDecrypt}
                        className="flex items-center gap-1 px-2 py-0.5 text-[10px] bg-green-600 hover:bg-green-700 text-white rounded transition-colors">
                        <ArrowRight size={9} /> Use for Decrypt
                      </button>
                    </div>
                  </div>
                  <div className="text-xs font-mono text-gray-800 dark:text-gray-200 break-all select-all max-h-20 overflow-auto">{ciphertext}</div>
                </div>

                {encMeta && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-1 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <Clock size={10} /> Encryption Metadata
                    </div>
                    <div className="space-y-1">
                      <MetaRow label="Algorithm" value={`${encMeta.algorithm} / ${encMeta.keyBits}-bit`} />
                      <MetaRow label="PBKDF2" value={`${encMeta.pbkdf2Iterations.toLocaleString()} iterations (SHA-256)`} />
                      <MetaRow label="Salt (hex)" value={encMeta.saltHex} mono />
                      <MetaRow label="IV (hex)" value={encMeta.ivHex} mono />
                      <MetaRow label="Plaintext" value={`${encMeta.plaintextBytes} bytes → ${encMeta.ciphertextBytes} bytes packed`} />
                      <MetaRow label="Time" value={`${encMeta.elapsedMs.toFixed(1)} ms`} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1 block"><Key size={10} /> Passphrase</label>
              <input value={decryptPassphrase} onChange={e => setDecryptPassphrase(e.target.value)} placeholder="Enter passphrase..."
                className={`w-full ${selectClass} font-mono`} />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Ciphertext (Base64)</label>
              <textarea value={decryptInput} onChange={e => setDecryptInput(e.target.value)} placeholder="Paste ciphertext..."
                className="flex-1 p-2 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono resize-none min-h-[80px]" />
            </div>

            <button onClick={handleDecrypt} disabled={isProcessing || !decryptPassphrase || !decryptInput}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 self-start">
              <Unlock size={13} />
              {isProcessing ? 'Decrypting...' : 'Decrypt'}
            </button>

            {decryptedText && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-300 dark:border-green-700">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-semibold text-green-700 dark:text-green-300 flex items-center gap-1">
                    <Unlock size={10} /> Decrypted Text
                  </div>
                  <div className="flex items-center gap-2">
                    {decryptElapsed !== null && (
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Clock size={8} /> {decryptElapsed.toFixed(1)}ms</span>
                    )}
                    <CopyBtn text={decryptedText} />
                  </div>
                </div>
                <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{decryptedText}</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
