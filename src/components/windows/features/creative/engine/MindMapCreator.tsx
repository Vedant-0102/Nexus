import React, { useState, useRef } from 'react';
import { Brain, Plus, Trash2, Download, Upload, ZoomIn, ZoomOut, Edit2, Check, X, Undo, Redo, Square, Circle, Diamond, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Node {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  parentId: string | null;
  children: string[];
  shape: 'circle' | 'square' | 'diamond' | 'cloud';
  fontSize: number;
  borderWidth: number;
}

interface HistoryState {
  nodes: Node[];
}

export const MindMapCreator: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([
    {
      id: '1',
      text: 'Main Idea',
      x: 400,
      y: 300,
      color: '#3b82f6',
      parentId: null,
      children: [],
      shape: 'circle',
      fontSize: 14,
      borderWidth: 2
    }
  ]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [lineStyle, setLineStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid');
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const canvasRef = useRef<HTMLDivElement>(null);

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
  const shapes: Array<'circle' | 'square' | 'diamond' | 'cloud'> = ['circle', 'square', 'diamond', 'cloud'];

  const saveToHistory = () => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: JSON.parse(JSON.stringify(nodes)) });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setNodes(JSON.parse(JSON.stringify(history[historyIndex - 1].nodes)));
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setNodes(JSON.parse(JSON.stringify(history[historyIndex + 1].nodes)));
    }
  };

  const addChildNode = (parentId: string) => {
    saveToHistory();
    const parent = nodes.find(n => n.id === parentId);
    if (!parent) return;

    const newNode: Node = {
      id: Date.now().toString(),
      text: 'New Node',
      x: parent.x + 200,
      y: parent.y + (parent.children.length * 80) - 40,
      color: colors[Math.floor(Math.random() * colors.length)],
      parentId: parentId,
      children: [],
      shape: 'circle',
      fontSize: 14,
      borderWidth: 2
    };

    setNodes(prev => {
      const updated = prev.map(n =>
        n.id === parentId ? { ...n, children: [...n.children, newNode.id] } : n
      );
      return [...updated, newNode];
    });
  };

  const addSiblingNode = (nodeId: string) => {
    saveToHistory();
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !node.parentId) return;

    const parent = nodes.find(n => n.id === node.parentId);
    if (!parent) return;

    const newNode: Node = {
      id: Date.now().toString(),
      text: 'Sibling Node',
      x: node.x,
      y: node.y + 80,
      color: colors[Math.floor(Math.random() * colors.length)],
      parentId: node.parentId,
      children: [],
      shape: 'circle',
      fontSize: 14,
      borderWidth: 2
    };

    setNodes(prev => {
      const updated = prev.map(n =>
        n.id === node.parentId ? { ...n, children: [...n.children, newNode.id] } : n
      );
      return [...updated, newNode];
    });
  };

  const deleteNode = (nodeId: string) => {
    saveToHistory();
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !node.parentId) return;

    // Recursively collect all descendant IDs
    const getDescendants = (id: string): string[] => {
      const n = nodes.find(node => node.id === id);
      if (!n) return [];
      let descendants = [id];
      n.children.forEach(childId => {
        descendants = [...descendants, ...getDescendants(childId)];
      });
      return descendants;
    };

    const toDelete = getDescendants(nodeId);

    setNodes(prev => {
      const updated = prev.map(n =>
        n.id === node.parentId ? { ...n, children: n.children.filter(id => id !== nodeId) } : n
      );
      return updated.filter(n => !toDelete.includes(n.id));
    });
    setSelectedNode(null);
  };

  const updateNodeText = (nodeId: string, text: string) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, text } : n));
  };

  const updateNodeStyle = (nodeId: string, updates: Partial<Node>) => {
    saveToHistory();
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, ...updates } : n));
  };

  // Recursive dragging - move node and all children
  const moveNodeWithChildren = (nodeId: string, deltaX: number, deltaY: number) => {
    const getDescendants = (id: string): string[] => {
      const n = nodes.find(node => node.id === id);
      if (!n) return [];
      let descendants = [id];
      n.children.forEach(childId => {
        descendants = [...descendants, ...getDescendants(childId)];
      });
      return descendants;
    };

    const toMove = getDescendants(nodeId);
    
    setNodes(prev => prev.map(n =>
      toMove.includes(n.id) ? { ...n, x: n.x + deltaX, y: n.y + deltaY } : n
    ));
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (e.button === 2) return;
    e.stopPropagation();
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setSelectedNode(nodeId);
    setDraggingNode(nodeId);
    setDragOffset({
      x: e.clientX - node.x * zoom - pan.x,
      y: e.clientY - node.y * zoom - pan.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNode) {
      const node = nodes.find(n => n.id === draggingNode);
      if (!node) return;

      const newX = (e.clientX - dragOffset.x - pan.x) / zoom;
      const newY = (e.clientY - dragOffset.y - pan.y) / zoom;
      
      const deltaX = newX - node.x;
      const deltaY = newY - node.y;

      moveNodeWithChildren(draggingNode, deltaX, deltaY);
    } else if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  const handleMouseUp = () => {
    if (draggingNode) {
      saveToHistory();
    }
    setDraggingNode(null);
    setIsPanning(false);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !draggingNode) {
      setIsPanning(true);
      setPanStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y
      });
      setSelectedNode(null);
    }
  };

  const startEdit = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setEditingNode(nodeId);
      setEditText(node.text);
    }
  };

  const finishEdit = () => {
    if (editingNode) {
      saveToHistory();
      updateNodeText(editingNode, editText);
      setEditingNode(null);
    }
  };

  const autoLayout = () => {
    saveToHistory();
    const layoutNodes = (nodeId: string, x: number, y: number, level: number): void => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;

      node.x = x;
      node.y = y;

      const childSpacing = 100;
      const levelSpacing = 200;
      
      node.children.forEach((childId, index) => {
        const childY = y + (index - (node.children.length - 1) / 2) * childSpacing;
        layoutNodes(childId, x + levelSpacing, childY, level + 1);
      });
    };

    const root = nodes.find(n => n.parentId === null);
    if (root) {
      layoutNodes(root.id, 100, 300, 0);
      setNodes([...nodes]);
    }
  };

  const exportMindMap = () => {
    const data = JSON.stringify(nodes, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mindmap.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importMindMap = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            saveToHistory();
            setNodes(data);
          } catch (err) {
            alert('Invalid file format');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const drawConnection = (parent: Node, child: Node) => {
    const startX = parent.x * zoom + pan.x + 60;
    const startY = parent.y * zoom + pan.y + 20;
    const endX = child.x * zoom + pan.x;
    const endY = child.y * zoom + pan.y + 20;

    const midX = (startX + endX) / 2;

    const strokeDasharray = lineStyle === 'dashed' ? '10,5' : lineStyle === 'dotted' ? '2,3' : 'none';

    return (
      <path
        key={`${parent.id}-${child.id}`}
        d={`M ${startX} ${startY} Q ${midX} ${startY}, ${midX} ${(startY + endY) / 2} Q ${midX} ${endY}, ${endX} ${endY}`}
        stroke={parent.color}
        strokeWidth="2"
        fill="none"
        opacity="0.6"
        strokeDasharray={strokeDasharray}
      />
    );
  };

  const renderNode = (node: Node) => {
    const isEditing = editingNode === node.id;
    const isSelected = selectedNode === node.id;

    const shapeStyles: Record<string, string> = {
      circle: 'rounded-full',
      square: 'rounded-lg',
      diamond: 'rotate-45',
      cloud: 'rounded-[50%_50%_50%_50%/60%_60%_40%_40%]'
    };

    return (
      <div
        key={node.id}
        className={`absolute cursor-move select-none transition-all ${
          isSelected ? 'ring-4 ring-purple-500 shadow-2xl scale-105' : 'shadow-md'
        }`}
        style={{
          left: node.x * zoom + pan.x,
          top: node.y * zoom + pan.y,
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
        }}
        onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
      >
        {isEditing ? (
          <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border-2 border-purple-500">
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') finishEdit();
                if (e.key === 'Escape') setEditingNode(null);
              }}
              className="px-2 py-1 border rounded dark:bg-gray-700 dark:text-white text-sm w-32"
              autoFocus
            />
            <button onClick={finishEdit} className="p-1 text-green-600 hover:bg-green-50 rounded">
              <Check className="h-4 w-4" />
            </button>
            <button onClick={() => setEditingNode(null)} className="p-1 text-red-600 hover:bg-red-50 rounded">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div
            className={`px-4 py-2 text-white font-medium text-center min-w-[120px] ${shapeStyles[node.shape]} ${
              node.shape === 'diamond' ? 'p-6' : ''
            }`}
            style={{
              backgroundColor: node.color,
              fontSize: `${node.fontSize}px`,
              borderWidth: `${node.borderWidth}px`,
              borderColor: 'rgba(0,0,0,0.2)',
              borderStyle: 'solid'
            }}
            onDoubleClick={() => startEdit(node.id)}
          >
            <span className={node.shape === 'diamond' ? '-rotate-45 block' : ''}>
              {node.text}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-purple-600" />
          <h2 className="text-xl font-bold dark:text-white">Mind Map Creator</h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={undo} disabled={historyIndex <= 0} size="sm" variant="outline">
            <Undo className="h-4 w-4" />
          </Button>
          <Button onClick={redo} disabled={historyIndex >= history.length - 1} size="sm" variant="outline">
            <Redo className="h-4 w-4" />
          </Button>
          <Button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} size="sm" variant="outline">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button onClick={() => setZoom(z => Math.min(2, z + 0.1))} size="sm" variant="outline">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} size="sm" variant="outline">
            Reset
          </Button>
          <Button onClick={autoLayout} size="sm" variant="outline">
            Auto Layout
          </Button>
          <Button onClick={importMindMap} size="sm" variant="outline">
            <Upload className="h-4 w-4" />
          </Button>
          <Button onClick={exportMindMap} size="sm" className="bg-purple-600 hover:bg-purple-700">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      {selectedNode && (
        <div className="p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold dark:text-white">Node Style:</span>
          
          {/* Shapes */}
          <div className="flex gap-1">
            <Button
              onClick={() => updateNodeStyle(selectedNode, { shape: 'circle' })}
              size="sm"
              variant="outline"
              title="Circle"
            >
              <Circle className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => updateNodeStyle(selectedNode, { shape: 'square' })}
              size="sm"
              variant="outline"
              title="Square"
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => updateNodeStyle(selectedNode, { shape: 'diamond' })}
              size="sm"
              variant="outline"
              title="Diamond"
            >
              <Diamond className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => updateNodeStyle(selectedNode, { shape: 'cloud' })}
              size="sm"
              variant="outline"
              title="Cloud"
            >
              <Cloud className="h-4 w-4" />
            </Button>
          </div>

          <div className="w-px h-6 bg-gray-300" />

          {/* Colors */}
          <div className="flex gap-1">
            {colors.map(color => (
              <button
                key={color}
                onClick={() => updateNodeStyle(selectedNode, { color })}
                className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-gray-500"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          <div className="w-px h-6 bg-gray-300" />

          {/* Font Size */}
          <select
            value={nodes.find(n => n.id === selectedNode)?.fontSize || 14}
            onChange={(e) => updateNodeStyle(selectedNode, { fontSize: parseInt(e.target.value) })}
            className="px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:text-white"
          >
            <option value="12">12px</option>
            <option value="14">14px</option>
            <option value="16">16px</option>
            <option value="18">18px</option>
            <option value="20">20px</option>
          </select>

          {/* Border Width */}
          <select
            value={nodes.find(n => n.id === selectedNode)?.borderWidth || 2}
            onChange={(e) => updateNodeStyle(selectedNode, { borderWidth: parseInt(e.target.value) })}
            className="px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:text-white"
          >
            <option value="1">Thin</option>
            <option value="2">Normal</option>
            <option value="3">Thick</option>
          </select>

          <div className="w-px h-6 bg-gray-300" />

          {/* Line Style */}
          <select
            value={lineStyle}
            onChange={(e) => setLineStyle(e.target.value as any)}
            className="px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:text-white"
          >
            <option value="solid">Solid Line</option>
            <option value="dashed">Dashed Line</option>
            <option value="dotted">Dotted Line</option>
          </select>

          <div className="w-px h-6 bg-gray-300" />

          {/* Actions */}
          <Button onClick={() => addChildNode(selectedNode)} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Child
          </Button>
          <Button onClick={() => addSiblingNode(selectedNode)} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Sibling
          </Button>
          <Button onClick={() => startEdit(selectedNode)} size="sm" variant="outline">
            <Edit2 className="h-4 w-4 mr-1" />
            Edit
          </Button>
          {nodes.find(n => n.id === selectedNode)?.parentId && (
            <Button onClick={() => deleteNode(selectedNode)} size="sm" variant="outline" className="text-red-600">
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          )}
        </div>
      )}

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden cursor-move bg-gray-50 dark:bg-gray-900"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* SVG for connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {nodes.map(node =>
            node.children.map(childId => {
              const child = nodes.find(n => n.id === childId);
              return child ? drawConnection(node, child) : null;
            })
          )}
        </svg>

        {/* Nodes */}
        {nodes.map(node => renderNode(node))}
      </div>

      {/* Instructions */}
      <div className="p-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <span>💡 <strong>Tip:</strong> Click to select • Double-click to edit • Drag to move (moves children too) • Drag canvas to pan</span>
          <span className="text-purple-600 dark:text-purple-400">
            {nodes.length} nodes • Zoom: {Math.round(zoom * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};
