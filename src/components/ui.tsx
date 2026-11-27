import { useEffect, useRef, useState } from 'react';
import { Landmark, Menu, X, Search, ShieldCheck, MapPin, User, Eye } from 'lucide-react';
import type { Mosque } from '../lib/types';
import { profilePath } from '../lib/types';
import { IMAM_UNVERIFIED } from '../lib/types';

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <a href="#/" className="flex items-center gap-2.5 shrink-0">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-amber-300 shadow-md">
        <Landmark className="h-6 w-6" />
      </span>
      <span className="leading-tight">
        <span className={`block text-xl font-bold ${light ? 'text-white' : 'text-emerald-900'}`}>
          আমার মসজিদ
        </span>
        <span className={`block text-[11px] font-semibold tracking-widest uppercase ${light ? 'text-amber-300' : 'text-amber-600'}`}>
          Amar Masjid
        </span>
      </span>
    </a>
  );
}

const NAV_LINKS = [
  { href: '#/', label: 'হোম' },
  { href: '#/mosques', label: 'সকল মসজিদ' },
  { href: '#/search', label: 'খুঁজুন' },
  { href: '#/register', label: 'মসজিদ নিবন্ধন' },
  { href: '#/admin', label: 'অ্যাডমিন' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <header
      className={`sticky top-0 z-50 border-b bg-white/95 backdrop-blur transition-shadow ${
        scrolled ? 'shadow-md' : 'border-emerald-100'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-4 py-2 text-[15px] font-medium text-emerald-950/80 transition hover:bg-emerald-50 hover:text-emerald-800"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <a
            href="#/search"
            className="flex items-center gap-1.5 rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
          >
            <Search className="h-4 w-4" /> মসজিদ খুঁজুন
          </a>
          <a
            href="#/register"
            className="rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-emerald-800"
          >
            + মসজিদ নিবন্ধন করুন
          </a>
        </div>
        <button
          className="rounded-lg p-2 text-emerald-900 hover:bg-emerald-50 lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label="মেনু"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <nav className="border-t border-emerald-100 bg-white px-4 py-3 lg:hidden">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 font-medium text-emerald-950 hover:bg-emerald-50"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#/register"
            onClick={() => setOpen(false)}
            className="mt-2 block rounded-xl bg-emerald-700 px-4 py-3 text-center font-bold text-white"
          >
            + মসজিদ নিবন্ধন করুন
          </a>
        </nav>
      )}
    </header>
  );
}

export function MosqueCard({ mosque }: { mosque: Mosque }) {
  return (
    <a
      href={profilePath(mosque)}
      className="card-hover group flex flex-col overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={mosque.images[0]}
          alt={mosque.nameBn}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-emerald-700/95 px-3 py-1 text-xs font-bold text-white">
          {mosque.id}
        </span>
        {mosque.verified && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5" /> যাচাইকৃত
          </span>
        )}
        {mosque.representativePhoto && (
          <span className="absolute bottom-2.5 left-3 rounded bg-black/55 px-2 py-0.5 text-[11px] text-white/90">
            প্রতিনিধিত্বমূলক ছবি
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-lg font-bold leading-snug text-emerald-950 group-hover:text-emerald-700">
          {mosque.nameBn}
        </h3>
        {mosque.nameEn && <p className="text-xs font-medium text-stone-500">{mosque.nameEn}</p>}
        <p className="flex items-center gap-1.5 text-sm text-stone-700">
          <User className="h-4 w-4 shrink-0 text-amber-600" />
          <span className="font-semibold">ইমাম:</span>
          <span className={mosque.imamName === IMAM_UNVERIFIED ? 'italic text-stone-500' : ''}>
            {mosque.imamName}
          </span>
        </p>
        <p className="flex items-start gap-1.5 text-sm text-stone-600">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          {mosque.village}
          {mosque.unionName ? `, ${mosque.unionName}` : ''} · {mosque.upazila} · {mosque.district}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-xs font-semibold text-stone-500">
            {mosque.division} বিভাগ · {mosque.status === 'approved' ? 'অনুমোদিত' : mosque.status}
          </span>
          <span className="rounded-full bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white transition group-hover:bg-emerald-800">
            বিস্তারিত দেখুন
          </span>
        </div>
      </div>
    </a>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto mb-8 max-w-2xl text-center">
      {eyebrow && (
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-600">{eyebrow}</p>
      )}
      <h2 className="text-2xl font-bold text-emerald-950 sm:text-3xl">{title}</h2>
      {subtitle && <p className="mt-2 text-[15px] leading-relaxed text-stone-600">{subtitle}</p>}
      <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-emerald-600 via-amber-400 to-emerald-600" />
    </div>
  );
}

export function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('revealed')),
      { threshold: 0.08 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-emerald-950 text-emerald-100">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo light />
          <p className="mt-4 max-w-md text-sm leading-relaxed text-emerald-200/90">
            আমাদের মসজিদ, আমাদের পরিচয়। বাংলাদেশের প্রতিটি মসজিদের পরিচিতি, ছবি ও ইতিহাস
            সংরক্ষণ করাই আমার মসজিদের লক্ষ্য।
          </p>
        </div>
        <div>
          <h4 className="mb-3 font-bold text-white">দ্রুত লিংক</h4>
          <ul className="space-y-2 text-sm">
            <li><a className="hover:text-amber-300" href="#/mosques">সকল মসজিদ</a></li>
            <li><a className="hover:text-amber-300" href="#/search">মসজিদ খুঁজুন</a></li>
            <li><a className="hover:text-amber-300" href="#/register">মসজিদ নিবন্ধন</a></li>
            <li><a className="hover:text-amber-300" href="#/admin">অ্যাডমিন ড্যাশবোর্ড</a></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-bold text-white">গুরুত্বপূর্ণ তথ্য</h4>
          <ul className="space-y-2 text-sm text-emerald-200/90">
            <li>নিবন্ধন সম্পূর্ণ বিনামূল্যে</li>
            <li>অ্যাডমিন যাচাইয়ের পর মসজিদ প্রকাশিত হয়</li>
            <li>ভুল তথ্য রিপোর্ট করা যায়</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-emerald-900 py-4 text-center text-xs text-emerald-300/80">
        © ২০২৬ আমার মসজিদ (Amar Masjid) — বাংলাদেশের প্রতিটি মসজিদ, এক ঠিকানায়।
      </div>
    </footer>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-emerald-200 bg-white px-6 py-12 text-center">
      <Eye className="mx-auto mb-3 h-8 w-8 text-emerald-300" />
      <p className="font-bold text-emerald-950">{title}</p>
      {hint && <p className="mt-1 text-sm text-stone-500">{hint}</p>}
    </div>
  );
}
