import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, AlertCircle, Star } from 'lucide-react';

export const ContrastChecker: React.FC = () => {
  const [textColor, setTextColor] = useState('#112A46');
  const [backgroundColor, setBackgroundColor] = useState('#ACCBE5');
  const [contrastRatio, setContrastRatio] = useState(0);

  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  // Calculate relative luminance
  const getLuminance = (r: number, g: number, b: number) => {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  // Calculate contrast ratio
  const getContrastRatio = (color1: string, color2: string) => {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    if (!rgb1 || !rgb2) return 1;

    const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
  };

  // Get rating based on contrast ratio
  const getRating = (ratio: number) => {
    if (ratio >= 7) return { text: 'Excellent', stars: 5, color: '#22c55e' };
    if (ratio >= 4.5) return { text: 'Very good', stars: 4, color: '#65a30d' };
    if (ratio >= 3) return { text: 'Good', stars: 3, color: '#eab308' };
    if (ratio >= 2) return { text: 'Poor', stars: 2, color: '#f97316' };
    return { text: 'Very poor', stars: 1, color: '#ef4444' };
  };

  // Get WCAG compliance
  const getCompliance = (ratio: number) => {
    const smallText = ratio >= 4.5;
    const largeText = ratio >= 3;
    return { smallText, largeText };
  };

  useEffect(() => {
    const ratio = getContrastRatio(textColor, backgroundColor);
    setContrastRatio(ratio);
  }, [textColor, backgroundColor]);

  const rating = getRating(contrastRatio);
  const compliance = getCompliance(contrastRatio);

  const StarRating = ({ filled, total = 5 }: { filled: number; total?: number }) => (
    <div className="flex gap-1">
      {[...Array(total)].map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < filled ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-300 text-slate-300'}`}
        />
      ))}
    </div>
  );

  return (
    <div className="h-full w-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <div className="flex items-center gap-2 mb-6">
        <CheckCircle2 className="h-6 w-6 text-green-600" />
        <h2 className="text-2xl font-bold">Contrast Checker</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls Panel */}
        <div className="space-y-6">
          <Card className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Color Contrast Checker</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Test your color combinations for accessibility compliance
              </p>
            </div>

            {/* Text Color */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold uppercase">Text Color</Label>
              <div className="flex items-center gap-4">
                <Input
                  type="text"
                  value={textColor.toUpperCase()}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="flex-1 font-mono"
                  placeholder="#000000"
                />
                <div className="relative">
                  <div
                    className="w-16 h-12 border-2 rounded cursor-pointer"
                    style={{ backgroundColor: textColor }}
                    onClick={() => document.getElementById('textColorInput')?.click()}
                  />
                  <input
                    id="textColorInput"
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="absolute top-0 left-0 w-16 h-12 opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Background Color */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold uppercase">Background Color</Label>
              <div className="flex items-center gap-4">
                <Input
                  type="text"
                  value={backgroundColor.toUpperCase()}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="flex-1 font-mono"
                  placeholder="#FFFFFF"
                />
                <div className="relative">
                  <div
                    className="w-16 h-12 border-2 rounded cursor-pointer"
                    style={{ backgroundColor: backgroundColor }}
                    onClick={() => document.getElementById('bgColorInput')?.click()}
                  />
                  <input
                    id="bgColorInput"
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="opacity-0 absolute top-0 left-0 w-full h-full cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Contrast Score */}
            <Card className="p-4 border-2" style={{ borderColor: rating.color }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-black" style={{ color: rating.color }}>
                    {contrastRatio.toFixed(2)}:1
                  </div>
                  <div className="text-sm font-semibold mt-1" style={{ color: rating.color }}>
                    {rating.text.toUpperCase()}
                  </div>
                </div>
                <StarRating filled={rating.stars} />
              </div>
            </Card>

            {/* WCAG Compliance */}
            <div className="grid grid-cols-2 gap-3">
              <Card className={`p-4 text-center ${compliance.smallText ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20'}`}>
                <div className="mb-2 flex justify-center">
                  <StarRating filled={compliance.smallText ? 3 : 1} total={3} />
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 uppercase">
                  Small Text
                </div>
                <div className={`text-xs font-bold ${compliance.smallText ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {compliance.smallText ? (
                    <div className="flex items-center justify-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      PASSES AA
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      FAILS AA
                    </div>
                  )}
                </div>
              </Card>

              <Card className={`p-4 text-center ${compliance.largeText ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20'}`}>
                <div className="mb-2 flex justify-center">
                  <StarRating filled={compliance.largeText ? 3 : 1} total={3} />
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 uppercase">
                  Large Text
                </div>
                <div className={`text-xs font-bold ${compliance.largeText ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {compliance.largeText ? (
                    <div className="flex items-center justify-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      PASSES AA
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      FAILS AA
                    </div>
                  )}
                </div>
              </Card>
            </div>

            <div className="text-xs text-slate-700 dark:text-slate-300 bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-300 dark:border-yellow-700 p-3 rounded">
              <strong className="font-bold">WCAG GUIDELINES:</strong> Small text needs 4.5:1 ratio, large text needs 3:1 ratio for AA compliance. Large text is 18pt+ or 14pt+ bold.
            </div>
          </Card>
        </div>

        {/* Preview Panel */}
        <Card
          className="p-8 flex items-center justify-center relative overflow-hidden"
          style={{
            backgroundColor: backgroundColor,
            backgroundImage: `radial-gradient(circle at 25px 25px, rgba(255,255,255,0.1) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(255,255,255,0.05) 2%, transparent 0%)`,
            backgroundSize: '100px 100px',
          }}
        >
          <div className="text-center max-w-sm">
            <div className="text-xl font-bold mb-4" style={{ color: textColor }}>
              Quote n. 14
            </div>
            <blockquote className="text-base leading-relaxed mb-4 italic" style={{ color: textColor }}>
              "Work like you don't need money, love like you've never been hurt, and dance like no one's watching."
            </blockquote>
            <div className="text-sm font-medium" style={{ color: textColor, opacity: 0.8 }}>
              Unknown Author
            </div>
            <div className="mt-8 space-y-3">
              <div className="text-sm" style={{ color: textColor }}>
                Small text example (14px)
              </div>
              <div className="text-lg font-semibold" style={{ color: textColor }}>
                Large text example (18px)
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
