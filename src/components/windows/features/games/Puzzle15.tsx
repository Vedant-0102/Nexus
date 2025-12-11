import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCcw, Trophy } from 'lucide-react';

export const Puzzle15 = () => {
  const [tiles, setTiles] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isSolved, setIsSolved] = useState(false);

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && !isSolved) {
      interval = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, isSolved]);

  const initializeGame = () => {
    const newTiles = Array.from({ length: 16 }, (_, i) => i);
    // Shuffle
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

    if (row > 0) moves.push(emptyIndex - 4); // Up
    if (row < 3) moves.push(emptyIndex + 4); // Down
    if (col > 0) moves.push(emptyIndex - 1); // Left
    if (col < 3) moves.push(emptyIndex + 1); // Right

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

      // Check if solved
      const solved = newTiles.every((tile, i) => tile === i);
      if (solved) {
        setIsSolved(true);
        setIsRunning(false);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full w-full bg-gradient-to-br from-purple-900 to-blue-900 p-6 overflow-auto">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">15 Puzzle</h1>
            <p className="text-gray-300">Arrange the tiles in order!</p>
          </div>
          <Button onClick={initializeGame} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            New Game
          </Button>
        </div>

        {isSolved && (
          <Card className="p-4 bg-green-600 border-green-500">
            <div className="flex items-center gap-3 text-white">
              <Trophy className="h-8 w-8" />
              <div>
                <p className="font-bold text-lg">Congratulations! 🎉</p>
                <p className="text-sm">Solved in {moves} moves and {formatTime(time)}</p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 bg-gray-800 border-gray-700 text-center">
            <p className="text-gray-400 text-sm">Moves</p>
            <p className="text-3xl font-bold text-white">{moves}</p>
          </Card>
          <Card className="p-4 bg-gray-800 border-gray-700 text-center">
            <p className="text-gray-400 text-sm">Time</p>
            <p className="text-3xl font-bold text-white">{formatTime(time)}</p>
          </Card>
        </div>

        <Card className="p-6 bg-gray-800 border-gray-700">
          <div className="grid grid-cols-4 gap-2">
            {tiles.map((tile, index) => (
              <button
                key={index}
                onClick={() => handleTileClick(index)}
                disabled={tile === 0}
                className={`
                  aspect-square rounded-lg text-3xl font-bold transition-all
                  ${tile === 0 
                    ? 'bg-gray-900 cursor-default' 
                    : 'bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:scale-105 cursor-pointer'
                  }
                `}
              >
                {tile !== 0 && tile}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-4 bg-gray-800 border-gray-700">
          <h3 className="font-bold text-white mb-2">How to Play</h3>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Click on tiles adjacent to the empty space to move them</li>
            <li>• Arrange all tiles in numerical order (1-15)</li>
            <li>• The empty space should be in the bottom-right corner</li>
            <li>• Try to solve it in the fewest moves possible!</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};
