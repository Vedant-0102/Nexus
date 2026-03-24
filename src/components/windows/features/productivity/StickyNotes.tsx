import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Edit2, Check, X, Search, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { notesDB, type Note } from '@/lib/indexedDB';

export const StickyNotes: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('#FFEB3B');
  const [customColor, setCustomColor] = useState<string>('#FFEB3B');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const presetColors = [
    { name: 'Yellow', value: '#FFEB3B' },
    { name: 'Blue', value: '#90CAF9' },
    { name: 'Green', value: '#A5D6A7' },
    { name: 'Pink', value: '#F8BBD0' },
    { name: 'Purple', value: '#CE93D8' },
    { name: 'Orange', value: '#FFCC80' },
  ];

  // Load notes from IndexedDB on component mount
  useEffect(() => {
    const loadNotes = async () => {
      try {
        await notesDB.init();
        // Migrate from localStorage if needed
        await notesDB.migrateFromLocalStorage();
        const savedNotes = await notesDB.getAllNotes();
        setNotes(savedNotes);
      } catch (error) {
        console.error("Error loading saved notes:", error);
        setNotes([]);
      }
    };

    loadNotes();
  }, []);

  // Save notes to IndexedDB whenever notes change
  useEffect(() => {
    const saveNotes = async () => {
      try {
        if (notes.length > 0) {
          await notesDB.saveAllNotes(notes);
        }
      } catch (error) {
        console.error("Error saving notes:", error);
      }
    };

    // Only save if notes have been loaded (avoid saving empty array on mount)
    if (notes.length > 0) {
      saveNotes();
    }
  }, [notes]);

  const handleAddNote = () => {
    if (currentNote.trim() === '') return;

    const newNote: Note = {
      id: Date.now().toString(),
      content: currentNote,
      color: selectedColor,
      createdAt: new Date().toISOString(),
      order: notes.length,
    };

    setNotes([...notes, newNote]);
    setCurrentNote('');
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await notesDB.deleteNote(id);
      const updatedNotes = notes.filter(note => note.id !== id);
      // Reorder remaining notes
      const reorderedNotes = updatedNotes.map((note, index) => ({
        ...note,
        order: index
      }));
      setNotes(reorderedNotes);
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const saveEdit = () => {
    if (editingId && editContent.trim()) {
      setNotes(notes.map(note =>
        note.id === editingId ? { ...note, content: editContent } : note
      ));
      setEditingId(null);
      setEditContent('');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey && currentNote.trim() !== '') {
      handleAddNote();
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const handleDragStart = (e: React.DragEvent, noteId: string) => {
    setDraggingId(noteId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggingId || draggingId === targetId) return;

    const draggedNote = notes.find(n => n.id === draggingId);
    const targetNote = notes.find(n => n.id === targetId);
    if (!draggedNote || !targetNote) return;

    const newNotes = [...notes];
    const draggedIndex = newNotes.findIndex(n => n.id === draggingId);
    const targetIndex = newNotes.findIndex(n => n.id === targetId);

    // Remove dragged note and insert at target position
    newNotes.splice(draggedIndex, 1);
    newNotes.splice(targetIndex, 0, draggedNote);

    // Update order
    const reorderedNotes = newNotes.map((note, index) => ({
      ...note,
      order: index
    }));

    setNotes(reorderedNotes);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  // Filter notes based on search query
  const filteredNotes = notes.filter(note =>
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      <div className="p-4 border-b dark:border-gray-700">
        <h2 className="text-2xl font-semibold dark:text-white">Sticky Notes</h2>
      </div>

      <Tabs defaultValue="notes" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-4 mt-3 h-11">
          <TabsTrigger value="notes" className="text-sm px-5 py-2">My Notes ({notes.length})</TabsTrigger>
          <TabsTrigger value="create" className="text-sm px-5 py-2">Create New</TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="flex-1 overflow-auto mt-0 data-[state=inactive]:hidden">
          <div className="p-4">
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-800 dark:text-white dark:border-gray-700"
                />
              </div>
            </div>

            {/* Notes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredNotes.map(note => (
                <div
                  key={note.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, note.id)}
                  onDragOver={(e) => handleDragOver(e, note.id)}
                  onDragEnd={handleDragEnd}
                  className={`rounded-xl p-5 shadow-md relative cursor-move transition-all min-h-[120px] ${
                    draggingId === note.id ? 'opacity-50 scale-95' : 'hover:shadow-lg'
                  }`}
                  style={{ backgroundColor: note.color }}
                >
                  {/* Drag Handle */}
                  <div className="absolute top-3 left-3 cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-5 w-5 text-gray-600" />
                  </div>

                  {/* Action Buttons */}
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    {editingId === note.id ? (
                      <>
                        <button
                          onClick={saveEdit}
                          className="p-1.5 rounded-full hover:bg-black/10 text-green-600"
                          title="Save"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1.5 rounded-full hover:bg-black/10 text-red-600"
                          title="Cancel"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(note)}
                          className="p-1.5 rounded-full hover:bg-black/10"
                          title="Edit"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1.5 rounded-full hover:bg-black/10"
                          title="Delete"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Content */}
                  <div className="mt-7">
                    {editingId === note.id ? (
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyDown={handleEditKeyDown}
                        className="w-full p-2 rounded border-2 border-gray-400 bg-white/50 dark:bg-gray-700/50 dark:text-gray-100 dark:border-gray-500 text-base resize-none"
                        rows={5}
                        autoFocus
                      />
                    ) : (
                      <p className="text-base whitespace-pre-wrap break-words leading-relaxed">
                        {note.content}
                      </p>
                    )}
                  </div>

                  {/* Timestamp */}
                  <p className="text-sm mt-4 text-gray-600 font-medium">
                    {new Date(note.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}

              {filteredNotes.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchQuery ? 'No notes found matching your search.' : 'No notes yet. Create your first note!'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="create" className="flex-1 overflow-auto mt-0 p-4 data-[state=inactive]:hidden">
          <div className="space-y-4 max-w-2xl mx-auto">
            {/* Preset Colors */}
            <div>
              <label className="block text-sm font-semibold mb-2 dark:text-white">Preset Colors</label>
              <div className="flex flex-wrap gap-2">
                {presetColors.map(color => (
                  <button
                    key={color.value}
                    className={`w-10 h-10 rounded-full transition-all ${
                      selectedColor === color.value ? 'ring-4 ring-offset-2 ring-gray-500 scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setSelectedColor(color.value)}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Custom Color */}
            <div>
              <label className="block text-sm font-semibold mb-2 dark:text-white">Custom Color</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value);
                    setSelectedColor(e.target.value);
                  }}
                  className="w-16 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value);
                    setSelectedColor(e.target.value);
                  }}
                  className="flex-1 px-3 py-2 border rounded dark:bg-gray-800 dark:text-white dark:border-gray-700 font-mono"
                  placeholder="#FFEB3B"
                />
                <Button
                  onClick={() => setSelectedColor(customColor)}
                  size="sm"
                  variant="outline"
                >
                  Apply
                </Button>
              </div>
            </div>

            {/* Note Content */}
            <div>
              <label className="block text-sm font-semibold mb-2 dark:text-white">Note Content</label>
              <textarea
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full h-48 p-4 rounded-lg border dark:border-gray-700 resize-none"
                placeholder="Write your note here... (Ctrl+Enter to save)"
                style={{ backgroundColor: selectedColor + '80' }}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                💡 Tip: Press Ctrl+Enter to quickly save • Drag notes to reorder
              </p>
              <Button
                onClick={handleAddNote}
                disabled={currentNote.trim() === ''}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
