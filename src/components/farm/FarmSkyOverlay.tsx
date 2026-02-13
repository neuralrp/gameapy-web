import { useMemo } from 'react';
import type { TimeOfDay } from '../../hooks/useTimeOfDay';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
}

interface FarmSkyOverlayProps {
  timeOfDay: TimeOfDay;
}

function generateStars(): Star[] {
  return Array.from({ length: 75 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 60,
    size: Math.random() * 2 + 1,
    delay: Math.random() * 3,
  }));
}

export function FarmSkyOverlay({ timeOfDay }: FarmSkyOverlayProps) {
  const stars = useMemo(() => generateStars(), []);

  if (timeOfDay === 'day') return null;

  const showStars = timeOfDay === 'night' || timeOfDay === 'dawn';
  const showMoon = timeOfDay === 'night';
  const starOpacity = timeOfDay === 'dawn' ? 0.3 : 1;

  return (
    <div className={`farm-sky-overlay ${timeOfDay}`}>
      {showMoon && (
        <div className="moon" />
      )}
      
      {showStars && (
        <div className="stars-container">
          {stars.map(star => (
            <div
              key={star.id}
              className="star"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: star.size,
                height: star.size,
                animationDelay: `${star.delay}s`,
                opacity: starOpacity,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
