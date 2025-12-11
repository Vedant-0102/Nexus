import React, { useRef, useEffect, useState } from 'react';
import { Sparkles, Plus, Trash2, Settings } from 'lucide-react';

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  mass: number;
}

export const BallPitDesktop: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ballsRef = useRef<Ball[]>([]);
  const [ballCount, setBallCount] = useState(0);
  const [gravity, setGravity] = useState(0.5);
  const [isRunning, setIsRunning] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const ballIdCounter = useRef(0);
  const animationFrameId = useRef<number>();

  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'
  ];

  const createBall = (x: number, y: number, vx = 0, vy = 0) => {
    const newBall: Ball = {
      id: ballIdCounter.current++,
      x,
      y,
      vx,
      vy,
      radius: 15 + Math.random() * 15,
      color: colors[Math.floor(Math.random() * colors.length)],
      mass: 1
    };
    ballsRef.current.push(newBall);
    setBallCount(ballsRef.current.length);
  };

  const spawnRandomBalls = (count: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    for (let i = 0; i < count; i++) {
      const x = Math.random() * (canvas.width - 60) + 30;
      const y = Math.random() * 200 + 50;
      const vx = (Math.random() - 0.5) * 4;
      const vy = Math.random() * 2;
      createBall(x, y, vx, vy);
    }
  };

  useEffect(() => {
    // Initialize with some balls
    setTimeout(() => spawnRandomBalls(20), 100);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - 48; // Account for taskbar
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = () => {
      if (!isRunning) {
        animationFrameId.current = requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const balls = ballsRef.current;

      // Update balls
      balls.forEach(ball => {
        // Apply gravity
        ball.vy += gravity;
        ball.vx *= 0.999; // Air resistance
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Bounce off walls with better physics
        if (ball.x - ball.radius < 0) {
          ball.vx = Math.abs(ball.vx) * 0.85; // Bounce right
          ball.x = ball.radius;
        } else if (ball.x + ball.radius > canvas.width) {
          ball.vx = -Math.abs(ball.vx) * 0.85; // Bounce left
          ball.x = canvas.width - ball.radius;
        }

        // Bounce off floor with realistic physics
        if (ball.y + ball.radius > canvas.height) {
          ball.vy = -Math.abs(ball.vy) * 0.75; // Energy loss on bounce
          ball.y = canvas.height - ball.radius;
          ball.vx *= 0.96; // Friction
          
          // Stop tiny bounces
          if (Math.abs(ball.vy) < 0.5) {
            ball.vy = 0;
          }
        }

        // Bounce off ceiling
        if (ball.y - ball.radius < 0) {
          ball.vy = Math.abs(ball.vy) * 0.85;
          ball.y = ball.radius;
        }
      });

      // Ball-to-ball collisions
      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          const ball1 = balls[i];
          const ball2 = balls[j];

          const dx = ball2.x - ball1.x;
          const dy = ball2.y - ball1.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDist = ball1.radius + ball2.radius;

          if (distance < minDist) {
            // Collision detected
            const angle = Math.atan2(dy, dx);
            const sin = Math.sin(angle);
            const cos = Math.cos(angle);

            // Rotate velocities
            const vx1 = ball1.vx * cos + ball1.vy * sin;
            const vy1 = ball1.vy * cos - ball1.vx * sin;
            const vx2 = ball2.vx * cos + ball2.vy * sin;
            const vy2 = ball2.vy * cos - ball2.vx * sin;

            // Collision response
            const vx1Final = ((ball1.mass - ball2.mass) * vx1 + 2 * ball2.mass * vx2) / (ball1.mass + ball2.mass);
            const vx2Final = ((ball2.mass - ball1.mass) * vx2 + 2 * ball1.mass * vx1) / (ball1.mass + ball2.mass);

            // Rotate back
            ball1.vx = vx1Final * cos - vy1 * sin;
            ball1.vy = vy1 * cos + vx1Final * sin;
            ball2.vx = vx2Final * cos - vy2 * sin;
            ball2.vy = vy2 * cos + vx2Final * sin;

            // Separate balls
            const overlap = minDist - distance;
            const separationX = (overlap / 2) * cos;
            const separationY = (overlap / 2) * sin;
            ball1.x -= separationX;
            ball1.y -= separationY;
            ball2.x += separationX;
            ball2.y += separationY;
          }
        }
      }

      // Draw balls
      balls.forEach(ball => {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Add shine effect
        const gradient = ctx.createRadialGradient(
          ball.x - ball.radius / 3,
          ball.y - ball.radius / 3,
          0,
          ball.x,
          ball.y,
          ball.radius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      animationFrameId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isRunning, gravity]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    createBall(x, y, (Math.random() - 0.5) * 10, -Math.random() * 5);
  };

  const clearAllBalls = () => {
    ballsRef.current = [];
    setBallCount(0);
  };

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="absolute inset-0 cursor-crosshair bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800"
      />

      {/* Controls - 2x2 Grid */}
      <div className="absolute top-20 right-4 grid grid-cols-2 gap-3 z-10">
        <button
          onClick={() => spawnRandomBalls(1)}
          className="w-16 h-16 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg transition-all hover:scale-105"
          title="Add 1 ball"
        >
          <Sparkles className="h-6 w-6" />
        </button>

        <button
          onClick={() => spawnRandomBalls(10)}
          className="w-16 h-16 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-lg transition-all hover:scale-105 font-bold text-lg"
          title="Add 10 balls"
        >
          +10
        </button>

        <button
          onClick={clearAllBalls}
          className="w-16 h-16 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg transition-all hover:scale-105"
          title="Clear all balls"
        >
          <Trash2 className="h-6 w-6" />
        </button>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-16 h-16 flex items-center justify-center bg-purple-500 hover:bg-purple-600 text-white rounded-xl shadow-lg transition-all hover:scale-105"
          title="Settings"
        >
          <Settings className="h-6 w-6" />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-20 right-44 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 w-64 z-20 border-2 border-purple-500">
          <h3 className="font-semibold mb-3 dark:text-white">Ball Pit Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 block mb-2">
                Gravity: {gravity.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={gravity}
                onChange={(e) => setGravity(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded">
              <label className="text-sm text-gray-600 dark:text-gray-400 block">
                Ball Count: <span className="font-bold text-purple-600 dark:text-purple-400">{ballCount}</span>
              </label>
            </div>

            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`w-full py-2 rounded font-semibold ${
                isRunning
                  ? 'bg-yellow-500 hover:bg-yellow-600'
                  : 'bg-green-500 hover:bg-green-600'
              } text-white transition-colors`}
            >
              {isRunning ? 'Pause Physics' : 'Resume Physics'}
            </button>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur text-white px-4 py-2 rounded-lg text-sm">
        <p>Click anywhere to add balls • {ballCount} balls</p>
      </div>
    </div>
  );
};
