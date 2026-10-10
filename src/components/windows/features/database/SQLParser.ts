/**
 * SQL Parser - Tokenizes and parses SQL-like commands
 */

import {
  AggregateExpr,
  JoinClause,
  JoinType,
  OrderByClause,
  ParsedCommand,
  WhereClause,
} from './types';

const CLAUSE_KEYWORDS = [
  'INNER JOIN',
  'LEFT OUTER JOIN',
  'LEFT JOIN',
  'RIGHT OUTER JOIN',
  'RIGHT JOIN',
  'FULL OUTER JOIN',
  'FULL JOIN',
  'CROSS JOIN',
  'JOIN',
  'WHERE',
  'GROUP BY',
  'ORDER BY',
  'LIMIT',
  'OFFSET',
];

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
    } else if (upperCommand.startsWith('DESCRIBE') || upperCommand.startsWith('DESC ')) {
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
    const withCols = /INSERT INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\((.+)\)\s*$/i;
    const withoutCols = /INSERT INTO\s+(\w+)\s+VALUES\s*\((.+)\)\s*$/i;

    const named = command.match(withCols);
    if (named) {
      return {
        type: 'INSERT',
        table: named[1],
        insertColumns: named[2].split(',').map(c => c.trim()),
        values: this.parseValueList(named[3]),
      };
    }

    const match = command.match(withoutCols);
    if (!match) {
      throw new Error('Invalid INSERT syntax');
    }

    return {
      type: 'INSERT',
      table: match[1],
      values: this.parseValueList(match[2]),
    };
  }

  private parseValueList(valuesStr: string): string[] {
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

    return values;
  }

  private parseSelect(command: string): ParsedCommand {
    const selectPattern = /^SELECT\s+(DISTINCT\s+)?(.+?)\s+FROM\s+(.+)$/i;
    const match = command.match(selectPattern);

    if (!match) {
      throw new Error('Invalid SELECT syntax');
    }

    const distinct = Boolean(match[1]);
    const columnsStr = match[2].trim();
    const fromRest = match[3].trim();

    const { table, alias, remaining } = this.parseTableRef(fromRest);
    const { joins, trailing } = this.parseJoins(remaining);

    const clauses = this.splitTrailingClauses(trailing);

    let whereClause: WhereClause | null = null;
    if (clauses.WHERE) {
      whereClause = this.parseWhere(clauses.WHERE);
    }

    const groupBy = clauses['GROUP BY']
      ? clauses['GROUP BY'].split(',').map(c => c.trim()).filter(Boolean)
      : undefined;

    const orderBy = clauses['ORDER BY'] ? this.parseOrderBy(clauses['ORDER BY']) : undefined;

    let limit: number | undefined;
    let offset: number | undefined;
    if (clauses.LIMIT) {
      const limitParts = clauses.LIMIT.trim().split(/\s+/);
      limit = parseInt(limitParts[0], 10);
      if (Number.isNaN(limit)) {
        throw new Error('Invalid LIMIT value');
      }
      if (limitParts.length >= 3 && limitParts[1].toUpperCase() === 'OFFSET') {
        offset = parseInt(limitParts[2], 10);
      }
    }
    if (clauses.OFFSET) {
      offset = parseInt(clauses.OFFSET.trim(), 10);
      if (Number.isNaN(offset)) {
        throw new Error('Invalid OFFSET value');
      }
    }

    const { columns, aggregates } = this.parseSelectList(columnsStr);

    return {
      type: 'SELECT',
      table,
      tableAlias: alias,
      columns,
      aggregates: aggregates.length ? aggregates : undefined,
      joins: joins.length ? joins : undefined,
      where: whereClause,
      groupBy,
      orderBy,
      distinct,
      limit,
      offset,
    };
  }

  private parseTableRef(input: string): { table: string; alias?: string; remaining: string } {
    const match = input.match(/^(\w+)(?:\s+(?:AS\s+)?(\w+))?(?:\s+|$)(.*)$/i);
    if (!match) {
      throw new Error('Invalid FROM clause');
    }

    const table = match[1];
    let alias = match[2];
    let remaining = (match[3] || '').trim();

    const reserved = new Set([
      'INNER', 'LEFT', 'RIGHT', 'FULL', 'CROSS', 'JOIN',
      'WHERE', 'GROUP', 'ORDER', 'LIMIT', 'OFFSET', 'ON', 'AS',
    ]);

    if (alias && reserved.has(alias.toUpperCase())) {
      remaining = `${alias} ${remaining}`.trim();
      alias = undefined;
    }

    return { table, alias, remaining };
  }

  private parseJoins(input: string): { joins: JoinClause[]; trailing: string } {
    const joins: JoinClause[] = [];
    let rest = input.trim();

    while (rest) {
      const joinMatch = rest.match(
        /^(INNER\s+JOIN|LEFT\s+OUTER\s+JOIN|LEFT\s+JOIN|RIGHT\s+OUTER\s+JOIN|RIGHT\s+JOIN|FULL\s+OUTER\s+JOIN|FULL\s+JOIN|CROSS\s+JOIN|JOIN)\s+/i
      );
      if (!joinMatch) break;

      const rawType = joinMatch[1].toUpperCase().replace(/\s+/g, ' ');
      rest = rest.slice(joinMatch[0].length).trim();

      const tableRef = this.parseTableRef(rest);
      rest = tableRef.remaining;

      let on = null as JoinClause['on'];
      if (/^ON\s+/i.test(rest)) {
        rest = rest.replace(/^ON\s+/i, '');
        const onEnd = this.findNextKeyword(rest, CLAUSE_KEYWORDS);
        const onStr = (onEnd === -1 ? rest : rest.slice(0, onEnd)).trim();
        rest = onEnd === -1 ? '' : rest.slice(onEnd).trim();
        on = this.parseJoinOn(onStr);
      }

      const type = this.normalizeJoinType(rawType);
      if (type !== 'CROSS' && !on) {
        throw new Error(`${rawType} requires an ON condition`);
      }

      joins.push({
        type,
        table: tableRef.table,
        alias: tableRef.alias,
        on,
      });
    }

    return { joins, trailing: rest };
  }

  private normalizeJoinType(raw: string): JoinType {
    if (raw.startsWith('LEFT')) return 'LEFT';
    if (raw.startsWith('RIGHT')) return 'RIGHT';
    if (raw.startsWith('FULL')) return 'FULL';
    if (raw.startsWith('CROSS')) return 'CROSS';
    return 'INNER';
  }

  private parseJoinOn(onStr: string): { left: string; operator: string; right: string } {
    const match = onStr.match(/^([\w.]+)\s*(=|!=|<>|<=|>=|<|>)\s*([\w.]+)$/);
    if (!match) {
      throw new Error('Invalid JOIN ON clause. Use: ON table.column = other.column');
    }
    return { left: match[1], operator: match[2], right: match[3] };
  }

  private splitTrailingClauses(input: string): Record<string, string> {
    const result: Record<string, string> = {};
    if (!input) return result;

    const keywords = ['WHERE', 'GROUP BY', 'ORDER BY', 'LIMIT', 'OFFSET'];
    const found: { keyword: string; index: number }[] = [];

    for (const keyword of keywords) {
      const idx = this.findNextKeyword(input, [keyword]);
      if (idx !== -1) {
        found.push({ keyword, index: idx });
      }
    }

    found.sort((a, b) => a.index - b.index);

    for (let i = 0; i < found.length; i++) {
      const start = found[i].index + found[i].keyword.length;
      const end = i + 1 < found.length ? found[i + 1].index : input.length;
      result[found[i].keyword] = input.slice(start, end).trim();
    }

    return result;
  }

  private findNextKeyword(input: string, keywords: string[]): number {
    let inQuotes = false;
    let quoteChar: string | null = null;
    const upper = input.toUpperCase();

    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = null;
      } else if (!inQuotes) {
        for (const keyword of keywords) {
          if (upper.startsWith(keyword, i)) {
            const beforeOk = i === 0 || /\s/.test(input[i - 1]);
            const afterIdx = i + keyword.length;
            const afterOk = afterIdx >= input.length || /\s/.test(input[afterIdx]);
            if (beforeOk && afterOk) return i;
          }
        }
      }
    }
    return -1;
  }

  private parseSelectList(columnsStr: string): { columns: string[]; aggregates: AggregateExpr[] } {
    if (columnsStr === '*') {
      return { columns: ['*'], aggregates: [] };
    }

    const parts = this.splitCommaAware(columnsStr);
    const columns: string[] = [];
    const aggregates: AggregateExpr[] = [];

    for (const part of parts) {
      const agg = part.match(/^(COUNT|SUM|AVG|MIN|MAX)\s*\(\s*(\*|\w+|\w+\.\w+)\s*\)(?:\s+AS\s+(\w+))?$/i);
      if (agg) {
        aggregates.push({
          func: agg[1].toUpperCase() as AggregateExpr['func'],
          column: agg[2],
          alias: agg[3],
        });
        columns.push(agg[3] || `${agg[1].toUpperCase()}(${agg[2]})`);
        continue;
      }

      const aliased = part.match(/^([\w.]+|\*)\s+AS\s+(\w+)$/i);
      if (aliased) {
        columns.push(aliased[1] === '*' ? '*' : `${aliased[1]} AS ${aliased[2]}`);
        continue;
      }

      columns.push(part);
    }

    return { columns, aggregates };
  }

  private parseOrderBy(orderStr: string): OrderByClause[] {
    return this.splitCommaAware(orderStr).map(part => {
      const match = part.match(/^([\w.]+)\s*(ASC|DESC)?$/i);
      if (!match) {
        throw new Error(`Invalid ORDER BY clause: ${part}`);
      }
      return {
        column: match[1],
        direction: (match[2]?.toUpperCase() as 'ASC' | 'DESC') || 'ASC',
      };
    });
  }

  private parseDelete(command: string): ParsedCommand {
    const pattern = /DELETE FROM\s+(\w+)/i;
    const match = command.match(pattern);

    if (!match) {
      throw new Error('Invalid DELETE syntax');
    }

    const tableName = match[1];

    let whereClause: WhereClause | null = null;
    const whereMatch = command.match(/\sWHERE\s+(.+)$/i);

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

    const updates: Record<string, string> = {};
    for (const assignment of this.splitCommaAware(setClause)) {
      const parts = assignment.split('=');
      if (parts.length < 2) {
        throw new Error('Invalid SET clause');
      }
      const col = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
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
    const pattern = /(?:DESCRIBE|DESC)\s+(\w+)/i;
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

  parseWhere(whereStr: string): WhereClause {
    return this.parseWhereOr(whereStr.trim());
  }

  private parseWhereOr(expr: string): WhereClause {
    const parts = this.splitByLogic(expr, 'OR');
    if (parts.length === 1) {
      return this.parseWhereAnd(parts[0]);
    }
    return parts.map(p => this.parseWhereAnd(p)).reduce((left, right) => ({
      column: '',
      operator: '',
      value: '',
      logic: 'OR',
      left,
      right,
    }));
  }

  private parseWhereAnd(expr: string): WhereClause {
    const parts = this.splitByLogic(expr, 'AND');
    if (parts.length === 1) {
      return this.parseWhereCondition(parts[0]);
    }
    return parts.map(p => this.parseWhereCondition(p)).reduce((left, right) => ({
      column: '',
      operator: '',
      value: '',
      logic: 'AND',
      left,
      right,
    }));
  }

  private parseWhereCondition(expr: string): WhereClause {
    const trimmed = expr.trim().replace(/^\(|\)$/g, '').trim();
    const match = trimmed.match(/^([\w.]+)\s*(=|!=|<>|<=|>=|<|>|LIKE)\s*(.+)$/i);

    if (!match) {
      throw new Error('Invalid WHERE clause');
    }

    return {
      column: match[1],
      operator: match[2].toUpperCase() === '<>' ? '!=' : match[2].toUpperCase() === 'LIKE' ? 'LIKE' : match[2],
      value: match[3].trim().replace(/^["']|["']$/g, ''),
    };
  }

  private splitByLogic(expr: string, logic: 'AND' | 'OR'): string[] {
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar: string | null = null;
    let depth = 0;
    const upper = expr.toUpperCase();

    for (let i = 0; i < expr.length; i++) {
      const char = expr[i];
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
        current += char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = null;
        current += char;
      } else if (!inQuotes && char === '(') {
        depth++;
        current += char;
      } else if (!inQuotes && char === ')') {
        depth--;
        current += char;
      } else if (
        !inQuotes &&
        depth === 0 &&
        upper.startsWith(logic, i) &&
        (i === 0 || /\s/.test(expr[i - 1])) &&
        (i + logic.length >= expr.length || /\s/.test(expr[i + logic.length]))
      ) {
        parts.push(current.trim());
        current = '';
        i += logic.length - 1;
      } else {
        current += char;
      }
    }

    if (current.trim()) parts.push(current.trim());
    return parts;
  }

  private splitCommaAware(input: string): string[] {
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar: string | null = null;
    let depth = 0;

    for (const char of input) {
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
        current += char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = null;
        current += char;
      } else if (!inQuotes && char === '(') {
        depth++;
        current += char;
      } else if (!inQuotes && char === ')') {
        depth--;
        current += char;
      } else if (!inQuotes && depth === 0 && char === ',') {
        parts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    if (current.trim()) parts.push(current.trim());
    return parts;
  }
}
