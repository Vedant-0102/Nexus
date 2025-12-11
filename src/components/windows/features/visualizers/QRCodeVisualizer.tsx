import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { QrCode, Download, Play, Pause, RotateCcw, Palette } from 'lucide-react';

export const QRCodeVisualizer: React.FC = () => {
  const [text, setText] = useState('Hello, World!');
  const [size, setSize] = useState(200);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [isAnimating, setIsAnimating] = useState(false);
  const [step, setStep] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const steps = [
    'Encoding text to binary',
    'Adding error correction',
    'Creating data matrix',
    'Adding finder patterns',
    'Adding alignment patterns',
    'Adding timing patterns',
    'Finalizing QR code'
  ];

  useEffect(() => {
    if (isAnimating) {
      const interval = setInterval(() => {
        setStep(prev => {
          if (prev >= steps.length - 1) {
            setIsAnimating(false);
            return prev;
          }
          return prev + 1;
        });
      }, 800);

      return () => clearInterval(interval);
    }
  }, [isAnimating]);

  useEffect(() => {
    generateQRCode();
  }, [text, size, fgColor, bgColor, step, isAnimating]);

  const generateQRCode = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const moduleSize = 10;
    const modules = 25;
    const canvasSize = modules * moduleSize;
    
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Simple QR-like pattern
    ctx.fillStyle = fgColor;

    if (!isAnimating || step >= 3) {
      // Finder patterns (corners)
      drawFinderPattern(ctx, 0, 0, moduleSize);
      drawFinderPattern(ctx, (modules - 7) * moduleSize, 0, moduleSize);
      drawFinderPattern(ctx, 0, (modules - 7) * moduleSize, moduleSize);
    }

    if (!isAnimating || step >= 4) {
      // Alignment pattern (center-ish)
      drawAlignmentPattern(ctx, 17 * moduleSize, 17 * moduleSize, moduleSize);
    }

    if (!isAnimating || step >= 5) {
      // Timing patterns
      for (let i = 8; i < modules - 8; i++) {
        if (i % 2 === 0) {
          ctx.fillRect(i * moduleSize, 6 * moduleSize, moduleSize, moduleSize);
          ctx.fillRect(6 * moduleSize, i * moduleSize, moduleSize, moduleSize);
        }
      }
    }

    if (!isAnimating || step >= 2) {
      // Data modules (pseudo-random pattern based on text)
      const seed = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      for (let y = 0; y < modules; y++) {
        for (let x = 0; x < modules; x++) {
          // Skip finder and timing areas
          if (isFinderArea(x, y, modules) || isTimingArea(x, y)) continue;
          
          const hash = (x * 31 + y * 17 + seed) % 100;
          if (hash < 45) {
            ctx.fillRect(x * moduleSize, y * moduleSize, moduleSize, moduleSize);
          }
        }
      }
    }

    // Highlight current step
    if (isAnimating) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      
      if (step === 3) {
        ctx.strokeRect(0, 0, 7 * moduleSize, 7 * moduleSize);
      } else if (step === 4) {
        ctx.strokeRect(15 * moduleSize, 15 * moduleSize, 5 * moduleSize, 5 * moduleSize);
      } else if (step === 5) {
        ctx.strokeRect(6 * moduleSize, 0, moduleSize, canvasSize);
        ctx.strokeRect(0, 6 * moduleSize, canvasSize, moduleSize);
      }
    }
  };

  const drawFinderPattern = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    // Outer square
    ctx.fillRect(x, y, 7 * size, 7 * size);
    ctx.fillStyle = bgColor;
    ctx.fillRect(x + size, y + size, 5 * size, 5 * size);
    ctx.fillStyle = fgColor;
    ctx.fillRect(x + 2 * size, y + 2 * size, 3 * size, 3 * size);
  };

  const drawAlignmentPattern = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.fillRect(x, y, 5 * size, 5 * size);
    ctx.fillStyle = bgColor;
    ctx.fillRect(x + size, y + size, 3 * size, 3 * size);
    ctx.fillStyle = fgColor;
    ctx.fillRect(x + 2 * size, y + 2 * size, size, size);
  };

  const isFinderArea = (x: number, y: number, modules: number) => {
    return (
      (x < 8 && y < 8) ||
      (x >= modules - 8 && y < 8) ||
      (x < 8 && y >= modules - 8)
    );
  };

  const isTimingArea = (x: number, y: number) => {
    return x === 6 || y === 6;
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  const handleAnimate = () => {
    setStep(0);
    setIsAnimating(true);
  };

  const handleReset = () => {
    setStep(0);
    setIsAnimating(false);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <QrCode className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">QR Code Generator</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAnimate}
            disabled={isAnimating}
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            Animate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 flex-1">
        {/* Left Panel - Controls */}
        <Card className="p-4 space-y-4">
          <div>
            <Label htmlFor="text">Text to Encode</Label>
            <Input
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text..."
              className="mt-2"
            />
          </div>

          <div>
            <Label>Size: {size}px</Label>
            <Slider
              value={[size]}
              onValueChange={(value) => setSize(value[0])}
              min={150}
              max={400}
              step={50}
              className="mt-2"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Colors
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="fg" className="text-xs">Foreground</Label>
                <div className="flex gap-2 mt-1">
                  <input
                    id="fg"
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-12 h-8 rounded cursor-pointer"
                  />
                  <Input
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="flex-1 text-xs"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="bg" className="text-xs">Background</Label>
                <div className="flex gap-2 mt-1">
                  <input
                    id="bg"
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-12 h-8 rounded cursor-pointer"
                  />
                  <Input
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="flex-1 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-2 text-sm">Generation Steps</h3>
            <div className="space-y-2">
              {steps.map((stepText, idx) => (
                <div
                  key={idx}
                  className={`text-sm p-2 rounded transition-all ${
                    isAnimating && idx === step
                      ? 'bg-purple-100 dark:bg-purple-900 font-semibold'
                      : idx < step || !isAnimating
                      ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {idx + 1}. {stepText}
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Center Panel - QR Code Display */}
        <Card className="p-6 col-span-2 flex flex-col items-center justify-center">
          <div className="mb-4">
            <canvas
              ref={canvasRef}
              style={{ width: `${size}px`, height: `${size}px` }}
              className="border-2 border-slate-200 dark:border-slate-700 rounded-lg shadow-lg"
            />
          </div>

          {isAnimating && (
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-600 dark:text-purple-400 mb-2">
                {steps[step]}
              </div>
              <div className="w-64 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {!isAnimating && (
            <div className="text-center space-y-2">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Scan this QR code with your phone
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-500">
                Contains: "{text.substring(0, 30)}{text.length > 30 ? '...' : ''}"
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Info Panel */}
      <Card className="mt-4 p-4">
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-slate-600 dark:text-slate-400">Data Length</div>
            <div className="font-semibold mt-1">{text.length} characters</div>
          </div>
          <div>
            <div className="text-slate-600 dark:text-slate-400">Version</div>
            <div className="font-semibold mt-1">Version 2</div>
          </div>
          <div>
            <div className="text-slate-600 dark:text-slate-400">Error Correction</div>
            <div className="font-semibold mt-1">Medium (15%)</div>
          </div>
          <div>
            <div className="text-slate-600 dark:text-slate-400">Modules</div>
            <div className="font-semibold mt-1">25 × 25</div>
          </div>
        </div>
      </Card>
    </div>
  );
};
