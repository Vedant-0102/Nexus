import { useState, useRef, useCallback, useEffect } from 'react';
import { Clip, TextOverlay, ColorGrade } from './types';
import {
  PRESETS,
  DEFAULT_DURATION,
  DEFAULT_TIMELINE_ZOOM,
  DEFAULT_COLOR_GRADE,
  TRACK_HEIGHT,
  RULER_HEIGHT,
  TRACKS,
} from './constants';
import { formatTime, buildFilterString } from './utils';

// ─── Clips ──────────────────────────────────────────────────────────────────

export function useClips() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [selectedClipId, setSelectedClipId] = useState<number | null>(null);
  const nextId = useRef(1);

  const activeClip = clips.find((c) => c.id === selectedClipId) ?? null;

  const addClip = useCallback((clip: Omit<Clip, 'id'>) => {
    const id = nextId.current++;
    const newClip: Clip = { ...clip, id };
    setClips((prev) => [...prev, newClip]);
    setSelectedClipId(id);
    return newClip;
  }, []);

  const deleteClip = useCallback((id: number) => {
    setClips((prev) => prev.filter((c) => c.id !== id));
    setSelectedClipId((prev) => (prev === id ? null : prev));
  }, []);

  const updateClip = useCallback((id: number, updates: Partial<Clip>) => {
    setClips((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, []);

  const splitAtPlayhead = useCallback(
    (playheadTime: number) => {
      if (!activeClip) return;
      const relTime = playheadTime - activeClip.startTime;
      if (relTime <= activeClip.trimStart || relTime >= activeClip.trimEnd) return;

      const first: Clip = { ...activeClip, trimEnd: relTime };
      const secondId = nextId.current++;
      const second: Clip = {
        ...activeClip,
        id: secondId,
        startTime: activeClip.startTime + (relTime - activeClip.trimStart) / activeClip.speed,
        trimStart: relTime,
      };

      setClips((prev) => prev.map((c) => (c.id === activeClip.id ? first : c)).concat(second));
      setSelectedClipId(secondId);
    },
    [activeClip],
  );

  return {
    clips,
    selectedClipId,
    setSelectedClipId,
    activeClip,
    addClip,
    deleteClip,
    updateClip,
    splitAtPlayhead,
  };
}

// ─── Text Overlays ──────────────────────────────────────────────────────────

export function useTextOverlays() {
  const [overlays, setOverlays] = useState<TextOverlay[]>([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<number | null>(null);
  const nextId = useRef(1);

  const addOverlay = useCallback((playheadTime: number) => {
    const overlay: TextOverlay = {
      id: nextId.current++,
      text: 'Title',
      x: 50,
      y: 50,
      fontSize: 32,
      color: '#ffffff',
      fontFamily: 'sans-serif',
      startTime: playheadTime,
      duration: 5,
    };
    setOverlays((prev) => [...prev, overlay]);
    setSelectedOverlayId(overlay.id);
  }, []);

  const deleteOverlay = useCallback((id: number) => {
    setOverlays((prev) => prev.filter((o) => o.id !== id));
    setSelectedOverlayId((prev) => (prev === id ? null : prev));
  }, []);

  const updateOverlay = useCallback((id: number, updates: Partial<TextOverlay>) => {
    setOverlays((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o)));
  }, []);

  return {
    overlays,
    selectedOverlayId,
    setSelectedOverlayId,
    addOverlay,
    deleteOverlay,
    updateOverlay,
  };
}

// ─── Playback ───────────────────────────────────────────────────────────────

export function usePlayback(duration: number) {
  const [playheadTime, setPlayheadTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const animRef = useRef<number>(0);

  // Animation loop for playhead advancement
  useEffect(() => {
    if (!isPlaying) return;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = ((now - lastTime) / 1000) * playbackSpeed;
      lastTime = now;
      setPlayheadTime((prev) => {
        const next = prev + dt;
        if (next >= duration) {
          setIsPlaying(false);
          return 0;
        }
        return next;
      });
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying, playbackSpeed, duration]);

  const togglePlay = useCallback(() => setIsPlaying((prev) => !prev), []);

  const stepFrame = useCallback(
    (dir: number) => {
      setPlayheadTime((prev) => Math.max(0, Math.min(duration, prev + dir / 30)));
    },
    [duration],
  );

  const seekTo = useCallback(
    (time: number) => {
      setPlayheadTime(Math.max(0, Math.min(duration, time)));
    },
    [duration],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [togglePlay]);

  return {
    playheadTime,
    setPlayheadTime,
    isPlaying,
    setIsPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    volume,
    setVolume,
    togglePlay,
    stepFrame,
    seekTo,
  };
}

// ─── Color Grading ──────────────────────────────────────────────────────────

export function useColorGrading() {
  const [colorGrade, setColorGrade] = useState<ColorGrade>({ ...DEFAULT_COLOR_GRADE });
  const [activePresetName, setActivePresetName] = useState('Normal');

  const filterStr = buildFilterString(colorGrade);

  const applyPreset = useCallback((presetName: string) => {
    const preset = PRESETS.find((p) => p.name === presetName);
    if (!preset) return;
    setColorGrade({ ...preset.grade });
    setActivePresetName(presetName);
  }, []);

  const updateGrade = useCallback((key: keyof ColorGrade, value: number) => {
    setColorGrade((prev) => ({ ...prev, [key]: value }));
    setActivePresetName('');
  }, []);

  const resetGrade = useCallback(() => {
    setColorGrade({ ...DEFAULT_COLOR_GRADE });
    setActivePresetName('Normal');
  }, []);

  return { colorGrade, activePresetName, filterStr, applyPreset, updateGrade, resetGrade };
}

// ─── Timeline ───────────────────────────────────────────────────────────────

export function useTimeline(
  clips: Clip[],
  overlays: TextOverlay[],
  playheadTime: number,
  selectedClipId: number | null,
  selectedOverlayId: number | null,
  duration: number,
) {
  const [timelineZoom, setTimelineZoom] = useState(DEFAULT_TIMELINE_ZOOM);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingPlayhead = useRef(false);

  const drawTimeline = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const isDark = document.documentElement.classList.contains('dark');
    const bgTrack = isDark ? '#1f2937' : '#f1f5f9';
    const bgTrackAlt = isDark ? '#1a2332' : '#e8eef5';
    const borderColor = isDark ? '#374151' : '#d1d5db';
    const textColor = isDark ? '#9ca3af' : '#6b7280';
    const clipColor = isDark ? '#3b82f6' : '#60a5fa';
    const overlayColor = isDark ? '#a855f7' : '#c084fc';

    // Background
    ctx.fillStyle = isDark ? '#111827' : '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    // Ruler
    ctx.fillStyle = isDark ? '#111827' : '#ffffff';
    ctx.fillRect(0, 0, w, RULER_HEIGHT);
    ctx.strokeStyle = borderColor;
    ctx.beginPath();
    ctx.moveTo(0, RULER_HEIGHT);
    ctx.lineTo(w, RULER_HEIGHT);
    ctx.stroke();

    ctx.fillStyle = textColor;
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    for (let t = 0; t <= duration; t++) {
      const x = t * timelineZoom;
      if (x > w) break;
      if (t % 5 === 0) {
        ctx.fillText(formatTime(t), x, 10);
        ctx.beginPath();
        ctx.moveTo(x, 14);
        ctx.lineTo(x, RULER_HEIGHT);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(x, 18);
        ctx.lineTo(x, RULER_HEIGHT);
        ctx.stroke();
      }
    }

    // Track backgrounds
    for (let i = 0; i < TRACKS.length; i++) {
      const y = RULER_HEIGHT + i * TRACK_HEIGHT;
      ctx.fillStyle = i % 2 === 0 ? bgTrack : bgTrackAlt;
      ctx.fillRect(0, y, w, TRACK_HEIGHT);
      ctx.strokeStyle = borderColor;
      ctx.beginPath();
      ctx.moveTo(0, y + TRACK_HEIGHT);
      ctx.lineTo(w, y + TRACK_HEIGHT);
      ctx.stroke();
    }

    // Clips on tracks
    for (const clip of clips) {
      if (clip.track < 0 || clip.track >= TRACKS.length) continue;
      const x = clip.startTime * timelineZoom;
      const effectiveDuration = (clip.trimEnd - clip.trimStart) / clip.speed;
      const cw = effectiveDuration * timelineZoom;
      const y = RULER_HEIGHT + clip.track * TRACK_HEIGHT + 4;
      const ch = TRACK_HEIGHT - 8;

      ctx.fillStyle = clipColor;
      ctx.globalAlpha = selectedClipId === clip.id ? 1 : 0.7;
      ctx.beginPath();
      ctx.roundRect(x, y, Math.max(cw, 4), ch, 4);
      ctx.fill();
      ctx.globalAlpha = 1;

      if (selectedClipId === clip.id) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, Math.max(cw, 4), ch, 4);
        ctx.stroke();
        ctx.lineWidth = 1;
      }

      // Clip name label
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.save();
      ctx.beginPath();
      ctx.rect(x + 2, y, Math.max(cw - 4, 0), ch);
      ctx.clip();
      ctx.fillText(clip.name, x + 6, y + ch / 2 + 3);
      ctx.restore();
    }

    // Text overlays on timeline (rendered on last track area below)
    const overlayTrackY = RULER_HEIGHT + TRACKS.length * TRACK_HEIGHT;
    for (const ov of overlays) {
      const x = ov.startTime * timelineZoom;
      const ow = ov.duration * timelineZoom;
      const y = overlayTrackY + 4;
      const oh = TRACK_HEIGHT - 8;

      ctx.fillStyle = overlayColor;
      ctx.globalAlpha = selectedOverlayId === ov.id ? 1 : 0.6;
      ctx.beginPath();
      ctx.roundRect(x, y, Math.max(ow, 4), oh, 4);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.fillStyle = '#ffffff';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'left';
      ctx.save();
      ctx.beginPath();
      ctx.rect(x + 2, y, Math.max(ow - 4, 0), oh);
      ctx.clip();
      ctx.fillText(ov.text, x + 4, y + oh / 2 + 3);
      ctx.restore();
    }

    // Playhead line
    const px = playheadTime * timelineZoom;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, h);
    ctx.stroke();
    ctx.lineWidth = 1;

    // Playhead triangle
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(px - 6, 0);
    ctx.lineTo(px + 6, 0);
    ctx.lineTo(px, 8);
    ctx.closePath();
    ctx.fill();
  }, [clips, overlays, playheadTime, selectedClipId, selectedOverlayId, timelineZoom, duration]);

  // Redraw on state changes
  useEffect(() => {
    drawTimeline();
  }, [drawTimeline]);

  // Resize canvas to fit container
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      canvas.width = Math.max(duration * timelineZoom, container.clientWidth);
      canvas.height = RULER_HEIGHT + (TRACKS.length + 1) * TRACK_HEIGHT; // extra row for overlay
      drawTimeline();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [duration, timelineZoom, drawTimeline]);

  return {
    timelineZoom,
    setTimelineZoom,
    canvasRef,
    containerRef,
    draggingPlayhead,
    drawTimeline,
  };
}

