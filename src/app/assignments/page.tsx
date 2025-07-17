'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { AssignmentsLayout } from '@/components/layout/main-layout';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdvancedSearch } from '@/components/ui/search-bar';
import { Modal, ConfirmDialog } from '@/components/ui/dialog';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAssignments, useDeleteAssignment, useDuplicateAssignment } from '@/lib/api/assignments';
import { useSections } from '@/lib/api/sections';
import { useAuth } from '@/contexts/auth-context';
import { Assignment, UserRole } from '@/types';
import { format, isAfter, isBefore, differenceInDays, differenceInHours } from 'date-fns';
import { 
  Plus, 
  BookOpen, 
  FileText, 
  Calendar, 
  Clock, 
  Trophy, 
  Target, 
  FileCheck,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Copy,
  Edit,
  Trash2,
  Eye,
  Timer,
  Archive,
  BarChart3
} from 'lucide-react';
import { CreateAssignmentForm } from './create-assignment-form';
import { EditAssignmentForm } from './edit-assignment-form';

const ASSIGNMENT_TYPE_CONFIG = {
  HOMEWORK: { icon: BookOpen, color: 'bg-blue-100 text-blue-800' },
  QUIZ: { icon: FileCheck, color: 'bg-green-100 text-green-800' },
  EXAM: { icon: Trophy, color: 'bg-red-100 text-red-800' },
  PROJECT: { icon: Target, color: 'bg-purple-100 text-purple-800' },
  DISCUSSION: { icon: FileText, color: 'bg-orange-100 text-orange-800' },
};

const getAssignmentStatus = (dueDate: string) => {
  const now = new Date();
  const due = new Date(dueDate);
  const hoursUntilDue = differenceInHours(due, now);
  
  if (hoursUntilDue < 0) return 'overdue';
  if (hoursUntilDue < 24) return 'due-soon';
  if (hoursUntilDue < 168) return 'upcoming';
  return 'future';
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'overdue':
      return 'bg-red-100 text-red-800';
    case 'due-soon':
      return 'bg-orange-100 text-orange-800';
    case 'upcoming':
      return 'bg-yellow-100 text-yellow-800';
    case 'future':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'overdue':
      return AlertTriangle;
    case 'due-soon':
      return Timer;
    case 'upcoming':
      return Clock;
    case 'future':
      return Calendar;
    default:
      return Clock;
  }
};

const formatTimeUntilDue = (dueDate: string) => {
  const now = new Date();
  const due = new Date(dueDate);
  const hoursUntilDue = differenceInHours(due, now);
  
  if (hoursUntilDue < 0) {
    const hoursOverdue = Math.abs(hoursUntilDue);
    if (hoursOverdue < 24) return `${hoursOverdue}h overdue`;
    return `${Math.ceil(hoursOverdue / 24)}d overdue`;
  }
  
  if (hoursUntilDue < 24) return `${hoursUntilDue}h left`;
  if (hoursUntilDue < 168) return `${Math.ceil(hoursUntilDue / 24)}d left`;
  return `${Math.ceil(hoursUntilDue / 168)}w left`;
};

