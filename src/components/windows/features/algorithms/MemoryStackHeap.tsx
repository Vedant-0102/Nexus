import React, { useState, useCallback } from 'react';

interface StackFrame {
  id: number;
  name: string;
  variables: { name: string; value: string; type: string }[];
  returnAddr: string;
  color: string;
}

interface HeapBlock {
  id: number;
  address: string;
  size: number;
  label: string;
  type: string;
  freed: boolean;
  color: string;
  refFrom: string | null; // which stack var points to this
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#10b981'];

const SCENARIOS = [
  {
    label: 'Simple Function Calls',
    steps: [
      {
        desc: 'main() called — stack frame pushed. Local int x = 10 on stack.',
        stack: [{ id: 1, name: 'main()', variables: [{ name: 'x', value: '10', type: 'int' }], returnAddr: 'OS', color: COLORS[0] }],
        heap: [] as HeapBlock[],
      },
      {
        desc: 'main() allocates array on heap: int* arr = new int[5]',
        stack: [{ id: 1, name: 'main()', variables: [{ name: 'x', value: '10', type: 'int' }, { name: 'arr', value: '0x7F20', type: 'int*' }], returnAddr: 'OS', color: COLORS[0] }],
        heap: [{ id: 1, address: '0x7F20', size: 20, label: 'int[5]', type: 'array', freed: false, color: COLORS[1], refFrom: 'arr' }],
      },
      {
        desc: 'foo(arr) called — new stack frame pushed. Parameter is pointer copy.',
        stack: [
          { id: 1, name: 'main()', variables: [{ name: 'x', value: '10', type: 'int' }, { name: 'arr', value: '0x7F20', type: 'int*' }], returnAddr: 'OS', color: COLORS[0] },
          { id: 2, name: 'foo(arr)', variables: [{ name: 'arr', value: '0x7F20', type: 'int*' }, { name: 'sum', value: '0', type: 'int' }], returnAddr: 'main+12', color: COLORS[2] },
        ],
        heap: [{ id: 1, address: '0x7F20', size: 20, label: 'int[5]', type: 'array', freed: false, color: COLORS[1], refFrom: 'arr' }],
      },
      {
        desc: 'foo() allocates string on heap: string* s = new string("hello")',
        stack: [
          { id: 1, name: 'main()', variables: [{ name: 'x', value: '10', type: 'int' }, { name: 'arr', value: '0x7F20', type: 'int*' }], returnAddr: 'OS', color: COLORS[0] },
          { id: 2, name: 'foo(arr)', variables: [{ name: 'arr', value: '0x7F20', type: 'int*' }, { name: 'sum', value: '15', type: 'int' }, { name: 's', value: '0x7F40', type: 'string*' }], returnAddr: 'main+12', color: COLORS[2] },
        ],
        heap: [
          { id: 1, address: '0x7F20', size: 20, label: 'int[5]', type: 'array', freed: false, color: COLORS[1], refFrom: 'arr' },
          { id: 2, address: '0x7F40', size: 32, label: '"hello"', type: 'string', freed: false, color: COLORS[3], refFrom: 's' },
        ],
      },
      {
        desc: 'bar() called from foo() — another frame pushed. Stack grows downward.',
        stack: [
          { id: 1, name: 'main()', variables: [{ name: 'x', value: '10', type: 'int' }, { name: 'arr', value: '0x7F20', type: 'int*' }], returnAddr: 'OS', color: COLORS[0] },
          { id: 2, name: 'foo(arr)', variables: [{ name: 'arr', value: '0x7F20', type: 'int*' }, { name: 'sum', value: '15', type: 'int' }, { name: 's', value: '0x7F40', type: 'string*' }], returnAddr: 'main+12', color: COLORS[2] },
          { id: 3, name: 'bar()', variables: [{ name: 'temp', value: '42', type: 'int' }, { name: 'ptr', value: '0x7F60', type: 'Node*' }], returnAddr: 'foo+24', color: COLORS[4] },
        ],
        heap: [
          { id: 1, address: '0x7F20', size: 20, label: 'int[5]', type: 'array', freed: false, color: COLORS[1], refFrom: 'arr' },
          { id: 2, address: '0x7F40', size: 32, label: '"hello"', type: 'string', freed: false, color: COLORS[3], refFrom: 's' },
          { id: 3, address: '0x7F60', size: 16, label: 'Node', type: 'struct', freed: false, color: COLORS[5], refFrom: 'ptr' },
        ],
      },
      {
        desc: 'bar() returns — frame popped. Node is freed (dangling pointer risk if not careful).',
        stack: [
          { id: 1, name: 'main()', variables: [{ name: 'x', value: '10', type: 'int' }, { name: 'arr', value: '0x7F20', type: 'int*' }], returnAddr: 'OS', color: COLORS[0] },
          { id: 2, name: 'foo(arr)', variables: [{ name: 'arr', value: '0x7F20', type: 'int*' }, { name: 'sum', value: '15', type: 'int' }, { name: 's', value: '0x7F40', type: 'string*' }], returnAddr: 'main+12', color: COLORS[2] },
        ],
        heap: [
          { id: 1, address: '0x7F20', size: 20, label: 'int[5]', type: 'array', freed: false, color: COLORS[1], refFrom: 'arr' },
          { id: 2, address: '0x7F40', size: 32, label: '"hello"', type: 'string', freed: false, color: COLORS[3], refFrom: 's' },
          { id: 3, address: '0x7F60', size: 16, label: 'Node', type: 'struct', freed: true, color: COLORS[5], refFrom: null },
        ],
      },
      {
        desc: 'foo() returns — frame popped. String on heap now has no reference (memory leak!).',
        stack: [
          { id: 1, name: 'main()', variables: [{ name: 'x', value: '10', type: 'int' }, { name: 'arr', value: '0x7F20', type: 'int*' }], returnAddr: 'OS', color: COLORS[0] },
        ],
        heap: [
          { id: 1, address: '0x7F20', size: 20, label: 'int[5]', type: 'array', freed: false, color: COLORS[1], refFrom: 'arr' },
          { id: 2, address: '0x7F40', size: 32, label: '"hello"', type: 'string', freed: false, color: COLORS[3], refFrom: null },
          { id: 3, address: '0x7F60', size: 16, label: 'Node', type: 'struct', freed: true, color: COLORS[5], refFrom: null },
        ],
      },
      {
        desc: 'main() calls delete[] arr — heap memory properly freed. main() returns.',
        stack: [],
        heap: [
          { id: 1, address: '0x7F20', size: 20, label: 'int[5]', type: 'array', freed: true, color: COLORS[1], refFrom: null },
          { id: 2, address: '0x7F40', size: 32, label: '"hello"', type: 'string', freed: false, color: COLORS[3], refFrom: null },
          { id: 3, address: '0x7F60', size: 16, label: 'Node', type: 'struct', freed: true, color: COLORS[5], refFrom: null },
        ],
      },
    ],
  },
  {
    label: 'Recursive Fibonacci',
    steps: [
      {
        desc: 'main() calls fib(4). Stack frame created.',
        stack: [
          { id: 1, name: 'main()', variables: [{ name: 'result', value: '?', type: 'int' }], returnAddr: 'OS', color: COLORS[0] },
          { id: 2, name: 'fib(4)', variables: [{ name: 'n', value: '4', type: 'int' }], returnAddr: 'main+8', color: COLORS[1] },
        ],
        heap: [],
      },
      {
        desc: 'fib(4) calls fib(3). Each recursive call adds a stack frame.',
        stack: [
          { id: 1, name: 'main()', variables: [{ name: 'result', value: '?', type: 'int' }], returnAddr: 'OS', color: COLORS[0] },
          { id: 2, name: 'fib(4)', variables: [{ name: 'n', value: '4', type: 'int' }], returnAddr: 'main+8', color: COLORS[1] },
          { id: 3, name: 'fib(3)', variables: [{ name: 'n', value: '3', type: 'int' }], returnAddr: 'fib+12', color: COLORS[2] },
        ],
        heap: [],
      },
      {
        desc: 'fib(3) calls fib(2). Stack depth increases — risk of overflow for large n!',
        stack: [
          { id: 1, name: 'main()', variables: [{ name: 'result', value: '?', type: 'int' }], returnAddr: 'OS', color: COLORS[0] },
          { id: 2, name: 'fib(4)', variables: [{ name: 'n', value: '4', type: 'int' }], returnAddr: 'main+8', color: COLORS[1] },
          { id: 3, name: 'fib(3)', variables: [{ name: 'n', value: '3', type: 'int' }], returnAddr: 'fib+12', color: COLORS[2] },
          { id: 4, name: 'fib(2)', variables: [{ name: 'n', value: '2', type: 'int' }], returnAddr: 'fib+12', color: COLORS[3] },
        ],
        heap: [],
      },
      {
        desc: 'fib(2) calls fib(1) → returns 1. fib(2) calls fib(0) → returns 0. fib(2) = 1.',
        stack: [
          { id: 1, name: 'main()', variables: [{ name: 'result', value: '?', type: 'int' }], returnAddr: 'OS', color: COLORS[0] },
          { id: 2, name: 'fib(4)', variables: [{ name: 'n', value: '4', type: 'int' }], returnAddr: 'main+8', color: COLORS[1] },
          { id: 3, name: 'fib(3)', variables: [{ name: 'n', value: '3', type: 'int' }, { name: 'left', value: '1', type: 'int' }], returnAddr: 'fib+12', color: COLORS[2] },
        ],
        heap: [],
      },
      {
        desc: 'fib(3) now calls fib(1) → returns 1. fib(3) = 1 + 1 = 2.',
        stack: [
          { id: 1, name: 'main()', variables: [{ name: 'result', value: '?', type: 'int' }], returnAddr: 'OS', color: COLORS[0] },
          { id: 2, name: 'fib(4)', variables: [{ name: 'n', value: '4', type: 'int' }, { name: 'left', value: '2', type: 'int' }], returnAddr: 'main+8', color: COLORS[1] },
        ],
        heap: [],
      },
      {
        desc: 'fib(4) calls fib(2) → returns 1. fib(4) = 2 + 1 = 3. Returns to main.',
        stack: [
          { id: 1, name: 'main()', variables: [{ name: 'result', value: '3', type: 'int' }], returnAddr: 'OS', color: COLORS[0] },
        ],
        heap: [],
      },
    ],
  },
];

export const MemoryStackHeap: React.FC = () => {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [step, setStep] = useState(0);

  const scenario = SCENARIOS[scenarioIdx];
  const currentStep = scenario.steps[step];

  const changeScenario = useCallback((idx: number) => {
    setScenarioIdx(idx);
    setStep(0);
  }, []);

  const totalUsedHeap = currentStep.heap.filter(b => !b.freed).reduce((s, b) => s + b.size, 0);
  const totalFreedHeap = currentStep.heap.filter(b => b.freed).reduce((s, b) => s + b.size, 0);
  const leakedBlocks = currentStep.heap.filter(b => !b.freed && !b.refFrom);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-cyan-50 dark:from-gray-950 dark:to-cyan-950 p-3 overflow-hidden">
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        <select value={scenarioIdx} onChange={e => changeScenario(Number(e.target.value))}
          className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
          {SCENARIOS.map((s, i) => <option key={i} value={i}>{s.label}</option>)}
        </select>

        <div className="flex gap-1 ml-auto">
          <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
            className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50">← Prev</button>
          <button onClick={() => setStep(s => Math.min(scenario.steps.length - 1, s + 1))} disabled={step === scenario.steps.length - 1}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Next →</button>
          <button onClick={() => setStep(0)} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">↺ Reset</button>
        </div>
      </div>

      <div className="text-xs text-gray-600 dark:text-gray-400 bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 mb-2">
        <strong>Step {step + 1}/{scenario.steps.length}:</strong> {currentStep.desc}
      </div>

      <div className="flex-1 min-h-0 flex gap-4 overflow-hidden">
        {/* Stack */}
        <div className="flex-1 flex flex-col">
          <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs">STACK</span>
            <span className="text-xs font-normal text-gray-500">High Address ↑ | Grows ↓</span>
          </div>
          <div className="flex-1 overflow-auto flex flex-col-reverse gap-1 bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 border border-blue-200 dark:border-blue-800">
            {currentStep.stack.length === 0 ? (
              <div className="text-xs text-gray-400 italic text-center py-4">Stack empty</div>
            ) : (
              currentStep.stack.map((frame, i) => (
                <div key={frame.id} className={`rounded-lg p-2 border-2 transition-all duration-300`}
                  style={{ borderColor: frame.color, backgroundColor: `${frame.color}15` }}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold" style={{ color: frame.color }}>{frame.name}</span>
                    <span className="text-[10px] text-gray-500 font-mono">ret: {frame.returnAddr}</span>
                  </div>
                  <div className="space-y-0.5">
                    {frame.variables.map((v, vi) => (
                      <div key={vi} className="flex items-center gap-2 text-[10px] font-mono">
                        <span className="text-gray-500">{v.type}</span>
                        <span className="font-bold text-gray-700 dark:text-gray-300">{v.name}</span>
                        <span className="text-gray-400">=</span>
                        <span className={`font-bold ${v.value.startsWith('0x') ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'}`}>
                          {v.value}
                        </span>
                      </div>
                    ))}
                  </div>
                  {i === currentStep.stack.length - 1 && (
                    <div className="mt-1 text-[10px] text-amber-600 font-bold">◄ TOP OF STACK (current frame)</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Heap */}
        <div className="flex-1 flex flex-col">
          <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <span className="bg-green-500 text-white px-2 py-0.5 rounded text-xs">HEAP</span>
            <span className="text-xs font-normal text-gray-500">Dynamic allocation | Grows ↑</span>
          </div>
          <div className="flex-1 overflow-auto flex flex-col gap-1 bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 border border-green-200 dark:border-green-800">
            {currentStep.heap.length === 0 ? (
              <div className="text-xs text-gray-400 italic text-center py-4">Heap empty — no dynamic allocations</div>
            ) : (
              currentStep.heap.map(block => (
                <div key={block.id} className={`rounded-lg p-2 border-2 transition-all duration-300 ${block.freed ? 'opacity-50 border-dashed' : ''}`}
                  style={{ borderColor: block.freed ? '#94a3b8' : block.color, backgroundColor: block.freed ? '#f1f5f915' : `${block.color}15` }}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold" style={{ color: block.freed ? '#94a3b8' : block.color }}>
                      {block.label} {block.freed && '(FREED)'}
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">{block.address} | {block.size}B</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-gray-500">{block.type}</span>
                    {block.refFrom && (
                      <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">← {block.refFrom}</span>
                    )}
                    {!block.freed && !block.refFrom && (
                      <span className="text-[10px] text-red-500 font-bold">⚠ LEAKED (no reference)</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Stats */}
          <div className="mt-2 text-[10px] text-gray-500 dark:text-gray-400 space-y-0.5">
            <div>Heap used: <span className="font-bold text-green-600">{totalUsedHeap}B</span> | Freed: <span className="font-bold text-gray-400">{totalFreedHeap}B</span></div>
            {leakedBlocks.length > 0 && (
              <div className="text-red-500 font-bold">⚠ Memory leaks: {leakedBlocks.length} block(s) with no reference!</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2 bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 text-[10px] text-gray-500 dark:text-gray-400 grid grid-cols-3 gap-4">
        <div><strong>Stack:</strong> Auto-managed (LIFO), stores locals, params, return addresses. Fixed size per thread.</div>
        <div><strong>Heap:</strong> Manually managed (malloc/new/free/delete). Larger but slower. Fragmentation risk.</div>
        <div><strong>Pointers:</strong> Stack vars can reference heap objects. Dangling pointers & memory leaks are common bugs.</div>
      </div>
    </div>
  );
};
