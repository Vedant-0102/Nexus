import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const PingPong: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const gameStateRef = useRef({
    ball: { x: 400, y: 300, dx: 4, dy: 4, radius: 8 },
    player: { x: 20, y: 250, width: 10, height: 100, speed: 6 },
    ai: { x: 770, y: 250, width: 10, height: 100, speed: 4 },
    canvas: { width: 800, height: 600 },
  });

  // Resize canvas to fit container
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const maxWidth = Math.min(rect.width - 32, 800);
      const maxHeight = Math.min(rect.height - 32, 600);
      
      canvas.width = maxWidth;
      canvas.height = maxHeight;
      
      const state = gameStateRef.current;
      state.canvas.width = maxWidth;
      state.canvas.height = maxHeight;
      
      // Reposition elements proportionally
      state.ball.x = maxWidth / 2;
      state.ball.y = maxHeight / 2;
      state.player.y = maxHeight / 2 - state.player.height / 2;
      state.ai.x = maxWidth - 30;
      state.ai.y = maxHeight / 2 - state.ai.height / 2;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const draw = () => {
      const { ball, player, ai, canvas: canvasSize } = gameStateRef.current;

      // Clear canvas
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

      // Draw center line
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(canvasSize.width / 2, 0);
      ctx.lineTo(canvasSize.width / 2, canvasSize.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw paddles
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(player.x, player.y, player.width, player.height);
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(ai.x, ai.y, ai.width, ai.height);

      // Draw ball
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
    };

    const update = () => {
      if (!isPlaying) return;

      const { ball, player, ai, canvas: canvasSize } = gameStateRef.current;

      // Move ball
      ball.x += ball.dx;
      ball.y += ball.dy;

      // Ball collision with top/bottom - FIXED: Keep ball in bounds
      if (ball.y - ball.radius <= 0) {
        ball.y = ball.radius;
        ball.dy = Math.abs(ball.dy);
      } else if (ball.y + ball.radius >= canvasSize.height) {
        ball.y = canvasSize.height - ball.radius;
        ball.dy = -Math.abs(ball.dy);
      }

      // Ball collision with player paddle
      if (
        ball.x - ball.radius <= player.x + player.width &&
        ball.y >= player.y &&
        ball.y <= player.y + player.height &&
        ball.dx < 0
      ) {
        ball.x = player.x + player.width + ball.radius;
        ball.dx = Math.abs(ball.dx);
        const hitPos = (ball.y - (player.y + player.height / 2)) / (player.height / 2);
        ball.dy = hitPos * 5;
      }

      // Ball collision with AI paddle
      if (
        ball.x + ball.radius >= ai.x &&
        ball.y >= ai.y &&
        ball.y <= ai.y + ai.height &&
        ball.dx > 0
      ) {
        ball.x = ai.x - ball.radius;
        ball.dx = -Math.abs(ball.dx);
        const hitPos = (ball.y - (ai.y + ai.height / 2)) / (ai.height / 2);
        ball.dy = hitPos * 5;
      }

      // AI movement
      const aiCenter = ai.y + ai.height / 2;
      if (ball.x > canvasSize.width / 2) {
        if (aiCenter < ball.y - 10) {
          ai.y += ai.speed;
        } else if (aiCenter > ball.y + 10) {
          ai.y -= ai.speed;
        }
      }

      // Keep AI paddle in bounds
      ai.y = Math.max(0, Math.min(canvasSize.height - ai.height, ai.y));

      // Score - only when ball goes past paddles
      if (ball.x - ball.radius <= 0) {
        setScore(prev => ({ ...prev, ai: prev.ai + 1 }));
        resetBall();
      } else if (ball.x + ball.radius >= canvasSize.width) {
        setScore(prev => ({ ...prev, player: prev.player + 1 }));
        resetBall();
      }

      // Extra safety: Keep ball in horizontal bounds
      if (ball.x < ball.radius) {
        ball.x = ball.radius;
      } else if (ball.x > canvasSize.width - ball.radius) {
        ball.x = canvasSize.width - ball.radius;
      }
    };

    const resetBall = () => {
      const { ball, canvas: canvasSize } = gameStateRef.current;
      ball.x = canvasSize.width / 2;
      ball.y = canvasSize.height / 2;
      ball.dx = (Math.random() > 0.5 ? 1 : -1) * 4;
      ball.dy = (Math.random() - 0.5) * 4;
    };

    const gameLoop = () => {
      update();
      draw();
      animationId = requestAnimationFrame(gameLoop);
    };

    // Handle mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseY = e.clientY - rect.top;
      const { player, canvas: canvasSize } = gameStateRef.current;
      player.y = Math.max(0, Math.min(canvasSize.height - player.height, mouseY - player.height / 2));
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    gameLoop();

    return () => {
      cancelAnimationFrame(animationId);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isPlaying]);

  const handleReset = () => {
    setScore({ player: 0, ai: 0 });
    const { ball, player, ai, canvas } = gameStateRef.current;
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = 4;
    ball.dy = 4;
    player.y = 250;
    ai.y = 250;
    setIsPlaying(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{score.player}</div>
            <div className="text-xs text-gray-400">Player</div>
          </div>
          <div className="text-gray-500">-</div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{score.ai}</div>
            <div className="text-xs text-gray-400">AI</div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setIsPlaying(!isPlaying)}
            variant="outline"
            size="sm"
            className="bg-gray-800 border-gray-600 hover:bg-gray-700"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            className="bg-gray-800 border-gray-600 hover:bg-gray-700"
          >
            <RotateCcw size={16} />
          </Button>
        </div>
      </div>

      {/* Game Canvas */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center p-4">
        <canvas
          ref={canvasRef}
          className="border-2 border-gray-700 rounded-lg"
        />
      </div>

      {/* Instructions */}
      <div className="p-4 border-t border-gray-700 bg-gray-800 text-center text-sm text-gray-400">
        Move your mouse to control the green paddle • First to 10 wins!
      </div>
    </div>
  );
};
