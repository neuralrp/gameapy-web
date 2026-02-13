import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FarmHeader } from '../components/farm/FarmHeader';
import { FarmArea } from '../components/farm/FarmArea';
import { FarmToolbar } from '../components/farm/FarmToolbar';
import { FarmShop } from '../components/farm/FarmShop';
import { FarmDecorations } from '../components/farm/FarmDecorations';
import { FarmSkyOverlay } from '../components/farm/FarmSkyOverlay';
import { FarmWelcomeModal } from '../components/farm/FarmWelcomeModal';

import { useFarm } from '../contexts/FarmContext';
import { useAudio } from '../hooks/useAudio';
import { useTimeOfDay } from '../hooks/useTimeOfDay';
import { useHaptics } from '../hooks/useHaptics';
import type { Crop } from '../components/farm/FarmTile';

interface GoldIncrement {
  id: number;
  amount: number;
}

const GRID_WIDTH = 8;
const GRID_HEIGHT = 6;

const GROWTH_DURATION: Record<string, number> = {
  parsnip: 10,
  cauliflower: 20,
  potato: 15,
  corn: 30,
  tomato: 25,
};

const GROWTH_STAGES: Record<string, number> = {
  parsnip: 5,
  cauliflower: 6,
  potato: 6,
  corn: 4,
  tomato: 4,
};

const HARVEST_VALUES: Record<string, number> = {
  parsnip: 10,
  cauliflower: 20,
  potato: 15,
  corn: 25,
  tomato: 20,
};

interface SeedInventory {
  [key: string]: number;
}

