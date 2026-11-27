import type { Mosque } from './types';
import { slugify } from './types';

export const API_URL = (import.meta as unknown as { env?: Record<string, string> }).env
  ?.VITE_API_URL as string | undefined;

export function isApiMode(): boolean {
  return !!API_URL;
}

export interface ApiMosque {
  id: string;
  nameBn: string;
  nameEn?: string;
  imamName: string;
  imamVerified?: boolean | string;
  division: string;
  district: string;
  upazila: string;
  unionName?: string;
  village: string;
  address: string;
  establishedYear?: string;
  description?: string;
  history?: string;
  mapsUrl?: string;
  images?: string[];
  representativePhoto?: boolean | string;
  verified?: boolean | string;
  featured?: boolean | string;
  status: string;
  createdAt?: string;
}

const asBool = (v: boolean | string | undefined): boolean => v === true || v === 'TRUE';

export function backendToMosque(row: ApiMosque): Mosque {
  return {
    id: String(row.id),
    slug: slugify(row.nameBn) || `mosque-${String(row.id).toLowerCase()}`,
    nameBn: row.nameBn,
    nameEn: row.nameEn || undefined,
    imamName: row.imamName,
    imamVerified: asBool(row.imamVerified),
    division: row.division,
    district: row.district,
    upazila: row.upazila,
    unionName: row.unionName || '',
    village: row.village,
    address: row.address,
    establishedYear: row.establishedYear || undefined,
    description: row.description || '',
    history: row.history || undefined,
    mapsUrl: row.mapsUrl || undefined,
    submittedBy: '',
    images: row.images && row.images.length > 0 ? row.images : [],
    representativePhoto: asBool(row.representativePhoto),
    verified: asBool(row.verified),
    featured: asBool(row.featured),
    status: (row.status as Mosque['status']) || 'approved',
    createdAt: row.createdAt || '',
    views: 0,
  };
}

async function apiCall<T>(action: string, params: Record<string, unknown> = {}, token?: string): Promise<T> {
  if (!API_URL) throw new Error('VITE_API_URL is not set.');
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, token, ...params }),
  });
  if (!res.ok) throw new Error(`Backend HTTP ${res.status}`);
  const data = (await res.json()) as { ok: boolean; error?: string } & T;
  if (!data.ok) throw new Error(data.error || `Backend action ${action} failed`);
  return data;
}

export async function getApprovedMosques(): Promise<Mosque[]> {
  const data = await apiCall<{ mosques: ApiMosque[] }>('getApprovedMosques', { limit: 200 });
  return (data.mosques || []).map(backendToMosque);
}

export async function searchMosquesApi(q: string): Promise<Mosque[]> {
  const data = await apiCall<{ mosques: ApiMosque[] }>('searchMosques', { q });
  return (data.mosques || []).map(backendToMosque);
}

export async function submitMosqueApi(m: Mosque): Promise<{ id: string; duplicates: { id: string; nameBn: string }[] }> {
  return apiCall('submitMosque', {
    nameBn: m.nameBn,
    nameEn: m.nameEn || '',
    imamName: m.imamName,
    division: m.division,
    district: m.district,
    upazila: m.upazila,
    unionName: m.unionName,
    village: m.village,
    address: m.address,
    establishedYear: m.establishedYear || '',
    description: m.description,
    mapsUrl: m.mapsUrl || '',
    committeeContact: m.committeeContact || '',
    submittedBy: m.submittedBy,
    submitterMobile: m.submitterMobile || '',
    permission: true,
  });
}

export async function uploadImagesApi(
  mosqueId: string,
  images: string[],
): Promise<{ fileIds: string[] }> {
  const payload = images.map((data, i) => ({
    name: `${mosqueId}-${i + 1}.jpg`,
    data,
    mimeType: 'image/jpeg',
  }));
  return apiCall('uploadMosqueImages', { mosqueId, images: payload });
}

export async function getPendingSubmissions(token: string): Promise<ApiMosque[]> {
  const data = await apiCall<{ submissions: ApiMosque[] }>('getPendingSubmissions', {}, token);
  return data.submissions || [];
}

export async function approveMosqueApi(mosqueId: string, token: string): Promise<void> {
  await apiCall('approveMosque', { mosqueId }, token);
}

export async function rejectMosqueApi(mosqueId: string, token: string): Promise<void> {
  await apiCall('rejectMosque', { mosqueId }, token);
}

export async function updateMosqueApi(
  mosqueId: string,
  field: string,
  value: string,
  token: string,
): Promise<void> {
  await apiCall('updateMosque', { mosqueId, field, value }, token);
}

export async function updateImamApi(mosqueId: string, imamName: string, token: string): Promise<void> {
  await apiCall('updateImam', { mosqueId, imamName }, token);
}

export async function archiveMosqueApi(mosqueId: string, token: string): Promise<void> {
  await apiCall('archiveMosque', { mosqueId }, token);
}

export async function requestCorrectionApi(params: {
  mosqueId: string;
  field: string;
  correctedValue: string;
  reporterName: string;
  reporterMobile?: string;
  note?: string;
}): Promise<void> {
  await apiCall('requestCorrection', params);
}

export async function adminLoginApi(username: string, password: string): Promise<string> {
  const data = await apiCall<{ token: string }>('adminLogin', { username, password });
  return data.token;
}

export async function getDashboardStatsApi(token: string): Promise<Record<string, unknown>> {
  return apiCall('getDashboardStats', {}, token);
}
