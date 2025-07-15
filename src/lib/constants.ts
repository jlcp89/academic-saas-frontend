// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/api/auth/login/',
  REFRESH: '/api/auth/refresh/',
  
  // Superadmin
  SCHOOLS: '/api/superadmin/schools/',
  SUBSCRIPTIONS: '/api/superadmin/subscriptions/',
  
  // Users
  USERS: '/api/users/',
  
  // Academic
  SUBJECTS: '/api/subjects/',
  SECTIONS: '/api/sections/',
  ENROLLMENTS: '/api/enrollments/',
  ASSIGNMENTS: '/api/assignments/',
  SUBMISSIONS: '/api/submissions/',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
} as const;

// Role Display Names
export const ROLE_DISPLAY_NAMES = {
  SUPERADMIN: 'Super Administrator',
  ADMIN: 'School Administrator',
  PROFESSOR: 'Professor',
  STUDENT: 'Student',
} as const;