import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, ZoomIn, ZoomOut } from 'lucide-react';

interface Atom {
  element: string;
  x: number;
  y: number;
  z: number;
}

interface Molecule {
  name: string;
  formula: string;
  atoms: Atom[];
  properties: {
    molarMass: string;
    boilingPoint?: string;
    meltingPoint?: string;
    density?: string;
    uses: string;
  };
}

const molecules: Molecule[] = [
  { 
    name: 'Water', 
    formula: 'H₂O', 
    atoms: [
      { element: 'O', x: 0, y: 0, z: 0 },
      { element: 'H', x: -0.76, y: 0.59, z: 0 },
      { element: 'H', x: 0.76, y: 0.59, z: 0 }
    ],
    properties: {
      molarMass: '18.015 g/mol',
      boilingPoint: '100°C',
      meltingPoint: '0°C',
      density: '1.00 g/cm³',
      uses: 'Universal solvent, essential for life'
    }
  },
  { 
    name: 'Carbon Dioxide', 
    formula: 'CO₂', 
    atoms: [
      { element: 'C', x: 0, y: 0, z: 0 },
      { element: 'O', x: -1.16, y: 0, z: 0 },
      { element: 'O', x: 1.16, y: 0, z: 0 }
    ],
    properties: {
      molarMass: '44.01 g/mol',
      boilingPoint: '-78.5°C (sublimes)',
      meltingPoint: '-56.6°C',
      density: '1.98 g/L',
      uses: 'Photosynthesis, carbonated drinks, fire extinguishers'
    }
  },
  { 
    name: 'Methane', 
    formula: 'CH₄', 
    atoms: [
      { element: 'C', x: 0, y: 0, z: 0 },
      { element: 'H', x: 0.63, y: 0.63, z: 0.63 },
      { element: 'H', x: -0.63, y: -0.63, z: 0.63 },
      { element: 'H', x: -0.63, y: 0.63, z: -0.63 },
      { element: 'H', x: 0.63, y: -0.63, z: -0.63 }
    ],
    properties: {
      molarMass: '16.04 g/mol',
      boilingPoint: '-161.5°C',
      meltingPoint: '-182.5°C',
      density: '0.656 g/L',
      uses: 'Natural gas, fuel, chemical synthesis'
    }
  },
  { 
    name: 'Ammonia', 
    formula: 'NH₃', 
    atoms: [
      { element: 'N', x: 0, y: 0, z: 0 },
      { element: 'H', x: 0.94, y: 0, z: 0.38 },
      { element: 'H', x: -0.47, y: 0.82, z: 0.38 },
      { element: 'H', x: -0.47, y: -0.82, z: 0.38 }
    ],
    properties: {
      molarMass: '17.03 g/mol',
      boilingPoint: '-33.34°C',
      meltingPoint: '-77.73°C',
      density: '0.73 g/L',
      uses: 'Fertilizers, cleaning products, refrigerant'
    }
  },
  { 
    name: 'Ethanol', 
    formula: 'C₂H₅OH', 
    atoms: [
      { element: 'C', x: -0.75, y: 0, z: 0 },
      { element: 'C', x: 0.75, y: 0, z: 0 },
      { element: 'O', x: 1.25, y: 1.2, z: 0 },
      { element: 'H', x: 2.2, y: 1.2, z: 0 },
      { element: 'H', x: -1.2, y: -0.5, z: 0.8 },
      { element: 'H', x: -1.2, y: -0.5, z: -0.8 },
      { element: 'H', x: -1.2, y: 1, z: 0 }
    ],
    properties: {
      molarMass: '46.07 g/mol',
      boilingPoint: '78.37°C',
      meltingPoint: '-114.1°C',
      density: '0.789 g/cm³',
      uses: 'Alcoholic beverages, fuel, solvent, disinfectant'
    }
  },
  { 
    name: 'Glucose', 
    formula: 'C₆H₁₂O₆', 
    atoms: [
      { element: 'C', x: 0, y: 0, z: 0 },
      { element: 'C', x: 1.2, y: 0.7, z: 0 },
      { element: 'C', x: 1.2, y: 2.1, z: 0 },
      { element: 'C', x: 0, y: 2.8, z: 0 },
      { element: 'C', x: -1.2, y: 2.1, z: 0 },
      { element: 'O', x: -1.2, y: 0.7, z: 0 },
      { element: 'O', x: 0, y: -1.4, z: 0 },
      { element: 'O', x: 2.4, y: 0, z: 0 },
      { element: 'O', x: 2.4, y: 2.8, z: 0 },
      { element: 'O', x: 0, y: 4.2, z: 0 }
    ],
    properties: {
      molarMass: '180.16 g/mol',
      boilingPoint: '146°C (decomposes)',
      meltingPoint: '146°C',
      density: '1.54 g/cm³',
      uses: 'Energy source for cells, sweetener, fermentation'
    }
  },
  { 
    name: 'Sulfuric Acid', 
    formula: 'H₂SO₄', 
    atoms: [
      { element: 'S', x: 0, y: 0, z: 0 },
      { element: 'O', x: 1.2, y: 0, z: 0 },
      { element: 'O', x: -1.2, y: 0, z: 0 },
      { element: 'O', x: 0, y: 1.2, z: 0 },
      { element: 'O', x: 0, y: -1.2, z: 0 },
      { element: 'H', x: 1.8, y: 0.8, z: 0 },
      { element: 'H', x: -1.8, y: 0.8, z: 0 }
    ],
    properties: {
      molarMass: '98.08 g/mol',
      boilingPoint: '337°C',
      meltingPoint: '10.31°C',
      density: '1.84 g/cm³',
      uses: 'Industrial chemical, battery acid, fertilizer production'
    }
  },
  { 
    name: 'Benzene', 
    formula: 'C₆H₆', 
    atoms: [
      { element: 'C', x: 1, y: 0, z: 0 },
      { element: 'C', x: 0.5, y: 0.87, z: 0 },
      { element: 'C', x: -0.5, y: 0.87, z: 0 },
      { element: 'C', x: -1, y: 0, z: 0 },
      { element: 'C', x: -0.5, y: -0.87, z: 0 },
      { element: 'C', x: 0.5, y: -0.87, z: 0 },
      { element: 'H', x: 1.8, y: 0, z: 0 },
      { element: 'H', x: 0.9, y: 1.56, z: 0 },
      { element: 'H', x: -0.9, y: 1.56, z: 0 },
      { element: 'H', x: -1.8, y: 0, z: 0 },
      { element: 'H', x: -0.9, y: -1.56, z: 0 },
      { element: 'H', x: 0.9, y: -1.56, z: 0 }
    ],
    properties: {
      molarMass: '78.11 g/mol',
      boilingPoint: '80.1°C',
      meltingPoint: '5.5°C',
      density: '0.876 g/cm³',
      uses: 'Chemical synthesis, plastics, dyes, detergents'
    }
  }
];

