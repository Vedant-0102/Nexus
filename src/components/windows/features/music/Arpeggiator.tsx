import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { getAudioContext, getMasterGain } from './audio/AudioEngine';
import { playNote } from './audio/synthesis';
import { NOTE_NAMES, noteNameToMidi, midiToNoteName, CHORD_INTERVALS } from './audio/constants';
import type { NoteName, InstrumentType, ChordQuality, ArpPattern, ArpRate } from './audio/types';

// ---- Constants ----
const CHORD_LABELS: Record<ChordQuality, string> = {
  major: 'Major', minor: 'Minor', diminished: 'Dim', augmented: 'Aug',
  dom7: 'Dom7', maj7: 'Maj7', min7: 'Min7', dim7: 'Dim7',
  sus2: 'Sus2', sus4: 'Sus4',
};

const PATTERN_LABELS: Record<ArpPattern, string> = {
  up: 'Up', down: 'Down', 'up-down': 'Up-Down', 'down-up': 'Down-Up', random: 'Random',
};

const RATE_OPTIONS: ArpRate[] = ['1/4', '1/8', '1/16', '1/32'];
const INSTRUMENT_OPTIONS: InstrumentType[] = ['piano', 'guitar', 'synth', 'bass', 'strings'];
const HISTORY_LENGTH = 24;

const NOTE_COLORS: Record<string, string> = {
  'C': '#ef4444', 'C#': '#f97316', 'D': '#eab308', 'D#': '#84cc16',
  'E': '#22c55e', 'F': '#14b8a6', 'F#': '#06b6d4', 'G': '#3b82f6',
  'G#': '#6366f1', 'A': '#8b5cf6', 'A#': '#a855f7', 'B': '#ec4899',
};

// Preset tunes
interface ArpPreset {
  name: string;
  rootNote: NoteName;
  chordQuality: ChordQuality;
  pattern: ArpPattern;
  rate: ArpRate;
  octave: number;
  octaveRange: number;
  gate: number;
  bpm: number;
  instrument: InstrumentType;
}

const PRESET_TUNES: ArpPreset[] = [
  { name: 'Classic Pop', rootNote: 'C', chordQuality: 'major', pattern: 'up', rate: '1/8', octave: 3, octaveRange: 2, gate: 75, bpm: 120, instrument: 'piano' },
  { name: 'Dreamy Synth', rootNote: 'A', chordQuality: 'min7', pattern: 'up-down', rate: '1/16', octave: 3, octaveRange: 3, gate: 60, bpm: 90, instrument: 'synth' },
  { name: 'Dark Minor', rootNote: 'E', chordQuality: 'minor', pattern: 'down', rate: '1/8', octave: 2, octaveRange: 2, gate: 85, bpm: 100, instrument: 'strings' },
  { name: 'Funky Bass', rootNote: 'G', chordQuality: 'dom7', pattern: 'random', rate: '1/16', octave: 1, octaveRange: 2, gate: 50, bpm: 110, instrument: 'bass' },
  { name: 'Guitar Ballad', rootNote: 'D', chordQuality: 'sus2', pattern: 'up-down', rate: '1/8', octave: 3, octaveRange: 2, gate: 90, bpm: 80, instrument: 'guitar' },
  { name: 'Trance Lead', rootNote: 'F', chordQuality: 'minor', pattern: 'up', rate: '1/16', octave: 4, octaveRange: 2, gate: 40, bpm: 140, instrument: 'synth' },
  { name: 'Jazz Voicing', rootNote: 'B', chordQuality: 'maj7', pattern: 'down-up', rate: '1/8', octave: 3, octaveRange: 2, gate: 70, bpm: 95, instrument: 'piano' },
  { name: 'Ambient Pad', rootNote: 'F#', chordQuality: 'sus4', pattern: 'up-down', rate: '1/4', octave: 3, octaveRange: 3, gate: 95, bpm: 70, instrument: 'strings' },
  { name: 'Fast Staccato', rootNote: 'A', chordQuality: 'minor', pattern: 'up', rate: '1/32', octave: 4, octaveRange: 1, gate: 25, bpm: 130, instrument: 'synth' },
  { name: 'Diminished Run', rootNote: 'C#', chordQuality: 'dim7', pattern: 'up-down', rate: '1/16', octave: 3, octaveRange: 2, gate: 55, bpm: 115, instrument: 'piano' },
  { name: 'Power Chords', rootNote: 'E', chordQuality: 'sus4', pattern: 'down', rate: '1/8', octave: 2, octaveRange: 2, gate: 80, bpm: 150, instrument: 'guitar' },
  { name: 'Lo-Fi Chill', rootNote: 'G', chordQuality: 'min7', pattern: 'random', rate: '1/8', octave: 3, octaveRange: 2, gate: 65, bpm: 75, instrument: 'piano' },
];

