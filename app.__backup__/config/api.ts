export const resolveApiBase = () => {
  // Use LAN IP for physical devices and simulators
  // This ensures the mobile app can reach the backend from any device on the same network
  return 'http://192.168.178.174:4000';
  
  // Fallback to dynamic resolution if needed (commented out for now)
  // try {
  //   const Constants = require('expo-constants').default;
  //   const host =
  //     (Constants?.expoConfig?.hostUri ||
  //       Constants?.manifest2?.extra?.expoGo?.debuggerHost ||
  //       Constants?.manifest?.debuggerHost ||
  //       '')
  //       .split(':')[0];
  //   if (host) return `http://${host}:4000`;
  // } catch (_) {}

  // const rn = require('react-native');
  // if (rn.Platform.OS === 'android') return 'http://10.0.2.2:4000';
  // if (rn.Platform.OS === 'ios') return 'http://127.0.0.1:4000';
  // return 'http://127.0.0.1:4000';
};

export const API_BASE = resolveApiBase();

// Demo mode flag: when true, avoid calling non-existent backend endpoints
export const DEMO_MODE = false;

// Provide a default secret to satisfy imports in JS files
undefined

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