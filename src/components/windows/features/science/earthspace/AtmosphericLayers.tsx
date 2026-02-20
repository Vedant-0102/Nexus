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
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#000010'); bgGrad.addColorStop(0.3, '#080830');
      bgGrad.addColorStop(0.7, '#1040a0'); bgGrad.addColorStop(1, '#80c0ff');
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
        ctx.strokeStyle = 'rgba(255,100,100,0.6)'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        let first = true;
        for (let alt = 0; alt <= 10000; alt += 50) {
          let temp = 15;
          if (alt <= 12) temp = 15 - (alt / 12) * 71;
          else if (alt <= 50) temp = -56 + ((alt - 12) / 38) * 53;
          else if (alt <= 80) temp = -3 - ((alt - 50) / 30) * 87;
          else if (alt <= 700) temp = -90 + ((alt - 80) / 620) * 1590;
          else temp = 1500 + ((alt - 700) / 9300) * 1000;

          const x = layerPadding + 30 + (temp + 100) / 2600 * (w - layerPadding * 2 - 60);
          const y = altToY(alt, h);
          if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,100,100,0.4)'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Temperature →', w / 2, h - 5);
      }

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animRef.current); obs.disconnect(); };
  }, [selectedLayer, showTemp, showObjects]);

  const sel = layers[selectedLayer];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-950 to-cyan-950 p-3 overflow-hidden">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-white">🌤 Atmospheric Layers Explorer</h2>
        <p className="text-[11px] text-gray-400">Earth's atmosphere structure</p>
      </div>
      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 min-w-0 min-h-0 rounded-lg border border-gray-800 overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
        <div className="w-[210px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-1">
            <h4 className="text-[11px] font-semibold text-gray-400 uppercase mb-1">Layers</h4>
            {layers.map((l, i) => (
              <button key={l.name} onClick={() => setSelectedLayer(i)} className={`flex items-center gap-2 w-full text-left px-2 py-1.5 rounded text-[10px] ${selectedLayer===i?'bg-cyan-700 text-white':'bg-gray-800 text-gray-400'}`}>
                <span className="w-2 h-2 rounded-full" style={{background:l.color}}/>{l.name}
                <span className="ml-auto text-[8px] opacity-60">{l.minAlt}-{l.maxAlt}km</span>
              </button>
            ))}
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-1.5">
            <label className="flex items-center gap-2 text-[10px] text-gray-400 cursor-pointer">
              <input type="checkbox" checked={showTemp} onChange={e=>setShowTemp(e.target.checked)} className="accent-red-500 w-3 h-3"/>Temperature profile
            </label>
            <label className="flex items-center gap-2 text-[10px] text-gray-400 cursor-pointer">
              <input type="checkbox" checked={showObjects} onChange={e=>setShowObjects(e.target.checked)} className="accent-cyan-500 w-3 h-3"/>Show objects
            </label>
          </div>
          <div className="bg-cyan-950/30 border border-cyan-800/40 rounded-lg p-2.5">
            <h4 className="text-[10px] font-bold text-cyan-300 mb-1">{sel.name}</h4>
            <div className="text-[9px] text-gray-400 space-y-0.5">
              <p>Altitude: {sel.minAlt} – {sel.maxAlt} km</p>
              <p>Temperature: {sel.tempRange[0]}°C to {sel.tempRange[1]}°C</p>
              <p className="mt-1 font-semibold text-gray-300">Features:</p>
              {sel.features.map(f => <p key={f}>• {f}</p>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
