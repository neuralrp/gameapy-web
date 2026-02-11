import { X, Activity, Database, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { LoadingSpinner } from './LoadingSpinner';

export function HealthStatusModal() {
  const { healthStatus, lastHealthCheck, healthError, isCheckingHealth, showHealthModal, setShowHealthModal, checkHealthNow, consecutiveHealthFailures } = useApp();

  const calculateNextRetryDelay = () => {
    if (consecutiveHealthFailures === 0) {
      return 45;
    }
    const delay = Math.min(5 * Math.pow(2, consecutiveHealthFailures - 1), 45);
    return Math.max(delay, 5);
  };

  if (!showHealthModal) return null;

  const getStatusIcon = () => {
    if (!healthStatus) return <AlertCircle className="w-8 h-8 text-gray-400" />;
    switch (healthStatus.status) {
      case 'healthy':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="w-8 h-8 text-yellow-500" />;
      case 'down':
        return <XCircle className="w-8 h-8 text-red-500" />;
    }
  };

  const getStatusText = () => {
    if (!healthStatus) return 'Unknown';
    switch (healthStatus.status) {
      case 'healthy':
        return 'All systems operational';
      case 'degraded':
        return 'Degraded performance';
      case 'down':
        return 'System down';
    }
  };

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString();
    } catch {
      return 'Invalid timestamp';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 fade-in">
      <div className="bg-gba-ui border-4 border-gba-border rounded-lg max-w-md w-full p-6 shadow-xl">
        <button
          onClick={() => setShowHealthModal(false)}
          className="absolute top-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close"
        >
          <X className="w-6 h-6 text-gba-text" />
        </button>

        <div className="flex items-center gap-4 mb-6">
          {getStatusIcon()}
          <div>
            <h2 className="font-retro text-xl text-gba-text">System Health</h2>
            <p className="font-sans text-gba-text">{getStatusText()}</p>
          </div>
        </div>

        {isCheckingHealth && (
          <div className="mb-4">
            <LoadingSpinner message="Checking system status..." />
          </div>
        )}

        {healthError && (
          <div className="mb-4 p-3 bg-red-100 border-2 border-red-400 rounded-lg">
            <p className="font-sans text-red-800 text-sm font-semibold">
              Connection lost ({consecutiveHealthFailures} {consecutiveHealthFailures === 1 ? 'attempt' : 'attempts'})
            </p>
            <p className="font-sans text-red-800 text-xs mt-1">
              Retrying in {calculateNextRetryDelay()} seconds...
            </p>
          </div>
        )}

        {healthStatus && (
          <div className="space-y-4 mb-6">
            <div className="p-4 bg-white border-2 border-gba-border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-5 h-5 text-gba-text" />
                <h3 className="font-sans font-semibold text-gba-text">Backend Server</h3>
              </div>
              <div className="flex justify-between items-center">
                <span className={`font-sans text-sm ${healthStatus.checks.backend.status === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {healthStatus.checks.backend.status === 'up' ? 'Online' : 'Offline'}
                </span>
                {healthStatus.checks.backend.latency_ms !== undefined && (
                  <span className="font-sans text-sm text-gba-text">
                    {healthStatus.checks.backend.latency_ms}ms
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 bg-white border-2 border-gba-border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Database className="w-5 h-5 text-gba-text" />
                <h3 className="font-sans font-semibold text-gba-text">Database</h3>
              </div>
              <div className="flex justify-between items-center">
                <span className={`font-sans text-sm ${healthStatus.checks.database.status === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {healthStatus.checks.database.status === 'up' ? 'Connected' : 'Disconnected'}
                </span>
                {healthStatus.checks.database.latency_ms !== undefined && (
                  <span className="font-sans text-sm text-gba-text">
                    {healthStatus.checks.database.latency_ms}ms
                  </span>
                )}
              </div>
              {healthStatus.checks.database.error && (
                <p className="font-sans text-xs text-red-600 mt-2">{healthStatus.checks.database.error}</p>
              )}
            </div>

            <div className="p-3 bg-gba-bg border-2 border-gba-border rounded-lg">
              <p className="font-sans text-xs text-gba-text">
                Last checked: {formatTimestamp(lastHealthCheck)}
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={checkHealthNow}
            disabled={isCheckingHealth}
            className="flex-1 min-h-[44px] px-4 py-2 bg-gba-grass border-2 border-gba-border text-gba-text font-sans rounded-lg hover:bg-opacity-80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Check Now
          </button>
          <button
            onClick={() => setShowHealthModal(false)}
            className="flex-1 min-h-[44px] px-4 py-2 bg-gba-ui border-2 border-gba-border text-gba-text font-sans rounded-lg hover:bg-opacity-80 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
