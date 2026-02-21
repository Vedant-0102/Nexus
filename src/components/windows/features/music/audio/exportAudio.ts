import type { Track, InstrumentType } from './types';
import { midiToFrequency } from './constants';

export async function exportToWAV(tracks: Track[], bpm: number, totalBeats: number): Promise<Blob> {
  const sampleRate = 44100;
  const durationSec = (totalBeats * 60) / bpm;
  const offCtx = new OfflineAudioContext(2, Math.ceil(sampleRate * durationSec), sampleRate);

  const master = offCtx.createGain();
  master.gain.value = 0.8;
  master.connect(offCtx.destination);

  for (const track of tracks) {
    if (track.muted) continue;
    const tg = offCtx.createGain();
    tg.gain.value = track.volume;
    tg.connect(master);

    for (const note of track.notes) {
      const startTime = (note.startBeat * 60) / bpm;
      const dur = (note.duration * 60) / bpm;
      scheduleOfflineNote(offCtx, tg, track.instrument, note.midi, note.velocity, startTime, dur);
    }
  }

  const rendered = await offCtx.startRendering();
  return bufferToWAV(rendered);
}

function scheduleOfflineNote(ctx: OfflineAudioContext, dest: AudioNode, inst: InstrumentType, midi: number, vel: number, t: number, dur: number) {
  const freq = midiToFrequency(midi);
  const v = vel / 127;

  if (inst === 'piano' || inst === 'synth' || inst === 'bass' || inst === 'strings') {
    const osc = ctx.createOscillator();
    osc.type = inst === 'bass' ? 'sawtooth' : inst === 'strings' ? 'sawtooth' : 'sine';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(v * 0.3, t + 0.01);
    g.gain.linearRampToValueAtTime(v * 0.15, t + dur);
    g.gain.linearRampToValueAtTime(0.001, t + dur + 0.1);
    osc.connect(g);
    g.connect(dest);
    osc.start(t);
    osc.stop(t + dur + 0.15);
  } else if (inst === 'guitar') {
    const bufSize = Math.round(ctx.sampleRate / freq);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const g = ctx.createGain();
    g.gain.setValueAtTime(v * 0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + Math.max(dur, 1));
    src.connect(g);
    g.connect(dest);
    src.start(t);
    src.stop(t + Math.max(dur, 1));
  }
}

function bufferToWAV(buffer: AudioBuffer): Blob {
  const numCh = buffer.numberOfChannels;
  const sr = buffer.sampleRate;
  const bps = 16;
  const dataLen = buffer.length * numCh * (bps / 8);
  const ab = new ArrayBuffer(44 + dataLen);
  const v = new DataView(ab);

  const writeStr = (off: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i)); };

  writeStr(0, 'RIFF');
  v.setUint32(4, 36 + dataLen, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, numCh, true);
  v.setUint32(24, sr, true);
  v.setUint32(28, sr * numCh * (bps / 8), true);
  v.setUint16(32, numCh * (bps / 8), true);
  v.setUint16(34, bps, true);
  writeStr(36, 'data');
  v.setUint32(40, dataLen, true);

  let off = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < numCh; c++) {
      const s = Math.max(-1, Math.min(1, buffer.getChannelData(c)[i]));
      v.setInt16(off, s * 0x7FFF, true);
      off += 2;
    }
  }

  return new Blob([ab], { type: 'audio/wav' });
}