export default function AssignmentsPage() {
  const router = useRouter();
  const { user, canAccess } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null);

  // Build query parameters
  const queryParams = {
    search: searchQuery || undefined,
    section: filters.section ? parseInt(filters.section) : undefined,
    assignment_type: filters.assignment_type || undefined,
    due_date_from: filters.due_date_from || undefined,
    due_date_to: filters.due_date_to || undefined,
    page_size: 20,
  };

  const { data: assignmentsData, isLoading, error, refetch } = useAssignments(queryParams);
  const { data: sectionsData } = useSections({ page_size: 100 });
  const deleteAssignmentMutation = useDeleteAssignment();
  const duplicateAssignmentMutation = useDuplicateAssignment();

  const assignments = assignmentsData?.results || [];
  const sections = sectionsData?.results || [];

  // Table columns
  const columns: ColumnDef<Assignment>[] = [
    {
      accessorKey: 'title',
      header: 'Assignment',
      cell: ({ row }) => {
        const assignment = row.original;
        const typeConfig = ASSIGNMENT_TYPE_CONFIG[assignment.assignment_type];
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
                {assignment.title}
              </div>
              <div className="text-sm text-gray-500 truncate">
                {assignment.description}
              </div>
            </div>
          </div>
        );
      },
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
            {row.original.section_info.subject_info.subject_code}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'assignment_type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.original.assignment_type;
        const typeConfig = ASSIGNMENT_TYPE_CONFIG[type];
        const TypeIcon = typeConfig.icon;
        
        return (
          <Badge className={typeConfig.color}>
            <TypeIcon className="w-3 h-3 mr-1" />
            {type}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'due_date',
      header: 'Due Date',
      cell: ({ row }) => {
        const dueDate = row.original.due_date;
        const status = getAssignmentStatus(dueDate);
        const StatusIcon = getStatusIcon(status);
        
        return (
          <div className="space-y-1">
            <div className="text-sm font-medium text-gray-900">
              {format(new Date(dueDate), 'MMM d, yyyy')}
            </div>
            <div className="text-xs text-gray-500">
              {format(new Date(dueDate), 'h:mm a')}
            </div>
            <Badge className={getStatusColor(status)}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {formatTimeUntilDue(dueDate)}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'max_points',
      header: 'Points',
      cell: ({ row }) => (
        <div className="text-center">
          <div className="text-sm font-medium text-gray-900">
            {row.original.max_points}
          </div>
          <div className="text-xs text-gray-500">points</div>
        </div>
      ),
    },
    {
      accessorKey: 'submissions_count',
      header: 'Submissions',
      cell: ({ row }) => (
        <div className="text-center">
          <div className="text-sm font-medium text-gray-900">
            {row.original.submissions_count || 0}
          </div>
          <div className="text-xs text-gray-500">submitted</div>
        </div>
      ),
    },
  ];

  const handleSearch = (query: string, filters: Record<string, string>) => {
    setSearchQuery(query);
    setFilters(filters);
  };

  const handleViewAssignment = (assignment: Assignment) => {
    router.push(`/assignments/${assignment.id}`);
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowEditForm(true);
  };

  const handleDeleteAssignment = (assignment: Assignment) => {
    setAssignmentToDelete(assignment);
    setShowDeleteDialog(true);
  };

  const handleDuplicateAssignment = async (assignment: Assignment) => {
    try {
      await duplicateAssignmentMutation.mutateAsync(assignment.id);
      refetch();
    } catch (error) {
      console.error('Failed to duplicate assignment:', error);
    }
  };

  const confirmDelete = async () => {
    if (!assignmentToDelete) return;

    try {
      await deleteAssignmentMutation.mutateAsync(assignmentToDelete.id);
      setShowDeleteDialog(false);
      setAssignmentToDelete(null);
    } catch (error) {
      console.error('Failed to delete assignment:', error);
    }
  };

  const searchFilters = [
    {
      key: 'section',
      label: 'Section',
      options: sections.map(section => ({
        value: section.id.toString(),
        label: `${section.section_name} (${section.subject_info.subject_code})`,
      })),
    },
    {
      key: 'assignment_type',
      label: 'Type',
      options: Object.entries(ASSIGNMENT_TYPE_CONFIG).map(([key, config]) => ({
        value: key,
        label: key.charAt(0) + key.slice(1).toLowerCase(),
      })),
    },
  ];

  // Statistics
  const totalAssignments = assignmentsData?.count || 0;
  const overdueCount = assignments.filter(a => getAssignmentStatus(a.due_date) === 'overdue').length;
  const dueSoonCount = assignments.filter(a => getAssignmentStatus(a.due_date) === 'due-soon').length;
  const totalSubmissions = assignments.reduce((sum, a) => sum + (a.submissions_count || 0), 0);
  const averagePoints = assignments.length > 0 
    ? assignments.reduce((sum, a) => sum + a.max_points, 0) / assignments.length 
    : 0;

  const stats = [
    {
      label: 'Total Assignments',
      value: totalAssignments,
      icon: FileText,
      color: 'text-blue-600',
    },
    {
      label: 'Overdue',
      value: overdueCount,
      icon: AlertTriangle,
      color: 'text-red-600',
    },
    {
      label: 'Due Soon',
      value: dueSoonCount,
      icon: Timer,
      color: 'text-orange-600',
    },
    {
      label: 'Submissions',
      value: totalSubmissions,
      icon: CheckCircle,
      color: 'text-green-600',
    },
  ];

  if (error) {
    return (
      <ProtectedRoute requiredRoles={[UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.PROFESSOR, UserRole.STUDENT]}>
        <AssignmentsLayout>
          <div className="text-center py-8">
            <p className="text-red-600">Error loading assignments: {error.message}</p>
            <Button onClick={() => refetch()} className="mt-4">
              Try Again
            </Button>
          </div>
        </AssignmentsLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={[UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.PROFESSOR, UserRole.STUDENT]}>
      <AssignmentsLayout>
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
              <CardTitle>Search Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <AdvancedSearch
                placeholder="Search assignments by title, description, or section..."
                onSearch={handleSearch}
                filters={searchFilters}
              />
            </CardContent>
          </Card>

          {/* Assignments Table */}
          <Card>
            <CardHeader>
              <CardTitle>Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={assignments}
                loading={isLoading}
                searchPlaceholder="Search assignments..."
                onRefresh={refetch}
                onAdd={canAccess('assignments', 'create') ? () => setShowCreateForm(true) : undefined}
                rowActions={{
                  onView: handleViewAssignment,
                  onEdit: canAccess('assignments', 'update') ? handleEditAssignment : undefined,
                  onDelete: canAccess('assignments', 'delete') ? handleDeleteAssignment : undefined,
                  customActions: [
                    {
                      icon: Copy,
                      label: 'Duplicate',
                      onClick: handleDuplicateAssignment,
                      show: () => canAccess('assignments', 'create'),
                    },
                  ],
                }}
                emptyMessage="No assignments found. Create assignments to get started."
              />
            </CardContent>
          </Card>

          {/* Create Assignment Modal */}
          <Modal
            isOpen={showCreateForm}
            onClose={() => setShowCreateForm(false)}
            title="Create New Assignment"
            size="xl"
          >
            <CreateAssignmentForm
              onSuccess={() => {
                setShowCreateForm(false);
                refetch();
              }}
              onCancel={() => setShowCreateForm(false)}
            />
          </Modal>

          {/* Edit Assignment Modal */}
          <Modal
            isOpen={showEditForm}
            onClose={() => setShowEditForm(false)}
            title="Edit Assignment"
            size="xl"
          >
            {selectedAssignment && (
              <EditAssignmentForm
                assignment={selectedAssignment}
                onSuccess={() => {
                  setShowEditForm(false);
                  setSelectedAssignment(null);
                  refetch();
                }}
                onCancel={() => {
                  setShowEditForm(false);
                  setSelectedAssignment(null);
                }}
              />
            )}
          </Modal>

          {/* Delete Confirmation Dialog */}
          <ConfirmDialog
            isOpen={showDeleteDialog}
            onClose={() => setShowDeleteDialog(false)}
            onConfirm={confirmDelete}
            title="Delete Assignment"
            description={`Are you sure you want to delete "${assignmentToDelete?.title}"? This action cannot be undone and will also delete all submissions.`}
            confirmText="Delete"
            variant="destructive"
            loading={deleteAssignmentMutation.isPending}
          />
        </div>
      </AssignmentsLayout>
    </ProtectedRoute>
  );
}