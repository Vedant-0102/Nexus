// ---- Notes & MIDI ----
export type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';
export type Octave = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface Note {
  name: NoteName;
  octave: Octave;
  midi: number;
  frequency: number;
}

// ---- Piano Roll ----
export interface PianoRollNote {
  id: string;
  midi: number;
  startBeat: number;
  duration: number;
  velocity: number;
  trackId: string;
}

export interface Track {
  id: string;
  name: string;
  instrument: InstrumentType;
  notes: PianoRollNote[];
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  color: string;
}

// ---- Instruments ----
export type InstrumentType = 'piano' | 'guitar' | 'drums' | 'synth' | 'bass' | 'strings';

export type OscType = 'sine' | 'square' | 'sawtooth' | 'triangle';

export interface ADSREnvelope {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

// ---- Beat Sequencer ----
export interface SequencerPattern {
  id: string;
  name: string;
  steps: boolean[][];
  stepCount: number;
}

// ---- Effects ----
export type EffectType = 'reverb' | 'delay' | 'eq' | 'compressor';

export interface EffectConfig {
  type: EffectType;
  enabled: boolean;
  params: Record<string, number>;
}

export interface EffectNode {
  input: AudioNode;
  output: AudioNode;
  update: (params: Record<string, number>) => void;
  dispose: () => void;
}

// ---- Transport ----
export interface TransportState {
  bpm: number;
  isPlaying: boolean;
  currentBeat: number;
  timeSignature: [number, number];
}

export type TransportListener = (state: TransportState) => void;
export type BeatListener = (beat: number, time: number) => void;

// ---- Chords & Theory ----
export type ScaleType = 'major' | 'natural-minor' | 'harmonic-minor' | 'melodic-minor' |
  'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'pentatonic-major' | 'pentatonic-minor' |
  'blues' | 'chromatic';

export type ChordQuality = 'major' | 'minor' | 'diminished' | 'augmented' | 'dom7' | 'maj7' | 'min7' | 'dim7' | 'sus2' | 'sus4';

// ---- Arpeggiator ----
export type ArpPattern = 'up' | 'down' | 'up-down' | 'down-up' | 'random';
export type ArpRate = '1/4' | '1/8' | '1/16' | '1/32';
