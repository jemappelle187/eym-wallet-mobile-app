import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';

const { width, height } = Dimensions.get('window');

const PremiumLoadingScreen = () => {
  // Typewriter animation
  const [typewriterText, setTypewriterText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const typewriterOpacity = useRef(new Animated.Value(0)).current;
  
  const fullText = 'SendNReceive';

  useEffect(() => {
    // Typewriter animation sequence
    Animated.sequence([
      // Start with typewriter opacity
      Animated.timing(typewriterOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {};
  }, []);

  // Separate useEffect for typewriter effect
  useEffect(() => {
    if (currentIndex >= fullText.length) {
      // Typing completed
      setTimeout(() => {
        setShowCursor(false);
      }, 500);
      return;
    }

    // Type next character
    const timer = setTimeout(() => {
      setTypewriterText(prev => prev + fullText[currentIndex]);
      setCurrentIndex(prev => prev + 1);
    }, 80); // Reduced from 150ms to 80ms for smoother typing

    return () => clearTimeout(timer);
  }, [currentIndex, fullText]);

  // Separate useEffect for cursor blink
  useEffect(() => {
    const cursorTimer = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 400); // Reduced from 500ms to 400ms for smoother cursor

    return () => clearInterval(cursorTimer);
  }, []);

  return (
    <LinearGradient
      colors={[Colors.background, Colors.backgroundSecondary, Colors.background]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.content}>
        {/* Typewriter Animation */}
        <Animated.View
          style={[
            styles.typewriterContainer,
            {
              opacity: typewriterOpacity,
            },
          ]}
        >
          <Text style={styles.typewriterText}>
            {typewriterText}
            {showCursor && (
              <Text style={styles.typewriterCursor}>|</Text>
            )}
          </Text>
        </Animated.View>
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
    zIndex: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  typewriterContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  typewriterText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b', // Dark text for light background
    textAlign: 'center',
    marginBottom: 30,
  },
  typewriterCursor: {
    color: '#1e293b', // Dark text for light background
    fontWeight: 'bold',
    fontSize: 32,
  },
});

export default PremiumLoadingScreen; 