import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Code, Copy, Check, Download, ChevronDown, ChevronRight } from 'lucide-react';

export const HexCodeParser: React.FC = () => {
  const { toast } = useToast();
  const [inputText, setInputText] = useState('');
  const [colors, setColors] = useState<string[]>([]);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [showCSS, setShowCSS] = useState(false);
  const [showJSON, setShowJSON] = useState(false);

  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    if (hex.length === 4) {
      const r = parseInt(hex[1] + hex[1], 16);
      const g = parseInt(hex[2] + hex[2], 16);
      const b = parseInt(hex[3] + hex[3], 16);
      return { r, g, b };
    }
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  // Convert RGB to HSL
  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0,
      s,
      l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  };

  // Parse input text to extract hex codes
  const parseColors = () => {
    const hexPattern = /#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}/g;
    const foundColors = inputText.match(hexPattern) || [];
    const uniqueColors = [
      ...new Set(
        foundColors.map((color) =>
          color.length === 4
            ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
            : color
        )
      ),
    ];
    setColors(uniqueColors);
    toast({
      title: `Found ${uniqueColors.length} colors!`,
      description: uniqueColors.join(', '),
    });
  };

  // Generate CSS variables
  const generateCSS = () => {
    if (colors.length === 0) return '';
    let css = `/* Color Palette */\n:root {\n`;
    colors.forEach((color, index) => {
      const rgb = hexToRgb(color);
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      css += `  --color-${index + 1}: ${color};\n`;
      css += `  --color-${index + 1}-rgb: ${rgb.r}, ${rgb.g}, ${rgb.b};\n`;
      css += `  --color-${index + 1}-hsl: ${hsl.h}, ${hsl.s}%, ${hsl.l}%;\n`;
    });
    css += '}\n\n';
    colors.forEach((color, index) => {
      css += `.bg-color-${index + 1} { background-color: var(--color-${index + 1}); }\n`;
      css += `.text-color-${index + 1} { color: var(--color-${index + 1}); }\n`;
      css += `.border-color-${index + 1} { border-color: var(--color-${index + 1}); }\n\n`;
    });
    return css;
  };

  // Generate JSON theme
  const generateJSON = () => {
    if (colors.length === 0) return '';
    const theme = {
      name: 'Color Palette',
      colors: colors.map((color, index) => {
        const rgb = hexToRgb(color);
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        return {
          name: `Color ${index + 1}`,
          hex: color,
          rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
          hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
          values: {
            hex: color,
            rgb: { r: rgb.r, g: rgb.g, b: rgb.b },
            hsl: { h: hsl.h, s: hsl.s, l: hsl.l },
          },
        };
      }),
    };
    return JSON.stringify(theme, null, 2);
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string, format: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedFormat(format);
      toast({
        title: 'Copied!',
        description: `${format.toUpperCase()} copied to clipboard`,
      });
      setTimeout(() => setCopiedFormat(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  // Download file
  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: 'Downloaded!',
      description: filename,
    });
  };

  return (
    <div className="h-full w-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <div className="flex items-center gap-2 mb-6">
        <Code className="h-6 w-6 text-orange-600" />
        <h2 className="text-2xl font-bold">Hex Code Parser</h2>
      </div>

      {/* Input Section */}
      <Card className="p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Enter Hex Codes</label>
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full px-4 py-3 border-2 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none font-mono text-sm"
                placeholder="Enter hex codes separated by spaces, commas, or new lines&#10;Example: #FF0000 #00FF00 #0000FF"
                rows={4}
              />
              <div className="absolute bottom-3 right-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                {inputText.length} chars
              </div>
            </div>
          </div>
          <Button onClick={parseColors} className="w-full gap-2" size="lg">
            <Code className="h-4 w-4" />
            Parse Colors
          </Button>
        </div>
      </Card>

      {/* Color Preview */}
      {colors.length > 0 && (
        <>
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Color Palette ({colors.length} colors)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {colors.map((color, index) => {
                const rgb = hexToRgb(color);
                const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
                return (
                  <div
                    key={index}
                    className="cursor-pointer transform hover:scale-105 transition-all"
                    onClick={() => copyToClipboard(color, `color-${index}`)}
                  >
                    <div
                      className="w-full h-24 rounded-lg border-2 shadow-md"
                      style={{ backgroundColor: color }}
                    />
                    <div className="mt-2 text-center">
                      <div className="text-xs font-mono font-semibold">{color}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        RGB({rgb.r}, {rgb.g}, {rgb.b})
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Quick Copy Formats */}
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Quick Copy Formats</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">HEX</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={colors.join(', ')}
                    readOnly
                    className="flex-1 px-3 py-2 border-2 rounded bg-white dark:bg-slate-800 font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(colors.join(', '), 'hex')}
                    className="gap-2"
                  >
                    {copiedFormat === 'hex' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">RGB</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={colors
                      .map((color) => {
                        const rgb = hexToRgb(color);
                        return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
                      })
                      .join(', ')}
                    readOnly
                    className="flex-1 px-3 py-2 border-2 rounded bg-white dark:bg-slate-800 font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(
                        colors
                          .map((color) => {
                            const rgb = hexToRgb(color);
                            return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
                          })
                          .join(', '),
                        'rgb'
                      )
                    }
                    className="gap-2"
                  >
                    {copiedFormat === 'rgb' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">HSL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={colors
                      .map((color) => {
                        const rgb = hexToRgb(color);
                        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
                        return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
                      })
                      .join(', ')}
                    readOnly
                    className="flex-1 px-3 py-2 border-2 rounded bg-white dark:bg-slate-800 font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(
                        colors
                          .map((color) => {
                            const rgb = hexToRgb(color);
                            const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
                            return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
                          })
                          .join(', '),
                        'hsl'
                      )
                    }
                    className="gap-2"
                  >
                    {copiedFormat === 'hsl' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Download Assets */}
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Download Assets</h3>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => downloadFile(generateCSS(), 'color_palette.css', 'text/css')}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download CSS
              </Button>
              <Button
                onClick={() => downloadFile(generateJSON(), 'color_palette.json', 'application/json')}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download JSON
              </Button>
            </div>
          </Card>

          {/* Export Options */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CSS Export */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setShowCSS(!showCSS)}
                  className="text-lg font-semibold flex items-center gap-2 hover:text-orange-600 transition-colors"
                >
                  {showCSS ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  CSS Variables
                </button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generateCSS(), 'css')}
                  className="gap-2"
                >
                  {copiedFormat === 'css' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  Copy
                </Button>
              </div>
              {showCSS && (
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto max-h-96 overflow-y-auto font-mono">
                  <code>{generateCSS()}</code>
                </pre>
              )}
            </Card>

            {/* JSON Export */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setShowJSON(!showJSON)}
                  className="text-lg font-semibold flex items-center gap-2 hover:text-orange-600 transition-colors"
                >
                  {showJSON ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  JSON Theme
                </button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generateJSON(), 'json')}
                  className="gap-2"
                >
                  {copiedFormat === 'json' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  Copy
                </Button>
              </div>
              {showJSON && (
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto max-h-96 overflow-y-auto font-mono">
                  <code>{generateJSON()}</code>
                </pre>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
