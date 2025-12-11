/**
 * Terminal Shell - Command execution engine
 * Based on kernel/userland/repl.py
 */

import { VirtualFileSystem, FileNode } from './VirtualFileSystem';
import { getSharedVFS } from './SharedVFS';

export interface CommandOutput {
  text: string;
  isError?: boolean;
}

export class TerminalShell {
  private vfs: VirtualFileSystem;
  private currentDir: string;
  private variables: Map<string, string>;
  private history: string[];
  private startTime: number;
  private commandCount: number;

  constructor() {
    this.vfs = getSharedVFS();
    this.currentDir = '/';
    this.variables = new Map();
    this.history = [];
    this.startTime = Date.now();
    this.commandCount = 0;
  }

  getPrompt(): string {
    return `minios:${this.currentDir}$ `;
  }

  executeCommand(line: string): CommandOutput {
    line = line.trim();
    if (!line) return { text: '' };

    this.history.push(line);
    this.commandCount++;

    // Variable assignment
    if (line.includes('=') && !line.startsWith(' ')) {
      const [varName, ...valueParts] = line.split('=');
      if (varName && !varName.includes(' ')) {
        this.variables.set(varName.trim(), valueParts.join('=').trim());
        return { text: '' };
      }
    }

    // Variable substitution
    for (const [key, value] of this.variables) {
      line = line.replace(new RegExp(`\\$${key}`, 'g'), value);
    }

    const tokens = line.split(/\s+/);
    const cmd = tokens[0];
    const args = tokens.slice(1);

    const commands: Record<string, (args: string[]) => CommandOutput> = {
      help: this.cmdHelp.bind(this),
      ls: this.cmdLs.bind(this),
      cat: this.cmdCat.bind(this),
      pwd: this.cmdPwd.bind(this),
      cd: this.cmdCd.bind(this),
      mkdir: this.cmdMkdir.bind(this),
      touch: this.cmdTouch.bind(this),
      rm: this.cmdRm.bind(this),
      write: this.cmdWrite.bind(this),
      tree: this.cmdTree.bind(this),
      echo: this.cmdEcho.bind(this),
      clear: this.cmdClear.bind(this),
      history: this.cmdHistory.bind(this),
      env: this.cmdEnv.bind(this),
      set: this.cmdSet.bind(this),
      unset: this.cmdUnset.bind(this),
      uptime: this.cmdUptime.bind(this),
      date: this.cmdDate.bind(this),
      whoami: this.cmdWhoami.bind(this),
      uname: this.cmdUname.bind(this),
      mem: this.cmdMem.bind(this),
      sysinfo: this.cmdSysinfo.bind(this),
      ps: this.cmdPs.bind(this),
    };

    if (commands[cmd]) {
      return commands[cmd](args);
    } else {
      return { text: `Command not found: ${cmd}`, isError: true };
    }
  }

  private cmdHelp(args: string[]): CommandOutput {
    return {
      text: `Available commands:

File System:
  ls [-l] [path]       - List directory contents
  cat <file>           - Display file contents
  pwd                  - Print working directory
  cd <path>            - Change directory
  mkdir <dir>          - Create directory
  touch <file>         - Create empty file
  rm <file>            - Remove file
  write <file> <text>  - Write text to file
  tree [path]          - Display directory tree

System Info:
  ps                   - List processes
  mem                  - Show memory usage
  uptime               - Show system uptime
  date                 - Show current date/time
  whoami               - Show current user
  uname                - Show system information
  sysinfo              - Show detailed system info

Shell:
  echo <text>          - Echo text to console
  history              - Show command history
  env                  - Show environment variables
  set <var> <value>    - Set variable
  unset <var>          - Unset variable
  clear                - Clear screen
  help                 - Show this help message

Shell Features:
  • Variable assignment: VAR=value
  • Variable substitution: $VAR
  • Command history: Use up/down arrows
`
    };
  }

