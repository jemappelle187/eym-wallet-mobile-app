import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Typography } from '../constants/Typography';
import { mobileMoneyManager } from '../utils/MobileMoneyAPIs';

const TestAccountSetupScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [testAccountStatus, setTestAccountStatus] = useState(null);

  useEffect(() => {
    checkTestAccountStatus();
  }, []);

  const checkTestAccountStatus = () => {
    const status = mobileMoneyManager.getTestAccountStatus();
    setTestAccountStatus(status);
  };

  const openProviderSetup = (provider) => {
    if (provider.setupUrl) {
      Linking.openURL(provider.setupUrl).catch(() => {
        Alert.alert('Error', 'Could not open the setup page. Please visit the URL manually.');
      });
    }
  };

  const ProviderCard = ({ provider }) => (
    <View style={styles.providerCard}>
      <View style={styles.providerHeader}>
        <Text style={styles.providerName}>{provider.name}</Text>
        <View style={[styles.statusIndicator, { backgroundColor: provider.configured ? '#10b981' : '#f59e0b' }]}>
          <Ionicons 
            name={provider.configured ? 'checkmark' : 'warning'} 
            size={16} 
            color="#ffffff" 
          />
        </View>
      </View>
      
      <Text style={styles.providerStatus}>
        {provider.configured ? 'Test account configured' : 'Test account not configured'}
      </Text>
      
      {!provider.configured && (
        <TouchableOpacity
          style={styles.setupButton}
          onPress={() => openProviderSetup(provider)}
        >
          <Text style={styles.setupButtonText}>Setup Test Account</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <SafeAreaView style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Test Account Setup</Text>
        <View style={styles.placeholder} />
      </SafeAreaView>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Status Overview */}
        <View style={styles.statusCard}>
          <Ionicons 
            name={testAccountStatus?.configured ? 'checkmark-circle' : 'warning'} 
            size={48} 
            color={testAccountStatus?.configured ? '#10b981' : '#f59e0b'} 
          />
          <Text style={styles.statusTitle}>
            {testAccountStatus?.configured ? 'Test Accounts Ready' : 'Test Accounts Needed'}
          </Text>
          <Text style={styles.statusMessage}>
            {testAccountStatus?.message}
          </Text>
        </View>

        {/* Setup Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>Setup Instructions</Text>
          <Text style={styles.instructionsText}>
            To test mobile money payments with real providers, you need to create developer accounts for each service. 
            This allows you to use their sandbox environments for testing.
          </Text>
          
          <View style={styles.stepContainer}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>Visit the provider's developer portal</Text>
          </View>
          
          <View style={styles.stepContainer}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>Create a developer account</Text>
          </View>
          
          <View style={styles.stepContainer}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>Get API keys and test credentials</Text>
          </View>
          
          <View style={styles.stepContainer}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <Text style={styles.stepText}>Configure the app with your credentials</Text>
          </View>
        </View>

        {/* Provider List */}
        <View style={styles.providersSection}>
          <Text style={styles.sectionTitle}>Mobile Money Providers</Text>
          {testAccountStatus?.providers.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </View>

        {/* Note */}
        <View style={styles.noteCard}>
          <Ionicons name="information-circle" size={24} color="#6366f1" />
          <Text style={styles.noteText}>
            Currently, the app uses mock data for demonstration. Setting up test accounts will enable real API testing.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  statusCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
    marginTop: 16,
    marginBottom: 8,
  },
  statusMessage: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: Typography.fontFamily,
    textAlign: 'center',
    lineHeight: 20,
  },
  instructionsCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
    marginBottom: 16,
  },
  instructionsText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: Typography.fontFamily,
    lineHeight: 20,
    marginBottom: 20,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1e40af',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: Typography.fontFamily,
  },
  providersSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
    marginBottom: 16,
  },
  providerCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
  },
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerStatus: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: Typography.fontFamily,
    marginBottom: 12,
  },
  setupButton: {
    backgroundColor: 'rgba(30, 64, 175, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(30, 64, 175, 0.4)',
    alignSelf: 'flex-start',
  },
  setupButtonText: {
    color: '#1e40af',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  noteCard: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderWidth: 1,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: Typography.fontFamily,
    marginLeft: 12,
    lineHeight: 20,
  },
});

export default TestAccountSetupScreen;










