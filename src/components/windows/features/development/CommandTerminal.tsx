
import React, { useState, useEffect, useRef } from 'react';
import { useWindows } from '../../context/WindowsContext';

type Command = {
  command: string;
  response: React.ReactNode;
};

export const CommandTerminal: React.FC = () => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<Command[]>([
    { command: '', response: 'Win11 Terminal [Version 1.0.0]\n(c) 2025 Portfolio OS. All rights reserved.\n' }
  ]);
  const { windows } = useWindows();
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const executeCommand = (cmd: string) => {
    const command = cmd.trim().toLowerCase();
    let response: React.ReactNode;

    switch (command) {
      case 'help':
        response = (
          <div className="py-1">
            <p>Available commands:</p>
            <ul className="pl-4 space-y-1">
              <li><strong>whoami</strong> - Display user information</li>
              <li><strong>skills</strong> - List technical skills</li>
              <li><strong>projects</strong> - Show portfolio projects</li>
              <li><strong>clear</strong> - Clear the terminal</li>
              <li><strong>date</strong> - Show current date and time</li>
              <li><strong>apps</strong> - List running applications</li>
              <li><strong>theme</strong> - Show current theme</li>
              <li><strong>echo [text]</strong> - Print text to the terminal</li>
              <li><strong>help</strong> - Display this help message</li>
            </ul>
          </div>
        );
        break;
        
      case 'clear':
        setHistory([]);
        return;
        
      case 'whoami':
        response = 'Developer - Frontend and Backend web developer with a passion for creating interactive applications.';
        break;
        
      case 'skills':
        response = (
          <div className="py-1">
            <p>Technical Skills:</p>
            <ul className="pl-4">
              <li>Frontend: React, TypeScript, Tailwind CSS</li>
              <li>Backend: Node.js, Express, Python</li>
              <li>Database: SQL, NoSQL, PostgreSQL, MongoDB</li>
              <li>Tools: Git, Docker, CI/CD</li>
              <li>Cloud: AWS, Vercel, Netlify</li>
            </ul>
          </div>
        );
        break;
        
      case 'projects':
        response = (
          <div className="py-1">
            <p>Portfolio Projects:</p>
            <ul className="pl-4">
              <li>Windows 11 Portfolio Interface - Interactive UI with modern features</li>
              <li>E-commerce Platform - Full-stack web application with payment processing</li>
              <li>Task Management System - Collaborative tool with real-time updates</li>
              <li>Data Visualization Dashboard - Interactive charts and analytics</li>
            </ul>
          </div>
        );
        break;
        
      case 'date':
        response = new Date().toString();
        break;
        
      case 'apps':
        const runningApps = windows.filter(w => w.isOpen).map(w => w.title).join(', ');
        response = `Running applications: ${runningApps || 'None'}`;
        break;
        
      case 'theme':
        response = 'Current theme: System default (Changes based on system preferences)';
        break;
        
      default:
        if (command.startsWith('echo ')) {
          response = command.substring(5);
        } else if (command === '') {
          response = '';
        } else {
          response = `'${command}' is not recognized as a command. Type 'help' for a list of commands.`;
        }
    }

    setHistory(prev => [...prev, { command: cmd, response }]);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(input);
    }
  };

  // Auto-scroll to bottom when history changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="p-4 h-full flex flex-col">
      <h2 className="text-2xl font-semibold mb-4">Terminal</h2>
      
      <div 
        className="flex-1 bg-gray-900 text-green-400 font-mono p-4 rounded-md overflow-y-auto"
        ref={terminalRef}
      >
        {history.map((entry, index) => (
          <div key={index}>
            {entry.command && (
              <p className="mb-1">
                <span className="text-green-600">user@portfolio-os</span>
                <span className="text-white">:</span>
                <span className="text-blue-400">~</span>
                <span className="text-white">$ </span>
                {entry.command}
              </p>
            )}
            <div className="mb-4 whitespace-pre-wrap">{entry.response}</div>
          </div>
        ))}
        
        <div className="flex">
          <span className="text-green-600">user@portfolio-os</span>
          <span className="text-white">:</span>
          <span className="text-blue-400">~</span>
          <span className="text-white">$ </span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-transparent border-none outline-none flex-1 text-green-400 font-mono"
            autoFocus
          />
        </div>
      </div>
    </div>
  );
};
