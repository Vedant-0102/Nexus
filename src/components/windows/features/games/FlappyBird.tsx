import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

export const FlappyBird: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [bird, setBird] = useState<Bird>({ y: 250, velocity: 0 });
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const gameLoopRef = useRef<number>();

  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 800;
  const BIRD_SIZE = 30;
  const PIPE_WIDTH = 60;
  const PIPE_GAP = 150;
  const GRAVITY = 0.5;
  const JUMP_STRENGTH = -8;
  const PIPE_SPEED = 3;

  useEffect(() => {
    if (gameStarted && !gameOver) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameStarted, gameOver, bird, pipes]);

  const gameLoop = () => {
    updateBird();
    updatePipes();
    checkCollisions();
    draw();
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };

  const updateBird = () => {
    setBird(prev => ({
      y: prev.y + prev.velocity,
      velocity: prev.velocity + GRAVITY
    }));
  };

  const updatePipes = () => {
    setPipes(prev => {
      let newPipes = prev.map(pipe => ({
        ...pipe,
        x: pipe.x - PIPE_SPEED
      }));

      // Remove off-screen pipes
      newPipes = newPipes.filter(pipe => pipe.x > -PIPE_WIDTH);

      // Add new pipe
      if (newPipes.length === 0 || newPipes[newPipes.length - 1].x < CANVAS_WIDTH - 250) {
        newPipes.push({
          x: CANVAS_WIDTH,
          gapY: Math.random() * (CANVAS_HEIGHT - PIPE_GAP - 100) + 50,
          passed: false
        });
      }

      // Update score
      newPipes.forEach(pipe => {
        if (!pipe.passed && pipe.x + PIPE_WIDTH < CANVAS_WIDTH / 2 - BIRD_SIZE / 2) {
          pipe.passed = true;
          setScore(s => s + 1);
        }
      });

      return newPipes;
    });
  };

  const checkCollisions = () => {
    // Check ground and ceiling
    if (bird.y < 0 || bird.y > CANVAS_HEIGHT - BIRD_SIZE) {
      endGame();
      return;
    }

    // Check pipe collisions
    const birdX = CANVAS_WIDTH / 2 - BIRD_SIZE / 2;
    pipes.forEach(pipe => {
      if (
        birdX + BIRD_SIZE > pipe.x &&
        birdX < pipe.x + PIPE_WIDTH &&
        (bird.y < pipe.gapY || bird.y + BIRD_SIZE > pipe.gapY + PIPE_GAP)
      ) {
        endGame();
      }
    });
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(100, 100, 40, 0, Math.PI * 2);
    ctx.arc(140, 100, 50, 0, Math.PI * 2);
    ctx.arc(180, 100, 40, 0, Math.PI * 2);
    ctx.fill();

    // Pipes
    pipes.forEach(pipe => {
      // Top pipe
      ctx.fillStyle = '#2ECC40';
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY);
      ctx.strokeStyle = '#01FF70';
      ctx.lineWidth = 3;
      ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY);
      
      // Pipe cap
      ctx.fillStyle = '#2ECC40';
      ctx.fillRect(pipe.x - 5, pipe.gapY - 20, PIPE_WIDTH + 10, 20);
      ctx.strokeRect(pipe.x - 5, pipe.gapY - 20, PIPE_WIDTH + 10, 20);

      // Bottom pipe
      ctx.fillStyle = '#2ECC40';
      ctx.fillRect(pipe.x, pipe.gapY + PIPE_GAP, PIPE_WIDTH, CANVAS_HEIGHT - pipe.gapY - PIPE_GAP);
      ctx.strokeRect(pipe.x, pipe.gapY + PIPE_GAP, PIPE_WIDTH, CANVAS_HEIGHT - pipe.gapY - PIPE_GAP);
      
      // Pipe cap
      ctx.fillStyle = '#2ECC40';
      ctx.fillRect(pipe.x - 5, pipe.gapY + PIPE_GAP, PIPE_WIDTH + 10, 20);
      ctx.strokeRect(pipe.x - 5, pipe.gapY + PIPE_GAP, PIPE_WIDTH + 10, 20);
    });

    // Bird
    const birdX = CANVAS_WIDTH / 2 - BIRD_SIZE / 2;
    
    // Bird body
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(birdX + BIRD_SIZE / 2, bird.y + BIRD_SIZE / 2, BIRD_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Bird eye
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(birdX + BIRD_SIZE / 2 + 5, bird.y + BIRD_SIZE / 2 - 3, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(birdX + BIRD_SIZE / 2 + 7, bird.y + BIRD_SIZE / 2 - 3, 3, 0, Math.PI * 2);
    ctx.fill();

    // Bird beak
    ctx.fillStyle = '#FF6347';
    ctx.beginPath();
    ctx.moveTo(birdX + BIRD_SIZE, bird.y + BIRD_SIZE / 2);
    ctx.lineTo(birdX + BIRD_SIZE + 10, bird.y + BIRD_SIZE / 2 - 3);
    ctx.lineTo(birdX + BIRD_SIZE + 10, bird.y + BIRD_SIZE / 2 + 3);
    ctx.closePath();
    ctx.fill();

    // Wing
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.ellipse(birdX + BIRD_SIZE / 2 - 5, bird.y + BIRD_SIZE / 2 + 5, 8, 12, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // Ground
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, CANVAS_HEIGHT - 60, CANVAS_WIDTH, 10);
  };

  const jump = () => {
    if (!gameStarted) {
      setGameStarted(true);
      setPipes([{ x: CANVAS_WIDTH, gapY: 200, passed: false }]);
    }
    if (!gameOver) {
      setBird(prev => ({ ...prev, velocity: JUMP_STRENGTH }));
    }
  };

  const endGame = () => {
    setGameOver(true);
    setGameStarted(false);
    if (score > highScore) {
      setHighScore(score);
    }
  };

  const resetGame = () => {
    setBird({ y: 250, velocity: 0 });
    setPipes([]);
    setScore(0);
    setGameOver(false);
    setGameStarted(false);
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted, gameOver]);

  return (
    <div className="h-full w-full bg-gradient-to-br from-sky-100 to-blue-200 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold dark:text-white">Flappy Bird</h1>
            <p className="text-gray-600 dark:text-gray-400">Tap or press Space to fly!</p>
          </div>
          <Button onClick={resetGame} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            New Game
          </Button>
        </div>

        <div className="flex justify-center">
          <Card className="p-6 dark:bg-gray-800 relative">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onClick={jump}
              className="border-4 border-gray-800 dark:border-gray-600 rounded-lg cursor-pointer"
            />
            
            {/* Score Display on Canvas */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2 pointer-events-none">
              <div className="text-6xl font-bold text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">
                {score}
              </div>
            </div>

            {/* High Score Display */}
            <div className="absolute top-24 right-12 pointer-events-none">
              <div className="bg-black/50 px-4 py-2 rounded-lg">
                <p className="text-sm text-yellow-400">HIGH SCORE</p>
                <p className="text-2xl font-bold text-white">{highScore}</p>
              </div>
            </div>
            
            {!gameStarted && !gameOver && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-white/95 dark:bg-gray-800/95 p-8 rounded-lg text-center shadow-2xl">
                  <Play className="h-16 w-16 mx-auto mb-4 text-blue-600" />
                  <p className="text-2xl font-bold">Click or Press Space to Start!</p>
                </div>
              </div>
            )}

            {gameOver && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-white/95 dark:bg-gray-800/95 p-10 rounded-lg text-center shadow-2xl">
                  <Trophy className="h-20 w-20 mx-auto mb-4 text-yellow-500" />
                  <h2 className="text-4xl font-bold mb-4">Game Over!</h2>
                  <p className="text-3xl mb-6 text-blue-600">Score: {score}</p>
                  {score === highScore && score > 0 && (
                    <p className="text-xl mb-4 text-yellow-600">🎉 New High Score! 🎉</p>
                  )}
                  <Button onClick={resetGame} className="pointer-events-auto" size="lg">
                    Play Again
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
