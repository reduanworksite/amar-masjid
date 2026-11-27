import type { Mosque } from './types';

export interface SearchFilters {
  q: string;
  division: string;
  district: string;
  upazila: string;
  unionName: string;
  sort: 'recent' | 'alpha';
}

export const EMPTY_FILTERS: SearchFilters = {
  q: '',
  division: '',
  district: '',
  upazila: '',
  unionName: '',
  sort: 'recent',
};

export function searchMosques(list: Mosque[], f: SearchFilters): Mosque[] {
  const q = f.q.trim().toLowerCase();
  let out = list.filter((m) => {
    if (f.division && m.division !== f.division) return false;
    if (f.district && m.district !== f.district) return false;
    if (f.upazila && m.upazila !== f.upazila) return false;
    if (f.unionName && m.unionName !== f.unionName) return false;
    if (!q) return true;
    const hay = [
      m.nameBn,
      m.nameEn ?? '',
      m.imamName,
      m.division,
      m.district,
      m.upazila,
      m.unionName,
      m.village,
      m.address,
      m.id,
    ]
      .join(' ')
      .toLowerCase();
    return q.split(/\s+/).every((tok) => hay.includes(tok));
  });
  out =
    f.sort === 'alpha'
      ? [...out].sort((a, b) => a.nameBn.localeCompare(b.nameBn, 'bn'))
      : [...out].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return out;
}

export function suggestions(list: Mosque[], q: string): Mosque[] {
  const query = q.trim().toLowerCase();
  if (query.length < 1) return [];
  return list
    .filter((m) =>
      [m.nameBn, m.nameEn ?? '', m.imamName, m.district, m.upazila, m.village]
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
    .slice(0, 8);
}

export function countByDistrict(list: Mosque[]): { district: string; count: number }[] {
  const map = new Map<string, number>();
  list.forEach((m) => map.set(m.district, (map.get(m.district) ?? 0) + 1));
  return [...map.entries()]
    .map(([district, count]) => ({ district, count }))
    .sort((a, b) => b.count - a.count);
}

export function countByDivision(list: Mosque[]): { division: string; count: number }[] {
  const map = new Map<string, number>();
  list.forEach((m) => map.set(m.division, (map.get(m.division) ?? 0) + 1));
  return [...map.entries()]
    .map(([division, count]) => ({ division, count }))
    .sort((a, b) => b.count - a.count);
}
