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
import { useUpdateSchool, useRenewSubscription } from '@/lib/api/schools';
import { School } from '@/types';
import { format } from 'date-fns';
import { 
  Building, 
  Globe, 
  Calendar, 
  Crown, 
  Zap, 
  Save, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

const editSchoolSchema = z.object({
  name: z.string()
    .min(3, 'School name must be at least 3 characters')
    .max(100, 'School name must be less than 100 characters'),
  subdomain: z.string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(50, 'Subdomain must be less than 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens')
    .refine(val => !val.startsWith('-') && !val.endsWith('-'), 'Subdomain cannot start or end with a hyphen'),
  is_active: z.boolean(),
});

const renewSubscriptionSchema = z.object({
  end_date: z.string().min(1, 'End date is required'),
});

type EditSchoolFormData = z.infer<typeof editSchoolSchema>;
type RenewSubscriptionFormData = z.infer<typeof renewSubscriptionSchema>;

interface EditSchoolFormProps {
  school: School;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditSchoolForm({ school, onSuccess, onCancel }: EditSchoolFormProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'subscription'>('details');
  const updateSchoolMutation = useUpdateSchool();
  const renewSubscriptionMutation = useRenewSubscription();

  const {
    register: registerSchool,
    handleSubmit: handleSubmitSchool,
    formState: { errors: schoolErrors },
    watch: watchSchool,
    setValue: setSchoolValue,
  } = useForm<EditSchoolFormData>({
    resolver: zodResolver(editSchoolSchema),
    defaultValues: {
      name: school.name,
      subdomain: school.subdomain,
      is_active: school.is_active,
    },
  });

  const {
    register: registerSubscription,
    handleSubmit: handleSubmitSubscription,
    formState: { errors: subscriptionErrors },
  } = useForm<RenewSubscriptionFormData>({
    resolver: zodResolver(renewSubscriptionSchema),
    defaultValues: {
      end_date: school.subscription 
        ? new Date(new Date(school.subscription.end_date).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  });

  const isActive = watchSchool('is_active');

  const onSubmitSchool = async (data: EditSchoolFormData) => {
    try {
      await updateSchoolMutation.mutateAsync({
        id: school.id,
        data: {
          name: data.name,
          subdomain: data.subdomain,
          is_active: data.is_active,
        },
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to update school:', error);
    }
  };

  const onSubmitSubscription = async (data: RenewSubscriptionFormData) => {
    if (!school.subscription) return;

    try {
      await renewSubscriptionMutation.mutateAsync({
        id: school.subscription.id,
        data: {
          end_date: data.end_date,
        },
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to renew subscription:', error);
    }
  };

  const isSubscriptionExpired = school.subscription 
    ? new Date(school.subscription.end_date) < new Date()
    : false;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800';
      case 'CANCELED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'details'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          School Details
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('subscription')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'subscription'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Subscription
        </button>
      </div>

      {/* School Details Tab */}
      {activeTab === 'details' && (
        <form onSubmit={handleSubmitSchool(onSubmitSchool)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span>Basic Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">School Name *</Label>
                  <Input
                    id="name"
                    {...registerSchool('name')}
                    placeholder="University of Excellence"
                    error={schoolErrors.name?.message}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subdomain">Subdomain *</Label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="subdomain"
                        {...registerSchool('subdomain')}
                        placeholder="university-excellence"
                        className="pl-10"
                        error={schoolErrors.subdomain?.message}
                      />
                    </div>
                    <span className="text-sm text-gray-500 whitespace-nowrap">
                      .example.com
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Changing this will affect the school's URL
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="is_active">Status</Label>
                  <EnhancedSelect
                    options={[
                      { value: 'true', label: 'Active' },
                      { value: 'false', label: 'Inactive' },
                    ]}
                    value={isActive ? 'true' : 'false'}
                    onValueChange={(value) => setSchoolValue('is_active', value === 'true')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* School Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>School Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">0</p>
                    <p className="text-sm text-gray-600">Total Users</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">0</p>
                    <p className="text-sm text-gray-600">Active Students</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">0</p>
                    <p className="text-sm text-gray-600">Courses</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">0</p>
                    <p className="text-sm text-gray-600">Assignments</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>School ID:</strong> {school.id}
                  </p>
                  <p className="text-sm text-blue-800">
                    <strong>Created:</strong> {format(new Date(school.created_at), 'PPP')}
                  </p>
                  <p className="text-sm text-blue-800">
                    <strong>URL:</strong> https://{school.subdomain}.example.com
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateSchoolMutation.isPending}
              className="min-w-[120px]"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateSchoolMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>

          {/* Error Display */}
          {updateSchoolMutation.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                Failed to update school: {updateSchoolMutation.error.message}
              </p>
            </div>
          )}
        </form>
      )}

      {/* Subscription Tab */}
      {activeTab === 'subscription' && (
        <div className="space-y-6">
          {/* Current Subscription */}
          <Card>
            <CardHeader>
              <CardTitle>Current Subscription</CardTitle>
            </CardHeader>
            <CardContent>
              {school.subscription ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {school.subscription.plan === 'PREMIUM' ? (
                        <Crown className="h-6 w-6 text-purple-600" />
                      ) : (
                        <Zap className="h-6 w-6 text-blue-600" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{school.subscription.plan} Plan</p>
                        <p className="text-sm text-gray-600">
                          Expires: {format(new Date(school.subscription.end_date), 'PPP')}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(school.subscription.status)}>
                      {school.subscription.status === 'ACTIVE' ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <XCircle className="w-3 h-3 mr-1" />
                      )}
                      {school.subscription.status}
                    </Badge>
                  </div>

                  {isSubscriptionExpired && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <p className="text-sm text-red-800 font-medium">
                          Subscription has expired
                        </p>
                      </div>
                      <p className="text-sm text-red-700 mt-1">
                        This school's subscription expired on {format(new Date(school.subscription.end_date), 'PPP')}. 
                        Please renew to continue service.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No subscription found for this school</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Renew Subscription */}
          {school.subscription && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <RefreshCw className="h-5 w-5" />
                  <span>Renew Subscription</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitSubscription(onSubmitSubscription)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="end_date">New End Date *</Label>
                    <Input
                      id="end_date"
                      type="date"
                      {...registerSubscription('end_date')}
                      error={subscriptionErrors.end_date?.message}
                    />
                    <p className="text-xs text-gray-500">
                      Set the new expiration date for the subscription
                    </p>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button 
                      type="submit" 
                      disabled={renewSubscriptionMutation.isPending}
                      className="min-w-[140px]"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {renewSubscriptionMutation.isPending ? 'Renewing...' : 'Renew Subscription'}
                    </Button>
                  </div>

                  {/* Error Display */}
                  {renewSubscriptionMutation.error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        Failed to renew subscription: {renewSubscriptionMutation.error.message}
                      </p>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}