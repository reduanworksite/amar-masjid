import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Landmark,
  Inbox,
  CheckCircle2,
  Clock,
  XCircle,
  User,
  MapPin,
  Star,
  Image as ImageIcon,
  BarChart3,
  ScrollText,
  Settings,
  LogOut,
  ShieldCheck,
  Archive,
  Pencil,
  Trash2,
  Eye,
  KeyRound,
} from 'lucide-react';
import type { ActivityLog, CorrectionRequest, Mosque } from '../lib/types';
import {
  adminHashExists,
  adminLogout,
  changeAdminPassword,
  checkAdminPassword,
  isAdminLoggedIn,
  loadCorrections,
  loadLogs,
  loadMosques,
  logActivity,
  saveCorrections,
  saveMosques,
  setAdminPassword,
} from '../lib/store';
import { countByDistrict } from '../lib/search';
import { DIVISIONS } from '../data/locations';
import { EmptyState } from '../components/ui';

type Tab =
  | 'overview'
  | 'all'
  | 'new'
  | 'approved'
  | 'pending'
  | 'rejected'
  | 'imam'
  | 'locations'
  | 'featured'
  | 'images'
  | 'reports'
  | 'logs'
  | 'settings';

const MENU: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
  { id: 'all', label: 'সকল মসজিদ', icon: Landmark },
  { id: 'new', label: 'নতুন সাবমিশন', icon: Inbox },
  { id: 'approved', label: 'অনুমোদিত মসজিদ', icon: CheckCircle2 },
  { id: 'pending', label: 'অপেক্ষমাণ মসজিদ', icon: Clock },
  { id: 'rejected', label: 'প্রত্যাখ্যাত মসজিদ', icon: XCircle },
  { id: 'imam', label: 'ইমামের তথ্য', icon: User },
  { id: 'locations', label: 'অবস্থান ব্যবস্থাপনা', icon: MapPin },
  { id: 'featured', label: 'বিশেষ মসজিদ', icon: Star },
  { id: 'images', label: 'ছবি ব্যবস্থাপনা', icon: ImageIcon },
  { id: 'reports', label: 'রিপোর্ট / সংশোধন', icon: BarChart3 },
  { id: 'logs', label: 'অ্যাক্টিভিটি লগ', icon: ScrollText },
  { id: 'settings', label: 'সেটিংস', icon: Settings },
];

