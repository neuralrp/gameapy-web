import { X } from 'lucide-react';

interface ShopItem {
  id: string;
  name: string;
  cost: number;
  growthMessages: number;
  icon: string;
}

interface FarmShopProps {
  isOpen: boolean;
  onClose: () => void;
  gold: number;
  onBuySeed: (seedId: string) => void;
}

const SHOP_ITEMS: ShopItem[] = [
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

export function FarmShop({
  isOpen,
  onClose,
  gold,
  onBuySeed,
}: FarmShopProps) {
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

        <div className="farm-shop-items">
          {SHOP_ITEMS.map(item => (
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
      </div>
    </div>
  );
}
