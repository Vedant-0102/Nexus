import React, { useState, useRef } from 'react';
import { Presentation as PresentationIcon, Plus, Trash2, Play, ChevronLeft, ChevronRight, Download, Upload, Copy, Image as ImageIcon, Type, Layout, Palette, AlignLeft, AlignCenter, AlignRight, Bold, Italic, List, ListOrdered, Sparkles, Maximize2, Minimize2, Video, Music, FileImage, Shapes } from 'lucide-react';
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
}

export const Presentation: React.FC = () => {
  const [slides, setSlides] = useState<Slide[]>([
    { id: '1', title: 'Welcome', content: 'My Presentation', background: '#3b82f6', layout: 'title', titleSize: 60, contentSize: 24, titleAlign: 'center', contentAlign: 'center', notes: '', transition: 'fade' },
    { id: '2', title: 'Agenda', content: '', background: '#8b5cf6', layout: 'content', bulletPoints: ['Introduction', 'Main Topics', 'Conclusion'], titleSize: 48, contentSize: 20, titleAlign: 'left', contentAlign: 'left', notes: '', transition: 'slide' },
    { id: '3', title: 'Thank You', content: 'Questions?', background: '#10b981', layout: 'title', titleSize: 60, contentSize: 32, titleAlign: 'center', contentAlign: 'center', notes: '', transition: 'zoom' }
  ]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);
  const [activeTab, setActiveTab] = useState('edit');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const presentationRef = useRef<HTMLDivElement>(null);

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
      transition: 'fade'
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
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`
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

  const exportToPDF = () => {
    // Create a simple PDF-like HTML export
    const pdfContent = slides.map((slide, idx) => `
      <div style="page-break-after: always; width: 100%; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; background: ${slide.background}; color: white; padding: 40px;">
        <h1 style="font-size: ${slide.titleSize || 48}px; text-align: ${slide.titleAlign || 'center'}; margin-bottom: 20px;">${slide.title}</h1>
        ${slide.layout === 'content' && slide.bulletPoints ? 
          `<ul style="font-size: ${slide.contentSize || 20}px; list-style: none; padding: 0;">
            ${slide.bulletPoints.map(point => `<li style="margin: 10px 0;">• ${point}</li>`).join('')}
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
    
    // Open print dialog for PDF
    const printWindow = window.open(url);
    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };
    }
  };
  
  const presetThemes = [
    { name: 'Ocean', colors: ['#0EA5E9', '#0284C7', '#0369A1'] },
    { name: 'Forest', colors: ['#10B981', '#059669', '#047857'] },
    { name: 'Sunset', colors: ['#F97316', '#EA580C', '#C2410C'] },
    { name: 'Purple', colors: ['#8B5CF6', '#7C3AED', '#6D28D9'] },
    { name: 'Pink', colors: ['#EC4899', '#DB2777', '#BE185D'] },
    { name: 'Dark', colors: ['#1E293B', '#0F172A', '#020617'] }
  ];
  
  const applyTheme = (colors: string[]) => {
    const newSlides = slides.map((slide, idx) => ({
      ...slide,
      background: colors[idx % colors.length]
    }));
    setSlides(newSlides);
  };

  if (isPresenting) {
    const slide = slides[currentSlide];
    return (
      <div ref={presentationRef} className="h-full flex flex-col bg-black">
        <div
          className={`flex-1 flex flex-col items-center justify-center p-12 text-white transition-all duration-500 ${
            slide.transition === 'fade' ? 'animate-fade-in' :
            slide.transition === 'slide' ? 'animate-slide-in' :
            slide.transition === 'zoom' ? 'animate-zoom-in' : ''
          }`}
          style={{ background: slide.background }}
        >
          <h1 
            className="font-bold mb-8"
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
                <li key={idx} className="flex items-start gap-4">
                  <span>•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          ) : slide.layout === 'two-column' && slide.bulletPoints ? (
            <div className="flex gap-12 max-w-6xl w-full">
              <ul className="flex-1 text-2xl space-y-3">
                {slide.bulletPoints.slice(0, Math.ceil(slide.bulletPoints.length / 2)).map((point, idx) => (
                  <li key={idx} className="flex items-start gap-4">
                    <span>•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <ul className="flex-1 text-2xl space-y-3">
                {slide.bulletPoints.slice(Math.ceil(slide.bulletPoints.length / 2)).map((point, idx) => (
                  <li key={idx} className="flex items-start gap-4">
                    <span>•</span>
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
                  <img src={slide.imageUrl} alt="Slide" className="max-w-full max-h-96 object-contain rounded-lg" />
                ) : (
                  <div className="w-full h-64 border-4 border-dashed border-white/50 rounded-lg flex items-center justify-center">
                    <ImageIcon className="h-24 w-24 opacity-50" />
                  </div>
                )}
              </div>
            </div>
          ) : slide.layout === 'blank' ? (
            <div className="flex-1" />
          ) : (
            <p 
              className="text-center max-w-4xl"
              style={{ fontSize: `${slide.contentSize || 32}px` }}
            >
              {slide.content}
            </p>
          )}
          
          {slide.shapes?.map((shape, idx) => (
            <div
              key={idx}
              className="absolute"
              style={{
                left: `${shape.x}%`,
                top: `${shape.y}%`,
                width: '80px',
                height: '80px',
                backgroundColor: shape.color,
                borderRadius: shape.type === 'circle' ? '50%' : '0',
                clipPath: shape.type === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none'
              }}
            />
          ))}
        </div>
        
        {showNotes && slide.notes && (
          <div className="p-4 bg-gray-800 text-white max-h-32 overflow-auto">
            <p className="text-sm">{slide.notes}</p>
          </div>
        )}
        
        <div className="flex items-center justify-between p-4 bg-gray-900">
          <button
            onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
            disabled={currentSlide === 0}
            className="p-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          
          <div className="flex items-center gap-4">
            <span className="text-white">
              {currentSlide + 1} / {slides.length}
            </span>
            <Button onClick={() => setShowNotes(!showNotes)} size="sm" variant="outline">
              {showNotes ? 'Hide' : 'Show'} Notes
            </Button>
            <Button onClick={toggleFullscreen} size="sm" variant="outline">
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
          
          <button
            onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
            disabled={currentSlide === slides.length - 1}
            className="p-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
          
          <button
            onClick={() => setIsPresenting(false)}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
          >
            Exit
          </button>
        </div>
      </div>
    );
  }

  const currentSlideData = slides[currentSlide];

  return (
    <div className="h-full flex bg-gray-50 dark:bg-gray-900">
      {/* Slide Thumbnails Sidebar */}
      <div className="w-56 border-r dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto flex flex-col">
        <div className="p-2 border-b dark:border-gray-700">
          <div className="relative">
            <Button onClick={() => addSlide('content')} className="w-full mb-2" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Slide
            </Button>
            <div className="grid grid-cols-2 gap-1 mb-2">
              <Button onClick={() => addSlide('title')} variant="outline" size="sm" title="Title Slide">
                <Type className="h-4 w-4" />
              </Button>
              <Button onClick={() => addSlide('content')} variant="outline" size="sm" title="Content Slide">
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-2 overflow-y-auto">
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              onClick={() => setCurrentSlide(idx)}
              className={`relative mb-2 p-2 border-2 rounded cursor-pointer group ${
                currentSlide === idx
                  ? 'border-blue-500 shadow-lg'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
              }`}
            >
              <div
                className="h-24 rounded flex flex-col items-center justify-center text-white text-xs font-semibold p-2"
                style={{ background: slide.background }}
              >
                <div className="text-center truncate w-full">{slide.title}</div>
                <div className="text-xs opacity-75 mt-1">{idx + 1}</div>
              </div>
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateSlide(idx);
                  }}
                  className="p-1 bg-blue-500 hover:bg-blue-600 text-white rounded"
                  title="Duplicate"
                >
                  <Copy className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSlide(idx);
                  }}
                  className="p-1 bg-red-500 hover:bg-red-600 text-white rounded"
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-3 border-b dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
          <div className="flex items-center gap-2">
            <PresentationIcon className="h-5 w-5 text-purple-500" />
            <h2 className="font-semibold dark:text-white">PowerPoint Presentation</h2>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportPresentation} size="sm" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              JSON
            </Button>
            <Button onClick={exportToPDF} size="sm" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button onClick={() => setIsPresenting(true)} size="sm" className="bg-green-500 hover:bg-green-600">
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
              <select
                value={currentSlideData.titleSize || 48}
                onChange={(e) => updateSlide(currentSlide, { titleSize: parseInt(e.target.value) })}
                className="px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:text-white"
              >
                <option value="24">24px</option>
                <option value="32">32px</option>
                <option value="48">48px</option>
                <option value="60">60px</option>
                <option value="72">72px</option>
              </select>
              
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
              
              <Button onClick={() => updateSlide(currentSlide, { titleAlign: 'left' })} size="sm" variant="outline" title="Align Left">
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button onClick={() => updateSlide(currentSlide, { titleAlign: 'center' })} size="sm" variant="outline" title="Align Center">
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button onClick={() => updateSlide(currentSlide, { titleAlign: 'right' })} size="sm" variant="outline" title="Align Right">
                <AlignRight className="h-4 w-4" />
              </Button>
              
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
              
              <input
                type="color"
                value={currentSlideData.background}
                onChange={(e) => updateSlide(currentSlide, { background: e.target.value })}
                className="w-10 h-8 rounded cursor-pointer"
                title="Background Color"
              />
              
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
              
              <select
                value={currentSlideData.transition || 'none'}
                onChange={(e) => updateSlide(currentSlide, { transition: e.target.value as Slide['transition'] })}
                className="px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:text-white"
                title="Transition"
              >
                <option value="none">No Transition</option>
                <option value="fade">Fade</option>
                <option value="slide">Slide</option>
                <option value="zoom">Zoom</option>
              </select>
              
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
              
              <Button onClick={() => addShape('rectangle')} size="sm" variant="outline" title="Add Rectangle">
                <Shapes className="h-4 w-4" />
              </Button>
              <Button onClick={() => addShape('circle')} size="sm" variant="outline" title="Add Circle">
                ○
              </Button>
              <Button onClick={() => addShape('triangle')} size="sm" variant="outline" title="Add Triangle">
                △
              </Button>
              
              {(currentSlideData.layout === 'content' || currentSlideData.layout === 'two-column') && (
                <>
                  <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
                  <Button onClick={addBulletPoint} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Bullet
                  </Button>
                </>
              )}
            </div>
            
            {/* Slide Canvas */}
            <div className="flex-1 p-8 overflow-auto bg-gray-100 dark:bg-gray-900">
              <div
                className="max-w-5xl mx-auto aspect-video rounded-lg shadow-2xl p-12 flex flex-col relative"
                style={{ background: currentSlideData.background }}
              >
                {/* Title */}
                <input
                  type="text"
                  value={currentSlideData.title}
                  onChange={(e) => updateSlide(currentSlide, { title: e.target.value })}
                  className="font-bold text-white bg-transparent border-2 border-transparent hover:border-white focus:border-white outline-none px-4 py-2 rounded mb-6"
                  style={{
                    fontSize: `${currentSlideData.titleSize || 48}px`,
                    textAlign: currentSlideData.titleAlign || 'left'
                  }}
                  placeholder="Slide Title"
                />
                
                {/* Content based on layout */}
                {currentSlideData.layout === 'title' && (
                  <textarea
                    value={currentSlideData.content}
                    onChange={(e) => updateSlide(currentSlide, { content: e.target.value })}
                    className="text-white bg-transparent border-2 border-transparent hover:border-white focus:border-white outline-none px-4 py-2 rounded resize-none flex-1"
                    style={{
                      fontSize: `${currentSlideData.contentSize || 24}px`,
                      textAlign: currentSlideData.contentAlign || 'center'
                    }}
                    placeholder="Subtitle or content"
                  />
                )}
                
                {currentSlideData.layout === 'content' && (
                  <div className="flex-1 space-y-3">
                    {currentSlideData.bulletPoints?.map((point, idx) => (
                      <div key={idx} className="flex items-center gap-3 group">
                        <span className="text-white text-2xl">•</span>
                        <input
                          type="text"
                          value={point}
                          onChange={(e) => updateBulletPoint(idx, e.target.value)}
                          className="flex-1 text-white bg-transparent border-2 border-transparent hover:border-white focus:border-white outline-none px-3 py-2 rounded text-xl"
                          placeholder="Bullet point"
                        />
                        <button
                          onClick={() => deleteBulletPoint(idx)}
                          className="opacity-0 group-hover:opacity-100 p-1 bg-red-500 hover:bg-red-600 text-white rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {currentSlideData.layout === 'two-column' && (
                  <div className="flex-1 flex gap-6">
                    <div className="flex-1 space-y-3">
                      <h4 className="text-white text-xl font-semibold mb-3">Left Column</h4>
                      {currentSlideData.bulletPoints?.slice(0, Math.ceil((currentSlideData.bulletPoints?.length || 0) / 2)).map((point, idx) => (
                        <div key={idx} className="flex items-center gap-3 group">
                          <span className="text-white text-2xl">•</span>
                          <input
                            type="text"
                            value={point}
                            onChange={(e) => updateBulletPoint(idx, e.target.value)}
                            className="flex-1 text-white bg-transparent border-2 border-transparent hover:border-white focus:border-white outline-none px-3 py-2 rounded text-lg"
                            placeholder="Bullet point"
                          />
                          <button
                            onClick={() => deleteBulletPoint(idx)}
                            className="opacity-0 group-hover:opacity-100 p-1 bg-red-500 hover:bg-red-600 text-white rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex-1 space-y-3">
                      <h4 className="text-white text-xl font-semibold mb-3">Right Column</h4>
                      {currentSlideData.bulletPoints?.slice(Math.ceil((currentSlideData.bulletPoints?.length || 0) / 2)).map((point, idx) => {
                        const actualIdx = idx + Math.ceil((currentSlideData.bulletPoints?.length || 0) / 2);
                        return (
                          <div key={actualIdx} className="flex items-center gap-3 group">
                            <span className="text-white text-2xl">•</span>
                            <input
                              type="text"
                              value={point}
                              onChange={(e) => updateBulletPoint(actualIdx, e.target.value)}
                              className="flex-1 text-white bg-transparent border-2 border-transparent hover:border-white focus:border-white outline-none px-3 py-2 rounded text-lg"
                              placeholder="Bullet point"
                            />
                            <button
                              onClick={() => deleteBulletPoint(actualIdx)}
                              className="opacity-0 group-hover:opacity-100 p-1 bg-red-500 hover:bg-red-600 text-white rounded"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {currentSlideData.layout === 'image' && (
                  <div className="flex-1 flex gap-6">
                    <div className="flex-1">
                      <textarea
                        value={currentSlideData.content}
                        onChange={(e) => updateSlide(currentSlide, { content: e.target.value })}
                        className="w-full h-full text-white bg-transparent border-2 border-transparent hover:border-white focus:border-white outline-none px-4 py-2 rounded resize-none"
                        style={{
                          fontSize: `${currentSlideData.contentSize || 20}px`,
                          textAlign: currentSlideData.contentAlign || 'left'
                        }}
                        placeholder="Add description or content..."
                      />
                    </div>
                    <div className="flex-1 border-2 border-dashed border-white/50 rounded-lg flex items-center justify-center">
                      {currentSlideData.imageUrl ? (
                        <img src={currentSlideData.imageUrl} alt="Slide" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <div className="text-center text-white/70">
                          <ImageIcon className="h-16 w-16 mx-auto mb-2" />
                          <p className="text-sm">Image placeholder</p>
                          <p className="text-xs mt-1">Click to add image</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {currentSlideData.layout === 'blank' && (
                  <div className="flex-1 flex items-center justify-center text-white opacity-50">
                    <p>Blank slide - Add your own content</p>
                  </div>
                )}
                
                {/* Shapes */}
                {currentSlideData.shapes?.map((shape, idx) => (
                  <div
                    key={idx}
                    className="absolute cursor-move"
                    style={{
                      left: `${shape.x}%`,
                      top: `${shape.y}%`,
                      width: '60px',
                      height: '60px',
                      backgroundColor: shape.color,
                      borderRadius: shape.type === 'circle' ? '50%' : '0',
                      clipPath: shape.type === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none'
                    }}
                  />
                ))}
              </div>
              
              {/* Speaker Notes */}
              <div className="max-w-5xl mx-auto mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                <h4 className="font-bold mb-2 dark:text-white text-sm">Speaker Notes</h4>
                <textarea
                  value={currentSlideData.notes || ''}
                  onChange={(e) => updateSlide(currentSlide, { notes: e.target.value })}
                  className="w-full p-2 border rounded text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 resize-none"
                  rows={3}
                  placeholder="Add notes for this slide..."
                />
              </div>
            </div>
          </TabsContent>
          
          {/* Design Tab */}
          <TabsContent value="design" className="flex-1 overflow-auto mt-0 bg-white dark:bg-gray-900 data-[state=inactive]:hidden">
            <div className="p-6 max-w-4xl mx-auto min-h-full">
              <h3 className="text-lg font-bold mb-4 dark:text-white">Themes</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {presetThemes.map((theme, idx) => (
                  <div
                    key={idx}
                    onClick={() => applyTheme(theme.colors)}
                    className="p-4 border-2 rounded-lg cursor-pointer hover:border-purple-500 transition-all dark:border-gray-700"
                  >
                    <div className="flex gap-2 mb-3">
                      {theme.colors.map((color, i) => (
                        <div key={i} className="flex-1 h-16 rounded" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                    <h4 className="font-bold text-center dark:text-white">{theme.name}</h4>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 p-6 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-lg">
                <h4 className="font-bold mb-3 dark:text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Design Tips
                </h4>
                <ul className="text-sm space-y-2 dark:text-gray-300">
                  <li>• Use consistent colors throughout your presentation</li>
                  <li>• Keep text readable with high contrast</li>
                  <li>• Limit bullet points to 5-7 per slide</li>
                  <li>• Use large fonts (minimum 24px for body text)</li>
                  <li>• Add visual elements to break up text</li>
                </ul>
              </div>
            </div>
          </TabsContent>
          
          {/* Layouts Tab */}
          <TabsContent value="layouts" className="flex-1 overflow-auto mt-0 bg-white dark:bg-gray-900 data-[state=inactive]:hidden">
            <div className="p-6 max-w-4xl mx-auto min-h-full">
              <h3 className="text-lg font-bold mb-4 dark:text-white">Slide Layouts</h3>
              
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                <p className="text-sm dark:text-gray-300">
                  💡 <strong>Tip:</strong> Click a layout to apply it to the current slide, or click "Add New Slide" to create a new slide with that layout.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { type: 'title' as const, name: 'Title Slide', desc: 'Large title with subtitle', icon: '📄' },
                  { type: 'content' as const, name: 'Content', desc: 'Title with bullet points', icon: '📝' },
                  { type: 'two-column' as const, name: 'Two Column', desc: 'Split content layout', icon: '📊' },
                  { type: 'image' as const, name: 'Image', desc: 'Title with image', icon: '🖼️' },
                  { type: 'blank' as const, name: 'Blank', desc: 'Empty slide', icon: '⬜' }
                ].map((layout, idx) => (
                  <div
                    key={idx}
                    className={`p-6 border-2 rounded-lg transition-all dark:border-gray-700 ${
                      currentSlideData.layout === layout.type 
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg' 
                        : 'border-gray-300 hover:border-purple-400 hover:shadow-md'
                    }`}
                  >
                    <div className="text-center mb-4">
                      <div className="text-5xl mb-3">{layout.icon}</div>
                      <h4 className="font-bold mb-2 dark:text-white">{layout.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{layout.desc}</p>
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
                ))}
              </div>

              {/* Layout Preview Section */}
              <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800">
                <h4 className="font-bold text-lg mb-4 dark:text-white">Current Slide Layout</h4>
                <div className="flex items-center gap-4">
                  <div className="text-4xl">
                    {currentSlideData.layout === 'title' && '📄'}
                    {currentSlideData.layout === 'content' && '📝'}
                    {currentSlideData.layout === 'two-column' && '📊'}
                    {currentSlideData.layout === 'image' && '🖼️'}
                    {currentSlideData.layout === 'blank' && '⬜'}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold dark:text-white capitalize">
                      {currentSlideData.layout.replace('-', ' ')} Layout
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
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
