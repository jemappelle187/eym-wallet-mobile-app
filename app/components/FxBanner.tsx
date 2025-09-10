import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { getFxQuote, type FxQuote } from "../config/api";

type Props = {
  base: string;
  target: string;
  amount?: number;
  minTtlMs?: number;
};

export default function FxBanner({ base, target, amount = 100, minTtlMs = 60_000 }: Props) {
  const [fx, setFx] = useState<FxQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState(0);

  const canRefresh = useMemo(() => Date.now() - lastFetchedAt >= minTtlMs, [lastFetchedAt, minTtlMs]);

  const refresh = useCallback(async () => {
    if (!canRefresh) return;
    setLoading(true); setErr(null);
    try {
      const q = await getFxQuote(base, target, amount);
      setFx(q);
      setLastFetchedAt(Date.now());
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [base, target, amount, canRefresh]);

  const subtitle = useMemo(() => {
    if (loading) return "Updating...";
    if (err) return `Error: ${err}`;
    if (!fx) return "Tap refresh to load live rate";
    const ts = new Date(fx.ts);
    return `Updated ${ts.toLocaleTimeString()} • ${fx.source}`;
  }, [fx, loading, err]);

  const rateText = useMemo(() => {
    if (!fx) return `${base.toUpperCase()}→${target.toUpperCase()}`;
    return `${base.toUpperCase()}→${target.toUpperCase()}: ${fx.rate.toFixed(4)} (eff ${fx.effectiveRate.toFixed(4)})`;
  }, [fx, base, target]);

  return (
    <View style={styles.wrap}>
      <View style={styles.texts}>
        <Text style={styles.title}>{rateText}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Pressable
        onPress={refresh}
        disabled={!canRefresh || loading}
        style={({ pressed }) => [
          styles.btn,
          (!canRefresh || loading) && styles.btnDisabled,
          pressed && styles.btnPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Refresh FX rate"
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.btnText}>{canRefresh ? "Refresh" : "Wait"}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1f2937",
    gap: 12,
  },
  texts: { flex: 1 },
  title: { color: "#e5e7eb", fontWeight: "600" },
  subtitle: { color: "#9ca3af", fontSize: 12, marginTop: 2 },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#2563eb",
  },
  btnDisabled: { backgroundColor: "#475569" },
  btnPressed: { opacity: 0.85 },
  btnText: { color: "#fff", fontWeight: "600" },
});

