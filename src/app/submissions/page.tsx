'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { SubmissionsLayout } from '@/components/layout/main-layout';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdvancedSearch } from '@/components/ui/search-bar';
import { Modal, ConfirmDialog } from '@/components/ui/dialog';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useSubmissions, useDeleteSubmission } from '@/lib/api/submissions';
import { useAssignments } from '@/lib/api/assignments';
import { useStudents } from '@/lib/api/users';
import { useAuth } from '@/contexts/auth-context';
import { Submission, Assignment, UserRole } from '@/types';
import { format, differenceInHours, isAfter } from 'date-fns';
import { 
  Plus, 
  FileText, 
  Calendar, 
  Clock, 
  User, 
  GraduationCap,
  CheckCircle,
  AlertTriangle,
  Timer,
  Award,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Download,
  Send,
  FileCheck,
  BookOpen,
  Trophy,
  Target
} from 'lucide-react';
import { CreateSubmissionForm } from './create-submission-form';
import { EditSubmissionForm } from './edit-submission-form';

const SUBMISSION_STATUS_CONFIG = {
  DRAFT: { icon: Edit, color: 'bg-gray-100 text-gray-800', label: 'Draft' },
  SUBMITTED: { icon: Send, color: 'bg-blue-100 text-blue-800', label: 'Submitted' },
  GRADED: { icon: Award, color: 'bg-green-100 text-green-800', label: 'Graded' },
  RETURNED: { icon: FileCheck, color: 'bg-purple-100 text-purple-800', label: 'Returned' },
};

const ASSIGNMENT_TYPE_CONFIG = {
  HOMEWORK: { icon: BookOpen, color: 'bg-blue-100 text-blue-800' },
  QUIZ: { icon: FileCheck, color: 'bg-green-100 text-green-800' },
  EXAM: { icon: Trophy, color: 'bg-red-100 text-red-800' },
  PROJECT: { icon: Target, color: 'bg-purple-100 text-purple-800' },
  DISCUSSION: { icon: FileText, color: 'bg-orange-100 text-orange-800' },
};

const getSubmissionDueStatus = (submission: Submission) => {
  const dueDate = new Date(submission.assignment_info.due_date);
  const submittedDate = submission.submitted_at ? new Date(submission.submitted_at) : null;
  
  if (submission.status === 'DRAFT') return 'draft';
  if (!submittedDate) return 'not-submitted';
  
  return isAfter(submittedDate, dueDate) ? 'late' : 'on-time';
};

