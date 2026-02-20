import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Info, StepForward } from 'lucide-react';

interface Register { name: string; value: number; }
interface Instruction { opcode: string; operand1?: string; operand2?: string; description: string; }

export const CPUSimulator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [pc, setPc] = useState(0);
  const [stage, setStage] = useState<'fetch'|'decode'|'execute'|'store'>('fetch');
  const [registers, setRegisters] = useState<Record<string, number>>({ AX: 0, BX: 0, CX: 0, DX: 0 });
  const [flags, setFlags] = useState({ zero: false, carry: false, negative: false });
  const [memory, setMemory] = useState<number[]>(new Array(16).fill(0));
  const [selectedProgram, setSelectedProgram] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const animRef = useRef<number>(0);
  const timerRef = useRef<number>(0);

  const programs: { name: string; instructions: Instruction[] }[] = [
    {
      name: 'Counter',
      instructions: [
        { opcode: 'MOV', operand1: 'AX', operand2: '0', description: 'Set AX = 0' },
        { opcode: 'ADD', operand1: 'AX', operand2: '1', description: 'AX = AX + 1' },
        { opcode: 'CMP', operand1: 'AX', operand2: '5', description: 'Compare AX with 5' },
        { opcode: 'JNE', operand1: '1', description: 'Jump to line 1 if not equal' },
        { opcode: 'STORE', operand1: '0', operand2: 'AX', description: 'Store AX to memory[0]' },
        { opcode: 'HLT', description: 'Halt execution' },
      ],
    },
    {
      name: 'Add Two Numbers',
      instructions: [
        { opcode: 'MOV', operand1: 'AX', operand2: '7', description: 'Set AX = 7' },
        { opcode: 'MOV', operand1: 'BX', operand2: '5', description: 'Set BX = 5' },
        { opcode: 'ADD', operand1: 'AX', operand2: 'BX', description: 'AX = AX + BX' },
        { opcode: 'STORE', operand1: '0', operand2: 'AX', description: 'Store result to mem[0]' },
        { opcode: 'HLT', description: 'Halt' },
      ],
    },
    {
      name: 'Fibonacci',
      instructions: [
        { opcode: 'MOV', operand1: 'AX', operand2: '0', description: 'AX = 0 (fib n-2)' },
        { opcode: 'MOV', operand1: 'BX', operand2: '1', description: 'BX = 1 (fib n-1)' },
        { opcode: 'MOV', operand1: 'CX', operand2: '0', description: 'CX = 0 (counter)' },
        { opcode: 'MOV', operand1: 'DX', operand2: 'AX', description: 'DX = AX (temp)' },
        { opcode: 'ADD', operand1: 'DX', operand2: 'BX', description: 'DX = AX + BX' },
        { opcode: 'MOV', operand1: 'AX', operand2: 'BX', description: 'AX = BX' },
        { opcode: 'MOV', operand1: 'BX', operand2: 'DX', description: 'BX = DX (new fib)' },
        { opcode: 'ADD', operand1: 'CX', operand2: '1', description: 'CX++' },
        { opcode: 'CMP', operand1: 'CX', operand2: '7', description: 'Compare CX with 7' },
        { opcode: 'JNE', operand1: '3', description: 'Loop if CX != 7' },
        { opcode: 'STORE', operand1: '0', operand2: 'BX', description: 'Store result' },
        { opcode: 'HLT', description: 'Halt' },
      ],
    },
  ];

  const currentProgram = programs[selectedProgram];

  const reset = useCallback(() => {
    setPc(0); setStage('fetch'); setRegisters({ AX: 0, BX: 0, CX: 0, DX: 0 });
    setFlags({ zero: false, carry: false, negative: false });
    setMemory(new Array(16).fill(0)); setCycleCount(0); setRunning(false);
  }, []);

  const getVal = (op: string | undefined, regs: Record<string, number>): number => {
    if (!op) return 0;
    if (op in regs) return regs[op];
    return parseInt(op) || 0;
  };

  const executeStep = useCallback(() => {
    if (pc >= currentProgram.instructions.length) { setRunning(false); return; }
    const instr = currentProgram.instructions[pc];
    const newRegs = { ...registers };
    const newFlags = { ...flags };
    const newMem = [...memory];
    let newPc = pc + 1;

    switch (instr.opcode) {
      case 'MOV':
        if (instr.operand1 && instr.operand1 in newRegs)
          newRegs[instr.operand1] = getVal(instr.operand2, newRegs);
        break;
      case 'ADD':
        if (instr.operand1 && instr.operand1 in newRegs) {
          newRegs[instr.operand1] += getVal(instr.operand2, newRegs);
          newFlags.zero = newRegs[instr.operand1] === 0;
          newFlags.negative = newRegs[instr.operand1] < 0;
          newFlags.carry = newRegs[instr.operand1] > 255;
        }
        break;
      case 'SUB':
        if (instr.operand1 && instr.operand1 in newRegs) {
          newRegs[instr.operand1] -= getVal(instr.operand2, newRegs);
          newFlags.zero = newRegs[instr.operand1] === 0;
          newFlags.negative = newRegs[instr.operand1] < 0;
        }
        break;
      case 'CMP': {
        const a = getVal(instr.operand1, newRegs);
        const b = getVal(instr.operand2, newRegs);
        newFlags.zero = a === b;
        newFlags.negative = a < b;
        newFlags.carry = a > b;
        break;
      }
      case 'JNE':
        if (!newFlags.zero) newPc = parseInt(instr.operand1 || '0');
        break;
      case 'JE':
        if (newFlags.zero) newPc = parseInt(instr.operand1 || '0');
        break;
      case 'JMP':
        newPc = parseInt(instr.operand1 || '0');
        break;
      case 'STORE':
        newMem[parseInt(instr.operand1 || '0')] = getVal(instr.operand2, newRegs);
        break;
      case 'LOAD':
        if (instr.operand1 && instr.operand1 in newRegs)
          newRegs[instr.operand1] = newMem[parseInt(instr.operand2 || '0')];
        break;
      case 'HLT':
        setRunning(false);
        break;
    }

    setRegisters(newRegs);
    setFlags(newFlags);
    setMemory(newMem);
    setPc(newPc);
    setCycleCount(c => c + 1);

    // Cycle through stages visually
    setStage('fetch');
    setTimeout(() => setStage('decode'), 100 / speed);
    setTimeout(() => setStage('execute'), 200 / speed);
    setTimeout(() => setStage('store'), 300 / speed);
  }, [pc, registers, flags, memory, currentProgram, speed]);

  useEffect(() => {
    if (running) {
      timerRef.current = window.setInterval(executeStep, 800 / speed);
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

      // CPU Pipeline visualization
      const stages = ['fetch', 'decode', 'execute', 'store'];
      const stageLabels = ['FETCH', 'DECODE', 'EXECUTE', 'WRITE BACK'];
      const stageColors = ['#4090ff', '#a060ff', '#ff6040', '#40c060'];
      const pipeY = 20;
      const stageW = (w - 40) / 4;

      stages.forEach((s, i) => {
        const sx = 20 + i * stageW;
        const isActive = stage === s;
        ctx.fillStyle = isActive ? stageColors[i] + '30' : 'rgba(30,35,60,0.3)';
        ctx.fillRect(sx + 1, pipeY, stageW - 2, 35);
        ctx.strokeStyle = isActive ? stageColors[i] : 'rgba(60,70,100,0.3)';
        ctx.lineWidth = isActive ? 2 : 0.5;
        ctx.strokeRect(sx + 1, pipeY, stageW - 2, 35);
        ctx.fillStyle = isActive ? stageColors[i] : 'rgba(150,150,200,0.4)';
        ctx.font = `${isActive ? 'bold ' : ''}9px sans-serif`; ctx.textAlign = 'center';
        ctx.fillText(stageLabels[i], sx + stageW / 2, pipeY + 15);
        if (isActive && pc < currentProgram.instructions.length) {
          ctx.font = '8px monospace'; ctx.fillStyle = 'rgba(200,200,255,0.6)';
          ctx.fillText(currentProgram.instructions[pc]?.opcode || '', sx + stageW / 2, pipeY + 28);
        }
        // Arrow
        if (i < 3) {
          ctx.fillStyle = 'rgba(100,130,200,0.3)';
          const ax = sx + stageW;
          ctx.beginPath(); ctx.moveTo(ax - 4, pipeY + 14); ctx.lineTo(ax + 4, pipeY + 17.5); ctx.lineTo(ax - 4, pipeY + 21); ctx.closePath(); ctx.fill();
        }
      });

      // Instructions list
      const instY = 70;
      ctx.fillStyle = 'rgba(200,200,255,0.6)'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('Program Instructions', 15, instY);
      currentProgram.instructions.forEach((inst, i) => {
        const iy = instY + 14 + i * 18;
        if (iy > h - 10) return;
        const isPC = i === pc;
        ctx.fillStyle = isPC ? 'rgba(100,160,255,0.2)' : 'rgba(20,25,40,0.3)';
        ctx.fillRect(15, iy - 10, w * 0.55, 16);
        if (isPC) {
          ctx.fillStyle = '#4ade80'; ctx.font = '9px sans-serif';
          ctx.fillText('→', 18, iy + 1);
        }
        ctx.fillStyle = 'rgba(100,130,200,0.4)'; ctx.font = '8px monospace';
        ctx.fillText(`${i.toString().padStart(2, '0')}:`, 28, iy + 1);
        ctx.fillStyle = isPC ? 'rgba(200,200,255,0.9)' : 'rgba(200,200,255,0.5)';
        ctx.font = '9px monospace';
        const instStr = `${inst.opcode} ${inst.operand1 || ''} ${inst.operand2 ? ', ' + inst.operand2 : ''}`;
        ctx.fillText(instStr, 48, iy + 1);
        ctx.fillStyle = 'rgba(150,150,200,0.3)'; ctx.font = '8px sans-serif';
        ctx.fillText(inst.description, 160, iy + 1);
      });

      // Registers (right side)
      const regX = w * 0.62;
      ctx.fillStyle = 'rgba(200,200,255,0.6)'; ctx.font = 'bold 10px sans-serif';
      ctx.fillText('Registers', regX, instY);
      Object.entries(registers).forEach(([name, val], i) => {
        const ry = instY + 14 + i * 22;
        ctx.fillStyle = 'rgba(30,35,60,0.5)';
        ctx.fillRect(regX, ry - 10, w * 0.15, 18);
        ctx.strokeStyle = 'rgba(60,70,100,0.3)'; ctx.lineWidth = 0.5;
        ctx.strokeRect(regX, ry - 10, w * 0.15, 18);
        ctx.fillStyle = 'rgba(100,180,255,0.7)'; ctx.font = 'bold 10px monospace';
        ctx.fillText(name, regX + 5, ry + 2);
        ctx.fillStyle = 'rgba(200,200,255,0.8)'; ctx.font = '10px monospace'; ctx.textAlign = 'right';
        ctx.fillText(val.toString(), regX + w * 0.15 - 5, ry + 2);
        ctx.textAlign = 'left';
      });

      // Flags
      const flagY = instY + 14 + 4 * 22 + 10;
      ctx.fillStyle = 'rgba(200,200,255,0.5)'; ctx.font = 'bold 9px sans-serif';
      ctx.fillText('Flags', regX, flagY);
      [['Z', flags.zero], ['C', flags.carry], ['N', flags.negative]].forEach(([name, val], i) => {
        ctx.fillStyle = val ? 'rgba(100,220,128,0.7)' : 'rgba(80,80,100,0.4)';
        ctx.fillRect(regX + i * 35, flagY + 5, 28, 16);
        ctx.fillStyle = val ? '#fff' : 'rgba(150,150,200,0.5)';
        ctx.font = '9px monospace'; ctx.textAlign = 'center';
        ctx.fillText(name as string, regX + i * 35 + 14, flagY + 16);
        ctx.textAlign = 'left';
      });

      // Memory (bottom)
      const memY = Math.min(flagY + 40, h - 50);
      ctx.fillStyle = 'rgba(200,200,255,0.5)'; ctx.font = 'bold 9px sans-serif';
      ctx.fillText('Memory', regX, memY);
      const memCols = 4;
      memory.slice(0, 8).forEach((val, i) => {
        const mx = regX + (i % memCols) * 32;
        const my = memY + 8 + Math.floor(i / memCols) * 18;
        ctx.fillStyle = val !== 0 ? 'rgba(100,220,128,0.2)' : 'rgba(30,35,60,0.3)';
        ctx.fillRect(mx, my, 28, 14);
        ctx.fillStyle = 'rgba(150,150,200,0.3)'; ctx.font = '7px monospace';
        ctx.fillText(`[${i}]`, mx + 1, my + 5);
        ctx.fillStyle = val !== 0 ? 'rgba(100,220,128,0.8)' : 'rgba(150,150,200,0.4)';
        ctx.font = '8px monospace'; ctx.textAlign = 'right';
        ctx.fillText(val.toString(), mx + 26, my + 12);
        ctx.textAlign = 'left';
      });

      // Cycle counter
      ctx.fillStyle = 'rgba(200,200,255,0.4)'; ctx.font = '9px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(`Cycles: ${cycleCount}`, w - 10, h - 5);
      ctx.textAlign = 'left';

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animRef.current); obs.disconnect(); };
  }, [pc, stage, registers, flags, memory, currentProgram, cycleCount]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-950 to-blue-950 p-3 overflow-hidden">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-white">🖥 CPU Instruction Cycle Simulator</h2>
        <p className="text-[11px] text-gray-400">Fetch-Decode-Execute pipeline visualization</p>
      </div>
      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 min-w-0 min-h-0 rounded-lg border border-gray-800 overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
        <div className="w-[200px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          <div className="flex gap-1">
            <button onClick={() => setRunning(!running)} className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] font-medium ${running?'bg-amber-600 text-white':'bg-blue-600 text-white'}`}>
              {running?<><Pause className="h-3 w-3"/>Pause</>:<><Play className="h-3 w-3"/>Run</>}
            </button>
            <button onClick={executeStep} disabled={running} className="px-2 py-1.5 rounded bg-green-700 text-white text-[10px] disabled:opacity-30"><StepForward className="h-3 w-3"/></button>
            <button onClick={reset} className="px-2 py-1.5 rounded bg-gray-700 text-white text-[10px]"><RotateCcw className="h-3 w-3"/></button>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-1">
            <h4 className="text-[11px] font-semibold text-gray-400 uppercase mb-1">Program</h4>
            {programs.map((p, i) => (
              <button key={i} onClick={() => { setSelectedProgram(i); reset(); }} className={`block w-full text-left px-2 py-1.5 rounded text-[10px] ${selectedProgram===i?'bg-blue-700 text-white':'bg-gray-800 text-gray-400'}`}>{p.name}</button>
            ))}
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
            <label className="text-[10px] text-gray-400 flex justify-between"><span>Speed</span><span>{speed}x</span></label>
            <input type="range" min={0.5} max={4} step={0.5} value={speed} onChange={e=>setSpeed(+e.target.value)} className="w-full h-1 accent-blue-500"/>
          </div>
          <div className="bg-blue-950/30 border border-blue-800/40 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-blue-300 flex items-center gap-1 mb-1"><Info className="h-3 w-3"/>Pipeline</h4>
            <div className="text-[9px] text-gray-400 space-y-0.5">
              <p><strong>Fetch:</strong> Read instruction from memory</p>
              <p><strong>Decode:</strong> Interpret the opcode</p>
              <p><strong>Execute:</strong> Perform the operation</p>
              <p><strong>Write Back:</strong> Store the result</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
