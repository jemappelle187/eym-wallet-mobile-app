// sendnreceive-app/components/QuickActionCard.js
import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Example icon library
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography'; // Assuming this has a relevant style or use individual props

const QuickActionCard = ({ iconName, title, onPress, iconColor, cardColor }) => {
  return (
    <TouchableOpacity style={[styles.card, cardColor && { backgroundColor: cardColor }]} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Ionicons name={iconName} size={30} color={iconColor || Colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 15,
    paddingVertical: 20, // Adjusted padding
    paddingHorizontal: 10, // Adjusted padding
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%', // For a 2-column grid, adjust as needed with spacing
    minHeight: 120, // Ensure a minimum height
    aspectRatio: 1, // Makes cards square, can be adjusted or removed for more rectangular cards
    marginBottom: 15, // Space between cards
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, // Softer shadow
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    marginBottom: 12, // Increased space
  },
  title: {
    // If Typography.bodyText is an object with styling:
    ...Typography.bodyText,
    // Explicit styles if Typography.bodyText is just for e.g. fontSize, color
    // fontSize: Typography.bodyText.fontSize || 14,
    // color: Typography.bodyText.color || Colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default QuickActionCard;
