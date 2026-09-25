'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Gauge,
  ListChecks,
  RefreshCw,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { getMineRiskIntelligence, type MineRiskIntelligence } from '@/lib/data/ai-risk';

function normalizeLevel(value: string | null): string {
  return (value ?? '').trim().toLowerCase();
}

function levelClass(value: string | null) {
  switch (normalizeLevel(value)) {
    case 'critical':
      return 'border-destructive/30 bg-destructive/10 text-destructive';
    case 'high':
      return 'border-destructive/20 bg-destructive/5 text-destructive';
    case 'medium':
      return 'border-warning/30 bg-warning/10 text-warning';
    case 'low':
      return 'border-success/30 bg-success/10 text-success';
    default:
      return 'border-border bg-muted text-muted-foreground';
  }
}

function formatScore(value: number | null) {
  return value == null ? '—' : `${value.toFixed(2)}/100`;
}

function formatContext(value: string | null) {
  return value ?? 'No risk context is available for this mine.';
}

export default function AiRiskPage() {
  const [profiles, setProfiles] = useState<MineRiskIntelligence[]>([]);
  const [selectedMineId, setSelectedMineId] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadRisk() {
    setLoading(true);
    setError(null);
    try {
      const data = await getMineRiskIntelligence();
      setProfiles(data);
      setSelectedMineId((current) =>
        current && data.some((item) => item.mineId === current)
          ? current
          : data[0]?.mineId ?? ''
      );
    } catch (err) {
      setProfiles([]);
      setError(err instanceof Error ? err.message : 'Unable to load risk intelligence.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRisk();
  }, []);

  const ranked = useMemo(
    () => profiles.slice().sort((a, b) => (b.riskScore ?? -1) - (a.riskScore ?? -1)),
    [profiles]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return ranked;
    return ranked.filter(
      (item) =>
        item.mineCode.toLowerCase().includes(query) ||
        item.mineName.toLowerCase().includes(query)
    );
  }, [ranked, search]);

  const selected =
    profiles.find((item) => item.mineId === selectedMineId) ?? ranked[0] ?? null;

  const averageScore = profiles.length
    ? profiles.reduce((sum, item) => sum + (item.riskScore ?? 0), 0) / profiles.length
    : null;
  const escalationCount = profiles.filter((item) => item.escalationRequired).length;
  const elevatedCount = profiles.filter((item) => ['medium', 'high', 'critical'].includes(normalizeLevel(item.riskLevel))).length;
  const highestRisk = ranked[0] ?? null;

  const chartData = ranked.map((item) => ({
    mine: item.mineCode,
    score: item.riskScore ?? 0,
  }));

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="AI Risk Analysis"
        description="Review mine risk levels, key risk drivers, and recommended actions."
      />

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Unable to load risk intelligence</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={loadRisk}>
              <RefreshCw className="mr-1.5 h-4 w-4" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-80 w-full" />
        </div>
      ) : profiles.length === 0 ? (
        <Card className="py-16 text-center">
          <CardContent>
            <Brain className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No risk intelligence is available.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Average Risk Score"
              value={averageScore == null ? '—' : averageScore.toFixed(2)}
              icon={Gauge}
              accent="primary"
            />
            <StatCard
              label="Highest Risk Mine"
              value={highestRisk?.mineCode ?? '—'}
              icon={ShieldAlert}
              accent="destructive"
            />
            <StatCard
              label="Escalation Required"
              value={escalationCount}
              icon={AlertTriangle}
              accent={escalationCount > 0 ? 'destructive' : 'success'}
            />
            <StatCard
              label="Medium+ Risk Mines"
              value={elevatedCount}
              icon={ListChecks}
              accent={elevatedCount > 0 ? 'warning' : 'success'}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Mine Risk Ranking</CardTitle>
                <CardDescription>Current risk scores across monitored mines</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} fontSize={12} />
                    <YAxis type="category" dataKey="mine" width={65} fontSize={12} />
                    <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}`, 'Risk Score']} />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]} name="Risk Score" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Compare Mines</CardTitle>
                <CardDescription>Select a mine for its live risk intelligence</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selected?.mineId ?? ''} onValueChange={setSelectedMineId}>
                  <SelectTrigger aria-label="Select mine">
                    <SelectValue placeholder="Select a mine" />
                  </SelectTrigger>
                  <SelectContent>
                    {ranked.map((item) => (
                      <SelectItem key={item.mineId} value={item.mineId}>
                        {item.mineName} ({item.mineCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Filter mines..."
                    className="pl-10"
                    aria-label="Filter mines"
                  />
                </div>

                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {filtered.map((item) => (
                    <button
                      key={item.mineId}
                      type="button"
                      onClick={() => setSelectedMineId(item.mineId)}
                      className={`w-full rounded-md border px-3 py-2 text-left transition-colors ${
                        item.mineId === selected?.mineId ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{item.mineCode}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${levelClass(item.riskLevel)}`}>
                          {item.riskLevel ?? 'Unknown'}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{item.mineName}</span>
                        <span>{formatScore(item.riskScore)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {selected && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Risk Assessment</CardTitle>
                  <CardDescription>{selected.mineCode} · {selected.mineName}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-semibold">{selected.riskScore?.toFixed(2) ?? '—'}</span>
                    <span className="pb-1 text-sm text-muted-foreground">/ 100</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${levelClass(selected.riskLevel)}`}>
                      {selected.riskLevel ?? 'Unknown'}
                    </span>
                    <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium">
                      Priority: {selected.priority ?? '—'}
                    </span>
                    {selected.escalationRequired ? (
                      <span className="rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                        Escalation required
                      </span>
                    ) : (
                      <span className="rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                        No escalation required
                      </span>
                    )}
                  </div>
                  <div className="rounded-md border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Primary risk driver</p>
                    <p className="mt-1 text-sm font-medium">{selected.primaryRiskDriver ?? '—'}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Risk Drivers</CardTitle>
                  <CardDescription>Key factors contributing to the mine's risk level</CardDescription>
                </CardHeader>
                <CardContent>
                  {selected.riskDrivers.length ? (
                    <ul className="space-y-3">
                      {selected.riskDrivers.map((driver) => (
                        <li key={driver} className="flex gap-2 text-sm">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                          <span>{driver}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No risk drivers returned.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recommendations</CardTitle>
                  <CardDescription>Recommended actions based on the current risk assessment</CardDescription>
                </CardHeader>
                <CardContent>
                  {selected.recommendations.length ? (
                    <ul className="space-y-3">
                      {selected.recommendations.map((recommendation) => (
                        <li key={recommendation} className="flex gap-2 text-sm">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                          <span>{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No recommendations returned.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {selected && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="h-4 w-4" />
                  AI Risk Context
                </CardTitle>
                <CardDescription>
                  Additional context supporting the risk assessment for this mine.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap rounded-md border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
                  {formatContext(selected.aiContext)}
                </pre>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
