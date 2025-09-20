import React, { useState, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, ScrollView, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography } from '../constants/Typography';

const ProgressBarDemoScreen = ({ navigation }) => {
  const [currentStyle, setCurrentStyle] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const progressValue = useRef(new Animated.Value(0)).current;
  const spinValue = useRef(new Animated.Value(0)).current;

  const progressBarStyles = [
    { id: 1, name: 'Gradient', description: 'Smooth color transition from blue to green' },
    { id: 2, name: 'Pulsing', description: 'Glowing shadow effect during processing' },
    { id: 3, name: 'Segmented', description: 'Discrete steps (25%, 50%, 75%, 100%)' },
    { id: 4, name: 'Circular', description: 'Modern circular indicator with percentage' },
    { id: 5, name: 'Animated Dots', description: 'Three dots that animate during processing' },
    { id: 6, name: 'Step Icons', description: 'Icons for each stage (rocket, sync, checkmark)' },
    { id: 7, name: 'Wave', description: 'Dashed border style for dynamic feel' },
    { id: 8, name: 'Particle', description: 'Moving particle that follows the progress' },
  ];

  const startAnimation = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    progressValue.setValue(0);
    
    // Start spinning animation for relevant styles
    if (currentStyle === 2 || currentStyle === 5) {
      spinValue.setValue(0);
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    }

    // Animate progress from 0 to 100%
    Animated.timing(progressValue, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start(() => {
      setIsAnimating(false);
      spinValue.stopAnimation();
    });
  };

  const resetAnimation = () => {
    progressValue.setValue(0);
    spinValue.stopAnimation();
    setIsAnimating(false);
  };

  const renderProgressBar = () => {
    const progressWidth = progressValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });

    switch (currentStyle) {
      case 1: // Gradient Progress Bar
        return (
          <Animated.View 
            style={[
              styles.progressBar,
              { width: progressWidth }
            ]} 
          >
            <LinearGradient
              colors={['#1e40af', '#3b82f6', '#10b981']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.progressBarGradient}
            />
          </Animated.View>
        );

      case 2: // Pulsing Progress Bar
        return (
          <Animated.View 
            style={[
              styles.progressBar,
              styles.progressBarPulsing,
              { width: progressWidth }
            ]} 
          />
        );

      case 3: // Segmented Progress Bar
        return (
          <View style={styles.progressBarSegmented}>
            {[0.25, 0.5, 0.75, 1].map((segment, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.progressSegment,
                  {
                    backgroundColor: progressValue.interpolate({
                      inputRange: [0, segment],
                      outputRange: ['rgba(30, 64, 175, 0.3)', '#1e40af'],
                      extrapolate: 'clamp',
                    })
                  }
                ]}
              />
            ))}
          </View>
        );

      case 4: // Circular Progress Ring
        return (
          <View style={styles.circularProgressContainer}>
            <Animated.View style={styles.circularProgress}>
              <Animated.Text style={styles.circularProgressText}>
                {progressValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                  extrapolate: 'clamp',
                })}
              </Animated.Text>
            </Animated.View>
          </View>
        );

      case 5: // Animated Dots
        return (
          <View style={styles.dotsContainer}>
            {[0, 1, 2].map((index) => (
              <Animated.View
                key={index}
                style={[
                  styles.progressDot,
                  {
                    opacity: progressValue.interpolate({
                      inputRange: [0, 0.33, 0.66, 1],
                      outputRange: [0.3, 1, 0.3, 0.3],
                      extrapolate: 'clamp',
                    }),
                    transform: [{
                      scale: progressValue.interpolate({
                        inputRange: [0, 0.33, 0.66, 1],
                        outputRange: [0.8, 1.2, 0.8, 0.8],
                        extrapolate: 'clamp',
                      })
                    }]
                  }
                ]}
              />
            ))}
          </View>
        );

      case 6: // Step Icons Progress
        return (
          <View style={styles.stepIconsContainer}>
            {[
              { icon: 'rocket', label: 'Initiate' },
              { icon: 'sync', label: 'Process' },
              { icon: 'checkmark-circle', label: 'Complete' }
            ].map((step, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.stepIconContainer,
                  {
                    opacity: progressValue.interpolate({
                      inputRange: [0, (index + 1) * 0.33, 1],
                      outputRange: [0.3, 1, 1],
                      extrapolate: 'clamp',
                    })
                  }
                ]}
              >
                <Ionicons 
                  name={step.icon} 
                  size={20} 
                  color={progressValue.interpolate({
                    inputRange: [0, (index + 1) * 0.33, 1],
                    outputRange: ['rgba(255,255,255,0.3)', '#1e40af', '#10b981'],
                    extrapolate: 'clamp',
                  })}
                />
                <Text style={styles.stepIconLabel}>{step.label}</Text>
              </Animated.View>
            ))}
          </View>
        );

      case 7: // Wave Progress
        return (
          <Animated.View 
            style={[
              styles.progressBar,
              styles.progressBarWave,
              { width: progressWidth }
            ]} 
          />
        );

      case 8: // Particle Progress
        return (
          <View style={styles.particleContainer}>
            <Animated.View 
              style={[
                styles.progressBar,
                { width: progressWidth }
              ]} 
            />
            <Animated.View
              style={[
                styles.particle,
                {
                  left: progressWidth,
                  opacity: progressValue.interpolate({
                    inputRange: [0, 0.1, 0.9, 1],
                    outputRange: [0, 1, 1, 0],
                    extrapolate: 'clamp',
                  })
                }
              ]}
            />
          </View>
        );

      default:
        return (
          <Animated.View 
            style={[
              styles.progressBar,
              { width: progressWidth }
            ]} 
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <SafeAreaView style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Progress Bar Demo</Text>
        <View style={styles.placeholder} />
      </SafeAreaView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Style Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Progress Bar Style</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.styleSelector}>
            {progressBarStyles.map((style) => (
              <TouchableOpacity
                key={style.id}
                style={[
                  styles.styleButton,
                  currentStyle === style.id && styles.styleButtonActive
                ]}
                onPress={() => {
                  setCurrentStyle(style.id);
                  resetAnimation();
                }}
              >
                <Text style={[
                  styles.styleButtonText,
                  currentStyle === style.id && styles.styleButtonTextActive
                ]}>
                  {style.id}
                </Text>
                <Text style={[
                  styles.styleButtonLabel,
                  currentStyle === style.id && styles.styleButtonLabelActive
                ]}>
                  {style.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Current Style Info */}
        <View style={styles.section}>
          <Text style={styles.currentStyleTitle}>
            Style {currentStyle}: {progressBarStyles[currentStyle - 1].name}
          </Text>
          <Text style={styles.currentStyleDescription}>
            {progressBarStyles[currentStyle - 1].description}
          </Text>
        </View>

        {/* Progress Bar Demo */}
        <View style={styles.section}>
          <View style={styles.progressBarContainer}>
            {renderProgressBar()}
          </View>
          
          {/* Percentage Display */}
          <View style={styles.percentageContainer}>
            <Animated.Text style={styles.percentageText}>
              {progressValue.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
                extrapolate: 'clamp',
              })}
            </Animated.Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.section}>
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={[styles.controlButton, styles.startButton]}
              onPress={startAnimation}
              disabled={isAnimating}
            >
              <Ionicons name="play" size={20} color="#ffffff" />
              <Text style={styles.controlButtonText}>
                {isAnimating ? 'Animating...' : 'Start Animation'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.resetButton]}
              onPress={resetAnimation}
            >
              <Ionicons name="refresh" size={20} color="#ffffff" />
              <Text style={styles.controlButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.instructionsTitle}>How to Test:</Text>
          <Text style={styles.instructionsText}>
            1. Select a progress bar style from the horizontal scroll above{'\n'}
            2. Tap "Start Animation" to see the progress bar animate{'\n'}
            3. Try different styles to find your favorite{'\n'}
            4. Use "Reset" to stop and reset the animation
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 15,
    fontFamily: Typography.fontFamily,
  },
  styleSelector: {
    flexDirection: 'row',
  },
  styleButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 60,
  },
  styleButtonActive: {
    backgroundColor: '#1e40af',
    borderColor: '#1e40af',
  },
  styleButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: Typography.fontFamily,
  },
  styleButtonTextActive: {
    color: '#ffffff',
  },
  styleButtonLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
    fontFamily: Typography.fontFamily,
  },
  styleButtonLabelActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  currentStyleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
    fontFamily: Typography.fontFamily,
  },
  currentStyleDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    fontFamily: Typography.fontFamily,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#1e40af',
    borderRadius: 4,
  },
  progressBarGradient: {
    height: '100%',
    borderRadius: 4,
  },
  progressBarPulsing: {
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  progressBarSegmented: {
    flexDirection: 'row',
    height: '100%',
    gap: 4,
  },
  progressSegment: {
    flex: 1,
    height: '100%',
    borderRadius: 4,
  },
  circularProgressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
  },
  circularProgress: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#1e40af',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
  },
  circularProgressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    fontFamily: Typography.fontFamily,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    gap: 12,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1e40af',
  },
  stepIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: 8,
  },
  stepIconContainer: {
    alignItems: 'center',
    flex: 1,
  },
  stepIconLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    fontFamily: Typography.fontFamily,
  },
  progressBarWave: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#1e40af',
    borderStyle: 'dashed',
  },
  particleContainer: {
    position: 'relative',
    height: '100%',
  },
  particle: {
    position: 'absolute',
    top: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  percentageContainer: {
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    fontFamily: Typography.fontFamily,
  },
  controlsContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  startButton: {
    backgroundColor: '#1e40af',
  },
  resetButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 10,
    fontFamily: Typography.fontFamily,
  },
  instructionsText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    fontFamily: Typography.fontFamily,
  },
});

export default ProgressBarDemoScreen;







