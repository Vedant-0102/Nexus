import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface Layer { name: string; minAlt: number; maxAlt: number; color: string; tempRange: [number, number]; features: string[]; }

export const AtmosphericLayers: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedLayer, setSelectedLayer] = useState<number>(0);
  const [showTemp, setShowTemp] = useState(true);
  const [showObjects, setShowObjects] = useState(true);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const [altitude, setAltitude] = useState<number>(0);

  const layers: Layer[] = [
    { name: 'Troposphere', minAlt: 0, maxAlt: 12, color: '#4090ff', tempRange: [15, -56], features: ['Weather', 'Clouds', 'Aircraft'] },
    { name: 'Stratosphere', minAlt: 12, maxAlt: 50, color: '#40a0e0', tempRange: [-56, -3], features: ['Ozone layer', 'Weather balloons'] },
    { name: 'Mesosphere', minAlt: 50, maxAlt: 80, color: '#2060a0', tempRange: [-3, -90], features: ['Meteors burn up', 'Noctilucent clouds'] },
    { name: 'Thermosphere', minAlt: 80, maxAlt: 700, color: '#102050', tempRange: [-90, 1500], features: ['Aurora', 'ISS orbit', 'Radio waves'] },
    { name: 'Exosphere', minAlt: 700, maxAlt: 10000, color: '#080820', tempRange: [1500, 2500], features: ['Satellites', 'Transition to space'] },
  ];

  const totalAltScale = 200; // Logarithmic-ish scale

  const altToY = (alt: number, h: number): number => {
    const margin = 30;
    const usableH = h - margin * 2;
    const logAlt = Math.log10(alt + 1) / Math.log10(10001);
    return h - margin - logAlt * usableH;
  };

  const getTemperature = (alt: number): number => {
    if (alt <= 12) return 15 - (alt / 12) * 71;
    if (alt <= 50) return -56 + ((alt - 12) / 38) * 53;
    if (alt <= 80) return -3 - ((alt - 50) / 30) * 87;
    if (alt <= 700) return -90 + ((alt - 80) / 620) * 1590;
    return 1500 + ((alt - 700) / 9300) * 1000;
  };

  const getPressure = (alt: number): number => {
    return 101.325 * Math.exp(-alt / 8.5);
  };

  const getDensity = (alt: number): number => {
    return 1.225 * Math.exp(-alt / 8.5);
  };

  const getLayerIndex = (alt: number): number => {
    if (alt < 12) return 0;
    if (alt < 50) return 1;
    if (alt < 80) return 2;
    if (alt < 700) return 3;
    return 4;
  };

  const getPhenomena = (alt: number): string[] => {
    if (alt < 2) return ['Ground weather', 'Fog', 'Low clouds'];
    if (alt < 12) return ['Cumulus clouds', 'Jet streams', 'Aircraft'];
    if (alt < 30) return ['Ozone layer', 'Weather balloons'];
    if (alt < 50) return ['Stratospheric research', 'Ozone peak'];
    if (alt < 65) return ['Noctilucent clouds'];
    if (alt < 85) return ['Meteors burn up', 'Noctilucent clouds'];
    if (alt < 150) return ['Aurora borealis', 'Ionosphere (D layer)'];
    if (alt < 300) return ['Ionosphere (E/F layers)', 'Radio reflection'];
    if (alt < 500) return ['ISS orbit (~408 km)', 'Low Earth orbit'];
    if (alt < 700) return ['LEO satellites', 'Hubble (~540 km)'];
    return ['GPS satellites', 'Transition to space'];
  };

  const getComposition = (alt: number): { n2: number; o2: number; other: string } => {
    if (alt < 100) return { n2: 78, o2: 21, other: 'Ar ~1%, CO\u2082 trace' };
    if (alt < 200) return { n2: 60, o2: 10, other: 'Atomic O ~30%' };
    if (alt < 500) return { n2: 20, o2: 2, other: 'Atomic O ~70%, He trace' };
    return { n2: 5, o2: 0, other: 'H ~50%, He ~45%' };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const d = window.devicePixelRatio || 1;
      canvas.width = r.width * d; canvas.height = r.height * d; ctx.scale(d, d);
    };
    resize();
    const obs = new ResizeObserver(resize); obs.observe(canvas);

    const draw = () => {
      const r = canvas.getBoundingClientRect();
      const w = r.width, h = r.height;
      timeRef.current += 0.016;
      const t = timeRef.current;
      ctx.clearRect(0, 0, w, h);

      // Background gradient (space to ground)
      const isDark = document.documentElement.classList.contains('dark');
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      if (isDark) {
        bgGrad.addColorStop(0, '#000010'); bgGrad.addColorStop(0.3, '#080830');
        bgGrad.addColorStop(0.7, '#1040a0'); bgGrad.addColorStop(1, '#80c0ff');
      } else {
        bgGrad.addColorStop(0, '#1a1a40'); bgGrad.addColorStop(0.3, '#304080');
        bgGrad.addColorStop(0.7, '#6090d0'); bgGrad.addColorStop(1, '#b8e0ff');
      }
      ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, w, h);

      // Stars at top
      for (let i = 0; i < 80; i++) {
        const sx = (Math.sin(i * 127.1) * 0.5 + 0.5) * w;
        const sy = (Math.cos(i * 311.7) * 0.5 + 0.5) * h * 0.3;
        ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.sin(t + i) * 0.15})`;
        ctx.fillRect(sx, sy, 1.2, 1.2);
      }

      // Draw layers
      const layerPadding = 40;
      layers.forEach((layer, i) => {
        const y1 = altToY(layer.maxAlt, h);
        const y2 = altToY(layer.minAlt, h);
        const isSelected = i === selectedLayer;

        // Layer band
        ctx.fillStyle = layer.color + (isSelected ? '40' : '15');
        ctx.fillRect(layerPadding, y1, w - layerPadding * 2, y2 - y1);

        // Boundary line
        ctx.strokeStyle = isSelected ? 'rgba(255,255,255,0.5)' : 'rgba(150,180,255,0.15)';
        ctx.lineWidth = isSelected ? 1.5 : 0.5;
        ctx.setLineDash(isSelected ? [] : [4, 4]);
        ctx.beginPath(); ctx.moveTo(layerPadding, y1); ctx.lineTo(w - layerPadding, y1); ctx.stroke();
        ctx.setLineDash([]);

        // Layer name
        const midY = (y1 + y2) / 2;
        ctx.fillStyle = isSelected ? 'rgba(255,255,255,0.9)' : 'rgba(200,200,255,0.4)';
        ctx.font = `${isSelected ? 'bold ' : ''}${isSelected ? 11 : 9}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(layer.name, layerPadding + 5, midY);

        // Altitude labels
        ctx.fillStyle = 'rgba(200,200,255,0.3)'; ctx.font = '8px sans-serif'; ctx.textAlign = 'right';
        ctx.fillText(`${layer.maxAlt} km`, layerPadding - 3, y1 + 4);
      });

      // Ground
      const groundY = altToY(0, h);
      ctx.fillStyle = '#2a5a20'; ctx.fillRect(0, groundY, w, h - groundY);
      ctx.fillStyle = '#3a7030'; ctx.fillRect(0, groundY, w, 3);

      // Altitude marker line
      const markerY = altToY(altitude, h);
      ctx.save();
      ctx.strokeStyle = 'rgba(255,220,50,0.7)';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 3]);
      ctx.beginPath();
      ctx.moveTo(layerPadding, markerY);
      ctx.lineTo(w - layerPadding, markerY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      ctx.fillStyle = 'rgba(255,220,50,0.9)';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${altitude} km`, w - layerPadding - 3, markerY - 4);

      // Objects in layers
      if (showObjects) {
        // Clouds in troposphere
        const cloudY = altToY(5, h);
        for (let i = 0; i < 4; i++) {
          const cx2 = ((i * 120 + t * 10) % (w + 60)) - 30;
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.beginPath(); ctx.arc(cx2, cloudY, 12, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(cx2 + 10, cloudY - 5, 8, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(cx2 - 8, cloudY + 2, 9, 0, Math.PI * 2); ctx.fill();
        }

        // Aircraft in troposphere
        const planeX = ((t * 30) % (w + 40)) - 20;
        const planeY = altToY(10, h);
        ctx.fillStyle = 'rgba(200,200,200,0.7)'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('✈', planeX, planeY);

        // Ozone in stratosphere
        const ozoneY = altToY(25, h);
        ctx.strokeStyle = 'rgba(100,200,255,0.3)'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(layerPadding + 20, ozoneY);
        for (let x = layerPadding + 20; x < w - layerPadding - 20; x += 5) {
          ctx.lineTo(x, ozoneY + Math.sin(x * 0.05 + t) * 3);
        }
        ctx.stroke();
        ctx.fillStyle = 'rgba(100,200,255,0.4)'; ctx.font = '8px sans-serif'; ctx.textAlign = 'right';
        ctx.fillText('O₃ Ozone Layer', w - layerPadding - 5, ozoneY - 8);

        // Meteor in mesosphere
        const meteorY = altToY(65, h);
        const meteorX = ((t * 50 + 100) % (w + 40)) - 20;
        ctx.strokeStyle = 'rgba(255,200,50,0.6)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(meteorX, meteorY); ctx.lineTo(meteorX + 15, meteorY + 10); ctx.stroke();
        ctx.fillStyle = 'rgba(255,200,50,0.8)';
        ctx.beginPath(); ctx.arc(meteorX, meteorY, 2, 0, Math.PI * 2); ctx.fill();

        // ISS in thermosphere
        const issY = altToY(400, h);
        const issX = ((t * 20 + 200) % (w + 40)) - 20;
        ctx.fillStyle = 'rgba(200,200,200,0.8)'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('🛰', issX, issY);

        // Aurora in thermosphere
        const auroraY = altToY(120, h);
        for (let x = layerPadding + 30; x < w - layerPadding - 30; x += 8) {
          const ah = Math.sin(x * 0.03 + t * 0.5) * 10 + 10;
          const alpha = (Math.sin(x * 0.05 + t) * 0.3 + 0.3);
          ctx.fillStyle = `rgba(50,255,100,${alpha * 0.3})`;
          ctx.fillRect(x, auroraY - ah, 5, ah);
          ctx.fillStyle = `rgba(100,100,255,${alpha * 0.2})`;
          ctx.fillRect(x, auroraY - ah - 5, 5, 5);
        }

        // Satellite in exosphere
        const satY = altToY(2000, h);
        const satX = ((t * 8 + 50) % (w + 40)) - 20;
        ctx.fillStyle = 'rgba(200,200,200,0.6)';
        ctx.fillRect(satX - 3, satY - 2, 6, 4);
        ctx.fillRect(satX - 8, satY - 1, 4, 2);
        ctx.fillRect(satX + 4, satY - 1, 4, 2);
      }

      // Temperature profile
      if (showTemp) {
        const tempToX = (temp: number) => layerPadding + 30 + (temp + 100) / 2600 * (w - layerPadding * 2 - 60);

        // Draw the zigzag temperature curve
        ctx.strokeStyle = 'rgba(255,100,100,0.6)'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        let first = true;
        for (let a = 0; a <= 10000; a += 50) {
          const temp = getTemperature(a);
          const x = tempToX(temp);
          const y = altToY(a, h);
          if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Layer boundary markers (tropopause, stratopause, mesopause)
        const boundaries = [
          { alt: 12, label: 'Tropopause' },
          { alt: 50, label: 'Stratopause' },
          { alt: 80, label: 'Mesopause' },
        ];
        boundaries.forEach(b => {
          const by = altToY(b.alt, h);
          const bTemp = getTemperature(b.alt);
          const bx = tempToX(bTemp);
          ctx.fillStyle = 'rgba(255,180,100,0.75)';
          ctx.beginPath(); ctx.arc(bx, by, 3, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(255,180,100,0.6)'; ctx.font = '7px sans-serif'; ctx.textAlign = 'left';
          ctx.fillText(`${b.label} (${b.alt}km)`, bx + 6, by + 3);
        });

        // Current altitude dot on the temperature curve
        const curTemp = getTemperature(altitude);
        const curX = tempToX(curTemp);
        const curY = altToY(altitude, h);
        ctx.fillStyle = 'rgba(255,255,50,0.9)';
        ctx.beginPath(); ctx.arc(curX, curY, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,50,0.5)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(curX, curY, 7, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,50,0.85)'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(`${curTemp.toFixed(0)}\u00B0C`, curX + 10, curY + 3);

        ctx.fillStyle = 'rgba(255,100,100,0.4)'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Temperature \u2192', w / 2, h - 5);
      }

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animRef.current); obs.disconnect(); };
  }, [selectedLayer, showTemp, showObjects, altitude]);

  const sel = layers[selectedLayer];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-100 to-cyan-100 dark:from-gray-950 dark:to-cyan-950 p-3 overflow-hidden">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">🌤 Atmospheric Layers Explorer</h2>
        <p className="text-[11px] text-gray-500 dark:text-gray-400">Earth's atmosphere structure</p>
      </div>
      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 min-w-0 min-h-0 rounded-lg border border-gray-300 dark:border-gray-800 overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
        <div className="w-[210px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-1">
            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Layers</h4>
            {layers.map((l, i) => (
              <button key={l.name} onClick={() => { setSelectedLayer(i); setAltitude(Math.min(Math.round((l.minAlt + l.maxAlt) / 2), 700)); }} className={`flex items-center gap-2 w-full text-left px-2 py-1.5 rounded text-[10px] ${selectedLayer===i?'bg-cyan-700 text-white':'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                <span className="w-2 h-2 rounded-full" style={{background:l.color}}/>{l.name}
                <span className="ml-auto text-[8px] opacity-60">{l.minAlt}-{l.maxAlt}km</span>
              </button>
            ))}
          </div>
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-1.5">
            <label className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 cursor-pointer">
              <input type="checkbox" checked={showTemp} onChange={e=>setShowTemp(e.target.checked)} className="accent-red-500 w-3 h-3"/>Temperature profile
            </label>
            <label className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 cursor-pointer">
              <input type="checkbox" checked={showObjects} onChange={e=>setShowObjects(e.target.checked)} className="accent-cyan-500 w-3 h-3"/>Show objects
            </label>
          </div>
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-1.5">
            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Altitude Explorer</h4>
            <input type="range" min={0} max={700} step={1} value={altitude} onChange={e => { const a = Number(e.target.value); setAltitude(a); setSelectedLayer(getLayerIndex(a)); }} className="w-full accent-yellow-500 h-1.5" />
            <div className="text-[10px] text-gray-600 dark:text-gray-400 flex justify-between">
              <span>0 km</span><span className="font-bold text-yellow-600 dark:text-yellow-400">{altitude} km</span><span>700 km</span>
            </div>
          </div>
          <div className="bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/40 rounded-lg p-2.5">
            <h4 className="text-[10px] font-bold text-cyan-700 dark:text-cyan-300 mb-1">{sel.name}</h4>
            <div className="text-[9px] text-gray-600 dark:text-gray-400 space-y-0.5">
              <p>Altitude: {altitude} km ({sel.minAlt}&ndash;{sel.maxAlt} km range)</p>
              <p>Temperature: {getTemperature(altitude).toFixed(1)}&deg;C</p>
              <p>Pressure: {getPressure(altitude) >= 0.01 ? getPressure(altitude).toFixed(2) : getPressure(altitude).toExponential(2)} kPa</p>
              <p>Density: {getDensity(altitude) >= 0.001 ? getDensity(altitude).toFixed(4) : getDensity(altitude).toExponential(2)} kg/m&sup3;</p>
              <p className="mt-1 font-semibold text-gray-600 dark:text-gray-300">Composition:</p>
              <p>N&#8322;: {getComposition(altitude).n2}% &middot; O&#8322;: {getComposition(altitude).o2}%</p>
              <p>{getComposition(altitude).other}</p>
              <p className="mt-1 font-semibold text-gray-600 dark:text-gray-300">Phenomena:</p>
              {getPhenomena(altitude).map(f => <p key={f}>&bull; {f}</p>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
