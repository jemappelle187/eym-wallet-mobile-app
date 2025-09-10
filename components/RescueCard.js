import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useTheme } from '../contexts/ThemeContext';

const RescueCard = ({ 
  title = "Still waiting for approval",
  subtitle = "This usually completes in ~45s. Didn't get the prompt?",
  actions = [],
  onActionPress
}) => {
  const { colors } = useTheme();

  const handleActionPress = (action) => {
    // Log analytics
    console.log('deposit_rescue_action', { type: action.id });
    
    if (onActionPress) {
      onActionPress(action);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: Colors.warning + '20' }]}>
          <Ionicons name="time-outline" size={20} color={Colors.warning} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        </View>
      </View>
      
      <View style={styles.actionsContainer}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={action.id}
            style={[
              styles.actionButton,
              { 
                backgroundColor: colors.primary + '10',
                borderColor: colors.primary + '30'
              }
            ]}
            onPress={() => handleActionPress(action)}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={action.icon || 'refresh-outline'} 
              size={16} 
              color={colors.primary} 
            />
            <Text style={[styles.actionText, { color: colors.primary }]}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default RescueCard;

