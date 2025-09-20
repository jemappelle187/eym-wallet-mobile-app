import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CurrencyPill({ 
  code = 'EUR', 
  flag = '🇪🇺', 
  onPress,
  style 
}) {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.8} 
      style={[styles.pill, style]}
    >
      <View style={styles.pillContent}>
        <Text style={styles.flag}>{flag}</Text>
        <Text style={styles.code}>{code}</Text>
        <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.6)" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flag: { 
    fontSize: 16 
  },
  code: { 
    color: '#fff', 
    fontSize: 14, 
    fontWeight: '600' 
  },
});







