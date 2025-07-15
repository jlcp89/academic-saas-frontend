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

// Academic interfaces
export interface Subject {
  id: number;
  name: string;
  code: string;
  description: string;
  school: number;
  created_at: string;
}

export interface Section {
  id: number;
  subject: Subject;
  name: string;
  professor: User;
  school: number;
  created_at: string;
}

export interface Enrollment {
  id: number;
  student: User;
  section: Section;
  enrolled_at: string;
  is_active: boolean;
}

export interface Assignment {
  id: number;
  title: string;
  description: string;
  section: Section;
  due_date: string;
  max_score: number;
  created_at: string;
}

export interface Submission {
  id: number;
  assignment: Assignment;
  student: User;
  content: string;
  submitted_at: string;
  score?: number;
  feedback?: string;
  graded_at?: string;
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