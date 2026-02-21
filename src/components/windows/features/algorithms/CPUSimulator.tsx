import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, StepForward, Info, Code, Trophy, BookOpen, Check, X, Lightbulb, ChevronRight } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Instruction {
  opcode: string;
  operand1?: string;
  operand2?: string;
}

interface ParseError {
  line: number;
  message: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  hints: string[];
  initialRegisters?: Record<string, number>;
  initialMemory?: number[];
  check: (regs: Record<string, number>, mem: number[], stack: number[]) => boolean;
  starterCode?: string;
}

/* ------------------------------------------------------------------ */
/*  Instruction Reference                                              */
/* ------------------------------------------------------------------ */

const INSTRUCTION_REF: { op: string; syntax: string; desc: string }[] = [
  { op: 'MOV', syntax: 'MOV R, V', desc: 'Set register R to value/register V' },
  { op: 'ADD', syntax: 'ADD R, V', desc: 'R = R + V' },
  { op: 'SUB', syntax: 'SUB R, V', desc: 'R = R - V' },
  { op: 'MUL', syntax: 'MUL R, V', desc: 'R = R * V' },
  { op: 'DIV', syntax: 'DIV R, V', desc: 'R = R / V (integer)' },
  { op: 'CMP', syntax: 'CMP R, V', desc: 'Compare R with V, set flags' },
  { op: 'JMP', syntax: 'JMP L', desc: 'Jump to line L' },
  { op: 'JE',  syntax: 'JE L',  desc: 'Jump if Zero flag set' },
  { op: 'JNE', syntax: 'JNE L', desc: 'Jump if Zero flag not set' },
  { op: 'JG',  syntax: 'JG L',  desc: 'Jump if greater (Carry set)' },
  { op: 'JL',  syntax: 'JL L',  desc: 'Jump if less (Negative set)' },
  { op: 'STORE', syntax: 'STORE A, R', desc: 'memory[A] = R' },
  { op: 'LOAD',  syntax: 'LOAD R, A',  desc: 'R = memory[A]' },
  { op: 'PUSH', syntax: 'PUSH V', desc: 'Push V onto stack' },
  { op: 'POP',  syntax: 'POP R',  desc: 'Pop stack top into R' },
  { op: 'AND', syntax: 'AND R, V', desc: 'R = R & V' },
  { op: 'OR',  syntax: 'OR R, V',  desc: 'R = R | V' },
  { op: 'XOR', syntax: 'XOR R, V', desc: 'R = R ^ V' },
  { op: 'NOT', syntax: 'NOT R',    desc: 'R = ~R (bitwise NOT)' },
  { op: 'SHL', syntax: 'SHL R, V', desc: 'R = R << V' },
  { op: 'SHR', syntax: 'SHR R, V', desc: 'R = R >> V' },
  { op: 'NOP', syntax: 'NOP',      desc: 'No operation' },
  { op: 'HLT', syntax: 'HLT',      desc: 'Halt execution' },
];

const VALID_OPCODES = new Set(INSTRUCTION_REF.map(i => i.op));
const REGISTERS = new Set(['AX', 'BX', 'CX', 'DX', 'SP']);

/* ------------------------------------------------------------------ */
/*  Sample Snippets                                                    */
/* ------------------------------------------------------------------ */

const SAMPLE_SNIPPETS: { name: string; code: string }[] = [
  {
    name: 'Counter 0-5',
    code: `MOV AX, 0\nADD AX, 1\nCMP AX, 5\nJNE 1\nSTORE 0, AX\nHLT`,
  },
  {
    name: 'Add Two Numbers',
    code: `MOV AX, 7\nMOV BX, 5\nADD AX, BX\nSTORE 0, AX\nHLT`,
  },
  {
    name: 'Fibonacci',
    code: `MOV AX, 0\nMOV BX, 1\nMOV CX, 0\nMOV DX, AX\nADD DX, BX\nMOV AX, BX\nMOV BX, DX\nADD CX, 1\nCMP CX, 7\nJNE 3\nSTORE 0, BX\nHLT`,
  },
  {
    name: 'Stack Push/Pop',
    code: `MOV AX, 10\nPUSH AX\nMOV AX, 20\nPUSH AX\nPOP BX\nPOP CX\nHLT`,
  },
  {
    name: 'Bitwise Ops',
    code: `MOV AX, 12\nMOV BX, 10\nAND CX, AX\nMOV CX, AX\nAND CX, BX\nOR DX, AX\nMOV DX, AX\nOR DX, BX\nXOR AX, BX\nHLT`,
  },
];

/* ------------------------------------------------------------------ */
/*  Challenges                                                         */
/* ------------------------------------------------------------------ */

