// User role enum
export enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  PROFESSOR = 'PROFESSOR',
  STUDENT = 'STUDENT'
}

// Chat related types
export interface ChatRoom {
  id: number;
  name: string;
  room_type: 'DIRECT' | 'GROUP' | 'CLASS' | 'ANNOUNCEMENT';
  participant_count: number;
  unread_count: number;
  last_message_preview?: {
    content: string;
    sender_name: string;
    created_at: string;
  };
  last_message_at?: string;
  created_at: string;
}

export interface Message {
  id: number;
  content: string;
  sender: number;
  sender_name: string;
  sender_role: string;
  created_at: string;
  is_edited: boolean;
  edited_at?: string;
  is_system_message: boolean;
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next?: string | null;
  previous?: string | null;
}

// User related types (from backend)
export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  school?: number;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  date_joined?: string;
  school_info?: {
    name: string;
    subdomain: string;
  };
}

// Auth types
export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

// Academic types
export interface Section {
  id: number;
  name: string;
  subject_id: number;
  professor_id?: number;
  school_id: number;
  start_date: string;
  end_date: string;
  max_students: number;
  enrollment_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  description?: string;
  school_id: number;
  created_at: string;
  updated_at: string;
}

export interface Assignment {
  id: number;
  title: string;
  description: string;
  section_id: number;
  section: number;
  section_info?: {
    section_name: string;
    subject?: {
      subject_name: string;
    };
  };
  due_date: string;
  total_points: number;
  max_points?: number;
  assignment_type?: 'HOMEWORK' | 'EXAM' | 'PROJECT' | 'QUIZ';
  submissions_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: number;
  status: 'ENROLLED' | 'DROPPED' | 'COMPLETED';
  enrollment_date: string;
  grade?: number;
  student_info?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    username: string;
  };
  section_info?: {
    section_name: string;
    start_date?: string;
    end_date?: string;
    enrollment_count?: number;
    max_students?: number;
    subject_info?: {
      subject_code: string;
      subject_name: string;
    };
    professor_info?: {
      first_name: string;
      last_name: string;
    };
  };
}

export interface Subscription {
  id: number;
  plan: 'BASIC' | 'PREMIUM';
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  end_date: string;
}

export interface Submission {
  id: number;
  content?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'GRADED' | 'RETURNED';
  points_earned?: number;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
  graded_at?: string;
  feedback?: string;
  attachments?: {
    name: string;
    size: number;
    url: string;
  }[];
  assignment_info?: {
    assignment_type: 'HOMEWORK' | 'QUIZ' | 'EXAM' | 'PROJECT' | 'DISCUSSION';
    due_date: string;
    max_points: number;
    title: string;
    description: string;
    instructions?: string;
  };
  graded_by_info?: {
    first_name: string;
    last_name: string;
  };
  student_info?: {
    first_name: string;
    last_name: string;
    email: string;
    username: string;
  };
}

export interface School {
  id: number;
  name: string;
  subdomain: string;
  is_active: boolean;
  created_at: string;
  subscription?: Subscription;
}

// API Response types
export interface ApiResponse<T> {
  results: T[];
  count: number;
  next?: string | null;
  previous?: string | null;
}

export interface ApiError {
  detail?: string;
  message?: string;
  errors?: Record<string, string[]>;
}