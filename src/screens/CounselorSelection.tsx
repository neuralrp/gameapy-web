import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { CounselorCard } from '../components/counselor/CounselorCard';
import { useApp } from '../contexts/AppContext';
import { apiService } from '../services/api';
import type { Counselor } from '../types/counselor';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { ErrorMessage } from '../components/shared/ErrorMessage';

export function CounselorSelection() {
  const { setCounselor, setShowInventory } = useApp();
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
    setShowInventory(true);
  };

  return (
    <div className="min-h-screen flex flex-col fade-in">
      {/* Header */}
      <header className="flex justify-between items-center p-4 border-b-2 border-gba-border bg-gba-ui flex-shrink-0">
        <h1 className="font-retro text-2xl text-gba-text">Gameapy</h1>
        <button
          onClick={handleSettings}
          className="p-2 border-2 border-gba-border rounded hover:bg-gba-highlight transition-colors min-h-[44px] min-w-[44px]"
          aria-label="Settings"
        >
          <Settings className="w-6 h-6 text-gba-text" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-4xl">
          <h2 className="font-retro text-3xl text-center text-gba-text mb-8">
            Welcome to Gameapy
          </h2>

          {/* Loading State */}
          {isLoading && (
            <LoadingSpinner message="Loading counselors..." />
          )}

          {/* Error State */}
          {error && (
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
          )}

          {/* Counselor Grid */}
          {!isLoading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {counselors.map((counselor) => (
                <CounselorCard
                  key={counselor.id}
                  counselor={counselor}
                  isSelected={selectedCounselor?.id === counselor.id}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          )}

          {!isLoading && !error && counselors.length > 0 && (
            <p className="font-sans text-center text-sm text-gba-text mt-8 opacity-75">
              Select a counselor to begin your journey
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