// Scheduler constants (lookahead pattern)
const SCHEDULE_AHEAD = 0.1;   // seconds to schedule ahead
const LOOKAHEAD_MS = 25;      // how often to call scheduler (ms)

// ---- Helpers ----
function rateToBeats(rate: ArpRate): number {
  switch (rate) {
    case '1/4':  return 1;
    case '1/8':  return 0.5;
    case '1/16': return 0.25;
    case '1/32': return 0.125;
  }
}

function buildNotePool(rootNote: NoteName, quality: ChordQuality, baseOctave: number, octaveRange: number): number[] {
  const rootMidi = noteNameToMidi(rootNote, baseOctave);
  const intervals = CHORD_INTERVALS[quality];
  const pool: number[] = [];
  for (let oct = 0; oct < octaveRange; oct++) {
    for (const interval of intervals) {
      pool.push(rootMidi + interval + oct * 12);
    }
  }
  return pool;
}

function buildSequence(pool: number[], pattern: ArpPattern): number[] {
  if (pool.length === 0) return [];
  const sorted = [...pool].sort((a, b) => a - b);

  switch (pattern) {
    case 'up':
      return sorted;
    case 'down':
      return [...sorted].reverse();
    case 'up-down': {
      if (sorted.length <= 1) return sorted;
      const desc = [...sorted].reverse().slice(1, -1);
      return [...sorted, ...desc];
    }
    case 'down-up': {
      if (sorted.length <= 1) return sorted;
      const reversed = [...sorted].reverse();
      const asc = [...sorted].slice(1, -1);
      return [...reversed, ...asc];
    }
    case 'random':
      return sorted; // random handled at play time
  }
}

