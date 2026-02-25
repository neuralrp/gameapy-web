import { useState, useEffect } from 'react';
import { MessageSquare, LogOut, Menu, X, Loader2, Plus, Users, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { apiService } from '../services/api';
import type { SessionInfo, APIResponse } from '../types/api';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { ErrorMessage } from '../components/shared/ErrorMessage';
import { VideoBackground } from '../components/ui/VideoBackground';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function MainScreen() {
  const { 
    sessions, 
    loadSessions, 
    resumeSession, 
    isResumingSession,
    setShowInventoryFullScreen,
    logout,
    setCounselor,
    setSessionId,
    startGroupSession
  } = useApp();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [pendingFriendCount, setPendingFriendCount] = useState(0);
  const [groupSessions, setGroupSessions] = useState<SessionInfo[]>([]);

  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth < 640) {
        setIsPanelOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await loadSessions();
        const groupRes = await apiService.getGroupHistory();
        if (groupRes.success && groupRes.data) {
          setGroupSessions(groupRes.data);
        }
      } catch (err) {
        console.error('Error loading sessions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load chat history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, [loadSessions]);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const res = await apiService.getPendingFriendRequests();
        if (res.success && res.data) {
          setPendingFriendCount(res.data.length);
        }
      } catch (err) {
        console.error('Failed to fetch pending friend requests:', err);
      }
    };
    fetchPendingCount();
  }, []);

  const handleStartChat = async () => {
    try {
      setIsStartingChat(true);
      const defaultPersonality = await apiService.getDefaultPersonality();
      if (defaultPersonality) {
        const response = await apiService.createSession({
          counselor_id: defaultPersonality.id,
        }) as APIResponse<{ session_id: number }>;
        if (response.success && response.data?.session_id) {
          const sessionId = response.data.session_id;
          
          await apiService.playCardToTable(
            sessionId,
            'far_left',
            'personality',
            defaultPersonality.id
          );
          
          const counselor = {
            id: defaultPersonality.id,
            name: defaultPersonality.name,
            description: defaultPersonality.description || '',
            specialty: defaultPersonality.specialty || '',
            visuals: defaultPersonality.visuals || {
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
          setSessionId(sessionId);
          localStorage.setItem('gameapy_session_id', sessionId.toString());
        }
      }
    } catch (err) {
      console.error('Error starting chat:', err);
      setError(err instanceof Error ? err.message : 'Failed to start chat');
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleResumeChat = async (session: SessionInfo) => {
    await resumeSession(session);
  };

  const handleResumeGroupChat = async (groupSession: SessionInfo) => {
    try {
      if (groupSession.status === 'ended') {
        const res = await apiService.resumeGroupSession(groupSession.group_id!);
        if (!res.success) {
          setError('Failed to resume group chat');
          return;
        }
      }
      startGroupSession(groupSession.group_id!);
      navigate('/chat');
    } catch (err) {
      console.error('Error resuming group chat:', err);
      setError(err instanceof Error ? err.message : 'Failed to resume group chat');
    }
  };

  const handleDeleteSession = async (sessionId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this chat?')) return;
    try {
      await apiService.deleteSession(sessionId);
      await loadSessions();
    } catch (err) {
      console.error('Failed to delete session:', err);
      setError('Failed to delete chat');
    }
  };

  const handleClearAllSessions = async () => {
    if (!confirm('Delete all chat history? This cannot be undone.')) return;
    try {
      await apiService.clearAllSessions();
      await loadSessions();
    } catch (err) {
      console.error('Failed to clear sessions:', err);
      setError('Failed to clear chat history');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading chat history..." />
      </div>
    );
  }

  return (
    <div className="h-screen relative overflow-hidden">
      <VideoBackground videoSrc="/homescreen-video.mp4" />

      {!isPanelOpen && (
        <button
          onClick={() => setIsPanelOpen(true)}
          className="absolute top-4 right-4 z-50 min-h-[44px] min-w-[44px] p-2 bg-gba-ui/95 border-2 border-gba-border rounded-lg hover:bg-gba-ui transition-colors backdrop-blur-sm"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6 text-gba-text" />
        </button>
      )}

      <div className={`h-full flex flex-col items-center justify-center p-4 transition-all duration-300 ${isPanelOpen ? 'sm:pr-[300px]' : ''}`}>
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-retro text-white drop-shadow-lg mb-6">
            Welcome back
          </h1>
          <button
            onClick={handleStartChat}
            disabled={isStartingChat}
            className="min-h-[64px] min-w-[200px] px-8 py-4 bg-white border-2 border-gray-200 rounded-2xl text-gray-800 font-bold text-lg hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 mx-auto"
          >
            {isStartingChat ? (
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            ) : (
              <>
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="2" x2="12" y2="22" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
                  <circle cx="12" cy="12" r="3" fill="#60A5FA" stroke="none" />
                  <line x1="12" y1="2" x2="12" y2="5" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                  <line x1="2" y1="12" x2="5" y2="12" />
                  <line x1="19" y1="12" x2="22" y2="12" />
                </svg>
                <span>Start Chat</span>
              </>
            )}
          </button>
          <p className="text-white/70 text-sm mt-3 drop-shadow">
            Start a conversation with Snow
          </p>
        </div>

        {error && (
          <div className="mt-8 max-w-md">
            <ErrorMessage
              message={error}
              onRetry={() => {
                setError(null);
                loadSessions();
              }}
            />
          </div>
        )}
      </div>

      <div
        className={`
          fixed top-0 right-0 h-full border-l-2 border-gba-border
          bg-cover bg-center
          transition-transform duration-300 ease-in-out z-40
          w-[280px]
          ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        style={{ backgroundImage: "url('/panel-bg.png')" }}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-3 border-b-2 border-gba-border">
            <h2 className="text-lg font-bold text-gba-ui">Chat History</h2>
            <div className="flex gap-2">
              <button
                onClick={handleLogout}
                className="min-h-[36px] min-w-[36px] p-2 bg-gba-bg border-2 border-gba-border rounded-lg hover:bg-gba-bg/90 transition-colors"
                aria-label="Logout"
              >
                <LogOut className="w-5 h-5 text-gba-text" />
              </button>

              <button
                onClick={handleClearAllSessions}
                className="min-h-[36px] min-w-[36px] p-2 bg-red-500/20 border-2 border-red-500/50 rounded-lg hover:bg-red-500/30 transition-colors"
                aria-label="Clear all chats"
                title="Clear all chats"
              >
                <Trash2 className="w-5 h-5 text-red-400" />
              </button>

              <button
                onClick={() => setIsPanelOpen(false)}
                className="min-h-[36px] min-w-[36px] p-2 bg-gba-bg border-2 border-gba-border rounded-lg hover:bg-gba-bg/90 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-gba-text" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {sessions.length === 0 && groupSessions.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gba-text/40 mx-auto mb-3" />
                <p className="text-gba-text/60 text-sm">No chats yet</p>
                <p className="text-gba-text/40 text-xs mt-1">Start a conversation to see it here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {groupSessions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-gba-text/70 mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Group Chats
                    </h3>
                    <div className="space-y-2">
                      {groupSessions.map((session) => (
                        <button
                          key={`group-${session.group_id}`}
                          onClick={() => handleResumeGroupChat(session)}
                          disabled={isResumingSession}
                          className="w-full text-left p-3 rounded-lg border-2 border-blue-500/50 bg-blue-500/20 hover:bg-blue-500/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                        >
                          <div className="flex items-start gap-3">
                            <Users className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-gba-text font-medium text-sm truncate">
                                  with {session.friend_name}
                                </p>
                                {session.status === 'active' && (
                                  <span className="px-1.5 py-0.5 bg-green-500/30 text-green-400 text-xs rounded">
                                    Active
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-gba-text/60 text-xs">
                                  {formatDate(session.started_at)}
                                </span>
                                <span className="text-gba-text/40 text-xs">•</span>
                                <span className="text-gba-text/60 text-xs truncate">
                                  {session.counselor_name}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {sessions.length > 0 && (
                  <div>
                    {groupSessions.length > 0 && (
                      <h3 className="text-sm font-bold text-gba-text/70 mb-2">
                        Solo Chats
                      </h3>
                    )}
                    <div className="space-y-2">
                      {sessions.map((session) => (
                        <div
                          key={session.id}
                          onClick={() => handleResumeChat(session)}
                          className="w-full text-left p-3 rounded-lg border-2 border-gba-border bg-gba-ui/50 hover:bg-gba-ui/80 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                        >
                          <div className="flex items-start gap-3">
                            <MessageSquare className="w-5 h-5 text-gba-text/60 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-gba-text font-medium text-sm truncate">
                                {session.summary || 'Chat with ' + session.counselor_name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-gba-text/60 text-xs">
                                  {formatDate(session.started_at)}
                                </span>
                                <span className="text-gba-text/40 text-xs">•</span>
                                <span className="text-gba-text/60 text-xs truncate">
                                  {session.counselor_name}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => handleDeleteSession(session.id, e)}
                              className="p-1 hover:bg-red-500/20 rounded transition-colors flex-shrink-0"
                              aria-label="Delete chat"
                            >
                              <Trash2 className="w-4 h-4 text-red-500/60 hover:text-red-500" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-3 border-t-2 border-gba-border">
            <button
              onClick={() => navigate('/friends')}
              className="w-full min-h-[44px] p-2 bg-red-500 border-2 border-red-600 rounded-lg flex items-center justify-center gap-2 hover:brightness-110 transition-all mb-2 relative"
              aria-label="Friends"
            >
              <Users className="w-5 h-5 text-white" />
              <span className="text-white font-bold text-sm">Friends</span>
              {pendingFriendCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-white text-red-600 text-xs font-bold rounded-full flex items-center justify-center px-1">
                  {pendingFriendCount > 9 ? '9+' : pendingFriendCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowInventoryFullScreen(true)}
              className="w-full min-h-[44px] p-2 bg-gba-grass border-2 border-gba-border rounded-lg flex items-center justify-center gap-2 hover:brightness-110 transition-all"
              aria-label="Create card"
            >
              <Plus className="w-5 h-5 text-gba-text" />
              <span className="text-gba-text font-bold text-sm">Create Card</span>
            </button>
          </div>
        </div>
      </div>

      {isPanelOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 sm:hidden"
          onClick={() => setIsPanelOpen(false)}
        />
      )}
    </div>
  );
}
