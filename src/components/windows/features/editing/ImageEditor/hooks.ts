import { useState, useRef, useCallback } from 'react';
import { Layer, HistoryState, Selection, Tool, ExportFormat, FillMode } from './types';
import { MAX_HISTORY, DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT, DEFAULT_FILL_TOLERANCE } from './constants';
import { createCanvas } from './utils';

export function useCanvasHistory(layers: Layer[], activeLayerId: number) {
  const historyRef = useRef<HistoryState[]>([]);
  const historyIndexRef = useRef(-1);

  const saveHistory = useCallback(() => {
    const state: HistoryState = {
      layers: layers.map(l => ({
        id: l.id,
        name: l.name,
        visible: l.visible,
        opacity: l.opacity,
        data: l.canvas.getContext('2d')!.getImageData(0, 0, l.canvas.width, l.canvas.height),
      })),
      activeLayerId,
    };
    const h = historyRef.current;
    const idx = historyIndexRef.current;
    historyRef.current = [...h.slice(0, idx + 1), state].slice(-MAX_HISTORY);
    historyIndexRef.current = historyRef.current.length - 1;
  }, [layers, activeLayerId]);

  const getHistoryState = useCallback((direction: 'undo' | 'redo'): HistoryState | null => {
    const idx = historyIndexRef.current;
    if (direction === 'undo') {
      if (idx <= 0) return null;
      historyIndexRef.current = idx - 1;
      return historyRef.current[idx - 1];
    } else {
      if (idx >= historyRef.current.length - 1) return null;
      historyIndexRef.current = idx + 1;
      return historyRef.current[idx + 1];
    }
  }, []);

  const clearHistory = useCallback(() => {
    historyRef.current = [];
    historyIndexRef.current = -1;
  }, []);

  return { saveHistory, getHistoryState, clearHistory };
}

export function useLayers() {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState(0);
  const [canvasW, setCanvasW] = useState(DEFAULT_CANVAS_WIDTH);
  const [canvasH, setCanvasH] = useState(DEFAULT_CANVAS_HEIGHT);
  const nextLayerId = useRef(1);

  const initLayers = useCallback((width: number, height: number) => {
    const c = createCanvas(width, height, '#ffffff');
    const layer: Layer = { id: 0, name: 'Background', canvas: c, visible: true, opacity: 1 };
    setLayers([layer]);
    setActiveLayerId(0);
    setCanvasW(width);
    setCanvasH(height);
    nextLayerId.current = 1;
  }, []);

  const getActiveLayer = useCallback((): Layer | undefined => {
    return layers.find(l => l.id === activeLayerId);
  }, [layers, activeLayerId]);

  const addLayer = useCallback(() => {
    const c = createCanvas(canvasW, canvasH);
    const id = nextLayerId.current++;
    const newLayer: Layer = { id, name: `Layer ${id}`, canvas: c, visible: true, opacity: 1 };
    setLayers(prev => [...prev, newLayer]);
    setActiveLayerId(id);
  }, [canvasW, canvasH]);

  const deleteLayer = useCallback((id: number) => {
    if (layers.length <= 1) return;
    setLayers(prev => {
      const filtered = prev.filter(l => l.id !== id);
      if (activeLayerId === id) setActiveLayerId(filtered[filtered.length - 1].id);
      return filtered;
    });
  }, [layers.length, activeLayerId]);

  const toggleLayerVisibility = useCallback((id: number) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  }, []);

  const setLayerOpacity = useCallback((id: number, opacity: number) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, opacity } : l));
  }, []);

  const moveLayer = useCallback((id: number, direction: 'up' | 'down') => {
    setLayers(prev => {
      const idx = prev.findIndex(l => l.id === id);
      if (direction === 'up' && idx >= prev.length - 1) return prev;
      if (direction === 'down' && idx <= 0) return prev;
      const newArr = [...prev];
      const swapIdx = direction === 'up' ? idx + 1 : idx - 1;
      [newArr[idx], newArr[swapIdx]] = [newArr[swapIdx], newArr[idx]];
      return newArr;
    });
  }, []);

  const restoreState = useCallback((state: HistoryState) => {
    const newLayers: Layer[] = state.layers.map(ls => {
      const c = document.createElement('canvas');
      c.width = ls.data.width;
      c.height = ls.data.height;
      c.getContext('2d')!.putImageData(ls.data, 0, 0);
      return { id: ls.id, name: ls.name, canvas: c, visible: ls.visible, opacity: ls.opacity };
    });
    setLayers(newLayers);
    setActiveLayerId(state.activeLayerId);
    setCanvasW(newLayers[0]?.canvas.width || DEFAULT_CANVAS_WIDTH);
    setCanvasH(newLayers[0]?.canvas.height || DEFAULT_CANVAS_HEIGHT);
  }, []);

  return {
    layers, setLayers,
    activeLayerId, setActiveLayerId,
    canvasW, setCanvasW,
    canvasH, setCanvasH,
    nextLayerId,
    initLayers, getActiveLayer, addLayer, deleteLayer,
    toggleLayerVisibility, setLayerOpacity, moveLayer, restoreState,
  };
}

export function useImageTools() {
  const [tool, setTool] = useState<Tool>('brush');
  const [brushSize, setBrushSize] = useState(8);
  const [brushOpacity, setBrushOpacity] = useState(100);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [fillMode, setFillMode] = useState<FillMode>('stroke');
  const [fillTolerance, setFillTolerance] = useState(DEFAULT_FILL_TOLERANCE);
  const [textInput, setTextInput] = useState('Hello');
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState('Arial');

  return {
    tool, setTool,
    brushSize, setBrushSize,
    brushOpacity, setBrushOpacity,
    fgColor, setFgColor,
    bgColor, setBgColor,
    fillMode, setFillMode,
    fillTolerance, setFillTolerance,
    textInput, setTextInput,
    fontSize, setFontSize,
    fontFamily, setFontFamily,
  };
}

export function useCanvasView() {
  const [zoom, setZoom] = useState(1);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [selection, setSelection] = useState<Selection | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showResizeDialog, setShowResizeDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [resizeW, setResizeW] = useState(DEFAULT_CANVAS_WIDTH);
  const [resizeH, setResizeH] = useState(DEFAULT_CANVAS_HEIGHT);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [exportQuality, setExportQuality] = useState(92);

  const adjustZoom = useCallback((delta: number) => {
    setZoom(z => Math.max(0.1, Math.min(10, z + delta)));
  }, []);

  return {
    zoom, setZoom, adjustZoom,
    cursorPos, setCursorPos,
    selection, setSelection,
    showFilterPanel, setShowFilterPanel,
    showResizeDialog, setShowResizeDialog,
    showExportDialog, setShowExportDialog,
    resizeW, setResizeW,
    resizeH, setResizeH,
    exportFormat, setExportFormat,
    exportQuality, setExportQuality,
  };
}
