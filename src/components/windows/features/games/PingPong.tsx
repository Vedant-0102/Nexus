import React, { useEffect, useRef, useState, useCallback } from 'react';

// ─── Constants ───────────────────────────────────────────────────────────────

const W = 700;
const H = 480;
const PADDLE_W = 12;
const PADDLE_H = 90;
const BALL_R = 7;
const PADDLE_MARGIN = 24;
const BALL_SPEED_INIT = 4.5;
const BALL_SPEED_MAX = 9;
const BALL_ACCEL = 0.15;
const AI_SPEED = 4.2;
const WIN_SCORE = 10;
const TRAIL_LENGTH = 12;

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  color: string;
  size: number;
}

interface TrailPoint {
  x: number; y: number;
  age: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const PingPong: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const [, forceRender] = useState(0);

  const s = useRef({
    state: 'menu' as 'menu' | 'serve' | 'playing' | 'scored' | 'waitServe' | 'won',
    scorePlayer: 0,
    scoreAI: 0,
    winner: '',

    // Paddles
    playerY: H / 2 - PADDLE_H / 2,
    aiY: H / 2 - PADDLE_H / 2,

    // Ball
    bx: W / 2,
    by: H / 2,
    bvx: 0,
    bvy: 0,
    speed: BALL_SPEED_INIT,
    rally: 0,

    // Effects
    trail: [] as TrailPoint[],
    particles: [] as Particle[],
    screenShake: 0,
    flashSide: '' as '' | 'left' | 'right',
    flashAlpha: 0,
    scoredTimer: 0,
    serveDir: 1,

    // Input
    mouseY: H / 2,
    keys: new Set<string>(),

    frameCount: 0,
  });

  // ─── Spawn particles ──────────────────────────────────────────────────

