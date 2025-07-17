'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateSubject } from '@/lib/api/subjects';
import { BookOpen, Hash, FileText, Save } from 'lucide-react';

const createSubjectSchema = z.object({
  subject_name: z.string()
    .min(3, 'Subject name must be at least 3 characters')
    .max(200, 'Subject name must be less than 200 characters'),
  subject_code: z.string()
    .min(2, 'Subject code must be at least 2 characters')
    .max(20, 'Subject code must be less than 20 characters')
    .regex(/^[A-Z0-9-]+$/, 'Subject code can only contain uppercase letters, numbers, and hyphens')
    .refine(val => !val.startsWith('-') && !val.endsWith('-'), 'Subject code cannot start or end with a hyphen'),
});

type CreateSubjectFormData = z.infer<typeof createSubjectSchema>;

interface CreateSubjectFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateSubjectForm({ onSuccess, onCancel }: CreateSubjectFormProps) {
  const createSubjectMutation = useCreateSubject();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CreateSubjectFormData>({
    resolver: zodResolver(createSubjectSchema),
  });

  const subjectName = watch('subject_name');
  const subjectCode = watch('subject_code');

  const onSubmit = async (data: CreateSubjectFormData) => {
    try {
      await createSubjectMutation.mutateAsync(data);
      onSuccess();
    } catch (error) {
      console.error('Failed to create subject:', error);
    }
  };

  // Generate subject code suggestion from subject name
  const generateSubjectCode = (name: string) => {
    if (!name) return '';
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .split(' ')
      .map(word => word.slice(0, 4))
      .join('')
      .slice(0, 20);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (name && !subjectCode) {
      const suggested = generateSubjectCode(name);
      setValue('subject_code', suggested);
    }
  };

  const subjectCodeSuggestions = [
    'CS101', 'MATH201', 'PHYS101', 'CHEM201', 'ENG101',
    'HIST101', 'BIOL101', 'ECON101', 'PSYC101', 'STAT101'
  ];

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
                onChange={(e) => {
                  register('subject_name').onChange(e);
                  handleNameChange(e);
                }}
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

            {/* Subject Code Suggestions */}
            {!subjectCode && (
              <div className="space-y-2">
                <Label className="text-sm text-gray-600">Common Code Formats:</Label>
                <div className="flex flex-wrap gap-2">
                  {subjectCodeSuggestions.map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setValue('subject_code', code)}
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border font-mono"
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview and Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Preview & Guidelines</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Preview */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Subject Preview:</h4>
              <div className="space-y-1">
                <p className="text-sm text-blue-800">
                  <strong>Name:</strong> {subjectName || 'Enter subject name'}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Code:</strong> {subjectCode || 'Enter subject code'}
                </p>
              </div>
            </div>

            {/* Guidelines */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Subject Code Guidelines:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Use uppercase letters and numbers only</li>
                <li>• Keep it short and memorable (2-20 characters)</li>
                <li>• Follow department conventions (e.g., CS for Computer Science)</li>
                <li>• Include course level if applicable (101, 201, etc.)</li>
                <li>• Must be unique within your school</li>
              </ul>
            </div>

            {/* Examples */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Examples:</h4>
              <div className="space-y-1 text-sm text-green-800">
                <p><strong>CS101:</strong> Introduction to Computer Science</p>
                <p><strong>MATH201:</strong> Calculus II</p>
                <p><strong>PHYS101:</strong> General Physics I</p>
                <p><strong>ENG-COMP:</strong> English Composition</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Subject Name</p>
              <p className="font-medium">{subjectName || 'Not specified'}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Subject Code</p>
              <p className="font-medium font-mono">{subjectCode || 'Not specified'}</p>
            </div>
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
          disabled={createSubjectMutation.isPending}
          className="min-w-[140px]"
        >
          <Save className="h-4 w-4 mr-2" />
          {createSubjectMutation.isPending ? 'Creating...' : 'Create Subject'}
        </Button>
      </div>

      {/* Error Display */}
      {createSubjectMutation.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            Failed to create subject: {createSubjectMutation.error.message}
          </p>
        </div>
      )}
    </form>
  );
}