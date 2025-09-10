import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import ActionBottomSheet from './ActionBottomSheet';
import FloatingActionMenu from './FloatingActionMenu';
import SlideOutPanel from './SlideOutPanel';

const UIAlternativeDemo = ({ navigation, onDepositConfirmed }) => {
  const [selectedUI, setSelectedUI] = useState('bottomSheet');
  const [showActionUI, setShowActionUI] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);

  const uiOptions = [
    {
      id: 'bottomSheet',
      title: 'Bottom Sheet',
      subtitle: 'Recommended - Native & Consistent',
      icon: 'arrow-up-circle',
      color: Colors.success,
      description: 'Slides up from bottom with consistent 65% height',
    },
    {
      id: 'fabMenu',
      title: 'Floating Action Menu',
      subtitle: 'Space Efficient & Modern',
      icon: 'add-circle',
      color: Colors.primary,
      description: 'Circular menu that expands with spring animation',
    },
    {
      id: 'sidePanel',
      title: 'Slide-out Panel',
      subtitle: 'Large Content Area',
      icon: 'menu',
      color: Colors.accent,
      description: 'Slides in from right with 85% screen width',
    },
  ];

  const handleActionPress = (action) => {
    setCurrentAction(action);
    setShowActionUI(true);
  };

  const handleCloseActionUI = () => {
    setShowActionUI(false);
    setCurrentAction(null);
  };

  const renderSelectedUI = () => {
    switch (selectedUI) {
      case 'bottomSheet':
        return (
          <ActionBottomSheet
            isVisible={showActionUI}
            action={currentAction}
            onClose={handleCloseActionUI}
            navigation={navigation}
            onDepositConfirmed={onDepositConfirmed}
          />
        );
      case 'fabMenu':
        return (
          <FloatingActionMenu
            onActionSelect={handleActionPress}
          />
        );
      case 'sidePanel':
        return (
          <SlideOutPanel
            isVisible={showActionUI}
            action={currentAction}
            onClose={handleCloseActionUI}
            navigation={navigation}
            onDepositConfirmed={onDepositConfirmed}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>UI Alternatives Demo</Text>
          <Text style={styles.subtitle}>
            Compare different UI patterns for action buttons
          </Text>
        </View>

        {/* UI Selection */}
        <View style={styles.selectionSection}>
          <Text style={styles.sectionTitle}>Choose UI Pattern</Text>
          <View style={styles.uiOptions}>
            {uiOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.uiOption,
                  selectedUI === option.id && styles.selectedUIOption
                ]}
                onPress={() => setSelectedUI(option.id)}
              >
                <View style={[styles.uiIcon, { backgroundColor: option.color + '20' }]}>
                  <Ionicons name={option.icon} size={24} color={option.color} />
                </View>
                <View style={styles.uiText}>
                  <Text style={styles.uiTitle}>{option.title}</Text>
                  <Text style={styles.uiSubtitle}>{option.subtitle}</Text>
                  <Text style={styles.uiDescription}>{option.description}</Text>
                </View>
                {selectedUI === option.id && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Demo Section */}
        <View style={styles.demoSection}>
          <Text style={styles.sectionTitle}>Demo the Selected UI</Text>
          
          {selectedUI === 'fabMenu' ? (
            <View style={styles.fabDemoContainer}>
              <Text style={styles.demoText}>
                The Floating Action Menu is positioned in the bottom-right corner.
                Tap the main FAB button to see it expand.
              </Text>
            </View>
          ) : (
            <View style={styles.buttonDemoContainer}>
              <Text style={styles.demoText}>
                Tap any action button below to see the {uiOptions.find(u => u.id === selectedUI)?.title} in action:
              </Text>
              
              <View style={styles.demoButtons}>
                <TouchableOpacity
                  style={[styles.demoButton, { backgroundColor: Colors.success }]}
                  onPress={() => handleActionPress({ id: 'deposit', title: 'Add Money' })}
                >
                  <Ionicons name="add-circle" size={24} color={Colors.textInverse} />
                  <Text style={styles.demoButtonText}>Add Money</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.demoButton, { backgroundColor: Colors.primary }]}
                  onPress={() => handleActionPress({ id: 'send', title: 'Send Money' })}
                >
                  <Ionicons name="arrow-up-circle" size={24} color={Colors.textInverse} />
                  <Text style={styles.demoButtonText}>Send Money</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.demoButton, { backgroundColor: Colors.accent }]}
                  onPress={() => handleActionPress({ id: 'receive', title: 'Receive Money' })}
                >
                  <Ionicons name="arrow-down-circle" size={24} color={Colors.textInverse} />
                  <Text style={styles.demoButtonText}>Receive Money</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.demoButton, { backgroundColor: Colors.warning }]}
                  onPress={() => handleActionPress({ id: 'withdraw', title: 'Withdraw Money' })}
                >
                  <Ionicons name="remove-circle" size={24} color={Colors.textInverse} />
                  <Text style={styles.demoButtonText}>Withdraw Money</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Comparison Info */}
        <View style={styles.comparisonSection}>
          <Text style={styles.sectionTitle}>Key Benefits</Text>
          
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.benefitText}>Consistent sizing across all actions</Text>
            </View>
            
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.benefitText}>Professional, modern appearance</Text>
            </View>
            
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.benefitText}>Easy to switch between patterns</Text>
            </View>
            
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.benefitText}>All use the same action handling</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Render the selected UI */}
      {renderSelectedUI()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
  },
  selectionSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 16,
  },
  uiOptions: {
    gap: 12,
  },
  uiOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  selectedUIOption: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  uiIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  uiText: {
    flex: 1,
  },
  uiTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  uiSubtitle: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  uiDescription: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginTop: 4,
  },
  selectedIndicator: {
    marginLeft: 12,
  },
  demoSection: {
    marginBottom: 32,
  },
  fabDemoContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonDemoContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  demoText: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  demoButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 120,
    justifyContent: 'center',
  },
  demoButtonText: {
    ...Typography.bodyMedium,
    color: Colors.textInverse,
    fontWeight: '600',
    marginLeft: 8,
  },
  comparisonSection: {
    marginBottom: 32,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  benefitText: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    marginLeft: 12,
  },
});

export default UIAlternativeDemo;


