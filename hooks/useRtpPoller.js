import { useState, useEffect } from 'react';

const BASE_URL = 'https://sandbox.momodeveloper.mtn.com';

export function useRtpPoller(refId, token, subKey) {
  const [status, setStatus] = useState('PENDING');
  const [elapsed, setElapsed] = useState(0);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!refId || !token || !subKey) return;

    let mounted = true;
    let attempt = 0;
    const start = Date.now();

    const buildRtpHeaders = (token, subKey) => ({
      'Authorization': `Bearer ${token}`,
      'X-Target-Environment': 'sandbox',
      'Ocp-Apim-Subscription-Key': subKey,
      'Content-Type': 'application/json'
    });

    const tick = async () => {
      if (!mounted) return;
      
      const currentElapsed = Math.floor((Date.now() - start) / 1000);
      setElapsed(currentElapsed);

      try {
        const res = await fetch(`${BASE_URL}/collection/v1_0/requesttopay/${refId}`, {
          headers: buildRtpHeaders(token, subKey)
        });
        
        if (!mounted) return;
        
        const json = await res.json();
        
        if (json.status === 'SUCCESSFUL') {
          setStatus('SUCCESSFUL');
          return;
        }
        
        if (json.status === 'FAILED') {
          setStatus('FAILED');
          return;
        }

        // Continue polling
        attempt += 1;
        setAttempts(attempt);
        
        const backoff = Math.min(600 * Math.pow(2, attempt), 3000) + Math.random() * 200;
        setTimeout(tick, backoff);
        
      } catch (error) {
        console.error('RTP polling error:', error);
        if (mounted) {
          attempt += 1;
          setAttempts(attempt);
          const backoff = Math.min(600 * Math.pow(2, attempt), 3000);
          setTimeout(tick, backoff);
        }
      }
    };

    tick();
    
    return () => {
      mounted = false;
    };
  }, [refId, token, subKey]);

  return {
    status,
    elapsed,
    attempts,
    showRescue: elapsed >= 45 && status === 'PENDING'
  };
}









