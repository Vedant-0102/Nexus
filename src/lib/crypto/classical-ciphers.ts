export type CipherType = 'caesar' | 'rot13' | 'vigenere' | 'atbash' | 'affine' | 'rail-fence' | 'substitution' | 'morse';

// Caesar cipher
export function caesarEncrypt(text: string, shift: number): string {
  return text.replace(/[a-zA-Z]/g, (char) => {
    const base = char <= 'Z' ? 65 : 97;
    return String.fromCharCode(((char.charCodeAt(0) - base + shift) % 26) + base);
  });
}

export function caesarDecrypt(text: string, shift: number): string {
  return caesarEncrypt(text, 26 - (shift % 26));
}

// Affine cipher
export const AFFINE_VALID_A = [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25];

export function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function modInverse(a: number, m: number): number {
  for (let x = 1; x < m; x++) {
    if ((a * x) % m === 1) return x;
  }
  return 1;
}

export function affineEncrypt(text: string, a: number, b: number): string {
  return text.replace(/[a-zA-Z]/g, (char) => {
    const base = char <= 'Z' ? 65 : 97;
    const x = char.charCodeAt(0) - base;
    return String.fromCharCode(((a * x + b) % 26) + base);
  });
}

export function affineDecrypt(text: string, a: number, b: number): string {
  const aInv = modInverse(a, 26);
  return text.replace(/[a-zA-Z]/g, (char) => {
    const base = char <= 'Z' ? 65 : 97;
    const y = char.charCodeAt(0) - base;
    return String.fromCharCode(((aInv * (y - b + 26)) % 26) + base);
  });
}

// Vigenere cipher
export function vigenereEncrypt(text: string, key: string): string {
  const k = key.toUpperCase();
  let ki = 0;
  return text.replace(/[a-zA-Z]/g, (char) => {
    const base = char <= 'Z' ? 65 : 97;
    const shift = k[ki % k.length].charCodeAt(0) - 65;
    ki++;
    return String.fromCharCode(((char.charCodeAt(0) - base + shift) % 26) + base);
  });
}

export function vigenereDecrypt(text: string, key: string): string {
  const k = key.toUpperCase();
  let ki = 0;
  return text.replace(/[a-zA-Z]/g, (char) => {
    const base = char <= 'Z' ? 65 : 97;
    const shift = k[ki % k.length].charCodeAt(0) - 65;
    ki++;
    return String.fromCharCode(((char.charCodeAt(0) - base - shift + 26) % 26) + base);
  });
}

// Atbash cipher
export function atbash(text: string): string {
  return text.replace(/[a-zA-Z]/g, (char) => {
    const base = char <= 'Z' ? 65 : 97;
    return String.fromCharCode((25 - (char.charCodeAt(0) - base)) + base);
  });
}

// Rail Fence cipher
export function railFenceEncrypt(text: string, rails: number): string {
  if (rails === 1) return text;
  const fence: string[][] = Array.from({ length: rails }, () => []);
  let rail = 0;
  let dir = 1;
  
  for (const char of text) {
    fence[rail].push(char);
    if (rail === 0) dir = 1;
    else if (rail === rails - 1) dir = -1;
    rail += dir;
  }
  
  return fence.flat().join('');
}

export function railFenceDecrypt(text: string, rails: number): string {
  if (rails === 1) return text;
  const fence: (string | null)[][] = Array.from({ length: rails }, () => []);
  let rail = 0;
  let dir = 1;
  
  // Mark positions
  for (let i = 0; i < text.length; i++) {
    fence[rail].push(null);
    if (rail === 0) dir = 1;
    else if (rail === rails - 1) dir = -1;
    rail += dir;
  }
  
  // Fill with characters
  let index = 0;
  for (let r = 0; r < rails; r++) {
    for (let c = 0; c < fence[r].length; c++) {
      fence[r][c] = text[index++];
    }
  }
  
  // Read zigzag
  const result: string[] = [];
  rail = 0;
  dir = 1;
  for (let i = 0; i < text.length; i++) {
    result.push(fence[rail].shift()!);
    if (rail === 0) dir = 1;
    else if (rail === rails - 1) dir = -1;
    rail += dir;
  }
  
  return result.join('');
}

// Substitution cipher
export function generateRandomSubstitution(): Record<string, string> {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const shuffled = alphabet.split('').sort(() => Math.random() - 0.5).join('');
  const map: Record<string, string> = {};
  for (let i = 0; i < 26; i++) {
    map[alphabet[i]] = shuffled[i];
  }
  return map;
}

export function substitutionEncrypt(text: string, map: Record<string, string>): string {
  return text.replace(/[a-zA-Z]/g, (char) => {
    const upper = char.toUpperCase();
    const result = map[upper] || char;
    return char === char.toLowerCase() ? result.toLowerCase() : result;
  });
}

export function substitutionDecrypt(text: string, map: Record<string, string>): string {
  const reverseMap: Record<string, string> = {};
  for (const [key, val] of Object.entries(map)) {
    reverseMap[val] = key;
  }
  return substitutionEncrypt(text, reverseMap);
}

// Morse code
export const MORSE: Record<string, string> = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
  'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
  'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
  '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
  '8': '---..', '9': '----.', ' ': '/'
};

export const MORSE_REV: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE).map(([k, v]) => [v, k])
);

export function morseEncode(text: string): string {
  return text
    .toUpperCase()
    .split('')
    .map(char => MORSE[char] || char)
    .join(' ');
}

export function morseDecode(morse: string): string {
  return morse
    .split(' ')
    .map(code => MORSE_REV[code] || code)
    .join('');
}

// Letter frequency analysis
export function letterFrequency(text: string): Record<string, number> {
  const freq: Record<string, number> = {};
  for (const char of text.toUpperCase()) {
    if (/[A-Z]/.test(char)) {
      freq[char] = (freq[char] || 0) + 1;
    }
  }
  return freq;
}

// Cipher information
export const CIPHER_INFO: Record<CipherType, string> = {
  'caesar': 'Shift each letter by a fixed amount',
  'rot13': 'Special case of Caesar with shift 13',
  'vigenere': 'Polyalphabetic cipher using a keyword',
  'atbash': 'Reverse the alphabet (A↔Z, B↔Y, etc.)',
  'affine': 'Linear transformation: E(x) = (ax + b) mod 26',
  'rail-fence': 'Write text in zigzag pattern across rails',
  'substitution': 'Replace each letter with another letter',
  'morse': 'Encode letters as dots and dashes'
};
