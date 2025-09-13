import { Platform } from 'react-native';
import Constants from 'expo-constants';
// import { validateCircleKey, debugCircleConfig } from '../../utils/circleDebug';

export const resolveApiBase = () => {
  // Force real Circle API - no mock server fallback
  const useMock = Constants.expoConfig?.extra?.EXPO_PUBLIC_USE_MOCK_API === 'true';
  
  if (useMock) {
    // Only use mock for development if explicitly enabled
    return Constants.expoConfig?.extra?.EXPO_PUBLIC_MOCK_API_BASE || 'http://127.0.0.1:4000';
  }
  
  // Always use real Circle API
  return Constants.expoConfig?.extra?.EXPO_PUBLIC_CIRCLE_API_BASE || 'https://api-sandbox.circle.com/v1';
};

export const API_BASE = resolveApiBase();

// Demo mode flag: when true, avoid calling non-existent backend endpoints
export const DEMO_MODE = false;

// Circle API credentials from environment
export const CIRCLE_API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_CIRCLE_API_KEY || '';
export const WEBHOOK_SECRET = Constants.expoConfig?.extra?.EXPO_PUBLIC_WEBHOOK_SECRET || '';

// Validate Circle API key on startup - temporarily disabled
// if (CIRCLE_API_KEY) {
//   try {
//     validateCircleKey(CIRCLE_API_KEY);
//     debugCircleConfig(API_BASE, CIRCLE_API_KEY);
//   } catch (error) {
//     console.error('[Circle] ❌ API key validation failed:', error.message);
//   }
// } else {
//   console.error('[Circle] ❌ Missing EXPO_PUBLIC_CIRCLE_API_KEY');
// }

// Circle API client function with better error handling
export async function circleRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${CIRCLE_API_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();
    const asJson = contentType.includes('application/json') 
      ? (() => { 
          try { 
            return JSON.parse(text); 
          } catch { 
            return null; 
          } 
        })()
      : null;

    if (!response.ok) {
      const details = asJson?.message || text.slice(0, 200);
      throw new Error(`Circle ${response.status}: ${details}`);
    }

    if (!asJson) {
      throw new Error(`Circle returned non-JSON: ${text.slice(0, 120)}`);
    }
    
    return asJson;
  } catch (error) {
    // Better error messages for debugging
    const hint = url.includes('127.0.0.1') || url.includes('localhost') ? 
      'Is the mock server running? (Try `npm run mock`)' :
      'Circle API unreachable. Check API_BASE, API_KEY, and network.';
    throw new Error(`${error?.message || error} — ${hint}`);
  }
}

// Lightweight public FX quote fallback using Frankfurter API
// API: https://www.frankfurter.app/docs/
export async function getFxQuote(params: {
  base: string;
  target: string;
  amount: number;
}): Promise<{ success: boolean; rate?: number; targetAmount?: number; provider: string; error?: string }>
{
  try {
    const { base, target, amount } = params;
    if (!base || !target || !Number.isFinite(amount)) {
      return { success: false, provider: 'frankfurter', error: 'Invalid parameters' };
    }
    const url = `https://api.frankfurter.app/latest?from=${encodeURIComponent(base)}&to=${encodeURIComponent(target)}`;
    const res = await fetch(url);
    if (!res.ok) {
      return { success: false, provider: 'frankfurter', error: `HTTP ${res.status}` };
    }
    const data = await res.json();
    const rate = data?.rates?.[target];
    if (!rate) {
      return { success: false, provider: 'frankfurter', error: 'Rate not found' };
    }
    return {
      success: true,
      rate,
      targetAmount: Number((amount * rate).toFixed(2)),
      provider: 'frankfurter'
    };
  } catch (err: any) {
    return { success: false, provider: 'frankfurter', error: err?.message || 'Unknown error' };
  }
}