const atomColors: Record<string, string> = {
  H: '#FFFFFF',
  C: '#909090',
  N: '#3050F8',
  O: '#FF0D0D',
  S: '#FFFF30',
  P: '#FF8000',
};

const atomRadii: Record<string, number> = {
  H: 0.3,
  C: 0.7,
  N: 0.65,
  O: 0.6,
  S: 1.0,
  P: 1.0,
};

export const MolecularViewer: React.FC = () => {
  const [selectedMolecule, setSelectedMolecule] = useState(molecules[0]);
  const [rotationX, setRotationX] = useState(20);
  const [rotationY, setRotationY] = useState(20);
  const [rotationZ, setRotationZ] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [autoRotate, setAutoRotate] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const animationRef = useRef<number>();

  useEffect(() => {
    if (autoRotate && !isDragging) {
      const animate = () => {
        setRotationY(prev => (prev + 1) % 360);
        setRotationX(prev => (prev + 0.5) % 360);
        setRotationZ(prev => (prev + 0.3) % 360);
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [autoRotate, isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
    if (autoRotate) setAutoRotate(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;

    // Rotate based on mouse movement
    // Hold Shift for Z-axis rotation
    if (e.shiftKey) {
      setRotationZ(prev => (prev + deltaX * 0.5) % 360);
    } else {
      setRotationY(prev => (prev + deltaX * 0.5) % 360);
      setRotationX(prev => (prev + deltaY * 0.5) % 360);
    }

    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Touch support for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setLastMousePos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      if (autoRotate) setAutoRotate(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;

    const deltaX = e.touches[0].clientX - lastMousePos.x;
    const deltaY = e.touches[0].clientY - lastMousePos.y;

    setRotationY(prev => (prev + deltaX * 0.5) % 360);
    setRotationX(prev => (prev + deltaY * 0.5) % 360);

    setLastMousePos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Mouse wheel for zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.5, Math.min(2, prev + delta)));
  };

  // Calculate bounding box of molecule
  const getBounds = (atoms: Atom[]) => {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    atoms.forEach(atom => {
      minX = Math.min(minX, atom.x);
      maxX = Math.max(maxX, atom.x);
      minY = Math.min(minY, atom.y);
      maxY = Math.max(maxY, atom.y);
      minZ = Math.min(minZ, atom.z);
      maxZ = Math.max(maxZ, atom.z);
    });

    return {
      width: maxX - minX,
      height: maxY - minY,
      depth: maxZ - minZ,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
      centerZ: (minZ + maxZ) / 2,
    };
  };

  const project3D = (x: number, y: number, z: number) => {
    const bounds = getBounds(selectedMolecule.atoms);
    
    // Center the molecule
    const cx = x - bounds.centerX;
    const cy = y - bounds.centerY;
    const cz = z - bounds.centerZ;

    const radX = (rotationX * Math.PI) / 180;
    const radY = (rotationY * Math.PI) / 180;
    const radZ = (rotationZ * Math.PI) / 180;

    // Rotate around Z axis
    let x1 = cx * Math.cos(radZ) - cy * Math.sin(radZ);
    let y1 = cx * Math.sin(radZ) + cy * Math.cos(radZ);
    let z1 = cz;

    // Rotate around Y axis
    let x2 = x1 * Math.cos(radY) - z1 * Math.sin(radY);
    let z2 = x1 * Math.sin(radY) + z1 * Math.cos(radY);
    let y2 = y1;
    
    // Rotate around X axis
    let y3 = y2 * Math.cos(radX) - z2 * Math.sin(radX);
    let z3 = y2 * Math.sin(radX) + z2 * Math.cos(radX);
    let x3 = x2;

    // Calculate adaptive scale based on molecule size
    const maxDim = Math.max(bounds.width, bounds.height, bounds.depth);
    const baseScale = maxDim > 0 ? 30 / maxDim : 30;
    const scale = baseScale * zoom;

    // Perspective projection with adjusted distance
    const perspective = 8;
    const projScale = perspective / (perspective + z3);

    return {
      x: 50 + x3 * scale * projScale,
      y: 50 + y3 * scale * projScale,
      z: z3,
      size: projScale
    };
  };

  // Sort atoms by z-depth for proper rendering
  const getSortedAtoms = () => {
    return selectedMolecule.atoms
      .map((atom, index) => ({ atom, index, z: project3D(atom.x, atom.y, atom.z).z }))
      .sort((a, b) => a.z - b.z);
  };

  return (
    <div className="h-full flex flex-col p-4 overflow-hidden">
      <h2 className="text-xl font-bold mb-3 dark:text-white">3D Molecular Viewer</h2>
      
      <div className="flex-1 grid md:grid-cols-3 gap-4 overflow-hidden">
        {/* Molecule List */}
        <div className="overflow-y-auto">
          <h3 className="font-semibold mb-2 dark:text-white text-sm">Select Molecule</h3>
          <div className="space-y-2">
            {molecules.map((mol) => (
              <button
                key={mol.formula}
                onClick={() => {
                  setSelectedMolecule(mol);
                  setZoom(1);
                  setRotationX(20);
                  setRotationY(20);
                  setRotationZ(0);
                }}
                className={`w-full text-left p-2 rounded-lg transition-colors text-sm ${
                  selectedMolecule.formula === mol.formula
                    ? 'bg-green-500 text-white'
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white'
                }`}
              >
                <div className="font-semibold">{mol.name}</div>
                <div className="text-xs opacity-80">{mol.formula}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Viewer */}
        <div className="md:col-span-2 flex flex-col overflow-hidden">
          <div className="flex gap-2 mb-2 flex-wrap items-center">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
                autoRotate ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-white hover:bg-gray-300'
              }`}
            >
              <RotateCw className="h-4 w-4" />
              Auto
            </button>
            <button
              onClick={() => {
                setRotationX(20);
                setRotationY(20);
                setRotationZ(0);
                setZoom(1);
              }}
              className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              title="Reset view"
            >
              Reset View
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoom(Math.min(zoom + 0.2, 2))}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-semibold bg-gray-200 dark:bg-gray-700 dark:text-white hover:bg-gray-300"
                title="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <span className="px-2 py-1 text-xs dark:text-gray-300 min-w-[3rem] text-center">{zoom.toFixed(1)}x</span>
              <button
                onClick={() => setZoom(Math.max(zoom - 0.2, 0.5))}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-semibold bg-gray-200 dark:bg-gray-700 dark:text-white hover:bg-gray-300"
                title="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
            <div>
              <label className="block mb-1 dark:text-gray-300">X: {rotationX}°</label>
              <input
                type="range"
                min="0"
                max="360"
                value={rotationX}
                onChange={(e) => setRotationX(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block mb-1 dark:text-gray-300">Y: {rotationY}°</label>
              <input
                type="range"
                min="0"
                max="360"
                value={rotationY}
                onChange={(e) => setRotationY(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block mb-1 dark:text-gray-300">Z: {rotationZ}°</label>
              <input
                type="range"
                min="0"
                max="360"
                value={rotationZ}
                onChange={(e) => setRotationZ(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <div 
            className={`flex-1 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-4 relative overflow-hidden min-h-0 select-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            <div className="absolute top-2 left-2 text-xs text-gray-400 dark:text-gray-500 pointer-events-none">
              {isDragging ? '🔄 Rotating...' : '👆 Drag to rotate • Hold Shift for Z-axis'}
            </div>
            <svg viewBox="0 0 100 100" className="w-full h-full pointer-events-none" preserveAspectRatio="xMidYMid meet">
              <defs>
                <radialGradient id="atomGradient">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
                </radialGradient>
              </defs>

              {/* Draw bonds first (behind atoms) */}
              {getSortedAtoms().map(({ atom, index: i }) => {
                const pos1 = project3D(atom.x, atom.y, atom.z);
                return selectedMolecule.atoms.slice(i + 1).map((otherAtom, j) => {
                  const pos2 = project3D(otherAtom.x, otherAtom.y, otherAtom.z);
                  const distance = Math.sqrt(
                    Math.pow(atom.x - otherAtom.x, 2) +
                    Math.pow(atom.y - otherAtom.y, 2) +
                    Math.pow(atom.z - otherAtom.z, 2)
                  );
                  if (distance < 1.8) {
                    const avgZ = (pos1.z + pos2.z) / 2;
                    const opacity = 0.4 + (avgZ + 5) / 15;
                    return (
                      <line
                        key={`${i}-${j}`}
                        x1={pos1.x}
                        y1={pos1.y}
                        x2={pos2.x}
                        y2={pos2.y}
                        stroke="#888"
                        strokeWidth={Math.min(pos1.size, pos2.size) * 1.5}
                        opacity={Math.max(0.3, Math.min(1, opacity))}
                      />
                    );
                  }
                  return null;
                });
              })}
              
              {/* Draw atoms sorted by depth */}
              {getSortedAtoms().map(({ atom, index: i }) => {
                const pos = project3D(atom.x, atom.y, atom.z);
                const baseRadius = atomRadii[atom.element] || 0.5;
                const radius = baseRadius * 5 * pos.size;
                const opacity = 0.7 + (pos.z + 5) / 20;
                
                return (
                  <g key={i}>
                    {/* Atom shadow for depth */}
                    <circle
                      cx={pos.x + 0.5}
                      cy={pos.y + 0.5}
                      r={radius}
                      fill="rgba(0,0,0,0.3)"
                      opacity={Math.max(0.3, Math.min(1, opacity))}
                    />
                    {/* Main atom */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={radius}
                      fill={atomColors[atom.element]}
                      stroke="#333"
                      strokeWidth={0.3 * pos.size}
                      opacity={Math.max(0.5, Math.min(1, opacity))}
                    />
                    {/* Highlight for 3D effect */}
                    <circle
                      cx={pos.x - radius * 0.3}
                      cy={pos.y - radius * 0.3}
                      r={radius * 0.4}
                      fill="url(#atomGradient)"
                      opacity={Math.max(0.3, Math.min(0.8, opacity))}
                    />
                    {/* Element label */}
                    <text
                      x={pos.x}
                      y={pos.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="font-bold select-none"
                      style={{ fontSize: `${radius * 0.7}px` }}
                      fill={atom.element === 'H' || atom.element === 'S' ? '#000' : '#FFF'}
                      opacity={Math.max(0.7, Math.min(1, opacity))}
                    >
                      {atom.element}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Properties */}
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg overflow-y-auto max-h-32">
            <h4 className="font-semibold mb-2 dark:text-white text-sm">{selectedMolecule.name} ({selectedMolecule.formula})</h4>
            <div className="grid grid-cols-2 gap-2 text-xs dark:text-gray-300">
              <div><span className="font-semibold">Molar Mass:</span> {selectedMolecule.properties.molarMass}</div>
              {selectedMolecule.properties.boilingPoint && (
                <div><span className="font-semibold">Boiling Point:</span> {selectedMolecule.properties.boilingPoint}</div>
              )}
              {selectedMolecule.properties.meltingPoint && (
                <div><span className="font-semibold">Melting Point:</span> {selectedMolecule.properties.meltingPoint}</div>
              )}
              {selectedMolecule.properties.density && (
                <div><span className="font-semibold">Density:</span> {selectedMolecule.properties.density}</div>
              )}
              <div className="col-span-2"><span className="font-semibold">Uses:</span> {selectedMolecule.properties.uses}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
