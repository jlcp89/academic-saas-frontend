'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  isAuthenticated: boolean;
  canAccess: (resource: string, action: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Permission mapping based on roles
const PERMISSIONS = {
  SUPERADMIN: {
    schools: ['create', 'read', 'update', 'delete', 'activate', 'deactivate'],
    subscriptions: ['create', 'read', 'update', 'delete', 'renew'],
    users: ['create', 'read', 'update', 'delete'],
    subjects: ['create', 'read', 'update', 'delete'],
    sections: ['create', 'read', 'update', 'delete'],
    enrollments: ['create', 'read', 'update', 'delete'],
    assignments: ['create', 'read', 'update', 'delete'],
    submissions: ['create', 'read', 'update', 'delete', 'grade'],
  },
  ADMIN: {
    users: ['create', 'read', 'update', 'delete'],
    subjects: ['create', 'read', 'update', 'delete'],
    sections: ['create', 'read', 'update', 'delete'],
    enrollments: ['create', 'read', 'update', 'delete'],
    assignments: ['create', 'read', 'update', 'delete'],
    submissions: ['read', 'update', 'delete', 'grade'],
  },
  PROFESSOR: {
    users: ['read'], // Can view students and other professors
    subjects: ['read'],
    sections: ['read', 'update'], // Can update their own sections
    enrollments: ['read'],
    assignments: ['create', 'read', 'update', 'delete'], // For their sections
    submissions: ['read', 'update', 'grade'], // For their assignments
  },
  STUDENT: {
    users: ['read'], // Can view professors and other students
    subjects: ['read'],
    sections: ['read'],
    enrollments: ['create', 'read'], // Can enroll and view their enrollments
    assignments: ['read'],
    submissions: ['create', 'read', 'update'], // Can submit and view their submissions
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') {
      setIsLoading(true);
      return;
    }

    if (status === 'authenticated' && session?.user) {
      setUser(session.user);
    } else {
      setUser(null);
    }

    setIsLoading(false);
  }, [session, status]);

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  const isAuthenticated = !!user;

  const canAccess = (resource: string, action: string): boolean => {
    if (!user) return false;

    const rolePermissions = PERMISSIONS[user.role];
    if (!rolePermissions) return false;

    const resourcePermissions = rolePermissions[resource as keyof typeof rolePermissions];
    if (!resourcePermissions) return false;

    return resourcePermissions.includes(action);
  };

  const contextValue: AuthContextType = {
    user,
    isLoading,
    hasRole,
    hasAnyRole,
    isAuthenticated,
    canAccess,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for role-based access control
export function usePermissions() {
  const { user, canAccess } = useAuth();

  const checkPermission = (resource: string, action: string): boolean => {
    return canAccess(resource, action);
  };

  const getPermissions = (resource: string): string[] => {
    if (!user) return [];

    const rolePermissions = PERMISSIONS[user.role];
    if (!rolePermissions) return [];

    const resourcePermissions = rolePermissions[resource as keyof typeof rolePermissions];
    return resourcePermissions || [];
  };

  return {
    checkPermission,
    getPermissions,
    userRole: user?.role,
  };
}