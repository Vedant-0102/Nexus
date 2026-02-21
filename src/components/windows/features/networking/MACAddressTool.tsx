import React, { useState, useCallback } from 'react';

const OUI_DB: Record<string, string> = {
  '00:00:0C': 'Cisco', '00:1A:2B': 'Ayecom', '00:50:56': 'VMware', '00:0C:29': 'VMware',
  '00:1C:42': 'Parallels', '08:00:27': 'VirtualBox', '00:03:FF': 'Microsoft',
  '00:15:5D': 'Microsoft Hyper-V', '00:16:3E': 'Xen', '00:1A:11': 'Google',
  '3C:5A:B4': 'Google', 'AC:67:B2': 'Apple', '00:CD:FE': 'Apple', 'A4:83:E7': 'Apple',
  'F8:FF:C2': 'Apple', '00:25:00': 'Apple', 'DC:A6:32': 'Raspberry Pi', 'B8:27:EB': 'Raspberry Pi',
  '00:1E:06': 'WIBRAIN', '00:24:E8': 'Dell', '00:14:22': 'Dell', 'F0:1F:AF': 'Dell',
  '00:21:5A': 'HP', '00:1A:4B': 'HP', '00:1B:78': 'HP',
  'FC:15:B4': 'HP', '00:26:55': 'HP', '00:1E:0B': 'HP',
  '00:0E:C6': 'ASUS', '00:1D:60': 'ASUS', '2C:56:DC': 'ASUS',
  'E4:54:E8': 'Intel', '00:1B:21': 'Intel', 'A4:C4:94': 'Intel',
  '00:24:D7': 'Intel', '68:05:CA': 'Intel', '48:51:B7': 'Intel',
  '00:E0:4C': 'Realtek', '52:54:00': 'QEMU/KVM', '00:1C:14': 'Cisco',
  '00:25:B5': 'Cisco', 'B0:AA:77': 'Samsung', '00:21:19': 'Samsung',
  '34:23:BA': 'Samsung', '00:26:37': 'Samsung', '30:B5:C2': 'TP-Link',
  '50:C7:BF': 'TP-Link', 'E8:94:F6': 'TP-Link', '14:CC:20': 'TP-Link',
  '00:1F:1F': 'Edimax', '74:DA:38': 'Edimax', '20:CF:30': 'ASUS',
};

function randomMac(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  bytes[0] = (bytes[0] & 0xFE) | 0x02; // locally administered, unicast
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(':');
}

type MacFormat = 'colon' | 'dash' | 'dot' | 'bare';

function formatMac(mac: string, fmt: MacFormat): string {
  const clean = mac.replace(/[^0-9a-fA-F]/g, '').toUpperCase();
  if (clean.length !== 12) return mac;
  const pairs = clean.match(/.{2}/g)!;
  switch (fmt) {
    case 'colon': return pairs.join(':');
    case 'dash': return pairs.join('-');
    case 'dot': return clean.match(/.{4}/g)!.join('.');
    case 'bare': return clean;
  }
}

function isValidMac(mac: string): boolean {
  const clean = mac.replace(/[^0-9a-fA-F]/g, '');
  return clean.length === 12;
}

function lookupOui(mac: string): string | null {
  const clean = mac.replace(/[^0-9a-fA-F]/g, '').toUpperCase();
  if (clean.length < 6) return null;
  const prefix = clean.slice(0, 2) + ':' + clean.slice(2, 4) + ':' + clean.slice(4, 6);
  return OUI_DB[prefix] || null;
}

function getMacInfo(mac: string) {
  const clean = mac.replace(/[^0-9a-fA-F]/g, '');
  if (clean.length !== 12) return null;
  const firstByte = parseInt(clean.slice(0, 2), 16);
  return {
    unicast: (firstByte & 0x01) === 0,
    locallyAdministered: (firstByte & 0x02) !== 0,
    oui: lookupOui(mac),
  };
}

