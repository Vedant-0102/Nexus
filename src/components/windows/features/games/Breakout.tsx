import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCw, Trophy } from 'lucide-react';

export const Breakout: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const stateRef = useRef({
    paddle: { x: 0.4, width: 0.20, height: 0.025 },
    ball: { x: 0.5, y: 0.9, dx: 0.006, dy: -0.006, radius: 0.012 },
    bricks: [] as { x: number; y: number; w: number; h: number; status: number; row: number }[],
    keys: { left: false, right: false },
    mouseX: 0.5,
    lives: 3,
    score: 0,
    isPaused: false,
    gameOver: false,
    gameStarted: false,
    won: false,
  });

  const BRICK_ROWS = 6;
  const BRICK_COLS = 10;
  const BRICK_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];
  const PADDLE_Y = 0.93;

  const initBricks = useCallback(() => {
    const bricks: typeof stateRef.current.bricks = [];
    const padding = 0.008;
    const topOffset = 0.06;
    const brickW = (1 - padding * (BRICK_COLS + 1)) / BRICK_COLS;
    const brickH = 0.03;

    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        bricks.push({
          x: padding + col * (brickW + padding),
          y: topOffset + row * (brickH + padding),
          w: brickW,
          h: brickH,
          status: 1,
          row,
        });
      }
    }
    stateRef.current.bricks = bricks;
  }, []);

  const resetBall = useCallback(() => {
    const s = stateRef.current;
    s.ball.x = s.paddle.x + s.paddle.width / 2;
    s.ball.y = PADDLE_Y - 0.02;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
    const speed = 0.007;
    s.ball.dx = Math.cos(angle) * speed;
    s.ball.dy = Math.sin(angle) * speed;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const s = stateRef.current;

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0f0f23');
    bg.addColorStop(1, '#1a1a3e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Grid lines for aesthetic
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < W; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, H);
      ctx.stroke();
    }
    for (let i = 0; i < H; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(W, i);
      ctx.stroke();
    }

    // Bricks
    s.bricks.forEach(brick => {
      if (brick.status !== 1) return;
      const bx = brick.x * W;
      const by = brick.y * H;
      const bw = brick.w * W;
      const bh = brick.h * H;

      ctx.fillStyle = BRICK_COLORS[brick.row % BRICK_COLORS.length];
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 3);
      ctx.fill();

      // Shine
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(bx + 2, by + 1, bw - 4, bh * 0.4);
    });

    // Paddle
    const px = s.paddle.x * W;
    const py = PADDLE_Y * H;
    const pw = s.paddle.width * W;
    const ph = s.paddle.height * H;

    const paddleGrad = ctx.createLinearGradient(px, py, px, py + ph);
    paddleGrad.addColorStop(0, '#60a5fa');
    paddleGrad.addColorStop(1, '#2563eb');
    ctx.fillStyle = paddleGrad;
    ctx.beginPath();
    ctx.roundRect(px, py, pw, ph, ph / 2);
    ctx.fill();

    // Ball
    const bx = s.ball.x * W;
    const by = s.ball.y * H;
    const br = s.ball.radius * Math.min(W, H);

    ctx.fillStyle = '#FFF';
    ctx.shadowColor = '#60a5fa';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Ball trail glow
    ctx.fillStyle = 'rgba(96, 165, 250, 0.3)';
    ctx.beginPath();
    ctx.arc(bx, by, br * 1.8, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const update = useCallback(() => {
    const s = stateRef.current;
    if (s.isPaused || s.gameOver || !s.gameStarted) return;

    // Paddle mouse follow - direct tracking
    const target = s.mouseX - s.paddle.width / 2;
    s.paddle.x += (target - s.paddle.x) * 0.5;

    // Keyboard
    const pSpeed = 0.025;
    if (s.keys.left) s.paddle.x -= pSpeed;
    if (s.keys.right) s.paddle.x += pSpeed;
    s.paddle.x = Math.max(0, Math.min(1 - s.paddle.width, s.paddle.x));

    // Ball movement
    s.ball.x += s.ball.dx;
    s.ball.y += s.ball.dy;

    // Wall collisions
    if (s.ball.x + s.ball.radius > 1 || s.ball.x - s.ball.radius < 0) {
      s.ball.dx = -s.ball.dx;
      s.ball.x = Math.max(s.ball.radius, Math.min(1 - s.ball.radius, s.ball.x));
    }
    if (s.ball.y - s.ball.radius < 0) {
      s.ball.dy = Math.abs(s.ball.dy);
    }

    // Paddle collision
    if (
      s.ball.dy > 0 &&
      s.ball.y + s.ball.radius > PADDLE_Y &&
      s.ball.y - s.ball.radius < PADDLE_Y + s.paddle.height &&
      s.ball.x > s.paddle.x &&
      s.ball.x < s.paddle.x + s.paddle.width
    ) {
      const hitPos = (s.ball.x - (s.paddle.x + s.paddle.width / 2)) / (s.paddle.width / 2);
      const speed = Math.sqrt(s.ball.dx * s.ball.dx + s.ball.dy * s.ball.dy);
      const newSpeed = Math.min(speed * 1.01, 0.015); // gradually speed up
      const angle = hitPos * (Math.PI / 3); // max 60 degree angle
      s.ball.dx = Math.sin(angle) * newSpeed;
      s.ball.dy = -Math.cos(angle) * newSpeed;
      s.ball.y = PADDLE_Y - s.ball.radius;
    }

    // Ball out of bounds
    if (s.ball.y > 1 + s.ball.radius) {
      s.lives--;
      setLives(s.lives);
      if (s.lives <= 0) {
        s.gameOver = true;
        setGameOver(true);
      } else {
        resetBall();
      }
    }

    // Brick collisions
    let allCleared = true;
    s.bricks.forEach(brick => {
      if (brick.status !== 1) return;
      allCleared = false;

      if (
        s.ball.x + s.ball.radius > brick.x &&
        s.ball.x - s.ball.radius < brick.x + brick.w &&
        s.ball.y + s.ball.radius > brick.y &&
        s.ball.y - s.ball.radius < brick.y + brick.h
      ) {
        // Determine which side was hit
        const overlapLeft = (s.ball.x + s.ball.radius) - brick.x;
        const overlapRight = (brick.x + brick.w) - (s.ball.x - s.ball.radius);
        const overlapTop = (s.ball.y + s.ball.radius) - brick.y;
        const overlapBottom = (brick.y + brick.h) - (s.ball.y - s.ball.radius);

        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
        if (minOverlap === overlapTop || minOverlap === overlapBottom) {
          s.ball.dy = -s.ball.dy;
        } else {
          s.ball.dx = -s.ball.dx;
        }

        brick.status = 0;
        s.score += (BRICK_ROWS - brick.row) * 10;
        setScore(s.score);
      }
    });

    if (allCleared && s.bricks.length > 0) {
      s.won = true;
      s.gameOver = true;
      setWon(true);
      setGameOver(true);
    }
  }, [resetBall]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId: number;
    const loop = () => {
      update();
      draw();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animId);
  }, [update, draw]);

  // Resize
  useEffect(() => {
    const updateSize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const rect = container.getBoundingClientRect();
      const aspect = 4 / 5;
      let w = rect.width;
      let h = w / aspect;
      if (h > rect.height) {
        h = rect.height;
        w = h * aspect;
      }
      canvas.width = Math.floor(w);
      canvas.height = Math.floor(h);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Input handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') stateRef.current.keys.left = true;
      if (e.key === 'ArrowRight') stateRef.current.keys.right = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') stateRef.current.keys.left = false;
      if (e.key === 'ArrowRight') stateRef.current.keys.right = false;
    };
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      stateRef.current.mouseX = (e.clientX - rect.left) / rect.width;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('mousemove', onMouseMove);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  // Init
  useEffect(() => {
    initBricks();
    resetBall();
  }, [initBricks, resetBall]);

  // Sync pause state to ref
  useEffect(() => {
    stateRef.current.isPaused = isPaused;
  }, [isPaused]);

  const resetGame = useCallback(() => {
    const s = stateRef.current;
    s.score = 0;
    s.lives = 3;
    s.gameOver = false;
    s.won = false;
    s.gameStarted = true;
    s.isPaused = false;
    initBricks();
    resetBall();
    s.paddle.x = 0.4;
    setScore(0);
    setLives(3);
    setGameOver(false);
    setWon(false);
    setIsPaused(false);
    setGameStarted(true);
  }, [initBricks, resetBall]);

  const startGame = useCallback(() => {
    stateRef.current.gameStarted = true;
    setGameStarted(true);
  }, []);

  return (
    <div className="h-full w-full flex flex-col bg-gradient-to-br from-gray-950 to-indigo-950 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0 border-b border-indigo-900/40">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-indigo-300 tracking-wider">BREAKOUT</h1>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-400">Score:</span>
            <span className="text-white font-bold tabular-nums">{score}</span>
            <span className="text-gray-600">|</span>
            <span className="text-gray-400">Lives:</span>
            <div className="flex gap-0.5">
              {Array.from({ length: lives }).map((_, i) => (
                <div key={i} className="w-2.5 h-2.5 bg-red-500 rounded-full" />
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {gameStarted && !gameOver && (
            <Button
              onClick={() => setIsPaused(!isPaused)}
              variant="outline"
              size="sm"
              className="border-indigo-800 text-gray-300"
            >
              {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            </Button>
          )}
          <Button onClick={resetGame} variant="outline" size="sm" className="border-indigo-800 text-gray-300">
            <RotateCw className="h-3.5 w-3.5 mr-1.5" />
            Reset
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center min-h-0 p-3">
        <div className="relative" style={{ aspectRatio: '4/5' }}>
          <canvas
            ref={canvasRef}
            className="w-full h-full rounded-xl border-2 border-indigo-800/40 cursor-none"
          />

          {!gameStarted && !gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-xl backdrop-blur-sm">
              <div className="text-center p-6">
                <h2 className="text-2xl font-bold text-indigo-300 mb-2">BREAKOUT</h2>
                <p className="text-sm text-gray-400 mb-4">Mouse or Arrow keys to move paddle</p>
                <Button onClick={startGame} size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  Start Game
                </Button>
              </div>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-xl backdrop-blur-sm">
              <div className="text-center p-6">
                <Trophy className="h-10 w-10 mx-auto mb-2 text-yellow-400" />
                <h2 className="text-2xl font-bold text-white mb-1">
                  {won ? 'You Win!' : 'Game Over'}
                </h2>
                <p className="text-xl font-bold text-indigo-400 mb-3">{score}</p>
                <Button onClick={resetGame} size="sm" className="w-full">
                  Play Again
                </Button>
              </div>
            </div>
          )}

          {isPaused && !gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl backdrop-blur-sm">
              <p className="text-2xl font-bold text-indigo-300">PAUSED</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
