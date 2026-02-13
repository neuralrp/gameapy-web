import { useState } from 'react';
import { X } from 'lucide-react';

interface ShopItem {
  id: string;
  name: string;
  cost: number;
  growthMessages?: number;
  benefit?: string;
  icon: string;
}

interface AnimalItem {
  id: string;
  name: string;
  cost: number;
  maturityMessages: number;
  produces: string;
  icon: string;
}

interface UpgradeItem {
  id: string;
  name: string;
  cost: number;
  description: string;
  icon: string;
}

interface FarmShopProps {
  isOpen: boolean;
  onClose: () => void;
  gold: number;
  onBuySeed: (seedId: string) => void;
  farmLevel: number;
  onBuyAnimal: (animalType: string) => void;
  onUpgradeFarm: () => void;
}

type TabType = 'seeds' | 'animals' | 'land';

const SEED_ITEMS: ShopItem[] = [
  { 
    id: 'parsnip', 
    name: 'Parsnip Seeds', 
    cost: 5, 
    growthMessages: 10,
    icon: '/farm-assets/seeds/parsnip_seeds.png'
  },
  { 
    id: 'cauliflower', 
    name: 'Cauliflower Seeds', 
    cost: 8, 
    growthMessages: 20,
    icon: '/farm-assets/seeds/cauliflower_seeds.png'
  },
  { 
    id: 'potato', 
    name: 'Potato Seeds', 
    cost: 8, 
    growthMessages: 15,
    icon: '/farm-assets/seeds/potato_seeds.png'
  },
  { 
    id: 'corn', 
    name: 'Corn Seeds', 
    cost: 12, 
    growthMessages: 30,
    icon: '/farm-assets/crops/corn/0.png'
  },
  { 
    id: 'tomato', 
    name: 'Tomato Seeds', 
    cost: 10, 
    growthMessages: 25,
    icon: '/farm-assets/crops/tomato/0.png'
  },
];

const ANIMAL_ITEMS: AnimalItem[] = [
  { 
    id: 'chicken', 
    name: 'Chicken', 
    cost: 30, 
    maturityMessages: 10,
    produces: 'Eggs',
    icon: '🐔'
  },
  { 
    id: 'cow', 
    name: 'Cow', 
    cost: 100, 
    maturityMessages: 20,
    produces: 'Milk',
    icon: '🐄'
  },
  { 
    id: 'horse', 
    name: 'Horse', 
    cost: 60, 
    maturityMessages: 15,
    produces: 'Riding',
    icon: '🐴'
  },
];

const UPGRADE_ITEMS: UpgradeItem[] = [
  { 
    id: 'expand1', 
    name: 'Expand Farm', 
    cost: 75, 
    description: 'Unlock more planting plots',
    icon: '🌾'
  },
  { 
    id: 'barn1', 
    name: 'Build Barn', 
    cost: 100, 
    description: 'House for animals',
    icon: '🏠'
  },
  { 
    id: 'expand2', 
    name: 'Expand More', 
    cost: 150, 
    description: 'Even more planting space',
    icon: '🌻'
  },
];

export function FarmShop({
  isOpen,
  onClose,
  gold,
  onBuySeed,
  farmLevel,
  onBuyAnimal,
  onUpgradeFarm,
}: FarmShopProps) {
  const [activeTab, setActiveTab] = useState<TabType>('seeds');

  const handleBuyUpgrade = (item: UpgradeItem) => {
    if (gold >= item.cost) {
      onUpgradeFarm();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="farm-shop-overlay" onClick={onClose}>
      <div className="farm-shop" onClick={e => e.stopPropagation()}>
        <div className="farm-shop-header">
          <h2 className="farm-shop-title">Shop</h2>
          <div className="farm-shop-gold">
            <img 
              src="/farm-assets/ui/coin.png" 
              alt="Gold" 
              className="w-5 h-5 pixelated"
            />
            <span>{gold}</span>
          </div>
          <button 
            onClick={onClose}
            className="farm-shop-close"
            aria-label="Close shop"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="farm-shop-tabs">
          <button 
            className={`farm-shop-tab ${activeTab === 'seeds' ? 'active' : ''}`}
            onClick={() => setActiveTab('seeds')}
          >
            🌱 Seeds
          </button>
          <button 
            className={`farm-shop-tab ${activeTab === 'animals' ? 'active' : ''}`}
            onClick={() => setActiveTab('animals')}
          >
            🐄 Animals
          </button>
          <button 
            className={`farm-shop-tab ${activeTab === 'land' ? 'active' : ''}`}
            onClick={() => setActiveTab('land')}
          >
            🏡 Land
          </button>
        </div>

        <div className="farm-shop-content">
          {activeTab === 'seeds' && (
            <div className="farm-shop-items">
              {SEED_ITEMS.map(item => (
                <div key={item.id} className="shop-item">
                  <img 
                    src={item.icon} 
                    alt={item.name}
                    className="shop-item-icon"
                  />
                  <div className="shop-item-info">
                    <span className="shop-item-name">{item.name}</span>
                    <span className="shop-item-duration">
                      Grows in {item.growthMessages} messages
                    </span>
                  </div>
                  <div className="shop-item-buy">
                    <span className="shop-item-cost">{item.cost}g</span>
                    <button
                      className="shop-buy-btn"
                      onClick={() => onBuySeed(item.id)}
                      disabled={gold < item.cost}
                    >
                      Buy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'animals' && (
            <div className="farm-shop-items">
              {ANIMAL_ITEMS.map(item => (
                <div key={item.id} className="shop-item">
                  <span className="shop-animal-icon">{item.icon}</span>
                  <div className="shop-item-info">
                    <span className="shop-item-name">{item.name}</span>
                    <span className="shop-item-duration">
                      Matures in {item.maturityMessages} messages
                    </span>
                    <span className="shop-item-benefit">
                      Produces: {item.produces}
                    </span>
                  </div>
                  <div className="shop-item-buy">
                    <span className="shop-item-cost">{item.cost}g</span>
                    <button
                      className="shop-buy-btn"
                      onClick={() => onBuyAnimal(item.id)}
                      disabled={gold < item.cost}
                    >
                      Buy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'land' && (
            <div className="farm-shop-items">
              {farmLevel < 5 && (
                <>
                  {UPGRADE_ITEMS.slice(0, farmLevel).map(item => (
                    <div key={item.id} className="shop-item">
                      <span className="shop-upgrade-icon">{item.icon}</span>
                      <div className="shop-item-info">
                        <span className="shop-item-name">{item.name}</span>
                        <span className="shop-item-duration">
                          {item.description}
                        </span>
                        <span className="shop-item-benefit">
                          Current Level: {farmLevel}
                        </span>
                      </div>
                      <div className="shop-item-buy">
                        <span className="shop-item-cost">{item.cost}g</span>
                        <button
                          className="shop-buy-btn"
                          onClick={() => handleBuyUpgrade(item)}
                          disabled={gold < item.cost}
                        >
                          Upgrade
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {farmLevel >= 5 && (
                <div className="shop-max-level">
                  <span>🏆 Farm fully upgraded!</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
