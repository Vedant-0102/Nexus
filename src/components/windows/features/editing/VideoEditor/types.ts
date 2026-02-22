export interface Clip {
  id: number;
  name: string;
  src: string;
  track: number;
  startTime: number;
  duration: number;
  trimStart: number;
  trimEnd: number;
  speed: number;
}

export interface TextOverlay {
  id: number;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  startTime: number;
  duration: number;
}

export interface ColorGrade {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  temperature: number;
  tint: number;
}

export interface Preset {
  name: string;
  grade: ColorGrade;
}

export interface ColorAdjustmentDef {
  key: keyof ColorGrade;
  label: string;
  unit: string;
  min: number;
  max: number;
  defaultValue: number;
}

export type PropertiesTab = 'clip' | 'text' | 'color';
