interface FarmEntryCardProps {
  onClick: () => void;
}

export function FarmEntryCard({ onClick }: FarmEntryCardProps) {
  return (
    <button
      onClick={onClick}
      className="farm-entry-card"
      aria-label="Open your garden"
    >
      <div className="farm-entry-icon">
        <img 
          src="/farm-assets/objects/sunflower.png" 
          alt=""
          className="w-12 h-12 pixelated"
        />
      </div>
      <span className="farm-entry-label">Your Garden</span>
    </button>
  );
}
