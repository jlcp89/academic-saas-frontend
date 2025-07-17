'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { SubjectsLayout } from '@/components/layout/main-layout';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdvancedSearch } from '@/components/ui/search-bar';
import { Modal, ConfirmDialog } from '@/components/ui/dialog';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useSubjects, useDeleteSubject } from '@/lib/api/subjects';
import { useAuth } from '@/contexts/auth-context';
import { Subject } from '@/types';
import { format } from 'date-fns';
import { 
  Plus, 
  BookOpen, 
  Calendar, 
  Users, 
  Hash,
  GraduationCap,
  FileText,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { CreateSubjectForm } from './create-subject-form';
import { EditSubjectForm } from './edit-subject-form';

export default function SubjectsPage() {
  const router = useRouter();
  const { user, canAccess } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);

  // Build query parameters
  const queryParams = {
    search: searchQuery || undefined,
    subject_code: filters.subject_code || undefined,
    page_size: 20,
  };

  const { data: subjectsData, isLoading, error, refetch } = useSubjects(queryParams);
  const deleteSubjectMutation = useDeleteSubject();

  const subjects = subjectsData?.results || [];

  // Table columns
  const columns: ColumnDef<Subject>[] = [
    {
      accessorKey: 'subject_code',
      header: 'Code',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
            <Hash className="w-5 h-5 text-white" />
          </div>
          <span className="font-mono font-medium text-gray-900">
            {row.original.subject_code}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'subject_name',
      header: 'Subject Name',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-gray-900">{row.original.subject_name}</div>
          <div className="text-sm text-gray-500">{row.original.subject_code}</div>
        </div>
      ),
    },
    {
      accessorKey: 'sections_count',
      header: 'Sections',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <GraduationCap className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            {/* This would come from a sections count API call */}
            0 sections
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'students_count',
      header: 'Students',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            {/* This would come from enrolled students count */}
            0 students
          </span>
        </div>
      ),
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
    {
      accessorKey: 'updated_at',
      header: 'Updated',
      cell: ({ row }) => (
        <div className="text-sm text-gray-500">
          {format(new Date(row.original.updated_at), 'MMM d, yyyy')}
        </div>
      ),
    },
  ];

  const handleSearch = (query: string, filters: Record<string, string>) => {
    setSearchQuery(query);
    setFilters(filters);
  };

  const handleViewSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    router.push(`/subjects/${subject.id}`);
  };

  const handleEditSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setShowEditForm(true);
  };

  const handleDeleteSubject = (subject: Subject) => {
    setSubjectToDelete(subject);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!subjectToDelete) return;

    try {
      await deleteSubjectMutation.mutateAsync(subjectToDelete.id);
      setShowDeleteDialog(false);
      setSubjectToDelete(null);
    } catch (error) {
      console.error('Failed to delete subject:', error);
    }
  };

  const searchFilters = [
    {
      key: 'subject_code',
      label: 'Subject Code',
      options: [
        // This would be populated from API
        { value: 'CS', label: 'Computer Science (CS)' },
        { value: 'MATH', label: 'Mathematics (MATH)' },
        { value: 'PHYS', label: 'Physics (PHYS)' },
        { value: 'CHEM', label: 'Chemistry (CHEM)' },
      ],
    },
  ];

  // Statistics
  const stats = [
    {
      label: 'Total Subjects',
      value: subjectsData?.count || 0,
      icon: BookOpen,
      color: 'text-blue-600',
    },
    {
      label: 'Active Sections',
      value: 0, // This would come from sections API
      icon: GraduationCap,
      color: 'text-green-600',
    },
    {
      label: 'Enrolled Students',
      value: 0, // This would come from enrollments API
      icon: Users,
      color: 'text-purple-600',
    },
    {
      label: 'Assignments',
      value: 0, // This would come from assignments API
      icon: FileText,
      color: 'text-orange-600',
    },
  ];

  if (error) {
    return (
      <ProtectedRoute requiredRoles={['SUPERADMIN', 'ADMIN']}>
        <SubjectsLayout>
          <div className="text-center py-8">
            <p className="text-red-600">Error loading subjects: {error.message}</p>
            <Button onClick={() => refetch()} className="mt-4">
              Try Again
            </Button>
          </div>
        </SubjectsLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={['SUPERADMIN', 'ADMIN']}>
      <SubjectsLayout>
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
              <CardTitle>Search Subjects</CardTitle>
            </CardHeader>
            <CardContent>
              <AdvancedSearch
                placeholder="Search subjects by name or code..."
                onSearch={handleSearch}
                filters={searchFilters}
              />
            </CardContent>
          </Card>

          {/* Subjects Table */}
          <Card>
            <CardHeader>
              <CardTitle>Subjects</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={subjects}
                loading={isLoading}
                searchPlaceholder="Search subjects..."
                onRefresh={refetch}
                onAdd={canAccess('subjects', 'create') ? () => setShowCreateForm(true) : undefined}
                rowActions={{
                  onView: handleViewSubject,
                  onEdit: canAccess('subjects', 'update') ? handleEditSubject : undefined,
                  onDelete: canAccess('subjects', 'delete') ? handleDeleteSubject : undefined,
                }}
                emptyMessage="No subjects found. Create your first subject to get started."
              />
            </CardContent>
          </Card>

          {/* Create Subject Modal */}
          <Modal
            isOpen={showCreateForm}
            onClose={() => setShowCreateForm(false)}
            title="Create New Subject"
            size="lg"
          >
            <CreateSubjectForm
              onSuccess={() => {
                setShowCreateForm(false);
                refetch();
              }}
              onCancel={() => setShowCreateForm(false)}
            />
          </Modal>

          {/* Edit Subject Modal */}
          <Modal
            isOpen={showEditForm}
            onClose={() => setShowEditForm(false)}
            title="Edit Subject"
            size="lg"
          >
            {selectedSubject && (
              <EditSubjectForm
                subject={selectedSubject}
                onSuccess={() => {
                  setShowEditForm(false);
                  setSelectedSubject(null);
                  refetch();
                }}
                onCancel={() => {
                  setShowEditForm(false);
                  setSelectedSubject(null);
                }}
              />
            )}
          </Modal>

          {/* Delete Confirmation Dialog */}
          <ConfirmDialog
            isOpen={showDeleteDialog}
            onClose={() => setShowDeleteDialog(false)}
            onConfirm={confirmDelete}
            title="Delete Subject"
            description={`Are you sure you want to delete ${subjectToDelete?.subject_name} (${subjectToDelete?.subject_code})? This action cannot be undone and will affect all associated sections and enrollments.`}
            confirmText="Delete"
            variant="destructive"
            loading={deleteSubjectMutation.isPending}
          />
        </div>
      </SubjectsLayout>
    </ProtectedRoute>
  );
}