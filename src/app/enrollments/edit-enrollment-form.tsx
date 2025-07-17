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
import { Badge } from '@/components/ui/badge';
import { useUpdateEnrollment } from '@/lib/api/enrollments';
import { useAuth } from '@/contexts/auth-context';
import { Enrollment } from '@/types';
import { format } from 'date-fns';
import { 
  UserCheck, 
  User, 
  GraduationCap,
  BookOpen,
  Calendar,
  Trophy,
  Save,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

const editEnrollmentSchema = z.object({
  status: z.enum(['ENROLLED', 'DROPPED', 'COMPLETED'] as const),
  grade: z.string().optional().refine(val => {
    if (!val) return true;
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 100;
  }, 'Grade must be between 0 and 100'),
});

type EditEnrollmentFormData = z.infer<typeof editEnrollmentSchema>;

interface EditEnrollmentFormProps {
  enrollment: Enrollment;
  onSuccess: () => void;
  onCancel: () => void;
}

const STATUS_COLORS = {
  ENROLLED: 'bg-green-100 text-green-800',
  DROPPED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
};

const STATUS_ICONS = {
  ENROLLED: CheckCircle,
  DROPPED: XCircle,
  COMPLETED: Clock,
};

export function EditEnrollmentForm({ enrollment, onSuccess, onCancel }: EditEnrollmentFormProps) {
  const { user } = useAuth();
  const updateEnrollmentMutation = useUpdateEnrollment();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<EditEnrollmentFormData>({
    resolver: zodResolver(editEnrollmentSchema),
    defaultValues: {
      status: enrollment.status,
      grade: enrollment.grade?.toString() || '',
    },
  });

  const selectedStatus = watch('status');
  const gradeValue = watch('grade');

  const onSubmit = async (data: EditEnrollmentFormData) => {
    try {
      await updateEnrollmentMutation.mutateAsync({
        id: enrollment.id,
        data: {
          status: data.status,
          grade: data.grade ? parseFloat(data.grade) : undefined,
        },
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to update enrollment:', error);
    }
  };

  const statusOptions = [
    { value: 'ENROLLED', label: 'Enrolled' },
    { value: 'DROPPED', label: 'Dropped' },
    { value: 'COMPLETED', label: 'Completed' },
  ];

  const hasChanges = 
    selectedStatus !== enrollment.status || 
    gradeValue !== (enrollment.grade?.toString() || '');

  const canGrade = user?.role === 'PROFESSOR' || user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
  const isStatusChanging = selectedStatus !== enrollment.status;

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-green-600';
    if (grade >= 80) return 'text-blue-600';
    if (grade >= 70) return 'text-yellow-600';
    if (grade >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGradeLabel = (grade: number) => {
    if (grade >= 90) return 'Excellent';
    if (grade >= 80) return 'Good';
    if (grade >= 70) return 'Satisfactory';
    if (grade >= 60) return 'Needs Improvement';
    return 'Poor';
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Student Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">
                  {enrollment.student_info.first_name} {enrollment.student_info.last_name}
                </h3>
                <p className="text-sm text-gray-600">{enrollment.student_info.email}</p>
                <p className="text-sm text-gray-500">ID: {enrollment.student_info.username}</p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Enrollment Details</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Enrolled:</strong> {format(new Date(enrollment.enrollment_date), 'PPP')}</p>
                <p><strong>Student ID:</strong> {enrollment.student_info.id}</p>
                <p><strong>Current Status:</strong> {enrollment.status}</p>
                {enrollment.grade && (
                  <p><strong>Current Grade:</strong> {enrollment.grade}%</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <GraduationCap className="h-5 w-5" />
              <span>Section Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                {enrollment.section_info.section_name}
              </h3>
              <p className="text-sm text-gray-600">
                {enrollment.section_info.subject_info.subject_code} - {enrollment.section_info.subject_info.subject_name}
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Section Details</h4>
              <div className="space-y-1 text-sm text-green-800">
                <p><strong>Professor:</strong> {enrollment.section_info.professor_info.first_name} {enrollment.section_info.professor_info.last_name}</p>
                <p><strong>Period:</strong> {format(new Date(enrollment.section_info.start_date), 'MMM d, yyyy')} - {format(new Date(enrollment.section_info.end_date), 'MMM d, yyyy')}</p>
                <p><strong>Capacity:</strong> {enrollment.section_info.enrollment_count}/{enrollment.section_info.max_students}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status and Grade Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserCheck className="h-5 w-5" />
            <span>Status & Grade Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Enrollment Status *</Label>
              <EnhancedSelect
                options={statusOptions}
                value={selectedStatus}
                onValueChange={(value) => setValue('status', value as 'ENROLLED' | 'DROPPED' | 'COMPLETED')}
                placeholder="Select status"
                error={errors.status?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade">Grade (0-100) {!canGrade && '(View Only)'}</Label>
              <div className="relative">
                <Input
                  id="grade"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  {...register('grade')}
                  placeholder="85.5"
                  disabled={!canGrade}
                  error={errors.grade?.message}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Trophy className="w-4 h-4 text-gray-400" />
                </div>
              </div>
              {!canGrade && (
                <p className="text-xs text-gray-500">
                  Only professors and administrators can modify grades
                </p>
              )}
            </div>
          </div>

          {/* Status Change Warning */}
          {isStatusChanging && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Status Change Warning
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    You are changing the enrollment status from {enrollment.status} to {selectedStatus}.
                    {selectedStatus === 'DROPPED' && ' This will remove the student from the section.'}
                    {selectedStatus === 'COMPLETED' && ' This will mark the enrollment as finished.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Grade Preview */}
          {gradeValue && !isNaN(parseFloat(gradeValue)) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">Grade Preview</p>
                  <p className="text-sm text-blue-800">
                    {getGradeLabel(parseFloat(gradeValue))}
                  </p>
                </div>
                <div className={`text-2xl font-bold ${getGradeColor(parseFloat(gradeValue))}`}>
                  {parseFloat(gradeValue).toFixed(1)}%
                </div>
              </div>
            </div>
          )}

          {/* Current vs New Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-2">Current Status</p>
              <Badge className={STATUS_COLORS[enrollment.status]}>
                {(() => {
                  const StatusIcon = STATUS_ICONS[enrollment.status];
                  return <StatusIcon className="w-3 h-3 mr-1" />;
                })()}
                {enrollment.status}
              </Badge>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-2">New Status</p>
              <Badge className={STATUS_COLORS[selectedStatus]}>
                {(() => {
                  const StatusIcon = STATUS_ICONS[selectedStatus];
                  return <StatusIcon className="w-3 h-3 mr-1" />;
                })()}
                {selectedStatus}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Changes Summary */}
      {hasChanges && (
        <Card>
          <CardHeader>
            <CardTitle>Changes Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedStatus !== enrollment.status && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="font-medium">Status:</span>
                  <span className="text-gray-500">{enrollment.status}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium">{selectedStatus}</span>
                </div>
              )}
              {gradeValue !== (enrollment.grade?.toString() || '') && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="font-medium">Grade:</span>
                  <span className="text-gray-500">{enrollment.grade || 'No grade'}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium">{gradeValue || 'No grade'}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={updateEnrollmentMutation.isPending || !hasChanges}
          className="min-w-[140px]"
        >
          <Save className="h-4 w-4 mr-2" />
          {updateEnrollmentMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Error Display */}
      {updateEnrollmentMutation.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            Failed to update enrollment: {updateEnrollmentMutation.error.message}
          </p>
        </div>
      )}

      {/* No changes message */}
      {!hasChanges && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600">
            No changes have been made to this enrollment.
          </p>
        </div>
      )}
    </form>
  );
}