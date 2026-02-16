
import React, { useState, useRef, useEffect } from 'react';
import { X, Minus, Square, Palette } from 'lucide-react';
import { WindowTheme } from '../types/WindowTypes';
import { WINDOW_THEMES, WindowThemeName } from '../themes/windowThemes';

interface WindowHeaderProps {
  title: string;
  icon: React.ReactNode;
  isMaximizable?: boolean;
  isClosable?: boolean;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
  theme?: WindowTheme;
  windowId?: string;
  currentThemeName?: string;
  onThemeChange?: (themeName: string) => void;
}

const THEME_SWATCHES: Record<string, string> = {
  default: '#0078D4',
  dark: '#1f2937',
  blue: '#667eea',
  purple: '#a855f7',
  green: '#10b981',
  orange: '#f97316',
  red: '#ef4444',
  cyan: '#06b6d4',
  pink: '#ec4899',
  yellow: '#eab308',
  indigo: '#6366f1',
  teal: '#14b8a6',
  slate: '#64748b',
  glass: 'rgba(255,255,255,0.2)',
  minimal: '#e5e7eb',
};

export const WindowHeader: React.FC<WindowHeaderProps> = ({
  title,
  icon,
  isMaximizable = true,
  isClosable = true,
  onMinimize,
  onMaximize,
  onClose,
  theme,
  windowId,
  currentThemeName,
  onThemeChange,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const isLightText = theme?.headerText === '#ffffff' || theme?.headerText === '#f9fafb';
  const btnHover = isLightText ? 'hover:bg-white/15' : 'hover:bg-gray-200/50';

  const headerStyle: React.CSSProperties = theme ? {
    background: theme.headerBg,
    color: theme.headerText,
    borderBottom: `1px solid ${theme.headerBorder}`,
  } : {};

  useEffect(() => {
    if (!showPicker) return;
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPicker]);

  return (
    <div className="window-header h-10 flex items-center justify-between px-4" style={headerStyle}>
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-medium">{title}</h2>
      </div>
      <div className="flex items-center">
        {onThemeChange && (
          <div className="relative" ref={pickerRef}>
            <button
              className={`p-1.5 rounded-full ${btnHover} transition-colors`}
              onClick={(e) => { e.stopPropagation(); setShowPicker(!showPicker); }}
              aria-label="Change theme"
            >
              <Palette size={13} />
            </button>
            {showPicker && (
              <div
                className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 z-50 min-w-[180px]"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-1">Window Theme</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {(Object.keys(THEME_SWATCHES) as WindowThemeName[]).map(name => (
                    <button
                      key={name}
                      onClick={(e) => {
                        e.stopPropagation();
                        onThemeChange(name);
                        setShowPicker(false);
                      }}
                      className={`w-7 h-7 rounded-md border-2 transition-all ${
                        currentThemeName === name
                          ? 'border-blue-500 scale-110 shadow-md'
                          : 'border-transparent hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                      style={{ background: THEME_SWATCHES[name] }}
                      title={name.charAt(0).toUpperCase() + name.slice(1)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <button
          className={`p-1.5 rounded-full ${btnHover} transition-colors`}
          onClick={(e) => { e.stopPropagation(); onMinimize(); }}
          aria-label="Minimize"
        >
          <Minus size={14} />
        </button>
        {isMaximizable && (
          <button
            className={`p-1.5 rounded-full ${btnHover} transition-colors`}
            onClick={(e) => {
              e.stopPropagation();
              onMaximize();
            }}
            aria-label="Maximize"
          >
            <Square size={12} />
          </button>
        )}
        {isClosable && (
          <button
            className="p-1.5 rounded-full hover:bg-red-500/80 hover:text-white transition-colors"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
