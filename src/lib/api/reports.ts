import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '../constants';

// Report Types
export interface UserReport {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_active: boolean;
  date_joined: string;
  last_login?: string;
  school_info?: {
    id: number;
    name: string;
    subdomain: string;
  };
}

export interface SectionReport {
  id: number;
  section_name: string;
  subject_name: string;
  subject_code: string;
  professor_name: string;
  student_count: number;
  assignment_count: number;
  avg_grade: number;
  completion_rate: number;
  late_submissions: number;
  created_at: string;
}

export interface AssignmentReport {
  id: number;
  title: string;
  assignment_type: string;
  max_points: number;
  due_date: string;
  section_name: string;
  subject_name: string;
  professor_name: string;
  submission_count: number;
  graded_count: number;
  avg_grade: number;
  completion_rate: number;
  late_rate: number;
  created_at: string;
}

export interface GradeReport {
  id: number;
  student_name: string;
  student_email: string;
  assignment_title: string;
  assignment_type: string;
  section_name: string;
  subject_name: string;
  points_earned: number;
  max_points: number;
  percentage: number;
  grade_letter: string;
  is_late: boolean;
  submitted_at: string;
  graded_at: string;
}

export interface EnrollmentReport {
  id: number;
  student_name: string;
  student_email: string;
  section_name: string;
  subject_name: string;
  subject_code: string;
  professor_name: string;
  enrollment_date: string;
  status: string;
  current_grade: number;
  assignment_count: number;
  completed_assignments: number;
  completion_rate: number;
}

export interface SystemReport {
  total_schools: number;
  total_users: number;
  total_sections: number;
  total_assignments: number;
  total_submissions: number;
  total_grades: number;
  user_growth: {
    date: string;
    new_users: number;
  }[];
  grade_distribution: {
    grade: string;
    count: number;
    percentage: number;
  }[];
  assignment_type_distribution: {
    type: string;
    count: number;
  }[];
  monthly_activity: {
    month: string;
    new_users: number;
    new_assignments: number;
    new_submissions: number;
  }[];
}

// API Filters
export interface ReportFilters {
  start_date?: string;
  end_date?: string;
  school_id?: number;
  section_id?: number;
  subject_id?: number;
  professor_id?: number;
  student_id?: number;
  assignment_type?: string;
  status?: string;
  role?: string;
}

// Export Types
export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  include_charts?: boolean;
  include_summary?: boolean;
}

// API Class
export class ReportsApi {
  private baseURL = `${API_BASE_URL}/api/reports`;

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

  private buildFilterQuery(filters: ReportFilters): string {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return params.toString() ? `?${params.toString()}` : '';
  }

  // User Reports
  async getUserReport(filters: ReportFilters = {}): Promise<UserReport[]> {
    const query = this.buildFilterQuery(filters);
    return this.request<UserReport[]>(`/users/${query}`);
  }

  // Section Reports
  async getSectionReport(filters: ReportFilters = {}): Promise<SectionReport[]> {
    const query = this.buildFilterQuery(filters);
    return this.request<SectionReport[]>(`/sections/${query}`);
  }

  // Assignment Reports
  async getAssignmentReport(filters: ReportFilters = {}): Promise<AssignmentReport[]> {
    const query = this.buildFilterQuery(filters);
    return this.request<AssignmentReport[]>(`/assignments/${query}`);
  }

  // Grade Reports
  async getGradeReport(filters: ReportFilters = {}): Promise<GradeReport[]> {
    const query = this.buildFilterQuery(filters);
    return this.request<GradeReport[]>(`/grades/${query}`);
  }

  // Enrollment Reports
  async getEnrollmentReport(filters: ReportFilters = {}): Promise<EnrollmentReport[]> {
    const query = this.buildFilterQuery(filters);
    return this.request<EnrollmentReport[]>(`/enrollments/${query}`);
  }

  // System Reports (SuperAdmin only)
  async getSystemReport(filters: ReportFilters = {}): Promise<SystemReport> {
    const query = this.buildFilterQuery(filters);
    return this.request<SystemReport>(`/system/${query}`);
  }

  // Export functions
  async exportReport(
    reportType: 'users' | 'sections' | 'assignments' | 'grades' | 'enrollments' | 'system',
    filters: ReportFilters = {},
    options: ExportOptions
  ): Promise<Blob> {
    const query = this.buildFilterQuery({ ...filters, type: reportType });
    const response = await fetch(`${this.baseURL}/export_csv/${query}`, {
      headers: {
        Authorization: `Bearer ${this.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }

    return response.blob();
  }

  // Download exported report
  async downloadReport(blob: Blob, filename: string): Promise<void> {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

// React Query Hooks
export function useReportsApi() {
  const { data: session } = useSession();
  const api = new ReportsApi(() => session?.accessToken);
  return api;
}

// User Report Hook
export function useUserReport(filters: ReportFilters = {}) {
  const api = useReportsApi();
  
  return useQuery({
    queryKey: ['userReport', filters],
    queryFn: () => api.getUserReport(filters),
    enabled: !!api,
  });
}

// Section Report Hook
export function useSectionReport(filters: ReportFilters = {}) {
  const api = useReportsApi();
  
  return useQuery({
    queryKey: ['sectionReport', filters],
    queryFn: () => api.getSectionReport(filters),
    enabled: !!api,
  });
}

// Assignment Report Hook
export function useAssignmentReport(filters: ReportFilters = {}) {
  const api = useReportsApi();
  
  return useQuery({
    queryKey: ['assignmentReport', filters],
    queryFn: () => api.getAssignmentReport(filters),
    enabled: !!api,
  });
}

// Grade Report Hook
export function useGradeReport(filters: ReportFilters = {}) {
  const api = useReportsApi();
  
  return useQuery({
    queryKey: ['gradeReport', filters],
    queryFn: () => api.getGradeReport(filters),
    enabled: !!api,
  });
}

// Enrollment Report Hook
export function useEnrollmentReport(filters: ReportFilters = {}) {
  const api = useReportsApi();
  
  return useQuery({
    queryKey: ['enrollmentReport', filters],
    queryFn: () => api.getEnrollmentReport(filters),
    enabled: !!api,
  });
}

// System Report Hook (SuperAdmin only)
export function useSystemReport(filters: ReportFilters = {}) {
  const api = useReportsApi();
  
  return useQuery({
    queryKey: ['systemReport', filters],
    queryFn: () => api.getSystemReport(filters),
    enabled: !!api,
  });
}