import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Upload, Play, Pause, RotateCcw, Layers, Image as ImageIcon, Info, ChevronDown, ChevronUp, AlertCircle, Zap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Layer {
  type: 'conv' | 'pool' | 'fc' | 'relu' | 'dropout';
  name: string;
  inputShape: number[];
  outputShape: number[];
  filters?: number;
  kernelSize?: number;
  stride?: number;
  description: string;
  detailed?: string;
}

const sampleLayers: Layer[] = [
  { type: 'conv', name: 'Conv2D-1 (32 filters)', inputShape: [28, 28, 1], outputShape: [26, 26, 32], filters: 32, kernelSize: 3, stride: 1, description: 'Extracts low-level features like edges and corners', detailed: 'Uses 32 3×3 filters to detect edges, gradients, and patterns. Each filter scans the image looking for specific features.' },
  { type: 'relu', name: 'ReLU Activation', inputShape: [26, 26, 32], outputShape: [26, 26, 32], description: 'Activation function: Rectified Linear Unit', detailed: 'Applies max(0, x) to introduce non-linearity, allowing the network to learn complex patterns.' },
  { type: 'pool', name: 'MaxPool (2×2)', inputShape: [26, 26, 32], outputShape: [13, 13, 32], kernelSize: 2, stride: 2, description: 'Reduces spatial dimensions, keeps important features', detailed: 'Takes the maximum value from each 2×2 region, reducing computation and helping with translation invariance.' },
  { type: 'conv', name: 'Conv2D-2 (64 filters)', inputShape: [13, 13, 32], outputShape: [11, 11, 64], filters: 64, kernelSize: 3, stride: 1, description: 'Detects mid-level features like shapes and patterns', detailed: 'Second convolutional layer with 64 filters detects more complex patterns by combining features from the first layer.' },
  { type: 'relu', name: 'ReLU Activation', inputShape: [11, 11, 64], outputShape: [11, 11, 64], description: 'Activation function: max(0, x)', detailed: 'Another ReLU layer to add non-linearity after the second convolution.' },
  { type: 'pool', name: 'MaxPool (2×2)', inputShape: [11, 11, 64], outputShape: [5, 5, 64], kernelSize: 2, stride: 2, description: 'Further spatial reduction', detailed: 'Second pooling layer reduces dimensions again, keeping only the most important features.' },
  { type: 'fc', name: 'Flatten', inputShape: [5, 5, 64], outputShape: [1600], description: 'Converts 3D to 1D', detailed: 'Reshapes 5×5×64 = 1600 values into a single vector for fully connected layers.' },
  { type: 'fc', name: 'Dense Layer (128)', inputShape: [1600], outputShape: [128], description: 'Learns complex combinations of features', detailed: '1600 inputs → 128 neurons. Learns sophisticated patterns from all extracted features.' },
  { type: 'dropout', name: 'Dropout (0.5)', inputShape: [128], outputShape: [128], description: 'Prevents overfitting during training', detailed: 'Randomly deactivates 50% of neurons during training to reduce co-adaptation and improve generalization.' },
  { type: 'fc', name: 'Output Layer (10)', inputShape: [128], outputShape: [10], description: 'One neuron per digit class (0-9)', detailed: 'Final layer with 10 neurons - one for each digit. Applies softmax for probability distribution.' },
];

