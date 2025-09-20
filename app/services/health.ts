export type ProxyHealth = {
  ok: boolean;
  proxy: string;
  circleBase: string;
  hadApiKey: boolean;
  circleReachable: boolean;
  code: number | null;
  details: any;
};

const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE?.replace(/\/+$/, '') ||
  'https://circle-proxy.vercel.app/api/circle';

export async function checkCircleHealth(timeoutMs = 6000): Promise<ProxyHealth> {
  const url = `${API_BASE}/_health`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resp = await fetch(url, { method: 'GET', signal: controller.signal });
    const text = await resp.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    // Normalize shape if proxy somehow returned HTML
    const normalized: ProxyHealth = {
      ok: Boolean(data?.ok),
      proxy: data?.proxy ?? 'unknown',
      circleBase: data?.circleBase ?? 'unknown',
      hadApiKey: Boolean(data?.hadApiKey),
      circleReachable: Boolean(data?.circleReachable),
      code: typeof data?.code === 'number' ? data.code : resp.status,
      details: data?.details ?? data,
    };
    return normalized;
  } catch (e: any) {
    return {
      ok: false,
      proxy: 'fetch-error',
      circleBase: 'unknown',
      hadApiKey: false,
      circleReachable: false,
      code: -1,
      details: String(e?.message || e),
    };
  } finally {
    clearTimeout(t);
  }
}




