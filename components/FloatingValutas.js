import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const FloatingValutas = () => {
  const valutas = [
    { symbol: '$', size: 32, delay: 2000 },
    { symbol: '€', size: 36, delay: 3000 },
    { symbol: '£', size: 30, delay: 4000 },
    { symbol: '¥', size: 34, delay: 5000 },
    { symbol: '₵', size: 28, delay: 6000 },
    { symbol: '₦', size: 32, delay: 7000 },
    { symbol: '₹', size: 34, delay: 8000 },
    { symbol: '₽', size: 30, delay: 9000 },
    { symbol: '₩', size: 32, delay: 10000 },
    { symbol: '₪', size: 28, delay: 11000 },
    { symbol: '₨', size: 30, delay: 12000 },
    { symbol: '₴', size: 32, delay: 13000 },
    { symbol: '₺', size: 34, delay: 14000 },
    { symbol: 'K', size: 30, delay: 15000 },
    { symbol: 'KSh', size: 26, delay: 16000 },
    { symbol: 'USDC', size: 24, delay: 17000 },
    { symbol: 'USDT', size: 24, delay: 18000 },
    { symbol: 'RLUSD', size: 22, delay: 19000 },
    { symbol: 'EURC', size: 24, delay: 20000 },
  ];

  const animatedValues = useRef(
    valutas.map(() => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(Math.random() * height),
      opacity: new Animated.Value(0.3),
      scale: new Animated.Value(0.8),
    }))
  ).current;

  useEffect(() => {
    const animations = valutas.map((valuta, index) => {
      const animValue = animatedValues[index];
      
      // Start position - ensure full screen coverage
      const startX = Math.random() * width;
      const startY = Math.random() * height;
      animValue.x.setValue(startX);
      animValue.y.setValue(startY);
      animValue.opacity.setValue(0.3);
      animValue.scale.setValue(0.8);

      // Create floating animation with full screen movement
      const floatAnimation = Animated.parallel([
        // Horizontal movement - full screen width
        Animated.loop(
          Animated.sequence([
            Animated.timing(animValue.x, {
              toValue: Math.random() * width,
              duration: 15000 + Math.random() * 10000,
              useNativeDriver: true,
            }),
            Animated.timing(animValue.x, {
              toValue: Math.random() * width,
              duration: 15000 + Math.random() * 10000,
              useNativeDriver: true,
            }),
          ])
        ),
        // Vertical movement - full screen height including bottom area
        Animated.loop(
          Animated.sequence([
            Animated.timing(animValue.y, {
              toValue: Math.random() * height,
              duration: 12000 + Math.random() * 8000,
              useNativeDriver: true,
            }),
            Animated.timing(animValue.y, {
              toValue: Math.random() * height,
              duration: 12000 + Math.random() * 8000,
              useNativeDriver: true,
            }),
          ])
        ),
        // Opacity animation
        Animated.loop(
          Animated.sequence([
            Animated.timing(animValue.opacity, {
              toValue: 0.6,
              duration: 3000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
            Animated.timing(animValue.opacity, {
              toValue: 0.3,
              duration: 3000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
          ])
        ),
        // Scale animation
        Animated.loop(
          Animated.sequence([
            Animated.timing(animValue.scale, {
              toValue: 1.2,
              duration: 4000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
            Animated.timing(animValue.scale, {
              toValue: 0.8,
              duration: 4000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
          ])
        ),
      ]);

      // Start animation with delay
      return Animated.sequence([
        Animated.delay(valuta.delay),
        floatAnimation,
      ]);
    });

    // Start all animations
    animations.forEach(animation => animation.start());

    return () => {
      // Cleanup animations
      animations.forEach(animation => animation.stop());
    };
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {valutas.map((valuta, index) => (
        <Animated.Text
          key={index}
          style={[
            styles.valuta,
            {
              fontSize: valuta.size,
              transform: [
                { translateX: animatedValues[index].x },
                { translateY: animatedValues[index].y },
                { scale: animatedValues[index].scale },
              ],
              opacity: animatedValues[index].opacity,
            },
          ]}
        >
          {valuta.symbol}
        </Animated.Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: width,
    height: height,
    zIndex: 2,
  },
  valuta: {
    position: 'absolute',
    color: 'rgba(30, 64, 175, 0.6)',
    fontWeight: '400',
    fontFamily: 'Montserrat',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default FloatingValutas;
