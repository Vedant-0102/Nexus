
import React, { useState, useEffect } from 'react';

export const TicTacToe = () => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);
  const [wins, setWins] = useState({ X: 0, O: 0 });

  // Calculate winner
  const calculateWinner = (squares: Array<string | null>) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    
    if (squares.every(square => square !== null)) {
      return 'draw';
    }
    
    return null;
  };

  // Update winner state when board changes
  useEffect(() => {
    const result = calculateWinner(board);
    if (result) {
      setWinner(result);
      if (result !== 'draw') {
        setWins(prev => ({ ...prev, [result]: prev[result as 'X' | 'O'] + 1 }));
      }
    }
  }, [board]);

  // Handle click on square
  const handleClick = (index: number) => {
    if (board[index] || winner) return;
    
    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);
  };

  // Reset game
  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
  };

  // Render square
  const Square = ({ value, onClick }: { value: string | null; onClick: () => void }) => (
    <button 
      className={`w-16 h-16 text-2xl font-bold border border-gray-300 flex items-center justify-center ${
        value === 'X' ? 'text-blue-600' : 'text-red-600'
      } hover:bg-gray-100`}
      onClick={onClick}
    >
      {value}
    </button>
  );
  
  // Game status message
  const getStatus = () => {
    if (winner === 'draw') {
      return "Game ended in a draw!";
    }
    if (winner) {
      return `Winner: ${winner}`;
    }
    return `Next Player: ${isXNext ? 'X' : 'O'}`;
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <h2 className="text-2xl font-semibold mb-4">Tic Tac Toe</h2>
      
      <div className="bg-white/50 p-4 rounded-lg flex-1 flex flex-col items-center justify-center">
        <div className="flex mb-4">
          <div className="px-4 py-2 bg-blue-100 rounded-l-lg">
            X: {wins.X}
          </div>
          <div className="px-4 py-2 bg-red-100 rounded-r-lg">
            O: {wins.O}
          </div>
        </div>
        
        <div className="mb-6 text-lg font-medium">
          {getStatus()}
        </div>
        
        <div className="grid grid-cols-3 gap-1 mb-4">
          {board.map((square, i) => (
            <Square key={i} value={square} onClick={() => handleClick(i)} />
          ))}
        </div>
        
        <button
          onClick={resetGame}
          className="px-6 py-2 bg-win-blue text-white rounded-lg hover:bg-win-blue-dark transition-colors"
        >
          New Game
        </button>
      </div>
    </div>
  );
};
