'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Bell, 
  Search, 
  User, 
  Settings, 
  LogOut, 
  Menu,
  ChevronDown
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  className?: string;
  onMobileMenuToggle?: () => void;
}

export function Header({ 
  title, 
  subtitle, 
  className,
  onMobileMenuToggle 
}: HeaderProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications] = useState([]); // TODO: Implement notifications

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/login' });
  };

  const handleProfileClick = () => {
    router.push('/profile');
  };

  const handleSettingsClick = () => {
    router.push('/settings');
  };

  return (
    <header className={cn(
      'bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between',
      className
    )}>
      {/* Left section */}
      <div className="flex items-center space-x-4">
        {/* Mobile menu button */}
        {onMobileMenuToggle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMobileMenuToggle}
            className="md:hidden"
          >
            <Menu className="w-4 h-4" />
          </Button>
        )}

        {/* Page title */}
        <div>
          {title && (
            <h1 className="text-xl font-semibold text-gray-900">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center space-x-4">
        {/* Search */}
        <div className="hidden md:flex relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-4 h-4" />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </Button>

        {/* User profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-100">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.first_name?.[0] || user?.username?.[0] || 'U'}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-gray-900">
                  {user?.first_name} {user?.last_name} || {user?.username}
                </div>
                <div className="text-xs text-gray-500">
                  {user?.role?.replace('_', ' ').toLowerCase()}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.first_name} {user?.last_name} || {user?.username}
                </p>
                <p className="text-xs leading-none text-gray-500">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleProfileClick}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={handleSettingsClick}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

// Role-based header component
export function RoleHeader() {
  const { user } = useAuth();
  
  const getRoleTitle = () => {
    switch (user?.role) {
      case 'SUPERADMIN':
        return 'System Administration';
      case 'ADMIN':
        return 'School Administration';
      case 'PROFESSOR':
        return 'Professor Dashboard';
      case 'STUDENT':
        return 'Student Portal';
      default:
        return 'Dashboard';
    }
  };

  const getRoleSubtitle = () => {
    switch (user?.role) {
      case 'SUPERADMIN':
        return 'Manage all schools and system settings';
      case 'ADMIN':
        return `Manage ${user?.school?.name || 'school'} operations`;
      case 'PROFESSOR':
        return 'Manage your classes and students';
      case 'STUDENT':
        return 'View your courses and assignments';
      default:
        return 'Welcome back';
    }
  };

  return (
    <Header 
      title={getRoleTitle()}
      subtitle={getRoleSubtitle()}
    />
  );
}