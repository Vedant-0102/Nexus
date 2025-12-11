// IndexedDB utility for StickyNotes persistence
const DB_NAME = 'win11-sticky-notes-db';
const DB_VERSION = 1;
const STORE_NAME = 'notes';

export interface Note {
  id: string;
  content: string;
  color: string;
  createdAt: string;
  order: number;
}

class NotesDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          objectStore.createIndex('order', 'order', { unique: false });
          objectStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  async getAllNotes(): Promise<Note[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const notes = request.result as Note[];
        // Sort by order
        notes.sort((a, b) => a.order - b.order);
        resolve(notes);
      };
    });
  }

  async saveNote(note: Note): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.put(note);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async saveAllNotes(notes: Note[]): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      
      // Clear existing notes
      objectStore.clear();
      
      // Add all notes
      notes.forEach(note => objectStore.put(note));

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
    });
  }

  async deleteNote(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clearAllNotes(): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Migration helper: Import from localStorage
  async migrateFromLocalStorage(): Promise<void> {
    try {
      const savedNotes = localStorage.getItem('win11-sticky-notes-v2');
      if (savedNotes) {
        const parsedNotes = JSON.parse(savedNotes) as Note[];
        if (Array.isArray(parsedNotes) && parsedNotes.length > 0) {
          await this.saveAllNotes(parsedNotes);
          // Remove from localStorage after successful migration
          localStorage.removeItem('win11-sticky-notes-v2');
          console.log('Successfully migrated notes from localStorage to IndexedDB');
        }
      }
    } catch (error) {
      console.error('Error migrating from localStorage:', error);
    }
  }
}

// Singleton instance
export const notesDB = new NotesDB();