  private cmdLs(args: string[]): CommandOutput {
    const showLong = args.includes('-l');
    const path = args.find(a => !a.startsWith('-')) || this.currentDir;
    const fullPath = this.resolvePath(path);

    const entries = this.vfs.listDir(fullPath);
    if (!entries) {
      return { text: `ls: cannot access '${path}': No such directory`, isError: true };
    }

    if (showLong) {
      let output = `Directory: ${fullPath}\n\n`;
      output += 'Name                Type    Size\n';
      output += '─'.repeat(40) + '\n';
      
      for (const entry of entries.sort()) {
        const node = this.vfs.resolvePath(`${fullPath}/${entry}`);
        if (node) {
          const type = node.isDir ? 'DIR' : 'FILE';
          const size = node.isDir ? '-' : node.content.length.toString();
          output += `${entry.padEnd(20)} ${type.padEnd(7)} ${size}\n`;
        }
      }
      return { text: output };
    } else {
      return { text: entries.sort().map(e => {
        const node = this.vfs.resolvePath(`${fullPath}/${e}`);
        return node?.isDir ? `${e}/` : e;
      }).join('  ') };
    }
  }

  private cmdCat(args: string[]): CommandOutput {
    if (args.length === 0) {
      return { text: 'cat: missing file operand', isError: true };
    }

    const path = this.resolvePath(args[0]);
    const content = this.vfs.readFile(path);

    if (content === null) {
      return { text: `cat: ${args[0]}: No such file`, isError: true };
    }

    return { text: content };
  }

  private cmdPwd(args: string[]): CommandOutput {
    return { text: this.currentDir };
  }

  private cmdCd(args: string[]): CommandOutput {
    if (args.length === 0) {
      this.currentDir = '/';
      return { text: '' };
    }

    const path = this.resolvePath(args[0]);
    const node = this.vfs.resolvePath(path);

    if (!node || !node.isDir) {
      return { text: `cd: ${args[0]}: No such directory`, isError: true };
    }

    this.currentDir = path;
    return { text: '' };
  }

  private cmdMkdir(args: string[]): CommandOutput {
    if (args.length === 0) {
      return { text: 'mkdir: missing operand', isError: true };
    }

    const path = this.resolvePath(args[0]);
    if (this.vfs.mkdir(path)) {
      return { text: `Created directory: ${args[0]}` };
    } else {
      return { text: `mkdir: cannot create directory '${args[0]}'`, isError: true };
    }
  }

  private cmdTouch(args: string[]): CommandOutput {
    if (args.length === 0) {
      return { text: 'touch: missing file operand', isError: true };
    }

    const path = this.resolvePath(args[0]);
    if (this.vfs.writeFile(path, '')) {
      return { text: `Created file: ${args[0]}` };
    } else {
      return { text: `touch: cannot touch '${args[0]}'`, isError: true };
    }
  }

  private cmdRm(args: string[]): CommandOutput {
    if (args.length === 0) {
      return { text: 'rm: missing operand', isError: true };
    }

    const path = this.resolvePath(args[0]);
    if (this.vfs.remove(path)) {
      return { text: `Removed: ${args[0]}` };
    } else {
      return { text: `rm: cannot remove '${args[0]}'`, isError: true };
    }
  }

  private cmdWrite(args: string[]): CommandOutput {
    if (args.length < 2) {
      return { text: 'write: usage: write <file> <text>', isError: true };
    }

    const filename = args[0];
    const text = args.slice(1).join(' ');
    const path = this.resolvePath(filename);

    if (this.vfs.writeFile(path, text)) {
      return { text: `Wrote ${text.length} bytes to ${filename}` };
    } else {
      return { text: `write: cannot write to '${filename}'`, isError: true };
    }
  }

  private cmdTree(args: string[]): CommandOutput {
    const path = args[0] ? this.resolvePath(args[0]) : this.currentDir;
    const node = this.vfs.resolvePath(path);

    if (!node) {
      return { text: `tree: ${path}: No such directory`, isError: true };
    }

    let output = `${path}\n`;
    output += this.buildTree(node, '');
    return { text: output };
  }

