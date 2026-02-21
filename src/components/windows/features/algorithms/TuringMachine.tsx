import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, StepForward, Info, Plus, Trash2, Save, Upload, Code } from 'lucide-react';

type MoveDir = 'L' | 'R';
interface Rule { write: string; move: MoveDir; nextState: string }
type TransitionTable = Record<string, Record<string, Rule>>;

interface ProgramDef {
  name: string;
  description: string;
  setup: string[];
  startPos: number;
  transitions: TransitionTable;
}

interface CustomMachine {
  name: string;
  tape: string[];
  headPos: number;
  states: string[];
  transitions: TransitionTable;
}

const TAPE_LEN = 31;
const BLANK = '_';
const HALT_STATE = 'qH';

const makeTape = (fill = BLANK): string[] => new Array(TAPE_LEN).fill(fill);

const PROGRAMS: ProgramDef[] = [
  {
    name: 'Binary Increment',
    description: 'Adds 1 to a binary number on the tape',
    setup: (() => { const t = makeTape(); t[13] = '1'; t[14] = '0'; t[15] = '1'; t[16] = '1'; return t; })(),
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
    setup: (() => { const t = makeTape(); 'abba'.split('').forEach((c, i) => t[14 + i] = c); return t; })(),
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
    description: 'Doubles a unary number (count of 1s)',
    setup: (() => { const t = makeTape(); for (let i = 14; i <= 16; i++) t[i] = '1'; return t; })(),
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
  {
    name: 'Binary to Unary',
    description: 'Converts a binary number to unary (1s)',
    setup: (() => { const t = makeTape(); t[14] = '1'; t[15] = '0'; t[16] = '1'; return t; })(),
    startPos: 14,
    transitions: {
      q0: { '0': { write: '0', move: 'R', nextState: 'q0' }, '1': { write: '1', move: 'R', nextState: 'q0' }, '_': { write: '_', move: 'L', nextState: 'q1' } },
      q1: {
        '0': { write: '_', move: 'L', nextState: 'q1' },
        '1': { write: '_', move: 'R', nextState: 'q2' },
        '_': { write: '_', move: 'R', nextState: 'qClean' },
      },
      q2: { '_': { write: '_', move: 'R', nextState: 'q3' }, '1': { write: '1', move: 'R', nextState: 'q2' } },
      q3: { '1': { write: '1', move: 'R', nextState: 'q3' }, '_': { write: '1', move: 'L', nextState: 'q4' } },
      q4: { '1': { write: '1', move: 'L', nextState: 'q4' }, '_': { write: '_', move: 'L', nextState: 'q5' } },
      q5: {
        '0': { write: '0', move: 'L', nextState: 'q5' },
        '1': { write: '1', move: 'L', nextState: 'q5' },
        '_': { write: '_', move: 'R', nextState: 'qDbl' },
      },
      qDbl: { '0': { write: '_', move: 'R', nextState: 'qD2' }, '1': { write: '_', move: 'R', nextState: 'qD3' }, '_': { write: '_', move: 'R', nextState: 'qClean' } },
      qD2: {
        '0': { write: '0', move: 'R', nextState: 'qD2' },
        '1': { write: '1', move: 'R', nextState: 'qD2' },
        '_': { write: '_', move: 'R', nextState: 'qSkip' },
      },
      qSkip: { '1': { write: '1', move: 'R', nextState: 'qSkip' }, '_': { write: '_', move: 'L', nextState: 'qBack' } },
      qBack: {
        '1': { write: '1', move: 'L', nextState: 'qBack' },
        '_': { write: '_', move: 'L', nextState: 'qB2' },
      },
      qB2: {
        '0': { write: '0', move: 'L', nextState: 'qB2' },
        '1': { write: '1', move: 'L', nextState: 'qB2' },
        '_': { write: '_', move: 'R', nextState: 'qDbl' },
      },
      qD3: {
        '0': { write: '0', move: 'R', nextState: 'qD3' },
        '1': { write: '1', move: 'R', nextState: 'qD3' },
        '_': { write: '_', move: 'R', nextState: 'qAdd' },
      },
      qAdd: { '1': { write: '1', move: 'R', nextState: 'qAdd' }, '_': { write: '1', move: 'L', nextState: 'qBack' } },
      qClean: { '_': { write: '_', move: 'R', nextState: 'qH' }, '1': { write: '1', move: 'R', nextState: 'qClean' } },
    },
  },
  {
    name: 'Simple Adder (unary)',
    description: 'Adds two unary numbers separated by 0',
    setup: (() => { const t = makeTape(); t[13] = '1'; t[14] = '1'; t[15] = '1'; t[16] = '0'; t[17] = '1'; t[18] = '1'; return t; })(),
    startPos: 13,
    transitions: {
      q0: { '1': { write: '1', move: 'R', nextState: 'q0' }, '0': { write: '1', move: 'R', nextState: 'q1' } },
      q1: { '1': { write: '1', move: 'R', nextState: 'q1' }, '_': { write: '_', move: 'L', nextState: 'q2' } },
      q2: { '1': { write: '_', move: 'L', nextState: 'q3' } },
      q3: { '1': { write: '1', move: 'L', nextState: 'q3' }, '_': { write: '_', move: 'R', nextState: 'qH' } },
    },
  },
];

const CUSTOM_TEMPLATES: { name: string; machine: CustomMachine }[] = [
  {
    name: 'Blank Machine',
    machine: {
      name: 'Blank Machine',
      tape: makeTape(),
      headPos: 15,
      states: ['q0', 'q1', 'qH'],
      transitions: {},
    },
  },
  {
    name: 'Simple Right Mover',
    machine: {
      name: 'Simple Right Mover',
      tape: (() => { const t = makeTape(); t[15] = 'A'; return t; })(),
      headPos: 15,
      states: ['q0', 'qH'],
      transitions: {
        q0: {
          'A': { write: 'B', move: 'R', nextState: 'q0' },
          '_': { write: '_', move: 'L', nextState: 'qH' },
        },
      },
    },
  },
  {
    name: 'Ones Writer',
    machine: {
      name: 'Ones Writer',
      tape: makeTape(),
      headPos: 10,
      states: ['q0', 'q1', 'qH'],
      transitions: {
        q0: { '_': { write: '1', move: 'R', nextState: 'q0' }, '1': { write: '1', move: 'L', nextState: 'q1' } },
        q1: { '1': { write: '1', move: 'L', nextState: 'q1' }, '_': { write: '_', move: 'R', nextState: 'qH' } },
      },
    },
  },
];

const STORAGE_KEY = 'turing-machine-saved';

function loadSavedMachines(): CustomMachine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CustomMachine[];
  } catch { return []; }
}

