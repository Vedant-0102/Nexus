/**
 * Database Engine - Executes parsed SQL commands
 */

import { SQLParser } from './SQLParser';
import { Storage } from './Storage';
import { ParsedCommand, QueryResult, TableData } from './types';

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
    const { columns, rows } = this.storage.readTable(parsed.table!);

    // Determine which columns to display
    let displayColumns: string[];
    let colIndices: number[];

    if (parsed.columns![0] === '*') {
      displayColumns = columns;
      colIndices = columns.map((_, i) => i);
    } else {
      displayColumns = parsed.columns!;
      colIndices = displayColumns.map(col => {
        const idx = columns.indexOf(col);
        if (idx === -1) {
          throw new Error(`Column '${col}' does not exist`);
        }
        return idx;
      });
    }

    // Filter rows based on WHERE clause
    let filteredRows = rows;
    if (parsed.where) {
      filteredRows = this.filterRows(columns, rows, parsed.where);
    }

    // Extract relevant columns
    const displayRows = filteredRows.map(row => colIndices.map(i => row[i]));

    return {
      success: true,
      data: {
        columns: displayColumns,
        rows: displayRows,
      },
      message: `${displayRows.length} row(s) returned.`,
    };
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

    // Validate columns in SET clause
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

  filterRows(columns: string[], rows: string[][], whereClause: any): string[][] {
    return rows.filter(row => this.matchesWhere(columns, row, whereClause));
  }

  private matchesWhere(columns: string[], row: string[], whereClause: any): boolean {
    const col = whereClause.column;
    const colIdx = columns.indexOf(col);

    if (colIdx === -1) {
      throw new Error(`Column '${col}' does not exist`);
    }

    const rowValue = row[colIdx];

    if (whereClause.operator === '=') {
      return rowValue === whereClause.value;
    }

    return false;
  }
}
