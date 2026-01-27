import React, { createContext, useState, useContext, useEffect } from 'react';
import { WindowType } from '../types/WindowTypes';
import { WINDOW_THEMES } from '../themes/windowThemes';
import { Settings as SettingsIcon, Clock, FileText, Battery, Timer, Terminal as TerminalIcon, StickyNote, Gamepad, PaintBucket, Folder, Crown, Globe, RefreshCcw, Code, Layers, Flag, Cloud, Image, Table, Presentation, TrendingUp, Bitcoin, Trophy, Rocket, Briefcase, Repeat, FlaskConical, BarChart3, Beaker, Zap, Atom, QrCode, Plane, Ship, Palette, Sparkles, CheckCircle2, Eye, Newspaper, Cpu, Waves, Brain, ClipboardList, CheckSquare, Ruler, Weight, DollarSign, Sigma, Calculator, Grid3x3, PieChart, Calendar as CalendarIcon, GitBranch, Gauge, Thermometer, Droplet } from 'lucide-react';
import { Notepad } from '../features/office/Notepad';
import { TextEditor } from '../features/office/TextEditor';
import { FormBuilder } from '../features/office/FormBuilder';
import { KanbanBoard } from '../features/office/KanbanBoard';
import { Paint } from '../features/creative/Paint';
import { SuperCalculator } from '../features/math/SuperCalculator';
import { GeometryCalculator } from '../features/math/GeometryCalculator';
import { Calendar } from '../features/utilities/Calendar';
import { Browser } from '../features/utilities/Browser';
import { UtilitiesFolder } from '../features/utilities/UtilitiesFolder';
import { MindMapCreator } from '../features/creative/engine/MindMapCreator';
import { GitVisualizer } from '../features/development/GitVisualizer';
import { ElectromagneticLab } from '../features/science/physics/ElectromagneticLab';
import { OpticsSimulator } from '../features/science/physics/OpticsSimulator';
import { ElectricFieldVisualizer } from '../features/science/physics/ElectricFieldVisualizer';
import { MagneticFieldVisualizer } from '../features/science/physics/MagneticFieldVisualizer';
import { RocketPropulsion } from '../features/science/physics/RocketPropulsion';
import { BatteryLevel } from '../features/system/BatteryLevel';
import { UnifiedClock } from '../features/productivity/UnifiedClock';
import { StickyNotes } from '../features/productivity/StickyNotes';
import { TaskManager } from '../features/system/TaskManager';
import { Terminal } from '../features/development/Terminal';
import { TicTacToe } from '../features/games/TicTacToe';
import { SnakeGame } from '../features/games/SnakeGame';
import { SettingsApp } from '../Settings';
import { Minesweeper } from '../features/games/Minesweeper';
import { Checkers } from '../features/games/Checkers';
import { FlappyBird } from '../features/games/FlappyBird';
import { PacMan } from '../features/games/PacMan';
import { FolderContent } from '../features/system/FolderContent';
import { ChessGame } from '../features/chess/ChessGame';
import { DatabaseApp } from '../features/database/DatabaseApp';
import { FileManager } from '../features/system/FileManager';
import { Wikipedia } from '../features/internet/Wikipedia';
import { PingPong } from '../features/games/PingPong';
import { CodeEditor } from '../features/development/CodeEditor';
import { NoCodeBuilder } from '../features/creative/NoCodeBuilder';
import { F1App } from '../features/media/F1App';
import { WeatherApp } from '../features/internet/WeatherApp';
import { ImageConverter } from '../features/converters/ImageConverter';
import { DocumentConverter } from '../features/converters/DocumentConverter';
import { TextToHTML } from '../features/converters/TextToHTML';
import { LengthConverter } from '../features/converters/LengthConverter';
import { WeightConverter } from '../features/converters/WeightConverter';
import { CurrencyConverter } from '../features/converters/CurrencyConverter';
import { MarkdownEditor } from '../features/converters/MarkdownEditor';
import { LoremIpsumGenerator } from '../features/converters/LoremIpsumGenerator';
import { ChartBuilder } from '../features/converters/ChartBuilder';
import { APITester } from '../features/creative/engine/APITester';
import { RegexTester } from '../features/converters/RegexTester';
import { DataFormatter } from '../features/converters/DataFormatter';
import { Base64Converter } from '../features/converters/Base64Converter';
import { PasswordGenerator } from '../features/converters/PasswordGenerator';
import { TemperatureConverter } from '../features/converters/TemperatureConverter';
import { SpeedConverter } from '../features/converters/SpeedConverter';
import { EnergyConverter } from '../features/converters/EnergyConverter';
import { PowerConverter } from '../features/converters/PowerConverter';
import { PressureConverter } from '../features/converters/PressureConverter';
import { VolumeConverter } from '../features/converters/VolumeConverter';
import { TimeConverter } from '../features/converters/TimeConverter';
import { AreaConverter } from '../features/converters/AreaConverter';
import { ColorPicker } from '../features/colors/ColorPicker';
import { Spreadsheet } from '../features/office/Spreadsheet';
import { Presentation as PresentationApp } from '../features/office/Presentation';
import { StockMarket } from '../features/data/StockMarket';
import { Cryptocurrency } from '../features/data/Cryptocurrency';
import { SportsApp } from '../features/data/SportsApp';
import { NASAApp } from '../features/data/NASAApp';
import { FlightTracker } from '../features/data/FlightTracker';
import { Tetris } from '../features/games/Tetris';
import { Game2048 } from '../features/games/Game2048';
import { Sudoku } from '../features/games/Sudoku';
import { Breakout } from '../features/games/Breakout';
import { MemoryMatch } from '../features/games/MemoryMatch';
import { SpaceInvaders } from '../features/games/SpaceInvaders';
import { SortingVisualizer } from '../features/visualizers/SortingVisualizer';
import { PathfindingVisualizer } from '../features/visualizers/PathfindingVisualizer';
import { PeriodicTable } from '../features/science/chemistry/PeriodicTable';
import { MolecularViewer } from '../features/science/chemistry/MolecularViewer';
import { ReactionSimulator } from '../features/science/chemistry/ReactionSimulator';
import { EquationBalancer } from '../features/science/chemistry/EquationBalancer';
import { ProjectileMotion } from '../features/science/physics/ProjectileMotion';
import { PendulumSimulator } from '../features/science/physics/PendulumSimulator';
import { SpringSimulator } from '../features/science/physics/SpringSimulator';
import { FlashcardGame } from '../features/office/FlashcardGame';
import { WaveSimulator } from '../features/science/physics/WaveSimulator';
import { CollisionSimulator } from '../features/science/physics/CollisionSimulator';
import { CNNVisualizer } from '../features/visualizers/CNNVisualizer';
import { QRCodeVisualizer } from '../features/visualizers/QRCodeVisualizer';
import { ShipTracker } from '../features/data/ShipTracker';
import { Maze3D } from '../features/games/Maze3D';
import { UniverseSimulator } from '../features/science/UniverseSimulator';
import { ColorPaletteTool } from '../features/creative/ColorPaletteTool';
import { ColorsFolder } from '../features/colors/ColorsFolder';
import { ColorPaletteGenerator } from '../features/colors/ColorPaletteGenerator';
import { ContrastChecker } from '../features/colors/ContrastChecker';
import { TrendingPalettes } from '../features/colors/TrendingPalettes';
import { HexCodeParser } from '../features/colors/HexCodeParser';
import { PaletteVisualizer } from '../features/colors/PaletteVisualizer';
import { Battleship } from '../features/games/Battleship';
import { Connect4 } from '../features/games/Connect4';
import { GradientGenerator } from '../features/colors/GradientGenerator';
import { PixelArtEditor as PixelArtEditorColors } from '../features/colors/PixelArtEditor';
import { VirtualEngineFolder } from '../features/folders/VirtualEngineFolder';
import { NewsFolder } from '../features/folders/NewsFolder';
import { PixelArtEditor } from '../features/office/PixelArtEditor';
import { InvoiceGenerator } from '../features/office/InvoiceGenerator';
import { DVDScreensaver } from '../features/games/DVDScreensaver';
import { SandFalling } from '../features/games/SandFalling';
import { Puzzle15 } from '../features/games/Puzzle15';
import { MathFolder } from '../features/math/MathFolder';
import { QuadraticSolver } from '../features/math/QuadraticSolver';
import { LinearSystemSolver } from '../features/math/LinearSystemSolver';
import { MatrixCalculator } from '../features/math/MatrixCalculator';
import { GraphPlotter } from '../features/math/GraphPlotter';
import { StatisticsCalculator } from '../features/math/StatisticsCalculator';
import { DerivativeCalculator } from '../features/math/DerivativeCalculator';
import { IntegralCalculator } from '../features/math/IntegralCalculator';
import { TrigCalculator } from '../features/math/TrigCalculator';
import { NumberTheory } from '../features/math/NumberTheory';
import { PercentageCalculator } from '../features/math/PercentageCalculator';

