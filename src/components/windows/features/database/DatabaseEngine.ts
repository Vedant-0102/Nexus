/**
 * Database Engine - Executes parsed SQL commands
 */

import { SQLParser } from './SQLParser';
import { Storage } from './Storage';
import {
  AggregateExpr,
  JoinClause,
  ParsedCommand,
  QueryResult,
  WhereClause,
} from './types';

type NamedRow = Record<string, string>;

export class DatabaseEngine {
  storage: Storage;
  parser: SQLParser;

  constructor() {
    this.storage = new Storage();
    this.parser = new SQLParser();
  }

  execute(command: string): QueryResult {
    try {
      const parsed = this.parser.parse(command);

      switch (parsed.type) {
        case 'CREATE':
          return this.executeCreate(parsed);
        case 'DROP':
          return this.executeDrop(parsed);
        case 'SHOW_TABLES':
          return this.executeShowTables();
        case 'DESCRIBE':
          return this.executeDescribe(parsed);
        case 'INSERT':
          return this.executeInsert(parsed);
        case 'SELECT':
          return this.executeSelect(parsed);
        case 'DELETE':
          return this.executeDelete(parsed);
        case 'UPDATE':
          return this.executeUpdate(parsed);
        case 'TRUNCATE':
          return this.executeTruncate(parsed);
        default:
          return { success: false, error: 'Unknown command type' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private executeCreate(parsed: ParsedCommand): QueryResult {
    this.storage.createTable(parsed.table!, parsed.columns!);
    return {
      success: true,
      message: `Table '${parsed.table}' created successfully.`,
    };
  }

  private executeDrop(parsed: ParsedCommand): QueryResult {
    this.storage.dropTable(parsed.table!);
    return {
      success: true,
      message: `Table '${parsed.table}' dropped successfully.`,
    };
  }

  private executeShowTables(): QueryResult {
    const tables = this.storage.getAllTables();

    if (tables.length === 0) {
      return { success: true, message: 'No tables found.' };
    }

    const lines = ['Tables in database:', '-'.repeat(30)];
    tables.forEach(table => lines.push(`  • ${table}`));
    lines.push(`\nTotal: ${tables.length} table(s)`);

    return {
      success: true,
      message: lines.join('\n'),
    };
  }

  private executeDescribe(parsed: ParsedCommand): QueryResult {
    const { columns, rows } = this.storage.readTable(parsed.table!);

    const lines = [
      `Table: ${parsed.table}`,
      '='.repeat(40),
      `Columns: ${columns.length}`,
      `Rows: ${rows.length}`,
      '\nColumn Names:',
      '-'.repeat(40),
    ];

    columns.forEach((col, i) => lines.push(`  ${i + 1}. ${col}`));

    return {
      success: true,
      message: lines.join('\n'),
    };
  }

  private executeTruncate(parsed: ParsedCommand): QueryResult {
    const { columns } = this.storage.readTable(parsed.table!);
    this.storage.writeTable(parsed.table!, columns, []);
    return {
      success: true,
      message: `Table '${parsed.table}' truncated successfully.`,
    };
  }

  private executeInsert(parsed: ParsedCommand): QueryResult {
    const { columns } = this.storage.readTable(parsed.table!);

    if (parsed.insertColumns && parsed.insertColumns.length) {
      const row = columns.map(() => '');
      if (parsed.insertColumns.length !== parsed.values!.length) {
        throw new Error(
          `Column count mismatch. Expected ${parsed.insertColumns.length}, got ${parsed.values!.length}`
        );
      }
      parsed.insertColumns.forEach((col, i) => {
        const idx = columns.indexOf(col);
        if (idx === -1) {
          throw new Error(`Column '${col}' does not exist`);
        }
        row[idx] = parsed.values![i];
      });
      this.storage.appendRow(parsed.table!, row);
      return { success: true, message: '1 row inserted.' };
    }

    if (parsed.values!.length !== columns.length) {
      throw new Error(
        `Column count mismatch. Expected ${columns.length}, got ${parsed.values!.length}`
      );
    }

    this.storage.appendRow(parsed.table!, parsed.values!);
    return {
      success: true,
      message: '1 row inserted.',
    };
  }

  private executeSelect(parsed: ParsedCommand): QueryResult {
    const fromAlias = parsed.tableAlias || parsed.table!;
    const hasJoins = Boolean(parsed.joins && parsed.joins.length);
    const prefixNames = hasJoins || Boolean(parsed.tableAlias);

    let rows = this.tableToNamedRows(parsed.table!, fromAlias, prefixNames);

    for (const join of parsed.joins || []) {
      rows = this.applyJoin(rows, join);
    }

    if (parsed.where) {
      rows = rows.filter(row => this.matchesNamedWhere(row, parsed.where!));
    }

    if (parsed.aggregates && parsed.aggregates.length) {
      rows = this.applyAggregates(rows, parsed.aggregates, parsed.groupBy || [], parsed.columns || []);
    } else if (parsed.groupBy && parsed.groupBy.length) {
      throw new Error('GROUP BY requires an aggregate function such as COUNT, SUM, AVG, MIN, or MAX');
    } else {
      rows = this.projectRows(rows, parsed.columns || ['*'], prefixNames ? parsed.table : undefined);
    }

    if (parsed.distinct) {
      rows = this.distinctRows(rows);
    }

    if (parsed.orderBy && parsed.orderBy.length) {
      rows = this.sortRows(rows, parsed.orderBy);
    }

    const offset = parsed.offset || 0;
    if (parsed.limit !== undefined) {
      rows = rows.slice(offset, offset + parsed.limit);
    } else if (offset) {
      rows = rows.slice(offset);
    }

    const displayColumns = rows.length
      ? Object.keys(rows[0])
      : this.emptySelectColumns(parsed, prefixNames, fromAlias);

    const displayRows = rows.map(row => displayColumns.map(col => row[col] ?? ''));

    return {
      success: true,
      data: {
        columns: displayColumns,
        rows: displayRows,
      },
      message: `${displayRows.length} row(s) returned.`,
    };
  }

  private emptySelectColumns(parsed: ParsedCommand, prefixNames: boolean, fromAlias: string): string[] {
    if (parsed.aggregates && parsed.aggregates.length) {
      const cols = [...(parsed.groupBy || [])];
      parsed.aggregates.forEach(agg => {
        cols.push(agg.alias || `${agg.func}(${agg.column})`);
      });
      return cols;
    }
    if (parsed.columns && parsed.columns[0] !== '*') {
      return parsed.columns.map(col => {
        const aliased = col.match(/^([\w.]+)\s+AS\s+(\w+)$/i);
        return aliased ? aliased[2] : col;
      });
    }
    const { columns } = this.storage.readTable(parsed.table!);
    if (!prefixNames) return columns;
    const names = columns.map(c => `${fromAlias}.${c}`);
    for (const join of parsed.joins || []) {
      const alias = join.alias || join.table;
      const right = this.storage.readTable(join.table);
      right.columns.forEach(c => names.push(`${alias}.${c}`));
    }
    return names;
  }

  private tableToNamedRows(table: string, alias: string, prefixNames: boolean): NamedRow[] {
    const { columns, rows } = this.storage.readTable(table);
    return rows.map(row => {
      const named: NamedRow = {};
      columns.forEach((col, i) => {
        const value = row[i] ?? '';
        if (prefixNames) {
          named[`${alias}.${col}`] = value;
        } else {
          named[col] = value;
        }
      });
      return named;
    });
  }

  private applyJoin(leftRows: NamedRow[], join: JoinClause): NamedRow[] {
    const alias = join.alias || join.table;
    const rightRows = this.tableToNamedRows(join.table, alias, true);
    const rightColumns = Object.keys(rightRows[0] || this.emptyRightShape(join.table, alias));

    const matchedRight = new Set<number>();
    const output: NamedRow[] = [];

    const matchesOn = (left: NamedRow, right: NamedRow): boolean => {
      if (join.type === 'CROSS' || !join.on) return true;
      const leftVal = this.getRowValue(left, join.on.left) ?? this.getRowValue(right, join.on.left);
      const rightVal = this.getRowValue(right, join.on.right) ?? this.getRowValue(left, join.on.right);
      if (leftVal === undefined || rightVal === undefined) return false;
      return this.compareValues(leftVal, join.on.operator, rightVal);
    };

    if (join.type === 'RIGHT') {
      for (let ri = 0; ri < rightRows.length; ri++) {
        const right = rightRows[ri];
        const matches = leftRows.filter(left => matchesOn(left, right));
        if (matches.length) {
          matches.forEach(left => output.push({ ...left, ...right }));
        } else {
          output.push({ ...this.nullRow(Object.keys(leftRows[0] || {})), ...right });
        }
      }
      return output;
    }

    for (const left of leftRows) {
      const matches: NamedRow[] = [];
      rightRows.forEach((right, ri) => {
        if (matchesOn(left, right)) {
          matches.push(right);
          matchedRight.add(ri);
        }
      });

      if (matches.length) {
        matches.forEach(right => output.push({ ...left, ...right }));
      } else if (join.type === 'LEFT' || join.type === 'FULL') {
        output.push({ ...left, ...this.nullRow(rightColumns) });
      }
    }

    if (join.type === 'FULL') {
      rightRows.forEach((right, ri) => {
        if (!matchedRight.has(ri)) {
          output.push({ ...this.nullRow(Object.keys(leftRows[0] || {})), ...right });
        }
      });
    }

    return output;
  }

  private emptyRightShape(table: string, alias: string): NamedRow {
    const { columns } = this.storage.readTable(table);
    const row: NamedRow = {};
    columns.forEach(col => {
      row[`${alias}.${col}`] = '';
    });
    return row;
  }

  private nullRow(columns: string[]): NamedRow {
    const row: NamedRow = {};
    columns.forEach(col => {
      row[col] = '';
    });
    return row;
  }

  private projectRows(rows: NamedRow[], selectCols: string[], defaultTable?: string): NamedRow[] {
    if (selectCols.length === 1 && selectCols[0] === '*') {
      return rows;
    }

    return rows.map(row => {
      const projected: NamedRow = {};
      for (const raw of selectCols) {
        const aliased = raw.match(/^([\w.]+|\*)\s+AS\s+(\w+)$/i);
        if (aliased && aliased[1] === '*') {
          Object.assign(projected, row);
          continue;
        }
        const source = aliased ? aliased[1] : raw;
        const label = aliased ? aliased[2] : raw;
        const value = this.getRowValue(row, source, defaultTable);
        if (value === undefined) {
          throw new Error(`Column '${source}' does not exist`);
        }
        projected[label] = value;
      }
      return projected;
    });
  }

  private applyAggregates(
    rows: NamedRow[],
    aggregates: AggregateExpr[],
    groupBy: string[],
    selectColumns: string[]
  ): NamedRow[] {
    const groups = new Map<string, NamedRow[]>();

    if (!groupBy.length) {
      groups.set('__all__', rows);
    } else {
      for (const row of rows) {
        const key = groupBy.map(col => this.getRowValue(row, col) ?? '').join('\u0000');
        const list = groups.get(key) || [];
        list.push(row);
        groups.set(key, list);
      }
    }

    const output: NamedRow[] = [];
    groups.forEach(groupRows => {
      const result: NamedRow = {};
      const sample = groupRows[0] || {};

      groupBy.forEach(col => {
        result[col] = this.getRowValue(sample, col) ?? '';
      });

      aggregates.forEach(agg => {
        const label = agg.alias || `${agg.func}(${agg.column})`;
        result[label] = this.computeAggregate(groupRows, agg);
      });

      const extra = selectColumns.filter(col => {
        if (col === '*') return false;
        const aliased = col.match(/^([\w.]+)\s+AS\s+(\w+)$/i);
        const name = aliased ? aliased[1] : col;
        return !groupBy.includes(name) && !aggregates.some(a => (a.alias || `${a.func}(${a.column})`) === col);
      });
      extra.forEach(col => {
        if (this.getRowValue(sample, col) !== undefined) {
          result[col] = this.getRowValue(sample, col)!;
        }
      });

      output.push(result);
    });

    return output;
  }

  private computeAggregate(rows: NamedRow[], agg: AggregateExpr): string {
    if (agg.func === 'COUNT') {
      if (agg.column === '*') return String(rows.length);
      return String(rows.filter(row => (this.getRowValue(row, agg.column) ?? '') !== '').length);
    }

    const nums = rows
      .map(row => this.getRowValue(row, agg.column))
      .filter((v): v is string => v !== undefined && v !== '')
      .map(v => Number(v))
      .filter(n => !Number.isNaN(n));

    if (!nums.length) return '';

    if (agg.func === 'SUM') return String(nums.reduce((a, b) => a + b, 0));
    if (agg.func === 'AVG') return String(nums.reduce((a, b) => a + b, 0) / nums.length);
    if (agg.func === 'MIN') return String(Math.min(...nums));
    if (agg.func === 'MAX') return String(Math.max(...nums));
    return '';
  }

  private distinctRows(rows: NamedRow[]): NamedRow[] {
    const seen = new Set<string>();
    return rows.filter(row => {
      const key = JSON.stringify(row);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private sortRows(rows: NamedRow[], orderBy: { column: string; direction: 'ASC' | 'DESC' }[]): NamedRow[] {
    return [...rows].sort((a, b) => {
      for (const clause of orderBy) {
        const av = this.getRowValue(a, clause.column) ?? '';
        const bv = this.getRowValue(b, clause.column) ?? '';
        const cmp = this.compareSort(av, bv);
        if (cmp !== 0) return clause.direction === 'DESC' ? -cmp : cmp;
      }
      return 0;
    });
  }

  private compareSort(a: string, b: string): number {
    const na = Number(a);
    const nb = Number(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb) && a !== '' && b !== '') {
      return na - nb;
    }
    return a.localeCompare(b);
  }

  private executeDelete(parsed: ParsedCommand): QueryResult {
    const { columns, rows } = this.storage.readTable(parsed.table!);

    let remainingRows: string[][];
    let deletedCount: number;

    if (parsed.where) {
      remainingRows = rows.filter(row => !this.matchesWhere(columns, row, parsed.where!));
      deletedCount = rows.length - remainingRows.length;
    } else {
      remainingRows = [];
      deletedCount = rows.length;
    }

    this.storage.writeTable(parsed.table!, columns, remainingRows);
    return {
      success: true,
      message: `${deletedCount} row(s) deleted.`,
    };
  }

  private executeUpdate(parsed: ParsedCommand): QueryResult {
    const { columns, rows } = this.storage.readTable(parsed.table!);

    for (const col of Object.keys(parsed.updates!)) {
      if (!columns.includes(col)) {
        throw new Error(`Column '${col}' does not exist`);
      }
    }

    let updatedCount = 0;
    const updatedRows = rows.map(row => {
      if (!parsed.where || this.matchesWhere(columns, row, parsed.where)) {
        const newRow = [...row];
        for (const [col, val] of Object.entries(parsed.updates!)) {
          const colIdx = columns.indexOf(col);
          newRow[colIdx] = val;
        }
        updatedCount++;
        return newRow;
      }
      return row;
    });

    this.storage.writeTable(parsed.table!, columns, updatedRows);
    return {
      success: true,
      message: `${updatedCount} row(s) updated.`,
    };
  }

  filterRows(columns: string[], rows: string[][], whereClause: WhereClause): string[][] {
    return rows.filter(row => this.matchesWhere(columns, row, whereClause));
  }

  private matchesWhere(columns: string[], row: string[], whereClause: WhereClause): boolean {
    const named: NamedRow = {};
    columns.forEach((col, i) => {
      named[col] = row[i] ?? '';
    });
    return this.matchesNamedWhere(named, whereClause);
  }

  private matchesNamedWhere(row: NamedRow, whereClause: WhereClause): boolean {
    if (whereClause.logic && whereClause.left && whereClause.right) {
      const left = this.matchesNamedWhere(row, whereClause.left);
      const right = this.matchesNamedWhere(row, whereClause.right);
      return whereClause.logic === 'AND' ? left && right : left || right;
    }

    const rowValue = this.getRowValue(row, whereClause.column);
    if (rowValue === undefined) {
      throw new Error(`Column '${whereClause.column}' does not exist`);
    }

    return this.compareValues(rowValue, whereClause.operator, whereClause.value);
  }

  private getRowValue(row: NamedRow, column: string, defaultTable?: string): string | undefined {
    if (column in row) return row[column];

    if (defaultTable && `${defaultTable}.${column}` in row) {
      return row[`${defaultTable}.${column}`];
    }

    const suffix = `.${column}`;
    const matches = Object.keys(row).filter(key => key === column || key.endsWith(suffix));
    if (matches.length === 1) return row[matches[0]];
    if (matches.length > 1) {
      throw new Error(`Column '${column}' is ambiguous. Use table.column`);
    }
    return undefined;
  }

  private compareValues(left: string, operator: string, right: string): boolean {
    const op = operator.toUpperCase();
    if (op === 'LIKE') {
      const pattern = '^' + right.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.') + '$';
      return new RegExp(pattern, 'i').test(left);
    }

    const ln = Number(left);
    const rn = Number(right);
    const numeric = left !== '' && right !== '' && !Number.isNaN(ln) && !Number.isNaN(rn);
    const cmp = numeric ? ln - rn : left.localeCompare(right);

    switch (operator) {
      case '=':
        return numeric ? ln === rn : left === right;
      case '!=':
      case '<>':
        return numeric ? ln !== rn : left !== right;
      case '<':
        return cmp < 0;
      case '>':
        return cmp > 0;
      case '<=':
        return cmp <= 0;
      case '>=':
        return cmp >= 0;
      default:
        return false;
    }
  }
}
