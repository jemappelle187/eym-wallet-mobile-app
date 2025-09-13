// Plaid utilities - extracted from PaymentAPIs for reuse
import { paymentManager } from './PaymentAPIs';

/**
 * Initialize Plaid and get link token
 */
export async function getPlaidLinkToken() {
  await paymentManager.initialize();
  // The paymentManager handles the link token internally
  return true; // Return success indicator
}

/**
 * Open Plaid Link flow and return normalized result
 */
export async function openPlaidLinkWithToken() {
  try {
    const res = await paymentManager.openPlaidLinkFlow();
    
    if (res?.success) {
      // Normalize the response to match our expected format
      return {
        success: true,
        accountId: res.accountId || res.bankId,
        bankId: res.bankId || res.accountId,
        institution: res.institution || res.accountName,
        accountName: res.accountName || res.institution,
        lastFour: res.lastFour || res.mask || '0000',
        mask: res.mask || res.lastFour || '0000',
        currency: res.currency || 'EUR',
        logoUrl: res.logoUrl || null,
        // Keep original response for compatibility
        ...res
      };
    } else {
      return {
        success: false,
        error: res?.error || 'Plaid linking canceled'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error?.message || 'Plaid linking failed'
    };
  }
}

