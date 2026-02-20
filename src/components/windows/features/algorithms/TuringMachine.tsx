import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, StepForward, Info } from 'lucide-react';

interface TapeCell { value: string; }

export const TuringMachine: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [tape, setTape] = useState<string[]>(new Array(31).fill('_'));
  const [headPos, setHeadPos] = useState(15);
  const [state, setState] = useState('q0');
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [halted, setHalted] = useState(false);
  const [steps, setSteps] = useState(0);
  const [selectedProgram, setSelectedProgram] = useState(0);
  const timerRef = useRef<number>(0);
  const [history, setHistory] = useState<string[]>([]);

  type Rule = { write: string; move: 'L' | 'R'; nextState: string };
  type TransitionTable = Record<string, Record<string, Rule>>;

  const programs: { name: string; description: string; setup: string[]; startPos: number; transitions: TransitionTable }[] = [
    {
      name: 'Binary Increment',
      description: 'Adds 1 to a binary number',
      setup: (() => { const t = new Array(31).fill('_'); t[13] = '1'; t[14] = '0'; t[15] = '1'; t[16] = '1'; return t; })(),
      startPos: 16,
      transitions: {
        q0: { '0': { write: '0', move: 'R', nextState: 'q0' }, '1': { write: '1', move: 'R', nextState: 'q0' }, '_': { write: '_', move: 'L', nextState: 'q1' } },
        q1: { '0': { write: '1', move: 'L', nextState: 'q2' }, '1': { write: '0', move: 'L', nextState: 'q1' }, '_': { write: '1', move: 'R', nextState: 'qH' } },
        q2: { '0': { write: '0', move: 'L', nextState: 'q2' }, '1': { write: '1', move: 'L', nextState: 'q2' }, '_': { write: '_', move: 'R', nextState: 'qH' } },
      },
    },
    {
      name: 'Palindrome Checker',
      description: 'Checks if a string of a/b is a palindrome',
      setup: (() => { const t = new Array(31).fill('_'); 'abba'.split('').forEach((c, i) => t[14 + i] = c); return t; })(),
      startPos: 14,
      transitions: {
        q0: { 'a': { write: '_', move: 'R', nextState: 'qa' }, 'b': { write: '_', move: 'R', nextState: 'qb' }, '_': { write: 'Y', move: 'R', nextState: 'qH' } },
        qa: { 'a': { write: 'a', move: 'R', nextState: 'qa' }, 'b': { write: 'b', move: 'R', nextState: 'qa' }, '_': { write: '_', move: 'L', nextState: 'qa2' } },
        qa2: { 'a': { write: '_', move: 'L', nextState: 'qB' }, 'b': { write: 'N', move: 'R', nextState: 'qH' }, '_': { write: 'Y', move: 'R', nextState: 'qH' } },
        qb: { 'a': { write: 'a', move: 'R', nextState: 'qb' }, 'b': { write: 'b', move: 'R', nextState: 'qb' }, '_': { write: '_', move: 'L', nextState: 'qb2' } },
        qb2: { 'b': { write: '_', move: 'L', nextState: 'qB' }, 'a': { write: 'N', move: 'R', nextState: 'qH' }, '_': { write: 'Y', move: 'R', nextState: 'qH' } },
        qB: { 'a': { write: 'a', move: 'L', nextState: 'qB' }, 'b': { write: 'b', move: 'L', nextState: 'qB' }, '_': { write: '_', move: 'R', nextState: 'q0' } },
      },
    },
    {
      name: 'Unary Doubler',
      description: 'Doubles a unary number (1s)',
      setup: (() => { const t = new Array(31).fill('_'); for (let i = 14; i <= 16; i++) t[i] = '1'; return t; })(),
      startPos: 14,
      transitions: {
        q0: { '1': { write: 'X', move: 'R', nextState: 'q1' }, '_': { write: '_', move: 'L', nextState: 'q3' } },
        q1: { '1': { write: '1', move: 'R', nextState: 'q1' }, '_': { write: '_', move: 'R', nextState: 'q2' }, 'Y': { write: 'Y', move: 'R', nextState: 'q1' } },
        q2: { 'Y': { write: 'Y', move: 'R', nextState: 'q2' }, '_': { write: 'Y', move: 'L', nextState: 'qR' } },
        qR: { '1': { write: '1', move: 'L', nextState: 'qR' }, '_': { write: '_', move: 'L', nextState: 'qR' }, 'X': { write: 'X', move: 'R', nextState: 'q0' }, 'Y': { write: 'Y', move: 'L', nextState: 'qR' } },
        q3: { 'X': { write: '1', move: 'L', nextState: 'q3' }, '_': { write: '_', move: 'R', nextState: 'q4' } },
        q4: { '1': { write: '1', move: 'R', nextState: 'q4' }, '_': { write: '_', move: 'R', nextState: 'q5' } },
        q5: { 'Y': { write: '1', move: 'R', nextState: 'q5' }, '_': { write: '_', move: 'L', nextState: 'qH' } },
      },
    },
  ];

  const currentProgram = programs[selectedProgram];

  const reset = useCallback(() => {
    setTape([...currentProgram.setup]);
    setHeadPos(currentProgram.startPos);
    setState('q0');
    setHalted(false);
    setSteps(0);
    setRunning(false);
    setHistory([]);
  }, [currentProgram]);

  useEffect(() => { reset(); }, [selectedProgram]);

  const executeStep = useCallback(() => {
    if (halted || state === 'qH') { setHalted(true); setRunning(false); return; }
    const symbol = tape[headPos] || '_';
    const rule = currentProgram.transitions[state]?.[symbol];
    if (!rule) { setHalted(true); setRunning(false); setHistory(h => [...h.slice(-8), `No rule for (${state}, ${symbol}) → HALT`]); return; }

    const newTape = [...tape];
    newTape[headPos] = rule.write;
    const newPos = headPos + (rule.move === 'R' ? 1 : -1);

    setHistory(h => [...h.slice(-8), `(${state},${symbol}) → (${rule.nextState},${rule.write},${rule.move})`]);
    setTape(newTape);
    setHeadPos(Math.max(0, Math.min(newTape.length - 1, newPos)));
    setState(rule.nextState);
    setSteps(s => s + 1);

    if (rule.nextState === 'qH') { setHalted(true); setRunning(false); }
  }, [tape, headPos, state, halted, currentProgram]);

  useEffect(() => {
    if (running) {
      timerRef.current = window.setInterval(executeStep, 600 / speed);
      return () => clearInterval(timerRef.current);
    }
  }, [running, executeStep, speed]);

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
      ctx.fillStyle = 'rgba(200,200,255,0.7)'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(currentProgram.name, w / 2, 18);
      ctx.fillStyle = 'rgba(200,200,255,0.4)'; ctx.font = '9px sans-serif';
      ctx.fillText(currentProgram.description, w / 2, 32);

      // Tape
      const tapeY = h * 0.2;
      const cellW = 32;
      const visibleCells = Math.floor(w / cellW);
      const startIdx = Math.max(0, headPos - Math.floor(visibleCells / 2));
      const endIdx = Math.min(tape.length, startIdx + visibleCells);

      for (let i = startIdx; i < endIdx; i++) {
        const cx = (i - startIdx) * cellW + cellW / 2 + ((w - (endIdx - startIdx) * cellW) / 2);
        const isHead = i === headPos;

        // Cell background
        ctx.fillStyle = isHead ? 'rgba(100,160,255,0.3)' : tape[i] !== '_' ? 'rgba(60,80,120,0.2)' : 'rgba(30,35,60,0.3)';
        ctx.fillRect(cx - cellW / 2 + 1, tapeY, cellW - 2, 40);
        ctx.strokeStyle = isHead ? 'rgba(100,160,255,0.8)' : 'rgba(60,70,100,0.3)';
        ctx.lineWidth = isHead ? 2 : 0.5;
        ctx.strokeRect(cx - cellW / 2 + 1, tapeY, cellW - 2, 40);

        // Cell value
        ctx.fillStyle = tape[i] === '_' ? 'rgba(100,100,140,0.4)' : 'rgba(255,255,255,0.8)';
        ctx.font = `${isHead ? 'bold ' : ''}14px monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(tape[i], cx, tapeY + 20);

        // Index
        ctx.fillStyle = 'rgba(100,100,140,0.3)'; ctx.font = '7px monospace';
        ctx.fillText(i.toString(), cx, tapeY + 48);
      }

      // Head pointer
      const headScreenX = (headPos - startIdx) * cellW + cellW / 2 + ((w - (endIdx - startIdx) * cellW) / 2);
      ctx.fillStyle = '#4ade80';
      ctx.beginPath(); ctx.moveTo(headScreenX, tapeY - 5); ctx.lineTo(headScreenX - 8, tapeY - 18); ctx.lineTo(headScreenX + 8, tapeY - 18); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#4ade80'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('HEAD', headScreenX, tapeY - 22);

      // State display
      const stateY = tapeY + 65;
      ctx.fillStyle = halted ? 'rgba(255,100,100,0.3)' : 'rgba(100,160,255,0.2)';
      const stateBoxW = 100;
      ctx.fillRect(w / 2 - stateBoxW / 2, stateY, stateBoxW, 30);
      ctx.strokeStyle = halted ? 'rgba(255,100,100,0.6)' : 'rgba(100,160,255,0.5)'; ctx.lineWidth = 1.5;
      ctx.strokeRect(w / 2 - stateBoxW / 2, stateY, stateBoxW, 30);
      ctx.fillStyle = halted ? '#ff6060' : '#80c0ff'; ctx.font = 'bold 14px monospace';
      ctx.fillText(halted ? 'HALTED' : `State: ${state}`, w / 2, stateY + 18);

      // Transition rules table
      const tableY = stateY + 45;
      ctx.fillStyle = 'rgba(200,200,255,0.5)'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('Transition Rules (current state)', 15, tableY);

      const stateRules = currentProgram.transitions[state];
      if (stateRules) {
        let ri = 0;
        Object.entries(stateRules).forEach(([sym, rule]) => {
          const ry = tableY + 14 + ri * 16;
          if (ry > h - 40) return;
          const isActive = sym === (tape[headPos] || '_');
          ctx.fillStyle = isActive ? 'rgba(100,220,128,0.15)' : 'rgba(20,25,40,0.3)';
          ctx.fillRect(15, ry - 8, w * 0.5, 14);
          ctx.fillStyle = isActive ? 'rgba(100,220,128,0.8)' : 'rgba(150,150,200,0.5)';
          ctx.font = '9px monospace';
          ctx.fillText(`(${state}, ${sym}) → (${rule.nextState}, ${rule.write}, ${rule.move})`, 18, ry + 2);
          ri++;
        });
      }

      // History log
      const logX = w * 0.55;
      ctx.fillStyle = 'rgba(200,200,255,0.5)'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('Execution Log', logX, tableY);
      history.forEach((entry, i) => {
        const ly = tableY + 14 + i * 14;
        if (ly > h - 10) return;
        ctx.fillStyle = 'rgba(100,160,255,0.5)'; ctx.font = '8px monospace';
        ctx.fillText(entry, logX, ly);
      });

      // Steps counter
      ctx.fillStyle = 'rgba(200,200,255,0.4)'; ctx.font = '9px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(`Steps: ${steps}`, w - 10, h - 5);

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animRef.current); obs.disconnect(); };
  }, [tape, headPos, state, halted, steps, history, currentProgram]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-950 to-amber-950 p-3 overflow-hidden">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-white">📼 Turing Machine Simulator</h2>
        <p className="text-[11px] text-gray-400">Universal computation model</p>
      </div>
      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 min-w-0 min-h-0 rounded-lg border border-gray-800 overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
        <div className="w-[200px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          <div className="flex gap-1">
            <button onClick={() => setRunning(!running)} disabled={halted} className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] font-medium disabled:opacity-30 ${running?'bg-amber-600 text-white':'bg-green-600 text-white'}`}>
              {running?<><Pause className="h-3 w-3"/>Pause</>:<><Play className="h-3 w-3"/>Run</>}
            </button>
            <button onClick={executeStep} disabled={running || halted} className="px-2 py-1.5 rounded bg-blue-700 text-white text-[10px] disabled:opacity-30"><StepForward className="h-3 w-3"/></button>
            <button onClick={reset} className="px-2 py-1.5 rounded bg-gray-700 text-white text-[10px]"><RotateCcw className="h-3 w-3"/></button>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-1">
            <h4 className="text-[11px] font-semibold text-gray-400 uppercase mb-1">Program</h4>
            {programs.map((p, i) => (
              <button key={i} onClick={() => setSelectedProgram(i)} className={`block w-full text-left px-2 py-1.5 rounded text-[10px] ${selectedProgram===i?'bg-amber-700 text-white':'bg-gray-800 text-gray-400'}`}>{p.name}</button>
            ))}
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
            <label className="text-[10px] text-gray-400 flex justify-between"><span>Speed</span><span>{speed}x</span></label>
            <input type="range" min={0.5} max={4} step={0.5} value={speed} onChange={e=>setSpeed(+e.target.value)} className="w-full h-1 accent-amber-500"/>
          </div>
          <div className="bg-amber-950/30 border border-amber-800/40 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-amber-300 flex items-center gap-1 mb-1"><Info className="h-3 w-3"/>About</h4>
            <div className="text-[9px] text-gray-400 space-y-1">
              <p>A Turing Machine has an infinite tape, a head that reads/writes, and a set of states with transition rules.</p>
              <p>It can compute anything that any computer can compute (Church-Turing thesis).</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
