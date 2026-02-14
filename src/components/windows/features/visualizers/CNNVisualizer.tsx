import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Upload, Play, Pause, RotateCcw, Image as ImageIcon, Layers, Info, Zap, ArrowRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Kernel {
  name: string;
  matrix: number[][];
  description: string;
}

interface FeatureMap {
  data: Float32Array;
  width: number;
  height: number;
  label: string;
}

interface LayerOutput {
  name: string;
  type: 'input' | 'conv' | 'relu' | 'pool' | 'flatten' | 'dense' | 'dropout' | 'output';
  maps: FeatureMap[];
  description: string;
  detail: string;
  inputShape: string;
  outputShape: string;
  kernels?: Kernel[];
  activations?: number[];
  classLabels?: string[];
}

// ─── Kernels ────────────────────────────────────────────────────────────────

const CONV1_KERNELS: Kernel[] = [
  { name: 'Horizontal', matrix: [[-1, -1, -1], [0, 0, 0], [1, 1, 1]], description: 'Horizontal edges' },
  { name: 'Vertical', matrix: [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]], description: 'Vertical edges' },
  { name: 'Diagonal ↘', matrix: [[0, 1, 1], [-1, 0, 1], [-1, -1, 0]], description: 'Diagonal edges' },
  { name: 'Diagonal ↗', matrix: [[1, 1, 0], [1, 0, -1], [0, -1, -1]], description: 'Reverse diagonal' },
  { name: 'Sharpen', matrix: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]], description: 'Sharpens features' },
  { name: 'Laplacian', matrix: [[0, 1, 0], [1, -4, 1], [0, 1, 0]], description: 'All-direction edges' },
  { name: 'Emboss', matrix: [[-2, -1, 0], [-1, 1, 1], [0, 1, 2]], description: 'Emboss effect' },
  { name: 'Blur', matrix: [[1, 2, 1], [2, 4, 2], [1, 2, 1]], description: 'Gaussian blur' },
];

const CONV2_KERNELS: Kernel[] = [
  { name: 'Sobel H', matrix: [[1, 0, -1], [2, 0, -2], [1, 0, -1]], description: 'Fine horizontal' },
  { name: 'Sobel V', matrix: [[1, 2, 1], [0, 0, 0], [-1, -2, -1]], description: 'Fine vertical' },
  { name: 'Corner', matrix: [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]], description: 'Corner detection' },
  { name: 'Ridge', matrix: [[-1, -1, -1], [2, 2, 2], [-1, -1, -1]], description: 'Ridge detection' },
  { name: 'Texture', matrix: [[1, -2, 1], [-2, 4, -2], [1, -2, 1]], description: 'Texture patterns' },
  { name: 'Prewitt', matrix: [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]], description: 'Prewitt gradient' },
  { name: 'Gradient', matrix: [[0, 1, 0], [1, -4, 1], [0, 1, 0]], description: 'Multi-gradient' },
  { name: 'Smooth', matrix: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], description: 'Box blur' },
];

// ─── Image Processing ───────────────────────────────────────────────────────

function imageToGrayscale(imgData: ImageData): Float32Array {
  const { width, height, data } = imgData;
  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    gray[i] = (0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]) / 255;
  }
  return gray;
}

function conv2d(
  input: Float32Array, w: number, h: number, kernel: number[][]
): { data: Float32Array; w: number; h: number } {
  const ks = kernel.length;
  const pad = Math.floor(ks / 2);
  const ow = w - 2 * pad;
  const oh = h - 2 * pad;
  if (ow <= 0 || oh <= 0) return { data: new Float32Array(0), w: 0, h: 0 };
  const out = new Float32Array(ow * oh);
  for (let y = 0; y < oh; y++) {
    for (let x = 0; x < ow; x++) {
      let sum = 0;
      for (let ky = 0; ky < ks; ky++) {
        for (let kx = 0; kx < ks; kx++) {
          sum += input[(y + ky) * w + (x + kx)] * kernel[ky][kx];
        }
      }
      out[y * ow + x] = sum;
    }
  }
  return { data: out, w: ow, h: oh };
}

