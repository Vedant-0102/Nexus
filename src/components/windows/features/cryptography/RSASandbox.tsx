import React, { useState, useCallback } from 'react';

type RSATab = 'keys' | 'encrypt' | 'sign';

function toBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function fromBase64(str: string): Uint8Array {
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

function arrayBufferToPEM(buf: ArrayBuffer, type: 'PUBLIC' | 'PRIVATE'): string {
  const b64 = toBase64(buf);
  const lines = b64.match(/.{1,64}/g) || [];
  return `-----BEGIN ${type} KEY-----\n${lines.join('\n')}\n-----END ${type} KEY-----`;
}

export const RSASandbox: React.FC = () => {
  const [keySize, setKeySize] = useState<2048 | 4096>(2048);
  const [tab, setTab] = useState<RSATab>('keys');
  const [publicKeyJWK, setPublicKeyJWK] = useState('');
  const [privateKeyJWK, setPrivateKeyJWK] = useState('');
  const [publicKeyPEM, setPublicKeyPEM] = useState('');
  const [privateKeyPEM, setPrivateKeyPEM] = useState('');
  const [keyPair, setKeyPair] = useState<CryptoKeyPair | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [encPlaintext, setEncPlaintext] = useState('');
  const [encCiphertext, setEncCiphertext] = useState('');
  const [decInput, setDecInput] = useState('');
  const [decOutput, setDecOutput] = useState('');
  const [signMessage, setSignMessage] = useState('');
  const [signature, setSignature] = useState('');
  const [verifyMessage, setVerifyMessage] = useState('');
  const [verifySignature, setVerifySignature] = useState('');
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const maxMessageLen = keySize / 8 - 66; // RSA-OAEP with SHA-256

  const generateKeyPair = useCallback(async () => {
    setIsGenerating(true);
    setError('');
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
    } catch (e) {
      setError('Key generation failed: ' + (e instanceof Error ? e.message : ''));
    }
    setIsGenerating(false);
  }, [keySize]);

  const handleEncrypt = useCallback(async () => {
    if (!keyPair || !encPlaintext) return;
    setIsProcessing(true); setError('');
    try {
      const data = new TextEncoder().encode(encPlaintext);
      const encrypted = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, keyPair.publicKey, data);
      setEncCiphertext(toBase64(encrypted));
    } catch (e) {
      setError('Encryption failed. Message may be too long (max ' + maxMessageLen + ' bytes).');
    }
    setIsProcessing(false);
  }, [keyPair, encPlaintext, maxMessageLen]);

  const handleDecrypt = useCallback(async () => {
    if (!keyPair || !decInput) return;
    setIsProcessing(true); setError(''); setDecOutput('');
    try {
      const data = fromBase64(decInput);
      const decrypted = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, keyPair.privateKey, data);
      setDecOutput(new TextDecoder().decode(decrypted));
    } catch {
      setError('Decryption failed. Wrong key or corrupted data.');
    }
    setIsProcessing(false);
  }, [keyPair, decInput]);

  const handleSign = useCallback(async () => {
    if (!keyPair || !signMessage) return;
    setIsProcessing(true); setError('');
    try {
      // Need RSA-PSS for signing - re-import as PSS
      const privJWK = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
      privJWK.key_ops = ['sign'];
      const pssKey = await crypto.subtle.importKey('jwk', privJWK, { name: 'RSA-PSS', hash: 'SHA-256' }, false, ['sign']);
      const sig = await crypto.subtle.sign({ name: 'RSA-PSS', saltLength: 32 }, pssKey, new TextEncoder().encode(signMessage));
      setSignature(toBase64(sig));
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
      const valid = await crypto.subtle.verify({ name: 'RSA-PSS', saltLength: 32 }, pssKey, fromBase64(verifySignature), new TextEncoder().encode(verifyMessage));
      setVerifyResult(valid);
    } catch {
      setVerifyResult(false);
    }
    setIsProcessing(false);
  }, [keyPair, verifyMessage, verifySignature]);

  const selectClass = 'px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100';

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-purple-50 dark:from-gray-950 dark:to-purple-950 p-3 overflow-hidden">
      <div className="flex flex-wrap gap-2 mb-2 items-center">
        <select value={keySize} onChange={e => setKeySize(Number(e.target.value) as 2048 | 4096)} className={selectClass}>
          <option value={2048}>2048-bit</option>
          <option value={4096}>4096-bit</option>
        </select>
        <button onClick={generateKeyPair} disabled={isGenerating}
          className="px-4 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold disabled:opacity-50">
          {isGenerating ? 'Generating...' : 'Generate Key Pair'}
        </button>
        <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 ml-2">
          {(['keys', 'encrypt', 'sign'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setError(''); }}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${tab === t ? 'bg-purple-600 text-white' : 'text-gray-600 dark:text-gray-300'}`}>
              {t === 'keys' ? 'Keys' : t === 'encrypt' ? 'Encrypt/Decrypt' : 'Sign/Verify'}
            </button>
          ))}
        </div>
        {!keyPair && <span className="text-xs text-amber-600 ml-auto">Generate a key pair first</span>}
      </div>

      {error && <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg p-2 mb-2">{error}</div>}

      <div className="flex-1 min-h-0 overflow-auto">
        {tab === 'keys' && (
          <div className="flex gap-3 h-full">
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-green-700 dark:text-green-300">Public Key</span>
                <div className="flex gap-1">
                  <button onClick={() => navigator.clipboard.writeText(publicKeyJWK)} className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px]">JWK</button>
                  <button onClick={() => navigator.clipboard.writeText(publicKeyPEM)} className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px]">PEM</button>
                </div>
              </div>
              <pre className="flex-1 p-2 text-[9px] font-mono bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-auto text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {publicKeyJWK || 'No key generated'}
              </pre>
            </div>
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-red-600 dark:text-red-400">Private Key</span>
                <div className="flex gap-1">
                  <button onClick={() => navigator.clipboard.writeText(privateKeyJWK)} className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px]">JWK</button>
                  <button onClick={() => navigator.clipboard.writeText(privateKeyPEM)} className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px]">PEM</button>
                </div>
              </div>
              <pre className="flex-1 p-2 text-[9px] font-mono bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-auto text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {privateKeyJWK || 'No key generated'}
              </pre>
            </div>
          </div>
        )}

        {tab === 'encrypt' && (
          <div className="flex gap-3 h-full">
            <div className="flex-1 flex flex-col gap-2">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Encrypt (Public Key)</span>
              <textarea value={encPlaintext} onChange={e => setEncPlaintext(e.target.value)} placeholder={`Enter text (max ${maxMessageLen} bytes)...`}
                className="flex-1 p-2 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 resize-none min-h-[60px]" />
              <button onClick={handleEncrypt} disabled={!keyPair || isProcessing || !encPlaintext}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg disabled:opacity-50 self-start">Encrypt</button>
              {encCiphertext && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded p-2 border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-500">Ciphertext</span>
                    <button onClick={() => navigator.clipboard.writeText(encCiphertext)} className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-[10px]">Copy</button>
                  </div>
                  <div className="text-[10px] font-mono text-gray-700 dark:text-gray-300 break-all max-h-20 overflow-auto">{encCiphertext}</div>
                </div>
              )}
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Decrypt (Private Key)</span>
              <textarea value={decInput} onChange={e => setDecInput(e.target.value)} placeholder="Paste ciphertext..."
                className="flex-1 p-2 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono resize-none min-h-[60px]" />
              <button onClick={handleDecrypt} disabled={!keyPair || isProcessing || !decInput}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50 self-start">Decrypt</button>
              {decOutput && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded p-2 border border-green-300 dark:border-green-700">
                  <span className="text-xs text-gray-800 dark:text-gray-200">{decOutput}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'sign' && (
          <div className="flex gap-3 h-full">
            <div className="flex-1 flex flex-col gap-2">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Sign (Private Key, RSA-PSS)</span>
              <textarea value={signMessage} onChange={e => setSignMessage(e.target.value)} placeholder="Enter message to sign..."
                className="flex-1 p-2 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 resize-none min-h-[60px]" />
              <button onClick={handleSign} disabled={!keyPair || isProcessing || !signMessage}
                className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg disabled:opacity-50 self-start">Sign</button>
              {signature && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded p-2 border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-500">Signature</span>
                    <button onClick={() => navigator.clipboard.writeText(signature)} className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-[10px]">Copy</button>
                  </div>
                  <div className="text-[10px] font-mono text-gray-700 dark:text-gray-300 break-all max-h-16 overflow-auto">{signature}</div>
                </div>
              )}
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Verify (Public Key)</span>
              <textarea value={verifyMessage} onChange={e => { setVerifyMessage(e.target.value); setVerifyResult(null); }} placeholder="Enter message..."
                className="p-2 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 resize-none min-h-[40px]" />
              <textarea value={verifySignature} onChange={e => { setVerifySignature(e.target.value); setVerifyResult(null); }} placeholder="Paste signature..."
                className="p-2 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono resize-none min-h-[40px]" />
              <button onClick={handleVerify} disabled={!keyPair || isProcessing || !verifyMessage || !verifySignature}
                className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg disabled:opacity-50 self-start">Verify</button>
              {verifyResult !== null && (
                <div className={`rounded p-2 border-2 ${verifyResult ? 'bg-green-50 dark:bg-green-900/30 border-green-400' : 'bg-red-50 dark:bg-red-900/30 border-red-400'}`}>
                  <span className={`text-sm font-bold ${verifyResult ? 'text-green-600' : 'text-red-500'}`}>
                    {verifyResult ? 'Signature is VALID' : 'Signature is INVALID'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
