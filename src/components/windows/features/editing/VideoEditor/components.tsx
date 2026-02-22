import React from 'react';
import { Clip, TextOverlay, ColorGrade } from './types';
import { TRACKS, PRESETS, SPEED_OPTIONS, TRACK_HEIGHT, RULER_HEIGHT, COLOR_ADJUSTMENTS } from './constants';
import { formatTime } from './utils';
import {
  Film,
  Scissors,
  Trash2,
  Download,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Type,
  Palette,
  Plus,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';

// ─── Shared Styles ──────────────────────────────────────────────────────────

const btnClass =
  'p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

const inputClass =
  'w-full text-[11px] px-1.5 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-400';

const labelClass = 'text-[11px] text-gray-500 dark:text-gray-400 font-medium';

// ─── VideoToolbar ───────────────────────────────────────────────────────────

interface VideoToolbarProps {
  clipCount: number;
  isExporting: boolean;
  hasActiveClip: boolean;
  onImport: () => void;
  onExport: () => void;
  onSplit: () => void;
  onDelete: () => void;
}

export const VideoToolbar: React.FC<VideoToolbarProps> = ({
  clipCount,
  isExporting,
  hasActiveClip,
  onImport,
  onExport,
  onSplit,
  onDelete,
}) => (
  <div className="flex items-center gap-1 px-2 py-1 bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700">
    <button
      onClick={onImport}
      title="Import Video"
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold transition-colors"
    >
      <Film size={14} />
      Import
    </button>

    <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

    <button
      onClick={onSplit}
      disabled={!hasActiveClip}
      title="Split Clip at Playhead"
      className={btnClass}
    >
      <Scissors size={16} />
    </button>

    <button
      onClick={onDelete}
      disabled={clipCount === 0 || !hasActiveClip}
      title="Delete Selected Clip"
      className={btnClass}
    >
      <Trash2 size={16} />
    </button>

    <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

    <button
      onClick={onExport}
      disabled={clipCount === 0 || isExporting}
      title="Export Video"
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-green-600 text-white hover:bg-green-700"
    >
      <Download size={14} />
      Export
    </button>

    <div className="ml-auto text-[11px] text-gray-500 dark:text-gray-400">
      {clipCount} clip{clipCount !== 1 ? 's' : ''} loaded
    </div>
  </div>
);

// ─── VideoPreview ───────────────────────────────────────────────────────────

interface VideoPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  clipCount: number;
  filterStr: string;
  textOverlays: TextOverlay[];
  playheadTime: number;
  onImport: () => void;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  videoRef,
  clipCount,
  filterStr,
  textOverlays,
  playheadTime,
  onImport,
}) => (
  <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
    {clipCount > 0 ? (
      <>
        <video
          ref={videoRef}
          className="max-w-full max-h-full"
          style={{ filter: filterStr }}
        />
        {textOverlays
          .filter(
            (ov) =>
              playheadTime >= ov.startTime &&
              playheadTime <= ov.startTime + ov.duration,
          )
          .map((ov) => (
            <div
              key={ov.id}
              className="absolute pointer-events-none select-none"
              style={{
                left: `${ov.x}%`,
                top: `${ov.y}%`,
                transform: 'translate(-50%, -50%)',
                color: ov.color,
                fontSize: ov.fontSize,
                fontFamily: ov.fontFamily,
                fontWeight: 'bold',
                textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
              }}
            >
              {ov.text}
            </div>
          ))}
      </>
    ) : (
      <div className="text-gray-500 text-center p-8">
        <Film size={48} className="mx-auto mb-3 opacity-30" />
        <div className="text-sm mb-1">Import a video to get started</div>
        <div className="text-[11px] text-gray-400 mb-3">
          Press Space to play/pause
        </div>
        <button
          onClick={onImport}
          title="Import Video"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors"
        >
          Import Video
        </button>
      </div>
    )}
  </div>
);

// ─── PlaybackControls ───────────────────────────────────────────────────────

