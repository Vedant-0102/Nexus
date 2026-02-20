import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

type Allele = string;
interface CrossResult { genotype: string; phenotype: string; probability: number; }

export const PunnettSquare: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [parent1, setParent1] = useState('Bb');
  const [parent2, setParent2] = useState('Bb');
  const [trait, setTrait] = useState<'eye'|'hair'|'seed'|'custom'>('eye');
  const [domLabel, setDomLabel] = useState('Brown eyes');
  const [recLabel, setRecLabel] = useState('Blue eyes');
  const [domAllele, setDomAllele] = useState('B');
  const [recAllele, setRecAllele] = useState('b');

  const traits: Record<string, {dom:string; rec:string; dA:string; rA:string; domColor:string; recColor:string}> = {
    eye: { dom:'Brown eyes', rec:'Blue eyes', dA:'B', rA:'b', domColor:'#8B4513', recColor:'#4169E1' },
    hair: { dom:'Dark hair', rec:'Light hair', dA:'D', rA:'d', domColor:'#2d1b00', recColor:'#f0c060' },
    seed: { dom:'Round seed', rec:'Wrinkled seed', dA:'R', rA:'r', domColor:'#4ade80', recColor:'#d4a060' },
    custom: { dom: domLabel, rec: recLabel, dA: domAllele, rA: recAllele, domColor:'#a78bfa', recColor:'#f472b6' },
  };

  const t = traits[trait];

  const getGametes = (genotype: string): [string, string] => {
    return [genotype[0], genotype[1]];
  };

  const getCrossResults = (): CrossResult[][] => {
    const g1 = getGametes(parent1);
    const g2 = getGametes(parent2);
    const grid: CrossResult[][] = [];
    for (let i = 0; i < 2; i++) {
      const row: CrossResult[] = [];
      for (let j = 0; j < 2; j++) {
        const a = g1[j], b = g2[i];
        const sorted = a.toUpperCase() === a ? a + b : b + a;
        const genotype = sorted;
        const isDom = genotype[0].toUpperCase() === genotype[0];
        const phenotype = isDom ? t.dom : t.rec;
        row.push({ genotype, phenotype, probability: 0.25 });
      }
      grid.push(row);
    }
    return grid;
  };

  const grid = getCrossResults();
  const allResults = grid.flat();
  const genotypeCount: Record<string, number> = {};
  allResults.forEach(r => { genotypeCount[r.genotype] = (genotypeCount[r.genotype] || 0) + 1; });
  const phenotypeCount: Record<string, number> = {};
  allResults.forEach(r => { phenotypeCount[r.phenotype] = (phenotypeCount[r.phenotype] || 0) + 1; });

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
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0c1020'; ctx.fillRect(0, 0, w, h);

      const cellSize = Math.min((w - 160) / 3, (h - 120) / 3);
      const startX = (w - cellSize * 3) / 2;
      const startY = 60;
      const g1 = getGametes(parent1);
      const g2 = getGametes(parent2);

      // Title
      ctx.fillStyle = 'rgba(200,200,255,0.8)'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Punnett Square', w/2, 25);
      ctx.font = '11px sans-serif'; ctx.fillStyle = 'rgba(200,200,255,0.5)';
      ctx.fillText(`${parent1} × ${parent2}`, w/2, 42);

      // Top header (parent 1 gametes)
      ctx.font = 'bold 16px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let j = 0; j < 2; j++) {
        const x = startX + (j + 1) * cellSize + cellSize / 2;
        const y = startY + cellSize / 2;
        ctx.fillStyle = 'rgba(100,180,255,0.7)';
        ctx.fillText(g1[j], x, y);
      }

      // Left header (parent 2 gametes)
      for (let i = 0; i < 2; i++) {
        const x = startX + cellSize / 2;
        const y = startY + (i + 1) * cellSize + cellSize / 2;
        ctx.fillStyle = 'rgba(255,150,200,0.7)';
        ctx.fillText(g2[i], x, y);
      }

      // Header label
      ctx.font = '10px sans-serif';
      ctx.fillStyle = 'rgba(100,180,255,0.5)'; ctx.fillText('Parent 1 ♂', startX + cellSize * 2, startY - 5);
      ctx.fillStyle = 'rgba(255,150,200,0.5)';
      ctx.save(); ctx.translate(startX - 5, startY + cellSize * 2); ctx.rotate(-Math.PI/2);
      ctx.fillText('Parent 2 ♀', 0, 0); ctx.restore();

      // Grid cells
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          const cx = startX + (j + 1) * cellSize;
          const cy = startY + (i + 1) * cellSize;
          const result = grid[i][j];
          const isDom = result.genotype[0].toUpperCase() === result.genotype[0];
          const bg = isDom ? t.domColor : t.recColor;

          ctx.fillStyle = bg + '30';
          ctx.fillRect(cx + 2, cy + 2, cellSize - 4, cellSize - 4);
          ctx.strokeStyle = bg + '60'; ctx.lineWidth = 1.5;
          ctx.strokeRect(cx + 2, cy + 2, cellSize - 4, cellSize - 4);

          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.font = 'bold 18px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(result.genotype, cx + cellSize / 2, cy + cellSize / 2 - 8);

          ctx.font = '9px sans-serif'; ctx.fillStyle = 'rgba(200,200,255,0.6)';
          ctx.fillText(result.phenotype, cx + cellSize / 2, cy + cellSize / 2 + 12);
        }
      }

      // Grid lines
      ctx.strokeStyle = 'rgba(100,130,200,0.2)'; ctx.lineWidth = 1;
      for (let i = 0; i <= 3; i++) {
        ctx.beginPath(); ctx.moveTo(startX, startY + i * cellSize); ctx.lineTo(startX + 3 * cellSize, startY + i * cellSize); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(startX + i * cellSize, startY); ctx.lineTo(startX + i * cellSize, startY + 3 * cellSize); ctx.stroke();
      }

      // Results section
      const resY = startY + 3 * cellSize + 25;
      ctx.fillStyle = 'rgba(200,200,255,0.7)'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('Genotype Ratio:', 20, resY);
      let rx = 20;
      Object.entries(genotypeCount).forEach(([g, c]) => {
        ctx.fillStyle = 'rgba(200,200,255,0.8)'; ctx.font = '12px monospace';
        ctx.fillText(`${g}: ${c}/4 (${c*25}%)`, rx, resY + 18);
        rx += 120;
      });

      ctx.fillStyle = 'rgba(200,200,255,0.7)'; ctx.font = 'bold 11px sans-serif';
      ctx.fillText('Phenotype Ratio:', 20, resY + 40);
      rx = 20;
      Object.entries(phenotypeCount).forEach(([p, c]) => {
        const isDom = p === t.dom;
        ctx.fillStyle = isDom ? t.domColor : t.recColor; ctx.font = '11px sans-serif';
        ctx.fillText(`${p}: ${c}/4 (${c*25}%)`, rx, resY + 58);
        rx += 160;
      });

      // Visual bar
      const barY = resY + 75;
      const barW = w - 40;
      const domFrac = (phenotypeCount[t.dom] || 0) / 4;
      ctx.fillStyle = t.domColor + '80'; ctx.fillRect(20, barY, barW * domFrac, 16);
      ctx.fillStyle = t.recColor + '80'; ctx.fillRect(20 + barW * domFrac, barY, barW * (1 - domFrac), 16);
      ctx.strokeStyle = 'rgba(200,200,255,0.2)'; ctx.strokeRect(20, barY, barW, 16);
    };
    draw();
    return () => obs.disconnect();
  }, [parent1, parent2, trait, domLabel, recLabel, domAllele, recAllele]);

  const handleTraitChange = (t: string) => {
    setTrait(t as any);
    if (t !== 'custom') {
      const tr = traits[t];
      setDomLabel(tr.dom); setRecLabel(tr.rec);
      setDomAllele(tr.dA); setRecAllele(tr.rA);
      setParent1(tr.dA + tr.rA); setParent2(tr.dA + tr.rA);
    }
  };

  const alleles = [t.dA + t.dA, t.dA + t.rA, t.rA + t.rA];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-950 to-violet-950 p-3 overflow-hidden">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-white">🧬 Genetics & Punnett Square</h2>
        <p className="text-[11px] text-gray-400">Mendelian inheritance prediction</p>
      </div>
      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 min-w-0 min-h-0 rounded-lg border border-gray-800 overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
        <div className="w-[210px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-2">
            <h4 className="text-[11px] font-semibold text-gray-400 uppercase">Trait</h4>
            {['eye','hair','seed','custom'].map(tr => (
              <button key={tr} onClick={() => handleTraitChange(tr)} className={`block w-full text-left px-2 py-1 rounded text-[10px] ${trait===tr?'bg-violet-600 text-white':'bg-gray-800 text-gray-400'}`}>
                {tr === 'custom' ? 'Custom Trait' : traits[tr].dom.split(' ')[0]}
              </button>
            ))}
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-2">
            <h4 className="text-[11px] font-semibold text-gray-400 uppercase">Parents</h4>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">Parent 1 ♂</label>
              <select value={parent1} onChange={e => setParent1(e.target.value)} className="w-full bg-gray-800 text-gray-300 text-[10px] rounded px-2 py-1 border border-gray-700">
                {alleles.map(a => <option key={a} value={a}>{a} ({a[0]===a[0].toUpperCase() ? (a[1]===a[1].toUpperCase() ? 'Homozygous Dom.' : 'Heterozygous') : 'Homozygous Rec.'})</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">Parent 2 ♀</label>
              <select value={parent2} onChange={e => setParent2(e.target.value)} className="w-full bg-gray-800 text-gray-300 text-[10px] rounded px-2 py-1 border border-gray-700">
                {alleles.map(a => <option key={a} value={a}>{a} ({a[0]===a[0].toUpperCase() ? (a[1]===a[1].toUpperCase() ? 'Homozygous Dom.' : 'Heterozygous') : 'Homozygous Rec.'})</option>)}
              </select>
            </div>
          </div>
          <div className="bg-violet-950/30 border border-violet-800/40 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-violet-300 flex items-center gap-1 mb-1"><Info className="h-3 w-3" /> Mendel's Laws</h4>
            <div className="text-[9px] text-gray-400 space-y-1">
              <p><strong>Dominant (uppercase):</strong> expressed when 1+ copy present</p>
              <p><strong>Recessive (lowercase):</strong> only expressed when homozygous</p>
              <p>Bb × Bb → 3:1 phenotype ratio (75% dominant, 25% recessive)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
