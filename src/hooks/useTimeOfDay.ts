import { useState, useEffect } from 'react';

export type TimeOfDay = 'night' | 'dawn' | 'day' | 'dusk';

export function useTimeOfDay(): TimeOfDay {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');

  useEffect(() => {
    const updateTime = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 6) {
        setTimeOfDay('dawn');
      } else if (hour >= 6 && hour < 18) {
        setTimeOfDay('day');
      } else if (hour >= 18 && hour < 20) {
        setTimeOfDay('dusk');
      } else {
        setTimeOfDay('night');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return timeOfDay;
}
