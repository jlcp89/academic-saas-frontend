'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGradeReport } from '@/lib/api/reports';
import { format } from 'date-fns';
import { 
  Trophy,
  User,
  FileText,
  AlertTriangle,
  Eye,
  Calendar,
  SortAsc,
  SortDesc
} from 'lucide-react';
import type { ReportFilters, GradeReport } from '@/lib/api/reports';

interface GradeReportTableProps {
  filters: ReportFilters;
}

export function GradeReportTable({ filters }: GradeReportTableProps) {
  const { data: grades, isLoading, error } = useGradeReport(filters);
  const [sortColumn, setSortColumn] = useState<keyof GradeReport | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: keyof GradeReport) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedGrades = grades ? [...grades].sort((a, b) => {
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

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getLetterGradeColor = (letter: string) => {
    if (letter.startsWith('A')) return 'bg-green-100 text-green-800';
    if (letter.startsWith('B')) return 'bg-blue-100 text-blue-800';
    if (letter.startsWith('C')) return 'bg-yellow-100 text-yellow-800';
    if (letter.startsWith('D')) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const SortIcon = ({ column }: { column: keyof GradeReport }) => {
    if (sortColumn !== column) return <SortAsc className="h-4 w-4 opacity-30" />;
    return sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading grade report...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading grade report: {error.message}</p>
      </div>
    );
  }

  const avgGrade = grades?.length ? 
    grades.reduce((sum, grade) => sum + grade.percentage, 0) / grades.length : 0;
  const lateCount = grades?.filter(g => g.is_late).length || 0;
  const aCount = grades?.filter(g => g.grade_letter.startsWith('A')).length || 0;
  const passCount = grades?.filter(g => g.percentage >= 60).length || 0;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Total Grades</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 mt-2">{grades?.length || 0}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">Average Grade</span>
          </div>
          <p className={`text-2xl font-bold mt-2 ${getGradeColor(avgGrade)}`}>
            {avgGrade.toFixed(1)}%
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">A Grades</span>
          </div>
          <p className="text-2xl font-bold text-purple-900 mt-2">{aCount}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">Late Submissions</span>
          </div>
          <p className="text-2xl font-bold text-orange-900 mt-2">{lateCount}</p>
        </div>
      </div>

      {/* Grade Table */}
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
                  onClick={() => handleSort('assignment_title')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Assignment</span>
                    <SortIcon column="assignment_title" />
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
                  onClick={() => handleSort('points_earned')}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Points</span>
                    <SortIcon column="points_earned" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('percentage')}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Percentage</span>
                    <SortIcon column="percentage" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('grade_letter')}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Grade</span>
                    <SortIcon column="grade_letter" />
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th 
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('graded_at')}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Graded</span>
                    <SortIcon column="graded_at" />
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedGrades.map((grade) => (
                <tr key={grade.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {grade.student_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {grade.student_email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {grade.assignment_title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {grade.assignment_type}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {grade.section_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {grade.subject_name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm font-medium text-gray-900">
                      {grade.points_earned}/{grade.max_points}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className={`text-sm font-medium ${getGradeColor(grade.percentage)}`}>
                      {grade.percentage.toFixed(1)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <Badge className={getLetterGradeColor(grade.grade_letter)}>
                      {grade.grade_letter}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {grade.is_late && (
                      <Badge className="bg-red-100 text-red-800">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Late
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {format(new Date(grade.graded_at), 'MMM d, yyyy')}
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

      {sortedGrades.length === 0 && (
        <div className="text-center py-8">
          <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Grades Found
          </h3>
          <p className="text-gray-600">
            No grades match the current filters. Try adjusting your search criteria.
          </p>
        </div>
      )}
    </div>
  );
}