interface PlaybackControlsProps {
  isPlaying: boolean;
  volume: number;
  playbackSpeed: number;
  playheadTime: number;
  duration: number;
  onTogglePlay: () => void;
  onGoToStart: () => void;
  onGoToEnd: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onVolumeChange: (volume: number) => void;
  onSpeedChange: (speed: number) => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  volume,
  playbackSpeed,
  playheadTime,
  duration,
  onTogglePlay,
  onGoToStart,
  onGoToEnd,
  onStepBack,
  onStepForward,
  onVolumeChange,
  onSpeedChange,
}) => (
  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 dark:bg-gray-900/80 border-t border-gray-200 dark:border-gray-700">
    <button onClick={onGoToStart} className={btnClass} title="Go to Start">
      <SkipBack size={16} />
    </button>
    <button onClick={onStepBack} className={btnClass} title="Previous Frame">
      <ChevronLeft size={16} />
    </button>
    <button
      onClick={onTogglePlay}
      className="p-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
      title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
    >
      {isPlaying ? <Pause size={18} /> : <Play size={18} />}
    </button>
    <button onClick={onStepForward} className={btnClass} title="Next Frame">
      <ChevronRight size={16} />
    </button>
    <button onClick={onGoToEnd} className={btnClass} title="Go to End">
      <SkipForward size={16} />
    </button>

    <div className="w-px h-5 bg-gray-300 dark:bg-gray-600" />

    {/* Current time display */}
    <span className="text-[11px] font-mono text-gray-600 dark:text-gray-400 min-w-[100px] text-center">
      {formatTime(playheadTime)} / {formatTime(duration)}
    </span>

    <div className="w-px h-5 bg-gray-300 dark:bg-gray-600" />

    {/* Playback Speed */}
    <label className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400" title="Playback Speed">
      <span className="font-medium">Speed</span>
      <select
        value={playbackSpeed}
        onChange={(e) => onSpeedChange(Number(e.target.value))}
        title="Playback Speed"
        className="text-[11px] px-1 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300"
      >
        {SPEED_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}x
          </option>
        ))}
      </select>
    </label>

    <div className="w-px h-5 bg-gray-300 dark:bg-gray-600" />

    {/* Volume */}
    <label className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400" title="Volume">
      <button
        onClick={() => onVolumeChange(volume === 0 ? 1 : 0)}
        className={btnClass}
        title={volume === 0 ? 'Unmute' : 'Mute'}
      >
        {volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={volume}
        onChange={(e) => onVolumeChange(Number(e.target.value))}
        title={`Volume: ${Math.round(volume * 100)}%`}
        className="w-16 h-1.5 accent-blue-600"
      />
    </label>
  </div>
);

// ─── ClipProperties ─────────────────────────────────────────────────────────

interface ClipPropertiesProps {
  clips: Clip[];
  selectedClipId: number | null;
  activeClip: Clip | null;
  onSelectClip: (id: number, src: string) => void;
  onDeleteClip: (id: number) => void;
  onUpdateClip: (id: number, updates: Partial<Clip>) => void;
}

