import React, { useState, useMemo } from 'react';

function ipToNum(ip: string): number {
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}
function numToIp(num: number): string {
  return [(num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255].join('.');
}
function numToBin(num: number): string {
  return num.toString(2).padStart(32, '0').replace(/(.{8})/g, '$1 ').trim();
}
function isValidIp(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every(p => { const n = Number(p); return !isNaN(n) && n >= 0 && n <= 255 && String(n) === p; });
}

export const SubnetCalculator: React.FC = () => {
  const [ip, setIp] = useState('192.168.1.100');
  const [cidr, setCidr] = useState(24);

  const result = useMemo(() => {
    if (!isValidIp(ip)) return null;
    const ipNum = ipToNum(ip);
    const mask = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
    const network = (ipNum & mask) >>> 0;
    const broadcast = (network | ~mask) >>> 0;
    const firstHost = cidr >= 31 ? network : (network + 1) >>> 0;
    const lastHost = cidr >= 31 ? broadcast : (broadcast - 1) >>> 0;
    const totalHosts = cidr >= 31 ? (cidr === 32 ? 1 : 2) : Math.pow(2, 32 - cidr) - 2;
    const wildcard = (~mask) >>> 0;
    const ipClass = ip.startsWith('10.') || (ip.startsWith('172.') && Number(ip.split('.')[1]) >= 16 && Number(ip.split('.')[1]) <= 31) || ip.startsWith('192.168.') ? 'Private' : 'Public';
    const classLetter = (ipNum >>> 24) < 128 ? 'A' : (ipNum >>> 24) < 192 ? 'B' : (ipNum >>> 24) < 224 ? 'C' : (ipNum >>> 24) < 240 ? 'D' : 'E';

    return {
      network: numToIp(network), broadcast: numToIp(broadcast),
      firstHost: numToIp(firstHost), lastHost: numToIp(lastHost),
      mask: numToIp(mask), wildcard: numToIp(wildcard),
      totalHosts, ipClass, classLetter,
      networkBin: numToBin(network), maskBin: numToBin(mask),
      ipBin: numToBin(ipNum),
    };
  }, [ip, cidr]);

  // Subnet table for common CIDRs
  const subnets = useMemo(() => {
    return [32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 16, 8, 0].map(c => {
      const m = c === 0 ? 0 : (~0 << (32 - c)) >>> 0;
      const hosts = c >= 31 ? (c === 32 ? 1 : 2) : Math.pow(2, 32 - c) - 2;
      return { cidr: c, mask: numToIp(m), hosts };
    });
  }, []);

  const infoRow = (label: string, value: string, extra?: string) => (
    <div className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-gray-700">
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <div className="text-right">
        <span className="text-xs font-mono text-gray-800 dark:text-gray-200">{value}</span>
        {extra && <span className="text-[10px] text-gray-400 ml-2">{extra}</span>}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-950 dark:to-blue-950 p-3 overflow-hidden">
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 font-medium">IP:</span>
          <input value={ip} onChange={e => setIp(e.target.value)}
            className="w-36 px-2 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono" />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 font-medium">CIDR: /{cidr}</span>
          <input type="range" min={0} max={32} value={cidr} onChange={e => setCidr(Number(e.target.value))} className="w-32" />
        </div>
        {!isValidIp(ip) && <span className="text-xs text-red-500">Invalid IP</span>}
      </div>

      {result && (
        <div className="flex-1 min-h-0 flex gap-3 overflow-hidden">
          <div className="flex-1 overflow-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 mb-3">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Subnet Details</div>
              {infoRow('Network Address', result.network, `/${cidr}`)}
              {infoRow('Broadcast Address', result.broadcast)}
              {infoRow('First Host', result.firstHost)}
              {infoRow('Last Host', result.lastHost)}
              {infoRow('Subnet Mask', result.mask)}
              {infoRow('Wildcard Mask', result.wildcard)}
              {infoRow('Usable Hosts', result.totalHosts.toLocaleString())}
              {infoRow('IP Class', `Class ${result.classLetter}`, result.ipClass)}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Binary Representation</div>
              <div className="space-y-1 text-[10px] font-mono">
                <div><span className="text-gray-500 w-16 inline-block">IP:</span><span className="text-blue-600 dark:text-blue-400">{result.ipBin}</span></div>
                <div><span className="text-gray-500 w-16 inline-block">Mask:</span><span className="text-green-600 dark:text-green-400">{result.maskBin}</span></div>
                <div><span className="text-gray-500 w-16 inline-block">Network:</span><span className="text-orange-600 dark:text-orange-400">{result.networkBin}</span></div>
              </div>
            </div>
          </div>

          <div className="w-56 overflow-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Common Subnets</div>
              <div className="space-y-0.5">
                {subnets.map(s => (
                  <div key={s.cidr} onClick={() => setCidr(s.cidr)}
                    className={`flex items-center justify-between px-1.5 py-0.5 rounded cursor-pointer text-[10px] font-mono ${s.cidr === cidr ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                    <span>/{s.cidr}</span>
                    <span>{s.mask}</span>
                    <span>{s.hosts}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
