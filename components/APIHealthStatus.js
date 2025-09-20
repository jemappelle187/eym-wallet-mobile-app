import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiHealthCheck from '../services/apiHealthCheck';

/**
 * API Health Status Component
 * Shows the health status of all APIs and provides troubleshooting guidance
 */
const APIHealthStatus = ({ visible = false, onClose }) => {
  const [healthReport, setHealthReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const report = await apiHealthCheck.getHealthReport();
      setHealthReport(report);
    } catch (error) {
      console.error('Health check failed:', error);
      Alert.alert('Health Check Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      checkHealth();
    }
  }, [visible]);

  const getStatusIcon = (healthy) => {
    return healthy ? 'checkmark-circle' : 'close-circle';
  };

  const getStatusColor = (healthy) => {
    return healthy ? '#10b981' : '#ef4444';
  };

  const showTroubleshootingGuide = () => {
    const issues = healthReport?.environment?.issues || [];
    const warnings = healthReport?.environment?.warnings || [];
    
    let message = 'API Configuration Status:\n\n';
    
    if (issues.length === 0 && warnings.length === 0) {
      message += '✅ All configurations are valid!';
    } else {
      if (issues.length > 0) {
        message += '❌ Issues that need fixing:\n';
        issues.forEach(issue => {
          message += `• ${issue.message}\n`;
          message += `  Fix: ${issue.fix}\n\n`;
        });
      }
      
      if (warnings.length > 0) {
        message += '⚠️ Warnings:\n';
        warnings.forEach(warning => {
          message += `• ${warning.message}\n`;
          if (warning.suggestion) {
            message += `  Suggestion: ${warning.suggestion}\n\n`;
          }
        });
      }
    }
    
    Alert.alert('Configuration Guide', message, [
      { text: 'OK' },
      { text: 'Recheck', onPress: checkHealth }
    ]);
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>API Health Status</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Checking API health...</Text>
        </View>
      ) : healthReport ? (
        <View style={styles.content}>
          {/* Overall Status */}
          <View style={styles.overallStatus}>
            <Ionicons 
              name={getStatusIcon(healthReport.overall.healthy)} 
              size={32} 
              color={getStatusColor(healthReport.overall.healthy)} 
            />
            <Text style={styles.overallText}>
              {healthReport.overall.healthy ? 'All Systems Healthy' : 'Issues Detected'}
            </Text>
            <Text style={styles.overallSubtext}>
              {healthReport.overall.issues} issues, {healthReport.overall.warnings} warnings
            </Text>
          </View>

          {/* API Status */}
          <View style={styles.apiStatus}>
            <Text style={styles.sectionTitle}>API Status</Text>
            
            {/* Circle API */}
            <View style={styles.apiItem}>
              <Ionicons 
                name={getStatusIcon(healthReport.apis.circle.healthy)} 
                size={20} 
                color={getStatusColor(healthReport.apis.circle.healthy)} 
              />
              <Text style={styles.apiName}>Circle API</Text>
              <Text style={styles.apiStatusText}>
                {healthReport.apis.circle.healthy ? 'Healthy' : 'Unhealthy'}
              </Text>
            </View>

            {/* Mobile Money API */}
            <View style={styles.apiItem}>
              <Ionicons 
                name={getStatusIcon(healthReport.apis.mobileMoney.healthy)} 
                size={20} 
                color={getStatusColor(healthReport.apis.mobileMoney.healthy)} 
              />
              <Text style={styles.apiName}>Mobile Money API</Text>
              <Text style={styles.apiStatusText}>
                {healthReport.apis.mobileMoney.healthy ? 'Healthy' : 'Unhealthy'}
              </Text>
            </View>
          </View>

          {/* Error Details */}
          {!healthReport.overall.healthy && (
            <View style={styles.errorDetails}>
              <Text style={styles.sectionTitle}>Error Details</Text>
              
              {!healthReport.apis.circle.healthy && (
                <View style={styles.errorItem}>
                  <Text style={styles.errorTitle}>Circle API</Text>
                  <Text style={styles.errorMessage}>{healthReport.apis.circle.error}</Text>
                  {healthReport.apis.circle.suggestion && (
                    <Text style={styles.errorSuggestion}>
                      💡 {healthReport.apis.circle.suggestion}
                    </Text>
                  )}
                </View>
              )}

              {!healthReport.apis.mobileMoney.healthy && (
                <View style={styles.errorItem}>
                  <Text style={styles.errorTitle}>Mobile Money API</Text>
                  <Text style={styles.errorMessage}>{healthReport.apis.mobileMoney.error}</Text>
                  {healthReport.apis.mobileMoney.suggestion && (
                    <Text style={styles.errorSuggestion}>
                      💡 {healthReport.apis.mobileMoney.suggestion}
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={checkHealth} style={styles.actionButton}>
              <Ionicons name="refresh" size={20} color="#1e40af" />
              <Text style={styles.actionButtonText}>Recheck</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={showTroubleshootingGuide} style={styles.actionButton}>
              <Ionicons name="help-circle" size={20} color="#1e40af" />
              <Text style={styles.actionButtonText}>Troubleshoot</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load health report</Text>
          <TouchableOpacity onPress={checkHealth} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 8,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  overallStatus: {
    alignItems: 'center',
    marginBottom: 20,
  },
  overallText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  overallSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  apiStatus: {
    marginBottom: 20,
  },
  apiItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  apiName: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  apiStatusText: {
    fontSize: 14,
    color: '#6b7280',
  },
  errorDetails: {
    marginBottom: 20,
  },
  errorItem: {
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 12,
    color: '#7f1d1d',
    marginBottom: 4,
  },
  errorSuggestion: {
    fontSize: 12,
    color: '#059669',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#1e40af',
    marginLeft: 4,
  },
  errorContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 40,
    margin: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#1e40af',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default APIHealthStatus;





