import React, { useState, useRef, useCallback, useEffect } from 'react';
import { getAudioContext, getMasterGain } from './audio/AudioEngine';
import { playNote } from './audio/synthesis';
import { NOTE_NAMES, getChordNotes, getDiatonicChords, noteNameToMidi, COMMON_PROGRESSIONS } from './audio/constants';
import type { NoteName, InstrumentType, ChordQuality, ScaleType } from './audio/types';

const ROMAN_NUMERALS_MAJOR = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
const ROMAN_NUMERALS_MINOR = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];

const QUALITY_COLORS: Record<string, string> = {
  major: 'border-blue-500 bg-blue-500/10',
  minor: 'border-purple-500 bg-purple-500/10',
  diminished: 'border-red-500 bg-red-500/10',
  augmented: 'border-yellow-500 bg-yellow-500/10',
};

interface ProgressionChord {
  degree: number;
  root: NoteName;
  quality: ChordQuality;
}

export function ChordProgressionHelper() {
  const [rootNote, setRootNote] = useState<NoteName>('C');
  const [scaleType, setScaleType] = useState<'major' | 'natural-minor'>('major');
  const [progression, setProgression] = useState<ProgressionChord[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [instrument, setInstrument] = useState<InstrumentType>('piano');
  const [currentChordIdx, setCurrentChordIdx] = useState(-1);
  const [loop, setLoop] = useState(true);
  const [hoveredChord, setHoveredChord] = useState<ProgressionChord | null>(null);
  const [selectedDegrees, setSelectedDegrees] = useState<Set<number>>(new Set());

  const timerRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);
  const progressionRef = useRef(progression);

  useEffect(() => { progressionRef.current = progression; }, [progression]);

  const diatonicChords = getDiatonicChords(rootNote, scaleType);
  const romanNumerals = scaleType === 'major' ? ROMAN_NUMERALS_MAJOR : ROMAN_NUMERALS_MINOR;

  const playChord = useCallback((chord: ProgressionChord, time?: number) => {
    const ctx = getAudioContext();
    const dest = getMasterGain();
    const notes = getChordNotes(chord.root, chord.quality);
    const t = time ?? ctx.currentTime;
    const dur = 60 / bpm;
    notes.forEach((note, i) => {
      const midi = noteNameToMidi(note, i === 0 ? 3 : (noteNameToMidi(note, 3) < noteNameToMidi(chord.root, 3) ? 4 : 3));
      playNote(ctx, dest, instrument, midi, 100, t, dur * 0.9);
    });
  }, [bpm, instrument]);

  const startPlayback = useCallback(() => {
    if (progression.length === 0) return;
    isPlayingRef.current = true;
    setIsPlaying(true);
    let idx = 0;
    const beatDuration = 60000 / bpm;

    const playStep = () => {
      if (!isPlayingRef.current) return;
      if (idx >= progressionRef.current.length) {
        if (loop) {
          idx = 0;
        } else {
          setIsPlaying(false);
          setCurrentChordIdx(-1);
          isPlayingRef.current = false;
          return;
        }
      }
      setCurrentChordIdx(idx);
      playChord(progressionRef.current[idx]);
      idx++;
      timerRef.current = window.setTimeout(playStep, beatDuration);
    };
    playStep();
  }, [progression, bpm, loop, playChord]);

  const stopPlayback = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    setCurrentChordIdx(-1);
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current !== null) clearTimeout(timerRef.current); };
  }, []);

  const addChordToProgression = (chord: { degree: number; root: NoteName; quality: ChordQuality }) => {
    setProgression(prev => [...prev, chord]);
  };

  const toggleDegree = (degree: number) => {
    setSelectedDegrees(prev => {
      const next = new Set(prev);
      if (next.has(degree)) {
        next.delete(degree);
      } else {
        next.add(degree);
      }
      return next;
    });
  };

  const playSelectedChords = useCallback(() => {
    if (selectedDegrees.size === 0) return;
    const ctx = getAudioContext();
    const dest = getMasterGain();
    selectedDegrees.forEach(deg => {
      const chord = diatonicChords.find(c => c.degree === deg);
      if (!chord) return;
      const notes = getChordNotes(chord.root, chord.quality);
      notes.forEach((note, i) => {
        const midi = noteNameToMidi(note, i === 0 ? 3 : (noteNameToMidi(note, 3) < noteNameToMidi(chord.root, 3) ? 4 : 3));
        playNote(ctx, dest, instrument, midi, 100, undefined, 1.2);
      });
    });
  }, [selectedDegrees, diatonicChords, instrument]);

  const addSelectedToProgression = () => {
    const sorted = Array.from(selectedDegrees).sort((a, b) => a - b);
    sorted.forEach(deg => {
      const chord = diatonicChords.find(c => c.degree === deg);
      if (chord) addChordToProgression(chord);
    });
  };

  const removeFromProgression = (idx: number) => {
    setProgression(prev => prev.filter((_, i) => i !== idx));
  };

  const loadPreset = (presetIdx: number) => {
    const preset = COMMON_PROGRESSIONS[presetIdx];
    const chords = preset.degrees.map(deg => {
      const dc = diatonicChords.find(c => c.degree === deg);
      return dc || diatonicChords[0];
    });
    setProgression(chords);
  };

  const moveChord = (fromIdx: number, direction: -1 | 1) => {
    const toIdx = fromIdx + direction;
    if (toIdx < 0 || toIdx >= progression.length) return;
    setProgression(prev => {
      const next = [...prev];
      [next[fromIdx], next[toIdx]] = [next[toIdx], next[fromIdx]];
      return next;
    });
  };

  const displayChord = hoveredChord || (currentChordIdx >= 0 ? progression[currentChordIdx] : null);

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white p-4 overflow-auto">
      {/* Key Selection */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Key:</label>
          <select
            value={rootNote}
            onChange={e => { setRootNote(e.target.value as NoteName); setProgression([]); }}
            className="bg-gray-700 text-sm rounded px-2 py-1 text-white"
          >
            {NOTE_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <select
            value={scaleType}
            onChange={e => { setScaleType(e.target.value as 'major' | 'natural-minor'); setProgression([]); }}
            className="bg-gray-700 text-sm rounded px-2 py-1 text-white"
          >
            <option value="major">Major</option>
            <option value="natural-minor">Minor</option>
          </select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <label className="text-sm text-gray-400">Preset:</label>
          <select
            onChange={e => { if (e.target.value !== '') loadPreset(Number(e.target.value)); e.target.value = ''; }}
            className="bg-gray-700 text-sm rounded px-2 py-1 text-white"
            defaultValue=""
          >
            <option value="" disabled>Select...</option>
            {COMMON_PROGRESSIONS.map((p, i) => <option key={i} value={i}>{p.name}</option>)}
          </select>
        </div>
      </div>

      {/* Diatonic Chord Palette */}
      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-2">Diatonic Chords - Click to select, double-click to add to progression</div>
        <div className="grid grid-cols-7 gap-2">
          {diatonicChords.map((chord, i) => (
            <button
              key={i}
              onClick={() => toggleDegree(chord.degree)}
              onDoubleClick={() => addChordToProgression(chord)}
              onMouseEnter={() => setHoveredChord(chord)}
              onMouseLeave={() => setHoveredChord(null)}
              className={`p-3 rounded-lg border-2 text-center transition-all hover:scale-105 ${
                selectedDegrees.has(chord.degree)
                  ? 'border-white bg-white/20 ring-2 ring-white/30'
                  : QUALITY_COLORS[chord.quality] || 'border-gray-600'
              }`}
            >
              <div className="text-lg font-bold">{romanNumerals[i]}</div>
              <div className="text-xs text-gray-400">{chord.root} {chord.quality}</div>
            </button>
          ))}
        </div>
        {selectedDegrees.size > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-500">{selectedDegrees.size} selected</span>
            <button onClick={playSelectedChords} className="px-3 py-1 bg-blue-600 rounded text-xs hover:bg-blue-700">Play Together</button>
            <button onClick={addSelectedToProgression} className="px-3 py-1 bg-green-600 rounded text-xs hover:bg-green-700">Add All to Progression</button>
            <button onClick={() => setSelectedDegrees(new Set())} className="px-3 py-1 bg-gray-700 rounded text-xs hover:bg-gray-600">Deselect</button>
          </div>
        )}
      </div>

      {/* Chord Details */}
      {displayChord && (
        <div className="mb-4 p-3 bg-gray-800 rounded-lg">
          <span className="text-sm text-gray-400">Notes: </span>
          <span className="text-sm font-mono">{getChordNotes(displayChord.root, displayChord.quality).join(' - ')}</span>
        </div>
      )}

      {/* Progression Timeline */}
      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-2">Progression {progression.length > 0 && `(${progression.length} chords)`}</div>
        <div className="flex gap-2 flex-wrap min-h-[60px] p-3 bg-gray-800 rounded-lg">
          {progression.length === 0 ? (
            <div className="text-gray-600 text-sm">Click chords above to build your progression</div>
          ) : (
            progression.map((chord, i) => {
              const di = diatonicChords.findIndex(c => c.degree === chord.degree);
              return (
                <div
                  key={i}
                  className={`relative group flex flex-col items-center p-2 rounded-lg border-2 min-w-[60px] transition-all ${
                    currentChordIdx === i ? 'border-yellow-400 bg-yellow-400/20 scale-105' : `${QUALITY_COLORS[chord.quality] || 'border-gray-600'}`
                  }`}
                >
                  <div className="text-sm font-bold">{di >= 0 ? romanNumerals[di] : '?'}</div>
                  <div className="text-xs text-gray-400">{chord.root}</div>
                  <div className="absolute -top-1 -right-1 hidden group-hover:flex gap-0.5">
                    <button onClick={() => moveChord(i, -1)} className="w-4 h-4 bg-gray-600 rounded text-xs hover:bg-gray-500">←</button>
                    <button onClick={() => moveChord(i, 1)} className="w-4 h-4 bg-gray-600 rounded text-xs hover:bg-gray-500">→</button>
                    <button onClick={() => removeFromProgression(i)} className="w-4 h-4 bg-red-600 rounded text-xs hover:bg-red-500">×</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={isPlaying ? stopPlayback : startPlayback}
          disabled={progression.length === 0}
          className={`px-4 py-2 rounded-lg font-medium text-sm ${
            isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500'
          }`}
        >
          {isPlaying ? 'Stop' : 'Play'}
        </button>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">BPM:</label>
          <input type="range" min={60} max={180} value={bpm} onChange={e => setBpm(Number(e.target.value))} className="w-24 accent-blue-500" />
          <span className="text-sm font-mono w-8">{bpm}</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Instrument:</label>
          <select value={instrument} onChange={e => setInstrument(e.target.value as InstrumentType)} className="bg-gray-700 text-sm rounded px-2 py-1 text-white">
            {(['piano', 'guitar', 'synth', 'bass', 'strings'] as InstrumentType[]).map(i => (
              <option key={i} value={i}>{i.charAt(0).toUpperCase() + i.slice(1)}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-1 text-sm text-gray-400 cursor-pointer">
          <input type="checkbox" checked={loop} onChange={e => setLoop(e.target.checked)} className="accent-blue-500" />
          Loop
        </label>
        {progression.length > 0 && (
          <button onClick={() => setProgression([])} className="ml-auto px-3 py-1 bg-gray-700 rounded text-xs hover:bg-gray-600 text-red-400">Clear</button>
        )}
      </div>
    </div>
  );
}
