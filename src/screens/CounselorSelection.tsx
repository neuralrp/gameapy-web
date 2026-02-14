import { useState, useEffect } from 'react';
import { Plus, Layers, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { apiService } from '../services/api';
import type { Counselor } from '../types/counselor';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { ErrorMessage } from '../components/shared/ErrorMessage';
import { FarmEntryCard } from '../components/farm/FarmEntryCard';
import { HeartRating } from '../components/ui/HeartRating';

type FriendshipMap = Record<number, number>;

export function CounselorSelection() {
  const { setCounselor, setShowInventoryFullScreen, logout } = useApp();
  const navigate = useNavigate();

  const [selectedCounselor, setSelectedCounselor] = useState<Counselor | null>(null);
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [friendshipLevels, setFriendshipLevels] = useState<FriendshipMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleFarmClick = () => {
    navigate('/farm');
  };

  const getCounselorColor = (counselor: Counselor) => {
    return counselor.visuals.selectionCard.backgroundColor;
  };

  const truncateName = (name: string, maxLen: number = 15) =>
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
    <div className="h-screen relative">
      <div className="h-full overflow-y-auto p-4 pt-20 pb-8">
        <div className="text-center mb-6 mt-4">
          <h1 className="text-3xl font-bold text-gba-text mb-1">Gameapy</h1>
          <p className="text-sm text-gba-text/70">AI that grows with you</p>
        </div>
        <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto">
          {counselors.map((counselor) => {
            const imageUrl = counselor.visuals.selectionCard.image;
            const bgColor = getCounselorColor(counselor);

            return (
              <button
                key={counselor.id}
                onClick={() => handleSelect(counselor)}
                className={`
                  relative aspect-square transition-all duration-200
                  ${selectedCounselor?.id === counselor.id ? 'selected' : ''}
                  ${imageUrl ? 'counselor-image' : ''}
                  rounded-lg border-2 border-gba-border
                  hover:scale-[1.02] active:scale-[0.98]
                `}
                style={{
                  backgroundImage: imageUrl ? `url(${encodeURI(imageUrl)})` : undefined,
                  backgroundColor: !imageUrl ? bgColor : undefined,
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: 'cover'
                }}
                aria-label={`Select ${counselor.name}`}
              >
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 rounded-b-md">
                  <span className="text-white font-bold text-xs drop-shadow-md block">
                    {truncateName(counselor.name)}
                  </span>
                  <HeartRating 
                    level={friendshipLevels[counselor.id] || 0} 
                    size="sm" 
                    className="mt-1 justify-center"
                  />
                </div>
              </button>
            );
          })}
          <FarmEntryCard onClick={handleFarmClick} />
        </div>

        <div className="mt-8 max-w-md mx-auto space-y-3 px-4">
          <div className="p-3 bg-gba-ui/50 border border-gba-border rounded-lg">
            <p className="text-sm text-gba-text">
              <strong>Talk to an advisor</strong> by pressing them, or <strong>create your own</strong> by pressing the "+"!
            </p>
          </div>
          <div className="p-3 bg-gba-ui/50 border border-gba-border rounded-lg">
            <p className="text-sm text-gba-text">
              <strong>Create or edit cards</strong> by pressing the
              <span className="inline-flex items-center mx-1"><Layers className="w-4 h-4" /></span>
              icon! This is how your advisor knows who you are.
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={handleCreateAdvisor}
        className="absolute top-4 left-4 min-h-[44px] min-w-[44px] p-2 bg-gba-grass border-2 border-gba-border rounded-lg flex items-center justify-center hover:bg-gba-grass/90 transition-colors"
        aria-label="Create custom advisor"
      >
        <Plus className="w-6 h-6 text-gba-text" />
      </button>

      <button
        onClick={handleSettings}
        className="absolute top-4 right-16 min-h-[44px] min-w-[44px] p-2 bg-gba-ui border-2 border-gba-border rounded-lg hover:bg-gba-ui/90 transition-colors"
        aria-label="View cards"
      >
        <Layers className="w-6 h-6 text-gba-text" />
      </button>

      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 min-h-[44px] min-w-[44px] p-2 bg-gba-ui border-2 border-gba-border rounded-lg hover:bg-gba-ui/90 transition-colors"
        aria-label="Logout"
      >
        <LogOut className="w-6 h-6 text-gba-text" />
      </button>
    </div>
  );
}
