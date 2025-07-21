// Dynamic Environment Detection
function getEnvironmentConfig() {
  // For build time (SSR/SSG)
  if (typeof window === 'undefined') {
    return {
      API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
      FRONTEND_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000'
    };
  }
  
  // For client side - detect based on current hostname
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // Development server (EC2) - uses nginx proxy on port 80
  if (hostname === '52.20.22.173') {
    return {
      API_BASE_URL: 'http://52.20.22.173',
      FRONTEND_URL: 'http://52.20.22.173:3000'
    };
  }
  
  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return {
      API_BASE_URL: 'http://localhost:8000',
      FRONTEND_URL: 'http://localhost:3000'
    };
  }
  
  // Production or other environments
  return {
    API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || `${protocol}//${hostname}:8000`,
    FRONTEND_URL: process.env.NEXTAUTH_URL || `${protocol}//${hostname}:3000`
  };
}

// Get current environment configuration
const ENV_CONFIG = getEnvironmentConfig();

// API Configuration
export const API_BASE_URL = ENV_CONFIG.API_BASE_URL;

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