  const spawnHitParticles = useCallback((x: number, y: number, dirX: number, color: string) => {
    const st = s.current;
    for (let i = 0; i < 10; i++) {
      const angle = (dirX > 0 ? 0 : Math.PI) + (Math.random() - 0.5) * 1.2;
      const speed = 1.5 + Math.random() * 3;
      st.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + (Math.random() - 0.5) * 2,
        life: 15 + Math.random() * 15,
        color,
        size: 1.5 + Math.random() * 2,
      });
    }
  }, []);

  const spawnScoreParticles = useCallback((x: number) => {
    const st = s.current;
    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      st.particles.push({
        x, y: H / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 25 + Math.random() * 20,
        color: '#fff',
        size: 2 + Math.random() * 3,
      });
    }
  }, []);

  // ─── Reset ball ────────────────────────────────────────────────────────

  const serveBall = useCallback((dir: number) => {
    const st = s.current;
    st.bx = W / 2;
    st.by = H / 2;
    const angle = (Math.random() - 0.5) * 0.8;
    st.bvx = dir * Math.cos(angle) * BALL_SPEED_INIT;
    st.bvy = Math.sin(angle) * BALL_SPEED_INIT;
    st.speed = BALL_SPEED_INIT;
    st.rally = 0;
    st.trail = [];
    st.state = 'playing';
  }, []);

  // ─── Start game ───────────────────────────────────────────────────────

  const startGame = useCallback(() => {
    const st = s.current;
    st.scorePlayer = 0;
    st.scoreAI = 0;
    st.winner = '';
    st.playerY = H / 2 - PADDLE_H / 2;
    st.aiY = H / 2 - PADDLE_H / 2;
    st.particles = [];
    st.trail = [];
    st.screenShake = 0;
    st.flashAlpha = 0;
    st.flashSide = '';
    st.serveDir = 1;
    st.state = 'serve';
    forceRender(n => n + 1);
  }, []);

  // ─── Game loop ─────────────────────────────────────────────────────────

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const st = s.current;
    st.frameCount++;

    // ── Update ──

    // Player paddle (mouse or keyboard)
    if (st.keys.has('arrowup') || st.keys.has('w')) {
      st.playerY = Math.max(0, st.playerY - 6);
    } else if (st.keys.has('arrowdown') || st.keys.has('s')) {
      st.playerY = Math.min(H - PADDLE_H, st.playerY + 6);
    } else {
      // Mouse control — smooth follow
      const target = st.mouseY - PADDLE_H / 2;
      st.playerY += (target - st.playerY) * 0.15;
      st.playerY = Math.max(0, Math.min(H - PADDLE_H, st.playerY));
    }

    if (st.state === 'playing') {
      // Ball movement
      st.bx += st.bvx;
      st.by += st.bvy;

      // Trail
      st.trail.push({ x: st.bx, y: st.by, age: 0 });
      if (st.trail.length > TRAIL_LENGTH) st.trail.shift();
      for (const t of st.trail) t.age++;

      // Top/bottom bounce
      if (st.by - BALL_R <= 0) {
        st.by = BALL_R;
        st.bvy = Math.abs(st.bvy);
      } else if (st.by + BALL_R >= H) {
        st.by = H - BALL_R;
        st.bvy = -Math.abs(st.bvy);
      }

      // Player paddle collision
      const px = PADDLE_MARGIN;
      if (st.bvx < 0 &&
          st.bx - BALL_R <= px + PADDLE_W &&
          st.bx + BALL_R >= px &&
          st.by >= st.playerY - 4 &&
          st.by <= st.playerY + PADDLE_H + 4) {
        st.bx = px + PADDLE_W + BALL_R;
        const hitPos = (st.by - (st.playerY + PADDLE_H / 2)) / (PADDLE_H / 2);
        st.speed = Math.min(BALL_SPEED_MAX, st.speed + BALL_ACCEL);
        st.bvx = st.speed * Math.cos(hitPos * 0.65);
        st.bvy = st.speed * Math.sin(hitPos * 0.65);
        if (st.bvx < 1) st.bvx = 1;
        st.rally++;
        st.screenShake = 3;
        spawnHitParticles(px + PADDLE_W, st.by, 1, '#4ade80');
      }

      // AI paddle collision
      const ax = W - PADDLE_MARGIN - PADDLE_W;
      if (st.bvx > 0 &&
          st.bx + BALL_R >= ax &&
          st.bx - BALL_R <= ax + PADDLE_W &&
          st.by >= st.aiY - 4 &&
          st.by <= st.aiY + PADDLE_H + 4) {
        st.bx = ax - BALL_R;
        const hitPos = (st.by - (st.aiY + PADDLE_H / 2)) / (PADDLE_H / 2);
        st.speed = Math.min(BALL_SPEED_MAX, st.speed + BALL_ACCEL);
        st.bvx = -st.speed * Math.cos(hitPos * 0.65);
        st.bvy = st.speed * Math.sin(hitPos * 0.65);
        if (st.bvx > -1) st.bvx = -1;
        st.rally++;
        st.screenShake = 3;
        spawnHitParticles(ax, st.by, -1, '#f87171');
      }

      // AI movement — tracks ball with a slight delay/imperfection
      const aiCenter = st.aiY + PADDLE_H / 2;
      const aiTarget = st.bvx > 0 ? st.by : H / 2; // only track when ball approaches
      const aiDiff = aiTarget - aiCenter;
      const aiMove = Math.min(AI_SPEED, Math.abs(aiDiff)) * Math.sign(aiDiff);
      // Add slight imperfection — misses sometimes at high speed
      const imperfection = st.speed > 6 ? (Math.sin(st.frameCount * 0.05) * 0.5) : 0;
      st.aiY += aiMove * (0.85 + imperfection);
      st.aiY = Math.max(0, Math.min(H - PADDLE_H, st.aiY));

      // Scoring
      if (st.bx - BALL_R <= 0) {
        // AI scores
        st.scoreAI++;
        st.flashSide = 'left';
        st.flashAlpha = 0.5;
        st.screenShake = 8;
        st.serveDir = -1;
        spawnScoreParticles(0);
        if (st.scoreAI >= WIN_SCORE) {
          st.state = 'won';
          st.winner = 'AI';
        } else {
          st.state = 'scored';
          st.scoredTimer = 60;
        }
        forceRender(n => n + 1);
      } else if (st.bx + BALL_R >= W) {
        // Player scores
        st.scorePlayer++;
        st.flashSide = 'right';
        st.flashAlpha = 0.5;
        st.screenShake = 8;
        st.serveDir = 1;
        spawnScoreParticles(W);
        if (st.scorePlayer >= WIN_SCORE) {
          st.state = 'won';
          st.winner = 'Player';
        } else {
          st.state = 'scored';
          st.scoredTimer = 60;
        }
        forceRender(n => n + 1);
      }
    }

    // Wait for click/key to serve after scoring
    if (st.state === 'scored') {
      st.scoredTimer--;
      if (st.scoredTimer <= 0) {
        st.state = 'waitServe';
      }
    }

    if (st.state === 'serve') {
      serveBall(st.serveDir);
    }

    // Particles
    for (let i = st.particles.length - 1; i >= 0; i--) {
      const p = st.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.97;
      p.vy *= 0.97;
      p.life--;
      if (p.life <= 0) st.particles.splice(i, 1);
    }

    // Effects decay
    if (st.screenShake > 0) st.screenShake *= 0.85;
    if (st.flashAlpha > 0) st.flashAlpha -= 0.025;

    // ── Render ──
    ctx.save();

    // Screen shake
    if (st.screenShake > 0.5) {
      ctx.translate(
        (Math.random() - 0.5) * st.screenShake * 2,
        (Math.random() - 0.5) * st.screenShake * 2
      );
    }

    // Background
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Center line
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 12]);
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.setLineDash([]);

    // Center circle
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 50, 0, Math.PI * 2);
    ctx.stroke();

    // Flash on score
    if (st.flashAlpha > 0) {
      const grad = ctx.createLinearGradient(
        st.flashSide === 'left' ? 0 : W,
        0,
        st.flashSide === 'left' ? W * 0.3 : W * 0.7,
        0
      );
      grad.addColorStop(0, `rgba(239,68,68,${st.flashAlpha})`);
      grad.addColorStop(1, 'rgba(239,68,68,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    // Ball trail
    for (let i = 0; i < st.trail.length; i++) {
      const t = st.trail[i];
      const alpha = (i / st.trail.length) * 0.35;
      const size = BALL_R * (0.3 + (i / st.trail.length) * 0.7);
      ctx.beginPath();
      ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fill();
    }

    // Ball
    if (st.state === 'playing' || st.state === 'scored') {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(st.bx, st.by, BALL_R, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player paddle
    ctx.fillStyle = '#4ade80';
    const px = PADDLE_MARGIN;
    ctx.beginPath();
    ctx.roundRect(px, st.playerY, PADDLE_W, PADDLE_H, 4);
    ctx.fill();

    // AI paddle
    ctx.fillStyle = '#f87171';
    const ax = W - PADDLE_MARGIN - PADDLE_W;
    ctx.beginPath();
    ctx.roundRect(ax, st.aiY, PADDLE_W, PADDLE_H, 4);
    ctx.fill();

    // Particles
    for (const p of st.particles) {
      ctx.globalAlpha = Math.max(0, p.life / 35);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    // Score display
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = 'bold 80px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(String(st.scorePlayer), W / 4, H / 2 + 28);
    ctx.fillText(String(st.scoreAI), W * 3 / 4, H / 2 + 28);

    // Rally counter
    if (st.rally > 3 && st.state === 'playing') {
      ctx.fillStyle = `rgba(251,191,36,${0.4 + Math.sin(st.frameCount * 0.1) * 0.2})`;
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`Rally: ${st.rally}`, W / 2, 30);
    }

    // Speed indicator
    if (st.state === 'playing' && st.speed > BALL_SPEED_INIT + 1) {
      const speedPct = (st.speed - BALL_SPEED_INIT) / (BALL_SPEED_MAX - BALL_SPEED_INIT);
      ctx.fillStyle = `rgba(251,191,36,0.3)`;
      ctx.fillRect(W / 2 - 40, H - 8, 80 * speedPct, 3);
    }

    // Top border accents
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(0, 0, W / 2 - 1, 2);
    ctx.fillStyle = '#f87171';
    ctx.fillRect(W / 2 + 1, 0, W / 2, 2);

    // Labels
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(74,222,128,0.5)';
    ctx.textAlign = 'left';
    ctx.fillText('PLAYER', 14, H - 8);
    ctx.fillStyle = 'rgba(248,113,113,0.5)';
    ctx.textAlign = 'right';
    ctx.fillText('AI', W - 14, H - 8);
    ctx.textAlign = 'left';

    // Menu overlay
    if (st.state === 'menu') {
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PING PONG', W / 2, H / 2 - 50);

      ctx.font = '14px monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(`First to ${WIN_SCORE} wins`, W / 2, H / 2 - 15);

      ctx.fillStyle = '#4ade80';
      ctx.font = '16px monospace';
      const pulse = 0.7 + Math.sin(st.frameCount * 0.06) * 0.3;
      ctx.globalAlpha = pulse;
      ctx.fillText('Click or press ENTER to start', W / 2, H / 2 + 25);
      ctx.globalAlpha = 1;

      ctx.font = '11px monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillText('Mouse or W/S or Arrows to move paddle', W / 2, H / 2 + 60);
      ctx.textAlign = 'left';
    }

    // Wait to serve prompt
    if (st.state === 'waitServe') {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      const pulse2 = 0.5 + Math.sin(st.frameCount * 0.08) * 0.3;
      ctx.globalAlpha = pulse2;
      ctx.fillText('Click to serve', W / 2, H / 2);
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';
    }

    // Won overlay
    if (st.state === 'won') {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);

      const isPlayerWin = st.winner === 'Player';
      ctx.fillStyle = isPlayerWin ? '#4ade80' : '#f87171';
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isPlayerWin ? 'YOU WIN!' : 'AI WINS', W / 2, H / 2 - 40);

      ctx.fillStyle = '#fff';
      ctx.font = '20px monospace';
      ctx.fillText(`${st.scorePlayer}  -  ${st.scoreAI}`, W / 2, H / 2);

      ctx.font = '14px monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText('Click or press ENTER to play again', W / 2, H / 2 + 40);
      ctx.textAlign = 'left';
    }

    ctx.restore();

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [serveBall, spawnHitParticles, spawnScoreParticles]);

  // ─── Events ────────────────────────────────────────────────────────────

  useEffect(() => {
    const st = s.current;

    const onMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleY = H / rect.height;
      st.mouseY = (e.clientY - rect.top) * scaleY;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      st.keys.add(e.key.toLowerCase());
      if (e.key === 'Enter' || e.key === ' ') {
        if (st.state === 'menu' || st.state === 'won') {
          startGame();
        } else if (st.state === 'waitServe') {
          st.state = 'serve';
        }
        e.preventDefault();
      }
      if (['ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      st.keys.delete(e.key.toLowerCase());
    };

    const onClick = () => {
      if (st.state === 'menu' || st.state === 'won') {
        startGame();
      } else if (st.state === 'waitServe') {
        st.state = 'serve';
      }
    };

    const canvas = canvasRef.current;
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas?.addEventListener('mousemove', onMouseMove);
    canvas?.addEventListener('click', onClick);

    rafRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas?.removeEventListener('mousemove', onMouseMove);
      canvas?.removeEventListener('click', onClick);
      cancelAnimationFrame(rafRef.current);
    };
  }, [gameLoop, startGame]);

  return (
    <div className="h-full w-full flex items-center justify-center bg-[#0d0d1a]">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="block max-w-full max-h-full"
        style={{ imageRendering: 'auto', cursor: 'none' }}
        tabIndex={0}
      />
    </div>
  );
};
