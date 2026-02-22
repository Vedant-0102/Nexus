import React, { useState, useMemo } from 'react';

type CipherType = 'caesar' | 'rot13' | 'vigenere' | 'atbash' | 'rail-fence' | 'substitution';

function caesarEncrypt(text: string, shift: number): string {
  return text.replace(/[a-zA-Z]/g, ch => {
    const base = ch <= 'Z' ? 65 : 97;
    return String.fromCharCode(((ch.charCodeAt(0) - base + shift) % 26) + base);
  });
}
function caesarDecrypt(text: string, shift: number): string {
  return caesarEncrypt(text, 26 - shift);
}

function vigenereEncrypt(text: string, key: string): string {
  if (!key) return text;
  const k = key.toUpperCase();
  let ki = 0;
  return text.replace(/[a-zA-Z]/g, ch => {
    const base = ch <= 'Z' ? 65 : 97;
    const shift = k.charCodeAt(ki % k.length) - 65;
    ki++;
    return String.fromCharCode(((ch.charCodeAt(0) - base + shift) % 26) + base);
  });
}
function vigenereDecrypt(text: string, key: string): string {
  if (!key) return text;
  const k = key.toUpperCase();
  let ki = 0;
  return text.replace(/[a-zA-Z]/g, ch => {
    const base = ch <= 'Z' ? 65 : 97;
    const shift = k.charCodeAt(ki % k.length) - 65;
    ki++;
    return String.fromCharCode(((ch.charCodeAt(0) - base - shift + 26) % 26) + base);
  });
}

function atbash(text: string): string {
  return text.replace(/[a-zA-Z]/g, ch => {
    const base = ch <= 'Z' ? 65 : 97;
    return String.fromCharCode(base + 25 - (ch.charCodeAt(0) - base));
  });
}

function railFenceEncrypt(text: string, rails: number): string {
  if (rails <= 1) return text;
  const fence: string[][] = Array.from({ length: rails }, () => []);
  let rail = 0, dir = 1;
  for (const ch of text) {
    fence[rail].push(ch);
    if (rail === 0) dir = 1;
    else if (rail === rails - 1) dir = -1;
    rail += dir;
  }
  return fence.flat().join('');
}

function railFenceDecrypt(text: string, rails: number): string {
  if (rails <= 1 || text.length === 0) return text;
  const len = text.length;

  // 1. Build zigzag pattern to know which rail each position belongs to
  const pattern: number[] = [];
  let rail = 0, dir = 1;
  for (let i = 0; i < len; i++) {
    pattern.push(rail);
    if (rail === 0) dir = 1;
    else if (rail === rails - 1) dir = -1;
    rail += dir;
  }

  // 2. Count how many characters belong to each rail
  const railLengths = new Array(rails).fill(0);
  for (const r of pattern) railLengths[r]++;

  // 3. Split ciphertext into per-rail segments
  const railChars: string[] = [];
  let offset = 0;
  for (let r = 0; r < rails; r++) {
    railChars.push(text.substring(offset, offset + railLengths[r]));
    offset += railLengths[r];
  }

  // 4. Read back in zigzag order, pulling next char from the appropriate rail
  const railPos = new Array(rails).fill(0);
  let result = '';
  for (let i = 0; i < len; i++) {
    const r = pattern[i];
    result += railChars[r][railPos[r]];
    railPos[r]++;
  }

  return result;
}

function generateRandomSubstitution(): Record<string, string> {
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const shuffled = [...alpha];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const map: Record<string, string> = {};
  for (let i = 0; i < 26; i++) map[alpha[i]] = shuffled[i];
  return map;
}

function substitutionEncrypt(text: string, map: Record<string, string>): string {
  return text.replace(/[a-zA-Z]/g, ch => {
    const upper = ch.toUpperCase();
    const mapped = map[upper] || upper;
    return ch === upper ? mapped : mapped.toLowerCase();
  });
}

function substitutionDecrypt(text: string, map: Record<string, string>): string {
  const reverse: Record<string, string> = {};
  for (const [k, v] of Object.entries(map)) reverse[v] = k;
  return substitutionEncrypt(text, reverse);
}

