import { useState, useRef, useEffect, useCallback } from 'react';
import type { Track, PianoRollNote, InstrumentType } from './audio/types';
import { getAudioContext, getMasterGain } from './audio/AudioEngine';
import { playNote } from './audio/synthesis';
import { midiToNoteName, NOTE_NAMES } from './audio/constants';
import { exportToWAV } from './audio/exportAudio';

// ── Constants ──────────────────────────────────────────────────────────────────

const ROW_HEIGHT = 16;
const BEAT_WIDTH = 80;
const SIXTEENTH = BEAT_WIDTH / 4;
const KEY_WIDTH = 48;
const HEADER_HEIGHT = 24;
const MIDI_LOW = 36;   // C2
const MIDI_HIGH = 84;  // C6
const TOTAL_ROWS = MIDI_HIGH - MIDI_LOW;
const GRID_HEIGHT = TOTAL_ROWS * ROW_HEIGHT;
const INSTRUMENTS: InstrumentType[] = ['piano', 'guitar', 'synth', 'bass', 'strings', 'drums'];
const TRACK_COLORS = [
  '#4fc3f7', '#81c784', '#e57373', '#ffb74d',
  '#ba68c8', '#f06292', '#4dd0e1', '#aed581',
];
const MAX_TRACKS = 8;

// Preset patterns
const PRESET_PATTERNS: Record<string, { name: string; bpm: number; beats: number; tracks: Omit<Track, 'id'>[] }> = {
  'C Major Scale': {
    name: 'C Major Scale',
    bpm: 120,
    beats: 16,
    tracks: [{
      name: 'Piano',
      instrument: 'piano',
      notes: [60, 62, 64, 65, 67, 69, 71, 72].map((midi, i) => ({
        id: `p-${i}`,
        midi,
        startBeat: i * 1,
        duration: 0.75,
        velocity: 100,
        trackId: '',
      })),
      volume: 0.8, pan: 0, muted: false, solo: false, color: '#4fc3f7',
    }],
  },
  'Simple Beat': {
    name: 'Simple Beat',
    bpm: 100,
    beats: 16,
    tracks: [
      {
        name: 'Bass',
        instrument: 'bass',
        notes: [0, 4, 8, 12].map((beat, i) => ({
          id: `b-${i}`, midi: 36, startBeat: beat, duration: 0.75, velocity: 110, trackId: '',
        })),
        volume: 0.8, pan: 0, muted: false, solo: false, color: '#81c784',
      },
      {
        name: 'Piano Chords',
        instrument: 'piano',
        notes: [
          ...[0, 4, 8, 12].flatMap((beat, i) => [
            { id: `c-${i}-0`, midi: 60, startBeat: beat, duration: 1.5, velocity: 80, trackId: '' },
            { id: `c-${i}-1`, midi: 64, startBeat: beat, duration: 1.5, velocity: 80, trackId: '' },
            { id: `c-${i}-2`, midi: 67, startBeat: beat, duration: 1.5, velocity: 80, trackId: '' },
          ]),
        ],
        volume: 0.6, pan: 0, muted: false, solo: false, color: '#e57373',
      },
    ],
  },
  'Melody Line': {
    name: 'Melody Line',
    bpm: 130,
    beats: 16,
    tracks: [{
      name: 'Synth Lead',
      instrument: 'synth',
      notes: [
        { midi: 72, startBeat: 0 },
        { midi: 71, startBeat: 1 },
        { midi: 69, startBeat: 2 },
        { midi: 67, startBeat: 3 },
        { midi: 65, startBeat: 4 },
        { midi: 67, startBeat: 5 },
        { midi: 69, startBeat: 6 },
        { midi: 72, startBeat: 7 },
        { midi: 74, startBeat: 8 },
        { midi: 72, startBeat: 9.5 },
        { midi: 69, startBeat: 10.5 },
        { midi: 67, startBeat: 12 },
        { midi: 69, startBeat: 13 },
        { midi: 72, startBeat: 14 },
      ].map((n, i) => ({
        id: `m-${i}`, ...n, duration: 0.75, velocity: 100, trackId: '',
      })),
      volume: 0.7, pan: 0, muted: false, solo: false, color: '#ba68c8',
    }],
  },
};

