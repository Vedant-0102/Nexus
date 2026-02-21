import { useRef, useState, useEffect, useCallback } from 'react';
import { getAnalyser } from './audio/AudioEngine';

type VisMode = 'waveform' | 'frequency' | 'spectrogram';
type ColorScheme = 'neon' | 'fire' | 'ice' | 'rainbow';

const FFT_SIZES = [256, 512, 1024, 2048, 4096] as const;

function amplitudeColor(value: number, scheme: ColorScheme): [number, number, number] {
  const t = value / 255;
  switch (scheme) {
    case 'neon':
      return [Math.floor(t * 60), Math.floor(180 + t * 75), Math.floor(t * 80)];
    case 'fire':
      return [
        Math.floor(40 + t * 215),
        Math.floor(t * 180),
        Math.floor(t * 40),
      ];
    case 'ice':
      return [
        Math.floor(30 + t * 120),
        Math.floor(60 + t * 160),
        Math.floor(140 + t * 115),
      ];
    case 'rainbow': {
      const hue = t * 270;
      return hslToRgb(hue, 90, 45 + t * 20);
    }
  }
}

function lineColor(scheme: ColorScheme): string {
  switch (scheme) {
    case 'neon': return '#39ff14';
    case 'fire': return '#ff6a00';
    case 'ice': return '#7fdbff';
    case 'rainbow': return '#ff44cc';
  }
}

function barGradient(ctx: CanvasRenderingContext2D, h: number, scheme: ColorScheme): CanvasGradient {
  const g = ctx.createLinearGradient(0, h, 0, 0);
  switch (scheme) {
    case 'neon':
      g.addColorStop(0, '#003300');
      g.addColorStop(0.5, '#00cc44');
      g.addColorStop(1, '#39ff14');
      break;
    case 'fire':
      g.addColorStop(0, '#330a00');
      g.addColorStop(0.35, '#cc3300');
      g.addColorStop(0.7, '#ff8800');
      g.addColorStop(1, '#ffee00');
      break;
    case 'ice':
      g.addColorStop(0, '#001833');
      g.addColorStop(0.5, '#0077cc');
      g.addColorStop(1, '#ccffff');
      break;
    case 'rainbow':
      g.addColorStop(0, '#6600cc');
      g.addColorStop(0.25, '#0066ff');
      g.addColorStop(0.5, '#00cc66');
      g.addColorStop(0.75, '#ffcc00');
      g.addColorStop(1, '#ff3300');
      break;
  }
  return g;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sn = s / 100, ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return [Math.floor((r + m) * 255), Math.floor((g + m) * 255), Math.floor((b + m) * 255)];
}

function dbFromByte(value: number): number {
  const normalized = value / 255;
  if (normalized === 0) return -Infinity;
  return 20 * Math.log10(normalized);
}

