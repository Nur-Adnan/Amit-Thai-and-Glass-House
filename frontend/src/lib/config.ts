/**
 * Frontend configuration utility
 * Manages environment variables and provides type-safe access
 */

export interface AppConfig {
  // API Configuration
  apiUrl: string;
  apiTimeout: number;

  // Application Configuration
  appName: string;
  appVersion: string;
  appDescription: string;

  // Feature Flags
  enableAnalytics: boolean;
  enableDebug: boolean;
  enableMockData: boolean;

  // UI Configuration
  defaultLanguage: string;
  supportedLanguages: string[];
  defaultCurrency: string;
  defaultTimezone: string;

  // Performance Configuration
  cacheTimeout: number;
  requestTimeout: number;

  // Security Configuration
  enableCSP: boolean;
  allowedOrigins: string[];

  // Environment
  nodeEnv: string;
  isDevelopment: boolean;
  isProduction: boolean;
  isStaging: boolean;
}

class Config implements AppConfig {
  // API Configuration
  get apiUrl(): string {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }

  get apiTimeout(): number {
    return parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000');
  }

  // Application Configuration
  get appName(): string {
    return process.env.NEXT_PUBLIC_APP_NAME || 'Thai & Aluminum Business Management';
  }

  get appVersion(): string {
    return process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
  }

  get appDescription(): string {
    return process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Business Management System';
  }

  // Feature Flags
  get enableAnalytics(): boolean {
    return process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true';
  }

  get enableDebug(): boolean {
    return process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true';
  }

  get enableMockData(): boolean {
    return process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === 'true';
  }

  // UI Configuration
  get defaultLanguage(): string {
    return process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE || 'en';
  }

  get supportedLanguages(): string[] {
    const languages = process.env.NEXT_PUBLIC_SUPPORTED_LANGUAGES || 'en,bn';
    return languages.split(',').map(lang => lang.trim());
  }

  get defaultCurrency(): string {
    return process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || 'BDT';
  }

  get defaultTimezone(): string {
    return process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE || 'Asia/Dhaka';
  }

  // Performance Configuration
  get cacheTimeout(): number {
    return parseInt(process.env.NEXT_PUBLIC_CACHE_TIMEOUT || '300000');
  }

  get requestTimeout(): number {
    return parseInt(process.env.NEXT_PUBLIC_REQUEST_TIMEOUT || '10000');
  }

  // Security Configuration
  get enableCSP(): boolean {
    return process.env.NEXT_PUBLIC_ENABLE_CSP === 'true';
  }

  get allowedOrigins(): string[] {
    const origins = process.env.NEXT_PUBLIC_ALLOWED_ORIGINS || '';
    return origins.split(',').map(origin => origin.trim()).filter(Boolean);
  }

  // Environment
  get nodeEnv(): string {
    return process.env.NODE_ENV || 'development';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isStaging(): boolean {
    return this.nodeEnv === 'staging';
  }

  /**
   * Get API endpoint URL
   */
  getApiUrl(endpoint: string): string {
    const baseUrl = this.apiUrl.endsWith('/') ? this.apiUrl.slice(0, -1) : this.apiUrl;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}/api${cleanEndpoint}`;
  }

  /**
   * Get all configuration (for debugging)
   */
  getAll(): Partial<AppConfig> {
    return {
      nodeEnv: this.nodeEnv,
      apiUrl: this.apiUrl,
      appName: this.appName,
      appVersion: this.appVersion,
      enableDebug: this.enableDebug,
      enableAnalytics: this.enableAnalytics,
      defaultLanguage: this.defaultLanguage,
      supportedLanguages: this.supportedLanguages,
      defaultCurrency: this.defaultCurrency,
      defaultTimezone: this.defaultTimezone,
    };
  }

  /**
   * Log configuration on startup (development only)
   */
  logStartup(): void {
    if (this.isDevelopment && this.enableDebug) {
      console.log('🔧 Frontend Configuration:', this.getAll());
    }
  }
}

// Create and export singleton instance
const config = new Config();

export default config;