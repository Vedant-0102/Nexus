import React, { useState, useRef } from 'react';
import { GitBranch, Plus, Trash2, Info } from 'lucide-react';

interface Node {
  id: number;
  x: number;
  y: number;
}

interface Edge {
  from: number;
  to: number;
}

export const GraphTheory: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Node[]>([
    { id: 0, x: 200, y: 150 },
    { id: 1, x: 400, y: 150 },
    { id: 2, x: 300, y: 300 }
  ]);
  const [edges, setEdges] = useState<Edge[]>([
    { from: 0, to: 1 },
    { from: 1, to: 2 },
    { from: 2, to: 0 }
  ]);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [mode, setMode] = useState<'add' | 'connect' | 'delete'>('add');

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedNode = nodes.findIndex(n => 
      Math.sqrt((n.x - x) ** 2 + (n.y - y) ** 2) < 20
    );

    if (mode === 'add' && clickedNode === -1) {
      setNodes([...nodes, { id: nodes.length, x, y }]);
    } else if (mode === 'connect' && clickedNode !== -1) {
      if (selectedNode === null) {
        setSelectedNode(clickedNode);
      } else {
        if (selectedNode !== clickedNode) {
          setEdges([...edges, { from: selectedNode, to: clickedNode }]);
        }
        setSelectedNode(null);
      }
    } else if (mode === 'delete' && clickedNode !== -1) {
      setNodes(nodes.filter(n => n.id !== clickedNode));
      setEdges(edges.filter(e => e.from !== clickedNode && e.to !== clickedNode));
    }
  };

  React.useEffect(() => {
    draw();
  }, [nodes, edges, selectedNode]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw edges
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    edges.forEach(edge => {
      const from = nodes.find(n => n.id === edge.from);
      const to = nodes.find(n => n.id === edge.to);
      if (from && to) {
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      ctx.fillStyle = selectedNode === node.id ? '#ff6b6b' : '#4ecdc4';
      ctx.beginPath();
      ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#000';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.id.toString(), node.x, node.y);
    });
  };

  const degree = (nodeId: number) => {
    return edges.filter(e => e.from === nodeId || e.to === nodeId).length;
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <GitBranch className="h-6 w-6 text-cyan-600" />
          Graph Theory Playground
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Create and analyze graphs
        </p>
      </div>

      <div className="flex-1 flex gap-6">
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
            <canvas
              ref={canvasRef}
              width={600}
              height={500}
              onClick={handleCanvasClick}
              className="w-full border rounded cursor-crosshair"
            />
          </div>
        </div>

        <div className="w-80 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Mode</h3>
            <div className="space-y-2">
              <button
                onClick={() => { setMode('add'); setSelectedNode(null); }}
                className={`w-full py-2 rounded flex items-center justify-center gap-2 ${mode === 'add' ? 'bg-cyan-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <Plus className="h-4 w-4" />
                Add Node
              </button>
              <button
                onClick={() => { setMode('connect'); setSelectedNode(null); }}
                className={`w-full py-2 rounded flex items-center justify-center gap-2 ${mode === 'connect' ? 'bg-cyan-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <GitBranch className="h-4 w-4" />
                Connect Nodes
              </button>
              <button
                onClick={() => { setMode('delete'); setSelectedNode(null); }}
                className={`w-full py-2 rounded flex items-center justify-center gap-2 ${mode === 'delete' ? 'bg-cyan-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <Trash2 className="h-4 w-4" />
                Delete Node
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Graph Properties</h3>
            <div className="space-y-2 text-sm">
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
                  {nodes.length > 1 ? ((2 * edges.length) / (nodes.length * (nodes.length - 1))).toFixed(2) : '0'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-3">Node Degrees</h3>
            <div className="max-h-40 overflow-y-auto space-y-1 text-sm">
              {nodes.map(node => (
                <div key={node.id} className="flex justify-between">
                  <span>Node {node.id}:</span>
                  <span className="font-mono">{degree(node.id)}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              setNodes([]);
              setEdges([]);
              setSelectedNode(null);
            }}
            className="w-full py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Clear All
          </button>

          <div className="bg-cyan-50 dark:bg-cyan-900/30 rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-cyan-800 dark:text-cyan-300">
              <Info className="h-4 w-4" />
              Instructions
            </h3>
            <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
              <li>• Add: Click canvas to add nodes</li>
              <li>• Connect: Click two nodes to connect</li>
              <li>• Delete: Click node to remove</li>
              <li>• Degree = number of connections</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
