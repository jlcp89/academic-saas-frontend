import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { User, UserRole, ApiResponse, CreateUserForm } from '@/types';
import { API_BASE_URL } from '../constants';

// API Functions
export class UsersApi {
  private baseURL = `${API_BASE_URL}/api/users`;

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

  // Get all users with pagination and filtering
  async getUsers(params?: {
    page?: number;
    page_size?: number;
    role?: UserRole;
    search?: string;
    is_active?: boolean;
  }): Promise<ApiResponse<User>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
    if (params?.role) searchParams.append('role', params.role);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());

    const queryString = searchParams.toString();
    return this.request<ApiResponse<User>>(`/${queryString ? `?${queryString}` : ''}`);
  }

  // Get user by ID
  async getUser(id: number): Promise<User> {
    return this.request<User>(`/${id}/`);
  }

  // Get current user
  async getCurrentUser(): Promise<User> {
    return this.request<User>('/me/');
  }

  // Create user
  async createUser(data: CreateUserForm): Promise<User> {
    return this.request<User>('/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update user
  async updateUser(id: number, data: Partial<User>): Promise<User> {
    return this.request<User>(`/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Delete user
  async deleteUser(id: number): Promise<void> {
    return this.request<void>(`/${id}/`, {
      method: 'DELETE',
    });
  }

  // Change password
  async changePassword(id: number, data: { old_password: string; new_password: string }): Promise<void> {
    return this.request<void>(`/${id}/change_password/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get professors
  async getProfessors(): Promise<User[]> {
    return this.request<User[]>('/professors/');
  }

  // Get students
  async getStudents(): Promise<User[]> {
    return this.request<User[]>('/students/');
  }
}

// React Query Hooks
export function useUsersApi() {
  const { data: session } = useSession();
  const api = new UsersApi(() => session?.accessToken);
  return api;
}

// Get users with pagination
export function useUsers(params?: {
  page?: number;
  page_size?: number;
  role?: UserRole;
  search?: string;
  is_active?: boolean;
}) {
  const api = useUsersApi();
  
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => api.getUsers(params),
    enabled: !!api,
  });
}

// Get single user
export function useUser(id: number) {
  const api = useUsersApi();
  
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => api.getUser(id),
    enabled: !!api && !!id,
  });
}

// Get current user
export function useCurrentUser() {
  const api = useUsersApi();
  
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.getCurrentUser(),
    enabled: !!api,
  });
}

// Get professors
export function useProfessors() {
  const api = useUsersApi();
  
  return useQuery({
    queryKey: ['professors'],
    queryFn: () => api.getProfessors(),
    enabled: !!api,
  });
}

// Get students
export function useStudents() {
  const api = useUsersApi();
  
  return useQuery({
    queryKey: ['students'],
    queryFn: () => api.getStudents(),
    enabled: !!api,
  });
}

// Create user mutation
export function useCreateUser() {
  const api = useUsersApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateUserForm) => api.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Update user mutation
export function useUpdateUser() {
  const api = useUsersApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<User> }) => api.updateUser(id, data),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', updatedUser.id] });
    },
  });
}

// Delete user mutation
export function useDeleteUser() {
  const api = useUsersApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => api.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Change password mutation
export function useChangePassword() {
  const api = useUsersApi();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { old_password: string; new_password: string } }) => 
      api.changePassword(id, data),
  });
}

// Refresh current user
export function useRefreshCurrentUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      return null;
    },
  });
}