export const ClipProperties: React.FC<ClipPropertiesProps> = ({
  clips,
  selectedClipId,
  activeClip,
  onSelectClip,
  onDeleteClip,
  onUpdateClip,
}) => (
  <div className="space-y-2">
    <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
      Clips
    </div>

    {clips.length === 0 && (
      <div className="text-xs text-gray-400 text-center py-4">
        No clips loaded
      </div>
    )}

    {clips.map((c) => (
      <div
        key={c.id}
        onClick={() => onSelectClip(c.id, c.src)}
        className={`p-2 rounded text-xs cursor-pointer transition-colors ${
          selectedClipId === c.id
            ? 'bg-blue-100 dark:bg-blue-900/40 ring-1 ring-blue-400'
            : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        <div className="flex justify-between items-center">
          <span className="truncate text-gray-700 dark:text-gray-300 font-medium">
            {c.name}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClip(c.id);
            }}
            className="text-red-500 p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
            title="Delete Clip"
          >
            <X size={12} />
          </button>
        </div>
        <div className="text-[10px] text-gray-500 mt-0.5">
          {formatTime(c.duration)}
        </div>
      </div>
    ))}

    {/* Selected clip properties */}
    {activeClip && (
      <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
        <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Clip Properties
        </div>

        {/* Track */}
        <div className="flex items-center justify-between">
          <span className={labelClass}>Track:</span>
          <select
            value={activeClip.track}
            onChange={(e) =>
              onUpdateClip(activeClip.id, { track: Number(e.target.value) })
            }
            title="Assign clip to a track"
            className="w-24 text-[11px] px-1.5 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300"
          >
            {TRACKS.map((t, i) => (
              <option key={i} value={i}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Speed */}
        <div className="flex items-center justify-between">
          <span className={labelClass}>Speed:</span>
          <select
            value={activeClip.speed}
            onChange={(e) =>
              onUpdateClip(activeClip.id, { speed: Number(e.target.value) })
            }
            title="Clip playback speed"
            className="w-24 text-[11px] px-1.5 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300"
          >
            {SPEED_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}x
              </option>
            ))}
          </select>
        </div>

        {/* Start Time */}
        <div className="flex items-center justify-between">
          <span className={labelClass}>Start Time:</span>
          <input
            type="number"
            min={0}
            step={0.1}
            value={activeClip.startTime.toFixed(1)}
            onChange={(e) =>
              onUpdateClip(activeClip.id, {
                startTime: Math.max(0, Number(e.target.value)),
              })
            }
            title="Clip start time on timeline (seconds)"
            className="w-24 text-[11px] px-1.5 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300"
          />
        </div>

        {/* Duration display */}
        <div className="flex items-center justify-between">
          <span className={labelClass}>Duration:</span>
          <span className="text-[11px] text-gray-600 dark:text-gray-400 font-mono">
            {formatTime(activeClip.duration)}
          </span>
        </div>

        {/* Trim Start */}
        <div className="flex items-center justify-between">
          <span className={labelClass}>Trim Start:</span>
          <input
            type="number"
            min={0}
            max={activeClip.trimEnd - 0.1}
            step={0.1}
            value={activeClip.trimStart.toFixed(1)}
            onChange={(e) =>
              onUpdateClip(activeClip.id, {
                trimStart: Math.max(
                  0,
                  Math.min(activeClip.trimEnd - 0.1, Number(e.target.value)),
                ),
              })
            }
            title="Trim start point (seconds into the clip)"
            className="w-24 text-[11px] px-1.5 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300"
          />
        </div>

        {/* Trim End */}
        <div className="flex items-center justify-between">
          <span className={labelClass}>Trim End:</span>
          <input
            type="number"
            min={activeClip.trimStart + 0.1}
            max={activeClip.duration}
            step={0.1}
            value={activeClip.trimEnd.toFixed(1)}
            onChange={(e) =>
              onUpdateClip(activeClip.id, {
                trimEnd: Math.max(
                  activeClip.trimStart + 0.1,
                  Math.min(activeClip.duration, Number(e.target.value)),
                ),
              })
            }
            title="Trim end point (seconds into the clip)"
            className="w-24 text-[11px] px-1.5 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300"
          />
        </div>

        {/* Effective length */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
          <span className={labelClass}>Effective Length:</span>
          <span className="text-[11px] text-gray-600 dark:text-gray-400 font-mono">
            {formatTime((activeClip.trimEnd - activeClip.trimStart) / activeClip.speed)}
          </span>
        </div>
      </div>
    )}
  </div>
);

// ─── TextOverlayPanel ───────────────────────────────────────────────────────

interface TextOverlayPanelProps {
  overlays: TextOverlay[];
  selectedOverlayId: number | null;
  onAddOverlay: () => void;
  onSelectOverlay: (id: number) => void;
  onDeleteOverlay: (id: number) => void;
  onUpdateOverlay: (id: number, updates: Partial<TextOverlay>) => void;
}

export const TextOverlayPanel: React.FC<TextOverlayPanelProps> = ({
  overlays,
  selectedOverlayId,
  onAddOverlay,
  onSelectOverlay,
  onDeleteOverlay,
  onUpdateOverlay,
}) => {
  const selectedOv = overlays.find((o) => o.id === selectedOverlayId) ?? null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Text Overlays
        </div>
        <button
          onClick={onAddOverlay}
          title="Add Text Overlay"
          className="flex items-center gap-1 px-2 py-1 text-[11px] bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
        >
          <Plus size={12} />
          Add Text
        </button>
      </div>

      {overlays.length === 0 && (
        <div className="text-[11px] text-gray-400 text-center py-3">
          No text overlays yet
        </div>
      )}

      {overlays.map((ov) => (
        <div
          key={ov.id}
          onClick={() => onSelectOverlay(ov.id)}
          className={`p-2 rounded text-xs cursor-pointer transition-colors ${
            selectedOverlayId === ov.id
              ? 'bg-purple-100 dark:bg-purple-900/40 ring-1 ring-purple-400'
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="truncate text-gray-700 dark:text-gray-300 font-medium">
              {ov.text}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteOverlay(ov.id);
              }}
              className="text-red-500 p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
              title="Remove Overlay"
            >
              <X size={12} />
            </button>
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            {formatTime(ov.startTime)} | {ov.duration}s
          </div>
        </div>
      ))}

      {/* Edit selected overlay */}
      {selectedOv && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
          <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Edit Overlay
          </div>

          {/* Text */}
          <div>
            <span className={labelClass}>Text:</span>
            <input
              value={selectedOv.text}
              onChange={(e) =>
                onUpdateOverlay(selectedOv.id, { text: e.target.value })
              }
              title="Overlay text content"
              className={inputClass + ' mt-0.5'}
            />
          </div>

          {/* Position */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className={labelClass}>X Position (%):</span>
              <input
                type="number"
                min={0}
                max={100}
                value={selectedOv.x}
                onChange={(e) =>
                  onUpdateOverlay(selectedOv.id, {
                    x: Math.max(0, Math.min(100, Number(e.target.value))),
                  })
                }
                title="Horizontal position as percentage (0% = left, 100% = right)"
                className={inputClass + ' mt-0.5'}
              />
            </div>
            <div>
              <span className={labelClass}>Y Position (%):</span>
              <input
                type="number"
                min={0}
                max={100}
                value={selectedOv.y}
                onChange={(e) =>
                  onUpdateOverlay(selectedOv.id, {
                    y: Math.max(0, Math.min(100, Number(e.target.value))),
                  })
                }
                title="Vertical position as percentage (0% = top, 100% = bottom)"
                className={inputClass + ' mt-0.5'}
              />
            </div>
          </div>

          {/* Font Size */}
          <div className="flex items-center justify-between">
            <span className={labelClass}>Font Size:</span>
            <input
              type="number"
              min={8}
              max={120}
              value={selectedOv.fontSize}
              onChange={(e) =>
                onUpdateOverlay(selectedOv.id, {
                  fontSize: Math.max(8, Math.min(120, Number(e.target.value))),
                })
              }
              title="Font size in pixels"
              className="w-20 text-[11px] px-1.5 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300"
            />
          </div>

          {/* Color */}
          <div className="flex items-center justify-between">
            <span className={labelClass}>Text Color:</span>
            <input
              type="color"
              value={selectedOv.color}
              onChange={(e) =>
                onUpdateOverlay(selectedOv.id, { color: e.target.value })
              }
              title="Text color"
              className="w-8 h-7 cursor-pointer rounded border border-gray-300 dark:border-gray-600"
            />
          </div>

          {/* Font Family */}
          <div className="flex items-center justify-between">
            <span className={labelClass}>Font:</span>
            <select
              value={selectedOv.fontFamily}
              onChange={(e) =>
                onUpdateOverlay(selectedOv.id, { fontFamily: e.target.value })
              }
              title="Font family"
              className="w-28 text-[11px] px-1.5 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300"
            >
              <option value="sans-serif">Sans Serif</option>
              <option value="serif">Serif</option>
              <option value="monospace">Monospace</option>
              <option value="cursive">Cursive</option>
            </select>
          </div>

          {/* Timing */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className={labelClass}>Start Time:</span>
              <input
                type="number"
                min={0}
                step={0.1}
                value={selectedOv.startTime}
                onChange={(e) =>
                  onUpdateOverlay(selectedOv.id, {
                    startTime: Math.max(0, Number(e.target.value)),
                  })
                }
                title="When the overlay appears (seconds)"
                className={inputClass + ' mt-0.5'}
              />
            </div>
            <div>
              <span className={labelClass}>Duration:</span>
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={selectedOv.duration}
                onChange={(e) =>
                  onUpdateOverlay(selectedOv.id, {
                    duration: Math.max(0.5, Number(e.target.value)),
                  })
                }
                title="How long the overlay is visible (seconds)"
                className={inputClass + ' mt-0.5'}
              />
            </div>
          </div>

          {/* Delete button */}
          <button
            onClick={() => onDeleteOverlay(selectedOv.id)}
            title="Remove Overlay"
            className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
          >
            <Trash2 size={12} />
            Remove Overlay
          </button>
        </div>
      )}
    </div>
  );
};

