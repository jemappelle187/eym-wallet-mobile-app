import { apiGet, apiPost, getFxQuote, type FxQuote } from "../config/api";

export function deposit(userId: string, currency: "USD" | "EUR" | "GHS", amount: number, reference?: string) {
  return apiPost("/v1/deposits/webhook", { userId, currency, amount, reference });
}

export function getBalance(userId: string) {
  return apiGet(`/v1/users/${encodeURIComponent(userId)}/balance`);
}

export function ping() {
  return apiGet("/health");
}

export function quote(base: string, target: string, amount: number): Promise<FxQuote> {
  return getFxQuote(base, target, amount);
}



