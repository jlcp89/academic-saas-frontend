'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEnrollmentReport } from '@/lib/api/reports';
import { format } from 'date-fns';
import { 
  GraduationCap,
  User,
  BookOpen,
  Trophy,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  SortAsc,
  SortDesc
} from 'lucide-react';
import type { ReportFilters, EnrollmentReport } from '@/lib/api/reports';

interface EnrollmentReportTableProps {
  filters: ReportFilters;
}

export function EnrollmentReportTable({ filters }: EnrollmentReportTableProps) {
  const { data: enrollments, isLoading, error } = useEnrollmentReport(filters);
  const [sortColumn, setSortColumn] = useState<keyof EnrollmentReport | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: keyof EnrollmentReport) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedEnrollments = enrollments ? [...enrollments].sort((a, b) => {
    if (!sortColumn) return 0;
    
    let aValue = a[sortColumn];
    let bValue = b[sortColumn];
    
    if (aValue === null || aValue === undefined) aValue = '';
    if (bValue === null || bValue === undefined) bValue = '';
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return sortDirection === 'asc' 
      ? Number(aValue) - Number(bValue)
      : Number(bValue) - Number(aValue);
  }) : [];

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-green-600';
    if (grade >= 80) return 'text-blue-600';
    if (grade >= 70) return 'text-yellow-600';
    if (grade >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ENROLLED':
        return 'bg-green-100 text-green-800';
      case 'DROPPED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCompletionColor = (rate: number) => {
    if (rate >= 90) return 'bg-green-100 text-green-800';
    if (rate >= 80) return 'bg-blue-100 text-blue-800';
    if (rate >= 70) return 'bg-yellow-100 text-yellow-800';
    if (rate >= 60) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const SortIcon = ({ column }: { column: keyof EnrollmentReport }) => {
    if (sortColumn !== column) return <SortAsc className="h-4 w-4 opacity-30" />;
    return sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading enrollment report...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading enrollment report: {error.message}</p>
      </div>
    );
  }

  const activeEnrollments = enrollments?.filter(e => e.status === 'ENROLLED').length || 0;
  const completedEnrollments = enrollments?.filter(e => e.status === 'COMPLETED').length || 0;
  const avgGrade = enrollments?.length ? 
    enrollments.reduce((sum, enrollment) => sum + enrollment.current_grade, 0) / enrollments.length : 0;
  const avgCompletion = enrollments?.length ? 
    enrollments.reduce((sum, enrollment) => sum + enrollment.completion_rate, 0) / enrollments.length : 0;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Total Enrollments</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 mt-2">{enrollments?.length || 0}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">Active</span>
          </div>
          <p className="text-2xl font-bold text-green-900 mt-2">{activeEnrollments}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Completed</span>
          </div>
          <p className="text-2xl font-bold text-purple-900 mt-2">{completedEnrollments}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">Average Grade</span>
          </div>
          <p className={`text-2xl font-bold mt-2 ${getGradeColor(avgGrade)}`}>
            {avgGrade.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Enrollment Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('student_name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Student</span>
                    <SortIcon column="student_name" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('section_name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Section</span>
                    <SortIcon column="section_name" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('professor_name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Professor</span>
                    <SortIcon column="professor_name" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Status</span>
                    <SortIcon column="status" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('current_grade')}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Grade</span>
                    <SortIcon column="current_grade" />
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th 
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('completion_rate')}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Completion</span>
                    <SortIcon column="completion_rate" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('enrollment_date')}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Enrolled</span>
                    <SortIcon column="enrollment_date" />
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedEnrollments.map((enrollment) => (
                <tr key={enrollment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {enrollment.student_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {enrollment.student_email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {enrollment.section_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {enrollment.subject_name} ({enrollment.subject_code})
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {enrollment.professor_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <Badge className={getStatusColor(enrollment.status)}>
                      {enrollment.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Trophy className="h-4 w-4 text-gray-400" />
                      <span className={`text-sm font-medium ${getGradeColor(enrollment.current_grade)}`}>
                        {enrollment.current_grade.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {enrollment.completed_assignments}/{enrollment.assignment_count}
                      </span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${enrollment.completion_rate}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <Badge className={getCompletionColor(enrollment.completion_rate)}>
                      {enrollment.completion_rate.toFixed(1)}%
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {format(new Date(enrollment.enrollment_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {sortedEnrollments.length === 0 && (
        <div className="text-center py-8">
          <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Enrollments Found
          </h3>
          <p className="text-gray-600">
            No enrollments match the current filters. Try adjusting your search criteria.
          </p>
        </div>
      )}
    </div>
  );
}