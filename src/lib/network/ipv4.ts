const IPV4_PATTERN = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

export function isValidIp(ip: string): boolean {
  const match = IPV4_PATTERN.exec(ip.trim());
  return Boolean(match && match.slice(1).every(part => Number(part) <= 255));
}

export function ipToOctets(ip: string): number[] {
  if (!isValidIp(ip)) throw new Error(`Invalid IPv4 address: ${ip}`);
  return ip.trim().split('.').map(Number);
}

export function ipToNum(ip: string): number {
  return ipToOctets(ip).reduce((value, octet) => ((value << 8) | octet) >>> 0, 0);
}

export function numToIp(value: number): string {
  const n = value >>> 0;
  return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
}

export function octetToBin(octet: number): string {
  return (octet & 255).toString(2).padStart(8, '0');
}

export function octetToHex(octet: number): string {
  return (octet & 255).toString(16).toUpperCase().padStart(2, '0');
}

export function octetToOct(octet: number): string {
  return (octet & 255).toString(8).padStart(3, '0');
}

export function ipClassLetter(ip: number): string {
  const first = (ip >>> 24) & 255;
  if (first < 128) return 'A';
  if (first < 192) return 'B';
  if (first < 224) return 'C';
  if (first < 240) return 'D';
  return 'E';
}

export function isPrivateIp(ip: string): boolean {
  if (!isValidIp(ip)) return false;
  const [a, b] = ipToOctets(ip);
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

export function isLoopbackIp(ip: string): boolean {
  return isValidIp(ip) && ipToOctets(ip)[0] === 127;
}

export function getSpecialType(ip: string): string | null {
  if (!isValidIp(ip)) return null;
  const [a, b, c, d] = ipToOctets(ip);
  if (a === 0) return 'This network';
  if (isLoopbackIp(ip)) return 'Loopback';
  if (a === 169 && b === 254) return 'Link-local';
  if (a === 100 && b >= 64 && b <= 127) return 'Shared address space';
  if (a === 192 && b === 0 && c === 2) return 'Documentation';
  if (a === 198 && b === 51 && c === 100) return 'Documentation';
  if (a === 203 && b === 0 && c === 113) return 'Documentation';
  if (a >= 224 && a <= 239) return 'Multicast';
  if (a >= 240 || (a === 255 && b === 255 && c === 255 && d === 255)) return 'Reserved / broadcast';
  return null;
}

export function reverseConvert(input: string): string | null {
  const value = input.trim();
  if (isValidIp(value)) return value;

  let parsed: number;
  if (/^0x[\da-f]{1,8}$/i.test(value)) {
    parsed = Number.parseInt(value.slice(2), 16);
  } else if (/^[\da-f]{1,8}$/i.test(value) && /[a-f]/i.test(value)) {
    parsed = Number.parseInt(value, 16);
  } else if (/^\d+$/.test(value)) {
    parsed = Number(value);
  } else {
    return null;
  }

  return Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= 0xffffffff
    ? numToIp(parsed)
    : null;
}

export function rangeToCidrs(start: number, end: number): string[] {
  let current = start >>> 0;
  const last = end >>> 0;
  if (current > last) return [];

  const blocks: string[] = [];
  while (current <= last) {
    let prefix = current === 0 ? 0 : 32 - Math.floor(Math.log2(current & -current));
    while (prefix < 32 && current + 2 ** (32 - prefix) - 1 > last) prefix++;
    blocks.push(`${numToIp(current)}/${prefix}`);
    const next = current + 2 ** (32 - prefix);
    if (next > 0xffffffff) break;
    current = next >>> 0;
  }
  return blocks;
}
