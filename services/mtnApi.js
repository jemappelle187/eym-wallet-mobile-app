// MTN Mobile Money API Service for Frontend
import { API_BASE } from '../app/config/api';

class MTNApiService {
  constructor() {
    this.baseUrl = `${API_BASE}/v1/momo`;
  }

  /**
   * Get MTN service status
   */
  async getServiceStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/status`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get service status');
      }
      
      return data;
    } catch (error) {
      console.error('[MTN API] Service status error:', error);
      throw error;
    }
  }

  /**
   * Send money via MTN Mobile Money
   */
  async sendMoney({ amount, currency = 'GHS', phoneNumber, payerMessage, payeeNote }) {
    try {
      const response = await fetch(`${this.baseUrl}/request-to-pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          payerMsisdn: phoneNumber,
          payerMessage,
          payeeNote
        })
      });

      const ct = response.headers.get('content-type') || '';
      const payload = ct.includes('application/json') ? await response.json() : await response.text();
      
      if (!response.ok) {
        const msg = typeof payload === 'string' ? payload : (payload.error || payload.message || 'Failed to send money');
        throw new Error(msg);
      }
      
      return payload;
    } catch (error) {
      console.error('[MTN API] Send money error:', error);
      throw error;
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(transactionId) {
    try {
      const response = await fetch(`${this.baseUrl}/status/${transactionId}`, {
        headers: { 'Accept': 'application/json' }
      });
      const ct = response.headers.get('content-type') || '';
      const payload = ct.includes('application/json') ? await response.json() : await response.text();
      
      if (!response.ok) {
        const msg = typeof payload === 'string' ? payload : (payload.error || payload.message || 'Failed to get transaction status');
        throw new Error(msg);
      }
      
      return payload;
    } catch (error) {
      console.error('[MTN API] Transaction status error:', error);
      throw error;
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance() {
    try {
      const response = await fetch(`${this.baseUrl}/balance`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get account balance');
      }
      
      return data;
    } catch (error) {
      console.error('[MTN API] Balance error:', error);
      throw error;
    }
  }

  /**
   * Validate mobile money account
   */
  async validateAccount(phoneNumber) {
    try {
      const response = await fetch(`${this.baseUrl}/validate-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to validate account');
      }
      
      return data;
    } catch (error) {
      console.error('[MTN API] Account validation error:', error);
      throw error;
    }
  }

  /**
   * Format phone number for Ghana
   */
  formatGhanaPhoneNumber(phoneNumber) {
    // Remove all non-digits
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // If it starts with 0, replace with 233
    if (cleaned.startsWith('0')) {
      return '233' + cleaned.substring(1);
    }
    
    // If it starts with 233, return as is
    if (cleaned.startsWith('233')) {
      return cleaned;
    }
    
    // If it's 9 digits, add 233 prefix
    if (cleaned.length === 9) {
      return '233' + cleaned;
    }
    
    // Return as is if already formatted
    return cleaned;
  }

  /**
   * Validate Ghana phone number format
   */
  isValidGhanaPhoneNumber(phoneNumber) {
    const formatted = this.formatGhanaPhoneNumber(phoneNumber);
    return formatted.startsWith('233') && formatted.length === 12;
  }

  /**
   * Get formatted phone number for display
   */
  formatPhoneForDisplay(phoneNumber) {
    const formatted = this.formatGhanaPhoneNumber(phoneNumber);
    if (formatted.startsWith('233') && formatted.length === 12) {
      return `+${formatted.substring(0, 3)} ${formatted.substring(3, 6)} ${formatted.substring(6, 9)} ${formatted.substring(9)}`;
    }
    return phoneNumber;
  }
}

// Export singleton instance
export const mtnApiService = new MTNApiService();
export default mtnApiService;
