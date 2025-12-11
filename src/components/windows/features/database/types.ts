/**
 * Type definitions for the Mini Database Engine
 */

export interface ParsedCommand {
  type: 'CREATE' | 'DROP' | 'SHOW_TABLES' | 'DESCRIBE' | 'INSERT' | 'SELECT' | 'DELETE' | 'UPDATE' | 'TRUNCATE';
  table?: string;
  columns?: string[];
  values?: string[];
  where?: WhereClause | null;
  updates?: Record<string, string>;
}

export interface WhereClause {
  column: string;
  operator: '=';
  value: string;
}

export interface TableData {
  columns: string[];
  rows: string[][];
}

export interface QueryResult {
  success: boolean;
  message?: string;
  data?: TableData;
  error?: string;
}
