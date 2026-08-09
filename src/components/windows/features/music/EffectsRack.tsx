import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getAudioContext, getMasterGain, getAnalyser } from './audio/AudioEngine';
import { createEffect } from './audio/effects';
import { playNote } from './audio/synthesis';
import type { EffectType, EffectNode as EffectNodeType, InstrumentType } from './audio/types';

interface EffectSlot {
  type: EffectType;
  enabled: boolean;
  params: Record<string, number>;
  node: EffectNodeType | null;
}

const DEFAULT_PARAMS: Record<EffectType, Record<string, number>> = {
  reverb: { decay: 2, wet: 0.3 },
  delay: { time: 0.3, feedback: 0.4, wet: 0.3 },
  eq: { lowGain: 0, midGain: 0, highGain: 0 },
  compressor: { threshold: -24, ratio: 4, attack: 0.003, release: 0.25 },
};

const EFFECT_COLORS: Record<EffectType, string> = {
  reverb: 'blue',
  delay: 'green',
  eq: 'orange',
  compressor: 'purple',
};

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  color: string;
  onChange: (v: number) => void;
}

function Slider({ label, value, min, max, step = 0.01, unit = '', color, onChange }: SliderProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-gray-400 w-20 shrink-0">{label}</label>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className={`flex-1 accent-${color}-500`}
      />
      <span className="text-xs text-gray-500 w-16 text-right">{typeof value === 'number' ? (value < 1 && value > 0 ? value.toFixed(2) : Math.round(value * 100) / 100) : value}{unit}</span>
    </div>
  );
}

function ReverbControls({ params, color, onChange }: { params: Record<string, number>; color: string; onChange: (p: Record<string, number>) => void }) {
  return (
    <div className="space-y-2">
      <Slider label="Decay" value={params.decay} min={0.1} max={5} step={0.1} unit="s" color={color} onChange={v => onChange({ ...params, decay: v })} />
      <Slider label="Wet/Dry" value={params.wet} min={0} max={1} step={0.01} color={color} onChange={v => onChange({ ...params, wet: v })} />
    </div>
  );
}

function DelayControls({ params, color, onChange }: { params: Record<string, number>; color: string; onChange: (p: Record<string, number>) => void }) {
  return (
    <div className="space-y-2">
      <Slider label="Time" value={params.time} min={0.05} max={1} step={0.01} unit="s" color={color} onChange={v => onChange({ ...params, time: v })} />
      <Slider label="Feedback" value={params.feedback} min={0} max={0.9} step={0.01} color={color} onChange={v => onChange({ ...params, feedback: v })} />
      <Slider label="Wet/Dry" value={params.wet} min={0} max={1} step={0.01} color={color} onChange={v => onChange({ ...params, wet: v })} />
    </div>
  );
}

function EQControls({ params, color, onChange }: { params: Record<string, number>; color: string; onChange: (p: Record<string, number>) => void }) {
  return (
    <div className="space-y-2">
      <Slider label="Low (200Hz)" value={params.lowGain} min={-12} max={12} step={0.5} unit="dB" color={color} onChange={v => onChange({ ...params, lowGain: v })} />
      <Slider label="Mid (1kHz)" value={params.midGain} min={-12} max={12} step={0.5} unit="dB" color={color} onChange={v => onChange({ ...params, midGain: v })} />
      <Slider label="High (4kHz)" value={params.highGain} min={-12} max={12} step={0.5} unit="dB" color={color} onChange={v => onChange({ ...params, highGain: v })} />
    </div>
  );
}

function CompressorControls({ params, color, onChange }: { params: Record<string, number>; color: string; onChange: (p: Record<string, number>) => void }) {
  return (
    <div className="space-y-2">
      <Slider label="Threshold" value={params.threshold} min={-50} max={0} step={1} unit="dB" color={color} onChange={v => onChange({ ...params, threshold: v })} />
      <Slider label="Ratio" value={params.ratio} min={1} max={20} step={0.5} color={color} onChange={v => onChange({ ...params, ratio: v })} />
      <Slider label="Attack" value={params.attack * 1000} min={0} max={100} step={1} unit="ms" color={color} onChange={v => onChange({ ...params, attack: v / 1000 })} />
      <Slider label="Release" value={params.release * 1000} min={50} max={500} step={10} unit="ms" color={color} onChange={v => onChange({ ...params, release: v / 1000 })} />
    </div>
  );
}

