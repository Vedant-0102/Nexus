import { Paintbrush, Eraser, Minus, Square, Circle, PaintBucket, Type, BoxSelect } from 'lucide-react';
import { ToolDefinition } from './types';

export const CHECKERBOARD = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\'%3E%3Crect width=\'8\' height=\'8\' fill=\'%23ccc\'/%3E%3Crect x=\'8\' y=\'8\' width=\'8\' height=\'8\' fill=\'%23ccc\'/%3E%3Crect x=\'8\' width=\'8\' height=\'8\' fill=\'%23fff\'/%3E%3Crect y=\'8\' width=\'8\' height=\'8\' fill=\'%23fff\'/%3E%3C/svg%3E")';

export const MAX_HISTORY = 20;

export const TOOLS: ToolDefinition[] = [
  { id: 'brush', label: 'Brush', icon: Paintbrush, description: 'Draw freehand strokes on the canvas' },
  { id: 'eraser', label: 'Eraser', icon: Eraser, description: 'Erase parts of the current layer' },
  { id: 'line', label: 'Line', icon: Minus, description: 'Draw a straight line between two points' },
  { id: 'rect', label: 'Rectangle', icon: Square, description: 'Draw a rectangle shape' },
  { id: 'ellipse', label: 'Ellipse', icon: Circle, description: 'Draw an ellipse or circle shape' },
  { id: 'fill', label: 'Fill', icon: PaintBucket, description: 'Fill an area with the foreground color' },
  { id: 'text', label: 'Text', icon: Type, description: 'Place text on the canvas' },
  { id: 'select', label: 'Select', icon: BoxSelect, description: 'Select a rectangular region for cropping' },
];

export const FONT_OPTIONS = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Impact'];

export const DEFAULT_CANVAS_WIDTH = 800;
export const DEFAULT_CANVAS_HEIGHT = 600;

export const DEFAULT_FILL_TOLERANCE = 30;
