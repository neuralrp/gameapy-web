import { useApp } from '../../contexts/AppContext';

interface HealthStatusIconProps {
  onClick: () => void;
  className?: string;
}

export function HealthStatusIcon({ onClick, className = '' }: HealthStatusIconProps) {
  const { healthStatus, isCheckingHealth, consecutiveHealthFailures } = useApp();

  const getStatusColor = () => {
    if (isCheckingHealth) return '#C9A86C';
    if (!healthStatus) return '#C4BCB0';

    switch (healthStatus.status) {
      case 'healthy':
        return '#7A8B6E';
      case 'degraded':
        return '#C9A86C';
      case 'down':
        return '#A65D57';
      default:
        return '#C4BCB0';
    }
  };

  const getBadgeContent = () => {
    if (consecutiveHealthFailures > 0 && consecutiveHealthFailures < 10) {
      return consecutiveHealthFailures;
    }
    if (consecutiveHealthFailures >= 10) {
      return '9+';
    }
    return null;
  };

  const badge = getBadgeContent();

  return (
    <button
      onClick={onClick}
      className={`
        icon-button min-h-[44px] min-w-[44px] p-2
        bg-gba-ui border-2 border-gba-border rounded-lg
        flex items-center justify-center relative
        transition-all duration-200
        ${isCheckingHealth ? 'pulse' : ''}
        ${className}
      `}
      aria-label={`Check server health${consecutiveHealthFailures > 0 ? ` (${consecutiveHealthFailures} failed attempts)` : ''}`}
    >
      <div
        className="w-5 h-5 rounded-full border-2 border-gba-border"
        style={{ backgroundColor: getStatusColor() }}
      />
      {badge && (
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-gba-ui">
          {badge}
        </div>
      )}
    </button>
  );
}
