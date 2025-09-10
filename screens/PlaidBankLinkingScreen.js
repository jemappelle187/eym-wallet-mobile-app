// PlaidBankLinkingScreen.js - Realistic Plaid bank linking interface
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { useTheme } from '../contexts/ThemeContext';

// Bank Logo Component
const BankLogo = ({ bank }) => {
  const logoConfigs = {
    'Chase': { text: 'CHASE', fontSize: 14, color: '#117ACA' },
    'Bank of America': { text: 'BOA', fontSize: 12, color: '#E31837' },
    'Wells Fargo': { text: 'WF', fontSize: 12, color: '#D71E28' },
    'Citibank': { text: 'CITI', fontSize: 12, color: '#0066CC' },
    'Capital One': { text: 'CO', fontSize: 12, color: '#004990' },
    'American Express': { text: 'AMEX', fontSize: 12, color: '#006FCF' },
    'Standard Chartered': { text: 'SCB', fontSize: 12, color: '#1E3A8A' },
    'Barclays': { text: 'BARCLAYS', fontSize: 10, color: '#1E40AF' },
    'Zenith Bank': { text: 'ZENITH', fontSize: 12, color: '#059669' },
    'ING': { text: 'ING', fontSize: 14, color: '#DC2626' },
    'United Bank for Africa': { text: 'UBA', fontSize: 14, color: '#059669' },
    'Emirates NBD': { text: 'ENBD', fontSize: 12, color: '#DC2626' },
    'First Abu Dhabi Bank': { text: 'FAB', fontSize: 12, color: '#1E40AF' },
    'Saudi National Bank': { text: 'SNB', fontSize: 12, color: '#059669' },
    'Qatar National Bank': { text: 'QNB', fontSize: 12, color: '#7C3AED' },
    'National Bank of Bahrain': { text: 'NBB', fontSize: 12, color: '#DC2626' },
  };

  const config = logoConfigs[bank.name] || { text: 'BANK', fontSize: 12, color: '#666666' };

  return (
    <Svg width={32} height={32} viewBox="0 0 32 32">
      <Rect width={32} height={32} rx={6} fill={config.color} />
      <SvgText
        x={16}
        y={20}
        fontFamily="Arial, sans-serif"
        fontSize={Math.max(8, config.fontSize - 2)}
        fontWeight="bold"
        textAnchor="middle"
        fill="white"
      >
        {config.text}
      </SvgText>
    </Svg>
  );
};

