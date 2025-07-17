'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { EnhancedSelect } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCreateEnrollment } from '@/lib/api/enrollments';
import { useSections } from '@/lib/api/sections';
import { useStudents } from '@/lib/api/users';
import { useAuth } from '@/contexts/auth-context';
import { format, isAfter, isBefore } from 'date-fns';
import { 
  UserCheck, 
  User, 
  GraduationCap,
  BookOpen,
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Save
} from 'lucide-react';

const createEnrollmentSchema = z.object({
  student: z.string().min(1, 'Student is required'),
  section: z.string().min(1, 'Section is required'),
});

type CreateEnrollmentFormData = z.infer<typeof createEnrollmentSchema>;

interface CreateEnrollmentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateEnrollmentForm({ onSuccess, onCancel }: CreateEnrollmentFormProps) {
  const { user } = useAuth();
  const createEnrollmentMutation = useCreateEnrollment();
  const { data: sectionsData } = useSections({ page_size: 100 });
  const { data: studentsData } = useStudents();

  const sections = sectionsData?.results || [];
  const students = studentsData || [];

  const {
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CreateEnrollmentFormData>({
    resolver: zodResolver(createEnrollmentSchema),
    defaultValues: {
      student: user?.role === 'STUDENT' ? user.id.toString() : '',
      section: '',
    },
  });

  const selectedStudent = watch('student');
  const selectedSection = watch('section');

  const onSubmit = async (data: CreateEnrollmentFormData) => {
    try {
      await createEnrollmentMutation.mutateAsync({
        student: parseInt(data.student),
        section: parseInt(data.section),
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to create enrollment:', error);
    }
  };

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

  // Filter sections based on availability
  const availableSections = sections.filter(section => {
    const status = getSectionStatus(section.start_date, section.end_date);
    return status === 'upcoming' || status === 'active';
  });

  const studentOptions = students.map(student => ({
    value: student.id.toString(),
    label: `${student.first_name} ${student.last_name}`,
  }));

  const sectionOptions = availableSections.map(section => ({
    value: section.id.toString(),
    label: `${section.section_name} (${section.subject_info.subject_code})`,
  }));

  const selectedStudentData = students.find(s => s.id.toString() === selectedStudent);
  const selectedSectionData = availableSections.find(s => s.id.toString() === selectedSection);

  const canEnroll = selectedSectionData && selectedSectionData.enrollment_count < selectedSectionData.max_students;
  const isStudentRole = user?.role === 'STUDENT';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Student</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="student">Select Student *</Label>
              <EnhancedSelect
                options={studentOptions}
                value={selectedStudent}
                onValueChange={(value) => setValue('student', value)}
                placeholder="Select student"
                disabled={isStudentRole}
                error={errors.student?.message}
              />
              {isStudentRole && (
                <p className="text-xs text-gray-500">
                  Students can only enroll themselves
                </p>
              )}
            </div>

            {/* Student Details */}
            {selectedStudentData && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Student Details</h4>
                <div className="space-y-1 text-sm text-blue-800">
                  <p><strong>Name:</strong> {selectedStudentData.first_name} {selectedStudentData.last_name}</p>
                  <p><strong>Email:</strong> {selectedStudentData.email}</p>
                  <p><strong>Username:</strong> {selectedStudentData.username}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <GraduationCap className="h-5 w-5" />
              <span>Section</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="section">Select Section *</Label>
              <EnhancedSelect
                options={sectionOptions}
                value={selectedSection}
                onValueChange={(value) => setValue('section', value)}
                placeholder="Select section"
                error={errors.section?.message}
              />
              <p className="text-xs text-gray-500">
                Only active and upcoming sections are available for enrollment
              </p>
            </div>

            {/* Section Details */}
            {selectedSectionData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Section Details</h4>
                <div className="space-y-1 text-sm text-green-800">
                  <p><strong>Name:</strong> {selectedSectionData.section_name}</p>
                  <p><strong>Subject:</strong> {selectedSectionData.subject_info.subject_code} - {selectedSectionData.subject_info.subject_name}</p>
                  <p><strong>Professor:</strong> {selectedSectionData.professor_info.first_name} {selectedSectionData.professor_info.last_name}</p>
                  <p><strong>Period:</strong> {format(new Date(selectedSectionData.start_date), 'MMM d, yyyy')} - {format(new Date(selectedSectionData.end_date), 'MMM d, yyyy')}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section Status and Capacity */}
      {selectedSectionData && (
        <Card>
          <CardHeader>
            <CardTitle>Section Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  {(() => {
                    const status = getSectionStatus(selectedSectionData.start_date, selectedSectionData.end_date);
                    const StatusIcon = getStatusIcon(status);
                    return (
                      <Badge className={getStatusColor(status)}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Badge>
                    );
                  })()}
                </div>
                <p className="text-sm text-gray-600">Section Status</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedSectionData.enrollment_count} / {selectedSectionData.max_students}
                </div>
                <p className="text-sm text-gray-600">Enrollment</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {((selectedSectionData.enrollment_count / selectedSectionData.max_students) * 100).toFixed(0)}%
                </div>
                <p className="text-sm text-gray-600">Capacity</p>
              </div>
            </div>

            {/* Capacity Warning */}
            {selectedSectionData.enrollment_count >= selectedSectionData.max_students && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      Section is Full
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      This section has reached its maximum capacity of {selectedSectionData.max_students} students.
                      You cannot enroll until a spot becomes available.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Enrollment Available */}
            {canEnroll && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Enrollment Available
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      This section has {selectedSectionData.max_students - selectedSectionData.enrollment_count} available spots.
                    </p>
                  </div>
                </div>
              </div>
            )}
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
          disabled={createEnrollmentMutation.isPending || !canEnroll}
          className="min-w-[140px]"
        >
          <Save className="h-4 w-4 mr-2" />
          {createEnrollmentMutation.isPending ? 'Enrolling...' : 'Enroll Student'}
        </Button>
      </div>

      {/* Error Display */}
      {createEnrollmentMutation.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            Failed to create enrollment: {createEnrollmentMutation.error.message}
          </p>
        </div>
      )}
    </form>
  );
}