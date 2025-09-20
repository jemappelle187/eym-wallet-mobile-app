import { API_BASE, CIRCLE_API_KEY, MOBILE_MONEY_API_BASE } from '../app/config/api';

/**
 * API Health Check Service
 * Validates API credentials and connectivity before making requests
 */
class APIHealthCheckService {
  constructor() {
    this.healthCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Check if Circle API credentials are valid
   */
  async checkCircleAPIHealth() {
    const cacheKey = 'circle-api-health';
    const cached = this.healthCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.result;
    }

    try {
      // Validate API key format first
      if (!CIRCLE_API_KEY || !CIRCLE_API_KEY.startsWith('TEST_API_KEY:')) {
        const result = {
          healthy: false,
          error: 'Invalid API key format',
          suggestion: 'Check EXPO_PUBLIC_CIRCLE_API_KEY in app.config.js'
        };
        this.healthCache.set(cacheKey, { result, timestamp: Date.now() });
        return result;
      }

      // Test API connectivity with a simple request
      const response = await fetch(`${API_BASE}/ping`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${CIRCLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      });

      if (response.status === 401) {
        const result = {
          healthy: false,
          error: 'Invalid credentials (401)',
          suggestion: 'Verify Circle API key is correct and active'
        };
        this.healthCache.set(cacheKey, { result, timestamp: Date.now() });
        return result;
      }

      if (response.status === 404) {
        // Ping endpoint might not exist, but 404 means API is reachable
        const result = {
          healthy: true,
          warning: 'API reachable but ping endpoint not found',
          suggestion: 'API should work for other endpoints'
        };
        this.healthCache.set(cacheKey, { result, timestamp: Date.now() });
        return result;
      }

      const result = {
        healthy: response.ok,
        status: response.status,
        message: response.ok ? 'API is healthy' : `API returned ${response.status}`
      };
      this.healthCache.set(cacheKey, { result, timestamp: Date.now() });
      return result;

    } catch (error) {
      const result = {
        healthy: false,
        error: error.message,
        suggestion: this.getNetworkSuggestion(error)
      };
      this.healthCache.set(cacheKey, { result, timestamp: Date.now() });
      return result;
    }
  }

  /**
   * Check if Mobile Money API is reachable
   */
  async checkMobileMoneyAPIHealth() {
    const cacheKey = 'mobile-money-api-health';
    const cached = this.healthCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.result;
    }

    try {
      const response = await fetch(`${MOBILE_MONEY_API_BASE}/health`, {
        method: 'GET',
        timeout: 5000, // 5 second timeout
      });

      const result = {
        healthy: response.ok,
        status: response.status,
        message: response.ok ? 'Mobile Money API is healthy' : `API returned ${response.status}`
      };
      this.healthCache.set(cacheKey, { result, timestamp: Date.now() });
      return result;

    } catch (error) {
      const result = {
        healthy: false,
        error: error.message,
        suggestion: this.getNetworkSuggestion(error)
      };
      this.healthCache.set(cacheKey, { result, timestamp: Date.now() });
      return result;
    }
  }

  /**
   * Get network-specific suggestions based on error type
   */
  getNetworkSuggestion(error) {
    if (error.message.includes('Network request failed')) {
      return 'Check internet connection and API endpoint URLs';
    }
    if (error.message.includes('timeout')) {
      return 'API request timed out - check if backend services are running';
    }
    if (error.message.includes('127.0.0.1') || error.message.includes('localhost')) {
      return 'Local API not reachable - start mock server with: node mock-backend-server.js';
    }
    return 'Check API configuration and network connectivity';
  }

  /**
   * Validate all environment variables
   */
  validateEnvironment() {
    const issues = [];
    const warnings = [];

    // Check Circle API configuration
    if (!CIRCLE_API_KEY) {
      issues.push({
        type: 'missing',
        key: 'EXPO_PUBLIC_CIRCLE_API_KEY',
        message: 'Circle API key is required',
        fix: 'Add EXPO_PUBLIC_CIRCLE_API_KEY to app.config.js'
      });
    } else if (!CIRCLE_API_KEY.startsWith('TEST_API_KEY:')) {
      issues.push({
        type: 'invalid',
        key: 'EXPO_PUBLIC_CIRCLE_API_KEY',
        message: 'Circle API key format is invalid',
        fix: 'Use format: TEST_API_KEY:your_key_here'
      });
    }

    // Check API base URLs
    if (!API_BASE) {
      issues.push({
        type: 'missing',
        key: 'API_BASE',
        message: 'Circle API base URL is not configured',
        fix: 'Check app.config.js and api.ts configuration'
      });
    }

    if (!MOBILE_MONEY_API_BASE) {
      issues.push({
        type: 'missing',
        key: 'MOBILE_MONEY_API_BASE',
        message: 'Mobile Money API base URL is not configured',
        fix: 'Check app.config.js and api.ts configuration'
      });
    }

    // Check for development vs production configuration
    if (__DEV__) {
      if (API_BASE.includes('api.circle.com') && !API_BASE.includes('sandbox')) {
        warnings.push({
          type: 'config',
          message: 'Using production Circle API in development mode',
          suggestion: 'Consider using sandbox API for development'
        });
      }
    } else {
      if (API_BASE.includes('127.0.0.1') || API_BASE.includes('localhost')) {
        issues.push({
          type: 'config',
          message: 'Using localhost API in production',
          fix: 'Update API_BASE to production endpoints'
        });
      }
    }

    return { issues, warnings };
  }

  /**
   * Clear health check cache
   */
  clearCache() {
    this.healthCache.clear();
  }

  /**
   * Get comprehensive health report
   */
  async getHealthReport() {
    const [circleHealth, mobileMoneyHealth] = await Promise.all([
      this.checkCircleAPIHealth(),
      this.checkMobileMoneyAPIHealth()
    ]);

    const envValidation = this.validateEnvironment();

    return {
      timestamp: new Date().toISOString(),
      environment: envValidation,
      apis: {
        circle: circleHealth,
        mobileMoney: mobileMoneyHealth
      },
      overall: {
        healthy: circleHealth.healthy && mobileMoneyHealth.healthy && envValidation.issues.length === 0,
        issues: envValidation.issues.length,
        warnings: envValidation.warnings.length
      }
    };
  }
}

export default new APIHealthCheckService();





