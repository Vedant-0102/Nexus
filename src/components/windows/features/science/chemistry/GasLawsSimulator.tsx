import React, { useState, useEffect } from 'react';
import { Wind, Thermometer, Gauge, Info, Play, Pause } from 'lucide-react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export const GasLawsSimulator: React.FC = () => {
  const [temperature, setTemperature] = useState(300); // Kelvin
  const [volume, setVolume] = useState(100); // Arbitrary units
  const [numParticles, setNumParticles] = useState(50);
  const [isPlaying, setIsPlaying] = useState(true);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [selectedLaw, setSelectedLaw] = useState<'boyle' | 'charles' | 'gay-lussac' | 'ideal'>('ideal');

  // Initialize particles
  useEffect(() => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < numParticles; i++) {
      newParticles.push({
        x: Math.random() * volume * 3,
        y: Math.random() * 300,
        vx: (Math.random() - 0.5) * (temperature / 150),
        vy: (Math.random() - 0.5) * (temperature / 150)
      });
    }
    setParticles(newParticles);
  }, [numParticles]);

  // Animate particles
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setParticles(prev => prev.map(p => {
        let newX = p.x + p.vx;
        let newY = p.y + p.vy;
        let newVx = p.vx;
        let newVy = p.vy;

        // Bounce off walls
        const containerWidth = volume * 3;
        if (newX <= 0 || newX >= containerWidth) {
          newVx = -newVx;
          newX = Math.max(0, Math.min(containerWidth, newX));
        }
        if (newY <= 0 || newY >= 300) {
          newVy = -newVy;
          newY = Math.max(0, Math.min(300, newY));
        }

        // Adjust speed based on temperature
        const speedFactor = temperature / 300;
        newVx *= speedFactor;
        newVy *= speedFactor;

        return { x: newX, y: newY, vx: newVx, vy: newVy };
      }));
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, temperature, volume]);

  const pressure = (numParticles * temperature) / volume;
  const containerWidth = volume * 3;

  const laws = {
    boyle: { name: "Boyle's Law", formula: "PV = constant", description: "Pressure × Volume is constant at constant temperature" },
    charles: { name: "Charles's Law", formula: "V/T = constant", description: "Volume / Temperature is constant at constant pressure" },
    'gay-lussac': { name: "Gay-Lussac's Law", formula: "P/T = constant", description: "Pressure / Temperature is constant at constant volume" },
    ideal: { name: "Ideal Gas Law", formula: "PV = nRT", description: "Combines all gas laws" }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Wind className="h-6 w-6 text-cyan-600" />
          Gas Laws Simulator
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Interactive visualization of gas behavior
        </p>
      </div>

      <div className="flex-1 flex gap-6">
        {/* Visualization */}
        <div className="flex-1 flex flex-col">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Gas Container</h3>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
            </div>
            
            {/* Container */}
            <div 
              className="border-4 border-gray-400 dark:border-gray-600 bg-gradient-to-b from-transparent to-blue-100/20 dark:to-blue-900/20 relative transition-all duration-500"
              style={{ width: `${containerWidth}px`, height: '300px' }}
            >
              {/* Particles */}
              {particles.map((particle, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-blue-500 rounded-full"
                  style={{
                    left: `${particle.x}px`,
                    top: `${particle.y}px`,
                    transition: 'all 0.05s linear'
                  }}
                />
              ))}
              
              {/* Temperature indicator */}
              <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                {temperature}K
              </div>
            </div>

            {/* Measurements */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded p-3">
                <div className="text-xs text-gray-600 dark:text-gray-400">Pressure</div>
                <div className="text-lg font-bold text-blue-600">{pressure.toFixed(1)}</div>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 rounded p-3">
                <div className="text-xs text-gray-600 dark:text-gray-400">Volume</div>
                <div className="text-lg font-bold text-green-600">{volume}</div>
              </div>
              <div className="bg-red-100 dark:bg-red-900/30 rounded p-3">
                <div className="text-xs text-gray-600 dark:text-gray-400">Temperature</div>
                <div className="text-lg font-bold text-red-600">{temperature}K</div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="w-80 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Gas Law</h3>
            <select
              value={selectedLaw}
              onChange={(e) => setSelectedLaw(e.target.value as any)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            >
              {Object.entries(laws).map(([key, law]) => (
                <option key={key} value={key}>{law.name}</option>
              ))}
            </select>
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded">
              <div className="font-mono text-sm text-center mb-2">{laws[selectedLaw].formula}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{laws[selectedLaw].description}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Thermometer className="h-4 w-4" />
              Temperature
            </h3>
            <input
              type="range"
              min="100"
              max="500"
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-center text-sm mt-2">{temperature} K ({(temperature - 273).toFixed(0)}°C)</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              Volume
            </h3>
            <input
              type="range"
              min="50"
              max="150"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-center text-sm mt-2">{volume} units</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Number of Particles (n)</h3>
            <input
              type="range"
              min="10"
              max="100"
              value={numParticles}
              onChange={(e) => setNumParticles(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-center text-sm mt-2">{numParticles} particles</div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <Info className="h-4 w-4" />
              Learning Points
            </h3>
            <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
              <li>• Increase temperature → particles move faster</li>
              <li>• Decrease volume → pressure increases</li>
              <li>• More particles → higher pressure</li>
              <li>• Observe kinetic molecular theory in action</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
