import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import {
  Shuffle,
  Copy,
  Lock,
  Unlock,
  RefreshCw,
  Download,
  CheckCircle2,
  Palette
} from 'lucide-react';

interface Color {
  hex: string;
  locked: boolean;
}

// Utility functions
const hexToRgb = (hex: string) => {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return { r, g, b };
};

const rgbToHex = ({ r, g, b }: { r: number; g: number; b: number }) => {
  return '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('');
};

const rgbToHsl = ({ r, g, b }: { r: number; g: number; b: number }) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
};

const hslToRgb = ({ h, s, l }: { h: number; s: number; l: number }) => {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: r * 255, g: g * 255, b: b * 255 };
};

const relativeLuminance = ({ r, g, b }: { r: number; g: number; b: number }) => {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

const contrastRatioCalc = (color1: string, color2: string) => {
  const l1 = relativeLuminance(hexToRgb(color1));
  const l2 = relativeLuminance(hexToRgb(color2));
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

const getAccessibleColor = (fgColor: string, bgColor: string, minContrast = 4.5) => {
  let currentContrast = contrastRatioCalc(fgColor, bgColor);
  if (currentContrast >= minContrast) return fgColor;

  let hsl = rgbToHsl(hexToRgb(fgColor));
  const bgLum = relativeLuminance(hexToRgb(bgColor));
  const direction = bgLum > 0.5 ? -1 : 1;
  const step = 5;
  let attempts = 0;

  while (currentContrast < minContrast && attempts < 20) {
    hsl.l += direction * step;
    hsl.l = Math.max(0, Math.min(100, hsl.l));
    const newColor = rgbToHex(hslToRgb(hsl));
    currentContrast = contrastRatioCalc(newColor, bgColor);
    attempts++;
    if (hsl.l === 0 || hsl.l === 100) break;
  }

  if (currentContrast >= minContrast) return rgbToHex(hslToRgb(hsl));
  return bgLum > 0.5 ? '#000000' : '#FFFFFF';
};

function generateColors(): string[] {
  const newColors: string[] = [];
  const generatedHues = new Set<number>();
  const colorTypes = [
    { s: [60, 90], l: [60, 80] },
    { s: [80, 100], l: [40, 60] },
    { s: [70, 90], l: [20, 30] },
    { s: [20, 40], l: [80, 90] },
    { s: [50, 70], l: [50, 70] },
    { s: [90, 100], l: [10, 20] },
  ];

  while (newColors.length < 6) {
    const type = colorTypes[newColors.length % colorTypes.length];
    const hue = Math.floor(Math.random() * 360);

    let isDistinct = true;
    for (const existingHue of generatedHues) {
      if (Math.abs(existingHue - hue) < 30) {
        isDistinct = false;
        break;
      }
    }

    if (isDistinct) {
      const saturation = Math.floor(Math.random() * (type.s[1] - type.s[0]) + type.s[0]);
      const lightness = Math.floor(Math.random() * (type.l[1] - type.l[0]) + type.l[0]);
      const hsl = { h: hue, s: saturation, l: lightness };
      const hex = rgbToHex(hslToRgb(hsl));
      newColors.push(hex);
      generatedHues.add(hue);
    }
  }
  return newColors;
}

export const ColorPaletteGenerator: React.FC = () => {
  const { toast } = useToast();

  const [currentPalette, setCurrentPalette] = useState<Color[]>(() => {
    const colors = generateColors();
    return colors.map(hex => ({ hex, locked: false }));
  });
  const [exportFormat, setExportFormat] = useState<'css' | 'json' | 'array' | 'scss' | 'tailwind'>('css');
  const [showExportPreview, setShowExportPreview] = useState(false);

  const generateRandomPalette = () => {
    const newColors = generateColors();
    setCurrentPalette(prev =>
      prev.map((color, index) =>
        color.locked ? color : { hex: newColors[index] || color.hex, locked: false }
      )
    );
    toast({
      title: "New palette generated!",
      description: "Press spacebar to generate another",
    });
  };

  const toggleLock = (index: number) => {
    setCurrentPalette(prev =>
      prev.map((color, i) =>
        i === index ? { ...color, locked: !color.locked } : color
      )
    );
  };

  const makeWCAGCompliant = () => {
    const accessibleColors = currentPalette.map((color) => ({
      ...color,
      hex: getAccessibleColor(color.hex, '#FFFFFF'),
    }));
    setCurrentPalette(accessibleColors);
    toast({
      title: "Palette made WCAG compliant!",
      description: "All colors now meet accessibility standards",
    });
  };

  const getExportCode = (format: 'css' | 'json' | 'array' | 'scss' | 'tailwind') => {
    const colors = currentPalette.map(c => c.hex);
    let output = '';

    switch (format) {
      case 'css':
        output = `:root {\n${colors.map((c, i) => `  --color-${i + 1}: ${c};`).join('\n')}\n}`;
        break;
      case 'scss':
        output = `// Color Palette\n${colors.map((c, i) => `$color-${i + 1}: ${c};`).join('\n')}`;
        break;
      case 'json':
        output = JSON.stringify({ colors }, null, 2);
        break;
      case 'array':
        output = `const colors = ${JSON.stringify(colors, null, 2)};`;
        break;
      case 'tailwind':
        output = `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${colors.map((c, i) => `        'palette-${i + 1}': '${c}',`).join('\n')}\n      }\n    }\n  }\n}`;
        break;
    }
    return output;
  };

  const copyExportCode = () => {
    const code = getExportCode(exportFormat);
    navigator.clipboard.writeText(code);
    toast({
      title: `Copied ${exportFormat.toUpperCase()} code!`,
      description: "Ready to paste",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `Copied ${text}!`,
      duration: 1000,
    });
  };

  const copyAllColors = () => {
    const allColors = currentPalette.map(c => c.hex).join(' ');
    navigator.clipboard.writeText(allColors);
    toast({
      title: "All colors copied!",
      description: allColors,
    });
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space' && event.target === document.body) {
        event.preventDefault();
        generateRandomPalette();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPalette]);

  return (
    <div className="h-full w-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <div className="flex justify-end mb-4">
        <Button onClick={generateRandomPalette} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Generate New
        </Button>
      </div>      <Card className="p-6 mb-4">
        <div className="grid grid-cols-6 gap-4 mb-6">
          {currentPalette.map((color, index) => (
            <div key={index} className="space-y-2">
              <div
                className="h-32 rounded-lg shadow-lg cursor-pointer transition-transform hover:scale-105 relative group"
                style={{ backgroundColor: color.hex }}
                onClick={() => copyToClipboard(color.hex)}
              >
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
                  <Copy className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono font-semibold">{color.hex}</span>
                <button
                  onClick={() => toggleLock(index)}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                >
                  {color.locked ? (
                    <Lock className="h-4 w-4 text-purple-600" />
                  ) : (
                    <Unlock className="h-4 w-4 text-slate-400" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={copyAllColors} className="gap-2">
            <Copy className="h-4 w-4" />
            Copy All
          </Button>
          <Button variant="outline" onClick={makeWCAGCompliant} className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Make WCAG Compliant
          </Button>
          <Button
            variant={showExportPreview ? "default" : "outline"}
            onClick={() => setShowExportPreview(!showExportPreview)}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {showExportPreview ? 'Hide' : 'Show'} Export Code
          </Button>
        </div>
      </Card>

      {/* Export Code Preview */}
      {showExportPreview && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Export Code</h3>
              <div className="flex gap-2">
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as any)}
                  className="px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-sm font-medium"
                >
                  <option value="css">CSS Variables</option>
                  <option value="scss">SCSS Variables</option>
                  <option value="json">JSON</option>
                  <option value="array">JavaScript Array</option>
                  <option value="tailwind">Tailwind Config</option>
                </select>
                <Button onClick={copyExportCode} className="gap-2">
                  <Copy className="h-4 w-4" />
                  Copy Code
                </Button>
              </div>
            </div>

            {/* Code Preview */}
            <div className="relative">
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm font-mono border-2 border-slate-700 max-h-96 overflow-y-auto">
                <code>{getExportCode(exportFormat)}</code>
              </pre>
              <button
                onClick={copyExportCode}
                className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 rounded border border-slate-600 transition-colors"
                title="Copy code"
              >
                <Copy className="h-4 w-4 text-slate-300" />
              </button>
            </div>

            {/* Format Info */}
            <div className="grid grid-cols-5 gap-2">
              {[
                { format: 'css', label: 'CSS', desc: 'CSS Custom Properties' },
                { format: 'scss', label: 'SCSS', desc: 'Sass Variables' },
                { format: 'json', label: 'JSON', desc: 'JSON Object' },
                { format: 'array', label: 'JS Array', desc: 'JavaScript Constant' },
                { format: 'tailwind', label: 'Tailwind', desc: 'Tailwind Config' },
              ].map((item) => (
                <button
                  key={item.format}
                  onClick={() => setExportFormat(item.format as any)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${exportFormat === item.format
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-purple-300'
                    }`}
                >
                  <div className="font-semibold text-sm">{item.label}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      <div className="bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-300 dark:border-purple-700 rounded-lg p-4 text-center">
        <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
          💡 Tip: Press <kbd className="px-2 py-1 bg-white dark:bg-slate-800 rounded border">Spacebar</kbd> to generate a new palette
        </p>
      </div>
    </div>
  );
};
