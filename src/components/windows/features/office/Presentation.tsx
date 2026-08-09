import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Presentation as PresentationIcon, Plus, Trash2, Play, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Download, Upload, Copy, Image as ImageIcon, Type, Layout, Palette, AlignLeft, AlignCenter, AlignRight, List, Sparkles, Maximize2, Minimize2, Shapes, Clock, Eye, EyeOff, X, GripVertical, RotateCcw, RotateCw, Move, Square, Circle, Triangle, TypeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ShapeItem {
  type: 'rectangle' | 'circle' | 'triangle' | 'text';
  x: number; // percent
  y: number; // percent
  width: number; // percent
  height: number; // percent
  color: string;
  borderColor: string;
  borderWidth: number;
  opacity: number;
  rotation: number;
  text?: string;
  fontSize?: number;
  textColor?: string;
}

interface Slide {
  id: string;
  title: string;
  content: string;
  background: string;
  layout: 'title' | 'content' | 'two-column' | 'image' | 'blank';
  titleSize?: number;
  contentSize?: number;
  titleAlign?: 'left' | 'center' | 'right';
  contentAlign?: 'left' | 'center' | 'right';
  bulletPoints?: string[];
  imageUrl?: string;
  notes?: string;
  transition?: 'none' | 'fade' | 'slide' | 'zoom';
  shapes?: ShapeItem[];
  fontFamily?: string;
  // Movable text box positions (percent)
  titleX?: number;
  titleY?: number;
  titleW?: number;
  titleH?: number;
  contentX?: number;
  contentY?: number;
  contentW?: number;
  contentH?: number;
}

type TextBoxId = 'title' | 'content';

const FONT_FAMILIES = [
  { label: 'Sans Serif', value: 'ui-sans-serif, system-ui, sans-serif' },
  { label: 'Serif', value: 'ui-serif, Georgia, serif' },
  { label: 'Mono', value: 'ui-monospace, monospace' },
  { label: 'Cursive', value: 'cursive' },
];

const PRESET_THEMES = [
  { name: 'Ocean', colors: ['#0EA5E9', '#0284C7', '#0369A1'] },
  { name: 'Forest', colors: ['#10B981', '#059669', '#047857'] },
  { name: 'Sunset', colors: ['#F97316', '#EA580C', '#C2410C'] },
  { name: 'Purple', colors: ['#8B5CF6', '#7C3AED', '#6D28D9'] },
  { name: 'Pink', colors: ['#EC4899', '#DB2777', '#BE185D'] },
  { name: 'Dark', colors: ['#1E293B', '#0F172A', '#020617'] },
  { name: 'Midnight', colors: ['#312e81', '#1e1b4b', '#0c0a3e'] },
  { name: 'Rose Gold', colors: ['#be123c', '#9f1239', '#881337'] },
  { name: 'Teal', colors: ['#0d9488', '#0f766e', '#115e59'] },
];

