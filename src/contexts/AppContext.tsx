import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Personality } from '../types/personality';
import type { APIResponse, GroupSession, GroupParticipant } from '../types/api';
import type { HealthCheck } from '../types/health';
import type { SessionInfo } from '../types/api';
import { apiService } from '../services/api';

interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
}

interface GroupSessionState {
  groupSession: GroupSession | null;
  host: GroupParticipant | null;
  guest: GroupParticipant | null;
  isHost: boolean;
  counselorId: number | null;
}

interface AppContextType {
  clientId: number | null;
  setClientId: (id: number | null) => void;
  authToken: string | null;
  setAuthToken: (token: string | null) => void;
  isAuthenticated: boolean;
  authLoading: boolean;
  clientLoading: boolean;
  sessionId: number | null;
  setSessionId: (id: number | null) => void;
  counselor: Personality | null;
  setCounselor: (counselor: Personality | null) => void;
  showInventory: boolean;
  setShowInventory: (show: boolean) => void;
  showInventoryFullScreen: boolean;
  setShowInventoryFullScreen: (show: boolean) => void;
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
  logout: () => void;
  sessions: SessionInfo[];
  loadSessions: () => Promise<void>;
  resumeSession: (session: SessionInfo) => Promise<void>;
  endCurrentSession: () => Promise<void>;
  isResumingSession: boolean;
  groupSessionState: GroupSessionState;
  createGroupSession: (friendId: number, counselorId: number) => Promise<string | null>;
  joinGroupSession: (inviteCode: string) => Promise<boolean>;
  leaveGroupSession: () => Promise<void>;
  loadActiveGroupSession: () => Promise<void>;
  clearGroupSession: () => void;
  startGroupSession: (groupId: number) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [clientId, setClientId] = useState<number | null>(null);
  const [authToken, setAuthTokenState] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [clientLoading, setClientLoading] = useState(true);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [counselor, setCounselor] = useState<Personality | null>(null);
  const [showInventory, setShowInventory] = useState(false);
  const [showInventoryFullScreen, setShowInventoryFullScreen] = useState(false);
  const [sessionMessageCount, setSessionMessageCount] = useState(0);
  const [toast, setToast] = useState<Toast | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthCheck | null>(null);
  const [lastHealthCheck, setLastHealthCheck] = useState<string | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [consecutiveHealthFailures, setConsecutiveHealthFailures] = useState(0);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const healthIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isResumingSession, setIsResumingSession] = useState(false);
  const [groupSessionState, setGroupSessionState] = useState<GroupSessionState>({
    groupSession: null,
    host: null,
    guest: null,
    isHost: false,
    counselorId: null,
  });

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
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    const token = localStorage.getItem('gameapy_auth_token');
    const storedClientId = localStorage.getItem('gameapy_client_id_int');

    if (!token) {
      setIsAuthenticated(false);
      setAuthLoading(false);
      setClientLoading(false);
      return;
    }

    try {
      apiService.setAuthToken(token);
      
      const storedSessionId = localStorage.getItem('gameapy_session_id');
      if (storedSessionId) {
        setSessionId(parseInt(storedSessionId));
      }
      
      if (storedClientId) {
        setClientId(parseInt(storedClientId));
      }
      
      setAuthTokenState(token);
      setIsAuthenticated(true);
      
      await loadActiveGroupSession();
    } catch (error) {
      localStorage.removeItem('gameapy_auth_token');
      localStorage.removeItem('gameapy_client_id_int');
      setIsAuthenticated(false);
    } finally {
      setAuthLoading(false);
      setClientLoading(false);
    }
  };

  const setAuthToken = (token: string | null) => {
    setAuthTokenState(token);
    apiService.setAuthToken(token);
    setIsAuthenticated(!!token);
  };

  const logout = () => {
    setAuthToken(null);
    setClientId(null);
    setCounselor(null);
    setSessionId(null);
    setSessions([]);
    localStorage.removeItem('gameapy_auth_token');
    localStorage.removeItem('gameapy_client_id_int');
    localStorage.removeItem('gameapy_session_id');
  };

  const generateMissingSummaries = useCallback(async (loadedSessions: SessionInfo[]) => {
    const sessionsNeedingSummary = loadedSessions.filter(s => !s.summary).slice(0, 5);
    if (sessionsNeedingSummary.length === 0) return;

    for (let i = 0; i < sessionsNeedingSummary.length; i++) {
      const session = sessionsNeedingSummary[i];
      try {
        const result = await apiService.summarizeSession(session.id);
        if (result.success && result.data?.summary) {
          setSessions(prev => prev.map(s => 
            s.id === session.id ? { ...s, summary: result.data!.summary } : s
          ));
        }
      } catch (err) {
        console.error(`Failed to generate summary for session ${session.id}:`, err);
      }
      if (i < sessionsNeedingSummary.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 15000));
      }
    }
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      const response = await apiService.getAllSessions(50);
      if (response.success && 'sessions' in response) {
        setSessions(response.sessions);
        generateMissingSummaries(response.sessions);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  }, [generateMissingSummaries]);

  const resumeSession = async (session: SessionInfo) => {
    setIsResumingSession(true);
    try {
      const defaultPersonality = await apiService.getDefaultPersonality();
      const counselor: Personality = {
        id: session.counselor_id,
        name: session.counselor_name,
        description: '',
        specialty: '',
        visuals: defaultPersonality?.visuals || {
          primaryColor: '#F8F0D8',
          secondaryColor: '#E8E0C8',
          borderColor: '#D8D0B8',
          textColor: '#483018',
          chatBubble: {
            backgroundColor: '#F8F0D8',
            borderColor: '#D8D0B8',
            borderWidth: '2px',
            borderStyle: 'solid',
            borderRadius: '8px',
            textColor: '#483018',
          },
          selectionCard: {
            backgroundColor: '#F8F0D8',
            hoverBackgroundColor: '#F8F0D8CC',
            borderColor: '#D8D0B8',
            textColor: '#483018',
          },
          chatBackdrop: {
            type: 'gradient' as const,
            gradient: 'linear-gradient(180deg, #F8F0D8 0%, #E8E0C8 100%)',
          },
        },
      };
      setCounselor(counselor);
      setSessionId(session.id);
      localStorage.setItem('gameapy_session_id', session.id.toString());
    } catch (error) {
      console.error('Failed to resume session:', error);
      showToast({ message: 'Failed to resume session', type: 'error' });
    } finally {
      setIsResumingSession(false);
    }
  };

  const endCurrentSession = async () => {
    if (sessionId) {
      try {
        await apiService.endSession(sessionId);
        await loadSessions();
      } catch (error) {
        console.error('Failed to end session:', error);
      }
    }
  };

  const createSessionForCounselor = async (counselorId: number) => {
    try {
      const response = await apiService.createSession({
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

  const handleSetCounselor = async (newCounselor: Personality | null) => {
    setCounselor(newCounselor);

    if (newCounselor) {
      await createSessionForCounselor(newCounselor.id);
    } else {
      setSessionId(null);
      localStorage.setItem('gameapy_session_id', '');
    }
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

  const createGroupSession = async (friendId: number, counselorId: number): Promise<string | null> => {
    try {
      const response = await apiService.createGroupSession(friendId, counselorId);
      if (response.success && response.data) {
        const { group_session, invite_code } = response.data as any;
        
        const groupInfo = await apiService.getGroupSession(group_session.id);
        const host = groupInfo.success && groupInfo.data ? groupInfo.data.host : null;
        
        setGroupSessionState({
          groupSession: group_session,
          host: host,
          guest: null,
          isHost: true,
          counselorId: counselorId,
        });
        setSessionId(group_session.session_id);
        localStorage.setItem('gameapy_session_id', group_session.session_id.toString());
        return invite_code;
      }
      return null;
    } catch (error) {
      console.error('Failed to create group session:', error);
      showToast({ message: 'Failed to create group session', type: 'error' });
      return null;
    }
  };

  const joinGroupSession = async (inviteCode: string): Promise<boolean> => {
    try {
      const response = await apiService.joinGroupSession(inviteCode);
      if (response.success && response.data) {
        const { group_session, host } = response.data as any;
        setGroupSessionState({
          groupSession: group_session,
          host: host ? { id: host.id, name: host.name, username: host.username, role: 'host' } : null,
          guest: null,
          isHost: false,
          counselorId: group_session.counselor_id,
        });
        setSessionId(group_session.session_id);
        localStorage.setItem('gameapy_session_id', group_session.session_id.toString());
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to join group session:', error);
      showToast({ message: 'Failed to join group session', type: 'error' });
      return false;
    }
  };

  const leaveGroupSession = async () => {
    if (!groupSessionState.groupSession) return;
    
    try {
      await apiService.leaveGroupSession(groupSessionState.groupSession.id);
      clearGroupSession();
    } catch (error) {
      console.error('Failed to leave group session:', error);
      showToast({ message: 'Failed to leave group session', type: 'error' });
    }
  };

  const loadActiveGroupSession = async () => {
    try {
      const response = await apiService.getActiveGroupSession();
      if (response.success && response.data) {
        const { group_session, host, guest, is_host } = response.data as any;
        if (group_session) {
          setGroupSessionState({
            groupSession: group_session,
            host: host ? { id: host.id, name: host.name, username: host.username, role: 'host' } : null,
            guest: guest ? { id: guest.id, name: guest.name, username: guest.username, role: 'guest' } : null,
            isHost: is_host,
            counselorId: group_session.counselor_id,
          });
          setSessionId(group_session.session_id);
          localStorage.setItem('gameapy_session_id', group_session.session_id.toString());
        }
      }
    } catch (error) {
      console.error('Failed to load active group session:', error);
    }
  };

  const clearGroupSession = () => {
    setGroupSessionState({
      groupSession: null,
      host: null,
      guest: null,
      isHost: false,
      counselorId: null,
    });
  };

  const startGroupSession = async (groupId: number) => {
    try {
      const response = await apiService.getGroupSession(groupId);
      if (response.success && response.data) {
        const { group_session, host, guest, is_host } = response.data as any;
        if (group_session) {
          setGroupSessionState({
            groupSession: group_session,
            host: host ? { id: host.id, name: host.name, username: host.username, role: 'host' } : null,
            guest: guest ? { id: guest.id, name: guest.name, username: guest.username, role: 'guest' } : null,
            isHost: is_host,
            counselorId: group_session.counselor_id,
          });
          setSessionId(group_session.session_id);
          localStorage.setItem('gameapy_session_id', group_session.session_id.toString());
        }
      }
    } catch (error) {
      console.error('Failed to start group session:', error);
      showToast({ message: 'Failed to start group session', type: 'error' });
    }
  };

  return (
    <AppContext.Provider
      value={{
        clientId,
        setClientId,
        authToken,
        setAuthToken,
        isAuthenticated,
        authLoading,
        clientLoading,
        sessionId,
        setSessionId,
        counselor,
        setCounselor: handleSetCounselor,
        showInventory,
        setShowInventory,
        showInventoryFullScreen,
        setShowInventoryFullScreen,
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
        logout,
        sessions,
        loadSessions,
        resumeSession,
        endCurrentSession,
        isResumingSession,
        groupSessionState,
        createGroupSession,
        joinGroupSession,
        leaveGroupSession,
        loadActiveGroupSession,
        clearGroupSession,
        startGroupSession,
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
