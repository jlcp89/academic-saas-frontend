'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { EnrollmentsLayout } from '@/components/layout/main-layout';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdvancedSearch } from '@/components/ui/search-bar';
import { Modal, ConfirmDialog } from '@/components/ui/dialog';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useEnrollments, useDeleteEnrollment } from '@/lib/api/enrollments';
import { useSections } from '@/lib/api/sections';
import { useStudents } from '@/lib/api/users';
import { useAuth } from '@/contexts/auth-context';
import { Enrollment, UserRole } from '@/types';
import { format } from 'date-fns';
import { 
  Plus, 
  UserCheck, 
  Users, 
  GraduationCap,
  BookOpen,
  User,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { CreateEnrollmentForm } from './create-enrollment-form';
import { EditEnrollmentForm } from './edit-enrollment-form';

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

export default function EnrollmentsPage() {
  const router = useRouter();
  const { user, canAccess } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [enrollmentToDelete, setEnrollmentToDelete] = useState<Enrollment | null>(null);

  // Build query parameters
  const queryParams = {
    search: searchQuery || undefined,
    student: filters.student ? parseInt(filters.student) : undefined,
    section: filters.section ? parseInt(filters.section) : undefined,
    status: filters.status || undefined,
    page_size: 20,
  };

  const { data: enrollmentsData, isLoading, error, refetch } = useEnrollments(queryParams);
  const { data: sectionsData } = useSections({ page_size: 100 });
  const { data: studentsData } = useStudents();
  const deleteEnrollmentMutation = useDeleteEnrollment();

  const enrollments = enrollmentsData?.results || [];
  const sections = sectionsData?.results || [];
  const students = studentsData || [];

  // Table columns
  const columns: ColumnDef<Enrollment>[] = [
    {
      accessorKey: 'student_info',
      header: 'Student',
      cell: ({ row }) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {row.original.student_info.first_name} {row.original.student_info.last_name}
            </div>
            <div className="text-sm text-gray-500">
              {row.original.student_info.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'section_info',
      header: 'Section',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-gray-900">
            {row.original.section_info.section_name}
          </div>
          <div className="text-sm text-gray-500">
            {row.original.section_info.subject_info.subject_code} - {row.original.section_info.subject_info.subject_name}
          </div>
          <div className="text-xs text-gray-400">
            Prof. {row.original.section_info.professor_info.last_name}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const StatusIcon = STATUS_ICONS[status];
        return (
          <Badge className={STATUS_COLORS[status]}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'grade',
      header: 'Grade',
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.grade !== null && row.original.grade !== undefined ? (
            <div className="text-sm font-medium text-gray-900">
              {row.original.grade}%
            </div>
          ) : (
            <div className="text-sm text-gray-500">-</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'enrollment_date',
      header: 'Enrolled',
      cell: ({ row }) => (
        <div className="text-sm text-gray-500">
          {format(new Date(row.original.enrollment_date), 'MMM d, yyyy')}
        </div>
      ),
    },
    {
      accessorKey: 'section_info.start_date',
      header: 'Section Period',
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>{format(new Date(row.original.section_info.start_date), 'MMM d')}</span>
          </div>
          <div className="text-xs text-gray-500">
            to {format(new Date(row.original.section_info.end_date), 'MMM d, yyyy')}
          </div>
        </div>
      ),
    },
  ];

  const handleSearch = (query: string, filters: Record<string, string>) => {
    setSearchQuery(query);
    setFilters(filters);
  };

  const handleViewEnrollment = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    // Could navigate to enrollment detail page
  };

  const handleEditEnrollment = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setShowEditForm(true);
  };

  const handleDeleteEnrollment = (enrollment: Enrollment) => {
    setEnrollmentToDelete(enrollment);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!enrollmentToDelete) return;

    try {
      await deleteEnrollmentMutation.mutateAsync(enrollmentToDelete.id);
      setShowDeleteDialog(false);
      setEnrollmentToDelete(null);
    } catch (error) {
      console.error('Failed to delete enrollment:', error);
    }
  };

  const searchFilters = [
    {
      key: 'student',
      label: 'Student',
      options: students.map(student => ({
        value: student.id.toString(),
        label: `${student.first_name} ${student.last_name}`,
      })),
    },
    {
      key: 'section',
      label: 'Section',
      options: sections.map(section => ({
        value: section.id.toString(),
        label: `${section.section_name} (${section.subject_info.subject_code})`,
      })),
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'ENROLLED', label: 'Enrolled' },
        { value: 'DROPPED', label: 'Dropped' },
        { value: 'COMPLETED', label: 'Completed' },
      ],
    },
  ];

  // Statistics
  const enrolledCount = enrollments.filter(e => e.status === 'ENROLLED').length;
  const droppedCount = enrollments.filter(e => e.status === 'DROPPED').length;
  const completedCount = enrollments.filter(e => e.status === 'COMPLETED').length;
  const averageGrade = enrollments
    .filter(e => e.grade !== null && e.grade !== undefined)
    .reduce((sum, e, _, arr) => sum + e.grade! / arr.length, 0);

  const stats = [
    {
      label: 'Total Enrollments',
      value: enrollmentsData?.count || 0,
      icon: UserCheck,
      color: 'text-blue-600',
    },
    {
      label: 'Active Enrollments',
      value: enrolledCount,
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      label: 'Completed',
      value: completedCount,
      icon: Clock,
      color: 'text-purple-600',
    },
    {
      label: 'Average Grade',
      value: averageGrade > 0 ? `${averageGrade.toFixed(1)}%` : 'N/A',
      icon: TrendingUp,
      color: 'text-orange-600',
    },
  ];

  if (error) {
    return (
      <ProtectedRoute requiredRoles={[UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.PROFESSOR, UserRole.STUDENT]}>
        <EnrollmentsLayout>
          <div className="text-center py-8">
            <p className="text-red-600">Error loading enrollments: {error.message}</p>
            <Button onClick={() => refetch()} className="mt-4">
              Try Again
            </Button>
          </div>
        </EnrollmentsLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={[UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.PROFESSOR, UserRole.STUDENT]}>
      <EnrollmentsLayout>
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                      <Icon className={`h-8 w-8 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Search Enrollments</CardTitle>
            </CardHeader>
            <CardContent>
              <AdvancedSearch
                placeholder="Search enrollments by student name, section, or subject..."
                onSearch={handleSearch}
                filters={searchFilters}
              />
            </CardContent>
          </Card>

          {/* Enrollments Table */}
          <Card>
            <CardHeader>
              <CardTitle>Enrollments</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={enrollments}
                loading={isLoading}
                searchPlaceholder="Search enrollments..."
                onRefresh={refetch}
                onAdd={canAccess('enrollments', 'create') ? () => setShowCreateForm(true) : undefined}
                rowActions={{
                  onView: handleViewEnrollment,
                  onEdit: canAccess('enrollments', 'update') ? handleEditEnrollment : undefined,
                  onDelete: canAccess('enrollments', 'delete') ? handleDeleteEnrollment : undefined,
                }}
                emptyMessage="No enrollments found. Students can enroll in sections to get started."
              />
            </CardContent>
          </Card>

          {/* Create Enrollment Modal */}
          <Modal
            isOpen={showCreateForm}
            onClose={() => setShowCreateForm(false)}
            title="Create New Enrollment"
            size="lg"
          >
            <CreateEnrollmentForm
              onSuccess={() => {
                setShowCreateForm(false);
                refetch();
              }}
              onCancel={() => setShowCreateForm(false)}
            />
          </Modal>

          {/* Edit Enrollment Modal */}
          <Modal
            isOpen={showEditForm}
            onClose={() => setShowEditForm(false)}
            title="Edit Enrollment"
            size="lg"
          >
            {selectedEnrollment && (
              <EditEnrollmentForm
                enrollment={selectedEnrollment}
                onSuccess={() => {
                  setShowEditForm(false);
                  setSelectedEnrollment(null);
                  refetch();
                }}
                onCancel={() => {
                  setShowEditForm(false);
                  setSelectedEnrollment(null);
                }}
              />
            )}
          </Modal>

          {/* Delete Confirmation Dialog */}
          <ConfirmDialog
            isOpen={showDeleteDialog}
            onClose={() => setShowDeleteDialog(false)}
            onConfirm={confirmDelete}
            title="Delete Enrollment"
            description={`Are you sure you want to remove ${enrollmentToDelete?.student_info.first_name} ${enrollmentToDelete?.student_info.last_name} from ${enrollmentToDelete?.section_info.section_name}? This action cannot be undone.`}
            confirmText="Delete"
            variant="destructive"
            loading={deleteEnrollmentMutation.isPending}
          />
        </div>
      </EnrollmentsLayout>
    </ProtectedRoute>
  );
}