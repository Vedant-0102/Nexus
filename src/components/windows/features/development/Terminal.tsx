import React, { useState, useEffect, useRef } from 'react';
import { TerminalShell } from '../terminal/TerminalShell';

interface TerminalLine {
  type: 'input' | 'output' | 'error';
  content: string;
}

// Global shell instance - persists across component remounts
let globalShell: TerminalShell | null = null;
let globalLines: TerminalLine[] | null = null;

const getShell = () => {
  if (!globalShell) {
    globalShell = new TerminalShell();
  }
  return globalShell;
};

const getInitialLines = (): TerminalLine[] => {
  if (globalLines) {
    return globalLines;
  }
  return [
    {
      type: 'output',
      content: `╔════════════════════════════════════════╗
║  MiniOS Terminal v2.0                 ║
║  Educational Operating System         ║
╚════════════════════════════════════════╝

Type 'help' for available commands
Type 'sysinfo' for system information

`
    }
  ];
};

export const Terminal: React.FC = () => {
  const [shell] = useState(() => getShell());
  const [lines, setLines] = useState<TerminalLine[]>(() => getInitialLines());
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Save lines to global state whenever they change
  useEffect(() => {
    globalLines = lines;
  }, [lines]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;

    // Add input line
    setLines(prev => [...prev, {
      type: 'input',
      content: `${shell.getPrompt()}${input}`
    }]);

    // Execute command
    const result = shell.executeCommand(input);

    // Handle clear command
    if (result.text === '\x1B[CLEAR]') {
      setLines([]);
    } else if (result.text) {
      setLines(prev => [...prev, {
        type: result.isError ? 'error' : 'output',
        content: result.text
      }]);
    }

    setInput('');
    setHistoryIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const history = shell.getHistory();

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black text-green-400 font-mono overflow-hidden">
      {/* Terminal Output */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-4 space-y-1"
        onClick={() => inputRef.current?.focus()}
      >
        {lines.map((line, index) => (
          <div
            key={index}
            className={`whitespace-pre-wrap ${
              line.type === 'input'
                ? 'text-green-400'
                : line.type === 'error'
                ? 'text-red-400'
                : 'text-gray-300'
            }`}
          >
            {line.content}
          </div>
        ))}

        {/* Current Input Line */}
        <form onSubmit={handleSubmit} className="flex items-center">
          <span className="text-green-400 mr-2">{shell.getPrompt()}</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-green-400 caret-green-400"
            autoFocus
            spellCheck={false}
          />
        </form>
      </div>

      {/* Status Bar */}
      <div className="px-4 py-1 bg-gray-900 border-t border-gray-700 text-xs text-gray-500 flex justify-between">
        <span>MiniOS Terminal v2.0</span>
        <span>Ctrl+L: Clear | ↑↓: History | Type 'help' for commands</span>
      </div>
    </div>
  );
};
