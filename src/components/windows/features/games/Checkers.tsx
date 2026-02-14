import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RotateCcw, Trophy, User, Cpu } from 'lucide-react';

type PieceType = 'red' | 'black' | 'red-king' | 'black-king' | null;
type Board = PieceType[][];

interface Position {
  row: number;
  col: number;
}

interface Move {
  from: Position;
  to: Position;
  captures?: Position[];
}

export const Checkers: React.FC = () => {
  const [board, setBoard] = useState<Board>(initializeBoard());
  const [selectedPiece, setSelectedPiece] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<'red' | 'black'>('red');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [score, setScore] = useState({ red: 12, black: 12 });
  const [mustCapture, setMustCapture] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);

  function initializeBoard(): Board {
    const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // Place black pieces (top)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          board[row][col] = 'black';
        }
      }
    }
    
    // Place red pieces (bottom)
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          board[row][col] = 'red';
        }
      }
    }
    
    return board;
  }

  useEffect(() => {
    checkGameOver();
    if (currentPlayer === 'black' && !gameOver) {
      // AI turn
      setTimeout(() => makeAIMove(), 500);
    }
  }, [currentPlayer, board]);

  const isKing = (piece: PieceType): boolean => {
    return piece === 'red-king' || piece === 'black-king';
  };

  const getPieceColor = (piece: PieceType): 'red' | 'black' | null => {
    if (!piece) return null;
    return piece.includes('red') ? 'red' : 'black';
  };

  const getValidMoves = (row: number, col: number): Move[] => {
    const piece = board[row][col];
    if (!piece || getPieceColor(piece) !== currentPlayer) return [];

    const moves: Move[] = [];
    const captures: Move[] = [];
    const directions = isKing(piece) 
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] 
      : currentPlayer === 'red' 
        ? [[-1, -1], [-1, 1]] 
        : [[1, -1], [1, 1]];

    // Check for captures first
    for (const [dRow, dCol] of directions) {
      const jumpRow = row + dRow * 2;
      const jumpCol = col + dCol * 2;
      const midRow = row + dRow;
      const midCol = col + dCol;

      if (jumpRow >= 0 && jumpRow < 8 && jumpCol >= 0 && jumpCol < 8) {
        const midPiece = board[midRow][midCol];
        const jumpPiece = board[jumpRow][jumpCol];

        if (midPiece && getPieceColor(midPiece) !== currentPlayer && !jumpPiece) {
          captures.push({
            from: { row, col },
            to: { row: jumpRow, col: jumpCol },
            captures: [{ row: midRow, col: midCol }]
          });
        }
      }
    }

    // If captures available, only return captures
    if (captures.length > 0) {
      return captures;
    }

    // Regular moves
    for (const [dRow, dCol] of directions) {
      const newRow = row + dRow;
      const newCol = col + dCol;

      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8 && !board[newRow][newCol]) {
        moves.push({
          from: { row, col },
          to: { row: newRow, col: newCol }
        });
      }
    }

    return moves;
  };

  const getAllValidMoves = (player: 'red' | 'black'): Move[] => {
    const allMoves: Move[] = [];
    const allCaptures: Move[] = [];

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && getPieceColor(piece) === player) {
          const moves = getValidMoves(row, col);
          moves.forEach(move => {
            if (move.captures && move.captures.length > 0) {
              allCaptures.push(move);
            } else {
              allMoves.push(move);
            }
          });
        }
      }
    }

    return allCaptures.length > 0 ? allCaptures : allMoves;
  };

  const handleSquareClick = (row: number, col: number) => {
    if (gameOver || currentPlayer === 'black' || aiThinking) return;

    const piece = board[row][col];

    // If a piece is already selected
    if (selectedPiece) {
      const move = validMoves.find(m => m.to.row === row && m.to.col === col);
      
      if (move) {
        makeMove(move);
        setSelectedPiece(null);
        setValidMoves([]);
      } else if (piece && getPieceColor(piece) === currentPlayer) {
        // Select different piece
        setSelectedPiece({ row, col });
        setValidMoves(getValidMoves(row, col));
      } else {
        setSelectedPiece(null);
        setValidMoves([]);
      }
    } else if (piece && getPieceColor(piece) === currentPlayer) {
      // Select a piece
      setSelectedPiece({ row, col });
      setValidMoves(getValidMoves(row, col));
    }
  };

  const makeMove = (move: Move) => {
    const newBoard = board.map(row => [...row]);
    const piece = newBoard[move.from.row][move.from.col];
    
    // Move piece
    newBoard[move.to.row][move.to.col] = piece;
    newBoard[move.from.row][move.from.col] = null;

    // Remove captured pieces
    if (move.captures) {
      move.captures.forEach(cap => {
        newBoard[cap.row][cap.col] = null;
      });
    }

    // Promote to king
    if (piece === 'red' && move.to.row === 0) {
      newBoard[move.to.row][move.to.col] = 'red-king';
    } else if (piece === 'black' && move.to.row === 7) {
      newBoard[move.to.row][move.to.col] = 'black-king';
    }

    setBoard(newBoard);
    updateScore(newBoard);
    setCurrentPlayer(currentPlayer === 'red' ? 'black' : 'red');
  };

  const makeAIMove = () => {
    setAiThinking(true);
    const moves = getAllValidMoves('black');
    
    if (moves.length === 0) {
      setGameOver(true);
      setWinner('Red');
      setAiThinking(false);
      return;
    }

    // Prioritize captures
    const captureMoves = moves.filter(m => m.captures && m.captures.length > 0);
    const movesToConsider = captureMoves.length > 0 ? captureMoves : moves;

    // Simple AI: random move with slight preference for forward movement
    const scoredMoves = movesToConsider.map(move => {
      let score = Math.random();
      // Prefer moving forward
      if (move.to.row > move.from.row) score += 0.3;
      // Prefer captures
      if (move.captures) score += 0.5;
      return { move, score };
    });

    scoredMoves.sort((a, b) => b.score - a.score);
    const bestMove = scoredMoves[0].move;

    setTimeout(() => {
      makeMove(bestMove);
      setAiThinking(false);
    }, 300);
  };

  const updateScore = (newBoard: Board) => {
    let redCount = 0;
    let blackCount = 0;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = newBoard[row][col];
        if (piece) {
          if (getPieceColor(piece) === 'red') redCount++;
          else blackCount++;
        }
      }
    }

    setScore({ red: redCount, black: blackCount });
  };

  const checkGameOver = () => {
    const redMoves = getAllValidMoves('red');
    const blackMoves = getAllValidMoves('black');

    if (score.red === 0) {
      setGameOver(true);
      setWinner('Black');
    } else if (score.black === 0) {
      setGameOver(true);
      setWinner('Red');
    } else if (currentPlayer === 'red' && redMoves.length === 0) {
      setGameOver(true);
      setWinner('Black');
    } else if (currentPlayer === 'black' && blackMoves.length === 0) {
      setGameOver(true);
      setWinner('Red');
    }
  };

  const resetGame = () => {
    setBoard(initializeBoard());
    setSelectedPiece(null);
    setValidMoves([]);
    setCurrentPlayer('red');
    setGameOver(false);
    setWinner(null);
    setScore({ red: 12, black: 12 });
    setMustCapture(false);
    setAiThinking(false);
  };

  const isValidMoveSquare = (row: number, col: number): boolean => {
    return validMoves.some(m => m.to.row === row && m.to.col === col);
  };

  return (
    <div className="h-full w-full bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 p-3 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold dark:text-white">Checkers</h1>
          <span className="text-xs text-gray-500 dark:text-gray-400">vs AI</span>
        </div>
        <Button onClick={resetGame} variant="outline" size="sm">
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          New Game
        </Button>
      </div>

      <div className="flex-1 flex gap-3 min-h-0">
        {/* Game Board */}
        <div className="flex-shrink-0 flex items-center">
          <div className="h-full max-h-full aspect-square">
              <div className="grid grid-cols-8 gap-0 border-2 border-gray-800 dark:border-gray-600 rounded-lg overflow-hidden shadow-2xl h-full">
                {board.map((row, rowIndex) =>
                  row.map((piece, colIndex) => {
                    const isLight = (rowIndex + colIndex) % 2 === 0;
                    const isSelected = selectedPiece?.row === rowIndex && selectedPiece?.col === colIndex;
                    const isValidMove = isValidMoveSquare(rowIndex, colIndex);

                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        onClick={() => handleSquareClick(rowIndex, colIndex)}
                        className={`
                          aspect-square flex items-center justify-center cursor-pointer relative
                          transition-all duration-200
                          ${isLight 
                            ? 'bg-amber-100 dark:bg-amber-900/30' 
                            : 'bg-amber-800 dark:bg-amber-950'
                          }
                          ${isSelected ? 'ring-4 ring-blue-500 ring-inset' : ''}
                          ${isValidMove ? 'ring-4 ring-green-400 ring-inset' : ''}
                          ${!isLight && !gameOver && currentPlayer === 'red' ? 'hover:brightness-110' : ''}
                        `}
                      >
                        {/* Coordinate labels */}
                        {colIndex === 0 && (
                          <span className="absolute left-1 top-1 text-xs font-bold opacity-30">
                            {8 - rowIndex}
                          </span>
                        )}
                        {rowIndex === 7 && (
                          <span className="absolute right-1 bottom-1 text-xs font-bold opacity-30">
                            {String.fromCharCode(65 + colIndex)}
                          </span>
                        )}

                        {/* Valid move indicator */}
                        {isValidMove && !piece && (
                          <div className="w-4 h-4 bg-green-400 rounded-full opacity-60 animate-pulse" />
                        )}

                        {/* Piece */}
                        {piece && (
                          <div
                            className={`
                              w-[85%] h-[85%] rounded-full flex items-center justify-center
                              shadow-lg transition-transform duration-200
                              ${isSelected ? 'scale-110' : 'hover:scale-105'}
                              ${getPieceColor(piece) === 'red'
                                ? 'bg-gradient-to-br from-red-500 to-red-700 border-2 border-red-900'
                                : 'bg-gradient-to-br from-gray-800 to-black border-2 border-gray-950'
                              }
                            `}
                          >
                            {isKing(piece) && (
                              <div className="text-base font-bold text-yellow-300">
                                ♔
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

        {/* Side Panel */}
        <div className="flex-1 min-w-[180px] max-w-[220px] flex flex-col gap-2 overflow-y-auto">
          {/* Current Turn */}
          <Card className={`p-3 ${currentPlayer === 'red' ? 'bg-red-50 dark:bg-red-900/20 border-red-200' : 'bg-gray-100 dark:bg-gray-800 border-gray-300'}`}>
            <div className="flex items-center gap-2">
              {currentPlayer === 'red' ? (
                <User className="h-5 w-5 text-red-600" />
              ) : (
                <Cpu className="h-5 w-5 text-gray-600" />
              )}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Turn</p>
                <p className="text-sm font-bold dark:text-white">
                  {currentPlayer === 'red' ? 'Your Turn' : 'AI Thinking...'}
                </p>
              </div>
            </div>
            {aiThinking && (
              <div className="mt-2 flex gap-1">
                <div className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
          </Card>

          {/* Score */}
          <Card className="p-3 dark:bg-gray-800">
            <h3 className="text-xs font-bold mb-2 dark:text-white">Pieces</h3>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-red-500 to-red-700 border border-red-900" />
                  <span className="text-xs font-semibold dark:text-white">You</span>
                </div>
                <span className="text-lg font-bold text-red-600">{score.red}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-gray-800 to-black border border-gray-950" />
                  <span className="text-xs font-semibold dark:text-white">AI</span>
                </div>
                <span className="text-lg font-bold text-gray-800 dark:text-gray-300">{score.black}</span>
              </div>
            </div>
          </Card>

          {/* Game Over */}
          {gameOver && (
            <Card className="p-3 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-300">
              <div className="text-center">
                <Trophy className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <h3 className="text-lg font-bold mb-1 dark:text-white">Game Over!</h3>
                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                  {winner} Wins!
                </p>
                <Button onClick={resetGame} size="sm" className="mt-2 w-full">
                  Play Again
                </Button>
              </div>
            </Card>
          )}

          {/* Rules */}
          <Card className="p-3 dark:bg-gray-800">
            <h3 className="text-xs font-bold mb-1.5 dark:text-white">How to Play</h3>
            <ul className="text-[11px] space-y-0.5 text-gray-600 dark:text-gray-400">
              <li>Click a piece to select it</li>
              <li>Click highlighted square to move</li>
              <li>Jump over pieces to capture</li>
              <li>Reach opposite end = King</li>
              <li>Kings can move backwards</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};
