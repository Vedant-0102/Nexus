import React from 'react';
import {
  Eye, EyeOff, ChevronUp, ChevronDown, Trash2, Plus,
  ZoomIn, ZoomOut, Maximize,
  FilePlus, FolderOpen, Download,
  Undo2, Redo2, Crop, XCircle,
  RotateCw, RotateCcw, FlipHorizontal, FlipVertical,
  Scaling, SlidersHorizontal,
} from 'lucide-react';
import { Layer, Tool, FillMode, ExportFormat, Selection, FilterType } from './types';
import { TOOLS, FONT_OPTIONS, CHECKERBOARD } from './constants';

// ─── Shared Styles ───────────────────────────────────────────────────────────

const btnClass = 'px-2 py-1 text-xs rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors';
const menuBtnClass = 'px-3 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors';
const menuItemClass = 'flex items-center gap-2 w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300';
const dropdownClass = 'hidden group-hover:block absolute top-full left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50 min-w-[180px]';
const labelClass = 'text-[10px] text-gray-500 dark:text-gray-400 font-medium';
const inputClass = 'px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200';

// ─── MenuBar ─────────────────────────────────────────────────────────────────

interface MenuBarProps {
  onNew: () => void;
  onOpen: () => void;
  onShowExport: () => void;
  onUndo: () => void;
  onRedo: () => void;
  selection: Selection | null;
  onCropToSelection: () => void;
  onClearSelection: () => void;
  canvasW: number;
  canvasH: number;
  onShowResize: () => void;
  onRotate: (deg: number) => void;
  onFlip: (dir: 'h' | 'v') => void;
  onApplyFilter: (filter: FilterType, value?: number) => void;
  showFilterPanel: boolean;
  onToggleFilterPanel: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

export const MenuBar: React.FC<MenuBarProps> = ({
  onNew, onOpen, onShowExport, onUndo, onRedo,
  selection, onCropToSelection, onClearSelection,
  onShowResize, onRotate, onFlip,
  onApplyFilter, onToggleFilterPanel,
  zoom, onZoomIn, onZoomOut, onZoomReset,
}) => (
  <div className="flex items-center gap-1 px-2 py-1 bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700">
    {/* File Menu */}
    <div className="relative group">
      <button className={menuBtnClass} title="File operations">File</button>
      <div className={dropdownClass}>
        <button onClick={onNew} className={menuItemClass} title="Create a new blank canvas">
          <FilePlus size={13} /> New Canvas
        </button>
        <button onClick={onOpen} className={menuItemClass} title="Open an image file from disk">
          <FolderOpen size={13} /> Open Image...
        </button>
        <button onClick={onShowExport} className={menuItemClass} title="Export the canvas as an image file">
          <Download size={13} /> Export...
        </button>
      </div>
    </div>

    {/* Edit Menu */}
    <div className="relative group">
      <button className={menuBtnClass} title="Edit operations">Edit</button>
      <div className={dropdownClass}>
        <button onClick={onUndo} className={menuItemClass} title="Undo the last action (Ctrl+Z)">
          <Undo2 size={13} /> Undo
          <span className="ml-auto text-[10px] text-gray-400">Ctrl+Z</span>
        </button>
        <button onClick={onRedo} className={menuItemClass} title="Redo the last undone action (Ctrl+Y)">
          <Redo2 size={13} /> Redo
          <span className="ml-auto text-[10px] text-gray-400">Ctrl+Y</span>
        </button>
        <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
        {selection && (
          <button onClick={onCropToSelection} className={menuItemClass} title="Crop the canvas to the current selection bounds">
            <Crop size={13} /> Crop to Selection
          </button>
        )}
        <button onClick={onClearSelection} className={menuItemClass} title="Remove the current selection">
          <XCircle size={13} /> Deselect
        </button>
      </div>
    </div>

    {/* Image Menu */}
    <div className="relative group">
      <button className={menuBtnClass} title="Image transformations">Image</button>
      <div className={dropdownClass}>
        <button onClick={onShowResize} className={menuItemClass} title="Change the canvas dimensions">
          <Scaling size={13} /> Resize Canvas...
        </button>
        <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
        <button onClick={() => onRotate(90)} className={menuItemClass} title="Rotate the canvas 90 degrees clockwise">
          <RotateCw size={13} /> Rotate 90 CW
        </button>
        <button onClick={() => onRotate(270)} className={menuItemClass} title="Rotate the canvas 90 degrees counter-clockwise">
          <RotateCcw size={13} /> Rotate 90 CCW
        </button>
        <button onClick={() => onRotate(180)} className={menuItemClass} title="Rotate the canvas 180 degrees">
          <RotateCw size={13} /> Rotate 180
        </button>
        <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
        <button onClick={() => onFlip('h')} className={menuItemClass} title="Flip the canvas horizontally (mirror left to right)">
          <FlipHorizontal size={13} /> Flip Horizontal
        </button>
        <button onClick={() => onFlip('v')} className={menuItemClass} title="Flip the canvas vertically (mirror top to bottom)">
          <FlipVertical size={13} /> Flip Vertical
        </button>
      </div>
    </div>

    {/* Filter Menu */}
    <div className="relative group">
      <button className={menuBtnClass} title="Apply image filters and adjustments">Filter</button>
      <div className={dropdownClass}>
        <button onClick={() => onApplyFilter('grayscale')} className={menuItemClass} title="Convert image to grayscale">
          Grayscale
        </button>
        <button onClick={() => onApplyFilter('sepia')} className={menuItemClass} title="Apply a warm sepia tone">
          Sepia
        </button>
        <button onClick={() => onApplyFilter('invert')} className={menuItemClass} title="Invert all colors in the image">
          Invert Colors
        </button>
        <button onClick={() => onApplyFilter('blur')} className={menuItemClass} title="Apply a slight Gaussian blur">
          Blur
        </button>
        <button onClick={() => onApplyFilter('sharpen')} className={menuItemClass} title="Sharpen edges and details">
          Sharpen
        </button>
        <button onClick={() => onApplyFilter('posterize', 4)} className={menuItemClass} title="Reduce the number of color levels to create a poster effect">
          Posterize
        </button>
        <button onClick={() => onApplyFilter('pixelate', 8)} className={menuItemClass} title="Pixelate the image with an 8px block size">
          Pixelate
        </button>
        <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
        <button onClick={onToggleFilterPanel} className={`${menuItemClass} !text-blue-600 dark:!text-blue-400`} title="Open the brightness and contrast adjustments panel">
          <SlidersHorizontal size={13} /> Adjustments Panel...
        </button>
      </div>
    </div>

    {/* Zoom Controls */}
    <div className="ml-auto flex items-center gap-1">
      <button onClick={onZoomOut} className={btnClass} title="Zoom out (decrease magnification)">
        <ZoomOut size={14} />
      </button>
      <span className="text-xs text-gray-500 w-14 text-center" title="Current zoom level">
        {Math.round(zoom * 100)}%
      </span>
      <button onClick={onZoomIn} className={btnClass} title="Zoom in (increase magnification)">
        <ZoomIn size={14} />
      </button>
      <button onClick={onZoomReset} className={btnClass} title="Reset zoom to 100% (actual size)">
        <Maximize size={14} />
      </button>
    </div>
  </div>
);

// ─── Toolbar (Left Side) ────────────────────────────────────────────────────

interface ToolbarProps {
  tool: Tool;
  onSelectTool: (tool: Tool) => void;
  fgColor: string;
  bgColor: string;
  onFgColorChange: (color: string) => void;
  onBgColorChange: (color: string) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  tool, onSelectTool, fgColor, bgColor, onFgColorChange, onBgColorChange,
}) => (
  <div className="w-11 bg-white/60 dark:bg-gray-900/60 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-1.5 gap-0.5">
    {TOOLS.map(t => {
      const Icon = t.icon;
      return (
        <button
          key={t.id}
          onClick={() => onSelectTool(t.id)}
          title={`${t.label} - ${t.description}`}
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
            tool === t.id
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <Icon size={16} />
        </button>
      );
    })}

    {/* Color Pickers */}
    <div className="mt-3 flex flex-col items-center gap-1.5">
      <div className="relative w-7 h-7" title="Foreground Color - Click to change the drawing color">
        <input
          type="color"
          value={fgColor}
          onChange={e => onFgColorChange(e.target.value)}
          className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
          title="Foreground Color"
        />
        <div
          className="w-6 h-6 rounded border-2 border-white dark:border-gray-500 shadow-sm pointer-events-none"
          style={{ background: fgColor }}
        />
      </div>
      <div className="relative w-7 h-7" title="Background Color - Click to change the background/secondary color">
        <input
          type="color"
          value={bgColor}
          onChange={e => onBgColorChange(e.target.value)}
          className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
          title="Background Color"
        />
        <div
          className="w-5 h-5 rounded border border-white dark:border-gray-500 shadow-sm pointer-events-none mt-0.5 ml-0.5"
          style={{ background: bgColor }}
        />
      </div>
    </div>
  </div>
);

