import { useSession } from 'next-auth/react';
import { API_BASE_URL } from './constants';

// Custom fetch wrapper with authentication
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = new Error(`HTTP error! status: ${response.status}`);
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  return response.json();
}

// Hook to get authenticated API client
export function useApiClient() {
  const { data: session } = useSession();

  const authenticatedRequest = async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    const config: RequestInit = {
      ...options,
      headers: {
        ...options.headers,
        ...(session?.accessToken && {
          Authorization: `Bearer ${session.accessToken}`,
        }),
      },
    };

    return apiRequest<T>(endpoint, config);
  };

  return { request: authenticatedRequest };
}