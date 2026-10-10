import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Plus, Trash2 } from 'lucide-react';

interface QueryBuilderProps {
  tables: string[];
  onGenerateQuery: (query: string) => void;
  onClose: () => void;
  engine: any;
}

type QueryType = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CREATE';
type JoinType = 'INNER JOIN' | 'LEFT JOIN' | 'RIGHT JOIN' | 'FULL JOIN' | 'CROSS JOIN';
type SqlOperator = '=' | '!=' | '<>' | '<' | '>' | '<=' | '>=' | 'LIKE';
type AggregateFn = 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX';

interface JoinRow {
  type: JoinType;
  table: string;
  alias: string;
  leftColumn: string;
  operator: SqlOperator;
  rightColumn: string;
}

interface WhereRow {
  logic: 'AND' | 'OR';
  column: string;
  operator: SqlOperator;
  value: string;
}

interface AggregateRow {
  func: AggregateFn;
  column: string;
  alias: string;
}

const OPERATORS: SqlOperator[] = ['=', '!=', '<>', '<', '>', '<=', '>=', 'LIKE'];
const JOIN_TYPES: JoinType[] = ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'CROSS JOIN'];
const AGG_FUNCS: AggregateFn[] = ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX'];

function quoteValue(value: string): string {
  if (value !== '' && /^-?\d+(\.\d+)?$/.test(value)) return value;
  return `'${value.replace(/'/g, "''")}'`;
}

function qualify(table: string, alias: string, column: string): string {
  const prefix = alias.trim() || table;
  return `${prefix}.${column}`;
}

