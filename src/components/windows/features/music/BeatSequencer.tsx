import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getAudioContext, getMasterGain } from './audio/AudioEngine';
import { playDrumHit } from './audio/synthesis';
import { DRUM_NAMES } from './audio/constants';

const ROW_COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500',
  'bg-teal-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500',
];

const PRESETS: Record<string, boolean[][]> = {
  'Basic Rock': (() => {
    const g = Array(8).fill(null).map(() => Array(16).fill(false));
    [0, 8].forEach(i => (g[0][i] = true));
    [4, 12].forEach(i => (g[1][i] = true));
    [0, 2, 4, 6, 8, 10, 12, 14].forEach(i => (g[2][i] = true));
    return g;
  })(),
  'Funk': (() => {
    const g = Array(8).fill(null).map(() => Array(16).fill(false));
    [0, 6, 10].forEach(i => (g[0][i] = true));
    [4, 12].forEach(i => (g[1][i] = true));
    [0, 2, 4, 6, 8, 10, 12, 14].forEach(i => (g[2][i] = true));
    [3, 7, 15].forEach(i => (g[3][i] = true));
    [4, 12].forEach(i => (g[6][i] = true));
    return g;
  })(),
  'Techno': (() => {
    const g = Array(8).fill(null).map(() => Array(16).fill(false));
    [0, 4, 8, 12].forEach(i => (g[0][i] = true));
    [4, 12].forEach(i => (g[6][i] = true));
    [0, 2, 4, 6, 8, 10, 12, 14].forEach(i => (g[2][i] = true));
    [2, 6, 10, 14].forEach(i => (g[3][i] = true));
    return g;
  })(),
  'Hip-Hop': (() => {
    const g = Array(8).fill(null).map(() => Array(16).fill(false));
    [0, 5, 10].forEach(i => (g[0][i] = true));
    [4, 12].forEach(i => (g[1][i] = true));
    [0, 2, 4, 6, 8, 10, 12, 14].forEach(i => (g[2][i] = true));
    [4].forEach(i => (g[6][i] = true));
    return g;
  })(),
  'Reggaeton': (() => {
    const g = Array(8).fill(null).map(() => Array(16).fill(false));
    [0, 3, 4, 7, 8, 11, 12, 15].forEach(i => (g[0][i] = true));
    [4, 12].forEach(i => (g[1][i] = true));
    [0, 2, 4, 6, 8, 10, 12, 14].forEach(i => (g[2][i] = true));
    [2, 6, 10, 14].forEach(i => (g[3][i] = true));
    [4, 12].forEach(i => (g[6][i] = true));
    return g;
  })(),
  'Trap': (() => {
    const g = Array(8).fill(null).map(() => Array(16).fill(false));
    [0, 7, 14].forEach(i => (g[0][i] = true));
    [4, 12].forEach(i => (g[1][i] = true));
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].forEach(i => (g[2][i] = true));
    [2, 6, 10, 14].forEach(i => (g[3][i] = true));
    [6].forEach(i => (g[6][i] = true));
    return g;
  })(),
  'House': (() => {
    const g = Array(8).fill(null).map(() => Array(16).fill(false));
    [0, 4, 8, 12].forEach(i => (g[0][i] = true));
    [4, 12].forEach(i => (g[1][i] = true));
    [2, 6, 10, 14].forEach(i => (g[2][i] = true));
    [0, 4, 8, 12].forEach(i => (g[3][i] = true));
    [4, 12].forEach(i => (g[6][i] = true));
    [2, 10].forEach(i => (g[7][i] = true));
    return g;
  })(),
  'DnB': (() => {
    const g = Array(8).fill(null).map(() => Array(16).fill(false));
    [0, 10].forEach(i => (g[0][i] = true));
    [4, 14].forEach(i => (g[1][i] = true));
    [0, 2, 4, 6, 8, 10, 12, 14].forEach(i => (g[2][i] = true));
    [1, 5, 9, 13].forEach(i => (g[3][i] = true));
    [8].forEach(i => (g[7][i] = true));
    return g;
  })(),
  'Bossa Nova': (() => {
    const g = Array(8).fill(null).map(() => Array(16).fill(false));
    [0, 6, 10].forEach(i => (g[0][i] = true));
    [8].forEach(i => (g[1][i] = true));
    [0, 3, 6, 8, 10, 13].forEach(i => (g[2][i] = true));
    [2, 6, 10, 14].forEach(i => (g[7][i] = true));
    [0, 3, 6, 10].forEach(i => (g[4][i] = true));
    return g;
  })(),
  'Disco': (() => {
    const g = Array(8).fill(null).map(() => Array(16).fill(false));
    [0, 4, 8, 12].forEach(i => (g[0][i] = true));
    [4, 12].forEach(i => (g[1][i] = true));
    [0, 2, 4, 6, 8, 10, 12, 14].forEach(i => (g[3][i] = true));
    [0, 4, 8, 12].forEach(i => (g[6][i] = true));
    [2, 6, 10, 14].forEach(i => (g[2][i] = true));
    return g;
  })(),
  'Breakbeat': (() => {
    const g = Array(8).fill(null).map(() => Array(16).fill(false));
    [0, 4, 9, 13].forEach(i => (g[0][i] = true));
    [4, 10].forEach(i => (g[1][i] = true));
    [0, 2, 4, 6, 8, 10, 12, 14].forEach(i => (g[2][i] = true));
    [1, 7, 11, 15].forEach(i => (g[3][i] = true));
    [12].forEach(i => (g[4][i] = true));
    return g;
  })(),
  'Latin': (() => {
    const g = Array(8).fill(null).map(() => Array(16).fill(false));
    [0, 3, 7, 10, 12].forEach(i => (g[0][i] = true));
    [4, 12].forEach(i => (g[1][i] = true));
    [0, 3, 4, 6, 7, 10, 12, 14].forEach(i => (g[2][i] = true));
    [0, 3, 6, 10].forEach(i => (g[4][i] = true));
    [2, 8, 14].forEach(i => (g[6][i] = true));
    return g;
  })(),
};

