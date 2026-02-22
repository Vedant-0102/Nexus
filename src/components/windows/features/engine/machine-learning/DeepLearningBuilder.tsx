import React, { useState, useRef, useEffect, useCallback } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type LayerType = 'Input' | 'Dense' | 'Conv2D' | 'Dropout' | 'BatchNorm' | 'Output';
type Activation = 'relu' | 'sigmoid' | 'tanh' | 'softmax' | 'linear' | 'leaky_relu';
type PresetName = 'MLP' | 'CNN' | 'Autoencoder';

interface Layer {
  id: string;
  type: LayerType;
  neurons: number;         // neurons for Dense/Input/Output, filters for Conv2D
  activation: Activation;
  dropoutRate: number;     // only for Dropout
  kernelSize: number;      // only for Conv2D
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

let _idCounter = 0;
const uid = () => `layer_${++_idCounter}_${Date.now()}`;

function defaultLayer(type: LayerType): Layer {
  return {
    id: uid(),
    type,
    neurons: type === 'Input' ? 784 : type === 'Output' ? 10 : type === 'Conv2D' ? 32 : type === 'Dropout' ? 0 : type === 'BatchNorm' ? 0 : 128,
    activation: type === 'Output' ? 'softmax' : 'relu',
    dropoutRate: 0.25,
    kernelSize: 3,
  };
}

function paramCount(layers: Layer[]): { perLayer: number[]; total: number } {
  const counts: number[] = [];
  let prevNeurons = 0;
  for (const l of layers) {
    switch (l.type) {
      case 'Input':
        counts.push(0);
        prevNeurons = l.neurons;
        break;
      case 'Dense':
      case 'Output':
        counts.push(prevNeurons * l.neurons + l.neurons);
        prevNeurons = l.neurons;
        break;
      case 'Conv2D':
        counts.push(l.kernelSize * l.kernelSize * Math.max(prevNeurons, 1) * l.neurons + l.neurons);
        prevNeurons = l.neurons;
        break;
      case 'Dropout':
        counts.push(0);
        break;
      case 'BatchNorm':
        counts.push(prevNeurons * 4);
        break;
    }
  }
  return { perLayer: counts, total: counts.reduce((a, b) => a + b, 0) };
}

function validate(layers: Layer[]): string[] {
  const errors: string[] = [];
  if (layers.length === 0) { errors.push('Add at least one layer.'); return errors; }
  if (layers[0].type !== 'Input') errors.push('First layer should be an Input layer.');
  if (layers[layers.length - 1].type !== 'Output') errors.push('Last layer should be an Output layer.');
  const inputCount = layers.filter(l => l.type === 'Input').length;
  const outputCount = layers.filter(l => l.type === 'Output').length;
  if (inputCount > 1) errors.push('Only one Input layer is allowed.');
  if (outputCount > 1) errors.push('Only one Output layer is allowed.');
  for (let i = 0; i < layers.length - 1; i++) {
    if (layers[i].type === 'Dropout' && layers[i + 1].type === 'Dropout') errors.push('Consecutive Dropout layers at positions ' + (i + 1) + '-' + (i + 2) + '.');
  }
  if (layers.length < 3) errors.push('Network should have at least Input, one hidden layer, and Output.');
  return errors;
}

function generateCode(layers: Layer[]): string {
  const lines: string[] = [
    'import tensorflow as tf',
    'from tensorflow import keras',
    'from tensorflow.keras import layers',
    '',
    'model = keras.Sequential([',
  ];

  for (let i = 0; i < layers.length; i++) {
    const l = layers[i];
    let line = '    ';
    switch (l.type) {
      case 'Input':
        line += `keras.Input(shape=(${l.neurons},)),`;
        break;
      case 'Dense':
        line += `layers.Dense(${l.neurons}, activation='${l.activation}'),`;
        break;
      case 'Output':
        line += `layers.Dense(${l.neurons}, activation='${l.activation}'),  # Output`;
        break;
      case 'Conv2D':
        line += `layers.Conv2D(${l.neurons}, (${l.kernelSize}, ${l.kernelSize}), activation='${l.activation}'),`;
        break;
      case 'Dropout':
        line += `layers.Dropout(${l.dropoutRate}),`;
        break;
      case 'BatchNorm':
        line += `layers.BatchNormalization(),`;
        break;
    }
    lines.push(line);
  }

  lines.push('])');
  lines.push('');
  lines.push("model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])");
  lines.push('model.summary()');
  return lines.join('\n');
}

const PRESETS: Record<PresetName, () => Layer[]> = {
  MLP: () => [
    { ...defaultLayer('Input'), neurons: 784 },
    { ...defaultLayer('Dense'), neurons: 256, activation: 'relu' },
    { ...defaultLayer('Dropout'), dropoutRate: 0.3 },
    { ...defaultLayer('Dense'), neurons: 128, activation: 'relu' },
    { ...defaultLayer('Dropout'), dropoutRate: 0.2 },
    { ...defaultLayer('Output'), neurons: 10, activation: 'softmax' },
  ],
  CNN: () => [
    { ...defaultLayer('Input'), neurons: 784 },
    { ...defaultLayer('Conv2D'), neurons: 32, kernelSize: 3, activation: 'relu' },
    { ...defaultLayer('Conv2D'), neurons: 64, kernelSize: 3, activation: 'relu' },
    { ...defaultLayer('BatchNorm') },
    { ...defaultLayer('Dropout'), dropoutRate: 0.25 },
    { ...defaultLayer('Dense'), neurons: 128, activation: 'relu' },
    { ...defaultLayer('Output'), neurons: 10, activation: 'softmax' },
  ],
  Autoencoder: () => [
    { ...defaultLayer('Input'), neurons: 784 },
    { ...defaultLayer('Dense'), neurons: 256, activation: 'relu' },
    { ...defaultLayer('Dense'), neurons: 64, activation: 'relu' },
    { ...defaultLayer('Dense'), neurons: 32, activation: 'relu' },
    { ...defaultLayer('Dense'), neurons: 64, activation: 'relu' },
    { ...defaultLayer('Dense'), neurons: 256, activation: 'relu' },
    { ...defaultLayer('Output'), neurons: 784, activation: 'sigmoid' },
  ],
};

/* ------------------------------------------------------------------ */
/*  Canvas drawing                                                     */
/* ------------------------------------------------------------------ */

const LAYER_COLORS: Record<LayerType, string> = {
  Input: '#3b82f6',
  Dense: '#8b5cf6',
  Conv2D: '#f59e0b',
  Dropout: '#6b7280',
  BatchNorm: '#14b8a6',
  Output: '#ef4444',
};

function drawNetwork(canvas: HTMLCanvasElement, layers: Layer[]) {
  const ctx = canvas.getContext('2d')!;
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  if (layers.length === 0) {
    ctx.fillStyle = '#6b7280';
    ctx.font = '14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Add layers to visualise the architecture', W / 2, H / 2);
    return;
  }

