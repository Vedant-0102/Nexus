
import React from 'react';
import { useWindows } from '../../context/WindowsContext';
import { X } from 'lucide-react';

export const TaskManager: React.FC = () => {
  const { windows, toggleWindow, minimizedWindows } = useWindows();
  
  const runningApps = windows.filter(w => w.isOpen);
  const minimizedApps = windows.filter(w => minimizedWindows.includes(w.id));
  
  return (
    <div className="p-4 h-full">
      <h2 className="text-2xl font-semibold mb-4">Task Manager</h2>
      
      <div className="space-y-4">
        <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg">
          <h3 className="font-medium mb-2">Running Applications ({runningApps.length})</h3>

          <div className="overflow-hidden rounded-md border dark:border-gray-700">
            <table className="min-w-full divide-y dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-400">App</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Status</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {runningApps.map(app => (
                  <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {app.icon}
                        <span>{app.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ${
                        app.isMinimized ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      }`}>
                        {app.isMinimized ? 'Minimized' : 'Running'}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <button 
                        onClick={() => toggleWindow(app.id)}
                        className="mr-2 inline-flex items-center rounded px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                      >
                        {app.isMinimized ? 'Restore' : 'Focus'}
                      </button>
                      <button 
                        onClick={() => toggleWindow(app.id)}
                        className="inline-flex items-center rounded px-2 py-1 text-xs bg-red-500 text-white hover:bg-red-600"
                      >
                        <X size={12} className="mr-1" /> Close
                      </button>
                    </td>
                  </tr>
                ))}
                
                {runningApps.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-center text-gray-500 dark:text-gray-400">
                      No applications running
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg">
          <h3 className="font-medium mb-2">Minimized Applications ({minimizedApps.length})</h3>

          <div className="flex flex-wrap gap-2">
            {minimizedApps.map(app => (
              <button
                key={app.id}
                onClick={() => toggleWindow(app.id)}
                className="flex items-center gap-1 px-2 py-1 bg-white/70 dark:bg-gray-700/70 rounded hover:bg-white/90 dark:hover:bg-gray-600/90 transition-colors"
              >
                {app.icon}
                <span className="text-sm">{app.title}</span>
              </button>
            ))}
            
            {minimizedApps.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No minimized applications</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
