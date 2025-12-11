import { ChessEngine } from './ChessEngine';
import {
  Position,
  Move,
  PieceColor,
  PIECE_VALUES,
  PAWN_TABLE,
  KNIGHT_TABLE,
  BISHOP_TABLE,
  ROOK_TABLE,
  QUEEN_TABLE,
  KING_TABLE,
} from './types';

export class ChessAI {
  private engine: ChessEngine;
  private depth: number;
  private nodesEvaluated: number = 0;

  constructor(engine: ChessEngine, depth: number = 3) {
    this.engine = engine;
    this.depth = depth;
  }

  public setDepth(depth: number): void {
    this.depth = depth;
  }

  public getNodesEvaluated(): number {
    return this.nodesEvaluated;
  }

  public getBestMove(color: PieceColor): { from: Position; to: Position } | null {
    this.nodesEvaluated = 0;
    const startTime = Date.now();

    let bestMove: { from: Position; to: Position } | null = null;
    let bestScore = -Infinity;
    let alpha = -Infinity;
    const beta = Infinity;

    // Get all possible moves
    const moves = this.getAllPossibleMoves(color);
    
    // Order moves (captures first for better pruning)
    const orderedMoves = this.orderMoves(moves);

    for (const move of orderedMoves) {
      // Make move
      const success = this.engine.makeMove(move.from, move.to);
      if (!success) continue;

      // Evaluate position
      const score = -this.minimax(this.depth - 1, -beta, -alpha, color === 'white' ? 'black' : 'white');

      // Undo move
      this.engine.undoMove();

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }

      alpha = Math.max(alpha, score);
    }

    const endTime = Date.now();
    console.log(`AI evaluated ${this.nodesEvaluated} nodes in ${endTime - startTime}ms`);
    console.log(`Best move score: ${bestScore}`);

    return bestMove;
  }

  private minimax(depth: number, alpha: number, beta: number, color: PieceColor): number {
    this.nodesEvaluated++;

    const state = this.engine.getState();

    // Terminal conditions
    if (state.isCheckmate) {
      return -20000 + (this.depth - depth); // Prefer faster checkmates
    }
    if (state.isStalemate) {
      return 0;
    }
    if (depth === 0) {
      return this.evaluatePosition(color);
    }

    const moves = this.getAllPossibleMoves(color);
    if (moves.length === 0) {
      return this.evaluatePosition(color);
    }

    // Order moves for better pruning
    const orderedMoves = this.orderMoves(moves);

    let maxScore = -Infinity;

    for (const move of orderedMoves) {
      const success = this.engine.makeMove(move.from, move.to);
      if (!success) continue;

      const score = -this.minimax(depth - 1, -beta, -alpha, color === 'white' ? 'black' : 'white');

      this.engine.undoMove();

      maxScore = Math.max(maxScore, score);
      alpha = Math.max(alpha, score);

      // Alpha-beta pruning
      if (alpha >= beta) {
        break;
      }
    }

    return maxScore;
  }

  private evaluatePosition(color: PieceColor): number {
    const state = this.engine.getState();
    let score = 0;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = state.board[row][col];
        if (!piece) continue;

        const pieceValue = this.evaluatePiece(piece.type, piece.color, row, col);
        
        if (piece.color === color) {
          score += pieceValue;
        } else {
          score -= pieceValue;
        }
      }
    }

    // Add mobility bonus (number of legal moves)
    const mobility = this.getAllPossibleMoves(color).length;
    const opponentMobility = this.getAllPossibleMoves(color === 'white' ? 'black' : 'white').length;
    score += (mobility - opponentMobility) * 10;

    return score;
  }

  private evaluatePiece(type: string, color: PieceColor, row: number, col: number): number {
    let value = PIECE_VALUES[type as keyof typeof PIECE_VALUES] || 0;

    // Add positional bonus from piece-square tables
    const tableRow = color === 'white' ? 7 - row : row;
    
    switch (type) {
      case 'pawn':
        value += PAWN_TABLE[tableRow][col];
        break;
      case 'knight':
        value += KNIGHT_TABLE[tableRow][col];
        break;
      case 'bishop':
        value += BISHOP_TABLE[tableRow][col];
        break;
      case 'rook':
        value += ROOK_TABLE[tableRow][col];
        break;
      case 'queen':
        value += QUEEN_TABLE[tableRow][col];
        break;
      case 'king':
        value += KING_TABLE[tableRow][col];
        break;
    }

    return value;
  }

  private getAllPossibleMoves(color: PieceColor): { from: Position; to: Position }[] {
    const moves: { from: Position; to: Position }[] = [];
    const state = this.engine.getState();

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = state.board[row][col];
        if (piece && piece.color === color) {
          const from = { row, col };
          const legalMoves = this.engine.getLegalMoves(from);
          
          for (const to of legalMoves) {
            moves.push({ from, to });
          }
        }
      }
    }

    return moves;
  }

  private orderMoves(moves: { from: Position; to: Position }[]): { from: Position; to: Position }[] {
    const state = this.engine.getState();
    
    // Score each move for ordering
    const scoredMoves = moves.map(move => {
      let score = 0;
      
      const movingPiece = state.board[move.from.row][move.from.col];
      const targetPiece = state.board[move.to.row][move.to.col];
      
      // Prioritize captures
      if (targetPiece) {
        // MVV-LVA (Most Valuable Victim - Least Valuable Attacker)
        const victimValue = PIECE_VALUES[targetPiece.type] || 0;
        const attackerValue = PIECE_VALUES[movingPiece?.type || 'pawn'] || 0;
        score += victimValue - attackerValue / 10;
      }
      
      // Prioritize center control
      const centerDistance = Math.abs(move.to.row - 3.5) + Math.abs(move.to.col - 3.5);
      score -= centerDistance;
      
      return { move, score };
    });

    // Sort by score (highest first)
    scoredMoves.sort((a, b) => b.score - a.score);
    
    return scoredMoves.map(sm => sm.move);
  }
}
