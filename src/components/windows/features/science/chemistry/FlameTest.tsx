import React, { useState, useEffect, useRef } from 'react';
import { Flame, Info, RotateCcw } from 'lucide-react';

interface ElementData {
  name: string;
  symbol: string;
  atomicNumber: number;
  flameColor: string;
  electronConfig: string;
  wavelength: string;
  explanation: string;
  compound: string;
}

const elements: ElementData[] = [
  {
    name: 'Lithium',
    symbol: 'Li',
    atomicNumber: 3,
    flameColor: '#DC143C',
    electronConfig: '1s\u00B2 2s\u00B9',
    wavelength: '670.8 nm (red)',
    explanation:
      'The single 2s electron is excited to higher orbitals (2p, 3s, etc.). When it falls back to its ground state, it emits photons at 670.8 nm, producing a characteristic crimson red color.',
    compound: 'LiCl (Lithium chloride)',
  },
  {
    name: 'Sodium',
    symbol: 'Na',
    atomicNumber: 11,
    flameColor: '#FFD700',
    electronConfig: '[Ne] 3s\u00B9',
    wavelength: '589.0 / 589.6 nm (yellow)',
    explanation:
      'The 3s valence electron is excited to the 3p orbital. The transition 3p \u2192 3s emits the famous sodium D-lines at 589.0 and 589.6 nm, producing an intense persistent yellow flame.',
    compound: 'NaCl (Sodium chloride)',
  },
  {
    name: 'Potassium',
    symbol: 'K',
    atomicNumber: 19,
    flameColor: '#9370DB',
    electronConfig: '[Ar] 4s\u00B9',
    wavelength: '766.5 / 404.4 nm (violet)',
    explanation:
      'The 4s electron transitions to 4p and higher orbitals. The de-excitation emits at 766.5 nm (near-IR) and 404.4 nm (violet). The visible component appears as a delicate lilac/violet colour.',
    compound: 'KCl (Potassium chloride)',
  },
  {
    name: 'Calcium',
    symbol: 'Ca',
    atomicNumber: 20,
    flameColor: '#FF4500',
    electronConfig: '[Ar] 4s\u00B2',
    wavelength: '622.0 nm (orange-red)',
    explanation:
      'Calcium\u2019s two 4s electrons undergo multiple excitations. The dominant emission near 622 nm gives an orange-red flame. Molecular CaOH bands also contribute to the colour.',
    compound: 'CaCl\u2082 (Calcium chloride)',
  },
  {
    name: 'Strontium',
    symbol: 'Sr',
    atomicNumber: 38,
    flameColor: '#FF0000',
    electronConfig: '[Kr] 5s\u00B2',
    wavelength: '460.7 / 707.0 nm (red)',
    explanation:
      'Strontium atoms and SrOH molecules emit across several bands dominated by red wavelengths around 707 nm. The combined emission produces an intense scarlet-red flame used in fireworks.',
    compound: 'SrCl\u2082 (Strontium chloride)',
  },
  {
    name: 'Barium',
    symbol: 'Ba',
    atomicNumber: 56,
    flameColor: '#32CD32',
    electronConfig: '[Xe] 6s\u00B2',
    wavelength: '524.2 / 553.6 nm (green)',
    explanation:
      'Barium and BaCl molecular bands emit strongly in the 524\u2013554 nm range. These wavelengths fall in the green portion of the visible spectrum, producing a characteristic apple-green flame.',
    compound: 'BaCl\u2082 (Barium chloride)',
  },
  {
    name: 'Copper',
    symbol: 'Cu',
    atomicNumber: 29,
    flameColor: '#00CED1',
    electronConfig: '[Ar] 3d\u00B9\u2070 4s\u00B9',
    wavelength: '510\u2013515 nm (blue-green)',
    explanation:
      'Copper halides (CuCl) produce intense molecular emission bands between 510\u2013515 nm. The result is a vivid blue-green (turquoise) flame, especially bright when halides are present.',
    compound: 'CuCl\u2082 (Copper(II) chloride)',
  },
  {
    name: 'Boron',
    symbol: 'B',
    atomicNumber: 5,
    flameColor: '#00FF00',
    electronConfig: '1s\u00B2 2s\u00B2 2p\u00B9',
    wavelength: '518 / 548 nm (green)',
    explanation:
      'Boron compounds (especially boric acid and borax) produce bright green emission from BO\u2082 molecular bands centred near 518 and 548 nm when heated in a flame.',
    compound: 'H\u2083BO\u2083 (Boric acid)',
  },
  {
    name: 'Cesium',
    symbol: 'Cs',
    atomicNumber: 55,
    flameColor: '#4169E1',
    electronConfig: '[Xe] 6s\u00B9',
    wavelength: '455.5 nm (blue)',
    explanation:
      'The 6s valence electron is excited to 6p and higher levels. The dominant 6p \u2192 6s transition emits at 455.5 nm, placing it in the blue region of the visible spectrum.',
    compound: 'CsCl (Cesium chloride)',
  },
  {
    name: 'Rubidium',
    symbol: 'Rb',
    atomicNumber: 37,
    flameColor: '#C71585',
    electronConfig: '[Xe] 5s\u00B9',
    wavelength: '780.0 / 421.5 nm (red-violet)',
    explanation:
      'Rubidium emits at 780 nm (near-IR, barely visible red) and at 421.5 nm (violet). The combination of the faint red glow and violet line produces a distinctive red-violet appearance.',
    compound: 'RbCl (Rubidium chloride)',
  },
];

