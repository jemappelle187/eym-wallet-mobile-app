import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { useNotifications } from '../contexts/NotificationContext';
import PremiumToast from './PremiumToast';
import { setAlertHandler } from '../utils/AlertUtils';

const PremiumTabBar = ({ state, descriptors, navigation }) => {
  const { getBadgeCount, markAllNotificationsAsRead } = useNotifications();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({});
  
  const animatedValues = useRef(
    state.routes.map(() => new Animated.Value(0))
  ).current;

  // Set up alert handler for AlertUtils
  useEffect(() => {
    setAlertHandler((config) => {
      setAlertConfig(config);
      setAlertVisible(true);
    });
  }, []);

  useEffect(() => {
    state.routes.forEach((route, index) => {
      const isFocused = state.index === index;
      Animated.timing(animatedValues[index], {
        toValue: isFocused ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [state.index]);

  const handleTabPress = (route, index) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!event.defaultPrevented) {
      navigation.navigate(route.name);

      // Mark notifications as read when navigating to a tab
        const badgeCount = getBadgeCount(route.name);
        if (badgeCount > 0) {
          markAllNotificationsAsRead(route.name);
          setToastMessage(`${badgeCount} notification${badgeCount > 1 ? 's' : ''} marked as read`);
          setToastType('success');
          setToastVisible(true);
        }
    }
  };

  const getTabIcon = (routeName, isFocused) => {
    switch (routeName) {
      case 'HomeDashboard':
        return isFocused ? 'home' : 'home-outline';
      case 'Activity':
        return isFocused ? 'list' : 'list-outline';
      case 'SendMoney':
        return isFocused ? 'send' : 'send-outline';
      case 'Account':
        return isFocused ? 'person' : 'person-outline';
      default:
        return isFocused ? 'home' : 'home-outline';
    }
  };

  const getTabLabel = (routeName) => {
    switch (routeName) {
      case 'HomeDashboard':
        return 'Home';
      case 'Activity':
        return 'Activity';
      case 'SendMoney':
        return 'Send';
      case 'Account':
        return 'Account';
      default:
        return 'Home';
    }
  };

  const getTabBadgeCount = (routeName) => {
    return getBadgeCount(routeName);
  };

  const handleToastHide = () => {
    setToastVisible(false);
  };

  const handleAlertHide = () => {
    setAlertVisible(false);
    setAlertConfig({});
  };

  return (
    <>
      <View style={styles.container}>
        {/* Background blur */}
      <BlurView
          intensity={90}
        tint="light"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 24,
          overflow: 'hidden',
        }}
      >
          {/* Gradient overlay */}
        <LinearGradient
            colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0.5)']}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 24,
          }}
        />
      </BlurView>

        {/* Border gradient */}
      <LinearGradient
          colors={['rgba(30, 64, 175, 0.15)', 'rgba(99, 102, 241, 0.15)', 'rgba(30, 64, 175, 0.1)']}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 24,
            borderWidth: 1.5,
          borderColor: 'transparent',
        }}
      />

      {/* Tab buttons */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
          height: '100%',
        }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const badgeCount = getTabBadgeCount(route.name);

          const scale = animatedValues[index].interpolate({
            inputRange: [0, 1, 1.2],
            outputRange: [1, 1, 1.1],
          });

          const translateY = animatedValues[index].interpolate({
            inputRange: [0, 1],
            outputRange: [0, -4],
          });

          const opacity = animatedValues[index].interpolate({
            inputRange: [0, 1],
            outputRange: [0.6, 1],
          });

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => handleTabPress(route, index)}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
              activeOpacity={0.8}
            >
              <Animated.View
                style={{
                  transform: [{ scale }, { translateY }],
                  opacity,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 16,
                  minWidth: 60,
                }}
              >
                {/* Active background gradient */}
                {isFocused && (
                  <LinearGradient
                      colors={['rgba(30, 64, 175, 0.15)', 'rgba(99, 102, 241, 0.15)', 'rgba(30, 64, 175, 0.1)']}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      borderRadius: 16,
                    }}
                  />
                )}

                {/* Icon container */}
                <View style={{ position: 'relative', marginBottom: 4 }}>
                  <Ionicons
                    name={getTabIcon(route.name, isFocused)}
                    size={24}
                    color={isFocused ? Colors.primary : Colors.textMuted}
                  />

                  {/* Badge */}
                  {badgeCount > 0 && (
                    <View
                      style={{
                        position: 'absolute',
                        top: -6,
                        right: -8,
                        backgroundColor: '#ef4444',
                        borderRadius: 10,
                        minWidth: 20,
                        height: 20,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 2,
                        borderColor: 'white',
                      }}
                    >
                      <Text
                        style={{
                          color: 'white',
                          fontSize: 10,
                          fontFamily: 'Montserrat-Bold',
                          fontWeight: 'bold',
                        }}
                      >
                        {badgeCount > 9 ? '9+' : badgeCount}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Label */}
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: 'Montserrat-SemiBold',
                    fontWeight: '600',
                    color: isFocused ? Colors.primary : Colors.textMuted,
                    textAlign: 'center',
                    marginTop: 2,
                  }}
                >
                  {getTabLabel(route.name)}
                </Text>

                {/* Active indicator */}
                {isFocused && (
                  <Animated.View
                    style={{
                      position: 'absolute',
                        bottom: -10,
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                      backgroundColor: Colors.primary,
                    }}
                  />
                )}
              </Animated.View>
            </TouchableOpacity>
          );
        })}
        </View>
      </View>
      
      {/* Premium Toast for notifications - positioned outside tab bar container */}
      <PremiumToast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        duration={2000}
        onHide={handleToastHide}
      />

      {/* Custom Alert - positioned outside tab bar container */}
      <PremiumToast
        visible={alertVisible}
        message={alertConfig.message}
        type={alertConfig.type}
        onHide={handleAlertHide}
        isAlert={alertConfig.isAlert}
        alertTitle={alertConfig.alertTitle}
        alertButtons={alertConfig.alertButtons}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 90 : 80,
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderRadius: 24,
    overflow: 'hidden',
  },
});

export default PremiumTabBar; 