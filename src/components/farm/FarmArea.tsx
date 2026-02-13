import { FarmTile, type TileState, type Crop } from './FarmTile';

interface FarmAreaProps {
  gridWidth: number;
  gridHeight: number;
  tilledPlots: Set<number>;
  crops: Crop[];
  onTileTap: (plotIndex: number) => void;
  animatingPlots?: Map<number, 'till' | 'plant' | 'water'>;
  messageCounter: number;
}

const GROWTH_STAGES: Record<string, number> = {
  parsnip: 5,
  cauliflower: 6,
  potato: 6,
  corn: 4,
  tomato: 4,
};

const GROWTH_DURATION: Record<string, number> = {
  parsnip: 10,
  cauliflower: 20,
  potato: 15,
  corn: 30,
  tomato: 25,
};

const WATER_BONUS = 0.30;

function calculateCurrentStage(
  cropType: string,
  plantedAtMessage: number,
  wateredStages: number[],
  currentMessage: number
): number {
  const numStages = GROWTH_STAGES[cropType] || 5;
  const baseDuration = GROWTH_DURATION[cropType] || 10;
  const messagesElapsed = currentMessage - plantedAtMessage;
  
  // Calculate messages needed with water bonuses
  let messagesNeeded = 0;
  for (let stage = 0; stage < numStages; stage++) {
    const stageDuration = baseDuration / numStages;
    if (wateredStages.includes(stage)) {
      messagesNeeded += stageDuration * (1 - WATER_BONUS);
    } else {
      messagesNeeded += stageDuration;
    }
  }
  
  // Find current stage based on elapsed messages
  let accumulated = 0;
  for (let stage = 0; stage < numStages; stage++) {
    const stageDuration = baseDuration / numStages;
    const stageNeeded = wateredStages.includes(stage) 
      ? stageDuration * (1 - WATER_BONUS) 
      : stageDuration;
    
    if (messagesElapsed >= accumulated + stageNeeded) {
      accumulated += stageNeeded;
    } else {
      return stage;
    }
  }
  
  return numStages - 1;
}

export function getSoilTileType(
  grid: TileState[][],
  row: number,
  col: number
): string {
  const hasSoil = (r: number, c: number): boolean => {
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) return false;
    return grid[r][c] === 'tilled' || grid[r][c] === 'planted' || grid[r][c] === 'mature';
  };

  const t = hasSoil(row - 1, col);
  const b = hasSoil(row + 1, col);
  const l = hasSoil(row, col - 1);
  const r = hasSoil(row, col + 1);

  if (t && r && b && l) return 'x';
  
  if (l && !t && !r && !b) return 'r';
  if (r && !t && !l && !b) return 'l';
  if (r && l && !t && !b) return 'lr';
  
  if (t && !r && !l && !b) return 'b';
  if (b && !r && !l && !t) return 't';
  if (b && t && !r && !l) return 'tb';
  
  if (l && b && !t && !r) return 'tr';
  if (r && b && !t && !l) return 'tl';
  if (l && t && !b && !r) return 'br';
  if (r && t && !b && !l) return 'bl';
  
  if (t && b && r && !l) return 'tbr';
  if (t && b && l && !r) return 'tbl';
  if (l && r && t && !b) return 'lrb';
  if (l && r && b && !t) return 'lrt';
  
  return 'o';
}

export function FarmArea({
  gridWidth,
  gridHeight,
  tilledPlots,
  crops,
  onTileTap,
  animatingPlots,
  messageCounter,
}: FarmAreaProps) {
  const cropMap = new Map<number, Crop>();
  crops.forEach(crop => {
    cropMap.set(crop.plotIndex, crop);
  });

  const animatingMap = animatingPlots || new Map<number, 'till' | 'plant' | 'water'>();

  const grid: TileState[][] = [];
  for (let row = 0; row < gridHeight; row++) {
    const gridRow: TileState[] = [];
    for (let col = 0; col < gridWidth; col++) {
      const index = row * gridWidth + col;
      const crop = cropMap.get(index);
      
      if (crop) {
        const currentStage = calculateCurrentStage(
          crop.cropType,
          crop.plantedAtMessage,
          crop.wateredStages,
          messageCounter
        );
        const maxStage = GROWTH_STAGES[crop.cropType] || 5;
        gridRow.push(currentStage >= maxStage - 1 ? 'mature' : 'planted');
      } else if (tilledPlots.has(index)) {
        gridRow.push('tilled');
      } else {
        gridRow.push('grass');
      }
    }
    grid.push(gridRow);
  }

  const tiles = [];
  for (let row = 0; row < gridHeight; row++) {
    for (let col = 0; col < gridWidth; col++) {
      const index = row * gridWidth + col;
      const state = grid[row][col];
      const crop = cropMap.get(index);
      const soilTileType = state !== 'grass' ? getSoilTileType(grid, row, col) : 'o';
      
      const currentStage = crop 
        ? calculateCurrentStage(crop.cropType, crop.plantedAtMessage, crop.wateredStages, messageCounter)
        : 0;
      
      tiles.push(
        <FarmTile
          key={index}
          plotIndex={index}
          state={state}
          crop={crop}
          soilTileType={soilTileType}
          wateredStages={crop?.wateredStages ?? []}
          currentStage={currentStage}
          onTap={() => onTileTap(index)}
          animating={animatingMap.get(index) ?? null}
        />
      );
    }
  }

  return (
    <div className="farm-area">
      <div 
        className="farm-grid"
        style={{
          gridTemplateColumns: `repeat(${gridWidth}, 64px)`,
          gridTemplateRows: `repeat(${gridHeight}, 64px)`,
        }}
      >
        {tiles}
      </div>
    </div>
  );
}
