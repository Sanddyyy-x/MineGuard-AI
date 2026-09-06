'use client';

import Link from 'next/link';
import {
  Pickaxe,
  ShieldCheck,
  AlertTriangle,
  Bell,
  ClipboardCheck,
  Eye,
  Wrench,
  TrendingUp,
  ArrowRight,
  Clock,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { SeverityBadge } from '@/components/shared/status-badges';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  mockDashboardStats,
  mockComplianceTrend,
  mockRegionData,
  mockAlerts,
} from '@/lib/mock-data';

const compliancePieData = [
  { name: 'Compliant', value: 3, color: 'hsl(var(--success))' },
  { name: 'Warning', value: 1, color: 'hsl(var(--warning))' },
  { name: 'Critical', value: 2, color: 'hsl(var(--destructive))' },
];

export default function DashboardPage() {
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of mine compliance, safety, and operational metrics across all monitored sites."
        action={
          <Button asChild>
            <Link href="/reports">
              <span>Generate Report</span>
            </Link>
          </Button>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Mines"
          value={mockDashboardStats.totalMines}
          icon={Pickaxe}
          trend={{ value: '2.1%', positive: true }}
          accent="primary"
        />
        <StatCard
          label="Compliance Rate"
          value={`${mockDashboardStats.complianceRate}%`}
          icon={ShieldCheck}
          trend={{ value: '1.5%', positive: true }}
          accent="success"
        />
        <StatCard
          label="Open Violations"
          value={mockDashboardStats.openViolations}
          icon={AlertTriangle}
          trend={{ value: '8.3%', positive: false }}
          accent="destructive"
        />
        <StatCard
          label="Active Alerts"
          value={mockDashboardStats.activeAlerts}
          icon={Bell}
          accent="warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pending Inspections"
          value={mockDashboardStats.pendingInspections}
          icon={ClipboardCheck}
          accent="info"
        />
        <StatCard
          label="Total Observations"
          value={mockDashboardStats.totalObservations}
          icon={Eye}
          accent="primary"
        />
        <StatCard
          label="Corrective Actions In Progress"
          value={mockDashboardStats.correctiveActionsInProgress}
          icon={Wrench}
          accent="warning"
        />
        <StatCard
          label="Active Mines"
          value={`${mockDashboardStats.activeMines}/${mockDashboardStats.totalMines}`}
          icon={TrendingUp}
          accent="success"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Compliance trend chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Compliance & Violations Trend</CardTitle>
            <CardDescription>Monthly overview across all monitored mines</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={mockComplianceTrend}>
                <defs>
                  <linearGradient id="complianceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="violationsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="compliance"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  fill="url(#complianceGrad)"
                  name="Compliance %"
                />
                <Area
                  type="monotone"
                  dataKey="violations"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  fill="url(#violationsGrad)"
                  name="Violations"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Compliance distribution pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Compliance Distribution</CardTitle>
            <CardDescription>Status across all mines</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={compliancePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {compliancePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {compliancePieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: region data + alerts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Region bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Compliance by Region</CardTitle>
            <CardDescription>State-wise compliance scores</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={mockRegionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis
                  type="category"
                  dataKey="region"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  width={90}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="compliance"
                  fill="hsl(var(--primary))"
                  radius={[0, 4, 4, 0]}
                  name="Compliance %"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Alerts</CardTitle>
                <CardDescription>Latest safety and compliance notifications</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/alerts">
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockAlerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="mt-0.5 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">{alert.title}</span>
                      <SeverityBadge severity={alert.severity} />
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {alert.description}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{alert.mineName}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(alert.timestamp).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
