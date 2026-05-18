import config from './config';

/**
 * API utility with environment-aware configuration
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ApiOptions extends RequestInit {
  timeout?: number;
  requireAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;

  constructor() {
    this.baseUrl = config.apiUrl;
    this.defaultTimeout = config.requestTimeout;
  }

  /**
   * Get authorization headers
   */
  private getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  /**
   * Get default headers
   */
  private getDefaultHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...this.getAuthHeaders(),
    };
  }

  /**
   * Create fetch request with timeout
   */
  private async fetchWithTimeout(
    url: string, 
    options: ApiOptions = {}
  ): Promise<Response> {
    const { timeout = this.defaultTimeout, requireAuth = true, ...fetchOptions } = options;

    // Add default headers
    const headers = {
      ...this.getDefaultHeaders(),
      ...fetchOptions.headers,
    } as any;

    // Remove auth header if not required
    if (!requireAuth && headers.Authorization) {
      delete headers.Authorization;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Handle API response with safe JSON parsing
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        return {
          success: false,
          error: `Expected JSON response but got ${contentType}. Response: ${text.substring(0, 200)}...`,
        };
      }

      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP ${response.status}: ${response.statusText}`,
          data: data.data,
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse response',
      };
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, options: ApiOptions = {}): Promise<ApiResponse<T>> {
    try {
      const url = config.getApiUrl(endpoint);
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        ...options,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      if (config.enableDebug) {
        console.error('API GET Error:', error);
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * POST request
   */
  async post<T = any>(
    endpoint: string, 
    data?: any, 
    options: ApiOptions = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = config.getApiUrl(endpoint);
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
        ...options,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      if (config.enableDebug) {
        console.error('API POST Error:', error);
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * PUT request
   */
  async put<T = any>(
    endpoint: string, 
    data?: any, 
    options: ApiOptions = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = config.getApiUrl(endpoint);
      const response = await this.fetchWithTimeout(url, {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
        ...options,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      if (config.enableDebug) {
        console.error('API PUT Error:', error);
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, options: ApiOptions = {}): Promise<ApiResponse<T>> {
    try {
      const url = config.getApiUrl(endpoint);
      const response = await this.fetchWithTimeout(url, {
        method: 'DELETE',
        ...options,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      if (config.enableDebug) {
        console.error('API DELETE Error:', error);
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Upload file
   */
  async upload<T = any>(
    endpoint: string, 
    formData: FormData, 
    options: ApiOptions = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = config.getApiUrl(endpoint);
      
      // Remove Content-Type header for FormData
      const { headers, ...restOptions } = options;
      const uploadHeaders = {
        ...this.getAuthHeaders(),
        ...headers,
      } as any;
      delete uploadHeaders['Content-Type'];

      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        body: formData,
        headers: uploadHeaders,
        ...restOptions,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      if (config.enableDebug) {
        console.error('API Upload Error:', error);
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }
}

// Create and export singleton instance
const api = new ApiClient();

export default api;