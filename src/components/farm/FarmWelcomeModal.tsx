interface FarmWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TIPS = [
  "Create cards for 10 Gold!",
  "Login once a day for 5 gold!",
  "Sell your produce at the store",
];

export function FarmWelcomeModal({ isOpen, onClose }: FarmWelcomeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="farm-welcome-overlay" onClick={onClose}>
      <div className="farm-welcome-modal" onClick={e => e.stopPropagation()}>
        <div className="farm-welcome-header">
          <h2>Welcome to Your Farm!</h2>
        </div>
        
        <div className="farm-welcome-tips">
          {TIPS.map((tip, index) => (
            <div key={index} className="farm-welcome-tip">
              <span className="farm-welcome-icon">
                {index === 0 && "🎴"}
                {index === 1 && "📅"}
                {index === 2 && "💰"}
              </span>
              <span className="farm-welcome-text">{tip}</span>
            </div>
          ))}
        </div>

        <div className="farm-welcome-instructions">
          <h3>How to Play</h3>
          <ul>
            <li>Tap grass to till it</li>
            <li>Select a seed and tap tilled soil to plant</li>
            <li>Tap growing crops to water them</li>
            <li>Tap mature crops to harvest and earn gold!</li>
          </ul>
        </div>

        <button className="farm-welcome-button" onClick={onClose}>
          Let's Farm!
        </button>
      </div>
    </div>
  );
}
