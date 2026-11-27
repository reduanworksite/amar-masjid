import { useEffect, useMemo, useState } from 'react';
import { Footer, Navbar, SectionHeading } from './components/ui';
import { SearchBox } from './components/SearchBox';
import HomePage from './pages/Home';
import DirectoryPage, { FilterControls, MosqueGrid } from './pages/Directory';
import RegisterPage from './pages/Register';
import MosqueProfilePage from './pages/MosqueProfile';
import AdminPage from './pages/Admin';
import { EMPTY_FILTERS, searchMosques, type SearchFilters } from './lib/search';
import { loadMosques, refreshFromApi } from './lib/store';

function parseHash(): { route: string; param: string; query: URLSearchParams } {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [pathPart, queryPart] = raw.split('?');
  const parts = pathPart.split('/').filter(Boolean);
  return { route: parts[0] || '', param: parts[1] || '', query: new URLSearchParams(queryPart || '') };
}

export default function App() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    void refreshFromApi();
  }, []);
  useEffect(() => {
    const onChange = () => {
      setHash(window.location.hash);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, [hash]);

  const { route, param, query } = parseHash();

  let content: React.ReactNode;
  if (route === '') {
    content = <HomePage />;
  } else if (route === 'mosques') {
    content = <DirectoryPage />;
  } else if (route === 'search') {
    content = (
      <SearchPageWithParams
        key={window.location.hash}
        initial={{
          q: query.get('q') || '',
          division: query.get('division') || '',
          district: query.get('district') || '',
          upazila: query.get('upazila') || '',
        }}
      />
    );
  } else if (route === 'register') {
    content = <RegisterPage />;
  } else if (route === 'mosque' && param) {
    const id = param.split('-').slice(-1)[0];
    content = <MosqueProfilePage id={id} />;
  } else if (route === 'admin') {
    content = <AdminPage />;
  } else {
    content = (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-emerald-950">পাতাটি পাওয়া যায়নি</h1>
        <a href="#/" className="mt-4 inline-block font-bold text-emerald-700 hover:underline">
          ← হোমপেজে ফিরুন
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{content}</main>
      <Footer />
    </div>
  );
}

function SearchPageWithParams({ initial }: { initial: Record<string, string> }) {
  const all = useMemo(() => loadMosques().filter((m) => m.status === 'approved'), []);
  const [filters, setFilters] = useState<SearchFilters>({
    ...EMPTY_FILTERS,
    q: initial.q || '',
    division: initial.division || '',
    district: initial.district || '',
    upazila: initial.upazila || '',
  });
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
        <span className="text-sm font-bold text-emerald-900">অনুসন্ধানের শব্দ:</span>
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
