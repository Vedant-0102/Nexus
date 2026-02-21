import type { InstrumentType, OscType } from './types';
import { midiToFrequency } from './constants';

function applyADSR(ctx: AudioContext, gain: GainNode, a: number, d: number, s: number, r: number, startTime: number, duration: number) {
  const t = startTime;
  // Clamp release so it never exceeds remaining time after attack+decay
  const safeR = Math.min(r, Math.max(0.01, duration - a - d));
  const sustainEnd = t + duration - safeR;
  gain.gain.setValueAtTime(0.001, t);
  gain.gain.linearRampToValueAtTime(1, t + a);
  gain.gain.linearRampToValueAtTime(s, t + a + d);
  if (sustainEnd > t + a + d) {
    gain.gain.setValueAtTime(s, sustainEnd);
  }
  gain.gain.linearRampToValueAtTime(0.001, t + duration);
}

export function playNote(ctx: AudioContext, dest: AudioNode, instrument: InstrumentType, midi: number, velocity: number, startTime?: number, duration?: number) {
  const t = startTime ?? ctx.currentTime;
  const dur = duration ?? 0.5;
  const vel = velocity / 127;

  switch (instrument) {
    case 'piano': return playPiano(ctx, dest, midi, vel, t, dur);
    case 'guitar': return playGuitar(ctx, dest, midi, vel, t, dur);
    case 'synth': return playSynth(ctx, dest, midi, vel, t, dur, 'sawtooth');
    case 'bass': return playBass(ctx, dest, midi, vel, t, dur);
    case 'strings': return playStrings(ctx, dest, midi, vel, t, dur);
    case 'drums': return playDrumHit(ctx, dest, midi);
  }
}

function playPiano(ctx: AudioContext, dest: AudioNode, midi: number, vel: number, t: number, dur: number) {
  const freq = midiToFrequency(midi);
  const out = ctx.createGain();
  out.gain.value = vel * 0.6;
  out.connect(dest);

  [1, 2, 3].forEach((h, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq * h;
    g.gain.value = 1 / (h * h);
    osc.connect(g);
    g.connect(out);
    applyADSR(ctx, g, 0.005, 0.2, 0.3, Math.min(dur, 0.8), t, dur);
    osc.start(t);
    osc.stop(t + dur + 0.1);
  });
}

function playGuitar(ctx: AudioContext, dest: AudioNode, midi: number, vel: number, t: number, dur: number) {
  const freq = midiToFrequency(midi);
  const bufferSize = Math.round(ctx.sampleRate / freq);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 4000;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vel * 0.7, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + Math.max(dur, 1.5));

  source.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  source.start(t);
  source.stop(t + Math.max(dur, 1.5));
}

export function playSynth(ctx: AudioContext, dest: AudioNode, midi: number, vel: number, t: number, dur: number, oscType: OscType = 'sawtooth', filterFreq = 2000) {
  const freq = midiToFrequency(midi);
  const osc = ctx.createOscillator();
  osc.type = oscType;
  osc.frequency.value = freq;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  filter.Q.value = 2;

  const gain = ctx.createGain();
  gain.gain.value = vel * 0.5;
  applyADSR(ctx, gain, 0.01, 0.15, 0.6, Math.min(dur * 0.3, 0.5), t, dur);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  osc.start(t);
  osc.stop(t + dur + 0.6);
}

function playBass(ctx: AudioContext, dest: AudioNode, midi: number, vel: number, t: number, dur: number) {
  const freq = midiToFrequency(midi);
  const out = ctx.createGain();
  out.gain.value = vel * 0.8;
  out.connect(dest);

  const osc1 = ctx.createOscillator();
  osc1.type = 'sawtooth';
  osc1.frequency.value = freq;
  const g1 = ctx.createGain();
  g1.gain.value = 0.6;
  applyADSR(ctx, g1, 0.01, 0.1, 0.7, 0.3, t, dur);
  osc1.connect(g1);
  g1.connect(out);

  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.value = freq / 2;
  const g2 = ctx.createGain();
  g2.gain.value = 0.8;
  applyADSR(ctx, g2, 0.01, 0.1, 0.7, 0.3, t, dur);
  osc2.connect(g2);
  g2.connect(out);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1200;
  out.disconnect();
  out.connect(filter);
  filter.connect(dest);

  osc1.start(t);
  osc1.stop(t + dur + 0.4);
  osc2.start(t);
  osc2.stop(t + dur + 0.4);
}