export function EffectsRack() {
  const [slots, setSlots] = useState<EffectSlot[]>([
    { type: 'reverb', enabled: false, params: { ...DEFAULT_PARAMS.reverb }, node: null },
    { type: 'delay', enabled: false, params: { ...DEFAULT_PARAMS.delay }, node: null },
    { type: 'eq', enabled: false, params: { ...DEFAULT_PARAMS.eq }, node: null },
    { type: 'compressor', enabled: false, params: { ...DEFAULT_PARAMS.compressor }, node: null },
  ]);
  const [testInstrument, setTestInstrument] = useState<InstrumentType>('piano');
  const slotsRef = useRef(slots);

  useEffect(() => { slotsRef.current = slots; }, [slots]);

  const rebuildChain = useCallback(() => {
    const ctx = getAudioContext();
    const master = getMasterGain();
    const analyser = getAnalyser();

    // Dispose old nodes
    slotsRef.current.forEach(s => s.node?.dispose());

    // Disconnect master from analyser
    try { master.disconnect(); } catch {}

    const enabledSlots = slotsRef.current.filter(s => s.enabled);

    if (enabledSlots.length === 0) {
      master.connect(analyser);
      setSlots(prev => prev.map(s => ({ ...s, node: null })));
      return;
    }

    // Create new nodes and chain them
    const newSlots = slotsRef.current.map(s => {
      if (!s.enabled) return { ...s, node: null };
      const node = createEffect(ctx, s.type, s.params);
      return { ...s, node };
    });

    // Chain: master -> enabled[0].input -> enabled[0].output -> enabled[1].input -> ... -> analyser
    const enabled = newSlots.filter(s => s.node);
    master.connect(enabled[0].node!.input);
    for (let i = 0; i < enabled.length - 1; i++) {
      enabled[i].node!.output.connect(enabled[i + 1].node!.input);
    }
    enabled[enabled.length - 1].node!.output.connect(analyser);

    setSlots(newSlots);
  }, []);

  // Rebuild chain when enabled status changes
  const prevEnabledRef = useRef<string>('');
  useEffect(() => {
    const key = slots.map(s => s.enabled ? '1' : '0').join('');
    if (key !== prevEnabledRef.current) {
      prevEnabledRef.current = key;
      rebuildChain();
    }
  }, [slots, rebuildChain]);

  const toggleSlot = (idx: number) => {
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, enabled: !s.enabled } : s));
  };

  const updateParams = (idx: number, params: Record<string, number>) => {
    setSlots(prev => prev.map((s, i) => {
      if (i !== idx) return s;
      s.node?.update(params);
      return { ...s, params };
    }));
  };

  const playTestTone = () => {
    const ctx = getAudioContext();
    playNote(ctx, getMasterGain(), testInstrument, 60, 100, undefined, 1);
  };

  useEffect(() => {
    return () => {
      slotsRef.current.forEach(s => s.node?.dispose());
    };
  }, []);

  const instruments: InstrumentType[] = ['piano', 'guitar', 'synth', 'bass', 'strings'];

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white p-4 overflow-auto">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold">Effects Rack</h2>
        <div className="ml-auto flex items-center gap-2">
          <select
            value={testInstrument}
            onChange={e => setTestInstrument(e.target.value as InstrumentType)}
            className="bg-gray-700 text-sm rounded px-2 py-1 text-white"
          >
            {instruments.map(i => (
              <option key={i} value={i}>{i.charAt(0).toUpperCase() + i.slice(1)}</option>
            ))}
          </select>
          <button onClick={playTestTone} className="px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-700">
            Test Tone
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-3">
        {slots.map((slot, idx) => {
          const color = EFFECT_COLORS[slot.type];
          return (
            <div
              key={idx}
              className={`rounded-lg p-4 border transition-opacity ${
                slot.enabled
                  ? `bg-gray-800 border-${color}-500/50`
                  : 'bg-gray-850 border-gray-700 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                {idx > 0 && (
                  <div className="text-gray-600 text-xs mr-1">→</div>
                )}
                <button
                  onClick={() => toggleSlot(idx)}
                  className={`w-8 h-8 rounded-full text-xs font-bold transition-colors ${
                    slot.enabled ? `bg-${color}-600 text-white` : 'bg-gray-700 text-gray-500'
                  }`}
                >
                  {slot.enabled ? 'ON' : 'OFF'}
                </button>
                <h3 className="text-sm font-semibold capitalize">{slot.type}</h3>
                {!slot.enabled && <span className="text-xs text-gray-600 ml-auto">Bypassed</span>}
              </div>
              {slot.type === 'reverb' && <ReverbControls params={slot.params} color={color} onChange={p => updateParams(idx, p)} />}
              {slot.type === 'delay' && <DelayControls params={slot.params} color={color} onChange={p => updateParams(idx, p)} />}
              {slot.type === 'eq' && <EQControls params={slot.params} color={color} onChange={p => updateParams(idx, p)} />}
              {slot.type === 'compressor' && <CompressorControls params={slot.params} color={color} onChange={p => updateParams(idx, p)} />}
            </div>
          );
        })}
      </div>

      {/* Signal Flow */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
        <span>Input</span>
        {slots.map((s, i) => (
          <React.Fragment key={i}>
            <span>→</span>
            <span className={s.enabled ? `text-${EFFECT_COLORS[s.type]}-400` : 'text-gray-500'}>
              {s.type}
            </span>
          </React.Fragment>
        ))}
        <span>→</span>
        <span>Output</span>
      </div>
    </div>
  );
}
