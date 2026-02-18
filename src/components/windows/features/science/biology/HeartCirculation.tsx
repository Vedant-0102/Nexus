import React, { useState, useEffect } from 'react';
import { Heart, Play, Pause, Info } from 'lucide-react';

export const HeartCirculation: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [phase, setPhase] = useState<'systole' | 'diastole'>('systole');
  const [heartRate, setHeartRate] = useState(72);
  const [time, setTime] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTime(t => {
        const newTime = (t + (heartRate / 60)) % 100;
        setPhase(newTime < 50 ? 'systole' : 'diastole');
        return newTime;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [isPlaying, heartRate]);

  const pulseSize = phase === 'systole' ? 1.1 : 0.9;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-red-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Heart className="h-6 w-6 text-red-600" />
          Heart & Blood Circulation
        </h2>
      </div>

      <div className="flex-1 flex gap-6">
        <div className="flex-1 flex items-center justify-center">
          <svg width="400" height="400" viewBox="0 0 400 400">
            {/* Heart chambers */}
            <g transform={`scale(${pulseSize}) translate(${(1-pulseSize)*200}, ${(1-pulseSize)*200})`}>
              {/* Right atrium */}
              <ellipse cx="150" cy="150" rx="50" ry="40" fill="#ff9999" stroke="#cc0000" strokeWidth="2" />
              {/* Right ventricle */}
              <ellipse cx="150" cy="230" rx="55" ry="50" fill="#ff6666" stroke="#cc0000" strokeWidth="2" />
              {/* Left atrium */}
              <ellipse cx="250" cy="150" rx="50" ry="40" fill="#ff9999" stroke="#cc0000" strokeWidth="2" />
              {/* Left ventricle */}
              <ellipse cx="250" cy="230" rx="55" ry="50" fill="#ff3333" stroke="#cc0000" strokeWidth="2" />
            </g>

            {/* Blood flow arrows */}
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="#0066cc" />
              </marker>
            </defs>
            
            {/* Circulation paths */}
            <path d="M 200,50 Q 150,100 150,150" stroke="#0066cc" strokeWidth="3" fill="none" markerEnd="url(#arrowhead)" />
            <path d="M 150,280 Q 150,320 200,350" stroke="#cc0000" strokeWidth="3" fill="none" markerEnd="url(#arrowhead)" />
            <path d="M 200,350 Q 250,320 250,280" stroke="#cc0000" strokeWidth="3" fill="none" markerEnd="url(#arrowhead)" />
            <path d="M 250,150 Q 250,100 200,50" stroke="#0066cc" strokeWidth="3" fill="none" markerEnd="url(#arrowhead)" />

            {/* Labels */}
            <text x="150" y="150" textAnchor="middle" fontSize="12" fill="#000">RA</text>
            <text x="150" y="230" textAnchor="middle" fontSize="12" fill="#000">RV</text>
            <text x="250" y="150" textAnchor="middle" fontSize="12" fill="#000">LA</text>
            <text x="250" y="230" textAnchor="middle" fontSize="12" fill="#000">LV</text>
            <text x="200" y="30" textAnchor="middle" fontSize="10" fill="#0066cc">To Lungs</text>
            <text x="200" y="380" textAnchor="middle" fontSize="10" fill="#cc0000">To Body</text>
          </svg>
        </div>

        <div className="w-80 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Controls</h3>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-full py-2 bg-blue-600 text-white rounded flex items-center justify-center gap-2"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Heart Rate: {heartRate} BPM</h3>
            <input
              type="range"
              min="40"
              max="180"
              value={heartRate}
              onChange={(e) => setHeartRate(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Current Phase</h3>
            <div className={`p-3 rounded text-center font-bold ${phase === 'systole' ? 'bg-red-200' : 'bg-blue-200'}`}>
              {phase.toUpperCase()}
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Circulation Path
            </h3>
            <ul className="text-xs space-y-1">
              <li>1. Body → Right Atrium (deoxygenated)</li>
              <li>2. Right Atrium → Right Ventricle</li>
              <li>3. Right Ventricle → Lungs</li>
              <li>4. Lungs → Left Atrium (oxygenated)</li>
              <li>5. Left Atrium → Left Ventricle</li>
              <li>6. Left Ventricle → Body</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
