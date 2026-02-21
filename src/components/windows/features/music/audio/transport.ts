import type { TransportState, TransportListener, BeatListener } from './types';

const SCHEDULE_AHEAD = 0.1;
const LOOKAHEAD_MS = 25;

let state: TransportState = { bpm: 120, isPlaying: false, currentBeat: 0, timeSignature: [4, 4] };
const stateListeners = new Set<TransportListener>();
const beatListeners = new Set<BeatListener>();
let timerID: number | null = null;
let nextBeatTime = 0;
let audioCtxRef: AudioContext | null = null;

export function getTransport(): TransportState {
  return { ...state };
}

export function subscribeTransport(fn: TransportListener): () => void {
  stateListeners.add(fn);
  return () => stateListeners.delete(fn);
}

export function subscribeBeat(fn: BeatListener): () => void {
  beatListeners.add(fn);
  return () => beatListeners.delete(fn);
}

function notify() {
  const s = { ...state };
  stateListeners.forEach(fn => fn(s));
}

function scheduler() {
  if (!audioCtxRef) return;
  while (nextBeatTime < audioCtxRef.currentTime + SCHEDULE_AHEAD) {
    beatListeners.forEach(fn => fn(state.currentBeat, nextBeatTime));
    const secondsPerStep = 60.0 / state.bpm / 4;
    nextBeatTime += secondsPerStep;
    state.currentBeat = (state.currentBeat + 1) % 16;
    notify();
  }
  timerID = window.setTimeout(scheduler, LOOKAHEAD_MS);
}

export function startTransport(ctx: AudioContext) {
  if (timerID !== null) return;
  audioCtxRef = ctx;
  nextBeatTime = ctx.currentTime;
  state.isPlaying = true;
  state.currentBeat = 0;
  notify();
  scheduler();
}

export function stopTransport() {
  if (timerID !== null) {
    window.clearTimeout(timerID);
    timerID = null;
  }
  state.isPlaying = false;
  state.currentBeat = 0;
  notify();
}

export function setBPM(bpm: number) {
  state.bpm = Math.max(30, Math.min(300, bpm));
  notify();
}

export function setTimeSignature(ts: [number, number]) {
  state.timeSignature = ts;
  notify();
}
