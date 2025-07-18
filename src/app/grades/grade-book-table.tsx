'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionGradeBook } from '@/lib/api/grading';
import { format } from 'date-fns';
import { 
  User,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Trophy,
  FileText,
  BookOpen,
  Target,
  RefreshCw
} from 'lucide-react';

interface GradeBookTableProps {
  gradeBook: SectionGradeBook;
  onGradeSubmission: (submissionId: number) => void;
  onRefresh: () => void;
}

const ASSIGNMENT_TYPE_CONFIG = {
  HOMEWORK: { icon: BookOpen, color: 'bg-blue-100 text-blue-800' },
  QUIZ: { icon: FileText, color: 'bg-green-100 text-green-800' },
  EXAM: { icon: Trophy, color: 'bg-red-100 text-red-800' },
  PROJECT: { icon: Target, color: 'bg-purple-100 text-purple-800' },
  DISCUSSION: { icon: FileText, color: 'bg-orange-100 text-orange-800' },
};

const SUBMISSION_STATUS_CONFIG = {
  DRAFT: { icon: Edit, color: 'bg-gray-100 text-gray-800', label: 'Draft' },
  SUBMITTED: { icon: Clock, color: 'bg-blue-100 text-blue-800', label: 'Submitted' },
  GRADED: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Graded' },
  RETURNED: { icon: FileText, color: 'bg-purple-100 text-purple-800', label: 'Returned' },
};

