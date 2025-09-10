import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import * as Haptics from 'expo-haptics';

const { height: screenHeight } = Dimensions.get('window');

// Currency symbol mapping
const getCurrencySymbol = (currency) => {
  const symbols = {
    'USD': '$',
    'EUR': '€',
    'GHS': '₵',
    'AED': 'د.إ',
    'GBP': '£',
    'JPY': '¥',
    'CAD': 'C$',
    'AUD': 'A$',
    'CHF': 'CHF',
    'CNY': '¥',
    'NGN': '₦',
  };
  return symbols[currency] || '$';
};

const ActionBottomSheet = ({ 
  isVisible, 
  action, 
  onClose, 
  navigation,
  onDepositConfirmed,
  currentCurrency = 'USD'
}) => {
  const [slideAnim] = useState(new Animated.Value(screenHeight));
  const [backdropOpacity] = useState(new Animated.Value(0));

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  const handleClose = () => {
    Haptics.selectionAsync();
    onClose();
  };

  const renderActionContent = () => {
    switch (action?.id) {
      case 'deposit':
        return <DepositContent onDepositConfirmed={onDepositConfirmed} onClose={handleClose} currentCurrency={currentCurrency} />;
      case 'send':
        return <SendContent navigation={navigation} onClose={handleClose} currentCurrency={currentCurrency} />;
      case 'receive':
        return <ReceiveContent navigation={navigation} onClose={handleClose} currentCurrency={currentCurrency} />;
      case 'withdraw':
        return <WithdrawContent navigation={navigation} onClose={handleClose} currentCurrency={currentCurrency} />;
      default:
        return <DefaultContent />;
    }
  };

  const getActionIcon = () => {
    switch (action?.id) {
      case 'deposit':
        return 'add-circle';
      case 'send':
        return 'arrow-up-circle';
      case 'receive':
        return 'arrow-down-circle';
      case 'withdraw':
        return 'remove-circle';
      default:
        return 'help-circle';
    }
  };

  const getActionColor = () => {
    switch (action?.id) {
      case 'deposit':
        return Colors.success;
      case 'send':
        return Colors.primary;
      case 'receive':
        return Colors.accent;
      case 'withdraw':
        return Colors.warning;
      default:
        return Colors.textMuted;
    }
  };

  if (!isVisible) return null;

  return (
    <Modal visible={isVisible} transparent animationType="none">
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View 
          style={[
            styles.backdrop,
            { opacity: backdropOpacity }
          ]}
        >
          <TouchableOpacity 
            style={styles.backdropTouchable} 
            activeOpacity={1} 
            onPress={handleClose}
          />
        </Animated.View>

        {/* Bottom Sheet */}
        <Animated.View 
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <BlurView intensity={20} tint="light" style={styles.blurContainer}>
            {/* Handle */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <View style={[styles.actionIcon, { backgroundColor: getActionColor() + '20' }]}>
                  <Ionicons name={getActionIcon()} size={24} color={getActionColor()} />
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.actionTitle}>
                    {action?.id === 'deposit' ? 'Add Money' : 
                     action?.id === 'send' ? 'Send Money' :
                     action?.id === 'receive' ? 'Receive Money' :
                     action?.id === 'withdraw' ? 'Withdraw Money' :
                     (action?.title || 'Action')}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.closeButton} 
                  onPress={handleClose}
                  accessibilityLabel="Close action sheet"
                >
                                     <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {renderActionContent()}
            </ScrollView>
          </BlurView>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Deposit Content Component
const DepositContent = ({ onDepositConfirmed, onClose, currentCurrency }) => {
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [amount, setAmount] = useState('');
  const [currentStep, setCurrentStep] = useState('input'); // 'input', 'confirmation', 'success'
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({});
  
  // Animation states
  const [fadeAnim] = useState(new Animated.Value(1));
  const [slideAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(1));
  const [rotateAnim] = useState(new Animated.Value(0));
  
  // Initialize animations when component mounts
  useEffect(() => {
    fadeAnim.setValue(1);
    slideAnim.setValue(0);
    scaleAnim.setValue(1);
  }, []);

  // Animate when step changes
  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [currentStep]);

  const depositMethods = [
    { id: 'card', title: 'Credit/Debit Card', icon: 'card-outline', color: Colors.primary },
    { id: 'bank', title: 'Bank Transfer', icon: 'business-outline', color: Colors.success },
    { id: 'mobile', title: 'Mobile Money', icon: 'phone-portrait-outline', color: Colors.accent },
    { id: 'crypto', title: 'Cryptocurrency', icon: 'logo-bitcoin', color: Colors.warning },
  ];

  const handleDeposit = () => {
    Haptics.selectionAsync();
    setCurrentStep('confirmation');
  };

  const handlePaymentMethodSelect = (methodId) => {
    Haptics.selectionAsync();
    setSelectedMethod(methodId);
    setShowPaymentModal(true);
  };

  const handleConfirmDeposit = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Show processing state
    setCurrentStep('processing');
    
    // Start rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
    
    // Simulate deposit processing
    setTimeout(() => {
      setCurrentStep('success');
    }, 1500);
  };

  const handleCancelConfirmation = () => {
    Haptics.selectionAsync();
    setCurrentStep('input');
  };

  const handleSuccessComplete = () => {
    setCurrentStep('input');
    onDepositConfirmed();
    onClose();
  };

  return (
    <View style={styles.depositContent}>
      {currentStep === 'input' && (
        <Animated.View style={[
          styles.stepContainer,
          {
            opacity: fadeAnim
          }
        ]}>
          {/* Amount Input */}
          <View style={styles.amountSection}>
            <Text style={styles.sectionTitle}>Amount</Text>
            <View style={styles.amountInput}>
              <Text style={styles.currencySymbol}>{getCurrencySymbol(currentCurrency)}</Text>
              <TextInput
                style={styles.amountTextInput}
                placeholder="0.00"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                fontSize={28}
                fontWeight="700"
                textAlign="center"
                selectionColor="white"
              />
            </View>
          </View>

          {/* Payment Methods */}
          <View style={styles.methodsSection}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.methodsGrid}>
              {depositMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.methodCard,
                    selectedMethod === method.id && styles.selectedMethodCard
                  ]}
                  onPress={() => handlePaymentMethodSelect(method.id)}
                >
                  <View style={[styles.methodIcon, { backgroundColor: method.color + '20' }]}>
                    <Ionicons name={method.icon} size={20} color={method.color} />
                  </View>
                  <Text style={styles.methodTitle}>{method.title}</Text>
                  {selectedMethod === method.id && (
                    <View style={styles.selectedIndicator}>
                      <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity 
            style={[styles.actionButton, styles.actionButtonGradient]}
            onPress={handleDeposit}
            disabled={!amount || parseFloat(amount) <= 0}
            activeOpacity={0.85}
          >
            <Text style={styles.actionButtonText}>Add {getCurrencySymbol(currentCurrency)}{amount || '0.00'}</Text>
                     </TouchableOpacity>
         </Animated.View>
       )}

             {currentStep === 'confirmation' && (
         <Animated.View style={[
           styles.stepContainer,
           {
             opacity: fadeAnim
           }
         ]}>
           {/* Confirmation Header with Back Button */}
           <View style={styles.confirmationHeader}>
             <TouchableOpacity 
               style={styles.backButton}
               onPress={handleCancelConfirmation}
             >
               <Ionicons name="arrow-back" size={24} color={Colors.textMuted} />
             </TouchableOpacity>
             <Ionicons name="checkmark-circle" size={32} color={Colors.success} />
             <Text style={styles.confirmationTitle}>Confirm Deposit</Text>
           </View>
          
          {/* Confirmation Content */}
          <View style={styles.confirmationContent}>
            <View style={styles.confirmationRow}>
              <Text style={styles.confirmationLabel}>Amount:</Text>
              <Text style={styles.confirmationValue}>
                {getCurrencySymbol(currentCurrency)}{amount || '0.00'}
              </Text>
            </View>
            
            <View style={styles.confirmationRow}>
              <Text style={styles.confirmationLabel}>Payment Method:</Text>
              <Text style={styles.confirmationValue}>
                {depositMethods.find(m => m.id === selectedMethod)?.title}
              </Text>
            </View>
            
            <View style={styles.confirmationRow}>
              <Text style={styles.confirmationLabel}>Processing Fee:</Text>
              <Text style={styles.confirmationValue}>Free</Text>
            </View>
            
            <View style={styles.confirmationRow}>
              <Text style={styles.confirmationLabel}>Estimated Time:</Text>
              <Text style={styles.confirmationValue}>2-5 minutes</Text>
            </View>
          </View>
          
          {/* Confirmation Buttons */}
          <View style={styles.confirmationButtons}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancelConfirmation}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={handleConfirmDeposit}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

             {currentStep === 'processing' && (
         <Animated.View style={[
           styles.stepContainer,
           {
             opacity: fadeAnim
           }
         ]}>
           {/* Processing Header */}
           <View style={styles.processingHeader}>
             <Animated.View style={[styles.processingIcon, { transform: [{ rotate: rotateAnim.interpolate({
               inputRange: [0, 1],
               outputRange: ['0deg', '360deg']
             }) }] }]}>
               <Ionicons name="sync" size={48} color={Colors.primary} />
             </Animated.View>
             <Text style={styles.processingTitle}>Processing Deposit</Text>
             <Text style={styles.processingSubtitle}>Please wait while we process your transaction...</Text>
           </View>
         </Animated.View>
       )}

       {currentStep === 'success' && (
         <Animated.View style={[
           styles.stepContainer,
           {
             opacity: fadeAnim
           }
         ]}>
           {/* Success Header */}
           <View style={styles.successHeader}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
            </View>
            <Text style={styles.successTitle}>Deposit Successful!</Text>
            <Text style={styles.successSubtitle}>
              Your deposit of {getCurrencySymbol(currentCurrency)}{amount || '0.00'} has been processed
            </Text>
          </View>
          
          {/* Success Content */}
          <View style={styles.successContent}>
                                 <View style={styles.successRow}>
                       <Ionicons name="time-outline" size={20} color="rgba(255, 255, 255, 0.6)" />
                       <Text style={styles.successText}>Funds will be available in 2-5 minutes</Text>
                     </View>
                     
                     <View style={styles.successRow}>
                       <Ionicons name="notifications-outline" size={20} color="rgba(255, 255, 255, 0.6)" />
                       <Text style={styles.successText}>You'll receive a confirmation email</Text>
                     </View>
                     
                     <View style={styles.successRow}>
                       <Ionicons name="wallet-outline" size={20} color="rgba(255, 255, 255, 0.6)" />
                       <Text style={styles.successText}>Balance updated automatically</Text>
                     </View>
          </View>
          
          {/* Success Button */}
          <View style={styles.successButtons}>
            <TouchableOpacity 
              style={styles.successButton}
              onPress={handleSuccessComplete}
            >
              <Text style={styles.successButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Payment Method Specific Modal - Keep this separate */}
      {showPaymentModal && (
        <Modal visible={showPaymentModal} transparent animationType="slide">
          <View style={styles.paymentModalOverlay}>
            <View style={styles.paymentModal}>
              <View style={styles.paymentModalHeader}>
                <TouchableOpacity 
                  style={styles.paymentModalClose}
                  onPress={() => setShowPaymentModal(false)}
                >
                  <Ionicons name="close" size={24} color={Colors.textMuted} />
                </TouchableOpacity>
                <Text style={styles.paymentModalTitle}>
                  {selectedMethod === 'card' && 'Card Details'}
                  {selectedMethod === 'bank' && 'Bank Transfer'}
                  {selectedMethod === 'mobile' && 'Mobile Money'}
                  {selectedMethod === 'crypto' && 'Cryptocurrency'}
                </Text>
              </View>

              <ScrollView style={styles.paymentModalContent} showsVerticalScrollIndicator={false}>
                {selectedMethod === 'card' && (
                  <CardPaymentForm 
                    onComplete={(details) => {
                      setPaymentDetails(details);
                      setShowPaymentModal(false);
                    }}
                  />
                )}
                
                {selectedMethod === 'bank' && (
                  <BankTransferForm 
                    onComplete={(details) => {
                      setPaymentDetails(details);
                      setShowPaymentModal(false);
                    }}
                  />
                )}
                
                {selectedMethod === 'mobile' && (
                  <MobileMoneyForm 
                    onComplete={(details) => {
                      setPaymentDetails(details);
                      setShowPaymentModal(false);
                    }}
                  />
                )}
                
                {selectedMethod === 'crypto' && (
                  <CryptoPaymentForm 
                    onComplete={(details) => {
                      setPaymentDetails(details);
                      setShowPaymentModal(false);
                    }}
                  />
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

// Send Content Component
const SendContent = ({ navigation, onClose, currentCurrency = 'USD' }) => {
  const [selectedMethod, setSelectedMethod] = useState('quick');
  const [currentStep, setCurrentStep] = useState('input'); // 'input', 'confirmation', 'processing', 'success'
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  
  // Animation states
  const [fadeAnim] = useState(new Animated.Value(1));
  const [rotateAnim] = useState(new Animated.Value(0));
  
  // Initialize animations when component mounts
  useEffect(() => {
    fadeAnim.setValue(1);
  }, []);

  // Animate when step changes
  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [currentStep]);
  
  const sendMethods = [
    { id: 'quick', title: 'Quick Send', icon: 'flash-outline', color: Colors.primary },
    { id: 'bank', title: 'Bank Transfer', icon: 'business-outline', color: Colors.success },
    { id: 'mobile', title: 'Mobile Money', icon: 'phone-portrait-outline', color: Colors.accent },
    { id: 'international', title: 'International', icon: 'globe-outline', color: Colors.warning },
  ];

  const handleSendMethodSelect = (methodId) => {
    Haptics.selectionAsync();
    setSelectedMethod(methodId);
  };

  const handleSend = () => {
    Haptics.selectionAsync();
    setCurrentStep('confirmation');
  };

  const handleConfirmSend = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Show processing state
    setCurrentStep('processing');
    
    // Start rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
    
    // Simulate send processing
    setTimeout(() => {
      setCurrentStep('success');
    }, 2000);
  };

  const handleCancelConfirmation = () => {
    Haptics.selectionAsync();
    setCurrentStep('input');
  };

  const handleSuccessComplete = () => {
    setCurrentStep('input');
    onClose();
  };

  return (
    <View style={styles.sendContent}>
      {currentStep === 'input' && (
        <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
          {/* Amount Input */}
          <View style={styles.amountSection}>
            <Text style={styles.sectionTitle}>Amount</Text>
            <View style={styles.amountInput}>
              <Text style={styles.currencySymbol}>{getCurrencySymbol(currentCurrency)}</Text>
              <TextInput
                style={styles.amountTextInput}
                placeholder="0.00"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                fontSize={28}
                fontWeight="700"
                textAlign="center"
                selectionColor="white"
              />
            </View>
          </View>



          {/* Send Methods */}
          <View style={styles.methodsSection}>
            <Text style={styles.sectionTitle}>Send Method</Text>
            <View style={styles.methodsGrid}>
              {sendMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.methodCard,
                    selectedMethod === method.id && styles.selectedMethodCard
                  ]}
                  onPress={() => handleSendMethodSelect(method.id)}
                >
                  <View style={[styles.methodIcon, { backgroundColor: method.color + '20' }]}>
                    <Ionicons name={method.icon} size={20} color={method.color} />
                  </View>
                  <Text style={styles.methodTitle}>{method.title}</Text>
                  {selectedMethod === method.id && (
                    <View style={styles.selectedIndicator}>
                      <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity 
            style={[styles.actionButton, styles.actionButtonGradient]}
            onPress={handleSend}
            disabled={!amount || parseFloat(amount) <= 0}
            activeOpacity={0.85}
          >
            <Text style={styles.actionButtonText}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {currentStep === 'confirmation' && (
        <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
          {/* Confirmation Header */}
          <View style={styles.confirmationHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleCancelConfirmation}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.textMuted} />
            </TouchableOpacity>
            <Ionicons name="checkmark-circle" size={32} color={Colors.success} />
            <Text style={styles.confirmationTitle}>Confirm Send</Text>
          </View>
          
          {/* Confirmation Content */}
          <View style={styles.confirmationContent}>
            <View style={styles.confirmationRow}>
              <Text style={styles.confirmationLabel}>Amount:</Text>
              <Text style={styles.confirmationValue}>{getCurrencySymbol(currentCurrency)}{amount || '0.00'}</Text>
            </View>
            
            <View style={styles.confirmationRow}>
              <Text style={styles.confirmationLabel}>Recipient:</Text>
              <Text style={styles.confirmationValue}>Will be selected in next step</Text>
            </View>
            
            <View style={styles.confirmationRow}>
              <Text style={styles.confirmationLabel}>Method:</Text>
              <Text style={styles.confirmationValue}>
                {sendMethods.find(m => m.id === selectedMethod)?.title}
              </Text>
            </View>
            
            <View style={styles.confirmationRow}>
              <Text style={styles.confirmationLabel}>Fee:</Text>
              <Text style={styles.confirmationValue}>Free</Text>
            </View>
            
            <View style={styles.confirmationRow}>
              <Text style={styles.confirmationLabel}>Estimated Time:</Text>
              <Text style={styles.confirmationValue}>Instant</Text>
            </View>
          </View>
          
          {/* Confirmation Buttons */}
          <View style={styles.confirmationButtons}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancelConfirmation}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={handleConfirmSend}
            >
              <Text style={styles.confirmButtonText}>Send Money</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {currentStep === 'processing' && (
        <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
          {/* Processing Header */}
          <View style={styles.processingHeader}>
            <Animated.View style={[styles.processingIcon, { transform: [{ rotate: rotateAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg']
            }) }] }]}>
              <Ionicons name="sync" size={48} color={Colors.primary} />
            </Animated.View>
            <Text style={styles.processingTitle}>Sending Money</Text>
            <Text style={styles.processingSubtitle}>Please wait while we process your transfer...</Text>
          </View>
        </Animated.View>
      )}

      {currentStep === 'success' && (
        <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
          {/* Success Header */}
          <View style={styles.successHeader}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
            </View>
            <Text style={styles.successTitle}>Money Sent!</Text>
            <Text style={styles.successSubtitle}>
              Your transfer of {getCurrencySymbol(currentCurrency)}{amount || '0.00'} has been sent successfully
            </Text>
          </View>
          
          {/* Success Content */}
          <View style={styles.successContent}>
            <View style={styles.successRow}>
              <Ionicons name="time-outline" size={20} color="rgba(255, 255, 255, 0.6)" />
              <Text style={styles.successText}>Transfer completed instantly</Text>
            </View>
            
            <View style={styles.successRow}>
              <Ionicons name="notifications-outline" size={20} color="rgba(255, 255, 255, 0.6)" />
              <Text style={styles.successText}>Recipient will be notified</Text>
            </View>
            
            <View style={styles.successRow}>
              <Ionicons name="receipt-outline" size={20} color="rgba(255, 255, 255, 0.6)" />
              <Text style={styles.successText}>Transaction receipt sent to your email</Text>
            </View>
          </View>
          
          {/* Success Button */}
          <View style={styles.successButtons}>
            <TouchableOpacity 
              style={styles.successButton}
              onPress={handleSuccessComplete}
            >
              <Text style={styles.successButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
 };

// Quick Send Form Component
const QuickSendForm = ({ onComplete }) => {
  const [selectedContact, setSelectedContact] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');

  const recentContacts = [
    { id: '1', name: 'John Doe', phone: '+1234567890', avatar: '👤' },
    { id: '2', name: 'Jane Smith', phone: '+1234567891', avatar: '👤' },
    { id: '3', name: 'Mike Johnson', phone: '+1234567892', avatar: '👤' },
  ];

  const handleSubmit = () => {
    if (selectedContact && amount) {
      onComplete({
        method: 'quick',
        contact: selectedContact,
        amount: parseFloat(amount),
        message,
      });
    }
  };

  return (
    <View style={styles.paymentForm}>
      <Text style={styles.formSectionTitle}>Select Recipient</Text>
      <View style={styles.contactList}>
        {recentContacts.map((contact) => (
          <TouchableOpacity
            key={contact.id}
            style={[
              styles.contactItem,
              selectedContact === contact.id && styles.selectedContactItem
            ]}
            onPress={() => setSelectedContact(contact.id)}
          >
            <Text style={styles.contactAvatar}>{contact.avatar}</Text>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.contactPhone}>{contact.phone}</Text>
            </View>
            {selectedContact === contact.id && (
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.formSectionTitle}>Amount</Text>
      <TextInput
        style={styles.formInput}
        placeholder="0.00"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />

      <Text style={styles.formSectionTitle}>Message (Optional)</Text>
      <TextInput
        style={styles.formInput}
        placeholder="Add a message"
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity
        style={[styles.submitButton, (!selectedContact || !amount) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!selectedContact || !amount}
      >
        <Text style={styles.submitButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

// Bank Send Form Component
const BankSendForm = ({ onComplete }) => {
  const [recipientName, setRecipientName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');

  const handleSubmit = () => {
    if (recipientName && accountNumber && routingNumber && amount) {
      onComplete({
        method: 'bank',
        recipientName,
        accountNumber,
        routingNumber,
        amount: parseFloat(amount),
        bankName,
      });
    }
  };

  return (
    <View style={styles.paymentForm}>
      <Text style={styles.formSectionTitle}>Recipient Information</Text>
      
      <TextInput
        style={styles.formInput}
        placeholder="Recipient Full Name"
        value={recipientName}
        onChangeText={setRecipientName}
        autoCapitalize="words"
      />

      <TextInput
        style={styles.formInput}
        placeholder="Bank Name"
        value={bankName}
        onChangeText={setBankName}
        autoCapitalize="words"
      />

      <TextInput
        style={styles.formInput}
        placeholder="Account Number"
        value={accountNumber}
        onChangeText={setAccountNumber}
        keyboardType="numeric"
        secureTextEntry
      />

      <TextInput
        style={styles.formInput}
        placeholder="Routing Number"
        value={routingNumber}
        onChangeText={setRoutingNumber}
        keyboardType="numeric"
      />

      <Text style={styles.formSectionTitle}>Amount</Text>
      <TextInput
        style={styles.formInput}
        placeholder="0.00"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />

      <TouchableOpacity
        style={[styles.submitButton, (!recipientName || !accountNumber || !routingNumber || !amount) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!recipientName || !accountNumber || !routingNumber || !amount}
      >
        <Text style={styles.submitButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

// Mobile Send Form Component
const MobileSendForm = ({ onComplete }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState('mtn');
  const [recipientName, setRecipientName] = useState('');

  const providers = [
    { id: 'mtn', name: 'MTN Mobile Money', color: '#FFC107' },
    { id: 'vodafone', name: 'Vodafone Cash', color: '#E60000' },
    { id: 'airtel', name: 'Airtel Money', color: '#FF0000' },
  ];

  const handleSubmit = () => {
    if (phoneNumber && amount) {
      onComplete({
        method: 'mobile',
        phoneNumber,
        amount: parseFloat(amount),
        provider,
        recipientName,
      });
    }
  };

  return (
    <View style={styles.paymentForm}>
      <Text style={styles.formSectionTitle}>Mobile Money Provider</Text>
      <View style={styles.providerGrid}>
        {providers.map((prov) => (
          <TouchableOpacity
            key={prov.id}
            style={[styles.providerOption, provider === prov.id && styles.selectedProviderOption]}
            onPress={() => setProvider(prov.id)}
          >
            <Text style={styles.providerName}>{prov.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.formSectionTitle}>Recipient Information</Text>
      <TextInput
        style={styles.formInput}
        placeholder="Recipient Name (Optional)"
        value={recipientName}
        onChangeText={setRecipientName}
        autoCapitalize="words"
      />

      <TextInput
        style={styles.formInput}
        placeholder="Phone Number"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
      />

      <Text style={styles.formSectionTitle}>Amount</Text>
      <TextInput
        style={styles.formInput}
        placeholder="0.00"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />

      <TouchableOpacity
        style={[styles.submitButton, (!phoneNumber || !amount) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!phoneNumber || !amount}
      >
        <Text style={styles.submitButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

// International Send Form Component
const InternationalSendForm = ({ onComplete }) => {
  const [recipientName, setRecipientName] = useState('');
  const [country, setCountry] = useState('');
  const [bankName, setBankName] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');

  const countries = [
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
  ];

  const purposes = [
    'Family Support',
    'Business Payment',
    'Education',
    'Medical',
    'Investment',
    'Other',
  ];

  const handleSubmit = () => {
    if (recipientName && country && bankName && swiftCode && accountNumber && amount) {
      onComplete({
        method: 'international',
        recipientName,
        country,
        bankName,
        swiftCode,
        accountNumber,
        amount: parseFloat(amount),
        purpose,
      });
    }
  };

  return (
    <View style={styles.paymentForm}>
      <Text style={styles.formSectionTitle}>Recipient Information</Text>
      
      <TextInput
        style={styles.formInput}
        placeholder="Recipient Full Name"
        value={recipientName}
        onChangeText={setRecipientName}
        autoCapitalize="words"
      />

      <Text style={styles.formSectionTitle}>Destination Country</Text>
      <View style={styles.countryGrid}>
        {countries.map((c) => (
          <TouchableOpacity
            key={c.code}
            style={[styles.countryOption, country === c.code && styles.selectedCountryOption]}
            onPress={() => setCountry(c.code)}
          >
            <Text style={styles.countryName}>{c.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.formSectionTitle}>Bank Information</Text>
      <TextInput
        style={styles.formInput}
        placeholder="Bank Name"
        value={bankName}
        onChangeText={setBankName}
        autoCapitalize="words"
      />

      <TextInput
        style={styles.formInput}
        placeholder="SWIFT/BIC Code"
        value={swiftCode}
        onChangeText={setSwiftCode}
        autoCapitalize="characters"
      />

      <TextInput
        style={styles.formInput}
        placeholder="Account Number"
        value={accountNumber}
        onChangeText={setAccountNumber}
        keyboardType="numeric"
        secureTextEntry
      />

      <Text style={styles.formSectionTitle}>Transfer Details</Text>
      <TextInput
        style={styles.formInput}
        placeholder="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />

      <Text style={styles.formSectionTitle}>Purpose of Transfer</Text>
      <View style={styles.purposeGrid}>
        {purposes.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.purposeOption, purpose === p && styles.selectedPurposeOption]}
            onPress={() => setPurpose(p)}
          >
            <Text style={styles.purposeText}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.submitButton, (!recipientName || !country || !bankName || !swiftCode || !accountNumber || !amount) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!recipientName || !country || !bankName || !swiftCode || !accountNumber || !amount}
      >
        <Text style={styles.submitButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

// Receive Content Component
const ReceiveContent = ({ navigation, onClose, currentCurrency = 'USD' }) => {
  const [selectedMethod, setSelectedMethod] = useState('qr');
  const [currentStep, setCurrentStep] = useState('input'); // 'input', 'confirmation', 'processing', 'success'
  const [amount, setAmount] = useState('');
  
  // Animation states
  const [fadeAnim] = useState(new Animated.Value(1));
  const [rotateAnim] = useState(new Animated.Value(0));
  
  // Initialize animations when component mounts
  useEffect(() => {
    fadeAnim.setValue(1);
  }, []);

  // Animate when step changes
  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [currentStep]);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receiveDetails, setReceiveDetails] = useState({});
  
  const receiveMethods = [
    { id: 'qr', title: 'QR Code', icon: 'qr-code-outline', color: Colors.primary },
    { id: 'link', title: 'Payment Link', icon: 'link-outline', color: Colors.success },
    { id: 'account', title: 'Account Details', icon: 'card-outline', color: Colors.accent },
  ];

  const handleReceiveMethodSelect = (methodId) => {
    Haptics.selectionAsync();
    setSelectedMethod(methodId);
  };

  const handleReceive = () => {
    Haptics.selectionAsync();
    setCurrentStep('confirmation');
  };

  const handleConfirmReceive = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Show processing state
    setCurrentStep('processing');
    
    // Start rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
    
    // Simulate receive processing
    setTimeout(() => {
      setCurrentStep('success');
    }, 1500);
  };

  const handleCancelConfirmation = () => {
    Haptics.selectionAsync();
    setCurrentStep('input');
  };

  const handleSuccessComplete = () => {
    setCurrentStep('input');
    onClose();
  };

  return (
    <View style={styles.receiveContent}>
      {currentStep === 'input' && (
        <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
          {/* Amount Input */}
          <View style={styles.amountSection}>
            <Text style={styles.sectionTitle}>Expected Amount</Text>
            <View style={styles.amountInput}>
              <Text style={styles.currencySymbol}>{getCurrencySymbol(currentCurrency)}</Text>
              <TextInput
                style={styles.amountTextInput}
                placeholder="0.00"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                fontSize={28}
                fontWeight="700"
                textAlign="center"
                selectionColor="white"
              />
            </View>
          </View>

          {/* Receive Methods */}
          <View style={styles.methodsSection}>
            <Text style={styles.sectionTitle}>Receive Method</Text>
            <View style={styles.methodsGrid}>
              {receiveMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.methodCard,
                    selectedMethod === method.id && styles.selectedMethodCard
                  ]}
                  onPress={() => handleReceiveMethodSelect(method.id)}
                >
                  <View style={[styles.methodIcon, { backgroundColor: method.color + '20' }]}>
                    <Ionicons name={method.icon} size={20} color={method.color} />
                  </View>
                  <Text style={styles.methodTitle}>{method.title}</Text>
                  {selectedMethod === method.id && (
                    <View style={styles.selectedIndicator}>
                      <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity 
            style={[styles.actionButton, styles.actionButtonGradient]}
            onPress={handleReceive}
            disabled={!amount || parseFloat(amount) <= 0}
            activeOpacity={0.85}
          >
            <Text style={styles.actionButtonText}>Generate {receiveMethods.find(m => m.id === selectedMethod)?.title}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {currentStep === 'confirmation' && (
        <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
          {/* Confirmation Header */}
          <View style={styles.confirmationHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleCancelConfirmation}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.textMuted} />
            </TouchableOpacity>
            <Ionicons name="checkmark-circle" size={32} color={Colors.success} />
            <Text style={styles.confirmationTitle}>Confirm Receive</Text>
          </View>
          
          {/* Confirmation Content */}
          <View style={styles.confirmationContent}>
            <View style={styles.confirmationRow}>
              <Text style={styles.confirmationLabel}>Expected Amount:</Text>
              <Text style={styles.confirmationValue}>{getCurrencySymbol(currentCurrency)}{amount || '0.00'}</Text>
            </View>
            
            <View style={styles.confirmationRow}>
              <Text style={styles.confirmationLabel}>Method:</Text>
              <Text style={styles.confirmationValue}>
                {receiveMethods.find(m => m.id === selectedMethod)?.title}
              </Text>
            </View>
            
            <View style={styles.confirmationRow}>
              <Text style={styles.confirmationLabel}>Fee:</Text>
              <Text style={styles.confirmationValue}>Free</Text>
            </View>
            
            <View style={styles.confirmationRow}>
              <Text style={styles.confirmationLabel}>Expires:</Text>
              <Text style={styles.confirmationValue}>24 hours</Text>
            </View>
          </View>
          
          {/* Confirmation Buttons */}
          <View style={styles.confirmationButtons}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancelConfirmation}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={handleConfirmReceive}
            >
              <Text style={styles.confirmButtonText}>Generate</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {currentStep === 'processing' && (
        <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
          {/* Processing Header */}
          <View style={styles.processingHeader}>
            <Animated.View style={[styles.processingIcon, { transform: [{ rotate: rotateAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg']
            }) }] }]}>
              <Ionicons name="sync" size={48} color={Colors.primary} />
            </Animated.View>
            <Text style={styles.processingTitle}>Generating Receive Method</Text>
            <Text style={styles.processingSubtitle}>Please wait while we create your receive link...</Text>
          </View>
        </Animated.View>
      )}

      {currentStep === 'success' && (
        <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
          {/* Success Header */}
          <View style={styles.successHeader}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
            </View>
            <Text style={styles.successTitle}>Receive Method Ready!</Text>
            <Text style={styles.successSubtitle}>
              Your {receiveMethods.find(m => m.id === selectedMethod)?.title.toLowerCase()} is ready to receive {getCurrencySymbol(currentCurrency)}{amount || '0.00'}
            </Text>
          </View>
          
          {/* Success Content */}
          <View style={styles.successContent}>
            <View style={styles.successRow}>
              <Ionicons name="time-outline" size={20} color="rgba(255, 255, 255, 0.6)" />
              <Text style={styles.successText}>Valid for 24 hours</Text>
            </View>
            
            <View style={styles.successRow}>
              <Ionicons name="share-outline" size={20} color="rgba(255, 255, 255, 0.6)" />
              <Text style={styles.successText}>Share with anyone to receive money</Text>
            </View>
            
            <View style={styles.successRow}>
              <Ionicons name="notifications-outline" size={20} color="rgba(255, 255, 255, 0.6)" />
              <Text style={styles.successText}>You'll be notified when payment arrives</Text>
            </View>
          </View>
          
          {/* Success Button */}
          <View style={styles.successButtons}>
            <TouchableOpacity 
              style={styles.successButton}
              onPress={handleSuccessComplete}
            >
              <Text style={styles.successButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

// Withdraw Content Component
const WithdrawContent = ({ navigation, onClose, currentCurrency = 'USD' }) => {
  const [selectedMethod, setSelectedMethod] = useState('bank');
  const [currentStep, setCurrentStep] = useState('input'); // 'input', 'confirmation', 'processing', 'success'
  const [amount, setAmount] = useState('');
  
  // Animation states
  const [fadeAnim] = useState(new Animated.Value(1));
  const [rotateAnim] = useState(new Animated.Value(0));
  
  // Initialize animations when component mounts
  useEffect(() => {
    fadeAnim.setValue(1);
  }, []);

  // Animate when step changes
  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [currentStep]);
  
  const withdrawMethods = [
    { id: 'bank', title: 'Bank Account', icon: 'business-outline', color: Colors.primary },
    { id: 'mobile', title: 'Mobile Money', icon: 'phone-portrait-outline', color: Colors.success },
    { id: 'atm', title: 'ATM Withdrawal', icon: 'card-outline', color: Colors.accent },
    { id: 'crypto', title: 'Cryptocurrency', icon: 'logo-bitcoin', color: Colors.warning },
  ];

  const handleWithdrawMethodSelect = (methodId) => {
    Haptics.selectionAsync();
    setSelectedMethod(methodId);
  };

  const handleWithdraw = () => {
    Haptics.selectionAsync();
    setCurrentStep('confirmation');
  };

  const handleConfirmWithdraw = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Show processing state
    setCurrentStep('processing');
    
    // Start rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
    
    // Simulate withdraw processing
    setTimeout(() => {
      setCurrentStep('success');
    }, 2500);
  };

  const handleCancelConfirmation = () => {
    Haptics.selectionAsync();
    setCurrentStep('input');
  };

  const handleSuccessComplete = () => {
    setCurrentStep('input');
    onClose();
  };

  return (
    <View style={styles.withdrawContent}>
      {currentStep === 'input' && (
        <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
          {/* Amount Input */}
          <View style={styles.amountSection}>
            <Text style={styles.sectionTitle}>Withdraw Amount</Text>
            <View style={styles.amountInput}>
              <Text style={styles.currencySymbol}>{getCurrencySymbol(currentCurrency)}</Text>
              <TextInput
                style={styles.amountTextInput}
                placeholder="0.00"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                fontSize={28}
                fontWeight="700"
                textAlign="center"
                selectionColor="white"
              />
            </View>
          </View>



          {/* Withdraw Methods */}
          <View style={styles.methodsSection}>
            <Text style={styles.sectionTitle}>Withdraw Method</Text>
            <View style={styles.methodsGrid}>
              {withdrawMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.methodCard,
                    selectedMethod === method.id && styles.selectedMethodCard
                  ]}
                  onPress={() => handleWithdrawMethodSelect(method.id)}
                >
                  <View style={[styles.methodIcon, { backgroundColor: method.color + '20' }]}>
                    <Ionicons name={method.icon} size={20} color={method.color} />
                  </View>
                  <Text style={styles.methodTitle}>{method.title}</Text>
                  {selectedMethod === method.id && (
                    <View style={styles.selectedIndicator}>
                      <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity 
            style={[styles.actionButton, styles.actionButtonGradient]}
            onPress={handleWithdraw}
            disabled={!amount || parseFloat(amount) <= 0}
            activeOpacity={0.85}
          >
            <Text style={styles.actionButtonText}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {currentStep === 'confirmation' && (
        <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
          {/* Confirmation Header */}
          <View style={styles.confirmationHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleCancelConfirmation}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.textMuted} />
            </TouchableOpacity>
            <Ionicons name="checkmark-circle" size={32} color={Colors.success} />
            <Text style={styles.confirmationTitle}>Confirm Withdrawal</Text>
          </View>
          
          {/* Confirmation Content */}
          <View style={styles.confirmationContent}>
            <View style={styles.confirmationRow}>
              <Text style={styles.confirmationLabel}>Amount:</Text>
              <Text style={styles.confirmationValue}>{getCurrencySymbol(currentCurrency)}{amount || '0.00'}</Text>
            </View>
            
            <View style={styles.confirmationRow}>
              <Text style={styles.confirmationLabel}>Account:</Text>
              <Text style={styles.confirmationValue}>Will be selected in next step</Text>
            </View>
            
            <View style={styles.confirmationRow}>
              <Text style={styles.confirmationLabel}>Method:</Text>
              <Text style={styles.confirmationValue}>
                {withdrawMethods.find(m => m.id === selectedMethod)?.title}
              </Text>
            </View>
            
            <View style={styles.confirmationRow}>
              <Text style={styles.confirmationLabel}>Fee:</Text>
              <Text style={styles.confirmationValue}>$2.50</Text>
            </View>
            
            <View style={styles.confirmationRow}>
              <Text style={styles.confirmationLabel}>Estimated Time:</Text>
              <Text style={styles.confirmationValue}>1-3 business days</Text>
            </View>
          </View>
          
          {/* Confirmation Buttons */}
          <View style={styles.confirmationButtons}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancelConfirmation}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={handleConfirmWithdraw}
            >
              <Text style={styles.confirmButtonText}>Withdraw Money</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {currentStep === 'processing' && (
        <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
          {/* Processing Header */}
          <View style={styles.processingHeader}>
            <Animated.View style={[styles.processingIcon, { transform: [{ rotate: rotateAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg']
            }) }] }]}>
              <Ionicons name="sync" size={48} color={Colors.primary} />
            </Animated.View>
            <Text style={styles.processingTitle}>Processing Withdrawal</Text>
            <Text style={styles.processingSubtitle}>Please wait while we process your withdrawal request...</Text>
          </View>
        </Animated.View>
      )}

      {currentStep === 'success' && (
        <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
          {/* Success Header */}
          <View style={styles.successHeader}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
            </View>
            <Text style={styles.successTitle}>Withdrawal Requested!</Text>
            <Text style={styles.successSubtitle}>
              Your withdrawal of {getCurrencySymbol(currentCurrency)}{amount || '0.00'} has been submitted
            </Text>
          </View>
          
          {/* Success Content */}
          <View style={styles.successContent}>
            <View style={styles.successRow}>
              <Ionicons name="time-outline" size={20} color="rgba(255, 255, 255, 0.6)" />
              <Text style={styles.successText}>Funds will arrive in 1-3 business days</Text>
            </View>
            
            <View style={styles.successRow}>
              <Ionicons name="notifications-outline" size={20} color="rgba(255, 255, 255, 0.6)" />
              <Text style={styles.successText}>You'll receive email confirmation</Text>
            </View>
            
            <View style={styles.successRow}>
              <Ionicons name="receipt-outline" size={20} color="rgba(255, 255, 255, 0.6)" />
              <Text style={styles.successText}>Transaction receipt sent to your email</Text>
            </View>
          </View>
          
          {/* Success Button */}
          <View style={styles.successButtons}>
            <TouchableOpacity 
              style={styles.successButton}
              onPress={handleSuccessComplete}
            >
              <Text style={styles.successButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

// Crypto Payment Form Component
const CryptoPaymentForm = ({ onComplete, currentCurrency }) => {
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [walletAddress, setWalletAddress] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState(null);

  const cryptoOptions = [
    { id: 'BTC', name: 'Bitcoin', symbol: '₿', color: '#F7931A' },
    { id: 'ETH', name: 'Ethereum', symbol: 'Ξ', color: '#627EEA' },
    { id: 'USDT', name: 'Tether', symbol: '₮', color: '#26A17B' },
    { id: 'USDC', name: 'USD Coin', symbol: '₮', color: '#2775CA' },
  ];

  // Simulate API call for exchange rate
  useEffect(() => {
    // In real app, this would call CoinGecko API
    const rates = {
      'BTC': 45000,
      'ETH': 3200,
      'USDT': 1,
      'USDC': 1,
    };
    setExchangeRate(rates[selectedCrypto]);
  }, [selectedCrypto]);

  const handleSubmit = () => {
    if (walletAddress && cryptoAmount) {
      onComplete({
        method: 'crypto',
        crypto: selectedCrypto,
        address: walletAddress,
        amount: cryptoAmount,
        exchangeRate: exchangeRate,
      });
    }
  };

  return (
    <View style={styles.paymentForm}>
      <Text style={styles.formSectionTitle}>Select Cryptocurrency</Text>
      <View style={styles.cryptoGrid}>
        {cryptoOptions.map((crypto) => (
          <TouchableOpacity
            key={crypto.id}
            style={[
              styles.cryptoOption,
              selectedCrypto === crypto.id && styles.selectedCryptoOption
            ]}
            onPress={() => setSelectedCrypto(crypto.id)}
          >
            <Text style={[styles.cryptoSymbol, { color: crypto.color }]}>{crypto.symbol}</Text>
            <Text style={styles.cryptoName}>{crypto.name}</Text>
            {exchangeRate && (
              <Text style={styles.exchangeRate}>1 {crypto.id} = ${exchangeRate.toLocaleString()}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.formSectionTitle}>Wallet Address</Text>
      <TextInput
        style={styles.formInput}
        placeholder="Enter your wallet address"
        value={walletAddress}
        onChangeText={setWalletAddress}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={styles.formSectionTitle}>Amount in {selectedCrypto}</Text>
      <TextInput
        style={styles.formInput}
        placeholder={`0.00 ${selectedCrypto}`}
        value={cryptoAmount}
        onChangeText={setCryptoAmount}
        keyboardType="numeric"
      />

      {cryptoAmount && exchangeRate && (
        <View style={styles.amountPreview}>
          <Text style={styles.amountPreviewText}>
            ≈ ${(parseFloat(cryptoAmount) * exchangeRate).toFixed(2)} {currentCurrency}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.submitButton, (!walletAddress || !cryptoAmount) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!walletAddress || !cryptoAmount}
      >
        <Text style={styles.submitButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

// Card Payment Form Component
const CardPaymentForm = ({ onComplete }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');

  const handleSubmit = () => {
    if (cardNumber && expiryDate && cvv && cardholderName) {
      onComplete({
        method: 'card',
        cardNumber: cardNumber.replace(/\s/g, ''),
        expiryDate,
        cvv,
        cardholderName,
      });
    }
  };

  return (
    <View style={styles.paymentForm}>
      <Text style={styles.formSectionTitle}>Card Information</Text>
      
      <TextInput
        style={styles.formInput}
        placeholder="Card Number"
        value={cardNumber}
        onChangeText={(text) => setCardNumber(text.replace(/(\d{4})/g, '$1 ').trim())}
        keyboardType="numeric"
        maxLength={19}
      />

      <View style={styles.formRow}>
        <TextInput
          style={[styles.formInput, styles.formInputHalf]}
          placeholder="MM/YY"
          value={expiryDate}
          onChangeText={(text) => setExpiryDate(text.replace(/(\d{2})(\d{2})/, '$1/$2'))}
          keyboardType="numeric"
          maxLength={5}
        />
        <TextInput
          style={[styles.formInput, styles.formInputHalf]}
          placeholder="CVV"
          value={cvv}
          onChangeText={setCvv}
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
        />
      </View>

      <TextInput
        style={styles.formInput}
        placeholder="Cardholder Name"
        value={cardholderName}
        onChangeText={setCardholderName}
        autoCapitalize="words"
      />

      <TouchableOpacity
        style={[styles.submitButton, (!cardNumber || !expiryDate || !cvv || !cardholderName) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!cardNumber || !expiryDate || !cvv || !cardholderName}
      >
        <Text style={styles.submitButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

// Bank Transfer Form Component
const BankTransferForm = ({ onComplete }) => {
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountType, setAccountType] = useState('checking');

  const handleSubmit = () => {
    if (accountNumber && routingNumber) {
      onComplete({
        method: 'bank',
        accountNumber,
        routingNumber,
        accountType,
      });
    }
  };

  return (
    <View style={styles.paymentForm}>
      <Text style={styles.formSectionTitle}>Bank Account Details</Text>
      
      <TextInput
        style={styles.formInput}
        placeholder="Account Number"
        value={accountNumber}
        onChangeText={setAccountNumber}
        keyboardType="numeric"
        secureTextEntry
      />

      <TextInput
        style={styles.formInput}
        placeholder="Routing Number"
        value={routingNumber}
        onChangeText={setRoutingNumber}
        keyboardType="numeric"
      />

      <Text style={styles.formSectionTitle}>Account Type</Text>
      <View style={styles.accountTypeContainer}>
        <TouchableOpacity
          style={[styles.accountTypeOption, accountType === 'checking' && styles.selectedAccountType]}
          onPress={() => setAccountType('checking')}
        >
          <Text style={styles.accountTypeText}>Checking</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.accountTypeOption, accountType === 'savings' && styles.selectedAccountType]}
          onPress={() => setAccountType('savings')}
        >
          <Text style={styles.accountTypeText}>Savings</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.submitButton, (!accountNumber || !routingNumber) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!accountNumber || !routingNumber}
      >
        <Text style={styles.submitButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

// Mobile Money Form Component
const MobileMoneyForm = ({ onComplete }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [provider, setProvider] = useState('mtn');

  const providers = [
    { id: 'mtn', name: 'MTN Mobile Money', color: '#FFC107' },
    { id: 'vodafone', name: 'Vodafone Cash', color: '#E60000' },
    { id: 'airtel', name: 'Airtel Money', color: '#FF0000' },
  ];

  const handleSubmit = () => {
    if (phoneNumber) {
      onComplete({
        method: 'mobile',
        phoneNumber,
        provider,
      });
    }
  };

  return (
    <View style={styles.paymentForm}>
      <Text style={styles.formSectionTitle}>Mobile Money Provider</Text>
      <View style={styles.providerGrid}>
        {providers.map((prov) => (
          <TouchableOpacity
            key={prov.id}
            style={[styles.providerOption, provider === prov.id && styles.selectedProviderOption]}
            onPress={() => setProvider(prov.id)}
          >
            <Text style={styles.providerName}>{prov.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.formSectionTitle}>Phone Number</Text>
      <TextInput
        style={styles.formInput}
        placeholder="Enter phone number"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
      />

      <TouchableOpacity
        style={[styles.submitButton, !phoneNumber && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!phoneNumber}
      >
        <Text style={styles.submitButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

// QR Receive Form Component
const QRReceiveForm = ({ onComplete }) => {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [qrCode, setQrCode] = useState('');

  // Simulate QR code generation
  useEffect(() => {
    if (amount) {
      // In real app, this would generate a QR code with payment details
      setQrCode('QR_CODE_DATA_' + Date.now());
    }
  }, [amount]);

  const handleSubmit = () => {
    if (amount) {
      onComplete({
        method: 'qr',
        amount: parseFloat(amount),
        message,
        qrCode,
      });
    }
  };

  return (
    <View style={styles.paymentForm}>
      <Text style={styles.formSectionTitle}>Amount to Receive</Text>
      <TextInput
        style={styles.formInput}
        placeholder="0.00"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />

      <Text style={styles.formSectionTitle}>Message (Optional)</Text>
      <TextInput
        style={styles.formInput}
        placeholder="Add a message"
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={3}
      />

      {qrCode && (
        <View style={styles.qrContainer}>
          <Text style={styles.formSectionTitle}>Your QR Code</Text>
          <View style={styles.qrCodeBox}>
            <Text style={styles.qrCodeText}>📱</Text>
            <Text style={styles.qrCodeLabel}>Scan to pay</Text>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.submitButton, !amount && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!amount}
      >
        <Text style={styles.submitButtonText}>Generate QR Code</Text>
      </TouchableOpacity>
    </View>
  );
};

// Link Receive Form Component
const LinkReceiveForm = ({ onComplete }) => {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [paymentLink, setPaymentLink] = useState('');

  // Simulate payment link generation
  useEffect(() => {
    if (amount) {
      // In real app, this would generate a payment link
      setPaymentLink(`https://pay.sendnreceive.com/${Date.now()}`);
    }
  }, [amount]);

  const handleSubmit = () => {
    if (amount) {
      onComplete({
        method: 'link',
        amount: parseFloat(amount),
        message,
        paymentLink,
      });
    }
  };

  return (
    <View style={styles.paymentForm}>
      <Text style={styles.formSectionTitle}>Amount to Receive</Text>
      <TextInput
        style={styles.formInput}
        placeholder="0.00"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />

      <Text style={styles.formSectionTitle}>Message (Optional)</Text>
      <TextInput
        style={styles.formInput}
        placeholder="Add a message"
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={3}
      />

      {paymentLink && (
        <View style={styles.linkContainer}>
          <Text style={styles.formSectionTitle}>Payment Link</Text>
          <View style={styles.linkBox}>
            <Text style={styles.linkText}>{paymentLink}</Text>
            <TouchableOpacity style={styles.copyButton}>
              <Ionicons name="copy-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.submitButton, !amount && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!amount}
      >
        <Text style={styles.submitButtonText}>Generate Link</Text>
      </TouchableOpacity>
    </View>
  );
};

// Account Receive Form Component
const AccountReceiveForm = ({ onComplete }) => {
  const [accountDetails, setAccountDetails] = useState({
    accountNumber: '1234567890',
    routingNumber: '021000021',
    accountName: 'John Doe',
    bankName: 'Chase Bank',
  });

  const handleSubmit = () => {
    onComplete({
      method: 'account',
      accountDetails,
    });
  };

  return (
    <View style={styles.paymentForm}>
      <Text style={styles.formSectionTitle}>Your Account Details</Text>
      
      <View style={styles.accountDetailItem}>
        <Text style={styles.accountDetailLabel}>Account Number</Text>
        <Text style={styles.accountDetailValue}>{accountDetails.accountNumber}</Text>
      </View>

      <View style={styles.accountDetailItem}>
        <Text style={styles.accountDetailLabel}>Routing Number</Text>
        <Text style={styles.accountDetailValue}>{accountDetails.routingNumber}</Text>
      </View>

      <View style={styles.accountDetailItem}>
        <Text style={styles.accountDetailLabel}>Account Name</Text>
        <Text style={styles.accountDetailValue}>{accountDetails.accountName}</Text>
      </View>

      <View style={styles.accountDetailItem}>
        <Text style={styles.accountDetailLabel}>Bank Name</Text>
        <Text style={styles.accountDetailValue}>{accountDetails.bankName}</Text>
      </View>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
      >
        <Text style={styles.submitButtonText}>Share Details</Text>
      </TouchableOpacity>
    </View>
  );
};

// Bank Withdraw Form Component
const BankWithdrawForm = ({ onComplete }) => {
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');

  const handleSubmit = () => {
    if (accountNumber && routingNumber && amount) {
      onComplete({
        method: 'bank',
        accountNumber,
        routingNumber,
        amount: parseFloat(amount),
        bankName,
      });
    }
  };

  return (
    <View style={styles.paymentForm}>
      <Text style={styles.formSectionTitle}>Bank Account Details</Text>
      
      <TextInput
        style={styles.formInput}
        placeholder="Bank Name"
        value={bankName}
        onChangeText={setBankName}
        autoCapitalize="words"
      />

      <TextInput
        style={styles.formInput}
        placeholder="Account Number"
        value={accountNumber}
        onChangeText={setAccountNumber}
        keyboardType="numeric"
        secureTextEntry
      />

      <TextInput
        style={styles.formInput}
        placeholder="Routing Number"
        value={routingNumber}
        onChangeText={setRoutingNumber}
        keyboardType="numeric"
      />

      <Text style={styles.formSectionTitle}>Withdrawal Amount</Text>
      <TextInput
        style={styles.formInput}
        placeholder="0.00"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />

      <TouchableOpacity
        style={[styles.submitButton, (!accountNumber || !routingNumber || !amount) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!accountNumber || !routingNumber || !amount}
      >
        <Text style={styles.submitButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

// Mobile Withdraw Form Component
const MobileWithdrawForm = ({ onComplete }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState('mtn');

  const providers = [
    { id: 'mtn', name: 'MTN Mobile Money', color: '#FFC107' },
    { id: 'vodafone', name: 'Vodafone Cash', color: '#E60000' },
    { id: 'airtel', name: 'Airtel Money', color: '#FF0000' },
  ];

  const handleSubmit = () => {
    if (phoneNumber && amount) {
      onComplete({
        method: 'mobile',
        phoneNumber,
        amount: parseFloat(amount),
        provider,
      });
    }
  };

  return (
    <View style={styles.paymentForm}>
      <Text style={styles.formSectionTitle}>Mobile Money Provider</Text>
      <View style={styles.providerGrid}>
        {providers.map((prov) => (
          <TouchableOpacity
            key={prov.id}
            style={[styles.providerOption, provider === prov.id && styles.selectedProviderOption]}
            onPress={() => setProvider(prov.id)}
          >
            <Text style={styles.providerName}>{prov.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.formSectionTitle}>Phone Number</Text>
      <TextInput
        style={styles.formInput}
        placeholder="Enter phone number"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
      />

      <Text style={styles.formSectionTitle}>Withdrawal Amount</Text>
      <TextInput
        style={styles.formInput}
        placeholder="0.00"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />

      <TouchableOpacity
        style={[styles.submitButton, (!phoneNumber || !amount) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!phoneNumber || !amount}
      >
        <Text style={styles.submitButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

// ATM Withdraw Form Component
const ATMWithdrawForm = ({ onComplete }) => {
  const [amount, setAmount] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [pin, setPin] = useState('');

  const handleSubmit = () => {
    if (amount && cardNumber && pin) {
      onComplete({
        method: 'atm',
        amount: parseFloat(amount),
        cardNumber: cardNumber.replace(/\s/g, ''),
        pin,
      });
    }
  };

  return (
    <View style={styles.paymentForm}>
      <Text style={styles.formSectionTitle}>ATM Withdrawal</Text>
      
      <TextInput
        style={styles.formInput}
        placeholder="Card Number"
        value={cardNumber}
        onChangeText={(text) => setCardNumber(text.replace(/(\d{4})/g, '$1 ').trim())}
        keyboardType="numeric"
        maxLength={19}
      />

      <TextInput
        style={styles.formInput}
        placeholder="PIN"
        value={pin}
        onChangeText={setPin}
        keyboardType="numeric"
        maxLength={4}
        secureTextEntry
      />

      <Text style={styles.formSectionTitle}>Withdrawal Amount</Text>
      <TextInput
        style={styles.formInput}
        placeholder="0.00"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />

      <TouchableOpacity
        style={[styles.submitButton, (!cardNumber || !pin || !amount) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!cardNumber || !pin || !amount}
      >
        <Text style={styles.submitButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

// Crypto Withdraw Form Component
const CryptoWithdrawForm = ({ onComplete }) => {
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [walletAddress, setWalletAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState(null);

  const cryptoOptions = [
    { id: 'BTC', name: 'Bitcoin', symbol: '₿', color: '#F7931A' },
    { id: 'ETH', name: 'Ethereum', symbol: 'Ξ', color: '#627EEA' },
    { id: 'USDT', name: 'Tether', symbol: '₮', color: '#26A17B' },
    { id: 'USDC', name: 'USD Coin', symbol: '₮', color: '#2775CA' },
  ];

  // Simulate API call for exchange rate
  useEffect(() => {
    const rates = {
      'BTC': 45000,
      'ETH': 3200,
      'USDT': 1,
      'USDC': 1,
    };
    setExchangeRate(rates[selectedCrypto]);
  }, [selectedCrypto]);

  const handleSubmit = () => {
    if (walletAddress && amount) {
      onComplete({
        method: 'crypto',
        crypto: selectedCrypto,
        address: walletAddress,
        amount: parseFloat(amount),
        exchangeRate: exchangeRate,
      });
    }
  };

  return (
    <View style={styles.paymentForm}>
      <Text style={styles.formSectionTitle}>Select Cryptocurrency</Text>
      <View style={styles.cryptoGrid}>
        {cryptoOptions.map((crypto) => (
          <TouchableOpacity
            key={crypto.id}
            style={[
              styles.cryptoOption,
              selectedCrypto === crypto.id && styles.selectedCryptoOption
            ]}
            onPress={() => setSelectedCrypto(crypto.id)}
          >
            <Text style={[styles.cryptoSymbol, { color: crypto.color }]}>{crypto.symbol}</Text>
            <Text style={styles.cryptoName}>{crypto.name}</Text>
            {exchangeRate && (
              <Text style={styles.exchangeRate}>1 {crypto.id} = ${exchangeRate.toLocaleString()}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.formSectionTitle}>Wallet Address</Text>
      <TextInput
        style={styles.formInput}
        placeholder="Enter your wallet address"
        value={walletAddress}
        onChangeText={setWalletAddress}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={styles.formSectionTitle}>Amount in {selectedCrypto}</Text>
      <TextInput
        style={styles.formInput}
        placeholder={`0.00 ${selectedCrypto}`}
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />

      {amount && exchangeRate && (
        <View style={styles.amountPreview}>
          <Text style={styles.amountPreviewText}>
            ≈ ${(parseFloat(amount) * exchangeRate).toFixed(2)} USD
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.submitButton, (!walletAddress || !amount) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!walletAddress || !amount}
      >
        <Text style={styles.submitButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

// Default Content Component
const DefaultContent = () => (
  <View style={styles.defaultContent}>
    <Ionicons name="help-circle-outline" size={48} color={Colors.textMuted} />
    <Text style={styles.defaultText}>Select an action to get started</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropTouchable: {
    flex: 1,
  },
  bottomSheet: {
    height: screenHeight * 0.65, // Consistent 65% height for all actions
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  blurContainer: {
    flex: 1,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  actionTitle: {
    ...Typography.h3,
    color: 'white',
    fontWeight: '700',
    textAlign: 'center',
  },
  actionSubtitle: {
    ...Typography.bodyMedium,
    color: 'white',
    marginTop: 2,
    textAlign: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  // Deposit Content Styles
  depositContent: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
  },
  processingHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 40,
  },
  processingIcon: {
    marginBottom: 24,
  },
  processingTitle: {
    ...Typography.h2,
    color: 'white',
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  processingSubtitle: {
    ...Typography.bodyMedium,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  amountSection: {
    marginBottom: 20,
  },
  recipientSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    ...Typography.h4,
    color: 'white',
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  currencySymbol: {
    ...Typography.h2,
    color: 'white',
    fontWeight: '700',
    marginRight: 12,
    fontSize: 28,
  },
  amountTextInput: {
    flex: 1,
    ...Typography.h2,
    color: 'white',
    fontWeight: '700',
    fontSize: 28,
    textAlign: 'center',
  },
  methodsSection: {
    marginBottom: 20,
  },
  methodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  methodCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedMethodCard: {
    borderColor: Colors.success,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  methodTitle: {
    ...Typography.bodyMedium,
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  methodSubtitle: {
    ...Typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  actionButton: {
    marginTop: 20,
    marginBottom: 16,
    alignSelf: 'stretch',
  },
  actionButtonGradient: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
  },
  actionButtonText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#fff',
    letterSpacing: 0.5,
  },
  // Send/Receive/Withdraw Content Styles
  sendContent: {
    flex: 1,
  },
  receiveContent: {
    flex: 1,
  },
  withdrawContent: {
    flex: 1,
  },
  optionsGrid: {
    gap: 16,
  },
  optionCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  optionSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  // Default Content Styles
  defaultContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultText: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  // Confirmation Modal Styles
  confirmationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmationModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  confirmationHeader: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  confirmationTitle: {
    ...Typography.h3,
    color: 'white',
    fontWeight: '700',
    marginTop: 8,
  },
  confirmationContent: {
    marginBottom: 24,
  },
  confirmationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  confirmationLabel: {
    ...Typography.bodyMedium,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  confirmationValue: {
    ...Typography.bodyMedium,
    color: 'white',
    fontWeight: '600',
  },
  confirmationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    ...Typography.button,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButtonText: {
    ...Typography.button,
    color: 'white',
    fontWeight: '600',
  },
  // Success State Styles
  successHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successTitle: {
    ...Typography.h2,
    color: Colors.success,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    ...Typography.bodyMedium,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  successContent: {
    marginBottom: 24,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  successText: {
    ...Typography.bodyMedium,
    color: 'rgba(255, 255, 255, 0.8)',
    flex: 1,
    textAlign: 'center',
  },
  successButtons: {
    alignItems: 'center',
  },
  successButton: {
    backgroundColor: Colors.success,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    minWidth: 120,
  },
  successButtonText: {
    ...Typography.button,
    color: 'white',
    fontWeight: '600',
  },
  // Payment Modal Styles
  paymentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '95%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  paymentModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  paymentModalClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentModalTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: '700',
    flex: 1,
  },
  paymentModalContent: {
    padding: 20,
  },
  // Payment Form Styles
  paymentForm: {
    flex: 1,
  },
  formSectionTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 16,
  },
  formInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 16,
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formInputHalf: {
    flex: 1,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.textMuted,
    opacity: 0.6,
  },
  submitButtonText: {
    ...Typography.button,
    color: 'white',
    fontWeight: '600',
  },
  // Crypto Form Styles
  cryptoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  cryptoOption: {
    width: '48%',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedCryptoOption: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  cryptoSymbol: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  cryptoName: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
  },
  exchangeRate: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  amountPreview: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  amountPreviewText: {
    ...Typography.bodyMedium,
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Bank Form Styles
  accountTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  accountTypeOption: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedAccountType: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  accountTypeText: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  // Mobile Money Form Styles
  providerGrid: {
    gap: 12,
    marginBottom: 16,
  },
  providerOption: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedProviderOption: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  providerName: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  // Send Form Styles
  contactList: {
    gap: 12,
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedContactItem: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  contactAvatar: {
    fontSize: 24,
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  contactPhone: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  countryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  countryOption: {
    width: '48%',
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedCountryOption: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  countryName: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontWeight: '500',
    textAlign: 'center',
  },
  purposeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  purposeOption: {
    width: '48%',
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedPurposeOption: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  purposeText: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Receive Form Styles
  qrContainer: {
    marginBottom: 16,
  },
  qrCodeBox: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  qrCodeText: {
    fontSize: 48,
    marginBottom: 8,
  },
  qrCodeLabel: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  linkContainer: {
    marginBottom: 16,
  },
  linkBox: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  linkText: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    flex: 1,
  },
  copyButton: {
    padding: 8,
  },
  accountDetailItem: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  accountDetailLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  accountDetailValue: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
});

export default ActionBottomSheet;




