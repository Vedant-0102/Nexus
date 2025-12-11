import React, { useState, useEffect } from 'react';
import { ChessEngine } from './ChessEngine';
import { ChessAI } from './ChessAI';
import { ChessBoard } from './ChessBoard';
import { Position, PieceColor } from './types';
import { Button } from '@/components/ui/button';
import { RotateCcw, RefreshCw, Undo, Settings } from 'lucide-react';

export const ChessGame: React.FC = () => {
  const [engine] = useState(() => new ChessEngine());
  const [ai] = useState(() => new ChessAI(engine, 3));
  const [gameState, setGameState] = useState(engine.getState());
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [legalMoves, setLegalMoves] = useState<Position[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [aiDifficulty, setAiDifficulty] = useState(3);
  const [gameMode, setGameMode] = useState<'human-vs-ai' | 'human-vs-human'>('human-vs-ai');

  useEffect(() => {
    // AI makes move if it's black's turn and game mode is human-vs-ai
    if (gameMode === 'human-vs-ai' && 
        gameState.currentPlayer === 'black' && 
        !gameState.isCheckmate && 
        !gameState.isStalemate &&
        !aiThinking) {
      makeAIMove();
    }
  }, [gameState.currentPlayer, gameMode]);

  const makeAIMove = async () => {
    setAiThinking(true);
    
    // Small delay to show thinking state
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const move = ai.getBestMove('black');
    
    if (move) {
      engine.makeMove(move.from, move.to);
      setGameState(engine.getState());
      setSelectedSquare(null);
      setLegalMoves([]);
    }
    
    setAiThinking(false);
  };

  const handleSquareClick = (pos: Position) => {
    if (aiThinking) return;
    if (gameState.isCheckmate || gameState.isStalemate) return;

    // In human-vs-ai mode, only allow moves when it's white's turn
    if (gameMode === 'human-vs-ai' && gameState.currentPlayer === 'black') {
      return;
    }

    const piece = engine.getPiece(pos);

    // If no square selected, select this square if it has a piece of current player
    if (!selectedSquare) {
      if (piece && piece.color === gameState.currentPlayer) {
        setSelectedSquare(pos);
        setLegalMoves(engine.getLegalMoves(pos));
      }
      return;
    }

    // If same square clicked, deselect
    if (selectedSquare.row === pos.row && selectedSquare.col === pos.col) {
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    // If clicking another piece of same color, select that instead
    if (piece && piece.color === gameState.currentPlayer) {
      setSelectedSquare(pos);
      setLegalMoves(engine.getLegalMoves(pos));
      return;
    }

    // Try to make the move
    const success = engine.makeMove(selectedSquare, pos);
    
    if (success) {
      setGameState(engine.getState());
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const handleNewGame = () => {
    engine.reset();
    setGameState(engine.getState());
    setSelectedSquare(null);
    setLegalMoves([]);
    setAiThinking(false);
  };

  const handleUndo = () => {
    if (gameMode === 'human-vs-ai') {
      // Undo both AI and player moves
      engine.undoMove(); // AI move
      engine.undoMove(); // Player move
    } else {
      engine.undoMove();
    }
    setGameState(engine.getState());
    setSelectedSquare(null);
    setLegalMoves([]);
    setAiThinking(false);
  };

  const handleFlipBoard = () => {
    setFlipped(!flipped);
  };

  const handleDifficultyChange = (difficulty: number) => {
    setAiDifficulty(difficulty);
    ai.setDepth(difficulty);
  };

  const getStatusMessage = (): string => {
    if (gameState.isCheckmate) {
      const winner = gameState.currentPlayer === 'white' ? 'Black' : 'White';
      return `Checkmate! ${winner} wins!`;
    }
    if (gameState.isStalemate) {
      return 'Stalemate! Game is a draw.';
    }
    if (gameState.isCheck) {
      return `${gameState.currentPlayer === 'white' ? 'White' : 'Black'} is in check!`;
    }
    if (aiThinking) {
      return 'AI is thinking...';
    }
    return `${gameState.currentPlayer === 'white' ? 'White' : 'Black'} to move`;
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-300 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Chess</h2>
          {aiThinking && (
            <div className="animate-spin">
              <RefreshCw size={18} className="text-blue-500" />
            </div>
          )}
        </div>
        
        <div className="flex gap-1">
          <Button
            onClick={handleUndo}
            disabled={gameState.moveHistory.length === 0 || aiThinking}
            variant="outline"
            size="sm"
            title="Undo Move"
          >
            <Undo size={14} />
          </Button>
          <Button
            onClick={handleFlipBoard}
            variant="outline"
            size="sm"
            title="Flip Board"
            className={flipped ? 'bg-blue-100 dark:bg-blue-900' : ''}
          >
            <RotateCcw size={14} className={flipped ? 'rotate-180 transition-transform' : 'transition-transform'} />
          </Button>
          <Button
            onClick={handleNewGame}
            variant="outline"
            size="sm"
            title="New Game"
          >
            <RefreshCw size={14} />
          </Button>
        </div>
      </div>

      {/* Status Bar */}
      <div className={`text-center py-2 px-4 text-sm font-semibold ${
        gameState.isCheckmate ? 'bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100' :
        gameState.isCheck ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100' :
        'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
      }`}>
        {getStatusMessage()}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-4">
        <div className="flex flex-col lg:flex-row gap-4 h-full">
          {/* Chess Board */}
          <div className="flex-1 flex items-center justify-center">
            <ChessBoard
              board={gameState.board}
              selectedSquare={selectedSquare}
              legalMoves={legalMoves}
              onSquareClick={handleSquareClick}
              flipped={flipped}
            />
          </div>

          {/* Side Panel */}
          <div className="w-full lg:w-64 flex flex-col gap-3">
            {/* Game Mode */}
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
              <h3 className="text-xs font-semibold mb-2 text-gray-900 dark:text-gray-100">Mode</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setGameMode('human-vs-ai');
                    handleNewGame();
                  }}
                  className={`flex-1 px-2 py-1.5 rounded text-xs transition-colors ${
                    gameMode === 'human-vs-ai'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  vs AI
                </button>
                <button
                  onClick={() => {
                    setGameMode('human-vs-human');
                    handleNewGame();
                  }}
                  className={`flex-1 px-2 py-1.5 rounded text-xs transition-colors ${
                    gameMode === 'human-vs-human'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  vs Human
                </button>
              </div>
            </div>

            {/* AI Difficulty */}
            {gameMode === 'human-vs-ai' && (
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                <h3 className="text-xs font-semibold mb-2 text-gray-900 dark:text-gray-100">Difficulty</h3>
                <div className="flex gap-2">
                  {[
                    { level: 2, label: 'Easy' },
                    { level: 3, label: 'Med' },
                    { level: 4, label: 'Hard' },
                  ].map(({ level, label }) => (
                    <button
                      key={level}
                      onClick={() => handleDifficultyChange(level)}
                      disabled={aiThinking}
                      className={`flex-1 px-2 py-1.5 rounded text-xs transition-colors ${
                        aiDifficulty === level
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Move History */}
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg flex-1 min-h-0 flex flex-col">
              <h3 className="text-xs font-semibold mb-2 text-gray-900 dark:text-gray-100">
                Moves ({gameState.moveHistory.length})
              </h3>
              <div className="flex-1 overflow-y-auto text-xs text-gray-700 dark:text-gray-300">
                {gameState.moveHistory.length === 0 ? (
                  <p className="text-gray-500 text-xs">No moves yet</p>
                ) : (
                  <div className="space-y-0.5">
                    {gameState.moveHistory.map((move, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="font-mono text-gray-500 min-w-[2rem]">{Math.floor(idx / 2) + 1}.</span>
                        <span>
                          {String.fromCharCode(97 + move.from.col)}{8 - move.from.row}→
                          {String.fromCharCode(97 + move.to.col)}{8 - move.to.row}
                          {move.captured && '×'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