const GRADIENT_THEMES = [
  { name: 'Aurora', colors: ['linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 'linear-gradient(135deg, #764ba2 0%, #f093fb 100%)', 'linear-gradient(135deg, #f093fb 0%, #667eea 100%)'] },
  { name: 'Oceanic', colors: ['linear-gradient(135deg, #0093E9 0%, #80D0C7 100%)', 'linear-gradient(135deg, #80D0C7 0%, #0093E9 100%)', 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)'] },
  { name: 'Ember', colors: ['linear-gradient(135deg, #f12711 0%, #f5af19 100%)', 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)', 'linear-gradient(135deg, #e65c00 0%, #F9D423 100%)'] },
  { name: 'Neon', colors: ['linear-gradient(135deg, #00f260 0%, #0575e6 100%)', 'linear-gradient(135deg, #0575e6 0%, #00f260 100%)', 'linear-gradient(135deg, #a8ff78 0%, #78ffd6 100%)'] },
  { name: 'Cosmic', colors: ['linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', 'linear-gradient(135deg, #24243e 0%, #302b63 50%, #0f0c29 100%)', 'linear-gradient(135deg, #141e30 0%, #243b55 100%)'] },
  { name: 'Candy', colors: ['linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)', 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'] },
];

const SHAPE_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff', '#000000', '#64748b'];

const MAX_HISTORY = 30;
const SLIDE_WIDTH = 960;
const SLIDE_HEIGHT = 540;

// ---- helper to render a single shape's CSS ----
function shapeStyle(shape: ShapeItem, scale = 1): React.CSSProperties {
  const base: React.CSSProperties = {
    position: 'absolute',
    left: `${shape.x}%`,
    top: `${shape.y}%`,
    width: `${shape.width * scale}%`,
    height: `${shape.height * scale}%`,
    opacity: shape.opacity,
    transform: shape.rotation ? `rotate(${shape.rotation}deg)` : undefined,
    transition: 'box-shadow 0.15s',
  };

  if (shape.type === 'text') {
    return {
      ...base,
      backgroundColor: shape.color === 'transparent' ? undefined : shape.color,
      border: shape.borderWidth > 0 ? `${shape.borderWidth}px solid ${shape.borderColor}` : 'none',
      borderRadius: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: shape.textColor || '#ffffff',
      fontSize: `${(shape.fontSize || 16) * scale}px`,
      fontWeight: 600,
      textAlign: 'center' as const,
      overflow: 'hidden',
      wordBreak: 'break-word' as const,
      padding: '4px',
    };
  }

  if (shape.type === 'circle') {
    return {
      ...base,
      backgroundColor: shape.color,
      borderRadius: '50%',
      border: shape.borderWidth > 0 ? `${shape.borderWidth}px solid ${shape.borderColor}` : 'none',
    };
  }

  if (shape.type === 'triangle') {
    // Use a wrapper with clip-path; border via drop-shadow
    return {
      ...base,
      backgroundColor: shape.color,
      clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
      border: 'none',
      filter: shape.borderWidth > 0 ? `drop-shadow(0 0 ${shape.borderWidth}px ${shape.borderColor})` : undefined,
    };
  }

  // rectangle
  return {
    ...base,
    backgroundColor: shape.color,
    borderRadius: '4px',
    border: shape.borderWidth > 0 ? `${shape.borderWidth}px solid ${shape.borderColor}` : 'none',
  };
}

function defaultShape(type: ShapeItem['type']): ShapeItem {
  return {
    type,
    x: 30 + Math.random() * 20,
    y: 30 + Math.random() * 20,
    width: type === 'text' ? 20 : 8,
    height: type === 'text' ? 8 : 12,
    color: type === 'text' ? 'transparent' : SHAPE_COLORS[Math.floor(Math.random() * SHAPE_COLORS.length)],
    borderColor: '#ffffff',
    borderWidth: type === 'text' ? 0 : 0,
    opacity: 1,
    rotation: 0,
    text: type === 'text' ? 'Text' : undefined,
    fontSize: 16,
    textColor: '#ffffff',
  };
}

const STORAGE_KEY = 'secure-nexus-presentation';

const DEFAULT_SLIDES: Slide[] = [
  { id: '1', title: 'Welcome', content: 'My Presentation', background: '#3b82f6', layout: 'title', titleSize: 60, contentSize: 24, titleAlign: 'center', contentAlign: 'center', notes: '', transition: 'fade', fontFamily: FONT_FAMILIES[0].value },
  { id: '2', title: 'Agenda', content: '', background: '#8b5cf6', layout: 'content', bulletPoints: ['Introduction', 'Main Topics', 'Conclusion'], titleSize: 48, contentSize: 20, titleAlign: 'left', contentAlign: 'left', notes: '', transition: 'slide', fontFamily: FONT_FAMILIES[0].value },
  { id: '3', title: 'Thank You', content: 'Questions?', background: '#10b981', layout: 'title', titleSize: 60, contentSize: 32, titleAlign: 'center', contentAlign: 'center', notes: '', transition: 'zoom', fontFamily: FONT_FAMILIES[0].value },
];

export const Presentation: React.FC = () => {
  const [slides, setSlides] = useState<Slide[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id && typeof parsed[0].title === 'string') {
          return parsed;
        }
      }
    } catch { /* corrupted save — start fresh */ }
    return DEFAULT_SLIDES;
  });
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);
  const [activeTab, setActiveTab] = useState('edit');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [presentationTimer, setPresentationTimer] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [animationKey, setAnimationKey] = useState(0);
  const [slideScale, setSlideScale] = useState(1);
  const [showEditorNotes, setShowEditorNotes] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  // shape interaction state
  const [selectedShape, setSelectedShape] = useState<number | null>(null);
  const [isDraggingShape, setIsDraggingShape] = useState(false);
  const [isResizingShape, setIsResizingShape] = useState(false);
  const dragStartRef = useRef<{ mx: number; my: number; sx: number; sy: number }>({ mx: 0, my: 0, sx: 0, sy: 0 });
  const resizeStartRef = useRef<{ mx: number; my: number; sw: number; sh: number; sx: number; sy: number }>({ mx: 0, my: 0, sw: 0, sh: 0, sx: 0, sy: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // text box dragging state
  const [draggingTextBox, setDraggingTextBox] = useState<TextBoxId | null>(null);
  const [resizingTextBox, setResizingTextBox] = useState<TextBoxId | null>(null);
  const textBoxDragStart = useRef<{ mx: number; my: number; ox: number; oy: number }>({ mx: 0, my: 0, ox: 0, oy: 0 });
  const textBoxResizeStart = useRef<{ mx: number; my: number; ow: number; oh: number }>({ mx: 0, my: 0, ow: 0, oh: 0 });

  // Undo / Redo
  const [history, setHistory] = useState<Slide[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoRef = useRef(false);
  // While a drag/resize is in progress, don't record every pointermove in
  // history — one entry is pushed on pointer-up instead
  const suppressHistoryRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const presentationRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Refs for avoiding stale closures in keyboard handler
  const slidesRef = useRef(slides);
  slidesRef.current = slides;
  const currentSlideRef = useRef(currentSlide);
  currentSlideRef.current = currentSlide;
  const selectedShapeRef = useRef(selectedShape);
  selectedShapeRef.current = selectedShape;

  // Clipboard for copy-paste shapes
  const [copiedShape, setCopiedShape] = useState<ShapeItem | null>(null);

  // Snap guides visible during drag
  const [snapGuides, setSnapGuides] = useState<{ x?: number; y?: number }>({});

  // Which corner is being resized
  const [resizeCorner, setResizeCorner] = useState<'tl' | 'tr' | 'bl' | 'br' | null>(null);

  // Debounced autosave so decks survive closing the window
  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(slides)); } catch { /* quota exceeded */ }
    }, 500);
    return () => clearTimeout(t);
  }, [slides]);

  const pushHistory = useCallback((snap: Slide[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(snap);
      if (newHistory.length > MAX_HISTORY) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
  }, [historyIndex]);

  // Push to undo history when slides change (but not from undo/redo or mid-drag)
  useEffect(() => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }
    if (suppressHistoryRef.current) return;
    pushHistory(slides);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoRef.current = true;
      setHistoryIndex(prev => prev - 1);
      setSlides(history[historyIndex - 1]);
      setSelectedShape(null);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoRef.current = true;
      setHistoryIndex(prev => prev + 1);
      setSlides(history[historyIndex + 1]);
      setSelectedShape(null);
    }
  }, [history, historyIndex]);

  // Keyboard shortcuts — only when focus is inside this app, so shortcuts
  // never fire while another window on the desktop is being used
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const container = isPresenting ? presentationRef.current : rootRef.current;
      if (!container?.contains(document.activeElement) && document.activeElement !== container) return;
      if (isPresenting) {
        switch (e.key) {
          case 'ArrowRight': case 'ArrowDown': case ' ':
            e.preventDefault();
            setCurrentSlide(prev => { const next = Math.min(slides.length - 1, prev + 1); if (next !== prev) setAnimationKey(k => k + 1); return next; });
            break;
          case 'ArrowLeft': case 'ArrowUp':
            e.preventDefault();
            setCurrentSlide(prev => { const next = Math.max(0, prev - 1); if (next !== prev) setAnimationKey(k => k + 1); return next; });
            break;
          case 'Escape': e.preventDefault(); setIsPresenting(false); break;
          case 'Home': e.preventDefault(); setCurrentSlide(0); setAnimationKey(k => k + 1); break;
          case 'End': e.preventDefault(); setCurrentSlide(slides.length - 1); setAnimationKey(k => k + 1); break;
        }
      } else {
        const target = e.target as HTMLElement;
        const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';

        // Arrow keys nudge the selected shape (Shift for bigger steps)
        if (!isInput && selectedShapeRef.current !== null && e.key.startsWith('Arrow')) {
          e.preventDefault();
          const step = e.shiftKey ? 5 : 1;
          const idx = selectedShapeRef.current;
          const curSlides = slidesRef.current;
          const curSlide = currentSlideRef.current;
          const shape = curSlides[curSlide]?.shapes?.[idx];
          if (shape) {
            const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
            const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
            const newSlides = [...curSlides];
            const shapes = [...(newSlides[curSlide].shapes || [])];
            shapes[idx] = {
              ...shape,
              x: Math.max(0, Math.min(100 - shape.width, shape.x + dx)),
              y: Math.max(0, Math.min(100 - shape.height, shape.y + dy)),
            };
            newSlides[curSlide] = { ...newSlides[curSlide], shapes };
            setSlides(newSlides);
          }
          return;
        }

        // PageUp/PageDown flip through slides in the editor
        if (!isInput && (e.key === 'PageDown' || e.key === 'PageUp')) {
          e.preventDefault();
          setCurrentSlide(prev => e.key === 'PageDown'
            ? Math.min(slidesRef.current.length - 1, prev + 1)
            : Math.max(0, prev - 1));
          return;
        }

        // Escape deselects the shape
        if (e.key === 'Escape' && selectedShapeRef.current !== null) {
          setSelectedShape(null);
          return;
        }

        // Delete selected shape (using refs to avoid stale closures)
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedShapeRef.current !== null && !isInput) {
          e.preventDefault();
          const idx = selectedShapeRef.current;
          const curSlides = slidesRef.current;
          const curSlide = currentSlideRef.current;
          const slide = curSlides[curSlide];
          const newShapes = (slide.shapes || []).filter((_, i) => i !== idx);
          const newSlides = [...curSlides];
          newSlides[curSlide] = { ...newSlides[curSlide], shapes: newShapes };
          setSlides(newSlides);
          setSelectedShape(null);
        }

        // Ctrl+D: duplicate selected shape
        if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedShapeRef.current !== null && !isInput) {
          e.preventDefault();
          const idx = selectedShapeRef.current;
          const curSlides = slidesRef.current;
          const curSlide = currentSlideRef.current;
          const slide = curSlides[curSlide];
          const shapes = [...(slide.shapes || [])];
          const dup = { ...shapes[idx], x: shapes[idx].x + 3, y: shapes[idx].y + 3 };
          shapes.push(dup);
          const newSlides = [...curSlides];
          newSlides[curSlide] = { ...newSlides[curSlide], shapes };
          setSlides(newSlides);
          setSelectedShape(shapes.length - 1);
        }

        // Ctrl+C: copy selected shape
        if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedShapeRef.current !== null && !isInput) {
          const idx = selectedShapeRef.current;
          const curSlides = slidesRef.current;
          const curSlide = currentSlideRef.current;
          const shape = curSlides[curSlide]?.shapes?.[idx];
          if (shape) setCopiedShape({ ...shape });
        }

        // Ctrl+V: paste copied shape
        if ((e.ctrlKey || e.metaKey) && e.key === 'v' && copiedShape && !isInput) {
          e.preventDefault();
          const curSlides = slidesRef.current;
          const curSlide = currentSlideRef.current;
          const slide = curSlides[curSlide];
          const shapes = [...(slide.shapes || [])];
          const pasted = { ...copiedShape, x: copiedShape.x + 5, y: copiedShape.y + 5 };
          shapes.push(pasted);
          const newSlides = [...curSlides];
          newSlides[curSlide] = { ...newSlides[curSlide], shapes };
          setSlides(newSlides);
          setSelectedShape(shapes.length - 1);
        }

        // Undo / Redo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
          if (e.shiftKey) { e.preventDefault(); redo(); } else { e.preventDefault(); undo(); }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPresenting, slides.length, undo, redo, copiedShape]);

  // Presentation timer
  useEffect(() => {
    if (isPresenting) {
      setPresentationTimer(0);
      timerRef.current = setInterval(() => setPresentationTimer(prev => prev + 1), 1000);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPresenting]);

  // Auto-hide controls in presentation mode
  const resetControlsTimeout = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => { if (isPresenting) setControlsVisible(false); }, 2000);
  }, [isPresenting]);

  useEffect(() => {
    if (isPresenting) {
      resetControlsTimeout();
      const h = () => resetControlsTimeout();
      window.addEventListener('mousemove', h);
      return () => { window.removeEventListener('mousemove', h); if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); };
    } else { setControlsVisible(true); }
  }, [isPresenting, resetControlsTimeout]);

  // ---- Shape drag / resize via pointer events on window ----
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();

      if (isDraggingShape && selectedShape !== null) {
        const dx = ((e.clientX - dragStartRef.current.mx) / rect.width) * 100;
        const dy = ((e.clientY - dragStartRef.current.my) / rect.height) * 100;
        const shapeW = slides[currentSlide]?.shapes?.[selectedShape]?.width || 8;
        const shapeH = slides[currentSlide]?.shapes?.[selectedShape]?.height || 12;
        let newX = dragStartRef.current.sx + dx;
        let newY = dragStartRef.current.sy + dy;
        newX = Math.max(0, Math.min(100 - shapeW, newX));
        newY = Math.max(0, Math.min(100 - shapeH, newY));

        // Snap guides
        const centerX = newX + shapeW / 2;
        const centerY = newY + shapeH / 2;
        const snapThreshold = 1.5;
        const guides: { x?: number; y?: number } = {};
        if (Math.abs(centerX - 50) < snapThreshold) { newX = 50 - shapeW / 2; guides.x = 50; }
        if (Math.abs(centerY - 50) < snapThreshold) { newY = 50 - shapeH / 2; guides.y = 50; }
        setSnapGuides(guides);

        const newSlides = [...slides];
        const s = { ...newSlides[currentSlide] };
        const shapes = [...(s.shapes || [])];
        shapes[selectedShape] = { ...shapes[selectedShape], x: newX, y: newY };
        s.shapes = shapes;
        newSlides[currentSlide] = s;
        setSlides(newSlides);
      }

      if (isResizingShape && selectedShape !== null && resizeCorner) {
        const dx = ((e.clientX - resizeStartRef.current.mx) / rect.width) * 100;
        const dy = ((e.clientY - resizeStartRef.current.my) / rect.height) * 100;
        let newX = resizeStartRef.current.sx;
        let newY = resizeStartRef.current.sy;
        let newW = resizeStartRef.current.sw;
        let newH = resizeStartRef.current.sh;

        // Fixed edges (the opposite corner stays anchored)
        const fixedRight = resizeStartRef.current.sx + resizeStartRef.current.sw;
        const fixedBottom = resizeStartRef.current.sy + resizeStartRef.current.sh;

        switch (resizeCorner) {
          case 'br': newW += dx; newH += dy; break;
          case 'bl': newX += dx; newW -= dx; newH += dy; break;
          case 'tr': newW += dx; newY += dy; newH -= dy; break;
          case 'tl': newX += dx; newW -= dx; newY += dy; newH -= dy; break;
        }

        // Clamp dimensions
        newW = Math.max(3, Math.min(80, newW));
        newH = Math.max(3, Math.min(80, newH));

        // Recompute position from the anchored edge after clamping
        if (resizeCorner === 'tl' || resizeCorner === 'bl') {
          newX = fixedRight - newW;
        }
        if (resizeCorner === 'tl' || resizeCorner === 'tr') {
          newY = fixedBottom - newH;
        }

        // Final position clamp
        newX = Math.max(0, newX);
        newY = Math.max(0, newY);

        const newSlides = [...slides];
        const s = { ...newSlides[currentSlide] };
        const shapes = [...(s.shapes || [])];
        shapes[selectedShape] = { ...shapes[selectedShape], x: newX, y: newY, width: newW, height: newH };
        s.shapes = shapes;
        newSlides[currentSlide] = s;
        setSlides(newSlides);
      }
    };

    const handlePointerUp = () => {
      setIsDraggingShape(false);
      setIsResizingShape(false);
      setResizeCorner(null);
      setSnapGuides({});
      if (suppressHistoryRef.current) {
        suppressHistoryRef.current = false;
        pushHistory(slidesRef.current);
      }
    };

    if (isDraggingShape || isResizingShape) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [isDraggingShape, isResizingShape, selectedShape, slides, currentSlide, resizeCorner]);

  // ---- Text box drag / resize via pointer events on window ----
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();

      if (draggingTextBox) {
        const dx = ((e.clientX - textBoxDragStart.current.mx) / rect.width) * 100;
        const dy = ((e.clientY - textBoxDragStart.current.my) / rect.height) * 100;
        const xKey = draggingTextBox === 'title' ? 'titleX' : 'contentX';
        const yKey = draggingTextBox === 'title' ? 'titleY' : 'contentY';
        const wKey = draggingTextBox === 'title' ? 'titleW' : 'contentW';
        const hKey = draggingTextBox === 'title' ? 'titleH' : 'contentH';
        const w = slides[currentSlide]?.[wKey] ?? (draggingTextBox === 'title' ? 90 : 80);
        const h = slides[currentSlide]?.[hKey] ?? (draggingTextBox === 'title' ? 12 : 55);
        let newX = Math.max(0, Math.min(100 - w, textBoxDragStart.current.ox + dx));
        let newY = Math.max(0, Math.min(100 - h, textBoxDragStart.current.oy + dy));
        updateSlide(currentSlide, { [xKey]: newX, [yKey]: newY });
      }

      if (resizingTextBox) {
        const dw = ((e.clientX - textBoxResizeStart.current.mx) / rect.width) * 100;
        const dh = ((e.clientY - textBoxResizeStart.current.my) / rect.height) * 100;
        const wKey = resizingTextBox === 'title' ? 'titleW' : 'contentW';
        const hKey = resizingTextBox === 'title' ? 'titleH' : 'contentH';
        let newW = Math.max(10, Math.min(100, textBoxResizeStart.current.ow + dw));
        let newH = Math.max(5, Math.min(95, textBoxResizeStart.current.oh + dh));
        updateSlide(currentSlide, { [wKey]: newW, [hKey]: newH });
      }
    };

    const handlePointerUp = () => {
      setDraggingTextBox(null);
      setResizingTextBox(null);
      if (suppressHistoryRef.current) {
        suppressHistoryRef.current = false;
        pushHistory(slidesRef.current);
      }
    };

    if (draggingTextBox || resizingTextBox) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggingTextBox, resizingTextBox, slides, currentSlide]);

  // Deselect when switching slides
  useEffect(() => { setSelectedShape(null); }, [currentSlide]);

  // Keep keyboard shortcuts alive: focus the presentation view when it opens,
  // and the editor root when it comes back
  useEffect(() => {
    if (isPresenting) presentationRef.current?.focus();
    else rootRef.current?.focus();
  }, [isPresenting]);

  // Scale slide canvas to fit container without scrolling
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      const pad = 32;
      setSlideScale(Math.min((width - pad) / SLIDE_WIDTH, (height - pad) / SLIDE_HEIGHT));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s2 = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s2}`;
  };

  // ---- Slide helpers ----
  const addSlide = (layout: Slide['layout'] = 'content') => {
    const newSlide: Slide = {
      id: Date.now().toString(),
      title: `Slide ${slides.length + 1}`,
      content: layout === 'title' ? 'Subtitle text' : 'New slide content',
      background: '#6366f1', layout,
      titleSize: layout === 'title' ? 60 : 48,
      contentSize: layout === 'title' ? 32 : 20,
      titleAlign: layout === 'title' ? 'center' : 'left',
      contentAlign: layout === 'title' ? 'center' : 'left',
      bulletPoints: (layout === 'content' || layout === 'two-column') ? ['Point 1', 'Point 2', 'Point 3', 'Point 4'] : undefined,
      notes: '', transition: 'fade', fontFamily: FONT_FAMILIES[0].value,
    };
    setSlides([...slides, newSlide]);
    setCurrentSlide(slides.length);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) { presentationRef.current?.requestFullscreen(); setIsFullscreen(true); }
    else { document.exitFullscreen(); setIsFullscreen(false); }
  };

  const addShape = (type: ShapeItem['type']) => {
    const shape = defaultShape(type);
    const slide = slides[currentSlide];
    const newShapes = [...(slide.shapes || []), shape];
    updateSlide(currentSlide, { shapes: newShapes });
    setSelectedShape(newShapes.length - 1);
  };

  const deleteShape = (idx: number) => {
    const slide = slides[currentSlide];
    const newShapes = (slide.shapes || []).filter((_, i) => i !== idx);
    updateSlide(currentSlide, { shapes: newShapes });
    setSelectedShape(null);
  };

  const updateShapeProp = (idx: number, updates: Partial<ShapeItem>) => {
    const slide = slides[currentSlide];
    const shapes = [...(slide.shapes || [])];
    shapes[idx] = { ...shapes[idx], ...updates };
    updateSlide(currentSlide, { shapes });
  };

  const deleteSlide = (index: number) => {
    if (slides.length <= 1) return;
    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);
    // Keep pointing at the same slide (or its neighbor) after removal
    setCurrentSlide(prev => Math.min(prev > index ? prev - 1 : prev, newSlides.length - 1));
  };

  const updateSlide = (index: number, updates: Partial<Slide>) => {
    const newSlides = [...slides];
    newSlides[index] = { ...newSlides[index], ...updates };
    setSlides(newSlides);
  };

  const duplicateSlide = (index: number) => {
    const newSlide = { ...slides[index], id: Date.now().toString() };
    const newSlides = [...slides];
    newSlides.splice(index + 1, 0, newSlide);
    setSlides(newSlides);
    setCurrentSlide(index + 1);
  };

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= slides.length) return;
    const newSlides = [...slides];
    [newSlides[index], newSlides[target]] = [newSlides[target], newSlides[index]];
    setSlides(newSlides);
    setCurrentSlide(target);
  };

  const addBulletPoint = () => { const s = slides[currentSlide]; updateSlide(currentSlide, { bulletPoints: [...(s.bulletPoints || []), 'New point'] }); };
  const updateBulletPoint = (i: number, v: string) => { const s = slides[currentSlide]; const b = [...(s.bulletPoints || [])]; b[i] = v; updateSlide(currentSlide, { bulletPoints: b }); };
  const deleteBulletPoint = (i: number) => { const s = slides[currentSlide]; updateSlide(currentSlide, { bulletPoints: (s.bulletPoints || []).filter((_, j) => j !== i) }); };

  const exportPresentation = () => {
    const json = JSON.stringify(slides, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'presentation.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const importPresentation = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { try { const d = JSON.parse(ev.target?.result as string); if (Array.isArray(d) && d.length > 0 && d[0].id && d[0].title) { setSlides(d); setCurrentSlide(0); } } catch { /* ignore */ } };
    reader.readAsText(file); e.target.value = '';
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { updateSlide(currentSlide, { imageUrl: ev.target?.result as string }); };
    reader.readAsDataURL(file); e.target.value = '';
  };

  const exportToPDF = () => {
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const shapeHtml = (sh: ShapeItem) => {
      const common = `position:absolute;left:${sh.x}%;top:${sh.y}%;width:${sh.width}%;height:${sh.height}%;opacity:${sh.opacity};${sh.rotation ? `transform:rotate(${sh.rotation}deg);` : ''}`;
      const border = sh.borderWidth > 0 ? `border:${sh.borderWidth}px solid ${sh.borderColor};` : '';
      if (sh.type === 'circle') return `<div style="${common}${border}background:${sh.color};border-radius:50%;"></div>`;
      if (sh.type === 'triangle') return `<div style="${common}background:${sh.color};clip-path:polygon(50% 0%,0% 100%,100% 100%);"></div>`;
      if (sh.type === 'text') return `<div style="${common}${border}${sh.color !== 'transparent' ? `background:${sh.color};` : ''}display:flex;align-items:center;justify-content:center;color:${sh.textColor || '#fff'};font-size:${sh.fontSize || 16}px;font-weight:600;text-align:center;overflow:hidden;">${esc(sh.text || '')}</div>`;
      return `<div style="${common}${border}background:${sh.color};border-radius:4px;"></div>`;
    };

    const contentHtml = (slide: Slide) => {
      const size = slide.contentSize || 24;
      if ((slide.layout === 'content' || slide.layout === 'two-column') && slide.bulletPoints) {
        const cols = slide.layout === 'two-column' ? 'columns:2;column-gap:48px;' : '';
        return `<ul style="font-size:${size}px;list-style:none;padding:0;margin:0;${cols}">${slide.bulletPoints.map(p => `<li style="margin:10px 0;">&bull; ${esc(p)}</li>`).join('')}</ul>`;
      }
      if (slide.layout === 'image') {
        return `<div style="display:flex;gap:32px;align-items:center;height:100%;">
          <p style="flex:1;font-size:${size}px;margin:0;">${esc(slide.content)}</p>
          ${slide.imageUrl ? `<img src="${slide.imageUrl}" style="flex:1;max-width:50%;max-height:90%;object-fit:contain;border-radius:8px;" />` : ''}
        </div>`;
      }
      return `<p style="font-size:${size}px;text-align:${slide.contentAlign || 'center'};margin:0;">${esc(slide.content)}</p>`;
    };

    const pdfContent = slides.map((slide, idx) => `
      <div style="page-break-after:always;position:relative;width:100%;height:100vh;overflow:hidden;background:${slide.background};color:white;font-family:${slide.fontFamily || 'Arial, sans-serif'};">
        <div style="position:absolute;left:${slide.titleX ?? 3}%;top:${slide.titleY ?? 3}%;width:${slide.titleW ?? 90}%;height:${slide.titleH ?? 12}%;display:flex;align-items:center;">
          <h1 style="font-size:${slide.titleSize || 48}px;text-align:${slide.titleAlign || 'center'};margin:0;width:100%;">${esc(slide.title)}</h1>
        </div>
        <div style="position:absolute;left:${slide.contentX ?? 5}%;top:${slide.contentY ?? 18}%;width:${slide.contentW ?? 80}%;height:${slide.contentH ?? 55}%;overflow:hidden;">
          ${contentHtml(slide)}
        </div>
        ${(slide.shapes || []).map(shapeHtml).join('')}
        ${slide.notes ? `<div style="position:absolute;bottom:20px;left:20px;font-size:12px;opacity:0.7;">Notes: ${esc(slide.notes)}</div>` : ''}
        <div style="position:absolute;bottom:10px;right:20px;font-size:14px;opacity:0.8;">Slide ${idx + 1} of ${slides.length}</div>
      </div>`).join('');
    const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${esc(slides[0]?.title || 'Presentation')}</title><style>body{margin:0;font-family:Arial,sans-serif}@media print{body{margin:0}div{page-break-after:always}}</style></head><body>${pdfContent}</body></html>`;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${slides[0]?.title.replace(/\s+/g, '-') || 'presentation'}.html`; a.click();
    const pw = window.open(url); if (pw) { pw.onload = () => { setTimeout(() => { pw.print(); }, 250); }; }
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const applyTheme = (colors: string[]) => { setSlides(slides.map((s, i) => ({ ...s, background: colors[i % colors.length] }))); };

  // Slide sidebar drag-and-drop
  const handleSlideDragStart = (e: React.DragEvent, index: number) => { setDraggingIndex(index); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', index.toString()); };
  const handleSlideDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverIndex(index); };
  const handleSlideDragLeave = () => setDragOverIndex(null);
  const handleSlideDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const src = parseInt(e.dataTransfer.getData('text/plain'));
    if (src !== targetIndex) { const n = [...slides]; const [r] = n.splice(src, 1); n.splice(targetIndex, 0, r); setSlides(n); setCurrentSlide(targetIndex); }
    setDragOverIndex(null); setDraggingIndex(null);
  };
  const handleSlideDragEnd = () => { setDragOverIndex(null); setDraggingIndex(null); };

  const isGradient = (bg: string) => bg.startsWith('linear-gradient');
  const bgStyleFn = (bg: string) => isGradient(bg) ? { background: bg } : { backgroundColor: bg };

  // shape pointer-down for moving
  const onShapePointerDown = (e: React.PointerEvent, idx: number) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedShape(idx);
    const shape = slides[currentSlide]?.shapes?.[idx];
    if (!shape) return;
    dragStartRef.current = { mx: e.clientX, my: e.clientY, sx: shape.x, sy: shape.y };
    suppressHistoryRef.current = true;
    setIsDraggingShape(true);
  };

  // resize pointer-down
  const onResizePointerDown = (e: React.PointerEvent, corner: 'tl' | 'tr' | 'bl' | 'br') => {
    e.stopPropagation();
    e.preventDefault();
    if (selectedShape === null) return;
    const shape = slides[currentSlide]?.shapes?.[selectedShape];
    if (!shape) return;
    resizeStartRef.current = { mx: e.clientX, my: e.clientY, sw: shape.width, sh: shape.height, sx: shape.x, sy: shape.y };
    suppressHistoryRef.current = true;
    setResizeCorner(corner);
    setIsResizingShape(true);
  };

  const deselectAll = () => { setSelectedShape(null); setSnapGuides({}); };

  // text box drag handlers
  const onTextBoxGripDown = (e: React.PointerEvent, boxId: TextBoxId) => {
    e.stopPropagation();
    e.preventDefault();
    const slide = slides[currentSlide];
    const ox = boxId === 'title' ? (slide.titleX ?? 3) : (slide.contentX ?? 5);
    const oy = boxId === 'title' ? (slide.titleY ?? 3) : (slide.contentY ?? 18);
    textBoxDragStart.current = { mx: e.clientX, my: e.clientY, ox, oy };
    suppressHistoryRef.current = true;
    setDraggingTextBox(boxId);
    setSelectedShape(null);
  };

  const onTextBoxResizeDown = (e: React.PointerEvent, boxId: TextBoxId) => {
    e.stopPropagation();
    e.preventDefault();
    const slide = slides[currentSlide];
    const defaultW = boxId === 'title' ? 90 : 80;
    const defaultH = boxId === 'title' ? 12 : 55;
    const ow = boxId === 'title' ? (slide.titleW ?? defaultW) : (slide.contentW ?? defaultW);
    const oh = boxId === 'title' ? (slide.titleH ?? defaultH) : (slide.contentH ?? defaultH);
    textBoxResizeStart.current = { mx: e.clientX, my: e.clientY, ow, oh };
    suppressHistoryRef.current = true;
    setResizingTextBox(boxId);
    setSelectedShape(null);
  };

  // ---- selected shape data ----
  const currentSlideData = slides[currentSlide];
  const selShape = selectedShape !== null ? currentSlideData?.shapes?.[selectedShape] : null;

  // ============================  PRESENTATION MODE  ============================
  if (isPresenting) {
    const slide = slides[currentSlide];
    const progress = ((currentSlide + 1) / slides.length) * 100;
    return (
      <div ref={presentationRef} className="h-full flex flex-col bg-black relative select-none outline-none" onMouseMove={resetControlsTimeout} tabIndex={0}>
        <div className="absolute top-0 left-0 right-0 z-50 h-1 bg-black/30"><div className="h-full bg-white/70 transition-all duration-300" style={{ width: `${progress}%` }} /></div>
        <div key={animationKey} className={`flex-1 flex flex-col items-center justify-center p-12 text-white transition-all duration-500 relative overflow-hidden ${slide.transition === 'fade' ? 'animate-fade-in' : slide.transition === 'slide' ? 'animate-slide-in' : slide.transition === 'zoom' ? 'animate-zoom-in' : ''}`} style={{ ...bgStyleFn(slide.background), fontFamily: slide.fontFamily }}>
          {/* Title - positioned */}
          <div className="absolute" style={{ left: `${slide.titleX ?? 3}%`, top: `${slide.titleY ?? 3}%`, width: `${slide.titleW ?? 90}%`, height: `${slide.titleH ?? 12}%`, display: 'flex', alignItems: 'center' }}>
            <h1 className="font-bold drop-shadow-lg w-full" style={{ fontSize: `${slide.titleSize || 60}px`, textAlign: slide.titleAlign || 'center' }}>{slide.title}</h1>
          </div>
          {/* Content - positioned */}
          <div className="absolute overflow-hidden" style={{ left: `${slide.contentX ?? 5}%`, top: `${slide.contentY ?? 18}%`, width: `${slide.contentW ?? 80}%`, height: `${slide.contentH ?? 55}%` }}>
          {slide.layout === 'content' && slide.bulletPoints ? (
            <ul className="text-3xl space-y-4">{slide.bulletPoints.map((p, i) => (<li key={i} className="flex items-start gap-4 opacity-0 animate-fade-in" style={{ animationDelay: `${i * 0.15}s`, animationFillMode: 'forwards' }}><span className="text-white/70">&#x2022;</span><span>{p}</span></li>))}</ul>
          ) : slide.layout === 'two-column' && slide.bulletPoints ? (
            <div className="flex gap-12 w-full">
              <ul className="flex-1 text-2xl space-y-3">{slide.bulletPoints.slice(0, Math.ceil(slide.bulletPoints.length / 2)).map((p, i) => (<li key={i} className="flex items-start gap-4"><span className="text-white/70">&#x2022;</span><span>{p}</span></li>))}</ul>
              <div className="w-px bg-white/20" />
              <ul className="flex-1 text-2xl space-y-3">{slide.bulletPoints.slice(Math.ceil(slide.bulletPoints.length / 2)).map((p, i) => (<li key={i} className="flex items-start gap-4"><span className="text-white/70">&#x2022;</span><span>{p}</span></li>))}</ul>
            </div>
          ) : slide.layout === 'image' ? (
            <div className="flex gap-8 w-full items-center h-full">
              <div className="flex-1"><p className="text-2xl" style={{ fontSize: `${slide.contentSize || 24}px` }}>{slide.content}</p></div>
              <div className="flex-1 flex items-center justify-center">{slide.imageUrl ? <img src={slide.imageUrl} alt="Slide" className="max-w-full max-h-96 object-contain rounded-lg shadow-2xl" /> : <div className="w-full h-64 border-4 border-dashed border-white/30 rounded-lg flex items-center justify-center"><ImageIcon className="h-24 w-24 opacity-30" /></div>}</div>
            </div>
          ) : slide.layout === 'blank' ? <div className="flex-1" /> : (
            <p className="drop-shadow-md" style={{ fontSize: `${slide.contentSize || 32}px`, textAlign: slide.contentAlign || 'center' }}>{slide.content}</p>
          )}
          </div>
          {/* Shapes in presentation */}
          {slide.shapes?.map((shape, idx) => (
            <div key={idx} style={shapeStyle(shape)}>
              {shape.type === 'text' && <span>{shape.text}</span>}
            </div>
          ))}
        </div>
        {showNotes && slide.notes && (<div className="p-3 bg-gray-900/95 text-white max-h-28 overflow-auto border-t border-white/10"><p className="text-sm font-mono">{slide.notes}</p></div>)}
        {/* Minimal presentation controls */}
        <div className={`absolute bottom-0 left-0 right-0 transition-all duration-500 ${controlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'}`}>
          <div className="flex items-center justify-between px-4 py-2 bg-black/60 backdrop-blur-sm">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1">{slides.map((_, i) => (<button key={i} onClick={() => { setCurrentSlide(i); setAnimationKey(k => k + 1); }} className={`rounded-full transition-all ${currentSlide === i ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/50'}`} />))}</div>
              <span className="text-white/60 text-xs font-mono tabular-nums ml-2">{currentSlide + 1}/{slides.length}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-white/40 text-xs font-mono tabular-nums flex items-center gap-1"><Clock className="h-3 w-3" />{formatTime(presentationTimer)}</span>
              <button onClick={() => setShowNotes(!showNotes)} className="p-1.5 hover:bg-white/10 rounded transition-all" title="Speaker notes">{showNotes ? <EyeOff className="h-3.5 w-3.5 text-white/50" /> : <Eye className="h-3.5 w-3.5 text-white/50" />}</button>
              <button onClick={toggleFullscreen} className="p-1.5 hover:bg-white/10 rounded transition-all" title="Fullscreen">{isFullscreen ? <Minimize2 className="h-3.5 w-3.5 text-white/50" /> : <Maximize2 className="h-3.5 w-3.5 text-white/50" />}</button>
              <button onClick={() => setIsPresenting(false)} className="p-1.5 hover:bg-red-500/30 rounded transition-all" title="Exit"><X className="h-3.5 w-3.5 text-white/50" /></button>
            </div>
          </div>
        </div>
        <div className="absolute top-4 right-4 text-white/30 text-xs pointer-events-none animate-fade-in" style={{ animationDuration: '1s' }}>Arrow keys to navigate &middot; Esc to exit</div>
      </div>
    );
  }

  // ============================  EDITOR MODE  ============================
  return (
    <div ref={rootRef} tabIndex={0} className="h-full flex bg-gray-50 dark:bg-gray-900 outline-none">
      <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={importPresentation} />
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

      {/* ---- Slide Thumbnails Sidebar ---- */}
      <div className="w-56 border-r dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto flex flex-col">
        <div className="p-2 border-b dark:border-gray-700">
          <Button onClick={() => addSlide('content')} className="w-full mb-2" size="sm"><Plus className="h-4 w-4 mr-2" />New Slide</Button>
          <div className="grid grid-cols-2 gap-1">
            <Button onClick={() => addSlide('title')} variant="outline" size="sm" title="Title Slide"><Type className="h-4 w-4" /></Button>
            <Button onClick={() => addSlide('content')} variant="outline" size="sm" title="Content Slide"><List className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="flex-1 p-2 overflow-y-auto">
          {slides.map((slide, idx) => (
            <div key={slide.id} draggable onDragStart={(e) => handleSlideDragStart(e, idx)} onDragOver={(e) => handleSlideDragOver(e, idx)} onDragLeave={handleSlideDragLeave} onDrop={(e) => handleSlideDrop(e, idx)} onDragEnd={handleSlideDragEnd} onClick={() => setCurrentSlide(idx)}
              className={`relative mb-1.5 border-2 rounded-lg cursor-pointer group transition-all ${draggingIndex === idx ? 'opacity-40' : 'opacity-100'} ${dragOverIndex === idx ? 'border-purple-500 shadow-lg shadow-purple-500/20' : currentSlide === idx ? 'border-blue-500 shadow-md ring-1 ring-blue-500/30' : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'}`}>
              <div className="absolute -top-1.5 -left-1.5 z-10 w-5 h-5 bg-gray-700 dark:bg-gray-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">{idx + 1}</div>
              <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-60 transition-opacity cursor-grab active:cursor-grabbing z-10"><GripVertical className="h-3 w-3 text-white drop-shadow" /></div>
              <div className="h-24 rounded-md flex flex-col items-center justify-center text-white text-xs font-semibold p-2 overflow-hidden" style={bgStyleFn(slide.background)}>
                <div className="text-center truncate w-full text-[11px] drop-shadow-sm">{slide.title}</div>
                {slide.layout === 'content' && slide.bulletPoints && (<div className="mt-1 space-y-0.5 w-full px-2">{slide.bulletPoints.slice(0, 2).map((bp, i) => (<div key={i} className="text-[7px] text-white/70 truncate">&#x2022; {bp}</div>))}{slide.bulletPoints.length > 2 && <div className="text-[7px] text-white/50">+{slide.bulletPoints.length - 2} more</div>}</div>)}
                {slide.layout !== 'content' && slide.content && <div className="text-[8px] text-white/70 mt-1 truncate w-full text-center">{slide.content}</div>}
              </div>
              <div className="absolute top-1 right-1 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button onClick={(e) => { e.stopPropagation(); moveSlide(idx, 'up'); }} disabled={idx === 0} className="p-0.5 bg-gray-800/70 hover:bg-gray-700 disabled:opacity-30 text-white rounded backdrop-blur-sm" title="Move up"><ChevronUp className="h-3 w-3" /></button>
                <button onClick={(e) => { e.stopPropagation(); moveSlide(idx, 'down'); }} disabled={idx === slides.length - 1} className="p-0.5 bg-gray-800/70 hover:bg-gray-700 disabled:opacity-30 text-white rounded backdrop-blur-sm" title="Move down"><ChevronDown className="h-3 w-3" /></button>
                <button onClick={(e) => { e.stopPropagation(); duplicateSlide(idx); }} className="p-0.5 bg-blue-500/80 hover:bg-blue-600 text-white rounded backdrop-blur-sm" title="Duplicate"><Copy className="h-3 w-3" /></button>
                <button onClick={(e) => { e.stopPropagation(); deleteSlide(idx); }} className="p-0.5 bg-red-500/80 hover:bg-red-600 text-white rounded backdrop-blur-sm" title="Delete"><Trash2 className="h-3 w-3" /></button>
              </div>
              {slide.transition && slide.transition !== 'none' && <div className="absolute bottom-1 right-1 text-[8px] text-white/50 bg-black/30 px-1 rounded">{slide.transition}</div>}
            </div>
          ))}
        </div>
        <div className="p-2 border-t dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 text-center">
          <div>{slides.length} slide{slides.length !== 1 ? 's' : ''}</div>
          <div className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">Drag to reorder</div>
        </div>
      </div>

      {/* ---- Main Editor Area ---- */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="p-3 border-b dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
          <div className="flex items-center gap-2"><PresentationIcon className="h-5 w-5 text-purple-500" /><h2 className="font-semibold dark:text-white">PowerPoint Presentation</h2></div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={undo} size="sm" variant="outline" title="Undo (Ctrl+Z)" disabled={historyIndex <= 0}><RotateCcw className="h-4 w-4" /></Button>
            <Button onClick={redo} size="sm" variant="outline" title="Redo (Ctrl+Shift+Z)" disabled={historyIndex >= history.length - 1}><RotateCw className="h-4 w-4" /></Button>
            <div className="w-px h-8 bg-gray-300 dark:bg-gray-600" />
            <Button onClick={() => fileInputRef.current?.click()} size="sm" variant="outline" title="Import presentation from JSON file"><Upload className="h-4 w-4 mr-2" />Import</Button>
            <Button onClick={exportPresentation} size="sm" variant="outline" title="Export as JSON file"><Download className="h-4 w-4 mr-2" />JSON</Button>
            <Button onClick={exportToPDF} size="sm" variant="outline" title="Export as printable HTML/PDF"><Download className="h-4 w-4 mr-2" />PDF</Button>
            <Button onClick={() => { setIsPresenting(true); setAnimationKey(0); }} size="sm" className="bg-green-500 hover:bg-green-600" title="Start presentation (Esc to exit)"><Play className="h-4 w-4 mr-2" />Present</Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-3 mt-2 flex-shrink-0">
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="layouts">Layouts</TabsTrigger>
          </TabsList>

          {/* ========== EDIT TAB ========== */}
          <TabsContent value="edit" className="flex-1 flex flex-col mt-0 overflow-hidden data-[state=inactive]:hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-2 p-2 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-wrap">
              <div className="flex items-center gap-1"><label className="text-xs text-gray-500 dark:text-gray-400">Title</label>
                <select value={currentSlideData.titleSize || 48} onChange={(e) => updateSlide(currentSlide, { titleSize: parseInt(e.target.value) })} className="px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600">
                  <option value="24">24px</option><option value="32">32px</option><option value="48">48px</option><option value="60">60px</option><option value="72">72px</option>
                </select>
              </div>
              <div className="flex items-center gap-1"><label className="text-xs text-gray-500 dark:text-gray-400">Body</label>
                <select value={currentSlideData.contentSize || 20} onChange={(e) => updateSlide(currentSlide, { contentSize: parseInt(e.target.value) })} className="px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600">
                  <option value="14">14px</option><option value="18">18px</option><option value="20">20px</option><option value="24">24px</option><option value="32">32px</option><option value="40">40px</option>
                </select>
              </div>
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
              <select value={currentSlideData.fontFamily || FONT_FAMILIES[0].value} onChange={(e) => updateSlide(currentSlide, { fontFamily: e.target.value })} className="px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600">
                {FONT_FAMILIES.map(f => <option key={f.label} value={f.value}>{f.label}</option>)}
              </select>
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
              <Button onClick={() => updateSlide(currentSlide, { titleAlign: 'left', contentAlign: 'left' })} size="sm" variant={currentSlideData.titleAlign === 'left' ? 'default' : 'outline'} title="Align Left"><AlignLeft className="h-4 w-4" /></Button>
              <Button onClick={() => updateSlide(currentSlide, { titleAlign: 'center', contentAlign: 'center' })} size="sm" variant={currentSlideData.titleAlign === 'center' ? 'default' : 'outline'} title="Align Center"><AlignCenter className="h-4 w-4" /></Button>
              <Button onClick={() => updateSlide(currentSlide, { titleAlign: 'right', contentAlign: 'right' })} size="sm" variant={currentSlideData.titleAlign === 'right' ? 'default' : 'outline'} title="Align Right"><AlignRight className="h-4 w-4" /></Button>
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-center gap-1">
                <Palette className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <input type="color" value={isGradient(currentSlideData.background) ? '#6366f1' : currentSlideData.background} onChange={(e) => updateSlide(currentSlide, { background: e.target.value })} className="w-8 h-7 rounded cursor-pointer border dark:border-gray-600" title="Background Color" />
              </div>
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
              <select value={currentSlideData.transition || 'none'} onChange={(e) => updateSlide(currentSlide, { transition: e.target.value as Slide['transition'] })} className="px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600" title="Transition">
                <option value="none">No Transition</option><option value="fade">Fade</option><option value="slide">Slide</option><option value="zoom">Zoom</option>
              </select>
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
              {/* Add shapes/text */}
              <Button onClick={() => addShape('rectangle')} size="sm" variant="outline" title="Add Rectangle"><Square className="h-4 w-4" /></Button>
              <Button onClick={() => addShape('circle')} size="sm" variant="outline" title="Add Circle"><Circle className="h-4 w-4" /></Button>
              <Button onClick={() => addShape('triangle')} size="sm" variant="outline" title="Add Triangle"><Triangle className="h-4 w-4" /></Button>
              <Button onClick={() => addShape('text')} size="sm" variant="outline" title="Add Text Box"><Type className="h-4 w-4" /></Button>
              {(currentSlideData.layout === 'content' || currentSlideData.layout === 'two-column') && (<><div className="w-px h-6 bg-gray-300 dark:bg-gray-600" /><Button onClick={addBulletPoint} size="sm" variant="outline" title="Add bullet point"><Plus className="h-4 w-4 mr-1" />Bullet</Button></>)}
              {currentSlideData.layout === 'image' && (<><div className="w-px h-6 bg-gray-300 dark:bg-gray-600" /><Button onClick={() => imageInputRef.current?.click()} size="sm" variant="outline" title="Upload image for this slide"><ImageIcon className="h-4 w-4 mr-1" />Upload Image</Button></>)}
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
              <Button onClick={() => setShowEditorNotes(v => !v)} size="sm" variant={showEditorNotes ? 'default' : 'outline'} title="Toggle speaker notes"><Eye className="h-4 w-4 mr-1" />Notes</Button>
            </div>

            {/* Canvas + properties panel */}
            <div className="flex-1 flex overflow-hidden min-h-0">
              {/* Slide Canvas */}
              <div ref={containerRef} className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-900 flex items-center justify-center relative" onClick={deselectAll}>
                <div style={{ width: SLIDE_WIDTH * slideScale, height: SLIDE_HEIGHT * slideScale }}>
                <div ref={canvasRef} className="rounded-lg shadow-2xl relative overflow-hidden" style={{ width: SLIDE_WIDTH, height: SLIDE_HEIGHT, transform: `scale(${slideScale})`, transformOrigin: 'top left', ...bgStyleFn(currentSlideData.background), fontFamily: currentSlideData.fontFamily }} onClick={(e) => { if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.canvas) deselectAll(); }}>

                  {/* ======== Movable Title Text Box ======== */}
                  <div
                    className="absolute group/title"
                    style={{
                      left: `${currentSlideData.titleX ?? 3}%`,
                      top: `${currentSlideData.titleY ?? 3}%`,
                      width: `${currentSlideData.titleW ?? 94}%`,
                      height: `${currentSlideData.titleH ?? 12}%`,
                      zIndex: 15,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Grip handle */}
                    <div
                      onPointerDown={(e) => onTextBoxGripDown(e, 'title')}
                      className="absolute -top-0 -left-0 w-full h-5 cursor-grab active:cursor-grabbing flex items-center justify-center opacity-0 group-hover/title:opacity-100 transition-opacity z-20"
                      style={{ touchAction: 'none' }}
                    >
                      <div className="flex items-center gap-1 bg-blue-500/80 text-white text-[9px] font-semibold px-2 py-0.5 rounded-t-md shadow select-none">
                        <GripVertical className="h-3 w-3" />Title
                      </div>
                    </div>
                    {/* Border indicator on hover */}
                    <div className="absolute inset-0 border-2 border-transparent group-hover/title:border-blue-400/50 rounded-lg pointer-events-none transition-colors" />
                    <input
                      type="text"
                      value={currentSlideData.title}
                      onChange={(e) => updateSlide(currentSlide, { title: e.target.value })}
                      className="w-full h-full font-bold text-white bg-transparent border-2 border-transparent focus:border-white/60 outline-none px-4 py-2 rounded-lg transition-colors"
                      style={{ fontSize: `${(currentSlideData.titleSize || 48) * 0.6}px`, textAlign: currentSlideData.titleAlign || 'left' }}
                      placeholder="Slide Title"
                    />
                    {/* Resize handle */}
                    <div
                      onPointerDown={(e) => onTextBoxResizeDown(e, 'title')}
                      className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-blue-500 border-2 border-white rounded-sm cursor-nwse-resize z-20 opacity-0 group-hover/title:opacity-100 transition-opacity"
                      style={{ touchAction: 'none' }}
                    />
                  </div>

                  {/* ======== Movable Content Text Box ======== */}
                  <div
                    className="absolute group/content"
                    style={{
                      left: `${currentSlideData.contentX ?? 3}%`,
                      top: `${currentSlideData.contentY ?? 18}%`,
                      width: `${currentSlideData.contentW ?? 94}%`,
                      height: `${currentSlideData.contentH ?? 75}%`,
                      zIndex: 14,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Grip handle */}
                    <div
                      onPointerDown={(e) => onTextBoxGripDown(e, 'content')}
                      className="absolute -top-0 -left-0 w-full h-5 cursor-grab active:cursor-grabbing flex items-center justify-center opacity-0 group-hover/content:opacity-100 transition-opacity z-20"
                      style={{ touchAction: 'none' }}
                    >
                      <div className="flex items-center gap-1 bg-purple-500/80 text-white text-[9px] font-semibold px-2 py-0.5 rounded-t-md shadow select-none">
                        <GripVertical className="h-3 w-3" />Content
                      </div>
                    </div>
                    <div className="absolute inset-0 border-2 border-transparent group-hover/content:border-purple-400/50 rounded-lg pointer-events-none transition-colors" />

                    {/* Inner content varies by layout */}
                    {currentSlideData.layout === 'title' && (
                      <textarea
                        value={currentSlideData.content}
                        onChange={(e) => updateSlide(currentSlide, { content: e.target.value })}
                        className="w-full h-full text-white bg-transparent border-2 border-transparent focus:border-white/60 outline-none px-4 py-2 rounded-lg resize-none transition-colors"
                        style={{ fontSize: `${(currentSlideData.contentSize || 24) * 0.6}px`, textAlign: currentSlideData.contentAlign || 'center' }}
                        placeholder="Subtitle or content"
                      />
                    )}
                    {currentSlideData.layout === 'content' && (
                      <div className="w-full h-full space-y-2 overflow-auto p-2">
                        {currentSlideData.bulletPoints?.map((point, idx) => (
                          <div key={idx} className="flex items-center gap-2 group">
                            <span className="text-white/70 text-lg">&#x2022;</span>
                            <input type="text" value={point} onChange={(e) => updateBulletPoint(idx, e.target.value)} className="flex-1 text-white bg-transparent border-2 border-transparent hover:border-white/30 focus:border-white/60 outline-none px-3 py-1.5 rounded-lg transition-colors" style={{ fontSize: `${(currentSlideData.contentSize || 20) * 0.6}px` }} placeholder="Bullet point" />
                            <button onClick={() => deleteBulletPoint(idx)} className="opacity-0 group-hover:opacity-100 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded transition-opacity"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                    {currentSlideData.layout === 'two-column' && (
                      <div className="w-full h-full flex gap-4 overflow-auto p-2">
                        <div className="flex-1 space-y-2">
                          <h4 className="text-white/80 text-sm font-semibold mb-2 uppercase tracking-wider">Left Column</h4>
                          {currentSlideData.bulletPoints?.slice(0, Math.ceil((currentSlideData.bulletPoints?.length || 0) / 2)).map((point, idx) => (
                            <div key={idx} className="flex items-center gap-2 group"><span className="text-white/70 text-lg">&#x2022;</span><input type="text" value={point} onChange={(e) => updateBulletPoint(idx, e.target.value)} className="flex-1 text-white bg-transparent border-2 border-transparent hover:border-white/30 focus:border-white/60 outline-none px-3 py-1.5 rounded-lg transition-colors" style={{ fontSize: `${(currentSlideData.contentSize || 20) * 0.55}px` }} /><button onClick={() => deleteBulletPoint(idx)} className="opacity-0 group-hover:opacity-100 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded transition-opacity"><Trash2 className="h-3.5 w-3.5" /></button></div>
                          ))}
                        </div>
                        <div className="w-px bg-white/20" />
                        <div className="flex-1 space-y-2">
                          <h4 className="text-white/80 text-sm font-semibold mb-2 uppercase tracking-wider">Right Column</h4>
                          {currentSlideData.bulletPoints?.slice(Math.ceil((currentSlideData.bulletPoints?.length || 0) / 2)).map((point, idx) => {
                            const ai = idx + Math.ceil((currentSlideData.bulletPoints?.length || 0) / 2);
                            return (<div key={ai} className="flex items-center gap-2 group"><span className="text-white/70 text-lg">&#x2022;</span><input type="text" value={point} onChange={(e) => updateBulletPoint(ai, e.target.value)} className="flex-1 text-white bg-transparent border-2 border-transparent hover:border-white/30 focus:border-white/60 outline-none px-3 py-1.5 rounded-lg transition-colors" style={{ fontSize: `${(currentSlideData.contentSize || 20) * 0.55}px` }} /><button onClick={() => deleteBulletPoint(ai)} className="opacity-0 group-hover:opacity-100 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded transition-opacity"><Trash2 className="h-3.5 w-3.5" /></button></div>);
                          })}
                        </div>
                      </div>
                    )}
                    {currentSlideData.layout === 'image' && (
                      <div className="w-full h-full flex gap-4 p-2">
                        <div className="flex-1"><textarea value={currentSlideData.content} onChange={(e) => updateSlide(currentSlide, { content: e.target.value })} className="w-full h-full text-white bg-transparent border-2 border-transparent hover:border-white/30 focus:border-white/60 outline-none px-4 py-2 rounded-lg resize-none transition-colors" style={{ fontSize: `${(currentSlideData.contentSize || 20) * 0.6}px`, textAlign: currentSlideData.contentAlign || 'left' }} placeholder="Add description or content..." /></div>
                        <div className="flex-1 border-2 border-dashed border-white/30 rounded-lg flex items-center justify-center cursor-pointer hover:border-white/60 transition-colors group" onClick={() => imageInputRef.current?.click()}>
                          {currentSlideData.imageUrl ? (<div className="relative w-full h-full p-2"><img src={currentSlideData.imageUrl} alt="Slide" className="w-full h-full object-contain rounded" /><div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center"><span className="text-white text-sm font-medium">Click to replace</span></div></div>) : (<div className="text-center text-white/50 group-hover:text-white/80 transition-colors"><ImageIcon className="h-12 w-12 mx-auto mb-2" /><p className="text-sm font-medium">Click to upload image</p><p className="text-xs mt-1">Supports JPG, PNG, GIF, SVG</p></div>)}
                        </div>
                      </div>
                    )}
                    {currentSlideData.layout === 'blank' && (<div className="w-full h-full flex items-center justify-center text-white/30"><p className="text-sm">Blank slide - add shapes and text boxes</p></div>)}

                    {/* Resize handle */}
                    <div
                      onPointerDown={(e) => onTextBoxResizeDown(e, 'content')}
                      className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-purple-500 border-2 border-white rounded-sm cursor-nwse-resize z-20 opacity-0 group-hover/content:opacity-100 transition-opacity"
                      style={{ touchAction: 'none' }}
                    />
                  </div>

                  {/* ======== Shapes on canvas ======== */}
                  {currentSlideData.shapes?.map((shape, idx) => (
                    <div key={idx}
                      style={{
                        ...shapeStyle(shape),
                        cursor: isDraggingShape && selectedShape === idx ? 'grabbing' : 'grab',
                        outline: selectedShape === idx ? '2px solid #3b82f6' : 'none',
                        outlineOffset: '2px',
                        zIndex: (isDraggingShape || isResizingShape) && selectedShape === idx ? 100 : 20 + idx,
                      }}
                      onPointerDown={(e) => onShapePointerDown(e, idx)}
                      onClick={(e) => { e.stopPropagation(); setSelectedShape(idx); }}
                    >
                      {shape.type === 'text' && <span style={{ pointerEvents: 'none' }}>{shape.text}</span>}

                      {/* 4-corner resize handles */}
                      {selectedShape === idx && (
                        <>
                          <div onPointerDown={(e) => onResizePointerDown(e, 'tl')} className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-blue-500 border-2 border-white rounded-sm cursor-nwse-resize z-40" style={{ touchAction: 'none' }} />
                          <div onPointerDown={(e) => onResizePointerDown(e, 'tr')} className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-500 border-2 border-white rounded-sm cursor-nesw-resize z-40" style={{ touchAction: 'none' }} />
                          <div onPointerDown={(e) => onResizePointerDown(e, 'bl')} className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-blue-500 border-2 border-white rounded-sm cursor-nesw-resize z-40" style={{ touchAction: 'none' }} />
                          <div onPointerDown={(e) => onResizePointerDown(e, 'br')} className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-blue-500 border-2 border-white rounded-sm cursor-nwse-resize z-40" style={{ touchAction: 'none' }} />
                        </>
                      )}
                    </div>
                  ))}

                  {/* ======== Snap guide lines ======== */}
                  {snapGuides.x !== undefined && (
                    <div className="absolute top-0 bottom-0 pointer-events-none z-50" style={{ left: `${snapGuides.x}%`, width: '1px', background: 'rgba(59,130,246,0.6)', boxShadow: '0 0 4px rgba(59,130,246,0.4)' }} />
                  )}
                  {snapGuides.y !== undefined && (
                    <div className="absolute left-0 right-0 pointer-events-none z-50" style={{ top: `${snapGuides.y}%`, height: '1px', background: 'rgba(59,130,246,0.6)', boxShadow: '0 0 4px rgba(59,130,246,0.4)' }} />
                  )}

                  {/* Slide number overlay */}
                  <div className="absolute bottom-2 right-3 bg-black/40 backdrop-blur-sm text-white/80 text-xs font-mono px-2 py-0.5 rounded-full z-10" data-canvas="true">{currentSlide + 1}/{slides.length}</div>
                </div>
                </div>

                {/* ======== Floating Speaker Notes Popout ======== */}
                {showEditorNotes && (
                  <div className="absolute bottom-3 left-3 right-3 z-20 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border dark:border-gray-700 rounded-xl shadow-xl" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between px-3 py-1.5 border-b dark:border-gray-700">
                      <h4 className="font-semibold dark:text-white text-xs flex items-center gap-1.5"><Eye className="h-3.5 w-3.5 text-gray-500" />Speaker Notes</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400">{(currentSlideData.notes || '').length} chars</span>
                        <button onClick={() => setShowEditorNotes(false)} className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"><X className="h-3.5 w-3.5 text-gray-500" /></button>
                      </div>
                    </div>
                    <div className="p-2">
                      <textarea value={currentSlideData.notes || ''} onChange={(e) => updateSlide(currentSlide, { notes: e.target.value })} className="w-full p-2 border rounded-lg text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 resize-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all" rows={3} placeholder="Add notes for this slide... (visible only to presenter)" />
                    </div>
                  </div>
                )}
              </div>

              {/* ======== Shape Properties Panel ======== */}
              {selShape && selectedShape !== null && (
                <div className="w-60 border-l dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto flex-shrink-0 p-3 space-y-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm dark:text-white capitalize flex items-center gap-1.5">
                      {selShape.type === 'rectangle' && <Square className="h-4 w-4" />}
                      {selShape.type === 'circle' && <Circle className="h-4 w-4" />}
                      {selShape.type === 'triangle' && <Triangle className="h-4 w-4" />}
                      {selShape.type === 'text' && <Type className="h-4 w-4" />}
                      {selShape.type === 'text' ? 'Text Box' : selShape.type}
                    </h3>
                    <button onClick={() => deleteShape(selectedShape)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded" title="Delete shape"><Trash2 className="h-4 w-4" /></button>
                  </div>

                  {/* Text content (for text boxes) */}
                  {selShape.type === 'text' && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Text</label>
                      <textarea value={selShape.text || ''} onChange={(e) => updateShapeProp(selectedShape, { text: e.target.value })} className="w-full p-2 border rounded-lg text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 resize-none" rows={2} />
                    </div>
                  )}

                  {/* Text color + size (for text) */}
                  {selShape.type === 'text' && (
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Text Color</label>
                        <input type="color" value={selShape.textColor || '#ffffff'} onChange={(e) => updateShapeProp(selectedShape, { textColor: e.target.value })} className="w-full h-8 rounded cursor-pointer border dark:border-gray-600" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Font Size</label>
                        <input type="number" min={8} max={72} value={selShape.fontSize || 16} onChange={(e) => updateShapeProp(selectedShape, { fontSize: parseInt(e.target.value) || 16 })} className="w-full p-1.5 border rounded text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600" />
                      </div>
                    </div>
                  )}

                  {/* Fill color */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Fill Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={selShape.color === 'transparent' ? '#000000' : selShape.color} onChange={(e) => updateShapeProp(selectedShape, { color: e.target.value })} className="w-10 h-8 rounded cursor-pointer border dark:border-gray-600" />
                      <div className="flex flex-wrap gap-1 flex-1">
                        {SHAPE_COLORS.map(c => (
                          <button key={c} onClick={() => updateShapeProp(selectedShape, { color: c })}
                            className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${selShape.color === c ? 'border-blue-500 scale-110' : 'border-gray-300 dark:border-gray-600'}`}
                            style={{ backgroundColor: c }} />
                        ))}
                        {selShape.type === 'text' && (
                          <button onClick={() => updateShapeProp(selectedShape, { color: 'transparent' })}
                            className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 text-[8px] ${selShape.color === 'transparent' ? 'border-blue-500 scale-110' : 'border-gray-300 dark:border-gray-600'}`}
                            style={{ background: 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 8px 8px' }} title="Transparent" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Border color */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Border Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={selShape.borderColor} onChange={(e) => updateShapeProp(selectedShape, { borderColor: e.target.value })} className="w-10 h-8 rounded cursor-pointer border dark:border-gray-600" />
                      <div className="flex flex-wrap gap-1 flex-1">
                        {SHAPE_COLORS.map(c => (
                          <button key={c} onClick={() => updateShapeProp(selectedShape, { borderColor: c })}
                            className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${selShape.borderColor === c ? 'border-blue-500 scale-110' : 'border-gray-300 dark:border-gray-600'}`}
                            style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Border width */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Border Width: {selShape.borderWidth}px</label>
                    <input type="range" min={0} max={10} value={selShape.borderWidth} onChange={(e) => updateShapeProp(selectedShape, { borderWidth: parseInt(e.target.value) })} className="w-full accent-blue-500" />
                  </div>

                  {/* Opacity */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Opacity: {Math.round(selShape.opacity * 100)}%</label>
                    <input type="range" min={10} max={100} value={Math.round(selShape.opacity * 100)} onChange={(e) => updateShapeProp(selectedShape, { opacity: parseInt(e.target.value) / 100 })} className="w-full accent-blue-500" />
                  </div>

                  {/* Rotation */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Rotation: {selShape.rotation}°</label>
                    <input type="range" min={0} max={360} value={selShape.rotation} onChange={(e) => updateShapeProp(selectedShape, { rotation: parseInt(e.target.value) })} className="w-full accent-blue-500" />
                  </div>

                  {/* Size */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Width %</label>
                      <input type="number" min={3} max={80} step={1} value={Math.round(selShape.width)} onChange={(e) => updateShapeProp(selectedShape, { width: parseFloat(e.target.value) || 8 })} className="w-full p-1.5 border rounded text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Height %</label>
                      <input type="number" min={3} max={80} step={1} value={Math.round(selShape.height)} onChange={(e) => updateShapeProp(selectedShape, { height: parseFloat(e.target.value) || 12 })} className="w-full p-1.5 border rounded text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600" />
                    </div>
                  </div>

                  {/* Position */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">X %</label>
                      <input type="number" min={0} max={95} step={1} value={Math.round(selShape.x)} onChange={(e) => updateShapeProp(selectedShape, { x: parseFloat(e.target.value) || 0 })} className="w-full p-1.5 border rounded text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Y %</label>
                      <input type="number" min={0} max={95} step={1} value={Math.round(selShape.y)} onChange={(e) => updateShapeProp(selectedShape, { y: parseFloat(e.target.value) || 0 })} className="w-full p-1.5 border rounded text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600" />
                    </div>
                  </div>

                  {/* Duplicate / Layer ordering */}
                  <div className="flex gap-2 pt-2 border-t dark:border-gray-700">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => {
                      const shapes = [...(currentSlideData.shapes || [])];
                      const dup = { ...shapes[selectedShape], x: shapes[selectedShape].x + 3, y: shapes[selectedShape].y + 3 };
                      shapes.push(dup);
                      updateSlide(currentSlide, { shapes });
                      setSelectedShape(shapes.length - 1);
                    }} title="Duplicate (Ctrl+D)"><Copy className="h-3.5 w-3.5 mr-1" />Duplicate</Button>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Layer Order</label>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="flex-1 text-[10px] px-1" title="Send to Back" disabled={selectedShape === 0} onClick={() => {
                        const shapes = [...(currentSlideData.shapes || [])];
                        const [item] = shapes.splice(selectedShape, 1);
                        shapes.unshift(item);
                        updateSlide(currentSlide, { shapes });
                        setSelectedShape(0);
                      }}>Back</Button>
                      <Button size="sm" variant="outline" className="flex-1 text-[10px] px-1" title="Send Backward" disabled={selectedShape === 0} onClick={() => {
                        const shapes = [...(currentSlideData.shapes || [])];
                        [shapes[selectedShape - 1], shapes[selectedShape]] = [shapes[selectedShape], shapes[selectedShape - 1]];
                        updateSlide(currentSlide, { shapes });
                        setSelectedShape(selectedShape - 1);
                      }}>Down</Button>
                      <Button size="sm" variant="outline" className="flex-1 text-[10px] px-1" title="Bring Forward" disabled={selectedShape >= (currentSlideData.shapes?.length || 0) - 1} onClick={() => {
                        const shapes = [...(currentSlideData.shapes || [])];
                        [shapes[selectedShape], shapes[selectedShape + 1]] = [shapes[selectedShape + 1], shapes[selectedShape]];
                        updateSlide(currentSlide, { shapes });
                        setSelectedShape(selectedShape + 1);
                      }}>Up</Button>
                      <Button size="sm" variant="outline" className="flex-1 text-[10px] px-1" title="Bring to Front" disabled={selectedShape >= (currentSlideData.shapes?.length || 0) - 1} onClick={() => {
                        const shapes = [...(currentSlideData.shapes || [])];
                        const [item] = shapes.splice(selectedShape, 1);
                        shapes.push(item);
                        updateSlide(currentSlide, { shapes });
                        setSelectedShape(shapes.length - 1);
                      }}>Front</Button>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">Drag to move &middot; Corner handles to resize &middot; Del to remove &middot; Ctrl+D duplicate &middot; Ctrl+C/V copy-paste</p>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="design" className="flex-1 overflow-auto mt-0 bg-white dark:bg-gray-900 data-[state=inactive]:hidden">
            <div className="p-6 max-w-4xl mx-auto min-h-full">
              <h3 className="text-lg font-bold mb-4 dark:text-white">Solid Themes</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {PRESET_THEMES.map((theme, idx) => (
                  <div key={idx} onClick={() => applyTheme(theme.colors)} className="p-4 border-2 rounded-lg cursor-pointer hover:border-purple-500 hover:shadow-lg transition-all dark:border-gray-700 group">
                    <div className="flex gap-2 mb-3">{theme.colors.map((c, i) => <div key={i} className="flex-1 h-14 rounded-md shadow-inner group-hover:scale-105 transition-transform" style={{ backgroundColor: c }} />)}</div>
                    <h4 className="font-bold text-center dark:text-white text-sm">{theme.name}</h4>
                  </div>
                ))}
              </div>
              <h3 className="text-lg font-bold mb-4 mt-8 dark:text-white">Gradient Themes</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {GRADIENT_THEMES.map((theme, idx) => (
                  <div key={idx} onClick={() => applyTheme(theme.colors)} className="p-4 border-2 rounded-lg cursor-pointer hover:border-purple-500 hover:shadow-lg transition-all dark:border-gray-700 group">
                    <div className="flex gap-2 mb-3">{theme.colors.map((c, i) => <div key={i} className="flex-1 h-14 rounded-md shadow-inner group-hover:scale-105 transition-transform" style={{ background: c }} />)}</div>
                    <h4 className="font-bold text-center dark:text-white text-sm">{theme.name}</h4>
                  </div>
                ))}
              </div>
              <div className="mt-8 p-6 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl">
                <h4 className="font-bold mb-3 dark:text-white flex items-center gap-2"><Sparkles className="h-5 w-5 text-purple-500" />Design Tips</h4>
                <ul className="text-sm space-y-2 dark:text-gray-300">
                  <li>&#x2022; Use consistent colors throughout your presentation</li>
                  <li>&#x2022; Keep text readable with high contrast</li>
                  <li>&#x2022; Limit bullet points to 5-7 per slide</li>
                  <li>&#x2022; Use large fonts (minimum 24px for body text)</li>
                  <li>&#x2022; Add visual elements to break up text</li>
                  <li>&#x2022; Gradient backgrounds add a modern, professional look</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          {/* ========== LAYOUTS TAB ========== */}
          <TabsContent value="layouts" className="flex-1 overflow-auto mt-0 bg-white dark:bg-gray-900 data-[state=inactive]:hidden">
            <div className="p-6 max-w-4xl mx-auto min-h-full">
              <h3 className="text-lg font-bold mb-4 dark:text-white">Slide Layouts</h3>
              <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 text-sm dark:text-gray-300">Click <strong>Apply</strong> to change the current slide's layout, or <strong>Add</strong> to create a new slide.</div>
              <div className="grid md:grid-cols-3 gap-4">
                {([
                  { type: 'title' as const, name: 'Title Slide', desc: 'Large title with subtitle', icon: Type },
                  { type: 'content' as const, name: 'Content', desc: 'Title with bullet points', icon: List },
                  { type: 'two-column' as const, name: 'Two Column', desc: 'Split content layout', icon: Layout },
                  { type: 'image' as const, name: 'Image', desc: 'Title with image', icon: ImageIcon },
                  { type: 'blank' as const, name: 'Blank', desc: 'Empty slide', icon: Shapes }
                ]).map((layout, idx) => {
                  const Icon = layout.icon;
                  return (
                    <div key={idx} className={`p-5 border-2 rounded-xl transition-all ${currentSlideData.layout === layout.type ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg shadow-purple-500/10' : 'border-gray-200 dark:border-gray-700 hover:border-purple-400 hover:shadow-md'}`}>
                      <div className="text-center mb-4">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"><Icon className="h-6 w-6 text-white" /></div>
                        <h4 className="font-bold mb-1 dark:text-white">{layout.name}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{layout.desc}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => { updateSlide(currentSlide, { layout: layout.type, bulletPoints: (layout.type === 'content' || layout.type === 'two-column') ? (currentSlideData.bulletPoints || ['Point 1', 'Point 2', 'Point 3', 'Point 4']) : undefined }); setActiveTab('edit'); }} size="sm" variant="outline" className="flex-1">Apply</Button>
                        <Button onClick={() => { addSlide(layout.type); setActiveTab('edit'); }} size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700"><Plus className="h-4 w-4 mr-1" />Add</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-8 p-5 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                <h4 className="font-bold text-base mb-3 dark:text-white">Current Slide</h4>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    {(() => { const icons: Record<string, typeof Type> = { title: Type, content: List, 'two-column': Layout, image: ImageIcon, blank: Shapes }; const I = icons[currentSlideData.layout] || Type; return <I className="h-5 w-5 text-white" />; })()}
                  </div>
                  <div className="flex-1"><p className="font-semibold dark:text-white capitalize text-sm">{currentSlideData.layout.replace('-', ' ')} Layout</p><p className="text-xs text-gray-500 dark:text-gray-400">Slide {currentSlide + 1} of {slides.length}</p></div>
                  <Button onClick={() => setActiveTab('edit')} size="sm" variant="outline">Edit Slide</Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
