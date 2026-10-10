import React, { useState, useEffect } from 'react';
import { DatabaseEngine } from './DatabaseEngine';
import { Database, Play, Trash2, RefreshCw, Table as TableIcon, Download, Wand2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loadSampleData } from './sampleData';
import { QueryBuilder } from './QueryBuilder';
import { useModal } from '@/components/ui/modal';

export const DatabaseApp: React.FC = () => {
  const [engine] = useState(() => new DatabaseEngine());
  const [sqlInput, setSqlInput] = useState('');
  const { confirm, Modal } = useModal();
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [resultData, setResultData] = useState<{ columns: string[]; rows: string[][] } | null>(null);
  const [showQueryBuilder, setShowQueryBuilder] = useState(false);

  useEffect(() => {
    refreshTables();
    addConsoleLog('Mini Database Engine - Ready!', 'info');
    addConsoleLog('Type SQL commands and click Execute', 'info');
  }, []);

  const refreshTables = () => {
    const allTables = engine.storage.getAllTables();
    setTables(allTables);
    addConsoleLog(`Refreshed: ${allTables.length} table(s) found`, 'info');
  };

  const addConsoleLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const prefix = type === 'success' ? '✓' : type === 'error' ? '✗' : '▶';
    setConsoleOutput(prev => [...prev, `${prefix} ${message}`]);
  };

  const executeSQL = () => {
    if (!sqlInput.trim()) return;

    addConsoleLog(`Executing: ${sqlInput}`, 'info');

    const result = engine.execute(sqlInput);

    if (result.success) {
      addConsoleLog(result.message || 'Success', 'success');
      
      if (result.data) {
        setResultData(result.data);
      } else {
        setResultData(null);
      }
      
      refreshTables();
    } else {
      addConsoleLog(result.error || 'Error', 'error');
    }
  };

  const clearInput = () => {
    setSqlInput('');
  };

  const insertTemplate = () => {
    if (selectedTable) {
      try {
        const { columns } = engine.storage.readTable(selectedTable);
        const values = columns.map((_, i) => `'value${i + 1}'`).join(', ');
        setSqlInput(`INSERT INTO ${selectedTable} VALUES (${values})`);
      } catch (e) {
        addConsoleLog('Error loading table', 'error');
      }
    }
  };

  const selectTemplate = () => {
    if (selectedTable) {
      setSqlInput(`SELECT * FROM ${selectedTable}`);
    }
  };

  const updateTemplate = () => {
    if (selectedTable) {
      setSqlInput(`UPDATE ${selectedTable} SET column = 'value' WHERE id = 1`);
    }
  };

  const deleteTemplate = () => {
    if (selectedTable) {
      setSqlInput(`DELETE FROM ${selectedTable} WHERE id = 1`);
    }
  };

  const viewTableData = (tableName: string) => {
    setSelectedTable(tableName);
    const query = `SELECT * FROM ${tableName}`;
    setSqlInput(query);
    
    // Execute directly with the query instead of relying on state
    addConsoleLog(`Executing: ${query}`, 'info');
    const result = engine.execute(query);

    if (result.success) {
      addConsoleLog(result.message || 'Success', 'success');
      if (result.data) {
        setResultData(result.data);
      }
    } else {
      addConsoleLog(result.error || 'Error', 'error');
    }
  };

  const handleLoadSampleData = () => {
    try {
      loadSampleData(engine);
      refreshTables();
      addConsoleLog('Sample data loaded (employees, products, customers, departments, orders)', 'success');
    } catch (error) {
      addConsoleLog('Error loading sample data: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    }
  };

  const handleRefresh = () => {
    refreshTables();
  };

  const handleGenerateQuery = (query: string) => {
    setSqlInput(query);
    addConsoleLog(`Generated query: ${query}`, 'info');
  };

  const handleDropTable = (tableName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering viewTableData
    
    confirm(
      `Are you sure you want to drop table '${tableName}'? This cannot be undone.`,
      () => {
        const result = engine.execute(`DROP TABLE ${tableName}`);
        
        if (result.success) {
          addConsoleLog(`Table '${tableName}' dropped successfully`, 'success');
          if (selectedTable === tableName) {
            setSelectedTable(null);
            setResultData(null);
          }
          refreshTables();
        } else {
          addConsoleLog(result.error || 'Error dropping table', 'error');
        }
      },
      'Drop Table'
    );
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <Database className="text-blue-500" size={24} />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Mini Database Engine</h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleLoadSampleData} variant="outline" size="sm" title="Load Sample Data">
            <Download size={14} className="mr-1" />
            Sample Data
          </Button>
          <Button onClick={handleRefresh} variant="outline" size="sm" title="Refresh Tables">
            <RefreshCw size={14} />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tables */}
        <div className="w-64 border-r border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">📊 Tables</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {tables.length === 0 ? (
              <p className="text-xs text-gray-500 p-2">No tables yet</p>
            ) : (
              tables.map(table => (
                <div
                  key={table}
                  className={`flex items-center justify-between px-3 py-2 rounded text-sm transition-colors group ${
                    selectedTable === table
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <button
                    onClick={() => viewTableData(table)}
                    className="flex-1 text-left"
                  >
                    <TableIcon size={14} className="inline mr-2" />
                    {table}
                  </button>
                  <button
                    onClick={(e) => handleDropTable(table, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-opacity"
                    title="Drop table"
                  >
                    <X size={14} className="text-red-600 dark:text-red-400" />
                  </button>
                </div>
              ))
            )}
          </div>
          
          {/* Quick Actions */}
          <div className="p-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Quick Actions</p>
            <div className="space-y-1">
              <Button onClick={selectTemplate} variant="outline" size="sm" className="w-full text-xs" disabled={!selectedTable}>
                SELECT
              </Button>
              <Button onClick={insertTemplate} variant="outline" size="sm" className="w-full text-xs" disabled={!selectedTable}>
                INSERT
              </Button>
              <Button onClick={updateTemplate} variant="outline" size="sm" className="w-full text-xs" disabled={!selectedTable}>
                UPDATE
              </Button>
              <Button onClick={deleteTemplate} variant="outline" size="sm" className="w-full text-xs" disabled={!selectedTable}>
                DELETE
              </Button>
            </div>
          </div>
        </div>

        {/* Center - SQL Editor & Results */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* SQL Editor */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">💻 SQL Editor</h3>
              <div className="flex gap-2">
                <Button onClick={() => setShowQueryBuilder(true)} variant="outline" size="sm" className="bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30">
                  <Wand2 size={14} className="mr-1" />
                  Query Builder
                </Button>
                <Button onClick={executeSQL} size="sm" className="bg-green-600 hover:bg-green-700">
                  <Play size={14} className="mr-1" />
                  Execute
                </Button>
                <Button onClick={clearInput} variant="outline" size="sm">
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
            <textarea
              value={sqlInput}
              onChange={(e) => setSqlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  executeSQL();
                }
              }}
              className="w-full h-24 p-3 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter SQL command... (Ctrl+Enter to execute)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Examples: SELECT * FROM users | SELECT * FROM employees LEFT JOIN departments ON employees.department = departments.name | SELECT department, COUNT(*) FROM employees GROUP BY department
            </p>
          </div>

          {/* Results Grid */}
          <div className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-gray-900">
            {resultData ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                      <tr>
                        {resultData.columns.map((col, i) => (
                          <th key={i} className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {resultData.rows.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          {row.map((cell, j) => (
                            <td key={j} className="px-4 py-2 text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
                  {resultData.rows.length} row(s)
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Database size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Execute a SELECT query to see results</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Console */}
        <div className="w-80 border-l border-gray-300 dark:border-gray-700 bg-gray-900 text-green-400 flex flex-col">
          <div className="p-3 border-b border-gray-700">
            <h3 className="text-sm font-semibold">🖥️ Console</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1">
            {consoleOutput.map((line, i) => (
              <div key={i} className={
                line.startsWith('✓') ? 'text-green-400' :
                line.startsWith('✗') ? 'text-red-400' :
                'text-blue-400'
              }>
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Query Builder Modal */}
      {showQueryBuilder && (
        <QueryBuilder
          tables={tables}
          onGenerateQuery={handleGenerateQuery}
          onClose={() => setShowQueryBuilder(false)}
          engine={engine}
        />
      )}

      {/* Confirmation Modal */}
      <Modal />
    </div>
  );
};
