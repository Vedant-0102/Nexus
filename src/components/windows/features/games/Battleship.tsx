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
      setMessage('Hit! 🎯');
      
      if (newHits === 17) { // Total ship cells
        setGameOver(true);
        setWinner('player');
        setMessage('You won! 🎉');
        return;
      }
    } else {
      setMessage('Miss! 💨');
    }

    // Computer's turn
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
      setMessage('Computer hit your ship! 💥');
      
      if (newHits === 17) {
        setGameOver(true);
        setWinner('computer');
        setMessage('Computer won! 😢');
      }
    } else {
      setMessage('Computer missed! Your turn!');
    }
  };

  const getCellColor = (cell: CellState, isPlayerBoard: boolean, row?: number, col?: number) => {
    if (cell === 'hit') return 'bg-red-600 border-red-800';
    if (cell === 'miss') return 'bg-cyan-400 border-cyan-600';
    if (cell === 'ship' && isPlayerBoard) return 'bg-gray-700 border-gray-900';
    
    // Hover effect during placement
    if (placementPhase && isPlayerBoard && row !== undefined && col !== undefined) {
      const isHovered = hoverCells.some(c => c.row === row && c.col === col);
      if (isHovered) {
        const ship = SHIPS[currentShipIndex];
        const canPlace = canPlaceShip(playerBoard, hoverCells[0]?.row || 0, hoverCells[0]?.col || 0, ship.size, isHorizontal);
        return canPlace ? 'bg-green-300 border-green-500' : 'bg-red-300 border-red-500';
      }
    }
    
    return 'bg-blue-200 hover:bg-blue-300 border-blue-400';
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-3 overflow-hidden">
      <div className="flex items-center justify-between mb-2">
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
              className="gap-2"
            >
              <RotateCw className="h-4 w-4" />
              {isHorizontal ? 'Horizontal' : 'Vertical'}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setGameStarted(true)}
            disabled={gameStarted || placementPhase}
            className="gap-2"
          >
            <Target className="h-4 w-4" />
            Start Game
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={initializeGame}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            New Game
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-3 overflow-auto min-h-0">
        <Card className="p-2 bg-white/90 dark:bg-slate-800/90">
          <div className="text-center mb-1">
            <p className="text-sm font-semibold">{message}</p>
            {!placementPhase && (
              <div className="flex gap-3 justify-center mt-1 text-xs">
                <span>Your: {playerHits}/17</span>
                <span>Computer: {computerHits}/17</span>
              </div>
            )}
            {placementPhase && currentShipIndex < SHIPS.length && (
              <div className="mt-1 text-xs">
                <p>Placing: <span className="font-bold">{SHIPS[currentShipIndex].name}</span> ({SHIPS[currentShipIndex].size})</p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">
                  Remaining: {SHIPS.length - currentShipIndex}
                </p>
              </div>
            )}
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          {/* Player Board */}
          <div>
            <h3 className="text-center font-semibold mb-1 text-sm">Your Fleet</h3>
            <div className="grid grid-cols-10 gap-0.5 bg-white dark:bg-slate-800 p-1 rounded-lg">
              {playerBoard.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <div
                    key={`player-${rowIndex}-${colIndex}`}
                    className={`w-6 h-6 border ${getCellColor(cell, true, rowIndex, colIndex)} transition-colors ${placementPhase ? 'cursor-pointer' : ''}`}
                    onClick={() => placementPhase && handlePlacementClick(rowIndex, colIndex)}
                    onMouseEnter={() => placementPhase && handlePlacementHover(rowIndex, colIndex)}
                    onMouseLeave={() => placementPhase && setHoverCells([])}
                  />
                ))
              )}
            </div>
          </div>

          {/* Computer Board (Hidden) */}
          <div>
            <h3 className="text-center font-semibold mb-1 text-sm">Enemy Waters</h3>
            <div className="grid grid-cols-10 gap-0.5 bg-white dark:bg-slate-800 p-1 rounded-lg">
              {displayBoard.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <div
                    key={`computer-${rowIndex}-${colIndex}`}
                    className={`w-6 h-6 border ${getCellColor(cell, false)} transition-colors ${!placementPhase && gameStarted && !gameOver ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {gameOver && (
          <Card className="p-4 text-center">
            <Trophy className={`h-12 w-12 mx-auto mb-2 ${winner === 'player' ? 'text-yellow-500' : 'text-gray-500'}`} />
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
