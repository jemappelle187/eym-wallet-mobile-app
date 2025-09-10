import React, { useState } from "react";
import { View, ScrollView, Alert } from "react-native";
import { Button, Text, TextInput, Divider } from "react-native-paper";
import { deposit, getBalance, ping, quote } from "../services/wallet";
import { API_BASE } from "../config/api";
import FxBanner from "../components/FxBanner";

export default function AutoConvertTestScreen() {
  const [userId, setUserId] = useState("expo_user");
  const [amount, setAmount] = useState("100");
  const [currency, setCurrency] = useState<"USD"|"EUR"|"GHS">("USD");
  const [balances, setBalances] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [fx, setFx] = useState<any>(null);

  async function doPing() {
    try {
      const r = await ping();
      Alert.alert("Health OK", JSON.stringify(r));
    } catch (e: any) {
      Alert.alert("Health error", e?.message ?? String(e));
    }
  }

  async function doDeposit() {
    setLoading(true);
    try {
      const amt = Number(amount);
      if (Number.isNaN(amt) || amt <= 0) throw new Error("Enter a valid amount");
      await deposit(userId, currency, amt, `app-${Date.now()}`);
      const b = await getBalance(userId);
      setBalances(b?.data?.balances ?? {});
      Alert.alert("Deposit processed", `${currency} → stablecoin complete`);
    } catch (e: any) {
      Alert.alert("Deposit error", e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  async function doQuote() {
    try {
      const amt = Number(amount);
      if (Number.isNaN(amt) || amt <= 0) throw new Error("Enter a valid amount");
      const target = currency === "EUR" ? "EUR" : "USD";
      const q = await quote(currency, target, amt);
      setFx(q);
      Alert.alert("Quote", `${q.base}→${q.target} rate=${q.rate.toFixed(6)} eff=${q.effectiveRate.toFixed(6)} src=${q.source}`);
    } catch (e: any) {
      Alert.alert("Quote error", e?.message ?? String(e));
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text variant="titleLarge">Auto-Convert Test</Text>
      <Text>Backend: {API_BASE}</Text>
      <FxBanner base={currency} target={currency === "EUR" ? "EUR" : "USD"} amount={Number(amount) || 100} />

      <TextInput label="User ID" value={userId} onChangeText={setUserId} autoCapitalize="none" />
      <TextInput label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />

      <View style={{ flexDirection: "row", gap: 8 }}>
        <Button mode={currency==="USD"?"contained":"outlined"} onPress={()=>setCurrency("USD")}>USD→USDC</Button>
        <Button mode={currency==="EUR"?"contained":"outlined"} onPress={()=>setCurrency("EUR")}>EUR→EURC</Button>
        <Button mode={currency==="GHS"?"contained":"outlined"} onPress={()=>setCurrency("GHS")}>GHS→USDC</Button>
      </View>

      <Button mode="contained" loading={loading} onPress={doDeposit}>Deposit & Convert</Button>
      <Button mode="outlined" onPress={doQuote}>Get Quote</Button>
      <Button mode="outlined" onPress={doPing}>Ping /health</Button>

      <Divider />
      <Text variant="titleMedium">Balances</Text>
      <Text selectable>{JSON.stringify(balances, null, 2)}</Text>
      {fx && (
        <>
          <Divider />
          <Text variant="titleMedium">Last Quote</Text>
          <Text selectable>{JSON.stringify(fx, null, 2)}</Text>
        </>
      )}
    </ScrollView>
  );
}


