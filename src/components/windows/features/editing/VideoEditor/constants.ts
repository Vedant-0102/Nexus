import { ColorGrade, Preset, ColorAdjustmentDef } from './types';

export const TRACK_HEIGHT = 40;
export const RULER_HEIGHT = 24;

export const TRACKS = ['Video 1', 'Video 2', 'Video 3'];

export const DEFAULT_COLOR_GRADE: ColorGrade = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hue: 0,
  temperature: 0,
  tint: 0,
};

export const PRESETS: Preset[] = [
  {
    name: 'Normal',
    grade: { brightness: 100, contrast: 100, saturation: 100, hue: 0, temperature: 0, tint: 0 },
  },
  {
    name: 'Cinematic',
    grade: { brightness: 95, contrast: 130, saturation: 85, hue: 0, temperature: 10, tint: -5 },
  },
  {
    name: 'Vintage',
    grade: { brightness: 95, contrast: 90, saturation: 70, hue: 15, temperature: 15, tint: 5 },
  },
  {
    name: 'Warm',
    grade: { brightness: 105, contrast: 105, saturation: 120, hue: 10, temperature: 20, tint: 0 },
  },
  {
    name: 'Cool',
    grade: { brightness: 100, contrast: 110, saturation: 90, hue: 200, temperature: -15, tint: 5 },
  },
  {
    name: 'B&W',
    grade: { brightness: 100, contrast: 120, saturation: 0, hue: 0, temperature: 0, tint: 0 },
  },
  {
    name: 'High Contrast',
    grade: { brightness: 100, contrast: 150, saturation: 110, hue: 0, temperature: 0, tint: 0 },
  },
  {
    name: 'Faded',
    grade: { brightness: 110, contrast: 85, saturation: 80, hue: 0, temperature: 5, tint: 0 },
  },
];

export const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4];

export const COLOR_ADJUSTMENTS: ColorAdjustmentDef[] = [
  { key: 'brightness', label: 'Brightness', unit: '%', min: 0, max: 200, defaultValue: 100 },
  { key: 'contrast', label: 'Contrast', unit: '%', min: 0, max: 200, defaultValue: 100 },
  { key: 'saturation', label: 'Saturation', unit: '%', min: 0, max: 200, defaultValue: 100 },
  { key: 'hue', label: 'Hue Rotate', unit: '\u00B0', min: 0, max: 360, defaultValue: 0 },
  { key: 'temperature', label: 'Temperature', unit: '', min: -50, max: 50, defaultValue: 0 },
  { key: 'tint', label: 'Tint', unit: '', min: -50, max: 50, defaultValue: 0 },
];

export const DEFAULT_DURATION = 30;
export const DEFAULT_TIMELINE_ZOOM = 40;
