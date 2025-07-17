'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAssignmentReport } from '@/lib/api/reports';
import { format } from 'date-fns';
import { 
  FileText,
  Trophy,
  Clock,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  Target,
  Eye,
  Calendar,
  SortAsc,
  SortDesc
} from 'lucide-react';
import type { ReportFilters, AssignmentReport } from '@/lib/api/reports';

interface AssignmentReportTableProps {
  filters: ReportFilters;
}

const ASSIGNMENT_TYPE_CONFIG = {
  HOMEWORK: { icon: BookOpen, color: 'bg-blue-100 text-blue-800' },
  QUIZ: { icon: FileText, color: 'bg-green-100 text-green-800' },
  EXAM: { icon: Trophy, color: 'bg-red-100 text-red-800' },
  PROJECT: { icon: Target, color: 'bg-purple-100 text-purple-800' },
  DISCUSSION: { icon: FileText, color: 'bg-orange-100 text-orange-800' },
};

export function AssignmentReportTable({ filters }: AssignmentReportTableProps) {
  const { data: assignments, isLoading, error } = useAssignmentReport(filters);
  const [sortColumn, setSortColumn] = useState<keyof AssignmentReport | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: keyof AssignmentReport) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedAssignments = assignments ? [...assignments].sort((a, b) => {
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
      ? (aValue as any) - (bValue as any)
      : (bValue as any) - (aValue as any);
  }) : [];

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-green-600';
    if (grade >= 80) return 'text-blue-600';
    if (grade >= 70) return 'text-yellow-600';
    if (grade >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getCompletionColor = (rate: number) => {
    if (rate >= 90) return 'bg-green-100 text-green-800';
    if (rate >= 80) return 'bg-blue-100 text-blue-800';
    if (rate >= 70) return 'bg-yellow-100 text-yellow-800';
    if (rate >= 60) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const SortIcon = ({ column }: { column: keyof AssignmentReport }) => {
    if (sortColumn !== column) return <SortAsc className="h-4 w-4 opacity-30" />;
    return sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading assignment report...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading assignment report: {error.message}</p>
      </div>
    );
  }

  const totalSubmissions = assignments?.reduce((sum, assignment) => sum + assignment.submission_count, 0) || 0;
  const totalGraded = assignments?.reduce((sum, assignment) => sum + assignment.graded_count, 0) || 0;
  const avgGrade = assignments?.length ? 
    assignments.reduce((sum, assignment) => sum + assignment.avg_grade, 0) / assignments.length : 0;
  const avgCompletion = assignments?.length ? 
    assignments.reduce((sum, assignment) => sum + assignment.completion_rate, 0) / assignments.length : 0;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Total Assignments</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 mt-2">{assignments?.length || 0}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">Total Submissions</span>
          </div>
          <p className="text-2xl font-bold text-green-900 mt-2">{totalSubmissions}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Graded</span>
          </div>
          <p className="text-2xl font-bold text-purple-900 mt-2">{totalGraded}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">Average Grade</span>
          </div>
          <p className={`text-2xl font-bold mt-2 ${getGradeColor(avgGrade)}`}>
            {avgGrade.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Assignment Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Assignment</span>
                    <SortIcon column="title" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('assignment_type')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Type</span>
                    <SortIcon column="assignment_type" />
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
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('max_points')}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Points</span>
                    <SortIcon column="max_points" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('due_date')}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Due Date</span>
                    <SortIcon column="due_date" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('submission_count')}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Submissions</span>
                    <SortIcon column="submission_count" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('avg_grade')}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Avg Grade</span>
                    <SortIcon column="avg_grade" />
                  </div>
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
                  onClick={() => handleSort('late_rate')}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Late Rate</span>
                    <SortIcon column="late_rate" />
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedAssignments.map((assignment) => {
                const typeConfig = ASSIGNMENT_TYPE_CONFIG[assignment.assignment_type as keyof typeof ASSIGNMENT_TYPE_CONFIG];
                const TypeIcon = typeConfig?.icon || FileText;
                
                return (
                  <tr key={assignment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeConfig?.color || 'bg-gray-100 text-gray-800'}`}>
                          <TypeIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {assignment.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {assignment.subject_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={typeConfig?.color || 'bg-gray-100 text-gray-800'}>
                        {assignment.assignment_type}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {assignment.section_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {assignment.professor_name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Trophy className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {assignment.max_points}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {format(new Date(assignment.due_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <span className="text-sm font-medium text-gray-900">
                          {assignment.submission_count}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({assignment.graded_count} graded)
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <span className={`text-sm font-medium ${getGradeColor(assignment.avg_grade)}`}>
                          {assignment.avg_grade.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Badge className={getCompletionColor(assignment.completion_rate)}>
                        {assignment.completion_rate.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {assignment.late_rate > 20 && (
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        )}
                        <span className={`text-sm font-medium ${
                          assignment.late_rate > 20 ? 'text-orange-600' : 'text-gray-900'
                        }`}>
                          {assignment.late_rate.toFixed(1)}%
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {sortedAssignments.length === 0 && (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Assignments Found
          </h3>
          <p className="text-gray-600">
            No assignments match the current filters. Try adjusting your search criteria.
          </p>
        </div>
      )}
    </div>
  );
}