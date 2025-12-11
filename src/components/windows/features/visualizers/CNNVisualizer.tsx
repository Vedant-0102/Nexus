import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Upload, Play, Pause, RotateCcw, Layers, Image as ImageIcon } from 'lucide-react';

interface Layer {
  type: 'conv' | 'pool' | 'fc';
  name: string;
  inputShape: number[];
  outputShape: number[];
  filters?: number;
  kernelSize?: number;
  stride?: number;
}

const sampleLayers: Layer[] = [
  { type: 'conv', name: 'Conv2D-1', inputShape: [28, 28, 1], outputShape: [26, 26, 32], filters: 32, kernelSize: 3, stride: 1 },
  { type: 'pool', name: 'MaxPool-1', inputShape: [26, 26, 32], outputShape: [13, 13, 32], kernelSize: 2, stride: 2 },
  { type: 'conv', name: 'Conv2D-2', inputShape: [13, 13, 32], outputShape: [11, 11, 64], filters: 64, kernelSize: 3, stride: 1 },
  { type: 'pool', name: 'MaxPool-2', inputShape: [11, 11, 64], outputShape: [5, 5, 64], kernelSize: 2, stride: 2 },
  { type: 'fc', name: 'Flatten', inputShape: [5, 5, 64], outputShape: [1600] },
  { type: 'fc', name: 'Dense-1', inputShape: [1600], outputShape: [128] },
  { type: 'fc', name: 'Dense-2', inputShape: [128], outputShape: [10] },
];

export const CNNVisualizer: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentLayer, setCurrentLayer] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(50);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentLayer(prev => {
          if (prev >= sampleLayers.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2000 - (speed * 15));

      return () => clearInterval(interval);
    }
  }, [isPlaying, speed]);

  useEffect(() => {
    drawVisualization();
  }, [currentLayer, selectedImage]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setCurrentLayer(0);
      };
      reader.readAsDataURL(file);
    }
  };

  const drawVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const layer = sampleLayers[currentLayer];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Draw input image or feature map
    if (selectedImage && currentLayer === 0) {
      const img = new Image();
      img.onload = () => {
        const size = 150;
        ctx.drawImage(img, centerX - size / 2, centerY - size / 2, size, size);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.strokeRect(centerX - size / 2, centerY - size / 2, size, size);
      };
      img.src = selectedImage;
    } else {
      // Draw feature maps
      const numMaps = Math.min(layer.outputShape[2] || 1, 16);
      const mapSize = 40;
      const gap = 10;
      const cols = Math.ceil(Math.sqrt(numMaps));
      const rows = Math.ceil(numMaps / cols);
      
      const totalWidth = cols * (mapSize + gap) - gap;
      const totalHeight = rows * (mapSize + gap) - gap;
      const startX = centerX - totalWidth / 2;
      const startY = centerY - totalHeight / 2;

      for (let i = 0; i < numMaps; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = startX + col * (mapSize + gap);
        const y = startY + row * (mapSize + gap);

        // Random feature map visualization
        const gradient = ctx.createLinearGradient(x, y, x + mapSize, y + mapSize);
        const hue = (i * 360 / numMaps) % 360;
        gradient.addColorStop(0, `hsla(${hue}, 70%, 60%, 0.8)`);
        gradient.addColorStop(1, `hsla(${hue + 60}, 70%, 40%, 0.8)`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, mapSize, mapSize);
        
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, mapSize, mapSize);

        // Add some random patterns to simulate activations
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let j = 0; j < 5; j++) {
          const px = x + Math.random() * mapSize;
          const py = y + Math.random() * mapSize;
          ctx.fillRect(px, py, 3, 3);
        }
      }
    }

    // Draw layer info
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(layer.name, centerX, 30);

    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#64748b';
    const shapeText = layer.type === 'fc' 
      ? `Output: ${layer.outputShape.join(' × ')}`
      : `Output: ${layer.outputShape.join(' × ')}`;
    ctx.fillText(shapeText, centerX, canvas.height - 20);
  };

  const handleReset = () => {
    setCurrentLayer(0);
    setIsPlaying(false);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const layer = sampleLayers[currentLayer];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">CNN Visualizer</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload Image
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handlePlayPause}
            className="gap-2"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isPlaying ? 'Pause' : 'Play'}
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
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 flex-1">
        {/* Left Panel - Network Architecture */}
        <Card className="p-4 overflow-y-auto">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Network Architecture
          </h3>
          <div className="space-y-2">
            {sampleLayers.map((layer, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  idx === currentLayer
                    ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                onClick={() => setCurrentLayer(idx)}
              >
                <div className="font-medium text-sm">{layer.name}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {layer.type === 'conv' && `${layer.filters} filters, ${layer.kernelSize}×${layer.kernelSize}`}
                  {layer.type === 'pool' && `${layer.kernelSize}×${layer.kernelSize} pooling`}
                  {layer.type === 'fc' && `Fully Connected`}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  {layer.outputShape.join(' × ')}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Center Panel - Visualization */}
        <Card className="p-4 col-span-2 flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={600}
              height={400}
              className="border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
            />
          </div>

          {/* Controls */}
          <div className="mt-4 space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Animation Speed</span>
                <span className="text-sm text-slate-600 dark:text-slate-400">{speed}%</span>
              </div>
              <Slider
                value={[speed]}
                onValueChange={(value) => setSpeed(value[0])}
                min={10}
                max={100}
                step={10}
                className="w-full"
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Layer Progress</span>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {currentLayer + 1} / {sampleLayers.length}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentLayer + 1) / sampleLayers.length) * 100}%` }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom Info Panel */}
      <Card className="mt-4 p-4">
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-slate-600 dark:text-slate-400">Layer Type</div>
            <div className="font-semibold mt-1">
              {layer.type === 'conv' && 'Convolutional'}
              {layer.type === 'pool' && 'Max Pooling'}
              {layer.type === 'fc' && 'Fully Connected'}
            </div>
          </div>
          <div>
            <div className="text-slate-600 dark:text-slate-400">Input Shape</div>
            <div className="font-semibold mt-1">{layer.inputShape.join(' × ')}</div>
          </div>
          <div>
            <div className="text-slate-600 dark:text-slate-400">Output Shape</div>
            <div className="font-semibold mt-1">{layer.outputShape.join(' × ')}</div>
          </div>
          <div>
            <div className="text-slate-600 dark:text-slate-400">Parameters</div>
            <div className="font-semibold mt-1">
              {layer.filters ? `${layer.filters} filters` : 'N/A'}
            </div>
          </div>
        </div>
      </Card>

      {!selectedImage && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="p-8 text-center max-w-md">
            <ImageIcon className="h-16 w-16 mx-auto mb-4 text-slate-400" />
            <h3 className="text-xl font-semibold mb-2">Upload an Image</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Upload an image to see how a CNN processes it through different layers
            </p>
            <Button onClick={() => fileInputRef.current?.click()} className="gap-2">
              <Upload className="h-4 w-4" />
              Choose Image
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
};
