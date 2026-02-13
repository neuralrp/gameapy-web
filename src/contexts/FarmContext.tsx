import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiService } from '../services/api';
import type { FarmStatus } from '../types/api';

interface FarmContextType {
  farmStatus: FarmStatus | null;
  loading: boolean;
  refreshFarm: () => Promise<void>;
  tillPlot: (plotIndex: number) => Promise<boolean>;
  waterCrop: (plotIndex: number, stage: number) => Promise<boolean>;
  plantCrop: (cropType: string, plotIndex: number) => Promise<boolean>;
  harvestCrop: (plotIndex: number) => Promise<boolean>;
  buyAnimal: (animalType: string, slotIndex: number) => Promise<boolean>;
  harvestAnimal: (slotIndex: number) => Promise<boolean>;
  upgradeFarm: () => Promise<boolean>;
  dailyLogin: () => Promise<{ success: boolean; message: string }>;
}

const FarmContext = createContext<FarmContextType | null>(null);

export function FarmProvider({ children }: { children: ReactNode }) {
  const [farmStatus, setFarmStatus] = useState<FarmStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshFarm = async () => {
    try {
      const data = await (apiService as any).request('/api/v1/farm/status');
      setFarmStatus(data);
    } catch (error) {
      console.error('Failed to load farm status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshFarm();
  }, []);

  const tillPlot = async (plotIndex: number): Promise<boolean> => {
    try {
      const result = await (apiService as any).request(`/api/v1/farm/till?plot_index=${plotIndex}`, {
        method: 'POST',
      });
      if (result.success) {
        await refreshFarm();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to till plot:', error);
      return false;
    }
  };

  const waterCrop = async (plotIndex: number, stage: number): Promise<boolean> => {
    try {
      const result = await (apiService as any).request(`/api/v1/farm/water?plot_index=${plotIndex}&stage=${stage}`, {
        method: 'POST',
      });
      if (result.success) {
        await refreshFarm();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to water crop:', error);
      return false;
    }
  };

  const plantCrop = async (cropType: string, plotIndex: number): Promise<boolean> => {
    try {
      const result = await (apiService as any).request('/api/v1/farm/plant', {
        method: 'POST',
        body: JSON.stringify({ crop_type: cropType, plot_index: plotIndex }),
      });
      if (result.success) {
        await refreshFarm();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to plant crop:', error);
      return false;
    }
  };

  const harvestCrop = async (plotIndex: number): Promise<boolean> => {
    try {
      const result = await (apiService as any).request('/api/v1/farm/harvest', {
        method: 'POST',
        body: JSON.stringify({ plot_index: plotIndex }),
      });
      if (result.success) {
        await refreshFarm();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to harvest crop:', error);
      return false;
    }
  };

  const buyAnimal = async (animalType: string, slotIndex: number): Promise<boolean> => {
    try {
      const result = await (apiService as any).request('/api/v1/farm/buy-animal', {
        method: 'POST',
        body: JSON.stringify({ animal_type: animalType, slot_index: slotIndex }),
      });
      if (result.success) {
        await refreshFarm();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to buy animal:', error);
      return false;
    }
  };

  const harvestAnimal = async (slotIndex: number): Promise<boolean> => {
    try {
      const result = await (apiService as any).request('/api/v1/farm/harvest-animal', {
        method: 'POST',
        body: JSON.stringify({ slot_index: slotIndex }),
      });
      if (result.success) {
        await refreshFarm();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to harvest animal:', error);
      return false;
    }
  };

  const upgradeFarm = async (): Promise<boolean> => {
    try {
      const result = await (apiService as any).request('/api/v1/farm/upgrade', {
        method: 'POST',
      });
      if (result.success) {
        await refreshFarm();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to upgrade farm:', error);
      return false;
    }
  };

  const dailyLogin = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const result = await (apiService as any).request('/api/v1/game-state/daily-login', {
        method: 'POST',
      });
      if (result.success) {
        await refreshFarm();
      }
      return { success: result.success, message: result.message || '' };
    } catch (error) {
      console.error('Failed to claim daily login:', error);
      return { success: false, message: 'Already claimed today' };
    }
  };

  return (
    <FarmContext.Provider
      value={{
        farmStatus,
        loading,
        refreshFarm,
        tillPlot,
        waterCrop,
        plantCrop,
        harvestCrop,
        buyAnimal,
        harvestAnimal,
        upgradeFarm,
        dailyLogin,
      }}
    >
      {children}
    </FarmContext.Provider>
  );
}

export function useFarm() {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error('useFarm must be used within FarmProvider');
  }
  return context;
}
