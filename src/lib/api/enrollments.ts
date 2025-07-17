import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Enrollment, ApiResponse } from '@/types';
import { API_BASE_URL } from '../constants';

export interface CreateEnrollmentForm {
  student: number;
  section: number;
}

export interface UpdateEnrollmentForm {
  status?: 'ENROLLED' | 'DROPPED' | 'COMPLETED';
  grade?: number;
}

export interface StudentEnrollmentView {
  id: number;
  section_name: string;
  subject_name: string;
  subject_code: string;
  professor_name: string;
  status: 'ENROLLED' | 'DROPPED' | 'COMPLETED';
  enrollment_date: string;
  grade?: number;
}

// API Functions
export class EnrollmentsApi {
  private baseURL = `${API_BASE_URL}/api/enrollments`;

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

  // Get all enrollments with pagination and filtering
  async getEnrollments(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    student?: number;
    section?: number;
    status?: string;
  }): Promise<ApiResponse<Enrollment>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.student) searchParams.append('student', params.student.toString());
    if (params?.section) searchParams.append('section', params.section.toString());
    if (params?.status) searchParams.append('status', params.status);

    const queryString = searchParams.toString();
    return this.request<ApiResponse<Enrollment>>(`/${queryString ? `?${queryString}` : ''}`);
  }

  // Get enrollment by ID
  async getEnrollment(id: number): Promise<Enrollment> {
    return this.request<Enrollment>(`/${id}/`);
  }

  // Get student's enrollments (student view)
  async getMyEnrollments(): Promise<StudentEnrollmentView[]> {
    return this.request<StudentEnrollmentView[]>('/my_enrollments/');
  }

  // Create enrollment
  async createEnrollment(data: CreateEnrollmentForm): Promise<Enrollment> {
    return this.request<Enrollment>('/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update enrollment
  async updateEnrollment(id: number, data: UpdateEnrollmentForm): Promise<Enrollment> {
    return this.request<Enrollment>(`/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Delete enrollment
  async deleteEnrollment(id: number): Promise<void> {
    return this.request<void>(`/${id}/`, {
      method: 'DELETE',
    });
  }
}

// React Query Hooks
export function useEnrollmentsApi() {
  const { data: session } = useSession();
  const api = new EnrollmentsApi(() => session?.accessToken);
  return api;
}

// Get enrollments with pagination
export function useEnrollments(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  student?: number;
  section?: number;
  status?: string;
}) {
  const api = useEnrollmentsApi();
  
  return useQuery({
    queryKey: ['enrollments', params],
    queryFn: () => api.getEnrollments(params),
    enabled: !!api,
  });
}

// Get single enrollment
export function useEnrollment(id: number) {
  const api = useEnrollmentsApi();
  
  return useQuery({
    queryKey: ['enrollment', id],
    queryFn: () => api.getEnrollment(id),
    enabled: !!api && !!id,
  });
}

// Get student's enrollments
export function useMyEnrollments() {
  const api = useEnrollmentsApi();
  
  return useQuery({
    queryKey: ['myEnrollments'],
    queryFn: () => api.getMyEnrollments(),
    enabled: !!api,
  });
}

// Create enrollment mutation
export function useCreateEnrollment() {
  const api = useEnrollmentsApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateEnrollmentForm) => api.createEnrollment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['myEnrollments'] });
      queryClient.invalidateQueries({ queryKey: ['sections'] });
    },
  });
}

// Update enrollment mutation
export function useUpdateEnrollment() {
  const api = useEnrollmentsApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateEnrollmentForm }) => api.updateEnrollment(id, data),
    onSuccess: (updatedEnrollment) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['enrollment', updatedEnrollment.id] });
      queryClient.invalidateQueries({ queryKey: ['myEnrollments'] });
      queryClient.invalidateQueries({ queryKey: ['sections'] });
    },
  });
}

// Delete enrollment mutation
export function useDeleteEnrollment() {
  const api = useEnrollmentsApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => api.deleteEnrollment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['myEnrollments'] });
      queryClient.invalidateQueries({ queryKey: ['sections'] });
    },
  });
}