const CIPHER_INFO: Record<CipherType, string> = {
  caesar: 'Caesar Cipher: Shifts each letter by a fixed number. Used by Julius Caesar. Easily broken by frequency analysis.',
  rot13: 'ROT13: Caesar cipher with shift=13. Self-inverse: encrypting twice returns the original text.',
  vigenere: 'Vigenere Cipher: Uses a keyword to apply different Caesar shifts per letter. Stronger than simple Caesar.',
  atbash: 'Atbash: Reverses the alphabet (A=Z, B=Y, ...). Ancient Hebrew cipher. Self-inverse.',
  'rail-fence': 'Rail Fence: Writes text in zigzag across N rails, then reads off row by row. A transposition cipher.',
  substitution: 'Substitution Cipher: Maps each letter to a different letter. 26! possible keys. Vulnerable to frequency analysis.',
};

export const ClassicalCiphers: React.FC = () => {
  const [cipher, setCipher] = useState<CipherType>('caesar');
  const [isEncrypt, setIsEncrypt] = useState(true);
  const [input, setInput] = useState('The quick brown fox jumps over the lazy dog');
  const [shift, setShift] = useState(3);
  const [vigenereKey, setVigenereKey] = useState('SECRET');
  const [rails, setRails] = useState(3);
  const [subMap, setSubMap] = useState<Record<string, string>>(() => generateRandomSubstitution());

  const output = useMemo(() => {
    try {
      switch (cipher) {
        case 'caesar': return isEncrypt ? caesarEncrypt(input, shift) : caesarDecrypt(input, shift);
        case 'rot13': return caesarEncrypt(input, 13);
        case 'vigenere': return isEncrypt ? vigenereEncrypt(input, vigenereKey) : vigenereDecrypt(input, vigenereKey);
        case 'atbash': return atbash(input);
        case 'rail-fence': return isEncrypt ? railFenceEncrypt(input, rails) : railFenceDecrypt(input, rails);
        case 'substitution': return isEncrypt ? substitutionEncrypt(input, subMap) : substitutionDecrypt(input, subMap);
        default: return input;
      }
    } catch { return 'Error'; }
  }, [cipher, isEncrypt, input, shift, vigenereKey, rails, subMap]);

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const shiftedAlphabet = useMemo(() => {
    if (cipher === 'caesar') return alphabet.split('').map((_, i) => alphabet[(i + shift) % 26]).join('');
    if (cipher === 'rot13') return alphabet.split('').map((_, i) => alphabet[(i + 13) % 26]).join('');
    if (cipher === 'atbash') return alphabet.split('').reverse().join('');
    return '';
  }, [cipher, shift]);

  // Vigenere visual: show key repeated over plaintext
  const vigenereVisual = useMemo(() => {
    if (cipher !== 'vigenere' || !vigenereKey) return null;
    const k = vigenereKey.toUpperCase();
    let ki = 0;
    const pairs: { plain: string; key: string; result: string }[] = [];
    for (const ch of input) {
      if (/[a-zA-Z]/.test(ch)) {
        const base = ch <= 'Z' ? 65 : 97;
        const keyChar = k[ki % k.length];
        const s = keyChar.charCodeAt(0) - 65;
        const out = String.fromCharCode(((ch.charCodeAt(0) - base + (isEncrypt ? s : 26 - s)) % 26) + base);
        pairs.push({ plain: ch, key: keyChar, result: out });
        ki++;
      } else {
        pairs.push({ plain: ch, key: ' ', result: ch });
      }
    }
    return pairs.slice(0, 40);
  }, [cipher, vigenereKey, input, isEncrypt]);

  // Rail fence visual
  const railFenceVisual = useMemo(() => {
    if (cipher !== 'rail-fence') return null;
    const grid: string[][] = Array.from({ length: rails }, () => Array(Math.min(input.length, 30)).fill(''));
    let rail = 0, dir = 1;
    for (let i = 0; i < Math.min(input.length, 30); i++) {
      grid[rail][i] = input[i];
      if (rail === 0) dir = 1;
      else if (rail === rails - 1) dir = -1;
      rail += dir;
    }
    return grid;
  }, [cipher, rails, input]);

  const selectClass = 'px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100';

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-orange-50 dark:from-gray-950 dark:to-orange-950 p-3 overflow-hidden">
      <div className="flex flex-wrap gap-2 mb-2 items-center">
        <select value={cipher} onChange={e => setCipher(e.target.value as CipherType)} className={selectClass}>
          <option value="caesar">Caesar</option>
          <option value="rot13">ROT13</option>
          <option value="vigenere">Vigenere</option>
          <option value="atbash">Atbash</option>
          <option value="rail-fence">Rail Fence</option>
          <option value="substitution">Substitution</option>
        </select>
        {cipher !== 'rot13' && cipher !== 'atbash' && (
          <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            {(['encrypt', 'decrypt'] as const).map(m => (
              <button key={m} onClick={() => setIsEncrypt(m === 'encrypt')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${(m === 'encrypt') === isEncrypt ? 'bg-orange-600 text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                {m === 'encrypt' ? 'Encrypt' : 'Decrypt'}
              </button>
            ))}
          </div>
        )}
        {cipher === 'caesar' && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">Shift:</span>
            <input type="range" min={1} max={25} value={shift} onChange={e => setShift(Number(e.target.value))} className="w-24" />
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 w-6">{shift}</span>
          </div>
        )}
        {cipher === 'vigenere' && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">Key:</span>
            <input value={vigenereKey} onChange={e => setVigenereKey(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase())}
              className="w-24 px-2 py-1 text-xs rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono" />
          </div>
        )}
        {cipher === 'rail-fence' && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">Rails:</span>
            <select value={rails} onChange={e => setRails(Number(e.target.value))} className={selectClass}>
              {[2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        )}
        {cipher === 'substitution' && (
          <button onClick={() => setSubMap(generateRandomSubstitution())} className="px-2 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700">New Random Key</button>
        )}
      </div>

      <div className="flex gap-3 mb-2 flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Input</label>
          <textarea value={input} onChange={e => setInput(e.target.value)}
            className="flex-1 p-2 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono resize-none" />
        </div>
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Output</label>
            <button onClick={() => navigator.clipboard.writeText(output)} className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-[10px]">Copy</button>
          </div>
          <textarea readOnly value={output}
            className="flex-1 p-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 font-mono resize-none" />
        </div>
      </div>

      <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 overflow-auto max-h-40">
        {(cipher === 'caesar' || cipher === 'rot13' || cipher === 'atbash') && shiftedAlphabet && (
          <div className="mb-2">
            <div className="text-[10px] text-gray-500 mb-1">Alphabet Mapping</div>
            <div className="flex gap-0.5 text-[10px] font-mono">
              {alphabet.split('').map((ch, i) => (
                <div key={i} className="flex flex-col items-center w-5">
                  <span className="text-gray-500">{ch}</span>
                  <span className="text-orange-600 dark:text-orange-400">{'|'}</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">{shiftedAlphabet[i]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {vigenereVisual && (
          <div className="mb-2">
            <div className="text-[10px] text-gray-500 mb-1">Step-by-step</div>
            <div className="flex gap-0.5 text-[10px] font-mono overflow-x-auto">
              {vigenereVisual.map((p, i) => (
                <div key={i} className="flex flex-col items-center w-5 min-w-[1.25rem]">
                  <span className="text-gray-600 dark:text-gray-400">{p.plain}</span>
                  <span className="text-orange-500">{p.key}</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">{p.result}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {railFenceVisual && (
          <div className="mb-2">
            <div className="text-[10px] text-gray-500 mb-1">Rail Pattern</div>
            {railFenceVisual.map((row, r) => (
              <div key={r} className="flex gap-0.5 text-[10px] font-mono">
                {row.map((ch, c) => (
                  <span key={c} className={`w-5 text-center ${ch ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-300 dark:text-gray-700'}`}>
                    {ch || '.'}
                  </span>
                ))}
              </div>
            ))}
          </div>
        )}

        {cipher === 'substitution' && (
          <div className="mb-2">
            <div className="text-[10px] text-gray-500 mb-1">Substitution Key</div>
            <div className="flex gap-0.5 text-[10px] font-mono">
              {alphabet.split('').map((ch, i) => (
                <div key={i} className="flex flex-col items-center w-5">
                  <span className="text-gray-500">{ch}</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">{subMap[ch]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-[10px] text-gray-500">{CIPHER_INFO[cipher]}</div>
      </div>
    </div>
  );
};
