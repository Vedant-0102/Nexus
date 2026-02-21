import React, { useState, useRef, useCallback, useEffect } from 'react';

interface Clip {
  id: number;
  name: string;
  src: string;
  duration: number;
  startTime: number;
  trackIndex: number;
  trimStart: number;
  trimEnd: number;
  speed: number;
  width: number;
  height: number;
}

interface TextOverlay {
  id: number;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  startTime: number;
  duration: number;
}

interface ColorGrade {
  brightness: number;
  contrast: number;
  saturate: number;
  hueRotate: number;
  grayscale: number;
  sepia: number;
}

type Preset = 'normal' | 'warm' | 'cool' | 'vintage' | 'cinema' | 'bw';

const PRESETS: Record<Preset, ColorGrade> = {
  normal: { brightness: 100, contrast: 100, saturate: 100, hueRotate: 0, grayscale: 0, sepia: 0 },
  warm: { brightness: 105, contrast: 105, saturate: 120, hueRotate: 10, grayscale: 0, sepia: 20 },
  cool: { brightness: 100, contrast: 110, saturate: 90, hueRotate: 200, grayscale: 0, sepia: 0 },
  vintage: { brightness: 95, contrast: 90, saturate: 70, hueRotate: 15, grayscale: 0, sepia: 40 },
  cinema: { brightness: 95, contrast: 130, saturate: 85, hueRotate: 0, grayscale: 0, sepia: 10 },
  bw: { brightness: 100, contrast: 120, saturate: 0, hueRotate: 0, grayscale: 100, sepia: 0 },
};

const TRACK_HEIGHT = 40;
const RULER_HEIGHT = 24;
const TRACKS = ['Video 1', 'Video 2', 'Audio 1', 'Audio 2'];

