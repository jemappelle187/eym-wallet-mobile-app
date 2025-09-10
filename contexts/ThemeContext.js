import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Light theme colors
const lightColors = {
  // Brand
  primary: '#1e40af', // Brand Blue
  primaryLight: '#dbeafe', // Light Blue for button backgrounds
  indigo: '#6366f1', // Brand Indigo
  accent: '#fbbf24', // Gold/Yellow
  accentLight: '#fde68a', // Light Gold/Yellow
  brandPurple: '#7c3aed', // Added brandPurple for UI consistency
  background: '#ffffff', // App background
  backgroundSecondary: '#f8fafc', // Light Blue for cards/sections
  cardBackground: '#f8fafc', // Card background
  glassBackground: 'rgba(255,255,255,0.7)', // Glassmorphism effect
  lightBlue: '#f8fafc', // Light blue tint

  // Borders & Dividers
  border: '#e5e7eb', // Light border for dividers, inputs

  // Text
  text: '#1e293b', // Deep Navy
  textPrimary: '#1e293b', // Deep Navy
  textSecondary: '#334155', // Gray
  textMuted: '#64748b', // Muted/placeholder text
  textInverse: '#ffffff', // On dark backgrounds

  // Success & Error
  success: '#22c55e', // Emerald Green
  error: '#dc2626', // Red
  warning: '#fbbf24', // Gold/Yellow
  info: '#6366f1', // Indigo for info actions
  secondary: '#6366f1', // Indigo for secondary actions

  // Shadows
  shadowLight: 'rgba(30,64,175,0.06)', // Very soft blue shadow
  shadowMedium: 'rgba(30,64,175,0.12)',
  shadowDark: 'rgba(30,64,175,0.18)',

  // Gradients
  gradientPrimary: ['#1e40af', '#6366f1'], // Blue to Indigo
  gradientSecondary: ['#6366f1', '#1e40af'], // Indigo to Blue

  // Loader/Spinner
  loader: '#1e40af',

  // Misc
  promotionBackground: '#fbbf24',
  promotionText: '#1e293b',
};

// Dark theme colors
const darkColors = {
  // Brand
  primary: '#3b82f6', // Lighter blue for dark mode
  primaryLight: '#1e3a8a', // Darker blue for button backgrounds
  indigo: '#818cf8', // Lighter indigo for dark mode
  accent: '#fbbf24', // Gold/Yellow (same)
  accentLight: '#fde68a', // Light Gold/Yellow (same)
  brandPurple: '#a78bfa', // Lighter purple for dark mode
  background: '#0f172a', // Dark app background
  backgroundSecondary: '#1e293b', // Dark blue for cards/sections
  cardBackground: '#1e293b', // Dark card background
  glassBackground: 'rgba(30,41,59,0.7)', // Dark glassmorphism effect
  lightBlue: '#1e293b', // Dark blue tint

  // Borders & Dividers
  border: '#334155', // Darker border for dividers, inputs

  // Text
  text: '#f8fafc', // Light text for dark background
  textPrimary: '#f8fafc', // Light text for dark background
  textSecondary: '#cbd5e1', // Lighter gray
  textMuted: '#94a3b8', // Muted/placeholder text
  textInverse: '#0f172a', // On light backgrounds

  // Success & Error
  success: '#22c55e', // Emerald Green (same)
  error: '#ef4444', // Lighter red for dark mode
  warning: '#fbbf24', // Gold/Yellow (same)
  info: '#818cf8', // Lighter indigo for dark mode
  secondary: '#818cf8', // Lighter indigo for secondary actions

  // Shadows
  shadowLight: 'rgba(0,0,0,0.3)', // Dark shadow
  shadowMedium: 'rgba(0,0,0,0.4)',
  shadowDark: 'rgba(0,0,0,0.5)',

  // Gradients
  gradientPrimary: ['#3b82f6', '#818cf8'], // Lighter blue to indigo
  gradientSecondary: ['#818cf8', '#3b82f6'], // Lighter indigo to blue

  // Loader/Spinner
  loader: '#3b82f6',

  // Misc
  promotionBackground: '#fbbf24',
  promotionText: '#0f172a',
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const colors = isDarkMode ? darkColors : lightColors;

  const value = {
    isDarkMode,
    toggleTheme,
    colors,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 