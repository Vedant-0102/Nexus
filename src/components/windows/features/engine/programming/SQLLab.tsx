import React, { useState } from 'react';
import { BookOpen, Code, ChevronRight, Check, X, RotateCcw } from 'lucide-react';

// -- Types --------------------------------------------------------------------

interface ResultTable {
  headers: string[];
  rows: (string | number)[][];
}

interface CodeBlock {
  title: string;
  lines: string[];
  result?: ResultTable;
}

interface Exercise {
  question: string;
  code: string;
  answer: string;
  hint: string;
}

interface TopicData {
  title: string;
  icon: React.ReactNode;
  explanation: string;
  codeBlocks: CodeBlock[];
  exercises: Exercise[];
}

// -- Topic data ---------------------------------------------------------------

const topics: Record<string, TopicData> = {
  intro: {
    title: 'Introduction',
    icon: <BookOpen size={14} />,
    explanation:
      'SQL (Structured Query Language) is the standard declarative language for managing relational databases. Instead of telling the database how to fetch data step-by-step, you declare what you want and the engine figures out the optimal plan. Data is stored in tables (relations) with columns (attributes) and rows (tuples). The four core operations are CRUD: Create, Read, Update, Delete. Major implementations include MySQL, PostgreSQL, SQLite, and SQL Server -- each adding proprietary extensions on top of the ANSI SQL standard.',
    codeBlocks: [
      {
        title: 'What SQL looks like',
        lines: [
          '-- SQL is declarative: you describe WHAT, not HOW',
          '-- Data lives in tables with rows and columns',
          '',
          '-- A basic query: read data from a table',
          'SELECT name, email',
          'FROM users',
          'WHERE active = 1;',
        ],
        result: {
          headers: ['name', 'email'],
          rows: [
            ['Alice', 'alice@corp.io'],
            ['Bob', 'bob@corp.io'],
          ],
        },
      },
      {
        title: 'CRUD at a glance',
        lines: [
          '-- CREATE (insert new data)',
          "INSERT INTO users (name, email) VALUES ('Carol', 'carol@corp.io');",
          '',
          '-- READ (query existing data)',
          'SELECT * FROM users;',
          '',
          '-- UPDATE (modify existing data)',
          "UPDATE users SET email = 'new@corp.io' WHERE id = 1;",
          '',
          '-- DELETE (remove data)',
          'DELETE FROM users WHERE id = 3;',
        ],
      },
      {
        title: 'Database engines',
        lines: [
          '-- MySQL       : popular open-source, web apps',
          '-- PostgreSQL   : advanced open-source, ACID-compliant',
          '-- SQLite       : file-based, embedded, zero-config',
          '-- SQL Server   : Microsoft enterprise RDBMS',
          '-- Oracle DB    : enterprise-grade, large-scale',
          '',
          '-- All share core SQL syntax with minor dialect differences',
          '-- Example: LIMIT (MySQL/PG) vs TOP (SQL Server)',
        ],
      },
    ],
    exercises: [
      {
        question: 'Complete the query to select all columns from the users table.',
        code: 'SELECT ___ FROM users;',
        answer: '*',
        hint: 'The wildcard character that means "all columns"',
      },
      {
        question: 'Which keyword removes rows from a table?',
        code: '___ FROM users WHERE id = 5;',
        answer: 'DELETE',
        hint: 'The "D" in CRUD stands for this operation',
      },
    ],
  },

  select: {
    title: 'SELECT & FROM',
    icon: <Code size={14} />,
    explanation:
      'SELECT is the foundation of every SQL query. It specifies which columns to retrieve from a table named in the FROM clause. You can select specific columns, use * for all, create aliases with AS, eliminate duplicates with DISTINCT, and even compute expressions directly in the SELECT list. Table aliases shorten repeated references in complex queries.',
    codeBlocks: [
      {
        title: 'Selecting columns and aliases',
        lines: [
          '-- Select specific columns',
          'SELECT name, age FROM users;',
          '',
          '-- Select all columns',
          'SELECT * FROM products;',
          '',
          '-- Column aliases with AS',
          'SELECT name AS full_name,',
          '       salary * 12 AS annual_pay',
          'FROM employees;',
        ],
        result: {
          headers: ['full_name', 'annual_pay'],
          rows: [
            ['Alice', 72000],
            ['Bob', 60000],
            ['Carol', 84000],
          ],
        },
      },
      {
        title: 'DISTINCT and expressions',
        lines: [
          '-- Remove duplicate rows from results',
          'SELECT DISTINCT city FROM employees;',
          '',
          '-- Expressions in SELECT',
          'SELECT name,',
          '       price,',
          '       price * 0.9 AS discounted_price,',
          "       CONCAT(name, ' - $', price) AS label",
          'FROM products;',
        ],
        result: {
          headers: ['city'],
          rows: [['New York'], ['London'], ['Tokyo']],
        },
      },
      {
        title: 'Table aliases',
        lines: [
          '-- Table aliases shorten references',
          'SELECT e.name, e.salary, d.dept_name',
          'FROM employees AS e',
          'JOIN departments AS d ON e.dept_id = d.id;',
          '',
          '-- Short form (AS is optional)',
          'SELECT p.name, p.price',
          'FROM products p',
          'WHERE p.price > 50;',
        ],
      },
    ],
    exercises: [
      {
        question: 'Select only unique values of the "city" column from employees.',
        code: 'SELECT ___ city FROM employees;',
        answer: 'DISTINCT',
        hint: 'The keyword that eliminates duplicate rows from results',
      },
      {
        question: 'Give the column "salary * 12" an alias called "annual".',
        code: 'SELECT salary * 12 ___ annual FROM employees;',
        answer: 'AS',
        hint: 'The keyword used to rename a column in the output',
      },
    ],
  },

  filtering: {
    title: 'WHERE & Filtering',
    icon: <Code size={14} />,
    explanation:
      'The WHERE clause filters rows before they appear in results. Use comparison operators (=, <>, <, >, <=, >=) for basic tests, AND/OR/NOT to combine conditions, IN for set membership, BETWEEN for ranges, LIKE for pattern matching (% matches any sequence, _ matches one character), and IS NULL / IS NOT NULL for null checks. WHERE filters individual rows -- unlike HAVING which filters after grouping.',
    codeBlocks: [
      {
        title: 'Comparison and logical operators',
        lines: [
          '-- Basic comparison',
          'SELECT * FROM orders WHERE total > 100;',
          '',
          '-- Combining with AND / OR',
          'SELECT * FROM users',
          'WHERE age >= 18 AND active = 1;',
          '',
          '-- NOT operator',
          'SELECT * FROM products',
          "WHERE NOT category = 'Archived';",
        ],
        result: {
          headers: ['id', 'name', 'age', 'active'],
          rows: [
            [1, 'Alice', 30, 1],
            [3, 'Carol', 25, 1],
            [5, 'Eve', 22, 1],
          ],
        },
      },
      {
        title: 'IN, BETWEEN, LIKE',
        lines: [
          '-- IN: match against a set of values',
          "SELECT * FROM products WHERE category IN ('Books', 'Music', 'Games');",
          '',
          '-- NOT IN: exclude a set',
          "SELECT * FROM users WHERE city NOT IN ('Banned City');",
          '',
          '-- BETWEEN: inclusive range',
          'SELECT * FROM orders WHERE total BETWEEN 50 AND 200;',
          '',
          "-- LIKE: pattern matching (% = any chars, _ = one char)",
          "SELECT * FROM users WHERE name LIKE 'A%';",
          "SELECT * FROM users WHERE email LIKE '%@gmail.com';",
          "SELECT * FROM codes WHERE code LIKE 'AB_D';",
        ],
        result: {
          headers: ['id', 'name'],
          rows: [
            [1, 'Alice'],
            [4, 'Anna'],
            [7, 'Alex'],
          ],
        },
      },
      {
        title: 'NULL checks',
        lines: [
          '-- NULL represents missing or unknown data',
          '-- Cannot use = or <> with NULL',
          '',
          '-- Find rows where phone is missing',
          'SELECT * FROM users WHERE phone IS NULL;',
          '',
          '-- Find rows where phone exists',
          'SELECT * FROM users WHERE phone IS NOT NULL;',
          '',
          '-- COALESCE provides a default for NULLs',
          "SELECT name, COALESCE(phone, 'N/A') AS phone",
          'FROM users;',
        ],
      },
    ],
    exercises: [
      {
        question: 'Select users whose age is between 20 and 30 (inclusive).',
        code: 'SELECT * FROM users WHERE age ___ 20 AND 30;',
        answer: 'BETWEEN',
        hint: 'The keyword for specifying an inclusive range of values',
      },
      {
        question: 'Find all users whose name starts with "J".',
        code: "SELECT * FROM users WHERE name LIKE ___;",
        answer: "'J%'",
        hint: 'Use the LIKE pattern: single quotes, the letter, then the multi-character wildcard',
      },
    ],
  },

  sorting: {
    title: 'Sorting & Limiting',
    icon: <ChevronRight size={14} />,
    explanation:
      'ORDER BY sorts results by one or more columns in ascending (ASC, default) or descending (DESC) order. You can sort by multiple columns for tie-breaking. LIMIT restricts how many rows are returned, and OFFSET skips a number of rows for pagination. SQL Server uses TOP instead of LIMIT, and the ANSI standard offers FETCH FIRST ... ROWS ONLY.',
    codeBlocks: [
      {
        title: 'ORDER BY basics',
        lines: [
          '-- Sort ascending (default)',
          'SELECT name, salary FROM employees',
          'ORDER BY salary;',
          '',
          '-- Sort descending',
          'SELECT name, salary FROM employees',
          'ORDER BY salary DESC;',
          '',
          '-- Multiple columns: sort by city then by name',
          'SELECT * FROM users',
          'ORDER BY city ASC, name DESC;',
        ],
        result: {
          headers: ['name', 'salary'],
          rows: [
            ['Carol', 9000],
            ['Alice', 7500],
            ['Bob', 5000],
          ],
        },
      },
      {
        title: 'LIMIT, OFFSET, and pagination',
        lines: [
          '-- First 10 rows',
          'SELECT * FROM products ORDER BY name LIMIT 10;',
          '',
          '-- Page 2 (skip first 10, get next 10)',
          'SELECT * FROM products',
          'ORDER BY name',
          'LIMIT 10 OFFSET 10;',
          '',
          '-- SQL Server uses TOP',
          'SELECT TOP 10 * FROM products ORDER BY name;',
          '',
          '-- ANSI standard: FETCH FIRST',
          'SELECT * FROM products',
          'ORDER BY price DESC',
          'FETCH FIRST 5 ROWS ONLY;',
        ],
      },
      {
        title: 'Ordering by expressions',
        lines: [
          '-- Order by a computed column',
          'SELECT name, price, price * quantity AS total_value',
          'FROM inventory',
          'ORDER BY total_value DESC;',
          '',
          '-- Order by column position (not recommended)',
          'SELECT name, salary FROM employees',
          'ORDER BY 2 DESC;  -- sorts by 2nd column (salary)',
        ],
        result: {
          headers: ['name', 'price', 'total_value'],
          rows: [
            ['Widget A', 25, 2500],
            ['Widget C', 40, 1600],
            ['Widget B', 15, 750],
          ],
        },
      },
    ],
    exercises: [
      {
        question: 'Sort employees by salary from highest to lowest.',
        code: 'SELECT * FROM employees ORDER BY salary ___;',
        answer: 'DESC',
        hint: 'The keyword for descending order',
      },
      {
        question: 'Get the first 5 rows from a sorted result set.',
        code: 'SELECT * FROM products ORDER BY price DESC ___ 5;',
        answer: 'LIMIT',
        hint: 'The clause that restricts the number of rows returned (MySQL/PostgreSQL)',
      },
    ],
  },

  joins: {
    title: 'JOINs',
    icon: <Code size={14} />,
    explanation:
      'Joins combine rows from two or more tables based on a related column. INNER JOIN returns only matching rows from both sides. LEFT JOIN keeps all rows from the left table (NULLs for non-matches on the right). RIGHT JOIN does the opposite. FULL OUTER JOIN keeps all rows from both tables. CROSS JOIN produces a cartesian product. Self-joins let a table reference itself. Multiple tables can be joined in a single query by chaining JOIN clauses.',
    codeBlocks: [
      {
        title: 'INNER and LEFT JOIN',
        lines: [
          '-- INNER JOIN: only rows with matches in both tables',
          'SELECT u.name, o.total',
          'FROM users u',
          'INNER JOIN orders o ON u.id = o.user_id;',
          '',
          '-- LEFT JOIN: all users, even those without orders',
          'SELECT u.name, o.total',
          'FROM users u',
          'LEFT JOIN orders o ON u.id = o.user_id;',
        ],
        result: {
          headers: ['name', 'total'],
          rows: [
            ['Alice', 150],
            ['Alice', 75],
            ['Bob', 200],
            ['Carol', 'NULL'],
          ],
        },
      },
      {
        title: 'RIGHT, FULL OUTER, and CROSS JOIN',
        lines: [
          '-- RIGHT JOIN: all orders, even without matching users',
          'SELECT u.name, o.total',
          'FROM users u',
          'RIGHT JOIN orders o ON u.id = o.user_id;',
          '',
          '-- FULL OUTER JOIN: all rows from both tables',
          'SELECT u.name, o.total',
          'FROM users u',
          'FULL OUTER JOIN orders o ON u.id = o.user_id;',
          '',
          '-- CROSS JOIN: every combination (cartesian product)',
          'SELECT c.color, s.size',
          'FROM colors c',
          'CROSS JOIN sizes s;',
        ],
        result: {
          headers: ['color', 'size'],
          rows: [
            ['Red', 'S'],
            ['Red', 'M'],
            ['Blue', 'S'],
            ['Blue', 'M'],
          ],
        },
      },
      {
        title: 'Self-join and multi-table joins',
        lines: [
          '-- Self-join: employees with their managers',
          'SELECT e.name AS employee,',
          '       m.name AS manager',
          'FROM employees e',
          'LEFT JOIN employees m ON e.manager_id = m.id;',
          '',
          '-- Multi-table join: orders with user and product info',
          'SELECT u.name, p.title, oi.quantity',
          'FROM order_items oi',
          'JOIN orders o ON oi.order_id = o.id',
          'JOIN users u ON o.user_id = u.id',
          'JOIN products p ON oi.product_id = p.id;',
        ],
        result: {
          headers: ['employee', 'manager'],
          rows: [
            ['Alice', 'Eve'],
            ['Bob', 'Eve'],
            ['Carol', 'Alice'],
            ['Eve', 'NULL'],
          ],
        },
      },
    ],
    exercises: [
      {
        question: 'Join users and orders so that all users appear, even without orders.',
        code: 'SELECT * FROM users u ___ JOIN orders o ON u.id = o.user_id;',
        answer: 'LEFT',
        hint: 'This join type keeps all rows from the left (first) table',
      },
      {
        question: 'Complete the self-join to find each employee\'s manager.',
        code: 'SELECT e.name, m.name AS manager FROM employees e LEFT JOIN ___ m ON e.manager_id = m.id;',
        answer: 'employees',
        hint: 'A self-join joins a table to itself -- use the same table name',
      },
    ],
  },

  aggregation: {
    title: 'Aggregation',
    icon: <BookOpen size={14} />,
    explanation:
      'Aggregate functions collapse multiple rows into a single value. COUNT counts rows, SUM adds values, AVG computes the mean, MIN/MAX find extremes. GROUP BY partitions rows into groups before aggregation. HAVING filters groups after aggregation (unlike WHERE which filters before). COUNT(DISTINCT col) counts unique values. You can combine aggregates with CASE for conditional counting.',
    codeBlocks: [
      {
        title: 'Basic aggregate functions',
        lines: [
          '-- COUNT: number of rows',
          'SELECT COUNT(*) AS total FROM users;',
          '',
          '-- SUM, AVG, MIN, MAX',
          'SELECT SUM(total) AS revenue,',
          '       AVG(total) AS avg_order,',
          '       MIN(total) AS smallest,',
          '       MAX(total) AS largest',
          'FROM orders;',
        ],
        result: {
          headers: ['revenue', 'avg_order', 'smallest', 'largest'],
          rows: [[45200, 226, 12, 4500]],
        },
      },
      {
        title: 'GROUP BY and HAVING',
        lines: [
          '-- Group by city, compute per-group stats',
          'SELECT city,',
          '       COUNT(*) AS num_employees,',
          '       AVG(salary) AS avg_salary',
          'FROM employees',
          'GROUP BY city;',
          '',
          '-- HAVING: filter groups (not individual rows)',
          'SELECT city, AVG(salary) AS avg_sal',
          'FROM employees',
          'GROUP BY city',
          'HAVING AVG(salary) > 5000;',
        ],
        result: {
          headers: ['city', 'num_employees', 'avg_salary'],
          rows: [
            ['New York', 45, 7500],
            ['London', 30, 6200],
            ['Tokyo', 20, 8100],
          ],
        },
      },
      {
        title: 'COUNT DISTINCT and conditional aggregation',
        lines: [
          '-- COUNT only unique values',
          'SELECT COUNT(DISTINCT category) AS num_categories',
          'FROM products;',
          '',
          '-- Conditional aggregation with CASE',
          'SELECT',
          "  COUNT(CASE WHEN status = 'active' THEN 1 END) AS active_count,",
          "  COUNT(CASE WHEN status = 'inactive' THEN 1 END) AS inactive_count,",
          "  SUM(CASE WHEN age >= 18 THEN 1 ELSE 0 END) AS adults",
          'FROM users;',
        ],
        result: {
          headers: ['active_count', 'inactive_count', 'adults'],
          rows: [[142, 23, 158]],
        },
      },
    ],
    exercises: [
      {
        question: 'Find the average salary grouped by department.',
        code: 'SELECT department, ___(salary) FROM employees GROUP BY department;',
        answer: 'AVG',
        hint: 'The aggregate function that computes the arithmetic mean',
      },
      {
        question: 'Filter groups to show only departments with more than 10 employees.',
        code: 'SELECT department, COUNT(*) FROM employees GROUP BY department ___ COUNT(*) > 10;',
        answer: 'HAVING',
        hint: 'The clause that filters groups after aggregation (not WHERE)',
      },
    ],
  },

  subqueries: {
    title: 'Subqueries',
    icon: <Code size={14} />,
    explanation:
      'A subquery is a SELECT statement nested inside another query. Scalar subqueries return a single value and can appear anywhere a value is expected. IN subqueries test set membership. EXISTS checks if any matching rows exist and is often faster than IN. Correlated subqueries reference the outer query and execute once per outer row. Subqueries in FROM create derived tables (inline views). Subqueries in SELECT compute per-row values.',
    codeBlocks: [
      {
        title: 'Scalar and IN subqueries',
        lines: [
          '-- Scalar subquery: returns one value',
          'SELECT name, salary',
          'FROM employees',
          'WHERE salary > (',
          '  SELECT AVG(salary) FROM employees',
          ');',
          '',
          '-- IN subquery: match against a set',
          'SELECT name FROM users',
          'WHERE id IN (',
          '  SELECT user_id FROM orders',
          '  WHERE total > 500',
          ');',
        ],
        result: {
          headers: ['name', 'salary'],
          rows: [
            ['Carol', 9000],
            ['Eve', 8500],
            ['Alice', 7500],
          ],
        },
      },
      {
        title: 'EXISTS and correlated subqueries',
        lines: [
          '-- EXISTS: true if subquery returns any rows',
          'SELECT u.name',
          'FROM users u',
          'WHERE EXISTS (',
          '  SELECT 1 FROM orders o',
          '  WHERE o.user_id = u.id',
          '  AND o.total > 1000',
          ');',
          '',
          '-- Correlated subquery: references outer table',
          'SELECT e.name, e.salary,',
          '  (SELECT AVG(e2.salary)',
          '   FROM employees e2',
          '   WHERE e2.dept_id = e.dept_id) AS dept_avg',
          'FROM employees e;',
        ],
        result: {
          headers: ['name', 'salary', 'dept_avg'],
          rows: [
            ['Alice', 7500, 6800],
            ['Bob', 5000, 6800],
            ['Carol', 9000, 8200],
          ],
        },
      },
      {
        title: 'Subquery in FROM and SELECT',
        lines: [
          '-- Derived table (subquery in FROM)',
          'SELECT dept_name, avg_sal',
          'FROM (',
          '  SELECT dept_id, AVG(salary) AS avg_sal',
          '  FROM employees',
          '  GROUP BY dept_id',
          ') AS dept_stats',
          'JOIN departments d ON dept_stats.dept_id = d.id',
          'WHERE avg_sal > 6000;',
          '',
          '-- Subquery in SELECT list',
          'SELECT name,',
          '  (SELECT COUNT(*) FROM orders o',
          '   WHERE o.user_id = u.id) AS order_count',
          'FROM users u;',
        ],
      },
    ],
    exercises: [
      {
        question: 'Find users who have placed at least one order using EXISTS.',
        code: 'SELECT u.name FROM users u WHERE ___ (SELECT 1 FROM orders o WHERE o.user_id = u.id);',
        answer: 'EXISTS',
        hint: 'The keyword that checks if a subquery returns any rows at all',
      },
      {
        question: 'Complete the subquery to find employees earning above average.',
        code: 'SELECT name FROM employees WHERE salary > (SELECT ___(salary) FROM employees);',
        answer: 'AVG',
        hint: 'The aggregate function that computes the mean, used here as a scalar subquery',
      },
    ],
  },

  manipulation: {
    title: 'INSERT/UPDATE/DELETE',
    icon: <BookOpen size={14} />,
    explanation:
      'DML (Data Manipulation Language) statements modify data. INSERT INTO adds new rows using VALUES or by selecting from another table. UPDATE SET modifies existing rows -- always use WHERE to avoid updating every row. DELETE FROM removes rows -- again, always filter with WHERE. TRUNCATE quickly empties an entire table. Some databases support UPSERT (INSERT ... ON CONFLICT) or MERGE for "insert or update" logic.',
    codeBlocks: [
      {
        title: 'INSERT statements',
        lines: [
          '-- Insert a single row',
          'INSERT INTO users (name, email, age)',
          "VALUES ('Dave', 'dave@corp.io', 28);",
          '',
          '-- Insert multiple rows at once',
          'INSERT INTO users (name, email, age) VALUES',
          "  ('Eve', 'eve@corp.io', 32),",
          "  ('Frank', 'frank@corp.io', 45),",
          "  ('Grace', 'grace@corp.io', 27);",
          '',
          '-- Insert from a SELECT query',
          'INSERT INTO archived_users (name, email)',
          'SELECT name, email FROM users',
          'WHERE active = 0;',
        ],
      },
      {
        title: 'UPDATE and DELETE',
        lines: [
          '-- Update specific rows (always use WHERE!)',
          'UPDATE users SET age = 29, active = 1',
          "WHERE name = 'Dave';",
          '',
          '-- Update with a subquery',
          'UPDATE products SET price = price * 1.1',
          'WHERE category_id IN (',
          "  SELECT id FROM categories WHERE name = 'Premium'",
          ');',
          '',
          '-- Delete specific rows (always use WHERE!)',
          "DELETE FROM users WHERE name = 'Dave';",
          '',
          '-- Delete with a condition from another table',
          'DELETE FROM orders',
          'WHERE user_id IN (',
          '  SELECT id FROM users WHERE active = 0',
          ');',
        ],
        result: {
          headers: ['operation', 'affected_rows'],
          rows: [
            ['UPDATE', 1],
            ['DELETE', 3],
          ],
        },
      },
      {
        title: 'TRUNCATE and UPSERT',
        lines: [
          '-- TRUNCATE: fast delete of ALL rows (no WHERE)',
          '-- Cannot be rolled back in some databases',
          'TRUNCATE TABLE temp_logs;',
          '',
          '-- PostgreSQL UPSERT (INSERT ... ON CONFLICT)',
          'INSERT INTO settings (key, value)',
          "VALUES ('theme', 'dark')",
          'ON CONFLICT (key)',
          "DO UPDATE SET value = 'dark';",
          '',
          '-- MySQL UPSERT',
          'INSERT INTO settings (key_name, value)',
          "VALUES ('theme', 'dark')",
          "ON DUPLICATE KEY UPDATE value = 'dark';",
          '',
          '-- SQL Server MERGE (simplified)',
          'MERGE INTO target_table AS t',
          'USING source_table AS s ON t.id = s.id',
          'WHEN MATCHED THEN UPDATE SET t.val = s.val',
          'WHEN NOT MATCHED THEN INSERT (id, val) VALUES (s.id, s.val);',
        ],
      },
    ],
    exercises: [
      {
        question: 'Complete the INSERT statement to add a new product.',
        code: "INSERT ___ products (name, price) VALUES ('Widget', 9.99);",
        answer: 'INTO',
        hint: 'The keyword between INSERT and the table name',
      },
      {
        question: 'Update the price of all products in the "Books" category to 19.99.',
        code: "UPDATE products ___ price = 19.99 WHERE category = 'Books';",
        answer: 'SET',
        hint: 'The keyword used after UPDATE table_name to specify column assignments',
      },
    ],
  },

  tables: {
    title: 'Table Operations',
    icon: <Code size={14} />,
    explanation:
      'DDL (Data Definition Language) statements define and modify database structure. CREATE TABLE specifies columns with data types and constraints. Common data types include INT, VARCHAR(n), TEXT, DATE, DECIMAL(p,s), and BOOLEAN. Constraints enforce rules: PRIMARY KEY (unique row ID), FOREIGN KEY (referential integrity), NOT NULL, DEFAULT, UNIQUE. ALTER TABLE modifies existing tables. DROP TABLE removes them entirely.',
    codeBlocks: [
      {
        title: 'CREATE TABLE with data types',
        lines: [
          'CREATE TABLE employees (',
          '  id         INT PRIMARY KEY,',
          '  name       VARCHAR(100) NOT NULL,',
          '  email      VARCHAR(255) UNIQUE,',
          '  bio        TEXT,',
          '  salary     DECIMAL(10, 2) DEFAULT 0.00,',
          '  is_active  BOOLEAN DEFAULT TRUE,',
          '  hire_date  DATE NOT NULL,',
          '  dept_id    INT,',
          '  FOREIGN KEY (dept_id)',
          '    REFERENCES departments(id)',
          ');',
        ],
      },
      {
        title: 'Constraints in detail',
        lines: [
          '-- AUTO_INCREMENT / SERIAL for auto-generated IDs',
          'CREATE TABLE orders (',
          '  id          INT PRIMARY KEY AUTO_INCREMENT,  -- MySQL',
          '  -- id       SERIAL PRIMARY KEY,              -- PostgreSQL',
          '  user_id     INT NOT NULL,',
          '  total       DECIMAL(10,2) CHECK (total >= 0),',
          '  status      VARCHAR(20) DEFAULT \'pending\',',
          '  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,',
          '  FOREIGN KEY (user_id) REFERENCES users(id)',
          '    ON DELETE CASCADE',
          '    ON UPDATE CASCADE',
          ');',
          '',
          '-- Composite primary key',
          'CREATE TABLE enrollments (',
          '  student_id  INT,',
          '  course_id   INT,',
          '  grade       CHAR(2),',
          '  PRIMARY KEY (student_id, course_id)',
          ');',
        ],
      },
      {
        title: 'ALTER TABLE and DROP TABLE',
        lines: [
          '-- Add a new column',
          'ALTER TABLE employees',
          'ADD COLUMN phone VARCHAR(20);',
          '',
          '-- Modify column type',
          'ALTER TABLE employees',
          'ALTER COLUMN salary SET DEFAULT 50000;',
          '',
          '-- Rename a column',
          'ALTER TABLE employees',
          'RENAME COLUMN phone TO mobile;',
          '',
          '-- Drop (remove) a column',
          'ALTER TABLE employees',
          'DROP COLUMN bio;',
          '',
          '-- Drop entire table safely',
          'DROP TABLE IF EXISTS temp_data;',
        ],
      },
    ],
    exercises: [
      {
        question: 'Create a new table called "books" with an id and title.',
        code: '___ TABLE books (id INT PRIMARY KEY, title VARCHAR(200));',
        answer: 'CREATE',
        hint: 'The DDL keyword to define a new table',
      },
      {
        question: 'Add a "pages" column to the books table.',
        code: '___ TABLE books ADD COLUMN pages INT;',
        answer: 'ALTER',
        hint: 'The DDL keyword to modify an existing table structure',
      },
    ],
  },

  indexes: {
    title: 'Indexes & Views',
    icon: <ChevronRight size={14} />,
    explanation:
      'Indexes are data structures that speed up data retrieval at the cost of extra storage and slower writes. Create indexes on frequently queried columns. Composite indexes cover multiple columns. Use EXPLAIN to see how the database executes a query. Views are saved queries that act like virtual tables -- they simplify complex queries and control access. Materialized views store the result physically for faster reads.',
    codeBlocks: [
      {
        title: 'Creating and using indexes',
        lines: [
          '-- Single-column index',
          'CREATE INDEX idx_users_email ON users(email);',
          '',
          '-- Composite index (multi-column)',
          'CREATE INDEX idx_orders_user_date',
          'ON orders(user_id, created_at);',
          '',
          '-- Unique index (also enforces uniqueness)',
          'CREATE UNIQUE INDEX idx_users_username',
          'ON users(username);',
          '',
          '-- Drop an index',
          'DROP INDEX idx_users_email;',
        ],
      },
      {
        title: 'EXPLAIN and query optimization',
        lines: [
          '-- See the query execution plan',
          'EXPLAIN SELECT * FROM users WHERE email = \'a@b.com\';',
          '',
          '-- PostgreSQL verbose plan',
          'EXPLAIN ANALYZE',
          'SELECT u.name, COUNT(o.id)',
          'FROM users u',
          'JOIN orders o ON u.id = o.user_id',
          'GROUP BY u.name;',
          '',
          '-- Index tips:',
          '-- 1. Index columns used in WHERE, JOIN, ORDER BY',
          '-- 2. Avoid indexing low-cardinality columns (e.g. boolean)',
          '-- 3. Composite index order matters: leftmost column first',
          '-- 4. Too many indexes slow down INSERT/UPDATE/DELETE',
        ],
      },
      {
        title: 'Views and materialized views',
        lines: [
          '-- Create a view (virtual table)',
          'CREATE VIEW active_users AS',
          'SELECT id, name, email',
          'FROM users',
          'WHERE active = 1;',
          '',
          '-- Query the view like a table',
          'SELECT * FROM active_users WHERE name LIKE \'A%\';',
          '',
          '-- WITH CHECK OPTION: prevent inserts/updates',
          '-- that would make rows disappear from the view',
          'CREATE VIEW young_users AS',
          'SELECT * FROM users WHERE age < 30',
          'WITH CHECK OPTION;',
          '',
          '-- Materialized view (PostgreSQL): stores data physically',
          'CREATE MATERIALIZED VIEW monthly_sales AS',
          'SELECT DATE_TRUNC(\'month\', created_at) AS month,',
          '       SUM(total) AS revenue',
          'FROM orders GROUP BY month;',
          '',
          '-- Refresh materialized view',
          'REFRESH MATERIALIZED VIEW monthly_sales;',
        ],
      },
    ],
    exercises: [
      {
        question: 'Create an index on the "email" column of the users table.',
        code: 'CREATE ___ idx_email ON users(email);',
        answer: 'INDEX',
        hint: 'The keyword that creates a lookup structure for faster queries',
      },
      {
        question: 'Create a view called "vip_customers" from a SELECT query.',
        code: 'CREATE ___ vip_customers AS SELECT * FROM customers WHERE total_spent > 10000;',
        answer: 'VIEW',
        hint: 'A saved query that acts like a virtual table',
      },
    ],
  },

  windows: {
    title: 'Window Functions',
    icon: <Code size={14} />,
    explanation:
      'Window functions compute values across a set of rows related to the current row without collapsing them into a single output row -- unlike GROUP BY. Use OVER() to define the window. PARTITION BY groups rows within the window. ORDER BY within OVER determines row ordering. ROW_NUMBER assigns sequential numbers, RANK/DENSE_RANK handle ties differently, LAG/LEAD access previous/next rows, and running aggregates (SUM/AVG OVER) create cumulative calculations.',
    codeBlocks: [
      {
        title: 'ROW_NUMBER, RANK, DENSE_RANK, NTILE',
        lines: [
          '-- ROW_NUMBER: unique sequential number',
          'SELECT name, salary,',
          '  ROW_NUMBER() OVER (ORDER BY salary DESC) AS row_num',
          'FROM employees;',
          '',
          '-- RANK: ties get same rank, gaps after ties',
          '-- DENSE_RANK: ties get same rank, no gaps',
          'SELECT name, salary,',
          '  RANK() OVER (ORDER BY salary DESC) AS rnk,',
          '  DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_rnk',
          'FROM employees;',
          '',
          '-- NTILE: divide into N roughly equal groups',
          'SELECT name, salary,',
          '  NTILE(4) OVER (ORDER BY salary DESC) AS quartile',
          'FROM employees;',
        ],
        result: {
          headers: ['name', 'salary', 'rnk', 'dense_rnk'],
          rows: [
            ['Carol', 9000, 1, 1],
            ['Eve', 9000, 1, 1],
            ['Alice', 7500, 3, 2],
            ['Bob', 5000, 4, 3],
          ],
        },
      },
      {
        title: 'LAG, LEAD, and PARTITION BY',
        lines: [
          '-- LAG: access previous row value',
          '-- LEAD: access next row value',
          'SELECT name, salary,',
          '  LAG(salary) OVER (ORDER BY hire_date) AS prev_salary,',
          '  LEAD(salary) OVER (ORDER BY hire_date) AS next_salary',
          'FROM employees;',
          '',
          '-- PARTITION BY: separate windows per group',
          'SELECT dept, name, salary,',
          '  ROW_NUMBER() OVER (',
          '    PARTITION BY dept ORDER BY salary DESC',
          '  ) AS dept_rank',
          'FROM employees;',
        ],
        result: {
          headers: ['dept', 'name', 'salary', 'dept_rank'],
          rows: [
            ['Engineering', 'Carol', 9000, 1],
            ['Engineering', 'Alice', 7500, 2],
            ['Sales', 'Eve', 8500, 1],
            ['Sales', 'Bob', 5000, 2],
          ],
        },
      },
      {
        title: 'Running aggregates and frame clauses',
        lines: [
          '-- Running total (cumulative sum)',
          'SELECT date, amount,',
          '  SUM(amount) OVER (',
          '    ORDER BY date',
          '    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW',
          '  ) AS running_total',
          'FROM transactions;',
          '',
          '-- Moving average (last 3 rows)',
          'SELECT date, amount,',
          '  AVG(amount) OVER (',
          '    ORDER BY date',
          '    ROWS BETWEEN 2 PRECEDING AND CURRENT ROW',
          '  ) AS moving_avg_3',
          'FROM transactions;',
          '',
          '-- Percentage of total',
          'SELECT name, salary,',
          '  ROUND(100.0 * salary / SUM(salary) OVER (), 1) AS pct_total',
          'FROM employees;',
        ],
        result: {
          headers: ['date', 'amount', 'running_total'],
          rows: [
            ['2024-01-01', 100, 100],
            ['2024-01-02', 250, 350],
            ['2024-01-03', 75, 425],
            ['2024-01-04', 300, 725],
          ],
        },
      },
    ],
    exercises: [
      {
        question: 'Assign a rank to each employee based on salary (highest first).',
        code: 'SELECT name, salary, RANK() ___ (ORDER BY salary DESC) AS rnk FROM employees;',
        answer: 'OVER',
        hint: 'The keyword that defines the window for a window function',
      },
      {
        question: 'Rank employees within each department separately.',
        code: 'SELECT dept, name, RANK() OVER (___ BY dept ORDER BY salary DESC) AS dept_rank FROM employees;',
        answer: 'PARTITION',
        hint: 'The clause that divides rows into groups within a window',
      },
    ],
  },

  advanced: {
    title: 'Advanced',
    icon: <BookOpen size={14} />,
    explanation:
      'Advanced SQL includes CTEs (Common Table Expressions) with the WITH clause for readable temporary result sets. Recursive CTEs handle hierarchical data. CASE WHEN provides conditional logic. COALESCE returns the first non-null value. CAST converts types. Transactions (BEGIN/COMMIT/ROLLBACK) ensure atomicity -- the ACID properties guarantee reliable processing. Stored procedures encapsulate reusable logic, and triggers fire automatically on data changes.',
    codeBlocks: [
      {
        title: 'CTEs and recursive CTEs',
        lines: [
          '-- CTE: Common Table Expression',
          'WITH top_earners AS (',
          '  SELECT * FROM employees WHERE salary > 8000',
          '),',
          'dept_counts AS (',
          '  SELECT dept_id, COUNT(*) AS cnt',
          '  FROM employees GROUP BY dept_id',
          ')',
          'SELECT t.name, d.cnt AS dept_size',
          'FROM top_earners t',
          'JOIN dept_counts d ON t.dept_id = d.dept_id;',
          '',
          '-- Recursive CTE: org chart / hierarchy',
          'WITH RECURSIVE org_chart AS (',
          '  -- Base case: top-level (no manager)',
          '  SELECT id, name, manager_id, 1 AS level',
          '  FROM employees WHERE manager_id IS NULL',
          '  UNION ALL',
          '  -- Recursive case: employees with managers',
          '  SELECT e.id, e.name, e.manager_id, oc.level + 1',
          '  FROM employees e',
          '  JOIN org_chart oc ON e.manager_id = oc.id',
          ')',
          'SELECT * FROM org_chart ORDER BY level, name;',
        ],
        result: {
          headers: ['id', 'name', 'manager_id', 'level'],
          rows: [
            [1, 'CEO Eve', 'NULL', 1],
            [2, 'VP Alice', 1, 2],
            [3, 'VP Bob', 1, 2],
            [4, 'Mgr Carol', 2, 3],
          ],
        },
      },
      {
        title: 'CASE, COALESCE, CAST',
        lines: [
          '-- CASE WHEN: conditional logic in queries',
          'SELECT name, salary,',
          '  CASE',
          "    WHEN salary >= 9000 THEN 'Senior'",
          "    WHEN salary >= 6000 THEN 'Mid'",
          "    ELSE 'Junior'",
          '  END AS level',
          'FROM employees;',
          '',
          '-- COALESCE: first non-NULL value',
          "SELECT name, COALESCE(phone, email, 'No contact') AS contact",
          'FROM users;',
          '',
          '-- CAST: type conversion',
          "SELECT CAST('2024-01-15' AS DATE) AS parsed_date;",
          "SELECT CAST(price AS INT) AS rounded FROM products;",
          'SELECT CAST(123 AS VARCHAR(10)) AS text_num;',
        ],
        result: {
          headers: ['name', 'salary', 'level'],
          rows: [
            ['Carol', 9000, 'Senior'],
            ['Alice', 7500, 'Mid'],
            ['Bob', 5000, 'Junior'],
          ],
        },
      },
      {
        title: 'Transactions, procedures, triggers',
        lines: [
          '-- Transaction: all-or-nothing group of statements',
          'BEGIN TRANSACTION;',
          '  UPDATE accounts SET balance = balance - 500 WHERE id = 1;',
          '  UPDATE accounts SET balance = balance + 500 WHERE id = 2;',
          '  -- If both succeed:',
          'COMMIT;',
          '  -- If something fails:',
          '  -- ROLLBACK;',
          '',
          '-- ACID properties:',
          '-- Atomicity   : all or nothing',
          '-- Consistency : valid state before and after',
          '-- Isolation   : concurrent transactions don\'t interfere',
          '-- Durability  : committed data survives crashes',
          '',
          '-- Stored procedure (simplified syntax)',
          'CREATE PROCEDURE give_raise(emp_id INT, amount DECIMAL)',
          'BEGIN',
          '  UPDATE employees',
          '  SET salary = salary + amount',
          '  WHERE id = emp_id;',
          'END;',
          '',
          '-- Trigger: fires on data changes automatically',
          'CREATE TRIGGER log_update',
          'AFTER UPDATE ON employees',
          'FOR EACH ROW',
          'BEGIN',
          '  INSERT INTO audit_log (action, emp_id, changed_at)',
          "  VALUES ('UPDATE', NEW.id, NOW());",
          'END;',
        ],
      },
    ],
    exercises: [
      {
        question: 'Start a CTE named "recent_orders" before a SELECT query.',
        code: '___ recent_orders AS (SELECT * FROM orders WHERE created_at > \'2024-01-01\') SELECT * FROM recent_orders;',
        answer: 'WITH',
        hint: 'The keyword that introduces a Common Table Expression',
      },
      {
        question: 'Complete the CASE expression to label salaries above 8000 as "High".',
        code: "SELECT name, CASE ___ salary > 8000 THEN 'High' ELSE 'Normal' END FROM employees;",
        answer: 'WHEN',
        hint: 'The keyword that introduces a condition inside a CASE expression',
      },
    ],
  },
};