export const MACAddressTool: React.FC = () => {
  const [macs, setMacs] = useState<string[]>([]);
  const [format, setFormat] = useState<MacFormat>('colon');
  const [batchSize, setBatchSize] = useState(1);
  const [lookupInput, setLookupInput] = useState('');
  const [selectedMac, setSelectedMac] = useState<string | null>(null);

  const generate = useCallback(() => {
    const newMacs = Array.from({ length: batchSize }, () => formatMac(randomMac(), format));
    setMacs(prev => [...newMacs, ...prev].slice(0, 100));
  }, [batchSize, format]);

  const copyOne = (m: string) => navigator.clipboard.writeText(m);
  const copyAll = () => navigator.clipboard.writeText(macs.join('\n'));

  const info = selectedMac ? getMacInfo(selectedMac) : null;
  const lookupResult = lookupInput.length >= 6 ? lookupOui(lookupInput) : null;
  const lookupValid = lookupInput.length > 0 ? isValidMac(lookupInput) : null;

  const selectClass = 'px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100';

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-teal-50 dark:from-gray-950 dark:to-teal-950 p-3 overflow-hidden">
      <div className="flex flex-wrap gap-2 mb-2 items-center">
        <button onClick={generate} className="px-4 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-semibold">Generate</button>
        <select value={batchSize} onChange={e => setBatchSize(Number(e.target.value))} className={selectClass}>
          {[1, 5, 10, 25].map(n => <option key={n} value={n}>{n} MAC{n > 1 ? 's' : ''}</option>)}
        </select>
        <select value={format} onChange={e => setFormat(e.target.value as MacFormat)} className={selectClass}>
          <option value="colon">AA:BB:CC:DD:EE:FF</option>
          <option value="dash">AA-BB-CC-DD-EE-FF</option>
          <option value="dot">AABB.CCDD.EEFF</option>
          <option value="bare">AABBCCDDEEFF</option>
        </select>
        {macs.length > 0 && (
          <>
            <button onClick={copyAll} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Copy All</button>
            <button onClick={() => setMacs([])} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Clear</button>
          </>
        )}
        <span className="text-xs text-gray-500 ml-auto">{macs.length} generated</span>
      </div>

      <div className="flex-1 min-h-0 flex gap-3 overflow-hidden">
        <div className="flex-1 overflow-auto space-y-1">
          {macs.map((m, i) => (
            <div key={i} className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-mono cursor-pointer transition-colors ${selectedMac === m ? 'bg-teal-100 dark:bg-teal-900/40 ring-1 ring-teal-400' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              onClick={() => setSelectedMac(m)}>
              <span className="flex-1 text-gray-800 dark:text-gray-200 select-all">{m}</span>
              {lookupOui(m) && <span className="text-[10px] text-teal-600 dark:text-teal-400">{lookupOui(m)}</span>}
              <button onClick={e => { e.stopPropagation(); copyOne(m); }} className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px] hover:bg-gray-300 dark:hover:bg-gray-600">Copy</button>
            </div>
          ))}
          {macs.length === 0 && <div className="text-sm text-gray-400 text-center mt-8">Click Generate to create MAC addresses</div>}
        </div>

        <div className="w-72 flex flex-col gap-3 overflow-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">OUI Lookup</div>
            <input value={lookupInput} onChange={e => setLookupInput(e.target.value)} placeholder="Paste MAC to look up..."
              className="w-full px-2 py-1.5 text-xs rounded bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono" />
            {lookupInput.length >= 6 && (
              <div className="mt-1.5 text-xs">
                {lookupResult
                  ? <span className="text-teal-600 dark:text-teal-400 font-semibold">Vendor: {lookupResult}</span>
                  : <span className="text-gray-400">{lookupValid === false ? 'Invalid MAC' : 'Unknown vendor'}</span>}
              </div>
            )}
          </div>

          {info && selectedMac && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Details</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-gray-500">Type:</span><span>{info.unicast ? 'Unicast' : 'Multicast'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Admin:</span><span>{info.locallyAdministered ? 'Locally Administered' : 'Globally Unique'}</span></div>
                {info.oui && <div className="flex justify-between"><span className="text-gray-500">Vendor:</span><span className="text-teal-600 dark:text-teal-400">{info.oui}</span></div>}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-1 mt-1 space-y-1">
                  <div className="text-gray-500">All Formats:</div>
                  {(['colon', 'dash', 'dot', 'bare'] as MacFormat[]).map(f => (
                    <div key={f} className="font-mono text-[10px] text-gray-700 dark:text-gray-300 select-all">{formatMac(selectedMac, f)}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Format Converter</div>
            <div className="space-y-1 text-[10px] text-gray-500">
              <div><strong>Colon:</strong> AA:BB:CC:DD:EE:FF</div>
              <div><strong>Dash:</strong> AA-BB-CC-DD-EE-FF</div>
              <div><strong>Dot:</strong> AABB.CCDD.EEFF</div>
              <div><strong>Bare:</strong> AABBCCDDEEFF</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
