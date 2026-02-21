import React, { useState, useCallback } from 'react';

function generateULA(): string {
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  const globalId = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `fd${globalId.slice(0, 2)}:${globalId.slice(2, 6)}:${globalId.slice(6, 10)}`;
}

function expandSubnets(prefix: string, count: number): string[] {
  const subs: string[] = [];
  for (let i = 0; i < Math.min(count, 256); i++) {
    subs.push(`${prefix}:${i.toString(16).padStart(4, '0')}::/64`);
  }
  return subs;
}

function isValidIPv6(addr: string): boolean {
  const clean = addr.replace(/\/\d+$/, '');
  if (clean.includes('::')) {
    const parts = clean.split('::');
    if (parts.length > 2) return false;
    const left = parts[0] ? parts[0].split(':') : [];
    const right = parts[1] ? parts[1].split(':') : [];
    if (left.length + right.length > 7) return false;
    return [...left, ...right].every(g => /^[0-9a-fA-F]{1,4}$/.test(g) || g === '');
  }
  const groups = clean.split(':');
  if (groups.length !== 8) return false;
  return groups.every(g => /^[0-9a-fA-F]{1,4}$/.test(g));
}

function expandIPv6(addr: string): string {
  const clean = addr.replace(/\/\d+$/, '');
  let groups: string[];
  if (clean.includes('::')) {
    const parts = clean.split('::');
    const left = parts[0] ? parts[0].split(':') : [];
    const right = parts[1] ? parts[1].split(':') : [];
    const missing = 8 - left.length - right.length;
    groups = [...left, ...Array(missing).fill('0000'), ...right];
  } else {
    groups = clean.split(':');
  }
  return groups.map(g => g.padStart(4, '0')).join(':');
}

function compressIPv6(addr: string): string {
  const expanded = expandIPv6(addr);
  const groups = expanded.split(':');
  let bestStart = -1, bestLen = 0, curStart = -1, curLen = 0;
  for (let i = 0; i < 8; i++) {
    if (groups[i] === '0000') {
      if (curStart === -1) curStart = i;
      curLen++;
      if (curLen > bestLen) { bestStart = curStart; bestLen = curLen; }
    } else {
      curStart = -1; curLen = 0;
    }
  }
  if (bestLen < 2) return groups.map(g => g.replace(/^0+/, '') || '0').join(':');
  const left = groups.slice(0, bestStart).map(g => g.replace(/^0+/, '') || '0');
  const right = groups.slice(bestStart + bestLen).map(g => g.replace(/^0+/, '') || '0');
  return left.join(':') + '::' + right.join(':');
}

function getIPv6Type(addr: string): string {
  const exp = expandIPv6(addr).toLowerCase();
  const first = exp.slice(0, 4);
  if (exp === '0000:0000:0000:0000:0000:0000:0000:0001') return 'Loopback (::1)';
  if (exp === '0000:0000:0000:0000:0000:0000:0000:0000') return 'Unspecified (::)';
  if (first.startsWith('fe80')) return 'Link-Local';
  if (first.startsWith('fd') || first.startsWith('fc')) return 'Unique Local Address (ULA)';
  if (first.startsWith('ff')) return 'Multicast';
  if (first === '2001' && exp.slice(5, 9) === '0db8') return 'Documentation (2001:db8::/32)';
  if (first === '2001' || first === '2002' || first === '2003' || parseInt(first, 16) >= 0x2000 && parseInt(first, 16) < 0x4000) return 'Global Unicast';
  return 'Other';
}