function applyRelu(input: Float32Array): Float32Array {
  const out = new Float32Array(input.length);
  for (let i = 0; i < input.length; i++) out[i] = Math.max(0, input[i]);
  return out;
}

function maxPool2x2(
  input: Float32Array, w: number, h: number
): { data: Float32Array; w: number; h: number } {
  const ow = Math.floor(w / 2);
  const oh = Math.floor(h / 2);
  const out = new Float32Array(ow * oh);
  for (let y = 0; y < oh; y++) {
    for (let x = 0; x < ow; x++) {
      const i = y * 2 * w + x * 2;
      out[y * ow + x] = Math.max(input[i], input[i + 1], input[i + w], input[i + w + 1]);
    }
  }
  return { data: out, w: ow, h: oh };
}

function computeStats(data: Float32Array): { min: number; max: number; mean: number; std: number } {
  if (data.length === 0) return { min: 0, max: 0, mean: 0, std: 0 };
  let min = Infinity, max = -Infinity, sum = 0;
  for (let i = 0; i < data.length; i++) {
    if (data[i] < min) min = data[i];
    if (data[i] > max) max = data[i];
    sum += data[i];
  }
  const mean = sum / data.length;
  let variance = 0;
  for (let i = 0; i < data.length; i++) variance += (data[i] - mean) ** 2;
  return { min, max, mean, std: Math.sqrt(variance / data.length) };
}

function softmax(values: number[]): number[] {
  const maxVal = Math.max(...values);
  const exps = values.map(v => Math.exp(v - maxVal));
  const total = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / total);
}

