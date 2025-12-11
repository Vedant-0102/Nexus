
import React, { useState } from 'react';
import { Volume, Volume2, VolumeX } from 'lucide-react';

export const VolumeControl = () => {
  const [volume, setVolume] = useState(50);
  const [muted, setMuted] = useState(false);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value, 10);
    setVolume(newVolume);
    if (newVolume === 0) {
      setMuted(true);
    } else if (muted) {
      setMuted(false);
    }
  };

  const toggleMute = () => {
    setMuted(!muted);
  };

  const getVolumeIcon = () => {
    if (muted || volume === 0) {
      return <VolumeX />;
    } else if (volume < 50) {
      return <Volume />;
    } else {
      return <Volume2 />;
    }
  };

  return (
    <div className="p-4 h-full">
      <h2 className="text-2xl font-semibold mb-4">Volume Control</h2>
      <div className="bg-white/50 p-6 rounded-lg max-w-md mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={toggleMute}
            className="p-2 rounded-full hover:bg-gray-200/50 transition-colors"
          >
            {getVolumeIcon()}
          </button>
          <div className="flex-1">
            <input
              type="range"
              min="0"
              max="100"
              value={muted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-full"
            />
          </div>
          <span className="text-sm font-medium w-8 text-center">
            {muted ? 0 : volume}%
          </span>
        </div>
        <div className="text-center text-sm">
          {muted ? 'Audio is muted' : `Volume level: ${volume}%`}
        </div>
      </div>
    </div>
  );
};
