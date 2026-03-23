import React, { useState, useMemo } from 'react';
import { Copy, Check, Search } from 'lucide-react';

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

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1400); }}
      className="ml-1 p-0.5 text-gray-400 hover:text-blue-500 transition-colors" title="Copy">
      {copied ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
    </button>
  );
}

export const SubnetCalculator: React.FC = () => {
  const [ip, setIp] = useState('192.168.1.100');
  const [cidr, setCidr] = useState(24);
  const [checkIp, setCheckIp] = useState('');

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

    // IP position within subnet as percentage (0–100)
    const rangeSize = broadcast - network;
    const ipPct = rangeSize > 0 ? ((ipNum - network) / rangeSize) * 100 : 50;

    return {
      network: numToIp(network), broadcast: numToIp(broadcast),
      firstHost: numToIp(firstHost), lastHost: numToIp(lastHost),
      mask: numToIp(mask), wildcard: numToIp(wildcard),
      totalHosts, ipClass, classLetter,
      networkBin: numToBin(network), maskBin: numToBin(mask), ipBin: numToBin(ipNum),
      networkNum: network, broadcastNum: broadcast, ipNum, ipPct,
    };
  }, [ip, cidr]);

  const checkResult = useMemo(() => {
    if (!result || !isValidIp(checkIp)) return null;
    const n = ipToNum(checkIp);
    return n >= result.networkNum && n <= result.broadcastNum;
  }, [checkIp, result]);

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
      <div className="flex items-center">
        <span className="text-xs font-mono text-gray-800 dark:text-gray-200">{value}</span>
        {extra && <span className="text-[10px] text-gray-400 ml-1.5">{extra}</span>}
        <CopyBtn text={value} />
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-950 dark:to-blue-950 p-3 gap-2 overflow-hidden">

      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 font-medium">IP:</span>
          <input value={ip} onChange={e => setIp(e.target.value)}
            className="w-36 px-2 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono" />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 font-medium">/{cidr}</span>
          <input type="range" min={0} max={32} value={cidr} onChange={e => setCidr(Number(e.target.value))} className="w-32" />
        </div>
        {!isValidIp(ip) && <span className="text-xs text-red-500">Invalid IP</span>}
      </div>

      {result && (
        <div className="flex-1 min-h-0 flex gap-3 overflow-hidden">
          <div className="flex-1 overflow-auto space-y-3">

            {/* Visual range bar */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">IP Position in Subnet</div>
              <div className="relative h-5 bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden mb-1">
                <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-blue-200 to-blue-400 dark:from-blue-800 dark:to-blue-600 opacity-40 rounded-full" />
                {/* IP marker */}
                <div className="absolute top-0 bottom-0 w-1 bg-blue-600 dark:bg-blue-400 rounded"
                  style={{ left: `${Math.min(result.ipPct, 99)}%`, transform: 'translateX(-50%)' }} />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-gray-500">
                <span>{result.network} (net)</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">{ip}</span>
                <span>{result.broadcast} (bcast)</span>
              </div>
            </div>

            {/* Details */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Subnet Details</div>
              {infoRow('Network Address', result.network, `/${cidr}`)}
              {infoRow('Broadcast Address', result.broadcast)}
              {infoRow('First Host', result.firstHost)}
              {infoRow('Last Host', result.lastHost)}
              {infoRow('Subnet Mask', result.mask)}
              {infoRow('Wildcard Mask', result.wildcard)}
              <div className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                <span className="text-xs text-gray-500 font-medium">Usable Hosts</span>
                <span className="text-xs font-mono text-gray-800 dark:text-gray-200">{result.totalHosts.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-gray-500 font-medium">Class</span>
                <span className="text-xs font-mono text-gray-800 dark:text-gray-200">Class {result.classLetter} · {result.ipClass}</span>
              </div>
            </div>

            {/* Binary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Binary Representation</div>
              <div className="space-y-1 text-[10px] font-mono">
                <div><span className="text-gray-500 w-16 inline-block">IP:</span><span className="text-blue-600 dark:text-blue-400">{result.ipBin}</span></div>
                <div><span className="text-gray-500 w-16 inline-block">Mask:</span><span className="text-green-600 dark:text-green-400">{result.maskBin}</span></div>
                <div><span className="text-gray-500 w-16 inline-block">Network:</span><span className="text-orange-600 dark:text-orange-400">{result.networkBin}</span></div>
              </div>
            </div>

            {/* IP in subnet checker */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Search size={11} /> Is IP in this subnet?
              </div>
              <div className="flex items-center gap-2">
                <input value={checkIp} onChange={e => setCheckIp(e.target.value)} placeholder="Enter IP to check..."
                  className="flex-1 px-2 py-1.5 text-sm rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono" />
                {checkResult !== null && (
                  <span className={`text-xs font-bold px-2 py-1 rounded ${checkResult ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'}`}>
                    {checkResult ? 'IN SUBNET' : 'NOT IN SUBNET'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Common subnets */}
          <div className="w-56 overflow-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Common Subnets</div>
              <div className="grid grid-cols-3 text-[9px] text-gray-400 px-1.5 py-0.5">
                <span>CIDR</span><span>Mask</span><span className="text-right">Hosts</span>
              </div>
              <div className="space-y-0.5">
                {subnets.map(s => (
                  <div key={s.cidr} onClick={() => setCidr(s.cidr)}
                    className={`grid grid-cols-3 items-center px-1.5 py-0.5 rounded cursor-pointer text-[10px] font-mono ${s.cidr === cidr ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                    <span>/{s.cidr}</span>
                    <span>{s.mask}</span>
                    <span className="text-right">{s.hosts.toLocaleString()}</span>
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
