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
