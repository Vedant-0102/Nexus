import React from 'react';
import { useWindows } from '../../context/WindowsContext';

export const UtilitiesFolder: React.FC = () => {
    const { windows, toggleWindow } = useWindows();

    const utilityApps = windows.filter(app =>
        [
            'browser',
            'calendar',
            'terminal',
            'filemanager',
            'texteditor',
            'markdowneditor',
            'wikipedia',
            'supercalculator',
            'unifiedClock',
            'taskManager',
            'stickyNotes',
            'battery'
        ].includes(app.id)
    );

    console.log('UtilitiesFolder DEBUG:');
    console.log('- Total windows:', windows.length);
    console.log('- All window IDs:', windows.map(w => w.id));
    console.log('- Browser window exists:', windows.some(w => w.id === 'browser'));
    console.log('- Filtered utility apps:', utilityApps.length);
    console.log('- Utility app details:', utilityApps.map(a => ({ id: a.id, title: a.title })));

    return (
        <div className="p-6 h-full overflow-auto bg-white dark:bg-gray-900">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Utilities
            </h2>
            <div className="grid grid-cols-4 gap-4">
                {utilityApps.map(app => (
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
