import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Subject, ApiResponse } from '@/types';
import { API_BASE_URL } from '../constants';

export interface CreateSubjectForm {
  subject_name: string;
  subject_code: string;
}

export interface UpdateSubjectForm {
  subject_name?: string;
  subject_code?: string;
}

// API Functions
export class SubjectsApi {
  private baseURL = `${API_BASE_URL}/api/subjects`;

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

  // Get all subjects with pagination and filtering
  async getSubjects(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    subject_code?: string;
  }): Promise<ApiResponse<Subject>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.subject_code) searchParams.append('subject_code', params.subject_code);

    const queryString = searchParams.toString();
    return this.request<ApiResponse<Subject>>(`/${queryString ? `?${queryString}` : ''}`);
  }

  // Get subject by ID
  async getSubject(id: number): Promise<Subject> {
    return this.request<Subject>(`/${id}/`);
  }

  // Create subject
  async createSubject(data: CreateSubjectForm): Promise<Subject> {
    return this.request<Subject>('/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update subject
  async updateSubject(id: number, data: UpdateSubjectForm): Promise<Subject> {
    return this.request<Subject>(`/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Delete subject
  async deleteSubject(id: number): Promise<void> {
    return this.request<void>(`/${id}/`, {
      method: 'DELETE',
    });
  }
}

// React Query Hooks
export function useSubjectsApi() {
  const { data: session } = useSession();
  const api = new SubjectsApi(() => session?.accessToken);
  return api;
}

// Get subjects with pagination
export function useSubjects(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  subject_code?: string;
}) {
  const api = useSubjectsApi();
  
  return useQuery({
    queryKey: ['subjects', params],
    queryFn: () => api.getSubjects(params),
    enabled: !!api,
  });
}

// Get single subject
export function useSubject(id: number) {
  const api = useSubjectsApi();
  
  return useQuery({
    queryKey: ['subject', id],
    queryFn: () => api.getSubject(id),
    enabled: !!api && !!id,
  });
}

// Create subject mutation
export function useCreateSubject() {
  const api = useSubjectsApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateSubjectForm) => api.createSubject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
}

// Update subject mutation
export function useUpdateSubject() {
  const api = useSubjectsApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSubjectForm }) => api.updateSubject(id, data),
    onSuccess: (updatedSubject) => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['subject', updatedSubject.id] });
    },
  });
}

// Delete subject mutation
export function useDeleteSubject() {
  const api = useSubjectsApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => api.deleteSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
}