// ─── Tool Properties Panel ──────────────────────────────────────────────────

interface ToolPropertiesProps {
  tool: Tool;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  brushOpacity: number;
  onBrushOpacityChange: (opacity: number) => void;
  fillMode: FillMode;
  onFillModeChange: (mode: FillMode) => void;
  fillTolerance: number;
  onFillToleranceChange: (tolerance: number) => void;
  textInput: string;
  onTextInputChange: (text: string) => void;
  fontFamily: string;
  onFontFamilyChange: (font: string) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
}

export const ToolProperties: React.FC<ToolPropertiesProps> = ({
  tool, brushSize, onBrushSizeChange, brushOpacity, onBrushOpacityChange,
  fillMode, onFillModeChange, fillTolerance, onFillToleranceChange,
  textInput, onTextInputChange, fontFamily, onFontFamilyChange,
  fontSize, onFontSizeChange,
}) => {
  const toggleClass = (active: boolean) =>
    `px-2.5 py-0.5 text-[10px] rounded transition-colors ${
      active
        ? 'bg-blue-600 text-white'
        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
    }`;

  const currentTool = TOOLS.find(t => t.id === tool);

  return (
    <div className="p-2.5 border-b border-gray-200 dark:border-gray-700 space-y-2">
      <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        Tool Properties
      </div>

      {currentTool && (
        <div className="text-[11px] text-gray-600 dark:text-gray-300 font-medium" title={currentTool.description}>
          {currentTool.label}
        </div>
      )}

      {/* Brush Size - shown for brush, eraser, line, rect, ellipse */}
      {(tool === 'brush' || tool === 'eraser' || tool === 'line' || tool === 'rect' || tool === 'ellipse') && (
        <label className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400" title="Adjust the brush or pen width for drawing">
          <span className={labelClass}>Brush Size</span>
          <input
            type="range" min={1} max={100} value={brushSize}
            onChange={e => onBrushSizeChange(Number(e.target.value))}
            className="w-20 h-3 accent-blue-600"
            title={`Brush Size: ${brushSize}px`}
          />
          <span className="w-7 text-right font-mono text-[10px]">{brushSize}px</span>
        </label>
      )}

      {/* Opacity - shown for brush, eraser, line, rect, ellipse */}
      {(tool === 'brush' || tool === 'eraser' || tool === 'line' || tool === 'rect' || tool === 'ellipse') && (
        <label className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400" title="Adjust the opacity of the stroke or fill">
          <span className={labelClass}>Opacity</span>
          <input
            type="range" min={1} max={100} value={brushOpacity}
            onChange={e => onBrushOpacityChange(Number(e.target.value))}
            className="w-20 h-3 accent-blue-600"
            title={`Opacity: ${brushOpacity}%`}
          />
          <span className="w-7 text-right font-mono text-[10px]">{brushOpacity}%</span>
        </label>
      )}

      {/* Shape Style - shown for rect, ellipse */}
      {(tool === 'rect' || tool === 'ellipse') && (
        <div className="space-y-1">
          <div className={labelClass}>Shape Style:</div>
          <div className="flex gap-1">
            <button
              onClick={() => onFillModeChange('stroke')}
              className={toggleClass(fillMode === 'stroke')}
              title="Draw only the shape outline (stroke)"
            >
              Stroke
            </button>
            <button
              onClick={() => onFillModeChange('fill')}
              className={toggleClass(fillMode === 'fill')}
              title="Draw a solid filled shape"
            >
              Fill
            </button>
          </div>
        </div>
      )}

      {/* Fill Tolerance - shown for fill tool */}
      {tool === 'fill' && (
        <div className="space-y-1">
          <label className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400" title="How similar neighboring pixels must be to get filled (0 = exact match, 100 = fill everything)">
            <span className={labelClass}>Tolerance</span>
            <input
              type="range" min={0} max={100} value={fillTolerance}
              onChange={e => onFillToleranceChange(Number(e.target.value))}
              className="w-20 h-3 accent-blue-600"
              title={`Fill Tolerance: ${fillTolerance}`}
            />
            <span className="w-7 text-right font-mono text-[10px]">{fillTolerance}</span>
          </label>
        </div>
      )}

      {/* Text Tool Options */}
      {tool === 'text' && (
        <div className="space-y-1.5">
          <input
            value={textInput}
            onChange={e => onTextInputChange(e.target.value)}
            className={`w-full ${inputClass}`}
            placeholder="Enter text..."
            title="Type the text you want to place on the canvas"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className={labelClass}>Font:</span>
              <select
                value={fontFamily}
                onChange={e => onFontFamilyChange(e.target.value)}
                className={`flex-1 text-[10px] ${inputClass}`}
                title="Choose the font family for the text"
              >
                {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={labelClass}>Font Size:</span>
              <input
                type="number"
                value={fontSize}
                onChange={e => onFontSizeChange(Number(e.target.value))}
                min={8} max={200}
                className={`w-14 text-[10px] ${inputClass}`}
                title={`Font size in pixels: ${fontSize}px`}
              />
              <span className="text-[10px] text-gray-400">px</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Filter Adjustments Panel ───────────────────────────────────────────────

interface FilterPanelProps {
  onApplyFilter: (filter: FilterType, value?: number) => void;
}

const filterBtnClass = 'w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors';

export const FilterPanel: React.FC<FilterPanelProps> = ({ onApplyFilter }) => (
  <div className="p-2.5 border-b border-gray-200 dark:border-gray-700 space-y-2">
    <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
      Adjustments
    </div>

    {/* Basic Filters */}
    <div className="space-y-0.5">
      <div className={`${labelClass} mb-0.5`}>Basic</div>
      <button onClick={() => onApplyFilter('grayscale')} className={filterBtnClass} title="Convert image to grayscale (remove all color)">
        Grayscale
      </button>
      <button onClick={() => onApplyFilter('sepia')} className={filterBtnClass} title="Apply a warm sepia tone to the image">
        Sepia
      </button>
      <button onClick={() => onApplyFilter('invert')} className={filterBtnClass} title="Invert all colors (create a negative image)">
        Invert
      </button>
      <button onClick={() => onApplyFilter('blur')} className={filterBtnClass} title="Soften the image with a slight blur">
        Blur
      </button>
      <button onClick={() => onApplyFilter('sharpen')} className={filterBtnClass} title="Enhance edges and fine details">
        Sharpen
      </button>
    </div>

    {/* Adjustment Controls */}
    <div className="space-y-0.5">
      <div className={`${labelClass} mb-0.5`}>Brightness / Contrast</div>
      <button onClick={() => onApplyFilter('brightness', 20)} className={filterBtnClass} title="Increase image brightness by 20 units">
        Brightness +20
      </button>
      <button onClick={() => onApplyFilter('brightness', -20)} className={filterBtnClass} title="Decrease image brightness by 20 units">
        Brightness -20
      </button>
      <button onClick={() => onApplyFilter('contrast', 50)} className={filterBtnClass} title="Increase image contrast (make lights lighter and darks darker)">
        Contrast +
      </button>
      <button onClick={() => onApplyFilter('contrast', -50)} className={filterBtnClass} title="Decrease image contrast (flatten tonal range)">
        Contrast -
      </button>
    </div>
  </div>
);

// ─── Layer Panel ────────────────────────────────────────────────────────────

interface LayerPanelProps {
  layers: Layer[];
  activeLayerId: number;
  onSelectLayer: (id: number) => void;
  onAddLayer: () => void;
  onDeleteLayer: (id: number) => void;
  onToggleVisibility: (id: number) => void;
  onMoveLayer: (id: number, direction: 'up' | 'down') => void;
  onSetOpacity: (id: number, opacity: number) => void;
}

export const LayerPanel: React.FC<LayerPanelProps> = ({
  layers, activeLayerId, onSelectLayer, onAddLayer,
  onDeleteLayer, onToggleVisibility, onMoveLayer, onSetOpacity,
}) => (
  <div className="flex-1 p-2.5 overflow-auto">
    <div className="flex items-center justify-between mb-1.5">
      <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        Layers
      </div>
      <button
        onClick={onAddLayer}
        className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        title="Add a new transparent layer above the current layers"
      >
        <Plus size={11} /> Add
      </button>
    </div>
    <div className="space-y-1">
      {[...layers].reverse().map(l => (
        <div
          key={l.id}
          onClick={() => onSelectLayer(l.id)}
          className={`p-1.5 rounded text-xs cursor-pointer transition-colors ${
            activeLayerId === l.id
              ? 'bg-blue-100 dark:bg-blue-900/40 ring-1 ring-blue-400'
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          title={`Select layer: ${l.name}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300 truncate flex-1 text-[11px]">{l.name}</span>
            <div className="flex items-center gap-0.5">
              <button
                onClick={e => { e.stopPropagation(); onToggleVisibility(l.id); }}
                className="p-0.5 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 transition-colors"
                title={l.visible ? 'Hide Layer - Click to make this layer invisible' : 'Show Layer - Click to make this layer visible'}
              >
                {l.visible ? <Eye size={12} /> : <EyeOff size={12} />}
              </button>
              <button
                onClick={e => { e.stopPropagation(); onMoveLayer(l.id, 'up'); }}
                className="p-0.5 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 transition-colors"
                title="Move Layer Up - Bring this layer closer to the front"
              >
                <ChevronUp size={12} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); onMoveLayer(l.id, 'down'); }}
                className="p-0.5 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 transition-colors"
                title="Move Layer Down - Send this layer further to the back"
              >
                <ChevronDown size={12} />
              </button>
              {layers.length > 1 && (
                <button
                  onClick={e => { e.stopPropagation(); onDeleteLayer(l.id); }}
                  className="p-0.5 rounded text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                  title="Delete Layer - Permanently remove this layer"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[9px] text-gray-400" title="Layer Opacity">Opacity</span>
            <input
              type="range" min={0} max={1} step={0.05} value={l.opacity}
              onChange={e => { e.stopPropagation(); onSetOpacity(l.id, Number(e.target.value)); }}
              className="flex-1 h-2 accent-blue-600"
              onClick={e => e.stopPropagation()}
              title={`Layer Opacity: ${Math.round(l.opacity * 100)}%`}
            />
            <span className="text-[9px] text-gray-400 w-7 text-right font-mono">{Math.round(l.opacity * 100)}%</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Canvas Area ────────────────────────────────────────────────────────────

interface CanvasAreaProps {
  displayRef: React.RefObject<HTMLCanvasElement | null>;
  canvasW: number;
  canvasH: number;
  zoom: number;
  tool: Tool;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
  onWheel: (e: React.WheelEvent) => void;
}

export const CanvasArea: React.FC<CanvasAreaProps> = ({
  displayRef, canvasW, canvasH, zoom, tool,
  onMouseDown, onMouseMove, onMouseUp, onMouseLeave, onWheel,
}) => {
  const cursorMap: Record<Tool, string> = {
    brush: 'crosshair',
    eraser: 'crosshair',
    line: 'crosshair',
    rect: 'crosshair',
    ellipse: 'crosshair',
    fill: 'crosshair',
    text: 'text',
    select: 'crosshair',
  };

  return (
    <div className="flex-1 overflow-auto relative" style={{ background: CHECKERBOARD }}>
      <div className="inline-block p-8" style={{ minWidth: '100%', minHeight: '100%' }}>
        <canvas
          ref={displayRef}
          width={canvasW}
          height={canvasH}
          style={{
            width: canvasW * zoom,
            height: canvasH * zoom,
            imageRendering: zoom > 2 ? 'pixelated' : 'auto',
            cursor: cursorMap[tool] || 'crosshair',
          }}
          className="shadow-lg"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
          onWheel={onWheel}
          title="Drawing canvas"
        />
      </div>
    </div>
  );
};

// ─── Status Bar ─────────────────────────────────────────────────────────────

interface StatusBarProps {
  canvasW: number;
  canvasH: number;
  cursorX: number;
  cursorY: number;
  tool: Tool;
  layerCount: number;
  zoom: number;
  selection: Selection | null;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  canvasW, canvasH, cursorX, cursorY, tool, layerCount, zoom, selection,
}) => {
  const currentTool = TOOLS.find(t => t.id === tool);

  return (
    <div className="flex items-center justify-between px-3 py-0.5 bg-white/80 dark:bg-gray-900/80 border-t border-gray-200 dark:border-gray-700 text-[10px] text-gray-500 dark:text-gray-400">
      <span title="Canvas dimensions">{canvasW} x {canvasH}px</span>
      <span title="Cursor position on canvas">Cursor: {cursorX}, {cursorY}</span>
      <span title="Currently active drawing tool">Tool: {currentTool?.label ?? tool}</span>
      {selection && (
        <span title="Selection dimensions">
          Selection: {Math.round(selection.w)} x {Math.round(selection.h)}px
        </span>
      )}
      <span title="Number of layers in the document">Layers: {layerCount}</span>
      <span title="Current zoom level">Zoom: {Math.round(zoom * 100)}%</span>
    </div>
  );
};

// ─── Resize Dialog ──────────────────────────────────────────────────────────

interface ResizeDialogProps {
  resizeW: number;
  resizeH: number;
  onResizeWChange: (w: number) => void;
  onResizeHChange: (h: number) => void;
  onApply: () => void;
  onCancel: () => void;
}

export const ResizeDialog: React.FC<ResizeDialogProps> = ({
  resizeW, resizeH, onResizeWChange, onResizeHChange, onApply, onCancel,
}) => (
  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-xl min-w-[300px]">
      <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Resize Canvas</div>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400" title="Set the new width of the canvas in pixels">
          Width:
          <input
            type="number" value={resizeW} onChange={e => onResizeWChange(Number(e.target.value))}
            min={1} max={4096}
            className={`flex-1 ${inputClass}`}
            title="Canvas width in pixels"
          />
          <span className="text-[10px] text-gray-400">px</span>
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400" title="Set the new height of the canvas in pixels">
          Height:
          <input
            type="number" value={resizeH} onChange={e => onResizeHChange(Number(e.target.value))}
            min={1} max={4096}
            className={`flex-1 ${inputClass}`}
            title="Canvas height in pixels"
          />
          <span className="text-[10px] text-gray-400">px</span>
        </label>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onCancel} className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors" title="Cancel and close the resize dialog">
          Cancel
        </button>
        <button onClick={onApply} className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors" title="Apply the new canvas dimensions">
          Apply
        </button>
      </div>
    </div>
  </div>
);

// ─── Export Dialog ──────────────────────────────────────────────────────────

interface ExportDialogProps {
  format: ExportFormat;
  onFormatChange: (format: ExportFormat) => void;
  exportQuality: number;
  onExportQualityChange: (quality: number) => void;
  onExport: () => void;
  onCancel: () => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  format, onFormatChange, exportQuality, onExportQualityChange, onExport, onCancel,
}) => (
  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-xl min-w-[300px]">
      <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Export Image</div>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400" title="Choose the image file format for export">
          Format:
          <select
            value={format}
            onChange={e => onFormatChange(e.target.value as ExportFormat)}
            className={`flex-1 text-xs ${inputClass}`}
            title="Select export file format"
          >
            <option value="png">PNG (Lossless, supports transparency)</option>
            <option value="jpeg">JPEG (Lossy, smaller file size)</option>
            <option value="webp">WebP (Modern format, good compression)</option>
          </select>
        </label>
        {(format === 'jpeg' || format === 'webp') && (
          <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400" title="Adjust the compression quality (higher = better quality, larger file)">
            Quality:
            <input
              type="range" min={10} max={100} value={exportQuality}
              onChange={e => onExportQualityChange(Number(e.target.value))}
              className="flex-1 h-3 accent-blue-600"
              title={`Export quality: ${exportQuality}%`}
            />
            <span className="w-8 text-right font-mono">{exportQuality}%</span>
          </label>
        )}
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onCancel} className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors" title="Cancel and close the export dialog">
          Cancel
        </button>
        <button onClick={onExport} className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors" title="Export the image to disk">
          Export
        </button>
      </div>
    </div>
  </div>
);
