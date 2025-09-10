import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import GlobeBackground from '../components/GlobeBackground';
import FloatingValutas from '../components/FloatingValutas';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = () => {
  const navigation = useNavigation();
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const fullText = "Where access to the global financial network isn't a luxury";

  // Animation refs
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const button1Scale = useRef(new Animated.Value(1)).current;
  const button2Scale = useRef(new Animated.Value(1)).current;
  const contentFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered entrance animations
    Animated.sequence([
      // Logo animation
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      // Content fade in
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (isTyping && currentIndex < fullText.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + fullText[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 50);

      return () => clearTimeout(timer);
    } else if (currentIndex >= fullText.length) {
      const resetTimer = setTimeout(() => {
        setDisplayText('');
        setCurrentIndex(0);
        setIsTyping(true);
      }, 2000);

      return () => clearTimeout(resetTimer);
    }
  }, [currentIndex, fullText, isTyping]);

  const handleCreateAccount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('PhoneVerification');
  };

  const handleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Login');
  };

  const handleButtonPressIn = (buttonRef) => {
    Animated.timing(buttonRef, {
      toValue: 0.95,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handleButtonPressOut = (buttonRef) => {
    Animated.timing(buttonRef, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };



  return (
    <View style={styles.container}>
      <GlobeBackground color="#ffffff" />
      <FloatingValutas />
      
      <View style={styles.content}>
        <View style={styles.logoSection}>
          <Animated.Text 
            style={[
              styles.logo,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            SendNReceive
          </Animated.Text>
          <Text style={styles.subtitle}>
            {displayText}
          </Text>
        </View>

        <Animated.View 
          style={[
            styles.buttonSection,
            { opacity: contentFade }
          ]}
        >
          <Animated.View style={{ transform: [{ scale: button1Scale }] }}>
            <TouchableOpacity 
              style={styles.glassButton} 
              onPress={handleCreateAccount} 
              activeOpacity={0.7}
              onPressIn={() => handleButtonPressIn(button1Scale)}
              onPressOut={() => handleButtonPressOut(button1Scale)}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.glassGradient}
              >
                <Text style={styles.glassButtonText}>Create Account</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={{ transform: [{ scale: button2Scale }] }}>
            <TouchableOpacity 
              style={styles.glassButtonSecondary} 
              onPress={handleLogin} 
              activeOpacity={0.7}
              onPressIn={() => handleButtonPressIn(button2Scale)}
              onPressOut={() => handleButtonPressOut(button2Scale)}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.glassGradient}
              >
                <Text style={styles.glassButtonTextSecondary}>Log In</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: height * 0.15,
    paddingBottom: 48,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 60,
    zIndex: 10,
    position: 'relative',
  },
  logo: {
    fontSize: 44,
    fontWeight: '900',
    color: '#ffffff',
    fontFamily: 'Montserrat',
    textAlign: 'center',
    marginBottom: 16,
    zIndex: 10,
    position: 'relative',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#e2e8f0',
    fontFamily: 'Montserrat',
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: 20,
    minHeight: 56,
    zIndex: 10,
    position: 'relative',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  buttonSection: {
    gap: 16,
    alignItems: 'center',
    zIndex: 10,
    position: 'relative',
  },
  glassButton: {
    width: width * 0.7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  glassButtonSecondary: {
    width: width * 0.7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  glassGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    borderRadius: 16,
  },
  glassButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Montserrat',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  glassButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    fontFamily: 'Montserrat',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

});

export default WelcomeScreen;
