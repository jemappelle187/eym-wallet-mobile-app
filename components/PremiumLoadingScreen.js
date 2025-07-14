import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';

const { width, height } = Dimensions.get('window');

const PremiumLoadingScreen = () => {
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const haloScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Logo entrance animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Progress bar animation
    Animated.timing(progressWidth, {
      toValue: 0.8, // 80% progress
      duration: 2000,
      useNativeDriver: false,
    }).start();

    // Pulse animation for the logo
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    // Animate halo in sync with logo pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(haloScale, {
          toValue: 1.15,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(haloScale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      pulseAnimation.stop();
    };
  }, []);

  return (
    <LinearGradient
      colors={Colors.gradientPrimary}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.content}>
        {/* Animated Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [
                { scale: logoScale },
                { scale: pulseAnim },
              ],
            },
          ]}
        >
          <Image
            source={require('../assets/images/sendnreceive_logo.png')}
            style={styles.logoImage}
          />
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
          <Text style={styles.tagline}>
            Africa to World, World to Africa
          </Text>
        </Animated.View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressWidth.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.loadingText}>Loading your secure wallet...</Text>
        </View>

        {/* Security Badge */}
        <View style={styles.securityBadge}>
          <Ionicons
            name="shield-checkmark"
            size={16}
            color={Colors.success}
          />
          <Text style={styles.securityText}>Bank-level security</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logoImage: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
    tintColor: Colors.textInverse,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  tagline: {
    ...Typography.bodyRegular,
    color: Colors.textInverse,
    opacity: 0.9,
    fontSize: 16,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 40,
  },
  progressBackground: {
    height: 4,
    backgroundColor: Colors.glassBackground,
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  loadingText: {
    ...Typography.bodySmall,
    color: Colors.textInverse,
    opacity: 0.8,
    textAlign: 'center',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glassBackground,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  securityText: {
    ...Typography.bodySmall,
    color: Colors.textInverse,
    marginLeft: 6,
    fontWeight: '500',
  },
});

export default PremiumLoadingScreen; 