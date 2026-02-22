import React, { useState, useCallback, useEffect, useRef } from 'react';

type HashAlgo = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';
type OutputFormat = 'hex' | 'base64';
type InputMode = 'text' | 'file';

// Minimal MD5 implementation
function md5(input: string): string {
  function md5cycle(x: number[], k: number[]) {
    let a = x[0], b = x[1], c = x[2], d = x[3];
    const ff = (a: number, b: number, c: number, d: number, k: number, s: number, t: number) => { a += (b & c | ~b & d) + k + t; return ((a << s | a >>> (32 - s)) + b) | 0; };
    const gg = (a: number, b: number, c: number, d: number, k: number, s: number, t: number) => { a += (b & d | c & ~d) + k + t; return ((a << s | a >>> (32 - s)) + b) | 0; };
    const hh = (a: number, b: number, c: number, d: number, k: number, s: number, t: number) => { a += (b ^ c ^ d) + k + t; return ((a << s | a >>> (32 - s)) + b) | 0; };
    const ii = (a: number, b: number, c: number, d: number, k: number, s: number, t: number) => { a += (c ^ (b | ~d)) + k + t; return ((a << s | a >>> (32 - s)) + b) | 0; };
    a=ff(a,b,c,d,k[0],7,-680876936);d=ff(d,a,b,c,k[1],12,-389564586);c=ff(c,d,a,b,k[2],17,606105819);b=ff(b,c,d,a,k[3],22,-1044525330);
    a=ff(a,b,c,d,k[4],7,-176418897);d=ff(d,a,b,c,k[5],12,1200080426);c=ff(c,d,a,b,k[6],17,-1473231341);b=ff(b,c,d,a,k[7],22,-45705983);
    a=ff(a,b,c,d,k[8],7,1770035416);d=ff(d,a,b,c,k[9],12,-1958414417);c=ff(c,d,a,b,k[10],17,-42063);b=ff(b,c,d,a,k[11],22,-1990404162);
    a=ff(a,b,c,d,k[12],7,1804603682);d=ff(d,a,b,c,k[13],12,-40341101);c=ff(c,d,a,b,k[14],17,-1502002290);b=ff(b,c,d,a,k[15],22,1236535329);
    a=gg(a,b,c,d,k[1],5,-165796510);d=gg(d,a,b,c,k[6],9,-1069501632);c=gg(c,d,a,b,k[11],14,643717713);b=gg(b,c,d,a,k[0],20,-373897302);
    a=gg(a,b,c,d,k[5],5,-701558691);d=gg(d,a,b,c,k[10],9,38016083);c=gg(c,d,a,b,k[15],14,-660478335);b=gg(b,c,d,a,k[4],20,-405537848);
    a=gg(a,b,c,d,k[9],5,568446438);d=gg(d,a,b,c,k[14],9,-1019803690);c=gg(c,d,a,b,k[3],14,-187363961);b=gg(b,c,d,a,k[8],20,1163531501);
    a=gg(a,b,c,d,k[13],5,-1444681467);d=gg(d,a,b,c,k[2],9,-51403784);c=gg(c,d,a,b,k[7],14,1735328473);b=gg(b,c,d,a,k[12],20,-1926607734);
    a=hh(a,b,c,d,k[5],4,-378558);d=hh(d,a,b,c,k[8],11,-2022574463);c=hh(c,d,a,b,k[11],16,1839030562);b=hh(b,c,d,a,k[14],23,-35309556);
    a=hh(a,b,c,d,k[1],4,-1530992060);d=hh(d,a,b,c,k[4],11,1272893353);c=hh(c,d,a,b,k[7],16,-155497632);b=hh(b,c,d,a,k[10],23,-1094730640);
    a=hh(a,b,c,d,k[13],4,681279174);d=hh(d,a,b,c,k[0],11,-358537222);c=hh(c,d,a,b,k[3],16,-722521979);b=hh(b,c,d,a,k[6],23,76029189);
    a=hh(a,b,c,d,k[9],4,-640364487);d=hh(d,a,b,c,k[12],11,-421815835);c=hh(c,d,a,b,k[15],16,530742520);b=hh(b,c,d,a,k[2],23,-995338651);
    a=ii(a,b,c,d,k[0],6,-198630844);d=ii(d,a,b,c,k[7],10,1126891415);c=ii(c,d,a,b,k[14],15,-1416354905);b=ii(b,c,d,a,k[5],21,-57434055);
    a=ii(a,b,c,d,k[12],6,1700485571);d=ii(d,a,b,c,k[3],10,-1894986606);c=ii(c,d,a,b,k[10],15,-1051523);b=ii(b,c,d,a,k[1],21,-2054922799);
    a=ii(a,b,c,d,k[8],6,1873313359);d=ii(d,a,b,c,k[15],10,-30611744);c=ii(c,d,a,b,k[6],15,-1560198380);b=ii(b,c,d,a,k[13],21,1309151649);
    a=ii(a,b,c,d,k[4],6,-145523070);d=ii(d,a,b,c,k[11],10,-1120210379);c=ii(c,d,a,b,k[2],15,718787259);b=ii(b,c,d,a,k[9],21,-343485551);
    x[0]=(a+x[0])|0;x[1]=(b+x[1])|0;x[2]=(c+x[2])|0;x[3]=(d+x[3])|0;
  }

  const bytes = new TextEncoder().encode(input);
  const len = bytes.length;
  const buf = new Uint8Array(((len + 72) & ~63));
  buf.set(bytes);
  buf[len] = 0x80;
  const bits = len * 8;
  const dv = new DataView(buf.buffer);
  dv.setUint32(buf.length - 8, bits & 0xFFFFFFFF, true);
  dv.setUint32(buf.length - 4, Math.floor(bits / 0x100000000), true);
  const x = [1732584193, -271733879, -1732584194, 271733878];
  for (let i = 0; i < buf.length; i += 64) {
    const k: number[] = [];
    for (let j = 0; j < 16; j++) k.push(dv.getInt32(i + j * 4, true));
    md5cycle(x, k);
  }
  const result = new Uint8Array(16);
  const rdv = new DataView(result.buffer);
  for (let i = 0; i < 4; i++) rdv.setInt32(i * 4, x[i], true);
  return Array.from(result, b => b.toString(16).padStart(2, '0')).join('');
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');
}
function toBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

