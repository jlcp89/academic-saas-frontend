'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EnhancedSelect } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUpdateUser, useChangePassword } from '@/lib/api/users';
import { useAuth } from '@/contexts/auth-context';
import { User, UserRole } from '@/types';
import { Eye, EyeOff, User as UserIcon, Mail, Lock, Shield, Save } from 'lucide-react';

const editUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username must be less than 50 characters'),
  email: z.string().email('Please enter a valid email address'),
  first_name: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters'),
  last_name: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters'),
  role: z.enum(['SUPERADMIN', 'ADMIN', 'PROFESSOR', 'STUDENT'] as const),
  is_active: z.boolean(),
});

const changePasswordSchema = z.object({
  old_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password must be less than 100 characters'),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type EditUserFormData = z.infer<typeof editUserSchema>;
type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

interface EditUserFormProps {
  user: User;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditUserForm({ user, onSuccess, onCancel }: EditUserFormProps) {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const updateUserMutation = useUpdateUser();
  const changePasswordMutation = useChangePassword();

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    watch: watchProfile,
    setValue: setProfileValue,
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      is_active: user.is_active,
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const selectedRole = watchProfile('role');
  const isActive = watchProfile('is_active');

  const onSubmitProfile = async (data: EditUserFormData) => {
    try {
      await updateUserMutation.mutateAsync({
        id: user.id,
        data: {
          username: data.username,
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          role: data.role,
          is_active: data.is_active,
        },
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const onSubmitPassword = async (data: ChangePasswordFormData) => {
    try {
      await changePasswordMutation.mutateAsync({
        id: user.id,
        data: {
          old_password: data.old_password,
          new_password: data.new_password,
        },
      });
      resetPassword();
      alert('Password changed successfully');
    } catch (error) {
      console.error('Failed to change password:', error);
    }
  };

  // Role options based on current user's permissions
  const getRoleOptions = () => {
    const baseOptions = [
      { value: 'STUDENT', label: 'Student' },
      { value: 'PROFESSOR', label: 'Professor' },
    ];

    if (currentUser?.role === 'SUPERADMIN') {
      return [
        { value: 'SUPERADMIN', label: 'Super Admin' },
        { value: 'ADMIN', label: 'Admin' },
        ...baseOptions,
      ];
    }

    if (currentUser?.role === 'ADMIN') {
      return [
        { value: 'ADMIN', label: 'Admin' },
        ...baseOptions,
      ];
    }

    return baseOptions;
  };

  const roleOptions = getRoleOptions();
  const canChangeRole = currentUser?.role === 'SUPERADMIN' || (currentUser?.role === 'ADMIN' && user.role !== 'SUPERADMIN');
  const canChangeStatus = currentUser?.role === 'SUPERADMIN' || (currentUser?.role === 'ADMIN' && user.role !== 'SUPERADMIN');
  const canChangePassword = currentUser?.id === user.id || currentUser?.role === 'SUPERADMIN' || (currentUser?.role === 'ADMIN' && user.role !== 'SUPERADMIN');

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'profile'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Profile Information
        </button>
        {canChangePassword && (
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'password'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Change Password
          </button>
        )}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserIcon className="h-5 w-5" />
                  <span>Basic Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      {...registerProfile('first_name')}
                      placeholder="John"
                      error={profileErrors.first_name?.message}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      {...registerProfile('last_name')}
                      placeholder="Doe"
                      error={profileErrors.last_name?.message}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    {...registerProfile('username')}
                    placeholder="johndoe"
                    error={profileErrors.username?.message}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...registerProfile('email')}
                    placeholder="john@example.com"
                    error={profileErrors.email?.message}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Account Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <EnhancedSelect
                    options={roleOptions}
                    value={selectedRole}
                    onValueChange={(value) => setProfileValue('role', value as UserRole)}
                    placeholder="Select role"
                    disabled={!canChangeRole}
                    error={profileErrors.role?.message}
                  />
                  {!canChangeRole && (
                    <p className="text-xs text-gray-500">
                      You don't have permission to change this user's role
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="is_active">Status</Label>
                  <EnhancedSelect
                    options={[
                      { value: 'true', label: 'Active' },
                      { value: 'false', label: 'Inactive' },
                    ]}
                    value={isActive ? 'true' : 'false'}
                    onValueChange={(value) => setProfileValue('is_active', value === 'true')}
                    disabled={!canChangeStatus}
                  />
                  {!canChangeStatus && (
                    <p className="text-xs text-gray-500">
                      You don't have permission to change this user's status
                    </p>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>User ID:</strong> {user.id}
                  </p>
                  <p className="text-sm text-blue-800">
                    <strong>Joined:</strong> {new Date(user.date_joined).toLocaleDateString()}
                  </p>
                  {user.school && (
                    <p className="text-sm text-blue-800">
                      <strong>School:</strong> {user.school.name}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateUserMutation.isPending}
              className="min-w-[120px]"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>

          {/* Error Display */}
          {updateUserMutation.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                Failed to update user: {updateUserMutation.error.message}
              </p>
            </div>
          )}
        </form>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && canChangePassword && (
        <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="h-5 w-5" />
                <span>Change Password</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="old_password">Current Password *</Label>
                <div className="relative">
                  <Input
                    id="old_password"
                    type={showPasswords.old ? 'text' : 'password'}
                    {...registerPassword('old_password')}
                    placeholder="Enter current password"
                    error={passwordErrors.old_password?.message}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setShowPasswords(prev => ({ ...prev, old: !prev.old }))}
                  >
                    {showPasswords.old ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_password">New Password *</Label>
                <div className="relative">
                  <Input
                    id="new_password"
                    type={showPasswords.new ? 'text' : 'password'}
                    {...registerPassword('new_password')}
                    placeholder="Enter new password"
                    error={passwordErrors.new_password?.message}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm New Password *</Label>
                <div className="relative">
                  <Input
                    id="confirm_password"
                    type={showPasswords.confirm ? 'text' : 'password'}
                    {...registerPassword('confirm_password')}
                    placeholder="Confirm new password"
                    error={passwordErrors.confirm_password?.message}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Password Requirements:</strong>
                </p>
                <ul className="text-sm text-yellow-800 mt-1 ml-4 list-disc">
                  <li>At least 8 characters long</li>
                  <li>Mix of uppercase and lowercase letters</li>
                  <li>At least one number</li>
                  <li>At least one special character</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={changePasswordMutation.isPending}
              className="min-w-[140px]"
            >
              <Lock className="h-4 w-4 mr-2" />
              {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
            </Button>
          </div>

          {/* Error Display */}
          {changePasswordMutation.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                Failed to change password: {changePasswordMutation.error.message}
              </p>
            </div>
          )}
        </form>
      )}
    </div>
  );
}