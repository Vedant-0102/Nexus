import React, { useState, useMemo } from 'react';

function isValidIp(ip: string): boolean {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return false;
  return parts.every(p => { const n = Number(p); return !isNaN(n) && n >= 0 && n <= 255 && String(n) === p.trim(); });
}

function ipToNum(ip: string): number {
  const p = ip.trim().split('.').map(Number);
  return ((p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3]) >>> 0;
}

function numToIp(n: number): string {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
}

function rangeToCidrs(start: number, end: number): string[] {
  const cidrs: string[] = [];
  let cur = start;
  while (cur <= end) {
    let maxBit = 32;
    while (maxBit > 0) {
      const mask = ~((1 << (32 - maxBit + 1)) - 1) >>> 0;
      const net = cur & mask;
      if (net === cur) maxBit--;
      else break;
    }
    const x = Math.log2(end - cur + 1) | 0;
    maxBit = Math.max(32 - x, maxBit);
    const hostBits = 32 - maxBit;
    cidrs.push(numToIp(cur) + '/' + maxBit);
    cur += (1 << hostBits) >>> 0;
    if (cur === 0) break; // overflow
  }
  return cidrs;
}

export const IPv4RangeExpander: React.FC = () => {
  const [startIp, setStartIp] = useState('192.168.1.0');
  const [endIp, setEndIp] = useState('192.168.1.15');
  const [showAll, setShowAll] = useState(false);

  const result = useMemo(() => {
    if (!isValidIp(startIp) || !isValidIp(endIp)) return null;
    const s = ipToNum(startIp);
    const e = ipToNum(endIp);
    if (s > e) return null;
    const count = e - s + 1;
    const cidrs = rangeToCidrs(s, e);
    const ips: string[] = [];
    const maxShow = showAll ? Math.min(count, 1024) : Math.min(count, 50);
    for (let i = 0; i < maxShow; i++) ips.push(numToIp(s + i));
    return { count, cidrs, ips, truncated: count > maxShow };
  }, [startIp, endIp, showAll]);

  const validStart = isValidIp(startIp);
  const validEnd = isValidIp(endIp);

  const copyList = () => {
    if (!result) return;
    const s = ipToNum(startIp);
    const lines: string[] = [];
    for (let i = 0; i < Math.min(result.count, 10000); i++) lines.push(numToIp(s + i));
    navigator.clipboard.writeText(lines.join('\n'));
  };

  const copyCidrs = () => {
    if (result) navigator.clipboard.writeText(result.cidrs.join('\n'));
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-orange-50 dark:from-gray-950 dark:to-orange-950 p-3 overflow-hidden">
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        <span className="text-xs text-gray-500 font-medium">Start:</span>
        <input value={startIp} onChange={e => setStartIp(e.target.value)} placeholder="192.168.1.0"
          className={`w-36 px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border ${validStart ? 'border-gray-300 dark:border-gray-600' : 'border-red-400'} text-gray-900 dark:text-gray-100 font-mono`} />
        <span className="text-xs text-gray-500 font-medium">End:</span>
        <input value={endIp} onChange={e => setEndIp(e.target.value)} placeholder="192.168.1.255"
          className={`w-36 px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border ${validEnd ? 'border-gray-300 dark:border-gray-600' : 'border-red-400'} text-gray-900 dark:text-gray-100 font-mono`} />
        {result && <span className="text-xs text-gray-500 ml-auto">{result.count.toLocaleString()} addresses</span>}
      </div>

      {result && (
        <div className="flex-1 min-h-0 flex gap-3 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">IP Addresses</div>
              <button onClick={copyList} className="px-2 py-0.5 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-700">Copy All</button>
              {!showAll && result.count > 50 && (
                <button onClick={() => setShowAll(true)} className="px-2 py-0.5 text-[10px] bg-gray-600 text-white rounded hover:bg-gray-700">Show More</button>
              )}
            </div>
            <div className="flex-1 overflow-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2">
              <div className="grid grid-cols-3 gap-x-4 gap-y-0.5">
                {result.ips.map((ip, i) => (
                  <div key={i} className="text-xs font-mono text-gray-700 dark:text-gray-300 select-all">{ip}</div>
                ))}
              </div>
              {result.truncated && <div className="text-xs text-gray-400 mt-2 text-center">...and {(result.count - result.ips.length).toLocaleString()} more</div>}
            </div>
          </div>

          <div className="w-64 flex flex-col gap-3 overflow-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">CIDR Decomposition</div>
                <button onClick={copyCidrs} className="px-2 py-0.5 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-700">Copy</button>
              </div>
              <div className="space-y-1">
                {result.cidrs.map((cidr, i) => (
                  <div key={i} className="text-xs font-mono text-orange-600 dark:text-orange-400 select-all">{cidr}</div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Summary</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-gray-500">Start:</span><span className="font-mono text-gray-800 dark:text-gray-200">{startIp}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">End:</span><span className="font-mono text-gray-800 dark:text-gray-200">{endIp}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Total IPs:</span><span className="font-mono text-gray-800 dark:text-gray-200">{result.count.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">CIDR Blocks:</span><span className="font-mono text-gray-800 dark:text-gray-200">{result.cidrs.length}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!result && validStart && validEnd && (
        <div className="text-sm text-red-500 text-center mt-8">Start IP must be less than or equal to End IP</div>
      )}
    </div>
  );
};