export const IPv6ULAGenerator: React.FC = () => {
  const [prefixes, setPrefixes] = useState<string[]>([]);
  const [subnetCount, setSubnetCount] = useState(4);
  const [selectedPrefix, setSelectedPrefix] = useState<string | null>(null);
  const [validateInput, setValidateInput] = useState('');

  const generate = useCallback(() => {
    const prefix = generateULA();
    setPrefixes(prev => [prefix, ...prev].slice(0, 50));
    setSelectedPrefix(prefix);
  }, []);

  const subnets = selectedPrefix ? expandSubnets(selectedPrefix, subnetCount) : [];
  const isValid = validateInput.length > 0 ? isValidIPv6(validateInput) : null;

  const selectClass = 'px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100';

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-violet-50 dark:from-gray-950 dark:to-violet-950 p-3 overflow-hidden">
      <div className="flex flex-wrap gap-2 mb-2 items-center">
        <button onClick={generate} className="px-4 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-semibold">Generate ULA</button>
        <select value={subnetCount} onChange={e => setSubnetCount(Number(e.target.value))} className={selectClass}>
          {[1, 4, 8, 16, 64, 256].map(n => <option key={n} value={n}>{n} subnet{n > 1 ? 's' : ''}</option>)}
        </select>
        <span className="text-xs text-gray-500 ml-auto">{prefixes.length} prefixes generated</span>
      </div>

      <div className="flex-1 min-h-0 flex gap-3 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden gap-3">
          <div className="overflow-auto space-y-1">
            {prefixes.map((p, i) => (
              <div key={i} className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-mono cursor-pointer transition-colors ${selectedPrefix === p ? 'bg-violet-100 dark:bg-violet-900/40 ring-1 ring-violet-400' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                onClick={() => setSelectedPrefix(p)}>
                <span className="flex-1 text-gray-800 dark:text-gray-200 select-all">{p}::/48</span>
                <button onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(p + '::/48'); }}
                  className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px] hover:bg-gray-300 dark:hover:bg-gray-600">Copy</button>
              </div>
            ))}
            {prefixes.length === 0 && <div className="text-sm text-gray-400 text-center mt-8">Click Generate ULA to create prefixes</div>}
          </div>

          {subnets.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 overflow-auto">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">Subnets for {selectedPrefix}::/48</div>
                <button onClick={() => navigator.clipboard.writeText(subnets.join('\n'))}
                  className="px-2 py-0.5 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-700">Copy All</button>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {subnets.map((s, i) => (
                  <div key={i} className="text-[10px] font-mono text-violet-600 dark:text-violet-400 select-all">{s}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-72 flex flex-col gap-3 overflow-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">IPv6 Validator</div>
            <input value={validateInput} onChange={e => setValidateInput(e.target.value)} placeholder="Paste IPv6 address..."
              className="w-full px-2 py-1.5 text-xs rounded bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono" />
            {isValid !== null && (
              <div className={`mt-1.5 text-xs font-semibold ${isValid ? 'text-green-600' : 'text-red-500'}`}>
                {isValid ? 'Valid IPv6' : 'Invalid IPv6'}
              </div>
            )}
            {isValid && (
              <div className="mt-2 space-y-1 text-[10px]">
                <div><span className="text-gray-500">Expanded: </span><span className="font-mono text-gray-800 dark:text-gray-200">{expandIPv6(validateInput)}</span></div>
                <div><span className="text-gray-500">Compressed: </span><span className="font-mono text-gray-800 dark:text-gray-200">{compressIPv6(validateInput)}</span></div>
                <div><span className="text-gray-500">Type: </span><span className="text-violet-600 dark:text-violet-400">{getIPv6Type(validateInput)}</span></div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Address Types</div>
            <div className="space-y-1 text-[10px]">
              {[
                ['::1', 'Loopback'],
                ['::', 'Unspecified'],
                ['fe80::/10', 'Link-Local'],
                ['fc00::/7', 'ULA (Private)'],
                ['2000::/3', 'Global Unicast'],
                ['ff00::/8', 'Multicast'],
                ['2001:db8::/32', 'Documentation'],
              ].map(([addr, desc]) => (
                <div key={addr} className="flex justify-between">
                  <span className="font-mono text-gray-500">{addr}</span>
                  <span className="text-gray-700 dark:text-gray-300">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">About ULA</div>
            <div className="text-[10px] text-gray-500 space-y-1">
              <p>Unique Local Addresses (RFC 4193) are the IPv6 equivalent of IPv4 private addresses.</p>
              <p>Prefix <span className="font-mono text-violet-600">fd00::/8</span> with a 40-bit random global ID ensures uniqueness across organizations.</p>
              <p>Each /48 prefix supports up to 65,536 /64 subnets.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
