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
import { useCreateUser } from '@/lib/api/users';
import { useAuth } from '@/contexts/auth-context';
import { UserRole } from '@/types';
import { Eye, EyeOff, User, Mail, Lock, Shield } from 'lucide-react';

const createUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username must be less than 50 characters'),
  email: z.string().email('Please enter a valid email address'),
  first_name: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters'),
  last_name: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password must be less than 100 characters'),
  confirmPassword: z.string(),
  role: z.nativeEnum(UserRole),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don&apos;t match",
  path: ["confirmPassword"],
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

interface CreateUserFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateUserForm({ onSuccess, onCancel }: CreateUserFormProps) {
  const { user: currentUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const createUserMutation = useCreateUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role: UserRole.STUDENT,
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: CreateUserFormData) => {
    try {
      const { confirmPassword, ...createData } = data;
      await createUserMutation.mutateAsync(createData);
      onSuccess();
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  // Role options based on current user's permissions
  const getRoleOptions = () => {
    const baseOptions = [
      { value: UserRole.STUDENT, label: 'Student' },
      { value: UserRole.PROFESSOR, label: 'Professor' },
    ];

    if (currentUser?.role === UserRole.SUPERADMIN) {
      return [
        { value: UserRole.SUPERADMIN, label: 'Super Admin' },
        { value: UserRole.ADMIN, label: 'Admin' },
        ...baseOptions,
      ];
    }

    if (currentUser?.role === UserRole.ADMIN) {
      return [
        { value: UserRole.ADMIN, label: 'Admin' },
        ...baseOptions,
      ];
    }

    return baseOptions;
  };

  const roleOptions = getRoleOptions();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Basic Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  {...register('first_name')}
                  placeholder="John"
                  error={errors.first_name?.message}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  {...register('last_name')}
                  placeholder="Doe"
                  error={errors.last_name?.message}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                {...register('username')}
                placeholder="johndoe"
                error={errors.username?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="john@example.com"
                error={errors.email?.message}
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
                onValueChange={(value) => setValue('role', value as UserRole)}
                placeholder="Select role"
                error={errors.role?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="Enter password"
                  error={errors.password?.message}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  placeholder="Confirm password"
                  error={errors.confirmPassword?.message}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Description */}
      <Card>
        <CardContent className="pt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Role: {selectedRole}</h4>
            <p className="text-sm text-blue-800">
              {selectedRole === 'SUPERADMIN' && 'Full system access including school management and system configuration.'}
              {selectedRole === 'ADMIN' && 'School administration access including user management and school settings.'}
              {selectedRole === 'PROFESSOR' && 'Teaching access including class management, assignments, and grading.'}
              {selectedRole === 'STUDENT' && 'Student access including course enrollment, assignments, and submissions.'}
            </p>
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
          disabled={createUserMutation.isPending}
          className="min-w-[120px]"
        >
          {createUserMutation.isPending ? 'Creating...' : 'Create User'}
        </Button>
      </div>

      {/* Error Display */}
      {createUserMutation.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            Failed to create user: {createUserMutation.error.message}
          </p>
        </div>
      )}
    </form>
  );
}