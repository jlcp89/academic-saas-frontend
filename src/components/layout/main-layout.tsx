'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { Breadcrumb } from './breadcrumb';
import { ProtectedRoute } from '@/components/auth/protected-route';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showBreadcrumb?: boolean;
  className?: string;
}

export function MainLayout({ 
  children, 
  title, 
  subtitle, 
  showBreadcrumb = true,
  className 
}: MainLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Don't show layout on auth pages
  if (pathname.startsWith('/auth/')) {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar className="flex-shrink-0" />

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <Header 
            title={title}
            subtitle={subtitle}
            onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />

          {/* Breadcrumb */}
          {showBreadcrumb && (
            <div className="bg-white border-b border-gray-200 px-4 py-2">
              <Breadcrumb />
            </div>
          )}

          {/* Page content */}
          <main className={cn(
            'flex-1 overflow-auto p-4',
            className
          )}>
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

// Specific layout components for different pages
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <MainLayout 
      title="Dashboard"
      subtitle="Overview of your academic management system"
      showBreadcrumb={false}
    >
      {children}
    </MainLayout>
  );
}

export function UsersLayout({ children }: { children: React.ReactNode }) {
  return (
    <MainLayout 
      title="User Management"
      subtitle="Manage users, roles, and permissions"
    >
      {children}
    </MainLayout>
  );
}

export function SchoolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <MainLayout 
      title="School Management"
      subtitle="Manage schools and subscriptions"
    >
      {children}
    </MainLayout>
  );
}

export function SubjectsLayout({ children }: { children: React.ReactNode }) {
  return (
    <MainLayout 
      title="Subject Management"
      subtitle="Manage academic subjects and courses"
    >
      {children}
    </MainLayout>
  );
}

export function SectionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <MainLayout 
      title="Section Management"
      subtitle="Manage class sections and schedules"
    >
      {children}
    </MainLayout>
  );
}

export function EnrollmentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <MainLayout 
      title="Enrollment Management"
      subtitle="Manage student enrollments"
    >
      {children}
    </MainLayout>
  );
}

export function AssignmentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <MainLayout 
      title="Assignment Management"
      subtitle="Create and manage assignments"
    >
      {children}
    </MainLayout>
  );
}

export function SubmissionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <MainLayout 
      title="Submission Management"
      subtitle="View and manage student submissions"
    >
      {children}
    </MainLayout>
  );
}

export function GradesLayout({ children }: { children: React.ReactNode }) {
  return (
    <MainLayout 
      title="Grade Management"
      subtitle="Grade assignments and manage student progress"
    >
      {children}
    </MainLayout>
  );
}

export function ReportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <MainLayout 
      title="Reports & Analytics"
      subtitle="View reports and performance analytics"
    >
      {children}
    </MainLayout>
  );
}