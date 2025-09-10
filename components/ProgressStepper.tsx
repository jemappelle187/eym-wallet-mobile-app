import React from 'react';
import { View, Text } from 'react-native';

export function ProgressStepper({ step }: { step: 'initiated' | 'pending' | 'success' }) {
  const idx = ['initiated', 'pending', 'success'].indexOf(step);
  const Item = ({ label, i }: { label: string; i: number }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', opacity: i <= idx ? 1 : 0.5, marginRight: 12 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: i < idx ? '#10b981' : i === idx ? '#3b82f6' : '#334155', marginRight: 8 }} />
      <Text style={{ color: 'white' }}>{label}</Text>
    </View>
  );
  return (
    <View style={{ backgroundColor: '#0b1220', borderColor: '#1f2937', borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 12, flexDirection: 'row' }}>
      <Item label="Initiated" i={0} />
      <Item label="Waiting for approval" i={1} />
      <Item label="Deposited" i={2} />
    </View>
  );
}

