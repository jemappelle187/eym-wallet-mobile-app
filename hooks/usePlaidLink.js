// usePlaidLink hook - wraps Plaid functionality for reuse
import { useCallback, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { getPlaidLinkToken, openPlaidLinkWithToken } from '../utils/plaid';

export default function usePlaidLink() {
  const [linking, setLinking] = useState(false);

  const open = useCallback(async () => {
    try {
      setLinking(true);
      await getPlaidLinkToken();
      const res = await openPlaidLinkWithToken();
      
      if (res?.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Normalize bank object we pass to screens:
        return {
          ok: true,
          bank: {
            id: res.accountId || res.bankId,
            name: res.institution || res.accountName || 'Bank Account',
            mask: res.lastFour || res.mask || '0000',
            currency: res.currency || 'EUR',
            logoUrl: res.logoUrl || null,
          }
        };
      }
      return { ok: false, error: res?.error || 'Plaid linking canceled' };
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return { ok: false, error: e?.message || 'Plaid linking failed' };
    } finally {
      setLinking(false);
    }
  }, []);

  return { linking, open };
}