// Import Mock Visualizer Components
import { MockLandingPage } from '../features/colors/visualizer/MockLandingPage';
import { MockDashboard } from '../features/colors/visualizer/MockDashboard';
import { MockSocialMediaPage } from '../features/colors/visualizer/MockSocialMediaPage';
import { MockBlogPage } from '../features/colors/visualizer/MockBlogPage';

const BASE_ZINDEX = 100000;
const FOLDER_ZINDEX = BASE_ZINDEX;
const APP_ZINDEX = BASE_ZINDEX + 100;
const ZINDEX_INCREMENT = 10;
const INITIAL_ZINDEX = BASE_ZINDEX;

export type SettingsType = {
  theme: 'light' | 'dark';
  showClock: boolean;
  showNotepad: boolean;
  showBattery: boolean;
  wallpaperUrl?: string;
  notifications?: boolean;
  animations?: boolean;
  transparency?: number;
};

interface WindowsContextType {
  windows: WindowType[];
  highestZIndex: number;
  toggleWindow: (id: string) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  bringToFront: (id: string) => void;
  settings: SettingsType;
  setSettings: React.Dispatch<React.SetStateAction<SettingsType>>;
  minimizedWindows: string[];
  setWallpaper: (url: string) => void;
  wallpaper: string;
  isShuttingDown: boolean;
  handleShutdown: () => void;
}

const WindowsContext = createContext<WindowsContextType>({
  windows: [],
  highestZIndex: 100,
  toggleWindow: () => { },
  closeWindow: () => { },
  minimizeWindow: () => { },
  bringToFront: () => { },
  settings: {
    theme: 'light',
    showClock: true,
    showNotepad: true,
    showBattery: true,
  },
  setSettings: () => { },
  minimizedWindows: [],
  setWallpaper: () => { },
  wallpaper: '',
  isShuttingDown: false,
  handleShutdown: () => { },
});

export const useWindows = () => useContext(WindowsContext);

