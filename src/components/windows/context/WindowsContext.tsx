import React, { createContext, useState, useContext, useEffect, useRef, useMemo, useCallback, startTransition } from 'react';
import { WindowType } from '../types/WindowTypes';
import { WINDOW_THEMES, WALLPAPER_TO_THEME, WindowThemeName, DARK_VEIL } from '../themes/windowThemes';
import { Settings as SettingsIcon, Clock, FileText, Battery, Timer, Terminal as TerminalIcon, StickyNote, Gamepad, PaintBucket, Folder, Crown, Globe, RefreshCcw, Code, Layers, Flag, Cloud, Image, Table, Presentation, TrendingUp, Bitcoin, Trophy, Rocket, Briefcase, Repeat, FlaskConical, BarChart3, Beaker, Zap, Atom, QrCode, Plane, Ship, Palette, Sparkles, CheckCircle2, Eye, Cpu, Waves, Brain, ClipboardList, CheckSquare, Ruler, Weight, DollarSign, Sigma, Calculator, Grid3x3, PieChart, Calendar as CalendarIcon, GitBranch, Gauge, Thermometer, Droplet, Shield, Wind, Microscope, Dna, Heart, Circle, Lightbulb, Scan, Settings, Sun, Moon, Mountain, Star, Binary, CircuitBoard, MemoryStick, Cog, Wrench, Bolt, Lock, Key, Hash, Fingerprint, KeyRound, FileKey, AlertTriangle, Bug, Users, Database } from 'lucide-react';

// Import Mock Visualizer Components

// Science Module Imports

// Biology Lab - New

// Earth & Space Sciences

// Engine/CS - New
import { Music } from 'lucide-react';
import { Network, Scissors } from 'lucide-react';

