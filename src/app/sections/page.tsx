'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { SectionsLayout } from '@/components/layout/main-layout';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdvancedSearch } from '@/components/ui/search-bar';
import { Modal, ConfirmDialog } from '@/components/ui/dialog';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useSections, useDeleteSection } from '@/lib/api/sections';
import { useSubjects } from '@/lib/api/subjects';
import { useProfessors } from '@/lib/api/users';
import { useAuth } from '@/contexts/auth-context';
import { Section, UserRole } from '@/types';
import { format, isAfter, isBefore } from 'date-fns';
import { 
  Plus, 
  Calendar, 
  Users, 
  GraduationCap,
  BookOpen,
  User,
  CalendarDays,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { CreateSectionForm } from './create-section-form';
import { EditSectionForm } from './edit-section-form';

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
      return AlertCircle;
    default:
      return Clock;
  }
};

export default function SectionsPage() {
  const router = useRouter();
  const { user, canAccess } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null);

  // Build query parameters
  const queryParams = {
    search: searchQuery || undefined,
    subject: filters.subject ? parseInt(filters.subject) : undefined,
    professor: filters.professor ? parseInt(filters.professor) : undefined,
    page_size: 20,
  };

  const { data: sectionsData, isLoading, error, refetch } = useSections(queryParams);
  const { data: subjectsData } = useSubjects({ page_size: 100 });
  const { data: professorsData } = useProfessors();
  const deleteSectionMutation = useDeleteSection();

  const sections = sectionsData?.results || [];
  const subjects = subjectsData?.results || [];
  const professors = professorsData || [];

  // Table columns
  const columns: ColumnDef<Section>[] = [
    {
      accessorKey: 'section_name',
      header: 'Section',
      cell: ({ row }) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.original.section_name}</div>
            <div className="text-sm text-gray-500">
              {row.original.subject_info.subject_code} - {row.original.subject_info.subject_name}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'professor_info',
      header: 'Professor',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {row.original.professor_info.first_name} {row.original.professor_info.last_name}
            </div>
            <div className="text-sm text-gray-500">
              {row.original.professor_info.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'enrollment_count',
      header: 'Enrollment',
      cell: ({ row }) => (
        <div className="text-center">
          <div className="text-sm font-medium text-gray-900">
            {row.original.enrollment_count} / {row.original.max_students}
          </div>
          <div className="text-xs text-gray-500">
            {((row.original.enrollment_count / row.original.max_students) * 100).toFixed(0)}% full
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'start_date',
      header: 'Duration',
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <CalendarDays className="w-3 h-3" />
            <span>{format(new Date(row.original.start_date), 'MMM d')}</span>
          </div>
          <div className="text-xs text-gray-500">
            to {format(new Date(row.original.end_date), 'MMM d, yyyy')}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = getSectionStatus(row.original.start_date, row.original.end_date);
        const StatusIcon = getStatusIcon(status);
        return (
          <Badge className={getStatusColor(status)}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => (
        <div className="text-sm text-gray-500">
          {format(new Date(row.original.created_at), 'MMM d, yyyy')}
        </div>
      ),
    },
  ];

  const handleSearch = (query: string, filters: Record<string, string>) => {
    setSearchQuery(query);
    setFilters(filters);
  };

  const handleViewSection = (section: Section) => {
    setSelectedSection(section);
    router.push(`/sections/${section.id}`);
  };

  const handleEditSection = (section: Section) => {
    setSelectedSection(section);
    setShowEditForm(true);
  };

  const handleDeleteSection = (section: Section) => {
    setSectionToDelete(section);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!sectionToDelete) return;

    try {
      await deleteSectionMutation.mutateAsync(sectionToDelete.id);
      setShowDeleteDialog(false);
      setSectionToDelete(null);
    } catch (error) {
      console.error('Failed to delete section:', error);
    }
  };

  const searchFilters = [
    {
      key: 'subject',
      label: 'Subject',
      options: subjects.map(subject => ({
        value: subject.id.toString(),
        label: `${subject.subject_code} - ${subject.subject_name}`,
      })),
    },
    {
      key: 'professor',
      label: 'Professor',
      options: professors.map(professor => ({
        value: professor.id.toString(),
        label: `${professor.first_name} ${professor.last_name}`,
      })),
    },
  ];

  // Statistics
  const activeCount = sections.filter(s => getSectionStatus(s.start_date, s.end_date) === 'active').length;
  const upcomingCount = sections.filter(s => getSectionStatus(s.start_date, s.end_date) === 'upcoming').length;
  const completedCount = sections.filter(s => getSectionStatus(s.start_date, s.end_date) === 'completed').length;
  const totalEnrollments = sections.reduce((sum, s) => sum + s.enrollment_count, 0);

  const stats = [
    {
      label: 'Total Sections',
      value: sectionsData?.count || 0,
      icon: GraduationCap,
      color: 'text-blue-600',
    },
    {
      label: 'Active Sections',
      value: activeCount,
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      label: 'Upcoming Sections',
      value: upcomingCount,
      icon: Clock,
      color: 'text-orange-600',
    },
    {
      label: 'Total Enrollments',
      value: totalEnrollments,
      icon: Users,
      color: 'text-purple-600',
    },
  ];

  if (error) {
    return (
      <ProtectedRoute requiredRoles={[UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.PROFESSOR]}>
        <SectionsLayout>
          <div className="text-center py-8">
            <p className="text-red-600">Error loading sections: {error.message}</p>
            <Button onClick={() => refetch()} className="mt-4">
              Try Again
            </Button>
          </div>
        </SectionsLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={[UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.PROFESSOR]}>
      <SectionsLayout>
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
              <CardTitle>Search Sections</CardTitle>
            </CardHeader>
            <CardContent>
              <AdvancedSearch
                placeholder="Search sections by name, subject, or professor..."
                onSearch={handleSearch}
                filters={searchFilters}
              />
            </CardContent>
          </Card>

          {/* Sections Table */}
          <Card>
            <CardHeader>
              <CardTitle>Sections</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={sections}
                loading={isLoading}
                searchPlaceholder="Search sections..."
                onRefresh={refetch}
                onAdd={canAccess('sections', 'create') ? () => setShowCreateForm(true) : undefined}
                rowActions={{
                  onView: handleViewSection,
                  onEdit: canAccess('sections', 'update') ? handleEditSection : undefined,
                  onDelete: canAccess('sections', 'delete') ? handleDeleteSection : undefined,
                }}
                emptyMessage="No sections found. Create your first section to get started."
              />
            </CardContent>
          </Card>

          {/* Create Section Modal */}
          <Modal
            isOpen={showCreateForm}
            onClose={() => setShowCreateForm(false)}
            title="Create New Section"
            size="xl"
          >
            <CreateSectionForm
              onSuccess={() => {
                setShowCreateForm(false);
                refetch();
              }}
              onCancel={() => setShowCreateForm(false)}
            />
          </Modal>

          {/* Edit Section Modal */}
          <Modal
            isOpen={showEditForm}
            onClose={() => setShowEditForm(false)}
            title="Edit Section"
            size="xl"
          >
            {selectedSection && (
              <EditSectionForm
                section={selectedSection}
                onSuccess={() => {
                  setShowEditForm(false);
                  setSelectedSection(null);
                  refetch();
                }}
                onCancel={() => {
                  setShowEditForm(false);
                  setSelectedSection(null);
                }}
              />
            )}
          </Modal>

          {/* Delete Confirmation Dialog */}
          <ConfirmDialog
            isOpen={showDeleteDialog}
            onClose={() => setShowDeleteDialog(false)}
            onConfirm={confirmDelete}
            title="Delete Section"
            description={`Are you sure you want to delete section ${sectionToDelete?.section_name}? This action cannot be undone and will affect all enrolled students and assignments.`}
            confirmText="Delete"
            variant="destructive"
            loading={deleteSectionMutation.isPending}
          />
        </div>
      </SectionsLayout>
    </ProtectedRoute>
  );
}