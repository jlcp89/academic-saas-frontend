import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Section, ApiResponse, User } from '@/types';
import { API_BASE_URL } from '../constants';

export interface CreateSectionForm {
  section_name: string;
  subject: number;
  professor: number;
  start_date: string;
  end_date: string;
  max_students: number;
}

export interface UpdateSectionForm {
  section_name?: string;
  subject?: number;
  professor?: number;
  start_date?: string;
  end_date?: string;
  max_students?: number;
}

// API Functions
export class SectionsApi {
  private baseURL = `${API_BASE_URL}/api/sections`;

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

  // Get all sections with pagination and filtering
  async getSections(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    subject?: number;
    professor?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<Section>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.subject) searchParams.append('subject', params.subject.toString());
    if (params?.professor) searchParams.append('professor', params.professor.toString());
    if (params?.start_date) searchParams.append('start_date', params.start_date);
    if (params?.end_date) searchParams.append('end_date', params.end_date);

    const queryString = searchParams.toString();
    return this.request<ApiResponse<Section>>(`/${queryString ? `?${queryString}` : ''}`);
  }

  // Get section by ID
  async getSection(id: number): Promise<Section> {
    return this.request<Section>(`/${id}/`);
  }

  // Get students in a section
  async getSectionStudents(id: number): Promise<User[]> {
    return this.request<User[]>(`/${id}/students/`);
  }

  // Create section
  async createSection(data: CreateSectionForm): Promise<Section> {
    return this.request<Section>('/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update section
  async updateSection(id: number, data: UpdateSectionForm): Promise<Section> {
    return this.request<Section>(`/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Delete section
  async deleteSection(id: number): Promise<void> {
    return this.request<void>(`/${id}/`, {
      method: 'DELETE',
    });
  }
}

// React Query Hooks
export function useSectionsApi() {
  const { data: session } = useSession();
  const api = new SectionsApi(() => session?.accessToken);
  return api;
}

// Get sections with pagination
export function useSections(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  subject?: number;
  professor?: number;
  start_date?: string;
  end_date?: string;
}) {
  const api = useSectionsApi();
  
  return useQuery({
    queryKey: ['sections', params],
    queryFn: () => api.getSections(params),
    enabled: !!api,
  });
}

// Get single section
export function useSection(id: number) {
  const api = useSectionsApi();
  
  return useQuery({
    queryKey: ['section', id],
    queryFn: () => api.getSection(id),
    enabled: !!api && !!id,
  });
}

// Get section students
export function useSectionStudents(id: number) {
  const api = useSectionsApi();
  
  return useQuery({
    queryKey: ['sectionStudents', id],
    queryFn: () => api.getSectionStudents(id),
    enabled: !!api && !!id,
  });
}

// Create section mutation
export function useCreateSection() {
  const api = useSectionsApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateSectionForm) => api.createSection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
    },
  });
}

// Update section mutation
export function useUpdateSection() {
  const api = useSectionsApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSectionForm }) => api.updateSection(id, data),
    onSuccess: (updatedSection) => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      queryClient.invalidateQueries({ queryKey: ['section', updatedSection.id] });
    },
  });
}

// Delete section mutation
export function useDeleteSection() {
  const api = useSectionsApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => api.deleteSection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
    },
  });
}