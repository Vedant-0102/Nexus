import React from 'react';
import { DesktopIcon } from '../DesktopIcon';
import { useWindows } from '../context/WindowsContext';
import {
  Gamepad,
  Folder,
  Briefcase,
  Repeat,
  FlaskConical,
  Sparkles,

  Cpu,
  Sigma,
  Music,
  Scissors
} from 'lucide-react';

export const DesktopIcons: React.FC = () => {
  const { toggleWindow } = useWindows();

  // Assign positions for folders
  const getPosition = (row: number, col: number) => ({
    x: 40 + col * 90,
    y: 40 + row * 90,
  });

  // Function to handle opening a folder window
  const openFolderAsWindow = (folderId: string) => {
    const folderMap: Record<string, string> = {
      'games-folder': 'games-folder-window',
      'office-folder': 'office-folder-window',
      'simulators-folder': 'simulators-folder-window',
      'converters-folder': 'converters-folder-window',
      'utilities-folder': 'utilities-folder-window',
      'colors-folder': 'colors-folder-window',
      'virtual-engine-folder': 'virtual-engine-folder-window',
      'math-folder': 'math-folder-window',
      'music-folder': 'music-folder-window',
      'editing-folder': 'editing-folder-window',
    };

    const windowId = folderMap[folderId];
    if (windowId) toggleWindow(windowId);
  };

  const folders = [
    { id: 'games-folder', label: 'Games', icon: <Gamepad />, row: 0, col: 0 },
    { id: 'office-folder', label: 'Office', icon: <Briefcase />, row: 0, col: 1 },
    { id: 'colors-folder', label: 'Colors', icon: <Sparkles />, row: 0, col: 2 },
    { id: 'converters-folder', label: 'Converters', icon: <Repeat />, row: 0, col: 3 },
    { id: 'utilities-folder', label: 'Utilities', icon: <Folder />, row: 1, col: 0 },
    { id: 'virtual-engine-folder', label: 'Engine', icon: <Cpu />, row: 1, col: 1 },
    { id: 'math-folder', label: 'Math', icon: <Sigma />, row: 1, col: 2 },
    { id: 'simulators-folder', label: 'Simulators', icon: <FlaskConical />, row: 1, col: 3 },
    { id: 'music-folder', label: 'Music', icon: <Music />, row: 2, col: 0 },
    { id: 'editing-folder', label: 'Editing', icon: <Scissors />, row: 2, col: 1 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden">
      {folders.map(folder => {
        const pos = getPosition(folder.row, folder.col);

        return (
          <DesktopIcon
            key={folder.id}
            id={folder.id}
            label={folder.label}
            icon={folder.icon}
            defaultX={pos.x}
            defaultY={pos.y}
            onClick={() => openFolderAsWindow(folder.id)}
            onDoubleClick={() => openFolderAsWindow(folder.id)}
          />
        );
      })}
    </div>
  );
};
