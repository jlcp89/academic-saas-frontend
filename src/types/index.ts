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
  assignment_type?: 'HOMEWORK' | 'EXAM' | 'PROJECT' | 'QUIZ';
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiError {
  detail?: string;
  message?: string;
  errors?: Record<string, string[]>;
}