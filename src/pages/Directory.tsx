import { useMemo, useState } from 'react';
import { ArrowUpDown, Filter } from 'lucide-react';
import type { Mosque } from '../lib/types';
import { loadMosques } from '../lib/store';
import { districtsOf, DIVISIONS, upazilasOf, unionsOf } from '../data/locations';
import { EMPTY_FILTERS, searchMosques, type SearchFilters } from '../lib/search';
import { EmptyState, MosqueCard, SectionHeading } from '../components/ui';
import { SearchBox } from '../components/SearchBox';

export function FilterControls({
  filters,
  onChange,
}: {
  filters: SearchFilters;
  onChange: (f: SearchFilters) => void;
}) {
  const districts = filters.division ? districtsOf(filters.division) : [];
  const upazilas = filters.division && filters.district ? upazilasOf(filters.division, filters.district) : [];
  const unions = filters.upazila ? unionsOf(filters.upazila) : [];
  const sel =
    'w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm font-medium text-emerald-950';
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
      <p className="mb-3 flex items-center gap-2 font-bold text-emerald-900">
        <Filter className="h-4 w-4" /> ফিল্টার
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <select
          className={sel}
          value={filters.division}
          onChange={(e) =>
            onChange({ ...filters, division: e.target.value, district: '', upazila: '', unionName: '' })
          }
          aria-label="বিভাগ"
        >
          <option value="">সব বিভাগ</option>
          {DIVISIONS.map((d) => (
            <option key={d.name} value={d.name}>{d.name}</option>
          ))}
        </select>
        <select
          className={sel}
          value={filters.district}
          disabled={!filters.division}
          onChange={(e) => onChange({ ...filters, district: e.target.value, upazila: '', unionName: '' })}
          aria-label="জেলা"
        >
          <option value="">সব জেলা</option>
          {districts.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          className={sel}
          value={filters.upazila}
          disabled={!filters.district}
          onChange={(e) => onChange({ ...filters, upazila: e.target.value, unionName: '' })}
          aria-label="উপজেলা"
        >
          <option value="">সব উপজেলা</option>
          {upazilas.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
        {unions.length > 0 ? (
          <select
            className={sel}
            value={filters.unionName}
            onChange={(e) => onChange({ ...filters, unionName: e.target.value })}
            aria-label="ইউনিয়ন"
          >
            <option value="">সব ইউনিয়ন</option>
            {unions.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        ) : (
          <input
            className={sel}
            placeholder="ইউনিয়নের নাম"
            value={filters.unionName}
            onChange={(e) => onChange({ ...filters, unionName: e.target.value })}
            aria-label="ইউনিয়ন"
          />
        )}
        <select
          className={sel}
          value={filters.sort}
          onChange={(e) => onChange({ ...filters, sort: e.target.value as SearchFilters['sort'] })}
          aria-label="সাজান"
        >
          <option value="recent">সম্প্রতি যুক্ত</option>
          <option value="alpha">নামের ক্রম (অ-হ)</option>
        </select>
      </div>
      {(filters.division || filters.district || filters.upazila || filters.unionName || filters.q) && (
        <button
          onClick={() => onChange(EMPTY_FILTERS)}
          className="mt-3 text-sm font-bold text-emerald-700 hover:underline"
        >
          সব ফিল্টার মুছুন ✕
        </button>
      )}
    </div>
  );
}

export function MosqueGrid({ mosques, pageSize = 9 }: { mosques: Mosque[]; pageSize?: number }) {
  const [visible, setVisible] = useState(pageSize);
  const shown = mosques.slice(0, visible);
  if (mosques.length === 0) {
    return (
      <EmptyState
        title="কোনো মসজিদ পাওয়া যায়নি"
        hint="অন্য নাম বা ফিল্টার দিয়ে চেষ্টা করুন, অথবা আপনার মসজিদটি নিবন্ধন করুন।"
      />
    );
  }
  return (
    <>
      <p className="mb-4 text-sm font-medium text-stone-500">{mosques.length}টি মসজিদ পাওয়া গেছে</p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((m) => (
          <MosqueCard key={m.id} mosque={m} />
        ))}
      </div>
      {visible < mosques.length && (
        <div className="mt-8 text-center">
          <button
            onClick={() => setVisible((v) => v + pageSize)}
            className="rounded-full border-2 border-emerald-700 px-8 py-3 font-bold text-emerald-800 transition hover:bg-emerald-50"
          >
            আরও দেখুন ({mosques.length - visible}টি বাকি)
          </button>
        </div>
      )}
    </>
  );
}

export default function DirectoryPage() {
  const all = useMemo(() => loadMosques().filter((m) => m.status === 'approved'), []);
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  const results = useMemo(() => searchMosques(all, filters), [all, filters]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <SectionHeading
        eyebrow="ডিরেক্টরি"
        title="সকল মসজিদ"
        subtitle="বাংলাদেশের অনুমোদিত সব মসজিদের তালিকা। ফিল্টার দিয়ে বিভাগ, জেলা, উপজেলা বা ইউনিয়ন অনুযায়ী দেখুন।"
      />
      <div className="mb-5">
        <FilterControls filters={filters} onChange={setFilters} />
      </div>
      <MosqueGrid mosques={results} />
    </div>
  );
}

export function SearchPage({ initialQ = '' }: { initialQ?: string }) {
  const all = useMemo(() => loadMosques().filter((m) => m.status === 'approved'), []);
  const [filters, setFilters] = useState<SearchFilters>({ ...EMPTY_FILTERS, q: initialQ });
  const results = useMemo(() => searchMosques(all, filters), [all, filters]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <SectionHeading
        eyebrow="স্মার্ট সার্চ"
        title="মসজিদ খুঁজুন"
        subtitle="মসজিদের নাম, ইমামের নাম, জেলা, উপজেলা, ইউনিয়ন, গ্রাম বা মহল্লা দিয়ে খুঁজুন — বাংলা ও ইংরেজি উভয় নামেই।"
      />
      <div className="mx-auto mb-5 max-w-2xl">
        <SearchBox mosques={all} initial={filters.q} />
      </div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-1 text-sm font-bold text-emerald-900">
          <ArrowUpDown className="h-4 w-4" /> অনুসন্ধানের শব্দ:
        </span>
        <input
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          placeholder="যেমন: বায়তুল মুকাররম, তারা মসজিদ, ঢাকা…"
          className="min-w-[220px] flex-1 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm"
          aria-label="অনুসন্ধানের শব্দ"
        />
      </div>
      <div className="mb-5">
        <FilterControls filters={filters} onChange={setFilters} />
      </div>
      <MosqueGrid mosques={results} />
    </div>
  );
}
