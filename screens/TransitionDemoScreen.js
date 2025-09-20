import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';

const { width, height } = Dimensions.get('window');

const TransitionDemoScreen = ({ navigation }) => {
  const [currentDemo, setCurrentDemo] = useState(null);
  const [slideAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(1));
  const [scaleAnim] = useState(new Animated.Value(1));

  const demos = [
    {
      id: 1,
      title: 'Option 1: Slide from Right',
      description: 'Standard card transition with slide from right',
      color: '#1e40af',
      icon: 'arrow-forward',
    },
    {
      id: 2,
      title: 'Option 2: Slide from Bottom',
      description: 'Modal-like transition with slide from bottom',
      color: '#6366f1',
      icon: 'arrow-up',
    },
    {
      id: 3,
      title: 'Option 3: Fade Transition',
      description: 'Smooth fade with scale effect',
      color: '#059669',
      icon: 'eye',
    },
    {
      id: 4,
      title: 'Option 4: Custom Slide + Blur',
      description: 'Advanced transition with blur effect',
      color: '#dc2626',
      icon: 'layers',
    },
  ];

  const animateTransition = (type) => {
    switch (type) {
      case 1: // Slide from right
        slideAnim.setValue(width);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
        break;
      case 2: // Slide from bottom
        slideAnim.setValue(height);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
        break;
      case 3: // Fade
        fadeAnim.setValue(0);
        scaleAnim.setValue(0.8);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
        break;
      case 4: // Custom slide + blur
        slideAnim.setValue(width);
        fadeAnim.setValue(0);
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
        break;
    }
  };

  const resetAnimation = () => {
    slideAnim.setValue(0);
    fadeAnim.setValue(1);
    scaleAnim.setValue(1);
    setCurrentDemo(null);
  };

  const renderDemoScreen = (demo) => (
    <Animated.View
      style={[
        styles.demoScreen,
        {
          backgroundColor: demo.color,
          transform: [
            { translateX: slideAnim },
            { scale: scaleAnim },
          ],
          opacity: fadeAnim,
        },
      ]}
    >
      <SafeAreaView style={styles.demoSafeArea}>
        <View style={styles.demoHeader}>
          <TouchableOpacity
            style={styles.demoBackButton}
            onPress={resetAnimation}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.demoTitle}>Add via Mobile Money</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <View style={styles.demoContent}>
          <Ionicons name={demo.icon} size={80} color="#ffffff" />
          <Text style={styles.demoScreenTitle}>{demo.title}</Text>
          <Text style={styles.demoScreenDescription}>
            {demo.description}
          </Text>
          
          <View style={styles.demoFeatures}>
            <Text style={styles.demoFeatureText}>✅ Smooth animation</Text>
            <Text style={styles.demoFeatureText}>✅ Native performance</Text>
            <Text style={styles.demoFeatureText}>✅ Gesture support</Text>
          </View>
        </View>
      </SafeAreaView>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back-outline" size={28} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transition Demo</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Screen Transition Effects</Text>
          <Text style={styles.sectionDescription}>
            Tap each option to see how the transition would look between "Add Money" and "Add via Mobile Money" screens.
          </Text>

          {demos.map((demo) => (
            <TouchableOpacity
              key={demo.id}
              style={[styles.demoOption, { borderLeftColor: demo.color }]}
              onPress={() => {
                setCurrentDemo(demo);
                animateTransition(demo.id);
              }}
            >
              <View style={styles.demoOptionContent}>
                <View style={[styles.demoIcon, { backgroundColor: demo.color }]}>
                  <Ionicons name={demo.icon} size={24} color="#ffffff" />
                </View>
                <View style={styles.demoText}>
                  <Text style={styles.demoOptionTitle}>{demo.title}</Text>
                  <Text style={styles.demoOptionDescription}>
                    {demo.description}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
              </View>
            </TouchableOpacity>
          ))}

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={Colors.primary} />
            <Text style={styles.infoText}>
              These are visual demonstrations. The actual implementation would use React Navigation's built-in transition system.
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {currentDemo && renderDemoScreen(currentDemo)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily,
    marginBottom: 32,
    lineHeight: 24,
  },
  demoOption: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  demoOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  demoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  demoText: {
    flex: 1,
  },
  demoOptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily,
    marginBottom: 4,
  },
  demoOptionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily,
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  demoScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  demoSafeArea: {
    flex: 1,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  demoBackButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  demoTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
  },
  demoContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  demoScreenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  demoScreenDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: Typography.fontFamily,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  demoFeatures: {
    alignItems: 'flex-start',
  },
  demoFeatureText: {
    fontSize: 16,
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
    marginBottom: 8,
  },
});

export default TransitionDemoScreen;
