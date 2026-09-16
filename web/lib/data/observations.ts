import { supabase } from '@/lib/supabase-client';

const OBSERVATION_PHOTO_BUCKET = 'mineguard-documents';
const OBSERVATION_PHOTO_SIGNED_URL_SECONDS = 60 * 60;

export interface Observation {
  id: string;
  inspectionId: string;
  category: string;
  description: string;
  severity: string;
  latitude: number | null;
  longitude: number | null;
  photoUrl: string | null;
  createdAt: string;
}

interface ObservationRow {
  id: string;
  inspection_id: string;
  category: string | null;
  description: string | null;
  severity: string | null;
  latitude: number | null;
  longitude: number | null;
  photo_url: string | null;
  created_at: string;
}

function mapObservation(row: ObservationRow): Observation {
  return {
    id: row.id,
    inspectionId: row.inspection_id,
    category: row.category ?? 'Uncategorized',
    description: row.description ?? '',
    severity: row.severity ?? 'Unknown',
    latitude: row.latitude,
    longitude: row.longitude,
    photoUrl: row.photo_url,
    createdAt: row.created_at,
  };
}

/**
 * Creates a temporary signed URL for an observation photo in the
 * private mineguard-documents bucket.
 *
 * photo_url is treated as the storage object path exactly as stored
 * in the database. No prefix or path is invented.
 */
export async function getObservationPhotoSignedUrl(
  photoPath: string | null
): Promise<string | null> {
  if (!photoPath || !photoPath.trim()) {
    return null;
  }

  const path = photoPath.trim();

  // Keep compatibility if a future record contains a complete URL.
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const { data, error } = await supabase.storage
    .from(OBSERVATION_PHOTO_BUCKET)
    .createSignedUrl(path, OBSERVATION_PHOTO_SIGNED_URL_SECONDS);

  if (error) {
    throw new Error(error.message);
  }

  return data?.signedUrl ?? null;
}

export async function getObservations(): Promise<Observation[]> {
  const { data, error } = await supabase
    .from('observations')
    .select(`
      id,
      inspection_id,
      category,
      description,
      severity,
      latitude,
      longitude,
      photo_url,
      created_at
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapObservation);
}

export async function getObservationById(
  observationId: string
): Promise<Observation | null> {
  const { data, error } = await supabase
    .from('observations')
    .select(`
      id,
      inspection_id,
      category,
      description,
      severity,
      latitude,
      longitude,
      photo_url,
      created_at
    `)
    .eq('id', observationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapObservation(data) : null;
}

export async function getObservationsByInspection(
  inspectionId: string
): Promise<Observation[]> {
  const { data, error } = await supabase
    .from('observations')
    .select(`
      id,
      inspection_id,
      category,
      description,
      severity,
      latitude,
      longitude,
      photo_url,
      created_at
    `)
    .eq('inspection_id', inspectionId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapObservation);
}
