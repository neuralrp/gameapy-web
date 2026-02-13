import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';

interface FarmHeaderProps {
  gold: number;
  messageCounter: number;
  farmLevel: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onShopClick: () => void;
  onBackClick: () => void;
}

export function FarmHeader({
  gold,
  messageCounter,
  farmLevel,
  isMuted,
  onToggleMute,
  onShopClick,
  onBackClick,
}: FarmHeaderProps) {
  return (
    <header className="farm-header">
      <button
        onClick={onBackClick}
        className="farm-header-btn"
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="farm-header-stats">
        <div className="farm-stat">
          <img 
            src="/farm-assets/ui/coin.png" 
            alt="Gold" 
            className="w-5 h-5 pixelated"
          />
          <span>{gold}</span>
        </div>
        
        <div className="farm-stat">
          <span className="text-sm">Msg:</span>
          <span>{messageCounter}</span>
        </div>
        
        <div className="farm-stat">
          <span className="text-sm">Lvl:</span>
          <span>{farmLevel}</span>
        </div>
      </div>

      <div className="farm-header-actions">
        <button
          onClick={onToggleMute}
          className="farm-header-btn"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>
        
        <button
          onClick={onShopClick}
          className="farm-shop-btn"
          aria-label="Open shop"
        >
          Shop
        </button>
      </div>
    </header>
  );
}
