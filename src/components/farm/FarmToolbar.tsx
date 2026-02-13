interface Seed {
  id: string;
  name: string;
  count: number;
  icon: string;
}

interface FarmToolbarProps {
  seeds: Seed[];
  selectedSeed: string | null;
  onSelectSeed: (seedId: string | null) => void;
}

const DEFAULT_SEEDS: Seed[] = [
  { id: 'parsnip', name: 'Parsnip', count: 0, icon: '/farm-assets/seeds/parsnip_seeds.png' },
  { id: 'cauliflower', name: 'Cauliflower', count: 0, icon: '/farm-assets/seeds/cauliflower_seeds.png' },
  { id: 'potato', name: 'Potato', count: 0, icon: '/farm-assets/seeds/potato_seeds.png' },
  { id: 'corn', name: 'Corn', count: 0, icon: '/farm-assets/crops/corn/0.png' },
  { id: 'tomato', name: 'Tomato', count: 0, icon: '/farm-assets/crops/tomato/0.png' },
];

export function FarmToolbar({
  seeds = DEFAULT_SEEDS,
  selectedSeed,
  onSelectSeed,
}: FarmToolbarProps) {
  const handleSeedClick = (seedId: string) => {
    if (selectedSeed === seedId) {
      onSelectSeed(null);
    } else {
      onSelectSeed(seedId);
    }
  };

  return (
    <div className="farm-toolbar">
      {seeds.map(seed => (
        <button
          key={seed.id}
          className={`seed-button ${selectedSeed === seed.id ? 'selected' : ''}`}
          onClick={() => handleSeedClick(seed.id)}
          aria-label={`Select ${seed.name} seeds`}
          disabled={seed.count <= 0}
        >
          <img 
            src={seed.icon} 
            alt={seed.name}
            className="w-8 h-8 pixelated"
          />
          <span className="seed-count">{seed.count}</span>
        </button>
      ))}
    </div>
  );
}
