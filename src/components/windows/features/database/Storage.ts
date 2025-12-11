/**
 * Storage Module - Handles localStorage-based data persistence
 * Each table is stored as a JSON object in localStorage
 */

import { TableData } from './types';

export class Storage {
  private readonly storagePrefix = 'minidb_';

  private getTableKey(tableName: string): string {
    return `${this.storagePrefix}${tableName}`;
  }

  tableExists(tableName: string): boolean {
    return localStorage.getItem(this.getTableKey(tableName)) !== null;
  }

  createTable(tableName: string, columns: string[]): void {
    if (this.tableExists(tableName)) {
      throw new Error(`Table '${tableName}' already exists`);
    }

    const tableData: TableData = {
      columns,
      rows: [],
    };

    localStorage.setItem(this.getTableKey(tableName), JSON.stringify(tableData));
  }

  readTable(tableName: string): TableData {
    if (!this.tableExists(tableName)) {
      throw new Error(`Table '${tableName}' does not exist`);
    }

    const data = localStorage.getItem(this.getTableKey(tableName));
    if (!data) {
      throw new Error(`Table '${tableName}' is corrupted`);
    }

    return JSON.parse(data) as TableData;
  }

  writeTable(tableName: string, columns: string[], rows: string[][]): void {
    const tableData: TableData = { columns, rows };
    localStorage.setItem(this.getTableKey(tableName), JSON.stringify(tableData));
  }

  appendRow(tableName: string, row: string[]): void {
    const tableData = this.readTable(tableName);
    tableData.rows.push(row);
    localStorage.setItem(this.getTableKey(tableName), JSON.stringify(tableData));
  }

  dropTable(tableName: string): void {
    if (!this.tableExists(tableName)) {
      throw new Error(`Table '${tableName}' does not exist`);
    }
    localStorage.removeItem(this.getTableKey(tableName));
  }

  getAllTables(): string[] {
    const tables: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.storagePrefix)) {
        tables.push(key.substring(this.storagePrefix.length));
      }
    }
    return tables.sort();
  }
}
