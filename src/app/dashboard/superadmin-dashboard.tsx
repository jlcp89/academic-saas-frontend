'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CustomLineChart, 
  CustomBarChart, 
  CustomPieChart, 
  CustomAreaChart,
  MetricCard 
} from '@/components/ui/charts';
import { useSuperAdminDashboard } from '@/lib/api/dashboard';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { 
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  Server,
  Activity,
  Database,
  Zap,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  BarChart3,
  PieChart,
  RefreshCw,
  Eye,
  Settings
} from 'lucide-react';

export function SuperAdminDashboard() {
  const { data: dashboardData, isLoading, error, refetch } = useSuperAdminDashboard();
  const router = useRouter();

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

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return CheckCircle;
      case 'warning':
        return AlertTriangle;
      case 'critical':
        return XCircle;
      default:
        return Clock;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const HealthIcon = getHealthStatusIcon(dashboardData.system_health.database_status);

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Schools</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.stats.total_schools}
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
                <p className="text-sm font-medium text-gray-600">Active Schools</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.stats.active_schools}
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
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.stats.total_users}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.stats.active_subscriptions}
                </p>
              </div>
              <Activity className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(dashboardData.stats.revenue_this_month)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Growth Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.stats.growth_rate.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5" />
            <span>System Health</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <HealthIcon className={`h-8 w-8 ${getHealthStatusColor(dashboardData.system_health.database_status)}`} />
              </div>
              <p className="text-sm font-medium text-gray-600">Database</p>
              <p className={`text-sm font-bold ${getHealthStatusColor(dashboardData.system_health.database_status)}`}>
                {dashboardData.system_health.database_status.toUpperCase()}
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Zap className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-600">API Response</p>
              <p className="text-sm font-bold text-blue-600">
                {dashboardData.system_health.api_response_time}ms
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-600">Active Connections</p>
              <p className="text-sm font-bold text-green-600">
                {dashboardData.system_health.active_connections}
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Database className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-sm font-medium text-gray-600">Memory Usage</p>
              <p className="text-sm font-bold text-purple-600">
                {dashboardData.system_health.memory_usage}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Schools */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Recent Schools</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push('/schools')}>
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.recent_schools.map((school) => (
                <div key={school.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{school.name}</h4>
                      <p className="text-sm text-gray-500">{school.subdomain}.academic-saas.com</p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(school.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={school.subscription_status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {school.subscription_status}
                    </Badge>
                    <p className="text-sm text-gray-500 mt-1">
                      {school.user_count} users
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Subscription Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5" />
              <span>Subscription Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.subscription_overview.map((plan) => (
                <div key={plan.plan} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${plan.plan === 'PREMIUM' ? 'bg-purple-600' : 'bg-blue-600'}`}></div>
                    <div>
                      <p className="font-medium text-gray-900">{plan.plan}</p>
                      <p className="text-sm text-gray-500">{plan.count} schools</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatCurrency(plan.revenue)}
                    </p>
                    <p className="text-sm text-gray-500">monthly</p>
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
            <BarChart3 className="h-5 w-5" />
            <span>User Growth Trend</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CustomLineChart
            data={[
              { name: 'Jan', users: 4000, newUsers: 400 },
              { name: 'Feb', users: 3000, newUsers: 300 },
              { name: 'Mar', users: 2000, newUsers: 200 },
              { name: 'Apr', users: 2780, newUsers: 278 },
              { name: 'May', users: 1890, newUsers: 189 },
              { name: 'Jun', users: 2390, newUsers: 239 },
              { name: 'Jul', users: 3490, newUsers: 349 },
            ]}
            lines={[
              { key: 'users', name: 'Total Users', color: '#3b82f6' },
              { key: 'newUsers', name: 'New Users', color: '#10b981' }
            ]}
            height={300}
          />
          
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
                {dashboardData.user_growth.slice(-5).map((data, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{format(new Date(data.date), 'MMM d, yyyy')}</td>
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

      {/* Revenue and Subscription Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <CustomAreaChart
          title="Monthly Revenue"
          subtitle="Revenue breakdown by subscription plans"
          data={[
            { name: 'Jan', basic: 4000, premium: 8000, enterprise: 12000 },
            { name: 'Feb', basic: 3500, premium: 8500, enterprise: 13000 },
            { name: 'Mar', basic: 4200, premium: 9200, enterprise: 14200 },
            { name: 'Apr', basic: 3800, premium: 8800, enterprise: 13800 },
            { name: 'May', basic: 4500, premium: 9500, enterprise: 15500 },
            { name: 'Jun', basic: 4800, premium: 9800, enterprise: 16800 },
          ]}
          areas={[
            { key: 'basic', name: 'Basic Plan', color: '#10b981' },
            { key: 'premium', name: 'Premium Plan', color: '#3b82f6' },
            { key: 'enterprise', name: 'Enterprise Plan', color: '#8b5cf6' }
          ]}
          stacked={true}
          height={350}
        />

        {/* Subscription Distribution */}
        <CustomPieChart
          title="Subscription Distribution"
          subtitle="Current active subscriptions by plan type"
          data={[
            { name: 'Basic', value: 35, color: '#10b981' },
            { name: 'Premium', value: 45, color: '#3b82f6' },
            { name: 'Enterprise', value: 20, color: '#8b5cf6' }
          ]}
          height={350}
          showLabels={false}
        />
      </div>

      {/* School Performance Metrics */}
      <CustomBarChart
        title="Top Performing Schools"
        subtitle="Schools ranked by active users and engagement"
        data={[
          { name: 'Lincoln High', users: 450, engagement: 85 },
          { name: 'Roosevelt Elementary', users: 320, engagement: 92 },
          { name: 'Washington Middle', users: 280, engagement: 78 },
          { name: 'Jefferson Academy', users: 380, engagement: 88 },
          { name: 'Adams Charter', users: 220, engagement: 95 },
        ]}
        bars={[
          { key: 'users', name: 'Active Users', color: '#3b82f6' },
          { key: 'engagement', name: 'Engagement %', color: '#10b981' }
        ]}
        height={300}
      />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              className="h-20 flex flex-col items-center justify-center"
              onClick={() => router.push('/schools')}
            >
              <Building2 className="h-6 w-6 mb-2" />
              <span>Create School</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center"
              onClick={() => router.push('/users')}
            >
              <Users className="h-6 w-6 mb-2" />
              <span>Manage Users</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center"
              onClick={() => router.push('/dashboard')}
            >
              <Settings className="h-6 w-6 mb-2" />
              <span>System Settings</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center"
              onClick={() => router.push('/reports')}
            >
              <BarChart3 className="h-6 w-6 mb-2" />
              <span>View Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}