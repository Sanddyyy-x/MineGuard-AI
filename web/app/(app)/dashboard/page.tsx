'use client';

import { useCallback, useEffect, useState } from 'react';

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
import type { Severity } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getDashboardData, type DashboardData } from '@/lib/data/dashboard';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getDashboardData());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const stats = data?.stats;
  const compliancePieData = data?.complianceDistribution ?? [];

  const complianceColor = (name: string) => {
    switch (name) {
      case 'Compliant':
        return 'hsl(var(--success))';
      case 'Pending':
        return 'hsl(var(--info))';
      case 'Overdue':
        return 'hsl(var(--warning))';
      case 'Non-Compliant':
        return 'hsl(var(--destructive))';
      default:
        return 'hsl(var(--muted-foreground))';
    }
  };

  const alertSeverity = (severity: string): Severity => {
    switch (severity.toLowerCase()) {
      case 'low':
        return 'low';
      case 'high':
        return 'high';
      case 'critical':
        return 'critical';
      default:
        return 'medium';
    }
  };

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

      {error ? (
        <Card>
          <CardContent className="flex items-center justify-between gap-4 py-6">
            <div>
              <p className="font-medium text-foreground">Unable to load dashboard data</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            </div>
            <Button variant="outline" onClick={() => void loadDashboard()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Mines"
          value={loading ? '—' : stats?.totalMines ?? '—'}
          icon={Pickaxe}
          accent="primary"
        />
        <StatCard
          label="Compliance Rate"
          value={loading ? '—' : `${stats?.complianceRate ?? 0}%`}
          icon={ShieldCheck}
          accent="success"
        />
        <StatCard
          label="Open Violations"
          value={loading ? '—' : stats?.openViolations ?? '—'}
          icon={AlertTriangle}
          accent="destructive"
        />
        <StatCard
          label="Unread Alerts"
          value={loading ? '—' : stats?.unreadAlerts ?? '—'}
          icon={Bell}
          accent="warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Inspections Needing Attention"
          value={loading ? '—' : stats?.inspectionsNeedingAttention ?? '—'}
          icon={ClipboardCheck}
          accent="info"
        />
        <StatCard
          label="Total Observations"
          value={loading ? '—' : stats?.totalObservations ?? '—'}
          icon={Eye}
          accent="primary"
        />
        <StatCard
          label="Corrective Actions In Progress"
          value={loading ? '—' : stats?.correctiveActionsInProgress ?? '—'}
          icon={Wrench}
          accent="warning"
        />
        <StatCard
          label="Documented Mines"
          value={loading ? '—' : `${stats?.documentedMines ?? 0}/${stats?.totalMines ?? 0}`}
          icon={TrendingUp}
          accent="success"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Compliance & Violations Trend</CardTitle>
            <CardDescription>Recorded monthly data across all monitored mines</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                Loading trend data…
              </div>
            ) : data?.trend.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data.trend}>
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
                    formatter={(value: number, name: string) =>
                      name === 'Compliance %' ? [`${value}%`, name] : [value, name]
                    }
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
            ) : (
              <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                No trend data available.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Compliance Distribution</CardTitle>
            <CardDescription>Status across all compliance records</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                Loading distribution…
              </div>
            ) : compliancePieData.some((item) => item.value > 0) ? (
              <>
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
                        <Cell key={`cell-${index}`} fill={complianceColor(entry.name)} />
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
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                No compliance records available.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: region data + alerts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Compliance by Region</CardTitle>
            <CardDescription>Average recorded compliance score by state</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                Loading regional data…
              </div>
            ) : data?.regions.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.regions} layout="vertical">
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
                    width={110}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [`${value}%`, 'Average score']}
                  />
                  <Bar
                    dataKey="compliance"
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                    name="Average score"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                No regional data available.
              </div>
            )}
          </CardContent>
        </Card>

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
            {loading ? (
              <div className="py-10 text-center text-sm text-muted-foreground">Loading alerts…</div>
            ) : data?.recentAlerts.length ? (
              <div className="space-y-3">
                {data.recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="mt-0.5 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">{alert.title}</span>
                        <SeverityBadge severity={alertSeverity(alert.severity)} />
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
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">No alerts available.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
