import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Presentation as PresentationIcon, Plus, Trash2, Play, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Download, Upload, Copy, Image as ImageIcon, Type, Layout, Palette, AlignLeft, AlignCenter, AlignRight, List, Sparkles, Maximize2, Minimize2, Shapes, Clock, Eye, EyeOff, X, GripVertical, RotateCcw, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  shapes?: Array<{ type: 'rectangle' | 'circle' | 'triangle'; x: number; y: number; color: string }>;
  fontFamily?: string;
}

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

// Max undo history size
const MAX_HISTORY = 30;

export const Presentation: React.FC = () => {
  const [slides, setSlides] = useState<Slide[]>([
    { id: '1', title: 'Welcome', content: 'My Presentation', background: '#3b82f6', layout: 'title', titleSize: 60, contentSize: 24, titleAlign: 'center', contentAlign: 'center', notes: '', transition: 'fade', fontFamily: FONT_FAMILIES[0].value },
    { id: '2', title: 'Agenda', content: '', background: '#8b5cf6', layout: 'content', bulletPoints: ['Introduction', 'Main Topics', 'Conclusion'], titleSize: 48, contentSize: 20, titleAlign: 'left', contentAlign: 'left', notes: '', transition: 'slide', fontFamily: FONT_FAMILIES[0].value },
    { id: '3', title: 'Thank You', content: 'Questions?', background: '#10b981', layout: 'title', titleSize: 60, contentSize: 32, titleAlign: 'center', contentAlign: 'center', notes: '', transition: 'zoom', fontFamily: FONT_FAMILIES[0].value }
  ]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);
  const [activeTab, setActiveTab] = useState('edit');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [presentationTimer, setPresentationTimer] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [animationKey, setAnimationKey] = useState(0);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  // Undo / Redo
  const [history, setHistory] = useState<Slide[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoRef = useRef(false);

  const presentationRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Push to undo history when slides change (but not from undo/redo)
  useEffect(() => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(slides);
      if (newHistory.length > MAX_HISTORY) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoRef.current = true;
      setHistoryIndex(prev => prev - 1);
      setSlides(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoRef.current = true;
      setHistoryIndex(prev => prev + 1);
      setSlides(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  // Keyboard shortcuts in presentation mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPresenting) {
        switch (e.key) {
          case 'ArrowRight':
          case 'ArrowDown':
          case ' ':
            e.preventDefault();
            setCurrentSlide(prev => {
              const next = Math.min(slides.length - 1, prev + 1);
              if (next !== prev) setAnimationKey(k => k + 1);
              return next;
            });
            break;
          case 'ArrowLeft':
          case 'ArrowUp':
            e.preventDefault();
            setCurrentSlide(prev => {
              const next = Math.max(0, prev - 1);
              if (next !== prev) setAnimationKey(k => k + 1);
              return next;
            });
            break;
          case 'Escape':
            e.preventDefault();
            setIsPresenting(false);
            break;
          case 'Home':
            e.preventDefault();
            setCurrentSlide(0);
            setAnimationKey(k => k + 1);
            break;
          case 'End':
            e.preventDefault();
            setCurrentSlide(slides.length - 1);
            setAnimationKey(k => k + 1);
            break;
        }
      } else {
        // Editor keyboard shortcuts
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
          if (e.shiftKey) {
            e.preventDefault();
            redo();
          } else {
            e.preventDefault();
            undo();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresenting, slides.length, undo, redo]);

  // Presentation timer
  useEffect(() => {
    if (isPresenting) {
      setPresentationTimer(0);
      timerRef.current = setInterval(() => {
        setPresentationTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPresenting]);

  // Auto-hide controls in presentation mode
  const resetControlsTimeout = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPresenting) setControlsVisible(false);
    }, 3000);
  }, [isPresenting]);

  useEffect(() => {
    if (isPresenting) {
      resetControlsTimeout();
      const handleMouseMove = () => resetControlsTimeout();
      window.addEventListener('mousemove', handleMouseMove);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      };
    } else {
      setControlsVisible(true);
    }
  }, [isPresenting, resetControlsTimeout]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const addSlide = (layout: Slide['layout'] = 'content') => {
    const newSlide: Slide = {
      id: Date.now().toString(),
      title: `Slide ${slides.length + 1}`,
      content: layout === 'title' ? 'Subtitle text' : 'New slide content',
      background: '#6366f1',
      layout,
      titleSize: layout === 'title' ? 60 : 48,
      contentSize: layout === 'title' ? 32 : 20,
      titleAlign: layout === 'title' ? 'center' : 'left',
      contentAlign: layout === 'title' ? 'center' : 'left',
      bulletPoints: (layout === 'content' || layout === 'two-column') ? ['Point 1', 'Point 2', 'Point 3', 'Point 4'] : undefined,
      notes: '',
      transition: 'fade',
      fontFamily: FONT_FAMILIES[0].value,
    };
    setSlides([...slides, newSlide]);
    setCurrentSlide(slides.length);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      presentationRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const addShape = (type: 'rectangle' | 'circle' | 'triangle') => {
    const slide = slides[currentSlide];
    const newShapes = [...(slide.shapes || []), {
      type,
      x: Math.random() * 60 + 20,
      y: Math.random() * 60 + 20,
      color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`
    }];
    updateSlide(currentSlide, { shapes: newShapes });
  };

  const deleteSlide = (index: number) => {
    if (slides.length > 1) {
      setSlides(slides.filter((_, i) => i !== index));
      if (currentSlide >= slides.length - 1) setCurrentSlide(Math.max(0, slides.length - 2));
    }
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

  const addBulletPoint = () => {
    const slide = slides[currentSlide];
    const newBullets = [...(slide.bulletPoints || []), 'New point'];
    updateSlide(currentSlide, { bulletPoints: newBullets });
  };

  const updateBulletPoint = (index: number, value: string) => {
    const slide = slides[currentSlide];
    const newBullets = [...(slide.bulletPoints || [])];
    newBullets[index] = value;
    updateSlide(currentSlide, { bulletPoints: newBullets });
  };

  const deleteBulletPoint = (index: number) => {
    const slide = slides[currentSlide];
    const newBullets = (slide.bulletPoints || []).filter((_, i) => i !== index);
    updateSlide(currentSlide, { bulletPoints: newBullets });
  };

  const exportPresentation = () => {
    const json = JSON.stringify(slides, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'presentation.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importPresentation = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data) && data.length > 0 && data[0].id && data[0].title) {
          setSlides(data);
          setCurrentSlide(0);
        }
      } catch {
        // Invalid JSON - ignore
      }
    };
    reader.readAsText(file);
    // Reset so the same file can be imported again
    e.target.value = '';
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      updateSlide(currentSlide, { imageUrl: event.target?.result as string });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const exportToPDF = () => {
    const pdfContent = slides.map((slide, idx) => `
      <div style="page-break-after: always; width: 100%; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; background: ${slide.background}; color: white; padding: 40px; font-family: ${slide.fontFamily || 'Arial, sans-serif'};">
        <h1 style="font-size: ${slide.titleSize || 48}px; text-align: ${slide.titleAlign || 'center'}; margin-bottom: 20px;">${slide.title}</h1>
        ${slide.layout === 'content' && slide.bulletPoints ?
        `<ul style="font-size: ${slide.contentSize || 20}px; list-style: none; padding: 0;">
            ${slide.bulletPoints.map(point => `<li style="margin: 10px 0;">&bull; ${point}</li>`).join('')}
          </ul>` :
        `<p style="font-size: ${slide.contentSize || 24}px; text-align: ${slide.contentAlign || 'center'};">${slide.content}</p>`
      }
        ${slide.notes ? `<div style="position: absolute; bottom: 20px; font-size: 12px; opacity: 0.7;">Notes: ${slide.notes}</div>` : ''}
        <div style="position: absolute; bottom: 10px; right: 20px; font-size: 14px;">Slide ${idx + 1} of ${slides.length}</div>
      </div>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${slides[0]?.title || 'Presentation'}</title>
        <style>
          body { margin: 0; font-family: Arial, sans-serif; }
          @media print {
            body { margin: 0; }
            div { page-break-after: always; }
          }
        </style>
      </head>
      <body>
        ${pdfContent}
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slides[0]?.title.replace(/\s+/g, '-') || 'presentation'}.html`;
    a.click();
    URL.revokeObjectURL(url);

    const printWindow = window.open(url);
    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };
    }
  };

  const applyTheme = (colors: string[]) => {
    const newSlides = slides.map((slide, idx) => ({
      ...slide,
      background: colors[idx % colors.length]
    }));
    setSlides(newSlides);
  };

  // Drag and drop handlers for slide reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (sourceIndex === targetIndex) {
      setDragOverIndex(null);
      setDraggingIndex(null);
      return;
    }
    const newSlides = [...slides];
    const [removed] = newSlides.splice(sourceIndex, 1);
    newSlides.splice(targetIndex, 0, removed);
    setSlides(newSlides);
    setCurrentSlide(targetIndex);
    setDragOverIndex(null);
    setDraggingIndex(null);
  };

  const handleDragEnd = () => {
    setDragOverIndex(null);
    setDraggingIndex(null);
  };

  const isGradient = (bg: string) => bg.startsWith('linear-gradient');
  const bgStyle = (bg: string) => isGradient(bg) ? { background: bg } : { backgroundColor: bg };

  // ---------- PRESENTATION MODE ----------
  if (isPresenting) {
    const slide = slides[currentSlide];
    const progress = ((currentSlide + 1) / slides.length) * 100;

    return (
      <div
        ref={presentationRef}
        className="h-full flex flex-col bg-black relative select-none"
        onMouseMove={resetControlsTimeout}
        tabIndex={0}
      >
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 z-50 h-1 bg-black/30">
          <div
            className="h-full bg-white/70 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Slide Content */}
        <div
          key={animationKey}
          className={`flex-1 flex flex-col items-center justify-center p-12 text-white transition-all duration-500 relative overflow-hidden ${slide.transition === 'fade' ? 'animate-fade-in' :
            slide.transition === 'slide' ? 'animate-slide-in' :
              slide.transition === 'zoom' ? 'animate-zoom-in' : ''
            }`}
          style={{ ...bgStyle(slide.background), fontFamily: slide.fontFamily }}
        >
          <h1
            className="font-bold mb-8 drop-shadow-lg"
            style={{
              fontSize: `${slide.titleSize || 60}px`,
              textAlign: slide.titleAlign || 'center'
            }}
          >
            {slide.title}
          </h1>

          {slide.layout === 'content' && slide.bulletPoints ? (
            <ul className="text-3xl space-y-4 max-w-4xl">
              {slide.bulletPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-4 opacity-0 animate-fade-in" style={{ animationDelay: `${idx * 0.15}s`, animationFillMode: 'forwards' }}>
                  <span className="text-white/70">&#x2022;</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          ) : slide.layout === 'two-column' && slide.bulletPoints ? (
            <div className="flex gap-12 max-w-6xl w-full">
              <ul className="flex-1 text-2xl space-y-3">
                {slide.bulletPoints.slice(0, Math.ceil(slide.bulletPoints.length / 2)).map((point, idx) => (
                  <li key={idx} className="flex items-start gap-4">
                    <span className="text-white/70">&#x2022;</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <div className="w-px bg-white/20" />
              <ul className="flex-1 text-2xl space-y-3">
                {slide.bulletPoints.slice(Math.ceil(slide.bulletPoints.length / 2)).map((point, idx) => (
                  <li key={idx} className="flex items-start gap-4">
                    <span className="text-white/70">&#x2022;</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : slide.layout === 'image' ? (
            <div className="flex gap-8 max-w-6xl w-full items-center">
              <div className="flex-1">
                <p className="text-2xl" style={{ fontSize: `${slide.contentSize || 24}px` }}>
                  {slide.content}
                </p>
              </div>
              <div className="flex-1 flex items-center justify-center">
                {slide.imageUrl ? (
                  <img src={slide.imageUrl} alt="Slide" className="max-w-full max-h-96 object-contain rounded-lg shadow-2xl" />
                ) : (
                  <div className="w-full h-64 border-4 border-dashed border-white/30 rounded-lg flex items-center justify-center">
                    <ImageIcon className="h-24 w-24 opacity-30" />
                  </div>
                )}
              </div>
            </div>
          ) : slide.layout === 'blank' ? (
            <div className="flex-1" />
          ) : (
            <p
              className="text-center max-w-4xl drop-shadow-md"
              style={{ fontSize: `${slide.contentSize || 32}px` }}
            >
              {slide.content}
            </p>
          )}

          {/* Shapes */}
          {slide.shapes?.map((shape, idx) => (
            <div
              key={idx}
              className="absolute pointer-events-none"
              style={{
                left: `${shape.x}%`,
                top: `${shape.y}%`,
                width: '80px',
                height: '80px',
                backgroundColor: shape.color,
                borderRadius: shape.type === 'circle' ? '50%' : '0',
                clipPath: shape.type === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none',
                opacity: 0.8
              }}
            />
          ))}
        </div>

        {/* Speaker Notes */}
        {showNotes && slide.notes && (
          <div className="p-4 bg-gray-900/95 text-white max-h-32 overflow-auto border-t border-white/10">
            <p className="text-sm font-mono">{slide.notes}</p>
          </div>
        )}

        {/* Controls - auto-hide */}
        <div className={`absolute bottom-0 left-0 right-0 transition-all duration-500 ${controlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'}`}>
          <div className="flex items-center justify-between p-4 bg-gradient-to-t from-black/90 to-transparent">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setCurrentSlide(Math.max(0, currentSlide - 1)); setAnimationKey(k => k + 1); }}
                disabled={currentSlide === 0}
                className="p-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-full backdrop-blur-sm transition-all"
              >
                <ChevronLeft className="h-5 w-5 text-white" />
              </button>
              <button
                onClick={() => { setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1)); setAnimationKey(k => k + 1); }}
                disabled={currentSlide === slides.length - 1}
                className="p-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-full backdrop-blur-sm transition-all"
              >
                <ChevronRight className="h-5 w-5 text-white" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              {/* Slide dots */}
              <div className="flex items-center gap-1.5">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setCurrentSlide(idx); setAnimationKey(k => k + 1); }}
                    className={`rounded-full transition-all ${currentSlide === idx
                      ? 'w-6 h-2 bg-white'
                      : 'w-2 h-2 bg-white/40 hover:bg-white/60'
                      }`}
                  />
                ))}
              </div>
              <span className="text-white/80 text-sm font-mono tabular-nums">
                {currentSlide + 1}/{slides.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-white/60 text-sm font-mono tabular-nums flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatTime(presentationTimer)}
              </span>
              <button onClick={() => setShowNotes(!showNotes)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-all">
                {showNotes ? <EyeOff className="h-4 w-4 text-white" /> : <Eye className="h-4 w-4 text-white" />}
              </button>
              <button onClick={toggleFullscreen} className="p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-all">
                {isFullscreen ? <Minimize2 className="h-4 w-4 text-white" /> : <Maximize2 className="h-4 w-4 text-white" />}
              </button>
              <button
                onClick={() => setIsPresenting(false)}
                className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full backdrop-blur-sm transition-all"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Keyboard shortcut hint - fades out */}
        <div className="absolute top-4 right-4 text-white/30 text-xs pointer-events-none animate-fade-in" style={{ animationDuration: '1s' }}>
          Arrow keys to navigate &middot; Esc to exit
        </div>
      </div>
    );
  }

  // ---------- EDITOR MODE ----------
  const currentSlideData = slides[currentSlide];

  return (
    <div className="h-full flex bg-gray-50 dark:bg-gray-900">
      {/* Hidden inputs */}
      <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={importPresentation} />
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

      {/* Slide Thumbnails Sidebar */}
      <div className="w-56 border-r dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto flex flex-col">
        <div className="p-2 border-b dark:border-gray-700">
          <Button onClick={() => addSlide('content')} className="w-full mb-2" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Slide
          </Button>
          <div className="grid grid-cols-2 gap-1">
            <Button onClick={() => addSlide('title')} variant="outline" size="sm" title="Title Slide">
              <Type className="h-4 w-4" />
            </Button>
            <Button onClick={() => addSlide('content')} variant="outline" size="sm" title="Content Slide">
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 p-2 overflow-y-auto">
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={handleDragEnd}
              onClick={() => setCurrentSlide(idx)}
              className={`relative mb-1.5 border-2 rounded-lg cursor-pointer group transition-all ${draggingIndex === idx ? 'opacity-40' : 'opacity-100'
                } ${dragOverIndex === idx
                  ? 'border-purple-500 shadow-lg shadow-purple-500/20'
                  : currentSlide === idx
                    ? 'border-blue-500 shadow-md ring-1 ring-blue-500/30'
                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                }`}
            >
              {/* Slide number badge */}
              <div className="absolute -top-1.5 -left-1.5 z-10 w-5 h-5 bg-gray-700 dark:bg-gray-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                {idx + 1}
              </div>

              {/* Drag handle */}
              <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-60 transition-opacity cursor-grab active:cursor-grabbing z-10">
                <GripVertical className="h-3 w-3 text-white drop-shadow" />
              </div>

              <div
                className="h-24 rounded-md flex flex-col items-center justify-center text-white text-xs font-semibold p-2 overflow-hidden"
                style={bgStyle(slide.background)}
              >
                <div className="text-center truncate w-full text-[11px] drop-shadow-sm">{slide.title}</div>
                {slide.layout === 'content' && slide.bulletPoints && (
                  <div className="mt-1 space-y-0.5 w-full px-2">
                    {slide.bulletPoints.slice(0, 2).map((bp, i) => (
                      <div key={i} className="text-[7px] text-white/70 truncate">&#x2022; {bp}</div>
                    ))}
                    {slide.bulletPoints.length > 2 && (
                      <div className="text-[7px] text-white/50">+{slide.bulletPoints.length - 2} more</div>
                    )}
                  </div>
                )}
                {slide.layout !== 'content' && slide.content && (
                  <div className="text-[8px] text-white/70 mt-1 truncate w-full text-center">{slide.content}</div>
                )}
              </div>

              {/* Action buttons */}
              <div className="absolute top-1 right-1 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                  onClick={(e) => { e.stopPropagation(); moveSlide(idx, 'up'); }}
                  disabled={idx === 0}
                  className="p-0.5 bg-gray-800/70 hover:bg-gray-700 disabled:opacity-30 text-white rounded backdrop-blur-sm"
                  title="Move up"
                >
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); moveSlide(idx, 'down'); }}
                  disabled={idx === slides.length - 1}
                  className="p-0.5 bg-gray-800/70 hover:bg-gray-700 disabled:opacity-30 text-white rounded backdrop-blur-sm"
                  title="Move down"
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); duplicateSlide(idx); }}
                  className="p-0.5 bg-blue-500/80 hover:bg-blue-600 text-white rounded backdrop-blur-sm"
                  title="Duplicate"
                >
                  <Copy className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteSlide(idx); }}
                  className="p-0.5 bg-red-500/80 hover:bg-red-600 text-white rounded backdrop-blur-sm"
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>

              {/* Transition indicator */}
              {slide.transition && slide.transition !== 'none' && (
                <div className="absolute bottom-1 right-1 text-[8px] text-white/50 bg-black/30 px-1 rounded">
                  {slide.transition}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Sidebar footer - slide count */}
        <div className="p-2 border-t dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 text-center">
          {slides.length} slide{slides.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="p-3 border-b dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
          <div className="flex items-center gap-2">
            <PresentationIcon className="h-5 w-5 text-purple-500" />
            <h2 className="font-semibold dark:text-white">PowerPoint Presentation</h2>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={undo} size="sm" variant="outline" title="Undo (Ctrl+Z)" disabled={historyIndex <= 0}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button onClick={redo} size="sm" variant="outline" title="Redo (Ctrl+Shift+Z)" disabled={historyIndex >= history.length - 1}>
              <RotateCw className="h-4 w-4" />
            </Button>
            <div className="w-px h-8 bg-gray-300 dark:bg-gray-600" />
            <Button onClick={() => fileInputRef.current?.click()} size="sm" variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button onClick={exportPresentation} size="sm" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              JSON
            </Button>
            <Button onClick={exportToPDF} size="sm" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button onClick={() => { setIsPresenting(true); setAnimationKey(0); }} size="sm" className="bg-green-500 hover:bg-green-600">
              <Play className="h-4 w-4 mr-2" />
              Present
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-3 mt-2 flex-shrink-0">
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="layouts">Layouts</TabsTrigger>
          </TabsList>

          {/* Edit Tab */}
          <TabsContent value="edit" className="flex-1 flex flex-col mt-0 data-[state=inactive]:hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-2 p-2 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-wrap">
              {/* Title size */}
              <div className="flex items-center gap-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">Title</label>
                <select
                  value={currentSlideData.titleSize || 48}
                  onChange={(e) => updateSlide(currentSlide, { titleSize: parseInt(e.target.value) })}
                  className="px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
                >
                  <option value="24">24px</option>
                  <option value="32">32px</option>
                  <option value="48">48px</option>
                  <option value="60">60px</option>
                  <option value="72">72px</option>
                </select>
              </div>

              {/* Content size */}
              <div className="flex items-center gap-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">Body</label>
                <select
                  value={currentSlideData.contentSize || 20}
                  onChange={(e) => updateSlide(currentSlide, { contentSize: parseInt(e.target.value) })}
                  className="px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
                >
                  <option value="14">14px</option>
                  <option value="18">18px</option>
                  <option value="20">20px</option>
                  <option value="24">24px</option>
                  <option value="32">32px</option>
                  <option value="40">40px</option>
                </select>
              </div>

              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

              {/* Font family */}
              <select
                value={currentSlideData.fontFamily || FONT_FAMILIES[0].value}
                onChange={(e) => updateSlide(currentSlide, { fontFamily: e.target.value })}
                className="px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
              >
                {FONT_FAMILIES.map(f => (
                  <option key={f.label} value={f.value}>{f.label}</option>
                ))}
              </select>

              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

              {/* Alignment */}
              <Button onClick={() => updateSlide(currentSlide, { titleAlign: 'left', contentAlign: 'left' })} size="sm" variant={currentSlideData.titleAlign === 'left' ? 'default' : 'outline'} title="Align Left">
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button onClick={() => updateSlide(currentSlide, { titleAlign: 'center', contentAlign: 'center' })} size="sm" variant={currentSlideData.titleAlign === 'center' ? 'default' : 'outline'} title="Align Center">
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button onClick={() => updateSlide(currentSlide, { titleAlign: 'right', contentAlign: 'right' })} size="sm" variant={currentSlideData.titleAlign === 'right' ? 'default' : 'outline'} title="Align Right">
                <AlignRight className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

              {/* Background color */}
              <div className="flex items-center gap-1">
                <Palette className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <input
                  type="color"
                  value={isGradient(currentSlideData.background) ? '#6366f1' : currentSlideData.background}
                  onChange={(e) => updateSlide(currentSlide, { background: e.target.value })}
                  className="w-8 h-7 rounded cursor-pointer border dark:border-gray-600"
                  title="Background Color"
                />
              </div>

              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

              {/* Transition */}
              <select
                value={currentSlideData.transition || 'none'}
                onChange={(e) => updateSlide(currentSlide, { transition: e.target.value as Slide['transition'] })}
                className="px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
                title="Transition"
              >
                <option value="none">No Transition</option>
                <option value="fade">Fade</option>
                <option value="slide">Slide</option>
                <option value="zoom">Zoom</option>
              </select>

              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

              {/* Shapes */}
              <Button onClick={() => addShape('rectangle')} size="sm" variant="outline" title="Add Rectangle">
                <Shapes className="h-4 w-4" />
              </Button>
              <Button onClick={() => addShape('circle')} size="sm" variant="outline" title="Add Circle">
                &#9675;
              </Button>
              <Button onClick={() => addShape('triangle')} size="sm" variant="outline" title="Add Triangle">
                &#9651;
              </Button>

              {(currentSlideData.layout === 'content' || currentSlideData.layout === 'two-column') && (
                <>
                  <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
                  <Button onClick={addBulletPoint} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Bullet
                  </Button>
                </>
              )}

              {currentSlideData.layout === 'image' && (
                <>
                  <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
                  <Button onClick={() => imageInputRef.current?.click()} size="sm" variant="outline">
                    <ImageIcon className="h-4 w-4 mr-1" />
                    Upload Image
                  </Button>
                </>
              )}
            </div>

            {/* Slide Canvas */}
            <div className="flex-1 p-6 overflow-auto bg-gray-100 dark:bg-gray-900">
              <div
                className="max-w-5xl mx-auto aspect-video rounded-lg shadow-2xl p-10 flex flex-col relative overflow-hidden"
                style={{ ...bgStyle(currentSlideData.background), fontFamily: currentSlideData.fontFamily }}
              >
                {/* Title */}
                <input
                  type="text"
                  value={currentSlideData.title}
                  onChange={(e) => updateSlide(currentSlide, { title: e.target.value })}
                  className="font-bold text-white bg-transparent border-2 border-transparent hover:border-white/30 focus:border-white/60 outline-none px-4 py-2 rounded-lg mb-4 transition-colors"
                  style={{
                    fontSize: `${(currentSlideData.titleSize || 48) * 0.6}px`,
                    textAlign: currentSlideData.titleAlign || 'left'
                  }}
                  placeholder="Slide Title"
                />

                {/* Content based on layout */}
                {currentSlideData.layout === 'title' && (
                  <textarea
                    value={currentSlideData.content}
                    onChange={(e) => updateSlide(currentSlide, { content: e.target.value })}
                    className="text-white bg-transparent border-2 border-transparent hover:border-white/30 focus:border-white/60 outline-none px-4 py-2 rounded-lg resize-none flex-1 transition-colors"
                    style={{
                      fontSize: `${(currentSlideData.contentSize || 24) * 0.6}px`,
                      textAlign: currentSlideData.contentAlign || 'center'
                    }}
                    placeholder="Subtitle or content"
                  />
                )}

                {currentSlideData.layout === 'content' && (
                  <div className="flex-1 space-y-2">
                    {currentSlideData.bulletPoints?.map((point, idx) => (
                      <div key={idx} className="flex items-center gap-2 group">
                        <span className="text-white/70 text-lg">&#x2022;</span>
                        <input
                          type="text"
                          value={point}
                          onChange={(e) => updateBulletPoint(idx, e.target.value)}
                          className="flex-1 text-white bg-transparent border-2 border-transparent hover:border-white/30 focus:border-white/60 outline-none px-3 py-1.5 rounded-lg transition-colors"
                          style={{ fontSize: `${(currentSlideData.contentSize || 20) * 0.6}px` }}
                          placeholder="Bullet point"
                        />
                        <button
                          onClick={() => deleteBulletPoint(idx)}
                          className="opacity-0 group-hover:opacity-100 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded transition-opacity"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {currentSlideData.layout === 'two-column' && (
                  <div className="flex-1 flex gap-4">
                    <div className="flex-1 space-y-2">
                      <h4 className="text-white/80 text-sm font-semibold mb-2 uppercase tracking-wider">Left Column</h4>
                      {currentSlideData.bulletPoints?.slice(0, Math.ceil((currentSlideData.bulletPoints?.length || 0) / 2)).map((point, idx) => (
                        <div key={idx} className="flex items-center gap-2 group">
                          <span className="text-white/70 text-lg">&#x2022;</span>
                          <input
                            type="text"
                            value={point}
                            onChange={(e) => updateBulletPoint(idx, e.target.value)}
                            className="flex-1 text-white bg-transparent border-2 border-transparent hover:border-white/30 focus:border-white/60 outline-none px-3 py-1.5 rounded-lg transition-colors"
                            style={{ fontSize: `${(currentSlideData.contentSize || 20) * 0.55}px` }}
                            placeholder="Bullet point"
                          />
                          <button
                            onClick={() => deleteBulletPoint(idx)}
                            className="opacity-0 group-hover:opacity-100 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded transition-opacity"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="w-px bg-white/20" />
                    <div className="flex-1 space-y-2">
                      <h4 className="text-white/80 text-sm font-semibold mb-2 uppercase tracking-wider">Right Column</h4>
                      {currentSlideData.bulletPoints?.slice(Math.ceil((currentSlideData.bulletPoints?.length || 0) / 2)).map((point, idx) => {
                        const actualIdx = idx + Math.ceil((currentSlideData.bulletPoints?.length || 0) / 2);
                        return (
                          <div key={actualIdx} className="flex items-center gap-2 group">
                            <span className="text-white/70 text-lg">&#x2022;</span>
                            <input
                              type="text"
                              value={point}
                              onChange={(e) => updateBulletPoint(actualIdx, e.target.value)}
                              className="flex-1 text-white bg-transparent border-2 border-transparent hover:border-white/30 focus:border-white/60 outline-none px-3 py-1.5 rounded-lg transition-colors"
                              style={{ fontSize: `${(currentSlideData.contentSize || 20) * 0.55}px` }}
                              placeholder="Bullet point"
                            />
                            <button
                              onClick={() => deleteBulletPoint(actualIdx)}
                              className="opacity-0 group-hover:opacity-100 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded transition-opacity"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {currentSlideData.layout === 'image' && (
                  <div className="flex-1 flex gap-4">
                    <div className="flex-1">
                      <textarea
                        value={currentSlideData.content}
                        onChange={(e) => updateSlide(currentSlide, { content: e.target.value })}
                        className="w-full h-full text-white bg-transparent border-2 border-transparent hover:border-white/30 focus:border-white/60 outline-none px-4 py-2 rounded-lg resize-none transition-colors"
                        style={{
                          fontSize: `${(currentSlideData.contentSize || 20) * 0.6}px`,
                          textAlign: currentSlideData.contentAlign || 'left'
                        }}
                        placeholder="Add description or content..."
                      />
                    </div>
                    <div
                      className="flex-1 border-2 border-dashed border-white/30 rounded-lg flex items-center justify-center cursor-pointer hover:border-white/60 transition-colors group"
                      onClick={() => imageInputRef.current?.click()}
                    >
                      {currentSlideData.imageUrl ? (
                        <div className="relative w-full h-full p-2">
                          <img src={currentSlideData.imageUrl} alt="Slide" className="w-full h-full object-contain rounded" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                            <span className="text-white text-sm font-medium">Click to replace</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-white/50 group-hover:text-white/80 transition-colors">
                          <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                          <p className="text-sm font-medium">Click to upload image</p>
                          <p className="text-xs mt-1">Supports JPG, PNG, GIF, SVG</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {currentSlideData.layout === 'blank' && (
                  <div className="flex-1 flex items-center justify-center text-white/30">
                    <p className="text-sm">Blank slide - use shapes and styles to customize</p>
                  </div>
                )}

                {/* Shapes */}
                {currentSlideData.shapes?.map((shape, idx) => (
                  <div
                    key={idx}
                    className="absolute cursor-move hover:ring-2 hover:ring-white/50 transition-shadow"
                    style={{
                      left: `${shape.x}%`,
                      top: `${shape.y}%`,
                      width: '50px',
                      height: '50px',
                      backgroundColor: shape.color,
                      borderRadius: shape.type === 'circle' ? '50%' : '0',
                      clipPath: shape.type === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none'
                    }}
                  />
                ))}

                {/* Slide number overlay */}
                <div className="absolute bottom-2 right-3 text-white/30 text-xs font-mono">
                  {currentSlide + 1}/{slides.length}
                </div>
              </div>

              {/* Speaker Notes */}
              <div className="max-w-5xl mx-auto mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold dark:text-white text-sm flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5 text-gray-500" />
                    Speaker Notes
                  </h4>
                  <span className="text-xs text-gray-400">{(currentSlideData.notes || '').length} chars</span>
                </div>
                <textarea
                  value={currentSlideData.notes || ''}
                  onChange={(e) => updateSlide(currentSlide, { notes: e.target.value })}
                  className="w-full p-2 border rounded-lg text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 resize-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                  rows={3}
                  placeholder="Add notes for this slide... (visible only to presenter)"
                />
              </div>
            </div>
          </TabsContent>

          {/* Design Tab */}
          <TabsContent value="design" className="flex-1 overflow-auto mt-0 bg-white dark:bg-gray-900 data-[state=inactive]:hidden">
            <div className="p-6 max-w-4xl mx-auto min-h-full">
              <h3 className="text-lg font-bold mb-4 dark:text-white">Solid Themes</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {PRESET_THEMES.map((theme, idx) => (
                  <div
                    key={idx}
                    onClick={() => applyTheme(theme.colors)}
                    className="p-4 border-2 rounded-lg cursor-pointer hover:border-purple-500 hover:shadow-lg transition-all dark:border-gray-700 group"
                  >
                    <div className="flex gap-2 mb-3">
                      {theme.colors.map((color, i) => (
                        <div key={i} className="flex-1 h-14 rounded-md shadow-inner group-hover:scale-105 transition-transform" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                    <h4 className="font-bold text-center dark:text-white text-sm">{theme.name}</h4>
                  </div>
                ))}
              </div>

              <h3 className="text-lg font-bold mb-4 mt-8 dark:text-white">Gradient Themes</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {GRADIENT_THEMES.map((theme, idx) => (
                  <div
                    key={idx}
                    onClick={() => applyTheme(theme.colors)}
                    className="p-4 border-2 rounded-lg cursor-pointer hover:border-purple-500 hover:shadow-lg transition-all dark:border-gray-700 group"
                  >
                    <div className="flex gap-2 mb-3">
                      {theme.colors.map((color, i) => (
                        <div key={i} className="flex-1 h-14 rounded-md shadow-inner group-hover:scale-105 transition-transform" style={{ background: color }} />
                      ))}
                    </div>
                    <h4 className="font-bold text-center dark:text-white text-sm">{theme.name}</h4>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl">
                <h4 className="font-bold mb-3 dark:text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Design Tips
                </h4>
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

          {/* Layouts Tab */}
          <TabsContent value="layouts" className="flex-1 overflow-auto mt-0 bg-white dark:bg-gray-900 data-[state=inactive]:hidden">
            <div className="p-6 max-w-4xl mx-auto min-h-full">
              <h3 className="text-lg font-bold mb-4 dark:text-white">Slide Layouts</h3>

              <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 text-sm dark:text-gray-300">
                Click <strong>Apply</strong> to change the current slide's layout, or <strong>Add</strong> to create a new slide.
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { type: 'title' as const, name: 'Title Slide', desc: 'Large title with subtitle', icon: Type },
                  { type: 'content' as const, name: 'Content', desc: 'Title with bullet points', icon: List },
                  { type: 'two-column' as const, name: 'Two Column', desc: 'Split content layout', icon: Layout },
                  { type: 'image' as const, name: 'Image', desc: 'Title with image', icon: ImageIcon },
                  { type: 'blank' as const, name: 'Blank', desc: 'Empty slide', icon: Shapes }
                ].map((layout, idx) => {
                  const Icon = layout.icon;
                  return (
                    <div
                      key={idx}
                      className={`p-5 border-2 rounded-xl transition-all ${currentSlideData.layout === layout.type
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg shadow-purple-500/10'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-400 hover:shadow-md'
                        }`}
                    >
                      <div className="text-center mb-4">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <h4 className="font-bold mb-1 dark:text-white">{layout.name}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{layout.desc}</p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            updateSlide(currentSlide, {
                              layout: layout.type,
                              bulletPoints: (layout.type === 'content' || layout.type === 'two-column')
                                ? (currentSlideData.bulletPoints || ['Point 1', 'Point 2', 'Point 3', 'Point 4'])
                                : undefined
                            });
                            setActiveTab('edit');
                          }}
                          size="sm"
                          variant="outline"
                          className="flex-1"
                        >
                          Apply
                        </Button>
                        <Button
                          onClick={() => {
                            addSlide(layout.type);
                            setActiveTab('edit');
                          }}
                          size="sm"
                          className="flex-1 bg-purple-600 hover:bg-purple-700"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Layout Preview Section */}
              <div className="mt-8 p-5 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                <h4 className="font-bold text-base mb-3 dark:text-white">Current Slide</h4>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    {(() => {
                      const icons: Record<string, typeof Type> = { title: Type, content: List, 'two-column': Layout, image: ImageIcon, blank: Shapes };
                      const Icon = icons[currentSlideData.layout] || Type;
                      return <Icon className="h-5 w-5 text-white" />;
                    })()}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold dark:text-white capitalize text-sm">
                      {currentSlideData.layout.replace('-', ' ')} Layout
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Slide {currentSlide + 1} of {slides.length}
                    </p>
                  </div>
                  <Button
                    onClick={() => setActiveTab('edit')}
                    size="sm"
                    variant="outline"
                  >
                    Edit Slide
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