export const VideoEditor: React.FC = () => {
  const [clips, setClips] = useState<Clip[]>([]);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [selectedClip, setSelectedClip] = useState<number | null>(null);
  const [selectedOverlay, setSelectedOverlay] = useState<number | null>(null);
  const [playheadTime, setPlayheadTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(30);
  const [timelineZoom, setTimelineZoom] = useState(40);
  const [volume, setVolume] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [colorGrade, setColorGrade] = useState<ColorGrade>({ ...PRESETS.normal });
  const [activePreset, setActivePreset] = useState<Preset>('normal');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [tab, setTab] = useState<'clip' | 'text' | 'color'>('clip');
  const [newText, setNewText] = useState('Title');
  const [newTextSize, setNewTextSize] = useState(32);
  const [newTextColor, setNewTextColor] = useState('#ffffff');
  const [inPoint, setInPoint] = useState(0);
  const [outPoint, setOutPoint] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineCanvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const nextClipId = useRef(1);
  const nextOverlayId = useRef(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const draggingPlayhead = useRef(false);

  const activeClip = clips.find(c => c.id === selectedClip);

  const filterStr = `brightness(${colorGrade.brightness}%) contrast(${colorGrade.contrast}%) saturate(${colorGrade.saturate}%) hue-rotate(${colorGrade.hueRotate}deg) grayscale(${colorGrade.grayscale}%) sepia(${colorGrade.sepia}%)`;

  const formatTime = (t: number): string => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    const ms = Math.floor((t % 1) * 100);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const importVideo = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      const vid = document.createElement('video');
      vid.preload = 'metadata';
      vid.onloadedmetadata = () => {
        const clip: Clip = {
          id: nextClipId.current++,
          name: file.name.length > 20 ? file.name.slice(0, 17) + '...' : file.name,
          src: url,
          duration: vid.duration,
          startTime: 0,
          trackIndex: 0,
          trimStart: 0,
          trimEnd: vid.duration,
          speed: 1,
          width: vid.videoWidth,
          height: vid.videoHeight,
        };
        setClips(prev => [...prev, clip]);
        setSelectedClip(clip.id);
        setDuration(d => Math.max(d, vid.duration + 5));
        setOutPoint(vid.duration);
        if (videoRef.current) {
          videoRef.current.src = url;
          videoRef.current.load();
        }
      };
      vid.src = url;
    };
    input.click();
  };

  const deleteClip = (id: number) => {
    setClips(prev => prev.filter(c => c.id !== id));
    if (selectedClip === id) setSelectedClip(null);
  };

  const splitAtPlayhead = () => {
    if (!activeClip) return;
    const relTime = playheadTime - activeClip.startTime;
    if (relTime <= activeClip.trimStart || relTime >= activeClip.trimEnd) return;
    const clip1: Clip = { ...activeClip, trimEnd: relTime };
    const clip2: Clip = {
      ...activeClip,
      id: nextClipId.current++,
      startTime: activeClip.startTime + relTime - activeClip.trimStart,
      trimStart: relTime,
    };
    setClips(prev => prev.map(c => c.id === activeClip.id ? clip1 : c).concat(clip2));
  };

  const addTextOverlay = () => {
    const overlay: TextOverlay = {
      id: nextOverlayId.current++,
      text: newText,
      x: 50,
      y: 50,
      fontSize: newTextSize,
      color: newTextColor,
      startTime: playheadTime,
      duration: 5,
    };
    setTextOverlays(prev => [...prev, overlay]);
    setSelectedOverlay(overlay.id);
  };

  const deleteOverlay = (id: number) => {
    setTextOverlays(prev => prev.filter(o => o.id !== id));
    if (selectedOverlay === id) setSelectedOverlay(null);
  };

  const applyPreset = (preset: Preset) => {
    setColorGrade({ ...PRESETS[preset] });
    setActivePreset(preset);
  };

  // Playback
  useEffect(() => {
    if (!isPlaying) return;
    const video = videoRef.current;
    if (video && video.src) {
      video.playbackRate = playbackSpeed;
      video.play().catch(() => {});
    }
    let lastTime = performance.now();
    const tick = (now: number) => {
      const dt = (now - lastTime) / 1000 * playbackSpeed;
      lastTime = now;
      setPlayheadTime(prev => {
        const next = prev + dt;
        if (next >= duration) {
          setIsPlaying(false);
          if (video) video.pause();
          return 0;
        }
        return next;
      });
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animRef.current);
      if (video) video.pause();
    };
  }, [isPlaying, playbackSpeed, duration]);

  // Sync video to playhead
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !video.src) return;
    if (!isPlaying) {
      video.currentTime = playheadTime;
    }
    video.volume = volume;
  }, [playheadTime, volume, isPlaying]);

  // Draw timeline
  const drawTimeline = useCallback(() => {
    const canvas = timelineCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('color-scheme') === 'dark' ? '#111827' : '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    const isDark = document.documentElement.classList.contains('dark');
    const bgTrack = isDark ? '#1f2937' : '#f1f5f9';
    const bgTrackAlt = isDark ? '#1a2332' : '#e8eef5';
    const borderColor = isDark ? '#374151' : '#d1d5db';
    const textColor = isDark ? '#9ca3af' : '#6b7280';
    const clipColor = isDark ? '#3b82f6' : '#60a5fa';
    const clipAudioColor = isDark ? '#10b981' : '#34d399';
    const overlayColor = isDark ? '#a855f7' : '#c084fc';

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
    const secWidth = timelineZoom;
    for (let t = 0; t <= duration; t++) {
      const x = t * secWidth;
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

    // Tracks
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

    // Clips
    for (const clip of clips) {
      if (clip.trackIndex < 0 || clip.trackIndex >= TRACKS.length) continue;
      const x = clip.startTime * secWidth;
      const clipDur = (clip.trimEnd - clip.trimStart) / clip.speed;
      const cw = clipDur * secWidth;
      const y = RULER_HEIGHT + clip.trackIndex * TRACK_HEIGHT + 4;
      const ch = TRACK_HEIGHT - 8;

      ctx.fillStyle = clip.trackIndex >= 2 ? clipAudioColor : clipColor;
      ctx.globalAlpha = selectedClip === clip.id ? 1 : 0.75;
      ctx.beginPath();
      ctx.roundRect(x, y, Math.max(cw, 4), ch, 4);
      ctx.fill();
      ctx.globalAlpha = 1;

      if (selectedClip === clip.id) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, Math.max(cw, 4), ch, 4);
        ctx.stroke();
        ctx.lineWidth = 1;
      }

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

    // Text overlays on timeline
    for (const ov of textOverlays) {
      const x = ov.startTime * secWidth;
      const ow = ov.duration * secWidth;
      const y = RULER_HEIGHT + TRACKS.length * TRACK_HEIGHT - TRACK_HEIGHT + 4;
      const oh = TRACK_HEIGHT - 8;

      ctx.fillStyle = overlayColor;
      ctx.globalAlpha = selectedOverlay === ov.id ? 1 : 0.6;
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
      ctx.fillText(`T: ${ov.text}`, x + 4, y + oh / 2 + 3);
      ctx.restore();
    }

    // Playhead
    const px = playheadTime * secWidth;
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

    // In/Out points
    if (inPoint > 0) {
      const ix = inPoint * secWidth;
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      ctx.moveTo(ix, 0);
      ctx.lineTo(ix, h);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = 1;
    }
    if (outPoint > 0 && outPoint < duration) {
      const ox = outPoint * secWidth;
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      ctx.moveTo(ox, 0);
      ctx.lineTo(ox, h);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = 1;
    }
  }, [clips, textOverlays, playheadTime, selectedClip, selectedOverlay, timelineZoom, duration, inPoint, outPoint]);

  useEffect(() => {
    drawTimeline();
  }, [drawTimeline]);

  // Resize timeline canvas
  useEffect(() => {
    const resize = () => {
      const canvas = timelineCanvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      canvas.width = Math.max(duration * timelineZoom, container.clientWidth);
      canvas.height = RULER_HEIGHT + TRACKS.length * TRACK_HEIGHT;
      drawTimeline();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [duration, timelineZoom, drawTimeline]);

  const handleTimelineClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = timelineCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left + (canvas.parentElement?.scrollLeft || 0);
    const t = x / timelineZoom;

    // Check if clicking ruler area -> seek
    const y = e.clientY - rect.top;
    if (y <= RULER_HEIGHT) {
      setPlayheadTime(Math.max(0, Math.min(duration, t)));
      draggingPlayhead.current = true;
      return;
    }

    // Check if clicking a clip
    const trackIdx = Math.floor((y - RULER_HEIGHT) / TRACK_HEIGHT);
    if (trackIdx >= 0 && trackIdx < TRACKS.length) {
      const clicked = clips.find(c => {
        if (c.trackIndex !== trackIdx) return false;
        const clipDur = (c.trimEnd - c.trimStart) / c.speed;
        return t >= c.startTime && t <= c.startTime + clipDur;
      });
      if (clicked) {
        setSelectedClip(clicked.id);
        setSelectedOverlay(null);
        if (videoRef.current && clicked.src) {
          videoRef.current.src = clicked.src;
          videoRef.current.load();
        }
        return;
      }
    }

    setPlayheadTime(Math.max(0, Math.min(duration, t)));
  };

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingPlayhead.current) return;
    const canvas = timelineCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left + (canvas.parentElement?.scrollLeft || 0);
    setPlayheadTime(Math.max(0, Math.min(duration, x / timelineZoom)));
  };

  const handleTimelineMouseUp = () => {
    draggingPlayhead.current = false;
  };

  // Screen recorder
  const startScreenRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      screenStreamRef.current = stream;
      recordedChunksRef.current = [];
      const mr = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const clip: Clip = {
          id: nextClipId.current++,
          name: 'Screen Recording',
          src: url,
          duration: 0,
          startTime: 0,
          trackIndex: 0,
          trimStart: 0,
          trimEnd: 0,
          speed: 1,
          width: 1920,
          height: 1080,
        };
        const vid = document.createElement('video');
        vid.preload = 'metadata';
        vid.onloadedmetadata = () => {
          clip.duration = vid.duration;
          clip.trimEnd = vid.duration;
          clip.width = vid.videoWidth;
          clip.height = vid.videoHeight;
          setClips(prev => [...prev, clip]);
          setSelectedClip(clip.id);
          setDuration(d => Math.max(d, vid.duration + 5));
        };
        vid.src = url;
        setIsRecording(false);
      };
      mr.start();
      setIsRecording(true);
      stream.getTracks().forEach(track => {
        track.onended = () => {
          if (mr.state === 'recording') mr.stop();
        };
      });
    } catch {
      // User cancelled
    }
  };

  const stopScreenRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
  };

  // Export
  const exportVideo = async () => {
    const video = videoRef.current;
    if (!video || !video.src) return;

    setIsExporting(true);
    setExportProgress(0);

    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d')!;

    const stream = canvas.captureStream(30);
    const mr = new MediaRecorder(stream, { mimeType: 'video/webm', videoBitsPerSecond: 5000000 });
    const chunks: Blob[] = [];
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

    return new Promise<void>((resolve) => {
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'export.webm';
        a.click();
        URL.revokeObjectURL(url);
        setIsExporting(false);
        setExportProgress(100);
        resolve();
      };

      video.currentTime = inPoint;
      video.play();
      mr.start();

      const drawFrame = () => {
        if (video.currentTime >= outPoint || video.ended) {
          mr.stop();
          video.pause();
          return;
        }
        ctx.filter = filterStr;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Draw text overlays
        for (const ov of textOverlays) {
          if (video.currentTime >= ov.startTime && video.currentTime <= ov.startTime + ov.duration) {
            ctx.filter = 'none';
            ctx.fillStyle = ov.color;
            ctx.font = `${ov.fontSize}px sans-serif`;
            ctx.textAlign = 'center';
            const ox = (ov.x / 100) * canvas.width;
            const oy = (ov.y / 100) * canvas.height;
            ctx.fillText(ov.text, ox, oy);
          }
        }

        setExportProgress(Math.round(((video.currentTime - inPoint) / (outPoint - inPoint)) * 100));
        requestAnimationFrame(drawFrame);
      };
      requestAnimationFrame(drawFrame);
    });
  };

  const togglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  const stepFrame = (dir: number) => {
    setPlayheadTime(prev => Math.max(0, Math.min(duration, prev + dir / 30)));
  };

  const btn = 'px-2 py-1 text-xs rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors';
  const btnActive = 'px-2 py-1 text-xs rounded bg-blue-600 text-white';

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-gray-950 dark:to-indigo-950 overflow-hidden select-none">
      {/* Top Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1 bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700">
        <button onClick={importVideo} className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold">Import Video</button>
        <button onClick={exportVideo} disabled={clips.length === 0 || isExporting} className={`px-3 py-1 text-xs rounded font-semibold ${clips.length > 0 && !isExporting ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'}`}>Export WebM</button>
        {!isRecording ? (
          <button onClick={startScreenRecording} className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 font-semibold">Record Screen</button>
        ) : (
          <button onClick={stopScreenRecording} className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 font-semibold animate-pulse">Stop Recording</button>
        )}
        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
        <button onClick={splitAtPlayhead} disabled={!activeClip} className={btn} title="Split at playhead">Split</button>
        <button onClick={() => selectedClip && deleteClip(selectedClip)} disabled={!selectedClip} className={btn} title="Delete clip">Delete</button>
        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
        <button onClick={() => setInPoint(playheadTime)} className={btn} title="Set in point">In [{formatTime(inPoint)}]</button>
        <button onClick={() => setOutPoint(playheadTime)} className={btn} title="Set out point">Out [{formatTime(outPoint)}]</button>
        <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
          <span>{clips.length} clip{clips.length !== 1 ? 's' : ''}</span>
          <span>{formatTime(playheadTime)} / {formatTime(duration)}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Preview Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
            {clips.length > 0 ? (
              <>
                <video
                  ref={videoRef}
                  className="max-w-full max-h-full"
                  style={{ filter: filterStr }}
                  muted={volume === 0}
                />
                {/* Text overlays on preview */}
                {textOverlays.filter(ov => playheadTime >= ov.startTime && playheadTime <= ov.startTime + ov.duration).map(ov => (
                  <div key={ov.id}
                    className="absolute pointer-events-none"
                    style={{
                      left: `${ov.x}%`,
                      top: `${ov.y}%`,
                      transform: 'translate(-50%, -50%)',
                      color: ov.color,
                      fontSize: ov.fontSize,
                      fontWeight: 'bold',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
                    }}>
                    {ov.text}
                  </div>
                ))}
              </>
            ) : (
              <div className="text-gray-500 text-center p-8">
                <div className="text-4xl mb-3 opacity-30">🎬</div>
                <div className="text-sm">Import a video or record your screen to get started</div>
                <button onClick={importVideo} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Import Video</button>
              </div>
            )}
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 dark:bg-gray-900/80 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => { setPlayheadTime(0); if (videoRef.current) videoRef.current.currentTime = 0; }} className={btn} title="Go to start">|&lt;</button>
            <button onClick={() => stepFrame(-1)} className={btn} title="Previous frame">&lt;</button>
            <button onClick={togglePlay} className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 font-bold w-12">{isPlaying ? 'II' : '▶'}</button>
            <button onClick={() => stepFrame(1)} className={btn} title="Next frame">&gt;</button>
            <button onClick={() => setPlayheadTime(duration)} className={btn} title="Go to end">&gt;|</button>

            <div className="w-px h-5 bg-gray-300 dark:bg-gray-600" />
            <label className="flex items-center gap-1 text-[10px] text-gray-500">
              Vol
              <input type="range" min={0} max={1} step={0.05} value={volume} onChange={e => setVolume(Number(e.target.value))} className="w-16 h-2" />
            </label>
            <label className="flex items-center gap-1 text-[10px] text-gray-500">
              Speed
              <select value={playbackSpeed} onChange={e => setPlaybackSpeed(Number(e.target.value))} className="text-[10px] px-1 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300">
                {[0.25, 0.5, 1, 1.5, 2, 4].map(s => <option key={s} value={s}>{s}x</option>)}
              </select>
            </label>
          </div>
        </div>

        {/* Right Properties Panel */}
        <div className="w-64 bg-white/80 dark:bg-gray-900/80 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {(['clip', 'text', 'color'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={`flex-1 py-1.5 text-[10px] font-semibold uppercase transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{t}</button>
            ))}
          </div>

          <div className="flex-1 overflow-auto p-2">
            {tab === 'clip' && (
              <div className="space-y-2">
                <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Clips</div>
                {clips.length === 0 && <div className="text-xs text-gray-400 text-center mt-4">No clips loaded</div>}
                {clips.map(c => (
                  <div key={c.id} onClick={() => {
                    setSelectedClip(c.id);
                    if (videoRef.current) { videoRef.current.src = c.src; videoRef.current.load(); }
                  }}
                    className={`p-2 rounded text-xs cursor-pointer transition-colors ${selectedClip === c.id ? 'bg-blue-100 dark:bg-blue-900/40 ring-1 ring-blue-400' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                    <div className="flex justify-between items-center">
                      <span className="truncate text-gray-700 dark:text-gray-300">{c.name}</span>
                      <button onClick={e => { e.stopPropagation(); deleteClip(c.id); }} className="text-red-500 text-[10px] px-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded">x</button>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{formatTime(c.duration)} | {c.width}x{c.height}</div>
                  </div>
                ))}

                {activeClip && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2 space-y-1.5">
                    <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Properties</div>
                    <label className="flex items-center justify-between text-[10px] text-gray-600 dark:text-gray-400">
                      <span>Track</span>
                      <select value={activeClip.trackIndex} onChange={e => setClips(prev => prev.map(c => c.id === activeClip.id ? { ...c, trackIndex: Number(e.target.value) } : c))}
                        className="w-24 text-[10px] px-1 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300">
                        {TRACKS.map((t, i) => <option key={i} value={i}>{t}</option>)}
                      </select>
                    </label>
                    <label className="flex items-center justify-between text-[10px] text-gray-600 dark:text-gray-400">
                      <span>Start</span>
                      <input type="number" min={0} step={0.1} value={activeClip.startTime.toFixed(1)}
                        onChange={e => setClips(prev => prev.map(c => c.id === activeClip.id ? { ...c, startTime: Number(e.target.value) } : c))}
                        className="w-16 text-[10px] px-1 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300" />
                    </label>
                    <label className="flex items-center justify-between text-[10px] text-gray-600 dark:text-gray-400">
                      <span>Speed</span>
                      <select value={activeClip.speed}
                        onChange={e => setClips(prev => prev.map(c => c.id === activeClip.id ? { ...c, speed: Number(e.target.value) } : c))}
                        className="w-16 text-[10px] px-1 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300">
                        {[0.25, 0.5, 1, 1.5, 2, 4].map(s => <option key={s} value={s}>{s}x</option>)}
                      </select>
                    </label>
                  </div>
                )}
              </div>
            )}

            {tab === 'text' && (
              <div className="space-y-2">
                <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Add Text Overlay</div>
                <input value={newText} onChange={e => setNewText(e.target.value)} placeholder="Text..."
                  className="w-full px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200" />
                <div className="flex gap-1">
                  <input type="number" value={newTextSize} onChange={e => setNewTextSize(Number(e.target.value))} min={8} max={120}
                    className="w-14 text-[10px] px-1 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300" />
                  <input type="color" value={newTextColor} onChange={e => setNewTextColor(e.target.value)} className="w-8 h-6 cursor-pointer" />
                  <button onClick={addTextOverlay} className="flex-1 px-2 py-0.5 text-[10px] bg-purple-600 text-white rounded hover:bg-purple-700">Add</button>
                </div>

                <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase mt-2">Overlays</div>
                {textOverlays.length === 0 && <div className="text-[10px] text-gray-400 text-center">No text overlays</div>}
                {textOverlays.map(ov => (
                  <div key={ov.id} onClick={() => setSelectedOverlay(ov.id)}
                    className={`p-1.5 rounded text-xs cursor-pointer ${selectedOverlay === ov.id ? 'bg-purple-100 dark:bg-purple-900/40 ring-1 ring-purple-400' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    <div className="flex justify-between items-center">
                      <span className="truncate text-gray-700 dark:text-gray-300">{ov.text}</span>
                      <button onClick={e => { e.stopPropagation(); deleteOverlay(ov.id); }} className="text-red-500 text-[10px] px-1">x</button>
                    </div>
                    <div className="text-[10px] text-gray-500">{formatTime(ov.startTime)} | {ov.duration}s</div>
                  </div>
                ))}

                {selectedOverlay && (() => {
                  const ov = textOverlays.find(o => o.id === selectedOverlay);
                  if (!ov) return null;
                  return (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-2 space-y-1.5">
                      <div className="text-[10px] font-semibold text-gray-500 uppercase">Edit Overlay</div>
                      <input value={ov.text} onChange={e => setTextOverlays(prev => prev.map(o => o.id === ov.id ? { ...o, text: e.target.value } : o))}
                        className="w-full px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200" />
                      <div className="grid grid-cols-2 gap-1">
                        <label className="text-[10px] text-gray-500">
                          X (%)
                          <input type="number" min={0} max={100} value={ov.x} onChange={e => setTextOverlays(prev => prev.map(o => o.id === ov.id ? { ...o, x: Number(e.target.value) } : o))}
                            className="w-full text-[10px] px-1 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300" />
                        </label>
                        <label className="text-[10px] text-gray-500">
                          Y (%)
                          <input type="number" min={0} max={100} value={ov.y} onChange={e => setTextOverlays(prev => prev.map(o => o.id === ov.id ? { ...o, y: Number(e.target.value) } : o))}
                            className="w-full text-[10px] px-1 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300" />
                        </label>
                        <label className="text-[10px] text-gray-500">
                          Start
                          <input type="number" min={0} step={0.1} value={ov.startTime} onChange={e => setTextOverlays(prev => prev.map(o => o.id === ov.id ? { ...o, startTime: Number(e.target.value) } : o))}
                            className="w-full text-[10px] px-1 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300" />
                        </label>
                        <label className="text-[10px] text-gray-500">
                          Duration
                          <input type="number" min={0.5} step={0.5} value={ov.duration} onChange={e => setTextOverlays(prev => prev.map(o => o.id === ov.id ? { ...o, duration: Number(e.target.value) } : o))}
                            className="w-full text-[10px] px-1 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300" />
                        </label>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {tab === 'color' && (
              <div className="space-y-2">
                <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Presets</div>
                <div className="grid grid-cols-3 gap-1">
                  {(Object.keys(PRESETS) as Preset[]).map(p => (
                    <button key={p} onClick={() => applyPreset(p)}
                      className={`px-1 py-1 text-[10px] rounded capitalize transition-colors ${activePreset === p ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>{p}</button>
                  ))}
                </div>

                <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase mt-2">Adjustments</div>
                {([
                  { key: 'brightness' as const, label: 'Brightness', min: 0, max: 200 },
                  { key: 'contrast' as const, label: 'Contrast', min: 0, max: 200 },
                  { key: 'saturate' as const, label: 'Saturation', min: 0, max: 200 },
                  { key: 'hueRotate' as const, label: 'Hue Rotate', min: 0, max: 360 },
                  { key: 'grayscale' as const, label: 'Grayscale', min: 0, max: 100 },
                  { key: 'sepia' as const, label: 'Sepia', min: 0, max: 100 },
                ]).map(({ key, label, min, max }) => (
                  <label key={key} className="flex items-center justify-between text-[10px] text-gray-600 dark:text-gray-400">
                    <span className="w-16">{label}</span>
                    <input type="range" min={min} max={max} value={colorGrade[key]}
                      onChange={e => { setColorGrade(prev => ({ ...prev, [key]: Number(e.target.value) })); setActivePreset('normal'); }}
                      className="flex-1 mx-1 h-2" />
                    <span className="w-8 text-right font-mono">{colorGrade[key]}{key === 'hueRotate' ? '°' : '%'}</span>
                  </label>
                ))}
                <button onClick={() => applyPreset('normal')} className="w-full px-2 py-1 text-[10px] bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400">Reset All</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline Area */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 px-2 py-1 bg-white/60 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700">
          <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Timeline</span>
          <div className="flex items-center gap-1 ml-auto">
            <button onClick={() => setTimelineZoom(z => Math.max(10, z - 10))} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600">-</button>
            <span className="text-[10px] text-gray-500 w-10 text-center">{timelineZoom}px/s</span>
            <button onClick={() => setTimelineZoom(z => Math.min(200, z + 10))} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600">+</button>
          </div>
        </div>
        <div className="flex">
          {/* Track Labels */}
          <div className="w-20 flex-shrink-0 bg-white/80 dark:bg-gray-900/80 border-r border-gray-200 dark:border-gray-700">
            <div style={{ height: RULER_HEIGHT }} className="border-b border-gray-200 dark:border-gray-700" />
            {TRACKS.map((t, i) => (
              <div key={i} className="flex items-center px-2 text-[10px] text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700" style={{ height: TRACK_HEIGHT }}>
                {t}
              </div>
            ))}
          </div>
          {/* Canvas Timeline */}
          <div ref={containerRef} className="flex-1 overflow-x-auto overflow-y-hidden">
            <canvas
              ref={timelineCanvasRef}
              className="cursor-pointer"
              onClick={handleTimelineClick}
              onMouseMove={handleTimelineMouseMove}
              onMouseUp={handleTimelineMouseUp}
              onMouseLeave={handleTimelineMouseUp}
            />
          </div>
        </div>
      </div>

      {/* Export Progress */}
      {isExporting && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl text-center min-w-[300px]">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Exporting Video...</div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
              <div className="bg-blue-600 h-3 rounded-full transition-all" style={{ width: `${exportProgress}%` }} />
            </div>
            <div className="text-xs text-gray-500">{exportProgress}%</div>
          </div>
        </div>
      )}
    </div>
  );
};
