import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Upload, Play, Pause, RotateCcw, Image as ImageIcon, Layers, Info, Zap, ArrowRight, ArrowDown } from 'lucide-react';

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

// ─── Digit Spatial Templates (5×5 row-major) ───────────────────────────────
// Each template represents expected spatial activation pattern for a digit.
// After summing all pool2 feature maps into a 5×5 grid, we score each digit
// by dot product with its template, then apply softmax.

const DIGIT_TEMPLATES: number[][] = [
  // 0: oval — perimeter active, hollow center
  [0.2,0.7,0.8,0.7,0.2, 0.7,0.2,0.0,0.2,0.7, 0.8,0.1,0.0,0.1,0.8, 0.7,0.2,0.0,0.2,0.7, 0.2,0.7,0.8,0.7,0.2],
  // 1: narrow vertical right of center
  [0.0,0.1,0.4,0.8,0.0, 0.0,0.0,0.2,0.9,0.0, 0.0,0.0,0.2,0.9,0.0, 0.0,0.0,0.2,0.9,0.0, 0.0,0.2,0.5,0.8,0.2],
  // 2: top arc, right-to-left diagonal, bottom bar
  [0.2,0.6,0.8,0.7,0.2, 0.0,0.0,0.1,0.5,0.7, 0.0,0.2,0.5,0.5,0.1, 0.4,0.5,0.3,0.0,0.0, 0.3,0.7,0.8,0.8,0.3],
  // 3: top arc, middle notch, bottom arc
  [0.2,0.6,0.8,0.7,0.3, 0.0,0.0,0.1,0.4,0.7, 0.1,0.3,0.7,0.6,0.3, 0.0,0.0,0.1,0.4,0.7, 0.2,0.6,0.8,0.7,0.3],
  // 4: left+right verticals, horizontal bar mid
  [0.5,0.2,0.0,0.5,0.0, 0.6,0.2,0.0,0.6,0.0, 0.5,0.6,0.8,0.8,0.3, 0.0,0.0,0.1,0.7,0.0, 0.0,0.0,0.1,0.7,0.0],
  // 5: top bar, left drop, middle bar, right drop, bottom arc
  [0.3,0.7,0.8,0.7,0.3, 0.7,0.4,0.1,0.0,0.0, 0.3,0.6,0.8,0.6,0.2, 0.0,0.0,0.1,0.4,0.7, 0.2,0.6,0.8,0.6,0.2],
  // 6: top arc, left column, bottom full circle
  [0.2,0.6,0.8,0.6,0.2, 0.7,0.3,0.0,0.0,0.0, 0.5,0.6,0.8,0.6,0.2, 0.7,0.2,0.0,0.2,0.7, 0.2,0.6,0.8,0.6,0.2],
  // 7: strong top bar, diagonal from upper-right to lower-left, NO bottom bar, NO loop
  [0.3,0.8,1.0,0.9,0.4, 0.0,0.0,0.1,0.7,0.5, 0.0,0.0,0.5,0.5,0.0, 0.0,0.3,0.6,0.0,0.0, 0.1,0.5,0.3,0.0,0.0],
  // 8: two vertically stacked circles
  [0.2,0.6,0.8,0.6,0.2, 0.5,0.2,0.0,0.2,0.5, 0.2,0.6,0.8,0.6,0.2, 0.5,0.2,0.0,0.2,0.5, 0.2,0.6,0.8,0.6,0.2],
  // 9: top circle with clear loop, right column descent, bottom arc
  [0.2,0.7,0.8,0.7,0.2, 0.6,0.1,0.0,0.1,0.6, 0.3,0.6,0.8,0.7,0.6, 0.0,0.0,0.1,0.3,0.7, 0.2,0.5,0.8,0.7,0.3],
];

// ─── Pipeline ───────────────────────────────────────────────────────────────

