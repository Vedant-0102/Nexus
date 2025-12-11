import React, { useState } from 'react';
import { Table, Download, Plus, Upload, Save, FileSpreadsheet, Bold, Italic, AlignLeft, AlignCenter, AlignRight, Palette, Trash2, Copy, Calculator, TrendingUp, PieChart, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Cell {
  value: string;
  formula?: string;
  style?: {
    bold?: boolean;
    italic?: boolean;
    align?: 'left' | 'center' | 'right';
    bgColor?: string;
    textColor?: string;
    fontSize?: number;
  };
}

export const Spreadsheet: React.FC = () => {
  const [cells, setCells] = useState<Cell[][]>(
    Array(30).fill(null).map(() => Array(15).fill(null).map(() => ({ value: '', style: {} })))
  );
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [selectedRange, setSelectedRange] = useState<{ start: [number, number]; end: [number, number] } | null>(null);
  const [activeTab, setActiveTab] = useState('sheet');

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

  const evaluateFormula = (formula: string, rowIdx: number, colIdx: number): string => {
    try {
      const upperFormula = formula.toUpperCase();
      
      // SUM function
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
      
      // AVERAGE function
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
      
      // COUNT function
      if (upperFormula.startsWith('=COUNT(')) {
        const range = formula.match(/=COUNT\(([A-Z]+\d+):([A-Z]+\d+)\)/i);
        if (range) {
          const [, start, end] = range;
          const { startCol, startRow, endCol, endRow } = parseRange(start, end);
          let count = 0;
          for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
              if (cells[r]?.[c]?.value) count++;
            }
          }
          return count.toString();
        }
      }
      
      // MAX function
      if (upperFormula.startsWith('=MAX(')) {
        const range = formula.match(/=MAX\(([A-Z]+\d+):([A-Z]+\d+)\)/i);
        if (range) {
          const [, start, end] = range;
          const { startCol, startRow, endCol, endRow } = parseRange(start, end);
          let max = -Infinity;
          for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
              const val = parseFloat(cells[r]?.[c]?.value || '0');
              if (!isNaN(val)) max = Math.max(max, val);
            }
          }
          return max === -Infinity ? '0' : max.toString();
        }
      }
      
      // MIN function
      if (upperFormula.startsWith('=MIN(')) {
        const range = formula.match(/=MIN\(([A-Z]+\d+):([A-Z]+\d+)\)/i);
        if (range) {
          const [, start, end] = range;
          const { startCol, startRow, endCol, endRow } = parseRange(start, end);
          let min = Infinity;
          for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
              const val = parseFloat(cells[r]?.[c]?.value || '0');
              if (!isNaN(val)) min = Math.min(min, val);
            }
          }
          return min === Infinity ? '0' : min.toString();
        }
      }
      
      // IF function
      if (upperFormula.startsWith('=IF(')) {
        const match = formula.match(/=IF\(([A-Z]+\d+)([><=!]+)(\d+),\s*"?([^,"]+)"?,\s*"?([^)]+)"?\)/i);
        if (match) {
          const [, cellRef, operator, value, trueVal, falseVal] = match;
          const cellValue = getCellValue(cellRef);
          const numValue = parseFloat(cellValue);
          const compareValue = parseFloat(value);
          
          let condition = false;
          if (operator === '>') condition = numValue > compareValue;
          else if (operator === '<') condition = numValue < compareValue;
          else if (operator === '>=') condition = numValue >= compareValue;
          else if (operator === '<=') condition = numValue <= compareValue;
          else if (operator === '=' || operator === '==') condition = numValue === compareValue;
          else if (operator === '!=') condition = numValue !== compareValue;
          
          return condition ? trueVal : falseVal;
        }
      }
      
      // Simple arithmetic
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
  
  const parseRange = (start: string, end: string) => {
    const startCol = start.match(/[A-Z]+/)?.[0].split('').reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 64, 0) - 1 || 0;
    const startRow = parseInt(start.match(/\d+/)?.[0] || '1') - 1;
    const endCol = end.match(/[A-Z]+/)?.[0].split('').reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 64, 0) - 1 || 0;
    const endRow = parseInt(end.match(/\d+/)?.[0] || '1') - 1;
    return { startCol, startRow, endCol, endRow };
  };
  
  const getCellValue = (cellRef: string): string => {
    const col = cellRef.match(/[A-Z]+/)?.[0].split('').reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 64, 0) - 1 || 0;
    const row = parseInt(cellRef.match(/\d+/)?.[0] || '1') - 1;
    return cells[row]?.[col]?.value || '0';
  };

  const handleCellChange = (rowIdx: number, colIdx: number, value: string) => {
    const newCells = [...cells];
    const isFormula = value.startsWith('=');
    
    newCells[rowIdx][colIdx] = {
      value: isFormula ? evaluateFormula(value, rowIdx, colIdx) : value,
      formula: isFormula ? value : undefined
    };
    
    setCells(newCells);
  };

  const applyStyle = (style: Partial<Cell['style']>) => {
    if (!selectedCell) return;
    const [row, col] = selectedCell;
    const newCells = [...cells];
    newCells[row][col] = {
      ...newCells[row][col],
      style: { ...newCells[row][col].style, ...style }
    };
    setCells(newCells);
  };
  
  const clearCell = () => {
    if (!selectedCell) return;
    const [row, col] = selectedCell;
    const newCells = [...cells];
    newCells[row][col] = { value: '', style: {} };
    setCells(newCells);
  };
  
  const copyCell = () => {
    if (!selectedCell) return;
    const [row, col] = selectedCell;
    const cellData = cells[row][col];
    localStorage.setItem('copiedCell', JSON.stringify(cellData));
  };
  
  const pasteCell = () => {
    if (!selectedCell) return;
    const copiedData = localStorage.getItem('copiedCell');
    if (!copiedData) return;
    
    const [row, col] = selectedCell;
    const newCells = [...cells];
    newCells[row][col] = JSON.parse(copiedData);
    setCells(newCells);
  };
  
  const insertRow = () => {
    const newRow = Array(columns.length).fill(null).map(() => ({ value: '', style: {} }));
    setCells([...cells, newRow]);
  };

  const insertColumn = () => {
    const newCells = cells.map(row => [...row, { value: '', style: {} }]);
    setCells(newCells);
  };
  
  const deleteRow = (rowIdx: number) => {
    if (cells.length > 1) {
      setCells(cells.filter((_, i) => i !== rowIdx));
    }
  };
  
  const exportToCSV = () => {
    const csv = cells.map(row => row.map(cell => cell.value).join(',')).join('\n');
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
    if (values.length === 0) return { sum: 0, avg: 0, min: 0, max: 0, count: 0 };
    
    return {
      sum: values.reduce((a, b) => a + b, 0),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length
    };
  };
  
  const stats = calculateStats();

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Table className="h-5 w-5 text-green-500" />
          <h2 className="font-semibold dark:text-white">Excel Spreadsheet</h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} size="sm" variant="outline">
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button onClick={exportToJSON} size="sm" variant="outline">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            JSON
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-3 mt-2">
          <TabsTrigger value="sheet">Sheet</TabsTrigger>
          <TabsTrigger value="formulas">Formulas</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>
        
        {/* Sheet Tab */}
        <TabsContent value="sheet" className="flex-1 flex flex-col overflow-hidden mt-0">
          {/* Toolbar */}
          <div className="flex items-center gap-2 p-2 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-wrap">
            <Button onClick={() => applyStyle({ bold: true })} size="sm" variant="outline" title="Bold">
              <Bold className="h-4 w-4" />
            </Button>
            <Button onClick={() => applyStyle({ italic: true })} size="sm" variant="outline" title="Italic">
              <Italic className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
            <Button onClick={() => applyStyle({ align: 'left' })} size="sm" variant="outline" title="Align Left">
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button onClick={() => applyStyle({ align: 'center' })} size="sm" variant="outline" title="Align Center">
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button onClick={() => applyStyle({ align: 'right' })} size="sm" variant="outline" title="Align Right">
              <AlignRight className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
            <input
              type="color"
              onChange={(e) => applyStyle({ bgColor: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer"
              title="Background Color"
            />
            <input
              type="color"
              onChange={(e) => applyStyle({ textColor: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer"
              title="Text Color"
            />
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
            <Button onClick={copyCell} size="sm" variant="outline" title="Copy">
              <Copy className="h-4 w-4" />
            </Button>
            <Button onClick={pasteCell} size="sm" variant="outline" title="Paste">
              Paste
            </Button>
            <Button onClick={clearCell} size="sm" variant="outline" title="Clear">
              <Trash2 className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
            <Button onClick={insertRow} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Row
            </Button>
            <Button onClick={insertColumn} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Column
            </Button>
          </div>
          
          {/* Spreadsheet Grid */}
          <div className="flex-1 overflow-auto">
            <table className="border-collapse" style={{ tableLayout: 'fixed' }}>
              <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800 z-10">
                <tr>
                  <th className="border dark:border-gray-700 p-2 w-12 text-xs font-semibold dark:text-gray-300">#</th>
                  {columns.map(col => (
                    <th key={col} className="border dark:border-gray-700 p-2 w-32 text-xs font-semibold dark:text-gray-300">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cells.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    <td className="border dark:border-gray-700 p-2 text-center text-xs font-semibold bg-gray-50 dark:bg-gray-800 dark:text-gray-300 relative group">
                      {rowIdx + 1}
                      <button
                        onClick={() => deleteRow(rowIdx)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 bg-red-500 text-white rounded-l text-xs"
                        title="Delete Row"
                      >
                        ×
                      </button>
                    </td>
                    {row.map((cell, colIdx) => (
                      <td
                        key={colIdx}
                        className={`border dark:border-gray-700 p-0 ${
                          selectedCell?.[0] === rowIdx && selectedCell?.[1] === colIdx
                            ? 'ring-2 ring-blue-500'
                            : ''
                        }`}
                        onClick={() => setSelectedCell([rowIdx, colIdx])}
                        style={{ backgroundColor: cell.style?.bgColor, width: '128px' }}
                      >
                        <input
                          type="text"
                          value={cell.formula || cell.value}
                          onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)}
                          className="w-full h-full px-2 py-1.5 text-sm bg-transparent focus:outline-none dark:text-white"
                          style={{
                            fontWeight: cell.style?.bold ? 'bold' : 'normal',
                            fontStyle: cell.style?.italic ? 'italic' : 'normal',
                            textAlign: cell.style?.align || 'left',
                            color: cell.style?.textColor || 'inherit',
                            fontSize: cell.style?.fontSize ? `${cell.style.fontSize}px` : '14px'
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Status Bar */}
          <div className="p-2 border-t dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 flex items-center justify-between">
            <span>
              {selectedCell && `Selected: ${columns[selectedCell[1]]}${selectedCell[0] + 1}`}
            </span>
            <span>Rows: {cells.length} | Cols: {columns.length}</span>
          </div>
        </TabsContent>
        
        {/* Formulas Tab */}
        <TabsContent value="formulas" className="flex-1 overflow-auto mt-0">
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-lg font-bold mb-4 dark:text-white">Available Formulas</h3>
              <div className="grid md:grid-cols-2 gap-4">
              {[
                { name: 'SUM', syntax: '=SUM(A1:A10)', desc: 'Adds all numbers in a range' },
                { name: 'AVERAGE', syntax: '=AVERAGE(B1:B5)', desc: 'Calculates the average of numbers' },
                { name: 'COUNT', syntax: '=COUNT(C1:C20)', desc: 'Counts cells with numbers' },
                { name: 'MAX', syntax: '=MAX(D1:D10)', desc: 'Returns the largest value' },
                { name: 'MIN', syntax: '=MIN(E1:E10)', desc: 'Returns the smallest value' },
                { name: 'IF', syntax: '=IF(A1>10,"High","Low")', desc: 'Conditional logic' },
                { name: 'ADD', syntax: '=A1+B1', desc: 'Add two cells' },
                { name: 'SUBTRACT', syntax: '=A1-B1', desc: 'Subtract two cells' },
                { name: 'MULTIPLY', syntax: '=A1*B1', desc: 'Multiply two cells' },
                { name: 'DIVIDE', syntax: '=A1/B1', desc: 'Divide two cells' }
              ].map((formula, idx) => (
                <div key={idx} className="p-4 border-2 rounded-lg dark:border-gray-700 hover:border-green-500 transition-all">
                  <h4 className="font-bold text-green-600 dark:text-green-400 mb-2">{formula.name}</h4>
                  <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm mb-2 dark:text-gray-300">
                    {formula.syntax}
                  </code>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{formula.desc}</p>
                </div>
              ))}
            </div>
            
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="font-bold mb-2 dark:text-white">💡 Tips</h4>
                <ul className="text-sm space-y-1 dark:text-gray-300">
                  <li>• All formulas start with = sign</li>
                  <li>• Use cell references like A1, B2, etc.</li>
                  <li>• Ranges use colon notation: A1:A10</li>
                  <li>• Formulas are case-insensitive</li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>
        
        {/* Charts Tab */}
        <TabsContent value="charts" className="flex-1 overflow-auto mt-0">
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-lg font-bold mb-6 dark:text-white">Data Visualization</h3>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="p-6 border-2 rounded-lg text-center hover:border-green-500 transition-all cursor-pointer dark:border-gray-700">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 text-green-600" />
                <h4 className="font-bold mb-2 dark:text-white">Bar Chart</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Compare values across categories</p>
              </div>
              
              <div className="p-6 border-2 rounded-lg text-center hover:border-blue-500 transition-all cursor-pointer dark:border-gray-700">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 text-blue-600" />
                <h4 className="font-bold mb-2 dark:text-white">Line Chart</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Show trends over time</p>
              </div>
              
              <div className="p-6 border-2 rounded-lg text-center hover:border-purple-500 transition-all cursor-pointer dark:border-gray-700">
                <PieChart className="h-12 w-12 mx-auto mb-3 text-purple-600" />
                <h4 className="font-bold mb-2 dark:text-white">Pie Chart</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Display proportions</p>
              </div>
            </div>
            
              <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-bold mb-4 dark:text-white">Sample Chart Preview</h4>
                <div className="flex items-end justify-between h-48 gap-2">
                  {[65, 59, 80, 81, 56, 72, 88, 45, 92, 78].map((value, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full rounded-t transition-all hover:opacity-80 bg-green-500" style={{ height: `${value}%` }} />
                      <span className="text-xs dark:text-gray-400">{idx + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        {/* Statistics Tab */}
        <TabsContent value="stats" className="flex-1 overflow-auto mt-0">
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-lg font-bold mb-6 dark:text-white">Data Statistics</h3>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <div className="p-6 border-2 rounded-lg dark:border-gray-700 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Sum</div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.sum.toFixed(2)}</div>
              </div>
              
              <div className="p-6 border-2 rounded-lg dark:border-gray-700 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Average</div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.avg.toFixed(2)}</div>
              </div>
              
              <div className="p-6 border-2 rounded-lg dark:border-gray-700 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Count</div>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.count}</div>
              </div>
              
              <div className="p-6 border-2 rounded-lg dark:border-gray-700 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Maximum</div>
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.max.toFixed(2)}</div>
              </div>
              
              <div className="p-6 border-2 rounded-lg dark:border-gray-700 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Minimum</div>
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.min.toFixed(2)}</div>
              </div>
              
              <div className="p-6 border-2 rounded-lg dark:border-gray-700 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Range</div>
                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{(stats.max - stats.min).toFixed(2)}</div>
              </div>
            </div>
            
              <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-bold mb-4 dark:text-white flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Quick Analysis
                </h4>
                <div className="space-y-3 text-sm dark:text-gray-300">
                  <div className="flex justify-between">
                    <span>Total Cells:</span>
                    <span className="font-bold">{cells.length * columns.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Filled Cells:</span>
                    <span className="font-bold">{cells.flat().filter(c => c.value).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Empty Cells:</span>
                    <span className="font-bold">{cells.flat().filter(c => !c.value).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cells with Formulas:</span>
                    <span className="font-bold">{cells.flat().filter(c => c.formula).length}</span>
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
