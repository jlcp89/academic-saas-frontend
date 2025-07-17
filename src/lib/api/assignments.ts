import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Assignment, ApiResponse } from '@/types';
import { API_BASE_URL } from '../constants';

export interface CreateAssignmentForm {
  title: string;
  description: string;
  due_date: string;
  max_points: number;
  assignment_type: 'HOMEWORK' | 'QUIZ' | 'EXAM' | 'PROJECT' | 'DISCUSSION';
  section: number;
  instructions?: string;
  attachments?: File[];
}

export interface UpdateAssignmentForm {
  title?: string;
  description?: string;
  due_date?: string;
  max_points?: number;
  assignment_type?: 'HOMEWORK' | 'QUIZ' | 'EXAM' | 'PROJECT' | 'DISCUSSION';
  instructions?: string;
  attachments?: File[];
}

export interface AssignmentWithSubmissions extends Assignment {
  submissions_count: number;
  average_score: number;
  submissions: {
    id: number;
    student_info: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
    };
    submission_date: string;
    grade: number | null;
    status: 'SUBMITTED' | 'GRADED' | 'LATE';
  }[];
}

// API Functions
export class AssignmentsApi {
  private baseURL = `${API_BASE_URL}/api/assignments`;

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

  private async requestWithFile<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
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

  // Get all assignments with pagination and filtering
  async getAssignments(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    section?: number;
    assignment_type?: string;
    due_date_from?: string;
    due_date_to?: string;
  }): Promise<ApiResponse<Assignment>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.section) searchParams.append('section', params.section.toString());
    if (params?.assignment_type) searchParams.append('assignment_type', params.assignment_type);
    if (params?.due_date_from) searchParams.append('due_date_from', params.due_date_from);
    if (params?.due_date_to) searchParams.append('due_date_to', params.due_date_to);

    const queryString = searchParams.toString();
    return this.request<ApiResponse<Assignment>>(`/${queryString ? `?${queryString}` : ''}`);
  }

  // Get assignment by ID with submissions
  async getAssignment(id: number): Promise<AssignmentWithSubmissions> {
    return this.request<AssignmentWithSubmissions>(`/${id}/`);
  }

  // Get student's assignments
  async getMyAssignments(): Promise<Assignment[]> {
    return this.request<Assignment[]>('/my_assignments/');
  }

  // Create assignment
  async createAssignment(data: CreateAssignmentForm): Promise<Assignment> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('due_date', data.due_date);
    formData.append('max_points', data.max_points.toString());
    formData.append('assignment_type', data.assignment_type);
    formData.append('section', data.section.toString());
    if (data.instructions) formData.append('instructions', data.instructions);
    
    if (data.attachments) {
      data.attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });
    }

    return this.requestWithFile<Assignment>('/', {
      method: 'POST',
      body: formData,
    });
  }

  // Update assignment
  async updateAssignment(id: number, data: UpdateAssignmentForm): Promise<Assignment> {
    const formData = new FormData();
    if (data.title) formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.due_date) formData.append('due_date', data.due_date);
    if (data.max_points !== undefined) formData.append('max_points', data.max_points.toString());
    if (data.assignment_type) formData.append('assignment_type', data.assignment_type);
    if (data.instructions) formData.append('instructions', data.instructions);
    
    if (data.attachments) {
      data.attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });
    }

    return this.requestWithFile<Assignment>(`/${id}/`, {
      method: 'PATCH',
      body: formData,
    });
  }

  // Delete assignment
  async deleteAssignment(id: number): Promise<void> {
    return this.request<void>(`/${id}/`, {
      method: 'DELETE',
    });
  }

  // Duplicate assignment
  async duplicateAssignment(id: number): Promise<Assignment> {
    return this.request<Assignment>(`/${id}/duplicate/`, {
      method: 'POST',
    });
  }
}

// React Query Hooks
export function useAssignmentsApi() {
  const { data: session } = useSession();
  const api = new AssignmentsApi(() => session?.accessToken);
  return api;
}

// Get assignments with pagination
export function useAssignments(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  section?: number;
  assignment_type?: string;
  due_date_from?: string;
  due_date_to?: string;
}) {
  const api = useAssignmentsApi();
  
  return useQuery({
    queryKey: ['assignments', params],
    queryFn: () => api.getAssignments(params),
    enabled: !!api,
  });
}

// Get single assignment
export function useAssignment(id: number) {
  const api = useAssignmentsApi();
  
  return useQuery({
    queryKey: ['assignment', id],
    queryFn: () => api.getAssignment(id),
    enabled: !!api && !!id,
  });
}

// Get student's assignments
export function useMyAssignments() {
  const api = useAssignmentsApi();
  
  return useQuery({
    queryKey: ['myAssignments'],
    queryFn: () => api.getMyAssignments(),
    enabled: !!api,
  });
}

// Create assignment mutation
export function useCreateAssignment() {
  const api = useAssignmentsApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateAssignmentForm) => api.createAssignment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['myAssignments'] });
    },
  });
}

// Update assignment mutation
export function useUpdateAssignment() {
  const api = useAssignmentsApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAssignmentForm }) => api.updateAssignment(id, data),
    onSuccess: (updatedAssignment) => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignment', updatedAssignment.id] });
      queryClient.invalidateQueries({ queryKey: ['myAssignments'] });
    },
  });
}

// Delete assignment mutation
export function useDeleteAssignment() {
  const api = useAssignmentsApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => api.deleteAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['myAssignments'] });
    },
  });
}

// Duplicate assignment mutation
export function useDuplicateAssignment() {
  const api = useAssignmentsApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => api.duplicateAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
}