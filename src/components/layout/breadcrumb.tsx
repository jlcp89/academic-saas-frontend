'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

// Route to label mapping
const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/schools': 'Schools',
  '/users': 'Users',
  '/subjects': 'Subjects',
  '/sections': 'Sections',
  '/enrollments': 'Enrollments',
  '/assignments': 'Assignments',
  '/submissions': 'Submissions',
  '/grades': 'Grades',
  '/reports': 'Reports',
  '/profile': 'Profile',
  '/settings': 'Settings',
};

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  const pathname = usePathname();
  
  // Generate breadcrumb items from current path if not provided
  const breadcrumbItems = items || generateBreadcrumbItems(pathname);

  if (breadcrumbItems.length === 0) {
    return null;
  }

  return (
    <nav className={cn('flex items-center space-x-1 text-sm', className)}>
      {/* Home link */}
      <Link
        href="/dashboard"
        className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
      >
        <Home className="w-4 h-4" />
      </Link>

      {/* Breadcrumb items */}
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          
          {item.href && !item.isActive ? (
            <Link
              href={item.href}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className={cn(
              'text-gray-900 font-medium',
              item.isActive && 'text-blue-600'
            )}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

function generateBreadcrumbItems(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [];

  let currentPath = '';
  
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;
    
    // Get label from mapping or format segment
    const label = ROUTE_LABELS[currentPath] || formatSegmentLabel(segment);
    
    items.push({
      label,
      href: isLast ? undefined : currentPath,
      isActive: isLast,
    });
  });

  return items;
}

function formatSegmentLabel(segment: string): string {
  // Handle IDs (numeric segments)
  if (/^\d+$/.test(segment)) {
    return `#${segment}`;
  }
  
  // Handle specific segments
  if (segment === 'new') {
    return 'New';
  }
  
  if (segment === 'edit') {
    return 'Edit';
  }
  
  // Format kebab-case or snake_case to title case
  return segment
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

// Hook for managing breadcrumb state
export function useBreadcrumb() {
  const pathname = usePathname();
  
  const setBreadcrumb = (items: BreadcrumbItem[]) => {
    // This could be extended to use a context or state management
    // For now, we'll rely on the pathname-based generation
    return items;
  };

  return {
    pathname,
    setBreadcrumb,
    currentItems: generateBreadcrumbItems(pathname),
  };
}

// Specific breadcrumb components for different contexts
export function UserBreadcrumb({ userId }: { userId?: string }) {
  const items: BreadcrumbItem[] = [
    { label: 'Users', href: '/users' },
  ];

  if (userId) {
    items.push({
      label: userId === 'new' ? 'New User' : `User #${userId}`,
      isActive: true,
    });
  }

  return <Breadcrumb items={items} />;
}

export function SchoolBreadcrumb({ schoolId }: { schoolId?: string }) {
  const items: BreadcrumbItem[] = [
    { label: 'Schools', href: '/schools' },
  ];

  if (schoolId) {
    items.push({
      label: schoolId === 'new' ? 'New School' : `School #${schoolId}`,
      isActive: true,
    });
  }

  return <Breadcrumb items={items} />;
}

export function SubjectBreadcrumb({ subjectId }: { subjectId?: string }) {
  const items: BreadcrumbItem[] = [
    { label: 'Subjects', href: '/subjects' },
  ];

  if (subjectId) {
    items.push({
      label: subjectId === 'new' ? 'New Subject' : `Subject #${subjectId}`,
      isActive: true,
    });
  }

  return <Breadcrumb items={items} />;
}

export function SectionBreadcrumb({ sectionId }: { sectionId?: string }) {
  const items: BreadcrumbItem[] = [
    { label: 'Sections', href: '/sections' },
  ];

  if (sectionId) {
    items.push({
      label: sectionId === 'new' ? 'New Section' : `Section #${sectionId}`,
      isActive: true,
    });
  }

  return <Breadcrumb items={items} />;
}

export function AssignmentBreadcrumb({ assignmentId }: { assignmentId?: string }) {
  const items: BreadcrumbItem[] = [
    { label: 'Assignments', href: '/assignments' },
  ];

  if (assignmentId) {
    items.push({
      label: assignmentId === 'new' ? 'New Assignment' : `Assignment #${assignmentId}`,
      isActive: true,
    });
  }

  return <Breadcrumb items={items} />;
}