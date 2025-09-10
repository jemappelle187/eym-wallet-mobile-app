import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

const CustomRefreshControl = ({ refreshing, onRefresh, colors = Colors }) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (refreshing) {
      // Start spinning animation
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Stop animations
      spinValue.stopAnimation();
      scaleValue.stopAnimation();
      spinValue.setValue(0);
      scaleValue.setValue(1);
    }
  }, [refreshing]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!refreshing) return null;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [
              { rotate: spin },
              { scale: scaleValue },
            ],
          },
        ]}
      >
        <Ionicons 
          name="refresh" 
          size={24} 
          color={colors.primary} 
        />
      </Animated.View>
      <Text style={[styles.text, { color: colors.textMuted }]}>
        Refreshing transactions...
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginRight: 12,
  },
  text: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
  },
});

export default CustomRefreshControl; 