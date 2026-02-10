import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Counselor } from '../types/counselor';
import type { APIResponse } from '../types/api';
import { apiService } from '../services/api';

interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  clientId: number | null;
  clientLoading: boolean;
  sessionId: number | null;
  counselor: Counselor | null;
  setCounselor: (counselor: Counselor | null) => void;
  showInventory: boolean;
  setShowInventory: (show: boolean) => void;
  showInventoryFullScreen: boolean;
  setShowInventoryFullScreen: (show: boolean) => void;
  initializeClient: () => Promise<void>;
  showGuide: boolean;
  setShowGuide: (show: boolean) => void;
  guideSessionId: number | null;
  setGuideSessionId: (id: number | null) => void;
  startGuide: () => Promise<void>;
  endGuide: () => void;
  sessionMessageCount: number;
  incrementSessionMessageCount: () => void;
  resetSessionMessageCount: () => void;
  toast: Toast | null;
  showToast: (toast: Toast) => void;
  hideToast: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [clientId, setClientId] = useState<number | null>(null);
  const [clientLoading, setClientLoading] = useState(true);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [counselor, setCounselor] = useState<Counselor | null>(null);
  const [showInventory, setShowInventory] = useState(false);
  const [showInventoryFullScreen, setShowInventoryFullScreen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [guideSessionId, setGuideSessionId] = useState<number | null>(null);
  const [sessionMessageCount, setSessionMessageCount] = useState(0);
  const [toast, setToast] = useState<Toast | null>(null);

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

  const startGuide = async () => {
    if (!clientId) {
      console.error('Cannot start guide: No client ID');
      return;
    }

    try {
      const response = await apiService.startGuideConversation(clientId);
      if (response.success && response.data) {
        setGuideSessionId(response.data.session_id);
        setShowGuide(true);
      }
    } catch (error) {
      console.error('Failed to start guide:', error);
    }
  };

  const endGuide = () => {
    setShowGuide(false);
    setGuideSessionId(null);
  };

  const incrementSessionMessageCount = () => {
    setSessionMessageCount(prev => prev + 1);
  };

  const resetSessionMessageCount = () => {
    setSessionMessageCount(0);
  };

  const showToast = (newToast: Toast) => {
    setToast(newToast);
    setTimeout(() => setToast(null), 3000);
  };

  const hideToast = () => {
    setToast(null);
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
        showInventoryFullScreen,
        setShowInventoryFullScreen,
        initializeClient,
        showGuide,
        setShowGuide,
        guideSessionId,
        setGuideSessionId,
        startGuide,
        endGuide,
        sessionMessageCount,
        incrementSessionMessageCount,
        resetSessionMessageCount,
        toast,
        showToast,
        hideToast,
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
