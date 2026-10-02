import React, { useState, useMemo } from 'react';
import { Copy, Check, BarChart2, Search } from 'lucide-react';

import {
  CipherType,
  caesarEncrypt, caesarDecrypt,
  affineEncrypt, affineDecrypt, AFFINE_VALID_A, gcd, modInverse,
  vigenereEncrypt, vigenereDecrypt,
  atbash,
  railFenceEncrypt, railFenceDecrypt,
  generateRandomSubstitution, substitutionEncrypt, substitutionDecrypt,
  MORSE, MORSE_REV, morseEncode, morseDecode,
  letterFrequency, CIPHER_INFO,
} from '@/lib/crypto/classicalCiphers';

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-600 text-white rounded text-[10px]">
      {copied ? <Check size={9} /> : <Copy size={9} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export const ClassicalCiphers: React.FC = () => {
  const [cipher, setCipher] = useState<CipherType>('caesar');
  const [isEncrypt, setIsEncrypt] = useState(true);
  const [input, setInput] = useState('The quick brown fox jumps over the lazy dog');
  const [shift, setShift] = useState(3);
  const [vigenereKey, setVigenereKey] = useState('SECRET');
  const [rails, setRails] = useState(3);
  const [affineA, setAffineA] = useState(5);
  const [affineB, setAffineB] = useState(8);
  const [subMap, setSubMap] = useState<Record<string, string>>(() => generateRandomSubstitution());
  const [panelTab, setPanelTab] = useState<'visual' | 'freq' | 'brute'>('visual');

  const output = useMemo(() => {
    try {
      switch (cipher) {
        case 'caesar': return isEncrypt ? caesarEncrypt(input, shift) : caesarDecrypt(input, shift);
        case 'rot13': return caesarEncrypt(input, 13);
        case 'vigenere': return isEncrypt ? vigenereEncrypt(input, vigenereKey) : vigenereDecrypt(input, vigenereKey);
        case 'atbash': return atbash(input);
        case 'rail-fence': return isEncrypt ? railFenceEncrypt(input, rails) : railFenceDecrypt(input, rails);
        case 'substitution': return isEncrypt ? substitutionEncrypt(input, subMap) : substitutionDecrypt(input, subMap);
        case 'affine': return isEncrypt ? affineEncrypt(input, affineA, affineB) : affineDecrypt(input, affineA, affineB);
        case 'morse': return isEncrypt ? morseEncode(input) : morseDecode(input);
        default: return input;
      }
    } catch { return 'Error'; }
  }, [cipher, isEncrypt, input, shift, vigenereKey, rails, affineA, affineB, subMap]);

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const shiftedAlphabet = useMemo(() => {
    if (cipher === 'caesar') return alphabet.split('').map((_, i) => alphabet[(i + shift) % 26]).join('');
    if (cipher === 'rot13') return alphabet.split('').map((_, i) => alphabet[(i + 13) % 26]).join('');
    if (cipher === 'atbash') return alphabet.split('').reverse().join('');
    if (cipher === 'affine') return alphabet.split('').map((_, i) => alphabet[(affineA * i + affineB) % 26]).join('');
    return '';
  }, [cipher, shift, affineA, affineB]);

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

  // Brute force: try all 25 Caesar shifts
  const bruteForce = useMemo(() => {
    if (cipher !== 'caesar') return null;
    return Array.from({ length: 25 }, (_, i) => {
      const s = i + 1;
      return { shift: s, text: caesarDecrypt(input, s) };
    });
  }, [cipher, input]);

  // Frequency analysis
  const freqData = useMemo(() => {
    const freq = letterFrequency(output || input);
    const total = Object.values(freq).reduce((a, b) => a + b, 0);
    return alphabet.split('').map(ch => ({
      ch,
      count: freq[ch] || 0,
      pct: total > 0 ? ((freq[ch] || 0) / total) * 100 : 0,
    }));
  }, [input, output]);
  const maxFreq = Math.max(...freqData.map(d => d.pct), 1);

  const selfInverse = cipher === 'rot13' || cipher === 'atbash' || cipher === 'morse';
  const selectClass = 'px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100';

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-orange-50 dark:from-gray-950 dark:to-orange-950 p-3 gap-2 overflow-hidden">

      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <select value={cipher} onChange={e => setCipher(e.target.value as CipherType)} className={selectClass}>
          <option value="caesar">Caesar</option>
          <option value="rot13">ROT13</option>
          <option value="vigenere">Vigenere</option>
          <option value="atbash">Atbash</option>
          <option value="affine">Affine</option>
          <option value="rail-fence">Rail Fence</option>
          <option value="substitution">Substitution</option>
          <option value="morse">Morse Code</option>
        </select>

        {!selfInverse && (
          <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            {(['encrypt', 'decrypt'] as const).map(m => (
              <button key={m} onClick={() => setIsEncrypt(m === 'encrypt')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${(m === 'encrypt') === isEncrypt ? 'bg-orange-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                {m === 'encrypt' ? 'Encrypt' : 'Decrypt'}
              </button>
            ))}
          </div>
        )}

        {cipher === 'caesar' && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">Shift:</span>
            <input type="range" min={1} max={25} value={shift} onChange={e => setShift(Number(e.target.value))} className="w-24" />
            <span className="text-xs font-bold text-orange-600 dark:text-orange-400 w-6">{shift}</span>
          </div>
        )}
        {cipher === 'vigenere' && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">Key:</span>
            <input value={vigenereKey} onChange={e => setVigenereKey(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase())}
              className="w-24 px-2 py-1 text-xs rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono" />
          </div>
        )}
        {cipher === 'affine' && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">a:</span>
            <select value={affineA} onChange={e => setAffineA(Number(e.target.value))} className="px-2 py-1 text-xs rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
              {AFFINE_VALID_A.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <span className="text-xs text-gray-500">b:</span>
            <input type="number" min={0} max={25} value={affineB} onChange={e => setAffineB(Math.max(0, Math.min(25, Number(e.target.value))))}
              className="w-12 px-2 py-1 text-xs rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-center" />
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

      {/* IO */}
      <div className="flex gap-3 flex-1 min-h-0 overflow-hidden" style={{ minHeight: 100 }}>
        <div className="flex-1 flex flex-col">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Input</label>
          <textarea value={input} onChange={e => setInput(e.target.value)}
            className="flex-1 p-2 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono resize-none" />
        </div>
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Output</label>
            <CopyBtn text={output} />
          </div>
          <textarea readOnly value={output}
            className="flex-1 p-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 font-mono resize-none" />
        </div>
      </div>

      {/* Bottom panel */}
      <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden" style={{ maxHeight: 140 }}>
        {/* Panel tabs */}
        <div className="flex items-center gap-0 border-b border-gray-200 dark:border-gray-700 px-2">
          {([['visual', 'Visual'], ['freq', 'Frequency'], ['brute', 'Brute Force']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setPanelTab(key)}
              disabled={key === 'brute' && cipher !== 'caesar'}
              className={`px-3 py-1.5 text-[10px] font-medium border-b-2 transition-colors ${panelTab === key ? 'border-orange-500 text-orange-600 dark:text-orange-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'} disabled:opacity-40 disabled:cursor-not-allowed`}>
              {key === 'freq' && <BarChart2 size={9} className="inline mr-1" />}
              {key === 'brute' && <Search size={9} className="inline mr-1" />}
              {label}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-gray-400 pr-2">{CIPHER_INFO[cipher]}</span>
        </div>

        <div className="overflow-auto p-2" style={{ maxHeight: 100 }}>
          {/* Visual panel */}
          {panelTab === 'visual' && (
            <>
              {(cipher === 'caesar' || cipher === 'rot13' || cipher === 'atbash' || cipher === 'affine') && shiftedAlphabet && (
                <div className="flex gap-0.5 text-[10px] font-mono">
                  {alphabet.split('').map((ch, i) => (
                    <div key={i} className="flex flex-col items-center w-5">
                      <span className="text-gray-500">{ch}</span>
                      <span className="text-orange-400">↓</span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold">{shiftedAlphabet[i]}</span>
                    </div>
                  ))}
                </div>
              )}
              {vigenereVisual && (
                <div className="flex gap-0.5 text-[10px] font-mono overflow-x-auto">
                  {vigenereVisual.map((p, i) => (
                    <div key={i} className="flex flex-col items-center w-5 min-w-[1.25rem]">
                      <span className="text-gray-600 dark:text-gray-400">{p.plain}</span>
                      <span className="text-orange-500">{p.key}</span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold">{p.result}</span>
                    </div>
                  ))}
                </div>
              )}
              {railFenceVisual && (
                <div>
                  {railFenceVisual.map((row, r) => (
                    <div key={r} className="flex gap-0.5 text-[10px] font-mono">
                      {row.map((ch, c) => (
                        <span key={c} className={`w-5 text-center ${ch ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-300 dark:text-gray-700'}`}>{ch || '·'}</span>
                      ))}
                    </div>
                  ))}
                </div>
              )}
              {cipher === 'substitution' && (
                <div className="flex gap-0.5 text-[10px] font-mono">
                  {alphabet.split('').map((ch, i) => (
                    <div key={i} className="flex flex-col items-center w-5">
                      <span className="text-gray-500">{ch}</span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold">{subMap[ch]}</span>
                    </div>
                  ))}
                </div>
              )}
              {cipher === 'morse' && (
                <div className="text-[10px] font-mono text-gray-600 dark:text-gray-400 grid grid-cols-9 gap-x-3 gap-y-0.5">
                  {Object.entries(MORSE).map(([ch, code]) => (
                    <span key={ch}><span className="font-bold text-orange-600">{ch}</span> {code}</span>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Frequency analysis */}
          {panelTab === 'freq' && (
            <div className="flex items-end gap-0.5 h-16">
              {freqData.map(({ ch, pct, count }) => (
                <div key={ch} className="flex flex-col items-center flex-1 min-w-0" title={`${ch}: ${count} (${pct.toFixed(1)}%)`}>
                  <div className="w-full rounded-t transition-all" style={{
                    height: `${(pct / maxFreq) * 48}px`,
                    backgroundColor: pct > 0 ? `hsl(${30 + (pct / maxFreq) * 200}, 70%, 55%)` : 'transparent',
                    minHeight: pct > 0 ? 2 : 0
                  }} />
                  <span className="text-[8px] text-gray-500 font-mono">{ch}</span>
                </div>
              ))}
            </div>
          )}

          {/* Brute force Caesar */}
          {panelTab === 'brute' && bruteForce && (
            <div className="space-y-0.5">
              {bruteForce.map(({ shift: s, text }) => (
                <div key={s} className="flex items-center gap-2 text-[10px] font-mono hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded px-1">
                  <span className="text-orange-600 dark:text-orange-400 w-8 shrink-0">+{s}</span>
                  <span className="text-gray-700 dark:text-gray-300 truncate flex-1">{text}</span>
                  <button onClick={() => navigator.clipboard.writeText(text)}
                    className="shrink-0 px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300 hover:bg-blue-200">Copy</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
