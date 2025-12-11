import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';

export const DVDScreensaver = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hitCount, setHitCount] = useState(0);
  const [cornerHits, setCornerHits] = useState(0);
  const animationRef = useRef<number>();
  const logoRef = useRef({
    x: 100,
    y: 100,
    dx: 2,
    dy: 2,
    width: 120,
    height: 60,
    color: '#FF0000'
  });

  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 800;
    canvas.height = 600;

    const animate = () => {
      if (!isPlaying) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const logo = logoRef.current;

      // Clear canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update position
      logo.x += logo.dx;
      logo.y += logo.dy;

      let hit = false;
      let cornerHit = false;

      // Check collisions
      if (logo.x + logo.width >= canvas.width || logo.x <= 0) {
        logo.dx = -logo.dx;
        hit = true;
        if ((logo.y <= 0 && logo.x <= 0) || 
            (logo.y <= 0 && logo.x + logo.width >= canvas.width) ||
            (logo.y + logo.height >= canvas.height && logo.x <= 0) ||
            (logo.y + logo.height >= canvas.height && logo.x + logo.width >= canvas.width)) {
          cornerHit = true;
        }
      }
      if (logo.y + logo.height >= canvas.height || logo.y <= 0) {
        logo.dy = -logo.dy;
        hit = true;
        if ((logo.y <= 0 && logo.x <= 0) || 
            (logo.y <= 0 && logo.x + logo.width >= canvas.width) ||
            (logo.y + logo.height >= canvas.height && logo.x <= 0) ||
            (logo.y + logo.height >= canvas.height && logo.x + logo.width >= canvas.width)) {
          cornerHit = true;
        }
      }

      // Change color on hit
      if (hit) {
        logo.color = colors[Math.floor(Math.random() * colors.length)];
        setHitCount(prev => prev + 1);
        if (cornerHit) {
          setCornerHits(prev => prev + 1);
        }
      }

      // Draw DVD logo
      ctx.fillStyle = logo.color;
      ctx.fillRect(logo.x, logo.y, logo.width, logo.height);
      
      // Draw "DVD" text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 30px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('DVD', logo.x + logo.width / 2, logo.y + logo.height / 2);

      animationRef.current = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      animate();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  const reset = () => {
    logoRef.current = {
      x: 100,
      y: 100,
      dx: 2,
      dy: 2,
      width: 120,
      height: 60,
      color: '#FF0000'
    };
    setHitCount(0);
    setCornerHits(0);
  };

  return (
    <div className="h-full w-full bg-gradient-to-br from-gray-900 to-black p-6 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">DVD Screensaver</h1>
            <p className="text-gray-400">Watch the DVD logo bounce around!</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsPlaying(!isPlaying)} variant="outline">
              {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button onClick={reset} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        <Card className="p-4 bg-gray-800 border-gray-700">
          <canvas
            ref={canvasRef}
            className="w-full border-2 border-gray-600 rounded"
          />
        </Card>

        <Card className="p-4 bg-gray-800 border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-gray-400 text-sm">Wall Hits</p>
              <p className="text-3xl font-bold text-blue-400">{hitCount}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Corner Hits 🎯</p>
              <p className="text-3xl font-bold text-green-400">{cornerHits}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gray-800 border-gray-700">
          <p className="text-sm text-gray-400">
            The legendary DVD screensaver! Will it hit the corner? The suspense is real! 
            Corner hits are rare and special - keep watching! 👀
          </p>
        </Card>
      </div>
    </div>
  );
};
