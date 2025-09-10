import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { useNotifications } from '../contexts/NotificationContext';
import { useTheme } from '../contexts/ThemeContext';
import PremiumToast from './PremiumToast';
import { setAlertHandler } from '../utils/AlertUtils';

const PremiumTabBar = ({ state, descriptors, navigation, tabBarStyle }) => {
  const { getBadgeCount, markAllNotificationsAsRead } = useNotifications();
  const { colors = Colors } = useTheme();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({});
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipText, setTooltipText] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const popupScale = useRef(new Animated.Value(0)).current;
  
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
    // Trigger haptic feedback for tab press
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const handleLongPress = (route, index, event) => {
    if (route.name === 'Activity') {
      // Trigger haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Get the position of the pressed tab
      const { pageX, pageY } = event.nativeEvent;
      setPopupPosition({ x: pageX, y: pageY - 120 }); // Position above the tab bar
      setPopupVisible(true);
      
      // Animate popup appearance
      Animated.spring(popupScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  };

  const handlePopupClose = () => {
    Animated.timing(popupScale, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setPopupVisible(false);
    });
  };

  const handleAnalyticsPress = () => {
    // Trigger haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setPopupVisible(false);
    // Navigate to Activity screen and trigger analytics
    navigation.navigate('Activity', { showAnalytics: true });
    // You can add a custom event or parameter to trigger analytics
    setTimeout(() => {
      // This will be handled in the TransactionHistoryScreen
      navigation.emit({
        type: 'custom',
        target: 'Activity',
        data: { action: 'showAnalytics' }
      });
    }, 100);
  };

  const handleExportPress = () => {
    // Trigger haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setPopupVisible(false);
    navigation.navigate('Activity', { showExport: true });
    setTimeout(() => {
      navigation.emit({
        type: 'custom',
        target: 'Activity',
        data: { action: 'showExport' }
      });
    }, 100);
  };

  const handleSearchPress = () => {
    // Trigger haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setPopupVisible(false);
    navigation.navigate('Activity', { showSearch: true });
    setTimeout(() => {
      navigation.emit({
        type: 'custom',
        target: 'Activity',
        data: { action: 'showSearch' }
      });
    }, 100);
  };

  const showTooltip = (text, event) => {
    const { pageX, pageY } = event.nativeEvent;
    setTooltipPosition({ x: pageX, y: pageY - 60 });
    setTooltipText(text);
    setTooltipVisible(true);
    
    // Hide tooltip after 2 seconds
    setTimeout(() => {
      setTooltipVisible(false);
    }, 2000);
  };

  const hideTooltip = () => {
    setTooltipVisible(false);
  };

  const getTabIcon = (routeName, isFocused) => {
    switch (routeName) {
      case 'Home':
        return isFocused ? 'home' : 'home-outline';
      case 'Activity':
        return isFocused ? 'list' : 'list-outline';
      case 'ProfileSettings':
        return isFocused ? 'person' : 'person-outline';
      default:
        return isFocused ? 'home' : 'home-outline';
    }
  };

  const getTabLabel = (routeName) => {
    switch (routeName) {
      case 'Home':
        return 'Home';
      case 'Activity':
        return 'Activity';
      case 'ProfileSettings':
        return 'Profile';
      default:
        return 'Home';
    }
  };



  const handleToastHide = () => {
    setToastVisible(false);
  };

  const handleAlertHide = () => {
    setAlertVisible(false);
    setAlertConfig({});
  };

  // Check if tab bar should be hidden using current route's options
  const currentRoute = state?.routes?.[state.index];
  const currentOptions = currentRoute ? descriptors?.[currentRoute.key]?.options : undefined;
  const computedDisplay = currentOptions?.tabBarStyle?.display ?? tabBarStyle?.display;
  const shouldHide = computedDisplay === 'none';
  console.log('🔍 PremiumTabBar Visibility Check:', { routeName: currentRoute?.name, computedDisplay, shouldHide });
  
  if (shouldHide) {
    return null;
  }

  return (
    <>
      <View style={styles.container}>
        {/* Enhanced Background blur with premium glass effect */}
      <BlurView
          intensity={150}
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
          {/* Premium gradient overlay with multiple layers for glass effect */}
        <LinearGradient
            colors={[colors.cardBackground + 'D9', colors.cardBackground + 'A6', colors.cardBackground + '73', colors.cardBackground + '40']}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 24,
          }}
        />
        
        {/* Subtle inner highlight for glass depth */}
        <LinearGradient
            colors={[colors.cardBackground + '66', colors.cardBackground + '33', colors.cardBackground + '00']}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '60%',
            borderRadius: 24,
          }}
        />
        
        {/* Additional glass layer for more depth */}
        <LinearGradient
            colors={[colors.cardBackground + '1A', colors.cardBackground + '0D', colors.cardBackground + '00']}
          style={{
            position: 'absolute',
            top: '40%',
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 24,
          }}
        />
      </BlurView>

        {/* Enhanced border gradient with premium effect and glow */}
      <LinearGradient
          colors={[colors.cardBackground + '26', colors.cardBackground + '1A', colors.cardBackground + '14', colors.cardBackground + '0D']}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 24,
            borderWidth: 2,
          borderColor: 'transparent',
        }}
      />
      
      {/* Glow effect for the border */}
      <View
        style={{
          position: 'absolute',
          top: -2,
          left: -2,
          right: -2,
          bottom: -2,
          borderRadius: 26,
          backgroundColor: 'transparent',
          shadowColor: colors.shadowLight,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
          elevation: 0,
        }}
      />
      
      {/* Additional inner glow */}
      <View
        style={{
          position: 'absolute',
          top: 2,
          left: 2,
          right: 2,
          bottom: 2,
          borderRadius: 22,
          backgroundColor: 'transparent',
          shadowColor: colors.shadowLight,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 0,
        }}
      />
      
      {/* Premium shadow overlay for depth */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 24,
          shadowColor: colors.shadowDark,
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.15,
          shadowRadius: 24,
          elevation: 20,
        }}
      />

      {/* Border surrounding the menubar */}
      <View style={[styles.borderLine, { borderColor: colors.border }]} />

      {/* Tab buttons */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
          height: '100%',
          paddingTop: 16,
        }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

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
              onLongPress={(event) => handleLongPress(route, index, event)}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
              activeOpacity={0.8}
              delayLongPress={500}
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
                {/* Icon */}
                <Ionicons
                  name={getTabIcon(route.name, isFocused)}
                  size={24}
                  color={isFocused ? colors.primary : colors.textMuted}
                />

                {/* Label */}
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: 'Montserrat-SemiBold',
                    fontWeight: '600',
                    color: isFocused ? colors.primary : colors.textMuted,
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
                      backgroundColor: colors.primary,
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

      {/* Activity Popup Menu */}
      <Modal
        visible={popupVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handlePopupClose}
      >
        <View style={styles.popupOverlay}>
          <TouchableOpacity 
            style={styles.popupBackdrop} 
            activeOpacity={1} 
            onPress={handlePopupClose}
          />
          <Animated.View
            style={[
              styles.popupMenu,
              {
                position: 'absolute',
                left: '50%',
                top: popupPosition.y,
                transform: [
                  { translateX: -154 }, // Center horizontally (reverted + 6px right)
                  { scale: popupScale }
                ],
                backgroundColor: colors.cardBackground,
                shadowColor: colors.shadowDark,
                borderColor: colors.border,
              }
            ]}
          >
            {/* Analytics Option */}
            <TouchableOpacity
              style={styles.popupMenuIconOnly}
              onPress={handleAnalyticsPress}
              onPressIn={(event) => showTooltip('Analytics', event)}
              onPressOut={hideTooltip}
              activeOpacity={0.7}
            >
              <View style={[styles.popupMenuIcon, { backgroundColor: Colors.success + '15' }]}>
                <Ionicons name="analytics-outline" size={24} color={Colors.success} />
              </View>
            </TouchableOpacity>

            {/* Export Option */}
            <TouchableOpacity
              style={styles.popupMenuIconOnly}
              onPress={handleExportPress}
              onPressIn={(event) => showTooltip('Export Data', event)}
              onPressOut={hideTooltip}
              activeOpacity={0.7}
            >
              <View style={[styles.popupMenuIcon, { backgroundColor: Colors.primary + '15' }]}>
                <Ionicons name="download-outline" size={24} color={Colors.primary} />
              </View>
            </TouchableOpacity>

            {/* Search Option */}
            <TouchableOpacity
              style={styles.popupMenuIconOnly}
              onPress={handleSearchPress}
              onPressIn={(event) => showTooltip('Quick Search', event)}
              onPressOut={hideTooltip}
              activeOpacity={0.7}
            >
              <View style={[styles.popupMenuIcon, { backgroundColor: Colors.warning + '15' }]}>
                <Ionicons name="search-outline" size={24} color={Colors.warning} />
              </View>
            </TouchableOpacity>

                              {/* Filter Option */}
                  <TouchableOpacity
                    style={styles.popupMenuIconOnly}
                    onPress={() => {
                      // Trigger haptic feedback
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      
                      setPopupVisible(false);
                      navigation.navigate('Activity', { showFilter: true });
                      setTimeout(() => {
                        navigation.emit({
                          type: 'custom',
                          target: 'Activity',
                          data: { action: 'showFilter' }
                        });
                      }, 100);
                    }}
                    onPressIn={(event) => showTooltip('Advanced Filter', event)}
                    onPressOut={hideTooltip}
                    activeOpacity={0.7}
                  >
              <View style={[styles.popupMenuIcon, { backgroundColor: Colors.error + '15' }]}>
                <Ionicons name="filter-outline" size={24} color={Colors.error} />
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Tooltip */}
          {tooltipVisible && (
            <View
              style={[
                styles.tooltip,
                {
                  left: tooltipPosition.x - 50,
                  top: tooltipPosition.y,
                  backgroundColor: colors.cardBackground,
                  shadowColor: colors.shadowDark,
                }
              ]}
            >
              <Text style={[styles.tooltipText, { color: colors.textPrimary }]}>{tooltipText}</Text>
              <View style={[styles.tooltipArrow, { borderTopColor: colors.cardBackground }]} />
            </View>
          )}
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 20 : 15,
    left: 16,
    right: 16,
    height: Platform.OS === 'ios' ? 90 : 80,
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
    paddingHorizontal: 20,
    paddingTop: 2,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 25,
  },
  borderLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'transparent', // Will be set dynamically
    zIndex: 1,
    pointerEvents: 'none',
  },
  // Popup Menu Styles
  popupOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  popupMenu: {
    position: 'absolute',
    backgroundColor: 'transparent', // Will be set dynamically
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'transparent', // Will be set dynamically
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
    borderWidth: 1,
    borderColor: 'transparent', // Will be set dynamically
  },
  popupMenuIconOnly: {
    marginHorizontal: 8,
    padding: 4,
    borderRadius: 12,
  },
  popupMenuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Tooltip Styles
  tooltip: {
    position: 'absolute',
    backgroundColor: 'transparent', // Will be set dynamically
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: 'transparent', // Will be set dynamically
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
  },
  tooltipText: {
    color: 'transparent', // Will be set dynamically
    fontSize: 12,
    fontFamily: 'Montserrat-Medium',
    textAlign: 'center',
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    marginLeft: -6,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'transparent', // Will be set dynamically
  },
});

export default PremiumTabBar; 