// ---------------------------------------------------------------------------
// App components are code-split: each is fetched on first open rather than
// bundled into the initial payload. Window content is rendered inside a
// <Suspense> boundary (see WindowsDisplay) that shows a loading placeholder.
// ---------------------------------------------------------------------------
const AESEncryption = React.lazy(() => import('../features/cryptography/AESEncryption').then(m => ({ default: m.AESEncryption })));
const APITester = React.lazy(() => import('../features/creative/engine/APITester').then(m => ({ default: m.APITester })));
const AlgorithmExplainers = React.lazy(() => import('../features/engine/machine-learning/AlgorithmExplainers').then(m => ({ default: m.AlgorithmExplainers })));
const AreaConverter = React.lazy(() => import('../features/converters/AreaConverter').then(m => ({ default: m.AreaConverter })));
const Arpeggiator = React.lazy(() => import('../features/music/Arpeggiator').then(m => ({ default: m.Arpeggiator })));
const AtmosphericLayers = React.lazy(() => import('../features/science/earthspace/AtmosphericLayers').then(m => ({ default: m.AtmosphericLayers })));
const BacktrackingVisualizer = React.lazy(() => import('../features/algorithms/BacktrackingVisualizer').then(m => ({ default: m.BacktrackingVisualizer })));
const Base64Converter = React.lazy(() => import('../features/converters/Base64Converter').then(m => ({ default: m.Base64Converter })));
const BatteryLevel = React.lazy(() => import('../features/system/BatteryLevel').then(m => ({ default: m.BatteryLevel })));
const Battleship = React.lazy(() => import('../features/games/Battleship').then(m => ({ default: m.Battleship })));
const BcryptTool = React.lazy(() => import('../features/cryptography/BcryptTool').then(m => ({ default: m.BcryptTool })));
const BeatSequencer = React.lazy(() => import('../features/music/BeatSequencer').then(m => ({ default: m.BeatSequencer })));
const BernoulliPrinciple = React.lazy(() => import('../features/science/physics/BernoulliPrinciple').then(m => ({ default: m.BernoulliPrinciple })));
const BiasVarianceTradeoff = React.lazy(() => import('../features/engine/machine-learning/BiasVarianceTradeoff').then(m => ({ default: m.BiasVarianceTradeoff })));
const BigOComparator = React.lazy(() => import('../features/algorithms/BigOComparator').then(m => ({ default: m.BigOComparator })));
const BinaryConverter = React.lazy(() => import('../features/converters/BinaryConverter').then(m => ({ default: m.BinaryConverter })));
const BiologyLabFolder = React.lazy(() => import('../features/science/BiologyLabFolder').then(m => ({ default: m.BiologyLabFolder })));
const BlackHoleGravityWell = React.lazy(() => import('../features/science/physics/BlackHoleGravityWell').then(m => ({ default: m.BlackHoleGravityWell })));
const Breakout = React.lazy(() => import('../features/games/Breakout').then(m => ({ default: m.Breakout })));
const Browser = React.lazy(() => import('../features/utilities/Browser').then(m => ({ default: m.Browser })));
const Buoyancy = React.lazy(() => import('../features/science/physics/Buoyancy').then(m => ({ default: m.Buoyancy })));
const CIATriadExplainer = React.lazy(() => import('../features/engine/cybersecurity/CIATriadExplainer').then(m => ({ default: m.CIATriadExplainer })));
const CLab = React.lazy(() => import('../features/engine/programming/CLab').then(m => ({ default: m.CLab })));
const CNNVisualizer = React.lazy(() => import('../features/visualizers/CNNVisualizer').then(m => ({ default: m.CNNVisualizer })));
const CPUSimulator = React.lazy(() => import('../features/algorithms/CPUSimulator').then(m => ({ default: m.CPUSimulator })));
const CSharpLab = React.lazy(() => import('../features/engine/programming/CSharpLab').then(m => ({ default: m.CSharpLab })));
const CTFChallenge = React.lazy(() => import('../features/engine/cybersecurity/CTFChallenge').then(m => ({ default: m.CTFChallenge })));
const CalculusVisualizer = React.lazy(() => import('../features/science/math/CalculusVisualizer').then(m => ({ default: m.CalculusVisualizer })));
const Calendar = React.lazy(() => import('../features/utilities/Calendar').then(m => ({ default: m.Calendar })));
const CellDivision = React.lazy(() => import('../features/science/biology/CellDivision').then(m => ({ default: m.CellDivision })));
const ChartBuilder = React.lazy(() => import('../features/converters/ChartBuilder').then(m => ({ default: m.ChartBuilder })));
const Checkers = React.lazy(() => import('../features/games/Checkers').then(m => ({ default: m.Checkers })));
const ChemistryCalculator = React.lazy(() => import('../features/science/chemistry/ChemistryCalculator').then(m => ({ default: m.ChemistryCalculator })));
const ChessGame = React.lazy(() => import('../features/chess/ChessGame').then(m => ({ default: m.ChessGame })));
const ChordProgressionHelper = React.lazy(() => import('../features/music/ChordProgressionHelper').then(m => ({ default: m.ChordProgressionHelper })));
const ClassicalCiphers = React.lazy(() => import('../features/cryptography/ClassicalCiphers').then(m => ({ default: m.ClassicalCiphers })));
const CodeEditor = React.lazy(() => import('../features/development/CodeEditor').then(m => ({ default: m.CodeEditor })));
const CollisionSimulator = React.lazy(() => import('../features/science/physics/CollisionSimulator').then(m => ({ default: m.CollisionSimulator })));
const ColorPaletteGenerator = React.lazy(() => import('../features/colors/ColorPaletteGenerator').then(m => ({ default: m.ColorPaletteGenerator })));
const ColorPaletteTool = React.lazy(() => import('../features/creative/ColorPaletteTool').then(m => ({ default: m.ColorPaletteTool })));
const ColorPicker = React.lazy(() => import('../features/colors/ColorPicker').then(m => ({ default: m.ColorPicker })));
const ColorsFolder = React.lazy(() => import('../features/colors/ColorsFolder').then(m => ({ default: m.ColorsFolder })));
const ComplexityAnalyzer = React.lazy(() => import('../features/algorithms/ComplexityAnalyzer').then(m => ({ default: m.ComplexityAnalyzer })));
const Connect4 = React.lazy(() => import('../features/games/Connect4').then(m => ({ default: m.Connect4 })));
const ContrastChecker = React.lazy(() => import('../features/colors/ContrastChecker').then(m => ({ default: m.ContrastChecker })));
const CppLab = React.lazy(() => import('../features/engine/programming/CppLab').then(m => ({ default: m.CppLab })));
const Cryptocurrency = React.lazy(() => import('../features/data/Cryptocurrency').then(m => ({ default: m.Cryptocurrency })));
const CurrencyConverter = React.lazy(() => import('../features/converters/CurrencyConverter').then(m => ({ default: m.CurrencyConverter })));
const DAWStudio = React.lazy(() => import('../features/music/DAWStudio').then(m => ({ default: m.DAWStudio })));
const DNAReplication = React.lazy(() => import('../features/science/biology/DNAReplication').then(m => ({ default: m.DNAReplication })));
const DPVisualizer = React.lazy(() => import('../features/algorithms/DPVisualizer').then(m => ({ default: m.DPVisualizer })));
const DVDScreensaver = React.lazy(() => import('../features/games/DVDScreensaver').then(m => ({ default: m.DVDScreensaver })));
const DashboardBuilder = React.lazy(() => import('../features/engine/data-visualizer/DashboardBuilder').then(m => ({ default: m.DashboardBuilder })));
const DataFormatter = React.lazy(() => import('../features/converters/DataFormatter').then(m => ({ default: m.DataFormatter })));
const DataVisualizer = React.lazy(() => import('../features/engine/data-visualizer/DataVisualizer').then(m => ({ default: m.DataVisualizer })));
const DatabaseApp = React.lazy(() => import('../features/database/DatabaseApp').then(m => ({ default: m.DatabaseApp })));
const DatasetAnalyzer = React.lazy(() => import('../features/engine/machine-learning/DatasetAnalyzer').then(m => ({ default: m.DatasetAnalyzer })));
const DeepLearningBuilder = React.lazy(() => import('../features/engine/machine-learning/DeepLearningBuilder').then(m => ({ default: m.DeepLearningBuilder })));
const DerivativeCalculator = React.lazy(() => import('../features/math/DerivativeCalculator').then(m => ({ default: m.DerivativeCalculator })));
const DiffractionGrating = React.lazy(() => import('../features/science/physics/DiffractionGrating').then(m => ({ default: m.DiffractionGrating })));
const DocumentConverter = React.lazy(() => import('../features/converters/DocumentConverter').then(m => ({ default: m.DocumentConverter })));
const DopplerEffect = React.lazy(() => import('../features/science/physics/DopplerEffect').then(m => ({ default: m.DopplerEffect })));
const EclipseSimulator = React.lazy(() => import('../features/science/earthspace/EclipseSimulator').then(m => ({ default: m.EclipseSimulator })));
const EffectsRack = React.lazy(() => import('../features/music/EffectsRack').then(m => ({ default: m.EffectsRack })));
const ElectricFieldVisualizer = React.lazy(() => import('../features/science/physics/ElectricFieldVisualizer').then(m => ({ default: m.ElectricFieldVisualizer })));
const ElectricalCircuit = React.lazy(() => import('../features/science/physics/ElectricalCircuit').then(m => ({ default: m.ElectricalCircuit })));
const Electrochemistry = React.lazy(() => import('../features/science/chemistry/Electrochemistry').then(m => ({ default: m.Electrochemistry })));
const ElectromagneticLab = React.lazy(() => import('../features/science/physics/ElectromagneticLab').then(m => ({ default: m.ElectromagneticLab })));
const EnergyConverter = React.lazy(() => import('../features/converters/EnergyConverter').then(m => ({ default: m.EnergyConverter })));
const EquationBalancer = React.lazy(() => import('../features/science/chemistry/EquationBalancer').then(m => ({ default: m.EquationBalancer })));
const F1App = React.lazy(() => import('../features/media/F1App').then(m => ({ default: m.F1App })));
const FeatureImportanceVisualizer = React.lazy(() => import('../features/engine/machine-learning/FeatureImportanceVisualizer').then(m => ({ default: m.FeatureImportanceVisualizer })));
const FileManager = React.lazy(() => import('../features/system/FileManager').then(m => ({ default: m.FileManager })));
const FirewallRuleBuilder = React.lazy(() => import('../features/engine/cybersecurity/FirewallRuleBuilder').then(m => ({ default: m.FirewallRuleBuilder })));
const FlameTest = React.lazy(() => import('../features/science/chemistry/FlameTest').then(m => ({ default: m.FlameTest })));
const FlappyBird = React.lazy(() => import('../features/games/FlappyBird').then(m => ({ default: m.FlappyBird })));
const FlashcardGame = React.lazy(() => import('../features/office/FlashcardGame').then(m => ({ default: m.FlashcardGame })));
const FlightTracker = React.lazy(() => import('../features/data/FlightTracker').then(m => ({ default: m.FlightTracker })));
const FolderContent = React.lazy(() => import('../features/system/FolderContent').then(m => ({ default: m.FolderContent })));
const FormBuilder = React.lazy(() => import('../features/office/FormBuilder').then(m => ({ default: m.FormBuilder })));
const FourierTransform = React.lazy(() => import('../features/science/math/FourierTransform').then(m => ({ default: m.FourierTransform })));
const FractalGenerator = React.lazy(() => import('../features/science/math/FractalGenerator').then(m => ({ default: m.FractalGenerator })));
const FunctionGrapher3D = React.lazy(() => import('../features/science/math/FunctionGrapher3D').then(m => ({ default: m.FunctionGrapher3D })));
const Game2048 = React.lazy(() => import('../features/games/Game2048').then(m => ({ default: m.Game2048 })));
const GasLawsSimulator = React.lazy(() => import('../features/science/chemistry/GasLawsSimulator').then(m => ({ default: m.GasLawsSimulator })));
const GeometryCalculator = React.lazy(() => import('../features/math/GeometryCalculator').then(m => ({ default: m.GeometryCalculator })));
const GitVisualizer = React.lazy(() => import('../features/development/GitVisualizer').then(m => ({ default: m.GitVisualizer })));
const GoLab = React.lazy(() => import('../features/engine/programming/GoLab').then(m => ({ default: m.GoLab })));
const GradientDescentSimulator = React.lazy(() => import('../features/engine/machine-learning/GradientDescentSimulator').then(m => ({ default: m.GradientDescentSimulator })));
const GradientGenerator = React.lazy(() => import('../features/colors/GradientGenerator').then(m => ({ default: m.GradientGenerator })));
const GraphAlgorithms = React.lazy(() => import('../features/algorithms/GraphAlgorithms').then(m => ({ default: m.GraphAlgorithms })));
const GraphPlotter = React.lazy(() => import('../features/math/GraphPlotter').then(m => ({ default: m.GraphPlotter })));
const GraphTheory = React.lazy(() => import('../features/science/math/GraphTheory').then(m => ({ default: m.GraphTheory })));
const HMACGenerator = React.lazy(() => import('../features/cryptography/HMACGenerator').then(m => ({ default: m.HMACGenerator })));
const HashingTool = React.lazy(() => import('../features/cryptography/HashingTool').then(m => ({ default: m.HashingTool })));
const HashingVisualizer = React.lazy(() => import('../features/algorithms/HashingVisualizer').then(m => ({ default: m.HashingVisualizer })));
const HeartCirculation = React.lazy(() => import('../features/science/biology/HeartCirculation').then(m => ({ default: m.HeartCirculation })));
const HexCodeParser = React.lazy(() => import('../features/colors/HexCodeParser').then(m => ({ default: m.HexCodeParser })));
const HtmlCssLab = React.lazy(() => import('../features/engine/programming/HtmlCssLab').then(m => ({ default: m.HtmlCssLab })));
const HydraulicSystem = React.lazy(() => import('../features/science/physics/HydraulicSystem').then(m => ({ default: m.HydraulicSystem })));
const HyperparameterTuning = React.lazy(() => import('../features/engine/machine-learning/HyperparameterTuning').then(m => ({ default: m.HyperparameterTuning })));
const IPv4Converter = React.lazy(() => import('../features/networking/IPv4Converter').then(m => ({ default: m.IPv4Converter })));
const IPv4RangeExpander = React.lazy(() => import('../features/networking/IPv4RangeExpander').then(m => ({ default: m.IPv4RangeExpander })));
const IPv6ULAGenerator = React.lazy(() => import('../features/networking/IPv6ULAGenerator').then(m => ({ default: m.IPv6ULAGenerator })));
const ImageConverter = React.lazy(() => import('../features/converters/ImageConverter').then(m => ({ default: m.ImageConverter })));
const ImageEditor = React.lazy(() => import('../features/editing').then(m => ({ default: m.ImageEditor })));
const IntegralCalculator = React.lazy(() => import('../features/math/IntegralCalculator').then(m => ({ default: m.IntegralCalculator })));
const InvoiceGenerator = React.lazy(() => import('../features/office/InvoiceGenerator').then(m => ({ default: m.InvoiceGenerator })));
const JWTDecoder = React.lazy(() => import('../features/cryptography/JWTDecoder').then(m => ({ default: m.JWTDecoder })));
const JavaLab = React.lazy(() => import('../features/engine/programming/JavaLab').then(m => ({ default: m.JavaLab })));
const JavaScriptLab = React.lazy(() => import('../features/engine/programming/JavaScriptLab').then(m => ({ default: m.JavaScriptLab })));
const KanbanBoard = React.lazy(() => import('../features/office/KanbanBoard').then(m => ({ default: m.KanbanBoard })));
const LCCircuit = React.lazy(() => import('../features/science/physics/LCCircuit').then(m => ({ default: m.LCCircuit })));
const LengthConverter = React.lazy(() => import('../features/converters/LengthConverter').then(m => ({ default: m.LengthConverter })));
const LinearAlgebra = React.lazy(() => import('../features/science/math/LinearAlgebra').then(m => ({ default: m.LinearAlgebra })));
const LinearSystemSolver = React.lazy(() => import('../features/math/LinearSystemSolver').then(m => ({ default: m.LinearSystemSolver })));
const LogicGates = React.lazy(() => import('../features/algorithms/LogicGates').then(m => ({ default: m.LogicGates })));
const LoremIpsumGenerator = React.lazy(() => import('../features/converters/LoremIpsumGenerator').then(m => ({ default: m.LoremIpsumGenerator })));
const MACAddressTool = React.lazy(() => import('../features/networking/MACAddressTool').then(m => ({ default: m.MACAddressTool })));
const MagneticFieldVisualizer = React.lazy(() => import('../features/science/physics/MagneticFieldVisualizer').then(m => ({ default: m.MagneticFieldVisualizer })));
const MarkdownEditor = React.lazy(() => import('../features/converters/MarkdownEditor').then(m => ({ default: m.MarkdownEditor })));
const MathFolder = React.lazy(() => import('../features/math/MathFolder').then(m => ({ default: m.MathFolder })));
const MathVisualizerFolder = React.lazy(() => import('../features/science/MathVisualizerFolder').then(m => ({ default: m.MathVisualizerFolder })));
const MatrixCalculator = React.lazy(() => import('../features/math/MatrixCalculator').then(m => ({ default: m.MatrixCalculator })));
const Maze3D = React.lazy(() => import('../features/games/Maze3D').then(m => ({ default: m.Maze3D })));
const MemoryAllocator = React.lazy(() => import('../features/algorithms/MemoryAllocator').then(m => ({ default: m.MemoryAllocator })));
const MemoryMatch = React.lazy(() => import('../features/games/MemoryMatch').then(m => ({ default: m.MemoryMatch })));
const MemoryStackHeap = React.lazy(() => import('../features/algorithms/MemoryStackHeap').then(m => ({ default: m.MemoryStackHeap })));
const MindMapCreator = React.lazy(() => import('../features/creative/engine/MindMapCreator').then(m => ({ default: m.MindMapCreator })));
const Minecraft = React.lazy(() => import('../features/games/Minecraft').then(m => ({ default: m.Minecraft })));
const Minesweeper = React.lazy(() => import('../features/games/Minesweeper').then(m => ({ default: m.Minesweeper })));
const MockBlogPage = React.lazy(() => import('../features/colors/visualizer/MockBlogPage').then(m => ({ default: m.MockBlogPage })));
const MockDashboard = React.lazy(() => import('../features/colors/visualizer/MockDashboard').then(m => ({ default: m.MockDashboard })));
const MockLandingPage = React.lazy(() => import('../features/colors/visualizer/MockLandingPage').then(m => ({ default: m.MockLandingPage })));
const MockSocialMediaPage = React.lazy(() => import('../features/colors/visualizer/MockSocialMediaPage').then(m => ({ default: m.MockSocialMediaPage })));
const ModelComparison = React.lazy(() => import('../features/engine/machine-learning/ModelComparison').then(m => ({ default: m.ModelComparison })));
const ModelMetrics = React.lazy(() => import('../features/engine/machine-learning/ModelMetrics').then(m => ({ default: m.ModelMetrics })));
const ModelWizard = React.lazy(() => import('../features/engine/machine-learning/ModelWizard').then(m => ({ default: m.ModelWizard })));
const MolecularViewer = React.lazy(() => import('../features/science/chemistry/MolecularViewer').then(m => ({ default: m.MolecularViewer })));
const MoonPhases = React.lazy(() => import('../features/science/earthspace/MoonPhases').then(m => ({ default: m.MoonPhases })));
const MusicTheoryHelper = React.lazy(() => import('../features/music/MusicTheoryHelper').then(m => ({ default: m.MusicTheoryHelper })));
const NASAApp = React.lazy(() => import('../features/data/NASAApp').then(m => ({ default: m.NASAApp })));
const NeuronSignal = React.lazy(() => import('../features/science/biology/NeuronSignal').then(m => ({ default: m.NeuronSignal })));
const NoCodeBuilder = React.lazy(() => import('../features/creative/NoCodeBuilder').then(m => ({ default: m.NoCodeBuilder })));
const NodeJsLab = React.lazy(() => import('../features/engine/programming/NodeJsLab').then(m => ({ default: m.NodeJsLab })));
const Notepad = React.lazy(() => import('../features/office/Notepad').then(m => ({ default: m.Notepad })));
const NuclearDecay = React.lazy(() => import('../features/science/chemistry/NuclearDecay').then(m => ({ default: m.NuclearDecay })));
const NumberTheory = React.lazy(() => import('../features/math/NumberTheory').then(m => ({ default: m.NumberTheory })));
const OWASPTop10 = React.lazy(() => import('../features/engine/cybersecurity/OWASPTop10').then(m => ({ default: m.OWASPTop10 })));
const OpticsSimulator = React.lazy(() => import('../features/science/physics/OpticsSimulator').then(m => ({ default: m.OpticsSimulator })));
const OrganicChemistry = React.lazy(() => import('../features/science/chemistry/OrganicChemistry').then(m => ({ default: m.OrganicChemistry })));
const PHScale = React.lazy(() => import('../features/science/chemistry/PHScale').then(m => ({ default: m.PHScale })));
const PIDController = React.lazy(() => import('../features/algorithms/PIDController').then(m => ({ default: m.PIDController })));
const PacMan = React.lazy(() => import('../features/games/PacMan').then(m => ({ default: m.PacMan })));
const PacketSnifferVisualizer = React.lazy(() => import('../features/engine/cybersecurity/PacketSnifferVisualizer').then(m => ({ default: m.PacketSnifferVisualizer })));
const Paint = React.lazy(() => import('../features/creative/Paint').then(m => ({ default: m.Paint })));
const PaletteVisualizer = React.lazy(() => import('../features/colors/PaletteVisualizer').then(m => ({ default: m.PaletteVisualizer })));
const ParameterTuner = React.lazy(() => import('../features/engine/machine-learning/ParameterTuner').then(m => ({ default: m.ParameterTuner })));
const PasswordCrackingDemo = React.lazy(() => import('../features/engine/cybersecurity/PasswordCrackingDemo').then(m => ({ default: m.PasswordCrackingDemo })));
const PasswordGenerator = React.lazy(() => import('../features/converters/PasswordGenerator').then(m => ({ default: m.PasswordGenerator })));
const PathfindingVisualizer = React.lazy(() => import('../features/visualizers/PathfindingVisualizer').then(m => ({ default: m.PathfindingVisualizer })));
const PendulumSimulator = React.lazy(() => import('../features/science/physics/PendulumSimulator').then(m => ({ default: m.PendulumSimulator })));
const PercentageCalculator = React.lazy(() => import('../features/math/PercentageCalculator').then(m => ({ default: m.PercentageCalculator })));
const PeriodicTable = React.lazy(() => import('../features/science/chemistry/PeriodicTable').then(m => ({ default: m.PeriodicTable })));
const PhishingAnalyzer = React.lazy(() => import('../features/engine/cybersecurity/PhishingAnalyzer').then(m => ({ default: m.PhishingAnalyzer })));
const PianoRoll = React.lazy(() => import('../features/music/PianoRoll').then(m => ({ default: m.PianoRoll })));
const PingPong = React.lazy(() => import('../features/games/PingPong').then(m => ({ default: m.PingPong })));
const PixelArtEditor = React.lazy(() => import('../features/office/PixelArtEditor').then(m => ({ default: m.PixelArtEditor })));
const PixelArtEditorColors = React.lazy(() => import('../features/colors/PixelArtEditor').then(m => ({ default: m.PixelArtEditor })));
const PlateTectonics = React.lazy(() => import('../features/science/earthspace/PlateTectonics').then(m => ({ default: m.PlateTectonics })));
const PolymerBuilder = React.lazy(() => import('../features/science/chemistry/PolymerBuilder').then(m => ({ default: m.PolymerBuilder })));
const PortScannerVisualizer = React.lazy(() => import('../features/engine/cybersecurity/PortScannerVisualizer').then(m => ({ default: m.PortScannerVisualizer })));
const PowerConverter = React.lazy(() => import('../features/converters/PowerConverter').then(m => ({ default: m.PowerConverter })));
const PresentationApp = React.lazy(() => import('../features/office/Presentation').then(m => ({ default: m.Presentation })));
const PressureConverter = React.lazy(() => import('../features/converters/PressureConverter').then(m => ({ default: m.PressureConverter })));
const PrimeSieve = React.lazy(() => import('../features/science/math/PrimeSieve').then(m => ({ default: m.PrimeSieve })));
const ProbabilityDistributions = React.lazy(() => import('../features/science/math/ProbabilityDistributions').then(m => ({ default: m.ProbabilityDistributions })));
const ProjectileMotion = React.lazy(() => import('../features/science/physics/ProjectileMotion').then(m => ({ default: m.ProjectileMotion })));
const Puzzle15 = React.lazy(() => import('../features/games/Puzzle15').then(m => ({ default: m.Puzzle15 })));
const PythonLab = React.lazy(() => import('../features/engine/programming/PythonLab').then(m => ({ default: m.PythonLab })));
const QRCodeVisualizer = React.lazy(() => import('../features/visualizers/QRCodeVisualizer').then(m => ({ default: m.QRCodeVisualizer })));
const QuadraticSolver = React.lazy(() => import('../features/math/QuadraticSolver').then(m => ({ default: m.QuadraticSolver })));
const QuantumTunneling = React.lazy(() => import('../features/science/physics/QuantumTunneling').then(m => ({ default: m.QuantumTunneling })));
const RSASandbox = React.lazy(() => import('../features/cryptography/RSASandbox').then(m => ({ default: m.RSASandbox })));
const ReactionSimulator = React.lazy(() => import('../features/science/chemistry/ReactionSimulator').then(m => ({ default: m.ReactionSimulator })));
const RegexTester = React.lazy(() => import('../features/converters/RegexTester').then(m => ({ default: m.RegexTester })));
const RocketPropulsion = React.lazy(() => import('../features/science/physics/RocketPropulsion').then(m => ({ default: m.RocketPropulsion })));
const RustLab = React.lazy(() => import('../features/engine/programming/RustLab').then(m => ({ default: m.RustLab })));
const SQLInjectionDemo = React.lazy(() => import('../features/engine/cybersecurity/SQLInjectionDemo').then(m => ({ default: m.SQLInjectionDemo })));
const SQLLab = React.lazy(() => import('../features/engine/programming/SQLLab').then(m => ({ default: m.SQLLab })));
const SamplePad = React.lazy(() => import('../features/music/SamplePad').then(m => ({ default: m.SamplePad })));
const SandFalling = React.lazy(() => import('../features/games/SandFalling').then(m => ({ default: m.SandFalling })));
const ScienceLabsFolder = React.lazy(() => import('../features/science/ScienceLabsFolder').then(m => ({ default: m.ScienceLabsFolder })));
const SeasonsEarthTilt = React.lazy(() => import('../features/science/earthspace/SeasonsEarthTilt').then(m => ({ default: m.SeasonsEarthTilt })));
const SettingsApp = React.lazy(() => import('../Settings').then(m => ({ default: m.SettingsApp })));
const ShipTracker = React.lazy(() => import('../features/data/ShipTracker').then(m => ({ default: m.ShipTracker })));
const SimpleMachines = React.lazy(() => import('../features/science/physics/SimpleMachines').then(m => ({ default: m.SimpleMachines })));
const SnakeGame = React.lazy(() => import('../features/games/SnakeGame').then(m => ({ default: m.SnakeGame })));
const SnellsLaw = React.lazy(() => import('../features/science/physics/SnellsLaw').then(m => ({ default: m.SnellsLaw })));
const SocialEngineeringWalkthroughs = React.lazy(() => import('../features/engine/cybersecurity/SocialEngineeringWalkthroughs').then(m => ({ default: m.SocialEngineeringWalkthroughs })));
const SolarSystem = React.lazy(() => import('../features/science/earthspace/SolarSystem').then(m => ({ default: m.SolarSystem })));
const SortingVisualizer = React.lazy(() => import('../features/visualizers/SortingVisualizer').then(m => ({ default: m.SortingVisualizer })));
const SpaceInvaders = React.lazy(() => import('../features/games/SpaceInvaders').then(m => ({ default: m.SpaceInvaders })));
const SpecialRelativity = React.lazy(() => import('../features/science/physics/SpecialRelativity').then(m => ({ default: m.SpecialRelativity })));
const SpectroscopySimulator = React.lazy(() => import('../features/science/chemistry/SpectroscopySimulator').then(m => ({ default: m.SpectroscopySimulator })));
const SpeedConverter = React.lazy(() => import('../features/converters/SpeedConverter').then(m => ({ default: m.SpeedConverter })));
const SportsApp = React.lazy(() => import('../features/data/SportsApp').then(m => ({ default: m.SportsApp })));
const Spreadsheet = React.lazy(() => import('../features/office/Spreadsheet').then(m => ({ default: m.Spreadsheet })));
const SpringSimulator = React.lazy(() => import('../features/science/physics/SpringSimulator').then(m => ({ default: m.SpringSimulator })));
const StarLifeCycle = React.lazy(() => import('../features/science/earthspace/StarLifeCycle').then(m => ({ default: m.StarLifeCycle })));
const StatisticsCalculator = React.lazy(() => import('../features/math/StatisticsCalculator').then(m => ({ default: m.StatisticsCalculator })));
const StickyNotes = React.lazy(() => import('../features/productivity/StickyNotes').then(m => ({ default: m.StickyNotes })));
const StockMarket = React.lazy(() => import('../features/data/StockMarket').then(m => ({ default: m.StockMarket })));
const StringObfuscation = React.lazy(() => import('../features/cryptography/StringObfuscation').then(m => ({ default: m.StringObfuscation })));
const SubnetCalculator = React.lazy(() => import('../features/networking/SubnetCalculator').then(m => ({ default: m.SubnetCalculator })));
const Sudoku = React.lazy(() => import('../features/games/Sudoku').then(m => ({ default: m.Sudoku })));
const SuperCalculator = React.lazy(() => import('../features/math/SuperCalculator').then(m => ({ default: m.SuperCalculator })));
const TaskManager = React.lazy(() => import('../features/system/TaskManager').then(m => ({ default: m.TaskManager })));
const TemperatureConverter = React.lazy(() => import('../features/converters/TemperatureConverter').then(m => ({ default: m.TemperatureConverter })));
const Terminal = React.lazy(() => import('../features/development/Terminal').then(m => ({ default: m.Terminal })));
const Tetris = React.lazy(() => import('../features/games/Tetris').then(m => ({ default: m.Tetris })));
const TextEditor = React.lazy(() => import('../features/office/TextEditor').then(m => ({ default: m.TextEditor })));
const TextToHTML = React.lazy(() => import('../features/converters/TextToHTML').then(m => ({ default: m.TextToHTML })));
const Thermodynamics = React.lazy(() => import('../features/science/physics/Thermodynamics').then(m => ({ default: m.Thermodynamics })));
const TicTacToe = React.lazy(() => import('../features/games/TicTacToe').then(m => ({ default: m.TicTacToe })));
const TimeConverter = React.lazy(() => import('../features/converters/TimeConverter').then(m => ({ default: m.TimeConverter })));
const TitrationSimulator = React.lazy(() => import('../features/science/chemistry/TitrationSimulator').then(m => ({ default: m.TitrationSimulator })));
const TokenGenerator = React.lazy(() => import('../features/cryptography/TokenGenerator').then(m => ({ default: m.TokenGenerator })));
const TrainTestSplitVisualizer = React.lazy(() => import('../features/engine/machine-learning/TrainTestSplitVisualizer').then(m => ({ default: m.TrainTestSplitVisualizer })));
const TreeTraversals = React.lazy(() => import('../features/algorithms/TreeTraversals').then(m => ({ default: m.TreeTraversals })));
const TrendingPalettes = React.lazy(() => import('../features/colors/TrendingPalettes').then(m => ({ default: m.TrendingPalettes })));
const TrieSegmentTree = React.lazy(() => import('../features/algorithms/TrieSegmentTree').then(m => ({ default: m.TrieSegmentTree })));
const TrigCalculator = React.lazy(() => import('../features/math/TrigCalculator').then(m => ({ default: m.TrigCalculator })));
const TuringMachine = React.lazy(() => import('../features/algorithms/TuringMachine').then(m => ({ default: m.TuringMachine })));
const TypeScriptLab = React.lazy(() => import('../features/engine/programming/TypeScriptLab').then(m => ({ default: m.TypeScriptLab })));
const UUIDGenerator = React.lazy(() => import('../features/cryptography/UUIDGenerator').then(m => ({ default: m.UUIDGenerator })));
const UnifiedClock = React.lazy(() => import('../features/productivity/UnifiedClock').then(m => ({ default: m.UnifiedClock })));
const UniverseSimulator = React.lazy(() => import('../features/science/UniverseSimulator').then(m => ({ default: m.UniverseSimulator })));
const UtilitiesFolder = React.lazy(() => import('../features/utilities/UtilitiesFolder').then(m => ({ default: m.UtilitiesFolder })));
const VideoEditor = React.lazy(() => import('../features/editing').then(m => ({ default: m.VideoEditor })));
const VirtualEngineFolder = React.lazy(() => import('../features/folders/VirtualEngineFolder').then(m => ({ default: m.VirtualEngineFolder })));
const VirtualInstruments = React.lazy(() => import('../features/music/VirtualInstruments').then(m => ({ default: m.VirtualInstruments })));
const VolumeConverter = React.lazy(() => import('../features/converters/VolumeConverter').then(m => ({ default: m.VolumeConverter })));
const VulnerabilityScanningDemo = React.lazy(() => import('../features/engine/cybersecurity/VulnerabilityScanningDemo').then(m => ({ default: m.VulnerabilityScanningDemo })));
const WaveSimulator = React.lazy(() => import('../features/science/physics/WaveSimulator').then(m => ({ default: m.WaveSimulator })));
const WaveformVisualizer = React.lazy(() => import('../features/music/WaveformVisualizer').then(m => ({ default: m.WaveformVisualizer })));
const WeatherApp = React.lazy(() => import('../features/internet/WeatherApp').then(m => ({ default: m.WeatherApp })));
const WeightConverter = React.lazy(() => import('../features/converters/WeightConverter').then(m => ({ default: m.WeightConverter })));
const Wikipedia = React.lazy(() => import('../features/internet/Wikipedia').then(m => ({ default: m.Wikipedia })));
const XSSSimulator = React.lazy(() => import('../features/engine/cybersecurity/XSSSimulator').then(m => ({ default: m.XSSSimulator })));

