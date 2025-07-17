'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { SchoolsLayout } from '@/components/layout/main-layout';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdvancedSearch } from '@/components/ui/search-bar';
import { Modal, ConfirmDialog } from '@/components/ui/dialog';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { 
  useSchools, 
  useDeleteSchool, 
  useActivateSchool, 
  useDeactivateSchool 
} from '@/lib/api/schools';
import { useAuth } from '@/contexts/auth-context';
import { School } from '@/types';
import { format } from 'date-fns';
import { 
  Plus, 
  Building, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Users, 
  Crown, 
  AlertTriangle,
  Activity,
  Zap,
  Globe,
  Shield,
  ShieldCheck,
  ShieldX
} from 'lucide-react';
import { CreateSchoolForm } from './create-school-form';
import { EditSchoolForm } from './edit-school-form';

const SUBSCRIPTION_COLORS = {
  BASIC: 'bg-blue-100 text-blue-800',
  PREMIUM: 'bg-purple-100 text-purple-800',
};

const STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-800',
  EXPIRED: 'bg-red-100 text-red-800',
  CANCELED: 'bg-gray-100 text-gray-800',
};

export default function SchoolsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null);
  const [schoolToToggle, setSchoolToToggle] = useState<School | null>(null);

  // Build query parameters
  const queryParams = {
    search: searchQuery || undefined,
    is_active: filters.status === 'active' ? true : filters.status === 'inactive' ? false : undefined,
    subscription_status: filters.subscription_status || undefined,
    page_size: 20,
  };

  const { data: schoolsData, isLoading, error, refetch } = useSchools(queryParams);
  const deleteSchoolMutation = useDeleteSchool();
  const activateSchoolMutation = useActivateSchool();
  const deactivateSchoolMutation = useDeactivateSchool();

  const schools = schoolsData?.results || [];

  // Table columns
  const columns: ColumnDef<School>[] = [
    {
      accessorKey: 'name',
      header: 'School Name',
      cell: ({ row }) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
            <Building className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.original.name}</div>
            <div className="text-sm text-gray-500">{row.original.subdomain}.example.com</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'subdomain',
      header: 'Subdomain',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4 text-gray-400" />
          <span className="font-mono text-sm">{row.original.subdomain}</span>
        </div>
      ),
    },
    {
      accessorKey: 'subscription',
      header: 'Subscription',
      cell: ({ row }) => {
        const subscription = row.original.subscription;
        if (!subscription) return <span className="text-gray-400">No subscription</span>;
        
        return (
          <div className="space-y-1">
            <Badge className={SUBSCRIPTION_COLORS[subscription.plan]}>
              {subscription.plan === 'PREMIUM' ? (
                <Crown className="w-3 h-3 mr-1" />
              ) : (
                <Zap className="w-3 h-3 mr-1" />
              )}
              {subscription.plan}
            </Badge>
            <div className="text-xs text-gray-500">
              Status: {subscription.status}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
          {row.original.is_active ? (
            <>
              <CheckCircle className="w-3 h-3 mr-1" />
              Active
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3 mr-1" />
              Inactive
            </>
          )}
        </Badge>
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
      accessorKey: 'subscription.end_date',
      header: 'Expires',
      cell: ({ row }) => {
        const subscription = row.original.subscription;
        if (!subscription) return <span className="text-gray-400">-</span>;
        
        const isExpired = new Date(subscription.end_date) < new Date();
        return (
          <div className={`text-sm ${isExpired ? 'text-red-600' : 'text-gray-500'}`}>
            {isExpired && <AlertTriangle className="w-3 h-3 inline mr-1" />}
            {format(new Date(subscription.end_date), 'MMM d, yyyy')}
          </div>
        );
      },
    },
  ];

  const handleSearch = (query: string, filters: Record<string, string>) => {
    setSearchQuery(query);
    setFilters(filters);
  };

  const handleViewSchool = (school: School) => {
    setSelectedSchool(school);
    // Could navigate to school detail page
  };

  const handleEditSchool = (school: School) => {
    setSelectedSchool(school);
    setShowEditForm(true);
  };

  const handleDeleteSchool = (school: School) => {
    setSchoolToDelete(school);
    setShowDeleteDialog(true);
  };

  const handleToggleSchoolStatus = (school: School) => {
    setSchoolToToggle(school);
    if (school.is_active) {
      setShowDeactivateDialog(true);
    } else {
      setShowActivateDialog(true);
    }
  };

  const confirmDelete = async () => {
    if (!schoolToDelete) return;

    try {
      await deleteSchoolMutation.mutateAsync(schoolToDelete.id);
      setShowDeleteDialog(false);
      setSchoolToDelete(null);
    } catch (error) {
      console.error('Failed to delete school:', error);
    }
  };

  const confirmActivate = async () => {
    if (!schoolToToggle) return;

    try {
      await activateSchoolMutation.mutateAsync(schoolToToggle.id);
      setShowActivateDialog(false);
      setSchoolToToggle(null);
    } catch (error) {
      console.error('Failed to activate school:', error);
    }
  };

  const confirmDeactivate = async () => {
    if (!schoolToToggle) return;

    try {
      await deactivateSchoolMutation.mutateAsync(schoolToToggle.id);
      setShowDeactivateDialog(false);
      setSchoolToToggle(null);
    } catch (error) {
      console.error('Failed to deactivate school:', error);
    }
  };

  const searchFilters = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
    {
      key: 'subscription_status',
      label: 'Subscription Status',
      options: [
        { value: 'ACTIVE', label: 'Active' },
        { value: 'EXPIRED', label: 'Expired' },
        { value: 'CANCELED', label: 'Canceled' },
      ],
    },
  ];

  // Statistics
  const stats = [
    {
      label: 'Total Schools',
      value: schoolsData?.count || 0,
      icon: Building,
      color: 'text-blue-600',
    },
    {
      label: 'Active Schools',
      value: schools.filter(s => s.is_active).length,
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      label: 'Premium Schools',
      value: schools.filter(s => s.subscription?.plan === 'PREMIUM').length,
      icon: Crown,
      color: 'text-purple-600',
    },
    {
      label: 'Expired Subscriptions',
      value: schools.filter(s => s.subscription && new Date(s.subscription.end_date) < new Date()).length,
      icon: AlertTriangle,
      color: 'text-red-600',
    },
  ];

  const customActions = [
    {
      label: (school: School) => school.is_active ? 'Deactivate' : 'Activate',
      icon: (school: School) => school.is_active ? ShieldX : ShieldCheck,
      onClick: handleToggleSchoolStatus,
      show: () => true,
    },
  ];

  if (error) {
    return (
      <ProtectedRoute requiredRoles={['SUPERADMIN']}>
        <SchoolsLayout>
          <div className="text-center py-8">
            <p className="text-red-600">Error loading schools: {error.message}</p>
            <Button onClick={() => refetch()} className="mt-4">
              Try Again
            </Button>
          </div>
        </SchoolsLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={['SUPERADMIN']}>
      <SchoolsLayout>
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
              <CardTitle>Search Schools</CardTitle>
            </CardHeader>
            <CardContent>
              <AdvancedSearch
                placeholder="Search schools by name or subdomain..."
                onSearch={handleSearch}
                filters={searchFilters}
              />
            </CardContent>
          </Card>

          {/* Schools Table */}
          <Card>
            <CardHeader>
              <CardTitle>Schools</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={schools}
                loading={isLoading}
                searchPlaceholder="Search schools..."
                onRefresh={refetch}
                onAdd={() => setShowCreateForm(true)}
                rowActions={{
                  onView: handleViewSchool,
                  onEdit: handleEditSchool,
                  onDelete: handleDeleteSchool,
                  customActions: customActions.map(action => ({
                    label: action.label,
                    icon: action.icon,
                    onClick: action.onClick,
                    show: action.show,
                  })),
                }}
                emptyMessage="No schools found"
              />
            </CardContent>
          </Card>

          {/* Create School Modal */}
          <Modal
            isOpen={showCreateForm}
            onClose={() => setShowCreateForm(false)}
            title="Create New School"
            size="xl"
          >
            <CreateSchoolForm
              onSuccess={() => {
                setShowCreateForm(false);
                refetch();
              }}
              onCancel={() => setShowCreateForm(false)}
            />
          </Modal>

          {/* Edit School Modal */}
          <Modal
            isOpen={showEditForm}
            onClose={() => setShowEditForm(false)}
            title="Edit School"
            size="xl"
          >
            {selectedSchool && (
              <EditSchoolForm
                school={selectedSchool}
                onSuccess={() => {
                  setShowEditForm(false);
                  setSelectedSchool(null);
                  refetch();
                }}
                onCancel={() => {
                  setShowEditForm(false);
                  setSelectedSchool(null);
                }}
              />
            )}
          </Modal>

          {/* Delete Confirmation Dialog */}
          <ConfirmDialog
            isOpen={showDeleteDialog}
            onClose={() => setShowDeleteDialog(false)}
            onConfirm={confirmDelete}
            title="Delete School"
            description={`Are you sure you want to delete ${schoolToDelete?.name}? This action cannot be undone and will remove all associated data.`}
            confirmText="Delete"
            variant="destructive"
            loading={deleteSchoolMutation.isPending}
          />

          {/* Activate Confirmation Dialog */}
          <ConfirmDialog
            isOpen={showActivateDialog}
            onClose={() => setShowActivateDialog(false)}
            onConfirm={confirmActivate}
            title="Activate School"
            description={`Are you sure you want to activate ${schoolToToggle?.name}? This will allow the school to access the system.`}
            confirmText="Activate"
            loading={activateSchoolMutation.isPending}
          />

          {/* Deactivate Confirmation Dialog */}
          <ConfirmDialog
            isOpen={showDeactivateDialog}
            onClose={() => setShowDeactivateDialog(false)}
            onConfirm={confirmDeactivate}
            title="Deactivate School"
            description={`Are you sure you want to deactivate ${schoolToToggle?.name}? This will prevent the school from accessing the system.`}
            confirmText="Deactivate"
            variant="destructive"
            loading={deactivateSchoolMutation.isPending}
          />
        </div>
      </SchoolsLayout>
    </ProtectedRoute>
  );
}