function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function createDefaultTrack(index: number): Track {
  return {
    id: uid(),
    name: `Track ${index + 1}`,
    instrument: 'piano',
    notes: [],
    volume: 0.8,
    pan: 0,
    muted: false,
    solo: false,
    color: TRACK_COLORS[index % TRACK_COLORS.length],
  };
}

function isBlackKey(midi: number): boolean {
  const n = midi % 12;
  return [1, 3, 6, 8, 10].includes(n);
}

// ── Component ──────────────────────────────────────────────────────────────────

export function PianoRoll() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [tracks, setTracks] = useState<Track[]>(() => [createDefaultTrack(0)]);
  const [selectedTrackId, setSelectedTrackId] = useState<string>('');
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [totalBeats, setTotalBeats] = useState<number>(16);
  const [scrollX, setScrollX] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [hoverRow, setHoverRow] = useState(-1);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 500 });
  const [editingTrackName, setEditingTrackName] = useState<string | null>(null);

  // Refs for playback
  const playStartRef = useRef(0);
  const playBeatRef = useRef(0);
  const rafRef = useRef(0);
  const scheduledRef = useRef(false);
  const isPlayingRef = useRef(false);

  // Drag-resize state
  const [resizingNote, setResizingNote] = useState<{
    noteId: string;
    trackId: string;
    startX: number;
    originalDuration: number;
  } | null>(null);

  // Initialise selectedTrackId to match the first track
  useEffect(() => {
    if (tracks.length > 0 && !tracks.find(t => t.id === selectedTrackId)) {
      setSelectedTrackId(tracks[0].id);
    }
  }, [tracks, selectedTrackId]);

  // ── Canvas sizing ──────────────────────────────────────────────────────────

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        setCanvasSize({ w: e.contentRect.width, h: e.contentRect.height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Derived grid dimensions ────────────────────────────────────────────────

  const gridWidth = totalBeats * BEAT_WIDTH;
  const maxScrollX = Math.max(0, gridWidth - (canvasSize.w - KEY_WIDTH));
  const maxScrollY = Math.max(0, GRID_HEIGHT - (canvasSize.h - HEADER_HEIGHT));

  // ── Drawing ────────────────────────────────────────────────────────────────

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const viewW = w - KEY_WIDTH;
    const viewH = h - HEADER_HEIGHT;

    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    // ── Piano keys column ────────────────────────────────────────────────
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, HEADER_HEIGHT, KEY_WIDTH, viewH);
    ctx.clip();

    for (let midi = MIDI_HIGH - 1; midi >= MIDI_LOW; midi--) {
      const rowIdx = MIDI_HIGH - 1 - midi;
      const y = HEADER_HEIGHT + rowIdx * ROW_HEIGHT - scrollY;
      if (y + ROW_HEIGHT < HEADER_HEIGHT || y > h) continue;

      const black = isBlackKey(midi);
      ctx.fillStyle = black ? '#1e1e32' : '#2a2a44';
      ctx.fillRect(0, y, KEY_WIDTH, ROW_HEIGHT);
      ctx.strokeStyle = '#333355';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(0, y, KEY_WIDTH, ROW_HEIGHT);

      // Label C notes
      const { name, octave } = midiToNoteName(midi);
      if (name === 'C') {
        ctx.fillStyle = '#ccc';
        ctx.font = '10px monospace';
        ctx.textBaseline = 'middle';
        ctx.fillText(`C${octave}`, 4, y + ROW_HEIGHT / 2);
      }
    }
    ctx.restore();

    // ── Beat header ──────────────────────────────────────────────────────
    ctx.save();
    ctx.beginPath();
    ctx.rect(KEY_WIDTH, 0, viewW, HEADER_HEIGHT);
    ctx.clip();

    ctx.fillStyle = '#16162a';
    ctx.fillRect(KEY_WIDTH, 0, viewW, HEADER_HEIGHT);

    for (let beat = 0; beat <= totalBeats; beat++) {
      const x = KEY_WIDTH + beat * BEAT_WIDTH - scrollX;
      if (x < KEY_WIDTH - BEAT_WIDTH || x > w) continue;
      ctx.fillStyle = '#888';
      ctx.font = '10px monospace';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`${beat + 1}`, x + 3, HEADER_HEIGHT - 4);
    }
    ctx.restore();

    // ── Grid area ────────────────────────────────────────────────────────
    ctx.save();
    ctx.beginPath();
    ctx.rect(KEY_WIDTH, HEADER_HEIGHT, viewW, viewH);
    ctx.clip();

    // Row backgrounds
    for (let midi = MIDI_HIGH - 1; midi >= MIDI_LOW; midi--) {
      const rowIdx = MIDI_HIGH - 1 - midi;
      const y = HEADER_HEIGHT + rowIdx * ROW_HEIGHT - scrollY;
      if (y + ROW_HEIGHT < HEADER_HEIGHT || y > h) continue;

      const black = isBlackKey(midi);
      ctx.fillStyle = black ? '#16162a' : '#1a1a2e';
      ctx.fillRect(KEY_WIDTH, y, viewW, ROW_HEIGHT);

      // Hover highlight
      if (rowIdx === hoverRow) {
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(KEY_WIDTH, y, viewW, ROW_HEIGHT);
      }
    }

    // Horizontal grid lines
    for (let r = 0; r <= TOTAL_ROWS; r++) {
      const y = HEADER_HEIGHT + r * ROW_HEIGHT - scrollY;
      if (y < HEADER_HEIGHT || y > h) continue;
      const midi = MIDI_HIGH - r;
      ctx.strokeStyle = (midi % 12 === 0) ? '#3a3a5e' : '#252544';
      ctx.lineWidth = (midi % 12 === 0) ? 1 : 0.5;
      ctx.beginPath();
      ctx.moveTo(KEY_WIDTH, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Vertical grid lines (16th notes)
    for (let s = 0; s <= totalBeats * 4; s++) {
      const x = KEY_WIDTH + s * SIXTEENTH - scrollX;
      if (x < KEY_WIDTH || x > w) continue;
      const isBeat = s % 4 === 0;
      ctx.strokeStyle = isBeat ? '#3a3a5e' : '#222240';
      ctx.lineWidth = isBeat ? 1 : 0.5;
      ctx.beginPath();
      ctx.moveTo(x, HEADER_HEIGHT);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // ── Notes ────────────────────────────────────────────────────────────
    for (const track of tracks) {
      for (const note of track.notes) {
        const rowIdx = MIDI_HIGH - 1 - note.midi;
        const y = HEADER_HEIGHT + rowIdx * ROW_HEIGHT - scrollY;
        const x = KEY_WIDTH + note.startBeat * BEAT_WIDTH - scrollX;
        const noteW = note.duration * BEAT_WIDTH;

        if (x + noteW < KEY_WIDTH || x > w || y + ROW_HEIGHT < HEADER_HEIGHT || y > h) continue;

        const alpha = 0.4 + (note.velocity / 127) * 0.55;
        ctx.fillStyle = hexToRgba(track.color, alpha);
        roundRect(ctx, x, y + 1, noteW - 1, ROW_HEIGHT - 2, 3);
        ctx.fill();

        // Border
        ctx.strokeStyle = track.color;
        ctx.lineWidth = track.id === selectedTrackId ? 1.5 : 0.8;
        roundRect(ctx, x, y + 1, noteW - 1, ROW_HEIGHT - 2, 3);
        ctx.stroke();

        // Resize handle
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(x + noteW - 5, y + 1, 4, ROW_HEIGHT - 2);
      }
    }

    // ── Playback cursor ──────────────────────────────────────────────────
    if (isPlayingRef.current) {
      const cx = KEY_WIDTH + playBeatRef.current * BEAT_WIDTH - scrollX;
      if (cx >= KEY_WIDTH && cx <= w) {
        ctx.strokeStyle = '#ff5252';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, HEADER_HEIGHT);
        ctx.lineTo(cx, h);
        ctx.stroke();
      }
    }

    ctx.restore();

    // Corner fill
    ctx.fillStyle = '#16162a';
    ctx.fillRect(0, 0, KEY_WIDTH, HEADER_HEIGHT);
  }, [scrollX, scrollY, hoverRow, tracks, totalBeats, selectedTrackId]);

  // ── Render loop ────────────────────────────────────────────────────────────

  useEffect(() => {
    let running = true;
    const loop = () => {
      if (!running) return;
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => { running = false; cancelAnimationFrame(rafRef.current); };
  }, [draw]);

  // ── Mouse helpers ──────────────────────────────────────────────────────────

  const gridCoordsFromEvent = (e: React.MouseEvent): { beat: number; midi: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    if (px < KEY_WIDTH || py < HEADER_HEIGHT) return null;

    const gx = px - KEY_WIDTH + scrollX;
    const gy = py - HEADER_HEIGHT + scrollY;

    const beatExact = gx / BEAT_WIDTH;
    const beat = Math.floor(beatExact * 4) / 4; // snap to 16th
    const rowIdx = Math.floor(gy / ROW_HEIGHT);
    const midi = MIDI_HIGH - 1 - rowIdx;

    if (midi < MIDI_LOW || midi >= MIDI_HIGH || beat < 0 || beat >= totalBeats) return null;
    return { beat, midi };
  };

  const findNoteAt = (beat: number, midi: number): { note: PianoRollNote; track: Track } | null => {
    for (const track of tracks) {
      for (const note of track.notes) {
        if (note.midi === midi && beat >= note.startBeat && beat < note.startBeat + note.duration) {
          return { note, track };
        }
      }
    }
    return null;
  };

  const isOnResizeHandle = (e: React.MouseEvent, note: PianoRollNote): boolean => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const noteRightX = KEY_WIDTH + (note.startBeat + note.duration) * BEAT_WIDTH - scrollX;
    return Math.abs(px - noteRightX) < 8;
  };

  // ── Mouse events ───────────────────────────────────────────────────────────

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 2) return; // handled by context menu

    const coords = gridCoordsFromEvent(e);
    if (!coords) return;

    const existing = findNoteAt(coords.beat, coords.midi);

    if (existing && isOnResizeHandle(e, existing.note)) {
      // Start resize
      setResizingNote({
        noteId: existing.note.id,
        trackId: existing.track.id,
        startX: e.clientX,
        originalDuration: existing.note.duration,
      });
      return;
    }

    if (existing) {
      // Select the track of the clicked note
      setSelectedTrackId(existing.track.id);
      return;
    }

    // Place new note
    const selectedTrack = tracks.find(t => t.id === selectedTrackId);
    if (!selectedTrack) return;

    const newNote: PianoRollNote = {
      id: uid(),
      midi: coords.midi,
      startBeat: coords.beat,
      duration: 1,
      velocity: 100,
      trackId: selectedTrackId,
    };

    setTracks(prev => prev.map(t =>
      t.id === selectedTrackId ? { ...t, notes: [...t.notes, newNote] } : t
    ));

    // Audition
    try {
      const ctx = getAudioContext();
      const gain = getMasterGain();
      playNote(ctx, gain, selectedTrack.instrument, coords.midi, 100, undefined, 0.3);
    } catch { /* ignore */ }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Hover row tracking
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const py = e.clientY - rect.top;
    if (py > HEADER_HEIGHT) {
      const gy = py - HEADER_HEIGHT + scrollY;
      setHoverRow(Math.floor(gy / ROW_HEIGHT));
    } else {
      setHoverRow(-1);
    }

    // Handle resize drag
    if (resizingNote) {
      const dx = e.clientX - resizingNote.startX;
      const dBeats = Math.round((dx / BEAT_WIDTH) * 4) / 4; // snap to 16th
      const newDur = Math.max(0.25, resizingNote.originalDuration + dBeats);

      setTracks(prev => prev.map(t =>
        t.id === resizingNote.trackId
          ? {
            ...t,
            notes: t.notes.map(n =>
              n.id === resizingNote.noteId ? { ...n, duration: newDur } : n
            ),
          }
          : t
      ));
    }

    // Cursor style
    const coords = gridCoordsFromEvent(e);
    if (coords) {
      const existing = findNoteAt(coords.beat, coords.midi);
      if (existing && isOnResizeHandle(e, existing.note)) {
        canvas.style.cursor = 'ew-resize';
      } else {
        canvas.style.cursor = 'crosshair';
      }
    }
  };

  const handleMouseUp = () => {
    setResizingNote(null);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const coords = gridCoordsFromEvent(e);
    if (!coords) return;

    const existing = findNoteAt(coords.beat, coords.midi);
    if (existing) {
      setTracks(prev => prev.map(t =>
        t.id === existing.track.id
          ? { ...t, notes: t.notes.filter(n => n.id !== existing.note.id) }
          : t
      ));
    }
  };

  // ── Scrolling ──────────────────────────────────────────────────────────────

  const handleWheel = (e: React.WheelEvent) => {
    if (e.shiftKey) {
      setScrollX(prev => Math.max(0, Math.min(maxScrollX, prev + e.deltaY)));
    } else {
      setScrollY(prev => Math.max(0, Math.min(maxScrollY, prev + e.deltaY)));
    }
  };

  // ── Playback ───────────────────────────────────────────────────────────────

  const startPlayback = useCallback(() => {
    const ctx = getAudioContext();
    const master = getMasterGain();
    isPlayingRef.current = true;
    setIsPlaying(true);

    const secPerBeat = 60 / bpm;
    const totalSec = totalBeats * secPerBeat;

    const scheduleAllNotes = (offset: number) => {
      const hasSolo = tracks.some(t => t.solo);

      for (const track of tracks) {
        if (track.muted) continue;
        if (hasSolo && !track.solo) continue;

        const trackGain = ctx.createGain();
        trackGain.gain.value = track.volume;
        trackGain.connect(master);

        for (const note of track.notes) {
          const noteStart = offset + note.startBeat * secPerBeat;
          const noteDur = note.duration * secPerBeat;
          if (noteStart >= offset + totalSec) continue;
          playNote(ctx, trackGain, track.instrument, note.midi, note.velocity, noteStart, noteDur);
        }
      }
    };

    playStartRef.current = ctx.currentTime;
    playBeatRef.current = 0;
    scheduledRef.current = false;

    // Schedule first pass
    scheduleAllNotes(ctx.currentTime);

    // Cursor animation
    const animate = () => {
      if (!isPlayingRef.current) return;
      const ctx2 = getAudioContext();
      const elapsed = ctx2.currentTime - playStartRef.current;
      const secPerBeat2 = 60 / bpm;
      const totalSec2 = totalBeats * secPerBeat2;
      const loopTime = elapsed % totalSec2;
      playBeatRef.current = loopTime / secPerBeat2;
      setCurrentBeat(playBeatRef.current);

      // Schedule next loop ahead of time
      const loopCount = Math.floor(elapsed / totalSec2);
      if (loopCount >= 1 && !scheduledRef.current) {
        scheduledRef.current = true;
        // Will be re-triggered via effect
      }

      rafRef.current = requestAnimationFrame(animate);
    };
    animate();
  }, [bpm, totalBeats, tracks]);

  const stopPlayback = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    playBeatRef.current = 0;
    setCurrentBeat(0);
  }, []);

  const togglePlayback = () => {
    if (isPlaying) stopPlayback();
    else startPlayback();
  };

  // Stop playback on unmount
  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // ── Export ─────────────────────────────────────────────────────────────────

  const handleExport = async () => {
    try {
      const blob = await exportToWAV(tracks, bpm, totalBeats);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `piano-roll-${Date.now()}.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  // ── Track management ───────────────────────────────────────────────────────

  const addTrack = () => {
    if (tracks.length >= MAX_TRACKS) return;
    const newTrack = createDefaultTrack(tracks.length);
    setTracks(prev => [...prev, newTrack]);
    setSelectedTrackId(newTrack.id);
  };

  const deleteTrack = (id: string) => {
    if (tracks.length <= 1) return;
    setTracks(prev => prev.filter(t => t.id !== id));
    if (selectedTrackId === id) {
      setSelectedTrackId(tracks.find(t => t.id !== id)?.id ?? '');
    }
  };

  const updateTrack = (id: string, updates: Partial<Track>) => {
    setTracks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const toggleMute = (id: string) => {
    setTracks(prev => prev.map(t => t.id === id ? { ...t, muted: !t.muted } : t));
  };

  const toggleSolo = (id: string) => {
    setTracks(prev => prev.map(t => t.id === id ? { ...t, solo: !t.solo } : t));
  };

  const clearTrack = (id: string) => {
    setTracks(prev => prev.map(t => t.id === id ? { ...t, notes: [] } : t));
  };

  const clearAllNotes = () => {
    setTracks(prev => prev.map(t => ({ ...t, notes: [] })));
  };

  const loadPreset = (presetName: string) => {
    const preset = PRESET_PATTERNS[presetName];
    if (!preset) return;
    if (isPlaying) stopPlayback();
    setBpm(preset.bpm);
    setTotalBeats(preset.beats);
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
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={styles.container}>
      {/* Transport Bar */}
      <div style={styles.transport}>
        <button onClick={togglePlayback} style={styles.playBtn}>
          {isPlaying ? '\u25A0 Stop' : '\u25B6 Play'}
        </button>

        <div style={styles.transportGroup}>
          <label style={styles.label}>BPM</label>
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
          <label style={styles.label}>Beats</label>
          <select
            value={totalBeats}
            onChange={e => setTotalBeats(Number(e.target.value))}
            style={styles.select}
          >
            <option value={16}>16</option>
            <option value={32}>32</option>
            <option value={64}>64</option>
          </select>
        </div>

        <div style={styles.beatDisplay}>
          Beat: {currentBeat.toFixed(1)} / {totalBeats}
        </div>

        <button onClick={handleExport} style={styles.exportBtn}>
          Export WAV
        </button>

        <select
          onChange={e => { if (e.target.value) { loadPreset(e.target.value); e.target.value = ''; } }}
          style={{ ...styles.select, marginLeft: 0 }}
          defaultValue=""
        >
          <option value="" disabled>Presets</option>
          {Object.keys(PRESET_PATTERNS).map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        <button onClick={clearAllNotes} style={{ ...styles.exportBtn, background: '#e57373', marginLeft: 0 }}>
          Clear All
        </button>
      </div>

      <div style={styles.body}>
        {/* Track Sidebar */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <span style={styles.sidebarTitle}>Tracks</span>
            {tracks.length < MAX_TRACKS && (
              <button onClick={addTrack} style={styles.addTrackBtn}>+ Add</button>
            )}
          </div>
          <div style={styles.trackList}>
            {tracks.map(track => (
              <div
                key={track.id}
                style={{
                  ...styles.trackItem,
                  borderLeft: `4px solid ${track.color}`,
                  background: track.id === selectedTrackId ? '#2a2a48' : '#1e1e36',
                }}
                onClick={() => setSelectedTrackId(track.id)}
              >
                <div style={styles.trackRow}>
                  <div
                    style={{ ...styles.colorDot, background: track.color }}
                  />
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
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingTrackName(track.id);
                      }}
                    >
                      {track.name}
                    </span>
                  )}
                  {tracks.length > 1 && (
                    <button
                      onClick={e => { e.stopPropagation(); deleteTrack(track.id); }}
                      style={styles.deleteBtn}
                      title="Delete track"
                    >
                      x
                    </button>
                  )}
                  {track.notes.length > 0 && (
                    <button
                      onClick={e => { e.stopPropagation(); clearTrack(track.id); }}
                      style={{ ...styles.deleteBtn, color: '#e57373' }}
                      title="Clear track notes"
                    >
                      C
                    </button>
                  )}
                </div>

                <div style={styles.trackRow}>
                  <select
                    value={track.instrument}
                    onChange={e => {
                      e.stopPropagation();
                      updateTrack(track.id, { instrument: e.target.value as InstrumentType });
                    }}
                    style={styles.instrSelect}
                    onClick={e => e.stopPropagation()}
                  >
                    {INSTRUMENTS.map(i => (
                      <option key={i} value={i}>{i.charAt(0).toUpperCase() + i.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.trackRow}>
                  <label style={styles.volLabel}>Vol</label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={track.volume}
                    onChange={e => { e.stopPropagation(); updateTrack(track.id, { volume: Number(e.target.value) }); }}
                    onClick={e => e.stopPropagation()}
                    style={styles.volumeSlider}
                  />
                </div>

                <div style={styles.trackRow}>
                  <button
                    onClick={e => { e.stopPropagation(); toggleMute(track.id); }}
                    style={{
                      ...styles.toggleBtn,
                      background: track.muted ? '#e57373' : '#333358',
                      color: track.muted ? '#fff' : '#888',
                    }}
                  >
                    M
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); toggleSolo(track.id); }}
                    style={{
                      ...styles.toggleBtn,
                      background: track.solo ? '#ffb74d' : '#333358',
                      color: track.solo ? '#000' : '#888',
                    }}
                  >
                    S
                  </button>
                  <span style={styles.noteCount}>
                    {track.notes.length} notes
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Canvas Grid */}
        <div
          ref={containerRef}
          style={styles.gridContainer}
          onWheel={handleWheel}
        >
          <canvas
            ref={canvasRef}
            width={canvasSize.w}
            height={canvasSize.h}
            style={styles.canvas}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => { setHoverRow(-1); handleMouseUp(); }}
            onContextMenu={handleContextMenu}
          />

          {/* Scrollbars */}
          {maxScrollX > 0 && (
            <div style={styles.hScrollTrack}>
              <div
                style={{
                  ...styles.hScrollThumb,
                  width: `${Math.max(30, ((canvasSize.w - KEY_WIDTH) / gridWidth) * 100)}%`,
                  left: `${(scrollX / maxScrollX) * (100 - Math.max(30, ((canvasSize.w - KEY_WIDTH) / gridWidth) * 100))}%`,
                }}
              />
            </div>
          )}
          {maxScrollY > 0 && (
            <div style={styles.vScrollTrack}>
              <div
                style={{
                  ...styles.vScrollThumb,
                  height: `${Math.max(30, ((canvasSize.h - HEADER_HEIGHT) / GRID_HEIGHT) * 100)}%`,
                  top: `${(scrollY / maxScrollY) * (100 - Math.max(30, ((canvasSize.h - HEADER_HEIGHT) / GRID_HEIGHT) * 100))}%`,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div style={styles.statusBar}>
        <span>
          {tracks.length} track{tracks.length !== 1 ? 's' : ''} |{' '}
          {tracks.reduce((sum, t) => sum + t.notes.length, 0)} total notes |{' '}
          Scroll: Wheel (vertical), Shift+Wheel (horizontal) |{' '}
          Right-click to delete note
        </span>
      </div>
    </div>
  );
}

// ── Canvas helpers ─────────────────────────────────────────────────────────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
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

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── Inline Styles ──────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#12122a',
    color: '#ccc',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: 12,
    overflow: 'hidden',
    userSelect: 'none',
  },

  // Transport
  transport: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '8px 12px',
    background: '#16162e',
    borderBottom: '1px solid #2a2a48',
    flexShrink: 0,
  },
  playBtn: {
    padding: '6px 16px',
    background: '#4fc3f7',
    color: '#000',
    border: 'none',
    borderRadius: 4,
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 12,
  },
  transportGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    color: '#888',
    fontSize: 11,
  },
  bpmInput: {
    width: 50,
    padding: '4px 6px',
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
    fontSize: 12,
  },
  beatDisplay: {
    color: '#aaa',
    fontFamily: 'monospace',
    fontSize: 12,
    minWidth: 100,
  },
  exportBtn: {
    padding: '6px 12px',
    background: '#81c784',
    color: '#000',
    border: 'none',
    borderRadius: 4,
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 12,
    marginLeft: 'auto',
  },

  // Body
  body: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },

  // Sidebar
  sidebar: {
    width: 200,
    minWidth: 200,
    display: 'flex',
    flexDirection: 'column',
    background: '#14142c',
    borderRight: '1px solid #2a2a48',
    overflow: 'hidden',
  },
  sidebarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 10px',
    borderBottom: '1px solid #2a2a48',
  },
  sidebarTitle: {
    fontWeight: 700,
    fontSize: 13,
    color: '#ddd',
  },
  addTrackBtn: {
    padding: '3px 8px',
    background: '#333358',
    color: '#aaa',
    border: 'none',
    borderRadius: 3,
    cursor: 'pointer',
    fontSize: 11,
  },
  trackList: {
    flex: 1,
    overflowY: 'auto' as const,
  },
  trackItem: {
    padding: '8px 10px',
    borderBottom: '1px solid #222244',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },
  trackRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    flexShrink: 0,
  },
  trackName: {
    flex: 1,
    fontSize: 12,
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    cursor: 'text',
  },
  trackNameInput: {
    flex: 1,
    background: '#1a1a36',
    color: '#ddd',
    border: '1px solid #444',
    borderRadius: 2,
    padding: '1px 4px',
    fontSize: 12,
    fontWeight: 600,
    outline: 'none',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: '#666',
    cursor: 'pointer',
    fontSize: 13,
    padding: '0 4px',
    lineHeight: 1,
  },
  instrSelect: {
    flex: 1,
    padding: '2px 4px',
    background: '#1e1e38',
    color: '#ccc',
    border: '1px solid #333358',
    borderRadius: 3,
    fontSize: 11,
  },
  volLabel: {
    color: '#777',
    fontSize: 10,
    width: 20,
  },
  volumeSlider: {
    flex: 1,
    height: 4,
    accentColor: '#4fc3f7',
  },
  toggleBtn: {
    padding: '2px 8px',
    border: 'none',
    borderRadius: 3,
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 700,
  },
  noteCount: {
    marginLeft: 'auto',
    fontSize: 10,
    color: '#666',
  },

  // Grid container
  gridContainer: {
    flex: 1,
    position: 'relative' as const,
    overflow: 'hidden',
  },
  canvas: {
    display: 'block',
  },

  // Scrollbars
  hScrollTrack: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 12,
    height: 10,
    background: '#111128',
  },
  hScrollThumb: {
    position: 'absolute' as const,
    height: '100%',
    background: '#333358',
    borderRadius: 5,
  },
  vScrollTrack: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    bottom: 12,
    width: 10,
    background: '#111128',
  },
  vScrollThumb: {
    position: 'absolute' as const,
    width: '100%',
    background: '#333358',
    borderRadius: 5,
  },

  // Status bar
  statusBar: {
    padding: '4px 12px',
    background: '#16162e',
    borderTop: '1px solid #2a2a48',
    display: 'flex',
    alignItems: 'center',
    fontSize: 11,
    color: '#666',
    flexShrink: 0,
  },
};
