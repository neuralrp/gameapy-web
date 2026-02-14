import { Heart } from 'lucide-react';

interface HeartRatingProps {
  level: number;
  maxLevel?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function HeartRating({ 
  level, 
  maxLevel = 5, 
  size = 'sm',
  className = '' 
}: HeartRatingProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const gapClasses = {
    sm: 'gap-0.5',
    md: 'gap-1',
    lg: 'gap-1.5'
  };

  const hearts = [];
  
  for (let i = 0; i < maxLevel; i++) {
    const isFilled = i < level;
    hearts.push(
      <Heart
        key={i}
        className={`${sizeClasses[size]} transition-colors ${
          isFilled 
            ? 'fill-red-500 text-red-500' 
            : 'fill-transparent text-gray-400'
        }`}
      />
    );
  }

  return (
    <div className={`flex items-center ${gapClasses[size]} ${className}`}>
      {hearts}
    </div>
  );
}
