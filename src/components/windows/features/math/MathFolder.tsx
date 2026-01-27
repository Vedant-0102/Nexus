import React from 'react';
import { useWindows } from '../../context/WindowsContext';

export const MathFolder = () => {
  const { windows, toggleWindow } = useWindows();

  const mathApps = windows.filter(app => 
    ['quadratic-solver', 'linear-system-solver', 'matrix-calculator', 'graph-plotter', 'statistics-calculator', 'derivative-calculator', 'integral-calculator', 'trig-calculator', 'number-theory', 'percentage-calculator', 'geometry-calculator', 'super-calculator'].includes(app.id)
  );

  return (
    <div className="p-6 h-full overflow-auto bg-white dark:bg-gray-900">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Math Tools
      </h2>
      <div className="grid grid-cols-4 gap-4">
        {mathApps.map(app => (
          <div 
            key={app.id}
            className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 cursor-pointer group"
            onClick={() => toggleWindow(app.id)}
          >
            <div className="h-12 w-12 flex items-center justify-center bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 rounded-lg mb-2 transition-colors">
              {React.cloneElement(app.icon as React.ReactElement, { 
                size: 20,
                className: "text-gray-700 dark:text-gray-300"
              })}
            </div>
            <span className="text-xs text-center text-gray-900 dark:text-gray-100 line-clamp-2 w-full">
              {app.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