export const QueryBuilder: React.FC<QueryBuilderProps> = ({ tables, onGenerateQuery, onClose, engine }) => {
  const [queryType, setQueryType] = useState<QueryType>('SELECT');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableAlias, setTableAlias] = useState<string>('');
  const [columns, setColumns] = useState<string[]>([]);
  const [tableColumnMap, setTableColumnMap] = useState<Record<string, string[]>>({});
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [insertValues, setInsertValues] = useState<Record<string, string>>({});
  const [insertNamedColumns, setInsertNamedColumns] = useState(true);
  const [insertSelectedColumns, setInsertSelectedColumns] = useState<string[]>([]);
  const [updateValues, setUpdateValues] = useState<Record<string, string>>({});
  const [newTableName, setNewTableName] = useState<string>('');
  const [newColumns, setNewColumns] = useState<string[]>(['']);
  const [joins, setJoins] = useState<JoinRow[]>([]);
  const [whereRows, setWhereRows] = useState<WhereRow[]>([
    { logic: 'AND', column: '', operator: '=', value: '' },
  ]);
  const [distinct, setDistinct] = useState(false);
  const [aggregates, setAggregates] = useState<AggregateRow[]>([]);
  const [groupByColumns, setGroupByColumns] = useState<string[]>([]);
  const [orderByColumn, setOrderByColumn] = useState('');
  const [orderByDirection, setOrderByDirection] = useState<'ASC' | 'DESC'>('ASC');
  const [limit, setLimit] = useState('');
  const [offset, setOffset] = useState('');

  const loadTableColumns = (table: string): string[] => {
    if (tableColumnMap[table]) return tableColumnMap[table];
    try {
      const { columns: tableColumns } = engine.storage.readTable(table);
      setTableColumnMap(prev => ({ ...prev, [table]: tableColumns }));
      return tableColumns;
    } catch (e) {
      console.error('Error loading table columns:', e);
      return [];
    }
  };

  const handleTableSelect = (table: string) => {
    setSelectedTable(table);
    setTableAlias('');
    setJoins([]);
    setAggregates([]);
    setGroupByColumns([]);
    setOrderByColumn('');
    setLimit('');
    setOffset('');
    setDistinct(false);
    setWhereRows([{ logic: 'AND', column: '', operator: '=', value: '' }]);
    try {
      const { columns: tableColumns } = engine.storage.readTable(table);
      setColumns(tableColumns);
      setTableColumnMap(prev => ({ ...prev, [table]: tableColumns }));
      setSelectedColumns([]);
      setInsertSelectedColumns(tableColumns);
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

  const joinableColumns = useMemo(() => {
    if (!selectedTable) return [];
    const names: string[] = [];
    const seen = new Set<string>();
    const add = (table: string, alias: string, cols: string[]) => {
      cols.forEach(col => {
        const qualified = qualify(table, alias, col);
        if (!seen.has(qualified)) {
          seen.add(qualified);
          names.push(qualified);
        }
      });
    };
    add(selectedTable, tableAlias, columns);
    joins.forEach(join => {
      if (!join.table) return;
      add(join.table, join.alias, tableColumnMap[join.table] || []);
    });
    return names;
  }, [selectedTable, tableAlias, columns, joins, tableColumnMap]);

  const usesJoins = joins.some(j => j.table);
  const selectColumnOptions = usesJoins || tableAlias.trim() ? joinableColumns : columns;

  const activeWhere = whereRows.filter(row => row.column && row.value !== '');

  const generateQuery = () => {
    let query = '';

    switch (queryType) {
      case 'SELECT': {
        if (!selectedTable) {
          alert('Please select a table');
          return;
        }
        const fromName = tableAlias.trim() ? `${selectedTable} ${tableAlias.trim()}` : selectedTable;
        const selectParts: string[] = [];
        if (selectedColumns.length) selectParts.push(...selectedColumns);
        aggregates.forEach(agg => {
          const arg = agg.func === 'COUNT' && !agg.column ? '*' : (agg.column || '*');
          const expr = `${agg.func}(${arg})`;
          selectParts.push(agg.alias.trim() ? `${expr} AS ${agg.alias.trim()}` : expr);
        });
        const cols = selectParts.length ? selectParts.join(', ') : '*';
        query = `SELECT ${distinct ? 'DISTINCT ' : ''}${cols} FROM ${fromName}`;

        for (const join of joins) {
          if (!join.table) continue;
          const rightName = join.alias.trim() ? `${join.table} ${join.alias.trim()}` : join.table;
          if (join.type === 'CROSS JOIN') {
            query += ` CROSS JOIN ${rightName}`;
          } else {
            if (!join.leftColumn || !join.rightColumn) {
              alert('Each JOIN needs an ON condition (or use CROSS JOIN)');
              return;
            }
            query += ` ${join.type} ${rightName} ON ${join.leftColumn} ${join.operator} ${join.rightColumn}`;
          }
        }

        if (activeWhere.length) {
          query += ' WHERE ' + activeWhere.map((row, i) => {
            const clause = `${row.column} ${row.operator} ${quoteValue(row.value)}`;
            return i === 0 ? clause : `${row.logic} ${clause}`;
          }).join(' ');
        }

        if (groupByColumns.length) {
          query += ` GROUP BY ${groupByColumns.join(', ')}`;
        }

        if (orderByColumn) {
          query += ` ORDER BY ${orderByColumn} ${orderByDirection}`;
        }

        if (limit.trim()) {
          query += ` LIMIT ${limit.trim()}`;
        }
        if (offset.trim()) {
          query += ` OFFSET ${offset.trim()}`;
        }
        break;
      }

      case 'INSERT': {
        if (!selectedTable) {
          alert('Please select a table');
          return;
        }
        if (insertNamedColumns) {
          const cols = insertSelectedColumns.length ? insertSelectedColumns : columns.filter(col => insertValues[col]);
          if (!cols.length) {
            alert('Select at least one column to insert');
            return;
          }
          const values = cols.map(col => quoteValue(insertValues[col] || ''));
          query = `INSERT INTO ${selectedTable} (${cols.join(', ')}) VALUES (${values.join(', ')})`;
        } else {
          const values = columns.map(col => quoteValue(insertValues[col] || ''));
          query = `INSERT INTO ${selectedTable} VALUES (${values.join(', ')})`;
        }
        break;
      }

      case 'UPDATE': {
        if (!selectedTable) {
          alert('Please select a table');
          return;
        }
        const updates = columns
          .filter(col => updateValues[col])
          .map(col => `${col} = ${quoteValue(updateValues[col])}`)
          .join(', ');

        if (!updates) {
          alert('Please enter at least one value to update');
          return;
        }

        query = `UPDATE ${selectedTable} SET ${updates}`;
        if (activeWhere.length) {
          query += ' WHERE ' + activeWhere.map((row, i) => {
            const clause = `${row.column} ${row.operator} ${quoteValue(row.value)}`;
            return i === 0 ? clause : `${row.logic} ${clause}`;
          }).join(' ');
        }
        break;
      }

      case 'DELETE': {
        if (!selectedTable) {
          alert('Please select a table');
          return;
        }
        query = `DELETE FROM ${selectedTable}`;
        if (activeWhere.length) {
          query += ' WHERE ' + activeWhere.map((row, i) => {
            const clause = `${row.column} ${row.operator} ${quoteValue(row.value)}`;
            return i === 0 ? clause : `${row.logic} ${clause}`;
          }).join(' ');
        } else if (!confirm('This will delete ALL rows. Continue?')) {
          return;
        }
        break;
      }

      case 'CREATE': {
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

  const toggleInsertColumn = (col: string) => {
    if (insertSelectedColumns.includes(col)) {
      setInsertSelectedColumns(insertSelectedColumns.filter(c => c !== col));
    } else {
      setInsertSelectedColumns([...insertSelectedColumns, col]);
    }
  };

  const toggleGroupBy = (col: string) => {
    if (groupByColumns.includes(col)) {
      setGroupByColumns(groupByColumns.filter(c => c !== col));
    } else {
      setGroupByColumns([...groupByColumns, col]);
    }
  };

  const addJoin = () => {
    setJoins([
      ...joins,
      { type: 'INNER JOIN', table: '', alias: '', leftColumn: '', operator: '=', rightColumn: '' },
    ]);
  };

  const updateJoin = (index: number, patch: Partial<JoinRow>) => {
    const next = [...joins];
    next[index] = { ...next[index], ...patch };
    if (patch.table) {
      loadTableColumns(patch.table);
      next[index].rightColumn = '';
    }
    setJoins(next);
  };

  const addWhereRow = () => {
    setWhereRows([...whereRows, { logic: 'AND', column: '', operator: '=', value: '' }]);
  };

  const updateWhereRow = (index: number, patch: Partial<WhereRow>) => {
    const next = [...whereRows];
    next[index] = { ...next[index], ...patch };
    setWhereRows(next);
  };

  const addAggregate = () => {
    setAggregates([...aggregates, { func: 'COUNT', column: '*', alias: '' }]);
  };

  const updateAggregate = (index: number, patch: Partial<AggregateRow>) => {
    const next = [...aggregates];
    next[index] = { ...next[index], ...patch };
    setAggregates(next);
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

  const whereColumnOptions = queryType === 'SELECT' ? selectColumnOptions : columns;
  const inputClass = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100';
  const labelClass = 'block text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100';
  const hintClass = 'block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">🧙 Query Builder</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className={labelClass}>What do you want to do?</label>
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

          {queryType === 'CREATE' && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Table Name</label>
                <input
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="e.g., users"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Columns</label>
                <div className="space-y-2">
                  {newColumns.map((col, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={col}
                        onChange={(e) => updateNewColumn(index, e.target.value)}
                        placeholder={`Column ${index + 1} (e.g., id, name, email)`}
                        className={`flex-1 ${inputClass}`}
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

          {queryType !== 'CREATE' && (
            <div className={queryType === 'SELECT' ? 'grid grid-cols-2 gap-3' : ''}>
              <div>
                <label className={labelClass}>Select Table</label>
                <select
                  value={selectedTable}
                  onChange={(e) => handleTableSelect(e.target.value)}
                  className={inputClass}
                >
                  <option value="">-- Choose a table --</option>
                  {tables.map(table => (
                    <option key={table} value={table}>{table}</option>
                  ))}
                </select>
              </div>
              {queryType === 'SELECT' && selectedTable && (
                <div>
                  <label className={labelClass}>Table alias (optional)</label>
                  <input
                    type="text"
                    value={tableAlias}
                    onChange={(e) => setTableAlias(e.target.value)}
                    placeholder="e.g., e for employees"
                    className={inputClass}
                  />
                </div>
              )}
            </div>
          )}

          {queryType === 'SELECT' && selectedTable && (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-900 dark:text-gray-100">Joins</label>
                  <button
                    onClick={addJoin}
                    className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded flex items-center gap-1"
                  >
                    <Plus size={14} /> Add JOIN
                  </button>
                </div>
                {joins.length === 0 && (
                  <p className="text-xs text-gray-500">Add INNER, LEFT, RIGHT, FULL, or CROSS JOIN.</p>
                )}
                <div className="space-y-3">
                  {joins.map((join, index) => {
                    const rightCols = join.table ? (tableColumnMap[join.table] || []).map(col => qualify(join.table, join.alias, col)) : [];
                    return (
                      <div key={index} className="p-3 border border-gray-200 dark:border-gray-700 rounded space-y-2">
                        <div className="grid grid-cols-12 gap-2">
                          <select
                            value={join.type}
                            onChange={(e) => updateJoin(index, { type: e.target.value as JoinType })}
                            className={`col-span-3 ${inputClass}`}
                          >
                            {JOIN_TYPES.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                          <select
                            value={join.table}
                            onChange={(e) => updateJoin(index, { table: e.target.value })}
                            className={`col-span-4 ${inputClass}`}
                          >
                            <option value="">-- table --</option>
                            {tables.map(table => (
                              <option key={table} value={table}>{table}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={join.alias}
                            onChange={(e) => updateJoin(index, { alias: e.target.value })}
                            placeholder="alias"
                            className={`col-span-4 ${inputClass}`}
                          />
                          <button
                            onClick={() => setJoins(joins.filter((_, i) => i !== index))}
                            className="col-span-1 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        {join.type !== 'CROSS JOIN' && (
                          <div className="grid grid-cols-12 gap-2 items-center">
                            <select
                              value={join.leftColumn}
                              onChange={(e) => updateJoin(index, { leftColumn: e.target.value })}
                              className={`col-span-5 ${inputClass}`}
                            >
                              <option value="">ON left column</option>
                              {joinableColumns.map(col => (
                                <option key={col} value={col}>{col}</option>
                              ))}
                            </select>
                            <select
                              value={join.operator}
                              onChange={(e) => updateJoin(index, { operator: e.target.value as SqlOperator })}
                              className={`col-span-2 ${inputClass}`}
                            >
                              {OPERATORS.map(op => (
                                <option key={op} value={op}>{op}</option>
                              ))}
                            </select>
                            <select
                              value={join.rightColumn}
                              onChange={(e) => updateJoin(index, { rightColumn: e.target.value })}
                              className={`col-span-5 ${inputClass}`}
                            >
                              <option value="">ON right column</option>
                              {rightCols.map(col => (
                                <option key={col} value={col}>{col}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Select Columns (leave empty for all)
                  </label>
                  <label className="text-xs flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <input type="checkbox" checked={distinct} onChange={(e) => setDistinct(e.target.checked)} />
                    DISTINCT
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectColumnOptions.map(col => (
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

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-900 dark:text-gray-100">Aggregates</label>
                  <button
                    onClick={addAggregate}
                    className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded flex items-center gap-1"
                  >
                    <Plus size={14} /> Add COUNT / SUM / AVG / MIN / MAX
                  </button>
                </div>
                <div className="space-y-2">
                  {aggregates.map((agg, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2">
                      <select
                        value={agg.func}
                        onChange={(e) => updateAggregate(index, { func: e.target.value as AggregateFn })}
                        className={`col-span-3 ${inputClass}`}
                      >
                        {AGG_FUNCS.map(fn => (
                          <option key={fn} value={fn}>{fn}</option>
                        ))}
                      </select>
                      <select
                        value={agg.column}
                        onChange={(e) => updateAggregate(index, { column: e.target.value })}
                        className={`col-span-4 ${inputClass}`}
                      >
                        <option value="*">*</option>
                        {selectColumnOptions.map(col => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={agg.alias}
                        onChange={(e) => updateAggregate(index, { alias: e.target.value })}
                        placeholder="AS alias"
                        className={`col-span-4 ${inputClass}`}
                      />
                      <button
                        onClick={() => setAggregates(aggregates.filter((_, i) => i !== index))}
                        className="col-span-1 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>GROUP BY</label>
                <div className="flex flex-wrap gap-2">
                  {selectColumnOptions.map(col => (
                    <button
                      key={col}
                      onClick={() => toggleGroupBy(col)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        groupByColumns.includes(col)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {col}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {queryType === 'INSERT' && selectedTable && (
            <div className="space-y-4">
              <label className="text-sm flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <input
                  type="checkbox"
                  checked={insertNamedColumns}
                  onChange={(e) => setInsertNamedColumns(e.target.checked)}
                />
                INSERT INTO table (columns) VALUES (...)
              </label>
              {insertNamedColumns && (
                <div>
                  <label className={labelClass}>Columns to insert</label>
                  <div className="flex flex-wrap gap-2">
                    {columns.map(col => (
                      <button
                        key={col}
                        onClick={() => toggleInsertColumn(col)}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          insertSelectedColumns.includes(col)
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
              <div>
                <label className={labelClass}>Enter Values</label>
                <div className="space-y-3">
                  {(insertNamedColumns ? insertSelectedColumns : columns).map(col => (
                    <div key={col}>
                      <label className={hintClass}>{col}</label>
                      <input
                        type="text"
                        value={insertValues[col] || ''}
                        onChange={(e) => setInsertValues({ ...insertValues, [col]: e.target.value })}
                        placeholder={`Enter ${col}`}
                        className={inputClass}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {queryType === 'UPDATE' && selectedTable && (
            <div>
              <label className={labelClass}>Update Values (leave empty to keep unchanged)</label>
              <div className="space-y-3">
                {columns.map(col => (
                  <div key={col}>
                    <label className={hintClass}>{col}</label>
                    <input
                      type="text"
                      value={updateValues[col] || ''}
                      onChange={(e) => setUpdateValues({ ...updateValues, [col]: e.target.value })}
                      placeholder={`New value for ${col}`}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {['SELECT', 'UPDATE', 'DELETE'].includes(queryType) && selectedTable && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Filter (WHERE) — operators, AND / OR
                </label>
                <button
                  onClick={addWhereRow}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded flex items-center gap-1"
                >
                  <Plus size={14} /> Add condition
                </button>
              </div>
              <div className="space-y-2">
                {whereRows.map((row, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2">
                    {index === 0 ? (
                      <div className="col-span-2 flex items-center text-xs text-gray-500 px-2">WHERE</div>
                    ) : (
                      <select
                        value={row.logic}
                        onChange={(e) => updateWhereRow(index, { logic: e.target.value as 'AND' | 'OR' })}
                        className={`col-span-2 ${inputClass}`}
                      >
                        <option value="AND">AND</option>
                        <option value="OR">OR</option>
                      </select>
                    )}
                    <select
                      value={row.column}
                      onChange={(e) => updateWhereRow(index, { column: e.target.value })}
                      className={`col-span-3 ${inputClass}`}
                    >
                      <option value="">-- column --</option>
                      {whereColumnOptions.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                    <select
                      value={row.operator}
                      onChange={(e) => updateWhereRow(index, { operator: e.target.value as SqlOperator })}
                      className={`col-span-2 ${inputClass}`}
                    >
                      {OPERATORS.map(op => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={row.value}
                      onChange={(e) => updateWhereRow(index, { value: e.target.value })}
                      placeholder="value or %pattern%"
                      className={`col-span-4 ${inputClass}`}
                    />
                    {whereRows.length > 1 && (
                      <button
                        onClick={() => setWhereRows(whereRows.filter((_, i) => i !== index))}
                        className="col-span-1 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {queryType === 'SELECT' && selectedTable && (
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className={labelClass}>ORDER BY</label>
                <select
                  value={orderByColumn}
                  onChange={(e) => setOrderByColumn(e.target.value)}
                  className={inputClass}
                >
                  <option value="">-- none --</option>
                  {selectColumnOptions.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Direction</label>
                <select
                  value={orderByDirection}
                  onChange={(e) => setOrderByDirection(e.target.value as 'ASC' | 'DESC')}
                  className={inputClass}
                  disabled={!orderByColumn}
                >
                  <option value="ASC">ASC</option>
                  <option value="DESC">DESC</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>LIMIT</label>
                <input
                  type="number"
                  min="0"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  placeholder="e.g., 10"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>OFFSET</label>
                <input
                  type="number"
                  min="0"
                  value={offset}
                  onChange={(e) => setOffset(e.target.value)}
                  placeholder="e.g., 0"
                  className={inputClass}
                />
              </div>
            </div>
          )}
        </div>

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