export const WindowsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [windows, setWindows] = useState<WindowType[]>([]);
  const [highestZIndex, setHighestZIndex] = useState(100);
  const [minimizedWindows, setMinimizedWindows] = useState<string[]>([]);
  const [wallpaper, setWallpaper] = useState('');
  const [isShuttingDown, setIsShuttingDown] = useState(false);

  const [settings, setSettings] = useState<SettingsType>({
    theme: 'light',
    showClock: true,
    showNotepad: true,
    showBattery: true,
  });

  useEffect(() => {
    const isShutdown = localStorage.getItem('win11-is-shutdown') === 'true';
    if (isShutdown) {
      const shutdownScreen = document.createElement('div');
      shutdownScreen.id = 'shutdown-screen';
      shutdownScreen.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: black;
        z-index: 99999;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.3);
        font-family: 'Segoe UI', sans-serif;
        font-size: 20px;
      `;
      shutdownScreen.innerHTML = '<p>Click anywhere to power on</p>';

      shutdownScreen.addEventListener('click', () => {
        shutdownScreen.style.background = '#0078D7';
        shutdownScreen.innerHTML = `<div class="windows-loader"></div>`;
        const style = document.createElement('style');
        style.textContent = `
          .windows-loader {
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top: 4px solid white;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `;
        document.body.appendChild(style);

        localStorage.removeItem('win11-is-shutdown');

        setTimeout(() => {
          shutdownScreen.remove();
          window.location.reload();
        }, 2000);
      });

      document.body.appendChild(shutdownScreen);
      setIsShuttingDown(false);
    }
  }, []);

  useEffect(() => {
    const loadSavedState = () => {
      const savedSettings = localStorage.getItem('win11-settings');
      const savedWallpaper = localStorage.getItem('win11-wallpaper');
      const savedOpenWindows = localStorage.getItem('win11-open-windows');
      const savedMinimizedWindows = localStorage.getItem('win11-minimized-windows');
      const savedTheme = localStorage.getItem('win11-theme');

      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          setSettings(parsedSettings);

          // Apply theme immediately on load
          if (parsedSettings.theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        } catch (error) {
          console.error("Error parsing saved settings:", error);
        }
      } else if (savedTheme) {
        // Fallback to old theme storage
        const isDark = savedTheme === 'dark';
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        setSettings(prev => ({ ...prev, theme: isDark ? 'dark' : 'light' }));
      }

      if (savedWallpaper) {
        setWallpaper(savedWallpaper);
      }

      initializeWindows(
        savedOpenWindows ? JSON.parse(savedOpenWindows) : [],
        savedMinimizedWindows ? JSON.parse(savedMinimizedWindows) : []
      );
    };

    loadSavedState();
  }, []);

  const initializeWindows = (openWindowIds: string[], minimizedWindowIds: string[]) => {
    const portfolioWindows: WindowType[] = [];

    const utilityWindows: WindowType[] = [
      {
        id: 'settings',
        title: 'Settings',
        content: <SettingsApp initialSettings={settings} onApply={setSettings} />,
        isOpen: openWindowIds.includes('settings'),
        isMinimized: minimizedWindowIds.includes('settings'),
        icon: <SettingsIcon className="h-5 w-5" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: true,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 600, height: 500 },
      },
      {
        id: 'unifiedClock',
        title: 'Clock',
        content: <UnifiedClock />,
        isOpen: openWindowIds.includes('unifiedClock'),
        isMinimized: minimizedWindowIds.includes('unifiedClock'),
        icon: <Clock className="h-5 w-5" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 500, height: 400 },
      },
      {
        id: 'taskManager',
        title: 'Task Manager',
        content: <TaskManager />,
        isOpen: openWindowIds.includes('taskManager'),
        isMinimized: minimizedWindowIds.includes('taskManager'),
        icon: <Timer className="h-5 w-5" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 600, height: 500 },
      },
      {
        id: 'stickyNotes',
        title: 'Sticky Notes',
        content: <StickyNotes />,
        isOpen: openWindowIds.includes('stickyNotes'),
        isMinimized: minimizedWindowIds.includes('stickyNotes'),
        icon: <StickyNote className="h-5 w-5" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 400, height: 400 },
      },
      {
        id: 'calendar',
        title: 'Calendar',
        content: <Calendar />,
        isOpen: openWindowIds.includes('calendar'),
        isMinimized: minimizedWindowIds.includes('calendar'),
        icon: <CalendarIcon className="h-5 w-5 text-blue-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: true,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 700 },
      },
      {
        id: 'browser',
        title: 'Web Browser',
        content: <Browser />,
        isOpen: openWindowIds.includes('browser'),
        isMinimized: minimizedWindowIds.includes('browser'),
        icon: <Globe className="h-5 w-5 text-blue-500" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: true,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 800 },
      },
      {
        id: 'geometry-calculator',
        title: 'Geometry Calculator',
        content: <GeometryCalculator />,
        isOpen: openWindowIds.includes('geometry-calculator'),
        isMinimized: minimizedWindowIds.includes('geometry-calculator'),
        icon: <Ruler className="h-5 w-5 text-purple-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 800 },
      },
      {
        id: 'mindmap',
        title: 'Mind Map Creator',
        content: <MindMapCreator />,
        isOpen: openWindowIds.includes('mindmap'),
        isMinimized: minimizedWindowIds.includes('mindmap'),
        icon: <Brain className="h-5 w-5 text-purple-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: true,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 800 },
      },
      {
        id: 'gitvisualizer',
        title: 'Git Visualizer',
        content: <GitVisualizer />,
        isOpen: openWindowIds.includes('gitvisualizer'),
        isMinimized: minimizedWindowIds.includes('gitvisualizer'),
        icon: <GitBranch className="h-5 w-5 text-orange-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: true,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 800 },
      },
      {
        id: 'flashcards',
        title: 'Flashcard Study',
        content: <FlashcardGame />,
        isOpen: openWindowIds.includes('flashcards'),
        isMinimized: minimizedWindowIds.includes('flashcards'),
        icon: <Brain className="h-5 w-5 text-purple-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: true,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 900, height: 700 },
      },
      {
        id: 'pixelart',
        title: 'Pixel Art Editor',
        content: <PixelArtEditor />,
        isOpen: openWindowIds.includes('pixelart'),
        isMinimized: minimizedWindowIds.includes('pixelart'),
        icon: <Palette className="h-5 w-5 text-purple-500" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 900, height: 800 },
      },
      {
        id: 'invoice',
        title: 'Invoice Generator',
        content: <InvoiceGenerator />,
        isOpen: openWindowIds.includes('invoice'),
        isMinimized: minimizedWindowIds.includes('invoice'),
        icon: <FileText className="h-5 w-5 text-green-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 900 },
      },
      {
        id: 'terminal',
        title: 'Terminal',
        content: <Terminal />,
        isOpen: openWindowIds.includes('terminal'),
        isMinimized: minimizedWindowIds.includes('terminal'),
        icon: <TerminalIcon className="h-5 w-5" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 700, height: 500 },
      },
      {
        id: 'tictactoe',
        title: 'Tic Tac Toe',
        content: <TicTacToe />,
        isOpen: openWindowIds.includes('tictactoe'),
        isMinimized: minimizedWindowIds.includes('tictactoe'),
        icon: <Gamepad className="h-5 w-5" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 450, height: 550 },
      },
      {
        id: 'snake',
        title: 'Snake Game',
        content: <SnakeGame />,
        isOpen: openWindowIds.includes('snake'),
        isMinimized: minimizedWindowIds.includes('snake'),
        icon: <Gamepad className="h-5 w-5" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 500, height: 550 },
      },
      {
        id: 'minesweeper',
        title: 'Minesweeper',
        content: <Minesweeper />,
        isOpen: openWindowIds.includes('minesweeper'),
        isMinimized: minimizedWindowIds.includes('minesweeper'),
        icon: <Gamepad className="h-5 w-5" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 500, height: 600 },
      },
      {
        id: 'checkers',
        title: 'Checkers',
        content: <Checkers />,
        isOpen: openWindowIds.includes('checkers'),
        isMinimized: minimizedWindowIds.includes('checkers'),
        icon: <Gamepad className="h-5 w-5 text-orange-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 800 },
      },
      {
        id: 'flappybird',
        title: 'Flappy Bird',
        content: <FlappyBird />,
        isOpen: openWindowIds.includes('flappybird'),
        isMinimized: minimizedWindowIds.includes('flappybird'),
        icon: <Gamepad className="h-5 w-5 text-sky-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 900, height: 800 },
      },
      {
        id: 'pacman',
        title: 'Pac-Man',
        content: <PacMan />,
        isOpen: openWindowIds.includes('pacman'),
        isMinimized: minimizedWindowIds.includes('pacman'),
        icon: <Gamepad className="h-5 w-5 text-yellow-400" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 800 },
      },
      {
        id: 'chess',
        title: 'Chess',
        content: <ChessGame />,
        isOpen: openWindowIds.includes('chess'),
        isMinimized: minimizedWindowIds.includes('chess'),
        icon: <Crown className="h-5 w-5" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 700, height: 800 },
      },
      {
        id: 'pingpong',
        title: 'Ping Pong',
        content: <PingPong />,
        isOpen: openWindowIds.includes('pingpong'),
        isMinimized: minimizedWindowIds.includes('pingpong'),
        icon: <Gamepad className="h-5 w-5" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 850, height: 700 },
      },
      {
        id: 'database',
        title: 'Database',
        content: <DatabaseApp />,
        isOpen: openWindowIds.includes('database'),
        isMinimized: minimizedWindowIds.includes('database'),
        icon: <FileText className="h-5 w-5 text-blue-500" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 700 },
      },
      {
        id: 'filemanager',
        title: 'File Manager',
        content: <FileManager />,
        isOpen: openWindowIds.includes('filemanager'),
        isMinimized: minimizedWindowIds.includes('filemanager'),
        icon: <Folder className="h-5 w-5 text-yellow-500" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 800, height: 600 },
      },
      {
        id: 'paint',
        title: 'Paint',
        content: <Paint />,
        isOpen: openWindowIds.includes('paint'),
        isMinimized: minimizedWindowIds.includes('paint'),
        icon: <PaintBucket className="h-5 w-5 text-pink-500" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        defaultSize: { width: 900, height: 750 },
        isResizable: true,
        isMaximizable: true
      },
      {
        id: 'supercalculator',
        title: 'Super Calculator',
        content: <SuperCalculator />,
        isOpen: openWindowIds.includes('supercalculator'),
        isMinimized: minimizedWindowIds.includes('supercalculator'),
        icon: <BarChart3 className="h-5 w-5 text-blue-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        defaultSize: { width: 1000, height: 800 },
        isResizable: true,
        isMaximizable: true
      },
      {
        id: 'quadratic-solver',
        title: 'Quadratic Solver',
        content: <QuadraticSolver />,
        isOpen: openWindowIds.includes('quadratic-solver'),
        isMinimized: minimizedWindowIds.includes('quadratic-solver'),
        icon: <Calculator className="h-5 w-5 text-blue-600" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        defaultSize: { width: 900, height: 700 },
        defaultPosition: { x: 100, y: 80 },
        isResizable: true,
        isMaximizable: true
      },
      {
        id: 'linear-system-solver',
        title: 'Linear System',
        content: <LinearSystemSolver />,
        isOpen: openWindowIds.includes('linear-system-solver'),
        isMinimized: minimizedWindowIds.includes('linear-system-solver'),
        icon: <Sigma className="h-5 w-5 text-purple-600" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        defaultSize: { width: 900, height: 700 },
        defaultPosition: { x: 100, y: 80 },
        isResizable: true,
        isMaximizable: true
      },
      {
        id: 'matrix-calculator',
        title: 'Matrix Calculator',
        content: <MatrixCalculator />,
        isOpen: openWindowIds.includes('matrix-calculator'),
        isMinimized: minimizedWindowIds.includes('matrix-calculator'),
        icon: <Grid3x3 className="h-5 w-5 text-green-600" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        defaultSize: { width: 900, height: 700 },
        defaultPosition: { x: 100, y: 80 },
        isResizable: true,
        isMaximizable: true
      },
      {
        id: 'graph-plotter',
        title: 'Graph Plotter',
        content: <GraphPlotter />,
        isOpen: openWindowIds.includes('graph-plotter'),
        isMinimized: minimizedWindowIds.includes('graph-plotter'),
        icon: <TrendingUp className="h-5 w-5 text-indigo-600" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        defaultSize: { width: 900, height: 700 },
        defaultPosition: { x: 100, y: 80 },
        isResizable: true,
        isMaximizable: true
      },
      {
        id: 'statistics-calculator',
        title: 'Statistics',
        content: <StatisticsCalculator />,
        isOpen: openWindowIds.includes('statistics-calculator'),
        isMinimized: minimizedWindowIds.includes('statistics-calculator'),
        icon: <PieChart className="h-5 w-5 text-pink-600" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        defaultSize: { width: 900, height: 700 },
        defaultPosition: { x: 100, y: 80 },
        isResizable: true,
        isMaximizable: true
      },
      {
        id: 'derivative-calculator',
        title: 'Derivatives',
        content: <DerivativeCalculator />,
        isOpen: openWindowIds.includes('derivative-calculator'),
        isMinimized: minimizedWindowIds.includes('derivative-calculator'),
        icon: <TrendingUp className="h-5 w-5 text-blue-600" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        defaultSize: { width: 900, height: 700 },
        defaultPosition: { x: 100, y: 80 },
        isResizable: true,
        isMaximizable: true
      },
      {
        id: 'integral-calculator',
        title: 'Integrals',
        content: <IntegralCalculator />,
        isOpen: openWindowIds.includes('integral-calculator'),
        isMinimized: minimizedWindowIds.includes('integral-calculator'),
        icon: <Sigma className="h-5 w-5 text-purple-600" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        defaultSize: { width: 900, height: 700 },
        defaultPosition: { x: 100, y: 80 },
        isResizable: true,
        isMaximizable: true
      },
      {
        id: 'trig-calculator',
        title: 'Trigonometry',
        content: <TrigCalculator />,
        isOpen: openWindowIds.includes('trig-calculator'),
        isMinimized: minimizedWindowIds.includes('trig-calculator'),
        icon: <Calculator className="h-5 w-5 text-orange-600" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        defaultSize: { width: 1000, height: 800 },
        defaultPosition: { x: 100, y: 80 },
        isResizable: true,
        isMaximizable: true
      },
      {
        id: 'number-theory',
        title: 'Number Theory',
        content: <NumberTheory />,
        isOpen: openWindowIds.includes('number-theory'),
        isMinimized: minimizedWindowIds.includes('number-theory'),
        icon: <Grid3x3 className="h-5 w-5 text-indigo-600" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        defaultSize: { width: 1000, height: 800 },
        defaultPosition: { x: 100, y: 80 },
        isResizable: true,
        isMaximizable: true
      },
      {
        id: 'percentage-calculator',
        title: 'Percentages',
        content: <PercentageCalculator />,
        isOpen: openWindowIds.includes('percentage-calculator'),
        isMinimized: minimizedWindowIds.includes('percentage-calculator'),
        icon: <PieChart className="h-5 w-5 text-green-600" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        defaultSize: { width: 1000, height: 800 },
        defaultPosition: { x: 100, y: 80 },
        isResizable: true,
        isMaximizable: true
      },
      {
        id: 'wikipedia',
        title: 'Wikipedia',
        content: <Wikipedia />,
        isOpen: openWindowIds.includes('wikipedia'),
        isMinimized: minimizedWindowIds.includes('wikipedia'),
        icon: <Globe className="h-5 w-5 text-blue-500" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },

      {
        id: 'codeeditor',
        title: 'Code Editor',
        content: <CodeEditor />,
        isOpen: openWindowIds.includes('codeeditor'),
        isMinimized: minimizedWindowIds.includes('codeeditor'),
        icon: <Code className="h-5 w-5 text-green-500" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 700 },
      },
      {
        id: 'nocode',
        title: 'No-Code Builder',
        content: <NoCodeBuilder />,
        isOpen: openWindowIds.includes('nocode'),
        isMinimized: minimizedWindowIds.includes('nocode'),
        icon: <Layers className="h-5 w-5 text-orange-500" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 700 },
      },
      {
        id: 'f1',
        title: 'Formula 1',
        content: <F1App />,
        isOpen: openWindowIds.includes('f1'),
        isMinimized: minimizedWindowIds.includes('f1'),
        icon: <Flag className="h-5 w-5 text-red-500" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 900, height: 700 },
      },
      {
        id: 'weather',
        title: 'Weather',
        content: <WeatherApp />,
        isOpen: openWindowIds.includes('weather'),
        isMinimized: minimizedWindowIds.includes('weather'),
        icon: <Cloud className="h-5 w-5 text-blue-400" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 800, height: 700 },
      },
      {
        id: 'imageconverter',
        title: 'Image Converter',
        content: <ImageConverter />,
        isOpen: openWindowIds.includes('imageconverter'),
        isMinimized: minimizedWindowIds.includes('imageconverter'),
        icon: <Image className="h-5 w-5 text-purple-500" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 700, height: 600 },
      },
      {
        id: 'documentconverter',
        title: 'Document Converter',
        content: <DocumentConverter />,
        isOpen: openWindowIds.includes('documentconverter'),
        isMinimized: minimizedWindowIds.includes('documentconverter'),
        icon: <FileText className="h-5 w-5 text-blue-500" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 600, height: 500 },
      },
      {
        id: 'texttohtml',
        title: 'Text to HTML',
        content: <TextToHTML />,
        isOpen: openWindowIds.includes('texttohtml'),
        isMinimized: minimizedWindowIds.includes('texttohtml'),
        icon: <Code className="h-5 w-5 text-green-500" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 900, height: 700 },
      },
      {
        id: 'lengthconverter',
        title: 'Length Converter',
        content: <LengthConverter />,
        isOpen: openWindowIds.includes('lengthconverter'),
        isMinimized: minimizedWindowIds.includes('lengthconverter'),
        icon: <Ruler className="h-5 w-5 text-blue-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 900, height: 700 },
      },
      {
        id: 'weightconverter',
        title: 'Weight Converter',
        content: <WeightConverter />,
        isOpen: openWindowIds.includes('weightconverter'),
        isMinimized: minimizedWindowIds.includes('weightconverter'),
        icon: <Weight className="h-5 w-5 text-purple-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 900, height: 700 },
      },
      {
        id: 'currencyconverter',
        title: 'Currency Converter',
        content: <CurrencyConverter />,
        isOpen: openWindowIds.includes('currencyconverter'),
        isMinimized: minimizedWindowIds.includes('currencyconverter'),
        icon: <DollarSign className="h-5 w-5 text-green-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 900, height: 700 },
      },
      {
        id: 'markdowneditor',
        title: 'Markdown Editor',
        content: <MarkdownEditor />,
        isOpen: openWindowIds.includes('markdowneditor'),
        isMinimized: minimizedWindowIds.includes('markdowneditor'),
        icon: <FileText className="h-5 w-5 text-blue-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 800 },
      },
      {
        id: 'lorem-ipsum',
        title: 'Lorem Ipsum Generator',
        content: <LoremIpsumGenerator />,
        isOpen: openWindowIds.includes('lorem-ipsum'),
        isMinimized: minimizedWindowIds.includes('lorem-ipsum'),
        icon: <FileText className="h-5 w-5 text-purple-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 900, height: 700 },
      },
      {
        id: 'chart-builder',
        title: 'Chart Builder',
        content: <ChartBuilder />,
        isOpen: openWindowIds.includes('chart-builder'),
        isMinimized: minimizedWindowIds.includes('chart-builder'),
        icon: <BarChart3 className="h-5 w-5 text-blue-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 800 },
      },
      {
        id: 'api-tester',
        title: 'API Tester',
        content: <APITester />,
        isOpen: openWindowIds.includes('api-tester'),
        isMinimized: minimizedWindowIds.includes('api-tester'),
        icon: <Code className="h-5 w-5 text-purple-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'regex-tester',
        title: 'Regex Tester',
        content: <RegexTester />,
        isOpen: openWindowIds.includes('regex-tester'),
        isMinimized: minimizedWindowIds.includes('regex-tester'),
        icon: <Code className="h-5 w-5 text-orange-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 900, height: 700 },
      },
      {
        id: 'base64-converter',
        title: 'Base64 Encoder/Decoder',
        content: <Base64Converter />,
        isOpen: openWindowIds.includes('base64-converter'),
        isMinimized: minimizedWindowIds.includes('base64-converter'),
        icon: <Code className="h-5 w-5 text-purple-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 900, height: 700 },
      },
      {
        id: 'password-generator',
        title: 'Password Generator',
        content: <PasswordGenerator />,
        isOpen: openWindowIds.includes('password-generator'),
        isMinimized: minimizedWindowIds.includes('password-generator'),
        icon: <Crown className="h-5 w-5 text-purple-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 700, height: 650 },
      },
      {
        id: 'temperature-converter',
        title: 'Temperature Converter',
        content: <TemperatureConverter />,
        isOpen: openWindowIds.includes('temperature-converter'),
        isMinimized: minimizedWindowIds.includes('temperature-converter'),
        icon: <Thermometer className="h-5 w-5 text-red-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 900, height: 700 },
      },
      {
        id: 'speed-converter',
        title: 'Speed Converter',
        content: <SpeedConverter />,
        isOpen: openWindowIds.includes('speed-converter'),
        isMinimized: minimizedWindowIds.includes('speed-converter'),
        icon: <Gauge className="h-5 w-5 text-cyan-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 900, height: 700 },
      },
      {
        id: 'energy-converter',
        title: 'Energy Converter',
        content: <EnergyConverter />,
        isOpen: openWindowIds.includes('energy-converter'),
        isMinimized: minimizedWindowIds.includes('energy-converter'),
        icon: <Zap className="h-5 w-5 text-yellow-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 900, height: 700 },
      },
      {
        id: 'power-converter',
        title: 'Power Converter',
        content: <PowerConverter />,
        isOpen: openWindowIds.includes('power-converter'),
        isMinimized: minimizedWindowIds.includes('power-converter'),
        icon: <Zap className="h-5 w-5 text-violet-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 900, height: 700 },
      },
      {
        id: 'pressure-converter',
        title: 'Pressure Converter',
        content: <PressureConverter />,
        isOpen: openWindowIds.includes('pressure-converter'),
        isMinimized: minimizedWindowIds.includes('pressure-converter'),
        icon: <Gauge className="h-5 w-5 text-emerald-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 900, height: 700 },
      },
      {
        id: 'volume-converter',
        title: 'Volume Converter',
        content: <VolumeConverter />,
        isOpen: openWindowIds.includes('volume-converter'),
        isMinimized: minimizedWindowIds.includes('volume-converter'),
        icon: <Droplet className="h-5 w-5 text-sky-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 900, height: 700 },
      },
      {
        id: 'time-converter',
        title: 'Time Converter',
        content: <TimeConverter />,
        isOpen: openWindowIds.includes('time-converter'),
        isMinimized: minimizedWindowIds.includes('time-converter'),
        icon: <Clock className="h-5 w-5 text-indigo-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 900, height: 700 },
      },
      {
        id: 'area-converter',
        title: 'Area Converter',
        content: <AreaConverter />,
        isOpen: openWindowIds.includes('area-converter'),
        isMinimized: minimizedWindowIds.includes('area-converter'),
        icon: <Ruler className="h-5 w-5 text-lime-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 900, height: 700 },
      },
      {
        id: 'data-formatter',
        title: 'JSON/XML Formatter',
        content: <DataFormatter />,
        isOpen: openWindowIds.includes('data-formatter'),
        isMinimized: minimizedWindowIds.includes('data-formatter'),
        icon: <Code className="h-5 w-5 text-green-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'color-picker',
        title: 'Color Picker',
        content: <ColorPicker />,
        isOpen: openWindowIds.includes('color-picker'),
        isMinimized: minimizedWindowIds.includes('color-picker'),
        icon: <Palette className="h-5 w-5 text-pink-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 900, height: 700 },
      },
      {
        id: 'spreadsheet',
        title: 'Spreadsheet',
        content: <Spreadsheet />,
        isOpen: openWindowIds.includes('spreadsheet'),
        isMinimized: minimizedWindowIds.includes('spreadsheet'),
        icon: <Table className="h-5 w-5 text-green-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'texteditor',
        title: 'Text Editor',
        content: <TextEditor />,
        isOpen: openWindowIds.includes('texteditor'),
        isMinimized: minimizedWindowIds.includes('texteditor'),
        icon: <FileText className="h-5 w-5 text-blue-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: true,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'presentation',
        title: 'Presentation',
        content: <PresentationApp />,
        isOpen: openWindowIds.includes('presentation'),
        isMinimized: minimizedWindowIds.includes('presentation'),
        icon: <Presentation className="h-5 w-5 text-purple-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 800 },
      },
      {
        id: 'formbuilder',
        title: 'Form Builder',
        content: <FormBuilder />,
        isOpen: openWindowIds.includes('formbuilder'),
        isMinimized: minimizedWindowIds.includes('formbuilder'),
        icon: <ClipboardList className="h-5 w-5 text-indigo-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 800 },
      },
      {
        id: 'kanban',
        title: 'Task Board',
        content: <KanbanBoard />,
        isOpen: openWindowIds.includes('kanban'),
        isMinimized: minimizedWindowIds.includes('kanban'),
        icon: <CheckSquare className="h-5 w-5 text-indigo-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1400, height: 800 },
      },
      {
        id: 'electromagneticlab',
        title: 'Electromagnetic Lab',
        content: <ElectromagneticLab />,
        isOpen: openWindowIds.includes('electromagneticlab'),
        isMinimized: minimizedWindowIds.includes('electromagneticlab'),
        icon: <Zap className="h-5 w-5 text-purple-600" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 900 },
      },
      {
        id: 'optics-simulator',
        title: 'Optics Simulator',
        content: <OpticsSimulator />,
        isOpen: openWindowIds.includes('optics-simulator'),
        isMinimized: minimizedWindowIds.includes('optics-simulator'),
        icon: <Eye className="h-5 w-5 text-cyan-600" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1100, height: 800 },
        defaultPosition: { x: 100, y: 80 },
        theme: WINDOW_THEMES.cyan,
      },
      {
        id: 'electric-field',
        title: 'Electric Field',
        content: <ElectricFieldVisualizer />,
        isOpen: openWindowIds.includes('electric-field'),
        isMinimized: minimizedWindowIds.includes('electric-field'),
        icon: <Zap className="h-5 w-5 text-yellow-600" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1100, height: 800 },
        defaultPosition: { x: 100, y: 80 },
        theme: WINDOW_THEMES.yellow,
      },
      {
        id: 'magnetic-field',
        title: 'Magnetic Field',
        content: <MagneticFieldVisualizer />,
        isOpen: openWindowIds.includes('magnetic-field'),
        isMinimized: minimizedWindowIds.includes('magnetic-field'),
        icon: <Atom className="h-5 w-5 text-blue-600" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1100, height: 800 },
        defaultPosition: { x: 100, y: 80 },
        theme: WINDOW_THEMES.blue,
      },
      {
        id: 'rocket-propulsion',
        title: 'Rocket Propulsion',
        content: <RocketPropulsion />,
        isOpen: openWindowIds.includes('rocket-propulsion'),
        isMinimized: minimizedWindowIds.includes('rocket-propulsion'),
        icon: <Rocket className="h-5 w-5 text-orange-600" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 900 },
        defaultPosition: { x: 100, y: 80 },
        theme: WINDOW_THEMES.orange,
      },
      {
        id: 'stockmarket',
        title: 'Stock Market',
        content: <StockMarket />,
        isOpen: openWindowIds.includes('stockmarket'),
        isMinimized: minimizedWindowIds.includes('stockmarket'),
        icon: <TrendingUp className="h-5 w-5 text-green-500" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 700, height: 600 },
      },
      {
        id: 'cryptocurrency',
        title: 'Cryptocurrency',
        content: <Cryptocurrency />,
        isOpen: openWindowIds.includes('cryptocurrency'),
        isMinimized: minimizedWindowIds.includes('cryptocurrency'),
        icon: <Bitcoin className="h-5 w-5 text-orange-500" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 700, height: 600 },
      },
      {
        id: 'sports',
        title: 'Sports',
        content: <SportsApp />,
        isOpen: openWindowIds.includes('sports'),
        isMinimized: minimizedWindowIds.includes('sports'),
        icon: <Trophy className="h-5 w-5 text-yellow-500" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 700, height: 600 },
      },
      {
        id: 'nasa',
        title: 'NASA',
        content: <NASAApp />,
        isOpen: openWindowIds.includes('nasa'),
        isMinimized: minimizedWindowIds.includes('nasa'),
        icon: <Rocket className="h-5 w-5 text-blue-400" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 900, height: 700 },
      },
      {
        id: 'tetris',
        title: 'Tetris',
        content: <Tetris />,
        isOpen: openWindowIds.includes('tetris'),
        isMinimized: minimizedWindowIds.includes('tetris'),
        icon: <Gamepad className="h-5 w-5" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 500, height: 700 },
      },
      {
        id: 'game2048',
        title: '2048',
        content: <Game2048 />,
        isOpen: openWindowIds.includes('game2048'),
        isMinimized: minimizedWindowIds.includes('game2048'),
        icon: <Gamepad className="h-5 w-5" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 500, height: 650 },
      },
      {
        id: 'sudoku',
        title: 'Sudoku',
        content: <Sudoku />,
        isOpen: openWindowIds.includes('sudoku'),
        isMinimized: minimizedWindowIds.includes('sudoku'),
        icon: <Gamepad className="h-5 w-5" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 550, height: 700 },
      },
      {
        id: 'breakout',
        title: 'Breakout',
        content: <Breakout />,
        isOpen: openWindowIds.includes('breakout'),
        isMinimized: minimizedWindowIds.includes('breakout'),
        icon: <Gamepad className="h-5 w-5" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 600, height: 650 },
      },
      {
        id: 'memorymatch',
        title: 'Memory Match',
        content: <MemoryMatch />,
        isOpen: openWindowIds.includes('memorymatch'),
        isMinimized: minimizedWindowIds.includes('memorymatch'),
        icon: <Gamepad className="h-5 w-5" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 500, height: 600 },
      },
      {
        id: 'spaceinvaders',
        title: 'Space Invaders',
        content: <SpaceInvaders />,
        isOpen: openWindowIds.includes('spaceinvaders'),
        isMinimized: minimizedWindowIds.includes('spaceinvaders'),
        icon: <Gamepad className="h-5 w-5" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 600, height: 650 },
      },

      {
        id: 'sortingvisualizer',
        title: 'Sorting Visualizer',
        content: <SortingVisualizer />,
        isOpen: openWindowIds.includes('sortingvisualizer'),
        isMinimized: minimizedWindowIds.includes('sortingvisualizer'),
        icon: <BarChart3 className="h-5 w-5 text-indigo-500" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 800 },
      },
      {
        id: 'pathfinding',
        title: 'Pathfinding Visualizer',
        content: <PathfindingVisualizer />,
        isOpen: openWindowIds.includes('pathfinding'),
        isMinimized: minimizedWindowIds.includes('pathfinding'),
        icon: <Flag className="h-5 w-5 text-blue-500" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1400, height: 900 },
      },
      {
        id: 'periodictable',
        title: 'Periodic Table',
        content: <PeriodicTable />,
        isOpen: openWindowIds.includes('periodictable'),
        isMinimized: minimizedWindowIds.includes('periodictable'),
        icon: <Atom className="h-5 w-5 text-green-500" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'molecularviewer',
        title: '3D Molecules',
        content: <MolecularViewer />,
        isOpen: openWindowIds.includes('molecularviewer'),
        isMinimized: minimizedWindowIds.includes('molecularviewer'),
        icon: <Atom className="h-5 w-5 text-teal-500" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 900, height: 700 },
      },
      {
        id: 'reactionsimulator',
        title: 'Chemical Reactions',
        content: <ReactionSimulator />,
        isOpen: openWindowIds.includes('reactionsimulator'),
        isMinimized: minimizedWindowIds.includes('reactionsimulator'),
        icon: <Beaker className="h-5 w-5 text-green-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'equation-balancer',
        title: 'Equation Balancer',
        content: <EquationBalancer />,
        isOpen: openWindowIds.includes('equation-balancer'),
        isMinimized: minimizedWindowIds.includes('equation-balancer'),
        icon: <FlaskConical className="h-5 w-5 text-blue-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 900, height: 700 },
      },
      {
        id: 'projectilemotion',
        title: 'Projectile Motion',
        content: <ProjectileMotion />,
        isOpen: openWindowIds.includes('projectilemotion'),
        isMinimized: minimizedWindowIds.includes('projectilemotion'),
        icon: <Zap className="h-5 w-5 text-blue-500" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'pendulum',
        title: 'Pendulum Simulator',
        content: <PendulumSimulator />,
        isOpen: openWindowIds.includes('pendulum'),
        isMinimized: minimizedWindowIds.includes('pendulum'),
        icon: <Atom className="h-5 w-5 text-purple-500" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'spring',
        title: 'Spring Oscillator',
        content: <SpringSimulator />,
        isOpen: openWindowIds.includes('spring'),
        isMinimized: minimizedWindowIds.includes('spring'),
        icon: <Waves className="h-5 w-5 text-teal-500" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'waves',
        title: 'Wave Interference',
        content: <WaveSimulator />,
        isOpen: openWindowIds.includes('waves'),
        isMinimized: minimizedWindowIds.includes('waves'),
        icon: <Zap className="h-5 w-5 text-cyan-500" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'collisions',
        title: 'Collision Simulator',
        content: <CollisionSimulator />,
        isOpen: openWindowIds.includes('collisions'),
        isMinimized: minimizedWindowIds.includes('collisions'),
        icon: <Atom className="h-5 w-5 text-orange-500" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'cnnvisualizer',
        title: 'CNN Visualizer',
        content: <CNNVisualizer />,
        isOpen: openWindowIds.includes('cnnvisualizer'),
        isMinimized: minimizedWindowIds.includes('cnnvisualizer'),
        icon: <Layers className="h-5 w-5 text-indigo-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1400, height: 900 },
      },
      {
        id: 'qrcode',
        title: 'QR Code Generator',
        content: <QRCodeVisualizer />,
        isOpen: openWindowIds.includes('qrcode'),
        isMinimized: minimizedWindowIds.includes('qrcode'),
        icon: <QrCode className="h-5 w-5 text-purple-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 800 },
      },
      {
        id: 'flighttracker',
        title: 'Flight Tracker',
        content: <FlightTracker />,
        isOpen: openWindowIds.includes('flighttracker'),
        isMinimized: minimizedWindowIds.includes('flighttracker'),
        icon: <Plane className="h-5 w-5 text-sky-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1400, height: 900 },
      },
      {
        id: 'shiptracker',
        title: 'Ship Tracker',
        content: <ShipTracker />,
        isOpen: openWindowIds.includes('shiptracker'),
        isMinimized: minimizedWindowIds.includes('shiptracker'),
        icon: <Ship className="h-5 w-5 text-cyan-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1400, height: 900 },
      },
      {
        id: 'maze3d',
        title: '3D Maze',
        content: <Maze3D />,
        isOpen: openWindowIds.includes('maze3d'),
        isMinimized: minimizedWindowIds.includes('maze3d'),
        icon: <Gamepad className="h-5 w-5 text-green-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 800 },
      },
      {
        id: 'battleship',
        title: 'Battleship',
        content: <Battleship />,
        isOpen: openWindowIds.includes('battleship'),
        isMinimized: minimizedWindowIds.includes('battleship'),
        icon: <Ship className="h-5 w-5 text-blue-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 900, height: 800 },
      },
      {
        id: 'connect4',
        title: 'Connect 4',
        content: <Connect4 />,
        isOpen: openWindowIds.includes('connect4'),
        isMinimized: minimizedWindowIds.includes('connect4'),
        icon: <Gamepad className="h-5 w-5 text-purple-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 700, height: 800 },
      },
      {
        id: 'dvdscreensaver',
        title: 'DVD Screensaver',
        content: <DVDScreensaver />,
        isOpen: openWindowIds.includes('dvdscreensaver'),
        isMinimized: minimizedWindowIds.includes('dvdscreensaver'),
        icon: <Gamepad className="h-5 w-5 text-blue-500" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 800, height: 600 },
      },
      {
        id: 'sandfalling',
        title: 'Sand Falling',
        content: <SandFalling />,
        isOpen: openWindowIds.includes('sandfalling'),
        isMinimized: minimizedWindowIds.includes('sandfalling'),
        icon: <Gamepad className="h-5 w-5 text-yellow-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 800, height: 700 },
      },
      {
        id: 'puzzle15',
        title: '15 Puzzle',
        content: <Puzzle15 />,
        isOpen: openWindowIds.includes('puzzle15'),
        isMinimized: minimizedWindowIds.includes('puzzle15'),
        icon: <Gamepad className="h-5 w-5 text-green-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 500, height: 600 },
      },
      {
        id: 'universe',
        title: 'Universe Simulator',
        content: <UniverseSimulator />,
        isOpen: openWindowIds.includes('universe'),
        isMinimized: minimizedWindowIds.includes('universe'),
        icon: <Rocket className="h-5 w-5 text-indigo-500" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1400, height: 900 },
      },
      {
        id: 'palette-generator',
        title: 'Palette Generator',
        content: <ColorPaletteGenerator />,
        isOpen: openWindowIds.includes('palette-generator'),
        isMinimized: minimizedWindowIds.includes('palette-generator'),
        icon: <Palette className="h-5 w-5 text-purple-600" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false,
        showInTaskbar: true,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 800 },
      },
      {
        id: 'trending-palettes',
        title: 'Trending Palettes',
        content: <TrendingPalettes />,
        isOpen: openWindowIds.includes('trending-palettes'),
        isMinimized: minimizedWindowIds.includes('trending-palettes'),
        icon: <TrendingUp className="h-5 w-5 text-blue-600" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false,
        showInTaskbar: true,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1400, height: 900 },
      },
      {
        id: 'contrast-checker',
        title: 'Contrast Checker',
        content: <ContrastChecker />,
        isOpen: openWindowIds.includes('contrast-checker'),
        isMinimized: minimizedWindowIds.includes('contrast-checker'),
        icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false,
        showInTaskbar: true,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 800 },
      },
      {
        id: 'hex-parser',
        title: 'Hex Code Parser',
        content: <HexCodeParser />,
        isOpen: openWindowIds.includes('hex-parser'),
        isMinimized: minimizedWindowIds.includes('hex-parser'),
        icon: <Code className="h-5 w-5 text-orange-600" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false,
        showInTaskbar: true,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 900 },
      },
      {
        id: 'palette-visualizer',
        title: 'Palette Visualizer',
        content: <PaletteVisualizer />,
        isOpen: openWindowIds.includes('palette-visualizer'),
        isMinimized: minimizedWindowIds.includes('palette-visualizer'),
        icon: <Eye className="h-5 w-5 text-indigo-600" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false,
        showInTaskbar: true,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1400, height: 900 },
      },
      {
        id: 'gradient-generator',
        title: 'Gradient Generator',
        content: <GradientGenerator />,
        isOpen: openWindowIds.includes('gradient-generator'),
        isMinimized: minimizedWindowIds.includes('gradient-generator'),
        icon: <Waves className="h-5 w-5 text-purple-600" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false,
        showInTaskbar: true,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 900 },
      },
      {
        id: 'pixel-art-editor',
        title: 'Pixel Art Editor',
        content: <PixelArtEditorColors />,
        isOpen: openWindowIds.includes('pixel-art-editor'),
        isMinimized: minimizedWindowIds.includes('pixel-art-editor'),
        icon: <Grid3x3 className="h-5 w-5 text-pink-600" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false,
        showInTaskbar: true,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 900 },
      },
      {
        id: 'visualizer-landing',
        title: 'Landing Page Visualizer',
        content: (
          <div className="h-full flex flex-col bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 overflow-auto">
            <MockLandingPage colors={{ primary: '#3B82F6', background: '#FFFFFF', accent: '#F59E0B', text: '#1F2937' }} isWCAG={false} getAccessibleColor={(fg, bg) => fg} />
          </div>
        ),
        isOpen: openWindowIds.includes('visualizer-landing'),
        isMinimized: minimizedWindowIds.includes('visualizer-landing'),
        icon: <Eye className="h-5 w-5 text-indigo-600" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false,
        showInTaskbar: true,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 900 },
      },
      {
        id: 'visualizer-dashboard',
        title: 'Dashboard Visualizer',
        content: (
          <div className="h-full flex flex-col bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 p-4 overflow-auto">
            <MockDashboard colors={{ primary: '#3B82F6', background: '#FFFFFF', accent: '#F59E0B', text: '#1F2937' }} isWCAG={false} getAccessibleColor={(fg, bg) => fg} />
          </div>
        ),
        isOpen: openWindowIds.includes('visualizer-dashboard'),
        isMinimized: minimizedWindowIds.includes('visualizer-dashboard'),
        icon: <Eye className="h-5 w-5 text-cyan-600" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false,
        showInTaskbar: true,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 900 },
      },
      {
        id: 'visualizer-social',
        title: 'Social Media Visualizer',
        content: (
          <div className="h-full flex flex-col bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 p-4 overflow-auto">
            <MockSocialMediaPage colors={{ primary: '#3B82F6', background: '#FFFFFF', accent: '#F59E0B', text: '#1F2937' }} isWCAG={false} getAccessibleColor={(fg, bg) => fg} />
          </div>
        ),
        isOpen: openWindowIds.includes('visualizer-social'),
        isMinimized: minimizedWindowIds.includes('visualizer-social'),
        icon: <Eye className="h-5 w-5 text-pink-600" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false,
        showInTaskbar: true,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 900 },
      },
      {
        id: 'visualizer-blog',
        title: 'Blog Post Visualizer',
        content: (
          <div className="h-full flex flex-col bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 overflow-auto">
            <MockBlogPage colors={{ primary: '#3B82F6', background: '#FFFFFF', accent: '#F59E0B', text: '#1F2937' }} isWCAG={false} getAccessibleColor={(fg, bg) => fg} />
          </div>
        ),
        isOpen: openWindowIds.includes('visualizer-blog'),
        isMinimized: minimizedWindowIds.includes('visualizer-blog'),
        icon: <Eye className="h-5 w-5 text-amber-600" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false,
        showInTaskbar: true,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 900 },
      }
    ];

    // Notepad removed from showing by default

    if (settings.showBattery) {
      utilityWindows.push({
        id: 'battery',
        title: 'Battery',
        content: <BatteryLevel />,
        isOpen: openWindowIds.includes('battery'),
        isMinimized: minimizedWindowIds.includes('battery'),
        icon: <Battery className="h-5 w-5" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 350, height: 300 },
      });
    }

    // No longer needed - apps are filtered in FolderContent

    const gamesFolderWindow: WindowType = {
      id: 'games-folder-window',
      title: 'Games',
      content: <FolderContent type="games" />,
      isOpen: openWindowIds.includes('games-folder-window'),
      isMinimized: minimizedWindowIds.includes('games-folder-window'),
      icon: <Gamepad className="h-5 w-5 text-amber-500" />,
      zIndex: 100,
      defaultSize: { width: 800, height: 600 },
      showInStartMenu: false,
      showInTaskbar: true,
      isResizable: true,
      isMaximizable: true,
    };

    const officeFolderWindow: WindowType = {
      id: 'office-folder-window',
      title: 'Office Suite',
      content: <FolderContent type="office" />,
      isOpen: openWindowIds.includes('office-folder-window'),
      isMinimized: minimizedWindowIds.includes('office-folder-window'),
      icon: <Briefcase className="h-5 w-5 text-blue-600" />,
      zIndex: 100,
      defaultSize: { width: 700, height: 500 },
      showInStartMenu: false,
      showInTaskbar: true,
      isResizable: true,
      isMaximizable: true,
    };

    const convertersFolderWindow: WindowType = {
      id: 'converters-folder-window',
      title: 'Converters',
      content: <FolderContent type="converters" />,
      isOpen: openWindowIds.includes('converters-folder-window'),
      isMinimized: minimizedWindowIds.includes('converters-folder-window'),
      icon: <Repeat className="h-5 w-5 text-purple-500" />,
      zIndex: 100,
      defaultSize: { width: 700, height: 500 },
      showInStartMenu: false,
      showInTaskbar: true,
      isResizable: true,
      isMaximizable: true,
    };

    const simulatorsFolderWindow: WindowType = {
      id: 'simulators-folder-window',
      title: 'Simulators',
      content: <FolderContent type="simulators" />,
      isOpen: openWindowIds.includes('simulators-folder-window'),
      isMinimized: minimizedWindowIds.includes('simulators-folder-window'),
      icon: <FlaskConical className="h-5 w-5 text-purple-500" />,
      zIndex: 100,
      defaultSize: { width: 700, height: 500 },
      showInStartMenu: false,
      showInTaskbar: true,
      isResizable: true,
      isMaximizable: true,
    };

    const chemistryFolderWindow: WindowType = {
      id: 'chemistry-folder-window',
      title: 'Chemistry Lab',
      content: <FolderContent type="chemistry" />,
      isOpen: openWindowIds.includes('chemistry-folder-window'),
      isMinimized: minimizedWindowIds.includes('chemistry-folder-window'),
      icon: <Beaker className="h-5 w-5 text-green-500" />,
      zIndex: 100,
      defaultSize: { width: 700, height: 500 },
      showInStartMenu: false,
      showInTaskbar: true,
      isResizable: true,
      isMaximizable: true,
    };

    const physicsFolderWindow: WindowType = {
      id: 'physics-folder-window',
      title: 'Physics Lab',
      content: <FolderContent type="physics" />,
      isOpen: openWindowIds.includes('physics-folder-window'),
      isMinimized: minimizedWindowIds.includes('physics-folder-window'),
      icon: <Zap className="h-5 w-5 text-blue-500" />,
      zIndex: 100,
      defaultSize: { width: 700, height: 500 },
      showInStartMenu: false,
      showInTaskbar: true,
      isResizable: true,
      isMaximizable: true,
    };

    const utilitiesFolderWindow: WindowType = {
      id: 'utilities-folder-window',
      title: 'Utilities',
      content: <UtilitiesFolder />,
      isOpen: openWindowIds.includes('utilities-folder-window'),
      isMinimized: minimizedWindowIds.includes('utilities-folder-window'),
      icon: <Folder className="h-5 w-5 text-blue-500" />,
      zIndex: 100,
      defaultSize: { width: 800, height: 600 },
      showInStartMenu: false,
      showInTaskbar: true,
      isResizable: true,
      isMaximizable: true,
    };

    const colorsFolderWindow: WindowType = {
      id: 'colors-folder-window',
      title: 'Colors for Artists',
      content: <ColorsFolder />,
      isOpen: openWindowIds.includes('colors-folder-window'),
      isMinimized: minimizedWindowIds.includes('colors-folder-window'),
      icon: <Sparkles className="h-5 w-5 text-purple-500" />,
      zIndex: FOLDER_ZINDEX,
      defaultSize: { width: 900, height: 700 },
      showInStartMenu: true,
      showInTaskbar: true,
      isResizable: true,
      isMaximizable: true,
    };

    const newsFolderWindow: WindowType = {
      id: 'news-folder-window',
      title: 'News & Data',
      content: <NewsFolder />,
      isOpen: openWindowIds.includes('news-folder-window'),
      isMinimized: minimizedWindowIds.includes('news-folder-window'),
      icon: <Newspaper className="h-5 w-5 text-blue-500" />,
      zIndex: FOLDER_ZINDEX,
      defaultSize: { width: 900, height: 700 },
      showInStartMenu: true,
      showInTaskbar: true,
      isResizable: true,
      isMaximizable: true,
    };

    const virtualEngineFolderWindow: WindowType = {
      id: 'virtual-engine-folder-window',
      title: 'Virtual Engine',
      content: <VirtualEngineFolder />,
      isOpen: openWindowIds.includes('virtual-engine-folder-window'),
      isMinimized: minimizedWindowIds.includes('virtual-engine-folder-window'),
      icon: <Cpu className="h-5 w-5 text-indigo-500" />,
      zIndex: FOLDER_ZINDEX,
      defaultSize: { width: 900, height: 700 },
      showInStartMenu: true,
      showInTaskbar: true,
      isResizable: true,
      isMaximizable: true,
    };

    const mathFolderWindow: WindowType = {
      id: 'math-folder-window',
      title: 'Math Tools',
      content: <MathFolder />,
      isOpen: openWindowIds.includes('math-folder-window'),
      isMinimized: minimizedWindowIds.includes('math-folder-window'),
      icon: <Sigma className="h-5 w-5 text-purple-600" />,
      zIndex: FOLDER_ZINDEX,
      defaultSize: { width: 900, height: 700 },
      showInStartMenu: true,
      showInTaskbar: true,
      isResizable: true,
      isMaximizable: true,
    };

    setWindows([
      ...portfolioWindows,
      ...utilityWindows,
      gamesFolderWindow,
      officeFolderWindow,
      convertersFolderWindow,
      simulatorsFolderWindow,
      chemistryFolderWindow,
      physicsFolderWindow,
      utilitiesFolderWindow,
      colorsFolderWindow,
      newsFolderWindow,
      virtualEngineFolderWindow,
      mathFolderWindow
    ]);
  };

  useEffect(() => {
    localStorage.setItem('win11-settings', JSON.stringify(settings));
    localStorage.setItem('win11-theme', settings.theme);

    // Apply dark mode immediately and smoothly
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Re-initialize windows when settings change to reflect toggle changes
    const openWindows = windows.filter(w => w.isOpen).map(w => w.id);
    const minimized = minimizedWindows;
    initializeWindows(openWindows, minimized);
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('win11-wallpaper', wallpaper);
  }, [wallpaper]);

  useEffect(() => {
    const openWindows = windows.filter(w => w.isOpen).map(w => w.id);
    localStorage.setItem('win11-open-windows', JSON.stringify(openWindows));
  }, [windows]);

  useEffect(() => {
    localStorage.setItem('win11-minimized-windows', JSON.stringify(minimizedWindows));
  }, [minimizedWindows]);

  const toggleWindow = (id: string) => {
    // First, immediately bring to front to ensure highest z-index
    setWindows(prevWindows => {
      const existingWindow = prevWindows.find(w => w.id === id);

      // ALWAYS get the absolute highest z-index and add a significant amount
      const allZIndexes = prevWindows.map(w => w.zIndex || 0);
      const absoluteMaxZIndex = Math.max(...allZIndexes, APP_ZINDEX);
      const newZIndex = absoluteMaxZIndex + (ZINDEX_INCREMENT * 2); // Double increment for more separation

      console.log('toggleWindow:', id, 'absoluteMax:', absoluteMaxZIndex, 'newZIndex:', newZIndex);

      if (existingWindow) {
        const isMinimized = minimizedWindows.includes(id);

        if (!existingWindow.isOpen || isMinimized) {
          // Set position to stack on top of each other
          let cascadePosition = existingWindow.defaultPosition;
          if (!cascadePosition) {
            cascadePosition = {
              x: 100,
              y: 80
            };
          }

          // When opening a window, give it the HIGHEST z-index
          return prevWindows.map(window => ({
            ...window,
            isOpen: window.id === id ? true : window.isOpen,
            isMinimized: window.id === id ? false : window.isMinimized,
            defaultPosition: window.id === id ? cascadePosition : window.defaultPosition,
            zIndex: window.id === id ? newZIndex : window.zIndex
          }));
        } else {
          // If window is already open, just bring it to front with highest z-index
          return prevWindows.map(window => ({
            ...window,
            zIndex: window.id === id ? newZIndex : window.zIndex
          }));
        }
      }
      return prevWindows;
    });

    setMinimizedWindows(prev => prev.filter(winId => winId !== id));

    // Force a second update after a tiny delay to ensure z-index is applied
    setTimeout(() => {
      setWindows(prevWindows => {
        const allZIndexes = prevWindows.map(w => w.zIndex || 0);
        const absoluteMaxZIndex = Math.max(...allZIndexes, APP_ZINDEX);
        const newZIndex = absoluteMaxZIndex + ZINDEX_INCREMENT;

        return prevWindows.map(window => ({
          ...window,
          zIndex: window.id === id ? newZIndex : window.zIndex
        }));
      });
    }, 50);
  };

  const closeWindow = (id: string) => {
    setWindows(prevWindows =>
      prevWindows.map(window => ({
        ...window,
        isOpen: window.id === id ? false : window.isOpen,
        isMinimized: window.id === id ? false : window.isMinimized
      }))
    );
    setMinimizedWindows(prev => prev.filter(winId => winId !== id));
  };

  const minimizeWindow = (id: string) => {
    setWindows(prevWindows =>
      prevWindows.map(window => ({
        ...window,
        isMinimized: window.id === id ? true : window.isMinimized,
        isOpen: window.id === id ? true : window.isOpen
      }))
    );

    if (!minimizedWindows.includes(id)) {
      setMinimizedWindows(prev => [...prev, id]);
    }
  };

  const bringToFront = (id: string) => {
    setWindows(prevWindows => {
      const currentMaxZIndex = Math.max(...prevWindows.map(w => w.zIndex || 0));
      const newZIndex = Math.max(currentMaxZIndex, APP_ZINDEX) + ZINDEX_INCREMENT;

      return prevWindows.map(window => ({
        ...window,
        zIndex: window.id === id ? newZIndex : window.zIndex,
        isMinimized: window.id === id ? false : window.isMinimized,
        isOpen: window.id === id ? true : window.isOpen
      }));
    });

    setMinimizedWindows(prev => prev.filter(winId => winId !== id));
  };

  const handleShutdown = () => {
    setIsShuttingDown(true);

    setWindows(prevWindows =>
      prevWindows.map(window => ({
        ...window,
        isOpen: false,
        isMinimized: false
      }))
    );
    setMinimizedWindows([]);

    const shutdownContainer = document.createElement('div');
    shutdownContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: #0078D7;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
    `;

    shutdownContainer.innerHTML = `<div class="shutdown-loader"></div>`;

    const style = document.createElement('style');
    style.textContent = `
      .shutdown-loader {
        border: 4px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top: 4px solid white;
        width: 40px;
        height: 40px;
        animation: shutdownSpin 1s linear infinite;
      }
      @keyframes shutdownSpin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;

    document.body.appendChild(style);
    document.body.appendChild(shutdownContainer);

    setTimeout(() => {
      shutdownContainer.style.transition = 'background 0.5s ease-in-out';
      shutdownContainer.style.background = 'black';
      shutdownContainer.innerHTML = '';
      document.body.style.cursor = 'none';
      localStorage.setItem('win11-is-shutdown', 'true');
    }, 6000);
  };

  return (
    <WindowsContext.Provider
      value={{
        windows,
        highestZIndex,
        toggleWindow,
        closeWindow,
        minimizeWindow,
        bringToFront,
        settings,
        setSettings,
        minimizedWindows,
        setWallpaper,
        wallpaper,
        isShuttingDown,
        handleShutdown
      }}
    >
      {children}
    </WindowsContext.Provider>
  );
};
