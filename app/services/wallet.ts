import { API_BASE } from '../config/api';

function joinUrl(base: string, path: string) {
  const b = (base || '').replace(/\/+$/, '');      // trim trailing /
  const p = (path || '').replace(/^\/+/, '');      // trim leading /
  return `${b}/${p}`;
}

export async function circleGet(path: string) {
  const url = joinUrl(API_BASE, path);             // e.g. .../api/circle + wallets
  console.log('🔎 circleGet URL =>', url);
  const res = await fetch(url, { method: 'GET' });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Circle GET ${path} failed: ${res.status} ${text.slice(0,120)}`);
  }
  try { return JSON.parse(text); } catch { return text; }
}

// cheap auth probe that never mutates state
export async function testApiConnection() {
  // use one of these; pick ONE and keep it consistent:
  // return circleGet('/config/entity/publicKey');
  return circleGet('/wallets');
}