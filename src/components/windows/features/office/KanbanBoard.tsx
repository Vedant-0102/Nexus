import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, MoreVertical, Calendar, Tag, User, Clock, CheckSquare, Archive, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  tags: string[];
  assignee?: string;
  checklist: { id: string; text: string; completed: boolean }[];
  createdAt: Date;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
  color: string;
}

interface Board {
  id: string;
  name: string;
  columns: Column[];
}

export const KanbanBoard: React.FC = () => {
  const [boards, setBoards] = useState<Board[]>([
    {
      id: '1',
      name: 'My Project',
      columns: [
        {
          id: 'todo',
          title: 'To Do',
          color: '#94a3b8',
          tasks: [
            {
              id: '1',
              title: 'Design landing page',
              description: 'Create mockups for the new landing page',
              priority: 'high',
              dueDate: '2024-12-15',
              tags: ['design', 'ui'],
              assignee: 'John',
              checklist: [
                { id: '1', text: 'Research competitors', completed: true },
                { id: '2', text: 'Create wireframes', completed: false }
              ],
              createdAt: new Date()
            }
          ]
        },
        {
          id: 'inprogress',
          title: 'In Progress',
          color: '#3b82f6',
          tasks: [
            {
              id: '2',
              title: 'Implement authentication',
              description: 'Add login and signup functionality',
              priority: 'high',
              tags: ['backend', 'security'],
              checklist: [],
              createdAt: new Date()
            }
          ]
        },
        {
          id: 'review',
          title: 'Review',
          color: '#f59e0b',
          tasks: []
        },
        {
          id: 'done',
          title: 'Done',
          color: '#10b981',
          tasks: []
        }
      ]
    }
  ]);

  const [activeBoardId, setActiveBoardId] = useState('1');
  const [draggedTask, setDraggedTask] = useState<{ task: Task; columnId: string } | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [showNewTaskForm, setShowNewTaskForm] = useState<string | null>(null);
  const [showNewColumnForm, setShowNewColumnForm] = useState(false);
  const [newTaskData, setNewTaskData] = useState({ title: '', description: '', priority: 'medium' as Task['priority'] });
  const [newColumnTitle, setNewColumnTitle] = useState('');

  const activeBoard = boards.find(b => b.id === activeBoardId) || boards[0];

  const handleDragStart = (task: Task, columnId: string) => {
    setDraggedTask({ task, columnId });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetColumnId: string) => {
    if (!draggedTask) return;

    setBoards(boards.map(board => {
      if (board.id !== activeBoardId) return board;

      const newColumns = board.columns.map(col => {
        if (col.id === draggedTask.columnId) {
          return { ...col, tasks: col.tasks.filter(t => t.id !== draggedTask.task.id) };
        }
        if (col.id === targetColumnId) {
          return { ...col, tasks: [...col.tasks, draggedTask.task] };
        }
        return col;
      });

      return { ...board, columns: newColumns };
    }));

    setDraggedTask(null);
  };

  const addTask = (columnId: string) => {
    if (!newTaskData.title.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskData.title,
      description: newTaskData.description,
      priority: newTaskData.priority,
      tags: [],
      checklist: [],
      createdAt: new Date()
    };

    setBoards(boards.map(board => {
      if (board.id !== activeBoardId) return board;
      return {
        ...board,
        columns: board.columns.map(col =>
          col.id === columnId ? { ...col, tasks: [...col.tasks, newTask] } : col
        )
      };
    }));

    setNewTaskData({ title: '', description: '', priority: 'medium' });
    setShowNewTaskForm(null);
  };

  const deleteTask = (columnId: string, taskId: string) => {
    setBoards(boards.map(board => {
      if (board.id !== activeBoardId) return board;
      return {
        ...board,
        columns: board.columns.map(col =>
          col.id === columnId ? { ...col, tasks: col.tasks.filter(t => t.id !== taskId) } : col
        )
      };
    }));
  };

  const updateTask = (columnId: string, taskId: string, updates: Partial<Task>) => {
    setBoards(boards.map(board => {
      if (board.id !== activeBoardId) return board;
      return {
        ...board,
        columns: board.columns.map(col =>
          col.id === columnId
            ? { ...col, tasks: col.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t) }
            : col
        )
      };
    }));
  };

  const addColumn = () => {
    if (!newColumnTitle.trim()) return;

    const newColumn: Column = {
      id: Date.now().toString(),
      title: newColumnTitle,
      color: '#6366f1',
      tasks: []
    };

    setBoards(boards.map(board =>
      board.id === activeBoardId
        ? { ...board, columns: [...board.columns, newColumn] }
        : board
    ));

    setNewColumnTitle('');
    setShowNewColumnForm(false);
  };

  const deleteColumn = (columnId: string) => {
    setBoards(boards.map(board =>
      board.id === activeBoardId
        ? { ...board, columns: board.columns.filter(col => col.id !== columnId) }
        : board
    ));
  };

  const addChecklistItem = (columnId: string, taskId: string, text: string) => {
    const newItem = { id: Date.now().toString(), text, completed: false };
    updateTask(columnId, taskId, {
      checklist: [...(activeBoard.columns.find(c => c.id === columnId)?.tasks.find(t => t.id === taskId)?.checklist || []), newItem]
    });
  };

  const toggleChecklistItem = (columnId: string, taskId: string, itemId: string) => {
    const task = activeBoard.columns.find(c => c.id === columnId)?.tasks.find(t => t.id === taskId);
    if (!task) return;

    updateTask(columnId, taskId, {
      checklist: task.checklist.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    });
  };

  const exportBoard = () => {
    const json = JSON.stringify(activeBoard, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeBoard.name.replace(/\s+/g, '-')}-board.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const createNewBoard = () => {
    const newBoard: Board = {
      id: Date.now().toString(),
      name: 'New Board',
      columns: [
        { id: 'todo', title: 'To Do', color: '#94a3b8', tasks: [] },
        { id: 'inprogress', title: 'In Progress', color: '#3b82f6', tasks: [] },
        { id: 'done', title: 'Done', color: '#10b981', tasks: [] }
      ]
    };
    setBoards([...boards, newBoard]);
    setActiveBoardId(newBoard.id);
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    }
  };

  const getTaskStats = () => {
    const allTasks = activeBoard.columns.flatMap(col => col.tasks);
    return {
      total: allTasks.length,
      completed: activeBoard.columns.find(c => c.id === 'done')?.tasks.length || 0,
      inProgress: activeBoard.columns.find(c => c.id === 'inprogress')?.tasks.length || 0,
      todo: activeBoard.columns.find(c => c.id === 'todo')?.tasks.length || 0
    };
  };

  const stats = getTaskStats();

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-3">
          <CheckSquare className="h-6 w-6 text-indigo-600" />
          <div>
            <select
              value={activeBoardId}
              onChange={(e) => setActiveBoardId(e.target.value)}
              className="text-xl font-bold bg-transparent border-none outline-none dark:text-white cursor-pointer"
            >
              {boards.map(board => (
                <option key={board.id} value={board.id}>{board.name}</option>
              ))}
            </select>
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-400" />
                {stats.total} tasks
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                {stats.inProgress} in progress
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                {stats.completed} done
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={createNewBoard} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            New Board
          </Button>
          <Button onClick={exportBoard} size="sm" variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 h-full min-w-max">
          {activeBoard.columns.map(column => (
            <div
              key={column.id}
              className="flex flex-col w-80 bg-white dark:bg-gray-800 rounded-lg shadow-md"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.id)}
            >
              {/* Column Header */}
              <div 
                className="p-4 border-b dark:border-gray-700 flex items-center justify-between"
                style={{ borderTopColor: column.color, borderTopWidth: '3px' }}
              >
                <div className="flex items-center gap-2">
                  <h3 className="font-bold dark:text-white">{column.title}</h3>
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full dark:text-gray-300">
                    {column.tasks.length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    onClick={() => setShowNewTaskForm(column.id)}
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => deleteColumn(column.id)}
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Tasks */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {column.tasks.map(task => (
                  <Card
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task, column.id)}
                    className="p-3 cursor-move hover:shadow-lg transition-all border-l-4 dark:bg-gray-700"
                    style={{ borderLeftColor: column.color }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-sm dark:text-white flex-1">{task.title}</h4>
                      <div className="flex gap-1">
                        <Button
                          onClick={() => setEditingTask(task.id)}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => deleteTask(column.id, task.id)}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-red-500"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {task.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{task.description}</p>
                    )}

                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      {task.tags.map((tag, idx) => (
                        <span key={idx} className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {task.checklist.length > 0 && (
                      <div className="mb-2">
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <CheckSquare className="h-3 w-3" />
                          <span>
                            {task.checklist.filter(i => i.completed).length}/{task.checklist.length}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      {task.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {task.assignee && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{task.assignee}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}

                {/* New Task Form */}
                {showNewTaskForm === column.id && (
                  <Card className="p-3 dark:bg-gray-700">
                    <input
                      type="text"
                      placeholder="Task title"
                      value={newTaskData.title}
                      onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                      className="w-full p-2 mb-2 border rounded text-sm dark:bg-gray-600 dark:text-white dark:border-gray-500"
                      autoFocus
                    />
                    <textarea
                      placeholder="Description (optional)"
                      value={newTaskData.description}
                      onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
                      className="w-full p-2 mb-2 border rounded text-sm resize-none dark:bg-gray-600 dark:text-white dark:border-gray-500"
                      rows={2}
                    />
                    <select
                      value={newTaskData.priority}
                      onChange={(e) => setNewTaskData({ ...newTaskData, priority: e.target.value as Task['priority'] })}
                      className="w-full p-2 mb-2 border rounded text-sm dark:bg-gray-600 dark:text-white dark:border-gray-500"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                    <div className="flex gap-2">
                      <Button onClick={() => addTask(column.id)} size="sm" className="flex-1">
                        <Save className="h-3 w-3 mr-2" />
                        Add
                      </Button>
                      <Button onClick={() => setShowNewTaskForm(null)} size="sm" variant="outline">
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          ))}

          {/* Add Column */}
          {showNewColumnForm ? (
            <div className="w-80 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <input
                type="text"
                placeholder="Column title"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                className="w-full p-2 mb-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
                autoFocus
              />
              <div className="flex gap-2">
                <Button onClick={addColumn} size="sm" className="flex-1">
                  Add Column
                </Button>
                <Button onClick={() => setShowNewColumnForm(false)} size="sm" variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewColumnForm(true)}
              className="w-80 h-32 bg-white/50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              <Plus className="h-5 w-5" />
              <span className="font-semibold">Add Column</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