export function GradeBookTable({ gradeBook, onGradeSubmission, onRefresh }: GradeBookTableProps) {
  const [sortBy, setSortBy] = useState<'name' | 'average'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Group entries by student
  const studentEntries = gradeBook.entries.reduce((acc, entry) => {
    const studentId = entry.student_info.id;
    if (!acc[studentId]) {
      acc[studentId] = {
        student: entry.student_info,
        enrollment: entry.enrollment_info,
        assignments: {},
        average: 0,
        totalPoints: 0,
        maxPoints: 0,
      };
    }
    
    if (entry.assignment_info) {
      acc[studentId].assignments[entry.assignment_info.id] = entry;
      acc[studentId].maxPoints += entry.assignment_info.max_points;
      if (entry.submission?.points_earned !== undefined) {
        acc[studentId].totalPoints += entry.submission.points_earned;
      }
    }
    
    return acc;
  }, {} as Record<number, {
    student: any;
    enrollment: any;
    assignments: Record<number, any>;
    average: number;
    totalPoints: number;
    maxPoints: number;
  }>);

  // Calculate averages
  Object.values(studentEntries).forEach(entry => {
    entry.average = entry.maxPoints > 0 ? (entry.totalPoints / entry.maxPoints) * 100 : 0;
  });

  // Sort students
  const sortedStudents = Object.values(studentEntries).sort((a, b) => {
    if (sortBy === 'name') {
      const nameA = `${a.student.last_name}, ${a.student.first_name}`;
      const nameB = `${b.student.last_name}, ${b.student.first_name}`;
      return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    } else {
      return sortOrder === 'asc' ? a.average - b.average : b.average - a.average;
    }
  });

  const handleSort = (column: 'name' | 'average') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const renderAssignmentCell = (studentEntry: any, assignment: Assignment) => {
    const entry = studentEntry.assignments[assignment.id];
    
    if (!entry || !entry.submission) {
      return (
        <td key={assignment.id} className="px-3 py-2 text-center border-r border-gray-200">
          <div className="text-xs text-gray-400">-</div>
        </td>
      );
    }

    const submission = entry.submission;
    const typeConfig = ASSIGNMENT_TYPE_CONFIG[assignment.assignment_type];
    const statusConfig = SUBMISSION_STATUS_CONFIG[submission.status];
    const StatusIcon = statusConfig.icon;

    return (
      <td key={assignment.id} className="px-3 py-2 text-center border-r border-gray-200">
        <div className="space-y-1">
          {submission.points_earned !== undefined ? (
            <div className={`text-sm font-medium ${getGradeColor((submission.points_earned / assignment.max_points) * 100)}`}>
              {submission.points_earned}/{assignment.max_points}
            </div>
          ) : (
            <Badge className={statusConfig.color}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusConfig.label}
            </Badge>
          )}
          
          {submission.is_late && (
            <div className="text-xs text-red-500">Late</div>
          )}
          
          {submission.status === 'SUBMITTED' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onGradeSubmission(submission.id)}
              className="text-xs h-6 px-2"
            >
              Grade
            </Button>
          )}
          
          {submission.status === 'GRADED' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onGradeSubmission(submission.id)}
              className="text-xs h-6 px-2"
            >
              <Edit className="h-3 w-3" />
            </Button>
          )}
        </div>
      </td>
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Showing {sortedStudents.length} students
          </div>
        </div>
        <Button
          onClick={onRefresh}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Grade Book Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* Student Name Header */}
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center space-x-1">
                  <User className="h-3 w-3" />
                  <span>Student</span>
                  {sortBy === 'name' && (
                    <span className="text-blue-600">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>

              {/* Assignment Headers */}
              {gradeBook.assignments.map((assignment) => {
                const typeConfig = ASSIGNMENT_TYPE_CONFIG[assignment.assignment_type];
                const TypeIcon = typeConfig.icon;
                
                return (
                  <th 
                    key={assignment.id} 
                    className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-center space-x-1">
                        <TypeIcon className="h-3 w-3" />
                        <span className="truncate max-w-20" title={assignment.title}>
                          {assignment.title}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {assignment.max_points} pts
                      </div>
                      <div className="text-xs text-gray-400">
                        Due: {format(new Date(assignment.due_date), 'MMM d')}
                      </div>
                    </div>
                  </th>
                );
              })}

              {/* Average Header */}
              <th 
                className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('average')}
              >
                <div className="flex items-center justify-center space-x-1">
                  <Trophy className="h-3 w-3" />
                  <span>Average</span>
                  {sortBy === 'average' && (
                    <span className="text-blue-600">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedStudents.map((studentEntry) => (
              <tr key={studentEntry.student.id} className="hover:bg-gray-50">
                {/* Student Name */}
                <td className="px-4 py-3 border-r border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {studentEntry.student.last_name}, {studentEntry.student.first_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {studentEntry.student.email}
                      </div>
                      {studentEntry.enrollment.status !== 'ENROLLED' && (
                        <Badge className="text-xs bg-gray-100 text-gray-800">
                          {studentEntry.enrollment.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </td>

                {/* Assignment Grades */}
                {gradeBook.assignments.map((assignment) => 
                  renderAssignmentCell(studentEntry, assignment)
                )}

                {/* Student Average */}
                <td className="px-4 py-3 text-center">
                  <div className="space-y-1">
                    <div className={`text-sm font-medium ${getGradeColor(studentEntry.average)}`}>
                      {studentEntry.average > 0 ? `${studentEntry.average.toFixed(1)}%` : '-'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {studentEntry.totalPoints}/{studentEntry.maxPoints}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Statistics */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Class Statistics</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Points Available:</span>
            <span className="ml-2 font-medium">
              {gradeBook.assignments.reduce((sum, a) => sum + a.max_points, 0)}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Class Average:</span>
            <span className={`ml-2 font-medium ${getGradeColor(gradeBook.stats.average_grade)}`}>
              {gradeBook.stats.average_grade > 0 ? `${gradeBook.stats.average_grade.toFixed(1)}%` : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Submissions Graded:</span>
            <span className="ml-2 font-medium">
              {gradeBook.stats.graded_count}/{gradeBook.stats.submitted_count}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Late Submissions:</span>
            <span className="ml-2 font-medium text-red-600">
              {gradeBook.stats.late_submissions}
            </span>
          </div>
        </div>
      </div>

      {sortedStudents.length === 0 && (
        <div className="text-center py-8">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Students Found
          </h3>
          <p className="text-gray-600">
            No students are enrolled in this section yet.
          </p>
        </div>
      )}
    </div>
  );
}