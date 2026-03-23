import React, { useState, useCallback } from 'react';
import { Key, Lock, Unlock, PenLine, CheckCircle, XCircle, Copy, Check, Clock, ArrowRight, Shield } from 'lucide-react';

type RSATab = 'keys' | 'encrypt' | 'sign';

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
function arrayBufferToPEM(buf: ArrayBuffer, type: 'PUBLIC' | 'PRIVATE'): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  const b64 = btoa(binary);
  const lines = b64.match(/.{1,64}/g) || [];
  return `-----BEGIN ${type} KEY-----\n${lines.join('\n')}\n-----END ${type} KEY-----`;
}

function CopyBtn({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button onClick={copy} className="flex items-center gap-1 px-2 py-0.5 text-[10px] bg-blue-600 hover:bg-blue-700 text-white rounded transition-all">
      {copied ? <Check size={10} /> : <Copy size={10} />}
      {copied ? 'Copied!' : label}
    </button>
  );
}

function FingerprintBadge({ fingerprint }: { fingerprint: string }) {
  const chunks = fingerprint.match(/.{4}/g) || [];
  return (
    <div className="flex flex-wrap gap-0.5 mt-1">
      {chunks.map((c, i) => (
        <span key={i} className="font-mono text-[9px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1 rounded">{c}</span>
      ))}
    </div>
  );
}

