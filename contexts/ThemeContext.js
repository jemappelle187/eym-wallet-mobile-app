import React, { createContext, useContext, useState } from 'react';
import { Colors } from '../constants/Colors';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Define theme colors
  const value = {
    colors: {
      background: Colors.background,
      cardBackground: Colors.cardBackground,
      text: Colors.textPrimary,
      textMuted: Colors.textMuted,
      primary: Colors.primary,
      border: Colors.border,
      error: Colors.error,
      success: Colors.success,
      warning: Colors.warning,
      indigo: Colors.indigo,
      lightBlue: Colors.primaryLight,
    },
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 