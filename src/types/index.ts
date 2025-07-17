// User roles matching Django backend
export enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  PROFESSOR = 'PROFESSOR',
  STUDENT = 'STUDENT',
}

// User interface
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  school?: School;
  is_active: boolean;
  date_joined: string;
}

// School/Organization interface
export interface School {
  id: number;
  name: string;
  subdomain: string;
  is_active: boolean;
  created_at: string;
  subscription?: Subscription;
}

// Subscription interface
export interface Subscription {
  id: number;
  school: number;
  plan: 'BASIC' | 'PREMIUM';
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELED';
  end_date: string;
}

// Academic interfaces matching backend structure
export interface Subject {
  id: number;
  subject_name: string;
  subject_code: string;
  created_at: string;
  updated_at: string;
}

export interface Section {
  id: number;
  section_name: string;
  subject: number;
  subject_info: Subject;
  professor: number;
  professor_info: User;
  start_date: string;
  end_date: string;
  max_students: number;
  enrollment_count: number;
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: number;
  student: number;
  student_info: User;
  section: number;
  section_info: Section;
  status: 'ENROLLED' | 'DROPPED' | 'COMPLETED';
  enrollment_date: string;
  grade?: number;
}

export interface Assignment {
  id: number;
  section: number;
  section_info: Section;
  title: string;
  description: string;
  instructions?: string;
  due_date: string;
  max_points: number;
  assignment_type: 'HOMEWORK' | 'QUIZ' | 'EXAM' | 'PROJECT' | 'DISCUSSION';
  created_by: number;
  created_by_info: User;
  submissions_count?: number;
  average_score?: number;
  attachments?: {
    id: number;
    name: string;
    url: string;
    size: number;
  }[];
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: number;
  assignment: number;
  assignment_info: Assignment;
  student: number;
  student_info: User;
  status: 'DRAFT' | 'SUBMITTED' | 'GRADED' | 'RETURNED';
  content: string;
  attachments?: {
    id: number;
    name: string;
    url: string;
    size: number;
    uploaded_at: string;
  }[];
  submitted_at?: string;
  points_earned?: number;
  feedback?: string;
  graded_by?: number;
  graded_by_info?: User;
  graded_at?: string;
  is_late?: boolean;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T> {
  results: T[];
  count: number;
  next?: string;
  previous?: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

// Form types
export interface LoginForm {
  username: string;
  password: string;
}

export interface CreateUserForm {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  role: UserRole;
}