import { supabase } from '@/lib/supabase-client';

export interface GisMine {
  id: string;
  mineCode: string;
  mineName: string;
  state: string | null;
  district: string | null;
  status: string | null;
  boundary: PolygonGeometry | null;
}

export interface PolygonGeometry {
  type: 'Polygon';
  coordinates: number[][][];
}

interface MineRow {
  id: string;
  mine_code: string;
  mine_name: string;
  state: string | null;
  district: string | null;
  status: string | null;
  mine_boundary: unknown;
}

/**
 * Supabase/PostgREST returns PostGIS geography values as EWKB hex.
 * This parser intentionally supports only the verified Polygon geometry
 * used by public.mines.mine_boundary (SRID 4326).
 */
function parsePostgisPolygon(value: unknown): PolygonGeometry | null {
  if (value === null || value === undefined) return null;

  if (typeof value === 'object' && value !== null) {
    const candidate = value as { type?: string; coordinates?: unknown };
    if (candidate.type === 'Polygon' && Array.isArray(candidate.coordinates)) {
      return candidate as PolygonGeometry;
    }
  }

  if (typeof value !== 'string') return null;

  const hex = value.startsWith('\\x') ? value.slice(2) : value;
  if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length < 18) return null;

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }

  const view = new DataView(bytes.buffer);
  let offset = 0;

  const readUint8 = () => view.getUint8(offset++);
  const readUint32 = (little: boolean) => {
    const value = view.getUint32(offset, little);
    offset += 4;
    return value;
  };
  const readFloat64 = (little: boolean) => {
    const value = view.getFloat64(offset, little);
    offset += 8;
    return value;
  };

  try {
    const byteOrder = readUint8();
    const little = byteOrder === 1;
    if (byteOrder !== 0 && byteOrder !== 1) return null;

    let type = readUint32(little);
    const hasZ = (type & 0x80000000) !== 0;
    const hasM = (type & 0x40000000) !== 0;
    const hasSrid = (type & 0x20000000) !== 0;
    type &= 0x1fffffff;

    // ISO SQL/MM type code for Polygon is 3. EWKB uses 3 as well.
    if (type !== 3) return null;

    if (hasSrid) {
      readUint32(little);
    }

    const ringCount = readUint32(little);
    const rings: number[][][] = [];

    for (let ringIndex = 0; ringIndex < ringCount; ringIndex += 1) {
      const pointCount = readUint32(little);
      const ring: number[][] = [];

      for (let pointIndex = 0; pointIndex < pointCount; pointIndex += 1) {
        const lon = readFloat64(little);
        const lat = readFloat64(little);
        if (hasZ) readFloat64(little);
        if (hasM) readFloat64(little);
        ring.push([lon, lat]);
      }

      rings.push(ring);
    }

    return { type: 'Polygon', coordinates: rings };
  } catch {
    return null;
  }
}

export async function getGisMines(): Promise<GisMine[]> {
  const { data, error } = await supabase
    .from('mines')
    .select('id,mine_code,mine_name,state,district,status,mine_boundary')
    .order('mine_code', { ascending: true });

  if (error) throw new Error(error.message);

  return ((data ?? []) as MineRow[]).map((row) => ({
    id: row.id,
    mineCode: row.mine_code,
    mineName: row.mine_name,
    state: row.state,
    district: row.district,
    status: row.status,
    boundary: parsePostgisPolygon(row.mine_boundary),
  }));
}
