import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '../constants';

export interface SuperAdminDashboardData {
  stats: {
    total_schools: number;
    active_schools: number;
    total_users: number;
    active_subscriptions: number;
    revenue_this_month: number;
    growth_rate: number;
  };
  recent_schools: {
    id: number;
    name: string;
    subdomain: string;
    created_at: string;
    user_count: number;
    subscription_status: string;
  }[];
  subscription_overview: {
    plan: string;
    count: number;
    revenue: number;
  }[];
  user_growth: {
    date: string;
    new_users: number;
    total_users: number;
  }[];
  system_health: {
    database_status: 'healthy' | 'warning' | 'critical' | 'error';
    api_response_time: number;
    active_connections: number;
    memory_usage: number;
    cpu_usage: number;
    disk_usage: number;
    overall_status: 'healthy' | 'warning' | 'critical';
    system_load: {
      '1min': number;
      '5min': number;
      '15min': number;
    };
  };
}

export interface AdminDashboardData {
  stats: {
    total_users: number;
    active_users: number;
    total_sections: number;
    total_assignments: number;
    pending_submissions: number;
    average_grade: number;
  };
  recent_users: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    date_joined: string;
    is_active: boolean;
  }[];
  section_overview: {
    id: number;
    section_name: string;
    subject_name: string;
    professor_name: string;
    student_count: number;
    assignment_count: number;
    avg_grade: number;
  }[];
  assignment_stats: {
    assignment_type: string;
    count: number;
    avg_grade: number;
    completion_rate: number;
  }[];
  user_activity: {
    date: string;
    logins: number;
    submissions: number;
    assignments_created: number;
  }[];
}

export interface ProfessorDashboardData {
  stats: {
    my_sections: number;
    total_students: number;
    total_assignments: number;
    pending_grading: number;
    average_class_grade: number;
    late_submissions: number;
  };
  my_sections: {
    id: number;
    section_name: string;
    subject_name: string;
    student_count: number;
    assignment_count: number;
    pending_submissions: number;
    avg_grade: number;
    next_assignment_due?: string;
  }[];
  recent_submissions: {
    id: number;
    student_name: string;
    assignment_title: string;
    section_name: string;
    submitted_at: string;
    is_late: boolean;
    needs_grading: boolean;
  }[];
  assignment_performance: {
    assignment_title: string;
    avg_grade: number;
    completion_rate: number;
    late_rate: number;
  }[];
  upcoming_deadlines: {
    assignment_title: string;
    section_name: string;
    due_date: string;
    submission_count: number;
    total_students: number;
  }[];
  grade_distribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
}

export interface StudentDashboardData {
  stats: {
    enrolled_sections: number;
    total_assignments: number;
    completed_assignments: number;
    pending_assignments: number;
    average_grade: number;
    gpa: number;
  };
  enrolled_sections: {
    id: number;
    section_name: string;
    subject_name: string;
    subject_code: string;
    professor_name: string;
    current_grade: number;
    assignment_count: number;
    next_assignment_due?: string;
  }[];
  recent_assignments: {
    id: number;
    title: string;
    subject_name: string;
    due_date: string;
    status: 'pending' | 'submitted' | 'graded' | 'overdue';
    grade?: number;
    max_points: number;
    is_late?: boolean;
  }[];
  upcoming_deadlines: {
    id: number;
    title: string;
    section_name: string;
    due_date: string;
    max_points: number;
    hours_remaining: number;
  }[];
  grade_trends: {
    assignment_title: string;
    grade: number;
    max_points: number;
    submitted_at: string;
  }[];
  performance_by_subject: {
    subject_name: string;
    avg_grade: number;
    assignment_count: number;
    completion_rate: number;
  }[];
}

// API Functions
export class DashboardApi {
  private baseURL = `${API_BASE_URL}/api/dashboard`;

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

  // Get SuperAdmin dashboard data
  async getSuperAdminDashboard(): Promise<SuperAdminDashboardData> {
    return this.request<SuperAdminDashboardData>('/superadmin/');
  }

  // Get Admin dashboard data
  async getAdminDashboard(): Promise<AdminDashboardData> {
    return this.request<AdminDashboardData>('/admin/');
  }

  // Get Professor dashboard data
  async getProfessorDashboard(): Promise<ProfessorDashboardData> {
    return this.request<ProfessorDashboardData>('/professor/');
  }

  // Get Student dashboard data
  async getStudentDashboard(): Promise<StudentDashboardData> {
    return this.request<StudentDashboardData>('/student/');
  }

  // Get quick stats for any role
  async getQuickStats(): Promise<{
    notifications: number;
    pending_tasks: number;
    recent_activity: string;
  }> {
    return this.request('/quick-stats/');
  }

  // Get real-time system health metrics
  async getSystemHealth(): Promise<{
    overall_status: 'healthy' | 'warning' | 'critical';
    api_response_time: number;
    current_request_time: number;
    memory_usage: number;
    cpu_usage: number;
    disk_usage: number;
    database_status: 'healthy' | 'warning' | 'critical' | 'error';
    active_connections: number;
    system_load: {
      '1min': number;
      '5min': number;
      '15min': number;
    };
    network_stats: {
      bytes_sent: number;
      bytes_recv: number;
      packets_sent: number;
      packets_recv: number;
    };
    timestamp: number;
  }> {
    return this.request('/system_health/');
  }
}

// React Query Hooks
export function useDashboardApi() {
  const { data: session } = useSession();
  const api = new DashboardApi(() => session?.accessToken);
  return api;
}

// SuperAdmin dashboard hook
export function useSuperAdminDashboard() {
  const api = useDashboardApi();
  
  return useQuery({
    queryKey: ['superAdminDashboard'],
    queryFn: () => api.getSuperAdminDashboard(),
    enabled: !!api,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

// Admin dashboard hook
export function useAdminDashboard() {
  const api = useDashboardApi();
  
  return useQuery({
    queryKey: ['adminDashboard'],
    queryFn: () => api.getAdminDashboard(),
    enabled: !!api,
    refetchInterval: 5 * 60 * 1000,
  });
}

// Professor dashboard hook
export function useProfessorDashboard() {
  const api = useDashboardApi();
  
  return useQuery({
    queryKey: ['professorDashboard'],
    queryFn: () => api.getProfessorDashboard(),
    enabled: !!api,
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });
}

// Student dashboard hook
export function useStudentDashboard() {
  const api = useDashboardApi();
  
  return useQuery({
    queryKey: ['studentDashboard'],
    queryFn: () => api.getStudentDashboard(),
    enabled: !!api,
    refetchInterval: 2 * 60 * 1000,
  });
}

// Quick stats hook
export function useQuickStats() {
  const api = useDashboardApi();
  
  return useQuery({
    queryKey: ['quickStats'],
    queryFn: () => api.getQuickStats(),
    enabled: !!api,
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

// System health hook
export function useSystemHealth() {
  const api = useDashboardApi();
  
  return useQuery({
    queryKey: ['systemHealth'],
    queryFn: () => api.getSystemHealth(),
    enabled: !!api,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time monitoring
  });
}