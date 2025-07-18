'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { UserRole } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Shield, LogIn } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  resource?: string;
  action?: string;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  requiredRoles = [],
  resource,
  action,
  fallback,
}: ProtectedRouteProps) {
  const { user, isLoading, hasAnyRole, canAccess, isAuthenticated } = useAuth();
  const router = useRouter();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-[400px]">
          <CardHeader className="text-center">
            <LogIn className="h-12 w-12 mx-auto mb-4 text-blue-600" />
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You need to be logged in to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/auth/login')} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check role-based access
  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-[400px]">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-red-600" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don&apos;t have permission to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-sm text-gray-600">
              <p>Required roles: {requiredRoles.join(', ')}</p>
              <p>Your role: {user?.role}</p>
            </div>
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check permission-based access
  if (resource && action && !canAccess(resource, action)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-[400px]">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-orange-600" />
            <CardTitle>Insufficient Permissions</CardTitle>
            <CardDescription>
              You don&apos;t have the required permissions to {action} {resource}.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-sm text-gray-600">
              <p>Required permission: {action} {resource}</p>
              <p>Your role: {user?.role}</p>
            </div>
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // User has access, render children
  return <>{children}</>;
}

// HOC for page-level protection
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    requiredRoles?: UserRole[];
    resource?: string;
    action?: string;
  } = {}
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// Component for conditionally rendering content based on permissions
interface PermissionGateProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  resource?: string;
  action?: string;
  fallback?: React.ReactNode;
}

export function PermissionGate({
  children,
  requiredRoles = [],
  resource,
  action,
  fallback = null,
}: PermissionGateProps) {
  const { hasAnyRole, canAccess } = useAuth();

  // Check role-based access
  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return <>{fallback}</>;
  }

  // Check permission-based access
  if (resource && action && !canAccess(resource, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}