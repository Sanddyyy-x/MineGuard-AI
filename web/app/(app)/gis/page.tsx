'use client';

import { useEffect, useMemo, useRef, useState, type MouseEvent, type WheelEvent } from 'react';
import Link from 'next/link';
import {
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  MapPin,
  Building2,
  X,
  AlertTriangle,
} from 'lucide-react';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MineStatusBadge } from '@/components/shared/status-badges';
import { getGisMines, type GisMine } from '@/lib/data/gis';

interface ProjectedMine {
  mine: GisMine;
  points: string;
}

const DEFAULT_BOUNDS = { minX: 68, maxX: 97, minY: 6, maxY: 38 };

function collectPoints(mine: GisMine): number[][] {
  return mine.boundary?.coordinates.flatMap((ring) => ring) ?? [];
}

function projectMine(
  mine: GisMine,
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  width: number,
  height: number,
  padding = 35
): string {
  const rings = mine.boundary?.coordinates ?? [];
  return rings
    .map((ring) =>
      ring
        .map(([lon, lat]) => {
          const x =
            padding +
            ((lon - bounds.minX) / Math.max(bounds.maxX - bounds.minX, 0.000001)) *
              (width - padding * 2);
          const y =
            height -
            padding -
            ((lat - bounds.minY) / Math.max(bounds.maxY - bounds.minY, 0.000001)) *
              (height - padding * 2);
          return `${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(' ')
    )
    .join(' ');
}

export default function GisPage() {
  const [mines, setMines] = useState<GisMine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMineId, setSelectedMineId] = useState<string | null>(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragState = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(
    null
  );
  const [isDragging, setIsDragging] = useState(false);

  async function loadMines() {
    setLoading(true);
    setError(null);
    try {
      const data = await getGisMines();
      setMines(data);
      setSelectedMineId((current) => (current && data.some((mine) => mine.id === current) ? current : null));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load mine map data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMines();
  }, []);

  const stateOptions = useMemo(
    () =>
      Array.from(
        new Set(mines.map((mine) => mine.state).filter((value): value is string => Boolean(value)))
      ).sort(),
    [mines]
  );

  const filteredMines = useMemo(() => {
    const query = search.trim().toLowerCase();
    return mines.filter((mine) => {
      const matchesSearch =
        !query ||
        mine.mineName.toLowerCase().includes(query) ||
        mine.mineCode.toLowerCase().includes(query) ||
        (mine.district ?? '').toLowerCase().includes(query);
      const matchesState = stateFilter === 'all' || mine.state === stateFilter;
      const matchesStatus = statusFilter === 'all' || mine.status === statusFilter;
      return matchesSearch && matchesState && matchesStatus;
    });
  }, [mines, search, stateFilter, statusFilter]);

  const selectedMine = mines.find((mine) => mine.id === selectedMineId) ?? null;

  const bounds = useMemo(() => {
    const points = mines.flatMap(collectPoints);
    if (!points.length) return DEFAULT_BOUNDS;

    const xs = points.map(([x]) => x);
    const ys = points.map(([, y]) => y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const xPad = Math.max((maxX - minX) * 0.08, 0.05);
    const yPad = Math.max((maxY - minY) * 0.08, 0.05);

    return { minX: minX - xPad, maxX: maxX + xPad, minY: minY - yPad, maxY: maxY + yPad };
  }, [mines]);

  const projected: ProjectedMine[] = useMemo(
    () =>
      filteredMines.map((mine) => ({
        mine,
        points: projectMine(mine, bounds, 700, 480),
      })),
    [filteredMines, bounds]
  );

  const missingBoundaryCount = mines.filter((mine) => !mine.boundary).length;
  const hasActiveFilters = Boolean(search) || stateFilter !== 'all' || statusFilter !== 'all';

  function handleZoomIn() {
    setZoom((value) => Math.min(4, +(value + 0.5).toFixed(2)));
  }

  function handleZoomOut() {
    setZoom((value) => Math.max(1, +(value - 0.5).toFixed(2)));
  }

  function handleResetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  function handleWheel(event: WheelEvent<SVGSVGElement>) {
    event.preventDefault();
    setZoom((value) => Math.min(4, Math.max(1, +(value - event.deltaY * 0.001).toFixed(2))));
  }

  function handleMouseDown(event: MouseEvent<SVGSVGElement>) {
    dragState.current = {
      startX: event.clientX,
      startY: event.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    setIsDragging(true);
  }

  function handleMouseMove(event: MouseEvent<SVGSVGElement>) {
    if (!dragState.current) return;
    const dx = (event.clientX - dragState.current.startX) / zoom;
    const dy = (event.clientY - dragState.current.startY) / zoom;
    setPan({ x: dragState.current.panX + dx, y: dragState.current.panY + dy });
  }

  function handleMouseUp() {
    dragState.current = null;
    setIsDragging(false);
  }

  return (
    <div className="animate-fade-in space-y-6">
<PageHeader
  title="GIS / Mine Map"
  description="Geographic view of the monitored mine boundaries and locations."
/>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Unable to load GIS data</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => void loadMines()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <Card className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by mine name, code, or district..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-10"
              aria-label="Search mines"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filter by state">
                <SelectValue placeholder="Filter by State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {stateOptions.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filter by status">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Array.from(
                  new Set(mines.map((mine) => mine.status).filter((value): value is string => Boolean(value)))
                ).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {hasActiveFilters && (
          <p className="mt-3 text-sm text-muted-foreground">
            Showing {filteredMines.length} of {mines.length} mines
          </p>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-lg">Mine Map</CardTitle>
              <CardDescription>
                {loading ? 'Loading recorded mine boundaries…' : 'Click a boundary to view mine details'}
              </CardDescription>
            </div>

            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="icon" onClick={handleZoomOut} aria-label="Zoom out">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleZoomIn} aria-label="Zoom in">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleResetView} aria-label="Reset view">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex h-[420px] items-center justify-center text-sm text-muted-foreground">
                Loading mine boundaries…
              </div>
            ) : filteredMines.length === 0 ? (
              <div className="flex h-[420px] flex-col items-center justify-center gap-3 text-center">
                <MapPin className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No mines match the current search and filters.
                </p>
              </div>
            ) : (
              <svg
                viewBox="0 0 700 480"
                className={`h-[420px] w-full touch-none select-none rounded-md border border-border bg-muted/30 ${
                  isDragging ? 'cursor-grabbing' : 'cursor-grab'
                }`}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                role="img"
                aria-label="Map of recorded mine boundaries"
              >
                <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
                  {Array.from({ length: 7 }).map((_, index) => (
                    <line
                      key={`v-${index}`}
                      x1={(index * 700) / 6}
                      y1={0}
                      x2={(index * 700) / 6}
                      y2={480}
                      stroke="hsl(var(--border))"
                      strokeWidth={0.5}
                    />
                  ))}
                  {Array.from({ length: 7 }).map((_, index) => (
                    <line
                      key={`h-${index}`}
                      x1={0}
                      y1={(index * 480) / 6}
                      x2={700}
                      y2={(index * 480) / 6}
                      stroke="hsl(var(--border))"
                      strokeWidth={0.5}
                    />
                  ))}

                  {projected.map(({ mine, points }) => {
                    if (!points) return null;
                    const selected = mine.id === selectedMineId;

                    return (
                      <g
                        key={mine.id}
                        onClick={() => setSelectedMineId(mine.id)}
                        role="button"
                        tabIndex={0}
                        aria-label={`Select ${mine.mineName}`}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setSelectedMineId(mine.id);
                          }
                        }}
                        className="cursor-pointer"
                      >
                        <polygon
                          points={points}
                          fill={selected ? 'hsl(var(--primary) / 0.28)' : 'hsl(var(--primary) / 0.16)'}
                          stroke={selected ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.75)'}
                          strokeWidth={selected ? 2.5 : 1.5}
                        />
                        <circle
                          cx={Number(points.split(' ')[0]?.split(',')[0] ?? 0)}
                          cy={Number(points.split(' ')[0]?.split(',')[1] ?? 0)}
                          r={selected ? 5 : 3.5}
                          fill="hsl(var(--primary))"
                          stroke="hsl(var(--background))"
                          strokeWidth={1.5}
                        />
                        <title>{`${mine.mineName} (${mine.mineCode})`}</title>
                      </g>
                    );
                  })}
                </g>
              </svg>
            )}

            {missingBoundaryCount > 0 && (
              <p className="mt-3 text-xs text-muted-foreground">
                {missingBoundaryCount} mine{missingBoundaryCount === 1 ? '' : 's'} has no recorded boundary
                and is not drawn.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-lg">Mine Details</CardTitle>
            {selectedMine && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedMineId(null)}
                aria-label="Clear selection"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>

          <CardContent>
            {!selectedMine ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <MapPin className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Select a mine boundary on the map to view details.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{selectedMine.mineCode}</p>
                  <Link
                    href={`/mines/${selectedMine.id}`}
                    className="text-lg font-semibold text-foreground hover:text-primary hover:underline"
                  >
                    {selectedMine.mineName}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {[selectedMine.district, selectedMine.state].filter(Boolean).join(', ') || '—'}
                  </p>
                </div>
                <div className="space-y-2.5"></div>
                  
                 
                <div className="space-y-2.5 divide-y divide-border">
                  <div className="flex items-center justify-between pt-2 text-sm first:pt-0">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5" />
                      Status
                    </span>
                    <span className="font-medium text-foreground">{selectedMine.status ?? '—'}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 text-sm">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      Boundary
                    </span>
                    <span className="font-medium text-foreground">
                      {selectedMine.boundary ? 'Recorded' : 'Not recorded'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 text-sm">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Mine ID
                    </span>
                    <span className="max-w-[190px] truncate font-medium text-foreground" title={selectedMine.id}>
                      {selectedMine.id}
                    </span>
                  </div>
                </div>

                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/mines/${selectedMine.id}`}>View Full Mine Profile</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