export default function AdminPage() {
  const [authed, setAuthed] = useState(isAdminLoggedIn());
  const [isSetup, setIsSetup] = useState(adminHashExists());
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [authError, setAuthError] = useState('');
  const [tab, setTab] = useState<Tab>('overview');
  const [mosques, setMosques] = useState<Mosque[]>(() => loadMosques());
  const [corrections, setCorrections] = useState<CorrectionRequest[]>(() => loadCorrections());
  const [logs, setLogs] = useState<ActivityLog[]>(() => loadLogs());
  const [editing, setEditing] = useState<Mosque | null>(null);
  const [editForm, setEditForm] = useState({ nameBn: '', imamName: '', address: '', village: '', description: '' });
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    if (authed) {
      setMosques(loadMosques());
      setCorrections(loadCorrections());
      setLogs(loadLogs());
    }
  }, [authed, tab]);

  const refreshLogs = () => setLogs(loadLogs());

  const update = (list: Mosque[], action: string, target: string, detail: string) => {
    saveMosques(list);
    setMosques(list);
    logActivity('অ্যাডমিন', action, target, detail);
    refreshLogs();
  };

  const setStatus = (m: Mosque, status: Mosque['status']) => {
    const list = mosques.map((x) => (x.id === m.id ? { ...x, status } : x));
    const label = status === 'approved' ? 'অনুমোদন' : status === 'rejected' ? 'প্রত্যাখ্যান' : 'আর্কাইভ';
    update(list, label, m.nameBn, `${m.id} — ${label} করা হয়েছে`);
  };

  const toggle = (m: Mosque, field: 'verified' | 'featured') => {
    const list = mosques.map((x) => (x.id === m.id ? { ...x, [field]: !x[field] } : x));
    update(
      list,
      field === 'verified' ? 'যাচাইকরণ' : 'বিশেষ মসজিদ',
      m.nameBn,
      `${m.id} — ${field === 'verified' ? (m.verified ? 'যাচাইকরণ বাতিল' : 'যাচাইকৃত হিসেবে চিহ্নিত') : m.featured ? 'বিশেষ থেকে সরানো' : 'বিশেষ মসজিদ হিসেবে যুক্ত'}`,
    );
  };

  const saveEdit = () => {
    if (!editing) return;
    const list = mosques.map((x) =>
      x.id === editing.id
        ? { ...x, nameBn: editForm.nameBn, imamName: editForm.imamName, address: editForm.address, village: editForm.village, description: editForm.description, imamVerified: editForm.imamName.trim() !== '' && editForm.imamName !== 'তথ্য যাচাই চলছে' ? x.imamVerified : x.imamVerified }
        : x,
    );
    update(list, 'তথ্য সম্পাদনা', editForm.nameBn, `${editing.id} — নাম/ইমাম/ঠিকানা/বিবরণ আপডেট`);
    setEditing(null);
  };

  const resolveCorrection = (c: CorrectionRequest, status: 'resolved' | 'rejected') => {
    const list = corrections.map((x) => (x.id === c.id ? { ...x, status } : x));
    saveCorrections(list);
    setCorrections(list);
    logActivity('অ্যাডমিন', status === 'resolved' ? 'সংশোধন অনুমোদন' : 'সংশোধন প্রত্যাখ্যান', c.mosqueName, `${c.field}: ${c.correctedValue}`);
    refreshLogs();
  };

  const applyCorrection = (c: CorrectionRequest) => {
    const list = mosques.map((x) => {
      if (x.id !== c.mosqueId) return x;
      if (c.field === 'ইমামের নাম') return { ...x, imamName: c.correctedValue, imamVerified: true };
      if (c.field === 'মসজিদের নাম') return { ...x, nameBn: c.correctedValue };
      if (c.field === 'ঠিকানা') return { ...x, address: c.correctedValue };
      if (c.field === 'প্রতিষ্ঠার সাল') return { ...x, establishedYear: c.correctedValue };
      return x;
    });
    update(list, 'সংশোধন প্রয়োগ', c.mosqueName, `${c.field} → ${c.correctedValue}`);
    resolveCorrection(c, 'resolved');
  };

  const deleteMosque = (m: Mosque) => {
    if (!window.confirm(`"${m.nameBn}" মুছে ফেলতে চান? এই কাজটি ফিরিয়ে নেওয়া যাবে না।`)) return;
    update(mosques.filter((x) => x.id !== m.id), 'মসজিদ মুছে ফেলা', m.nameBn, `${m.id} মুছে ফেলা হয়েছে`);
  };

  if (!authed) {
    const submitAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthError('');
      if (!isSetup) {
        if (password.length < 6) return setAuthError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
        if (password !== confirm) return setAuthError('দুটি পাসওয়ার্ড মিলছে না।');
        await setAdminPassword(password);
        setAuthed(true);
        logActivity('অ্যাডমিন', 'অ্যাডমিন পাসওয়ার্ড সেট', 'ড্যাশবোর্ড', 'প্রথমবারের মতো অ্যাডমিন পাসওয়ার্ড তৈরি হয়েছে');
        return;
      }
      if (await checkAdminPassword(password)) setAuthed(true);
      else setAuthError('ভুল পাসওয়ার্ড। আবার চেষ্টা করুন।');
    };
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <div className="rounded-3xl border border-emerald-100 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-700 text-white">
            <KeyRound className="h-7 w-7" />
          </span>
          <h1 className="text-2xl font-bold text-emerald-950">
            {isSetup ? 'অ্যাডমিন লগইন' : 'অ্যাডমিন পাসওয়ার্ড তৈরি করুন'}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            {isSetup
              ? 'ড্যাশবোর্ডে প্রবেশ করতে আপনার অ্যাডমিন পাসওয়ার্ড দিন।'
              : 'এটি প্রথমবারের সেটআপ। আপনার নিজের একটি শক্তিশালী অ্যাডমিন পাসওয়ার্ড তৈরি করুন। পাসওয়ার্ডটি কোথাও সংরক্ষণ করা হয় না — শুধু এই ব্রাউজারে এর হ্যাশ থাকে। প্রোডাকশনে লগইন চলবে Google Apps Script ব্যাকএন্ড দিয়ে।'}
          </p>
          <form onSubmit={submitAuth} className="mt-6 space-y-3 text-left">
            {authError && (
              <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700">{authError}</p>
            )}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="অ্যাডমিন পাসওয়ার্ড"
              className="w-full rounded-xl border border-stone-300 px-4 py-3"
              autoComplete={isSetup ? 'current-password' : 'new-password'}
            />
            {!isSetup && (
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="পাসওয়ার্ড আবার লিখুন"
                className="w-full rounded-xl border border-stone-300 px-4 py-3"
                autoComplete="new-password"
              />
            )}
            <button type="submit" className="w-full rounded-full bg-emerald-700 py-3 font-bold text-white hover:bg-emerald-800">
              {isSetup ? 'লগইন করুন' : 'পাসওয়ার্ড সেট করুন'}
            </button>
          </form>
          <p className="mt-4 text-xs text-stone-500">
            ডেমো মোড: লগইন এই ব্রাউজারে স্থানীয়ভাবে কাজ করে। সার্ভার-ভিত্তিক নিরাপদ লগইনের জন্য
            backend/SETUP_GUIDE.md দেখুন।
          </p>
        </div>
      </div>
    );
  }

  const total = mosques.length;
  const approved = mosques.filter((m) => m.status === 'approved');
  const pending = mosques.filter((m) => m.status === 'pending');
  const rejected = mosques.filter((m) => m.status === 'rejected');
  const districtsCovered = new Set(mosques.map((m) => m.district)).size;
  const byDistrict = countByDistrict(approved);

  const listForTab = (): Mosque[] => {
    switch (tab) {
      case 'all': return mosques;
      case 'new': return pending;
      case 'approved': return approved;
      case 'pending': return pending;
      case 'rejected': return rejected;
      case 'featured': return mosques.filter((m) => m.featured);
      case 'imam': return mosques;
      case 'images': return mosques;
      default: return mosques;
    }
  };

  const statCards = [
    { label: 'মোট মসজিদ', value: total, icon: Landmark, color: 'bg-emerald-700' },
    { label: 'অনুমোদিত', value: approved.length, icon: CheckCircle2, color: 'bg-emerald-600' },
    { label: 'অপেক্ষমাণ', value: pending.length, icon: Clock, color: 'bg-amber-500' },
    { label: 'প্রত্যাখ্যাত', value: rejected.length, icon: XCircle, color: 'bg-red-500' },
    { label: 'জেলা কভার', value: districtsCovered, icon: MapPin, color: 'bg-teal-600' },
    { label: 'খোলা সংশোধন আবেদন', value: corrections.filter((c) => c.status === 'open').length, icon: BarChart3, color: 'bg-amber-600' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-emerald-950 sm:text-3xl">অ্যাডমিন ড্যাশবোর্ড</h1>
          <p className="text-sm text-stone-500">আমার মসজিদ — নিবন্ধন যাচাই, অনুমোদন ও ব্যবস্থাপনা</p>
        </div>
        <button
          onClick={() => { adminLogout(); setAuthed(false); }}
          className="flex items-center gap-2 rounded-full border-2 border-red-200 px-5 py-2.5 font-bold text-red-600 transition hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" /> লগআউট
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="mb-2 w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 font-bold text-emerald-800 lg:hidden"
          >
            {mobileMenu ? 'মেনু বন্ধ করুন ✕' : '☰ অ্যাডমিন মেনু'}
          </button>
          <nav className={`${mobileMenu ? 'block' : 'hidden'} space-y-1 rounded-2xl border border-emerald-100 bg-white p-3 shadow-sm lg:block`}>
            {MENU.map((item) => (
              <button
                key={item.id}
                onClick={() => { setTab(item.id); setMobileMenu(false); }}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold transition ${
                  tab === item.id ? 'bg-emerald-700 text-white' : 'text-emerald-950 hover:bg-emerald-50'
                }`}
              >
                <item.icon className="h-4.5 w-4.5 shrink-0" />
                {item.label}
                {item.id === 'new' && pending.length > 0 && (
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-bold ${tab === item.id ? 'bg-white text-emerald-700' : 'bg-amber-500 text-white'}`}>
                    {pending.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        <div className="min-w-0">

          {tab === 'overview' && (
            <div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {statCards.map((s) => (
                  <div key={s.label} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                    <span className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-white ${s.color}`}>
                      <s.icon className="h-5 w-5" />
                    </span>
                    <p className="text-3xl font-bold text-emerald-950">{s.value}</p>
                    <p className="text-sm text-stone-500">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                <h2 className="mb-4 font-bold text-emerald-950">সাম্প্রতিক যুক্ত মসজিদ</h2>
                {mosques.length === 0 ? (
                  <EmptyState title="এখনো কোনো মসজিদ নেই" />
                ) : (
                  <div className="space-y-2">
                    {[...mosques].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5).map((m) => (
                      <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50/60 px-4 py-3">
                        <span className="font-semibold text-emerald-950">{m.nameBn} <span className="text-xs text-stone-500">({m.id})</span></span>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${m.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : m.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'}`}>
                          {m.status === 'approved' ? 'অনুমোদিত' : m.status === 'pending' ? 'অপেক্ষমাণ' : m.status === 'rejected' ? 'প্রত্যাখ্যাত' : 'আর্কাইভ'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-6 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                <h2 className="mb-4 font-bold text-emerald-950">জেলা অনুযায়ী মসজিদের পরিসংখ্যান</h2>
                {byDistrict.map((d) => (
                  <div key={d.district} className="mb-2 flex items-center gap-3 text-sm">
                    <span className="w-28 shrink-0 font-semibold text-emerald-950">{d.district}</span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-stone-100">
                      <div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.min(100, d.count * 20)}%` }} />
                    </div>
                    <span className="w-10 text-right font-bold text-emerald-800">{d.count}টি</span>
                  </div>
                ))}
                {byDistrict.length === 0 && <p className="text-sm text-stone-500">এখনো কোনো অনুমোদিত মসজিদ নেই।</p>}
              </div>
            </div>
          )}

          {['all', 'new', 'approved', 'pending', 'rejected', 'featured'].includes(tab) && (
            <MosqueAdminTable
              mosques={listForTab()}
              onApprove={(m) => setStatus(m, 'approved')}
              onReject={(m) => setStatus(m, 'rejected')}
              onArchive={(m) => setStatus(m, 'archived')}
              onToggle={toggle}
              onEdit={(m) => {
                setEditing(m);
                setEditForm({ nameBn: m.nameBn, imamName: m.imamName, address: m.address, village: m.village, description: m.description });
              }}
              onDelete={deleteMosque}
            />
          )}

          {tab === 'imam' && (
            <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
              <h2 className="mb-1 font-bold text-emerald-950">ইমামের তথ্য</h2>
              <p className="mb-4 text-sm text-stone-500">প্রতিটি মসজিদের বর্তমান ইমামের নাম — যাচাই হয়নি এমন নাম “তথ্য যাচাই চলছে” হিসেবে দেখায়। নামে ক্লিক করে সম্পাদনা করুন।</p>
              <div className="space-y-2">
                {mosques.map((m) => (
                  <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-100 px-4 py-3">
                    <div>
                      <p className="font-semibold text-emerald-950">{m.nameBn}</p>
                      <p className="text-xs text-stone-500">{m.upazila}, {m.district}</p>
                    </div>
                    <button
                      onClick={() => {
                        setEditing(m);
                        setEditForm({ nameBn: m.nameBn, imamName: m.imamName, address: m.address, village: m.village, description: m.description });
                      }}
                      className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3.5 py-2 text-sm font-bold text-amber-700 hover:bg-amber-100"
                    >
                      <User className="h-4 w-4" /> {m.imamName}
                      {m.imamVerified && <ShieldCheck className="h-4 w-4 text-emerald-600" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'locations' && (
            <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
              <h2 className="mb-1 font-bold text-emerald-950">অবস্থান ব্যবস্থাপনা</h2>
              <p className="mb-4 text-sm text-stone-500">
                ৮টি বিভাগ, ৬৪টি জেলা ও উপজেলার ডেটাসেট অন্তর্ভুক্ত আছে। ইউনিয়নের পূর্ণ তালিকা
                ব্যাকএন্ড সংযুক্ত হলে Locations শিট থেকে আসবে।
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {DIVISIONS.map((d) => (
                  <div key={d.name} className="rounded-xl border border-stone-100 p-4">
                    <p className="font-bold text-emerald-950">{d.name} বিভাগ</p>
                    <p className="text-sm text-stone-500">{d.districts.length}টি জেলা</p>
                    <p className="mt-1 text-xs leading-relaxed text-stone-400">
                      {d.districts.map((x) => x.name).join(' · ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'images' && (
            <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
              <h2 className="mb-1 font-bold text-emerald-950">ছবি ব্যবস্থাপনা</h2>
              <p className="mb-4 text-sm text-stone-500">প্রতিটি মসজিদের ছবি — মূল ছবি ও গ্যালারি। প্রোডাকশনে ছবিগুলো Google Drive-এর MOSQUE_PHOTOS ফোল্ডারে থাকে।</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {mosques.map((m) => (
                  <div key={m.id} className="overflow-hidden rounded-xl border border-stone-100">
                    <img src={m.images[0]} alt={m.nameBn} className="h-36 w-full object-cover" />
                    <div className="p-3">
                      <p className="font-bold text-emerald-950">{m.nameBn}</p>
                      <p className="text-xs text-stone-500">{m.images.length}টি ছবি · {m.representativePhoto ? 'প্রতিনিধিত্বমূলক ছবি' : 'জমাকৃত ছবি'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'reports' && (
            <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
              <h2 className="mb-1 font-bold text-emerald-950">সংশোধনের আবেদন ও রিপোর্ট</h2>
              <p className="mb-4 text-sm text-stone-500">দর্শকদের পাঠানো ভুল তথ্যের রিপোর্ট — যাচাই করে প্রয়োগ বা প্রত্যাখ্যান করুন।</p>
              {corrections.length === 0 ? (
                <EmptyState title="কোনো সংশোধনের আবেদন নেই" hint="দর্শকরা ভুল তথ্য রিপোর্ট করলে এখানে দেখা যাবে।" />
              ) : (
                <div className="space-y-3">
                  {corrections.map((c) => (
                    <div key={c.id} className="rounded-xl border border-stone-100 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-bold text-emerald-950">{c.mosqueName} <span className="text-xs font-normal text-stone-500">({c.mosqueId})</span></p>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${c.status === 'open' ? 'bg-amber-100 text-amber-800' : c.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
                          {c.status === 'open' ? 'খোলা' : c.status === 'resolved' ? 'সমাধান হয়েছে' : 'প্রত্যাখ্যাত'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm"><span className="font-semibold">ক্ষেত্র:</span> {c.field}</p>
                      <p className="text-sm"><span className="font-semibold">সঠিক তথ্য:</span> {c.correctedValue}</p>
                      <p className="text-sm text-stone-500">আবেদনকারী: {c.reporterName} · {c.createdAt}</p>
                      {c.status === 'open' && (
                        <div className="mt-3 flex gap-2">
                          <button onClick={() => applyCorrection(c)} className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-bold text-white">প্রয়োগ করুন</button>
                          <button onClick={() => resolveCorrection(c, 'rejected')} className="rounded-full border border-red-200 px-4 py-2 text-sm font-bold text-red-600">প্রত্যাখ্যান</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'logs' && (
            <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-bold text-emerald-950">অ্যাক্টিভিটি লগ</h2>
              {logs.length === 0 ? (
                <EmptyState title="এখনো কোনো লগ নেই" />
              ) : (
                <div className="space-y-2">
                  {logs.slice(0, 50).map((l) => (
                    <div key={l.id} className="rounded-xl bg-stone-50 px-4 py-3 text-sm">
                      <p className="font-semibold text-emerald-950">{l.action} — {l.target}</p>
                      <p className="text-stone-600">{l.detail}</p>
                      <p className="text-xs text-stone-400">{l.actor} · {new Date(l.at).toLocaleString('bn-BD')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'settings' && (
            <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-bold text-emerald-950">সেটিংস</h2>
              <div className="space-y-4 text-sm leading-relaxed text-stone-600">
                <p><span className="font-bold text-emerald-950">অ্যাডমিন পাসওয়ার্ড পরিবর্তন:</span> বর্তমান পাসওয়ার্ডটি মুছে নতুন পাসওয়ার্ড সেট করতে নিচের বোতামটি চাপুন। পরের বার লগইনে নতুন পাসওয়ার্ড তৈরি করতে হবে।</p>
                <button
                  onClick={() => { changeAdminPassword(); setAuthed(false); setIsSetup(false); }}
                  className="rounded-full border-2 border-amber-500 px-5 py-2.5 font-bold text-amber-700 hover:bg-amber-50"
                >
                  পাসওয়ার্ড রিসেট করুন
                </button>
                <p><span className="font-bold text-emerald-950">ব্যাকএন্ড:</span> Google Apps Script ব্যাকএন্ড সংযুক্ত করতে backend/SETUP_GUIDE.md অনুসরণ করুন। সংযুক্ত হলে নিবন্ধন, অনুমোদন ও ছবি Google Sheets ও Drive-এ সংরক্ষিত হবে।</p>
                <p><span className="font-bold text-emerald-950">ডেমো ডেটা:</span> বর্তমান ডেটা এই ব্রাউজারের localStorage-এ আছে। ব্যাকএন্ড সংযুক্ত না হওয়া পর্যন্ত এটি ডেমো মোড।</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-emerald-950">
              <Pencil className="h-5 w-5" /> মসজিদ সম্পাদনা — {editing.id}
            </h2>
            <div className="space-y-3">
              <label className="block text-sm font-bold text-emerald-950">মসজিদের নাম
                <input value={editForm.nameBn} onChange={(e) => setEditForm({ ...editForm, nameBn: e.target.value })} className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2.5" />
              </label>
              <label className="block text-sm font-bold text-emerald-950">বর্তমান ইমামের নাম
                <input value={editForm.imamName} onChange={(e) => setEditForm({ ...editForm, imamName: e.target.value })} className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2.5" />
              </label>
              <label className="block text-sm font-bold text-emerald-950">গ্রাম / মহল্লা
                <input value={editForm.village} onChange={(e) => setEditForm({ ...editForm, village: e.target.value })} className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2.5" />
              </label>
              <label className="block text-sm font-bold text-emerald-950">ঠিকানা
                <textarea value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} rows={2} className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2.5" />
              </label>
              <label className="block text-sm font-bold text-emerald-950">বিবরণ
                <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2.5" />
              </label>
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={saveEdit} className="flex-1 rounded-full bg-emerald-700 py-3 font-bold text-white">সংরক্ষণ করুন</button>
              <button onClick={() => setEditing(null)} className="rounded-full border-2 border-stone-300 px-6 py-3 font-bold text-stone-600">বাতিল</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MosqueAdminTable({
  mosques,
  onApprove,
  onReject,
  onArchive,
  onToggle,
  onEdit,
  onDelete,
}: {
  mosques: Mosque[];
  onApprove: (m: Mosque) => void;
  onReject: (m: Mosque) => void;
  onArchive: (m: Mosque) => void;
  onToggle: (m: Mosque, field: 'verified' | 'featured') => void;
  onEdit: (m: Mosque) => void;
  onDelete: (m: Mosque) => void;
}) {
  if (mosques.length === 0) {
    return <EmptyState title="এই তালিকায় কোনো মসজিদ নেই" hint="নতুন নিবন্ধন এলে এখানে দেখা যাবে।" />;
  }
  return (
    <div className="space-y-3">
      {mosques.map((m) => (
        <div key={m.id} className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex gap-3">
              <img src={m.images[0]} alt={m.nameBn} className="h-16 w-16 rounded-xl object-cover" />
              <div>
                <p className="font-bold text-emerald-950">{m.nameBn} <span className="text-xs font-normal text-stone-500">({m.id})</span></p>
                <p className="text-sm text-stone-600">ইমাম: {m.imamName}</p>
                <p className="text-xs text-stone-500">{m.village}, {m.upazila}, {m.district} · জমা: {m.createdAt}</p>
                <p className="text-xs text-stone-500">জমাদানকারী: {m.submittedBy}</p>
              </div>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${m.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : m.status === 'pending' ? 'bg-amber-100 text-amber-800' : m.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-stone-200 text-stone-600'}`}>
              {m.status === 'approved' ? 'অনুমোদিত' : m.status === 'pending' ? 'অপেক্ষমাণ' : m.status === 'rejected' ? 'প্রত্যাখ্যাত' : 'আর্কাইভ'}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {m.status === 'pending' && (
              <>
                <button onClick={() => onApprove(m)} className="flex items-center gap-1 rounded-full bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white"><CheckCircle2 className="h-3.5 w-3.5" /> অনুমোদন</button>
                <button onClick={() => onReject(m)} className="flex items-center gap-1 rounded-full bg-red-600 px-3.5 py-2 text-xs font-bold text-white"><XCircle className="h-3.5 w-3.5" /> প্রত্যাখ্যান</button>
              </>
            )}
            {m.status === 'approved' && (
              <button onClick={() => onArchive(m)} className="flex items-center gap-1 rounded-full bg-stone-600 px-3.5 py-2 text-xs font-bold text-white"><Archive className="h-3.5 w-3.5" /> আর্কাইভ</button>
            )}
            <button onClick={() => onToggle(m, 'verified')} className={`flex items-center gap-1 rounded-full px-3.5 py-2 text-xs font-bold ${m.verified ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'}`}>
              <ShieldCheck className="h-3.5 w-3.5" /> {m.verified ? 'যাচাইকৃত ✓' : 'যাচাই করুন'}
            </button>
            <button onClick={() => onToggle(m, 'featured')} className={`flex items-center gap-1 rounded-full px-3.5 py-2 text-xs font-bold ${m.featured ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-600'}`}>
              <Star className="h-3.5 w-3.5" /> {m.featured ? 'বিশেষ ✓' : 'বিশেষ করুন'}
            </button>
            <button onClick={() => onEdit(m)} className="flex items-center gap-1 rounded-full bg-blue-100 px-3.5 py-2 text-xs font-bold text-blue-800"><Pencil className="h-3.5 w-3.5" /> সম্পাদনা</button>
            <a href={`#/mosque/${m.slug}-${m.id.toLowerCase()}`} className="flex items-center gap-1 rounded-full bg-stone-100 px-3.5 py-2 text-xs font-bold text-stone-700"><Eye className="h-3.5 w-3.5" /> দেখুন</a>
            <button onClick={() => onDelete(m)} className="flex items-center gap-1 rounded-full bg-red-50 px-3.5 py-2 text-xs font-bold text-red-600"><Trash2 className="h-3.5 w-3.5" /> মুছুন</button>
          </div>
        </div>
      ))}
    </div>
  );
}
