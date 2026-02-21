import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Info, Terminal, BarChart3, Send } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AnimBlock {
  id: number;
  start: number;
  size: number;
  label: string;
  color: string;
  // animated properties
  animX: number;
  animWidth: number;
  animOpacity: number;
  // targets
  targetX: number;
  targetWidth: number;
  targetOpacity: number;
  // lifecycle
  removing: boolean;
}

interface LogEntry {
  text: string;
  type: 'info' | 'success' | 'error' | 'warn';
}

type Algorithm = 'first-fit' | 'best-fit' | 'worst-fit' | 'next-fit';
type TabMode = 'visualizer' | 'sandbox';

interface Challenge {
  title: string;
  description: string;
  check: (blocks: AnimBlock[], totalMemory: number) => boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_MEMORY = 256;
const BLOCK_COLORS = [
  '#4090ff', '#a060ff', '#ff6040', '#40c060',
  '#ffc040', '#ff60a0', '#60d0d0', '#c080ff',
];
const LERP_FACTOR = 0.15;

const CHALLENGES: Challenge[] = [
  {
    title: 'Fill exactly 256 bytes',
    description: 'Allocate blocks to fill exactly 256 bytes total.',
    check: (blocks) => {
      const used = blocks.filter(b => !b.removing).reduce((a, b) => a + b.size, 0);
      return used === TOTAL_MEMORY;
    },
  },
  {
    title: 'Maximum fragmentation',
    description: 'Create external fragmentation above 60%.',
    check: (blocks, totalMemory) => {
      const active = blocks.filter(b => !b.removing);
      const sorted = [...active].sort((a, b) => a.start - b.start);
      const freeList: { start: number; size: number }[] = [];
      let pos = 0;
      sorted.forEach(b => {
        if (b.start > pos) freeList.push({ start: pos, size: b.start - pos });
        pos = b.start + b.size;
      });
      if (pos < totalMemory) freeList.push({ start: pos, size: totalMemory - pos });
      const totalFree = freeList.reduce((a, b) => a + b.size, 0);
      const largest = freeList.reduce((a, b) => Math.max(a, b.size), 0);
      const frag = totalFree > 0 ? (1 - largest / totalFree) * 100 : 0;
      return frag > 60;
    },
  },
  {
    title: 'Exactly 3 free blocks',
    description: 'Allocate and free to leave exactly 3 separate free regions.',
    check: (blocks, totalMemory) => {
      const active = blocks.filter(b => !b.removing);
      const sorted = [...active].sort((a, b) => a.start - b.start);
      const freeList: { start: number; size: number }[] = [];
      let pos = 0;
      sorted.forEach(b => {
        if (b.start > pos) freeList.push({ start: pos, size: b.start - pos });
        pos = b.start + b.size;
      });
      if (pos < totalMemory) freeList.push({ start: pos, size: totalMemory - pos });
      return freeList.length === 3;
    },
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getFreeBlocks(blocks: AnimBlock[], totalMemory: number): { start: number; size: number }[] {
  const active = blocks.filter(b => !b.removing);
  const sorted = [...active].sort((a, b) => a.start - b.start);
  const free: { start: number; size: number }[] = [];
  let pos = 0;
  sorted.forEach(b => {
    if (b.start > pos) free.push({ start: pos, size: b.start - pos });
    pos = b.start + b.size;
  });
  if (pos < totalMemory) free.push({ start: pos, size: totalMemory - pos });
  return free;
}

function computeFragmentation(blocks: AnimBlock[], totalMemory: number): number {
  const freeList = getFreeBlocks(blocks, totalMemory);
  const totalFree = freeList.reduce((a, b) => a + b.size, 0);
  const largest = freeList.reduce((a, b) => Math.max(a, b.size), 0);
  return totalFree > 0 ? (1 - largest / totalFree) * 100 : 0;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const MemoryAllocator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const blocksRef = useRef<AnimBlock[]>([]);
  const nextIdRef = useRef(1);
  const lastAllocPosRef = useRef(0); // for next-fit
  const timerRef = useRef<number>(0);
  const cmdHistoryRef = useRef<string[]>([]);
  const cmdHistoryIdxRef = useRef(-1);

  const [, forceUpdate] = useState(0);
  const rerender = useCallback(() => forceUpdate(x => x + 1), []);

  const [tab, setTab] = useState<TabMode>('visualizer');
  const [algorithm, setAlgorithm] = useState<Algorithm>('first-fit');
  const [allocSize, setAllocSize] = useState(32);
  const [autoMode, setAutoMode] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [activityLog, setActivityLog] = useState<LogEntry[]>([]);
  const [cmdInput, setCmdInput] = useState('');
  const [sandboxLog, setSandboxLog] = useState<LogEntry[]>([
    { text: 'Memory Allocator Sandbox v1.0', type: 'info' },
    { text: 'Type "help" for available commands.', type: 'info' },
  ]);
  const [completedChallenges, setCompletedChallenges] = useState<boolean[]>(
    new Array(CHALLENGES.length).fill(false)
  );

  const logRef = useRef<HTMLDivElement>(null);
  const sandboxLogRef = useRef<HTMLDivElement>(null);
  const cmdInputRef = useRef<HTMLInputElement>(null);

  // ----- helpers wrapping the blocks ref -----

  const getActiveBlocks = useCallback((): AnimBlock[] => {
    return blocksRef.current.filter(b => !b.removing);
  }, []);

  const addLog = useCallback((text: string, type: LogEntry['type'] = 'info') => {
    setActivityLog(prev => [...prev.slice(-49), { text, type }]);
  }, []);

  const addSandboxLog = useCallback((text: string, type: LogEntry['type'] = 'info') => {
    setSandboxLog(prev => [...prev.slice(-99), { text, type }]);
  }, []);

  // ----- allocation -----

  const allocate = useCallback((size: number, silent = false): AnimBlock | null => {
    if (size <= 0 || size > TOTAL_MEMORY) {
      const msg = `FAIL: Invalid size ${size}`;
      if (!silent) addLog(msg, 'error');
      return null;
    }

    const freeList = getFreeBlocks(blocksRef.current, TOTAL_MEMORY);
    const fitting = freeList.filter(f => f.size >= size);

    if (fitting.length === 0) {
      const msg = `FAIL: No space for ${size} bytes`;
      if (!silent) addLog(msg, 'error');
      return null;
    }

    let chosen: { start: number; size: number } | null = null;

    switch (algorithm) {
      case 'first-fit':
        chosen = fitting[0];
        break;
      case 'best-fit':
        chosen = fitting.reduce((a, b) => (a.size < b.size ? a : b));
        break;
      case 'worst-fit':
        chosen = fitting.reduce((a, b) => (a.size > b.size ? a : b));
        break;
      case 'next-fit': {
        const lastPos = lastAllocPosRef.current;
        // find first fitting block at or after lastPos
        let found = fitting.find(f => f.start >= lastPos);
        if (!found) found = fitting[0]; // wrap around
        chosen = found;
        break;
      }
    }

    if (!chosen) return null;

    const id = nextIdRef.current++;
    const label = `P${id}`;
    const color = BLOCK_COLORS[(id - 1) % BLOCK_COLORS.length];

    const block: AnimBlock = {
      id,
      start: chosen.start,
      size,
      label,
      color,
      animX: chosen.start,
      animWidth: 0,
      animOpacity: 0,
      targetX: chosen.start,
      targetWidth: size,
      targetOpacity: 1,
      removing: false,
    };

    blocksRef.current = [...blocksRef.current, block];
    lastAllocPosRef.current = chosen.start + size;

    const msg = `ALLOC ${label}: ${size}B at ${chosen.start}`;
    if (!silent) addLog(msg, 'success');
    rerender();
    return block;
  }, [algorithm, addLog, rerender, getActiveBlocks]);

  // ----- deallocation -----

  const deallocate = useCallback((id: number, silent = false): boolean => {
    const block = blocksRef.current.find(b => b.id === id && !b.removing);
    if (!block) {
      if (!silent) addLog(`FAIL: Block ${id} not found`, 'error');
      return false;
    }

    block.removing = true;
    block.targetOpacity = 0;
    block.targetWidth = 0;

    const msg = `FREE ${block.label}: ${block.size}B at ${block.start}`;
    if (!silent) addLog(msg, 'info');
    rerender();

    // Remove after animation finishes
    setTimeout(() => {
      blocksRef.current = blocksRef.current.filter(b => b.id !== id);
      rerender();
    }, 500);

    return true;
  }, [addLog, rerender]);

  // ----- compact -----

  const compact = useCallback((silent = false) => {
    const active = blocksRef.current
      .filter(b => !b.removing)
      .sort((a, b) => a.start - b.start);

    let pos = 0;
    active.forEach(b => {
      b.start = pos;
      b.targetX = pos;
      pos += b.size;
    });

    blocksRef.current = [...active];
    lastAllocPosRef.current = pos;
    if (!silent) addLog('COMPACT: Memory defragmented', 'warn');
    rerender();
  }, [addLog, rerender]);

  // ----- reset -----

  const resetAll = useCallback(() => {
    blocksRef.current = [];
    nextIdRef.current = 1;
    lastAllocPosRef.current = 0;
    setActivityLog([]);
    setAutoMode(false);
    rerender();
  }, [rerender]);

  // ----- auto mode -----

  useEffect(() => {
    if (!autoMode) return;
    timerRef.current = window.setInterval(() => {
      const active = getActiveBlocks();
      if (Math.random() < 0.6) {
        allocate(8 + Math.floor(Math.random() * 48));
      } else if (active.length > 0) {
        const idx = Math.floor(Math.random() * active.length);
        deallocate(active[idx].id);
      }
    }, 1500 / speed);
    return () => clearInterval(timerRef.current);
  }, [autoMode, speed, allocate, deallocate, getActiveBlocks]);

  // ----- challenge checking -----

  useEffect(() => {
    if (tab !== 'sandbox') return;
    const active = getActiveBlocks();
    const newCompleted = CHALLENGES.map((c, i) =>
      completedChallenges[i] || c.check(active, TOTAL_MEMORY)
    );
    if (newCompleted.some((v, i) => v !== completedChallenges[i])) {
      setCompletedChallenges(newCompleted);
      newCompleted.forEach((v, i) => {
        if (v && !completedChallenges[i]) {
          addSandboxLog(`Challenge completed: "${CHALLENGES[i].title}"`, 'success');
        }
      });
    }
  }, [blocksRef.current.length, tab, getActiveBlocks, completedChallenges, addSandboxLog]);

  // ----- sandbox command parsing -----

  const executeCommand = useCallback((raw: string) => {
    const input = raw.trim();
    if (!input) return;

    // push to history
    cmdHistoryRef.current = [...cmdHistoryRef.current, input];
    cmdHistoryIdxRef.current = cmdHistoryRef.current.length;

    addSandboxLog(`> ${input}`, 'info');

    const parts = input.split(/\s+/);
    const cmd = parts[0].toLowerCase();

    switch (cmd) {
      case 'alloc':
      case 'malloc': {
        const sizeStr = parts[1];
        if (!sizeStr) {
          addSandboxLog('Usage: alloc <size>', 'error');
          return;
        }
        const size = parseInt(sizeStr, 10);
        if (isNaN(size) || size <= 0) {
          addSandboxLog(`Invalid size: "${sizeStr}"`, 'error');
          return;
        }
        if (size > TOTAL_MEMORY) {
          addSandboxLog(`Size ${size} exceeds total memory (${TOTAL_MEMORY})`, 'error');
          return;
        }
        const block = allocate(size, true);
        if (block) {
          addSandboxLog(`Allocated ${block.label}: ${size}B at address ${block.start}`, 'success');
        } else {
          addSandboxLog(`Failed: No contiguous space for ${size} bytes`, 'error');
        }
        break;
      }

      case 'free': {
        const target = parts[1];
        if (!target) {
          addSandboxLog('Usage: free <id> or free P<n>', 'error');
          return;
        }
        let id: number;
        if (target.toUpperCase().startsWith('P')) {
          id = parseInt(target.substring(1), 10);
        } else {
          id = parseInt(target, 10);
        }
        if (isNaN(id)) {
          addSandboxLog(`Invalid block identifier: "${target}"`, 'error');
          return;
        }
        const block = blocksRef.current.find(b => b.id === id && !b.removing);
        if (!block) {
          addSandboxLog(`Block ${target} not found`, 'error');
          return;
        }
        deallocate(id, true);
        addSandboxLog(`Freed ${block.label}: ${block.size}B at address ${block.start}`, 'success');
        break;
      }

      case 'compact':
      case 'defrag': {
        const active = getActiveBlocks();
        if (active.length === 0) {
          addSandboxLog('Nothing to compact', 'warn');
          return;
        }
        compact(true);
        addSandboxLog('Memory compacted successfully', 'success');
        break;
      }

      case 'status': {
        const active = getActiveBlocks();
        const used = active.reduce((a, b) => a + b.size, 0);
        const free = TOTAL_MEMORY - used;
        const frag = computeFragmentation(blocksRef.current, TOTAL_MEMORY);
        const freeList = getFreeBlocks(blocksRef.current, TOTAL_MEMORY);
        addSandboxLog(`--- Memory Status ---`, 'info');
        addSandboxLog(`Total: ${TOTAL_MEMORY}B | Used: ${used}B | Free: ${free}B`, 'info');
        addSandboxLog(`Blocks: ${active.length} | Free regions: ${freeList.length}`, 'info');
        addSandboxLog(`Fragmentation: ${frag.toFixed(1)}%`, frag > 50 ? 'error' : 'info');
        active.sort((a, b) => a.start - b.start).forEach(b => {
          addSandboxLog(`  ${b.label}: ${b.size}B [${b.start}..${b.start + b.size - 1}]`, 'info');
        });
        break;
      }

      case 'clear':
      case 'reset': {
        blocksRef.current = [];
        nextIdRef.current = 1;
        lastAllocPosRef.current = 0;
        rerender();
        addSandboxLog('Memory cleared', 'success');
        break;
      }

      case 'help': {
        addSandboxLog('--- Available Commands ---', 'info');
        addSandboxLog('alloc <size>    Allocate <size> bytes', 'info');
        addSandboxLog('malloc <size>   Alias for alloc', 'info');
        addSandboxLog('free <id>       Free block by id (e.g. free P3)', 'info');
        addSandboxLog('compact         Defragment memory', 'info');
        addSandboxLog('status          Show current memory state', 'info');
        addSandboxLog('clear           Reset all memory', 'info');
        addSandboxLog('help            Show this help', 'info');
        break;
      }

      default:
        addSandboxLog(`Unknown command: "${cmd}". Type "help" for usage.`, 'error');
    }
  }, [allocate, deallocate, compact, getActiveBlocks, addSandboxLog, rerender]);

  // ----- command input key handler -----

  const handleCmdKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(cmdInput);
      setCmdInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const history = cmdHistoryRef.current;
      if (history.length === 0) return;
      const newIdx = Math.max(0, cmdHistoryIdxRef.current - 1);
      cmdHistoryIdxRef.current = newIdx;
      setCmdInput(history[newIdx] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const history = cmdHistoryRef.current;
      const newIdx = Math.min(history.length, cmdHistoryIdxRef.current + 1);
      cmdHistoryIdxRef.current = newIdx;
      setCmdInput(newIdx >= history.length ? '' : history[newIdx]);
    }
  }, [cmdInput, executeCommand]);

  // ----- canvas click to free -----

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;
    const barX = 15;
    const barW = w - 30;
    const barY = 30;
    const barH = Math.min(h * 0.22, 60);

    if (y >= barY && y <= barY + barH && x >= barX && x <= barX + barW) {
      const memPos = ((x - barX) / barW) * TOTAL_MEMORY;
      const clicked = getActiveBlocks().find(
        b => memPos >= b.start && memPos < b.start + b.size
      );
      if (clicked) {
        if (tab === 'sandbox') {
          deallocate(clicked.id, true);
          addSandboxLog(`Freed ${clicked.label}: ${clicked.size}B at address ${clicked.start}`, 'success');
        } else {
          deallocate(clicked.id);
        }
      }
    }
  }, [getActiveBlocks, deallocate, tab, addSandboxLog]);

  // ----- canvas animation loop -----

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let lastTime = performance.now();

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const d = window.devicePixelRatio || 1;
      canvas.width = r.width * d;
      canvas.height = r.height * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
    };
    resize();
    const obs = new ResizeObserver(resize);
    obs.observe(canvas);

    const draw = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05); // cap dt
      lastTime = now;
      const r = canvas.getBoundingClientRect();
      const w = r.width;
      const h = r.height;

      // --- Theme detection ---
      const isDark = document.documentElement.classList.contains('dark');
      const bgColor = isDark ? '#080c18' : '#f8f9fc';
      const textPrimary = isDark ? 'rgba(200,200,255,0.85)' : 'rgba(30,30,60,0.85)';
      const textSecondary = isDark ? 'rgba(150,150,200,0.5)' : 'rgba(80,80,120,0.5)';
      const textMuted = isDark ? 'rgba(150,150,200,0.3)' : 'rgba(100,100,140,0.35)';
      const borderColor = isDark ? 'rgba(100,130,200,0.3)' : 'rgba(120,130,180,0.3)';
      const freeBlockBg = isDark ? 'rgba(30,60,30,0.3)' : 'rgba(200,235,200,0.5)';
      const freeTextColor = isDark ? 'rgba(100,200,100,0.4)' : 'rgba(40,140,40,0.5)';
      const gridLine = isDark ? 'rgba(100,130,200,0.1)' : 'rgba(100,120,180,0.12)';
      const usageBarBg = isDark ? 'rgba(30,35,60,0.3)' : 'rgba(200,205,225,0.5)';

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);

      // --- Animate blocks ---
      const speed60 = 1 - Math.pow(1 - LERP_FACTOR, dt * 60);
      blocksRef.current.forEach(b => {
        b.animX += (b.targetX - b.animX) * speed60;
        b.animWidth += (b.targetWidth - b.animWidth) * speed60;
        b.animOpacity += (b.targetOpacity - b.animOpacity) * speed60;
        // Snap if very close
        if (Math.abs(b.animX - b.targetX) < 0.01) b.animX = b.targetX;
        if (Math.abs(b.animWidth - b.targetWidth) < 0.01) b.animWidth = b.targetWidth;
        if (Math.abs(b.animOpacity - b.targetOpacity) < 0.005) b.animOpacity = b.targetOpacity;
      });

      // --- Layout ---
      const barX = 15;
      const barY = 30;
      const barW = w - 30;
      const barH = Math.min(h * 0.22, 60);

      // --- Title ---
      ctx.fillStyle = textPrimary;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Memory Map', 15, 18);

      // address label
      ctx.fillStyle = textSecondary;
      ctx.font = '8px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${TOTAL_MEMORY}B total`, w - 15, 18);
      ctx.textAlign = 'left';

      // --- Memory bar background ---
      ctx.fillStyle = freeBlockBg;
      ctx.fillRect(barX, barY, barW, barH);
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barW, barH);

      // --- Address markers ---
      ctx.fillStyle = textMuted;
      ctx.font = '7px monospace';
      ctx.textAlign = 'center';
      for (let i = 0; i <= 8; i++) {
        const x = barX + (i / 8) * barW;
        ctx.fillText(`${Math.floor((i * TOTAL_MEMORY) / 8)}`, x, barY + barH + 11);
        if (i > 0 && i < 8) {
          ctx.strokeStyle = gridLine;
          ctx.beginPath();
          ctx.moveTo(x, barY);
          ctx.lineTo(x, barY + barH);
          ctx.stroke();
        }
      }

      // --- Free blocks labels ---
      const freeList = getFreeBlocks(blocksRef.current, TOTAL_MEMORY);
      freeList.forEach(f => {
        const fx = barX + (f.start / TOTAL_MEMORY) * barW;
        const fw = (f.size / TOTAL_MEMORY) * barW;
        if (fw > 18) {
          ctx.fillStyle = freeTextColor;
          ctx.font = '7px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${f.size}B free`, fx + fw / 2, barY + barH / 2 + 2);
        }
      });

      // --- Allocated blocks (animated) ---
      blocksRef.current.forEach(b => {
        if (b.animOpacity < 0.01 && b.removing) return;
        const bx = barX + (b.animX / TOTAL_MEMORY) * barW;
        const bw = (b.animWidth / TOTAL_MEMORY) * barW;
        if (bw < 0.5) return;

        ctx.globalAlpha = b.animOpacity;

        // block fill
        ctx.fillStyle = b.color + '50';
        ctx.fillRect(bx, barY, bw, barH);

        // block border
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx, barY, bw, barH);

        // block top highlight
        ctx.fillStyle = b.color + '30';
        ctx.fillRect(bx, barY, bw, 3);

        // label
        if (bw > 20) {
          ctx.fillStyle = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(20,20,40,0.85)';
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(b.label, bx + bw / 2, barY + barH / 2 - 3);
          ctx.fillStyle = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(20,20,40,0.45)';
          ctx.font = '7px sans-serif';
          ctx.fillText(`${b.size}B`, bx + bw / 2, barY + barH / 2 + 8);
        }

        ctx.globalAlpha = 1;
      });

      // --- Fragmentation mini-bar ---
      const fragBarY = barY + barH + 20;
      const fragBarH = 6;
      ctx.fillStyle = textSecondary;
      ctx.font = '8px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Fragmentation', barX, fragBarY);

      const frag = computeFragmentation(blocksRef.current, TOTAL_MEMORY);
      const fragVal = `${frag.toFixed(1)}%`;
      ctx.textAlign = 'right';
      ctx.fillStyle = frag > 50 ? '#ff4040' : frag > 25 ? '#ffc040' : '#40c060';
      ctx.fillText(fragVal, barX + barW, fragBarY);

      const fragBarTop = fragBarY + 4;
      ctx.fillStyle = usageBarBg;
      ctx.fillRect(barX, fragBarTop, barW, fragBarH);

      // Show each free region in the fragmentation bar
      freeList.forEach(f => {
        const fx = barX + (f.start / TOTAL_MEMORY) * barW;
        const fw = (f.size / TOTAL_MEMORY) * barW;
        ctx.fillStyle = isDark ? 'rgba(60,200,60,0.25)' : 'rgba(40,160,40,0.2)';
        ctx.fillRect(fx, fragBarTop, fw, fragBarH);
      });
      // Allocated in frag bar
      blocksRef.current.forEach(b => {
        if (b.removing) return;
        const bx = barX + (b.animX / TOTAL_MEMORY) * barW;
        const bw = (b.animWidth / TOTAL_MEMORY) * barW;
        ctx.fillStyle = b.color + '60';
        ctx.fillRect(bx, fragBarTop, bw, fragBarH);
      });
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 0.5;
      ctx.strokeRect(barX, fragBarTop, barW, fragBarH);

      // --- Statistics panel ---
      const statsY = fragBarTop + fragBarH + 18;
      const used = getActiveBlocks().reduce((acc, b) => acc + b.size, 0);
      const free = TOTAL_MEMORY - used;
      const activeCount = getActiveBlocks().length;

      ctx.fillStyle = textPrimary;
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Statistics', barX, statsY);

      const stats: [string, string, string][] = [
        ['Total', `${TOTAL_MEMORY}B`, textSecondary],
        ['Used', `${used}B (${((used / TOTAL_MEMORY) * 100).toFixed(0)}%)`, '#4090ff'],
        ['Free', `${free}B (${((free / TOTAL_MEMORY) * 100).toFixed(0)}%)`, '#40c060'],
        ['Fragmentation', `${frag.toFixed(1)}%`, frag > 50 ? '#ff4040' : '#ffc040'],
        ['Blocks', `${activeCount}`, textSecondary],
        ['Free regions', `${freeList.length}`, textSecondary],
      ];

      const statColEnd = Math.min(w * 0.42, 200);
      stats.forEach(([label, val, color], i) => {
        const sy = statsY + 14 + i * 15;
        ctx.fillStyle = textMuted;
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(label, barX, sy);
        ctx.fillStyle = color;
        ctx.font = '9px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(val, statColEnd, sy);
      });

      // --- Usage bar ---
      const ubY = statsY + 14 + stats.length * 15 + 5;
      ctx.fillStyle = usageBarBg;
      ctx.fillRect(barX, ubY, statColEnd - barX, 8);
      ctx.fillStyle = '#4090ff60';
      ctx.fillRect(barX, ubY, (statColEnd - barX) * (used / TOTAL_MEMORY), 8);
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 0.5;
      ctx.strokeRect(barX, ubY, statColEnd - barX, 8);

      // --- Activity log on canvas (right portion) ---
      const logX = Math.max(w * 0.46, statColEnd + 20);
      ctx.fillStyle = textPrimary;
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Activity Log', logX, statsY);

      const logEntries = activityLog.slice(-12);
      logEntries.forEach((entry, i) => {
        const ly = statsY + 14 + i * 13;
        if (ly > h - 10) return;
        switch (entry.type) {
          case 'error':
            ctx.fillStyle = isDark ? 'rgba(255,100,100,0.7)' : 'rgba(200,40,40,0.7)';
            break;
          case 'success':
            ctx.fillStyle = isDark ? 'rgba(100,200,255,0.6)' : 'rgba(30,100,200,0.7)';
            break;
          case 'warn':
            ctx.fillStyle = isDark ? 'rgba(255,200,60,0.6)' : 'rgba(180,130,0,0.7)';
            break;
          default:
            ctx.fillStyle = isDark ? 'rgba(100,200,100,0.5)' : 'rgba(40,140,40,0.6)';
        }
        ctx.font = '8px monospace';
        ctx.fillText(entry.text, logX, ly);
      });

      // --- Blocks list ---
      const active = getActiveBlocks().sort((a, b) => a.start - b.start);
      if (active.length > 0) {
        const listY = Math.max(statsY + 14 + 13 * 13, h * 0.72);
        if (listY < h - 20) {
          ctx.fillStyle = textSecondary;
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('Click to free:', logX, listY);
          active.forEach((b, i) => {
            const by = listY + 14 + i * 15;
            if (by > h - 5) return;
            ctx.fillStyle = b.color + '30';
            ctx.fillRect(logX, by - 9, w - logX - 15, 13);
            ctx.fillStyle = b.color;
            ctx.font = '8px monospace';
            ctx.fillText(`${b.label}: ${b.size}B [${b.start}..${b.start + b.size - 1}]`, logX + 3, by);
          });
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      obs.disconnect();
    };
  }, [activityLog, getActiveBlocks]);

  // ----- auto-scroll logs -----

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [activityLog]);

  useEffect(() => {
    sandboxLogRef.current?.scrollTo({ top: sandboxLogRef.current.scrollHeight, behavior: 'smooth' });
  }, [sandboxLog]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-100 to-purple-100 dark:from-gray-950 dark:to-purple-950 p-3 overflow-hidden">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Memory Allocation Visualizer
          </h2>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Dynamic memory allocation strategies &amp; sandbox
          </p>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex gap-3 min-h-0">
        {/* Left: Canvas */}
        <div className="flex-1 min-w-0 min-h-0 rounded-lg border border-gray-300 dark:border-gray-800 overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-pointer"
            onClick={handleCanvasClick}
          />
        </div>

        {/* Right: Controls (200px) */}
        <div className="w-[200px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto pr-0.5">
          {/* Tab selector */}
          <div className="flex gap-1 bg-gray-200 dark:bg-gray-800 rounded-lg p-0.5">
            <button
              onClick={() => setTab('visualizer')}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] font-semibold transition-colors ${
                tab === 'visualizer'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <BarChart3 className="h-3 w-3" />
              Visualizer
            </button>
            <button
              onClick={() => setTab('sandbox')}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] font-semibold transition-colors ${
                tab === 'sandbox'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <Terminal className="h-3 w-3" />
              Sandbox
            </button>
          </div>

          {/* ===== Visualizer Tab ===== */}
          {tab === 'visualizer' && (
            <>
              {/* Algorithm */}
              <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-1.5">
                <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Algorithm
                </h4>
                {(['first-fit', 'best-fit', 'worst-fit', 'next-fit'] as Algorithm[]).map(a => (
                  <button
                    key={a}
                    onClick={() => setAlgorithm(a)}
                    className={`block w-full text-left px-2 py-1.5 rounded text-[10px] transition-colors ${
                      algorithm === a
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {a
                      .split('-')
                      .map(s => s[0].toUpperCase() + s.slice(1))
                      .join(' ')}
                  </button>
                ))}
              </div>

              {/* Allocate controls */}
              <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-2">
                <div>
                  <label className="text-[10px] text-gray-500 dark:text-gray-400 flex justify-between">
                    <span>Block size</span>
                    <span>{allocSize}B</span>
                  </label>
                  <input
                    type="range"
                    min={4}
                    max={128}
                    step={4}
                    value={allocSize}
                    onChange={e => setAllocSize(+e.target.value)}
                    className="w-full h-1 accent-purple-500"
                  />
                </div>
                <button
                  onClick={() => allocate(allocSize)}
                  className="w-full px-2 py-1.5 rounded bg-green-700 hover:bg-green-600 text-white text-[10px] font-medium transition-colors"
                >
                  Allocate
                </button>
                <button
                  onClick={() => compact()}
                  className="w-full px-2 py-1.5 rounded bg-amber-700 hover:bg-amber-600 text-white text-[10px] font-medium transition-colors"
                >
                  Compact / Defragment
                </button>
              </div>

              {/* Auto + Reset */}
              <div className="flex gap-1">
                <button
                  onClick={() => setAutoMode(!autoMode)}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] font-medium transition-colors ${
                    autoMode
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-purple-600 hover:bg-purple-500 text-white'
                  }`}
                >
                  {autoMode ? (
                    <>
                      <Pause className="h-3 w-3" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3" />
                      Auto
                    </>
                  )}
                </button>
                <button
                  onClick={resetAll}
                  className="px-2 py-1.5 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-white text-[10px] transition-colors"
                  title="Reset"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              </div>

              {/* Speed (when auto) */}
              {autoMode && (
                <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
                  <label className="text-[10px] text-gray-500 dark:text-gray-400 flex justify-between">
                    <span>Speed</span>
                    <span>{speed}x</span>
                  </label>
                  <input
                    type="range"
                    min={0.5}
                    max={4}
                    step={0.5}
                    value={speed}
                    onChange={e => setSpeed(+e.target.value)}
                    className="w-full h-1 accent-purple-500"
                  />
                </div>
              )}

              {/* About */}
              <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 rounded-lg p-2.5">
                <h4 className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1 mb-1">
                  <Info className="h-3 w-3" />
                  About
                </h4>
                <div className="text-[9px] text-gray-600 dark:text-gray-400 space-y-0.5">
                  <p>
                    <strong>First Fit:</strong> First available hole
                  </p>
                  <p>
                    <strong>Best Fit:</strong> Smallest sufficient hole
                  </p>
                  <p>
                    <strong>Worst Fit:</strong> Largest available hole
                  </p>
                  <p>
                    <strong>Next Fit:</strong> First Fit from last position
                  </p>
                  <p className="pt-0.5">Click blocks on memory bar to free them.</p>
                </div>
              </div>
            </>
          )}

          {/* ===== Sandbox Tab ===== */}
          {tab === 'sandbox' && (
            <>
              {/* Command input */}
              <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-2 space-y-1.5">
                <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1">
                  <Terminal className="h-3 w-3" />
                  Command
                </h4>
                <div className="flex gap-1">
                  <input
                    ref={cmdInputRef}
                    type="text"
                    value={cmdInput}
                    onChange={e => setCmdInput(e.target.value)}
                    onKeyDown={handleCmdKeyDown}
                    placeholder="alloc 32"
                    className="flex-1 min-w-0 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-[10px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 font-mono focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <button
                    onClick={() => {
                      executeCommand(cmdInput);
                      setCmdInput('');
                      cmdInputRef.current?.focus();
                    }}
                    className="px-2 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[10px] transition-colors"
                    title="Run"
                  >
                    <Send className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Output log */}
              <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-2 flex-1 min-h-0 flex flex-col">
                <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Output
                </h4>
                <div
                  ref={sandboxLogRef}
                  className="flex-1 overflow-y-auto min-h-0 space-y-0.5 font-mono"
                >
                  {sandboxLog.map((entry, i) => (
                    <div
                      key={i}
                      className={`text-[9px] leading-tight ${
                        entry.type === 'error'
                          ? 'text-red-500 dark:text-red-400'
                          : entry.type === 'success'
                          ? 'text-green-600 dark:text-green-400'
                          : entry.type === 'warn'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {entry.text}
                    </div>
                  ))}
                </div>
              </div>

              {/* Algorithm selector (sandbox) */}
              <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-2">
                <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Algorithm
                </h4>
                <select
                  value={algorithm}
                  onChange={e => setAlgorithm(e.target.value as Algorithm)}
                  className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-[10px] text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="first-fit">First Fit</option>
                  <option value="best-fit">Best Fit</option>
                  <option value="worst-fit">Worst Fit</option>
                  <option value="next-fit">Next Fit</option>
                </select>
              </div>

              {/* Challenges */}
              <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 rounded-lg p-2.5">
                <h4 className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1 mb-1.5">
                  <Info className="h-3 w-3" />
                  Challenges
                </h4>
                <div className="space-y-1.5">
                  {CHALLENGES.map((c, i) => (
                    <div
                      key={i}
                      className={`text-[9px] p-1.5 rounded border ${
                        completedChallenges[i]
                          ? 'bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700/40'
                          : 'bg-white/60 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700/40'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span
                          className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                            completedChallenges[i]
                              ? 'bg-green-500'
                              : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        />
                        <span
                          className={`font-semibold ${
                            completedChallenges[i]
                              ? 'text-green-700 dark:text-green-300'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {c.title}
                        </span>
                      </div>
                      <p className="text-gray-500 dark:text-gray-500 mt-0.5 ml-3.5">
                        {c.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reset */}
              <button
                onClick={() => {
                  blocksRef.current = [];
                  nextIdRef.current = 1;
                  lastAllocPosRef.current = 0;
                  rerender();
                  setSandboxLog([
                    { text: 'Memory cleared.', type: 'success' },
                    { text: 'Type "help" for available commands.', type: 'info' },
                  ]);
                  setCompletedChallenges(new Array(CHALLENGES.length).fill(false));
                }}
                className="flex items-center justify-center gap-1 w-full px-2 py-1.5 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-white text-[10px] font-medium transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                Reset All
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