  private buildTree(node: FileNode, prefix: string): string {
    if (!node.isDir) return '';

    let output = '';
    const entries = Array.from(node.children.entries()).sort();

    entries.forEach(([name, child], index) => {
      const isLast = index === entries.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      const newPrefix = prefix + (isLast ? '    ' : '│   ');

      output += `${prefix}${connector}${name}${child.isDir ? '/' : ''}\n`;
      if (child.isDir) {
        output += this.buildTree(child, newPrefix);
      }
    });

    return output;
  }

  private cmdEcho(args: string[]): CommandOutput {
    return { text: args.join(' ') };
  }

  private cmdClear(args: string[]): CommandOutput {
    return { text: '\x1B[CLEAR]' }; // Special marker for clearing
  }

  private cmdHistory(args: string[]): CommandOutput {
    let output = 'Command History:\n\n';
    this.history.forEach((cmd, i) => {
      output += `${(i + 1).toString().padStart(4)}  ${cmd}\n`;
    });
    return { text: output };
  }

  private cmdEnv(args: string[]): CommandOutput {
    if (this.variables.size === 0) {
      return { text: 'No environment variables set' };
    }

    let output = 'Environment Variables:\n\n';
    for (const [key, value] of this.variables) {
      output += `${key}=${value}\n`;
    }
    return { text: output };
  }

  private cmdSet(args: string[]): CommandOutput {
    if (args.length < 2) {
      return { text: 'set: usage: set <var> <value>', isError: true };
    }

    const varName = args[0];
    const value = args.slice(1).join(' ');
    this.variables.set(varName, value);
    return { text: `Set ${varName}=${value}` };
  }

  private cmdUnset(args: string[]): CommandOutput {
    if (args.length === 0) {
      return { text: 'unset: missing variable name', isError: true };
    }

    const varName = args[0];
    if (this.variables.has(varName)) {
      this.variables.delete(varName);
      return { text: `Unset ${varName}` };
    } else {
      return { text: `unset: ${varName}: not set`, isError: true };
    }
  }

  private cmdUptime(args: string[]): CommandOutput {
    const uptimeSeconds = (Date.now() - this.startTime) / 1000;
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);

    return {
      text: `Uptime: ${hours}h ${minutes}m ${seconds}s\nCommands executed: ${this.commandCount}`
    };
  }

  private cmdDate(args: string[]): CommandOutput {
    return { text: new Date().toString() };
  }

  private cmdWhoami(args: string[]): CommandOutput {
    return { text: 'root' };
  }

  private cmdUname(args: string[]): CommandOutput {
    return { text: 'MiniOS 2.0 (Simulator Mode)' };
  }

  private cmdMem(args: string[]): CommandOutput {
    const totalMB = 4096;
    const usedMB = Math.floor(Math.random() * 1024);
    const freeMB = totalMB - usedMB;
    const usagePercent = ((usedMB / totalMB) * 100).toFixed(1);

    return {
      text: `Memory Usage:

Total Memory: ${totalMB} MB
Used Memory:  ${usedMB} MB
Free Memory:  ${freeMB} MB
Usage:        ${usagePercent}%`
    };
  }

  private cmdSysinfo(args: string[]): CommandOutput {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);

    return {
      text: `╔════════════════════════════════════════╗
║  MiniOS System Information            ║
╚════════════════════════════════════════╝

OS Name:           MiniOS
Version:           2.0
Mode:              Simulator Mode
Kernel:            TypeScript-based
Shell:             Terminal v2.0
User:              root
Working Directory: ${this.currentDir}
Commands Executed: ${this.commandCount}
Uptime:            ${uptimeSeconds}s`
    };
  }

  private cmdPs(args: string[]): CommandOutput {
    return {
      text: `PID  CMD
1    init (terminal)`
    };
  }

  private resolvePath(path: string): string {
    if (path.startsWith('/')) return path;

    // Resolve relative path
    const parts = this.currentDir.split('/').filter(p => p);
    const pathParts = path.split('/');

    for (const part of pathParts) {
      if (part === '..') {
        parts.pop();
      } else if (part && part !== '.') {
        parts.push(part);
      }
    }

    return '/' + parts.join('/');
  }

  getHistory(): string[] {
    return [...this.history];
  }

  getVFS(): VirtualFileSystem {
    return this.vfs;
  }
}
