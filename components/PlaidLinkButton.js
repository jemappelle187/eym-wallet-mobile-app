import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { API_BASE } from '../app/config/api';
import { Typography } from '../constants/Typography';

const PlaidLinkButton = ({ onSuccess, onExit, style, children }) => {
  const [linkToken, setLinkToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const getLinkToken = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/v1/plaid/link-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'demo_user' })
      });
      
      const data = await response.json();
      if (data.ok) {
        setLinkToken(data.data.link_token);
        // For now, we'll simulate the Plaid Link flow
        // In a real implementation, you would use the PlaidLink component here
        simulatePlaidLink(data.data.link_token);
      } else {
        Alert.alert('Error', 'Failed to get Plaid link token');
      }
    } catch (error) {
      console.error('Error getting link token:', error);
      Alert.alert('Error', 'Failed to connect to Plaid');
    } finally {
      setIsLoading(false);
    }
  };

  const simulatePlaidLink = (token) => {
    // Simulate Plaid Link success with sandbox credentials
    Alert.alert(
      'Plaid Link Simulation',
      'In a real app, this would open Plaid Link. For demo, we\'ll simulate success with sandbox credentials.',
      [
        {
          text: 'Cancel',
          onPress: () => onExit && onExit(),
          style: 'cancel'
        },
        {
          text: 'Simulate Success',
          onPress: () => {
            // Simulate successful bank linking
            const mockResult = {
              public_token: 'public-sandbox-mock-token',
              accounts: [
                {
                  account_id: 'account_1',
                  name: 'Chase Checking',
                  mask: '1234',
                  type: 'depository',
                  subtype: 'checking',
                  balances: {
                    available: 5000,
                    current: 5000
                  }
                }
              ],
              institution: {
                name: 'Chase',
                institution_id: 'ins_3'
              }
            };
            onSuccess && onSuccess(mockResult);
          }
        }
      ]
    );
  };

  const handlePress = () => {
    if (linkToken) {
      simulatePlaidLink(linkToken);
    } else {
      getLinkToken();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handlePress}
      disabled={isLoading}
    >
      <View style={styles.content}>
        <Text style={styles.text}>
          {isLoading ? 'Connecting...' : children || 'Link Bank Account'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#1e40af',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: Typography.fontFamily,
    fontWeight: '600',
  },
});

export default PlaidLinkButton;

