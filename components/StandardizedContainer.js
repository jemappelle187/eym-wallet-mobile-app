import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlobeBackground from './GlobeBackground';

const StandardizedContainer = ({ 
  children, 
  backgroundColor = '#ffffff',
  showGlobeBackground = true,
  globeOpacity = 0.13,
  statusBarStyle = 'dark-content',
  edges = ['top', 'left', 'right'],
  style,
  contentStyle
}) => {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView 
      style={[
        styles.container, 
        { backgroundColor },
        style
      ]} 
      edges={edges}
    >
      <StatusBar 
        barStyle={statusBarStyle} 
        backgroundColor={backgroundColor} 
      />
      
      {/* Globe Background - positioned consistently */}
      {showGlobeBackground && (
        <GlobeBackground opacity={globeOpacity} />
      )}
      
      {/* Main Content Container */}
      <View style={[styles.contentContainer, contentStyle]}>
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
});

export default StandardizedContainer; 