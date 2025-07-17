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
import { useUpdateSection } from '@/lib/api/sections';
import { useSubjects } from '@/lib/api/subjects';
import { useProfessors } from '@/lib/api/users';
import { Section } from '@/types';
import { format, isAfter, isBefore } from 'date-fns';
import { 
  GraduationCap, 
  User, 
  Calendar, 
  Users, 
  BookOpen, 
  Save, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';

const editSectionSchema = z.object({
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

type EditSectionFormData = z.infer<typeof editSectionSchema>;

interface EditSectionFormProps {
  section: Section;
  onSuccess: () => void;
  onCancel: () => void;
}

const getSectionStatus = (startDate: string, endDate: string) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isBefore(now, start)) return 'upcoming';
  if (isAfter(now, end)) return 'completed';
  return 'active';
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'upcoming':
      return 'bg-blue-100 text-blue-800';
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'completed':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'upcoming':
      return Clock;
    case 'active':
      return CheckCircle;
    case 'completed':
      return AlertTriangle;
    default:
      return Clock;
  }
};

export function EditSectionForm({ section, onSuccess, onCancel }: EditSectionFormProps) {
  const updateSectionMutation = useUpdateSection();
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
  } = useForm<EditSectionFormData>({
    resolver: zodResolver(editSectionSchema),
    defaultValues: {
      section_name: section.section_name,
      subject: section.subject.toString(),
      professor: section.professor.toString(),
      start_date: section.start_date,
      end_date: section.end_date,
      max_students: section.max_students.toString(),
    },
  });

  const selectedSubject = watch('subject');
  const selectedProfessor = watch('professor');
  const sectionName = watch('section_name');
  const maxStudents = watch('max_students');
  const startDate = watch('start_date');
  const endDate = watch('end_date');

  const onSubmit = async (data: EditSectionFormData) => {
    try {
      await updateSectionMutation.mutateAsync({
        id: section.id,
        data: {
          section_name: data.section_name,
          subject: parseInt(data.subject),
          professor: parseInt(data.professor),
          start_date: data.start_date,
          end_date: data.end_date,
          max_students: parseInt(data.max_students),
        },
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to update section:', error);
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

  const currentStatus = getSectionStatus(section.start_date, section.end_date);
  const newStatus = getSectionStatus(startDate, endDate);
  const StatusIcon = getStatusIcon(currentStatus);

  const hasChanges = 
    sectionName !== section.section_name ||
    selectedSubject !== section.subject.toString() ||
    selectedProfessor !== section.professor.toString() ||
    startDate !== section.start_date ||
    endDate !== section.end_date ||
    maxStudents !== section.max_students.toString();

  const enrollmentWarning = parseInt(maxStudents) < section.enrollment_count;

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
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <EnhancedSelect
                options={subjectOptions}
                value={selectedSubject}
                onValueChange={(value) => setValue('subject', value)}
                placeholder="Select subject"
                error={errors.subject?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="professor">Professor *</Label>
              <EnhancedSelect
                options={professorOptions}
                value={selectedProfessor}
                onValueChange={(value) => setValue('professor', value)}
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
              {enrollmentWarning && (
                <div className="flex items-start space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Warning: Capacity Reduction</p>
                    <p>
                      The new maximum ({maxStudents}) is less than current enrollments ({section.enrollment_count}). 
                      This may affect enrolled students.
                    </p>
                  </div>
                </div>
              )}
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

            {/* Status and Duration */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Current Status</span>
                <Badge className={getStatusColor(currentStatus)}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                </Badge>
              </div>

              {startDate && endDate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-blue-900">Duration</p>
                  <p className="text-sm text-blue-800">
                    {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Section Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Section Statistics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{section.enrollment_count}</div>
              <div className="text-sm text-gray-600">Enrolled Students</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{section.max_students}</div>
              <div className="text-sm text-gray-600">Maximum Capacity</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {((section.enrollment_count / section.max_students) * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600">Capacity Used</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">0</div>
              <div className="text-sm text-gray-600">Assignments</div>
            </div>
          </div>

          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Section Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <p><strong>Created:</strong> {format(new Date(section.created_at), 'PPP')}</p>
                <p><strong>Updated:</strong> {format(new Date(section.updated_at), 'PPP')}</p>
              </div>
              <div>
                <p><strong>Subject:</strong> {section.subject_info.subject_name}</p>
                <p><strong>Professor:</strong> {section.professor_info.first_name} {section.professor_info.last_name}</p>
              </div>
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
              {sectionName !== section.section_name && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="font-medium">Name:</span>
                  <span className="text-gray-500">{section.section_name}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium">{sectionName}</span>
                </div>
              )}
              {selectedSubject !== section.subject.toString() && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="font-medium">Subject:</span>
                  <span className="text-gray-500">{section.subject_info.subject_name}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium">{selectedSubjectData?.subject_name}</span>
                </div>
              )}
              {selectedProfessor !== section.professor.toString() && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="font-medium">Professor:</span>
                  <span className="text-gray-500">{section.professor_info.first_name} {section.professor_info.last_name}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium">{selectedProfessorData?.first_name} {selectedProfessorData?.last_name}</span>
                </div>
              )}
              {maxStudents !== section.max_students.toString() && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="font-medium">Max Students:</span>
                  <span className="text-gray-500">{section.max_students}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium">{maxStudents}</span>
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
          disabled={updateSectionMutation.isPending || !hasChanges}
          className="min-w-[140px]"
        >
          <Save className="h-4 w-4 mr-2" />
          {updateSectionMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Error Display */}
      {updateSectionMutation.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            Failed to update section: {updateSectionMutation.error.message}
          </p>
        </div>
      )}

      {/* No changes message */}
      {!hasChanges && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600">
            No changes have been made to this section.
          </p>
        </div>
      )}
    </form>
  );
}