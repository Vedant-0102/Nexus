/**
 * Virtual File System - In-memory file system
 * Based on kernel/kernel/vfs.py
 */

export class FileNode {
  name: string;
  isDir: boolean;
  content: string;
  children: Map<string, FileNode>;

  constructor(name: string, isDir: boolean = false, content: string = '') {
    this.name = name;
    this.isDir = isDir;
    this.content = content;
    this.children = new Map();
  }
}

export class VirtualFileSystem {
  private root: FileNode;
  private openFiles: Map<number, FileNode>;
  private nextFd: number;

  constructor() {
    this.openFiles = new Map();
    this.nextFd = 3; // 0, 1, 2 reserved for stdin, stdout, stderr
    
    // Try to load from localStorage
    const saved = this.loadFromStorage();
    if (saved) {
      this.root = saved;
    } else {
      this.root = new FileNode('/', true);
      this.initializeDefaultFiles();
      this.saveToStorage();
    }
  }

  private loadFromStorage(): FileNode | null {
    try {
      const data = localStorage.getItem('terminal_vfs');
      if (!data) return null;
      return this.deserialize(JSON.parse(data));
    } catch {
      return null;
    }
  }

  private saveToStorage(): void {
    try {
      const data = this.serialize(this.root);
      localStorage.setItem('terminal_vfs', JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save VFS:', e);
    }
  }

  private serialize(node: FileNode): any {
    const obj: any = {
      name: node.name,
      isDir: node.isDir,
      content: node.content,
      children: {}
    };

    for (const [key, child] of node.children) {
      obj.children[key] = this.serialize(child);
    }

    return obj;
  }

  private deserialize(data: any): FileNode {
    const node = new FileNode(data.name, data.isDir, data.content);
    
    if (data.children) {
      for (const [key, childData] of Object.entries(data.children)) {
        node.children.set(key, this.deserialize(childData));
      }
    }

    return node;
  }

  private initializeDefaultFiles(): void {
    // Create default directories
    this.mkdir('/home');
    this.mkdir('/etc');
    this.mkdir('/tmp');
    this.mkdir('/var');
    
    // Create some default files
    this.writeFile('/etc/hostname', 'minios');
    this.writeFile('/etc/version', 'MiniOS 2.0');
    this.writeFile('/home/welcome.txt', 'Welcome to MiniOS!\n\nType "help" to see available commands.');
    this.writeFile('/home/readme.md', '# MiniOS\n\nAn educational operating system simulator.\n\n## Features\n- Virtual file system\n- Shell commands\n- Memory management\n');
  }

  resolvePath(path: string): FileNode | null {
    if (path === '/') return this.root;

    const parts = path.split('/').filter(p => p);
    let current = this.root;

    for (const part of parts) {
      if (!current.isDir || !current.children.has(part)) {
        return null;
      }
      current = current.children.get(part)!;
    }

    return current;
  }

  listDir(path: string): string[] | null {
    const node = this.resolvePath(path);
    if (!node || !node.isDir) return null;
    return Array.from(node.children.keys());
  }

  mkdir(path: string): boolean {
    const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
    const dirName = path.substring(path.lastIndexOf('/') + 1);

    const parent = this.resolvePath(parentPath);
    if (!parent || !parent.isDir) return false;
    if (parent.children.has(dirName)) return false;

    parent.children.set(dirName, new FileNode(dirName, true));
    this.saveToStorage();
    return true;
  }

  writeFile(path: string, content: string): boolean {
    const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
    const fileName = path.substring(path.lastIndexOf('/') + 1);

    const parent = this.resolvePath(parentPath);
    if (!parent || !parent.isDir) return false;

    if (parent.children.has(fileName)) {
      const file = parent.children.get(fileName)!;
      if (file.isDir) return false;
      file.content = content;
    } else {
      parent.children.set(fileName, new FileNode(fileName, false, content));
    }

    this.saveToStorage();
    return true;
  }

  readFile(path: string): string | null {
    const node = this.resolvePath(path);
    if (!node || node.isDir) return null;
    return node.content;
  }

  remove(path: string): boolean {
    const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
    const name = path.substring(path.lastIndexOf('/') + 1);

    const parent = this.resolvePath(parentPath);
    if (!parent || !parent.isDir) return false;
    if (!parent.children.has(name)) return false;

    parent.children.delete(name);
    this.saveToStorage();
    return true;
  }

  open(path: string): number {
    const node = this.resolvePath(path);
    if (!node || node.isDir) return -1;

    const fd = this.nextFd++;
    this.openFiles.set(fd, node);
    return fd;
  }

  read(fd: number): string | null {
    const node = this.openFiles.get(fd);
    if (!node) return null;
    return node.content;
  }

  close(fd: number): boolean {
    return this.openFiles.delete(fd);
  }
}
