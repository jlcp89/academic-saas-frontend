import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from './api-client';
import { API_ENDPOINTS } from './constants';
import { School, User, Subject, Section, Enrollment, Assignment, Submission } from '@/types';
import { useSession } from 'next-auth/react';

// Query keys
export const queryKeys = {
  users: ['users'] as const,
  currentUser: ['currentUser'] as const,
  schools: ['schools'] as const,
  subjects: ['subjects'] as const,
  sections: ['sections'] as const,
  enrollments: ['enrollments'] as const,
  assignments: ['assignments'] as const,
  submissions: ['submissions'] as const,
};

// Current User Query
export function useCurrentUser() {
  const apiClient = useApiClient();
  const { data: session, update } = useSession();
  
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: async () => {
      const response = await apiClient.request<{ data: User }>('/api/users/me/');
      const userData = response.data;
      
      // Update the session with fresh data
      if (update) {
        await update({
          ...session,
          user: userData
        });
      }
      
      return userData;
    },
    enabled: !!session,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Users Queries
export function useUsers() {
  const apiClient = useApiClient();
  
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: async () => {
      const response = await apiClient.request<User[]>(API_ENDPOINTS.USERS);
      return response;
    },
  });
}

// Schools Queries (Superadmin only)
export function useSchools() {
  const apiClient = useApiClient();
  
  return useQuery({
    queryKey: queryKeys.schools,
    queryFn: async () => {
      const response = await apiClient.request<School[]>(API_ENDPOINTS.SCHOOLS);
      return response;
    },
  });
}

// Subjects Queries
export function useSubjects() {
  const apiClient = useApiClient();
  
  return useQuery({
    queryKey: queryKeys.subjects,
    queryFn: async () => {
      const response = await apiClient.request<Subject[]>(API_ENDPOINTS.SUBJECTS);
      return response;
    },
  });
}

// Sections Queries
export function useSections() {
  const apiClient = useApiClient();
  
  return useQuery({
    queryKey: queryKeys.sections,
    queryFn: async () => {
      const response = await apiClient.request<Section[]>(API_ENDPOINTS.SECTIONS);
      return response;
    },
  });
}

// Enrollments Queries
export function useEnrollments() {
  const apiClient = useApiClient();
  
  return useQuery({
    queryKey: queryKeys.enrollments,
    queryFn: async () => {
      const response = await apiClient.request<Enrollment[]>(API_ENDPOINTS.ENROLLMENTS);
      return response;
    },
  });
}

// Assignments Queries
export function useAssignments() {
  const apiClient = useApiClient();
  
  return useQuery({
    queryKey: queryKeys.assignments,
    queryFn: async () => {
      const response = await apiClient.request<Assignment[]>(API_ENDPOINTS.ASSIGNMENTS);
      return response;
    },
  });
}

// Submissions Queries
export function useSubmissions() {
  const apiClient = useApiClient();
  
  return useQuery({
    queryKey: queryKeys.submissions,
    queryFn: async () => {
      const response = await apiClient.request<Submission[]>(API_ENDPOINTS.SUBMISSIONS);
      return response;
    },
  });
}

// Mutation to refetch current user
export function useRefreshCurrentUser() {
  const queryClient = useQueryClient();
  const { update } = useSession();
  
  return useMutation({
    mutationFn: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
      return true;
    },
    onSuccess: () => {
      // Force session update after invalidating the query
      update();
    },
  });
}