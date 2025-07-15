import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from './api-client';
import { API_ENDPOINTS } from './constants';
import { 
  User, 
  School, 
  Subject, 
  Section, 
  Assignment, 
  Enrollment, 
  Submission,
  ApiResponse,
  CreateUserForm
} from '@/types';

// Query Keys
export const queryKeys = {
  users: ['users'] as const,
  schools: ['schools'] as const,
  subjects: ['subjects'] as const,
  sections: ['sections'] as const,
  assignments: ['assignments'] as const,
  enrollments: ['enrollments'] as const,
  submissions: ['submissions'] as const,
} as const;

// User Queries
export function useUsers() {
  const { request } = useApiClient();
  
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: () => request<ApiResponse<User>>(API_ENDPOINTS.USERS),
  });
}

export function useCreateUser() {
  const { request } = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: CreateUserForm) =>
      request<User>(API_ENDPOINTS.USERS, {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
  });
}

// School Queries (Superadmin only)
export function useSchools() {
  const { request } = useApiClient();
  
  return useQuery({
    queryKey: queryKeys.schools,
    queryFn: () => request<ApiResponse<School>>(API_ENDPOINTS.SCHOOLS),
  });
}

// Subject Queries
export function useSubjects() {
  const { request } = useApiClient();
  
  return useQuery({
    queryKey: queryKeys.subjects,
    queryFn: () => request<ApiResponse<Subject>>(API_ENDPOINTS.SUBJECTS),
  });
}

// Section Queries
export function useSections() {
  const { request } = useApiClient();
  
  return useQuery({
    queryKey: queryKeys.sections,
    queryFn: () => request<ApiResponse<Section>>(API_ENDPOINTS.SECTIONS),
  });
}

// Assignment Queries
export function useAssignments() {
  const { request } = useApiClient();
  
  return useQuery({
    queryKey: queryKeys.assignments,
    queryFn: () => request<ApiResponse<Assignment>>(API_ENDPOINTS.ASSIGNMENTS),
  });
}

// Enrollment Queries
export function useEnrollments() {
  const { request } = useApiClient();
  
  return useQuery({
    queryKey: queryKeys.enrollments,
    queryFn: () => request<ApiResponse<Enrollment>>(API_ENDPOINTS.ENROLLMENTS),
  });
}

// My Enrollments (for students)
export function useMyEnrollments() {
  const { request } = useApiClient();
  
  return useQuery({
    queryKey: [...queryKeys.enrollments, 'my'],
    queryFn: () => request<ApiResponse<Enrollment>>(`${API_ENDPOINTS.ENROLLMENTS}my_enrollments/`),
  });
}

// Submission Queries
export function useSubmissions() {
  const { request } = useApiClient();
  
  return useQuery({
    queryKey: queryKeys.submissions,
    queryFn: () => request<ApiResponse<Submission>>(API_ENDPOINTS.SUBMISSIONS),
  });
}