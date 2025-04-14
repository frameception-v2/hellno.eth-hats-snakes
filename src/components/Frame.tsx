"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { useFrameSDK } from "~/hooks/useFrameSDK";
import { SCORING, GAME_CONFIG } from "~/lib/constants";

type Position = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

function SnakeGame() {
  const [snake, setSnake] = useState<Position[]>([]);
  const [food, setFood] = useState<Position & { type: 'HAT' | 'ARROW' }>({ x: 0, y: 0, type: 'HAT' });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [touchStart, setTouchStart] = useState<Position | null>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();

  const initializeGame = () => {
    const initialSnake = [];
    for (let i = 0; i < GAME_CONFIG.INITIAL_SNAKE_LENGTH; i++) {
      initialSnake.push({ x: Math.floor(GAME_CONFIG.GRID_SIZE / 2), y: Math.floor(GAME_CONFIG.GRID_SIZE / 2) - i });
    }
    setSnake(initialSnake);
    spawnFood();
    setScore(0);
    setGameOver(false);
    setDirection('RIGHT');
  };

  const spawnFood = () => {
    const newFood = {
      x: Math.floor(Math.random() * GAME_CONFIG.GRID_SIZE),
      y: Math.floor(Math.random() * GAME_CONFIG.GRID_SIZE),
      type: Math.random() > 0.7 ? 'ARROW' : 'HAT' as 'ARROW' | 'HAT'
    };
    setFood(newFood);
  };

  const moveSnake = () => {
    if (gameOver) return;

    const newSnake = [...snake];
    const head = { ...newSnake[0] };

    switch (direction) {
      case 'UP': head.y -= 1; break;
      case 'DOWN': head.y += 1; break;
      case 'LEFT': head.x -= 1; break;
      case 'RIGHT': head.x += 1; break;
    }

    // Check wall collision
    if (head.x < 0 || head.x >= GAME_CONFIG.GRID_SIZE || head.y < 0 || head.y >= GAME_CONFIG.GRID_SIZE) {
      setGameOver(true);
      return;
    }

    // Check self collision
    if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
      setGameOver(true);
      return;
    }

    newSnake.unshift(head);

    // Check food collision
    if (head.x === food.x && head.y === food.y) {
      setScore(s => s + (food.type === 'HAT' ? SCORING.DEGEN_HAT : SCORING.ARROW));
      spawnFood();
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
  };

  useEffect(() => {
    initializeGame();
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, []);

  useEffect(() => {
    gameLoopRef.current = setInterval(moveSnake, GAME_CONFIG.GAME_SPEED);
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [snake, direction, gameOver]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp': setDirection('UP'); break;
      case 'ArrowDown': setDirection('DOWN'); break;
      case 'ArrowLeft': setDirection('LEFT'); break;
      case 'ArrowRight': setDirection('RIGHT'); break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    };

    const dx = touchEnd.x - touchStart.x;
    const dy = touchEnd.y - touchStart.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      setDirection(dx > 0 ? 'RIGHT' : 'LEFT');
    } else {
      setDirection(dy > 0 ? 'DOWN' : 'UP');
    }

    setTouchStart(null);
  };

  return (
    <Card 
      className="w-full h-full"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <CardHeader>
        <CardTitle>Score: {score}</CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          className="grid gap-1 bg-black p-4 rounded-lg shadow-lg"
          style={{
            gridTemplateColumns: `repeat(${GAME_CONFIG.GRID_SIZE}, 1fr)`,
            aspectRatio: '1/1',
            touchAction: 'none' // Prevents default touch behaviors
          }}
        >
          {Array.from({ length: GAME_CONFIG.GRID_SIZE * GAME_CONFIG.GRID_SIZE }).map((_, i) => {
            const x = i % GAME_CONFIG.GRID_SIZE;
            const y = Math.floor(i / GAME_CONFIG.GRID_SIZE);
            const isSnake = snake.some(segment => segment.x === x && segment.y === y);
            const isFood = food.x === x && food.y === y;

            return (
              <div
                key={i}
                className={`aspect-square rounded-sm flex items-center justify-center text-lg
                  ${isSnake ? 'bg-green-500' : 'bg-gray-800'} 
                  ${isSnake && i === snake[0].x + snake[0].y * GAME_CONFIG.GRID_SIZE ? 'bg-green-600' : ''}`}
              >
                {isFood && (
                  <span className="transform scale-150">
                    {food.type === 'HAT' ? GAME_CONFIG.COLLECTIBLES.HAT : GAME_CONFIG.COLLECTIBLES.ARROW}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {gameOver && (
          <button 
            onClick={initializeGame}
            className="mt-4 w-full bg-blue-500 text-white p-2 rounded"
          >
            Play Again
          </button>
        )}
      </CardContent>
    </Card>
  );
}

export default function Frame() {
  const { isSDKLoaded } = useFrameSDK();

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full max-w-[400px] mx-auto py-2 px-2">
      <SnakeGame />
    </div>
  );
}