export function FarmScreen() {
  const navigate = useNavigate();
  const { farmStatus, loading, refreshFarm, tillPlot, waterCrop, plantCrop, harvestCrop, dailyLogin, upgradeFarm } = useFarm();
  const { playMusic, stopMusic, playSound, isMuted, toggleMute } = useAudio();
  const timeOfDay = useTimeOfDay();
  const haptics = useHaptics();

  const [shopOpen, setShopOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [selectedSeed, setSelectedSeed] = useState<string | null>(null);
  const [tilledPlots, setTilledPlots] = useState<Set<number>>(new Set());
  const [crops, setCrops] = useState<Crop[]>([]);
  const [gold, setGold] = useState(0);
  const [goldIncrements, setGoldIncrements] = useState<GoldIncrement[]>([]);
  const [animatingPlots, setAnimatingPlots] = useState<Map<number, 'till' | 'plant' | 'water'>>(new Map());
  const [shake, setShake] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dailyLoginClaimed, setDailyLoginClaimed] = useState(false);
  const hasInitializedRef = useRef(false);
  const [seedInventory, setSeedInventory] = useState<SeedInventory>({
    parsnip: 5,
    cauliflower: 3,
    potato: 2,
    corn: 0,
    tomato: 1,
  });

  useEffect(() => {
    refreshFarm();
  }, [refreshFarm]);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (farmStatus) {
      setGold(farmStatus.gold);
      
      const farmCrops: Crop[] = farmStatus.crops.map(c => ({
        cropType: c.cropType as Crop['cropType'],
        plotIndex: c.plotIndex,
        plantedAtMessage: c.plantedAtMessage,
        growthDuration: c.growthDuration,
        wateredStages: (c as any).wateredStages || [],
        growthStage: c.growthStage ?? calculateGrowthStageWithWater(
          c.cropType,
          c.plantedAtMessage,
          c.growthDuration,
          (c as any).wateredStages || [],
          farmStatus.messageCounter
        ),
      }));
      setCrops(farmCrops);
      
      const tilled = new Set<number>(farmStatus.tilledPlots || []);
      farmStatus.crops.forEach(c => tilled.add(c.plotIndex));
      setTilledPlots(tilled);

      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true;
        if (farmStatus.messageCounter === 0 && !dailyLoginClaimed) {
          setWelcomeOpen(true);
        }
        handleDailyLogin();
      }
    }
  }, [farmStatus]);

  const handleDailyLogin = async () => {
    if (dailyLoginClaimed) return;
    const result = await dailyLogin();
    if (result.success) {
      setDailyLoginClaimed(true);
      setGold(prev => prev + 5);
    }
  };

  useEffect(() => {
    playMusic();
    return () => stopMusic();
  }, [playMusic, stopMusic]);

  const WATER_BONUS = 0.30;

  function calculateGrowthStageWithWater(
    cropType: string,
    plantedAtMessage: number,
    baseDuration: number,
    wateredStages: number[],
    currentMessage: number
  ): number {
    const numStages = GROWTH_STAGES[cropType] || 5;
    const messagesElapsed = currentMessage - plantedAtMessage;
    
    let messagesNeeded = 0;
    for (let stage = 0; stage < numStages; stage++) {
      const stageDuration = baseDuration / numStages;
      if (wateredStages.includes(stage)) {
        messagesNeeded += stageDuration * (1 - WATER_BONUS);
      } else {
        messagesNeeded += stageDuration;
      }
    }
    
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

  const handleTileTap = useCallback((plotIndex: number) => {
    haptics.medium();
    const existingCrop = crops.find(c => c.plotIndex === plotIndex);
    const isTilled = tilledPlots.has(plotIndex);

    if (existingCrop) {
      const maxStage = GROWTH_STAGES[existingCrop.cropType] || 5;
      if (existingCrop.growthStage >= maxStage - 1) {
        handleHarvest(plotIndex);
      } else {
        const currentStage = calculateGrowthStageWithWater(
          existingCrop.cropType,
          existingCrop.plantedAtMessage,
          existingCrop.growthDuration,
          existingCrop.wateredStages,
          farmStatus?.messageCounter || 0
        );
        if (!existingCrop.wateredStages.includes(currentStage)) {
          handleWater(plotIndex);
        }
      }
    } else if (isTilled && selectedSeed && seedInventory[selectedSeed] > 0) {
      handlePlant(plotIndex, selectedSeed);
    } else if (!isTilled) {
      handleTill(plotIndex);
    }
  }, [crops, tilledPlots, selectedSeed, seedInventory, haptics, farmStatus]);

  const handleTill = async (plotIndex: number) => {
    playSound('hoe');
    setTilledPlots(prev => new Set([...prev, plotIndex]));
    setAnimatingPlots(prev => { const m = new Map(prev); m.set(plotIndex, 'till'); return m; });
    setTimeout(() => {
      setAnimatingPlots(prev => { const m = new Map(prev); m.delete(plotIndex); return m; });
    }, 400);
    await tillPlot(plotIndex);
  };

  const handlePlant = (plotIndex: number, seedType: string) => {
    if (seedInventory[seedType] <= 0) {
      haptics.heavy();
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    
    playSound('plant');
    
    const newCount = seedInventory[seedType] - 1;
    setSeedInventory(prev => ({
      ...prev,
      [seedType]: newCount,
    }));

    setAnimatingPlots(prev => { const m = new Map(prev); m.set(plotIndex, 'plant'); return m; });
    setTimeout(() => {
      setAnimatingPlots(prev => { const m = new Map(prev); m.delete(plotIndex); return m; });
    }, 400);

    const newCrop: Crop = {
      cropType: seedType as Crop['cropType'],
      plotIndex,
      plantedAtMessage: farmStatus?.messageCounter || 0,
      growthDuration: GROWTH_DURATION[seedType] || 10,
      wateredStages: [],
      growthStage: 0,
    };

    setCrops(prev => [...prev, newCrop]);
    plantCrop(seedType, plotIndex);
    
    if (newCount <= 0) {
      setSelectedSeed(null);
    }
  };

  const handleWater = async (plotIndex: number) => {
    const crop = crops.find(c => c.plotIndex === plotIndex);
    if (!crop) return;
    
    const currentStage = calculateGrowthStageWithWater(
      crop.cropType,
      crop.plantedAtMessage,
      crop.growthDuration,
      crop.wateredStages,
      farmStatus?.messageCounter || 0
    );
    
    playSound('water');
    setCrops(prev =>
      prev.map(c =>
        c.plotIndex === plotIndex 
          ? { ...c, wateredStages: [...c.wateredStages, currentStage] } 
          : c
      )
    );
    setAnimatingPlots(prev => { const m = new Map(prev); m.set(plotIndex, 'water'); return m; });
    setTimeout(() => {
      setAnimatingPlots(prev => { const m = new Map(prev); m.delete(plotIndex); return m; });
    }, 400);
    await waterCrop(plotIndex, currentStage);
  };

  const handleHarvest = (plotIndex: number) => {
    const crop = crops.find(c => c.plotIndex === plotIndex);
    if (!crop) return;

    haptics.success();
    playSound('success');
    
    const harvestValue = HARVEST_VALUES[crop.cropType] || 10;
    setGold(prev => prev + harvestValue);
    
    const incrementId = Date.now();
    setGoldIncrements(prev => [...prev, { id: incrementId, amount: harvestValue }]);
    setTimeout(() => {
      setGoldIncrements(prev => prev.filter(g => g.id !== incrementId));
    }, 1000);
    
    setCrops(prev => prev.filter(c => c.plotIndex !== plotIndex));
    setTilledPlots(prev => {
      const next = new Set(prev);
      next.delete(plotIndex);
      return next;
    });
    
    harvestCrop(plotIndex);
  };

  const handleBuySeed = (seedId: string) => {
    const item = {
      parsnip: { cost: 5 },
      cauliflower: { cost: 8 },
      potato: { cost: 8 },
      corn: { cost: 12 },
      tomato: { cost: 10 },
    }[seedId];

    if (!item || gold < item.cost) {
      haptics.heavy();
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }

    setGold(prev => prev - item.cost);
    setSeedInventory(prev => ({
      ...prev,
      [seedId]: (prev[seedId] || 0) + 1,
    }));
    playSound('success');
  };

  const handleBack = () => {
    stopMusic();
    navigate(-1);
  };

  const handleSelectSeed = (seedId: string | null) => {
    if (seedId) {
      haptics.light();
    }
    setSelectedSeed(seedId);
  };

  const seeds = Object.entries(seedInventory).map(([id, count]) => ({
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    count,
    icon: id === 'corn' || id === 'tomato'
      ? `/farm-assets/crops/${id}/0.png`
      : `/farm-assets/seeds/${id}_seeds.png`,
  }));

  if (loading) {
    return (
      <div className="farm-screen farm-loading">
        <div className="loading-text">Loading farm...</div>
      </div>
    );
  }

  return (
    <div className={`farm-screen ${mounted ? 'mounted' : ''}`}>
      <FarmSkyOverlay timeOfDay={timeOfDay} />
      
      <FarmHeader
        gold={gold}
        messageCounter={farmStatus?.messageCounter || 0}
        farmLevel={farmStatus?.farmLevel || 1}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onShopClick={() => setShopOpen(true)}
        onBackClick={handleBack}
      />

      <div className={`farm-content ${shake ? 'shake' : ''}`}>
        <div className="farm-grid-container">
          <FarmDecorations gridWidth={GRID_WIDTH} gridHeight={GRID_HEIGHT} />
          <FarmArea
            gridWidth={GRID_WIDTH}
            gridHeight={GRID_HEIGHT}
            tilledPlots={tilledPlots}
            crops={crops}
            onTileTap={handleTileTap}
            animatingPlots={animatingPlots}
            messageCounter={farmStatus?.messageCounter || 0}
          />
        </div>
        {goldIncrements.map(inc => (
          <div key={inc.id} className="gold-increment">
            +{inc.amount} gold
          </div>
        ))}
      </div>

      <FarmToolbar
        seeds={seeds}
        selectedSeed={selectedSeed}
        onSelectSeed={handleSelectSeed}
      />

      <FarmShop
        isOpen={shopOpen}
        onClose={() => setShopOpen(false)}
        gold={gold}
        onBuySeed={handleBuySeed}
        farmLevel={farmStatus?.farmLevel || 1}
        onBuyAnimal={(animalType: string) => {
          const costs: Record<string, number> = { chicken: 30, cow: 100, horse: 60 };
          if (gold >= costs[animalType]) {
            setGold(prev => prev - costs[animalType]);
          }
        }}
        onUpgradeFarm={async () => {
          const upgradeCosts: Record<number, number> = { 1: 75, 2: 150, 3: 300, 4: 600 };
          const cost = upgradeCosts[farmStatus?.farmLevel || 1] || 75;
          if (gold >= cost) {
            setGold(prev => prev - cost);
            await upgradeFarm();
          }
        }}
      />

      <FarmWelcomeModal
        isOpen={welcomeOpen}
        onClose={() => setWelcomeOpen(false)}
      />
    </div>
  );
}
