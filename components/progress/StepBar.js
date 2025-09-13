import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../constants/Typography';

const StepBar = ({ currentStep = 0 }) => {
  const steps = [
    { label: 'Initiating', icon: 'rocket' },
    { label: 'Processing', icon: 'sync' },
    { label: 'Complete', icon: 'checkmark-circle' }
  ];

  // Animation values for each step
  const stepAnimations = useRef(
    steps.map(() => new Animated.Value(0))
  ).current;

  // Spinning animation for processing step
  const spinValue = useRef(new Animated.Value(0)).current;

  // Pulse animation for active step (separate from glow)
  const pulseValue = useRef(new Animated.Value(1)).current;

  // Individual glow animations for each step (separate from pulse)
  const glowValues = useRef(
    steps.map(() => new Animated.Value(0))
  ).current;

  // Animate steps when currentStep changes
  useEffect(() => {
    steps.forEach((_, index) => {
      const shouldBeActive = index <= currentStep;
      Animated.timing(stepAnimations[index], {
        toValue: shouldBeActive ? 1 : 0,
        duration: 500,
        useNativeDriver: false,
      }).start();
    });
  }, [currentStep, stepAnimations]);

  // Start spinning animation for processing step
  useEffect(() => {
    if (currentStep === 1) {
      const spin = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      spin.start();
      return () => spin.stop();
    } else {
      spinValue.setValue(0);
    }
  }, [currentStep, spinValue]);

  // Start pulse animation for processing step
  useEffect(() => {
    if (currentStep === 1) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          })
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseValue.setValue(1);
    }
  }, [currentStep, pulseValue]);

  // Start glow animation for each completed step
  useEffect(() => {
    steps.forEach((_, index) => {
      const isCompleted = index < currentStep;
      Animated.timing(glowValues[index], {
        toValue: isCompleted ? 1 : 0,
        duration: 600,
        useNativeDriver: false,
      }).start();
    });
  }, [currentStep, glowValues]);

  return (
    <View style={styles.container}>
      {steps.map((step, index) => (
        <View key={step.label} style={styles.stepContainer}>
          {/* Progress Line */}
          <View style={styles.progressLineContainer}>
            {index < steps.length - 1 && (
              <Animated.View 
                style={[
                  styles.progressLine,
                  {
                    backgroundColor: stepAnimations[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: ['rgba(255, 255, 255, 0.2)', (index < currentStep) ? '#10b981' : '#9ca3af'],
                      extrapolate: 'clamp',
                    }),
                  }
                ]} 
              />
            )}
          </View>
          
          {/* Step Circle */}
          <View style={styles.stepCircleContainer}>
            {/* Glow container for shadow effects */}
            <Animated.View 
              style={[
                styles.stepCircle,
                {
                  backgroundColor: stepAnimations[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: ['rgba(255, 255, 255, 0.2)', (index < currentStep || (index === currentStep && currentStep === 2)) ? '#10b981' : '#9ca3af'],
                    extrapolate: 'clamp',
                  }),
                  borderColor: stepAnimations[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: ['rgba(255, 255, 255, 0.3)', (index < currentStep || (index === currentStep && currentStep === 2)) ? '#10b981' : '#9ca3af'],
                    extrapolate: 'clamp',
                  }),
                  // Glow effect for completed steps (useNativeDriver: false)
                  shadowColor: index < currentStep ? '#10b981' : 'transparent',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: glowValues[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.6],
                    extrapolate: 'clamp',
                  }),
                  shadowRadius: glowValues[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 8],
                    extrapolate: 'clamp',
                  }),
                  elevation: glowValues[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 8],
                    extrapolate: 'clamp',
                  }),
                }
              ]}
            >
              {/* Pulse container for transform effects */}
              <Animated.View 
                style={{
                  // Pulse effect for processing step (useNativeDriver: true)
                  transform: index === 1 && currentStep === 1 ? [{
                    scale: pulseValue
                  }] : [],
                }}
              >
                {index < currentStep ? (
                  <Ionicons 
                    name="checkmark-circle" 
                    size={16} 
                    color="#ffffff" 
                  />
                ) : (
                  <Animated.View
                    style={index === 1 && currentStep === 1 ? {
                      transform: [{
                        rotate: spinValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg'],
                        })
                      }]
                    } : {}}
                  >
                    <Ionicons 
                      name={step.icon} 
                      size={16} 
                      color={index <= currentStep ? '#ffffff' : 'rgba(255, 255, 255, 0.3)'} 
                    />
                  </Animated.View>
                )}
              </Animated.View>
            </Animated.View>
          </View>
          
          {/* Step Label */}
          <Animated.Text 
            style={[
              styles.stepLabel,
              {
                color: stepAnimations[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: ['rgba(255, 255, 255, 0.5)', (index < currentStep || (index === currentStep && currentStep === 2)) ? '#10b981' : '#ffffff'],
                  extrapolate: 'clamp',
                }),
                fontWeight: index <= currentStep ? '600' : '400',
              }
            ]}
          >
            {step.label}
          </Animated.Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginVertical: 24,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  progressLineContainer: {
    position: 'absolute',
    top: 12,
    left: '50%',
    right: '-50%',
    height: 2,
    zIndex: 0,
  },
  progressLine: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: '100%',
  },
  stepCircleContainer: {
    zIndex: 10,
    marginBottom: 8,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 10,
  },
  stepLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: Typography.fontFamily,
    textAlign: 'center',
  },
});

export default StepBar;