const CHALLENGES: Challenge[] = [
  // --- Beginner ---
  {
    id: 'b1', title: 'Set AX to 10', difficulty: 'beginner',
    description: 'Write a program that sets register AX to the value 10.',
    hints: ['Use MOV AX, 10', 'Don\'t forget HLT at the end'],
    starterCode: '; Set AX to 10\n\nHLT',
    check: (r) => r.AX === 10,
  },
  {
    id: 'b2', title: 'Add 5 and 3', difficulty: 'beginner',
    description: 'Add the numbers 5 and 3 and store the result in AX.',
    hints: ['MOV AX, 5 then ADD AX, 3', 'Or use two registers and ADD'],
    starterCode: '; Result should be in AX\n\nHLT',
    check: (r) => r.AX === 8,
  },
  {
    id: 'b3', title: 'Count 0 to 5', difficulty: 'beginner',
    description: 'Count from 0 to 5 in AX using a loop. AX should be 5 when done.',
    hints: ['Use CMP and JNE to loop', 'MOV AX, 0 then ADD AX, 1 in a loop'],
    starterCode: '; Count from 0 to 5 in AX\n\nHLT',
    check: (r) => r.AX === 5,
  },
  // --- Intermediate ---
  {
    id: 'i1', title: 'Factorial of 5', difficulty: 'intermediate',
    description: 'Compute 5! (=120) and store the result in AX.',
    hints: ['Use MUL in a loop', 'Start AX=1, BX=1, multiply AX by BX, increment BX, loop until BX>5'],
    starterCode: '; Compute 5! = 120 in AX\n\nHLT',
    check: (r) => r.AX === 120,
  },
  {
    id: 'i2', title: 'Max of Three', difficulty: 'intermediate',
    description: 'Memory[0]=7, Memory[1]=12, Memory[2]=5. Find the maximum and store it in AX.',
    hints: ['LOAD each value, use CMP and conditional jumps', 'Compare pairs: if A<B then A=B'],
    initialMemory: (() => { const m = new Array(16).fill(0); m[0] = 7; m[1] = 12; m[2] = 5; return m; })(),
    starterCode: '; Find max of mem[0],mem[1],mem[2]\n; Store result in AX\n\nHLT',
    check: (r) => r.AX === 12,
  },
  {
    id: 'i3', title: 'Swap Registers', difficulty: 'intermediate',
    description: 'AX=10, BX=20. Swap them WITHOUT using a third register. Use XOR swap.',
    hints: ['XOR AX, BX three times swaps: AX^=BX; BX^=AX; AX^=BX', 'After swap: AX=20, BX=10'],
    initialRegisters: { AX: 10, BX: 20, CX: 0, DX: 0, SP: 15 },
    starterCode: '; Swap AX and BX using XOR\n; AX starts at 10, BX starts at 20\n\nHLT',
    check: (r) => r.AX === 20 && r.BX === 10,
  },
  // --- Advanced ---
  {
    id: 'a1', title: 'Bubble Sort', difficulty: 'advanced',
    description: 'Sort memory[0..3] = [4,2,3,1] in ascending order using bubble sort.',
    hints: [
      'Nested loop: outer for pass count, inner for comparisons',
      'LOAD two adjacent values, CMP, swap if needed, STORE back',
      'You need a "swapped" flag or fixed pass count',
    ],
    initialMemory: (() => { const m = new Array(16).fill(0); m[0] = 4; m[1] = 2; m[2] = 3; m[3] = 1; return m; })(),
    starterCode: '; Sort mem[0..3] ascending\n; Initial: 4, 2, 3, 1\n\nHLT',
    check: (_r, m) => m[0] === 1 && m[1] === 2 && m[2] === 3 && m[3] === 4,
  },
  {
    id: 'a2', title: 'Fibonacci(8)', difficulty: 'advanced',
    description: 'Compute the 8th Fibonacci number (fib(0)=0, fib(1)=1, ... fib(8)=21). Store result in AX.',
    hints: ['Keep two running values and a counter', 'Loop 8 times adding previous two values'],
    starterCode: '; Compute fib(8) = 21 in AX\n\nHLT',
    check: (r) => r.AX === 21,
  },
  {
    id: 'a3', title: 'Sum Array', difficulty: 'advanced',
    description: 'Memory[0..4] = [3,7,1,9,5]. Compute their sum and store it in AX. (Expected: 25)',
    hints: ['Use a counter in BX and LOAD mem[BX] in a loop', 'Accumulate in AX'],
    initialMemory: (() => { const m = new Array(16).fill(0); m[0] = 3; m[1] = 7; m[2] = 1; m[3] = 9; m[4] = 5; return m; })(),
    starterCode: '; Sum mem[0..4] into AX\n\nHLT',
    check: (r) => r.AX === 25,
  },
];

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export const CPUSimulator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timerRef = useRef<number>(0);

  /* --- Mode & tabs --- */
  const [activeTab, setActiveTab] = useState<'sandbox' | 'challenges'>('sandbox');

  /* --- CPU state --- */
  const [registers, setRegisters] = useState<Record<string, number>>({ AX: 0, BX: 0, CX: 0, DX: 0, SP: 15 });
  const [flags, setFlags] = useState({ zero: false, carry: false, negative: false, overflow: false });
  const [memory, setMemory] = useState<number[]>(new Array(16).fill(0));
  const [pc, setPc] = useState(0);
  const [stage, setStage] = useState<'fetch' | 'decode' | 'execute' | 'writeback'>('fetch');
  const [cycleCount, setCycleCount] = useState(0);

  /* --- Program --- */
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [running, setRunning] = useState(false);
  const [halted, setHalted] = useState(false);
  const [speed, setSpeed] = useState(1);

  /* --- Sandbox --- */
  const [codeText, setCodeText] = useState(SAMPLE_SNIPPETS[0].code);
  const [parseErrors, setParseErrors] = useState<ParseError[]>([]);
  const [showRef, setShowRef] = useState(false);

  /* --- Challenges --- */
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  const [challengeResults, setChallengeResults] = useState<Record<string, boolean>>({});
  const [showHint, setShowHint] = useState(false);
  const [challengeVerdict, setChallengeVerdict] = useState<'pass' | 'fail' | null>(null);

  /* --- Refs for execution closure --- */
  const stateRef = useRef({ registers, flags, memory, pc, instructions, halted });
  useEffect(() => {
    stateRef.current = { registers, flags, memory, pc, instructions, halted };
  }, [registers, flags, memory, pc, instructions, halted]);

  /* ---------------------------------------------------------------- */
  /*  Parser                                                           */
  /* ---------------------------------------------------------------- */

  const parseLine = (raw: string, lineNum: number): { instr: Instruction | null; error: ParseError | null } => {
    const line = raw.replace(/;.*$/, '').trim().toUpperCase();
    if (!line) return { instr: null, error: null };

    const parts = line.split(/[\s,]+/).filter(Boolean);
    const opcode = parts[0];

    if (!VALID_OPCODES.has(opcode)) {
      return { instr: null, error: { line: lineNum, message: `Unknown instruction: ${opcode}` } };
    }

    const noOperand = new Set(['NOP', 'HLT']);
    const singleOperand = new Set(['JMP', 'JE', 'JNE', 'JG', 'JL', 'PUSH', 'POP', 'NOT']);
    const dualOperand = new Set(['MOV', 'ADD', 'SUB', 'MUL', 'DIV', 'CMP', 'AND', 'OR', 'XOR', 'SHL', 'SHR', 'STORE', 'LOAD']);

    if (noOperand.has(opcode)) {
      return { instr: { opcode }, error: null };
    }
    if (singleOperand.has(opcode)) {
      if (parts.length < 2) return { instr: null, error: { line: lineNum, message: `${opcode} requires 1 operand` } };
      return { instr: { opcode, operand1: parts[1] }, error: null };
    }
    if (dualOperand.has(opcode)) {
      if (parts.length < 3) return { instr: null, error: { line: lineNum, message: `${opcode} requires 2 operands` } };
      return { instr: { opcode, operand1: parts[1], operand2: parts[2] }, error: null };
    }
    return { instr: null, error: { line: lineNum, message: `Parse error` } };
  };

  const parseAndLoad = useCallback(() => {
    const lines = codeText.split('\n');
    const parsed: Instruction[] = [];
    const errors: ParseError[] = [];
    lines.forEach((raw, i) => {
      const { instr, error } = parseLine(raw, i);
      if (error) errors.push(error);
      if (instr) parsed.push(instr);
    });
    setParseErrors(errors);
    if (errors.length === 0) {
      setInstructions(parsed);
      resetCPU();
    }
  }, [codeText]);

  /* ---------------------------------------------------------------- */
  /*  Reset                                                            */
  /* ---------------------------------------------------------------- */

  const resetCPU = useCallback((challenge?: Challenge) => {
    const initRegs = challenge?.initialRegisters
      ? { ...challenge.initialRegisters }
      : { AX: 0, BX: 0, CX: 0, DX: 0, SP: 15 };
    if (!initRegs.SP && initRegs.SP !== 0) initRegs.SP = 15;
    setRegisters(initRegs);
    setFlags({ zero: false, carry: false, negative: false, overflow: false });
    setMemory(challenge?.initialMemory ? [...challenge.initialMemory] : new Array(16).fill(0));
    setPc(0);
    setStage('fetch');
    setCycleCount(0);
    setRunning(false);
    setHalted(false);
    setChallengeVerdict(null);
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Execution                                                        */
  /* ---------------------------------------------------------------- */

  const getVal = (op: string | undefined, regs: Record<string, number>): number => {
    if (!op) return 0;
    if (REGISTERS.has(op)) return regs[op] ?? 0;
    return parseInt(op) || 0;
  };

  const executeStep = useCallback(() => {
    const s = stateRef.current;
    if (s.halted || s.pc >= s.instructions.length) {
      setRunning(false);
      setHalted(true);
      return;
    }

    const instr = s.instructions[s.pc];
    const r = { ...s.registers };
    const f = { ...s.flags };
    const m = [...s.memory];
    let nextPc = s.pc + 1;

    const v2 = () => getVal(instr.operand2, r);
    const v1 = () => getVal(instr.operand1, r);
    const isReg1 = instr.operand1 && REGISTERS.has(instr.operand1);

    const setArithFlags = (val: number) => {
      f.zero = val === 0;
      f.negative = val < 0;
      f.carry = val > 65535 || val < 0;
      f.overflow = val > 32767 || val < -32768;
    };

    switch (instr.opcode) {
      case 'MOV':
        if (isReg1) r[instr.operand1!] = v2();
        break;
      case 'ADD':
        if (isReg1) { r[instr.operand1!] += v2(); setArithFlags(r[instr.operand1!]); }
        break;
      case 'SUB':
        if (isReg1) { r[instr.operand1!] -= v2(); setArithFlags(r[instr.operand1!]); }
        break;
      case 'MUL':
        if (isReg1) { r[instr.operand1!] *= v2(); setArithFlags(r[instr.operand1!]); }
        break;
      case 'DIV':
        if (isReg1) {
          const dv = v2();
          if (dv === 0) { f.overflow = true; } else { r[instr.operand1!] = Math.trunc(r[instr.operand1!] / dv); setArithFlags(r[instr.operand1!]); }
        }
        break;
      case 'CMP': {
        const a = v1(), b = v2();
        f.zero = a === b;
        f.negative = a < b;
        f.carry = a > b;
        f.overflow = false;
        break;
      }
      case 'JMP': nextPc = parseInt(instr.operand1 || '0'); break;
      case 'JE':  if (f.zero) nextPc = parseInt(instr.operand1 || '0'); break;
      case 'JNE': if (!f.zero) nextPc = parseInt(instr.operand1 || '0'); break;
      case 'JG':  if (f.carry && !f.zero) nextPc = parseInt(instr.operand1 || '0'); break;
      case 'JL':  if (f.negative && !f.zero) nextPc = parseInt(instr.operand1 || '0'); break;
      case 'STORE': {
        const addr = parseInt(instr.operand1 || '0');
        if (addr >= 0 && addr < 16) m[addr] = getVal(instr.operand2, r);
        break;
      }
      case 'LOAD': {
        if (isReg1) {
          const addr = parseInt(instr.operand2 || '0');
          if (addr >= 0 && addr < 16) r[instr.operand1!] = m[addr];
        }
        break;
      }
      case 'PUSH': {
        const val = v1();
        if (r.SP > 0) { r.SP--; m[r.SP] = val; } else { f.overflow = true; }
        break;
      }
      case 'POP': {
        if (instr.operand1 && REGISTERS.has(instr.operand1)) {
          if (r.SP < 15) { r[instr.operand1] = m[r.SP]; m[r.SP] = 0; r.SP++; } else { f.overflow = true; }
        }
        break;
      }
      case 'AND': if (isReg1) { r[instr.operand1!] &= v2(); setArithFlags(r[instr.operand1!]); } break;
      case 'OR':  if (isReg1) { r[instr.operand1!] |= v2(); setArithFlags(r[instr.operand1!]); } break;
      case 'XOR': if (isReg1) { r[instr.operand1!] ^= v2(); setArithFlags(r[instr.operand1!]); } break;
      case 'NOT': if (isReg1) { r[instr.operand1!] = ~r[instr.operand1!]; setArithFlags(r[instr.operand1!]); } break;
      case 'SHL': if (isReg1) { r[instr.operand1!] <<= v2(); setArithFlags(r[instr.operand1!]); } break;
      case 'SHR': if (isReg1) { r[instr.operand1!] >>= v2(); setArithFlags(r[instr.operand1!]); } break;
      case 'NOP': break;
      case 'HLT':
        setRunning(false);
        setHalted(true);
        break;
    }

    setRegisters(r);
    setFlags(f);
    setMemory(m);
    setPc(nextPc);
    setCycleCount(c => c + 1);

    setStage('fetch');
    setTimeout(() => setStage('decode'), 80 / speed);
    setTimeout(() => setStage('execute'), 160 / speed);
    setTimeout(() => setStage('writeback'), 240 / speed);
  }, [speed]);

  /* --- Auto-run timer --- */
  useEffect(() => {
    if (running) {
      timerRef.current = window.setInterval(() => {
        const s = stateRef.current;
        if (s.halted || s.pc >= s.instructions.length) {
          setRunning(false);
          setHalted(true);
          clearInterval(timerRef.current);
          return;
        }
        executeStep();
      }, 700 / speed);
      return () => clearInterval(timerRef.current);
    }
  }, [running, speed, executeStep]);

  /* --- Check challenge when halted --- */
  useEffect(() => {
    if (halted && selectedChallenge && activeTab === 'challenges') {
      const ch = CHALLENGES.find(c => c.id === selectedChallenge);
      if (ch) {
        const stack = memory.slice(registers.SP, 16);
        const pass = ch.check(registers, memory, stack);
        setChallengeVerdict(pass ? 'pass' : 'fail');
        if (pass) setChallengeResults(prev => ({ ...prev, [ch.id]: true }));
      }
    }
  }, [halted]);

  /* ---------------------------------------------------------------- */
  /*  Canvas Drawing                                                   */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    const obs = new ResizeObserver(resize);
    obs.observe(canvas);

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width, h = rect.height;
      ctx.clearRect(0, 0, w, h);

      const isDark = document.documentElement.classList.contains('dark');

      /* -- palette -- */
      const bg = isDark ? '#080c18' : '#f8f9fc';
      const panelBg = isDark ? 'rgba(30,35,60,0.45)' : 'rgba(220,225,240,0.6)';
      const panelBorder = isDark ? 'rgba(60,70,100,0.35)' : 'rgba(180,185,200,0.6)';
      const textPrimary = isDark ? 'rgba(200,200,255,0.85)' : 'rgba(30,30,60,0.9)';
      const textSecondary = isDark ? 'rgba(150,150,200,0.55)' : 'rgba(80,80,120,0.6)';
      const textMuted = isDark ? 'rgba(100,130,200,0.45)' : 'rgba(120,120,160,0.45)';
      const pcHighlight = isDark ? 'rgba(100,160,255,0.2)' : 'rgba(70,130,255,0.12)';
      const pcArrowColor = isDark ? '#4ade80' : '#16a34a';
      const activeCellBg = isDark ? 'rgba(100,220,128,0.2)' : 'rgba(40,180,90,0.12)';
      const activeCellText = isDark ? 'rgba(100,220,128,0.8)' : 'rgba(20,140,60,0.85)';
      const flagOnBg = isDark ? 'rgba(100,220,128,0.7)' : 'rgba(40,180,90,0.65)';
      const flagOffBg = isDark ? 'rgba(80,80,100,0.4)' : 'rgba(190,195,210,0.6)';
      const flagOnText = '#fff';
      const flagOffText = isDark ? 'rgba(150,150,200,0.5)' : 'rgba(100,100,130,0.6)';
      const regLabelColor = isDark ? 'rgba(100,180,255,0.7)' : 'rgba(40,100,200,0.75)';

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      /* ========== Pipeline ========== */
      const stages = ['fetch', 'decode', 'execute', 'writeback'] as const;
      const stageLabels = ['FETCH', 'DECODE', 'EXECUTE', 'WRITE BACK'];
      const stageColors = ['#4090ff', '#a060ff', '#ff6040', '#40c060'];
      const pipeY = 16, pipeH = 34;
      const stageW = (w - 32) / 4;

      stages.forEach((s, i) => {
        const sx = 16 + i * stageW;
        const active = stage === s;
        ctx.fillStyle = active ? stageColors[i] + (isDark ? '28' : '18') : panelBg;
        ctx.fillRect(sx + 1, pipeY, stageW - 2, pipeH);
        ctx.strokeStyle = active ? stageColors[i] : panelBorder;
        ctx.lineWidth = active ? 2 : 0.5;
        ctx.strokeRect(sx + 1, pipeY, stageW - 2, pipeH);
        ctx.fillStyle = active ? stageColors[i] : textSecondary;
        ctx.font = `${active ? 'bold ' : ''}9px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(stageLabels[i], sx + stageW / 2, pipeY + 14);
        if (active && pc < instructions.length) {
          ctx.font = '8px monospace';
          ctx.fillStyle = textMuted;
          ctx.fillText(instructions[pc]?.opcode || '', sx + stageW / 2, pipeY + 27);
        }
        if (i < 3) {
          ctx.fillStyle = isDark ? 'rgba(100,130,200,0.3)' : 'rgba(120,140,200,0.35)';
          const ax = sx + stageW;
          ctx.beginPath();
          ctx.moveTo(ax - 4, pipeY + 13);
          ctx.lineTo(ax + 4, pipeY + 17);
          ctx.lineTo(ax - 4, pipeY + 21);
          ctx.closePath();
          ctx.fill();
        }
      });

      /* ========== Instructions List ========== */
      const instY = pipeY + pipeH + 18;
      ctx.fillStyle = textPrimary;
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Program Instructions', 14, instY);

      const instColW = Math.min(w * 0.55, w - 200);
      const maxVisibleInstructions = Math.floor((h - instY - 20) / 17);
      instructions.forEach((inst, i) => {
        if (i >= maxVisibleInstructions) return;
        const iy = instY + 14 + i * 17;
        const isPC = i === pc;
        ctx.fillStyle = isPC ? pcHighlight : (i % 2 === 0 ? 'transparent' : (isDark ? 'rgba(20,25,40,0.2)' : 'rgba(200,205,220,0.3)'));
        ctx.fillRect(14, iy - 10, instColW, 15);
        if (isPC) {
          ctx.fillStyle = pcArrowColor;
          ctx.font = '9px sans-serif';
          ctx.fillText('\u2192', 17, iy + 1);
        }
        ctx.fillStyle = textMuted;
        ctx.font = '8px monospace';
        ctx.fillText(`${i.toString().padStart(2, '0')}:`, 28, iy + 1);
        ctx.fillStyle = isPC ? textPrimary : textSecondary;
        ctx.font = '9px monospace';
        const instStr = `${inst.opcode}${inst.operand1 ? ' ' + inst.operand1 : ''}${inst.operand2 ? ', ' + inst.operand2 : ''}`;
        ctx.fillText(instStr, 50, iy + 1);
      });

      /* ========== Registers ========== */
      const regX = Math.max(w * 0.58, w - 180);
      const regW = w - regX - 12;
      ctx.fillStyle = textPrimary;
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Registers', regX, instY);

      const regNames = ['AX', 'BX', 'CX', 'DX', 'SP'];
      regNames.forEach((name, i) => {
        const ry = instY + 14 + i * 21;
        ctx.fillStyle = panelBg;
        ctx.fillRect(regX, ry - 10, regW, 17);
        ctx.strokeStyle = panelBorder;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(regX, ry - 10, regW, 17);
        ctx.fillStyle = regLabelColor;
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(name, regX + 5, ry + 2);
        ctx.fillStyle = textPrimary;
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        ctx.fillText((registers[name] ?? 0).toString(), regX + regW - 5, ry + 2);
        ctx.textAlign = 'left';
      });

      /* ========== Flags ========== */
      const flagY = instY + 14 + 5 * 21 + 8;
      ctx.fillStyle = textSecondary;
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('Flags', regX, flagY);

      const flagEntries: [string, boolean][] = [['Z', flags.zero], ['C', flags.carry], ['N', flags.negative], ['O', flags.overflow]];
      const flagCellW = Math.min(28, (regW - 6) / 4);
      flagEntries.forEach(([name, val], i) => {
        const fx = regX + i * (flagCellW + 3);
        ctx.fillStyle = val ? flagOnBg : flagOffBg;
        ctx.fillRect(fx, flagY + 6, flagCellW, 16);
        ctx.fillStyle = val ? flagOnText : flagOffText;
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(name, fx + flagCellW / 2, flagY + 17);
        ctx.textAlign = 'left';
      });

      /* ========== Memory ========== */
      const memY = flagY + 34;
      ctx.fillStyle = textSecondary;
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('Memory', regX, memY);

      const memCols = 4;
      const memCellW = Math.min(30, (regW - 4) / memCols);
      for (let i = 0; i < 16; i++) {
        const col = i % memCols;
        const row = Math.floor(i / memCols);
        const mx = regX + col * (memCellW + 2);
        const my = memY + 8 + row * 17;
        if (my + 14 > h - 10) continue;
        const val = memory[i];
        const isStack = i >= registers.SP && i <= 15;
        ctx.fillStyle = val !== 0 ? activeCellBg : panelBg;
        if (isStack && isDark) ctx.fillStyle = 'rgba(160,100,255,0.15)';
        if (isStack && !isDark) ctx.fillStyle = 'rgba(140,80,220,0.1)';
        ctx.fillRect(mx, my, memCellW, 14);
        ctx.fillStyle = textMuted;
        ctx.font = '6px monospace';
        ctx.fillText(`${i}`, mx + 1, my + 5);
        ctx.fillStyle = val !== 0 ? activeCellText : textSecondary;
        ctx.font = '8px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(val.toString(), mx + memCellW - 2, my + 12);
        ctx.textAlign = 'left';
      }

      /* ========== Stack label ========== */
      const stackLabelY = memY + 8 + 4 * 17 + 8;
      if (stackLabelY < h - 8) {
        ctx.fillStyle = isDark ? 'rgba(160,100,255,0.5)' : 'rgba(120,70,200,0.5)';
        ctx.font = '8px sans-serif';
        ctx.fillText(`Stack (SP=${registers.SP})`, regX, stackLabelY);
      }

      /* ========== Cycle counter ========== */
      ctx.fillStyle = textSecondary;
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`Cycles: ${cycleCount}`, w - 10, h - 6);
      if (halted) {
        ctx.fillStyle = isDark ? 'rgba(255,100,80,0.7)' : 'rgba(200,50,30,0.7)';
        ctx.fillText('HALTED', w - 70, h - 6);
      }
      ctx.textAlign = 'left';

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animRef.current); obs.disconnect(); };
  }, [pc, stage, registers, flags, memory, instructions, cycleCount, halted]);

  /* ---------------------------------------------------------------- */
  /*  Challenge helpers                                                */
  /* ---------------------------------------------------------------- */

  const loadChallenge = useCallback((ch: Challenge) => {
    setSelectedChallenge(ch.id);
    setCodeText(ch.starterCode || 'HLT');
    setShowHint(false);
    setChallengeVerdict(null);
    setInstructions([]);
    resetCPU(ch);
  }, [resetCPU]);

  const runChallenge = useCallback(() => {
    const ch = CHALLENGES.find(c => c.id === selectedChallenge);
    if (!ch) return;
    const lines = codeText.split('\n');
    const parsed: Instruction[] = [];
    const errors: ParseError[] = [];
    lines.forEach((raw, i) => {
      const { instr, error } = parseLine(raw, i);
      if (error) errors.push(error);
      if (instr) parsed.push(instr);
    });
    setParseErrors(errors);
    if (errors.length > 0) return;
    setInstructions(parsed);
    resetCPU(ch);
    setChallengeVerdict(null);
    setTimeout(() => setRunning(true), 50);
  }, [codeText, selectedChallenge, resetCPU]);

  /* ---------------------------------------------------------------- */
  /*  Difficulty grouping                                              */
  /* ---------------------------------------------------------------- */

  const grouped = {
    beginner: CHALLENGES.filter(c => c.difficulty === 'beginner'),
    intermediate: CHALLENGES.filter(c => c.difficulty === 'intermediate'),
    advanced: CHALLENGES.filter(c => c.difficulty === 'advanced'),
  };

  const difficultyColors: Record<string, string> = {
    beginner: 'text-green-600 dark:text-green-400',
    intermediate: 'text-yellow-600 dark:text-yellow-400',
    advanced: 'text-red-600 dark:text-red-400',
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  const currentChallenge = CHALLENGES.find(c => c.id === selectedChallenge);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-100 to-blue-100 dark:from-gray-950 dark:to-blue-950 p-3 overflow-hidden">
      {/* Header */}
      <div className="mb-2 flex-shrink-0">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">CPU Instruction Simulator</h2>
        <p className="text-[11px] text-gray-500 dark:text-gray-400">Assembly sandbox with pipeline visualization</p>
      </div>

      <div className="flex-1 flex gap-3 min-h-0">
        {/* ===== Left: Canvas ===== */}
        <div className="flex-1 min-w-0 min-h-0 rounded-lg border border-gray-300 dark:border-gray-800 overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>

        {/* ===== Right: Panel ===== */}
        <div className="w-[220px] flex flex-col gap-2 flex-shrink-0 overflow-hidden">
          {/* Tabs */}
          <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0">
            <button
              onClick={() => setActiveTab('sandbox')}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-semibold transition-colors ${
                activeTab === 'sandbox'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Code className="h-3 w-3" /> Sandbox
            </button>
            <button
              onClick={() => setActiveTab('challenges')}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-semibold transition-colors ${
                activeTab === 'challenges'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Trophy className="h-3 w-3" /> Challenges
            </button>
          </div>

          {/* Controls */}
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={() => {
                if (running) { setRunning(false); }
                else if (halted) { /* do nothing */ }
                else { setRunning(true); }
              }}
              disabled={halted && !running}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] font-medium transition-colors disabled:opacity-30 ${
                running ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white'
              }`}
            >
              {running ? <><Pause className="h-3 w-3" />Pause</> : <><Play className="h-3 w-3" />Run</>}
            </button>
            <button
              onClick={executeStep}
              disabled={running || halted}
              className="px-2 py-1.5 rounded bg-green-700 text-white text-[10px] disabled:opacity-30"
              title="Step"
            >
              <StepForward className="h-3 w-3" />
            </button>
            <button
              onClick={() => {
                if (activeTab === 'challenges' && currentChallenge) {
                  resetCPU(currentChallenge);
                  if (instructions.length > 0) setPc(0);
                } else {
                  resetCPU();
                  if (instructions.length > 0) setPc(0);
                }
              }}
              className="px-2 py-1.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white text-[10px]"
              title="Reset"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>

          {/* Speed */}
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 flex-shrink-0">
            <label className="text-[10px] text-gray-500 dark:text-gray-400 flex justify-between">
              <span>Speed</span><span>{speed}x</span>
            </label>
            <input
              type="range" min={0.5} max={4} step={0.5} value={speed}
              onChange={e => setSpeed(+e.target.value)}
              className="w-full h-1 accent-blue-500"
            />
          </div>

          {/* Scrollable mode content */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
            {/* ========================================= */}
            {/* SANDBOX MODE                              */}
            {/* ========================================= */}
            {activeTab === 'sandbox' && (
              <>
                {/* Textarea with line numbers */}
                <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                  <div className="flex">
                    {/* Line numbers gutter */}
                    <div className="bg-gray-50 dark:bg-gray-950 text-gray-400 dark:text-gray-600 text-[9px] font-mono select-none py-1.5 px-1 text-right leading-[16px] min-w-[22px] border-r border-gray-200 dark:border-gray-800">
                      {codeText.split('\n').map((_, i) => (
                        <div key={i} className={parseErrors.some(e => e.line === i) ? 'text-red-500' : ''}>
                          {i}
                        </div>
                      ))}
                    </div>
                    <textarea
                      value={codeText}
                      onChange={e => setCodeText(e.target.value)}
                      spellCheck={false}
                      className="flex-1 bg-transparent text-[10px] font-mono text-gray-800 dark:text-gray-200 p-1.5 leading-[16px] resize-none focus:outline-none min-h-[120px]"
                      style={{ tabSize: 4 }}
                    />
                  </div>
                </div>

                {/* Parse errors */}
                {parseErrors.length > 0 && (
                  <div className="text-[9px] text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 rounded px-2 py-1 space-y-0.5">
                    {parseErrors.map((e, i) => (
                      <div key={i}>Line {e.line}: {e.message}</div>
                    ))}
                  </div>
                )}

                {/* Parse & Load button */}
                <button
                  onClick={parseAndLoad}
                  className="w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-indigo-600 text-white text-[10px] font-medium hover:bg-indigo-700 transition-colors"
                >
                  <ChevronRight className="h-3 w-3" /> Parse & Load
                </button>

                {/* Sample snippets */}
                <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-2">
                  <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center gap-1">
                    <BookOpen className="h-3 w-3" /> Snippets
                  </h4>
                  <div className="space-y-0.5">
                    {SAMPLE_SNIPPETS.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => { setCodeText(s.code); setParseErrors([]); }}
                        className="block w-full text-left px-2 py-1 rounded text-[10px] bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Instruction Reference toggle */}
                <button
                  onClick={() => setShowRef(!showRef)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded border border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-950/30 text-[10px] font-semibold text-blue-700 dark:text-blue-300"
                >
                  <span className="flex items-center gap-1"><Info className="h-3 w-3" /> Instruction Reference</span>
                  <ChevronRight className={`h-3 w-3 transition-transform ${showRef ? 'rotate-90' : ''}`} />
                </button>

                {showRef && (
                  <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-2 max-h-[220px] overflow-y-auto">
                    <table className="w-full text-[8px]">
                      <thead>
                        <tr className="text-gray-500 dark:text-gray-400">
                          <th className="text-left pb-1 font-semibold">Op</th>
                          <th className="text-left pb-1 font-semibold">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {INSTRUCTION_REF.map((ref, i) => (
                          <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                            <td className="py-0.5 font-mono text-blue-600 dark:text-blue-400 whitespace-nowrap pr-2">{ref.syntax}</td>
                            <td className="py-0.5 text-gray-600 dark:text-gray-400">{ref.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* ========================================= */}
            {/* CHALLENGES MODE                           */}
            {/* ========================================= */}
            {activeTab === 'challenges' && !selectedChallenge && (
              <>
                {(['beginner', 'intermediate', 'advanced'] as const).map(diff => (
                  <div key={diff} className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-2">
                    <h4 className={`text-[10px] font-bold uppercase mb-1 ${difficultyColors[diff]}`}>
                      {diff}
                    </h4>
                    <div className="space-y-0.5">
                      {grouped[diff].map(ch => (
                        <button
                          key={ch.id}
                          onClick={() => loadChallenge(ch)}
                          className="w-full flex items-center justify-between px-2 py-1.5 rounded text-[10px] bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                        >
                          <span className="flex items-center gap-1">
                            {challengeResults[ch.id]
                              ? <Check className="h-3 w-3 text-green-500" />
                              : <ChevronRight className="h-3 w-3 text-gray-400" />
                            }
                            {ch.title}
                          </span>
                          {challengeResults[ch.id] && (
                            <span className="text-[8px] text-green-500 font-semibold">PASSED</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}

            {activeTab === 'challenges' && selectedChallenge && currentChallenge && (
              <>
                {/* Back button */}
                <button
                  onClick={() => { setSelectedChallenge(null); setChallengeVerdict(null); setInstructions([]); resetCPU(); }}
                  className="w-full text-left px-2 py-1 text-[10px] text-blue-600 dark:text-blue-400 hover:underline"
                >
                  &larr; Back to challenges
                </button>

                {/* Challenge info */}
                <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-2.5">
                  <h4 className={`text-[11px] font-bold mb-0.5 ${difficultyColors[currentChallenge.difficulty]}`}>
                    {currentChallenge.title}
                  </h4>
                  <span className="text-[8px] uppercase font-semibold text-gray-400 dark:text-gray-500">
                    {currentChallenge.difficulty}
                  </span>
                  <p className="text-[10px] text-gray-600 dark:text-gray-400 mt-1 leading-snug">
                    {currentChallenge.description}
                  </p>
                </div>

                {/* Verdict banner */}
                {challengeVerdict && (
                  <div className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[11px] font-semibold ${
                    challengeVerdict === 'pass'
                      ? 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300'
                      : 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300'
                  }`}>
                    {challengeVerdict === 'pass'
                      ? <><Check className="h-4 w-4" /> Challenge Passed!</>
                      : <><X className="h-4 w-4" /> Not quite right. Try again.</>
                    }
                  </div>
                )}

                {/* Code editor */}
                <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                  <div className="flex">
                    <div className="bg-gray-50 dark:bg-gray-950 text-gray-400 dark:text-gray-600 text-[9px] font-mono select-none py-1.5 px-1 text-right leading-[16px] min-w-[22px] border-r border-gray-200 dark:border-gray-800">
                      {codeText.split('\n').map((_, i) => (
                        <div key={i} className={parseErrors.some(e => e.line === i) ? 'text-red-500' : ''}>
                          {i}
                        </div>
                      ))}
                    </div>
                    <textarea
                      value={codeText}
                      onChange={e => setCodeText(e.target.value)}
                      spellCheck={false}
                      className="flex-1 bg-transparent text-[10px] font-mono text-gray-800 dark:text-gray-200 p-1.5 leading-[16px] resize-none focus:outline-none min-h-[100px]"
                      style={{ tabSize: 4 }}
                    />
                  </div>
                </div>

                {/* Parse errors */}
                {parseErrors.length > 0 && (
                  <div className="text-[9px] text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 rounded px-2 py-1 space-y-0.5">
                    {parseErrors.map((e, i) => (
                      <div key={i}>Line {e.line}: {e.message}</div>
                    ))}
                  </div>
                )}

                {/* Run challenge */}
                <button
                  onClick={runChallenge}
                  className="w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-indigo-600 text-white text-[10px] font-medium hover:bg-indigo-700 transition-colors"
                >
                  <Play className="h-3 w-3" /> Run & Check
                </button>

                {/* Hint toggle */}
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded border border-yellow-200 dark:border-yellow-800/40 bg-yellow-50 dark:bg-yellow-950/20 text-[10px] font-semibold text-yellow-700 dark:text-yellow-300"
                >
                  <span className="flex items-center gap-1"><Lightbulb className="h-3 w-3" /> Hints</span>
                  <ChevronRight className={`h-3 w-3 transition-transform ${showHint ? 'rotate-90' : ''}`} />
                </button>

                {showHint && (
                  <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800/30 rounded-lg p-2 space-y-1">
                    {currentChallenge.hints.map((hint, i) => (
                      <div key={i} className="text-[9px] text-yellow-800 dark:text-yellow-300 flex gap-1">
                        <Lightbulb className="h-3 w-3 flex-shrink-0 mt-px" />
                        <span>{hint}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
