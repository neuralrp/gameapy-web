import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Counselor } from '../types/counselor';
import type { APIResponse } from '../types/api';
import { apiService } from '../services/api';

interface AppContextType {
  clientId: number | null;
  clientLoading: boolean;
  sessionId: number | null;
  counselor: Counselor | null;
  setCounselor: (counselor: Counselor | null) => void;
  showInventory: boolean;
  setShowInventory: (show: boolean) => void;
  initializeClient: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [clientId, setClientId] = useState<number | null>(null);
  const [clientLoading, setClientLoading] = useState(true);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [counselor, setCounselor] = useState<Counselor | null>(null);
  const [showInventory, setShowInventory] = useState(false);

  useEffect(() => {
    initializeClient();
  }, []);

  const initializeClient = async () => {
    const storedId = localStorage.getItem('gameapy_client_id_int');

    if (storedId) {
      setClientId(parseInt(storedId));
      setClientLoading(false);
      return;
    }

    try {
      const response = await apiService.createClient({
        name: 'Gameapy User',
        personality: 'New user',
        traits: [],
        goals: [],
        presenting_issues: [],
        life_events: [],
      }) as APIResponse<{ client_id: number }>;

      if (response.success && response.data?.client_id) {
        const newClientId = response.data.client_id;
        localStorage.setItem('gameapy_client_id_int', newClientId.toString());
        localStorage.setItem('gameapy_session_id', '');
        setClientId(newClientId);
      }
    } catch (error) {
      console.error('Failed to create client:', error);
    } finally {
      setClientLoading(false);
    }
  };

  const createSessionForCounselor = async (counselorId: number) => {
    if (!clientId) return;

    try {
      const response = await apiService.createSession({
        client_id: clientId,
        counselor_id: counselorId,
      }) as APIResponse<{ session_id: number }>;

      if (response.success && response.data?.session_id) {
        const newSessionId = response.data.session_id;
        setSessionId(newSessionId);
        localStorage.setItem('gameapy_session_id', newSessionId.toString());
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleSetCounselor = async (newCounselor: Counselor | null) => {
    setCounselor(newCounselor);

    if (newCounselor && clientId) {
      await createSessionForCounselor(newCounselor.id);
    } else {
      setSessionId(null);
      localStorage.setItem('gameapy_session_id', '');
    }
  };

  return (
    <AppContext.Provider
      value={{
        clientId,
        clientLoading,
        sessionId,
        counselor,
        setCounselor: handleSetCounselor,
        showInventory,
        setShowInventory,
        initializeClient,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
