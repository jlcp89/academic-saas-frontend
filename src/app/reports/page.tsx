'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EnhancedSelect } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout/main-layout';
import { 
  BarChart3,
  FileText,
  Download,
  Filter,
  RefreshCw,
  Users,
  BookOpen,
  GraduationCap,
  Trophy,
  TrendingUp,
  Calendar,
  Search,
  X
} from 'lucide-react';
import { format } from 'date-fns';

// Report Components
import { UserReportTable } from './user-report-table';
import { SectionReportTable } from './section-report-table';
import { AssignmentReportTable } from './assignment-report-table';
import { GradeReportTable } from './grade-report-table';
import { EnrollmentReportTable } from './enrollment-report-table';
import { SystemReportDashboard } from './system-report-dashboard';

// Types
import type { ReportFilters, ExportFormat } from '@/lib/api/reports';

const REPORT_TYPES = {
  users: { label: 'User Report', icon: Users, description: 'User accounts and activity' },
  sections: { label: 'Section Report', icon: BookOpen, description: 'Class sections and enrollment' },
  assignments: { label: 'Assignment Report', icon: FileText, description: 'Assignment performance and completion' },
  grades: { label: 'Grade Report', icon: Trophy, description: 'Student grades and performance' },
  enrollments: { label: 'Enrollment Report', icon: GraduationCap, description: 'Student enrollment data' },
  system: { label: 'System Report', icon: BarChart3, description: 'System-wide analytics and metrics' },
} as const;

const ASSIGNMENT_TYPES = [
  { value: 'HOMEWORK', label: 'Homework' },
  { value: 'QUIZ', label: 'Quiz' },
  { value: 'EXAM', label: 'Exam' },
  { value: 'PROJECT', label: 'Project' },
  { value: 'DISCUSSION', label: 'Discussion' },
];

const USER_ROLES = [
  { value: 'SUPERADMIN', label: 'Super Admin' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'PROFESSOR', label: 'Professor' },
  { value: 'STUDENT', label: 'Student' },
];

const EXPORT_FORMATS = [
  { value: 'csv', label: 'CSV' },
  { value: 'xlsx', label: 'Excel (XLSX)' },
  { value: 'pdf', label: 'PDF' },
];

export default function ReportsPage() {
  const { data: session } = useSession();
  const [selectedReport, setSelectedReport] = useState<keyof typeof REPORT_TYPES>('users');
  const [filters, setFilters] = useState<ReportFilters>({
    start_date: '',
    end_date: '',
  });
  const [isExporting, setIsExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filter available reports based on user role
  const availableReports = Object.entries(REPORT_TYPES).filter(([key]) => {
    if (key === 'system') return session?.user?.role === 'SUPERADMIN';
    return true;
  });

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const clearFilters = () => {
    setFilters({
      start_date: '',
      end_date: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '');

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    try {
      // Implementation would go here
      console.log(`Exporting ${selectedReport} report as ${format}`, filters);
      // Simulate export delay
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'users':
        return <UserReportTable filters={filters} />;
      case 'sections':
        return <SectionReportTable filters={filters} />;
      case 'assignments':
        return <AssignmentReportTable filters={filters} />;
      case 'grades':
        return <GradeReportTable filters={filters} />;
      case 'enrollments':
        return <EnrollmentReportTable filters={filters} />;
      case 'system':
        return <SystemReportDashboard filters={filters} />;
      default:
        return null;
    }
  };

  const currentReport = REPORT_TYPES[selectedReport];
  const ReportIcon = currentReport.icon;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-2">
              Generate comprehensive reports and export data for analysis
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {hasActiveFilters && (
                <Badge className="ml-2 bg-blue-100 text-blue-800">
                  {Object.values(filters).filter(v => v !== undefined && v !== '').length}
                </Badge>
              )}
            </Button>
            <Button
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>{isExporting ? 'Exporting...' : 'Export'}</span>
            </Button>
          </div>
        </div>

        {/* Report Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Report Type</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableReports.map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <div
                    key={key}
                    onClick={() => setSelectedReport(key as keyof typeof REPORT_TYPES)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedReport === key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        selectedReport === key ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{config.label}</h3>
                        <p className="text-sm text-gray-500">{config.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Filters Panel */}
        {showFilters && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Filter className="h-5 w-5" />
                  <span>Filters</span>
                </div>
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <X className="h-4 w-4" />
                  <span>Clear</span>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Range */}
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={filters.start_date || ''}
                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={filters.end_date || ''}
                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                  />
                </div>

                {/* Role Filter (for user reports) */}
                {selectedReport === 'users' && (
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <EnhancedSelect
                      options={USER_ROLES}
                      value={filters.role || ''}
                      onValueChange={(value) => handleFilterChange('role', value)}
                      placeholder="All roles"
                    />
                  </div>
                )}

                {/* Assignment Type Filter */}
                {(selectedReport === 'assignments' || selectedReport === 'grades') && (
                  <div className="space-y-2">
                    <Label>Assignment Type</Label>
                    <EnhancedSelect
                      options={ASSIGNMENT_TYPES}
                      value={filters.assignment_type || ''}
                      onValueChange={(value) => handleFilterChange('assignment_type', value)}
                      placeholder="All types"
                    />
                  </div>
                )}

                {/* Status Filter */}
                {selectedReport === 'enrollments' && (
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <EnhancedSelect
                      options={[
                        { value: 'ENROLLED', label: 'Enrolled' },
                        { value: 'DROPPED', label: 'Dropped' },
                        { value: 'COMPLETED', label: 'Completed' },
                      ]}
                      value={filters.status || ''}
                      onValueChange={(value) => handleFilterChange('status', value)}
                      placeholder="All statuses"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Report Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ReportIcon className="h-5 w-5" />
                <span>{currentReport.label}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh</span>
                </Button>
                <EnhancedSelect
                  options={EXPORT_FORMATS}
                  value=""
                  onValueChange={(format) => handleExport(format as ExportFormat)}
                  placeholder="Export as..."
                />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderReportContent()}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}