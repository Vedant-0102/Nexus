import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCw } from 'lucide-react';

interface Enemy {
  x: number;
  y: number;
  alive: boolean;
}

interface Bullet {
  x: number;
  y: number;
}

interface EnemyBullet {
  x: number;
  y: number;
}

export const SpaceInvaders = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  
  const gameState = useRef({
    player: { x: 225, y: 360, width: 40, height: 20, speed: 6 },
    bullets: [] as Bullet[],
    enemies: [] as Enemy[],
    enemyBullets: [] as EnemyBullet[],
    enemyDirection: 1,
    enemySpeed: 1,
    enemyMoveDown: false,
    keys: { left: false, right: false, space: false },
    lastShot: 0,
    lastEnemyShot: 0,
    frameCount: 0
  });

  useEffect(() => {
    initEnemies();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const gameLoop = () => {
      if (!isPaused && !gameOver) {
        update();
        draw(ctx);
      }
      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') gameState.current.keys.left = true;
      if (e.key === 'ArrowRight') gameState.current.keys.right = true;
      if (e.key === ' ') {
        e.preventDefault();
        gameState.current.keys.space = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') gameState.current.keys.left = false;
      if (e.key === 'ArrowRight') gameState.current.keys.right = false;
      if (e.key === ' ') gameState.current.keys.space = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationId);
    };
  }, [isPaused, gameOver]);

  const initEnemies = () => {
    const enemies: Enemy[] = [];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 11; col++) {
        enemies.push({ 
          x: col * 45 + 10, 
          y: row * 35 + 30, 
          alive: true 
        });
      }
    }
    gameState.current.enemies = enemies;
    gameState.current.enemyDirection = 1;
    gameState.current.enemySpeed = 1 + (level - 1) * 0.3;
  };

  const update = () => {
    const { player, bullets, enemies, enemyBullets, keys } = gameState.current;
    const now = Date.now();
    gameState.current.frameCount++;

    // Player movement
    if (keys.left && player.x > 0) player.x -= player.speed;
    if (keys.right && player.x < 500 - player.width) player.x += player.speed;
    
    // Player shooting
    if (keys.space && now - gameState.current.lastShot > 300) {
      bullets.push({ x: player.x + player.width / 2, y: player.y });
      gameState.current.lastShot = now;
    }

    // Update player bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      bullets[i].y -= 8;
      if (bullets[i].y < 0) bullets.splice(i, 1);
    }

    // Move enemies
    if (gameState.current.frameCount % 30 === 0) {
      let shouldMoveDown = false;
      const aliveEnemies = enemies.filter(e => e.alive);
      
      // Check if any enemy hit the edge
      for (const enemy of aliveEnemies) {
        if ((gameState.current.enemyDirection > 0 && enemy.x > 460) ||
            (gameState.current.enemyDirection < 0 && enemy.x < 10)) {
          shouldMoveDown = true;
          gameState.current.enemyDirection *= -1;
          break;
        }
      }

      // Move enemies
      for (const enemy of enemies) {
        if (enemy.alive) {
          if (shouldMoveDown) {
            enemy.y += 15;
          } else {
            enemy.x += gameState.current.enemyDirection * gameState.current.enemySpeed * 5;
          }
        }
      }

      // Check if enemies reached player
      for (const enemy of aliveEnemies) {
        if (enemy.y > 340) {
          setLives(prev => {
            const newLives = prev - 1;
            if (newLives <= 0) {
              setGameOver(true);
            }
            return newLives;
          });
          initEnemies();
          break;
        }
      }
    }

    // Enemy shooting
    if (gameState.current.frameCount % 60 === 0) {
      const aliveEnemies = enemies.filter(e => e.alive);
      if (aliveEnemies.length > 0) {
        const shooter = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
        enemyBullets.push({ x: shooter.x + 20, y: shooter.y + 30 });
      }
    }

    // Update enemy bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      enemyBullets[i].y += 4;
      if (enemyBullets[i].y > 400) {
        enemyBullets.splice(i, 1);
      }
    }

    // Check bullet-enemy collisions
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
      const bullet = bullets[bi];
      for (const enemy of enemies) {
        if (enemy.alive && 
            bullet.x > enemy.x && bullet.x < enemy.x + 35 &&
            bullet.y > enemy.y && bullet.y < enemy.y + 25) {
          enemy.alive = false;
          bullets.splice(bi, 1);
          setScore(prev => prev + 10);
          break;
        }
      }
    }

    // Check enemy bullet-player collisions
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      const bullet = enemyBullets[i];
      if (bullet.x > player.x && bullet.x < player.x + player.width &&
          bullet.y > player.y && bullet.y < player.y + player.height) {
        enemyBullets.splice(i, 1);
        setLives(prev => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            setGameOver(true);
          }
          return newLives;
        });
      }
    }

    // Check if all enemies defeated
    if (enemies.every(e => !e.alive)) {
      setLevel(prev => prev + 1);
      initEnemies();
    }
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const { player, bullets, enemies, enemyBullets } = gameState.current;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 500, 400);

    // Draw player
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    // Player cannon
    ctx.fillRect(player.x + player.width / 2 - 3, player.y - 8, 6, 8);

    // Draw player bullets
    ctx.fillStyle = '#fbbf24';
    bullets.forEach(bullet => {
      ctx.fillRect(bullet.x - 2, bullet.y, 4, 12);
    });

    // Draw enemies
    enemies.forEach(enemy => {
      if (enemy.alive) {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(enemy.x, enemy.y, 35, 25);
        // Enemy eyes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(enemy.x + 8, enemy.y + 8, 6, 6);
        ctx.fillRect(enemy.x + 21, enemy.y + 8, 6, 6);
      }
    });

    // Draw enemy bullets
    ctx.fillStyle = '#22c55e';
    enemyBullets.forEach(bullet => {
      ctx.fillRect(bullet.x - 2, bullet.y, 4, 12);
    });

    // Draw game over
    if (gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, 500, 400);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', 250, 180);
      ctx.font = '24px Arial';
      ctx.fillText(`Final Score: ${score}`, 250, 220);
      ctx.fillText('Press Reset to Play Again', 250, 260);
    }
  };

  const resetGame = () => {
    setScore(0);
    setLives(3);
    setLevel(1);
    setGameOver(false);
    setIsPaused(false);
    gameState.current.player.x = 225;
    gameState.current.bullets = [];
    gameState.current.enemyBullets = [];
    gameState.current.frameCount = 0;
    initEnemies();
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-black">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold dark:text-white">Space Invaders</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsPaused(!isPaused)} 
              className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
              disabled={gameOver}
            >
              {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
            </button>
            <button 
              onClick={resetGame} 
              className="p-2 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
            >
              <RotateCw className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="flex justify-between mb-2 text-lg font-semibold dark:text-white">
          <span>Score: {score}</span>
          <span>Level: {level}</span>
          <span>Lives: {'❤️'.repeat(lives)}</span>
        </div>
        
        <canvas 
          ref={canvasRef} 
          width={500} 
          height={400} 
          className="border-4 border-gray-800 dark:border-gray-600 rounded bg-black"
        />
        
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center space-y-1">
          <p><strong>Controls:</strong> Arrow Keys to move, Space to shoot</p>
          <p className="text-xs">Destroy all invaders before they reach you!</p>
        </div>
      </div>
    </div>
  );
};
