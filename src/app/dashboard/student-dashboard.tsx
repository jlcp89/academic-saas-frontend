'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStudentDashboard } from '@/lib/api/dashboard';
import { format, differenceInHours } from 'date-fns';
import { 
  BookOpen,
  FileText,
  Clock,
  Award,
  AlertTriangle,
  CheckCircle,
  Eye,
  RefreshCw,
  Target,
  Trophy,
  GraduationCap,
  Calendar,
  TrendingUp,
  BarChart3,
  User,
  Play,
  XCircle
} from 'lucide-react';

export function StudentDashboard() {
  const { data: dashboardData, isLoading, error, refetch } = useStudentDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Error Loading Dashboard
        </h3>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <Button onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  if (!dashboardData) return null;

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-green-600';
    if (grade >= 80) return 'text-blue-600';
    if (grade >= 70) return 'text-yellow-600';
    if (grade >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'graded':
        return 'bg-green-100 text-green-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'graded':
        return CheckCircle;
      case 'submitted':
        return Clock;
      case 'pending':
        return AlertTriangle;
      case 'overdue':
        return XCircle;
      default:
        return Clock;
    }
  };

  const getUrgencyColor = (hoursRemaining: number) => {
    if (hoursRemaining < 24) return 'text-red-600';
    if (hoursRemaining < 72) return 'text-orange-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Enrolled Sections</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.stats.enrolled_sections}
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Assignments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.stats.total_assignments}
                </p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.stats.completed_assignments}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.stats.pending_assignments}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Grade</p>
                <p className={`text-2xl font-bold ${getGradeColor(dashboardData.stats.average_grade)}`}>
                  {dashboardData.stats.average_grade.toFixed(1)}%
                </p>
              </div>
              <Award className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">GPA</p>
                <p className={`text-2xl font-bold ${getGradeColor(dashboardData.stats.gpa * 20)}`}>
                  {dashboardData.stats.gpa.toFixed(2)}
                </p>
              </div>
              <GraduationCap className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrolled Sections */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>My Sections</span>
              </div>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.enrolled_sections.map((section) => (
                <div key={section.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{section.section_name}</h4>
                      <p className="text-sm text-gray-600">
                        {section.subject_name} ({section.subject_code})
                      </p>
                      <p className="text-xs text-gray-500">Prof. {section.professor_name}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${getGradeColor(section.current_grade)}`}>
                        {section.current_grade.toFixed(1)}%
                      </p>
                      {section.next_assignment_due && (
                        <p className="text-xs text-orange-600">
                          Next due: {format(new Date(section.next_assignment_due), 'MMM d')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>{section.assignment_count} assignments</span>
                    </div>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(section.current_grade / 100) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Recent Assignments</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.recent_assignments.map((assignment) => {
                const StatusIcon = getStatusIcon(assignment.status);
                return (
                  <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                        <StatusIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                        <p className="text-sm text-gray-600">{assignment.subject_name}</p>
                        <p className="text-xs text-gray-500">
                          Due: {format(new Date(assignment.due_date), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(assignment.status)}>
                        {assignment.status.toUpperCase()}
                      </Badge>
                      {assignment.grade !== undefined && (
                        <p className={`text-sm font-medium mt-1 ${getGradeColor((assignment.grade / assignment.max_points) * 100)}`}>
                          {assignment.grade}/{assignment.max_points}
                        </p>
                      )}
                      {assignment.is_late && (
                        <p className="text-xs text-red-600 mt-1">Late</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Deadlines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Upcoming Deadlines</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.upcoming_deadlines.map((deadline) => (
              <div key={deadline.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{deadline.title}</h4>
                  <p className="text-sm text-gray-600">{deadline.max_points} pts</p>
                </div>
                <p className="text-sm text-gray-600 mb-2">{deadline.section_name}</p>
                <p className="text-sm text-gray-500 mb-3">
                  Due: {format(new Date(deadline.due_date), 'MMM d, yyyy h:mm a')}
                </p>
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${getUrgencyColor(deadline.hours_remaining)}`}>
                    {deadline.hours_remaining < 24 
                      ? `${deadline.hours_remaining}h remaining`
                      : `${Math.floor(deadline.hours_remaining / 24)}d remaining`
                    }
                  </p>
                  <Button size="sm" variant="outline">
                    <Play className="h-4 w-4 mr-2" />
                    Start
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Grade Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Chart visualization would go here</p>
              </div>
            </div>
            
            {/* Recent Grade History */}
            <div className="mt-4 space-y-3">
              {dashboardData.grade_trends.slice(-5).map((trend, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{trend.assignment_title}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(trend.submitted_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${getGradeColor((trend.grade / trend.max_points) * 100)}`}>
                      {trend.grade}/{trend.max_points}
                    </p>
                    <p className={`text-xs ${getGradeColor((trend.grade / trend.max_points) * 100)}`}>
                      {((trend.grade / trend.max_points) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance by Subject */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Performance by Subject</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.performance_by_subject.map((subject, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{subject.subject_name}</h4>
                    <p className={`text-lg font-bold ${getGradeColor(subject.avg_grade)}`}>
                      {subject.avg_grade.toFixed(1)}%
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>{subject.assignment_count} assignments</span>
                    <span>{subject.completion_rate.toFixed(1)}% completion</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${subject.completion_rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button className="h-20 flex flex-col items-center justify-center">
              <FileText className="h-6 w-6 mb-2" />
              <span>View Assignments</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Trophy className="h-6 w-6 mb-2" />
              <span>Check Grades</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <BookOpen className="h-6 w-6 mb-2" />
              <span>View Sections</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Calendar className="h-6 w-6 mb-2" />
              <span>Schedule</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}