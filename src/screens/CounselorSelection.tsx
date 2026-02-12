import { useState, useEffect } from 'react';
import { Plus, Layers, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { apiService } from '../services/api';
import type { Counselor } from '../types/counselor';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { ErrorMessage } from '../components/shared/ErrorMessage';

export function CounselorSelection() {
  const { setCounselor, setShowInventoryFullScreen, logout } = useApp();
  const navigate = useNavigate();

  const [selectedCounselor, setSelectedCounselor] = useState<Counselor | null>(null);
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCounselors = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const loadedCounselors = await apiService.getCounselors();
        setCounselors(loadedCounselors);
      } catch (err) {
        console.error('Error loading counselors:', err);
        setError(err instanceof Error ? err.message : 'Failed to load counselors');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCounselors();
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
      <div className="h-full overflow-y-auto p-4 pt-20 pb-20">
        <div className="grid grid-cols-2 gap-4 max-w-4xl mx-auto">
          {counselors.map((counselor) => {
            const imageUrl = counselor.visuals.selectionCard.image;
            const bgColor = getCounselorColor(counselor);

            return (
              <button
                key={counselor.id}
                onClick={() => handleSelect(counselor)}
                className={`
                  aspect-square transition-all duration-200
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
                {!imageUrl && (
                  <div className="h-full flex items-center justify-center p-4">
                    <span className="text-gba-text font-bold text-center">
                      {counselor.name}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
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
