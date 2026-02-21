import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { Track, PianoRollNote, InstrumentType, EffectType, EffectNode as EffectNodeType } from './audio/types';
import { getAudioContext, getMasterGain } from './audio/AudioEngine';
import { playNote, playDrumHit } from './audio/synthesis';
import { midiToNoteName, DRUM_NAMES, NOTE_NAMES } from './audio/constants';
import { createEffect } from './audio/effects';
import { exportToWAV } from './audio/exportAudio';

// ── Constants ──────────────────────────────────────────────────────────────────

const TRACK_COLORS = [
  '#4fc3f7', '#81c784', '#e57373', '#ffb74d', '#ba68c8', '#f06292',
  '#4dd0e1', '#aed581', '#ff8a65', '#a1887f', '#90a4ae', '#ce93d8',
];
const MAX_TRACKS = 12;
const INSTRUMENTS: InstrumentType[] = ['piano', 'guitar', 'synth', 'bass', 'strings', 'drums'];

// Arrangement canvas
const ARR_TRACK_HEIGHT = 40;
const ARR_BEAT_WIDTH = 30;
const ARR_HEADER_HEIGHT = 24;

// Note editor canvas
const ED_ROW_HEIGHT = 14;
const ED_BEAT_WIDTH = 60;
const ED_KEY_WIDTH = 44;
const ED_HEADER_HEIGHT = 22;
const MIDI_LOW = 36;   // C2
const MIDI_HIGH = 84;  // C6
const ED_TOTAL_ROWS = MIDI_HIGH - MIDI_LOW;

// Drum editor
const DRUM_ROW_HEIGHT = 30;
const DRUM_LABEL_WIDTH = 70;
const DRUM_STEP_WIDTH = 30;

// ── Helpers ────────────────────────────────────────────────────────────────────

function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function createDefaultTrack(index: number): Track {
  return {
    id: uid(),
    name: `Track ${index + 1}`,
    instrument: index === 0 ? 'piano' : index === 1 ? 'bass' : index === 2 ? 'drums' : 'synth',
    notes: [],
    volume: 0.8,
    pan: 0,
    muted: false,
    solo: false,
    color: TRACK_COLORS[index % TRACK_COLORS.length],
  };
}

function isBlackKey(midi: number): boolean {
  return [1, 3, 6, 8, 10].includes(midi % 12);
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  if (radius < 0 || w <= 0 || h <= 0) return;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

// ── Song Presets ───────────────────────────────────────────────────────────────

const SONG_PRESETS: Record<string, { name: string; bpm: number; totalBeats: number; tracks: Omit<Track, 'id'>[] }> = {
  'Pop Ballad': {
    name: 'Pop Ballad', bpm: 100, totalBeats: 32,
    tracks: [
      {
        name: 'Piano Chords', instrument: 'piano',
        notes: [0, 8, 16, 24].flatMap((bar, bi) => {
          const chords = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]];
          const chord = chords[bi % 4];
          return [
            ...chord.map((midi, ni) => ({ id: `pp-${bar}-${ni}`, midi, startBeat: bar, duration: 3.5, velocity: 85, trackId: '' })),
            ...chord.map((midi, ni) => ({ id: `pp-${bar + 4}-${ni}`, midi, startBeat: bar + 4, duration: 3.5, velocity: 80, trackId: '' })),
          ];
        }),
        volume: 0.7, pan: 0, muted: false, solo: false, color: '#4fc3f7',
      },
      {
        name: 'Bass', instrument: 'bass',
        notes: Array.from({ length: 16 }, (_, i) => {
          const roots = [36, 36, 33, 33, 29, 29, 31, 31];
          return { id: `pb-${i}`, midi: roots[i % 8], startBeat: i * 2, duration: 1.5, velocity: 100, trackId: '' };
        }),
        volume: 0.8, pan: 0, muted: false, solo: false, color: '#81c784',
      },
      {
        name: 'Melody', instrument: 'synth',
        notes: [
          { midi: 72, startBeat: 0 }, { midi: 71, startBeat: 1 }, { midi: 69, startBeat: 2 }, { midi: 67, startBeat: 3 },
          { midi: 65, startBeat: 4 }, { midi: 64, startBeat: 5 }, { midi: 65, startBeat: 6 }, { midi: 67, startBeat: 7 },
          { midi: 69, startBeat: 8 }, { midi: 72, startBeat: 10 }, { midi: 74, startBeat: 12 },
          { midi: 72, startBeat: 14 }, { midi: 69, startBeat: 15 },
        ].map((n, i) => ({ id: `pm-${i}`, ...n, duration: 0.75, velocity: 90, trackId: '' })),
        volume: 0.6, pan: 0, muted: false, solo: false, color: '#e57373',
      },
    ],
  },
  'EDM Drop': {
    name: 'EDM Drop', bpm: 128, totalBeats: 32,
    tracks: [
      {
        name: 'Synth Lead', instrument: 'synth',
        notes: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30].map((beat, i) => ({
          id: `es-${i}`, midi: [60, 63, 67, 72, 60, 63, 67, 72, 60, 63, 67, 72, 60, 63, 67, 72][i],
          startBeat: beat, duration: 0.5, velocity: 100, trackId: '',
        })),
        volume: 0.7, pan: 0, muted: false, solo: false, color: '#ba68c8',
      },
      {
        name: 'Sub Bass', instrument: 'bass',
        notes: [0, 4, 8, 12, 16, 20, 24, 28].map((beat, i) => ({
          id: `eb-${i}`, midi: 36, startBeat: beat, duration: 2, velocity: 120, trackId: '',
        })),
        volume: 0.9, pan: 0, muted: false, solo: false, color: '#81c784',
      },
      {
        name: 'Drums', instrument: 'drums',
        notes: [
          ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31].map((b, i) => ({
            id: `ek-${i}`, midi: 0, startBeat: b, duration: 0.25, velocity: 120, trackId: '',
          })),
          ...Array.from({ length: 64 }, (_, i) => ({
            id: `eh-${i}`, midi: 2, startBeat: i * 0.5, duration: 0.25, velocity: 70, trackId: '',
          })),
          ...Array.from({ length: 16 }, (_, i) => ({
            id: `esn-${i}`, midi: 1, startBeat: i * 2 + 1, duration: 0.25, velocity: 110, trackId: '',
          })),
        ],
        volume: 0.8, pan: 0, muted: false, solo: false, color: '#e57373',
      },
    ],
  },
  'Chill Lo-Fi': {
    name: 'Chill Lo-Fi', bpm: 75, totalBeats: 32,
    tracks: [
      {
        name: 'Piano', instrument: 'piano',
        notes: [0, 8, 16, 24].flatMap((bar, bi) => {
          const chords = [[62, 65, 69], [67, 71, 74], [60, 64, 67], [60, 64, 67]];
          return chords[bi].flatMap((midi, ni) => [
            { id: `lp-${bar}-${ni}`, midi, startBeat: bar, duration: 3, velocity: 75, trackId: '' },
            { id: `lp-${bar + 4}-${ni}`, midi, startBeat: bar + 4, duration: 3, velocity: 70, trackId: '' },
          ]);
        }),
        volume: 0.65, pan: 0, muted: false, solo: false, color: '#4fc3f7',
      },
      {
        name: 'Bass', instrument: 'bass',
        notes: [
          38, 38, 38, 38, 43, 43, 43, 43, 36, 36, 36, 36, 36, 36, 36, 36,
        ].map((midi, i) => ({
          id: `lb-${i}`, midi, startBeat: i * 2, duration: 1.5, velocity: 90, trackId: '',
        })),
        volume: 0.75, pan: 0, muted: false, solo: false, color: '#81c784',
      },
      {
        name: 'Strings', instrument: 'strings',
        notes: [0, 16].flatMap((offset, oi) => [
          { id: `ls-${oi}-0`, midi: 60, startBeat: offset, duration: 14, velocity: 50, trackId: '' },
          { id: `ls-${oi}-1`, midi: 64, startBeat: offset, duration: 14, velocity: 50, trackId: '' },
          { id: `ls-${oi}-2`, midi: 67, startBeat: offset, duration: 14, velocity: 50, trackId: '' },
        ]),
        volume: 0.4, pan: 0, muted: false, solo: false, color: '#f06292',
      },
    ],
  },
  'Rock Jam': {
    name: 'Rock Jam', bpm: 140, totalBeats: 32,
    tracks: [
      {
        name: 'Guitar', instrument: 'guitar',
        notes: [0, 4, 8, 12, 16, 20, 24, 28].flatMap((beat, bi) => {
          const chords = [[40, 47, 52], [40, 47, 52], [45, 52, 57], [43, 50, 55]];
          return chords[bi % 4].map((midi, ni) => ({
            id: `rg-${beat}-${ni}`, midi, startBeat: beat, duration: 3, velocity: 110, trackId: '',
          }));
        }),
        volume: 0.8, pan: -0.2, muted: false, solo: false, color: '#ffb74d',
      },
      {
        name: 'Bass', instrument: 'bass',
        notes: [0, 4, 8, 12, 16, 20, 24, 28].map((beat, i) => {
          const roots = [28, 28, 33, 31];
          return { id: `rb-${i}`, midi: roots[i % 4], startBeat: beat, duration: 3, velocity: 100, trackId: '' };
        }),
        volume: 0.85, pan: 0, muted: false, solo: false, color: '#81c784',
      },
      {
        name: 'Drums', instrument: 'drums',
        notes: [
          ...Array.from({ length: 16 }, (_, i) => ({
            id: `rk-${i}`, midi: 0, startBeat: i * 2, duration: 0.25, velocity: 120, trackId: '',
          })),
          ...Array.from({ length: 16 }, (_, i) => ({
            id: `rs-${i}`, midi: 1, startBeat: i * 2 + 1, duration: 0.25, velocity: 110, trackId: '',
          })),
          ...Array.from({ length: 32 }, (_, i) => ({
            id: `rh-${i}`, midi: 2, startBeat: i, duration: 0.25, velocity: 75, trackId: '',
          })),
        ],
        volume: 0.8, pan: 0, muted: false, solo: false, color: '#e57373',
      },
    ],
  },
};