export const HashingTool: React.FC = () => {
  const [algo, setAlgo] = useState<HashAlgo>('SHA-256');
  const [outputFmt, setOutputFmt] = useState<OutputFormat>('hex');
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [textInput, setTextInput] = useState('');
  const [allMode, setAllMode] = useState(false);
  const [hash, setHash] = useState('');
  const [allHashes, setAllHashes] = useState<Record<string, string>>({});
  const [fileName, setFileName] = useState('');
  const [compareA, setCompareA] = useState('');
  const [compareB, setCompareB] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const computeHash = useCallback(async (data: ArrayBuffer, algorithm: HashAlgo, fmt: OutputFormat): Promise<string> => {
    if (algorithm === 'MD5') {
      const text = new TextDecoder().decode(data);
      const hex = md5(text);
      return fmt === 'base64' ? btoa(hex.match(/.{2}/g)!.map(b => String.fromCharCode(parseInt(b, 16))).join('')) : hex;
    }
    const result = await crypto.subtle.digest(algorithm, data);
    return fmt === 'hex' ? toHex(result) : toBase64(result);
  }, []);

  const hashData = useCallback(async (data: ArrayBuffer) => {
    if (allMode) {
      const algos: HashAlgo[] = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];
      const results: Record<string, string> = {};
      for (const a of algos) results[a] = await computeHash(data, a, outputFmt);
      setAllHashes(results);
      setHash('');
    } else {
      setHash(await computeHash(data, algo, outputFmt));
      setAllHashes({});
    }
  }, [algo, outputFmt, allMode, computeHash]);

  useEffect(() => {
    if (inputMode !== 'text') return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const data = new TextEncoder().encode(textInput).buffer;
      hashData(data);
    }, 150);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [textInput, hashData, inputMode]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const data = await file.arrayBuffer();
    hashData(data);
  };

  const compareMatch = compareA.length > 0 && compareB.length > 0 ? compareA.toLowerCase().trim() === compareB.toLowerCase().trim() : null;
  const hashLen = hash ? (outputFmt === 'hex' ? hash.length / 2 : Math.ceil(hash.length * 3 / 4)) : 0;

  const selectClass = 'px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100';

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-cyan-50 dark:from-gray-950 dark:to-cyan-950 p-3 overflow-hidden">
      <div className="flex flex-wrap gap-2 mb-2 items-center">
        {!allMode && (
          <select value={algo} onChange={e => setAlgo(e.target.value as HashAlgo)} className={selectClass}>
            {['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        )}
        <select value={outputFmt} onChange={e => setOutputFmt(e.target.value as OutputFormat)} className={selectClass}>
          <option value="hex">Hex</option>
          <option value="base64">Base64</option>
        </select>
        <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
          <input type="checkbox" checked={allMode} onChange={e => setAllMode(e.target.checked)} className="rounded" />
          All algorithms
        </label>
        <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 ml-2">
          {(['text', 'file'] as const).map(m => (
            <button key={m} onClick={() => setInputMode(m)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${inputMode === m ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
              {m === 'text' ? 'Text' : 'File'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 flex gap-3 overflow-hidden">
        <div className="flex-1 flex flex-col">
          {inputMode === 'text' ? (
            <textarea value={textInput} onChange={e => setTextInput(e.target.value)} placeholder="Enter text to hash..."
              className="flex-1 p-3 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono resize-none" />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
              onClick={() => fileRef.current?.click()}>
              <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
              <div className="text-sm text-gray-500">{fileName || 'Click to select a file'}</div>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Hash Output</div>
            {allMode ? (
              <div className="space-y-2">
                {Object.entries(allHashes).map(([alg, h]) => (
                  <div key={alg}>
                    <div className="text-[10px] text-gray-500 mb-0.5">{alg}</div>
                    <div className="flex items-center gap-1">
                      <span className="flex-1 text-[10px] font-mono text-gray-800 dark:text-gray-200 break-all select-all">{h || '-'}</span>
                      <button onClick={() => navigator.clipboard.writeText(h)} className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px]">Copy</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="text-xs font-mono text-gray-800 dark:text-gray-200 break-all select-all min-h-[2rem]">{hash || '-'}</div>
                {hash && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-gray-500">{hashLen} bytes ({hashLen * 8} bits)</span>
                    <button onClick={() => navigator.clipboard.writeText(hash)} className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px]">Copy</button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Compare Hashes</div>
            <input value={compareA} onChange={e => setCompareA(e.target.value)} placeholder="Hash A"
              className="w-full px-2 py-1 text-xs rounded mb-1 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono" />
            <input value={compareB} onChange={e => setCompareB(e.target.value)} placeholder="Hash B"
              className="w-full px-2 py-1 text-xs rounded bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono" />
            {compareMatch !== null && (
              <div className={`mt-1.5 text-xs font-bold ${compareMatch ? 'text-green-600' : 'text-red-500'}`}>
                {compareMatch ? 'Hashes match' : 'Hashes do NOT match'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
