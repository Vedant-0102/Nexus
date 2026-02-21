import React, { useState, useCallback } from 'react';
import { Play, Trash2, Info, Code, Zap, Database, ChevronRight } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Construct {
  line: number;
  description: string;
  complexity: string;
  type: 'loop' | 'recursion' | 'allocation' | 'conditional';
}

interface AnalysisResult {
  timeComplexity: string;
  spaceComplexity: string;
  className: string;
  constructs: Construct[];
  explanation: string;
  detectedLanguage: string;
}

type Language = 'auto' | 'javascript' | 'python' | 'java' | 'cpp';

// ---------------------------------------------------------------------------
// Complexity helpers
// ---------------------------------------------------------------------------

const COMPLEXITY_ORDER = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n^2)', 'O(n^3)', 'O(2^n)', 'O(n!)'];

const COMPLEXITY_DISPLAY: Record<string, string> = {
  'O(1)': 'O(1)',
  'O(log n)': 'O(log n)',
  'O(n)': 'O(n)',
  'O(n log n)': 'O(n log n)',
  'O(n^2)': 'O(n\u00B2)',
  'O(n^3)': 'O(n\u00B3)',
  'O(2^n)': 'O(2\u207F)',
  'O(n!)': 'O(n!)',
};

const COMPLEXITY_CLASS_NAMES: Record<string, string> = {
  'O(1)': 'Constant',
  'O(log n)': 'Logarithmic',
  'O(n)': 'Linear',
  'O(n log n)': 'Linearithmic',
  'O(n^2)': 'Polynomial - Quadratic',
  'O(n^3)': 'Polynomial - Cubic',
  'O(2^n)': 'Exponential',
  'O(n!)': 'Factorial',
};

function complexityRank(c: string): number {
  const idx = COMPLEXITY_ORDER.indexOf(c);
  return idx === -1 ? 2 : idx; // default to O(n) rank if unknown
}

function maxComplexity(a: string, b: string): string {
  return complexityRank(a) >= complexityRank(b) ? a : b;
}

function multiplyComplexity(a: string, b: string): string {
  const table: Record<string, Record<string, string>> = {
    'O(1)': { 'O(1)': 'O(1)', 'O(log n)': 'O(log n)', 'O(n)': 'O(n)', 'O(n log n)': 'O(n log n)', 'O(n^2)': 'O(n^2)', 'O(n^3)': 'O(n^3)', 'O(2^n)': 'O(2^n)', 'O(n!)': 'O(n!)' },
    'O(log n)': { 'O(1)': 'O(log n)', 'O(log n)': 'O(log n)', 'O(n)': 'O(n log n)', 'O(n log n)': 'O(n log n)', 'O(n^2)': 'O(n^2)', 'O(n^3)': 'O(n^3)', 'O(2^n)': 'O(2^n)', 'O(n!)': 'O(n!)' },
    'O(n)': { 'O(1)': 'O(n)', 'O(log n)': 'O(n log n)', 'O(n)': 'O(n^2)', 'O(n log n)': 'O(n^2)', 'O(n^2)': 'O(n^3)', 'O(n^3)': 'O(n^3)', 'O(2^n)': 'O(2^n)', 'O(n!)': 'O(n!)' },
    'O(n log n)': { 'O(1)': 'O(n log n)', 'O(log n)': 'O(n log n)', 'O(n)': 'O(n^2)', 'O(n log n)': 'O(n^2)', 'O(n^2)': 'O(n^3)', 'O(n^3)': 'O(n^3)', 'O(2^n)': 'O(2^n)', 'O(n!)': 'O(n!)' },
    'O(n^2)': { 'O(1)': 'O(n^2)', 'O(log n)': 'O(n^2)', 'O(n)': 'O(n^3)', 'O(n log n)': 'O(n^3)', 'O(n^2)': 'O(n^3)', 'O(n^3)': 'O(n^3)', 'O(2^n)': 'O(2^n)', 'O(n!)': 'O(n!)' },
    'O(n^3)': { 'O(1)': 'O(n^3)', 'O(log n)': 'O(n^3)', 'O(n)': 'O(n^3)', 'O(n log n)': 'O(n^3)', 'O(n^2)': 'O(n^3)', 'O(n^3)': 'O(n^3)', 'O(2^n)': 'O(2^n)', 'O(n!)': 'O(n!)' },
    'O(2^n)': { 'O(1)': 'O(2^n)', 'O(log n)': 'O(2^n)', 'O(n)': 'O(2^n)', 'O(n log n)': 'O(2^n)', 'O(n^2)': 'O(2^n)', 'O(n^3)': 'O(2^n)', 'O(2^n)': 'O(2^n)', 'O(n!)': 'O(n!)' },
    'O(n!)': { 'O(1)': 'O(n!)', 'O(log n)': 'O(n!)', 'O(n)': 'O(n!)', 'O(n log n)': 'O(n!)', 'O(n^2)': 'O(n!)', 'O(n^3)': 'O(n!)', 'O(2^n)': 'O(n!)', 'O(n!)': 'O(n!)' },
  };
  return table[a]?.[b] ?? maxComplexity(a, b);
}

