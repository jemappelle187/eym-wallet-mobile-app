import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../constants/Typography';

const BankSelector = ({ 
  selectedBank, 
  onSelectBank, 
  placeholder = "Select bank account",
  loading = false,
  style 
}) => {
  const hasBank = selectedBank && selectedBank.name;

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onSelectBank}
      activeOpacity={0.7}
      disabled={loading}
    >
      <View style={styles.leftSection}>
        <View style={styles.bankIcon}>
          <Ionicons 
            name="business" 
            size={20} 
            color={hasBank ? "#1e40af" : "rgba(255,255,255,0.6)"} 
          />
        </View>
        <View style={styles.bankInfo}>
          <Text style={styles.bankLabel}>Bank Account</Text>
          <Text style={[
            styles.bankDetails,
            !hasBank && styles.bankDetailsPlaceholder
          ]}>
            {loading 
              ? 'Connecting to bank...'
              : hasBank 
                ? `${selectedBank.name} ••••${selectedBank.mask} · ${selectedBank.currency}`
                : placeholder
            }
          </Text>
        </View>
      </View>
      <View style={styles.rightSection}>
        <Ionicons 
          name="chevron-down" 
          size={20} 
          color="rgba(255,255,255,0.6)" 
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bankInfo: {
    flex: 1,
  },
  bankLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
    marginBottom: 2,
  },
  bankDetails: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: Typography.fontFamily,
  },
  bankDetailsPlaceholder: {
    color: 'rgba(255,255,255,0.6)',
  },
  rightSection: {
    marginLeft: 12,
  },
});

export default BankSelector;
