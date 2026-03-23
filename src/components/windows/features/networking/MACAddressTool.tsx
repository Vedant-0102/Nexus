import React, { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';

const OUI_DB: Record<string, string> = {
  // VMware / Hypervisors
  '00:50:56': 'VMware', '00:0C:29': 'VMware', '00:05:69': 'VMware',
  '00:1C:42': 'Parallels', '08:00:27': 'VirtualBox', '52:54:00': 'QEMU/KVM',
  '00:15:5D': 'Microsoft Hyper-V', '00:16:3E': 'Xen', '00:03:FF': 'Microsoft',
  // Cisco
  '00:00:0C': 'Cisco', '00:1C:14': 'Cisco', '00:25:B5': 'Cisco', '00:1A:A2': 'Cisco',
  '00:19:06': 'Cisco', '00:18:BA': 'Cisco', '58:16:26': 'Cisco', 'A4:4C:11': 'Cisco',
  '70:10:5C': 'Cisco', '00:22:55': 'Cisco', '00:24:97': 'Cisco', '88:5A:92': 'Cisco',
  // Apple
  'AC:67:B2': 'Apple', '00:CD:FE': 'Apple', 'A4:83:E7': 'Apple', 'F8:FF:C2': 'Apple',
  '00:25:00': 'Apple', '3C:15:C2': 'Apple', '28:CF:E9': 'Apple', '00:26:B9': 'Apple',
  '40:D3:2D': 'Apple', '78:CA:39': 'Apple', 'BC:92:6B': 'Apple', '8C:00:6D': 'Apple',
  'F8:1E:DF': 'Apple', '00:11:24': 'Apple', '00:17:F2': 'Apple', '00:1A:73': 'Apple',
  // Google
  '00:1A:11': 'Google', '3C:5A:B4': 'Google', 'F4:F5:E8': 'Google', '54:60:09': 'Google',
  // Microsoft
  '00:50:F2': 'Microsoft', '28:18:78': 'Microsoft',
  // Intel
  'E4:54:E8': 'Intel', '00:1B:21': 'Intel', 'A4:C4:94': 'Intel', '00:24:D7': 'Intel',
  '68:05:CA': 'Intel', '48:51:B7': 'Intel', '8C:8D:28': 'Intel', '00:1E:65': 'Intel',
  'B4:B6:86': 'Intel', 'AC:FD:CE': 'Intel', 'F8:94:C2': 'Intel', '8C:EC:4B': 'Intel',
  // Raspberry Pi
  'DC:A6:32': 'Raspberry Pi', 'B8:27:EB': 'Raspberry Pi', 'E4:5F:01': 'Raspberry Pi',
  // Dell
  '00:24:E8': 'Dell', '00:14:22': 'Dell', 'F0:1F:AF': 'Dell', '18:A9:9B': 'Dell',
  'B0:83:FE': 'Dell', 'BC:30:5B': 'Dell', '00:B0:D0': 'Dell', '14:18:77': 'Dell',
  // HP
  '00:21:5A': 'HP', '00:1A:4B': 'HP', '00:1B:78': 'HP', 'FC:15:B4': 'HP',
  '00:26:55': 'HP', '00:1E:0B': 'HP', '9C:8E:99': 'HP', 'EC:B1:D7': 'HP',
  'A0:D3:C1': 'HP', '10:60:4B': 'HP', 'C4:34:6B': 'HP',
  // ASUS
  '00:0E:C6': 'ASUS', '00:1D:60': 'ASUS', '2C:56:DC': 'ASUS', '20:CF:30': 'ASUS',
  'AC:9E:17': 'ASUS', '04:92:26': 'ASUS', '74:D4:35': 'ASUS', 'F8:32:E4': 'ASUS',
  // Samsung
  'B0:AA:77': 'Samsung', '00:21:19': 'Samsung', '34:23:BA': 'Samsung', '00:26:37': 'Samsung',
  'A8:D3:F7': 'Samsung', 'F0:72:8C': 'Samsung', '78:1F:DB': 'Samsung', 'C4:57:6E': 'Samsung',
  'F4:9F:54': 'Samsung', '28:98:7B': 'Samsung',
  // TP-Link
  '30:B5:C2': 'TP-Link', '50:C7:BF': 'TP-Link', 'E8:94:F6': 'TP-Link', '14:CC:20': 'TP-Link',
  'C0:06:C3': 'TP-Link', '90:9A:4A': 'TP-Link', '00:27:19': 'TP-Link',
  // Realtek
  '00:E0:4C': 'Realtek',
  // Netgear
  '00:09:5B': 'Netgear', '00:14:6C': 'Netgear', '00:1B:2F': 'Netgear', '20:4E:7F': 'Netgear',
  'A0:21:B7': 'Netgear', 'C4:04:15': 'Netgear',
  // Broadcom
  '00:10:18': 'Broadcom', '00:90:4C': 'Broadcom',
  // Edimax
  '00:1F:1F': 'Edimax', '74:DA:38': 'Edimax',
  // Ubiquiti
  '00:27:22': 'Ubiquiti', '04:18:D6': 'Ubiquiti', '24:A4:3C': 'Ubiquiti', '44:D9:E7': 'Ubiquiti',
  '68:72:51': 'Ubiquiti', '78:8A:20': 'Ubiquiti', 'B4:FB:E4': 'Ubiquiti',
  // Lenovo
  '00:23:AE': 'Lenovo', 'E8:6A:64': 'Lenovo', '54:EE:75': 'Lenovo',
  // Huawei
  '00:18:82': 'Huawei', '00:25:9E': 'Huawei', '34:6B:D3': 'Huawei', '48:DB:50': 'Huawei',
  'E8:CD:2D': 'Huawei', 'AC:E8:7B': 'Huawei',
  // Qualcomm Atheros
  '00:03:7F': 'Atheros', 'E8:DE:27': 'Atheros',
  // Hyper-V / Azure
  '00:22:48': 'Microsoft Azure',
};

function randomMac(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  bytes[0] = (bytes[0] & 0xFE) | 0x02; // locally administered, unicast
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(':');
}

type MacFormat = 'colon' | 'dash' | 'dot' | 'bare';

function normalizeMac(mac: string): string {
  return mac.replace(/[^0-9a-fA-F]/g, '').toUpperCase();
}
function formatMac(mac: string, fmt: MacFormat): string {
  const clean = normalizeMac(mac);
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
  return normalizeMac(mac).length === 12;
}
function lookupOui(mac: string): string | null {
  const clean = normalizeMac(mac);
  if (clean.length < 6) return null;
  const prefix = clean.slice(0, 2) + ':' + clean.slice(2, 4) + ':' + clean.slice(4, 6);
  return OUI_DB[prefix] || null;
}
function getMacInfo(mac: string) {
  const clean = normalizeMac(mac);
  if (clean.length !== 12) return null;
  const firstByte = parseInt(clean.slice(0, 2), 16);
  return {
    unicast: (firstByte & 0x01) === 0,
    locallyAdministered: (firstByte & 0x02) !== 0,
    oui: lookupOui(mac),
    ouiHex: clean.slice(0, 6),
  };
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1400); }}
      className="p-0.5 text-gray-400 hover:text-blue-500 transition-colors" title="Copy">
      {copied ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
    </button>
  );
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

  const copyAll = () => navigator.clipboard.writeText(macs.join('\n'));

  const info = selectedMac ? getMacInfo(selectedMac) : null;
  const lookupInfo = lookupInput.length >= 6 ? getMacInfo(lookupInput) : null;
  const lookupFormatted = lookupInput.length >= 6 && isValidMac(lookupInput);

  const selectClass = 'px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100';

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-teal-50 dark:from-gray-950 dark:to-teal-950 p-3 gap-2 overflow-hidden">
      <div className="flex flex-wrap gap-2 items-center">
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
            <button onClick={() => { setMacs([]); setSelectedMac(null); }} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Clear</button>
          </>
        )}
        <span className="text-xs text-gray-500 ml-auto">{macs.length} generated</span>
      </div>

      <div className="flex-1 min-h-0 flex gap-3 overflow-hidden">
        {/* MAC list */}
        <div className="flex-1 overflow-auto space-y-1">
          {macs.map((m, i) => (
            <div key={i}
              className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-mono cursor-pointer transition-colors ${selectedMac === m ? 'bg-teal-100 dark:bg-teal-900/40 ring-1 ring-teal-400' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              onClick={() => setSelectedMac(m)}>
              <span className="flex-1 text-gray-800 dark:text-gray-200 select-all">{m}</span>
              {lookupOui(m) && <span className="text-[10px] text-teal-600 dark:text-teal-400 shrink-0">{lookupOui(m)}</span>}
              <button onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(m); }}
                className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px] hover:bg-gray-300 dark:hover:bg-gray-600 shrink-0">Copy</button>
            </div>
          ))}
          {macs.length === 0 && <div className="text-sm text-gray-400 text-center mt-8">Click Generate to create MAC addresses</div>}
        </div>

        {/* Right panel */}
        <div className="w-72 flex flex-col gap-3 overflow-auto">

          {/* OUI Lookup / Format Converter */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Lookup & Convert</div>
            <input value={lookupInput} onChange={e => setLookupInput(e.target.value)} placeholder="Paste any MAC address..."
              className="w-full px-2 py-1.5 text-xs rounded bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono mb-1.5" />

            {lookupFormatted && lookupInfo && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-500">Vendor:</span>
                  <span className={`font-medium ${lookupInfo.oui ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400'}`}>{lookupInfo.oui || 'Unknown'}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-500">Type:</span>
                  <span>{lookupInfo.unicast ? 'Unicast' : 'Multicast'} · {lookupInfo.locallyAdministered ? 'Local' : 'Global'}</span>
                </div>
                <div className="border-t border-gray-100 dark:border-gray-700 pt-1.5">
                  <div className="text-[10px] text-gray-500 mb-1">All formats:</div>
                  {(['colon', 'dash', 'dot', 'bare'] as MacFormat[]).map(f => (
                    <div key={f} className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-gray-700 dark:text-gray-300 select-all">{formatMac(lookupInput, f)}</span>
                      <CopyBtn text={formatMac(lookupInput, f)} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {lookupInput.length > 0 && !lookupFormatted && <div className="text-[10px] text-red-500">Invalid MAC address</div>}
          </div>

          {/* Selected MAC details */}
          {info && selectedMac && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Selected MAC Details</div>
              <div className="font-mono text-[10px] text-teal-600 dark:text-teal-400 mb-1.5 select-all">{selectedMac}</div>
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between"><span className="text-gray-500">Type:</span><span>{info.unicast ? 'Unicast' : 'Multicast'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Scope:</span><span>{info.locallyAdministered ? 'Locally Administered' : 'Globally Unique'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">OUI:</span><span className="font-mono">{info.ouiHex}</span></div>
                {info.oui && <div className="flex justify-between"><span className="text-gray-500">Vendor:</span><span className="text-teal-600 dark:text-teal-400">{info.oui}</span></div>}
                <div className="border-t border-gray-100 dark:border-gray-700 pt-1 mt-1 space-y-0.5">
                  {(['colon', 'dash', 'dot', 'bare'] as MacFormat[]).map(f => (
                    <div key={f} className="flex items-center justify-between">
                      <span className="font-mono text-gray-700 dark:text-gray-300 select-all">{formatMac(selectedMac, f)}</span>
                      <CopyBtn text={formatMac(selectedMac, f)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Info box */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 text-[10px] text-gray-500 dark:text-gray-400 space-y-1">
            <div className="font-medium text-gray-700 dark:text-gray-300 text-xs mb-1">Generated MACs</div>
            <p>All generated MACs use the <span className="font-mono text-teal-600">LA bit</span> (Locally Administered). They won't conflict with real hardware addresses.</p>
            <p>OUI database includes {Object.keys(OUI_DB).length} vendor prefixes.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
