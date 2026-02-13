import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
}

interface HarvestParticlesProps {
  x: number;
  y: number;
  onComplete: () => void;
}

const COLORS = ['#FFD700', '#FFA500', '#FF6B6B', '#4CAF50', '#8BC34A'];

export function HarvestParticles({ x, y, onComplete }: HarvestParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticles: Particle[] = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x,
      y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8 - 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 6 + 4,
    }));
    setParticles(newParticles);

    const timer = setTimeout(onComplete, 600);
    return () => clearTimeout(timer);
  }, [x, y, onComplete]);

  return (
    <div className="harvest-particles">
      {particles.map(p => (
        <div
          key={p.id}
          className="harvest-particle"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            '--vx': `${p.vx}px`,
            '--vy': `${p.vy}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
