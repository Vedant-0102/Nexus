import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { 
  Palette, 
  Shuffle, 
  TrendingUp, 
  CheckCircle2, 
  Code, 
  Eye,
  Download,
  Copy,
  Lock,
  Unlock,
  RefreshCw
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
  return (
    '#' +
    [r, g, b]
      .map((x) => Math.round(x).toString(16).padStart(2, '0'))
      .join('')
  );
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

const rgbToHsl = ({ r, g, b }: { r: number; g: number; b: number }) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
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
    { s: [60, 90], l: [60, 80] }, // Pastel
    { s: [80, 100], l: [40, 60] }, // Vibrant
    { s: [70, 90], l: [20, 30] }, // Dark, but saturated
    { s: [20, 40], l: [80, 90] }, // Muted/Light
    { s: [50, 70], l: [50, 70] }, // Balanced
    { s: [90, 100], l: [10, 20] }, // Deep & dark
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

export const ColorPaletteTool: React.FC = () => {
  const { toast } = useToast();
  
  const [currentPalette, setCurrentPalette] = useState<Color[]>(() => {
    const colors = generateColors();
    return colors.map(hex => ({ hex, locked: false }));
  });

  const [contrastColor1, setContrastColor1] = useState('#000000');
  const [contrastColor2, setContrastColor2] = useState('#FFFFFF');
  const [hexInput, setHexInput] = useState('');
  const [parsedColors, setParsedColors] = useState<string[]>([]);

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

  const parseHexCodes = () => {
    const hexPattern = /#?([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})/g;
    const matches = hexInput.match(hexPattern);
    
    if (matches) {
      const parsed = matches.map(hex => hex.startsWith('#') ? hex : `#${hex}`);
      setParsedColors(parsed);
      toast({
        title: `Parsed ${parsed.length} colors!`,
        description: "Click any color to copy",
      });
    } else {
      toast({
        title: "No valid hex codes found",
        description: "Try format: #FF6B6B or FF6B6B",
        variant: "destructive",
      });
    }
  };

  const exportPalette = (format: 'css' | 'json' | 'array') => {
    const colors = currentPalette.map(c => c.hex);
    let output = '';

    switch (format) {
      case 'css':
        output = `:root {\n${colors.map((c, i) => `  --color-${i + 1}: ${c};`).join('\n')}\n}`;
        break;
      case 'json':
        output = JSON.stringify({ colors }, null, 2);
        break;
      case 'array':
        output = `const colors = ${JSON.stringify(colors)};`;
        break;
    }

    navigator.clipboard.writeText(output);
    toast({
      title: `Exported as ${format.toUpperCase()}!`,
      description: "Copied to clipboard",
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

  // Spacebar to generate
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

  const contrastRatio = contrastRatioCalc(contrastColor1, contrastColor2);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Palette className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Color Palette Tool</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={generateRandomPalette}
            className="gap-2"
          >
            <Shuffle className="h-4 w-4" />
            Generate Random
          </Button>
        </div>
      </div>

      <Tabs defaultValue="generator" className="flex-1">
        <TabsList className="grid w-full grid-cols-5 mb-4">
          <TabsTrigger value="generator" className="gap-2">
            <Shuffle className="h-4 w-4" />
            Generator
          </TabsTrigger>
          <TabsTrigger value="trending" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="contrast" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Contrast
          </TabsTrigger>
          <TabsTrigger value="parser" className="gap-2">
            <Code className="h-4 w-4" />
            Parser
          </TabsTrigger>
          <TabsTrigger value="visualizer" className="gap-2">
            <Eye className="h-4 w-4" />
            Visualizer
          </TabsTrigger>
        </TabsList>

        {/* Random Palette Generator Tab */}
        <TabsContent value="generator" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Random Palette Generator</h3>
              <Button onClick={generateRandomPalette} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Generate New
              </Button>
            </div>

            {/* Color Palette Display */}
            <div className="grid grid-cols-5 gap-4 mb-6">
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

            {/* Export Options */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={copyAllColors} className="gap-2">
                <Copy className="h-4 w-4" />
                Copy All
              </Button>
              <Button variant="outline" onClick={makeWCAGCompliant} className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Make WCAG Compliant
              </Button>
              <Button variant="outline" onClick={() => exportPalette('css')} className="gap-2">
                <Download className="h-4 w-4" />
                Export CSS
              </Button>
              <Button variant="outline" onClick={() => exportPalette('json')} className="gap-2">
                <Download className="h-4 w-4" />
                Export JSON
              </Button>
              <Button variant="outline" onClick={() => exportPalette('array')} className="gap-2">
                <Download className="h-4 w-4" />
                Export Array
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Trending Palettes Tab */}
        <TabsContent value="trending" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Trending Palettes</h3>
            <div className="text-center text-slate-500 py-8">
              Component 2: TrendingPalettes - Provide code next
            </div>
          </Card>
        </TabsContent>

        {/* Contrast Checker Tab */}
        <TabsContent value="contrast" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Contrast Checker</h3>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Color 1 */}
              <div className="space-y-3">
                <Label>Foreground Color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={contrastColor1}
                    onChange={(e) => setContrastColor1(e.target.value)}
                    className="w-16 h-16 rounded cursor-pointer"
                  />
                  <Input
                    value={contrastColor1}
                    onChange={(e) => setContrastColor1(e.target.value)}
                    className="flex-1 font-mono"
                    placeholder="#000000"
                  />
                </div>
              </div>

              {/* Color 2 */}
              <div className="space-y-3">
                <Label>Background Color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={contrastColor2}
                    onChange={(e) => setContrastColor2(e.target.value)}
                    className="w-16 h-16 rounded cursor-pointer"
                  />
                  <Input
                    value={contrastColor2}
                    onChange={(e) => setContrastColor2(e.target.value)}
                    className="flex-1 font-mono"
                    placeholder="#FFFFFF"
                  />
                </div>
              </div>
            </div>

            {/* Contrast Results */}
            <div className="space-y-4">
              <div className="text-center p-6 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <div className="text-4xl font-bold mb-2">{contrastRatio.toFixed(2)}:1</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Contrast Ratio</div>
              </div>

              {/* WCAG Compliance */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="font-semibold mb-2">Normal Text</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className={`h-4 w-4 ${contrastRatio >= 4.5 ? 'text-green-500' : 'text-red-500'}`} />
                      <span>AA: {contrastRatio >= 4.5 ? 'Pass' : 'Fail'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className={`h-4 w-4 ${contrastRatio >= 7 ? 'text-green-500' : 'text-red-500'}`} />
                      <span>AAA: {contrastRatio >= 7 ? 'Pass' : 'Fail'}</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="font-semibold mb-2">Large Text</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className={`h-4 w-4 ${contrastRatio >= 3 ? 'text-green-500' : 'text-red-500'}`} />
                      <span>AA: {contrastRatio >= 3 ? 'Pass' : 'Fail'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className={`h-4 w-4 ${contrastRatio >= 4.5 ? 'text-green-500' : 'text-red-500'}`} />
                      <span>AAA: {contrastRatio >= 4.5 ? 'Pass' : 'Fail'}</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Preview */}
              <div
                className="p-8 rounded-lg text-center"
                style={{ backgroundColor: contrastColor2, color: contrastColor1 }}
              >
                <div className="text-2xl font-bold mb-2">Preview Text</div>
                <div className="text-base">This is how your text will look</div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Hex Code Parser Tab */}
        <TabsContent value="parser" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Hex Code Parser</h3>
            
            <div className="space-y-4">
              <div>
                <Label>Enter Hex Codes (comma or space separated)</Label>
                <textarea
                  value={hexInput}
                  onChange={(e) => setHexInput(e.target.value)}
                  className="w-full h-32 mt-2 p-3 border rounded-lg font-mono text-sm"
                  placeholder="#FF6B6B, #4ECDC4, #45B7D1 or FF6B6B 4ECDC4 45B7D1"
                />
                <div className="text-xs text-slate-500 mt-1">
                  {hexInput.length} characters
                </div>
              </div>

              <Button onClick={parseHexCodes} className="w-full gap-2">
                <Code className="h-4 w-4" />
                Parse Colors
              </Button>

              {parsedColors.length > 0 && (
                <div className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    {parsedColors.map((color, index) => (
                      <div
                        key={index}
                        className="w-20 h-20 rounded-lg shadow cursor-pointer"
                        style={{ backgroundColor: color }}
                        onClick={() => copyToClipboard(color)}
                        title={color}
                      />
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      Export CSS
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      Export JSON
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Palette Visualizer Tab */}
        <TabsContent value="visualizer" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Palette Visualizer</h3>
            <div className="text-center text-slate-500 py-8">
              Component 6: PaletteVisualizer - Provide code later
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