function processAllLayers(grayscale: Float32Array, imgW: number, imgH: number): LayerOutput[] {
  const layers: LayerOutput[] = [];

  // 0: Input
  layers.push({
    name: 'Input',
    type: 'input',
    maps: [{ data: grayscale, width: imgW, height: imgH, label: 'Grayscale' }],
    description: 'Original input converted to grayscale',
    detail: 'Raw pixel intensities (0 = black, 1 = white) are fed into the network. MNIST standard is 28×28 pixels.',
    inputShape: `${imgW}×${imgH}×1`,
    outputShape: `${imgW}×${imgH}×1`,
  });

  // 1: Conv2D-1
  const conv1Maps: FeatureMap[] = CONV1_KERNELS.map(k => {
    const r = conv2d(grayscale, imgW, imgH, k.matrix);
    return { data: r.data, width: r.w, height: r.h, label: k.name };
  });
  const c1w = conv1Maps[0]?.width ?? 0;
  const c1h = conv1Maps[0]?.height ?? 0;
  layers.push({
    name: 'Conv2D-1',
    type: 'conv',
    maps: conv1Maps,
    description: 'Each 3×3 filter slides across the image detecting low-level features',
    detail: '8 different 3×3 kernels are convolved with the input. Each kernel detects a specific pattern: horizontal edges, vertical edges, diagonals, corners. The output shows what each filter "sees".',
    inputShape: `${imgW}×${imgH}×1`,
    outputShape: `${c1w}×${c1h}×8`,
    kernels: CONV1_KERNELS,
  });

  // 2: ReLU
  const relu1Maps: FeatureMap[] = conv1Maps.map(m => ({
    data: applyRelu(m.data), width: m.width, height: m.height, label: m.label,
  }));
  layers.push({
    name: 'ReLU',
    type: 'relu',
    maps: relu1Maps,
    description: 'Applies max(0, x) — removes negative activations',
    detail: 'Negative values are set to zero, introducing non-linearity. This allows the network to learn complex patterns beyond simple linear combinations.',
    inputShape: `${c1w}×${c1h}×8`,
    outputShape: `${c1w}×${c1h}×8`,
  });

  // 3: MaxPool
  const pool1Maps: FeatureMap[] = relu1Maps.map(m => {
    const r = maxPool2x2(m.data, m.width, m.height);
    return { data: r.data, width: r.w, height: r.h, label: m.label };
  });
  const p1w = pool1Maps[0]?.width ?? 0;
  const p1h = pool1Maps[0]?.height ?? 0;
  layers.push({
    name: 'MaxPool',
    type: 'pool',
    maps: pool1Maps,
    description: 'Takes the max in each 2×2 region, halving dimensions',
    detail: 'For each 2×2 block, only the maximum value survives. This reduces spatial size by half while preserving the strongest activations, adding translation invariance.',
    inputShape: `${c1w}×${c1h}×8`,
    outputShape: `${p1w}×${p1h}×8`,
  });

  // 4: Conv2D-2 (multi-channel: each filter sums across all input channels)
  const conv2Maps: FeatureMap[] = CONV2_KERNELS.map(kernel => {
    let sumData: Float32Array | null = null;
    let ow = 0, oh = 0;
    for (const ch of pool1Maps) {
      const r = conv2d(ch.data, ch.width, ch.height, kernel.matrix);
      if (!sumData) { sumData = new Float32Array(r.data.length); ow = r.w; oh = r.h; }
      for (let i = 0; i < r.data.length; i++) sumData[i] += r.data[i];
    }
    return { data: sumData!, width: ow, height: oh, label: kernel.name };
  });
  const c2w = conv2Maps[0]?.width ?? 0;
  const c2h = conv2Maps[0]?.height ?? 0;
  layers.push({
    name: 'Conv2D-2',
    type: 'conv',
    maps: conv2Maps,
    description: 'Detects higher-level features by combining first-layer patterns',
    detail: 'Each of 8 new filters is applied across ALL 8 input channels and results are summed. This combines low-level features (edges, corners) into mid-level patterns (curves, shapes).',
    inputShape: `${p1w}×${p1h}×8`,
    outputShape: `${c2w}×${c2h}×8`,
    kernels: CONV2_KERNELS,
  });

  // 5: ReLU
  const relu2Maps: FeatureMap[] = conv2Maps.map(m => ({
    data: applyRelu(m.data), width: m.width, height: m.height, label: m.label,
  }));
  layers.push({
    name: 'ReLU',
    type: 'relu',
    maps: relu2Maps,
    description: 'Second ReLU — removes negative activations',
    detail: 'Same max(0, x) operation, maintaining non-linearity in deeper layers.',
    inputShape: `${c2w}×${c2h}×8`,
    outputShape: `${c2w}×${c2h}×8`,
  });

  // 6: MaxPool
  const pool2Maps: FeatureMap[] = relu2Maps.map(m => {
    const r = maxPool2x2(m.data, m.width, m.height);
    return { data: r.data, width: r.w, height: r.h, label: m.label };
  });
  const p2w = pool2Maps[0]?.width ?? 0;
  const p2h = pool2Maps[0]?.height ?? 0;
  layers.push({
    name: 'MaxPool',
    type: 'pool',
    maps: pool2Maps,
    description: 'Second pooling — further reduces spatial dimensions',
    detail: 'Reduces each feature map to half again. The remaining values represent the strongest detected features at a very abstract level.',
    inputShape: `${c2w}×${c2h}×8`,
    outputShape: `${p2w}×${p2h}×8`,
  });

  // 7: Flatten
  const flatLen = pool2Maps.reduce((s, m) => s + m.data.length, 0);
  const flatData = new Float32Array(flatLen);
  let offset = 0;
  for (const m of pool2Maps) { flatData.set(m.data, offset); offset += m.data.length; }
  layers.push({
    name: 'Flatten',
    type: 'flatten',
    maps: [],
    activations: Array.from(flatData),
    description: `Reshapes all feature maps into a 1D vector of ${flatLen} values`,
    detail: `All ${pool2Maps.length} feature maps (each ${p2w}×${p2h}) are concatenated into a single vector for the fully-connected layers.`,
    inputShape: `${p2w}×${p2h}×8`,
    outputShape: `${flatLen}`,
  });

  // 8: Dense (128 neurons) — simulated deterministic weights
  const denseAct: number[] = [];
  for (let n = 0; n < 128; n++) {
    let sum = 0;
    for (let i = 0; i < flatData.length; i++) {
      sum += flatData[i] * Math.sin((n + 1) * (i + 1) * 0.01) * 0.1;
    }
    denseAct.push(Math.max(0, sum));
  }
  layers.push({
    name: 'Dense',
    type: 'dense',
    maps: [],
    activations: denseAct,
    description: '128 fully-connected neurons learn feature combinations',
    detail: 'Each neuron connects to all flattened values. In a trained network, weights are learned via backpropagation. Here we use deterministic pseudo-weights to demonstrate the concept.',
    inputShape: `${flatLen}`,
    outputShape: '128',
  });

  // 9: Dropout (50%)
  const dropAct = denseAct.map((v, i) => Math.sin(i * 7.3 + v * 3.1) > 0 ? v : 0);
  layers.push({
    name: 'Dropout',
    type: 'dropout',
    maps: [],
    activations: dropAct,
    description: 'Randomly deactivates ~50% of neurons during training',
    detail: 'Half the neurons are zeroed out to prevent overfitting. During inference all neurons are active — this shows a training-time snapshot.',
    inputShape: '128',
    outputShape: '128',
  });

  // 10: Output (10 classes)
  const rawScores: number[] = [];
  for (let c = 0; c < 10; c++) {
    let sum = 0;
    for (let n = 0; n < denseAct.length; n++) {
      sum += denseAct[n] * Math.sin((c + 1) * (n + 1) * 0.07) * 0.05;
    }
    rawScores.push(sum);
  }
  const probs = softmax(rawScores);
  layers.push({
    name: 'Output',
    type: 'output',
    maps: [],
    activations: probs,
    classLabels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
    description: 'Softmax produces probability for each digit (0-9)',
    detail: 'The final 10 neurons each correspond to a digit class. Softmax converts raw scores into probabilities that sum to 1. The highest probability is the prediction.',
    inputShape: '128',
    outputShape: '10',
  });

  return layers;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

const FeatureMapView: React.FC<{
  data: Float32Array;
  width: number;
  height: number;
  displaySize: number;
  label: string;
  colorMap?: 'gray' | 'heat';
}> = ({ data, width, height, displaySize, label, colorMap = 'gray' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.createImageData(width, height);
    const stats = computeStats(data);
    const range = stats.max - stats.min || 1;

    for (let i = 0; i < data.length; i++) {
      const norm = (data[i] - stats.min) / range;
      let r: number, g: number, b: number;
      if (colorMap === 'heat') {
        if (norm < 0.25) {
          r = 0; g = Math.round(norm * 4 * 255); b = 255;
        } else if (norm < 0.5) {
          r = 0; g = 255; b = Math.round((0.5 - norm) * 4 * 255);
        } else if (norm < 0.75) {
          r = Math.round((norm - 0.5) * 4 * 255); g = 255; b = 0;
        } else {
          r = 255; g = Math.round((1 - norm) * 4 * 255); b = 0;
        }
      } else {
        r = g = b = Math.round(norm * 255);
      }
      imgData.data[i * 4] = r;
      imgData.data[i * 4 + 1] = g;
      imgData.data[i * 4 + 2] = b;
      imgData.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
  }, [data, width, height, colorMap]);

  return (
    <div className="flex flex-col items-center gap-1">
      <canvas
        ref={canvasRef}
        style={{ width: displaySize, height: displaySize, imageRendering: 'pixelated' }}
        className="rounded border border-slate-200 dark:border-slate-600"
      />
      <span className="text-[9px] text-slate-500 dark:text-slate-400 text-center leading-tight max-w-[90px] truncate">
        {label}
      </span>
    </div>
  );
};

const KernelMatrix: React.FC<{ kernel: Kernel }> = ({ kernel }) => (
  <div className="flex flex-col items-center gap-1">
    <div
      className="grid gap-px bg-slate-200 dark:bg-slate-600 rounded overflow-hidden"
      style={{ gridTemplateColumns: `repeat(${kernel.matrix[0].length}, 1fr)` }}
    >
      {kernel.matrix.flat().map((v, i) => (
        <div
          key={i}
          className={`w-6 h-6 flex items-center justify-center text-[9px] font-mono font-bold ${
            v > 0
              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
              : v < 0
                ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                : 'bg-slate-50 dark:bg-slate-700 text-slate-400'
          }`}
        >
          {v}
        </div>
      ))}
    </div>
    <span className="text-[9px] text-slate-500 dark:text-slate-400">{kernel.name}</span>
  </div>
);

const ActivationChart: React.FC<{
  values: number[];
  labels?: string[];
  height?: number;
  highlight?: boolean;
}> = ({ values, labels, height = 120, highlight }) => {
  const max = Math.max(...values.map(Math.abs), 0.001);
  const barW = values.length > 50 ? 2 : values.length > 20 ? 4 : 16;

  return (
    <div className="w-full overflow-x-auto">
      <div
        className="flex items-end gap-px justify-center mx-auto"
        style={{ height, minWidth: values.length * (barW + 1) }}
      >
        {values.map((v, i) => {
          const barH = Math.max(1, (Math.abs(v) / max) * (height - (labels ? 20 : 4)));
          const isTop = highlight && v === Math.max(...values);
          return (
            <div key={i} className="flex flex-col items-center" style={{ width: barW }}>
              <div
                className={`rounded-sm ${
                  isTop
                    ? 'bg-green-500'
                    : v > 0
                      ? 'bg-blue-400 dark:bg-blue-500'
                      : 'bg-slate-300 dark:bg-slate-600'
                }`}
                style={{ height: barH, width: '100%' }}
              />
              {labels && (
                <span className="text-[8px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {labels[i]}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────

export const CNNVisualizer: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [layerOutputs, setLayerOutputs] = useState<LayerOutput[]>([]);
  const [currentLayer, setCurrentLayer] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(50);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-advance
  useEffect(() => {
    if (!isPlaying || layerOutputs.length === 0) return;
    const interval = setInterval(() => {
      setCurrentLayer(prev => {
        if (prev >= layerOutputs.length - 1) { setIsPlaying(false); return prev; }
        return prev + 1;
      });
    }, 2500 - speed * 20);
    return () => clearInterval(interval);
  }, [isPlaying, speed, layerOutputs.length]);

  // Process image
  const processImage = useCallback((imgSrc: string) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 28;
      canvas.height = 28;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, 28, 28);
      const imgData = ctx.getImageData(0, 0, 28, 28);
      const grayscale = imageToGrayscale(imgData);
      setLayerOutputs(processAllLayers(grayscale, 28, 28));
      setCurrentLayer(0);
    };
    img.src = imgSrc;
  }, []);

  useEffect(() => {
    if (selectedImage) processImage(selectedImage);
  }, [selectedImage, processImage]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = (ev) => setSelectedImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const loadDemoImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 28;
    canvas.height = 28;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 28, 28);
    ctx.strokeStyle = '#fff';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(7, 5);
    ctx.lineTo(21, 5);
    ctx.lineTo(13, 23);
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(12, 13);
    ctx.lineTo(18, 13);
    ctx.stroke();
    setSelectedImage(canvas.toDataURL());
  };

  const currentOutput = layerOutputs[currentLayer];

  const mapDisplaySize = useMemo(() => {
    if (!currentOutput?.maps.length) return 80;
    return currentOutput.maps.length <= 1 ? 200 : 80;
  }, [currentOutput]);

  const renderVisualization = () => {
    if (!currentOutput) return null;

    // Input layer — single image
    if (currentOutput.type === 'input' && currentOutput.maps.length > 0) {
      return (
        <div className="flex flex-col items-center gap-4">
          <FeatureMapView
            data={currentOutput.maps[0].data}
            width={currentOutput.maps[0].width}
            height={currentOutput.maps[0].height}
            displaySize={200}
            label="Input (28×28 grayscale)"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center max-w-md">
            Pixel intensities: 0 (black) to 1 (white). This is what the CNN receives as input.
          </p>
        </div>
      );
    }

    // Feature map layers (conv, relu, pool)
    if (currentOutput.maps.length > 0) {
      return (
        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-wrap justify-center gap-3">
            {currentOutput.maps.map((m, i) => (
              <FeatureMapView
                key={i}
                data={m.data}
                width={m.width}
                height={m.height}
                displaySize={mapDisplaySize}
                label={m.label}
                colorMap={currentOutput.type === 'conv' ? 'heat' : 'gray'}
              />
            ))}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
            {currentOutput.maps.length} feature maps — {currentOutput.maps[0].width}×{currentOutput.maps[0].height} px each
          </p>
        </div>
      );
    }

    // Activation layers (flatten, dense, dropout, output)
    if (currentOutput.activations) {
      return (
        <div className="flex flex-col items-center gap-3 w-full max-w-lg">
          <ActivationChart
            values={currentOutput.activations}
            labels={currentOutput.classLabels}
            height={currentOutput.type === 'output' ? 160 : 100}
            highlight={currentOutput.type === 'output'}
          />
          {currentOutput.type === 'output' && currentOutput.classLabels && (
            <div className="text-center">
              <p className="text-sm font-bold text-green-600 dark:text-green-400">
                Prediction: {currentOutput.classLabels[currentOutput.activations.indexOf(Math.max(...currentOutput.activations))]}
              </p>
              <p className="text-[10px] text-slate-400">
                Confidence: {(Math.max(...currentOutput.activations) * 100).toFixed(1)}%
              </p>
              <p className="text-[9px] text-slate-400 mt-1 italic">
                (Simulated weights — real accuracy requires trained parameters)
              </p>
            </div>
          )}
          {currentOutput.type === 'dropout' && (
            <p className="text-[10px] text-slate-400 text-center">
              Gray = deactivated ({currentOutput.activations.filter(v => v === 0).length} of {currentOutput.activations.length} dropped)
            </p>
          )}
          <p className="text-[10px] text-slate-400 text-center">
            {currentOutput.activations.length} values
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm flex-shrink-0">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {layerOutputs.length > 0
            ? `Layer ${currentLayer + 1} of ${layerOutputs.length}`
            : 'Load an image to begin'}
        </span>
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          <Button onClick={() => fileInputRef.current?.click()} size="sm" variant="outline" className="h-7 text-xs gap-1.5">
            <Upload className="h-3 w-3" /> Upload
          </Button>
          <Button onClick={loadDemoImage} size="sm" variant="outline" className="h-7 text-xs gap-1.5">
            <ImageIcon className="h-3 w-3" /> Demo
          </Button>
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />
          <Button
            onClick={() => layerOutputs.length > 0 && setIsPlaying(!isPlaying)}
            size="sm"
            variant="outline"
            disabled={layerOutputs.length === 0}
            className="h-7 text-xs"
          >
            {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </Button>
          <Button
            onClick={() => { setCurrentLayer(0); setIsPlaying(false); }}
            size="sm"
            variant="outline"
            disabled={layerOutputs.length === 0}
            className="h-7 text-xs"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="interactive" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-4 mt-2 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <TabsTrigger value="interactive" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900">
            <Zap className="h-3.5 w-3.5 mr-1.5" /> Interactive
          </TabsTrigger>
          <TabsTrigger value="architecture" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900">
            <Layers className="h-3.5 w-3.5 mr-1.5" /> Architecture
          </TabsTrigger>
        </TabsList>

        <TabsContent value="interactive" className="flex-1 flex flex-col overflow-hidden mt-0">
          {layerOutputs.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <Card className="p-8 text-center max-w-sm bg-white dark:bg-slate-800">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                <h3 className="font-bold text-slate-800 dark:text-white mb-2">Load an Image</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Upload a handwritten digit or use the demo to see how a CNN processes it layer by layer.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" /> Upload
                  </Button>
                  <Button onClick={loadDemoImage} size="sm">
                    <ImageIcon className="h-4 w-4 mr-2" /> Demo Image
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Layer nav */}
              <div className="flex gap-1 px-4 py-2 overflow-x-auto flex-shrink-0">
                {layerOutputs.map((layer, idx) => (
                  <React.Fragment key={idx}>
                    <button
                      onClick={() => setCurrentLayer(idx)}
                      className={`px-2 py-1 rounded text-[10px] font-semibold whitespace-nowrap transition-colors ${
                        currentLayer === idx
                          ? 'bg-blue-500 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      {layer.name}
                    </button>
                    {idx < layerOutputs.length - 1 && (
                      <ArrowRight className="h-3 w-3 text-slate-300 dark:text-slate-600 flex-shrink-0 self-center" />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Main content */}
              <div className="flex-1 overflow-auto p-4">
                <div className="grid grid-cols-3 gap-4 h-full">
                  {/* Visualization */}
                  <div className="col-span-2 flex items-center justify-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 min-h-[300px]">
                    {renderVisualization()}
                  </div>

                  {/* Info panel */}
                  <div className="space-y-3 overflow-y-auto">
                    {currentOutput && (
                      <>
                        <Card className="p-3 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white mb-1">
                            {currentOutput.name}
                          </h4>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                            {currentOutput.description}
                          </p>
                          <div className="mt-2 flex gap-2">
                            <span className="text-[9px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono text-slate-600 dark:text-slate-300">
                              In: {currentOutput.inputShape}
                            </span>
                            <span className="text-[9px] bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded font-mono text-blue-700 dark:text-blue-300">
                              Out: {currentOutput.outputShape}
                            </span>
                          </div>
                        </Card>

                        <Card className="p-3 bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
                          <div className="flex gap-1.5 items-start">
                            <Info className="h-3 w-3 text-blue-500 flex-shrink-0 mt-0.5" />
                            <p className="text-[10px] text-blue-800 dark:text-blue-300 leading-relaxed">
                              {currentOutput.detail}
                            </p>
                          </div>
                        </Card>

                        {/* Kernel display for conv layers */}
                        {currentOutput.kernels && (
                          <Card className="p-3 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                            <h5 className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                              Kernels Used
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {currentOutput.kernels.slice(0, 4).map((k, i) => (
                                <KernelMatrix key={i} kernel={k} />
                              ))}
                            </div>
                            {currentOutput.kernels.length > 4 && (
                              <p className="text-[9px] text-slate-400 mt-1">
                                +{currentOutput.kernels.length - 4} more filters
                              </p>
                            )}
                          </Card>
                        )}

                        {/* Stats */}
                        {currentOutput.maps.length > 0 && (
                          <Card className="p-3 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                            <h5 className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                              Statistics
                            </h5>
                            <div className="space-y-1 text-[10px]">
                              {(() => {
                                const allData = new Float32Array(
                                  currentOutput.maps.reduce((s, m) => s + m.data.length, 0)
                                );
                                let off = 0;
                                for (const m of currentOutput.maps) { allData.set(m.data, off); off += m.data.length; }
                                const s = computeStats(allData);
                                return (
                                  <>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500 dark:text-slate-400">Min</span>
                                      <span className="font-mono text-slate-700 dark:text-slate-300">{s.min.toFixed(4)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500 dark:text-slate-400">Max</span>
                                      <span className="font-mono text-slate-700 dark:text-slate-300">{s.max.toFixed(4)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500 dark:text-slate-400">Mean</span>
                                      <span className="font-mono text-slate-700 dark:text-slate-300">{s.mean.toFixed(4)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500 dark:text-slate-400">Std Dev</span>
                                      <span className="font-mono text-slate-700 dark:text-slate-300">{s.std.toFixed(4)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500 dark:text-slate-400">Total values</span>
                                      <span className="font-mono text-slate-700 dark:text-slate-300">{allData.length.toLocaleString()}</span>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </Card>
                        )}

                        {/* Speed */}
                        <Card className="p-3 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Speed</span>
                            <Slider
                              value={[speed]}
                              onValueChange={(v) => setSpeed(v[0])}
                              min={1}
                              max={100}
                              step={1}
                              className="flex-1"
                            />
                            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 w-8">
                              {speed}%
                            </span>
                          </div>
                        </Card>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="architecture" className="flex-1 overflow-auto mt-0 p-4">
          <div className="max-w-2xl mx-auto space-y-4">
            <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <div className="flex gap-2">
                <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-sm mb-1 text-blue-800 dark:text-blue-200">
                    CNN Architecture Overview
                  </h3>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    This CNN classifies handwritten digits (0-9) from MNIST. It uses convolutional layers to
                    extract features, pooling to reduce dimensions, and dense layers to make predictions.
                  </p>
                </div>
              </div>
            </Card>

            {[
              { name: 'Input', type: 'INPUT', shape: '28×28×1', desc: 'Grayscale image of a handwritten digit', detail: 'MNIST images are 28×28 pixels with values 0-255 normalized to 0-1.' },
              { name: 'Conv2D (8 filters, 3×3)', type: 'CONV', shape: '26×26×8', desc: 'Extracts low-level features', detail: 'Each 3×3 filter detects specific patterns: horizontal edges, vertical edges, diagonals, corners. The filter slides across the image computing dot products.' },
              { name: 'ReLU', type: 'RELU', shape: '26×26×8', desc: 'Non-linear activation', detail: 'Applies max(0, x) to each value. Negative activations become zero, allowing non-linear decision boundaries.' },
              { name: 'MaxPool 2×2', type: 'POOL', shape: '13×13×8', desc: 'Spatial downsampling', detail: 'Keeps the maximum value in each 2×2 region. Reduces computation and provides translation invariance.' },
              { name: 'Conv2D (8 filters, 3×3)', type: 'CONV', shape: '11×11×8', desc: 'Higher-level features', detail: 'Second convolution combines low-level features into mid-level patterns: curves, loops, intersections. Each filter operates across ALL input channels.' },
              { name: 'ReLU', type: 'RELU', shape: '11×11×8', desc: 'Non-linear activation', detail: 'Same as first ReLU, maintaining non-linearity in deeper layers.' },
              { name: 'MaxPool 2×2', type: 'POOL', shape: '5×5×8', desc: 'Further downsampling', detail: 'Second pooling reduces to 5×5 — much more compact, keeping only the strongest features.' },
              { name: 'Flatten', type: 'FC', shape: '200', desc: 'Reshape to 1D vector', detail: '5×5×8 = 200 values arranged into a flat vector for the fully-connected layers.' },
              { name: 'Dense (128)', type: 'FC', shape: '128', desc: 'Feature combination', detail: 'Each of 128 neurons connects to all 200 inputs with learned weights, forming a rich representation.' },
              { name: 'Dropout (50%)', type: 'DROP', shape: '128', desc: 'Regularization', detail: 'During training, 50% of neurons are randomly deactivated to prevent overfitting. At test time all are active.' },
              { name: 'Output (Softmax)', type: 'OUTPUT', shape: '10', desc: '10-class probability', detail: 'Final 10 neurons (one per digit). Softmax ensures outputs sum to 1, interpretable as probabilities.' },
            ].map((layer, idx) => (
              <Card key={idx} className="p-3 border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold text-xs flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{layer.name}</h4>
                      <span className="text-[9px] font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500">
                        {layer.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{layer.desc}</p>
                    <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 mt-1 block">
                      Output: {layer.shape}
                    </span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 p-2 bg-slate-50 dark:bg-slate-700/50 rounded italic">
                      {layer.detail}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