function processAllLayers(grayscale: Float32Array, imgW: number, imgH: number): LayerOutput[] {
  const layers: LayerOutput[] = [];

  // 0: Input
  layers.push({
    name: 'Input', type: 'input',
    maps: [{ data: grayscale, width: imgW, height: imgH, label: 'Grayscale' }],
    description: 'Original input converted to grayscale',
    detail: 'Raw pixel intensities (0 = black, 1 = white). MNIST standard: 28×28 pixels.',
    inputShape: `${imgW}×${imgH}×1`, outputShape: `${imgW}×${imgH}×1`,
  });

  // 1: Conv2D-1
  const conv1Maps: FeatureMap[] = CONV1_KERNELS.map(k => {
    const r = conv2d(grayscale, imgW, imgH, k.matrix);
    return { data: r.data, width: r.w, height: r.h, label: k.name };
  });
  const c1w = conv1Maps[0]?.width ?? 0;
  const c1h = conv1Maps[0]?.height ?? 0;
  layers.push({
    name: 'Conv2D-1', type: 'conv', maps: conv1Maps,
    description: 'Each 3×3 filter slides across the image detecting low-level features',
    detail: '8 different 3×3 kernels detect specific patterns: horizontal edges, vertical edges, diagonals, corners.',
    inputShape: `${imgW}×${imgH}×1`, outputShape: `${c1w}×${c1h}×8`, kernels: CONV1_KERNELS,
  });

  // 2: ReLU
  const relu1Maps: FeatureMap[] = conv1Maps.map(m => ({
    data: applyRelu(m.data), width: m.width, height: m.height, label: m.label,
  }));
  layers.push({
    name: 'ReLU', type: 'relu', maps: relu1Maps,
    description: 'Applies max(0, x) — removes negative activations',
    detail: 'Negative values become zero. This non-linearity allows the network to learn complex, non-linear patterns.',
    inputShape: `${c1w}×${c1h}×8`, outputShape: `${c1w}×${c1h}×8`,
  });

  // 3: MaxPool
  const pool1Maps: FeatureMap[] = relu1Maps.map(m => {
    const r = maxPool2x2(m.data, m.width, m.height);
    return { data: r.data, width: r.w, height: r.h, label: m.label };
  });
  const p1w = pool1Maps[0]?.width ?? 0;
  const p1h = pool1Maps[0]?.height ?? 0;
  layers.push({
    name: 'MaxPool', type: 'pool', maps: pool1Maps,
    description: 'Takes the max in each 2×2 region, halving dimensions',
    detail: 'Only the maximum value in each 2×2 block survives. Adds translation invariance and reduces computation.',
    inputShape: `${c1w}×${c1h}×8`, outputShape: `${p1w}×${p1h}×8`,
  });

  // 4: Conv2D-2 (multi-channel)
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
    name: 'Conv2D-2', type: 'conv', maps: conv2Maps,
    description: 'Detects higher-level features by combining first-layer patterns',
    detail: 'Each filter is applied across ALL 8 input channels and summed, combining edges into shapes and curves.',
    inputShape: `${p1w}×${p1h}×8`, outputShape: `${c2w}×${c2h}×8`, kernels: CONV2_KERNELS,
  });

  // 5: ReLU
  const relu2Maps: FeatureMap[] = conv2Maps.map(m => ({
    data: applyRelu(m.data), width: m.width, height: m.height, label: m.label,
  }));
  layers.push({
    name: 'ReLU', type: 'relu', maps: relu2Maps,
    description: 'Second ReLU — removes negative activations',
    detail: 'Same max(0, x) operation, maintaining non-linearity in deeper layers.',
    inputShape: `${c2w}×${c2h}×8`, outputShape: `${c2w}×${c2h}×8`,
  });

  // 6: MaxPool
  const pool2Maps: FeatureMap[] = relu2Maps.map(m => {
    const r = maxPool2x2(m.data, m.width, m.height);
    return { data: r.data, width: r.w, height: r.h, label: m.label };
  });
  const p2w = pool2Maps[0]?.width ?? 0;
  const p2h = pool2Maps[0]?.height ?? 0;
  layers.push({
    name: 'MaxPool', type: 'pool', maps: pool2Maps,
    description: 'Second pooling — abstracts spatial dimensions to 5×5',
    detail: 'Each feature map reduced to 5×5. Only the strongest abstract features remain.',
    inputShape: `${c2w}×${c2h}×8`, outputShape: `${p2w}×${p2h}×8`,
  });

  // 7: Flatten
  const flatLen = pool2Maps.reduce((s, m) => s + m.data.length, 0);
  const flatData = new Float32Array(flatLen);
  let offset = 0;
  for (const m of pool2Maps) { flatData.set(m.data, offset); offset += m.data.length; }
  layers.push({
    name: 'Flatten', type: 'flatten', maps: [],
    activations: Array.from(flatData),
    description: `Reshapes all feature maps into a 1D vector of ${flatLen} values`,
    detail: `All ${pool2Maps.length} feature maps (each ${p2w}×${p2h}) concatenated into a single vector.`,
    inputShape: `${p2w}×${p2h}×8`, outputShape: `${flatLen}`,
  });

  // 8: Dense (128 neurons) — pseudo-weights for visualization
  const denseAct: number[] = [];
  for (let n = 0; n < 128; n++) {
    let sum = 0;
    for (let i = 0; i < flatData.length; i++) {
      sum += flatData[i] * Math.sin((n + 1) * (i + 1) * 0.01) * 0.1;
    }
    denseAct.push(Math.max(0, sum));
  }
  layers.push({
    name: 'Dense', type: 'dense', maps: [],
    activations: denseAct,
    description: '128 fully-connected neurons learn feature combinations',
    detail: 'Each neuron connects to all flattened values. Pseudo-weights used for visualization purposes.',
    inputShape: `${flatLen}`, outputShape: '128',
  });

  // 9: Dropout (50%)
  const dropAct = denseAct.map((v, i) => Math.sin(i * 7.3 + v * 3.1) > 0 ? v : 0);
  layers.push({
    name: 'Dropout', type: 'dropout', maps: [],
    activations: dropAct,
    description: 'Randomly deactivates ~50% of neurons during training',
    detail: 'Prevents overfitting by zeroing random neurons. This shows a training-time snapshot.',
    inputShape: '128', outputShape: '128',
  });

  // 10: Output — spatial template matching on pooled feature maps
  const gridSize = p2w * p2h;
  const summaryGrid = new Float32Array(gridSize);
  for (const m of pool2Maps) {
    for (let i = 0; i < Math.min(m.data.length, gridSize); i++) {
      summaryGrid[i] += m.data[i];
    }
  }
  let gridMax = 0;
  for (let i = 0; i < gridSize; i++) {
    if (summaryGrid[i] > gridMax) gridMax = summaryGrid[i];
  }
  if (gridMax > 0) {
    for (let i = 0; i < gridSize; i++) summaryGrid[i] /= gridMax;
  }
  const rawScores: number[] = [];
  for (let d = 0; d < 10; d++) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    const tmpl = DIGIT_TEMPLATES[d];
    for (let i = 0; i < Math.min(gridSize, tmpl.length); i++) {
      dotProduct += summaryGrid[i] * tmpl[i];
      normA += summaryGrid[i] * summaryGrid[i];
      normB += tmpl[i] * tmpl[i];
    }
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    rawScores.push(denominator > 0 ? dotProduct / denominator : 0);
  }
  const probs = softmax(rawScores);
  layers.push({
    name: 'Output', type: 'output', maps: [],
    activations: probs,
    classLabels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
    description: 'Softmax produces probability for each digit (0-9)',
    detail: 'Pooled feature maps are matched against spatial digit templates. Softmax converts similarity scores into probabilities that sum to 1.',
    inputShape: '128', outputShape: '10',
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
        className="rounded border border-gray-200 dark:border-gray-600"
      />
      <span className="text-[9px] text-gray-500 dark:text-gray-400 text-center leading-tight max-w-[90px] truncate">
        {label}
      </span>
    </div>
  );
};

