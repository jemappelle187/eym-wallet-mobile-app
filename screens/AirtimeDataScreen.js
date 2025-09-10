import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import * as Haptics from 'expo-haptics';

const AirtimeDataScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const [selectedService, setSelectedService] = useState('airtime');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedBundle, setSelectedBundle] = useState(null);

  // Mock data for providers
  const providers = [
    { id: 'mtn', name: 'MTN', icon: '📱', color: '#FFC107' },
    { id: 'vodafone', name: 'Vodafone', icon: '📱', color: '#E60000' },
    { id: 'airteltigo', name: 'AirtelTigo', icon: '📱', color: '#FF6B35' },
  ];

  // Mock data for data bundles
  const dataBundles = [
    { id: '1gb', name: '1GB', price: 5, validity: '7 days', description: '1GB for 7 days' },
    { id: '2gb', name: '2GB', price: 10, validity: '14 days', description: '2GB for 14 days' },
    { id: '5gb', name: '5GB', price: 20, validity: '30 days', description: '5GB for 30 days' },
    { id: '10gb', name: '10GB', price: 35, validity: '30 days', description: '10GB for 30 days' },
  ];

  // Quick amount options for airtime
  const quickAmounts = [5, 10, 20, 50, 100];

  const handleServiceSelect = (service) => {
    Haptics.selectionAsync();
    setSelectedService(service);
    setSelectedBundle(null);
  };

  const handleProviderSelect = (provider) => {
    Haptics.selectionAsync();
    setSelectedProvider(provider);
  };

  const handleBundleSelect = (bundle) => {
    Haptics.selectionAsync();
    setSelectedBundle(bundle);
    setAmount(bundle.price.toString());
  };

  const handleQuickAmountSelect = (quickAmount) => {
    Haptics.selectionAsync();
    setAmount(quickAmount.toString());
  };

  const handlePurchase = () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!selectedProvider) {
      Alert.alert('Error', 'Please select a network provider');
      return;
    }

    if (selectedService === 'data' && !selectedBundle) {
      Alert.alert('Error', 'Please select a data bundle');
      return;
    }

    Alert.alert(
      'Confirm Purchase',
      `${selectedService === 'airtime' ? 'Airtime' : 'Data Bundle'} Purchase\n\n` +
      `Provider: ${selectedProvider.name}\n` +
      `Phone: ${phoneNumber}\n` +
      `Amount: GHS ${amount}\n` +
      `${selectedService === 'data' ? `Bundle: ${selectedBundle.name}\n` : ''}` +
      `Fee: GHS 0.50\n` +
      `Total: GHS ${(parseFloat(amount) + 0.50).toFixed(2)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Purchase', 
          onPress: () => {
            Alert.alert(
              'Success!',
              `${selectedService === 'airtime' ? 'Airtime' : 'Data bundle'} purchased successfully!\n\n` +
              `Transaction ID: ${Date.now()}\n` +
              `You will receive a confirmation SMS shortly.`,
              [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Buy Airtime & Data
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Service Type Selector */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Service Type</Text>
          <View style={styles.serviceSelector}>
            <TouchableOpacity
              style={[
                styles.serviceOption,
                selectedService === 'airtime' && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}
              onPress={() => handleServiceSelect('airtime')}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="call-outline" 
                size={24} 
                color={selectedService === 'airtime' ? colors.white : colors.textPrimary} 
              />
              <Text style={[
                styles.serviceOptionText,
                { color: selectedService === 'airtime' ? colors.white : colors.textPrimary }
              ]}>
                Airtime
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.serviceOption,
                selectedService === 'data' && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}
              onPress={() => handleServiceSelect('data')}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="wifi-outline" 
                size={24} 
                color={selectedService === 'data' ? colors.white : colors.textPrimary} 
              />
              <Text style={[
                styles.serviceOptionText,
                { color: selectedService === 'data' ? colors.white : colors.textPrimary }
              ]}>
                Data Bundle
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Phone Number Input */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Phone Number</Text>
          <TextInput
            style={[styles.phoneInput, { 
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.textPrimary 
            }]}
            placeholder="Enter phone number"
            placeholderTextColor={colors.textMuted}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>

        {/* Network Provider Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Select Network</Text>
          <View style={styles.providerGrid}>
            {providers.map((provider) => (
              <TouchableOpacity
                key={provider.id}
                style={[
                  styles.providerOption,
                  { 
                    backgroundColor: colors.background,
                    borderColor: selectedProvider?.id === provider.id ? colors.primary : colors.border 
                  }
                ]}
                onPress={() => handleProviderSelect(provider)}
                activeOpacity={0.7}
              >
                <Text style={styles.providerIcon}>{provider.icon}</Text>
                <Text style={[styles.providerName, { color: colors.textPrimary }]}>
                  {provider.name}
                </Text>
                {selectedProvider?.id === provider.id && (
                  <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]}>
                    <Ionicons name="checkmark" size={16} color={colors.white} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Amount/Bundle Selection */}
        {selectedService === 'airtime' ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Amount (GHS)</Text>
            <TextInput
              style={[styles.amountInput, { 
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.textPrimary 
              }]}
              placeholder="Enter amount"
              placeholderTextColor={colors.textMuted}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
            
            <Text style={[styles.quickAmountsLabel, { color: colors.textMuted }]}>Quick Amounts</Text>
            <View style={styles.quickAmountsGrid}>
              {quickAmounts.map((quickAmount) => (
                <TouchableOpacity
                  key={quickAmount}
                  style={[
                    styles.quickAmountButton,
                    { 
                      backgroundColor: colors.background,
                      borderColor: amount === quickAmount.toString() ? colors.primary : colors.border 
                    }
                  ]}
                  onPress={() => handleQuickAmountSelect(quickAmount)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.quickAmountText,
                    { color: amount === quickAmount.toString() ? colors.primary : colors.textPrimary }
                  ]}>
                    GHS {quickAmount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Select Data Bundle</Text>
            <View style={styles.bundleGrid}>
              {dataBundles.map((bundle) => (
                <TouchableOpacity
                  key={bundle.id}
                  style={[
                    styles.bundleOption,
                    { 
                      backgroundColor: colors.background,
                      borderColor: selectedBundle?.id === bundle.id ? colors.primary : colors.border 
                    }
                  ]}
                  onPress={() => handleBundleSelect(bundle)}
                  activeOpacity={0.7}
                >
                  <View style={styles.bundleHeader}>
                    <Text style={[styles.bundleName, { color: colors.textPrimary }]}>{bundle.name}</Text>
                    <Text style={[styles.bundlePrice, { color: colors.primary }]}>GHS {bundle.price}</Text>
                  </View>
                  <Text style={[styles.bundleDescription, { color: colors.textMuted }]}>
                    {bundle.description}
                  </Text>
                  <Text style={[styles.bundleValidity, { color: colors.textMuted }]}>
                    Valid for {bundle.validity}
                  </Text>
                  {selectedBundle?.id === bundle.id && (
                    <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]}>
                      <Ionicons name="checkmark" size={16} color={colors.white} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Purchase Button */}
        <TouchableOpacity
          style={[styles.purchaseButton, { backgroundColor: colors.primary }]}
          onPress={handlePurchase}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.primary + 'DD']}
            style={styles.purchaseButtonGradient}
          >
            <Text style={styles.purchaseButtonText}>
              Purchase {selectedService === 'airtime' ? 'Airtime' : 'Data Bundle'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
    marginBottom: 12,
  },
  serviceSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  serviceOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  serviceOptionText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    fontWeight: '500',
  },
  phoneInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
  },
  providerGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  providerOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    position: 'relative',
  },
  providerIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  providerName: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    fontWeight: '500',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    marginBottom: 16,
  },
  quickAmountsLabel: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    marginBottom: 12,
  },
  quickAmountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAmountButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  quickAmountText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    fontWeight: '500',
  },
  bundleGrid: {
    gap: 12,
  },
  bundleOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    position: 'relative',
  },
  bundleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bundleName: {
    fontSize: 18,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
  },
  bundlePrice: {
    fontSize: 18,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
  },
  bundleDescription: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    marginBottom: 4,
  },
  bundleValidity: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
  },
  purchaseButton: {
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 32,
    overflow: 'hidden',
  },
  purchaseButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
  },
});

export default AirtimeDataScreen;


