import Constants from 'expo-constants';

export const API_BASE = process.env.EXPO_PUBLIC_API_BASE!;
export const CIRCLE_API_KEY = ''; // never expose key client-side

export const resolveMobileMoneyApiBase = () => {
  // Mobile money API configuration - use real sandbox APIs
  const isDevelopment = __DEV__;
  const isProduction = !isDevelopment;
  
  // Check for explicit configuration first
  if (Constants.expoConfig?.extra?.EXPO_PUBLIC_AUTO_CONVERT_API_BASE) {
    return Constants.expoConfig.extra.EXPO_PUBLIC_AUTO_CONVERT_API_BASE;
  }
  
  // Production: Use deployed auto-convert-api backend
  if (isProduction) {
    // For Vercel deployment, use your deployed auto-convert-api
    return 'https://your-auto-convert-api.vercel.app';
  }
  
  // Development: Use local auto-convert-api (which connects to real MTN sandbox)
  return 'http://127.0.0.1:4000';
};

export const MOBILE_MONEY_API_BASE = resolveMobileMoneyApiBase();

// Demo mode flag: when true, avoid calling non-existent backend endpoints
export const DEMO_MODE = false;

// Webhook secret from environment
export const WEBHOOK_SECRET = Constants.expoConfig?.extra?.EXPO_PUBLIC_WEBHOOK_SECRET || '';


// Aligned FX quote system matching transaction flow setup
// Uses same API hierarchy: Frankfurter → Open ER API → EUR Pivot → Static fallback
const FX_CACHE = new Map<string, { until: number; rate: number; source: string }>();
const FX_MARGIN_BPS = 40; // 40 basis points spread (0.40%)
const FX_CACHE_TTL_SEC = 60; // 60 second cache

// Conservative fallback rates (matching auto-convert-api)
function getFallbackRate(base: string, target: string): number {
  const b = base.toUpperCase(), t = target.toUpperCase();
  if (b === "EUR" && t === "USD") return 1.08;
  if (b === "USD" && t === "EUR") return 0.93;
  if (b === "USD" && t === "AED") return 3.67;
  if (b === "AED" && t === "USD") return 0.2725;
  if (b === "GHS" && t === "USD") return 0.08;       // ~12.5 GHS per USD
  if (b === "USD" && t === "GHS") return 12.5;
  if (b === "EUR" && t === "GHS") return 13.5;        // rough cross
  if (b === "GHS" && t === "EUR") return 0.074;      // rough cross
  if (b === "NGN" && t === "USD") return 0.00067;    // ~1500 NGN per USD
  if (b === "USD" && t === "NGN") return 1500;
  if (b === "NGN" && t === "EUR") return 0.00061;
  if (b === "EUR" && t === "NGN") return 1630;
  return 1.0;
}

export async function getFxQuote(params: {
  base: string;
  target: string;
  amount: number;
}): Promise<{ success: boolean; rate?: number; targetAmount?: number; provider: string; error?: string; effectiveRate?: number; marginBps?: number }>
{
  try {
    const { base, target, amount } = params;
    if (!base || !target || !Number.isFinite(amount)) {
      return { success: false, provider: 'fx-system', error: 'Invalid parameters' };
    }
    
    const baseUpper = base.toUpperCase();
    const targetUpper = target.toUpperCase();
    const cacheKey = `${baseUpper}_${targetUpper}`;
    const now = Date.now();
    
    // Check cache first
    const cached = FX_CACHE.get(cacheKey);
    if (cached && cached.until > now) {
      const effectiveRate = cached.rate * (1 - FX_MARGIN_BPS / 10000);
      return {
        success: true,
        rate: cached.rate,
        effectiveRate,
        targetAmount: Number((amount * effectiveRate).toFixed(2)),
        provider: cached.source,
        marginBps: FX_MARGIN_BPS
      };
    }
    
    let rate: number;
    let source: string = "live";
    
    // Helper function to use free sources (matching auto-convert-api logic)
    const getFromFreeSources = async () => {
      try {
        if (baseUpper === "EUR") {
          // Direct Frankfurter for EUR base
          const f = await (await fetch(`https://api.frankfurter.app/latest?from=EUR&to=${encodeURIComponent(targetUpper)}`)).json() as any;
          const fr = f?.rates?.[targetUpper];
          if (typeof fr === "number") {
            return { rate: fr, source: "frankfurter" };
          }
          throw new Error("Frankfurter missing rate");
        } else {
          // Try Open ER API direct
          const erDirectRes = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(baseUpper)}`);
          if (erDirectRes.ok) {
            const erDirect = await erDirectRes.json() as any;
            const directRate = erDirect?.rates?.[targetUpper];
            if (erDirect?.result === "success" && typeof directRate === "number") {
              return { rate: directRate, source: "open-er-api" };
            }
          }
          
          // EUR pivot fallback
          const erBase = await (await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(baseUpper)}`)).json() as any;
          const r1 = erBase?.rates?.EUR;
          const frEurToTarget = await (await fetch(`https://api.frankfurter.app/latest?from=EUR&to=${encodeURIComponent(targetUpper)}`)).json() as any;
          const r2 = frEurToTarget?.rates?.[targetUpper];
          if (erBase?.result === "success" && typeof r1 === "number" && typeof r2 === "number") {
            return { rate: r1 * r2, source: "eur-pivot" };
          }
          throw new Error("EUR pivot failed");
        }
      } catch {
        return { rate: getFallbackRate(baseUpper, targetUpper), source: "fallback" };
      }
    };
    
    const result = await getFromFreeSources();
    rate = result.rate;
    source = result.source;
    
    // Cache the result
    FX_CACHE.set(cacheKey, { rate, source, until: now + (FX_CACHE_TTL_SEC * 1000) });
    
    // Apply margin (matching transaction flow)
    const effectiveRate = rate * (1 - FX_MARGIN_BPS / 10000);
    const targetAmount = Number((amount * effectiveRate).toFixed(2));
    
    return {
      success: true,
      rate,
      effectiveRate,
      targetAmount,
      provider: source,
      marginBps: FX_MARGIN_BPS
    };
    
  } catch (err: any) {
    return { success: false, provider: 'fx-system', error: err?.message || 'Unknown error' };
  }
}