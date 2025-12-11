/**
 * Shared VFS Instance - Single source of truth for the file system
 * Used by both Terminal and FileManager
 */

import { VirtualFileSystem } from './VirtualFileSystem';

let sharedVFSInstance: VirtualFileSystem | null = null;

export const getSharedVFS = (): VirtualFileSystem => {
  if (!sharedVFSInstance) {
    sharedVFSInstance = new VirtualFileSystem();
  }
  return sharedVFSInstance;
};
