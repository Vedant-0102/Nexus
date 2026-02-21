import React, { useState, useRef, useCallback, useEffect } from 'react';

type Tool = 'brush' | 'eraser' | 'line' | 'rect' | 'ellipse' | 'fill' | 'text' | 'select';
type FilterType = 'grayscale' | 'sepia' | 'invert' | 'brightness' | 'contrast' | 'blur' | 'sharpen' | 'posterize' | 'pixelate';

interface Layer {
  id: number;
  name: string;
  canvas: HTMLCanvasElement;
  visible: boolean;
  opacity: number;
}

interface HistoryState {
  layers: { id: number; name: string; data: ImageData; visible: boolean; opacity: number }[];
  activeLayerId: number;
}

const CHECKERBOARD = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\'%3E%3Crect width=\'8\' height=\'8\' fill=\'%23ccc\'/%3E%3Crect x=\'8\' y=\'8\' width=\'8\' height=\'8\' fill=\'%23ccc\'/%3E%3Crect x=\'8\' width=\'8\' height=\'8\' fill=\'%23fff\'/%3E%3Crect y=\'8\' width=\'8\' height=\'8\' fill=\'%23fff\'/%3E%3C/svg%3E")';

const TOOLS: { id: Tool; label: string; icon: string }[] = [
  { id: 'brush', label: 'Brush', icon: 'B' },
  { id: 'eraser', label: 'Eraser', icon: 'E' },
  { id: 'line', label: 'Line', icon: '/' },
  { id: 'rect', label: 'Rectangle', icon: '[]' },
  { id: 'ellipse', label: 'Ellipse', icon: 'O' },
  { id: 'fill', label: 'Fill', icon: 'F' },
  { id: 'text', label: 'Text', icon: 'T' },
  { id: 'select', label: 'Select', icon: 'S' },
];

