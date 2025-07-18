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
import { useCreateSchool } from '@/lib/api/schools';
import { Building, Globe, Calendar, Crown, Zap } from 'lucide-react';

const createSchoolSchema = z.object({
  name: z.string()
    .min(3, 'School name must be at least 3 characters')
    .max(100, 'School name must be less than 100 characters'),
  subdomain: z.string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(50, 'Subdomain must be less than 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens')
    .refine(val => !val.startsWith('-') && !val.endsWith('-'), 'Subdomain cannot start or end with a hyphen'),
  subscription_plan: z.enum(['BASIC', 'PREMIUM'] as const),
  subscription_end_date: z.string().min(1, 'End date is required'),
});

type CreateSchoolFormData = z.infer<typeof createSchoolSchema>;

interface CreateSchoolFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateSchoolForm({ onSuccess, onCancel }: CreateSchoolFormProps) {
  const createSchoolMutation = useCreateSchool();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CreateSchoolFormData>({
    resolver: zodResolver(createSchoolSchema),
    defaultValues: {
      subscription_plan: 'BASIC',
      subscription_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
    },
  });

  const selectedPlan = watch('subscription_plan');
  const schoolName = watch('name');
  const subdomain = watch('subdomain');

  const onSubmit = async (data: CreateSchoolFormData) => {
    try {
      await createSchoolMutation.mutateAsync(data);
      onSuccess();
    } catch (error) {
      console.error('Failed to create school:', error);
    }
  };

  // Generate subdomain suggestion from school name
  const generateSubdomain = (name: string) => {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (name && !subdomain) {
      const suggested = generateSubdomain(name);
      setValue('subdomain', suggested);
    }
  };

  const planOptions = [
    { value: 'BASIC', label: 'Basic Plan' },
    { value: 'PREMIUM', label: 'Premium Plan' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* School Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>School Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">School Name *</Label>
              <Input
                id="name"
                {...register('name')}
                onChange={(e) => {
                  register('name').onChange(e);
                  handleNameChange(e);
                }}
                placeholder="University of Excellence"
                error={errors.name?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subdomain">Subdomain *</Label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="subdomain"
                    {...register('subdomain')}
                    placeholder="university-excellence"
                    className="pl-10"
                    error={errors.subdomain?.message}
                  />
                </div>
                <span className="text-sm text-gray-500 whitespace-nowrap">
                  .example.com
                </span>
              </div>
              <p className="text-xs text-gray-500">
                This will be used for the school&apos;s unique URL
              </p>
            </div>

            {/* Preview URL */}
            {subdomain && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-900">Preview URL:</p>
                <p className="text-sm text-blue-700 font-mono">
                  https://{subdomain}.example.com
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Subscription Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subscription_plan">Subscription Plan *</Label>
              <EnhancedSelect
                options={planOptions}
                value={selectedPlan}
                onValueChange={(value) => setValue('subscription_plan', value as 'BASIC' | 'PREMIUM')}
                placeholder="Select plan"
                error={errors.subscription_plan?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscription_end_date">End Date *</Label>
              <Input
                id="subscription_end_date"
                type="date"
                {...register('subscription_end_date')}
                error={errors.subscription_end_date?.message}
              />
              <p className="text-xs text-gray-500">
                When the subscription will expire
              </p>
            </div>

            {/* Plan Details */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                {selectedPlan === 'PREMIUM' ? (
                  <Crown className="h-5 w-5 text-purple-600" />
                ) : (
                  <Zap className="h-5 w-5 text-blue-600" />
                )}
                <h4 className="font-medium text-gray-900">
                  {selectedPlan} Plan Features
                </h4>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• User management</li>
                <li>• Course and section management</li>
                <li>• Assignment and grading system</li>
                <li>• Basic reporting</li>
                {selectedPlan === 'PREMIUM' && (
                  <>
                    <li>• Advanced analytics</li>
                    <li>• Priority support</li>
                    <li>• Custom integrations</li>
                    <li>• Advanced reporting</li>
                  </>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">School Name</p>
              <p className="font-medium">{schoolName || 'Not specified'}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Subdomain</p>
              <p className="font-medium font-mono">{subdomain || 'Not specified'}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Plan</p>
              <p className="font-medium">{selectedPlan}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={createSchoolMutation.isPending}
          className="min-w-[120px]"
        >
          {createSchoolMutation.isPending ? 'Creating...' : 'Create School'}
        </Button>
      </div>

      {/* Error Display */}
      {createSchoolMutation.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            Failed to create school: {createSchoolMutation.error.message}
          </p>
        </div>
      )}
    </form>
  );
}