import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Submission, ApiResponse } from '@/types';
import { API_BASE_URL } from '../constants';

export interface CreateSubmissionForm {
  assignment: number;
  content: string;
  attachments?: File[];
  status?: 'DRAFT' | 'SUBMITTED';
}

export interface UpdateSubmissionForm {
  content?: string;
  status?: 'DRAFT' | 'SUBMITTED';
  attachments?: File[];
}

export interface GradeSubmissionForm {
  points_earned: number;
  feedback?: string;
  status: 'GRADED' | 'RETURNED';
}

export interface SubmissionWithDetails extends Omit<Submission, 'assignment_info'> {
  assignment_info: {
    id: number;
    title: string;
    description: string;
    due_date: string;
    max_points: number;
    assignment_type: string;
    section_info: {
      id: number;
      section_name: string;
      subject_info: {
        id: number;
        subject_name: string;
        subject_code: string;
      };
    };
  };
}

// API Functions
export class SubmissionsApi {
  private baseURL = `${API_BASE_URL}/api/submissions`;

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

  // Get all submissions with pagination and filtering
  async getSubmissions(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    assignment?: number;
    student?: number;
    status?: string;
    section?: number;
  }): Promise<ApiResponse<Submission>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.assignment) searchParams.append('assignment', params.assignment.toString());
    if (params?.student) searchParams.append('student', params.student.toString());
    if (params?.status) searchParams.append('status', params.status);
    if (params?.section) searchParams.append('section', params.section.toString());

    const queryString = searchParams.toString();
    return this.request<ApiResponse<Submission>>(`/${queryString ? `?${queryString}` : ''}`);
  }

  // Get submission by ID
  async getSubmission(id: number): Promise<SubmissionWithDetails> {
    return this.request<SubmissionWithDetails>(`/${id}/`);
  }

  // Get student's submissions
  async getMySubmissions(): Promise<Submission[]> {
    return this.request<Submission[]>('/my_submissions/');
  }

  // Get submissions for an assignment (professor view)
  async getAssignmentSubmissions(assignmentId: number): Promise<Submission[]> {
    return this.request<Submission[]>(`/assignment/${assignmentId}/`);
  }

  // Create submission
  async createSubmission(data: CreateSubmissionForm): Promise<Submission> {
    const formData = new FormData();
    formData.append('assignment', data.assignment.toString());
    formData.append('content', data.content);
    if (data.status) formData.append('status', data.status);
    
    if (data.attachments) {
      data.attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });
    }

    return this.requestWithFile<Submission>('/', {
      method: 'POST',
      body: formData,
    });
  }

  // Update submission
  async updateSubmission(id: number, data: UpdateSubmissionForm): Promise<Submission> {
    const formData = new FormData();
    if (data.content) formData.append('content', data.content);
    if (data.status) formData.append('status', data.status);
    
    if (data.attachments) {
      data.attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });
    }

    return this.requestWithFile<Submission>(`/${id}/`, {
      method: 'PATCH',
      body: formData,
    });
  }

  // Submit a draft submission
  async submitSubmission(id: number): Promise<Submission> {
    return this.request<Submission>(`/${id}/submit/`, {
      method: 'POST',
    });
  }

  // Grade submission (professor only)
  async gradeSubmission(id: number, data: GradeSubmissionForm): Promise<Submission> {
    return this.request<Submission>(`/${id}/grade/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Download submission file
  async downloadSubmission(id: number): Promise<Blob> {
    const token = this.getToken();
    const response = await fetch(`${this.baseURL}/${id}/download/`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    return response.blob();
  }

  // Delete submission
  async deleteSubmission(id: number): Promise<void> {
    return this.request<void>(`/${id}/`, {
      method: 'DELETE',
    });
  }
}

// React Query Hooks
export function useSubmissionsApi() {
  const { data: session } = useSession();
  const api = new SubmissionsApi(() => session?.accessToken);
  return api;
}

// Get submissions with pagination
export function useSubmissions(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  assignment?: number;
  student?: number;
  status?: string;
  section?: number;
}) {
  const api = useSubmissionsApi();
  
  return useQuery({
    queryKey: ['submissions', params],
    queryFn: () => api.getSubmissions(params),
    enabled: !!api,
  });
}

// Get single submission
export function useSubmission(id: number) {
  const api = useSubmissionsApi();
  
  return useQuery({
    queryKey: ['submission', id],
    queryFn: () => api.getSubmission(id),
    enabled: !!api && !!id,
  });
}

// Get student's submissions
export function useMySubmissions() {
  const api = useSubmissionsApi();
  
  return useQuery({
    queryKey: ['mySubmissions'],
    queryFn: () => api.getMySubmissions(),
    enabled: !!api,
  });
}

// Get assignment submissions
export function useAssignmentSubmissions(assignmentId: number) {
  const api = useSubmissionsApi();
  
  return useQuery({
    queryKey: ['assignmentSubmissions', assignmentId],
    queryFn: () => api.getAssignmentSubmissions(assignmentId),
    enabled: !!api && !!assignmentId,
  });
}

// Create submission mutation
export function useCreateSubmission() {
  const api = useSubmissionsApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateSubmissionForm) => api.createSubmission(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['mySubmissions'] });
      queryClient.invalidateQueries({ queryKey: ['assignmentSubmissions'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
}

// Update submission mutation
export function useUpdateSubmission() {
  const api = useSubmissionsApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSubmissionForm }) => api.updateSubmission(id, data),
    onSuccess: (updatedSubmission) => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['submission', updatedSubmission.id] });
      queryClient.invalidateQueries({ queryKey: ['mySubmissions'] });
      queryClient.invalidateQueries({ queryKey: ['assignmentSubmissions'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
}

// Submit submission mutation
export function useSubmitSubmission() {
  const api = useSubmissionsApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => api.submitSubmission(id),
    onSuccess: (updatedSubmission) => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['submission', updatedSubmission.id] });
      queryClient.invalidateQueries({ queryKey: ['mySubmissions'] });
      queryClient.invalidateQueries({ queryKey: ['assignmentSubmissions'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
}

// Grade submission mutation
export function useGradeSubmission() {
  const api = useSubmissionsApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: GradeSubmissionForm }) => api.gradeSubmission(id, data),
    onSuccess: (gradedSubmission) => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['submission', gradedSubmission.id] });
      queryClient.invalidateQueries({ queryKey: ['assignmentSubmissions'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}

// Delete submission mutation
export function useDeleteSubmission() {
  const api = useSubmissionsApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => api.deleteSubmission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['mySubmissions'] });
      queryClient.invalidateQueries({ queryKey: ['assignmentSubmissions'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
}