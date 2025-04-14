"use client";

import { useEffect, useCallback, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { useFrameSDK } from "~/hooks/useFrameSDK";
import { SCORING } from "~/lib/constants";

function ScoreCard({ score, onInteraction }: { score: number; onInteraction: (points: number) => void }) {
  const [touchStart, setTouchStart] = useState<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        onInteraction(SCORING.ARROW);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onInteraction]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart !== null) {
      const touchEnd = e.changedTouches[0].clientY;
      const diff = touchStart - touchEnd;
      
      if (diff > 50) { // Swipe up
        onInteraction(SCORING.ARROW);
      }
    }
    setTouchStart(null);
  };

  return (
    <Card
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="cursor-pointer"
    >
      <CardHeader>
        <CardTitle>Degen Score: {score}</CardTitle>
        <CardDescription>
          Swipe up or use ⬆️ arrow key to score {SCORING.ARROW} points!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Label>
          Wearing a degen hat: +{SCORING.DEGEN_HAT} points
        </Label>
      </CardContent>
    </Card>
  );
}

export default function Frame() {
  const { isSDKLoaded } = useFrameSDK();
  const [score, setScore] = useState(0);

  const handleInteraction = useCallback((points: number) => {
    setScore(prev => prev + points);
  }, []);

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-[300px] mx-auto py-2 px-2">
      <ScoreCard score={score} onInteraction={handleInteraction} />
    </div>
  );
}