const DEFAULT_FLAME_COLOR = '#1E90FF';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

export const FlameTest: React.FC = () => {
  const [selectedElement, setSelectedElement] = useState<ElementData | null>(null);
  const [flameColor, setFlameColor] = useState(DEFAULT_FLAME_COLOR);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const flameColorRef = useRef(DEFAULT_FLAME_COLOR);
  const targetColorRef = useRef(DEFAULT_FLAME_COLOR);
  const transitionRef = useRef(0);

  // Hex to RGB helper (handles both '#RRGGBB' and 'rgb(r,g,b)' formats)
  const hexToRgb = (color: string) => {
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return { r: isNaN(r) ? 0 : r, g: isNaN(g) ? 0 : g, b: isNaN(b) ? 0 : b };
    }
    const m = color.match(/\d+/g);
    if (m && m.length >= 3) {
      return { r: +m[0], g: +m[1], b: +m[2] };
    }
    return { r: 30, g: 144, b: 255 }; // fallback: dodger blue
  };

  // RGB to hex helper
  const rgbToHex = (r: number, g: number, b: number): string => {
    const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  // Interpolate between two colors (always returns hex)
  const lerpColor = (c1: string, c2: string, t: number): string => {
    const a = hexToRgb(c1);
    const b = hexToRgb(c2);
    const r = Math.round(a.r + (b.r - a.r) * t);
    const g = Math.round(a.g + (b.g - a.g) * t);
    const bl = Math.round(a.b + (b.b - a.b) * t);
    return rgbToHex(r, g, bl);
  };

  const selectElement = (el: ElementData) => {
    setSelectedElement(el);
    targetColorRef.current = el.flameColor;
    transitionRef.current = 0;
    setIsTransitioning(true);
    setFlameColor(el.flameColor);
  };

  const clearSelection = () => {
    setSelectedElement(null);
    targetColorRef.current = DEFAULT_FLAME_COLOR;
    transitionRef.current = 0;
    setIsTransitioning(true);
    setFlameColor(DEFAULT_FLAME_COLOR);
  };

  // Flame canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    const resObs = new ResizeObserver(resize);
    resObs.observe(canvas);

    const spawnParticle = (cx: number, baseY: number): Particle => {
      const spread = 18 + Math.random() * 14;
      return {
        x: cx + (Math.random() - 0.5) * spread,
        y: baseY,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -(1.5 + Math.random() * 2.5),
        life: 0,
        maxLife: 30 + Math.random() * 40,
        size: 3 + Math.random() * 6,
      };
    };

    let prevColor = flameColorRef.current;

    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      // Color transition
      if (transitionRef.current < 1) {
        transitionRef.current = Math.min(transitionRef.current + 0.025, 1);
        flameColorRef.current = lerpColor(prevColor, targetColorRef.current, transitionRef.current);
        if (transitionRef.current >= 1) {
          prevColor = targetColorRef.current;
          flameColorRef.current = targetColorRef.current;
        }
      }

      const currentColor = flameColorRef.current;
      const rgb = hexToRgb(currentColor);

      ctx.clearRect(0, 0, w, h);

      // Burner position
      const burnerCenterX = w / 2;
      const burnerTop = h * 0.58;

      // Draw burner body (SVG-like shapes rendered on canvas)
      // Base
      ctx.fillStyle = '#4a4a4a';
      ctx.beginPath();
      ctx.roundRect(burnerCenterX - 40, h * 0.92, 80, 12, 4);
      ctx.fill();

      // Stand
      ctx.fillStyle = '#5a5a5a';
      ctx.fillRect(burnerCenterX - 6, burnerTop + 8, 12, h * 0.92 - burnerTop - 8);

      // Barrel
      const barrelGrad = ctx.createLinearGradient(burnerCenterX - 14, 0, burnerCenterX + 14, 0);
      barrelGrad.addColorStop(0, '#6b6b6b');
      barrelGrad.addColorStop(0.3, '#8a8a8a');
      barrelGrad.addColorStop(0.5, '#999');
      barrelGrad.addColorStop(0.7, '#8a8a8a');
      barrelGrad.addColorStop(1, '#6b6b6b');
      ctx.fillStyle = barrelGrad;
      ctx.beginPath();
      ctx.roundRect(burnerCenterX - 14, burnerTop - 30, 28, 42, [4, 4, 0, 0]);
      ctx.fill();

      // Barrel rim
      ctx.fillStyle = '#777';
      ctx.beginPath();
      ctx.ellipse(burnerCenterX, burnerTop - 30, 16, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Air hole
      ctx.fillStyle = '#444';
      ctx.beginPath();
      ctx.ellipse(burnerCenterX, burnerTop - 5, 5, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Gas inlet tube
      ctx.fillStyle = '#6b6b6b';
      ctx.beginPath();
      ctx.roundRect(burnerCenterX + 10, burnerTop + 2, 30, 8, 3);
      ctx.fill();

      // Wire loop (nichrome wire)
      const wireBaseX = burnerCenterX - 55;
      const wireBaseY = burnerTop + 20;
      ctx.strokeStyle = '#b0b0b0';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(wireBaseX - 20, wireBaseY + 60);
      ctx.lineTo(wireBaseX, wireBaseY + 10);
      ctx.lineTo(burnerCenterX - 8, burnerTop - 50);
      ctx.stroke();

      // Wire loop circle at top
      ctx.strokeStyle = '#c0c0c0';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(burnerCenterX - 2, burnerTop - 56, 7, 0, Math.PI * 2);
      ctx.stroke();

      // If element selected, draw compound on wire loop
      if (selectedElement) {
        ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.6)`;
        ctx.beginPath();
        ctx.arc(burnerCenterX - 2, burnerTop - 56, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Wire label
      ctx.fillStyle = '#999';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Nichrome wire', wireBaseX - 30, wireBaseY + 72);

      // Spawn new particles
      for (let i = 0; i < 4; i++) {
        particlesRef.current.push(spawnParticle(burnerCenterX, burnerTop - 32));
      }

      // Update and draw particles (flame)
      const aliveParticles: Particle[] = [];
      for (const p of particlesRef.current) {
        p.life++;
        if (p.life > p.maxLife) continue;

        p.x += p.vx + Math.sin(p.life * 0.15) * 0.4;
        p.y += p.vy;
        p.vy *= 0.985;
        p.vx *= 0.99;

        const lifeRatio = p.life / p.maxLife;
        const alpha = lifeRatio < 0.1 ? lifeRatio * 10 : lifeRatio < 0.6 ? 1 : 1 - (lifeRatio - 0.6) / 0.4;
        const size = p.size * (1 - lifeRatio * 0.5);

        // Inner glow (brighter core)
        const innerAlpha = alpha * (lifeRatio < 0.3 ? 0.9 : 0.5);
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size);
        gradient.addColorStop(0, `rgba(255,255,255,${innerAlpha * 0.7})`);
        gradient.addColorStop(0.3, `rgba(${Math.min(rgb.r + 60, 255)},${Math.min(rgb.g + 60, 255)},${Math.min(rgb.b + 60, 255)},${alpha * 0.8})`);
        gradient.addColorStop(0.7, `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha * 0.5})`);
        gradient.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();

        aliveParticles.push(p);
      }
      particlesRef.current = aliveParticles;

      // Outer glow around flame
      const glowGrad = ctx.createRadialGradient(
        burnerCenterX,
        burnerTop - 65,
        5,
        burnerCenterX,
        burnerTop - 55,
        70
      );
      glowGrad.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},0.15)`);
      glowGrad.addColorStop(0.5, `rgba(${rgb.r},${rgb.g},${rgb.b},0.05)`);
      glowGrad.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(burnerCenterX, burnerTop - 55, 70, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.fillStyle = '#aaa';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Bunsen Burner', burnerCenterX, h * 0.97);
    };

    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      resObs.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedElement]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 p-3 overflow-hidden">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Flame Test Experiment
          </h2>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Identify metal ions by their characteristic flame colours
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearSelection}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all text-xs font-medium"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex gap-2 mb-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
          <Flame className="h-4 w-4 flex-shrink-0" style={{ color: flameColor }} />
          <div>
            <div className="text-[9px] text-gray-400 uppercase">Flame Colour</div>
            <div className="text-sm font-bold font-mono text-gray-800 dark:text-white">
              {selectedElement ? selectedElement.name : 'Default (Blue)'}
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
          <div
            className="h-4 w-4 rounded-full flex-shrink-0 border border-gray-300 dark:border-gray-600"
            style={{ backgroundColor: flameColor }}
          />
          <div>
            <div className="text-[9px] text-gray-400 uppercase">Wavelength</div>
            <div className="text-sm font-bold font-mono text-gray-800 dark:text-white">
              {selectedElement ? selectedElement.wavelength : 'N/A'}
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
          <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <div>
            <div className="text-[9px] text-gray-400 uppercase">Compound</div>
            <div className="text-sm font-bold font-mono text-gray-800 dark:text-white">
              {selectedElement ? selectedElement.compound : 'None'}
            </div>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex gap-3 min-h-0">
        {/* Column 1 - Element selector */}
        <div className="w-[200px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2.5">
            <h4 className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
              Select Element
            </h4>
            <div className="space-y-1.5">
              {elements.map((el) => (
                <button
                  key={el.symbol}
                  onClick={() => selectElement(el)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg transition-all flex items-center gap-2.5 group ${
                    selectedElement?.symbol === el.symbol
                      ? 'bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 shadow-sm'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0"
                    style={{ backgroundColor: el.flameColor }}
                  >
                    {el.symbol}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-gray-800 dark:text-gray-200 truncate">
                      {el.name}
                    </div>
                    <div className="text-[9px] text-gray-400 dark:text-gray-500 font-mono">
                      Z = {el.atomicNumber}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Column 2 - Flame visualization (canvas) */}
        <div className="flex-1 flex flex-col gap-2.5 min-w-0 min-h-0">
          <div
            className="bg-gray-950 rounded-lg shadow-md p-3 flex flex-col flex-1"
            style={{ minHeight: 0 }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-orange-400" />
                Bunsen Burner &mdash; Flame Test
              </span>
              <span className="text-[9px] text-gray-500">
                {selectedElement
                  ? `Testing: ${selectedElement.compound}`
                  : 'Place an element on the wire loop'}
              </span>
            </div>
            <div className="flex-1 min-h-0 relative">
              <canvas
                ref={canvasRef}
                className="w-full h-full rounded"
                style={{ background: 'radial-gradient(ellipse at 50% 40%, #1a1a2e 0%, #0a0a0f 100%)' }}
              />
              {/* Spectral colour band at the bottom of the canvas area */}
              {selectedElement && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-4 py-1.5">
                  <div
                    className="w-3 h-3 rounded-full animate-pulse"
                    style={{ backgroundColor: selectedElement.flameColor, boxShadow: `0 0 8px ${selectedElement.flameColor}` }}
                  />
                  <span className="text-[10px] text-gray-300 font-medium">
                    {selectedElement.symbol} &mdash; {selectedElement.wavelength}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Electron transition diagram */}
          {selectedElement && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3" style={{ flex: '0 0 auto' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-gray-800 dark:text-white">
                  Electron Transition Diagram
                </span>
              </div>
              <div className="flex items-center justify-center gap-3">
                {/* Ground state */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-1.5 bg-blue-500 rounded-full" />
                  <span className="text-[9px] text-gray-500 dark:text-gray-400 mt-1">Ground State</span>
                  <span className="text-[8px] text-gray-400 font-mono">n = low</span>
                </div>

                {/* Absorption arrow (up) */}
                <div className="flex flex-col items-center gap-0.5">
                  <svg width="30" height="50" viewBox="0 0 30 50">
                    <defs>
                      <marker id="arrowUp" markerWidth="6" markerHeight="4" refX="3" refY="2" orient="auto">
                        <polygon points="0,4 3,0 6,4" fill="#ef4444" />
                      </marker>
                      <marker id="arrowDown" markerWidth="6" markerHeight="4" refX="3" refY="2" orient="auto">
                        <polygon points="0,0 3,4 6,0" fill={selectedElement.flameColor} />
                      </marker>
                    </defs>
                    <line x1="10" y1="45" x2="10" y2="8" stroke="#ef4444" strokeWidth="2" markerEnd="url(#arrowUp)" />
                    <line x1="20" y1="5" x2="20" y2="42" stroke={selectedElement.flameColor} strokeWidth="2" markerEnd="url(#arrowDown)" />
                  </svg>
                  <div className="flex gap-3 text-[8px]">
                    <span className="text-red-500">Absorb</span>
                    <span style={{ color: selectedElement.flameColor }}>Emit</span>
                  </div>
                </div>

                {/* Excited state */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-1.5 bg-red-500 rounded-full" />
                  <span className="text-[9px] text-gray-500 dark:text-gray-400 mt-1">Excited State</span>
                  <span className="text-[8px] text-gray-400 font-mono">n = high</span>
                </div>

                {/* Photon */}
                <div className="flex flex-col items-center ml-3 pl-3 border-l border-gray-200 dark:border-gray-700">
                  <div
                    className="w-6 h-6 rounded-full animate-pulse"
                    style={{
                      backgroundColor: selectedElement.flameColor,
                      boxShadow: `0 0 12px ${selectedElement.flameColor}, 0 0 20px ${selectedElement.flameColor}40`,
                    }}
                  />
                  <span className="text-[9px] text-gray-500 dark:text-gray-400 mt-1">Photon</span>
                  <span className="text-[8px] font-mono" style={{ color: selectedElement.flameColor }}>
                    {selectedElement.wavelength.split(' ')[0]}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Column 3 - Info panel */}
        <div className="w-[220px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          {/* Selected element info */}
          {selectedElement ? (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2.5">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md"
                    style={{ backgroundColor: selectedElement.flameColor }}
                  >
                    {selectedElement.symbol}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-800 dark:text-white">
                      {selectedElement.name}
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                      Atomic Number: {selectedElement.atomicNumber}
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md px-2 py-1.5">
                    <div className="text-[9px] text-gray-400 uppercase">Electron Configuration</div>
                    <div className="text-xs font-mono font-semibold text-gray-700 dark:text-gray-200">
                      {selectedElement.electronConfig}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md px-2 py-1.5">
                    <div className="text-[9px] text-gray-400 uppercase">Emission Wavelength</div>
                    <div className="text-xs font-mono font-semibold text-gray-700 dark:text-gray-200">
                      {selectedElement.wavelength}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md px-2 py-1.5">
                    <div className="text-[9px] text-gray-400 uppercase">Compound Used</div>
                    <div className="text-xs font-mono font-semibold text-gray-700 dark:text-gray-200">
                      {selectedElement.compound}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md px-2 py-1.5">
                    <div className="text-[9px] text-gray-400 uppercase">Flame Colour Hex</div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600"
                        style={{ backgroundColor: selectedElement.flameColor }}
                      />
                      <span className="text-xs font-mono font-semibold text-gray-700 dark:text-gray-200">
                        {selectedElement.flameColor}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Why this colour? */}
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-2.5">
                <h4 className="text-[10px] font-semibold text-orange-800 dark:text-orange-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Info className="h-3 w-3" /> Why This Colour?
                </h4>
                <p className="text-[10px] text-gray-600 dark:text-gray-300 leading-relaxed">
                  {selectedElement.explanation}
                </p>
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 flex flex-col items-center justify-center text-center">
              <Flame className="h-8 w-8 text-blue-400 mb-2" />
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
                No Element Selected
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">
                Click on an element from the list to place its chloride salt on the nichrome wire loop
                and observe its characteristic flame colour.
              </p>
            </div>
          )}

          {/* Key concepts */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Info className="h-3 w-3" /> Key Concepts
            </h4>
            <div className="space-y-1.5">
              <div className="flex items-start gap-1.5 text-[9px] text-gray-600 dark:text-gray-300">
                <div className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
                <span>
                  Flame energy excites outer electrons to higher energy levels
                </span>
              </div>
              <div className="flex items-start gap-1.5 text-[9px] text-gray-600 dark:text-gray-300">
                <div className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
                <span>
                  Electrons fall back down and release photons of specific wavelengths
                </span>
              </div>
              <div className="flex items-start gap-1.5 text-[9px] text-gray-600 dark:text-gray-300">
                <div className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
                <span>
                  Each element has unique energy gaps, giving a unique emission spectrum
                </span>
              </div>
              <div className="flex items-start gap-1.5 text-[9px] text-gray-600 dark:text-gray-300">
                <div className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
                <span>
                  Nichrome wire is used because it does not impart its own colour to the flame
                </span>
              </div>
              <div className="flex items-start gap-1.5 text-[9px] text-gray-600 dark:text-gray-300">
                <div className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
                <span>
                  Wire is dipped in HCl and heated to clean it before each test
                </span>
              </div>
            </div>
          </div>

          {/* Procedure */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2.5">
            <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Procedure
            </h4>
            <div className="space-y-1.5 text-[9px] text-gray-500 dark:text-gray-400">
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-gray-600 dark:text-gray-300 flex-shrink-0">1.</span>
                <span>Clean the nichrome wire by dipping in conc. HCl and heating until no colour is seen</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-gray-600 dark:text-gray-300 flex-shrink-0">2.</span>
                <span>Dip the clean wire into the sample (metal chloride solution or solid)</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-gray-600 dark:text-gray-300 flex-shrink-0">3.</span>
                <span>Hold the wire in the non-luminous (blue) Bunsen burner flame</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-gray-600 dark:text-gray-300 flex-shrink-0">4.</span>
                <span>Observe the characteristic flame colour produced</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-gray-600 dark:text-gray-300 flex-shrink-0">5.</span>
                <span>Identify the metal ion from its flame colour</span>
              </div>
            </div>
          </div>

          {/* Visible spectrum reference */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2.5">
            <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Visible Spectrum
            </h4>
            <div
              className="h-4 rounded-full mb-1"
              style={{
                background:
                  'linear-gradient(to right, #8b00ff, #4169E1, #00bfff, #00ff00, #ffff00, #ff8c00, #ff0000)',
              }}
            />
            <div className="flex justify-between text-[8px] text-gray-400">
              <span>380 nm</span>
              <span>Violet</span>
              <span>Blue</span>
              <span>Green</span>
              <span>Yellow</span>
              <span>Red</span>
              <span>700 nm</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
