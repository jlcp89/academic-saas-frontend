'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EnhancedSelect } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateUser } from '@/lib/api/users';
import { useSchools } from '@/lib/api/schools';
import { useAuth } from '@/contexts/auth-context';
import { UserRole } from '@/types';
import { Eye, EyeOff, User, Mail, Lock, Shield } from 'lucide-react';

// Local form schema with only the fields we need
const createUserFormSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username must be less than 50 characters'),
  email: z.string().email('Please enter a valid email address'),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password must be less than 100 characters'),
  confirmPassword: z.string(),
  role: z.nativeEnum(UserRole),
  schoolId: z.string().optional(),
  phone: z.string().optional(),
}).superRefine((data, ctx) => {
  // Validate school is required for non-superadmin users
  if (data.role !== 'SUPERADMIN' && !data.schoolId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'School is required for non-superadmin users',
      path: ['schoolId'],
    });
  }
  
  // Validate passwords match
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Passwords don't match",
      path: ["confirmPassword"],
    });
  }
});

type CreateUserFormData = z.infer<typeof createUserFormSchema>;


interface CreateUserFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateUserForm({ onSuccess, onCancel }: CreateUserFormProps) {
  const { user: currentUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const createUserMutation = useCreateUser();
  
  // Load schools for SUPERADMIN
  const { data: schoolsData } = useSchools({ is_active: true });
  const schools = schoolsData?.results || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: {
      role: UserRole.STUDENT,
      schoolId: currentUser?.school?.toString() || '',
      phone: '',
    },
  });

  const selectedRole = watch('role');

  // Auto-assign school for ADMIN users
  useEffect(() => {
    if (currentUser?.role === UserRole.ADMIN && currentUser?.school) {
      setValue('schoolId', currentUser.school.toString());
    }
  }, [currentUser, setValue]);

  const onSubmit = async (data: CreateUserFormData) => {
    try {
      const { confirmPassword, ...formData } = data;
      
      // Transform form data to match API expectations
      const createData = {
        ...formData,
        confirmPassword, // API expects confirmPassword
        isActive: true, // Default value
        sendWelcomeEmail: true, // Default value
        // For ADMIN users, ensure school is set to their school
        schoolId: currentUser?.role === UserRole.ADMIN 
          ? currentUser.school?.toString() 
          : formData.schoolId,
      };
      
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
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  {...register('firstName')}
                  placeholder="John"
                  />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  {...register('lastName')}
                  placeholder="Doe"
                  />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                {...register('username')}
                placeholder="johndoe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="john@example.com"
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

            {/* School selection - only show for non-superadmin roles */}
            {selectedRole !== 'SUPERADMIN' && (
              <div className="space-y-2">
                <Label htmlFor="schoolId">School *</Label>
                {currentUser?.role === UserRole.ADMIN ? (
                  // For ADMIN users, show current school as read-only
                  <Input
                    id="schoolId"
                    value={currentUser.school_info?.name || 'Current School'}
                    disabled
                    className="bg-gray-50"
                  />
                ) : (
                  // For SUPERADMIN users, show school selection
                  <EnhancedSelect
                    options={schools.map(school => ({
                      value: school.id.toString(),
                      label: school.name
                    }))}
                    value={watch('schoolId')}
                    onValueChange={(value) => setValue('schoolId', value)}
                    placeholder="Select school"
                    error={errors.schoolId?.message}
                  />
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="Enter password"
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
              {selectedRole === 'SUPERADMIN' && 'Full system access including school management and system configuration. No school assignment required.'}
              {selectedRole === 'ADMIN' && 'School administration access including user management and school settings. Will be assigned to your current school.'}
              {selectedRole === 'PROFESSOR' && 'Teaching access including class management, assignments, and grading. Requires school assignment.'}
              {selectedRole === 'STUDENT' && 'Student access including course enrollment, assignments, and submissions. Requires school assignment.'}
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