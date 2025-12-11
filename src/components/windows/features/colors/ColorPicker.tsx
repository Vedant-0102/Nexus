import React, { useState, useMemo } from 'react';
import { Copy, Check, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ColorFormat {
  hex: string;
  rgb: string;
  hsl: string;
  rgba: string;
  hsla: string;
}

export const ColorPicker: React.FC = () => {
  const [color, setColor] = useState<string>('#3B82F6');
  const [copied, setCopied] = useState<string>('');

  const formats = useMemo((): ColorFormat => {
    const hex = color;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    const max = Math.max(r, g, b) / 255;
    const min = Math.min(r, g, b) / 255;
    const l = (max + min) / 2;
    let h = 0, s = 0;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r / 255: h = ((g / 255 - b / 255) / d + (g < b ? 6 : 0)) / 6; break;
        case g / 255: h = ((b / 255 - r / 255) / d + 2) / 6; break;
        case b / 255: h = ((r / 255 - g / 255) / d + 4) / 6; break;
      }
    }

    return {
      hex,
      rgb: `rgb(${r}, ${g}, ${b})`,
      hsl: `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`,
      rgba: `rgba(${r}, ${g}, ${b}, 1)`,
      hsla: `hsla(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%, 1)`,
    };
  }, [color]);

  const palettes = {
    material: ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'],
    tailwind: ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#84CC16', '#06B6D4', '#A855F7'],
    grayscale: ['#000000', '#1F1F1F', '#3F3F3F', '#5F5F5F', '#7F7F7F', '#9F9F9F', '#BFBFBF', '#DFDFDF', '#FFFFFF'],
  };

  const copyToClipboard = (text: string, format: string) => {
    navigator.clipboard.writeText(text);
    setCopied(format);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      <div className="p-4 border-b dark:border-gray-700">
        <h2 className="text-2xl font-semibold dark:text-white flex items-center gap-2">
          <Palette className="h-6 w-6" />
          Color Picker
        </h2>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Main Color Display */}
          <div className="flex gap-4">
            <div
              className="w-48 h-48 rounded-lg border-4 border-gray-300 dark:border-gray-700 shadow-lg"
              style={{ backgroundColor: color }}
            />
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 dark:text-white">
                  Pick Color
                </label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full h-16 rounded cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 dark:text-white">
                  Hex Input
                </label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:text-white dark:border-gray-700 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Color Formats */}
          <div>
            <h3 className="text-lg font-semibold mb-3 dark:text-white">Color Formats</h3>
            <div className="space-y-2">
              {Object.entries(formats).map(([format, value]) => (
                <div key={format} className="flex items-center gap-2">
                  <span className="w-16 text-sm font-semibold dark:text-white uppercase">{format}</span>
                  <input
                    type="text"
                    value={value}
                    readOnly
                    className="flex-1 px-3 py-2 border rounded dark:bg-gray-800 dark:text-white dark:border-gray-700 font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(value, format)}
                  >
                    {copied === format ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Palettes */}
          {Object.entries(palettes).map(([name, colors]) => (
            <div key={name}>
              <h3 className="text-lg font-semibold mb-3 dark:text-white capitalize">{name} Palette</h3>
              <div className="flex flex-wrap gap-2">
                {colors.map(c => (
                  <button
                    key={c}
                    className="w-12 h-12 rounded border-2 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c, borderColor: color === c ? '#000' : 'transparent' }}
                    onClick={() => setColor(c)}
                    title={c}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