export const ImageEditor: React.FC = () => {
  const [canvasW, setCanvasW] = useState(800);
  const [canvasH, setCanvasH] = useState(600);
  const [tool, setTool] = useState<Tool>('brush');
  const [brushSize, setBrushSize] = useState(8);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [brushOpacity, setBrushOpacity] = useState(100);
  const [fillMode, setFillMode] = useState<'fill' | 'stroke'>('stroke');
  const [zoom, setZoom] = useState(1);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [textInput, setTextInput] = useState('Hello');
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showResizeDialog, setShowResizeDialog] = useState(false);
  const [resizeW, setResizeW] = useState(800);
  const [resizeH, setResizeH] = useState(600);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [jpegQuality, setJpegQuality] = useState(92);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [selection, setSelection] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const displayRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const nextLayerId = useRef(1);
  const historyRef = useRef<HistoryState[]>([]);
  const historyIndexRef = useRef(-1);

  // Initialize first layer
  useEffect(() => {
    const c = document.createElement('canvas');
    c.width = canvasW;
    c.height = canvasH;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasW, canvasH);
    const layer: Layer = { id: 0, name: 'Background', canvas: c, visible: true, opacity: 1 };
    setLayers([layer]);
    setActiveLayerId(0);
    nextLayerId.current = 1;

    const preview = document.createElement('canvas');
    preview.width = canvasW;
    preview.height = canvasH;
    previewCanvasRef.current = preview;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveHistory = useCallback(() => {
    const state: HistoryState = {
      layers: layers.map(l => ({
        id: l.id, name: l.name, visible: l.visible, opacity: l.opacity,
        data: l.canvas.getContext('2d')!.getImageData(0, 0, l.canvas.width, l.canvas.height),
      })),
      activeLayerId,
    };
    const h = historyRef.current;
    const idx = historyIndexRef.current;
    historyRef.current = [...h.slice(0, idx + 1), state].slice(-20);
    historyIndexRef.current = historyRef.current.length - 1;
  }, [layers, activeLayerId]);

  const undo = useCallback(() => {
    const idx = historyIndexRef.current;
    if (idx <= 0) return;
    const state = historyRef.current[idx - 1];
    historyIndexRef.current = idx - 1;
    restoreState(state);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const redo = useCallback(() => {
    const idx = historyIndexRef.current;
    if (idx >= historyRef.current.length - 1) return;
    const state = historyRef.current[idx + 1];
    historyIndexRef.current = idx + 1;
    restoreState(state);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const restoreState = (state: HistoryState) => {
    const newLayers: Layer[] = state.layers.map(ls => {
      const c = document.createElement('canvas');
      c.width = ls.data.width;
      c.height = ls.data.height;
      c.getContext('2d')!.putImageData(ls.data, 0, 0);
      return { id: ls.id, name: ls.name, canvas: c, visible: ls.visible, opacity: ls.opacity };
    });
    setLayers(newLayers);
    setActiveLayerId(state.activeLayerId);
    setCanvasW(newLayers[0]?.canvas.width || 800);
    setCanvasH(newLayers[0]?.canvas.height || 600);
  };

  // Composite layers and render
  const composite = useCallback(() => {
    const display = displayRef.current;
    if (!display || layers.length === 0) return;
    display.width = canvasW;
    display.height = canvasH;
    const ctx = display.getContext('2d')!;
    ctx.clearRect(0, 0, canvasW, canvasH);
    for (const layer of layers) {
      if (!layer.visible) continue;
      ctx.globalAlpha = layer.opacity;
      ctx.drawImage(layer.canvas, 0, 0);
    }
    ctx.globalAlpha = 1;

    // Draw preview overlay (for line/rect/ellipse preview)
    if (previewCanvasRef.current) {
      ctx.drawImage(previewCanvasRef.current, 0, 0);
    }

    // Draw selection
    if (selection) {
      ctx.strokeStyle = '#0078d4';
      ctx.lineWidth = 1 / zoom;
      ctx.setLineDash([4 / zoom, 4 / zoom]);
      ctx.strokeRect(selection.x, selection.y, selection.w, selection.h);
      ctx.setLineDash([]);
    }
  }, [layers, canvasW, canvasH, zoom, selection]);

  useEffect(() => { composite(); }, [composite]);

  const getActiveLayer = useCallback((): Layer | undefined => {
    return layers.find(l => l.id === activeLayerId);
  }, [layers, activeLayerId]);

  const getCanvasPos = (e: React.MouseEvent): { x: number; y: number } => {
    const rect = displayRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    };
  };

  const floodFill = (ctx: CanvasRenderingContext2D, sx: number, sy: number, fillColor: string, w: number, h: number) => {
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const tx = Math.floor(sx);
    const ty = Math.floor(sy);
    if (tx < 0 || tx >= w || ty < 0 || ty >= h) return;

    const idx = (ty * w + tx) * 4;
    const targetR = data[idx], targetG = data[idx + 1], targetB = data[idx + 2], targetA = data[idx + 3];

    const hex = fillColor.replace('#', '');
    const fillR = parseInt(hex.slice(0, 2), 16);
    const fillG = parseInt(hex.slice(2, 4), 16);
    const fillB = parseInt(hex.slice(4, 6), 16);

    if (targetR === fillR && targetG === fillG && targetB === fillB && targetA === 255) return;

    const stack: [number, number][] = [[tx, ty]];
    const visited = new Set<number>();

    while (stack.length > 0) {
      const [cx, cy] = stack.pop()!;
      const ci = (cy * w + cx) * 4;
      if (cx < 0 || cx >= w || cy < 0 || cy >= h) continue;
      if (visited.has(cy * w + cx)) continue;
      if (Math.abs(data[ci] - targetR) > 30 || Math.abs(data[ci + 1] - targetG) > 30 || Math.abs(data[ci + 2] - targetB) > 30 || Math.abs(data[ci + 3] - targetA) > 30) continue;

      visited.add(cy * w + cx);
      data[ci] = fillR;
      data[ci + 1] = fillG;
      data[ci + 2] = fillB;
      data[ci + 3] = 255;

      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getCanvasPos(e);
    const layer = getActiveLayer();
    if (!layer) return;

    drawingRef.current = true;
    startPosRef.current = pos;

    if (tool === 'brush' || tool === 'eraser') {
      saveHistory();
      const ctx = layer.canvas.getContext('2d')!;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = brushOpacity / 100;
      }
      ctx.strokeStyle = fgColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(pos.x + 0.1, pos.y + 0.1);
      ctx.stroke();
      composite();
    } else if (tool === 'fill') {
      saveHistory();
      const ctx = layer.canvas.getContext('2d')!;
      floodFill(ctx, pos.x, pos.y, fgColor, canvasW, canvasH);
      composite();
    } else if (tool === 'text') {
      saveHistory();
      const ctx = layer.canvas.getContext('2d')!;
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = brushOpacity / 100;
      ctx.fillStyle = fgColor;
      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.fillText(textInput, pos.x, pos.y);
      ctx.globalAlpha = 1;
      composite();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getCanvasPos(e);
    setCursorPos({ x: Math.floor(pos.x), y: Math.floor(pos.y) });

    if (!drawingRef.current) return;
    const layer = getActiveLayer();
    if (!layer) return;

    if (tool === 'brush' || tool === 'eraser') {
      const ctx = layer.canvas.getContext('2d')!;
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      composite();
    } else if (tool === 'line' || tool === 'rect' || tool === 'ellipse' || tool === 'select') {
      // Draw preview
      const preview = previewCanvasRef.current;
      if (!preview) return;
      const pctx = preview.getContext('2d')!;
      pctx.clearRect(0, 0, canvasW, canvasH);
      pctx.strokeStyle = tool === 'select' ? '#0078d4' : fgColor;
      pctx.fillStyle = fgColor;
      pctx.lineWidth = tool === 'select' ? 1 : brushSize;
      pctx.globalAlpha = tool === 'select' ? 0.5 : brushOpacity / 100;
      pctx.lineCap = 'round';

      const sx = startPosRef.current.x, sy = startPosRef.current.y;
      const dx = pos.x - sx, dy = pos.y - sy;

      if (tool === 'line') {
        pctx.beginPath();
        pctx.moveTo(sx, sy);
        pctx.lineTo(pos.x, pos.y);
        pctx.stroke();
      } else if (tool === 'rect' || tool === 'select') {
        if (tool === 'select') {
          pctx.setLineDash([4, 4]);
          pctx.strokeRect(sx, sy, dx, dy);
          pctx.setLineDash([]);
        } else if (fillMode === 'fill') {
          pctx.fillRect(sx, sy, dx, dy);
        } else {
          pctx.strokeRect(sx, sy, dx, dy);
        }
      } else if (tool === 'ellipse') {
        pctx.beginPath();
        pctx.ellipse(sx + dx / 2, sy + dy / 2, Math.abs(dx / 2), Math.abs(dy / 2), 0, 0, Math.PI * 2);
        if (fillMode === 'fill') pctx.fill(); else pctx.stroke();
      }
      pctx.globalAlpha = 1;
      composite();
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const layer = getActiveLayer();
    if (!layer) return;
    const pos = getCanvasPos(e);

    if (tool === 'brush' || tool === 'eraser') {
      const ctx = layer.canvas.getContext('2d')!;
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    } else if (tool === 'line' || tool === 'rect' || tool === 'ellipse') {
      saveHistory();
      // Commit preview to active layer
      const ctx = layer.canvas.getContext('2d')!;
      ctx.globalAlpha = brushOpacity / 100;
      ctx.strokeStyle = fgColor;
      ctx.fillStyle = fgColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';

      const sx = startPosRef.current.x, sy = startPosRef.current.y;
      const dx = pos.x - sx, dy = pos.y - sy;

      if (tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      } else if (tool === 'rect') {
        if (fillMode === 'fill') ctx.fillRect(sx, sy, dx, dy);
        else ctx.strokeRect(sx, sy, dx, dy);
      } else if (tool === 'ellipse') {
        ctx.beginPath();
        ctx.ellipse(sx + dx / 2, sy + dy / 2, Math.abs(dx / 2), Math.abs(dy / 2), 0, 0, Math.PI * 2);
        if (fillMode === 'fill') ctx.fill(); else ctx.stroke();
      }
      ctx.globalAlpha = 1;
    } else if (tool === 'select') {
      const sx = startPosRef.current.x, sy = startPosRef.current.y;
      const w = pos.x - sx, h = pos.y - sy;
      if (Math.abs(w) > 2 && Math.abs(h) > 2) {
        setSelection({ x: Math.min(sx, pos.x), y: Math.min(sy, pos.y), w: Math.abs(w), h: Math.abs(h) });
      } else {
        setSelection(null);
      }
    }

    // Clear preview
    const preview = previewCanvasRef.current;
    if (preview) preview.getContext('2d')!.clearRect(0, 0, canvasW, canvasH);
    composite();
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.1, Math.min(10, z + (e.deltaY > 0 ? -0.1 : 0.1))));
  };

  // Layer operations
  const addLayer = () => {
    const c = document.createElement('canvas');
    c.width = canvasW;
    c.height = canvasH;
    const id = nextLayerId.current++;
    const newLayer: Layer = { id, name: `Layer ${id}`, canvas: c, visible: true, opacity: 1 };
    setLayers(prev => [...prev, newLayer]);
    setActiveLayerId(id);
  };

  const deleteLayer = (id: number) => {
    if (layers.length <= 1) return;
    setLayers(prev => {
      const filtered = prev.filter(l => l.id !== id);
      if (activeLayerId === id) setActiveLayerId(filtered[filtered.length - 1].id);
      return filtered;
    });
  };

  const toggleLayerVisibility = (id: number) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };

  const setLayerOpacity = (id: number, opacity: number) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, opacity } : l));
  };

  const moveLayerUp = (id: number) => {
    setLayers(prev => {
      const idx = prev.findIndex(l => l.id === id);
      if (idx >= prev.length - 1) return prev;
      const newArr = [...prev];
      [newArr[idx], newArr[idx + 1]] = [newArr[idx + 1], newArr[idx]];
      return newArr;
    });
  };

  const moveLayerDown = (id: number) => {
    setLayers(prev => {
      const idx = prev.findIndex(l => l.id === id);
      if (idx <= 0) return prev;
      const newArr = [...prev];
      [newArr[idx], newArr[idx - 1]] = [newArr[idx - 1], newArr[idx]];
      return newArr;
    });
  };

  // File operations
  const openImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const img = new Image();
      img.onload = () => {
        setCanvasW(img.width);
        setCanvasH(img.height);
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        const layer: Layer = { id: 0, name: 'Imported', canvas: c, visible: true, opacity: 1 };
        setLayers([layer]);
        setActiveLayerId(0);
        nextLayerId.current = 1;
        if (previewCanvasRef.current) {
          previewCanvasRef.current.width = img.width;
          previewCanvasRef.current.height = img.height;
        }
      };
      img.src = URL.createObjectURL(file);
    };
    input.click();
  };

  const exportImage = () => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvasW;
    tempCanvas.height = canvasH;
    const ctx = tempCanvas.getContext('2d')!;
    for (const layer of layers) {
      if (!layer.visible) continue;
      ctx.globalAlpha = layer.opacity;
      ctx.drawImage(layer.canvas, 0, 0);
    }
    ctx.globalAlpha = 1;

    const mimeType = exportFormat === 'png' ? 'image/png' : exportFormat === 'jpeg' ? 'image/jpeg' : 'image/webp';
    const quality = exportFormat === 'jpeg' ? jpegQuality / 100 : undefined;

    tempCanvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `image.${exportFormat}`;
      a.click();
      URL.revokeObjectURL(url);
    }, mimeType, quality);
    setShowExportDialog(false);
  };

  const newCanvas = () => {
    const c = document.createElement('canvas');
    c.width = canvasW;
    c.height = canvasH;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasW, canvasH);
    setLayers([{ id: 0, name: 'Background', canvas: c, visible: true, opacity: 1 }]);
    setActiveLayerId(0);
    nextLayerId.current = 1;
    setSelection(null);
    historyRef.current = [];
    historyIndexRef.current = -1;
  };

  // Transform operations
  const rotateCanvas = (deg: number) => {
    saveHistory();
    setLayers(prev => prev.map(l => {
      const src = l.canvas;
      const c = document.createElement('canvas');
      if (deg === 90 || deg === 270) { c.width = src.height; c.height = src.width; }
      else { c.width = src.width; c.height = src.height; }
      const ctx = c.getContext('2d')!;
      ctx.translate(c.width / 2, c.height / 2);
      ctx.rotate((deg * Math.PI) / 180);
      ctx.drawImage(src, -src.width / 2, -src.height / 2);
      return { ...l, canvas: c };
    }));
    if (deg === 90 || deg === 270) { setCanvasW(canvasH); setCanvasH(canvasW); }
  };

  const flipCanvas = (dir: 'h' | 'v') => {
    saveHistory();
    setLayers(prev => prev.map(l => {
      const c = document.createElement('canvas');
      c.width = l.canvas.width; c.height = l.canvas.height;
      const ctx = c.getContext('2d')!;
      if (dir === 'h') { ctx.translate(c.width, 0); ctx.scale(-1, 1); }
      else { ctx.translate(0, c.height); ctx.scale(1, -1); }
      ctx.drawImage(l.canvas, 0, 0);
      return { ...l, canvas: c };
    }));
  };

  const resizeCanvas = () => {
    saveHistory();
    setLayers(prev => prev.map(l => {
      const c = document.createElement('canvas');
      c.width = resizeW; c.height = resizeH;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(l.canvas, 0, 0, resizeW, resizeH);
      return { ...l, canvas: c };
    }));
    setCanvasW(resizeW);
    setCanvasH(resizeH);
    if (previewCanvasRef.current) {
      previewCanvasRef.current.width = resizeW;
      previewCanvasRef.current.height = resizeH;
    }
    setShowResizeDialog(false);
  };

  const cropToSelection = () => {
    if (!selection) return;
    saveHistory();
    const { x, y, w, h } = selection;
    setLayers(prev => prev.map(l => {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(l.canvas, x, y, w, h, 0, 0, w, h);
      return { ...l, canvas: c };
    }));
    setCanvasW(w); setCanvasH(h);
    if (previewCanvasRef.current) { previewCanvasRef.current.width = w; previewCanvasRef.current.height = h; }
    setSelection(null);
  };

  // Filters
  const applyFilter = (filter: FilterType, value?: number) => {
    const layer = getActiveLayer();
    if (!layer) return;
    saveHistory();
    const ctx = layer.canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvasW, canvasH);
    const d = imageData.data;
    const v = value ?? 0;

    switch (filter) {
      case 'grayscale':
        for (let i = 0; i < d.length; i += 4) {
          const avg = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
          d[i] = d[i + 1] = d[i + 2] = avg;
        }
        break;
      case 'sepia':
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i + 1], b = d[i + 2];
          d[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
          d[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
          d[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
        }
        break;
      case 'invert':
        for (let i = 0; i < d.length; i += 4) {
          d[i] = 255 - d[i]; d[i + 1] = 255 - d[i + 1]; d[i + 2] = 255 - d[i + 2];
        }
        break;
      case 'brightness':
        for (let i = 0; i < d.length; i += 4) {
          d[i] = Math.min(255, Math.max(0, d[i] + v));
          d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + v));
          d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + v));
        }
        break;
      case 'contrast': {
        const f = (259 * (v + 255)) / (255 * (259 - v));
        for (let i = 0; i < d.length; i += 4) {
          d[i] = Math.min(255, Math.max(0, f * (d[i] - 128) + 128));
          d[i + 1] = Math.min(255, Math.max(0, f * (d[i + 1] - 128) + 128));
          d[i + 2] = Math.min(255, Math.max(0, f * (d[i + 2] - 128) + 128));
        }
        break;
      }
      case 'blur': {
        const w = canvasW, h = canvasH;
        const copy = new Uint8ClampedArray(d);
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            for (let c = 0; c < 3; c++) {
              let sum = 0;
              for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                  sum += copy[((y + ky) * w + (x + kx)) * 4 + c];
                }
              }
              d[(y * w + x) * 4 + c] = sum / 9;
            }
          }
        }
        break;
      }
      case 'sharpen': {
        const w = canvasW, h = canvasH;
        const copy = new Uint8ClampedArray(d);
        const k = [0, -1, 0, -1, 5, -1, 0, -1, 0];
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            for (let c = 0; c < 3; c++) {
              let sum = 0, ki = 0;
              for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                  sum += copy[((y + ky) * w + (x + kx)) * 4 + c] * k[ki++];
                }
              }
              d[(y * w + x) * 4 + c] = Math.min(255, Math.max(0, sum));
            }
          }
        }
        break;
      }
      case 'posterize': {
        const levels = Math.max(2, Math.min(16, v || 4));
        const step = 255 / (levels - 1);
        for (let i = 0; i < d.length; i += 4) {
          d[i] = Math.round(d[i] / step) * step;
          d[i + 1] = Math.round(d[i + 1] / step) * step;
          d[i + 2] = Math.round(d[i + 2] / step) * step;
        }
        break;
      }
      case 'pixelate': {
        const size = Math.max(2, v || 8);
        const w = canvasW, h = canvasH;
        for (let y = 0; y < h; y += size) {
          for (let x = 0; x < w; x += size) {
            const idx = (y * w + x) * 4;
            const r = d[idx], g = d[idx + 1], b = d[idx + 2];
            for (let dy = 0; dy < size && y + dy < h; dy++) {
              for (let dx = 0; dx < size && x + dx < w; dx++) {
                const pi = ((y + dy) * w + (x + dx)) * 4;
                d[pi] = r; d[pi + 1] = g; d[pi + 2] = b;
              }
            }
          }
        }
        break;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    composite();
  };

  const btn = 'px-2 py-1 text-xs rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors';
  const menuBtn = 'px-3 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors';

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-950 dark:to-blue-950 overflow-hidden select-none">
      {/* Top Menu Bar */}
      <div className="flex items-center gap-1 px-2 py-1 bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700">
        <div className="relative group">
          <button className={menuBtn}>File</button>
          <div className="hidden group-hover:block absolute top-full left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50 min-w-[140px]">
            <button onClick={newCanvas} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">New</button>
            <button onClick={openImage} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Open Image...</button>
            <button onClick={() => setShowExportDialog(true)} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Export...</button>
          </div>
        </div>
        <div className="relative group">
          <button className={menuBtn}>Edit</button>
          <div className="hidden group-hover:block absolute top-full left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50 min-w-[140px]">
            <button onClick={undo} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Undo (Ctrl+Z)</button>
            <button onClick={redo} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Redo (Ctrl+Y)</button>
            {selection && <button onClick={cropToSelection} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Crop to Selection</button>}
            <button onClick={() => setSelection(null)} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Deselect</button>
          </div>
        </div>
        <div className="relative group">
          <button className={menuBtn}>Image</button>
          <div className="hidden group-hover:block absolute top-full left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50 min-w-[160px]">
            <button onClick={() => { setResizeW(canvasW); setResizeH(canvasH); setShowResizeDialog(true); }} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Resize Canvas...</button>
            <button onClick={() => rotateCanvas(90)} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Rotate 90 CW</button>
            <button onClick={() => rotateCanvas(270)} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Rotate 90 CCW</button>
            <button onClick={() => rotateCanvas(180)} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Rotate 180</button>
            <button onClick={() => flipCanvas('h')} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Flip Horizontal</button>
            <button onClick={() => flipCanvas('v')} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Flip Vertical</button>
          </div>
        </div>
        <div className="relative group">
          <button className={menuBtn}>Filter</button>
          <div className="hidden group-hover:block absolute top-full left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50 min-w-[160px]">
            <button onClick={() => applyFilter('grayscale')} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Grayscale</button>
            <button onClick={() => applyFilter('sepia')} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Sepia</button>
            <button onClick={() => applyFilter('invert')} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Invert</button>
            <button onClick={() => applyFilter('blur')} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Blur</button>
            <button onClick={() => applyFilter('sharpen')} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Sharpen</button>
            <button onClick={() => applyFilter('posterize', 4)} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Posterize</button>
            <button onClick={() => applyFilter('pixelate', 8)} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Pixelate</button>
            <button onClick={() => setShowFilterPanel(!showFilterPanel)} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400">Adjustments...</button>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setZoom(z => Math.max(0.1, z - 0.25))} className={btn}>-</button>
          <span className="text-xs text-gray-500 w-14 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(10, z + 0.25))} className={btn}>+</button>
          <button onClick={() => setZoom(1)} className={btn}>1:1</button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Tool Panel */}
        <div className="w-10 bg-white/60 dark:bg-gray-900/60 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-1 gap-0.5">
          {TOOLS.map(t => (
            <button key={t.id} onClick={() => setTool(t.id)} title={t.label}
              className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded transition-colors ${tool === t.id ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
              {t.icon}
            </button>
          ))}
          <div className="mt-2 flex flex-col items-center gap-1">
            <div className="relative w-7 h-7">
              <input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)}
                className="absolute inset-0 w-full h-full cursor-pointer opacity-0" title="Foreground" />
              <div className="w-5 h-5 rounded border-2 border-white dark:border-gray-600 shadow absolute top-0 left-0" style={{ background: fgColor }} />
              <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                className="absolute bottom-0 right-0 w-4 h-4 cursor-pointer opacity-0" title="Background" />
              <div className="w-4 h-4 rounded border border-white dark:border-gray-600 shadow absolute bottom-0 right-0" style={{ background: bgColor }} />
            </div>
          </div>
        </div>

        {/* Center Canvas Area */}
        <div ref={containerRef} className="flex-1 overflow-auto relative" style={{ background: CHECKERBOARD }}>
          <div className="inline-block p-8" style={{ minWidth: '100%', minHeight: '100%' }}>
            <canvas
              ref={displayRef}
              width={canvasW}
              height={canvasH}
              style={{ width: canvasW * zoom, height: canvasH * zoom, imageRendering: zoom > 2 ? 'pixelated' : 'auto', cursor: tool === 'text' ? 'text' : 'crosshair' }}
              className="shadow-lg"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => { drawingRef.current = false; }}
              onWheel={handleWheel}
            />
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-56 bg-white/80 dark:bg-gray-900/80 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-auto">
          {/* Tool Properties */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Tool: {tool}</div>
            {(tool === 'brush' || tool === 'eraser') && (
              <div className="space-y-1">
                <label className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>Size</span>
                  <input type="range" min={1} max={100} value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="w-24 h-3" />
                  <span className="w-6 text-right font-mono">{brushSize}</span>
                </label>
                <label className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>Opacity</span>
                  <input type="range" min={1} max={100} value={brushOpacity} onChange={e => setBrushOpacity(Number(e.target.value))} className="w-24 h-3" />
                  <span className="w-6 text-right font-mono">{brushOpacity}%</span>
                </label>
              </div>
            )}
            {(tool === 'rect' || tool === 'ellipse') && (
              <div className="flex gap-1 mt-1">
                <button onClick={() => setFillMode('stroke')} className={`px-2 py-0.5 text-[10px] rounded ${fillMode === 'stroke' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>Stroke</button>
                <button onClick={() => setFillMode('fill')} className={`px-2 py-0.5 text-[10px] rounded ${fillMode === 'fill' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>Fill</button>
              </div>
            )}
            {tool === 'text' && (
              <div className="space-y-1">
                <input value={textInput} onChange={e => setTextInput(e.target.value)}
                  className="w-full px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200" placeholder="Text..." />
                <div className="flex gap-1">
                  <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} className="flex-1 text-[10px] px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                    {['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Impact'].map(f => <option key={f}>{f}</option>)}
                  </select>
                  <input type="number" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} min={8} max={200}
                    className="w-12 text-[10px] px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200" />
                </div>
              </div>
            )}
          </div>

          {/* Filter Adjustments */}
          {showFilterPanel && (
            <div className="p-2 border-b border-gray-200 dark:border-gray-700 space-y-2">
              <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Adjustments</div>
              <div className="space-y-1">
                <button onClick={() => applyFilter('brightness', 20)} className="w-full text-left px-2 py-0.5 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">Brightness +20</button>
                <button onClick={() => applyFilter('brightness', -20)} className="w-full text-left px-2 py-0.5 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">Brightness -20</button>
                <button onClick={() => applyFilter('contrast', 50)} className="w-full text-left px-2 py-0.5 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">Contrast +</button>
                <button onClick={() => applyFilter('contrast', -50)} className="w-full text-left px-2 py-0.5 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">Contrast -</button>
              </div>
            </div>
          )}

          {/* Layers Panel */}
          <div className="flex-1 p-2 overflow-auto">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Layers</div>
              <button onClick={addLayer} className="px-1.5 py-0.5 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-700">+ Add</button>
            </div>
            <div className="space-y-1">
              {[...layers].reverse().map(l => (
                <div key={l.id} onClick={() => setActiveLayerId(l.id)}
                  className={`p-1.5 rounded text-xs cursor-pointer transition-colors ${activeLayerId === l.id ? 'bg-blue-100 dark:bg-blue-900/40 ring-1 ring-blue-400' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300 truncate flex-1">{l.name}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={e => { e.stopPropagation(); toggleLayerVisibility(l.id); }} className="text-[10px] px-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600">{l.visible ? 'V' : 'H'}</button>
                      <button onClick={e => { e.stopPropagation(); moveLayerUp(l.id); }} className="text-[10px] px-0.5 rounded hover:bg-gray-300 dark:hover:bg-gray-600">^</button>
                      <button onClick={e => { e.stopPropagation(); moveLayerDown(l.id); }} className="text-[10px] px-0.5 rounded hover:bg-gray-300 dark:hover:bg-gray-600">v</button>
                      {layers.length > 1 && <button onClick={e => { e.stopPropagation(); deleteLayer(l.id); }} className="text-[10px] px-1 text-red-500 rounded hover:bg-red-100 dark:hover:bg-red-900/40">x</button>}
                    </div>
                  </div>
                  <input type="range" min={0} max={1} step={0.05} value={l.opacity}
                    onChange={e => { e.stopPropagation(); setLayerOpacity(l.id, Number(e.target.value)); }}
                    className="w-full h-2 mt-1" onClick={e => e.stopPropagation()} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-0.5 bg-white/80 dark:bg-gray-900/80 border-t border-gray-200 dark:border-gray-700 text-[10px] text-gray-500">
        <span>{canvasW} x {canvasH}px</span>
        <span>Cursor: {cursorPos.x}, {cursorPos.y}</span>
        <span>Tool: {tool}</span>
        <span>Layers: {layers.length}</span>
        <span>Zoom: {Math.round(zoom * 100)}%</span>
      </div>

      {/* Resize Dialog */}
      {showResizeDialog && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-xl min-w-[280px]">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Resize Canvas</div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                Width:
                <input type="number" value={resizeW} onChange={e => setResizeW(Number(e.target.value))} min={1} max={4096}
                  className="flex-1 px-2 py-1 bg-gray-100 dark:bg-gray-900 rounded border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200" />
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                Height:
                <input type="number" value={resizeH} onChange={e => setResizeH(Number(e.target.value))} min={1} max={4096}
                  className="flex-1 px-2 py-1 bg-gray-100 dark:bg-gray-900 rounded border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200" />
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setShowResizeDialog(false)} className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300">Cancel</button>
              <button onClick={resizeCanvas} className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* Export Dialog */}
      {showExportDialog && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-xl min-w-[280px]">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Export Image</div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                Format:
                <select value={exportFormat} onChange={e => setExportFormat(e.target.value as typeof exportFormat)}
                  className="flex-1 px-2 py-1 bg-gray-100 dark:bg-gray-900 rounded border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 text-xs">
                  <option value="png">PNG</option>
                  <option value="jpeg">JPEG</option>
                  <option value="webp">WebP</option>
                </select>
              </label>
              {exportFormat === 'jpeg' && (
                <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  Quality:
                  <input type="range" min={10} max={100} value={jpegQuality} onChange={e => setJpegQuality(Number(e.target.value))} className="flex-1 h-3" />
                  <span className="w-8 text-right font-mono">{jpegQuality}%</span>
                </label>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setShowExportDialog(false)} className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300">Cancel</button>
              <button onClick={exportImage} className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">Export</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
