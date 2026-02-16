import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Table, Download, Plus, Trash2, Copy, Scissors, FileSpreadsheet, Bold, Italic, Underline, Strikethrough, WrapText, AlignLeft, AlignCenter, AlignRight, Calculator, TrendingUp, PieChart, BarChart3, Undo, Redo, SortAsc, Percent, DollarSign, Hash, Calendar, ClipboardPaste } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  align?: 'left' | 'center' | 'right';
  wrapText?: boolean;
  bgColor?: string;
  textColor?: string;
  fontFamily?: string;
  fontSize?: number;
  format?: 'general' | 'number' | 'currency' | 'percent' | 'date';
}

interface Cell {
  value: string;
  formula?: string;
  style: CellStyle;
}

interface HistoryState {
  cells: Cell[][];
  selectedCell: [number, number] | null;
}

const INITIAL_ROWS = 50;
const INITIAL_COLS = 26;
const DEFAULT_COL_WIDTH = 100;
const DEFAULT_ROW_HEIGHT = 28;

const FONT_FAMILIES = [
  'Arial', 'Calibri', 'Times New Roman', 'Courier New', 'Georgia',
  'Verdana', 'Trebuchet MS', 'Garamond', 'Cambria', 'Consolas',
  'Comic Sans MS', 'Impact',
];
const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 36, 48, 72];

