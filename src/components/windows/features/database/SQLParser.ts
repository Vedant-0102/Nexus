/**
 * SQL Parser - Tokenizes and parses SQL-like commands
 */

import { ParsedCommand, WhereClause } from './types';

export class SQLParser {
  parse(command: string): ParsedCommand {
    command = command.trim().replace(/;$/, '');

    const upperCommand = command.toUpperCase();

    if (upperCommand.startsWith('CREATE TABLE')) {
      return this.parseCreate(command);
    } else if (upperCommand.startsWith('DROP TABLE')) {
      return this.parseDrop(command);
    } else if (upperCommand.startsWith('SHOW TABLES')) {
      return { type: 'SHOW_TABLES' };
    } else if (upperCommand.startsWith('DESCRIBE')) {
      return this.parseDescribe(command);
    } else if (upperCommand.startsWith('INSERT INTO')) {
      return this.parseInsert(command);
    } else if (upperCommand.startsWith('SELECT')) {
      return this.parseSelect(command);
    } else if (upperCommand.startsWith('DELETE FROM')) {
      return this.parseDelete(command);
    } else if (upperCommand.startsWith('UPDATE')) {
      return this.parseUpdate(command);
    } else if (upperCommand.startsWith('TRUNCATE TABLE')) {
      return this.parseTruncate(command);
    } else {
      throw new Error(`Unknown command: ${command}`);
    }
  }

  private parseCreate(command: string): ParsedCommand {
    const pattern = /CREATE TABLE\s+(\w+)\s*\(([^)]+)\)/i;
    const match = command.match(pattern);

    if (!match) {
      throw new Error('Invalid CREATE TABLE syntax');
    }

    const tableName = match[1];
    const columnsStr = match[2];
    const columns = columnsStr.split(',').map(col => col.trim());

    return {
      type: 'CREATE',
      table: tableName,
      columns,
    };
  }

  private parseInsert(command: string): ParsedCommand {
    const pattern = /INSERT INTO\s+(\w+)\s+VALUES\s*\(([^)]+)\)/i;
    const match = command.match(pattern);

    if (!match) {
      throw new Error('Invalid INSERT syntax');
    }

    const tableName = match[1];
    const valuesStr = match[2];

    // Parse values, handling quoted strings
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar: string | null = null;

    for (const char of valuesStr) {
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = null;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }

    if (current) {
      values.push(current.trim().replace(/^["']|["']$/g, ''));
    }

    return {
      type: 'INSERT',
      table: tableName,
      values,
    };
  }

  private parseSelect(command: string): ParsedCommand {
    const selectPattern = /SELECT\s+(.+?)\s+FROM\s+(\w+)/i;
    const match = command.match(selectPattern);

    if (!match) {
      throw new Error('Invalid SELECT syntax');
    }

    const columnsStr = match[1].trim();
    const tableName = match[2];

    const columns = columnsStr === '*' ? ['*'] : columnsStr.split(',').map(col => col.trim());

    // Extract WHERE clause if present
    let whereClause: WhereClause | null = null;
    const wherePattern = /WHERE\s+(.+)/i;
    const whereMatch = command.match(wherePattern);

    if (whereMatch) {
      whereClause = this.parseWhere(whereMatch[1]);
    }

    return {
      type: 'SELECT',
      table: tableName,
      columns,
      where: whereClause,
    };
  }

  private parseDelete(command: string): ParsedCommand {
    const pattern = /DELETE FROM\s+(\w+)/i;
    const match = command.match(pattern);

    if (!match) {
      throw new Error('Invalid DELETE syntax');
    }

    const tableName = match[1];

    // Extract WHERE clause
    let whereClause: WhereClause | null = null;
    const wherePattern = /WHERE\s+(.+)/i;
    const whereMatch = command.match(wherePattern);

    if (whereMatch) {
      whereClause = this.parseWhere(whereMatch[1]);
    }

    return {
      type: 'DELETE',
      table: tableName,
      where: whereClause,
    };
  }

  private parseUpdate(command: string): ParsedCommand {
    const pattern = /UPDATE\s+(\w+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+))?$/i;
    const match = command.match(pattern);

    if (!match) {
      throw new Error('Invalid UPDATE syntax');
    }

    const tableName = match[1];
    const setClause = match[2];
    const whereStr = match[3];

    // Parse SET clause
    const updates: Record<string, string> = {};
    for (const assignment of setClause.split(',')) {
      const parts = assignment.split('=');
      if (parts.length !== 2) {
        throw new Error('Invalid SET clause');
      }
      const col = parts[0].trim();
      const val = parts[1].trim().replace(/^["']|["']$/g, '');
      updates[col] = val;
    }

    let whereClause: WhereClause | null = null;
    if (whereStr) {
      whereClause = this.parseWhere(whereStr);
    }

    return {
      type: 'UPDATE',
      table: tableName,
      updates,
      where: whereClause,
    };
  }

  private parseDrop(command: string): ParsedCommand {
    const pattern = /DROP TABLE\s+(\w+)/i;
    const match = command.match(pattern);

    if (!match) {
      throw new Error('Invalid DROP TABLE syntax');
    }

    return {
      type: 'DROP',
      table: match[1],
    };
  }

  private parseDescribe(command: string): ParsedCommand {
    const pattern = /DESCRIBE\s+(\w+)/i;
    const match = command.match(pattern);

    if (!match) {
      throw new Error('Invalid DESCRIBE syntax');
    }

    return {
      type: 'DESCRIBE',
      table: match[1],
    };
  }

  private parseTruncate(command: string): ParsedCommand {
    const pattern = /TRUNCATE TABLE\s+(\w+)/i;
    const match = command.match(pattern);

    if (!match) {
      throw new Error('Invalid TRUNCATE syntax');
    }

    return {
      type: 'TRUNCATE',
      table: match[1],
    };
  }

  private parseWhere(whereStr: string): WhereClause {
    // Simple equality check: column = value
    const pattern = /(\w+)\s*=\s*(.+)/;
    const match = whereStr.trim().match(pattern);

    if (!match) {
      throw new Error('Invalid WHERE clause');
    }

    const column = match[1];
    const value = match[2].trim().replace(/^["']|["']$/g, '');

    return {
      column,
      operator: '=',
      value,
    };
  }
}
