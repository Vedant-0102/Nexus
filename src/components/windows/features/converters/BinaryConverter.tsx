import React, { useState, useCallback } from 'react';
import { Info, ArrowLeftRight, RotateCcw } from 'lucide-react';

export const BinaryConverter: React.FC = () => {
  const [decimal, setDecimal] = useState('42');
  const [binary, setBinary] = useState('101010');
  const [hex, setHex] = useState('2A');
  const [octal, setOctal] = useState('52');
  const [lastEdited, setLastEdited] = useState<'dec'|'bin'|'hex'|'oct'>('dec');
  const [bitSize, setBitSize] = useState<8|16|32>(8);
  const [showSteps, setShowSteps] = useState(true);

  const updateAll = useCallback((value: number) => {
    if (isNaN(value)) return;
    const clamped = Math.max(0, Math.min(value, Math.pow(2, bitSize) - 1));
    setDecimal(clamped.toString());
    setBinary(clamped.toString(2).padStart(bitSize, '0'));
    setHex(clamped.toString(16).toUpperCase());
    setOctal(clamped.toString(8));
  }, [bitSize]);

  const handleDecChange = (v: string) => {
    setDecimal(v); setLastEdited('dec');
    const n = parseInt(v, 10);
    if (!isNaN(n)) updateAll(n);
  };
  const handleBinChange = (v: string) => {
    setBinary(v); setLastEdited('bin');
    const n = parseInt(v, 2);
    if (!isNaN(n)) updateAll(n);
  };
  const handleHexChange = (v: string) => {
    setHex(v); setLastEdited('hex');
    const n = parseInt(v, 16);
    if (!isNaN(n)) updateAll(n);
  };
  const handleOctChange = (v: string) => {
    setOctal(v); setLastEdited('oct');
    const n = parseInt(v, 8);
    if (!isNaN(n)) updateAll(n);
  };

  const decVal = parseInt(decimal, 10) || 0;
  const binStr = decVal.toString(2).padStart(bitSize, '0');

  // Conversion steps
  const getDecToBinSteps = (n: number): string[] => {
    if (n === 0) return ['0 ÷ 2 = 0 remainder 0'];
    const steps: string[] = [];
    let val = n;
    while (val > 0) {
      steps.push(`${val} ÷ 2 = ${Math.floor(val / 2)} remainder ${val % 2}`);
      val = Math.floor(val / 2);
    }
    return steps;
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-100 to-cyan-100 dark:from-gray-950 dark:to-cyan-950 p-3 overflow-hidden">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">🔢 Binary / Hex / Decimal Converter</h2>
        <p className="text-[11px] text-gray-500 dark:text-gray-400">Number base conversion with step-by-step breakdown</p>
      </div>
      <div className="flex-1 flex gap-3 min-h-0 overflow-y-auto">
        <div className="flex-1 min-w-0 space-y-3">
          {/* Bit visualization */}
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Bit Representation ({bitSize}-bit)</h4>
            <div className="flex flex-wrap gap-0.5 justify-center">
              {binStr.split('').map((bit, i) => (
                <button key={i} onClick={() => {
                  const newBin = binStr.split('');
                  newBin[i] = newBin[i] === '0' ? '1' : '0';
                  const newVal = parseInt(newBin.join(''), 2);
                  updateAll(newVal);
                }} className={`w-7 h-8 flex flex-col items-center justify-center rounded text-xs font-mono cursor-pointer transition-all ${bit==='1'?'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20':'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                  <span className="text-[10px] font-bold">{bit}</span>
                  <span className="text-[6px] opacity-50">{Math.pow(2, bitSize - 1 - i)}</span>
                </button>
              ))}
            </div>
            <div className="text-center mt-2 text-[9px] text-gray-600 dark:text-gray-500">Click bits to toggle (MSB ← → LSB)</div>
          </div>

          {/* Input fields */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Decimal (Base 10)', value: decimal, onChange: handleDecChange, color: 'blue', base: 'dec' },
              { label: 'Binary (Base 2)', value: binary, onChange: handleBinChange, color: 'green', base: 'bin' },
              { label: 'Hexadecimal (Base 16)', value: hex, onChange: handleHexChange, color: 'purple', base: 'hex' },
              { label: 'Octal (Base 8)', value: octal, onChange: handleOctChange, color: 'orange', base: 'oct' },
            ].map(({ label, value, onChange, color, base }) => (
              <div key={base} className={`bg-white/80 dark:bg-gray-900 border rounded-lg p-2.5 ${lastEdited === base ? `border-${color}-600` : 'border-gray-200 dark:border-gray-800'}`}>
                <label className="text-[10px] text-gray-500 dark:text-gray-400 block mb-1">{label}</label>
                <input value={value} onChange={e => onChange(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm rounded px-2 py-1.5 border border-gray-300 dark:border-gray-700 focus:border-cyan-600 outline-none" spellCheck={false} />
              </div>
            ))}
          </div>

          {/* ASCII */}
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-2.5">
            <span className="text-[10px] text-gray-500 dark:text-gray-400">ASCII: </span>
            <span className="text-[12px] text-cyan-400 font-mono">{decVal >= 32 && decVal <= 126 ? `'${String.fromCharCode(decVal)}'` : '(non-printable)'}</span>
            <span className="text-[10px] text-gray-600 dark:text-gray-500 ml-2">| Two's complement ({bitSize}-bit): {decVal === 0 ? '0' : decVal > Math.pow(2, bitSize - 1) - 1 ? (decVal - Math.pow(2, bitSize)).toString() : decVal.toString()}</span>
          </div>

          {/* Conversion steps */}
          {showSteps && (
            <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
              <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Decimal → Binary Steps</h4>
              <div className="space-y-0.5 font-mono text-[10px]">
                {getDecToBinSteps(decVal).map((step, i) => (
                  <div key={i} className="text-gray-600 dark:text-gray-400"><span className="text-cyan-400 mr-1">{i + 1}.</span>{step}</div>
                ))}
                <div className="text-gray-700 dark:text-gray-300 mt-1 pt-1 border-t border-gray-200 dark:border-gray-800">
                  Read remainders bottom-up: <span className="text-cyan-400">{decVal.toString(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Common values */}
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Quick Values</h4>
            <div className="flex flex-wrap gap-1">
              {[0, 1, 7, 10, 15, 16, 42, 127, 128, 255].filter(v => v < Math.pow(2, bitSize)).map(v => (
                <button key={v} onClick={() => updateAll(v)} className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[9px] hover:bg-blue-100 dark:hover:bg-cyan-800 hover:text-gray-900 dark:hover:text-white transition-colors">{v}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="w-[180px] flex flex-col gap-2 flex-shrink-0">
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-2">
            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Bit Size</h4>
            {([8, 16, 32] as const).map(b => (
              <button key={b} onClick={() => { setBitSize(b); updateAll(Math.min(decVal, Math.pow(2, b) - 1)); }} className={`block w-full text-left px-2 py-1.5 rounded text-[10px] ${bitSize===b?'bg-cyan-700 text-white':'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>{b}-bit (0–{Math.pow(2, b) - 1})</button>
            ))}
          </div>
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-1.5">
            <label className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 cursor-pointer">
              <input type="checkbox" checked={showSteps} onChange={e => setShowSteps(e.target.checked)} className="accent-cyan-500 w-3 h-3" />Show conversion steps
            </label>
          </div>
          <button onClick={() => updateAll(0)} className="flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white text-[10px]">
            <RotateCcw className="h-3 w-3" />Reset
          </button>
          <div className="bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/40 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-cyan-700 dark:text-cyan-300 flex items-center gap-1 mb-1"><Info className="h-3 w-3" />Bases</h4>
            <div className="text-[9px] text-gray-600 dark:text-gray-400 space-y-0.5">
              <p><strong>Binary (2):</strong> 0, 1</p>
              <p><strong>Octal (8):</strong> 0-7</p>
              <p><strong>Decimal (10):</strong> 0-9</p>
              <p><strong>Hex (16):</strong> 0-9, A-F</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
