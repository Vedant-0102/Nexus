import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Brain, Plus, Trash2, Download, Upload, ZoomIn, ZoomOut, Edit2, Check, X, Undo, Redo, Square, Circle, Diamond, Cloud, ChevronRight, Maximize, Search, Star, Flag, CheckCircle, StickyNote, FoldVertical, UnfoldVertical, ImageDown } from 'lucide-react';
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
  collapsed: boolean;
  notes: string;
  priority: 'none' | 'star' | 'flag' | 'check';
}

interface HistoryState {
  nodes: Node[];
}

const HISTORY_CAP = 50;

const INITIAL_NODE: Node = {
  id: '1', text: 'Main Idea', x: 400, y: 300, color: '#3b82f6',
  parentId: null, children: [], shape: 'circle', fontSize: 14,
  borderWidth: 2, collapsed: false, notes: '', priority: 'none',
};

const COLOR_GROUPS = {
  blues: ['#3b82f6', '#2563eb', '#1d4ed8', '#06b6d4'],
  greens: ['#10b981', '#059669', '#16a34a', '#84cc16'],
  warms: ['#f59e0b', '#f97316', '#ef4444', '#dc2626'],
  purples: ['#8b5cf6', '#7c3aed', '#a855f7', '#ec4899'],
  neutrals: ['#6b7280', '#374151', '#1f2937', '#f3f4f6'],
};
const ALL_COLORS = Object.values(COLOR_GROUPS).flat();

function lightenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0x00ff) + amount);
  const b = Math.min(255, (num & 0x0000ff) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function defaultNode(overrides: Partial<Node> & { id: string; text: string; x: number; y: number; color: string; parentId: string | null }): Node {
  return {
    children: [], shape: 'circle', fontSize: 14, borderWidth: 2,
    collapsed: false, notes: '', priority: 'none', ...overrides,
  };
}

export const MindMapCreator: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([{ ...INITIAL_NODE }]);
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
  const [history, setHistory] = useState<HistoryState[]>([{ nodes: [{ ...INITIAL_NODE }] }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const canvasRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  // ---- Visibility map (collapsed branches) ----
  const visibilityMap = useMemo(() => {
    const map = new Map<string, boolean>();
    const check = (id: string): boolean => {
      if (map.has(id)) return map.get(id)!;
      const node = nodes.find(n => n.id === id);
      if (!node || !node.parentId) { map.set(id, true); return true; }
      const parent = nodes.find(n => n.id === node.parentId);
      if (!parent) { map.set(id, true); return true; }
      if (parent.collapsed) { map.set(id, false); return false; }
      const result = check(parent.id);
      map.set(id, result);
      return result;
    };
    nodes.forEach(n => check(n.id));
    return map;
  }, [nodes]);

  const selectedNodeObj = useMemo(() => nodes.find(n => n.id === selectedNode), [nodes, selectedNode]);

  // ---- Descendant helpers ----
  const getDescendants = useCallback((id: string, nodeList: Node[]): string[] => {
    const n = nodeList.find(node => node.id === id);
    if (!n) return [];
    let desc = [id];
    n.children.forEach(childId => { desc = [...desc, ...getDescendants(childId, nodeList)]; });
    return desc;
  }, []);

  const getDescendantCount = useCallback((nodeId: string): number => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return 0;
    let count = node.children.length;
    node.children.forEach(cid => { count += getDescendantCount(cid); });
    return count;
  }, [nodes]);

  // ---- History ----
  const saveToHistory = useCallback(() => {
    const snap = JSON.parse(JSON.stringify(nodesRef.current));
    setHistory(prev => {
      const h = prev.slice(0, historyIndex + 1);
      h.push({ nodes: snap });
      if (h.length > HISTORY_CAP) h.shift();
      return h;
    });
    setHistoryIndex(prev => Math.min(prev + 1, HISTORY_CAP - 1));
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setNodes(JSON.parse(JSON.stringify(history[historyIndex - 1].nodes)));
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setNodes(JSON.parse(JSON.stringify(history[historyIndex + 1].nodes)));
    }
  }, [history, historyIndex]);

  // ---- Node CRUD ----
  const addChildNode = useCallback((parentId: string) => {
    const parent = nodesRef.current.find(n => n.id === parentId);
    if (!parent) return;
    saveToHistory();
    const newNode = defaultNode({
      id: Date.now().toString(), text: 'New Node',
      x: parent.x + 220, y: parent.y + (parent.children.length * 80) - 40,
      color: ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)],
      parentId,
    });
    setNodes(prev => {
      const updated = prev.map(n => n.id === parentId ? { ...n, children: [...n.children, newNode.id] } : n);
      return [...updated, newNode];
    });
  }, [saveToHistory]);

  const addSiblingNode = useCallback((nodeId: string) => {
    const node = nodesRef.current.find(n => n.id === nodeId);
    if (!node || !node.parentId) return;
    const parent = nodesRef.current.find(n => n.id === node.parentId);
    if (!parent) return;
    saveToHistory();
    const newNode = defaultNode({
      id: Date.now().toString(), text: 'Sibling Node',
      x: node.x, y: node.y + 80,
      color: ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)],
      parentId: node.parentId,
    });
    setNodes(prev => {
      const updated = prev.map(n => n.id === node.parentId ? { ...n, children: [...n.children, newNode.id] } : n);
      return [...updated, newNode];
    });
  }, [saveToHistory]);

  const deleteNode = useCallback((nodeId: string) => {
    const node = nodesRef.current.find(n => n.id === nodeId);
    if (!node || !node.parentId) return;
    saveToHistory();
    const toDelete = getDescendants(nodeId, nodesRef.current);
    setNodes(prev => {
      const updated = prev.map(n => n.id === node.parentId ? { ...n, children: n.children.filter(id => id !== nodeId) } : n);
      return updated.filter(n => !toDelete.includes(n.id));
    });
    setSelectedNode(null);
  }, [saveToHistory, getDescendants]);

  const updateNodeText = useCallback((nodeId: string, text: string) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, text } : n));
  }, []);

  const updateNodeStyle = useCallback((nodeId: string, updates: Partial<Node>) => {
    saveToHistory();
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, ...updates } : n));
  }, [saveToHistory]);

  const toggleCollapse = useCallback((nodeId: string) => {
    saveToHistory();
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, collapsed: !n.collapsed } : n));
  }, [saveToHistory]);

  // ---- Drag / Pan ----
  const moveNodeWithChildren = useCallback((nodeId: string, deltaX: number, deltaY: number) => {
    const toMove = getDescendants(nodeId, nodesRef.current);
    setNodes(prev => prev.map(n => toMove.includes(n.id) ? { ...n, x: n.x + deltaX, y: n.y + deltaY } : n));
  }, [getDescendants]);

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (e.button === 2) return;
    e.stopPropagation();
    const node = nodesRef.current.find(n => n.id === nodeId);
    if (!node) return;
    setSelectedNode(nodeId);
    setDraggingNode(nodeId);
    setDragOffset({ x: e.clientX - node.x * zoom - pan.x, y: e.clientY - node.y * zoom - pan.y });
  }, [zoom, pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const cx = e.clientX;
    const cy = e.clientY;
    rafRef.current = requestAnimationFrame(() => {
      if (draggingNode) {
        const node = nodesRef.current.find(n => n.id === draggingNode);
        if (!node) return;
        const newX = (cx - dragOffset.x - pan.x) / zoom;
        const newY = (cy - dragOffset.y - pan.y) / zoom;
        moveNodeWithChildren(draggingNode, newX - node.x, newY - node.y);
      } else if (isPanning) {
        setPan({ x: cx - panStart.x, y: cy - panStart.y });
      }
    });
  }, [draggingNode, isPanning, dragOffset, zoom, pan, panStart, moveNodeWithChildren]);

  const handleMouseUp = useCallback(() => {
    if (draggingNode) saveToHistory();
    setDraggingNode(null);
    setIsPanning(false);
  }, [draggingNode, saveToHistory]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 && !draggingNode) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      setSelectedNode(null);
    }
  }, [draggingNode, pan]);

  // ---- Edit ----
  const startEdit = useCallback((nodeId: string) => {
    const node = nodesRef.current.find(n => n.id === nodeId);
    if (node) { setEditingNode(nodeId); setEditText(node.text); }
  }, []);

  const finishEdit = useCallback(() => {
    if (editingNode) { saveToHistory(); updateNodeText(editingNode, editText); setEditingNode(null); }
  }, [editingNode, editText, saveToHistory, updateNodeText]);

  // ---- Auto Layout (subtree-width aware) ----
  const autoLayout = useCallback(() => {
    saveToHistory();
    const NODE_H = 50;
    const H_GAP = 70;
    const V_GAP = 24;
    const NODE_W = 170;

    const subtreeH = new Map<string, number>();
    const calcH = (id: string): number => {
      const n = nodesRef.current.find(node => node.id === id);
      if (!n || n.children.length === 0 || n.collapsed) { subtreeH.set(id, NODE_H); return NODE_H; }
      let total = 0;
      n.children.forEach((cid, i) => { total += calcH(cid); if (i < n.children.length - 1) total += V_GAP; });
      const h = Math.max(NODE_H, total);
      subtreeH.set(id, h);
      return h;
    };

    const posNode = (id: string, x: number, yStart: number) => {
      const n = nodesRef.current.find(node => node.id === id);
      if (!n) return;
      const myH = subtreeH.get(id) || NODE_H;
      n.x = x;
      n.y = yStart + myH / 2 - NODE_H / 2;
      if (n.children.length === 0 || n.collapsed) return;
      let childY = yStart;
      n.children.forEach((cid, i) => {
        const ch = subtreeH.get(cid) || NODE_H;
        posNode(cid, x + NODE_W + H_GAP, childY);
        childY += ch + V_GAP;
      });
    };

    const root = nodesRef.current.find(n => n.parentId === null);
    if (root) {
      calcH(root.id);
      const totalH = subtreeH.get(root.id) || NODE_H;
      const canvasH = canvasRef.current?.clientHeight || 600;
      posNode(root.id, 80, Math.max(20, (canvasH / zoom - totalH) / 2));
      setNodes([...nodesRef.current]);
    }
  }, [saveToHistory, zoom]);

  // ---- Fit to View ----
  const fitToView = useCallback(() => {
    if (nodes.length === 0) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const visible = nodes.filter(n => visibilityMap.get(n.id));
    if (visible.length === 0) return;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    visible.forEach(n => {
      minX = Math.min(minX, n.x);
      maxX = Math.max(maxX, n.x + 160);
      minY = Math.min(minY, n.y);
      maxY = Math.max(maxY, n.y + 50);
    });
    const cw = maxX - minX;
    const ch = maxY - minY;
    const pad = 80;
    const nz = Math.max(0.3, Math.min(1.5, Math.min((rect.width - pad * 2) / cw, (rect.height - pad * 2) / ch)));
    setPan({ x: rect.width / 2 - ((minX + maxX) / 2) * nz, y: rect.height / 2 - ((minY + maxY) / 2) * nz });
    setZoom(nz);
  }, [nodes, visibilityMap]);

  // ---- Export / Import ----
  const exportMindMap = useCallback(() => {
    const data = JSON.stringify(nodes, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'mindmap.json'; a.click();
    URL.revokeObjectURL(url);
  }, [nodes]);

  const exportAsImage = useCallback(() => {
    const visible = nodes.filter(n => visibilityMap.get(n.id) !== false);
    if (visible.length === 0) return;

    const NODE_W = 160;
    const NODE_H = 44;
    const PAD = 60;

    // Bounding box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    visible.forEach(n => {
      minX = Math.min(minX, n.x);
      maxX = Math.max(maxX, n.x + NODE_W);
      minY = Math.min(minY, n.y);
      maxY = Math.max(maxY, n.y + NODE_H);
    });

    const cw = maxX - minX + PAD * 2;
    const ch = maxY - minY + PAD * 2;
    const offX = -minX + PAD;
    const offY = -minY + PAD;

    const canvas = document.createElement('canvas');
    canvas.width = cw * 2;   // 2x for retina
    canvas.height = ch * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(2, 2);

    // Background
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(0, 0, cw, ch);

    // Dot grid
    ctx.fillStyle = '#d1d5db';
    for (let gx = 0; gx < cw; gx += 20) {
      for (let gy = 0; gy < ch; gy += 20) {
        ctx.beginPath();
        ctx.arc(gx, gy, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Helper: draw arrowhead at (x, y) pointing in direction (dx, dy)
    const drawArrow = (x: number, y: number, dx: number, dy: number, color: string) => {
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) return;
      const ux = dx / len, uy = dy / len;
      const px = -uy, py = ux;
      const size = 8;
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - ux * size + px * size * 0.4, y - uy * size + py * size * 0.4);
      ctx.lineTo(x - ux * size * 0.35, y - uy * size * 0.35);
      ctx.lineTo(x - ux * size - px * size * 0.4, y - uy * size - py * size * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    // Connections
    visible.forEach(node => {
      node.children.forEach(cid => {
        if (!visibilityMap.get(cid)) return;
        const child = visible.find(n => n.id === cid);
        if (!child) return;

        const sx = node.x + offX + NODE_W * 0.47;
        const sy = node.y + offY + NODE_H / 2;
        const ex = child.x + offX - 3;
        const ey = child.y + offY + NODE_H / 2;
        const co = (ex - sx) * 0.45;

        ctx.strokeStyle = node.color;
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = 0.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.bezierCurveTo(sx + co, sy, ex - co, ey, ex, ey);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Arrowhead direction (tangent at end of bezier)
        const t = 0.98;
        const t1 = 1 - t;
        const tx = 3 * t1 * t1 * (sx + co - sx) + 6 * t1 * t * ((ex - co) - (sx + co)) + 3 * t * t * (ex - (ex - co));
        const ty = 3 * t1 * t1 * (sy - sy) + 6 * t1 * t * (ey - sy) + 3 * t * t * (ey - ey);
        drawArrow(ex, ey, tx, ty, node.color);
      });
    });

    // Helper: parse hex to rgb
    const hexToRgb = (hex: string) => {
      const num = parseInt(hex.replace('#', ''), 16);
      return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
    };

    // Nodes
    visible.forEach(node => {
      const nx = node.x + offX;
      const ny = node.y + offY;
      const w = NODE_W;
      const h = NODE_H;

      // Gradient
      const grad = ctx.createLinearGradient(nx, ny, nx + w, ny + h);
      grad.addColorStop(0, lightenColor(node.color, 45));
      grad.addColorStop(1, node.color);
      ctx.fillStyle = grad;

      // Shape
      if (node.shape === 'circle') {
        const cx = nx + w / 2, cy = ny + h / 2;
        const rx = w / 2, ry = h / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = node.borderWidth;
        ctx.stroke();
      } else if (node.shape === 'diamond') {
        // Draw 3D diamond with depth effect
        const shadowDepth = 3;
        const diamondColor = node.color;
        const darkerColor = lightenColor(diamondColor, -30);
        
        // Shadow/depth
        ctx.fillStyle = darkerColor + '40';
        ctx.beginPath();
        ctx.moveTo(nx + w / 2 + shadowDepth, ny + shadowDepth);
        ctx.lineTo(nx + w + shadowDepth, ny + h / 2 + shadowDepth);
        ctx.lineTo(nx + w / 2 + shadowDepth, ny + h + shadowDepth);
        ctx.lineTo(nx + shadowDepth, ny + h / 2 + shadowDepth);
        ctx.closePath();
        ctx.fill();
        
        // Main diamond
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(nx + w / 2, ny);
        ctx.lineTo(nx + w, ny + h / 2);
        ctx.lineTo(nx + w / 2, ny + h);
        ctx.lineTo(nx, ny + h / 2);
        ctx.closePath();
        ctx.fill();
        
        // Highlight on top-left
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.moveTo(nx + w / 2, ny + 2);
        ctx.lineTo(nx + w - 4, ny + h / 2 - 2);
        ctx.lineTo(nx + w / 2 - 2, ny + h / 2 - 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = node.borderWidth + 1;
        ctx.beginPath();
        ctx.moveTo(nx + w / 2, ny);
        ctx.lineTo(nx + w, ny + h / 2);
        ctx.lineTo(nx + w / 2, ny + h);
        ctx.lineTo(nx, ny + h / 2);
        ctx.closePath();
        ctx.stroke();
      } else if (node.shape === 'cloud') {
        // Approximate cloud with an ellipse
        const cx = nx + w / 2, cy = ny + h / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, w / 2 + 4, h / 2 + 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = node.borderWidth;
        ctx.stroke();
      } else {
        // Square / rounded rect
        const r = 12;
        ctx.beginPath();
        ctx.moveTo(nx + r, ny);
        ctx.lineTo(nx + w - r, ny);
        ctx.quadraticCurveTo(nx + w, ny, nx + w, ny + r);
        ctx.lineTo(nx + w, ny + h - r);
        ctx.quadraticCurveTo(nx + w, ny + h, nx + w - r, ny + h);
        ctx.lineTo(nx + r, ny + h);
        ctx.quadraticCurveTo(nx, ny + h, nx, ny + h - r);
        ctx.lineTo(nx, ny + r);
        ctx.quadraticCurveTo(nx, ny, nx + r, ny);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = node.borderWidth;
        ctx.stroke();
      }

      // Text
      ctx.fillStyle = '#ffffff';
      ctx.font = `600 ${node.fontSize}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const maxTextW = w - 16;
      let label = node.text;
      if (ctx.measureText(label).width > maxTextW) {
        while (label.length > 0 && ctx.measureText(label + '...').width > maxTextW) {
          label = label.slice(0, -1);
        }
        label += '...';
      }
      ctx.fillText(label, nx + w / 2, ny + h / 2 + 1);

      // Priority badge
      if (node.priority !== 'none') {
        const bx = nx + w - 4, by = ny - 4;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(bx, by, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '10px ui-sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (node.priority === 'star') { ctx.fillStyle = '#eab308'; ctx.fillText('\u2605', bx, by); }
        if (node.priority === 'flag') { ctx.fillStyle = '#ef4444'; ctx.fillText('\u2691', bx, by); }
        if (node.priority === 'check') { ctx.fillStyle = '#22c55e'; ctx.fillText('\u2713', bx, by + 0.5); }
      }

      // Notes dot
      if (node.notes) {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(nx + w - 4, ny + h + 2, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = 'transparent';
      }
    });

    // Download
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mindmap.png';
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }, [nodes, visibilityMap]);

  const importMindMap = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const raw = JSON.parse(ev.target?.result as string);
          if (!Array.isArray(raw) || raw.length === 0) return;
          saveToHistory();
          const imported: Node[] = raw.map((n: any) => ({
            ...n, collapsed: n.collapsed ?? false, notes: n.notes ?? '', priority: n.priority ?? 'none',
          }));
          setNodes(imported);
        } catch { /* invalid */ }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [saveToHistory]);

  // ---- Wheel zoom toward cursor ----
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const factor = e.deltaY > 0 ? 0.92 : 1.08;
      const nz = Math.max(0.3, Math.min(2.5, zoom * factor));
      setPan(prev => ({
        x: mx - (mx - prev.x) * (nz / zoom),
        y: my - (my - prev.y) * (nz / zoom),
      }));
      setZoom(nz);
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [zoom]);

  // ---- Keyboard shortcuts ----
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingNode) return;
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); return; }

      if (isInput) return;

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNode) {
        e.preventDefault(); deleteNode(selectedNode); return;
      }
      if (e.key === 'Enter' && selectedNode) { e.preventDefault(); startEdit(selectedNode); return; }
      if (e.key === 'Tab') {
        e.preventDefault();
        const cur = nodesRef.current.findIndex(n => n.id === selectedNode);
        const next = e.shiftKey ? (cur - 1 + nodesRef.current.length) % nodesRef.current.length : (cur + 1) % nodesRef.current.length;
        setSelectedNode(nodesRef.current[next].id);
        return;
      }
      if (e.key === '=' || e.key === '+') { e.preventDefault(); setZoom(z => Math.min(2.5, z + 0.1)); return; }
      if (e.key === '-') { e.preventDefault(); setZoom(z => Math.max(0.3, z - 0.1)); return; }
      if (e.key === ' ' && selectedNode) {
        e.preventDefault();
        const node = nodesRef.current.find(n => n.id === selectedNode);
        if (node && node.children.length > 0) toggleCollapse(selectedNode);
        return;
      }
      if (selectedNode && e.key.startsWith('Arrow')) {
        e.preventDefault();
        const node = nodesRef.current.find(n => n.id === selectedNode);
        if (!node) return;
        if (e.key === 'ArrowLeft' && node.parentId) { setSelectedNode(node.parentId); }
        else if (e.key === 'ArrowRight' && node.children.length > 0) { setSelectedNode(node.children[0]); }
        else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          if (node.parentId) {
            const parent = nodesRef.current.find(n => n.id === node.parentId);
            if (parent) {
              const si = parent.children.indexOf(node.id);
              const ni = e.key === 'ArrowDown' ? Math.min(parent.children.length - 1, si + 1) : Math.max(0, si - 1);
              setSelectedNode(parent.children[ni]);
            }
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingNode, selectedNode, undo, redo, deleteNode, startEdit, toggleCollapse]);

  // ---- Connection drawing ----
  const drawConnection = useCallback((parent: Node, child: Node) => {
    const startX = parent.x * zoom + pan.x + 75;
    const startY = parent.y * zoom + pan.y + 22;
    const endX = child.x * zoom + pan.x - 5;
    const endY = child.y * zoom + pan.y + 22;
    const co = (endX - startX) * 0.45;
    const dash = lineStyle === 'dashed' ? '10,5' : lineStyle === 'dotted' ? '3,4' : 'none';
    return (
      <path
        key={`${parent.id}-${child.id}`}
        d={`M ${startX} ${startY} C ${startX + co} ${startY}, ${endX - co} ${endY}, ${endX} ${endY}`}
        stroke={parent.color}
        strokeWidth="2.5"
        fill="none"
        opacity="0.5"
        strokeDasharray={dash}
        strokeLinecap="round"
        markerEnd={`url(#arrow-${parent.id})`}
      />
    );
  }, [zoom, pan, lineStyle]);

  // ---- Minimap ----
  const minimap = useMemo(() => {
    if (nodes.length === 0) return null;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach(n => {
      minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x);
      minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y);
    });
    const w = 150, h = 90, pad = 10;
    const rangeX = Math.max(maxX - minX, 1);
    const rangeY = Math.max(maxY - minY, 1);
    const sc = Math.min((w - pad * 2) / rangeX, (h - pad * 2) / rangeY);
    const offX = (w - rangeX * sc) / 2;
    const offY = (h - rangeY * sc) / 2;
    return (
      <div className="absolute bottom-3 right-3 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-lg border dark:border-gray-700 pointer-events-none" style={{ width: w, height: h, zIndex: 20 }}>
        <svg width="100%" height="100%">
          {nodes.map(node => node.children.map(cid => {
            const child = nodes.find(n => n.id === cid);
            if (!child) return null;
            return <line key={`m-${node.id}-${cid}`} x1={(node.x - minX) * sc + offX} y1={(node.y - minY) * sc + offY} x2={(child.x - minX) * sc + offX} y2={(child.y - minY) * sc + offY} stroke="#94a3b8" strokeWidth="1" opacity="0.5" />;
          }))}
          {nodes.map(node => (
            <circle key={`mn-${node.id}`} cx={(node.x - minX) * sc + offX} cy={(node.y - minY) * sc + offY}
              r={node.id === selectedNode ? 4 : 2.5} fill={node.color}
              stroke={node.id === selectedNode ? '#a855f7' : 'none'} strokeWidth="1.5" />
          ))}
        </svg>
      </div>
    );
  }, [nodes, selectedNode]);

  // ---- Render single node ----
  const renderNode = useCallback((node: Node) => {
    const isEditing = editingNode === node.id;
    const isSelected = selectedNode === node.id;
    const visible = visibilityMap.get(node.id) !== false;
    const isMatch = searchQuery.length > 0 && node.text.toLowerCase().includes(searchQuery.toLowerCase());
    const isDimmed = searchQuery.length > 0 && !isMatch;

    const gradTop = lightenColor(node.color, 45);
    const shadowCol = node.color + '55';

    const shapeClass: Record<string, string> = {
      circle: 'rounded-full',
      square: 'rounded-xl',
      diamond: '',
      cloud: '',
    };
    const shapeInline: Record<string, React.CSSProperties> = {
      circle: {},
      square: {},
      diamond: { borderRadius: '4px', transform: 'rotate(45deg)', padding: '18px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))' },
      cloud: { borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', padding: '14px 28px' },
    };

    return (
      <div
        key={node.id}
        className={`absolute select-none ${visible ? '' : 'pointer-events-none'}`}
        style={{
          left: node.x * zoom + pan.x,
          top: node.y * zoom + pan.y,
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
          opacity: visible ? (isDimmed ? 0.3 : 1) : 0,
          transition: 'opacity 0.3s ease',
          zIndex: isSelected ? 10 : 1,
        }}
      >
        {isEditing ? (
          <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border-2 border-purple-500">
            <input type="text" value={editText} onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') finishEdit(); if (e.key === 'Escape') setEditingNode(null); }}
              className="px-2 py-1 border rounded-lg dark:bg-gray-700 dark:text-white text-sm w-40 outline-none focus:ring-2 focus:ring-purple-400"
              autoFocus onClick={(e) => e.stopPropagation()} />
            <button onClick={finishEdit} className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg"><Check className="h-4 w-4" /></button>
            <button onClick={() => setEditingNode(null)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><X className="h-4 w-4" /></button>
          </div>
        ) : (
          <div className="relative cursor-move group">
            <div
              className={`px-5 py-2.5 text-white font-semibold text-center min-w-[110px] max-w-[200px] ${shapeClass[node.shape]} transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5`}
              style={{
                background: `linear-gradient(135deg, ${gradTop}, ${node.color})`,
                fontSize: `${node.fontSize}px`,
                borderWidth: `${node.borderWidth}px`,
                borderColor: 'rgba(255,255,255,0.25)',
                borderStyle: 'solid',
                boxShadow: isSelected
                  ? `0 0 0 3px #a855f7, 0 8px 25px ${shadowCol}`
                  : `0 4px 15px ${shadowCol}`,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                ...shapeInline[node.shape],
                ...(isMatch ? { outline: '3px solid #facc15', outlineOffset: '2px' } : {}),
              }}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              onDoubleClick={() => startEdit(node.id)}
            >
              <span className={node.shape === 'diamond' ? '-rotate-45 block' : ''}>
                {node.text}
              </span>
            </div>

            {/* Priority badge */}
            {node.priority !== 'none' && (
              <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white dark:bg-gray-800 shadow-md flex items-center justify-center z-10">
                {node.priority === 'star' && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                {node.priority === 'flag' && <Flag className="h-3 w-3 text-red-500 fill-red-500" />}
                {node.priority === 'check' && <CheckCircle className="h-3 w-3 text-green-500 fill-green-500" />}
              </div>
            )}

            {/* Notes indicator */}
            {node.notes && (
              <div className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-yellow-400 shadow flex items-center justify-center z-10" title={node.notes}>
                <StickyNote className="h-2.5 w-2.5 text-yellow-800" />
              </div>
            )}

            {/* Collapse toggle */}
            {node.children.length > 0 && visible && (
              <button
                className="absolute -right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white dark:bg-gray-700 border-2 shadow-sm flex items-center justify-center hover:scale-110 transition-transform z-10 opacity-0 group-hover:opacity-100"
                style={{ borderColor: node.color }}
                onClick={(e) => { e.stopPropagation(); toggleCollapse(node.id); }}
                onMouseDown={(e) => e.stopPropagation()}
                title={node.collapsed ? `Expand (${getDescendantCount(node.id)} hidden)` : 'Collapse'}
              >
                {node.collapsed ? (
                  <span className="text-[9px] font-bold" style={{ color: node.color }}>{getDescendantCount(node.id)}</span>
                ) : (
                  <ChevronRight className="h-3 w-3 transition-transform" style={{ color: node.color, transform: 'rotate(90deg)' }} />
                )}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }, [editingNode, selectedNode, editText, zoom, pan, searchQuery, visibilityMap, handleNodeMouseDown, startEdit, finishEdit, toggleCollapse, getDescendantCount]);

  // ============================  RENDER  ============================
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between p-3 border-b dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <h2 className="text-base font-bold dark:text-white">Mind Map Creator</h2>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* History */}
          <div className="flex gap-1 border-r pr-1.5 mr-0.5 dark:border-gray-600">
            <Button onClick={undo} disabled={historyIndex <= 0} size="sm" variant="outline" title="Undo (Ctrl+Z)"><Undo className="h-3.5 w-3.5" /></Button>
            <Button onClick={redo} disabled={historyIndex >= history.length - 1} size="sm" variant="outline" title="Redo (Ctrl+Y)"><Redo className="h-3.5 w-3.5" /></Button>
          </div>
          {/* Zoom */}
          <div className="flex gap-1 items-center border-r pr-1.5 mr-0.5 dark:border-gray-600">
            <Button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} size="sm" variant="outline" title="Zoom Out (-)"><ZoomOut className="h-3.5 w-3.5" /></Button>
            <span className="text-[11px] min-w-[36px] text-center font-mono dark:text-gray-300">{Math.round(zoom * 100)}%</span>
            <Button onClick={() => setZoom(z => Math.min(2.5, z + 0.1))} size="sm" variant="outline" title="Zoom In (+)"><ZoomIn className="h-3.5 w-3.5" /></Button>
            <Button onClick={fitToView} size="sm" variant="outline" title="Fit to View"><Maximize className="h-3.5 w-3.5" /></Button>
          </div>
          {/* Layout */}
          <div className="flex gap-1 border-r pr-1.5 mr-0.5 dark:border-gray-600">
            <Button onClick={autoLayout} size="sm" variant="outline" title="Auto Layout">Layout</Button>
            <Button onClick={() => { saveToHistory(); setNodes(prev => prev.map(n => n.children.length > 0 ? { ...n, collapsed: true } : n)); }} size="sm" variant="outline" title="Collapse All"><FoldVertical className="h-3.5 w-3.5" /></Button>
            <Button onClick={() => { saveToHistory(); setNodes(prev => prev.map(n => ({ ...n, collapsed: false }))); }} size="sm" variant="outline" title="Expand All"><UnfoldVertical className="h-3.5 w-3.5" /></Button>
          </div>
          {/* Search */}
          <div className="relative border-r pr-1.5 mr-0.5 dark:border-gray-600">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..."
              className="pl-7 pr-6 py-1 border rounded-md text-xs w-32 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-purple-500 outline-none" />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="h-3 w-3 text-gray-400" /></button>}
          </div>
          {/* Import/Export */}
          <div className="flex gap-1">
            <Button onClick={importMindMap} size="sm" variant="outline" title="Import JSON"><Upload className="h-3.5 w-3.5" /></Button>
            <Button onClick={exportMindMap} size="sm" variant="outline" title="Export JSON"><Download className="h-3.5 w-3.5" /></Button>
            <Button onClick={exportAsImage} size="sm" className="bg-purple-600 hover:bg-purple-700" title="Export as PNG"><ImageDown className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      </div>

      {/* ---- Node Toolbar ---- */}
      {selectedNode && selectedNodeObj && (
        <div className="p-2.5 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center gap-2.5 flex-wrap">
          {/* Shapes */}
          <div className="flex gap-1">
            {(['circle', 'square', 'diamond', 'cloud'] as const).map(s => {
              const Icon = { circle: Circle, square: Square, diamond: Diamond, cloud: Cloud }[s];
              return <Button key={s} onClick={() => updateNodeStyle(selectedNode, { shape: s })} size="sm" variant={selectedNodeObj.shape === s ? 'default' : 'outline'} title={s}><Icon className="h-3.5 w-3.5" /></Button>;
            })}
          </div>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

          {/* Colors */}
          <div className="flex gap-0.5 flex-wrap max-w-[200px]">
            {ALL_COLORS.map(c => (
              <button key={c} onClick={() => updateNodeStyle(selectedNode, { color: c })}
                className={`w-4.5 h-4.5 rounded-full border-2 hover:scale-125 transition-transform ${selectedNodeObj.color === c ? 'border-white ring-2 ring-purple-500 scale-110' : 'border-gray-300 dark:border-gray-600'}`}
                style={{ backgroundColor: c, width: 18, height: 18 }} />
            ))}
          </div>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

          {/* Font Size */}
          <select value={selectedNodeObj.fontSize} onChange={(e) => updateNodeStyle(selectedNode, { fontSize: parseInt(e.target.value) })}
            className="px-1.5 py-1 border rounded text-xs dark:bg-gray-700 dark:text-white dark:border-gray-600">
            {[12, 14, 16, 18, 20, 24].map(s => <option key={s} value={s}>{s}px</option>)}
          </select>
          <select value={selectedNodeObj.borderWidth} onChange={(e) => updateNodeStyle(selectedNode, { borderWidth: parseInt(e.target.value) })}
            className="px-1.5 py-1 border rounded text-xs dark:bg-gray-700 dark:text-white dark:border-gray-600">
            <option value="1">Thin</option><option value="2">Normal</option><option value="3">Thick</option>
          </select>
          <select value={lineStyle} onChange={(e) => setLineStyle(e.target.value as any)}
            className="px-1.5 py-1 border rounded text-xs dark:bg-gray-700 dark:text-white dark:border-gray-600">
            <option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option>
          </select>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

          {/* Priority */}
          <div className="flex gap-0.5 items-center">
            {(['none', 'star', 'flag', 'check'] as const).map(p => (
              <button key={p} onClick={() => updateNodeStyle(selectedNode, { priority: p })}
                className={`p-1 rounded transition-colors ${selectedNodeObj.priority === p ? 'bg-gray-200 dark:bg-gray-600' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`} title={p}>
                {p === 'none' && <X className="h-3.5 w-3.5 text-gray-400" />}
                {p === 'star' && <Star className="h-3.5 w-3.5 text-yellow-500" />}
                {p === 'flag' && <Flag className="h-3.5 w-3.5 text-red-500" />}
                {p === 'check' && <CheckCircle className="h-3.5 w-3.5 text-green-500" />}
              </button>
            ))}
          </div>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

          {/* Notes */}
          <div className="flex items-center gap-1">
            <StickyNote className="h-3.5 w-3.5 text-gray-400" />
            <input type="text" placeholder="Notes..." value={selectedNodeObj.notes}
              onChange={(e) => updateNodeStyle(selectedNode, { notes: e.target.value })}
              className="px-2 py-1 border rounded text-xs dark:bg-gray-700 dark:text-white dark:border-gray-600 w-32 outline-none focus:ring-1 focus:ring-purple-400" />
          </div>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

          {/* Actions */}
          <Button onClick={() => addChildNode(selectedNode)} size="sm" variant="outline" title="Add Child Node"><Plus className="h-3.5 w-3.5 mr-1" />Child</Button>
          {selectedNodeObj.parentId && (
            <Button onClick={() => addSiblingNode(selectedNode)} size="sm" variant="outline" title="Add Sibling Node"><Plus className="h-3.5 w-3.5 mr-1" />Sibling</Button>
          )}
          <Button onClick={() => startEdit(selectedNode)} size="sm" variant="outline" title="Edit (Enter)"><Edit2 className="h-3.5 w-3.5 mr-1" />Edit</Button>
          {selectedNodeObj.parentId && (
            <Button onClick={() => deleteNode(selectedNode)} size="sm" variant="outline" className="text-red-600 hover:text-red-700" title="Delete (Del)"><Trash2 className="h-3.5 w-3.5 mr-1" />Delete</Button>
          )}
        </div>
      )}

      {/* ---- Canvas ---- */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden cursor-move bg-gray-50 dark:bg-gray-900"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Dot grid background */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          <defs>
            <pattern id="mmDotGrid" width={20 * zoom} height={20 * zoom} patternUnits="userSpaceOnUse"
              x={pan.x % (20 * zoom)} y={pan.y % (20 * zoom)}>
              <circle cx="1" cy="1" r="1" className="fill-gray-300 dark:fill-gray-700" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mmDotGrid)" />
        </svg>

        {/* SVG connections + arrowheads */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          <defs>
            {nodes.map(node => (
              <marker key={`arrow-${node.id}`} id={`arrow-${node.id}`}
                markerWidth="12" markerHeight="10" refX="10" refY="5" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 L 3 5 Z" fill={node.color} opacity="0.85" />
              </marker>
            ))}
          </defs>
          {nodes.filter(n => visibilityMap.get(n.id)).map(node =>
            node.children.map(childId => {
              if (!visibilityMap.get(childId)) return null;
              const child = nodes.find(n => n.id === childId);
              return child ? drawConnection(node, child) : null;
            })
          )}
        </svg>

        {/* Nodes */}
        <div style={{ zIndex: 2, position: 'relative' }}>
          {nodes.map(node => renderNode(node))}
        </div>

        {/* Minimap */}
        {minimap}
      </div>

      {/* ---- Footer ---- */}
      <div className="p-2 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-[11px] text-gray-500 dark:text-gray-400">
        <div className="flex items-center justify-between">
          <span>
            <strong>Shortcuts:</strong> Tab=cycle | Enter=edit | Del=delete | Arrows=navigate | Ctrl+Z/Y=undo/redo | +/-=zoom | Space=collapse | Scroll=zoom
          </span>
          <span className="text-purple-600 dark:text-purple-400 flex items-center gap-3">
            {searchQuery && <span className="text-yellow-600 dark:text-yellow-400">{nodes.filter(n => n.text.toLowerCase().includes(searchQuery.toLowerCase())).length} matches</span>}
            <span>{nodes.length} nodes</span>
            <span>{Math.round(zoom * 100)}%</span>
          </span>
        </div>
      </div>
    </div>
  );
};
