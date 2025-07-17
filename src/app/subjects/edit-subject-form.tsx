'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUpdateSubject } from '@/lib/api/subjects';
import { Subject } from '@/types';
import { format } from 'date-fns';
import { BookOpen, Hash, FileText, Save, AlertTriangle } from 'lucide-react';

const editSubjectSchema = z.object({
  subject_name: z.string()
    .min(3, 'Subject name must be at least 3 characters')
    .max(200, 'Subject name must be less than 200 characters'),
  subject_code: z.string()
    .min(2, 'Subject code must be at least 2 characters')
    .max(20, 'Subject code must be less than 20 characters')
    .regex(/^[A-Z0-9-]+$/, 'Subject code can only contain uppercase letters, numbers, and hyphens')
    .refine(val => !val.startsWith('-') && !val.endsWith('-'), 'Subject code cannot start or end with a hyphen'),
});

type EditSubjectFormData = z.infer<typeof editSubjectSchema>;

interface EditSubjectFormProps {
  subject: Subject;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditSubjectForm({ subject, onSuccess, onCancel }: EditSubjectFormProps) {
  const updateSubjectMutation = useUpdateSubject();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<EditSubjectFormData>({
    resolver: zodResolver(editSubjectSchema),
    defaultValues: {
      subject_name: subject.subject_name,
      subject_code: subject.subject_code,
    },
  });

  const subjectName = watch('subject_name');
  const subjectCode = watch('subject_code');

  const onSubmit = async (data: EditSubjectFormData) => {
    try {
      await updateSubjectMutation.mutateAsync({
        id: subject.id,
        data: {
          subject_name: data.subject_name,
          subject_code: data.subject_code,
        },
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to update subject:', error);
    }
  };

  const hasChanges = 
    subjectName !== subject.subject_name || 
    subjectCode !== subject.subject_code;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>Subject Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject_name">Subject Name *</Label>
              <Input
                id="subject_name"
                {...register('subject_name')}
                placeholder="Introduction to Computer Science"
                error={errors.subject_name?.message}
              />
              <p className="text-xs text-gray-500">
                The full name of the subject as it appears in the curriculum
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject_code">Subject Code *</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="subject_code"
                  {...register('subject_code')}
                  placeholder="CS101"
                  className="pl-10"
                  error={errors.subject_code?.message}
                />
              </div>
              <p className="text-xs text-gray-500">
                Unique identifier for the subject (e.g., CS101, MATH201)
              </p>
            </div>

            {/* Warning about code changes */}
            {subjectCode !== subject.subject_code && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      Warning: Changing Subject Code
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Changing the subject code may affect existing sections, enrollments, 
                      and assignments linked to this subject. Please ensure all stakeholders 
                      are informed of this change.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subject Details and Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Subject Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current vs New Values */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Current Name</p>
                  <p className="text-sm text-gray-900">{subject.subject_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">New Name</p>
                  <p className="text-sm text-gray-900">{subjectName}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Current Code</p>
                  <p className="text-sm text-gray-900 font-mono">{subject.subject_code}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">New Code</p>
                  <p className="text-sm text-gray-900 font-mono">{subjectCode}</p>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-3">Subject Statistics</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-800">0</p>
                  <p className="text-blue-700">Active Sections</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-800">0</p>
                  <p className="text-blue-700">Enrolled Students</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-800">0</p>
                  <p className="text-blue-700">Assignments</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-800">0</p>
                  <p className="text-blue-700">Submissions</p>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Metadata</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Subject ID:</strong> {subject.id}</p>
                <p><strong>Created:</strong> {format(new Date(subject.created_at), 'PPP')}</p>
                <p><strong>Updated:</strong> {format(new Date(subject.updated_at), 'PPP')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Changes Summary */}
      {hasChanges && (
        <Card>
          <CardHeader>
            <CardTitle>Changes Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {subjectName !== subject.subject_name && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="font-medium">Name:</span>
                  <span className="text-gray-500">{subject.subject_name}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium">{subjectName}</span>
                </div>
              )}
              {subjectCode !== subject.subject_code && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="font-medium">Code:</span>
                  <span className="text-gray-500 font-mono">{subject.subject_code}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium font-mono">{subjectCode}</span>
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
          disabled={updateSubjectMutation.isPending || !hasChanges}
          className="min-w-[140px]"
        >
          <Save className="h-4 w-4 mr-2" />
          {updateSubjectMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Error Display */}
      {updateSubjectMutation.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            Failed to update subject: {updateSubjectMutation.error.message}
          </p>
        </div>
      )}

      {/* No changes message */}
      {!hasChanges && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600">
            No changes have been made to this subject.
          </p>
        </div>
      )}
    </form>
  );
}