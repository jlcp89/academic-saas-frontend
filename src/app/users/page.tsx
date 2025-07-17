'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { UsersLayout } from '@/components/layout/main-layout';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdvancedSearch } from '@/components/ui/search-bar';
import { Modal, ConfirmDialog } from '@/components/ui/dialog';
import { useUsers, useDeleteUser } from '@/lib/api/users';
import { useAuth } from '@/contexts/auth-context';
import { User, UserRole } from '@/types';
import { format } from 'date-fns';
import { 
  Plus, 
  Users, 
  UserCheck, 
  UserX, 
  Crown, 
  GraduationCap, 
  BookOpen,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Shield,
  Mail,
  Calendar
} from 'lucide-react';
import { CreateUserForm } from './create-user-form';
import { EditUserForm } from './edit-user-form';

const ROLE_COLORS = {
  SUPERADMIN: 'bg-purple-100 text-purple-800',
  ADMIN: 'bg-blue-100 text-blue-800',
  PROFESSOR: 'bg-green-100 text-green-800',
  STUDENT: 'bg-gray-100 text-gray-800',
};

const ROLE_ICONS = {
  SUPERADMIN: Crown,
  ADMIN: Shield,
  PROFESSOR: GraduationCap,
  STUDENT: BookOpen,
};

export default function UsersPage() {
  const router = useRouter();
  const { user, canAccess } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Build query parameters
  const queryParams = {
    search: searchQuery || undefined,
    role: filters.role as UserRole || undefined,
    is_active: filters.status === 'active' ? true : filters.status === 'inactive' ? false : undefined,
    page_size: 20,
  };

  const { data: usersData, isLoading, error, refetch } = useUsers(queryParams);
  const deleteUserMutation = useDeleteUser();

  const users = usersData?.results || [];

  // Table columns
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'username',
      header: 'Username',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-xs font-medium text-white">
              {row.original.first_name?.[0] || row.original.username[0]}
            </span>
          </div>
          <span className="font-medium">{row.original.username}</span>
        </div>
      ),
    },
    {
      accessorKey: 'first_name',
      header: 'Name',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">
            {row.original.first_name} {row.original.last_name}
          </div>
          <div className="text-sm text-gray-500">{row.original.email}</div>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.original.role;
        const Icon = ROLE_ICONS[role];
        return (
          <Badge className={ROLE_COLORS[role]}>
            <Icon className="w-3 h-3 mr-1" />
            {role}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'school',
      header: 'School',
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.school?.name || 'No school assigned'}
        </span>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
          {row.original.is_active ? (
            <>
              <UserCheck className="w-3 h-3 mr-1" />
              Active
            </>
          ) : (
            <>
              <UserX className="w-3 h-3 mr-1" />
              Inactive
            </>
          )}
        </Badge>
      ),
    },
    {
      accessorKey: 'date_joined',
      header: 'Joined',
      cell: ({ row }) => (
        <span className="text-sm text-gray-500">
          {format(new Date(row.original.date_joined), 'MMM d, yyyy')}
        </span>
      ),
    },
  ];

  const handleSearch = (query: string, filters: Record<string, string>) => {
    setSearchQuery(query);
    setFilters(filters);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    // Could navigate to user detail page or show modal
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditForm(true);
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      await deleteUserMutation.mutateAsync(userToDelete.id);
      setShowDeleteDialog(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const searchFilters = [
    {
      key: 'role',
      label: 'Role',
      options: [
        { value: 'SUPERADMIN', label: 'Super Admin' },
        { value: 'ADMIN', label: 'Admin' },
        { value: 'PROFESSOR', label: 'Professor' },
        { value: 'STUDENT', label: 'Student' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
  ];

  // Statistics
  const stats = [
    {
      label: 'Total Users',
      value: usersData?.count || 0,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      label: 'Active Users',
      value: users.filter(u => u.is_active).length,
      icon: UserCheck,
      color: 'text-green-600',
    },
    {
      label: 'Professors',
      value: users.filter(u => u.role === 'PROFESSOR').length,
      icon: GraduationCap,
      color: 'text-purple-600',
    },
    {
      label: 'Students',
      value: users.filter(u => u.role === 'STUDENT').length,
      icon: BookOpen,
      color: 'text-orange-600',
    },
  ];

  if (error) {
    return (
      <UsersLayout>
        <div className="text-center py-8">
          <p className="text-red-600">Error loading users: {error.message}</p>
          <Button onClick={() => refetch()} className="mt-4">
            Try Again
          </Button>
        </div>
      </UsersLayout>
    );
  }

  return (
    <UsersLayout>
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
            <CardTitle>Search Users</CardTitle>
          </CardHeader>
          <CardContent>
            <AdvancedSearch
              placeholder="Search users by name, email, or username..."
              onSearch={handleSearch}
              filters={searchFilters}
            />
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={users}
              loading={isLoading}
              searchPlaceholder="Search users..."
              onRefresh={refetch}
              onAdd={canAccess('users', 'create') ? () => setShowCreateForm(true) : undefined}
              rowActions={{
                onView: handleViewUser,
                onEdit: canAccess('users', 'update') ? handleEditUser : undefined,
                onDelete: canAccess('users', 'delete') ? handleDeleteUser : undefined,
              }}
              emptyMessage="No users found"
            />
          </CardContent>
        </Card>

        {/* Create User Modal */}
        <Modal
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          title="Create New User"
          size="lg"
        >
          <CreateUserForm
            onSuccess={() => {
              setShowCreateForm(false);
              refetch();
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        </Modal>

        {/* Edit User Modal */}
        <Modal
          isOpen={showEditForm}
          onClose={() => setShowEditForm(false)}
          title="Edit User"
          size="lg"
        >
          {selectedUser && (
            <EditUserForm
              user={selectedUser}
              onSuccess={() => {
                setShowEditForm(false);
                setSelectedUser(null);
                refetch();
              }}
              onCancel={() => {
                setShowEditForm(false);
                setSelectedUser(null);
              }}
            />
          )}
        </Modal>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={confirmDelete}
          title="Delete User"
          description={`Are you sure you want to delete ${userToDelete?.username}? This action cannot be undone.`}
          confirmText="Delete"
          variant="destructive"
          loading={deleteUserMutation.isPending}
        />
      </div>
    </UsersLayout>
  );
}