// ---- Component ----
export function Arpeggiator() {
  const [rootNote, setRootNote] = useState<NoteName>('C');
  const [chordQuality, setChordQuality] = useState<ChordQuality>('major');
  const [octave, setOctave] = useState(3);
  const [pattern, setPattern] = useState<ArpPattern>('up');
  const [rate, setRate] = useState<ArpRate>('1/8');
  const [octaveRange, setOctaveRange] = useState(2);
  const [gate, setGate] = useState(80);
  const [bpm, setBpm] = useState(120);
  const [instrument, setInstrument] = useState<InstrumentType>('synth');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentNoteIdx, setCurrentNoteIdx] = useState(-1);
  const [noteHistory, setNoteHistory] = useState<{ midi: number; name: string }[]>([]);
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());

  // Refs for the scheduler to read latest values without re-renders
  const schedulerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextNoteTimeRef = useRef(0);
  const seqIndexRef = useRef(0);
  const isPlayingRef = useRef(false);

  const paramsRef = useRef({ rootNote, chordQuality, octave, pattern, rate, octaveRange, gate, bpm, instrument });
  paramsRef.current = { rootNote, chordQuality, octave, pattern, rate, octaveRange, gate, bpm, instrument };

  // Build the note pool and display chord info
  const chordNotes = useMemo(() => {
    const intervals = CHORD_INTERVALS[chordQuality];
    const rootIdx = NOTE_NAMES.indexOf(rootNote);
    return intervals.map(i => NOTE_NAMES[(rootIdx + i) % 12]);
  }, [rootNote, chordQuality]);

  const notePool = useMemo(
    () => buildNotePool(rootNote, chordQuality, octave, octaveRange),
    [rootNote, chordQuality, octave, octaveRange]
  );

  const sequence = useMemo(
    () => buildSequence(notePool, pattern),
    [notePool, pattern]
  );

  // Reset sequence index when sequence changes
  useEffect(() => {
    seqIndexRef.current = 0;
  }, [sequence]);

  // ---- Scheduler ----
  const scheduleNote = useCallback((midi: number, time: number) => {
    const p = paramsRef.current;
    const ctx = getAudioContext();
    const dest = getMasterGain();
    const beatDur = 60 / p.bpm;
    const stepDur = beatDur * rateToBeats(p.rate);
    const noteDur = stepDur * (p.gate / 100);

    playNote(ctx, dest, p.instrument, midi, 100, time, noteDur);

    const info = midiToNoteName(midi);
    const label = `${info.name}${info.octave}`;

    // Update UI state (debounced to animation frame)
    setTimeout(() => {
      setNoteHistory(prev => {
        const next = [...prev, { midi, name: label }];
        return next.length > HISTORY_LENGTH ? next.slice(-HISTORY_LENGTH) : next;
      });
      setActiveNotes(new Set([midi % 12]));
    }, Math.max(0, (time - ctx.currentTime) * 1000));
  }, []);

  const scheduler = useCallback(() => {
    const p = paramsRef.current;
    const ctx = getAudioContext();
    const beatDur = 60 / p.bpm;
    const stepDur = beatDur * rateToBeats(p.rate);

    while (nextNoteTimeRef.current < ctx.currentTime + SCHEDULE_AHEAD) {
      const seq = buildSequence(
        buildNotePool(p.rootNote, p.chordQuality, p.octave, p.octaveRange),
        p.pattern
      );

      if (seq.length === 0) break;

      let midi: number;
      if (p.pattern === 'random') {
        midi = seq[Math.floor(Math.random() * seq.length)];
      } else {
        const idx = seqIndexRef.current % seq.length;
        midi = seq[idx];
        setCurrentNoteIdx(idx);
      }

      scheduleNote(midi, nextNoteTimeRef.current);
      seqIndexRef.current++;
      nextNoteTimeRef.current += stepDur;
    }
  }, [scheduleNote]);

  const startPlayback = useCallback(() => {
    const ctx = getAudioContext();
    nextNoteTimeRef.current = ctx.currentTime + 0.05;
    seqIndexRef.current = 0;
    isPlayingRef.current = true;
    setIsPlaying(true);
    setNoteHistory([]);
    setCurrentNoteIdx(-1);

    schedulerRef.current = setInterval(scheduler, LOOKAHEAD_MS);
  }, [scheduler]);

  const stopPlayback = useCallback(() => {
    if (schedulerRef.current) {
      clearInterval(schedulerRef.current);
      schedulerRef.current = null;
    }
    isPlayingRef.current = false;
    setIsPlaying(false);
    setCurrentNoteIdx(-1);
    setActiveNotes(new Set());
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (schedulerRef.current) clearInterval(schedulerRef.current);
    };
  }, []);

  const loadPreset = useCallback((preset: ArpPreset) => {
    if (isPlaying) stopPlayback();
    setRootNote(preset.rootNote);
    setChordQuality(preset.chordQuality);
    setPattern(preset.pattern);
    setRate(preset.rate);
    setOctave(preset.octave);
    setOctaveRange(preset.octaveRange);
    setGate(preset.gate);
    setBpm(preset.bpm);
    setInstrument(preset.instrument);
    setNoteHistory([]);
  }, [isPlaying, stopPlayback]);

  // ---- Select helper ----
  const Select = ({ label, value, onChange, options }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
  }) => (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-neutral-500 uppercase tracking-wide">{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-neutral-800 text-neutral-200 text-xs rounded px-2 py-1.5 border border-neutral-700 focus:outline-none focus:border-indigo-500 min-w-[80px]"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  // ---- Mini keyboard ----
  const pianoKeys = useMemo(() => {
    const keys: { note: NoteName; isBlack: boolean; idx: number }[] = [];
    NOTE_NAMES.forEach((n, i) => {
      keys.push({ note: n, isBlack: n.includes('#'), idx: i });
    });
    return keys;
  }, []);

  const chordPitchClasses = useMemo(() => {
    const intervals = CHORD_INTERVALS[chordQuality];
    const rootIdx = NOTE_NAMES.indexOf(rootNote);
    return new Set(intervals.map(i => (rootIdx + i) % 12));
  }, [rootNote, chordQuality]);

  return (
    <div className="flex flex-col h-full bg-neutral-950 rounded-xl overflow-hidden text-neutral-200">
      {/* Controls Row 1: Chord + Pattern */}
      <div className="flex flex-wrap items-end gap-3 px-4 py-3 bg-neutral-900 border-b border-neutral-800">
        {/* Preset selector */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-neutral-500 uppercase tracking-wide">Preset</span>
          <select
            onChange={e => { if (e.target.value !== '') { loadPreset(PRESET_TUNES[Number(e.target.value)]); e.target.value = ''; } }}
            className="bg-neutral-800 text-neutral-200 text-xs rounded px-2 py-1.5 border border-neutral-700 focus:outline-none focus:border-indigo-500 min-w-[110px]"
            defaultValue=""
          >
            <option value="" disabled>Select preset...</option>
            {PRESET_TUNES.map((p, i) => <option key={i} value={i}>{p.name}</option>)}
          </select>
        </div>

        <div className="w-px h-8 bg-neutral-700 mx-1" />

        <Select
          label="Root"
          value={rootNote}
          onChange={v => setRootNote(v as NoteName)}
          options={NOTE_NAMES.map(n => ({ value: n, label: n }))}
        />
        <Select
          label="Chord"
          value={chordQuality}
          onChange={v => setChordQuality(v as ChordQuality)}
          options={(Object.keys(CHORD_LABELS) as ChordQuality[]).map(q => ({ value: q, label: CHORD_LABELS[q] }))}
        />
        <Select
          label="Octave"
          value={String(octave)}
          onChange={v => setOctave(Number(v))}
          options={[2, 3, 4, 5].map(o => ({ value: String(o), label: String(o) }))}
        />

        <div className="w-px h-8 bg-neutral-700 mx-1" />

        <Select
          label="Pattern"
          value={pattern}
          onChange={v => setPattern(v as ArpPattern)}
          options={(Object.keys(PATTERN_LABELS) as ArpPattern[]).map(p => ({ value: p, label: PATTERN_LABELS[p] }))}
        />
        <Select
          label="Rate"
          value={rate}
          onChange={v => setRate(v as ArpRate)}
          options={RATE_OPTIONS.map(r => ({ value: r, label: r }))}
        />
        <Select
          label="Oct Range"
          value={String(octaveRange)}
          onChange={v => setOctaveRange(Number(v))}
          options={[1, 2, 3, 4].map(o => ({ value: String(o), label: `${o} oct` }))}
        />
        <Select
          label="Instrument"
          value={instrument}
          onChange={v => setInstrument(v as InstrumentType)}
          options={INSTRUMENT_OPTIONS.map(i => ({ value: i, label: i.charAt(0).toUpperCase() + i.slice(1) }))}
        />
      </div>

      {/* Controls Row 2: Sliders + Play */}
      <div className="flex flex-wrap items-center gap-5 px-4 py-2.5 bg-neutral-900/60 border-b border-neutral-800">
        {/* BPM */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-neutral-500 uppercase tracking-wide w-8">BPM</span>
          <input
            type="range" min={60} max={200} step={1} value={bpm}
            onChange={e => setBpm(Number(e.target.value))}
            className="w-28 h-1 accent-indigo-500"
          />
          <span className="text-xs text-neutral-300 font-mono w-8 text-right">{bpm}</span>
        </div>

        {/* Gate */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-neutral-500 uppercase tracking-wide w-8">Gate</span>
          <input
            type="range" min={5} max={100} step={1} value={gate}
            onChange={e => setGate(Number(e.target.value))}
            className="w-24 h-1 accent-emerald-500"
          />
          <span className="text-xs text-neutral-300 font-mono w-8 text-right">{gate}%</span>
        </div>

        {/* Chord display */}
        <div className="flex items-center gap-1.5 ml-auto mr-4">
          <span className="text-[10px] text-neutral-500 uppercase tracking-wide">Chord:</span>
          {chordNotes.map((n, i) => (
            <span
              key={i}
              className="text-xs font-mono px-1.5 py-0.5 rounded"
              style={{ backgroundColor: NOTE_COLORS[n] + '30', color: NOTE_COLORS[n] }}
            >
              {n}
            </span>
          ))}
        </div>

        {/* Play / Stop */}
        <button
          onClick={isPlaying ? stopPlayback : startPlayback}
          className={`px-5 py-1.5 rounded-md text-sm font-semibold transition-colors ${
            isPlaying
              ? 'bg-red-600 hover:bg-red-500 text-white'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          }`}
        >
          {isPlaying ? 'Stop' : 'Play'}
        </button>
      </div>

      {/* Visual note history strip */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pt-3 pb-1">
          <span className="text-[10px] text-neutral-500 uppercase tracking-wide">Arpeggio Sequence</span>
        </div>
        <div className="flex-1 px-4 pb-2 min-h-0 overflow-hidden">
          <div className="flex items-end gap-1 h-full">
            {noteHistory.length === 0 && (
              <div className="flex items-center justify-center w-full h-full">
                <span className="text-neutral-600 text-sm">Press Play to start the arpeggiator</span>
              </div>
            )}
            {noteHistory.map((note, i) => {
              const info = midiToNoteName(note.midi);
              const color = NOTE_COLORS[info.name] || '#6366f1';
              const isLatest = i === noteHistory.length - 1;
              // Height varies by pitch for visual interest
              const minMidi = notePool.length > 0 ? Math.min(...notePool) : 48;
              const maxMidi = notePool.length > 0 ? Math.max(...notePool) : 84;
              const range = Math.max(maxMidi - minMidi, 1);
              const heightPct = 30 + ((note.midi - minMidi) / range) * 65;

              return (
                <div
                  key={i}
                  className={`flex flex-col items-center justify-end rounded-md transition-all duration-150 ${
                    isLatest ? 'ring-2 ring-white/40 scale-105' : 'opacity-70'
                  }`}
                  style={{
                    backgroundColor: color + (isLatest ? '90' : '50'),
                    width: `${100 / HISTORY_LENGTH}%`,
                    height: `${heightPct}%`,
                    minWidth: '24px',
                    maxWidth: '48px',
                  }}
                >
                  <span
                    className="text-[10px] font-mono font-bold pb-1 select-none"
                    style={{ color: isLatest ? '#fff' : color }}
                  >
                    {note.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mini keyboard */}
      <div className="px-4 py-3 bg-neutral-900/40 border-t border-neutral-800">
        <div className="flex items-center gap-0.5 justify-center">
          {pianoKeys.map(key => {
            const isInChord = chordPitchClasses.has(key.idx);
            const isActive = activeNotes.has(key.idx);
            const color = NOTE_COLORS[key.note];

            if (key.isBlack) {
              return (
                <div
                  key={key.note}
                  className={`relative rounded-b-sm transition-all duration-100 -mx-1.5 z-10 flex items-end justify-center ${
                    isActive ? 'shadow-lg shadow-indigo-500/40' : ''
                  }`}
                  style={{
                    width: '20px',
                    height: '40px',
                    backgroundColor: isActive ? color : isInChord ? '#374151' : '#1f2937',
                    border: isInChord ? `1px solid ${color}60` : '1px solid #374151',
                  }}
                >
                  <span className="text-[7px] text-neutral-400 pb-0.5 select-none">{key.note}</span>
                </div>
              );
            }

            return (
              <div
                key={key.note}
                className={`rounded-b-sm transition-all duration-100 flex items-end justify-center ${
                  isActive ? 'shadow-lg' : ''
                }`}
                style={{
                  width: '28px',
                  height: '52px',
                  backgroundColor: isActive ? color : isInChord ? '#d1d5db' : '#e5e7eb',
                  border: isInChord ? `2px solid ${color}` : '1px solid #9ca3af',
                }}
              >
                <span className={`text-[9px] pb-1 font-medium select-none ${
                  isActive ? 'text-white' : isInChord ? 'text-neutral-800' : 'text-neutral-500'
                }`}>
                  {key.note}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-center mt-1.5">
          <span className="text-[10px] text-neutral-600">
            {sequence.length} notes in sequence &middot; {notePool.length} in pool &middot;{' '}
            {(60 / bpm / rateToBeats(rate) ).toFixed(1)} notes/sec
          </span>
        </div>
      </div>
    </div>
  );
}
