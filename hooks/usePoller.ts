import { useEffect, useState } from 'react';

export function useStatusPoller(fetchStatus: () => Promise<'PENDING'|'SUCCESSFUL'|'FAILED'>) {
  const [status, setStatus] = useState<'PENDING'|'SUCCESSFUL'|'FAILED'>('PENDING');
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let mounted = true;
    let attempt = 0;
    const start = Date.now();
    let intervalId: NodeJS.Timeout | null = null;

    const tick = async () => {
      if (!mounted) return;
      setElapsed(Math.floor((Date.now() - start) / 1000));
      try {
        const st = await fetchStatus();
        if (!mounted) return;
        if (st === 'SUCCESSFUL' || st === 'FAILED') {
          setStatus(st);
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
          return; // Stop polling when terminal status is reached
        }
        attempt += 1;
        const backoff = Math.min(2500 + attempt * 250, 4000);
        intervalId = setTimeout(tick, backoff);
      } catch {
        // brief backoff on transient errors
        intervalId = setTimeout(tick, 2000);
      }
    };

    tick();
    return () => { 
      mounted = false; 
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []); // Remove fetchStatus dependency to prevent re-initialization

  const showRescue = elapsed >= 45 && status === 'PENDING';
  return { status, elapsed, showRescue };
}