export const RSASandbox: React.FC = () => {
  const [keySize, setKeySize] = useState<2048 | 4096>(2048);
  const [tab, setTab] = useState<RSATab>('keys');
  const [publicKeyJWK, setPublicKeyJWK] = useState('');
  const [privateKeyJWK, setPrivateKeyJWK] = useState('');
  const [publicKeyPEM, setPublicKeyPEM] = useState('');
  const [privateKeyPEM, setPrivateKeyPEM] = useState('');
  const [fingerprint, setFingerprint] = useState('');
  const [keyPair, setKeyPair] = useState<CryptoKeyPair | null>(null);
  const [genElapsed, setGenElapsed] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [encPlaintext, setEncPlaintext] = useState('');
  const [encCiphertext, setEncCiphertext] = useState('');
  const [encElapsed, setEncElapsed] = useState<number | null>(null);
  const [decInput, setDecInput] = useState('');
  const [decOutput, setDecOutput] = useState('');
  const [decElapsed, setDecElapsed] = useState<number | null>(null);
  const [signMessage, setSignMessage] = useState('');
  const [signature, setSignature] = useState('');
  const [signElapsed, setSignElapsed] = useState<number | null>(null);
  const [verifyMessage, setVerifyMessage] = useState('');
  const [verifySignature, setVerifySignature] = useState('');
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [keyView, setKeyView] = useState<'jwk' | 'pem'>('jwk');

  const maxMessageLen = keySize / 8 - 66;

  const generateKeyPair = useCallback(async () => {
    setIsGenerating(true);
    setError('');
    setFingerprint('');
    setGenElapsed(null);
    const t0 = performance.now();
    try {
      const kp = await crypto.subtle.generateKey(
        { name: 'RSA-OAEP', modulusLength: keySize, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
        true, ['encrypt', 'decrypt']
      );
      setKeyPair(kp);
      const pubJWK = await crypto.subtle.exportKey('jwk', kp.publicKey);
      const privJWK = await crypto.subtle.exportKey('jwk', kp.privateKey);
      setPublicKeyJWK(JSON.stringify(pubJWK, null, 2));
      setPrivateKeyJWK(JSON.stringify(privJWK, null, 2));
      const pubSPKI = await crypto.subtle.exportKey('spki', kp.publicKey);
      const privPKCS8 = await crypto.subtle.exportKey('pkcs8', kp.privateKey);
      setPublicKeyPEM(arrayBufferToPEM(pubSPKI, 'PUBLIC'));
      setPrivateKeyPEM(arrayBufferToPEM(privPKCS8, 'PRIVATE'));
      // fingerprint = SHA-256 of SPKI
      const fpBuf = await crypto.subtle.digest('SHA-256', pubSPKI);
      setFingerprint(toHex(new Uint8Array(fpBuf)));
      setGenElapsed(performance.now() - t0);
    } catch (e) {
      setError('Key generation failed: ' + (e instanceof Error ? e.message : ''));
    }
    setIsGenerating(false);
  }, [keySize]);

  const handleEncrypt = useCallback(async () => {
    if (!keyPair || !encPlaintext) return;
    setIsProcessing(true); setError(''); setEncElapsed(null);
    const t0 = performance.now();
    try {
      const data = new TextEncoder().encode(encPlaintext);
      const encrypted = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, keyPair.publicKey, data);
      setEncCiphertext(toBase64(encrypted));
      setEncElapsed(performance.now() - t0);
    } catch {
      setError(`Encryption failed. Message may be too long (max ${maxMessageLen} bytes).`);
    }
    setIsProcessing(false);
  }, [keyPair, encPlaintext, maxMessageLen]);

  const handleDecrypt = useCallback(async () => {
    if (!keyPair || !decInput) return;
    setIsProcessing(true); setError(''); setDecOutput(''); setDecElapsed(null);
    const t0 = performance.now();
    try {
      const data = fromBase64(decInput.trim());
      const decrypted = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, keyPair.privateKey, data);
      setDecOutput(new TextDecoder().decode(decrypted));
      setDecElapsed(performance.now() - t0);
    } catch {
      setError('Decryption failed. Wrong key or corrupted data.');
    }
    setIsProcessing(false);
  }, [keyPair, decInput]);

  const handleSign = useCallback(async () => {
    if (!keyPair || !signMessage) return;
    setIsProcessing(true); setError(''); setSignElapsed(null);
    const t0 = performance.now();
    try {
      const privJWK = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
      privJWK.key_ops = ['sign'];
      const pssKey = await crypto.subtle.importKey('jwk', privJWK, { name: 'RSA-PSS', hash: 'SHA-256' }, false, ['sign']);
      const sig = await crypto.subtle.sign({ name: 'RSA-PSS', saltLength: 32 }, pssKey, new TextEncoder().encode(signMessage));
      setSignature(toBase64(sig));
      setSignElapsed(performance.now() - t0);
    } catch (e) {
      setError('Signing failed: ' + (e instanceof Error ? e.message : ''));
    }
    setIsProcessing(false);
  }, [keyPair, signMessage]);

  const handleVerify = useCallback(async () => {
    if (!keyPair || !verifyMessage || !verifySignature) return;
    setIsProcessing(true); setError(''); setVerifyResult(null);
    try {
      const pubJWK = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
      pubJWK.key_ops = ['verify'];
      const pssKey = await crypto.subtle.importKey('jwk', pubJWK, { name: 'RSA-PSS', hash: 'SHA-256' }, false, ['verify']);
      const valid = await crypto.subtle.verify({ name: 'RSA-PSS', saltLength: 32 }, pssKey, fromBase64(verifySignature.trim()), new TextEncoder().encode(verifyMessage));
      setVerifyResult(valid);
    } catch {
      setVerifyResult(false);
    }
    setIsProcessing(false);
  }, [keyPair, verifyMessage, verifySignature]);

  const useEncryptOutput = () => {
    setDecInput(encCiphertext);
    setTab('encrypt');
    setError('');
  };
  const useSignOutput = () => {
    setVerifyMessage(signMessage);
    setVerifySignature(signature);
    setVerifyResult(null);
    setError('');
  };

  const selectClass = 'px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100';
  const btnPrimary = 'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg text-white font-semibold disabled:opacity-50 self-start';

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-purple-50 dark:from-gray-950 dark:to-purple-950 p-3 overflow-hidden gap-2">

      {/* Top bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <select value={keySize} onChange={e => { setKeySize(Number(e.target.value) as 2048 | 4096); setKeyPair(null); setFingerprint(''); }}
          className={selectClass}>
          <option value={2048}>RSA-2048</option>
          <option value={4096}>RSA-4096</option>
        </select>

        <button onClick={generateKeyPair} disabled={isGenerating}
          className={`${btnPrimary} bg-purple-600 hover:bg-purple-700`}>
          <Key size={13} />
          {isGenerating ? 'Generating...' : 'Generate Key Pair'}
        </button>

        {genElapsed !== null && (
          <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Clock size={9} /> {genElapsed.toFixed(0)}ms</span>
        )}

        <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 ml-auto">
          {(['keys', 'encrypt', 'sign'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setError(''); }}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${tab === t ? 'bg-purple-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
              {t === 'keys' ? 'Keys' : t === 'encrypt' ? 'Encrypt/Decrypt' : 'Sign/Verify'}
            </button>
          ))}
        </div>
      </div>

      {!keyPair && <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-1.5">Generate a key pair to get started.</div>}
      {error && <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg p-2">{error}</div>}

      <div className="flex-1 min-h-0 overflow-auto">
        {/* Keys tab */}
        {tab === 'keys' && (
          <div className="h-full flex flex-col gap-2">
            {fingerprint && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-1 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  <Shield size={10} className="text-purple-500" /> Public Key Fingerprint (SHA-256)
                </div>
                <FingerprintBadge fingerprint={fingerprint} />
              </div>
            )}
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <span>View:</span>
              {(['jwk', 'pem'] as const).map(v => (
                <button key={v} onClick={() => setKeyView(v)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium ${keyView === v ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                  {v.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="flex gap-3 flex-1 min-h-0">
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-green-700 dark:text-green-300 flex items-center gap-1"><Unlock size={10} /> Public Key</span>
                  <CopyBtn text={keyView === 'jwk' ? publicKeyJWK : publicKeyPEM} label={keyView.toUpperCase()} />
                </div>
                <pre className="flex-1 p-2 text-[9px] font-mono bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-auto text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {(keyView === 'jwk' ? publicKeyJWK : publicKeyPEM) || 'No key generated'}
                </pre>
              </div>
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1"><Lock size={10} /> Private Key</span>
                  <CopyBtn text={keyView === 'jwk' ? privateKeyJWK : privateKeyPEM} label={keyView.toUpperCase()} />
                </div>
                <pre className="flex-1 p-2 text-[9px] font-mono bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-auto text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {(keyView === 'jwk' ? privateKeyJWK : privateKeyPEM) || 'No key generated'}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Encrypt/Decrypt tab */}
        {tab === 'encrypt' && (
          <div className="flex gap-3 h-full">
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
                <Lock size={11} className="text-green-600" /> Encrypt (Public Key · RSA-OAEP)
              </div>
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] text-gray-400">Max {maxMessageLen} bytes</span>
                  {encPlaintext && <span className="text-[10px] text-gray-400">{new TextEncoder().encode(encPlaintext).byteLength}B</span>}
                </div>
                <textarea value={encPlaintext} onChange={e => setEncPlaintext(e.target.value)} placeholder="Enter text to encrypt..."
                  className="flex-1 p-2 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 resize-none min-h-[60px]" />
              </div>
              <button onClick={handleEncrypt} disabled={!keyPair || isProcessing || !encPlaintext}
                className={`${btnPrimary} bg-green-600 hover:bg-green-700`}>
                <Lock size={12} /> Encrypt
              </button>
              {encCiphertext && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                      <Clock size={8} /> {encElapsed !== null ? `${encElapsed.toFixed(1)}ms` : ''} · Ciphertext
                    </span>
                    <div className="flex gap-1">
                      <CopyBtn text={encCiphertext} />
                      <button onClick={useEncryptOutput}
                        className="flex items-center gap-1 px-2 py-0.5 text-[10px] bg-purple-600 hover:bg-purple-700 text-white rounded">
                        <ArrowRight size={9} /> → Decrypt
                      </button>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-gray-700 dark:text-gray-300 break-all max-h-20 overflow-auto">{encCiphertext}</div>
                </div>
              )}
            </div>

            <div className="w-px bg-gray-200 dark:bg-gray-700 self-stretch" />

            <div className="flex-1 flex flex-col gap-2">
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
                <Unlock size={11} className="text-blue-600" /> Decrypt (Private Key)
              </div>
              <textarea value={decInput} onChange={e => setDecInput(e.target.value)} placeholder="Paste ciphertext (Base64)..."
                className="flex-1 p-2 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono resize-none min-h-[60px]" />
              <button onClick={handleDecrypt} disabled={!keyPair || isProcessing || !decInput}
                className={`${btnPrimary} bg-blue-600 hover:bg-blue-700`}>
                <Unlock size={12} /> Decrypt
              </button>
              {decOutput && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 border border-green-300 dark:border-green-700">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">Plaintext</span>
                    <div className="flex items-center gap-2">
                      {decElapsed !== null && <span className="text-[10px] text-gray-400">{decElapsed.toFixed(1)}ms</span>}
                      <CopyBtn text={decOutput} />
                    </div>
                  </div>
                  <span className="text-xs text-gray-800 dark:text-gray-200">{decOutput}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sign/Verify tab */}
        {tab === 'sign' && (
          <div className="flex gap-3 h-full">
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
                <PenLine size={11} className="text-purple-600" /> Sign (Private Key · RSA-PSS/SHA-256)
              </div>
              <textarea value={signMessage} onChange={e => setSignMessage(e.target.value)} placeholder="Enter message to sign..."
                className="flex-1 p-2 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 resize-none min-h-[60px]" />
              <button onClick={handleSign} disabled={!keyPair || isProcessing || !signMessage}
                className={`${btnPrimary} bg-purple-600 hover:bg-purple-700`}>
                <PenLine size={12} /> Sign
              </button>
              {signature && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                      <Clock size={8} /> {signElapsed !== null ? `${signElapsed.toFixed(1)}ms` : ''} · Signature
                    </span>
                    <div className="flex gap-1">
                      <CopyBtn text={signature} />
                      <button onClick={useSignOutput}
                        className="flex items-center gap-1 px-2 py-0.5 text-[10px] bg-purple-600 hover:bg-purple-700 text-white rounded">
                        <ArrowRight size={9} /> → Verify
                      </button>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-gray-700 dark:text-gray-300 break-all max-h-16 overflow-auto">{signature}</div>
                </div>
              )}
            </div>

            <div className="w-px bg-gray-200 dark:bg-gray-700 self-stretch" />

            <div className="flex-1 flex flex-col gap-2">
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
                <CheckCircle size={11} className="text-green-600" /> Verify (Public Key)
              </div>
              <textarea value={verifyMessage} onChange={e => { setVerifyMessage(e.target.value); setVerifyResult(null); }} placeholder="Enter message..."
                className="p-2 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 resize-none min-h-[40px]" />
              <textarea value={verifySignature} onChange={e => { setVerifySignature(e.target.value); setVerifyResult(null); }} placeholder="Paste signature (Base64)..."
                className="p-2 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono resize-none min-h-[40px]" />
              <button onClick={handleVerify} disabled={!keyPair || isProcessing || !verifyMessage || !verifySignature}
                className={`${btnPrimary} bg-purple-600 hover:bg-purple-700`}>
                <CheckCircle size={12} /> Verify
              </button>
              {verifyResult !== null && (
                <div className={`rounded-lg p-3 border-2 flex items-center gap-2 ${verifyResult ? 'bg-green-50 dark:bg-green-900/30 border-green-400' : 'bg-red-50 dark:bg-red-900/30 border-red-400'}`}>
                  {verifyResult ? <CheckCircle size={16} className="text-green-600" /> : <XCircle size={16} className="text-red-500" />}
                  <div>
                    <div className={`text-sm font-bold ${verifyResult ? 'text-green-600' : 'text-red-500'}`}>
                      {verifyResult ? 'Signature is VALID' : 'Signature is INVALID'}
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                      {verifyResult ? 'The message was signed by the holder of this private key.' : 'The signature does not match this message or was made with a different key.'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
