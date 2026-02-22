import React, { useRef, useCallback, useEffect } from 'react';
import { FilterType } from './types';
import { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT } from './constants';
import { floodFill, applyImageFilter, createCanvas } from './utils';
import { useCanvasHistory, useLayers, useImageTools, useCanvasView } from './hooks';
import {
  MenuBar, Toolbar, ToolProperties, FilterPanel,
  LayerPanel, CanvasArea, StatusBar, ResizeDialog, ExportDialog,
} from './components';

export const ImageEditor: React.FC = () => {
  const layerState = useLayers();
  const tools = useImageTools();
  const view = useCanvasView();
  const history = useCanvasHistory(layerState.layers, layerState.activeLayerId);

  const displayRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize first layer
  useEffect(() => {
    layerState.initLayers(DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT);
    previewCanvasRef.current = createCanvas(DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Composite layers and render to display canvas
  const composite = useCallback(() => {
    const display = displayRef.current;
    if (!display || layerState.layers.length === 0) return;
    display.width = layerState.canvasW;
    display.height = layerState.canvasH;
    const ctx = display.getContext('2d')!;
    ctx.clearRect(0, 0, layerState.canvasW, layerState.canvasH);

    for (const layer of layerState.layers) {
      if (!layer.visible) continue;
      ctx.globalAlpha = layer.opacity;
      ctx.drawImage(layer.canvas, 0, 0);
    }
    ctx.globalAlpha = 1;

    if (previewCanvasRef.current) {
      ctx.drawImage(previewCanvasRef.current, 0, 0);
    }

    if (view.selection) {
      ctx.strokeStyle = '#0078d4';
      ctx.lineWidth = 1 / view.zoom;
      ctx.setLineDash([4 / view.zoom, 4 / view.zoom]);
      ctx.strokeRect(view.selection.x, view.selection.y, view.selection.w, view.selection.h);
      ctx.setLineDash([]);
    }
  }, [layerState.layers, layerState.canvasW, layerState.canvasH, view.zoom, view.selection]);

  useEffect(() => { composite(); }, [composite]);

  // --- Canvas coordinate helper ---
  const getCanvasPos = (e: React.MouseEvent) => {
    const rect = displayRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / view.zoom,
      y: (e.clientY - rect.top) / view.zoom,
    };
  };

  // --- Mouse event handlers ---
  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getCanvasPos(e);
    const layer = layerState.getActiveLayer();
    if (!layer) return;

    drawingRef.current = true;
    startPosRef.current = pos;

    if (tools.tool === 'brush' || tools.tool === 'eraser') {
      history.saveHistory();
      const ctx = layer.canvas.getContext('2d')!;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      if (tools.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = tools.brushOpacity / 100;
      }
      ctx.strokeStyle = tools.fgColor;
      ctx.lineWidth = tools.brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(pos.x + 0.1, pos.y + 0.1);
      ctx.stroke();
      composite();
    } else if (tools.tool === 'fill') {
      history.saveHistory();
      const ctx = layer.canvas.getContext('2d')!;
      floodFill(ctx, pos.x, pos.y, tools.fgColor, layerState.canvasW, layerState.canvasH, tools.fillTolerance);
      composite();
    } else if (tools.tool === 'text') {
      history.saveHistory();
      const ctx = layer.canvas.getContext('2d')!;
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = tools.brushOpacity / 100;
      ctx.fillStyle = tools.fgColor;
      ctx.font = `${tools.fontSize}px ${tools.fontFamily}`;
      ctx.fillText(tools.textInput, pos.x, pos.y);
      ctx.globalAlpha = 1;
      composite();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getCanvasPos(e);
    view.setCursorPos({ x: Math.floor(pos.x), y: Math.floor(pos.y) });

    if (!drawingRef.current) return;
    const layer = layerState.getActiveLayer();
    if (!layer) return;

    if (tools.tool === 'brush' || tools.tool === 'eraser') {
      const ctx = layer.canvas.getContext('2d')!;
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      composite();
    } else if (tools.tool === 'line' || tools.tool === 'rect' || tools.tool === 'ellipse' || tools.tool === 'select') {
      const preview = previewCanvasRef.current;
      if (!preview) return;
      const pctx = preview.getContext('2d')!;
      pctx.clearRect(0, 0, layerState.canvasW, layerState.canvasH);
      pctx.strokeStyle = tools.tool === 'select' ? '#0078d4' : tools.fgColor;
      pctx.fillStyle = tools.fgColor;
      pctx.lineWidth = tools.tool === 'select' ? 1 : tools.brushSize;
      pctx.globalAlpha = tools.tool === 'select' ? 0.5 : tools.brushOpacity / 100;
      pctx.lineCap = 'round';

      const sx = startPosRef.current.x, sy = startPosRef.current.y;
      const dx = pos.x - sx, dy = pos.y - sy;

      if (tools.tool === 'line') {
        pctx.beginPath();
        pctx.moveTo(sx, sy);
        pctx.lineTo(pos.x, pos.y);
        pctx.stroke();
      } else if (tools.tool === 'rect' || tools.tool === 'select') {
        if (tools.tool === 'select') {
          pctx.setLineDash([4, 4]);
          pctx.strokeRect(sx, sy, dx, dy);
          pctx.setLineDash([]);
        } else if (tools.fillMode === 'fill') {
          pctx.fillRect(sx, sy, dx, dy);
        } else {
          pctx.strokeRect(sx, sy, dx, dy);
        }
      } else if (tools.tool === 'ellipse') {
        pctx.beginPath();
        pctx.ellipse(sx + dx / 2, sy + dy / 2, Math.abs(dx / 2), Math.abs(dy / 2), 0, 0, Math.PI * 2);
        if (tools.fillMode === 'fill') pctx.fill(); else pctx.stroke();
      }
      pctx.globalAlpha = 1;
      composite();
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const layer = layerState.getActiveLayer();
    if (!layer) return;
    const pos = getCanvasPos(e);

    if (tools.tool === 'brush' || tools.tool === 'eraser') {
      const ctx = layer.canvas.getContext('2d')!;
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    } else if (tools.tool === 'line' || tools.tool === 'rect' || tools.tool === 'ellipse') {
      history.saveHistory();
      const ctx = layer.canvas.getContext('2d')!;
      ctx.globalAlpha = tools.brushOpacity / 100;
      ctx.strokeStyle = tools.fgColor;
      ctx.fillStyle = tools.fgColor;
      ctx.lineWidth = tools.brushSize;
      ctx.lineCap = 'round';

      const sx = startPosRef.current.x, sy = startPosRef.current.y;
      const dx = pos.x - sx, dy = pos.y - sy;

      if (tools.tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      } else if (tools.tool === 'rect') {
        if (tools.fillMode === 'fill') ctx.fillRect(sx, sy, dx, dy);
        else ctx.strokeRect(sx, sy, dx, dy);
      } else if (tools.tool === 'ellipse') {
        ctx.beginPath();
        ctx.ellipse(sx + dx / 2, sy + dy / 2, Math.abs(dx / 2), Math.abs(dy / 2), 0, 0, Math.PI * 2);
        if (tools.fillMode === 'fill') ctx.fill(); else ctx.stroke();
      }
      ctx.globalAlpha = 1;
    } else if (tools.tool === 'select') {
      const sx = startPosRef.current.x, sy = startPosRef.current.y;
      const w = pos.x - sx, h = pos.y - sy;
      if (Math.abs(w) > 2 && Math.abs(h) > 2) {
        view.setSelection({ x: Math.min(sx, pos.x), y: Math.min(sy, pos.y), w: Math.abs(w), h: Math.abs(h) });
      } else {
        view.setSelection(null);
      }
    }

    const preview = previewCanvasRef.current;
    if (preview) preview.getContext('2d')!.clearRect(0, 0, layerState.canvasW, layerState.canvasH);
    composite();
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    view.adjustZoom(e.deltaY > 0 ? -0.1 : 0.1);
  };

  // --- Undo/Redo ---
  const undo = () => {
    const state = history.getHistoryState('undo');
    if (state) layerState.restoreState(state);
  };

  const redo = () => {
    const state = history.getHistoryState('redo');
    if (state) layerState.restoreState(state);
  };

  // --- File operations ---
  const openImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const img = new Image();
      img.onload = () => {
        layerState.setCanvasW(img.width);
        layerState.setCanvasH(img.height);
        const c = createCanvas(img.width, img.height);
        c.getContext('2d')!.drawImage(img, 0, 0);
        layerState.setLayers([{ id: 0, name: 'Imported', canvas: c, visible: true, opacity: 1 }]);
        layerState.setActiveLayerId(0);
        layerState.nextLayerId.current = 1;
        if (previewCanvasRef.current) {
          previewCanvasRef.current.width = img.width;
          previewCanvasRef.current.height = img.height;
        }
        history.clearHistory();
      };
      img.src = URL.createObjectURL(file);
    };
    input.click();
  };

  const exportImage = () => {
    const tempCanvas = createCanvas(layerState.canvasW, layerState.canvasH);
    const ctx = tempCanvas.getContext('2d')!;
    for (const layer of layerState.layers) {
      if (!layer.visible) continue;
      ctx.globalAlpha = layer.opacity;
      ctx.drawImage(layer.canvas, 0, 0);
    }
    ctx.globalAlpha = 1;

    const mimeType = view.exportFormat === 'png' ? 'image/png'
      : view.exportFormat === 'jpeg' ? 'image/jpeg'
      : 'image/webp';
    const quality = (view.exportFormat === 'jpeg' || view.exportFormat === 'webp')
      ? view.exportQuality / 100
      : undefined;

    tempCanvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `image.${view.exportFormat}`;
      a.click();
      URL.revokeObjectURL(url);
    }, mimeType, quality);
    view.setShowExportDialog(false);
  };

  const newCanvas = () => {
    layerState.initLayers(layerState.canvasW, layerState.canvasH);
    view.setSelection(null);
    history.clearHistory();
    if (previewCanvasRef.current) {
      previewCanvasRef.current.width = layerState.canvasW;
      previewCanvasRef.current.height = layerState.canvasH;
      previewCanvasRef.current.getContext('2d')!.clearRect(0, 0, layerState.canvasW, layerState.canvasH);
    }
  };

  // --- Transform operations ---
  const rotateCanvas = (deg: number) => {
    history.saveHistory();
    layerState.setLayers(prev => prev.map(l => {
      const src = l.canvas;
      const c = document.createElement('canvas');
      if (deg === 90 || deg === 270) {
        c.width = src.height;
        c.height = src.width;
      } else {
        c.width = src.width;
        c.height = src.height;
      }
      const ctx = c.getContext('2d')!;
      ctx.translate(c.width / 2, c.height / 2);
      ctx.rotate((deg * Math.PI) / 180);
      ctx.drawImage(src, -src.width / 2, -src.height / 2);
      return { ...l, canvas: c };
    }));

    if (deg === 90 || deg === 270) {
      // Use temp variables to avoid the bug where both get set to the same value
      const tempW = layerState.canvasW;
      const tempH = layerState.canvasH;
      layerState.setCanvasW(tempH);
      layerState.setCanvasH(tempW);

      if (previewCanvasRef.current) {
        previewCanvasRef.current.width = tempH;
        previewCanvasRef.current.height = tempW;
      }
    }
  };

  const flipCanvas = (dir: 'h' | 'v') => {
    history.saveHistory();
    layerState.setLayers(prev => prev.map(l => {
      const c = createCanvas(l.canvas.width, l.canvas.height);
      const ctx = c.getContext('2d')!;
      if (dir === 'h') {
        ctx.translate(c.width, 0);
        ctx.scale(-1, 1);
      } else {
        ctx.translate(0, c.height);
        ctx.scale(1, -1);
      }
      ctx.drawImage(l.canvas, 0, 0);
      return { ...l, canvas: c };
    }));
  };

  const resizeCanvas = () => {
    if (view.resizeW < 1 || view.resizeH < 1) return;
    history.saveHistory();
    layerState.setLayers(prev => prev.map(l => {
      const c = createCanvas(view.resizeW, view.resizeH);
      c.getContext('2d')!.drawImage(l.canvas, 0, 0, view.resizeW, view.resizeH);
      return { ...l, canvas: c };
    }));
    layerState.setCanvasW(view.resizeW);
    layerState.setCanvasH(view.resizeH);
    if (previewCanvasRef.current) {
      previewCanvasRef.current.width = view.resizeW;
      previewCanvasRef.current.height = view.resizeH;
    }
    view.setShowResizeDialog(false);
  };

  const cropToSelection = () => {
    if (!view.selection) return;
    history.saveHistory();
    const { x, y, w, h } = view.selection;
    const cropW = Math.round(w);
    const cropH = Math.round(h);
    layerState.setLayers(prev => prev.map(l => {
      const c = createCanvas(cropW, cropH);
      c.getContext('2d')!.drawImage(l.canvas, x, y, w, h, 0, 0, cropW, cropH);
      return { ...l, canvas: c };
    }));
    layerState.setCanvasW(cropW);
    layerState.setCanvasH(cropH);
    if (previewCanvasRef.current) {
      previewCanvasRef.current.width = cropW;
      previewCanvasRef.current.height = cropH;
    }
    view.setSelection(null);
  };

  // --- Filters ---
  const handleApplyFilter = (filter: FilterType, value?: number) => {
    const layer = layerState.getActiveLayer();
    if (!layer) return;
    history.saveHistory();
    const ctx = layer.canvas.getContext('2d')!;
    applyImageFilter(ctx, filter, layerState.canvasW, layerState.canvasH, value);
    composite();
  };

  // --- Keyboard shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-950 dark:to-blue-950 overflow-hidden select-none">
      <MenuBar
        onNew={newCanvas}
        onOpen={openImage}
        onShowExport={() => view.setShowExportDialog(true)}
        onUndo={undo}
        onRedo={redo}
        selection={view.selection}
        onCropToSelection={cropToSelection}
        onClearSelection={() => view.setSelection(null)}
        canvasW={layerState.canvasW}
        canvasH={layerState.canvasH}
        onShowResize={() => {
          view.setResizeW(layerState.canvasW);
          view.setResizeH(layerState.canvasH);
          view.setShowResizeDialog(true);
        }}
        onRotate={rotateCanvas}
        onFlip={flipCanvas}
        onApplyFilter={handleApplyFilter}
        showFilterPanel={view.showFilterPanel}
        onToggleFilterPanel={() => view.setShowFilterPanel(!view.showFilterPanel)}
        zoom={view.zoom}
        onZoomIn={() => view.adjustZoom(0.25)}
        onZoomOut={() => view.adjustZoom(-0.25)}
        onZoomReset={() => view.setZoom(1)}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <Toolbar
          tool={tools.tool}
          onSelectTool={tools.setTool}
          fgColor={tools.fgColor}
          bgColor={tools.bgColor}
          onFgColorChange={tools.setFgColor}
          onBgColorChange={tools.setBgColor}
        />

        <CanvasArea
          displayRef={displayRef}
          canvasW={layerState.canvasW}
          canvasH={layerState.canvasH}
          zoom={view.zoom}
          tool={tools.tool}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { drawingRef.current = false; }}
          onWheel={handleWheel}
        />

        <div className="w-56 bg-white/80 dark:bg-gray-900/80 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-auto">
          <ToolProperties
            tool={tools.tool}
            brushSize={tools.brushSize}
            onBrushSizeChange={tools.setBrushSize}
            brushOpacity={tools.brushOpacity}
            onBrushOpacityChange={tools.setBrushOpacity}
            fillMode={tools.fillMode}
            onFillModeChange={tools.setFillMode}
            fillTolerance={tools.fillTolerance}
            onFillToleranceChange={tools.setFillTolerance}
            textInput={tools.textInput}
            onTextInputChange={tools.setTextInput}
            fontFamily={tools.fontFamily}
            onFontFamilyChange={tools.setFontFamily}
            fontSize={tools.fontSize}
            onFontSizeChange={tools.setFontSize}
          />
          {view.showFilterPanel && <FilterPanel onApplyFilter={handleApplyFilter} />}
          <LayerPanel
            layers={layerState.layers}
            activeLayerId={layerState.activeLayerId}
            onSelectLayer={layerState.setActiveLayerId}
            onAddLayer={layerState.addLayer}
            onDeleteLayer={layerState.deleteLayer}
            onToggleVisibility={layerState.toggleLayerVisibility}
            onMoveLayer={layerState.moveLayer}
            onSetOpacity={layerState.setLayerOpacity}
          />
        </div>
      </div>

      <StatusBar
        canvasW={layerState.canvasW}
        canvasH={layerState.canvasH}
        cursorX={view.cursorPos.x}
        cursorY={view.cursorPos.y}
        tool={tools.tool}
        layerCount={layerState.layers.length}
        zoom={view.zoom}
        selection={view.selection}
      />

      {view.showResizeDialog && (
        <ResizeDialog
          resizeW={view.resizeW}
          resizeH={view.resizeH}
          onResizeWChange={view.setResizeW}
          onResizeHChange={view.setResizeH}
          onApply={resizeCanvas}
          onCancel={() => view.setShowResizeDialog(false)}
        />
      )}

      {view.showExportDialog && (
        <ExportDialog
          format={view.exportFormat}
          onFormatChange={view.setExportFormat}
          exportQuality={view.exportQuality}
          onExportQualityChange={view.setExportQuality}
          onExport={exportImage}
          onCancel={() => view.setShowExportDialog(false)}
        />
      )}
    </div>
  );
};
