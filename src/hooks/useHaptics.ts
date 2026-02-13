export function useHaptics() {
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  const light = () => {
    if (isSupported) {
      navigator.vibrate(10);
    }
  };

  const medium = () => {
    if (isSupported) {
      navigator.vibrate(25);
    }
  };

  const heavy = () => {
    if (isSupported) {
      navigator.vibrate(50);
    }
  };

  const success = () => {
    if (isSupported) {
      navigator.vibrate([10, 50, 10]);
    }
  };

  return { light, medium, heavy, success, isSupported };
}
