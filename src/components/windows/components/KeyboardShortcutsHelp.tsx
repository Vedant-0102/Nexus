import React, { useState, useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';

import { useWindows } from '../context/WindowsContext';

export const KeyboardShortcutsHelp: React.FC = () => {
  const { windows } = useWindows();
  const [isOpen, setIsOpen] = useState(false);

  // Hide if any window is open
  const hasOpenWindows = windows.some(w => w.isOpen && !w.isMinimized);
  if (hasOpenWindows) return null;

  // Removed auto-show on first visit - user can click the button if they want help

  const handleClose = () => {
    setIsOpen(false);
  };

  const shortcuts = [
    { keys: ['Alt', '←'], description: 'Snap window to left half' },
    { keys: ['Alt', '→'], description: 'Snap window to right half' },
    { keys: ['Alt', '↑'], description: 'Maximize window' },
    { keys: ['Alt', '↓'], description: 'Minimize window' },
    { keys: ['Alt', 'Shift', '←'], description: 'Snap to top-left quarter' },
    { keys: ['Alt', 'Shift', '→'], description: 'Snap to top-right quarter' },
    { keys: ['Alt', 'Ctrl', '←'], description: 'Snap to bottom-left quarter' },
    { keys: ['Alt', 'Ctrl', '→'], description: 'Snap to bottom-right quarter' },
  ];

  return (
    <>
      {/* Help Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-16 right-4 z-[9998] p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110"
        title="Keyboard Shortcuts"
      >
        <Keyboard size={20} />
      </button>

      {/* Help Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Keyboard size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Keyboard Shortcuts
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Window management made easy
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-3">
                {shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          <kbd className="px-3 py-1.5 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm">
                            {key}
                          </kbd>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-gray-400 dark:text-gray-600 text-xs">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Additional Tips */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  💡 Pro Tips
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Click on a window to focus it before using shortcuts</li>
                  <li>• Drag windows to screen edges for quick snapping</li>
                  <li>• Use Alt key (or Windows key on some systems)</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