// Cybersecurity Tools
// Machine Learning
// Data Visualizer
// Programming

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
  isDarkMode: boolean;
  windowThemeOverrides: Record<string, string>;
  setWindowTheme: (windowId: string, themeName: string) => void;
  globalWindowTheme: WindowThemeName;
  setGlobalWindowTheme: (themeName: WindowThemeName) => void;
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
  isDarkMode: false,
  windowThemeOverrides: {},
  setWindowTheme: () => { },
  globalWindowTheme: 'default',
  setGlobalWindowTheme: () => { },
});

export const useWindows = () => useContext(WindowsContext);

export const WindowsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [windows, setWindows] = useState<WindowType[]>([]);
  const [highestZIndex, setHighestZIndex] = useState(100);
  const [minimizedWindows, setMinimizedWindows] = useState<string[]>([]);

  // Read persisted state synchronously in the initializers. Loading it in an
  // effect raced with the effects that SAVE settings/wallpaper: on mount the
  // save effect wrote the defaults over localStorage before the loaded state
  // landed (guaranteed under StrictMode's double-mount), which is why the
  // chosen theme and wallpaper reset on every refresh.
  const [wallpaper, setWallpaper] = useState<string>(() => {
    try {
      return localStorage.getItem('win11-wallpaper') || DARK_VEIL;
    } catch { return DARK_VEIL; }
  });

  const [settings, setSettings] = useState<SettingsType>(() => {
    const defaults: SettingsType = {
      theme: 'light',
      showClock: true,
      showNotepad: true,
      showBattery: true,
    };
    try {
      const saved = localStorage.getItem('win11-settings');
      if (saved) return { ...defaults, ...JSON.parse(saved) };
      // Legacy fallback from before settings were stored as one object
      const savedTheme = localStorage.getItem('win11-theme');
      if (savedTheme) return { ...defaults, theme: savedTheme === 'dark' ? 'dark' : 'light' };
    } catch (error) {
      console.error('Error parsing saved settings:', error);
    }
    return defaults;
  });

  const isDarkMode = settings.theme === 'dark';

  const [windowThemeOverrides, setWindowThemeOverridesState] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('win11-window-themes');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const setWindowTheme = useCallback((windowId: string, themeName: string) => {
    setWindowThemeOverridesState(prev => {
      const next = { ...prev, [windowId]: themeName };
      localStorage.setItem('win11-window-themes', JSON.stringify(next));
      return next;
    });
  }, []);

  // Global window theme derived from wallpaper
  const [globalWindowTheme, setGlobalWindowThemeState] = useState<WindowThemeName>(() => {
    try {
      const saved = localStorage.getItem('win11-global-window-theme');
      return (saved as WindowThemeName) || 'default';
    } catch { return 'default'; }
  });

  const setGlobalWindowTheme = useCallback((themeName: WindowThemeName) => {
    setGlobalWindowThemeState(themeName);
    localStorage.setItem('win11-global-window-theme', themeName);
  }, []);

  // Auto-derive global window theme when wallpaper changes
  useEffect(() => {
    const wp = wallpaper || DARK_VEIL;
    const matched = WALLPAPER_TO_THEME[wp];
    if (matched) {
      setGlobalWindowTheme(matched);
    }
  }, [wallpaper, setGlobalWindowTheme]);

  // Store window content to prevent remounting on state changes
  const windowContentRef = useRef<Map<string, React.ReactNode>>(new Map());

  // Debug: Log when windows array changes
  useEffect(() => {
    console.log('🔄 Windows state changed, count:', windows.length);
  }, [windows]);

  useEffect(() => {
    // Power lifecycle is handled by SystemContext now; clear the legacy flag
    // that used to trap the app in a black "click to power on" loop.
    localStorage.removeItem('win11-is-shutdown');

    // Settings and wallpaper are loaded synchronously in their initializers.
    // Windows always start fresh - no window persistence across refreshes.
    initializeWindows([], []);
  }, []);

  // Helper to get or create window content (prevents remounting)
  const getOrCreateContent = (id: string, createFn: () => React.ReactNode) => {
    if (!windowContentRef.current.has(id)) {
      windowContentRef.current.set(id, createFn());
    }
    return windowContentRef.current.get(id)!;
  };

  // Track if windows have been initialized
  const windowsInitialized = useRef(false);

  const initializeWindows = (openWindowIds: string[], minimizedWindowIds: string[]) => {
    // Only initialize once!
    if (windowsInitialized.current) {
      console.log('Windows already initialized, skipping...');
      return;
    }
    windowsInitialized.current = true;
    console.log('Initializing windows for the first and only time');
    const portfolioWindows: WindowType[] = [];

    const utilityWindows: WindowType[] = [
      {
        id: 'settings',
        title: 'Settings',
        content: getOrCreateContent('settings', () => <SettingsApp initialSettings={settings} onApply={setSettings} />),
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
        defaultSize: { width: 620, height: 550 },
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
      // Cryptography Tools
      {
        id: 'token-generator',
        title: 'Token Generator',
        content: <TokenGenerator />,
        isOpen: openWindowIds.includes('token-generator'),
        isMinimized: minimizedWindowIds.includes('token-generator'),
        icon: <Key className="h-5 w-5 text-green-600" />,
        zIndex: 100,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 800, height: 600 },
      },
      {
        id: 'string-obfuscation',
        title: 'String Obfuscation',
        content: <StringObfuscation />,
        isOpen: openWindowIds.includes('string-obfuscation'),
        isMinimized: minimizedWindowIds.includes('string-obfuscation'),
        icon: <Code className="h-5 w-5 text-violet-600" />,
        zIndex: 100,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 900, height: 600 },
      },
      {
        id: 'bcrypt-tool',
        title: 'Password Hashing (PBKDF2)',
        content: <BcryptTool />,
        isOpen: openWindowIds.includes('bcrypt-tool'),
        isMinimized: minimizedWindowIds.includes('bcrypt-tool'),
        icon: <Lock className="h-5 w-5 text-amber-600" />,
        zIndex: 100,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 700, height: 650 },
      },
      {
        id: 'uuid-generator',
        title: 'UUID Generator',
        content: <UUIDGenerator />,
        isOpen: openWindowIds.includes('uuid-generator'),
        isMinimized: minimizedWindowIds.includes('uuid-generator'),
        icon: <Fingerprint className="h-5 w-5 text-indigo-600" />,
        zIndex: 100,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 800, height: 600 },
      },
      {
        id: 'hashing-tool',
        title: 'Hashing Tool',
        content: <HashingTool />,
        isOpen: openWindowIds.includes('hashing-tool'),
        isMinimized: minimizedWindowIds.includes('hashing-tool'),
        icon: <Hash className="h-5 w-5 text-cyan-600" />,
        zIndex: 100,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 900, height: 650 },
      },
      {
        id: 'classical-ciphers',
        title: 'Classical Ciphers',
        content: <ClassicalCiphers />,
        isOpen: openWindowIds.includes('classical-ciphers'),
        isMinimized: minimizedWindowIds.includes('classical-ciphers'),
        icon: <Shield className="h-5 w-5 text-orange-600" />,
        zIndex: 100,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 950, height: 700 },
      },
      {
        id: 'aes-encryption',
        title: 'AES Encryption',
        content: <AESEncryption />,
        isOpen: openWindowIds.includes('aes-encryption'),
        isMinimized: minimizedWindowIds.includes('aes-encryption'),
        icon: <Lock className="h-5 w-5 text-blue-600" />,
        zIndex: 100,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 800, height: 650 },
      },
      {
        id: 'hmac-generator',
        title: 'HMAC Generator',
        content: <HMACGenerator />,
        isOpen: openWindowIds.includes('hmac-generator'),
        isMinimized: minimizedWindowIds.includes('hmac-generator'),
        icon: <KeyRound className="h-5 w-5 text-teal-600" />,
        zIndex: 100,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 750, height: 650 },
      },
      {
        id: 'rsa-sandbox',
        title: 'RSA Sandbox',
        content: <RSASandbox />,
        isOpen: openWindowIds.includes('rsa-sandbox'),
        isMinimized: minimizedWindowIds.includes('rsa-sandbox'),
        icon: <FileKey className="h-5 w-5 text-purple-600" />,
        zIndex: 100,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'jwt-decoder',
        title: 'JWT Decoder',
        content: <JWTDecoder />,
        isOpen: openWindowIds.includes('jwt-decoder'),
        isMinimized: minimizedWindowIds.includes('jwt-decoder'),
        icon: <FileText className="h-5 w-5 text-rose-600" />,
        zIndex: 100,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 900, height: 650 },
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
        id: 'science-labs-folder',
        title: 'Science Labs',
        content: <ScienceLabsFolder />,
        isOpen: openWindowIds.includes('science-labs-folder'),
        isMinimized: minimizedWindowIds.includes('science-labs-folder'),
        icon: <FlaskConical className="h-5 w-5 text-blue-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 800 },
      },
      {
        id: 'biology-lab-folder',
        title: 'Biology Lab',
        content: <BiologyLabFolder />,
        isOpen: openWindowIds.includes('biology-lab-folder'),
        isMinimized: minimizedWindowIds.includes('biology-lab-folder'),
        icon: <Beaker className="h-5 w-5 text-green-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 800 },
      },
      {
        id: 'math-visualizer-folder',
        title: 'Math Visualizer',
        content: <MathVisualizerFolder />,
        isOpen: openWindowIds.includes('math-visualizer-folder'),
        isMinimized: minimizedWindowIds.includes('math-visualizer-folder'),
        icon: <Calculator className="h-5 w-5 text-purple-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 800 },
      },
      {
        id: 'titration-simulator',
        title: 'Titration Simulator',
        content: <TitrationSimulator />,
        isOpen: openWindowIds.includes('titration-simulator'),
        isMinimized: minimizedWindowIds.includes('titration-simulator'),
        icon: <Beaker className="h-5 w-5 text-blue-500" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 800 },
      },
      {
        id: 'gas-laws',
        title: 'Gas Laws Simulator',
        content: <GasLawsSimulator />,
        isOpen: openWindowIds.includes('gas-laws'),
        isMinimized: minimizedWindowIds.includes('gas-laws'),
        icon: <Wind className="h-5 w-5 text-cyan-500" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 800 },
      },
      {
        id: 'electrochemistry',
        title: 'Electrochemistry',
        content: <Electrochemistry />,
        isOpen: openWindowIds.includes('electrochemistry'),
        isMinimized: minimizedWindowIds.includes('electrochemistry'),
        icon: <Zap className="h-5 w-5 text-yellow-500" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 800 },
      },
      {
        id: 'spectroscopy',
        title: 'Spectroscopy Simulator',
        content: <SpectroscopySimulator />,
        isOpen: openWindowIds.includes('spectroscopy'),
        isMinimized: minimizedWindowIds.includes('spectroscopy'),
        icon: <Eye className="h-5 w-5 text-purple-500" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 800 },
      },
      {
        id: 'nuclear-decay',
        title: 'Nuclear Decay',
        content: <NuclearDecay />,
        isOpen: openWindowIds.includes('nuclear-decay'),
        isMinimized: minimizedWindowIds.includes('nuclear-decay'),
        icon: <Atom className="h-5 w-5 text-red-500" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 800 },
      },
      {
        id: 'ph-scale',
        title: 'pH Scale & Buffers',
        content: <PHScale />,
        isOpen: openWindowIds.includes('ph-scale'),
        isMinimized: minimizedWindowIds.includes('ph-scale'),
        icon: <Droplet className="h-5 w-5 text-blue-400" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 800 },
      },
      {
        id: 'organic-chemistry',
        title: 'Organic Chemistry',
        content: <OrganicChemistry />,
        isOpen: openWindowIds.includes('organic-chemistry'),
        isMinimized: minimizedWindowIds.includes('organic-chemistry'),
        icon: <Atom className="h-5 w-5 text-green-500" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 800 },
      },
      {
        id: 'polymer-builder',
        title: 'Polymer Builder',
        content: <PolymerBuilder />,
        isOpen: openWindowIds.includes('polymer-builder'),
        isMinimized: minimizedWindowIds.includes('polymer-builder'),
        icon: <Beaker className="h-5 w-5 text-pink-500" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 800 },
      },
      {
        id: 'chemistry-calculator',
        title: 'Chemistry Calculator',
        content: <ChemistryCalculator />,
        isOpen: openWindowIds.includes('chemistry-calculator'),
        isMinimized: minimizedWindowIds.includes('chemistry-calculator'),
        icon: <Beaker className="h-5 w-5 text-teal-500" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 900, height: 700 },
      },
      {
        id: 'flame-test',
        title: 'Flame Test',
        content: <FlameTest />,
        isOpen: openWindowIds.includes('flame-test'),
        isMinimized: minimizedWindowIds.includes('flame-test'),
        icon: <FlaskConical className="h-5 w-5 text-orange-500" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1100, height: 750 },
      },
      {
        id: 'cell-division',
        title: 'Cell Division',
        content: <CellDivision />,
        isOpen: openWindowIds.includes('cell-division'),
        isMinimized: minimizedWindowIds.includes('cell-division'),
        icon: <Microscope className="h-5 w-5 text-green-500" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 800 },
      },
      {
        id: 'dna-replication',
        title: 'DNA Replication',
        content: <DNAReplication />,
        isOpen: openWindowIds.includes('dna-replication'),
        isMinimized: minimizedWindowIds.includes('dna-replication'),
        icon: <Dna className="h-5 w-5 text-blue-500" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 800 },
      },
      {
        id: '3d-function-grapher',
        title: '3D Function Grapher',
        content: <FunctionGrapher3D />,
        isOpen: openWindowIds.includes('3d-function-grapher'),
        isMinimized: minimizedWindowIds.includes('3d-function-grapher'),
        icon: <TrendingUp className="h-5 w-5 text-purple-500" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 800 },
      },
      {
        id: 'fractal-generator',
        title: 'Fractal Generator',
        content: <FractalGenerator />,
        isOpen: openWindowIds.includes('fractal-generator'),
        isMinimized: minimizedWindowIds.includes('fractal-generator'),
        icon: <Sparkles className="h-5 w-5 text-pink-500" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 800 },
      },
      {
        id: 'fourier-transform',
        title: 'Fourier Transform',
        content: <FourierTransform />,
        isOpen: openWindowIds.includes('fourier-transform'),
        isMinimized: minimizedWindowIds.includes('fourier-transform'),
        icon: <Waves className="h-5 w-5 text-blue-500" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 800 },
      },
      {
        id: 'calculus-visualizer',
        title: 'Calculus Visualizer',
        content: <CalculusVisualizer />,
        isOpen: openWindowIds.includes('calculus-visualizer'),
        isMinimized: minimizedWindowIds.includes('calculus-visualizer'),
        icon: <Calculator className="h-5 w-5 text-green-500" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 800 },
      },
      {
        id: 'linear-algebra',
        title: 'Linear Algebra',
        content: <LinearAlgebra />,
        isOpen: openWindowIds.includes('linear-algebra'),
        isMinimized: minimizedWindowIds.includes('linear-algebra'),
        icon: <Grid3x3 className="h-5 w-5 text-indigo-500" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 800 },
      },
      {
        id: 'prime-sieve',
        title: 'Prime Number Sieve',
        content: <PrimeSieve />,
        isOpen: openWindowIds.includes('prime-sieve'),
        isMinimized: minimizedWindowIds.includes('prime-sieve'),
        icon: <Sigma className="h-5 w-5 text-amber-500" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 800 },
      },
      {
        id: 'graph-theory',
        title: 'Graph Theory',
        content: <GraphTheory />,
        isOpen: openWindowIds.includes('graph-theory'),
        isMinimized: minimizedWindowIds.includes('graph-theory'),
        icon: <GitBranch className="h-5 w-5 text-cyan-500" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 800 },
      },
      {
        id: 'probability-dist',
        title: 'Probability Distributions',
        content: <ProbabilityDistributions />,
        isOpen: openWindowIds.includes('probability-dist'),
        isMinimized: minimizedWindowIds.includes('probability-dist'),
        icon: <PieChart className="h-5 w-5 text-pink-500" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 800 },
      },
      {
        id: 'neuron-signal',
        title: 'Neuron Signal',
        content: <NeuronSignal />,
        isOpen: openWindowIds.includes('neuron-signal'),
        isMinimized: minimizedWindowIds.includes('neuron-signal'),
        icon: <Brain className="h-5 w-5 text-purple-500" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 800 },
      },
      {
        id: 'heart-circulation',
        title: 'Heart & Circulation',
        content: <HeartCirculation />,
        isOpen: openWindowIds.includes('heart-circulation'),
        isMinimized: minimizedWindowIds.includes('heart-circulation'),
        icon: <Heart className="h-5 w-5 text-red-500" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 800 },
      },
      {
        id: 'doppler-effect',
        title: 'Doppler Effect',
        content: <DopplerEffect />,
        isOpen: openWindowIds.includes('doppler-effect'),
        isMinimized: minimizedWindowIds.includes('doppler-effect'),
        icon: <Waves className="h-5 w-5 text-indigo-500" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'quantum-tunneling',
        title: 'Quantum Mechanics Lab',
        content: <QuantumTunneling />,
        isOpen: openWindowIds.includes('quantum-tunneling'),
        isMinimized: minimizedWindowIds.includes('quantum-tunneling'),
        icon: <Atom className="h-5 w-5 text-purple-600" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'bernoulli-principle',
        title: "Bernoulli's Principle",
        content: <BernoulliPrinciple />,
        isOpen: openWindowIds.includes('bernoulli-principle'),
        isMinimized: minimizedWindowIds.includes('bernoulli-principle'),
        icon: <Wind className="h-5 w-5 text-sky-500" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'thermodynamics',
        title: 'Thermodynamics & Heat Transfer',
        content: <Thermodynamics />,
        isOpen: openWindowIds.includes('thermodynamics'),
        isMinimized: minimizedWindowIds.includes('thermodynamics'),
        icon: <Thermometer className="h-5 w-5 text-orange-500" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'special-relativity',
        title: 'Special Relativity',
        content: <SpecialRelativity />,
        isOpen: openWindowIds.includes('special-relativity'),
        isMinimized: minimizedWindowIds.includes('special-relativity'),
        icon: <Gauge className="h-5 w-5 text-blue-400" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'black-hole',
        title: 'Black Hole Gravity Well',
        content: <BlackHoleGravityWell />,
        isOpen: openWindowIds.includes('black-hole'),
        isMinimized: minimizedWindowIds.includes('black-hole'),
        icon: <Circle className="h-5 w-5 text-purple-400" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'lc-circuit',
        title: 'LC / RLC Oscillator',
        content: <LCCircuit />,
        isOpen: openWindowIds.includes('lc-circuit'),
        isMinimized: minimizedWindowIds.includes('lc-circuit'),
        icon: <Zap className="h-5 w-5 text-yellow-400" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'snells-law',
        title: "Snell's Law",
        content: <SnellsLaw />,
        isOpen: openWindowIds.includes('snells-law'),
        isMinimized: minimizedWindowIds.includes('snells-law'),
        icon: <Lightbulb className="h-5 w-5 text-yellow-400" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'diffraction-grating',
        title: 'Diffraction Grating',
        content: <DiffractionGrating />,
        isOpen: openWindowIds.includes('diffraction-grating'),
        isMinimized: minimizedWindowIds.includes('diffraction-grating'),
        icon: <Scan className="h-5 w-5 text-violet-400" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'buoyancy',
        title: "Buoyancy & Archimedes' Principle",
        content: <Buoyancy />,
        isOpen: openWindowIds.includes('buoyancy'),
        isMinimized: minimizedWindowIds.includes('buoyancy'),
        icon: <Droplet className="h-5 w-5 text-cyan-400" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      // Physics/Engineering
      {
        id: 'hydraulic-system',
        title: 'Hydraulic System',
        content: <HydraulicSystem />,
        isOpen: openWindowIds.includes('hydraulic-system'),
        isMinimized: minimizedWindowIds.includes('hydraulic-system'),
        icon: <Droplet className="h-5 w-5 text-cyan-500" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'simple-machines',
        title: 'Simple Machines',
        content: <SimpleMachines />,
        isOpen: openWindowIds.includes('simple-machines'),
        isMinimized: minimizedWindowIds.includes('simple-machines'),
        icon: <Wrench className="h-5 w-5 text-emerald-500" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'electrical-circuit',
        title: 'Electrical Circuit',
        content: <ElectricalCircuit />,
        isOpen: openWindowIds.includes('electrical-circuit'),
        isMinimized: minimizedWindowIds.includes('electrical-circuit'),
        icon: <Zap className="h-5 w-5 text-yellow-500" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      // Earth & Space Sciences
      {
        id: 'solar-system',
        title: 'Solar System',
        content: <SolarSystem />,
        isOpen: openWindowIds.includes('solar-system'),
        isMinimized: minimizedWindowIds.includes('solar-system'),
        icon: <Sun className="h-5 w-5 text-yellow-400" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1100, height: 750 },
      },
      {
        id: 'moon-phases',
        title: 'Moon Phases',
        content: <MoonPhases />,
        isOpen: openWindowIds.includes('moon-phases'),
        isMinimized: minimizedWindowIds.includes('moon-phases'),
        icon: <Moon className="h-5 w-5 text-gray-300" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1100, height: 750 },
      },
      {
        id: 'plate-tectonics',
        title: 'Plate Tectonics',
        content: <PlateTectonics />,
        isOpen: openWindowIds.includes('plate-tectonics'),
        isMinimized: minimizedWindowIds.includes('plate-tectonics'),
        icon: <Mountain className="h-5 w-5 text-amber-600" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1100, height: 750 },
      },
      {
        id: 'atmospheric-layers',
        title: 'Atmospheric Layers',
        content: <AtmosphericLayers />,
        isOpen: openWindowIds.includes('atmospheric-layers'),
        isMinimized: minimizedWindowIds.includes('atmospheric-layers'),
        icon: <Cloud className="h-5 w-5 text-sky-400" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1100, height: 750 },
      },
      {
        id: 'star-life-cycle',
        title: 'Star Life Cycle',
        content: <StarLifeCycle />,
        isOpen: openWindowIds.includes('star-life-cycle'),
        isMinimized: minimizedWindowIds.includes('star-life-cycle'),
        icon: <Star className="h-5 w-5 text-yellow-300" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1100, height: 750 },
      },
      {
        id: 'eclipse-simulator',
        title: 'Eclipse Simulator',
        content: <EclipseSimulator />,
        isOpen: openWindowIds.includes('eclipse-simulator'),
        isMinimized: minimizedWindowIds.includes('eclipse-simulator'),
        icon: <Circle className="h-5 w-5 text-gray-500" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1100, height: 750 },
      },
      {
        id: 'seasons-earth-tilt',
        title: 'Seasons & Earth Tilt',
        content: <SeasonsEarthTilt />,
        isOpen: openWindowIds.includes('seasons-earth-tilt'),
        isMinimized: minimizedWindowIds.includes('seasons-earth-tilt'),
        icon: <Globe className="h-5 w-5 text-blue-400" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1100, height: 750 },
      },
      // Earth & Space Folder
      {
        id: 'earth-space-folder-window',
        title: 'Earth & Space Sciences',
        content: <FolderContent type="earth-space" />,
        isOpen: openWindowIds.includes('earth-space-folder-window'),
        isMinimized: minimizedWindowIds.includes('earth-space-folder-window'),
        icon: <Globe className="h-5 w-5 text-blue-500" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 800, height: 600 },
      },
      // Engine/CS - New
      {
        id: 'binary-converter',
        title: 'Binary Converter',
        content: <BinaryConverter />,
        isOpen: openWindowIds.includes('binary-converter'),
        isMinimized: minimizedWindowIds.includes('binary-converter'),
        icon: <Binary className="h-5 w-5 text-green-400" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'logic-gates',
        title: 'Logic Gates',
        content: <LogicGates />,
        isOpen: openWindowIds.includes('logic-gates'),
        isMinimized: minimizedWindowIds.includes('logic-gates'),
        icon: <CircuitBoard className="h-5 w-5 text-blue-400" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'cpu-simulator',
        title: 'CPU Simulator',
        content: <CPUSimulator />,
        isOpen: openWindowIds.includes('cpu-simulator'),
        isMinimized: minimizedWindowIds.includes('cpu-simulator'),
        icon: <Cpu className="h-5 w-5 text-purple-400" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1100, height: 750 },
      },
      {
        id: 'memory-allocator',
        title: 'Memory Allocator',
        content: <MemoryAllocator />,
        isOpen: openWindowIds.includes('memory-allocator'),
        isMinimized: minimizedWindowIds.includes('memory-allocator'),
        icon: <MemoryStick className="h-5 w-5 text-teal-400" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'turing-machine',
        title: 'Turing Machine',
        content: <TuringMachine />,
        isOpen: openWindowIds.includes('turing-machine'),
        isMinimized: minimizedWindowIds.includes('turing-machine'),
        icon: <Scan className="h-5 w-5 text-amber-400" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'pid-controller',
        title: 'PID Controller',
        content: <PIDController />,
        isOpen: openWindowIds.includes('pid-controller'),
        isMinimized: minimizedWindowIds.includes('pid-controller'),
        icon: <Gauge className="h-5 w-5 text-teal-400" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      // DSA Visualizers
      {
        id: 'tree-traversals',
        title: 'Tree Traversals',
        content: <TreeTraversals />,
        isOpen: openWindowIds.includes('tree-traversals'),
        isMinimized: minimizedWindowIds.includes('tree-traversals'),
        icon: <GitBranch className="h-5 w-5 text-green-400" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'graph-algorithms',
        title: 'Graph Algorithms',
        content: <GraphAlgorithms />,
        isOpen: openWindowIds.includes('graph-algorithms'),
        isMinimized: minimizedWindowIds.includes('graph-algorithms'),
        icon: <Layers className="h-5 w-5 text-emerald-400" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1100, height: 750 },
      },
      {
        id: 'dp-visualizer',
        title: 'Dynamic Programming',
        content: <DPVisualizer />,
        isOpen: openWindowIds.includes('dp-visualizer'),
        isMinimized: minimizedWindowIds.includes('dp-visualizer'),
        icon: <Grid3x3 className="h-5 w-5 text-purple-400" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1100, height: 750 },
      },
      {
        id: 'hashing-visualizer',
        title: 'Hashing & Collisions',
        content: <HashingVisualizer />,
        isOpen: openWindowIds.includes('hashing-visualizer'),
        isMinimized: minimizedWindowIds.includes('hashing-visualizer'),
        icon: <Bolt className="h-5 w-5 text-orange-400" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'memory-stack-heap',
        title: 'Memory Stack & Heap',
        content: <MemoryStackHeap />,
        isOpen: openWindowIds.includes('memory-stack-heap'),
        isMinimized: minimizedWindowIds.includes('memory-stack-heap'),
        icon: <MemoryStick className="h-5 w-5 text-cyan-400" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1100, height: 700 },
      },
      {
        id: 'bigo-comparator',
        title: 'Big-O Comparator',
        content: <BigOComparator />,
        isOpen: openWindowIds.includes('bigo-comparator'),
        isMinimized: minimizedWindowIds.includes('bigo-comparator'),
        icon: <BarChart3 className="h-5 w-5 text-rose-400" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 750 },
      },
      {
        id: 'backtracking-visualizer',
        title: 'Backtracking',
        content: <BacktrackingVisualizer />,
        isOpen: openWindowIds.includes('backtracking-visualizer'),
        isMinimized: minimizedWindowIds.includes('backtracking-visualizer'),
        icon: <Wrench className="h-5 w-5 text-amber-400" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 900, height: 700 },
      },
      {
        id: 'trie-segment-tree',
        title: 'Trie & Segment Tree',
        content: <TrieSegmentTree />,
        isOpen: openWindowIds.includes('trie-segment-tree'),
        isMinimized: minimizedWindowIds.includes('trie-segment-tree'),
        icon: <Binary className="h-5 w-5 text-teal-400" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'complexity-analyzer',
        title: 'Complexity Analyzer',
        content: <ComplexityAnalyzer />,
        isOpen: openWindowIds.includes('complexity-analyzer'),
        isMinimized: minimizedWindowIds.includes('complexity-analyzer'),
        icon: <BarChart3 className="h-5 w-5 text-indigo-400" />,
        zIndex: 100,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 750 },
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
        content: getOrCreateContent('qrcode', () => <QRCodeVisualizer />),
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
        id: 'minecraft',
        title: 'Minecraft',
        content: <Minecraft />,
        isOpen: openWindowIds.includes('minecraft'),
        isMinimized: minimizedWindowIds.includes('minecraft'),
        icon: <Gamepad className="h-5 w-5 text-green-600" />,
        zIndex: 100,
        showInStartMenu: true,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 900, height: 650 },
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
      },
      // ---- Music Apps ----
      {
        id: 'virtual-instruments',
        title: 'Virtual Instruments',
        content: <VirtualInstruments />,
        isOpen: openWindowIds.includes('virtual-instruments'),
        isMinimized: minimizedWindowIds.includes('virtual-instruments'),
        icon: <Music className="h-5 w-5 text-blue-400" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false,
        showInTaskbar: true,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 650 },
      },
      {
        id: 'beat-sequencer',
        title: 'Beat Sequencer',
        content: <BeatSequencer />,
        isOpen: openWindowIds.includes('beat-sequencer'),
        isMinimized: minimizedWindowIds.includes('beat-sequencer'),
        icon: <Music className="h-5 w-5 text-red-400" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false,
        showInTaskbar: true,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 900, height: 600 },
      },
      {
        id: 'piano-roll',
        title: 'Piano Roll',
        content: <PianoRoll />,
        isOpen: openWindowIds.includes('piano-roll'),
        isMinimized: minimizedWindowIds.includes('piano-roll'),
        icon: <Music className="h-5 w-5 text-green-400" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false,
        showInTaskbar: true,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 700 },
      },
      {
        id: 'waveform-visualizer',
        title: 'Waveform Visualizer',
        content: <WaveformVisualizer />,
        isOpen: openWindowIds.includes('waveform-visualizer'),
        isMinimized: minimizedWindowIds.includes('waveform-visualizer'),
        icon: <Waves className="h-5 w-5 text-cyan-400" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false,
        showInTaskbar: true,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 800, height: 500 },
      },
      {
        id: 'effects-rack',
        title: 'Effects Rack',
        content: <EffectsRack />,
        isOpen: openWindowIds.includes('effects-rack'),
        isMinimized: minimizedWindowIds.includes('effects-rack'),
        icon: <Music className="h-5 w-5 text-purple-400" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false,
        showInTaskbar: true,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 800, height: 550 },
      },
      {
        id: 'chord-helper',
        title: 'Chord Progressions',
        content: <ChordProgressionHelper />,
        isOpen: openWindowIds.includes('chord-helper'),
        isMinimized: minimizedWindowIds.includes('chord-helper'),
        icon: <Music className="h-5 w-5 text-amber-400" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false,
        showInTaskbar: true,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 900, height: 600 },
      },
      {
        id: 'music-theory',
        title: 'Music Theory',
        content: <MusicTheoryHelper />,
        isOpen: openWindowIds.includes('music-theory'),
        isMinimized: minimizedWindowIds.includes('music-theory'),
        icon: <Music className="h-5 w-5 text-teal-400" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false,
        showInTaskbar: true,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 850, height: 600 },
      },
      {
        id: 'arpeggiator',
        title: 'Arpeggiator',
        content: <Arpeggiator />,
        isOpen: openWindowIds.includes('arpeggiator'),
        isMinimized: minimizedWindowIds.includes('arpeggiator'),
        icon: <Music className="h-5 w-5 text-pink-400" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false,
        showInTaskbar: true,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 800, height: 550 },
      },
      {
        id: 'sample-pad',
        title: 'Sample Pad',
        content: <SamplePad />,
        isOpen: openWindowIds.includes('sample-pad'),
        isMinimized: minimizedWindowIds.includes('sample-pad'),
        icon: <Music className="h-5 w-5 text-orange-400" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false,
        showInTaskbar: true,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 800, height: 600 },
      },
      {
        id: 'daw-studio',
        title: 'DAW Studio',
        content: <DAWStudio />,
        isOpen: openWindowIds.includes('daw-studio'),
        isMinimized: minimizedWindowIds.includes('daw-studio'),
        icon: <Music className="h-5 w-5 text-cyan-400" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false,
        showInTaskbar: true,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1400, height: 900 },
      },
      // ---- Networking Tools ----
      {
        id: 'subnet-calculator',
        title: 'Subnet Calculator',
        content: <SubnetCalculator />,
        isOpen: openWindowIds.includes('subnet-calculator'),
        isMinimized: minimizedWindowIds.includes('subnet-calculator'),
        icon: <Network className="h-5 w-5 text-blue-500" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'ipv4-converter',
        title: 'IPv4 Converter',
        content: <IPv4Converter />,
        isOpen: openWindowIds.includes('ipv4-converter'),
        isMinimized: minimizedWindowIds.includes('ipv4-converter'),
        icon: <Globe className="h-5 w-5 text-emerald-500" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 800, height: 600 },
      },
      {
        id: 'ipv4-range-expander',
        title: 'IPv4 Range Expander',
        content: <IPv4RangeExpander />,
        isOpen: openWindowIds.includes('ipv4-range-expander'),
        isMinimized: minimizedWindowIds.includes('ipv4-range-expander'),
        icon: <TrendingUp className="h-5 w-5 text-orange-500" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 900, height: 650 },
      },
      {
        id: 'mac-address-tool',
        title: 'MAC Address Tool',
        content: <MACAddressTool />,
        isOpen: openWindowIds.includes('mac-address-tool'),
        isMinimized: minimizedWindowIds.includes('mac-address-tool'),
        icon: <Cpu className="h-5 w-5 text-teal-500" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 900, height: 650 },
      },
      {
        id: 'ipv6-ula-generator',
        title: 'IPv6 ULA Generator',
        content: <IPv6ULAGenerator />,
        isOpen: openWindowIds.includes('ipv6-ula-generator'),
        isMinimized: minimizedWindowIds.includes('ipv6-ula-generator'),
        icon: <Globe className="h-5 w-5 text-violet-500" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 900, height: 650 },
      },
      // ---- Editing Tools ----
      {
        id: 'image-editor',
        title: 'Image Editor',
        content: <ImageEditor />,
        isOpen: openWindowIds.includes('image-editor'),
        isMinimized: minimizedWindowIds.includes('image-editor'),
        icon: <Image className="h-5 w-5 text-pink-500" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1200, height: 800 },
      },
      {
        id: 'video-editor',
        title: 'Video Editor',
        content: <VideoEditor />,
        isOpen: openWindowIds.includes('video-editor'),
        isMinimized: minimizedWindowIds.includes('video-editor'),
        icon: <Scissors className="h-5 w-5 text-indigo-500" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false,
        showInTaskbar: false,
        isResizable: true,
        isMaximizable: true,
        defaultSize: { width: 1400, height: 900 },
      },
      // Cybersecurity Tools
      {
        id: 'sql-injection-demo',
        title: 'SQL Injection Demo',
        content: <SQLInjectionDemo />,
        isOpen: openWindowIds.includes('sql-injection-demo'),
        isMinimized: minimizedWindowIds.includes('sql-injection-demo'),
        icon: <Database className="h-5 w-5 text-red-600" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'xss-simulator',
        title: 'XSS Simulator',
        content: <XSSSimulator />,
        isOpen: openWindowIds.includes('xss-simulator'),
        isMinimized: minimizedWindowIds.includes('xss-simulator'),
        icon: <Bug className="h-5 w-5 text-orange-600" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'phishing-analyzer',
        title: 'Phishing Analyzer',
        content: <PhishingAnalyzer />,
        isOpen: openWindowIds.includes('phishing-analyzer'),
        isMinimized: minimizedWindowIds.includes('phishing-analyzer'),
        icon: <Eye className="h-5 w-5 text-yellow-600" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 900, height: 650 },
      },
      {
        id: 'packet-sniffer',
        title: 'Packet Sniffer Visualizer',
        content: <PacketSnifferVisualizer />,
        isOpen: openWindowIds.includes('packet-sniffer'),
        isMinimized: minimizedWindowIds.includes('packet-sniffer'),
        icon: <Waves className="h-5 w-5 text-cyan-600" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 1100, height: 700 },
      },
      {
        id: 'firewall-builder',
        title: 'Firewall Rule Builder',
        content: <FirewallRuleBuilder />,
        isOpen: openWindowIds.includes('firewall-builder'),
        isMinimized: minimizedWindowIds.includes('firewall-builder'),
        icon: <Shield className="h-5 w-5 text-blue-600" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'password-cracking',
        title: 'Password Cracking Demo',
        content: <PasswordCrackingDemo />,
        isOpen: openWindowIds.includes('password-cracking'),
        isMinimized: minimizedWindowIds.includes('password-cracking'),
        icon: <Lock className="h-5 w-5 text-red-500" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 900, height: 650 },
      },
      {
        id: 'ctf-challenge',
        title: 'CTF Challenge',
        content: <CTFChallenge />,
        isOpen: openWindowIds.includes('ctf-challenge'),
        isMinimized: minimizedWindowIds.includes('ctf-challenge'),
        icon: <Flag className="h-5 w-5 text-green-600" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'cia-triad',
        title: 'CIA Triad Explainer',
        content: <CIATriadExplainer />,
        isOpen: openWindowIds.includes('cia-triad'),
        isMinimized: minimizedWindowIds.includes('cia-triad'),
        icon: <Shield className="h-5 w-5 text-indigo-600" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 900, height: 650 },
      },
      {
        id: 'social-engineering',
        title: 'Social Engineering Walkthroughs',
        content: <SocialEngineeringWalkthroughs />,
        isOpen: openWindowIds.includes('social-engineering'),
        isMinimized: minimizedWindowIds.includes('social-engineering'),
        icon: <Users className="h-5 w-5 text-purple-600" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 900, height: 700 },
      },
      {
        id: 'owasp-top10',
        title: 'OWASP Top 10',
        content: <OWASPTop10 />,
        isOpen: openWindowIds.includes('owasp-top10'),
        isMinimized: minimizedWindowIds.includes('owasp-top10'),
        icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'port-scanner',
        title: 'Port Scanner Visualizer',
        content: <PortScannerVisualizer />,
        isOpen: openWindowIds.includes('port-scanner'),
        isMinimized: minimizedWindowIds.includes('port-scanner'),
        icon: <Scan className="h-5 w-5 text-teal-600" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'vulnerability-scanning',
        title: 'Vulnerability Scanning Demo',
        content: <VulnerabilityScanningDemo />,
        isOpen: openWindowIds.includes('vulnerability-scanning'),
        isMinimized: minimizedWindowIds.includes('vulnerability-scanning'),
        icon: <Bug className="h-5 w-5 text-red-500" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      // Machine Learning
      {
        id: 'algorithm-explainers',
        title: 'Algorithm Explainers',
        content: <AlgorithmExplainers />,
        isOpen: openWindowIds.includes('algorithm-explainers'),
        isMinimized: minimizedWindowIds.includes('algorithm-explainers'),
        icon: <Brain className="h-5 w-5 text-purple-600" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'parameter-tuner',
        title: 'Parameter Tuner',
        content: <ParameterTuner />,
        isOpen: openWindowIds.includes('parameter-tuner'),
        isMinimized: minimizedWindowIds.includes('parameter-tuner'),
        icon: <Cog className="h-5 w-5 text-blue-600" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 900, height: 650 },
      },
      {
        id: 'dataset-analyzer',
        title: 'Dataset Analyzer',
        content: <DatasetAnalyzer />,
        isOpen: openWindowIds.includes('dataset-analyzer'),
        isMinimized: minimizedWindowIds.includes('dataset-analyzer'),
        icon: <Table className="h-5 w-5 text-green-600" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'train-test-split',
        title: 'Train/Test Split Visualizer',
        content: <TrainTestSplitVisualizer />,
        isOpen: openWindowIds.includes('train-test-split'),
        isMinimized: minimizedWindowIds.includes('train-test-split'),
        icon: <Scissors className="h-5 w-5 text-orange-600" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 900, height: 650 },
      },
      {
        id: 'model-metrics',
        title: 'Model Metrics',
        content: <ModelMetrics />,
        isOpen: openWindowIds.includes('model-metrics'),
        isMinimized: minimizedWindowIds.includes('model-metrics'),
        icon: <BarChart3 className="h-5 w-5 text-cyan-600" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'bias-variance',
        title: 'Bias-Variance Tradeoff',
        content: <BiasVarianceTradeoff />,
        isOpen: openWindowIds.includes('bias-variance'),
        isMinimized: minimizedWindowIds.includes('bias-variance'),
        icon: <TrendingUp className="h-5 w-5 text-red-600" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 900, height: 650 },
      },
      {
        id: 'feature-importance',
        title: 'Feature Importance Visualizer',
        content: <FeatureImportanceVisualizer />,
        isOpen: openWindowIds.includes('feature-importance'),
        isMinimized: minimizedWindowIds.includes('feature-importance'),
        icon: <Layers className="h-5 w-5 text-indigo-600" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 900, height: 650 },
      },
      {
        id: 'hyperparameter-tuning',
        title: 'Hyperparameter Tuning',
        content: <HyperparameterTuning />,
        isOpen: openWindowIds.includes('hyperparameter-tuning'),
        isMinimized: minimizedWindowIds.includes('hyperparameter-tuning'),
        icon: <Wrench className="h-5 w-5 text-amber-600" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'model-comparison',
        title: 'Model Comparison',
        content: <ModelComparison />,
        isOpen: openWindowIds.includes('model-comparison'),
        isMinimized: minimizedWindowIds.includes('model-comparison'),
        icon: <GitBranch className="h-5 w-5 text-teal-600" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 1000, height: 700 },
      },
      {
        id: 'model-wizard',
        title: 'Model Wizard',
        content: <ModelWizard />,
        isOpen: openWindowIds.includes('model-wizard'),
        isMinimized: minimizedWindowIds.includes('model-wizard'),
        icon: <Sparkles className="h-5 w-5 text-purple-500" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 900, height: 700 },
      },
      {
        id: 'deep-learning-builder',
        title: 'Deep Learning Builder',
        content: <DeepLearningBuilder />,
        isOpen: openWindowIds.includes('deep-learning-builder'),
        isMinimized: minimizedWindowIds.includes('deep-learning-builder'),
        icon: <CircuitBoard className="h-5 w-5 text-blue-500" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 1100, height: 750 },
      },
      {
        id: 'gradient-descent',
        title: 'Gradient Descent Simulator',
        content: <GradientDescentSimulator />,
        isOpen: openWindowIds.includes('gradient-descent'),
        isMinimized: minimizedWindowIds.includes('gradient-descent'),
        icon: <TrendingUp className="h-5 w-5 text-green-500" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 900, height: 650 },
      },
      // Data Visualizer
      {
        id: 'data-visualizer-app',
        title: 'Data Visualizer',
        content: <DataVisualizer />,
        isOpen: openWindowIds.includes('data-visualizer-app'),
        isMinimized: minimizedWindowIds.includes('data-visualizer-app'),
        icon: <PieChart className="h-5 w-5 text-blue-600" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 1100, height: 750 },
      },
      {
        id: 'dashboard-builder',
        title: 'Dashboard Builder',
        content: <DashboardBuilder />,
        isOpen: openWindowIds.includes('dashboard-builder'),
        isMinimized: minimizedWindowIds.includes('dashboard-builder'),
        icon: <Grid3x3 className="h-5 w-5 text-indigo-600" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 1200, height: 800 },
      },
      // Programming Labs
      {
        id: 'python-lab',
        title: 'Python',
        content: <PythonLab />,
        isOpen: openWindowIds.includes('python-lab'),
        isMinimized: minimizedWindowIds.includes('python-lab'),
        icon: <Code className="h-5 w-5 text-blue-500" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 1100, height: 750 },
      },
      {
        id: 'javascript-lab',
        title: 'JavaScript',
        content: <JavaScriptLab />,
        isOpen: openWindowIds.includes('javascript-lab'),
        isMinimized: minimizedWindowIds.includes('javascript-lab'),
        icon: <Code className="h-5 w-5 text-yellow-500" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 1100, height: 750 },
      },
      {
        id: 'c-lab',
        title: 'C',
        content: <CLab />,
        isOpen: openWindowIds.includes('c-lab'),
        isMinimized: minimizedWindowIds.includes('c-lab'),
        icon: <Code className="h-5 w-5 text-gray-500" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 1100, height: 750 },
      },
      {
        id: 'cpp-lab',
        title: 'C++',
        content: <CppLab />,
        isOpen: openWindowIds.includes('cpp-lab'),
        isMinimized: minimizedWindowIds.includes('cpp-lab'),
        icon: <Code className="h-5 w-5 text-indigo-500" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 1100, height: 750 },
      },
      {
        id: 'java-lab',
        title: 'Java',
        content: <JavaLab />,
        isOpen: openWindowIds.includes('java-lab'),
        isMinimized: minimizedWindowIds.includes('java-lab'),
        icon: <Code className="h-5 w-5 text-red-500" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 1100, height: 750 },
      },
      {
        id: 'csharp-lab',
        title: 'C#',
        content: <CSharpLab />,
        isOpen: openWindowIds.includes('csharp-lab'),
        isMinimized: minimizedWindowIds.includes('csharp-lab'),
        icon: <Code className="h-5 w-5 text-purple-500" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 1100, height: 750 },
      },
      {
        id: 'typescript-lab',
        title: 'TypeScript',
        content: <TypeScriptLab />,
        isOpen: openWindowIds.includes('typescript-lab'),
        isMinimized: minimizedWindowIds.includes('typescript-lab'),
        icon: <Code className="h-5 w-5 text-blue-600" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 1100, height: 750 },
      },
      {
        id: 'go-lab',
        title: 'Go',
        content: <GoLab />,
        isOpen: openWindowIds.includes('go-lab'),
        isMinimized: minimizedWindowIds.includes('go-lab'),
        icon: <Code className="h-5 w-5 text-cyan-500" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 1100, height: 750 },
      },
      {
        id: 'rust-lab',
        title: 'Rust',
        content: <RustLab />,
        isOpen: openWindowIds.includes('rust-lab'),
        isMinimized: minimizedWindowIds.includes('rust-lab'),
        icon: <Code className="h-5 w-5 text-orange-500" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 1100, height: 750 },
      },
      {
        id: 'sql-lab',
        title: 'SQL',
        content: <SQLLab />,
        isOpen: openWindowIds.includes('sql-lab'),
        isMinimized: minimizedWindowIds.includes('sql-lab'),
        icon: <Code className="h-5 w-5 text-emerald-500" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 1100, height: 750 },
      },
      {
        id: 'htmlcss-lab',
        title: 'HTML / CSS',
        content: <HtmlCssLab />,
        isOpen: openWindowIds.includes('htmlcss-lab'),
        isMinimized: minimizedWindowIds.includes('htmlcss-lab'),
        icon: <Code className="h-5 w-5 text-pink-500" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 1100, height: 750 },
      },
      {
        id: 'nodejs-lab',
        title: 'Node.js',
        content: <NodeJsLab />,
        isOpen: openWindowIds.includes('nodejs-lab'),
        isMinimized: minimizedWindowIds.includes('nodejs-lab'),
        icon: <Code className="h-5 w-5 text-green-500" />,
        zIndex: APP_ZINDEX,
        showInStartMenu: false, showInTaskbar: false, isResizable: true, isMaximizable: true,
        defaultSize: { width: 1100, height: 750 },
      },
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
      defaultSize: { width: 800, height: 600 },
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
      defaultSize: { width: 800, height: 600 },
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
      defaultSize: { width: 800, height: 600 },
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
      defaultSize: { width: 800, height: 600 },
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
      defaultSize: { width: 800, height: 600 },
      showInStartMenu: false,
      showInTaskbar: true,
      isResizable: true,
      isMaximizable: true,
    };

    const biologyFolderWindow: WindowType = {
      id: 'biology-folder-window',
      title: 'Biology Lab',
      content: <FolderContent type="biology" />,
      isOpen: openWindowIds.includes('biology-folder-window'),
      isMinimized: minimizedWindowIds.includes('biology-folder-window'),
      icon: <Dna className="h-5 w-5 text-green-600" />,
      zIndex: 100,
      defaultSize: { width: 800, height: 600 },
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
      defaultSize: { width: 800, height: 600 },
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
      defaultSize: { width: 800, height: 600 },
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
      defaultSize: { width: 800, height: 600 },
      showInStartMenu: true,
      showInTaskbar: true,
      isResizable: true,
      isMaximizable: true,
    };

    const cryptFolderWindow: WindowType = {
      id: 'crypt-folder-window',
      title: 'Crypt',
      content: <FolderContent type="crypt" />,
      isOpen: openWindowIds.includes('crypt-folder-window'),
      isMinimized: minimizedWindowIds.includes('crypt-folder-window'),
      icon: <Shield className="h-5 w-5 text-green-500" />,
      zIndex: FOLDER_ZINDEX,
      defaultSize: { width: 800, height: 600 },
      showInStartMenu: true,
      showInTaskbar: true,
      isResizable: true,
      isMaximizable: true,
    };

    const musicFolderWindow: WindowType = {
      id: 'music-folder-window',
      title: 'Music Studio',
      content: <FolderContent type="music" />,
      isOpen: openWindowIds.includes('music-folder-window'),
      isMinimized: minimizedWindowIds.includes('music-folder-window'),
      icon: <Music className="h-5 w-5 text-pink-500" />,
      zIndex: FOLDER_ZINDEX,
      defaultSize: { width: 800, height: 600 },
      showInStartMenu: true,
      showInTaskbar: true,
      isResizable: true,
      isMaximizable: true,
    };

    const engineCodeFolderWindow: WindowType = {
      id: 'engine-code-folder-window',
      title: 'Code / CS',
      content: <FolderContent type="engine-code" />,
      isOpen: openWindowIds.includes('engine-code-folder-window'),
      isMinimized: minimizedWindowIds.includes('engine-code-folder-window'),
      icon: <Code className="h-5 w-5 text-blue-500" />,
      zIndex: FOLDER_ZINDEX,
      defaultSize: { width: 800, height: 600 },
      showInStartMenu: false,
      showInTaskbar: true,
      isResizable: true,
      isMaximizable: true,
    };

    const engineArchFolderWindow: WindowType = {
      id: 'engine-arch-folder-window',
      title: 'Computer Architecture',
      content: <FolderContent type="engine-arch" />,
      isOpen: openWindowIds.includes('engine-arch-folder-window'),
      isMinimized: minimizedWindowIds.includes('engine-arch-folder-window'),
      icon: <CircuitBoard className="h-5 w-5 text-orange-500" />,
      zIndex: FOLDER_ZINDEX,
      defaultSize: { width: 800, height: 600 },
      showInStartMenu: false,
      showInTaskbar: true,
      isResizable: true,
      isMaximizable: true,
    };

    const engineDsaFolderWindow: WindowType = {
      id: 'engine-dsa-folder-window',
      title: 'DSA Visualizers',
      content: <FolderContent type="engine-dsa" />,
      isOpen: openWindowIds.includes('engine-dsa-folder-window'),
      isMinimized: minimizedWindowIds.includes('engine-dsa-folder-window'),
      icon: <BarChart3 className="h-5 w-5 text-green-500" />,
      zIndex: FOLDER_ZINDEX,
      defaultSize: { width: 800, height: 600 },
      showInStartMenu: false,
      showInTaskbar: true,
      isResizable: true,
      isMaximizable: true,
    };

    const networksFolderWindow: WindowType = {
      id: 'networks-folder-window',
      title: 'Networks',
      content: <FolderContent type="networks" />,
      isOpen: openWindowIds.includes('networks-folder-window'),
      isMinimized: minimizedWindowIds.includes('networks-folder-window'),
      icon: <Network className="h-5 w-5 text-blue-500" />,
      zIndex: FOLDER_ZINDEX,
      defaultSize: { width: 800, height: 600 },
      showInStartMenu: true,
      showInTaskbar: true,
      isResizable: true,
      isMaximizable: true,
    };

    const editingFolderWindow: WindowType = {
      id: 'editing-folder-window',
      title: 'Editing',
      content: <FolderContent type="editing" />,
      isOpen: openWindowIds.includes('editing-folder-window'),
      isMinimized: minimizedWindowIds.includes('editing-folder-window'),
      icon: <Scissors className="h-5 w-5 text-pink-500" />,
      zIndex: FOLDER_ZINDEX,
      defaultSize: { width: 800, height: 600 },
      showInStartMenu: true,
      showInTaskbar: true,
      isResizable: true,
      isMaximizable: true,
    };

    const cybersecurityFolderWindow: WindowType = {
      id: 'cybersecurity-folder-window',
      title: 'Cybersecurity Tools',
      content: <FolderContent type="cybersecurity" />,
      isOpen: openWindowIds.includes('cybersecurity-folder-window'),
      isMinimized: minimizedWindowIds.includes('cybersecurity-folder-window'),
      icon: <Shield className="h-5 w-5 text-red-500" />,
      zIndex: FOLDER_ZINDEX,
      defaultSize: { width: 800, height: 600 },
      showInStartMenu: false,
      showInTaskbar: true,
      isResizable: true,
      isMaximizable: true,
    };

    const machineLearningFolderWindow: WindowType = {
      id: 'machine-learning-folder-window',
      title: 'Machine Learning',
      content: <FolderContent type="machine-learning" />,
      isOpen: openWindowIds.includes('machine-learning-folder-window'),
      isMinimized: minimizedWindowIds.includes('machine-learning-folder-window'),
      icon: <Brain className="h-5 w-5 text-purple-500" />,
      zIndex: FOLDER_ZINDEX,
      defaultSize: { width: 800, height: 600 },
      showInStartMenu: false,
      showInTaskbar: true,
      isResizable: true,
      isMaximizable: true,
    };

    const dataVisualizerFolderWindow: WindowType = {
      id: 'data-visualizer-folder-window',
      title: 'Data Visualizer',
      content: <FolderContent type="data-visualizer" />,
      isOpen: openWindowIds.includes('data-visualizer-folder-window'),
      isMinimized: minimizedWindowIds.includes('data-visualizer-folder-window'),
      icon: <PieChart className="h-5 w-5 text-blue-500" />,
      zIndex: FOLDER_ZINDEX,
      defaultSize: { width: 800, height: 600 },
      showInStartMenu: false,
      showInTaskbar: true,
      isResizable: true,
      isMaximizable: true,
    };

    const programmingFolderWindow: WindowType = {
      id: 'programming-folder-window',
      title: 'Programming',
      content: <FolderContent type="programming" />,
      isOpen: openWindowIds.includes('programming-folder-window'),
      isMinimized: minimizedWindowIds.includes('programming-folder-window'),
      icon: <Code className="h-5 w-5 text-green-500" />,
      zIndex: FOLDER_ZINDEX,
      defaultSize: { width: 800, height: 600 },
      showInStartMenu: false,
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
      biologyFolderWindow,
      utilitiesFolderWindow,
      colorsFolderWindow,
      virtualEngineFolderWindow,
      mathFolderWindow,
      cryptFolderWindow,
      musicFolderWindow,
      engineCodeFolderWindow,
      engineArchFolderWindow,
      engineDsaFolderWindow,
      networksFolderWindow,
      editingFolderWindow,
      cybersecurityFolderWindow,
      machineLearningFolderWindow,
      dataVisualizerFolderWindow,
      programmingFolderWindow
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

    // Don't reinitialize windows - this causes state loss!
    // Settings changes should not recreate window objects
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('win11-wallpaper', wallpaper);
  }, [wallpaper]);

  // Window state is not persisted - app starts fresh on every refresh
  // Only settings, theme, and wallpaper are persisted

  const toggleWindow = useCallback((id: string) => startTransition(() => {
    // Check if physics mode is active - prevent opening windows during physics mode
    const isPhysicsActive = sessionStorage.getItem('win11-physics-active') === 'true';
    if (isPhysicsActive) {
      alert('⚠️ Cannot open applications while Physics Mode is active.\n\nPlease disable Physics Mode first to open applications.');
      return;
    }

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
          return prevWindows.map(window => {
            if (window.id === id) {
              return {
                ...window,
                isOpen: true,
                isMinimized: false,
                defaultPosition: cascadePosition,
                zIndex: newZIndex
              };
            }
            return window; // Keep original reference for unchanged windows
          });
        } else {
          // If window is already open, just bring it to front with highest z-index
          return prevWindows.map(window => {
            if (window.id === id) {
              return {
                ...window,
                zIndex: newZIndex
              };
            }
            return window; // Keep original reference for unchanged windows
          });
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

        return prevWindows.map(window => {
          if (window.id === id) {
            return {
              ...window,
              zIndex: newZIndex
            };
          }
          return window; // Keep original reference
        });
      });
    }, 50);
  }), [minimizedWindows]);

  const closeWindow = useCallback((id: string) => {
    setWindows(prevWindows =>
      prevWindows.map(window => {
        if (window.id === id) {
          return {
            ...window,
            isOpen: false
          };
        }
        return window; // Keep original reference
      })
    );
    setMinimizedWindows(prev => prev.filter(winId => winId !== id));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows(prevWindows =>
      prevWindows.map(window => {
        if (window.id === id) {
          return {
            ...window,
            isMinimized: true,
            isOpen: true
          };
        }
        return window;
      })
    );

    if (!minimizedWindows.includes(id)) {
      setMinimizedWindows(prev => [...prev, id]);
    }
  }, []);

  const bringToFront = useCallback((id: string) => {
    setWindows(prevWindows => {
      const currentMaxZIndex = Math.max(...prevWindows.map(w => w.zIndex || 0));
      const newZIndex = Math.max(currentMaxZIndex, APP_ZINDEX) + ZINDEX_INCREMENT;

      return prevWindows.map(window => {
        if (window.id === id) {
          return {
            ...window,
            zIndex: newZIndex,
            isMinimized: false,
            isOpen: true
          };
        }
        return window;
      });
    });

    setMinimizedWindows(prev => prev.filter(winId => winId !== id));
  }, []);


  // A stable context value: rebuilding this object on every render made every
  // consumer re-render on any state change, including on each frame of a
  // window drag.
  const contextValue = useMemo(() => ({
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
    isDarkMode,
    windowThemeOverrides,
    setWindowTheme,
    globalWindowTheme,
    setGlobalWindowTheme,
  }), [
    windows, highestZIndex, toggleWindow, closeWindow, minimizeWindow,
    bringToFront, settings, minimizedWindows, setWallpaper, wallpaper,
    isDarkMode, windowThemeOverrides, setWindowTheme, globalWindowTheme,
    setGlobalWindowTheme,
  ]);

  return (
    <WindowsContext.Provider value={contextValue}>
      {children}
    </WindowsContext.Provider>
  );
};
