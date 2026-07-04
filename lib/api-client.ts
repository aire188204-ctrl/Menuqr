import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';

// ============================================================================
// API CLIENT WITH INTERCEPTORS & ERROR HANDLING
// ============================================================================

interface ApiErrorResponse {
  code: string;
  message: string;
  details?: any;
  insufficient_inventory?: Array<{
    variant_id: string;
    requested: number;
    available: number;
  }>;
}

interface ApiConfig {
  baseURL?: string;
  timeout?: number;
  tenantId?: string;
  token?: string;
}

class ApiClient {
  private client: AxiosInstance;
  private tenantId: string = '';
  private token: string = '';

  constructor(config: ApiConfig = {}) {
    const baseURL =
      typeof window !== 'undefined'
        ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        : 'http://localhost:3000';

    this.client = axios.create({
      baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.tenantId = config.tenantId || '';
    this.token = config.token || '';

    this.setupInterceptors();
  }

  /**
   * Setup request/response interceptors
   */
  private setupInterceptors(): void {
    // Request Interceptor: Inject tenant ID and auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (this.tenantId) {
          config.headers['X-Tenant-Id'] = this.tenantId;
        }
        if (this.token) {
          config.headers['Authorization'] = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // Response Interceptor: Global error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiErrorResponse>) => {
        const status = error.response?.status;
        const data = error.response?.data as ApiErrorResponse;

        // Handle 401 Unauthorized
        if (status === 401) {
          if (typeof window !== 'undefined') {
            // Clear auth state and redirect to login
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
          }
          return Promise.reject({
            code: 'UNAUTHORIZED',
            message: 'Authentication required. Please log in.',
          });
        }

        // Handle 409 Conflict (race condition / inventory issue)
        if (status === 409) {
          return Promise.reject({
            code: 'CONFLICT',
            message: data?.message || 'Resource conflict. Please refresh and try again.',
            details: data?.details,
            insufficient_inventory: data?.insufficient_inventory,
          });
        }

        // Handle 400 / 422 Validation Errors
        if (status === 400 || status === 422) {
          return Promise.reject({
            code: 'VALIDATION_ERROR',
            message: data?.message || 'Invalid input. Please check your data.',
            details: data?.details,
          });
        }

        // Handle 404 Not Found
        if (status === 404) {
          return Promise.reject({
            code: 'NOT_FOUND',
            message: data?.message || 'Resource not found.',
          });
        }

        // Handle 500+ Server Errors
        if (status && status >= 500) {
          return Promise.reject({
            code: 'SERVER_ERROR',
            message:
              'Server error occurred. Our team has been notified. Please try again later.',
          });
        }

        // Generic error handling
        return Promise.reject({
          code: 'UNKNOWN_ERROR',
          message: error.message || 'An unexpected error occurred.',
        });
      },
    );
  }

  /**
   * Set tenant ID for all subsequent requests
   */
  setTenantId(tenantId: string): void {
    this.tenantId = tenantId;
  }

  /**
   * Set authorization token
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * Clear authentication
   */
  clearAuth(): void {
    this.token = '';
    this.tenantId = '';
  }

  /**
   * GET request
   */
  get<T>(url: string, config?: any): Promise<T> {
    return this.client.get<T>(url, config).then((res) => res.data);
  }

  /**
   * POST request
   */
  post<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.client.post<T>(url, data, config).then((res) => res.data);
  }

  /**
   * PATCH request
   */
  patch<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.client.patch<T>(url, data, config).then((res) => res.data);
  }

  /**
   * PUT request
   */
  put<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.client.put<T>(url, data, config).then((res) => res.data);
  }

  /**
   * DELETE request
   */
  delete<T>(url: string, config?: any): Promise<T> {
    return this.client.delete<T>(url, config).then((res) => res.data);
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const posApi = {
  /**
   * Scan IMEI or serial number
   */
  scanDevice: (imeiOrSerial: string, tenantId: string) =>
    apiClient.get(`/api/v1/pos/products/scan/${imeiOrSerial}?tenant_id=${tenantId}`),

  /**
   * Create a sale checkout
   */
  checkout: (payload: any) =>
    apiClient.post('/api/v1/pos/sales/checkout', payload),
};

export const repairApi = {
  /**
   * Create a new repair job
   */
  createJob: (payload: any) =>
    apiClient.post('/api/v1/repair/jobs', payload),

  /**
   * Get repair job details
   */
  getJob: (jobId: string, tenantId: string) =>
    apiClient.get(`/api/v1/repair/jobs/${jobId}?tenant_id=${tenantId}`),

  /**
   * Update repair job status
   */
  updateStatus: (jobId: string, payload: any) =>
    apiClient.patch(`/api/v1/repair/jobs/${jobId}/status`, payload),

  /**
   * Get all repair jobs
   */
  listJobs: (tenantId: string) =>
    apiClient.get(`/api/v1/repair/jobs?tenant_id=${tenantId}`),
};

export default apiClient;