  const padding = 40;
  const layerSpacing = (W - padding * 2) / Math.max(layers.length - 1, 1);

  // Calculate node positions
  const positions: { x: number; y: number; nodes: number; color: string }[] = [];
  for (let i = 0; i < layers.length; i++) {
    const l = layers[i];
    const x = padding + i * layerSpacing;
    const maxDisplay = Math.min(l.type === 'Dropout' || l.type === 'BatchNorm' ? 3 : Math.ceil(Math.sqrt(l.neurons)), 8);
    positions.push({ x, y: H / 2, nodes: maxDisplay, color: LAYER_COLORS[l.type] });
  }

  // Draw connections
  for (let i = 0; i < positions.length - 1; i++) {
    const curr = positions[i];
    const next = positions[i + 1];
    const currNodeSpacing = Math.min(30, (H - 80) / (curr.nodes + 1));
    const nextNodeSpacing = Math.min(30, (H - 80) / (next.nodes + 1));

    for (let ci = 0; ci < curr.nodes; ci++) {
      for (let ni = 0; ni < next.nodes; ni++) {
        const y1 = curr.y - (curr.nodes - 1) * currNodeSpacing / 2 + ci * currNodeSpacing;
        const y2 = next.y - (next.nodes - 1) * nextNodeSpacing / 2 + ni * nextNodeSpacing;
        ctx.beginPath();
        ctx.moveTo(curr.x, y1);
        ctx.lineTo(next.x, y2);
        ctx.strokeStyle = 'rgba(100,116,139,0.12)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }

  // Draw nodes
  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i];
    const l = layers[i];
    const nodeSpacing = Math.min(30, (H - 80) / (pos.nodes + 1));
    const r = 8;

    for (let ni = 0; ni < pos.nodes; ni++) {
      const ny = pos.y - (pos.nodes - 1) * nodeSpacing / 2 + ni * nodeSpacing;
      ctx.beginPath();
      ctx.arc(pos.x, ny, r, 0, Math.PI * 2);
      ctx.fillStyle = pos.color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    const topY = pos.y - (pos.nodes - 1) * nodeSpacing / 2 - 18;
    ctx.fillText(l.type, pos.x, topY);
    if (l.type !== 'Dropout' && l.type !== 'BatchNorm') {
      ctx.fillText(`${l.neurons}`, pos.x, topY + 11);
    } else if (l.type === 'Dropout') {
      ctx.fillText(`${(l.dropoutRate * 100).toFixed(0)}%`, pos.x, topY + 11);
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const ACTIVATIONS: Activation[] = ['relu', 'sigmoid', 'tanh', 'softmax', 'linear', 'leaky_relu'];
const LAYER_TYPES: LayerType[] = ['Input', 'Dense', 'Conv2D', 'Dropout', 'BatchNorm', 'Output'];

export const DeepLearningBuilder: React.FC = () => {
  const [layers, setLayers] = useState<Layer[]>(PRESETS.MLP());
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showCode, setShowCode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const params = paramCount(layers);
  const errors = validate(layers);

  /* Draw the network whenever layers change */
  useEffect(() => {
    if (canvasRef.current) drawNetwork(canvasRef.current, layers);
  }, [layers]);

  /* Resize redraw */
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const parent = canvasRef.current.parentElement;
        if (parent) {
          canvasRef.current.width = parent.clientWidth;
          canvasRef.current.height = Math.max(180, parent.clientHeight);
          drawNetwork(canvasRef.current, layers);
        }
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [layers]);

  const addLayer = useCallback((type: LayerType) => {
    setLayers(prev => {
      const newLayer = defaultLayer(type);
      if (type === 'Output') return [...prev, newLayer];
      // Insert before Output if exists
      const outIdx = prev.findIndex(l => l.type === 'Output');
      if (outIdx >= 0) {
        const copy = [...prev];
        copy.splice(outIdx, 0, newLayer);
        return copy;
      }
      return [...prev, newLayer];
    });
  }, []);

  const removeLayer = useCallback((idx: number) => {
    setLayers(prev => prev.filter((_, i) => i !== idx));
    setSelectedIdx(null);
  }, []);

  const updateLayer = useCallback((idx: number, updates: Partial<Layer>) => {
    setLayers(prev => prev.map((l, i) => i === idx ? { ...l, ...updates } : l));
  }, []);

  const moveLayer = useCallback((idx: number, dir: -1 | 1) => {
    setLayers(prev => {
      const copy = [...prev];
      const ni = idx + dir;
      if (ni < 0 || ni >= copy.length) return copy;
      [copy[idx], copy[ni]] = [copy[ni], copy[idx]];
      setSelectedIdx(ni);
      return copy;
    });
  }, []);

  const loadPreset = useCallback((name: PresetName) => {
    setLayers(PRESETS[name]());
    setSelectedIdx(null);
    setShowCode(false);
  }, []);

  const copyCode = () => navigator.clipboard.writeText(generateCode(layers));

  const selectClass = 'px-2 py-1 text-xs rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none';
  const sel = selectedIdx !== null ? layers[selectedIdx] : null;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-violet-50 dark:from-gray-950 dark:to-violet-950 p-3 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 mb-2 items-center">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Add Layer:</span>
        {LAYER_TYPES.map(t => (
          <button key={t} onClick={() => addLayer(t)}
            className="px-2 py-1 text-[11px] rounded-lg font-medium transition-colors"
            style={{ backgroundColor: LAYER_COLORS[t] + '22', color: LAYER_COLORS[t], border: `1px solid ${LAYER_COLORS[t]}44` }}>
            + {t}
          </button>
        ))}
        <div className="ml-auto flex gap-1.5">
          {(['MLP', 'CNN', 'Autoencoder'] as PresetName[]).map(p => (
            <button key={p} onClick={() => loadPreset(p)}
              className="px-2 py-1 text-[10px] rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700">
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-0 flex gap-3 overflow-hidden">
        {/* Layer list */}
        <div className="w-52 flex-shrink-0 flex flex-col overflow-auto bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-2 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-xs font-bold text-gray-700 dark:text-gray-200">Layers ({layers.length})</h3>
            <span className="text-[10px] text-gray-400">Total params: {params.total.toLocaleString()}</span>
          </div>
          <div className="flex-1 overflow-auto p-1.5 space-y-1">
            {layers.map((l, i) => (
              <div
                key={l.id}
                onClick={() => setSelectedIdx(selectedIdx === i ? null : i)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-xs transition-colors ${
                  selectedIdx === i ? 'bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-400' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: LAYER_COLORS[l.type] }} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-700 dark:text-gray-200 truncate">{l.type}</div>
                  <div className="text-[10px] text-gray-400">
                    {l.type === 'Dropout' ? `rate=${l.dropoutRate}` : l.type === 'BatchNorm' ? 'norm' : `n=${l.neurons}`}
                    {' '}&middot; {params.perLayer[i].toLocaleString()} params
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Canvas + config */}
        <div className="flex-1 flex flex-col min-w-0 gap-2">
          {/* Canvas */}
          <div className="flex-1 min-h-0 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-2">
            <canvas ref={canvasRef} className="w-full h-full" />
          </div>

          {/* Config panel / Code */}
          <div className="h-40 flex-shrink-0 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
            <div className="flex items-center border-b border-gray-100 dark:border-gray-800 px-3 py-1.5 gap-2">
              <button onClick={() => setShowCode(false)}
                className={`text-xs font-medium px-2 py-0.5 rounded ${!showCode ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                Properties
              </button>
              <button onClick={() => setShowCode(true)}
                className={`text-xs font-medium px-2 py-0.5 rounded ${showCode ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                Keras Code
              </button>
              {showCode && (
                <button onClick={copyCode} className="ml-auto text-[10px] px-2 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Copy
                </button>
              )}
              {errors.length > 0 && (
                <span className="ml-auto text-[10px] text-red-500 font-medium">{errors.length} issue{errors.length > 1 ? 's' : ''}</span>
              )}
            </div>

            <div className="flex-1 overflow-auto p-3 text-xs">
              {showCode ? (
                <pre className="font-mono text-[11px] text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{generateCode(layers)}</pre>
              ) : sel ? (
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div className="col-span-2 flex items-center justify-between">
                    <span className="font-bold text-gray-700 dark:text-gray-200">Layer {selectedIdx! + 1}: {sel.type}</span>
                    <div className="flex gap-1">
                      <button onClick={() => moveLayer(selectedIdx!, -1)} disabled={selectedIdx === 0}
                        className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300 disabled:opacity-30 text-[10px]">
                        Up
                      </button>
                      <button onClick={() => moveLayer(selectedIdx!, 1)} disabled={selectedIdx === layers.length - 1}
                        className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300 disabled:opacity-30 text-[10px]">
                        Dn
                      </button>
                      <button onClick={() => removeLayer(selectedIdx!)}
                        className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 rounded text-red-600 dark:text-red-400 text-[10px]">
                        Del
                      </button>
                    </div>
                  </div>
                  {sel.type !== 'BatchNorm' && sel.type !== 'Dropout' && (
                    <label className="flex flex-col gap-0.5">
                      <span className="text-gray-500 dark:text-gray-400">{sel.type === 'Conv2D' ? 'Filters' : 'Neurons'}</span>
                      <input type="number" min={1} max={4096} value={sel.neurons}
                        onChange={e => updateLayer(selectedIdx!, { neurons: Math.max(1, parseInt(e.target.value) || 1) })}
                        className={selectClass + ' w-full'} />
                    </label>
                  )}
                  {sel.type !== 'BatchNorm' && sel.type !== 'Dropout' && (
                    <label className="flex flex-col gap-0.5">
                      <span className="text-gray-500 dark:text-gray-400">Activation</span>
                      <select value={sel.activation} onChange={e => updateLayer(selectedIdx!, { activation: e.target.value as Activation })}
                        className={selectClass + ' w-full'}>
                        {ACTIVATIONS.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </label>
                  )}
                  {sel.type === 'Dropout' && (
                    <label className="flex flex-col gap-0.5">
                      <span className="text-gray-500 dark:text-gray-400">Dropout Rate</span>
                      <input type="number" step={0.05} min={0} max={0.9} value={sel.dropoutRate}
                        onChange={e => updateLayer(selectedIdx!, { dropoutRate: Math.max(0, Math.min(0.9, parseFloat(e.target.value) || 0)) })}
                        className={selectClass + ' w-full'} />
                    </label>
                  )}
                  {sel.type === 'Conv2D' && (
                    <label className="flex flex-col gap-0.5">
                      <span className="text-gray-500 dark:text-gray-400">Kernel Size</span>
                      <select value={sel.kernelSize} onChange={e => updateLayer(selectedIdx!, { kernelSize: parseInt(e.target.value) })}
                        className={selectClass + ' w-full'}>
                        {[1, 3, 5, 7].map(k => <option key={k} value={k}>{k}x{k}</option>)}
                      </select>
                    </label>
                  )}
                </div>
              ) : errors.length > 0 ? (
                <div className="space-y-1">
                  {errors.map((e, i) => (
                    <div key={i} className="text-red-500 flex items-start gap-1">
                      <span className="mt-0.5">!</span> {e}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 dark:text-gray-500 italic">Click a layer to edit its properties.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
