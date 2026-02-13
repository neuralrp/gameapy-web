import { useState } from 'react';
import { useFarm } from '../../contexts/FarmContext';
import { apiService } from '../../services/api';
import './FarmTab.css';

const CROP_STAGES: Record<string, number> = {
  parsnip: 5,
  cauliflower: 6,
  potato: 6,
  corn: 4,
  tomato: 4,
};

const ANIMAL_EMOJI: Record<string, string> = {
  chicken: '🐔',
  horse: '🐎',
  cow: '🐄',
  mermaid: '🧜‍♀️',
};

const SEED_EMOJI: Record<string, string> = {
  parsnip: '🥕',
  cauliflower: '🥦',
  potato: '🥔',
  corn: '🌽',
  tomato: '🍅',
};

const getSeedEmoji = (cropType: string): string => SEED_EMOJI[cropType] || '🌱';

export function FarmTab() {
  const { farmStatus, loading, plantCrop, harvestCrop, buyAnimal, harvestAnimal, upgradeFarm } = useFarm();
  const [selectedSeed, setSelectedSeed] = useState<string | null>(null);
  const [shopData, setShopData] = useState<any>(null);
  const [showShop, setShowShop] = useState(false);
  const [shopTab, setShopTab] = useState<'seeds' | 'animals' | 'decorations' | 'upgrade'>('seeds');

  const openShop = async () => {
    try {
      const data = await apiService.getFarmShop();
      if (data) {
        setShopData(data);
      } else {
        // For now, use mock data if API not available
        setShopData({
          seeds: [
            { id: 'parsnip', name: 'Parsnip', cost: 5, growthMessages: 10 },
            { id: 'cauliflower', name: 'Cauliflower', cost: 8, growthMessages: 20 },
            { id: 'potato', name: 'Potato', cost: 8, growthMessages: 15 },
            { id: 'corn', name: 'Corn', cost: 12, growthMessages: 30 },
            { id: 'tomato', name: 'Tomato', cost: 10, growthMessages: 25 },
          ],
          animals: farmStatus && farmStatus.farmLevel >= 1 ? [
            { id: 'chicken', name: 'Chicken', cost: 30, maturityMessages: 40 },
          ] : [],
          decorations: [],
          playerGold: farmStatus?.gold || 0,
          farmLevel: farmStatus?.farmLevel || 1,
          upgradeCost: farmStatus && farmStatus.farmLevel < 7 ? [75, 125, 175, 250, 350, 450][farmStatus.farmLevel - 1] : null,
          nextLevelUnlocks: farmStatus?.unlocks || [],
        });
      }
      setShowShop(true);
    } catch (error) {
      console.error('Failed to load shop:', error);
    }
  };

  const handlePlant = async (plotIndex: number) => {
    if (!selectedSeed) return;
    const success = await plantCrop(selectedSeed, plotIndex);
    if (success) {
      setSelectedSeed(null);
    }
  };

  const handleHarvest = async (plotIndex: number) => {
    await harvestCrop(plotIndex);
  };

  const handleBuySeed = async (seedId: string) => {
    if (!farmStatus) return;
    const usedPlots = farmStatus.crops.map(c => c.plotIndex);
    const emptyPlot = Array.from({ length: farmStatus.maxPlots }, (_, i) => i).find(i => !usedPlots.includes(i));
    
    if (emptyPlot !== undefined) {
      await plantCrop(seedId, emptyPlot);
    }
  };

  const handleBuyAnimal = async (animalId: string) => {
    if (!farmStatus) return;
    const usedSlots = farmStatus.animals.map(a => a.slotIndex);
    const emptySlot = Array.from({ length: farmStatus.maxBarnSlots }, (_, i) => i).find(i => !usedSlots.includes(i));
    
    if (emptySlot !== undefined) {
      await buyAnimal(animalId, emptySlot);
    }
  };

  const handleUpgrade = async () => {
    await upgradeFarm();
  };

  const getGrowthProgress = (plantedAt: number, duration: number, currentMsg: number): number => {
    const elapsed = currentMsg - plantedAt;
    return Math.min(100, Math.round((elapsed / duration) * 100));
  };

  const isMature = (plantedAt: number, duration: number, currentMsg: number): boolean => {
    return currentMsg - plantedAt >= duration;
  };

  const getCropStage = (cropType: string, progress: number): number => {
    const maxStages = CROP_STAGES[cropType] || 4;
    const stageIndex = Math.floor((progress / 100) * (maxStages - 1));
    return Math.min(stageIndex, maxStages - 1);
  };

  const getCropImageSrc = (cropType: string, stage: number): string => {
    if (cropType === 'potato') {
      return `/farm-assets/crops/${cropType}/${cropType}${stage}.png`;
    }
    return `/farm-assets/crops/${cropType}/${stage}.png`;
  };

  if (loading || !farmStatus) {
    return <div className="farm-loading">Loading farm...</div>;
  }

  const usedPlots = farmStatus.crops.map(c => c.plotIndex);

  return (
    <div className="farm-tab">
      <div className="farm-header">
        <div className="farm-stats">
          <span className="gold-display">💰 {farmStatus.gold}</span>
          <span className="message-counter">💬 {farmStatus.messageCounter}</span>
          <span className="farm-level">Level {farmStatus.farmLevel}</span>
        </div>
        <button className="shop-button" onClick={openShop}>
          Shop
        </button>
      </div>

      <div className="farm-sections">
        <section className="crops-section">
          <h2>Your Crops</h2>
          <div className="plot-grid">
            {Array.from({ length: farmStatus.maxPlots }).map((_, index) => {
              const crop = farmStatus.crops.find(c => c.plotIndex === index);
              const progress = crop ? getGrowthProgress(crop.plantedAtMessage, crop.growthDuration, farmStatus.messageCounter) : 0;
              const mature = crop ? isMature(crop.plantedAtMessage, crop.growthDuration, farmStatus.messageCounter) : false;
              
              return (
                <div 
                  key={index} 
                  className={`plot ${crop ? 'has-crop' : 'empty'} ${mature ? 'mature' : ''}`}
                  onClick={() => {
                    if (crop && mature) {
                      handleHarvest(index);
                    }
                  }}
                >
                  {crop ? (
                    <div className="crop-display">
                      <img 
                        src={getCropImageSrc(crop.cropType, getCropStage(crop.cropType, progress))}
                        alt={crop.cropType}
                        className="crop-sprite"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getCropImageSrc(crop.cropType, 0);
                        }}
                      />
                      <div className="growth-bar">
                        <div className="growth-fill" style={{ width: `${progress}%` }} />
                      </div>
                      {mature && <span className="harvest-label">Harvest!</span>}
                    </div>
                  ) : (
                    <div className="empty-plot">
                      {selectedSeed && !usedPlots.includes(index) && (
                        <button 
                          className="plant-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlant(index);
                          }}
                        >
                          Plant
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="seed-selector">
            {['parsnip', 'cauliflower', 'potato', 'corn', 'tomato'].map(crop => (
              <button
                key={crop}
                className={`seed-button ${selectedSeed === crop ? 'selected' : ''}`}
                onClick={() => setSelectedSeed(selectedSeed === crop ? null : crop)}
              >
                <img 
                  src={`/farm-assets/seeds/${crop}_seeds.png`} 
                  alt={crop}
                  style={{ display: 'none' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <span className="seed-emoji">{getSeedEmoji(crop)}</span>
                <span>{crop}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="barn-section">
          <h2>Barn</h2>
          <div className="barn-grid">
            {Array.from({ length: farmStatus.maxBarnSlots }).map((_, index) => {
              const animal = farmStatus.animals.find(a => a.slotIndex === index);
              const progress = animal ? getGrowthProgress(animal.acquiredAtMessage, animal.maturityDuration, farmStatus.messageCounter) : 0;
              const mature = animal ? isMature(animal.acquiredAtMessage, animal.maturityDuration, farmStatus.messageCounter) : false;
              
              return (
                <div
                  key={index}
                  className={`barn-slot ${animal ? 'has-animal' : 'empty'} ${mature ? 'mature' : ''}`}
                  onClick={() => {
                    if (animal && mature) {
                      harvestAnimal(index);
                    }
                  }}
                >
                  {animal ? (
                    <div className="animal-display">
                      <span className="animal-emoji">{ANIMAL_EMOJI[animal.animalType] || '❓'}</span>
                      {animal.animalType !== 'mermaid' && (
                        <>
                          <div className="growth-bar">
                            <div className="growth-fill" style={{ width: `${progress}%` }} />
                          </div>
                          {mature && <span className="harvest-label">Sell!</span>}
                        </>
                      )}
                    </div>
                  ) : (
                    <span className="empty-slot">Empty</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {farmStatus.unlocks.includes('pond') && (
          <section className="pond-section">
            <h2>Pond</h2>
            <div className="pond-area">
              {farmStatus.animals.filter(a => a.animalType === 'mermaid').map((_, i) => (
                <span key={i} className="mermaid">🧜‍♀️</span>
              ))}
              {farmStatus.animals.filter(a => a.animalType === 'mermaid').length === 0 && (
                <span className="empty-pond">Requires mermaid (talk to Marina!)</span>
              )}
            </div>
          </section>
        )}
      </div>

      {showShop && shopData && (
        <div className="shop-modal-overlay" onClick={() => setShowShop(false)}>
          <div className="shop-modal" onClick={e => e.stopPropagation()}>
            <div className="shop-header">
              <h2>Farm Shop</h2>
              <span className="shop-gold">💰 {shopData.playerGold}</span>
              <button className="close-button" onClick={() => setShowShop(false)}>×</button>
            </div>

            <div className="shop-tabs">
              <button className={shopTab === 'seeds' ? 'active' : ''} onClick={() => setShopTab('seeds')}>Seeds</button>
              <button className={shopTab === 'animals' ? 'active' : ''} onClick={() => setShopTab('animals')}>Animals</button>
              <button className={shopTab === 'decorations' ? 'active' : ''} onClick={() => setShopTab('decorations')}>Decor</button>
              <button className={shopTab === 'upgrade' ? 'active' : ''} onClick={() => setShopTab('upgrade')}>Upgrade</button>
            </div>

            <div className="shop-content">
              {shopTab === 'seeds' && (
                <div className="shop-items">
                  {shopData.seeds.map((seed: any) => (
                    <div key={seed.id} className="shop-item">
                      <img src={`/farm-assets/seeds/${seed.id}_seeds.png`} alt={seed.name} />
                      <div className="item-info">
                        <span className="item-name">{seed.name}</span>
                        <span className="item-cost">💰 {seed.cost}</span>
                        <span className="item-growth">Grows in {seed.growthMessages} messages</span>
                      </div>
                      <button disabled={shopData.playerGold < seed.cost} onClick={() => handleBuySeed(seed.id)}>Buy</button>
                    </div>
                  ))}
                </div>
              )}

              {shopTab === 'animals' && (
                <div className="shop-items">
                  {shopData.animals.map((animal: any) => (
                    <div key={animal.id} className="shop-item">
                      <span className="animal-emoji-large">{ANIMAL_EMOJI[animal.id] || '❓'}</span>
                      <div className="item-info">
                        <span className="item-name">{animal.name}</span>
                        <span className="item-cost">💰 {animal.cost}</span>
                        <span className="item-growth">Matures in {animal.maturityMessages} messages</span>
                      </div>
                      <button disabled={shopData.playerGold < animal.cost} onClick={() => handleBuyAnimal(animal.id)}>Buy</button>
                    </div>
                  ))}
                  {shopData.animals.length === 0 && <p className="locked-message">Unlock animals at higher farm levels</p>}
                </div>
              )}

              {shopTab === 'decorations' && (
                <div className="shop-items">
                  <p className="locked-message">Coming soon!</p>
                </div>
              )}

              {shopTab === 'upgrade' && (
                <div className="shop-items">
                  <div className="shop-item upgrade-item">
                    <span className="upgrade-icon">⬆️</span>
                    <div className="item-info">
                      <span className="item-name">Farm Level {shopData.farmLevel + 1}</span>
                      <span className="item-cost">💰 {shopData.upgradeCost || 'MAX'}</span>
                      <span className="item-benefit">
                        {shopData.nextLevelUnlocks.length > 0 
                          ? `Unlocks: ${shopData.nextLevelUnlocks.join(', ')}` 
                          : 'Max level reached!'}
                      </span>
                    </div>
                    <button disabled={!shopData.upgradeCost} onClick={handleUpgrade}>Upgrade</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
