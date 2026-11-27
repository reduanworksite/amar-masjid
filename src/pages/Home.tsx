import { useMemo, useState } from 'react';
import {
  MapPin,
  ShieldCheck,
  Landmark,
  Users,
  Search,
  ClipboardCheck,
  CheckCircle2,
  Globe,
  ArrowRight,
  Star,
  Image as ImageIcon,
} from 'lucide-react';

import { loadMosques } from '../lib/store';
import { DIVISIONS } from '../data/locations';
import { GALLERY_IMAGES, IMG } from '../data/seedMosques';
import { countByDistrict, countByDivision } from '../lib/search';
import { MosqueCard, Reveal, SectionHeading } from '../components/ui';
import { SearchBox } from '../components/SearchBox';

const STEPS = [
  {
    icon: ClipboardCheck,
    title: '১. মসজিদ নিবন্ধন করুন',
    text: 'আপনার মসজিদের নাম, বর্তমান ইমামের নাম, ছবি ও ঠিকানা দিয়ে ফরমটি পূরণ করুন।',
  },
  {
    icon: Search,
    title: '২. অ্যাডমিন যাচাই করবেন',
    text: 'আমাদের অ্যাডমিন তথ্য যাচাই করে অনুমোদন দেবেন। ভুল তথ্য থাকলে সংশোধনের অনুরোধ করা যায়।',
  },
  {
    icon: CheckCircle2,
    title: '৩. অনুমোদন ও প্রকাশ',
    text: 'অনুমোদনের পর মসজিদটি হোমপেজ, ডিরেক্টরি ও সার্চে দেখা যাবে এবং নিজস্ব প্রোফাইল পাতা তৈরি হবে।',
  },
  {
    icon: Globe,
    title: '৪. সবাই খুঁজে পাবে',
    text: 'যেকোনো মানুষ মসজিদের নাম, ইমামের নাম, জেলা বা গ্রামের নাম দিয়ে মসজিদটি খুঁজে পাবে ও শেয়ার করতে পারবে।',
  },
];

