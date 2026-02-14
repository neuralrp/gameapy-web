export type TileState = 'grass' | 'tilled' | 'planted' | 'mature';

export interface Crop {
  cropType: 'parsnip' | 'cauliflower' | 'potato' | 'corn' | 'tomato';
  plotIndex: number;
  plantedAtMessage: number;
  growthDuration: number;
  wateredStages: number[];
  growthStage: number;
}

interface FarmTileProps {
  plotIndex: number;
  state: TileState;
  crop?: Crop;
  soilTileType: string;
  wateredStages: number[];
  currentStage: number;
  onTap: () => void;
  animating?: 'till' | 'plant' | 'water' | null;
  isLocked?: boolean;
}

const GROWTH_STAGES: Record<string, number> = {
  parsnip: 5,
  cauliflower: 6,
  potato: 6,
  corn: 4,
  tomato: 4,
};

function getCropImage(cropType: string, growthStage: number): string {
  const maxStage = GROWTH_STAGES[cropType] || 5;
  const stage = Math.min(growthStage, maxStage - 1);
  
  if (cropType === 'corn' || cropType === 'tomato') {
    return `/farm-assets/crops/${cropType}/${stage}.png`;
  }
  
  return `/farm-assets/crops/${cropType}/${cropType}${stage}.png`;
}

export function FarmTile({
  plotIndex,
  state,
  crop,
  soilTileType,
  wateredStages,
  currentStage,
  onTap,
  animating,
  isLocked = false,
}: FarmTileProps) {
  const isCurrentStageWatered = wateredStages.includes(currentStage);
  const hasCrop = crop && state !== 'grass' && state !== 'tilled';
  const isMature = state === 'mature';

  return (
    <div 
      className={`farm-tile ${animating ? `animating-${animating}` : ''} ${isMature ? 'mature' : ''} ${isLocked ? 'locked' : ''}`} 
      onClick={onTap}
      data-state={state}
      data-index={plotIndex}
    >
      {state === 'grass' && (
        <>
          <img 
            src="/farm-assets/ground/grass.png" 
            alt="Grass"
            className="tile-base"
          />
          <div className="till-hint">Tap to till</div>
        </>
      )}
      
      {state !== 'grass' && (
        <>
          <img 
            src={`/farm-assets/soil/${soilTileType}.png`}
            alt="Soil"
            className="tile-base"
          />
          
          {isCurrentStageWatered ? (
            <div className="watered-overlay" />
          ) : hasCrop && !isMature ? (
            <div className="water-needed-indicator">
              <span className="water-drop">💧</span>
            </div>
          ) : null}
        </>
      )}
      
      {crop && (
        <img 
          src={getCropImage(crop.cropType, crop.growthStage)}
          alt={crop.cropType}
          className={`crop-sprite ${isMature ? 'ready' : 'growing'}`}
        />
      )}
      
      {state === 'mature' && (
        <div className="harvest-indicator">
          <span className="harvest-star">⭐</span>
        </div>
      )}
      
      {isLocked && (
        <div className="locked-overlay">
          <span className="lock-icon">🔒</span>
        </div>
      )}
    </div>
  );
}
