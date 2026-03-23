import React, { useState, useMemo } from 'react';
import { Copy, Check, ArrowLeftRight } from 'lucide-react';

function isValidIp(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every(p => { const n = Number(p); return !isNaN(n) && n >= 0 && n <= 255 && String(n) === p; });
}
function ipToOctets(ip: string): number[] { return ip.split('.').map(Number); }
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

// Reverse: integer or hex → dotted decimal
function reverseConvert(input: string): string | null {
  input = input.trim();
  let num: number | null = null;
  if (/^0x[0-9a-fA-F]{1,8}$/.test(input)) {
    num = parseInt(input, 16);
  } else if (/^\d+$/.test(input)) {
    const n = parseInt(input, 10);
    if (n >= 0 && n <= 4294967295) num = n;
  } else if (/^[0-9a-fA-F]{8}$/.test(input)) {
    num = parseInt(input, 16);
  }
  if (num === null) return null;
  const n = num >>> 0;
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1400); }}
      className="p-0.5 text-gray-400 hover:text-blue-500 transition-colors flex-shrink-0" title="Copy">
      {copied ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
    </button>
  );
}

export const IPv4Converter: React.FC = () => {
  const [ip, setIp] = useState('192.168.1.1');
  const [reverseInput, setReverseInput] = useState('');
  const [showReverse, setShowReverse] = useState(false);

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

  const reversed = useMemo(() => reverseInput ? reverseConvert(reverseInput) : null, [reverseInput]);

  const row = (label: string, value: string) => (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-700">
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <div className="flex items-center gap-0.5">
        <span className="text-xs font-mono text-gray-800 dark:text-gray-200 select-all">{value}</span>
        <CopyBtn text={value} />
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-gray-950 dark:to-emerald-950 p-3 gap-2 overflow-hidden">

      {/* Input row */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 font-medium">IPv4:</span>
        <input value={ip} onChange={e => setIp(e.target.value)} placeholder="e.g. 192.168.1.1"
          className="w-40 px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono" />
        {!isValidIp(ip) && ip.length > 0 && <span className="text-xs text-red-500">Invalid IP</span>}
        <button onClick={() => setShowReverse(v => !v)}
          className={`flex items-center gap-1 ml-auto px-2 py-1 text-xs rounded-lg border transition-colors ${showReverse ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-400 text-emerald-700 dark:text-emerald-300' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'}`}>
          <ArrowLeftRight size={11} /> Reverse Lookup
        </button>
      </div>

      {/* Reverse conversion panel */}
      {showReverse && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Integer / Hex → Dotted Decimal</div>
          <div className="flex items-center gap-2">
            <input value={reverseInput} onChange={e => setReverseInput(e.target.value)}
              placeholder="e.g. 3232235777 or 0xC0A80101 or C0A80101"
              className="flex-1 px-2 py-1.5 text-sm rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono" />
            {reversed && (
              <div className="flex items-center gap-1">
                <button onClick={() => { setIp(reversed); setShowReverse(false); }}
                  className="px-2 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 font-medium whitespace-nowrap">
                  Use: {reversed}
                </button>
                <CopyBtn text={reversed} />
              </div>
            )}
            {reverseInput && !reversed && <span className="text-xs text-red-500">Invalid</span>}
          </div>
        </div>
      )}

      {result && (
        <div className="flex-1 min-h-0 overflow-auto space-y-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Conversions</div>
            {row('Decimal (dotted)', result.decimal)}
            {row('Binary', result.binary)}
            {row('Hexadecimal', result.hex)}
            {row('Hex (dotted)', result.hexDotted)}
            {row('Octal', result.octal)}
            {row('Integer', String(result.integer))}
            {row('Reverse DNS', result.reverseDns)}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Classification</div>
            <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-700">
              <span className="text-xs text-gray-500 font-medium">IP Class</span>
              <span className="text-xs text-gray-800 dark:text-gray-200">Class {result.ipClass}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-700">
              <span className="text-xs text-gray-500 font-medium">Type</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${result.isPrivate ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300'}`}>
                {result.isPrivate ? 'Private' : 'Public'}
              </span>
            </div>
            {result.special && (
              <div className="flex items-center justify-between py-1.5">
                <span className="text-xs text-gray-500 font-medium">Special</span>
                <span className="text-xs text-gray-800 dark:text-gray-200">{result.special}</span>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Octet Breakdown</div>
            <div className="grid grid-cols-4 gap-2">
              {result.octets.map((oct, i) => (
                <div key={i} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-gray-800 dark:text-gray-200">{oct}</div>
                  <div className="text-[10px] font-mono text-blue-600 dark:text-blue-400">{octetToBin(oct)}</div>
                  <div className="text-[10px] font-mono text-green-600 dark:text-green-400">0x{octetToHex(oct)}</div>
                  <div className="text-[9px] text-gray-400">Octet {i + 1}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
