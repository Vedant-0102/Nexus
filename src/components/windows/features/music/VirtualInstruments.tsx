import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getAudioContext, getMasterGain } from './audio/AudioEngine';
import { playNote, playSynth, playDrumHit } from './audio/synthesis';
import { NOTE_NAMES, PIANO_KEY_MAP, DRUM_NAMES, midiToFrequency, midiToNoteName } from './audio/constants';
import type { InstrumentType, OscType, NoteName } from './audio/types';

type Tab = 'piano' | 'guitar' | 'drums' | 'synth' | 'bass' | 'strings';

const TABS: { id: Tab; label: string; color: string }[] = [
  { id: 'piano', label: 'Piano', color: 'bg-blue-500' },
  { id: 'guitar', label: 'Guitar', color: 'bg-amber-500' },
  { id: 'drums', label: 'Drums', color: 'bg-red-500' },
  { id: 'synth', label: 'Synth', color: 'bg-purple-500' },
  { id: 'bass', label: 'Bass', color: 'bg-green-500' },
  { id: 'strings', label: 'Strings', color: 'bg-pink-500' },
];

const GUITAR_STRINGS = [
  { name: 'e', baseMidi: 64, color: '#ef4444' },
  { name: 'B', baseMidi: 59, color: '#f59e0b' },
  { name: 'G', baseMidi: 55, color: '#22c55e' },
  { name: 'D', baseMidi: 50, color: '#3b82f6' },
  { name: 'A', baseMidi: 45, color: '#8b5cf6' },
  { name: 'E', baseMidi: 40, color: '#ec4899' },
];

const FRET_MARKERS = [3, 5, 7, 9, 12, 15];
const FRET_COUNT = 15;

const GUITAR_CHORDS: Record<string, { name: string; frets: (number | null)[] }[]> = {
  'Open': [
    { name: 'C', frets: [null, 3, 2, 0, 1, 0] },
    { name: 'G', frets: [3, 2, 0, 0, 0, 3] },
    { name: 'D', frets: [null, null, 0, 2, 3, 2] },
    { name: 'Am', frets: [null, 0, 2, 2, 1, 0] },
    { name: 'Em', frets: [0, 2, 2, 0, 0, 0] },
    { name: 'A', frets: [null, 0, 2, 2, 2, 0] },
    { name: 'E', frets: [0, 2, 2, 1, 0, 0] },
    { name: 'F', frets: [1, 3, 3, 2, 1, 1] },
  ],
};

const DRUM_KEYS: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7 };

const DRUM_COLORS = [
  'from-red-600 to-red-700', 'from-orange-500 to-orange-600',
  'from-yellow-500 to-yellow-600', 'from-green-500 to-green-600',
  'from-teal-500 to-teal-600', 'from-blue-500 to-blue-600',
  'from-indigo-500 to-indigo-600', 'from-purple-500 to-purple-600',
];
const DRUM_ICONS = ['KCK', 'SNR', 'HH', 'OH', 'TL', 'TM', 'CLP', 'RDE'];

function isBlackKey(noteIdx: number): boolean {
  return [1, 3, 6, 8, 10].includes(noteIdx % 12);
}

