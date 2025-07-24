import { useSession } from 'next-auth/react';

interface ApiResponse<T> {
  results?: T[];
  data?: T;
  count?: number;
  next?: string | null;
  previous?: string | null;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    // Dynamic API URL detection
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Local development
        this.baseURL = 'http://localhost:8000/api';
      } else if (hostname === '52.20.22.173') {
        // Dev environment - uses nginx proxy
        this.baseURL = 'http://52.20.22.173/api';
      } else {
        // Production or other environments
        this.baseURL = `${window.location.protocol}//${hostname}/api`;
      }
    } else {
      // Server-side fallback
      this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    }
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    // Debug logging
    console.log('API Request:', {
      url,
      method: options.method || 'GET',
      hasToken: !!this.token,
      tokenPreview: this.token ? `${this.token.substring(0, 20)}...` : null
    });

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      // Handle empty responses
      const text = await response.text();
      if (!text) return {} as T;

      try {
        return JSON.parse(text);
      } catch (parseError) {
        throw new Error(`Invalid JSON response: ${text}`);
      }
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

// Create singleton instance
const apiClient = new ApiClient();

// Hook to get authenticated API client
export function useApiClient() {
  const { data: session, status } = useSession();
  
  // Debug logging
  console.log('Session Debug:', {
    status,
    hasSession: !!session,
    hasAccessToken: !!session?.accessToken,
    user: session?.user
  });
  
  // Update token when session changes
  if (session?.accessToken && typeof session.accessToken === 'string') {
    apiClient.setToken(session.accessToken);
  }

  return apiClient;
}

// Export the client for non-hook usage
export { apiClient };
export default apiClient;