const topicKeys = Object.keys(topics);

// -- SQL syntax highlighting --------------------------------------------------

const SQL_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'BETWEEN', 'LIKE',
  'ORDER', 'BY', 'ASC', 'DESC', 'LIMIT', 'OFFSET', 'AS', 'DISTINCT',
  'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'OUTER', 'CROSS', 'ON', 'USING',
  'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'TRUNCATE',
  'CREATE', 'ALTER', 'DROP', 'TABLE', 'INDEX', 'VIEW',
  'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'UNIQUE', 'NULL', 'DEFAULT',
  'CHECK', 'CONSTRAINT', 'CASCADE', 'SERIAL',
  'INT', 'INTEGER', 'VARCHAR', 'DECIMAL', 'TEXT', 'BOOLEAN', 'DATE',
  'CHAR', 'TIMESTAMP', 'FLOAT', 'DOUBLE', 'BIGINT', 'SMALLINT',
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'CONCAT', 'ROUND', 'COALESCE',
  'CAST', 'DATE_TRUNC', 'NOW', 'CURRENT_TIMESTAMP',
  'GROUP', 'HAVING',
  'ADD', 'COLUMN', 'IF', 'EXISTS', 'RENAME', 'MODIFY',
  'BEGIN', 'COMMIT', 'ROLLBACK', 'TRANSACTION',
  'WITH', 'RECURSIVE', 'OVER', 'PARTITION', 'ROWS', 'UNBOUNDED',
  'PRECEDING', 'FOLLOWING', 'CURRENT', 'ROW',
  'RANK', 'DENSE_RANK', 'ROW_NUMBER', 'NTILE', 'LAG', 'LEAD',
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'UNION', 'ALL', 'INTERSECT', 'EXCEPT',
  'EXPLAIN', 'ANALYZE', 'MATERIALIZED', 'REFRESH',
  'PROCEDURE', 'TRIGGER', 'AFTER', 'BEFORE', 'FOR', 'EACH', 'NEW', 'OLD',
  'DO', 'CONFLICT', 'DUPLICATE', 'MERGE', 'MATCHED',
  'TRUE', 'FALSE', 'IS', 'AUTO_INCREMENT',
  'TOP', 'FETCH', 'FIRST', 'ONLY', 'OPTION',
]);