export const Spreadsheet: React.FC = () => {
  const [cells, setCells] = useState<Cell[][]>(
    Array(INITIAL_ROWS).fill(null).map(() =>
      Array(INITIAL_COLS).fill(null).map(() => ({ value: '', style: {} }))
    )
  );
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>([0, 0]);
  const [selectedRange, setSelectedRange] = useState<{ start: [number, number]; end: [number, number] } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [activeTab, setActiveTab] = useState('sheet');
  const [clipboard, setClipboard] = useState<Cell | null>(null);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [formulaBar, setFormulaBar] = useState('');
  const [chartRange, setChartRange] = useState<string>('A1:A10');
  const [colWidths, setColWidths] = useState<{ [key: number]: number }>({});
  const [resizingCol, setResizingCol] = useState<number | null>(null);
  const [resizeStartX, setResizeStartX] = useState<number>(0);
  const [resizeStartWidth, setResizeStartWidth] = useState<number>(0);

  // Editing state - single overlay input instead of per-cell textareas
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const formulaInputRef = useRef<HTMLInputElement>(null);

  const getColumnLabel = (index: number): string => {
    let label = '';
    let num = index;
    while (num >= 0) {
      label = String.fromCharCode(65 + (num % 26)) + label;
      num = Math.floor(num / 26) - 1;
    }
    return label;
  };

  const columns = cells[0] ? cells[0].map((_, idx) => getColumnLabel(idx)) : [];

  const saveToHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ cells: JSON.parse(JSON.stringify(cells)), selectedCell });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [cells, selectedCell, history, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setCells(prevState.cells);
      setSelectedCell(prevState.selectedCell);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setCells(nextState.cells);
      setSelectedCell(nextState.selectedCell);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const parseRange = (start: string, end: string) => {
    const parseCell = (cellRef: string) => {
      const col = cellRef.match(/[A-Z]+/)?.[0] || 'A';
      const row = parseInt(cellRef.match(/\d+/)?.[0] || '1') - 1;
      let colNum = 0;
      for (let i = 0; i < col.length; i++) {
        colNum = colNum * 26 + col.charCodeAt(i) - 64;
      }
      return { row, col: colNum - 1 };
    };

    const startCell = parseCell(start);
    const endCell = parseCell(end);
    return {
      startRow: startCell.row,
      startCol: startCell.col,
      endRow: endCell.row,
      endCol: endCell.col
    };
  };

  const getCellValue = (cellRef: string): string => {
    const { startRow, startCol } = parseRange(cellRef, cellRef);
    return cells[startRow]?.[startCol]?.value || '0';
  };

  const evaluateFormula = (formula: string): string => {
    try {
      const upperFormula = formula.toUpperCase();

      if (upperFormula.startsWith('=SUM(')) {
        const range = formula.match(/=SUM\(([A-Z]+\d+):([A-Z]+\d+)\)/i);
        if (range) {
          const [, start, end] = range;
          const { startCol, startRow, endCol, endRow } = parseRange(start, end);
          let sum = 0;
          for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
              const val = parseFloat(cells[r]?.[c]?.value || '0');
              if (!isNaN(val)) sum += val;
            }
          }
          return sum.toString();
        }
      }

      if (upperFormula.startsWith('=AVERAGE(') || upperFormula.startsWith('=AVG(')) {
        const range = formula.match(/=(?:AVERAGE|AVG)\(([A-Z]+\d+):([A-Z]+\d+)\)/i);
        if (range) {
          const [, start, end] = range;
          const { startCol, startRow, endCol, endRow } = parseRange(start, end);
          let sum = 0, count = 0;
          for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
              const val = parseFloat(cells[r]?.[c]?.value || '0');
              if (!isNaN(val)) { sum += val; count++; }
            }
          }
          return count > 0 ? (sum / count).toFixed(2) : '0';
        }
      }

      if (upperFormula.startsWith('=COUNT(') || upperFormula.startsWith('=MAX(') || upperFormula.startsWith('=MIN(')) {
        const match = formula.match(/=(COUNT|MAX|MIN)\(([A-Z]+\d+):([A-Z]+\d+)\)/i);
        if (match) {
          const [, func, start, end] = match;
          const { startCol, startRow, endCol, endRow } = parseRange(start, end);
          const values: number[] = [];
          for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
              const val = parseFloat(cells[r]?.[c]?.value || '0');
              if (!isNaN(val)) values.push(val);
            }
          }
          if (func.toUpperCase() === 'COUNT') return values.length.toString();
          if (func.toUpperCase() === 'MAX') return values.length > 0 ? Math.max(...values).toString() : '0';
          if (func.toUpperCase() === 'MIN') return values.length > 0 ? Math.min(...values).toString() : '0';
        }
      }

      if (upperFormula.startsWith('=IF(')) {
        const match = formula.match(/=IF\(([A-Z]+\d+)([><=!]+)(\d+),\s*"?([^,"]+)"?,\s*"?([^)]+)"?\)/i);
        if (match) {
          const [, cellRef, operator, value, trueVal, falseVal] = match;
          const cellValue = parseFloat(getCellValue(cellRef));
          const compareValue = parseFloat(value);

          let condition = false;
          if (operator === '>') condition = cellValue > compareValue;
          else if (operator === '<') condition = cellValue < compareValue;
          else if (operator === '>=') condition = cellValue >= compareValue;
          else if (operator === '<=') condition = cellValue <= compareValue;
          else if (operator === '=' || operator === '==') condition = cellValue === compareValue;
          else if (operator === '!=') condition = cellValue !== compareValue;

          return condition ? trueVal : falseVal;
        }
      }

      if (upperFormula.match(/^=[A-Z]+\d+[\+\-\*\/][A-Z]+\d+$/)) {
        const match = formula.match(/=([A-Z]+\d+)([\+\-\*\/])([A-Z]+\d+)/i);
        if (match) {
          const [, cell1, op, cell2] = match;
          const val1 = parseFloat(getCellValue(cell1));
          const val2 = parseFloat(getCellValue(cell2));

          if (!isNaN(val1) && !isNaN(val2)) {
            if (op === '+') return (val1 + val2).toString();
            if (op === '-') return (val1 - val2).toString();
            if (op === '*') return (val1 * val2).toString();
            if (op === '/') return val2 !== 0 ? (val1 / val2).toString() : '#DIV/0';
          }
        }
      }

      return formula;
    } catch {
      return '#ERROR';
    }
  };

  const formatCellValue = (cell: Cell): string => {
    const value = cell.formula ? evaluateFormula(cell.formula) : cell.value;
    if (!value || value === '#ERROR' || value === '#DIV/0') return value;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return value;

    switch (cell.style.format) {
      case 'currency':
        return `$${numValue.toFixed(2)}`;
      case 'percent':
        return `${(numValue * 100).toFixed(2)}%`;
      case 'number':
        return numValue.toFixed(2);
      case 'date':
        return new Date(numValue).toLocaleDateString();
      default:
        return value;
    }
  };

  const getCellDependencies = (formula: string): string[] => {
    const dependencies: string[] = [];
    const cellRefPattern = /[A-Z]+\d+/g;
    const matches = formula.match(cellRefPattern);
    if (matches) {
      matches.forEach(ref => {
        if (!dependencies.includes(ref)) {
          dependencies.push(ref);
        }
      });
    }
    return dependencies;
  };

  const recalculateDependentCells = (changedRow: number, changedCol: number, newCells: Cell[][]) => {
    const changedCellRef = `${columns[changedCol]}${changedRow + 1}`;

    for (let r = 0; r < newCells.length; r++) {
      for (let c = 0; c < newCells[r].length; c++) {
        const cell = newCells[r][c];
        if (cell.formula) {
          const dependencies = getCellDependencies(cell.formula);
          if (dependencies.includes(changedCellRef)) {
            newCells[r][c] = {
              ...cell,
              value: evaluateFormula(cell.formula)
            };
          }
        }
      }
    }

    return newCells;
  };

  const handleCellChange = (rowIdx: number, colIdx: number, value: string) => {
    saveToHistory();
    let newCells = [...cells.map(row => [...row])];
    const isFormula = value.startsWith('=');

    newCells[rowIdx][colIdx] = {
      ...newCells[rowIdx][colIdx],
      value: isFormula ? evaluateFormula(value) : value,
      formula: isFormula ? value : undefined
    };

    newCells = recalculateDependentCells(rowIdx, colIdx, newCells);
    setCells(newCells);
  };

  // --- Editing helpers ---
  const startEditing = useCallback((initialValue?: string) => {
    if (!selectedCell) return;
    const [row, col] = selectedCell;
    const cell = cells[row][col];
    setIsEditing(true);
    setEditValue(initialValue ?? (cell.formula || cell.value));
    // Focus happens via useEffect
  }, [selectedCell, cells]);

  const confirmEdit = useCallback(() => {
    if (!selectedCell || !isEditing) return;
    const [row, col] = selectedCell;
    handleCellChange(row, col, editValue);
    setIsEditing(false);
    setFormulaBar(editValue);
    // Refocus grid so arrow keys work immediately
    requestAnimationFrame(() => gridRef.current?.focus());
  }, [selectedCell, isEditing, editValue]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    if (selectedCell) {
      const [row, col] = selectedCell;
      const cell = cells[row][col];
      setFormulaBar(cell.formula || cell.value);
    }
    // Refocus grid so arrow keys work immediately
    requestAnimationFrame(() => gridRef.current?.focus());
  }, [selectedCell, cells]);

  // Focus the edit input when editing starts
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [isEditing]);

  const handleCellClick = (rowIdx: number, colIdx: number, event: React.MouseEvent) => {
    if (isEditing) confirmEdit();

    if (event.shiftKey && selectedCell) {
      setSelectedRange({
        start: selectedCell,
        end: [rowIdx, colIdx]
      });
    } else {
      setSelectedCell([rowIdx, colIdx]);
      setSelectedRange(null);
      const cell = cells[rowIdx][colIdx];
      setFormulaBar(cell.formula || cell.value);
    }
  };

  const handleCellDoubleClick = (rowIdx: number, colIdx: number) => {
    setSelectedCell([rowIdx, colIdx]);
    setSelectedRange(null);
    const cell = cells[rowIdx][colIdx];
    startEditing(cell.formula || cell.value);
  };

  // Mouse drag range selection
  const handleCellMouseDown = (rowIdx: number, colIdx: number, event: React.MouseEvent) => {
    if (event.button !== 0) return;
    if (isEditing) confirmEdit();
    setSelectedCell([rowIdx, colIdx]);
    setSelectedRange(null);
    setIsSelecting(true);
    const cell = cells[rowIdx][colIdx];
    setFormulaBar(cell.formula || cell.value);
    // Focus grid so arrow keys work after clicking a cell
    gridRef.current?.focus();
  };

  const handleCellMouseEnter = (rowIdx: number, colIdx: number) => {
    if (isSelecting && selectedCell) {
      setSelectedRange({
        start: selectedCell,
        end: [rowIdx, colIdx]
      });
    }
  };

  useEffect(() => {
    const handleMouseUp = () => setIsSelecting(false);
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleFormulaBarChange = (value: string) => {
    setFormulaBar(value);
    if (selectedCell) {
      handleCellChange(selectedCell[0], selectedCell[1], value);
    }
  };

  const applyStyle = (style: Partial<CellStyle>) => {
    if (!selectedCell && !selectedRange) return;
    saveToHistory();

    const newCells = [...cells.map(row => [...row])];
    if (selectedRange) {
      const { start, end } = selectedRange;
      const [startRow, startCol] = start;
      const [endRow, endCol] = end;
      for (let r = Math.min(startRow, endRow); r <= Math.max(startRow, endRow); r++) {
        for (let c = Math.min(startCol, endCol); c <= Math.max(startCol, endCol); c++) {
          newCells[r][c] = {
            ...newCells[r][c],
            style: { ...newCells[r][c].style, ...style }
          };
        }
      }
    } else if (selectedCell) {
      const [row, col] = selectedCell;
      newCells[row][col] = {
        ...newCells[row][col],
        style: { ...newCells[row][col].style, ...style }
      };
    }
    setCells(newCells);
  };

  const copyCell = () => {
    if (!selectedCell) return;
    const [row, col] = selectedCell;
    setClipboard(JSON.parse(JSON.stringify(cells[row][col])));
  };

  const cutCell = () => {
    if (!selectedCell) return;
    copyCell();
    const [row, col] = selectedCell;
    saveToHistory();
    const newCells = [...cells.map(r => [...r])];
    newCells[row][col] = { value: '', style: {} };
    setCells(newCells);
  };

  const pasteCell = () => {
    if (!selectedCell || !clipboard) return;
    saveToHistory();
    const [row, col] = selectedCell;
    const newCells = [...cells.map(r => [...r])];
    newCells[row][col] = JSON.parse(JSON.stringify(clipboard));
    setCells(newCells);
  };

  const deleteCell = useCallback(() => {
    if (!selectedCell && !selectedRange) return;
    saveToHistory();

    const newCells = [...cells.map(r => [...r])];
    if (selectedRange) {
      const { start, end } = selectedRange;
      for (let r = Math.min(start[0], end[0]); r <= Math.max(start[0], end[0]); r++) {
        for (let c = Math.min(start[1], end[1]); c <= Math.max(start[1], end[1]); c++) {
          newCells[r][c] = { value: '', style: {} };
        }
      }
    } else if (selectedCell) {
      const [row, col] = selectedCell;
      newCells[row][col] = { value: '', style: {} };
    }
    setCells(newCells);
  }, [selectedCell, selectedRange, cells, saveToHistory]);

  const insertRow = (index?: number) => {
    saveToHistory();
    const insertAt = index ?? (selectedCell ? selectedCell[0] + 1 : cells.length);
    const newRow = Array(columns.length).fill(null).map(() => ({ value: '', style: {} as CellStyle }));
    const newCells = [...cells];
    newCells.splice(insertAt, 0, newRow);
    setCells(newCells);
  };

  const deleteRow = (index: number) => {
    if (cells.length <= 1) return;
    saveToHistory();
    setCells(cells.filter((_, i) => i !== index));
  };

  const insertColumn = (index?: number) => {
    saveToHistory();
    const insertAt = index ?? (selectedCell ? selectedCell[1] + 1 : columns.length);
    const newCells = cells.map(row => {
      const newRow = [...row];
      newRow.splice(insertAt, 0, { value: '', style: {} });
      return newRow;
    });
    setCells(newCells);
  };

  const deleteColumn = (index: number) => {
    if (columns.length <= 1) return;
    saveToHistory();
    setCells(cells.map(row => row.filter((_, i) => i !== index)));
  };

  const sortColumn = (colIdx: number, ascending: boolean = true) => {
    saveToHistory();
    const newCells = [...cells.map(r => [...r])];
    const dataRows = newCells.slice(1);

    dataRows.sort((a, b) => {
      const aVal = parseFloat(a[colIdx].value) || a[colIdx].value;
      const bVal = parseFloat(b[colIdx].value) || b[colIdx].value;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return ascending ? aVal - bVal : bVal - aVal;
      }
      return ascending
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

    setCells([newCells[0], ...dataRows]);
  };

  const exportToCSV = () => {
    const csv = cells.map(row =>
      row.map(cell => {
        const value = formatCellValue(cell);
        return value.includes(',') ? `"${value}"` : value;
      }).join(',')
    ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spreadsheet.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const json = JSON.stringify(cells, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spreadsheet.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const calculateStats = () => {
    const values = cells.flat().map(cell => parseFloat(cell.value)).filter(v => !isNaN(v));
    if (values.length === 0) return { sum: 0, avg: 0, min: 0, max: 0, count: 0, median: 0 };

    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    return {
      sum: values.reduce((a, b) => a + b, 0),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
      median
    };
  };

  const stats = calculateStats();

  const activeStyle = selectedCell ? cells[selectedCell[0]]?.[selectedCell[1]]?.style : undefined;
  const activeFont = activeStyle?.fontFamily || 'Arial';
  const activeFontSize = activeStyle?.fontSize || 12;

  const isInSelectedRange = (rowIdx: number, colIdx: number) => {
    if (!selectedRange) return false;
    const { start, end } = selectedRange;
    return rowIdx >= Math.min(start[0], end[0]) && rowIdx <= Math.max(start[0], end[0]) &&
           colIdx >= Math.min(start[1], end[1]) && colIdx <= Math.max(start[1], end[1]);
  };

  const handleColResizeStart = (colIdx: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingCol(colIdx);
    setResizeStartX(e.clientX);
    setResizeStartWidth(colWidths[colIdx] || DEFAULT_COL_WIDTH);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingCol !== null) {
        const diff = e.clientX - resizeStartX;
        const newWidth = Math.max(40, resizeStartWidth + diff);
        setColWidths(prev => ({ ...prev, [resizingCol]: newWidth }));
      }
    };

    const handleMouseUp = () => {
      setResizingCol(null);
    };

    if (resizingCol !== null) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizingCol, resizeStartX, resizeStartWidth]);

  // Navigation helper
  const moveSelection = useCallback((dRow: number, dCol: number) => {
    if (!selectedCell) return;
    const [row, col] = selectedCell;
    const newRow = Math.max(0, Math.min(cells.length - 1, row + dRow));
    const newCol = Math.max(0, Math.min(columns.length - 1, col + dCol));
    setSelectedCell([newRow, newCol]);
    setSelectedRange(null);
    const cell = cells[newRow][newCol];
    setFormulaBar(cell.formula || cell.value);
  }, [selectedCell, cells, columns.length]);

  // Keyboard handler - navigation + editing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if focus is in formula bar
      if (document.activeElement === formulaInputRef.current) {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (selectedCell) handleCellChange(selectedCell[0], selectedCell[1], formulaBar);
          formulaInputRef.current?.blur();
          gridRef.current?.focus();
        }
        if (e.key === 'Escape') {
          formulaInputRef.current?.blur();
          gridRef.current?.focus();
        }
        return;
      }

      // Don't intercept if focus is in any other input/textarea/select (not part of spreadsheet grid)
      const activeEl = document.activeElement;
      if (activeEl &&
          activeEl !== editInputRef.current &&
          (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
        return;
      }

      if (!selectedCell) return;

      // Ctrl shortcuts (work in both modes)
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c') { e.preventDefault(); copyCell(); return; }
        if (e.key === 'x') { e.preventDefault(); cutCell(); return; }
        if (e.key === 'v') { e.preventDefault(); pasteCell(); return; }
        if (e.key === 'z') { e.preventDefault(); undo(); return; }
        if (e.key === 'y') { e.preventDefault(); redo(); return; }
        if (e.key === 'b') { e.preventDefault(); applyStyle({ bold: !cells[selectedCell[0]]?.[selectedCell[1]]?.style?.bold }); return; }
        if (e.key === 'i') { e.preventDefault(); applyStyle({ italic: !cells[selectedCell[0]]?.[selectedCell[1]]?.style?.italic }); return; }
        if (e.key === 'u') { e.preventDefault(); applyStyle({ underline: !cells[selectedCell[0]]?.[selectedCell[1]]?.style?.underline }); return; }
        return;
      }

      if (isEditing) {
        // In edit mode
        if (e.key === 'Enter') {
          e.preventDefault();
          confirmEdit();
          moveSelection(1, 0); // Move down after confirm
        } else if (e.key === 'Tab') {
          e.preventDefault();
          confirmEdit();
          moveSelection(0, e.shiftKey ? -1 : 1); // Move right (or left with shift)
        } else if (e.key === 'Escape') {
          e.preventDefault();
          cancelEdit();
        }
        // Let other keys pass through to the input
        return;
      }

      // Navigation mode (not editing)
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          moveSelection(-1, 0);
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveSelection(1, 0);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          moveSelection(0, -1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveSelection(0, 1);
          break;
        case 'Tab':
          e.preventDefault();
          moveSelection(0, e.shiftKey ? -1 : 1);
          break;
        case 'Enter':
          e.preventDefault();
          startEditing();
          break;
        case 'F2':
          e.preventDefault();
          startEditing();
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          deleteCell();
          break;
        default:
          // Start editing if a printable character is typed
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            startEditing(e.key);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, isEditing, editValue, clipboard, historyIndex, formulaBar, confirmEdit, cancelEdit, startEditing, moveSelection, deleteCell, cells]);

  // Scroll selected cell into view
  useEffect(() => {
    if (!selectedCell || !gridRef.current) return;
    const [row, col] = selectedCell;
    const cellId = `cell-${row}-${col}`;
    const cellEl = document.getElementById(cellId);
    if (cellEl) {
      cellEl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }, [selectedCell]);

  const getColWidth = (idx: number) => colWidths[idx] || DEFAULT_COL_WIDTH;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b dark:border-gray-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <Table className="h-5 w-5 text-green-600" />
          <h2 className="font-bold text-sm dark:text-white">Spreadsheet</h2>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {cells.length} x {columns.length}
          </span>
        </div>
        <div className="flex gap-1.5">
          <Button onClick={exportToCSV} size="sm" variant="outline" className="h-7 text-xs px-2">
            <Download className="h-3.5 w-3.5 mr-1" />
            CSV
          </Button>
          <Button onClick={exportToJSON} size="sm" variant="outline" className="h-7 text-xs px-2">
            <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
            JSON
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-3 mt-1.5 h-8">
          <TabsTrigger value="sheet" className="text-xs px-3 py-1">Sheet</TabsTrigger>
          <TabsTrigger value="formulas" className="text-xs px-3 py-1">Formulas</TabsTrigger>
          <TabsTrigger value="charts" className="text-xs px-3 py-1">Charts</TabsTrigger>
          <TabsTrigger value="stats" className="text-xs px-3 py-1">Statistics</TabsTrigger>
        </TabsList>

        {/* Sheet Tab */}
        <TabsContent value="sheet" className="flex-1 flex flex-col overflow-hidden mt-0 data-[state=inactive]:hidden">
          {/* Formula Bar */}
          <div className="px-2 py-1.5 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-green-700 dark:text-green-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded min-w-[48px] text-center">
                {selectedCell ? `${columns[selectedCell[1]]}${selectedCell[0] + 1}` : ''}
              </span>
              <div className="text-xs text-gray-400 select-none">fx</div>
              <input
                ref={formulaInputRef}
                type="text"
                value={formulaBar}
                onChange={(e) => handleFormulaBarChange(e.target.value)}
                className="flex-1 px-2 py-1 border rounded text-xs dark:bg-gray-700 dark:text-white dark:border-gray-600 font-mono focus:ring-1 focus:ring-green-500 focus:border-green-500"
                placeholder="Enter value or formula (=SUM, =AVG, =IF...)"
              />
            </div>
          </div>

          {/* Ribbon Toolbar */}
          <div className="flex items-end px-1 py-0.5 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shrink-0 overflow-x-auto">
            {/* Undo/Redo */}
            <div className="flex items-center gap-0.5 px-0.5 self-center">
              <Button onClick={undo} size="sm" variant="ghost" disabled={historyIndex <= 0} title="Undo (Ctrl+Z)" className="h-7 w-7 p-0">
                <Undo className="h-3.5 w-3.5" />
              </Button>
              <Button onClick={redo} size="sm" variant="ghost" disabled={historyIndex >= history.length - 1} title="Redo (Ctrl+Y)" className="h-7 w-7 p-0">
                <Redo className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="w-px h-10 bg-gray-200 dark:bg-gray-600 mx-1 shrink-0 self-center" />

            {/* Clipboard */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-0.5">
                <Button onClick={copyCell} size="sm" variant="ghost" title="Copy (Ctrl+C)" className="h-7 w-7 p-0">
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button onClick={cutCell} size="sm" variant="ghost" title="Cut (Ctrl+X)" className="h-7 w-7 p-0">
                  <Scissors className="h-3.5 w-3.5" />
                </Button>
                <Button onClick={pasteCell} size="sm" variant="ghost" title="Paste (Ctrl+V)" className="h-7 w-7 p-0">
                  <ClipboardPaste className="h-3.5 w-3.5" />
                </Button>
                <Button onClick={deleteCell} size="sm" variant="ghost" title="Delete" className="h-7 w-7 p-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <span className="text-[7px] text-gray-400 dark:text-gray-500 leading-none select-none mt-px">Clipboard</span>
            </div>

            <div className="w-px h-10 bg-gray-200 dark:bg-gray-600 mx-1 shrink-0 self-center" />

            {/* Font */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-0.5">
                <select
                  value={activeFont}
                  onChange={(e) => applyStyle({ fontFamily: e.target.value })}
                  className="h-7 text-[10px] pl-1 pr-0.5 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600 w-[88px] cursor-pointer focus:ring-1 focus:ring-green-500"
                  title="Font Family"
                >
                  {FONT_FAMILIES.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
                <select
                  value={activeFontSize}
                  onChange={(e) => applyStyle({ fontSize: parseInt(e.target.value) })}
                  className="h-7 text-[10px] pl-1 pr-0.5 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600 w-11 cursor-pointer focus:ring-1 focus:ring-green-500"
                  title="Font Size"
                >
                  {FONT_SIZES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <Button onClick={() => applyStyle({ bold: !activeStyle?.bold })} size="sm" variant="ghost" title="Bold (Ctrl+B)" className={`h-7 w-7 p-0 ${activeStyle?.bold ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : ''}`}>
                  <Bold className="h-3.5 w-3.5" />
                </Button>
                <Button onClick={() => applyStyle({ italic: !activeStyle?.italic })} size="sm" variant="ghost" title="Italic (Ctrl+I)" className={`h-7 w-7 p-0 ${activeStyle?.italic ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : ''}`}>
                  <Italic className="h-3.5 w-3.5" />
                </Button>
                <Button onClick={() => applyStyle({ underline: !activeStyle?.underline })} size="sm" variant="ghost" title="Underline (Ctrl+U)" className={`h-7 w-7 p-0 ${activeStyle?.underline ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : ''}`}>
                  <Underline className="h-3.5 w-3.5" />
                </Button>
                <Button onClick={() => applyStyle({ strikethrough: !activeStyle?.strikethrough })} size="sm" variant="ghost" title="Strikethrough" className={`h-7 w-7 p-0 ${activeStyle?.strikethrough ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : ''}`}>
                  <Strikethrough className="h-3.5 w-3.5" />
                </Button>
                <div className="flex flex-col gap-px ml-0.5">
                  <input type="color" onChange={(e) => applyStyle({ textColor: e.target.value })} className="w-5 h-3 cursor-pointer border dark:border-gray-600 shrink-0 rounded-sm" title="Text Color" />
                  <input type="color" onChange={(e) => applyStyle({ bgColor: e.target.value })} className="w-5 h-3 cursor-pointer border dark:border-gray-600 shrink-0 rounded-sm" title="Fill Color" />
                </div>
              </div>
              <span className="text-[7px] text-gray-400 dark:text-gray-500 leading-none select-none mt-px">Font</span>
            </div>

            <div className="w-px h-10 bg-gray-200 dark:bg-gray-600 mx-1 shrink-0 self-center" />

            {/* Alignment */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-0.5">
                <Button onClick={() => applyStyle({ align: 'left' })} size="sm" variant="ghost" title="Align Left" className={`h-7 w-7 p-0 ${activeStyle?.align === 'left' || (!activeStyle?.align) ? '' : ''} ${activeStyle?.align === 'left' ? 'bg-green-100 dark:bg-green-900/40' : ''}`}>
                  <AlignLeft className="h-3.5 w-3.5" />
                </Button>
                <Button onClick={() => applyStyle({ align: 'center' })} size="sm" variant="ghost" title="Align Center" className={`h-7 w-7 p-0 ${activeStyle?.align === 'center' ? 'bg-green-100 dark:bg-green-900/40' : ''}`}>
                  <AlignCenter className="h-3.5 w-3.5" />
                </Button>
                <Button onClick={() => applyStyle({ align: 'right' })} size="sm" variant="ghost" title="Align Right" className={`h-7 w-7 p-0 ${activeStyle?.align === 'right' ? 'bg-green-100 dark:bg-green-900/40' : ''}`}>
                  <AlignRight className="h-3.5 w-3.5" />
                </Button>
                <Button onClick={() => applyStyle({ wrapText: !activeStyle?.wrapText })} size="sm" variant="ghost" title="Wrap Text" className={`h-7 w-7 p-0 ${activeStyle?.wrapText ? 'bg-green-100 dark:bg-green-900/40' : ''}`}>
                  <WrapText className="h-3.5 w-3.5" />
                </Button>
              </div>
              <span className="text-[7px] text-gray-400 dark:text-gray-500 leading-none select-none mt-px">Alignment</span>
            </div>

            <div className="w-px h-10 bg-gray-200 dark:bg-gray-600 mx-1 shrink-0 self-center" />

            {/* Number Format */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-0.5">
                <Button onClick={() => applyStyle({ format: 'currency' })} size="sm" variant="ghost" title="Currency" className={`h-7 w-7 p-0 ${activeStyle?.format === 'currency' ? 'bg-green-100 dark:bg-green-900/40' : ''}`}>
                  <DollarSign className="h-3.5 w-3.5" />
                </Button>
                <Button onClick={() => applyStyle({ format: 'percent' })} size="sm" variant="ghost" title="Percent" className={`h-7 w-7 p-0 ${activeStyle?.format === 'percent' ? 'bg-green-100 dark:bg-green-900/40' : ''}`}>
                  <Percent className="h-3.5 w-3.5" />
                </Button>
                <Button onClick={() => applyStyle({ format: 'number' })} size="sm" variant="ghost" title="Number" className={`h-7 w-7 p-0 ${activeStyle?.format === 'number' ? 'bg-green-100 dark:bg-green-900/40' : ''}`}>
                  <Hash className="h-3.5 w-3.5" />
                </Button>
                <Button onClick={() => applyStyle({ format: 'date' })} size="sm" variant="ghost" title="Date" className={`h-7 w-7 p-0 ${activeStyle?.format === 'date' ? 'bg-green-100 dark:bg-green-900/40' : ''}`}>
                  <Calendar className="h-3.5 w-3.5" />
                </Button>
              </div>
              <span className="text-[7px] text-gray-400 dark:text-gray-500 leading-none select-none mt-px">Number</span>
            </div>

            <div className="w-px h-10 bg-gray-200 dark:bg-gray-600 mx-1 shrink-0 self-center" />

            {/* Cells */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-0.5">
                <Button onClick={() => insertRow()} size="sm" variant="ghost" title="Insert Row" className="h-7 text-[10px] px-1.5">
                  <Plus className="h-3 w-3 mr-0.5" />
                  Row
                </Button>
                <Button onClick={() => insertColumn()} size="sm" variant="ghost" title="Insert Column" className="h-7 text-[10px] px-1.5">
                  <Plus className="h-3 w-3 mr-0.5" />
                  Col
                </Button>
                {selectedCell && (
                  <>
                    <Button onClick={() => deleteRow(selectedCell[0])} size="sm" variant="ghost" className="h-7 text-[10px] px-1.5 text-red-500 hover:text-red-600" title="Delete Row">
                      <Trash2 className="h-3 w-3 mr-0.5" />
                      Row
                    </Button>
                    <Button onClick={() => deleteColumn(selectedCell[1])} size="sm" variant="ghost" className="h-7 text-[10px] px-1.5 text-red-500 hover:text-red-600" title="Delete Column">
                      <Trash2 className="h-3 w-3 mr-0.5" />
                      Col
                    </Button>
                  </>
                )}
              </div>
              <span className="text-[7px] text-gray-400 dark:text-gray-500 leading-none select-none mt-px">Cells</span>
            </div>
          </div>

          {/* Spreadsheet Grid */}
          <div ref={gridRef} className="flex-1 overflow-auto relative focus:outline-none" tabIndex={0}>
            <table className="border-collapse" style={{ tableLayout: 'fixed' }}>
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="border-r border-b dark:border-gray-600 w-10 text-[10px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 sticky left-0 z-20" />
                  {columns.map((col, idx) => (
                    <th
                      key={col}
                      className={`border-r border-b dark:border-gray-600 text-[10px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 relative select-none px-1 ${
                        selectedCell?.[1] === idx ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : ''
                      }`}
                      style={{ width: getColWidth(idx), minWidth: getColWidth(idx), height: 22 }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex-1 text-center">{col}</span>
                        <button
                          onClick={() => sortColumn(idx, true)}
                          className="opacity-0 hover:opacity-100 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-opacity"
                          title="Sort"
                        >
                          <SortAsc className="h-2.5 w-2.5" />
                        </button>
                      </div>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-green-500 transition-colors"
                        onMouseDown={(e) => handleColResizeStart(idx, e)}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cells.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    <td className={`border-r border-b dark:border-gray-600 text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 sticky left-0 z-[5] select-none ${
                      selectedCell?.[0] === rowIdx ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : ''
                    }`}
                      style={{ width: 40, height: DEFAULT_ROW_HEIGHT }}
                    >
                      {rowIdx + 1}
                    </td>
                    {row.map((cell, colIdx) => {
                      const isSelected = selectedCell?.[0] === rowIdx && selectedCell?.[1] === colIdx;
                      const inRange = isInSelectedRange(rowIdx, colIdx);
                      const displayValue = formatCellValue(cell);

                      return (
                        <td
                          key={colIdx}
                          id={`cell-${rowIdx}-${colIdx}`}
                          className={`border-r border-b dark:border-gray-600 p-0 relative ${
                            isSelected
                              ? 'ring-2 ring-green-500 ring-inset z-[2]'
                              : inRange
                              ? 'bg-green-50 dark:bg-green-900/20'
                              : ''
                          }`}
                          style={{
                            backgroundColor: cell.style.bgColor || (isSelected ? undefined : inRange ? undefined : 'transparent'),
                            width: getColWidth(colIdx),
                            minWidth: getColWidth(colIdx),
                            height: DEFAULT_ROW_HEIGHT,
                          }}
                          onMouseDown={(e) => handleCellMouseDown(rowIdx, colIdx, e)}
                          onMouseEnter={() => handleCellMouseEnter(rowIdx, colIdx)}
                          onClick={(e) => {
                            if (!isSelecting) handleCellClick(rowIdx, colIdx, e);
                          }}
                          onDoubleClick={() => handleCellDoubleClick(rowIdx, colIdx)}
                        >
                          {/* Editing overlay */}
                          {isSelected && isEditing ? (
                            <input
                              ref={editInputRef}
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="absolute inset-0 w-full h-full px-1.5 text-xs bg-white dark:bg-gray-900 dark:text-white border-0 outline-none z-[3]"
                              style={{
                                fontFamily: cell.style.fontFamily || 'Arial',
                                fontWeight: cell.style.bold ? 'bold' : 'normal',
                                fontStyle: cell.style.italic ? 'italic' : 'normal',
                                textAlign: cell.style.align || 'left',
                                fontSize: cell.style.fontSize ? `${cell.style.fontSize}px` : undefined,
                              }}
                            />
                          ) : (
                            /* Display cell */
                            <div
                              className={`w-full h-full px-1.5 flex items-center text-xs dark:text-white ${cell.style.wrapText ? 'whitespace-normal overflow-hidden leading-tight' : 'truncate'} ${isSelected ? '' : 'select-none'}`}
                              style={{
                                fontFamily: cell.style.fontFamily || 'Arial',
                                fontWeight: cell.style.bold ? 'bold' : 'normal',
                                fontStyle: cell.style.italic ? 'italic' : 'normal',
                                textDecoration: [cell.style.underline && 'underline', cell.style.strikethrough && 'line-through'].filter(Boolean).join(' ') || 'none',
                                textAlign: cell.style.align || 'left',
                                justifyContent: cell.style.align === 'center' ? 'center' : cell.style.align === 'right' ? 'flex-end' : 'flex-start',
                                color: cell.style.textColor || undefined,
                                fontSize: cell.style.fontSize ? `${cell.style.fontSize}px` : undefined,
                              }}
                            >
                              {displayValue}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Status Bar */}
          <div className="px-3 py-1 border-t dark:border-gray-700 text-[10px] text-gray-500 dark:text-gray-400 flex items-center justify-between bg-gray-50 dark:bg-gray-800 shrink-0">
            <div className="flex items-center gap-4">
              <span>
                {selectedCell && `${columns[selectedCell[1]]}${selectedCell[0] + 1}`}
                {selectedRange && ` | Range: ${Math.abs(selectedRange.end[0] - selectedRange.start[0]) + 1}x${Math.abs(selectedRange.end[1] - selectedRange.start[1]) + 1}`}
              </span>
              {selectedRange && (
                <span className="font-semibold text-green-600 dark:text-green-400">
                  SUM: {(() => {
                    const { start, end } = selectedRange;
                    let sum = 0;
                    for (let r = Math.min(start[0], end[0]); r <= Math.max(start[0], end[0]); r++) {
                      for (let c = Math.min(start[1], end[1]); c <= Math.max(start[1], end[1]); c++) {
                        const val = parseFloat(cells[r][c].value);
                        if (!isNaN(val)) sum += val;
                      }
                    }
                    return sum.toFixed(2);
                  })()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-400">{isEditing ? 'Edit' : 'Ready'}</span>
              <span>{cells.length} rows x {columns.length} cols</span>
            </div>
          </div>
        </TabsContent>

        {/* Formulas Tab */}
        <TabsContent value="formulas" className="flex-1 overflow-auto mt-0 data-[state=inactive]:hidden">
          <div className="p-6">
            <div className="max-w-5xl mx-auto">
              <h3 className="text-2xl font-bold mb-6 dark:text-white">Available Formulas</h3>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {[
                  { name: 'SUM', syntax: '=SUM(A1:A10)', desc: 'Adds all numbers in a range', example: 'Total sales' },
                  { name: 'AVERAGE', syntax: '=AVERAGE(B1:B5)', desc: 'Calculates the average', example: 'Average score' },
                  { name: 'COUNT', syntax: '=COUNT(C1:C20)', desc: 'Counts cells with numbers', example: 'Count entries' },
                  { name: 'MAX', syntax: '=MAX(D1:D10)', desc: 'Returns the largest value', example: 'Highest score' },
                  { name: 'MIN', syntax: '=MIN(E1:E10)', desc: 'Returns the smallest value', example: 'Lowest price' },
                  { name: 'IF', syntax: '=IF(A1>10,"Pass","Fail")', desc: 'Conditional logic', example: 'Grade evaluation' },
                  { name: 'ADD', syntax: '=A1+B1', desc: 'Add two cells', example: 'Sum two values' },
                  { name: 'SUBTRACT', syntax: '=A1-B1', desc: 'Subtract two cells', example: 'Calculate difference' },
                  { name: 'MULTIPLY', syntax: '=A1*B1', desc: 'Multiply two cells', example: 'Calculate total' },
                  { name: 'DIVIDE', syntax: '=A1/B1', desc: 'Divide two cells', example: 'Calculate ratio' }
                ].map((formula, idx) => (
                  <div key={idx} className="p-5 border-2 rounded-xl dark:border-gray-700 hover:border-green-500 hover:shadow-lg transition-all bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-lg text-green-600 dark:text-green-400">{formula.name}</h4>
                      <Calculator className="h-5 w-5 text-gray-400" />
                    </div>
                    <code className="block bg-gray-100 dark:bg-gray-900 p-3 rounded-lg text-sm mb-3 dark:text-gray-300 font-mono">
                      {formula.syntax}
                    </code>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{formula.desc}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 italic">Example: {formula.example}</p>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
                <h4 className="font-bold text-lg mb-3 dark:text-white">Pro Tips</h4>
                <ul className="space-y-2 dark:text-gray-300 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">-</span>
                    <span>All formulas start with <code className="bg-white dark:bg-gray-800 px-2 py-0.5 rounded">=</code> sign</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">-</span>
                    <span>Use cell references like A1, B2, etc.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">-</span>
                    <span>Ranges use colon notation: A1:A10</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">-</span>
                    <span>Arrow keys to navigate, Enter or type to edit, Esc to cancel</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">-</span>
                    <span>Tab moves to next cell, Shift+Tab moves back</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">-</span>
                    <span>Ctrl+B/I/U for Bold, Italic, Underline</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts" className="flex-1 overflow-auto mt-0 data-[state=inactive]:hidden">
          <div className="p-6">
            <div className="max-w-5xl mx-auto">
              <h3 className="text-2xl font-bold mb-6 dark:text-white">Data Visualization</h3>

              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-4 flex-wrap">
                  <label className="font-semibold dark:text-white text-sm">Data Range:</label>
                  <input
                    type="text"
                    value={chartRange}
                    onChange={(e) => setChartRange(e.target.value)}
                    placeholder="e.g., A1:B10"
                    className="px-3 py-1.5 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600 font-mono text-sm"
                  />
                  <Button
                    onClick={() => {
                      if (selectedRange) {
                        const { start, end } = selectedRange;
                        const startLabel = `${columns[start[1]]}${start[0] + 1}`;
                        const endLabel = `${columns[end[1]]}${end[0] + 1}`;
                        setChartRange(`${startLabel}:${endLabel}`);
                      }
                    }}
                    size="sm"
                    variant="outline"
                  >
                    Use Selected Range
                  </Button>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Select cells in Sheet tab or enter range
                  </span>
                </div>
              </div>

              {(() => {
                const getChartData = () => {
                  try {
                    const match = chartRange.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/i);
                    if (!match) {
                      if (selectedRange) {
                        const { start, end } = selectedRange;
                        const data: number[] = [];
                        const labels: string[] = [];

                        for (let r = Math.min(start[0], end[0]); r <= Math.max(start[0], end[0]); r++) {
                          for (let c = Math.min(start[1], end[1]); c <= Math.max(start[1], end[1]); c++) {
                            const val = parseFloat(cells[r]?.[c]?.value || '');
                            if (!isNaN(val)) {
                              data.push(val);
                              labels.push(cells[r]?.[c - 1]?.value || `${columns[c]}${r + 1}`);
                            }
                          }
                        }
                        return { data, labels };
                      }
                      return { data: [], labels: [] };
                    }

                    const [, startCol, startRow, endCol, endRow] = match;
                    const { startRow: sr, startCol: sc, endRow: er, endCol: ec } = parseRange(
                      `${startCol}${startRow}`,
                      `${endCol}${endRow}`
                    );

                    const data: number[] = [];
                    const labels: string[] = [];

                    const isMultiColumn = ec > sc;
                    const hasLabels = isMultiColumn && isNaN(parseFloat(cells[sr]?.[sc]?.value || ''));
                    const dataColStart = hasLabels ? sc + 1 : sc;

                    for (let r = sr; r <= er; r++) {
                      for (let c = dataColStart; c <= ec; c++) {
                        const val = parseFloat(cells[r]?.[c]?.value || '');
                        if (!isNaN(val)) {
                          data.push(val);
                          const label = hasLabels && cells[r]?.[sc]?.value
                            ? cells[r][sc].value
                            : `${columns[c]}${r + 1}`;
                          labels.push(label);
                        }
                      }
                    }

                    return { data, labels };
                  } catch {
                    return { data: [], labels: [] };
                  }
                };

                const { data, labels } = getChartData();
                const maxValue = Math.max(...data, 1);
                const hasData = data.length > 0;

                return (
                  <>
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-800">
                      <p className="text-sm font-semibold dark:text-gray-300 mb-2">
                        {hasData
                          ? `Visualizing ${data.length} data points from: ${chartRange}`
                          : 'No data found in the specified range'}
                      </p>
                      {hasData && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                          <p>Values: {data.map(d => d.toFixed(1)).join(', ')}</p>
                          <p>Labels: {labels.join(', ')}</p>
                        </div>
                      )}
                      {!hasData && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Enter numeric values in the Sheet tab, then specify the range above (e.g., A1:A5)
                        </p>
                      )}
                    </div>

                    {hasData ? (
                      <>
                        {/* Bar Chart */}
                        <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-lg">
                          <div className="flex items-center gap-3 mb-6">
                            <BarChart3 className="h-6 w-6 text-green-600" />
                            <h4 className="font-bold text-lg dark:text-white">Bar Chart</h4>
                          </div>
                          <div className="flex items-end justify-between h-64 gap-2 bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
                            {data.map((value, idx) => (
                              <div key={idx} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                                <div className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                  {value.toFixed(1)}
                                </div>
                                <div
                                  className="w-full rounded-t-lg transition-all hover:opacity-80 bg-gradient-to-t from-green-600 to-green-400 shadow-lg cursor-pointer"
                                  style={{ height: `${(value / maxValue) * 100}%` }}
                                  title={`${labels[idx]}: ${value}`}
                                />
                                <span className="text-xs font-semibold dark:text-gray-400 truncate w-full text-center">
                                  {labels[idx]}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Line Chart */}
                        <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-lg">
                          <div className="flex items-center gap-3 mb-6">
                            <TrendingUp className="h-6 w-6 text-blue-600" />
                            <h4 className="font-bold text-lg dark:text-white">Line Chart</h4>
                          </div>
                          <div className="relative h-64 bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
                            <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
                              {[0, 25, 50, 75, 100].map(y => (
                                <line
                                  key={y}
                                  x1="0"
                                  y1={y * 2}
                                  x2="800"
                                  y2={y * 2}
                                  stroke="currentColor"
                                  strokeWidth="0.5"
                                  className="text-gray-300 dark:text-gray-700"
                                />
                              ))}

                              <polyline
                                points={data.map((value, idx) => {
                                  const x = data.length === 1 ? 400 : (idx / (data.length - 1)) * 800;
                                  const y = 200 - (value / maxValue) * 180;
                                  return `${x},${y}`;
                                }).join(' ')}
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />

                              {data.map((value, idx) => {
                                const x = data.length === 1 ? 400 : (idx / (data.length - 1)) * 800;
                                const y = 200 - (value / maxValue) * 180;
                                return (
                                  <g key={idx}>
                                    <circle cx={x} cy={y} r="5" fill="#3b82f6" className="cursor-pointer">
                                      <title>{`${labels[idx]}: ${value}`}</title>
                                    </circle>
                                  </g>
                                );
                              })}
                            </svg>

                            <div className="flex justify-between mt-2">
                              {labels.map((label, idx) => (
                                <span key={idx} className="text-xs dark:text-gray-400">
                                  {label}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Pie Chart */}
                        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-lg">
                          <div className="flex items-center gap-3 mb-6">
                            <PieChart className="h-6 w-6 text-purple-600" />
                            <h4 className="font-bold text-lg dark:text-white">Pie Chart</h4>
                          </div>
                          <div className="flex items-center justify-center gap-8">
                            <svg width="300" height="300" viewBox="0 0 300 300">
                              {(() => {
                                const total = data.reduce((a, b) => a + b, 0);
                                let currentAngle = -90;
                                const colors = [
                                  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
                                  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
                                  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef'
                                ];

                                return data.map((value, idx) => {
                                  const percentage = (value / total) * 100;
                                  const angle = (value / total) * 360;
                                  const startAngle = currentAngle;
                                  const endAngle = currentAngle + angle;

                                  const startRad = (startAngle * Math.PI) / 180;
                                  const endRad = (endAngle * Math.PI) / 180;

                                  const x1 = 150 + 120 * Math.cos(startRad);
                                  const y1 = 150 + 120 * Math.sin(startRad);
                                  const x2 = 150 + 120 * Math.cos(endRad);
                                  const y2 = 150 + 120 * Math.sin(endRad);

                                  const largeArc = angle > 180 ? 1 : 0;
                                  const path = `M 150 150 L ${x1} ${y1} A 120 120 0 ${largeArc} 1 ${x2} ${y2} Z`;

                                  currentAngle = endAngle;

                                  return (
                                    <path
                                      key={idx}
                                      d={path}
                                      fill={colors[idx % colors.length]}
                                      className="cursor-pointer hover:opacity-80 transition-opacity"
                                    >
                                      <title>{`${labels[idx]}: ${value} (${percentage.toFixed(1)}%)`}</title>
                                    </path>
                                  );
                                });
                              })()}
                            </svg>

                            <div className="space-y-2">
                              {data.map((value, idx) => {
                                const total = data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                const colors = [
                                  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
                                  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
                                  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef'
                                ];

                                return (
                                  <div key={idx} className="flex items-center gap-2">
                                    <div
                                      className="w-4 h-4 rounded"
                                      style={{ backgroundColor: colors[idx % colors.length] }}
                                    />
                                    <span className="text-sm dark:text-gray-300">
                                      {labels[idx]}: {value} ({percentage}%)
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="p-12 text-center bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed dark:border-gray-700">
                        <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600 dark:text-gray-400 mb-2">No data to visualize</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          Enter some numeric values in the spreadsheet to see charts
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats" className="flex-1 overflow-auto mt-0 data-[state=inactive]:hidden">
          <div className="p-6">
            <div className="max-w-5xl mx-auto">
              <h3 className="text-2xl font-bold mb-6 dark:text-white">Data Statistics</h3>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="p-6 border-2 rounded-xl dark:border-gray-700 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 hover:shadow-xl transition-all">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-semibold">Total Sum</div>
                  <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">{stats.sum.toFixed(2)}</div>
                </div>

                <div className="p-6 border-2 rounded-xl dark:border-gray-700 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 hover:shadow-xl transition-all">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-semibold">Average</div>
                  <div className="text-4xl font-bold text-green-600 dark:text-green-400">{stats.avg.toFixed(2)}</div>
                </div>

                <div className="p-6 border-2 rounded-xl dark:border-gray-700 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 hover:shadow-xl transition-all">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-semibold">Count</div>
                  <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">{stats.count}</div>
                </div>

                <div className="p-6 border-2 rounded-xl dark:border-gray-700 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 hover:shadow-xl transition-all">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-semibold">Maximum</div>
                  <div className="text-4xl font-bold text-orange-600 dark:text-orange-400">{stats.max.toFixed(2)}</div>
                </div>

                <div className="p-6 border-2 rounded-xl dark:border-gray-700 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 hover:shadow-xl transition-all">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-semibold">Minimum</div>
                  <div className="text-4xl font-bold text-red-600 dark:text-red-400">{stats.min.toFixed(2)}</div>
                </div>

                <div className="p-6 border-2 rounded-xl dark:border-gray-700 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 hover:shadow-xl transition-all">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-semibold">Median</div>
                  <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{stats.median.toFixed(2)}</div>
                </div>
              </div>

              <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border dark:border-gray-700">
                <h4 className="font-bold text-lg mb-6 dark:text-white flex items-center gap-2">
                  <Calculator className="h-6 w-6" />
                  Quick Analysis
                </h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <span className="font-semibold dark:text-gray-300">Total Cells:</span>
                      <span className="font-bold text-lg text-blue-600 dark:text-blue-400">{cells.length * columns.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <span className="font-semibold dark:text-gray-300">Filled Cells:</span>
                      <span className="font-bold text-lg text-green-600 dark:text-green-400">{cells.flat().filter(c => c.value).length}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <span className="font-semibold dark:text-gray-300">Empty Cells:</span>
                      <span className="font-bold text-lg text-gray-600 dark:text-gray-400">{cells.flat().filter(c => !c.value).length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <span className="font-semibold dark:text-gray-300">With Formulas:</span>
                      <span className="font-bold text-lg text-purple-600 dark:text-purple-400">{cells.flat().filter(c => c.formula).length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
