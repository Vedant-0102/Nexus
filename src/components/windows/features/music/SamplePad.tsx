import { useState, useRef, useEffect, useCallback } from 'react';
import { getAudioContext, getMasterGain } from './audio/AudioEngine';
import { PAD_KEY_MAP } from './audio/constants';

interface PadData {
  buffer: AudioBuffer | null;
  name: string;
  volume: number;
  pitch: number;
  source: AudioBufferSourceNode | null;
}

const PAD_LABELS = [
  '1', '2', '3', '4',
  'Q', 'W', 'E', 'R',
  'A', 'S', 'D', 'F',
  'Z', 'X', 'C', 'V',
];

const ROW_COLORS = [
  { bg: 'bg-blue-900/40', border: 'border-blue-500', active: 'bg-blue-500/70', accent: '#3b82f6' },
  { bg: 'bg-green-900/40', border: 'border-green-500', active: 'bg-green-500/70', accent: '#22c55e' },
  { bg: 'bg-orange-900/40', border: 'border-orange-500', active: 'bg-orange-500/70', accent: '#f97316' },
  { bg: 'bg-purple-900/40', border: 'border-purple-500', active: 'bg-purple-500/70', accent: '#a855f7' },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function createDefaultPad(): PadData {
  return { buffer: null, name: '', volume: 0.8, pitch: 1.0, source: null };
}

function drawWaveform(canvas: HTMLCanvasElement, buffer: AudioBuffer, color: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.clearRect(0, 0, w, h);

  const data = buffer.getChannelData(0);
  const step = Math.max(1, Math.floor(data.length / w));
  const mid = h / 2;

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.8;

  for (let x = 0; x < w; x++) {
    const idx = Math.min(x * step, data.length - 1);
    let min = 1, max = -1;
    for (let j = 0; j < step && idx + j < data.length; j++) {
      const val = data[idx + j];
      if (val < min) min = val;
      if (val > max) max = val;
    }
    const y1 = mid + min * mid;
    const y2 = mid + max * mid;
    ctx.moveTo(x, y1);
    ctx.lineTo(x, y2);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
}

export function SamplePad() {
  const [pads, setPads] = useState<PadData[]>(() =>
    Array(16).fill(null).map(() => createDefaultPad())
  );
  const [selectedPad, setSelectedPad] = useState<number>(0);
  const [activePads, setActivePads] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string>('');

  const padRefs = useRef<PadData[]>(pads.map(() => createDefaultPad()));
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>(Array(16).fill(null));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadTargetRef = useRef<number>(0);
  const activeTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  // Keep padRefs in sync with state
  useEffect(() => {
    padRefs.current = pads.map((p) => ({ ...p }));
  }, [pads]);

  const triggerPad = useCallback((index: number) => {
    const pad = padRefs.current[index];
    if (!pad || !pad.buffer) return;

    const ctx = getAudioContext();
    const master = getMasterGain();

    // Stop currently playing source for this pad
    if (pad.source) {
      try { pad.source.stop(); } catch { /* already stopped */ }
    }

    const source = ctx.createBufferSource();
    source.buffer = pad.buffer;
    source.playbackRate.value = pad.pitch;

    const gainNode = ctx.createGain();
    gainNode.gain.value = pad.volume;

    source.connect(gainNode);
    gainNode.connect(master);
    source.start(0);

    // Update ref directly for immediate access
    padRefs.current[index] = { ...padRefs.current[index], source };

    // Visual flash
    setActivePads((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });

    // Clear any existing timer for this pad
    const existing = activeTimers.current.get(index);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      setActivePads((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
      activeTimers.current.delete(index);
    }, 150);
    activeTimers.current.set(index, timer);

    source.onended = () => {
      if (padRefs.current[index]?.source === source) {
        padRefs.current[index] = { ...padRefs.current[index], source: null };
      }
    };
  }, []);

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const key = e.key.toLowerCase();
      const padIndex = PAD_KEY_MAP[key];
      if (padIndex !== undefined) {
        e.preventDefault();
        triggerPad(padIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerPad]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      activeTimers.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  const handleLoadClick = (index: number) => {
    loadTargetRef.current = index;
    fileInputRef.current?.click();
  };

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max is 10MB.`);
      setTimeout(() => setError(''), 4000);
      return;
    }

    setError('');
    const index = loadTargetRef.current;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const ctx = getAudioContext();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      setPads((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], buffer: audioBuffer, name: file.name };
        return next;
      });
      padRefs.current[index] = {
        ...padRefs.current[index],
        buffer: audioBuffer,
        name: file.name,
      };

      // Draw waveform after a short delay to let the canvas mount
      requestAnimationFrame(() => {
        const canvas = canvasRefs.current[index];
        const row = Math.floor(index / 4);
        if (canvas) drawWaveform(canvas, audioBuffer, ROW_COLORS[row].accent);
      });
    } catch {
      setError('Failed to decode audio file. Try a different format.');
      setTimeout(() => setError(''), 4000);
    }
  }, []);

  const handleRemoveSample = (index: number) => {
    const pad = padRefs.current[index];
    if (pad?.source) {
      try { pad.source.stop(); } catch { /* ignore */ }
    }
    setPads((prev) => {
      const next = [...prev];
      next[index] = createDefaultPad();
      return next;
    });
    padRefs.current[index] = createDefaultPad();

    const canvas = canvasRefs.current[index];
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleVolumeChange = (value: number) => {
    const vol = value / 100;
    setPads((prev) => {
      const next = [...prev];
      next[selectedPad] = { ...next[selectedPad], volume: vol };
      return next;
    });
    padRefs.current[selectedPad] = { ...padRefs.current[selectedPad], volume: vol };
  };

  const handlePitchChange = (value: number) => {
    setPads((prev) => {
      const next = [...prev];
      next[selectedPad] = { ...next[selectedPad], pitch: value };
      return next;
    });
    padRefs.current[selectedPad] = { ...padRefs.current[selectedPad], pitch: value };
  };

  const selected = pads[selectedPad];
  const selRow = Math.floor(selectedPad / 4);

  return (
    <div className="flex h-full bg-neutral-950 rounded-xl overflow-hidden">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Pad Grid */}
      <div className="flex-1 flex flex-col p-3 gap-2">
        {/* Error banner */}
        {error && (
          <div className="px-3 py-1.5 bg-red-900/60 border border-red-700 rounded text-red-200 text-xs">
            {error}
          </div>
        )}

        {/* Title bar */}
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-neutral-200 tracking-wide uppercase">
            Sample Pad
          </h2>
          <span className="text-[10px] text-neutral-500">
            Press keys or click pads to trigger
          </span>
        </div>

        {/* 4x4 Grid */}
        <div className="flex-1 grid grid-rows-4 gap-2">
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((col) => {
                const idx = row * 4 + col;
                const pad = pads[idx];
                const colors = ROW_COLORS[row];
                const isActive = activePads.has(idx);
                const isSelected = selectedPad === idx;

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedPad(idx);
                      triggerPad(idx);
                    }}
                    className={`
                      relative flex flex-col items-center justify-center rounded-lg
                      border-2 transition-all duration-75 cursor-pointer select-none
                      ${isActive ? `${colors.active} border-white shadow-lg scale-[0.96]` : colors.bg}
                      ${isSelected && !isActive ? `${colors.border} border-opacity-80` : ''}
                      ${!isSelected && !isActive ? 'border-neutral-700/50' : ''}
                      hover:brightness-125
                    `}
                  >
                    {/* Pad number */}
                    <span className="absolute top-1 left-1.5 text-[9px] text-neutral-500 font-mono">
                      {idx + 1}
                    </span>

                    {/* Key label */}
                    <span className="text-lg font-bold text-neutral-300 leading-none">
                      {PAD_LABELS[idx]}
                    </span>

                    {/* Waveform canvas */}
                    <canvas
                      ref={(el) => { canvasRefs.current[idx] = el; }}
                      className="w-[80%] h-4 mt-0.5"
                    />

                    {/* Sample name */}
                    <span className="text-[8px] text-neutral-400 mt-0.5 max-w-full truncate px-1">
                      {pad.buffer ? pad.name.replace(/\.[^.]+$/, '') : 'Empty'}
                    </span>

                    {/* Load button (shown when no sample) */}
                    {!pad.buffer && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadClick(idx);
                        }}
                        className="absolute bottom-1 right-1 text-[8px] px-1 py-0.5 rounded
                          bg-neutral-700/70 text-neutral-400 hover:bg-neutral-600 hover:text-neutral-200
                          transition-colors cursor-pointer"
                      >
                        Load
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Controls Panel */}
      <div className="w-56 flex flex-col bg-neutral-900 border-l border-neutral-800 p-3 gap-4">
        {/* Selected pad header */}
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold
              border-2 ${ROW_COLORS[selRow].bg} ${ROW_COLORS[selRow].border}`}
          >
            {PAD_LABELS[selectedPad]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-neutral-300 font-medium">
              Pad {selectedPad + 1}
            </div>
            <div className="text-[10px] text-neutral-500 truncate">
              {selected.buffer ? selected.name : 'No sample loaded'}
            </div>
          </div>
        </div>

        {/* Load / Remove buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => handleLoadClick(selectedPad)}
            className="flex-1 px-2 py-1.5 text-xs font-medium rounded-md
              bg-neutral-800 text-neutral-300 border border-neutral-700
              hover:bg-neutral-700 hover:text-white transition-colors"
          >
            Load Sample
          </button>
          {selected.buffer && (
            <button
              onClick={() => handleRemoveSample(selectedPad)}
              className="px-2 py-1.5 text-xs font-medium rounded-md
                bg-red-900/40 text-red-300 border border-red-800
                hover:bg-red-800/60 hover:text-red-200 transition-colors"
            >
              Remove
            </button>
          )}
        </div>

        {/* Volume slider */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium">
              Volume
            </label>
            <span className="text-[10px] text-neutral-400 font-mono">
              {Math.round(selected.volume * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(selected.volume * 100)}
            onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
            className="w-full h-1.5 accent-blue-500 cursor-pointer"
          />
          <div className="flex justify-between text-[8px] text-neutral-600">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Pitch slider */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium">
              Pitch
            </label>
            <span className="text-[10px] text-neutral-400 font-mono">
              {selected.pitch.toFixed(2)}x
            </span>
          </div>
          <input
            type="range"
            min={50}
            max={200}
            value={Math.round(selected.pitch * 100)}
            onChange={(e) => handlePitchChange(parseInt(e.target.value) / 100)}
            className="w-full h-1.5 accent-blue-500 cursor-pointer"
          />
          <div className="flex justify-between text-[8px] text-neutral-600">
            <span>0.5x</span>
            <span>1.0x</span>
            <span>2.0x</span>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-neutral-800" />

        {/* Keyboard map reference */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium">
            Keyboard Map
          </span>
          <div className="grid grid-cols-4 gap-1">
            {PAD_LABELS.map((label, i) => {
              const row = Math.floor(i / 4);
              const colors = ROW_COLORS[row];
              return (
                <div
                  key={i}
                  className={`text-center text-[10px] font-mono py-1 rounded
                    ${selectedPad === i ? `${colors.bg} ${colors.border} border` : 'bg-neutral-800 border border-neutral-700/50'}
                    ${pads[i].buffer ? 'text-neutral-200' : 'text-neutral-600'}
                  `}
                >
                  {label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Info */}
        <div className="mt-auto text-[9px] text-neutral-600 leading-relaxed">
          <p>Click pads or press keyboard keys to trigger samples.</p>
          <p className="mt-1">Supported formats: WAV, MP3, OGG, FLAC, AAC</p>
          <p className="mt-0.5">Max file size: 10MB</p>
        </div>
      </div>
    </div>
  );
}
