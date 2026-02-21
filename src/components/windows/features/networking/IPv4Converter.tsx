import React, { useState, useMemo } from 'react';

function isValidIp(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every(p => { const n = Number(p); return !isNaN(n) && n >= 0 && n <= 255 && String(n) === p; });
}

function ipToOctets(ip: string): number[] {
  return ip.split('.').map(Number);
}

function octetToBin(n: number): string { return n.toString(2).padStart(8, '0'); }
function octetToHex(n: number): string { return n.toString(16).padStart(2, '0').toUpperCase(); }
function octetToOct(n: number): string { return n.toString(8); }

function getIpClass(firstOctet: number): string {
  if (firstOctet < 128) return 'A';
  if (firstOctet < 192) return 'B';
  if (firstOctet < 224) return 'C';
  if (firstOctet < 240) return 'D (Multicast)';
  return 'E (Reserved)';
}

function isPrivate(octets: number[]): boolean {
  if (octets[0] === 10) return true;
  if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return true;
  if (octets[0] === 192 && octets[1] === 168) return true;
  if (octets[0] === 127) return true;
  return false;
}

function getSpecialType(octets: number[]): string {
  if (octets[0] === 127) return 'Loopback';
  if (octets[0] === 0) return 'This Network';
  if (octets[0] === 169 && octets[1] === 254) return 'Link-Local (APIPA)';
  if (octets[0] >= 224 && octets[0] <= 239) return 'Multicast';
  if (octets[0] >= 240) return 'Reserved';
  return '';
}

export const IPv4Converter: React.FC = () => {
  const [ip, setIp] = useState('192.168.1.1');

  const result = useMemo(() => {
    if (!isValidIp(ip)) return null;
    const octets = ipToOctets(ip);
    const num = ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
    return {
      decimal: ip,
      binary: octets.map(octetToBin).join('.'),
      hex: '0x' + octets.map(octetToHex).join(''),
      hexDotted: octets.map(o => '0x' + octetToHex(o)).join('.'),
      octal: octets.map(octetToOct).join('.'),
      integer: num,
      ipClass: getIpClass(octets[0]),
      isPrivate: isPrivate(octets),
      special: getSpecialType(octets),
      reverseDns: [...octets].reverse().join('.') + '.in-addr.arpa',
      octets,
    };
  }, [ip]);

  const row = (label: string, value: string | number, mono = true) => (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-700">
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <span className={`text-xs text-gray-800 dark:text-gray-200 ${mono ? 'font-mono' : ''} select-all`}>{value}</span>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-gray-950 dark:to-emerald-950 p-3 overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-gray-500 font-medium">IPv4 Address:</span>
        <input value={ip} onChange={e => setIp(e.target.value)} placeholder="e.g. 192.168.1.1"
          className="w-40 px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono" />
        {!isValidIp(ip) && ip.length > 0 && <span className="text-xs text-red-500">Invalid IP</span>}
      </div>

      {result && (
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 mb-3">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Conversions</div>
            {row('Decimal (dotted)', result.decimal)}
            {row('Binary', result.binary)}
            {row('Hexadecimal', result.hex)}
            {row('Hex (dotted)', result.hexDotted)}
            {row('Octal', result.octal)}
            {row('Integer', result.integer.toLocaleString())}
            {row('Reverse DNS', result.reverseDns)}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 mb-3">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Classification</div>
            {row('IP Class', 'Class ' + result.ipClass, false)}
            {row('Type', result.isPrivate ? 'Private' : 'Public', false)}
            {result.special && row('Special', result.special, false)}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Octet Breakdown</div>
            <div className="grid grid-cols-4 gap-2">
              {result.octets.map((oct, i) => (
                <div key={i} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-gray-800 dark:text-gray-200">{oct}</div>
                  <div className="text-[10px] font-mono text-blue-600 dark:text-blue-400">{octetToBin(oct)}</div>
                  <div className="text-[10px] font-mono text-green-600 dark:text-green-400">0x{octetToHex(oct)}</div>
                  <div className="text-[10px] text-gray-400">Octet {i + 1}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