export function WaveformVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const spectrogramRef = useRef<ImageData | null>(null);

  const [mode, setMode] = useState<VisMode>('waveform');
  const [colorScheme, setColorScheme] = useState<ColorScheme>('neon');
  const [sensitivity, setSensitivity] = useState(1);
  const [fftSize, setFftSize] = useState<number>(2048);
  const [peakDb, setPeakDb] = useState(-Infinity);

  const modeRef = useRef(mode);
  const schemeRef = useRef(colorScheme);
  const sensitivityRef = useRef(sensitivity);
  modeRef.current = mode;
  schemeRef.current = colorScheme;
  sensitivityRef.current = sensitivity;

  const handleFftChange = useCallback((size: number) => {
    setFftSize(size);
    try {
      const a = getAnalyser();
      a.fftSize = size;
    } catch { /* context not ready */ }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      spectrogramRef.current = null;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    let analyser: AnalyserNode;
    try {
      analyser = getAnalyser();
      analyser.fftSize = fftSize;
    } catch {
      return;
    }

    const peakSmooth = { current: 0 };
    let frameCount = 0;

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const currentMode = modeRef.current;
      const scheme = schemeRef.current;
      const gain = sensitivityRef.current;

      const bufLen = analyser.frequencyBinCount;
      const meterWidth = 12;
      const drawW = width - meterWidth - 4;

      // Clear
      ctx.fillStyle = '#0d0d0d';
      ctx.fillRect(0, 0, width, height);

      if (currentMode === 'waveform') {
        const data = new Uint8Array(bufLen);
        analyser.getByteTimeDomainData(data);

        ctx.beginPath();
        ctx.strokeStyle = lineColor(scheme);
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';

        const sliceW = drawW / data.length;
        for (let i = 0; i < data.length; i++) {
          const raw = (data[i] - 128) * gain + 128;
          const v = Math.max(0, Math.min(255, raw)) / 255;
          const y = v * height;
          if (i === 0) ctx.moveTo(0, y);
          else ctx.lineTo(i * sliceW, y);
        }
        ctx.stroke();

        // Peak from time domain
        let peak = 0;
        for (let i = 0; i < data.length; i++) {
          const amp = Math.abs((data[i] - 128) * gain);
          if (amp > peak) peak = amp;
        }
        peakSmooth.current = Math.max(peak / 128, peakSmooth.current * 0.92);
      } else if (currentMode === 'frequency') {
        const data = new Uint8Array(bufLen);
        analyser.getByteFrequencyData(data);

        const gradient = barGradient(ctx, height, scheme);
        const barCount = Math.min(data.length, Math.floor(drawW / 2));
        const barW = drawW / barCount;
        const gap = Math.max(1, barW * 0.15);

        let peak = 0;
        for (let i = 0; i < barCount; i++) {
          const raw = Math.min(255, data[i] * gain);
          if (raw > peak) peak = raw;
          const barH = (raw / 255) * height * 0.85;

          ctx.fillStyle = gradient;
          ctx.fillRect(i * barW + gap / 2, height - barH, barW - gap, barH);

          // Mirror reflection
          ctx.globalAlpha = 0.12;
          ctx.fillRect(i * barW + gap / 2, height, barW - gap, barH * 0.3);
          ctx.globalAlpha = 1;
        }
        peakSmooth.current = Math.max(peak / 255, peakSmooth.current * 0.92);
      } else {
        // Spectrogram
        const data = new Uint8Array(bufLen);
        analyser.getByteFrequencyData(data);

        const dpr = window.devicePixelRatio || 1;
        const cw = canvas.width;
        const ch = canvas.height;
        const usableW = Math.floor(drawW * dpr);

        if (!spectrogramRef.current || spectrogramRef.current.width !== cw || spectrogramRef.current.height !== ch) {
          spectrogramRef.current = ctx.createImageData(cw, ch);
        }

        const img = spectrogramRef.current;
        const pixels = img.data;
        const rowBytes = cw * 4;

        // Shift all pixels left by dpr pixels
        const shift = Math.max(1, Math.round(dpr));
        for (let y = 0; y < ch; y++) {
          const rowStart = y * rowBytes;
          for (let x = 0; x < usableW - shift; x++) {
            const dst = rowStart + x * 4;
            const src = rowStart + (x + shift) * 4;
            pixels[dst] = pixels[src];
            pixels[dst + 1] = pixels[src + 1];
            pixels[dst + 2] = pixels[src + 2];
            pixels[dst + 3] = pixels[src + 3];
          }
        }

        // Draw new column on the right edge
        const colX = usableW - shift;
        let peak = 0;
        for (let py = 0; py < ch; py++) {
          const freqIndex = Math.floor(((ch - 1 - py) / ch) * data.length);
          const raw = Math.min(255, data[freqIndex] * gain);
          if (raw > peak) peak = raw;
          const [r, g, b] = amplitudeColor(raw, scheme);
          for (let sx = 0; sx < shift; sx++) {
            const idx = py * rowBytes + (colX + sx) * 4;
            pixels[idx] = r;
            pixels[idx + 1] = g;
            pixels[idx + 2] = b;
            pixels[idx + 3] = 255;
          }
        }
        peakSmooth.current = Math.max(peak / 255, peakSmooth.current * 0.92);

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.putImageData(img, 0, 0);
        ctx.restore();
      }

      // Peak level meter
      const meterX = drawW + 2;
      const meterH = height - 8;
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(meterX, 4, meterWidth, meterH);

      const level = Math.min(1, peakSmooth.current);
      const levelH = level * meterH;
      const meterGrad = ctx.createLinearGradient(0, 4 + meterH, 0, 4);
      meterGrad.addColorStop(0, '#00cc44');
      meterGrad.addColorStop(0.6, '#cccc00');
      meterGrad.addColorStop(0.85, '#ff4400');
      ctx.fillStyle = meterGrad;
      ctx.fillRect(meterX + 1, 4 + meterH - levelH, meterWidth - 2, levelH);

      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.strokeRect(meterX, 4, meterWidth, meterH);

      // Update dB display every few frames
      frameCount++;
      if (frameCount % 6 === 0) {
        const db = peakSmooth.current > 0 ? 20 * Math.log10(peakSmooth.current) : -Infinity;
        setPeakDb(db);
      }
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [fftSize]);

  const modes: { key: VisMode; label: string }[] = [
    { key: 'waveform', label: 'Waveform' },
    { key: 'frequency', label: 'Frequency' },
    { key: 'spectrogram', label: 'Spectrogram' },
  ];

  const schemes: { key: ColorScheme; label: string; color: string }[] = [
    { key: 'neon', label: 'Neon', color: '#39ff14' },
    { key: 'fire', label: 'Fire', color: '#ff6a00' },
    { key: 'ice', label: 'Ice', color: '#7fdbff' },
    { key: 'rainbow', label: 'Rainbow', color: '#ff44cc' },
  ];

  const dbDisplay = peakDb === -Infinity ? '-inf' : `${peakDb.toFixed(1)}`;

  return (
    <div className="flex flex-col h-full bg-neutral-950 rounded-xl overflow-hidden">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 px-3 py-2 bg-neutral-900 border-b border-neutral-800">
        {/* Mode selector */}
        <div className="flex rounded-md overflow-hidden border border-neutral-700">
          {modes.map((m) => (
            <button
              key={m.key}
              onClick={() => { setMode(m.key); spectrogramRef.current = null; }}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                mode === m.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Color scheme */}
        <div className="flex items-center gap-1">
          {schemes.map((s) => (
            <button
              key={s.key}
              onClick={() => setColorScheme(s.key)}
              title={s.label}
              className={`w-5 h-5 rounded-full border-2 transition-transform ${
                colorScheme === s.key ? 'border-white scale-110' : 'border-neutral-600'
              }`}
              style={{ backgroundColor: s.color }}
            />
          ))}
        </div>

        {/* Sensitivity */}
        <div className="flex items-center gap-2 ml-1">
          <span className="text-[10px] text-neutral-500 uppercase tracking-wide">Gain</span>
          <input
            type="range"
            min={0.2}
            max={4}
            step={0.1}
            value={sensitivity}
            onChange={(e) => setSensitivity(parseFloat(e.target.value))}
            className="w-20 h-1 accent-indigo-500"
          />
          <span className="text-[10px] text-neutral-400 w-7 text-right">
            {sensitivity.toFixed(1)}
          </span>
        </div>

        {/* FFT size */}
        <div className="flex items-center gap-1.5 ml-1">
          <span className="text-[10px] text-neutral-500 uppercase tracking-wide">FFT</span>
          <select
            value={fftSize}
            onChange={(e) => handleFftChange(Number(e.target.value))}
            className="bg-neutral-800 text-neutral-300 text-xs rounded px-1.5 py-0.5 border border-neutral-700 focus:outline-none"
          >
            {FFT_SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Peak dB */}
        <div className="ml-auto text-[11px] font-mono text-neutral-400">
          Peak: <span className={peakDb > -3 ? 'text-red-400' : 'text-green-400'}>{dbDisplay} dB</span>
        </div>
      </div>

      {/* Canvas area */}
      <div ref={containerRef} className="flex-1 relative min-h-0">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </div>
  );
}
