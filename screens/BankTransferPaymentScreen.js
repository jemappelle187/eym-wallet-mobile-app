import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useLanguage } from '../contexts/LanguageContext';
import { Typography } from '../constants/Typography';
import { fmtMoney, getUserLocale } from '../utils/money';
import { useStatusPoller } from '../hooks/usePoller';
import { API_BASE } from '../app/config/api';
import StepBar from '../components/progress/StepBar';
import * as Haptics from 'expo-haptics';

const BankTransferPaymentScreen = ({ navigation, route, onClose, onDepositSuccess }) => {
  const { colors } = useTheme();
  const { t, language } = useLanguage();

  // Get data from previous screens
  const amount = route.params?.amount || 0;
  const currency = route.params?.currency || 'EUR';
  const bank = route.params?.bank || { name: 'Bank Account', accountMask: '1234' };

  const [isProcessing, setIsProcessing] = useState(true);
  const [phase, setPhase] = useState('SUBMIT'); // SUBMIT | PENDING | COMPLETE | FAILED
  const [currentStep, setCurrentStep] = useState(0); // 0: Initiating, 1: Processing, 2: Complete
  const [referenceId, setReferenceId] = useState(null);
  const referenceIdRef = useRef(null);
  const [transactionId, setTransactionId] = useState(null);
  
  
  // Simple status messages (no typewriter animation)
  const getStatusMessage = () => {
    if (phase === 'COMPLETE') {
      return `€${amount.toFixed(2)} has been added to your wallet.`;
    } else if (phase === 'FAILED') {
      return 'We couldn\'t complete the transfer. No funds were taken.';
    } else if (currentStep === 0) {
      return 'Initiating deposit…';
    } else if (currentStep === 1) {
      return 'Processing with your bank…';
    } else {
      return 'Processing with your bank…';
    }
  };



  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Reset handled flag on unmount
      handledRef.current = false;
    };
  }, []);

  // Start the process when component mounts
  useEffect(() => {
    // Start with step 0 (Initiating)
    setCurrentStep(0);
    
    // Move to step 1 after a longer delay for better UX
    const timer1 = setTimeout(() => {
      setCurrentStep(1);
    }, 3000); // Increased from 2000ms to 3000ms
    
    return () => clearTimeout(timer1);
  }, []);


  
  // Refs to prevent duplicate handling and manage polling
  const handledRef = useRef(false);
  const pollIntervalRef = useRef(null);

  const fetchStatus = useCallback(async () => {
    if (!referenceIdRef.current) return null;
    try {
      // First check bank transfer status
      const transferResponse = await fetch(`${API_BASE}/v1/bank/transfers/${referenceIdRef.current}`);
      const transferData = await transferResponse.json();
      
      if (transferResponse.ok) {
        // Handle the new response format
        let transferStatus = 'pending';
        if (transferData.data && transferData.data.transfer) {
          transferStatus = transferData.data.transfer.status;
        } else {
          transferStatus = transferData.status || 'pending';
        }
        
        console.log('🔄 Bank transfer status:', transferStatus);
        
        // If bank transfer is completed, check if deposit/conversion is also done
        if (transferStatus === 'completed') {
          try {
            // Check deposit status by reference
            const depositResponse = await fetch(`${API_BASE}/v1/deposits/status/bank_sim_${referenceIdRef.current}`);
            const depositData = await depositResponse.json();
            
            if (depositResponse.ok && depositData.data?.deposit) {
              console.log('✅ Deposit conversion completed:', depositData.data.deposit);
              console.log('🎯 Returning COMPLETE status to poller');
              return 'COMPLETE';
            } else {
              console.log('⏳ Bank transfer complete, waiting for conversion...');
              return 'PENDING'; // Still converting
            }
          } catch (depositError) {
            console.log('⏳ Bank transfer complete, conversion in progress...');
            return 'PENDING'; // Assume conversion is happening
          }
        }
        
        if (transferStatus === 'failed') return 'FAILED';
        return 'PENDING';
      } else {
        console.error('Bank transfer status error:', transferData);
        return 'FAILED';
      }
    } catch (error) {
      console.error('Error fetching bank transfer status:', error);
      return 'FAILED';
    }
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, []);

  // Custom polling with proper cleanup and duplicate prevention
  const pollerCallback = useCallback(async () => {
    const status = await fetchStatus();
    console.log('🔄 Poller callback received status:', status);
    if (status === null) {
      console.log('⏸️ No referenceId yet, waiting...');
      return 'PENDING';
    }
    if (status === 'COMPLETE') {
      console.log('🎯 Converting COMPLETE to SUCCESSFUL for poller');
      return 'SUCCESSFUL';
    }
    if (status === 'FAILED') return 'FAILED';
    return 'PENDING';
  }, [fetchStatus]);

  // Create a stable polling function that checks referenceId internally
  const stablePollerCallback = useCallback(async () => {
    if (!referenceIdRef.current) {
      console.log('⏸️ No referenceId yet, waiting...');
      return 'PENDING';
    }
    console.log('🔄 Polling with referenceId:', referenceIdRef.current);
    return await pollerCallback();
  }, [pollerCallback]);

  const { status: pollerStatus, elapsed, showRescue: pollerShowRescue } = useStatusPoller(stablePollerCallback);

  // Idempotent success finalization function
  const finishSuccess = useCallback(() => {
    if (handledRef.current) return; // idempotent
    handledRef.current = true;
    console.log('🏁 Finishing: setProgress(1), handled=true, clearing poller, showing success modal');
    
    // Move to final step
    setCurrentStep(2);
    console.log('🎯 Final step set: Complete');
    setPhase('COMPLETE');
    setTransactionId(`TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
    
    // Haptic feedback on success
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    if (onDepositSuccess) onDepositSuccess(amount, currency);
  }, [amount, currency, onDepositSuccess]);

  // Handle status changes from poller with proper state machine
  useEffect(() => {
    console.log('🔄 Poller status changed:', pollerStatus, 'handled:', handledRef.current);
    
    // Map backend statuses to steps
    switch (pollerStatus) {
      case 'PENDING':
      case 'processing':
        setCurrentStep(1); // Processing
        break;
      case 'COMPLETE':
      case 'COMPLETED':
      case 'completed':
      case 'SUCCESSFUL':
      case 'SUCCESS':
        if (!handledRef.current) {
          finishSuccess();
        }
        return;
      case 'FAILED':
      case 'failed':
        console.log('❌ Bank transfer failed');
        handledRef.current = true;
        setPhase('FAILED');
        break;
    }
  }, [pollerStatus, finishSuccess]);

  useEffect(() => {
    if (phase === 'COMPLETE' || phase === 'FAILED') {
      setIsProcessing(false);
    }
    
  }, [currentStep]);

  // Enhanced micro-guard: lock final state
  useEffect(() => {
    if (phase === 'COMPLETE' && currentStep !== 2) {
      setCurrentStep(2);
    }
  }, [phase, currentStep]);

  // Kill all timers/intervals once complete (prevents phantom updates)
  useEffect(() => {
    if (phase === 'COMPLETE' || phase === 'FAILED') {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, [phase]);


  // Start the bank transfer when component mounts
  const startBankTransfer = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/v1/bank/transfers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          currency: currency,
          bankId: bank.id || 'default',
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      let data;
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Unexpected response (status ${res.status}): ${text.slice(0, 120)}...`);
      }

      if (res.ok) {
        const ref = data.id || data.referenceId || `REF-${Date.now()}`;
        setReferenceId(ref);
        referenceIdRef.current = ref;
        console.log('🎯 ReferenceId set:', ref);
        console.log('🔄 Bank transfer initiated:', { id: ref, status: data.status });
      } else {
        setPhase('FAILED');
        console.error('Transfer Failed', data?.error || data?.message || `Status ${res.status}`);
      }
    } catch (error) {
      console.error('Bank transfer initiation error:', error);
      // Provide a safe fallback to keep UX unblocked
      const fallbackRef = `REF-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      setReferenceId(fallbackRef);
      referenceIdRef.current = fallbackRef;
      console.log('Using fallback reference:', fallbackRef);
    }
  }, [amount, currency, bank]);

  // Start transfer when component mounts
  useEffect(() => {
    console.log('[BankTransferProcessing] mounted with params:', route?.params);
    startBankTransfer();
  }, [startBankTransfer]);



  return (
    <View style={styles.fullscreenProcessingContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Header */}
      <View style={styles.processingHeader}>
        <Text style={styles.processingTitle}>Processing Transfer</Text>
      </View>
      
      {/* Main Content */}
      <View style={styles.processingContent}>
        {/* Step Bar */}
        <StepBar currentStep={currentStep} />
        
        
        {/* Status Message */}
        <Text style={styles.fullscreenProcessingMessage}>
          {getStatusMessage()}
        </Text>
        
        
        
        {/* Close Button - Only show when complete or failed */}
        {(phase === 'COMPLETE' || phase === 'FAILED') && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              console.log('Close button pressed, navigating to HomeDashboard');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Navigate back to home screen
              navigation.navigate('HomeDashboard');
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#ffffff" />
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Footer - Only show when not complete */}
      {phase !== 'COMPLETE' && (
        <View style={styles.processingFooter}>
          <Text style={styles.processingFooterText}>
            Please don't close this screen while processing
          </Text>
        </View>
      )}
      
    </View>
  );
};

const styles = StyleSheet.create({
  // Fullscreen Processing Modal Styles
  fullscreenProcessingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
  },
  processingHeader: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  processingTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
  },
  processingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  fullscreenProcessingMessage: {
    fontSize: 18,
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: Typography.fontFamily,
    fontWeight: '500',
    marginLeft: 8,
  },
  processingFooter: {
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  processingFooterText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: Typography.fontFamily,
    textAlign: 'center',
  },
});

export default BankTransferPaymentScreen;