function complexityColor(c: string): string {
  const rank = complexityRank(c);
  if (rank <= 1) return '#22c55e'; // green
  if (rank === 2) return '#3b82f6'; // blue
  if (rank === 3) return '#eab308'; // yellow
  if (rank <= 5) return '#f97316'; // orange
  return '#ef4444'; // red
}

function complexityColorClass(c: string): string {
  const rank = complexityRank(c);
  if (rank <= 1) return 'text-green-500';
  if (rank === 2) return 'text-blue-500';
  if (rank === 3) return 'text-yellow-500';
  if (rank <= 5) return 'text-orange-500';
  return 'text-red-500';
}

function complexityBgClass(c: string): string {
  const rank = complexityRank(c);
  if (rank <= 1) return 'bg-green-500/10 border-green-500/30';
  if (rank === 2) return 'bg-blue-500/10 border-blue-500/30';
  if (rank === 3) return 'bg-yellow-500/10 border-yellow-500/30';
  if (rank <= 5) return 'bg-orange-500/10 border-orange-500/30';
  return 'bg-red-500/10 border-red-500/30';
}

// ---------------------------------------------------------------------------
// Preprocessing
// ---------------------------------------------------------------------------

function removeComments(code: string): string {
  // Remove multi-line comments /* ... */
  let cleaned = code.replace(/\/\*[\s\S]*?\*\//g, (match) => {
    // Preserve same number of newlines to keep line numbers accurate
    const newlines = (match.match(/\n/g) || []).length;
    return '\n'.repeat(newlines);
  });
  // Remove single-line comments // and #
  cleaned = cleaned.replace(/\/\/.*$/gm, '');
  cleaned = cleaned.replace(/#(?!include|define|ifdef|ifndef|endif|pragma).*$/gm, '');
  return cleaned;
}

