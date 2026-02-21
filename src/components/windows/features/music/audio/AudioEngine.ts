let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let analyserNode: AnalyserNode | null = null;

export function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 1.0;
    analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 2048;
    masterGain.connect(analyserNode);
    analyserNode.connect(audioContext.destination);
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

export function getMasterGain(): GainNode {
  getAudioContext();
  return masterGain!;
}

export function getAnalyser(): AnalyserNode {
  getAudioContext();
  return analyserNode!;
}
