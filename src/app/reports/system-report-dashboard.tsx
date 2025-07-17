'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSystemReport } from '@/lib/api/reports';
import { format } from 'date-fns';
import { 
  Building2,
  Users,
  BookOpen,
  FileText,
  Trophy,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Target,
  GraduationCap
} from 'lucide-react';
import type { ReportFilters } from '@/lib/api/reports';

interface SystemReportDashboardProps {
  filters: ReportFilters;
}

export function SystemReportDashboard({ filters }: SystemReportDashboardProps) {
  const { data: systemReport, isLoading, error } = useSystemReport(filters);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading system report...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading system report: {error.message}</p>
      </div>
    );
  }

  if (!systemReport) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No system data available.</p>
      </div>
    );
  }

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-green-600';
    if (grade >= 80) return 'text-blue-600';
    if (grade >= 70) return 'text-yellow-600';
    if (grade >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'HOMEWORK':
        return 'bg-blue-100 text-blue-800';
      case 'QUIZ':
        return 'bg-green-100 text-green-800';
      case 'EXAM':
        return 'bg-red-100 text-red-800';
      case 'PROJECT':
        return 'bg-purple-100 text-purple-800';
      case 'DISCUSSION':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* System Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Schools</p>
                <p className="text-2xl font-bold text-gray-900">
                  {systemReport.total_schools}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {systemReport.total_users}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sections</p>
                <p className="text-2xl font-bold text-gray-900">
                  {systemReport.total_sections}
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Assignments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {systemReport.total_assignments}
                </p>
              </div>
              <FileText className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {systemReport.total_submissions}
                </p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Grades</p>
                <p className="text-2xl font-bold text-gray-900">
                  {systemReport.total_grades}
                </p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5" />
              <span>Grade Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemReport.grade_distribution.map((grade, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-16 text-sm font-medium text-gray-700">
                      {grade.range}
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-blue-600 h-3 rounded-full"
                        style={{ width: `${grade.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900">{grade.count}</span>
                    <span className="text-xs text-gray-500 ml-1">({grade.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Assignment Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Assignment Types</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemReport.assignment_type_distribution.map((type, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge className={getTypeColor(type.type)}>
                        {type.type}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{type.count} assignments</p>
                      <p className={`text-sm ${getGradeColor(type.avg_grade)}`}>
                        {type.avg_grade.toFixed(1)}% avg
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(type.count / systemReport.total_assignments) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>User Growth Trend</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Chart visualization would go here</p>
              <p className="text-sm">Integration with charting library needed</p>
            </div>
          </div>
          
          {/* Growth Data Table */}
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Date</th>
                  <th className="text-center py-2">New Users</th>
                  <th className="text-center py-2">Total Users</th>
                  <th className="text-center py-2">Growth</th>
                </tr>
              </thead>
              <tbody>
                {systemReport.user_growth.slice(-5).map((data, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2 flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{format(new Date(data.date), 'MMM d, yyyy')}</span>
                    </td>
                    <td className="text-center py-2">{data.new_users}</td>
                    <td className="text-center py-2">{data.total_users}</td>
                    <td className="text-center py-2">
                      {index > 0 && (
                        <span className={`text-sm ${data.new_users > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                          {data.new_users > 0 ? '+' : ''}{data.new_users}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Monthly Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Month</th>
                  <th className="text-center py-2">Logins</th>
                  <th className="text-center py-2">Submissions</th>
                  <th className="text-center py-2">Assignments Created</th>
                  <th className="text-center py-2">Total Activity</th>
                </tr>
              </thead>
              <tbody>
                {systemReport.monthly_activity.map((activity, index) => {
                  const totalActivity = activity.logins + activity.submissions + activity.assignments_created;
                  return (
                    <tr key={index} className="border-b">
                      <td className="py-3 flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{activity.month}</span>
                      </td>
                      <td className="text-center py-3">
                        <div className="flex items-center justify-center space-x-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span>{activity.logins}</span>
                        </div>
                      </td>
                      <td className="text-center py-3">
                        <div className="flex items-center justify-center space-x-2">
                          <Target className="h-4 w-4 text-green-600" />
                          <span>{activity.submissions}</span>
                        </div>
                      </td>
                      <td className="text-center py-3">
                        <div className="flex items-center justify-center space-x-2">
                          <FileText className="h-4 w-4 text-purple-600" />
                          <span>{activity.assignments_created}</span>
                        </div>
                      </td>
                      <td className="text-center py-3">
                        <Badge className="bg-blue-100 text-blue-800">
                          {totalActivity}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}