function playStrings(ctx: AudioContext, dest: AudioNode, midi: number, vel: number, t: number, dur: number) {
  const freq = midiToFrequency(midi);
  const out = ctx.createGain();
  out.gain.value = vel * 0.45;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 3000;
  out.connect(filter);
  filter.connect(dest);

  const detunes = [-7, -3, 3, 7];
  detunes.forEach(d => {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    osc.detune.value = d;
    const g = ctx.createGain();
    g.gain.value = 0.25;
    applyADSR(ctx, g, 0.3, 0.2, 0.8, 0.5, t, dur);
    osc.connect(g);
    g.connect(out);
    osc.start(t);
    osc.stop(t + dur + 0.6);
  });
}

// Drum synthesis
export function playDrumHit(ctx: AudioContext, dest: AudioNode, drumIndex: number, time?: number) {
  const t = time ?? ctx.currentTime;
  switch (drumIndex) {
    case 0: return playKick(ctx, dest, t);
    case 1: return playSnare(ctx, dest, t);
    case 2: return playHiHat(ctx, dest, t, false);
    case 3: return playHiHat(ctx, dest, t, true);
    case 4: return playTom(ctx, dest, t, 120);
    case 5: return playTom(ctx, dest, t, 180);
    case 6: return playClap(ctx, dest, t);
    case 7: return playRide(ctx, dest, t);
  }
}

function playKick(ctx: AudioContext, dest: AudioNode, t: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
  gain.gain.setValueAtTime(1.2, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(t);
  osc.stop(t + 0.5);
}

function playSnare(ctx: AudioContext, dest: AudioNode, t: number) {
  const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuf;
  const nf = ctx.createBiquadFilter();
  nf.type = 'bandpass';
  nf.frequency.value = 1000;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.9, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  noise.connect(nf);
  nf.connect(ng);
  ng.connect(dest);
  noise.start(t);
  noise.stop(t + 0.15);

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 200;
  const og = ctx.createGain();
  og.gain.setValueAtTime(0.6, t);
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  osc.connect(og);
  og.connect(dest);
  osc.start(t);
  osc.stop(t + 0.08);
}

function playHiHat(ctx: AudioContext, dest: AudioNode, t: number, open: boolean) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * (open ? 0.3 : 0.05), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = 7000;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.5, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + (open ? 0.3 : 0.05));
  src.connect(f);
  f.connect(g);
  g.connect(dest);
  src.start(t);
  src.stop(t + (open ? 0.3 : 0.05));
}

function playTom(ctx: AudioContext, dest: AudioNode, t: number, freq: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.6, t + 0.15);
  gain.gain.setValueAtTime(0.7, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(t);
  osc.stop(t + 0.25);
}

function playClap(ctx: AudioContext, dest: AudioNode, t: number) {
  for (let i = 0; i < 3; i++) {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.02, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let j = 0; j < d.length; j++) d[j] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 1500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.6, t + i * 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.015 + 0.08);
    src.connect(f);
    f.connect(g);
    g.connect(dest);
    src.start(t + i * 0.015);
    src.stop(t + i * 0.015 + 0.08);
  }
}

function playRide(ctx: AudioContext, dest: AudioNode, t: number) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = 5000;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.3, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
  src.connect(f);
  f.connect(g);
  g.connect(dest);
  src.start(t);
  src.stop(t + 0.5);
}
