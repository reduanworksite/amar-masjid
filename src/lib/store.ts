import type { ActivityLog, CorrectionRequest, Mosque } from './types';
import { SEED_MOSQUES } from '../data/seedMosques';

export { API_URL } from './api';
import { getApprovedMosques, isApiMode, submitMosqueApi, uploadImagesApi } from './api';

const K = {
  mosques: 'amar-masjid:mosques:v1',
  corrections: 'amar-masjid:corrections:v1',
  logs: 'amar-masjid:activity:v1',
  adminHash: 'amar-masjid:admin-hash:v1',
  adminSession: 'amar-masjid:admin-session:v1',
  counter: 'amar-masjid:id-counter:v1',
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadMosques(): Mosque[] {
  const stored = read<Mosque[]>(K.mosques, []);
  if (stored.length === 0) {
    write(K.mosques, SEED_MOSQUES);
    return [...SEED_MOSQUES];
  }
  const ids = new Set(stored.map((m) => m.id));
  const missing = SEED_MOSQUES.filter((m) => !ids.has(m.id));
  if (missing.length > 0) {
    const merged = [...stored, ...missing];
    write(K.mosques, merged);
    return merged;
  }
  return stored;
}

export function saveMosques(list: Mosque[]) {
  write(K.mosques, list);
}

export function nextMosqueId(existing: Mosque[]): string {
  const nums = existing
    .map((m) => parseInt(m.id.replace('AM-', ''), 10))
    .filter((n) => !Number.isNaN(n));
  const counter = read<number>(K.counter, 0);
  const next = Math.max(0, ...nums, counter) + 1;
  write(K.counter, next);
  return `AM-${String(next).padStart(6, '0')}`;
}

export function loadCorrections(): CorrectionRequest[] {
  return read<CorrectionRequest[]>(K.corrections, []);
}

export function saveCorrections(list: CorrectionRequest[]) {
  write(K.corrections, list);
}

export function loadLogs(): ActivityLog[] {
  return read<ActivityLog[]>(K.logs, []);
}

export function logActivity(actor: string, action: string, target: string, detail: string) {
  const logs = loadLogs();
  logs.unshift({
    id: `LOG-${Date.now()}`,
    at: new Date().toISOString(),
    actor,
    action,
    target,
    detail,
  });
  write(K.logs, logs.slice(0, 500));
}

export function findDuplicates(
  candidate: Pick<Mosque, 'nameBn' | 'district' | 'upazila' | 'address' | 'village'>,
  all: Mosque[],
): Mosque[] {
  const norm = (s: string) => s.replace(/\s+/g, '').trim().toLowerCase();
  return all.filter(
    (m) =>
      norm(m.nameBn) === norm(candidate.nameBn) &&
      m.district === candidate.district &&
      m.upazila === candidate.upazila &&
      (norm(m.address).includes(norm(candidate.village)) ||
        norm(candidate.address).includes(norm(m.village)) ||
        norm(m.village) === norm(candidate.village)),
  );
}

export async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function adminHashExists(): boolean {
  return !!localStorage.getItem(K.adminHash);
}

export async function setAdminPassword(password: string): Promise<void> {
  localStorage.setItem(K.adminHash, await sha256(password));
  localStorage.setItem(K.adminSession, Date.now().toString());
}

export async function checkAdminPassword(password: string): Promise<boolean> {
  const stored = localStorage.getItem(K.adminHash);
  if (!stored) return false;
  const ok = (await sha256(password)) === stored;
  if (ok) localStorage.setItem(K.adminSession, Date.now().toString());
  return ok;
}

export function isAdminLoggedIn(): boolean {
  const ts = Number(localStorage.getItem(K.adminSession) || 0);
  return !!ts && Date.now() - ts < 12 * 60 * 60 * 1000;
}

export function adminLogout() {
  localStorage.removeItem(K.adminSession);
}

export function changeAdminPassword(): void {
  localStorage.removeItem(K.adminHash);
  localStorage.removeItem(K.adminSession);
}

export async function refreshFromApi(): Promise<void> {
  if (!isApiMode()) return;
  try {
    const remote = await getApprovedMosques();
    if (remote.length === 0) return;
    const local = loadMosques();
    const byId = new Map(local.map((m) => [m.id, m]));
    remote.forEach((m) => {
      if (!byId.has(m.id)) byId.set(m.id, m);
    });
    saveMosques([...byId.values()]);
  } catch {
  }
}

export async function syncSubmissionToApi(mosque: Mosque): Promise<void> {
  if (!isApiMode()) return;
  try {
    const res = await submitMosqueApi(mosque);
    if (mosque.images.length > 0) {
      await uploadImagesApi(res.id, mosque.images);
    }
    logActivity('সিস্টেম', 'ব্যাকএন্ড সিঙ্ক', mosque.nameBn, `Google Sheets-এ জমা হয়েছে (${res.id})`);
  } catch (err) {
    logActivity(
      'সিস্টেম',
      'ব্যাকএন্ড সিঙ্ক ব্যর্থ',
      mosque.nameBn,
      `লোকাল কপি সংরক্ষিত আছে — ${err instanceof Error ? err.message : 'অজানা ত্রুটি'}`,
    );
  }
}
