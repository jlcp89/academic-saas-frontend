import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Submission, Assignment, ApiResponse } from '@/types';
import { API_BASE_URL } from '../constants';

export interface GradeSubmissionForm {
  points_earned: number;
  feedback?: string;
  status: 'GRADED' | 'RETURNED';
}

export interface BulkGradeForm {
  submissions: {
    id: number;
    points_earned: number;
    feedback?: string;
  }[];
}

export interface GradeBookEntry {
  id: number;
  student_info: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    username: string;
  };
  assignment_info: {
    id: number;
    title: string;
    max_points: number;
    due_date: string;
    assignment_type: string;
  };
  submission?: {
    id: number;
    status: 'DRAFT' | 'SUBMITTED' | 'GRADED' | 'RETURNED';
    submitted_at?: string;
    points_earned?: number;
    feedback?: string;
    is_late?: boolean;
  };
  enrollment_info: {
    id: number;
    status: 'ENROLLED' | 'DROPPED' | 'COMPLETED';
  };
}

export interface GradeBookStats {
  total_students: number;
  total_assignments: number;
  submitted_count: number;
  graded_count: number;
  average_grade: number;
  late_submissions: number;
}

export interface SectionGradeBook {
  section_info: {
    id: number;
    section_name: string;
    subject_info: {
      id: number;
      subject_name: string;
      subject_code: string;
    };
    professor_info: {
      id: number;
      first_name: string;
      last_name: string;
    };
  };
  assignments: Assignment[];
  entries: GradeBookEntry[];
  stats: GradeBookStats;
}

// API Functions
export class GradingApi {
  private baseURL = `${API_BASE_URL}/api`;

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

  // Get grade book for a section
  async getSectionGradeBook(sectionId: number): Promise<SectionGradeBook> {
    return this.request<SectionGradeBook>(`/sections/${sectionId}/gradebook/`);
  }

  // Get assignment grade overview
  async getAssignmentGrades(assignmentId: number): Promise<{
    assignment: Assignment;
    submissions: (Submission & { 
      student_info: { 
        id: number; 
        first_name: string; 
        last_name: string; 
        email: string; 
      } 
    })[];
    stats: {
      total_students: number;
      submitted_count: number;
      graded_count: number;
      average_grade: number;
      highest_grade: number;
      lowest_grade: number;
    };
  }> {
    return this.request(`/assignments/${assignmentId}/grades/`);
  }

  // Grade a single submission
  async gradeSubmission(submissionId: number, data: GradeSubmissionForm): Promise<Submission> {
    return this.request<Submission>(`/submissions/${submissionId}/grade/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Bulk grade submissions
  async bulkGradeSubmissions(data: BulkGradeForm): Promise<{ success: number; errors: string[] }> {
    return this.request<{ success: number; errors: string[] }>('/submissions/bulk_grade/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Export grades to CSV
  async exportGrades(sectionId: number): Promise<Blob> {
    const token = this.getToken();
    const response = await fetch(`${this.baseURL}/sections/${sectionId}/gradebook/export/`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }

    return response.blob();
  }

  // Get student's grades overview
  async getStudentGrades(studentId?: number): Promise<{
    student_info?: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
    };
    grades: {
      assignment_info: Assignment;
      submission?: Submission;
      section_info: {
        id: number;
        section_name: string;
        subject_info: {
          subject_name: string;
          subject_code: string;
        };
      };
    }[];
    stats: {
      total_assignments: number;
      completed_assignments: number;
      average_grade: number;
      gpa: number;
    };
  }> {
    const endpoint = studentId ? `/students/${studentId}/grades/` : '/students/my_grades/';
    return this.request(endpoint);
  }
}

// React Query Hooks
export function useGradingApi() {
  const { data: session } = useSession();
  const api = new GradingApi(() => session?.accessToken);
  return api;
}

// Get section grade book
export function useSectionGradeBook(sectionId: number) {
  const api = useGradingApi();
  
  return useQuery({
    queryKey: ['sectionGradeBook', sectionId],
    queryFn: () => api.getSectionGradeBook(sectionId),
    enabled: !!api && !!sectionId,
  });
}

// Get assignment grades
export function useAssignmentGrades(assignmentId: number) {
  const api = useGradingApi();
  
  return useQuery({
    queryKey: ['assignmentGrades', assignmentId],
    queryFn: () => api.getAssignmentGrades(assignmentId),
    enabled: !!api && !!assignmentId,
  });
}

// Get student grades
export function useStudentGrades(studentId?: number) {
  const api = useGradingApi();
  
  return useQuery({
    queryKey: studentId ? ['studentGrades', studentId] : ['myGrades'],
    queryFn: () => api.getStudentGrades(studentId),
    enabled: !!api,
  });
}

// Grade submission mutation
export function useGradeSubmission() {
  const api = useGradingApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: GradeSubmissionForm }) => api.gradeSubmission(id, data),
    onSuccess: (gradedSubmission) => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['submission', gradedSubmission.id] });
      queryClient.invalidateQueries({ queryKey: ['assignmentGrades'] });
      queryClient.invalidateQueries({ queryKey: ['sectionGradeBook'] });
      queryClient.invalidateQueries({ queryKey: ['studentGrades'] });
      queryClient.invalidateQueries({ queryKey: ['myGrades'] });
    },
  });
}

// Bulk grade submissions mutation
export function useBulkGradeSubmissions() {
  const api = useGradingApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: BulkGradeForm) => api.bulkGradeSubmissions(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['assignmentGrades'] });
      queryClient.invalidateQueries({ queryKey: ['sectionGradeBook'] });
      queryClient.invalidateQueries({ queryKey: ['studentGrades'] });
      queryClient.invalidateQueries({ queryKey: ['myGrades'] });
    },
  });
}

// Export grades hook
export function useExportGrades() {
  const api = useGradingApi();
  
  return useMutation({
    mutationFn: (sectionId: number) => api.exportGrades(sectionId),
    onSuccess: (blob, sectionId) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `section_${sectionId}_grades.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  });
}