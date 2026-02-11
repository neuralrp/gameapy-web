import { useState, useEffect } from 'react';
import { Layers } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { apiService } from '../services/api';
import type { Counselor } from '../types/counselor';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { ErrorMessage } from '../components/shared/ErrorMessage';
import { HealthStatusIcon } from '../components/shared/HealthStatusIcon';
import { HealthStatusModal } from '../components/shared/HealthStatusModal';

export function CounselorSelection() {
  const { setCounselor, setShowInventoryFullScreen, startHealthChecks, stopHealthChecks, setShowHealthModal } = useApp();
  const [selectedCounselor, setSelectedCounselor] = useState<Counselor | null>(null);
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startHealthChecks();
    return () => {
      stopHealthChecks();
    };
  }, []);

  useEffect(() => {
    const fetchCounselors = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const loadedCounselors = await apiService.getCounselors();
        setCounselors(loadedCounselors);
      } catch (err) {
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

  const getCounselorColor = (counselor: Counselor) => {
    return counselor.visuals.selectionCard.backgroundColor;
  };

  return (
    <div className="h-screen fade-in relative">
      {/* Loading State */}
      {isLoading && (
        <div className="h-full flex items-center justify-center">
          <LoadingSpinner message="Loading counselors..." />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="h-full flex items-center justify-center p-4">
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
      )}

      {/* Counselor Color/Image Grid */}
      {!isLoading && !error && (
        <div className="grid grid-cols-2 grid-rows-2 h-screen">
          {counselors.map((counselor) => {
            const imageUrl = counselor.visuals.selectionCard.image;
            const bgColor = getCounselorColor(counselor);

            return (
              <button
                key={counselor.id}
                onClick={() => handleSelect(counselor)}
                className={`
                  color-block transition-all duration-200
                  ${selectedCounselor?.id === counselor.id ? 'selected' : ''}
                `}
                style={{
                  backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
                  backgroundColor: !imageUrl ? bgColor : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
                aria-label={`Select ${counselor.name}`}
              />
            );
          })}
        </div>
      )}

      {/* Stacked Cards Button - Top Right */}
      {!isLoading && !error && (
        <button
          onClick={handleSettings}
          className="icon-button absolute top-4 right-4 min-h-[44px] min-w-[44px] p-2 bg-gba-ui border-2 border-gba-border rounded-lg"
          aria-label="View cards"
        >
          <Layers className="w-6 h-6 text-gba-text" />
        </button>
      )}

      {/* Health Status Button - Top Left */}
      {!isLoading && !error && (
        <HealthStatusIcon onClick={() => setShowHealthModal(true)} className="absolute top-4 left-4" />
      )}

      {/* Health Status Modal */}
      <HealthStatusModal />
    </div>
  );
}
