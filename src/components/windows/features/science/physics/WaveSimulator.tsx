import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Info, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type WaveType = 'sine' | 'square' | 'triangle' | 'sawtooth';

interface WaveConfig {
  type: WaveType;
  amplitude: number;
  frequency: number;
  phase: number;
  color: string;
  enabled: boolean;
}

export const WaveSimulator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);

  // Wave configurations
  const [wave1, setWave1] = useState<WaveConfig>({
    type: 'sine',
    amplitude: 50,
    frequency: 2,
    phase: 0,
    color: '#3B82F6',
    enabled: true
  });

  const [wave2, setWave2] = useState<WaveConfig>({
    type: 'sine',
    amplitude: 50,
    frequency: 2,
    phase: 0,
    color: '#EF4444',
    enabled: true
  });

  const [showSum, setShowSum] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);

  // Wave generation functions
  const generateWave = useCallback((x: number, config: WaveConfig, time: number): number => {
    const { type, amplitude, frequency, phase } = config;
    const arg = (x * frequency * 2 * Math.PI) + (time * speed) + phase;

    switch (type) {
      case 'sine':
        return amplitude * Math.sin(arg);
      case 'square':
        return amplitude * Math.sign(Math.sin(arg));
      case 'triangle':
        return amplitude * (2 / Math.PI) * Math.asin(Math.sin(arg));
      case 'sawtooth':
        const period = 2 * Math.PI;
        const normalized = ((arg % period) + period) % period;
        return amplitude * (2 * (normalized / period) - 1);
      default:
        return 0;
    }
  }, [speed]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    updateSize();

    const draw = () => {
      if (isPlaying) {
        timeRef.current += 0.02;
      }

      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;
      const centerY = height / 2;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw grid
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.lineWidth = 1;
      for (let y = 0; y <= height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw center line
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw waves
      const drawWave = (config: WaveConfig, label: string) => {
        if (!config.enabled) return;

        ctx.strokeStyle = config.color;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 8;
        ctx.shadowColor = config.color;
        ctx.beginPath();

        for (let x = 0; x < width; x++) {
          const normalizedX = x / width;
          const y = centerY - generateWave(normalizedX, config, timeRef.current);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw label
        ctx.fillStyle = config.color;
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(label, 10, label === 'Wave 1' ? 20 : 40);
      };

      // Draw individual waves
      drawWave(wave1, 'Wave 1');
      drawWave(wave2, 'Wave 2');

      // Draw sum wave
      if (showSum && wave1.enabled && wave2.enabled) {
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 4;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#10B981';
        ctx.beginPath();

        for (let x = 0; x < width; x++) {
          const normalizedX = x / width;
          const y1 = generateWave(normalizedX, wave1, timeRef.current);
          const y2 = generateWave(normalizedX, wave2, timeRef.current);
          const y = centerY - (y1 + y2);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw sum label
        ctx.fillStyle = '#10B981';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('Sum', 10, 60);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [wave1, wave2, showSum, isPlaying, generateWave]);

  const handleReset = () => {
    timeRef.current = 0;
    setIsPlaying(false);
  };

  const updateWave1 = (updates: Partial<WaveConfig>) => {
    setWave1(prev => ({ ...prev, ...updates }));
  };

  const updateWave2 = (updates: Partial<WaveConfig>) => {
    setWave2(prev => ({ ...prev, ...updates }));
  };

  const getInterferenceInfo = () => {
    const phaseDiff = Math.abs(wave1.phase - wave2.phase) % (2 * Math.PI);
    if (phaseDiff < 0.3 || phaseDiff > 2 * Math.PI - 0.3) {
      return { type: 'Constructive', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: '📈' };
    } else if (Math.abs(phaseDiff - Math.PI) < 0.3) {
      return { type: 'Destructive', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: '📉' };
    }
    return { type: 'Partial', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', icon: '📊' };
  };

  const interference = getInterferenceInfo();

  return (
    <div className="h-full w-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white/50 dark:bg-gray-800/50 backdrop-blur">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-bold">Wave Interference Simulator</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsPlaying(!isPlaying)}
            size="sm"
            variant={isPlaying ? "default" : "outline"}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button onClick={handleReset} size="sm" variant="outline">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Canvas */}
          <Card className="flex-1 p-4 bg-white dark:bg-gray-800 min-h-0">
            <canvas
              ref={canvasRef}
              className="w-full h-full rounded-lg border-2 border-gray-200 dark:border-gray-700"
              style={{ minHeight: '300px' }}
            />
          </Card>

          {/* Quick Info Bar */}
          <Card className="p-3 bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 rounded" style={{ backgroundColor: wave1.color }}></div>
                  <span className="font-medium">Wave 1: {wave1.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 rounded" style={{ backgroundColor: wave2.color }}></div>
                  <span className="font-medium">Wave 2: {wave2.type}</span>
                </div>
                {showSum && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 rounded bg-green-500"></div>
                    <span className="font-medium">Sum</span>
                  </div>
                )}
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${interference.color}`}>
                {interference.icon} {interference.type} Interference
              </div>
            </div>
          </Card>
        </div>

        {/* Control Panel */}
        <div className="w-80 flex flex-col gap-3 overflow-y-auto">
          {/* Wave 1 Controls */}
          <Card className="p-4 border-l-4" style={{ borderLeftColor: wave1.color }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold" style={{ color: wave1.color }}>Wave 1</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wave1.enabled}
                  onChange={(e) => updateWave1({ enabled: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm">Show</span>
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Wave Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['sine', 'square', 'triangle', 'sawtooth'] as WaveType[]).map(type => (
                    <button
                      key={type}
                      onClick={() => updateWave1({ type })}
                      className={`px-3 py-2 text-xs font-medium rounded-lg border-2 transition-all ${
                        wave1.type === type
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">Amplitude</label>
                  <span className="text-sm font-mono">{wave1.amplitude}px</span>
                </div>
                <Slider
                  value={[wave1.amplitude]}
                  onValueChange={(v) => updateWave1({ amplitude: v[0] })}
                  min={10}
                  max={100}
                  step={5}
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">Frequency</label>
                  <span className="text-sm font-mono">{wave1.frequency} Hz</span>
                </div>
                <Slider
                  value={[wave1.frequency]}
                  onValueChange={(v) => updateWave1({ frequency: v[0] })}
                  min={0.5}
                  max={5}
                  step={0.5}
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">Phase Shift</label>
                  <span className="text-sm font-mono">{(wave1.phase / Math.PI).toFixed(2)}π</span>
                </div>
                <Slider
                  value={[wave1.phase]}
                  onValueChange={(v) => updateWave1({ phase: v[0] })}
                  min={0}
                  max={2 * Math.PI}
                  step={0.1}
                />
              </div>
            </div>
          </Card>

          {/* Wave 2 Controls */}
          <Card className="p-4 border-l-4" style={{ borderLeftColor: wave2.color }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold" style={{ color: wave2.color }}>Wave 2</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wave2.enabled}
                  onChange={(e) => updateWave2({ enabled: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm">Show</span>
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Wave Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['sine', 'square', 'triangle', 'sawtooth'] as WaveType[]).map(type => (
                    <button
                      key={type}
                      onClick={() => updateWave2({ type })}
                      className={`px-3 py-2 text-xs font-medium rounded-lg border-2 transition-all ${
                        wave2.type === type
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/30'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">Amplitude</label>
                  <span className="text-sm font-mono">{wave2.amplitude}px</span>
                </div>
                <Slider
                  value={[wave2.amplitude]}
                  onValueChange={(v) => updateWave2({ amplitude: v[0] })}
                  min={10}
                  max={100}
                  step={5}
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">Frequency</label>
                  <span className="text-sm font-mono">{wave2.frequency} Hz</span>
                </div>
                <Slider
                  value={[wave2.frequency]}
                  onValueChange={(v) => updateWave2({ frequency: v[0] })}
                  min={0.5}
                  max={5}
                  step={0.5}
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">Phase Shift</label>
                  <span className="text-sm font-mono">{(wave2.phase / Math.PI).toFixed(2)}π</span>
                </div>
                <Slider
                  value={[wave2.phase]}
                  onValueChange={(v) => updateWave2({ phase: v[0] })}
                  min={0}
                  max={2 * Math.PI}
                  step={0.1}
                />
              </div>
            </div>
          </Card>

          {/* Global Controls */}
          <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
            <div className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSum}
                  onChange={(e) => setShowSum(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm font-medium">Show Sum Wave (Interference)</span>
              </label>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">Animation Speed</label>
                  <span className="text-sm font-mono">{speed.toFixed(1)}x</span>
                </div>
                <Slider
                  value={[speed]}
                  onValueChange={(v) => setSpeed(v[0])}
                  min={0.1}
                  max={3}
                  step={0.1}
                />
              </div>
            </div>
          </Card>

          {/* Info Card */}
          <Card className="p-3 bg-blue-50 dark:bg-blue-900/20">
            <div className="flex gap-2">
              <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-700 dark:text-gray-300">
                Adjust wave properties to see how they interfere. Constructive interference occurs when waves align (0° phase), destructive when opposite (180° phase).
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
