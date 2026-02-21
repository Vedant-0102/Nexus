import React, { useState, useCallback } from 'react';
import { getAudioContext, getMasterGain } from './audio/AudioEngine';
import { playNote } from './audio/synthesis';
import { NOTE_NAMES, SCALES, getScaleNotes, getDiatonicChords, noteNameToMidi, getChordNotes } from './audio/constants';
import type { NoteName, ScaleType, ChordQuality, InstrumentType } from './audio/types';

const INTERVAL_NAMES: Record<number, string> = {
  0: 'Unison', 1: 'Minor 2nd', 2: 'Major 2nd', 3: 'Minor 3rd',
  4: 'Major 3rd', 5: 'Perfect 4th', 6: 'Tritone', 7: 'Perfect 5th',
  8: 'Minor 6th', 9: 'Major 6th', 10: 'Minor 7th', 11: 'Major 7th',
};

const CIRCLE_OF_FIFTHS: NoteName[] = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'F'];
const RELATIVE_MINORS: NoteName[] = ['A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'F', 'C', 'G', 'D'];

const SCALE_DESCRIPTIONS: Partial<Record<ScaleType, string>> = {
  'major': 'Bright, happy. The most common scale in Western music.',
  'natural-minor': 'Dark, sad. The relative minor of the major scale.',
  'harmonic-minor': 'Exotic, dramatic. Raised 7th gives a leading tone.',
  'melodic-minor': 'Jazz minor. Raised 6th and 7th ascending.',
  'dorian': 'Minor with a bright 6th. Common in jazz and rock.',
  'phrygian': 'Dark, Spanish/flamenco character. Flat 2nd is distinctive.',
  'lydian': 'Dreamy, ethereal. Raised 4th creates a floating quality.',
  'mixolydian': 'Dominant, bluesy. Major with a flat 7th.',
  'pentatonic-major': 'Simple, universal. Five notes, no dissonance.',
  'pentatonic-minor': 'Bluesy, rock. Foundation of blues and rock soloing.',
  'blues': 'Soulful. Pentatonic minor with added blue note (b5).',
  'chromatic': 'All 12 notes. Used for chromaticism and color.',
};

const ROMAN_MAJOR = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
const ROMAN_MINOR = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];

const SCALE_TYPE_LABELS: Record<ScaleType, string> = {
  'major': 'Major (Ionian)',
  'natural-minor': 'Natural Minor (Aeolian)',
  'harmonic-minor': 'Harmonic Minor',
  'melodic-minor': 'Melodic Minor',
  'dorian': 'Dorian',
  'phrygian': 'Phrygian',
  'lydian': 'Lydian',
  'mixolydian': 'Mixolydian',
  'pentatonic-major': 'Pentatonic Major',
  'pentatonic-minor': 'Pentatonic Minor',
  'blues': 'Blues',
  'chromatic': 'Chromatic',
};

function isBlackKey(noteIdx: number): boolean {
  return [1, 3, 6, 8, 10].includes(noteIdx);
}

