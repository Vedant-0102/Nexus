import { LucideIcon } from 'lucide-react';

export type Tool = 'brush' | 'eraser' | 'line' | 'rect' | 'ellipse' | 'fill' | 'text' | 'select';
export type FilterType = 'grayscale' | 'sepia' | 'invert' | 'brightness' | 'contrast' | 'blur' | 'sharpen' | 'posterize' | 'pixelate';
export type FillMode = 'fill' | 'stroke';
export type ExportFormat = 'png' | 'jpeg' | 'webp';

export interface Layer {
  id: number;
  name: string;
  canvas: HTMLCanvasElement;
  visible: boolean;
  opacity: number;
}

export interface HistoryState {
  layers: { id: number; name: string; data: ImageData; visible: boolean; opacity: number }[];
  activeLayerId: number;
}

export interface Selection {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ToolDefinition {
  id: Tool;
  label: string;
  icon: LucideIcon;
  description: string;
}