export function BeatSequencer() {
  const [grid, setGrid] = useState<boolean[][]>(() => Array(8).fill(null).map(() => Array(16).fill(false)));
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [currentStep, setCurrentStep] = useState(-1);
  const [swing, setSwing] = useState(0);
  const [volumes, setVolumes] = useState<number[]>(() => Array(8).fill(0.8));
  const [muted, setMuted] = useState<boolean[]>(() => Array(8).fill(false));
  const [savedPatterns, setSavedPatterns] = useState<(boolean[][] | null)[]>([null, null, null, null]);
  const [tapTimes, setTapTimes] = useState<number[]>([]);

  const gridRef = useRef(grid);
  const volumesRef = useRef(volumes);
  const mutedRef = useRef(muted);
  const bpmRef = useRef(bpm);
  const swingRef = useRef(swing);
  const timerRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef(0);
  const currentStepRef = useRef(0);
  const isPlayingRef = useRef(false);

  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { volumesRef.current = volumes; }, [volumes]);
  useEffect(() => { mutedRef.current = muted; }, [muted]);
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { swingRef.current = swing; }, [swing]);

  const scheduleNote = useCallback((stepIndex: number, time: number) => {
    const ctx = getAudioContext();
    for (let row = 0; row < 8; row++) {
      if (gridRef.current[row][stepIndex] && !mutedRef.current[row]) {
        const g = ctx.createGain();
        g.gain.value = volumesRef.current[row] * 2.5;
        g.connect(getMasterGain());
        playDrumHit(ctx, g, row, time);
      }
    }
  }, []);

  const scheduler = useCallback(() => {
    const ctx = getAudioContext();
    const SCHEDULE_AHEAD = 0.1;
    const LOOKAHEAD_MS = 25;

    while (nextNoteTimeRef.current < ctx.currentTime + SCHEDULE_AHEAD) {
      const step = currentStepRef.current;
      scheduleNote(step, nextNoteTimeRef.current);
      setCurrentStep(step);

      const secondsPerStep = 60.0 / bpmRef.current / 4;
      let nextTime = secondsPerStep;
      if (step % 2 === 0 && swingRef.current > 0) {
        nextTime *= (1 + swingRef.current / 200);
      } else if (step % 2 === 1 && swingRef.current > 0) {
        nextTime *= (1 - swingRef.current / 200);
      }
      nextNoteTimeRef.current += nextTime;
      currentStepRef.current = (step + 1) % 16;
    }

    timerRef.current = window.setTimeout(scheduler, LOOKAHEAD_MS);
  }, [scheduleNote]);

  const startPlayback = useCallback(() => {
    if (isPlayingRef.current) return;
    const ctx = getAudioContext();
    isPlayingRef.current = true;
    currentStepRef.current = 0;
    nextNoteTimeRef.current = ctx.currentTime;
    setIsPlaying(true);
    scheduler();
  }, [scheduler]);

  const stopPlayback = useCallback(() => {
    isPlayingRef.current = false;
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
    setCurrentStep(-1);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  const toggleCell = (row: number, col: number) => {
    setGrid(prev => {
      const next = prev.map(r => [...r]);
      next[row][col] = !next[row][col];
      return next;
    });
  };

  const clearGrid = () => setGrid(Array(8).fill(null).map(() => Array(16).fill(false)));

  const loadPreset = (name: string) => {
    if (PRESETS[name]) setGrid(PRESETS[name].map(r => [...r]));
  };

  const savePattern = (slot: number) => {
    const patterns = [...savedPatterns];
    patterns[slot] = grid.map(r => [...r]);
    setSavedPatterns(patterns);
  };

  const loadPattern = (slot: number) => {
    if (savedPatterns[slot]) setGrid(savedPatterns[slot]!.map(r => [...r]));
  };

  const handleTapTempo = () => {
    const now = Date.now();
    const newTaps = [...tapTimes, now].filter(t => now - t < 3000);
    setTapTimes(newTaps);
    if (newTaps.length >= 2) {
      const intervals = [];
      for (let i = 1; i < newTaps.length; i++) intervals.push(newTaps[i] - newTaps[i - 1]);
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      setBpm(Math.round(Math.max(60, Math.min(200, 60000 / avg))));
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white p-4 overflow-auto">
      {/* Transport Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button
          onClick={isPlaying ? stopPlayback : startPlayback}
          className={`px-4 py-2 rounded-lg font-medium text-sm ${isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {isPlaying ? 'Stop' : 'Play'}
        </button>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">BPM:</label>
          <input
            type="range" min={60} max={200} value={bpm}
            onChange={e => setBpm(Number(e.target.value))}
            className="w-24 accent-blue-500"
          />
          <span className="text-sm font-mono w-8">{bpm}</span>
        </div>
        <button onClick={handleTapTempo} className="px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600">Tap Tempo</button>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Swing:</label>
          <input
            type="range" min={0} max={100} value={swing}
            onChange={e => setSwing(Number(e.target.value))}
            className="w-20 accent-amber-500"
          />
          <span className="text-xs text-gray-500 w-8">{swing}%</span>
        </div>
      </div>

      {/* Presets & Patterns */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-sm text-gray-400">Presets:</span>
        {Object.keys(PRESETS).map(name => (
          <button key={name} onClick={() => loadPreset(name)} className="px-2 py-1 bg-gray-700 rounded text-xs hover:bg-gray-600">{name}</button>
        ))}
        <button onClick={clearGrid} className="px-2 py-1 bg-gray-700 rounded text-xs hover:bg-gray-600 text-red-400">Clear</button>
        <div className="ml-auto flex gap-1">
          {savedPatterns.map((pat, i) => (
            <div key={i} className="flex gap-0.5">
              <button onClick={() => savePattern(i)} className="px-2 py-1 bg-gray-700 rounded-l text-xs hover:bg-gray-600">S{i + 1}</button>
              <button onClick={() => loadPattern(i)} className={`px-2 py-1 rounded-r text-xs ${pat ? 'bg-blue-700 hover:bg-blue-600' : 'bg-gray-800 text-gray-600'}`} disabled={!pat}>L{i + 1}</button>
            </div>
          ))}
        </div>
      </div>

      {/* Sequencer Grid */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-fit">
          {grid.map((row, ri) => (
            <div key={ri} className="flex items-center gap-1 mb-1">
              {/* Row label & controls */}
              <div className="w-20 flex items-center gap-1 shrink-0">
                <button
                  onClick={() => { const m = [...muted]; m[ri] = !m[ri]; setMuted(m); }}
                  className={`w-5 h-5 rounded text-xs ${muted[ri] ? 'bg-gray-700 text-gray-500' : 'bg-gray-600 text-white'}`}
                >
                  {muted[ri] ? 'M' : ''}
                </button>
                <span className={`text-xs truncate ${muted[ri] ? 'text-gray-600' : 'text-gray-300'}`}>{DRUM_NAMES[ri]}</span>
              </div>
              {/* Step cells */}
              <div className="flex gap-0.5">
                {row.map((active, ci) => (
                  <React.Fragment key={ci}>
                    {ci > 0 && ci % 4 === 0 && <div className="w-1" />}
                    <button
                      onClick={() => toggleCell(ri, ci)}
                      className={`w-8 h-8 rounded transition-all duration-75 ${
                        currentStep === ci ? 'ring-2 ring-white ring-opacity-50' : ''
                      } ${
                        active
                          ? `${ROW_COLORS[ri]} ${muted[ri] ? 'opacity-30' : ''}`
                          : `bg-gray-800 hover:bg-gray-700 ${currentStep === ci ? 'bg-gray-700' : ''}`
                      }`}
                    />
                  </React.Fragment>
                ))}
              </div>
              {/* Volume slider */}
              <input
                type="range" min={0} max={100} value={volumes[ri] * 100}
                onChange={e => { const v = [...volumes]; v[ri] = Number(e.target.value) / 100; setVolumes(v); }}
                className="w-16 accent-gray-400 ml-2 shrink-0"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
