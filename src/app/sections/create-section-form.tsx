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
import { useCreateSection } from '@/lib/api/sections';
import { useSubjects } from '@/lib/api/subjects';
import { useProfessors } from '@/lib/api/users';
import { GraduationCap, User, Calendar, Users, BookOpen, Save } from 'lucide-react';

const createSectionSchema = z.object({
  section_name: z.string()
    .min(3, 'Section name must be at least 3 characters')
    .max(100, 'Section name must be less than 100 characters'),
  subject: z.string().min(1, 'Subject is required'),
  professor: z.string().min(1, 'Professor is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  max_students: z.string()
    .min(1, 'Maximum students is required')
    .refine(val => parseInt(val) > 0, 'Maximum students must be greater than 0')
    .refine(val => parseInt(val) <= 1000, 'Maximum students must be 1000 or less'),
}).refine((data) => {
  const startDate = new Date(data.start_date);
  const endDate = new Date(data.end_date);
  return startDate < endDate;
}, {
  message: "End date must be after start date",
  path: ["end_date"],
});

type CreateSectionFormData = z.infer<typeof createSectionSchema>;

interface CreateSectionFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateSectionForm({ onSuccess, onCancel }: CreateSectionFormProps) {
  const createSectionMutation = useCreateSection();
  const { data: subjectsData } = useSubjects({ page_size: 100 });
  const { data: professorsData } = useProfessors();

  const subjects = subjectsData?.results || [];
  const professors = professorsData || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CreateSectionFormData>({
    resolver: zodResolver(createSectionSchema),
    defaultValues: {
      max_students: '30',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
    },
  });

  const selectedSubject = watch('subject');
  const selectedProfessor = watch('professor');
  const sectionName = watch('section_name');
  const maxStudents = watch('max_students');
  const startDate = watch('start_date');
  const endDate = watch('end_date');

  const onSubmit = async (data: CreateSectionFormData) => {
    try {
      await createSectionMutation.mutateAsync({
        section_name: data.section_name,
        subject: parseInt(data.subject),
        professor: parseInt(data.professor),
        start_date: data.start_date,
        end_date: data.end_date,
        max_students: parseInt(data.max_students),
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to create section:', error);
    }
  };

  // Generate section name suggestion
  const generateSectionName = (subjectId: string, professorId: string) => {
    const subject = subjects.find(s => s.id.toString() === subjectId);
    const professor = professors.find(p => p.id.toString() === professorId);
    
    if (subject && professor) {
      return `${subject.subject_code} - ${professor.last_name}`;
    }
    return '';
  };

  const handleSubjectOrProfessorChange = () => {
    if (selectedSubject && selectedProfessor && !sectionName) {
      const suggested = generateSectionName(selectedSubject, selectedProfessor);
      setValue('section_name', suggested);
    }
  };

  const subjectOptions = subjects.map(subject => ({
    value: subject.id.toString(),
    label: `${subject.subject_code} - ${subject.subject_name}`,
  }));

  const professorOptions = professors.map(professor => ({
    value: professor.id.toString(),
    label: `${professor.first_name} ${professor.last_name}`,
  }));

  const selectedSubjectData = subjects.find(s => s.id.toString() === selectedSubject);
  const selectedProfessorData = professors.find(p => p.id.toString() === selectedProfessor);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <GraduationCap className="h-5 w-5" />
              <span>Section Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="section_name">Section Name *</Label>
              <Input
                id="section_name"
                {...register('section_name')}
                placeholder="CS101 - Smith"
                error={errors.section_name?.message}
              />
              <p className="text-xs text-gray-500">
                A descriptive name for this section
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <EnhancedSelect
                options={subjectOptions}
                value={selectedSubject}
                onValueChange={(value) => {
                  setValue('subject', value);
                  handleSubjectOrProfessorChange();
                }}
                placeholder="Select subject"
                error={errors.subject?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="professor">Professor *</Label>
              <EnhancedSelect
                options={professorOptions}
                value={selectedProfessor}
                onValueChange={(value) => {
                  setValue('professor', value);
                  handleSubjectOrProfessorChange();
                }}
                placeholder="Select professor"
                error={errors.professor?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_students">Maximum Students *</Label>
              <Input
                id="max_students"
                type="number"
                min="1"
                max="1000"
                {...register('max_students')}
                placeholder="30"
                error={errors.max_students?.message}
              />
              <p className="text-xs text-gray-500">
                Maximum number of students that can enroll
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Schedule</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                {...register('start_date')}
                error={errors.start_date?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date *</Label>
              <Input
                id="end_date"
                type="date"
                {...register('end_date')}
                error={errors.end_date?.message}
              />
            </div>

            {/* Duration calculation */}
            {startDate && endDate && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Duration</h4>
                <p className="text-sm text-blue-800">
                  {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Section Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Section Name</p>
              <p className="font-medium">{sectionName || 'Not specified'}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Subject</p>
              <p className="font-medium">{selectedSubjectData?.subject_code || 'Not selected'}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Professor</p>
              <p className="font-medium">
                {selectedProfessorData 
                  ? `${selectedProfessorData.first_name} ${selectedProfessorData.last_name}`
                  : 'Not selected'
                }
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Capacity</p>
              <p className="font-medium">{maxStudents || '0'} students</p>
            </div>
          </div>

          {/* Subject and Professor Details */}
          {(selectedSubjectData || selectedProfessorData) && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedSubjectData && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <BookOpen className="h-4 w-4 text-gray-600" />
                    <h4 className="font-medium text-gray-900">Subject Details</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    <strong>Code:</strong> {selectedSubjectData.subject_code}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Name:</strong> {selectedSubjectData.subject_name}
                  </p>
                </div>
              )}

              {selectedProfessorData && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="h-4 w-4 text-gray-600" />
                    <h4 className="font-medium text-gray-900">Professor Details</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    <strong>Name:</strong> {selectedProfessorData.first_name} {selectedProfessorData.last_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Email:</strong> {selectedProfessorData.email}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={createSectionMutation.isPending}
          className="min-w-[140px]"
        >
          <Save className="h-4 w-4 mr-2" />
          {createSectionMutation.isPending ? 'Creating...' : 'Create Section'}
        </Button>
      </div>

      {/* Error Display */}
      {createSectionMutation.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            Failed to create section: {createSectionMutation.error.message}
          </p>
        </div>
      )}
    </form>
  );
}