const getDueStatusColor = (status: string) => {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    case 'on-time':
      return 'bg-green-100 text-green-800';
    case 'late':
      return 'bg-red-100 text-red-800';
    case 'not-submitted':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function SubmissionsPage() {
  const router = useRouter();
  const { user, canAccess } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState<Submission | null>(null);

  // Build query parameters
  const queryParams = {
    search: searchQuery || undefined,
    assignment: filters.assignment ? parseInt(filters.assignment) : undefined,
    student: filters.student ? parseInt(filters.student) : undefined,
    status: filters.status || undefined,
    page_size: 20,
  };

  const { data: submissionsData, isLoading, error, refetch } = useSubmissions(queryParams);
  const { data: assignmentsData } = useAssignments({ page_size: 100 });
  const { data: studentsData } = useStudents();
  const deleteSubmissionMutation = useDeleteSubmission();

  const submissions = submissionsData?.results || [];
  const assignments = assignmentsData?.results || [];
  const students = studentsData || [];

  // Table columns
  const columns: ColumnDef<Submission>[] = [
    {
      accessorKey: 'assignment_info',
      header: 'Assignment',
      cell: ({ row }) => {
        const submission = row.original;
        const typeConfig = ASSIGNMENT_TYPE_CONFIG[submission.assignment_info.assignment_type];
        const TypeIcon = typeConfig.icon;
        
        return (
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeConfig.color}`}>
                <TypeIcon className="w-5 h-5" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-900 truncate">
                {submission.assignment_info.title}
              </div>
              <div className="text-sm text-gray-500 truncate">
                {submission.assignment_info.section_info.subject_info.subject_code} - {submission.assignment_info.section_info.section_name}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'student_info',
      header: 'Student',
      cell: ({ row }) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
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
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const statusConfig = SUBMISSION_STATUS_CONFIG[status];
        const StatusIcon = statusConfig.icon;
        
        return (
          <Badge className={statusConfig.color}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusConfig.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'submitted_at',
      header: 'Submitted',
      cell: ({ row }) => {
        const submission = row.original;
        const dueStatus = getSubmissionDueStatus(submission);
        
        return (
          <div className="space-y-1">
            {submission.submitted_at ? (
              <>
                <div className="text-sm font-medium text-gray-900">
                  {format(new Date(submission.submitted_at), 'MMM d, yyyy')}
                </div>
                <div className="text-xs text-gray-500">
                  {format(new Date(submission.submitted_at), 'h:mm a')}
                </div>
                <Badge className={getDueStatusColor(dueStatus)}>
                  {dueStatus === 'late' ? 'Late' : dueStatus === 'on-time' ? 'On Time' : 'Draft'}
                </Badge>
              </>
            ) : (
              <Badge className="bg-gray-100 text-gray-800">
                Not Submitted
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'points_earned',
      header: 'Grade',
      cell: ({ row }) => {
        const submission = row.original;
        
        return (
          <div className="text-center">
            {submission.points_earned !== null && submission.points_earned !== undefined ? (
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {submission.points_earned} / {submission.assignment_info.max_points}
                </div>
                <div className="text-xs text-gray-500">
                  {((submission.points_earned / submission.assignment_info.max_points) * 100).toFixed(1)}%
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">-</div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'assignment_info.due_date',
      header: 'Due Date',
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>{format(new Date(row.original.assignment_info.due_date), 'MMM d')}</span>
          </div>
          <div className="text-xs text-gray-500">
            {format(new Date(row.original.assignment_info.due_date), 'h:mm a')}
          </div>
        </div>
      ),
    },
  ];

  const handleSearch = (query: string, filters: Record<string, string>) => {
    setSearchQuery(query);
    setFilters(filters);
  };

  const handleViewSubmission = (submission: Submission) => {
    router.push(`/submissions/${submission.id}`);
  };

  const handleEditSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setShowEditForm(true);
  };

  const handleDeleteSubmission = (submission: Submission) => {
    setSubmissionToDelete(submission);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!submissionToDelete) return;

    try {
      await deleteSubmissionMutation.mutateAsync(submissionToDelete.id);
      setShowDeleteDialog(false);
      setSubmissionToDelete(null);
    } catch (error) {
      console.error('Failed to delete submission:', error);
    }
  };

  const searchFilters = [
    {
      key: 'assignment',
      label: 'Assignment',
      options: assignments.map(assignment => ({
        value: assignment.id.toString(),
        label: assignment.title,
      })),
    },
    {
      key: 'student',
      label: 'Student',
      options: students.map(student => ({
        value: student.id.toString(),
        label: `${student.first_name} ${student.last_name}`,
      })),
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'DRAFT', label: 'Draft' },
        { value: 'SUBMITTED', label: 'Submitted' },
        { value: 'GRADED', label: 'Graded' },
        { value: 'RETURNED', label: 'Returned' },
      ],
    },
  ];

  // Statistics
  const totalSubmissions = submissionsData?.count || 0;
  const draftCount = submissions.filter(s => s.status === 'DRAFT').length;
  const submittedCount = submissions.filter(s => s.status === 'SUBMITTED').length;
  const gradedCount = submissions.filter(s => s.status === 'GRADED' || s.status === 'RETURNED').length;
  const lateCount = submissions.filter(s => getSubmissionDueStatus(s) === 'late').length;

  const stats = [
    {
      label: 'Total Submissions',
      value: totalSubmissions,
      icon: FileText,
      color: 'text-blue-600',
    },
    {
      label: 'Drafts',
      value: draftCount,
      icon: Edit,
      color: 'text-gray-600',
    },
    {
      label: 'Submitted',
      value: submittedCount,
      icon: Send,
      color: 'text-green-600',
    },
    {
      label: 'Graded',
      value: gradedCount,
      icon: Award,
      color: 'text-purple-600',
    },
  ];

  if (error) {
    return (
      <ProtectedRoute requiredRoles={[UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.PROFESSOR, UserRole.STUDENT]}>
        <SubmissionsLayout>
          <div className="text-center py-8">
            <p className="text-red-600">Error loading submissions: {error.message}</p>
            <Button onClick={() => refetch()} className="mt-4">
              Try Again
            </Button>
          </div>
        </SubmissionsLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={[UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.PROFESSOR, UserRole.STUDENT]}>
      <SubmissionsLayout>
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
              <CardTitle>Search Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <AdvancedSearch
                placeholder="Search submissions by assignment, student, or content..."
                onSearch={handleSearch}
                filters={searchFilters}
              />
            </CardContent>
          </Card>

          {/* Submissions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={submissions}
                loading={isLoading}
                searchPlaceholder="Search submissions..."
                onRefresh={refetch}
                onAdd={user?.role === 'STUDENT' ? () => setShowCreateForm(true) : undefined}
                rowActions={{
                  onView: handleViewSubmission,
                  onEdit: canAccess('submissions', 'update') ? handleEditSubmission : undefined,
                  onDelete: canAccess('submissions', 'delete') ? handleDeleteSubmission : undefined,
                }}
                emptyMessage="No submissions found. Students can submit assignments to get started."
              />
            </CardContent>
          </Card>

          {/* Create Submission Modal */}
          <Modal
            isOpen={showCreateForm}
            onClose={() => setShowCreateForm(false)}
            title="Create New Submission"
            size="xl"
          >
            <CreateSubmissionForm
              assignment={selectedSubmission?.assignment_info || {} as Assignment}
              onSuccess={() => {
                setShowCreateForm(false);
                refetch();
              }}
              onCancel={() => setShowCreateForm(false)}
            />
          </Modal>

          {/* Edit Submission Modal */}
          <Modal
            isOpen={showEditForm}
            onClose={() => setShowEditForm(false)}
            title="Edit Submission"
            size="xl"
          >
            {selectedSubmission && (
              <EditSubmissionForm
                submission={selectedSubmission}
                onSuccess={() => {
                  setShowEditForm(false);
                  setSelectedSubmission(null);
                  refetch();
                }}
                onCancel={() => {
                  setShowEditForm(false);
                  setSelectedSubmission(null);
                }}
              />
            )}
          </Modal>

          {/* Delete Confirmation Dialog */}
          <ConfirmDialog
            isOpen={showDeleteDialog}
            onClose={() => setShowDeleteDialog(false)}
            onConfirm={confirmDelete}
            title="Delete Submission"
            description={`Are you sure you want to delete this submission for "${submissionToDelete?.assignment_info.title}"? This action cannot be undone.`}
            confirmText="Delete"
            variant="destructive"
            loading={deleteSubmissionMutation.isPending}
          />
        </div>
      </SubmissionsLayout>
    </ProtectedRoute>
  );
}