const KernelMatrix: React.FC<{ kernel: Kernel }> = ({ kernel }) => (
  <div className="flex flex-col items-center gap-1">
    <div
      className="grid gap-px bg-gray-200 dark:bg-gray-600 rounded overflow-hidden"
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
                : 'bg-gray-50 dark:bg-gray-700 text-gray-400'
          }`}
        >
          {v}
        </div>
      ))}
    </div>
    <span className="text-[9px] text-gray-500 dark:text-gray-400">{kernel.name}</span>
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
                      : 'bg-gray-300 dark:bg-gray-600'
                }`}
                style={{ height: barH, width: '100%' }}
              />
              {labels && (
                <span className="text-[8px] text-gray-500 dark:text-gray-400 mt-0.5">
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

// ─── Architecture Layer Definitions ─────────────────────────────────────────

const ARCH_LAYERS = [
  { name: 'Input', type: 'INPUT', shape: '28×28×1', color: '#3b82f6', bg: '#dbeafe', border: '#93c5fd', desc: 'Grayscale image of a handwritten digit', detail: 'MNIST images are 28×28 pixels with values 0-255 normalized to 0-1.' },
  { name: 'Conv2D (8 filters, 3×3)', type: 'CONV', shape: '26×26×8', color: '#8b5cf6', bg: '#ede9fe', border: '#c4b5fd', desc: 'Extracts low-level features (edges, corners)', detail: 'Each 3×3 filter detects specific patterns. The filter slides across the image computing dot products. Valid padding reduces each dimension by 2.' },
  { name: 'ReLU', type: 'ACTIVATION', shape: '26×26×8', color: '#22c55e', bg: '#dcfce7', border: '#86efac', desc: 'Non-linear activation: max(0, x)', detail: 'Negative activations become zero, allowing the network to learn non-linear decision boundaries.' },
  { name: 'MaxPool 2×2', type: 'POOL', shape: '13×13×8', color: '#f97316', bg: '#fff7ed', border: '#fdba74', desc: 'Spatial downsampling by factor of 2', detail: 'Keeps the maximum value in each 2×2 region. Reduces computation and provides translation invariance.' },
  { name: 'Conv2D (8 filters, 3×3)', type: 'CONV', shape: '11×11×8', color: '#8b5cf6', bg: '#ede9fe', border: '#c4b5fd', desc: 'Higher-level feature detection', detail: 'Second convolution operates across ALL input channels, combining edges into curves, loops, intersections.' },
  { name: 'ReLU', type: 'ACTIVATION', shape: '11×11×8', color: '#22c55e', bg: '#dcfce7', border: '#86efac', desc: 'Non-linear activation: max(0, x)', detail: 'Same as first ReLU, maintaining non-linearity in deeper layers of the network.' },
  { name: 'MaxPool 2×2', type: 'POOL', shape: '5×5×8', color: '#f97316', bg: '#fff7ed', border: '#fdba74', desc: 'Further downsampling to 5×5', detail: 'Only the strongest abstract features remain at each spatial position.' },
  { name: 'Flatten', type: 'RESHAPE', shape: '200', color: '#eab308', bg: '#fef9c3', border: '#fde047', desc: 'Reshape 5×5×8 to 1D vector', detail: '200 values arranged into a flat vector for the fully-connected layers.' },
  { name: 'Dense (128)', type: 'FC', shape: '128', color: '#06b6d4', bg: '#cffafe', border: '#67e8f9', desc: 'Fully-connected feature combination', detail: 'Each of 128 neurons connects to all 200 inputs with learned weights, forming a rich internal representation.' },
  { name: 'Dropout (50%)', type: 'REGULARIZE', shape: '128', color: '#6b7280', bg: '#f3f4f6', border: '#d1d5db', desc: 'Regularization to prevent overfitting', detail: 'During training, 50% of neurons are randomly deactivated. At inference time all are active.' },
  { name: 'Output (Softmax)', type: 'OUTPUT', shape: '10', color: '#ef4444', bg: '#fef2f2', border: '#fca5a5', desc: '10-class probability distribution', detail: '10 neurons (one per digit 0-9). Softmax ensures outputs sum to 1, interpretable as class probabilities.' },
];

// ─── Main Component ─────────────────────────────────────────────────────────

export const CNNVisualizer: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [layerOutputs, setLayerOutputs] = useState<LayerOutput[]>([]);
  const [currentLayer, setCurrentLayer] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [view, setView] = useState<'interactive' | 'architecture'>('interactive');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const speedDelay = speed === 0.5 ? 3000 : speed === 2 ? 750 : 1500;

  // Auto-advance through layers
  useEffect(() => {
    if (!isPlaying || layerOutputs.length === 0) return;
    const interval = setInterval(() => {
      setCurrentLayer(prev => {
        if (prev >= layerOutputs.length - 1) { setIsPlaying(false); return prev; }
        return prev + 1;
      });
    }, speedDelay);
    return () => clearInterval(interval);
  }, [isPlaying, speedDelay, layerOutputs.length]);

  // Process image through pipeline
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
    if (!file || file.size > 5 * 1024 * 1024) return;
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
    // Draw a clear "7": strong horizontal top bar + diagonal stroke down-left
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(6, 5);
    ctx.lineTo(22, 5);
    ctx.stroke();
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(21, 5);
    ctx.lineTo(10, 25);
    ctx.stroke();
    // Small serif on top-left for a clearer 7
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(6, 4);
    ctx.lineTo(6, 8);
    ctx.stroke();
    setSelectedImage(canvas.toDataURL());
  };

  const togglePlay = () => {
    if (currentLayer >= layerOutputs.length - 1 && layerOutputs.length > 0) {
      setCurrentLayer(0);
    }
    setIsPlaying(prev => !prev);
  };

  const currentOutput = layerOutputs[currentLayer];

  const mapDisplaySize = useMemo(() => {
    if (!currentOutput?.maps.length) return 80;
    return currentOutput.maps.length <= 1 ? 200 : 80;
  }, [currentOutput]);

  // ─── Render visualization content ──────────────────────────────────────

  const renderVisualization = () => {
    if (!currentOutput) return null;

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
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-md">
            Pixel intensities: 0 (black) to 1 (white). This is what the CNN receives as input.
          </p>
        </div>
      );
    }

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
          <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
            {currentOutput.maps.length} feature maps — {currentOutput.maps[0].width}×{currentOutput.maps[0].height} px each
          </p>
        </div>
      );
    }

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
              <p className="text-[10px] text-gray-400">
                Confidence: {(Math.max(...currentOutput.activations) * 100).toFixed(1)}%
              </p>
              <p className="text-[9px] text-gray-400 mt-1 italic">
                (Spatial template matching — real accuracy requires trained parameters)
              </p>
            </div>
          )}
          {currentOutput.type === 'dropout' && (
            <p className="text-[10px] text-gray-400 text-center">
              Gray = deactivated ({currentOutput.activations.filter(v => v === 0).length} of {currentOutput.activations.length} dropped)
            </p>
          )}
          <p className="text-[10px] text-gray-400 text-center">
            {currentOutput.activations.length} values
          </p>
        </div>
      );
    }

    return null;
  };

  // ─── Main render ───────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-3 overflow-hidden">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            CNN Visualizer
          </h2>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {layerOutputs.length > 0
              ? `Layer ${currentLayer + 1} of ${layerOutputs.length} — ${currentOutput?.name ?? ''}`
              : 'Load an image to visualize CNN processing layer by layer'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg overflow-hidden border border-blue-300 dark:border-blue-700 shadow-sm">
            <button
              onClick={() => setView('interactive')}
              className={`px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                view === 'interactive'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700'
              }`}
            >
              <Zap className="h-3 w-3" /> Interactive
            </button>
            <button
              onClick={() => setView('architecture')}
              className={`px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                view === 'architecture'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700'
              }`}
            >
              <Layers className="h-3 w-3" /> Architecture
            </button>
          </div>
          {/* Image controls */}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1.5 text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-all shadow-sm flex items-center gap-1.5"
          >
            <Upload className="h-3 w-3" /> Upload
          </button>
          <button
            onClick={loadDemoImage}
            className="px-2.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-sm flex items-center gap-1.5"
          >
            <ImageIcon className="h-3 w-3" /> Demo
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-0">
        {view === 'interactive' ? (
          layerOutputs.length === 0 ? (
            /* ── Empty state ───────────────────────────────────────────── */
            <div className="flex-1 flex items-center justify-center">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center max-w-sm">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <h3 className="font-bold text-gray-800 dark:text-white mb-2">Load an Image</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Upload a handwritten digit or use the demo to see how a CNN processes it layer by layer.
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 flex items-center gap-1.5"
                  >
                    <Upload className="h-3.5 w-3.5" /> Upload
                  </button>
                  <button
                    onClick={loadDemoImage}
                    className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5"
                  >
                    <ImageIcon className="h-3.5 w-3.5" /> Demo Image
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ── Interactive view with data ─────────────────────────── */
            <div className="flex-1 flex flex-col min-h-0 gap-2">
              {/* Layer navigation bar */}
              <div className="flex gap-1 overflow-x-auto flex-shrink-0 pb-0.5">
                {layerOutputs.map((layer, idx) => (
                  <React.Fragment key={idx}>
                    <button
                      onClick={() => setCurrentLayer(idx)}
                      className={`px-2 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap transition-all ${
                        currentLayer === idx
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      {layer.name}
                    </button>
                    {idx < layerOutputs.length - 1 && (
                      <ArrowRight className="h-3 w-3 text-gray-300 dark:text-gray-600 flex-shrink-0 self-center" />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Content area: visualization + info panel */}
              <div className="flex-1 flex gap-3 min-h-0">
                {/* Visualization panel */}
                <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 overflow-auto min-w-0">
                  {renderVisualization()}
                </div>

                {/* Right info panel */}
                <div className="w-72 flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
                  {currentOutput && (
                    <>
                      {/* Layer info */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3">
                        <h4 className="text-xs font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-1.5">
                          <Info className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                          {currentOutput.name}
                        </h4>
                        <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                          {currentOutput.description}
                        </p>
                        <div className="mt-2 flex gap-2">
                          <span className="text-[9px] bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded font-mono text-gray-600 dark:text-gray-300">
                            In: {currentOutput.inputShape}
                          </span>
                          <span className="text-[9px] bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded font-mono text-blue-700 dark:text-blue-300">
                            Out: {currentOutput.outputShape}
                          </span>
                        </div>
                      </div>

                      {/* Detail explanation */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2.5">
                        <div className="flex gap-1.5 items-start">
                          <Info className="h-3 w-3 text-blue-500 flex-shrink-0 mt-0.5" />
                          <p className="text-[10px] text-blue-800 dark:text-blue-300 leading-relaxed">
                            {currentOutput.detail}
                          </p>
                        </div>
                      </div>

                      {/* Kernel display for conv layers */}
                      {currentOutput.kernels && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3">
                          <h5 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                            Kernels Used
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {currentOutput.kernels.slice(0, 4).map((k, i) => (
                              <KernelMatrix key={i} kernel={k} />
                            ))}
                          </div>
                          {currentOutput.kernels.length > 4 && (
                            <p className="text-[9px] text-gray-400 mt-1">
                              +{currentOutput.kernels.length - 4} more filters
                            </p>
                          )}
                        </div>
                      )}

                      {/* Statistics for map layers */}
                      {currentOutput.maps.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3">
                          <h5 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
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
                                    <span className="text-gray-500 dark:text-gray-400">Min</span>
                                    <span className="font-mono text-gray-700 dark:text-gray-300">{s.min.toFixed(4)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Max</span>
                                    <span className="font-mono text-gray-700 dark:text-gray-300">{s.max.toFixed(4)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Mean</span>
                                    <span className="font-mono text-gray-700 dark:text-gray-300">{s.mean.toFixed(4)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Std Dev</span>
                                    <span className="font-mono text-gray-700 dark:text-gray-300">{s.std.toFixed(4)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Total values</span>
                                    <span className="font-mono text-gray-700 dark:text-gray-300">{allData.length.toLocaleString()}</span>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Playback controls */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <button
                            onClick={togglePlay}
                            disabled={layerOutputs.length === 0}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all shadow-sm text-white ${
                              isPlaying
                                ? 'bg-amber-500 hover:bg-amber-600'
                                : 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:text-gray-500'
                            }`}
                          >
                            {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                            {isPlaying ? 'Pause' : 'Play'}
                          </button>
                          <button
                            onClick={() => { setCurrentLayer(0); setIsPlaying(false); }}
                            className="p-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg transition-all"
                            title="Reset"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Speed</span>
                          {[0.5, 1, 2].map(s => (
                            <button
                              key={s}
                              onClick={() => setSpeed(s)}
                              className={`flex-1 text-[11px] py-1 rounded-md font-medium transition-all ${
                                speed === s
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 shadow-sm'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-transparent hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                            >
                              {s}x
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        ) : (
          /* ── Architecture view ────────────────────────────────────── */
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto py-2">
              {/* Overview card */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-3">
                <div className="flex gap-2">
                  <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-sm mb-1 text-blue-800 dark:text-blue-200">
                      CNN Architecture Overview
                    </h3>
                    <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                      This CNN classifies handwritten digits (0-9) from MNIST. Convolutional layers
                      extract features, pooling reduces dimensions, and dense layers produce predictions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Pipeline layers */}
              {ARCH_LAYERS.map((layer, idx) => (
                <React.Fragment key={idx}>
                  <div
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 hover:shadow-lg transition-shadow border-l-4"
                    style={{ borderLeftColor: layer.color }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: layer.color }}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-sm text-gray-900 dark:text-white">{layer.name}</h4>
                          <span
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold"
                            style={{ backgroundColor: layer.bg, color: layer.color, border: `1px solid ${layer.border}` }}
                          >
                            {layer.type}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{layer.desc}</p>
                        <span className="text-[10px] font-mono mt-1 block font-semibold" style={{ color: layer.color }}>
                          Output: {layer.shape}
                        </span>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1.5 p-2 bg-gray-50 dark:bg-gray-700/50 rounded italic leading-relaxed">
                          {layer.detail}
                        </p>
                      </div>
                    </div>
                  </div>
                  {idx < ARCH_LAYERS.length - 1 && (
                    <div className="flex justify-center py-1">
                      <ArrowDown className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                    </div>
                  )}
                </React.Fragment>
              ))}

              {/* Key concepts */}
              <div className="mt-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3">
                <h4 className="text-[10px] font-semibold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Info className="h-3 w-3" /> Key Concepts
                </h4>
                <div className="space-y-1.5 text-[10px] text-gray-600 dark:text-gray-300 leading-relaxed">
                  <p>
                    <span className="font-semibold text-gray-700 dark:text-gray-200">Convolution:</span> A small filter (kernel)
                    slides across the input, computing dot products at each position. This detects local patterns like edges.
                  </p>
                  <p>
                    <span className="font-semibold text-gray-700 dark:text-gray-200">Feature Hierarchy:</span> Early layers detect
                    simple features (edges, corners). Deeper layers combine them into complex patterns (curves, shapes, digits).
                  </p>
                  <p>
                    <span className="font-semibold text-gray-700 dark:text-gray-200">Pooling:</span> Reduces spatial dimensions
                    while preserving the most important features. Provides translation invariance.
                  </p>
                  <p>
                    <span className="font-semibold text-gray-700 dark:text-gray-200">Backpropagation:</span> During training,
                    the network adjusts kernel weights to minimize prediction error using gradient descent.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
