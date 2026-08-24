import { useState, useEffect } from 'react';
import { formatDuration } from '../domain/time-formatter';

export function useTimer(departureTime?: number) {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => {
    if (!departureTime) return 0;
    return Math.max(0, Math.floor((Date.now() - departureTime) / 1000));
  });

  useEffect(() => {
    if (!departureTime) {
      setElapsedSeconds(0);
      return;
    }

    const update = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - departureTime) / 1000)));
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [departureTime]);

  return {
    elapsedSeconds,
    formatted: formatDuration(elapsedSeconds),
  };
}
