/**
 * Type definitions for the Mini Database Engine
 */

export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL' | 'CROSS';

export interface JoinOnClause {
  left: string;
  operator: string;
  right: string;
}

export interface JoinClause {
  type: JoinType;
  table: string;
  alias?: string;
  on?: JoinOnClause | null;
}

export interface OrderByClause {
  column: string;
  direction: 'ASC' | 'DESC';
}

export interface AggregateExpr {
  func: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX';
  column: string;
  alias?: string;
}

export interface ParsedCommand {
  type: 'CREATE' | 'DROP' | 'SHOW_TABLES' | 'DESCRIBE' | 'INSERT' | 'SELECT' | 'DELETE' | 'UPDATE' | 'TRUNCATE';
  table?: string;
  tableAlias?: string;
  columns?: string[];
  insertColumns?: string[];
  values?: string[];
  where?: WhereClause | null;
  updates?: Record<string, string>;
  joins?: JoinClause[];
  orderBy?: OrderByClause[];
  groupBy?: string[];
  aggregates?: AggregateExpr[];
  distinct?: boolean;
  limit?: number;
  offset?: number;
}

export interface WhereClause {
  column: string;
  operator: string;
  value: string;
  logic?: 'AND' | 'OR';
  left?: WhereClause;
  right?: WhereClause;
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
