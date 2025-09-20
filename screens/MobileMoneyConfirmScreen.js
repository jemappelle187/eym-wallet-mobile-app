import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView, ActivityIndicator, Animated, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import mtnApiService from '../services/mtnApi';
import StepBar from '../components/progress/StepBar';
import { Typography } from '../constants/Typography';

const MobileMoneyConfirmScreen = ({ navigation, route }) => {
  // Only log in development mode to reduce console noise
  if (__DEV__) {
    console.log('🎯 MobileMoneyConfirmScreen mounted!', route.params);
  }
  
  const { 
    amount, 
    selectedCurrency, 
    selectedProvider, 
    selectedVerifiedPhone, 
    recipientName,
    isDeposit,
    fees = 0,
    totalAmount
  } = route.params || {};

  // Currency conversion rates (matching the app's logic)
  const exchangeRates = {
    USD: { USDC: 1.0, EURC: 0.93 },
    EUR: { USDC: 1.08, EURC: 1.0 },
    GHS: { USDC: 0.08, EURC: 0.074 },
    AED: { USDC: 0.27, EURC: 0.25 },
    NGN: { USDC: 0.0007, EURC: 0.0006 }
  };

  // Calculate converted amount based on auto-conversion logic
  const getConvertedAmount = () => {
    if (!amount || !selectedCurrency) return { amount: '0.00', currency: 'USDC' };
    // Auto-conversion logic: EUR → EURC, everything else → USDC
    const targetCurrency = selectedCurrency === 'EUR' ? 'EURC' : 'USDC';
    const targetRate = selectedCurrency === 'EUR'
      ? (exchangeRates[selectedCurrency]?.EURC || 1)
      : (exchangeRates[selectedCurrency]?.USDC || 1);
    const finalAmount = (Number(amount) * Number(targetRate || 1)).toFixed(2);
    return { amount: finalAmount, currency: targetCurrency };
  };

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0); // 0: idle, 1: submitting, 2: polling, 3: complete
  const [processingMessage, setProcessingMessage] = useState('');
  const [transactionId, setTransactionId] = useState(null);
  const [phase, setPhase] = useState('IDLE'); // IDLE | SUBMIT | PROCESS | COMPLETE | FAILED
  const [finalized, setFinalized] = useState(false); // ensure conversion is only applied once
  
  // Animation for processing UI fade-in
  const processingFadeAnim = useRef(new Animated.Value(0)).current;
  
  // Animation for success message fade-in
  const successFadeAnim = useRef(new Animated.Value(0)).current;

  // Fade-in animation for processing UI
  useEffect(() => {
    if (isProcessing) {
      // Fade in processing UI smoothly
      Animated.timing(processingFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      // Reset animation when processing stops
      processingFadeAnim.setValue(0);
    }
  }, [isProcessing, processingFadeAnim]);

  // Fade-in animation for success message
  useEffect(() => {
    if (processingStep === 3) {
      // Fade in success message after a brief delay
      setTimeout(() => {
        Animated.timing(successFadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }, 200); // Small delay for better visual effect
    } else {
      // Reset animation when not completed
      successFadeAnim.setValue(0);
    }
  }, [processingStep, successFadeAnim]);

  // Persist the conversion to the wallet/backend once MTN confirms SUCCESS
  const finalizeDeposit = async (referenceId) => {
    try {
      if (finalized) return; // guard against multiple calls
      setFinalized(true);

      const { amount: recvAmount, currency: recvCurrency } = getConvertedAmount();
      const rate = selectedCurrency === 'EUR'
        ? (exchangeRates[selectedCurrency]?.EURC ?? 1)
        : (exchangeRates[selectedCurrency]?.USDC ?? 1);

      console.log('💳 Auto-crediting wallet in stablecoin', {
        referenceId,
        from: { amount: Number(amount), currency: selectedCurrency },
        to: { amount: Number(recvAmount), currency: recvCurrency },
        rate
      });

      // Option A: notify previous screen via callback so it can credit the wallet/store
      if (route.params?.onDepositSuccess) {
        await route.params.onDepositSuccess({
          referenceId,
          from: { amount: Number(amount), currency: selectedCurrency },
          to: { amount: Number(recvAmount), currency: recvCurrency },
          rate
        });
      }

      // Option B (server-side): call your backend to finalize and credit in stablecoin
      // await walletApi.credit({
      //   referenceId,
      //   fromAmount: Number(amount),
      //   fromCurrency: selectedCurrency,
      //   toAmount: Number(recvAmount),
      //   toCurrency: recvCurrency,
      //   rate
      // });
    } catch (e) {
      console.error('❌ finalizeDeposit failed', e);
    }
  };

  const handleConfirm = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // If transaction is completed (step 3), navigate back to home
      if (processingStep === 3) {
        console.log('🎯 Transaction completed, navigating back to home...');
        navigation.navigate('HomeDashboard');
        return;
      }
      
      console.log('🎯 Starting transaction processing inline...');
      
      // Start processing inline
      setIsProcessing(true);
      setPhase('SUBMIT');
      setProcessingStep(1);
      setProcessingMessage('Processing payment...');
      
      // Process the transaction
      await handleMobileMoneyAction();
      
    } catch (error) {
      console.error('Haptic feedback error:', error);
    }
  };

  const handleMobileMoneyAction = async () => {
    try {
      console.log('🎯 Processing mobile money transaction...');
      
      // Set submitting state
      setPhase('SUBMIT');
      setProcessingStep(1);
      setProcessingMessage('Processing payment...');
      
      // Call the API
      const result = await mtnApiService.sendMoney({
        amount: amount.toString(),
        currency: selectedCurrency,
        phoneNumber: selectedVerifiedPhone?.phoneNumber,
        payerMessage: 'Mobile money deposit',
        payeeNote: 'Deposit to wallet'
      });
      
      console.log('🎯 API Response:', result);
      
      if (result.success && result.referenceId) {
        setTransactionId(result.referenceId);
        setPhase('PROCESS');
        setProcessingStep(2);
        setProcessingMessage('Processing payment...');
        
        // Start polling for status
        pollStatus(result.referenceId);
      } else {
        throw new Error(result.error || 'Payment request failed');
      }
      
    } catch (error) {
      console.error('❌ Mobile money action failed:', error);
      setPhase('FAILED');
      setProcessingStep(3);
      setProcessingMessage('Payment failed. Please try again.');
      
      Alert.alert('Error', 'Payment failed. Please try again.');
      
      // Reset after delay
      setTimeout(() => {
        setIsProcessing(false);
        setPhase('IDLE');
        setProcessingStep(0);
        setProcessingMessage('');
      }, 3000);
    }
  };

  const pollStatus = async (referenceId) => {
    const maxPolls = 25; // 30 seconds with 1.2s intervals
    const deadline = Date.now() + 30000;
    let pollCount = 0;
    
    const pollInterval = setInterval(async () => {
      try {
        pollCount++;
        
        // Check timeout
        if (Date.now() > deadline) {
          clearInterval(pollInterval);
          setPhase('FAILED');
          setProcessingStep(3);
          setProcessingMessage('Payment timed out. Please try again.');
          setTimeout(() => {
            setIsProcessing(false);
            setPhase('IDLE');
            setProcessingStep(0);
            setProcessingMessage('');
          }, 3000);
          return;
        }
        
        const statusResult = await mtnApiService.getTransactionStatus(referenceId);
        const currentStatus = (statusResult?.data?.status || '').toUpperCase();
        
        console.log('🔍 Polling status:', currentStatus, 'Poll count:', pollCount);
        
        if (currentStatus === 'SUCCESS' || currentStatus === 'SUCCESSFUL') {
          clearInterval(pollInterval);
          console.log('🎉 Payment successful!');

          // Apply the auto-conversion to the actual wallet/backend
          await finalizeDeposit(referenceId);

          setPhase('COMPLETE');
          setProcessingStep(3);
          setProcessingMessage('Deposit successful! Your transaction has been completed.');

          // Success message is now shown inline with "Done" button for user control

        } else if (currentStatus === 'FAILED' || currentStatus === 'REJECTED' || currentStatus === 'CANCELLED') {
          clearInterval(pollInterval);
          setPhase('FAILED');
          setProcessingStep(3);
          setProcessingMessage('Payment failed. Please try again.');
          
          setTimeout(() => {
            setIsProcessing(false);
            setPhase('IDLE');
            setProcessingStep(0);
            setProcessingMessage('');
          }, 3000);
          
        } else if (currentStatus === 'PROCESSING') {
          setProcessingMessage('Processing payment...');
        }
        
      } catch (error) {
        console.error('❌ Polling error:', error);
        if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
          setPhase('FAILED');
          setProcessingStep(3);
          setProcessingMessage('Payment timed out. Please try again.');
          setTimeout(() => {
            setIsProcessing(false);
            setPhase('IDLE');
            setProcessingStep(0);
            setProcessingMessage('');
          }, 3000);
        }
      }
    }, 1200);
  };

  const handleBack = () => {
    console.log('🎯 Back button pressed, isProcessing:', isProcessing);
    
    if (isProcessing) {
      // If processing, show confirmation dialog
      Alert.alert(
        'Cancel Transaction',
        'Are you sure you want to cancel this transaction?',
        [
          {
            text: 'Continue Processing',
            style: 'cancel'
          },
          {
            text: 'Cancel Transaction',
            style: 'destructive',
            onPress: () => {
              console.log('🎯 User confirmed cancellation');
              setIsProcessing(false);
              setPhase('IDLE');
              setProcessingStep(0);
              setProcessingMessage('');
              navigation.goBack();
            }
          }
        ]
      );
    } else {
      // Normal back navigation
      navigation.goBack();
    }
  };

  const formatAmount = (amount, currency) => {
    const numAmount = parseFloat(amount) || 0;
    const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GHS' ? '₵' : currency;
    return `${symbol}${numAmount.toFixed(2)}`;
  };

  const getProviderIcon = () => {
    if (selectedProvider?.id === 'mtn') return '📱';
    if (selectedProvider?.id === 'vodafone') return '📞';
    if (selectedProvider?.id === 'airteltigo') return '📡';
    return '💰';
  };

  const getProviderColor = () => {
    if (selectedProvider?.id === 'mtn') return '#FF6B35';
    if (selectedProvider?.id === 'vodafone') return '#E60000';
    if (selectedProvider?.id === 'airteltigo') return '#007BFF';
    return '#1E40AF';
  };

  return (
    <View style={styles.darkContainer}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.safeArea} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, isProcessing && styles.processingBackButton]}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        {!isProcessing && (
          <Text style={styles.headerTitle}>
            {isDeposit ? 'Confirm Deposit' : 'Confirm Payment'}
          </Text>
        )}
      </View>

       <View style={styles.container}>
        {/* Amount Display */}
        <View style={styles.amountSection}>
          <Text style={styles.amountText}>
            {formatAmount(amount, selectedCurrency)}
          </Text>
          {processingStep !== 3 && (
            <Text style={styles.amountLabel}>
              {isDeposit ? 'Amount to Deposit' : 'Amount to Send'}
            </Text>
          )}
        </View>

        {/* Transaction Details - Hidden during processing */}
        {!isProcessing && (
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Transaction Details</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Method</Text>
              <View style={styles.detailValueContainer}>
                <Text style={styles.detailValue}>
                  {getProviderIcon()} {selectedProvider?.name || 'Mobile Money'}
                </Text>
              </View>
            </View>

            {isDeposit ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>From</Text>
                <Text style={styles.detailValue}>
                  {selectedVerifiedPhone?.name} • {selectedVerifiedPhone?.phoneNumber}
                </Text>
              </View>
            ) : (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>To</Text>
                <Text style={styles.detailValue}>
                  {recipientName} • {selectedVerifiedPhone?.phoneNumber}
                </Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Processing Time</Text>
              <Text style={styles.detailValue}>≈30s</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Fees</Text>
              <Text style={styles.detailValue}>
                {formatAmount(fees, selectedCurrency)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>You'll receive</Text>
              <Text style={styles.detailValue}>
                {(() => {
                  const { amount: recvAmount, currency: recvCurrency } = getConvertedAmount();
                  return `${recvAmount} ${recvCurrency}`;
                })()}
              </Text>
            </View>

            <View style={[styles.detailRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                {formatAmount(totalAmount || amount, selectedCurrency)}
              </Text>
            </View>
          </View>
        )}

        {/* Processing UI - Fades in when processing starts */}
        {isProcessing && (
          <Animated.View style={[styles.processingContainer, { opacity: processingFadeAnim }]}>
            {/* Only show spinner and processing message if not completed */}
            {processingStep !== 3 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.processingMessage}>Processing payment...</Text>
              </View>
            )}
            
            {/* Progress Step Bar - Always visible */}
            <View style={styles.stepBarContainer}>
              <StepBar currentStep={Math.max(0, processingStep - 1)} />
            </View>
            
            
            {processingStep === 3 && (
              <Animated.View style={[
                styles.completionIndicator, 
                { 
                  marginTop: 24,
                  opacity: successFadeAnim 
                }
              ]}>
                {(() => {
                  const pm = (processingMessage || '').toLowerCase();
                  const isBad = pm.includes('failed') || pm.includes('timeout');
                  const isSuccess = pm.includes('deposit successful') || pm.includes('transaction has been completed');
                  
                  return (
                    <>
                      <Ionicons 
                        name={isBad ? 'close-circle' : 'checkmark-circle'} 
                        size={isSuccess ? 32 : 20} 
                        color={isBad ? '#ef4444' : '#10b981'} 
                      />
                      <Text style={[
                        styles.completionText, 
                        { 
                          color: isBad ? '#ef4444' : '#10b981',
                          fontSize: isSuccess ? 18 : 16,
                          fontWeight: isSuccess ? '700' : '600'
                        }
                      ]}>
                        {isBad ? 'Failed' : (isSuccess ? 'Deposit Successful!' : 'Completed')}
                      </Text>
                      {isSuccess && (
                        <Text style={styles.successSubtext}>
                          {(() => {
                            const converted = getConvertedAmount();
                            return `${amount} ${selectedCurrency} is now available as ${converted.amount} ${converted.currency}`;
                          })()}
                        </Text>
                      )}
                      {isBad && (
                        <TouchableOpacity
                          style={styles.retryButton}
                          onPress={() => {
                            setIsProcessing(false);
                            setPhase('IDLE');
                            setProcessingStep(0);
                            setProcessingMessage('');
                          }}
                        >
                          <Text style={styles.retryButtonText}>Try Again</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  );
                })()}
              </Animated.View>
            )}
          </Animated.View>
        )}

        {/* Rate Information - Hidden during processing */}
        {!isProcessing && (
          <View style={styles.rateSection}>
            <View style={styles.rateContainer}>
              {(() => {
                const target = selectedCurrency === 'EUR' ? 'EURC' : 'USDC';
                const rate = selectedCurrency === 'EUR'
                  ? (exchangeRates[selectedCurrency]?.EURC ?? 1)
                  : (exchangeRates[selectedCurrency]?.USDC ?? 1);
                return (
                  <Text style={styles.rateText}>
                    Rate {selectedCurrency} → {target} · {Number(rate).toFixed(4)}
                  </Text>
                );
              })()}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[styles.confirmButton, isProcessing && processingStep !== 3 && styles.disabledButton]}
            onPress={handleConfirm}
            activeOpacity={0.8}
            disabled={isProcessing && processingStep !== 3}
          >
            <LinearGradient
              colors={(() => {
                if (processingStep === 3) {
                  return ['#1e40af', '#6366f1']; // Blue gradient for completed (same as normal)
                } else if (isProcessing) {
                  return ['#6b7280', '#9ca3af']; // Gray gradient for processing
                } else {
                  return ['#1e40af', '#6366f1']; // Blue gradient for normal
                }
              })()}
              style={styles.confirmButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.confirmButtonText, isProcessing && processingStep !== 3 && styles.disabledButtonText]}>
                {(() => {
                  if (processingStep === 3) {
                    return 'Done';
                  } else if (isProcessing) {
                    return 'Processing...';
                  } else {
                    return isDeposit ? 'Confirm & Add Money' : 'Confirm & Send Money';
                  }
                })()}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {!isProcessing && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleBack}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>
                Cancel
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  darkContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    backgroundColor: '#000000',
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#000000',
    zIndex: 10,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  processingBackButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)', // Subtle red tint when processing
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
  container: {
    flex: 1,
    paddingTop: 140, // Account for header (top: 60 + paddingVertical: 20 + extra space to clear header)
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 20,
  },
  amountText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    fontFamily: 'Montserrat',
  },
  amountLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Montserrat',
  },
  detailsSection: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 20,
    fontFamily: 'Montserrat',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Montserrat',
  },
  detailValue: {
    fontSize: 14,
    color: '#ffffff',
    fontFamily: 'Montserrat',
    fontWeight: '500',
  },
  detailValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 16,
    marginTop: 8,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Montserrat',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Montserrat',
  },
  rateSection: {
    marginBottom: 32,
  },
  rateContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  rateText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Montserrat',
  },
  buttonSection: {
    gap: 16,
  },
  confirmButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Montserrat',
  },
  cancelButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Montserrat',
  },
  // Processing UI styles
  processingContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  processingMessage: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Montserrat',
  },
  stepBarContainer: {
    marginVertical: 16,
    alignItems: 'center',
  },
  transactionIdText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontFamily: 'Montserrat',
    marginTop: 8,
  },
  completionIndicator: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  completionText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Montserrat',
  },
  successSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Montserrat',
    fontWeight: '400',
    textAlign: 'center',
  },
  conversionMessage: {
    fontSize: 13,
    color: '#10b981',
    fontFamily: 'Montserrat',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  retryButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Montserrat',
  },
  // Disabled button styles
  disabledButton: {
    opacity: 0.6,
  },
  disabledButtonText: {
    opacity: 0.6,
  },
});

export default MobileMoneyConfirmScreen;