// ─── ColorGradePanel ────────────────────────────────────────────────────────

interface ColorGradePanelProps {
  colorGrade: ColorGrade;
  activePresetName: string;
  onApplyPreset: (presetName: string) => void;
  onUpdateGrade: (key: keyof ColorGrade, value: number) => void;
  onReset: () => void;
}

export const ColorGradePanel: React.FC<ColorGradePanelProps> = ({
  colorGrade,
  activePresetName,
  onApplyPreset,
  onUpdateGrade,
  onReset,
}) => (
  <div className="space-y-3">
    <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
      Color Presets
    </div>
    <div className="grid grid-cols-2 gap-1">
      {PRESETS.map((p) => (
        <button
          key={p.name}
          onClick={() => onApplyPreset(p.name)}
          title={`Apply ${p.name} preset`}
          className={`px-2 py-1.5 text-[11px] rounded transition-colors ${
            activePresetName === p.name
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          {p.name}
        </button>
      ))}
    </div>

    <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider pt-1">
      Adjustments
    </div>

    {COLOR_ADJUSTMENTS.map(({ key, label, unit, min, max }) => (
      <div key={key} className="space-y-0.5">
        <div className="flex items-center justify-between">
          <span className={labelClass}>{label}:</span>
          <span className="text-[11px] font-mono text-gray-600 dark:text-gray-400">
            {colorGrade[key]}
            {unit}
          </span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          value={colorGrade[key]}
          onChange={(e) => onUpdateGrade(key, Number(e.target.value))}
          title={`${label}: ${colorGrade[key]}${unit}`}
          className="w-full h-1.5 accent-blue-600"
        />
      </div>
    ))}

    <button
      onClick={onReset}
      title="Reset to Default"
      className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 transition-colors"
    >
      <RotateCcw size={12} />
      Reset to Default
    </button>
  </div>
);

// ─── TimelineArea ───────────────────────────────────────────────────────────

interface TimelineAreaProps {
  timelineZoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onTimelineClick: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onTimelineMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onTimelineMouseUp: () => void;
}

export const TimelineArea: React.FC<TimelineAreaProps> = ({
  timelineZoom,
  onZoomIn,
  onZoomOut,
  canvasRef,
  containerRef,
  onTimelineClick,
  onTimelineMouseMove,
  onTimelineMouseUp,
}) => (
  <div className="border-t border-gray-200 dark:border-gray-700">
    {/* Timeline header */}
    <div className="flex items-center gap-2 px-2 py-1 bg-white/60 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700">
      <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        Timeline
      </span>
      <div className="flex items-center gap-1.5 ml-auto">
        <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
          Timeline Zoom
        </span>
        <button
          onClick={onZoomOut}
          className="p-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          title="Zoom Out Timeline"
        >
          <ZoomOut size={14} />
        </button>
        <span className="text-[11px] text-gray-500 w-8 text-center font-mono">
          {timelineZoom}
        </span>
        <button
          onClick={onZoomIn}
          className="p-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          title="Zoom In Timeline"
        >
          <ZoomIn size={14} />
        </button>
      </div>
    </div>

    {/* Track labels + Canvas */}
    <div className="flex">
      <div className="w-20 flex-shrink-0 bg-white/80 dark:bg-gray-900/80 border-r border-gray-200 dark:border-gray-700">
        <div
          style={{ height: RULER_HEIGHT }}
          className="border-b border-gray-200 dark:border-gray-700"
        />
        {TRACKS.map((t, i) => (
          <div
            key={i}
            className="flex items-center px-2 text-[10px] text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 font-medium"
            style={{ height: TRACK_HEIGHT }}
          >
            {t}
          </div>
        ))}
        {/* Overlay track label */}
        <div
          className="flex items-center px-2 text-[10px] text-purple-500 dark:text-purple-400 border-b border-gray-200 dark:border-gray-700 font-medium"
          style={{ height: TRACK_HEIGHT }}
        >
          Text
        </div>
      </div>
      <div
        ref={containerRef}
        className="flex-1 overflow-x-auto overflow-y-hidden"
      >
        <canvas
          ref={canvasRef}
          className="cursor-pointer"
          onClick={onTimelineClick}
          onMouseMove={onTimelineMouseMove}
          onMouseUp={onTimelineMouseUp}
          onMouseLeave={onTimelineMouseUp}
        />
      </div>
    </div>
  </div>
);

// ─── ExportOverlay ──────────────────────────────────────────────────────────

interface ExportOverlayProps {
  progress: number;
  onCancel: () => void;
}

export const ExportOverlay: React.FC<ExportOverlayProps> = ({
  progress,
  onCancel,
}) => (
  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl text-center min-w-[320px]">
      <Download
        size={32}
        className="mx-auto mb-3 text-blue-600 dark:text-blue-400"
      />
      <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        Exporting Video...
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
        <div
          className="bg-blue-600 h-3 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 mb-3">{progress}%</div>
      <button
        onClick={onCancel}
        title="Cancel Export"
        className="px-4 py-1.5 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 transition-colors"
      >
        Cancel
      </button>
    </div>
  </div>
);
