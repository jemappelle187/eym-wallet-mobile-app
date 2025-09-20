import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { checkCircleHealth, ProxyHealth } from '../app/services/health';

export default function CircleHealthBanner() {
  const [circleOk, setCircleOk] = useState<boolean | null>(null);
  const [circleMsg, setCircleMsg] = useState<string>('');
  const [healthData, setHealthData] = useState<ProxyHealth | null>(null);

  useEffect(() => {
    (async () => {
      const res = await checkCircleHealth();
      setHealthData(res);
      setCircleOk(res.ok);
      
      if (!res.ok) {
        // short, human-readable summary
        const summary = res.code === 401
          ? 'Circle reachable but credentials rejected (401).'
          : res.circleReachable
            ? `Circle reachable (code ${res.code}), not fully OK.`
            : 'Circle not reachable via proxy.';
        setCircleMsg(summary);
        console.log('🔴 Circle health:', res);
      } else {
        setCircleMsg('Circle OK');
        console.log('🟢 Circle health:', res);
      }
    })();
  }, []);

  // Only show banner when there's an issue
  if (circleOk === false) {
    return (
      <View style={styles.banner}>
        <Text style={styles.bannerText}>Circle check: {circleMsg}</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#fde047',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  bannerText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
  },
});




