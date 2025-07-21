'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Color palettes
const COLORS = {
  primary: ['#3b82f6', '#1d4ed8', '#1e40af', '#1e3a8a'],
  secondary: ['#10b981', '#059669', '#047857', '#065f46'],
  accent: ['#f59e0b', '#d97706', '#b45309', '#92400e'],
  success: ['#22c55e', '#16a34a', '#15803d', '#166534'],
  warning: ['#eab308', '#ca8a04', '#a16207', '#854d0e'],
  error: ['#ef4444', '#dc2626', '#b91c1c', '#991b1b'],
  neutral: ['#64748b', '#475569', '#334155', '#1e293b'],
};

// Chart wrapper component
interface ChartWrapperProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  height?: number;
}

export function ChartWrapper({ 
  title, 
  subtitle, 
  children, 
  className = '', 
  height = 300 
}: ChartWrapperProps) {
  return (
    <Card className={className}>
      {(title || subtitle) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </CardHeader>
      )}
      <CardContent>
        <div style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Line Chart Component
interface LineChartData {
  name: string;
  [key: string]: string | number;
}

interface CustomLineChartProps {
  data: LineChartData[];
  lines: Array<{
    key: string;
    color?: string;
    name?: string;
  }>;
  title?: string;
  subtitle?: string;
  height?: number;
  className?: string;
}

export function CustomLineChart({ 
  data, 
  lines, 
  title, 
  subtitle, 
  height = 300, 
  className 
}: CustomLineChartProps) {
  return (
    <ChartWrapper title={title} subtitle={subtitle} height={height} className={className}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis 
          dataKey="name" 
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
        />
        <Legend />
        {lines.map((line, index) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            stroke={line.color || COLORS.primary[index % COLORS.primary.length]}
            strokeWidth={2}
            dot={{ fill: line.color || COLORS.primary[index % COLORS.primary.length], strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
            name={line.name || line.key}
          />
        ))}
      </LineChart>
    </ChartWrapper>
  );
}

// Area Chart Component
interface CustomAreaChartProps {
  data: LineChartData[];
  areas: Array<{
    key: string;
    color?: string;
    name?: string;
  }>;
  title?: string;
  subtitle?: string;
  height?: number;
  className?: string;
  stacked?: boolean;
}

export function CustomAreaChart({ 
  data, 
  areas, 
  title, 
  subtitle, 
  height = 300, 
  className,
  stacked = false 
}: CustomAreaChartProps) {
  return (
    <ChartWrapper title={title} subtitle={subtitle} height={height} className={className}>
      <AreaChart data={data} stackOffset={stacked ? "expand" : undefined}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis 
          dataKey="name" 
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
        />
        <Legend />
        {areas.map((area, index) => (
          <Area
            key={area.key}
            type="monotone"
            dataKey={area.key}
            stackId={stacked ? "1" : undefined}
            stroke={area.color || COLORS.primary[index % COLORS.primary.length]}
            fill={area.color || COLORS.primary[index % COLORS.primary.length]}
            fillOpacity={0.6}
            name={area.name || area.key}
          />
        ))}
      </AreaChart>
    </ChartWrapper>
  );
}

// Bar Chart Component
interface BarChartData {
  name: string;
  [key: string]: string | number;
}

interface CustomBarChartProps {
  data: BarChartData[];
  bars: Array<{
    key: string;
    color?: string;
    name?: string;
  }>;
  title?: string;
  subtitle?: string;
  height?: number;
  className?: string;
  horizontal?: boolean;
}

export function CustomBarChart({ 
  data, 
  bars, 
  title, 
  subtitle, 
  height = 300, 
  className,
  horizontal = false 
}: CustomBarChartProps) {
  return (
    <ChartWrapper title={title} subtitle={subtitle} height={height} className={className}>
      <BarChart data={data} layout={horizontal ? 'horizontal' : 'vertical'}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis 
          type={horizontal ? 'number' : 'category'}
          dataKey={horizontal ? undefined : 'name'}
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          type={horizontal ? 'category' : 'number'}
          dataKey={horizontal ? 'name' : undefined}
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
        />
        <Legend />
        {bars.map((bar, index) => (
          <Bar
            key={bar.key}
            dataKey={bar.key}
            fill={bar.color || COLORS.primary[index % COLORS.primary.length]}
            name={bar.name || bar.key}
            radius={[2, 2, 0, 0]}
          />
        ))}
      </BarChart>
    </ChartWrapper>
  );
}

// Pie Chart Component
interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

interface CustomPieChartProps {
  data: PieChartData[];
  title?: string;
  subtitle?: string;
  height?: number;
  className?: string;
  showLabels?: boolean;
  innerRadius?: number;
}

export function CustomPieChart({ 
  data, 
  title, 
  subtitle, 
  height = 300, 
  className,
  showLabels = true,
  innerRadius = 0 
}: CustomPieChartProps) {
  const renderLabel = (entry: PieChartData) => {
    return `${entry.name}: ${entry.value}`;
  };

  return (
    <ChartWrapper title={title} subtitle={subtitle} height={height} className={className}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={showLabels ? renderLabel : false}
          outerRadius={Math.min(height * 0.35, 120)}
          innerRadius={innerRadius}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.color || COLORS.primary[index % COLORS.primary.length]} 
            />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
        />
        <Legend />
      </PieChart>
    </ChartWrapper>
  );
}

// Donut Chart Component (Pie with inner radius)
interface CustomDonutChartProps extends Omit<CustomPieChartProps, 'innerRadius'> {
  innerRadius?: number;
}

export function CustomDonutChart({ 
  innerRadius = 60, 
  ...props 
}: CustomDonutChartProps) {
  return <CustomPieChart {...props} innerRadius={innerRadius} />;
}

// Dashboard Metric Card with Mini Chart
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    trend: 'up' | 'down' | 'neutral';
  };
  data?: Array<{ name: string; value: number }>;
  chartType?: 'line' | 'area' | 'bar';
  color?: string;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  data, 
  chartType = 'line',
  color = COLORS.primary[0] 
}: MetricCardProps) {
  const formatChange = (change: number, trend: string) => {
    const prefix = change > 0 ? '+' : '';
    const textColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';
    return (
      <span className={`text-sm ${textColor}`}>
        {prefix}{change}%
      </span>
    );
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {change && formatChange(change.value, change.trend)}
            </div>
          </div>
          
          {data && data.length > 0 && (
            <div className="flex-shrink-0 w-20 h-16">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'line' && (
                  <LineChart data={data}>
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={color} 
                      strokeWidth={2} 
                      dot={false} 
                    />
                  </LineChart>
                )}
                {chartType === 'area' && (
                  <AreaChart data={data}>
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke={color} 
                      fill={color}
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                )}
                {chartType === 'bar' && (
                  <BarChart data={data}>
                    <Bar dataKey="value" fill={color} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export { COLORS };