function saveMachines(machines: CustomMachine[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(machines));
}

function collectAllStates(t: TransitionTable): string[] {
  const s = new Set<string>();
  for (const st of Object.keys(t)) {
    s.add(st);
    for (const rule of Object.values(t[st])) s.add(rule.nextState);
  }
  return Array.from(s).sort();
}

export const TuringMachine: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timerRef = useRef<number>(0);

  const [mode, setMode] = useState<'programs' | 'custom'>('programs');
  const [tape, setTape] = useState<string[]>([...PROGRAMS[0].setup]);
  const [headPos, setHeadPos] = useState(PROGRAMS[0].startPos);
  const [currentState, setCurrentState] = useState('q0');
  const [running, setRunning] = useState(false);
  const [halted, setHalted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [steps, setSteps] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [selectedProgram, setSelectedProgram] = useState(0);

  // Custom mode state
  const [customStates, setCustomStates] = useState<string[]>(['q0', 'q1', 'qH']);
  const [customTransitions, setCustomTransitions] = useState<TransitionTable>({});
  const [newStateName, setNewStateName] = useState('');
  const [customTapeInput, setCustomTapeInput] = useState('');
  const [customHeadInput, setCustomHeadInput] = useState('15');
  const [savedMachines, setSavedMachines] = useState<CustomMachine[]>(loadSavedMachines());
  const [saveName, setSaveName] = useState('');
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);

  // New rule editor state
  const [ruleState, setRuleState] = useState('q0');
  const [ruleRead, setRuleRead] = useState('_');
  const [ruleWrite, setRuleWrite] = useState('_');
  const [ruleMove, setRuleMove] = useState<MoveDir>('R');
  const [ruleNext, setRuleNext] = useState('q0');

  const activeTransitions = useCallback((): TransitionTable => {
    return mode === 'programs' ? PROGRAMS[selectedProgram].transitions : customTransitions;
  }, [mode, selectedProgram, customTransitions]);

  const resetMachine = useCallback(() => {
    if (mode === 'programs') {
      const prog = PROGRAMS[selectedProgram];
      setTape([...prog.setup]);
      setHeadPos(prog.startPos);
    } else {
      const parsed = customTapeInput.trim();
      if (parsed.length > 0) {
        const t = makeTape();
        const chars = parsed.split('');
        const offset = Math.max(0, Math.floor((TAPE_LEN - chars.length) / 2));
        chars.forEach((c, i) => { if (offset + i < TAPE_LEN) t[offset + i] = c.length === 1 ? c : '_'; });
        setTape(t);
      } else {
        setTape(makeTape());
      }
      const hp = parseInt(customHeadInput, 10);
      setHeadPos(isNaN(hp) ? 15 : Math.max(0, Math.min(TAPE_LEN - 1, hp)));
    }
    setCurrentState('q0');
    setHalted(false);
    setSteps(0);
    setRunning(false);
    setHistory([]);
  }, [mode, selectedProgram, customTapeInput, customHeadInput]);

  useEffect(() => { resetMachine(); }, [selectedProgram, mode]);

  const executeStep = useCallback(() => {
    if (halted || currentState === HALT_STATE) {
      setHalted(true);
      setRunning(false);
      return;
    }
    const trans = activeTransitions();
    const symbol = tape[headPos] || BLANK;
    const rule = trans[currentState]?.[symbol];
    if (!rule) {
      setHalted(true);
      setRunning(false);
      setHistory(h => [...h.slice(-9), `No rule for (${currentState}, ${symbol}) - HALT`]);
      return;
    }

    const newTape = [...tape];
    newTape[headPos] = rule.write;
    const newPos = Math.max(0, Math.min(TAPE_LEN - 1, headPos + (rule.move === 'R' ? 1 : -1)));

    setHistory(h => [...h.slice(-9), `(${currentState},${symbol}) -> (${rule.nextState},${rule.write},${rule.move})`]);
    setTape(newTape);
    setHeadPos(newPos);
    setCurrentState(rule.nextState);
    setSteps(s => s + 1);

    if (rule.nextState === HALT_STATE) {
      setHalted(true);
      setRunning(false);
    }
  }, [tape, headPos, currentState, halted, activeTransitions]);

  useEffect(() => {
    if (running) {
      timerRef.current = window.setInterval(executeStep, 600 / speed);
      return () => clearInterval(timerRef.current);
    }
  }, [running, executeStep, speed]);

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const d = window.devicePixelRatio || 1;
      canvas.width = r.width * d;
      canvas.height = r.height * d;
      ctx.scale(d, d);
    };
    resize();
    const obs = new ResizeObserver(resize);
    obs.observe(canvas);

    const draw = () => {
      const r = canvas.getBoundingClientRect();
      const w = r.width;
      const h = r.height;
      const isDark = document.documentElement.classList.contains('dark');

      // Colors
      const bg = isDark ? '#080c18' : '#f8f9fc';
      const textPrimary = isDark ? 'rgba(220,225,255,0.9)' : 'rgba(30,30,60,0.9)';
      const textSecondary = isDark ? 'rgba(160,165,200,0.6)' : 'rgba(80,80,120,0.6)';
      const textMuted = isDark ? 'rgba(100,105,140,0.4)' : 'rgba(140,140,170,0.5)';
      const accentBlue = isDark ? 'rgba(100,160,255,' : 'rgba(40,100,220,';
      const headColor = isDark ? '#4ade80' : '#16a34a';
      const cellBorder = isDark ? 'rgba(60,70,100,0.3)' : 'rgba(160,170,200,0.4)';
      const cellBg = isDark ? 'rgba(30,35,60,0.3)' : 'rgba(230,235,245,0.6)';
      const cellFilledBg = isDark ? 'rgba(60,80,120,0.2)' : 'rgba(200,210,230,0.5)';
      const headCellBg = isDark ? 'rgba(100,160,255,0.3)' : 'rgba(40,100,220,0.15)';
      const headCellBorder = isDark ? 'rgba(100,160,255,0.8)' : 'rgba(40,100,220,0.6)';
      const haltBg = isDark ? 'rgba(255,100,100,0.3)' : 'rgba(220,50,50,0.12)';
      const haltBorder = isDark ? 'rgba(255,100,100,0.6)' : 'rgba(220,50,50,0.5)';
      const haltText = isDark ? '#ff6060' : '#dc2626';
      const stateBg = isDark ? 'rgba(100,160,255,0.2)' : 'rgba(40,100,220,0.1)';
      const stateBorder = isDark ? 'rgba(100,160,255,0.5)' : 'rgba(40,100,220,0.4)';
      const stateText = isDark ? '#80c0ff' : '#2563eb';
      const ruleActiveBg = isDark ? 'rgba(100,220,128,0.15)' : 'rgba(34,197,94,0.12)';
      const ruleActiveText = isDark ? 'rgba(100,220,128,0.8)' : 'rgba(22,163,74,0.9)';
      const ruleInactiveBg = isDark ? 'rgba(20,25,40,0.3)' : 'rgba(230,235,245,0.5)';
      const ruleInactiveText = isDark ? 'rgba(150,150,200,0.5)' : 'rgba(100,100,150,0.6)';
      const logText = isDark ? 'rgba(100,160,255,0.5)' : 'rgba(40,100,220,0.5)';
      const stateNodeBg = isDark ? 'rgba(50,60,90,0.4)' : 'rgba(210,220,240,0.6)';
      const stateNodeBorder = isDark ? 'rgba(80,100,160,0.5)' : 'rgba(120,140,200,0.5)';
      const stateNodeActive = isDark ? 'rgba(100,200,150,0.7)' : 'rgba(22,163,74,0.6)';

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      const trans = activeTransitions();
      const progName = mode === 'programs' ? PROGRAMS[selectedProgram].name : 'Custom Machine';
      const progDesc = mode === 'programs' ? PROGRAMS[selectedProgram].description : 'User-defined Turing Machine';

      // Title
      ctx.fillStyle = textPrimary;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(progName, w / 2, 18);
      ctx.fillStyle = textSecondary;
      ctx.font = '9px sans-serif';
      ctx.fillText(progDesc, w / 2, 32);

      // Tape visualization
      const tapeY = h * 0.17;
      const cellW = Math.min(34, (w - 20) / 17);
      const visibleCells = Math.min(TAPE_LEN, Math.floor((w - 20) / cellW));
      const startIdx = Math.max(0, Math.min(TAPE_LEN - visibleCells, headPos - Math.floor(visibleCells / 2)));
      const endIdx = Math.min(TAPE_LEN, startIdx + visibleCells);
      const tapeStartX = (w - (endIdx - startIdx) * cellW) / 2;

      for (let i = startIdx; i < endIdx; i++) {
        const cx = (i - startIdx) * cellW + cellW / 2 + tapeStartX;
        const isHead = i === headPos;
        const val = tape[i] || BLANK;

        ctx.fillStyle = isHead ? headCellBg : val !== BLANK ? cellFilledBg : cellBg;
        ctx.fillRect(cx - cellW / 2 + 1, tapeY, cellW - 2, 38);
        ctx.strokeStyle = isHead ? headCellBorder : cellBorder;
        ctx.lineWidth = isHead ? 2 : 0.5;
        ctx.strokeRect(cx - cellW / 2 + 1, tapeY, cellW - 2, 38);

        ctx.fillStyle = val === BLANK ? textMuted : textPrimary;
        ctx.font = `${isHead ? 'bold ' : ''}13px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(val, cx, tapeY + 19);

        ctx.fillStyle = textMuted;
        ctx.font = '7px monospace';
        ctx.fillText(i.toString(), cx, tapeY + 46);
      }

      // Head pointer (triangle above active cell)
      const headScreenX = (headPos - startIdx) * cellW + cellW / 2 + tapeStartX;
      ctx.fillStyle = headColor;
      ctx.beginPath();
      ctx.moveTo(headScreenX, tapeY - 5);
      ctx.lineTo(headScreenX - 8, tapeY - 18);
      ctx.lineTo(headScreenX + 8, tapeY - 18);
      ctx.closePath();
      ctx.fill();
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('HEAD', headScreenX, tapeY - 22);

      // State display box
      const stateY = tapeY + 62;
      const stateBoxW = 120;
      ctx.fillStyle = halted ? haltBg : stateBg;
      ctx.fillRect(w / 2 - stateBoxW / 2, stateY, stateBoxW, 30);
      ctx.strokeStyle = halted ? haltBorder : stateBorder;
      ctx.lineWidth = halted ? 2.5 : 1.5;
      ctx.strokeRect(w / 2 - stateBoxW / 2, stateY, stateBoxW, 30);
      ctx.fillStyle = halted ? haltText : stateText;
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(halted ? 'HALTED' : `State: ${currentState}`, w / 2, stateY + 16);

      // Steps counter next to state
      ctx.fillStyle = textSecondary;
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Steps: ${steps}`, w / 2 + stateBoxW / 2 + 12, stateY + 16);

      // State diagram hint (horizontal row of state circles)
      const allStates = collectAllStates(trans);
      if (allStates.length > 0 && allStates.length <= 14) {
        const diagramY = stateY + 42;
        ctx.fillStyle = textSecondary;
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('States:', 12, diagramY + 4);
        const nodeR = 12;
        const gap = Math.min(36, (w - 80) / allStates.length);
        const nodesStartX = 60;
        allStates.forEach((st, idx) => {
          const nx = nodesStartX + idx * gap;
          const isActive = st === currentState;
          const isHaltNode = st === HALT_STATE;

          ctx.beginPath();
          ctx.arc(nx, diagramY, nodeR, 0, Math.PI * 2);
          ctx.fillStyle = isActive ? stateNodeActive : isHaltNode ? (isDark ? 'rgba(255,80,80,0.25)' : 'rgba(220,50,50,0.12)') : stateNodeBg;
          ctx.fill();
          ctx.strokeStyle = isActive ? stateNodeActive : isHaltNode ? haltBorder : stateNodeBorder;
          ctx.lineWidth = isActive ? 2.5 : isHaltNode ? 2 : 1;
          ctx.stroke();

          if (isHaltNode) {
            ctx.beginPath();
            ctx.arc(nx, diagramY, nodeR + 3, 0, Math.PI * 2);
            ctx.strokeStyle = haltBorder;
            ctx.lineWidth = 1;
            ctx.stroke();
          }

          ctx.fillStyle = isActive ? (isDark ? '#fff' : '#111') : isHaltNode ? haltText : textPrimary;
          ctx.font = `${isActive ? 'bold ' : ''}8px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(st.length > 3 ? st.slice(0, 3) : st, nx, diagramY);
        });
      }

      // Lower section: two columns
      const lowerY = stateY + 72;
      const colWidth = Math.floor((w - 30) / 2);

      // Left column: Transition rules for current state
      ctx.fillStyle = textSecondary;
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('Transition Rules (current state)', 12, lowerY);

      const stateRules = trans[currentState];
      if (stateRules && !halted) {
        let ri = 0;
        const entries = Object.entries(stateRules);
        for (const [sym, rule] of entries) {
          const ry = lowerY + 14 + ri * 15;
          if (ry > h - 10) break;
          const isActive = sym === (tape[headPos] || BLANK);
          ctx.fillStyle = isActive ? ruleActiveBg : ruleInactiveBg;
          ctx.fillRect(12, ry - 8, colWidth, 13);
          ctx.fillStyle = isActive ? ruleActiveText : ruleInactiveText;
          ctx.font = '9px monospace';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
          ctx.fillText(`(${currentState}, ${sym}) -> (${rule.nextState}, ${rule.write}, ${rule.move})`, 16, ry + 2);
          ri++;
        }
      } else if (halted) {
        ctx.fillStyle = haltText;
        ctx.font = '9px monospace';
        ctx.fillText('Machine has halted.', 16, lowerY + 16);
      }

      // Right column: Execution log
      const logX = 12 + colWidth + 10;
      ctx.fillStyle = textSecondary;
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('Execution Log', logX, lowerY);

      const maxLogLines = Math.floor((h - lowerY - 20) / 13);
      const visibleLog = history.slice(-(Math.min(10, maxLogLines)));
      visibleLog.forEach((entry, i) => {
        const ly = lowerY + 14 + i * 13;
        if (ly > h - 6) return;
        ctx.fillStyle = logText;
        ctx.font = '8px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(entry, logX, ly);
      });

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      obs.disconnect();
    };
  }, [tape, headPos, currentState, halted, steps, history, mode, selectedProgram, customTransitions, activeTransitions]);

  // Custom mode functions
  const addState = useCallback(() => {
    const name = newStateName.trim();
    if (!name || customStates.includes(name)) return;
    setCustomStates(prev => [...prev, name]);
    setNewStateName('');
  }, [newStateName, customStates]);

  const removeState = useCallback((st: string) => {
    if (st === 'q0' || st === HALT_STATE) return;
    setCustomStates(prev => prev.filter(s => s !== st));
    setCustomTransitions(prev => {
      const next = { ...prev };
      delete next[st];
      for (const key of Object.keys(next)) {
        const rules = { ...next[key] };
        for (const sym of Object.keys(rules)) {
          if (rules[sym].nextState === st) delete rules[sym];
        }
        next[key] = rules;
      }
      return next;
    });
  }, []);

  const addRule = useCallback(() => {
    setCustomTransitions(prev => {
      const next = { ...prev };
      if (!next[ruleState]) next[ruleState] = {};
      next[ruleState] = { ...next[ruleState], [ruleRead]: { write: ruleWrite, move: ruleMove, nextState: ruleNext } };
      return next;
    });
  }, [ruleState, ruleRead, ruleWrite, ruleMove, ruleNext]);

  const removeRule = useCallback((st: string, sym: string) => {
    setCustomTransitions(prev => {
      const next = { ...prev };
      if (next[st]) {
        const rules = { ...next[st] };
        delete rules[sym];
        if (Object.keys(rules).length === 0) delete next[st];
        else next[st] = rules;
      }
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    const name = saveName.trim() || 'Untitled Machine';
    const machine: CustomMachine = {
      name,
      tape: [...tape],
      headPos,
      states: [...customStates],
      transitions: JSON.parse(JSON.stringify(customTransitions)),
    };
    const updated = [...savedMachines.filter(m => m.name !== name), machine];
    setSavedMachines(updated);
    saveMachines(updated);
    setSaveName('');
  }, [saveName, tape, headPos, customStates, customTransitions, savedMachines]);

  const handleLoadSaved = useCallback((machine: CustomMachine) => {
    setCustomStates([...machine.states]);
    setCustomTransitions(JSON.parse(JSON.stringify(machine.transitions)));
    setTape([...machine.tape]);
    setHeadPos(machine.headPos);
    setCustomTapeInput(machine.tape.filter(c => c !== BLANK).join(''));
    setCustomHeadInput(String(machine.headPos));
    setCurrentState('q0');
    setHalted(false);
    setSteps(0);
    setRunning(false);
    setHistory([]);
  }, []);

  const handleDeleteSaved = useCallback((name: string) => {
    const updated = savedMachines.filter(m => m.name !== name);
    setSavedMachines(updated);
    saveMachines(updated);
  }, [savedMachines]);

  const handleLoadTemplate = useCallback((template: CustomMachine) => {
    handleLoadSaved(template);
  }, [handleLoadSaved]);

  const handleExport = useCallback(() => {
    const machine: CustomMachine = {
      name: saveName.trim() || 'Exported Machine',
      tape: [...tape],
      headPos,
      states: [...customStates],
      transitions: JSON.parse(JSON.stringify(customTransitions)),
    };
    const json = JSON.stringify(machine, null, 2);
    navigator.clipboard.writeText(json).catch(() => {
      setImportText(json);
      setShowImport(true);
    });
  }, [saveName, tape, headPos, customStates, customTransitions]);

  const handleImport = useCallback(() => {
    try {
      const machine = JSON.parse(importText) as CustomMachine;
      if (!machine.tape || !machine.states || !machine.transitions) throw new Error('Invalid format');
      handleLoadSaved(machine);
      setShowImport(false);
      setImportText('');
    } catch {
      // Invalid JSON - do nothing
    }
  }, [importText, handleLoadSaved]);

  const handleTapeCellClick = useCallback((index: number) => {
    if (running) return;
    const newTape = [...tape];
    const current = newTape[index];
    // Cycle through blank and common characters
    const chars = [BLANK, '0', '1', 'a', 'b'];
    const nextIdx = (chars.indexOf(current) + 1) % chars.length;
    newTape[index] = chars[nextIdx];
    setTape(newTape);
  }, [tape, running]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'custom' || running) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const w = rect.width;
    const tapeY = rect.height * 0.17;
    const cellW = Math.min(34, (w - 20) / 17);
    const visibleCells = Math.min(TAPE_LEN, Math.floor((w - 20) / cellW));
    const startIdx = Math.max(0, Math.min(TAPE_LEN - visibleCells, headPos - Math.floor(visibleCells / 2)));
    const endIdx = Math.min(TAPE_LEN, startIdx + visibleCells);
    const tapeStartX = (w - (endIdx - startIdx) * cellW) / 2;

    if (y >= tapeY && y <= tapeY + 38) {
      const cellIdx = Math.floor((x - tapeStartX) / cellW) + startIdx;
      if (cellIdx >= 0 && cellIdx < TAPE_LEN) {
        handleTapeCellClick(cellIdx);
      }
    }
  }, [mode, running, headPos, handleTapeCellClick]);

  // Flatten custom transitions for the table display
  const flatRules = useCallback(() => {
    const result: { state: string; symbol: string; rule: Rule }[] = [];
    for (const st of Object.keys(customTransitions).sort()) {
      for (const sym of Object.keys(customTransitions[st]).sort()) {
        result.push({ state: st, symbol: sym, rule: customTransitions[st][sym] });
      }
    }
    return result;
  }, [customTransitions]);

  const inputCls = 'w-full px-1.5 py-1 rounded text-[10px] border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500';
  const selectCls = 'px-1.5 py-1 rounded text-[10px] border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none';
  const btnSm = 'px-1.5 py-1 rounded text-[10px] font-medium transition-colors';

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-100 to-amber-100 dark:from-gray-950 dark:to-amber-950 p-3 overflow-hidden">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          Turing Machine Simulator
        </h2>
        <p className="text-[11px] text-gray-500 dark:text-gray-400">Universal computation model - explore programs or build your own</p>
      </div>
      <div className="flex-1 flex gap-3 min-h-0">
        {/* Left: Canvas */}
        <div className="flex-1 min-w-0 min-h-0 rounded-lg border border-gray-300 dark:border-gray-800 overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-pointer"
            onClick={handleCanvasClick}
          />
        </div>

        {/* Right: Controls + Editor */}
        <div className="w-[220px] flex flex-col gap-2 flex-shrink-0 overflow-hidden">
          {/* Mode tabs */}
          <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700">
            <button
              onClick={() => { setMode('programs'); setRunning(false); }}
              className={`flex-1 py-1.5 text-[10px] font-semibold transition-colors ${mode === 'programs' ? 'bg-amber-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              Programs
            </button>
            <button
              onClick={() => { setMode('custom'); setRunning(false); }}
              className={`flex-1 py-1.5 text-[10px] font-semibold transition-colors ${mode === 'custom' ? 'bg-amber-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              Custom
            </button>
          </div>

          {/* Transport controls */}
          <div className="flex gap-1">
            <button
              onClick={() => setRunning(!running)}
              disabled={halted}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] font-medium disabled:opacity-30 transition-colors ${running ? 'bg-amber-600 text-white' : 'bg-green-600 text-white'}`}
            >
              {running ? <><Pause className="h-3 w-3" />Pause</> : <><Play className="h-3 w-3" />Run</>}
            </button>
            <button
              onClick={executeStep}
              disabled={running || halted}
              className="px-2 py-1.5 rounded bg-blue-700 text-white text-[10px] disabled:opacity-30 transition-colors"
              title="Step"
            >
              <StepForward className="h-3 w-3" />
            </button>
            <button
              onClick={resetMachine}
              className="px-2 py-1.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white text-[10px] transition-colors"
              title="Reset"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>

          {/* Speed slider */}
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-2">
            <label className="text-[10px] text-gray-500 dark:text-gray-400 flex justify-between">
              <span>Speed</span><span>{speed}x</span>
            </label>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={e => setSpeed(+e.target.value)}
              className="w-full h-1 accent-amber-500"
            />
          </div>

          {/* Scrollable mode-specific content */}
          <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pr-0.5">
            {mode === 'programs' ? (
              <>
                {/* Program selector */}
                <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-2.5 space-y-1">
                  <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Program</h4>
                  {PROGRAMS.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedProgram(i)}
                      className={`block w-full text-left px-2 py-1.5 rounded text-[10px] transition-colors ${selectedProgram === i ? 'bg-amber-700 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>

                {/* Info box */}
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-lg p-2.5">
                  <h4 className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1 mb-1">
                    <Info className="h-3 w-3" />About
                  </h4>
                  <div className="text-[9px] text-gray-600 dark:text-gray-400 space-y-1">
                    <p>A Turing Machine has an infinite tape, a head that reads/writes, and a set of states with transition rules.</p>
                    <p>It can compute anything that any computer can compute (Church-Turing thesis).</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Tape input */}
                <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-2.5 space-y-1.5">
                  <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Tape Setup</h4>
                  <div>
                    <label className="text-[9px] text-gray-500 dark:text-gray-400">Initial tape (chars)</label>
                    <input
                      type="text"
                      value={customTapeInput}
                      onChange={e => setCustomTapeInput(e.target.value)}
                      placeholder="e.g. 1011 or abba"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 dark:text-gray-400">Head position (0-{TAPE_LEN - 1})</label>
                    <input
                      type="number"
                      min={0}
                      max={TAPE_LEN - 1}
                      value={customHeadInput}
                      onChange={e => setCustomHeadInput(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <p className="text-[8px] text-gray-400 dark:text-gray-500 italic">Click tape cells on canvas to cycle values</p>
                </div>

                {/* State editor */}
                <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-2.5 space-y-1.5">
                  <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">States</h4>
                  <div className="flex flex-wrap gap-1">
                    {customStates.map(st => (
                      <span
                        key={st}
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono ${
                          st === HALT_STATE
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700'
                            : st === 'q0'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        {st}
                        {st !== 'q0' && st !== HALT_STATE && (
                          <button
                            onClick={() => removeState(st)}
                            className="text-red-400 hover:text-red-600 ml-0.5"
                            title="Remove state"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={newStateName}
                      onChange={e => setNewStateName(e.target.value)}
                      placeholder="e.g. q2"
                      className={`${inputCls} flex-1`}
                      onKeyDown={e => e.key === 'Enter' && addState()}
                    />
                    <button
                      onClick={addState}
                      className={`${btnSm} bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-0.5`}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Transition rule editor */}
                <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-2.5 space-y-1.5">
                  <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Add Rule</h4>
                  <div className="grid grid-cols-2 gap-1">
                    <div>
                      <label className="text-[8px] text-gray-400 dark:text-gray-500">State</label>
                      <select
                        value={ruleState}
                        onChange={e => setRuleState(e.target.value)}
                        className={selectCls + ' w-full'}
                      >
                        {customStates.filter(s => s !== HALT_STATE).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[8px] text-gray-400 dark:text-gray-500">Read</label>
                      <input
                        type="text"
                        maxLength={1}
                        value={ruleRead}
                        onChange={e => setRuleRead(e.target.value || BLANK)}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="text-[8px] text-gray-400 dark:text-gray-500">Write</label>
                      <input
                        type="text"
                        maxLength={1}
                        value={ruleWrite}
                        onChange={e => setRuleWrite(e.target.value || BLANK)}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="text-[8px] text-gray-400 dark:text-gray-500">Move</label>
                      <select
                        value={ruleMove}
                        onChange={e => setRuleMove(e.target.value as MoveDir)}
                        className={selectCls + ' w-full'}
                      >
                        <option value="L">L (Left)</option>
                        <option value="R">R (Right)</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-[8px] text-gray-400 dark:text-gray-500">Next State</label>
                      <select
                        value={ruleNext}
                        onChange={e => setRuleNext(e.target.value)}
                        className={selectCls + ' w-full'}
                      >
                        {customStates.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={addRule}
                    className={`${btnSm} w-full bg-green-600 text-white hover:bg-green-700 flex items-center justify-center gap-1`}
                  >
                    <Plus className="h-3 w-3" />Add Rule
                  </button>
                </div>

                {/* Current rules table */}
                <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-2.5 space-y-1.5">
                  <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Rules ({flatRules().length})
                  </h4>
                  {flatRules().length === 0 ? (
                    <p className="text-[9px] text-gray-400 dark:text-gray-500 italic">No rules defined yet</p>
                  ) : (
                    <div className="max-h-[120px] overflow-y-auto space-y-0.5">
                      <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_20px] gap-0.5 text-[7px] font-semibold text-gray-400 dark:text-gray-500 uppercase px-1">
                        <span>St</span><span>Rd</span><span>Wr</span><span>Mv</span><span>Nx</span><span></span>
                      </div>
                      {flatRules().map(({ state: st, symbol: sym, rule }, idx) => (
                        <div
                          key={`${st}-${sym}-${idx}`}
                          className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_20px] gap-0.5 items-center px-1 py-0.5 rounded text-[9px] font-mono bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400"
                        >
                          <span className="truncate">{st}</span>
                          <span>{sym}</span>
                          <span>{rule.write}</span>
                          <span>{rule.move}</span>
                          <span className="truncate">{rule.nextState}</span>
                          <button
                            onClick={() => removeRule(st, sym)}
                            className="text-red-400 hover:text-red-600"
                            title="Remove rule"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Templates */}
                <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-2.5 space-y-1.5">
                  <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1">
                    <Code className="h-3 w-3" />Templates
                  </h4>
                  {CUSTOM_TEMPLATES.map((tmpl, i) => (
                    <button
                      key={i}
                      onClick={() => handleLoadTemplate(tmpl.machine)}
                      className={`block w-full text-left px-2 py-1 rounded text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors`}
                    >
                      {tmpl.name}
                    </button>
                  ))}
                </div>

                {/* Save/Load/Export/Import */}
                <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-2.5 space-y-1.5">
                  <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Save / Load</h4>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={saveName}
                      onChange={e => setSaveName(e.target.value)}
                      placeholder="Machine name"
                      className={`${inputCls} flex-1`}
                    />
                    <button
                      onClick={handleSave}
                      className={`${btnSm} bg-amber-600 text-white hover:bg-amber-700 flex items-center gap-0.5`}
                      title="Save to browser"
                    >
                      <Save className="h-3 w-3" />
                    </button>
                  </div>
                  {savedMachines.length > 0 && (
                    <div className="max-h-[80px] overflow-y-auto space-y-0.5">
                      {savedMachines.map((m, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <button
                            onClick={() => handleLoadSaved(m)}
                            className="flex-1 text-left px-1.5 py-0.5 rounded text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-green-100 dark:hover:bg-green-900/30 truncate transition-colors"
                          >
                            {m.name}
                          </button>
                          <button
                            onClick={() => handleDeleteSaved(m.name)}
                            className="text-red-400 hover:text-red-600 flex-shrink-0"
                            title="Delete saved machine"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-1 pt-1 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleExport}
                      className={`${btnSm} flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center gap-0.5`}
                      title="Copy JSON to clipboard"
                    >
                      <Upload className="h-3 w-3" />Export
                    </button>
                    <button
                      onClick={() => setShowImport(!showImport)}
                      className={`${btnSm} flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center gap-0.5`}
                    >
                      <Upload className="h-3 w-3 rotate-180" />Import
                    </button>
                  </div>
                  {showImport && (
                    <div className="space-y-1">
                      <textarea
                        value={importText}
                        onChange={e => setImportText(e.target.value)}
                        placeholder="Paste JSON here..."
                        className={`${inputCls} h-16 resize-none font-mono`}
                      />
                      <button
                        onClick={handleImport}
                        className={`${btnSm} w-full bg-blue-600 text-white hover:bg-blue-700`}
                      >
                        Load from JSON
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
