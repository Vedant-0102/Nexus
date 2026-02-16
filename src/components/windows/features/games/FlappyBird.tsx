import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Trophy, Play } from 'lucide-react';

interface Bird {
  y: number;
  velocity: number;
  rotation: number;
}

interface Pipe {
  x: number;
  gapY: number;
  passed: boolean;
}

export const FlappyBird: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const gameLoopRef = useRef<number>();
  const sizeRef = useRef({ width: 400, height: 600 });

  // Use refs for game state to avoid stale closures in game loop
  const birdRef = useRef<Bird>({ y: 0.4, velocity: 0, rotation: 0 });
  const pipesRef = useRef<Pipe[]>([]);
  const scoreRef = useRef(0);
  const gameStartedRef = useRef(false);
  const gameOverRef = useRef(false);
  const frameRef = useRef(0);

  const BIRD_SIZE = 0.04; // relative to height
  const PIPE_WIDTH = 0.08; // relative to width
  const PIPE_GAP = 0.2; // relative to height
  const GRAVITY = 0.0006;
  const JUMP_STRENGTH = -0.012;
  const PIPE_SPEED = 0.003;

  // Resize handler
  useEffect(() => {
    const updateSize = () => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      // Maintain roughly 2:3 aspect ratio but fill available space
      const maxW = rect.width;
      const maxH = rect.height;
      const aspect = 2 / 3;

      let w = maxW;
      let h = w / aspect;
      if (h > maxH) {
        h = maxH;
        w = h * aspect;
      }
      sizeRef.current = { width: Math.floor(w), height: Math.floor(h) };

      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = Math.floor(w);
        canvas.height = Math.floor(h);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const bird = birdRef.current;
    const pipes = pipesRef.current;

    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#4FC3F7');
    grad.addColorStop(0.6, '#81D4FA');
    grad.addColorStop(1, '#E1F5FE');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Scrolling clouds
    const cloudOffset = (frameRef.current * 0.3) % W;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (const cx of [-0.1, 0.3, 0.65]) {
      const baseX = cx * W - cloudOffset;
      const x = ((baseX % W) + W) % W;
      ctx.beginPath();
      ctx.arc(x, H * 0.12, W * 0.04, 0, Math.PI * 2);
      ctx.arc(x + W * 0.03, H * 0.1, W * 0.05, 0, Math.PI * 2);
      ctx.arc(x + W * 0.06, H * 0.12, W * 0.04, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ground
    const groundH = H * 0.08;
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(0, H - groundH, W, groundH);
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, H - groundH - H * 0.015, W, H * 0.015);

    // Pipes
    pipes.forEach(pipe => {
      const px = pipe.x * W;
      const pw = PIPE_WIDTH * W;
      const gapTop = pipe.gapY * H;
      const gapBot = gapTop + PIPE_GAP * H;
      const capH = H * 0.03;

      // Top pipe body
      const topGrad = ctx.createLinearGradient(px, 0, px + pw, 0);
      topGrad.addColorStop(0, '#388E3C');
      topGrad.addColorStop(0.5, '#66BB6A');
      topGrad.addColorStop(1, '#388E3C');
      ctx.fillStyle = topGrad;
      ctx.fillRect(px, 0, pw, gapTop);

      // Top pipe cap
      ctx.fillStyle = '#2E7D32';
      ctx.fillRect(px - pw * 0.08, gapTop - capH, pw * 1.16, capH);
      ctx.strokeStyle = '#1B5E20';
      ctx.lineWidth = 1;
      ctx.strokeRect(px - pw * 0.08, gapTop - capH, pw * 1.16, capH);

      // Bottom pipe body
      ctx.fillStyle = topGrad;
      ctx.fillRect(px, gapBot, pw, H - groundH - gapBot);

      // Bottom pipe cap
      ctx.fillStyle = '#2E7D32';
      ctx.fillRect(px - pw * 0.08, gapBot, pw * 1.16, capH);
      ctx.strokeStyle = '#1B5E20';
      ctx.strokeRect(px - pw * 0.08, gapBot, pw * 1.16, capH);
    });

    // Bird
    const bx = W * 0.3;
    const by = bird.y * H;
    const bs = BIRD_SIZE * H;
    const rotation = Math.max(-0.5, Math.min(bird.velocity * 40, 1.2));

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(rotation);

    // Body
    ctx.fillStyle = '#FFC107';
    ctx.beginPath();
    ctx.ellipse(0, 0, bs * 0.6, bs * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FF8F00';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Wing
    ctx.fillStyle = '#FFB300';
    const wingFlap = Math.sin(frameRef.current * 0.3) * 0.15;
    ctx.beginPath();
    ctx.ellipse(-bs * 0.15, bs * 0.1 + wingFlap * bs, bs * 0.25, bs * 0.35, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(bs * 0.2, -bs * 0.12, bs * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(bs * 0.25, -bs * 0.1, bs * 0.09, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#E65100';
    ctx.beginPath();
    ctx.moveTo(bs * 0.45, -bs * 0.05);
    ctx.lineTo(bs * 0.7, bs * 0.05);
    ctx.lineTo(bs * 0.45, bs * 0.12);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Score
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.font = `bold ${Math.round(H * 0.08)}px 'Segoe UI', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(String(scoreRef.current), W / 2 + 2, H * 0.1 + 2);
    ctx.fillStyle = '#FFF';
    ctx.fillText(String(scoreRef.current), W / 2, H * 0.1);
  }, []);

  const gameLoop = useCallback(() => {
    if (!gameStartedRef.current || gameOverRef.current) return;

    frameRef.current++;
    const bird = birdRef.current;

    // Physics
    bird.velocity += GRAVITY;
    bird.y += bird.velocity;

    // Pipes
    let pipes = pipesRef.current;
    pipes = pipes.map(p => ({ ...p, x: p.x - PIPE_SPEED }));
    pipes = pipes.filter(p => p.x > -PIPE_WIDTH);

    if (pipes.length === 0 || pipes[pipes.length - 1].x < 1 - 0.4) {
      pipes.push({
        x: 1.05,
        gapY: Math.random() * 0.4 + 0.15,
        passed: false
      });
    }

    // Score
    const birdX = 0.3;
    pipes.forEach(p => {
      if (!p.passed && p.x + PIPE_WIDTH < birdX) {
        p.passed = true;
        scoreRef.current++;
        setScore(scoreRef.current);
      }
    });
    pipesRef.current = pipes;

    // Collision - ground/ceiling
    if (bird.y < BIRD_SIZE * 0.5 || bird.y > 1 - 0.08 - BIRD_SIZE * 0.5) {
      endGame();
      return;
    }

    // Collision - pipes
    for (const p of pipes) {
      if (
        birdX + BIRD_SIZE * 0.3 > p.x &&
        birdX - BIRD_SIZE * 0.3 < p.x + PIPE_WIDTH
      ) {
        if (bird.y - BIRD_SIZE * 0.5 < p.gapY || bird.y + BIRD_SIZE * 0.5 > p.gapY + PIPE_GAP) {
          endGame();
          return;
        }
      }
    }

    draw();
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [draw]);

  const endGame = useCallback(() => {
    gameOverRef.current = true;
    setGameOver(true);
    gameStartedRef.current = false;
    setGameStarted(false);
    setHighScore(prev => Math.max(prev, scoreRef.current));
  }, []);

  const jump = useCallback(() => {
    if (gameOverRef.current) return;
    if (!gameStartedRef.current) {
      gameStartedRef.current = true;
      setGameStarted(true);
      pipesRef.current = [{ x: 1.1, gapY: 0.3, passed: false }];
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
    birdRef.current.velocity = JUMP_STRENGTH;
  }, [gameLoop]);

  const resetGame = useCallback(() => {
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    birdRef.current = { y: 0.4, velocity: 0, rotation: 0 };
    pipesRef.current = [];
    scoreRef.current = 0;
    frameRef.current = 0;
    gameStartedRef.current = false;
    gameOverRef.current = false;
    setScore(0);
    setGameOver(false);
    setGameStarted(false);

    // Draw initial frame
    setTimeout(() => draw(), 50);
  }, [draw]);

  // Initial draw
  useEffect(() => {
    const t = setTimeout(() => draw(), 100);
    return () => clearTimeout(t);
  }, [draw]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [jump]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, []);

  return (
    <div className="h-full w-full flex flex-col bg-gradient-to-b from-sky-200 to-sky-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold dark:text-white">Flappy Bird</h1>
          <span className="text-sm text-gray-500 dark:text-gray-400">Space / Click to fly</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
            Best: {highScore}
          </div>
          <Button onClick={resetGame} variant="outline" size="sm">
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset
          </Button>
        </div>
      </div>

      {/* Canvas container */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center min-h-0 px-3 pb-3">
        <div className="relative h-full max-h-full" style={{ aspectRatio: '2/3' }}>
          <canvas
            ref={canvasRef}
            onClick={jump}
            className="w-full h-full rounded-xl shadow-2xl cursor-pointer border-2 border-gray-300 dark:border-gray-600"
          />

          {/* Start overlay */}
          {!gameStarted && !gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl backdrop-blur-sm">
              <div className="text-center p-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                  <Play className="h-8 w-8 text-blue-600 ml-1" />
                </div>
                <p className="text-xl font-bold text-white drop-shadow">Click or Space to Start</p>
              </div>
            </div>
          )}

          {/* Game over overlay */}
          {gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl backdrop-blur-sm">
              <div className="text-center p-6 bg-white/95 dark:bg-gray-800/95 rounded-2xl shadow-2xl mx-4 max-w-xs w-full">
                <Trophy className="h-12 w-12 mx-auto mb-3 text-yellow-500" />
                <h2 className="text-2xl font-bold mb-1 dark:text-white">Game Over</h2>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">{score}</p>
                {score >= highScore && score > 0 && (
                  <p className="text-sm text-yellow-600 font-semibold mb-3">New Best!</p>
                )}
                <Button onClick={resetGame} className="w-full" size="sm">
                  Play Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
