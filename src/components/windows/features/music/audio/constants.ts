import type { NoteName, ScaleType, ChordQuality } from './types';

export const NOTE_NAMES: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function noteNameToMidi(name: NoteName, octave: number): number {
  const idx = NOTE_NAMES.indexOf(name);
  return (octave + 1) * 12 + idx;
}

export function midiToNoteName(midi: number): { name: NoteName; octave: number } {
  const octave = Math.floor(midi / 12) - 1;
  const name = NOTE_NAMES[midi % 12];
  return { name, octave };
}

export const SCALES: Record<ScaleType, number[]> = {
  'major': [0, 2, 4, 5, 7, 9, 11],
  'natural-minor': [0, 2, 3, 5, 7, 8, 10],
  'harmonic-minor': [0, 2, 3, 5, 7, 8, 11],
  'melodic-minor': [0, 2, 3, 5, 7, 9, 11],
  'dorian': [0, 2, 3, 5, 7, 9, 10],
  'phrygian': [0, 1, 3, 5, 7, 8, 10],
  'lydian': [0, 2, 4, 6, 7, 9, 11],
  'mixolydian': [0, 2, 4, 5, 7, 9, 10],
  'pentatonic-major': [0, 2, 4, 7, 9],
  'pentatonic-minor': [0, 3, 5, 7, 10],
  'blues': [0, 3, 5, 6, 7, 10],
  'chromatic': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};

export const CHORD_INTERVALS: Record<ChordQuality, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
  augmented: [0, 4, 8],
  dom7: [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  dim7: [0, 3, 6, 9],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
};

export const COMMON_PROGRESSIONS = [
  { name: 'Pop (I-V-vi-IV)', degrees: [1, 5, 6, 4] },
  { name: 'Jazz ii-V-I', degrees: [2, 5, 1] },
  { name: '50s (I-vi-IV-V)', degrees: [1, 6, 4, 5] },
  { name: '12-Bar Blues', degrees: [1, 1, 1, 1, 4, 4, 1, 1, 5, 4, 1, 5] },
  { name: 'Canon (I-V-vi-iii-IV-I-IV-V)', degrees: [1, 5, 6, 3, 4, 1, 4, 5] },
  { name: 'Andalusian (i-VII-VI-V)', degrees: [1, 7, 6, 5] },
];

export function getScaleNotes(root: NoteName, scaleType: ScaleType): NoteName[] {
  const rootIdx = NOTE_NAMES.indexOf(root);
  const intervals = SCALES[scaleType];
  return intervals.map(i => NOTE_NAMES[(rootIdx + i) % 12]);
}

export function getChordNotes(root: NoteName, quality: ChordQuality): NoteName[] {
  const rootIdx = NOTE_NAMES.indexOf(root);
  const intervals = CHORD_INTERVALS[quality];
  return intervals.map(i => NOTE_NAMES[(rootIdx + i) % 12]);
}

export function getDiatonicChords(root: NoteName, scaleType: ScaleType): { degree: number; root: NoteName; quality: ChordQuality }[] {
  const scale = SCALES[scaleType];
  const rootIdx = NOTE_NAMES.indexOf(root);
  const isMajor = scaleType === 'major';

  const qualities: ChordQuality[] = isMajor
    ? ['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished']
    : ['minor', 'diminished', 'major', 'minor', 'minor', 'major', 'major'];

  return scale.slice(0, 7).map((interval, i) => ({
    degree: i + 1,
    root: NOTE_NAMES[(rootIdx + interval) % 12],
    quality: qualities[i],
  }));
}

// Drum names for sequencer
export const DRUM_NAMES = ['Kick', 'Snare', 'Hi-Hat', 'Open Hat', 'Tom Low', 'Tom Mid', 'Clap', 'Ride'];

// Piano keyboard mapping
export const PIANO_KEY_MAP: Record<string, number> = {
  'z': 48, 's': 49, 'x': 50, 'd': 51, 'c': 52, 'v': 53, 'g': 54,
  'b': 55, 'h': 56, 'n': 57, 'j': 58, 'm': 59,
  'q': 60, '2': 61, 'w': 62, '3': 63, 'e': 64, 'r': 65, '5': 66,
  't': 67, '6': 68, 'y': 69, '7': 70, 'u': 71, 'i': 72,
};

// Pad keyboard mapping (4x4 grid)
export const PAD_KEY_MAP: Record<string, number> = {
  '1': 0, '2': 1, '3': 2, '4': 3,
  'q': 4, 'w': 5, 'e': 6, 'r': 7,
  'a': 8, 's': 9, 'd': 10, 'f': 11,
  'z': 12, 'x': 13, 'c': 14, 'v': 15,
};
