import React, { useState, useEffect } from 'react';
import { Folder, File, FolderOpen, Home, RefreshCw, Plus, Trash2, Edit, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileNode } from '../terminal/VirtualFileSystem';
import { getSharedVFS } from '../terminal/SharedVFS';

export const FileManager: React.FC = () => {
  const [vfs] = useState(() => getSharedVFS());
  const [currentPath, setCurrentPath] = useState('/home');
  const [currentNode, setCurrentNode] = useState<FileNode | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showNewDialog, setShowNewDialog] = useState<'file' | 'folder' | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [editingFile, setEditingFile] = useState<{ name: string; content: string } | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadCurrentPath();
  }, [currentPath, refreshTrigger]);

  const loadCurrentPath = () => {
    const node = vfs.resolvePath(currentPath);
    setCurrentNode(node);
    setSelectedItem(null);
  };

  const refresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const navigateTo = (name: string) => {
    const newPath = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;
    setCurrentPath(newPath);
  };

  const goUp = () => {
    if (currentPath === '/') return;
    const newPath = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
    setCurrentPath(newPath);
  };

  const goHome = () => {
    setCurrentPath('/home');
  };

  const createNew = () => {
    if (!newItemName.trim()) return;

    const fullPath = currentPath === '/' ? `/${newItemName}` : `${currentPath}/${newItemName}`;
    
    if (showNewDialog === 'folder') {
      vfs.mkdir(fullPath);
    } else {
      vfs.writeFile(fullPath, '');
    }

    refresh();
    setShowNewDialog(null);
    setNewItemName('');
  };

  const deleteItem = (name: string) => {
    if (!confirm(`Delete ${name}?`)) return;
    
    const fullPath = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;
    vfs.remove(fullPath);
    refresh();
  };

  const openFile = (name: string) => {
    const fullPath = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;
    const content = vfs.readFile(fullPath);
    if (content !== null) {
      setEditingFile({ name, content });
    }
  };

  const saveFile = () => {
    if (!editingFile) return;
    
    const fullPath = currentPath === '/' ? `/${editingFile.name}` : `${currentPath}/${editingFile.name}`;
    vfs.writeFile(fullPath, editingFile.content);
    setEditingFile(null);
    refresh();
  };

  const downloadFile = (name: string) => {
    const node = currentNode?.children.get(name);
    if (!node || node.isDir) return;

    const blob = new Blob([node.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!currentNode) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  const items = Array.from(currentNode.children.entries()).sort((a, b) => {
    if (a[1].isDir === b[1].isDir) return a[0].localeCompare(b[0]);
    return a[1].isDir ? -1 : 1;
  });

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <Button onClick={goUp} variant="outline" size="sm" disabled={currentPath === '/'}>
          ←
        </Button>
        <Button onClick={goHome} variant="outline" size="sm">
          <Home size={14} />
        </Button>
        <Button onClick={refresh} variant="outline" size="sm">
          <RefreshCw size={14} />
        </Button>
        
        <div className="flex-1 px-3 py-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-sm">
          {currentPath}
        </div>

        <Button onClick={() => setShowNewDialog('folder')} variant="outline" size="sm">
          <Plus size={14} className="mr-1" />
          Folder
        </Button>
        <Button onClick={() => setShowNewDialog('file')} variant="outline" size="sm">
          <Plus size={14} className="mr-1" />
          File
        </Button>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-auto p-4">
        {items.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Folder size={48} className="mx-auto mb-2 opacity-50" />
            <p>This folder is empty</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-4 gap-4' : 'space-y-1'}>
            {items.map(([name, node]) => (
              <div
                key={name}
                className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                  selectedItem === name
                    ? 'bg-blue-100 dark:bg-blue-900'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                onClick={() => setSelectedItem(name)}
                onDoubleClick={() => node.isDir ? navigateTo(name) : openFile(name)}
              >
                {node.isDir ? (
                  <FolderOpen size={20} className="text-yellow-500" />
                ) : (
                  <File size={20} className="text-blue-500" />
                )}
                <span className="flex-1 text-sm text-gray-900 dark:text-gray-100 truncate">
                  {name}
                </span>
                {!node.isDir && (
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadFile(name);
                      }}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                      title="Download"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteItem(name);
                      }}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-500"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
                {node.isDir && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteItem(name);
                    }}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-500"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">
        {items.length} item(s) | Double-click to open
      </div>

      {/* New Item Dialog */}
      {showNewDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">
              Create New {showNewDialog === 'folder' ? 'Folder' : 'File'}
            </h3>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createNew()}
              placeholder={`Enter ${showNewDialog} name`}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button onClick={() => { setShowNewDialog(null); setNewItemName(''); }} variant="outline">
                Cancel
              </Button>
              <Button onClick={createNew} disabled={!newItemName.trim()}>
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* File Editor Dialog */}
      {editingFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[600px] h-[500px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Edit size={20} />
                {editingFile.name}
              </h3>
              <button
                onClick={() => setEditingFile(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <textarea
              value={editingFile.content}
              onChange={(e) => setEditingFile({ ...editingFile, content: e.target.value })}
              className="flex-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm resize-none"
              placeholder="Enter file content..."
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button onClick={() => setEditingFile(null)} variant="outline">
                Cancel
              </Button>
              <Button onClick={saveFile}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
