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

const { width: screenWidth } = Dimensions.get('window');

const SlideOutPanel = ({ 
  isVisible, 
  onClose, 
  navigation,
  onDepositConfirmed 
}) => {
  const [slideAnim] = useState(new Animated.Value(screenWidth));
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
          toValue: screenWidth,
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

  const handleActionPress = (action) => {
    Haptics.selectionAsync();
    
    switch (action.id) {
      case 'deposit':
        navigation.navigate('DepositScreen', { 
          isModal: true, 
          onDepositConfirmed 
        });
        break;
      case 'send':
        navigation.navigate('SendMoney');
        break;
      case 'receive':
        navigation.navigate('ReceiveMoney');
        break;
      case 'withdraw':
        navigation.navigate('WithdrawScreen');
        break;
      default:
        break;
    }
    
    onClose();
  };

  const actions = [
    {
      id: 'deposit',
      title: 'Add Money',
      subtitle: 'Deposit funds to your wallet',
      icon: 'add-circle',
      color: Colors.success,
      gradient: [Colors.success, '#10b981'],
    },
    {
      id: 'send',
      title: 'Send Money',
      subtitle: 'Transfer to contacts or bank',
      icon: 'arrow-up-circle',
      color: Colors.primary,
      gradient: [Colors.primary, '#3b82f6'],
    },
    {
      id: 'receive',
      title: 'Receive Money',
      subtitle: 'Get paid via QR or link',
      icon: 'arrow-down-circle',
      color: Colors.accent,
      gradient: [Colors.accent, '#8b5cf6'],
    },
    {
      id: 'withdraw',
      title: 'Withdraw',
      subtitle: 'Cash out to bank or mobile',
      icon: 'remove-circle',
      color: Colors.warning,
      gradient: [Colors.warning, '#f59e0b'],
    },
  ];

  if (!isVisible) return null;

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[styles.backdrop, { opacity: backdropOpacity }]}
        >
          <TouchableOpacity 
            style={styles.backdropTouch} 
            activeOpacity={1} 
            onPress={handleClose}
          />
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.panel,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <BlurView intensity={20} tint="light" style={styles.panelBlur}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>Quick Actions</Text>
                <Text style={styles.headerSubtitle}>Choose what you'd like to do</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Actions List */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {actions.map((action, index) => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.actionCard}
                  onPress={() => handleActionPress(action)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={action.gradient}
                    style={styles.actionGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.actionIconContainer}>
                      <Ionicons name={action.icon} size={28} color="white" />
                    </View>
                  </LinearGradient>
                  
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>{action.title}</Text>
                    <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                  </View>
                  
                  <View style={styles.actionArrow}>
                    <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Need help? Contact support</Text>
              <TouchableOpacity style={styles.supportButton}>
                <Ionicons name="chatbubble-outline" size={16} color={Colors.primary} />
                <Text style={styles.supportButtonText}>Get Help</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropTouch: {
    flex: 1,
  },
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: screenWidth * 0.85, // 85% of screen width
    height: '100%',
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    overflow: 'hidden',
  },
  panelBlur: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionGradient: {
    width: 60,
    height: '100%',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  actionSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actionArrow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  supportButtonText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default SlideOutPanel;

