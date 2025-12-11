import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCw } from 'lucide-react';

export const Breakout: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  
  const gameState = useRef({
    paddle: { x: 200, y: 380, width: 100, height: 10, speed: 8 },
    ball: { x: 250, y: 370, dx: 1.5, dy: -1.5, radius: 8 },
    bricks: [] as { x: number; y: number; status: number }[],
    keys: { left: false, right: false },
    mouseX: 250
  });

  useEffect(() => {
    initBricks();
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
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') gameState.current.keys.left = false;
      if (e.key === 'ArrowRight') gameState.current.keys.right = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      gameState.current.mouseX = e.clientX - rect.left;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, [isPaused, gameOver]);

  const initBricks = () => {
    const bricks = [];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 8; col++) {
        bricks.push({ x: col * 62 + 3, y: row * 22 + 30, status: 1 });
      }
    }
    gameState.current.bricks = bricks;
  };

  const update = () => {
    const { paddle, ball, bricks, keys, mouseX } = gameState.current;

    // Mouse control (smooth follow)
    const targetX = mouseX - paddle.width / 2;
    paddle.x += (targetX - paddle.x) * 0.2;
    
    // Keyboard control (override mouse)
    if (keys.left && paddle.x > 0) paddle.x -= paddle.speed;
    if (keys.right && paddle.x < 500 - paddle.width) paddle.x += paddle.speed;
    
    // Keep paddle in bounds
    paddle.x = Math.max(0, Math.min(500 - paddle.width, paddle.x));

    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.x + ball.radius > 500 || ball.x - ball.radius < 0) ball.dx = -ball.dx;
    if (ball.y - ball.radius < 0) ball.dy = -ball.dy;

    // Paddle collision with angle variation
    if (ball.y + ball.radius > paddle.y && ball.y - ball.radius < paddle.y + paddle.height &&
        ball.x > paddle.x && ball.x < paddle.x + paddle.width && ball.dy > 0) {
      ball.dy = -Math.abs(ball.dy);
      // Add angle based on where ball hits paddle
      const hitPos = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
      ball.dx = hitPos * 2;
    }

    if (ball.y + ball.radius > 400) {
      setLives(prev => {
        const newLives = prev - 1;
        if (newLives <= 0) setGameOver(true);
        return newLives;
      });
      ball.x = 250;
      ball.y = 370;
      ball.dx = 1.5;
      ball.dy = -1.5;
    }

    bricks.forEach(brick => {
      if (brick.status === 1) {
        if (ball.x > brick.x && ball.x < brick.x + 60 &&
            ball.y > brick.y && ball.y < brick.y + 20) {
          ball.dy = -ball.dy;
          brick.status = 0;
          setScore(prev => prev + 10);
        }
      }
    });
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const { paddle, ball, bricks } = gameState.current;

    ctx.clearRect(0, 0, 500, 400);

    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.closePath();

    const colors = ['#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4'];
    bricks.forEach((brick, i) => {
      if (brick.status === 1) {
        ctx.fillStyle = colors[Math.floor(i / 8) % colors.length];
        ctx.fillRect(brick.x, brick.y, 60, 20);
      }
    });
  };

  const resetGame = () => {
    setScore(0);
    setLives(3);
    setGameOver(false);
    setIsPaused(false);
    gameState.current.ball = { x: 250, y: 370, dx: 1.5, dy: -1.5, radius: 8 };
    gameState.current.paddle.x = 200;
    initBricks();
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-900 to-purple-900">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold dark:text-white">Breakout</h2>
          <div className="flex gap-2">
            <button onClick={() => setIsPaused(!isPaused)} className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded">
              {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
            </button>
            <button onClick={resetGame} className="p-2 bg-green-500 hover:bg-green-600 text-white rounded">
              <RotateCw className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="flex justify-between mb-2 text-lg font-semibold dark:text-white">
          <span>Score: {score}</span>
          <span>Lives: {lives}</span>
        </div>
        
        <canvas ref={canvasRef} width={500} height={400} className="border-4 border-gray-800 dark:border-gray-600 rounded bg-gray-900" />
        
        {gameOver && (
          <div className="mt-4 text-center">
            <p className="text-xl font-bold text-red-500 mb-2">Game Over!</p>
            <button onClick={resetGame} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded">
              Play Again
            </button>
          </div>
        )}
        
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">Use Arrow Keys or Mouse to move paddle</p>
      </div>
    </div>
  );
};