// ── Component ──────────────────────────────────────────────────────────────────

export function DAWStudio() {
  // ── State ──────────────────────────────────────────────────────────────────

  const [tracks, setTracks] = useState<Track[]>(() => [
    createDefaultTrack(0),
    createDefaultTrack(1),
    createDefaultTrack(2),
  ]);
  const [selectedTrackId, setSelectedTrackId] = useState('');
  const [bpm, setBpm] = useState(120);
  const [totalBeats, setTotalBeats] = useState(32);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loop, setLoop] = useState(true);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [editingTrackName, setEditingTrackName] = useState<string | null>(null);

  // Canvas refs
  const arrCanvasRef = useRef<HTMLCanvasElement>(null);
  const edCanvasRef = useRef<HTMLCanvasElement>(null);
  const arrContainerRef = useRef<HTMLDivElement>(null);
  const edContainerRef = useRef<HTMLDivElement>(null);

  // Canvas sizes
  const [arrSize, setArrSize] = useState({ w: 800, h: 400 });
  const [edSize, setEdSize] = useState({ w: 800, h: 300 });

  // Scroll
  const [arrScrollX, setArrScrollX] = useState(0);
  const [arrScrollY, setArrScrollY] = useState(0);
  const [edScrollX, setEdScrollX] = useState(0);
  const [edScrollY, setEdScrollY] = useState(0);

  // Editor state
  const [edHoverRow, setEdHoverRow] = useState(-1);
  const [resizingNote, setResizingNote] = useState<{
    noteId: string;
    trackId: string;
    startX: number;
    originalDuration: number;
  } | null>(null);

  // Playback refs
  const isPlayingRef = useRef(false);
  const playStartRef = useRef(0);
  const playBeatRef = useRef(0);
  const rafRef = useRef(0);
  const sessionGainRef = useRef<GainNode | null>(null);

  // ── Derived ────────────────────────────────────────────────────────────────

  const selectedTrack = useMemo(
    () => tracks.find(t => t.id === selectedTrackId) ?? null,
    [tracks, selectedTrackId]
  );

  const isDrumTrack = selectedTrack?.instrument === 'drums';

  // Arrangement grid dimensions
  const arrGridWidth = totalBeats * ARR_BEAT_WIDTH;
  const arrGridHeight = tracks.length * ARR_TRACK_HEIGHT;
  const arrMaxScrollX = Math.max(0, arrGridWidth - (arrSize.w));
  const arrMaxScrollY = Math.max(0, arrGridHeight + ARR_HEADER_HEIGHT - arrSize.h);

  // Editor grid dimensions
  const edGridWidth = totalBeats * ED_BEAT_WIDTH;
  const edGridHeight = isDrumTrack ? DRUM_NAMES.length * DRUM_ROW_HEIGHT : ED_TOTAL_ROWS * ED_ROW_HEIGHT;
  const edKeyAreaWidth = isDrumTrack ? DRUM_LABEL_WIDTH : ED_KEY_WIDTH;
  const edMaxScrollX = Math.max(0, edGridWidth - (edSize.w - edKeyAreaWidth));
  const edMaxScrollY = Math.max(0, edGridHeight + ED_HEADER_HEIGHT - edSize.h);

  // ── Auto-select first track ────────────────────────────────────────────────

  useEffect(() => {
    if (tracks.length > 0 && !tracks.find(t => t.id === selectedTrackId)) {
      setSelectedTrackId(tracks[0].id);
    }
  }, [tracks, selectedTrackId]);

  // Reset editor scroll when changing tracks
  useEffect(() => {
    setEdScrollX(0);
    setEdScrollY(0);
  }, [selectedTrackId]);

  // ── Canvas sizing with ResizeObserver ──────────────────────────────────────

  useEffect(() => {
    const el = arrContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const r = e.contentRect;
        if (r.width > 0 && r.height > 0) {
          setArrSize({ w: Math.floor(r.width), h: Math.floor(r.height) });
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = edContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const r = e.contentRect;
        if (r.width > 0 && r.height > 0) {
          setEdSize({ w: Math.floor(r.width), h: Math.floor(r.height) });
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Track management ───────────────────────────────────────────────────────

  const addTrack = useCallback(() => {
    if (tracks.length >= MAX_TRACKS) return;
    const t = createDefaultTrack(tracks.length);
    setTracks(prev => [...prev, t]);
    setSelectedTrackId(t.id);
  }, [tracks.length]);

  const deleteTrack = useCallback((id: string) => {
    if (tracks.length <= 1) return;
    setTracks(prev => prev.filter(t => t.id !== id));
    if (selectedTrackId === id) {
      const remaining = tracks.filter(t => t.id !== id);
      if (remaining.length > 0) setSelectedTrackId(remaining[0].id);
    }
  }, [tracks, selectedTrackId]);

  const updateTrack = useCallback((id: string, updates: Partial<Track>) => {
    setTracks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const toggleMute = useCallback((id: string) => {
    setTracks(prev => prev.map(t => t.id === id ? { ...t, muted: !t.muted } : t));
  }, []);

  const toggleSolo = useCallback((id: string) => {
    setTracks(prev => prev.map(t => t.id === id ? { ...t, solo: !t.solo } : t));
  }, []);

  const clearTrackNotes = useCallback((id: string) => {
    setTracks(prev => prev.map(t => t.id === id ? { ...t, notes: [] } : t));
  }, []);

  const clearAll = useCallback(() => {
    if (isPlayingRef.current) stopPlayback();
    setTracks(prev => prev.map(t => ({ ...t, notes: [] })));
  }, []);

  // ── Playback ───────────────────────────────────────────────────────────────

  const stopPlayback = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    playBeatRef.current = 0;
    setCurrentBeat(0);
    cancelAnimationFrame(rafRef.current);
    // Disconnect session gain to immediately kill all scheduled audio
    if (sessionGainRef.current) {
      try { sessionGainRef.current.disconnect(); } catch {}
      sessionGainRef.current = null;
    }
  }, []);

  const startPlayback = useCallback(() => {
    if (isPlayingRef.current) stopPlayback();

    const ctx = getAudioContext();
    const master = getMasterGain();

    // Create a session gain node - disconnecting it kills all scheduled audio
    const sessionGain = ctx.createGain();
    sessionGain.gain.value = 1.0;
    sessionGain.connect(master);
    sessionGainRef.current = sessionGain;

    isPlayingRef.current = true;
    setIsPlaying(true);

    const secPerBeat = 60 / bpm;
    const hasSolo = tracks.some(t => t.solo);

    // Schedule all notes for one pass
    for (const track of tracks) {
      if (track.muted) continue;
      if (hasSolo && !track.solo) continue;

      const trackGain = ctx.createGain();
      trackGain.gain.value = track.volume;

      // Apply panning
      if (typeof ctx.createStereoPanner === 'function') {
        const panner = ctx.createStereoPanner();
        panner.pan.value = track.pan;
        trackGain.connect(panner);
        panner.connect(sessionGain);
      } else {
        trackGain.connect(sessionGain);
      }

      for (const note of track.notes) {
        const noteStart = ctx.currentTime + note.startBeat * secPerBeat;
        const noteDur = note.duration * secPerBeat;
        if (track.instrument === 'drums') {
          playDrumHit(ctx, trackGain, note.midi, noteStart);
        } else {
          playNote(ctx, trackGain, track.instrument, note.midi, note.velocity, noteStart, noteDur);
        }
      }
    }

    playStartRef.current = ctx.currentTime;
    playBeatRef.current = 0;

    const animate = () => {
      if (!isPlayingRef.current) return;
      const elapsed = getAudioContext().currentTime - playStartRef.current;
      const spb = 60 / bpm;
      const totalSec = totalBeats * spb;

      if (elapsed >= totalSec) {
        if (loop) {
          // Restart playback for the next loop
          stopPlayback();
          // Use a micro-delay to avoid stack overflow from immediate recursion
          setTimeout(() => startPlayback(), 0);
          return;
        } else {
          stopPlayback();
          return;
        }
      }

      playBeatRef.current = elapsed / spb;
      setCurrentBeat(playBeatRef.current);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
  }, [bpm, totalBeats, tracks, loop, stopPlayback]);

  const togglePlayback = useCallback(() => {
    if (isPlayingRef.current) stopPlayback();
    else startPlayback();
  }, [startPlayback, stopPlayback]);

  // Stop on unmount
  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      cancelAnimationFrame(rafRef.current);
      if (sessionGainRef.current) {
        try { sessionGainRef.current.disconnect(); } catch {}
        sessionGainRef.current = null;
      }
    };
  }, []);

  // ── Export ─────────────────────────────────────────────────────────────────

  const handleExport = useCallback(async () => {
    try {
      const blob = await exportToWAV(tracks, bpm, totalBeats);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daw-project-${Date.now()}.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  }, [tracks, bpm, totalBeats]);

  // ── Preset loading ─────────────────────────────────────────────────────────

  const loadPreset = useCallback((name: string) => {
    const preset = SONG_PRESETS[name];
    if (!preset) return;
    if (isPlayingRef.current) stopPlayback();
    setBpm(preset.bpm);
    setTotalBeats(preset.totalBeats);
    const newTracks = preset.tracks.map((t, i) => {
      const trackId = uid();
      return {
        ...t,
        id: trackId,
        color: TRACK_COLORS[i % TRACK_COLORS.length],
        notes: t.notes.map(n => ({ ...n, id: uid(), trackId })),
      };
    });
    setTracks(newTracks);
    setSelectedTrackId(newTracks[0].id);
    setArrScrollX(0);
    setArrScrollY(0);
    setEdScrollX(0);
    setEdScrollY(0);
  }, [stopPlayback]);

  // ── Arrangement Canvas Drawing ─────────────────────────────────────────────

  const drawArrangement = useCallback(() => {
    const canvas = arrCanvasRef.current;
    if (!canvas) return;
    const c = canvas.getContext('2d');
    if (!c) return;

    const w = canvas.width;
    const h = canvas.height;

    c.clearRect(0, 0, w, h);

    // Background
    c.fillStyle = '#0f0f1a';
    c.fillRect(0, 0, w, h);

    // ── Header ──────────────────────────────────────────────────────────────
    c.save();
    c.beginPath();
    c.rect(0, 0, w, ARR_HEADER_HEIGHT);
    c.clip();

    c.fillStyle = '#1e1e38';
    c.fillRect(0, 0, w, ARR_HEADER_HEIGHT);

    c.font = '10px monospace';
    c.fillStyle = '#8888aa';
    c.textBaseline = 'middle';
    for (let beat = 0; beat <= totalBeats; beat++) {
      const x = beat * ARR_BEAT_WIDTH - arrScrollX;
      if (x < -ARR_BEAT_WIDTH || x > w) continue;
      if (beat % 4 === 0) {
        c.fillStyle = '#aaaacc';
        c.fillText(`${beat + 1}`, x + 3, ARR_HEADER_HEIGHT / 2);
        c.fillStyle = '#8888aa';
      } else {
        c.fillText(`${beat + 1}`, x + 3, ARR_HEADER_HEIGHT / 2);
      }
    }
    c.restore();

    // ── Track rows ──────────────────────────────────────────────────────────
    c.save();
    c.beginPath();
    c.rect(0, ARR_HEADER_HEIGHT, w, h - ARR_HEADER_HEIGHT);
    c.clip();

    for (let ti = 0; ti < tracks.length; ti++) {
      const track = tracks[ti];
      const rowY = ARR_HEADER_HEIGHT + ti * ARR_TRACK_HEIGHT - arrScrollY;

      if (rowY + ARR_TRACK_HEIGHT < ARR_HEADER_HEIGHT || rowY > h) continue;

      // Row background
      const isSelected = track.id === selectedTrackId;
      if (isSelected) {
        c.fillStyle = '#252548';
      } else {
        c.fillStyle = ti % 2 === 0 ? '#1a1a2e' : '#161630';
      }
      c.fillRect(0, rowY, w, ARR_TRACK_HEIGHT);

      // Muted/Solo indicator
      if (track.muted) {
        c.fillStyle = 'rgba(229, 115, 115, 0.08)';
        c.fillRect(0, rowY, w, ARR_TRACK_HEIGHT);
      }
      if (track.solo) {
        c.fillStyle = 'rgba(255, 183, 77, 0.06)';
        c.fillRect(0, rowY, w, ARR_TRACK_HEIGHT);
      }

      // Track label area
      c.fillStyle = hexToRgba(track.color, 0.15);
      c.fillRect(0, rowY, 4, ARR_TRACK_HEIGHT);

      // Draw notes in the track lane
      for (const note of track.notes) {
        const nx = note.startBeat * ARR_BEAT_WIDTH - arrScrollX;
        const nw = note.duration * ARR_BEAT_WIDTH;
        if (nx + nw < 0 || nx > w) continue;

        if (track.instrument === 'drums') {
          // Drum notes: small colored markers
          const drumY = rowY + 4 + (note.midi / 7) * (ARR_TRACK_HEIGHT - 10);
          c.fillStyle = hexToRgba(track.color, 0.7 + (note.velocity / 127) * 0.3);
          c.fillRect(nx, drumY, Math.max(nw, 3), 4);
        } else {
          // Melodic notes: map midi to vertical position in lane
          const midiRange = MIDI_HIGH - MIDI_LOW;
          const normalizedMidi = Math.max(0, Math.min(1, (note.midi - MIDI_LOW) / midiRange));
          const noteY = rowY + ARR_TRACK_HEIGHT - 4 - normalizedMidi * (ARR_TRACK_HEIGHT - 8);
          const noteH = Math.max(3, (ARR_TRACK_HEIGHT - 8) / 12);
          c.fillStyle = hexToRgba(track.color, 0.5 + (note.velocity / 127) * 0.5);
          roundRect(c, nx, noteY - noteH / 2, Math.max(nw - 1, 2), noteH, 1);
          c.fill();
        }
      }

      // Row separator line
      c.strokeStyle = '#2a2a48';
      c.lineWidth = 0.5;
      c.beginPath();
      c.moveTo(0, rowY + ARR_TRACK_HEIGHT);
      c.lineTo(w, rowY + ARR_TRACK_HEIGHT);
      c.stroke();
    }

    // ── Vertical beat lines ─────────────────────────────────────────────────
    for (let beat = 0; beat <= totalBeats; beat++) {
      const x = beat * ARR_BEAT_WIDTH - arrScrollX;
      if (x < 0 || x > w) continue;
      c.strokeStyle = beat % 4 === 0 ? '#3a3a5e' : '#222240';
      c.lineWidth = beat % 4 === 0 ? 1 : 0.5;
      c.beginPath();
      c.moveTo(x, ARR_HEADER_HEIGHT);
      c.lineTo(x, h);
      c.stroke();
    }

    // ── Playback cursor ─────────────────────────────────────────────────────
    if (isPlayingRef.current) {
      const cx = playBeatRef.current * ARR_BEAT_WIDTH - arrScrollX;
      if (cx >= 0 && cx <= w) {
        c.strokeStyle = '#ff5252';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(cx, ARR_HEADER_HEIGHT);
        c.lineTo(cx, h);
        c.stroke();

        // Playhead triangle
        c.fillStyle = '#ff5252';
        c.beginPath();
        c.moveTo(cx - 5, ARR_HEADER_HEIGHT - 2);
        c.lineTo(cx + 5, ARR_HEADER_HEIGHT - 2);
        c.lineTo(cx, ARR_HEADER_HEIGHT + 6);
        c.closePath();
        c.fill();
      }
    }

    c.restore();
  }, [tracks, totalBeats, arrScrollX, arrScrollY, selectedTrackId, arrSize]);

  // ── Note Editor Canvas Drawing ─────────────────────────────────────────────

  const drawEditor = useCallback(() => {
    const canvas = edCanvasRef.current;
    if (!canvas) return;
    const c = canvas.getContext('2d');
    if (!c) return;

    const w = canvas.width;
    const h = canvas.height;

    c.clearRect(0, 0, w, h);
    c.fillStyle = '#0f0f1a';
    c.fillRect(0, 0, w, h);

    if (!selectedTrack) {
      c.fillStyle = '#666';
      c.font = '14px system-ui, sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('Select a track to edit', w / 2, h / 2);
      return;
    }

    if (isDrumTrack) {
      drawDrumEditor(c, w, h);
    } else {
      drawMelodicEditor(c, w, h);
    }
  }, [selectedTrack, isDrumTrack, tracks, totalBeats, edScrollX, edScrollY, edHoverRow, edSize, selectedTrackId]);

  const drawDrumEditor = useCallback((c: CanvasRenderingContext2D, w: number, h: number) => {
    if (!selectedTrack) return;

    // Header
    c.save();
    c.beginPath();
    c.rect(DRUM_LABEL_WIDTH, 0, w - DRUM_LABEL_WIDTH, ED_HEADER_HEIGHT);
    c.clip();

    c.fillStyle = '#1e1e38';
    c.fillRect(DRUM_LABEL_WIDTH, 0, w - DRUM_LABEL_WIDTH, ED_HEADER_HEIGHT);

    c.font = '9px monospace';
    c.fillStyle = '#8888aa';
    c.textBaseline = 'middle';
    for (let beat = 0; beat <= totalBeats; beat++) {
      const x = DRUM_LABEL_WIDTH + beat * DRUM_STEP_WIDTH - edScrollX;
      if (x < DRUM_LABEL_WIDTH - DRUM_STEP_WIDTH || x > w) continue;
      if (beat % 4 === 0) {
        c.fillStyle = '#aaaacc';
      } else {
        c.fillStyle = '#666688';
      }
      c.fillText(`${beat + 1}`, x + 3, ED_HEADER_HEIGHT / 2);
    }
    c.restore();

    // Label column
    c.save();
    c.beginPath();
    c.rect(0, ED_HEADER_HEIGHT, DRUM_LABEL_WIDTH, h - ED_HEADER_HEIGHT);
    c.clip();

    for (let row = 0; row < DRUM_NAMES.length; row++) {
      const y = ED_HEADER_HEIGHT + row * DRUM_ROW_HEIGHT - edScrollY;
      if (y + DRUM_ROW_HEIGHT < ED_HEADER_HEIGHT || y > h) continue;

      c.fillStyle = row % 2 === 0 ? '#1a1a2e' : '#161630';
      c.fillRect(0, y, DRUM_LABEL_WIDTH, DRUM_ROW_HEIGHT);

      if (edHoverRow === row) {
        c.fillStyle = 'rgba(255,255,255,0.06)';
        c.fillRect(0, y, DRUM_LABEL_WIDTH, DRUM_ROW_HEIGHT);
      }

      c.fillStyle = '#ccccdd';
      c.font = '11px system-ui, sans-serif';
      c.textBaseline = 'middle';
      c.fillText(DRUM_NAMES[row], 6, y + DRUM_ROW_HEIGHT / 2);

      c.strokeStyle = '#2a2a48';
      c.lineWidth = 0.5;
      c.beginPath();
      c.moveTo(0, y + DRUM_ROW_HEIGHT);
      c.lineTo(DRUM_LABEL_WIDTH, y + DRUM_ROW_HEIGHT);
      c.stroke();
    }
    c.restore();

    // Grid area
    c.save();
    c.beginPath();
    c.rect(DRUM_LABEL_WIDTH, ED_HEADER_HEIGHT, w - DRUM_LABEL_WIDTH, h - ED_HEADER_HEIGHT);
    c.clip();

    // Row backgrounds
    for (let row = 0; row < DRUM_NAMES.length; row++) {
      const y = ED_HEADER_HEIGHT + row * DRUM_ROW_HEIGHT - edScrollY;
      if (y + DRUM_ROW_HEIGHT < ED_HEADER_HEIGHT || y > h) continue;

      c.fillStyle = row % 2 === 0 ? '#1a1a2e' : '#161630';
      c.fillRect(DRUM_LABEL_WIDTH, y, w - DRUM_LABEL_WIDTH, DRUM_ROW_HEIGHT);

      if (edHoverRow === row) {
        c.fillStyle = 'rgba(255,255,255,0.04)';
        c.fillRect(DRUM_LABEL_WIDTH, y, w - DRUM_LABEL_WIDTH, DRUM_ROW_HEIGHT);
      }

      // Row separator
      c.strokeStyle = '#2a2a48';
      c.lineWidth = 0.5;
      c.beginPath();
      c.moveTo(DRUM_LABEL_WIDTH, y + DRUM_ROW_HEIGHT);
      c.lineTo(w, y + DRUM_ROW_HEIGHT);
      c.stroke();
    }

    // Vertical beat lines
    for (let beat = 0; beat <= totalBeats; beat++) {
      const x = DRUM_LABEL_WIDTH + beat * DRUM_STEP_WIDTH - edScrollX;
      if (x < DRUM_LABEL_WIDTH || x > w) continue;
      c.strokeStyle = beat % 4 === 0 ? '#3a3a5e' : '#222240';
      c.lineWidth = beat % 4 === 0 ? 1 : 0.5;
      c.beginPath();
      c.moveTo(x, ED_HEADER_HEIGHT);
      c.lineTo(x, h);
      c.stroke();
    }

    // Draw drum notes as filled pads
    for (const note of selectedTrack.notes) {
      const row = note.midi;
      if (row < 0 || row >= DRUM_NAMES.length) continue;
      const y = ED_HEADER_HEIGHT + row * DRUM_ROW_HEIGHT - edScrollY;
      const x = DRUM_LABEL_WIDTH + note.startBeat * DRUM_STEP_WIDTH - edScrollX;

      if (x + DRUM_STEP_WIDTH < DRUM_LABEL_WIDTH || x > w) continue;
      if (y + DRUM_ROW_HEIGHT < ED_HEADER_HEIGHT || y > h) continue;

      const alpha = 0.5 + (note.velocity / 127) * 0.5;
      c.fillStyle = hexToRgba(selectedTrack.color, alpha);
      roundRect(c, x + 2, y + 3, DRUM_STEP_WIDTH - 4, DRUM_ROW_HEIGHT - 6, 4);
      c.fill();

      c.strokeStyle = selectedTrack.color;
      c.lineWidth = 1;
      roundRect(c, x + 2, y + 3, DRUM_STEP_WIDTH - 4, DRUM_ROW_HEIGHT - 6, 4);
      c.stroke();
    }

    // Playback cursor
    if (isPlayingRef.current) {
      const cx = DRUM_LABEL_WIDTH + playBeatRef.current * DRUM_STEP_WIDTH - edScrollX;
      if (cx >= DRUM_LABEL_WIDTH && cx <= w) {
        c.strokeStyle = '#ff5252';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(cx, ED_HEADER_HEIGHT);
        c.lineTo(cx, h);
        c.stroke();
      }
    }

    c.restore();

    // Corner fill
    c.fillStyle = '#16162e';
    c.fillRect(0, 0, DRUM_LABEL_WIDTH, ED_HEADER_HEIGHT);

    // Corner label
    c.fillStyle = '#666688';
    c.font = '10px system-ui, sans-serif';
    c.textBaseline = 'middle';
    c.textAlign = 'center';
    c.fillText('Drums', DRUM_LABEL_WIDTH / 2, ED_HEADER_HEIGHT / 2);
    c.textAlign = 'left';
  }, [selectedTrack, totalBeats, edScrollX, edScrollY, edHoverRow]);

  const drawMelodicEditor = useCallback((c: CanvasRenderingContext2D, w: number, h: number) => {
    if (!selectedTrack) return;

    const viewW = w - ED_KEY_WIDTH;
    const viewH = h - ED_HEADER_HEIGHT;

    // ── Piano keys column ────────────────────────────────────────────────
    c.save();
    c.beginPath();
    c.rect(0, ED_HEADER_HEIGHT, ED_KEY_WIDTH, viewH);
    c.clip();

    for (let midi = MIDI_HIGH - 1; midi >= MIDI_LOW; midi--) {
      const rowIdx = MIDI_HIGH - 1 - midi;
      const y = ED_HEADER_HEIGHT + rowIdx * ED_ROW_HEIGHT - edScrollY;
      if (y + ED_ROW_HEIGHT < ED_HEADER_HEIGHT || y > h) continue;

      const black = isBlackKey(midi);
      c.fillStyle = black ? '#1e1e32' : '#2a2a44';
      c.fillRect(0, y, ED_KEY_WIDTH, ED_ROW_HEIGHT);

      c.strokeStyle = '#333355';
      c.lineWidth = 0.5;
      c.beginPath();
      c.moveTo(0, y + ED_ROW_HEIGHT);
      c.lineTo(ED_KEY_WIDTH, y + ED_ROW_HEIGHT);
      c.stroke();

      // Label C notes
      const { name, octave } = midiToNoteName(midi);
      if (name === 'C') {
        c.fillStyle = '#ccc';
        c.font = '9px monospace';
        c.textBaseline = 'middle';
        c.fillText(`C${octave}`, 3, y + ED_ROW_HEIGHT / 2);
      }
    }
    c.restore();

    // ── Beat header ──────────────────────────────────────────────────────
    c.save();
    c.beginPath();
    c.rect(ED_KEY_WIDTH, 0, viewW, ED_HEADER_HEIGHT);
    c.clip();

    c.fillStyle = '#1e1e38';
    c.fillRect(ED_KEY_WIDTH, 0, viewW, ED_HEADER_HEIGHT);

    c.font = '9px monospace';
    c.textBaseline = 'middle';
    for (let beat = 0; beat <= totalBeats; beat++) {
      const x = ED_KEY_WIDTH + beat * ED_BEAT_WIDTH - edScrollX;
      if (x < ED_KEY_WIDTH - ED_BEAT_WIDTH || x > w) continue;
      c.fillStyle = beat % 4 === 0 ? '#aaaacc' : '#666688';
      c.fillText(`${beat + 1}`, x + 3, ED_HEADER_HEIGHT / 2);
    }
    c.restore();

    // ── Grid area ────────────────────────────────────────────────────────
    c.save();
    c.beginPath();
    c.rect(ED_KEY_WIDTH, ED_HEADER_HEIGHT, viewW, viewH);
    c.clip();

    // Row backgrounds
    for (let midi = MIDI_HIGH - 1; midi >= MIDI_LOW; midi--) {
      const rowIdx = MIDI_HIGH - 1 - midi;
      const y = ED_HEADER_HEIGHT + rowIdx * ED_ROW_HEIGHT - edScrollY;
      if (y + ED_ROW_HEIGHT < ED_HEADER_HEIGHT || y > h) continue;

      const black = isBlackKey(midi);
      c.fillStyle = black ? '#16162a' : '#1a1a2e';
      c.fillRect(ED_KEY_WIDTH, y, viewW, ED_ROW_HEIGHT);

      // Hover highlight
      if (rowIdx === edHoverRow) {
        c.fillStyle = 'rgba(255,255,255,0.04)';
        c.fillRect(ED_KEY_WIDTH, y, viewW, ED_ROW_HEIGHT);
      }
    }

    // Horizontal grid lines
    for (let r = 0; r <= ED_TOTAL_ROWS; r++) {
      const y = ED_HEADER_HEIGHT + r * ED_ROW_HEIGHT - edScrollY;
      if (y < ED_HEADER_HEIGHT || y > h) continue;
      const midi = MIDI_HIGH - r;
      c.strokeStyle = (midi % 12 === 0) ? '#3a3a5e' : '#252544';
      c.lineWidth = (midi % 12 === 0) ? 1 : 0.5;
      c.beginPath();
      c.moveTo(ED_KEY_WIDTH, y);
      c.lineTo(w, y);
      c.stroke();
    }

    // Vertical lines (16th notes)
    const sixteenth = ED_BEAT_WIDTH / 4;
    for (let s = 0; s <= totalBeats * 4; s++) {
      const x = ED_KEY_WIDTH + s * sixteenth - edScrollX;
      if (x < ED_KEY_WIDTH || x > w) continue;
      const isBeat = s % 4 === 0;
      c.strokeStyle = isBeat ? '#3a3a5e' : '#222240';
      c.lineWidth = isBeat ? 1 : 0.5;
      c.beginPath();
      c.moveTo(x, ED_HEADER_HEIGHT);
      c.lineTo(x, h);
      c.stroke();
    }

    // ── Notes ────────────────────────────────────────────────────────────
    for (const note of selectedTrack.notes) {
      const rowIdx = MIDI_HIGH - 1 - note.midi;
      const y = ED_HEADER_HEIGHT + rowIdx * ED_ROW_HEIGHT - edScrollY;
      const x = ED_KEY_WIDTH + note.startBeat * ED_BEAT_WIDTH - edScrollX;
      const noteW = note.duration * ED_BEAT_WIDTH;

      if (x + noteW < ED_KEY_WIDTH || x > w || y + ED_ROW_HEIGHT < ED_HEADER_HEIGHT || y > h) continue;

      const alpha = 0.4 + (note.velocity / 127) * 0.55;
      c.fillStyle = hexToRgba(selectedTrack.color, alpha);
      roundRect(c, x, y + 1, noteW - 1, ED_ROW_HEIGHT - 2, 2);
      c.fill();

      // Border
      c.strokeStyle = selectedTrack.color;
      c.lineWidth = 1;
      roundRect(c, x, y + 1, noteW - 1, ED_ROW_HEIGHT - 2, 2);
      c.stroke();

      // Resize handle
      if (noteW > 8) {
        c.fillStyle = 'rgba(255,255,255,0.3)';
        c.fillRect(x + noteW - 5, y + 1, 4, ED_ROW_HEIGHT - 2);
      }

      // Note name label if wide enough
      if (noteW > 25) {
        const { name, octave } = midiToNoteName(note.midi);
        c.fillStyle = '#fff';
        c.font = '8px monospace';
        c.textBaseline = 'middle';
        c.fillText(`${name}${octave}`, x + 3, y + ED_ROW_HEIGHT / 2);
      }
    }

    // Playback cursor
    if (isPlayingRef.current) {
      const cx = ED_KEY_WIDTH + playBeatRef.current * ED_BEAT_WIDTH - edScrollX;
      if (cx >= ED_KEY_WIDTH && cx <= w) {
        c.strokeStyle = '#ff5252';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(cx, ED_HEADER_HEIGHT);
        c.lineTo(cx, h);
        c.stroke();
      }
    }

    c.restore();

    // Corner fill
    c.fillStyle = '#16162e';
    c.fillRect(0, 0, ED_KEY_WIDTH, ED_HEADER_HEIGHT);

    c.fillStyle = '#666688';
    c.font = '9px monospace';
    c.textBaseline = 'middle';
    c.textAlign = 'center';
    c.fillText('Note', ED_KEY_WIDTH / 2, ED_HEADER_HEIGHT / 2);
    c.textAlign = 'left';
  }, [selectedTrack, totalBeats, edScrollX, edScrollY, edHoverRow]);

  // ── Render loop ────────────────────────────────────────────────────────────

  useEffect(() => {
    let running = true;
    const loop = () => {
      if (!running) return;
      drawArrangement();
      drawEditor();
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [drawArrangement, drawEditor]);

  // ── Mouse helpers for Editor ───────────────────────────────────────────────

  const edGridCoordsFromEvent = useCallback((e: React.MouseEvent): { beat: number; row: number } | null => {
    const canvas = edCanvasRef.current;
    if (!canvas || !selectedTrack) return null;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const keyW = isDrumTrack ? DRUM_LABEL_WIDTH : ED_KEY_WIDTH;
    const headerH = ED_HEADER_HEIGHT;

    if (px < keyW || py < headerH) return null;

    const gx = px - keyW + edScrollX;
    const gy = py - headerH + edScrollY;

    if (isDrumTrack) {
      const beatExact = gx / DRUM_STEP_WIDTH;
      const beat = Math.floor(beatExact);
      const row = Math.floor(gy / DRUM_ROW_HEIGHT);
      if (row < 0 || row >= DRUM_NAMES.length || beat < 0 || beat >= totalBeats) return null;
      return { beat, row };
    } else {
      const beatExact = gx / ED_BEAT_WIDTH;
      const beat = Math.floor(beatExact * 4) / 4; // snap to 16th
      const rowIdx = Math.floor(gy / ED_ROW_HEIGHT);
      const midi = MIDI_HIGH - 1 - rowIdx;
      if (midi < MIDI_LOW || midi >= MIDI_HIGH || beat < 0 || beat >= totalBeats) return null;
      return { beat, row: rowIdx };
    }
  }, [selectedTrack, isDrumTrack, edScrollX, edScrollY, totalBeats]);

  const findEditorNoteAt = useCallback((beat: number, row: number): PianoRollNote | null => {
    if (!selectedTrack) return null;

    if (isDrumTrack) {
      // For drums, row is drumIndex, beat is integer beat
      for (const note of selectedTrack.notes) {
        if (note.midi === row && Math.floor(note.startBeat) === beat) {
          return note;
        }
      }
    } else {
      // For melodic, row is the visual row index; convert to midi
      const midi = MIDI_HIGH - 1 - row;
      for (const note of selectedTrack.notes) {
        if (note.midi === midi && beat >= note.startBeat && beat < note.startBeat + note.duration) {
          return note;
        }
      }
    }
    return null;
  }, [selectedTrack, isDrumTrack]);

  const isOnEdResizeHandle = useCallback((e: React.MouseEvent, note: PianoRollNote): boolean => {
    if (isDrumTrack) return false; // No resizing for drums
    const canvas = edCanvasRef.current;
    if (!canvas) return false;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const noteRightX = ED_KEY_WIDTH + (note.startBeat + note.duration) * ED_BEAT_WIDTH - edScrollX;
    return Math.abs(px - noteRightX) < 8;
  }, [isDrumTrack, edScrollX]);

  // ── Editor Mouse Events ────────────────────────────────────────────────────

  const handleEdMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 2) return; // right click handled in context menu
    if (!selectedTrack) return;

    const coords = edGridCoordsFromEvent(e);
    if (!coords) return;

    const existing = findEditorNoteAt(coords.beat, coords.row);

    if (existing && !isDrumTrack && isOnEdResizeHandle(e, existing)) {
      setResizingNote({
        noteId: existing.id,
        trackId: selectedTrack.id,
        startX: e.clientX,
        originalDuration: existing.duration,
      });
      return;
    }

    if (existing) {
      // For drums, clicking an existing note toggles it off (delete)
      if (isDrumTrack) {
        setTracks(prev => prev.map(t =>
          t.id === selectedTrack.id
            ? { ...t, notes: t.notes.filter(n => n.id !== existing.id) }
            : t
        ));
      }
      return;
    }

    // Place new note
    if (isDrumTrack) {
      const newNote: PianoRollNote = {
        id: uid(),
        midi: coords.row, // drum index
        startBeat: coords.beat,
        duration: 0.25,
        velocity: 100,
        trackId: selectedTrack.id,
      };

      setTracks(prev => prev.map(t =>
        t.id === selectedTrack.id ? { ...t, notes: [...t.notes, newNote] } : t
      ));

      // Audition drum
      try {
        const ctx = getAudioContext();
        const gain = getMasterGain();
        playDrumHit(ctx, gain, coords.row);
      } catch { /* ignore */ }
    } else {
      const midi = MIDI_HIGH - 1 - coords.row;
      const newNote: PianoRollNote = {
        id: uid(),
        midi,
        startBeat: coords.beat,
        duration: 1,
        velocity: 100,
        trackId: selectedTrack.id,
      };

      setTracks(prev => prev.map(t =>
        t.id === selectedTrack.id ? { ...t, notes: [...t.notes, newNote] } : t
      ));

      // Audition note
      try {
        const ctx = getAudioContext();
        const gain = getMasterGain();
        playNote(ctx, gain, selectedTrack.instrument, midi, 100, undefined, 0.3);
      } catch { /* ignore */ }
    }
  }, [selectedTrack, isDrumTrack, edGridCoordsFromEvent, findEditorNoteAt, isOnEdResizeHandle]);

  const handleEdMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = edCanvasRef.current;
    if (!canvas || !selectedTrack) return;
    const rect = canvas.getBoundingClientRect();
    const py = e.clientY - rect.top;

    // Update hover row
    if (py > ED_HEADER_HEIGHT) {
      const gy = py - ED_HEADER_HEIGHT + edScrollY;
      if (isDrumTrack) {
        setEdHoverRow(Math.floor(gy / DRUM_ROW_HEIGHT));
      } else {
        setEdHoverRow(Math.floor(gy / ED_ROW_HEIGHT));
      }
    } else {
      setEdHoverRow(-1);
    }

    // Handle note resize drag
    if (resizingNote && !isDrumTrack) {
      const dx = e.clientX - resizingNote.startX;
      const dBeats = Math.round((dx / ED_BEAT_WIDTH) * 4) / 4;
      const newDur = Math.max(0.25, resizingNote.originalDuration + dBeats);

      setTracks(prev => prev.map(t =>
        t.id === resizingNote.trackId
          ? { ...t, notes: t.notes.map(n => n.id === resizingNote.noteId ? { ...n, duration: newDur } : n) }
          : t
      ));
    }

    // Update cursor style
    if (!isDrumTrack) {
      const coords = edGridCoordsFromEvent(e);
      if (coords) {
        const existing = findEditorNoteAt(coords.beat, coords.row);
        if (existing && isOnEdResizeHandle(e, existing)) {
          canvas.style.cursor = 'ew-resize';
        } else if (existing) {
          canvas.style.cursor = 'pointer';
        } else {
          canvas.style.cursor = 'crosshair';
        }
      } else {
        canvas.style.cursor = 'default';
      }
    } else {
      canvas.style.cursor = 'pointer';
    }
  }, [selectedTrack, isDrumTrack, resizingNote, edScrollY, edGridCoordsFromEvent, findEditorNoteAt, isOnEdResizeHandle]);

  const handleEdMouseUp = useCallback(() => {
    setResizingNote(null);
  }, []);

  const handleEdContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (!selectedTrack) return;

    const coords = edGridCoordsFromEvent(e);
    if (!coords) return;

    const existing = findEditorNoteAt(coords.beat, coords.row);
    if (existing) {
      setTracks(prev => prev.map(t =>
        t.id === selectedTrack.id
          ? { ...t, notes: t.notes.filter(n => n.id !== existing.id) }
          : t
      ));
    }
  }, [selectedTrack, edGridCoordsFromEvent, findEditorNoteAt]);

  // ── Arrangement Mouse Events ───────────────────────────────────────────────

  const handleArrMouseDown = useCallback((e: React.MouseEvent) => {
    const canvas = arrCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const py = e.clientY - rect.top;

    if (py <= ARR_HEADER_HEIGHT) return;

    const gy = py - ARR_HEADER_HEIGHT + arrScrollY;
    const trackIndex = Math.floor(gy / ARR_TRACK_HEIGHT);

    if (trackIndex >= 0 && trackIndex < tracks.length) {
      setSelectedTrackId(tracks[trackIndex].id);
    }
  }, [tracks, arrScrollY]);

  // ── Scroll handlers ────────────────────────────────────────────────────────

  const handleArrWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.shiftKey) {
      setArrScrollX(prev => Math.max(0, Math.min(arrMaxScrollX, prev + e.deltaY)));
    } else {
      setArrScrollY(prev => Math.max(0, Math.min(arrMaxScrollY, prev + e.deltaY)));
    }
  }, [arrMaxScrollX, arrMaxScrollY]);

  const handleEdWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.shiftKey) {
      setEdScrollX(prev => Math.max(0, Math.min(edMaxScrollX, prev + e.deltaY)));
    } else {
      setEdScrollY(prev => Math.max(0, Math.min(edMaxScrollY, prev + e.deltaY)));
    }
  }, [edMaxScrollX, edMaxScrollY]);

  // ── Instrument emoji helper ────────────────────────────────────────────────

  const instrumentIcon = (inst: InstrumentType): string => {
    switch (inst) {
      case 'piano': return 'PNO';
      case 'guitar': return 'GTR';
      case 'synth': return 'SYN';
      case 'bass': return 'BAS';
      case 'strings': return 'STR';
      case 'drums': return 'DRM';
      default: return '???';
    }
  };

  // ── Total notes count ──────────────────────────────────────────────────────

  const totalNotes = useMemo(() => tracks.reduce((s, t) => s + t.notes.length, 0), [tracks]);

  // ── JSX ────────────────────────────────────────────────────────────────────

  return (
    <div style={styles.container}>
      {/* ── Transport Bar ──────────────────────────────────────────────────── */}
      <div style={styles.transport}>
        <button
          onClick={togglePlayback}
          style={{
            ...styles.transportBtn,
            background: isPlaying ? '#e57373' : '#4fc3f7',
          }}
        >
          {isPlaying ? '\u25A0 Stop' : '\u25B6 Play'}
        </button>

        <button
          onClick={() => { if (isPlaying) stopPlayback(); setCurrentBeat(0); playBeatRef.current = 0; }}
          style={{ ...styles.transportBtn, background: '#555578' }}
        >
          \u25A0 Reset
        </button>

        <button
          onClick={() => setLoop(prev => !prev)}
          style={{
            ...styles.transportBtn,
            background: loop ? '#81c784' : '#3a3a5e',
            color: loop ? '#000' : '#888',
          }}
          title="Toggle loop"
        >
          \u27F3 Loop
        </button>

        <div style={styles.transportGroup}>
          <label style={styles.transportLabel}>BPM</label>
          <input
            type="number"
            min={30}
            max={300}
            value={bpm}
            onChange={e => setBpm(Math.max(30, Math.min(300, Number(e.target.value) || 120)))}
            style={styles.bpmInput}
          />
        </div>

        <div style={styles.transportGroup}>
          <label style={styles.transportLabel}>Beats</label>
          <select
            value={totalBeats}
            onChange={e => setTotalBeats(Number(e.target.value))}
            style={styles.select}
          >
            <option value={8}>8</option>
            <option value={16}>16</option>
            <option value={32}>32</option>
            <option value={64}>64</option>
          </select>
        </div>

        <div style={styles.beatDisplay}>
          Beat: {currentBeat.toFixed(1)} / {totalBeats}
        </div>

        <div style={{ flex: 1 }} />

        <button onClick={handleExport} style={{ ...styles.transportBtn, background: '#81c784', color: '#000' }}>
          Export WAV
        </button>

        <select
          onChange={e => { if (e.target.value) { loadPreset(e.target.value); e.target.value = ''; } }}
          style={styles.select}
          defaultValue=""
        >
          <option value="" disabled>Presets</option>
          {Object.keys(SONG_PRESETS).map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        <button onClick={clearAll} style={{ ...styles.transportBtn, background: '#e57373', color: '#fff' }}>
          Clear All
        </button>
      </div>

      {/* ── Body (Track List + Arrangement + Inspector) ────────────────────── */}
      <div style={styles.body}>
        {/* ── Track List Sidebar ──────────────────────────────────────────── */}
        <div style={styles.trackList}>
          <div style={styles.trackListHeader}>
            <span style={styles.trackListTitle}>Tracks</span>
            {tracks.length < MAX_TRACKS && (
              <button onClick={addTrack} style={styles.addTrackBtn}>+ Add</button>
            )}
          </div>
          <div style={styles.trackListBody}>
            {tracks.map((track, ti) => (
              <div
                key={track.id}
                onClick={() => setSelectedTrackId(track.id)}
                style={{
                  ...styles.trackItem,
                  borderLeft: `4px solid ${track.color}`,
                  background: track.id === selectedTrackId ? '#2a2a48' : (ti % 2 === 0 ? '#1a1a2e' : '#181834'),
                  opacity: track.muted ? 0.5 : 1,
                }}
              >
                <div style={styles.trackItemRow}>
                  <div style={{ ...styles.colorDot, background: track.color }} />
                  {editingTrackName === track.id ? (
                    <input
                      autoFocus
                      style={styles.trackNameInput}
                      value={track.name}
                      onChange={e => updateTrack(track.id, { name: e.target.value })}
                      onBlur={() => setEditingTrackName(null)}
                      onKeyDown={e => { if (e.key === 'Enter') setEditingTrackName(null); }}
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      style={styles.trackName}
                      onDoubleClick={(e) => { e.stopPropagation(); setEditingTrackName(track.id); }}
                    >
                      {track.name}
                    </span>
                  )}
                  <span style={styles.instrBadge}>{instrumentIcon(track.instrument)}</span>
                </div>

                <div style={styles.trackItemRow}>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={track.volume}
                    onChange={e => { e.stopPropagation(); updateTrack(track.id, { volume: Number(e.target.value) }); }}
                    onClick={e => e.stopPropagation()}
                    style={styles.volumeSlider}
                    title={`Volume: ${Math.round(track.volume * 100)}%`}
                  />
                  <span style={styles.volText}>{Math.round(track.volume * 100)}</span>
                </div>

                <div style={styles.trackItemRow}>
                  <button
                    onClick={e => { e.stopPropagation(); toggleMute(track.id); }}
                    style={{
                      ...styles.muteBtn,
                      background: track.muted ? '#e57373' : '#333358',
                      color: track.muted ? '#fff' : '#888',
                    }}
                    title="Mute"
                  >
                    M
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); toggleSolo(track.id); }}
                    style={{
                      ...styles.muteBtn,
                      background: track.solo ? '#ffb74d' : '#333358',
                      color: track.solo ? '#000' : '#888',
                    }}
                    title="Solo"
                  >
                    S
                  </button>
                  <span style={styles.noteCountSmall}>{track.notes.length}n</span>
                  {tracks.length > 1 && (
                    <button
                      onClick={e => { e.stopPropagation(); deleteTrack(track.id); }}
                      style={styles.deleteTrackBtn}
                      title="Delete track"
                    >
                      x
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Center Panel: Arrangement View ─────────────────────────────── */}
        <div style={styles.centerPanel}>
          <div
            ref={arrContainerRef}
            style={styles.arrContainer}
            onWheel={handleArrWheel}
          >
            <canvas
              ref={arrCanvasRef}
              width={arrSize.w}
              height={arrSize.h}
              style={styles.canvas}
              onMouseDown={handleArrMouseDown}
            />
          </div>
        </div>

        {/* ── Inspector Panel ─────────────────────────────────────────────── */}
        <div style={styles.inspector}>
          {selectedTrack ? (
            <>
              <div style={styles.inspectorHeader}>
                <div style={{ ...styles.inspectorColorBar, background: selectedTrack.color }} />
                <span style={styles.inspectorTitle}>{selectedTrack.name}</span>
              </div>

              <div style={styles.inspectorSection}>
                <label style={styles.inspectorLabel}>Instrument</label>
                <select
                  value={selectedTrack.instrument}
                  onChange={e => updateTrack(selectedTrack.id, { instrument: e.target.value as InstrumentType })}
                  style={styles.inspectorSelect}
                >
                  {INSTRUMENTS.map(i => (
                    <option key={i} value={i}>{i.charAt(0).toUpperCase() + i.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div style={styles.inspectorSection}>
                <label style={styles.inspectorLabel}>Volume</label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={selectedTrack.volume}
                  onChange={e => updateTrack(selectedTrack.id, { volume: Number(e.target.value) })}
                  style={styles.inspectorSlider}
                />
                <span style={styles.inspectorValue}>{Math.round(selectedTrack.volume * 100)}%</span>
              </div>

              <div style={styles.inspectorSection}>
                <label style={styles.inspectorLabel}>Pan</label>
                <input
                  type="range"
                  min={-1}
                  max={1}
                  step={0.01}
                  value={selectedTrack.pan}
                  onChange={e => updateTrack(selectedTrack.id, { pan: Number(e.target.value) })}
                  style={styles.inspectorSlider}
                />
                <span style={styles.inspectorValue}>
                  {selectedTrack.pan === 0 ? 'C' : selectedTrack.pan < 0 ? `L${Math.round(Math.abs(selectedTrack.pan) * 100)}` : `R${Math.round(selectedTrack.pan * 100)}`}
                </span>
              </div>

              <div style={styles.inspectorSection}>
                <label style={styles.inspectorLabel}>Color</label>
                <div style={styles.colorPalette}>
                  {TRACK_COLORS.map(color => (
                    <div
                      key={color}
                      onClick={() => updateTrack(selectedTrack.id, { color })}
                      style={{
                        ...styles.colorSwatch,
                        background: color,
                        border: selectedTrack.color === color ? '2px solid #fff' : '2px solid transparent',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={styles.inspectorDivider} />

              <div style={styles.inspectorSection}>
                <div style={styles.inspectorStatRow}>
                  <span style={styles.inspectorStatLabel}>Notes:</span>
                  <span style={styles.inspectorStatValue}>{selectedTrack.notes.length}</span>
                </div>
                <div style={styles.inspectorStatRow}>
                  <span style={styles.inspectorStatLabel}>Muted:</span>
                  <span style={styles.inspectorStatValue}>{selectedTrack.muted ? 'Yes' : 'No'}</span>
                </div>
                <div style={styles.inspectorStatRow}>
                  <span style={styles.inspectorStatLabel}>Solo:</span>
                  <span style={styles.inspectorStatValue}>{selectedTrack.solo ? 'Yes' : 'No'}</span>
                </div>
              </div>

              <div style={styles.inspectorDivider} />

              <button
                onClick={() => clearTrackNotes(selectedTrack.id)}
                style={styles.inspectorClearBtn}
              >
                Clear Notes
              </button>

              <button
                onClick={() => {
                  // Duplicate track
                  if (tracks.length >= MAX_TRACKS) return;
                  const newId = uid();
                  const dupe: Track = {
                    ...selectedTrack,
                    id: newId,
                    name: selectedTrack.name + ' (copy)',
                    color: TRACK_COLORS[tracks.length % TRACK_COLORS.length],
                    notes: selectedTrack.notes.map(n => ({ ...n, id: uid(), trackId: newId })),
                  };
                  setTracks(prev => [...prev, dupe]);
                  setSelectedTrackId(newId);
                }}
                style={styles.inspectorDupeBtn}
              >
                Duplicate Track
              </button>
            </>
          ) : (
            <div style={styles.inspectorEmpty}>
              <span style={{ color: '#666' }}>No track selected</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Note Editor ───────────────────────────────────────────────────── */}
      <div style={styles.editorLabel}>
        <span style={{ fontWeight: 700, fontSize: 11, color: '#aaa' }}>
          {selectedTrack ? (isDrumTrack ? 'DRUM PATTERN' : 'PIANO ROLL') : 'NOTE EDITOR'}
          {selectedTrack && ` - ${selectedTrack.name}`}
        </span>
        {selectedTrack && (
          <span style={{ fontSize: 10, color: '#666', marginLeft: 8 }}>
            {selectedTrack.notes.length} notes
          </span>
        )}
      </div>
      <div
        ref={edContainerRef}
        style={styles.editorArea}
        onWheel={handleEdWheel}
      >
        <canvas
          ref={edCanvasRef}
          width={edSize.w}
          height={edSize.h}
          style={styles.canvas}
          onMouseDown={handleEdMouseDown}
          onMouseMove={handleEdMouseMove}
          onMouseUp={handleEdMouseUp}
          onMouseLeave={() => { setEdHoverRow(-1); handleEdMouseUp(); }}
          onContextMenu={handleEdContextMenu}
        />
      </div>

      {/* ── Status Bar ────────────────────────────────────────────────────── */}
      <div style={styles.statusBar}>
        <span>
          {tracks.length} tracks | {totalNotes} notes | {bpm} BPM | {totalBeats} beats |{' '}
          Click to add, Right-click to delete | Scroll: Wheel (vert), Shift+Wheel (horiz)
        </span>
      </div>
    </div>
  );
}

// ── Inline Styles ──────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    background: '#0f0f1a',
    color: '#ccc',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: 12,
    overflow: 'hidden',
    userSelect: 'none',
  },

  // ── Transport ──────────────────────────────────────────────────────────────
  transport: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 12px',
    background: '#16162e',
    borderBottom: '1px solid #2a2a48',
    flexShrink: 0,
    height: 44,
    boxSizing: 'border-box',
  },
  transportBtn: {
    padding: '5px 12px',
    background: '#4fc3f7',
    color: '#000',
    border: 'none',
    borderRadius: 4,
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 11,
    whiteSpace: 'nowrap',
  },
  transportGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  transportLabel: {
    color: '#888',
    fontSize: 10,
    whiteSpace: 'nowrap',
  },
  bpmInput: {
    width: 48,
    padding: '3px 5px',
    background: '#1e1e38',
    color: '#ccc',
    border: '1px solid #333358',
    borderRadius: 3,
    fontSize: 12,
    textAlign: 'center' as const,
  },
  select: {
    padding: '4px 6px',
    background: '#1e1e38',
    color: '#ccc',
    border: '1px solid #333358',
    borderRadius: 3,
    fontSize: 11,
    cursor: 'pointer',
  },
  beatDisplay: {
    color: '#aaa',
    fontFamily: 'monospace',
    fontSize: 11,
    minWidth: 90,
    whiteSpace: 'nowrap',
  },

  // ── Body ───────────────────────────────────────────────────────────────────
  body: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    minHeight: 0,
  },

  // ── Track List ─────────────────────────────────────────────────────────────
  trackList: {
    width: 180,
    minWidth: 180,
    maxWidth: 180,
    display: 'flex',
    flexDirection: 'column',
    background: '#14142c',
    borderRight: '1px solid #2a2a48',
    overflow: 'hidden',
  },
  trackListHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 8px',
    borderBottom: '1px solid #2a2a48',
    flexShrink: 0,
  },
  trackListTitle: {
    fontWeight: 700,
    fontSize: 12,
    color: '#ddd',
  },
  addTrackBtn: {
    padding: '2px 8px',
    background: '#333358',
    color: '#aaa',
    border: 'none',
    borderRadius: 3,
    cursor: 'pointer',
    fontSize: 10,
    fontWeight: 600,
  },
  trackListBody: {
    flex: 1,
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
  },
  trackItem: {
    padding: '6px 8px',
    borderBottom: '1px solid #1e1e3a',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    transition: 'background 0.1s',
  },
  trackItemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  trackName: {
    flex: 1,
    fontSize: 11,
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    cursor: 'text',
    color: '#ddd',
  },
  trackNameInput: {
    flex: 1,
    background: '#1a1a36',
    color: '#ddd',
    border: '1px solid #444466',
    borderRadius: 2,
    padding: '1px 3px',
    fontSize: 11,
    fontWeight: 600,
    outline: 'none',
    minWidth: 0,
  },
  instrBadge: {
    fontSize: 8,
    color: '#888',
    background: '#222244',
    padding: '1px 4px',
    borderRadius: 2,
    fontFamily: 'monospace',
    flexShrink: 0,
  },
  volumeSlider: {
    flex: 1,
    height: 3,
    accentColor: '#4fc3f7',
    minWidth: 0,
  },
  volText: {
    fontSize: 9,
    color: '#666',
    width: 20,
    textAlign: 'right' as const,
    flexShrink: 0,
  },
  muteBtn: {
    padding: '1px 6px',
    border: 'none',
    borderRadius: 2,
    cursor: 'pointer',
    fontSize: 9,
    fontWeight: 700,
    lineHeight: '14px',
  },
  noteCountSmall: {
    marginLeft: 'auto',
    fontSize: 9,
    color: '#555',
    flexShrink: 0,
  },
  deleteTrackBtn: {
    background: 'none',
    border: 'none',
    color: '#555',
    cursor: 'pointer',
    fontSize: 12,
    padding: '0 3px',
    lineHeight: 1,
    flexShrink: 0,
  },

  // ── Center Panel ───────────────────────────────────────────────────────────
  centerPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minWidth: 0,
  },
  arrContainer: {
    flex: 1,
    position: 'relative' as const,
    overflow: 'hidden',
    minHeight: 0,
  },
  canvas: {
    display: 'block',
  },

  // ── Inspector ──────────────────────────────────────────────────────────────
  inspector: {
    width: 200,
    minWidth: 200,
    maxWidth: 200,
    display: 'flex',
    flexDirection: 'column',
    background: '#14142c',
    borderLeft: '1px solid #2a2a48',
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
    padding: 0,
  },
  inspectorHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 12px',
    borderBottom: '1px solid #2a2a48',
  },
  inspectorColorBar: {
    width: 4,
    height: 18,
    borderRadius: 2,
    flexShrink: 0,
  },
  inspectorTitle: {
    fontWeight: 700,
    fontSize: 13,
    color: '#eee',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  inspectorSection: {
    padding: '8px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  inspectorLabel: {
    fontSize: 10,
    color: '#888',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  inspectorSelect: {
    padding: '4px 6px',
    background: '#1e1e38',
    color: '#ccc',
    border: '1px solid #333358',
    borderRadius: 3,
    fontSize: 12,
    cursor: 'pointer',
  },
  inspectorSlider: {
    width: '100%',
    height: 4,
    accentColor: '#4fc3f7',
  },
  inspectorValue: {
    fontSize: 11,
    color: '#aaa',
    fontFamily: 'monospace',
    textAlign: 'right' as const,
  },
  colorPalette: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  colorSwatch: {
    width: 16,
    height: 16,
    borderRadius: 3,
    cursor: 'pointer',
    transition: 'transform 0.1s',
    boxSizing: 'border-box',
  },
  inspectorDivider: {
    height: 1,
    background: '#2a2a48',
    margin: '4px 12px',
  },
  inspectorStatRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inspectorStatLabel: {
    fontSize: 11,
    color: '#777',
  },
  inspectorStatValue: {
    fontSize: 11,
    color: '#aaa',
    fontFamily: 'monospace',
  },
  inspectorClearBtn: {
    margin: '8px 12px 4px',
    padding: '6px 0',
    background: '#e57373',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 600,
  },
  inspectorDupeBtn: {
    margin: '4px 12px 8px',
    padding: '6px 0',
    background: '#333358',
    color: '#aaa',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 600,
  },
  inspectorEmpty: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  // ── Editor Area ────────────────────────────────────────────────────────────
  editorLabel: {
    padding: '4px 12px',
    background: '#16162e',
    borderTop: '1px solid #2a2a48',
    borderBottom: '1px solid #222244',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  },
  editorArea: {
    height: 280,
    minHeight: 200,
    maxHeight: 400,
    position: 'relative' as const,
    overflow: 'hidden',
    flexShrink: 0,
    borderTop: '1px solid #2a2a48',
  },

  // ── Status Bar ─────────────────────────────────────────────────────────────
  statusBar: {
    padding: '4px 12px',
    background: '#16162e',
    borderTop: '1px solid #2a2a48',
    display: 'flex',
    alignItems: 'center',
    fontSize: 10,
    color: '#555',
    flexShrink: 0,
    height: 24,
    boxSizing: 'border-box',
  },
};