function detectLanguage(code: string): string {
  const jsTsKeywords = /\b(const|let|var|function|=>|console\.log|require|import\s+.*\s+from|export\s+(default\s+)?)\b/;
  const pythonKeywords = /\b(def\s+\w+|print\s*\(|elif|import\s+\w+|from\s+\w+\s+import|self\.|__init__|range\s*\()\b/;
  const javaKeywords = /\b(public\s+(static\s+)?void|System\.out|class\s+\w+\s*\{|private\s+|protected\s+|throws\s+|new\s+\w+\[)/;
  const cppKeywords = /\b(#include|std::|cout|cin|iostream|vector<|int\s+main|printf\s*\(|malloc\s*\(|nullptr)\b/;

  const scores: Record<string, number> = { JavaScript: 0, Python: 0, Java: 0, 'C/C++': 0 };
  if (jsTsKeywords.test(code)) scores['JavaScript'] += 3;
  if (pythonKeywords.test(code)) scores['Python'] += 3;
  if (javaKeywords.test(code)) scores['Java'] += 3;
  if (cppKeywords.test(code)) scores['C/C++'] += 3;

  // Secondary cues
  if (/\bfunction\b/.test(code)) scores['JavaScript'] += 1;
  if (/\bdef\b/.test(code)) scores['Python'] += 1;
  if (/;\s*$/.test(code)) { scores['JavaScript'] += 0.5; scores['Java'] += 0.5; scores['C/C++'] += 0.5; }
  if (/\{/.test(code)) { scores['JavaScript'] += 0.3; scores['Java'] += 0.3; scores['C/C++'] += 0.3; }
  if (/:\s*$/m.test(code)) scores['Python'] += 1;

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : 'Unknown';
}

// ---------------------------------------------------------------------------
// Analysis Engine
// ---------------------------------------------------------------------------

function analyzeComplexity(code: string, manualLang?: string): AnalysisResult {
  if (!code.trim()) {
    return {
      timeComplexity: 'O(1)',
      spaceComplexity: 'O(1)',
      className: 'Constant',
      constructs: [],
      explanation: 'No code provided. Empty code has constant complexity.',
      detectedLanguage: 'Unknown',
    };
  }

  const cleaned = removeComments(code);
  const lines = cleaned.split('\n');
  const detectedLanguage = manualLang && manualLang !== 'auto'
    ? ({ javascript: 'JavaScript', python: 'Python', java: 'Java', cpp: 'C/C++' }[manualLang] || 'Unknown')
    : detectLanguage(code);

  const constructs: Construct[] = [];
  let overallTime = 'O(1)';
  let overallSpace = 'O(1)';

  // ---- Loop Detection ----
  interface LoopInfo {
    line: number;
    complexity: string;
    depth: number;
    description: string;
  }

  const loopStack: LoopInfo[] = [];
  const allLoops: LoopInfo[] = [];
  let braceDepth = 0;
  const loopBraceStarts: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const lineNum = i + 1;

    // Track brace depth
    const openBraces = (trimmed.match(/\{/g) || []).length;
    const closeBraces = (trimmed.match(/\}/g) || []).length;

    // Check for loop ends via brace tracking
    for (let b = 0; b < closeBraces; b++) {
      braceDepth--;
      if (loopBraceStarts.length > 0 && braceDepth < loopBraceStarts[loopBraceStarts.length - 1]) {
        loopBraceStarts.pop();
        loopStack.pop();
      }
    }

    // Detect for loops: for(init; cond; update)
    const forMatch = trimmed.match(/\bfor\s*\(/);
    if (forMatch) {
      const forContent = extractParenContent(trimmed, trimmed.indexOf('for'));
      let loopComplexity = 'O(n)';
      let desc = 'for loop';

      if (forContent) {
        const parts = forContent.split(';').map(p => p.trim());
        if (parts.length >= 3) {
          const init = parts[0];
          const cond = parts[1];
          const update = parts[2];

          // Check for constant bound loops
          const constBound = cond.match(/<\s*(\d+)|<=\s*(\d+)/);
          if (constBound) {
            const bound = parseInt(constBound[1] || constBound[2], 10);
            if (bound <= 100) {
              loopComplexity = 'O(1)';
              desc = `for loop (constant bound ${bound})`;
            }
          }

          // Check for logarithmic patterns
          if (/\*=\s*2|\*\s*=\s*2/.test(update)) {
            loopComplexity = 'O(log n)';
            desc = 'for loop (multiplicative step *2)';
          } else if (/\/=\s*2|\/\s*=\s*2/.test(update)) {
            loopComplexity = 'O(log n)';
            desc = 'for loop (divisive step /2)';
          } else if (/\*=\s*\d+/.test(update)) {
            loopComplexity = 'O(log n)';
            desc = `for loop (multiplicative step)`;
          } else if (/\/=\s*\d+/.test(update)) {
            loopComplexity = 'O(log n)';
            desc = `for loop (divisive step)`;
          }

          // Extract variable and bound info for description
          const varMatch = init.match(/(\w+)\s*=\s*(\w+)/);
          const boundMatch = cond.match(/(\w+)\s*[<>]=?\s*(\w+)/);
          const stepMatch = update.match(/(\w+)\s*(\+\+|--|\+=\s*\d+|\-=\s*\d+|\*=\s*\d+|\/=\s*\d+)/);

          if (varMatch && boundMatch && loopComplexity !== 'O(1)') {
            const varName = varMatch[1];
            const startVal = varMatch[2];
            const endVal = boundMatch[2] || boundMatch[1];
            const step = stepMatch ? stepMatch[2] : '++';
            desc = `for loop (${varName}: ${startVal} to ${endVal}, step ${step})`;
          }
        }
      }

      // Python-style for-in-range
      if (/\bfor\s+\w+\s+in\s+range\s*\(/.test(trimmed)) {
        loopComplexity = 'O(n)';
        desc = 'for loop (range iteration)';
        const rangeArgs = extractParenContent(trimmed, trimmed.indexOf('range'));
        if (rangeArgs) {
          const parts = rangeArgs.split(',').map(p => p.trim());
          if (parts.length === 1 && /^\d+$/.test(parts[0]) && parseInt(parts[0], 10) <= 100) {
            loopComplexity = 'O(1)';
            desc = `for loop (constant range ${parts[0]})`;
          }
        }
      }

      const nestingDepth = loopStack.length;
      const info: LoopInfo = { line: lineNum, complexity: loopComplexity, depth: nestingDepth, description: desc };
      loopStack.push(info);
      allLoops.push(info);
      loopBraceStarts.push(braceDepth);

      // Compute effective complexity considering nesting
      let effectiveComplexity = loopComplexity;
      for (let d = loopStack.length - 2; d >= 0; d--) {
        effectiveComplexity = multiplyComplexity(effectiveComplexity, loopStack[d].complexity);
      }

      const displayComplexity = COMPLEXITY_DISPLAY[effectiveComplexity] || effectiveComplexity;
      if (nestingDepth > 0) {
        const parentDisplay = COMPLEXITY_DISPLAY[loopStack[nestingDepth - 1].complexity] || loopStack[nestingDepth - 1].complexity;
        const selfDisplay = COMPLEXITY_DISPLAY[loopComplexity] || loopComplexity;
        constructs.push({
          line: lineNum,
          description: `nested ${desc} \u2192 ${selfDisplay} \u00D7 ${parentDisplay} = ${displayComplexity}`,
          complexity: effectiveComplexity,
          type: 'loop',
        });
      } else {
        constructs.push({
          line: lineNum,
          description: `${desc} \u2192 ${displayComplexity}`,
          complexity: effectiveComplexity,
          type: 'loop',
        });
      }

      overallTime = maxComplexity(overallTime, effectiveComplexity);
    }

    // Detect while loops
    const whileMatch = trimmed.match(/\bwhile\s*\(/);
    if (whileMatch && !trimmed.match(/\bdo\b/)) {
      let loopComplexity = 'O(n)';
      let desc = 'while loop';

      const whileContent = extractParenContent(trimmed, trimmed.indexOf('while'));
      if (whileContent) {
        // Check for halving pattern in condition or body
        const isHalving = /\/\s*2|>>\s*1|\/=\s*2/.test(whileContent);
        if (isHalving) {
          loopComplexity = 'O(log n)';
          desc = 'while loop (halving condition)';
        }
      }

      // Also look at next few lines for halving in the body
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const bodyLine = lines[j].trim();
        if (/\/=\s*2|=\s*\w+\s*\/\s*2|>>=\s*1|=\s*\w+\s*>>\s*1/.test(bodyLine)) {
          loopComplexity = 'O(log n)';
          desc = 'while loop (halving in body)';
          break;
        }
        if (/\*=\s*2|=\s*\w+\s*\*\s*2|<<=\s*1/.test(bodyLine)) {
          loopComplexity = 'O(log n)';
          desc = 'while loop (doubling in body)';
          break;
        }
        if (/\}/.test(bodyLine)) break;
      }

      const nestingDepth = loopStack.length;
      const info: LoopInfo = { line: lineNum, complexity: loopComplexity, depth: nestingDepth, description: desc };
      loopStack.push(info);
      allLoops.push(info);
      loopBraceStarts.push(braceDepth);

      let effectiveComplexity = loopComplexity;
      for (let d = loopStack.length - 2; d >= 0; d--) {
        effectiveComplexity = multiplyComplexity(effectiveComplexity, loopStack[d].complexity);
      }

      const displayComplexity = COMPLEXITY_DISPLAY[effectiveComplexity] || effectiveComplexity;
      if (nestingDepth > 0) {
        const parentDisplay = COMPLEXITY_DISPLAY[loopStack[nestingDepth - 1].complexity] || loopStack[nestingDepth - 1].complexity;
        const selfDisplay = COMPLEXITY_DISPLAY[loopComplexity] || loopComplexity;
        constructs.push({
          line: lineNum,
          description: `nested ${desc} \u2192 ${selfDisplay} \u00D7 ${parentDisplay} = ${displayComplexity}`,
          complexity: effectiveComplexity,
          type: 'loop',
        });
      } else {
        constructs.push({
          line: lineNum,
          description: `${desc} \u2192 ${displayComplexity}`,
          complexity: effectiveComplexity,
          type: 'loop',
        });
      }

      overallTime = maxComplexity(overallTime, effectiveComplexity);
    }

    // Detect do-while
    if (/\bdo\s*\{/.test(trimmed)) {
      const nestingDepth = loopStack.length;
      const info: LoopInfo = { line: lineNum, complexity: 'O(n)', depth: nestingDepth, description: 'do-while loop' };
      loopStack.push(info);
      allLoops.push(info);
      loopBraceStarts.push(braceDepth);

      let effectiveComplexity = 'O(n)';
      for (let d = loopStack.length - 2; d >= 0; d--) {
        effectiveComplexity = multiplyComplexity(effectiveComplexity, loopStack[d].complexity);
      }

      constructs.push({
        line: lineNum,
        description: `do-while loop \u2192 ${COMPLEXITY_DISPLAY[effectiveComplexity] || effectiveComplexity}`,
        complexity: effectiveComplexity,
        type: 'loop',
      });
      overallTime = maxComplexity(overallTime, effectiveComplexity);
    }

    // Python-style for ... in ... (non-range)
    if (/\bfor\s+\w+\s+in\s+(?!range)/.test(trimmed) && !forMatch) {
      const nestingDepth = loopStack.length;
      const desc = 'for-in iteration';
      const info: LoopInfo = { line: lineNum, complexity: 'O(n)', depth: nestingDepth, description: desc };
      loopStack.push(info);
      allLoops.push(info);
      loopBraceStarts.push(braceDepth);

      let effectiveComplexity = 'O(n)';
      for (let d = loopStack.length - 2; d >= 0; d--) {
        effectiveComplexity = multiplyComplexity(effectiveComplexity, loopStack[d].complexity);
      }

      constructs.push({
        line: lineNum,
        description: `${desc} \u2192 ${COMPLEXITY_DISPLAY[effectiveComplexity] || effectiveComplexity}`,
        complexity: effectiveComplexity,
        type: 'loop',
      });
      overallTime = maxComplexity(overallTime, effectiveComplexity);
    }

    braceDepth += openBraces;

    // ---- Data Structure / Allocation Detection (Space) ----
    if (/new\s+Array\s*\(\s*\w+\s*\)/.test(trimmed) || /\[\s*\]\s*\*\s*\w+/.test(trimmed) || /malloc\s*\(/.test(trimmed) || /calloc\s*\(/.test(trimmed)) {
      if (/new\s+Array\s*\(.*new\s+Array/.test(trimmed) || /\[\s*\[/.test(trimmed)) {
        overallSpace = maxComplexity(overallSpace, 'O(n^2)');
        constructs.push({ line: lineNum, description: '2D array allocation \u2192 O(n\u00B2) space', complexity: 'O(n^2)', type: 'allocation' });
      } else {
        overallSpace = maxComplexity(overallSpace, 'O(n)');
        constructs.push({ line: lineNum, description: 'array/buffer allocation \u2192 O(n) space', complexity: 'O(n)', type: 'allocation' });
      }
    }

    if (/new\s+(Set|Map|HashMap|TreeMap|HashSet|TreeSet)\s*\(/.test(trimmed) || /\bdict\s*\(\s*\)/.test(trimmed)) {
      overallSpace = maxComplexity(overallSpace, 'O(n)');
      constructs.push({ line: lineNum, description: 'hash/set/map allocation \u2192 O(n) space', complexity: 'O(n)', type: 'allocation' });
    }

    if (/\bint\s*\[\s*\]\s*\[\s*\]/.test(trimmed) || /new\s+int\s*\[\s*\w+\s*\]\s*\[\s*\w+\s*\]/.test(trimmed)) {
      overallSpace = maxComplexity(overallSpace, 'O(n^2)');
      constructs.push({ line: lineNum, description: '2D array declaration \u2192 O(n\u00B2) space', complexity: 'O(n^2)', type: 'allocation' });
    }

    // Arrays / slices that grow
    if (/\.push\s*\(|\.append\s*\(|\.add\s*\(/.test(trimmed) && loopStack.length > 0) {
      overallSpace = maxComplexity(overallSpace, 'O(n)');
    }
  }

  // ---- Recursion Detection ----
  const funcDefs: { name: string; startLine: number; endLine: number; body: string }[] = [];

  // JS/TS function patterns
  const funcPatternJS = /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:function|\([^)]*\)\s*=>|\w+\s*=>))/g;
  let funcMatch: RegExpExecArray | null;
  while ((funcMatch = funcPatternJS.exec(code)) !== null) {
    const name = funcMatch[1] || funcMatch[2];
    const startLine = code.substring(0, funcMatch.index).split('\n').length;
    funcDefs.push({ name, startLine, endLine: startLine + 20, body: '' });
  }

  // Python def
  const funcPatternPy = /\bdef\s+(\w+)\s*\(/g;
  while ((funcMatch = funcPatternPy.exec(code)) !== null) {
    const name = funcMatch[1];
    const startLine = code.substring(0, funcMatch.index).split('\n').length;
    funcDefs.push({ name, startLine, endLine: startLine + 20, body: '' });
  }

  // Java / C++ method patterns
  const funcPatternJC = /(?:public|private|protected|static|\b(?:void|int|long|double|float|boolean|String|char)\b)\s+(\w+)\s*\(/g;
  while ((funcMatch = funcPatternJC.exec(code)) !== null) {
    const name = funcMatch[1];
    if (['if', 'while', 'for', 'switch', 'main'].includes(name)) continue;
    const startLine = code.substring(0, funcMatch.index).split('\n').length;
    funcDefs.push({ name, startLine, endLine: startLine + 30, body: '' });
  }

  // Extract function bodies
  for (const fd of funcDefs) {
    const bodyLines = lines.slice(fd.startLine - 1, Math.min(fd.endLine, lines.length));
    fd.body = bodyLines.join('\n');
    // Try to find the actual end by brace matching
    let depth = 0;
    let foundStart = false;
    for (let li = fd.startLine - 1; li < lines.length; li++) {
      const l = lines[li];
      for (const ch of l) {
        if (ch === '{') { depth++; foundStart = true; }
        if (ch === '}') depth--;
        if (foundStart && depth === 0) {
          fd.endLine = li + 1;
          fd.body = lines.slice(fd.startLine - 1, fd.endLine).join('\n');
          break;
        }
      }
      if (foundStart && depth === 0) break;
    }
    // Python: use indentation
    if (!foundStart && detectedLanguage === 'Python') {
      const defLine = lines[fd.startLine - 1];
      const baseIndent = defLine.search(/\S/);
      for (let li = fd.startLine; li < lines.length; li++) {
        const l = lines[li];
        if (l.trim() === '') continue;
        const indent = l.search(/\S/);
        if (indent <= baseIndent) {
          fd.endLine = li;
          break;
        }
        fd.endLine = li + 1;
      }
      fd.body = lines.slice(fd.startLine - 1, fd.endLine).join('\n');
    }
  }

  // Check for recursion
  for (const fd of funcDefs) {
    const callRegex = new RegExp(`\\b${fd.name}\\s*\\(`, 'g');
    const bodyWithoutDef = fd.body.replace(/^[^\n]*\n/, ''); // remove the definition line itself
    const calls = bodyWithoutDef.match(callRegex);

    if (calls && calls.length > 0) {
      const numCalls = calls.length;
      let recComplexity = 'O(n)';
      let recDesc = `recursive function ${fd.name}()`;

      // Analyze argument transformation
      const callContexts = [...bodyWithoutDef.matchAll(new RegExp(`\\b${fd.name}\\s*\\(([^)]*)\\)`, 'g'))];

      let hasNMinus1 = false;
      let hasNDiv2 = false;
      let isTailRecursive = false;

      for (const ctx of callContexts) {
        const args = ctx[1];
        if (/\w+\s*-\s*1|\w+\s*-\s*2/.test(args)) hasNMinus1 = true;
        if (/\w+\s*\/\s*2|\w+\s*>>\s*1|Math\.floor\s*\(\s*\w+\s*\/\s*2\s*\)/.test(args)) hasNDiv2 = true;
      }

      // Check for tail recursion (call is the last thing in the function)
      const bodyTrimmed = bodyWithoutDef.trim();
      const lastSignificantLine = bodyTrimmed.split('\n').filter(l => l.trim() && l.trim() !== '}').pop() || '';
      if (new RegExp(`return\\s+${fd.name}\\s*\\(`).test(lastSignificantLine)) {
        isTailRecursive = true;
      }

      if (numCalls === 1 && hasNDiv2) {
        recComplexity = 'O(log n)';
        recDesc = `recursive call ${fd.name}(n/2) \u2192 O(log n)${isTailRecursive ? ' [tail recursive]' : ''}`;
      } else if (numCalls === 1 && hasNMinus1) {
        recComplexity = 'O(n)';
        recDesc = `recursive call ${fd.name}(n-1) \u2192 O(n)${isTailRecursive ? ' [tail recursive]' : ''}`;
      } else if (numCalls === 2 && hasNMinus1) {
        recComplexity = 'O(2^n)';
        recDesc = `2 recursive calls ${fd.name}(n-1) \u2192 O(2\u207F) exponential`;
      } else if (numCalls === 2 && hasNDiv2) {
        // Check if there is also a loop in the function body (merge sort pattern)
        const hasLoop = /\bfor\s*\(|\bwhile\s*\(|\bfor\s+\w+\s+in\b/.test(bodyWithoutDef);
        if (hasLoop) {
          recComplexity = 'O(n log n)';
          recDesc = `2 recursive calls ${fd.name}(n/2) + loop \u2192 O(n log n) divide-and-conquer`;
        } else {
          recComplexity = 'O(n)';
          recDesc = `2 recursive calls ${fd.name}(n/2) \u2192 O(n) linear`;
        }
      } else if (numCalls >= 3) {
        recComplexity = 'O(2^n)';
        recDesc = `${numCalls} recursive calls \u2192 O(2\u207F) exponential branching`;
      }

      // Stack space from recursion
      if (recComplexity === 'O(log n)') {
        overallSpace = maxComplexity(overallSpace, 'O(log n)');
        constructs.push({ line: fd.startLine, description: `recursion stack depth \u2192 O(log n) space`, complexity: 'O(log n)', type: 'allocation' });
      } else if (recComplexity === 'O(n)' || recComplexity === 'O(n log n)') {
        overallSpace = maxComplexity(overallSpace, isTailRecursive ? 'O(1)' : 'O(n)');
        if (!isTailRecursive) {
          constructs.push({ line: fd.startLine, description: `recursion stack depth \u2192 O(n) space`, complexity: 'O(n)', type: 'allocation' });
        }
      } else if (recComplexity === 'O(2^n)') {
        overallSpace = maxComplexity(overallSpace, 'O(n)');
        constructs.push({ line: fd.startLine, description: `recursion stack depth \u2192 O(n) space (max depth)`, complexity: 'O(n)', type: 'allocation' });
      }

      constructs.push({
        line: fd.startLine,
        description: recDesc,
        complexity: recComplexity,
        type: 'recursion',
      });

      overallTime = maxComplexity(overallTime, recComplexity);
    }
  }

  // ---- Build explanation ----
  const loopConstructs = constructs.filter(c => c.type === 'loop');
  const recConstructs = constructs.filter(c => c.type === 'recursion');
  const allocConstructs = constructs.filter(c => c.type === 'allocation');

  const explanationParts: string[] = [];

  if (loopConstructs.length === 0 && recConstructs.length === 0) {
    explanationParts.push('No loops or recursion detected. The code runs in constant time O(1).');
  } else {
    if (loopConstructs.length > 0) {
      const nested = loopConstructs.filter(c => c.description.includes('nested'));
      const sequential = loopConstructs.filter(c => !c.description.includes('nested'));
      if (nested.length > 0) {
        explanationParts.push(`Found ${nested.length} nested loop(s) contributing to higher complexity. Nested loops multiply their individual complexities.`);
      }
      if (sequential.length > 0) {
        explanationParts.push(`Found ${sequential.length} sequential loop(s). Sequential loops take the maximum complexity (worst case dominates).`);
      }
    }
    if (recConstructs.length > 0) {
      explanationParts.push(`Detected recursion in ${recConstructs.length} function(s). Recursive complexity is determined by the number of branches and problem reduction.`);
    }
  }

  if (allocConstructs.length > 0) {
    explanationParts.push(`Memory allocations detected contributing to ${COMPLEXITY_DISPLAY[overallSpace] || overallSpace} space complexity.`);
  }

  explanationParts.push(`Overall: Time = ${COMPLEXITY_DISPLAY[overallTime] || overallTime}, Space = ${COMPLEXITY_DISPLAY[overallSpace] || overallSpace}.`);

  return {
    timeComplexity: overallTime,
    spaceComplexity: overallSpace,
    className: COMPLEXITY_CLASS_NAMES[overallTime] || 'Unknown',
    constructs: constructs.sort((a, b) => a.line - b.line),
    explanation: explanationParts.join(' '),
    detectedLanguage,
  };
}

/** Extract content inside parentheses starting from a given position in the string */
function extractParenContent(str: string, fromIndex: number): string | null {
  const openIdx = str.indexOf('(', fromIndex);
  if (openIdx === -1) return null;
  let depth = 0;
  let start = openIdx + 1;
  for (let i = openIdx; i < str.length; i++) {
    if (str[i] === '(') depth++;
    if (str[i] === ')') depth--;
    if (depth === 0) return str.substring(start, i);
  }
  return str.substring(start);
}

// ---------------------------------------------------------------------------
// Sample Snippets
// ---------------------------------------------------------------------------

const SAMPLE_SNIPPETS: { title: string; complexity: string; code: string }[] = [
  {
    title: 'Simple Loop',
    complexity: 'O(n)',
    code: `function sumArray(arr) {
  let total = 0;
  for (let i = 0; i < arr.length; i++) {
    total += arr[i];
  }
  return total;
}`,
  },
  {
    title: 'Nested Loops',
    complexity: 'O(n\u00B2)',
    code: `function printPairs(arr) {
  const n = arr.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      console.log(arr[i], arr[j]);
    }
  }
}`,
  },
  {
    title: 'Binary Search',
    complexity: 'O(log n)',
    code: `function binarySearch(arr, target) {
  let low = 0;
  let high = arr.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}`,
  },
  {
    title: 'Merge Sort',
    complexity: 'O(n log n)',
    code: `function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  const result = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) result.push(left[i++]);
    else result.push(right[j++]);
  }
  return result.concat(left.slice(i)).concat(right.slice(j));
}`,
  },
  {
    title: 'Bubble Sort',
    complexity: 'O(n\u00B2)',
    code: `function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}`,
  },
  {
    title: 'Fibonacci (recursive)',
    complexity: 'O(2\u207F)',
    code: `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}`,
  },
  {
    title: 'Matrix Multiply',
    complexity: 'O(n\u00B3)',
    code: `function matrixMultiply(A, B) {
  const n = A.length;
  const C = new Array(n).fill(null).map(() => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      for (let k = 0; k < n; k++) {
        C[i][j] += A[i][k] * B[k][j];
      }
    }
  }
  return C;
}`,
  },
  {
    title: 'Hash Table Lookup',
    complexity: 'O(1)',
    code: `function lookup(map, key) {
  const value = map[key];
  if (value !== undefined) {
    return value;
  }
  return null;
}`,
  },
];

// ---------------------------------------------------------------------------
// Language border color
// ---------------------------------------------------------------------------

function languageBorderColor(lang: string): string {
  switch (lang) {
    case 'JavaScript': return 'border-yellow-400 dark:border-yellow-500';
    case 'Python': return 'border-blue-400 dark:border-blue-500';
    case 'Java': return 'border-orange-400 dark:border-orange-500';
    case 'C/C++': return 'border-purple-400 dark:border-purple-500';
    default: return 'border-gray-300 dark:border-gray-600';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ComplexityAnalyzer: React.FC = () => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<Language>('auto');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = useCallback(() => {
    setError(null);
    try {
      if (!code.trim()) {
        setError('Please paste or type some code to analyze.');
        setResult(null);
        return;
      }
      const analysis = analyzeComplexity(code, language === 'auto' ? undefined : language);
      setResult(analysis);
    } catch (e: unknown) {
      setError(`Analysis failed: ${e instanceof Error ? e.message : 'Unknown error occurred. Please check your code and try again.'}`);
      setResult(null);
    }
  }, [code, language]);

  const handleClear = useCallback(() => {
    setCode('');
    setResult(null);
    setError(null);
  }, []);

  const handleLoadSnippet = useCallback((snippet: typeof SAMPLE_SNIPPETS[0]) => {
    setCode(snippet.code);
    setResult(null);
    setError(null);
  }, []);

  const lineCount = code.split('\n').length;
  const detectedLang = language === 'auto' ? detectLanguage(code) : ({ javascript: 'JavaScript', python: 'Python', java: 'Java', cpp: 'C/C++' }[language] || 'Unknown');

  const constructIcon = (type: Construct['type']) => {
    switch (type) {
      case 'loop': return <Zap className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />;
      case 'recursion': return <Code className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />;
      case 'allocation': return <Database className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />;
      case 'conditional': return <ChevronRight className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />;
    }
  };

  return (
    <div className="h-full flex bg-gradient-to-br from-gray-100 to-indigo-100 dark:from-gray-950 dark:to-indigo-950 p-3 overflow-hidden">
      {/* Left Side - Code Editor + Results (60%) */}
      <div className="flex-1 flex flex-col min-w-0 mr-3" style={{ flex: '1 1 60%' }}>
        {/* Code Editor */}
        <div className="flex flex-col mb-3" style={{ flex: '0 0 45%' }}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Code Editor</span>
              {code.trim() && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  detectedLang === 'JavaScript' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' :
                  detectedLang === 'Python' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' :
                  detectedLang === 'Java' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' :
                  detectedLang === 'C/C++' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400' :
                  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {detectedLang}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">{lineCount} line{lineCount !== 1 ? 's' : ''}</span>
          </div>

          <div className={`flex-1 flex bg-white/80 dark:bg-gray-900 border-2 rounded-lg overflow-hidden transition-colors ${languageBorderColor(code.trim() ? detectedLang : '')}`}>
            {/* Line Numbers */}
            <div className="flex-shrink-0 select-none bg-gray-50 dark:bg-gray-900/80 border-r border-gray-200 dark:border-gray-800 px-2 pt-3 pb-2 overflow-hidden">
              {Array.from({ length: Math.max(lineCount, 15) }, (_, i) => (
                <div key={i} className="text-right text-xs font-mono leading-5 text-gray-400 dark:text-gray-600" style={{ height: '20px' }}>
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Textarea */}
            <textarea
              value={code}
              onChange={(e) => { setCode(e.target.value); setResult(null); setError(null); }}
              placeholder="Paste your code here..."
              spellCheck={false}
              className="flex-1 p-3 text-sm font-mono leading-5 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 outline-none resize-none"
              style={{ lineHeight: '20px', tabSize: 2 }}
            />
          </div>
        </div>

        {/* Analysis Results */}
        <div className="flex-1 min-h-0 overflow-auto">
          {error && (
            <div className="p-3 mb-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              {/* Summary Box */}
              <div className={`p-4 rounded-lg border ${complexityBgClass(result.timeComplexity)}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Time Complexity</div>
                    <div className={`text-3xl font-bold font-mono ${complexityColorClass(result.timeComplexity)}`}>
                      {COMPLEXITY_DISPLAY[result.timeComplexity] || result.timeComplexity}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Space Complexity</div>
                    <div className={`text-2xl font-bold font-mono ${complexityColorClass(result.spaceComplexity)}`}>
                      {COMPLEXITY_DISPLAY[result.spaceComplexity] || result.spaceComplexity}
                    </div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{result.className}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">| Detected: {result.detectedLanguage}</span>
                </div>
              </div>

              {/* Complexity Scale */}
              <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Complexity Scale</div>
                <div className="flex items-center gap-0.5">
                  {COMPLEXITY_ORDER.map((c) => {
                    const isActive = c === result.timeComplexity;
                    const color = complexityColor(c);
                    return (
                      <div key={c} className="flex-1 flex flex-col items-center">
                        <div
                          className={`w-full h-3 rounded-sm transition-all ${isActive ? 'ring-2 ring-offset-1 ring-offset-white dark:ring-offset-gray-900 scale-y-150' : 'opacity-40'}`}
                          style={{ backgroundColor: color, ...(isActive ? { boxShadow: `0 0 8px ${color}` } : {}) }}
                          title={COMPLEXITY_DISPLAY[c] || c}
                        />
                        <div className={`text-[9px] mt-1 font-mono whitespace-nowrap ${isActive ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>
                          {COMPLEXITY_DISPLAY[c] || c}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detected Constructs */}
              {result.constructs.length > 0 && (
                <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Detected Constructs</div>
                  <div className="space-y-1.5">
                    {result.constructs.map((c, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        {constructIcon(c.type)}
                        <span className="text-gray-500 dark:text-gray-400 font-mono text-xs min-w-[48px]">
                          Line {c.line}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300 flex-1">{c.description}</span>
                        <span className={`font-mono text-xs font-semibold ${complexityColorClass(c.complexity)}`}>
                          {COMPLEXITY_DISPLAY[c.complexity] || c.complexity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Explanation */}
              <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Explanation</div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{result.explanation}</p>
              </div>
            </div>
          )}

          {!result && !error && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
              <Zap className="w-10 h-10 mb-3 opacity-40" />
              <div className="text-sm font-medium">Paste code and click Analyze</div>
              <div className="text-xs mt-1">Supports JavaScript, Python, Java, C/C++</div>
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Controls + Snippets (220px) */}
      <div className="flex-shrink-0 flex flex-col gap-3 overflow-auto" style={{ width: 220 }}>
        {/* Controls */}
        <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Controls</div>

          <button
            onClick={handleAnalyze}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 mb-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg transition-colors disabled:opacity-50"
            disabled={!code.trim()}
          >
            <Play className="w-4 h-4" />
            Analyze
          </button>

          <button
            onClick={handleClear}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 mb-3 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>

          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Language</div>
          <select
            value={language}
            onChange={(e) => { setLanguage(e.target.value as Language); setResult(null); }}
            className="w-full px-2 py-1.5 text-sm rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 outline-none"
          >
            <option value="auto">Auto-detect</option>
            <option value="javascript">JavaScript / TS</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C / C++</option>
          </select>
        </div>

        {/* Sample Snippets */}
        <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Sample Snippets</div>
          <div className="space-y-1">
            {SAMPLE_SNIPPETS.map((snippet, i) => (
              <button
                key={i}
                onClick={() => handleLoadSnippet(snippet)}
                className="w-full flex items-center justify-between gap-1 px-2 py-1.5 text-left text-xs rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors group"
              >
                <span className="text-gray-700 dark:text-gray-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 truncate">
                  {snippet.title}
                </span>
                <span className={`font-mono font-semibold flex-shrink-0 ${
                  complexityColorClass(
                    COMPLEXITY_ORDER.find(o => (COMPLEXITY_DISPLAY[o] || o) === snippet.complexity) || 'O(n)'
                  )
                }`}>
                  {snippet.complexity}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Complexity Legend</div>
          <div className="space-y-1">
            {[
              { label: 'Excellent', classes: 'O(1), O(log n)', color: 'bg-green-500' },
              { label: 'Good', classes: 'O(n)', color: 'bg-blue-500' },
              { label: 'Fair', classes: 'O(n log n)', color: 'bg-yellow-500' },
              { label: 'Poor', classes: 'O(n\u00B2), O(n\u00B3)', color: 'bg-orange-500' },
              { label: 'Bad', classes: 'O(2\u207F), O(n!)', color: 'bg-red-500' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-xs">
                <div className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${item.color}`} />
                <span className="text-gray-700 dark:text-gray-300 font-medium">{item.label}</span>
                <span className="text-gray-400 dark:text-gray-500 font-mono ml-auto text-[10px]">{item.classes}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] leading-relaxed text-gray-500 dark:text-gray-400">
              This is a static rule-based analyzer. It detects common patterns like loops, recursion, and allocations to estimate complexity. It does not execute code. Results are approximations for typical patterns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
