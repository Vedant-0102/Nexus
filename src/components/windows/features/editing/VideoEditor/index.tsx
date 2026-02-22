import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Clip, PropertiesTab } from './types';
import { TRACKS, TRACK_HEIGHT, RULER_HEIGHT, DEFAULT_DURATION } from './constants';
import {
  useClips,
  useTextOverlays,
  usePlayback,
  useColorGrading,
  useVideoExport,
  useTimeline,
} from './hooks';
import {
  VideoToolbar,
  VideoPreview,
  PlaybackControls,
  ClipProperties,
  TextOverlayPanel,
  ColorGradePanel,
  TimelineArea,
  ExportOverlay,
} from './components';
import { Film, Type, Palette } from 'lucide-react';

export const VideoEditor: React.FC = () => {
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [tab, setTab] = useState<PropertiesTab>('clip');

  const videoRef = useRef<HTMLVideoElement>(null);

  // Hooks
  const clipState = useClips();
  const overlayState = useTextOverlays();
  const playback = usePlayback(duration);
  const color = useColorGrading();

  const exporter = useVideoExport(
    videoRef,
    clipState.clips,
    color.filterStr,
    overlayState.overlays,
  );

  const timeline = useTimeline(
    clipState.clips,
    overlayState.overlays,
    playback.playheadTime,
    clipState.selectedClipId,
    overlayState.selectedOverlayId,
    duration,
  );

  // Sync video element with playback state
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !video.src) return;

    video.volume = playback.volume;
    video.playbackRate = playback.playbackSpeed;

    if (playback.isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = playback.playheadTime;
    }
  }, [playback.playheadTime, playback.volume, playback.isPlaying, playback.playbackSpeed]);

  // Import video files
  const importVideo = useCallback(() => {
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
        const clipName =
          file.name.length > 24 ? file.name.slice(0, 21) + '...' : file.name;
        clipState.addClip({
          name: clipName,
          src: url,
          duration: vid.duration,
          startTime: 0,
          track: 0,
          trimStart: 0,
          trimEnd: vid.duration,
          speed: 1,
        });
        setDuration((d) => Math.max(d, vid.duration + 5));
        if (videoRef.current) {
          videoRef.current.src = url;
          videoRef.current.load();
        }
      };
      vid.src = url;
    };
    input.click();
  }, [clipState.addClip]);

  // Timeline click handler
  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = timeline.canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x =
        e.clientX - rect.left + (canvas.parentElement?.scrollLeft || 0);
      const t = x / timeline.timelineZoom;
      const y = e.clientY - rect.top;

      // Click on ruler = seek
      if (y <= RULER_HEIGHT) {
        playback.seekTo(t);
        timeline.draggingPlayhead.current = true;
        return;
      }

      // Click on a track = select clip
      const trackIdx = Math.floor((y - RULER_HEIGHT) / TRACK_HEIGHT);
      if (trackIdx >= 0 && trackIdx < TRACKS.length) {
        const clicked = clipState.clips.find((c) => {
          if (c.track !== trackIdx) return false;
          const effectiveDur = (c.trimEnd - c.trimStart) / c.speed;
          return t >= c.startTime && t <= c.startTime + effectiveDur;
        });
        if (clicked) {
          clipState.setSelectedClipId(clicked.id);
          overlayState.setSelectedOverlayId(null);
          if (videoRef.current && clicked.src) {
            videoRef.current.src = clicked.src;
            videoRef.current.load();
          }
          return;
        }
      }

      // Otherwise, just seek
      playback.seekTo(t);
    },
    [
      timeline.timelineZoom,
      clipState.clips,
      playback.seekTo,
      clipState.setSelectedClipId,
      overlayState.setSelectedOverlayId,
    ],
  );

  const handleTimelineMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!timeline.draggingPlayhead.current) return;
      const canvas = timeline.canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x =
        e.clientX - rect.left + (canvas.parentElement?.scrollLeft || 0);
      playback.seekTo(x / timeline.timelineZoom);
    },
    [timeline.timelineZoom, playback.seekTo],
  );

  const handleTimelineMouseUp = useCallback(() => {
    timeline.draggingPlayhead.current = false;
  }, []);

  // Clip selection from panel
  const handleSelectClip = useCallback(
    (id: number, src: string) => {
      clipState.setSelectedClipId(id);
      if (videoRef.current) {
        videoRef.current.src = src;
        videoRef.current.load();
      }
    },
    [clipState.setSelectedClipId],
  );

  // Tab icons for properties panel
  const tabConfig = [
    { key: 'clip' as const, label: 'Clips', icon: Film },
    { key: 'text' as const, label: 'Text', icon: Type },
    { key: 'color' as const, label: 'Color', icon: Palette },
  ];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-gray-950 dark:to-indigo-950 overflow-hidden select-none">
      {/* Top Toolbar */}
      <VideoToolbar
        clipCount={clipState.clips.length}
        isExporting={exporter.isExporting}
        hasActiveClip={!!clipState.activeClip}
        onImport={importVideo}
        onExport={exporter.exportVideo}
        onSplit={() => clipState.splitAtPlayhead(playback.playheadTime)}
        onDelete={() =>
          clipState.selectedClipId &&
          clipState.deleteClip(clipState.selectedClipId)
        }
      />

      {/* Main content area */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Preview + Playback Controls */}
        <div className="flex-1 flex flex-col min-w-0">
          <VideoPreview
            videoRef={videoRef}
            clipCount={clipState.clips.length}
            filterStr={color.filterStr}
            textOverlays={overlayState.overlays}
            playheadTime={playback.playheadTime}
            onImport={importVideo}
          />
          <PlaybackControls
            isPlaying={playback.isPlaying}
            volume={playback.volume}
            playbackSpeed={playback.playbackSpeed}
            playheadTime={playback.playheadTime}
            duration={duration}
            onTogglePlay={playback.togglePlay}
            onGoToStart={() => {
              playback.seekTo(0);
              if (videoRef.current) videoRef.current.currentTime = 0;
            }}
            onGoToEnd={() => playback.seekTo(duration)}
            onStepBack={() => playback.stepFrame(-1)}
            onStepForward={() => playback.stepFrame(1)}
            onVolumeChange={playback.setVolume}
            onSpeedChange={playback.setPlaybackSpeed}
          />
        </div>

        {/* Right Properties Panel */}
        <div className="w-64 bg-white/80 dark:bg-gray-900/80 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {tabConfig.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                title={`${label} Panel`}
                className={`flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-semibold uppercase transition-colors ${
                  tab === key
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-auto p-2">
            {tab === 'clip' && (
              <ClipProperties
                clips={clipState.clips}
                selectedClipId={clipState.selectedClipId}
                activeClip={clipState.activeClip}
                onSelectClip={handleSelectClip}
                onDeleteClip={clipState.deleteClip}
                onUpdateClip={clipState.updateClip}
              />
            )}
            {tab === 'text' && (
              <TextOverlayPanel
                overlays={overlayState.overlays}
                selectedOverlayId={overlayState.selectedOverlayId}
                onAddOverlay={() =>
                  overlayState.addOverlay(playback.playheadTime)
                }
                onSelectOverlay={overlayState.setSelectedOverlayId}
                onDeleteOverlay={overlayState.deleteOverlay}
                onUpdateOverlay={overlayState.updateOverlay}
              />
            )}
            {tab === 'color' && (
              <ColorGradePanel
                colorGrade={color.colorGrade}
                activePresetName={color.activePresetName}
                onApplyPreset={color.applyPreset}
                onUpdateGrade={color.updateGrade}
                onReset={color.resetGrade}
              />
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <TimelineArea
        timelineZoom={timeline.timelineZoom}
        onZoomIn={() => timeline.setTimelineZoom((z) => Math.min(200, z + 10))}
        onZoomOut={() => timeline.setTimelineZoom((z) => Math.max(10, z - 10))}
        canvasRef={timeline.canvasRef}
        containerRef={timeline.containerRef}
        onTimelineClick={handleTimelineClick}
        onTimelineMouseMove={handleTimelineMouseMove}
        onTimelineMouseUp={handleTimelineMouseUp}
      />

      {/* Export overlay */}
      {exporter.isExporting && (
        <ExportOverlay
          progress={exporter.exportProgress}
          onCancel={exporter.cancelExport}
        />
      )}
    </div>
  );
};
