import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCw, Trophy } from 'lucide-react';

interface PowerUp {
  x: number;
  y: number;
  type: 'wide' | 'multi' | 'life' | 'fire';
  vy: number;
}

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  fire: boolean;
}

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
    balls: [{ x: 0.5, y: 0.9, dx: 0.012, dy: -0.012, radius: 0.012, fire: false }] as Ball[],
    bricks: [] as { x: number; y: number; w: number; h: number; status: number; row: number }[],
    powerUps: [] as PowerUp[],
    keys: { left: false, right: false },
    mouseX: 0.5,
    lives: 3,
    score: 0,
    isPaused: false,
    gameOver: false,
    gameStarted: false,
    won: false,
    activeEffects: {
      wide: 0,
      fire: 0,
    },
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }[],
  });

  const BRICK_ROWS = 6;
  const BRICK_COLS = 10;
  const BRICK_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];
  const PADDLE_Y = 0.93;
  const BASE_SPEED = 0.014;
  const MAX_SPEED = 0.022;
  const POWERUP_CHANCE = 0.25;

  const POWERUP_COLORS: Record<string, string> = {
    wide: '#3b82f6',
    multi: '#f97316',
    life: '#ef4444',
    fire: '#fbbf24',
  };
  const POWERUP_LABELS: Record<string, string> = {
    wide: 'W',
    multi: 'M',
    life: '+',
    fire: 'F',
  };

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
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
    s.balls = [{
      x: s.paddle.x + s.paddle.width / 2,
      y: PADDLE_Y - 0.02,
      dx: Math.cos(angle) * BASE_SPEED,
      dy: Math.sin(angle) * BASE_SPEED,
      radius: 0.012,
      fire: false,
    }];
  }, []);

  const spawnParticles = useCallback((x: number, y: number, color: string, count: number) => {
    const s = stateRef.current;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.002 + Math.random() * 0.006;
      s.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 15 + Math.random() * 20,
        color,
        size: 0.004 + Math.random() * 0.006,
      });
    }
  }, []);

  const spawnPowerUp = useCallback((x: number, y: number) => {
    if (Math.random() > POWERUP_CHANCE) return;
    const types: PowerUp['type'][] = ['wide', 'multi', 'life', 'fire'];
    const weights = [0.3, 0.3, 0.15, 0.25];
    let r = Math.random();
    let type: PowerUp['type'] = 'wide';
    for (let i = 0; i < types.length; i++) {
      r -= weights[i];
      if (r <= 0) { type = types[i]; break; }
    }
    stateRef.current.powerUps.push({ x, y, type, vy: 0.005 });
  }, []);

  const applyPowerUp = useCallback((type: PowerUp['type']) => {
    const s = stateRef.current;
    switch (type) {
      case 'wide':
        s.activeEffects.wide = 600; // ~10s at 60fps
        s.paddle.width = 0.30;
        break;
      case 'multi': {
        const newBalls: Ball[] = [];
        for (const ball of s.balls) {
          const spread = 0.8;
          newBalls.push({
            ...ball,
            dx: ball.dx * Math.cos(spread) - ball.dy * Math.sin(spread),
            dy: ball.dx * Math.sin(spread) + ball.dy * Math.cos(spread),
          });
          newBalls.push({
            ...ball,
            dx: ball.dx * Math.cos(-spread) - ball.dy * Math.sin(-spread),
            dy: ball.dx * Math.sin(-spread) + ball.dy * Math.cos(-spread),
          });
        }
        s.balls.push(...newBalls);
        break;
      }
      case 'life':
        s.lives = Math.min(s.lives + 1, 5);
        setLives(s.lives);
        break;
      case 'fire':
        s.activeEffects.fire = 480; // ~8s
        for (const ball of s.balls) ball.fire = true;
        break;
    }
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

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < W; i += 40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke();
    }
    for (let i = 0; i < H; i += 40) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke();
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

      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(bx + 2, by + 1, bw - 4, bh * 0.4);
    });

    // Power-ups
    for (const pu of s.powerUps) {
      const px = pu.x * W;
      const py = pu.y * H;
      const pw = 20;
      const ph = 20;

      ctx.fillStyle = POWERUP_COLORS[pu.type];
      ctx.shadowColor = POWERUP_COLORS[pu.type];
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(px - pw / 2, py - ph / 2, pw, ph, 4);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(POWERUP_LABELS[pu.type], px, py);
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';
    }

    // Paddle
    const paddleX = s.paddle.x * W;
    const py = PADDLE_Y * H;
    const pw = s.paddle.width * W;
    const ph = s.paddle.height * H;

    const paddleGrad = ctx.createLinearGradient(paddleX, py, paddleX, py + ph);
    if (s.activeEffects.wide > 0) {
      paddleGrad.addColorStop(0, '#38bdf8');
      paddleGrad.addColorStop(1, '#0284c7');
    } else {
      paddleGrad.addColorStop(0, '#60a5fa');
      paddleGrad.addColorStop(1, '#2563eb');
    }
    ctx.fillStyle = paddleGrad;
    ctx.beginPath();
    ctx.roundRect(paddleX, py, pw, ph, ph / 2);
    ctx.fill();

    // Active effect timers on paddle
    if (s.activeEffects.wide > 0) {
      const ratio = s.activeEffects.wide / 600;
      ctx.fillStyle = 'rgba(56,189,248,0.4)';
      ctx.fillRect(paddleX, py + ph + 2, pw * ratio, 2);
    }
    if (s.activeEffects.fire > 0) {
      const ratio = s.activeEffects.fire / 480;
      ctx.fillStyle = 'rgba(251,191,36,0.4)';
      ctx.fillRect(paddleX, py + ph + 5, pw * ratio, 2);
    }

    // Balls
    for (const ball of s.balls) {
      const bx = ball.x * W;
      const by = ball.y * H;
      const br = ball.radius * Math.min(W, H);

      if (ball.fire) {
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 16;
      } else {
        ctx.fillStyle = '#FFF';
        ctx.shadowColor = '#60a5fa';
        ctx.shadowBlur = 12;
      }
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Trail glow
      ctx.fillStyle = ball.fire ? 'rgba(249, 115, 22, 0.3)' : 'rgba(96, 165, 250, 0.3)';
      ctx.beginPath();
      ctx.arc(bx, by, br * 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Particles
    for (const p of s.particles) {
      ctx.globalAlpha = Math.max(0, p.life / 30);
      ctx.fillStyle = p.color;
      const ps = p.size * Math.min(W, H);
      ctx.fillRect(p.x * W - ps / 2, p.y * H - ps / 2, ps, ps);
    }
    ctx.globalAlpha = 1;
  }, []);

  const update = useCallback(() => {
    const s = stateRef.current;
    if (s.isPaused || s.gameOver || !s.gameStarted) return;

    // Paddle mouse follow
    const target = s.mouseX - s.paddle.width / 2;
    s.paddle.x += (target - s.paddle.x) * 0.5;

    // Keyboard
    const pSpeed = 0.025;
    if (s.keys.left) s.paddle.x -= pSpeed;
    if (s.keys.right) s.paddle.x += pSpeed;
    s.paddle.x = Math.max(0, Math.min(1 - s.paddle.width, s.paddle.x));

    // Tick active effects
    if (s.activeEffects.wide > 0) {
      s.activeEffects.wide--;
      if (s.activeEffects.wide <= 0) {
        s.paddle.width = 0.20;
      }
    }
    if (s.activeEffects.fire > 0) {
      s.activeEffects.fire--;
      if (s.activeEffects.fire <= 0) {
        for (const ball of s.balls) ball.fire = false;
      }
    }

    // Update power-ups
    for (let i = s.powerUps.length - 1; i >= 0; i--) {
      const pu = s.powerUps[i];
      pu.y += pu.vy;

      // Check paddle catch
      const puSize = 0.025;
      if (
        pu.y + puSize > PADDLE_Y &&
        pu.y - puSize < PADDLE_Y + s.paddle.height &&
        pu.x > s.paddle.x &&
        pu.x < s.paddle.x + s.paddle.width
      ) {
        applyPowerUp(pu.type);
        spawnParticles(pu.x, pu.y, POWERUP_COLORS[pu.type], 8);
        s.powerUps.splice(i, 1);
        continue;
      }

      // Off screen
      if (pu.y > 1.1) {
        s.powerUps.splice(i, 1);
      }
    }

    // Update balls
    for (let bi = s.balls.length - 1; bi >= 0; bi--) {
      const ball = s.balls[bi];

      ball.x += ball.dx;
      ball.y += ball.dy;

      // Wall collisions
      if (ball.x + ball.radius > 1 || ball.x - ball.radius < 0) {
        ball.dx = -ball.dx;
        ball.x = Math.max(ball.radius, Math.min(1 - ball.radius, ball.x));
      }
      if (ball.y - ball.radius < 0) {
        ball.dy = Math.abs(ball.dy);
      }

      // Paddle collision
      if (
        ball.dy > 0 &&
        ball.y + ball.radius > PADDLE_Y &&
        ball.y - ball.radius < PADDLE_Y + s.paddle.height &&
        ball.x > s.paddle.x &&
        ball.x < s.paddle.x + s.paddle.width
      ) {
        const hitPos = (ball.x - (s.paddle.x + s.paddle.width / 2)) / (s.paddle.width / 2);
        const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        const newSpeed = Math.min(speed * 1.01, MAX_SPEED);
        const angle = hitPos * (Math.PI / 3);
        ball.dx = Math.sin(angle) * newSpeed;
        ball.dy = -Math.cos(angle) * newSpeed;
        ball.y = PADDLE_Y - ball.radius;
      }

      // Ball out of bounds
      if (ball.y > 1 + ball.radius) {
        s.balls.splice(bi, 1);
        if (s.balls.length === 0) {
          s.lives--;
          setLives(s.lives);
          if (s.lives <= 0) {
            s.gameOver = true;
            setGameOver(true);
          } else {
            resetBall();
          }
        }
        continue;
      }

      // Brick collisions
      s.bricks.forEach(brick => {
        if (brick.status !== 1) return;

        if (
          ball.x + ball.radius > brick.x &&
          ball.x - ball.radius < brick.x + brick.w &&
          ball.y + ball.radius > brick.y &&
          ball.y - ball.radius < brick.y + brick.h
        ) {
          // Fireball plows through without bouncing
          if (!ball.fire) {
            const overlapLeft = (ball.x + ball.radius) - brick.x;
            const overlapRight = (brick.x + brick.w) - (ball.x - ball.radius);
            const overlapTop = (ball.y + ball.radius) - brick.y;
            const overlapBottom = (brick.y + brick.h) - (ball.y - ball.radius);

            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
            if (minOverlap === overlapTop || minOverlap === overlapBottom) {
              ball.dy = -ball.dy;
            } else {
              ball.dx = -ball.dx;
            }
          }

          brick.status = 0;
          const pts = (BRICK_ROWS - brick.row) * 10;
          s.score += pts;
          setScore(s.score);
          spawnParticles(
            brick.x + brick.w / 2,
            brick.y + brick.h / 2,
            BRICK_COLORS[brick.row % BRICK_COLORS.length],
            6
          );
          spawnPowerUp(brick.x + brick.w / 2, brick.y + brick.h / 2);
        }
      });
    }

    // Check win
    let allCleared = true;
    for (const brick of s.bricks) {
      if (brick.status === 1) { allCleared = false; break; }
    }
    if (allCleared && s.bricks.length > 0) {
      s.won = true;
      s.gameOver = true;
      setWon(true);
      setGameOver(true);
    }

    // Update particles
    for (let i = s.particles.length - 1; i >= 0; i--) {
      const p = s.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) s.particles.splice(i, 1);
    }
  }, [resetBall, applyPowerUp, spawnParticles, spawnPowerUp]);

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
    s.powerUps = [];
    s.particles = [];
    s.activeEffects = { wide: 0, fire: 0 };
    s.paddle.width = 0.20;
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
                <p className="text-sm text-gray-400 mb-1">Mouse or Arrow keys to move paddle</p>
                <div className="text-xs text-gray-500 mb-4 space-y-0.5">
                  <p><span className="text-blue-400 font-bold">W</span> Wide Paddle &middot; <span className="text-orange-400 font-bold">M</span> Multi-Ball</p>
                  <p><span className="text-yellow-400 font-bold">F</span> Fireball &middot; <span className="text-red-400 font-bold">+</span> Extra Life</p>
                </div>
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
