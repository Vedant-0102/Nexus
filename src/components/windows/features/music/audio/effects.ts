import type { EffectNode, EffectType } from './types';

export function createEffect(ctx: AudioContext, type: EffectType, params: Record<string, number>): EffectNode {
  switch (type) {
    case 'reverb': return createReverb(ctx, params);
    case 'delay': return createDelay(ctx, params);
    case 'eq': return createEQ(ctx, params);
    case 'compressor': return createCompressor(ctx, params);
  }
}

function createReverb(ctx: AudioContext, params: Record<string, number>): EffectNode {
  const decay = params.decay ?? 2;
  const wet = params.wet ?? 0.3;

  const convolver = ctx.createConvolver();
  const len = ctx.sampleRate * decay;
  const impulse = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = impulse.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
  }
  convolver.buffer = impulse;

  const input = ctx.createGain();
  const output = ctx.createGain();
  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();

  dryGain.gain.value = 1 - wet;
  wetGain.gain.value = wet;

  input.connect(dryGain);
  input.connect(convolver);
  convolver.connect(wetGain);
  dryGain.connect(output);
  wetGain.connect(output);

  return {
    input, output,
    update: (p) => {
      wetGain.gain.value = p.wet ?? wet;
      dryGain.gain.value = 1 - (p.wet ?? wet);
    },
    dispose: () => { input.disconnect(); convolver.disconnect(); dryGain.disconnect(); wetGain.disconnect(); },
  };
}

function createDelay(ctx: AudioContext, params: Record<string, number>): EffectNode {
  const time = params.time ?? 0.3;
  const feedback = params.feedback ?? 0.4;
  const wet = params.wet ?? 0.3;

  const input = ctx.createGain();
  const output = ctx.createGain();
  const delayNode = ctx.createDelay(2);
  delayNode.delayTime.value = time;
  const fbGain = ctx.createGain();
  fbGain.gain.value = feedback;
  const dryGain = ctx.createGain();
  dryGain.gain.value = 1 - wet;
  const wetGain = ctx.createGain();
  wetGain.gain.value = wet;

  input.connect(dryGain);
  input.connect(delayNode);
  delayNode.connect(fbGain);
  fbGain.connect(delayNode);
  delayNode.connect(wetGain);
  dryGain.connect(output);
  wetGain.connect(output);

  return {
    input, output,
    update: (p) => {
      delayNode.delayTime.value = p.time ?? time;
      fbGain.gain.value = p.feedback ?? feedback;
      wetGain.gain.value = p.wet ?? wet;
      dryGain.gain.value = 1 - (p.wet ?? wet);
    },
    dispose: () => { input.disconnect(); delayNode.disconnect(); fbGain.disconnect(); },
  };
}

function createEQ(ctx: AudioContext, params: Record<string, number>): EffectNode {
  const low = ctx.createBiquadFilter();
  low.type = 'lowshelf';
  low.frequency.value = 200;
  low.gain.value = params.lowGain ?? 0;

  const mid = ctx.createBiquadFilter();
  mid.type = 'peaking';
  mid.frequency.value = 1000;
  mid.Q.value = 1;
  mid.gain.value = params.midGain ?? 0;

  const high = ctx.createBiquadFilter();
  high.type = 'highshelf';
  high.frequency.value = 4000;
  high.gain.value = params.highGain ?? 0;

  const input = ctx.createGain();
  input.connect(low);
  low.connect(mid);
  mid.connect(high);
  const output = ctx.createGain();
  high.connect(output);

  return {
    input, output,
    update: (p) => {
      low.gain.value = p.lowGain ?? 0;
      mid.gain.value = p.midGain ?? 0;
      high.gain.value = p.highGain ?? 0;
    },
    dispose: () => { input.disconnect(); low.disconnect(); mid.disconnect(); high.disconnect(); },
  };
}

function createCompressor(ctx: AudioContext, params: Record<string, number>): EffectNode {
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = params.threshold ?? -24;
  comp.ratio.value = params.ratio ?? 4;
  comp.attack.value = params.attack ?? 0.003;
  comp.release.value = params.release ?? 0.25;

  const input = ctx.createGain();
  const output = ctx.createGain();
  input.connect(comp);
  comp.connect(output);

  return {
    input, output,
    update: (p) => {
      comp.threshold.value = p.threshold ?? -24;
      comp.ratio.value = p.ratio ?? 4;
      comp.attack.value = p.attack ?? 0.003;
      comp.release.value = p.release ?? 0.25;
    },
    dispose: () => { input.disconnect(); comp.disconnect(); },
  };
}
