'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSectionReport } from '@/lib/api/reports';
import { format } from 'date-fns';
import { 
  BookOpen,
  Users,
  FileText,
  Trophy,
  AlertTriangle,
  Eye,
  TrendingUp,
  TrendingDown,
  Calendar,
  SortAsc,
  SortDesc
} from 'lucide-react';
import type { ReportFilters, SectionReport } from '@/lib/api/reports';

interface SectionReportTableProps {
  filters: ReportFilters;
}

export function SectionReportTable({ filters }: SectionReportTableProps) {
  const { data: sections, isLoading, error } = useSectionReport(filters);
  const [sortColumn, setSortColumn] = useState<keyof SectionReport | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: keyof SectionReport) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedSections = sections ? [...sections].sort((a, b) => {
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

  const getCompletionColor = (rate: number) => {
    if (rate >= 90) return 'bg-green-100 text-green-800';
    if (rate >= 80) return 'bg-blue-100 text-blue-800';
    if (rate >= 70) return 'bg-yellow-100 text-yellow-800';
    if (rate >= 60) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const SortIcon = ({ column }: { column: keyof SectionReport }) => {
    if (sortColumn !== column) return <SortAsc className="h-4 w-4 opacity-30" />;
    return sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading section report...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading section report: {error.message}</p>
      </div>
    );
  }

  const totalStudents = sections?.reduce((sum, section) => sum + section.student_count, 0) || 0;
  const totalAssignments = sections?.reduce((sum, section) => sum + section.assignment_count, 0) || 0;
  const avgGrade = sections?.length ? 
    sections.reduce((sum, section) => sum + section.avg_grade, 0) / sections.length : 0;
  const avgCompletion = sections?.length ? 
    sections.reduce((sum, section) => sum + section.completion_rate, 0) / sections.length : 0;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Total Sections</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 mt-2">{sections?.length || 0}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">Total Students</span>
          </div>
          <p className="text-2xl font-bold text-green-900 mt-2">{totalStudents}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Total Assignments</span>
          </div>
          <p className="text-2xl font-bold text-purple-900 mt-2">{totalAssignments}</p>
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

      {/* Section Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
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
                  onClick={() => handleSort('subject_name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Subject</span>
                    <SortIcon column="subject_name" />
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
                  onClick={() => handleSort('student_count')}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Students</span>
                    <SortIcon column="student_count" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('assignment_count')}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Assignments</span>
                    <SortIcon column="assignment_count" />
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
                  onClick={() => handleSort('late_submissions')}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Late</span>
                    <SortIcon column="late_submissions" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Created</span>
                    <SortIcon column="created_at" />
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedSections.map((section) => (
                <tr key={section.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {section.section_name}
                        </div>
                        <div className="text-sm text-gray-500">ID: {section.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {section.subject_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {section.subject_code}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {section.professor_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {section.student_count}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {section.assignment_count}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Trophy className="h-4 w-4 text-gray-400" />
                      <span className={`text-sm font-medium ${getGradeColor(section.avg_grade)}`}>
                        {section.avg_grade.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <Badge className={getCompletionColor(section.completion_rate)}>
                      {section.completion_rate.toFixed(1)}%
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-2">
                      {section.late_submissions > 0 && (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      )}
                      <span className={`text-sm font-medium ${
                        section.late_submissions > 0 ? 'text-orange-600' : 'text-gray-900'
                      }`}>
                        {section.late_submissions}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {format(new Date(section.created_at), 'MMM d, yyyy')}
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

      {sortedSections.length === 0 && (
        <div className="text-center py-8">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Sections Found
          </h3>
          <p className="text-gray-600">
            No sections match the current filters. Try adjusting your search criteria.
          </p>
        </div>
      )}
    </div>
  );
}