import { useState, useEffect } from 'react';
import { Plus, Layers, LogOut, HelpCircle, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { apiService } from '../services/api';
import type { Counselor } from '../types/counselor';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { ErrorMessage } from '../components/shared/ErrorMessage';
import { HelpModal } from '../components/shared/HelpModal';
import { HeartRating } from '../components/ui/HeartRating';
import { VideoBackground } from '../components/ui/VideoBackground';

type FriendshipMap = Record<number, number>;

export function CounselorSelection() {
  const { setCounselor, setShowInventoryFullScreen, logout } = useApp();
  const navigate = useNavigate();

  const [selectedCounselor, setSelectedCounselor] = useState<Counselor | null>(null);
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [friendshipLevels, setFriendshipLevels] = useState<FriendshipMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(true);

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
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const loadedCounselors = await apiService.getCounselors();
        setCounselors(loadedCounselors);
        
        const friendshipResponse = await apiService.getAllFriendshipLevels();
        if (friendshipResponse.success && friendshipResponse.data?.friendships) {
          const levelMap: FriendshipMap = {};
          friendshipResponse.data.friendships.forEach((f) => {
            levelMap[f.counselor_id] = f.level;
          });
          setFriendshipLevels(levelMap);
        }
      } catch (err) {
        console.error('Error loading counselors:', err);
        setError(err instanceof Error ? err.message : 'Failed to load counselors');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSelect = (counselor: Counselor) => {
    setSelectedCounselor(counselor);
    setCounselor(counselor);
  };

  const handleSettings = () => {
    setShowInventoryFullScreen(true);
  };

  const handleCreateAdvisor = () => {
    navigate('/create-advisor');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getCounselorColor = (counselor: Counselor) => {
    return counselor.visuals.selectionCard.backgroundColor;
  };

  const truncateName = (name: string, maxLen: number = 18) =>
    name.length > maxLen ? name.slice(0, maxLen) + '…' : name;

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading counselors..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center p-4">
        <ErrorMessage
          message={error}
          onRetry={() => {
            setError(null);
            setIsLoading(true);
            apiService.getCounselors()
              .then(setCounselors)
              .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load counselors'))
              .finally(() => setIsLoading(false));
          }}
        />
      </div>
    );
  }

  return (
    <div className="h-screen relative overflow-hidden">
      <VideoBackground videoSrc="/homescreen-video.mp4" />

      {!isPanelOpen && (
        <button
          onClick={() => setIsPanelOpen(true)}
          className="absolute top-4 right-4 z-50 min-h-[44px] min-w-[44px] p-2 bg-gba-ui/95 border-2 border-gba-border rounded-lg hover:bg-gba-ui transition-colors backdrop-blur-sm sm:hidden"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6 text-gba-text" />
        </button>
      )}

      <div
        className={`
          fixed top-0 right-0 h-full border-l-2 border-gba-border
          bg-cover bg-center
          transition-transform duration-300 ease-in-out z-40
          w-[280px] sm:translate-x-0
          ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        style={{ backgroundImage: "url('/panel-bg.png')" }}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-3 border-b-2 border-gba-border">
            <div className="flex gap-2">
              <button
                onClick={handleCreateAdvisor}
                className="min-h-[36px] min-w-[36px] p-2 bg-gba-grass border-2 border-gba-border rounded-lg flex items-center justify-center hover:bg-gba-grass/90 transition-colors"
                aria-label="Create custom advisor"
              >
                <Plus className="w-5 h-5 text-gba-text" />
              </button>

              <button
                onClick={handleSettings}
                className="min-h-[36px] min-w-[36px] p-2 bg-gba-bg border-2 border-gba-border rounded-lg hover:bg-gba-bg/90 transition-colors"
                aria-label="View cards"
              >
                <Layers className="w-5 h-5 text-gba-text" />
              </button>

              <button
                onClick={handleLogout}
                className="min-h-[36px] min-w-[36px] p-2 bg-gba-bg border-2 border-gba-border rounded-lg hover:bg-gba-bg/90 transition-colors"
                aria-label="Logout"
              >
                <LogOut className="w-5 h-5 text-gba-text" />
              </button>
            </div>

            <button
              onClick={() => setIsPanelOpen(false)}
              className="min-h-[36px] min-w-[36px] p-2 bg-gba-bg border-2 border-gba-border rounded-lg hover:bg-gba-bg/90 transition-colors sm:hidden"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 text-gba-text" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <h2 className="text-lg font-bold text-gba-text mb-3">Choose an Advisor</h2>
            <div className="space-y-2">
              {counselors.map((counselor) => {
                const imageUrl = counselor.visuals.selectionCard.image;
                const bgColor = getCounselorColor(counselor);

                return (
                  <button
                    key={counselor.id}
                    onClick={() => handleSelect(counselor)}
                    className={`
                      w-full flex items-center gap-3 p-2 rounded-lg border-2 border-gba-border
                      transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                      ${selectedCounselor?.id === counselor.id ? 'ring-2 ring-gba-highlight border-gba-highlight' : ''}
                    `}
                    style={{ backgroundColor: bgColor }}
                    aria-label={`Select ${counselor.name}`}
                  >
                    <div
                      className="w-12 h-12 rounded-md flex-shrink-0 border border-gba-border bg-cover bg-center"
                      style={{
                        backgroundImage: imageUrl ? `url(${encodeURI(imageUrl)})` : undefined,
                        backgroundColor: !imageUrl ? bgColor : undefined,
                      }}
                    />
                    <div className="flex-1 text-left min-w-0">
                      <span className="text-gba-text font-bold text-sm drop-shadow-md block truncate">
                        {truncateName(counselor.name)}
                      </span>
                      <HeartRating
                        level={friendshipLevels[counselor.id] || 0}
                        size="sm"
                        className="mt-0.5"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3 border-t-2 border-gba-border">
            <button
              onClick={() => setShowHelp(true)}
              className="w-full min-h-[44px] p-2 bg-blue-500 border-2 border-blue-600 rounded-lg flex items-center justify-center gap-2 hover:brightness-110 transition-all"
              aria-label="Help"
            >
              <HelpCircle className="w-5 h-5 text-white" />
              <span className="text-white font-bold text-sm">Help</span>
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

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