const SQL_FUNCTIONS = new Set([
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'CONCAT', 'ROUND', 'COALESCE',
  'CAST', 'DATE_TRUNC', 'NOW', 'CURRENT_TIMESTAMP',
  'RANK', 'DENSE_RANK', 'ROW_NUMBER', 'NTILE', 'LAG', 'LEAD',
]);

function highlightSQL(line: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < line.length) {
    // Single-line comment
    if (line[i] === '-' && line[i + 1] === '-') {
      nodes.push(
        <span key={key++} className="text-gray-500">
          {line.slice(i)}
        </span>
      );
      break;
    }

    // Strings (single-quoted in SQL)
    if (line[i] === "'") {
      const start = i;
      i++;
      while (i < line.length) {
        if (line[i] === "'" && line[i + 1] === "'") {
          i += 2;
          continue;
        }
        if (line[i] === "'") {
          i++;
          break;
        }
        i++;
      }
      nodes.push(
        <span key={key++} className="text-green-400">
          {line.slice(start, i)}
        </span>
      );
      continue;
    }

    // Numbers
    if (/\d/.test(line[i]) && (i === 0 || /[\s(,=<>+\-*/]/.test(line[i - 1]))) {
      const start = i;
      while (i < line.length && /[\d.]/.test(line[i])) i++;
      nodes.push(
        <span key={key++} className="text-orange-400">
          {line.slice(start, i)}
        </span>
      );
      continue;
    }

    // Identifiers / keywords
    if (/[a-zA-Z_]/.test(line[i])) {
      const start = i;
      while (i < line.length && /[a-zA-Z0-9_]/.test(line[i])) i++;
      const word = line.slice(start, i);
      const upper = word.toUpperCase();

      // Check if followed by ( to detect function calls
      const isFunction = SQL_FUNCTIONS.has(upper) && i < line.length && line[i] === '(';

      if (isFunction) {
        nodes.push(
          <span key={key++} className="text-yellow-400">
            {word}
          </span>
        );
      } else if (SQL_KEYWORDS.has(upper)) {
        nodes.push(
          <span key={key++} className="text-blue-400 font-semibold">
            {word}
          </span>
        );
      } else {
        nodes.push(
          <span key={key++} className="text-gray-300">
            {word}
          </span>
        );
      }
      continue;
    }

    // Operators & punctuation
    if (/[(),.;*=<>!+\-/]/.test(line[i])) {
      nodes.push(
        <span key={key++} className="text-gray-400">
          {line[i]}
        </span>
      );
      i++;
      continue;
    }

    // Whitespace / default
    nodes.push(<span key={key++}>{line[i]}</span>);
    i++;
  }

  return nodes;
}

