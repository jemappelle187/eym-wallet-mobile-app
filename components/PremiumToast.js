import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';

const { height: screenHeight } = Dimensions.get('window');

const PremiumToast = ({ 
  visible, 
  message, 
  type = 'info', 
  duration = 3000, 
  onHide,
  onPress,
  isAlert = false,
  alertTitle,
  alertButtons = []
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();

      // Auto hide after duration (only for toasts, not alerts)
      if (!isAlert) {
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
      }
    } else {
      hideToast();
    }
  }, [visible, isAlert, duration]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide && onHide();
    });
  };

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle',
          colors: ['#10b981', '#059669'],
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
        };
      case 'error':
        return {
          icon: 'close-circle',
          colors: ['#ef4444', '#dc2626'],
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
        };
      case 'warning':
        return {
          icon: 'warning',
          colors: ['#f59e0b', '#d97706'],
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
        };
      default:
        return {
          icon: 'information-circle',
          colors: ['#1e40af', '#6366f1'],
          backgroundColor: 'rgba(30, 64, 175, 0.1)',
        };
    }
  };

  const typeConfig = getTypeConfig();

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        isAlert && styles.alertContainer,
        {
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
    >
      <BlurView
        intensity={20}
        tint="light"
        style={[styles.blurContainer, isAlert && styles.alertBlurContainer]}
      >
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
          style={[styles.gradient, isAlert && styles.alertGradient]}
        >
          {isAlert ? (
            // Alert layout
            <View style={styles.alertContent}>
              <View style={styles.alertHeader}>
                <View style={[styles.iconContainer, { backgroundColor: typeConfig.backgroundColor }]}>
                  <LinearGradient
                    colors={typeConfig.colors}
                    style={styles.iconGradient}
                  >
                    <Ionicons
                      name={typeConfig.icon}
                      size={20}
                      color="white"
                    />
                  </LinearGradient>
                </View>
                <View style={styles.alertTextContainer}>
                  <Text style={styles.alertTitle}>{alertTitle}</Text>
                  <Text style={styles.alertMessage}>{message}</Text>
                </View>
              </View>
              
              {alertButtons.length > 0 && (
                <View style={styles.alertButtons}>
                  {alertButtons.map((button, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.alertButton,
                        button.style === 'destructive' && styles.alertButtonDestructive,
                        button.style === 'cancel' && styles.alertButtonCancel,
                        index === 0 && alertButtons.length === 1 && styles.alertButtonSingle,
                      ]}
                      onPress={() => {
                        button.onPress && button.onPress();
                        hideToast();
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.alertButtonText,
                        button.style === 'destructive' && styles.alertButtonTextDestructive,
                        button.style === 'cancel' && styles.alertButtonTextCancel,
                      ]}>
                        {button.text}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ) : (
            // Toast layout
          <TouchableOpacity
            style={styles.content}
            onPress={onPress}
            activeOpacity={0.8}
          >
            <View style={[styles.iconContainer, { backgroundColor: typeConfig.backgroundColor }]}>
              <LinearGradient
                colors={typeConfig.colors}
                style={styles.iconGradient}
              >
                <Ionicons
                  name={typeConfig.icon}
                  size={20}
                  color="white"
                />
              </LinearGradient>
            </View>
            
            <Text style={styles.message} numberOfLines={2}>
              {message}
            </Text>
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={hideToast}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close"
                size={16}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
          </TouchableOpacity>
          )}
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 24) + 10,
    left: 16,
    right: 16,
    zIndex: 99999,
    elevation: 20,
    maxHeight: screenHeight * 0.15, // Ensure toast doesn't take too much space
  },
  alertContainer: {
    maxHeight: screenHeight * 0.4, // More space for alerts
    top: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 24) + 20,
    left: 20,
    right: 20,
    zIndex: 99999,
    elevation: 20,
  },
  blurContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  alertBlurContainer: {
    borderRadius: 20,
  },
  gradient: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(30, 64, 175, 0.1)',
  },
  alertGradient: {
    borderRadius: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  alertContent: {
    padding: 20,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  alertTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 8,
  },
  alertMessage: {
    ...Typography.bodyRegular,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  alertButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  alertButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    minWidth: 80,
    alignItems: 'center',
  },
  alertButtonSingle: {
    flex: 1,
  },
  alertButtonDestructive: {
    backgroundColor: Colors.error,
  },
  alertButtonCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  alertButtonText: {
    ...Typography.bodyRegular,
    color: Colors.textInverse,
    fontWeight: '600',
  },
  alertButtonTextDestructive: {
    color: Colors.textInverse,
  },
  alertButtonTextCancel: {
    color: Colors.textPrimary,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconGradient: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    ...Typography.bodyRegular,
    color: Colors.textPrimary,
    flex: 1,
    fontWeight: '500',
    lineHeight: 20,
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginLeft: 8,
  },
});

export default PremiumToast; 