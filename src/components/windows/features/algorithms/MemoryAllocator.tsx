import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Info } from 'lucide-react';

interface MemBlock { start: number; size: number; id: number; label: string; color: string; }
interface AllocRequest { size: number; label: string; }

export const MemoryAllocator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [totalMemory] = useState(256);
  const [blocks, setBlocks] = useState<MemBlock[]>([]);
  const [algorithm, setAlgorithm] = useState<'first-fit'|'best-fit'|'worst-fit'>('first-fit');
  const [allocSize, setAllocSize] = useState(32);
  const [autoMode, setAutoMode] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [fragmentation, setFragmentation] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const nextId = useRef(1);
  const timerRef = useRef<number>(0);
  const colors = ['#4090ff','#a060ff','#ff6040','#40c060','#ffc040','#ff60a0','#60d0d0','#c080ff'];

  const getFreeBlocks = useCallback((blks: MemBlock[]): { start: number; size: number }[] => {
    const sorted = [...blks].sort((a, b) => a.start - b.start);
    const free: { start: number; size: number }[] = [];
    let pos = 0;
    sorted.forEach(b => {
      if (b.start > pos) free.push({ start: pos, size: b.start - pos });
      pos = b.start + b.size;
    });
    if (pos < totalMemory) free.push({ start: pos, size: totalMemory - pos });
    return free;
  }, [totalMemory]);

  const allocate = useCallback((size: number) => {
    const freeBlocks = getFreeBlocks(blocks);
    let chosen: { start: number; size: number } | null = null;

    const fittingBlocks = freeBlocks.filter(f => f.size >= size);
    if (fittingBlocks.length === 0) {
      setHistory(h => [...h.slice(-9), `FAIL: No space for ${size} bytes`]);
      return;
    }

    switch (algorithm) {
      case 'first-fit':
        chosen = fittingBlocks[0];
        break;
      case 'best-fit':
        chosen = fittingBlocks.reduce((a, b) => a.size < b.size ? a : b);
        break;
      case 'worst-fit':
        chosen = fittingBlocks.reduce((a, b) => a.size > b.size ? a : b);
        break;
    }

    if (chosen) {
      const id = nextId.current++;
      const label = `P${id}`;
      const color = colors[(id - 1) % colors.length];
      setBlocks(bs => [...bs, { start: chosen!.start, size, id, label, color }]);
      setHistory(h => [...h.slice(-9), `ALLOC ${label}: ${size}B at ${chosen!.start}`]);
    }
  }, [blocks, algorithm, getFreeBlocks]);

  const deallocate = useCallback((id: number) => {
    const block = blocks.find(b => b.id === id);
    if (block) {
      setBlocks(bs => bs.filter(b => b.id !== id));
      setHistory(h => [...h.slice(-9), `FREE ${block.label}: ${block.size}B at ${block.start}`]);
    }
  }, [blocks]);

  // Calculate fragmentation
  useEffect(() => {
    const freeBlocks = getFreeBlocks(blocks);
    const totalFree = freeBlocks.reduce((a, b) => a + b.size, 0);
    const largestFree = freeBlocks.reduce((a, b) => Math.max(a, b.size), 0);
    const frag = totalFree > 0 ? (1 - largestFree / totalFree) * 100 : 0;
    setFragmentation(frag);
  }, [blocks, getFreeBlocks]);

  // Auto mode
  useEffect(() => {
    if (autoMode) {
      timerRef.current = window.setInterval(() => {
        if (Math.random() < 0.6) {
          allocate(8 + Math.floor(Math.random() * 48));
        } else if (blocks.length > 0) {
          const idx = Math.floor(Math.random() * blocks.length);
          deallocate(blocks[idx].id);
        }
      }, 1500 / speed);
      return () => clearInterval(timerRef.current);
    }
  }, [autoMode, speed, blocks, allocate, deallocate]);

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
      ctx.fillStyle = '#080c18'; ctx.fillRect(0, 0, w, h);

      // Title
      ctx.fillStyle = 'rgba(200,200,255,0.7)'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('Memory Map', 15, 18);

      // Memory bar
      const barX = 15, barY = 28, barW = w - 30, barH = h * 0.25;
      ctx.fillStyle = 'rgba(30,60,30,0.3)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.strokeStyle = 'rgba(100,130,200,0.3)'; ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barW, barH);

      // Address markers
      ctx.fillStyle = 'rgba(150,150,200,0.3)'; ctx.font = '7px monospace'; ctx.textAlign = 'center';
      for (let i = 0; i <= 8; i++) {
        const x = barX + (i / 8) * barW;
        ctx.fillText(`${Math.floor(i * totalMemory / 8)}`, x, barY + barH + 10);
        ctx.strokeStyle = 'rgba(100,130,200,0.1)';
        ctx.beginPath(); ctx.moveTo(x, barY); ctx.lineTo(x, barY + barH); ctx.stroke();
      }

      // Draw allocated blocks
      blocks.forEach(b => {
        const bx = barX + (b.start / totalMemory) * barW;
        const bw = (b.size / totalMemory) * barW;
        ctx.fillStyle = b.color + '60';
        ctx.fillRect(bx, barY, bw, barH);
        ctx.strokeStyle = b.color; ctx.lineWidth = 1.5;
        ctx.strokeRect(bx, barY, bw, barH);
        if (bw > 20) {
          ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(b.label, bx + bw / 2, barY + barH / 2 - 3);
          ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '7px sans-serif';
          ctx.fillText(`${b.size}B`, bx + bw / 2, barY + barH / 2 + 8);
        }
      });

      // Free blocks visualization
      const freeBlocks = getFreeBlocks(blocks);
      freeBlocks.forEach(f => {
        const fx = barX + (f.start / totalMemory) * barW;
        const fw = (f.size / totalMemory) * barW;
        if (fw > 15) {
          ctx.fillStyle = 'rgba(100,200,100,0.15)';
          ctx.fillRect(fx + 1, barY + 1, fw - 2, barH - 2);
          ctx.fillStyle = 'rgba(100,200,100,0.3)'; ctx.font = '7px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(`${f.size}B free`, fx + fw / 2, barY + barH / 2 + 2);
        }
      });

      // Stats
      const statsY = barY + barH + 25;
      const used = blocks.reduce((a, b) => a + b.size, 0);
      const free = totalMemory - used;

      ctx.fillStyle = 'rgba(200,200,255,0.6)'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('Statistics', 15, statsY);

      const statItems = [
        ['Total', `${totalMemory}B`, 'rgba(200,200,255,0.5)'],
        ['Used', `${used}B (${(used/totalMemory*100).toFixed(0)}%)`, '#4090ff'],
        ['Free', `${free}B (${(free/totalMemory*100).toFixed(0)}%)`, '#40c060'],
        ['Fragmentation', `${fragmentation.toFixed(1)}%`, fragmentation > 50 ? '#ff4040' : '#ffc040'],
        ['Blocks', `${blocks.length}`, 'rgba(200,200,255,0.5)'],
      ];

      statItems.forEach(([label, val, color], i) => {
        const sy = statsY + 14 + i * 16;
        ctx.fillStyle = 'rgba(200,200,255,0.4)'; ctx.font = '9px sans-serif';
        ctx.fillText(label, 15, sy);
        ctx.fillStyle = color; ctx.font = '9px monospace'; ctx.textAlign = 'right';
        ctx.fillText(val, w * 0.4, sy);
        ctx.textAlign = 'left';
      });

      // Usage bar
      const ubY = statsY + 14 + 5 * 16 + 5;
      ctx.fillStyle = 'rgba(30,35,60,0.3)'; ctx.fillRect(15, ubY, w * 0.4 - 15, 8);
      ctx.fillStyle = '#4090ff60'; ctx.fillRect(15, ubY, (w * 0.4 - 15) * (used / totalMemory), 8);

      // History log
      const logX = w * 0.45;
      ctx.fillStyle = 'rgba(200,200,255,0.6)'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('Activity Log', logX, statsY);
      history.forEach((entry, i) => {
        const ly = statsY + 14 + i * 14;
        ctx.fillStyle = entry.startsWith('FAIL') ? 'rgba(255,100,100,0.6)' : entry.startsWith('FREE') ? 'rgba(100,200,100,0.5)' : 'rgba(100,160,255,0.5)';
        ctx.font = '8px monospace';
        ctx.fillText(entry, logX, ly);
      });

      // Allocated blocks list
      const listY = h * 0.7;
      if (blocks.length > 0) {
        ctx.fillStyle = 'rgba(200,200,255,0.5)'; ctx.font = 'bold 9px sans-serif';
        ctx.fillText('Click to free:', logX, listY);
        blocks.forEach((b, i) => {
          const by = listY + 12 + i * 16;
          if (by > h - 5) return;
          ctx.fillStyle = b.color + '40';
          ctx.fillRect(logX, by - 8, w - logX - 15, 14);
          ctx.fillStyle = b.color; ctx.font = '8px monospace';
          ctx.fillText(`${b.label}: ${b.size}B [${b.start}..${b.start + b.size - 1}]`, logX + 3, by + 1);
        });
      }

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animRef.current); obs.disconnect(); };
  }, [blocks, fragmentation, history, getFreeBlocks, totalMemory]);

  // Handle canvas click to free blocks
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const w = rect.width;
    const barX = 15, barW = w - 30, barY = 28, barH = rect.height * 0.25;

    if (y >= barY && y <= barY + barH && x >= barX && x <= barX + barW) {
      const memPos = ((x - barX) / barW) * totalMemory;
      const clicked = blocks.find(b => memPos >= b.start && memPos < b.start + b.size);
      if (clicked) deallocate(clicked.id);
    }
  }, [blocks, deallocate, totalMemory]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-950 to-purple-950 p-3 overflow-hidden">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-white">💾 Memory Allocation Visualizer</h2>
        <p className="text-[11px] text-gray-400">Dynamic memory allocation strategies</p>
      </div>
      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 min-w-0 min-h-0 rounded-lg border border-gray-800 overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full cursor-pointer" onClick={handleClick} />
        </div>
        <div className="w-[200px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-2">
            <h4 className="text-[11px] font-semibold text-gray-400 uppercase">Algorithm</h4>
            {(['first-fit','best-fit','worst-fit'] as const).map(a => (
              <button key={a} onClick={() => setAlgorithm(a)} className={`block w-full text-left px-2 py-1.5 rounded text-[10px] ${algorithm===a?'bg-purple-600 text-white':'bg-gray-800 text-gray-400'}`}>
                {a.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join(' ')}
              </button>
            ))}
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-2">
            <div>
              <label className="text-[10px] text-gray-400 flex justify-between"><span>Block size</span><span>{allocSize}B</span></label>
              <input type="range" min={8} max={96} step={8} value={allocSize} onChange={e => setAllocSize(+e.target.value)} className="w-full h-1 accent-purple-500" />
            </div>
            <button onClick={() => allocate(allocSize)} className="w-full px-2 py-1.5 rounded bg-green-700 text-white text-[10px] font-medium">Allocate</button>
          </div>
          <div className="flex gap-1">
            <button onClick={() => setAutoMode(!autoMode)} className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] font-medium ${autoMode?'bg-amber-600 text-white':'bg-purple-600 text-white'}`}>
              {autoMode?<><Pause className="h-3 w-3"/>Auto</>:<><Play className="h-3 w-3"/>Auto</>}
            </button>
            <button onClick={() => { setBlocks([]); setHistory([]); nextId.current = 1; }} className="px-2 py-1.5 rounded bg-gray-700 text-white text-[10px]"><RotateCcw className="h-3 w-3"/></button>
          </div>
          {autoMode && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
              <label className="text-[10px] text-gray-400 flex justify-between"><span>Speed</span><span>{speed}x</span></label>
              <input type="range" min={0.5} max={4} step={0.5} value={speed} onChange={e=>setSpeed(+e.target.value)} className="w-full h-1 accent-purple-500"/>
            </div>
          )}
          <div className="bg-purple-950/30 border border-purple-800/40 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-purple-300 flex items-center gap-1 mb-1"><Info className="h-3 w-3"/>About</h4>
            <div className="text-[9px] text-gray-400 space-y-0.5">
              <p><strong>First Fit:</strong> Uses first available hole</p>
              <p><strong>Best Fit:</strong> Smallest sufficient hole</p>
              <p><strong>Worst Fit:</strong> Largest available hole</p>
              <p>Click blocks on memory bar to free them.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
