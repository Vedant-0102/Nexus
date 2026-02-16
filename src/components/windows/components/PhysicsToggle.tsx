import React, { useState, useEffect, useCallback } from 'react';
import {
  Atom, Zap, Bomb, Wind, Settings, ChevronDown, ChevronUp,
  Snowflake, Play, Magnet, Tornado, ArrowUp, Shuffle,
  Layers, Gauge, Timer, Activity, Sparkles, RotateCcw,
  ArrowDownUp, MousePointer
} from 'lucide-react';
import { usePhysics } from '../context/PhysicsContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useWindows } from '../context/WindowsContext';
import { PhysicsEffect } from '../physics/PhysicsEngine';

interface PhysicsToggleProps {
  onBallPitToggle?: () => void;
  isBallPitMode?: boolean;
}

export const PhysicsToggle: React.FC<PhysicsToggleProps> = ({ onBallPitToggle, isBallPitMode = false }) => {
  const {
    isPhysicsEnabled, togglePhysics,
    shake, explode, implode, launchAll, scatter, stackInCenter,
    freezeAll, unfreezeAll, isAllFrozen,
    toggleEffect, isEffectActive, activeEffects, clearAllEffects,
    updateMagnetPosition,
    setGravityMultiplier, gravityMultiplier,
    setTimeScale, timeScale,
    setBounciness, bounciness,
    bodyCount, totalEnergy,
  } = usePhysics();
  const { windows } = useWindows();
  const [showControls, setShowControls] = useState(false);
  const [activeSection, setActiveSection] = useState<'actions' | 'effects' | 'tuning' | 'stats'>('actions');

  // Track mouse for magnet effect (hooks must be called before any early return)
  const handleMouseMove = useCallback((e: MouseEvent) => {
    updateMagnetPosition(e.clientX, e.clientY);
  }, [updateMagnetPosition]);

  const isMagnetActive = activeEffects.includes('magnet');
  useEffect(() => {
    if (isPhysicsEnabled && isMagnetActive) {
      document.addEventListener('mousemove', handleMouseMove);
      return () => document.removeEventListener('mousemove', handleMouseMove);
    }
  }, [isPhysicsEnabled, isMagnetActive, handleMouseMove]);

  // Hide if any window is open
  const hasOpenWindows = windows.some(w => w.isOpen && !w.isMinimized);
  if (hasOpenWindows) return null;

  const handleExplode = () => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    explode(centerX, centerY);
  };

  const handleImplode = () => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    implode(centerX, centerY);
  };

  const gravityPresets = [
    { name: 'Moon', value: 0.17, emoji: '🌙' },
    { name: 'Mars', value: 0.38, emoji: '🔴' },
    { name: 'Earth', value: 1, emoji: '🌍' },
    { name: 'Jupiter', value: 2.5, emoji: '🪐' },
  ];

  const effectButtons: { effect: PhysicsEffect; label: string; icon: React.ReactNode; color: string }[] = [
    { effect: 'tornado', label: 'Tornado', icon: <Tornado size={14} />, color: 'text-cyan-500' },
    { effect: 'magnet', label: 'Magnet', icon: <Magnet size={14} />, color: 'text-red-500' },
    { effect: 'wind-left', label: 'Wind \u2190', icon: <Wind size={14} className="scale-x-[-1]" />, color: 'text-sky-500' },
    { effect: 'wind-right', label: 'Wind \u2192', icon: <Wind size={14} />, color: 'text-sky-500' },
    { effect: 'slow-mo', label: 'Slow Mo', icon: <Timer size={14} />, color: 'text-amber-500' },
    { effect: 'reverse-gravity', label: 'Rev. Grav', icon: <ArrowDownUp size={14} />, color: 'text-purple-500' },
    { effect: 'chaos', label: 'Chaos', icon: <Sparkles size={14} />, color: 'text-orange-500' },
  ];

  const formatEnergy = (e: number) => {
    if (e < 1000) return Math.round(e).toString();
    if (e < 1000000) return (e / 1000).toFixed(1) + 'K';
    return (e / 1000000).toFixed(1) + 'M';
  };

  const sectionTabs = [
    { id: 'actions' as const, label: 'Actions', icon: <Zap size={12} /> },
    { id: 'effects' as const, label: 'Effects', icon: <Sparkles size={12} /> },
    { id: 'tuning' as const, label: 'Tuning', icon: <Gauge size={12} /> },
    { id: 'stats' as const, label: 'Stats', icon: <Activity size={12} /> },
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
        <div className="win11-glass bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-lg shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden w-72">
          {/* Toggle Controls Button */}
          <button
            onClick={() => setShowControls(!showControls)}
            className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings size={16} className="text-gray-700 dark:text-gray-300" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Physics Controls</span>
              {activeEffects.length > 0 && (
                <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-full text-[10px] font-bold">
                  {activeEffects.length}
                </span>
              )}
            </div>
            {showControls ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {/* Expanded Controls */}
          {showControls && (
            <div className="border-t border-gray-200 dark:border-gray-700">
              {/* Section Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                {sectionTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSection(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-semibold transition-colors ${
                      activeSection === tab.id
                        ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-500 bg-purple-50/50 dark:bg-purple-900/10'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-3 space-y-3 max-h-[400px] overflow-y-auto">
                {/* Actions Section */}
                {activeSection === 'actions' && (
                  <>
                    <div className="grid grid-cols-2 gap-1.5">
                      <Button onClick={shake} variant="outline" size="sm" className="w-full text-xs h-8">
                        <Zap size={13} className="mr-1 text-yellow-500" />
                        Shake
                      </Button>
                      <Button onClick={handleExplode} variant="outline" size="sm" className="w-full text-xs h-8">
                        <Bomb size={13} className="mr-1 text-red-500" />
                        Explode
                      </Button>
                      <Button onClick={handleImplode} variant="outline" size="sm" className="w-full text-xs h-8">
                        <Atom size={13} className="mr-1 text-blue-500" />
                        Implode
                      </Button>
                      <Button onClick={launchAll} variant="outline" size="sm" className="w-full text-xs h-8">
                        <ArrowUp size={13} className="mr-1 text-green-500" />
                        Launch
                      </Button>
                      <Button onClick={scatter} variant="outline" size="sm" className="w-full text-xs h-8">
                        <Shuffle size={13} className="mr-1 text-orange-500" />
                        Scatter
                      </Button>
                      <Button onClick={stackInCenter} variant="outline" size="sm" className="w-full text-xs h-8">
                        <Layers size={13} className="mr-1 text-indigo-500" />
                        Stack
                      </Button>
                    </div>

                    {/* Freeze Toggle */}
                    <Button
                      onClick={isAllFrozen ? unfreezeAll : freezeAll}
                      variant={isAllFrozen ? 'default' : 'outline'}
                      size="sm"
                      className={`w-full text-xs h-8 ${isAllFrozen ? 'bg-cyan-500 hover:bg-cyan-600 text-white' : ''}`}
                    >
                      {isAllFrozen ? (
                        <><Play size={13} className="mr-1.5" /> Unfreeze All</>
                      ) : (
                        <><Snowflake size={13} className="mr-1.5 text-cyan-500" /> Freeze All</>
                      )}
                    </Button>

                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed">
                        Drag to throw elements. Double-click to launch upward.
                      </p>
                    </div>
                  </>
                )}

                {/* Effects Section */}
                {activeSection === 'effects' && (
                  <>
                    <div className="space-y-1.5">
                      {effectButtons.map(({ effect, label, icon, color }) => {
                        const active = isEffectActive(effect);
                        return (
                          <button
                            key={effect}
                            onClick={() => toggleEffect(effect)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                              active
                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 ring-1 ring-purple-300 dark:ring-purple-700'
                                : 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            <span className={active ? color : 'text-gray-400 dark:text-gray-500'}>{icon}</span>
                            <span className="flex-1 text-left">{label}</span>
                            {active && (
                              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {isEffectActive('magnet') && (
                      <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/10 rounded text-[10px] text-red-600 dark:text-red-400">
                        <MousePointer size={12} />
                        <span>Move your mouse to attract elements</span>
                      </div>
                    )}

                    {activeEffects.length > 0 && (
                      <Button
                        onClick={clearAllEffects}
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-8 text-gray-500"
                      >
                        <RotateCcw size={13} className="mr-1.5" />
                        Clear All Effects ({activeEffects.length})
                      </Button>
                    )}
                  </>
                )}

                {/* Tuning Section */}
                {activeSection === 'tuning' && (
                  <>
                    {/* Gravity Slider */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Gravity</p>
                        <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                          {gravityMultiplier.toFixed(2)}x
                        </span>
                      </div>
                      <Slider
                        value={[gravityMultiplier]}
                        onValueChange={(values) => setGravityMultiplier(values[0])}
                        min={-3}
                        max={3}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="grid grid-cols-4 gap-1">
                        {gravityPresets.map((preset) => (
                          <Button
                            key={preset.name}
                            onClick={() => setGravityMultiplier(preset.value)}
                            variant={Math.abs(gravityMultiplier - preset.value) < 0.05 ? 'default' : 'outline'}
                            size="sm"
                            className="w-full text-[10px] h-7 px-1"
                          >
                            {preset.emoji} {preset.name}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Bounciness Slider */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Bounciness</p>
                        <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                          {bounciness.toFixed(1)}x
                        </span>
                      </div>
                      <Slider
                        value={[bounciness]}
                        onValueChange={(values) => setBounciness(values[0])}
                        min={0}
                        max={3}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { name: 'Flat', value: 0.2 },
                          { name: 'Normal', value: 1 },
                          { name: 'Super', value: 2.5 },
                        ].map((preset) => (
                          <Button
                            key={preset.name}
                            onClick={() => setBounciness(preset.value)}
                            variant={Math.abs(bounciness - preset.value) < 0.15 ? 'default' : 'outline'}
                            size="sm"
                            className="w-full text-[10px] h-7"
                          >
                            {preset.name}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Time Scale Slider */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Speed</p>
                        <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                          {timeScale.toFixed(2)}x
                        </span>
                      </div>
                      <Slider
                        value={[timeScale]}
                        onValueChange={(values) => setTimeScale(values[0])}
                        min={0.1}
                        max={3}
                        step={0.05}
                        className="w-full"
                      />
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { name: 'Slow', value: 0.25 },
                          { name: 'Normal', value: 1 },
                          { name: 'Fast', value: 2 },
                        ].map((preset) => (
                          <Button
                            key={preset.name}
                            onClick={() => setTimeScale(preset.value)}
                            variant={Math.abs(timeScale - preset.value) < 0.1 ? 'default' : 'outline'}
                            size="sm"
                            className="w-full text-[10px] h-7"
                          >
                            {preset.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Stats Section */}
                {activeSection === 'stats' && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Bodies</p>
                        <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{bodyCount}</p>
                      </div>
                      <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center">
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Energy</p>
                        <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{formatEnergy(totalEnergy)}</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Gravity</span>
                        <span className="font-mono text-gray-700 dark:text-gray-300">{gravityMultiplier.toFixed(2)}x</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Bounciness</span>
                        <span className="font-mono text-gray-700 dark:text-gray-300">{bounciness.toFixed(1)}x</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Time Scale</span>
                        <span className="font-mono text-gray-700 dark:text-gray-300">{timeScale.toFixed(2)}x</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Frozen</span>
                        <span className={`font-semibold ${isAllFrozen ? 'text-cyan-500' : 'text-gray-700 dark:text-gray-300'}`}>
                          {isAllFrozen ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>

                    {activeEffects.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">Active Effects</p>
                        <div className="flex flex-wrap gap-1">
                          {activeEffects.map(effect => (
                            <span
                              key={effect}
                              className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] font-semibold rounded-full"
                            >
                              {effect}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Energy Bar */}
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">Energy Level</p>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-green-400 via-yellow-400 to-red-500"
                          style={{ width: `${Math.min(100, totalEnergy / 5000)}%` }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