// -- Result table component ---------------------------------------------------

const ResultTableView: React.FC<{ table: ResultTable }> = ({ table }) => (
  <div className="overflow-x-auto">
    <table className="min-w-[200px] text-[12px] border-collapse">
      <thead>
        <tr>
          {table.headers.map((h) => (
            <th
              key={h}
              className="px-3 py-1.5 text-left font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {table.rows.map((row, ri) => (
          <tr key={ri}>
            {row.map((cell, ci) => (
              <td
                key={ci}
                className={`px-3 py-1.5 border border-slate-200 dark:border-gray-700/50 ${
                  cell === 'NULL'
                    ? 'text-gray-400 dark:text-gray-600 italic'
                    : 'text-slate-700 dark:text-gray-300'
                } ${ri % 2 === 0 ? 'bg-white dark:bg-gray-900/40' : 'bg-slate-50 dark:bg-gray-800/30'}`}
              >
                {String(cell)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// -- Main component -----------------------------------------------------------

export const SQLLab: React.FC = () => {
  const [activeTopic, setActiveTopic] = useState<string>('intro');
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, boolean | null>>({});
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});

  const currentTopic = topics[activeTopic];

  const exerciseKey = (idx: number) => `${activeTopic}_${idx}`;

  const handleCheck = (idx: number, answer: string) => {
    const k = exerciseKey(idx);
    const trimmed = (inputs[k] ?? '').trim();
    const expected = answer.trim();
    // Case-insensitive comparison, but preserve exact match for quoted strings
    const isCorrect =
      trimmed.toUpperCase() === expected.toUpperCase() ||
      trimmed === expected;
    setResults((prev) => ({ ...prev, [k]: isCorrect }));
  };

  const handleReset = (idx: number) => {
    const k = exerciseKey(idx);
    setInputs((prev) => ({ ...prev, [k]: '' }));
    setResults((prev) => ({ ...prev, [k]: null }));
    setShowHints((prev) => ({ ...prev, [k]: false }));
  };

  // Check if all exercises in a topic are completed
  const isTopicCompleted = (topicKey: string): boolean => {
    const topic = topics[topicKey];
    return topic.exercises.every((_, idx) => results[`${topicKey}_${idx}`] === true);
  };

  // Count completed exercises across all topics
  const totalExercises = topicKeys.reduce((sum, k) => sum + topics[k].exercises.length, 0);
  const completedExercises = topicKeys.reduce(
    (sum, k) =>
      sum +
      topics[k].exercises.filter((_, idx) => results[`${k}_${idx}`] === true).length,
    0
  );

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-gray-950 dark:to-emerald-950/20">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
        <Code size={16} className="text-emerald-600 dark:text-emerald-400" />
        <h1 className="text-sm font-semibold text-slate-800 dark:text-gray-100">
          SQL Lab
        </h1>
        <span className="text-[11px] text-slate-400 dark:text-gray-500 ml-1">
          Interactive SQL Reference & Practice
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px] text-slate-500 dark:text-gray-500">
            {completedExercises}/{totalExercises} exercises
          </span>
          <div className="w-20 h-1.5 bg-slate-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 border-r border-slate-200 dark:border-gray-800 bg-white/40 dark:bg-gray-900/40 overflow-y-auto">
          <nav className="py-2">
            {topicKeys.map((key, index) => {
              const topic = topics[key];
              const isActive = activeTopic === key;
              const completed = isTopicCompleted(key);
              return (
                <button
                  key={key}
                  onClick={() => setActiveTopic(key)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors ${
                    isActive
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium'
                      : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <span className="text-[11px] text-slate-400 dark:text-gray-600 w-4 text-right shrink-0">
                    {index + 1}
                  </span>
                  <span className="shrink-0">{topic.icon}</span>
                  <span className="truncate flex-1">{topic.title}</span>
                  {completed && (
                    <Check size={12} className="text-emerald-500 shrink-0" />
                  )}
                  {isActive && !completed && (
                    <ChevronRight size={12} className="shrink-0 opacity-50" />
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Topic title */}
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 dark:text-emerald-400">
              {currentTopic.icon}
            </span>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-gray-100">
              {currentTopic.title}
            </h2>
            <span className="text-[11px] text-slate-400 dark:text-gray-600 ml-2">
              {topicKeys.indexOf(activeTopic) + 1} / {topicKeys.length}
            </span>
          </div>

          {/* Explanation */}
          <p className="text-[13px] leading-relaxed text-slate-600 dark:text-gray-400 max-w-2xl">
            {currentTopic.explanation}
          </p>

          {/* Code blocks */}
          {currentTopic.codeBlocks.map((block, blockIdx) => (
            <div key={blockIdx} className="max-w-2xl space-y-3">
              {/* Code block header + code */}
              <div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 rounded-t-lg border-b border-gray-700">
                  <Code size={12} className="text-gray-400" />
                  <span className="text-[11px] text-gray-400">{block.title}</span>
                </div>
                <div className="bg-gray-950 rounded-b-lg p-3 font-mono text-[12px] text-gray-200 leading-relaxed overflow-x-auto">
                  {block.lines.map((line, idx) => (
                    <div key={idx} className="min-h-[1.3em]">
                      {line === '' ? '\u00A0' : highlightSQL(line)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Result table for this code block */}
              {block.result && (
                <div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 dark:bg-gray-800 rounded-t-lg">
                    <ChevronRight size={12} className="text-slate-500 dark:text-gray-400" />
                    <span className="text-[11px] text-slate-500 dark:text-gray-400">
                      Result
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-gray-500 ml-auto">
                      {block.result.rows.length} row{block.result.rows.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="bg-slate-100 dark:bg-gray-800/60 rounded-b-lg p-3">
                    <ResultTableView table={block.result} />
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Exercises section */}
          <div className="max-w-2xl pt-2">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={14} className="text-amber-500" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                Exercises
              </h3>
              <span className="text-[11px] text-slate-400 dark:text-gray-600">
                {currentTopic.exercises.filter((_, i) => results[exerciseKey(i)] === true).length}
                /{currentTopic.exercises.length} completed
              </span>
            </div>

            <div className="space-y-4">
              {currentTopic.exercises.map((exercise, exIdx) => {
                const k = exerciseKey(exIdx);
                const currentInput = inputs[k] ?? '';
                const currentResult = results[k] ?? null;
                const hintVisible = showHints[k] ?? false;

                return (
                  <div
                    key={exIdx}
                    className={`border rounded-lg overflow-hidden transition-colors ${
                      currentResult === true
                        ? 'border-emerald-300 dark:border-emerald-700'
                        : 'border-slate-200 dark:border-gray-800'
                    } bg-white dark:bg-gray-900/60`}
                  >
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-gray-800/40 border-b border-slate-200 dark:border-gray-800">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                        {exIdx + 1}
                      </span>
                      <span className="text-[13px] text-slate-700 dark:text-gray-300 flex-1">
                        {exercise.question}
                      </span>
                      {currentResult === true && (
                        <Check size={14} className="text-emerald-500 shrink-0" />
                      )}
                    </div>

                    <div className="p-4 space-y-3">
                      {/* Exercise code with blank */}
                      <div className="bg-gray-950 rounded-lg p-3 font-mono text-[12px] text-gray-300 whitespace-pre-wrap">
                        {exercise.code.split('___').map((part, idx, arr) => (
                          <React.Fragment key={idx}>
                            {highlightSQL(part)}
                            {idx < arr.length - 1 && (
                              <span className="inline-block text-amber-400 border-b border-dashed border-amber-400/50">
                                {'___'}
                              </span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>

                      {/* Input + controls */}
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={currentInput}
                            onChange={(e) => {
                              setInputs((prev) => ({ ...prev, [k]: e.target.value }));
                              if (currentResult !== null) {
                                setResults((prev) => ({ ...prev, [k]: null }));
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && currentInput.trim()) {
                                handleCheck(exIdx, exercise.answer);
                              }
                            }}
                            placeholder="Type your answer..."
                            className={`w-full px-3 py-2 text-[13px] rounded-md border bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-200 placeholder-slate-400 dark:placeholder-gray-600 outline-none transition-colors font-mono ${
                              currentResult === true
                                ? 'border-emerald-400 dark:border-emerald-500'
                                : currentResult === false
                                ? 'border-red-400 dark:border-red-500'
                                : 'border-slate-300 dark:border-gray-700 focus:border-emerald-400 dark:focus:border-emerald-500'
                            }`}
                          />
                          {currentResult === true && (
                            <Check
                              size={14}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-500"
                            />
                          )}
                          {currentResult === false && (
                            <X
                              size={14}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-red-500"
                            />
                          )}
                        </div>

                        <button
                          onClick={() => handleCheck(exIdx, exercise.answer)}
                          disabled={!currentInput.trim()}
                          className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <Check size={12} />
                          Check
                        </button>

                        <button
                          onClick={() => handleReset(exIdx)}
                          className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium rounded-md border border-slate-300 dark:border-gray-700 text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <RotateCcw size={12} />
                          Reset
                        </button>
                      </div>

                      {/* Feedback */}
                      {currentResult === true && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                          <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                          <span className="text-[12px] text-emerald-700 dark:text-emerald-300">
                            Correct! Well done.
                          </span>
                        </div>
                      )}

                      {currentResult === false && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                            <X size={14} className="text-red-600 dark:text-red-400" />
                            <span className="text-[12px] text-red-700 dark:text-red-300">
                              Not quite. Try again or check the hint.
                            </span>
                          </div>
                          {!hintVisible && (
                            <button
                              onClick={() =>
                                setShowHints((prev) => ({ ...prev, [k]: true }))
                              }
                              className="text-[12px] text-emerald-600 dark:text-emerald-400 hover:underline"
                            >
                              Show hint
                            </button>
                          )}
                        </div>
                      )}

                      {hintVisible && (
                        <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                          <ChevronRight size={14} className="text-amber-500 mt-0.5 shrink-0" />
                          <span className="text-[12px] text-amber-700 dark:text-amber-300">
                            {exercise.hint}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="max-w-2xl flex items-center justify-between pt-4 pb-6">
            <button
              onClick={() => {
                const idx = topicKeys.indexOf(activeTopic);
                if (idx > 0) setActiveTopic(topicKeys[idx - 1]);
              }}
              disabled={topicKeys.indexOf(activeTopic) === 0}
              className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-medium rounded-md border border-slate-300 dark:border-gray-700 text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={12} className="rotate-180" />
              Previous
            </button>
            <span className="text-[11px] text-slate-400 dark:text-gray-600">
              {topicKeys.indexOf(activeTopic) + 1} of {topicKeys.length}
            </span>
            <button
              onClick={() => {
                const idx = topicKeys.indexOf(activeTopic);
                if (idx < topicKeys.length - 1) setActiveTopic(topicKeys[idx + 1]);
              }}
              disabled={topicKeys.indexOf(activeTopic) === topicKeys.length - 1}
              className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight size={12} />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};
