import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  StyleSheet,
  Dimensions,
  Platform,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import * as Haptics from 'expo-haptics';
import DepositScreen from '../screens/DepositScreen';

const { width, height } = Dimensions.get('window');

const ActionBottomSheet = ({ 
  isVisible, 
  action, 
  onClose, 
  navigation,
  onDepositConfirmed,
  currentCurrency = 'USD'
}) => {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // TEMPORARILY DISABLED: Animation to prevent freezing
  useEffect(() => {
    if (isVisible) {
      // Disable animation temporarily to prevent freezing
      slideAnim.setValue(0);
      fadeAnim.setValue(1);
    } else {
      slideAnim.setValue(height);
      fadeAnim.setValue(0);
    }
  }, [isVisible, slideAnim, fadeAnim]);

  const handleClose = () => {
    Haptics.selectionAsync();
    onClose();
  };

  const handleDeposit = () => {
    setShowDepositModal(true);
  };

  const getActionIcon = () => {
    switch (action?.id) {
      case 'send':
        return 'send-outline';
      case 'receive':
        return 'download-outline';
      case 'withdraw':
        return 'cash-outline';
      case 'convert':
        return 'swap-horizontal-outline';
      default:
        return 'ellipsis-horizontal';
    }
  };

  const getActionColor = () => {
    switch (action?.id) {
      case 'send':
        return Colors.primary;
      case 'receive':
        return Colors.success;
      case 'withdraw':
        return Colors.warning;
      case 'convert':
        return Colors.accent;
      default:
        return Colors.primary;
    }
  };

  const renderActionContent = () => {
    if (action?.id === 'deposit') {
      return (
        <View style={styles.depositContent}>
          <Text style={styles.depositTitle}>Add Money</Text>
          <Text style={styles.depositSubtitle}>Choose how you want to add money to your account</Text>
          <TouchableOpacity style={styles.depositButton} onPress={handleDeposit}>
            <Ionicons name="add-circle" size={24} color={Colors.success} />
            <Text style={styles.depositButtonText}>Start Deposit</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.defaultContent}>
        <Text style={styles.defaultTitle}>{action?.title || 'Action'}</Text>
        <Text style={styles.defaultSubtitle}>This feature is coming soon</Text>
        <TouchableOpacity style={styles.defaultButton} onPress={handleClose}>
          <Text style={styles.defaultButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (!isVisible) return null;

  return (
    <Modal visible={isVisible} transparent animationType="none">
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.backdropTouch} onPress={handleClose} />
        </Animated.View>

        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <BlurView intensity={20} tint="light" style={styles.blurContainer}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <View style={styles.actionIcon}>
                  <Ionicons name={getActionIcon()} size={24} color={getActionColor()} />
                </View>
                <View style={styles.headerText}>
                                                        <Text style={styles.actionTitle}>
                     {action?.id === 'deposit' ? 'Add Money' : (action?.title || 'Action')}
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

      {/* Deposit Modal */}
      {showDepositModal && (
        <BlurView intensity={20} tint="light" style={styles.depositModalOverlay}>
          <TouchableOpacity style={styles.depositModalBackdrop} activeOpacity={1} onPress={() => setShowDepositModal(false)} />
          <View style={styles.depositModalContent} pointerEvents="box-none">
            <DepositScreen 
              navigation={{...navigation, goBack: () => setShowDepositModal(false)}} 
              isModal 
              onClose={() => setShowDepositModal(false)}
              onDepositConfirmed={() => {
                if (onDepositConfirmed) onDepositConfirmed();
                setShowDepositModal(false);
              }}
            />
            </View>
        </BlurView>
      )}
    </Modal>
  );
};

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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backdropTouch: {
    flex: 1,
  },
  sheet: {
    backgroundColor: 'transparent',
  },
  blurContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    maxHeight: height * 0.8,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  actionTitle: {
    ...Typography.h3,
    color: Colors.text,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  depositContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  depositTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: 8,
  },
  depositSubtitle: {
    ...Typography.bodyRegular,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 32,
  },
  depositButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  depositButtonText: {
    ...Typography.button,
    color: 'white',
  },
  defaultContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  defaultTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: 8,
  },
  defaultSubtitle: {
    ...Typography.bodyRegular,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 32,
  },
  defaultButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  defaultButtonText: {
    ...Typography.button,
    color: 'white',
  },
  depositModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  depositModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  depositModalContent: {
    width: '90%',
    maxWidth: 480,
    maxHeight: '90%',
  },
});

export default ActionBottomSheet;