export default function HomePage() {
  const all = useMemo(() => loadMosques(), []);
  const approved = useMemo(() => all.filter((m) => m.status === 'approved'), [all]);
  const recent = useMemo(
    () => [...approved].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3),
    [approved],
  );
  const featured = useMemo(() => approved.filter((m) => m.featured), [approved]);
  const byDivision = useMemo(() => countByDivision(approved), [approved]);
  const byDistrict = useMemo(() => countByDistrict(approved), [approved]);
  const upazilas = useMemo(() => {
    const set = new Map<string, { upazila: string; district: string; count: number }>();
    approved.forEach((m) => {
      const key = `${m.upazila}|${m.district}`;
      const cur = set.get(key);
      set.set(key, { upazila: m.upazila, district: m.district, count: (cur?.count ?? 0) + 1 });
    });
    return [...set.values()].sort((a, b) => b.count - a.count).slice(0, 12);
  }, [approved]);

  const [visible, setVisible] = useState(6);
  const shown = approved.slice(0, visible);

  const stats = [
    { icon: Landmark, label: 'অনুমোদিত মসজিদ', value: approved.length },
    { icon: MapPin, label: 'জেলা', value: new Set(approved.map((m) => m.district)).size },
    { icon: Users, label: 'বিভাগ', value: new Set(approved.map((m) => m.division)).size },
    { icon: ShieldCheck, label: 'যাচাইকৃত মসজিদ', value: approved.filter((m) => m.verified).length },
  ];

  return (
    <div>
      <section className="pattern-arch relative overflow-hidden bg-emerald-950 text-white">
        <img
          src={IMG.hero}
          alt="মসজিদ"
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/70 via-emerald-950/55 to-emerald-950" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-white/10 px-4 py-1.5 text-sm font-semibold text-amber-200">
              <Landmark className="h-4 w-4" /> বাংলাদেশ ডিজিটাল মসজিদ ডিরেক্টরি
            </p>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              বাংলাদেশের প্রতিটি মসজিদ,
              <span className="gold-text block">এক ঠিকানায়।</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-emerald-100/90 sm:text-lg">
              আপনার এলাকার মসজিদের পরিচিতি, ছবি ও ইতিহাস সংরক্ষণ করুন। খুঁজে নিন বাংলাদেশের
              যেকোনো এলাকার মসজিদ।
            </p>
            <div className="mx-auto mt-8 max-w-xl">
              <SearchBox mosques={approved} large />
              <p className="mt-3 text-xs text-emerald-200/80">
                মসজিদের নাম, ইমামের নাম, বিভাগ, জেলা, উপজেলা, ইউনিয়ন, গ্রাম বা মহল্লা দিয়ে খুঁজুন
              </p>
            </div>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#/register"
                className="rounded-full bg-amber-500 px-7 py-3.5 font-bold text-emerald-950 shadow-lg transition hover:bg-amber-400"
              >
                আপনার মসজিদ নিবন্ধন করুন
              </a>
              <a
                href="#/mosques"
                className="rounded-full border border-white/40 bg-white/10 px-7 py-3.5 font-bold text-white backdrop-blur transition hover:bg-white/20"
              >
                সব মসজিদ দেখুন
              </a>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl border border-white/15 bg-white/10 px-3 py-4 backdrop-blur">
                  <s.icon className="mx-auto mb-1.5 h-5 w-5 text-amber-300" />
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-emerald-100/80">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="search" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <Reveal>
          <SectionHeading
            eyebrow="স্মার্ট সার্চ"
            title="মসজিদ খুঁজুন"
            subtitle="মসজিদের নাম, বর্তমান ইমামের নাম, জেলা, উপজেলা, ইউনিয়ন, গ্রাম বা মহল্লা — যেকোনো তথ্য দিয়ে খুঁজুন। বাংলা ও ইংরেজি উভয় নামেই খোঁজা যায়।"
          />
          <div className="mx-auto max-w-2xl">
            <SearchBox mosques={approved} />
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {['ঢাকা', 'বাগেরহাট', 'চাঁপাইনবাবগঞ্জ', 'নওগাঁ', 'কিশোরগঞ্জ'].map((d) => (
              <a
                key={d}
                href={`#/search?district=${encodeURIComponent(d)}`}
                className="rounded-full border border-emerald-200 bg-white px-4 py-1.5 text-sm font-medium text-emerald-800 transition hover:bg-emerald-50"
              >
                {d}
              </a>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionHeading
              eyebrow="নতুন সংযোজন"
              title="সম্প্রতি যুক্ত মসজিদ"
              subtitle="সদ্য অনুমোদিত মসজিদগুলো এখানে দেখা যাবে।"
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map((m) => (
                <MosqueCard key={m.id} mosque={m} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section id="directory" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <Reveal>
          <SectionHeading
            eyebrow="ডিরেক্টরি"
            title="সকল মসজিদ"
            subtitle="অনুমোদিত সব মসজিদের তালিকা। নতুন মসজিদ অনুমোদিত হলে এই তালিকা স্বয়ংক্রিয়ভাবে আপডেট হবে।"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((m) => (
              <MosqueCard key={m.id} mosque={m} />
            ))}
          </div>
          <div className="mt-8 text-center">
            {visible < approved.length ? (
              <button
                onClick={() => setVisible((v) => v + 6)}
                className="rounded-full border-2 border-emerald-700 px-8 py-3 font-bold text-emerald-800 transition hover:bg-emerald-50"
              >
                আরও মসজিদ দেখুন ({approved.length - visible}টি বাকি)
              </button>
            ) : (
              <a
                href="#/mosques"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-8 py-3 font-bold text-white transition hover:bg-emerald-800"
              >
                সব মসজিদের পাতায় যান <ArrowRight className="h-4 w-4" />
              </a>
            )}
          </div>
        </Reveal>
      </section>

      <section className="bg-emerald-50/60 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionHeading eyebrow="অঞ্চল অনুযায়ী" title="বিভাগ অনুযায়ী ঘুরে দেখুন" />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {DIVISIONS.map((d) => {
                const c = byDivision.find((x) => x.division === d.name)?.count ?? 0;
                return (
                  <a
                    key={d.name}
                    href={`#/search?division=${encodeURIComponent(d.name)}`}
                    className="card-hover rounded-2xl border border-emerald-100 bg-white p-5 text-center shadow-sm"
                  >
                    <p className="text-xl font-bold text-emerald-900">{d.name}</p>
                    <p className="mt-1 text-sm text-stone-500">
                      {d.districts.length}টি জেলা · {c}টি মসজিদ
                    </p>
                  </a>
                );
              })}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <Reveal>
          <SectionHeading eyebrow="পরিসংখ্যান" title="জেলা অনুযায়ী মসজিদ" subtitle="কোন জেলায় কতটি অনুমোদিত মসজিদ রয়েছে।" />
          <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
            {byDistrict.length === 0 && <p className="p-6 text-center text-stone-500">এখনো কোনো মসজিদ যুক্ত হয়নি।</p>}
            {byDistrict.map((d, i) => (
              <a
                key={d.district}
                href={`#/search?district=${encodeURIComponent(d.district)}`}
                className={`flex items-center justify-between px-5 py-3.5 transition hover:bg-emerald-50 ${
                  i !== byDistrict.length - 1 ? 'border-b border-stone-100' : ''
                }`}
              >
                <span className="flex items-center gap-2 font-semibold text-emerald-950">
                  <MapPin className="h-4 w-4 text-emerald-600" /> {d.district}
                </span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-800">
                  {d.count}টি মসজিদ
                </span>
              </a>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionHeading eyebrow="অঞ্চল অনুযায়ী" title="উপজেলা অনুযায়ী ঘুরে দেখুন" />
            <div className="flex flex-wrap justify-center gap-2">
              {upazilas.map((u) => (
                <a
                  key={`${u.upazila}-${u.district}`}
                  href={`#/search?upazila=${encodeURIComponent(u.upazila)}`}
                  className="rounded-full border border-emerald-200 bg-emerald-50/60 px-4 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100"
                >
                  {u.upazila} <span className="text-stone-500">({u.district} · {u.count})</span>
                </a>
              ))}
              {upazilas.length === 0 && <p className="text-stone-500">এখনো কোনো উপজেলার তথ্য নেই।</p>}
            </div>
          </Reveal>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="pattern-arch bg-emerald-950 py-12 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <Reveal>
              <div className="mb-8 text-center">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-300">বিশেষ নির্বাচন</p>
                <h2 className="flex items-center justify-center gap-2 text-2xl font-bold sm:text-3xl">
                  <Star className="h-7 w-7 text-amber-400" /> বিশেষ মসজিদ
                </h2>
                <p className="mt-2 text-emerald-100/80">অ্যাডমিনের নির্বাচিত বিশেষ মসজিদসমূহ।</p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((m) => (
                  <MosqueCard key={m.id} mosque={m} />
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <Reveal>
          <SectionHeading
            eyebrow="গ্যালারি"
            title="মসজিদ গ্যালারি"
            subtitle="মসজিদের সুন্দর মুহূর্ত ও স্থাপত্যের ছবি। (ছবিগুলো প্রতিনিধিত্বমূলক — আসল ছবি নিবন্ধনের মাধ্যমে যুক্ত হয়।)"
          />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {GALLERY_IMAGES.map((g, i) => (
              <figure
                key={i}
                className={`group relative overflow-hidden rounded-2xl ${i % 4 === 0 ? 'row-span-2' : ''}`}
              >
                <img
                  src={g.src}
                  alt={g.caption}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-8 text-xs font-semibold text-white">
                  <ImageIcon className="mb-0.5 inline h-3 w-3" /> {g.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
        <Reveal>
          <div className="pattern-arch relative overflow-hidden rounded-3xl bg-emerald-700 px-6 py-12 text-center text-white shadow-xl sm:px-12">
            <Landmark className="mx-auto mb-4 h-12 w-12 text-amber-300" />
            <h2 className="text-2xl font-bold sm:text-3xl">আপনার মসজিদ নিবন্ধন করুন</h2>
            <p className="mx-auto mt-3 max-w-xl text-emerald-50/90">
              আপনার এলাকার মসজিদের নাম, বর্তমান ইমামের নাম, ছবি ও ঠিকানা দিয়ে নিবন্ধন করুন।
              যাচাইয়ের পর সারা দেশের মানুষ আপনার মসজিদটি খুঁজে পাবে।
            </p>
            <a
              href="#/register"
              className="mt-6 inline-block rounded-full bg-amber-500 px-8 py-3.5 font-bold text-emerald-950 shadow-lg transition hover:bg-amber-400"
            >
              নিবন্ধন ফরম পূরণ করুন →
            </a>
            <p className="mt-3 text-xs text-emerald-100/80">নিবন্ধন সম্পূর্ণ বিনামূল্যে · অ্যাডমিন অনুমোদনের পর প্রকাশিত হয়</p>
          </div>
        </Reveal>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionHeading eyebrow="প্রক্রিয়া" title="কীভাবে কাজ করে?" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s) => (
                <div key={s.title} className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
                  <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-700 text-white">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-bold text-emerald-950">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{s.text}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <Reveal>
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div className="overflow-hidden rounded-3xl shadow-lg">
              <img src={IMG.aerial} alt="মসজিদের আকাশছোঁয়া দৃশ্য" className="h-72 w-full object-cover lg:h-96" />
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-600">আমাদের সম্পর্কে</p>
              <h2 className="text-2xl font-bold text-emerald-950 sm:text-3xl">আমার মসজিদ সম্পর্কে</h2>
              <p className="mt-4 leading-relaxed text-stone-600">
                আমার মসজিদ বাংলাদেশের সকল জেলা, উপজেলা, থানা, ইউনিয়ন, গ্রাম ও মহল্লার মসজিদের
                একটি ডিজিটাল পরিচিতি ও তথ্যভান্ডার। যেকোনো এলাকার মানুষ নিজের মসজিদের নাম, ছবি,
                বর্তমান ইমামের নাম, অবস্থান ও অন্যান্য তথ্য দিয়ে নিবন্ধন করতে পারেন।
              </p>
              <p className="mt-3 leading-relaxed text-stone-600">
                তথ্য জমা দেওয়ার পর অ্যাডমিন যাচাই করে অনুমোদন দিলে মসজিদটি হোমপেজ ও ডিরেক্টরিতে
                দেখা যায় এবং প্রতিটি মসজিদের জন্য আলাদা একটি সুন্দর পাবলিক প্রোফাইল পাতা তৈরি হয়।
              </p>
              <p className="mt-4 text-lg font-bold text-emerald-800">“আমাদের মসজিদ, আমাদের পরিচয়।”</p>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
