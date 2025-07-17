import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { School, Subscription, ApiResponse } from '@/types';
import { API_BASE_URL } from '../constants';

export interface CreateSchoolForm {
  name: string;
  subdomain: string;
  subscription_plan: 'BASIC' | 'PREMIUM';
  subscription_end_date: string;
}

export interface UpdateSchoolForm {
  name?: string;
  subdomain?: string;
  is_active?: boolean;
}

export interface RenewSubscriptionForm {
  end_date: string;
}

// API Functions
export class SchoolsApi {
  private baseURL = `${API_BASE_URL}/api/superadmin/schools`;

  constructor(private getToken: () => string | undefined) {}

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Get all schools with pagination and filtering
  async getSchools(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    is_active?: boolean;
    subscription_status?: string;
  }): Promise<ApiResponse<School>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());
    if (params?.subscription_status) searchParams.append('subscription_status', params.subscription_status);

    const queryString = searchParams.toString();
    return this.request<ApiResponse<School>>(`/${queryString ? `?${queryString}` : ''}`);
  }

  // Get school by ID
  async getSchool(id: number): Promise<School> {
    return this.request<School>(`/${id}/`);
  }

  // Create school
  async createSchool(data: CreateSchoolForm): Promise<School> {
    return this.request<School>('/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update school
  async updateSchool(id: number, data: UpdateSchoolForm): Promise<School> {
    return this.request<School>(`/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Delete school
  async deleteSchool(id: number): Promise<void> {
    return this.request<void>(`/${id}/`, {
      method: 'DELETE',
    });
  }

  // Activate school
  async activateSchool(id: number): Promise<School> {
    return this.request<School>(`/${id}/activate/`, {
      method: 'POST',
    });
  }

  // Deactivate school
  async deactivateSchool(id: number): Promise<School> {
    return this.request<School>(`/${id}/deactivate/`, {
      method: 'POST',
    });
  }
}

// Subscriptions API
export class SubscriptionsApi {
  private baseURL = `${API_BASE_URL}/api/superadmin/subscriptions`;

  constructor(private getToken: () => string | undefined) {}

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Get all subscriptions
  async getSubscriptions(params?: {
    page?: number;
    page_size?: number;
    status?: string;
  }): Promise<ApiResponse<Subscription>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
    if (params?.status) searchParams.append('status', params.status);

    const queryString = searchParams.toString();
    return this.request<ApiResponse<Subscription>>(`/${queryString ? `?${queryString}` : ''}`);
  }

  // Get expired subscriptions
  async getExpiredSubscriptions(): Promise<Subscription[]> {
    return this.request<Subscription[]>('/expired/');
  }

  // Renew subscription
  async renewSubscription(id: number, data: RenewSubscriptionForm): Promise<Subscription> {
    return this.request<Subscription>(`/${id}/renew/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update subscription
  async updateSubscription(id: number, data: Partial<Subscription>): Promise<Subscription> {
    return this.request<Subscription>(`/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

// React Query Hooks
export function useSchoolsApi() {
  const { data: session } = useSession();
  const api = new SchoolsApi(() => session?.accessToken);
  return api;
}

export function useSubscriptionsApi() {
  const { data: session } = useSession();
  const api = new SubscriptionsApi(() => session?.accessToken);
  return api;
}

// Schools hooks
export function useSchools(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
  subscription_status?: string;
}) {
  const api = useSchoolsApi();
  
  return useQuery({
    queryKey: ['schools', params],
    queryFn: () => api.getSchools(params),
    enabled: !!api,
  });
}

export function useSchool(id: number) {
  const api = useSchoolsApi();
  
  return useQuery({
    queryKey: ['school', id],
    queryFn: () => api.getSchool(id),
    enabled: !!api && !!id,
  });
}

export function useCreateSchool() {
  const api = useSchoolsApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateSchoolForm) => api.createSchool(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
    },
  });
}

export function useUpdateSchool() {
  const api = useSchoolsApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSchoolForm }) => api.updateSchool(id, data),
    onSuccess: (updatedSchool) => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      queryClient.invalidateQueries({ queryKey: ['school', updatedSchool.id] });
    },
  });
}

export function useDeleteSchool() {
  const api = useSchoolsApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => api.deleteSchool(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
    },
  });
}

export function useActivateSchool() {
  const api = useSchoolsApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => api.activateSchool(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
    },
  });
}

export function useDeactivateSchool() {
  const api = useSchoolsApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => api.deactivateSchool(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
    },
  });
}

// Subscriptions hooks
export function useSubscriptions(params?: {
  page?: number;
  page_size?: number;
  status?: string;
}) {
  const api = useSubscriptionsApi();
  
  return useQuery({
    queryKey: ['subscriptions', params],
    queryFn: () => api.getSubscriptions(params),
    enabled: !!api,
  });
}

export function useExpiredSubscriptions() {
  const api = useSubscriptionsApi();
  
  return useQuery({
    queryKey: ['expiredSubscriptions'],
    queryFn: () => api.getExpiredSubscriptions(),
    enabled: !!api,
  });
}

export function useRenewSubscription() {
  const api = useSubscriptionsApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: RenewSubscriptionForm }) => api.renewSubscription(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['expiredSubscriptions'] });
    },
  });
}

export function useUpdateSubscription() {
  const api = useSubscriptionsApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Subscription> }) => api.updateSubscription(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}