import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Plus, Trash2 } from 'lucide-react';

interface QueryBuilderProps {
  tables: string[];
  onGenerateQuery: (query: string) => void;
  onClose: () => void;
  engine: any;
}

type QueryType = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CREATE';

export const QueryBuilder: React.FC<QueryBuilderProps> = ({ tables, onGenerateQuery, onClose, engine }) => {
  const [queryType, setQueryType] = useState<QueryType>('SELECT');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [whereColumn, setWhereColumn] = useState<string>('');
  const [whereValue, setWhereValue] = useState<string>('');
  const [insertValues, setInsertValues] = useState<Record<string, string>>({});
  const [updateValues, setUpdateValues] = useState<Record<string, string>>({});
  const [newTableName, setNewTableName] = useState<string>('');
  const [newColumns, setNewColumns] = useState<string[]>(['']);

  // Load columns when table is selected
  const handleTableSelect = (table: string) => {
    setSelectedTable(table);
    try {
      const { columns: tableColumns } = engine.storage.readTable(table);
      setColumns(tableColumns);
      setSelectedColumns([]);
      setWhereColumn('');
      setWhereValue('');
      
      // Initialize insert/update values
      const initialValues: Record<string, string> = {};
      tableColumns.forEach((col: string) => {
        initialValues[col] = '';
      });
      setInsertValues(initialValues);
      setUpdateValues(initialValues);
    } catch (e) {
      console.error('Error loading table columns:', e);
    }
  };

  const generateQuery = () => {
    let query = '';

    switch (queryType) {
      case 'SELECT':
        if (!selectedTable) {
          alert('Please select a table');
          return;
        }
        const cols = selectedColumns.length > 0 ? selectedColumns.join(', ') : '*';
        query = `SELECT ${cols} FROM ${selectedTable}`;
        if (whereColumn && whereValue) {
          query += ` WHERE ${whereColumn} = '${whereValue}'`;
        }
        break;

      case 'INSERT':
        if (!selectedTable) {
          alert('Please select a table');
          return;
        }
        const values = columns.map(col => `'${insertValues[col] || ''}'`).join(', ');
        query = `INSERT INTO ${selectedTable} VALUES (${values})`;
        break;

      case 'UPDATE':
        if (!selectedTable) {
          alert('Please select a table');
          return;
        }
        const updates = columns
          .filter(col => updateValues[col])
          .map(col => `${col} = '${updateValues[col]}'`)
          .join(', ');
        
        if (!updates) {
          alert('Please enter at least one value to update');
          return;
        }
        
        query = `UPDATE ${selectedTable} SET ${updates}`;
        if (whereColumn && whereValue) {
          query += ` WHERE ${whereColumn} = '${whereValue}'`;
        }
        break;

      case 'DELETE':
        if (!selectedTable) {
          alert('Please select a table');
          return;
        }
        query = `DELETE FROM ${selectedTable}`;
        if (whereColumn && whereValue) {
          query += ` WHERE ${whereColumn} = '${whereValue}'`;
        } else {
          if (!confirm('This will delete ALL rows. Continue?')) {
            return;
          }
        }
        break;

      case 'CREATE':
        if (!newTableName) {
          alert('Please enter a table name');
          return;
        }
        const validColumns = newColumns.filter(col => col.trim());
        if (validColumns.length === 0) {
          alert('Please enter at least one column name');
          return;
        }
        query = `CREATE TABLE ${newTableName} (${validColumns.join(', ')})`;
        break;
    }

    onGenerateQuery(query);
    onClose();
  };

  const toggleColumn = (col: string) => {
    if (selectedColumns.includes(col)) {
      setSelectedColumns(selectedColumns.filter(c => c !== col));
    } else {
      setSelectedColumns([...selectedColumns, col]);
    }
  };

  const addNewColumn = () => {
    setNewColumns([...newColumns, '']);
  };

  const updateNewColumn = (index: number, value: string) => {
    const updated = [...newColumns];
    updated[index] = value;
    setNewColumns(updated);
  };

  const removeNewColumn = (index: number) => {
    setNewColumns(newColumns.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">🧙 Query Builder</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Query Type Selection */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">
              What do you want to do?
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE'] as QueryType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setQueryType(type)}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    queryType === type
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* CREATE TABLE Form */}
          {queryType === 'CREATE' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  Table Name
                </label>
                <input
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="e.g., users"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  Columns
                </label>
                <div className="space-y-2">
                  {newColumns.map((col, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={col}
                        onChange={(e) => updateNewColumn(index, e.target.value)}
                        placeholder={`Column ${index + 1} (e.g., id, name, email)`}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      />
                      {newColumns.length > 1 && (
                        <button
                          onClick={() => removeNewColumn(index)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={addNewColumn}
                  className="mt-2 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded flex items-center gap-1"
                >
                  <Plus size={14} /> Add Column
                </button>
              </div>
            </div>
          )}

          {/* Table Selection (for non-CREATE queries) */}
          {queryType !== 'CREATE' && (
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">
                Select Table
              </label>
              <select
                value={selectedTable}
                onChange={(e) => handleTableSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="">-- Choose a table --</option>
                {tables.map(table => (
                  <option key={table} value={table}>{table}</option>
                ))}
              </select>
            </div>
          )}

          {/* SELECT: Column Selection */}
          {queryType === 'SELECT' && selectedTable && (
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">
                Select Columns (leave empty for all)
              </label>
              <div className="flex flex-wrap gap-2">
                {columns.map(col => (
                  <button
                    key={col}
                    onClick={() => toggleColumn(col)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      selectedColumns.includes(col)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* INSERT: Value Entry */}
          {queryType === 'INSERT' && selectedTable && (
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">
                Enter Values
              </label>
              <div className="space-y-3">
                {columns.map(col => (
                  <div key={col}>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                      {col}
                    </label>
                    <input
                      type="text"
                      value={insertValues[col] || ''}
                      onChange={(e) => setInsertValues({ ...insertValues, [col]: e.target.value })}
                      placeholder={`Enter ${col}`}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* UPDATE: Value Entry */}
          {queryType === 'UPDATE' && selectedTable && (
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">
                Update Values (leave empty to keep unchanged)
              </label>
              <div className="space-y-3">
                {columns.map(col => (
                  <div key={col}>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                      {col}
                    </label>
                    <input
                      type="text"
                      value={updateValues[col] || ''}
                      onChange={(e) => setUpdateValues({ ...updateValues, [col]: e.target.value })}
                      placeholder={`New value for ${col}`}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* WHERE Clause (for SELECT, UPDATE, DELETE) */}
          {['SELECT', 'UPDATE', 'DELETE'].includes(queryType) && selectedTable && (
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">
                Filter (Optional)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                    Column
                  </label>
                  <select
                    value={whereColumn}
                    onChange={(e) => setWhereColumn(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">-- No filter --</option>
                    {columns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                    Value
                  </label>
                  <input
                    type="text"
                    value={whereValue}
                    onChange={(e) => setWhereValue(e.target.value)}
                    placeholder="Filter value"
                    disabled={!whereColumn}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={generateQuery} className="bg-green-600 hover:bg-green-700">
            Generate Query
          </Button>
        </div>
      </div>
    </div>
  );
};
