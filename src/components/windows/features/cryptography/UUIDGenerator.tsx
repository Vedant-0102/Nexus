import React, { useState, useCallback } from 'react';

type UUIDFormat = 'standard' | 'no-dashes' | 'uppercase' | 'braces';

function formatUUID(uuid: string, format: UUIDFormat): string {
  switch (format) {
    case 'no-dashes': return uuid.replace(/-/g, '');
    case 'uppercase': return uuid.toUpperCase();
    case 'braces': return `{${uuid}}`;
    default: return uuid;
  }
}

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.replace(/[{}]/g, ''));
}

function breakdownUUID(uuid: string) {
  const clean = uuid.replace(/[{}-]/g, '').toLowerCase();
  if (clean.length !== 32) return null;
  return {
    time_low: clean.slice(0, 8),
    time_mid: clean.slice(8, 12),
    time_hi_version: clean.slice(12, 16),
    clock_seq: clean.slice(16, 20),
    node: clean.slice(20, 32),
    version: parseInt(clean[12], 16),
    variant: ((parseInt(clean[16], 16) >> 2) & 0x3) === 2 ? 'RFC 4122' : 'Other',
  };
}

export const UUIDGenerator: React.FC = () => {
  const [uuids, setUuids] = useState<string[]>([]);
  const [format, setFormat] = useState<UUIDFormat>('standard');
  const [batchSize, setBatchSize] = useState(1);
  const [validateInput, setValidateInput] = useState('');
  const [selectedUUID, setSelectedUUID] = useState<string | null>(null);

  const generate = useCallback(() => {
    const newUuids = Array.from({ length: batchSize }, () => formatUUID(crypto.randomUUID(), format));
    setUuids(prev => [...newUuids, ...prev].slice(0, 100));
  }, [batchSize, format]);

  const copyOne = (u: string) => navigator.clipboard.writeText(u);
  const copyAll = () => navigator.clipboard.writeText(uuids.join('\n'));

  const breakdown = selectedUUID ? breakdownUUID(selectedUUID) : null;
  const isValid = validateInput.length > 0 ? isValidUUID(validateInput) : null;

  const selectClass = 'px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100';

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-gray-950 dark:to-indigo-950 p-3 overflow-hidden">
      <div className="flex flex-wrap gap-2 mb-2 items-center">
        <button onClick={generate} className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold">Generate</button>
        <select value={batchSize} onChange={e => setBatchSize(Number(e.target.value))} className={selectClass}>
          {[1, 5, 10, 25, 50].map(n => <option key={n} value={n}>{n} UUID{n > 1 ? 's' : ''}</option>)}
        </select>
        <select value={format} onChange={e => setFormat(e.target.value as UUIDFormat)} className={selectClass}>
          <option value="standard">Standard</option>
          <option value="no-dashes">No Dashes</option>
          <option value="uppercase">Uppercase</option>
          <option value="braces">Braces</option>
        </select>
        {uuids.length > 0 && (
          <>
            <button onClick={copyAll} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Copy All</button>
            <button onClick={() => setUuids([])} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Clear</button>
          </>
        )}
        <span className="text-xs text-gray-500 ml-auto">{uuids.length} generated</span>
      </div>

      <div className="flex-1 min-h-0 flex gap-3 overflow-hidden">
        <div className="flex-1 overflow-auto space-y-1">
          {uuids.map((u, i) => (
            <div key={i} className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-mono cursor-pointer transition-colors ${selectedUUID === u ? 'bg-indigo-100 dark:bg-indigo-900/40 ring-1 ring-indigo-400' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              onClick={() => setSelectedUUID(u)}>
              <span className="flex-1 text-gray-800 dark:text-gray-200 select-all">{u}</span>
              <button onClick={e => { e.stopPropagation(); copyOne(u); }} className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px] hover:bg-gray-300 dark:hover:bg-gray-600">Copy</button>
            </div>
          ))}
          {uuids.length === 0 && <div className="text-sm text-gray-400 text-center mt-8">Click Generate to create UUIDs</div>}
        </div>

        <div className="w-72 flex flex-col gap-3 overflow-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Validator</div>
            <input value={validateInput} onChange={e => setValidateInput(e.target.value)} placeholder="Paste UUID to validate..."
              className="w-full px-2 py-1.5 text-xs rounded bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono" />
            {isValid !== null && (
              <div className={`mt-1.5 text-xs font-semibold ${isValid ? 'text-green-600' : 'text-red-500'}`}>
                {isValid ? 'Valid UUID' : 'Invalid UUID'}
              </div>
            )}
          </div>

          {breakdown && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Breakdown</div>
              <div className="space-y-1 text-[10px] font-mono">
                {([['time_low', breakdown.time_low], ['time_mid', breakdown.time_mid], ['time_hi_ver', breakdown.time_hi_version], ['clock_seq', breakdown.clock_seq], ['node', breakdown.node]] as const).map(([label, val]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-gray-500">{label}:</span>
                    <span className="text-indigo-600 dark:text-indigo-400">{val}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-1 mt-1">
                  <div className="flex justify-between"><span className="text-gray-500">Version:</span><span>{breakdown.version}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Variant:</span><span>{breakdown.variant}</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
