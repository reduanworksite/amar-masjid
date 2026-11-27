export type MosqueStatus = 'approved' | 'pending' | 'rejected' | 'archived';

export interface Mosque {
  id: string;
  slug: string;
  nameBn: string;
  nameEn?: string;
  imamName: string;
  imamVerified: boolean;
  division: string;
  district: string;
  upazila: string;
  unionName: string;
  village: string;
  address: string;
  establishedYear?: string;
  description: string;
  history?: string;
  mapsUrl?: string;
  committeeContact?: string;
  submittedBy: string;
  submitterMobile?: string;
  images: string[];
  representativePhoto: boolean;
  verified: boolean;
  featured: boolean;
  status: MosqueStatus;
  createdAt: string;
  views: number;
}

export interface CorrectionRequest {
  id: string;
  mosqueId: string;
  mosqueName: string;
  field: string;
  currentValue: string;
  correctedValue: string;
  reporterName: string;
  reporterMobile?: string;
  note?: string;
  status: 'open' | 'resolved' | 'rejected';
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  at: string;
  actor: string;
  action: string;
  target: string;
  detail: string;
}

export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function profilePath(m: Mosque): string {
  return `#/mosque/${m.slug}-${m.id.toLowerCase()}`;
}

export function profileUrl(m: Mosque): string {
  return `${window.location.origin}${window.location.pathname}${profilePath(m)}`;
}

export const IMAM_UNVERIFIED = 'তথ্য যাচাই চলছে';
