export const APP_ROLES = [
  'Admin',
  'Contractor/Worker',
  'Inspector',
  'Mine Manager',
  'Safety Officer',
  'Subsidiary Admin',
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  organization: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string | null;
  profile: Profile;
}
