import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Ship, RotateCcw, Trophy, Target, RotateCw } from 'lucide-react';

type CellState = 'empty' | 'ship' | 'hit' | 'miss';
type Board = CellState[][];

const BOARD_SIZE = 10;
const SHIPS = [
  { name: 'Carrier', size: 5, color: 'bg-purple-600' },
  { name: 'Battleship', size: 4, color: 'bg-red-600' },
  { name: 'Cruiser', size: 3, color: 'bg-orange-600' },
  { name: 'Submarine', size: 3, color: 'bg-green-600' },
  { name: 'Destroyer', size: 2, color: 'bg-blue-600' },
];

const COL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

export const Battleship: React.FC = () => {
  const [playerBoard, setPlayerBoard] = useState<Board>([]);
  const [computerBoard, setComputerBoard] = useState<Board>([]);
  const [displayBoard, setDisplayBoard] = useState<Board>([]);
  const [placementPhase, setPlacementPhase] = useState(true);
  const [currentShipIndex, setCurrentShipIndex] = useState(0);
  const [isHorizontal, setIsHorizontal] = useState(true);
  const [hoverCells, setHoverCells] = useState<{row: number, col: number}[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<'player' | 'computer' | null>(null);
  const [playerHits, setPlayerHits] = useState(0);
  const [computerHits, setComputerHits] = useState(0);
  const [message, setMessage] = useState('Place your ships!');

  useEffect(() => {
    const pBoard = createEmptyBoard();
    const cBoard = placeShipsRandomly();
    const dBoard = createEmptyBoard();

    setPlayerBoard(pBoard);
    setComputerBoard(cBoard);
    setDisplayBoard(dBoard);
  }, []);

  const createEmptyBoard = (): Board => {
    return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill('empty'));
  };

  const canPlaceShip = (board: Board, row: number, col: number, size: number, horizontal: boolean): boolean => {
    if (horizontal) {
      if (col + size > BOARD_SIZE) return false;
      for (let i = 0; i < size; i++) {
        if (board[row][col + i] !== 'empty') return false;
      }
    } else {
      if (row + size > BOARD_SIZE) return false;
      for (let i = 0; i < size; i++) {
        if (board[row + i][col] !== 'empty') return false;
      }
    }
    return true;
  };

  const placeShip = (board: Board, row: number, col: number, size: number, horizontal: boolean): Board => {
    const newBoard = board.map(r => [...r]);
    if (horizontal) {
      for (let i = 0; i < size; i++) {
        newBoard[row][col + i] = 'ship';
      }
    } else {
      for (let i = 0; i < size; i++) {
        newBoard[row + i][col] = 'ship';
      }
    }
    return newBoard;
  };

  const placeShipsRandomly = (): Board => {
    let board = createEmptyBoard();

    for (const ship of SHIPS) {
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 100) {
        const horizontal = Math.random() > 0.5;
        const row = Math.floor(Math.random() * BOARD_SIZE);
        const col = Math.floor(Math.random() * BOARD_SIZE);

        if (canPlaceShip(board, row, col, ship.size, horizontal)) {
          board = placeShip(board, row, col, ship.size, horizontal);
          placed = true;
        }
        attempts++;
      }
    }

    return board;
  };

  const initializeGame = () => {
    const pBoard = createEmptyBoard();
    const cBoard = placeShipsRandomly();
    const dBoard = createEmptyBoard();

    setPlayerBoard(pBoard);
    setComputerBoard(cBoard);
    setDisplayBoard(dBoard);
    setPlacementPhase(true);
    setCurrentShipIndex(0);
    setGameStarted(false);
    setGameOver(false);
    setWinner(null);
    setPlayerHits(0);
    setComputerHits(0);
    setMessage('Place your ships!');
    setHoverCells([]);
  };

  const handlePlacementHover = (row: number, col: number) => {
    if (!placementPhase || currentShipIndex >= SHIPS.length) return;

    const ship = SHIPS[currentShipIndex];
    const cells: {row: number, col: number}[] = [];

    for (let i = 0; i < ship.size; i++) {
      const r = isHorizontal ? row : row + i;
      const c = isHorizontal ? col + i : col;
      cells.push({ row: r, col: c });
    }

    setHoverCells(cells);
  };

  const handlePlacementClick = (row: number, col: number) => {
    if (!placementPhase || currentShipIndex >= SHIPS.length) return;

    const ship = SHIPS[currentShipIndex];

    if (canPlaceShip(playerBoard, row, col, ship.size, isHorizontal)) {
      const newBoard = placeShip(playerBoard, row, col, ship.size, isHorizontal);
      setPlayerBoard(newBoard);

      if (currentShipIndex === SHIPS.length - 1) {
        setPlacementPhase(false);
        setMessage('All ships placed! Click Start Game to begin!');
        setHoverCells([]);
      } else {
        setCurrentShipIndex(currentShipIndex + 1);
        setMessage(`Place your ${SHIPS[currentShipIndex + 1].name} (${SHIPS[currentShipIndex + 1].size} cells)`);
      }
    }
  };

  const handleCellClick = (row: number, col: number) => {
    if (!gameStarted || gameOver || displayBoard[row][col] !== 'empty') return;

    const newDisplayBoard = displayBoard.map(r => [...r]);
    const isHit = computerBoard[row][col] === 'ship';

    newDisplayBoard[row][col] = isHit ? 'hit' : 'miss';
    setDisplayBoard(newDisplayBoard);

    if (isHit) {
      const newHits = playerHits + 1;
      setPlayerHits(newHits);
      setMessage('Direct hit!');

      if (newHits === 17) {
        setGameOver(true);
        setWinner('player');
        setMessage('Victory! All enemy ships sunk!');
        return;
      }
    } else {
      setMessage('Miss! Splash...');
    }

    setTimeout(() => {
      computerTurn();
    }, 500);
  };

  const computerTurn = () => {
    let row, col;
    let attempts = 0;

    do {
      row = Math.floor(Math.random() * BOARD_SIZE);
      col = Math.floor(Math.random() * BOARD_SIZE);
      attempts++;
    } while (
      (playerBoard[row][col] === 'hit' || playerBoard[row][col] === 'miss') &&
      attempts < 100
    );

    const newPlayerBoard = playerBoard.map(r => [...r]);
    const isHit = newPlayerBoard[row][col] === 'ship';

    newPlayerBoard[row][col] = isHit ? 'hit' : 'miss';
    setPlayerBoard(newPlayerBoard);

    if (isHit) {
      const newHits = computerHits + 1;
      setComputerHits(newHits);
      setMessage('Computer hit your ship!');

      if (newHits === 17) {
        setGameOver(true);
        setWinner('computer');
        setMessage('Defeat! All your ships sunk!');
      }
    } else {
      setMessage('Computer missed! Your turn.');
    }
  };

  const getCellStyle = (cell: CellState, isPlayerBoard: boolean, row?: number, col?: number) => {
    // Hover effect during placement
    if (placementPhase && isPlayerBoard && row !== undefined && col !== undefined) {
      const isHovered = hoverCells.some(c => c.row === row && c.col === col);
      if (isHovered) {
        const ship = SHIPS[currentShipIndex];
        const canPlace = canPlaceShip(playerBoard, hoverCells[0]?.row || 0, hoverCells[0]?.col || 0, ship.size, isHorizontal);
        return canPlace
          ? 'bg-emerald-400 border-emerald-600 shadow-inner'
          : 'bg-red-400 border-red-600 shadow-inner';
      }
    }

    switch (cell) {
      case 'hit':
        return 'bg-red-600 border-red-800 shadow-inner';
      case 'miss':
        return 'bg-slate-300 dark:bg-slate-600 border-slate-400 dark:border-slate-500';
      case 'ship':
        return isPlayerBoard
          ? 'bg-slate-700 border-slate-900 dark:bg-slate-500 dark:border-slate-400'
          : 'bg-sky-300 hover:bg-sky-200 border-sky-400 dark:bg-sky-900 dark:hover:bg-sky-800 dark:border-sky-700';
      default:
        return 'bg-sky-300 hover:bg-sky-200 border-sky-400 dark:bg-sky-900 dark:hover:bg-sky-800 dark:border-sky-700';
    }
  };

  const renderCellContent = (cell: CellState, isPlayerBoard: boolean) => {
    if (cell === 'hit') {
      return (
        <span className="text-white font-black text-[11px] leading-none drop-shadow-sm">X</span>
      );
    }
    if (cell === 'miss') {
      return (
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 dark:bg-slate-400 block" />
      );
    }
    if (cell === 'ship' && isPlayerBoard) {
      return (
        <span className="w-2.5 h-2.5 rounded-sm bg-slate-400 dark:bg-slate-300 block" />
      );
    }
    return null;
  };

  const renderBoard = (
    board: Board,
    isPlayerBoard: boolean,
    onClick: (row: number, col: number) => void,
    onHover?: (row: number, col: number) => void,
    onLeave?: () => void,
    interactive?: boolean
  ) => (
    <div className="inline-block">
      {/* Column labels */}
      <div className="flex ml-5">
        {COL_LABELS.map(letter => (
          <div key={letter} className="w-[26px] text-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
            {letter}
          </div>
        ))}
      </div>
      <div className="flex">
        {/* Row labels */}
        <div className="flex flex-col">
          {Array.from({ length: BOARD_SIZE }, (_, i) => (
            <div key={i} className="h-[26px] w-5 flex items-center justify-end pr-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
              {i + 1}
            </div>
          ))}
        </div>
        {/* Grid */}
        <div className="grid grid-cols-10 gap-px bg-slate-400 dark:bg-slate-600 border border-slate-500 dark:border-slate-500 rounded">
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`w-[26px] h-[26px] border flex items-center justify-center transition-colors ${getCellStyle(cell, isPlayerBoard, rowIndex, colIndex)} ${interactive ? 'cursor-crosshair' : ''}`}
                onClick={() => onClick(rowIndex, colIndex)}
                onMouseEnter={() => onHover?.(rowIndex, colIndex)}
                onMouseLeave={() => onLeave?.()}
              >
                {renderCellContent(cell, isPlayerBoard)}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-100 to-sky-100 dark:from-slate-900 dark:to-slate-800 p-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div className="flex items-center gap-2">
          <Ship className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Battleship</h2>
        </div>
        <div className="flex gap-2">
          {placementPhase && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsHorizontal(!isHorizontal)}
              className="gap-1.5"
            >
              <RotateCw className="h-3.5 w-3.5" />
              {isHorizontal ? 'Horizontal' : 'Vertical'}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setGameStarted(true)}
            disabled={gameStarted || placementPhase}
            className="gap-1.5"
          >
            <Target className="h-3.5 w-3.5" />
            Start Game
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={initializeGame}
            className="gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            New Game
          </Button>
        </div>
      </div>

      {/* Game area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 overflow-auto min-h-0">
        {/* Status bar */}
        <Card className="px-4 py-2 bg-white/90 dark:bg-slate-800/90 w-full max-w-xl">
          <p className="text-sm font-semibold text-center">{message}</p>
          {!placementPhase && (
            <div className="flex gap-4 justify-center mt-1 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                You: <strong>{playerHits}</strong>/17
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                Computer: <strong>{computerHits}</strong>/17
              </span>
            </div>
          )}
          {placementPhase && currentShipIndex < SHIPS.length && (
            <div className="mt-1 text-xs text-center">
              <p>
                Placing: <strong>{SHIPS[currentShipIndex].name}</strong> ({SHIPS[currentShipIndex].size} cells)
                <span className="text-slate-400 ml-2">
                  {SHIPS.length - currentShipIndex} remaining
                </span>
              </p>
            </div>
          )}
        </Card>

        {/* Legend */}
        <div className="flex gap-4 text-[11px] text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded border bg-sky-300 dark:bg-sky-900 border-sky-400 dark:border-sky-700 inline-block" />
            Water
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded border bg-slate-700 dark:bg-slate-500 border-slate-900 dark:border-slate-400 inline-flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-sm bg-slate-400 dark:bg-slate-300 block" />
            </span>
            Ship
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded border bg-red-600 border-red-800 inline-flex items-center justify-center">
              <span className="text-white font-black text-[8px] leading-none">X</span>
            </span>
            Hit
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded border bg-slate-300 dark:bg-slate-600 border-slate-400 dark:border-slate-500 inline-flex items-center justify-center">
              <span className="w-1 h-1 rounded-full bg-slate-500 dark:bg-slate-400 block" />
            </span>
            Miss
          </span>
        </div>

        {/* Boards */}
        <div className="flex gap-6 items-start">
          {/* Player Board */}
          <div>
            <h3 className="text-center font-bold mb-1.5 text-sm text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Your Fleet
            </h3>
            {renderBoard(
              playerBoard,
              true,
              (r, c) => placementPhase && handlePlacementClick(r, c),
              (r, c) => placementPhase && handlePlacementHover(r, c),
              () => placementPhase && setHoverCells([]),
              placementPhase
            )}
          </div>

          {/* Computer Board */}
          <div>
            <h3 className="text-center font-bold mb-1.5 text-sm text-red-700 dark:text-red-400 flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              Enemy Waters
            </h3>
            {renderBoard(
              displayBoard,
              false,
              (r, c) => handleCellClick(r, c),
              undefined,
              undefined,
              !placementPhase && gameStarted && !gameOver
            )}
          </div>
        </div>

        {/* Game over overlay */}
        {gameOver && (
          <Card className="p-4 text-center">
            <Trophy className={`h-10 w-10 mx-auto mb-2 ${winner === 'player' ? 'text-yellow-500' : 'text-slate-500'}`} />
            <h3 className="text-xl font-bold mb-1">
              {winner === 'player' ? 'Victory!' : 'Defeat!'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-3 text-sm">
              {winner === 'player' ? 'You sank all enemy ships!' : 'All your ships were sunk!'}
            </p>
            <Button onClick={initializeGame} className="gap-2" size="sm">
              <RotateCcw className="h-3 w-3" />
              Play Again
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};
