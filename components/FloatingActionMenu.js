import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import * as Haptics from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const FloatingActionMenu = ({ isVisible, onClose, navigation, onDepositConfirmed }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const actions = [
    { id: 'deposit', title: 'Add Money', icon: 'add-circle', color: Colors.success, position: { x: -80, y: -80 } },
    { id: 'send', title: 'Send Money', icon: 'arrow-up-circle', color: Colors.primary, position: { x: 80, y: -80 } },
    { id: 'receive', title: 'Receive', icon: 'arrow-down-circle', color: Colors.accent, position: { x: -80, y: 80 } },
    { id: 'withdraw', title: 'Withdraw', icon: 'remove-circle', color: Colors.warning, position: { x: 80, y: 80 } },
  ];

  useEffect(() => {
    if (isVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        toggleMenu();
      });
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      setIsExpanded(false);
    }
  }, [isVisible]);

  const toggleMenu = () => {
    Haptics.selectionAsync();
    const toValue = isExpanded ? 0 : 1;
    
    Animated.parallel([
      Animated.spring(expandAnim, {
        toValue,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(rotateAnim, {
        toValue: isExpanded ? 0 : 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();

    setIsExpanded(!isExpanded);
  };

  const handleActionPress = (action) => {
    Haptics.selectionAsync();
    
    // Handle different actions
    switch (action.id) {
      case 'deposit':
        // Show deposit screen as modal
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

  const mainButtonRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  if (!isVisible) return null;

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <View style={styles.container}>
          {/* Action Buttons */}
          {actions.map((action, index) => {
            const scale = expandAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            });

            const translateX = expandAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, action.position.x],
            });

            const translateY = expandAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, action.position.y],
            });

            const opacity = expandAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 0.5, 1],
            });

            return (
              <Animated.View
                key={action.id}
                style={[
                  styles.actionButton,
                  {
                    transform: [
                      { scale },
                      { translateX },
                      { translateY },
                    ],
                    opacity,
                  },
                ]}
              >
                <TouchableOpacity
                  style={[styles.actionButtonInner, { backgroundColor: action.color }]}
                  onPress={() => handleActionPress(action)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={action.icon} size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.actionLabel}>{action.title}</Text>
              </Animated.View>
            );
          })}

          {/* Main FAB Button */}
          <Animated.View
            style={[
              styles.mainButton,
              {
                transform: [{ rotate: mainButtonRotation }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.mainButtonInner}
              onPress={toggleMenu}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.accent]}
                style={styles.mainButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="add" size={32} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    position: 'absolute',
    alignItems: 'center',
  },
  actionButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionLabel: {
    ...Typography.caption,
    color: Colors.textInverse,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  mainButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  mainButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  mainButtonGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FloatingActionMenu;