const PlaidBankLinkingScreen = ({ navigation, route, onClose }) => {
  const { colors: themeColors = Colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Force dark mode colors to match Stripe modal theme exactly
  const colors = {
    ...themeColors,
    background: '#000000', // Fully black background
    cardBackground: 'rgba(255,255,255,0.15)',
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255,255,255,0.8)',
    textMuted: 'rgba(255,255,255,0.6)',
    border: 'rgba(255,255,255,0.3)',
    textInverse: '#ffffff',
  };
  const [currentStep, setCurrentStep] = useState('search'); // search, login, mfa, accounts, success
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBank, setSelectedBank] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [connectedBanks, setConnectedBanks] = useState(['Chase', 'Bank of America', 'United Bank for Africa', 'Emirates NBD']); // Mock connected banks
  // MFA state
  const [mfaCode, setMfaCode] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [mfaTimer, setMfaTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState('SMS'); // SMS or Email
  const [maskedDestination, setMaskedDestination] = useState('•••• 1234');
  const mfaRefs = useRef([]);
  
  // Floating label state
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Handle back button press
  const handleBack = () => {
    if (currentStep === 'search') {
      // If we're on the first step, close the modal
      onClose();
    } else if (currentStep === 'login') {
      // Go back to search
      setCurrentStep('search');
      setSelectedBank(null);
    } else if (currentStep === 'mfa') {
      // Back to login from MFA
      setCurrentStep('login');
      setMfaCode('');
      setMfaError('');
    } else if (currentStep === 'accounts') {
      // Go back to login
      setCurrentStep('login');
      setSelectedAccounts([]);
    }
  };

  // Plaid Sandbox Banks Data
  const sandboxBanks = [
    {
      id: 'ins_109508',
      name: 'Chase',
      type: 'Retail Bank',
      region: 'North America',
      colors: ['#117ACA', '#0052CC'],
      searchTerms: ['chase', 'jp morgan', 'jpmorgan']
    },
    {
      id: 'ins_109509',
      name: 'Bank of America',
      type: 'Retail Bank',
      region: 'North America',
      colors: ['#E31837', '#012169'],
      searchTerms: ['bank of america', 'bofa', 'boa']
    },
    {
      id: 'ins_109510',
      name: 'Wells Fargo',
      type: 'Retail Bank',
      region: 'North America',
      colors: ['#D71E28', '#FFB81C'],
      searchTerms: ['wells fargo', 'wellsfargo']
    },
    {
      id: 'ins_109511',
      name: 'Citibank',
      type: 'Retail Bank',
      region: 'North America',
      colors: ['#0066CC', '#FF6600'],
      searchTerms: ['citibank', 'citi']
    },
    {
      id: 'ins_109512',
      name: 'Capital One',
      type: 'Credit Card',
      region: 'North America',
      colors: ['#004990', '#FF6600'],
      searchTerms: ['capital one', 'capitalone']
    },
    {
      id: 'ins_109513',
      name: 'American Express',
      type: 'Credit Card',
      region: 'North America',
      colors: ['#006FCF', '#000000'],
      searchTerms: ['american express', 'amex']
    },
    {
      id: 'ins_109514',
      name: 'Standard Chartered',
      type: 'International',
      region: 'Europe & Asia',
      colors: ['#1E3A8A', '#3B82F6'],
      searchTerms: ['standard chartered', 'stanchart', 'scb']
    },
    {
      id: 'ins_109515',
      name: 'Barclays',
      type: 'International',
      region: 'Europe & Asia',
      colors: ['#1E40AF', '#3B82F6'],
      searchTerms: ['barclays', 'barclay']
    },
    {
      id: 'ins_109516',
      name: 'Zenith Bank',
      type: 'African Bank',
      region: 'Africa',
      colors: ['#059669', '#10B981'],
      searchTerms: ['zenith bank', 'zenith', 'zenithbank']
    },
    {
      id: 'ins_109517',
      name: 'ING',
      type: 'International',
      region: 'Europe & Asia',
      colors: ['#DC2626', '#EF4444'],
      searchTerms: ['ing', 'ing bank', 'ing direct']
    },
    {
      id: 'ins_109518',
      name: 'United Bank for Africa',
      type: 'African Bank',
      region: 'Africa',
      colors: ['#059669', '#10B981'],
      searchTerms: ['united bank for africa', 'uba', 'united bank of africa']
    },
    {
      id: 'ins_109519',
      name: 'Emirates NBD',
      type: 'Middle Eastern Bank',
      region: 'Middle East',
      colors: ['#DC2626', '#EF4444'],
      searchTerms: ['emirates nbd', 'emirates', 'nbd', 'dubai bank']
    },
    {
      id: 'ins_109520',
      name: 'First Abu Dhabi Bank',
      type: 'Middle Eastern Bank',
      region: 'Middle East',
      colors: ['#1E40AF', '#3B82F6'],
      searchTerms: ['first abu dhabi bank', 'fab', 'abu dhabi bank']
    },
    {
      id: 'ins_109521',
      name: 'Saudi National Bank',
      type: 'Middle Eastern Bank',
      region: 'Middle East',
      colors: ['#059669', '#10B981'],
      searchTerms: ['saudi national bank', 'snb', 'saudi bank']
    },
    {
      id: 'ins_109522',
      name: 'Qatar National Bank',
      type: 'Middle Eastern Bank',
      region: 'Middle East',
      colors: ['#7C3AED', '#8B5CF6'],
      searchTerms: ['qatar national bank', 'qnb', 'qatar bank']
    },
    {
      id: 'ins_109523',
      name: 'National Bank of Bahrain',
      type: 'Middle Eastern Bank',
      region: 'Middle East',
      colors: ['#DC2626', '#EF4444'],
      searchTerms: ['national bank of bahrain', 'nbb', 'bahrain bank']
    }
  ];

  const filteredBanks = sandboxBanks.filter(bank =>
    bank.searchTerms.some(term => 
      term.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleBankSelect = (bank) => {
    setSelectedBank(bank);
    setCurrentStep('login');
  };

  const handleQuickConnect = (bank) => {
    // Simulate quick connection
    Alert.alert(
      'Quick Connect',
      `Connecting to ${bank.name}...`,
      [{ text: 'OK' }]
    );
    // In real implementation, this would trigger the connection flow
  };

  const isBankConnected = (bankName) => {
    return connectedBanks.includes(bankName);
  };

  const groupBanksByRegion = (banks) => {
    const grouped = {};
    const regionOrder = ['Africa', 'Europe & Asia', 'Middle East', 'North America'];
    
    // Initialize all regions in order
    regionOrder.forEach(region => {
      grouped[region] = [];
    });
    
    // Add banks to their respective regions
    banks.forEach(bank => {
      if (grouped[bank.region]) {
        grouped[bank.region].push(bank);
      }
    });
    
    // Sort banks within each region alphabetically
    regionOrder.forEach(region => {
      grouped[region].sort((a, b) => a.name.localeCompare(b.name));
    });
    
    return grouped;
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Authentication Error', 'Please enter both username and password to continue.');
      return;
    }

    setIsLoading(true);
    
    // Simulate realistic login scenarios with error handling
    const loginScenarios = [
      { probability: 0.85, type: 'success' },
      { probability: 0.08, type: 'invalid_credentials' },
      { probability: 0.05, type: 'network_timeout' },
      { probability: 0.02, type: 'bank_maintenance' }
    ];

    const random = Math.random();
    let selectedScenario = loginScenarios[0]; // Default to success
    
    for (const scenario of loginScenarios) {
      if (random <= scenario.probability) {
        selectedScenario = scenario;
        break;
      }
    }

    setTimeout(() => {
      setIsLoading(false);
      
      switch (selectedScenario.type) {
        case 'invalid_credentials':
          Alert.alert(
            'Authentication Failed',
            'The username or password you entered is incorrect. Please try again.',
            [{ text: 'OK' }]
          );
          return;
          
        case 'network_timeout':
          Alert.alert(
            'Connection Timeout',
            'Unable to connect to the bank. Please check your internet connection and try again.',
            [{ text: 'Retry', onPress: () => handleLogin() }, { text: 'Cancel' }]
          );
          return;
          
        case 'bank_maintenance':
          Alert.alert(
            'Bank Maintenance',
            'The bank is currently undergoing scheduled maintenance. Please try again in a few hours.',
            [{ text: 'OK' }]
          );
          return;
          
        default: // success case
          // Generate realistic mock accounts based on selected bank
          const mockAccounts = [
            {
              id: `acc_${selectedBank.id}_1`,
              name: `${selectedBank.name} Checking`,
              type: 'checking',
              mask: '1234',
              balance: Math.floor(Math.random() * 15000) + 2500,
              subtype: 'checking',
              currency: 'USD',
              lastUpdated: new Date().toISOString()
            },
            {
              id: `acc_${selectedBank.id}_2`,
              name: `${selectedBank.name} Savings`,
              type: 'savings',
              mask: '5678',
              balance: Math.floor(Math.random() * 50000) + 15000,
              subtype: 'savings',
              currency: 'USD',
              lastUpdated: new Date().toISOString()
            },
            {
              id: `acc_${selectedBank.id}_3`,
              name: `${selectedBank.name} Credit Card`,
              type: 'credit',
              mask: '9012',
              balance: -(Math.floor(Math.random() * 5000) + 500),
              subtype: 'credit card',
              currency: 'USD',
              lastUpdated: new Date().toISOString()
            }
          ];
          
          setAccounts(mockAccounts);
          // Kick off MFA step before accounts
          startMfa();
      }
    }, 2500);
  };

  // Start MFA: reset state and start countdown
  const startMfa = () => {
    setMfaCode('');
    setMfaError('');
    setDeliveryMethod('SMS');
    setMaskedDestination('•••• 1234');
    setMfaTimer(60);
    setCanResend(false);
    setCurrentStep('mfa');
  };

  // Timer effect for MFA
  useEffect(() => {
    if (currentStep !== 'mfa') return;
    if (mfaTimer === 0) {
      setCanResend(true);
      return;
    }
    const t = setTimeout(() => setMfaTimer(prev => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [currentStep, mfaTimer]);

  const handleResendCode = () => {
    if (!canResend) return;
    setMfaError('');
    setMfaCode('');
    setMfaTimer(60);
    setCanResend(false);
  };

  const handleVerifyCode = () => {
    // Accept 123456 as the demo correct code
    if (mfaCode.replace(/\s/g, '') === '123456') {
      setMfaError('');
      setCurrentStep('accounts');
    } else {
      setMfaError('Invalid or expired code. Please try again.');
    }
  };

  const handleAccountSelection = (accountId) => {
    setSelectedAccounts(prev => {
      if (prev.includes(accountId)) {
        return prev.filter(id => id !== accountId);
      } else {
        return [...prev, accountId];
      }
    });
  };

  const handleContinue = () => {
    if (selectedAccounts.length === 0) {
      Alert.alert('Error', 'Please select at least one account');
      return;
    }

    setIsLoading(true);
    
    // Simulate account linking
    setTimeout(() => {
      setIsLoading(false);
      setCurrentStep('success');
    }, 1500);
  };

  const handleSuccess = () => {
    // Prepare bank data for payment processing
    const selectedAccount = accounts.find(acc => selectedAccounts.includes(acc.id));
    if (selectedAccount) {
      const bankData = {
        bankName: selectedBank.name,
        accountId: selectedAccount.id,
        accountType: selectedAccount.type,
        accountMask: selectedAccount.mask
      };
      
      // Call the bank transfer payment handler
      if (onClose) {
        onClose(bankData);
      } else {
        navigation.goBack();
      }
    } else {
      // Fallback if no account selected
      if (onClose) {
        onClose();
      } else {
        navigation.goBack();
      }
    }
  };

  const renderSearchStep = () => (
    <View style={styles.stepContainer}>
      <View style={[styles.headerContainer, {
        paddingLeft: 24 + (insets?.left || 0),
        paddingRight: 24 + (insets?.right || 0),
      }]}>
        <TouchableOpacity style={styles.newBackButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Connect your bank</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>
      <Text style={[styles.stepSubtitle, { 
        color: colors.textSecondary,
        paddingLeft: 24 + (insets?.left || 0),
        paddingRight: 24 + (insets?.right || 0),
        textAlign: 'center',
      }]}>Search for your bank to get started</Text>
      
      <View style={[styles.searchContainer, { 
        backgroundColor: 'rgba(255,255,255,0.15)',
        shadowColor: 'rgba(0,0,0,0.2)',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        marginLeft: 24 + (insets?.left || 0),
        marginRight: 24 + (insets?.right || 0),
      }]}>
        <Ionicons name="search" size={20} color="rgba(255,255,255,0.8)" style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: '#ffffff' }]}
          placeholder="Search for your bank"
          placeholderTextColor="rgba(255,255,255,0.6)"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
        />
      </View>

      <ScrollView 
        style={styles.bankList}
        showsVerticalScrollIndicator={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {(() => {
          const groupedBanks = groupBanksByRegion(filteredBanks);
          const regionOrder = ['Africa', 'Europe & Asia', 'Middle East', 'North America'];
          
          return regionOrder.map((region) => {
            const banks = groupedBanks[region];
            if (!banks || banks.length === 0) return null;
            
            return (
              <View key={region} style={styles.regionSection}>
                <Text style={[styles.regionTitle, {
                  marginLeft: 24 + (insets?.left || 0),
                  marginRight: 24 + (insets?.right || 0),
                }]}>{region}</Text>
                {banks.map((bank) => {
                  const isConnected = isBankConnected(bank.name);
                  return (
                    <View key={bank.id} style={[styles.bankItem, { 
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      shadowColor: 'rgba(0,0,0,0.2)',
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.15,
                      shadowRadius: 12,
                      elevation: 8,
                      marginLeft: 24 + (insets?.left || 0),
                      marginRight: 24 + (insets?.right || 0),
                    }]}>
                      <TouchableOpacity 
                        style={styles.bankInfoContainer}
                        onPress={() => handleBankSelect(bank)}
                      >
                        <View style={styles.bankLogo}>
                          <BankLogo bank={bank} />
                        </View>
                        <View style={styles.bankDetails}>
                          <Text style={[styles.bankName, { color: '#ffffff' }]}>{bank.name}</Text>
                          <View style={styles.bankStatus}>
                            {isConnected ? (
                              <View style={styles.connectedStatus}>
                                <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                                <Text style={styles.connectedText}>Connected</Text>
                              </View>
                            ) : (
                              <Text style={styles.notConnectedText}>Not connected</Text>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                      
                      {!isConnected && (
                        <TouchableOpacity 
                          style={styles.quickConnectButton}
                          onPress={() => handleQuickConnect(bank)}
                        >
                          <Text style={styles.quickConnectText}>Connect</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            );
          });
        })()}
      </ScrollView>
    </View>
  );

  const renderLoginStep = () => (
    <View style={styles.stepContainer}>
      <View style={[styles.headerContainer, {
        paddingLeft: 24 + (insets?.left || 0),
        paddingRight: 24 + (insets?.right || 0),
      }]}>
        <TouchableOpacity style={styles.newBackButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Enter credentials</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.bankHeader, {
        paddingLeft: 24 + (insets?.left || 0),
        paddingRight: 24 + (insets?.right || 0),
        justifyContent: 'center',
        alignItems: 'center',
      }]}>
        <View style={styles.bankLogo}>
          <BankLogo bank={selectedBank} />
        </View>
        <Text style={[styles.bankName, { color: colors.textPrimary }]}>{selectedBank.name}</Text>
      </View>

      <Text style={[styles.stepTitle, { 
        color: colors.textPrimary,
        paddingLeft: 24 + (insets?.left || 0),
        paddingRight: 24 + (insets?.right || 0),
        textAlign: 'center',
      }]}>Enter your credentials</Text>
      <Text style={[styles.stepSubtitle, { 
        color: colors.textSecondary,
        paddingLeft: 24 + (insets?.left || 0),
        paddingRight: 24 + (insets?.right || 0),
        textAlign: 'center',
      }]}>We'll securely connect to your bank</Text>

      <View style={[styles.formContainer, {
        paddingLeft: 24 + (insets?.left || 0),
        paddingRight: 24 + (insets?.right || 0),
      }]}>
        <View style={styles.inputContainer}>
          {(username || usernameFocused) && (
            <Text style={[styles.floatingLabel, { color: colors.textSecondary }]}>
              Username
            </Text>
          )}
          <TextInput
            style={[styles.input, { 
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderColor: usernameFocused ? colors.primary : 'rgba(255,255,255,0.3)',
              color: '#ffffff',
              shadowColor: 'rgba(0,0,0,0.2)',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
              paddingTop: username || usernameFocused ? 20 : 16,
              paddingBottom: username || usernameFocused ? 12 : 16,
            }]}
            placeholder={username || usernameFocused ? "" : "Enter your username"}
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={username}
            onChangeText={setUsername}
            onFocus={() => setUsernameFocused(true)}
            onBlur={() => setUsernameFocused(false)}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          {(password || passwordFocused) && (
            <Text style={[styles.floatingLabel, { color: colors.textSecondary }]}>
              Password
            </Text>
          )}
          <TextInput
            style={[styles.input, { 
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderColor: passwordFocused ? colors.primary : 'rgba(255,255,255,0.3)',
              color: '#ffffff',
              shadowColor: 'rgba(0,0,0,0.2)',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
              paddingTop: password || passwordFocused ? 20 : 16,
              paddingBottom: password || passwordFocused ? 12 : 16,
            }]}
            placeholder={password || passwordFocused ? "" : "Enter your password"}
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={password}
            onChangeText={setPassword}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            secureTextEntry
          />
        </View>

        <View style={styles.continueButtonContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton, 
              { backgroundColor: colors.primary },
              isLoading && { backgroundColor: colors.textMuted }
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={[styles.continueButtonText, { color: colors.textInverse }]}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // MFA step
  const renderMfaStep = () => (
    <View style={styles.stepContainer}>
      <View style={[styles.headerContainer, {
        paddingLeft: 24 + (insets?.left || 0),
        paddingRight: 24 + (insets?.right || 0),
      }]}>
        <TouchableOpacity style={styles.newBackButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Verify it’s you</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Text style={[styles.stepSubtitle, { 
        color: colors.textSecondary,
        paddingLeft: 24 + (insets?.left || 0),
        paddingRight: 24 + (insets?.right || 0),
      }]}>Enter the 6‑digit code we sent via {deliveryMethod} to {maskedDestination}</Text>

      <View style={[styles.mfaInputsRow, {
        paddingLeft: 24 + (insets?.left || 0),
        paddingRight: 24 + (insets?.right || 0),
      }]}>
        {[0,1,2,3,4,5].map((i) => (
          <TextInput
            key={i}
            ref={(el) => { mfaRefs.current[i] = el; }}
            value={mfaCode[i] || ''}
            onChangeText={(txt) => {
              const onlyDigits = txt.replace(/\D/g, '');
              const arr = mfaCode.split('');
              arr[i] = onlyDigits.slice(-1);
              const next = arr.join('');
              setMfaCode(next);
              if (onlyDigits && i < 5) {
                mfaRefs.current[i + 1] && mfaRefs.current[i + 1].focus();
              }
            }}
            keyboardType="number-pad"
            maxLength={1}
            style={[styles.mfaInputBox, { borderColor: mfaError ? '#ef4444' : 'rgba(255,255,255,0.3)' }]}
            placeholder="•"
            placeholderTextColor="rgba(255,255,255,0.4)"
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Backspace') {
                const arr = mfaCode.split('');
                if (!arr[i] && i > 0) {
                  mfaRefs.current[i - 1] && mfaRefs.current[i - 1].focus();
                }
              }
            }}
          />
        ))}
      </View>

      <View style={{
        paddingLeft: 24 + (insets?.left || 0),
        paddingRight: 24 + (insets?.right || 0),
      }}>
        {mfaError ? (
          <Text style={styles.mfaErrorText}>{mfaError}</Text>
        ) : (
          <Text style={styles.mfaTimerText}>Resend code in {String(Math.floor(mfaTimer/60)).padStart(2,'0')}:{String(mfaTimer%60).padStart(2,'0')}</Text>
        )}
      </View>

      <View style={[styles.mfaActionsRow, {
        paddingLeft: 24 + (insets?.left || 0),
        paddingRight: 24 + (insets?.right || 0),
      }]}>
        <TouchableOpacity onPress={() => { setDeliveryMethod(deliveryMethod === 'SMS' ? 'Email' : 'SMS'); setMaskedDestination(deliveryMethod === 'SMS' ? 'j***@mail.com' : '•••• 1234'); }}>
          <Text style={styles.mfaAltMethod}>Use {deliveryMethod === 'SMS' ? 'Email' : 'SMS'} instead</Text>
        </TouchableOpacity>
        <TouchableOpacity disabled={!canResend} onPress={handleResendCode}>
          <Text style={[styles.mfaResend, !canResend && { opacity: 0.5 }]}>Resend code</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.continueButtonContainer, {
        paddingLeft: 24 + (insets?.left || 0),
        paddingRight: 24 + (insets?.right || 0),
        marginTop: 20,
      }]}>
        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: mfaCode.length === 6 ? colors.primary : colors.textMuted }]}
          onPress={handleVerifyCode}
          disabled={mfaCode.length !== 6}
        >
          <Text style={[styles.continueButtonText, { color: colors.textInverse }]}>Verify</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAccountsStep = () => (
    <View style={styles.stepContainer}>
      <View style={[styles.headerContainer, {
        paddingLeft: 24 + (insets?.left || 0),
        paddingRight: 24 + (insets?.right || 0),
      }]}>
        <TouchableOpacity style={styles.newBackButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Select accounts</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>
      <Text style={[styles.stepSubtitle, { 
        color: colors.textSecondary,
        paddingLeft: 24 + (insets?.left || 0),
        paddingRight: 24 + (insets?.right || 0),
        textAlign: 'center',
      }]}>Choose which accounts to connect</Text>

      <View style={[styles.accountsHeader, {
        paddingLeft: 24 + (insets?.left || 0),
        paddingRight: 24 + (insets?.right || 0),
      }]}>
        <Text style={[styles.accountsHeaderText, { 
          color: colors.textSecondary,
          textAlign: 'center',
        }]}>
          Select accounts to connect to your wallet
        </Text>
        <Text style={[styles.accountsSubText, { 
          color: colors.textMuted,
          textAlign: 'center',
        }]}>
          You can connect multiple accounts from the same bank
        </Text>
      </View>

      <ScrollView 
        style={styles.accountsList}
        showsVerticalScrollIndicator={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {accounts.map((account) => (
          <TouchableOpacity
            key={account.id}
            style={[
              styles.accountItem,
              { 
                backgroundColor: 'rgba(255,255,255,0.15)',
                marginLeft: 24 + (insets?.left || 0),
                marginRight: 24 + (insets?.right || 0),
                shadowColor: 'rgba(0,0,0,0.2)',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 8,
              },
              selectedAccounts.includes(account.id) && { 
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.2)'
              }
            ]}
            onPress={() => handleAccountSelection(account.id)}
          >
            <View style={styles.accountInfo}>
              <View style={styles.accountHeader}>
                <View style={styles.accountNameContainer}>
                  <Text style={[styles.accountName, { color: '#ffffff' }]}>{account.name}</Text>
                </View>
                <View style={[styles.accountTypeBadge, { 
                  backgroundColor: account.type === 'credit' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'
                }]}>
                  <Text style={[styles.accountTypeText, { 
                    color: account.type === 'credit' ? '#ef4444' : '#22c55e'
                  }]}>
                    {account.type.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={[styles.accountMask, { color: 'rgba(255,255,255,0.8)' }]}>••••{account.mask}</Text>
              <View style={styles.accountBalanceContainer}>
                <Text style={[styles.accountBalance, { 
                  color: account.balance < 0 ? '#ef4444' : '#22c55e'
                }]}>
                  {account.balance < 0 ? '-' : ''}${Math.abs(account.balance).toLocaleString()}
                </Text>
              </View>
            </View>
            <View style={styles.accountCheckbox}>
              {selectedAccounts.includes(account.id) ? (
                <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
              ) : (
                <Ionicons name="ellipse-outline" size={24} color="rgba(255,255,255,0.8)" />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={[styles.continueButtonContainer, {
        paddingLeft: 24 + (insets?.left || 0),
        paddingRight: 24 + (insets?.right || 0),
      }]}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            { backgroundColor: selectedAccounts.length > 0 ? colors.primary : colors.textMuted }
          ]}
          onPress={handleContinue}
          disabled={selectedAccounts.length === 0}
        >
          <Text style={[styles.continueButtonText, { color: colors.textInverse }]}>
            Connect {selectedAccounts.length} account{selectedAccounts.length !== 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSuccessStep = () => (
    <View style={styles.stepContainer}>
      <View style={[styles.successContainer, {
        paddingLeft: 24 + (insets?.left || 0),
        paddingRight: 24 + (insets?.right || 0),
      }]}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
        </View>
        <Text style={[styles.successTitle, { color: colors.textPrimary }]}>Successfully connected!</Text>
        <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
          Your {selectedBank.name} account has been securely linked to your wallet.
        </Text>
        
        <View style={styles.connectionDetails}>
          <View style={styles.connectionDetailItem}>
            <Ionicons name="shield-checkmark" size={20} color="#10B981" />
            <Text style={[styles.connectionDetailText, { color: colors.textSecondary }]}>
              Bank-level security encryption
            </Text>
          </View>
          <View style={styles.connectionDetailItem}>
            <Ionicons name="time" size={20} color="#10B981" />
            <Text style={[styles.connectionDetailText, { color: colors.textSecondary }]}>
              Real-time account updates
            </Text>
          </View>
          <View style={styles.connectionDetailItem}>
            <Ionicons name="refresh" size={20} color="#10B981" />
            <Text style={[styles.connectionDetailText, { color: colors.textSecondary }]}>
              Automatic data synchronization
            </Text>
          </View>
        </View>
        
        <View style={styles.connectedAccounts}>
          <Text style={[styles.connectedAccountsTitle, { 
            color: colors.textPrimary,
            textAlign: 'center',
          }]}>Connected Accounts:</Text>
          {accounts.filter(acc => selectedAccounts.includes(acc.id)).map(account => (
            <View key={account.id} style={[styles.connectedAccount, { 
              backgroundColor: 'rgba(255,255,255,0.15)',
              shadowColor: 'rgba(0,0,0,0.2)',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }]}>
              <View style={styles.connectedAccountHeader}>
                <View style={styles.accountNameContainer}>
                  <Text style={[styles.connectedAccountName, { color: '#ffffff' }]}>{account.name}</Text>
                </View>
                <View style={[styles.accountTypeBadge, { 
                  backgroundColor: account.type === 'credit' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'
                }]}>
                  <Text style={[styles.accountTypeText, { 
                    color: account.type === 'credit' ? '#ef4444' : '#22c55e'
                  }]}>
                    {account.type.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={[styles.connectedAccountBalance, { 
                color: account.balance < 0 ? '#ef4444' : '#22c55e'
              }]}>
                {account.balance < 0 ? '-' : ''}${Math.abs(account.balance).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: colors.primary }]}
          onPress={handleSuccess}
        >
          <Text style={[styles.continueButtonText, { color: colors.textInverse }]}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.background,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    }]}>
      <StatusBar barStyle="light-content" />
      
      {currentStep === 'search' && renderSearchStep()}
      {currentStep === 'login' && renderLoginStep()}
      {currentStep === 'mfa' && (
        <View style={styles.mfaContainer}>
          {renderMfaStep()}
        </View>
      )}
      {currentStep === 'accounts' && renderAccountsStep()}
      {currentStep === 'success' && renderSuccessStep()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mfaContainer: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  newBackButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginLeft: 16,
  },
  headerSpacer: {
    width: 40, // Same width as back button for centering
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: 'Montserrat',
  },
  stepSubtitle: {
    fontSize: 16,
    marginBottom: 24,
    fontFamily: 'Montserrat',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Montserrat',
  },
  bankList: {
    flex: 1,
  },
  bankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  bankLogo: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  bankLogoText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  bankName: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Montserrat',
  },
  bankInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bankDetails: {
    flex: 1,
    marginLeft: 8,
  },
  bankStatus: {
    marginTop: 2,
  },
  connectedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectedText: {
    fontSize: 11,
    color: '#10B981',
    marginLeft: 4,
    fontFamily: 'Montserrat',
    fontWeight: '500',
  },
  notConnectedText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Montserrat',
  },

  quickConnectButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  quickConnectText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Montserrat',
  },
  regionSection: {
    marginBottom: 20,
  },
  regionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
    marginTop: 8,
    fontFamily: 'Montserrat',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    marginLeft: 8,
    fontFamily: 'Montserrat',
  },
  bankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  formContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Montserrat',
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    fontFamily: 'Montserrat',
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  floatingLabel: {
    position: 'absolute',
    left: 16,
    top: 8,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Montserrat',
    zIndex: 1,
  },
  continueButtonContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    minWidth: 200,
    maxWidth: 280,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Montserrat',
  },

  accountsList: {
    flex: 1,
    marginBottom: 20,
  },
  accountsHeader: {
    marginBottom: 16,
  },
  accountsHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Montserrat',
  },
  accountsSubText: {
    fontSize: 14,
    fontFamily: 'Montserrat',
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedAccount: {
    borderColor: Colors.primary,
  },
  accountInfo: {
    flex: 1,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  accountNameContainer: {
    flex: 1,
    marginRight: 12,
  },
  accountTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountTypeText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Montserrat',
  },
  accountBalanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  accountCurrency: {
    fontSize: 12,
    marginLeft: 4,
    fontFamily: 'Montserrat',
  },
  accountName: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Montserrat',
    flexWrap: 'wrap',
  },
  accountMask: {
    fontSize: 14,
    marginTop: 4,
    fontFamily: 'Montserrat',
  },
  accountBalance: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.success,
    marginTop: 4,
    fontFamily: 'Montserrat',
  },
  accountCheckbox: {
    marginLeft: 16,
  },
  // MFA styles
  mfaInputsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 12,
  },
  mfaInputBox: {
    width: 48,
    height: 56,
    borderRadius: 10,
    borderWidth: 1,
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'Montserrat',
    backgroundColor: 'rgba(255,255,255,0.08)'
  },
  mfaErrorText: {
    color: '#ef4444',
    fontSize: 13,
    marginBottom: 6,
    fontFamily: 'Montserrat',
  },
  mfaTimerText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginBottom: 6,
    fontFamily: 'Montserrat',
  },
  mfaActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mfaAltMethod: {
    color: '#93c5fd',
    fontSize: 14,
    fontFamily: 'Montserrat',
  },
  mfaResend: {
    color: '#93c5fd',
    fontSize: 14,
    fontFamily: 'Montserrat',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Montserrat',
  },
  successSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    fontFamily: 'Montserrat',
  },
  connectedAccounts: {
    width: '100%',
    marginBottom: 32,
  },
  connectionDetails: {
    marginTop: 20,
    marginBottom: 16,
  },
  connectionDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  connectionDetailText: {
    fontSize: 14,
    marginLeft: 8,
    fontFamily: 'Montserrat',
  },
  connectedAccountsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'Montserrat',
  },
  connectedAccount: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  connectedAccountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  connectedAccountName: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Montserrat',
  },
  connectedAccountBalance: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.success,
    fontFamily: 'Montserrat',
  },
});

export default PlaidBankLinkingScreen;
