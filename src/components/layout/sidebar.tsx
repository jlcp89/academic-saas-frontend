'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  Building, 
  BookOpen, 
  Calendar, 
  UserCheck, 
  FileText, 
  PenTool, 
  Award, 
  BarChart3, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { UserRole } from '@/types';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  roles: UserRole[];
  description: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    href: '/dashboard',
    roles: ['SUPERADMIN', 'ADMIN', 'PROFESSOR', 'STUDENT'],
    description: 'Overview and statistics'
  },
  {
    id: 'schools',
    label: 'Schools',
    icon: Building,
    href: '/schools',
    roles: ['SUPERADMIN'],
    description: 'Manage schools and subscriptions'
  },
  {
    id: 'users',
    label: 'Users',
    icon: Users,
    href: '/users',
    roles: ['SUPERADMIN', 'ADMIN'],
    description: 'User management and roles'
  },
  {
    id: 'subjects',
    label: 'Subjects',
    icon: BookOpen,
    href: '/subjects',
    roles: ['SUPERADMIN', 'ADMIN'],
    description: 'Subject catalog management'
  },
  {
    id: 'sections',
    label: 'Sections',
    icon: Calendar,
    href: '/sections',
    roles: ['SUPERADMIN', 'ADMIN', 'PROFESSOR'],
    description: 'Class sections and schedules'
  },
  {
    id: 'enrollments',
    label: 'Enrollments',
    icon: UserCheck,
    href: '/enrollments',
    roles: ['SUPERADMIN', 'ADMIN', 'PROFESSOR', 'STUDENT'],
    description: 'Student enrollment management'
  },
  {
    id: 'assignments',
    label: 'Assignments',
    icon: FileText,
    href: '/assignments',
    roles: ['SUPERADMIN', 'ADMIN', 'PROFESSOR', 'STUDENT'],
    description: 'Assignment management'
  },
  {
    id: 'submissions',
    label: 'Submissions',
    icon: PenTool,
    href: '/submissions',
    roles: ['SUPERADMIN', 'ADMIN', 'PROFESSOR', 'STUDENT'],
    description: 'Student submissions'
  },
  {
    id: 'grades',
    label: 'Grades',
    icon: Award,
    href: '/grades',
    roles: ['SUPERADMIN', 'ADMIN', 'PROFESSOR'],
    description: 'Grade management'
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: BarChart3,
    href: '/reports',
    roles: ['SUPERADMIN', 'ADMIN', 'PROFESSOR'],
    description: 'Analytics and reporting'
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user, hasAnyRole } = useAuth();

  const filteredMenuItems = MENU_ITEMS.filter(item => 
    hasAnyRole(item.roles)
  );

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/login' });
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg">Academic</span>
          </div>
        )}
        
        {/* Desktop collapse button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex text-gray-400 hover:text-white hover:bg-gray-800"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
        
        {/* Mobile close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden text-gray-400 hover:text-white hover:bg-gray-800"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">
              {user?.first_name?.[0] || user?.username?.[0] || 'U'}
            </span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.first_name} {user?.last_name} || {user?.username}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {user?.role?.replace('_', ' ').toLowerCase()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              )}
              onClick={() => setIsMobileOpen(false)}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className={cn(
            'w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800',
            isCollapsed && 'justify-center'
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="ml-3">Sign Out</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 bg-gray-900 text-white hover:bg-gray-800"
      >
        <Menu className="w-4 h-4" />
      </Button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <div className={cn(
        'hidden md:flex flex-col',
        isCollapsed ? 'w-16' : 'w-64',
        'transition-all duration-300',
        className
      )}>
        <SidebarContent />
      </div>

      {/* Mobile sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 transform transition-transform md:hidden',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <SidebarContent />
      </div>
    </>
  );
}

// Hook to provide mobile menu control
export function useSidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  return {
    isMobileOpen,
    setIsMobileOpen,
    openMobile: () => setIsMobileOpen(true),
    closeMobile: () => setIsMobileOpen(false),
  };
}