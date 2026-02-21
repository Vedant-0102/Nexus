import React, { useState, useRef, useCallback } from 'react';
import { GitBranch, Plus, Trash2, Info, Move } from 'lucide-react';

interface Node {
  id: number;
  x: number;
  y: number;
}

interface Edge {
  from: number;
  to: number;
  weight: number;
}

export const GraphTheory: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nextIdRef = useRef(3);
  const animTimerRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const [nodes, setNodes] = useState<Node[]>([
    { id: 0, x: 200, y: 150 },
    { id: 1, x: 400, y: 150 },
    { id: 2, x: 300, y: 300 }
  ]);
  const [edges, setEdges] = useState<Edge[]>([
    { from: 0, to: 1, weight: 1 },
    { from: 1, to: 2, weight: 1 },
    { from: 2, to: 0, weight: 1 }
  ]);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [mode, setMode] = useState<'add' | 'connect' | 'delete' | 'drag'>('add');
  const [highlightedNodes, setHighlightedNodes] = useState<number[]>([]);
  const [showAdjMatrix, setShowAdjMatrix] = useState(false);
  const [weightedMode, setWeightedMode] = useState(false);
  const [algorithmRunning, setAlgorithmRunning] = useState(false);
  const [draggingNodeId, setDraggingNodeId] = useState<number | null>(null);

  // --- helpers ---
  const getNeighbors = useCallback((nodeId: number, edgeList: Edge[]) => {
    const nbrs: number[] = [];
    edgeList.forEach(e => {
      if (e.from === nodeId) nbrs.push(e.to);
      if (e.to === nodeId) nbrs.push(e.from);
    });
    return nbrs;
  }, []);

  const degree = (nodeId: number) =>
    edges.filter(e => e.from === nodeId || e.to === nodeId).length;

  const getNodeAt = (x: number, y: number) =>
    nodes.find(n => Math.sqrt((n.x - x) ** 2 + (n.y - y) ** 2) < 20);

  // --- graph property computations ---
  const isConnected = useCallback((): boolean => {
    if (nodes.length <= 1) return true;
    const visited = new Set<number>();
    const stack = [nodes[0].id];
    while (stack.length > 0) {
      const cur = stack.pop()!;
      if (visited.has(cur)) continue;
      visited.add(cur);
      getNeighbors(cur, edges).forEach(n => {
        if (!visited.has(n)) stack.push(n);
      });
    }
    return visited.size === nodes.length;
  }, [nodes, edges, getNeighbors]);

  const isCyclic = useCallback((): boolean => {
    const visited = new Set<number>();
    const dfs = (node: number, parent: number): boolean => {
      visited.add(node);
      for (const nb of getNeighbors(node, edges)) {
        if (!visited.has(nb)) {
          if (dfs(nb, node)) return true;
        } else if (nb !== parent) {
          return true;
        }
      }
      return false;
    };
    for (const n of nodes) {
      if (!visited.has(n.id) && dfs(n.id, -1)) return true;
    }
    return false;
  }, [nodes, edges, getNeighbors]);

  const getAdjMatrix = useCallback((): number[][] => {
    const ids = nodes.map(n => n.id);
    const idx = new Map(ids.map((id, i) => [id, i]));
    const m: number[][] = Array.from({ length: ids.length }, () =>
      Array(ids.length).fill(0)
    );
    edges.forEach(e => {
      const i = idx.get(e.from);
      const j = idx.get(e.to);
      if (i !== undefined && j !== undefined) {
        m[i][j] = weightedMode ? e.weight : 1;
        m[j][i] = weightedMode ? e.weight : 1;
      }
    });
    return m;
  }, [nodes, edges, weightedMode]);

  // --- traversal algorithms with animation ---
  const clearAnim = () => {
    animTimerRef.current.forEach(t => clearTimeout(t));
    animTimerRef.current = [];
    setHighlightedNodes([]);
    setAlgorithmRunning(false);
  };

  const animateTraversal = (order: number[]) => {
    clearAnim();
    setAlgorithmRunning(true);
    order.forEach((id, i) => {
      const t = setTimeout(() => {
        setHighlightedNodes(prev => [...prev, id]);
        if (i === order.length - 1) setAlgorithmRunning(false);
      }, i * 400);
      animTimerRef.current.push(t);
    });
  };

  const runBFS = () => {
    if (nodes.length === 0 || algorithmRunning) return;
    const start = selectedNode ?? nodes[0].id;
    const visited = new Set<number>();
    const queue = [start];
    const order: number[] = [];
    visited.add(start);
    while (queue.length > 0) {
      const cur = queue.shift()!;
      order.push(cur);
      getNeighbors(cur, edges)
        .sort((a, b) => a - b)
        .forEach(nb => {
          if (!visited.has(nb)) {
            visited.add(nb);
            queue.push(nb);
          }
        });
    }
    animateTraversal(order);
  };

  const runDFS = () => {
    if (nodes.length === 0 || algorithmRunning) return;
    const start = selectedNode ?? nodes[0].id;
    const visited = new Set<number>();
    const order: number[] = [];
    const dfs = (node: number) => {
      visited.add(node);
      order.push(node);
      getNeighbors(node, edges)
        .sort((a, b) => a - b)
        .forEach(nb => {
          if (!visited.has(nb)) dfs(nb);
        });
    };
    dfs(start);
    animateTraversal(order);
  };

  // --- drag handlers ---
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'drag') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const node = getNodeAt(x, y);
    if (node) {
      setDraggingNodeId(node.id);
      dragOffsetRef.current = { x: x - node.x, y: y - node.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggingNodeId === null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffsetRef.current.x;
    const y = e.clientY - rect.top - dragOffsetRef.current.y;
    setNodes(prev =>
      prev.map(n => (n.id === draggingNodeId ? { ...n, x, y } : n))
    );
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
  };

  // --- canvas click ---
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode === 'drag') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedNode = getNodeAt(x, y);
    const clickedNodeId = clickedNode?.id ?? -1;

    if (mode === 'add' && !clickedNode) {
      const newId = nextIdRef.current++;
      setNodes([...nodes, { id: newId, x, y }]);
    } else if (mode === 'connect' && clickedNodeId !== -1) {
      if (selectedNode === null) {
        setSelectedNode(clickedNodeId);
      } else {
        if (selectedNode !== clickedNodeId) {
          let weight = 1;
          if (weightedMode) {
            const input = window.prompt('Edge weight:', '1');
            if (input === null) {
              setSelectedNode(null);
              return;
            }
            weight = Math.max(1, parseInt(input) || 1);
          }
          setEdges([...edges, { from: selectedNode, to: clickedNodeId, weight }]);
        }
        setSelectedNode(null);
      }
    } else if (mode === 'delete' && clickedNodeId !== -1) {
      setNodes(nodes.filter(n => n.id !== clickedNodeId));
      setEdges(edges.filter(e => e.from !== clickedNodeId && e.to !== clickedNodeId));
    }
  };

  // --- drawing ---
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const doDraw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const isDark = document.documentElement.classList.contains('dark');
      ctx.fillStyle = isDark ? '#0a0e1a' : '#f8f9fa';
      ctx.fillRect(0, 0, rect.width, rect.height);

      // Draw edges
      edges.forEach(edge => {
        const from = nodes.find(n => n.id === edge.from);
        const to = nodes.find(n => n.id === edge.to);
        if (from && to) {
          ctx.strokeStyle = '#666';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.stroke();

          if (weightedMode) {
            const mx = (from.x + to.x) / 2;
            const my = (from.y + to.y) / 2;
            ctx.fillStyle = isDark ? '#facc15' : '#b45309';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(edge.weight.toString(), mx, my - 10);
          }
        }
      });

      // Draw nodes
      nodes.forEach(node => {
        const hlIdx = highlightedNodes.indexOf(node.id);
        let color = '#4ecdc4';
        if (selectedNode === node.id) color = '#ff6b6b';
        else if (hlIdx !== -1) color = `hsl(${(hlIdx * 40) % 360}, 75%, 55%)`;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = isDark ? '#fff' : '#000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Traversal order badge
        if (hlIdx !== -1) {
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`#${hlIdx + 1}`, node.x, node.y - 28);
        }

        ctx.fillStyle = isDark ? '#fff' : '#000';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.id.toString(), node.x, node.y);
      });
    };

    doDraw();
    const obs = new ResizeObserver(() => doDraw());
    obs.observe(canvas);
    return () => obs.disconnect();
  }, [nodes, edges, selectedNode, highlightedNodes, weightedMode]);

  // --- computed values for render ---
  const adjMatrix = getAdjMatrix();
  const connected = isConnected();
  const cyclic = isCyclic();

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <GitBranch className="h-6 w-6 text-cyan-600" />
          Graph Theory Playground
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Create, analyze, and run algorithms on graphs
        </p>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left: canvas + optional adjacency matrix */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg flex-1">
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className={`w-full border rounded ${
                mode === 'drag' ? 'cursor-grab' : 'cursor-crosshair'
              }`}
              style={{ height: 500 }}
            />
          </div>

          {showAdjMatrix && nodes.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
              <h3 className="font-semibold mb-2 text-sm text-gray-800 dark:text-white">
                Adjacency Matrix
              </h3>
              <div className="overflow-auto max-h-48">
                <table className="text-xs font-mono border-collapse">
                  <thead>
                    <tr>
                      <th className="px-2 py-1" />
                      {nodes.map(n => (
                        <th key={n.id} className="px-2 py-1 text-cyan-600">
                          {n.id}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {adjMatrix.map((row, i) => (
                      <tr key={nodes[i].id}>
                        <td className="px-2 py-1 font-bold text-cyan-600">
                          {nodes[i].id}
                        </td>
                        {row.map((val, j) => (
                          <td
                            key={j}
                            className={`px-2 py-1 text-center text-gray-700 dark:text-gray-300 ${
                              val > 0
                                ? 'bg-cyan-100 dark:bg-cyan-900/40 font-bold'
                                : ''
                            }`}
                          >
                            {val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right: control panels */}
        <div className="w-80 space-y-4 overflow-y-auto pr-1">
          {/* Mode */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3 text-gray-800 dark:text-white">Mode</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setMode('add'); setSelectedNode(null); }}
                className={`py-2 rounded flex items-center justify-center gap-1 text-sm ${
                  mode === 'add'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                <Plus className="h-3.5 w-3.5" /> Add Node
              </button>
              <button
                onClick={() => { setMode('connect'); setSelectedNode(null); }}
                className={`py-2 rounded flex items-center justify-center gap-1 text-sm ${
                  mode === 'connect'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                <GitBranch className="h-3.5 w-3.5" /> Connect
              </button>
              <button
                onClick={() => { setMode('delete'); setSelectedNode(null); }}
                className={`py-2 rounded flex items-center justify-center gap-1 text-sm ${
                  mode === 'delete'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
              <button
                onClick={() => { setMode('drag'); setSelectedNode(null); }}
                className={`py-2 rounded flex items-center justify-center gap-1 text-sm ${
                  mode === 'drag'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                <Move className="h-3.5 w-3.5" /> Drag
              </button>
            </div>
            <label className="flex items-center gap-2 mt-3 text-sm cursor-pointer text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={weightedMode}
                onChange={e => setWeightedMode(e.target.checked)}
                className="accent-cyan-600"
              />
              Weighted edges
            </label>
          </div>

          {/* Algorithms */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3 text-gray-800 dark:text-white">Algorithms</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={runBFS}
                disabled={algorithmRunning || nodes.length === 0}
                className="py-1.5 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40"
              >
                BFS
              </button>
              <button
                onClick={runDFS}
                disabled={algorithmRunning || nodes.length === 0}
                className="py-1.5 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40"
              >
                DFS
              </button>
              <button
                onClick={() => setShowAdjMatrix(p => !p)}
                className={`py-1.5 text-sm rounded ${
                  showAdjMatrix
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                Adj Matrix
              </button>
              <button
                onClick={clearAnim}
                disabled={highlightedNodes.length === 0}
                className="py-1.5 text-sm rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-40"
              >
                Clear HL
              </button>
            </div>
            {algorithmRunning && (
              <p className="text-xs text-cyan-500 mt-2 animate-pulse">
                Running traversal...
              </p>
            )}
            {!algorithmRunning && highlightedNodes.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Order: {highlightedNodes.join(' \u2192 ')}
              </p>
            )}
          </div>

          {/* Graph Properties */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3 text-gray-800 dark:text-white">
              Graph Properties
            </h3>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex justify-between">
                <span>Nodes (V):</span>
                <span className="font-mono">{nodes.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Edges (E):</span>
                <span className="font-mono">{edges.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Density:</span>
                <span className="font-mono">
                  {nodes.length > 1
                    ? (
                        (2 * edges.length) /
                        (nodes.length * (nodes.length - 1))
                      ).toFixed(2)
                    : '0'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Connected:</span>
                <span
                  className={`font-mono font-semibold ${
                    connected ? 'text-green-500' : 'text-red-400'
                  }`}
                >
                  {connected ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Cyclic:</span>
                <span
                  className={`font-mono font-semibold ${
                    cyclic ? 'text-yellow-500' : 'text-gray-400'
                  }`}
                >
                  {cyclic ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Node Degrees */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3 text-gray-800 dark:text-white">
              Node Degrees
            </h3>
            <div className="max-h-32 overflow-y-auto space-y-1 text-sm text-gray-700 dark:text-gray-300">
              {nodes.map(node => (
                <div key={node.id} className="flex justify-between">
                  <span>Node {node.id}:</span>
                  <span className="font-mono">{degree(node.id)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Clear All */}
          <button
            onClick={() => {
              setNodes([]);
              setEdges([]);
              setSelectedNode(null);
              clearAnim();
            }}
            className="w-full py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Clear All
          </button>

          {/* Instructions */}
          <div className="bg-cyan-50 dark:bg-cyan-900/30 rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-cyan-800 dark:text-cyan-300">
              <Info className="h-4 w-4" />
              Instructions
            </h3>
            <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
              <li>• Add: Click canvas to place a node</li>
              <li>• Connect: Click two nodes to link them</li>
              <li>• Delete: Click a node to remove it</li>
              <li>• Drag: Click and drag nodes to rearrange</li>
              <li>• Select a node in Connect mode, then run BFS/DFS</li>
              <li>• Toggle "Weighted edges" to assign edge weights</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
