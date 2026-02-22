import React, { useState } from 'react';
import { BookOpen, Code, ChevronRight, Check, X, RotateCcw } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CodeFragment {
  text: string;
  type: 'keyword' | 'string' | 'comment' | 'number' | 'type' | 'plain' | 'preprocessor';
}

interface CodeExample {
  title: string;
  code: CodeFragment[][];
  output: string;
}

interface Exercise {
  prompt: string;
  blanks: { id: string; answer: string; hint: string }[];
}

interface Topic {
  id: string;
  title: string;
  explanation: string;
  examples: CodeExample[];
  exercises: Exercise[];
}

// ─── Syntax-colored line builder helpers ─────────────────────────────────────

const kw = (t: string): CodeFragment => ({ text: t, type: 'keyword' });
const str = (t: string): CodeFragment => ({ text: t, type: 'string' });
const cmt = (t: string): CodeFragment => ({ text: t, type: 'comment' });
const num = (t: string): CodeFragment => ({ text: t, type: 'number' });
const ty = (t: string): CodeFragment => ({ text: t, type: 'type' });
const pl = (t: string): CodeFragment => ({ text: t, type: 'plain' });
const pp = (t: string): CodeFragment => ({ text: t, type: 'preprocessor' });

// ─── Topic Data ──────────────────────────────────────────────────────────────

