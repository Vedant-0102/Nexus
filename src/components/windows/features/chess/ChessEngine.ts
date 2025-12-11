import {
  Piece,
  PieceColor,
  PieceType,
  Position,
  Move,
  GameState,
} from './types';

export class ChessEngine {
  private state: GameState;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    const board: (Piece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));

    // Setup black pieces
    board[0] = [
      { type: 'rook', color: 'black' },
      { type: 'knight', color: 'black' },
      { type: 'bishop', color: 'black' },
      { type: 'queen', color: 'black' },
      { type: 'king', color: 'black' },
      { type: 'bishop', color: 'black' },
      { type: 'knight', color: 'black' },
      { type: 'rook', color: 'black' },
    ];
    board[1] = Array(8).fill(null).map(() => ({ type: 'pawn' as PieceType, color: 'black' as PieceColor }));

    // Setup white pieces
    board[6] = Array(8).fill(null).map(() => ({ type: 'pawn' as PieceType, color: 'white' as PieceColor }));
    board[7] = [
      { type: 'rook', color: 'white' },
      { type: 'knight', color: 'white' },
      { type: 'bishop', color: 'white' },
      { type: 'queen', color: 'white' },
      { type: 'king', color: 'white' },
      { type: 'bishop', color: 'white' },
      { type: 'knight', color: 'white' },
      { type: 'rook', color: 'white' },
    ];

    return {
      board,
      currentPlayer: 'white',
      moveHistory: [],
      isCheck: false,
      isCheckmate: false,
      isStalemate: false,
      canCastleKingside: { white: true, black: true },
      canCastleQueenside: { white: true, black: true },
      enPassantTarget: null,
    };
  }

  public getState(): GameState {
    return JSON.parse(JSON.stringify(this.state)); // Deep copy
  }

  public getPiece(pos: Position): Piece | null {
    return this.state.board[pos.row][pos.col];
  }

  public isValidPosition(pos: Position): boolean {
    return pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8;
  }

  public getLegalMoves(pos: Position): Position[] {
    const piece = this.getPiece(pos);
    if (!piece || piece.color !== this.state.currentPlayer) {
      return [];
    }

    const pseudoLegalMoves = this.getPseudoLegalMoves(pos, piece);
    
    // Filter out moves that would leave king in check
    return pseudoLegalMoves.filter(to => {
      const testState = this.makeTestMove(pos, to);
      return !this.isKingInCheck(testState, piece.color);
    });
  }

  private getPseudoLegalMoves(pos: Position, piece: Piece, includeCastling: boolean = true): Position[] {
    switch (piece.type) {
      case 'pawn':
        return this.getPawnMoves(pos, piece.color);
      case 'knight':
        return this.getKnightMoves(pos, piece.color);
      case 'bishop':
        return this.getBishopMoves(pos, piece.color);
      case 'rook':
        return this.getRookMoves(pos, piece.color);
      case 'queen':
        return this.getQueenMoves(pos, piece.color);
      case 'king':
        return this.getKingMoves(pos, piece.color, includeCastling);
      default:
        return [];
    }
  }

  private getPawnMoves(pos: Position, color: PieceColor): Position[] {
    const moves: Position[] = [];
    const direction = color === 'white' ? -1 : 1;
    const startRow = color === 'white' ? 6 : 1;

    // Forward move
    const forward = { row: pos.row + direction, col: pos.col };
    if (this.isValidPosition(forward) && !this.getPiece(forward)) {
      moves.push(forward);

      // Double move from start
      if (pos.row === startRow) {
        const doubleForward = { row: pos.row + 2 * direction, col: pos.col };
        if (!this.getPiece(doubleForward)) {
          moves.push(doubleForward);
        }
      }
    }

    // Captures
    for (const colOffset of [-1, 1]) {
      const capture = { row: pos.row + direction, col: pos.col + colOffset };
      if (this.isValidPosition(capture)) {
        const target = this.getPiece(capture);
        if (target && target.color !== color) {
          moves.push(capture);
        }
        // En passant
        if (this.state.enPassantTarget &&
            capture.row === this.state.enPassantTarget.row &&
            capture.col === this.state.enPassantTarget.col) {
          moves.push(capture);
        }
      }
    }

    return moves;
  }

  private getKnightMoves(pos: Position, color: PieceColor): Position[] {
    const moves: Position[] = [];
    const offsets = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];

    for (const [rowOffset, colOffset] of offsets) {
      const newPos = { row: pos.row + rowOffset, col: pos.col + colOffset };
      if (this.isValidPosition(newPos)) {
        const target = this.getPiece(newPos);
        if (!target || target.color !== color) {
          moves.push(newPos);
        }
      }
    }

    return moves;
  }

  private getBishopMoves(pos: Position, color: PieceColor): Position[] {
    return this.getSlidingMoves(pos, color, [[-1, -1], [-1, 1], [1, -1], [1, 1]]);
  }

  private getRookMoves(pos: Position, color: PieceColor): Position[] {
    return this.getSlidingMoves(pos, color, [[-1, 0], [1, 0], [0, -1], [0, 1]]);
  }

  private getQueenMoves(pos: Position, color: PieceColor): Position[] {
    return this.getSlidingMoves(pos, color, [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1], [0, 1],
      [1, -1], [1, 0], [1, 1]
    ]);
  }

  private getSlidingMoves(pos: Position, color: PieceColor, directions: number[][]): Position[] {
    const moves: Position[] = [];

    for (const [rowDir, colDir] of directions) {
      let newRow = pos.row + rowDir;
      let newCol = pos.col + colDir;

      while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const target = this.getPiece({ row: newRow, col: newCol });
        
        if (!target) {
          moves.push({ row: newRow, col: newCol });
        } else {
          if (target.color !== color) {
            moves.push({ row: newRow, col: newCol });
          }
          break;
        }

        newRow += rowDir;
        newCol += colDir;
      }
    }

    return moves;
  }

  private getKingMoves(pos: Position, color: PieceColor, includeCastling: boolean = true): Position[] {
    const moves: Position[] = [];
    const offsets = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1], [0, 1],
      [1, -1], [1, 0], [1, 1]
    ];

    for (const [rowOffset, colOffset] of offsets) {
      const newPos = { row: pos.row + rowOffset, col: pos.col + colOffset };
      if (this.isValidPosition(newPos)) {
        const target = this.getPiece(newPos);
        if (!target || target.color !== color) {
          moves.push(newPos);
        }
      }
    }

    // Castling - only check when not being called from isKingInCheck to avoid infinite recursion
    if (includeCastling && !this.isKingInCheck(this.state, color)) {
      // Kingside
      if (this.state.canCastleKingside[color]) {
        const row = color === 'white' ? 7 : 0;
        if (!this.getPiece({ row, col: 5 }) && !this.getPiece({ row, col: 6 })) {
          moves.push({ row, col: 6 });
        }
      }
      // Queenside
      if (this.state.canCastleQueenside[color]) {
        const row = color === 'white' ? 7 : 0;
        if (!this.getPiece({ row, col: 1 }) && !this.getPiece({ row, col: 2 }) && !this.getPiece({ row, col: 3 })) {
          moves.push({ row, col: 2 });
        }
      }
    }

    return moves;
  }

  private makeTestMove(from: Position, to: Position): GameState {
    const testState = JSON.parse(JSON.stringify(this.state));
    testState.board[to.row][to.col] = testState.board[from.row][from.col];
    testState.board[from.row][from.col] = null;
    return testState;
  }

  private isKingInCheck(state: GameState, color: PieceColor): boolean {
    // Find king position
    let kingPos: Position | null = null;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = state.board[row][col];
        if (piece && piece.type === 'king' && piece.color === color) {
          kingPos = { row, col };
          break;
        }
      }
      if (kingPos) break;
    }

    if (!kingPos) return false;

    // Check if any opponent piece can attack the king
    const opponentColor = color === 'white' ? 'black' : 'white';
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = state.board[row][col];
        if (piece && piece.color === opponentColor) {
          const tempState = this.state;
          this.state = state;
          // Don't include castling moves when checking for check to avoid infinite recursion
          const moves = this.getPseudoLegalMoves({ row, col }, piece, false);
          this.state = tempState;
          
          if (moves.some(m => m.row === kingPos!.row && m.col === kingPos!.col)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  public makeMove(from: Position, to: Position): boolean {
    const piece = this.getPiece(from);
    if (!piece || piece.color !== this.state.currentPlayer) {
      return false;
    }

    const legalMoves = this.getLegalMoves(from);
    if (!legalMoves.some(m => m.row === to.row && m.col === to.col)) {
      return false;
    }

    // Execute move
    const captured = this.getPiece(to);
    const move: Move = {
      from,
      to,
      piece,
      captured: captured || undefined,
    };

    // Handle special moves
    if (piece.type === 'pawn') {
      // En passant
      if (this.state.enPassantTarget && to.row === this.state.enPassantTarget.row && to.col === this.state.enPassantTarget.col) {
        const captureRow = piece.color === 'white' ? to.row + 1 : to.row - 1;
        move.captured = this.getPiece({ row: captureRow, col: to.col }) || undefined;
        this.state.board[captureRow][to.col] = null;
        move.isEnPassant = true;
      }

      // Set en passant target
      if (Math.abs(to.row - from.row) === 2) {
        this.state.enPassantTarget = {
          row: (from.row + to.row) / 2,
          col: from.col
        };
      } else {
        this.state.enPassantTarget = null;
      }

      // Promotion
      if (to.row === 0 || to.row === 7) {
        piece.type = 'queen'; // Auto-promote to queen
        move.isPromotion = true;
        move.promotionPiece = 'queen';
      }
    } else {
      this.state.enPassantTarget = null;
    }

    // Handle castling
    if (piece.type === 'king' && Math.abs(to.col - from.col) === 2) {
      move.isCastling = true;
      const row = from.row;
      if (to.col === 6) { // Kingside
        this.state.board[row][5] = this.state.board[row][7];
        this.state.board[row][7] = null;
      } else { // Queenside
        this.state.board[row][3] = this.state.board[row][0];
        this.state.board[row][0] = null;
      }
    }

    // Update castling rights
    if (piece.type === 'king') {
      this.state.canCastleKingside[piece.color] = false;
      this.state.canCastleQueenside[piece.color] = false;
    }
    if (piece.type === 'rook') {
      if (from.col === 0) {
        this.state.canCastleQueenside[piece.color] = false;
      } else if (from.col === 7) {
        this.state.canCastleKingside[piece.color] = false;
      }
    }

    // Make the move
    this.state.board[to.row][to.col] = piece;
    this.state.board[from.row][from.col] = null;
    this.state.moveHistory.push(move);

    // Switch player
    this.state.currentPlayer = this.state.currentPlayer === 'white' ? 'black' : 'white';

    // Check game state
    this.updateGameState();

    return true;
  }

  private updateGameState(): void {
    const color = this.state.currentPlayer;
    this.state.isCheck = this.isKingInCheck(this.state, color);

    // Check for checkmate or stalemate
    let hasLegalMoves = false;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.getPiece({ row, col });
        if (piece && piece.color === color) {
          if (this.getLegalMoves({ row, col }).length > 0) {
            hasLegalMoves = true;
            break;
          }
        }
      }
      if (hasLegalMoves) break;
    }

    if (!hasLegalMoves) {
      if (this.state.isCheck) {
        this.state.isCheckmate = true;
      } else {
        this.state.isStalemate = true;
      }
    }
  }

  public undoMove(): boolean {
    if (this.state.moveHistory.length === 0) {
      return false;
    }

    const move = this.state.moveHistory.pop()!;
    
    // Restore piece
    this.state.board[move.from.row][move.from.col] = move.piece;
    this.state.board[move.to.row][move.to.col] = move.captured || null;

    // Handle special moves
    if (move.isEnPassant) {
      const captureRow = move.piece.color === 'white' ? move.to.row + 1 : move.to.row - 1;
      this.state.board[captureRow][move.to.col] = move.captured || null;
      this.state.board[move.to.row][move.to.col] = null;
    }

    if (move.isCastling) {
      const row = move.from.row;
      if (move.to.col === 6) { // Kingside
        this.state.board[row][7] = this.state.board[row][5];
        this.state.board[row][5] = null;
      } else { // Queenside
        this.state.board[row][0] = this.state.board[row][3];
        this.state.board[row][3] = null;
      }
    }

    if (move.isPromotion) {
      move.piece.type = 'pawn';
    }

    // Switch player back
    this.state.currentPlayer = this.state.currentPlayer === 'white' ? 'black' : 'white';

    // Reset game state flags
    this.state.isCheck = false;
    this.state.isCheckmate = false;
    this.state.isStalemate = false;

    // Note: Castling rights and en passant target are not perfectly restored
    // For a complete undo, we'd need to store these in the move history

    return true;
  }

  public reset(): void {
    this.state = this.createInitialState();
  }
}
