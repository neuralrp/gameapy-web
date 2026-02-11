import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Counselor } from '../types/counselor';
import type { APIResponse } from '../types/api';
import type { HealthCheck } from '../types/health';
import { apiService } from '../services/api';

interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  clientId: number | null;
  setClientId: (id: number | null) => void;
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
  healthStatus: HealthCheck | null;
  lastHealthCheck: string | null;
  healthError: string | null;
  isCheckingHealth: boolean;
  consecutiveHealthFailures: number;
  showHealthModal: boolean;
  setShowHealthModal: (show: boolean) => void;
  startHealthChecks: () => void;
  stopHealthChecks: () => void;
  checkHealthNow: () => Promise<void>;
  // Recovery code
  recoveryCode: string | null;
  setRecoveryCode: (code: string | null) => void;
  showRecoveryCodeModal: boolean;
  setShowRecoveryCodeModal: (show: boolean) => void;
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
  const [healthStatus, setHealthStatus] = useState<HealthCheck | null>(null);
  const [lastHealthCheck, setLastHealthCheck] = useState<string | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [consecutiveHealthFailures, setConsecutiveHealthFailures] = useState(0);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const healthIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Recovery code state
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [showRecoveryCodeModal, setShowRecoveryCodeModal] = useState(false);

  const calculateNextRetryDelay = () => {
    if (consecutiveHealthFailures === 0) {
      return 45000;
    }
    const delay = Math.min(5 * Math.pow(2, consecutiveHealthFailures - 1), 45000);
    return Math.max(delay, 5000);
  };

  const scheduleNextHealthCheck = () => {
    if (healthIntervalRef.current) {
      clearInterval(healthIntervalRef.current);
    }
    const delay = calculateNextRetryDelay();
    healthIntervalRef.current = setInterval(checkHealthNow, delay);
  };

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
      }) as APIResponse<{ client_id: number; recovery_code: string }>;

      if (response.success && response.data?.client_id) {
        const newClientId = response.data.client_id;
        localStorage.setItem('gameapy_client_id_int', newClientId.toString());
        localStorage.setItem('gameapy_session_id', '');
        setClientId(newClientId);
        
        // Store recovery code and show modal for new clients
        if (response.data.recovery_code) {
          setRecoveryCode(response.data.recovery_code);
          setShowRecoveryCodeModal(true);
        }
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

  const checkHealthNow = async (notifyOnRestore = false) => {
    setIsCheckingHealth(true);
    setHealthError(null);

    try {
      const health = await apiService.checkHealth();
      setHealthStatus(health);
      setLastHealthCheck(new Date().toISOString());
      if (consecutiveHealthFailures > 0 && notifyOnRestore) {
        showToast({ message: '✅ Connection restored', type: 'success' });
      }
      setConsecutiveHealthFailures(0);
      scheduleNextHealthCheck();
    } catch (error) {
      setHealthError(error instanceof Error ? error.message : 'Health check failed');
      setConsecutiveHealthFailures(prev => {
        if (prev === 0) {
          showToast({ message: '⚠️ Connection lost, retrying...', type: 'error' });
        }
        return prev + 1;
      });
      scheduleNextHealthCheck();
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const startHealthChecks = () => {
    setConsecutiveHealthFailures(0);
    checkHealthNow();
  };

  const stopHealthChecks = () => {
    if (healthIntervalRef.current) {
      clearInterval(healthIntervalRef.current);
      healthIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopHealthChecks();
    };
  }, []);

  return (
    <AppContext.Provider
      value={{
        clientId,
        setClientId,
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
        healthStatus,
        lastHealthCheck,
        healthError,
        isCheckingHealth,
        consecutiveHealthFailures,
        showHealthModal,
        setShowHealthModal,
        startHealthChecks,
        stopHealthChecks,
        checkHealthNow,
        // Recovery code
        recoveryCode,
        setRecoveryCode,
        showRecoveryCodeModal,
        setShowRecoveryCodeModal,
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
