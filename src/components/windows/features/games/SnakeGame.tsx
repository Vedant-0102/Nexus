import React, { useState, useEffect, useCallback, useRef } from 'react';

// Define types
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type SnakePart = { x: number; y: number };

const GRID_SIZE = 25; // Increased grid size
const GAME_SPEED = 110; // ms
const CELL_SIZE = 16; // px

export const SnakeGame = () => {
  // Game state
  const [snake, setSnake] = useState<SnakePart[]>([
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 },
  ]);
  const [food, setFood] = useState<SnakePart>({ x: 15, y: 10 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [nextDirection, setNextDirection] = useState<Direction>('RIGHT');
  const gameAreaRef = useRef<HTMLDivElement>(null);
  
  // Generate random food position
  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    
    // Make sure food doesn't appear on the snake
    const isOnSnake = snake.some(part => part.x === newFood.x && part.y === newFood.y);
    if (isOnSnake) return generateFood();
    
    return newFood;
  }, [snake]);
  
  // Reset game
  const resetGame = () => {
    setSnake([
      { x: 8, y: 10 },
      { x: 7, y: 10 },
      { x: 6, y: 10 },
    ]);
    setDirection('RIGHT');
    setNextDirection('RIGHT');
    setFood(generateFood());
    setScore(0);
    setGameOver(false);
    setGameStarted(false);
    setIsPaused(false);
  };
  
  // Start game
  const startGame = () => {
    if (!gameStarted) {
      setGameStarted(true);
      setGameOver(false);
      setIsPaused(false);
      setScore(0);
      setDirection('RIGHT');
      setNextDirection('RIGHT');
      setSnake([
        { x: 8, y: 10 },
        { x: 7, y: 10 },
        { x: 6, y: 10 },
      ]);
      setFood(generateFood());
      
      // Focus the game area element after a slight delay
      setTimeout(() => {
        if (gameAreaRef.current) {
          gameAreaRef.current.focus();
        }
      }, 50);
    }
  };
  
  // Toggle pause
  const togglePause = () => {
    if (gameStarted && !gameOver) {
      setIsPaused(!isPaused);
    }
  };
  
  // Check if collision with walls or self
  const checkCollision = useCallback((head: SnakePart, snakeBody: SnakePart[]): boolean => {
    // Check walls
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }
    
    // Check self collision (skip the head itself)
    for (let i = 1; i < snakeBody.length; i++) {
      if (head.x === snakeBody[i].x && head.y === snakeBody[i].y) {
        return true;
      }
    }
    
    return false;
  }, []);
  
  // Move snake
  const moveSnake = useCallback(() => {
    if (!gameStarted || gameOver || isPaused) return;
    
    setSnake(prevSnake => {
      // Apply the next direction on this move
      const currentDirection = nextDirection;
      // Update the active direction
      setDirection(currentDirection);
      
      const newSnake = [...prevSnake];
      const head = { ...newSnake[0] };
      
      // Move head based on direction
      switch (currentDirection) {
        case 'UP':
          head.y -= 1;
          break;
        case 'DOWN':
          head.y += 1;
          break;
        case 'LEFT':
          head.x -= 1;
          break;
        case 'RIGHT':
          head.x += 1;
          break;
      }
      
      // Check collision
      if (checkCollision(head, newSnake)) {
        setGameOver(true);
        return prevSnake;
      }
      
      // Check if snake eats food
      if (head.x === food.x && head.y === food.y) {
        // Grow snake (don't remove tail)
        newSnake.unshift(head);
        // Generate new food
        setFood(generateFood());
        // Increase score
        setScore(prevScore => prevScore + 1);
        return newSnake;
      }
      
      // Move snake (remove tail)
      newSnake.unshift(head);
      newSnake.pop();
      return newSnake;
    });
  }, [nextDirection, food, gameStarted, gameOver, isPaused, checkCollision, generateFood]);
  
  // Game loop
  useEffect(() => {
    const gameInterval = setInterval(() => {
      moveSnake();
    }, GAME_SPEED);
    
    return () => clearInterval(gameInterval);
  }, [moveSnake]);
  
  // Handle keyboard input
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Prevent default behavior for arrow keys to avoid page scrolling
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }
    
    if (!gameStarted) {
      if (e.key === ' ' || e.key === 'Enter') {
        startGame();
      }
      return;
    }
    
    if (gameOver) {
      if (e.key === ' ' || e.key === 'Enter') {
        resetGame();
      }
      return;
    }
    
    if (e.key === ' ') {
      togglePause();
      return;
    }
    
    if (isPaused) return;
    
    // Queue next direction change
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        if (direction !== 'DOWN') setNextDirection('UP');
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        if (direction !== 'UP') setNextDirection('DOWN');
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        if (direction !== 'RIGHT') setNextDirection('LEFT');
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        if (direction !== 'LEFT') setNextDirection('RIGHT');
        break;
    }
  }, [direction, gameOver, gameStarted, isPaused, startGame, togglePause]);

  // Set up keyboard event listener
  useEffect(() => {
    const gameArea = gameAreaRef.current;
    if (!gameArea) return;

    gameArea.addEventListener('keydown', handleKeyDown);
    
    return () => {
      gameArea.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Focus game area when game starts
  useEffect(() => {
    if (gameStarted && gameAreaRef.current) {
      gameAreaRef.current.focus();
    }
  }, [gameStarted]);

  // Function to handle direction change from mobile controls
  const handleDirectionChange = (newDirection: Direction) => {
    if (!gameStarted || gameOver || isPaused) return;
    
    // Prevent 180 degree turns
    switch (newDirection) {
      case 'UP':
        if (direction !== 'DOWN') setNextDirection('UP');
        break;
      case 'DOWN':
        if (direction !== 'UP') setNextDirection('DOWN');
        break;
      case 'LEFT':
        if (direction !== 'RIGHT') setNextDirection('LEFT');
        break;
      case 'RIGHT':
        if (direction !== 'LEFT') setNextDirection('RIGHT');
        break;
    }
  };
  
  // Render game grid
  const renderGrid = () => {
    return (
      <div className="relative" style={{ width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE }}>
        {/* Render snake */}
        {snake.map((part, index) => (
          <div
            key={index}
            className="absolute rounded-sm"
            style={{
              width: CELL_SIZE - 1,
              height: CELL_SIZE - 1,
              left: part.x * CELL_SIZE,
              top: part.y * CELL_SIZE,
              backgroundColor: index === 0 ? '#22c55e' : '#4ade80', // Different color for head
            }}
          />
        ))}
        
        {/* Render food */}
        <div
          className="absolute bg-red-500 rounded-full"
          style={{
            width: CELL_SIZE - 2,
            height: CELL_SIZE - 2,
            left: food.x * CELL_SIZE,
            top: food.y * CELL_SIZE,
          }}
        />
      </div>
    );
  };

  return (
    <div 
      className="p-4 flex flex-col items-center justify-center h-full" 
      ref={gameAreaRef} 
      tabIndex={0}
      style={{ outline: 'none' }}
    >
      <h2 className="text-2xl font-semibold mb-2">Snake Game</h2>
      
      <div className="flex items-center justify-between w-full max-w-md mb-4">
        <div className="text-lg font-medium">Score: {score}</div>
        <div className="space-x-2">
          <button
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={gameStarted && !gameOver ? togglePause : startGame}
          >
            {!gameStarted ? 'Start' : isPaused ? 'Resume' : 'Pause'}
          </button>
          <button
            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
            onClick={resetGame}
          >
            Reset
          </button>
        </div>
      </div>
      
      <div className="border-2 border-gray-300 bg-gray-100 p-1 relative">
        {renderGrid()}
        
        {/* Game over overlay */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
            <div className="text-white text-xl font-bold mb-2">Game Over!</div>
            <div className="text-white mb-4">Final Score: {score}</div>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={resetGame}
            >
              Play Again
            </button>
          </div>
        )}
        
        {/* Start game overlay */}
        {!gameStarted && !gameOver && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
            <div className="text-white text-xl font-bold mb-4">Snake Game</div>
            <button
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              onClick={startGame}
            >
              Start Game
            </button>
            <div className="text-white text-sm mt-4">
              Use arrow keys or WASD to move
            </div>
          </div>
        )}
        
        {/* Pause overlay */}
        {isPaused && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
            <div className="text-white text-xl font-bold mb-2">Game Paused</div>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={togglePause}
            >
              Resume
            </button>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-center text-sm text-gray-600 max-w-md">
        <p>Use arrow keys or WASD to control the snake.</p>
        <p>Press space to pause/resume.</p>
      </div>

      {/* Mobile controls for touch devices */}
      <div className="mt-4 grid grid-cols-3 gap-2 touch-none">
        <div className="col-start-2 flex justify-center">
          <button
            className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center active:bg-gray-300"
            onClick={() => handleDirectionChange('UP')}
            onTouchStart={() => handleDirectionChange('UP')}
          >
            ↑
          </button>
        </div>
        <div className="col-span-3 flex justify-center space-x-4">
          <button
            className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center active:bg-gray-300"
            onClick={() => handleDirectionChange('LEFT')}
            onTouchStart={() => handleDirectionChange('LEFT')}
          >
            ←
          </button>
          <button
            className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center active:bg-gray-300"
            onClick={() => handleDirectionChange('DOWN')}
            onTouchStart={() => handleDirectionChange('DOWN')}
          >
            ↓
          </button>
          <button
            className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center active:bg-gray-300"
            onClick={() => handleDirectionChange('RIGHT')}
            onTouchStart={() => handleDirectionChange('RIGHT')}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
};