export function MusicTheoryHelper() {
  const [rootNote, setRootNote] = useState<NoteName>('C');
  const [scaleType, setScaleType] = useState<ScaleType>('major');
  const [instrument, setInstrument] = useState<InstrumentType>('piano');

  const scaleNotes = getScaleNotes(rootNote, scaleType);
  const scaleIntervals = SCALES[scaleType];

  const playNoteSound = useCallback((note: NoteName, octave = 4) => {
    const ctx = getAudioContext();
    const midi = noteNameToMidi(note, octave);
    playNote(ctx, getMasterGain(), instrument, midi, 100, undefined, 0.5);
  }, [instrument]);

  const playScale = useCallback(() => {
    const ctx = getAudioContext();
    const dest = getMasterGain();
    scaleNotes.forEach((note, i) => {
      const midi = noteNameToMidi(note, 4);
      const adjustedMidi = midi < noteNameToMidi(rootNote, 4) ? midi + 12 : midi;
      playNote(ctx, dest, instrument, adjustedMidi, 100, ctx.currentTime + i * 0.3, 0.25);
    });
    // Play octave
    playNote(ctx, dest, instrument, noteNameToMidi(rootNote, 5), 100, ctx.currentTime + scaleNotes.length * 0.3, 0.5);
  }, [rootNote, scaleNotes, instrument]);

  const playChordSound = useCallback((root: NoteName, quality: ChordQuality) => {
    const ctx = getAudioContext();
    const dest = getMasterGain();
    const notes = getChordNotes(root, quality);
    notes.forEach((note, i) => {
      const midi = noteNameToMidi(note, 4);
      const adjusted = i > 0 && midi <= noteNameToMidi(root, 4) ? midi + 12 : midi;
      playNote(ctx, dest, instrument, adjusted, 100, undefined, 0.8);
    });
  }, [instrument]);

  // Get diatonic chords for major/minor
  const showDiatonicChords = scaleType === 'major' || scaleType === 'natural-minor';
  const diatonicChords = showDiatonicChords ? getDiatonicChords(rootNote, scaleType) : [];
  const romanNumerals = scaleType === 'major' ? ROMAN_MAJOR : ROMAN_MINOR;

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white p-4 overflow-auto">
      {/* Top Bar: Key & Scale Selection */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Root:</label>
          <select value={rootNote} onChange={e => setRootNote(e.target.value as NoteName)} className="bg-gray-700 text-sm rounded px-2 py-1 text-white">
            {NOTE_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Scale:</label>
          <select value={scaleType} onChange={e => setScaleType(e.target.value as ScaleType)} className="bg-gray-700 text-sm rounded px-2 py-1 text-white">
            {(Object.keys(SCALES) as ScaleType[]).map(s => <option key={s} value={s}>{SCALE_TYPE_LABELS[s]}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Sound:</label>
          <select value={instrument} onChange={e => setInstrument(e.target.value as InstrumentType)} className="bg-gray-700 text-sm rounded px-2 py-1 text-white">
            <option value="piano">Piano</option>
            <option value="guitar">Guitar</option>
            <option value="synth">Synth</option>
            <option value="bass">Bass</option>
            <option value="strings">Strings</option>
          </select>
        </div>
        <button onClick={playScale} className="px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-700">Play Scale</button>
      </div>

      {/* Scale Description */}
      {SCALE_DESCRIPTIONS[scaleType] && (
        <div className="mb-4 p-2 bg-gray-800 rounded text-sm text-gray-300">
          {SCALE_DESCRIPTIONS[scaleType]}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Visual Piano Keyboard */}
          <div>
            <div className="text-sm text-gray-400 mb-2">Notes in Scale</div>
            <div className="relative h-24 bg-gray-800 rounded-lg overflow-hidden">
              {NOTE_NAMES.map((note, i) => {
                const inScale = scaleNotes.includes(note);
                const isRoot = note === rootNote;
                const black = isBlackKey(i);

                if (black) {
                  const whitesBefore = NOTE_NAMES.slice(0, i).filter((_, j) => !isBlackKey(j)).length;
                  const whiteWidth = 100 / 7;
                  return (
                    <button
                      key={note}
                      onClick={() => playNoteSound(note)}
                      className={`absolute top-0 z-10 rounded-b text-xs flex items-end justify-center pb-1 transition-colors ${
                        isRoot ? 'bg-yellow-500 text-black' : inScale ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-600 hover:bg-gray-700'
                      }`}
                      style={{
                        left: `calc(${whitesBefore * whiteWidth}% - ${whiteWidth * 0.15}%)`,
                        width: `${whiteWidth * 0.7}%`,
                        height: '60%',
                      }}
                    >
                      {inScale ? note : ''}
                    </button>
                  );
                }

                const whiteIdx = NOTE_NAMES.slice(0, i).filter((_, j) => !isBlackKey(j)).length;
                const whiteWidth = 100 / 7;
                return (
                  <button
                    key={note}
                    onClick={() => playNoteSound(note)}
                    className={`absolute bottom-0 border-r border-gray-600 text-xs flex items-end justify-center pb-1 transition-colors ${
                      isRoot ? 'bg-yellow-400 text-black' : inScale ? 'bg-blue-400 text-black' : 'bg-gray-200 text-gray-500 hover:bg-gray-100'
                    }`}
                    style={{ left: `${whiteIdx * whiteWidth}%`, width: `${whiteWidth}%`, height: '100%' }}
                  >
                    {note}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interval Table */}
          <div>
            <div className="text-sm text-gray-400 mb-2">Intervals</div>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-750 text-gray-400">
                    <th className="px-3 py-1.5 text-left">Degree</th>
                    <th className="px-3 py-1.5 text-left">Note</th>
                    <th className="px-3 py-1.5 text-left">Interval</th>
                    <th className="px-3 py-1.5 text-right">Semitones</th>
                  </tr>
                </thead>
                <tbody>
                  {scaleIntervals.map((semitones, i) => (
                    <tr key={i} className={`border-t border-gray-700 ${i % 2 === 0 ? 'bg-gray-800' : 'bg-gray-850'} hover:bg-gray-700 cursor-pointer`}
                      onClick={() => playNoteSound(scaleNotes[i])}
                    >
                      <td className="px-3 py-1.5">{i + 1}</td>
                      <td className="px-3 py-1.5 font-mono">{scaleNotes[i]}</td>
                      <td className="px-3 py-1.5 text-gray-400">{INTERVAL_NAMES[semitones] || `${semitones} semitones`}</td>
                      <td className="px-3 py-1.5 text-right text-gray-500">{semitones}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Circle of Fifths */}
          <div>
            <div className="text-sm text-gray-400 mb-2">Circle of Fifths</div>
            <div className="bg-gray-800 rounded-lg p-4 flex justify-center">
              <svg viewBox="-130 -130 260 260" className="w-full max-w-[280px]">
                {CIRCLE_OF_FIFTHS.map((note, i) => {
                  const angle = (i * 30 - 90) * (Math.PI / 180);
                  const outerR = 110;
                  const innerR = 70;
                  const x = Math.cos(angle) * outerR;
                  const y = Math.sin(angle) * outerR;
                  const ix = Math.cos(angle) * innerR;
                  const iy = Math.sin(angle) * innerR;
                  const isActive = note === rootNote;
                  const relMinor = RELATIVE_MINORS[i];
                  const isMinorActive = relMinor === rootNote && scaleType === 'natural-minor';

                  return (
                    <g key={note}>
                      {/* Outer segment marker */}
                      <circle
                        cx={x} cy={y} r={18}
                        className={`cursor-pointer transition-colors ${
                          isActive ? 'fill-blue-500' : 'fill-gray-700 hover:fill-gray-600'
                        }`}
                        onClick={() => setRootNote(note)}
                      />
                      <text
                        x={x} y={y}
                        textAnchor="middle" dominantBaseline="central"
                        className={`text-xs font-bold pointer-events-none ${isActive ? 'fill-white' : 'fill-gray-300'}`}
                      >
                        {note}
                      </text>
                      {/* Inner ring (relative minor) */}
                      <circle
                        cx={ix} cy={iy} r={14}
                        className={`cursor-pointer transition-colors ${
                          isMinorActive ? 'fill-purple-500' : 'fill-gray-800 hover:fill-gray-700'
                        }`}
                        stroke={isMinorActive ? '#a855f7' : '#374151'}
                        strokeWidth={1}
                        onClick={() => { setRootNote(relMinor); setScaleType('natural-minor'); }}
                      />
                      <text
                        x={ix} y={iy}
                        textAnchor="middle" dominantBaseline="central"
                        className={`pointer-events-none ${isMinorActive ? 'fill-white' : 'fill-gray-500'}`}
                        style={{ fontSize: '8px' }}
                      >
                        {relMinor}m
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Diatonic Chord Table */}
          {showDiatonicChords && (
            <div>
              <div className="text-sm text-gray-400 mb-2">Diatonic Chords</div>
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-750 text-gray-400">
                      <th className="px-3 py-1.5 text-left">Degree</th>
                      <th className="px-3 py-1.5 text-left">Root</th>
                      <th className="px-3 py-1.5 text-left">Quality</th>
                      <th className="px-3 py-1.5 text-left">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diatonicChords.map((chord, i) => (
                      <tr key={i}
                        className={`border-t border-gray-700 ${i % 2 === 0 ? 'bg-gray-800' : 'bg-gray-850'} hover:bg-gray-700 cursor-pointer`}
                        onClick={() => playChordSound(chord.root, chord.quality)}
                      >
                        <td className="px-3 py-1.5 font-bold">{romanNumerals[i]}</td>
                        <td className="px-3 py-1.5 font-mono">{chord.root}</td>
                        <td className="px-3 py-1.5 text-gray-400">{chord.quality}</td>
                        <td className="px-3 py-1.5 text-gray-500 font-mono text-xs">
                          {getChordNotes(chord.root, chord.quality).join(' ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