const TOPICS: Topic[] = [
  // ════════════════════════════════════════════════════════════════════════════
  // 1. INTRODUCTION
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: 'intro',
    title: 'Introduction',
    explanation:
      'C is a general-purpose, procedural programming language created by Dennis Ritchie at Bell Labs in 1972. It was designed to write the UNIX operating system and remains the backbone of systems programming. C compiles to native machine code via compilers like gcc or clang, giving it unmatched speed. It is used for operating systems (Linux kernel, Windows NT), embedded firmware, databases (SQLite, PostgreSQL), game engines, and device drivers. Every C program begins at the main() function, and the #include directive pulls in header files containing function declarations.',
    examples: [
      {
        title: 'Hello World',
        code: [
          [pp('#include'), pl(' '), str('<stdio.h>')],
          [],
          [cmt('// Every C program starts at main()')],
          [ty('int'), pl(' '), kw('main'), pl('('), ty('void'), pl(') {')],
          [pl('    '), kw('printf'), pl('('), str('"Hello, World!\\n"'), pl(');')],
          [pl('    '), kw('return'), pl(' '), num('0'), pl(';'), pl('  '), cmt('// 0 = success')],
          [pl('}')],
        ],
        output: 'Hello, World!',
      },
      {
        title: 'Compiling and Running',
        code: [
          [cmt('// Save as hello.c, then compile and run:')],
          [cmt('// $ gcc -o hello hello.c')],
          [cmt('// $ ./hello')],
          [],
          [cmt('// With warnings enabled (recommended):')],
          [cmt('// $ gcc -Wall -Wextra -std=c11 -o hello hello.c')],
          [],
          [pp('#include'), pl(' '), str('<stdio.h>')],
          [],
          [ty('int'), pl(' '), kw('main'), pl('('), ty('int'), pl(' argc, '), ty('char'), pl(' *argv[]) {')],
          [pl('    '), kw('printf'), pl('('), str('"Program name: %s\\n"'), pl(', argv['), num('0'), pl(']);')],
          [pl('    '), kw('printf'), pl('('), str('"Arguments: %d\\n"'), pl(', argc - '), num('1'), pl(');')],
          [pl('    '), kw('return'), pl(' '), num('0'), pl(';')],
          [pl('}')],
        ],
        output: 'Program name: ./hello\nArguments: 0',
      },
      {
        title: 'Multiple Headers',
        code: [
          [pp('#include'), pl(' '), str('<stdio.h>'), pl('   '), cmt('// printf, scanf')],
          [pp('#include'), pl(' '), str('<stdlib.h>'), pl('  '), cmt('// malloc, free, exit')],
          [pp('#include'), pl(' '), str('<string.h>'), pl('  '), cmt('// strlen, strcpy')],
          [pp('#include'), pl(' '), str('<math.h>'), pl('    '), cmt('// sqrt, pow, sin')],
          [],
          [ty('int'), pl(' '), kw('main'), pl('() {')],
          [pl('    '), ty('double'), pl(' result = '), kw('sqrt'), pl('('), num('144.0'), pl(');')],
          [pl('    '), kw('printf'), pl('('), str('"sqrt(144) = %.0f\\n"'), pl(', result);')],
          [pl('    '), kw('return'), pl(' '), num('0'), pl(';')],
          [pl('}')],
        ],
        output: 'sqrt(144) = 12',
      },
    ],
    exercises: [
      {
        prompt: 'What header file provides printf and scanf?',
        blanks: [
          { id: 'intro_1a', answer: 'stdio.h', hint: 'Standard I/O header' },
          { id: 'intro_1b', answer: 'main', hint: 'Entry-point function name' },
        ],
      },
      {
        prompt: 'What gcc flag enables all common warnings?',
        blanks: [
          { id: 'intro_2a', answer: '-Wall', hint: 'Enable all warnings flag' },
          { id: 'intro_2b', answer: '0', hint: 'Return value indicating success' },
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════════
  // 2. VARIABLES & TYPES
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: 'variables',
    title: 'Variables & Types',
    explanation:
      'C is statically typed: every variable must be declared with a type before use. Fundamental types include int (at least 16 bits), float (32-bit), double (64-bit), and char (1 byte). Modifiers like short, long, unsigned, and signed change storage size or sign behavior. The sizeof operator returns the byte size of a type or variable. Type casting converts between types explicitly with (type)value. Constants can be created with const or #define.',
    examples: [
      {
        title: 'Basic Types and sizeof',
        code: [
          [pp('#include'), pl(' '), str('<stdio.h>')],
          [],
          [ty('int'), pl(' '), kw('main'), pl('() {')],
          [pl('    '), ty('int'), pl(' age = '), num('25'), pl(';')],
          [pl('    '), ty('float'), pl(' gpa = '), num('3.85'), pl('f;'), pl('       '), cmt('// f suffix for float')],
          [pl('    '), ty('double'), pl(' pi = '), num('3.14159265358979'), pl(';')],
          [pl('    '), ty('char'), pl(' grade = '), str("'A'"), pl(';')],
          [pl('    '), ty('short'), pl(' small = '), num('32767'), pl(';')],
          [pl('    '), ty('long'), pl(' big = '), num('2147483647'), pl('L;')],
          [pl('    '), ty('unsigned int'), pl(' positive = '), num('42'), pl(';')],
          [],
          [pl('    '), kw('printf'), pl('('), str('"sizeof(int)    = %zu bytes\\n"'), pl(', '), kw('sizeof'), pl('('), ty('int'), pl('));')],
          [pl('    '), kw('printf'), pl('('), str('"sizeof(float)  = %zu bytes\\n"'), pl(', '), kw('sizeof'), pl('('), ty('float'), pl('));')],
          [pl('    '), kw('printf'), pl('('), str('"sizeof(double) = %zu bytes\\n"'), pl(', '), kw('sizeof'), pl('('), ty('double'), pl('));')],
          [pl('    '), kw('printf'), pl('('), str('"sizeof(char)   = %zu bytes\\n"'), pl(', '), kw('sizeof'), pl('('), ty('char'), pl('));')],
          [pl('    '), kw('return'), pl(' '), num('0'), pl(';')],
          [pl('}')],
        ],
        output: 'sizeof(int)    = 4 bytes\nsizeof(float)  = 4 bytes\nsizeof(double) = 8 bytes\nsizeof(char)   = 1 bytes',
      },
      {
        title: 'Type Casting and Constants',
        code: [
          [pp('#include'), pl(' '), str('<stdio.h>')],
          [],
          [pp('#define'), pl(' PI '), num('3.14159')],
          [pp('#define'), pl(' MAX_LEN '), num('255')],
          [],
          [ty('int'), pl(' '), kw('main'), pl('() {')],
          [pl('    '), kw('const'), pl(' '), ty('int'), pl(' DAYS_IN_WEEK = '), num('7'), pl(';')],
          [],
          [pl('    '), cmt('// Integer division vs float casting')],
          [pl('    '), ty('int'), pl(' a = '), num('7'), pl(', b = '), num('2'), pl(';')],
          [pl('    '), kw('printf'), pl('('), str('"7/2 (int)   = %d\\n"'), pl(', a / b);')],
          [pl('    '), kw('printf'), pl('('), str('"7/2 (float) = %.1f\\n"'), pl(', ('), ty('float'), pl(')a / b);')],
          [],
          [pl('    '), cmt('// Char is just a small integer')],
          [pl('    '), ty('char'), pl(' ch = '), str("'A'"), pl(';')],
          [pl('    '), kw('printf'), pl('('), str('"char %c = ASCII %d\\n"'), pl(', ch, ch);')],
          [pl('    '), kw('printf'), pl('('), str('"PI = %.5f\\n"'), pl(', PI);')],
          [pl('    '), kw('return'), pl(' '), num('0'), pl(';')],
          [pl('}')],
        ],
        output: '7/2 (int)   = 3\n7/2 (float) = 3.5\nchar A = ASCII 65\nPI = 3.14159',
      },
    ],
    exercises: [
      {
        prompt: 'What operator returns the byte size of a type?',
        blanks: [
          { id: 'var_1a', answer: 'sizeof', hint: 'Operator that measures type size' },
          { id: 'var_1b', answer: 'double', hint: '64-bit floating point type' },
        ],
      },
      {
        prompt: 'Cast integer x to float and declare a constant:',
        blanks: [
          { id: 'var_2a', answer: 'float', hint: 'Cast target type for decimal result' },
          { id: 'var_2b', answer: 'const', hint: 'Keyword to make a variable immutable' },
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════════
  // 3. OPERATORS
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: 'operators',
    title: 'Operators',
    explanation:
      'C provides arithmetic (+, -, *, /, %), comparison (==, !=, <, >, <=, >=), logical (&&, ||, !), bitwise (&, |, ^, ~, <<, >>), and assignment (=, +=, -=, *=, etc.) operators. The comma operator evaluates left-to-right and returns the rightmost value. Operator precedence determines evaluation order: unary > arithmetic > shift > relational > bitwise > logical > assignment. Parentheses override precedence.',
    examples: [
      {
        title: 'Arithmetic and Comparison',
        code: [
          [pp('#include'), pl(' '), str('<stdio.h>')],
          [],
          [ty('int'), pl(' '), kw('main'), pl('() {')],
          [pl('    '), ty('int'), pl(' a = '), num('17'), pl(', b = '), num('5'), pl(';')],
          [pl('    '), kw('printf'), pl('('), str('"a + b = %d\\n"'), pl(', a + b);'), pl('   '), cmt('// 22')],
          [pl('    '), kw('printf'), pl('('), str('"a - b = %d\\n"'), pl(', a - b);'), pl('   '), cmt('// 12')],
          [pl('    '), kw('printf'), pl('('), str('"a * b = %d\\n"'), pl(', a * b);'), pl('   '), cmt('// 85')],
          [pl('    '), kw('printf'), pl('('), str('"a / b = %d\\n"'), pl(', a / b);'), pl('   '), cmt('// 3')],
          [pl('    '), kw('printf'), pl('('), str('"a %% b = %d\\n"'), pl(', a % b);'), pl('  '), cmt('// 2 (modulus)')],
          [],
          [pl('    '), cmt('// Comparison returns 1 (true) or 0 (false)')],
          [pl('    '), kw('printf'), pl('('), str('"a == b: %d\\n"'), pl(', a == b);'), pl(' '), cmt('// 0')],
          [pl('    '), kw('printf'), pl('('), str('"a != b: %d\\n"'), pl(', a != b);'), pl(' '), cmt('// 1')],
          [pl('    '), kw('printf'), pl('('), str('"a > b:  %d\\n"'), pl(', a > b);'), pl('  '), cmt('// 1')],
          [pl('    '), kw('return'), pl(' '), num('0'), pl(';')],
          [pl('}')],
        ],
        output: 'a + b = 22\na - b = 12\na * b = 85\na / b = 3\na % b = 2\na == b: 0\na != b: 1\na > b:  1',
      },
      {
        title: 'Bitwise Operators',
        code: [
          [pp('#include'), pl(' '), str('<stdio.h>')],
          [],
          [ty('int'), pl(' '), kw('main'), pl('() {')],
          [pl('    '), ty('unsigned int'), pl(' a = '), num('0b1100'), pl(';'), pl(' '), cmt('// 12')],
          [pl('    '), ty('unsigned int'), pl(' b = '), num('0b1010'), pl(';'), pl(' '), cmt('// 10')],
          [],
          [pl('    '), kw('printf'), pl('('), str('"a & b  = %u\\n"'), pl(', a & b);'), pl('  '), cmt('// AND:  1000 = 8')],
          [pl('    '), kw('printf'), pl('('), str('"a | b  = %u\\n"'), pl(', a | b);'), pl('  '), cmt('// OR:   1110 = 14')],
          [pl('    '), kw('printf'), pl('('), str('"a ^ b  = %u\\n"'), pl(', a ^ b);'), pl('  '), cmt('// XOR:  0110 = 6')],
          [pl('    '), kw('printf'), pl('('), str('"~a     = %u\\n"'), pl(', ~a & '), num('0xF'), pl(');'), pl(' '), cmt('// NOT: 0011 = 3')],
          [pl('    '), kw('printf'), pl('('), str('"a << 2 = %u\\n"'), pl(', a << '), num('2'), pl(');'), pl(' '), cmt('// 48')],
          [pl('    '), kw('printf'), pl('('), str('"a >> 1 = %u\\n"'), pl(', a >> '), num('1'), pl(');'), pl(' '), cmt('// 6')],
          [],
          [pl('    '), cmt('// Common bit manipulation patterns')],
          [pl('    '), ty('unsigned int'), pl(' flags = '), num('0'), pl(';')],
          [pl('    flags |= ('), num('1'), pl(' << '), num('3'), pl(');'), pl('   '), cmt('// set bit 3')],
          [pl('    flags &= ~('), num('1'), pl(' << '), num('3'), pl(');'), pl('  '), cmt('// clear bit 3')],
          [pl('    flags ^= ('), num('1'), pl(' << '), num('2'), pl(');'), pl('   '), cmt('// toggle bit 2')],
          [pl('    '), kw('return'), pl(' '), num('0'), pl(';')],
          [pl('}')],
        ],
        output: 'a & b  = 8\na | b  = 14\na ^ b  = 6\n~a     = 3\na << 2 = 48\na >> 1 = 6',
      },
      {
        title: 'Logical and Comma Operator',
        code: [
          [pp('#include'), pl(' '), str('<stdio.h>')],
          [],
          [ty('int'), pl(' '), kw('main'), pl('() {')],
          [pl('    '), ty('int'), pl(' x = '), num('5'), pl(', y = '), num('0'), pl(';')],
          [],
          [pl('    '), cmt('// Logical AND, OR, NOT')],
          [pl('    '), kw('printf'), pl('('), str('"x && y = %d\\n"'), pl(', x && y);'), pl('  '), cmt('// 0 (short-circuit)')],
          [pl('    '), kw('printf'), pl('('), str('"x || y = %d\\n"'), pl(', x || y);'), pl('  '), cmt('// 1')],
          [pl('    '), kw('printf'), pl('('), str('"!x     = %d\\n"'), pl(', !x);'), pl('     '), cmt('// 0')],
          [],
          [pl('    '), cmt('// Ternary operator')],
          [pl('    '), ty('int'), pl(' max = (x > y) ? x : y;')],
          [pl('    '), kw('printf'), pl('('), str('"max = %d\\n"'), pl(', max);')],
          [],
          [pl('    '), cmt('// Comma operator: evaluates both, returns last')],
          [pl('    '), ty('int'), pl(' z = (x++, x + '), num('10'), pl(');')],
          [pl('    '), kw('printf'), pl('('), str('"z = %d\\n"'), pl(', z);'), pl(' '), cmt('// 16')],
          [pl('    '), kw('return'), pl(' '), num('0'), pl(';')],
          [pl('}')],
        ],
        output: 'x && y = 0\nx || y = 1\n!x     = 0\nmax = 5\nz = 16',
      },
    ],
    exercises: [
      {
        prompt: 'What is 17 % 5 and what operator does XOR?',
        blanks: [
          { id: 'op_1a', answer: '2', hint: '17 modulo 5' },
          { id: 'op_1b', answer: '^', hint: 'Bitwise XOR symbol' },
        ],
      },
      {
        prompt: 'How to set bit n in flags, and what does && do?',
        blanks: [
          { id: 'op_2a', answer: '|=', hint: 'Operator to set bits (OR assign)' },
          { id: 'op_2b', answer: 'logical and', hint: 'What && performs (two words)' },
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════════
  // 4. I/O
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: 'io',
    title: 'I/O',
    explanation:
      'C standard I/O uses format specifiers to convert data types: %d (int), %f (float/double), %c (char), %s (string), %x (hex), %p (pointer), %u (unsigned), %ld (long), %zu (size_t). printf writes to stdout, fprintf writes to any FILE stream. scanf reads formatted input; always pass addresses with &. getchar/putchar handle single characters. sprintf writes to a string buffer instead of the console.',
    examples: [
      {
        title: 'printf Format Specifiers',
        code: [
          [pp('#include'), pl(' '), str('<stdio.h>')],
          [],
          [ty('int'), pl(' '), kw('main'), pl('() {')],
          [pl('    '), ty('int'), pl(' num = '), num('255'), pl(';')],
          [pl('    '), ty('float'), pl(' f = '), num('3.14159'), pl('f;')],
          [pl('    '), ty('char'), pl(' ch = '), str("'Z'"), pl(';')],
          [pl('    '), ty('char'), pl(' name[] = '), str('"Alice"'), pl(';')],
          [],
          [pl('    '), kw('printf'), pl('('), str('"Decimal:  %d\\n"'), pl(', num);')],
          [pl('    '), kw('printf'), pl('('), str('"Hex:      %x\\n"'), pl(', num);')],
          [pl('    '), kw('printf'), pl('('), str('"Hex(0x):  %#x\\n"'), pl(', num);')],
          [pl('    '), kw('printf'), pl('('), str('"Float:    %f\\n"'), pl(', f);')],
          [pl('    '), kw('printf'), pl('('), str('"Precise:  %.2f\\n"'), pl(', f);')],
          [pl('    '), kw('printf'), pl('('), str('"Char:     %c\\n"'), pl(', ch);')],
          [pl('    '), kw('printf'), pl('('), str('"String:   %s\\n"'), pl(', name);')],
          [pl('    '), kw('printf'), pl('('), str('"Pointer:  %p\\n"'), pl(', ('), ty('void'), pl('*)&num);')],
          [pl('    '), kw('printf'), pl('('), str('"Padded:   [%10d]\\n"'), pl(', num);')],
          [pl('    '), kw('printf'), pl('('), str('"Left:     [%-10d]\\n"'), pl(', num);')],
          [pl('    '), kw('return'), pl(' '), num('0'), pl(';')],
          [pl('}')],
        ],
        output: 'Decimal:  255\nHex:      ff\nHex(0x):  0xff\nFloat:    3.141590\nPrecise:  3.14\nChar:     Z\nString:   Alice\nPointer:  0x7ffd...\nPadded:   [       255]\nLeft:     [255       ]',
      },
      {
        title: 'scanf and getchar',
        code: [
          [pp('#include'), pl(' '), str('<stdio.h>')],
          [],
          [ty('int'), pl(' '), kw('main'), pl('() {')],
          [pl('    '), ty('int'), pl(' age;')],
          [pl('    '), ty('char'), pl(' name['), num('50'), pl('];')],
          [],
          [pl('    '), kw('printf'), pl('('), str('"Enter your name: "'), pl(');')],
          [pl('    '), kw('scanf'), pl('('), str('"%49s"'), pl(', name);'), pl('  '), cmt('// no & for arrays')],
          [],
          [pl('    '), kw('printf'), pl('('), str('"Enter your age: "'), pl(');')],
          [pl('    '), kw('scanf'), pl('('), str('"%d"'), pl(', &age);'), pl('   '), cmt('// & required for int')],
          [],
          [pl('    '), kw('printf'), pl('('), str('"Hello %s, age %d\\n"'), pl(', name, age);')],
          [],
          [pl('    '), cmt('// getchar reads one character at a time')],
          [pl('    '), ty('int'), pl(' c;')],
          [pl('    '), kw('while'), pl(' ((c = '), kw('getchar'), pl('()) != '), str("'\\n'"), pl(' && c != EOF)')],
          [pl('        '), kw('putchar'), pl('(c);')],
          [pl('    '), kw('return'), pl(' '), num('0'), pl(';')],
          [pl('}')],
        ],
        output: 'Enter your name: Bob\nEnter your age: 30\nHello Bob, age 30',
      },
      {
        title: 'sprintf and fprintf',
        code: [
          [pp('#include'), pl(' '), str('<stdio.h>')],
          [],
          [ty('int'), pl(' '), kw('main'), pl('() {')],
          [pl('    '), cmt('// sprintf: print to a string buffer')],
          [pl('    '), ty('char'), pl(' buffer['), num('100'), pl('];')],
          [pl('    '), ty('int'), pl(' score = '), num('95'), pl(';')],
          [pl('    '), kw('sprintf'), pl('(buffer, '), str('"Score: %d/100"'), pl(', score);')],
          [pl('    '), kw('printf'), pl('('), str('"Buffer: %s\\n"'), pl(', buffer);')],
          [],
          [pl('    '), cmt('// fprintf: print to stderr')],
          [pl('    '), kw('fprintf'), pl('('), kw('stderr'), pl(', '), str('"Warning: low memory\\n"'), pl(');')],
          [],
          [pl('    '), cmt('// snprintf: safe version with length limit')],
          [pl('    '), ty('char'), pl(' small['), num('10'), pl('];')],
          [pl('    '), kw('snprintf'), pl('(small, '), kw('sizeof'), pl('(small), '), str('"Hello %s!"'), pl(', '), str('"World"'), pl(');')],
          [pl('    '), kw('printf'), pl('('), str('"%s\\n"'), pl(', small);'), pl(' '), cmt('// truncated to 9 chars + null')],
          [pl('    '), kw('return'), pl(' '), num('0'), pl(';')],
          [pl('}')],
        ],
        output: 'Buffer: Score: 95/100\nWarning: low memory\nHello Wor',
      },
    ],
    exercises: [
      {
        prompt: 'What format specifier prints a hexadecimal integer?',
        blanks: [
          { id: 'io_1a', answer: '%x', hint: 'Hex format specifier' },
          { id: 'io_1b', answer: '%p', hint: 'Format specifier for pointer address' },
        ],
      },
      {
        prompt: 'What function writes formatted output to a string buffer?',
        blanks: [
          { id: 'io_2a', answer: 'sprintf', hint: 'String printf' },
          { id: 'io_2b', answer: '&', hint: 'Symbol needed before int variable in scanf' },
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════════
  // 5. CONTROL FLOW
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: 'control',
    title: 'Control Flow',
    explanation:
      'C supports if/else, switch/case with break/default, for loops, while loops, do-while (runs at least once), break (exit loop), continue (skip to next iteration), and goto (unconditional jump, strongly discouraged). In C89 there is no bool type; zero is false, any non-zero value is true. Nested loops allow multi-dimensional iteration. The switch statement compares an integer expression against constant case labels, falling through without break.',
    examples: [
      {
        title: 'if/else and switch',
        code: [
          [pp('#include'), pl(' '), str('<stdio.h>')],
          [],
          [ty('int'), pl(' '), kw('main'), pl('() {')],
          [pl('    '), ty('int'), pl(' score = '), num('85'), pl(';')],
          [],
          [pl('    '), cmt('// if/else chain')],
          [pl('    '), kw('if'), pl(' (score >= '), num('90'), pl(') {')],
          [pl('        '), kw('printf'), pl('('), str('"Grade: A\\n"'), pl(');')],
          [pl('    } '), kw('else if'), pl(' (score >= '), num('80'), pl(') {')],
          [pl('        '), kw('printf'), pl('('), str('"Grade: B\\n"'), pl(');')],
          [pl('    } '), kw('else if'), pl(' (score >= '), num('70'), pl(') {')],
          [pl('        '), kw('printf'), pl('('), str('"Grade: C\\n"'), pl(');')],
          [pl('    } '), kw('else'), pl(' {')],
          [pl('        '), kw('printf'), pl('('), str('"Grade: F\\n"'), pl(');')],
          [pl('    }')],
          [],
          [pl('    '), cmt('// switch/case')],
          [pl('    '), ty('int'), pl(' day = '), num('3'), pl(';')],
          [pl('    '), kw('switch'), pl(' (day) {')],
          [pl('        '), kw('case'), pl(' '), num('1'), pl(': '), kw('printf'), pl('('), str('"Monday\\n"'), pl('); '), kw('break'), pl(';')],
          [pl('        '), kw('case'), pl(' '), num('2'), pl(': '), kw('printf'), pl('('), str('"Tuesday\\n"'), pl('); '), kw('break'), pl(';')],
          [pl('        '), kw('case'), pl(' '), num('3'), pl(': '), kw('printf'), pl('('), str('"Wednesday\\n"'), pl('); '), kw('break'), pl(';')],
          [pl('        '), kw('default'), pl(': '), kw('printf'), pl('('), str('"Other\\n"'), pl('); '), kw('break'), pl(';')],
          [pl('    }')],
          [pl('    '), kw('return'), pl(' '), num('0'), pl(';')],
          [pl('}')],
        ],
        output: 'Grade: B\nWednesday',
      },
      {
        title: 'Loops: for, while, do-while',
        code: [
          [pp('#include'), pl(' '), str('<stdio.h>')],
          [],
          [ty('int'), pl(' '), kw('main'), pl('() {')],
          [pl('    '), cmt('// for loop')],
          [pl('    '), kw('for'), pl(' ('), ty('int'), pl(' i = '), num('0'), pl('; i < '), num('5'), pl('; i++) {')],
          [pl('        '), kw('printf'), pl('('), str('"%d "'), pl(', i);')],
          [pl('    }')],
          [pl('    '), kw('printf'), pl('('), str('"\\n"'), pl(');')],
          [],
          [pl('    '), cmt('// while loop')],
          [pl('    '), ty('int'), pl(' n = '), num('1'), pl(';')],
          [pl('    '), kw('while'), pl(' (n <= '), num('16'), pl(') {')],
          [pl('        '), kw('printf'), pl('('), str('"%d "'), pl(', n);')],
          [pl('        n *= '), num('2'), pl(';')],
          [pl('    }')],
          [pl('    '), kw('printf'), pl('('), str('"\\n"'), pl(');')],
          [],
          [pl('    '), cmt('// do-while: always runs at least once')],
          [pl('    '), ty('int'), pl(' x = '), num('0'), pl(';')],
          [pl('    '), kw('do'), pl(' {')],
          [pl('        '), kw('printf'), pl('('), str('"x = %d\\n"'), pl(', x);')],
          [pl('        x++;')],
          [pl('    } '), kw('while'), pl(' (x < '), num('3'), pl(');')],
          [pl('    '), kw('return'), pl(' '), num('0'), pl(';')],
          [pl('}')],
        ],
        output: '0 1 2 3 4\n1 2 4 8 16\nx = 0\nx = 1\nx = 2',
      },
      {
        title: 'break, continue, nested loops',
        code: [
          [pp('#include'), pl(' '), str('<stdio.h>')],
          [],
          [ty('int'), pl(' '), kw('main'), pl('() {')],
          [pl('    '), cmt('// break exits the loop')],
          [pl('    '), kw('for'), pl(' ('), ty('int'), pl(' i = '), num('0'), pl('; i < '), num('100'), pl('; i++) {')],
          [pl('        '), kw('if'), pl(' (i == '), num('5'), pl(') '), kw('break'), pl(';')],
          [pl('        '), kw('printf'), pl('('), str('"%d "'), pl(', i);')],
          [pl('    }')],
          [pl('    '), kw('printf'), pl('('), str('"\\n"'), pl(');')],
          [],
          [pl('    '), cmt('// continue skips to next iteration')],
          [pl('    '), kw('for'), pl(' ('), ty('int'), pl(' i = '), num('0'), pl('; i < '), num('8'), pl('; i++) {')],
          [pl('        '), kw('if'), pl(' (i % '), num('2'), pl(' == '), num('0'), pl(') '), kw('continue'), pl(';')],
          [pl('        '), kw('printf'), pl('('), str('"%d "'), pl(', i);'), pl(' '), cmt('// only odd numbers')],
          [pl('    }')],
          [pl('    '), kw('printf'), pl('('), str('"\\n"'), pl(');')],
          [],
          [pl('    '), cmt('// Nested loop: multiplication table')],
          [pl('    '), kw('for'), pl(' ('), ty('int'), pl(' r = '), num('1'), pl('; r <= '), num('3'), pl('; r++) {')],
          [pl('        '), kw('for'), pl(' ('), ty('int'), pl(' c = '), num('1'), pl('; c <= '), num('3'), pl('; c++)')],
          [pl('            '), kw('printf'), pl('('), str('"%2d "'), pl(', r * c);')],
          [pl('        '), kw('printf'), pl('('), str('"\\n"'), pl(');')],
          [pl('    }')],
          [pl('    '), kw('return'), pl(' '), num('0'), pl(';')],
          [pl('}')],
        ],
        output: '0 1 2 3 4\n1 3 5 7\n 1  2  3\n 2  4  6\n 3  6  9',
      },
    ],
    exercises: [
      {
        prompt: 'What keyword exits a loop, and what runs a block at least once?',
        blanks: [
          { id: 'ctrl_1a', answer: 'break', hint: 'Keyword to exit a loop early' },
          { id: 'ctrl_1b', answer: 'do-while', hint: 'Loop that always executes once (with hyphen)' },
        ],
      },
      {
        prompt: 'What keyword skips to the next loop iteration, and what ends a switch case?',
        blanks: [
          { id: 'ctrl_2a', answer: 'continue', hint: 'Skip rest of current iteration' },
          { id: 'ctrl_2b', answer: 'break', hint: 'Prevents fall through in switch' },
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════════
  // 6. ARRAYS & STRINGS
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: 'arrays',
    title: 'Arrays & Strings',
    explanation:
      'Arrays in C are fixed-size, contiguous blocks of the same type, declared as type name[size]. Indices start at 0. Multi-dimensional arrays use type name[rows][cols]. Strings are char arrays terminated by a null character (\'\\0\'). The string.h header provides strlen (length), strcpy (copy), strcmp (compare, returns 0 if equal), strcat (concatenate), strstr (find substring), and more. Always ensure buffers are large enough to hold the string plus the null terminator.',
    examples: [
      {
        title: 'Arrays and Multi-dimensional',
        code: [
          [pp('#include'), pl(' '), str('<stdio.h>')],
          [],
          [ty('int'), pl(' '), kw('main'), pl('() {')],
          [pl('    '), cmt('// 1D array')],
          [pl('    '), ty('int'), pl(' nums['), num('5'), pl('] = {'), num('10'), pl(', '), num('20'), pl(', '), num('30'), pl(', '), num('40'), pl(', '), num('50'), pl('};')],
          [pl('    '), kw('for'), pl(' ('), ty('int'), pl(' i = '), num('0'), pl('; i < '), num('5'), pl('; i++)')],
          [pl('        '), kw('printf'), pl('('), str('"%d "'), pl(', nums[i]);')],
          [pl('    '), kw('printf'), pl('('), str('"\\n"'), pl(');')],
          [],
          [pl('    '), cmt('// 2D array (matrix)')],
          [pl('    '), ty('int'), pl(' matrix['), num('2'), pl(']['), num('3'), pl('] = {')],
          [pl('        {'), num('1'), pl(', '), num('2'), pl(', '), num('3'), pl('},')],
          [pl('        {'), num('4'), pl(', '), num('5'), pl(', '), num('6'), pl('}')],
          [pl('    };')],
          [],
          [pl('    '), kw('for'), pl(' ('), ty('int'), pl(' r = '), num('0'), pl('; r < '), num('2'), pl('; r++) {')],
          [pl('        '), kw('for'), pl(' ('), ty('int'), pl(' c = '), num('0'), pl('; c < '), num('3'), pl('; c++)')],
          [pl('            '), kw('printf'), pl('('), str('"%d "'), pl(', matrix[r][c]);')],
          [pl('        '), kw('printf'), pl('('), str('"\\n"'), pl(');')],
          [pl('    }')],
          [pl('    '), kw('return'), pl(' '), num('0'), pl(';')],
          [pl('}')],
        ],
        output: '10 20 30 40 50\n1 2 3\n4 5 6',
      },
      {
        title: 'String Functions',
        code: [
          [pp('#include'), pl(' '), str('<stdio.h>')],
          [pp('#include'), pl(' '), str('<string.h>')],
          [],
          [ty('int'), pl(' '), kw('main'), pl('() {')],
          [pl('    '), ty('char'), pl(' greeting[] = '), str('"Hello"'), pl(';')],
          [pl('    '), ty('char'), pl(' name[] = '), str('"World"'), pl(';')],
          [pl('    '), ty('char'), pl(' buffer['), num('50'), pl('];')],
          [],
          [pl('    '), cmt('// strlen: get string length (excludes \\0)')],
          [pl('    '), kw('printf'), pl('('), str('"Length: %zu\\n"'), pl(', '), kw('strlen'), pl('(greeting));')],
          [],
          [pl('    '), cmt('// strcpy: copy string')],
          [pl('    '), kw('strcpy'), pl('(buffer, greeting);')],
          [pl('    '), kw('printf'), pl('('), str('"Copied: %s\\n"'), pl(', buffer);')],
          [],
          [pl('    '), cmt('// strcat: concatenate')],
          [pl('    '), kw('strcat'), pl('(buffer, '), str('", "'), pl(');')],
          [pl('    '), kw('strcat'), pl('(buffer, name);')],
          [pl('    '), kw('printf'), pl('('), str('"Concat: %s\\n"'), pl(', buffer);')],
          [],
          [pl('    '), cmt('// strcmp: compare (0 = equal)')],
          [pl('    '), kw('printf'), pl('('), str('"Compare: %d\\n"'), pl(', '), kw('strcmp'), pl('(greeting, '), str('"Hello"'), pl('));')],
          [pl('    '), kw('return'), pl(' '), num('0'), pl(';')],
          [pl('}')],
        ],
        output: 'Length: 5\nCopied: Hello\nConcat: Hello, World\nCompare: 0',
      },
      {
        title: 'String as char array',
        code: [
          [pp('#include'), pl(' '), str('<stdio.h>')],
          [],
          [ty('int'), pl(' '), kw('main'), pl('() {')],
          [pl('    '), cmt('// Strings are null-terminated char arrays')],
          [pl('    '), ty('char'), pl(' s[] = '), str('"ABCDE"'), pl(';')],
          [],
          [pl('    '), cmt('// Iterate character by character')],
          [pl('    '), kw('for'), pl(' ('), ty('int'), pl(' i = '), num('0'), pl('; s[i] != '), str("'\\0'"), pl('; i++)')],
          [pl('        '), kw('printf'), pl('('), str('"s[%d] = %c (ASCII %d)\\n"'), pl(', i, s[i], s[i]);')],
          [],
          [pl('    '), cmt('// Reverse a string in-place')],
          [pl('    '), ty('int'), pl(' len = '), num('0'), pl(';')],
          [pl('    '), kw('while'), pl(' (s[len]) len++;')],
          [pl('    '), kw('for'), pl(' ('), ty('int'), pl(' i = '), num('0'), pl('; i < len / '), num('2'), pl('; i++) {')],
          [pl('        '), ty('char'), pl(' tmp = s[i];')],
          [pl('        s[i] = s[len - '), num('1'), pl(' - i];')],
          [pl('        s[len - '), num('1'), pl(' - i] = tmp;')],
          [pl('    }')],
          [pl('    '), kw('printf'), pl('('), str('"Reversed: %s\\n"'), pl(', s);')],
          [pl('    '), kw('return'), pl(' '), num('0'), pl(';')],
          [pl('}')],
        ],
        output: 's[0] = A (ASCII 65)\ns[1] = B (ASCII 66)\ns[2] = C (ASCII 67)\ns[3] = D (ASCII 68)\ns[4] = E (ASCII 69)\nReversed: EDCBA',
      },
    ],
    exercises: [
      {
        prompt: 'What function returns the length of a string?',
        blanks: [
          { id: 'arr_1a', answer: 'strlen', hint: 'String length function from string.h' },
          { id: 'arr_1b', answer: '\\0', hint: 'Character that terminates a C string' },
        ],
      },
      {
        prompt: 'What function compares two strings, and what does it return if equal?',
        blanks: [
          { id: 'arr_2a', answer: 'strcmp', hint: 'String compare function' },
          { id: 'arr_2b', answer: '0', hint: 'Return value when strings are equal' },
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════════
  // 7. FUNCTIONS
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: 'functions',
    title: 'Functions',
    explanation:
      'Functions in C must declare a return type and parameter types. A function prototype (forward declaration) tells the compiler about a function before its definition. Parameters are passed by value (copies), so the original variable is unchanged. To modify the original, pass a pointer. Static functions are visible only within their translation unit. Recursive functions call themselves and need a base case. Header files (.h) contain prototypes; source files (.c) contain definitions.',
    examples: [
      {
        title: 'Prototypes and Pass by Value',
        code: [
          [pp('#include'), pl(' '), str('<stdio.h>')],
          [],
          [cmt('// Function prototype (forward declaration)')],
          [ty('int'), pl(' add('), ty('int'), pl(' a, '), ty('int'), pl(' b);')],
          [ty('void'), pl(' double_it('), ty('int'), pl(' x);')],
          [],
          [ty('int'), pl(' add('), ty('int'), pl(' a, '), ty('int'), pl(' b) {')],
          [pl('    '), kw('return'), pl(' a + b;')],
          [pl('}')],
          [],
          [ty('void'), pl(' double_it('), ty('int'), pl(' x) {')],
          [pl('    x = x * '), num('2'), pl(';'), pl('  '), cmt('// modifies LOCAL copy only!')],
          [pl('    '), kw('printf'), pl('('), str('"Inside: %d\\n"'), pl(', x);')],
          [pl('}')],
          [],
          [ty('int'), pl(' '), kw('main'), pl('() {')],
          [pl('    '), kw('printf'), pl('('), str('"3 + 4 = %d\\n"'), pl(', add('), num('3'), pl(', '), num('4'), pl('));')],
          [],
          [pl('    '), ty('int'), pl(' val = '), num('10'), pl(';')],
          [pl('    double_it(val);')],
          [pl('    '), kw('printf'), pl('('), str('"Outside: %d\\n"'), pl(', val);'), pl(' '), cmt('// still 10!')],
          [pl('    '), kw('return'), pl(' '), num('0'), pl(';')],
          [pl('}')],
        ],
        output: '3 + 4 = 7\nInside: 20\nOutside: 10',
      },
      {
        title: 'Recursion',
        code: [
          [pp('#include'), pl(' '), str('<stdio.h>')],
          [],
          [cmt('// Factorial: n! = n * (n-1)!')],
          [ty('long'), pl(' factorial('), ty('int'), pl(' n) {')],
          [pl('    '), kw('if'), pl(' (n <= '), num('1'), pl(') '), kw('return'), pl(' '), num('1'), pl(';'), pl('  '), cmt('// base case')],
          [pl('    '), kw('return'), pl(' n * factorial(n - '), num('1'), pl(');')],
          [pl('}')],
          [],
          [cmt('// Fibonacci')],
          [ty('int'), pl(' fib('), ty('int'), pl(' n) {')],
          [pl('    '), kw('if'), pl(' (n <= '), num('1'), pl(') '), kw('return'), pl(' n;')],
          [pl('    '), kw('return'), pl(' fib(n - '), num('1'), pl(') + fib(n - '), num('2'), pl(');')],
          [pl('}')],
          [],
          [ty('int'), pl(' '), kw('main'), pl('() {')],
          [pl('    '), kw('printf'), pl('('), str('"5! = %ld\\n"'), pl(', factorial('), num('5'), pl('));')],
          [pl('    '), kw('printf'), pl('('), str('"10! = %ld\\n"'), pl(', factorial('), num('10'), pl('));')],
          [pl('    '), kw('printf'), pl('('), str('"fib(10) = %d\\n"'), pl(', fib('), num('10'), pl('));')],
          [pl('    '), kw('return'), pl(' '), num('0'), pl(';')],
          [pl('}')],
        ],
        output: '5! = 120\n10! = 3628800\nfib(10) = 55',
      },
      {
        title: 'Static Functions and Scope',
        code: [
          [pp('#include'), pl(' '), str('<stdio.h>')],
          [],
          [cmt('// static function: only visible in this file')],
          [kw('static'), pl(' '), ty('int'), pl(' helper('), ty('int'), pl(' x) {')],
          [pl('    '), kw('return'), pl(' x * x;')],
          [pl('}')],
          [],
          [cmt('// static local variable: persists across calls')],
          [ty('int'), pl(' counter() {')],
          [pl('    '), kw('static'), pl(' '), ty('int'), pl(' count = '), num('0'), pl(';'), pl(' '), cmt('// initialized once')],
          [pl('    count++;')],
          [pl('    '), kw('return'), pl(' count;')],
          [pl('}')],
          [],
          [ty('int'), pl(' '), kw('main'), pl('() {')],
          [pl('    '), kw('printf'), pl('('), str('"helper(5) = %d\\n"'), pl(', helper('), num('5'), pl('));')],
          [pl('    '), kw('printf'), pl('('), str('"call 1: %d\\n"'), pl(', counter());')],
          [pl('    '), kw('printf'), pl('('), str('"call 2: %d\\n"'), pl(', counter());')],
          [pl('    '), kw('printf'), pl('('), str('"call 3: %d\\n"'), pl(', counter());')],
          [pl('    '), kw('return'), pl(' '), num('0'), pl(';')],
          [pl('}')],
        ],
        output: 'helper(5) = 25\ncall 1: 1\ncall 2: 2\ncall 3: 3',
      },
    ],
    exercises: [
      {
        prompt: 'What keyword makes a function visible only in its file?',
        blanks: [
          { id: 'fn_1a', answer: 'static', hint: 'Limits visibility to current translation unit' },
          { id: 'fn_1b', answer: 'void', hint: 'Return type meaning "nothing returned"' },
        ],
      },
      {
        prompt: 'Recursion needs a _____ case. C parameters are passed by _____.',
        blanks: [
          { id: 'fn_2a', answer: 'base', hint: 'Termination condition for recursion' },
          { id: 'fn_2b', answer: 'value', hint: 'Default parameter passing mechanism in C' },
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════════
  // 8. POINTERS
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: 'pointers',
    title: 'Pointers',
    explanation:
      'A pointer stores the memory address of another variable. Declare with type *name, get an address with &, and dereference with *. Pointer arithmetic moves by the size of the pointed type (int *p; p+1 advances 4 bytes). Arrays decay to pointers when passed to functions. A pointer to a pointer (int **pp) stores the address of a pointer variable. NULL represents an invalid address. Void pointers (void *) can hold any address but must be cast before dereferencing. Function pointers store addresses of functions, enabling callbacks and dispatch tables.',
    examples: [
      {
        title: 'Basics and Pointer Arithmetic',
        code: [
          [pp('#include'), pl(' '), str('<stdio.h>')],
          [],
          [ty('int'), pl(' '), kw('main'), pl('() {')],
          [pl('    '), ty('int'), pl(' val = '), num('42'), pl(';')],
          [pl('    '), ty('int'), pl(' *ptr = &val;'), pl('  '), cmt('// ptr holds address of val')],
          [],
          [pl('    '), kw('printf'), pl('('), str('"val   = %d\\n"'), pl(', val);')],
          [pl('    '), kw('printf'), pl('('), str('"*ptr  = %d\\n"'), pl(', *ptr);'), pl('  '), cmt('// dereference')],
          [pl('    '), kw('printf'), pl('('), str('"&val  = %p\\n"'), pl(', ('), ty('void'), pl('*)&val);')],
          [pl('    '), kw('printf'), pl('('), str('"ptr   = %p\\n"'), pl(', ('), ty('void'), pl('*)ptr);')],
          [],
          [pl('    *ptr = '), num('100'), pl(';'), pl('  '), cmt('// modify through pointer')],
          [pl('    '), kw('printf'), pl('('), str('"val now = %d\\n"'), pl(', val);')],
          [],
          [pl('    '), cmt('// Pointer arithmetic with arrays')],
          [pl('    '), ty('int'), pl(' arr[] = {'), num('10'), pl(', '), num('20'), pl(', '), num('30'), pl(', '), num('40'), pl('};')],
          [pl('    '), ty('int'), pl(' *p = arr;')],
          [pl('    '), kw('printf'), pl('('), str('"*(p+0) = %d\\n"'), pl(', *(p + '), num('0'), pl('));')],
          [pl('    '), kw('printf'), pl('('), str('"*(p+2) = %d\\n"'), pl(', *(p + '), num('2'), pl('));')],
          [pl('    '), kw('return'), pl(' '), num('0'), pl(';')],
          [pl('}')],
        ],
        output: 'val   = 42\n*ptr  = 42\n&val  = 0x7ffd...\nptr   = 0x7ffd...\nval now = 100\n*(p+0) = 10\n*(p+2) = 30',
      },
      {
        title: 'Pointer to Pointer and NULL',
        code: [
          [pp('#include'), pl(' '), str('<stdio.h>')],
          [pp('#include'), pl(' '), str('<stdlib.h>')],
          [],
          [ty('int'), pl(' '), kw('main'), pl('() {')],
          [pl('    '), ty('int'), pl(' x = '), num('99'), pl(';')],
          [pl('    '), ty('int'), pl(' *p = &x;')],
          [pl('    '), ty('int'), pl(' **pp = &p;'), pl('  '), cmt('// pointer to pointer')],
          [],
          [pl('    '), kw('printf'), pl('('), str('"x       = %d\\n"'), pl(', x);')],
          [pl('    '), kw('printf'), pl('('), str('"*p      = %d\\n"'), pl(', *p);')],
          [pl('    '), kw('printf'), pl('('), str('"**pp    = %d\\n"'), pl(', **pp);')],
          [],
          [pl('    '), cmt('// NULL pointer check')],
          [pl('    '), ty('int'), pl(' *safe = '), kw('NULL'), pl(';')],
          [pl('    '), kw('if'), pl(' (safe != '), kw('NULL'), pl(') {')],
          [pl('        '), kw('printf'), pl('('), str('"%d\\n"'), pl(', *safe);')],
          [pl('    } '), kw('else'), pl(' {')],
          [pl('        '), kw('printf'), pl('('), str('"Pointer is NULL\\n"'), pl(');')],
          [pl('    }')],
          [],
          [pl('    '), cmt('// void pointer: generic, must cast before use')],
          [pl('    '), ty('void'), pl(' *generic = &x;')],
          [pl('    '), kw('printf'), pl('('), str('"via void*: %d\\n"'), pl(', *('), ty('int'), pl(' *)generic);')],
          [pl('    '), kw('return'), pl(' '), num('0'), pl(';')],
          [pl('}')],
        ],
        output: 'x       = 99\n*p      = 99\n**pp    = 99\nPointer is NULL\nvia void*: 99',
      },
      {
        title: 'Function Pointers',
        code: [
          [pp('#include'), pl(' '), str('<stdio.h>')],
          [],
          [ty('int'), pl(' add('), ty('int'), pl(' a, '), ty('int'), pl(' b) { '), kw('return'), pl(' a + b; }')],
          [ty('int'), pl(' sub('), ty('int'), pl(' a, '), ty('int'), pl(' b) { '), kw('return'), pl(' a - b; }')],
          [ty('int'), pl(' mul('), ty('int'), pl(' a, '), ty('int'), pl(' b) { '), kw('return'), pl(' a * b; }')],
          [],
          [ty('int'), pl(' '), kw('main'), pl('() {')],
          [pl('    '), cmt('// Declare function pointer')],
          [pl('    '), ty('int'), pl(' (*op)('), ty('int'), pl(', '), ty('int'), pl(');')],
          [],
          [pl('    op = add;')],
          [pl('    '), kw('printf'), pl('('), str('"add: %d\\n"'), pl(', op('), num('10'), pl(', '), num('3'), pl('));')],
          [],
          [pl('    op = sub;')],
          [pl('    '), kw('printf'), pl('('), str('"sub: %d\\n"'), pl(', op('), num('10'), pl(', '), num('3'), pl('));')],
          [],
          [pl('    '), cmt('// Array of function pointers')],
          [pl('    '), ty('int'), pl(' (*ops[])('), ty('int'), pl(', '), ty('int'), pl(') = {add, sub, mul};')],
          [pl('    '), kw('for'), pl(' ('), ty('int'), pl(' i = '), num('0'), pl('; i < '), num('3'), pl('; i++)')],
          [pl('        '), kw('printf'), pl('('), str('"ops[%d](5,3) = %d\\n"'), pl(', i, ops[i]('), num('5'), pl(', '), num('3'), pl('));')],
          [pl('    '), kw('return'), pl(' '), num('0'), pl(';')],
          [pl('}')],
        ],
        output: 'add: 13\nsub: 7\nops[0](5,3) = 8\nops[1](5,3) = 2\nops[2](5,3) = 15',
      },
    ],
    exercises: [
      {
        prompt: 'What operator gets the address of a variable?',
        blanks: [
          { id: 'ptr_1a', answer: '&', hint: 'Address-of operator' },
          { id: 'ptr_1b', answer: '*', hint: 'Dereference operator' },
        ],
      },
      {
        prompt: 'What value represents an invalid pointer, and what pointer type holds any address?',
        blanks: [
          { id: 'ptr_2a', answer: 'NULL', hint: 'Invalid/empty pointer constant' },
          { id: 'ptr_2b', answer: 'void', hint: 'Generic pointer type: _____ *' },
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════════
  // 9. STRUCTS & UNIONS
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: 'structs',
    title: 'Structs & Unions',
    explanation:
      'A struct groups related data of different types into one composite type. Members are accessed with dot (.) for values and arrow (->) for pointers. typedef creates a type alias so you can omit the struct keyword. Nested structs are structs within structs. A union shares memory among members -- all members occupy the same space, and only one is valid at a time. Enums define named integer constants. Bit fields allow packing multiple values into compact integers, specifying exact bit widths.',
    examples: [
      {
        title: 'Struct and typedef',
        code: [
          [pp('#include'), pl(' '), str('<stdio.h>')],
          [],
          [cmt('// Define struct with typedef')],
          [kw('typedef'), pl(' '), kw('struct'), pl(' {')],
          [pl('    '), ty('char'), pl(' name['), num('50'), pl('];')],
          [pl('    '), ty('int'), pl(' age;')],
          [pl('    '), ty('float'), pl(' gpa;')],
          [pl('} Student;')],
          [],
          [ty('int'), pl(' '), kw('main'), pl('() {')],
          [pl('    Student s1 = {'), str('"Alice"'), pl(', '), num('20'), pl(', '), num('3.9'), pl('f};')],
          [pl('    '), kw('printf'), pl('('), str('"Name: %s\\n"'), pl(', s1.name);')],
          [pl('    '), kw('printf'), pl('('), str('"Age:  %d\\n"'), pl(', s1.age);')],
          [pl('    '), kw('printf'), pl('('), str('"GPA:  %.1f\\n"'), pl(', s1.gpa);')],
          [],
          [pl('    '), cmt('// Pointer to struct uses -> operator')],
          [pl('    Student *ptr = &s1;')],
          [pl('    ptr->age = '), num('21'), pl(';')],
          [pl('    '), kw('printf'), pl('('), str('"Updated age: %d\\n"'), pl(', ptr->age);')],
          [pl('    '), kw('return'), pl(' '), num('0'), pl(';')],
          [pl('}')],
        ],
        output: 'Name: Alice\nAge:  20\nGPA:  3.9\nUpdated age: 21',
      },
      {
        title: 'Nested Structs and Enums',
        code: [
          [pp('#include'), pl(' '), str('<stdio.h>')],
          [],
          [kw('typedef'), pl(' '), kw('enum'), pl(' { RED, GREEN, BLUE } Color;')],
          [],
          [kw('typedef'), pl(' '), kw('struct'), pl(' {')],
          [pl('    '), ty('int'), pl(' x, y;')],
          [pl('} Point;')],
          [],
          [kw('typedef'), pl(' '), kw('struct'), pl(' {')],
          [pl('    Point center;'), pl('  '), cmt('// nested struct')],
          [pl('    '), ty('int'), pl(' radius;')],
          [pl('    Color color;')],
          [pl('} Circle;')],
          [],
          [ty('int'), pl(' '), kw('main'), pl('() {')],
          [pl('    Circle c = {{'), num('5'), pl(', '), num('10'), pl('}, '), num('15'), pl(', GREEN};')],
          [pl('    '), kw('printf'), pl('('), str('"Center: (%d, %d)\\n"'), pl(', c.center.x, c.center.y);')],
          [pl('    '), kw('printf'), pl('('), str('"Radius: %d\\n"'), pl(', c.radius);')],
          [pl('    '), kw('printf'), pl('('), str('"Color:  %d (GREEN=1)\\n"'), pl(', c.color);')],
          [pl('    '), kw('return'), pl(' '), num('0'), pl(';')],
          [pl('}')],
        ],
        output: 'Center: (5, 10)\nRadius: 15\nColor:  1 (GREEN=1)',
      },
      {
        title: 'Unions and Bit Fields',
        code: [
          [pp('#include'), pl(' '), str('<stdio.h>')],
          [],
          [cmt('// Union: all members share the same memory')],
          [kw('typedef'), pl(' '), kw('union'), pl(' {')],
          [pl('    '), ty('int'), pl(' i;')],
          [pl('    '), ty('float'), pl(' f;')],
          [pl('    '), ty('char'), pl(' c;')],
          [pl('} Value;')],
          [],
          [cmt('// Bit fields: pack data tightly')],
          [kw('typedef'), pl(' '), kw('struct'), pl(' {')],
          [pl('    '), ty('unsigned int'), pl(' is_active  : '), num('1'), pl(';'), pl(' '), cmt('// 1 bit')],
          [pl('    '), ty('unsigned int'), pl(' permission : '), num('3'), pl(';'), pl(' '), cmt('// 3 bits (0-7)')],
          [pl('    '), ty('unsigned int'), pl(' priority   : '), num('4'), pl(';'), pl(' '), cmt('// 4 bits (0-15)')],
          [pl('} Flags;')],
          [],
          [ty('int'), pl(' '), kw('main'), pl('() {')],
          [pl('    Value v;')],
          [pl('    v.i = '), num('42'), pl(';')],
          [pl('    '), kw('printf'), pl('('), str('"int:  %d\\n"'), pl(', v.i);')],
          [pl('    v.f = '), num('3.14'), pl('f;'), pl('  '), cmt('// overwrites i!')],
          [pl('    '), kw('printf'), pl('('), str('"float: %.2f\\n"'), pl(', v.f);')],
          [pl('    '), kw('printf'), pl('('), str('"sizeof(Value) = %zu\\n"'), pl(', '), kw('sizeof'), pl('(Value));')],
          [],
          [pl('    Flags fl = {'), num('1'), pl(', '), num('5'), pl(', '), num('9'), pl('};')],
          [pl('    '), kw('printf'), pl('('), str('"active=%u perm=%u pri=%u\\n"'), pl(', fl.is_active, fl.permission, fl.priority);')],
          [pl('    '), kw('return'), pl(' '), num('0'), pl(';')],
          [pl('}')],
        ],
        output: 'int:  42\nfloat: 3.14\nsizeof(Value) = 4\nactive=1 perm=5 pri=9',
      },
    ],
    exercises: [
      {
        prompt: 'What operator accesses struct members via pointer?',
        blanks: [
          { id: 'st_1a', answer: '->', hint: 'Arrow operator for pointer->member' },
          { id: 'st_1b', answer: 'typedef', hint: 'Keyword to create a type alias' },
        ],
      },
      {
        prompt: 'In a union all members share the same _____. Enums define named _____ constants.',
        blanks: [
          { id: 'st_2a', answer: 'memory', hint: 'What union members share' },
          { id: 'st_2b', answer: 'integer', hint: 'The type of values in an enum' },
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════════
  // 10. MEMORY MANAGEMENT
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: 'memory',
    title: 'Memory Management',
    explanation:
      'C requires manual memory management. Stack memory is automatic (local variables) and freed when the function returns. Heap memory is allocated explicitly: malloc(size) allocates uninitialized bytes, calloc(count, size) allocates and zeros memory, realloc(ptr, newsize) resizes. Every allocation must have a matching free(). Failing to free causes memory leaks. Using freed memory (dangling pointer) or writing past allocation bounds causes undefined behavior. Always check if allocation returns NULL.',
    examples: [
      {
        title: 'malloc, calloc, free',
        code: [
          [pp('#include'), pl(' '), str('<stdio.h>')],
          [pp('#include'), pl(' '), str('<stdlib.h>')],
          [],
          [ty('int'), pl(' '), kw('main'), pl('() {')],
          [pl('    '), cmt('// malloc: allocate 5 ints (uninitialized)')],
          [pl('    '), ty('int'), pl(' *arr = ('), ty('int'), pl(' *)'), kw('malloc'), pl('('), num('5'), pl(' * '), kw('sizeof'), pl('('), ty('int'), pl('));')],
          [pl('    '), kw('if'), pl(' (!arr) { '), kw('printf'), pl('('), str('"malloc failed\\n"'), pl('); '), kw('return'), pl(' '), num('1'), pl('; }')],
          [],
          [pl('    '), kw('for'), pl(' ('), ty('int'), pl(' i = '), num('0'), pl('; i < '), num('5'), pl('; i++)')],
          [pl('        arr[i] = i * '), num('10'), pl(';')],
          [],
          [pl('    '), kw('for'), pl(' ('), ty('int'), pl(' i = '), num('0'), pl('; i < '), num('5'), pl('; i++)')],
          [pl('        '), kw('printf'), pl('('), str('"arr[%d] = %d\\n"'), pl(', i, arr[i]);')],
          [],
          [pl('    '), kw('free'), pl('(arr);'), pl('  '), cmt('// release memory')],
          [pl('    arr = '), kw('NULL'), pl(';'), pl(' '), cmt('// avoid dangling pointer')],
          [],
          [pl('    '), cmt('// calloc: allocate 3 ints (zeroed)')],
          [pl('    '), ty('int'), pl(' *zeros = ('), ty('int'), pl(' *)'), kw('calloc'), pl('('), num('3'), pl(', '), kw('sizeof'), pl('('), ty('int'), pl('));')],
          [pl('    '), kw('printf'), pl('('), str('"zeros: %d %d %d\\n"'), pl(', zeros['), num('0'), pl('], zeros['), num('1'), pl('], zeros['), num('2'), pl(']);')],
          [pl('    '), kw('free'), pl('(zeros);')],
          [pl('    '), kw('return'), pl(' '), num('0'), pl(';')],
          [pl('}')],
        ],
        output: 'arr[0] = 0\narr[1] = 10\narr[2] = 20\narr[3] = 30\narr[4] = 40\nzeros: 0 0 0',
      },
      {
        title: 'realloc and Dynamic Growth',
        code: [
          [pp('#include'), pl(' '), str('<stdio.h>')],
          [pp('#include'), pl(' '), str('<stdlib.h>')],
          [],
          [ty('int'), pl(' '), kw('main'), pl('() {')],
          [pl('    '), ty('int'), pl(' capacity = '), num('2'), pl(';')],
          [pl('    '), ty('int'), pl(' size = '), num('0'), pl(';')],
          [pl('    '), ty('int'), pl(' *data = ('), ty('int'), pl(' *)'), kw('malloc'), pl('(capacity * '), kw('sizeof'), pl('('), ty('int'), pl('));')],
          [],
          [pl('    '), cmt('// Dynamically grow array as needed')],
          [pl('    '), kw('for'), pl(' ('), ty('int'), pl(' i = '), num('0'), pl('; i < '), num('6'), pl('; i++) {')],
          [pl('        '), kw('if'), pl(' (size == capacity) {')],
          [pl('            capacity *= '), num('2'), pl(';')],
          [pl('            data = ('), ty('int'), pl(' *)'), kw('realloc'), pl('(data, capacity * '), kw('sizeof'), pl('('), ty('int'), pl('));')],
          [pl('            '), kw('printf'), pl('('), str('"Grew to capacity %d\\n"'), pl(', capacity);')],
          [pl('        }')],
          [pl('        data[size++] = i * '), num('5'), pl(';')],
          [pl('    }')],
          [],
          [pl('    '), kw('for'), pl(' ('), ty('int'), pl(' i = '), num('0'), pl('; i < size; i++)')],
          [pl('        '), kw('printf'), pl('('), str('"%d "'), pl(', data[i]);')],
          [pl('    '), kw('printf'), pl('('), str('"\\n"'), pl(');')],
          [pl('    '), kw('free'), pl('(data);')],
          [pl('    '), kw('return'), pl(' '), num('0'), pl(';')],
          [pl('}')],
        ],
        output: 'Grew to capacity 4\nGrew to capacity 8\n0 5 10 15 20 25',
      },
      {
        title: 'Stack vs Heap',
        code: [
          [pp('#include'), pl(' '), str('<stdio.h>')],
          [pp('#include'), pl(' '), str('<stdlib.h>')],
          [],
          [cmt('// WRONG: returning pointer to stack variable')],
          [ty('int'), pl(' *bad_func() {')],
          [pl('    '), ty('int'), pl(' local = '), num('42'), pl(';'), pl('  '), cmt('// stack: dies after return')],
          [pl('    '), kw('return'), pl(' &local;'), pl('   '), cmt('// DANGLING POINTER!')],
          [pl('}')],
          [],
          [cmt('// CORRECT: allocate on heap')],
          [ty('int'), pl(' *good_func() {')],
          [pl('    '), ty('int'), pl(' *p = ('), ty('int'), pl(' *)'), kw('malloc'), pl('('), kw('sizeof'), pl('('), ty('int'), pl('));')],
          [pl('    *p = '), num('42'), pl(';'), pl('  '), cmt('// heap: persists until free()')],
          [pl('    '), kw('return'), pl(' p;'), pl('  '), cmt('// caller must free()')],
          [pl('}')],
          [],
          [ty('int'), pl(' '), kw('main'), pl('() {')],
          [pl('    '), ty('int'), pl(' *val = good_func();')],
          [pl('    '), kw('printf'), pl('('), str('"Heap value: %d\\n"'), pl(', *val);')],
          [pl('    '), kw('free'), pl('(val);'), pl('  '), cmt('// always free heap memory')],
          [pl('    '), kw('return'), pl(' '), num('0'), pl(';')],
          [pl('}')],
        ],
        output: 'Heap value: 42',
      },
    ],
    exercises: [
      {
        prompt: 'What function allocates zeroed memory, and what releases it?',
        blanks: [
          { id: 'mem_1a', answer: 'calloc', hint: 'Allocates and zeros memory' },
          { id: 'mem_1b', answer: 'free', hint: 'Releases allocated memory' },
        ],
      },
      {
        prompt: 'What function resizes a heap allocation? Always set freed pointer to _____.',
        blanks: [
          { id: 'mem_2a', answer: 'realloc', hint: 'Function to resize existing allocation' },
          { id: 'mem_2b', answer: 'NULL', hint: 'Value to avoid dangling pointer' },
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════════
  // 11. FILE I/O
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: 'fileio',
    title: 'File I/O',
    explanation:
      'C uses FILE pointers from <stdio.h> for file operations. fopen(path, mode) opens a file: "r" read, "w" write (truncate), "a" append, "rb"/"wb" for binary mode. fprintf/fscanf are like printf/scanf but target files. fgets reads a line safely. fread/fwrite handle raw binary data. fseek moves the file position, ftell reports it. Always check if fopen returns NULL and close files with fclose() to flush buffers.',
    examples: [
      {
        title: 'Text Read and Write',
        code: [
          [pp('#include'), pl(' '), str('<stdio.h>')],
          [],
          [ty('int'), pl(' '), kw('main'), pl('() {')],
          [pl('    '), cmt('// Write to a file')],
          [pl('    '), ty('FILE'), pl(' *fp = '), kw('fopen'), pl('('), str('"data.txt"'), pl(', '), str('"w"'), pl(');')],
          [pl('    '), kw('if'), pl(' (!fp) { '), kw('perror'), pl('('), str('"fopen"'), pl('); '), kw('return'), pl(' '), num('1'), pl('; }')],
          [],
          [pl('    '), kw('fprintf'), pl('(fp, '), str('"Name: %s\\n"'), pl(', '), str('"Alice"'), pl(');')],
          [pl('    '), kw('fprintf'), pl('(fp, '), str('"Score: %d\\n"'), pl(', '), num('95'), pl(');')],
          [pl('    '), kw('fclose'), pl('(fp);')],
          [],
          [pl('    '), cmt('// Read it back line by line')],
          [pl('    fp = '), kw('fopen'), pl('('), str('"data.txt"'), pl(', '), str('"r"'), pl(');')],
          [pl('    '), ty('char'), pl(' line['), num('256'), pl('];')],
          [pl('    '), kw('while'), pl(' ('), kw('fgets'), pl('(line, '), kw('sizeof'), pl('(line), fp)) {')],
          [pl('        '), kw('printf'), pl('('), str('"%s"'), pl(', line);')],
          [pl('    }')],
          [pl('    '), kw('fclose'), pl('(fp);')],
          [pl('    '), kw('return'), pl(' '), num('0'), pl(';')],
          [pl('}')],
        ],
        output: 'Name: Alice\nScore: 95',
      },
      {
        title: 'Binary Mode and fseek/ftell',
        code: [
          [pp('#include'), pl(' '), str('<stdio.h>')],
          [],
          [ty('int'), pl(' '), kw('main'), pl('() {')],
          [pl('    '), cmt('// Write binary data')],
          [pl('    '), ty('int'), pl(' nums[] = {'), num('10'), pl(', '), num('20'), pl(', '), num('30'), pl(', '), num('40'), pl(', '), num('50'), pl('};')],
          [pl('    '), ty('FILE'), pl(' *fp = '), kw('fopen'), pl('('), str('"data.bin"'), pl(', '), str('"wb"'), pl(');')],
          [pl('    '), kw('fwrite'), pl('(nums, '), kw('sizeof'), pl('('), ty('int'), pl('), '), num('5'), pl(', fp);')],
          [pl('    '), kw('fclose'), pl('(fp);')],
          [],
          [pl('    '), cmt('// Read binary data and seek')],
          [pl('    fp = '), kw('fopen'), pl('('), str('"data.bin"'), pl(', '), str('"rb"'), pl(');')],
          [],
          [pl('    '), cmt('// Get file size')],
          [pl('    '), kw('fseek'), pl('(fp, '), num('0'), pl(', SEEK_END);')],
          [pl('    '), ty('long'), pl(' size = '), kw('ftell'), pl('(fp);')],
          [pl('    '), kw('printf'), pl('('), str('"File size: %ld bytes\\n"'), pl(', size);')],
          [],
          [pl('    '), cmt('// Seek to 3rd integer and read it')],
          [pl('    '), kw('fseek'), pl('(fp, '), num('2'), pl(' * '), kw('sizeof'), pl('('), ty('int'), pl('), SEEK_SET);')],
          [pl('    '), ty('int'), pl(' val;')],
          [pl('    '), kw('fread'), pl('(&val, '), kw('sizeof'), pl('('), ty('int'), pl('), '), num('1'), pl(', fp);')],
          [pl('    '), kw('printf'), pl('('), str('"3rd element: %d\\n"'), pl(', val);')],
          [pl('    '), kw('fclose'), pl('(fp);')],
          [pl('    '), kw('return'), pl(' '), num('0'), pl(';')],
          [pl('}')],
        ],
        output: 'File size: 20 bytes\n3rd element: 30',
      },
    ],
    exercises: [
      {
        prompt: 'What mode string opens a file for binary reading?',
        blanks: [
          { id: 'fio_1a', answer: 'rb', hint: 'Read + binary mode string' },
          { id: 'fio_1b', answer: 'fclose', hint: 'Function to close a FILE*' },
        ],
      },
      {
        prompt: 'What function reports current file position? What reads a line safely?',
        blanks: [
          { id: 'fio_2a', answer: 'ftell', hint: 'Returns current position in file' },
          { id: 'fio_2b', answer: 'fgets', hint: 'Reads a line with buffer size limit' },
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════════
  // 12. PREPROCESSOR & ADVANCED
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: 'advanced',
    title: 'Preprocessor & Advanced',
    explanation:
      'The C preprocessor runs before compilation, handling directives like #define (macros and constants), #include (insert headers), #ifdef/#ifndef/#endif (conditional compilation), and #pragma (compiler hints). Macros with arguments like #define MAX(a,b) ((a)>(b)?(a):(b)) expand as text substitution -- always wrap parameters in parentheses. The inline keyword suggests the compiler embed function code at the call site. The volatile keyword prevents compiler optimization on hardware-mapped variables. The restrict keyword promises pointer non-aliasing for optimization.',
    examples: [
      {
        title: 'Macros and Conditional Compilation',
        code: [
          [pp('#include'), pl(' '), str('<stdio.h>')],
          [],
          [cmt('// Constants')],
          [pp('#define'), pl(' MAX_SIZE '), num('100')],
          [pp('#define'), pl(' PI '), num('3.14159265')],
          [],
          [cmt('// Function-like macros (wrap params in parens!)')],
          [pp('#define'), pl(' SQUARE(x) ((x) * (x))')],
          [pp('#define'), pl(' MAX(a, b) ((a) > (b) ? (a) : (b))')],
          [pp('#define'), pl(' MIN(a, b) ((a) < (b) ? (a) : (b))')],
          [],
          [cmt('// Debug logging macro')],
          [pp('#define'), pl(' DEBUG '), num('1')],
          [],
          [pp('#if'), pl(' DEBUG')],
          [pl('  '), pp('#define'), pl(' LOG(fmt, ...) '), kw('printf'), pl('('), str('"[DBG] "'), pl(' fmt '), str('"\\n"'), pl(', ##__VA_ARGS__)')],
          [pp('#else')],
          [pl('  '), pp('#define'), pl(' LOG(fmt, ...)')],
          [pp('#endif')],
          [],
          [ty('int'), pl(' '), kw('main'), pl('() {')],
          [pl('    '), kw('printf'), pl('('), str('"SQUARE(5) = %d\\n"'), pl(', SQUARE('), num('5'), pl('));')],
          [pl('    '), kw('printf'), pl('('), str('"MAX(3,7)  = %d\\n"'), pl(', MAX('), num('3'), pl(', '), num('7'), pl('));')],
          [pl('    LOG('), str('"value = %d"'), pl(', '), num('42'), pl(');')],
          [pl('    '), kw('return'), pl(' '), num('0'), pl(';')],
          [pl('}')],
        ],
        output: 'SQUARE(5) = 25\nMAX(3,7)  = 7\n[DBG] value = 42',
      },
      {
        title: 'Header Guards and Include',
        code: [
          [cmt('// ─── mymath.h ─── (header file)')],
          [pp('#ifndef'), pl(' MYMATH_H')],
          [pp('#define'), pl(' MYMATH_H')],
          [],
          [cmt('// Function prototypes')],
          [ty('int'), pl(' square('), ty('int'), pl(' x);')],
          [ty('int'), pl(' cube('), ty('int'), pl(' x);')],
          [ty('double'), pl(' circle_area('), ty('double'), pl(' r);')],
          [],
          [pp('#endif'), pl(' '), cmt('// MYMATH_H')],
          [],
          [cmt('// ─── mymath.c ─── (implementation)')],
          [pp('#include'), pl(' '), str('"mymath.h"')],
          [],
          [ty('int'), pl(' square('), ty('int'), pl(' x) { '), kw('return'), pl(' x * x; }')],
          [ty('int'), pl(' cube('), ty('int'), pl(' x) { '), kw('return'), pl(' x * x * x; }')],
          [ty('double'), pl(' circle_area('), ty('double'), pl(' r) {')],
          [pl('    '), kw('return'), pl(' '), num('3.14159265'), pl(' * r * r;')],
          [pl('}')],
          [],
          [cmt('// ─── main.c ─── (uses the module)')],
          [pp('#include'), pl(' '), str('<stdio.h>')],
          [pp('#include'), pl(' '), str('"mymath.h"')],
          [],
          [ty('int'), pl(' '), kw('main'), pl('() {')],
          [pl('    '), kw('printf'), pl('('), str('"%d\\n"'), pl(', square('), num('4'), pl('));'), pl('  '), cmt('// 16')],
          [pl('    '), kw('printf'), pl('('), str('"%.2f\\n"'), pl(', circle_area('), num('5.0'), pl('));')],
          [pl('    '), kw('return'), pl(' '), num('0'), pl(';')],
          [pl('}')],
        ],
        output: '16\n78.54',
      },
      {
        title: 'inline, volatile, restrict',
        code: [
          [pp('#include'), pl(' '), str('<stdio.h>')],
          [],
          [cmt('// inline: suggest inlining to avoid call overhead')],
          [kw('static'), pl(' '), kw('inline'), pl(' '), ty('int'), pl(' max('), ty('int'), pl(' a, '), ty('int'), pl(' b) {')],
          [pl('    '), kw('return'), pl(' a > b ? a : b;')],
          [pl('}')],
          [],
          [cmt('// volatile: value may change outside program control')],
          [cmt('// Used for hardware registers, signal handlers')],
          [kw('volatile'), pl(' '), ty('int'), pl(' sensor_value = '), num('0'), pl(';')],
          [],
          [cmt('// restrict: promise no aliasing (C99+)')],
          [ty('void'), pl(' add_arrays('), ty('int'), pl(' * '), kw('restrict'), pl(' dest,')],
          [pl('                '), ty('const int'), pl(' * '), kw('restrict'), pl(' src,')],
          [pl('                '), ty('int'), pl(' n) {')],
          [pl('    '), kw('for'), pl(' ('), ty('int'), pl(' i = '), num('0'), pl('; i < n; i++)')],
          [pl('        dest[i] += src[i];')],
          [pl('}')],
          [],
          [ty('int'), pl(' '), kw('main'), pl('() {')],
          [pl('    '), kw('printf'), pl('('), str('"max(10,20) = %d\\n"'), pl(', max('), num('10'), pl(', '), num('20'), pl('));')],
          [],
          [pl('    '), ty('int'), pl(' a[] = {'), num('1'), pl(', '), num('2'), pl(', '), num('3'), pl('};')],
          [pl('    '), ty('int'), pl(' b[] = {'), num('10'), pl(', '), num('20'), pl(', '), num('30'), pl('};')],
          [pl('    add_arrays(a, b, '), num('3'), pl(');')],
          [pl('    '), kw('printf'), pl('('), str('"%d %d %d\\n"'), pl(', a['), num('0'), pl('], a['), num('1'), pl('], a['), num('2'), pl(']);')],
          [pl('    '), kw('return'), pl(' '), num('0'), pl(';')],
          [pl('}')],
        ],
        output: 'max(10,20) = 20\n11 22 33',
      },
    ],
    exercises: [
      {
        prompt: 'Header guards use #ifndef and _____. Macros are created with #_____.',
        blanks: [
          { id: 'adv_1a', answer: '#endif', hint: 'Closes the #ifndef block' },
          { id: 'adv_1b', answer: 'define', hint: 'Preprocessor directive to create a macro' },
        ],
      },
      {
        prompt: 'What keyword prevents compiler optimization on hardware variables?',
        blanks: [
          { id: 'adv_2a', answer: 'volatile', hint: 'Variable may change outside program flow' },
          { id: 'adv_2b', answer: 'inline', hint: 'Suggests embedding function code at call site' },
        ],
      },
    ],
  },
];

// ─── Color mapping ───────────────────────────────────────────────────────────

const colorMap: Record<CodeFragment['type'], string> = {
  keyword: 'text-blue-400',
  string: 'text-green-400',
  comment: 'text-gray-500',
  number: 'text-orange-400',
  type: 'text-purple-400',
  plain: 'text-gray-200',
  preprocessor: 'text-blue-400',
};

// ─── Component ───────────────────────────────────────────────────────────────

export const CLab: React.FC = () => {
  const [activeTopic, setActiveTopic] = useState<string>(TOPICS[0].id);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, boolean | null>>({});

  const topic = TOPICS.find(t => t.id === activeTopic)!;

  const handleInput = (blankId: string, value: string) => {
    setInputs(prev => ({ ...prev, [blankId]: value }));
    setResults(prev => ({ ...prev, [blankId]: null }));
  };

  const checkExercise = (exercise: Exercise) => {
    const newResults: Record<string, boolean> = {};
    exercise.blanks.forEach(b => {
      const input = (inputs[b.id] || '').trim().toLowerCase();
      newResults[b.id] = input === b.answer.toLowerCase();
    });
    setResults(prev => ({ ...prev, ...newResults }));
  };

  const resetExercise = (exercise: Exercise) => {
    const cleared: Record<string, string> = {};
    const clearedResults: Record<string, null> = {};
    exercise.blanks.forEach(b => {
      cleared[b.id] = '';
      clearedResults[b.id] = null;
    });
    setInputs(prev => ({ ...prev, ...cleared }));
    setResults(prev => ({ ...prev, ...clearedResults }));
  };

  const isExerciseCorrect = (exercise: Exercise) =>
    exercise.blanks.length > 0 &&
    exercise.blanks.every(b => results[b.id] === true);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm shrink-0">
        <Code className="w-4 h-4 text-blue-500" />
        <h1 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          C Programming Lab
        </h1>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-medium">
          {TOPICS.findIndex(t => t.id === activeTopic) + 1}/{TOPICS.length}
        </span>
        <span className="ml-auto text-[11px] text-gray-400 dark:text-gray-500">
          Beginner to Advanced
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-56 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white/40 dark:bg-gray-900/40 overflow-y-auto">
          <div className="px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
              Topics
            </p>
            {TOPICS.map((t, idx) => (
              <button
                key={t.id}
                onClick={() => setActiveTopic(t.id)}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-left transition-colors mb-0.5 ${
                  activeTopic === t.id
                    ? 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span className="w-4 text-[10px] text-gray-400 dark:text-gray-500 shrink-0">{idx + 1}.</span>
                <ChevronRight
                  className={`w-3 h-3 shrink-0 transition-transform ${
                    activeTopic === t.id ? 'rotate-90' : ''
                  }`}
                />
                <span className="truncate">{t.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Topic Title */}
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-500" />
            <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">
              {topic.title}
            </h2>
          </div>

          {/* Explanation */}
          <p className="text-[13px] leading-relaxed text-gray-600 dark:text-gray-300">
            {topic.explanation}
          </p>

          {/* Code Examples */}
          {topic.examples.map((example, ei) => (
            <div key={ei}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Code className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Example {ei + 1}: {example.title}
                </span>
              </div>
              <div className="bg-gray-950 rounded-lg p-3 font-mono text-[12px] leading-5 overflow-x-auto">
                {example.code.map((line, li) => (
                  <div key={li} className="min-h-[20px]">
                    {line.map((frag, fi) => (
                      <span key={fi} className={colorMap[frag.type]}>
                        {frag.text}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
              <div className="mt-1.5">
                <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                  Output
                </span>
                <div className="mt-1 bg-gray-100 dark:bg-gray-800/60 rounded-lg p-2.5 font-mono text-[12px] text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {example.output}
                </div>
              </div>
            </div>
          ))}

          {/* Exercises */}
          {topic.exercises.map((exercise, exIdx) => (
            <div
              key={exIdx}
              className="border border-gray-200 dark:border-gray-700/60 rounded-lg p-4 bg-white/70 dark:bg-gray-800/30"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Code className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Exercise {exIdx + 1}
                  </span>
                </div>
                {isExerciseCorrect(exercise) && (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-green-600 dark:text-green-400">
                    <Check className="w-3.5 h-3.5" />
                    All correct!
                  </span>
                )}
              </div>

              <p className="text-[12px] text-gray-600 dark:text-gray-300 mb-3">
                {exercise.prompt}
              </p>

              <div className="space-y-2.5">
                {exercise.blanks.map((blank, i) => {
                  const result = results[blank.id];
                  return (
                    <div key={blank.id} className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-400 dark:text-gray-500 w-4 shrink-0">
                        {i + 1}.
                      </span>
                      <input
                        type="text"
                        value={inputs[blank.id] || ''}
                        onChange={e => handleInput(blank.id, e.target.value)}
                        placeholder={blank.hint}
                        className={`flex-1 text-[12px] px-2.5 py-1.5 rounded-md border font-mono outline-none transition-colors ${
                          result === true
                            ? 'border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                            : result === false
                              ? 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                              : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200'
                        }`}
                      />
                      {result === true && <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                      {result === false && <X className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 mt-3.5">
                <button
                  onClick={() => checkExercise(exercise)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                >
                  <Check className="w-3 h-3" />
                  Check
                </button>
                <button
                  onClick={() => resetExercise(exercise)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-md border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              </div>
            </div>
          ))}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700/50">
            <button
              onClick={() => {
                const idx = TOPICS.findIndex(t => t.id === activeTopic);
                if (idx > 0) setActiveTopic(TOPICS[idx - 1].id);
              }}
              disabled={TOPICS.findIndex(t => t.id === activeTopic) === 0}
              className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium rounded-md border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-3 h-3 rotate-180" />
              Previous
            </button>
            <span className="text-[11px] text-gray-400 dark:text-gray-500">
              {TOPICS.findIndex(t => t.id === activeTopic) + 1} of {TOPICS.length}
            </span>
            <button
              onClick={() => {
                const idx = TOPICS.findIndex(t => t.id === activeTopic);
                if (idx < TOPICS.length - 1) setActiveTopic(TOPICS[idx + 1].id);
              }}
              disabled={TOPICS.findIndex(t => t.id === activeTopic) === TOPICS.length - 1}
              className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
