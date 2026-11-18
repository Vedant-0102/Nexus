function randomIndex(max: number): number {
  if (!Number.isInteger(max) || max < 1) throw new RangeError('Character set must not be empty');
  const limit = Math.floor(0x100000000 / max) * max;
  const values = new Uint32Array(1);
  do {
    globalThis.crypto.getRandomValues(values);
  } while (values[0] >= limit);
  return values[0] % max;
}

export function randomString(charset: string, length: number): string {
  if (!charset) throw new RangeError('Character set must not be empty');
  if (!Number.isInteger(length) || length < 0) throw new RangeError('Length must be a non-negative integer');
  return Array.from({ length }, () => charset[randomIndex(charset.length)]).join('');
}

export function randomPassword(characterSets: string[], length: number): string {
  const sets = characterSets.filter(Boolean);
  if (sets.length === 0) throw new RangeError('Select at least one character set');
  if (!Number.isInteger(length) || length < sets.length) {
    throw new RangeError('Password length must be at least the number of selected character sets');
  }

  const chars = sets.map(set => set[randomIndex(set.length)]);
  const combined = [...new Set(sets.join(''))].join('');
  while (chars.length < length) chars.push(combined[randomIndex(combined.length)]);

  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

export function entropyBits(charsetSize: number, length: number): number {
  if (charsetSize <= 1 || length <= 0) return 0;
  return length * Math.log2(charsetSize);
}
