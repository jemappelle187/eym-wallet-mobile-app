import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const GlobeBackground = ({ opacity = 0.25, style, pointerEvents = "none", color }) => {
  const { colors, isDarkMode } = useTheme();
  
  // Adjust opacity for dark mode - make it more visible
  const adjustedOpacity = isDarkMode ? Math.max(opacity * 2.5, 0.4) : opacity;
  
  // If color is provided, use higher opacity for better visibility
  const finalOpacity = color ? Math.max(adjustedOpacity * 2, 0.8) : adjustedOpacity;
  
  try {
    return (
      <Image
        source={require('../assets/images/globe_transparent.png')}
        style={[
          styles.globeBackground, 
          style, 
          { 
            opacity: finalOpacity,
            // Use provided color or default tint for dark mode
            tintColor: color || (isDarkMode ? colors.primary + '40' : undefined)
          }
        ]}
        resizeMode="contain"
        pointerEvents={pointerEvents}
      />
    );
  } catch (error) {
    // Fallback to empty view if image fails to load
    console.warn('GlobeBackground image failed to load:', error);
    return <View style={[styles.globeBackground, style, { opacity: adjustedOpacity }]} pointerEvents={pointerEvents} />;
  }
};

const styles = StyleSheet.create({
  globeBackground: {
    position: 'absolute',
    top: '5%',
    left: '5%',
    width: '90%',
    height: '90%',
    opacity: 0.25,
    zIndex: 0,
  },
});

export default GlobeBackground; 