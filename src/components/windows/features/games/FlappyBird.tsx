import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Trophy, Play } from 'lucide-react';

interface Bird {
  y: number;
  velocity: number;
}

interface Pipe {
  x: number;
  gapY: number;
  passed: boolean;
}

// All physics are expressed in normalized units per SECOND (not per frame) so the
// game plays identically on 60Hz, 120Hz and 144Hz displays.
const BIRD_SIZE = 0.045;      // relative to height
const PIPE_WIDTH = 0.08;      // relative to width
const PIPE_GAP = 0.26;        // relative to height
const PIPE_SPACING = 0.52;    // relative to width, gap between consecutive pipes
const GRAVITY = 1.9;          // height / s^2
const JUMP_STRENGTH = -0.62;  // height / s
const MAX_FALL = 0.95;        // height / s terminal velocity
const PIPE_SPEED = 0.19;      // width / s
const BIRD_X = 0.3;           // relative to width
const GROUND = 0.08;          // relative to height
const PHYS_STEP = 1 / 120;    // fixed simulation step

export const FlappyBird: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const sizeRef = useRef({ w: 400, h: 600, dpr: 1 });

  // Refs for game state to avoid stale closures in the animation loop
  const birdRef = useRef<Bird>({ y: 0.4, velocity: 0 });
  const pipesRef = useRef<Pipe[]>([]);
  const scoreRef = useRef(0);
  const runningRef = useRef(false);
  const gameOverRef = useRef(false);
  const timeRef = useRef(0);

  // Keep the canvas backing store matched to its displayed size (and DPR)
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const apply = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      sizeRef.current = { w: rect.width, h: rect.height, dpr };
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
      }
    };

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { w: W, h: H, dpr } = sizeRef.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const bird = birdRef.current;
    const pipes = pipesRef.current;
    const t = timeRef.current;

    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#4FC3F7');
    grad.addColorStop(0.6, '#81D4FA');
    grad.addColorStop(1, '#E1F5FE');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Scrolling clouds
    const cloudOffset = (t * W * 0.02) % W;
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

    const groundH = H * GROUND;

    // Pipes
    pipes.forEach(pipe => {
      const px = pipe.x * W;
      const pw = PIPE_WIDTH * W;
      const gapTop = pipe.gapY * H;
      const gapBot = gapTop + PIPE_GAP * H;
      const capH = H * 0.03;

      const bodyGrad = ctx.createLinearGradient(px, 0, px + pw, 0);
      bodyGrad.addColorStop(0, '#388E3C');
      bodyGrad.addColorStop(0.5, '#66BB6A');
      bodyGrad.addColorStop(1, '#388E3C');

      ctx.fillStyle = bodyGrad;
      ctx.fillRect(px, 0, pw, gapTop);

      ctx.fillStyle = '#2E7D32';
      ctx.fillRect(px - pw * 0.08, gapTop - capH, pw * 1.16, capH);
      ctx.strokeStyle = '#1B5E20';
      ctx.lineWidth = 1;
      ctx.strokeRect(px - pw * 0.08, gapTop - capH, pw * 1.16, capH);

      ctx.fillStyle = bodyGrad;
      ctx.fillRect(px, gapBot, pw, H - groundH - gapBot);

      ctx.fillStyle = '#2E7D32';
      ctx.fillRect(px - pw * 0.08, gapBot, pw * 1.16, capH);
      ctx.strokeStyle = '#1B5E20';
      ctx.strokeRect(px - pw * 0.08, gapBot, pw * 1.16, capH);
    });

    // Ground (drawn after pipes so pipe bodies tuck behind it)
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(0, H - groundH, W, groundH);
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, H - groundH - H * 0.015, W, H * 0.015);

    // Bird
    const bx = W * BIRD_X;
    const by = bird.y * H;
    const bs = BIRD_SIZE * H;
    const rotation = Math.max(-0.5, Math.min(bird.velocity * 0.9, 1.2));

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(rotation);

    ctx.fillStyle = '#FFC107';
    ctx.beginPath();
    ctx.ellipse(0, 0, bs * 0.6, bs * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FF8F00';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#FFB300';
    const wingFlap = Math.sin(t * 18) * 0.15;
    ctx.beginPath();
    ctx.ellipse(-bs * 0.15, bs * 0.1 + wingFlap * bs, bs * 0.25, bs * 0.35, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(bs * 0.2, -bs * 0.12, bs * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(bs * 0.25, -bs * 0.1, bs * 0.09, 0, Math.PI * 2);
    ctx.fill();

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

  const endGame = useCallback(() => {
    if (gameOverRef.current) return;
    gameOverRef.current = true;
    runningRef.current = false;
    setGameOver(true);
    setGameStarted(false);
    setHighScore(prev => Math.max(prev, scoreRef.current));
  }, []);

  // One fixed-size physics step. dt is always PHYS_STEP seconds.
  const step = useCallback((dt: number) => {
    const bird = birdRef.current;
    const { w: W, h: H } = sizeRef.current;

    bird.velocity = Math.min(bird.velocity + GRAVITY * dt, MAX_FALL);
    bird.y += bird.velocity * dt;

    // Move pipes, recycle off-screen ones
    const pipes = pipesRef.current;
    for (const p of pipes) p.x -= PIPE_SPEED * dt;
    while (pipes.length && pipes[0].x < -PIPE_WIDTH) pipes.shift();

    const last = pipes[pipes.length - 1];
    if (!last || last.x < 1 - PIPE_SPACING) {
      pipes.push({
        x: last ? last.x + PIPE_SPACING : 1.05,
        gapY: 0.12 + Math.random() * (1 - GROUND - PIPE_GAP - 0.24),
        passed: false,
      });
    }

    // Hitbox. BIRD_SIZE is height-relative, pipe x is width-relative, so the
    // horizontal half-extent has to be converted through the aspect ratio.
    const halfW = (BIRD_SIZE * 0.55 * H) / Math.max(W, 1);
    const halfH = BIRD_SIZE * 0.42;

    for (const p of pipes) {
      if (!p.passed && p.x + PIPE_WIDTH < BIRD_X - halfW) {
        p.passed = true;
        scoreRef.current++;
        setScore(scoreRef.current);
      }
    }

    // Ceiling / ground
    if (bird.y - halfH < 0 || bird.y + halfH > 1 - GROUND) {
      bird.y = Math.min(Math.max(bird.y, halfH), 1 - GROUND - halfH);
      endGame();
      return;
    }

    // Pipes
    for (const p of pipes) {
      if (BIRD_X + halfW > p.x && BIRD_X - halfW < p.x + PIPE_WIDTH) {
        if (bird.y - halfH < p.gapY || bird.y + halfH > p.gapY + PIPE_GAP) {
          endGame();
          return;
        }
      }
    }
  }, [endGame]);

  // Single render loop for the component's whole lifetime: it keeps drawing while
  // idle (so the first frame and every resize are painted) and steps physics with
  // a fixed timestep while playing.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let acc = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.25) dt = 0.25; // tab was backgrounded; don't teleport the bird
      timeRef.current += dt;

      if (runningRef.current) {
        acc = Math.min(acc + dt, 0.25);
        while (acc >= PHYS_STEP && runningRef.current) {
          step(PHYS_STEP);
          acc -= PHYS_STEP;
        }
      } else {
        acc = 0;
        if (!gameOverRef.current) {
          // Gentle idle bob on the start screen
          birdRef.current.y = 0.4 + Math.sin(timeRef.current * 2.5) * 0.02;
          birdRef.current.velocity = Math.cos(timeRef.current * 2.5) * 0.05;
        }
      }

      draw();
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [step, draw]);

  const jump = useCallback(() => {
    if (gameOverRef.current) return;
    if (!runningRef.current) {
      birdRef.current = { y: 0.4, velocity: 0 };
      pipesRef.current = [{ x: 1.15, gapY: 0.34, passed: false }];
      runningRef.current = true;
      setGameStarted(true);
    }
    birdRef.current.velocity = JUMP_STRENGTH;
  }, []);

  const resetGame = useCallback(() => {
    birdRef.current = { y: 0.4, velocity: 0 };
    pipesRef.current = [];
    scoreRef.current = 0;
    runningRef.current = false;
    gameOverRef.current = false;
    setScore(0);
    setGameOver(false);
    setGameStarted(false);
  }, []);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.code !== 'ArrowUp' && e.code !== 'KeyW') return;
      if (e.repeat) return; // holding the key must not machine-gun flaps

      const active = document.activeElement as HTMLElement | null;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
        return;
      }

      e.preventDefault(); // also stops Space from re-triggering a focused button
      jump();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [jump]);

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
      <div className="flex-1 flex items-center justify-center min-h-0 px-3 pb-3">
        <div
          ref={wrapperRef}
          className="relative h-full max-h-full cursor-pointer select-none touch-none"
          style={{ aspectRatio: '2/3' }}
          onPointerDown={e => {
            e.preventDefault();
            jump();
          }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full rounded-xl shadow-2xl border-2 border-gray-300 dark:border-gray-600 block"
          />

          {/* Start overlay — pointer-events-none so it never eats the click */}
          {!gameStarted && !gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl backdrop-blur-sm pointer-events-none">
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
