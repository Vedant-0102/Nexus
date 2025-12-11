import React, { useState } from 'react';
import { Piece, Position } from './types';

interface ChessBoardProps {
  board: (Piece | null)[][];
  selectedSquare: Position | null;
  legalMoves: Position[];
  onSquareClick: (pos: Position) => void;
  flipped: boolean;
}

const PIECE_SYMBOLS: Record<string, Record<string, string>> = {
  white: {
    king: '♔',
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙',
  },
  black: {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟',
  },
};

export const ChessBoard: React.FC<ChessBoardProps> = ({
  board,
  selectedSquare,
  legalMoves,
  onSquareClick,
  flipped,
}) => {
  const [hoveredSquare, setHoveredSquare] = useState<Position | null>(null);

  const isLightSquare = (row: number, col: number): boolean => {
    return (row + col) % 2 === 0;
  };

  const isSelected = (row: number, col: number): boolean => {
    return selectedSquare !== null && selectedSquare.row === row && selectedSquare.col === col;
  };

  const isLegalMove = (row: number, col: number): boolean => {
    return legalMoves.some(move => move.row === row && move.col === col);
  };

  const isHovered = (row: number, col: number): boolean => {
    return hoveredSquare !== null && hoveredSquare.row === row && hoveredSquare.col === col;
  };

  const getSquareColor = (row: number, col: number): string => {
    if (isSelected(row, col)) {
      return 'bg-yellow-400 dark:bg-yellow-600';
    }
    if (isHovered(row, col)) {
      return isLightSquare(row, col) 
        ? 'bg-gray-300 dark:bg-gray-600' 
        : 'bg-gray-400 dark:bg-gray-700';
    }
    return isLightSquare(row, col) 
      ? 'bg-amber-100 dark:bg-amber-200' 
      : 'bg-amber-700 dark:bg-amber-800';
  };

  const renderSquare = (row: number, col: number) => {
    const piece = board[row][col];

    return (
      <div
        key={`${row}-${col}`}
        className={`relative aspect-square flex items-center justify-center cursor-pointer transition-colors ${getSquareColor(row, col)}`}
        onClick={() => onSquareClick({ row, col })}
        onMouseEnter={() => setHoveredSquare({ row, col })}
        onMouseLeave={() => setHoveredSquare(null)}
      >
        {/* Coordinates */}
        {(flipped ? col === 7 : col === 0) && (
          <div className="absolute left-1 top-1 text-xs font-semibold opacity-60">
            {8 - row}
          </div>
        )}
        {(flipped ? row === 0 : row === 7) && (
          <div className="absolute right-1 bottom-1 text-xs font-semibold opacity-60">
            {String.fromCharCode(97 + col)}
          </div>
        )}

        {/* Legal move indicator */}
        {isLegalMove(row, col) && (
          <div className={`absolute inset-0 flex items-center justify-center pointer-events-none`}>
            {piece ? (
              <div className="w-full h-full border-4 border-green-500 rounded-lg opacity-50" />
            ) : (
              <div className="w-3 h-3 bg-green-500 rounded-full opacity-60" />
            )}
          </div>
        )}

        {/* Piece */}
        {piece && (
          <div className="text-5xl select-none pointer-events-none">
            {PIECE_SYMBOLS[piece.color][piece.type]}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="grid grid-cols-8 gap-0 border-4 border-gray-800 dark:border-gray-600 rounded-lg overflow-hidden shadow-2xl aspect-square">
        {Array.from({ length: 8 }, (_, displayRow) => {
          const row = flipped ? 7 - displayRow : displayRow;
          return Array.from({ length: 8 }, (_, displayCol) => {
            const col = flipped ? 7 - displayCol : displayCol;
            return renderSquare(row, col);
          });
        })}
      </div>
    </div>
  );
};
