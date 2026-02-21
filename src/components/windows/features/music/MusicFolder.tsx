import React from 'react';
import { useWindows } from '../../context/WindowsContext';

const MUSIC_APPS = [
  { id: 'virtual-instruments', name: 'Virtual Instruments', icon: '🎹', desc: 'Piano, Guitar, Drums, Synth, Bass, Strings' },
  { id: 'beat-sequencer', name: 'Beat Sequencer', icon: '🥁', desc: '16-step drum pattern sequencer' },
  { id: 'piano-roll', name: 'Piano Roll', icon: '🎼', desc: 'Multi-track MIDI note editor' },
  { id: 'waveform-visualizer', name: 'Waveform Visualizer', icon: '📊', desc: 'Real-time audio visualization' },
  { id: 'effects-rack', name: 'Effects Rack', icon: '🎛️', desc: 'Reverb, Delay, EQ, Compressor' },
  { id: 'chord-helper', name: 'Chord Progressions', icon: '🎵', desc: 'Build & play chord progressions' },
  { id: 'music-theory', name: 'Music Theory', icon: '📖', desc: 'Scales, intervals, circle of fifths' },
  { id: 'arpeggiator', name: 'Arpeggiator', icon: '🔄', desc: 'Pattern-based note generator' },
  { id: 'sample-pad', name: 'Sample Pad', icon: '🎚️', desc: '4x4 audio sample trigger pad' },
];

export function MusicFolder() {
  const { openWindow } = useWindows();

  return (
    <div className="h-full bg-gray-900 text-white p-6 overflow-auto">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {MUSIC_APPS.map(app => (
          <button
            key={app.id}
            onClick={() => openWindow(app.id)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors group"
          >
            <span className="text-3xl group-hover:scale-110 transition-transform">{app.icon}</span>
            <span className="text-sm font-medium text-center leading-tight">{app.name}</span>
            <span className="text-xs text-gray-500 text-center leading-tight">{app.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