export const CNNVisualizer: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentLayer, setCurrentLayer] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(50);
  const [expandedLayer, setExpandedLayer] = useState<number | null>(null);
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
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
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

    // Draw input image for first layer
    if (selectedImage && currentLayer === 0) {
      const img = new Image();
      img.onload = () => {
        const size = 180;
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw rounded rect with border
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(centerX - size / 2, centerY - size / 2, size, size, 12);
        ctx.stroke();
        
        ctx.drawImage(img, centerX - size / 2, centerY - size / 2, size, size);
        
        // Add label
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Input Image', centerX, centerY + 110);
        ctx.font = '13px sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText('28×28 pixels (grayscale)', centerX, centerY + 130);
      };
      img.onerror = () => {
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Error loading image', centerX, centerY);
      };
      img.src = selectedImage;
    } else {
      // Draw feature maps with animation
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const numMaps = Math.min(layer.outputShape[2] || 1, 16);
      const mapSize = 60;
      const gap = 15;
      const cols = Math.ceil(Math.sqrt(numMaps));
      const rows = Math.ceil(numMaps / cols);
      
      const totalWidth = cols * (mapSize + gap) - gap;
      const totalHeight = rows * (mapSize + gap) - gap;
      const startX = centerX - totalWidth / 2;
      const startY = centerY - totalHeight / 2 + 20;

      // Draw layer type indicator with icon
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(layer.name, centerX, 35);

      ctx.font = '13px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(`Output: ${layer.outputShape.join(' × ')} | Filters: ${numMaps}`, centerX, 55);

      for (let i = 0; i < numMaps; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = startX + col * (mapSize + gap);
        const y = startY + row * (mapSize + gap);

        // Animated feature map with color gradient
        const gradient = ctx.createLinearGradient(x, y, x + mapSize, y + mapSize);
        const hue = (i * 360 / numMaps + currentLayer * 30) % 360;
        gradient.addColorStop(0, `hsla(${hue}, 75%, 55%, 0.95)`);
        gradient.addColorStop(1, `hsla(${(hue + 60) % 360}, 75%, 35%, 0.95)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, mapSize, mapSize, 4);
        ctx.fill();
        
        // Border
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Add activation pattern with animation
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(Date.now() / 500 + i) * 0.2})`;
        for (let j = 0; j < 12; j++) {
          const angle = (j / 12) * Math.PI * 2 + Date.now() / 5000;
          const px = x + mapSize / 2 + Math.cos(angle) * (mapSize / 3);
          const py = y + mapSize / 2 + Math.sin(angle) * (mapSize / 3);
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Index label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`F${i + 1}`, x + mapSize / 2, y + mapSize / 2);
      }

      // Layer shape info at bottom
      ctx.fillStyle = '#64748b';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        `Input: ${layer.inputShape.join('×')} → Output: ${layer.outputShape.join('×')}`,
        centerX,
        canvas.height - 20
      );
    }

    // Draw animation loop for continuous updates
    requestAnimationFrame(() => {
      if (currentLayer >= 3 && currentLayer <= 7) {
        drawVisualization();
      }
    });
  };

  const handleReset = () => {
    setCurrentLayer(0);
    setIsPlaying(false);
  };

  const loadDemoImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 28;
    canvas.height = 28;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 28, 28);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('7', 14, 14);

    setSelectedImage(canvas.toDataURL());
    setCurrentLayer(0);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 via-slate-800 dark:to-slate-900 overflow-hidden">
      {/* Action Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-blue-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-lg">
        <span className="text-xs text-slate-500 dark:text-slate-400">Layer {currentLayer + 1} of {sampleLayers.length}</span>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsPlaying(!isPlaying)} size="sm" variant="outline" className="hover:bg-blue-50 dark:hover:bg-blue-900/30">
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button onClick={handleReset} size="sm" variant="outline" className="hover:bg-slate-100 dark:hover:bg-slate-700">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="visualizer" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-4 mt-2 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <TabsTrigger value="visualizer" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900">
            <Zap className="h-4 w-4 mr-2" />
            Interactive
          </TabsTrigger>
          <TabsTrigger value="architecture" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900">
            <Layers className="h-4 w-4 mr-2" />
            Architecture
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visualizer" className="flex-1 flex flex-col overflow-hidden mt-0">
          <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-3 gap-6 p-4 h-full">
              {/* Canvas */}
              <div className="col-span-2 flex flex-col">
                <Card className="flex-1 flex items-center justify-center bg-white dark:bg-slate-800 border-2 border-blue-200 dark:border-slate-700">
                  <canvas
                    ref={canvasRef}
                    width={700}
                    height={500}
                    className="rounded-lg"
                  />
                </Card>
                
                {/* Speed Control */}
                <Card className="mt-4 p-4 bg-white/80 dark:bg-slate-800/80 border-0 shadow-lg">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold dark:text-white min-w-20">Speed:</span>
                    <Slider value={[speed]} onValueChange={(v) => setSpeed(v[0])} min={1} max={100} step={1} className="flex-1" />
                    <span className="text-sm font-mono font-bold dark:text-white min-w-12">{speed}%</span>
                  </div>
                </Card>
              </div>

              {/* Layer Info */}
              <div className="flex flex-col gap-4 overflow-auto">
                <Card className="p-4 bg-white/80 dark:bg-slate-800/80 border-0 shadow-lg">
                  <label className="block text-sm font-bold mb-3 dark:text-white">📸 Input Image</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="space-y-2">
                    <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full text-xs font-semibold">
                      <Upload className="h-3 w-3 mr-2" />
                      Upload Image
                    </Button>
                    <Button onClick={loadDemoImage} variant="outline" className="w-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100">
                      <ImageIcon className="h-3 w-3 mr-2" />
                      Demo Image
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center p-2 bg-slate-100 dark:bg-slate-700 rounded">💡 28×28 pixels recommended</p>
                </Card>

                {/* Layers List */}
                <div className="flex-1 overflow-auto">
                  <h3 className="text-sm font-bold mb-2 dark:text-white px-2">🏗️ Network Layers ({sampleLayers.length})</h3>
                  <div className="space-y-2 pr-2">
                    {sampleLayers.map((layer, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setCurrentLayer(idx);
                          setExpandedLayer(expandedLayer === idx ? null : idx);
                        }}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-all text-xs font-semibold ${
                          currentLayer === idx
                            ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-500 dark:border-blue-400 shadow-md'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold dark:text-white">{idx + 1}. {layer.name}</span>
                          {expandedLayer === idx ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </div>
                        {expandedLayer === idx && (
                          <div className="mt-2 pt-2 border-t border-slate-300 dark:border-slate-600 space-y-1 text-xs text-slate-700 dark:text-slate-400">
                            <p><strong>Type:</strong> {layer.type.toUpperCase()}</p>
                            <p><strong>Input:</strong> {layer.inputShape.join(' × ')}</p>
                            <p><strong>Output:</strong> {layer.outputShape.join(' × ')}</p>
                            {layer.kernelSize && <p><strong>Kernel:</strong> {layer.kernelSize}×{layer.kernelSize}</p>}
                            {layer.filters && <p><strong>Filters:</strong> {layer.filters}</p>}
                            <p className="italic mt-2 p-2 bg-slate-100 dark:bg-slate-700 rounded text-slate-800 dark:text-slate-300">{layer.detailed || layer.description}</p>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Info Box */}
                <Card className="p-3 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 border-l-4 border-l-blue-500">
                  <div className="flex gap-2">
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-800 dark:text-blue-300">
                      <p className="font-bold mb-1">📊 CNN Overview</p>
                      <p>Convolutional Neural Networks detect patterns through layers of filters and transformations, learning to recognize digits 0-9 from handwritten digits.</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="architecture" className="flex-1 overflow-auto mt-0 p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <Alert className="border-2 border-indigo-200 bg-indigo-50 dark:bg-indigo-900/20">
              <AlertCircle className="h-4 w-4" />
              <div>
                <h3 className="font-bold mb-1">Learn about Convolutional Neural Networks</h3>
                <p className="text-sm">This CNN is trained on the MNIST dataset to classify handwritten digits 0-9. Each layer below transforms the input step by step.</p>
              </div>
            </Alert>

            <div className="space-y-4">
              {sampleLayers.map((layer, idx) => (
                <Card key={idx} className="p-4 border-l-4 border-l-blue-500 hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold text-sm flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 dark:text-white">{layer.name}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{layer.description}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded font-mono text-slate-700 dark:text-slate-300">
                          {layer.inputShape.join('×')} → {layer.outputShape.join('×')}
                        </span>
                        {layer.filters && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded text-blue-700 dark:text-blue-300 font-semibold">
                            {layer.filters} filters
                          </span>
                        )}
                        {layer.kernelSize && (
                          <span className="text-xs bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded text-purple-700 dark:text-purple-300 font-semibold">
                            {layer.kernelSize}×{layer.kernelSize} kernel
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 p-2 bg-slate-50 dark:bg-slate-700 rounded italic">{layer.detailed}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

function Alert({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-4 rounded-lg ${className}`}>{children}</div>;
}
