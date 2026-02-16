import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Trophy, Clock, Hash } from 'lucide-react';

export const Puzzle15 = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tiles, setTiles] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isSolved, setIsSolved] = useState(false);
  const [tileSize, setTileSize] = useState(80);

  useEffect(() => {
    initializeGame();
  }, []);

  // Resize
  useEffect(() => {
    const updateSize = () => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const available = Math.min(rect.width - 16, rect.height - 16);
      const newSize = Math.max(40, Math.min(Math.floor((available - 12) / 4), 100));
      setTileSize(newSize);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning && !isSolved) {
      interval = setInterval(() => setTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, isSolved]);

  const initializeGame = () => {
    const newTiles = Array.from({ length: 16 }, (_, i) => i);
    for (let i = 0; i < 1000; i++) {
      const emptyIndex = newTiles.indexOf(0);
      const validMoves = getValidMoves(emptyIndex);
      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      [newTiles[emptyIndex], newTiles[randomMove]] = [newTiles[randomMove], newTiles[emptyIndex]];
    }
    setTiles(newTiles);
    setMoves(0);
    setTime(0);
    setIsRunning(false);
    setIsSolved(false);
  };

  const getValidMoves = (emptyIndex: number): number[] => {
    const moves: number[] = [];
    const row = Math.floor(emptyIndex / 4);
    const col = emptyIndex % 4;
    if (row > 0) moves.push(emptyIndex - 4);
    if (row < 3) moves.push(emptyIndex + 4);
    if (col > 0) moves.push(emptyIndex - 1);
    if (col < 3) moves.push(emptyIndex + 1);
    return moves;
  };

  const handleTileClick = (index: number) => {
    if (isSolved) return;
    if (!isRunning) setIsRunning(true);

    const emptyIndex = tiles.indexOf(0);
    const validMoves = getValidMoves(emptyIndex);

    if (validMoves.includes(index)) {
      const newTiles = [...tiles];
      [newTiles[emptyIndex], newTiles[index]] = [newTiles[index], newTiles[emptyIndex]];
      setTiles(newTiles);
      setMoves(prev => prev + 1);

      const solved = newTiles.every((tile, i) => tile === i);
      if (solved) {
        setIsSolved(true);
        setIsRunning(false);
      }
    }
  };

  // Keyboard support
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isSolved) return;
      const emptyIndex = tiles.indexOf(0);
      const row = Math.floor(emptyIndex / 4);
      const col = emptyIndex % 4;
      let target = -1;

      switch (e.key) {
        case 'ArrowUp': if (row > 0) target = emptyIndex - 4; break;
        case 'ArrowDown': if (row < 3) target = emptyIndex + 4; break;
        case 'ArrowLeft': if (col > 0) target = emptyIndex - 1; break;
        case 'ArrowRight': if (col < 3) target = emptyIndex + 1; break;
      }

      if (target >= 0 && target < 16) {
        e.preventDefault();
        handleTileClick(target);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tiles, isSolved]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTileColor = (tile: number) => {
    if (tile === 0) return '';
    const hue = 200 + (tile / 15) * 60;
    const sat = 55 + (tile % 4) * 5;
    return `hsl(${hue}, ${sat}%, 48%)`;
  };

  const GAP = 4;
  const boardSize = tileSize * 4 + GAP * 3;

  return (
    <div className="h-full w-full flex flex-col overflow-hidden p-4">
      <h2 className="text-2xl font-semibold mb-3">15 Puzzle</h2>

      <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg mb-3">
        {/* Header stats */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5" />
              <span className="font-mono font-bold">{moves}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-mono font-bold">{formatTime(time)}</span>
            </div>
          </div>
          <button
            onClick={initializeGame}
            className="bg-white/80 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded p-1 px-2 flex items-center gap-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            New Game
          </button>
        </div>

        {/* Solved banner */}
        {isSolved && (
          <div className="text-center py-2 mb-3 rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 flex items-center justify-center gap-2">
            <Trophy className="h-4 w-4" />
            <span className="font-bold">Solved!</span>
            <span className="text-sm">{moves} moves in {formatTime(time)}</span>
          </div>
        )}

        {/* Board */}
        <div ref={containerRef} className="flex justify-center">
          <div
            className="grid grid-cols-4 bg-gray-400 dark:bg-gray-600 rounded-lg p-1"
            style={{ gap: GAP, width: boardSize + 8, height: boardSize + 8 }}
          >
            {tiles.map((tile, index) => {
              const isCorrect = tile === index && tile !== 0;
              return (
                <button
                  key={index}
                  onClick={() => handleTileClick(index)}
                  disabled={tile === 0}
                  className={`
                    font-bold transition-all duration-150 select-none flex items-center justify-center rounded
                    ${tile === 0
                      ? 'bg-gray-300/50 dark:bg-gray-700/50 cursor-default'
                      : `text-white cursor-pointer hover:brightness-110 active:scale-95 shadow-sm
                         ${isCorrect ? 'ring-2 ring-inset ring-green-400/60' : ''}`
                    }
                  `}
                  style={{
                    width: tileSize,
                    height: tileSize,
                    fontSize: tileSize * 0.35,
                    backgroundColor: tile ? getTileColor(tile) : undefined,
                  }}
                >
                  {tile !== 0 && tile}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400">
        <h3 className="font-semibold mb-1">How to play:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Click a tile next to the empty space to slide it</li>
          <li>Use arrow keys to move tiles</li>
          <li>Arrange tiles from 1-15 in order to win</li>
        </ul>
      </div>
    </div>
  );
};