function Keyboard({ instrument, baseOctave, octaveCount, volume, synthOsc, synthFilter }: {
  instrument: InstrumentType;
  baseOctave: number;
  octaveCount: number;
  volume: number;
  synthOsc?: OscType;
  synthFilter?: number;
}) {
  const [activeKeys, setActiveKeys] = useState<Set<number>>(new Set());
  const activeRef = useRef<Set<number>>(new Set());

  const triggerNote = useCallback((midi: number) => {
    const ctx = getAudioContext();
    const dest = getMasterGain();
    if (instrument === 'synth' && synthOsc) {
      playSynth(ctx, dest, midi, volume * 127, ctx.currentTime, 0.5, synthOsc, synthFilter ?? 2000);
    } else {
      playNote(ctx, dest, instrument, midi, Math.round(volume * 127), undefined, 0.5);
    }
    activeRef.current.add(midi);
    setActiveKeys(new Set(activeRef.current));
    setTimeout(() => {
      activeRef.current.delete(midi);
      setActiveKeys(new Set(activeRef.current));
    }, 200);
  }, [instrument, volume, synthOsc, synthFilter]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();
      const baseMidi = PIANO_KEY_MAP[key];
      if (baseMidi !== undefined) {
        const offset = (baseOctave - 3) * 12;
        triggerNote(baseMidi + offset);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [baseOctave, triggerNote]);

  const startMidi = baseOctave * 12 + 12;
  const totalKeys = octaveCount * 12 + 1;
  const whites: { midi: number; idx: number }[] = [];
  const blacks: { midi: number; leftPos: number }[] = [];

  let whiteIdx = 0;
  for (let i = 0; i < totalKeys; i++) {
    const midi = startMidi + i;
    if (isBlackKey(i)) {
      blacks.push({ midi, leftPos: whiteIdx });
    } else {
      whites.push({ midi, idx: whiteIdx });
      whiteIdx++;
    }
  }

  const whiteWidth = 100 / whites.length;

  return (
    <div className="relative w-full" style={{ height: instrument === 'bass' ? 180 : 160 }}>
      {whites.map(({ midi, idx }) => {
        const { name, octave } = midiToNoteName(midi);
        const active = activeKeys.has(midi);
        return (
          <button
            key={midi}
            className={`absolute bottom-0 border border-gray-600 rounded-b-md transition-colors duration-75 text-xs flex items-end justify-center pb-1 ${
              active ? 'bg-blue-400 text-gray-900' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
            style={{ left: `${idx * whiteWidth}%`, width: `${whiteWidth}%`, height: '100%' }}
            onMouseDown={() => triggerNote(midi)}
          >
            {name === 'C' ? `C${octave}` : ''}
          </button>
        );
      })}
      {blacks.map(({ midi, leftPos }) => {
        const active = activeKeys.has(midi);
        return (
          <button
            key={midi}
            className={`absolute top-0 z-10 rounded-b-md transition-colors duration-75 ${
              active ? 'bg-blue-500' : 'bg-gray-900 hover:bg-gray-700'
            }`}
            style={{
              left: `calc(${leftPos * whiteWidth}% + ${whiteWidth * 0.65}%)`,
              width: `${whiteWidth * 0.7}%`,
              height: '60%',
            }}
            onMouseDown={() => triggerNote(midi)}
          />
        );
      })}
    </div>
  );
}

function PianoTab() {
  const [octave, setOctave] = useState(3);
  const [volume, setVolume] = useState(0.8);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="text-sm text-gray-400">Octave:</label>
        <button onClick={() => setOctave(Math.max(1, octave - 1))} className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 text-sm">-</button>
        <span className="text-sm font-mono w-6 text-center">{octave}</span>
        <button onClick={() => setOctave(Math.min(6, octave + 1))} className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 text-sm">+</button>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm text-gray-400">Volume:</label>
          <input type="range" min={0} max={100} value={volume * 100} onChange={e => setVolume(Number(e.target.value) / 100)} className="w-24 accent-blue-500" />
        </div>
      </div>
      <div className="text-xs text-gray-500 mb-1">Keyboard: Z-M = lower octave, Q-U = upper octave</div>
      <Keyboard instrument="piano" baseOctave={octave} octaveCount={2} volume={volume} />
    </div>
  );
}

function GuitarTab() {
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [volume, setVolume] = useState(0.8);

  const playFret = useCallback((stringIdx: number, fret: number) => {
    const midi = GUITAR_STRINGS[stringIdx].baseMidi + fret;
    const ctx = getAudioContext();
    playNote(ctx, getMasterGain(), 'guitar', midi, Math.round(volume * 127));
    const key = `${stringIdx}-${fret}`;
    setActiveNotes(prev => new Set(prev).add(key));
    setTimeout(() => setActiveNotes(prev => { const n = new Set(prev); n.delete(key); return n; }), 300);
  }, [volume]);

  const strumChord = useCallback((chord: { frets: (number | null)[] }) => {
    const ctx = getAudioContext();
    chord.frets.forEach((fret, si) => {
      if (fret === null) return;
      const midi = GUITAR_STRINGS[si].baseMidi + fret;
      const delay = si * 0.03;
      playNote(ctx, getMasterGain(), 'guitar', midi, Math.round(volume * 127), ctx.currentTime + delay, 1.5);
      const key = `${si}-${fret}`;
      setTimeout(() => {
        setActiveNotes(prev => new Set(prev).add(key));
        setTimeout(() => setActiveNotes(prev => { const n = new Set(prev); n.delete(key); return n; }), 400);
      }, delay * 1000);
    });
  }, [volume]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 mb-1">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Volume:</label>
          <input type="range" min={0} max={100} value={volume * 100} onChange={e => setVolume(Number(e.target.value) / 100)} className="w-24 accent-amber-500" />
        </div>
        <div className="ml-auto text-xs text-gray-500">Click frets to play, or use chord buttons below</div>
      </div>

      {/* Fretboard */}
      <div className="bg-gradient-to-b from-amber-950 to-amber-900 rounded-lg p-2 overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Fret numbers and markers */}
          <div className="flex" style={{ marginLeft: 40 }}>
            {Array.from({ length: FRET_COUNT }, (_, i) => (
              <div key={i} className="flex flex-col items-center" style={{ width: 48 }}>
                <span className="text-[10px] text-amber-600/60">{i + 1}</span>
                {FRET_MARKERS.includes(i + 1) && (
                  <div className={`w-2 h-2 rounded-full ${i + 1 === 12 ? 'bg-amber-400' : 'bg-amber-700'} mt-0.5`} />
                )}
              </div>
            ))}
          </div>

          {/* Strings */}
          {GUITAR_STRINGS.map((str, si) => (
            <div key={si} className="flex items-center h-7">
              {/* String label */}
              <div className="w-10 text-center text-sm font-mono font-bold shrink-0" style={{ color: str.color }}>
                {str.name}
              </div>
              {/* Nut */}
              <div className="w-1 h-full bg-gray-300 shrink-0" />
              {/* Frets */}
              {Array.from({ length: FRET_COUNT }, (_, fret) => {
                const key = `${si}-${fret + 1}`;
                const active = activeNotes.has(key);
                const midi = str.baseMidi + fret + 1;
                const { name } = midiToNoteName(midi);
                return (
                  <button
                    key={fret}
                    onClick={() => playFret(si, fret + 1)}
                    className="relative h-full border-r border-amber-800/60 flex items-center justify-center transition-colors"
                    style={{ width: 48, background: active ? str.color + '40' : 'transparent' }}
                  >
                    {/* String line */}
                    <div
                      className="absolute left-0 right-0 top-1/2 -translate-y-1/2"
                      style={{ height: 2 - si * 0.15, background: active ? str.color : '#92764070', borderRadius: 1 }}
                    />
                    {/* Finger dot when active */}
                    {active && (
                      <div className="relative z-10 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                        style={{ background: str.color }}>
                        {name}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Chord Buttons */}
      <div>
        <div className="text-xs text-gray-500 mb-1.5">Quick Chords - click to strum</div>
        <div className="flex flex-wrap gap-2">
          {GUITAR_CHORDS['Open'].map(chord => (
            <button
              key={chord.name}
              onClick={() => strumChord(chord)}
              className="px-3 py-1.5 bg-amber-900/50 border border-amber-700/30 rounded-lg text-sm font-medium text-amber-200 hover:bg-amber-800/60 hover:border-amber-600/50 transition-colors"
            >
              {chord.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DrumsTab() {
  const [activePads, setActivePads] = useState<Set<number>>(new Set());
  const [volumes, setVolumes] = useState<number[]>(() => Array(8).fill(0.8));
  const [masterVol, setMasterVol] = useState(1.0);

  const triggerDrum = useCallback((idx: number) => {
    const ctx = getAudioContext();
    const g = ctx.createGain();
    g.gain.value = volumes[idx] * masterVol;
    g.connect(getMasterGain());
    playDrumHit(ctx, g, idx);
    setActivePads(prev => new Set(prev).add(idx));
    setTimeout(() => setActivePads(prev => { const n = new Set(prev); n.delete(idx); return n; }), 150);
  }, [volumes, masterVol]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const idx = DRUM_KEYS[e.key];
      if (idx !== undefined) triggerDrum(idx);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerDrum]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-1">
        <div className="text-xs text-gray-500">Keys: 1-8 to trigger pads</div>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm text-gray-400">Master:</label>
          <input type="range" min={0} max={150} value={masterVol * 100} onChange={e => setMasterVol(Number(e.target.value) / 100)} className="w-28 accent-red-500" />
          <span className="text-xs text-gray-500 w-8">{Math.round(masterVol * 100)}%</span>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {DRUM_NAMES.map((name, i) => (
          <button
            key={i}
            onClick={() => triggerDrum(i)}
            className={`h-24 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-75 shadow-lg border border-white/5 ${
              activePads.has(i)
                ? `bg-gradient-to-br ${DRUM_COLORS[i]} scale-95 brightness-125 shadow-xl`
                : 'bg-gray-700/80 hover:bg-gray-600/80 hover:scale-[1.02]'
            }`}
          >
            <span className="text-sm font-bold font-mono tracking-wider">{DRUM_ICONS[i]}</span>
            <span className="text-sm font-semibold">{name}</span>
            <span className="text-[10px] text-gray-400 font-mono">{i + 1}</span>
          </button>
        ))}
      </div>
      <div className="space-y-2">
        <div className="text-sm text-gray-400">Per-pad Volume</div>
        <div className="grid grid-cols-4 gap-2">
          {DRUM_NAMES.map((name, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <input
                type="range" min={0} max={100} value={volumes[i] * 100}
                onChange={e => { const v = [...volumes]; v[i] = Number(e.target.value) / 100; setVolumes(v); }}
                className="w-full accent-red-500" style={{ height: 4 }}
              />
              <span className="text-xs text-gray-500">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SynthTab() {
  const [octave, setOctave] = useState(3);
  const [volume, setVolume] = useState(0.8);
  const [oscType, setOscType] = useState<OscType>('sawtooth');
  const [filterFreq, setFilterFreq] = useState(2000);
  const [filterQ, setFilterQ] = useState(2);

  const oscTypes: OscType[] = ['sine', 'square', 'sawtooth', 'triangle'];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Oscillator:</label>
          <div className="flex gap-1">
            {oscTypes.map(t => (
              <button
                key={t}
                onClick={() => setOscType(t)}
                className={`px-3 py-1 text-xs rounded ${oscType === t ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Octave:</label>
          <button onClick={() => setOctave(Math.max(1, octave - 1))} className="px-2 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600">-</button>
          <span className="text-sm w-4 text-center">{octave}</span>
          <button onClick={() => setOctave(Math.min(6, octave + 1))} className="px-2 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600">+</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Filter Cutoff:</label>
          <input type="range" min={200} max={8000} value={filterFreq} onChange={e => setFilterFreq(Number(e.target.value))} className="w-32 accent-purple-500" />
          <span className="text-xs text-gray-500 w-14">{filterFreq} Hz</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Resonance:</label>
          <input type="range" min={0} max={20} step={0.5} value={filterQ} onChange={e => setFilterQ(Number(e.target.value))} className="w-24 accent-purple-500" />
          <span className="text-xs text-gray-500 w-8">{filterQ}</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Volume:</label>
          <input type="range" min={0} max={100} value={volume * 100} onChange={e => setVolume(Number(e.target.value) / 100)} className="w-24 accent-purple-500" />
        </div>
      </div>
      <Keyboard instrument="synth" baseOctave={octave} octaveCount={2} volume={volume} synthOsc={oscType} synthFilter={filterFreq} />
    </div>
  );
}

function BassTab() {
  const [octave, setOctave] = useState(1);
  const [volume, setVolume] = useState(0.8);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Octave:</label>
          <button onClick={() => setOctave(Math.max(0, octave - 1))} className="px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600">-</button>
          <span className="text-sm w-4 text-center">{octave}</span>
          <button onClick={() => setOctave(Math.min(3, octave + 1))} className="px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600">+</button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm text-gray-400">Volume:</label>
          <input type="range" min={0} max={100} value={volume * 100} onChange={e => setVolume(Number(e.target.value) / 100)} className="w-24 accent-green-500" />
        </div>
      </div>
      <Keyboard instrument="bass" baseOctave={octave} octaveCount={2} volume={volume} />
    </div>
  );
}

function StringsTab() {
  const [octave, setOctave] = useState(3);
  const [volume, setVolume] = useState(0.8);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Octave:</label>
          <button onClick={() => setOctave(Math.max(2, octave - 1))} className="px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600">-</button>
          <span className="text-sm w-4 text-center">{octave}</span>
          <button onClick={() => setOctave(Math.min(5, octave + 1))} className="px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600">+</button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm text-gray-400">Volume:</label>
          <input type="range" min={0} max={100} value={volume * 100} onChange={e => setVolume(Number(e.target.value) / 100)} className="w-24 accent-pink-500" />
        </div>
      </div>
      <Keyboard instrument="strings" baseOctave={octave} octaveCount={2} volume={volume} />
    </div>
  );
}

export function VirtualInstruments() {
  const [activeTab, setActiveTab] = useState<Tab>('piano');

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white p-4 overflow-auto">
      <div className="flex gap-1 mb-4 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              activeTab === tab.id ? `${tab.color} text-white` : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 bg-gray-800 rounded-lg p-4">
        {activeTab === 'piano' && <PianoTab />}
        {activeTab === 'guitar' && <GuitarTab />}
        {activeTab === 'drums' && <DrumsTab />}
        {activeTab === 'synth' && <SynthTab />}
        {activeTab === 'bass' && <BassTab />}
        {activeTab === 'strings' && <StringsTab />}
      </div>
    </div>
  );
}
