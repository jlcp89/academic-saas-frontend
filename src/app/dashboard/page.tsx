'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SuperAdminDashboard } from './superadmin-dashboard';
import { AdminDashboard } from './admin-dashboard';
import { ProfessorDashboard } from './professor-dashboard';
import { StudentDashboard } from './student-dashboard';
import { DashboardLayout } from '@/components/layout/main-layout';
import { useCurrentUser } from '@/lib/queries';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const { data: currentUser } = useCurrentUser();
  const router = useRouter();

  // Use fresh data from currentUser if available, fallback to auth context
  const displayUser = currentUser || user;

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!displayUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600">Please log in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  // Route to appropriate dashboard based on user role
  const renderDashboard = () => {
    switch (displayUser.role) {
      case 'SUPERADMIN':
        return <SuperAdminDashboard />;
      case 'ADMIN':
        return <AdminDashboard />;
      case 'PROFESSOR':
        return <ProfessorDashboard />;
      case 'STUDENT':
        return <StudentDashboard />;
      default:
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Invalid User Role
              </h2>
              <p className="text-gray-600">
                Your account role is not recognized. Please contact support.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Welcome back, {displayUser.first_name || displayUser.username}! Here&apos;s an overview of your academic activity.
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Role: {displayUser.role}</p>
              {displayUser.school && (
                <p className="text-sm text-gray-500">{displayUser.school.name}</p>
              )}
            </div>
          </div>
        </div>

        {/* Role-specific Dashboard */}
        {renderDashboard()}
      </div>
    </DashboardLayout>
  );
}