import React, { useState } from 'react';
import { Atom, Zap, Bomb, Wind, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { usePhysics } from '../context/PhysicsContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

import { useWindows } from '../context/WindowsContext';

interface PhysicsToggleProps {
  onBallPitToggle?: () => void;
  isBallPitMode?: boolean;
}

export const PhysicsToggle: React.FC<PhysicsToggleProps> = ({ onBallPitToggle, isBallPitMode = false }) => {
  const { isPhysicsEnabled, togglePhysics, shake, explode, setGravityMultiplier, gravityMultiplier } = usePhysics();
  const { windows } = useWindows();
  const [showControls, setShowControls] = useState(false);

  // Hide if any window is open
  const hasOpenWindows = windows.some(w => w.isOpen && !w.isMinimized);
  if (hasOpenWindows) return null;

  const handleExplode = () => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    explode(centerX, centerY);
  };

  const gravityPresets = [
    { name: 'Moon', value: 0.17 },
    { name: 'Mars', value: 0.38 },
    { name: 'Earth', value: 1 },
    { name: 'Jupiter', value: 2.5 },
  ];

  return (
    <div className="fixed top-4 right-4 z-[10000] flex flex-col items-end gap-2">
      {/* Ball Pit Mode Toggle */}
      {onBallPitToggle && (
        <Button
          onClick={onBallPitToggle}
          className={`win11-glass transition-all duration-300 ${
            isBallPitMode
              ? 'bg-blue-500/80 hover:bg-blue-600/80 text-white'
              : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          size="sm"
        >
          <Wind size={16} className={`mr-2 ${isBallPitMode ? 'animate-bounce' : ''}`} />
          Ball Pit {isBallPitMode ? 'ON' : 'OFF'}
        </Button>
      )}

      {/* Main Toggle Button */}
      {!isBallPitMode && (
        <Button
          onClick={togglePhysics}
          className={`win11-glass transition-all duration-300 ${
            isPhysicsEnabled
              ? 'bg-purple-500/80 hover:bg-purple-600/80 text-white'
              : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          size="sm"
        >
          <Atom size={16} className={`mr-2 ${isPhysicsEnabled ? 'animate-spin' : ''}`} />
          Physics Mode {isPhysicsEnabled ? 'ON' : 'OFF'}
        </Button>
      )}

      {/* Controls Panel */}
      {isPhysicsEnabled && !isBallPitMode && (
        <div className="win11-glass bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-lg shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          {/* Toggle Controls Button */}
          <button
            onClick={() => setShowControls(!showControls)}
            className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings size={16} className="text-gray-700 dark:text-gray-300" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Physics Controls</span>
            </div>
            {showControls ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {/* Expanded Controls */}
          {showControls && (
            <div className="p-4 space-y-4 border-t border-gray-200 dark:border-gray-700">
              {/* Action Buttons */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Actions</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={shake}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Zap size={14} className="mr-1" />
                    Shake
                  </Button>
                  <Button
                    onClick={handleExplode}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Bomb size={14} className="mr-1" />
                    Explode
                  </Button>
                </div>
              </div>

              {/* Gravity Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Gravity</p>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {gravityMultiplier.toFixed(2)}x
                  </span>
                </div>
                <Slider
                  value={[gravityMultiplier]}
                  onValueChange={(values) => setGravityMultiplier(values[0])}
                  min={0}
                  max={3}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Gravity Presets */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Presets</p>
                <div className="grid grid-cols-2 gap-2">
                  {gravityPresets.map((preset) => (
                    <Button
                      key={preset.name}
                      onClick={() => setGravityMultiplier(preset.value)}
                      variant={Math.abs(gravityMultiplier - preset.value) < 0.05 ? 'default' : 'outline'}
                      size="sm"
                      className="w-full text-xs"
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  💡 Click elements to launch them upward
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