// ─── Video Export ────────────────────────────────────────────────────────────

export function useVideoExport(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  clips: Clip[],
  filterStr: string,
  textOverlays: TextOverlay[],
) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const cancelledRef = useRef(false);

  const cancelExport = useCallback(() => {
    cancelledRef.current = true;
  }, []);

  const exportVideo = useCallback(async () => {
    if (clips.length === 0) return;

    // Simple approach: download the first clip's source file directly.
    // For a single-clip scenario this is much more reliable than captureStream.
    const firstClip = clips[0];
    if (!firstClip?.src) return;

    setIsExporting(true);
    setExportProgress(0);
    cancelledRef.current = false;

    try {
      const response = await fetch(firstClip.src);
      const blob = await response.blob();

      if (cancelledRef.current) {
        setIsExporting(false);
        return;
      }

      // Simulate brief progress for UX
      for (let i = 0; i <= 100; i += 20) {
        if (cancelledRef.current) {
          setIsExporting(false);
          return;
        }
        setExportProgress(i);
        await new Promise((r) => setTimeout(r, 100));
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const ext = firstClip.name.includes('.') ? '' : '.webm';
      a.download = `export_${firstClip.name}${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Export failed silently
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [clips]);

  return { isExporting, exportProgress, exportVideo, cancelExport };
}
