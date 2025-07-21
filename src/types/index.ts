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

export interface ApiResponse<T> {
  results: T[];
  count: number;
  next?: string | null;
  previous?: string | null;
}

// User role enum
export enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  PROFESSOR = 'PROFESSOR',
  STUDENT = 'STUDENT'
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
}

// Auth types
export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

// API Response types
export interface ApiError {
  detail?: string;
  message?: string;
  errors?: Record<string, string[]>;
}

// Academic related types
export interface School {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  subscription_status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  description?: string;
  school: number;
  created_at: string;
  updated_at: string;
}

export interface Section {
  id: number;
  section_name: string;
  subject: number;
  subject_info?: {
    id: number;
    subject_name: string;
    subject_code: string;
  };
  professor: number;
  professor_info?: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
  };
  school: number;
  start_date: string;
  end_date: string;
  max_students: number;
  enrollment_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: number;
  student: number;
  section: number;
  enrollment_date: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DROPPED';
  created_at: string;
  updated_at: string;
}

export interface Assignment {
  id: number;
  title: string;
  description: string;
  section: number;
  section_info?: {
    id: number;
    section_name: string;
    subject: {
      id: number;
      subject_name: string;
      subject_code: string;
    };
  };
  due_date: string;
  total_points: number;
  created_by?: number;
  created_by_info?: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: number;
  assignment: number;
  student: number;
  content?: string;
  file_url?: string;
  submitted_at: string;
  grade?: number;
  feedback?: string;
  created_at: string;
  updated_at: string;
}