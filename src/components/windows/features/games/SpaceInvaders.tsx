import React, { useEffect, useRef, useState, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Enemy {
  x: number;
  y: number;
  type: number; // 0=top(30pt), 1=mid(20pt), 2=bottom(10pt)
  alive: boolean;
  frame: number;
}

interface Bullet {
  x: number;
  y: number;
  vy: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface Shield {
  x: number;
  y: number;
  pixels: boolean[][]; // 24x18 grid
}

interface UFO {
  x: number;
  y: number;
  active: boolean;
  dir: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const W = 560;
const H = 440;
const PLAYER_W = 36;
const PLAYER_H = 20;
const ENEMY_W = 28;
const ENEMY_H = 20;
const ENEMY_COLS = 11;
const ENEMY_ROWS = 5;
const ENEMY_PAD_X = 42;
const ENEMY_PAD_Y = 36;
const SHIELD_COUNT = 4;
const SHIELD_W = 24;
const SHIELD_H = 18;
const PIXEL_SIZE = 2;

const ENEMY_POINTS = [30, 20, 20, 10, 10];

const COLORS = {
  player: '#3b82f6',
  playerGlow: '#60a5fa',
  bullet: '#fbbf24',
  enemyBullet: '#ef4444',
  shield: '#22c55e',
  ufo: '#f472b6',
  bg: '#0a0a12',
  stars: '#ffffff',
  text: '#ffffff',
  enemyRow: ['#f472b6', '#a78bfa', '#a78bfa', '#34d399', '#34d399'],
};

// ─── Sprite Drawing ──────────────────────────────────────────────────────────

function drawPixelSprite(
  ctx: CanvasRenderingContext2D,
  pattern: number[][],
  x: number,
  y: number,
  color: string,
  scale: number = 2
) {
  ctx.fillStyle = color;
  for (let r = 0; r < pattern.length; r++) {
    for (let c = 0; c < pattern[r].length; c++) {
      if (pattern[r][c]) {
        ctx.fillRect(x + c * scale, y + r * scale, scale, scale);
      }
    }
  }
}

// Invader type 0 (squid) - 2 frames
const INVADER_0A = [
  [0,0,0,1,1,0,0,0],
  [0,0,1,1,1,1,0,0],
  [0,1,1,1,1,1,1,0],
  [1,1,0,1,1,0,1,1],
  [1,1,1,1,1,1,1,1],
  [0,0,1,0,0,1,0,0],
  [0,1,0,1,1,0,1,0],
  [1,0,1,0,0,1,0,1],
];
const INVADER_0B = [
  [0,0,0,1,1,0,0,0],
  [0,0,1,1,1,1,0,0],
  [0,1,1,1,1,1,1,0],
  [1,1,0,1,1,0,1,1],
  [1,1,1,1,1,1,1,1],
  [0,1,0,0,0,0,1,0],
  [1,0,0,1,1,0,0,1],
  [0,1,0,0,0,0,1,0],
];

// Invader type 1 (crab) - 2 frames
const INVADER_1A = [
  [0,0,1,0,0,0,0,0,1,0,0],
  [0,0,0,1,0,0,0,1,0,0,0],
  [0,0,1,1,1,1,1,1,1,0,0],
  [0,1,1,0,1,1,1,0,1,1,0],
  [1,1,1,1,1,1,1,1,1,1,1],
  [1,0,1,1,1,1,1,1,1,0,1],
  [1,0,1,0,0,0,0,0,1,0,1],
  [0,0,0,1,1,0,1,1,0,0,0],
];
const INVADER_1B = [
  [0,0,1,0,0,0,0,0,1,0,0],
  [1,0,0,1,0,0,0,1,0,0,1],
  [1,0,1,1,1,1,1,1,1,0,1],
  [1,1,1,0,1,1,1,0,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1],
  [0,1,1,1,1,1,1,1,1,1,0],
  [0,0,1,0,0,0,0,0,1,0,0],
  [0,1,0,0,0,0,0,0,0,1,0],
];

// Invader type 2 (octopus) - 2 frames
const INVADER_2A = [
  [0,0,0,0,1,1,1,1,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,0],
  [1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,0,0,1,1,0,0,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1],
  [0,0,0,1,1,0,0,1,1,0,0,0],
  [0,0,1,1,0,1,1,0,1,1,0,0],
  [1,1,0,0,0,0,0,0,0,0,1,1],
];
const INVADER_2B = [
  [0,0,0,0,1,1,1,1,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,0],
  [1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,0,0,1,1,0,0,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1],
  [0,0,1,1,0,0,0,0,1,1,0,0],
  [0,1,0,0,1,1,1,1,0,0,1,0],
  [0,0,1,1,0,0,0,0,1,1,0,0],
];

const INVADER_SPRITES = [
  [INVADER_0A, INVADER_0B],
  [INVADER_1A, INVADER_1B],
  [INVADER_2A, INVADER_2B],
];

// Player sprite
const PLAYER_SPRITE = [
  [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// UFO sprite
const UFO_SPRITE = [
  [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [0,0,1,1,1,0,0,0,0,0,1,1,1,0,0],
  [0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
];

// ─── Shield Generation ───────────────────────────────────────────────────────

function createShield(sx: number, sy: number): Shield {
  const pixels: boolean[][] = [];
  for (let r = 0; r < SHIELD_H; r++) {
    pixels[r] = [];
    for (let c = 0; c < SHIELD_W; c++) {
      // Arch shape
      const cx = SHIELD_W / 2;
      const inArch = r > SHIELD_H * 0.55 && c > SHIELD_W * 0.25 && c < SHIELD_W * 0.75;
      const inDome = Math.sqrt(((c - cx) / (SHIELD_W / 2)) ** 2 + ((r) / SHIELD_H) ** 2) < 1.1;
      pixels[r][c] = inDome && !inArch;
    }
  }
  return { x: sx, y: sy, pixels };
}

// ─── Star Field ──────────────────────────────────────────────────────────────

function createStars(): { x: number; y: number; brightness: number; size: number }[] {
  const stars = [];
  for (let i = 0; i < 80; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      brightness: 0.3 + Math.random() * 0.7,
      size: Math.random() > 0.85 ? 2 : 1,
    });
  }
  return stars;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export const SpaceInvaders: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('si_highscore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameover'>('menu');

  const stateRef = useRef({
    score: 0,
    lives: 3,
    wave: 1,
    player: { x: W / 2 - PLAYER_W / 2, y: H - 50 },
    enemies: [] as Enemy[],
    bullets: [] as Bullet[],
    enemyBullets: [] as Bullet[],
    particles: [] as Particle[],
    shields: [] as Shield[],
    ufo: { x: 0, y: 0, active: false, dir: 1 } as UFO,
    keys: new Set<string>(),
    enemyDir: 1,
    enemyDropTarget: 0,
    enemyMoveTimer: 0,
    enemyMoveInterval: 45,
    enemyAnimFrame: 0,
    lastShot: 0,
    lastEnemyShot: 0,
    ufoTimer: 0,
    stars: createStars(),
    screenShake: 0,
    flashAlpha: 0,
    waveAnnounce: 0,
    gameState: 'menu' as string,
    frameCount: 0,
  });

  // ─── Init Wave ─────────────────────────────────────────────────────────

  const initWave = useCallback((waveNum: number) => {
    const s = stateRef.current;
    s.enemies = [];
    for (let row = 0; row < ENEMY_ROWS; row++) {
      const type = row === 0 ? 0 : row <= 2 ? 1 : 2;
      for (let col = 0; col < ENEMY_COLS; col++) {
        s.enemies.push({
          x: col * ENEMY_PAD_X + 40,
          y: row * ENEMY_PAD_Y + 60,
          type,
          alive: true,
          frame: 0,
        });
      }
    }
    s.enemyDir = 1;
    s.enemyDropTarget = 0;
    s.enemyMoveTimer = 0;
    s.enemyMoveInterval = Math.max(10, 45 - (waveNum - 1) * 5);
    s.enemyAnimFrame = 0;
    s.enemyBullets = [];
    s.ufo = { x: 0, y: 0, active: false, dir: 1 };
    s.ufoTimer = 0;

    // Shields only on wave 1 or every 3 waves refresh
    if (waveNum === 1 || waveNum % 3 === 1) {
      s.shields = [];
      const shieldSpacing = W / (SHIELD_COUNT + 1);
      for (let i = 0; i < SHIELD_COUNT; i++) {
        s.shields.push(createShield(
          shieldSpacing * (i + 1) - (SHIELD_W * PIXEL_SIZE) / 2,
          H - 110
        ));
      }
    }

    s.waveAnnounce = 120;
  }, []);

  // ─── Start / Reset ────────────────────────────────────────────────────

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.score = 0;
    s.lives = 3;
    s.wave = 1;
    s.player = { x: W / 2 - PLAYER_W / 2, y: H - 50 };
    s.bullets = [];
    s.particles = [];
    s.enemyBullets = [];
    s.keys.clear();
    s.screenShake = 0;
    s.flashAlpha = 0;
    s.frameCount = 0;
    s.lastShot = 0;
    s.lastEnemyShot = 0;
    setScore(0);
    setLives(3);
    setWave(1);
    initWave(1);
    s.gameState = 'playing';
    setGameState('playing');
  }, [initWave]);

  // ─── Spawn Particles ──────────────────────────────────────────────────

  const spawnExplosion = useCallback((x: number, y: number, color: string, count: number) => {
    const s = stateRef.current;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 2.5;
      s.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 20 + Math.random() * 25,
        color,
        size: 1 + Math.random() * 2.5,
      });
    }
  }, []);

  // ─── Damage Shield ────────────────────────────────────────────────────

  const damageShield = useCallback((shield: Shield, bx: number, by: number, radius: number): boolean => {
    const lx = Math.floor((bx - shield.x) / PIXEL_SIZE);
    const ly = Math.floor((by - shield.y) / PIXEL_SIZE);
    let hit = false;
    for (let r = ly - radius; r <= ly + radius; r++) {
      for (let c = lx - radius; c <= lx + radius; c++) {
        if (r >= 0 && r < SHIELD_H && c >= 0 && c < SHIELD_W && shield.pixels[r][c]) {
          shield.pixels[r][c] = false;
          hit = true;
        }
      }
    }
    return hit;
  }, []);

  // ─── Game Loop ─────────────────────────────────────────────────────────

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = stateRef.current;

    // ── Update ──
    if (s.gameState === 'playing') {
      s.frameCount++;

      // Player movement
      const speed = 5;
      if (s.keys.has('arrowleft') || s.keys.has('a')) s.player.x = Math.max(8, s.player.x - speed);
      if (s.keys.has('arrowright') || s.keys.has('d')) s.player.x = Math.min(W - PLAYER_W - 8, s.player.x + speed);

      // Player shooting
      if (s.keys.has(' ') && s.bullets.length < 3 && s.frameCount - s.lastShot > 10) {
        s.bullets.push({ x: s.player.x + PLAYER_W / 2, y: s.player.y - 4, vy: -8 });
        s.lastShot = s.frameCount;
      }

      // Player bullets
      for (let i = s.bullets.length - 1; i >= 0; i--) {
        s.bullets[i].y += s.bullets[i].vy;
        if (s.bullets[i].y < -10) s.bullets.splice(i, 1);
      }

      // Enemy movement — speed up as fewer remain
      const aliveCount = s.enemies.filter(e => e.alive).length;
      const speedUp = Math.max(1, Math.floor((ENEMY_ROWS * ENEMY_COLS - aliveCount) / 5));
      const interval = Math.max(3, s.enemyMoveInterval - speedUp * 3);

      s.enemyMoveTimer++;
      if (s.enemyMoveTimer >= interval) {
        s.enemyMoveTimer = 0;
        s.enemyAnimFrame = 1 - s.enemyAnimFrame;

        if (s.enemyDropTarget > 0) {
          // Drop down
          for (const e of s.enemies) {
            if (e.alive) e.y += 12;
          }
          s.enemyDropTarget--;
          if (s.enemyDropTarget === 0) s.enemyDir *= -1;
        } else {
          // Move horizontally
          let needsDrop = false;
          for (const e of s.enemies) {
            if (!e.alive) continue;
            if ((s.enemyDir > 0 && e.x + ENEMY_W > W - 20) ||
                (s.enemyDir < 0 && e.x < 20)) {
              needsDrop = true;
              break;
            }
          }
          if (needsDrop) {
            s.enemyDropTarget = 1;
            for (const e of s.enemies) {
              if (e.alive) e.y += 12;
            }
            s.enemyDir *= -1;
          } else {
            for (const e of s.enemies) {
              if (e.alive) e.x += s.enemyDir * 8;
            }
          }
        }
      }

      // Enemy shooting
      if (s.frameCount - s.lastEnemyShot > Math.max(25, 80 - s.wave * 7)) {
        const alive = s.enemies.filter(e => e.alive);
        if (alive.length > 0) {
          // Pick from bottom-most enemies per column
          const cols = new Map<number, Enemy>();
          for (const e of alive) {
            const col = Math.round(e.x / ENEMY_PAD_X);
            if (!cols.has(col) || e.y > cols.get(col)!.y) {
              cols.set(col, e);
            }
          }
          const shooters = Array.from(cols.values());
          const shooter = shooters[Math.floor(Math.random() * shooters.length)];
          s.enemyBullets.push({
            x: shooter.x + ENEMY_W / 2,
            y: shooter.y + ENEMY_H,
            vy: 2.5 + s.wave * 0.4,
          });
          s.lastEnemyShot = s.frameCount;
        }
      }

      // Enemy bullets
      for (let i = s.enemyBullets.length - 1; i >= 0; i--) {
        s.enemyBullets[i].y += s.enemyBullets[i].vy;
        if (s.enemyBullets[i].y > H + 10) {
          s.enemyBullets.splice(i, 1);
          continue;
        }

        const b = s.enemyBullets[i];
        if (!b) continue;

        // Hit shields
        let shieldHit = false;
        for (const shield of s.shields) {
          if (b.x >= shield.x && b.x <= shield.x + SHIELD_W * PIXEL_SIZE &&
              b.y >= shield.y && b.y <= shield.y + SHIELD_H * PIXEL_SIZE) {
            if (damageShield(shield, b.x, b.y, 2)) {
              s.enemyBullets.splice(i, 1);
              spawnExplosion(b.x, b.y, COLORS.shield, 4);
              shieldHit = true;
              break;
            }
          }
        }
        if (shieldHit) continue;

        // Hit player
        if (b.x > s.player.x && b.x < s.player.x + PLAYER_W &&
            b.y > s.player.y && b.y < s.player.y + PLAYER_H) {
          s.enemyBullets.splice(i, 1);
          s.lives--;
          s.screenShake = 12;
          s.flashAlpha = 0.4;
          spawnExplosion(s.player.x + PLAYER_W / 2, s.player.y, COLORS.player, 20);
          setLives(s.lives);
          if (s.lives <= 0) {
            s.gameState = 'gameover';
            setGameState('gameover');
            if (s.score > highScore) {
              setHighScore(s.score);
              localStorage.setItem('si_highscore', String(s.score));
            }
          }
        }
      }

      // Player bullet collisions
      for (let bi = s.bullets.length - 1; bi >= 0; bi--) {
        const b = s.bullets[bi];
        if (!b) continue;

        // Hit shields
        let shieldHit = false;
        for (const shield of s.shields) {
          if (b.x >= shield.x && b.x <= shield.x + SHIELD_W * PIXEL_SIZE &&
              b.y >= shield.y && b.y <= shield.y + SHIELD_H * PIXEL_SIZE) {
            if (damageShield(shield, b.x, b.y, 1)) {
              s.bullets.splice(bi, 1);
              shieldHit = true;
              break;
            }
          }
        }
        if (shieldHit) continue;

        // Hit enemies
        let enemyHit = false;
        for (const e of s.enemies) {
          if (!e.alive) continue;
          if (b.x > e.x && b.x < e.x + ENEMY_W &&
              b.y > e.y && b.y < e.y + ENEMY_H) {
            e.alive = false;
            s.bullets.splice(bi, 1);
            const pts = ENEMY_POINTS[e.type === 0 ? 0 : e.type === 1 ? 1 : 3];
            s.score += pts;
            setScore(s.score);
            spawnExplosion(e.x + ENEMY_W / 2, e.y + ENEMY_H / 2, COLORS.enemyRow[e.type === 0 ? 0 : e.type === 1 ? 1 : 3], 12);
            enemyHit = true;
            break;
          }
        }
        if (enemyHit) continue;

        // Hit UFO
        if (s.ufo.active && b.x > s.ufo.x && b.x < s.ufo.x + 30 &&
            b.y > s.ufo.y && b.y < s.ufo.y + 14) {
          s.ufo.active = false;
          s.bullets.splice(bi, 1);
          const ufoPoints = [50, 100, 150, 200, 300][Math.floor(Math.random() * 5)];
          s.score += ufoPoints;
          setScore(s.score);
          spawnExplosion(s.ufo.x + 15, s.ufo.y + 7, COLORS.ufo, 18);
          s.screenShake = 4;
        }
      }

      // Enemy reaching shields / player level
      for (const e of s.enemies) {
        if (e.alive) {
          // Eat through shields
          for (const shield of s.shields) {
            if (e.x + ENEMY_W > shield.x && e.x < shield.x + SHIELD_W * PIXEL_SIZE &&
                e.y + ENEMY_H > shield.y && e.y < shield.y + SHIELD_H * PIXEL_SIZE) {
              damageShield(shield, e.x + ENEMY_W / 2, e.y + ENEMY_H, 4);
            }
          }
          // Reached player
          if (e.y + ENEMY_H >= s.player.y) {
            s.gameState = 'gameover';
            setGameState('gameover');
            s.lives = 0;
            setLives(0);
            if (s.score > highScore) {
              setHighScore(s.score);
              localStorage.setItem('si_highscore', String(s.score));
            }
          }
        }
      }

      // UFO
      s.ufoTimer++;
      if (!s.ufo.active && s.ufoTimer > 600 + Math.random() * 400) {
        s.ufoTimer = 0;
        s.ufo.active = true;
        s.ufo.dir = Math.random() > 0.5 ? 1 : -1;
        s.ufo.x = s.ufo.dir > 0 ? -30 : W + 30;
        s.ufo.y = 28;
      }
      if (s.ufo.active) {
        s.ufo.x += s.ufo.dir * 2;
        if (s.ufo.x > W + 40 || s.ufo.x < -40) s.ufo.active = false;
      }

      // Wave complete
      if (s.enemies.every(e => !e.alive)) {
        s.wave++;
        setWave(s.wave);
        initWave(s.wave);
      }

      // Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) s.particles.splice(i, 1);
      }

      // Effects decay
      if (s.screenShake > 0) s.screenShake--;
      if (s.flashAlpha > 0) s.flashAlpha -= 0.03;
      if (s.waveAnnounce > 0) s.waveAnnounce--;
    }

    // ── Render ──
    ctx.save();

    // Screen shake
    if (s.screenShake > 0) {
      ctx.translate(
        (Math.random() - 0.5) * s.screenShake * 1.5,
        (Math.random() - 0.5) * s.screenShake * 1.5
      );
    }

    // Background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, W, H);

    // Stars
    for (const star of s.stars) {
      const twinkle = 0.5 + 0.5 * Math.sin(s.frameCount * 0.03 + star.x);
      ctx.globalAlpha = star.brightness * twinkle;
      ctx.fillStyle = COLORS.stars;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
    ctx.globalAlpha = 1;

    // Shields
    for (const shield of s.shields) {
      ctx.fillStyle = COLORS.shield;
      for (let r = 0; r < SHIELD_H; r++) {
        for (let c = 0; c < SHIELD_W; c++) {
          if (shield.pixels[r][c]) {
            ctx.fillRect(shield.x + c * PIXEL_SIZE, shield.y + r * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
          }
        }
      }
    }

    // Enemies
    for (const e of s.enemies) {
      if (!e.alive) continue;
      const spriteType = e.type === 0 ? 0 : e.type === 1 ? 1 : 2;
      const sprite = INVADER_SPRITES[spriteType][s.enemyAnimFrame];
      const color = COLORS.enemyRow[e.type === 0 ? 0 : e.type === 1 ? 1 : 3];
      drawPixelSprite(ctx, sprite, e.x, e.y, color, 2.5);
    }

    // UFO
    if (s.ufo.active) {
      drawPixelSprite(ctx, UFO_SPRITE, s.ufo.x, s.ufo.y, COLORS.ufo, 2);
    }

    // Player
    if (s.gameState === 'playing' || s.gameState === 'paused') {
      drawPixelSprite(ctx, PLAYER_SPRITE, s.player.x, s.player.y, COLORS.player, PLAYER_W / 15);
      // Glow underneath
      ctx.fillStyle = 'rgba(59,130,246,0.15)';
      ctx.fillRect(s.player.x + 2, s.player.y + PLAYER_H, PLAYER_W - 4, 3);
    }

    // Player bullets
    ctx.fillStyle = COLORS.bullet;
    ctx.shadowColor = COLORS.bullet;
    ctx.shadowBlur = 6;
    for (const b of s.bullets) {
      ctx.fillRect(b.x - 1.5, b.y, 3, 10);
    }
    ctx.shadowBlur = 0;

    // Enemy bullets
    ctx.shadowColor = COLORS.enemyBullet;
    ctx.shadowBlur = 4;
    for (const b of s.enemyBullets) {
      ctx.fillStyle = COLORS.enemyBullet;
      // Zigzag bullet shape
      const yOff = Math.sin(b.y * 0.3) * 2;
      ctx.fillRect(b.x - 1.5 + yOff, b.y, 3, 4);
      ctx.fillRect(b.x - 1.5 - yOff, b.y + 4, 3, 4);
    }
    ctx.shadowBlur = 0;

    // Particles
    for (const p of s.particles) {
      ctx.globalAlpha = p.life / 40;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    // Hit flash
    if (s.flashAlpha > 0) {
      ctx.fillStyle = `rgba(239,68,68,${s.flashAlpha})`;
      ctx.fillRect(0, 0, W, H);
    }

    // Ground line
    ctx.fillStyle = COLORS.player;
    ctx.fillRect(0, H - 18, W, 1);

    // HUD
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE  ${String(s.score).padStart(5, '0')}`, 14, 20);
    ctx.textAlign = 'center';
    ctx.fillText(`WAVE ${s.wave}`, W / 2, 20);
    ctx.textAlign = 'right';
    ctx.fillText(`HI  ${String(Math.max(s.score, highScore)).padStart(5, '0')}`, W - 14, 20);
    ctx.textAlign = 'left';

    // Lives
    for (let i = 0; i < s.lives; i++) {
      drawPixelSprite(ctx, PLAYER_SPRITE, 14 + i * 30, H - 14, COLORS.player, 1.5);
    }

    // Wave announce
    if (s.waveAnnounce > 0 && s.gameState === 'playing') {
      const alpha = s.waveAnnounce > 90 ? (120 - s.waveAnnounce) / 30 : s.waveAnnounce / 90;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = COLORS.text;
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`WAVE ${s.wave}`, W / 2, H / 2 - 20);
      ctx.font = '14px monospace';
      ctx.fillText('GET READY', W / 2, H / 2 + 10);
      ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
    }

    // Pause overlay
    if (s.gameState === 'paused') {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = COLORS.text;
      ctx.font = 'bold 32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', W / 2, H / 2 - 10);
      ctx.font = '14px monospace';
      ctx.fillText('Press P to resume', W / 2, H / 2 + 20);
      ctx.textAlign = 'left';
    }

    // Game over overlay
    if (s.gameState === 'gameover') {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', W / 2, H / 2 - 40);
      ctx.fillStyle = COLORS.text;
      ctx.font = '18px monospace';
      ctx.fillText(`SCORE: ${s.score}`, W / 2, H / 2);
      if (s.score >= highScore && s.score > 0) {
        ctx.fillStyle = '#fbbf24';
        ctx.fillText('NEW HIGH SCORE!', W / 2, H / 2 + 30);
      }
      ctx.fillStyle = COLORS.text;
      ctx.font = '14px monospace';
      ctx.fillText('Press ENTER or click to restart', W / 2, H / 2 + 65);
      ctx.textAlign = 'left';
    }

    // Menu
    if (s.gameState === 'menu') {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = COLORS.text;
      ctx.font = 'bold 32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SPACE INVADERS', W / 2, H / 2 - 60);

      // Draw sample invaders
      drawPixelSprite(ctx, INVADER_0A, W / 2 - 60, H / 2 - 35, COLORS.enemyRow[0], 2);
      ctx.fillStyle = COLORS.text;
      ctx.font = '12px monospace';
      ctx.fillText('= 30 pts', W / 2, H / 2 - 25);

      drawPixelSprite(ctx, INVADER_1A, W / 2 - 63, H / 2 - 5, COLORS.enemyRow[1], 2);
      ctx.fillText('= 20 pts', W / 2, H / 2 + 5);

      drawPixelSprite(ctx, INVADER_2A, W / 2 - 65, H / 2 + 25, COLORS.enemyRow[3], 2);
      ctx.fillText('= 10 pts', W / 2, H / 2 + 35);

      drawPixelSprite(ctx, UFO_SPRITE, W / 2 - 65, H / 2 + 55, COLORS.ufo, 2);
      ctx.fillText('= ???', W / 2, H / 2 + 65);

      ctx.fillStyle = COLORS.text;
      ctx.font = '15px monospace';
      ctx.fillText('Press ENTER or click to start', W / 2, H / 2 + 100);

      ctx.font = '11px monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText('A/D or Arrows: Move  |  Space: Shoot  |  P: Pause', W / 2, H / 2 + 125);
      ctx.textAlign = 'left';
    }

    ctx.restore();

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [initWave, spawnExplosion, damageShield, highScore]);

  // ─── Event Handlers ────────────────────────────────────────────────────

  useEffect(() => {
    const s = stateRef.current;

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      s.keys.add(key === ' ' ? ' ' : key);

      if (key === 'p' && s.gameState === 'playing') {
        s.gameState = 'paused';
        setGameState('paused');
        e.preventDefault();
      } else if (key === 'p' && s.gameState === 'paused') {
        s.gameState = 'playing';
        setGameState('playing');
        e.preventDefault();
      }

      if (key === 'enter') {
        if (s.gameState === 'menu' || s.gameState === 'gameover') {
          startGame();
        }
      }

      if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '].includes(key)) {
        e.preventDefault();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      s.keys.delete(key === ' ' ? ' ' : key);
    };

    const onClick = () => {
      if (s.gameState === 'menu' || s.gameState === 'gameover') {
        startGame();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvasRef.current?.addEventListener('click', onClick);

    rafRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvasRef.current?.removeEventListener('click', onClick);
      cancelAnimationFrame(rafRef.current);
    };
  }, [gameLoop, startGame]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full flex items-center justify-center bg-[#0a0a12]"
    >
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="block max-w-full max-h-full"
        style={{ imageRendering: 'pixelated' }}
        tabIndex={0}
      />
    </div>
  );
};
